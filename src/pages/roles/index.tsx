import {
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import {
  Alert,
  App,
  Button,
  Divider,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Spin,
  Tag,
  Tooltip,
  Tree,
  Typography,
} from 'antd';
import type { DataNode } from 'antd/es/tree';
import React, { useMemo, useRef, useState } from 'react';
import {
  createRole,
  deleteRole,
  getPermissionList,
  getRoleDetail,
  getRoleList,
  updateRole,
} from '@/services/rustdesk-console/role';
import { getRequestErrorMessage } from '@/utils/requestError';

const RoleList: React.FC = () => {
  const intl = useIntl();
  const { message: msgApi } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [form] = Form.useForm<API.CreateRoleParams>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<API.RoleItem | null>(null);
  const [catalog, setCatalog] = useState<API.PermissionItem[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadCatalog = async () => {
    if (catalog.length > 0) return catalog;
    setCatalogLoading(true);
    try {
      const response = await getPermissionList();
      const items = Array.isArray(response) ? response : response?.data || [];
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
    () =>
      new Set(catalog.map((permission) => permission.code || permission.id)),
    [catalog],
  );

  const treeData = useMemo<DataNode[]>(() => {
    const grouped = new Map<string, API.PermissionItem[]>();
    for (const permission of catalog) {
      const resource = permission.resource || permission.module || 'other';
      const values = grouped.get(resource) || [];
      values.push(permission);
      grouped.set(resource, values);
    }
    return [...grouped.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([resource, values]) => ({
        key: `resource:${resource}`,
        title: (
          <FormattedMessage
            id={`pages.roles.permissionResource.${resource}`}
            defaultMessage={resource}
          />
        ),
        children: values
          .sort((a, b) =>
            (a.code || a.id || '').localeCompare(b.code || b.id || ''),
          )
          .map((permission) => {
            const code = permission.code || permission.id || '';
            return {
              key: code,
              title: (
                <Space size={4}>
                  <FormattedMessage
                    id={`pages.roles.permission.${code}`}
                    defaultMessage={code}
                  />
                  <Typography.Text type="secondary">({code})</Typography.Text>
                </Space>
              ),
              disabled: !code,
            };
          }),
      }));
  }, [catalog]);

  const closeModal = () => {
    setModalOpen(false);
    setEditingRole(null);
    setCheckedKeys([]);
    form.resetFields();
  };

  const openCreate = () => {
    setEditingRole(null);
    setCheckedKeys([]);
    form.resetFields();
    setModalOpen(true);
    void loadCatalog();
  };

  const openEdit = async (record: API.RoleItem) => {
    setEditingRole(record);
    setModalOpen(true);
    setDetailLoading(true);
    const loadedCatalog = await loadCatalog();
    try {
      const detail = await getRoleDetail(record.guid);
      form.setFieldsValue({ name: detail.name, note: detail.note || '' });
      const validCodes = new Set(
        loadedCatalog.map((permission) => permission.code || permission.id),
      );
      setCheckedKeys(
        (detail.permissions || []).filter((code) => validCodes.has(code)),
      );
    } catch (error) {
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
      setDetailLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const payload: API.CreateRoleParams = {
        name: values.name.trim(),
        note: values.note,
        permissions: checkedKeys.filter((code) => permissionCodes.has(code)),
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

  const columns: ProColumns<API.RoleItem>[] = [
    {
      title: '',
      dataIndex: 'index',
      valueType: 'indexBorder',
      width: 50,
    },
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
              defaultMessage: 'Number of assigned permissions',
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
          {record.permissions?.length ?? record.permission_count ?? 0}
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
        <Space size={0} split={<Divider type="vertical" />}>
          <Button
            key="edit"
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => void openEdit(record)}
          >
            <FormattedMessage id="pages.common.edit" defaultMessage="Edit" />
          </Button>
          <Popconfirm
            title={intl.formatMessage({
              id: 'pages.roles.deleteConfirm',
              defaultMessage: 'Are you sure to delete this role?',
            })}
            onConfirm={() => void handleDelete(record.guid)}
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
            >
              <FormattedMessage
                id="pages.common.delete"
                defaultMessage="Delete"
              />
            </Button>
          </Popconfirm>
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
        message={intl.formatMessage({
          id: 'pages.roles.superAdminInfo',
          defaultMessage:
            'Super-administrator access is protected separately and cannot be granted through a role.',
        })}
      />
      <ProTable<API.RoleItem>
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
          const result = await getRoleList({
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
        columns={columns}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        scroll={{ x: 900 }}
        search={{ labelWidth: 'auto' }}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreate}
          >
            <FormattedMessage
              id="pages.roles.create"
              defaultMessage="Create Role"
            />
          </Button>,
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
            id={editingRole ? 'pages.roles.edit' : 'pages.roles.create'}
            defaultMessage={editingRole ? 'Edit Role' : 'Create Role'}
          />
        }
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => void handleSubmit()}
        confirmLoading={saving}
        destroyOnClose
        width={680}
      >
        {detailLoading || catalogLoading ? (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <Spin />
          </div>
        ) : (
          <Form form={form} layout="vertical">
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
              <Input maxLength={255} />
            </Form.Item>
            <Form.Item
              name="note"
              label={
                <FormattedMessage id="pages.roles.note" defaultMessage="Note" />
              }
            >
              <Input.TextArea rows={3} maxLength={2000} />
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
                defaultExpandAll
                height={320}
                treeData={treeData}
                checkedKeys={checkedKeys}
                onCheck={(keys) => {
                  const values = Array.isArray(keys) ? keys : keys.checked;
                  setCheckedKeys(
                    values
                      .map(String)
                      .filter((code) => permissionCodes.has(code)),
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
