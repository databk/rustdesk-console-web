import { Button, Card, Space } from 'antd';
import { PictureOutlined, UploadOutlined } from '@ant-design/icons';
import styles from './index.less';
import React, { useEffect, useRef, useState } from 'react';
import { IMAGE_LIMITS } from '@/features/web-client/clipboard/image';
import type { SessionCommand } from '@/features/web-client/worker/contract';

export function ImageClipboard({
  enabled,
  remote,
  post,
  text,
  fail,
}: {
  enabled: boolean;
  remote?: Uint8Array;
  post: (command: SessionCommand) => void;
  text: (key: string, fallback: string) => string;
  fail: () => void;
}) {
  const epoch = useRef(0);
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    ++epoch.current;
    return () => {
      ++epoch.current;
    };
  }, [enabled]);
  useEffect(() => {
    if (!remote) {
      setUrl(undefined);
      return;
    }
    const value = URL.createObjectURL(
      new Blob([new Uint8Array(remote)], { type: 'image/png' }),
    );
    setUrl(value);
    return () => URL.revokeObjectURL(value);
  }, [remote]);
  const send = async (blob: Blob, current = epoch.current) => {
    if (
      !enabled ||
      blob.type !== 'image/png' ||
      blob.size > IMAGE_LIMITS.encoded
    )
      throw new Error();
    const bytes = new Uint8Array(await blob.arrayBuffer());
    if (current === epoch.current) post({ type: 'image', bytes });
  };
  const read = async () => {
    const current = epoch.current;
    try {
      const items = await navigator.clipboard.read();
      const item = items.find((value) => value.types.includes('image/png'));
      if (!item) throw new Error();
      await send(await item.getType('image/png'), current);
    } catch {
      if (current === epoch.current) fail();
    }
  };
  const copy = async () => {
    if (!remote || !enabled) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': new Blob([new Uint8Array(remote)], {
            type: 'image/png',
          }),
        }),
      ]);
    } catch {
      fail();
    }
  };
  return (
    <Card
      className={styles.featureCard}
      size="small"
      title={text('images', 'Image clipboard')}
    >
      <div className={styles.imagePreview}>
        {url && enabled ? (
          <img src={url} alt={text('imagePreview', 'Remote image preview')} />
        ) : (
          <>
            <PictureOutlined />
            <span>{text('imageEmpty', 'Remote images will appear here')}</span>
          </>
        )}
      </div>
      <Space wrap>
        <Button disabled={!enabled} onClick={() => void read()}>
          {text('imageRead', 'Send clipboard PNG')}
        </Button>
        <label className={styles.uploadField}>
          <UploadOutlined /> {text('imageFile', 'Choose PNG')}
          <input
            aria-label={text('imageFile', 'Choose PNG')}
            type="file"
            accept="image/png"
            disabled={!enabled}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) void send(file).catch(fail);
            }}
          />
        </label>
        <Button disabled={!enabled || !remote} onClick={() => void copy()}>
          {text('imageCopy', 'Copy remote PNG')}
        </Button>
        {url && enabled && (
          <a href={url} download="remote-clipboard.png">
            {text('imageDownload', 'Download remote PNG')}
          </a>
        )}
        <span className={styles.panelHint}>
          {text(
            'imageLimit',
            'PNG only; 4 MiB encoded, 4 million pixels. Use file selection or download if clipboard access is denied.',
          )}
        </span>
      </Space>
    </Card>
  );
}
