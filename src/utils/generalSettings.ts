export const DEFAULT_GENERAL_SETTINGS: API.GeneralSettings = {
  watermarkEnabled: true,
};

export const getUsernameWatermark = (
  settings: API.GeneralSettings,
  username?: string,
) =>
  settings.watermarkEnabled && username ? { content: username } : undefined;
