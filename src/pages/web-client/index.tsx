import { PageContainer } from '@ant-design/pro-components';
import { useIntl, useLocation, useModel } from '@umijs/max';
import { Alert, Button, Input, Space, Spin, theme } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import {
  DesktopOutlined,
  CopyOutlined,
  SoundOutlined,
  ArrowRightOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import styles from './index.less';
import { AudioPlayer } from '@/features/web-client/media/audio-player';
import { MAX_TEXT_BYTES } from '@/features/web-client/clipboard/text';
import { IMAGE_LIMITS } from '@/features/web-client/clipboard/image';
import type { KxVersion } from '@/features/web-client/core/crypto';
import { normalizeTargetId } from '@/features/web-client/core/profile';
import type { SessionState } from '@/features/web-client/core/session';
import {
  type RemoteDisplay,
  RemoteInput,
} from '@/features/web-client/input/input';
import type {
  SessionCommand,
  WorkerEvent,
} from '@/features/web-client/worker/contract';
import { hbb } from '@/features/web-client/protocol';
import { createSessionWorker } from '@/features/web-client/worker/create-worker';
import { shutdownSessionWorker } from '@/features/web-client/worker/shutdown-worker';

import {
  RemoteTouch,
  type TouchMode,
  type Viewport,
} from '@/features/web-client/input/touch';
import { FilePanel, type FilePanelHandle, type FilePanelStatus } from './files';
import { DevicePicker } from './devices';
import { SessionToolbar, FileDialog, type ToolName } from './toolbar';
import { LegacyEncryptionNotice } from './legacy-notice';
import {
  RemoteClipboardSync,
  writeRemoteClipboard,
} from '@/features/web-client/clipboard/remote-sync';

export default function WebClientPage() {
  const intl = useIntl();
  const { token } = theme.useToken();
  const text = (key: string, fallback: string) =>
    intl.formatMessage({ id: `webClient.${key}`, defaultMessage: fallback });
  const location = useLocation();
  const { configuration, loading, unavailable, reload } = useModel('webClient');
  const [tool, setTool] = useState<ToolName>();
  const [fileOpen, setFileOpen] = useState(false);
  const [peerVersion, setPeerVersion] = useState<string>();
  const [noticesOpen, setNoticesOpen] = useState(false);
  const noticesElement = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [fileStatus, setFileStatus] = useState<FilePanelStatus>({
    state: 'idle',
    legacy: false,
    error: '',
    busy: false,
  });
  const [id, setId] = useState(
    () => new URLSearchParams(location.search).get('id') || '',
  );
  const [state, setState] = useState<SessionState>('idle');
  const [kxVersion, setKxVersion] = useState<KxVersion>();
  const [audioSupported, setAudioSupported] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const player = useRef<AudioPlayer | undefined>(undefined);
  const audioEpoch = useRef(0);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [clipboardFallback, setClipboardFallback] = useState(false);
  const [pasteStatus, setPasteStatus] = useState('');
  const pasteEpoch = useRef(0);
  const readingPaste = useRef(false);
  const [display, setDisplay] = useState<RemoteDisplay>();
  const [permissions, setPermissions] = useState({
    keyboard: true,
    clipboard: true,
    audio: true,
    file: true,
  });
  const [displays, setDisplays] = useState<hbb.IDisplayInfo[]>([]);
  const [selectedDisplay, setSelectedDisplay] = useState(0);
  const [displayReady, setDisplayReady] = useState(false);
  const displayEpoch = useRef(0);
  const [touchMode, setTouchMode] = useState<TouchMode>('pointer');
  const [viewport, setViewport] = useState<Viewport>({ scale: 1, x: 0, y: 0 });
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;
  const [softKeyboard, setSoftKeyboard] = useState(false);
  const [softText, setSoftText] = useState('');
  const [heldModifiers, setHeldModifiers] = useState<hbb.ControlKey[]>([]);
  const modifierRef = useRef<hbb.ControlKey[]>([]);
  const touch = useRef<RemoteTouch | undefined>(undefined);
  const files = useRef<FilePanelHandle>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const pointer = useRef<HTMLDivElement>(null);
  const worker = useRef<Worker | undefined>(undefined);
  const generation = useRef(0);
  const post = (message: SessionCommand) =>
    worker.current?.postMessage({
      ...message,
      generation: generation.current,
      displayGeneration: displayEpoch.current,
    });
  const input = useRef<RemoteInput | undefined>(undefined);
  const connected = state === 'connected';
  const activeSession = !['idle', 'closed', 'failed'].includes(state);

  const clipboardEpoch = useRef(0);
  const clipboardContext = useRef({
    enabled: false,
    connected: false,
    allowed: false,
  });
  clipboardContext.current = {
    enabled: !!configuration?.enabled,
    connected,
    allowed: permissions.clipboard,
  };
  const clipboardSync = useRef<RemoteClipboardSync | undefined>(undefined);
  if (!clipboardSync.current)
    clipboardSync.current = new RemoteClipboardSync(
      () =>
        clipboardContext.current.enabled &&
        clipboardContext.current.connected &&
        clipboardContext.current.allowed &&
        !document.hidden &&
        document.hasFocus(),
      writeRemoteClipboard,
      setClipboardFallback,
    );
  const resetClipboard = () => {
    clipboardSync.current?.reset();
    post({
      type: 'clipboard-context',
      clipboardGeneration: ++clipboardEpoch.current,
    });
  };

  const cancelPaste = () => {
    ++pasteEpoch.current;
    readingPaste.current = false;
    setPasteStatus('');
    post({ type: 'cancel-paste' });
  };

  const stopAudio = () => {
    player.current?.dispose();
    player.current = undefined;
    setAudioEnabled(false);
  };
  const releaseModifiers = () => {
    for (const controlKey of modifierRef.current)
      post({ type: 'input', input: { keyEvent: { controlKey, down: false } } });
    modifierRef.current = [];
    setHeldModifiers([]);
  };
  const clearDisplay = () => {
    const element = canvas.current;
    if (element) {
      element.getContext('2d')?.clearRect(0, 0, element.width, element.height);
      element.style.cursor = 'default';
    }
    if (pointer.current) pointer.current.style.display = 'none';
  };
  const disconnect = () => {
    cancelPaste();
    stopAudio();
    files.current?.dispose();
    releaseModifiers();
    setSoftText('');
    setTool(undefined);
    setNoticesOpen(false);
    setSoftKeyboard(false);
    setFileOpen(false);
    clipboardContext.current.connected = false;
    resetClipboard();
    input.current?.release();
    ++generation.current;
    post({ type: 'disconnect' });
    setState('closed');
    setKxVersion(undefined);
    setDisplay(undefined);
    setDisplayReady(false);
    setDisplays([]);
    setPassword('');
    clearDisplay();
  };

  useEffect(() => {
    setId(new URLSearchParams(location.search).get('id') || '');
    disconnect();
  }, [location.search]);

  useEffect(() => {
    if (!configuration?.enabled) return;
    let active = true;
    let acceptsFrames = false;
    const cursors = new Map<string, string>();
    let geometry: RemoteDisplay | undefined;
    setReady(false);
    setError('');
    setState('idle');
    setKxVersion(undefined);
    const pending = new AbortController();
    let created: Worker | undefined;
    void createSessionWorker(pending.signal)
      .then((instance) => {
        if (!active) {
          instance.terminate();
          return;
        }
        created = instance;
        worker.current = instance;
        instance.onerror = () => {
          if (active) {
            clipboardContext.current.connected = false;
            stopAudio();
            files.current?.dispose();
            releaseModifiers();
            setSoftText('');
            setError('worker');
            setState('failed');
            setKxVersion(undefined);
            setReady(false);
            setPassword('');

            resetClipboard();
            ++generation.current;
            input.current?.dispose();
            input.current = undefined;
            instance.terminate();
            clearDisplay();
          }
        };
        instance.onmessage = (event: MessageEvent<WorkerEvent>) => {
          const message = event.data;
          if (
            !active ||
            (message.type !== 'ready' &&
              message.generation !== generation.current)
          ) {
            if (message.type === 'frame') message.frame.close();
            return;
          }
          if ('fileGeneration' in message) {
            files.current?.handle(message);
            return;
          }
          if (message.type === 'ready') {
            setAudioSupported(!!message.audioDecoder);
            setReady(message.secureContext && message.videoDecoder);
            if (!message.secureContext || !message.videoDecoder)
              setError('unsupported');
          } else if (message.type === 'state') {
            acceptsFrames = message.state === 'connected';
            clipboardContext.current.connected = message.state === 'connected';
            if (message.state !== 'connected') resetClipboard();
            setState(message.state);
            if (message.state === 'failed' || message.state === 'closed') {
              stopAudio();
              files.current?.dispose();
              releaseModifiers();
              setSoftText('');
              setKxVersion(undefined);
              setPassword('');

              resetClipboard();
              cursors.clear();
              clearDisplay();
            }
          } else if (message.type === 'paste-status') {
            setPasteStatus(
              message.status === 'cancelled' ? '' : message.status,
            );
          } else if (message.type === 'security') {
            setKxVersion(
              message.kxVersion === 0 || message.kxVersion === 1
                ? message.kxVersion
                : undefined,
            );
          } else if (message.type === 'error' || message.type === 'warning') {
            if (message.code === 'audio') stopAudio();
            setError(message.code);
          } else if (message.type === 'permissions') {
            clipboardContext.current.allowed = message.permissions.clipboard;
            setPermissions(message.permissions);
            if (!message.permissions.keyboard || !message.permissions.clipboard)
              cancelPaste();
            if (!message.permissions.keyboard) releaseModifiers();
            if (!message.permissions.audio) stopAudio();
            if (!message.permissions.clipboard) resetClipboard();
          } else if (message.type === 'peer') {
            setPeerVersion(message.peer.version || undefined);
            const remote =
              message.peer.displays?.[message.peer.currentDisplay || 0];
            if (!remote) return;
            geometry = {
              x: remote.x || 0,
              y: remote.y || 0,
              width: remote.width || 0,
              height: remote.height || 0,
            };
            setDisplay(geometry);
            setPassword('');
            setError('');
            setDisplays(message.peer.displays || []);
            setSelectedDisplay(message.peer.currentDisplay || 0);
            setDisplayReady(false);
          } else if (message.type === 'display') {
            releaseModifiers();
            displayEpoch.current = message.displayGeneration;
            setSelectedDisplay(message.display.display || 0);
            setDisplayReady(false);
            clearDisplay();
            const remote = message.display;
            if (!remote) return;
            geometry = {
              x: remote.x || 0,
              y: remote.y || 0,
              width: remote.width || 0,
              height: remote.height || 0,
            };
            setDisplay(geometry);
          } else if (message.type === 'audio-reset') {
            audioEpoch.current = message.audioGeneration;
            player.current?.clear();
          } else if (message.type === 'audio-frame') {
            try {
              if (
                acceptsFrames &&
                message.audioGeneration === audioEpoch.current
              )
                player.current?.play(message.pcm);
            } catch {
              stopAudio();
              post({ type: 'audio', enabled: false });
              setError('audio');
            } finally {
              post({
                type: 'audio-rendered',
                audioGeneration: message.audioGeneration,
              });
            }
          } else if (message.type === 'frame') {
            const frame: VideoFrame = message.frame;
            if (
              !acceptsFrames ||
              message.displayGeneration !== displayEpoch.current
            ) {
              frame.close();
              return;
            }
            setDisplayReady(true);
            try {
              const element = canvas.current;
              if (element) {
                if (element.width !== frame.displayWidth)
                  element.width = frame.displayWidth;
                if (element.height !== frame.displayHeight)
                  element.height = frame.displayHeight;
                element
                  .getContext('2d', { alpha: false })
                  ?.drawImage(frame, 0, 0);
              }
            } finally {
              frame.close();
              instance.postMessage({
                type: 'rendered',
                displayGeneration: message.displayGeneration,
                generation: message.generation,
              });
            }
          } else if (message.type === 'image') {
            if (message.clipboardGeneration === clipboardEpoch.current)
              clipboardSync.current?.receive({ bytes: message.bytes });
          } else if (message.type === 'clipboard') {
            if (message.clipboardGeneration === clipboardEpoch.current)
              clipboardSync.current?.receive({ text: message.text });
          } else if (message.type === 'cursor') {
            const cursor = message.cursor;
            const image = document.createElement('canvas');
            image.width = cursor.width || 0;
            image.height = cursor.height || 0;
            image
              .getContext('2d')
              ?.putImageData(
                new ImageData(
                  new Uint8ClampedArray(cursor.colors),
                  cursor.width || 0,
                  cursor.height || 0,
                ),
                0,
                0,
              );
            const css =
              'url(' +
              image.toDataURL() +
              ') ' +
              cursor.hotx +
              ' ' +
              cursor.hoty +
              ', default';
            const oldest = cursors.keys().next().value;
            if (cursors.size >= 32 && oldest !== undefined)
              cursors.delete(oldest);
            cursors.set(cursor.id, css);
            if (canvas.current) canvas.current.style.cursor = css;
          } else if (message.type === 'cursor-id') {
            if (canvas.current)
              canvas.current.style.cursor =
                cursors.get(message.id) || 'default';
          } else if (
            message.type === 'cursor-position' &&
            geometry &&
            canvas.current &&
            pointer.current
          ) {
            const x = ((message.position.x || 0) - geometry.x) / geometry.width;
            const y =
              ((message.position.y || 0) - geometry.y) / geometry.height;
            const marker = pointer.current;
            const element = canvas.current;
            marker.style.display =
              x >= 0 && x < 1 && y >= 0 && y < 1 ? 'block' : 'none';
            marker.style.left = `${
              element.offsetLeft + x * element.clientWidth
            }px`;
            marker.style.top = `${
              element.offsetTop + y * element.clientHeight
            }px`;
          }
        };
      })
      .catch(() => {
        if (active) {
          setError('worker');
          setState('failed');
        }
      });
    return () => {
      active = false;
      clipboardContext.current.connected = false;
      resetClipboard();
      setFileOpen(false);
      stopAudio();
      files.current?.dispose();
      releaseModifiers();
      setSoftText('');
      pending.abort();
      input.current?.dispose();
      input.current = undefined;
      ++generation.current;
      if (created) shutdownSessionWorker(created, generation.current);
      worker.current = undefined;
      setKxVersion(undefined);
      cursors.clear();
      setPassword('');
      setClipboardFallback(false);
      setDisplay(undefined);
      setDisplayReady(false);
      setDisplays([]);
      clearDisplay();
    };
  }, [configuration]);

  useEffect(() => {
    if (
      !connected ||
      !permissions.keyboard ||
      !displayReady ||
      !display ||
      !canvas.current
    )
      return;
    const handler = new RemoteInput(canvas.current, display, (value) =>
      post({ type: 'input', input: value }),
    );
    input.current = handler;
    return () => {
      handler.dispose();
      input.current = undefined;
    };
  }, [connected, permissions.keyboard, displayReady, display]);

  useEffect(() => {
    const element = canvas.current;
    if (!element || !connected || !displayReady) return;
    const paste = async (event: ClipboardEvent) => {
      event.preventDefault();
      if (readingPaste.current) return;
      if (!permissions.clipboard || !permissions.keyboard) {
        setPasteStatus('denied');
        return;
      }
      input.current?.release();
      releaseModifiers();
      resetClipboard();
      const clipboard = event.clipboardData;
      const epoch = ++pasteEpoch.current;
      const current = generation.current;
      const screenEpoch = displayEpoch.current;
      const valid = () =>
        epoch === pasteEpoch.current &&
        current === generation.current &&
        screenEpoch === displayEpoch.current;
      readingPaste.current = true;
      try {
        const images = Array.from(clipboard?.items || []).filter(
          (item) => item.kind === 'file' && item.type.startsWith('image/'),
        );
        if (images.length) {
          const png = images
            .find((item) => item.type === 'image/png')
            ?.getAsFile();
          if (!png || png.size > IMAGE_LIMITS.encoded) throw new Error();
          const bytes = new Uint8Array(await png.arrayBuffer());
          if (valid()) {
            clipboardSync.current?.rememberLocal({ bytes });
            post({ type: 'paste', content: { bytes } });
          }
        } else {
          const value = clipboard?.getData('text/plain') || '';
          if (
            !value ||
            value.length > MAX_TEXT_BYTES ||
            new TextEncoder().encode(value).byteLength > MAX_TEXT_BYTES
          )
            throw new Error();
          if (valid()) {
            clipboardSync.current?.rememberLocal({ text: value });
            post({ type: 'paste', content: { text: value } });
          }
        }
      } catch {
        if (valid()) setPasteStatus('failed');
      } finally {
        if (valid()) readingPaste.current = false;
      }
    };
    element.addEventListener('paste', paste);
    element.addEventListener('blur', cancelPaste);
    window.addEventListener('blur', cancelPaste);
    return () => {
      element.removeEventListener('paste', paste);
      element.removeEventListener('blur', cancelPaste);
      window.removeEventListener('blur', cancelPaste);
      cancelPaste();
    };
  }, [
    connected,
    displayReady,
    display,
    permissions.clipboard,
    permissions.keyboard,
  ]);

  useEffect(() => {
    const pause = () => {
      if (document.hidden) {
        resetClipboard();
        cancelPaste();
        stopAudio();
        post({ type: 'audio', enabled: false });
        input.current?.release();
        releaseModifiers();
      }
    };
    document.addEventListener('visibilitychange', pause);
    return () => document.removeEventListener('visibilitychange', pause);
  }, []);
  const toggleAudio = async () => {
    if (audioEnabled) {
      stopAudio();
      post({ type: 'audio', enabled: false });
      return;
    }
    const epoch = generation.current;
    player.current?.dispose();
    const next = new AudioPlayer();
    player.current = next;
    try {
      await next.start();
      if (generation.current !== epoch || player.current !== next) {
        next.dispose();
        return;
      }
      next.volume(muted ? 0 : volume);
      setAudioEnabled(true);
      post({ type: 'audio', enabled: true });
    } catch {
      if (generation.current === epoch && player.current === next) {
        stopAudio();
        setError('audio');
      } else next.dispose();
    }
  };
  useEffect(() => {
    if (
      !connected ||
      !permissions.keyboard ||
      !displayReady ||
      !display ||
      !canvas.current
    )
      return;
    const handler = new RemoteTouch(
      canvas.current,
      display,
      (value) => post({ type: 'input', input: value }),
      touchMode,
      viewportRef.current,
      setViewport,
    );
    touch.current = handler;
    return () => {
      handler.dispose();
      touch.current = undefined;
    };
  }, [connected, permissions.keyboard, displayReady, display, touchMode]);
  useEffect(() => {
    const reset = () => {
      input.current?.release();
      releaseModifiers();
      setViewport({ scale: 1, x: 0, y: 0 });
      touch.current?.setViewport({ scale: 1, x: 0, y: 0 });
    };
    window.addEventListener('orientationchange', reset);
    const blur = () => {
      releaseModifiers();
      resetClipboard();
    };
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('orientationchange', reset);
      window.removeEventListener('blur', blur);
    };
  }, []);
  useEffect(() => {
    const resize = () => {
      cancelPaste();
      input.current?.release();
      releaseModifiers();
      setViewport({ scale: 1, x: 0, y: 0 });
      touch.current?.setViewport({ scale: 1, x: 0, y: 0 });
    };
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);
  useEffect(() => {
    if (!activeSession) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [activeSession]);
  useEffect(() => {
    if (!noticesOpen) return;
    const dismiss = (event: PointerEvent) => {
      const target = event.target;
      if (
        target instanceof Element &&
        !noticesElement.current?.contains(target) &&
        !target.closest('[aria-controls="web-client-notices"]')
      )
        setNoticesOpen(false);
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [noticesOpen]);
  useEffect(() => {
    if (error && activeSession) setNoticesOpen(true);
  }, [error, activeSession]);

  const connect = (targetId = id) => {
    if (!configuration?.enabled || !ready) return;
    try {
      const target = normalizeTargetId(targetId);
      setId(target);
      cancelPaste();
      resetClipboard();
      ++generation.current;
      displayEpoch.current = 0;
      setViewport({ scale: 1, x: 0, y: 0 });
      touch.current?.setViewport({ scale: 1, x: 0, y: 0 });
      setSoftText('');
      setState('connecting');
      setTool(undefined);
      setFileOpen(false);
      setPeerVersion(undefined);
      setNoticesOpen(false);
      setKxVersion(undefined);
      setError('');
      setPassword('');

      setDisplay(undefined);
      setDisplayReady(false);
      setDisplays([]);
      post({
        type: 'connect',
        profile: {
          idServerUrl: configuration.idServerUrl,
          relayServerUrl: configuration.relayServerUrl,
          serverPublicKey: configuration.serverPublicKey,
        },
        id: target,
      });
      post({
        type: 'clipboard-context',
        clipboardGeneration: clipboardEpoch.current,
      });
    } catch {
      setError('configuration');
    }
  };
  const submit = () => {
    post({ type: 'password', password });
    setPassword('');
    setError('');
  };
  const chooseTool = (next: ToolName | undefined) => {
    input.current?.release();
    cancelPaste();
    releaseModifiers();
    if (tool === 'input' && next !== 'input') {
      releaseModifiers();
      setSoftKeyboard(false);
    }
    setTool(next);
  };
  const openFiles = () => {
    chooseTool(undefined);
    setFileOpen(true);
  };
  const closeFiles = () => {
    setFileOpen(false);
    canvas.current?.focus({ preventScroll: true });
  };
  useEffect(() => {
    const update = () =>
      setFullscreen(document.fullscreenElement === surface.current);
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, []);
  const toggleFullscreen = () => {
    const action =
      document.fullscreenElement === surface.current
        ? document.exitFullscreen?.()
        : surface.current?.requestFullscreen?.();
    if (!action) {
      setError('fullscreen');
      return;
    }
    void action.catch(() => setError('fullscreen'));
  };
  const authenticating = ['authenticating', 'awaitingApproval'].includes(state);
  const hasNotices =
    !!error ||
    (connected &&
      (!permissions.keyboard || !!fileStatus.error || !!pasteStatus));
  const noticeControl = hasNotices ? (
    <button
      type="button"
      className={styles.noticeButton}
      data-error={!!error || !!fileStatus.error || pasteStatus === 'failed'}
      data-info={
        !error &&
        !fileStatus.error &&
        permissions.keyboard &&
        (pasteStatus === 'sent' || pasteStatus === 'sending')
      }
      aria-label={text('sessionAlerts', 'Session notices')}
      aria-expanded={noticesOpen}
      aria-controls="web-client-notices"
      onClick={() => setNoticesOpen(!noticesOpen)}
    >
      <SafetyCertificateOutlined />
      {error || fileStatus.error || pasteStatus === 'failed'
        ? text('errorBadge', 'Operation failed')
        : !permissions.keyboard
        ? text('viewOnlyBadge', 'View only')
        : pasteStatus === 'sent'
        ? text('pasteSentBadge', 'Clipboard sent')
        : pasteStatus === 'sending'
        ? text('pasteSendingBadge', 'Sending clipboard')
        : text('noticeBadge', 'Session notice')}
    </button>
  ) : null;
  return (
    <PageContainer title={false}>
      {loading ? (
        <div className={styles.loading}>
          <Spin />
        </div>
      ) : !configuration?.enabled ? (
        <Alert
          type="info"
          showIcon
          message={text(
            unavailable ? 'unavailable' : 'disabled',
            unavailable
              ? 'Web Client is unavailable on this backend.'
              : 'Web Client is disabled by the administrator.',
          )}
          action={
            <Button onClick={() => void reload()}>
              {text('retry', 'Retry')}
            </Button>
          }
        />
      ) : (
        <section
          ref={surface}
          className={styles.workbench}
          style={
            {
              '--wc-bg': token.colorBgContainer,
              '--wc-text': token.colorText,
              '--wc-muted': token.colorTextSecondary,
              '--wc-border': token.colorBorderSecondary,
              '--wc-soft': token.colorFillQuaternary,
              '--wc-accent': token.colorPrimary,
              '--wc-accent-bg': token.colorPrimaryBg,
              '--wc-warning-text': token.colorWarningText,
              '--wc-warning-bg': token.colorWarningBg,
              '--wc-warning-border': token.colorWarningBorder,
            } as React.CSSProperties
          }
          aria-label={text('title', 'Web Client')}
          data-session-state={state}
          data-active-session={activeSession}
        >
          <header className={styles.header} hidden={activeSession}>
            <div className={styles.brand}>
              <span className={styles.brandIcon}>
                <DesktopOutlined />
              </span>
              <div>
                <h1>{text('title', 'Web Client')}</h1>
              </div>
            </div>
            <span
              className={styles.status}
              data-connected={connected}
              role="status"
              aria-live="polite"
            >
              <span className={styles.statusDot} />
              {text('state.' + state, state)}
            </span>
          </header>
          <div
            data-workspace
            hidden={!activeSession}
            className={styles.workspace}
            data-active-session={activeSession}
          >
            <div
              className={styles.screen}
              data-ready={connected && displayReady}
            >
              <canvas
                ref={canvas}
                tabIndex={connected && permissions.keyboard ? 0 : -1}
                aria-label={text(
                  'desktop',
                  'Remote desktop. Focus to send keyboard and mouse input.',
                )}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  width: 'auto',
                  height: 'auto',
                  touchAction: 'none',
                  transform:
                    'translate(' +
                    viewport.x +
                    'px, ' +
                    viewport.y +
                    'px) scale(' +
                    viewport.scale +
                    ')',
                }}
              />
              <div
                ref={pointer}
                aria-hidden="true"
                className={styles.pointer}
              />
              {(!connected || !displayReady) && (
                <div className={styles.stageOverlay}>
                  <div className={styles.stageCard}>
                    {(activeSession || state === 'failed') && (
                      <>
                        <span className={styles.stageIcon}>
                          <DesktopOutlined />
                        </span>
                        <h2>
                          {text(
                            authenticating
                              ? 'authTitle'
                              : connected
                              ? 'waitingFrame'
                              : activeSession
                              ? 'state.' + state
                              : 'state.failed',
                            authenticating
                              ? 'Approve your connection'
                              : connected
                              ? 'Waiting for the desktop'
                              : activeSession
                              ? state
                              : 'Connection failed',
                          )}
                        </h2>
                      </>
                    )}
                    <p>
                      {text(
                        authenticating
                          ? 'approval'
                          : activeSession
                          ? 'connectingHint'
                          : 'idleHint',
                        authenticating
                          ? 'You can also approve the connection on the remote device.'
                          : activeSession
                          ? 'The session is being prepared. You can disconnect at any time.'
                          : 'Choose a device below, or enter its ID to connect.',
                      )}
                    </p>
                    {authenticating && (
                      <div className={styles.authForm}>
                        <Input.Password
                          aria-label={text(
                            'password',
                            'Remote device password',
                          )}
                          placeholder={text(
                            'password',
                            'Remote device password',
                          )}
                          autoComplete="off"
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          onPressEnter={submit}
                          maxLength={4096}
                        />
                        <Button
                          type="primary"
                          onClick={submit}
                          disabled={!password}
                        >
                          {text('authenticate', 'Send password')}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <SessionToolbar
              key={'toolbar-' + generation.current}
              tool={tool}
              onSelect={chooseTool}
              onFiles={openFiles}
              onDisconnect={disconnect}
              onFullscreen={toggleFullscreen}
              fullscreen={fullscreen}
              connected={connected}
              busy={fileStatus.busy}
              audio={audioEnabled}
              text={text}
            >
              <div hidden={tool !== 'display'}>
                <h3>{text('displayOptions', 'Display')}</h3>
                {displays.length > 1 && (
                  <label className={styles.monitor}>
                    {text('display', 'Monitor')}
                    <select
                      className={styles.select}
                      aria-label={text('display', 'Monitor')}
                      value={selectedDisplay}
                      onChange={(event) => {
                        input.current?.release();
                        releaseModifiers();
                        setDisplayReady(false);
                        clearDisplay();
                        post({
                          type: 'select-display',
                          index: Number(event.target.value),
                        });
                      }}
                    >
                      {displays.map((item, index) => (
                        <option
                          key={
                            item.name ||
                            [item.x, item.y, item.width, item.height].join(':')
                          }
                          value={index}
                        >
                          {index + 1}:{' '}
                          {item.name || `${item.width} × ${item.height}`}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <Button
                  onClick={() => {
                    input.current?.release();
                    releaseModifiers();
                    setViewport({ scale: 1, x: 0, y: 0 });
                    touch.current?.setViewport({ scale: 1, x: 0, y: 0 });
                  }}
                >
                  {text('zoomReset', 'Reset zoom')}
                </Button>
              </div>
              <div id="web-client-tool-input" hidden={tool !== 'input'}>
                <p className={styles.panelHint}>
                  {text(
                    'keyboardMenuHint',
                    'Use the keyboard below for reserved shortcuts and text input.',
                  )}
                </p>
                <div className={styles.inputControls}>
                  <label>
                    {text('touchMode', 'Touch mode')}{' '}
                    <select
                      className={styles.select}
                      aria-label={text('touchMode', 'Touch mode')}
                      value={touchMode}
                      onChange={(event) => {
                        input.current?.release();
                        setTouchMode(event.target.value as TouchMode);
                      }}
                    >
                      <option value="pointer">
                        {text('touchPointer', 'Point / drag')}
                      </option>
                      <option value="scroll">
                        {text('touchScroll', 'Scroll')}
                      </option>
                      <option value="zoom">
                        {text('touchZoom', 'Pan zoomed view')}
                      </option>
                    </select>
                  </label>
                  <Button
                    onClick={() => {
                      setViewport({ scale: 1, x: 0, y: 0 });
                      touch.current?.setViewport({ scale: 1, x: 0, y: 0 });
                      setTouchMode('pointer');
                    }}
                  >
                    {text('zoomReset', 'Reset zoom')}
                  </Button>
                  <Button
                    disabled={!permissions.keyboard || !displayReady}
                    onClick={() => {
                      releaseModifiers();
                      setSoftKeyboard(!softKeyboard);
                    }}
                  >
                    {text('softKeyboard', 'Keyboard')}
                  </Button>
                  {[
                    hbb.ControlKey.Control,
                    hbb.ControlKey.Alt,
                    hbb.ControlKey.Shift,
                  ].map((controlKey) => (
                    <Button
                      key={controlKey}
                      aria-pressed={heldModifiers.includes(controlKey)}
                      disabled={!permissions.keyboard || !displayReady}
                      onClick={() => {
                        const down = !modifierRef.current.includes(controlKey);
                        modifierRef.current = down
                          ? [...modifierRef.current, controlKey]
                          : modifierRef.current.filter(
                              (key) => key !== controlKey,
                            );
                        setHeldModifiers([...modifierRef.current]);
                        post({
                          type: 'input',
                          input: { keyEvent: { controlKey, down } },
                        });
                      }}
                    >
                      {hbb.ControlKey[controlKey]}
                    </Button>
                  ))}
                  {[
                    hbb.ControlKey.Tab,
                    hbb.ControlKey.Return,
                    hbb.ControlKey.Escape,
                    hbb.ControlKey.Backspace,
                  ].map((controlKey) => (
                    <Button
                      key={controlKey}
                      disabled={!permissions.keyboard || !displayReady}
                      onClick={() =>
                        post({
                          type: 'input',
                          input: {
                            keyEvent: {
                              controlKey,
                              press: true,
                              modifiers: modifierRef.current,
                            },
                          },
                        })
                      }
                    >
                      {hbb.ControlKey[controlKey]}
                    </Button>
                  ))}
                  {softKeyboard && (
                    <Space wrap className={styles.keyboardText}>
                      <Input
                        aria-label={text('softText', 'Keyboard text')}
                        value={softText}
                        maxLength={MAX_TEXT_BYTES}
                        onChange={(event) => setSoftText(event.target.value)}
                      />
                      <Button
                        disabled={
                          !permissions.keyboard || !displayReady || !softText
                        }
                        onClick={() => {
                          post({ type: 'text', text: softText });
                          setSoftText('');
                        }}
                      >
                        {text('sendText', 'Send text')}
                      </Button>
                    </Space>
                  )}
                </div>
                <details className={styles.touchHelp}>
                  <summary>{text('touchHelp', 'Touch help')}</summary>
                  <p className={styles.panelHint}>
                    {text(
                      'touchNotice',
                      'Touch to click, move to drag, hold for right click. Pinch with two fingers to zoom locally; use Scroll mode for the remote wheel. Send keyboard text after IME composition.',
                    )}
                  </p>
                </details>
              </div>
              <div id="web-client-tool-audio" hidden={tool !== 'audio'}>
                <div className={styles.audioHero}>
                  <SoundOutlined />
                  <strong>{text('toolAudio', 'Audio')}</strong>
                  <p>
                    {text(
                      'audioHint',
                      'Start playback when you want to hear the remote device. Playback stops when the session ends.',
                    )}
                  </p>
                </div>
                {!permissions.audio && (
                  <Alert
                    type="warning"
                    showIcon
                    message={text(
                      'audioDenied',
                      'Audio is disabled by the remote device.',
                    )}
                  />
                )}
                <div className={styles.audioControls}>
                  {!audioSupported && (
                    <span>
                      {text(
                        'audioUnavailable',
                        'Opus audio decoding is unavailable in this browser.',
                      )}
                    </span>
                  )}
                  <Button
                    disabled={!audioSupported || !permissions.audio}
                    onClick={() => void toggleAudio()}
                  >
                    {text(
                      audioEnabled ? 'audioStop' : 'audioStart',
                      audioEnabled ? 'Stop audio' : 'Play audio',
                    )}
                  </Button>
                  <Button
                    disabled={!audioEnabled}
                    onClick={() => {
                      setMuted(!muted);
                      player.current?.volume(!muted ? 0 : volume);
                    }}
                  >
                    {text(muted ? 'unmute' : 'mute', muted ? 'Unmute' : 'Mute')}
                  </Button>
                  <input
                    type="range"
                    aria-label={text('volume', 'Volume')}
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      setVolume(value);
                      player.current?.volume(muted ? 0 : value);
                    }}
                  />
                </div>
              </div>
            </SessionToolbar>
            <FileDialog
              open={fileOpen}
              target={id}
              onClose={closeFiles}
              text={text}
            >
              <FilePanel
                key={'files-' + generation.current}
                ref={files}
                enabled={connected}
                post={post}
                text={text}
                onStatusChange={setFileStatus}
              />
            </FileDialog>
          </div>
          {fullscreen && !activeSession && (
            <Button
              className={styles.exitFullscreen}
              onClick={toggleFullscreen}
            >
              {text('exitFullscreen', 'Exit fullscreen')}
            </Button>
          )}
          {activeSession && (
            <div className={styles.sessionHud}>
              <span className={styles.sessionIdentity}>
                <DesktopOutlined />
                <span title={id}>{id}</span>
                <span className={styles.statusDot} data-connected={connected} />
              </span>
              {kxVersion === 0 && (
                <LegacyEncryptionNotice text={text} version={peerVersion} />
              )}
              {connected && fileStatus.legacy && !fileOpen && (
                <LegacyEncryptionNotice text={text} context="files" />
              )}
              {noticeControl}
            </div>
          )}
          {activeSession && clipboardFallback && (
            <div className={styles.clipboardRetry} role="status">
              <span>
                {text('clipboardRetryHint', 'Browser blocked clipboard sync.')}
              </span>
              <button
                type="button"
                onClick={() => clipboardSync.current?.retry()}
              >
                {text('clipboardRetry', 'Click to copy')}
              </button>
            </div>
          )}
          <div
            className={styles.notices}
            id="web-client-notices"
            ref={noticesElement}
            data-session={activeSession}
            hidden={activeSession && !noticesOpen}
            aria-live="polite"
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.stopPropagation();
                setNoticesOpen(false);
              }
            }}
          >
            {connected && !!pasteStatus && (
              <div className={styles.pasteHint} role="status">
                <CopyOutlined />
                <span>
                  {text(
                    pasteStatus ? 'paste.' + pasteStatus : 'pasteHint',
                    pasteStatus === 'failed'
                      ? 'Paste failed. Check the content and try again.'
                      : pasteStatus === 'denied'
                      ? 'The remote device has disabled clipboard or keyboard access.'
                      : pasteStatus === 'sending'
                      ? 'Sending clipboard…'
                      : pasteStatus === 'sent'
                      ? 'Paste sent to the remote device.'
                      : 'Focus the remote desktop and press Ctrl/Cmd+V to paste text or a PNG image.',
                  )}
                </span>
              </div>
            )}
            {error && (
              <Alert
                type={error === 'password' ? 'warning' : 'error'}
                showIcon
                message={text(
                  'error.' + error,
                  'The operation failed. Disconnect and try again.',
                )}
              />
            )}
            {connected && !permissions.keyboard && (
              <Alert
                type="warning"
                showIcon
                message={text(
                  'keyboardDenied',
                  'Keyboard and mouse are disabled by the remote device. Previously held keys or buttons may remain pressed; restore permission or press and release them on the remote device.',
                )}
              />
            )}
            {connected && fileStatus.error && (
              <Alert
                type="error"
                showIcon
                message={text(
                  'error.files',
                  'File operation failed or was denied. Retry the file session.',
                )}
                action={
                  <Button onClick={openFiles}>
                    {text('files', 'File transfer')}
                  </Button>
                }
              />
            )}
          </div>

          <section
            className={styles.deviceSelection}
            data-device-selection
            hidden={activeSession}
            aria-label={text('selectDevice', 'Choose a device')}
          >
            <div className={styles.connectionCard}>
              <h2>{text('connectDevice', 'Connect to a device')}</h2>
              <div className={styles.connectionField}>
                <label htmlFor="web-client-target">
                  {text('id', 'Remote ID')}
                </label>
                <Input
                  id="web-client-target"
                  aria-label={text('id', 'Remote ID')}
                  placeholder={text('idPlaceholder', 'Enter the device ID')}
                  value={id}
                  onChange={(event) => setId(event.target.value)}
                  onPressEnter={() => connect()}
                  disabled={activeSession}
                  maxLength={256}
                />
              </div>
              <Button
                type="primary"
                block
                icon={<ArrowRightOutlined />}
                onClick={() => connect()}
                disabled={!ready || activeSession || !id.trim()}
              >
                {text('connect', 'Connect')}
              </Button>
              <p className={styles.connectionHint}>
                <SafetyCertificateOutlined />
                {text(
                  'connectionApproval',
                  'The remote device must approve the connection, or you can use its password.',
                )}
              </p>
            </div>
            {!activeSession && (
              <DevicePicker disabled={!ready} onConnect={connect} />
            )}
          </section>
        </section>
      )}
    </PageContainer>
  );
}
