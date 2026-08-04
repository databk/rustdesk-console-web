import type { ProColumns } from '@ant-design/pro-components';
import { FormattedMessage, useIntl, useModel } from '@umijs/max';
import { Space, Tag, Tooltip } from 'antd';
import {
  CrownOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import React from 'react';

const renderStatusTag = (status: number): React.ReactNode => {
  if (status === 1) {
    return (
      <Tag icon={<PlusCircleOutlined />} color="green">
        <FormattedMessage id="pages.users.active" defaultMessage="Active" />
      </Tag>
    );
  }
  if (status === 0) {
    return (
      <Tag icon={<MinusCircleOutlined />} color="red">
        <FormattedMessage id="pages.users.disabled" defaultMessage="Disabled" />
      </Tag>
    );
  }
  if (status === -1) {
    return (
      <Tag color="orange">
        <FormattedMessage
          id="pages.users.unverified"
          defaultMessage="Unverified"
        />
      </Tag>
    );
  }
  return <Tag>{status}</Tag>;
};

export const getUserColumns = (): ProColumns<API.UserItem>[] => {
  const intl = useIntl();
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;

  const baseColumns: ProColumns<API.UserItem>[] = [
    {
      title: (
        <FormattedMessage id="pages.users.name" defaultMessage="Username" />
      ),
      dataIndex: 'name',
      width: 180,
      ellipsis: true,
      render: (_: unknown, record: API.UserItem) => (
        <Space direction="vertical" size={0}>
          <Space>
            <span style={{ fontWeight: 500 }}>
              {record.display_name || record.name}
            </span>
            {record.is_admin && (
              <Tooltip
                title={intl.formatMessage({
                  id: 'pages.users.admin',
                  defaultMessage: 'Admin',
                })}
              >
                <CrownOutlined style={{ color: '#faad14' }} />
              </Tooltip>
            )}
            {record.name === currentUser?.name && (
              <Tag color="blue">
                <FormattedMessage id="pages.users.me" defaultMessage="Me" />
              </Tag>
            )}
            {record.third_auth_type && <Tag>{record.third_auth_type}</Tag>}
          </Space>
          {record.display_name && (
            <span style={{ color: '#8c8c8c', fontSize: 12 }}>
              @{record.name}
            </span>
          )}
        </Space>
      ),
    },
    {
      title: <FormattedMessage id="pages.users.email" defaultMessage="Email" />,
      dataIndex: 'email',
      ellipsis: true,
      render: (_: unknown, record: API.UserItem) => record.email || '-',
    },
    {
      title: (
        <FormattedMessage id="pages.users.status" defaultMessage="Status" />
      ),
      dataIndex: 'status',
      width: 80,
      valueType: 'select',
      valueEnum: {
        1: {
          text: intl.formatMessage({
            id: 'pages.users.active',
            defaultMessage: 'Active',
          }),
          status: 'Success',
        },
        0: {
          text: intl.formatMessage({
            id: 'pages.users.disabled',
            defaultMessage: 'Disabled',
          }),
          status: 'Error',
        },
        [-1]: {
          text: intl.formatMessage({
            id: 'pages.users.unverified',
            defaultMessage: 'Unverified',
          }),
          status: 'Warning',
        },
      },
      render: (_: unknown, record: API.UserItem) =>
        renderStatusTag(record.status),
    },
    {
      title: (
        <FormattedMessage id="pages.users.strategy" defaultMessage="Strategy" />
      ),
      dataIndex: 'strategy_name',
      search: false,
      render: (_: unknown, record: API.UserItem) => record.strategy_name || '-',
    },
    {
      title: (
        <FormattedMessage
          id="pages.users.userGroup"
          defaultMessage="User Group"
        />
      ),
      dataIndex: 'user_group_name',
      search: false,
      render: (_: unknown, record: API.UserItem) => (
        <Space>
          <TeamOutlined />
          <span>{record.user_group_name || '-'}</span>
        </Space>
      ),
    },
    {
      title: <FormattedMessage id="pages.users.note" defaultMessage="Note" />,
      dataIndex: 'note',
      ellipsis: true,
      search: false,
      render: (_: unknown, record: API.UserItem) => record.note || '-',
    },
  ];

  return baseColumns;
};
