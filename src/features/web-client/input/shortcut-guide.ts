import { isLocalPasteShortcut, localPlatform } from './local-paste';

// 只判断浏览器已交给当前画布的事件；不能探测被系统先截获的组合。
export function shouldGuideShortcut(
  event: KeyboardEvent,
  platform = localPlatform(),
) {
  if (
    event.repeat ||
    event.isComposing ||
    event.key === 'Process' ||
    event.key === 'Dead' ||
    event.key === 'AltGraph' ||
    event.getModifierState('AltGraph')
  )
    return false;
  if (isLocalPasteShortcut(event, platform)) return false;
  const apple = /mac|iphone|ipad/i.test(platform);
  const localCommand =
    (event.ctrlKey && !event.metaKey) ||
    (apple && event.metaKey && !event.ctrlKey);
  // 剪贴板操作沿既有直接复制/粘贴链，不用引导打断。
  if (
    !event.altKey &&
    ((!event.shiftKey &&
      localCommand &&
      ['KeyC', 'KeyX', 'Insert'].includes(event.code)) ||
      (!event.ctrlKey &&
        !event.metaKey &&
        event.shiftKey &&
        event.code === 'Delete'))
  )
    return false;
  if (/^(Control|Alt|Shift|Meta)(Left|Right)$/.test(event.code))
    return !apple && event.code.startsWith('Meta');
  return (
    event.ctrlKey ||
    event.altKey ||
    event.metaKey ||
    /^F([1-9]|1\d|2[0-4])$/.test(event.code)
  );
}
