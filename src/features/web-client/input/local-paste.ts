type PasteKeys = Pick<
  KeyboardEvent,
  'code' | 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'getModifierState'
>;
export function localPlatform() {
  return typeof navigator === 'undefined'
    ? ''
    : (navigator as Navigator & { userAgentData?: { platform?: string } })
        .userAgentData?.platform ||
        navigator.platform ||
        navigator.userAgent;
}
// 这是本机浏览器粘贴组合，与远端操作系统无关；Win+V必须按普通组合转发。
export function isLocalPasteShortcut(
  event: PasteKeys,
  platform = localPlatform(),
) {
  if (event.altKey || event.getModifierState('AltGraph')) return false;
  if (event.code === 'KeyV')
    return (
      (event.ctrlKey && !event.metaKey) ||
      (/mac|iphone|ipad/i.test(platform) && event.metaKey && !event.ctrlKey)
    );
  return (
    event.code === 'Insert' &&
    event.shiftKey &&
    !event.ctrlKey &&
    !event.metaKey
  );
}
