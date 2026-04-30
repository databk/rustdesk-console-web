import React, { useEffect, useState, createContext, useContext } from 'react';
import { ConfigProvider, theme } from 'antd';
import type { ThemeConfig } from 'antd';

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

export type ThemeMode = 'light' | 'dark';

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

const ThemeProvider: React.FC<ThemeProviderProps> = ({ mode = 'light', children }) => {
  const [currentMode, setCurrentMode] = useState<ThemeMode>(mode);

  useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  const setMode = (newMode: ThemeMode) => {
    setCurrentMode(newMode);
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