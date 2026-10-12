import type { WebClientGrant } from './gateway';

// 取消先失效本地代次；已经到达服务器的申请在迟到时仍需结束。
export class GrantLifecycle {
  private epoch = 0;
  private grant?: WebClientGrant;
  constructor(private readonly end: (guid: string) => Promise<unknown>) {}
  async acquire(request: () => Promise<WebClientGrant>) {
    this.cancel();
    const epoch = this.epoch;
    const grant = await request();
    if (epoch !== this.epoch) {
      this.finish(grant);
      return;
    }
    this.grant = grant;
    return grant;
  }
  current() {
    return this.grant;
  }
  cancel() {
    ++this.epoch;
    const grant = this.grant;
    this.grant = undefined;
    if (grant) this.finish(grant);
  }
  private finish(grant: WebClientGrant) {
    void this.end(grant.sessionGuid).catch(() => {});
  }
}
