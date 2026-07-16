import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { FormattedMessage, useIntl } from '@umijs/max';
import { App, Button, Modal, Popconfirm, Select, Space, Table } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addRule,
  deleteRules,
  getAllRules,
  updateRule,
} from '@/services/rustdesk-console/addressBook';
import { getAllUserGroups } from '@/services/rustdesk-console/userGroup';

interface UserGroupAccessModalProps {
  open: boolean;
  addressBook: API.SharedAddressBook | null;
  onOpenChange: (open: boolean) => void;
}

const UserGroupAccessModal: React.FC<UserGroupAccessModalProps> = ({
  open,
  addressBook,
  onOpenChange,
}) => {
  const intl = useIntl();
  const { message: msgApi } = App.useApp();
  const [groups, setGroups] = useState<API.UserGroupItem[]>([]);
  const [rules, setRules] = useState<API.RuleItem[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>();
  const [selectedRule, setSelectedRule] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const permissionOptions = useMemo(
    () => [
      {
        value: 1 as const,
        label: intl.formatMessage({
          id: 'pages.addressBook.permissionRead',
          defaultMessage: 'Read only',
        }),
      },
      {
        value: 2 as const,
        label: intl.formatMessage({
          id: 'pages.addressBook.permissionReadWrite',
          defaultMessage: 'Read and write',
        }),
      },
      {
        value: 3 as const,
        label: intl.formatMessage({
          id: 'pages.addressBook.permissionFull',
          defaultMessage: 'Full control',
        }),
      },
    ],
    [intl],
  );

  const load = useCallback(async () => {
    if (!open || !addressBook) return;
    setLoading(true);
    try {
      const [groupList, result] = await Promise.all([
        getAllUserGroups(),
        getAllRules(addressBook.guid),
      ]);
      setGroups(groupList);
      setRules(result.filter((rule) => !!rule.group));
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.addressBook.groupAccessLoadFailed',
          defaultMessage: 'Failed to load group access',
        }),
      );
    } finally {
      setLoading(false);
    }
  }, [open, addressBook?.guid]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAdd = async () => {
    if (!addressBook || !selectedGroup) return;
    setSaving(true);
    try {
      await addRule({
        guid: addressBook.guid,
        group: selectedGroup,
        rule: selectedRule,
      });
      setSelectedGroup(undefined);
      setSelectedRule(1);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.addressBook.groupAccessAdded',
          defaultMessage: 'Group access added',
        }),
      );
      await load();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.addressBook.groupAccessAddFailed',
          defaultMessage: 'Failed to add group access',
        }),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (guid: string, rule: 1 | 2 | 3) => {
    setSaving(true);
    try {
      await updateRule({ guid, rule });
      setRules((current) =>
        current.map((item) => (item.guid === guid ? { ...item, rule } : item)),
      );
      msgApi.success(
        intl.formatMessage({
          id: 'pages.addressBook.groupAccessUpdated',
          defaultMessage: 'Group access updated',
        }),
      );
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.addressBook.groupAccessUpdateFailed',
          defaultMessage: 'Failed to update group access',
        }),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (guid: string) => {
    setSaving(true);
    try {
      await deleteRules([guid]);
      setRules((current) => current.filter((item) => item.guid !== guid));
      msgApi.success(
        intl.formatMessage({
          id: 'pages.addressBook.groupAccessDeleted',
          defaultMessage: 'Group access deleted',
        }),
      );
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.addressBook.groupAccessDeleteFailed',
          defaultMessage: 'Failed to delete group access',
        }),
      );
    } finally {
      setSaving(false);
    }
  };

  const groupNames = new Map(groups.map((group) => [group.guid, group.name]));
  const assignedGroups = new Set(rules.map((rule) => rule.group));

  return (
    <Modal
      title={intl.formatMessage(
        {
          id: 'pages.addressBook.groupAccessTitle',
          defaultMessage: '{name} group access',
        },
        { name: addressBook?.name || '' },
      )}
      open={open}
      width={720}
      footer={null}
      destroyOnHidden
      onCancel={() => onOpenChange(false)}
      afterClose={() => {
        setSelectedGroup(undefined);
        setSelectedRule(1);
        setRules([]);
      }}
    >
      <Space wrap style={{ marginBottom: 16 }}>
        <Select
          aria-label={intl.formatMessage({
            id: 'pages.addressBook.userGroup',
            defaultMessage: 'User group',
          })}
          showSearch
          optionFilterProp="label"
          value={selectedGroup}
          onChange={setSelectedGroup}
          placeholder={intl.formatMessage({
            id: 'pages.users.selectUserGroup',
            defaultMessage: 'Select user group',
          })}
          options={groups
            .filter((group) => !assignedGroups.has(group.guid))
            .map((group) => ({ value: group.guid, label: group.name }))}
          style={{ minWidth: 220 }}
        />
        <Select
          aria-label={intl.formatMessage({
            id: 'pages.addressBook.permission',
            defaultMessage: 'Permission',
          })}
          value={selectedRule}
          onChange={setSelectedRule}
          options={permissionOptions}
          style={{ minWidth: 180 }}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          disabled={!selectedGroup}
          loading={saving}
          onClick={handleAdd}
        >
          <FormattedMessage
            id="pages.addressBook.addGroupAccess"
            defaultMessage="Add group access"
          />
        </Button>
      </Space>

      <Table<API.RuleItem>
        rowKey="guid"
        size="small"
        loading={loading}
        dataSource={rules}
        pagination={false}
        scroll={{ x: 520 }}
        columns={[
          {
            title: intl.formatMessage({
              id: 'pages.addressBook.userGroup',
              defaultMessage: 'User group',
            }),
            dataIndex: 'group',
            render: (group: string) => groupNames.get(group) || group,
          },
          {
            title: intl.formatMessage({
              id: 'pages.addressBook.permission',
              defaultMessage: 'Permission',
            }),
            dataIndex: 'rule',
            width: 200,
            render: (rule: 1 | 2 | 3, record) => (
              <Select
                aria-label={intl.formatMessage({
                  id: 'pages.addressBook.permission',
                  defaultMessage: 'Permission',
                })}
                value={rule}
                options={permissionOptions}
                disabled={saving}
                onChange={(value) => handleUpdate(record.guid, value)}
                style={{ width: '100%' }}
              />
            ),
          },
          {
            title: intl.formatMessage({
              id: 'pages.common.action',
              defaultMessage: 'Action',
            }),
            key: 'action',
            width: 80,
            render: (_, record) => (
              <Popconfirm
                title={intl.formatMessage({
                  id: 'pages.addressBook.groupAccessDeleteConfirm',
                  defaultMessage: 'Delete this group access?',
                })}
                onConfirm={() => handleDelete(record.guid)}
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
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  disabled={saving}
                />
              </Popconfirm>
            ),
          },
        ]}
      />
    </Modal>
  );
};

export default UserGroupAccessModal;
