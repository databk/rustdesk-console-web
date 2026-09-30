import { Alert, Button, Card, Input, Space } from 'antd';
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
export interface FilePanelHandle {
  handle(event: FileWorkerEvent): void;
  dispose(): void;
}
export const FilePanel = forwardRef<
  FilePanelHandle,
  {
    enabled: boolean;
    post: (command: SessionCommand) => void;
    text: (key: string, fallback: string) => string;
  }
>(function FilePanel({ enabled, post, text }, ref) {
  const [state, setState] = useState<SessionState>('idle');
  const [password, setPassword] = useState('');
  const [security, setSecurity] = useState<KxVersion>();
  const [error, setError] = useState('');
  const [path, setPath] = useState('');
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
        setError(event.code);
        abortSink();
      } else if (event.type === 'files-event') {
        const data = event.event;
        if (data.type === 'directory') {
          setPath(data.path);
          setEntries(data.entries);
        } else if (data.type === 'error') {
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
  return (
    <Card size="small" title={text('files', 'File transfer')}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <span>
          {text(
            'fileAuthNotice',
            'File transfer requires its own remote authentication. Files are processed one at a time; downloads without a file picker are limited to 16 MiB.',
          )}
        </span>
        <Space wrap>
          <Button
            disabled={!enabled || !['idle', 'closed', 'failed'].includes(state)}
            onClick={() => {
              dispose();
              setError('');
              ++generation.current;
              setState('connecting');
              post({
                type: 'files-connect',
                fileGeneration: generation.current,
              });
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
          <span>{text(`state.${state}`, state)}</span>
        </Space>
        {security === 0 && (
          <Alert
            type="warning"
            message={text(
              'legacyEncryption',
              'The remote device uses a legacy encryption protocol with known security risks. Upgrade the remote client when possible.',
            )}
          />
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
          <Space wrap>
            <Input.Password
              autoComplete="off"
              aria-label={text('filePassword', 'File session password')}
              value={password}
              maxLength={4096}
              onChange={(event) => setPassword(event.target.value)}
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
          </Space>
        )}
        {connected && (
          <>
            <Space wrap>
              <Input
                aria-label={text('filePath', 'Remote directory')}
                value={path}
                onChange={(event) => setPath(event.target.value)}
                disabled={busy}
                maxLength={2048}
              />
              <Button
                disabled={busy}
                onClick={() => command({ type: 'list', path })}
              >
                {text('fileBrowse', 'Open directory')}
              </Button>
              <Button
                disabled={busy}
                onClick={() =>
                  command({
                    type: 'list',
                    path:
                      path === '/' || (path.length === 3 && path.endsWith(':/'))
                        ? '/'
                        : `${path.split('/').slice(0, -1).join('/')}/`,
                  })
                }
              >
                {text('fileUp', 'Parent directory')}
              </Button>
            </Space>
            <label>
              {text('fileUpload', 'Upload files')}
              <input
                aria-label={text('fileUpload', 'Upload files')}
                type="file"
                multiple
                disabled={busy || !path || path === '/'}
                onChange={(event) => {
                  const files = Array.from(event.target.files || []);
                  event.target.value = '';
                  if (files.length) command({ type: 'upload', path, files });
                }}
              />
            </label>
            <div style={{ maxHeight: 240, overflow: 'auto' }}>
              <ul>
                {entries.map((entry) => (
                  <li key={entry.path}>
                    <Button
                      disabled={busy}
                      onClick={() =>
                        entry.directory
                          ? command({ type: 'list', path: entry.path })
                          : void download(entry)
                      }
                    >
                      {entry.directory ? '📁 ' : '↓ '}
                      {entry.name}
                    </Button>
                    {!entry.directory && <span> {entry.size} B</span>}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
        {progress && (
          <div role="status">
            {progress.name}:{' '}
            {text(`filePhase.${progress.phase}`, progress.phase)} (
            {progress.transferred} / {progress.total} B)
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
      </Space>
    </Card>
  );
});
