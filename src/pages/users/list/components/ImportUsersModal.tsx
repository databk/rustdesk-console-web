import { FormattedMessage, useIntl } from '@umijs/max';
import { App, Modal } from 'antd';
import React, { useState } from 'react';
import { moveUsersToGroup } from '@/services/rustdesk-console/userGroup';
import UserSelectTable from '@/components/UserSelectTable';

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
  const [selectedUserKeys, setSelectedUserKeys] = useState<React.Key[]>([]);
  const [importing, setImporting] = useState(false);

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
      width={1000}
      destroyOnHidden
    >
      <UserSelectTable
        selectedRowKeys={selectedUserKeys}
        onSelectionChange={setSelectedUserKeys}
        getCheckboxProps={(record) => ({
          disabled: record.user_group_guid === userGroupGuid,
        })}
      />
    </Modal>
  );
};

export default ImportUsersModal;
