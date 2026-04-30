import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import React from 'react';
import { createStyles } from 'antd-style';
import { useTheme } from '@/components/ThemeProvider';

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

export interface ThemeSwitcherProps {}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = () => {
  const { styles } = useStyles();
  const { mode, setMode } = useTheme();

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
  };

  return (
    <div className={styles.wrapper} onClick={toggleTheme} title={mode === 'light' ? '切换到深色模式' : '切换到浅色模式'}>
      {mode === 'light' ? (
        <MoonOutlined style={{ fontSize: 16 }} />
      ) : (
        <SunOutlined style={{ fontSize: 16 }} />
      )}
    </div>
  );
};

export { ThemeSwitcher };