import {
  UserOutlined,
  DesktopOutlined,
  ApiOutlined,
  AlertOutlined,
} from '@ant-design/icons';
import { StatisticCard } from '@ant-design/pro-components';
import { FormattedMessage } from '@umijs/max';
import { Col, Row, Space, Statistic } from 'antd';
import React from 'react';

interface OverviewCardsProps {
  overview?: API.DashboardOverview;
}

const OverviewCards: React.FC<OverviewCardsProps> = ({ overview }) => {
  return (
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
            ),
          }}
        />
      </Col>
    </Row>
  );
};

export default OverviewCards;
