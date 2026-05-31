import { DeleteOutlined, EditOutlined, TeamOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Button, Divider, Popconfirm, Space, Tag, Tooltip } from 'antd';
import React from 'react';
import { configOptions, getModifiedCount } from './configOptions';

interface ColumnHandlers {
  onEdit: (record: API.StrategyItem) => void;
  onDelete: (guid: string) => void;
  onAssign: (record: API.StrategyItem) => void;
}

const StrategyColumns = (handlers: ColumnHandlers): ProColumns<API.StrategyItem>[] => {
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
        <FormattedMessage id="pages.strategies.name" defaultMessage="Strategy Name" />
      ),
      dataIndex: 'name',
      width: 200,
    },
    {
      title: (
        <FormattedMessage id="pages.strategies.note" defaultMessage="Note" />
      ),
      dataIndex: 'note',
      width: 180,
      search: false,
      ellipsis: { showTitle: false },
      render: (_, record) => (
        <Tooltip placement="topLeft" title={record.note}>
          {record.note || '-'}
        </Tooltip>
      ),
    },
    {
      title: (
        <FormattedMessage
          id="pages.strategies.configSummary"
          defaultMessage="Config"
        />
      ),
      dataIndex: 'config_options',
      width: 160,
      search: false,
      render: (_, record) => {
        const modified = getModifiedCount(record.config_options);
        const total = configOptions.length;
        return (
          <Tag color={modified > 0 ? 'blue' : 'default'}>
            <FormattedMessage
              id="pages.strategies.configCount"
              defaultMessage="{modified}/{total} modified"
              values={{ modified, total }}
            />
          </Tag>
        );
      },
    },
    {
      title: (
        <FormattedMessage
          id="pages.strategies.modifiedAt"
          defaultMessage="Modified At"
        />
      ),
      dataIndex: 'modified_at',
      width: 180,
      search: false,
      render: (_, record) => {
        if (!record.modified_at) return '-';
        return new Date(record.modified_at).toLocaleString();
      },
    },
    {
      title: (
        <FormattedMessage
          id="pages.strategies.createdAt"
          defaultMessage="Created At"
        />
      ),
      dataIndex: 'created_at',
      width: 180,
      search: false,
      render: (_, record) => {
        if (!record.created_at) return '-';
        return new Date(record.created_at).toLocaleString();
      },
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
            icon={<TeamOutlined />}
            onClick={() => handlers.onAssign(record)}
          >
            <FormattedMessage
              id="pages.strategies.assign"
              defaultMessage="Assign"
            />
          </Button>
          <Popconfirm
            title={intl.formatMessage({
              id: 'pages.strategies.deleteConfirm',
              defaultMessage: 'Are you sure to delete this strategy?',
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

export default StrategyColumns;
