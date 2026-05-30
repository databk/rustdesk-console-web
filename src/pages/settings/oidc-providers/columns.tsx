import { ApiOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Button, Divider, Popconfirm, Space, Switch, Tag, Tooltip } from 'antd';
import React from 'react';

interface ColumnHandlers {
  onEdit: (record: API.OidcProvider) => void;
  onDelete: (guid: string) => void;
  onToggle: (guid: string, enabled: boolean) => void;
  onTest: (guid: string) => void;
  testingGuid: string | null;
}

const OidcProviderColumns = (
  handlers: ColumnHandlers,
): ProColumns<API.OidcProvider>[] => {
  const intl = useIntl();

  return [
    {
      title: '',
      dataIndex: 'index',
      valueType: 'indexBorder',
      width: 48,
    },
    {
      title: (
        <FormattedMessage
          id="pages.oidcProviders.name"
          defaultMessage="Provider Name"
        />
      ),
      dataIndex: 'name',
      width: 180,
    },
    {
      title: (
        <FormattedMessage id="pages.oidcProviders.type" defaultMessage="Type" />
      ),
      dataIndex: 'type',
      width: 100,
      search: false,
      render: (_, record) => (
        <Tag color={record.type === 'oauth2' ? 'orange' : 'blue'}>
          {record.type?.toUpperCase() || 'OIDC'}
        </Tag>
      ),
    },
    {
      title: (
        <FormattedMessage
          id="pages.oidcProviders.issuer"
          defaultMessage="Issuer URL"
        />
      ),
      dataIndex: 'issuer',
      width: 250,
      ellipsis: { showTitle: false },
      render: (_, record) => (
        <Tooltip placement="topLeft" title={record.issuer}>
          {record.issuer}
        </Tooltip>
      ),
    },
    {
      title: (
        <FormattedMessage
          id="pages.oidcProviders.clientId"
          defaultMessage="Client ID"
        />
      ),
      dataIndex: 'clientId',
      width: 180,
      search: false,
      ellipsis: { showTitle: false },
      render: (_, record) => (
        <Tooltip placement="topLeft" title={record.clientId}>
          {record.clientId}
        </Tooltip>
      ),
    },
    {
      title: (
        <FormattedMessage
          id="pages.oidcProviders.priority"
          defaultMessage="Priority"
        />
      ),
      dataIndex: 'priority',
      width: 80,
      search: false,
      align: 'center',
    },
    {
      title: (
        <FormattedMessage
          id="pages.oidcProviders.enabled"
          defaultMessage="Enabled"
        />
      ),
      dataIndex: 'enabled',
      width: 80,
      search: false,
      render: (_, record) => (
        <Popconfirm
          title={intl.formatMessage({
            id: record.enabled
              ? 'pages.oidcProviders.disableConfirm'
              : 'pages.oidcProviders.enableConfirm',
            defaultMessage: record.enabled
              ? 'Disable this provider?'
              : 'Enable this provider?',
          })}
          onConfirm={() => handlers.onToggle(record.guid, !record.enabled)}
          okText={intl.formatMessage({
            id: 'pages.common.confirm',
            defaultMessage: 'Yes',
          })}
          cancelText={intl.formatMessage({
            id: 'pages.common.cancel',
            defaultMessage: 'No',
          })}
        >
          <Switch checked={record.enabled} />
        </Popconfirm>
      ),
    },
    {
      title: (
        <FormattedMessage id="pages.common.action" defaultMessage="Action" />
      ),
      valueType: 'option',
      width: 240,
      fixed: 'right',
      render: (_, record) => (
        <Space size={0} split={<Divider type="vertical" />}>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handlers.onEdit(record)}
          >
            <FormattedMessage id="pages.common.edit" defaultMessage="Edit" />
          </Button>
          <Button
            type="link"
            size="small"
            icon={<ApiOutlined />}
            loading={handlers.testingGuid === record.guid}
            onClick={() => handlers.onTest(record.guid)}
          >
            <FormattedMessage
              id="pages.oidcProviders.test"
              defaultMessage="Test"
            />
          </Button>
          <Popconfirm
            title={intl.formatMessage({
              id: 'pages.oidcProviders.deleteConfirm',
              defaultMessage: 'Are you sure to delete this provider?',
            })}
            onConfirm={() => handlers.onDelete(record.guid)}
            okText={intl.formatMessage({
              id: 'pages.common.confirm',
              defaultMessage: 'Yes',
            })}
            cancelText={intl.formatMessage({
              id: 'pages.common.cancel',
              defaultMessage: 'No',
            })}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              <FormattedMessage
                id="pages.common.delete"
                defaultMessage="Delete"
              />
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];
};

export default OidcProviderColumns;
