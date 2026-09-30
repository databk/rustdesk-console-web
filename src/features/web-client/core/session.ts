import { hbb } from '../protocol';
import {
  createKeyExchange,
  cryptoReady,
  decodeServerKey,
  type KxVersion,
  passwordChallenge,
  verifyIdentity,
} from './crypto';
import { DISPLAY_LIMITS, validDisplay } from './display';
import { SessionError, type SessionErrorCode } from './errors';
import {
  normalizeTargetId,
  type ServerProfile,
  validateAdvertisedRelay,
  validateProfile,
} from './profile';
import { BinaryTransport, type SocketFactory } from './transport';

export type SessionState =
  | 'idle'
  | 'connecting'
  | 'securing'
  | 'authenticating'
  | 'awaitingApproval'
  | 'connected'
  | 'closed'
  | 'failed';
export interface SessionEvents {
  security: (kxVersion: KxVersion | undefined) => void;
  state: (state: SessionState) => void;
  error: (code: SessionErrorCode) => void;
  message: (message: hbb.Message) => void | Promise<void>;
  permissions: (permissions: SessionPermissions) => void;
}
export interface SessionPermissions {
  keyboard: boolean;
  clipboard: boolean;
  audio: boolean;
  file: boolean;
}

const MAX_HELD_KEYS = 256;

export class RemoteSession {
  private generation = 0;
  private state: SessionState = 'idle';
  private transport?: BinaryTransport;
  private challenge?: { salt: string; challenge: string };
  private targetId = '';
  private attempts = 0;
  private authenticationRequest = 0;
  private authTimer?: ReturnType<typeof setTimeout>;
  private permissions = {
    keyboard: true,
    clipboard: true,
    audio: true,
    file: true,
  };
  private displays: hbb.IDisplayInfo[] = [];
  // Track accepted wire input separately from the DOM's focus/key state.
  private heldKeys = new Map<string, hbb.IKeyEvent>();
  private heldButtons = new Set<number>();

  constructor(
    private readonly events: SessionEvents,
    private readonly socketFactory?: SocketFactory,
    private readonly kind: 'desktop' | 'file' = 'desktop',
  ) {}

  private transition(state: SessionState) {
    this.state = state;
    this.events.state(state);
  }
  private current(generation: number) {
    if (generation !== this.generation) throw new SessionError('cancelled');
  }

