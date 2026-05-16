import {
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ModalForm, PageContainer, ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import {
  App,
  Button,
  Checkbox,
  Divider,
  Form,
  Input,
  Popconfirm,
  Space,
  Tag,
  Tooltip,
  Tree,
} from 'antd';
import React, { useRef, useState } from 'react';
import {
  createRole,
  deleteRole,
  getPermissionList,
  getRoleList,
  updateRole,
} from '@/services/rustdesk-console/role';

const RoleList: React.FC = () => {
  const intl = useIntl();
  const { message: msgApi } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentRole, setCurrentRole] = useState<API.RoleItem | null>(null);
  const [permissions, setPermissions] = useState<API.PermissionItem[]>([]);
  const [form] = Form.useForm();

  const fetchPermissions = async () => {
    try {
      const data = await getPermissionList();
      setPermissions(data || []);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    }
  };

  const handleCreate = async (values: API.CreateRoleParams) => {
    try {
      await createRole(values);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.roles.createSuccess',
          defaultMessage: 'Role created successfully',
        }),
      );
      setCreateModalVisible(false);
      form.resetFields();
      actionRef.current?.reload();
    } catch (error) {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.roles.createFailed',
          defaultMessage: 'Failed to create role',
        }),
      );
    }
  };

  const handleUpdate = async (values: API.UpdateRoleParams) => {
    if (!currentRole) return;
    try {
      await updateRole(currentRole.guid, values);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.roles.updateSuccess',
          defaultMessage: 'Role updated successfully',
        }),
      );
      setEditModalVisible(false);
      setCurrentRole(null);
      form.resetFields();
      actionRef.current?.reload();
    } catch (error) {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.roles.updateFailed',
          defaultMessage: 'Failed to update role',
        }),
      );
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
        intl.formatMessage({
          id: 'pages.roles.deleteFailed',
          defaultMessage: 'Failed to delete role',
        }),
      );
    }
  };

  const handleEdit = (record: API.RoleItem) => {
    setCurrentRole(record);
    form.setFieldsValue({
      name: record.name,
      note: record.note,
    });
    setEditModalVisible(true);
    fetchPermissions();
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
      width: 200,
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
      width: 250,
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
      dataIndex: 'permission_count',
      width: 120,
      search: false,
      render: (_, record) => (
        <Tag color="blue">{record.permission_count || 0}</Tag>
      ),
    },
    {
      title: (
        <FormattedMessage id="pages.common.action" defaultMessage="Action" />
      ),
      valueType: 'option',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size={0} split={<Divider type="vertical" />}>
          <Button
            key="edit"
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            <FormattedMessage id="pages.common.edit" defaultMessage="Edit" />
          </Button>
          <Popconfirm
            title={intl.formatMessage({
              id: 'pages.roles.deleteConfirm',
              defaultMessage: 'Are you sure to delete this role?',
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

  const buildPermissionTree = () => {
    const grouped = permissions.reduce(
      (acc, perm) => {
        const module = perm.module || 'Other';
        if (!acc[module]) acc[module] = [];
        acc[module].push(perm);
        return acc;
      },
      {} as Record<string, API.PermissionItem[]>,
    );

    return Object.entries(grouped).map(([module, perms]) => ({
      title: module,
      key: module,
      children: perms.map((perm) => ({
        title: (
          <Space>
            <span>{perm.name}</span>
            {perm.description && (
              <Tooltip title={perm.description}>
                <InfoCircleOutlined style={{ color: '#999' }} />
              </Tooltip>
            )}
          </Space>
        ),
        key: perm.id,
      })),
    }));
  };

  return (
    <PageContainer>
      <ProTable<API.RoleItem>
        headerTitle={
          <FormattedMessage id="pages.roles.list" defaultMessage="Role List" />
        }
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
        scroll={{ x: 800 }}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setCreateModalVisible(true);
              fetchPermissions();
            }}
          >
            <FormattedMessage
              id="pages.roles.create"
              defaultMessage="Create Role"
            />
          </Button>,
        ]}
        options={{
          density: true,
          setting: {
            listsHeight: 400,
          },
          fullScreen: false,
          reload: true,
        }}
      />

      {/* Create Role Modal */}
      <ModalForm
        title={
          <FormattedMessage
            id="pages.roles.create"
            defaultMessage="Create Role"
          />
        }
        open={createModalVisible}
        onOpenChange={setCreateModalVisible}
        onFinish={handleCreate}
        form={form}
        layout="vertical"
        width={600}
        modalProps={{
          destroyOnClose: true,
        }}
      >
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
              message: intl.formatMessage({
                id: 'pages.common.pleaseEnterRoleName',
                defaultMessage: 'Please enter role name',
              }),
            },
          ]}
        >
          <Input
            placeholder={intl.formatMessage({
              id: 'pages.common.pleaseEnterRoleName',
              defaultMessage: 'Please enter role name',
            })}
          />
        </Form.Item>
        <Form.Item
          name="note"
          label={
            <FormattedMessage id="pages.roles.note" defaultMessage="Note" />
          }
        >
          <Input.TextArea
            rows={3}
            placeholder={intl.formatMessage({
              id: 'pages.common.enterDescription',
              defaultMessage: 'Enter description',
            })}
          />
        </Form.Item>
        <Form.Item
          name="permissions"
          label={
            <FormattedMessage
              id="pages.roles.selectPermissions"
              defaultMessage="Select Permissions"
            />
          }
        >
          <Checkbox.Group style={{ width: '100%' }}>
            <Tree
              checkable
              treeData={buildPermissionTree()}
              defaultExpandAll
              height={300}
              style={{ overflow: 'auto' }}
            />
          </Checkbox.Group>
        </Form.Item>
      </ModalForm>

      {/* Edit Role Modal */}
      <ModalForm
        title={
          <FormattedMessage id="pages.roles.edit" defaultMessage="Edit Role" />
        }
        open={editModalVisible}
        onOpenChange={setEditModalVisible}
        onFinish={handleUpdate}
        form={form}
        layout="vertical"
        width={600}
        modalProps={{
          destroyOnClose: true,
        }}
      >
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
              message: intl.formatMessage({
                id: 'pages.common.pleaseEnterRoleName',
                defaultMessage: 'Please enter role name',
              }),
            },
          ]}
        >
          <Input
            placeholder={intl.formatMessage({
              id: 'pages.common.pleaseEnterRoleName',
              defaultMessage: 'Please enter role name',
            })}
          />
        </Form.Item>
        <Form.Item
          name="note"
          label={
            <FormattedMessage id="pages.roles.note" defaultMessage="Note" />
          }
        >
          <Input.TextArea
            rows={3}
            placeholder={intl.formatMessage({
              id: 'pages.common.enterDescription',
              defaultMessage: 'Enter description',
            })}
          />
        </Form.Item>
        <Form.Item
          name="permissions"
          label={
            <FormattedMessage
              id="pages.roles.selectPermissions"
              defaultMessage="Select Permissions"
            />
          }
        >
          <Checkbox.Group style={{ width: '100%' }}>
            <Tree
              checkable
              treeData={buildPermissionTree()}
              defaultExpandAll
              height={300}
              style={{ overflow: 'auto' }}
            />
          </Checkbox.Group>
        </Form.Item>
      </ModalForm>
    </PageContainer>
  );
};

export default RoleList;
