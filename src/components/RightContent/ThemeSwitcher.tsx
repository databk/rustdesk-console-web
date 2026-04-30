import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token, css }) => ({
  wrapper: css`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    &:hover {
      background-color: ${token.colorFillSecondary};
    }
  `,
}));

export type ThemeMode = 'light' | 'dark';

export interface ThemeSwitcherProps {
  mode?: ThemeMode;
  onChange?: (mode: ThemeMode) => void;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  mode = 'light',
  onChange,
}) => {
  const { styles } = useStyles();
  const [currentMode, setCurrentMode] = useState<ThemeMode>(mode);

  useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  const toggleTheme = () => {
    const newMode: ThemeMode = currentMode === 'light' ? 'dark' : 'light';
    setCurrentMode(newMode);
    onChange?.(newMode);
  };

  return (
    <div className={styles.wrapper} onClick={toggleTheme} title={currentMode === 'light' ? '切换到深色模式' : '切换到浅色模式'}>
      {currentMode === 'light' ? (
        <MoonOutlined style={{ fontSize: 16 }} />
      ) : (
        <SunOutlined style={{ fontSize: 16 }} />
      )}
    </div>
  );
};

export { ThemeSwitcher };
