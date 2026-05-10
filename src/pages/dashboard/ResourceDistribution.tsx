import { TeamOutlined, DesktopOutlined } from '@ant-design/icons';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Card, Col, Progress, Row, Space, Statistic, Tag, Typography } from 'antd';
import React, { type CSSProperties } from 'react';

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

interface ResourceDistributionProps {
  statistics?: API.DashboardStatistics;
  style?: CSSProperties;
}

const ResourceDistribution: React.FC<ResourceDistributionProps> = ({
  statistics,
  style,
}) => {
  const intl = useIntl();

  return (
    <Card
      style={style}
      title={
        <Space>
          <TeamOutlined style={{ color: '#1890ff' }} />
          <FormattedMessage
            id="pages.dashboard.resourceDistribution"
            defaultMessage="Resource Distribution"
          />
        </Space>
      }
      size="small"
      styles={{ body: { padding: '8px 16px' } }}
    >
      {/* User Distribution */}
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

      {/* Device Distribution */}
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
                  <Tag key={group.groupId} style={{ margin: 0 }}>
                    {group.groupName}: <Text strong>{group.count}</Text>
                  </Tag>
                ))}
              </Space>
            </div>
          )}
      </div>
    </Card>
  );
};

export default ResourceDistribution;
