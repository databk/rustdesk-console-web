import { DeleteOutlined, EditOutlined, TeamOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Button, Divider, Popconfirm, Space, Tooltip } from 'antd';
import React from 'react';

interface ColumnHandlers {
  onEdit: (record: API.StrategyItem) => void;
  onDelete: (guid: string) => void;
  onAssign: (record: API.StrategyItem) => void;
}

const StrategyColumns = (
  handlers: ColumnHandlers,
): ProColumns<API.StrategyItem>[] => {
  const intl = useIntl();

  return [
    {
      title: (
        <FormattedMessage
          id="pages.strategies.name"
          defaultMessage="Strategy Name"
        />
      ),
      dataIndex: 'name',
      width: 200,
    },
    {
      title: (
        <FormattedMessage id="pages.strategies.note" defaultMessage="Note" />
      ),
      dataIndex: 'note',
      width: 200,
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
          id="pages.strategies.updatedAt"
          defaultMessage="Updated At"
        />
      ),
      dataIndex: 'updated_at',
      width: 180,
      search: false,
      render: (_, record) => {
        if (!record.updated_at) return '-';
        return new Date(record.updated_at).toLocaleString();
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
