import { GlobalOutlined } from '@ant-design/icons';
import { Link, useIntl, useModel } from '@umijs/max';
import React from 'react';

export default function WebClientDeviceLink({ id }: { id: string }) {
  const { configuration } = useModel('webClient');
  const intl = useIntl();
  if (!configuration?.enabled) return null;
  const label = intl.formatMessage({
    id: 'webClient.open',
    defaultMessage: 'Connect in browser',
  });
  return (
    <Link
      to={`/web-client?id=${encodeURIComponent(id)}`}
      aria-label={label}
      title={label}
      style={{ marginLeft: 8 }}
    >
      <GlobalOutlined />
    </Link>
  );
}
