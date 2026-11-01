import { clipboardPng } from '../clipboard/image';
import { RemotePaste } from '../clipboard/paste';
import {
  decodeText,
  decompressBounded,
  encodeText,
  MAX_TEXT_BYTES,
} from '../clipboard/text';
import { validChat } from '../core/chat';
import { cryptoReady } from '../core/crypto';
import { gatewaySocketFactory } from '../core/gateway';
import type { SocketFactory } from '../core/transport';
import { DisplayCatalog, validFrameSize } from '../core/display';
import type { ServerProfile } from '../core/profile';
import { RemoteSession } from '../core/session';
import { RememberedCredentials } from '../core/remembered-credentials';
import { FileTransfer } from '../files/transfer';
import { OpusDecoder } from '../media/opus';
import { av1Format } from '../media/av1-format';
import { LatencyWindow } from '../media/video-diagnostics';
import { type RecordingReason, StreamRecorder } from '../media/recorder';
import {
  decoderConfig,
  type VideoCapabilities,
  type VideoFormat,
  videoBatch,
  videoCapabilities,
  vp9Format,
} from '../media/video-codecs';
import { VOICE_LIMITS, VoiceEncoder } from '../media/voice';
import {
  type VideoDiagnostic,
  videoFailureDiagnostic,
  Vp9Decoder,
} from '../media/vp9-decoder';
import { hbb } from '../protocol';
import type { Command, SessionEvent } from './contract';

// Console token不进入Worker；派生设备凭据只在Worker本地加密保存。
const post = (data: SessionEvent) =>
  globalThis.postMessage({ ...data, generation });
let decoder: Vp9Decoder | undefined;
let pendingFrame: VideoFrame | undefined;
let presenting = false;
let display = 0;
let displays: hbb.IDisplayInfo[] = [];
let displayCatalog = new DisplayCatalog();
let resolutionRequest = 0;
let pendingResolution:
  | {
      request: number;
      generation: number;
      display: number;
      identity: string;
      sentGeneration: number;
      width: number;
      height: number;
      geometrySeen: boolean;
    }
  | undefined;
