import {
  ArrowRightOutlined,
  CopyOutlined,
  DesktopOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl, useLocation, useModel } from '@umijs/max';
import {
  Alert,
  Button,
  Checkbox,
  Input,
  Modal,
  Spin,
  Switch,
  theme,
} from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import createAccess from '@/access';
import { IMAGE_LIMITS } from '@/features/web-client/clipboard/image';
import {
  RemoteClipboardSync,
  writeRemoteClipboard,
} from '@/features/web-client/clipboard/remote-sync';
import { MAX_TEXT_BYTES } from '@/features/web-client/clipboard/text';
import type { KxVersion } from '@/features/web-client/core/crypto';
import type {
  DisplayOptions,
  Resolution,
} from '@/features/web-client/core/display';
import { GrantLifecycle } from '@/features/web-client/core/grant-lifecycle';
import { loadIceServers } from '@/features/web-client/core/ice-config';
import { normalizeTargetId } from '@/features/web-client/core/profile';
import type { CredentialStatus } from '@/features/web-client/core/remembered-credentials';
import type {
  SessionState,
  ViewOptions,
} from '@/features/web-client/core/session';
import {
  type RemoteDisplay,
  RemoteInput,
} from '@/features/web-client/input/input';
import {
  type KeyboardLockState,
  RemoteKeyboardLock,
} from '@/features/web-client/input/keyboard-lock';
import {
  DEFAULT_INPUT_MAPPING,
  type InputMapping,
  mapInput,
} from '@/features/web-client/input/mapping';
import { shouldGuideShortcut } from '@/features/web-client/input/shortcut-guide';
import {
  RemoteTouch,
  type TouchMode,
  type Viewport,
} from '@/features/web-client/input/touch';
import { AudioPlayer } from '@/features/web-client/media/audio-player';
import { RemoteCursor } from '@/features/web-client/media/cursor';
import {
  type QualityReading,
  QualitySampler,
} from '@/features/web-client/media/quality-metrics';
import { supportsTrueColor } from '@/features/web-client/media/video-codecs';
import { hbb } from '@/features/web-client/protocol';
import type {
  SessionCommand,
  WorkerEvent,
} from '@/features/web-client/worker/contract';
import { createSessionWorker } from '@/features/web-client/worker/create-worker';
import { shutdownSessionWorker } from '@/features/web-client/worker/shutdown-worker';
import {
  createWebClientSession,
  endWebClientSession,
  handleWebClientAuthError,
  reportWebClientEvent,
  webClientHttpStatus,
} from '@/services/rustdesk-console/webClient';
import { AdvancedDialogs, useAdvancedTools } from './advanced-tools';
import { DevicePicker } from './devices';
import { CustomQuality, FrameRate, ResolutionOptions } from './display-options';
import {
  FilePanel,
  type FilePanelHandle,
  type FilePanelStatus,
  fileErrorMessage,
} from './files';
import styles from './index.less';
import { LegacyEncryptionNotice } from './legacy-notice';
import { QualityMonitor } from './quality-monitor';
import { ScreenKeyboard, type ScreenKeyboardHandle } from './screen-keyboard';
import { FileDialog, SessionToolbar, type ToolName } from './toolbar';

