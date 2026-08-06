export const DEFAULT_GENERAL_SETTINGS: API.GeneralSettings = {
  watermarkEnabled: true,
  defaultLanguage: 'en-US',
  site: {
    frontendUrl: '',
    backendUrl: '',
  },
  webauthn: {
    enabled: false,
    rpName: 'RustDesk Console',
  },
};

export const getUsernameWatermark = (
  settings: Pick<API.GeneralSettings, 'watermarkEnabled'>,
  username?: string,
) =>
  settings.watermarkEnabled && username ? { content: username } : undefined;
