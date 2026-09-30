import {
  decodeText,
  decompressBounded,
  encodeText,
  MAX_TEXT_BYTES,
} from '../clipboard/text';
import { clipboardPng } from '../clipboard/image';
import { RemotePaste } from '../clipboard/paste';
import { cryptoReady } from '../core/crypto';
import type { Command, SessionEvent } from './contract';
import { FileTransfer } from '../files/transfer';
import type { ServerProfile } from '../core/profile';
import { RemoteSession } from '../core/session';
import { OpusDecoder } from '../media/opus';
import { Vp9Decoder } from '../media/vp9-decoder';
import { hbb } from '../protocol';

// No Console token, browser storage or application singleton enters this worker.
const post = (data: SessionEvent) =>
  globalThis.postMessage({ ...data, generation });
let decoder: Vp9Decoder | undefined;
let pendingFrame: VideoFrame | undefined;
let presenting = false;
let display = 0;
let displays: hbb.IDisplayInfo[] = [];
let displayGeneration = 0;
let awaitingDisplay = false;
let inputReady = false;
let decoded = 0;
let generation = 0;
let videoSupported = false;
let clipboardAllowed = true;
let keyboardAllowed = true;
let peerPlatform = '';
let imageBusy = false;
let imageEpoch = 0;
async function convertImage(clipboard: hbb.IClipboard, outbound: boolean) {
  if (!clipboardAllowed || imageBusy) return;
  imageBusy = true;
  const current = generation;
  const epoch = imageEpoch;
  try {
    const bytes = await clipboardPng(clipboard);
    if (current !== generation || epoch !== imageEpoch || !clipboardAllowed)
      return;
    if (outbound) session.sendImage(bytes);
    else post({ type: 'image', bytes });
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
function connectFiles(next: number) {
  if (
    !desktopConnected ||
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
  const native = new RemoteSession(
    {
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
    undefined,
    'file',
  );
  fileSession = native;
  fileTransfer = transfer;
  void native.connect(connection.profile, connection.id);
}

let audioEnabled = false;
let audioAllowed = true;
let audioGeneration = 0;
const audio = new OpusDecoder(
  (pcm) => post({ type: 'audio-frame', pcm, audioGeneration }),
  () => {
    audioEnabled = false;
    session.setAudio(false);
    resetAudio();
    post({ type: 'warning', code: 'audio' });
  },
);
function resetAudio() {
  audio.dispose();
  ++audioGeneration;
  post({ type: 'audio-reset', audioGeneration });
}

function disposeVideo() {
  paste.cancel();
  inputReady = false;
  decoder?.dispose();
  decoder = undefined;
  pendingFrame?.close();
  pendingFrame = undefined;
  presenting = false;
}
function present(frame: VideoFrame) {
  if (presenting) {
    pendingFrame?.close();
    pendingFrame = frame;
    return;
  }
  presenting = true;
  globalThis.postMessage(
    { type: 'frame', frame, generation, displayGeneration },
    { transfer: [frame] },
  );
}
const session = new RemoteSession({
  security: (kxVersion) => post({ type: 'security', kxVersion }),
  state: (state) => {
    desktopConnected = state === 'connected';
    if (state === 'closed' || state === 'failed') {
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
    if (!clipboardAllowed || !keyboardAllowed) paste.cancel();
    if (!clipboardAllowed) ++imageEpoch;
    audioAllowed = permissions.audio;
    if (!audioAllowed) {
      audioEnabled = false;
      resetAudio();
      session.setAudio(false);
    }
    post({ type: 'permissions', permissions });
  },
  message: (message) => {
    if (message.loginResponse?.peerInfo || message.peerInfo) {
      const peer = message.loginResponse?.peerInfo || message.peerInfo;
      if (!peer) return;
      peerPlatform = peer.platform || '';
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
      post({ type: 'peer', peer: { ...peer, currentDisplay: display } });
      if (message.peerInfo) {
        post({
          type: 'display',
          display: { ...displays[display], display },
          displayGeneration,
        });
        if (display !== previousDisplay) session.selectDisplay(display);
        else session.refreshVideo();
      }
    } else if (message.misc?.audioFormat) {
      if (audioEnabled && audioAllowed) {
        resetAudio();
        void audio.configure(message.misc.audioFormat);
      }
    } else if (message.audioFrame) {
      if (audioEnabled && audioAllowed && message.audioFrame.data)
        audio.decode(message.audioFrame.data);
    } else if (message.videoFrame) {
      const video = message.videoFrame;
      if (video.display !== display || awaitingDisplay) {
        session.acknowledgeVideo();
        return;
      }
      if (!video.vp9s) {
        session.disconnect();
        post({ type: 'error', code: 'unsupported' });
        return;
      }
      if (!decoder) {
        const epoch = displayGeneration;
        const sessionGeneration = generation;
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
            ++decoded;
            present(frame);
          },
          () => session.acknowledgeVideo(),
          () => {
            session.disconnect();
            post({ type: 'error', code: 'media' });
          },
        );
      }
      decoder.decode(video.vp9s);
    } else if (message.clipboard || message.multiClipboards) {
      if (!clipboardAllowed) return;
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
        if (image) void convertImage(image, false);
        const text = clipboard ? decodeText(clipboard) : undefined;
        if (text !== undefined) post({ type: 'clipboard', text });
      } catch {
        post({ type: 'warning', code: 'clipboard' });
      }
    } else if (message.cursorPosition)
      post({ type: 'cursor-position', position: message.cursorPosition });
    else if (Object.hasOwn(message, 'cursorId'))
      post({ type: 'cursor-id', id: String(message.cursorId) });
    else if (message.misc?.switchDisplay) {
      const next = message.misc.switchDisplay;
      if ((next.display ?? 0) !== display) return;
      disposeVideo();
      ++displayGeneration;
      awaitingDisplay = false;
      displays[display] = { ...displays[display], ...next };
      post({ type: 'display', display: next, displayGeneration });
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
});

const paste = new RemotePaste({
  clipboard: (value) => session.sendClipboard(value),
  image: (bytes) => session.sendImage(bytes),
  flush: () => session.flushClipboard(),
  input: (value) => session.sendInput(value),
  status: (status) => post({ type: 'paste-status', status }),
});

globalThis.onmessage = (event: MessageEvent<Command>) => {
  if (shuttingDown) return;
  const command = event.data;
  if (!Number.isSafeInteger(command.generation) || command.generation <= 0)
    return;
  if (
    command.type === 'connect' ||
    command.type === 'disconnect' ||
    command.type === 'shutdown'
  ) {
    if (command.generation <= generation) return;
    generation = command.generation;
  } else if (command.generation !== generation) return;
  if (command.type === 'shutdown') {
    shuttingDown = true;
    session.disconnect();
    disposeVideo();
    post({ type: 'shutdown-complete' });
  } else if (command.type === 'connect') {
    if (!videoSupported) {
      post({ type: 'error', code: 'unsupported' });
      post({ type: 'state', state: 'failed' });
      return;
    }
    stopFiles();
    fileGeneration = 0;
    connection = { profile: command.profile, id: command.id };
    ++imageEpoch;
    clipboardAllowed = true;
    keyboardAllowed = true;
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
    void session.connect(command.profile, command.id);
  } else if (command.type === 'files-connect')
    connectFiles(command.fileGeneration);
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
    void session.submitPassword(command.password);
  else if (command.type === 'disconnect') session.disconnect();
  else if (command.type === 'cancel-paste') paste.cancel();
  else if (command.type === 'paste') {
    const current = generation;
    const epoch = displayGeneration;
    void paste.send(
      command.content,
      () =>
        current === generation &&
        epoch === displayGeneration &&
        command.displayGeneration === displayGeneration &&
        desktopConnected &&
        inputReady &&
        !awaitingDisplay &&
        keyboardAllowed &&
        clipboardAllowed,
      /mac/i.test(peerPlatform),
    );
  } else if (
    command.type === 'rendered' &&
    command.displayGeneration === displayGeneration
  ) {
    presenting = false;
    if (pendingFrame) {
      const frame = pendingFrame;
      pendingFrame = undefined;
      present(frame);
    }
  } else if (command.type === 'metrics')
    post({
      type: 'metrics',
      decoded,
      presenting,
      pendingFrame: !!pendingFrame,
    });
  else if (command.type === 'select-display') {
    if (
      command.index === display ||
      !Number.isInteger(command.index) ||
      !displays[command.index]
    )
      return;
    if (!session.selectDisplay(command.index)) return;
    display = command.index;
    ++displayGeneration;
    disposeVideo();
    awaitingDisplay = true;
    post({
      type: 'display',
      display: { ...displays[display], display },
      displayGeneration,
    });
  } else if (
    command.type === 'input' &&
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
  } else if (command.type === 'image')
    void convertImage(
      { content: command.bytes, format: hbb.ClipboardFormat.ImagePng },
      true,
    );
  else if (command.type === 'audio') {
    audioEnabled = command.enabled && audioAllowed;
    resetAudio();
    session.setAudio(audioEnabled);
  } else if (
    command.type === 'audio-rendered' &&
    command.audioGeneration === audioGeneration
  )
    audio.acknowledge();
  else if (command.type === 'refresh') session.refreshVideo();
  else if (command.type === 'clipboard' || command.type === 'text') {
    try {
      if (command.text.length > MAX_TEXT_BYTES) throw new Error();
      const clipboard = encodeText(command.text);
      if (command.type === 'clipboard') session.sendClipboard(clipboard);
      else if (inputReady && command.displayGeneration === displayGeneration)
        session.sendInput({ keyEvent: { seq: command.text, press: true } });
    } catch {
      post({ type: 'warning', code: 'clipboard' });
    }
  }
};
void Promise.all([
  cryptoReady(),
  Vp9Decoder.supported(),
  OpusDecoder.supported(),
])
  .then(([, videoDecoder, audioDecoder]) => {
    videoSupported = videoDecoder;
    post({
      type: 'ready',
      secureContext: globalThis.isSecureContext,
      videoDecoder,
      audioDecoder,
    });
  })
  .catch(() =>
    post({
      type: 'ready',
      secureContext: globalThis.isSecureContext,
      videoDecoder: false,
    }),
  );
