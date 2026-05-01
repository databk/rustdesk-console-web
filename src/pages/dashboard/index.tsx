import {
  DashboardOutlined,
  UserOutlined,
  DesktopOutlined,
  ApiOutlined,
  AlertOutlined,
  FileOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { PageContainer, StatisticCard } from '@ant-design/pro-components';
import { useIntl, FormattedMessage } from '@umijs/max';
import { Card, Col, Row, Spin, Statistic, Progress, Tag, Table, Select, Space, Tooltip, Tabs } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useEffect, useState } from 'react';
import {
  getDashboardOverview,
  getDashboardStatistics,
  getDashboardTrends,
  getDashboardRealtime,
} from '@/services/rustdesk-console/dashboard';

const { StatisticCard: StatisticCardComponent } = StatisticCard;

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
    // Realtime data refresh every 10 seconds
    const realtimeInterval = setInterval(fetchRealtimeData, 10000);
    // Overview data refresh every 3 minutes
    const overviewInterval = setInterval(fetchOverviewData, 180000);
    // Statistics data refresh every 8 minutes
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
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            statistic={{
              title: <FormattedMessage id="pages.dashboard.totalUsers" defaultMessage="Total Users" />,
              value: overview?.users.total || 0,
              icon: <UserOutlined style={{ color: '#1890ff' }} />,
              description: (
                <Space direction="vertical" size={0}>
                  <Statistic
                    title={<FormattedMessage id="pages.dashboard.activeUsers" defaultMessage="Active" />}
                    value={overview?.users.active || 0}
                    valueStyle={{ fontSize: 14 }}
                  />
                  <Statistic
                    title={<FormattedMessage id="pages.dashboard.newToday" defaultMessage="New Today" />}
                    value={overview?.users.newToday || 0}
                    valueStyle={{ fontSize: 14 }}
                  />
                </Space>
              ),
            }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Row gutter={16} align="middle">
              <Col span={12}>
                <Statistic
                  title={<FormattedMessage id="pages.dashboard.totalDevices" defaultMessage="Total Devices" />}
                  value={overview?.devices.total || 0}
                  prefix={<DesktopOutlined />}
                />
                <div style={{ marginTop: 8 }}>
                  <Space size="small">
                    <Tooltip title="Online Devices">
                      <Tag color="success">{overview?.devices.online || 0} Online</Tag>
                    </Tooltip>
                    <Tooltip title="Device Groups">
                      <Tag color="blue">{overview?.devices.groups || 0} Groups</Tag>
                    </Tooltip>
                  </Space>
                </div>
              </Col>
              <Col span={12} style={{ textAlign: 'center' }}>
                <Progress
                  type="circle"
                  percent={
                    overview
                      ? Math.round((overview.devices.online / overview.devices.total) * 100)
                      : 0
                  }
                  format={(percent) => (
                    <span style={{ fontSize: 14 }}>
                      {percent}%
                      <br />
                      <span style={{ fontSize: 12, color: '#8c8c8c' }}>Online</span>
                    </span>
                  )}
                  strokeColor={{
                    '0%': '#52c41a',
                    '100%': '#73d13d',
                  }}
                  width={80}
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            statistic={{
              title: <FormattedMessage id="pages.dashboard.todayConnections" defaultMessage="Today Connections" />,
              value: overview?.connections.today || 0,
              icon: <ApiOutlined style={{ color: '#722ed1' }} />,
              description: (
                <Space direction="vertical" size={0}>
                  <Statistic
                    title={<FormattedMessage id="pages.dashboard.activeConnections" defaultMessage="Active" />}
                    value={overview?.connections.active || 0}
                    valueStyle={{ fontSize: 14 }}
                  />
                  <Statistic
                    title={<FormattedMessage id="pages.dashboard.avgDuration" defaultMessage="Avg Duration" />}
                    value={overview?.connections.avgDuration || 0}
                    suffix="min"
                    valueStyle={{ fontSize: 14 }}
                  />
                </Space>
              ),
            }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={<FormattedMessage id="pages.dashboard.totalAlarms" defaultMessage="Total Alarms" />}
              value={overview?.audits.alarms || 0}
              prefix={<AlertOutlined style={{ color: '#faad14' }} />}
            />
            <div style={{ marginTop: 12 }}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Row gutter={8}>
                  <Col span={12}>
                    <Tooltip title="Critical Alarms">
                      <Tag color="error" style={{ width: '100%', textAlign: 'center' }}>
                        {overview?.audits.criticalAlarms || 0} Critical
                      </Tag>
                    </Tooltip>
                  </Col>
                  <Col span={12}>
                    <Tooltip title="Unread Alarms">
                      <Tag color="warning" style={{ width: '100%', textAlign: 'center' }}>
                        {overview?.audits.unreadAlarms || 0} Unread
                      </Tag>
                    </Tooltip>
                  </Col>
                </Row>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card
            title={<FormattedMessage id="pages.dashboard.userDistribution" defaultMessage="User Distribution" />}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title={<FormattedMessage id="pages.dashboard.adminUsers" defaultMessage="Admin Users" />}
                  value={statistics?.userDistribution.byRole.admin || 0}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={<FormattedMessage id="pages.dashboard.normalUsers" defaultMessage="Normal Users" />}
                  value={statistics?.userDistribution.byRole.user || 0}
                />
              </Col>
            </Row>
            <div style={{ marginTop: 24 }}>
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
                    format={() => `Active: ${statistics?.userDistribution.byStatus.active || 0}`}
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
                    format={() => `Inactive: ${statistics?.userDistribution.byStatus.inactive || 0}`}
                  />
                </Col>
              </Row>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={<FormattedMessage id="pages.dashboard.deviceDistribution" defaultMessage="Device Distribution" />}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title={<FormattedMessage id="pages.dashboard.onlineDevices" defaultMessage="Online Devices" />}
                  value={statistics?.deviceDistribution.byStatus.online || 0}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={<FormattedMessage id="pages.dashboard.offlineDevices" defaultMessage="Offline Devices" />}
                  value={statistics?.deviceDistribution.byStatus.offline || 0}
                />
              </Col>
            </Row>
            <div style={{ marginTop: 24 }}>
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
                format={(percent) => `Online Rate: ${percent}%`}
              />
            </div>
            {statistics?.deviceDistribution.byGroup && statistics.deviceDistribution.byGroup.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <h4 style={{ marginBottom: 12 }}><FormattedMessage id="pages.dashboard.deviceGroupDistribution" defaultMessage="Device Groups" /></h4>
                <Table
                  dataSource={statistics.deviceDistribution.byGroup}
                  rowKey="groupId"
                  size="small"
                  pagination={false}
                  columns={[
                    {
                      title: 'Group Name',
                      dataIndex: 'groupName',
                      key: 'groupName',
                    },
                    {
                      title: 'Device Count',
                      dataIndex: 'count',
                      key: 'count',
                    },
                  ]}
                />
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card
            title={<FormattedMessage id="pages.dashboard.connectionAnalysis" defaultMessage="Connection Analysis" />}
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title={<FormattedMessage id="pages.dashboard.successRate" defaultMessage="Success Rate" />}
                  value={statistics?.connectionAnalysis.successRate || 0}
                  suffix="%"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={<FormattedMessage id="pages.dashboard.failureCount" defaultMessage="Failure Count" />}
                  value={statistics?.connectionAnalysis.failureCount || 0}
                  valueStyle={{ color: '#f5222d' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={<FormattedMessage id="pages.dashboard.avgDuration" defaultMessage="Avg Duration" />}
                  value={statistics?.connectionAnalysis.avgDuration || 0}
                  suffix=" min"
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={<FormattedMessage id="pages.dashboard.totalDuration" defaultMessage="Total Duration" />}
                  value={statistics?.connectionAnalysis.totalDuration || 0}
                  suffix=" min"
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={<FormattedMessage id="pages.dashboard.fileTransfer" defaultMessage="File Transfer" />}
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title={<FormattedMessage id="pages.dashboard.transferredToday" defaultMessage="Transferred Today" />}
                  value={overview?.files.transferred || 0}
                  icon={<FileOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={<FormattedMessage id="pages.dashboard.totalSize" defaultMessage="Total Size" />}
                  value={overview?.files.totalSize || '0 B'}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={<FormattedMessage id="pages.dashboard.uploadCount" defaultMessage="Upload Count" />}
                  value={statistics?.fileTransfer.uploadCount || 0}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={<FormattedMessage id="pages.dashboard.downloadCount" defaultMessage="Download Count" />}
                  value={statistics?.fileTransfer.downloadCount || 0}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <FormattedMessage id="pages.dashboard.systemStatus" defaultMessage="System Status" />
                <SyncOutlined spin style={{ color: '#1890ff' }} />
              </Space>
            }
          >
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Progress
                    type="circle"
                    percent={realtime?.systemStatus.cpu || 0}
                    format={(percent) => `${percent}%`}
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                  />
                  <div style={{ marginTop: 8 }}>CPU</div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Progress
                    type="circle"
                    percent={realtime?.systemStatus.memory || 0}
                    format={(percent) => `${percent}%`}
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                  />
                  <div style={{ marginTop: 8 }}>Memory</div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Progress
                    type="circle"
                    percent={realtime?.systemStatus.disk || 0}
                    format={(percent) => `${percent}%`}
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                  />
                  <div style={{ marginTop: 8 }}>Disk</div>
                </div>
              </Col>
            </Row>
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <FormattedMessage id="pages.dashboard.uptime" defaultMessage="Uptime" />: {formatUptime(realtime?.systemStatus.uptime || 0)}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <FormattedMessage id="pages.dashboard.trendData" defaultMessage="Trend Data" />
                <Select
                  value={trendRange}
                  onChange={setTrendRange}
                  options={[
                    { value: '7d', label: '7 Days' },
                    { value: '30d', label: '30 Days' },
                    { value: '90d', label: '90 Days' },
                  ]}
                  style={{ width: 120 }}
                />
              </Space>
            }
          >
            <Tabs
              defaultActiveKey="connection"
              items={[
                {
                  key: 'connection',
                  label: (
                    <span>
                      <ApiOutlined />
                      <FormattedMessage id="pages.dashboard.connectionTrend" defaultMessage="Connection" />
                    </span>
                  ),
                  children: trends?.connectionTrend ? (
                    <Table
                      dataSource={trends.connectionTrend}
                      rowKey="date"
                      size="small"
                      pagination={false}
                      columns={[
                        {
                          title: 'Date',
                          dataIndex: 'date',
                          key: 'date',
                          render: (date: string) => (
                            <Tag color="blue">{date}</Tag>
                          ),
                        },
                        {
                          title: 'Count',
                          dataIndex: 'count',
                          key: 'count',
                          render: (count: number) => (
                            <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{count}</span>
                          ),
                        },
                        {
                          title: 'Avg Duration',
                          dataIndex: 'avgDuration',
                          key: 'avgDuration',
                          render: (val: number) => (
                            <Tag color="green">{val.toFixed(1)} min</Tag>
                          ),
                        },
                      ]}
                    />
                  ) : null,
                },
                {
                  key: 'user',
                  label: (
                    <span>
                      <UserOutlined />
                      <FormattedMessage id="pages.dashboard.userActiveTrend" defaultMessage="User Active" />
                    </span>
                  ),
                  children: trends?.userActiveTrend ? (
                    <Table
                      dataSource={trends.userActiveTrend}
                      rowKey="date"
                      size="small"
                      pagination={false}
                      columns={[
                        {
                          title: 'Date',
                          dataIndex: 'date',
                          key: 'date',
                          render: (date: string) => (
                            <Tag color="blue">{date}</Tag>
                          ),
                        },
                        {
                          title: 'New Users',
                          dataIndex: 'newUsers',
                          key: 'newUsers',
                          render: (count: number) => (
                            <span style={{ fontWeight: 'bold', color: '#52c41a' }}>+{count}</span>
                          ),
                        },
                        {
                          title: 'Active Users',
                          dataIndex: 'activeUsers',
                          key: 'activeUsers',
                          render: (count: number) => (
                            <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{count}</span>
                          ),
                        },
                      ]}
                    />
                  ) : null,
                },
                {
                  key: 'alarm',
                  label: (
                    <span>
                      <AlertOutlined />
                      <FormattedMessage id="pages.dashboard.alarmTrend" defaultMessage="Alarm" />
                    </span>
                  ),
                  children: trends?.alarmTrend ? (
                    <Table
                      dataSource={trends.alarmTrend}
                      rowKey="date"
                      size="small"
                      pagination={false}
                      columns={[
                        {
                          title: 'Date',
                          dataIndex: 'date',
                          key: 'date',
                          render: (date: string) => (
                            <Tag color="blue">{date}</Tag>
                          ),
                        },
                        {
                          title: 'Critical',
                          dataIndex: 'critical',
                          key: 'critical',
                          render: (val: number) => (
                            <Tag color={val > 0 ? 'error' : 'default'}>{val}</Tag>
                          ),
                        },
                        {
                          title: 'Warning',
                          dataIndex: 'warning',
                          key: 'warning',
                          render: (val: number) => (
                            <Tag color={val > 0 ? 'warning' : 'default'}>{val}</Tag>
                          ),
                        },
                        {
                          title: 'Info',
                          dataIndex: 'info',
                          key: 'info',
                          render: (val: number) => (
                            <Tag color="blue">{val}</Tag>
                          ),
                        },
                      ]}
                    />
                  ) : null,
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card
            title={
              <Space>
                <FormattedMessage id="pages.dashboard.activeConnections" defaultMessage="Active Connections" />
                <Tag color="blue">{realtime?.activeConnections.length || 0}</Tag>
              </Space>
            }
          >
            <Table
              dataSource={realtime?.activeConnections || []}
              columns={connectionColumns}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card
            title={<FormattedMessage id="pages.dashboard.recentEvents" defaultMessage="Recent Events" />}
          >
            <Table
              dataSource={realtime?.recentEvents || []}
              columns={eventColumns}
              rowKey={(record) => `${record.timestamp}-${record.type}-${record.action}`}
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default Dashboard;
