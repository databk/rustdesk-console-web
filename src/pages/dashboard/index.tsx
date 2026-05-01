import {
  UserOutlined,
  DesktopOutlined,
  ApiOutlined,
  AlertOutlined,
  FileOutlined,
  SyncOutlined,
  ArrowUpOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { PageContainer, StatisticCard } from '@ant-design/pro-components';
import { Area, Column } from '@ant-design/plots';
import { useIntl, FormattedMessage } from '@umijs/max';
import {
  Card,
  Col,
  Row,
  Spin,
  Statistic,
  Progress,
  Tag,
  Table,
  Select,
  Space,
  Tabs,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useEffect, useMemo, useState } from 'react';
import {
  getDashboardOverview,
  getDashboardStatistics,
  getDashboardTrends,
  getDashboardRealtime,
} from '@/services/rustdesk-console/dashboard';

const { Text } = Typography;

const Dashboard: React.FC = () => {
  const intl = useIntl();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<API.DashboardOverview>();
  const [statistics, setStatistics] = useState<API.DashboardStatistics>();
  const [trends, setTrends] = useState<API.DashboardTrends>();
  const [realtime, setRealtime] = useState<API.DashboardRealtime>();
  const [trendRange, setTrendRange] = useState<'7d' | '30d' | '90d'>('7d');

  useEffect(() => {
    fetchAllData();
    const realtimeInterval = setInterval(fetchRealtimeData, 10000);
    const overviewInterval = setInterval(fetchOverviewData, 180000);
    const statisticsInterval = setInterval(fetchStatisticsData, 480000);
    return () => {
      clearInterval(realtimeInterval);
      clearInterval(overviewInterval);
      clearInterval(statisticsInterval);
    };
  }, []);

  useEffect(() => {
    fetchTrendData();
  }, [trendRange]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [overviewData, statisticsData, realtimeData] = await Promise.all([
        getDashboardOverview(),
        getDashboardStatistics(),
        getDashboardRealtime(),
      ]);
      setOverview(overviewData);
      setStatistics(statisticsData);
      setRealtime(realtimeData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendData = async () => {
    try {
      const trendData = await getDashboardTrends({ range: trendRange });
      setTrends(trendData);
    } catch (error) {
      console.error('Failed to fetch trend data:', error);
    }
  };

  const fetchRealtimeData = async () => {
    try {
      const realtimeData = await getDashboardRealtime();
      setRealtime(realtimeData);
    } catch (error) {
      console.error('Failed to fetch realtime data:', error);
    }
  };

  const fetchOverviewData = async () => {
    try {
      const overviewData = await getDashboardOverview();
      setOverview(overviewData);
    } catch (error) {
      console.error('Failed to fetch overview data:', error);
    }
  };

  const fetchStatisticsData = async () => {
    try {
      const statisticsData = await getDashboardStatistics();
      setStatistics(statisticsData);
    } catch (error) {
      console.error('Failed to fetch statistics data:', error);
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getEventStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'failed':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'default';
    }
  };

  const onlineRate = overview
    ? overview.devices.total > 0
      ? Math.round((overview.devices.online / overview.devices.total) * 100)
      : 0
    : 0;

  // Prepare chart data for connection trend
  const connectionChartData = useMemo(() => {
    if (!trends?.connectionTrend) return [];
    return trends.connectionTrend.map((item) => [
      { date: item.date, value: item.count, type: intl.formatMessage({ id: 'pages.dashboard.connectionCount', defaultMessage: 'Count' }) },
      { date: item.date, value: item.avgDuration, type: intl.formatMessage({ id: 'pages.dashboard.avgDuration', defaultMessage: 'Avg Duration' }) },
    ]).flat();
  }, [trends?.connectionTrend, intl]);

  // Prepare chart data for user active trend
  const userActiveChartData = useMemo(() => {
    if (!trends?.userActiveTrend) return [];
    return trends.userActiveTrend.map((item) => [
      { date: item.date, value: item.newUsers, type: intl.formatMessage({ id: 'pages.dashboard.newUsers', defaultMessage: 'New Users' }) },
      { date: item.date, value: item.activeUsers, type: intl.formatMessage({ id: 'pages.dashboard.activeUsers', defaultMessage: 'Active Users' }) },
    ]).flat();
  }, [trends?.userActiveTrend, intl]);

  // Prepare chart data for alarm trend
  const alarmChartData = useMemo(() => {
    if (!trends?.alarmTrend) return [];
    return trends.alarmTrend.map((item) => [
      { date: item.date, value: item.critical, type: 'Critical' },
      { date: item.date, value: item.warning, type: 'Warning' },
      { date: item.date, value: item.info, type: 'Info' },
    ]).flat();
  }, [trends?.alarmTrend]);

  const connectionColumns: ColumnsType<API.DashboardRealtime['activeConnections'][0]> = [
    {
      title: <FormattedMessage id="pages.dashboard.user" defaultMessage="User" />,
      dataIndex: 'userName',
      key: 'userName',
    },
    {
      title: <FormattedMessage id="pages.dashboard.device" defaultMessage="Device" />,
      dataIndex: 'deviceName',
      key: 'deviceName',
    },
    {
      title: <FormattedMessage id="pages.dashboard.duration" defaultMessage="Duration" />,
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => `${duration} min`,
    },
    {
      title: <FormattedMessage id="pages.dashboard.startTime" defaultMessage="Start Time" />,
      dataIndex: 'startTime',
      key: 'startTime',
      render: (time: string) => new Date(time).toLocaleString(),
    },
  ];

  const eventColumns: ColumnsType<API.DashboardRealtime['recentEvents'][0]> = [
    {
      title: <FormattedMessage id="pages.dashboard.eventType" defaultMessage="Type" />,
      dataIndex: 'type',
      key: 'type',
      width: 90,
      render: (type: string) => (
        <Tag color={type === 'connection' ? 'blue' : type === 'file' ? 'green' : 'orange'}>
          {type}
        </Tag>
      ),
    },
    {
      title: <FormattedMessage id="pages.dashboard.action" defaultMessage="Action" />,
      dataIndex: 'action',
      key: 'action',
    },
    {
      title: <FormattedMessage id="pages.dashboard.user" defaultMessage="User" />,
      dataIndex: 'user',
      key: 'user',
    },
    {
      title: <FormattedMessage id="pages.dashboard.target" defaultMessage="Target" />,
      dataIndex: 'target',
      key: 'target',
    },
    {
      title: <FormattedMessage id="pages.dashboard.status" defaultMessage="Status" />,
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => <Tag color={getEventStatusColor(status)}>{status}</Tag>,
    },
    {
      title: <FormattedMessage id="pages.dashboard.time" defaultMessage="Time" />,
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (time: string) => new Date(time).toLocaleString(),
    },
  ];

  if (loading) {
    return (
      <PageContainer>
        <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Row 1: 4 unified overview StatisticCards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            statistic={{
              title: (
                <FormattedMessage id="pages.dashboard.totalUsers" defaultMessage="Total Users" />
              ),
              value: overview?.users.total || 0,
              icon: <UserOutlined style={{ color: '#1890ff' }} />,
              description: (
                <Space direction="vertical" size={0}>
                  <Statistic
                    title={
                      <FormattedMessage
                        id="pages.dashboard.activeUsers"
                        defaultMessage="Active Users"
                      />
                    }
                    value={overview?.users.active || 0}
                    valueStyle={{ fontSize: 14, color: '#52c41a' }}
                  />
                  <Statistic
                    title={
                      <FormattedMessage id="pages.dashboard.newToday" defaultMessage="New Today" />
                    }
                    value={overview?.users.newToday || 0}
                    valueStyle={{ fontSize: 14 }}
                    prefix={
                      (overview?.users.newToday || 0) > 0 ? (
                        <ArrowUpOutlined style={{ color: '#52c41a' }} />
                      ) : undefined
                    }
                  />
                </Space>
              ),
            }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            statistic={{
              title: (
                <FormattedMessage
                  id="pages.dashboard.totalDevices"
                  defaultMessage="Total Devices"
                />
              ),
              value: overview?.devices.total || 0,
              icon: <DesktopOutlined style={{ color: '#52c41a' }} />,
              description: (
                <Space direction="vertical" size={0}>
                  <Statistic
                    title={
                      <FormattedMessage
                        id="pages.dashboard.onlineDevices"
                        defaultMessage="Online Devices"
                      />
                    }
                    value={overview?.devices.online || 0}
                    valueStyle={{ fontSize: 14, color: '#52c41a' }}
                  />
                  <Statistic
                    title={
                      <FormattedMessage
                        id="pages.dashboard.deviceGroups"
                        defaultMessage="Groups"
                      />
                    }
                    value={overview?.devices.groups || 0}
                    valueStyle={{ fontSize: 14 }}
                  />
                </Space>
              ),
            }}
            chart={
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 4 }}>
                <Progress
                  type="circle"
                  percent={onlineRate}
                  size={52}
                  strokeColor={{
                    '0%': '#52c41a',
                    '100%': '#73d13d',
                  }}
                  format={(percent) => (
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{percent}%</span>
                  )}
                />
              </div>
            }
            chartPlacement="left"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            statistic={{
              title: (
                <FormattedMessage
                  id="pages.dashboard.todayConnections"
                  defaultMessage="Today Connections"
                />
              ),
              value: overview?.connections.today || 0,
              icon: <ApiOutlined style={{ color: '#722ed1' }} />,
              description: (
                <Space direction="vertical" size={0}>
                  <Statistic
                    title={
                      <FormattedMessage
                        id="pages.dashboard.activeConnections"
                        defaultMessage="Active Connections"
                      />
                    }
                    value={overview?.connections.active || 0}
                    valueStyle={{ fontSize: 14, color: '#722ed1' }}
                  />
                  <Statistic
                    title={
                      <FormattedMessage
                        id="pages.dashboard.avgDuration"
                        defaultMessage="Avg Duration"
                      />
                    }
                    value={overview?.connections.avgDuration || 0}
                    suffix={
                      <FormattedMessage id="pages.dashboard.min" defaultMessage="min" />
                    }
                    valueStyle={{ fontSize: 14 }}
                  />
                </Space>
              ),
            }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            statistic={{
              title: (
                <FormattedMessage
                  id="pages.dashboard.totalAlarms"
                  defaultMessage="Total Alarms"
                />
              ),
              value: overview?.audits.alarms || 0,
              icon: <AlertOutlined style={{ color: '#faad14' }} />,
              description: (
                <Space direction="vertical" size={0}>
                  <Statistic
                    title={
                      <FormattedMessage
                        id="pages.dashboard.criticalAlarms"
                        defaultMessage="Critical"
                      />
                    }
                    value={overview?.audits.criticalAlarms || 0}
                    valueStyle={{ fontSize: 14, color: '#f5222d' }}
                  />
                  <Statistic
                    title={
                      <FormattedMessage
                        id="pages.dashboard.unreadAlarms"
                        defaultMessage="Unread"
                      />
                    }
                    value={overview?.audits.unreadAlarms || 0}
                    valueStyle={{ fontSize: 14, color: '#faad14' }}
                  />
                </Space>
              ),
            }}
          />
        </Col>
      </Row>

      {/* Row 2: User Distribution + Device Distribution */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <TeamOutlined style={{ color: '#1890ff' }} />
                <FormattedMessage
                  id="pages.dashboard.userDistribution"
                  defaultMessage="User Distribution"
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
                      id="pages.dashboard.adminUsers"
                      defaultMessage="Admin Users"
                    />
                  }
                  value={statistics?.userDistribution.byRole.admin || 0}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={
                    <FormattedMessage
                      id="pages.dashboard.normalUsers"
                      defaultMessage="Normal Users"
                    />
                  }
                  value={statistics?.userDistribution.byRole.user || 0}
                />
              </Col>
            </Row>
            <div style={{ marginTop: 16 }}>
              <Row gutter={[8, 8]}>
                <Col span={12}>
                  <Progress
                    percent={
                      statistics
                        ? Math.round(
                            (statistics.userDistribution.byStatus.active /
                              (statistics.userDistribution.byStatus.active +
                                statistics.userDistribution.byStatus.inactive +
                                statistics.userDistribution.byStatus.disabled +
                                statistics.userDistribution.byStatus.unverified)) *
                              100,
                          )
                        : 0
                    }
                    status="active"
                    strokeColor="#52c41a"
                    format={() =>
                      `${intl.formatMessage({ id: 'pages.dashboard.activeUsers', defaultMessage: 'Active' })}: ${statistics?.userDistribution.byStatus.active || 0}`
                    }
                  />
                </Col>
                <Col span={12}>
                  <Progress
                    percent={
                      statistics
                        ? Math.round(
                            (statistics.userDistribution.byStatus.inactive /
                              (statistics.userDistribution.byStatus.active +
                                statistics.userDistribution.byStatus.inactive +
                                statistics.userDistribution.byStatus.disabled +
                                statistics.userDistribution.byStatus.unverified)) *
                              100,
                          )
                        : 0
                    }
                    strokeColor="#faad14"
                    format={() =>
                      `${intl.formatMessage({ id: 'pages.dashboard.inactive', defaultMessage: 'Inactive' })}: ${statistics?.userDistribution.byStatus.inactive || 0}`
                    }
                  />
                </Col>
              </Row>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <DesktopOutlined style={{ color: '#52c41a' }} />
                <FormattedMessage
                  id="pages.dashboard.deviceDistribution"
                  defaultMessage="Device Distribution"
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
                      id="pages.dashboard.onlineDevices"
                      defaultMessage="Online Devices"
                    />
                  }
                  value={statistics?.deviceDistribution.byStatus.online || 0}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={
                    <FormattedMessage
                      id="pages.dashboard.offlineDevices"
                      defaultMessage="Offline Devices"
                    />
                  }
                  value={statistics?.deviceDistribution.byStatus.offline || 0}
                />
              </Col>
            </Row>
            <div style={{ marginTop: 16 }}>
              <Progress
                percent={
                  statistics
                    ? Math.round(
                        (statistics.deviceDistribution.byStatus.online /
                          (statistics.deviceDistribution.byStatus.online +
                            statistics.deviceDistribution.byStatus.offline)) *
                          100,
                      )
                    : 0
                }
                status="active"
                strokeColor="#52c41a"
                format={(percent) =>
                  `${intl.formatMessage({ id: 'pages.dashboard.onlineRate', defaultMessage: 'Online Rate' })}: ${percent}%`
                }
              />
            </div>
            {statistics?.deviceDistribution.byGroup &&
              statistics.deviceDistribution.byGroup.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <Table
                    dataSource={statistics.deviceDistribution.byGroup}
                    rowKey="groupId"
                    size="small"
                    pagination={false}
                    columns={[
                      {
                        title: (
                          <FormattedMessage
                            id="pages.dashboard.groupName"
                            defaultMessage="Group Name"
                          />
                        ),
                        dataIndex: 'groupName',
                        key: 'groupName',
                      },
                      {
                        title: (
                          <FormattedMessage
                            id="pages.dashboard.deviceCount"
                            defaultMessage="Device Count"
                          />
                        ),
                        dataIndex: 'count',
                        key: 'count',
                        render: (count: number) => (
                          <Tag color="blue">{count}</Tag>
                        ),
                      },
                    ]}
                  />
                </div>
              )}
          </Card>
        </Col>
      </Row>

      {/* Row 3: Connection Analysis + File Transfer */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <ApiOutlined style={{ color: '#722ed1' }} />
                <FormattedMessage
                  id="pages.dashboard.connectionAnalysis"
                  defaultMessage="Connection Analysis"
                />
              </Space>
            }
            size="small"
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title={
                    <FormattedMessage
                      id="pages.dashboard.successRate"
                      defaultMessage="Success Rate"
                    />
                  }
                  value={statistics?.connectionAnalysis.successRate || 0}
                  suffix="%"
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={
                    <FormattedMessage
                      id="pages.dashboard.failureCount"
                      defaultMessage="Failure Count"
                    />
                  }
                  value={statistics?.connectionAnalysis.failureCount || 0}
                  valueStyle={{ color: '#f5222d' }}
                  prefix={<CloseCircleOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={
                    <FormattedMessage
                      id="pages.dashboard.avgDuration"
                      defaultMessage="Avg Duration"
                    />
                  }
                  value={statistics?.connectionAnalysis.avgDuration || 0}
                  suffix={
                    <Text type="secondary" style={{ fontSize: 14 }}>
                      <FormattedMessage id="pages.dashboard.min" defaultMessage="min" />
                    </Text>
                  }
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={
                    <FormattedMessage
                      id="pages.dashboard.totalDuration"
                      defaultMessage="Total Duration"
                    />
                  }
                  value={statistics?.connectionAnalysis.totalDuration || 0}
                  suffix={
                    <Text type="secondary" style={{ fontSize: 14 }}>
                      <FormattedMessage id="pages.dashboard.min" defaultMessage="min" />
                    </Text>
                  }
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
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
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title={
                    <FormattedMessage
                      id="pages.dashboard.transferredToday"
                      defaultMessage="Transferred Today"
                    />
                  }
                  value={overview?.files.transferred || 0}
                  prefix={<FileOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={
                    <FormattedMessage
                      id="pages.dashboard.totalSize"
                      defaultMessage="Total Size"
                    />
                  }
                  value={overview?.files.totalSize || '0 B'}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={
                    <FormattedMessage
                      id="pages.dashboard.uploadCount"
                      defaultMessage="Upload Count"
                    />
                  }
                  value={statistics?.fileTransfer.uploadCount || 0}
                  prefix={<CloudUploadOutlined style={{ color: '#1890ff' }} />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={
                    <FormattedMessage
                      id="pages.dashboard.downloadCount"
                      defaultMessage="Download Count"
                    />
                  }
                  value={statistics?.fileTransfer.downloadCount || 0}
                  prefix={<CloudDownloadOutlined style={{ color: '#52c41a' }} />}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Row 4: System Status (1/3) + Trend Data (2/3) */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <SyncOutlined spin style={{ color: '#1890ff' }} />
                <FormattedMessage
                  id="pages.dashboard.systemStatus"
                  defaultMessage="System Status"
                />
              </Space>
            }
            size="small"
          >
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Progress
                    type="circle"
                    percent={realtime?.systemStatus.cpu || 0}
                    size={64}
                    format={(percent) => (
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{percent}%</span>
                    )}
                    strokeColor={
                      (realtime?.systemStatus.cpu || 0) > 80
                        ? '#f5222d'
                        : (realtime?.systemStatus.cpu || 0) > 60
                          ? '#faad14'
                          : '#52c41a'
                    }
                  />
                  <div style={{ marginTop: 4, fontSize: 12, color: '#8c8c8c' }}>
                    <FormattedMessage id="pages.dashboard.cpu" defaultMessage="CPU" />
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Progress
                    type="circle"
                    percent={realtime?.systemStatus.memory || 0}
                    size={64}
                    format={(percent) => (
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{percent}%</span>
                    )}
                    strokeColor={
                      (realtime?.systemStatus.memory || 0) > 80
                        ? '#f5222d'
                        : (realtime?.systemStatus.memory || 0) > 60
                          ? '#faad14'
                          : '#52c41a'
                    }
                  />
                  <div style={{ marginTop: 4, fontSize: 12, color: '#8c8c8c' }}>
                    <FormattedMessage id="pages.dashboard.memory" defaultMessage="Memory" />
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Progress
                    type="circle"
                    percent={realtime?.systemStatus.disk || 0}
                    size={64}
                    format={(percent) => (
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{percent}%</span>
                    )}
                    strokeColor={
                      (realtime?.systemStatus.disk || 0) > 80
                        ? '#f5222d'
                        : (realtime?.systemStatus.disk || 0) > 60
                          ? '#faad14'
                          : '#52c41a'
                    }
                  />
                  <div style={{ marginTop: 4, fontSize: 12, color: '#8c8c8c' }}>
                    <FormattedMessage id="pages.dashboard.disk" defaultMessage="Disk" />
                  </div>
                </div>
              </Col>
            </Row>
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Text type="secondary">
                <FormattedMessage id="pages.dashboard.uptime" defaultMessage="Uptime" />:{' '}
                {formatUptime(realtime?.systemStatus.uptime || 0)}
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <FormattedMessage id="pages.dashboard.trendData" defaultMessage="Trend Data" />
                <Select
                  value={trendRange}
                  onChange={setTrendRange}
                  size="small"
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
                  style={{ width: 120 }}
                />
              </Space>
            }
            size="small"
          >
            <Tabs
              defaultActiveKey="connection"
              items={[
                {
                  key: 'connection',
                  label: (
                    <Space size={4}>
                      <ApiOutlined />
                      <FormattedMessage
                        id="pages.dashboard.connectionTrend"
                        defaultMessage="Connection Trend"
                      />
                    </Space>
                  ),
                  children: connectionChartData.length > 0 ? (
                    <Area
                      data={connectionChartData}
                      xField="date"
                      yField="value"
                      colorField="type"
                      smooth
                      height={200}
                      legend={{ position: 'top-right' }}
                      axis={{
                        y: { title: false },
                        x: { title: false },
                      }}
                    />
                  ) : (
                    <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Text type="secondary">
                        <FormattedMessage id="pages.dashboard.noData" defaultMessage="No data" />
                      </Text>
                    </div>
                  ),
                },
                {
                  key: 'user',
                  label: (
                    <Space size={4}>
                      <UserOutlined />
                      <FormattedMessage
                        id="pages.dashboard.userActiveTrend"
                        defaultMessage="User Active Trend"
                      />
                    </Space>
                  ),
                  children: userActiveChartData.length > 0 ? (
                    <Column
                      data={userActiveChartData}
                      xField="date"
                      yField="value"
                      colorField="type"
                      group
                      height={200}
                      legend={{ position: 'top-right' }}
                      axis={{
                        y: { title: false },
                        x: { title: false },
                      }}
                    />
                  ) : (
                    <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Text type="secondary">
                        <FormattedMessage id="pages.dashboard.noData" defaultMessage="No data" />
                      </Text>
                    </div>
                  ),
                },
                {
                  key: 'alarm',
                  label: (
                    <Space size={4}>
                      <AlertOutlined />
                      <FormattedMessage
                        id="pages.dashboard.alarmTrend"
                        defaultMessage="Alarm Trend"
                      />
                    </Space>
                  ),
                  children: alarmChartData.length > 0 ? (
                    <Column
                      data={alarmChartData}
                      xField="date"
                      yField="value"
                      colorField="type"
                      group
                      height={200}
                      color={['#f5222d', '#faad14', '#1890ff']}
                      legend={{ position: 'top-right' }}
                      axis={{
                        y: { title: false },
                        x: { title: false },
                      }}
                    />
                  ) : (
                    <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Text type="secondary">
                        <FormattedMessage id="pages.dashboard.noData" defaultMessage="No data" />
                      </Text>
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      {/* Row 5: Active Connections + Recent Events side by side */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <ApiOutlined style={{ color: '#722ed1' }} />
                <FormattedMessage
                  id="pages.dashboard.activeConnections"
                  defaultMessage="Active Connections"
                />
                <Tag color="purple">{realtime?.activeConnections.length || 0}</Tag>
              </Space>
            }
            size="small"
          >
            <Table
              dataSource={realtime?.activeConnections || []}
              columns={connectionColumns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <AlertOutlined style={{ color: '#faad14' }} />
                <FormattedMessage
                  id="pages.dashboard.recentEvents"
                  defaultMessage="Recent Events"
                />
              </Space>
            }
            size="small"
          >
            <Table
              dataSource={realtime?.recentEvents || []}
              columns={eventColumns}
              rowKey={(record) => `${record.timestamp}-${record.type}-${record.action}`}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default Dashboard;
