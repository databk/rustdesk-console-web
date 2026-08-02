import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { App, Modal } from 'antd';
import React, { useRef, useState } from 'react';
import { getAdminUserList } from '@/services/rustdesk-console/user';
import { moveUsersToGroup } from '@/services/rustdesk-console/userGroup';

export interface ImportUsersModalProps {
  open: boolean;
  userGroupGuid: string;
  onCancel: () => void;
  onSuccess: () => void;
}

const ImportUsersModal: React.FC<ImportUsersModalProps> = ({
  open,
  userGroupGuid,
  onCancel,
  onSuccess,
}) => {
  const intl = useIntl();
  const { message: msgApi } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [selectedUserKeys, setSelectedUserKeys] = useState<React.Key[]>([]);
  const [importing, setImporting] = useState(false);

  const columns: ProColumns<API.UserItem>[] = [
    {
      title: (
        <FormattedMessage id="pages.users.name" defaultMessage="Username" />
      ),
      dataIndex: 'name',
      ellipsis: true,
    },
    {
      title: <FormattedMessage id="pages.users.email" defaultMessage="Email" />,
      dataIndex: 'email',
      ellipsis: true,
      search: false,
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
      render: (_, record) => record.user_group_name || '-',
    },
  ];

  const handleImport = async () => {
    if (!userGroupGuid || selectedUserKeys.length === 0) return;
    setImporting(true);
    try {
      const result = await moveUsersToGroup(
        userGroupGuid,
        selectedUserKeys as string[],
      );
      msgApi.success(
        intl.formatMessage(
          {
            id: 'pages.userGroups.importSuccess',
            defaultMessage: 'Successfully imported {count} user(s)',
          },
          { count: result.moved_user_count },
        ),
      );
      handleCancel();
      onSuccess();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.userGroups.importFailed',
          defaultMessage: 'Failed to import users',
        }),
      );
    } finally {
      setImporting(false);
    }
  };

  const handleCancel = () => {
    setSelectedUserKeys([]);
    onCancel();
  };

  return (
    <Modal
      title={
        <FormattedMessage
          id="pages.userGroups.importUsers"
          defaultMessage="Import Users"
        />
      }
      open={open}
      onCancel={handleCancel}
      onOk={handleImport}
      okButtonProps={{
        loading: importing,
        disabled: selectedUserKeys.length === 0,
      }}
      width={780}
      destroyOnHidden
    >
      <ProTable<API.UserItem>
        actionRef={actionRef}
        rowKey="guid"
        size="small"
        columns={columns}
        request={async (params) => {
          const result = await getAdminUserList({
            current: params.current || 1,
            pageSize: params.pageSize || 10,
            name: params.name,
          });
          return {
            data: result.data || [],
            total: result.total || 0,
            success: true,
          };
        }}
        rowSelection={{
          selectedRowKeys: selectedUserKeys,
          preserveSelectedRowKeys: true,
          getCheckboxProps: (record) => ({
            disabled: record.user_group_guid === userGroupGuid,
          }),
          onChange: setSelectedUserKeys,
        }}
        tableAlertRender={false}
        search={{ filterType: 'light' }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
        options={{ density: false, setting: false, reload: true }}
        scroll={{ x: 520 }}
      />
    </Modal>
  );
};

export default ImportUsersModal;
