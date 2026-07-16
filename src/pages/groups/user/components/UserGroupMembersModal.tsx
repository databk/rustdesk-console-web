import { SwapOutlined, UsergroupAddOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { App, Button, Modal, Select, Tabs } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { getAdminUserList } from '@/services/rustdesk-console/user';
import {
  getAllUserGroups,
  getUserGroupUsers,
  moveUsersToGroup,
} from '@/services/rustdesk-console/userGroup';

interface UserGroupMembersModalProps {
  open: boolean;
  group: API.UserGroupItem | null;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}

const UserGroupMembersModal: React.FC<UserGroupMembersModalProps> = ({
  open,
  group,
  onOpenChange,
  onChanged,
}) => {
  const intl = useIntl();
  const { message: msgApi } = App.useApp();
  const membersActionRef = useRef<ActionType>(null);
  const usersActionRef = useRef<ActionType>(null);
  const [groups, setGroups] = useState<API.UserGroupItem[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [memberKeys, setMemberKeys] = useState<React.Key[]>([]);
  const [userKeys, setUserKeys] = useState<React.Key[]>([]);
  const [destinationGuid, setDestinationGuid] = useState<string>();
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMemberKeys([]);
    setUserKeys([]);
    setDestinationGuid(undefined);
    setGroupsLoading(true);
    getAllUserGroups()
      .then(setGroups)
      .catch(() => {
        msgApi.error(
          intl.formatMessage({
            id: 'pages.userGroups.loadFailed',
            defaultMessage: 'Failed to load user groups',
          }),
        );
      })
      .finally(() => setGroupsLoading(false));
  }, [open, group?.guid]);

  const handleMove = async (targetGuid: string, keys: React.Key[]) => {
    if (!group || keys.length === 0) return;
    setMoving(true);
    try {
      const result = await moveUsersToGroup(targetGuid, keys.map(String));
      msgApi.success(
        intl.formatMessage(
          {
            id: 'pages.userGroups.membersUpdated',
            defaultMessage: 'Updated {count} user(s)',
          },
          { count: result.moved_user_count },
        ),
      );
      setMemberKeys([]);
      setUserKeys([]);
      setDestinationGuid(undefined);
      membersActionRef.current?.reload();
      usersActionRef.current?.reload();
      onChanged();
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

  const memberTable = (
    <ProTable<API.UserItem>
      actionRef={membersActionRef}
      rowKey="guid"
      size="small"
      request={async (params) => {
        if (!group) return { data: [], total: 0, success: true };
        const result = await getUserGroupUsers(group.guid, {
          current: params.current,
          pageSize: params.pageSize,
          search: params.name,
        });
        return {
          data: result.data || [],
          total: result.total || 0,
          success: true,
        };
      }}
      columns={columns.map((column) =>
        column.dataIndex === 'email' ? { ...column, search: false } : column,
      )}
      rowSelection={{
        selectedRowKeys: memberKeys,
        preserveSelectedRowKeys: true,
        onChange: setMemberKeys,
      }}
      tableAlertRender={false}
      search={{ filterType: 'light' }}
      pagination={{ defaultPageSize: 10, showSizeChanger: true }}
      options={{ density: false, setting: false, reload: true }}
      toolBarRender={() => [
        <Select
          key="destination"
          aria-label={intl.formatMessage({
            id: 'pages.userGroups.destination',
            defaultMessage: 'Destination group',
          })}
          loading={groupsLoading}
          value={destinationGuid}
          onChange={setDestinationGuid}
          placeholder={intl.formatMessage({
            id: 'pages.userGroups.selectDestination',
            defaultMessage: 'Select destination group',
          })}
          options={groups
            .filter((item) => item.guid !== group?.guid)
            .map((item) => ({ label: item.name, value: item.guid }))}
          style={{ width: 200 }}
        />,
        <Button
          key="move"
          type="primary"
          icon={<SwapOutlined />}
          disabled={!destinationGuid || memberKeys.length === 0}
          loading={moving}
          onClick={() =>
            destinationGuid && handleMove(destinationGuid, memberKeys)
          }
        >
          <FormattedMessage
            id="pages.userGroups.moveSelected"
            defaultMessage="Move selected"
          />
        </Button>,
      ]}
      scroll={{ x: 620 }}
    />
  );

  const addUsersTable = (
    <ProTable<API.UserItem>
      actionRef={usersActionRef}
      rowKey="guid"
      size="small"
      request={async (params) => {
        const result = await getAdminUserList({
          current: params.current || 1,
          pageSize: params.pageSize || 10,
          name: params.name,
          email: params.email,
        });
        return {
          data: result.data || [],
          total: result.total || 0,
          success: true,
        };
      }}
      columns={columns}
      rowSelection={{
        selectedRowKeys: userKeys,
        preserveSelectedRowKeys: true,
        getCheckboxProps: (record) => ({
          disabled: record.user_group_guid === group?.guid,
        }),
        onChange: setUserKeys,
      }}
      tableAlertRender={false}
      search={{ filterType: 'light' }}
      pagination={{ defaultPageSize: 10, showSizeChanger: true }}
      options={{ density: false, setting: false, reload: true }}
      toolBarRender={() => [
        <Button
          key="add"
          type="primary"
          icon={<UsergroupAddOutlined />}
          disabled={!group || userKeys.length === 0}
          loading={moving}
          onClick={() => group && handleMove(group.guid, userKeys)}
        >
          <FormattedMessage
            id="pages.userGroups.addSelected"
            defaultMessage="Add selected users"
          />
        </Button>,
      ]}
      scroll={{ x: 620 }}
    />
  );

  return (
    <Modal
      title={intl.formatMessage(
        {
          id: 'pages.userGroups.membersTitle',
          defaultMessage: '{name} members',
        },
        { name: group?.name || '' },
      )}
      open={open}
      width={780}
      footer={null}
      destroyOnHidden
      onCancel={() => onOpenChange(false)}
    >
      <Tabs
        size="small"
        tabBarStyle={{ marginBottom: 8 }}
        items={[
          {
            key: 'members',
            label: intl.formatMessage({
              id: 'pages.userGroups.currentMembers',
              defaultMessage: 'Current members',
            }),
            children: memberTable,
          },
          {
            key: 'add',
            label: intl.formatMessage({
              id: 'pages.userGroups.addUsers',
              defaultMessage: 'Add users',
            }),
            children: addUsersTable,
          },
        ]}
      />
    </Modal>
  );
};

export default UserGroupMembersModal;
