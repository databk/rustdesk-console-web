import { Alert, Button, Input, Space } from 'antd';
import {
  FolderOutlined,
  FileOutlined,
  DownloadOutlined,
  UploadOutlined,
  FolderOpenOutlined,
  ArrowUpOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import styles from './index.less';
import { LegacyEncryptionNotice } from './legacy-notice';
import { safePath } from '@/features/web-client/files/transfer';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import type { KxVersion } from '@/features/web-client/core/crypto';
import type { SessionState } from '@/features/web-client/core/session';
import {
  chooseDownload,
  type DownloadSink,
} from '@/features/web-client/files/download';
import type {
  FileCommand,
  FileProgress,
  RemoteEntry,
} from '@/features/web-client/files/transfer';
import type {
  SessionCommand,
  WorkerEvent,
} from '@/features/web-client/worker/contract';

type FileWorkerEvent = Extract<WorkerEvent, { fileGeneration: number }>;
export interface FilePanelStatus {
  state: SessionState;
  legacy: boolean;
  error: string;
  busy: boolean;
}
export interface FilePanelHandle {
  handle(event: FileWorkerEvent): void;
  dispose(): void;
}
export const FilePanel = forwardRef<
  FilePanelHandle,
  {
    enabled: boolean;
    onStatusChange?: (status: FilePanelStatus) => void;
    post: (command: SessionCommand) => void;
    text: (key: string, fallback: string) => string;
  }
>(function FilePanel({ enabled, post, text, onStatusChange }, ref) {
  const [state, setState] = useState<SessionState>('idle');
  const [password, setPassword] = useState('');
  const [security, setSecurity] = useState<KxVersion>();
  const [error, setError] = useState('');
  const [path, setPath] = useState('');
  const [draftPath, setDraftPath] = useState('');
  const [browsing, setBrowsing] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string>();
  const [entries, setEntries] = useState<RemoteEntry[]>([]);
  const [progress, setProgress] = useState<FileProgress>();
  const [choosing, setChoosing] = useState(false);
  const activeJob = useRef<number | undefined>(undefined);
  const generation = useRef(0);
  const operation = useRef(0);
  const sink = useRef<DownloadSink | undefined>(undefined);
  const connected = state === 'connected';
  const busy =
    choosing ||
    (!!progress &&
      !['done', 'skipped', 'cancelled', 'error'].includes(progress.phase));
  useEffect(() => {
    onStatusChange?.({
      state,
      legacy: security === 0 && !['idle', 'closed', 'failed'].includes(state),
      error,
      busy,
    });
  }, [state, security, error, busy, onStatusChange]);
  const command = (value: FileCommand) =>
    post({
      type: 'files-command',
      command: value,
      fileGeneration: generation.current,
    });
  const abortSink = () => {
    activeJob.current = undefined;
    ++operation.current;
    const current = sink.current;
    sink.current = undefined;
    if (current) void current.abort().catch(() => {});
    setChoosing(false);
  };
  const dispose = () => {
    abortSink();
    setState('closed');
    setPassword('');
    setSecurity(undefined);
    setEntries([]);
    setProgress(undefined);
    setPath('');
    setDraftPath('');
    setSelectedPath(undefined);
    setBrowsing(false);
  };
  useImperativeHandle(ref, () => ({
    dispose,
    handle(event) {
      if (event.fileGeneration !== generation.current) return;
      if (event.type === 'files-state') {
        setState(event.state);
        if (event.state === 'closed' || event.state === 'failed') dispose();
        if (event.state === 'connected') setPassword('');
      } else if (event.type === 'files-security') setSecurity(event.kxVersion);
      else if (event.type === 'files-error') {
        setBrowsing(false);
        setError(event.code);
        abortSink();
      } else if (event.type === 'files-event') {
        const data = event.event;
        if (data.type === 'directory') {
          setPath(data.path);
          setDraftPath(data.path);
          setSelectedPath(undefined);
          setBrowsing(false);
          setError('');
          setEntries(data.entries);
        } else if (data.type === 'error') {
          setBrowsing(false);
          setError('files');
          abortSink();
        } else if (data.type === 'progress') {
          if (data.progress.phase === 'waiting')
            activeJob.current = data.progress.id;
          setProgress(data.progress);
          if (['cancelled', 'error', 'skipped'].includes(data.progress.phase))
            abortSink();
        } else {
          if (data.id !== activeJob.current) return;
          const current = sink.current;
          const epoch = operation.current;
          const fileGeneration = generation.current;
          void (async () => {
            let ok = false;
            try {
              if (!current) throw new Error();
              if (data.type === 'chunk') await current.write(data.bytes);
              else await current.close();
              ok = true;
            } catch {
              // 失败也先核对任务归属，旧写流不能取消后续下载。
            }
            if (
              fileGeneration === generation.current &&
              epoch === operation.current &&
              data.id === activeJob.current
            ) {
              post({
                type: 'files-command',
                fileGeneration,
                command: {
                  type: 'consumed',
                  id: data.id,
                  sequence: data.sequence,
                  ok,
                },
              });
              if (!ok) {
                setError('files');
                abortSink();
              } else if (data.type === 'download-done') {
                sink.current = undefined;
                activeJob.current = undefined;
              }
            }
          })();
        }
      }
    },
  }));
  useEffect(() => {
    if (!enabled) {
      if (generation.current)
        post({ type: 'files-disconnect', fileGeneration: generation.current });
      dispose();
    }
    return () => {
      const current = sink.current;
      sink.current = undefined;
      ++operation.current;
      if (current) void current.abort().catch(() => {});
    };
  }, [enabled]);
  const download = async (entry: RemoteEntry) => {
    if (!connected || busy) return;
    const epoch = ++operation.current;
    const currentGeneration = generation.current;
    setChoosing(true);
    try {
      const next = await chooseDownload(entry.name, entry.size);
      if (
        epoch !== operation.current ||
        currentGeneration !== generation.current
      ) {
        await next.abort();
        return;
      }
      sink.current = next;
      setChoosing(false);
      command({
        type: 'download',
        path: entry.path,
        name: entry.name,
        size: entry.size,
      });
    } catch {
      if (epoch === operation.current) {
        setChoosing(false);
        setError('files');
      }
    }
  };
  const selected = entries.find((entry) => entry.path === selectedPath);
  const canNavigate = connected && !busy && !browsing;
  const browse = (next: string) => {
    if (!canNavigate) return;
    try {
      const normalized = safePath(next);
      setError('');
      setBrowsing(true);
      command({ type: 'list', path: normalized });
    } catch {
      setError('filePath');
    }
  };
  const parent =
    path === '/' || !path || /^[A-Z]:\/$/.test(path)
      ? '/'
      : path.slice(0, path.lastIndexOf('/')) || '/';
  return (
    <div className={styles.filePicker}>
      <div className={styles.fileSessionBar}>
        <Button
          disabled={!enabled || !['idle', 'closed', 'failed'].includes(state)}
          onClick={() => {
            dispose();
            setError('');
            ++generation.current;
            setState('connecting');
            post({ type: 'files-connect', fileGeneration: generation.current });
          }}
        >
          {text('fileConnect', 'Connect files')}
        </Button>
        <Button
          disabled={['idle', 'closed', 'failed'].includes(state)}
          onClick={() => {
            post({
              type: 'files-disconnect',
              fileGeneration: generation.current,
            });
            ++generation.current;
            dispose();
          }}
        >
          {text('fileDisconnect', 'Disconnect files')}
        </Button>
        <span className={styles.fileState} role="status">
          {text(`state.${state}`, state)}
        </span>
        {security === 0 && !['idle', 'closed', 'failed'].includes(state) && (
          <LegacyEncryptionNotice text={text} context="files" />
        )}
      </div>
      {!connected && (
        <p className={styles.panelHint}>
          {text(
            'fileAuthNotice',
            'File transfer requires its own remote authentication. Files are processed one at a time; downloads without a file picker are limited to 16 MiB.',
          )}
        </p>
      )}
      {error && (
        <Alert
          type="error"
          message={text(
            `error.${error}`,
            'File operation failed or was denied. Retry the file session.',
          )}
        />
      )}
      {['authenticating', 'awaitingApproval'].includes(state) && (
        <div className={styles.fileAuth}>
          <Input.Password
            autoComplete="off"
            aria-label={text('filePassword', 'File session password')}
            value={password}
            maxLength={4096}
            onChange={(event) => setPassword(event.target.value)}
            onPressEnter={() => {
              post({
                type: 'files-password',
                password,
                fileGeneration: generation.current,
              });
              setPassword('');
            }}
          />
          <Button
            onClick={() => {
              post({
                type: 'files-password',
                password,
                fileGeneration: generation.current,
              });
              setPassword('');
            }}
          >
            {text('authenticate', 'Send password')}
          </Button>
        </div>
      )}
      {connected && (
        <>
          <div className={styles.fileNavigation}>
            <Button
              icon={<ArrowUpOutlined />}
              aria-label={text('fileUp', 'Parent directory')}
              title={text('fileUp', 'Parent directory')}
              disabled={!canNavigate}
              onClick={() => browse(parent)}
            />
            <Button
              icon={<ReloadOutlined />}
              aria-label={text('fileRefresh', 'Refresh directory')}
              title={text('fileRefresh', 'Refresh directory')}
              disabled={!canNavigate}
              onClick={() => browse(path)}
            />
            <Input
              aria-label={text('filePath', 'Remote directory')}
              value={draftPath}
              onChange={(event) => setDraftPath(event.target.value)}
              onPressEnter={() => browse(draftPath)}
              disabled={!canNavigate}
              maxLength={2048}
            />
            <Button disabled={!canNavigate} onClick={() => browse(draftPath)}>
              {text('fileBrowse', 'Open directory')}
            </Button>
          </div>
          <div className={styles.fileList} aria-busy={browsing}>
            <div className={styles.fileColumns} aria-hidden="true">
              <span>{text('fileName', 'Name')}</span>
              <span>{text('fileType', 'Type')}</span>
              <span>{text('fileSize', 'Size')}</span>
            </div>
            {entries.length === 0 && (
              <div className={styles.emptyFiles}>
                <FolderOpenOutlined />
                <span>{text('fileEmpty', 'This directory is empty')}</span>
              </div>
            )}
            <ul aria-label={text('fileEntries', 'Remote directory contents')}>
              {entries.map((entry) => (
                <li key={entry.path}>
                  <button
                    type="button"
                    className={styles.fileRow}
                    aria-label={entry.name}
                    aria-pressed={entry.path === selectedPath}
                    disabled={!canNavigate}
                    title={entry.name}
                    onClick={() => setSelectedPath(entry.path)}
                    onDoubleClick={() => {
                      if (entry.directory) browse(entry.path);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && entry.directory) {
                        event.preventDefault();
                        browse(entry.path);
                      }
                    }}
                  >
                    <span className={styles.fileName}>
                      {entry.directory ? <FolderOutlined /> : <FileOutlined />}{' '}
                      {entry.name}
                    </span>
                    <span className={styles.fileType}>
                      {text(
                        entry.directory ? 'fileFolder' : 'fileDocument',
                        entry.directory ? 'Folder' : 'File',
                      )}
                    </span>
                    <span className={styles.fileSize}>
                      {entry.directory
                        ? '—'
                        : entry.size < 1024
                        ? entry.size + ' B'
                        : entry.size < 1048576
                        ? (entry.size / 1024).toFixed(1) + ' KiB'
                        : (entry.size / 1048576).toFixed(1) + ' MiB'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.fileActions}>
            <span className={styles.fileSelection} title={selected?.name}>
              {selected?.name ||
                text('fileSelectHint', 'Select a file to download')}
            </span>
            <label className={styles.uploadField}>
              <UploadOutlined />{' '}
              {text('fileUploadHere', 'Upload to this folder')}
              <input
                aria-label={text('fileUploadHere', 'Upload to this folder')}
                type="file"
                multiple
                disabled={!canNavigate || !path || path === '/'}
                onChange={(event) => {
                  const files = Array.from(event.target.files || []);
                  event.target.value = '';
                  if (files.length && canNavigate && path && path !== '/')
                    command({ type: 'upload', path, files });
                }}
              />
            </label>
            <Button
              icon={<DownloadOutlined />}
              type="primary"
              disabled={!canNavigate || !selected || selected.directory}
              onClick={() => {
                if (selected && !selected.directory) void download(selected);
              }}
            >
              {text('fileDownloadSelected', 'Download selected file')}
            </Button>
          </div>
          <small className={styles.fileLimit}>
            {text(
              'fileLimit',
              'Files transfer one at a time. Without streaming save, downloads are limited to 16 MiB.',
            )}
          </small>
        </>
      )}
      {progress && (
        <div className={styles.transferProgress} role="status">
          {progress.name}: {text(`filePhase.${progress.phase}`, progress.phase)}{' '}
          ({progress.transferred} / {progress.total} B)
          <progress
            max={Math.max(1, progress.total)}
            value={progress.transferred}
          />
        </div>
      )}
      {progress?.phase === 'conflict' && (
        <Space wrap>
          <span>
            {text('fileConflict', 'A remote file with this name exists.')}
          </span>
          <Button
            onClick={() =>
              command({ type: 'conflict', id: progress.id, overwrite: false })
            }
          >
            {text('fileSkip', 'Keep remote file')}
          </Button>
          <Button
            danger
            onClick={() =>
              command({ type: 'conflict', id: progress.id, overwrite: true })
            }
          >
            {text('fileOverwrite', 'Overwrite remote file')}
          </Button>
        </Space>
      )}
      {busy && (
        <Button
          onClick={() => {
            abortSink();
            command({ type: 'cancel' });
          }}
        >
          {text('fileCancel', 'Cancel transfer')}
        </Button>
      )}
    </div>
  );
});
