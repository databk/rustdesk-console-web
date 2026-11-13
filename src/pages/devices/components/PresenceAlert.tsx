import { useIntl } from '@umijs/max';
import { Alert, Space, Typography } from 'antd';
import React from 'react';

const MAX_VISIBLE_IDS = 8;

function formatIds(ids: string[]): string {
  if (ids.length <= MAX_VISIBLE_IDS) return ids.join(', ');
  return `${ids.slice(0, MAX_VISIBLE_IDS).join(', ')} +${ids.length - MAX_VISIBLE_IDS}`;
}

export interface PresenceAlertProps {
  diagnostics?: API.DevicePresenceDiagnostics | null;
}

/**
 * Deployment-wide comparison between the hbbs peer registry and the Console
 * heartbeat inventory. Presence remains diagnostic only: `is_online` still
 * follows the authoritative Console heartbeat.
 */
const PresenceAlert: React.FC<PresenceAlertProps> = ({ diagnostics }) => {
  const intl = useIntl();
  if (!diagnostics?.available || diagnostics.anomaly_count <= 0) return null;

  const rows: Array<{
    labelId: string;
    mismatch: API.DevicePresenceMismatch;
  }> = [
    {
      labelId: 'pages.devices.presence.hbbsOnlineConsoleOffline',
      mismatch: diagnostics.mismatches.hbbs_online_console_offline,
    },
    {
      labelId: 'pages.devices.presence.consoleOnlineHbbsOffline',
      mismatch: diagnostics.mismatches.console_online_hbbs_offline,
    },
    {
      labelId: 'pages.devices.presence.hbbsOnly',
      mismatch: diagnostics.mismatches.hbbs_only,
    },
  ].filter((row) => row.mismatch.count > 0);

  return (
    <Alert
      type="warning"
      showIcon
      style={{ marginBottom: 16 }}
      message={intl.formatMessage(
        { id: 'pages.devices.presenceAnomalyTitle' },
        { count: diagnostics.anomaly_count },
      )}
      description={
        <Space direction="vertical" size={2}>
          {rows.map(({ labelId, mismatch }) => (
            <span key={labelId}>
              {intl.formatMessage({ id: labelId })}: {mismatch.count}
              {' ('}
              <Typography.Text code>
                {formatIds(mismatch.device_ids)}
              </Typography.Text>
              {')'}
            </span>
          ))}
          <Typography.Text type="secondary">
            {intl.formatMessage({ id: 'pages.devices.presenceAnomalyHint' })}
          </Typography.Text>
        </Space>
      }
    />
  );
};

export default PresenceAlert;
