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
  Divider,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { CSSProperties, useEffect, useMemo, useState } from 'react';
import {
  getDashboardOverview,
  getDashboardStatistics,
  getDashboardTrends,
  getDashboardRealtime,
} from '@/services/rustdesk-console/dashboard';

const { Text } = Typography;

const sectionStyle: CSSProperties = {
  padding: '12px 0',
};

const sectionTitleStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: '#8c8c8c',
  marginBottom: 8,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

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

  const connectionChartData = useMemo(() => {
    if (!trends?.connectionTrend) return [];
    return trends.connectionTrend
      .map((item) => [
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
      ])
      .flat();
  }, [trends?.connectionTrend, intl]);

  const userActiveChartData = useMemo(() => {
    if (!trends?.userActiveTrend) return [];
    return trends.userActiveTrend
      .map((item) => [
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
      ])
      .flat();
  }, [trends?.userActiveTrend, intl]);

  const alarmChartData = useMemo(() => {
    if (!trends?.alarmTrend) return [];
    return trends.alarmTrend
      .map((item) => [
        { date: item.date, value: item.critical, type: 'Critical' },
        { date: item.date, value: item.warning, type: 'Warning' },
        { date: item.date, value: item.info, type: 'Info' },
      ])
      .flat();
  }, [trends?.alarmTrend]);

  const connectionColumns: ColumnsType<
    API.DashboardRealtime['activeConnections'][0]
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

  const eventColumns: ColumnsType<
    API.DashboardRealtime['recentEvents'][0]
  > = [
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
            type === 'connection' ? 'blue' : type === 'file' ? 'green' : 'orange'
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
        <FormattedMessage
          id="pages.dashboard.target"
          defaultMessage="Target"
        />
      ),
      dataIndex: 'target',
      key: 'target',
      ellipsis: true,
    },
    {
      title: (
        <FormattedMessage
          id="pages.dashboard.status"
          defaultMessage="Status"
        />
      ),
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={getEventStatusColor(status)}>{status}</Tag>
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

  if (loading) {
    return (
      <PageContainer>
        <Spin
          size="large"
          style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }}
        />
      </PageContainer>
    );
  }

  const getProgressColor = (value: number) =>
    value > 80 ? '#f5222d' : value > 60 ? '#faad14' : '#52c41a';

  return (
    <PageContainer>
      {/* Row 1: 4 overview StatisticCards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            statistic={{
              title: (
                <FormattedMessage
                  id="pages.dashboard.totalUsers"
                  defaultMessage="Total Users"
                />
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
                      <FormattedMessage
                        id="pages.dashboard.newToday"
                        defaultMessage="New Today"
                      />
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
                      <FormattedMessage
                        id="pages.dashboard.min"
                        defaultMessage="min"
                      />
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

      {/* Row 2: Statistics Detail - 4 sections in one card with 2x2 grid */}
      <Card
        style={{ marginTop: 16 }}
        size="small"
        styles={{ body: { padding: '4px 16px' } }}
      >
        <Row gutter={[24, 0]}>
          {/* User Distribution */}
          <Col span={12}>
            <div style={sectionStyle}>
              <div style={sectionTitleStyle}>
                <TeamOutlined style={{ color: '#1890ff', marginRight: 6 }} />
                <FormattedMessage
                  id="pages.dashboard.userDistribution"
                  defaultMessage="User Distribution"
                />
              </div>
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
                    valueStyle={{ color: '#1890ff', fontSize: 20 }}
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
                    valueStyle={{ fontSize: 20 }}
                  />
                </Col>
              </Row>
              <Row gutter={[8, 4]} style={{ marginTop: 8 }}>
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
                    size="small"
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
                    size="small"
                    strokeColor="#faad14"
                    format={() =>
                      `${intl.formatMessage({ id: 'pages.dashboard.inactive', defaultMessage: 'Inactive' })}: ${statistics?.userDistribution.byStatus.inactive || 0}`
                    }
                  />
                </Col>
              </Row>
            </div>
          </Col>

          {/* Device Distribution */}
          <Col span={12}>
            <div style={sectionStyle}>
              <div style={sectionTitleStyle}>
                <DesktopOutlined style={{ color: '#52c41a', marginRight: 6 }} />
                <FormattedMessage
                  id="pages.dashboard.deviceDistribution"
                  defaultMessage="Device Distribution"
                />
              </div>
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic
                    title={
                      <FormattedMessage
                        id="pages.dashboard.onlineDevices"
                        defaultMessage="Online"
                      />
                    }
                    value={statistics?.deviceDistribution.byStatus.online || 0}
                    valueStyle={{ color: '#52c41a', fontSize: 20 }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title={
                      <FormattedMessage
                        id="pages.dashboard.offlineDevices"
                        defaultMessage="Offline"
                      />
                    }
                    value={statistics?.deviceDistribution.byStatus.offline || 0}
                    valueStyle={{ fontSize: 20 }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title={
                      <FormattedMessage
                        id="pages.dashboard.onlineRate"
                        defaultMessage="Online Rate"
                      />
                    }
                    value={
                      statistics
                        ? Math.round(
                            (statistics.deviceDistribution.byStatus.online /
                              (statistics.deviceDistribution.byStatus.online +
                                statistics.deviceDistribution.byStatus.offline)) *
                              100,
                          )
                        : 0
                    }
                    suffix="%"
                    valueStyle={{ color: '#52c41a', fontSize: 20 }}
                  />
                </Col>
              </Row>
              {statistics?.deviceDistribution.byGroup &&
                statistics.deviceDistribution.byGroup.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <Space size={[4, 4]} wrap>
                      {statistics.deviceDistribution.byGroup.map((group) => (
                        <Tag
                          key={group.groupId}
                          style={{ margin: 0 }}
                        >
                          {group.groupName}: <Text strong>{group.count}</Text>
                        </Tag>
                      ))}
                    </Space>
                  </div>
                )}
            </div>
          </Col>
        </Row>

        <Divider style={{ margin: '4px 0' }} />

        <Row gutter={[24, 0]}>
          {/* Connection Analysis */}
          <Col span={12}>
            <div style={sectionStyle}>
              <div style={sectionTitleStyle}>
                <ApiOutlined style={{ color: '#722ed1', marginRight: 6 }} />
                <FormattedMessage
                  id="pages.dashboard.connectionAnalysis"
                  defaultMessage="Connection Analysis"
                />
              </div>
              <Row gutter={16}>
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
                    valueStyle={{ color: '#52c41a', fontSize: 20 }}
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
                    valueStyle={{ color: '#f5222d', fontSize: 20 }}
                    prefix={<CloseCircleOutlined />}
                  />
                </Col>
              </Row>
              <Row gutter={16} style={{ marginTop: 4 }}>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <FormattedMessage
                      id="pages.dashboard.avgDuration"
                      defaultMessage="Avg Duration"
                    />
                    : {statistics?.connectionAnalysis.avgDuration || 0}{' '}
                    <FormattedMessage
                      id="pages.dashboard.min"
                      defaultMessage="min"
                    />
                  </Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <FormattedMessage
                      id="pages.dashboard.totalDuration"
                      defaultMessage="Total Duration"
                    />
                    : {statistics?.connectionAnalysis.totalDuration || 0}{' '}
                    <FormattedMessage
                      id="pages.dashboard.min"
                      defaultMessage="min"
                    />
                  </Text>
                </Col>
              </Row>
            </div>
          </Col>

          {/* File Transfer */}
          <Col span={12}>
            <div style={sectionStyle}>
              <div style={sectionTitleStyle}>
                <FileOutlined style={{ color: '#13c2c2', marginRight: 6 }} />
                <FormattedMessage
                  id="pages.dashboard.fileTransfer"
                  defaultMessage="File Transfer"
                />
              </div>
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title={
                      <FormattedMessage
                        id="pages.dashboard.uploadCount"
                        defaultMessage="Upload"
                      />
                    }
                    value={statistics?.fileTransfer.uploadCount || 0}
                    valueStyle={{ fontSize: 20 }}
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
                    value={statistics?.fileTransfer.downloadCount || 0}
                    valueStyle={{ fontSize: 20 }}
                    prefix={
                      <CloudDownloadOutlined style={{ color: '#52c41a' }} />
                    }
                  />
                </Col>
              </Row>
              <Row gutter={16} style={{ marginTop: 4 }}>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <FormattedMessage
                      id="pages.dashboard.transferredToday"
                      defaultMessage="Today"
                    />
                    : {overview?.files.transferred || 0}
                  </Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <FormattedMessage
                      id="pages.dashboard.totalSize"
                      defaultMessage="Total Size"
                    />
                    : {overview?.files.totalSize || '0 B'}
                  </Text>
                </Col>
              </Row>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Row 3: Trend Data with System Status */}
      <Card
        style={{ marginTop: 16 }}
        size="small"
        title={
          <Space>
            <FormattedMessage
              id="pages.dashboard.trendData"
              defaultMessage="Trend Data"
            />
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
              style={{ width: 100 }}
            />
          </Space>
        }
        extra={
          <Space size={12}>
            <Tooltip title={`CPU: ${realtime?.systemStatus.cpu || 0}%`}>
              <Tag icon={<SyncOutlined spin />} color={getProgressColor(realtime?.systemStatus.cpu || 0) === '#52c41a' ? 'success' : getProgressColor(realtime?.systemStatus.cpu || 0) === '#faad14' ? 'warning' : 'error'}>
                CPU {realtime?.systemStatus.cpu || 0}%
              </Tag>
            </Tooltip>
            <Tooltip title={`Memory: ${realtime?.systemStatus.memory || 0}%`}>
              <Tag color={getProgressColor(realtime?.systemStatus.memory || 0) === '#52c41a' ? 'success' : getProgressColor(realtime?.systemStatus.memory || 0) === '#faad14' ? 'warning' : 'error'}>
                <FormattedMessage id="pages.dashboard.memory" defaultMessage="Mem" /> {realtime?.systemStatus.memory || 0}%
              </Tag>
            </Tooltip>
            <Tooltip title={`Disk: ${realtime?.systemStatus.disk || 0}%`}>
              <Tag color={getProgressColor(realtime?.systemStatus.disk || 0) === '#52c41a' ? 'success' : getProgressColor(realtime?.systemStatus.disk || 0) === '#faad14' ? 'warning' : 'error'}>
                <FormattedMessage id="pages.dashboard.disk" defaultMessage="Disk" /> {realtime?.systemStatus.disk || 0}%
              </Tag>
            </Tooltip>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <FormattedMessage id="pages.dashboard.uptime" defaultMessage="Uptime" />: {formatUptime(realtime?.systemStatus.uptime || 0)}
            </Text>
          </Space>
        }
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
                  height={220}
                  legend={{ position: 'top-right' }}
                  axis={{
                    y: { title: false },
                    x: { title: false },
                  }}
                />
              ) : (
                <div
                  style={{
                    height: 220,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text type="secondary">
                    <FormattedMessage
                      id="pages.dashboard.noData"
                      defaultMessage="No data"
                    />
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
                  height={220}
                  legend={{ position: 'top-right' }}
                  axis={{
                    y: { title: false },
                    x: { title: false },
                  }}
                />
              ) : (
                <div
                  style={{
                    height: 220,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text type="secondary">
                    <FormattedMessage
                      id="pages.dashboard.noData"
                      defaultMessage="No data"
                    />
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
                  height={220}
                  color={['#f5222d', '#faad14', '#1890ff']}
                  legend={{ position: 'top-right' }}
                  axis={{
                    y: { title: false },
                    x: { title: false },
                  }}
                />
              ) : (
                <div
                  style={{
                    height: 220,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text type="secondary">
                    <FormattedMessage
                      id="pages.dashboard.noData"
                      defaultMessage="No data"
                    />
                  </Text>
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Row 4: Active Connections + Recent Events side by side */}
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
                <Tag color="purple">
                  {realtime?.activeConnections.length || 0}
                </Tag>
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
              scroll={{ y: 300 }}
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
              rowKey={(record) =>
                `${record.timestamp}-${record.type}-${record.action}`
              }
              pagination={false}
              size="small"
              scroll={{ y: 300 }}
            />
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default Dashboard;
