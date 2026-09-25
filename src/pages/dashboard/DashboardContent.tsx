import {
  UserOutlined,
  DesktopOutlined,
  ApiOutlined,
  AlertOutlined,
  FileOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined,
} from '@ant-design/icons';
import { Line } from '@ant-design/plots';
import { FormattedMessage, useIntl } from '@umijs/max';
import {
  Card,
  Col,
  Empty,
  Flex,
  Progress,
  Row,
  Select,
  Space,
  Statistic,
  Typography,
} from 'antd';
import React, { type CSSProperties, useMemo } from 'react';

const { Text } = Typography;

type TrendRange = '7d' | '30d' | '90d';

interface DashboardProps {
  data?: API.DashboardData;
  trends?: API.DashboardTrends;
  trendRange: TrendRange;
  onTrendRangeChange: (range: TrendRange) => void;
}

const cardStyle: CSSProperties = { height: '100%' };

const getProgressColor = (value: number | null) =>
  value === null
    ? '#d9d9d9'
    : value > 80
      ? '#f5222d'
      : value > 60
        ? '#faad14'
        : '#52c41a';

const formatPercentage = (value: number | null) =>
  value === null ? '--' : `${value}%`;

const formatUptime = (seconds: number) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
};

const SystemStatusItem: React.FC<{
  label: React.ReactNode;
  value: number | null;
}> = ({ label, value }) => {
  const color = getProgressColor(value);
  return (
    <div>
      <Flex justify="space-between" align="center" style={{ marginBottom: 4 }}>
        <Text style={{ fontSize: 13 }}>{label}</Text>
        <Text style={{ fontSize: 13, color }}>{formatPercentage(value)}</Text>
      </Flex>
      <Progress
        percent={value ?? 0}
        showInfo={false}
        strokeColor={color}
        size={['100%', 6]}
      />
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({
  data,
  trends,
  trendRange,
  onTrendRangeChange,
}) => {
  const intl = useIntl();

  const combinedTrendData = useMemo(() => {
    const result: Array<{ date: string; value: number; type: string }> = [];
    const connLabel = intl.formatMessage({
      id: 'pages.dashboard.connectionCount',
      defaultMessage: 'Connections',
    });
    const userLabel = intl.formatMessage({
      id: 'pages.dashboard.newUsers',
      defaultMessage: 'New Users',
    });
    const alarmLabel = intl.formatMessage({
      id: 'pages.dashboard.alarmTrend',
      defaultMessage: 'Alarms',
    });

    const dateSet = new Set<string>();
    trends?.connectionTrend?.forEach((item) => dateSet.add(item.date));
    trends?.userActiveTrend?.forEach((item) => dateSet.add(item.date));
    trends?.alarmTrend?.forEach((item) => dateSet.add(item.date));

    const sortedDates = Array.from(dateSet).sort();

    for (const date of sortedDates) {
      const connItem = trends?.connectionTrend?.find((t) => t.date === date);
      if (connItem) {
        result.push({ date, value: connItem.count, type: connLabel });
      }

      const userItem = trends?.userActiveTrend?.find((t) => t.date === date);
      if (userItem) {
        result.push({ date, value: userItem.newUsers, type: userLabel });
      }

      const alarmItem = trends?.alarmTrend?.find((t) => t.date === date);
      if (alarmItem) {
        result.push({ date, value: alarmItem.info, type: alarmLabel });
      }
    }

    return result;
  }, [trends, intl]);

  const cpu = data?.systemStatus?.cpu ?? null;
  const memory = data?.systemStatus?.memory ?? null;
  const disk = data?.systemStatus?.disk ?? null;
  const uptime = data?.systemStatus?.uptime ?? null;

  return (
    <Row gutter={[16, 16]}>
      {/* Section 1: Overview Metric Cards */}
      <Col span={24}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card style={cardStyle} variant="borderless">
              <Statistic
                title={
                  <FormattedMessage
                    id="pages.dashboard.totalUsers"
                    defaultMessage="Total Users"
                  />
                }
                value={data?.users.total || 0}
                prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              />
              <div style={{ marginTop: 8 }}>
                <Space size={16}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <FormattedMessage
                      id="pages.dashboard.activeUsers"
                      defaultMessage="Active"
                    />
                    : {data?.users.active || 0}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <FormattedMessage
                      id="pages.dashboard.newUsers"
                      defaultMessage="New Today"
                    />
                    : {data?.users.newToday || 0}
                  </Text>
                </Space>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={cardStyle} variant="borderless">
              <Statistic
                title={
                  <FormattedMessage
                    id="pages.dashboard.totalDevices"
                    defaultMessage="Total Devices"
                  />
                }
                value={data?.devices.total || 0}
                prefix={<DesktopOutlined style={{ color: '#52c41a' }} />}
              />
              <div style={{ marginTop: 8 }}>
                <Space size={16}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <FormattedMessage
                      id="pages.dashboard.onlineDevices"
                      defaultMessage="Online"
                    />
                    :{' '}
                    <Text style={{ color: '#52c41a', fontSize: 12 }}>
                      {data?.devices.online || 0}
                    </Text>
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <FormattedMessage
                      id="pages.dashboard.offlineDevices"
                      defaultMessage="Offline"
                    />
                    : {data?.devices.offline || 0}
                  </Text>
                </Space>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={cardStyle} variant="borderless">
              <Statistic
                title={
                  <FormattedMessage
                    id="pages.dashboard.todayConnections"
                    defaultMessage="Today Connections"
                  />
                }
                value={data?.connections.today || 0}
                prefix={<ApiOutlined style={{ color: '#722ed1' }} />}
              />
              <div style={{ marginTop: 8 }}>
                <Space size={16}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <FormattedMessage
                      id="pages.dashboard.successRate"
                      defaultMessage="Success Rate"
                    />
                    :{' '}
                    <Text
                      style={{
                        color:
                          (data?.connections.successRate || 0) >= 80
                            ? '#52c41a'
                            : '#faad14',
                        fontSize: 12,
                      }}
                    >
                      {data?.connections.successRate || 0}%
                    </Text>
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <FormattedMessage
                      id="pages.dashboard.avgDuration"
                      defaultMessage="Avg"
                    />
                    : {data?.connections.avgDuration || 0} min
                  </Text>
                </Space>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={cardStyle} variant="borderless">
              <Statistic
                title={
                  <FormattedMessage
                    id="pages.dashboard.totalAlarms"
                    defaultMessage="Total Alarms"
                  />
                }
                value={data?.alarms.total || 0}
                prefix={<AlertOutlined style={{ color: '#faad14' }} />}
              />
              <div style={{ marginTop: 8 }}>
                <Space size={16}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <FormattedMessage
                      id="pages.dashboard.todayAlarms"
                      defaultMessage="Today"
                    />
                    : {data?.alarms.today || 0}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <FormattedMessage
                      id="pages.dashboard.fileTransfer"
                      defaultMessage="Files Today"
                    />
                    : {data?.files.transferredToday || 0}
                  </Text>
                </Space>
              </div>
            </Card>
          </Col>
        </Row>
      </Col>

      {/* Section 2: Left (File Transfer + System Status) | Right (Trend Chart) */}
      <Col xs={24} lg={7}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card
              style={cardStyle}
              title={
                <Space>
                  <FileOutlined style={{ color: '#13c2c2' }} />
                  <FormattedMessage
                    id="pages.dashboard.fileTransfer"
                    defaultMessage="File Transfer"
                  />
                </Space>
              }
              size="small"
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title={
                      <FormattedMessage
                        id="pages.dashboard.uploadCount"
                        defaultMessage="Upload"
                      />
                    }
                    value={data?.files.uploadToday || 0}
                    valueStyle={{ fontSize: 18 }}
                    prefix={
                      <CloudUploadOutlined style={{ color: '#1890ff' }} />
                    }
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title={
                      <FormattedMessage
                        id="pages.dashboard.downloadCount"
                        defaultMessage="Download"
                      />
                    }
                    value={data?.files.downloadToday || 0}
                    valueStyle={{ fontSize: 18 }}
                    prefix={
                      <CloudDownloadOutlined style={{ color: '#52c41a' }} />
                    }
                  />
                </Col>
              </Row>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <FormattedMessage
                    id="pages.dashboard.totalSize"
                    defaultMessage="Total Size"
                  />
                  : {data?.files.totalSizeToday || '0 B'}
                </Text>
              </div>
            </Card>
          </Col>
          <Col span={24}>
            <Card
              style={cardStyle}
              title={
                <FormattedMessage
                  id="pages.dashboard.systemStatus"
                  defaultMessage="System Status"
                />
              }
              size="small"
            >
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                <SystemStatusItem
                  label={
                    <FormattedMessage
                      id="pages.dashboard.cpu"
                      defaultMessage="CPU"
                    />
                  }
                  value={cpu}
                />
                <SystemStatusItem
                  label={
                    <FormattedMessage
                      id="pages.dashboard.memory"
                      defaultMessage="Memory"
                    />
                  }
                  value={memory}
                />
                <SystemStatusItem
                  label={
                    <FormattedMessage
                      id="pages.dashboard.disk"
                      defaultMessage="Disk"
                    />
                  }
                  value={disk}
                />
                <div
                  style={{
                    textAlign: 'center',
                    paddingTop: 8,
                    borderTop: '1px solid #f0f0f0',
                  }}
                >
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <FormattedMessage
                      id="pages.dashboard.uptime"
                      defaultMessage="Uptime"
                    />
                    : {uptime === null ? '--' : formatUptime(uptime)}
                  </Text>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      </Col>
      <Col xs={24} lg={17}>
        <Card
          style={cardStyle}
          title={
            <Flex justify="space-between" align="center">
              <FormattedMessage
                id="pages.dashboard.trendData"
                defaultMessage="Trend Data"
              />
              <Select
                value={trendRange}
                onChange={onTrendRangeChange}
                size="small"
                variant="filled"
                options={[
                  {
                    value: '7d',
                    label: intl.formatMessage({
                      id: 'pages.dashboard.7days',
                      defaultMessage: '7 Days',
                    }),
                  },
                  {
                    value: '30d',
                    label: intl.formatMessage({
                      id: 'pages.dashboard.30days',
                      defaultMessage: '30 Days',
                    }),
                  },
                  {
                    value: '90d',
                    label: intl.formatMessage({
                      id: 'pages.dashboard.90days',
                      defaultMessage: '90 Days',
                    }),
                  },
                ]}
                style={{ width: 100 }}
              />
            </Flex>
          }
        >
          {combinedTrendData.length > 0 ? (
            <Line
              data={combinedTrendData}
              xField="date"
              yField="value"
              colorField="type"
              height={400}
              legend={{ position: 'top-right' }}
              axis={{ y: { title: false }, x: { title: false } }}
            />
          ) : (
            <Empty
              style={{ padding: '100px 0' }}
              description={
                <FormattedMessage
                  id="pages.dashboard.noData"
                  defaultMessage="No data"
                />
              }
            />
          )}
        </Card>
      </Col>
    </Row>
  );
};

export default Dashboard;
