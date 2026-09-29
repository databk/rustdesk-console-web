import { PlusOutlined, SelectOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { FormattedMessage } from '@umijs/max';
import { Button } from 'antd';
import React from 'react';
import { getAdminUserList } from '@/services/rustdesk-console/user';
import { DEFAULT_PAGINATION, toTableResult } from '@/utils/pagination';
import BatchActionsBar from './BatchActionsBar';

interface UserTableProps {
  userGroupGuid?: string;
  columns: ProColumns<API.UserItem>[];
  actionRef: React.MutableRefObject<ActionType | null>;
  selectedRowKeys: React.Key[];
  selectedRows: API.UserItem[];
  selectionBlocked: boolean;
  onSelectionChange: (keys: React.Key[], rows: API.UserItem[]) => void;
  isSuperAdmin: boolean;
  canUsersCreate: boolean;
  canUsersStatus: boolean;
  canUsersForceLogout: boolean;
  canUserGroupsMembership: boolean;
  userGroups: API.UserGroupItem[];
  userGroupsLoading: boolean;
  destinationGuid: string | undefined;
  moving: boolean;
  batchStatusUpdating: boolean;
  batchForceLoggingOut: boolean;
  onDestinationChange: (guid: string | undefined) => void;
  onBatchMove: () => void;
  onBatchEnable: () => void;
  onBatchDisable: () => void;
  onBatchForceLogout: () => void;
  onOpenImport: () => void;
  onOpenCreate: () => void;
  onOpenInvite: () => void;
}

const UserTable: React.FC<UserTableProps> = ({
  userGroupGuid,
  columns,
  actionRef,
  selectedRowKeys,
  selectedRows,
  selectionBlocked,
  onSelectionChange,
  isSuperAdmin,
  canUsersCreate,
  canUsersStatus,
  canUsersForceLogout,
  canUserGroupsMembership,
  userGroups,
  userGroupsLoading,
  destinationGuid,
  moving,
  batchStatusUpdating,
  batchForceLoggingOut,
  onDestinationChange,
  onBatchMove,
  onBatchEnable,
  onBatchDisable,
  onBatchForceLogout,
  onOpenImport,
  onOpenCreate,
  onOpenInvite,
}) => {
  return (
    <ProTable<API.UserItem>
      headerTitle={
        <FormattedMessage id="pages.users.list" defaultMessage="User List" />
      }
      columnsState={{
        persistenceType: 'localStorage',
        persistenceKey: 'user_list_columns_state',
      }}
      actionRef={actionRef}
      rowKey="guid"
      rowSelection={
        (userGroupGuid && canUserGroupsMembership) ||
        (!userGroupGuid && (canUsersStatus || canUsersForceLogout))
          ? {
              selectedRowKeys,
              onChange: (keys, rows) => onSelectionChange(keys, rows),
              getCheckboxProps: (record) => ({
                disabled:
                  !isSuperAdmin &&
                  (record.is_admin || record.is_protected === true),
              }),
            }
          : undefined
      }
      tableAlertOptionRender={() =>
        userGroupGuid ? (
          <BatchActionsBar
            mode="move"
            userGroups={userGroups}
            userGroupsLoading={userGroupsLoading}
            currentGroupGuid={userGroupGuid}
            destinationGuid={destinationGuid}
            moving={moving}
            batchStatusUpdating={batchStatusUpdating}
            batchForceLoggingOut={batchForceLoggingOut}
            selectedRowCount={selectedRows.length}
            hasUnmanageableSelection={selectionBlocked}
            onDestinationChange={onDestinationChange}
            onBatchMove={onBatchMove}
            onBatchEnable={onBatchEnable}
            onBatchDisable={onBatchDisable}
            onBatchForceLogout={onBatchForceLogout}
            canUsersStatus={canUsersStatus}
            canUsersForceLogout={canUsersForceLogout}
          />
        ) : (
          <BatchActionsBar
            mode="status"
            userGroups={userGroups}
            userGroupsLoading={userGroupsLoading}
            currentGroupGuid={userGroupGuid}
            destinationGuid={destinationGuid}
            moving={moving}
            batchStatusUpdating={batchStatusUpdating}
            batchForceLoggingOut={batchForceLoggingOut}
            selectedRowCount={selectedRows.length}
            hasUnmanageableSelection={selectionBlocked}
            onDestinationChange={onDestinationChange}
            onBatchMove={onBatchMove}
            onBatchEnable={onBatchEnable}
            onBatchDisable={onBatchDisable}
            onBatchForceLogout={onBatchForceLogout}
            canUsersStatus={canUsersStatus}
            canUsersForceLogout={canUsersForceLogout}
          />
        )
      }
      request={async (params) => {
        const result = await getAdminUserList({
          current: params.current || 1,
          pageSize: params.pageSize || 20,
          status: params.status,
          name: params.name,
          email: params.email,
          is_admin:
            params.is_admin === 'true'
              ? 1
              : params.is_admin === 'false'
                ? 0
                : undefined,
          strategy_name: params.strategy_name,
          user_group_name: params.user_group_name,
          user_group_guid: userGroupGuid,
        });
        return toTableResult(result);
      }}
      columns={
        userGroupGuid && canUserGroupsMembership
          ? columns.filter((col) => col.dataIndex !== 'user_group_name')
          : columns
      }
      search={{
        labelWidth: 'auto',
        defaultCollapsed: true,
        optionRender: (_searchConfig, _formProps, dom) => [...dom.reverse()],
      }}
      pagination={DEFAULT_PAGINATION}
      scroll={{ x: 'max-content' }}
      toolBarRender={() =>
        userGroupGuid && canUserGroupsMembership
          ? [
              <Button
                key="import"
                icon={<SelectOutlined />}
                onClick={onOpenImport}
              >
                <FormattedMessage
                  id="pages.userGroups.import"
                  defaultMessage="Import"
                />
              </Button>,
            ]
          : !userGroupGuid && canUsersCreate
            ? [
                <Button
                  key="create"
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={onOpenCreate}
                >
                  <FormattedMessage
                    id="pages.users.create"
                    defaultMessage="Create"
                  />
                </Button>,
                <Button
                  key="invite"
                  icon={<PlusOutlined />}
                  onClick={onOpenInvite}
                >
                  <FormattedMessage
                    id="pages.users.invite"
                    defaultMessage="Invite"
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

export default UserTable;
