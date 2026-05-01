export const THEME_KEY = 'rustdesk_theme_settings';

export type ThemeMode = 'light' | 'dark';

export type NavTheme = 'light' | 'dark' | 'realDark';

export interface ThemeSettings {
  navTheme?: NavTheme;
  layout?: 'side' | 'top' | 'mix';
  contentWidth?: 'Fixed' | 'Fluid';
  fixedHeader?: boolean;
  fixSiderbar?: boolean;
  autoHideHeader?: boolean;
  splitMenus?: boolean;
  colorPrimary?: string;
  sideTheme?: 'dark' | 'light';
  colorWeak?: boolean;
  menu?: {
    hide?: boolean;
    locale?: boolean;
  };
  [key: string]: unknown;
}

/**
 * 从 localStorage 读取主题设置
 */
export function getStoredThemeSettings(): ThemeSettings | undefined {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore
  }
  return undefined;
}

/**
 * 保存主题设置到 localStorage
 */
export function storeThemeSettings(settings: ThemeSettings): void {
  try {
    localStorage.setItem(THEME_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

/**
 * 从 localStorage 读取主题模式
 */
export function getStoredThemeMode(): ThemeMode {
  const settings = getStoredThemeSettings();
  if (settings?.navTheme === 'dark' || settings?.navTheme === 'realDark') {
    return 'dark';
  }
  return 'light';
}

/**
 * 保存主题模式到 localStorage
 */
export function storeThemeMode(mode: ThemeMode): void {
  const stored = getStoredThemeSettings();
  const settings: ThemeSettings = {
    ...(stored || {}),
    navTheme: mode,
  };
  storeThemeSettings(settings);
}

/**
 * 获取当前主题模式（从 localStorage 或默认值）
 */
export function getCurrentThemeMode(): ThemeMode {
  return getStoredThemeMode();
}