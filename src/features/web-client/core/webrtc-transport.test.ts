/** @jest-environment node */
import { afterEach, expect, jest, test } from '@jest/globals';
import { SessionError } from './errors';
import { WebRtcOfferer } from './webrtc-transport';

class MockChannel {
  label = 'rustdesk';
  ordered = true;
  binaryType: BinaryType = 'blob';
  readyState: RTCDataChannelState = 'connecting';
  bufferedAmount = 0;
  onopen: ((ev: Event) => void) | null = null;
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;
  sent: ArrayBuffer[] = [];
  send(data: ArrayBuffer) {
    this.sent.push(data);
  }
  close() {
    this.readyState = 'closed';
    this.onclose?.();
  }
  open() {
    this.readyState = 'open';
    this.onopen?.(new Event('open'));
  }
  receive(data: ArrayBuffer) {
    this.onmessage?.({ data } as MessageEvent);
  }
}

class MockPC {
  iceServers?: RTCIceServer[];
  onicecandidate: ((ev: RTCPeerConnectionIceEvent) => void) | null = null;
  onconnectionstatechange: (() => void) | null = null;
  connectionState: RTCPeerConnectionState = 'new';
  localDescription: RTCSessionDescriptionInit | null = null;
  remoteDescription: RTCSessionDescriptionInit | null = null;
  channel?: MockChannel;
  addedIce: RTCIceCandidateInit[] = [];
  closed = false;
  constructor(config?: RTCConfiguration) {
    this.iceServers = config?.iceServers;
  }
  createDataChannel(label: string) {
    this.channel = new MockChannel();
    this.channel.label = label;
    return this.channel as unknown as RTCDataChannel;
  }
  async createOffer() {
    return {
      type: 'offer' as RTCSdpType,
      sdp: 'v=0\r\nm=application 9 UDP/DTLS/SCTP webrtc\r\n',
    };
  }
  async setLocalDescription(desc: RTCSessionDescriptionInit) {
    this.localDescription = desc;
  }
  async setRemoteDescription(desc: RTCSessionDescriptionInit) {
    this.remoteDescription = desc;
  }
  async addIceCandidate(candidate: RTCIceCandidateInit) {
    this.addedIce.push(candidate);
  }
  close() {
    this.closed = true;
    this.connectionState = 'closed';
  }
  emitIce(candidate: string) {
    this.onicecandidate?.({
      candidate: {
        candidate,
        sdpMid: '0',
        sdpMLineIndex: 0,
      },
    } as unknown as RTCPeerConnectionIceEvent);
  }
  emitState(state: RTCPeerConnectionState) {
    this.connectionState = state;
    this.onconnectionstatechange?.();
  }
}

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

function offerer() {
  let pc!: MockPC;
  const Ctor = function (this: unknown, config?: RTCConfiguration) {
    pc = new MockPC(config);
    return pc as unknown as RTCPeerConnection;
  } as unknown as typeof RTCPeerConnection;
  const instance = new WebRtcOfferer(
    [{ urls: 'stun:stun.example.test:3478' }],
    { RTCPeerConnection: Ctor },
  );
  return { get pc() { return pc; }, instance };
}

test('createOffer opens a DataChannel and returns the SDP offer', async () => {
  const { pc, instance } = offerer();
  const sdp = await instance.createOffer();
  expect(sdp).toContain('m=application');
  expect(pc.channel?.label).toBe('rustdesk');
  expect(pc.localDescription?.type).toBe('offer');
});

test('local ICE candidates trickle through the registered callback', async () => {
  const { pc, instance } = offerer();
  await instance.createOffer();
  const candidates: string[] = [];
  instance.onLocalIce((candidate: string) => candidates.push(candidate));
  pc.emitIce('candidate:1 1 udp 2113929471 192.168.1.2 50000 typ host');
  pc.emitIce('candidate:2 1 udp 2113929471 10.0.0.2 50001 typ host');
  expect(candidates).toEqual([
    'candidate:1 1 udp 2113929471 192.168.1.2 50000 typ host',
    'candidate:2 1 udp 2113929471 10.0.0.2 50001 typ host',
  ]);
});

test('remote ICE candidates buffer before the answer and flush after', async () => {
  const { pc, instance } = offerer();
  await instance.createOffer();
  await instance.addRemoteIce('candidate:a');
  await instance.addRemoteIce('candidate:b');
  expect(pc.addedIce).toHaveLength(0);
  await instance.setRemoteAnswer('v=0\r\nm=application 9 UDP/DTLS/SCTP webrtc\r\n');
  expect(pc.addedIce.map((c) => c.candidate)).toEqual([
    'candidate:a',
    'candidate:b',
  ]);
  await instance.addRemoteIce('candidate:c');
  expect(pc.addedIce.map((c) => c.candidate)).toEqual([
    'candidate:a',
    'candidate:b',
    'candidate:c',
  ]);
});

test('setRemoteAnswer rejects empty SDP and a missing answer is reported', async () => {
  const { instance } = offerer();
  await instance.createOffer();
  await expect(instance.setRemoteAnswer('')).rejects.toThrow('protocol');
});

test('whenOpen resolves when the DataChannel opens', async () => {
  const { pc, instance } = offerer();
  await instance.createOffer();
  const opened = instance.whenOpen();
  pc.channel?.open();
  await expect(opened).resolves.toBe(pc.channel);
});

test('whenOpen rejects on timeout', async () => {
  jest.useFakeTimers();
  const { instance } = offerer();
  await instance.createOffer();
  const pending = expect(instance.whenOpen(20)).rejects.toThrow('timeout');
  jest.advanceTimersByTime(20);
  await pending;
});

test('whenOpen rejects when the peer connection fails', async () => {
  const { pc, instance } = offerer();
  await instance.createOffer();
  const pending = expect(instance.whenOpen()).rejects.toThrow('transport');
  pc.emitState('failed');
  await pending;
});

test('asSocket adapts the DataChannel onto the transport subset', async () => {
  const { pc, instance } = offerer();
  await instance.createOffer();
  const socket = instance.asSocket();
  expect(socket.readyState).toBe(0);
  pc.channel?.open();
  expect(socket.readyState).toBe(1);
  socket.send(new Uint8Array([1, 2, 3]).buffer);
  expect(pc.channel?.sent[0]).toEqual(new Uint8Array([1, 2, 3]).buffer);
  let received: Uint8Array | undefined;
  socket.onmessage = (event) => {
    received = new Uint8Array(event.data);
  };
  pc.channel?.receive(new Uint8Array([9]).buffer);
  expect(received).toEqual(new Uint8Array([9]));
  socket.close();
  expect(socket.readyState).toBe(3);
});

test('close is idempotent and releases the peer connection', async () => {
  const { pc, instance } = offerer();
  await instance.createOffer();
  instance.close();
  instance.close();
  expect(pc.closed).toBe(true);
  await expect(instance.createOffer()).rejects.toThrow('protocol');
});

test('a missing RTCPeerConnection reports a configuration error', () => {
  expect(
    () =>
      new WebRtcOfferer([{ urls: 'stun:stun.example.test:3478' }], {
        RTCPeerConnection: undefined as unknown as typeof RTCPeerConnection,
      }),
  ).toThrow(SessionError);
});