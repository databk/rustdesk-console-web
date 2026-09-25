import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { FormattedMessage, useIntl } from '@umijs/max';
import {
  Alert,
  App,
  Button,
  Card,
  Divider,
  Flex,
  Modal,
  Segmented,
  Select,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { SUPER_ADMIN_NON_CATALOG_CAPABILITIES } from '@/pages/roles/rbacPresentation';
import { getPermissionList } from '@/services/rustdesk-console/permission';
import { getRoleList } from '@/services/rustdesk-console/role';
import {
  getUserRoleEligibility,
  getUserRoles,
  replaceUserRoles,
} from '@/services/rustdesk-console/userRole';
import { getRequestErrorMessage } from '@/utils/requestError';
import {
  type AssignmentScopeType,
  type AssignmentValidationError,
  changeAssignmentScope,
  deriveEffectivePermissionScopes,
  getRoleEligibility,
  groupEffectivePermissionScopes,
  preserveLockedAssignments,
  type RoleAssignmentDraft,
  toReplaceUserRolesParams,
  validateAssignments,
} from './userRoleAssignment';

interface UserRolesModalProps {
  open: boolean;
  user: API.UserItem | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  readOnly?: boolean;
  canManageTarget?: boolean;
}

const loadAllRoles = async () => {
  const roles: API.RoleItem[] = [];
  let current = 1;
  let total = 0;
  do {
    const page = await getRoleList({ current, pageSize: 100 });
    roles.push(...page.data);
    total = page.total;
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
  readOnly = false,
  canManageTarget = true,
}) => {
  const intl = useIntl();
  const { message: msgApi } = App.useApp();
  const [roles, setRoles] = useState<API.RoleItem[]>([]);
  const [permissionCatalog, setPermissionCatalog] = useState<
    API.PermissionItem[]
  >([]);
  const [drafts, setDrafts] = useState<RoleAssignmentDraft[]>([]);
  const [originalDrafts, setOriginalDrafts] = useState<RoleAssignmentDraft[]>(
    [],
  );
  const [eligibility, setEligibility] = useState<API.UserRoleEligibility[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const loadRequestRef = useRef(0);
  const saveRequestRef = useRef(0);
  const userGuid = user?.guid;
  const effectiveReadOnly = readOnly || user?.is_admin === true;

  const groupNameByGuid = useMemo(
    () =>
      new Map(
        eligibility.flatMap((item) =>
          item.assignable_device_groups.map((group) => [
            group.guid,
            group.name,
          ]),
        ),
      ),
    [eligibility],
  );

  const loadData = useCallback(async () => {
    const requestId = ++loadRequestRef.current;
    if (!open || !userGuid) return;
    setLoading(true);
    setSaving(false);
    setLoadFailed(false);
    setRoles([]);
    setPermissionCatalog([]);
    setDrafts([]);
    setOriginalDrafts([]);
    setEligibility([]);
    try {
      const [
        roleItems,
        assignmentResponse,
        eligibilityResponse,
        permissionResponse,
      ] = await Promise.all([
        loadAllRoles(),
        getUserRoles(userGuid),
        getUserRoleEligibility(userGuid),
        getPermissionList(),
      ]);
      if (requestId !== loadRequestRef.current) return;
      if (
        !Array.isArray(assignmentResponse.data) ||
        !Array.isArray(eligibilityResponse.data)
      ) {
        throw new Error('Invalid user role response');
      }
      setRoles(roleItems);
      setPermissionCatalog(permissionResponse.data);
      const eligibilityMap = new Map(
        eligibilityResponse.data.map((item) => [item.guid, item]),
      );
      const loadedDrafts = assignmentResponse.data.map((assignment) => ({
        key: assignment.guid,
        role_guid: assignment.role_guid,
        scope_type: assignment.scope_type,
        device_group_guids: assignment.device_group_guids,
        locked: !eligibilityMap.get(assignment.role_guid)?.can_remove,
      }));
      // The system owner is a virtual identity, not an assignment of every
      // persisted role. Its effective permissions are projected below from
      // the catalog and must never enter a mutation payload.
      const visibleDrafts = user?.is_admin ? [] : loadedDrafts;
      setDrafts(visibleDrafts);
      setOriginalDrafts(visibleDrafts);
      setEligibility(eligibilityResponse.data);
    } catch (error) {
      if (requestId !== loadRequestRef.current) return;
      setLoadFailed(true);
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

  const effectiveScope = useMemo(() => {
    const scopes = deriveEffectivePermissionScopes(drafts, roleByGuid);
    if (user?.is_admin) {
      for (const permission of permissionCatalog) {
        if (!permission.assignable) continue;
        scopes[permission.code] = {
          scope_type: 'global',
          device_group_guids: [],
        };
      }
    }
    return scopes;
  }, [drafts, permissionCatalog, roleByGuid, user?.is_admin]);

  const effectiveScopeGroups = useMemo(
    () => groupEffectivePermissionScopes(effectiveScope),
    [effectiveScope],
  );

  const permissionScopeByCode = useMemo(
    () =>
      new Map(
        permissionCatalog.map(({ code, scope }) => [code, scope] as const),
      ),
    [permissionCatalog],
  );
  const eligibilityByRole = useMemo(
    () => new Map(eligibility.map((item) => [item.guid, item])),
    [eligibility],
  );

  const displayedEffectiveScopeGroups = useMemo(() => {
    const addressBooks = effectiveScopeGroups.find(
      ({ resource }) => resource === 'address_books',
    ) || { resource: 'address_books', actions: [] };
    return [
      addressBooks,
      ...effectiveScopeGroups.filter(
        ({ resource }) => resource !== 'address_books',
      ),
    ];
  }, [effectiveScopeGroups]);

  const getPermissionLabel = (permission: string) =>
    intl.formatMessage({
      id: `pages.roles.permission.${permission}`,
      defaultMessage: intl.formatMessage({
        id: 'pages.roles.unknownPermission',
        defaultMessage: 'Unknown permission',
      }),
    });

  const getResourceLabel = (resource: string) =>
    intl.formatMessage({
      id: `pages.roles.resource.${resource}`,
      defaultMessage: intl.formatMessage({
        id: 'pages.roles.unknownResource',
        defaultMessage: 'Unknown resource',
      }),
    });

  const getEligibilityReason = (
    reason?: API.UserRoleEligibility['reason_code'],
  ) =>
    reason
      ? intl.formatMessage({
          id: `pages.users.roleEligibility.${reason}`,
          defaultMessage: 'This role assignment is unavailable',
        })
      : '';

  const canUseDeviceGroupScope = (roleGuid: string) => {
    return (
      eligibilityByRole
        .get(roleGuid)
        ?.allowed_scope_types.includes('device_group') ?? false
    );
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
    setDrafts((current) => {
      if (
        current.some((draft) => !draft.role_guid) ||
        current.length >= roles.length
      ) {
        return current;
      }
      return [
        ...current,
        {
          key: `new-${Date.now()}-${current.length}`,
          role_guid: '',
          scope_type: 'global',
          device_group_guids: [],
        },
      ];
    });
  };

  const handleSave = async () => {
    if (!userGuid || loading || loadFailed || effectiveReadOnly) return;
    const viewRequestId = loadRequestRef.current;
    const saveRequestId = ++saveRequestRef.current;
    const saveDrafts = preserveLockedAssignments(drafts, originalDrafts);
    const validationError = validateAssignments(
      saveDrafts,
      roleByGuid,
      permissionScopeByCode,
    );
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
            'Device-group scope is only available for roles containing device actions and strategy assignment',
        }),
        missing_device_group: intl.formatMessage({
          id: 'pages.users.deviceGroupScopeRequired',
          defaultMessage:
            'Select at least one device group for a device-group assignment',
        }),
      };
      msgApi.error(errorMessages[validationError]);
      return;
    }

    setSaving(true);
    try {
      await replaceUserRoles(userGuid, toReplaceUserRolesParams(saveDrafts));
      if (
        viewRequestId !== loadRequestRef.current ||
        saveRequestId !== saveRequestRef.current
      ) {
        return;
      }
      msgApi.success(
        intl.formatMessage({
          id: 'pages.users.rolesSaved',
          defaultMessage: 'User roles saved',
        }),
      );
      onOpenChange(false);
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
      .map((role) => {
        const item = getRoleEligibility(role.guid, eligibilityByRole);
        return {
          label: role.name,
          value: role.guid,
          disabled: !item.can_assign,
          title: item.reason_code
            ? getEligibilityReason(item.reason_code)
            : undefined,
        };
      });
  };

  return (
    <Modal
      title={
        <FormattedMessage
          id="pages.users.rolesTitle"
          defaultMessage="Roles for {name}"
          values={{ name: user?.display_name || user?.name || '' }}
        />
      }
      open={open && canManageTarget}
      onCancel={() => onOpenChange(false)}
      onOk={() => void handleSave()}
      footer={effectiveReadOnly ? null : undefined}
      confirmLoading={saving}
      okButtonProps={{
        disabled: effectiveReadOnly || loading || loadFailed,
      }}
      okText={intl.formatMessage({
        id: 'pages.common.save',
        defaultMessage: 'Save',
      })}
      destroyOnHidden
      width={760}
    >
      {loadFailed ? (
        <Alert
          type="error"
          showIcon
          title={intl.formatMessage({
            id: 'pages.users.rolesLoadFailed',
            defaultMessage: 'Failed to load user roles',
          })}
        />
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <Spin />
        </div>
      ) : (
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          <Flex vertical gap="small" style={{ width: '100%' }}>
            <Alert
              type="info"
              showIcon
              title={
                <FormattedMessage
                  id="pages.users.rolesScopeInfo"
                  defaultMessage="Global grants override narrower device-group grants."
                />
              }
            />

            {drafts.map((draft, index) => {
              const role = roleByGuid.get(draft.role_guid);
              const roleEligibility = getRoleEligibility(
                draft.role_guid,
                eligibilityByRole,
              );
              const scopedAllowed = canUseDeviceGroupScope(draft.role_guid);
              const groupOptions = [
                ...roleEligibility.assignable_device_groups.map((group) => ({
                  label: group.name,
                  value: group.guid,
                })),
                ...draft.device_group_guids
                  .filter(
                    (guid) =>
                      !roleEligibility.assignable_device_groups.some(
                        (group) => group.guid === guid,
                      ),
                  )
                  .map((guid) => ({
                    label: groupNameByGuid.get(guid) || guid,
                    value: guid,
                    disabled: true,
                  })),
              ];
              return (
                <Card
                  key={draft.key}
                  size="small"
                  style={{ width: '100%' }}
                  title={
                    <FormattedMessage
                      id="pages.users.roleAssignmentTitle"
                      defaultMessage="Role {number}"
                      values={{ number: index + 1 }}
                    />
                  }
                  extra={
                    <Tooltip
                      title={
                        draft.locked
                          ? getEligibilityReason(roleEligibility.reason_code)
                          : undefined
                      }
                    >
                      <span>
                        <Button
                          danger
                          type="text"
                          icon={<DeleteOutlined />}
                          aria-label={intl.formatMessage({
                            id: 'pages.users.removeRole',
                            defaultMessage: 'Remove role',
                          })}
                          disabled={draft.locked || effectiveReadOnly}
                          onClick={() => {
                            if (draft.locked || effectiveReadOnly) return;
                            setDrafts((current) =>
                              current.filter((item) => item.key !== draft.key),
                            );
                          }}
                        />
                      </span>
                    </Tooltip>
                  }
                >
                  <Space
                    orientation="vertical"
                    size="middle"
                    style={{ width: '100%' }}
                  >
                    <Tooltip
                      title={
                        draft.locked || !roleEligibility.can_assign
                          ? getEligibilityReason(roleEligibility.reason_code)
                          : undefined
                      }
                    >
                      <span>
                        <Select
                          showSearch
                          optionFilterProp="label"
                          value={draft.role_guid || undefined}
                          options={availableRoleOptions(draft.role_guid)}
                          onChange={(value) =>
                            handleRoleChange(draft.key, value)
                          }
                          disabled={draft.locked || effectiveReadOnly}
                          style={{ width: '100%' }}
                          aria-label={intl.formatMessage({
                            id: 'pages.users.selectRole',
                            defaultMessage: 'Select role',
                          })}
                          placeholder={intl.formatMessage({
                            id: 'pages.users.selectRole',
                            defaultMessage: 'Select role',
                          })}
                        />
                      </span>
                    </Tooltip>
                    <Tooltip
                      title={
                        draft.locked
                          ? getEligibilityReason(roleEligibility.reason_code)
                          : undefined
                      }
                    >
                      <Flex
                        wrap
                        gap="small"
                        align="flex-start"
                        style={{ width: '100%' }}
                      >
                        <Segmented
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
                              disabled:
                                !roleEligibility.allowed_scope_types.includes(
                                  'global',
                                ),
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
                          disabled={draft.locked || effectiveReadOnly}
                        />
                        {draft.scope_type === 'device_group' && (
                          <Select
                            mode="multiple"
                            showSearch
                            optionFilterProp="label"
                            maxTagCount={2}
                            value={draft.device_group_guids}
                            options={groupOptions}
                            onChange={(values) =>
                              updateDraft(draft.key, {
                                device_group_guids: values,
                              })
                            }
                            disabled={draft.locked || effectiveReadOnly}
                            aria-label={intl.formatMessage({
                              id: 'pages.users.selectDeviceGroups',
                              defaultMessage:
                                'Select one or more device groups',
                            })}
                            placeholder={intl.formatMessage({
                              id: 'pages.users.selectDeviceGroups',
                              defaultMessage:
                                'Select one or more device groups',
                            })}
                            style={{ flex: '1 1 280px', minWidth: 220 }}
                            status={
                              draft.device_group_guids.length === 0
                                ? 'error'
                                : ''
                            }
                          />
                        )}
                      </Flex>
                    </Tooltip>
                    <Space wrap size={[4, 4]}>
                      {(role?.permissions || []).map((permission) => (
                        <Tag key={permission}>
                          {getPermissionLabel(permission)}
                        </Tag>
                      ))}
                    </Space>
                  </Space>
                </Card>
              );
            })}

            {!effectiveReadOnly && (
              <Button
                block
                type="dashed"
                icon={<PlusOutlined />}
                disabled={
                  drafts.length >= roles.length ||
                  drafts.some((draft) => !draft.role_guid)
                }
                onClick={addDraft}
              >
                <FormattedMessage
                  id="pages.users.addRole"
                  defaultMessage="Add role"
                />
              </Button>
            )}
          </Flex>

          <Divider style={{ margin: 0 }} />
          <div>
            <Typography.Title level={5} style={{ marginTop: 0 }}>
              <FormattedMessage
                id="pages.users.effectiveScope"
                defaultMessage="Effective scope"
              />
            </Typography.Title>
            <Flex vertical gap="middle">
              {displayedEffectiveScopeGroups.map(({ resource, actions }) => (
                <Card
                  key={resource}
                  size="small"
                  title={getResourceLabel(resource)}
                >
                  <Flex vertical gap="small">
                    {resource === 'address_books' && (
                      <section
                        aria-label={intl.formatMessage({
                          id: 'pages.roles.personalAddressBook',
                          defaultMessage: 'Personal address book',
                        })}
                      >
                        <Flex
                          align="center"
                          gap={4}
                          style={{
                            minWidth: 'max-content',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <Typography.Text>
                            <FormattedMessage
                              id="pages.roles.personalAddressBook"
                              defaultMessage="Personal address book"
                            />
                          </Typography.Text>
                          <Tag>
                            <FormattedMessage
                              id="pages.roles.basicFunction"
                              defaultMessage="Basic feature"
                            />
                          </Tag>
                        </Flex>
                      </section>
                    )}
                    {actions.map(({ permission, scope }) => (
                      <section
                        key={permission}
                        aria-label={getPermissionLabel(permission)}
                        tabIndex={
                          scope.scope_type === 'device_group' ? 0 : undefined
                        }
                        style={{ overflowX: 'auto' }}
                      >
                        <Flex
                          align="center"
                          gap={4}
                          style={{
                            minWidth: 'max-content',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <Typography.Text>
                            {getPermissionLabel(permission)}
                          </Typography.Text>
                          {scope.scope_type === 'global' ? (
                            <Tag color="green">
                              <FormattedMessage
                                id="pages.users.globalScope"
                                defaultMessage="Global"
                              />
                            </Tag>
                          ) : (
                            scope.device_group_guids.map((guid) => (
                              <Tag color="blue" key={guid}>
                                {groupNameByGuid.get(guid) || guid}
                              </Tag>
                            ))
                          )}
                        </Flex>
                      </section>
                    ))}
                  </Flex>
                </Card>
              ))}
              {user?.is_admin && (
                <Card
                  size="small"
                  title={intl.formatMessage({
                    id: 'pages.users.systemCapabilities',
                    defaultMessage: 'System capabilities',
                  })}
                >
                  <Flex vertical gap="small">
                    {[
                      ...permissionCatalog
                        .filter((permission) => !permission.assignable)
                        .map((permission) => permission.code),
                      ...SUPER_ADMIN_NON_CATALOG_CAPABILITIES,
                    ].map((capability) => (
                      <Typography.Text key={capability}>
                        {intl.formatMessage({
                          id: `pages.users.systemCapability.${capability}`,
                          defaultMessage: capability,
                        })}
                      </Typography.Text>
                    ))}
                  </Flex>
                </Card>
              )}
            </Flex>
          </div>
        </Space>
      )}
    </Modal>
  );
};

export default UserRolesModal;
