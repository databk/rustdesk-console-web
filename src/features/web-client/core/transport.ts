import { SECRETBOX_TAG_BYTES, type SessionCipher } from './crypto';
import { SessionError } from './errors';

// Initial defensive bounds; throughput tuning requires real-device acceptance.
export const TRANSPORT_LIMITS = {
  packet: 8 * 1024 * 1024,
  queueBytes: 16 * 1024 * 1024,
  queueCount: 64,
};
export type SocketFactory = (url: string) => WebSocket;
type Waiter = {
  resolve: (value: Uint8Array) => void;
  reject: (error: SessionError) => void;
  timer: ReturnType<typeof setTimeout>;
};

export class BinaryTransport {
  private socket?: WebSocket;
  private cipher?: SessionCipher;
  private queue: Uint8Array[] = [];
  private queuedBytes = 0;
  private waiter?: Waiter;
  private end?: SessionError;
  private cancelOpen?: (error: SessionError) => void;

  constructor(
    private readonly createSocket: SocketFactory = (url) => new WebSocket(url),
  ) {}

  open(url: string, timeout = 12000): Promise<void> {
    if (this.socket || this.end)
      return Promise.reject(new SessionError('cancelled'));
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => this.close(new SessionError('timeout')),
        timeout,
      );
      this.cancelOpen = (error) => {
        clearTimeout(timer);
        reject(error);
      };
      try {
        const socket = this.createSocket(url);
        this.socket = socket;
        socket.binaryType = 'arraybuffer';
        socket.onopen = () => {
          clearTimeout(timer);
          this.cancelOpen = undefined;
          resolve();
        };
        socket.onclose = socket.onerror = () =>
          this.close(new SessionError('transport'));
        socket.onmessage = (event) => {
          if (!(event.data instanceof ArrayBuffer)) {
            this.close(new SessionError('protocol'));
            return;
          }
          const bytes = new Uint8Array(event.data);
          if (bytes.length > TRANSPORT_LIMITS.packet) {
            this.close(new SessionError('overload'));
            return;
          }
          if (this.waiter) {
            const waiter = this.waiter;
            this.waiter = undefined;
            clearTimeout(waiter.timer);
            waiter.resolve(bytes);
          } else if (
            this.queue.length >= TRANSPORT_LIMITS.queueCount ||
            this.queuedBytes + bytes.length > TRANSPORT_LIMITS.queueBytes
          ) {
            this.close(new SessionError('overload'));
          } else {
            this.queue.push(bytes);
            this.queuedBytes += bytes.length;
          }
        };
      } catch {
        this.close(new SessionError('transport'));
      }
    });
  }

  secure(cipher: SessionCipher) {
    if (this.cipher || this.end) {
      cipher.dispose();
      throw new SessionError('encryption');
    }
    this.cipher = cipher;
  }

  send(bytes: Uint8Array) {
    if (this.end) throw this.end;
    if (this.socket?.readyState !== 1) throw new SessionError('transport');
    const packetBytes = bytes.length + (this.cipher ? SECRETBOX_TAG_BYTES : 0);
    if (
      packetBytes > TRANSPORT_LIMITS.packet ||
      this.socket.bufferedAmount + packetBytes > TRANSPORT_LIMITS.queueBytes
    ) {
      this.close(new SessionError('overload'));
      throw this.end;
    }
    try {
      const packet = this.cipher ? this.cipher.encrypt(bytes) : bytes;
      this.socket.send(new Uint8Array(packet).buffer);
    } catch {
      this.close(new SessionError('transport'));
      throw this.end;
    }
  }

  async drain(maxBufferedBytes = 1024 * 1024) {
    const deadline = Date.now() + 30000;
    while (
      !this.end &&
      this.socket &&
      this.socket.bufferedAmount > maxBufferedBytes
    ) {
      if (Date.now() > deadline) throw new SessionError('timeout');
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    if (this.end) throw this.end;
    if (this.socket?.readyState !== 1) throw new SessionError('transport');
  }

  async receive(timeout = 12000): Promise<Uint8Array> {
    if (this.end) throw this.end;
    if (this.waiter) throw new SessionError('protocol');
    let bytes = this.queue.shift();
    if (bytes) this.queuedBytes -= bytes.length;
    else
      bytes = await new Promise<Uint8Array>((resolve, reject) => {
        const timer = setTimeout(
          () => this.close(new SessionError('timeout')),
          timeout,
        );
        this.waiter = { resolve, reject, timer };
      });
    if (this.end) throw this.end;
    try {
      return this.cipher ? this.cipher.decrypt(bytes) : bytes;
    } catch {
      this.close(new SessionError('encryption'));
      throw this.end;
    }
  }

  close(error = new SessionError('cancelled')) {
    if (this.end) return;
    this.end = error;
    this.cancelOpen?.(error);
    this.cancelOpen = undefined;
    if (this.waiter) {
      clearTimeout(this.waiter.timer);
      this.waiter.reject(error);
      this.waiter = undefined;
    }
    this.queue = [];
    this.queuedBytes = 0;
    this.cipher?.dispose();
    this.cipher = undefined;
    if (this.socket) {
      this.socket.onopen =
        this.socket.onmessage =
        this.socket.onclose =
        this.socket.onerror =
          null;
      if (this.socket.readyState < 2) this.socket.close();
      this.socket = undefined;
    }
  }
}