export default function WebClientPage() {
  const intl = useIntl();
  const { token } = theme.useToken();
  const text = (
    key: string,
    fallback: string,
    values?: Record<string, string | number>,
  ) =>
    intl.formatMessage(
      { id: `webClient.${key}`, defaultMessage: fallback },
      values,
    );
  const location = useLocation();
  const { configuration, loading, unavailable, forbidden, reload } =
    useModel('webClient');
  const { initialState } = useModel('@@initialState');
  const account = initialState?.currentUser?.guid;
  const access = createAccess(initialState);
  const canConnect = !!account && access.canWebClientConnect;
  const automaticConnection = useRef({
    search: location.search,
    account,
    attempted: false,
  });
  const grant = useRef(new GrantLifecycle(endWebClientSession));
  const grantPending = useRef(false);
  const authorizationContext = useRef({
    account,
    configuration,
    canConnect,
    search: location.search,
  });
  authorizationContext.current = {
    account,
    configuration,
    canConnect,
    search: location.search,
  };
  const releaseGrant = () => {
    grantPending.current = false;
    grant.current.cancel();
  };
  const [tool, setTool] = useState<ToolName>();
  const [fileOpen, setFileOpen] = useState(false);
  const [peerVersion, setPeerVersion] = useState<string>();
  const [sasEnabled, setSasEnabled] = useState(false);
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
  const [rememberPassword, setRememberPassword] = useState(false);
  const [credentialStatus, setCredentialStatus] =
    useState<CredentialStatus>('none');
  const [keyboardLockState, setKeyboardLockState] =
    useState<KeyboardLockState>('idle');
  const keyboardLock = useRef<RemoteKeyboardLock | undefined>(undefined);
  const keyboardCaptureEnabledRef = useRef(false);
  const [shortcutGuide, setShortcutGuide] = useState<number>();
  const shortcutGuideOwner = useRef<number | undefined>(undefined);
  const shortcutGuideShown = useRef<number | undefined>(undefined);
  const shortcutGuideClosing = useRef(false);
  const shortcutGuideFocus = useRef<(() => void) | undefined>(undefined);
  const [error, setError] = useState('');
  const [clipboardFallback, setClipboardFallback] = useState(false);
  const [pasteStatus, setPasteStatus] = useState('');
  const [clipboardEnabled, setClipboardEnabled] = useState(true);
  const clipboardEnabledRef = useRef(true);
  const [inputMapping, setInputMapping] = useState<InputMapping>(
    DEFAULT_INPUT_MAPPING,
  );
  const inputMappingRef = useRef(DEFAULT_INPUT_MAPPING);
  const [qualityEnabled, setQualityEnabled] = useState(false);
  const qualityEnabledRef = useRef(false);
  qualityEnabledRef.current = qualityEnabled;
  const [qualityReading, setQualityReading] = useState<QualityReading>({});
  const qualitySampler = useRef(new QualitySampler());
  const qualityRequest = useRef(0);
  const drawnFrames = useRef(0);
  const pasteEpoch = useRef(0);
  const readingPaste = useRef(false);
  const [display, setDisplay] = useState<RemoteDisplay>();
  const [permissions, setPermissions] = useState({
    keyboard: true,
    clipboard: true,
    audio: true,
    file: true,
    recording: true,
  });
  const [displays, setDisplays] = useState<hbb.IDisplayInfo[]>([]);
  const [selectedDisplay, setSelectedDisplay] = useState(0);
  const [displayReady, setDisplayReady] = useState(false);
  const [displayOptions, setDisplayOptions] = useState<DisplayOptions>();
  const [resolutionStatus, setResolutionStatus] = useState('');
  const resolutionRequest = useRef(0);
  const [resolutionPending, setResolutionPending] = useState(false);
  const [zoomCursor, setZoomCursor] = useState(false);
  const [cursorEmbedded, setCursorEmbedded] = useState(false);
  const cursorRenderer = useRef<RemoteCursor | undefined>(undefined);
  const displayEpoch = useRef(0);
  const [touchMode, setTouchMode] = useState<TouchMode>('pointer');
  const [viewport, setViewport] = useState<Viewport>({ scale: 1, x: 0, y: 0 });
  const [viewStyle, setViewStyle] = useState<'fit' | 'original'>('fit');
  const [viewOptions, setViewOptions] = useState<ViewOptions>({
    quality: 'balanced',
    customQuality: 50,
    fps: 30,
    remoteCursor: true,
  });
  const [readOnly, setReadOnly] = useState(false);
  const inputAllowed = permissions.keyboard && !readOnly;
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const screenKeyboard = useRef<ScreenKeyboardHandle>(null);
  const touch = useRef<RemoteTouch | undefined>(undefined);
  const files = useRef<FilePanelHandle>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const pointer = useRef<HTMLDivElement>(null);
  const worker = useRef<Worker | undefined>(undefined);
  const generation = useRef(0);
  const post = (message: SessionCommand, owner?: number) =>
    worker.current?.postMessage({
      ...message,
      ...(message.type === 'input'
        ? { input: mapInput(message.input, inputMappingRef.current) }
        : {}),
      generation: owner ?? generation.current,
      displayGeneration: displayEpoch.current,
    });
  const input = useRef<RemoteInput | undefined>(undefined);
  const advanced = useAdvancedTools(post, () => generation.current, {
    recording: () =>
      state === 'connected' &&
      permissions.recording &&
      displayReady &&
      !!configuration?.enabled,
    audio: () =>
      state === 'connected' && permissions.audio && !!configuration?.enabled,
    connected: () => state === 'connected' && !!configuration?.enabled,
    display: () => displayEpoch.current,
  });
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
    allowed: permissions.clipboard && clipboardEnabledRef.current,
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
      enabled: clipboardEnabledRef.current,
    });
  };

  const cancelPaste = () => {
    ++pasteEpoch.current;
    readingPaste.current = false;
    setPasteStatus('');
    post({ type: 'cancel-paste' });
  };
  const closeShortcutGuide = () => {
    if (shortcutGuideOwner.current !== undefined)
      shortcutGuideClosing.current = true;
    shortcutGuideFocus.current = undefined;
    shortcutGuideOwner.current = undefined;
    setShortcutGuide(undefined);
  };
  const afterShortcutGuideClose = () => {
    if (shortcutGuideOwner.current !== undefined) return;
    shortcutGuideClosing.current = false;
    const restore = shortcutGuideFocus.current;
    shortcutGuideFocus.current = undefined;
    restore?.();
  };

  const stopAudio = () => {
    player.current?.dispose();
    player.current = undefined;
    setAudioEnabled(false);
  };
  const releaseModifiers = () => {
    screenKeyboard.current?.release();
  };
  const resetQuality = () => {
    ++qualityRequest.current;
    qualitySampler.current.reset();
    setQualityReading({});
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
    setKeyboardOpen(false);
    keyboardCaptureEnabledRef.current = false;
    closeShortcutGuide();
    cursorRenderer.current?.clear();
    setDisplayOptions(undefined);
    setResolutionPending(false);
    setResolutionStatus('');
    setZoomCursor(false);
    advanced.reset();
    resetQuality();
    cancelPaste();
    stopAudio();
    files.current?.dispose();
    releaseModifiers();
    setTool(undefined);
    setNoticesOpen(false);
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
    setReadOnly(false);
    setViewStyle('fit');
    setViewOptions({
      quality: 'balanced',
      customQuality: 50,
      fps: 30,
      remoteCursor: true,
    });
    clearDisplay();
    releaseGrant();
  };

  useEffect(() => {
    if (automaticConnection.current.search !== location.search) {
      automaticConnection.current = {
        search: location.search,
        account,
        attempted: false,
      };
    }
    setId(new URLSearchParams(location.search).get('id') || '');
    disconnect();
  }, [location.search]);

  useEffect(() => {
    const expired = () => disconnect();
    window.addEventListener('auth:session-expired', expired);
    return () => window.removeEventListener('auth:session-expired', expired);
  }, [account, configuration]);

  useEffect(() => {
    if (!configuration?.enabled || !canConnect) return;
    if (canvas.current && pointer.current)
      cursorRenderer.current = new RemoteCursor(
        canvas.current,
        pointer.current,
      );
    let active = true;
    let acceptsFrames = false;
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
            closeShortcutGuide();
            advanced.reset();
            clipboardContext.current.connected = false;
            stopAudio();
            files.current?.dispose();
            releaseModifiers();
            setKeyboardOpen(false);
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
            releaseGrant();
          }
        };
        instance.onmessage = (event: MessageEvent<WorkerEvent>) => {
          const message = event.data;
          // 旧桌面已断开时，只有仍归本页保存句柄的录制块/收尾允许完成。
          if (
            active &&
            (message.type === 'record-chunk' || message.type === 'record-done')
          ) {
            advanced.handle(message);
            return;
          }
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
          if (advanced.handle(message)) return;
          if (message.type === 'ready') {
            setAudioSupported(!!message.audioDecoder);
            setReady(message.secureContext && message.videoDecoder);
            if (!message.secureContext || !message.videoDecoder)
              setError('unsupported');
          } else if (message.type === 'native-auth') {
            const guid = grant.current.current()?.sessionGuid;
            if (guid)
              void reportWebClientEvent(guid, {
                event: message.succeeded
                  ? 'remote_auth_succeeded'
                  : 'remote_auth_failed',
              }).catch(() => {});
          } else if (message.type === 'state') {
            acceptsFrames = message.state === 'connected';
            clipboardContext.current.connected = message.state === 'connected';
            if (message.state !== 'connected') {
              setResolutionPending(false);
              setResolutionStatus('');
              setDisplayOptions(undefined);
              resetClipboard();
              resetQuality();
            }
            setState(message.state);
            if (message.state === 'failed' || message.state === 'closed') {
              closeShortcutGuide();
              advanced.reset();
              stopAudio();
              files.current?.dispose();
              releaseModifiers();
              setKeyboardOpen(false);
              setKxVersion(undefined);
              setPassword('');

              resetClipboard();
              cursorRenderer.current?.clear();
              clearDisplay();
              releaseGrant();
            }
          } else if (message.type === 'credential-status') {
            setCredentialStatus(message.status);
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
            if (
              message.code === 'authorization' ||
              message.code === 'sessionExpired'
            )
              handleWebClientAuthError({
                response: {
                  status: message.code === 'sessionExpired' ? 401 : 403,
                },
              });
            if (message.code === 'audio') stopAudio();
            setError(message.code);
          } else if (message.type === 'permissions') {
            clipboardContext.current.allowed =
              message.permissions.clipboard && clipboardEnabledRef.current;
            setPermissions({
              ...message.permissions,
              recording: message.permissions.recording !== false,
            });
            if (!message.permissions.keyboard || !message.permissions.clipboard)
              cancelPaste();
            if (!message.permissions.keyboard) {
              keyboardCaptureEnabledRef.current = false;
              keyboardLock.current?.release();
              closeShortcutGuide();
              releaseModifiers();
            }
            if (!message.permissions.audio) {
              stopAudio();
              advanced.endCall();
            }
            if (!message.permissions.clipboard) resetClipboard();
          } else if (message.type === 'peer') {
            setPeerVersion(message.peer.version || undefined);
            if (Object.hasOwn(message.peer, 'sasEnabled'))
              setSasEnabled(!!message.peer.sasEnabled);
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
            setCursorEmbedded(!!remote.cursorEmbedded);
            setPassword('');
            setError('');
            setDisplays(message.peer.displays || []);
            setSelectedDisplay(message.peer.currentDisplay || 0);
            setDisplayReady(false);
          } else if (message.type === 'display') {
            resetQuality();
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
            setCursorEmbedded(!!remote.cursorEmbedded);
          } else if (message.type === 'display-options') {
            if (message.displayGeneration === displayEpoch.current)
              setDisplayOptions(message.options);
          } else if (message.type === 'resolution-status') {
            if (message.request === resolutionRequest.current) {
              setResolutionPending(message.status === 'pending');
              setResolutionStatus(
                message.status === 'cancelled' ? '' : message.status,
              );
            }
          } else if (message.type === 'metrics') {
            if (
              qualityEnabledRef.current &&
              !document.hidden &&
              acceptsFrames &&
              message.request === qualityRequest.current &&
              message.displayGeneration === displayEpoch.current
            )
              setQualityReading(
                qualitySampler.current.sample(
                  performance.now(),
                  drawnFrames.current,
                  message,
                ),
              );
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
            let drawn = false;
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
                const context = element.getContext('2d', { alpha: false });
                if (context) {
                  context.drawImage(frame, 0, 0);
                  drawn = true;
                  if (drawnFrames.current < Number.MAX_SAFE_INTEGER)
                    ++drawnFrames.current;
                }
              }
            } finally {
              frame.close();
              instance.postMessage({
                type: 'rendered',
                displayGeneration: message.displayGeneration,
                generation: message.generation,
                drawn,
              });
            }
          } else if (message.type === 'image') {
            if (message.clipboardGeneration === clipboardEpoch.current)
              clipboardSync.current?.receive({ bytes: message.bytes });
          } else if (message.type === 'clipboard') {
            if (message.clipboardGeneration === clipboardEpoch.current)
              clipboardSync.current?.receive({ text: message.text });
          } else if (message.type === 'cursor') {
            if (acceptsFrames) cursorRenderer.current?.receive(message.cursor);
          } else if (message.type === 'cursor-id') {
            if (acceptsFrames) cursorRenderer.current?.select(message.id);
          } else if (message.type === 'cursor-position') {
            if (acceptsFrames) cursorRenderer.current?.move(message.position);
          }
        };
      })
      .catch(() => {
        if (active) {
          closeShortcutGuide();
          setError('worker');
          setState('failed');
        }
      });
    return () => {
      active = false;
      closeShortcutGuide();
      advanced.reset();
      clipboardContext.current.connected = false;
      resetClipboard();
      setFileOpen(false);
      stopAudio();
      files.current?.dispose();
      releaseModifiers();
      setKeyboardOpen(false);
      pending.abort();
      input.current?.dispose();
      input.current = undefined;
      ++generation.current;
      if (created) shutdownSessionWorker(created, generation.current);
      worker.current = undefined;
      setKxVersion(undefined);
      cursorRenderer.current?.dispose();
      cursorRenderer.current = undefined;
      setPassword('');
      setClipboardFallback(false);
      setDisplay(undefined);
      setDisplayReady(false);
      setDisplays([]);
      clearDisplay();
      releaseGrant();
    };
  }, [configuration, account, canConnect]);

  useEffect(() => {
    cursorRenderer.current?.observe(connected);
    return () => cursorRenderer.current?.observe(false);
  }, [connected, configuration]);
  useEffect(() => {
    cursorRenderer.current?.configure(
      connected && displayReady ? display : undefined,
      zoomCursor,
      viewOptions.remoteCursor,
      cursorEmbedded,
    );
  }, [
    connected,
    displayReady,
    display,
    zoomCursor,
    viewOptions.remoteCursor,
    cursorEmbedded,
    viewport,
    viewStyle,
  ]);

  useEffect(() => {
    if (
      !connected ||
      !inputAllowed ||
      !displayReady ||
      !display ||
      !canvas.current
    )
      return;
    const handler = new RemoteInput(
      canvas.current,
      display,
      (value) => post({ type: 'input', input: value }),
      () => cursorRenderer.current?.localActivity(),
    );
    input.current = handler;
    return () => {
      handler.dispose();
      input.current = undefined;
    };
  }, [connected, inputAllowed, displayReady, display]);
  useEffect(() => {
    const element = canvas.current;
    if (!connected || !inputAllowed || !displayReady || !display || !element) {
      closeShortcutGuide();
      return;
    }
    const current = generation.current;
    const onKey = (event: KeyboardEvent) => {
      if (
        current !== generation.current ||
        document.hidden ||
        !document.hasFocus() ||
        event.target !== element ||
        document.activeElement !== element
      )
        return;
      // 同一批事件尚未提交React时也阻断画布输入，不能把组合补放到远端。
      if (shortcutGuideOwner.current === current) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      if (
        document.fullscreenElement === surface.current ||
        shortcutGuideShown.current === current ||
        !shouldGuideShortcut(event)
      )
        return;
      shortcutGuideShown.current = current;
      shortcutGuideOwner.current = current;
      input.current?.release();
      releaseModifiers();
      cancelPaste();
      setTool(undefined);
      event.preventDefault();
      event.stopImmediatePropagation();
      setShortcutGuide(current);
    };
    element.addEventListener('keydown', onKey, true);
    return () => element.removeEventListener('keydown', onKey, true);
  }, [connected, inputAllowed, displayReady, display]);
  useEffect(() => {
    if (
      !connected ||
      !inputAllowed ||
      !displayReady ||
      !canvas.current ||
      !surface.current
    )
      return;
    const lock = new RemoteKeyboardLock(
      canvas.current,
      surface.current,
      () => keyboardCaptureEnabledRef.current,
      setKeyboardLockState,
    );
    keyboardLock.current = lock;
    return () => {
      lock.dispose();
      keyboardLock.current = undefined;
    };
  }, [connected, inputAllowed, displayReady, configuration]);

  useEffect(() => {
    const element = canvas.current;
    if (!element || !connected || !displayReady) return;
    const paste = async (event: ClipboardEvent) => {
      event.preventDefault();
      if (readingPaste.current) return;
      if (!clipboardEnabledRef.current) return;
      if (!permissions.clipboard || !inputAllowed) {
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
        screenEpoch === displayEpoch.current &&
        clipboardEnabledRef.current &&
        clipboardContext.current.allowed;
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
  }, [connected, displayReady, display, permissions.clipboard, inputAllowed]);

  useEffect(() => {
    const pause = () => {
      if (document.hidden) {
        advanced.endCall();
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
  useEffect(() => {
    if (!qualityEnabled || !connected || !configuration?.enabled) {
      resetQuality();
      return;
    }
    let timer: ReturnType<typeof setInterval> | undefined;
    const poll = () =>
      post({ type: 'metrics', request: ++qualityRequest.current });
    const visible = () => {
      clearInterval(timer);
      timer = undefined;
      resetQuality();
      if (!document.hidden) {
        poll();
        timer = setInterval(poll, 1000);
      }
    };
    visible();
    document.addEventListener('visibilitychange', visible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', visible);
      resetQuality();
    };
  }, [qualityEnabled, connected, configuration]);
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
      !inputAllowed ||
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
  }, [connected, inputAllowed, displayReady, display, touchMode]);
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

  const connect = async (targetId = id) => {
    if (
      !configuration?.enabled ||
      !ready ||
      !canConnect ||
      grantPending.current ||
      activeSession
    )
      return;
    const context = authorizationContext.current;
    // Any user-initiated attempt also consumes the pending automatic request.
    automaticConnection.current.attempted = true;
    let attempt = 0;
    try {
      const target = normalizeTargetId(targetId);
      grantPending.current = true;
      resetQuality();
      drawnFrames.current = 0;
      setId(target);
      cancelPaste();
      resetClipboard();
      ++generation.current;
      attempt = generation.current;
      closeShortcutGuide();
      shortcutGuideShown.current = undefined;
      shortcutGuideClosing.current = false;
      displayEpoch.current = 0;
      setViewport({ scale: 1, x: 0, y: 0 });
      touch.current?.setViewport({ scale: 1, x: 0, y: 0 });
      setKeyboardOpen(false);
      keyboardCaptureEnabledRef.current = false;
      setState('connecting');
      setTool(undefined);
      setFileOpen(false);
      setPeerVersion(undefined);
      setSasEnabled(false);
      setReadOnly(false);
      cursorRenderer.current?.clear();
      setZoomCursor(false);
      setResolutionPending(false);
      setResolutionStatus('');
      setDisplayOptions(undefined);
      setViewStyle('fit');
      setViewOptions({
        quality: 'balanced',
        customQuality: 50,
        fps: 30,
        remoteCursor: true,
      });
      setNoticesOpen(false);
      setKxVersion(undefined);
      setError('');
      setPassword('');
      setRememberPassword(false);
      setCredentialStatus('none');

      setDisplay(undefined);
      setDisplayReady(false);
      setDisplays([]);
      const authorized = await grant.current.acquire(() =>
        createWebClientSession(target),
      );
      if (
        !authorized ||
        attempt !== generation.current ||
        context.account !== authorizationContext.current.account ||
        context.configuration !== authorizationContext.current.configuration ||
        context.search !== authorizationContext.current.search ||
        !authorizationContext.current.canConnect
      ) {
        if (authorized) grant.current.cancel();
        return;
      }
      grantPending.current = false;
      const iceServers = loadIceServers();
      post({
        type: 'connect',
        grant: authorized,
        origin: window.location.origin,
        profile: {
          idServerUrl: configuration.idServerUrl,
          relayServerUrl: configuration.relayServerUrl,
          serverPublicKey: configuration.serverPublicKey,
          iceServers,
        },
        id: target,
        ...(account ? { account } : {}),
      });
      post({
        type: 'clipboard-context',
        clipboardGeneration: clipboardEpoch.current,
        enabled: clipboardEnabledRef.current,
      });
    } catch (cause) {
      if (attempt && attempt !== generation.current) return;
      grantPending.current = false;
      setState('failed');
      setError(
        webClientHttpStatus(cause) === 403
          ? 'authorization'
          : webClientHttpStatus(cause) === 401
            ? 'sessionExpired'
            : attempt
              ? 'transport'
              : 'configuration',
      );
      releaseGrant();
    }
  };
  useEffect(() => {
    const request = automaticConnection.current;
    if (!request.account && account && !request.attempted)
      request.account = account;
    // Do not carry an unconsumed link across an account change.
    if (request.account !== account) request.attempted = true;
    const query = new URLSearchParams(location.search);
    const target = query.get('id');
    if (
      query.get('connect') !== '1' ||
      !target?.trim() ||
      request.attempted ||
      !ready ||
      !configuration?.enabled ||
      !canConnect ||
      activeSession ||
      grantPending.current
    )
      return;
    request.attempted = true;
    void connect(target);
  }, [
    location.search,
    account,
    ready,
    configuration,
    canConnect,
    activeSession,
  ]);

  const submit = () => {
    if (!password) return;
    post({ type: 'password', password, remember: rememberPassword });
    setPassword('');
    setError('');
  };
  const chooseTool = (next: ToolName | undefined) => {
    if (next === 'input') {
      // 打开键鼠设置即暂停接管；再次点击开启才恢复，不能让idle状态自动重锁。
      keyboardCaptureEnabledRef.current = false;
      keyboardLock.current?.release();
    }
    input.current?.release();
    cancelPaste();
    releaseModifiers();
    setTool(next);
  };
  const openFiles = () => {
    if (!connected || !permissions.file || !access.canWebClientFileTransfer)
      return;
    chooseTool(undefined);
    setFileOpen(true);
  };
  const restoreCanvas = (ownedFocus: boolean) => {
    if (
      ownedFocus &&
      connected &&
      inputAllowed &&
      displayReady &&
      !document.hidden &&
      document.hasFocus()
    )
      canvas.current?.focus({ preventScroll: true });
  };
  const closeFiles = (ownedFocus: boolean) => {
    setFileOpen(false);
    restoreCanvas(ownedFocus);
  };
  useEffect(() => {
    const update = () =>
      setFullscreen(document.fullscreenElement === surface.current);
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, []);
  const toggleFullscreen = () => {
    const current = generation.current;
    const workspace = surface.current;
    const handler = input.current;
    const activationFocus = document.activeElement;
    const action =
      document.fullscreenElement === surface.current
        ? document.exitFullscreen?.()
        : surface.current?.requestFullscreen?.();
    if (!action) {
      setError('fullscreen');
      return;
    }
    void action
      .then(() => {
        if (
          document.fullscreenElement === surface.current &&
          current === generation.current &&
          input.current === handler &&
          handler &&
          !document.hidden &&
          document.hasFocus() &&
          !workspace?.querySelector('[data-tool-open="true"]') &&
          (document.activeElement === activationFocus ||
            document.activeElement === canvas.current ||
            document.activeElement === document.body)
        ) {
          canvas.current?.focus({ preventScroll: true });
          keyboardLock.current?.activate();
        }
      })
      .catch(() => {
        if (current === generation.current) setError('fullscreen');
      });
  };
  const captureShortcuts = (allowUnsupportedFullscreen = false) => {
    if (!connected || !inputAllowed || !displayReady) return;
    const api = (
      navigator as Navigator & {
        keyboard?: { lock?: unknown; unlock?: unknown };
      }
    ).keyboard;
    if ((!api?.lock || !api.unlock) && !allowUnsupportedFullscreen) {
      setKeyboardLockState('unsupported');
      return;
    }
    keyboardCaptureEnabledRef.current = true;
    keyboardLock.current?.release();
    setTool(undefined);
    input.current?.release();
    const current = generation.current;
    const workspace = surface.current;
    const owner = input.current;
    const activationFocus = document.activeElement;
    if (!workspace || !owner) return;
    const focus = () => {
      if (current !== generation.current || input.current !== owner) return;
      // 用户手势立即请求全屏；仅焦点交回等待模态动画真实结束。
      if (shortcutGuideClosing.current) {
        shortcutGuideFocus.current = focus;
        return;
      }
      const active = document.activeElement;
      if (
        current !== generation.current ||
        document.hidden ||
        !document.hasFocus() ||
        document.fullscreenElement !== workspace ||
        input.current !== owner ||
        shortcutGuideOwner.current !== undefined ||
        workspace.querySelector('[data-tool-open="true"]') ||
        (active !== activationFocus &&
          active !== canvas.current &&
          active !== document.body)
      )
        return;
      canvas.current?.focus({ preventScroll: true });
      keyboardLock.current?.activate();
    };
    if (document.fullscreenElement === workspace) {
      // 等当前点击提交菜单收起；仍由focus复核期间的新焦点和会话身份。
      queueMicrotask(focus);
      return;
    }
    try {
      const action = workspace.requestFullscreen?.();
      if (!action) {
        setError('fullscreen');
        return;
      }
      void action.then(focus).catch(() => {
        if (current === generation.current) setError('fullscreen');
      });
    } catch {
      if (current === generation.current) setError('fullscreen');
    }
  };
  const dismissShortcutGuide = (owner: number, enterFullscreen = false) => {
    if (
      owner !== generation.current ||
      shortcutGuideOwner.current !== owner ||
      !connected ||
      !inputAllowed ||
      !displayReady
    )
      return;
    const active = document.activeElement;
    const handler = input.current;
    closeShortcutGuide();
    if (enterFullscreen) {
      captureShortcuts(true);
      return;
    }
    const restore = () => {
      if (
        owner !== generation.current ||
        input.current !== handler ||
        !handler ||
        document.hidden ||
        !document.hasFocus() ||
        shortcutGuideOwner.current !== undefined
      )
        return;
      if (
        document.activeElement === active ||
        document.activeElement === document.body
      )
        canvas.current?.focus({ preventScroll: true });
    };
    if (shortcutGuideClosing.current) shortcutGuideFocus.current = restore;
    else queueMicrotask(restore);
  };
  const adjustView = (mode: 'fit' | 'original', scale = 1) => {
    cancelPaste();
    input.current?.release();
    releaseModifiers();
    setViewStyle(mode);
    const next = { scale, x: 0, y: 0 };
    setViewport(next);
    touch.current?.setViewport(next);
  };
  const updateOptions = (change: Partial<ViewOptions>) => {
    const options = { ...viewOptions, ...change };
    setViewOptions(options);
    post({ type: 'view-options', options });
    if (!options.remoteCursor && pointer.current)
      pointer.current.style.display = 'none';
  };
  const toggleClipboard = (enabled: boolean) => {
    clipboardEnabledRef.current = enabled;
    clipboardContext.current.allowed = permissions.clipboard && enabled;
    cancelPaste();
    resetClipboard();
    setClipboardEnabled(enabled);
  };
  const updateInputMapping = (change: Partial<InputMapping>) => {
    cancelPaste();
    // 先用旧映射释放所有来源的按下状态，再切换；撤权时仍由核心阻止发送。
    input.current?.release();
    touch.current?.cancel();
    releaseModifiers();
    const next = { ...inputMappingRef.current, ...change };
    inputMappingRef.current = next;
    setInputMapping(next);
  };
  const toggleReadOnly = (enabled: boolean) => {
    if (enabled) {
      keyboardCaptureEnabledRef.current = false;
      keyboardLock.current?.release();
    }
    cancelPaste();
    input.current?.release();
    releaseModifiers();
    setKeyboardOpen(false);
    post({ type: 'read-only', enabled });
    setReadOnly(enabled);
  };
  const changeResolution = (value: Resolution) => {
    if (
      !connected ||
      !inputAllowed ||
      resolutionPending ||
      !displayOptions?.supported ||
      !displayReady
    )
      return;
    cancelPaste();
    input.current?.release();
    touch.current?.cancel();
    releaseModifiers();
    setResolutionPending(true);
    setResolutionStatus('pending');
    post({
      type: 'change-resolution',
      request: ++resolutionRequest.current,
      display: selectedDisplay,
      width: value.width,
      height: value.height,
      displayGeneration: displayEpoch.current,
    });
  };
  const authenticating = ['authenticating', 'awaitingApproval'].includes(state);
  const inputReason = !permissions.keyboard
    ? text(
        'captureRemoteDenied',
        'The remote device has not allowed keyboard and mouse input.',
      )
    : readOnly
      ? text(
          'viewOnlyReason',
          'Keyboard and mouse input cannot be sent in view-only mode.',
        )
      : '';
  const keyboardApi = (
    navigator as Navigator & { keyboard?: { lock?: unknown; unlock?: unknown } }
  ).keyboard;
  const captureState = !permissions.keyboard
    ? 'remoteDenied'
    : readOnly
      ? 'viewOnly'
      : !keyboardApi?.lock || !keyboardApi.unlock
        ? 'unsupported'
        : keyboardLockState;
  const captureMessage = text(
    {
      idle: 'captureIdle',
      requesting: 'captureRequesting',
      locked: 'captureLocked',
      denied: 'captureDenied',
      unsupported: 'captureUnsupported',
      viewOnly: 'viewOnlyReason',
      remoteDenied: 'captureRemoteDenied',
    }[captureState],
    {
      idle: 'Shortcut capture is off',
      requesting: 'Enabling shortcut capture…',
      locked: 'Shortcut capture is enabled',
      denied: 'Shortcut capture could not be enabled',
      unsupported: 'This browser does not support shortcut capture',
      viewOnly: 'Keyboard and mouse input cannot be sent in view-only mode.',
      remoteDenied:
        'The remote device has not allowed keyboard and mouse input.',
    }[captureState],
  );
  const resolutionMessages: Record<string, string> = {
    pending: 'Waiting for the remote picture…',
    confirmed: 'Target resolution confirmed.',
    unconfirmed: 'Resolution change unconfirmed. Check the picture and retry.',
    rejected: 'Resolution request could not be sent.',
  };
  const hasNotices =
    !!error ||
    (connected &&
      (!permissions.keyboard || !!fileStatus.error || !!pasteStatus));
  const noticeControl = hasNotices ? (
    <button
      type="button"
      className={styles.noticeButton}
      data-error={
        !!error ||
        !!fileStatus.error ||
        pasteStatus === 'failed' ||
        pasteStatus === 'image-too-large'
      }
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
      {error ||
      fileStatus.error ||
      pasteStatus === 'failed' ||
      pasteStatus === 'image-too-large'
        ? text('errorBadge', 'Operation failed')
        : !permissions.keyboard
          ? text('viewOnlyBadge', 'View only')
          : pasteStatus === 'sent'
            ? text('pasteSentBadge', 'Paste request sent')
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
      ) : !configuration?.enabled || !canConnect ? (
        <Alert
          type="info"
          showIcon
          message={text(
            forbidden || !canConnect
              ? 'permissionRequired'
              : unavailable
                ? 'unavailable'
                : 'disabled',
            forbidden || !canConnect
              ? 'Ask an administrator for Web Client permission.'
              : unavailable
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
              data-view-style={viewStyle}
            >
              <canvas
                ref={canvas}
                tabIndex={connected && inputAllowed ? 0 : -1}
                aria-label={text(
                  'desktop',
                  'Remote desktop. Focus to send keyboard and mouse input.',
                )}
                style={{
                  maxWidth: viewStyle === 'fit' ? '100%' : 'none',
                  maxHeight: viewStyle === 'fit' ? '100%' : 'none',
                  width:
                    viewStyle === 'original' && display
                      ? display.width * viewport.scale
                      : 'auto',
                  height:
                    viewStyle === 'original' && display
                      ? display.height * viewport.scale
                      : 'auto',
                  touchAction: 'none',
                  transform:
                    'translate(' +
                    viewport.x +
                    'px, ' +
                    viewport.y +
                    'px) scale(' +
                    (viewStyle === 'original' ? 1 : viewport.scale) +
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
                                  ? state === 'checkingCredentials'
                                    ? 'Checking saved password'
                                    : state === 'automaticAuthenticating'
                                      ? 'Signing in'
                                      : state
                                  : 'Connection failed',
                          )}
                        </h2>
                      </>
                    )}
                    <p>
                      {text(
                        authenticating
                          ? 'approval'
                          : state === 'checkingCredentials'
                            ? 'checkingCredentialsHint'
                            : state === 'automaticAuthenticating'
                              ? 'automaticAuthenticationHint'
                              : activeSession
                                ? 'connectingHint'
                                : 'idleHint',
                        authenticating
                          ? 'You can also approve the connection on the remote device.'
                          : state === 'checkingCredentials'
                            ? 'Checking the saved password for this device.'
                            : state === 'automaticAuthenticating'
                              ? 'Connecting with your saved password.'
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
                        <div className={styles.authActions}>
                          <Checkbox
                            className={styles.rememberPassword}
                            checked={rememberPassword}
                            disabled={!account}
                            onChange={(event) =>
                              setRememberPassword(event.target.checked)
                            }
                          >
                            {text('rememberPassword', 'Remember password')}
                          </Checkbox>
                          <div
                            className={styles.stageActions}
                            data-stage-actions
                          >
                            <Button onClick={disconnect}>
                              {text('cancelConnection', 'Cancel connection')}
                            </Button>
                            <Button
                              type="primary"
                              onClick={submit}
                              disabled={!password}
                            >
                              {text('authenticate', 'Connect')}
                            </Button>
                          </div>
                        </div>
                        {credentialStatus === 'unavailable' && (
                          <p className={styles.credentialHint} role="status">
                            {text(
                              'credentialUnavailable',
                              'Saved passwords are unavailable in this browser.',
                            )}
                          </p>
                        )}
                      </div>
                    )}
                    {!authenticating && (
                      <div className={styles.stageActions} data-stage-actions>
                        <Button onClick={disconnect}>
                          {text('cancelConnection', 'Cancel connection')}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <Modal
              open={shortcutGuide !== undefined}
              title={text('shortcutGuideTitle', 'Use shortcuts in fullscreen')}
              getContainer={false}
              centered
              width={440}
              closable={false}
              maskClosable={false}
              focusTriggerAfterClose={false}
              className={styles.shortcutGuide}
              rootClassName={styles.shortcutGuideRoot}
              afterClose={afterShortcutGuideClose}
              afterOpenChange={(open) => {
                if (open && shortcutGuideOwner.current === generation.current)
                  (
                    surface.current?.querySelector(
                      '[data-shortcut-guide-close]',
                    ) as HTMLElement | undefined
                  )?.focus({ preventScroll: true });
              }}
              onCancel={() => {
                if (shortcutGuide !== undefined)
                  dismissShortcutGuide(shortcutGuide);
              }}
              footer={
                <>
                  <Button
                    data-shortcut-guide-close
                    onClick={() => {
                      if (shortcutGuide !== undefined)
                        dismissShortcutGuide(shortcutGuide);
                    }}
                  >
                    {text('shortcutGuideClose', 'Close')}
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => {
                      if (shortcutGuide !== undefined)
                        dismissShortcutGuide(shortcutGuide, true);
                    }}
                  >
                    {text('shortcutGuideFullscreen', 'Go fullscreen')}
                  </Button>
                </>
              }
            >
              <p className={styles.shortcutGuideBody}>
                {text(
                  'shortcutGuideBody',
                  'Fullscreen can enable shortcut capture and reduce local responses. Some system shortcuts may still be handled on this computer.',
                )}
              </p>
              <p className={styles.shortcutGuideHint}>
                {text('shortcutGuideHint', 'Shown once per connection.')}
              </p>
            </Modal>
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
              readOnly={!inputAllowed}
              fileOpen={fileOpen}
              chatOpen={advanced.chatOpen}
              callOpen={advanced.callOpen}
              qualityOpen={qualityEnabled}
              onQuality={() => setQualityEnabled(!qualityEnabled)}
              fileAllowed={permissions.file && access.canWebClientFileTransfer}
              onChat={advanced.openChat}
              onCall={() => advanced.setCallOpen(true)}
              onRecord={() =>
                advanced.recording
                  ? advanced.stopRecord()
                  : void advanced.startRecord()
              }
              unread={advanced.unread}
              callActive={['preparing', 'requesting', 'active'].includes(
                advanced.callState,
              )}
              recording={advanced.recording}
              recordingAllowed={permissions.recording && displayReady}
              recordPreparing={advanced.recordPreparing}
              recordPhase={advanced.recordPhase}
              text={text}
            >
              <div hidden={tool !== 'session'} data-session-options>
                <h3>{text('sessionOptions', 'Session')}</h3>
                <section className={styles.menuGroup}>
                  <h4>{text('sessionMode', 'Session mode')}</h4>
                  <fieldset
                    className={styles.menuSegments}
                    aria-label={text('sessionMode', 'Session mode')}
                  >
                    <Button
                      aria-pressed={inputAllowed}
                      disabled={!permissions.keyboard}
                      onClick={() => toggleReadOnly(false)}
                    >
                      {text('controlMode', 'Control')}
                    </Button>
                    <Button
                      aria-pressed={!inputAllowed}
                      onClick={() => toggleReadOnly(true)}
                    >
                      {text('viewOnlyMode', 'View only')}
                    </Button>
                  </fieldset>
                  {(readOnly || !permissions.keyboard) && (
                    <p className={styles.toolHelp}>{inputReason}</p>
                  )}
                  <div className={styles.menuRow}>
                    <span>{text('clipboardSync', 'Clipboard sync')}</span>
                    <Switch
                      size="small"
                      aria-label={text('clipboardSync', 'Clipboard sync')}
                      checked={clipboardEnabled}
                      disabled={!permissions.clipboard}
                      onChange={toggleClipboard}
                    />
                  </div>
                  {!permissions.clipboard && (
                    <p className={styles.toolHelp}>
                      {text(
                        'clipboardDenied',
                        'Clipboard is disabled by the remote device.',
                      )}
                    </p>
                  )}
                </section>
                <section className={styles.menuGroup}>
                  <h4>{text('remoteActions', 'Remote actions')}</h4>
                  <div className={styles.menuActions}>
                    <Button
                      disabled={!inputAllowed || !displayReady || !sasEnabled}
                      title={
                        !inputAllowed
                          ? inputReason
                          : !sasEnabled
                            ? text(
                                'sasUnavailable',
                                'The remote client does not support Ctrl+Alt+Del.',
                              )
                            : undefined
                      }
                      onClick={() =>
                        post({
                          type: 'input',
                          input: {
                            keyEvent: {
                              controlKey: hbb.ControlKey.CtrlAltDel,
                              down: true,
                              mode: hbb.KeyboardMode.Legacy,
                            },
                          },
                        })
                      }
                    >
                      Ctrl+Alt+Del
                    </Button>
                    <Button
                      disabled={!inputAllowed || !displayReady}
                      title={!inputAllowed ? inputReason : undefined}
                      onClick={() =>
                        post({
                          type: 'input',
                          input: {
                            keyEvent: {
                              controlKey: hbb.ControlKey.LockScreen,
                              down: true,
                              mode: hbb.KeyboardMode.Legacy,
                            },
                          },
                        })
                      }
                    >
                      {text('lockScreen', 'Lock remote screen')}
                    </Button>
                  </div>
                </section>
                <section className={styles.menuGroup}>
                  <div className={styles.menuRow}>
                    <span>
                      {text(
                        credentialStatus === 'saved'
                          ? 'credentialSaved'
                          : 'credentialNone',
                        credentialStatus === 'saved'
                          ? 'Device password saved in this browser'
                          : 'No saved device password',
                      )}
                    </span>
                    {credentialStatus === 'saved' && (
                      <Button
                        size="small"
                        onClick={() => {
                          setRememberPassword(false);
                          post({ type: 'forget-password' });
                        }}
                      >
                        {text('forgetPassword', 'Forget password')}
                      </Button>
                    )}
                  </div>
                  {credentialStatus === 'unavailable' && (
                    <p className={styles.toolHelp} role="status">
                      {text(
                        'credentialUnavailable',
                        'Saved passwords are unavailable in this browser.',
                      )}
                    </p>
                  )}
                  {credentialStatus === 'forgotten' && (
                    <p className={styles.toolHelp} role="status">
                      {text('credentialForgotten', 'Saved password cleared.')}
                    </p>
                  )}
                  <details className={styles.menuDetails}>
                    <summary>
                      {text('connectionDetails', 'Connection details')}
                    </summary>
                    <dl className={styles.connectionInfo}>
                      <dt>{text('id', 'Remote device ID')}</dt>
                      <dd>{id}</dd>
                      <dt>{text('remoteVersion', 'Remote client')}</dt>
                      <dd>{peerVersion || '—'}</dd>
                      <dt>{text('display', 'Monitor')}</dt>
                      <dd>
                        {display
                          ? `${selectedDisplay + 1} · ${display.width} × ${display.height}`
                          : '—'}
                      </dd>
                      <dt>{text('encryption', 'Encryption')}</dt>
                      <dd>
                        {kxVersion === undefined
                          ? '—'
                          : kxVersion === 0
                            ? text('legacyBadge', 'Legacy encryption')
                            : text('newEncryption', 'New key exchange')}
                      </dd>
                      <dt>{text('connectionRoute', 'Connection')}</dt>
                      <dd>{text('relayConnection', 'Encrypted relay')}</dd>
                    </dl>
                    {kxVersion === 0 && (
                      <LegacyEncryptionNotice
                        text={text}
                        version={peerVersion}
                      />
                    )}
                  </details>
                </section>
              </div>
              <div hidden={tool !== 'display'}>
                <h3>{text('displayOptions', 'Display')}</h3>
                <section className={styles.menuGroup}>
                  <h4>{text('imageSettings', 'Image quality')}</h4>
                  <FrameRate
                    value={viewOptions.fps}
                    onCommit={(fps) => updateOptions({ fps })}
                    text={text}
                  />
                  <label className={styles.menuRow}>
                    <span>{text('quality', 'Image quality')}</span>
                    <select
                      className={styles.select}
                      aria-label={text('quality', 'Image quality')}
                      value={viewOptions.quality}
                      onChange={(event) =>
                        updateOptions({
                          quality: event.target.value as ViewOptions['quality'],
                        })
                      }
                    >
                      <option value="low">
                        {text('qualityLow', 'Low bandwidth')}
                      </option>
                      <option value="balanced">
                        {text('qualityBalanced', 'Balanced')}
                      </option>
                      <option value="best">
                        {text('qualityBest', 'Best quality')}
                      </option>
                      <option value="custom">
                        {text('qualityCustom', 'Custom')}
                      </option>
                    </select>
                  </label>
                  {viewOptions.quality === 'custom' && (
                    <CustomQuality
                      value={viewOptions.customQuality ?? 50}
                      onCommit={(customQuality) =>
                        updateOptions({ customQuality })
                      }
                      text={text}
                    />
                  )}
                  <details className={styles.menuDetails}>
                    <summary>
                      {text('codecSettings', 'Codec and true color')}
                    </summary>
                    <label className={styles.menuRow}>
                      <span>{text('codecPreference', 'Codec')}</span>
                      <select
                        className={styles.select}
                        aria-label={text('codecPreference', 'Codec')}
                        value={advanced.prefer}
                        onChange={(event) =>
                          advanced.updateCodec(
                            event.target.value as
                              | 'auto'
                              | 'vp9'
                              | 'vp8'
                              | 'av1',
                            advanced.trueColor,
                          )
                        }
                      >
                        <option value="auto">
                          {text('codecAuto', 'Automatic')}
                        </option>
                        {(['vp9', 'vp8', 'av1'] as const).map((codec) => (
                          <option
                            key={codec}
                            value={codec}
                            disabled={
                              !advanced.capabilities[codec] ||
                              (codec !== 'vp9' && !advanced.encoding?.[codec])
                            }
                          >
                            {codec.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className={styles.menuRow}>
                      <span>{text('trueColor', 'True color 4:4:4')}</span>
                      <Switch
                        size="small"
                        aria-label={text('trueColor', 'True color 4:4:4')}
                        checked={advanced.trueColor}
                        disabled={
                          !supportsTrueColor(
                            advanced.capabilities,
                            advanced.prefer,
                            advanced.encoding,
                          )
                        }
                        onChange={(color) =>
                          advanced.updateCodec(advanced.prefer, color)
                        }
                      />
                    </div>
                    {!supportsTrueColor(
                      advanced.capabilities,
                      advanced.prefer,
                      advanced.encoding,
                    ) && (
                      <p className={styles.toolHelp}>
                        {text(
                          'trueColorUnavailable',
                          'This browser and remote device cannot use true color with this codec.',
                        )}
                      </p>
                    )}
                    <p className={styles.actualFormat}>
                      {text('codecActual', 'Receiving')}:{' '}
                      <strong>
                        {advanced.format
                          ? `${advanced.format.codec.toUpperCase()} ${advanced.format.chroma || '—'}`
                          : '—'}
                      </strong>
                    </p>
                    <p className={styles.toolHelp}>
                      {text(
                        'trueColorHint',
                        '4:4:4 takes effect when the remote device and other connected clients support it.',
                      )}
                    </p>
                  </details>
                </section>
                <section className={styles.menuGroup}>
                  <h4>{text('pictureSettings', 'Picture')}</h4>
                  {displays.length > 1 && (
                    <label className={styles.menuRow}>
                      <span>{text('display', 'Monitor')}</span>
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
                              [item.x, item.y, item.width, item.height].join(
                                ':',
                              )
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
                  <fieldset
                    className={styles.menuSegments}
                    aria-label={text('viewMode', 'View mode')}
                  >
                    <Button
                      aria-pressed={viewStyle === 'fit'}
                      onClick={() => adjustView('fit', viewport.scale)}
                    >
                      {text('fitWindow', 'Fit window')}
                    </Button>
                    <Button
                      aria-pressed={viewStyle === 'original'}
                      onClick={() => adjustView('original', viewport.scale)}
                    >
                      {text('originalSize', 'Original size')}
                    </Button>
                  </fieldset>
                  <label className={styles.menuRow}>
                    <span>{text('zoom', 'Zoom')}</span>
                    <select
                      className={styles.select}
                      aria-label={text('zoom', 'Zoom')}
                      value={
                        [0.5, 0.75, 1, 1.25, 1.5, 2].includes(viewport.scale)
                          ? viewport.scale
                          : ''
                      }
                      onChange={(event) =>
                        adjustView(viewStyle, Number(event.target.value))
                      }
                    >
                      {![0.5, 0.75, 1, 1.25, 1.5, 2].includes(
                        viewport.scale,
                      ) && (
                        <option value="">
                          {Math.round(viewport.scale * 100)}%
                        </option>
                      )}
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map((scale) => (
                        <option key={scale} value={scale}>
                          {Math.round(scale * 100)}%
                        </option>
                      ))}
                    </select>
                  </label>
                  <ResolutionOptions
                    options={displayOptions}
                    current={display}
                    disabled={
                      !connected ||
                      !inputAllowed ||
                      !displayReady ||
                      !displayOptions?.supported ||
                      !displayOptions.resolutions.length ||
                      resolutionPending
                    }
                    status={
                      resolutionStatus
                        ? text(
                            `resolution.${resolutionStatus}`,
                            resolutionMessages[resolutionStatus] || '',
                          )
                        : !inputAllowed
                          ? inputReason
                          : !displayOptions?.supported ||
                              !displayOptions.resolutions.length
                            ? text(
                                'resolutionUnavailable',
                                'No supported resolutions reported.',
                              )
                            : ''
                    }
                    onChange={changeResolution}
                    text={text}
                  />
                  <div className={styles.menuActions}>
                    <Button onClick={() => adjustView(viewStyle)}>
                      {text('zoomReset', 'Reset zoom')}
                    </Button>
                    <Button onClick={() => post({ type: 'refresh' })}>
                      {text('refreshFrame', 'Refresh desktop')}
                    </Button>
                  </div>
                </section>
                <section className={styles.menuGroup}>
                  <h4>{text('cursorSettings', 'Cursor')}</h4>
                  <div className={styles.menuRow}>
                    <span>{text('remoteCursor', 'Remote cursor')}</span>
                    <Switch
                      size="small"
                      aria-label={text('remoteCursor', 'Remote cursor')}
                      checked={viewOptions.remoteCursor}
                      onChange={(checked) =>
                        updateOptions({ remoteCursor: checked })
                      }
                    />
                  </div>
                  <div className={styles.menuRow}>
                    <span>{text('zoomCursor', 'Zoom cursor')}</span>
                    <Switch
                      size="small"
                      aria-label={text('zoomCursor', 'Zoom cursor')}
                      checked={zoomCursor}
                      onChange={setZoomCursor}
                    />
                  </div>
                </section>
              </div>
              <div id="web-client-tool-input" hidden={tool !== 'input'}>
                <h3>{text('toolInput', 'Keyboard and mouse')}</h3>
                <section className={styles.menuGroup}>
                  <h4>{text('captureSection', 'Shortcuts')}</h4>
                  <div
                    className={styles.captureStatus}
                    data-locked={captureState === 'locked'}
                    role="status"
                    data-keyboard-lock={captureState}
                  >
                    {captureMessage}
                  </div>
                  {!['unsupported', 'viewOnly', 'remoteDenied'].includes(
                    captureState,
                  ) && (
                    <div className={styles.menuActions}>
                      <Button
                        disabled={
                          !inputAllowed ||
                          !displayReady ||
                          captureState === 'requesting'
                        }
                        onClick={() => {
                          if (captureState === 'locked') {
                            keyboardCaptureEnabledRef.current = false;
                            keyboardLock.current?.release();
                          } else captureShortcuts();
                        }}
                      >
                        {captureState === 'requesting'
                          ? text('capturePendingAction', 'Enabling…')
                          : captureState === 'denied'
                            ? text('captureRetry', 'Retry')
                            : captureState === 'locked'
                              ? text('captureDisable', 'Disable capture')
                              : fullscreen
                                ? text('captureEnable', 'Enable capture')
                                : text(
                                    'captureEnterFullscreen',
                                    'Fullscreen and enable',
                                  )}
                      </Button>
                    </div>
                  )}
                  <p className={styles.toolHelp}>
                    {text(
                      'captureNonFullscreenHint',
                      'Outside fullscreen: some shortcuts may act on this computer or browser.',
                    )}
                  </p>
                  <p className={styles.toolHelp}>
                    {text(
                      'captureFullscreenHint',
                      'Fullscreen with capture enabled: more shortcuts can be sent to the remote device.',
                    )}
                  </p>
                  <p className={styles.panelHint}>
                    {captureState === 'unsupported'
                      ? text(
                          'captureUnsupportedHint',
                          'Use the screen keyboard to send keys.',
                        )
                      : text(
                          'captureSystemHint',
                          'Some system shortcuts may still act on this computer.',
                        )}
                  </p>
                </section>
                <section className={styles.menuGroup}>
                  <h4>{text('inputMappings', 'Keyboard and mouse mapping')}</h4>
                  {(
                    [
                      ['reverseWheel', 'Reverse mouse wheel'],
                      ['swapButtons', 'Swap left and right mouse buttons'],
                      ['swapControlCommand', 'Swap Ctrl/Command'],
                    ] as const
                  ).map(([key, fallback]) => (
                    <div className={styles.menuRow} key={key}>
                      <span>{text(key, fallback)}</span>
                      <Switch
                        size="small"
                        aria-label={text(key, fallback)}
                        checked={inputMapping[key]}
                        disabled={!inputAllowed || !displayReady}
                        onChange={(enabled) =>
                          updateInputMapping({ [key]: enabled })
                        }
                      />
                    </div>
                  ))}
                  <div className={styles.menuActions}>
                    <Button
                      disabled={!inputAllowed || !displayReady}
                      onClick={() => {
                        chooseTool(undefined);
                        setKeyboardOpen(true);
                      }}
                    >
                      {text('screenKeyboard', 'Screen keyboard')}
                    </Button>
                  </div>
                </section>
                <section className={styles.menuGroup}>
                  <label className={styles.menuRow}>
                    <span>{text('touchMode', 'Touch mode')}</span>
                    <select
                      className={styles.select}
                      aria-label={text('touchMode', 'Touch mode')}
                      value={touchMode}
                      disabled={!inputAllowed || !displayReady}
                      onChange={(event) => {
                        input.current?.release();
                        releaseModifiers();
                        touch.current?.cancel();
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
                  <details className={styles.menuDetails}>
                    <summary>{text('touchHelp', 'Touch help')}</summary>
                    <p className={styles.toolHelp}>
                      {text(
                        'touchNotice',
                        'Touch to click, move to drag, hold for right click. Pinch with two fingers to zoom locally; use Scroll mode for the remote wheel. Send keyboard text after IME composition.',
                      )}
                    </p>
                  </details>
                </section>
              </div>
              <div id="web-client-tool-audio" hidden={tool !== 'audio'}>
                <h3>{text('toolAudio', 'Audio')}</h3>
                <div className={styles.menuRow}>
                  <span>{text('audioStart', 'Play audio')}</span>
                  <Switch
                    size="small"
                    aria-label={text('audioStart', 'Play audio')}
                    checked={audioEnabled}
                    disabled={!audioSupported || !permissions.audio}
                    onChange={() => void toggleAudio()}
                  />
                </div>
                <div className={styles.menuRow}>
                  <span>{text('mute', 'Mute')}</span>
                  <Switch
                    size="small"
                    aria-label={text('mute', 'Mute')}
                    checked={muted}
                    disabled={!audioEnabled}
                    onChange={(value) => {
                      setMuted(value);
                      player.current?.volume(value ? 0 : volume);
                    }}
                  />
                </div>
                <label className={styles.customQuality}>
                  <span>
                    {text('volume', 'Volume')}
                    <output>{Math.round(volume * 100)}%</output>
                  </span>
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
                </label>
                <p className={styles.toolHelp}>
                  {!permissions.audio
                    ? text(
                        'audioDenied',
                        'Audio is disabled by the remote device.',
                      )
                    : !audioSupported
                      ? text(
                          'audioUnavailable',
                          'Opus audio decoding is unavailable in this browser.',
                        )
                      : text(
                          'audioHint',
                          'Start playback when you want to hear the remote device. Playback stops when the session ends.',
                        )}
                </p>
              </div>
            </SessionToolbar>
            <FileDialog
              open={fileOpen}
              target={id}
              onClose={closeFiles}
              status={fileStatus}
              onConnect={() => files.current?.connect()}
              onDisconnectFile={() => files.current?.disconnect()}
              text={text}
            >
              <FilePanel
                key={'files-' + generation.current}
                ref={files}
                open={fileOpen}
                enabled={
                  connected &&
                  permissions.file &&
                  access.canWebClientFileTransfer
                }
                parentGuid={grant.current.current()?.sessionGuid}
                post={post}
                text={text}
                onStatusChange={setFileStatus}
              />
            </FileDialog>
            <ScreenKeyboard
              ref={screenKeyboard}
              open={keyboardOpen}
              allowed={connected && inputAllowed && displayReady}
              reason={inputReason}
              revision={[
                generation.current,
                displayEpoch.current,
                inputMapping.reverseWheel,
                inputMapping.swapButtons,
                inputMapping.swapControlCommand,
              ].join(':')}
              send={(value) => {
                post({ type: 'input', input: value });
                return !!worker.current;
              }}
              sendText={(value) => post({ type: 'text', text: value })}
              onClose={(ownedFocus) => {
                setKeyboardOpen(false);
                restoreCanvas(ownedFocus);
              }}
              text={text}
            />
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
              {connected && (readOnly || !permissions.keyboard) && (
                <span
                  className={styles.sessionMode}
                  title={inputReason}
                  role="status"
                >
                  {text('viewOnlyMode', 'View only')}
                </span>
              )}
              {kxVersion === 0 && (
                <LegacyEncryptionNotice text={text} version={peerVersion} />
              )}
              {connected && fileStatus.legacy && !fileOpen && (
                <LegacyEncryptionNotice text={text} context="files" />
              )}
              {noticeControl}
            </div>
          )}
          <AdvancedDialogs
            tools={advanced}
            connected={connected}
            audioAllowed={permissions.audio}
            onClose={(_, ownedFocus) => restoreCanvas(ownedFocus)}
            text={text}
          />
          <div className={styles.sessionActivities}>
            {connected &&
              ['preparing', 'requesting', 'active'].includes(
                advanced.callState,
              ) &&
              !advanced.callOpen && (
                <div
                  className={styles.callStatus}
                  role="status"
                  data-call-status
                >
                  <span>
                    {text(
                      advanced.callState === 'preparing'
                        ? 'callPreparing'
                        : advanced.callState === 'requesting'
                          ? 'callRequesting'
                          : 'callActive',
                      advanced.callState === 'active'
                        ? 'Call active'
                        : advanced.callState === 'preparing'
                          ? 'Preparing microphone…'
                          : 'Waiting for the call…',
                    )}
                  </span>
                  {advanced.callState === 'active' && (
                    <span>
                      {text(
                        advanced.microphoneMuted
                          ? 'microphoneMuted'
                          : 'microphoneLive',
                        advanced.microphoneMuted
                          ? 'Microphone muted'
                          : 'Microphone on',
                      )}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => advanced.setCallOpen(true)}
                  >
                    {text('callShow', 'Show call')}
                  </button>
                  <button type="button" onClick={() => advanced.endCall()}>
                    {text('callHangup', 'End call')}
                  </button>
                </div>
              )}
            {connected &&
              (advanced.recordPhase !== 'idle' || advanced.recordNotice) && (
                <div
                  className={styles.recordStatus}
                  role="status"
                  data-record-status
                >
                  {advanced.recordPhase === 'recording' && (
                    <>
                      <i />
                      <span>
                        {text('recording', 'Recording')}{' '}
                        {Math.floor(advanced.recordSeconds / 60)
                          .toString()
                          .padStart(2, '0')}
                        :
                        {(advanced.recordSeconds % 60)
                          .toString()
                          .padStart(2, '0')}
                      </span>
                      <button type="button" onClick={advanced.stopRecord}>
                        {text('recordStop', 'Stop recording')}
                      </button>
                    </>
                  )}
                  {advanced.recordNotice &&
                    advanced.recordPhase !== 'saving' && (
                      <span>
                        {text(advanced.recordNotice, advanced.recordNotice)}
                      </span>
                    )}
                  {advanced.recordPhase !== 'recording' &&
                    advanced.recordPhase !== 'idle' && (
                      <>
                        <span>
                          {advanced.recordPhase === 'choosing'
                            ? text(
                                'recordChoosing',
                                'Choose a recording save location…',
                              )
                            : advanced.recordPhase === 'stopping'
                              ? text('recordStopping', 'Stopping recording…')
                              : text('recordSaving', 'Saving recording…')}
                        </span>
                        <button type="button" onClick={advanced.cancelRecord}>
                          {text('recordCancel', 'Cancel recording')}
                        </button>
                      </>
                    )}
                </div>
              )}
          </div>
          {connected && qualityEnabled && (
            <QualityMonitor
              reading={qualityReading}
              sessionGuid={grant.current.current()?.sessionGuid}
              format={advanced.format}
              display={display}
              ready={displayReady}
              onClose={() => {
                const ownedFocus =
                  document.activeElement instanceof Element &&
                  !!document.activeElement.closest('[data-quality-monitor]');
                setQualityEnabled(false);
                resetQuality();
                restoreCanvas(ownedFocus);
              }}
              text={text}
            />
          )}
          {activeSession && clipboardEnabled && clipboardFallback && (
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
                    pasteStatus ? `paste.${pasteStatus}` : 'pasteHint',
                    pasteStatus === 'image-too-large'
                      ? 'This image is too large to paste. Reduce its size or use file transfer.'
                      : pasteStatus === 'failed'
                        ? 'Paste failed. Check the content and try again.'
                        : pasteStatus === 'denied'
                          ? 'The remote device has disabled clipboard or keyboard access.'
                          : pasteStatus === 'sending'
                            ? 'Sending clipboard…'
                            : pasteStatus === 'sent'
                              ? 'Paste request sent. Check the remote result.'
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
                message={fileErrorMessage(fileStatus.error, text)}
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
