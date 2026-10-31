import { GlobalOutlined } from '@ant-design/icons';
import { Link, useAccess, useIntl, useModel } from '@umijs/max';
import React from 'react';

export default function WebClientDeviceLink({
  id,
  autoConnect = false,
}: {
  id: string;
  autoConnect?: boolean;
}) {
  const { configuration } = useModel('webClient');
  const access = useAccess();
  const intl = useIntl();
  if (!configuration?.enabled || !access.canWebClientConnect) return null;
  const label = intl.formatMessage({
    id: 'webClient.open',
    defaultMessage: 'Connect in browser',
  });
  return (
    <Link
      to={`/web-client?id=${encodeURIComponent(id)}${autoConnect ? '&connect=1' : ''}`}
      aria-label={label}
      title={label}
      style={{ marginLeft: 8 }}
    >
      <GlobalOutlined />
    </Link>
  );
}