let resolutionTimer: ReturnType<typeof setTimeout> | undefined;
let presentedResolutionFrame = false;
function finishResolution(status: 'confirmed' | 'unconfirmed' | 'cancelled') {
  if (!pendingResolution) return;
  const request = pendingResolution.request;
  pendingResolution = undefined;
  clearTimeout(resolutionTimer);
  resolutionTimer = undefined;
  post({ type: 'resolution-status', request, status, displayGeneration });
}
function updateDisplayOptions(geometry = false) {
  const options = displayCatalog.get(display);
  if (pendingResolution) {
    if (
      pendingResolution.generation !== generation ||
      pendingResolution.display !== display ||
      pendingResolution.identity !== options.identity
    )
      finishResolution('cancelled');
    else if (
      geometry &&
      displayGeneration > pendingResolution.sentGeneration &&
      displays[display]?.width === pendingResolution.width &&
      displays[display]?.height === pendingResolution.height
    )
      pendingResolution.geometrySeen = true;
  }
  post({ type: 'display-options', options, displayGeneration });
}
let displayGeneration = 0;
let awaitingDisplay = false;
let inputReady = false;
let decoded = 0;
let generation = 0;
let videoSupported = false;
let capabilities: VideoCapabilities = {
  vp9: false,
  vp8: false,
  av1: false,
  vp9_444: false,
  av1_444: false,
};
let pendingFrameAt = 0;
let presentingAt: number | undefined;
const presentationLatency = new LatencyWindow();
let droppedPresentation = 0;
let recoveryCount = 0;
let saturationAttempts = 0;
const VIDEO_TASK_FRAME_BUDGET = 4;
const VIDEO_TASK_YIELD_MS = 4;
let videoTaskFrames = 0;
let videoTaskPromise: Promise<void> | undefined;
let videoTaskTimer: ReturnType<typeof setTimeout> | undefined;
let resolveVideoTask: (() => void) | undefined;
let currentFormat: VideoFormat | undefined;
let decoderSignature = '';
let keyRefreshRequested = false;
let codecFallback = false;
let softwareFallback = false;
let softwareSignature = '';
let recordingAllowed = true;
let recorder: StreamRecorder | undefined;
let recordingGeneration = 0;
let recordingSession = 0;
let callGeneration = 0;
let callTimestamp = 0;
let callActive = false;
let callTimer: ReturnType<typeof setTimeout> | undefined;
let voiceEncoder: VoiceEncoder | undefined;
let chatReceived = -Infinity;
function stopRecording(reason: RecordingReason) {
  recorder?.stop(reason);
  session.setRecording(false);
}
function stopCall(state: import('./contract').CallState = 'ended') {
  clearTimeout(callTimer);
  callTimer = undefined;
  voiceEncoder?.dispose();
  voiceEncoder = undefined;
  callActive = false;
  callTimestamp = 0;
  session.closeVoiceCall();
  session.setAudio(audioEnabled);
  resetAudio(true);
  post({ type: 'call-state', state, callGeneration });
}
let clipboardAllowed = true;
let clipboardEnabled = true;
let keyboardAllowed = true;
let fileAllowed = true;
let readOnly = false;
let peerPlatform = '';
let imageBusy = false;
let imageEpoch = 0;
let clipboardGeneration = 0;
async function convertImage(clipboard: hbb.IClipboard) {
  if (!clipboardAllowed || !clipboardEnabled || imageBusy) return;
  imageBusy = true;
  const current = generation;
  const epoch = imageEpoch;
  try {
    const bytes = await clipboardPng(clipboard);
    if (
      current !== generation ||
      epoch !== imageEpoch ||
      !clipboardAllowed ||
      !clipboardEnabled
    )
      return;
    if (bytes) post({ type: 'image', bytes, clipboardGeneration });
  } catch {
    if (current === generation && epoch === imageEpoch)
      post({ type: 'warning', code: 'clipboard' });
  } finally {
    imageBusy = false;
  }
}
let shuttingDown = false;
let desktopConnected = false;
let connection: { profile: ServerProfile; id: string } | undefined;
let fileSession: RemoteSession | undefined;
let fileTransfer: FileTransfer | undefined;
let fileGeneration = 0;
function stopFiles() {
  fileTransfer?.dispose();
  fileTransfer = undefined;
  fileSession?.disconnect();
  fileSession = undefined;
}
function connectFiles(
  next: number,
  command: Extract<Command, { type: 'files-connect' }>,
) {
  if (
    !desktopConnected ||
    !fileAllowed ||
    !connection ||
    !Number.isSafeInteger(next) ||
    next <= fileGeneration
  )
    return;
  stopFiles();
  fileGeneration = next;
  const current = generation;
  const active = () => current === generation && next === fileGeneration;
  const transfer = new FileTransfer(
    (message) =>
      native.sendFile(
        message,
        () =>
          active() &&
          (message.fileAction?.cancel !== undefined ||
            transfer.accepts(message)),
      ),
    (event) => {
      if (active()) post({ type: 'files-event', event, fileGeneration: next });
    },
  );
  let factory: SocketFactory;
  try {
    factory = gatewaySocketFactory(
      command.grant,
      connection.profile,
      command.origin,
    );
  } catch {
    post({ type: 'files-error', code: 'authorization', fileGeneration: next });
    post({ type: 'files-state', state: 'failed', fileGeneration: next });
    return;
  }
  const native = new RemoteSession(
    {
      authentication: (succeeded) => {
        if (active())
          post({ type: 'files-auth', succeeded, fileGeneration: next });
      },
      security: (kxVersion) => {
        if (active())
          post({ type: 'files-security', kxVersion, fileGeneration: next });
      },
      state: (state) => {
        if (!active()) return;
        if (state === 'closed' || state === 'failed') transfer.dispose();
        post({ type: 'files-state', state, fileGeneration: next });
      },
      error: (code) => {
        if (active()) post({ type: 'files-error', code, fileGeneration: next });
      },
      permissions: (permissions) => {
        if (active() && !permissions.file) {
          transfer.dispose();
          native.disconnect();
          post({ type: 'files-error', code: 'denied', fileGeneration: next });
        }
      },
      message: async (message) => {
        if (active()) await transfer.handle(message);
      },
    },
    factory,
    'file',
  );
  fileSession = native;
  fileTransfer = transfer;
  void native.connect(
    connection.profile,
    connection.id,
    session.authenticationForFiles(),
  );
}

let audioEnabled = false;
let audioAllowed = true;
let audioGeneration = 0;
let currentAudioFormat: hbb.IAudioFormat | undefined;
const audio = new OpusDecoder(
  (pcm) => post({ type: 'audio-frame', pcm, audioGeneration }),
  (audioDiagnostic) => {
    const failedAudioGeneration = audioGeneration;
    audioEnabled = false;
    currentAudioFormat = undefined;
    if (callTimestamp || callActive) stopCall('failed');
    else {
      session.setAudio(false);
      resetAudio();
    }
    post({
      type: 'warning',
      code: 'audio',
      audioDiagnostic,
      audioGeneration: failedAudioGeneration,
    });
  },
);
function resetAudio(keepFormat = false) {
  audio.dispose();
  ++audioGeneration;
  post({ type: 'audio-reset', audioGeneration });
  if (
    keepFormat &&
    currentAudioFormat &&
    desktopConnected &&
    audioAllowed &&
    (audioEnabled || callActive || callTimestamp)
  )
    void audio.configure(currentAudioFormat);
}

