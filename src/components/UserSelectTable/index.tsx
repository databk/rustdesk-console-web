import type { ActionType } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import React, { useRef } from 'react';
import { getAdminUserList } from '@/services/rustdesk-console/user';
import { getUserColumns } from './columns';

interface UserSelectTableProps {
  selectedRowKeys?: React.Key[];
  onSelectionChange?: (selectedRowKeys: React.Key[]) => void;
  getCheckboxProps?: (
    record: API.UserItem,
  ) => { disabled?: boolean };
  pageSize?: number;
  defaultSearchCollapsed?: boolean;
}

const UserSelectTable: React.FC<UserSelectTableProps> = ({
  selectedRowKeys = [],
  onSelectionChange,
  getCheckboxProps,
  pageSize = 10,
  defaultSearchCollapsed = true,
}) => {
  const actionRef = useRef<ActionType>(null);
  const columns = getUserColumns();

  return (
    <ProTable<API.UserItem>
      actionRef={actionRef}
      rowKey="guid"
      search={{
        labelWidth: 'auto',
        defaultCollapsed: defaultSearchCollapsed,
      }}
      pagination={{
        defaultPageSize: pageSize,
        showSizeChanger: true,
      }}
      request={async (params) => {
        const result = await getAdminUserList({
          current: params.current || 1,
          pageSize: params.pageSize || pageSize,
          status: params.status,
          name: params.name,
          email: params.email,
          is_admin:
            params.is_admin === 'true'
              ? 1
              : params.is_admin === 'false'
                ? 0
                : undefined,
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
        getCheckboxProps,
      }}
      scroll={{ x: 'max-content' }}
      options={false}
    />
  );
};

export default UserSelectTable;
