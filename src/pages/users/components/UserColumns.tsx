import {
  DeleteOutlined,
  EditOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined,
  SafetyOutlined,
  SwapOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Button, Divider, Popconfirm, Space, Tooltip } from 'antd';
import React from 'react';
import { getUserColumns } from '@/components/UserSelectTable/columns';
import {
  canShowRoleAssignmentEntry,
  formatUserRoleNames,
  isCurrentUserTarget,
  isRoleAssignmentTargetDisabled,
} from './userRoleAssignment';

interface UseUserColumnsOptions {
  userGroupGuid?: string;
  isSuperAdmin: boolean;
  canEdit: boolean;
  canSecurity: boolean;
  canForceLogout: boolean;
  canDelete: boolean;
  canMove: boolean;
  canRolesAssign: boolean;
  canRolesView: boolean;
  canUsersView: boolean;
  currentUserGuid?: string;
  onEdit: (record: API.UserItem) => void;
  onRoles: (record: API.UserItem) => void;
  onSecurity: (record: API.UserItem) => void;
  onForceLogout: (guid: string) => void;
  onDelete: (guid: string) => void;
  onMove: (record: API.UserItem) => void;
}

export const useUserColumns = (
  options: UseUserColumnsOptions,
): ProColumns<API.UserItem>[] => {
  const intl = useIntl();
  const {
    userGroupGuid,
    isSuperAdmin,
    canEdit,
    canSecurity,
    canForceLogout,
    canDelete,
    canMove,
    canRolesAssign,
    canRolesView,

    currentUserGuid,
    onEdit,
    onRoles,
    onSecurity,
    onForceLogout,
    onDelete,
    onMove,
  } = options;

  const baseColumns = getUserColumns();
  const protectedTooltip = (record: API.UserItem) =>
    !isSuperAdmin && record.is_protected === true
      ? intl.formatMessage({
          id: 'pages.users.protectedAccountInfo',
          defaultMessage:
            'Protected accounts can only be managed by the super administrator.',
        })
      : undefined;

  const actionColumn: ProColumns<API.UserItem> = {
    title: (
      <FormattedMessage id="pages.common.action" defaultMessage="Action" />
    ),
    valueType: 'option',
    width: 220,
    fixed: 'right',
    hideInTable: userGroupGuid
      ? !canMove
      : !isSuperAdmin &&
        !canEdit &&
        !canSecurity &&
        !canForceLogout &&
        !canDelete &&
        !canRolesAssign,
    render: (_: unknown, record: API.UserItem) =>
      userGroupGuid ? (
        canMove ? (
          <Tooltip title={protectedTooltip(record)}>
            <span>
              <Button
                type="link"
                size="small"
                icon={<SwapOutlined />}
                onClick={() => onMove(record)}
                disabled={!isSuperAdmin && record.is_protected === true}
              >
                <FormattedMessage
                  id="pages.userGroups.move"
                  defaultMessage="Move"
                />
              </Button>
            </span>
          </Tooltip>
        ) : null
      ) : (
        <Space size={0} separator={<Divider orientation="vertical" />}>
          {record.is_protected && (
            <Tooltip
              title={intl.formatMessage({
                id: 'pages.users.protectedAccountInfo',
                defaultMessage:
                  'Protected accounts can only be managed by the super administrator.',
              })}
            >
              <SafetyCertificateOutlined
                aria-label={intl.formatMessage({
                  id: 'pages.users.protectedAccount',
                  defaultMessage: 'Protected account',
                })}
              />
            </Tooltip>
          )}
          {canEdit && (isSuperAdmin || !record.is_admin) && (
            <Tooltip title={protectedTooltip(record)}>
              <span>
                <Button
                  key="edit"
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => onEdit(record)}
                  disabled={!isSuperAdmin && record.is_protected === true}
                >
                  <FormattedMessage
                    id="pages.common.edit"
                    defaultMessage="Edit"
                  />
                </Button>
              </span>
            </Tooltip>
          )}
          {canShowRoleAssignmentEntry(isSuperAdmin, canRolesAssign, record) && (
            <Tooltip
              title={
                isRoleAssignmentTargetDisabled(
                  isSuperAdmin,
                  currentUserGuid,
                  record,
                )
                  ? intl.formatMessage({
                      id: record.is_admin
                        ? 'pages.users.roleEligibility.super_admin_target'
                        : isCurrentUserTarget(currentUserGuid, record.guid)
                          ? 'pages.users.roleEligibility.self_target'
                          : 'pages.users.roleEligibility.protected_target',
                      defaultMessage: 'Role assignment is unavailable',
                    })
                  : undefined
              }
            >
              <span>
                <Button
                  key="roles"
                  type="link"
                  size="small"
                  icon={<TeamOutlined />}
                  onClick={() => onRoles(record)}
                  disabled={isRoleAssignmentTargetDisabled(
                    isSuperAdmin,
                    currentUserGuid,
                    record,
                  )}
                >
                  <FormattedMessage
                    id="pages.users.roles"
                    defaultMessage="Roles"
                  />
                </Button>
              </span>
            </Tooltip>
          )}
          {canSecurity && (isSuperAdmin || !record.is_admin) && (
            <Tooltip title={protectedTooltip(record)}>
              <span>
                <Button
                  key="security"
                  type="link"
                  size="small"
                  icon={<SafetyOutlined />}
                  onClick={() => onSecurity(record)}
                  disabled={!isSuperAdmin && record.is_protected === true}
                >
                  <FormattedMessage
                    id="pages.users.security"
                    defaultMessage="Security"
                  />
                </Button>
              </span>
            </Tooltip>
          )}
          {canForceLogout && (isSuperAdmin || !record.is_admin) && (
            <Tooltip title={protectedTooltip(record)}>
              <span>
                <Button
                  key="logout"
                  type="link"
                  size="small"
                  icon={<LogoutOutlined />}
                  onClick={() => onForceLogout(record.guid)}
                  disabled={!isSuperAdmin && record.is_protected === true}
                >
                  <FormattedMessage
                    id="pages.users.forceLogout"
                    defaultMessage="Logout"
                  />
                </Button>
              </span>
            </Tooltip>
          )}
          {canDelete && (isSuperAdmin || !record.is_admin) && (
            <Popconfirm
              key="delete"
              title={
                <FormattedMessage
                  id="pages.users.deleteConfirm"
                  defaultMessage="Are you sure to delete this user?"
                />
              }
              onConfirm={() => onDelete(record.guid)}
              okText={intl.formatMessage({
                id: 'pages.common.confirm',
                defaultMessage: 'Yes',
              })}
              cancelText={intl.formatMessage({
                id: 'pages.common.cancel',
                defaultMessage: 'No',
              })}
            >
              <Tooltip title={protectedTooltip(record)}>
                <span>
                  <Button
                    type="link"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    disabled={!isSuperAdmin && record.is_protected === true}
                  >
                    <FormattedMessage
                      id="pages.common.delete"
                      defaultMessage="Delete"
                    />
                  </Button>
                </span>
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
  };

  const roleColumn: ProColumns<API.UserItem> = {
    title: <FormattedMessage id="pages.users.roles" defaultMessage="Roles" />,
    dataIndex: 'role_names',
    width: 180,
    search: false,
    ellipsis: true,
    render: (_: unknown, record) =>
      formatUserRoleNames(
        record,
        intl.formatMessage({
          id: 'pages.users.superAdmin',
          defaultMessage: 'Super administrator',
        }),
        intl.formatMessage({
          id: 'pages.users.normalUser',
          defaultMessage: 'Ordinary user',
        }),
      ),
  };

  return [
    ...baseColumns,
    ...(isSuperAdmin || canRolesView ? [roleColumn] : []),
    actionColumn,
  ];
};
