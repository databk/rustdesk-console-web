import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import React from 'react';
import { useTheme } from '@/components/ThemeProvider';

export interface ThemeSwitcherProps {}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = () => {
  const { mode, setMode } = useTheme();

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
  };

  const wrapperStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.backgroundColor = 'var(--ant-color-fill-secondary, rgba(0, 0, 0, 0.06))';
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.backgroundColor = 'transparent';
  };

  return (
    <div
      style={wrapperStyle}
      onClick={toggleTheme}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title={mode === 'light' ? '切换到深色模式' : '切换到浅色模式'}
    >
      {mode === 'light' ? (
        <MoonOutlined style={{ fontSize: 16 }} />
      ) : (
        <SunOutlined style={{ fontSize: 16 }} />
      )}
    </div>
  );
};

export { ThemeSwitcher };