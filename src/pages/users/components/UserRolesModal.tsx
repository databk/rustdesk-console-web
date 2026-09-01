import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { FormattedMessage, useIntl } from '@umijs/max';
import {
  Alert,
  App,
  Button,
  Divider,
  Empty,
  Modal,
  Segmented,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getAllDeviceGroups } from '@/services/rustdesk-console/deviceGroup';
import { getRoleList } from '@/services/rustdesk-console/role';
import {
  getUserRoles,
  replaceUserRoles,
} from '@/services/rustdesk-console/userRole';
import { getRequestErrorMessage } from '@/utils/requestError';
import {
  changeAssignmentScope,
  roleSupportsDeviceGroupScope,
  toReplaceUserRolesParams,
  validateAssignments,
} from './userRoleAssignment';
import type {
  AssignmentScopeType,
  AssignmentValidationError,
  RoleAssignmentDraft,
} from './userRoleAssignment';

interface UserRolesModalProps {
  open: boolean;
  user: API.UserItem | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const loadAllRoles = async () => {
  const roles: API.RoleItem[] = [];
  let current = 1;
  let total = 0;
  do {
    const page = await getRoleList({ current, pageSize: 100 });
    if (!Array.isArray(page.data)) {
      throw new Error('Invalid role list response');
    }
    roles.push(...page.data);
    total = page.total || roles.length;
    current += 1;
    if (page.data.length === 0) break;
  } while (roles.length < total);
  return roles;
};

const UserRolesModal: React.FC<UserRolesModalProps> = ({
  open,
  user,
  onOpenChange,
  onSuccess,
}) => {
  const intl = useIntl();
  const { message: msgApi } = App.useApp();
  const [roles, setRoles] = useState<API.RoleItem[]>([]);
  const [groups, setGroups] = useState<API.DeviceGroupItem[]>([]);
  const [drafts, setDrafts] = useState<RoleAssignmentDraft[]>([]);
  const [effectiveScope, setEffectiveScope] = useState<
    Record<string, API.EffectivePermissionScope>
  >({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const loadRequestRef = useRef(0);
  const saveRequestRef = useRef(0);
  const userGuid = user?.guid;

  const groupNameByGuid = useMemo(
    () => new Map(groups.map((group) => [group.guid, group.name])),
    [groups],
  );

  const loadData = useCallback(async () => {
    if (!open || !userGuid) return;
    const requestId = ++loadRequestRef.current;
    setLoading(true);
    setSaving(false);
    try {
      const [roleItems, groupItems, assignmentResponse] = await Promise.all([
        loadAllRoles(),
        getAllDeviceGroups(),
        getUserRoles(userGuid),
      ]);
      if (requestId !== loadRequestRef.current) return;
      if (
        !Array.isArray(groupItems) ||
        !Array.isArray(assignmentResponse.data)
      ) {
        throw new Error('Invalid user role response');
      }
      setRoles(roleItems);
      setGroups(groupItems);
      setDrafts(
        assignmentResponse.data.map((assignment, index) => ({
          key: assignment.guid || `${assignment.role_guid}-${index}`,
          role_guid: assignment.role_guid,
          scope_type: assignment.scope_type,
          device_group_guids: assignment.device_group_guids || [],
        })),
      );
      setEffectiveScope(assignmentResponse.effective_scope || {});
    } catch (error) {
      if (requestId !== loadRequestRef.current) return;
      msgApi.error(
        getRequestErrorMessage(
          error,
          intl.formatMessage({
            id: 'pages.users.rolesLoadFailed',
            defaultMessage: 'Failed to load user roles',
          }),
        ),
      );
    } finally {
      if (requestId === loadRequestRef.current) setLoading(false);
    }
  }, [intl, msgApi, open, userGuid]);

  useEffect(() => {
    void loadData();
    return () => {
      loadRequestRef.current += 1;
      saveRequestRef.current += 1;
    };
  }, [loadData]);

  const roleByGuid = useMemo(
    () => new Map(roles.map((role) => [role.guid, role])),
    [roles],
  );

  const canUseDeviceGroupScope = (roleGuid: string) => {
    return roleSupportsDeviceGroupScope(roleByGuid.get(roleGuid));
  };

  const updateDraft = (
    key: string,
    changes: Partial<Omit<RoleAssignmentDraft, 'key'>>,
  ) => {
    setDrafts((current) =>
      current.map((draft) =>
        draft.key === key ? { ...draft, ...changes } : draft,
      ),
    );
  };

  const handleRoleChange = (key: string, roleGuid: string) => {
    updateDraft(key, {
      role_guid: roleGuid,
      scope_type: 'global',
      device_group_guids: [],
    });
  };

  const handleScopeChange = (key: string, scopeType: AssignmentScopeType) => {
    setDrafts((current) =>
      current.map((draft) =>
        draft.key === key ? changeAssignmentScope(draft, scopeType) : draft,
      ),
    );
  };

  const addDraft = () => {
    const used = new Set(drafts.map((draft) => draft.role_guid));
    const firstRole = roles.find((role) => !used.has(role.guid));
    if (!firstRole) return;
    setDrafts((current) => [
      ...current,
      {
        key: `new-${Date.now()}-${current.length}`,
        role_guid: firstRole.guid,
        scope_type: 'global',
        device_group_guids: [],
      },
    ]);
  };

  const handleSave = async () => {
    if (!userGuid) return;
    const viewRequestId = loadRequestRef.current;
    const saveRequestId = ++saveRequestRef.current;
    const validationError = validateAssignments(drafts, roleByGuid);
    if (validationError) {
      const errorMessages: Record<AssignmentValidationError, string> = {
        missing_role: intl.formatMessage({
          id: 'pages.users.roleRequired',
          defaultMessage: 'Select a role for every assignment',
        }),
        duplicate_role: intl.formatMessage({
          id: 'pages.users.duplicateRole',
          defaultMessage: 'A role can only be assigned once',
        }),
        unsupported_device_group_scope: intl.formatMessage({
          id: 'pages.users.unsupportedDeviceGroupScope',
          defaultMessage:
            'Advanced scope is only available for roles containing device actions and strategy assignment',
        }),
        missing_device_group: intl.formatMessage({
          id: 'pages.users.deviceGroupScopeRequired',
          defaultMessage:
            'Select at least one device group for an advanced assignment',
        }),
      };
      msgApi.error(errorMessages[validationError]);
      return;
    }

    setSaving(true);
    try {
      const response = await replaceUserRoles(
        userGuid,
        toReplaceUserRolesParams(drafts),
      );
      if (
        viewRequestId !== loadRequestRef.current ||
        saveRequestId !== saveRequestRef.current
      ) {
        return;
      }
      setEffectiveScope(response.effective_scope || {});
      msgApi.success(
        intl.formatMessage({
          id: 'pages.users.rolesSaved',
          defaultMessage: 'User roles saved',
        }),
      );
      onSuccess?.();
    } catch (error) {
      if (
        viewRequestId !== loadRequestRef.current ||
        saveRequestId !== saveRequestRef.current
      ) {
        return;
      }
      msgApi.error(
        getRequestErrorMessage(
          error,
          intl.formatMessage({
            id: 'pages.users.rolesSaveFailed',
            defaultMessage: 'Failed to save user roles',
          }),
        ),
      );
    } finally {
      if (
        viewRequestId === loadRequestRef.current &&
        saveRequestId === saveRequestRef.current
      ) {
        setSaving(false);
      }
    }
  };

  const availableRoleOptions = (currentGuid: string) => {
    const selected = new Set(
      drafts
        .filter((draft) => draft.role_guid !== currentGuid)
        .map((draft) => draft.role_guid),
    );
    return roles
      .filter((role) => !selected.has(role.guid))
      .map((role) => ({ label: role.name, value: role.guid }));
  };

  return (
    <Modal
      title={
        <FormattedMessage
          id="pages.users.rolesTitle"
          defaultMessage="Roles for {name}"
          values={{ name: user?.name || '' }}
        />
      }
      open={open}
      onCancel={() => onOpenChange(false)}
      onOk={() => void handleSave()}
      confirmLoading={saving}
      destroyOnClose
      width={760}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <Spin />
        </div>
      ) : (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message={intl.formatMessage({
              id: 'pages.users.rolesScopeInfo',
              defaultMessage:
                'Choose exactly one scope mode for each role. Global grants override any narrower device-group grants for the same action.',
            })}
          />

          {drafts.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={intl.formatMessage({
                id: 'pages.users.noRoles',
                defaultMessage: 'No roles assigned',
              })}
            />
          ) : (
            drafts.map((draft) => {
              const role = roleByGuid.get(draft.role_guid);
              const scopedAllowed = canUseDeviceGroupScope(draft.role_guid);
              return (
                <div
                  key={draft.key}
                  style={{
                    border: '1px solid #f0f0f0',
                    padding: 12,
                    borderRadius: 4,
                  }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space align="start" style={{ width: '100%' }}>
                      <Select
                        showSearch
                        optionFilterProp="label"
                        value={draft.role_guid || undefined}
                        options={availableRoleOptions(draft.role_guid)}
                        onChange={(value) => handleRoleChange(draft.key, value)}
                        style={{ flex: 1, minWidth: 260 }}
                        placeholder={intl.formatMessage({
                          id: 'pages.users.selectRole',
                          defaultMessage: 'Select role',
                        })}
                      />
                      <Button
                        danger
                        type="text"
                        icon={<DeleteOutlined />}
                        aria-label={intl.formatMessage({
                          id: 'pages.users.removeRole',
                          defaultMessage: 'Remove role',
                        })}
                        onClick={() =>
                          setDrafts((current) =>
                            current.filter((item) => item.key !== draft.key),
                          )
                        }
                      />
                    </Space>
                    <Segmented
                      block
                      value={draft.scope_type}
                      aria-label={intl.formatMessage({
                        id: 'pages.users.scopeMode',
                        defaultMessage: 'Role scope mode',
                      })}
                      options={[
                        {
                          label: intl.formatMessage({
                            id: 'pages.users.globalScope',
                            defaultMessage: 'Global',
                          }),
                          value: 'global',
                        },
                        {
                          label: intl.formatMessage({
                            id: 'pages.users.deviceGroupScope',
                            defaultMessage: 'Selected device groups',
                          }),
                          value: 'device_group',
                          disabled: !scopedAllowed,
                        },
                      ]}
                      onChange={(value) =>
                        handleScopeChange(
                          draft.key,
                          value as AssignmentScopeType,
                        )
                      }
                    />
                    {draft.scope_type === 'device_group' && (
                      <Select
                        mode="multiple"
                        showSearch
                        optionFilterProp="label"
                        value={draft.device_group_guids}
                        options={groups.map((group) => ({
                          label: group.name,
                          value: group.guid,
                        }))}
                        onChange={(values) =>
                          updateDraft(draft.key, {
                            device_group_guids: values,
                          })
                        }
                        placeholder={intl.formatMessage({
                          id: 'pages.users.selectDeviceGroups',
                          defaultMessage: 'Select one or more device groups',
                        })}
                        style={{ width: '100%' }}
                        status={
                          draft.device_group_guids.length === 0 ? 'error' : ''
                        }
                      />
                    )}
                    <Space wrap size={[4, 4]}>
                      {(role?.permissions || []).map((permission) => (
                        <Tag
                          key={permission}
                          title={permission}
                        >
                          {intl.formatMessage({
                            id: `pages.roles.permission.${permission}`,
                            defaultMessage: permission,
                          })}
                        </Tag>
                      ))}
                    </Space>
                  </Space>
                </div>
              );
            })
          )}

          <Button
            type="dashed"
            block
            icon={<PlusOutlined />}
            disabled={drafts.length >= roles.length}
            onClick={addDraft}
          >
            <FormattedMessage
              id="pages.users.addRole"
              defaultMessage="Add role"
            />
          </Button>

          <Divider style={{ margin: 0 }} />
          <div>
            <Typography.Title level={5} style={{ marginTop: 0 }}>
              <FormattedMessage
                id="pages.users.effectiveScope"
                defaultMessage="Effective scope"
              />
            </Typography.Title>
            {Object.keys(effectiveScope).length === 0 ? (
              <Typography.Text type="secondary">
                <FormattedMessage
                  id="pages.users.noEffectivePermissions"
                  defaultMessage="No effective permissions"
                />
              </Typography.Text>
            ) : (
              <Space direction="vertical" style={{ width: '100%' }} size={4}>
                {Object.entries(effectiveScope)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([permission, scope]) => (
                    <Space key={permission} wrap>
                      <Typography.Text>
                        {intl.formatMessage({
                          id: `pages.roles.permission.${permission}`,
                          defaultMessage: permission,
                        })}
                      </Typography.Text>
                      <Typography.Text type="secondary" code>
                        ({permission})
                      </Typography.Text>
                      {scope.scope_type === 'global' ? (
                        <Tag color="green">
                          <FormattedMessage
                            id="pages.users.globalEffective"
                            defaultMessage="Global (overrides narrower grants)"
                          />
                        </Tag>
                      ) : scope.scope_type === 'device_group' ? (
                        <Space wrap size={[4, 4]}>
                          {scope.device_group_guids.map((guid) => (
                            <Tag color="blue" key={guid}>
                              {groupNameByGuid.get(guid) || guid}
                            </Tag>
                          ))}
                        </Space>
                      ) : (
                        <Tag>
                          <FormattedMessage
                            id="pages.users.noneEffective"
                            defaultMessage="None"
                          />
                        </Tag>
                      )}
                    </Space>
                  ))}
              </Space>
            )}
          </div>
        </Space>
      )}
    </Modal>
  );
};

export default UserRolesModal;