  async connect(input: ServerProfile, rawId: string) {
    this.dispose();
    const generation = this.generation;
    this.transition('connecting');
    this.permissions = {
      keyboard: true,
      clipboard: true,
      audio: true,
      file: true,
    };
    this.attempts = 0;
    try {
      await cryptoReady();
      this.current(generation);
      const profile = validateProfile(input);
      this.targetId = normalizeTargetId(rawId);
      const rendezvous = new BinaryTransport(this.socketFactory);
      this.transport = rendezvous;
      await rendezvous.open(profile.idServerUrl);
      this.current(generation);
      rendezvous.send(
        hbb.RendezvousMessage.encode({
          punchHoleRequest: {
            id: this.targetId,
            licenceKey: profile.serverPublicKey,
            connType:
              this.kind === 'file'
                ? hbb.ConnType.FILE_TRANSFER
                : hbb.ConnType.DEFAULT_CONN,
            natType: hbb.NatType.SYMMETRIC,
            forceRelay: true,
            version: '1.4.9',
          },
        }).finish(),
      );
      const response = hbb.RendezvousMessage.decode(await rendezvous.receive());
      this.current(generation);
      const relay = response.relayResponse;
      if (!relay) {
        const failure = response.punchHoleResponse;
        if (!failure) throw new SessionError('protocol');
        if (failure.failure === hbb.PunchHoleResponse.Failure.LICENSE_MISMATCH)
          throw new SessionError('identity');
        if (
          failure.failure === hbb.PunchHoleResponse.Failure.LICENSE_OVERUSE ||
          failure.otherFailure
        )
          throw new SessionError('denied');
        throw new SessionError('offline');
      }
      if (relay.refuseReason) throw new SessionError('denied');
      if (!relay.uuid || !relay.version || !relay.pk)
        throw new SessionError('identity');
      validateAdvertisedRelay(relay.relayServer || '', profile.relayServerUrl);
      const peerIdentity = verifyIdentity(
        relay.pk,
        decodeServerKey(profile.serverPublicKey),
        this.targetId,
      );
      rendezvous.close();
      this.transition('securing');
      const transport = new BinaryTransport(this.socketFactory);
      this.transport = transport;
      await transport.open(profile.relayServerUrl);
      this.current(generation);
      transport.send(
        hbb.RendezvousMessage.encode({
          requestRelay: {
            connType:
              this.kind === 'file'
                ? hbb.ConnType.FILE_TRANSFER
                : hbb.ConnType.DEFAULT_CONN,
            id: this.targetId,
            uuid: relay.uuid,
            licenceKey: profile.serverPublicKey,
          },
        }).finish(),
      );
      const signed = hbb.Message.decode(await transport.receive()).signedId?.id;
      this.current(generation);
      if (!signed) throw new SessionError('identity');
      // Only the peer-signed session offer negotiates KX, not relay metadata.
      const offer = verifyIdentity(
        signed,
        peerIdentity.publicKey,
        this.targetId,
      );
      const exchange = createKeyExchange(offer);
      try {
        transport.send(
          hbb.Message.encode({ publicKey: exchange.publicKey }).finish(),
        );
        transport.secure(exchange.cipher);
      } catch (error) {
        exchange.cipher.dispose();
        throw error;
      }
      this.events.security(exchange.kxVersion);
      this.transition('authenticating');
      this.armAuthenticationTimeout();
      while (generation === this.generation) {
        const message = hbb.Message.decode(await transport.receive(120000));
        this.current(generation);
        if (message.hash) {
          if (this.state === 'connected') throw new SessionError('protocol');
          const { salt, challenge } = message.hash;
          if (
            !salt ||
            !challenge ||
            salt.length > 4096 ||
            challenge.length > 4096
          )
            throw new SessionError('protocol');
          this.challenge = { salt, challenge };
          await this.submitPassword('');
        } else if (message.loginResponse) {
          if (this.state === 'connected') throw new SessionError('protocol');
          const response = message.loginResponse;
          if (response.error) {
            if (response.error === 'Wrong Password') {
              this.transition('authenticating');
              this.events.error('password');
            } else if (response.error === 'No Password Access') {
              // Native click-only approval keeps this encrypted session open.
              // Repeated notices must not extend the authentication deadline.
              this.transition('awaitingApproval');
            } else throw new SessionError('denied');
          } else if (response.peerInfo) {
            const selected = response.peerInfo.currentDisplay ?? 0;
            if (
              response.peerInfo.platform !== 'Windows' ||
              (this.kind === 'desktop' &&
                !response.peerInfo.displays?.length) ||
              (response.peerInfo.displays?.length || 0) >
                DISPLAY_LIMITS.count ||
              !(response.peerInfo.displays || []).every(validDisplay) ||
              !Number.isInteger(selected) ||
              selected < 0 ||
              (this.kind === 'desktop' &&
                selected >= (response.peerInfo.displays?.length || 0))
            )
              throw new SessionError('protocol');
            clearTimeout(this.authTimer);
            this.displays = response.peerInfo.displays || [];
            this.challenge = undefined;
            this.transition('connected');
            this.events.permissions({ ...this.permissions });
            await this.events.message(message);
            // Since native 1.2.4, a versioned client explicitly subscribes displays.
            if (this.kind === 'desktop')
              this.send({
                misc: {
                  captureDisplays: {
                    set: [selected],
                  },
                },
              });
          } else throw new SessionError('protocol');
        } else if (message.testDelay && !message.testDelay.fromClient) {
          this.send({ testDelay: message.testDelay });
        } else if (message.misc?.closeReason) {
          throw new SessionError('denied');
        } else if (message.misc?.permissionInfo) {
          const info = message.misc.permissionInfo;
          if (info.permission === hbb.PermissionInfo.Permission.Keyboard) {
            const restored = !this.permissions.keyboard && !!info.enabled;
            this.permissions.keyboard = !!info.enabled;
            // Revoked input stays blocked, including releases. Once restored,
            // release only previously sent holds before enabling the UI again.
            if (restored)
              for (const release of this.takeInputReleases())
                this.send(release);
          }
          if (info.permission === hbb.PermissionInfo.Permission.Clipboard)
            this.permissions.clipboard = !!info.enabled;
          if (info.permission === hbb.PermissionInfo.Permission.Audio)
            this.permissions.audio = !!info.enabled;
          if (info.permission === hbb.PermissionInfo.Permission.File)
            this.permissions.file = !!info.enabled;
          this.events.permissions({ ...this.permissions });
        } else if (this.state === 'connected') {
          if (message.peerInfo) {
            const peer = message.peerInfo;
            if (
              !peer.displays?.length ||
              peer.displays.length > DISPLAY_LIMITS.count ||
              !peer.displays.every(validDisplay) ||
              !Number.isInteger(peer.currentDisplay ?? 0) ||
              (peer.currentDisplay ?? 0) < 0 ||
              (peer.currentDisplay ?? 0) >= peer.displays.length
            )
              throw new SessionError('protocol');
            this.displays = peer.displays;
          }
          if (
            message.misc?.switchDisplay &&
            (!validDisplay(message.misc.switchDisplay) ||
              !Number.isInteger(message.misc.switchDisplay.display) ||
              (message.misc.switchDisplay.display ?? -1) < 0 ||
              (message.misc.switchDisplay.display ?? DISPLAY_LIMITS.count) >=
                this.displays.length)
          )
            throw new SessionError('protocol');
          if (
            (message.peerInfo || message.misc?.switchDisplay) &&
            this.permissions.keyboard
          )
            for (const release of this.takeInputReleases())
              if (!this.sendConnected(release)) return;
          await this.events.message(message);
        }
      }
    } catch (error) {
      if (generation !== this.generation) return;
      this.fail(error instanceof SessionError ? error.code : 'protocol');
    }
  }

