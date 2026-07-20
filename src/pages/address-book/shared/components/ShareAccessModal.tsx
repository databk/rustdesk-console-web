import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { FormattedMessage, useIntl } from '@umijs/max';
import {
  App,
  Button,
  Modal,
  Popconfirm,
  Radio,
  Select,
  Space,
  Table,
  Tag,
} from 'antd';
import type { RadioChangeEvent } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addRule,
  deleteRules,
  getAllRules,
  updateRule,
} from '@/services/rustdesk-console/addressBook';
import { getAllUserGroups } from '@/services/rustdesk-console/userGroup';
import { getAdminUserList } from '@/services/rustdesk-console/user';

type ShareType = 'everyone' | 'user' | 'group';

interface ShareAccessModalProps {
  open: boolean;
  addressBook: API.SharedAddressBook | null;
  onOpenChange: (open: boolean) => void;
}

const ShareAccessModal: React.FC<ShareAccessModalProps> = ({
  open,
  addressBook,
  onOpenChange,
}) => {
  const intl = useIntl();
  const { message: msgApi } = App.useApp();
  const [groups, setGroups] = useState<API.UserGroupItem[]>([]);
  const [users, setUsers] = useState<API.UserItem[]>([]);
  const [rules, setRules] = useState<API.RuleItem[]>([]);
  const [shareType, setShareType] = useState<ShareType>('group');
  const [selectedGroup, setSelectedGroup] = useState<string>();
  const [selectedUser, setSelectedUser] = useState<string>();
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

  const shareTypeOptions = useMemo(
    () => [
      {
        value: 'everyone' as const,
        label: intl.formatMessage({
          id: 'pages.addressBook.shareTypeEveryone',
          defaultMessage: 'Everyone',
        }),
      },
      {
        value: 'user' as const,
        label: intl.formatMessage({
          id: 'pages.addressBook.shareTypeUser',
          defaultMessage: 'User',
        }),
      },
      {
        value: 'group' as const,
        label: intl.formatMessage({
          id: 'pages.addressBook.shareTypeGroup',
          defaultMessage: 'User group',
        }),
      },
    ],
    [intl],
  );

  const load = useCallback(async () => {
    if (!open || !addressBook) return;
    setLoading(true);
    try {
      const [groupList, userList, result] = await Promise.all([
        getAllUserGroups(),
        getAdminUserList({ current: 1, pageSize: 1000 }),
        getAllRules(addressBook.guid),
      ]);
      setGroups(groupList);
      setUsers(userList.data || []);
      setRules(result);
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.addressBook.accessLoadFailed',
          defaultMessage: 'Failed to load access rules',
        }),
      );
    } finally {
      setLoading(false);
    }
  }, [open, addressBook?.guid]);

  useEffect(() => {
    void load();
  }, [load]);

  const hasEveryoneRule = useMemo(
    () => rules.some((rule) => rule.ruleType === 'everyone'),
    [rules],
  );

  const handleShareTypeChange = (e: RadioChangeEvent) => {
    const newType = e.target.value as ShareType;
    setShareType(newType);
    setSelectedGroup(undefined);
    setSelectedUser(undefined);
    if (newType === 'everyone') {
      setSelectedRule(1);
    }
  };

  const handleAdd = async () => {
    if (!addressBook) return;
    setSaving(true);
    try {
      const params: API.CreateRuleParams = {
        guid: addressBook.guid,
        rule: selectedRule,
      };
      if (shareType === 'group') {
        if (!selectedGroup) return;
        params.group = selectedGroup;
      } else if (shareType === 'user') {
        if (!selectedUser) return;
        params.user = selectedUser;
      }
      await addRule(params);
      setSelectedGroup(undefined);
      setSelectedUser(undefined);
      setSelectedRule(1);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.addressBook.accessAdded',
          defaultMessage: 'Access rule added',
        }),
      );
      await load();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.addressBook.accessAddFailed',
          defaultMessage: 'Failed to add access rule',
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
          id: 'pages.addressBook.accessUpdated',
          defaultMessage: 'Access rule updated',
        }),
      );
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.addressBook.accessUpdateFailed',
          defaultMessage: 'Failed to update access rule',
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
          id: 'pages.addressBook.accessDeleted',
          defaultMessage: 'Access rule deleted',
        }),
      );
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.addressBook.accessDeleteFailed',
          defaultMessage: 'Failed to delete access rule',
        }),
      );
    } finally {
      setSaving(false);
    }
  };

  const groupNames = useMemo(
    () => new Map(groups.map((group) => [group.guid, group.name])),
    [groups],
  );
  const userNames = useMemo(
    () =>
      new Map(
        users.map((user) => [
          user.guid,
          user.display_name ? `${user.display_name} (${user.name})` : user.name,
        ]),
      ),
    [users],
  );

  const assignedGroups = useMemo(
    () =>
      new Set(
        rules
          .filter((rule) => rule.ruleType === 'group' && rule.group)
          .map((rule) => rule.group!),
      ),
    [rules],
  );
  const assignedUsers = useMemo(
    () =>
      new Set(
        rules
          .filter((rule) => rule.ruleType === 'user' && rule.user)
          .map((rule) => rule.user!),
      ),
    [rules],
  );

  const canAdd = useMemo(() => {
    if (shareType === 'everyone') return !hasEveryoneRule;
    if (shareType === 'user') return !!selectedUser;
    if (shareType === 'group') return !!selectedGroup;
    return false;
  }, [shareType, selectedUser, selectedGroup, hasEveryoneRule]);

  const renderRuleType = (ruleType: string) => {
    switch (ruleType) {
      case 'everyone':
        return (
          <Tag color="blue">
            <FormattedMessage
              id="pages.addressBook.shareTypeEveryone"
              defaultMessage="Everyone"
            />
          </Tag>
        );
      case 'user':
        return (
          <Tag color="green">
            <FormattedMessage
              id="pages.addressBook.shareTypeUser"
              defaultMessage="User"
            />
          </Tag>
        );
      case 'group':
        return (
          <Tag color="orange">
            <FormattedMessage
              id="pages.addressBook.shareTypeGroup"
              defaultMessage="User group"
            />
          </Tag>
        );
      default:
        return ruleType;
    }
  };

  const renderTarget = (record: API.RuleItem) => {
    switch (record.ruleType) {
      case 'everyone':
        return intl.formatMessage({
          id: 'pages.addressBook.allUsers',
          defaultMessage: 'All users',
        });
      case 'user':
        return (
          (record.user && userNames.get(record.user)) || record.user || '-'
        );
      case 'group':
        return (
          (record.group && groupNames.get(record.group)) || record.group || '-'
        );
      default:
        return '-';
    }
  };

  return (
    <Modal
      title={intl.formatMessage(
        {
          id: 'pages.addressBook.accessTitle',
          defaultMessage: '{name} - Access management',
        },
        { name: addressBook?.name || '' },
      )}
      open={open}
      width={780}
      footer={null}
      destroyOnHidden
      onCancel={() => onOpenChange(false)}
      afterClose={() => {
        setShareType('group');
        setSelectedGroup(undefined);
        setSelectedUser(undefined);
        setSelectedRule(1);
        setRules([]);
      }}
    >
      <Space
        direction="vertical"
        size="middle"
        style={{ width: '100%', marginBottom: 16 }}
      >
        <Radio.Group
          value={shareType}
          onChange={handleShareTypeChange}
          optionType="button"
          buttonStyle="solid"
        >
          {shareTypeOptions.map((option) => (
            <Radio.Button
              key={option.value}
              value={option.value}
              disabled={option.value === 'everyone' && hasEveryoneRule}
            >
              {option.label}
            </Radio.Button>
          ))}
        </Radio.Group>

        <Space wrap>
          {shareType === 'group' && (
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
          )}
          {shareType === 'user' && (
            <Select
              aria-label={intl.formatMessage({
                id: 'pages.addressBook.selectUser',
                defaultMessage: 'Select user',
              })}
              showSearch
              optionFilterProp="label"
              value={selectedUser}
              onChange={setSelectedUser}
              placeholder={intl.formatMessage({
                id: 'pages.addressBook.selectUserPlaceholder',
                defaultMessage: 'Search by username or email',
              })}
              options={users
                .filter((user) => !assignedUsers.has(user.guid))
                .map((user) => ({
                  value: user.guid,
                  label: user.display_name
                    ? `${user.display_name} (${user.name})`
                    : user.name,
                }))}
              style={{ minWidth: 220 }}
            />
          )}
          {shareType === 'everyone' && (
            <span style={{ color: 'rgba(0, 0, 0, 0.45)', lineHeight: '32px' }}>
              <FormattedMessage
                id="pages.addressBook.everyoneHint"
                defaultMessage="All users will have access to this address book"
              />
            </span>
          )}
          <Select
            aria-label={intl.formatMessage({
              id: 'pages.addressBook.permission',
              defaultMessage: 'Permission',
            })}
            value={selectedRule}
            onChange={setSelectedRule}
            options={permissionOptions}
            style={{ minWidth: 160 }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            disabled={!canAdd}
            loading={saving}
            onClick={handleAdd}
          >
            <FormattedMessage
              id="pages.addressBook.addAccess"
              defaultMessage="Add access"
            />
          </Button>
        </Space>
      </Space>

      <Table<API.RuleItem>
        rowKey="guid"
        size="small"
        loading={loading}
        dataSource={rules}
        pagination={false}
        scroll={{ x: 580 }}
        columns={[
          {
            title: intl.formatMessage({
              id: 'pages.addressBook.shareType',
              defaultMessage: 'Share type',
            }),
            dataIndex: 'ruleType',
            width: 120,
            render: (ruleType: string) => renderRuleType(ruleType),
          },
          {
            title: intl.formatMessage({
              id: 'pages.addressBook.shareTarget',
              defaultMessage: 'Target',
            }),
            key: 'target',
            render: (_: unknown, record: API.RuleItem) => renderTarget(record),
          },
          {
            title: intl.formatMessage({
              id: 'pages.addressBook.permission',
              defaultMessage: 'Permission',
            }),
            dataIndex: 'rule',
            width: 180,
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
                  id: 'pages.addressBook.accessDeleteConfirm',
                  defaultMessage: 'Delete this access rule?',
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

export default ShareAccessModal;
