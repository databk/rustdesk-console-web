import { FormattedMessage } from '@umijs/max';
import { Card, Progress, Space, Typography } from 'antd';
import React, { type CSSProperties } from 'react';

const { Text } = Typography;

const getProgressColor = (value: number) =>
  value > 80 ? '#f5222d' : value > 60 ? '#faad14' : '#52c41a';

const formatUptime = (seconds: number) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
};

interface SystemStatusProps {
  systemStatus?: API.DashboardRealtime['systemStatus'];
  style?: CSSProperties;
}

const SystemStatus: React.FC<SystemStatusProps> = ({ systemStatus, style }) => {
  const cpu = systemStatus?.cpu || 0;
  const memory = systemStatus?.memory || 0;
  const disk = systemStatus?.disk || 0;
  const uptime = systemStatus?.uptime || 0;

  return (
    <Card
      style={style}
      title={
        <FormattedMessage
          id="pages.dashboard.systemStatus"
          defaultMessage="System Status"
        />
      }
      size="small"
      styles={{ body: { padding: '12px 16px' } }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 4,
            }}
          >
            <Text style={{ fontSize: 12 }}>
              <FormattedMessage id="pages.dashboard.cpu" defaultMessage="CPU" />
            </Text>
            <Text style={{ fontSize: 12, color: getProgressColor(cpu) }}>
              {cpu}%
            </Text>
          </div>
          <Progress
            percent={cpu}
            showInfo={false}
            strokeColor={getProgressColor(cpu)}
            size="small"
          />
        </div>
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 4,
            }}
          >
            <Text style={{ fontSize: 12 }}>
              <FormattedMessage
                id="pages.dashboard.memory"
                defaultMessage="Memory"
              />
            </Text>
            <Text style={{ fontSize: 12, color: getProgressColor(memory) }}>
              {memory}%
            </Text>
          </div>
          <Progress
            percent={memory}
            showInfo={false}
            strokeColor={getProgressColor(memory)}
            size="small"
          />
        </div>
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 4,
            }}
          >
            <Text style={{ fontSize: 12 }}>
              <FormattedMessage
                id="pages.dashboard.disk"
                defaultMessage="Disk"
              />
            </Text>
            <Text style={{ fontSize: 12, color: getProgressColor(disk) }}>
              {disk}%
            </Text>
          </div>
          <Progress
            percent={disk}
            showInfo={false}
            strokeColor={getProgressColor(disk)}
            size="small"
          />
        </div>
        <div
          style={{
            textAlign: 'center',
            paddingTop: 4,
            borderTop: '1px solid #f0f0f0',
          }}
        >
          <Text type="secondary" style={{ fontSize: 12 }}>
            <FormattedMessage
              id="pages.dashboard.uptime"
              defaultMessage="Uptime"
            />
            : {formatUptime(uptime)}
          </Text>
        </div>
      </Space>
    </Card>
  );
};

export default SystemStatus;
