import type { ProColumns } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Button, Divider, Popconfirm, Space, Tag, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import React from 'react';
import { argbToHex, getOSIcon } from '../utils';

interface PeerColumnsOptions {
  tags: API.TagItem[];
  onEditPeer: (record: API.PeerItem) => void;
  onDeletePeer: (id: string) => void;
}

export const usePeerColumns = (
  options: PeerColumnsOptions,
): ProColumns<API.PeerItem>[] => {
  const intl = useIntl();
  const { tags, onEditPeer, onDeletePeer } = options;

  return [
    {
      title: <FormattedMessage id="pages.common.id" defaultMessage="ID" />,
      dataIndex: 'id',
      width: '15%',
      ellipsis: true,
      sorter: true,
      render: (_: unknown, record: API.PeerItem) => {
        const peerRecord = record as API.PeerItem & { platform?: string };
        const platformParts = (peerRecord.platform || '').split(' / ');
        const osIcon = getOSIcon(peerRecord.platform || '');
        const osTooltip = platformParts[1] || platformParts[0] || '';

        return (
          <span>
            {osIcon && osTooltip && (
              <Tooltip
                title={osTooltip}
                styles={{
                  root: {
                    maxWidth: 'none',
                  },
                }}
                overlayStyle={{
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{osIcon}</span>
              </Tooltip>
            )}
            {osIcon && <>&nbsp;&nbsp;</>}
            {record.id}
          </span>
        );
      },
    },
    {
      title: (
        <span>
          <FormattedMessage
            id="pages.addressBook.device"
            defaultMessage="Device"
          />
          <Tooltip
            title={intl.formatMessage({
              id: 'pages.addressBook.deviceInfo',
              defaultMessage: 'username@device_name',
            })}
          >
            <InfoCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </span>
      ),
      dataIndex: 'hostname',
      width: 150,
      ellipsis: true,
      search: false,
      sorter: true,
      render: (_: unknown, record: API.PeerItem) => {
        const username = (record as API.PeerItem & { username?: string })
          .username;
        const hostname = record.hostname;
        if (username && hostname) return `${username}@${hostname}`;
        return hostname || username || '-';
      },
    },
    {
      title: (
        <FormattedMessage id="pages.addressBook.alias" defaultMessage="Alias" />
      ),
      dataIndex: 'alias',
      width: 150,
      ellipsis: true,
      search: false,
      sorter: true,
      render: (_: unknown, record: API.PeerItem) =>
        (record as API.PeerItem & { alias?: string }).alias || '-',
    },
    {
      title: (
        <FormattedMessage id="pages.addressBook.tags" defaultMessage="Tags" />
      ),
      dataIndex: 'tags',
      width: 200,
      search: false,
      render: (_: unknown, record: API.PeerItem) => {
        const peerTags = record.tags || [];
        if (peerTags.length === 0) return '-';
        return (
          <Space size={[0, 4]} wrap>
            {peerTags.map((tag: string) => {
              const tagInfo = (tags as API.TagItem[]).find(
                (t: API.TagItem) => t.name === tag,
              );
              return (
                <Tag key={tag} color={argbToHex(tagInfo?.color)}>
                  {tag}
                </Tag>
              );
            })}
          </Space>
        );
      },
    },
    {
      title: (
        <FormattedMessage id="pages.addressBook.note" defaultMessage="Note" />
      ),
      dataIndex: 'note',
      width: 150,
      ellipsis: true,
      search: false,
      sorter: true,
      render: (_: unknown, record: API.PeerItem) => record.note || '-',
    },
    {
      title: (
        <FormattedMessage id="pages.common.action" defaultMessage="Action" />
      ),
      valueType: 'option',
      width: 160,
      fixed: 'right',
      render: (_: unknown, record: API.PeerItem) => (
        <Space size={0} split={<Divider type="vertical" />}>
          <Button
            key="edit"
            type="link"
            size="small"
            onClick={() => onEditPeer(record)}
          >
            <FormattedMessage id="pages.common.edit" defaultMessage="Edit" />
          </Button>
          <Popconfirm
            key="delete"
            title={
              <FormattedMessage
                id="pages.addressBook.deletePeerConfirm"
                defaultMessage="Are you sure to delete this peer?"
              />
            }
            onConfirm={() => onDeletePeer(record.id)}
            okText={intl.formatMessage({
              id: 'pages.common.confirm',
              defaultMessage: 'Yes',
            })}
            cancelText={intl.formatMessage({
              id: 'pages.common.cancel',
              defaultMessage: 'No',
            })}
          >
            <Button type="link" size="small" danger>
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
