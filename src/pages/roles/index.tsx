import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useAccess, useIntl } from '@umijs/max';
import {
  Alert,
  App,
  Button,
  Divider,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Tag,
  Tooltip,
  Tree,
} from 'antd';
import React, { useMemo, useRef, useState } from 'react';
import { getPermissionList } from '@/services/rustdesk-console/permission';
import {
  createRole,
  deleteRole,
  getRoleDetail,
  getRoleList,
  getRoleProtectionImpact,
  updateRole,
} from '@/services/rustdesk-console/role';
import { getRequestErrorMessage } from '@/utils/requestError';
import {
  addRequiredPermissions,
  removeDependentPermissions,
} from './permissionDependencies';
import {
  buildRolePermissionTreeData,
  getAssignablePermissionCodes,
  getAssignablePermissionPayload,
  getSystemCapabilityTreeKey,
  PROTECTED_ACCOUNT_KEY,
} from './permissionTree';
import type {
  BuiltInRoleIdentity,
  RoleListRow,
  RolePermissionPresetSelection,
} from './rbacPresentation';
import {
  applyRolePermissionPreset,
  CUSTOM_ROLE_PERMISSION_PRESET_KEY,
  getBuiltInRoleRows,
  getMatchingRolePermissionPreset,
  getRoleListPageWindow,
  isBuiltInRoleRow,
  PERSONAL_ADDRESS_BOOK_KEY,
  presetEnablesProtection,
  ROLE_PERMISSION_PRESETS,
  SUPER_ADMIN_NON_CATALOG_CAPABILITIES,
} from './rbacPresentation';

type RoleFormMode = 'create' | 'edit' | 'view';

