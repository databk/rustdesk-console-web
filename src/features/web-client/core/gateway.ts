import { SessionError } from './errors';
import type { ServerProfile } from './profile';
import type { SocketFactory, TransportSocket } from './transport';

export interface WebClientGrant {
  sessionGuid: string;
  gatewayPath: '/api/web-client/socket';
  tickets: { rendezvous: string; relay: string };
  expiresAt: string;
}

// 原生握手、端到端加密和服务器身份仍由 RemoteSession 校验。
// 此适配器只把固定上游连接送入已授权的 Console 通道。
export function gatewaySocketFactory(
  grant: WebClientGrant,
  profile: ServerProfile,
  origin: string,
  createSocket: SocketFactory = (url) => new WebSocket(url),
): SocketFactory {
  const endpoint = new URL(origin);
  if (
    endpoint.protocol !== 'https:' ||
    endpoint.username ||
    endpoint.password ||
    grant.gatewayPath !== '/api/web-client/socket'
  )
    throw new SessionError('configuration');
  endpoint.protocol = 'wss:';
  endpoint.pathname = grant.gatewayPath;
  endpoint.search = '';
  endpoint.hash = '';
  const used = new Set<string>();
  return (url) => {
    const kind =
      url === profile.idServerUrl
        ? 'rendezvous'
        : url === profile.relayServerUrl
          ? 'relay'
          : undefined;
    const expiresAt = Date.parse(grant.expiresAt);
    if (
      !kind ||
      used.has(kind) ||
      !Number.isFinite(expiresAt) ||
      expiresAt <= Date.now()
    )
      throw new SessionError('authorization');
    const ticket = grant.tickets[kind];
    if (typeof ticket !== 'string' || !ticket || ticket.length > 1024)
      throw new SessionError('authorization');
    used.add(kind);
    return new GatewaySocket(
      createSocket(endpoint.href),
      ticket,
    ) as unknown as TransportSocket;
  };
}

class GatewaySocket {
  onopen: WebSocket['onopen'] = null;
  onmessage: WebSocket['onmessage'] = null;
  onclose: WebSocket['onclose'] = null;
  onerror: WebSocket['onerror'] = null;
  private ready = false;
  private ended = false;
  constructor(
    private readonly socket: TransportSocket,
    ticket: string,
  ) {
    socket.binaryType = 'arraybuffer';
    socket.onopen = () => {
      if (!this.ended) socket.send(JSON.stringify({ ticket }));
      ticket = '';
    };
    socket.onmessage = (event) => {
      if (this.ended) return;
      if (!this.ready) {
        // 认证 ready 永远不送入 protobuf/密文解码器。
        if (event.data !== '{"ready":true}') {
          this.reject();
          return;
        }
        this.ready = true;
        this.onopen?.call(this as unknown as WebSocket, new Event('open'));
      } else if (event.data instanceof ArrayBuffer) {
        this.onmessage?.call(this as unknown as WebSocket, event);
      } else this.reject();
    };
    socket.onclose = (event) => {
      this.ended = true;
      this.onclose?.call(this as unknown as WebSocket, event);
      socket.onopen = socket.onmessage = socket.onclose = socket.onerror = null;
    };
    socket.onerror = (event) =>
      this.onerror?.call(this as unknown as WebSocket, event);
  }
  get readyState() {
    return this.ended ? 3 : this.ready ? this.socket.readyState : 0;
  }
  get bufferedAmount() {
    return this.socket.bufferedAmount;
  }
  get binaryType() {
    return this.socket.binaryType;
  }
  set binaryType(value: BinaryType) {
    this.socket.binaryType = value;
  }
  send(value: Parameters<WebSocket['send']>[0]) {
    if (!this.ready || this.ended) throw new SessionError('authorization');
    this.socket.send(value);
  }
  close() {
    this.ended = true;
    this.socket.onopen =
      this.socket.onmessage =
      this.socket.onclose =
      this.socket.onerror =
        null;
    if (this.socket.readyState < 2) this.socket.close();
  }
  private reject() {
    this.onclose?.call(
      this as unknown as WebSocket,
      { code: 4403 } as CloseEvent,
    );
    this.close();
  }
}
