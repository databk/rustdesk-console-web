import React, { useEffect, useRef, useState } from 'react';
import {
  PushpinOutlined,
  PushpinFilled,
  DownOutlined,
  DesktopOutlined,
  ControlOutlined,
  FolderOpenOutlined,
  SoundOutlined,
  ExpandOutlined,
  CompressOutlined,
  DisconnectOutlined,
  MinusOutlined,
} from '@ant-design/icons';
import styles from './index.less';
export type ToolName = 'display' | 'input' | 'audio';
type Text = (key: string, fallback: string) => string;
export function SessionToolbar({
  tool,
  onSelect,
  onFiles,
  onDisconnect,
  onFullscreen,
  fullscreen,
  connected,
  busy,
  audio,
  text,
  children,
}: {
  tool?: ToolName;
  onSelect: (tool?: ToolName) => void;
  onFiles: () => void;
  onDisconnect: () => void;
  onFullscreen: () => void;
  fullscreen: boolean;
  connected: boolean;
  busy: boolean;
  audio: boolean;
  text: Text;
  children: React.ReactNode;
}) {
  const [pinned, setPinned] = useState(false);
  const [shown, setShown] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hovered = useRef(false);
  const handle = useRef<HTMLButtonElement>(null);
  const cancel = () => {
    clearTimeout(timer.current);
  };
  const schedule = () => {
    cancel();
    if (!pinned && !tool)
      timer.current = setTimeout(() => {
        if (!hovered.current && !root.current?.contains(document.activeElement))
          setShown(false);
      }, 1600);
  };
  useEffect(() => {
    if (tool || pinned) setShown(true);
    schedule();
    return cancel;
  }, [tool, pinned]);
  useEffect(() => {
    if (!tool) return;
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target))
        onSelect(undefined);
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [tool, onSelect]);
  const button = (
    label: string,
    icon: React.ReactNode,
    click: () => void,
    selected = false,
    disabled = false,
    extra?: React.ReactNode,
  ) => (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={selected}
      disabled={disabled}
      onClick={click}
    >
      {icon}
      {extra}
    </button>
  );
  return (
    <div
      ref={root}
      className={styles.topToolbar}
      data-session-toolbar
      data-expanded={shown || pinned || !!tool}
      onPointerEnter={() => {
        hovered.current = true;
        cancel();
        setShown(true);
      }}
      onPointerLeave={() => {
        hovered.current = false;
        schedule();
      }}
      onFocusCapture={() => {
        cancel();
        setShown(true);
      }}
      onBlurCapture={schedule}
      onKeyDown={(e) => {
        if (e.nativeEvent.isComposing) return;
        if (e.key === 'Escape') {
          e.stopPropagation();
          onSelect(undefined);
          handle.current?.focus({ preventScroll: true });
          if (!pinned) setShown(false);
        }
        if (
          ['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key) &&
          (e.target as Element).parentElement?.getAttribute('role') ===
            'toolbar'
        ) {
          const items = Array.from(
            e.currentTarget.querySelectorAll<HTMLButtonElement>(
              '[role="toolbar"] > button:not(:disabled)',
            ),
          );
          const index = items.indexOf(e.target as HTMLButtonElement);
          items[
            e.key === 'Home'
              ? 0
              : e.key === 'End'
              ? items.length - 1
              : (index + (e.key === 'ArrowRight' ? 1 : items.length - 1)) %
                items.length
          ]?.focus();
          e.preventDefault();
        }
      }}
    >
      <button
        ref={handle}
        className={styles.toolbarHandle}
        type="button"
        aria-label={text('openTools', 'Show session menu')}
        aria-expanded={shown || pinned || !!tool}
        aria-controls="web-client-toolbar-buttons"
        onClick={() => {
          if (tool) onSelect(undefined);
          setShown(true);
        }}
      >
        <DownOutlined />
        {busy && <i className={styles.toolbarActivity} />}
      </button>
      <div className={styles.toolbarShell} hidden={!shown && !pinned && !tool}>
        <div
          id="web-client-toolbar-buttons"
          className={styles.toolbarButtons}
          role="toolbar"
          aria-label={text('sessionMenu', 'Session menu')}
        >
          {button(
            text(
              pinned ? 'unpinMenu' : 'pinMenu',
              pinned ? 'Unpin menu' : 'Pin menu',
            ),
            pinned ? <PushpinFilled /> : <PushpinOutlined />,
            () => setPinned(!pinned),
            pinned,
          )}
          <span className={styles.toolbarSeparator} />
          {button(
            text('displayOptions', 'Display'),
            <DesktopOutlined />,
            () => onSelect(tool === 'display' ? undefined : 'display'),
            tool === 'display',
            !connected,
          )}
          {button(
            text('toolInput', 'Keyboard'),
            <ControlOutlined />,
            () => onSelect(tool === 'input' ? undefined : 'input'),
            tool === 'input',
            !connected,
          )}
          {button(
            text('files', 'File transfer'),
            <FolderOpenOutlined />,
            onFiles,
            false,
            !connected,
            busy && <i className={styles.toolbarActivity} />,
          )}
          {button(
            text('toolAudio', 'Audio'),
            <SoundOutlined />,
            () => onSelect(tool === 'audio' ? undefined : 'audio'),
            tool === 'audio' || audio,
            !connected,
          )}
          <span className={styles.toolbarSeparator} />
          {button(
            text(
              fullscreen ? 'exitFullscreen' : 'fullscreen',
              fullscreen ? 'Exit fullscreen' : 'Fullscreen',
            ),
            fullscreen ? <CompressOutlined /> : <ExpandOutlined />,
            onFullscreen,
          )}
          <button
            type="button"
            className={styles.toolbarDisconnect}
            title={text('disconnect', 'Disconnect')}
            aria-label={text('disconnect', 'Disconnect')}
            onClick={onDisconnect}
          >
            <DisconnectOutlined />
          </button>
        </div>
        <div className={styles.toolbarPopover} hidden={!tool}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function FileDialog({
  open,
  target,
  onClose,
  text,
  children,
}: {
  open: boolean;
  target: string;
  onClose: () => void;
  text: Text;
  children: React.ReactNode;
}) {
  const dialog = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<
    { x: number; y: number; ox: number; oy: number } | undefined
  >(undefined);
  useEffect(() => {
    if (open)
      dialog.current
        ?.querySelector<HTMLButtonElement>('button')
        ?.focus({ preventScroll: true });
  }, [open]);
  useEffect(() => {
    const reset = () => setOffset({ x: 0, y: 0 });
    window.addEventListener('resize', reset);
    return () => window.removeEventListener('resize', reset);
  }, []);
  return (
    <div
      ref={dialog}
      className={styles.fileDialog}
      role="dialog"
      aria-modal="false"
      aria-labelledby="web-client-file-title"
      data-file-dialog
      hidden={!open}
      style={
        {
          '--file-x': offset.x + 'px',
          '--file-y': offset.y + 'px',
        } as React.CSSProperties
      }
      onKeyDown={(e) => {
        if (e.key === 'Escape' && !e.nativeEvent.isComposing) {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <header
        className={styles.fileDialogHeader}
        onPointerDown={(e) => {
          if (e.button !== 0 || (e.target as Element).closest('button')) return;
          drag.current = {
            x: e.clientX,
            y: e.clientY,
            ox: offset.x,
            oy: offset.y,
          };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          const rect = dialog.current?.getBoundingClientRect();
          if (!d || !rect) return;
          const mx = Math.max(0, (innerWidth - rect.width) / 2 - 8),
            my = Math.max(0, (innerHeight - rect.height) / 2 - 8);
          setOffset({
            x: Math.max(-mx, Math.min(mx, d.ox + e.clientX - d.x)),
            y: Math.max(-my, Math.min(my, d.oy + e.clientY - d.y)),
          });
        }}
        onPointerUp={() => {
          drag.current = undefined;
        }}
        onPointerCancel={() => {
          drag.current = undefined;
        }}
      >
        <span id="web-client-file-title">
          <FolderOpenOutlined /> {text('remoteFiles', 'Remote files')}{' '}
          <small>{target}</small>
        </span>
        <button
          type="button"
          aria-label={text('hideFiles', 'Minimize file window')}
          title={text('hideFiles', 'Minimize file window')}
          onClick={onClose}
        >
          <MinusOutlined />
        </button>
      </header>
      <div className={styles.fileDialogBody}>{children}</div>
    </div>
  );
}