  async submitPassword(password: string) {
    if (
      !this.challenge ||
      !['authenticating', 'awaitingApproval'].includes(this.state)
    )
      return;
    if (password.length > 4096 || ++this.attempts > 5) {
      this.fail('denied');
      return;
    }
    const generation = this.generation;
    const request = ++this.authenticationRequest;
    const hash = this.challenge;
    this.transition('authenticating');
    try {
      const response = password
        ? await passwordChallenge(password, hash.salt, hash.challenge)
        : new Uint8Array();
      try {
        // Local approval, reconnect or a newer submission can win while hashing.
        if (
          generation !== this.generation ||
          request !== this.authenticationRequest ||
          hash !== this.challenge ||
          this.state === 'connected'
        )
          return;
        this.send({
          loginRequest: {
            username: this.targetId,
            password: response,
            myId: 'console-web',
            myName: 'Console Web Client',
            myPlatform: 'Web',
            version: '1.4.9',
            videoAckRequired: this.kind === 'desktop',
            fileTransfer:
              this.kind === 'file' ? { dir: '', showHidden: false } : undefined,
            option:
              this.kind === 'file'
                ? undefined
                : {
                    disableAudio: hbb.OptionMessage.BoolOption.Yes,
                    enableFileTransfer: hbb.OptionMessage.BoolOption.No,
                    imageQuality: hbb.ImageQuality.Balanced,
                    showRemoteCursor: hbb.OptionMessage.BoolOption.Yes,
                    customFps: 30,
                    supportedDecoding: {
                      abilityVp9: 1,
                      prefer: hbb.SupportedDecoding.PreferCodec.VP9,
                      preferChroma: hbb.Chroma.I420,
                    },
                  },
          },
        });
      } finally {
        response.fill(0);
      }
      this.transition('awaitingApproval');
      this.armAuthenticationTimeout();
    } catch (error) {
      if (
        generation === this.generation &&
        request === this.authenticationRequest
      )
        this.fail(error instanceof SessionError ? error.code : 'protocol');
    }
  }

  private armAuthenticationTimeout() {
    const generation = this.generation;
    clearTimeout(this.authTimer);
    this.authTimer = setTimeout(() => {
      if (generation === this.generation) this.fail('timeout');
    }, 120000);
  }

  sendInput(input: { keyEvent?: hbb.IKeyEvent; mouseEvent?: hbb.IMouseEvent }) {
    if (
      this.kind !== 'desktop' ||
      this.state !== 'connected' ||
      !this.permissions.keyboard
    )
      return false;
    const key = input.keyEvent;
    const keyId =
      key && !key.press
        ? key.controlKey != null
          ? `control:${key.mode ?? hbb.KeyboardMode.Legacy}:${key.controlKey}`
          : key.chr != null
          ? `chr:${key.mode ?? hbb.KeyboardMode.Legacy}:${key.chr}`
          : undefined
        : undefined;
    if (
      keyId &&
      key?.down &&
      !this.heldKeys.has(keyId) &&
      this.heldKeys.size >= MAX_HELD_KEYS
    ) {
      this.fail('protocol');
      return false;
    }
    if (!this.sendConnected(input)) return false;
    if (keyId && key) {
      if (key.down)
        this.heldKeys.set(keyId, {
          controlKey: key.controlKey,
          chr: key.chr,
          mode: key.mode,
          down: false,
        });
      else this.heldKeys.delete(keyId);
    }
    const mask = input.mouseEvent?.mask ?? 0;
    const button = mask >>> 3;
    if ([1, 2, 4].includes(button)) {
      if ((mask & 7) === 1) this.heldButtons.add(button);
      if ((mask & 7) === 2) this.heldButtons.delete(button);
    }
    return true;
  }

