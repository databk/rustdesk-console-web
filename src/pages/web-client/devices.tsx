import { DesktopOutlined, ReloadOutlined } from '@ant-design/icons';
import { useIntl, useModel } from '@umijs/max';
import { Alert, Button, Spin } from 'antd';
import React, { useEffect, useState } from 'react';
import { getDeviceList } from '@/services/rustdesk-console/device';
import styles from './index.less';

const PAGE_SIZE = 6;

export function DevicePicker({
  disabled,
  onConnect,
  query,
}: {
  disabled: boolean;
  query: string;
  onConnect: (id: string) => void;
}) {
  const intl = useIntl();
  const text = (key: string, fallback: string) =>
    intl.formatMessage({ id: 'webClient.' + key, defaultMessage: fallback });
  const { initialState } = useModel('@@initialState');
  const owner = initialState?.currentUser;
  const [filter, setFilter] = useState({
    id: query.trim(),
    online: false,
    page: 1,
    revision: 0,
  });
  const [result, setResult] = useState<{
    owner: typeof owner;
    filter: typeof filter;
    data: API.DeviceItem[];
    total: number;
    failed?: boolean;
  }>();
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilter((previous) =>
        previous.id === query.trim()
          ? previous
          : { ...previous, id: query.trim(), page: 1 },
      );
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);
  useEffect(() => {
    if (!owner) return;
    const controller = new AbortController();
    void getDeviceList(
      {
        current: filter.page,
        pageSize: PAGE_SIZE,
        status: '1',
        ...(filter.id ? { id: filter.id } : {}),
        ...(filter.online ? { is_online: '1' } : {}),
      },
      { signal: controller.signal, skipErrorHandler: true },
    )
      .then((value) => {
        if (!controller.signal.aborted)
          setResult({ owner, filter, data: value.data, total: value.total });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setResult({ owner, filter, data: [], total: 0, failed: true });
      });
    return () => controller.abort();
  }, [owner, filter]);
  // 同一渲染即遮蔽旧账号或旧筛选结果，不能等 effect 清理后才隐藏。
  const current =
    result?.owner === owner &&
    result?.filter === filter &&
    filter.id === query.trim()
      ? result
      : undefined;
  const loading = !!owner && !current;
  const pages = Math.max(1, Math.ceil((current?.total || 0) / PAGE_SIZE));
  return (
    <section
      className={styles.devices}
      aria-label={text('devicesTitle', 'Accessible devices')}
    >
      <div className={styles.devicesHeading}>
        <div>
          <h2>{text('devicesTitle', 'Accessible devices')}</h2>
          <p>
            {text(
              'devicesHint',
              'Choose a device available to your account. Remote approval or password is still required.',
            )}
          </p>
        </div>
        <Button
          type="text"
          icon={<ReloadOutlined />}
          disabled={loading}
          aria-label={text('devicesRefresh', 'Refresh devices')}
          onClick={() =>
            setFilter({ ...filter, revision: filter.revision + 1 })
          }
        />
      </div>
      <div className={styles.deviceFilters}>
        <label className={styles.onlineFilter}>
          <input
            type="checkbox"
            checked={filter.online}
            onChange={(event) =>
              setFilter({ ...filter, online: event.target.checked, page: 1 })
            }
          />
          {text('devicesOnlineOnly', 'Online only')}
        </label>
      </div>
      {loading ? (
        <div className={styles.deviceEmpty} role="status">
          <Spin />
        </div>
      ) : current?.failed ? (
        <Alert
          type="warning"
          showIcon
          message={text(
            'devicesFailed',
            'Could not load devices. Refresh to retry, or enter an ID above.',
          )}
        />
      ) : !current?.data.length ? (
        <p className={styles.deviceEmpty}>
          {text(
            'devicesEmpty',
            'No matching devices are available to this account. You can still enter an ID above.',
          )}
        </p>
      ) : (
        <div className={styles.deviceGrid}>
          {current.data.map((device) => (
            <button
              type="button"
              key={device.guid || device.id}
              disabled={disabled}
              className={styles.deviceCard}
              onClick={() => onConnect(device.id)}
              aria-label={
                text('connect', 'Connect') +
                ': ' +
                (device.info?.device_name || device.id) +
                ' (' +
                device.id +
                ')'
              }
            >
              <span className={styles.deviceIcon}>
                <DesktopOutlined />
              </span>
              <span className={styles.deviceIdentity}>
                <strong>{device.info?.device_name || device.id}</strong>
                <span>
                  {device.id}
                  {device.info?.os ? ' · ' + device.info.os : ''}
                </span>
              </span>
              <span
                className={styles.devicePresence}
                data-online={!!device.is_online}
              >
                <i />
                {text(
                  device.is_online ? 'deviceOnline' : 'deviceOffline',
                  device.is_online ? 'Online' : 'Offline',
                )}
              </span>
            </button>
          ))}
        </div>
      )}
      {!loading && !!current?.total && (
        <div className={styles.devicePagination}>
          <Button
            disabled={filter.page <= 1}
            onClick={() => setFilter({ ...filter, page: filter.page - 1 })}
          >
            {text('previous', 'Previous')}
          </Button>
          <span>
            {filter.page} / {pages} · {current.total}{' '}
            {text('deviceCount', 'devices')}
          </span>
          <Button
            disabled={filter.page >= pages}
            onClick={() => setFilter({ ...filter, page: filter.page + 1 })}
          >
            {text('next', 'Next')}
          </Button>
        </div>
      )}
    </section>
  );
}
