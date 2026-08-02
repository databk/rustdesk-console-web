import Bowser from 'bowser';

export function getDeviceInfo(): API.DeviceInfo {
  const browser = Bowser.getParser(window.navigator.userAgent);
  return {
    os: browser.getOSName(true),
    type: 'browser',
    name: `${browser.getBrowserName()} - ${browser.getBrowserVersion()}`,
  };
}

export function parseOidcOptions(res: string[]): API.OidcLoginInfo[] {
  const ops: API.OidcLoginInfo[] = [];
  for (const item of res) {
    if (item.startsWith('common-oidc/')) {
      try {
        const parsed = JSON.parse(item.substring('common-oidc/'.length));
        if (Array.isArray(parsed)) {
          ops.push(...parsed);
        }
      } catch {
        // Skip malformed JSON entries
      }
    } else if (item.startsWith('oidc/')) {
      ops.push({ name: item.substring('oidc/'.length) });
    }
  }
  return ops;
}