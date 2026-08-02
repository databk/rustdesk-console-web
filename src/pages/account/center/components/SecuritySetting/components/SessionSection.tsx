import { FormattedMessage, useIntl } from '@umijs/max';
import { Button, Card, Popconfirm, Space, Table, Tag, Tooltip } from 'antd';
import {
  DeleteOutlined,
  DesktopOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import React from 'react';

interface SessionSectionProps {
  sessionList: API.SessionItem[];
  sessionListLoading: boolean;
  revokeLoadingJti: string | null;
  currentJti: string | null;
  onRevoke: (jti: string) => Promise<void>;
}

const SessionSection: React.FC<SessionSectionProps> = ({
  sessionList,
  sessionListLoading,
  revokeLoadingJti,
  currentJti,
  onRevoke,
}) => {
  const intl = useIntl();

  return (
    <Card
      title={
        <Space>
          <DesktopOutlined />
          <FormattedMessage
            id="pages.account.security.sessions.title"
            defaultMessage="Login Sessions"
          />
        </Space>
      }
    >
      <Table
        dataSource={sessionList}
        rowKey="jti"
        loading={sessionListLoading}
        size="middle"
        pagination={false}
        locale={{
          emptyText: intl.formatMessage({
            id: 'pages.account.security.sessions.noSessions',
            defaultMessage: 'No active sessions',
          }),
        }}
        columns={[
          {
            title: intl.formatMessage({
              id: 'pages.account.security.sessions.device',
              defaultMessage: 'Device',
            }),
            key: 'device',
            render: (_: unknown, record: API.SessionItem) => (
              <Space>
                {record.deviceType === 'client' ? (
                  <DesktopOutlined />
                ) : (
                  <GlobalOutlined />
                )}
                <span>{record.deviceName || '-'}</span>
                {record.jti === currentJti && (
                  <Tag color="blue">
                    <FormattedMessage
                      id="pages.account.security.sessions.current"
                      defaultMessage="Current"
                    />
                  </Tag>
                )}
              </Space>
            ),
          },
          {
            title: intl.formatMessage({
              id: 'pages.account.security.sessions.type',
              defaultMessage: 'Type',
            }),
            dataIndex: 'deviceType',
            key: 'deviceType',
            render: (type: string) => (
              <Tag>
                {type === 'client'
                  ? intl.formatMessage({
                      id: 'pages.account.security.sessions.client',
                      defaultMessage: 'Client',
                    })
                  : intl.formatMessage({
                      id: 'pages.account.security.sessions.browser',
                      defaultMessage: 'Browser',
                    })}
              </Tag>
            ),
          },
          {
            title: intl.formatMessage({
              id: 'pages.account.security.sessions.os',
              defaultMessage: 'OS',
            }),
            dataIndex: 'deviceOs',
            key: 'deviceOs',
            render: (os: string) => os || '-',
          },
          {
            title: intl.formatMessage({
              id: 'pages.account.security.sessions.createdAt',
              defaultMessage: 'Created At',
            }),
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) =>
              date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
          },
          {
            title: intl.formatMessage({
              id: 'pages.account.security.sessions.expiresAt',
              defaultMessage: 'Expires At',
            }),
            dataIndex: 'expiresAt',
            key: 'expiresAt',
            render: (date: string) =>
              date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
          },
          {
            title: intl.formatMessage({
              id: 'pages.common.action',
              defaultMessage: 'Action',
            }),
            key: 'action',
            width: 100,
            render: (_: unknown, record: API.SessionItem) => {
              const isCurrent = record.jti === currentJti;
              return (
                <Tooltip
                  title={
                    isCurrent
                      ? intl.formatMessage({
                          id: 'pages.account.security.sessions.cannotRevokeCurrent',
                          defaultMessage: 'Cannot revoke current session',
                        })
                      : undefined
                  }
                >
                  <Popconfirm
                    title={intl.formatMessage({
                      id: 'pages.account.security.sessions.revokeConfirm',
                      defaultMessage: 'Are you sure to revoke this session?',
                    })}
                    onConfirm={() => onRevoke(record.jti)}
                  >
                    <Button
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      disabled={isCurrent}
                      loading={revokeLoadingJti === record.jti}
                    >
                      <FormattedMessage
                        id="pages.account.security.sessions.revoke"
                        defaultMessage="Revoke"
                      />
                    </Button>
                  </Popconfirm>
                </Tooltip>
              );
            },
          },
        ]}
      />
    </Card>
  );
};

export default SessionSection;
