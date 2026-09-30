import { PageContainer } from '@ant-design/pro-components';
import { useIntl, useLocation, useModel } from '@umijs/max';
import { Alert, Button, Card, Input, Space, Spin, Tag, Typography } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { AudioPlayer } from '@/features/web-client/media/audio-player';
import { MAX_TEXT_BYTES } from '@/features/web-client/clipboard/text';
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
import { FilePanel, type FilePanelHandle } from './files';
import { ImageClipboard } from './images';

export default function WebClientPage() {
  const intl = useIntl();
  const text = (key: string, fallback: string) =>
    intl.formatMessage({ id: `webClient.${key}`, defaultMessage: fallback });
  const location = useLocation();
  const { configuration, loading, unavailable, reload } = useModel('webClient');
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
  const [localText, setLocalText] = useState('');
  const [remoteText, setRemoteText] = useState('');
  const [remoteImage, setRemoteImage] = useState<Uint8Array>();
  const [clipboardFallback, setClipboardFallback] = useState(false);
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
    stopAudio();
    files.current?.dispose();
    releaseModifiers();
    setSoftText('');
    input.current?.release();
    ++generation.current;
    post({ type: 'disconnect' });
    setState('closed');
    setKxVersion(undefined);
    setDisplay(undefined);
    setDisplayReady(false);
    setDisplays([]);
    setPassword('');
    setLocalText('');
    setRemoteText('');
    setRemoteImage(undefined);
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
            stopAudio();
            files.current?.dispose();
            releaseModifiers();
            setSoftText('');
            setError('worker');
            setState('failed');
            setKxVersion(undefined);
            setReady(false);
            setPassword('');
            setRemoteText('');
            setRemoteImage(undefined);
            setLocalText('');
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
            setState(message.state);
            if (message.state === 'failed' || message.state === 'closed') {
              stopAudio();
              files.current?.dispose();
              releaseModifiers();
              setSoftText('');
              setKxVersion(undefined);
              setPassword('');
              setRemoteText('');
              setRemoteImage(undefined);
              setLocalText('');
              cursors.clear();
              clearDisplay();
            }
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
            setPermissions(message.permissions);
            if (!message.permissions.keyboard) releaseModifiers();
            if (!message.permissions.audio) stopAudio();
            if (!message.permissions.clipboard) {
              setRemoteText('');
              setRemoteImage(undefined);
            }
          } else if (message.type === 'peer') {
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
          } else if (message.type === 'image') setRemoteImage(message.bytes);
          else if (message.type === 'clipboard') setRemoteText(message.text);
          else if (message.type === 'cursor') {
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
            marker.style.left = `${element.offsetLeft + x * element.clientWidth}px`;
            marker.style.top = `${element.offsetTop + y * element.clientHeight}px`;
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
      setLocalText('');
      setRemoteText('');
      setRemoteImage(undefined);
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
    const pause = () => {
      if (document.hidden) {
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
    window.addEventListener('blur', releaseModifiers);
    return () => {
      window.removeEventListener('orientationchange', reset);
      window.removeEventListener('blur', releaseModifiers);
    };
  }, []);
  const connect = () => {
    if (!configuration?.enabled || !ready) return;
    try {
      const target = normalizeTargetId(id);
      ++generation.current;
      displayEpoch.current = 0;
      setViewport({ scale: 1, x: 0, y: 0 });
      touch.current?.setViewport({ scale: 1, x: 0, y: 0 });
      setSoftText('');
      setState('connecting');
      setKxVersion(undefined);
      setError('');
      setPassword('');
      setRemoteText('');
      setRemoteImage(undefined);
      setLocalText('');
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
    } catch {
      setError('configuration');
    }
  };
  const submit = () => {
    post({ type: 'password', password });
    setPassword('');
    setError('');
  };
  const copyRemote = async () => {
    try {
      await navigator.clipboard.writeText(remoteText);
      setClipboardFallback(false);
    } catch {
      setClipboardFallback(true);
    }
  };

  return (
    <PageContainer title={text('title', 'Web Client')}>
      {loading ? (
        <Spin />
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
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Card size="small">
            <Space wrap>
              <Input
                aria-label={text('id', 'Remote ID')}
                placeholder={text('id', 'Remote ID')}
                value={id}
                onChange={(event) => setId(event.target.value)}
                onPressEnter={connect}
                disabled={activeSession}
                maxLength={256}
                style={{ width: 250 }}
              />
              <Button
                type="primary"
                onClick={connect}
                disabled={!ready || activeSession}
              >
                {text('connect', 'Connect')}
              </Button>
              <Button onClick={disconnect} disabled={!activeSession}>
                {text('disconnect', 'Disconnect')}
              </Button>
              <Tag color={connected ? 'green' : undefined}>
                {text(`state.${state}`, state)}
              </Tag>
              {connected && (
                <>
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
                </>
              )}
              {connected && displays.length > 1 && (
                <label>
                  {text('display', 'Monitor')}
                  <select
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
              {connected && (
                <Button
                  onClick={() => {
                    if (!surface.current?.requestFullscreen) {
                      setError('fullscreen');
                      return;
                    }
                    void surface.current
                      .requestFullscreen()
                      .catch(() => setError('fullscreen'));
                  }}
                >
                  {text('fullscreen', 'Fullscreen')}
                </Button>
              )}
            </Space>
            <Typography.Paragraph
              type="secondary"
              style={{ marginTop: 12, marginBottom: 0 }}
            >
              {text(
                'notice',
                'Connects through the configured server. The remote device must approve the session or accept its own password. Extensions require remote permissions and browser support.',
              )}
            </Typography.Paragraph>
          </Card>
          {error && (
            <Alert
              type={error === 'password' ? 'warning' : 'error'}
              showIcon
              message={text(
                `error.${error}`,
                'The operation failed. Disconnect and try again.',
              )}
            />
          )}
          {['authenticating', 'awaitingApproval'].includes(state) && (
            <Card size="small">
              <Space wrap>
                <Input.Password
                  aria-label={text('password', 'Remote device password')}
                  placeholder={text('password', 'Remote device password')}
                  autoComplete="off"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  onPressEnter={submit}
                  maxLength={4096}
                />
                <Button onClick={submit} disabled={!password}>
                  {text('authenticate', 'Send password')}
                </Button>
                <Typography.Text type="secondary">
                  {text(
                    'approval',
                    'You can also approve the connection on the remote device.',
                  )}
                </Typography.Text>
              </Space>
            </Card>
          )}
          <div
            ref={surface}
            style={{
              height: '70dvh',
              minHeight: 260,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              background: '#111827',
              borderRadius: 6,
            }}
          >
            {connected && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  padding: 8,
                  color: 'white',
                  flexShrink: 0,
                }}
              >
                <label>
                  {text('touchMode', 'Touch mode')}{' '}
                  <select
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
                  onClick={() => setSoftKeyboard(!softKeyboard)}
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
                  <Space wrap>
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
            )}
            {activeSession && kxVersion === 0 && (
              <Alert
                type="warning"
                showIcon
                style={{ flexShrink: 0 }}
                message={text(
                  'legacyEncryption',
                  'The remote device uses a legacy encryption protocol with known security risks. Upgrade the remote client when possible.',
                )}
              />
            )}
            {connected && !permissions.keyboard && (
              <Alert
                type="warning"
                showIcon
                style={{ flexShrink: 0 }}
                message={text(
                  'keyboardDenied',
                  'Keyboard and mouse are disabled by the remote device. Previously held keys or buttons may remain pressed; restore permission or press and release them on the remote device.',
                )}
              />
            )}
            <div
              style={{
                position: 'relative',
                flex: 1,
                minHeight: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
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
                style={{
                  display: 'none',
                  position: 'absolute',
                  width: 8,
                  height: 8,
                  border: '1px solid white',
                  background: '#fa541c',
                  borderRadius: '50%',
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>
          <Typography.Text type="secondary">
            {text(
              'touchNotice',
              'Touch to click, move to drag, hold for right click. Pinch with two fingers to zoom locally; use Scroll mode for the remote wheel. Send keyboard text after IME composition.',
            )}
          </Typography.Text>
          <FilePanel
            key={`files-${generation.current}`}
            ref={files}
            enabled={connected}
            post={post}
            text={text}
          />
          <ImageClipboard
            key={`images-${generation.current}`}
            enabled={connected && permissions.clipboard}
            remote={remoteImage}
            post={post}
            text={text}
            fail={() => setError('clipboard')}
          />
          <Card size="small" title={text('clipboard', 'Text clipboard')}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {!permissions.clipboard && (
                <Alert
                  type="warning"
                  message={text(
                    'clipboardDenied',
                    'Clipboard is disabled by the remote device.',
                  )}
                />
              )}
              <Input.TextArea
                aria-label={text('localText', 'Local text')}
                placeholder={text('localText', 'Paste local text here')}
                value={localText}
                onChange={(event) => setLocalText(event.target.value)}
                maxLength={MAX_TEXT_BYTES}
                autoSize={{ minRows: 2, maxRows: 6 }}
              />
              <Space wrap>
                <Button
                  disabled={!connected || !permissions.clipboard}
                  onClick={() =>
                    post({
                      type: 'clipboard',
                      text: localText,
                    })
                  }
                >
                  {text('sendClipboard', 'Send to remote clipboard')}
                </Button>
                <Button
                  disabled={!connected || !permissions.keyboard || !localText}
                  onClick={() =>
                    post({
                      type: 'text',
                      text: localText,
                    })
                  }
                >
                  {text('sendText', 'Send text as input')}
                </Button>
              </Space>
              <Input.TextArea
                aria-label={text('remoteText', 'Remote clipboard text')}
                placeholder={text('remoteText', 'Remote clipboard text')}
                value={remoteText}
                readOnly
                autoSize={{ minRows: 2, maxRows: 6 }}
              />
              <Button
                disabled={!connected || !permissions.clipboard}
                onClick={() => void copyRemote()}
              >
                {text('copyRemote', 'Copy remote text')}
              </Button>
              {clipboardFallback && (
                <Typography.Text>
                  {text(
                    'clipboardFallback',
                    'Clipboard access was denied. Select and copy the remote text in the box manually.',
                  )}
                </Typography.Text>
              )}
            </Space>
          </Card>
        </Space>
      )}
    </PageContainer>
  );
}
