import {
  CompressOutlined,
  DesktopOutlined,
  DisconnectOutlined,
  DownOutlined,
  ExpandOutlined,
  FolderOpenOutlined,
  LineChartOutlined,
  PlayCircleOutlined,
  MessageOutlined,
  MinusOutlined,
  PhoneOutlined,
  PushpinFilled,
  PushpinOutlined,
  SoundOutlined,
  StopOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import React, { useEffect, useRef, useState } from 'react';
import styles from './index.less';
import type { FilePanelStatus } from './files';
import { LegacyEncryptionNotice } from './legacy-notice';
import windowStyles from './session-tools.less';
import { useToolWindow } from './use-tool-window';
export type ToolName = 'session' | 'display' | 'input' | 'audio';

function KeyboardIcon() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M6 9h1m3 0h1m3 0h1m3 0h1M6 12h1m3 0h1m3 0h1m3 0h1M7 16h10" />
    </svg>
  );
}
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
  fileAllowed,
  text,
  children,
  onChat,
  onCall,
  onRecord,
  unread = 0,
  callActive = false,
  recording = false,
  recordingAllowed = true,
  recordPreparing = false,
  readOnly = false,
  fileOpen = false,
  chatOpen = false,
  callOpen = false,
  qualityOpen = false,
  onQuality,
  recordPhase = 'idle',
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
  fileAllowed: boolean;
  text: Text;
  children: React.ReactNode;
  onChat?: () => void;
  onCall?: () => void;
  onRecord?: () => void;
  unread?: number;
  callActive?: boolean;
  recording?: boolean;
  recordingAllowed?: boolean;
  recordPreparing?: boolean;
  readOnly?: boolean;
  fileOpen?: boolean;
  chatOpen?: boolean;
  callOpen?: boolean;
  qualityOpen?: boolean;
  onQuality: () => void;
  recordPhase?: string;
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
      data-tool-open={!!tool}
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
          <button
            type="button"
            className={styles.toolbarMode}
            title={text('sessionOptions', 'Session')}
            aria-label={text('sessionOptions', 'Session')}
            aria-pressed={tool === 'session'}
            disabled={!connected}
            onClick={() => onSelect(tool === 'session' ? undefined : 'session')}
          >
            {text(
              readOnly ? 'viewOnlyMode' : 'controlMode',
              readOnly ? 'View only' : 'Control',
            )}
          </button>
          {button(
            text('displayOptions', 'Display'),
            <DesktopOutlined />,
            () => onSelect(tool === 'display' ? undefined : 'display'),
            tool === 'display',
            !connected,
          )}
          {button(
            text('toolInput', 'Keyboard and mouse'),
            <KeyboardIcon />,
            () => onSelect(tool === 'input' ? undefined : 'input'),
            tool === 'input',
            !connected,
          )}
          {button(
            text('files', 'File transfer'),
            <FolderOpenOutlined />,
            onFiles,
            fileOpen,
            !connected || !fileAllowed,
            busy && <i className={styles.toolbarActivity} />,
          )}
          {button(
            text('toolAudio', 'Audio'),
            <SoundOutlined />,
            () => onSelect(tool === 'audio' ? undefined : 'audio'),
            tool === 'audio',
            !connected,
            audio && (
              <i
                className={styles.toolbarActive}
                title={text('activeAudio', 'Audio playing')}
              />
            ),
          )}
          {button(
            text('qualityMonitor', 'Quality monitor'),
            <LineChartOutlined />,
            () => {
              onSelect(undefined);
              onQuality();
            },
            qualityOpen,
            !connected,
          )}
          {onChat &&
            button(
              text('chat', 'Chat'),
              <MessageOutlined />,
              () => {
                onSelect(undefined);
                onChat();
              },
              chatOpen,
              !connected,
              unread > 0 && <b className={styles.toolbarUnread}>{unread}</b>,
            )}
          {onCall &&
            button(
              text('voiceCall', 'Voice call'),
              <PhoneOutlined />,
              () => {
                onSelect(undefined);
                onCall();
              },
              callOpen,
              !connected,
              callActive && (
                <i
                  className={styles.toolbarActive}
                  title={text('callActive', 'Call active')}
                />
              ),
            )}
          {onRecord &&
            button(
              text(
                recording ? 'recordStop' : 'recordStart',
                recording ? 'Stop recording' : 'Record screen',
              ),
              recording ? <StopOutlined /> : <VideoCameraOutlined />,
              () => {
                onSelect(undefined);
                onRecord();
              },
              false,
              !connected || !recordingAllowed || recordPreparing,
              recordPhase !== 'idle' && (
                <i
                  className={styles.toolbarActive}
                  data-recording={recording}
                  title={
                    recordPhase === 'recording'
                      ? text('recording', 'Recording')
                      : recordPhase === 'choosing'
                        ? text(
                            'recordChoosing',
                            'Choose a recording save location…',
                          )
                        : recordPhase === 'stopping'
                          ? text('recordStopping', 'Stopping recording…')
                          : text('recordSaving', 'Saving recording…')
                  }
                />
              ),
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
  status,
  onConnect,
  onDisconnectFile,
}: {
  open: boolean;
  target: string;
  onClose: (ownedFocus: boolean) => void;
  text: Text;
  children: React.ReactNode;
  status?: FilePanelStatus;
  onConnect?: () => void;
  onDisconnectFile?: () => void;
}) {
  const window = useToolWindow(
    open,
    { width: 1000, height: 610 },
    { width: 580, height: 460 },
    true,
    'center',
  );
  useEffect(() => {
    if (open)
      window.panel.current
        ?.querySelector<HTMLButtonElement>('[data-file-close]')
        ?.focus({ preventScroll: true });
  }, [open]);
  const close = () =>
    onClose(!!window.panel.current?.contains(document.activeElement));
  const active =
    !!status && !['idle', 'failed', 'closed'].includes(status.state);
  return (
    <section
      ref={window.panel}
      className={`${styles.fileDialog} ${windowStyles.toolDialog}`}
      style={window.style}
      {...window.events}
      role="dialog"
      aria-modal="false"
      aria-labelledby="web-client-file-title"
      data-file-dialog
      hidden={!open}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === 'Escape' && !event.nativeEvent.isComposing) close();
      }}
    >
      <header className={styles.fileDialogHeader}>
        <button
          type="button"
          className={windowStyles.toolDrag}
          aria-label={text('fileMove', 'Move file window')}
          {...window.control()}
        >
          <FolderOpenOutlined />
          <strong id="web-client-file-title">
            {text('files', 'File transfer')}
          </strong>
          <small title={target}>{target}</small>
        </button>
        {status && (
          <span
            className={styles.fileState}
            role="status"
            title={text('state.' + status.state, status.state)}
          >
            {text('state.' + status.state, status.state)}
          </span>
        )}
        {status?.legacy && (
          <LegacyEncryptionNotice text={text} context="files" />
        )}
        {onConnect && onDisconnectFile && (
          <button
            type="button"
            title={text(
              active ? 'fileDisconnect' : 'fileConnect',
              active ? 'Disconnect files' : 'Connect files',
            )}
            aria-label={text(
              active ? 'fileDisconnect' : 'fileConnect',
              active ? 'Disconnect files' : 'Connect files',
            )}
            onClick={active ? onDisconnectFile : onConnect}
          >
            {active ? <DisconnectOutlined /> : <PlayCircleOutlined />}
          </button>
        )}
        <button
          type="button"
          data-file-close
          aria-label={text('hideFiles', 'Minimize file window')}
          title={text('hideFiles', 'Minimize file window')}
          onClick={close}
        >
          <MinusOutlined />
        </button>
      </header>
      <div className={styles.fileDialogBody}>{children}</div>
      {(['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] as const).map((edge) => (
        <button
          key={edge}
          type="button"
          className={windowStyles.toolResize}
          data-tool-resize={edge}
          aria-label={text('fileResize', 'Resize file window')}
          tabIndex={edge === 'se' ? 0 : -1}
          {...window.control(edge)}
        />
      ))}
    </section>
  );
}
