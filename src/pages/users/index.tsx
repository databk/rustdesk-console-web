import type { ActionType } from '@ant-design/pro-components';
import { PageContainer } from '@ant-design/pro-components';
import { FormattedMessage, useAccess, useIntl, useModel } from '@umijs/max';
import { App, Form } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import {
  batchForceLogout,
  batchUpdateUserStatus,
  createUser,
  deleteUser,
  forceLogoutUser,
  inviteUser,
  updateUser,
  updateUserSecurity,
} from '@/services/rustdesk-console/user';
import {
  getAllUserGroups,
  moveUsersToGroup,
} from '@/services/rustdesk-console/userGroup';
import CreateUserModal from './components/CreateUserModal';
import EditUserModal from './components/EditUserModal';
import ImportUsersModal from './components/ImportUsersModal';
import InviteUserModal from './components/InviteUserModal';
import MoveUserModal from './components/MoveUserModal';
import SecurityModal from './components/SecurityModal';
import { useUserColumns } from './components/UserColumns';
import UserRolesModal from './components/UserRolesModal';
import UserTable from './components/UserTable';
import type { UserListProps } from './types';
import {
  buildCreateUserPayload,
  buildInviteUserPayload,
  buildUpdateUserPayload,
} from './userPayload';

const UserList: React.FC<UserListProps> = ({
  userGroupGuid,
  title,
  onBack,
}) => {
  const intl = useIntl();
  const { message: msgApi } = App.useApp();
  const access = useAccess();
  const { initialState } = useModel('@@initialState');
  const currentUserGuid = initialState?.currentUser?.guid;

  const actionRef = useRef<ActionType>(null);

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [securityModalVisible, setSecurityModalVisible] = useState(false);
  const [rolesModalVisible, setRolesModalVisible] = useState(false);

  const [createForm] = Form.useForm<API.CreateUserParams>();
  const [inviteForm] = Form.useForm<API.InviteUserParams>();
  const [editForm] = Form.useForm<API.UpdateUserParams>();
  const [securityForm] = Form.useForm<API.UpdateUserSecurityParams>();

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<API.UserItem[]>([]);
  const [selectionBlocked, setSelectionBlocked] = useState(false);
  const [batchStatusUpdating, setBatchStatusUpdating] = useState(false);
  const [batchForceLoggingOut, setBatchForceLoggingOut] = useState(false);
  const [userGroups, setUserGroups] = useState<API.UserGroupItem[]>([]);
  const [userGroupsLoading, setUserGroupsLoading] = useState(false);

  const [editingUser, setEditingUser] = useState<API.UserItem | null>(null);

  const [destinationGuid, setDestinationGuid] = useState<string>();
  const [moving, setMoving] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [moveUser, setMoveUser] = useState<API.UserItem | null>(null);
  const [moveDestinationGuid, setMoveDestinationGuid] = useState<string>();

  const loadUserGroups = async () => {
    if (!access.canUserGroupsMembership) return [];
    if (userGroups.length > 0) return userGroups;
    setUserGroupsLoading(true);
    try {
      const groups = await getAllUserGroups();
      setUserGroups(groups);
      return groups;
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.userGroups.loadFailed',
          defaultMessage: 'Failed to load user groups',
        }),
      );
      return [];
    } finally {
      setUserGroupsLoading(false);
    }
  };

  useEffect(() => {
    if (!userGroupGuid || !access.canUserGroupsMembership) return;
    void loadUserGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userGroupGuid, access.canUserGroupsMembership]);

  const handleMove = async (targetGuid: string, userGuids: string[]) => {
    if (
      !targetGuid ||
      userGuids.length === 0 ||
      (!access.isSuperAdmin &&
        selectedRows.some((row) => row.is_admin || row.is_protected === true))
    ) {
      setSelectedRowKeys([]);
      setSelectedRows([]);
      setSelectionBlocked(false);
      return;
    }
    setMoving(true);
    try {
      const result = await moveUsersToGroup(targetGuid, userGuids);
      msgApi.success(
        intl.formatMessage(
          {
            id: 'pages.userGroups.membersUpdated',
            defaultMessage: 'Updated {count} user(s)',
          },
          { count: result.moved_user_count },
        ),
      );
      setSelectedRowKeys([]);
      setSelectedRows([]);
      setDestinationGuid(undefined);
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.userGroups.membersUpdateFailed',
          defaultMessage: 'Failed to update group members',
        }),
      );
    } finally {
      setMoving(false);
    }
  };

  const openCreateModal = () => {
    setCreateModalVisible(true);
    if (!access.canUserGroupsMembership) return;
    void loadUserGroups().then((groups) => {
      const defaultGroup = groups.find((group) => group.is_default);
      createForm.setFieldValue('user_group_guid', defaultGroup?.guid);
    });
  };

  const openInviteModal = () => {
    setInviteModalVisible(true);
    if (!access.canUserGroupsMembership) return;
    void loadUserGroups().then((groups) => {
      const defaultGroup = groups.find((group) => group.is_default);
      inviteForm.setFieldValue('user_group_guid', defaultGroup?.guid);
    });
  };

  const handleCreate = async (values: API.CreateUserParams) => {
    try {
      await createUser(
        buildCreateUserPayload(values, access.canUserGroupsMembership),
      );
      msgApi.success(
        intl.formatMessage({
          id: 'pages.users.createSuccess',
          defaultMessage: 'User created',
        }),
      );
      setCreateModalVisible(false);
      createForm.resetFields();
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.users.createFailed',
          defaultMessage: 'Failed to create user',
        }),
      );
    }
  };

  const handleInvite = async (values: API.InviteUserParams) => {
    try {
      await inviteUser(
        buildInviteUserPayload(values, access.canUserGroupsMembership),
      );
      msgApi.success(
        intl.formatMessage({
          id: 'pages.users.inviteSuccess',
          defaultMessage: 'Invitation sent',
        }),
      );
      setInviteModalVisible(false);
      inviteForm.resetFields();
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.users.inviteFailed',
          defaultMessage: 'Failed to send invitation',
        }),
      );
    }
  };

  const handleEdit = async (values: API.UpdateUserParams) => {
    if (!editingUser) return;
    try {
      await updateUser(
        editingUser.guid,
        buildUpdateUserPayload(values, {
          canEditProfile: access.canUsersEdit,
          canEditStatus: access.canUsersStatus,
          canEditGroup: access.canUserGroupsMembership,
          canEditAdmin: access.isSuperAdmin,
        }),
      );
      msgApi.success(
        intl.formatMessage({
          id: 'pages.users.updateSuccess',
          defaultMessage: 'User updated',
        }),
      );
      setEditModalVisible(false);
      setEditingUser(null);
      editForm.resetFields();
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.users.updateFailed',
          defaultMessage: 'Failed to update user',
        }),
      );
    }
  };

  const handleDelete = async (guid: string) => {
    try {
      await deleteUser(guid);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.users.deleteSuccess',
          defaultMessage: 'User deleted',
        }),
      );
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.users.deleteFailed',
          defaultMessage: 'Failed to delete user',
        }),
      );
    }
  };

  const handleUpdateSecurity = async (values: API.UpdateUserSecurityParams) => {
    if (!editingUser) return;
    try {
      await updateUserSecurity(editingUser.guid, values);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.users.securityUpdateSuccess',
          defaultMessage: 'Security settings updated',
        }),
      );
      setSecurityModalVisible(false);
      setEditingUser(null);
      securityForm.resetFields();
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.users.securityUpdateFailed',
          defaultMessage: 'Failed to update security settings',
        }),
      );
    }
  };

  const handleForceLogout = async (guid: string) => {
    try {
      await forceLogoutUser(guid);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.users.forceLogoutSuccess',
          defaultMessage: 'Force logout successful',
        }),
      );
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.users.forceLogoutFailed',
          defaultMessage: 'Failed to force logout',
        }),
      );
    }
  };

  const handleBatchEnable = async () => {
    if (selectedRows.length === 0 || selectionBlocked) return;
    setBatchStatusUpdating(true);
    try {
      const userGuids = selectedRows.map((row) => row.guid);
      const result = await batchUpdateUserStatus({
        user_guids: userGuids,
        status: 1,
      });
      if (result.failedCount > 0) {
        msgApi.warning(
          intl.formatMessage(
            {
              id: 'pages.users.batchEnablePartialFailed',
              defaultMessage:
                'Successfully enabled {success} user(s), {failed} failed',
            },
            { success: result.succeededCount, failed: result.failedCount },
          ),
        );
      } else {
        msgApi.success(
          intl.formatMessage(
            {
              id: 'pages.users.batchEnableSuccess',
              defaultMessage: 'Successfully enabled {count} user(s)',
            },
            { count: result.succeededCount },
          ),
        );
      }
      setSelectedRowKeys([]);
      setSelectedRows([]);
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.users.batchEnableFailed',
          defaultMessage: 'Failed to enable users',
        }),
      );
    } finally {
      setBatchStatusUpdating(false);
    }
  };

  const handleBatchDisable = async () => {
    if (selectedRows.length === 0 || selectionBlocked) return;
    setBatchStatusUpdating(true);
    try {
      const userGuids = selectedRows.map((row) => row.guid);
      const result = await batchUpdateUserStatus({
        user_guids: userGuids,
        status: 0,
      });
      if (result.failedCount > 0) {
        msgApi.warning(
          intl.formatMessage(
            {
              id: 'pages.users.batchDisablePartialFailed',
              defaultMessage:
                'Successfully disabled {success} user(s), {failed} failed',
            },
            { success: result.succeededCount, failed: result.failedCount },
          ),
        );
      } else {
        msgApi.success(
          intl.formatMessage(
            {
              id: 'pages.users.batchDisableSuccess',
              defaultMessage: 'Successfully disabled {count} user(s)',
            },
            { count: result.succeededCount },
          ),
        );
      }
      setSelectedRowKeys([]);
      setSelectedRows([]);
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.users.batchDisableFailed',
          defaultMessage: 'Failed to disable users',
        }),
      );
    } finally {
      setBatchStatusUpdating(false);
    }
  };

  const handleBatchForceLogout = async () => {
    if (selectedRows.length === 0 || selectionBlocked) return;
    setBatchForceLoggingOut(true);
    try {
      const userGuids = selectedRows.map((row) => row.guid);
      await batchForceLogout({ user_guids: userGuids });
      msgApi.success(
        intl.formatMessage({
          id: 'pages.users.batchForceLogoutSuccess',
          defaultMessage: 'Force logout successful',
        }),
      );
      setSelectedRowKeys([]);
      setSelectedRows([]);
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.users.batchForceLogoutFailed',
          defaultMessage: 'Failed to force logout',
        }),
      );
    } finally {
      setBatchForceLoggingOut(false);
    }
  };

  const openEditModal = (record: API.UserItem) => {
    setEditingUser(record);
    editForm.resetFields();
    if (access.canUserGroupsMembership) void loadUserGroups();
    editForm.setFieldsValue({
      ...(access.canUsersEdit
        ? {
            name: record.name,
            display_name: record.display_name,
            email: record.email,
            note: record.note,
          }
        : {}),
      ...(access.canUsersStatus ? { status: record.status } : {}),
      ...(access.canUserGroupsMembership
        ? { user_group_guid: record.user_group_guid }
        : {}),
      ...(access.isSuperAdmin ? { is_admin: record.is_admin } : {}),
    });
    setEditModalVisible(true);
  };

  const openSecurityModal = (record: API.UserItem) => {
    setEditingUser(record);
    securityForm.resetFields();
    setSecurityModalVisible(true);
  };

  const openRolesModal = (record: API.UserItem) => {
    setEditingUser(record);
    setRolesModalVisible(true);
  };

  const columns = useUserColumns({
    userGroupGuid,
    isSuperAdmin: access.isSuperAdmin,
    canEdit:
      access.canUsersEdit ||
      access.canUsersStatus ||
      access.canUserGroupsMembership ||
      access.isSuperAdmin,
    canSecurity: access.canUsersSecurity,
    canForceLogout: access.canUsersForceLogout,
    canDelete: access.canUsersDelete,
    canMove: access.canUserGroupsMembership,
    canRolesAssign: access.canRolesAssign,
    canRolesView: access.canRolesView,
    canUsersView: access.canUsersView,
    currentUserGuid,
    onEdit: openEditModal,
    onRoles: openRolesModal,
    onSecurity: openSecurityModal,
    onForceLogout: handleForceLogout,
    onDelete: handleDelete,
    onMove: (record) => {
      setMoveUser(record);
      setMoveDestinationGuid(undefined);
    },
  });

  return (
    <PageContainer
      title={
        title || (
          <FormattedMessage id="pages.users.list" defaultMessage="User List" />
        )
      }
      onBack={onBack}
    >
      <UserTable
        userGroupGuid={userGroupGuid}
        columns={columns}
        actionRef={actionRef}
        selectedRowKeys={selectedRowKeys}
        selectedRows={selectedRows}
        onSelectionChange={(_keys, rows) => {
          const manageableRows = access.isSuperAdmin
            ? rows
            : rows.filter((row) => !row.is_admin && row.is_protected !== true);
          setSelectedRowKeys(manageableRows.map((row) => row.guid));
          setSelectedRows(manageableRows);
          setSelectionBlocked(
            !access.isSuperAdmin &&
              rows.some((row) => row.is_admin || row.is_protected === true),
          );
        }}
        selectionBlocked={selectionBlocked}
        isSuperAdmin={access.isSuperAdmin}
        canUsersCreate={access.canUsersCreate}
        canUsersStatus={access.canUsersStatus}
        canUsersForceLogout={access.canUsersForceLogout}
        canUserGroupsMembership={access.canUserGroupsMembership}
        userGroups={userGroups}
        userGroupsLoading={userGroupsLoading}
        destinationGuid={destinationGuid}
        moving={moving}
        batchStatusUpdating={batchStatusUpdating}
        batchForceLoggingOut={batchForceLoggingOut}
        onDestinationChange={setDestinationGuid}
        onBatchMove={() =>
          destinationGuid &&
          handleMove(
            destinationGuid,
            selectedRows.map((r) => r.guid),
          )
        }
        onBatchEnable={handleBatchEnable}
        onBatchDisable={handleBatchDisable}
        onBatchForceLogout={handleBatchForceLogout}
        onOpenImport={() => setImportModalVisible(true)}
        onOpenCreate={openCreateModal}
        onOpenInvite={openInviteModal}
      />

      <CreateUserModal
        visible={createModalVisible}
        canEditGroup={access.canUserGroupsMembership}
        userGroups={userGroups}
        userGroupsLoading={userGroupsLoading}
        form={createForm}
        onSubmit={handleCreate}
        onCancel={() => setCreateModalVisible(false)}
      />

      <InviteUserModal
        visible={inviteModalVisible}
        canEditGroup={access.canUserGroupsMembership}
        userGroups={userGroups}
        userGroupsLoading={userGroupsLoading}
        form={inviteForm}
        onSubmit={handleInvite}
        onCancel={() => setInviteModalVisible(false)}
      />

      <EditUserModal
        visible={editModalVisible}
        canEditProfile={access.canUsersEdit}
        canEditStatus={access.canUsersStatus}
        canEditGroup={access.canUserGroupsMembership}
        canEditAdmin={access.isSuperAdmin}
        userGroups={userGroups}
        userGroupsLoading={userGroupsLoading}
        form={editForm}
        onSubmit={handleEdit}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingUser(null);
          editForm.resetFields();
        }}
      />

      <SecurityModal
        visible={securityModalVisible}
        form={securityForm}
        onSubmit={handleUpdateSecurity}
        thirdAuthType={editingUser?.third_auth_type}
        onCancel={() => {
          setSecurityModalVisible(false);
          setEditingUser(null);
          securityForm.resetFields();
        }}
      />

      {userGroupGuid && access.canUserGroupsMembership && (
        <ImportUsersModal
          open={importModalVisible}
          userGroupGuid={userGroupGuid}
          onCancel={() => setImportModalVisible(false)}
          onSuccess={() => actionRef.current?.reload()}
        />
      )}

      <MoveUserModal
        visible={!!moveUser}
        userGroups={userGroups}
        userGroupsLoading={userGroupsLoading}
        currentGroupGuid={userGroupGuid}
        destinationGuid={moveDestinationGuid}
        onDestinationChange={setMoveDestinationGuid}
        onOk={() => {
          if (moveUser && moveDestinationGuid) {
            void handleMove(moveDestinationGuid, [moveUser.guid]);
            setMoveUser(null);
            setMoveDestinationGuid(undefined);
          }
        }}
        onCancel={() => {
          setMoveUser(null);
          setMoveDestinationGuid(undefined);
        }}
      />

      <UserRolesModal
        open={rolesModalVisible}
        user={editingUser}
        onOpenChange={(open) => {
          setRolesModalVisible(open);
          if (!open) setEditingUser(null);
        }}
        onSuccess={() => actionRef.current?.reload()}
        readOnly={access.isSuperAdmin && editingUser?.is_admin === true}
        canManageTarget={
          access.isSuperAdmin ||
          (access.canRolesAssign &&
            editingUser?.is_protected !== true &&
            editingUser?.guid !== currentUserGuid)
        }
      />
    </PageContainer>
  );
};

export default UserList;
