import {
  UserOutlined,
  DesktopOutlined,
  ApiOutlined,
  FileOutlined,
  ContactsOutlined,
  TeamOutlined,
  SafetyOutlined,
  SolutionOutlined,
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
  Typography,
} from 'antd';
import React, {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

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

const OverviewCard: React.FC<{
  title: React.ReactNode;
  total: number;
  icon: React.ReactNode;
  ringData: { label: string; value: number; color: string }[];
}> = ({ title, total, icon, ringData }) => {
  const ringTotal = ringData.reduce((sum, item) => sum + item.value, 0);
  const ringPercent =
    ringTotal > 0 ? Math.round((ringData[0].value / ringTotal) * 100) : 0;

  return (
    <Card style={cardStyle} variant="borderless">
      <Flex align="center" gap={16}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Flex align="center" gap={8}>
            {icon}
            <Text style={{ fontSize: 15, fontWeight: 500 }}>{title}</Text>
          </Flex>
          <div style={{ marginTop: 4 }}>
            <Space size={8}>
              {ringData.map((item) => (
                <Text key={item.label} style={{ fontSize: 11 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: item.color,
                      marginRight: 4,
                    }}
                  />
                  {item.label}: {item.value}
                </Text>
              ))}
            </Space>
          </div>
        </div>
        <div style={{ flex: '0 0 auto' }}>
          <Progress
            type="circle"
            percent={ringPercent}
            size={72}
            strokeColor={ringData[0].color}
            railColor={ringData[1]?.color || '#f0f0f0'}
            format={() => (
              <span style={{ fontSize: 18, fontWeight: 600 }}>{total}</span>
            )}
          />
        </div>
      </Flex>
    </Card>
  );
};

const CountItem: React.FC<{
  icon: React.ReactNode;
  label: React.ReactNode;
  value: number;
}> = ({ icon, label, value }) => (
  <Flex vertical align="center" gap={4}>
    {icon}
    <Text style={{ fontSize: 12 }}>{label}</Text>
    <Text style={{ fontSize: 18, fontWeight: 600 }}>{value}</Text>
  </Flex>
);

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

  const leftSectionRef = useRef<HTMLDivElement>(null);
  const [leftSectionHeight, setLeftSectionHeight] = useState<
    number | undefined
  >(undefined);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = leftSectionRef.current;
    if (!element) return;
    const updateHeight = () => setLeftSectionHeight(element.offsetHeight);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const formatUptime = useMemo(() => {
    const dayLabel = intl.formatMessage({
      id: 'pages.dashboard.day',
      defaultMessage: 'd',
    });
    const hourLabel = intl.formatMessage({
      id: 'pages.dashboard.hour',
      defaultMessage: 'h',
    });
    const minLabel = intl.formatMessage({
      id: 'pages.dashboard.min',
      defaultMessage: 'm',
    });
    return (seconds: number) => {
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${days}${dayLabel} ${hours}${hourLabel} ${minutes}${minLabel}`;
    };
  }, [intl]);

  const combinedTrendData = useMemo(() => {
    const result: Array<{ date: string; value: number; type: string }> = [];
    const connLabel = intl.formatMessage({
      id: 'pages.dashboard.connectionTrend',
      defaultMessage: 'Connections',
    });
    const userLabel = intl.formatMessage({
      id: 'pages.dashboard.newUsersTrend',
      defaultMessage: 'New Users',
    });
    const alarmLabel = intl.formatMessage({
      id: 'pages.dashboard.alarmTrend',
      defaultMessage: 'Alarms',
    });

    const dateSet = new Set<string>();
    trends?.connectionTrend?.forEach((item) => {
      dateSet.add(item.date);
    });
    trends?.newUserTrend?.forEach((item) => {
      dateSet.add(item.date);
    });
    trends?.alarmTrend?.forEach((item) => {
      dateSet.add(item.date);
    });

    const sortedDates = Array.from(dateSet).sort();

    for (const date of sortedDates) {
      const connItem = trends?.connectionTrend?.find((t) => t.date === date);
      if (connItem) {
        result.push({ date, value: connItem.count, type: connLabel });
      }

      const userItem = trends?.newUserTrend?.find((t) => t.date === date);
      if (userItem) {
        result.push({ date, value: userItem.newUsers, type: userLabel });
      }

      const alarmItem = trends?.alarmTrend?.find((t) => t.date === date);
      if (alarmItem) {
        result.push({ date, value: alarmItem.count, type: alarmLabel });
      }
    }

    return result;
  }, [trends, intl]);

  useEffect(() => {
    const element = chartContainerRef.current;
    if (!element) return;
    const updateSize = () =>
      setChartSize({
        width: element.clientWidth,
        height: element.clientHeight,
      });
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, [combinedTrendData]);

  const cpu = data?.systemStatus?.cpu ?? null;
  const memory = data?.systemStatus?.memory ?? null;
  const disk = data?.systemStatus?.disk ?? null;
  const uptime = data?.systemStatus?.uptime ?? null;

  return (
    <Row gutter={[16, 16]}>
      {/* Section 1: 4 Overview Cards with Ring Charts */}
      <Col span={24}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <OverviewCard
              title={
                <FormattedMessage
                  id="pages.dashboard.totalUsers"
                  defaultMessage="Total Users"
                />
              }
              total={data?.users.total || 0}
              icon={<UserOutlined style={{ color: '#1890ff' }} />}
              ringData={[
                {
                  label: intl.formatMessage({
                    id: 'pages.dashboard.adminUsers',
                    defaultMessage: 'Admin',
                  }),
                  value: data?.users.admin || 0,
                  color: '#1890ff',
                },
                {
                  label: intl.formatMessage({
                    id: 'pages.dashboard.normalUsers',
                    defaultMessage: 'Normal',
                  }),
                  value: data?.users.normal || 0,
                  color: '#91d5ff',
                },
              ]}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <OverviewCard
              title={
                <FormattedMessage
                  id="pages.dashboard.totalDevices"
                  defaultMessage="Total Devices"
                />
              }
              total={data?.devices.total || 0}
              icon={<DesktopOutlined style={{ color: '#52c41a' }} />}
              ringData={[
                {
                  label: intl.formatMessage({
                    id: 'pages.dashboard.onlineDevices',
                    defaultMessage: 'Online',
                  }),
                  value: data?.devices.online || 0,
                  color: '#52c41a',
                },
                {
                  label: intl.formatMessage({
                    id: 'pages.dashboard.offlineDevices',
                    defaultMessage: 'Offline',
                  }),
                  value: data?.devices.offline || 0,
                  color: '#d9f7be',
                },
              ]}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <OverviewCard
              title={
                <FormattedMessage
                  id="pages.dashboard.todayConnections"
                  defaultMessage="Today Connections"
                />
              }
              total={data?.connections.today || 0}
              icon={<ApiOutlined style={{ color: '#722ed1' }} />}
              ringData={[
                {
                  label: intl.formatMessage({
                    id: 'pages.dashboard.successCount',
                    defaultMessage: 'Success',
                  }),
                  value: data?.connections.successCount || 0,
                  color: '#722ed1',
                },
                {
                  label: intl.formatMessage({
                    id: 'pages.dashboard.failureCount',
                    defaultMessage: 'Failed',
                  }),
                  value: data?.connections.failureCount || 0,
                  color: '#efdbff',
                },
              ]}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <OverviewCard
              title={
                <FormattedMessage
                  id="pages.dashboard.todayTransfers"
                  defaultMessage="Today Transfers"
                />
              }
              total={data?.files.transferredToday || 0}
              icon={<FileOutlined style={{ color: '#13c2c2' }} />}
              ringData={[
                {
                  label: intl.formatMessage({
                    id: 'pages.dashboard.uploadCount',
                    defaultMessage: 'Upload',
                  }),
                  value: data?.files.uploadToday || 0,
                  color: '#13c2c2',
                },
                {
                  label: intl.formatMessage({
                    id: 'pages.dashboard.downloadCount',
                    defaultMessage: 'Download',
                  }),
                  value: data?.files.downloadToday || 0,
                  color: '#cff6f6',
                },
              ]}
            />
          </Col>
        </Row>
      </Col>

      {/* Section 2: Left (Counts + System Status) | Right (Trend Chart) */}
      <Col xs={24} lg={6}>
        <div ref={leftSectionRef}>
          <Flex vertical gap={16}>
            <Card
              size="small"
              title={
                <FormattedMessage
                  id="pages.dashboard.resourceCounts"
                  defaultMessage="Resource Counts"
                />
              }
            >
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <CountItem
                    icon={<ContactsOutlined style={{ color: '#1890ff' }} />}
                    label={
                      <FormattedMessage
                        id="pages.dashboard.addressBooks"
                        defaultMessage="Address Books"
                      />
                    }
                    value={data?.counts.addressBooks || 0}
                  />
                </Col>
                <Col span={12}>
                  <CountItem
                    icon={<TeamOutlined style={{ color: '#52c41a' }} />}
                    label={
                      <FormattedMessage
                        id="pages.dashboard.groups"
                        defaultMessage="Groups"
                      />
                    }
                    value={data?.counts.groups || 0}
                  />
                </Col>
                <Col span={12}>
                  <CountItem
                    icon={<SafetyOutlined style={{ color: '#722ed1' }} />}
                    label={
                      <FormattedMessage
                        id="pages.dashboard.roles"
                        defaultMessage="Roles"
                      />
                    }
                    value={data?.counts.roles || 0}
                  />
                </Col>
                <Col span={12}>
                  <CountItem
                    icon={<SolutionOutlined style={{ color: '#13c2c2' }} />}
                    label={
                      <FormattedMessage
                        id="pages.dashboard.strategies"
                        defaultMessage="Strategies"
                      />
                    }
                    value={data?.counts.strategies || 0}
                  />
                </Col>
              </Row>
            </Card>
            <Card
              size="small"
              title={
                <FormattedMessage
                  id="pages.dashboard.systemStatus"
                  defaultMessage="System Status"
                />
              }
            >
              <Space orientation="vertical" style={{ width: '100%' }} size={12}>
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
          </Flex>
        </div>
      </Col>
      <Col xs={24} lg={18} style={{ display: 'flex' }}>
        <Card
          style={{
            height:
              leftSectionHeight !== undefined ? leftSectionHeight : '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
          styles={{
            body: {
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
            },
          }}
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
            <div ref={chartContainerRef} style={{ flex: 1, minHeight: 0 }}>
              {chartSize.height > 0 && (
                <Line
                  data={combinedTrendData}
                  width={chartSize.width}
                  height={chartSize.height}
                  xField="date"
                  yField="value"
                  colorField="type"
                  shapeField="smooth"
                  legend={{ position: 'top-right' }}
                  axis={{ y: { title: false }, x: { title: false } }}
                />
              )}
            </div>
          ) : (
            <Flex
              justify="center"
              align="center"
              style={{ flex: 1, minHeight: 0 }}
            >
              <Empty
                description={
                  <FormattedMessage
                    id="pages.dashboard.noData"
                    defaultMessage="No data"
                  />
                }
              />
            </Flex>
          )}
        </Card>
      </Col>
    </Row>
  );
};

export default Dashboard;
