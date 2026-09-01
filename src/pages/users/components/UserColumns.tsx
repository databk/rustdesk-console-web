import type { ProColumns } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Button, Divider, Popconfirm, Space } from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  LogoutOutlined,
  SafetyOutlined,
  SwapOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import React from 'react';
import { getUserColumns } from '@/components/UserSelectTable/columns';

interface UseUserColumnsOptions {
  userGroupGuid?: string;
  canEdit: boolean;
  canManageRoles: boolean;
  canManageSecurity: boolean;
  canForceLogout: boolean;
  canDelete: boolean;
  canMove: boolean;
  onEdit: (record: API.UserItem) => void;
  onManageRoles: (record: API.UserItem) => void;
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
    canEdit,
    canManageRoles,
    canManageSecurity,
    canForceLogout,
    canDelete,
    canMove,
    onEdit,
    onManageRoles,
    onSecurity,
    onForceLogout,
    onDelete,
    onMove,
  } = options;

  const baseColumns = getUserColumns();

  const actionColumn: ProColumns<API.UserItem> = {
    title: (
      <FormattedMessage id="pages.common.action" defaultMessage="Action" />
    ),
    valueType: 'option',
    width: 220,
    fixed: 'right',
    render: (_: unknown, record: API.UserItem) =>
      userGroupGuid ? (
        canMove ? (
          <Button
            type="link"
            size="small"
            icon={<SwapOutlined />}
            onClick={() => onMove(record)}
          >
            <FormattedMessage
              id="pages.userGroups.move"
              defaultMessage="Move"
            />
          </Button>
        ) : null
      ) : (
        <Space size={0} split={<Divider type="vertical" />}>
          {canEdit && (
            <Button
              key="edit"
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            >
              <FormattedMessage
                id="pages.common.edit"
                defaultMessage="Edit"
              />
            </Button>
          )}
          {canManageRoles && (
            <Button
              key="roles"
              type="link"
              size="small"
              icon={<TeamOutlined />}
              onClick={() => onManageRoles(record)}
            >
              <FormattedMessage id="pages.users.roles" defaultMessage="Roles" />
            </Button>
          )}
          {canManageSecurity && (
            <Button
              key="security"
              type="link"
              size="small"
              icon={<SafetyOutlined />}
              onClick={() => onSecurity(record)}
            >
              <FormattedMessage
                id="pages.users.security"
                defaultMessage="Security"
              />
            </Button>
          )}
          {canForceLogout && (
            <Button
              key="logout"
              type="link"
              size="small"
              icon={<LogoutOutlined />}
              onClick={() => onForceLogout(record.guid)}
            >
              <FormattedMessage
                id="pages.users.forceLogout"
                defaultMessage="Logout"
              />
            </Button>
          )}
          {canDelete && (
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
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
              >
                <FormattedMessage
                  id="pages.common.delete"
                  defaultMessage="Delete"
                />
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
  };

  return [...baseColumns, actionColumn];
};