function resetVideoTask() {
  videoTaskFrames = 0;
  clearTimeout(videoTaskTimer);
  videoTaskTimer = undefined;
  videoTaskPromise = undefined;
  const resolve = resolveVideoTask;
  resolveVideoTask = undefined;
  resolve?.();
}
function yieldVideoTask() {
  if (videoTaskPromise) return videoTaskPromise;
  videoTaskFrames = 0;
  videoTaskPromise = new Promise<void>((resolve) => {
    resolveVideoTask = resolve;
    videoTaskTimer = setTimeout(resetVideoTask, VIDEO_TASK_YIELD_MS);
  });
  return videoTaskPromise;
}
function disposeVideo() {
  resetVideoTask();
  paste.cancel();
  inputReady = false;
  decoder?.dispose();
  decoder = undefined;
  pendingFrame?.close();
  pendingFrame = undefined;
  presenting = false;
  presentedResolutionFrame = false;
  decoderSignature = '';
  keyRefreshRequested = false;
  currentFormat = undefined;
  pendingFrameAt = 0;
  presentingAt = undefined;
  decoded = 0;
  droppedPresentation = 0;
  recoveryCount = 0;
  presentationLatency.reset();
  session.resetVideoCounters();
}
function requestVideoKey() {
  if (keyRefreshRequested) return;
  keyRefreshRequested = true;
  session.refreshVideo();
}
function videoFailureDetails(videoDiagnostic?: VideoDiagnostic) {
  return videoDiagnostic
    ? {
        videoDiagnostic,
        videoDisplayGeneration: displayGeneration,
        videoSaturationAttempts: saturationAttempts,
      }
    : {};
}
function fallbackVideo(
  reason: RecordingReason = 'failed',
  diagnostic?: VideoDiagnostic,
) {
  const failureDetails = videoFailureDetails(diagnostic);
  const failedSignature = decoderSignature;
  const canRetrySoftware =
    reason === 'failed' &&
    !!currentFormat &&
    !!failedSignature &&
    !softwareFallback;
  stopRecording(reason);
  disposeVideo();
  ++displayGeneration;
  post({
    type: 'display',
    display: { ...displays[display], display },
    displayGeneration,
  });
  if (canRetrySoftware) {
    softwareFallback = true;
    softwareSignature = failedSignature;
    requestVideoKey();
    post({
      type: 'warning',
      code: 'video',
      ...failureDetails,
      videoRecovery: 'software',
    });
  } else if (!codecFallback && capabilities.vp9) {
    codecFallback = true;
    session.setCodec('vp9', false);
    requestVideoKey();
    post({
      type: 'warning',
      code: 'video',
      ...failureDetails,
      videoRecovery: 'vp9',
    });
  } else {
    session.disconnect();
    post({
      type: 'error',
      code: 'media',
      ...failureDetails,
      videoRecovery: 'closed',
    });
  }
}
function present(frame: VideoFrame, readyAt = performance.now()) {
  if (presenting) {
    if (pendingFrame && droppedPresentation < Number.MAX_SAFE_INTEGER)
      ++droppedPresentation;
    pendingFrame?.close();
    pendingFrame = frame;
    pendingFrameAt = readyAt;
    return;
  }
  presenting = true;
  presentingAt = readyAt;
  presentedResolutionFrame =
    !!pendingResolution?.geometrySeen &&
    frame.displayWidth === pendingResolution.width &&
    frame.displayHeight === pendingResolution.height &&
    validFrameSize(frame.displayWidth, frame.displayHeight);
  globalThis.postMessage(
    { type: 'frame', frame, generation, displayGeneration },
    { transfer: [frame] },
  );
}
const credentials = new RememberedCredentials((status) =>
  post({ type: 'credential-status', status }),
);
let gatewayFactory: SocketFactory | undefined;
const session = new RemoteSession(
  {
    authentication: (succeeded) => post({ type: 'native-auth', succeeded }),
    security: (kxVersion) => post({ type: 'security', kxVersion }),
    state: (state) => {
      desktopConnected = state === 'connected';
      if (state === 'closed' || state === 'failed') {
        finishResolution('cancelled');
        currentAudioFormat = undefined;
        stopRecording('disconnected');
        stopCall();
        stopFiles();
        connection = undefined;
        disposeVideo();
        ++imageEpoch;
        audioEnabled = false;
        resetAudio();
      }
      post({ type: 'state', state });
    },
    error: (code) => post({ type: 'error', code }),
    permissions: (permissions) => {
      clipboardAllowed = permissions.clipboard;
      keyboardAllowed = permissions.keyboard;
      if (!keyboardAllowed) finishResolution('cancelled');
      fileAllowed = permissions.file;
      if (!fileAllowed) stopFiles();
      if (!clipboardAllowed || !keyboardAllowed) paste.cancel();
      if (!clipboardAllowed) ++imageEpoch;
      audioAllowed = permissions.audio;
      recordingAllowed = permissions.recording !== false;
      if (!recordingAllowed) stopRecording('denied');
      if (!audioAllowed) {
        currentAudioFormat = undefined;
        stopCall();
        audioEnabled = false;
        resetAudio();
        session.setAudio(false);
      }
      post({ type: 'permissions', permissions });
    },
    message: async (message) => {
      if (message.loginResponse?.peerInfo || message.peerInfo) {
        const peer = message.loginResponse?.peerInfo || message.peerInfo;
        if (!peer) return;
        displayCatalog.updatePeer(peer);
        peerPlatform = displayCatalog.platform;
        const previousDisplay = display;
        displays = peer.displays || [];
        display =
          message.peerInfo && displays[display]
            ? display
            : peer.currentDisplay || 0;
        if (message.peerInfo) {
          disposeVideo();
          ++displayGeneration;
          // PeerInfo 本身已提供有效几何；同屏切换不保证另回 SwitchDisplay。
          awaitingDisplay = false;
        }
        post({
          type: 'peer',
          peer: {
            ...peer,
            platform: displayCatalog.platform,
            version: displayCatalog.version,
            currentDisplay: display,
          },
        });
        if (peer.encoding) post({ type: 'encoding', encoding: peer.encoding });
        if (message.peerInfo) {
          stopRecording('changed');
          post({
            type: 'display',
            display: { ...displays[display], display },
            displayGeneration,
          });
          if (display !== previousDisplay) session.selectDisplay(display);
          else requestVideoKey();
        }
        updateDisplayOptions(!!message.peerInfo);
      } else if (message.misc?.chatMessage) {
        const now = performance.now();
        if (
          now - chatReceived >= 100 &&
          validChat(message.misc.chatMessage.text)
        ) {
          chatReceived = now;
          post({
            type: 'chat',
            incoming: true,
            text: message.misc.chatMessage.text,
          });
        }
      } else if (message.misc?.supportedEncoding) {
        post({ type: 'encoding', encoding: message.misc.supportedEncoding });
      } else if (
        message.voiceCallRequest &&
        !message.voiceCallRequest.isConnect
      ) {
        stopCall();
      } else if (message.voiceCallResponse) {
        const response = message.voiceCallResponse;
        if (
          !callTimestamp ||
          Number(response.reqTimestamp) !== callTimestamp ||
          !audioAllowed ||
          callActive ||
          voiceEncoder
        )
          return;
        if (!response.accepted) {
          stopCall('declined');
          return;
        }
        const activeGeneration = callGeneration;
        const activeSession = generation;
        const timestamp = callTimestamp;
        voiceEncoder = new VoiceEncoder(
          (bytes) => session.sendVoiceAudio(timestamp, bytes),
          () => {
            if (
              activeGeneration === callGeneration &&
              activeSession === generation
            )
              post({ type: 'voice-consumed', callGeneration });
          },
          () => {
            if (
              activeGeneration === callGeneration &&
              activeSession === generation
            )
              stopCall('failed');
          },
        );
        const encoder = voiceEncoder;
        void encoder
          .start()
          .then((ok) => {
            if (
              activeGeneration !== callGeneration ||
              activeSession !== generation ||
              timestamp !== callTimestamp ||
              voiceEncoder !== encoder
            ) {
              encoder.dispose();
              return;
            }
            if (
              !ok ||
              !session.setAudio(true) ||
              !session.sendVoiceFormat(timestamp)
            ) {
              stopCall('failed');
              return;
            }
            clearTimeout(callTimer);
            callTimer = undefined;
            callActive = true;
            post({ type: 'call-state', state: 'active', callGeneration });
          })
          .catch(() => {
            if (voiceEncoder === encoder) stopCall('failed');
          });
      } else if (message.misc?.audioFormat) {
        if ((audioEnabled || callActive || callTimestamp) && audioAllowed) {
          currentAudioFormat = { ...message.misc.audioFormat };
          resetAudio(true);
        }
      } else if (message.audioFrame) {
        if (
          (audioEnabled || callActive) &&
          audioAllowed &&
          message.audioFrame.data
        )
          audio.decode(message.audioFrame.data);
      } else if (message.videoFrame) {
        const video = message.videoFrame;
        if (video.display !== display || awaitingDisplay) {
          session.acknowledgeVideo();
          return;
        }
        const stream = videoBatch(video);
        if (!stream || !capabilities[stream.codec]) {
          session.disconnect();
          post({ type: 'error', code: 'unsupported' });
          return;
        }
        if (videoTaskFrames >= VIDEO_TASK_FRAME_BUDGET || videoTaskPromise) {
          const sessionGeneration = generation;
          const epoch = displayGeneration;
          const activeDecoder = decoder;
          // 共享receive只让出一个固定4ms task，不等排空；给异步解码及输出留时间。
          await yieldVideoTask();
          if (
            sessionGeneration !== generation ||
            epoch !== displayGeneration ||
            activeDecoder !== decoder ||
            !desktopConnected ||
            awaitingDisplay ||
            video.display !== display
          )
            return;
        }
        const key = stream.batch.frames?.find((f) => f.key);
        if (decoder && currentFormat?.codec !== stream.codec && !key) {
          stopRecording('changed');
          disposeVideo();
          ++displayGeneration;
          post({
            type: 'display',
            display: { ...displays[display], display },
            displayGeneration,
          });
        }
        if (!decoder && !key) {
          session.acknowledgeVideo();
          requestVideoKey();
          return;
        }
        let format: VideoFormat =
          currentFormat?.codec === stream.codec
            ? currentFormat
            : {
                codec: stream.codec,
                chroma: stream.codec === 'vp8' ? '4:2:0' : undefined,
              };
        if (stream.codec === 'vp9' && key?.data)
          format = vp9Format(key.data) ?? { codec: 'vp9', profile: 0 };
        if (stream.codec === 'av1' && key?.data) {
          const parsed = av1Format(key.data);
          if (parsed) format = parsed;
        }
        const config = decoderConfig(format, capabilities);
        if (!config) {
          session.acknowledgeVideo();
          fallbackVideo(
            'changed',
            videoFailureDiagnostic('unsupported-format', undefined, {
              batchFrames: stream.batch.frames?.length,
            }),
          );
          return;
        }
        const signature = `${stream.codec}/${format.profile ?? 0}/${format.chroma ?? ''}/${format.codecString ?? ''}`;
        if (decoder && signature !== decoderSignature) {
          stopRecording('changed');
          disposeVideo();
          ++displayGeneration;
          post({
            type: 'display',
            display: { ...displays[display], display },
            displayGeneration,
          });
        }
        currentFormat = format;
        if (!decoder) {
          decoderSignature = signature;
          post({ type: 'video-format', format, displayGeneration });
          const epoch = displayGeneration;
          const sessionGeneration = generation;
          try {
            decoder = new Vp9Decoder(
              (frame) => {
                if (
                  epoch !== displayGeneration ||
                  sessionGeneration !== generation
                ) {
                  frame.close();
                  return;
                }
                inputReady = true;
                // VideoFrame 可能转换为RGB/420；实际编码色彩仅来自码流头。
                if (decoded < Number.MAX_SAFE_INTEGER) ++decoded;
                present(frame);
              },
              () => {
                if (
                  epoch === displayGeneration &&
                  sessionGeneration === generation
                )
                  session.acknowledgeVideo();
              },
              (diagnostic) => {
                if (
                  desktopConnected &&
                  epoch === displayGeneration &&
                  sessionGeneration === generation
                )
                  fallbackVideo('failed', diagnostic);
              },
              {
                ...config,
                ...(codecFallback || signature === softwareSignature
                  ? { hardwareAcceleration: 'prefer-software' as const }
                  : {}),
              },
              (diagnostic) => {
                if (
                  !desktopConnected ||
                  epoch !== displayGeneration ||
                  sessionGeneration !== generation
                )
                  return;
                if (++saturationAttempts > 2) {
                  fallbackVideo('failed', diagnostic);
                  return;
                }
                const failureDetails = videoFailureDetails(diagnostic);
                const previousRecoveries = recoveryCount;
                stopRecording('changed');
                disposeVideo();
                ++displayGeneration;
                recoveryCount = previousRecoveries + 1;
                post({
                  type: 'display',
                  display: { ...displays[display], display },
                  displayGeneration,
                  ...failureDetails,
                  videoRecovery: 'key-refresh',
                });
                requestVideoKey();
              },
            );
            keyRefreshRequested = false;
          } catch (error) {
            session.acknowledgeVideo();
            if (
              desktopConnected &&
              epoch === displayGeneration &&
              sessionGeneration === generation
            )
              fallbackVideo(
                'failed',
                videoFailureDiagnostic('decoder-initialize', error, {
                  batchFrames: stream.batch.frames?.length,
                }),
              );
            return;
          }
        }
        for (const frame of stream.batch.frames || []) {
          if (frame.data)
            recorder?.frame(
              format,
              displays[display]?.width || 0,
              displays[display]?.height || 0,
              frame.data,
              Number(frame.pts),
              !!frame.key,
            );
        }
        if (decoder.decode(stream.batch))
          videoTaskFrames = Math.min(
            VIDEO_TASK_FRAME_BUDGET,
            videoTaskFrames + (stream.batch.frames?.length ?? 0),
          );
      } else if (message.clipboard || message.multiClipboards) {
        if (!clipboardAllowed || !clipboardEnabled) return;
        try {
          const clipboard =
            message.clipboard ||
            message.multiClipboards?.clipboards?.find((item) => !item.format);
          const image = [
            message.clipboard,
            ...(message.multiClipboards?.clipboards || []),
          ].find(
            (item) =>
              item?.format === hbb.ClipboardFormat.ImagePng ||
              item?.format === hbb.ClipboardFormat.ImageRgba,
          );
          if (image) void convertImage(image);
          const text = clipboard ? decodeText(clipboard) : undefined;
          if (text !== undefined)
            post({ type: 'clipboard', text, clipboardGeneration });
        } catch {
          post({ type: 'warning', code: 'clipboard' });
        }
      } else if (message.cursorPosition)
        post({ type: 'cursor-position', position: message.cursorPosition });
      else if (Object.hasOwn(message, 'cursorId'))
        post({ type: 'cursor-id', id: String(message.cursorId) });
      else if (message.misc?.switchDisplay) {
        const next = message.misc.switchDisplay;
        displayCatalog.updateSwitch(next);
        if ((next.display ?? 0) !== display) return;
        disposeVideo();
        stopRecording('changed');
        ++displayGeneration;
        awaitingDisplay = false;
        displays[display] = { ...displays[display], ...next };
        post({ type: 'display', display: next, displayGeneration });
        updateDisplayOptions(true);
      } else if (message.cursorData) {
        const cursor = message.cursorData;
        const width = cursor.width || 0;
        const height = cursor.height || 0;
        if (
          width > 0 &&
          height > 0 &&
          width <= 256 &&
          height <= 256 &&
          cursor.colors
        ) {
          try {
            const colors = decompressBounded(cursor.colors, 256 * 256 * 4);
            if (colors.length === width * height * 4)
              post({
                type: 'cursor',
                cursor: { ...cursor, id: String(cursor.id), colors },
              });
          } catch {
            /* Keep the platform cursor if an unsupported cursor image arrives. */
          }
        }
      }
    },
  },
  (url) => {
    if (!gatewayFactory) throw new Error('Missing authorization');
    return gatewayFactory(url);
  },
  'desktop',
  credentials,
  // 原生stream免逐批网络停等，本地解码/呈现仍执行有界依赖链恢复。
  'bounded-stream',
);

