// jsdom 不执行布局；此替身只供组件逻辑测试，不作为真实尺寸验收。
if (typeof globalThis.ResizeObserver === 'undefined') {
  Object.defineProperty(globalThis, 'ResizeObserver', {
    configurable: true,
    writable: true,
    value: class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  });
}

// AntD 6 表单使用 MessageChannel 调度通知。使用异步计时器，避免引入
// Node 原生 MessagePort 后让 React 调度器持有常驻句柄，妨碍 Jest 退出。
class TestMessagePort extends EventTarget {
  onmessage: ((event: MessageEvent) => void) | null = null;
  peer?: TestMessagePort;
  private closed = false;
  private pending = new Set<ReturnType<typeof setTimeout>>();

  postMessage(data: unknown) {
    const receiver = this.peer;
    if (this.closed || !receiver || receiver.closed) return;
    const timer = setTimeout(() => {
      receiver.pending.delete(timer);
      if (receiver.closed) return;
      const event = new MessageEvent('message', { data });
      receiver.onmessage?.(event);
      receiver.dispatchEvent(event);
    }, 0);
    receiver.pending.add(timer);
  }

  start() {}

  close() {
    this.closed = true;
    this.onmessage = null;
    for (const timer of this.pending) clearTimeout(timer);
    this.pending.clear();
  }
}

if (typeof globalThis.MessageChannel === 'undefined') {
  Object.defineProperty(globalThis, 'MessageChannel', {
    configurable: true,
    writable: true,
    value: class {
      port1 = new TestMessagePort();
      port2 = new TestMessagePort();

      constructor() {
        this.port1.peer = this.port2;
        this.port2.peer = this.port1;
      }
    },
  });
}

export {};
