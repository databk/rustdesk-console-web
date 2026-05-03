import React from 'react';
import { useModel } from '@umijs/max';
import { ConfigProvider, theme } from 'antd';

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { initialState } = useModel('@@initialState');
  const isDark = initialState?.settings?.navTheme === 'realDark';

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        cssVar: true,
      }}
    >
      {children}
    </ConfigProvider>
  );
};

export default ThemeProvider;