const RoleList: React.FC = () => {
  const intl = useIntl();
  const { message: msgApi } = App.useApp();
  const access = useAccess();
  const isOwner = access.isSuperAdmin;
  const actionRef = useRef<ActionType>(null);
  const [form] = Form.useForm<API.CreateRoleParams>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<API.RoleItem | null>(null);
  const [modalMode, setModalMode] = useState<RoleFormMode>('create');
  const [catalog, setCatalog] = useState<API.PermissionItem[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [protectedAccount, setProtectedAccount] = useState(false);
  const [roleMemberCount, setRoleMemberCount] = useState(0);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [systemIdentity, setSystemIdentity] =
    useState<BuiltInRoleIdentity | null>(null);
  const [saving, setSaving] = useState(false);
  const detailRequestRef = useRef(0);

  const loadCatalog = async () => {
    if (catalog.length > 0) return catalog;
    setCatalogLoading(true);
    try {
      const response = await getPermissionList();
      const items = response.data;
      setCatalog(items);
      return items;
    } catch (error) {
      msgApi.error(
        getRequestErrorMessage(
          error,
          intl.formatMessage({
            id: 'pages.roles.permissionsLoadFailed',
            defaultMessage: 'Failed to load the permission catalog',
          }),
        ),
      );
      return [];
    } finally {
      setCatalogLoading(false);
    }
  };

  const permissionCodes = useMemo(
    () => getAssignablePermissionCodes(catalog),
    [catalog],
  );
  const selectedPreset = useMemo(
    () =>
      systemIdentity
        ? CUSTOM_ROLE_PERMISSION_PRESET_KEY
        : getMatchingRolePermissionPreset(
            checkedKeys,
            catalog,
            protectedAccount,
          ),
    [catalog, checkedKeys, protectedAccount, systemIdentity],
  );

  const formReadOnly = modalMode === 'view' || !isOwner;
  const treeData = useMemo(
    () =>
      buildRolePermissionTreeData(
        systemIdentity === 'ordinary' ? [] : catalog,
        (message) => intl.formatMessage(message),
        {
          includeBuiltInRows: true,
          systemCapabilities:
            systemIdentity === 'superAdmin'
              ? SUPER_ADMIN_NON_CATALOG_CAPABILITIES
              : undefined,
        },
      ),
    [catalog, intl, systemIdentity],
  );

  const closeModal = () => {
    detailRequestRef.current += 1;
    setModalOpen(false);
    setEditingRole(null);
    setModalMode('create');
    setCheckedKeys([]);
    setProtectedAccount(false);
    setRoleMemberCount(0);
    setDetailLoading(false);
    setSystemIdentity(null);
    form.resetFields();
  };

  const openSystemIdentity = async (
    record: RoleListRow & { builtInIdentity: BuiltInRoleIdentity },
  ) => {
    const requestId = ++detailRequestRef.current;
    setEditingRole(null);
    setModalMode('view');
    setSystemIdentity(record.builtInIdentity);
    setRoleMemberCount(0);
    setModalOpen(true);
    setDetailLoading(record.builtInIdentity === 'superAdmin');
    const loadedCatalog =
      record.builtInIdentity === 'superAdmin' ? await loadCatalog() : [];
    if (requestId !== detailRequestRef.current) return;
    form.setFieldsValue({ name: record.name, note: record.note || '' });
    setCheckedKeys(
      record.builtInIdentity === 'superAdmin'
        ? loadedCatalog.map((permission) => permission.code)
        : [],
    );
    setProtectedAccount(record.builtInIdentity === 'superAdmin');
    setDetailLoading(false);
  };

  const openCreate = () => {
    detailRequestRef.current += 1;
    setEditingRole(null);
    setModalMode('create');
    setSystemIdentity(null);
    setProtectedAccount(false);
    setRoleMemberCount(0);
    setCheckedKeys([]);
    setDetailLoading(false);
    form.resetFields();
    setModalOpen(true);
    void loadCatalog();
  };

  const openEdit = async (
    record: API.RoleItem,
    mode: Exclude<RoleFormMode, 'create'> = 'edit',
  ) => {
    const requestId = ++detailRequestRef.current;
    setEditingRole(record);
    setModalMode(mode);
    setSystemIdentity(null);
    setModalOpen(true);
    setDetailLoading(true);
    const loadedCatalog = await loadCatalog();
    if (requestId !== detailRequestRef.current) return;
    try {
      const detail = await getRoleDetail(record.guid);
      if (requestId !== detailRequestRef.current) return;
      form.setFieldsValue({ name: detail.name, note: detail.note || '' });
      setProtectedAccount(detail.protected_account === true);
      setRoleMemberCount(detail.member_count || record.member_count || 0);
      setEditingRole({ ...record, ...detail });
      const validCodes = getAssignablePermissionCodes(loadedCatalog);
      setCheckedKeys(detail.permissions.filter((code) => validCodes.has(code)));
    } catch (error) {
      if (requestId !== detailRequestRef.current) return;
      msgApi.error(
        getRequestErrorMessage(
          error,
          intl.formatMessage({
            id: 'pages.roles.detailLoadFailed',
            defaultMessage: 'Failed to load role details',
          }),
        ),
      );
      closeModal();
    } finally {
      if (requestId === detailRequestRef.current) setDetailLoading(false);
    }
  };

  const openView = async (record: API.RoleItem) => {
    await openEdit(record, 'view');
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (modalMode === 'view' || !isOwner) return;
      let confirmedProtectionChange = false;
      let affectedMemberCount = roleMemberCount;
      if (editingRole?.protected_account && !protectedAccount) {
        const impact = await getRoleProtectionImpact(editingRole.guid);
        affectedMemberCount = impact.affected_member_count;
      }
      if (
        editingRole?.protected_account &&
        !protectedAccount &&
        affectedMemberCount > 0
      ) {
        const confirmed = await new Promise<boolean>((resolve) => {
          Modal.confirm({
            title: intl.formatMessage({
              id: 'pages.roles.disableProtectionConfirm',
              defaultMessage: 'Disable protection for this role?',
            }),
            content: intl.formatMessage(
              {
                id: 'pages.roles.disableProtectionAffected',
                defaultMessage:
                  '{count} members will become manageable by delegated administrators.',
              },
              { count: affectedMemberCount },
            ),
            onOk: () => resolve(true),
            onCancel: () => resolve(false),
          });
        });
        if (!confirmed) return;
        confirmedProtectionChange = true;
      }
      setSaving(true);
      const payload: API.CreateRoleParams = {
        name: values.name.trim(),
        note: values.note,
        permissions: getAssignablePermissionPayload(checkedKeys, catalog),
        protected_account: protectedAccount,
        ...(confirmedProtectionChange
          ? { confirm_protected_account_change: true }
          : {}),
      };
      if (editingRole) {
        await updateRole(editingRole.guid, payload);
      } else {
        await createRole(payload);
      }
      msgApi.success(
        intl.formatMessage({
          id: editingRole
            ? 'pages.roles.updateSuccess'
            : 'pages.roles.createSuccess',
          defaultMessage: editingRole
            ? 'Role updated successfully'
            : 'Role created successfully',
        }),
      );
      closeModal();
      actionRef.current?.reload();
    } catch (error) {
      if ((error as { errorFields?: unknown })?.errorFields) return;
      msgApi.error(
        getRequestErrorMessage(
          error,
          intl.formatMessage({
            id: editingRole
              ? 'pages.roles.updateFailed'
              : 'pages.roles.createFailed',
            defaultMessage: editingRole
              ? 'Failed to update role'
              : 'Failed to create role',
          }),
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (guid: string) => {
    try {
      await deleteRole(guid);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.roles.deleteSuccess',
          defaultMessage: 'Role deleted successfully',
        }),
      );
      actionRef.current?.reload();
    } catch (error) {
      msgApi.error(
        getRequestErrorMessage(
          error,
          intl.formatMessage({
            id: 'pages.roles.deleteFailed',
            defaultMessage: 'Failed to delete role',
          }),
        ),
      );
    }
  };

  const columns: ProColumns<RoleListRow>[] = [
    {
      title: (
        <FormattedMessage id="pages.roles.name" defaultMessage="Role Name" />
      ),
      dataIndex: 'name',
      width: 220,
      render: (_, record) => (
        <Space>
          <SafetyCertificateOutlined style={{ color: '#1677ff' }} />
          <span>{record.name}</span>
          {isBuiltInRoleRow(record) && (
            <Tag>
              <FormattedMessage
                id="pages.roles.systemIdentity.builtIn"
                defaultMessage="Built-in"
              />
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: <FormattedMessage id="pages.roles.note" defaultMessage="Note" />,
      dataIndex: 'note',
      width: 260,
      ellipsis: true,
      render: (_, record) => record.note || '-',
    },
    {
      title: (
        <span>
          <FormattedMessage
            id="pages.roles.permissions"
            defaultMessage="Permissions"
          />
          <Tooltip
            title={intl.formatMessage({
              id: 'pages.roles.permissionsInfo',
              defaultMessage:
                'Number of effective permissions and capabilities',
            })}
          >
            <InfoCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </span>
      ),
      dataIndex: 'permissions',
      width: 130,
      search: false,
      render: (_, record) => (
        <Tag color="blue">
          {record.permission_count ?? record.permissions.length}
        </Tag>
      ),
    },
    {
      title: (
        <FormattedMessage id="pages.common.action" defaultMessage="Action" />
      ),
      valueType: 'option',
      width: 190,
      fixed: 'right',
      render: (_, record) => (
        <Space size={0} separator={<Divider orientation="vertical" />}>
          {isBuiltInRoleRow(record) ? (
            <Button
              key="view-built-in"
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => void openSystemIdentity(record)}
            >
              <FormattedMessage id="pages.roles.view" defaultMessage="View" />
            </Button>
          ) : !isOwner ? (
            <Button
              key="view"
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => void openView(record)}
            >
              <FormattedMessage id="pages.roles.view" defaultMessage="View" />
            </Button>
          ) : null}
          {!isBuiltInRoleRow(record) && (
            <Tooltip
              title={
                !isOwner
                  ? intl.formatMessage({
                      id: 'pages.roles.ownerOnly',
                      defaultMessage: 'Super administrator only',
                    })
                  : undefined
              }
            >
              <span>
                <Button
                  key="edit"
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => void openEdit(record)}
                  disabled={!isOwner}
                >
                  <FormattedMessage
                    id="pages.common.edit"
                    defaultMessage="Edit"
                  />
                </Button>
              </span>
            </Tooltip>
          )}
          {!isBuiltInRoleRow(record) && (
            <Tooltip
              title={
                !isOwner
                  ? intl.formatMessage({
                      id: 'pages.roles.ownerOnly',
                      defaultMessage: 'Super administrator only',
                    })
                  : undefined
              }
            >
              <Popconfirm
                title={intl.formatMessage({
                  id: 'pages.roles.deleteConfirm',
                  defaultMessage: 'Are you sure to delete this role?',
                })}
                onConfirm={() => void handleDelete(record.guid)}
                disabled={!isOwner}
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
                  key="delete"
                  type="link"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  disabled={!isOwner}
                >
                  <FormattedMessage
                    id="pages.common.delete"
                    defaultMessage="Delete"
                  />
                </Button>
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        title={intl.formatMessage({
          id: 'pages.roles.superAdminInfo',
          defaultMessage:
            'Super-administrator access is protected separately and cannot be granted through a role.',
        })}
      />
      <ProTable<RoleListRow>
        headerTitle={
          <FormattedMessage id="pages.roles.list" defaultMessage="Role List" />
        }
        columnsState={{
          persistenceType: 'localStorage',
          persistenceKey: 'role_list_columns_state',
        }}
        actionRef={actionRef}
        rowKey="guid"
        request={async (params) => {
          const pageSize = params.pageSize || 20;
          const currentPage = params.current || 1;
          const loadedCatalog =
            catalog.length > 0 ? catalog : await loadCatalog();
          const labels = {
            ordinary: {
              name: intl.formatMessage({
                id: 'pages.roles.systemIdentity.ordinary',
                defaultMessage: 'Ordinary user',
              }),
              note: intl.formatMessage({
                id: 'pages.roles.systemIdentity.ordinarySummary',
                defaultMessage:
                  'Personal address book basic functionality only.',
              }),
            },
            superAdmin: {
              name: intl.formatMessage({
                id: 'pages.roles.systemIdentity.superAdmin',
                defaultMessage: 'Super administrator',
              }),
              note: intl.formatMessage({
                id: 'pages.roles.systemIdentity.superAdminSummary',
                defaultMessage:
                  'Full effective authority for the unique system owner.',
              }),
            },
          };
          const builtIns = getBuiltInRoleRows(loadedCatalog, labels, {
            name: params.name,
            note: params.note,
          });
          const window = getRoleListPageWindow(
            currentPage,
            pageSize,
            builtIns.length,
          );
          const builtInRows = builtIns.slice(
            window.builtInOffset,
            window.builtInOffset + window.builtInLimit,
          );

          const chunkSize = 100;
          const firstCustomPage =
            Math.floor(window.customOffset / chunkSize) + 1;
          const firstCustomOffset = window.customOffset % chunkSize;
          const firstResult = await getRoleList({
            current: window.customLimit > 0 ? firstCustomPage : 1,
            pageSize: window.customLimit > 0 ? chunkSize : 1,
            name: params.name,
            note: params.note,
          });
          const customRows =
            window.customLimit > 0
              ? firstResult.data.slice(firstCustomOffset)
              : [];
          if (
            customRows.length < window.customLimit &&
            firstCustomPage * chunkSize < firstResult.total
          ) {
            const nextResult = await getRoleList({
              current: firstCustomPage + 1,
              pageSize: chunkSize,
              name: params.name,
              note: params.note,
            });
            customRows.push(...nextResult.data);
          }
          return {
            data: [...builtInRows, ...customRows.slice(0, window.customLimit)],
            total: builtIns.length + firstResult.total,
            success: true,
          };
        }}
        columns={columns}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        scroll={{ x: 900 }}
        search={{ labelWidth: 'auto' }}
        toolBarRender={() => [
          <Tooltip
            key="create-tip"
            title={
              !isOwner
                ? intl.formatMessage({
                    id: 'pages.roles.ownerOnly',
                    defaultMessage: 'Super administrator only',
                  })
                : undefined
            }
          >
            <span>
              <Button
                key="create"
                type="primary"
                icon={<PlusOutlined />}
                onClick={openCreate}
                disabled={!isOwner}
              >
                <FormattedMessage
                  id="pages.roles.create"
                  defaultMessage="Create Role"
                />
              </Button>
            </span>
          </Tooltip>,
        ]}
        options={{
          density: true,
          setting: { listsHeight: 400 },
          fullScreen: false,
          reload: true,
        }}
      />

      <Modal
        title={
          <FormattedMessage
            id={
              modalMode === 'view'
                ? 'pages.roles.view'
                : modalMode === 'edit'
                  ? 'pages.roles.edit'
                  : 'pages.roles.create'
            }
            defaultMessage={
              modalMode === 'view'
                ? 'View Role'
                : modalMode === 'edit'
                  ? 'Edit Role'
                  : 'Create Role'
            }
          />
        }
        open={modalOpen}
        onCancel={closeModal}
        onOk={modalMode === 'view' ? undefined : () => void handleSubmit()}
        footer={
          modalMode === 'view'
            ? [
                <Button key="close" onClick={closeModal}>
                  <FormattedMessage
                    id="pages.common.close"
                    defaultMessage="Close"
                  />
                </Button>,
              ]
            : undefined
        }
        confirmLoading={saving}
        okButtonProps={{
          disabled:
            !isOwner || detailLoading || catalogLoading || catalog.length === 0,
        }}
        destroyOnHidden
        width={680}
      >
        {detailLoading || catalogLoading ? (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <Spin />
          </div>
        ) : (
          <Form form={form} layout="vertical" disabled={formReadOnly}>
            <Form.Item
              name="name"
              label={
                <FormattedMessage
                  id="pages.roles.name"
                  defaultMessage="Role Name"
                />
              }
              rules={[
                {
                  required: true,
                  whitespace: true,
                  message: intl.formatMessage({
                    id: 'pages.common.pleaseEnterRoleName',
                    defaultMessage: 'Please enter role name',
                  }),
                },
              ]}
            >
              <Input maxLength={255} disabled={formReadOnly} />
            </Form.Item>
            <Form.Item
              name="note"
              label={
                <FormattedMessage id="pages.roles.note" defaultMessage="Note" />
              }
            >
              <Input.TextArea
                rows={3}
                maxLength={2000}
                disabled={formReadOnly}
              />
            </Form.Item>
            <Form.Item>
              <Space size={8} wrap={false}>
                <label
                  htmlFor="role-permission-preset"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <FormattedMessage
                    id="pages.roles.permissionPresets"
                    defaultMessage="Permission presets"
                  />
                </label>
                <Select<RolePermissionPresetSelection>
                  id="role-permission-preset"
                  size="small"
                  value={selectedPreset}
                  style={{ width: 220 }}
                  onChange={(presetKey) => {
                    if (formReadOnly) return;
                    setCheckedKeys((current) =>
                      applyRolePermissionPreset(presetKey, current, catalog),
                    );
                    setProtectedAccount(presetEnablesProtection(presetKey));
                  }}
                  disabled={formReadOnly}
                  options={[
                    {
                      value: CUSTOM_ROLE_PERMISSION_PRESET_KEY,
                      label: intl.formatMessage({
                        id: 'pages.roles.preset.custom',
                        defaultMessage: 'Custom',
                      }),
                    },
                    ...ROLE_PERMISSION_PRESETS.map((preset) => ({
                      value: preset.key,
                      label: intl.formatMessage({
                        id: `pages.roles.preset.${preset.key}`,
                        defaultMessage: preset.defaultMessage,
                      }),
                    })),
                  ]}
                />
              </Space>
            </Form.Item>
            <Form.Item
              label={
                <FormattedMessage
                  id="pages.roles.selectPermissions"
                  defaultMessage="Select Permissions"
                />
              }
              extra={intl.formatMessage({
                id: 'pages.roles.permissionScopeInfo',
                defaultMessage:
                  'Device actions can be assigned globally or to selected device groups when a user receives this role.',
              })}
            >
              <Tree
                checkable
                disabled={formReadOnly}
                defaultExpandAll
                height={320}
                treeData={treeData}
                checkedKeys={[
                  ...checkedKeys,
                  PERSONAL_ADDRESS_BOOK_KEY,
                  ...(protectedAccount ? [PROTECTED_ACCOUNT_KEY] : []),
                  ...(systemIdentity === 'superAdmin'
                    ? SUPER_ADMIN_NON_CATALOG_CAPABILITIES.map(
                        getSystemCapabilityTreeKey,
                      )
                    : []),
                ]}
                onCheck={(keys, info) => {
                  const values = Array.isArray(keys) ? keys : keys.checked;
                  const selected = values
                    .map(String)
                    .filter((code) => permissionCodes.has(code));
                  const changedCode = String(info.node.key);
                  if (changedCode === PROTECTED_ACCOUNT_KEY) {
                    if (!formReadOnly) setProtectedAccount(info.checked);
                    return;
                  }
                  if (formReadOnly) return;
                  setCheckedKeys(
                    info.checked
                      ? addRequiredPermissions(selected, catalog)
                      : removeDependentPermissions(
                          selected,
                          changedCode,
                          catalog,
                        ),
                  );
                }}
              />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </PageContainer>
  );
};

export default RoleList;
