import {
  ArrowRightOutlined,
  DesktopOutlined,
  LeftOutlined,
  ReloadOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useIntl, useModel } from '@umijs/max';
import { Alert, Button, Spin, Switch } from 'antd';
import React, { useEffect, useState } from 'react';
import { getDeviceList } from '@/services/rustdesk-console/device';
import styles from './index.less';

const PAGE_SIZE = 6;

export function DevicePicker({
  disabled,
  onConnect,
}: {
  disabled: boolean;
  onConnect: (id: string) => void;
}) {
  const intl = useIntl();
  const text = (key: string, fallback: string) =>
    intl.formatMessage({ id: 'webClient.' + key, defaultMessage: fallback });
  const { initialState } = useModel('@@initialState');
  const owner = initialState?.currentUser;
  const [filter, setFilter] = useState({
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
    if (!owner) return;
    const controller = new AbortController();
    void getDeviceList(
      {
        current: filter.page,
        pageSize: PAGE_SIZE,
        status: '1',
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
    result?.owner === owner && result?.filter === filter ? result : undefined;
  const loading = !!owner && !current;
  const pages = Math.max(1, Math.ceil((current?.total || 0) / PAGE_SIZE));
  return (
    <section
      className={styles.devices}
      aria-label={text('devicesTitle', 'Accessible devices')}
    >
      <div className={styles.devicesHeading}>
        <div className={styles.devicesTitle}>
          <h2>{text('devicesTitle', 'Accessible devices')}</h2>
          {current && (
            <span className={styles.deviceCount}>{current.total}</span>
          )}
        </div>
        <div className={styles.deviceActions}>
          <label
            className={styles.onlineFilter}
            htmlFor="web-client-online-only"
          >
            <span>{text('devicesOnlineOnly', 'Online only')}</span>
            <Switch
              id="web-client-online-only"
              size="small"
              aria-label={text('devicesOnlineOnly', 'Online only')}
              checked={filter.online}
              onChange={(online) =>
                setFilter((previous) => ({ ...previous, online, page: 1 }))
              }
            />
          </label>
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
            'Could not load devices. Refresh to retry, or connect using an ID.',
          )}
        />
      ) : !current?.data.length ? (
        <p className={styles.deviceEmpty}>
          {text(
            'devicesEmpty',
            'No devices are available. You can still connect using an ID.',
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
              data-online={!!device.is_online}
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
                <strong title={device.info?.device_name || device.id}>
                  {device.info?.device_name || device.id}
                </strong>
                {device.info?.device_name &&
                  device.info.device_name !== device.id && (
                    <span className={styles.deviceId}>{device.id}</span>
                  )}
                {device.info?.os && (
                  <span className={styles.deviceSystem} title={device.info.os}>
                    {device.info.os}
                  </span>
                )}
              </span>
              <ArrowRightOutlined className={styles.deviceArrow} aria-hidden />
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
          <span>
            {current.total} {text('deviceCount', 'devices')}
          </span>
          <div className={styles.pageButtons}>
            <Button
              aria-label={text('previous', 'Previous')}
              icon={<LeftOutlined />}
              disabled={filter.page <= 1}
              onClick={() => setFilter({ ...filter, page: filter.page - 1 })}
            />
            <span>
              {filter.page} / {pages}
            </span>
            <Button
              aria-label={text('next', 'Next')}
              icon={<RightOutlined />}
              disabled={filter.page >= pages}
              onClick={() => setFilter({ ...filter, page: filter.page + 1 })}
            />
          </div>
        </div>
      )}
    </section>
  );
}
