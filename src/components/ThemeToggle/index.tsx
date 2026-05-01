import { BulbOutlined, MoonOutlined } from '@ant-design/icons';
import { useModel } from '@umijs/max';
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
    <Tooltip title={isDark ? '切换到亮色模式' : '切换到深色模式'}>
      <span
        onClick={toggleTheme}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px',
          fontSize: '18px',
          color: 'inherit',
          cursor: 'pointer',
        }}
      >
        {isDark ? <BulbOutlined /> : <MoonOutlined />}
      </span>
    </Tooltip>
  );
};

export default ThemeToggle;
