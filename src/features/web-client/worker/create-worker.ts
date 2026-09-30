export async function createSessionWorker(
  signal?: AbortSignal,
): Promise<Worker> {
  if (process.env.NODE_ENV === 'production') {
    const response = await fetch('/web-client-worker.json', {
      cache: 'no-store',
      signal,
    });
    if (!response.ok) throw new Error('Worker manifest unavailable');
    const manifest: unknown = await response.json();
    if (
      !manifest ||
      typeof manifest !== 'object' ||
      !('file' in manifest) ||
      typeof manifest.file !== 'string' ||
      !/^[a-zA-Z0-9_-]+-worker(?:\.[a-f0-9]+)?\.js$/.test(manifest.file)
    ) {
      throw new Error('Invalid Worker manifest');
    }
    return new Worker(new URL(`/${manifest.file}`, location.origin), {
      type: 'module',
    });
  }
  return new Worker(new URL('./session.worker.ts', import.meta.url), {
    type: 'module',
  });
}
