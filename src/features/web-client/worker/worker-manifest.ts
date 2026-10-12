export function workerAssetUrl(
  manifest: unknown,
  buildId: string,
  scope: string,
): URL {
  if (
    !manifest ||
    typeof manifest !== 'object' ||
    !('file' in manifest) ||
    typeof manifest.file !== 'string' ||
    !/^[a-zA-Z0-9_-]+-worker\.[a-f0-9]{8,}\.js$/.test(manifest.file) ||
    !('buildId' in manifest) ||
    typeof manifest.buildId !== 'string' ||
    !/^[a-f0-9]{64}$/.test(buildId) ||
    manifest.buildId !== buildId
  )
    throw new Error('Web Client page and Worker builds do not match');
  return new URL(manifest.file, scope);
}
