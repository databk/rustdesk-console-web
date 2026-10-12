import { CloseOutlined, SettingOutlined } from '@ant-design/icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { RemoteDisplay } from '@/features/web-client/input/input';
import type { QualityReading } from '@/features/web-client/media/quality-metrics';
import { getWebClientSessionNetwork } from '@/services/rustdesk-console/webClient';
import type { WebClientSessionNetwork } from '@/services/rustdesk-console/webClient';
import { TcpLabel, TcpValue } from '@/components/TcpCongestionInfo';
import { unavailableTcp } from '@/services/rustdesk-console/tcpObservation';
import styles from './index.less';
import {
  fitQualityBox,
  type QualityBox,
  type QualityEdge,
  resizeQualityBox,
} from './quality-geometry';
import { nextToolLayer } from './use-tool-window';

export function QualityMonitor({
  reading,
  display,
  ready,
  sessionGuid,
  onClose,
  text,
  format,
}: {
  reading: QualityReading;
  display?: RemoteDisplay;
  ready: boolean;
  sessionGuid?: string;
  onClose: () => void;
  text: (key: string, fallback: string) => string;
  format?: { codec: string; chroma?: string };
}) {
  const panel = useRef<HTMLElement | null>(null);
  const [box, setBox] = useState<QualityBox>();
  const currentBox = useRef<QualityBox | undefined>(undefined);
  const gesture = useRef<
    | {
        id: number;
        x: number;
        y: number;
        box: QualityBox;
        edge?: QualityEdge;
        target: HTMLButtonElement;
      }
    | undefined
  >(undefined);
  const [settings, setSettings] = useState(false);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [serverNetwork, setServerNetwork] = useState<WebClientSessionNetwork>();
  const [opacity, setOpacity] = useState(80);
  const [layer, setLayer] = useState(nextToolLayer);
  useEffect(() => {
    setServerNetwork(undefined);
    if (!diagnosticsOpen || !ready || !sessionGuid) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      try {
        const value = await getWebClientSessionNetwork(sessionGuid, {
          signal: controller.signal,
        });
        if (!controller.signal.aborted) setServerNetwork(value);
      } catch {
        if (!controller.signal.aborted)
          setServerNetwork({
            api_version: 1,
            session_guid: sessionGuid,
            entry: unavailableTcp('connection', 'source_unavailable'),
            relay: unavailableTcp('connection', 'source_unavailable'),
          });
      } finally {
        // Schedule after completion: slow queries never overlap or accumulate.
        if (!controller.signal.aborted)
          timer = setTimeout(() => {
            void load();
          }, 30000);
      }
    };
    void load();
    return () => {
      controller.abort();
      if (timer) clearTimeout(timer);
    };
  }, [diagnosticsOpen, ready, sessionGuid]);
  const bounds = () => {
    const rect = panel.current?.parentElement?.getBoundingClientRect();
    return rect && rect.width > 0 && rect.height > 0
      ? { width: rect.width, height: rect.height }
      : undefined;
  };
  const update = (next: QualityBox) => {
    currentBox.current = next;
    setBox(next);
  };
  const finish = useCallback(() => {
    const active = gesture.current;
    gesture.current = undefined;
    if (active?.target.hasPointerCapture?.(active.id))
      active.target.releasePointerCapture(active.id);
  }, []);
  useEffect(() => {
    const clampPanel = () => {
      // 工作区变化结束旧拖动，避免继续使用改变前的坐标系。
      finish();
      const rect = panel.current?.parentElement?.getBoundingClientRect();
      if (!rect || rect.width <= 0 || rect.height <= 0) return;
      const initial = currentBox.current ?? {
        x: rect.width - 336,
        y: rect.height - 316,
        width: 320,
        height: 300,
      };
      const next = fitQualityBox(initial, rect);
      currentBox.current = next;
      setBox(next);
    };
    const visibility = () => {
      if (document.hidden) finish();
    };
    clampPanel();
    window.addEventListener('resize', clampPanel);
    window.addEventListener('blur', finish);
    document.addEventListener('visibilitychange', visibility);
    document.addEventListener('fullscreenchange', clampPanel);
    const observer =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(clampPanel);
    if (panel.current?.parentElement)
      observer?.observe(panel.current.parentElement);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', clampPanel);
      window.removeEventListener('blur', finish);
      document.removeEventListener('visibilitychange', visibility);
      document.removeEventListener('fullscreenchange', clampPanel);
      finish();
    };
  }, [finish]);
  const begin = (
    event: React.PointerEvent<HTMLButtonElement>,
    edge?: QualityEdge,
  ) => {
    if (event.button !== 0 || !currentBox.current) return;
    event.preventDefault();
    event.stopPropagation();
    finish();
    setLayer(nextToolLayer());
    event.currentTarget.focus({ preventScroll: true });
    gesture.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      box: currentBox.current,
      edge,
      target: event.currentTarget,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const end = (event: React.PointerEvent) => {
    if (gesture.current?.id === event.pointerId) finish();
  };
  const move = (event: React.PointerEvent) => {
    const active = gesture.current;
    const area = bounds();
    if (!active || active.id !== event.pointerId || !area) return;
    event.preventDefault();
    event.stopPropagation();
    const dx = event.clientX - active.x;
    const dy = event.clientY - active.y;
    update(
      active.edge
        ? resizeQualityBox(active.box, active.edge, dx, dy, area)
        : fitQualityBox(
            { ...active.box, x: active.box.x + dx, y: active.box.y + dy },
            area,
          ),
    );
  };
  const keyboard = (event: React.KeyboardEvent, edge?: QualityEdge) => {
    const area = bounds();
    const current = currentBox.current;
    if (
      !area ||
      !current ||
      !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)
    )
      return;
    event.preventDefault();
    event.stopPropagation();
    const step = event.shiftKey ? 1 : 10;
    const dx =
      event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0;
    const dy =
      event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0;
    update(
      edge
        ? resizeQualityBox(current, edge, dx, dy, area)
        : fitQualityBox(
            { ...current, x: current.x + dx, y: current.y + dy },
            area,
          ),
    );
  };
  const rate = reading.videoBitrate;
  const bitrate =
    rate === undefined
      ? '—'
      : rate >= 1_000_000
        ? `${(rate / 1_000_000).toFixed(2)} Mbps`
        : `${(rate / 1000).toFixed(1)} Kbps`;
  return (
    <aside
      ref={panel}
      className={styles.qualityMonitor}
      data-quality-monitor
      aria-label={text('qualityMonitor', 'Quality monitor')}
      style={{
        zIndex: layer,
        ...(box
          ? {
              left: box.x,
              top: box.y,
              width: box.width,
              height: box.height,
              right: 'auto',
              bottom: 'auto',
            }
          : {}),
        backgroundColor: `rgba(24, 36, 51, ${opacity / 100})`,
      }}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={end}
      onPointerDown={(event) => {
        event.stopPropagation();
        setLayer(nextToolLayer());
      }}
      onFocus={() => setLayer(nextToolLayer())}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <div className={styles.qualityHeader}>
        <button
          type="button"
          className={styles.qualityDrag}
          aria-label={text('qualityMove', 'Move quality monitor')}
          onPointerDown={(event) => begin(event)}
          onKeyDown={(event) => keyboard(event)}
        >
          <strong>{text('qualityMonitor', 'Quality monitor')}</strong>
        </button>
        <button
          type="button"
          aria-label={text('qualitySettings', 'Monitor settings')}
          aria-expanded={settings}
          onClick={() => setSettings(!settings)}
        >
          <SettingOutlined />
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label={text('qualityClose', 'Close quality monitor')}
        >
          <CloseOutlined />
        </button>
      </div>
      <div className={styles.qualityContent}>
        {settings && (
          <label className={styles.qualityOpacity}>
            <span>{text('qualityOpacity', 'Background opacity')}</span>
            <output>{opacity}%</output>
            <input
              type="range"
              min={35}
              max={100}
              step={1}
              value={opacity}
              aria-label={text('qualityOpacity', 'Background opacity')}
              onChange={(event) => setOpacity(Number(event.target.value))}
            />
          </label>
        )}
        <dl>
          <dt>{text('qualityFps', 'Frame rate')}</dt>
          <dd>
            {reading.fps === undefined ? '—' : `${reading.fps.toFixed(1)} FPS`}
          </dd>
          <dt>{text('qualityBitrate', 'Video bitrate')}</dt>
          <dd>{bitrate}</dd>
          <dt>{text('qualityDelay', 'Network round trip')}</dt>
          <dd>{reading.delay === undefined ? '—' : `${reading.delay} ms`}</dd>
          <dt>{text('qualityResolution', 'Resolution')}</dt>
          <dd>
            {display && ready ? `${display.width} × ${display.height}` : '—'}
          </dd>
          <dt>{text('qualityCodec', 'Codec')}</dt>
          <dd>{ready && format ? format.codec.toUpperCase() : '—'}</dd>
          <dt>{text('colorFormat', 'Color format')}</dt>
          <dd>{ready && format?.chroma ? format.chroma : '—'}</dd>
        </dl>
        <details
          className={styles.qualityDiagnostics}
          onToggle={(event) => setDiagnosticsOpen(event.currentTarget.open)}
        >
          <summary>{text('qualityDiagnostics', 'Frame diagnostics')}</summary>
          <dl>
            <dt>
              <TcpLabel kind="entry">
                {text('qualityTcpEntry', 'Entry sender')}
              </TcpLabel>
            </dt>
            <dd>
              <TcpValue
                observation={
                  ready && sessionGuid
                    ? serverNetwork?.entry
                    : unavailableTcp('connection', 'not_connected')
                }
                loading={
                  diagnosticsOpen && ready && !!sessionGuid && !serverNetwork
                }
              />
            </dd>
            <dt>
              <TcpLabel kind="relay">
                {text('qualityTcpRelay', 'Relay sender')}
              </TcpLabel>
            </dt>
            <dd>
              <TcpValue
                observation={
                  ready && sessionGuid
                    ? serverNetwork?.relay
                    : unavailableTcp('connection', 'not_connected')
                }
                loading={
                  diagnosticsOpen && ready && !!sessionGuid && !serverNetwork
                }
              />
            </dd>
            <dt>{text('qualityReceivedFps', 'Received frame rate')}</dt>
            <dd>
              {reading.receivedFps === undefined
                ? '—'
                : `${reading.receivedFps.toFixed(1)} FPS`}
            </dd>
            <dt>{text('qualityDecodedFps', 'Decoded frame rate')}</dt>
            <dd>
              {reading.decodedFps === undefined
                ? '—'
                : `${reading.decodedFps.toFixed(1)} FPS`}
            </dd>
            <dt>{text('qualityDecodeLatency', 'Decode wait')}</dt>
            <dd>
              {reading.decodeLatencyMs === undefined
                ? '—'
                : `${reading.decodeLatencyMs.toFixed(1)} ms`}
            </dd>
            <dt>{text('qualityAckLatency', 'Frame acknowledgement wait')}</dt>
            <dd>
              {reading.ackLatencyMs === undefined
                ? '—'
                : `${reading.ackLatencyMs.toFixed(1)} ms`}
            </dd>
            <dt>{text('qualityPresentationLatency', 'Presentation wait')}</dt>
            <dd>
              {reading.presentationLatencyMs === undefined
                ? '—'
                : `${reading.presentationLatencyMs.toFixed(1)} ms`}
            </dd>
            <dt>{text('qualityDropped', 'Skipped presentation')}</dt>
            <dd>{reading.droppedPresentation ?? '—'}</dd>
            <dt>{text('qualityRecovery', 'Decode recovery')}</dt>
            <dd>{reading.recoveryCount ?? '—'}</dd>
          </dl>
        </details>
      </div>
      {(['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] as const).map((edge) => (
        <button
          key={edge}
          type="button"
          className={styles.qualityResize}
          data-quality-resize={edge}
          tabIndex={edge === 'se' ? 0 : -1}
          aria-label={text('qualityResize', 'Resize quality monitor')}
          onPointerDown={(event) => begin(event, edge)}
          onKeyDown={(event) => keyboard(event, edge)}
        />
      ))}
    </aside>
  );
}
