import { SessionError } from './errors';
import type { IceServer } from './profile';
import type { TransportSocket } from './transport';

// Browser RTCPeerConnection is injected so unit tests can supply a fake.
export interface RtcFactory {
  RTCPeerConnection: typeof RTCPeerConnection;
}

// Mirrors the native controller's single in-band DataChannel over one m-line.
const DATA_CHANNEL_LABEL = 'rustdesk';
// Native waits CONNECT_TIMEOUT for the data channel; the browser leg races
// against relay and this bound caps how long it holds the relay back.
const DEFAULT_OPEN_TIMEOUT = 15000;

function rtcIceServers(servers: IceServer[]): RTCIceServer[] {
  return servers.map((server) => {
    const ice: RTCIceServer = { urls: server.urls };
    if (server.username !== undefined) ice.username = server.username;
    if (server.credential !== undefined) ice.credential = server.credential;
    return ice;
  });
}

function resolveRtcFactory(factory?: RtcFactory): RtcFactory {
  const Ctor = factory?.RTCPeerConnection ?? globalThis.RTCPeerConnection;
  if (typeof Ctor !== 'function') throw new SessionError('configuration');
  return { RTCPeerConnection: Ctor };
}

/**
 * WebRTC offerer (controller side). Creates an in-band DataChannel, produces an
 * SDP offer for the rendezvous server to relay, and consumes the answer plus
 * trickle ICE candidates that come back over the same signaling socket. Once
 * the DataChannel opens it replaces the WebSocket transport end to end.
 */
export class WebRtcOfferer {
  private readonly pc: RTCPeerConnection;
  private channel?: RTCDataChannel;
  private iceCallback?: (candidate: string) => void;
  private openPromise?: Promise<RTCDataChannel>;
  private remoteAnswerSet = false;
  private pendingIce: string[] = [];
  private closed = false;

  constructor(iceServers: IceServer[], factory?: RtcFactory) {
    const { RTCPeerConnection } = resolveRtcFactory(factory);
    this.pc = new RTCPeerConnection({ iceServers: rtcIceServers(iceServers) });
  }

  async createOffer(): Promise<string> {
    if (this.closed || this.channel) throw new SessionError('protocol');
    const channel = this.pc.createDataChannel(DATA_CHANNEL_LABEL, {
      ordered: true,
    });
    channel.binaryType = 'arraybuffer';
    this.channel = channel;
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    return offer.sdp ?? '';
  }

  onLocalIce(callback: (candidate: string) => void) {
    this.iceCallback = callback;
    this.pc.onicecandidate = (event) => {
      if (this.closed) return;
      const candidate = event.candidate?.candidate;
      if (candidate) this.iceCallback?.(candidate);
    };
  }

  async setRemoteAnswer(sdp: string): Promise<void> {
    if (this.closed) throw new SessionError('cancelled');
    if (!sdp) throw new SessionError('protocol');
    await this.pc.setRemoteDescription({ type: 'answer', sdp });
    this.remoteAnswerSet = true;
    const pending = this.pendingIce;
    this.pendingIce = [];
    for (const candidate of pending) await this.addRemoteIce(candidate);
  }

  async addRemoteIce(candidate: string): Promise<void> {
    if (this.closed || !candidate) return;
    if (!this.remoteAnswerSet) {
      if (this.pendingIce.length < 64) this.pendingIce.push(candidate);
      return;
    }
    try {
      await this.pc.addIceCandidate({
        candidate,
        sdpMid: '0',
        sdpMLineIndex: 0,
      });
    } catch {
      throw new SessionError('protocol');
    }
  }

  whenOpen(timeout = DEFAULT_OPEN_TIMEOUT): Promise<RTCDataChannel> {
    if (this.openPromise) return this.openPromise;
    this.openPromise = new Promise<RTCDataChannel>((resolve, reject) => {
      if (this.closed || !this.channel) {
        reject(new SessionError('protocol'));
        return;
      }
      const channel = this.channel;
      const timer = setTimeout(
        () => reject(new SessionError('timeout')),
        timeout,
      );
      const done = (action: 'resolve' | 'reject', value: unknown) => {
        clearTimeout(timer);
        this.pc.onconnectionstatechange = null;
        channel.onopen = null;
        if (action === 'resolve') resolve(value as RTCDataChannel);
        else reject(value as SessionError);
      };
      if (channel.readyState === 'open') {
        done('resolve', channel);
        return;
      }
      channel.onopen = () => done('resolve', channel);
      this.pc.onconnectionstatechange = () => {
        const state = this.pc.connectionState;
        if (state === 'failed' || state === 'closed')
          done('reject', new SessionError('transport'));
      };
    });
    return this.openPromise;
  }

  asSocket(): TransportSocket {
    if (!this.channel) throw new SessionError('protocol');
    return new DataChannelSocket(this.channel, () => this.close());
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    this.iceCallback = undefined;
    this.pc.onicecandidate = null;
    this.pc.onconnectionstatechange = null;
    if (this.channel) this.channel.onopen = null;
    try {
      this.pc.close();
    } catch {
      // ignore
    }
    this.channel = undefined;
  }
}

// Adapts an RTCDataChannel to the TransportSocket subset BinaryTransport uses.
// readyState is mapped onto WebSocket's numeric codes so BinaryTransport's open
// and backpressure checks work unchanged.
class DataChannelSocket implements TransportSocket {
  binaryType: BinaryType = 'arraybuffer';
  onopen: WebSocket['onopen'] = null;
  onmessage: WebSocket['onmessage'] = null;
  onclose: WebSocket['onclose'] = null;
  onerror: WebSocket['onerror'] = null;
  private ended = false;

  constructor(
    private readonly channel: RTCDataChannel,
    private readonly onClose: () => void,
  ) {
    channel.binaryType = 'arraybuffer';
    const fireClose = (code?: number) => {
      if (this.ended) return;
      this.ended = true;
      this.onclose?.call(this as unknown as WebSocket, { code } as CloseEvent);
    };
    channel.onopen = () =>
      this.onopen?.call(this as unknown as WebSocket, new Event('open'));
    channel.onmessage = (event) => {
      if (this.ended) return;
      this.onmessage?.call(this as unknown as WebSocket, event as MessageEvent);
    };
    channel.onclose = () => fireClose();
    channel.onerror = () => {
      this.onerror?.call(this as unknown as WebSocket, new Event('error'));
      fireClose(4400);
    };
  }

  get readyState(): number {
    if (this.ended) return 3;
    const map: Record<RTCDataChannelState, number> = {
      connecting: 0,
      open: 1,
      closing: 2,
      closed: 3,
    };
    return map[this.channel.readyState];
  }

  get bufferedAmount(): number {
    return this.channel.bufferedAmount;
  }

  send(data: ArrayBuffer) {
    if (this.ended || this.channel.readyState !== 'open')
      throw new SessionError('transport');
    this.channel.send(data);
  }

  close() {
    if (this.ended) return;
    this.ended = true;
    this.onClose();
    this.channel.onopen =
      this.channel.onmessage =
      this.channel.onclose =
      this.channel.onerror =
        null;
    try {
      this.channel.close();
    } catch {
      // ignore
    }
  }
}
