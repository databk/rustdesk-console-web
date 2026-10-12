import { InfoCircleOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Popover } from 'antd';
import React from 'react';
import en from '@/locales/en-US/serverNetwork';
import type { TcpObservation } from '@/services/rustdesk-console/tcpObservation';
import styles from './index.less';

function useText() {
  const intl = useIntl();
  return (key: string) => {
    const id = `pages.servers.network.${key}`;
    return intl.formatMessage({
      id,
      defaultMessage: (en as Record<string, string>)[id],
    });
  };
}
const popupContainer = (trigger: HTMLElement) => {
  const fullscreen = document.fullscreenElement;
  return fullscreen instanceof HTMLElement && fullscreen.contains(trigger)
    ? fullscreen
    : document.body;
};
function Info({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <Popover
      content={children}
      trigger={['hover', 'focus', 'click']}
      placement="bottom"
      getPopupContainer={popupContainer}
      zIndex={1100}
    >
      <button
        type="button"
        className={styles.info}
        aria-label={label}
        onPointerDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <InfoCircleOutlined />
      </button>
    </Popover>
  );
}

export function TcpLabel({
  children,
  kind = 'system',
}: {
  children: React.ReactNode;
  kind?: 'system' | 'entry' | 'relay';
}) {
  const t = useText();
  return (
    <span className={styles.inline}>
      {children}
      <Info label={t('aboutTitle')}>
        <div className={styles.popup}>
          <p>{t(`about.${kind}`)}</p>
          <p>{t('about.modify')}</p>
        </div>
      </Info>
    </span>
  );
}

const common: Record<TcpObservation['environment']['system'], string[]> = {
  linux: ['reno', 'cubic', 'bbr'],
  windows: ['newreno', 'cubic', 'ctcp', 'dctcp', 'bbr2'],
  macos: ['newreno', 'cubic', 'ledbat', 'prague'],
  unknown: [],
};
const guide: Record<string, string> = {
  reno: 'reno',
  newreno: 'reno',
  cubic: 'cubic',
  bbr: 'bbr',
  bbr2: 'bbr',
  bbr3: 'bbr',
  ctcp: 'hybrid',
  illinois: 'hybrid',
  dctcp: 'dctcp',
  prague: 'prague',
  vegas: 'delay',
  ledbat: 'background',
  lp: 'background',
};
function ResultDetails({
  observation,
  context,
}: {
  observation: TcpObservation;
  context?: 'console' | 'node';
}) {
  const t = useText();
  const e = observation.environment;
  const algorithms = [
    ...new Set([
      ...(observation.algorithms_verified
        ? observation.algorithms
        : common[e.system]),
      ...(observation.algorithm ? [observation.algorithm] : []),
      ...observation.profiles.flatMap((p) =>
        p.algorithm ? [p.algorithm] : [],
      ),
    ]),
  ];
  return (
    <div className={styles.popup}>
      <div className={styles.environment}>
        <span>
          {t(`system.${e.system}`)}
          {e.release ? ` ${e.release}` : ''}
        </span>
        <span>{t(`deployment.${e.deployment}`)}</span>
      </div>
      <p>
        {context
          ? t(`scopeContext.${context}`)
          : `${t('scopeLabel')}${t(`scope.${e.scope}`)}`}
      </p>
      {observation.status === 'unavailable' && (
        <p className={styles.reason} role="note">
          {t(`reason.${observation.reason}`)}
        </p>
      )}
      {observation.kind === 'system' && (
        <p className={styles.context}>{t('currentConfiguration')}</p>
      )}
      {observation.status === 'identified' &&
        observation.kind === 'connection' && (
          <p className={styles.context}>{t('actualConnection')}</p>
        )}
      {observation.profiles.length > 0 && (
        <dl className={styles.profiles}>
          {observation.profiles.map((p) => (
            <React.Fragment key={p.name}>
              <dt>{p.name}</dt>
              <dd>{p.algorithm?.toUpperCase() || t('unknown')}</dd>
            </React.Fragment>
          ))}
        </dl>
      )}
      {algorithms.length > 0 && (
        <table className={styles.table}>
          <caption>
            {t(
              observation.algorithms_verified
                ? 'registeredAlgorithms'
                : 'commonAlgorithms',
            )}
          </caption>
          <thead>
            <tr>
              <th>{t('algorithm')}</th>
              <th>{t('feature')}</th>
              <th>{t('suitable')}</th>
            </tr>
          </thead>
          <tbody>
            {algorithms.map((algorithm) => {
              const category = guide[algorithm.toLowerCase()] || 'other';
              return (
                <tr key={algorithm}>
                  <th scope="row">{algorithm.toUpperCase()}</th>
                  <td>{t(`guide.${category}.feature`)}</td>
                  <td>{t(`guide.${category}.suitable`)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function TcpValue({
  observation,
  loading = false,
  context,
}: {
  observation?: TcpObservation;
  loading?: boolean;
  context?: 'console' | 'node';
}) {
  const t = useText();
  const value = loading
    ? t('loading')
    : observation?.status === 'identified'
      ? observation.algorithm?.toUpperCase()
      : observation?.status === 'mixed'
        ? t('multiple')
        : observation?.status === 'not_applicable'
          ? t('notApplicable')
          : observation?.reason === 'not_connected'
            ? t('notConnected')
            : t('unknown');
  return (
    <span
      className={styles.inline}
      data-tcp-result={observation?.status || 'loading'}
    >
      {value}
      {observation && !loading && (
        <Info label={t('resultDetails')}>
          <ResultDetails observation={observation} context={context} />
        </Info>
      )}
    </span>
  );
}
