export type KeyboardLockState =
  | 'idle'
  | 'requesting'
  | 'locked'
  | 'denied'
  | 'unsupported';
type KeyboardApi = { lock(): Promise<void>; unlock(): void };
type KeyboardLease = {
  pending?: RemoteKeyboardLock;
  owner?: RemoteKeyboardLock;
  queued?: RemoteKeyboardLock;
};
// Keyboard Lock 属于浏览器 API，不能让已销毁实例的迟到授权解除新实例的锁。
const leases = new WeakMap<KeyboardApi, KeyboardLease>();

// 只在网页全屏且画面有焦点时请求，浏览器未交出的系统热键无法转发。
export class RemoteKeyboardLock {
  private epoch = 0;
  private attempted = false;
  private disposed = false;
  private denied = false;
  private abort = new AbortController();
  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly workspace: HTMLElement,
    private readonly allowed: () => boolean,
    private readonly status: (state: KeyboardLockState) => void,
    private readonly keyboard: KeyboardApi | undefined = (
      navigator as Navigator & { keyboard?: KeyboardApi }
    ).keyboard,
  ) {
    const options = { signal: this.abort.signal };
    canvas.addEventListener('focus', this.activate, options);
    canvas.addEventListener('pointerdown', this.activate, options);
    canvas.addEventListener('blur', this.release, options);
    window.addEventListener('blur', this.release, options);
    document.addEventListener('visibilitychange', this.changed, options);
    document.addEventListener('fullscreenchange', this.changed, options);
  }
  private eligible() {
    return (
      !this.disposed &&
      this.allowed() &&
      !document.hidden &&
      document.hasFocus() &&
      document.fullscreenElement === this.workspace &&
      document.activeElement === this.canvas
    );
  }
  private changed = () => {
    if (this.eligible()) this.activate();
    else this.release();
  };
  activate = () => {
    if (!this.eligible() || this.attempted) return;
    if (!this.keyboard?.lock || !this.keyboard.unlock) {
      this.attempted = true;
      this.status('unsupported');
      return;
    }
    this.denied = false;
    const keyboard = this.keyboard;
    let lease = leases.get(keyboard);
    if (!lease) {
      lease = {};
      leases.set(keyboard, lease);
    }
    if (lease.pending) {
      lease.queued = this;
      this.status('requesting');
      return;
    }
    this.attempted = true;
    const epoch = this.epoch;
    lease.pending = this;
    lease.owner = this;
    this.status('requesting');
    let promise: Promise<void>;
    try {
      promise = keyboard.lock();
    } catch {
      lease.pending = undefined;
      lease.owner = undefined;
      this.denied = true;
      this.status('denied');
      return;
    }
    void promise
      .then(() => {
        if (epoch !== this.epoch || !this.eligible()) {
          keyboard.unlock();
          if (lease.owner === this) lease.owner = undefined;
        } else this.status('locked');
      })
      .catch(() => {
        if (lease.owner === this) lease.owner = undefined;
        if (epoch === this.epoch && this.eligible()) {
          this.denied = true;
          this.status('denied');
        }
      })
      .finally(() => {
        lease.pending = undefined;
        const queued = lease.queued;
        lease.queued = undefined;
        queued?.activate();
      });
  };
  release = () => {
    ++this.epoch;
    this.attempted = false;
    const lease = this.keyboard && leases.get(this.keyboard);
    if (lease?.queued === this) lease.queued = undefined;
    if (lease?.owner === this) {
      this.keyboard?.unlock();
      lease.owner = undefined;
    }
    // 失焦仍释放租约，但保留最近失败供菜单重试；新请求/销毁才清掉失败结果。
    this.status(this.denied && !this.disposed ? 'denied' : 'idle');
  };
  dispose() {
    this.disposed = true;
    this.abort.abort();
    this.release();
  }
}
