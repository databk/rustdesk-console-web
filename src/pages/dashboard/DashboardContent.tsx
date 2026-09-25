import {
  UserOutlined,
  DesktopOutlined,
  ApiOutlined,
  AlertOutlined,
  FileOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { Area, Column } from '@ant-design/plots';
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
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
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

  const userActiveChartData = useMemo(() => {
    if (!trends?.userActiveTrend) return [];
    return trends.userActiveTrend.flatMap((item) => [
      {
        date: item.date,
        value: item.newUsers,
        type: intl.formatMessage({
          id: 'pages.dashboard.newUsers',
          defaultMessage: 'New Users',
        }),
      },
      {
        date: item.date,
        value: item.activeUsers,
        type: intl.formatMessage({
          id: 'pages.dashboard.activeUsers',
          defaultMessage: 'Active Users',
        }),
      },
    ]);
  }, [trends?.userActiveTrend, intl]);

  const alarmChartData = useMemo(() => {
    if (!trends?.alarmTrend) return [];
    return trends.alarmTrend.flatMap((item) => [
      { date: item.date, value: item.critical, type: 'Critical' },
      { date: item.date, value: item.warning, type: 'Warning' },
      { date: item.date, value: item.info, type: 'Info' },
    ]);
  }, [trends?.alarmTrend]);

  const connectionColumns: ColumnsType<
    API.DashboardData['activeConnections'][0]
  > = [
    {
      title: (
        <FormattedMessage id="pages.dashboard.user" defaultMessage="User" />
      ),
      dataIndex: 'userName',
      key: 'userName',
      ellipsis: true,
    },
    {
      title: (
        <FormattedMessage id="pages.dashboard.device" defaultMessage="Device" />
      ),
      dataIndex: 'deviceName',
      key: 'deviceName',
      ellipsis: true,
    },
    {
      title: (
        <FormattedMessage
          id="pages.dashboard.duration"
          defaultMessage="Duration"
        />
      ),
      dataIndex: 'duration',
      key: 'duration',
      width: 80,
      render: (duration: number) => `${duration} min`,
    },
    {
      title: (
        <FormattedMessage
          id="pages.dashboard.startTime"
          defaultMessage="Start Time"
        />
      ),
      dataIndex: 'startTime',
      key: 'startTime',
      width: 160,
      render: (time: string) => new Date(time).toLocaleString(),
    },
  ];

  const eventColumns: ColumnsType<API.DashboardData['recentEvents'][0]> = [
    {
      title: (
        <FormattedMessage
          id="pages.dashboard.eventType"
          defaultMessage="Type"
        />
      ),
      dataIndex: 'type',
      key: 'type',
      width: 90,
      render: (type: string) => (
        <Tag
          color={
            type === 'connection'
              ? 'blue'
              : type === 'file'
                ? 'green'
                : 'orange'
          }
        >
          {type}
        </Tag>
      ),
    },
    {
      title: (
        <FormattedMessage id="pages.dashboard.action" defaultMessage="Action" />
      ),
      dataIndex: 'action',
      key: 'action',
    },
    {
      title: (
        <FormattedMessage id="pages.dashboard.user" defaultMessage="User" />
      ),
      dataIndex: 'user',
      key: 'user',
      ellipsis: true,
    },
    {
      title: (
        <FormattedMessage id="pages.dashboard.target" defaultMessage="Target" />
      ),
      dataIndex: 'target',
      key: 'target',
      ellipsis: true,
    },
    {
      title: (
        <FormattedMessage id="pages.dashboard.status" defaultMessage="Status" />
      ),
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag
          color={
            status === 'success'
              ? 'success'
              : status === 'failed'
                ? 'error'
                : 'warning'
          }
        >
          {status}
        </Tag>
      ),
    },
    {
      title: (
        <FormattedMessage id="pages.dashboard.time" defaultMessage="Time" />
      ),
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 160,
      render: (time: string) => new Date(time).toLocaleString(),
    },
  ];

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

  const trendChart = (() => {
    if (trendMetric === 'connection') {
      return connectionChartData.length > 0 ? (
        <Area
          data={connectionChartData}
          xField="date"
          yField="value"
          colorField="type"
          height={300}
          legend={{ position: 'top-right' }}
          axis={{ y: { title: false }, x: { title: false } }}
        />
      ) : (
        noDataPlaceholder
      );
    }
    if (trendMetric === 'user') {
      return userActiveChartData.length > 0 ? (
        <Column
          data={userActiveChartData}
          xField="date"
          yField="value"
          colorField="type"
          group
          height={300}
          legend={{ position: 'top-right' }}
          axis={{ y: { title: false }, x: { title: false } }}
        />
      ) : (
        noDataPlaceholder
      );
    }
    return alarmChartData.length > 0 ? (
      <Column
        data={alarmChartData}
        xField="date"
        yField="value"
        colorField="type"
        group
        height={300}
        color={['#f5222d', '#faad14', '#1890ff']}
        legend={{ position: 'top-right' }}
        axis={{ y: { title: false }, x: { title: false } }}
      />
    ) : (
      noDataPlaceholder
    );
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
            <div>
              <Flex
                justify="space-between"
                align="center"
                style={{ marginBottom: 4 }}
              >
                <Text style={{ fontSize: 13 }}>
                  <FormattedMessage
                    id="pages.dashboard.cpu"
                    defaultMessage="CPU"
                  />
                </Text>
                <Text style={{ fontSize: 13, color: getProgressColor(cpu) }}>
                  {formatPercentage(cpu)}
                </Text>
              </Flex>
              <Progress
                percent={cpu ?? 0}
                showInfo={false}
                strokeColor={getProgressColor(cpu)}
                size={['100%', 6]}
              />
            </div>
            <div>
              <Flex
                justify="space-between"
                align="center"
                style={{ marginBottom: 4 }}
              >
                <Text style={{ fontSize: 13 }}>
                  <FormattedMessage
                    id="pages.dashboard.memory"
                    defaultMessage="Memory"
                  />
                </Text>
                <Text style={{ fontSize: 13, color: getProgressColor(memory) }}>
                  {formatPercentage(memory)}
                </Text>
              </Flex>
              <Progress
                percent={memory ?? 0}
                showInfo={false}
                strokeColor={getProgressColor(memory)}
                size={['100%', 6]}
              />
            </div>
            <div>
              <Flex
                justify="space-between"
                align="center"
                style={{ marginBottom: 4 }}
              >
                <Text style={{ fontSize: 13 }}>
                  <FormattedMessage
                    id="pages.dashboard.disk"
                    defaultMessage="Disk"
                  />
                </Text>
                <Text style={{ fontSize: 13, color: getProgressColor(disk) }}>
                  {formatPercentage(disk)}
                </Text>
              </Flex>
              <Progress
                percent={disk ?? 0}
                showInfo={false}
                strokeColor={getProgressColor(disk)}
                size={['100%', 6]}
              />
            </div>
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

      {/* Section 4: Active Connections + Recent Events */}
      <Col xs={24} lg={12}>
        <Card
          style={cardStyle}
          title={
            <Space>
              <ApiOutlined style={{ color: '#722ed1' }} />
              <FormattedMessage
                id="pages.dashboard.activeConnections"
                defaultMessage="Active Connections"
              />
              <Tag color="purple">{data?.activeConnections.length || 0}</Tag>
            </Space>
          }
        >
          <Table
            dataSource={data?.activeConnections || []}
            columns={connectionColumns}
            rowKey="id"
            pagination={false}
            size="small"
            scroll={{ y: 280 }}
          />
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card
          style={cardStyle}
          title={
            <Space>
              <AlertOutlined style={{ color: '#faad14' }} />
              <FormattedMessage
                id="pages.dashboard.recentEvents"
                defaultMessage="Recent Events"
              />
            </Space>
          }
        >
          <Table
            dataSource={data?.recentEvents || []}
            columns={eventColumns}
            rowKey={(record) =>
              `${record.timestamp}-${record.type}-${record.action}`
            }
            pagination={false}
            size="small"
            scroll={{ y: 280 }}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default Dashboard;
