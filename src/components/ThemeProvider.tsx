import React, { useEffect, useState, createContext, useContext } from 'react';
import { ConfigProvider, theme } from 'antd';
import type { ThemeConfig } from 'antd';
import { getStoredThemeMode, storeThemeMode, type ThemeMode } from '@/utils/theme';

const darkTheme: ThemeConfig = {
  algorithm: [theme.darkAlgorithm],
  token: {
    colorBgBase: '#141414',
    colorTextBase: '#ffffff',
  },
};

const lightTheme: ThemeConfig = {
  token: {
    colorBgBase: '#ffffff',
    colorTextBase: '#000000',
  },
};

export interface ThemeProviderProps {
  mode?: ThemeMode;
  children: React.ReactNode;
}

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const ThemeProvider: React.FC<ThemeProviderProps> = ({ mode, children }) => {
  // 初始化时从 localStorage 读取主题设置，如果没有则使用传入的 mode 或默认 light
  const getInitialMode = (): ThemeMode => {
    const storedMode = getStoredThemeMode();
    return mode || storedMode;
  };

  const [currentMode, setCurrentMode] = useState<ThemeMode>(getInitialMode);

  // 当传入的 mode 变化时更新当前模式
  useEffect(() => {
    if (mode) {
      setCurrentMode(mode);
    }
  }, [mode]);

  const setMode = (newMode: ThemeMode) => {
    setCurrentMode(newMode);
    storeThemeMode(newMode);
  };

  useEffect(() => {
    // 应用 CSS 变量到根元素
    const root = document.documentElement;
    if (currentMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [currentMode]);

  return (
    <ThemeContext.Provider value={{ mode: currentMode, setMode }}>
      <ConfigProvider theme={currentMode === 'dark' ? darkTheme : lightTheme}>
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;