import { FormattedMessage, useIntl } from '@umijs/max';
import { Modal, Select } from 'antd';
import React from 'react';

interface MoveUserModalProps {
  visible: boolean;
  userGroups: API.UserGroupItem[];
  userGroupsLoading: boolean;
  currentGroupGuid?: string;
  destinationGuid: string | undefined;
  onDestinationChange: (guid: string | undefined) => void;
  onOk: () => void;
  onCancel: () => void;
}

const MoveUserModal: React.FC<MoveUserModalProps> = ({
  visible,
  userGroups,
  userGroupsLoading,
  currentGroupGuid,
  destinationGuid,
  onDestinationChange,
  onOk,
  onCancel,
}) => {
  const intl = useIntl();

  return (
    <Modal
      title={
        <FormattedMessage
          id="pages.userGroups.moveToGroup"
          defaultMessage="Move to group"
        />
      }
      open={visible}
      onCancel={onCancel}
      onOk={onOk}
      okButtonProps={{ disabled: !destinationGuid }}
      destroyOnHidden
    >
      <Select
        showSearch
        optionFilterProp="label"
        style={{ width: '100%' }}
        loading={userGroupsLoading}
        value={destinationGuid}
        onChange={onDestinationChange}
        placeholder={intl.formatMessage({
          id: 'pages.userGroups.selectDestination',
          defaultMessage: 'Select destination group',
        })}
        options={userGroups
          .filter((g) => g.guid !== currentGroupGuid)
          .map((g) => ({ label: g.name, value: g.guid }))}
      />
    </Modal>
  );
};

export default MoveUserModal;
