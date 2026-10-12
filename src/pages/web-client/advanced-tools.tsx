import {
  AudioMutedOutlined,
  AudioOutlined,
  CloseOutlined,
  MinusOutlined,
  PhoneOutlined,
  SendOutlined,
} from '@ant-design/icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  appendChat,
  type ChatEntry,
  validChat,
} from '@/features/web-client/core/chat';
import { AudioPlayer } from '@/features/web-client/media/audio-player';
import { Microphone } from '@/features/web-client/media/microphone';
import {
  chooseRecording,
  type RecordingSink,
} from '@/features/web-client/media/recording-save';
import type {
  CodecPreference,
  VideoCapabilities,
  VideoFormat,
} from '@/features/web-client/media/video-codecs';
import { supportsTrueColor } from '@/features/web-client/media/video-codecs';
import type { hbb } from '@/features/web-client/protocol';
import type {
  CallState,
  SessionCommand,
  WorkerEvent,
} from '@/features/web-client/worker/contract';
import styles from './session-tools.less';
import { useToolWindow } from './use-tool-window';

type Text = (key: string, fallback: string) => string;
const EMPTY_CAPS: VideoCapabilities = {
  vp9: false,
  vp8: false,
  av1: false,
  vp9_444: false,
  av1_444: false,
};
export function useAdvancedTools(
  post: (command: SessionCommand, owner?: number) => void,
  identity: () => number,
  allowed: {
    recording(): boolean;
    audio(): boolean;
    connected(): boolean;
    display(): number;
  },
) {
  const send = useRef(post);
  send.current = post;
  const session = useRef(identity);
  session.current = identity;
  const gates = useRef(allowed);
  gates.current = allowed;
  const audioEpoch = useRef(0);
  const [capabilities, setCapabilities] = useState(EMPTY_CAPS);
  const [encoding, setEncoding] = useState<hbb.ISupportedEncoding>();
  const [format, setFormat] = useState<VideoFormat>();
  const [prefer, setPrefer] = useState<CodecPreference>('auto');
  const codecPreference = useRef<CodecPreference>('auto');
  const [trueColor, setTrueColor] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const chatVisible = useRef(false);
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [unread, setUnread] = useState(0);
  const [draft, setDraft] = useState('');
  const draftRevision = useRef(0);
  const chatOwner = useRef(0);
  const sentDraft = useRef({ revision: 0, text: '' });
  const [chatPending, setChatPending] = useState(false);
  const [chatError, setChatError] = useState(false);
  const chatId = useRef(0),
    request = useRef(0),
    chatRequest = useRef(0);
  const [callOpen, setCallOpen] = useState(false);
  const [callState, setCallState] = useState<CallState | 'preparing'>('idle');
  const currentCallState = useRef<CallState | 'preparing'>('idle');
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [microphoneMuted, setMicrophoneMuted] = useState(false);
  const microphone = useRef<Microphone | undefined>(undefined);
  const callPlayer = useRef<AudioPlayer | undefined>(undefined);
  const callEpoch = useRef(0);
  const callSession = useRef(0);
  const acquireTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const [recording, setRecording] = useState(false);
  const [recordPreparing, setRecordPreparing] = useState(false);
  const [recordPhase, setRecordPhase] = useState<
    'idle' | 'choosing' | 'recording' | 'stopping' | 'saving'
  >('idle');
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordNotice, setRecordNotice] = useState('');
  const recordEpoch = useRef(0);
  const record = useRef<
    | {
        epoch: number;
        identity: number;
        sink: RecordingSink;
        write?: Promise<void>;
        streaming: boolean;
        started: number;
        closing?: ReturnType<typeof setTimeout>;
        cancelled?: boolean;
      }
    | undefined
  >(undefined);
  const recordAcquiring = useRef(false);
  const recordFinalizing = useRef(false);
  const finalizingSink = useRef<RecordingSink | undefined>(undefined);
  const cancelFinalizing = useRef<(() => void) | undefined>(undefined);
  const recordStopRequested = useRef(false);
  const endCall = (state: CallState = 'ended') => {
    send.current({ type: 'call-stop', callGeneration: callEpoch.current });
    ++callEpoch.current;
    clearTimeout(acquireTimer.current);
    microphone.current?.dispose();
    microphone.current = undefined;
    callPlayer.current?.dispose();
    callPlayer.current = undefined;
    setMicrophoneMuted(false);
    currentCallState.current = state;
    setCallState(state);
  };
  const finishRecording = async (save: boolean, duration?: number) => {
    const active = record.current;
    if (!active) return false;
    record.current = undefined;
    clearTimeout(active.closing);
    recordFinalizing.current = true;
    finalizingSink.current = active.sink;
    cancelFinalizing.current = () => {
      active.cancelled = true;
    };
    setRecording(false);
    if (active.epoch === recordEpoch.current) {
      setRecordPreparing(true);
      setRecordPhase('saving');
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        (async () => {
          await active.write;
          if (active.cancelled) throw new Error('Recording cancelled');
          active.sink.duration(duration ?? performance.now() - active.started);
          if (save) await active.sink.close();
          else await active.sink.abort();
        })(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error('Recording write timeout')),
            5000,
          );
        }),
      ]);
      return true;
    } catch {
      active.cancelled = true;
      void active.sink.abort().catch(() => {});
      if (active.epoch === recordEpoch.current) setRecordNotice('recordFailed');
      return false;
    } finally {
      clearTimeout(timer);
      if (finalizingSink.current === active.sink) {
        recordFinalizing.current = false;
        finalizingSink.current = undefined;
        cancelFinalizing.current = undefined;
      }
      if (active.epoch === recordEpoch.current) {
        setRecordPreparing(false);
        setRecordPhase('idle');
      }
    }
  };
  const reset = (preserveRecording = true) => {
    endCall('idle');
    send.current({
      type: 'record-stop',
      recordingGeneration: recordEpoch.current,
    });
    ++recordEpoch.current;
    recordAcquiring.current = false;
    recordStopRequested.current = false;
    setRecordPreparing(false);
    setRecordPhase('idle');
    setRecordNotice('');
    setRecording(false);
    const closing = record.current;
    if (!preserveRecording) {
      cancelFinalizing.current?.();
      void finalizingSink.current?.abort().catch(() => {});
    }
    if (closing && !preserveRecording) {
      clearTimeout(closing.closing);
      closing.cancelled = true;
      record.current = undefined;
      void closing.sink.abort().catch(() => {});
    } else if (closing && !closing.closing)
      closing.closing = setTimeout(() => {
        if (record.current === closing) void finishRecording(false);
      }, 5000);
    setEntries([]);
    setUnread(0);
    setDraft('');
    ++draftRevision.current;
    setChatPending(false);
    setChatError(false);
    chatRequest.current = 0;
    setChatOpen(false);
    chatVisible.current = false;
    setCallOpen(false);
    setFormat(undefined);
    setEncoding(undefined);
    setPrefer('auto');
    codecPreference.current = 'auto';
    setTrueColor(false);
  };
  useEffect(() => () => reset(false), []);
  useEffect(() => {
    if (!recording) return;
    const start = performance.now();
    setRecordSeconds(0);
    const timer = setInterval(
      () => setRecordSeconds(Math.floor((performance.now() - start) / 1000)),
      1000,
    );
    return () => clearInterval(timer);
  }, [recording]);
  const openChat = () => {
    chatVisible.current = true;
    setChatOpen(true);
    setUnread(0);
  };
  const closeChat = () => {
    chatVisible.current = false;
    setChatOpen(false);
  };
  const sendChat = () => {
    if (chatRequest.current) return;
    if (!gates.current.connected() || !validChat(draft)) {
      setChatError(true);
      return;
    }
    chatRequest.current = ++request.current;
    chatOwner.current = session.current();
    sentDraft.current = { text: draft, revision: draftRevision.current };
    setChatPending(true);
    setChatError(false);
    send.current({ type: 'chat', text: draft, request: chatRequest.current });
  };
  const editDraft = (value: string) => {
    ++draftRevision.current;
    setDraft(value);
  };
  const startCall = async () => {
    if (
      microphone.current ||
      !voiceSupported ||
      !gates.current.audio() ||
      !gates.current.connected()
    )
      return;
    const epoch = ++callEpoch.current,
      active = session.current();
    callSession.current = active;
    currentCallState.current = 'preparing';
    setCallState('preparing');
    setCallOpen(true);
    const mic = new Microphone(
      (samples) => {
        if (epoch === callEpoch.current && active === session.current())
          send.current({ type: 'voice-pcm', samples, callGeneration: epoch });
      },
      () => {
        if (epoch === callEpoch.current) endCall('failed');
      },
    );
    microphone.current = mic;
    acquireTimer.current = setTimeout(() => {
      if (epoch === callEpoch.current) endCall('timeout');
    }, 30000);
    const audio = new AudioPlayer();
    callPlayer.current = audio;
    try {
      // 用户点击中启动 AudioContext 与麦克风请求，避免浏览器自动播放限制。
      const [, ok] = await Promise.all([audio.start(), mic.start()]);
      if (
        epoch !== callEpoch.current ||
        active !== session.current() ||
        !gates.current.audio() ||
        !gates.current.connected()
      ) {
        mic.dispose();
        audio.dispose();
        return;
      }
      clearTimeout(acquireTimer.current);
      if (!ok) throw new Error('Microphone unavailable');
      audio.volume(1);
      currentCallState.current = 'requesting';
      setCallState('requesting');
      send.current({
        type: 'call-start',
        timestamp: Date.now(),
        callGeneration: epoch,
      });
    } catch {
      if (epoch === callEpoch.current) endCall('failed');
      else {
        mic.dispose();
        audio.dispose();
      }
    }
  };
  const startRecord = async () => {
    if (
      record.current ||
      recordAcquiring.current ||
      recordFinalizing.current ||
      !gates.current.recording()
    )
      return;
    const epoch = ++recordEpoch.current,
      active = session.current();
    recordAcquiring.current = true;
    recordStopRequested.current = false;
    setRecordPreparing(true);
    setRecordPhase('choosing');
    setRecordNotice('');
    try {
      const selected = await chooseRecording();
      if (
        epoch !== recordEpoch.current ||
        active !== session.current() ||
        !gates.current.recording()
      ) {
        await selected.sink.abort();
        return;
      }
      record.current = {
        epoch,
        identity: active,
        started: performance.now(),
        ...selected,
      };
      setRecording(true);
      setRecordPhase('recording');
      setRecordNotice(selected.streaming ? '' : 'recordFallback');
      send.current({
        type: 'record-start',
        recordingGeneration: epoch,
        maxBytes: selected.maxBytes,
      });
    } catch {
      if (epoch === recordEpoch.current) {
        setRecordNotice('recordSaveCancelled');
        setRecordPhase('idle');
      }
    } finally {
      if (epoch === recordEpoch.current) {
        recordAcquiring.current = false;
        setRecordPreparing(false);
        if (!record.current) setRecordPhase('idle');
      }
    }
  };
  const stopRecord = () => {
    if (!record.current || recordStopRequested.current) return;
    recordStopRequested.current = true;
    setRecordPreparing(true);
    setRecordPhase('stopping');
    send.current({
      type: 'record-stop',
      recordingGeneration: recordEpoch.current,
    });
  };
  const cancelRecord = () => {
    send.current({
      type: 'record-stop',
      recordingGeneration: recordEpoch.current,
    });
    ++recordEpoch.current;
    recordAcquiring.current = false;
    recordStopRequested.current = false;
    const active = record.current;
    record.current = undefined;
    if (active) active.cancelled = true;
    clearTimeout(active?.closing);
    void active?.sink.abort().catch(() => {});
    cancelFinalizing.current?.();
    void finalizingSink.current?.abort().catch(() => {});
    finalizingSink.current = undefined;
    cancelFinalizing.current = undefined;
    recordFinalizing.current = false;
    setRecording(false);
    setRecordPreparing(false);
    setRecordPhase('idle');
    setRecordNotice('recordSaveCancelled');
  };
  const handle = (message: WorkerEvent): boolean => {
    if (message.type === 'ready') {
      setCapabilities(message.videoCapabilities || EMPTY_CAPS);
      setVoiceSupported(
        !!message.voiceEncoder &&
          !!message.audioDecoder &&
          !!navigator.mediaDevices?.getUserMedia &&
          typeof AudioWorkletNode !== 'undefined',
      );
      return false;
    }
    if (message.type === 'video-format') {
      if (message.displayGeneration === gates.current.display())
        setFormat(message.format);
      return true;
    }
    if (message.type === 'encoding') {
      setEncoding(message.encoding);
      const current = codecPreference.current;
      const next =
        (current === 'av1' && !message.encoding.av1) ||
        (current === 'vp8' && !message.encoding.vp8)
          ? 'auto'
          : current;
      codecPreference.current = next;
      setPrefer(next);
      setTrueColor(
        (value) =>
          value && supportsTrueColor(capabilities, next, message.encoding),
      );
      return true;
    }
    if (message.type === 'chat') {
      if (message.generation !== session.current()) return true;
      if (!message.incoming && message.request !== chatRequest.current)
        return true;
      if (!message.incoming) {
        if (chatOwner.current !== session.current()) return true;
        chatRequest.current = 0;
        setChatPending(false);
        const ok = !!message.ok && message.text === sentDraft.current.text;
        setChatError(!ok);
        if (!ok) return true;
        if (draftRevision.current === sentDraft.current.revision)
          setDraft((current) =>
            current === sentDraft.current.text ? '' : current,
          );
      }
      if (!validChat(message.text)) return true;
      setEntries((previous) =>
        appendChat(previous, {
          id: ++chatId.current,
          text: message.text,
          incoming: message.incoming,
          time: Date.now(),
        }),
      );
      if (message.incoming && !chatVisible.current)
        setUnread((value) => Math.min(99, value + 1));
      return true;
    }
    if (message.type === 'call-state') {
      if (
        message.callGeneration !== callEpoch.current ||
        callSession.current !== session.current()
      )
        return true;
      if (message.state === 'active') {
        if (!gates.current.audio() || !gates.current.connected()) {
          endCall('failed');
          return true;
        }
        currentCallState.current = 'active';
        setCallState('active');
        microphone.current?.enable(true);
      } else if (message.state === 'requesting') {
        currentCallState.current = 'requesting';
        setCallState('requesting');
      } else endCall(message.state);
      return true;
    }
    if (message.type === 'voice-consumed') {
      if (message.callGeneration === callEpoch.current)
        microphone.current?.consumed();
      return true;
    }
    if (message.type === 'audio-reset') {
      audioEpoch.current = message.audioGeneration;
      callPlayer.current?.clear();
      return false;
    }
    if (message.type === 'audio-frame') {
      if (callPlayer.current && currentCallState.current === 'active') {
        try {
          if (
            message.audioGeneration === audioEpoch.current &&
            gates.current.audio()
          )
            callPlayer.current.play(message.pcm);
        } catch {
          endCall('failed');
        } finally {
          send.current({
            type: 'audio-rendered',
            audioGeneration: message.audioGeneration,
          });
        }
        return true;
      }
      return false;
    }
    if (message.type === 'record-chunk') {
      const active = record.current;
      if (
        !active ||
        active.epoch !== message.recordingGeneration ||
        active.identity !== message.generation
      )
        return true;
      if (active.write) {
        send.current(
          {
            type: 'record-consumed',
            recordingGeneration: active.epoch,
            sequence: message.sequence,
            ok: false,
          },
          active.identity,
        );
        return true;
      }
      const write = active.sink.write(message.bytes);
      active.write = write;
      void write
        .then(() => {
          if (active.write === write) active.write = undefined;
          if (record.current === active)
            send.current(
              {
                type: 'record-consumed',
                recordingGeneration: active.epoch,
                sequence: message.sequence,
                ok: true,
              },
              active.identity,
            );
        })
        .catch(() => {
          if (record.current === active) {
            send.current(
              {
                type: 'record-consumed',
                recordingGeneration: active.epoch,
                sequence: message.sequence,
                ok: false,
              },
              active.identity,
            );
            void finishRecording(false);
            setRecordNotice('recordFailed');
          }
        })
        .finally(() => {
          message.bytes.fill(0);
          if (active.write === write) active.write = undefined;
        });
      return true;
    }
    if (message.type === 'record-done') {
      const active = record.current;
      if (
        !active ||
        message.recordingGeneration !== active.epoch ||
        message.generation !== active.identity
      )
        return true;
      const hasVideo =
        Number.isFinite(message.duration) && message.duration > 0;
      const notice =
        !hasVideo &&
        ['user', 'changed', 'limit', 'disconnected'].includes(message.reason)
          ? 'recordSaveCancelled'
          : message.reason === 'user'
            ? 'recordSaved'
            : message.reason === 'changed'
              ? 'recordChanged'
              : message.reason === 'limit'
                ? 'recordLimit'
                : message.reason === 'denied'
                  ? 'recordDenied'
                  : message.reason === 'failed'
                    ? 'recordFailed'
                    : 'recordSaved';
      if (active.epoch === recordEpoch.current) setRecordNotice('recordSaving');
      void finishRecording(
        message.reason !== 'failed' && hasVideo,
        message.duration,
      ).then((ok) => {
        if (active.epoch === recordEpoch.current)
          setRecordNotice(ok ? notice : 'recordFailed');
      });
      return true;
    }
    return false;
  };
  const updateCodec = (next: CodecPreference, color: boolean) => {
    const enabled = color && supportsTrueColor(capabilities, next, encoding);
    codecPreference.current = next;
    setPrefer(next);
    setTrueColor(enabled);
    send.current({ type: 'codec', prefer: next, trueColor: enabled });
  };
  const muteMicrophone = () => {
    const value = !microphoneMuted;
    setMicrophoneMuted(value);
    microphone.current?.mute(value);
  };
  return {
    capabilities,
    encoding,
    format,
    prefer,
    trueColor,
    updateCodec,
    chatOpen,
    openChat,
    closeChat,
    entries,
    unread,
    draft,
    setDraft: editDraft,
    sendChat,
    chatError,
    chatPending,
    callOpen,
    setCallOpen,
    callState,
    voiceSupported,
    startCall,
    endCall: () => endCall(),
    microphoneMuted,
    muteMicrophone,
    recording,
    recordPreparing,
    recordPhase,
    recordSeconds,
    recordNotice,
    startRecord,
    stopRecord,
    cancelRecord,
    handle,
    reset,
  };
}
export type AdvancedTools = ReturnType<typeof useAdvancedTools>;
export function AdvancedDialogs({
  tools,
  connected,
  audioAllowed,
  text,
  onClose,
}: {
  tools: AdvancedTools;
  connected: boolean;
  audioAllowed: boolean;
  text: Text;
  onClose?: (tool: 'chat' | 'call', ownedFocus: boolean) => void;
}) {
  const list = useRef<HTMLDivElement>(null),
    editor = useRef<HTMLTextAreaElement>(null);
  const chatWindow = useToolWindow(
    tools.chatOpen,
    { width: 540, height: 520 },
    { width: 340, height: 360 },
    true,
  );
  const callWindow = useToolWindow(
    tools.callOpen,
    { width: 350, height: 300 },
    { width: 300, height: 274 },
  );
  const nearBottom = useRef(true);
  const lastEntry = useRef<number | undefined>(undefined);
  const [newMessages, setNewMessages] = useState(false);
  const scrollToLatest = () => {
    if (list.current) list.current.scrollTop = list.current.scrollHeight;
    nearBottom.current = true;
    setNewMessages(false);
  };
  useEffect(() => {
    if (tools.chatOpen) {
      editor.current?.focus({ preventScroll: true });
      scrollToLatest();
    }
  }, [tools.chatOpen]);
  useEffect(() => {
    const next = tools.entries[tools.entries.length - 1]?.id;
    if (tools.chatOpen && next !== lastEntry.current) {
      if (nearBottom.current) scrollToLatest();
      else setNewMessages(true);
    }
    lastEntry.current = next;
  }, [tools.entries, tools.chatOpen]);
  useEffect(() => {
    if (tools.callOpen)
      callWindow.panel.current
        ?.querySelector<HTMLButtonElement>('button')
        ?.focus({ preventScroll: true });
  }, [tools.callOpen]);
  const close = (tool: 'chat' | 'call') => {
    const panel =
      tool === 'chat' ? chatWindow.panel.current : callWindow.panel.current;
    const ownedFocus = !!panel?.contains(document.activeElement);
    if (tool === 'chat') tools.closeChat();
    else tools.setCallOpen(false);
    onClose?.(tool, ownedFocus);
  };
  const handles = (
    window: ReturnType<typeof useToolWindow>,
    name: 'chat' | 'call',
  ) =>
    (['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] as const).map((edge) => (
      <button
        key={edge}
        type="button"
        className={styles.toolResize}
        data-tool-resize={edge}
        tabIndex={edge === 'se' ? 0 : -1}
        aria-label={text(
          name === 'chat' ? 'chatResize' : 'callResize',
          name === 'chat' ? 'Resize chat window' : 'Resize call window',
        )}
        {...window.control(edge)}
      />
    ));
  const callBusy = ['preparing', 'requesting', 'active'].includes(
    tools.callState,
  );
  return (
    <>
      <section
        ref={chatWindow.panel}
        style={chatWindow.style}
        {...chatWindow.events}
        className={`${styles.toolDialog} ${styles.chatDialog}`}
        hidden={!tools.chatOpen}
        role="dialog"
        aria-modal="false"
        aria-label={text('chat', 'Chat')}
        data-chat-dialog
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Escape' && !e.nativeEvent.isComposing) {
            e.preventDefault();
            close('chat');
          }
        }}
      >
        <header>
          <button
            type="button"
            className={styles.toolDrag}
            aria-label={text('chatMove', 'Move chat window')}
            {...chatWindow.control()}
          >
            <strong>{text('chat', 'Chat')}</strong>
          </button>
          <button
            type="button"
            onClick={() => close('chat')}
            aria-label={text('close', 'Close')}
          >
            <CloseOutlined />
          </button>
        </header>
        <div
          className={styles.chatMessages}
          ref={list}
          role="log"
          aria-live="polite"
          onScroll={() => {
            const panel = list.current;
            if (!panel) return;
            nearBottom.current =
              panel.scrollHeight - panel.scrollTop - panel.clientHeight <= 48;
            if (nearBottom.current) setNewMessages(false);
          }}
        >
          {tools.entries.length === 0 && (
            <p className={styles.toolHelp}>
              {text('chatEmpty', 'Send a message to the remote user.')}
            </p>
          )}
          {tools.entries.map((entry) => (
            <div
              key={entry.id}
              className={
                entry.incoming ? styles.chatIncoming : styles.chatOutgoing
              }
            >
              <small>
                {text(
                  entry.incoming ? 'chatRemote' : 'chatYou',
                  entry.incoming ? 'Remote user' : 'You',
                )}{' '}
                <time>
                  {new Date(entry.time).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
              </small>
              <p>{entry.text}</p>
            </div>
          ))}
        </div>
        {newMessages && (
          <button
            type="button"
            className={styles.chatNewMessages}
            onClick={scrollToLatest}
          >
            {text('chatNewMessages', 'New messages')}
          </button>
        )}
        <footer className={styles.chatEditor}>
          <textarea
            ref={editor}
            value={tools.draft}
            maxLength={4096}
            rows={2}
            aria-label={text('chatMessage', 'Message')}
            placeholder={text('chatMessage', 'Message')}
            onChange={(e) => tools.setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === 'Enter' &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault();
                tools.sendChat();
              }
            }}
          />
          <button
            type="button"
            aria-label={text(
              tools.chatPending ? 'chatSending' : 'chatSend',
              tools.chatPending ? 'Sending…' : 'Send',
            )}
            disabled={
              !connected || tools.chatPending || !validChat(tools.draft)
            }
            onClick={tools.sendChat}
          >
            <SendOutlined />
            {text(
              tools.chatPending ? 'chatSending' : 'chatSend',
              tools.chatPending ? 'Sending…' : 'Send',
            )}
          </button>
        </footer>
        {tools.chatError && (
          <p className={styles.toolHelp} role="status">
            {text(
              'chatFailed',
              'Message not sent. Keep it within 4 KiB and try again.',
            )}
          </p>
        )}
        {handles(chatWindow, 'chat')}
      </section>
      <section
        ref={callWindow.panel}
        style={callWindow.style}
        {...callWindow.events}
        className={`${styles.toolDialog} ${styles.callDialog}`}
        hidden={!tools.callOpen}
        role="dialog"
        aria-modal="false"
        aria-label={text('voiceCall', 'Voice call')}
        data-call-dialog
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Escape' && !e.nativeEvent.isComposing) {
            e.preventDefault();
            close('call');
          }
        }}
      >
        <header>
          <button
            type="button"
            className={styles.toolDrag}
            aria-label={text('callMove', 'Move call window')}
            {...callWindow.control()}
          >
            <strong>
              <PhoneOutlined /> {text('voiceCall', 'Voice call')}
            </strong>
          </button>
          <button
            type="button"
            onClick={() => close('call')}
            aria-label={text('callMinimize', 'Minimize call window')}
            title={text('callMinimizeHint', 'Minimize without ending the call')}
          >
            <MinusOutlined />
          </button>
        </header>
        <div className={styles.callContent}>
          <p role="status">
            {text(
              `call${tools.callState[0].toUpperCase()}${tools.callState.slice(1)}`,
              tools.callState,
            )}
          </p>
          {callBusy && (
            <p className={styles.toolHelp}>
              {text(
                tools.callState === 'preparing'
                  ? 'callMicrophonePreparing'
                  : tools.microphoneMuted
                    ? 'callMicrophoneMuted'
                    : 'callMicrophoneActive',
                tools.callState === 'preparing'
                  ? 'Waiting for microphone permission'
                  : tools.microphoneMuted
                    ? 'Microphone muted'
                    : 'Microphone in use',
              )}
            </p>
          )}
          {!tools.voiceSupported && (
            <p className={styles.toolHelp}>
              {text(
                'callUnsupported',
                'This browser cannot capture and encode Opus microphone audio.',
              )}
            </p>
          )}
          {!audioAllowed && (
            <p className={styles.toolHelp}>
              {text('audioDenied', 'Audio is disabled on the remote device.')}
            </p>
          )}
          <div className={styles.callActions}>
            {tools.callState === 'active' && (
              <button
                type="button"
                aria-pressed={tools.microphoneMuted}
                onClick={tools.muteMicrophone}
              >
                {tools.microphoneMuted ? (
                  <AudioMutedOutlined />
                ) : (
                  <AudioOutlined />
                )}
                {text(
                  tools.microphoneMuted ? 'callUnmute' : 'callMute',
                  tools.microphoneMuted ? 'Unmute' : 'Mute microphone',
                )}
              </button>
            )}
            {callBusy ? (
              <button
                type="button"
                className={styles.dangerAction}
                onClick={() => tools.endCall()}
              >
                {text(
                  tools.callState === 'active' ? 'callHangup' : 'callCancel',
                  tools.callState === 'active' ? 'End call' : 'Cancel call',
                )}
              </button>
            ) : (
              <button
                type="button"
                disabled={!connected || !audioAllowed || !tools.voiceSupported}
                onClick={() => void tools.startCall()}
              >
                <PhoneOutlined />
                {text('callStart', 'Call')}
              </button>
            )}
          </div>
        </div>
        {handles(callWindow, 'call')}
      </section>
    </>
  );
}
