/**
 * Get the full avatar URL from the avatar field returned by the backend.
 * - If avatar is falsy, returns undefined (fallback to default icon).
 * - If avatar starts with http:// or https://, returns as-is (full URL).
 * - If avatar starts with /, returns as-is (relative path, resolved by proxy/nginx).
 * - Otherwise, prepends / to make it a valid relative path.
 */
export function getAvatarUrl(avatar?: string): string | undefined {
  if (!avatar) {
    return undefined;
  }
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar;
  }
  if (avatar.startsWith('/')) {
    return avatar;
  }
  return `/${avatar}`;
}
