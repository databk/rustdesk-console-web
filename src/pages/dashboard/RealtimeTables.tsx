import { ApiOutlined, AlertOutlined } from '@ant-design/icons';
import { FormattedMessage } from '@umijs/max';
import { Card, Col, Row, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React from 'react';

interface RealtimeTablesProps {
  realtime?: API.DashboardRealtime;
}

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

const RealtimeTables: React.FC<RealtimeTablesProps> = ({ realtime }) => {
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

  const eventColumns: ColumnsType<API.DashboardRealtime['recentEvents'][0]> = [
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

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={12} style={{ display: 'flex' }}>
        <Card
          style={{ flex: 1 }}
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
      <Col xs={24} lg={12} style={{ display: 'flex' }}>
        <Card
          style={{ flex: 1 }}
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
  );
};

export default RealtimeTables;
