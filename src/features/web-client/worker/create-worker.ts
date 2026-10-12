import { workerAssetUrl } from './worker-manifest';

export async function createSessionWorker(
  signal?: AbortSignal,
): Promise<Worker> {
  if (process.env.NODE_ENV === 'production') {
    const scope = new URL(APP_PUBLIC_PATH, location.origin).href;
    const response = await fetch(new URL('web-client-worker.json', scope), {
      cache: 'no-store',
      signal,
    });
    if (!response.ok) throw new Error('Worker manifest unavailable');
    const manifest: unknown = await response.json();
    if (signal?.aborted)
      throw new DOMException('Worker creation cancelled', 'AbortError');
    let asset: URL;
    try {
      asset = workerAssetUrl(manifest, WEB_CLIENT_BUILD_ID, scope);
    } catch (error) {
      // 旧页面仍可显示现有内容；新连接必须先由用户确认更新。
      window.dispatchEvent(new CustomEvent('sw.updated'));
      throw error;
    }
    if (signal?.aborted)
      throw new DOMException('Worker creation cancelled', 'AbortError');
    return new Worker(asset, {
      type: 'module',
    });
  }
  return new Worker(new URL('./session.worker.ts', import.meta.url), {
    type: 'module',
  });
}
