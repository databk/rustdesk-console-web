import {
  UserOutlined,
  DesktopOutlined,
  ApiOutlined,
  AlertOutlined,
  FileOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
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
  Segmented,
  Select,
  Space,
  Statistic,
  Typography,
} from 'antd';
import React, { type CSSProperties, useMemo, useState } from 'react';

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
  label: string;
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
  const [trendMetric, setTrendMetric] = useState<
    'connection' | 'user' | 'alarm'
  >('connection');

  const connectionChartData = useMemo(() => {
    if (!trends?.connectionTrend) return [];
    return trends.connectionTrend.flatMap((item) => [
      {
        date: item.date,
        value: item.count,
        type: intl.formatMessage({
          id: 'pages.dashboard.connectionCount',
          defaultMessage: 'Count',
        }),
      },
      {
        date: item.date,
        value: item.avgDuration,
        type: intl.formatMessage({
          id: 'pages.dashboard.avgDuration',
          defaultMessage: 'Avg Duration',
        }),
      },
    ]);
  }, [trends?.connectionTrend, intl]);

  const userNewChartData = useMemo(() => {
    if (!trends?.userActiveTrend) return [];
    return trends.userActiveTrend.map((item) => ({
      date: item.date,
      value: item.newUsers,
      type: intl.formatMessage({
        id: 'pages.dashboard.newUsers',
        defaultMessage: 'New Users',
      }),
    }));
  }, [trends?.userActiveTrend, intl]);

  const alarmChartData = useMemo(() => {
    if (!trends?.alarmTrend) return [];
    return trends.alarmTrend.map((item) => ({
      date: item.date,
      value: item.info,
      type: intl.formatMessage({
        id: 'pages.dashboard.alarmTrend',
        defaultMessage: 'Alarms',
      }),
    }));
  }, [trends?.alarmTrend, intl]);

  const noDataPlaceholder = (
    <Empty
      style={{ padding: '60px 0' }}
      description={
        <FormattedMessage
          id="pages.dashboard.noData"
          defaultMessage="No data"
        />
      }
    />
  );

  const renderLineChart = (
    chartData: Array<{ date: string; value: number; type: string }>,
  ) => {
    if (chartData.length === 0) return noDataPlaceholder;
    return (
      <Line
        data={chartData}
        xField="date"
        yField="value"
        colorField="type"
        height={300}
        legend={{ position: 'top-right' }}
        axis={{ y: { title: false }, x: { title: false } }}
      />
    );
  };

  const trendChart = (() => {
    if (trendMetric === 'connection') {
      return renderLineChart(connectionChartData);
    }
    if (trendMetric === 'user') {
      return renderLineChart(userNewChartData);
    }
    return renderLineChart(alarmChartData);
  })();

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

      {/* Section 2: Trend Charts + System Status */}
      <Col xs={24} lg={17}>
        <Card
          style={cardStyle}
          title={
            <Flex justify="space-between" align="center">
              <Segmented
                value={trendMetric}
                onChange={(val) =>
                  setTrendMetric(val as 'connection' | 'user' | 'alarm')
                }
                options={[
                  {
                    value: 'connection',
                    label: (
                      <Space size={4}>
                        <ApiOutlined />
                        <FormattedMessage
                          id="pages.dashboard.connectionTrend"
                          defaultMessage="Connections"
                        />
                      </Space>
                    ),
                  },
                  {
                    value: 'user',
                    label: (
                      <Space size={4}>
                        <UserOutlined />
                        <FormattedMessage
                          id="pages.dashboard.userActiveTrend"
                          defaultMessage="Users"
                        />
                      </Space>
                    ),
                  },
                  {
                    value: 'alarm',
                    label: (
                      <Space size={4}>
                        <AlertOutlined />
                        <FormattedMessage
                          id="pages.dashboard.alarmTrend"
                          defaultMessage="Alarms"
                        />
                      </Space>
                    ),
                  },
                ]}
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
          {trendChart}
        </Card>
      </Col>
      <Col xs={24} lg={7}>
        <Card
          style={cardStyle}
          title={
            <FormattedMessage
              id="pages.dashboard.systemStatus"
              defaultMessage="System Status"
            />
          }
        >
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
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

      {/* Section 3: File Transfer Summary */}
      <Col span={24}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card style={cardStyle} variant="borderless">
              <Statistic
                title={
                  <FormattedMessage
                    id="pages.dashboard.uploadCount"
                    defaultMessage="Upload Count"
                  />
                }
                value={data?.files.uploadCount || 0}
                prefix={<CheckCircleOutlined style={{ color: '#1890ff' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card style={cardStyle} variant="borderless">
              <Statistic
                title={
                  <FormattedMessage
                    id="pages.dashboard.downloadCount"
                    defaultMessage="Download Count"
                  />
                }
                value={data?.files.downloadCount || 0}
                prefix={<CloseCircleOutlined style={{ color: '#52c41a' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card style={cardStyle} variant="borderless">
              <Statistic
                title={
                  <FormattedMessage
                    id="pages.dashboard.totalSize"
                    defaultMessage="Total Size"
                  />
                }
                value={data?.files.totalSize || '0 B'}
                prefix={<FileOutlined style={{ color: '#13c2c2' }} />}
              />
            </Card>
          </Col>
        </Row>
      </Col>
    </Row>
  );
};

export default Dashboard;