const paste = new RemotePaste({
  clipboard: (value) => session.sendClipboard(value),
  image: (image) => session.sendImage(image),
  flush: () => session.flushClipboard(),
  input: (value) => session.sendInput(value),
  status: (status) => post({ type: 'paste-status', status }),
});

globalThis.onmessage = (event: MessageEvent<Command>) => {
  const command = event.data;
  if (shuttingDown && command.type !== 'record-consumed') return;
  if (!Number.isSafeInteger(command.generation) || command.generation <= 0)
    return;
  if (
    command.type === 'connect' ||
    command.type === 'disconnect' ||
    command.type === 'shutdown'
  ) {
    if (command.generation <= generation) return;
    generation = command.generation;
  } else if (
    command.generation !== generation &&
    !(
      command.type === 'record-consumed' &&
      command.generation === recordingSession
    )
  )
    return;
  if (command.type === 'shutdown') {
    shuttingDown = true;
    session.disconnect();
    disposeVideo();
    post({ type: 'shutdown-complete' });
  } else if (command.type === 'connect') {
    gatewayFactory = undefined;
    try {
      gatewayFactory = gatewaySocketFactory(
        command.grant,
        command.profile,
        command.origin,
      );
    } catch {
      post({ type: 'error', code: 'authorization' });
      post({ type: 'state', state: 'failed' });
      return;
    }
    finishResolution('cancelled');
    displayCatalog = new DisplayCatalog();
    resolutionRequest = 0;
    if (!videoSupported) {
      post({ type: 'error', code: 'unsupported' });
      post({ type: 'state', state: 'failed' });
      return;
    }
    stopFiles();
    fileGeneration = 0;
    recorder?.dispose();
    recorder = undefined;
    recordingGeneration = 0;
    currentAudioFormat = undefined;
    stopCall('idle');
    callGeneration = 0;
    recordingAllowed = true;
    codecFallback = false;
    softwareFallback = false;
    softwareSignature = '';
    saturationAttempts = 0;
    chatReceived = -Infinity;
    connection = { profile: command.profile, id: command.id };
    ++imageEpoch;
    // 上下文代次属于本次会话；允许 connect 后重发页面的当前设置。
    clipboardGeneration = 0;
    clipboardAllowed = true;
    clipboardEnabled = true;
    session.setClipboardEnabled(true);
    keyboardAllowed = true;
    fileAllowed = true;
    readOnly = false;
    peerPlatform = '';
    audioAllowed = true;
    audioEnabled = false;
    resetAudio();
    decoded = 0;
    display = 0;
    displays = [];
    displayGeneration = 0;
    awaitingDisplay = false;
    disposeVideo();
    try {
      credentials.begin(command.account, command.profile, command.id);
    } catch {
      post({ type: 'error', code: 'configuration' });
      return;
    }
    void session.connect(command.profile, command.id, undefined, command.mode);
  } else if (command.type === 'change-resolution') {
    if (
      !Number.isSafeInteger(command.request) ||
      command.request <= resolutionRequest
    )
      return;
    resolutionRequest = command.request;
    const options = displayCatalog.get(display);
    if (
      pendingResolution ||
      !desktopConnected ||
      !keyboardAllowed ||
      readOnly ||
      awaitingDisplay ||
      command.displayGeneration !== displayGeneration ||
      command.display !== display ||
      !options.supported ||
      !validFrameSize(command.width, command.height) ||
      !options.resolutions.some(
        (value) =>
          value.width === command.width && value.height === command.height,
      ) ||
      !session.changeResolution(command.display, command.width, command.height)
    ) {
      post({
        type: 'resolution-status',
        request: command.request,
        status: 'rejected',
        displayGeneration,
      });
      return;
    }
    pendingResolution = {
      request: command.request,
      generation,
      display,
      identity: options.identity,
      sentGeneration: displayGeneration,
      width: command.width,
      height: command.height,
      geometrySeen: false,
    };
    post({
      type: 'resolution-status',
      request: command.request,
      status: 'pending',
      displayGeneration,
    });
    resolutionTimer = setTimeout(() => finishResolution('unconfirmed'), 15000);
  } else if (command.type === 'codec') {
    if (session.setCodec(command.prefer, command.trueColor)) {
      codecFallback = false;
      keyRefreshRequested = true;
      session.refreshVideo();
    }
  } else if (command.type === 'chat') {
    if (!Number.isSafeInteger(command.request)) return;
    post({
      type: 'chat',
      request: command.request,
      incoming: false,
      text: command.text,
      ok: session.sendChat(command.text),
    });
  } else if (command.type === 'call-start') {
    if (
      !Number.isSafeInteger(command.callGeneration) ||
      command.callGeneration <= callGeneration
    )
      return;
    if (!desktopConnected || !audioAllowed || callTimestamp) {
      post({
        type: 'call-state',
        state: 'failed',
        callGeneration: command.callGeneration,
      });
      return;
    }
    callGeneration = command.callGeneration;
    if (!session.startVoiceCall(command.timestamp)) {
      post({ type: 'call-state', state: 'failed', callGeneration });
      return;
    }
    callTimestamp = command.timestamp;
    post({ type: 'call-state', state: 'requesting', callGeneration });
    callTimer = setTimeout(() => stopCall('timeout'), VOICE_LIMITS.timeoutMs);
  } else if (
    command.type === 'call-stop' &&
    command.callGeneration === callGeneration
  )
    stopCall();
  else if (
    command.type === 'voice-pcm' &&
    command.callGeneration === callGeneration
  ) {
    if (callActive && audioAllowed && command.samples instanceof Float32Array)
      voiceEncoder?.encode(command.samples);
    else post({ type: 'voice-consumed', callGeneration });
  } else if (command.type === 'record-start') {
    if (
      !Number.isSafeInteger(command.recordingGeneration) ||
      command.recordingGeneration <= recordingGeneration ||
      !Number.isSafeInteger(command.maxBytes) ||
      command.maxBytes <= 0
    )
      return;
    if (!desktopConnected || !recordingAllowed || recorder) {
      post({
        type: 'record-done',
        recordingGeneration: command.recordingGeneration,
        reason: !recordingAllowed ? 'denied' : 'failed',
        duration: 0,
      });
      return;
    }
    recordingGeneration = command.recordingGeneration;
    recordingSession = generation;
    const record = recordingGeneration,
      active = generation;
    recorder = new StreamRecorder(
      (sequence, bytes) =>
        globalThis.postMessage(
          {
            type: 'record-chunk',
            recordingGeneration: record,
            sequence,
            bytes,
            generation: active,
          },
          { transfer: [bytes.buffer] },
        ),
      (reason, duration) => {
        if (record === recordingGeneration) {
          recorder = undefined;
          session.setRecording(false);
        }
        globalThis.postMessage({
          type: 'record-done',
          recordingGeneration: record,
          reason,
          duration,
          generation: active,
        });
      },
      command.maxBytes,
    );
    session.setRecording(true);
    keyRefreshRequested = true;
    session.refreshVideo();
  } else if (
    command.type === 'record-stop' &&
    command.recordingGeneration === recordingGeneration
  )
    stopRecording('user');
  else if (
    command.type === 'record-consumed' &&
    command.recordingGeneration === recordingGeneration &&
    command.generation === recordingSession &&
    Number.isSafeInteger(command.sequence) &&
    command.sequence > 0 &&
    typeof command.ok === 'boolean'
  )
    recorder?.consumed(command.sequence, command.ok);
  else if (command.type === 'files-connect')
    connectFiles(command.fileGeneration, command);
  else if (
    command.type === 'files-disconnect' &&
    command.fileGeneration === fileGeneration
  )
    stopFiles();
  else if (
    command.type === 'files-password' &&
    command.fileGeneration === fileGeneration
  )
    void fileSession?.submitPassword(command.password);
  else if (
    command.type === 'files-command' &&
    command.fileGeneration === fileGeneration
  )
    void fileTransfer?.command(command.command);
  else if (command.type === 'password')
    void (command.remember === true
      ? session.submitPassword(command.password, true)
      : session.submitPassword(command.password));
  else if (command.type === 'forget-password') session.forgetPassword();
  else if (command.type === 'disconnect') session.disconnect();
  else if (command.type === 'clipboard-context') {
    if (
      !Number.isSafeInteger(command.clipboardGeneration) ||
      command.clipboardGeneration <= clipboardGeneration
    )
      return;
    if (command.enabled !== undefined && typeof command.enabled !== 'boolean')
      return;
    clipboardGeneration = command.clipboardGeneration;
    ++imageEpoch;
    paste.cancel();
    if (command.enabled !== undefined) {
      clipboardEnabled = command.enabled;
      session.setClipboardEnabled(clipboardEnabled);
    }
  } else if (command.type === 'cancel-paste') paste.cancel();
  else if (command.type === 'paste') {
    const current = generation;
    const epoch = displayGeneration;
    const clipboardEpoch = clipboardGeneration;
    void paste.send(
      command.content,
      () =>
        current === generation &&
        epoch === displayGeneration &&
        clipboardEpoch === clipboardGeneration &&
        clipboardEnabled &&
        command.displayGeneration === displayGeneration &&
        desktopConnected &&
        inputReady &&
        !awaitingDisplay &&
        keyboardAllowed &&
        !readOnly &&
        clipboardAllowed,
      /mac/i.test(peerPlatform),
    );
  } else if (
    command.type === 'rendered' &&
    command.displayGeneration === displayGeneration
  ) {
    if (!presenting) return;
    if (presentingAt !== undefined)
      presentationLatency.add(performance.now() - presentingAt);
    presentingAt = undefined;
    if (
      command.drawn === true &&
      presentedResolutionFrame &&
      pendingResolution?.geometrySeen &&
      displays[display]?.width === pendingResolution.width &&
      displays[display]?.height === pendingResolution.height
    )
      finishResolution('confirmed');
    presentedResolutionFrame = false;
    presenting = false;
    if (pendingFrame) {
      const frame = pendingFrame;
      pendingFrame = undefined;
      present(frame, pendingFrameAt);
    }
  } else if (command.type === 'metrics')
    post({
      type: 'metrics',
      request: command.request,
      decoded,
      ...session.qualityMetrics(),
      displayGeneration,
      presenting,
      pendingFrame: !!pendingFrame,
      decodeQueue: 0,
      pendingBatches: 0,
      ...decoder?.metrics(),
      audio: audio.metrics(),
      audioGeneration,
      presentationLatencyMs: presentationLatency.value(),
      droppedPresentation,
      recoveryCount,
    });
  else if (command.type === 'select-display') {
    if (
      command.index === display ||
      !Number.isInteger(command.index) ||
      !displays[command.index]
    )
      return;
    if (!session.selectDisplay(command.index)) return;
    finishResolution('cancelled');
    display = command.index;
    ++displayGeneration;
    stopRecording('changed');
    disposeVideo();
    awaitingDisplay = true;
    post({
      type: 'display',
      display: { ...displays[display], display },
      displayGeneration,
    });
    updateDisplayOptions();
  } else if (
    command.type === 'input' &&
    !readOnly &&
    !awaitingDisplay &&
    inputReady &&
    command.displayGeneration === displayGeneration
  ) {
    // 新的点击、滚动或按键会改变输入目标，取消尚未发出的粘贴快捷键。
    if (
      command.input.keyEvent?.down ||
      command.input.keyEvent?.press ||
      (command.input.mouseEvent &&
        ((command.input.mouseEvent.mask || 0) & 7) !== 0)
    )
      paste.cancel();
    session.sendInput(command.input);
  } else if (command.type === 'read-only') {
    if (typeof command.enabled !== 'boolean') return;
    paste.cancel();
    if (session.setReadOnly(command.enabled)) {
      readOnly = command.enabled;
      if (readOnly) finishResolution('cancelled');
    }
  } else if (command.type === 'view-options')
    session.setViewOptions(command.options);
  else if (command.type === 'audio') {
    audioEnabled = command.enabled && audioAllowed;
    // 通话仍订阅原生音频；同订阅不会重发格式，桌面偏好不能清掉通话解码器。
    if (!callActive) resetAudio();
    session.setAudio(audioEnabled || callActive);
  } else if (
    command.type === 'audio-rendered' &&
    command.audioGeneration === audioGeneration
  )
    audio.acknowledge();
  else if (command.type === 'refresh') {
    keyRefreshRequested = true;
    session.refreshVideo();
  } else if (command.type === 'text') {
    try {
      if (command.text.length > MAX_TEXT_BYTES) throw new Error();
      encodeText(command.text);
      if (
        !readOnly &&
        inputReady &&
        command.displayGeneration === displayGeneration
      )
        session.sendInput({ keyEvent: { seq: command.text, press: true } });
    } catch {
      post({ type: 'warning', code: 'clipboard' });
    }
  }
};
// 浏览器可选能力探测可能永不完成，不能因此让连接入口永久等待。
// 超时结果只降级本次 Worker；迟到结果不改变已经公布的能力。
function startupProbe<T>(probe: Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Capability probe timed out')),
      5000,
    );
    probe.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
void Promise.all([
  startupProbe(cryptoReady()),
  startupProbe(videoCapabilities()).catch(
    (): VideoCapabilities => ({
      vp9: false,
      vp8: false,
      av1: false,
      vp9_444: false,
      av1_444: false,
    }),
  ),
  startupProbe(OpusDecoder.supported()).catch(() => false),
  startupProbe(VoiceEncoder.supported()).catch(() => false),
])
  .then(([, supported, audioDecoder, voiceEncoder]) => {
    capabilities = supported;
    session.configureVideo(capabilities);
    const videoDecoder = supported.vp9 || supported.vp8 || supported.av1;
    videoSupported = videoDecoder;
    post({
      type: 'ready',
      secureContext: globalThis.isSecureContext,
      videoDecoder,
      audioDecoder,
      videoCapabilities: supported,
      voiceEncoder,
    });
  })
  .catch(() =>
    post({
      type: 'ready',
      secureContext: globalThis.isSecureContext,
      videoDecoder: false,
    }),
  );
