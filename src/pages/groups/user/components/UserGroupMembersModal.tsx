import { SwapOutlined, UsergroupAddOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { App, Button, Modal, Select, Tabs, Tooltip } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { getAdminUserList } from '@/services/rustdesk-console/user';
import {
  getAllUserGroups,
  getUserGroupUsers,
  moveUsersToGroup,
} from '@/services/rustdesk-console/userGroup';
import {
  filterManageableSelection,
  isCurrentRequest,
} from './userGroupMemberSelection';
import { DEFAULT_PAGINATION, toTableResult } from '@/utils/pagination';

interface UserGroupMembersModalProps {
  open: boolean;
  group: API.UserGroupItem | null;
  isSuperAdmin: boolean;
  canViewUsers: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}

const UserGroupMembersModal: React.FC<UserGroupMembersModalProps> = ({
  open,
  group,
  isSuperAdmin,
  canViewUsers,
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
  const requestVersionRef = useRef(0);
  const [memberRows, setMemberRows] = useState<API.UserItem[]>([]);
  const [userRows, setUserRows] = useState<API.UserItem[]>([]);
  const memberRowsCacheRef = useRef(new Map<string, API.UserItem>());
  const userRowsCacheRef = useRef(new Map<string, API.UserItem>());
  const protectedAccountInfo = intl.formatMessage({
    id: 'pages.users.protectedAccountInfo',
    defaultMessage:
      'Protected accounts can only be managed by the super administrator.',
  });

  useEffect(() => {
    const cachedRows = [...memberRowsCacheRef.current.values()];
    setMemberKeys((keys) =>
      filterManageableSelection(keys, cachedRows, isSuperAdmin),
    );
  }, [isSuperAdmin]);

  useEffect(() => {
    const cachedRows = [...userRowsCacheRef.current.values()];
    setUserKeys((keys) =>
      filterManageableSelection(keys, cachedRows, isSuperAdmin),
    );
  }, [isSuperAdmin]);

  useEffect(() => {
    const requestVersion = ++requestVersionRef.current;
    setMemberKeys([]);
    setUserKeys([]);
    setDestinationGuid(undefined);
    setMemberRows([]);
    setUserRows([]);
    memberRowsCacheRef.current = new Map();
    userRowsCacheRef.current = new Map();
    setGroupsLoading(false);
    setMoving(false);
    if (!open) return;
    setGroupsLoading(true);
    getAllUserGroups()
      .then((nextGroups) => {
        if (isCurrentRequest(requestVersion, requestVersionRef.current)) {
          setGroups(nextGroups);
        }
      })
      .catch(() => {
        if (!isCurrentRequest(requestVersion, requestVersionRef.current))
          return;
        msgApi.error(
          intl.formatMessage({
            id: 'pages.userGroups.loadFailed',
            defaultMessage: 'Failed to load user groups',
          }),
        );
      })
      .finally(() => {
        if (isCurrentRequest(requestVersion, requestVersionRef.current)) {
          setGroupsLoading(false);
        }
      });
    return () => {
      requestVersionRef.current += 1;
    };
  }, [group?.guid, intl, msgApi, open]);

  const handleMove = async (targetGuid: string, keys: React.Key[]) => {
    const rows = [
      ...memberRowsCacheRef.current.values(),
      ...userRowsCacheRef.current.values(),
    ];
    const manageableKeys = filterManageableSelection(keys, rows, isSuperAdmin);
    if (
      !group ||
      manageableKeys.length === 0 ||
      manageableKeys.length !== keys.length ||
      (!isSuperAdmin &&
        !manageableKeys.every((key) =>
          rows.some((row) => row.guid === String(key)),
        ))
    ) {
      setMemberKeys([]);
      setUserKeys([]);
      return;
    }
    const requestVersion = requestVersionRef.current;
    setMoving(true);
    try {
      const result = await moveUsersToGroup(
        targetGuid,
        manageableKeys.map(String),
      );
      if (!isCurrentRequest(requestVersion, requestVersionRef.current)) return;
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
      if (!isCurrentRequest(requestVersion, requestVersionRef.current)) return;
      msgApi.error(
        intl.formatMessage({
          id: 'pages.userGroups.membersUpdateFailed',
          defaultMessage: 'Failed to update group members',
        }),
      );
    } finally {
      if (isCurrentRequest(requestVersion, requestVersionRef.current)) {
        setMoving(false);
      }
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
        const requestVersion = requestVersionRef.current;
        const result = await getUserGroupUsers(group.guid, {
          current: params.current,
          pageSize: params.pageSize,
          search: params.name,
        });
        if (!isCurrentRequest(requestVersion, requestVersionRef.current)) {
          return { data: [], total: 0, success: false };
        }
        setMemberRows(result.data);
        for (const row of result.data) {
          memberRowsCacheRef.current.set(row.guid, row);
        }
        return toTableResult(result);
      }}
      columns={columns.map((column) =>
        column.dataIndex === 'email' ? { ...column, search: false } : column,
      )}
      rowSelection={{
        selectedRowKeys: memberKeys,
        preserveSelectedRowKeys: true,
        getCheckboxProps: (record) => ({
          disabled:
            !isSuperAdmin && (record.is_admin || record.is_protected === true),
        }),
        onChange: (keys) =>
          setMemberKeys(
            filterManageableSelection(
              keys,
              [...memberRowsCacheRef.current.values()],
              isSuperAdmin,
            ),
          ),
      }}
      tableAlertRender={false}
      search={{ filterType: 'light' }}
      pagination={{ ...DEFAULT_PAGINATION, defaultPageSize: 10 }}
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
        <Tooltip
          key="move-tip"
          title={
            memberKeys.length === 0 &&
            memberRows.some((row) => row.is_protected)
              ? protectedAccountInfo
              : undefined
          }
        >
          <span>
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
            </Button>
          </span>
        </Tooltip>,
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
        const requestVersion = requestVersionRef.current;
        const result = await getAdminUserList({
          current: params.current || 1,
          pageSize: params.pageSize || 10,
          name: params.name,
          email: params.email,
        });
        if (!isCurrentRequest(requestVersion, requestVersionRef.current)) {
          return { data: [], total: 0, success: false };
        }
        setUserRows(result.data);
        for (const row of result.data) {
          userRowsCacheRef.current.set(row.guid, row);
        }
        return toTableResult(result);
      }}
      columns={columns}
      rowSelection={{
        selectedRowKeys: userKeys,
        preserveSelectedRowKeys: true,
        getCheckboxProps: (record) => ({
          disabled:
            record.user_group_guid === group?.guid ||
            (!isSuperAdmin &&
              (record.is_admin || record.is_protected === true)),
        }),
        onChange: (keys) =>
          setUserKeys(
            filterManageableSelection(
              keys,
              [...userRowsCacheRef.current.values()],
              isSuperAdmin,
            ),
          ),
      }}
      tableAlertRender={false}
      search={{ filterType: 'light' }}
      pagination={{ ...DEFAULT_PAGINATION, defaultPageSize: 10 }}
      options={{ density: false, setting: false, reload: true }}
      toolBarRender={() => [
        <Tooltip
          key="add-tip"
          title={
            userKeys.length === 0 && userRows.some((row) => row.is_protected)
              ? protectedAccountInfo
              : undefined
          }
        >
          <span>
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
            </Button>
          </span>
        </Tooltip>,
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
      onCancel={() => {
        requestVersionRef.current += 1;
        onOpenChange(false);
      }}
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
          ...(canViewUsers
            ? [
                {
                  key: 'add',
                  label: intl.formatMessage({
                    id: 'pages.userGroups.addUsers',
                    defaultMessage: 'Add users',
                  }),
                  children: addUsersTable,
                },
              ]
            : []),
        ]}
      />
    </Modal>
  );
};

export default UserGroupMembersModal;
