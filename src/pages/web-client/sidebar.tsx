import {
  ControlOutlined,
  ExpandOutlined,
  LayoutOutlined,
  RightOutlined,
} from '@ant-design/icons';
import React, { useEffect, useRef } from 'react';
import styles from './index.less';

export type ToolName = 'clipboard' | 'files' | 'input' | 'audio';
export type SidebarMode = 'overlay' | 'docked';

export function SessionSidebar({
  tool,
  mode,
  narrow,
  disabled,
  target,
  items,
  onSelect,
  onModeChange,
  onClose,
  text,
  displayControl,
  noticeControl,
  footer,
  children,
}: React.PropsWithChildren<{
  tool?: ToolName;
  mode: SidebarMode;
  narrow: boolean;
  disabled: boolean;
  target: string;
  items: {
    key: ToolName;
    icon: React.ReactNode;
    label: string;
    activity?: string;
  }[];
  onSelect: (tool: ToolName) => void;
  onModeChange: (mode: SidebarMode) => void;
  onClose: () => void;
  text: (key: string, fallback: string) => string;
  displayControl: React.ReactNode;
  noticeControl: React.ReactNode;
  footer: React.ReactNode;
}>) {
  const tabs = useRef<Partial<Record<ToolName, HTMLButtonElement | null>>>({});
  const close = useRef<HTMLButtonElement>(null);
  const open = !!tool;
  useEffect(() => {
    if (open) close.current?.focus({ preventScroll: true });
  }, [open]);
  return (
    <aside
      className={styles.toolsPanel}
      hidden={!open}
      id="web-client-sidebar"
      aria-label={text('tools', 'Session tools')}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !event.nativeEvent.isComposing) {
          event.preventDefault();
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <div className={styles.panelHeader}>
        <span className={styles.panelBrand}>
          <span className={styles.panelIcon}>
            <ControlOutlined />
          </span>
          <span>
            <strong>{text('tools', 'Session tools')}</strong>
            <small title={target}>{target}</small>
          </span>
        </span>
        <button
          ref={close}
          className={styles.panelClose}
          type="button"
          aria-label={text('closeTools', 'Close tools')}
          title={text('closeTools', 'Close tools')}
          onClick={onClose}
        >
          <RightOutlined />
        </button>
      </div>
      <fieldset
        className={styles.panelMode}
        aria-label={text('sidebarPosition', 'Sidebar position')}
      >
        <button
          type="button"
          aria-pressed={mode === 'overlay'}
          onClick={() => onModeChange('overlay')}
        >
          <ExpandOutlined aria-hidden />
          {text('sidebarOverlay', 'Overlay')}
        </button>
        <button
          type="button"
          aria-pressed={mode === 'docked'}
          disabled={narrow}
          title={
            narrow
              ? text('sidebarNarrow', 'Docking needs a wider window.')
              : undefined
          }
          onClick={() => onModeChange('docked')}
        >
          <LayoutOutlined aria-hidden />
          {text('sidebarDocked', 'Dock right')}
        </button>
      </fieldset>
      {noticeControl && (
        <div className={styles.panelNotice}>{noticeControl}</div>
      )}
      {displayControl && (
        <div className={styles.panelDisplay}>{displayControl}</div>
      )}
      <div
        className={styles.toolNav}
        role="tablist"
        aria-label={text('tools', 'Session tools')}
      >
        {items.map((item, index) => (
          <button
            key={item.key}
            ref={(element) => {
              tabs.current[item.key] = element;
            }}
            className={styles.toolButton}
            type="button"
            role="tab"
            id={'web-client-tab-' + item.key}
            aria-label={item.label}
            aria-selected={tool === item.key}
            aria-controls={'web-client-tool-' + item.key}
            tabIndex={tool === item.key ? 0 : -1}
            disabled={disabled}
            onClick={() => onSelect(item.key)}
            onKeyDown={(event) => {
              const direction =
                event.key === 'ArrowRight'
                  ? 1
                  : event.key === 'ArrowLeft'
                  ? -1
                  : 0;
              if (!direction && event.key !== 'Home' && event.key !== 'End')
                return;
              event.preventDefault();
              const next =
                event.key === 'Home'
                  ? items[0]
                  : event.key === 'End'
                  ? items[items.length - 1]
                  : items[(index + direction + items.length) % items.length];
              onSelect(next.key);
              tabs.current[next.key]?.focus();
            }}
          >
            <span className={styles.toolIcon}>
              {item.icon}
              {item.activity && (
                <span
                  className={styles.activityDot}
                  role="img"
                  aria-label={item.activity}
                />
              )}
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
      <div className={styles.panelBody}>{children}</div>
      <div className={styles.panelFooter}>{footer}</div>
    </aside>
  );
}
