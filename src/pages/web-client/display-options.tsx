import { Button } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import type {
  DisplayOptions,
  Resolution,
} from '@/features/web-client/core/display';
import styles from './index.less';

type Text = (key: string, fallback: string) => string;
export function FrameRate({
  value,
  onCommit,
  text,
}: {
  value: number;
  onCommit: (value: number) => void;
  text: Text;
}) {
  const [draft, setDraft] = useState(String(value));
  const current = useRef(String(value));
  const committed = useRef(value);
  useEffect(() => {
    current.current = String(value);
    committed.current = value;
    setDraft(String(value));
  }, [value]);
  const change = (next: string) => {
    current.current = next;
    setDraft(next);
  };
  const commit = () => {
    const next = Number(current.current);
    if (!Number.isInteger(next) || next < 5 || next > 120) {
      change(String(committed.current));
      return;
    }
    if (next !== committed.current) {
      committed.current = next;
      onCommit(next);
    }
  };
  const valid =
    Number.isInteger(Number(draft)) &&
    Number(draft) >= 5 &&
    Number(draft) <= 120;
  return (
    <div className={styles.frameRate}>
      <label className={styles.menuRow}>
        <span>{text('frameRate', 'Frame rate limit')}</span>
        <span className={styles.frameRateValue}>
          <input
            type="number"
            min={5}
            max={120}
            step={1}
            value={draft}
            aria-label={text('frameRateValue', 'Frame rate value')}
            onChange={(event) => change(event.target.value)}
            onBlur={commit}
            onKeyUp={(event) => {
              if (event.key === 'Enter' || event.key.startsWith('Arrow'))
                commit();
            }}
          />{' '}
          FPS
        </span>
      </label>
      <input
        type="range"
        min={5}
        max={120}
        step={1}
        value={valid ? Number(draft) : committed.current}
        aria-label={text('frameRate', 'Frame rate limit')}
        onChange={(event) => change(event.target.value)}
        onPointerUp={commit}
        onKeyUp={commit}
        onBlur={commit}
      />
      <div className={styles.rangeTicks} aria-hidden="true">
        <span>5</span>
        <span>30</span>
        <span>60</span>
        <span>120</span>
      </div>
    </div>
  );
}
export function CustomQuality({
  value,
  onCommit,
  text,
}: {
  value: number;
  onCommit: (value: number) => void;
  text: Text;
}) {
  const [draft, setDraft] = useState(value);
  const committed = useRef(value);
  useEffect(() => {
    setDraft(value);
    committed.current = value;
  }, [value]);
  const commit = () => {
    if (draft !== committed.current) {
      committed.current = draft;
      onCommit(draft);
    }
  };
  return (
    <label className={styles.customQuality}>
      <span>
        {text('customBitrate', 'Bitrate ratio')} <output>{draft}%</output>
      </span>
      <input
        type="range"
        min={10}
        max={100}
        step={1}
        value={draft}
        aria-label={text('customBitrate', 'Bitrate ratio')}
        onChange={(event) => setDraft(Number(event.target.value))}
        onPointerUp={commit}
        onKeyUp={commit}
        onBlur={commit}
      />
    </label>
  );
}
export function ResolutionOptions({
  options,
  current,
  disabled,
  status,
  onChange,
  text,
}: {
  options?: DisplayOptions;
  current?: Resolution;
  disabled: boolean;
  status: string;
  onChange: (value: Resolution) => void;
  text: Text;
}) {
  const values = options?.resolutions || [];
  const currentKey = current ? `${current.width}x${current.height}` : '';
  const original = options?.originalResolution;
  const canRestore =
    original &&
    values.some(
      (value) =>
        value.width === original.width && value.height === original.height,
    ) &&
    (original.width !== current?.width || original.height !== current?.height);
  return (
    <div className={styles.resolutionOptions}>
      <label className={styles.menuRow}>
        {text('remoteResolution', 'Remote resolution')}
        <select
          className={styles.select}
          aria-label={text('remoteResolution', 'Remote resolution')}
          value={currentKey}
          disabled={disabled}
          onChange={(event) => {
            const selected = values.find(
              (value) =>
                `${value.width}x${value.height}` === event.target.value,
            );
            if (selected) onChange(selected);
          }}
        >
          {!values.some(
            (value) => `${value.width}x${value.height}` === currentKey,
          ) && (
            <option value={currentKey}>
              {current ? `${current.width} × ${current.height}` : '—'}
            </option>
          )}
          {values.map((value) => (
            <option
              key={`${value.width}x${value.height}`}
              value={`${value.width}x${value.height}`}
            >
              {value.width} × {value.height}
            </option>
          ))}
        </select>
      </label>
      {original && (
        <div className={styles.originalResolution}>
          <span>
            {text('originalResolution', 'Original resolution')}:{' '}
            {original.width} × {original.height}
          </span>
          {canRestore && (
            <Button disabled={disabled} onClick={() => onChange(original)}>
              {text('resolutionRestoreShort', 'Restore')}
            </Button>
          )}
        </div>
      )}
      {status && (
        <p className={styles.panelHint} role="status">
          {status}
        </p>
      )}
    </div>
  );
}
