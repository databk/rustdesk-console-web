import type { ActionType } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import React, { useRef } from 'react';
import { getDeviceList } from '@/services/rustdesk-console/device';
import { getDeviceColumns } from './columns';

interface DeviceSelectTableProps {
  selectedRowKeys?: React.Key[];
  onSelectionChange?: (selectedRowKeys: React.Key[]) => void;
  pageSize?: number;
}

const DeviceSelectTable: React.FC<DeviceSelectTableProps> = ({
  selectedRowKeys = [],
  onSelectionChange,
  pageSize = 10,
}) => {
  const actionRef = useRef<ActionType>();

  // Use shared columns definition, hide action column for selection mode
  const columns = getDeviceColumns({ hideAction: true });

  return (
    <ProTable<API.DeviceItem>
      actionRef={actionRef}
      rowKey="id"
      search={{
        labelWidth: 'auto',
        defaultCollapsed: true,
      }}
      pagination={{
        defaultPageSize: pageSize,
        showSizeChanger: true,
      }}
      request={async (params) => {
        const result = await getDeviceList({
          current: params.current || 1,
          pageSize: params.pageSize || pageSize,
          id: params.id,
          status: params.status,
          is_online: params.is_online,
          user_name: params.user_name,
          device_group_name: params.device_group_name_search,
          os: params.os,
        });
        return {
          data: result.data || [],
          total: result.total || 0,
          success: true,
        };
      }}
      columns={columns}
      rowSelection={{
        selectedRowKeys,
        onChange: onSelectionChange,
      }}
      options={false}
    />
  );
};

export default DeviceSelectTable;
