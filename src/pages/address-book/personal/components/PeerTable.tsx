import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { FormattedMessage } from '@umijs/max';
import { Button } from 'antd';
import { DeleteOutlined, PlusOutlined, SelectOutlined } from '@ant-design/icons';
import React from 'react';
import { getPeers } from '@/services/rustdesk-console/addressBook';

interface PeerTableProps {
  abGuid: string | undefined;
  abLoading: boolean;
  columns: ProColumns<API.PeerItem>[];
  selectedTags: string[];
  tagMode: 'union' | 'intersection';
  canWrite: boolean;
  headerTitle: React.ReactNode;
  actionRef: React.MutableRefObject<ActionType | null>;
  onOpenImport: () => void;
  onOpenAddPeer: () => void;
}

const PeerTable: React.FC<PeerTableProps> = ({
  abGuid,
  abLoading,
  columns,
  selectedTags,
  tagMode,
  canWrite,
  headerTitle,
  actionRef,
  onOpenImport,
  onOpenAddPeer,
}) => {
  return (
    <ProTable<API.PeerItem>
      key={abGuid || 'loading'}
      headerTitle={headerTitle}
      columnsState={{
        persistenceType: 'localStorage',
        persistenceKey: 'personal_address_book_columns_state',
      }}
      actionRef={actionRef}
      rowKey="id"
      loading={abLoading}
      request={async (params) => {
        if (!abGuid) {
          return { data: [], total: 0, success: true };
        }
        const result = await getPeers({
          current: params.current || 1,
          pageSize: params.pageSize || 20,
          ab: abGuid,
          id: params.id,
          tags: selectedTags.length > 0 ? selectedTags : undefined,
          tagMode: selectedTags.length > 1 ? tagMode : undefined,
        });
        return {
          data: result.data || [],
          total: result.total || 0,
          success: true,
        };
      }}
      columns={
        canWrite
          ? columns
          : columns.filter((column) => column.valueType !== 'option')
      }
      search={{
        labelWidth: 'auto',
        defaultCollapsed: false,
        optionRender: (_searchConfig, _formProps, dom) => [dom[1], dom[0]],
      }}
      pagination={{
        defaultPageSize: 20,
        showSizeChanger: true,
        showQuickJumper: true,
      }}
      scroll={{ x: 1100 }}
      toolBarRender={() =>
        canWrite
          ? [
              <Button
                key="import"
                type="primary"
                icon={<SelectOutlined />}
                onClick={onOpenImport}
              >
                <FormattedMessage
                  id="pages.addressBook.import"
                  defaultMessage="Import from devices"
                />
              </Button>,
              <Button
                key="add"
                icon={<PlusOutlined />}
                onClick={onOpenAddPeer}
              >
                <FormattedMessage
                  id="pages.addressBook.addPeer"
                  defaultMessage="Add by ID"
                />
              </Button>,
              <Button key="recycle" icon={<DeleteOutlined />}>
                <FormattedMessage
                  id="pages.addressBook.recycleBin"
                  defaultMessage="Recycle Bin"
                />
              </Button>,
            ]
          : []
      }
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