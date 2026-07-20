export const DEFAULT_GENERAL_SETTINGS: API.GeneralSettings = {
  siteName: 'RustDesk Console',
  watermarkEnabled: true,
};

export const containsControlCharacters = (value: string) =>
  Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0) || 0;
    return codePoint <= 0x1f || (codePoint >= 0x7f && codePoint <= 0x9f);
  });

export const getUsernameWatermark = (
  settings: API.GeneralSettings,
  username?: string,
) =>
  settings.watermarkEnabled && username ? { content: username } : undefined;

export const getRuntimePageTitle = (
  defaultPageTitle: string | undefined,
  siteName: string,
) => {
  if (
    !defaultPageTitle ||
    defaultPageTitle === DEFAULT_GENERAL_SETTINGS.siteName
  ) {
    return siteName;
  }
  if (
    defaultPageTitle === siteName ||
    defaultPageTitle.endsWith(` - ${siteName}`)
  ) {
    return defaultPageTitle;
  }

  const defaultSuffix = ` - ${DEFAULT_GENERAL_SETTINGS.siteName}`;
  const pageName = defaultPageTitle.endsWith(defaultSuffix)
    ? defaultPageTitle.slice(0, -defaultSuffix.length)
    : defaultPageTitle;
  return `${pageName} - ${siteName}`;
};
