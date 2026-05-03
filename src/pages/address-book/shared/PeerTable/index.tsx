import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Button, Popconfirm, Space, Tag } from 'antd';
import React from 'react';
import type { PeerItem, TagItem } from '@/services/rustdesk-console/typings';
import { argbToHex } from '../utils';

export interface PeerTableProps {
  abGuid: string | undefined;
  abLoading: boolean;
  tags: TagItem[];
  selectedTags: string[];
  tagMode: 'union' | 'intersection';
  actionRef: React.MutableRefObject<ActionType | null>;
  onEdit: (record: PeerItem) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

const PeerTable: React.FC<PeerTableProps> = ({
  abGuid,
  abLoading,
  tags,
  selectedTags,
  tagMode,
  actionRef,
  onEdit,
  onDelete,
  onRefresh,
}) => {
  const intl = useIntl();

  const columns: ProColumns<PeerItem>[] = [
    {
      title: <FormattedMessage id="pages.common.id" defaultMessage="ID" />,
      dataIndex: 'id',
      width: 150,
      ellipsis: true,
      sorter: true,
    },
    {
      title: (
        <Space size={4}>
          <FormattedMessage id="pages.addressBook.device" defaultMessage="Device" />
        </Space>
      ),
      dataIndex: 'hostname',
      width: 150,
      ellipsis: true,
      search: false,
      sorter: true,
      render: (_: unknown, record: PeerItem) => record.hostname || '-',
    },
    {
      title: <FormattedMessage id="pages.addressBook.alias" defaultMessage="Alias" />,
      dataIndex: 'alias',
      width: 150,
      ellipsis: true,
      search: false,
      sorter: true,
      render: (_: unknown, record: PeerItem & { alias?: string }) => record.alias || '-',
    },
    {
      title: <FormattedMessage id="pages.addressBook.tags" defaultMessage="Tags" />,
      dataIndex: 'tags',
      width: 200,
      search: false,
      render: (_: unknown, record: PeerItem) => {
        const peerTags = record.tags || [];
        if (peerTags.length === 0) return '-';
        return (
          <Space size={[0, 4]} wrap>
            {peerTags.map((tag: string) => {
              const tagInfo = (tags as TagItem[]).find((t: TagItem) => t.name === tag);
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
      title: <FormattedMessage id="pages.addressBook.note" defaultMessage="Note" />,
      dataIndex: 'note',
      width: 150,
      ellipsis: true,
      search: false,
      sorter: true,
      render: (_: unknown, record: PeerItem) => record.note || '-',
    },
    {
      title: <FormattedMessage id="pages.common.action" defaultMessage="Action" />,
      valueType: 'option',
      width: 160,
      fixed: 'right',
      render: (_: unknown, record: PeerItem) => (
        <Space size="small" split={<span style={{ color: '#ccc' }}>|</span>}>
          <Button
            key="edit"
            type="link"
            size="small"
            onClick={() => onEdit(record)}
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
            onConfirm={() => onDelete(record.id)}
          >
            <Button type="link" size="small" danger>
              <FormattedMessage id="pages.common.delete" defaultMessage="Delete" />
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <ProTable<PeerItem>
      headerTitle={
        <FormattedMessage id="pages.addressBook.personal" defaultMessage="Personal Address Book" />
      }
      actionRef={actionRef}
      rowKey="id"
      loading={abLoading}
      request={async (params) => {
        if (!abGuid) {
          return { data: [], total: 0, success: true };
        }
        // Note: This should be handled by parent component
        return { data: [], total: 0, success: true };
      }}
      columns={columns}
      search={{
        labelWidth: 'auto',
        defaultCollapsed: false,
        optionRender: (searchConfig, formProps, dom) => [
          dom[1],
          dom[0],
        ],
      }}
      pagination={{
        defaultPageSize: 20,
        showSizeChanger: true,
        showQuickJumper: true,
      }}
      scroll={{ x: 1100 }}
      options={{
        density: true,
        setting: {
          listsHeight: 400,
        },
        fullScreen: false,
        reload: true,
      }}
    />
  );
};

export default PeerTable;