  private takeInputReleases(): hbb.IMessage[] {
    const releases: hbb.IMessage[] = Array.from(
      this.heldKeys.values(),
      (keyEvent) => ({ keyEvent }),
    );
    for (const button of this.heldButtons)
      releases.push({ mouseEvent: { mask: 2 | (button << 3) } });
    this.heldKeys.clear();
    this.heldButtons.clear();
    return releases;
  }

  sendClipboard(clipboard: hbb.IClipboard) {
    if (
      this.kind !== 'desktop' ||
      this.state !== 'connected' ||
      !this.permissions.clipboard
    )
      return false;
    return this.sendConnected({ clipboard });
  }

  sendImage(bytes: Uint8Array) {
    if (
      this.kind !== 'desktop' ||
      this.state !== 'connected' ||
      !this.permissions.clipboard
    )
      return false;
    return this.sendConnected({
      multiClipboards: {
        clipboards: [{ format: hbb.ClipboardFormat.ImagePng, content: bytes }],
      },
    });
  }

  async flushClipboard() {
    const transport = this.transport;
    if (
      !transport ||
      this.kind !== 'desktop' ||
      this.state !== 'connected' ||
      !this.permissions.clipboard
    )
      throw new SessionError('denied');
    // 等待本地发送队列清空，不将其当作远端系统写入确认。
    await transport.drain(0);
    if (
      transport !== this.transport ||
      this.state !== 'connected' ||
      !this.permissions.clipboard
    )
      throw new SessionError('cancelled');
  }

  selectDisplay(index: number) {
    if (
      this.state !== 'connected' ||
      !Number.isInteger(index) ||
      !this.displays[index]
    )
      return false;
    if (this.permissions.keyboard) {
      for (const release of this.takeInputReleases())
        if (!this.sendConnected(release)) return false;
    }
    return (
      this.sendConnected({ misc: { switchDisplay: { display: index } } }) &&
      this.sendConnected({ misc: { captureDisplays: { set: [index] } } })
    );
  }

  setAudio(enabled: boolean) {
    if (this.state !== 'connected') return false;
    return this.sendConnected({
      misc: {
        option: {
          disableAudio:
            enabled && this.permissions.audio
              ? hbb.OptionMessage.BoolOption.No
              : hbb.OptionMessage.BoolOption.Yes,
        },
      },
    });
  }

  async sendFile(
    message: { fileAction?: hbb.IFileAction; fileResponse?: hbb.IFileResponse },
    current = () => true,
  ) {
    if (
      this.kind !== 'file' ||
      this.state !== 'connected' ||
      !this.permissions.file
    )
      throw new SessionError('denied');
    const transport = this.transport;
    if (!transport) throw new SessionError('cancelled');
    await transport.drain();
    if (transport !== this.transport || !this.permissions.file || !current())
      throw new SessionError('cancelled');
    this.send(message);
  }

  acknowledgeVideo() {
    if (this.state === 'connected')
      this.sendConnected({ misc: { videoReceived: true } });
  }
  refreshVideo() {
    if (this.state === 'connected')
      this.sendConnected({ misc: { refreshVideo: true } });
  }

  private sendConnected(message: hbb.IMessage) {
    try {
      this.send(message);
      return true;
    } catch (error) {
      this.fail(error instanceof SessionError ? error.code : 'transport');
      return false;
    }
  }

  private send(message: hbb.IMessage) {
    if (!this.transport) throw new SessionError('cancelled');
    this.transport.send(hbb.Message.encode(message).finish());
  }

  private fail(code: SessionErrorCode) {
    this.dispose();
    this.transition('failed');
    this.events.error(code);
  }

  dispose() {
    ++this.generation;
    ++this.authenticationRequest;
    clearTimeout(this.authTimer);
    const releases = this.takeInputReleases();
    if (this.state === 'connected' && this.permissions.keyboard) {
      try {
        for (const release of releases) this.send(release);
      } catch {
        // Transport failure cannot prevent closing or replay input elsewhere.
      }
    }
    this.transport?.close();
    this.transport = undefined;
    this.challenge = undefined;
    this.targetId = '';
    this.displays = [];
    this.state = 'closed';
    this.events.security(undefined);
  }

  disconnect() {
    this.dispose();
    this.transition('closed');
  }
}
