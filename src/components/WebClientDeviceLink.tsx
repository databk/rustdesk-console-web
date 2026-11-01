import { CameraOutlined, GlobalOutlined } from '@ant-design/icons';
import { Link, useAccess, useIntl, useModel } from '@umijs/max';
import React from 'react';

export default function WebClientDeviceLink({
  id,
  autoConnect = false,
  mode = 'desktop',
}: {
  id: string;
  autoConnect?: boolean;
  mode?: 'desktop' | 'camera';
}) {
  const { configuration } = useModel('webClient');
  const access = useAccess();
  const intl = useIntl();
  if (!configuration?.enabled || !access.canWebClientConnect) return null;
  const label = intl.formatMessage({
    id:
      mode === 'camera'
        ? 'pages.devices.connectViewCamera'
        : 'webClient.open',
    defaultMessage:
      mode === 'camera' ? 'View Camera' : 'Connect in browser',
  });
  const query = `id=${encodeURIComponent(id)}${autoConnect ? '&connect=1' : ''}${mode === 'camera' ? '&mode=camera' : ''}`;
  return (
    <Link
      to={`/web-client?${query}`}
      aria-label={label}
      title={label}
      style={{ marginLeft: 8 }}
    >
      {mode === 'camera' ? <CameraOutlined /> : <GlobalOutlined />}
    </Link>
  );
}
