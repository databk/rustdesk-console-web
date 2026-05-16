import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { useIntl, useModel } from '@umijs/max';
import { Tooltip } from 'antd';
import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import React from 'react';

const THEME_KEY = 'rustdesk_theme_settings';

function getStoredThemeSettings(): Partial<LayoutSettings> | undefined {
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

function storeThemeSettings(settings: Partial<LayoutSettings>) {
  try {
    localStorage.setItem(THEME_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

const ThemeToggle: React.FC = () => {
  const intl = useIntl();
  const { initialState, setInitialState } = useModel('@@initialState');

  const isDark = initialState?.settings?.navTheme === 'realDark';

  const toggleTheme = () => {
    const currentSettings = initialState?.settings || {};
    const newNavTheme: 'light' | 'realDark' = isDark ? 'light' : 'realDark';

    const newSettings: Partial<LayoutSettings> = {
      ...currentSettings,
      navTheme: newNavTheme,
    };

    storeThemeSettings(newSettings);

    setInitialState((preInitialState) => ({
      ...preInitialState,
      settings: newSettings,
    }));
  };

  return (
    <Tooltip
      title={intl.formatMessage({
        id: isDark
          ? 'component.themeToggle.switchToLight'
          : 'component.themeToggle.switchToDark',
      })}
    >
      <span
        onClick={toggleTheme}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 4,
          fontSize: 18,
          cursor: 'pointer',
        }}
      >
        {isDark ? <SunOutlined /> : <MoonOutlined />}
      </span>
    </Tooltip>
  );
};

export default ThemeToggle;
