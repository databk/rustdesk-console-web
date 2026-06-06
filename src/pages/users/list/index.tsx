import {
  CrownOutlined,
  DeleteOutlined,
  EditOutlined,
  LogoutOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
  PlusOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useIntl, useModel } from '@umijs/max';
import {
  App,
  Button,
  Divider,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Tag,
  Tooltip,
} from 'antd';
import React, { useRef, useState } from 'react';
import {
  batchForceLogout,
  batchUpdateUserStatus,
  createUser,
  deleteUser,
  forceLogoutUser,
  getAdminUserList,
  inviteUser,
  updateUser,
  updateUserSecurity,
} from '@/services/rustdesk-console/user';

const UserList: React.FC = () => {
  const intl = useIntl();
  const { message: msgApi } = App.useApp();
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const actionRef = useRef<ActionType>(null);

  // Modal states
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [securityModalVisible, setSecurityModalVisible] = useState(false);

  // Form instances
  const [createForm] = Form.useForm();
  const [inviteForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [securityForm] = Form.useForm();

  // Selection states (for batch operations)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<API.UserItem[]>([]);
  const [batchStatusUpdating, setBatchStatusUpdating] = useState(false);
  const [batchForceLoggingOut, setBatchForceLoggingOut] = useState(false);

  // Current user being edited
  const [editingUser, setEditingUser] = useState<API.UserItem | null>(null);

  // Create user
  const handleCreate = async (values: API.CreateUserParams) => {
    try {
      await createUser(values);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.users.createSuccess',
          defaultMessage: 'User created',
        }),
      );
      setCreateModalVisible(false);
      createForm.resetFields();
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.users.createFailed',
          defaultMessage: 'Failed to create user',
        }),
      );
    }
  };

  // Invite user
  const handleInvite = async (values: API.InviteUserParams) => {
    try {
      await inviteUser(values);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.users.inviteSuccess',
          defaultMessage: 'Invitation sent',
        }),
      );
      setInviteModalVisible(false);
      inviteForm.resetFields();
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.users.inviteFailed',
          defaultMessage: 'Failed to send invitation',
        }),
      );
    }
  };

  // Edit user
  const handleEdit = async (values: API.UpdateUserParams) => {
    if (!editingUser) return;
    try {
      await updateUser(editingUser.guid, values);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.users.updateSuccess',
          defaultMessage: 'User updated',
        }),
      );
      setEditModalVisible(false);
      setEditingUser(null);
      editForm.resetFields();
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.users.updateFailed',
          defaultMessage: 'Failed to update user',
        }),
      );
    }
  };

  // Delete user
  const handleDelete = async (guid: string) => {
    try {
      await deleteUser(guid);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.users.deleteSuccess',
          defaultMessage: 'User deleted',
        }),
      );
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.users.deleteFailed',
          defaultMessage: 'Failed to delete user',
        }),
      );
    }
  };

  // Update single user security
  const handleUpdateSecurity = async (values: API.UpdateUserSecurityParams) => {
    if (!editingUser) return;
    try {
      await updateUserSecurity(editingUser.guid, values);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.users.securityUpdateSuccess',
          defaultMessage: 'Security settings updated',
        }),
      );
      setSecurityModalVisible(false);
      setEditingUser(null);
      securityForm.resetFields();
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.users.securityUpdateFailed',
          defaultMessage: 'Failed to update security settings',
        }),
      );
    }
  };

  // Force logout single user
  const handleForceLogout = async (guid: string) => {
    try {
      await forceLogoutUser(guid);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.users.forceLogoutSuccess',
          defaultMessage: 'Force logout successful',
        }),
      );
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.users.forceLogoutFailed',
          defaultMessage: 'Failed to force logout',
        }),
      );
    }
  };

  // Batch enable
  const handleBatchEnable = async () => {
    if (selectedRows.length === 0) return;
    setBatchStatusUpdating(true);
    try {
      const userGuids = selectedRows.map((row) => row.guid);
      const result = await batchUpdateUserStatus({
        user_guids: userGuids,
        status: 1,
      });
      if (result.failedCount > 0) {
        msgApi.warning(
          intl.formatMessage(
            {
              id: 'pages.users.batchEnablePartialFailed',
              defaultMessage:
                'Successfully enabled {success} user(s), {failed} failed',
            },
            { success: result.succeededCount, failed: result.failedCount },
          ),
        );
      } else {
        msgApi.success(
          intl.formatMessage(
            {
              id: 'pages.users.batchEnableSuccess',
              defaultMessage: 'Successfully enabled {count} user(s)',
            },
            { count: result.succeededCount },
          ),
        );
      }
      setSelectedRowKeys([]);
      setSelectedRows([]);
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.users.batchEnableFailed',
          defaultMessage: 'Failed to enable users',
        }),
      );
    } finally {
      setBatchStatusUpdating(false);
    }
  };

  // Batch disable
  const handleBatchDisable = async () => {
    if (selectedRows.length === 0) return;
    setBatchStatusUpdating(true);
    try {
      const userGuids = selectedRows.map((row) => row.guid);
      const result = await batchUpdateUserStatus({
        user_guids: userGuids,
        status: 0,
      });
      if (result.failedCount > 0) {
        msgApi.warning(
          intl.formatMessage(
            {
              id: 'pages.users.batchDisablePartialFailed',
              defaultMessage:
                'Successfully disabled {success} user(s), {failed} failed',
            },
            { success: result.succeededCount, failed: result.failedCount },
          ),
        );
      } else {
        msgApi.success(
          intl.formatMessage(
            {
              id: 'pages.users.batchDisableSuccess',
              defaultMessage: 'Successfully disabled {count} user(s)',
            },
            { count: result.succeededCount },
          ),
        );
      }
      setSelectedRowKeys([]);
      setSelectedRows([]);
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.users.batchDisableFailed',
          defaultMessage: 'Failed to disable users',
        }),
      );
    } finally {
      setBatchStatusUpdating(false);
    }
  };

  // Batch force logout
  const handleBatchForceLogout = async () => {
    if (selectedRows.length === 0) return;
    setBatchForceLoggingOut(true);
    try {
      const userGuids = selectedRows.map((row) => row.guid);
      await batchForceLogout({ user_guids: userGuids });
      msgApi.success(
        intl.formatMessage({
          id: 'pages.users.batchForceLogoutSuccess',
          defaultMessage: 'Force logout successful',
        }),
      );
      setSelectedRowKeys([]);
      setSelectedRows([]);
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.users.batchForceLogoutFailed',
          defaultMessage: 'Failed to force logout',
        }),
      );
    } finally {
      setBatchForceLoggingOut(false);
    }
  };

  // Open edit modal
  const openEditModal = (record: API.UserItem) => {
    setEditingUser(record);
    editForm.setFieldsValue({
      name: record.name,
      email: record.email,
      note: record.note,
      status: record.status,
      is_admin: record.is_admin,
    });
    setEditModalVisible(true);
  };

  // Open security modal
  const openSecurityModal = (record: API.UserItem) => {
    setEditingUser(record);
    securityForm.resetFields();
    setSecurityModalVisible(true);
  };

  // Status tag renderer
  const renderStatusTag = (status: number) => {
    if (status === 1) {
      return (
        <Tag icon={<PlusCircleOutlined />} color="green">
          <FormattedMessage id="pages.users.active" defaultMessage="Active" />
        </Tag>
      );
    }
    if (status === 0) {
      return (
        <Tag icon={<MinusCircleOutlined />} color="red">
          <FormattedMessage
            id="pages.users.disabled"
            defaultMessage="Disabled"
          />
        </Tag>
      );
    }
    if (status === -1) {
      return (
        <Tag color="orange">
          <FormattedMessage
            id="pages.users.unverified"
            defaultMessage="Unverified"
          />
        </Tag>
      );
    }
    return <Tag>{status}</Tag>;
  };

  const columns: ProColumns<API.UserItem>[] = [
    {
      title: (
        <FormattedMessage id="pages.users.name" defaultMessage="Username" />
      ),
      dataIndex: 'name',
      width: 150,
      ellipsis: true,
      render: (_: unknown, record: API.UserItem) => (
        <Space>
          <span>{record.name}</span>
          {record.is_admin && (
            <Tooltip
              title={intl.formatMessage({
                id: 'pages.users.admin',
                defaultMessage: 'Admin',
              })}
            >
              <CrownOutlined style={{ color: '#faad14' }} />
            </Tooltip>
          )}
          {record.name === currentUser?.name && (
            <Tag color="blue">
              <FormattedMessage id="pages.users.me" defaultMessage="Me" />
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: <FormattedMessage id="pages.users.email" defaultMessage="Email" />,
      dataIndex: 'email',
      width: 200,
      ellipsis: true,
      render: (_: unknown, record: API.UserItem) => record.email || '-',
    },
    {
      title: (
        <FormattedMessage id="pages.users.status" defaultMessage="Status" />
      ),
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: {
        1: {
          text: intl.formatMessage({
            id: 'pages.users.active',
            defaultMessage: 'Active',
          }),
          status: 'Success',
        },
        0: {
          text: intl.formatMessage({
            id: 'pages.users.disabled',
            defaultMessage: 'Disabled',
          }),
          status: 'Error',
        },
        [-1]: {
          text: intl.formatMessage({
            id: 'pages.users.unverified',
            defaultMessage: 'Unverified',
          }),
          status: 'Warning',
        },
      },
      render: (_: unknown, record: API.UserItem) =>
        renderStatusTag(record.status),
    },
    {
      title: (
        <FormattedMessage id="pages.users.isAdmin" defaultMessage="Admin" />
      ),
      dataIndex: 'is_admin',
      width: 80,
      valueType: 'select',
      valueEnum: {
        true: {
          text: intl.formatMessage({
            id: 'pages.users.admin',
            defaultMessage: 'Admin',
          }),
          status: 'Processing',
        },
        false: {
          text: intl.formatMessage({
            id: 'pages.users.normalUser',
            defaultMessage: 'Normal',
          }),
          status: 'Default',
        },
      },
      render: (_: unknown, record: API.UserItem) =>
        record.is_admin ? (
          <Tag color="blue">
            <FormattedMessage id="pages.users.admin" defaultMessage="Admin" />
          </Tag>
        ) : (
          <span>-</span>
        ),
    },
    {
      title: (
        <FormattedMessage id="pages.users.strategy" defaultMessage="Strategy" />
      ),
      dataIndex: 'strategy_name',
      width: 120,
      search: false,
      render: (_: unknown, record: API.UserItem) => record.strategy_name || '-',
    },
    {
      title: (
        <FormattedMessage
          id="pages.users.thirdAuthType"
          defaultMessage="Auth Type"
        />
      ),
      dataIndex: 'third_auth_type',
      width: 100,
      search: false,
      render: (_: unknown, record: API.UserItem) =>
        record.third_auth_type || '-',
    },
    {
      title: <FormattedMessage id="pages.users.note" defaultMessage="Note" />,
      dataIndex: 'note',
      width: 150,
      ellipsis: true,
      search: false,
      render: (_: unknown, record: API.UserItem) => record.note || '-',
    },
    {
      title: (
        <FormattedMessage id="pages.common.action" defaultMessage="Action" />
      ),
      valueType: 'option',
      width: 220,
      fixed: 'right',
      render: (_: unknown, record: API.UserItem) => (
        <Space size={0} split={<Divider type="vertical" />}>
          <Button
            key="edit"
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          >
            <FormattedMessage id="pages.common.edit" defaultMessage="Edit" />
          </Button>
          <Button
            key="security"
            type="link"
            size="small"
            icon={<SafetyOutlined />}
            onClick={() => openSecurityModal(record)}
          >
            <FormattedMessage
              id="pages.users.security"
              defaultMessage="Security"
            />
          </Button>
          <Button
            key="logout"
            type="link"
            size="small"
            icon={<LogoutOutlined />}
            onClick={() => handleForceLogout(record.guid)}
          >
            <FormattedMessage
              id="pages.users.forceLogout"
              defaultMessage="Logout"
            />
          </Button>
          <Popconfirm
            key="delete"
            title={
              <FormattedMessage
                id="pages.users.deleteConfirm"
                defaultMessage="Are you sure to delete this user?"
              />
            }
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
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
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
      <ProTable<API.UserItem>
        headerTitle={
          <FormattedMessage id="pages.users.list" defaultMessage="User List" />
        }
        actionRef={actionRef}
        rowKey="guid"
        rowSelection={{
          selectedRowKeys,
          onChange: (keys, rows) => {
            setSelectedRowKeys(keys);
            setSelectedRows(rows);
          },
        }}
        tableAlertOptionRender={() => (
          <Space size={16}>
            <Popconfirm
              title={
                <FormattedMessage
                  id="pages.users.batchEnableConfirm"
                  defaultMessage="Are you sure to enable selected users?"
                />
              }
              onConfirm={handleBatchEnable}
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
                icon={<PlusCircleOutlined />}
                loading={batchStatusUpdating}
                style={{ padding: 0 }}
              >
                <FormattedMessage
                  id="pages.users.batchEnable"
                  defaultMessage="Batch Enable"
                />
              </Button>
            </Popconfirm>
            <Popconfirm
              title={
                <FormattedMessage
                  id="pages.users.batchDisableConfirm"
                  defaultMessage="Are you sure to disable selected users?"
                />
              }
              onConfirm={handleBatchDisable}
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
                icon={<MinusCircleOutlined />}
                loading={batchStatusUpdating}
                style={{ padding: 0 }}
              >
                <FormattedMessage
                  id="pages.users.batchDisable"
                  defaultMessage="Batch Disable"
                />
              </Button>
            </Popconfirm>
            <Popconfirm
              title={
                <FormattedMessage
                  id="pages.users.batchForceLogoutConfirm"
                  defaultMessage="Are you sure to force logout selected users?"
                />
              }
              onConfirm={handleBatchForceLogout}
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
                icon={<LogoutOutlined />}
                loading={batchForceLoggingOut}
                style={{ padding: 0 }}
              >
                <FormattedMessage
                  id="pages.users.batchForceLogout"
                  defaultMessage="Batch Force Logout"
                />
              </Button>
            </Popconfirm>
          </Space>
        )}
        request={async (params) => {
          const result = await getAdminUserList({
            current: params.current || 1,
            pageSize: params.pageSize || 20,
            status: params.status,
            name: params.name,
            email: params.email,
            is_admin:
              params.is_admin === 'true'
                ? 1
                : params.is_admin === 'false'
                  ? 0
                  : undefined,
          });
          return {
            data: result.data || [],
            total: result.total || 0,
            success: true,
          };
        }}
        columns={columns}
        search={{
          labelWidth: 'auto',
          defaultCollapsed: true,
          optionRender: (_searchConfig, _formProps, dom) => [...dom.reverse()],
        }}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        scroll={{ x: 1400 }}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            <FormattedMessage id="pages.users.create" defaultMessage="Create" />
          </Button>,
          <Button
            key="invite"
            icon={<PlusOutlined />}
            onClick={() => setInviteModalVisible(true)}
          >
            <FormattedMessage id="pages.users.invite" defaultMessage="Invite" />
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

      {/* Create User Modal */}
      <Modal
        title={
          <FormattedMessage
            id="pages.users.create"
            defaultMessage="Create User"
          />
        }
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={() => createForm.submit()}
      >
        <Form form={createForm} onFinish={handleCreate} layout="vertical">
          <Form.Item
            name="name"
            label={
              <FormattedMessage
                id="pages.users.name"
                defaultMessage="Username"
              />
            }
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'pages.common.pleaseEnterUsername',
                  defaultMessage: 'Please enter username',
                }),
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="password"
            label={
              <FormattedMessage
                id="pages.users.password"
                defaultMessage="Password"
              />
            }
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'pages.common.pleaseEnterPassword',
                  defaultMessage: 'Please enter password',
                }),
              },
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="email"
            label={
              <FormattedMessage id="pages.users.email" defaultMessage="Email" />
            }
            rules={[
              {
                type: 'email',
                message: intl.formatMessage({
                  id: 'pages.common.pleaseEnterValidEmail',
                  defaultMessage: 'Please enter valid email',
                }),
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="note"
            label={
              <FormattedMessage id="pages.users.note" defaultMessage="Note" />
            }
          >
            <Input.TextArea />
          </Form.Item>
          <Form.Item
            name="group_name"
            label={
              <FormattedMessage
                id="pages.users.groupName"
                defaultMessage="Device Group"
              />
            }
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      {/* Invite User Modal */}
      <Modal
        title={
          <FormattedMessage
            id="pages.users.invite"
            defaultMessage="Invite User"
          />
        }
        open={inviteModalVisible}
        onCancel={() => setInviteModalVisible(false)}
        onOk={() => inviteForm.submit()}
      >
        <Form form={inviteForm} onFinish={handleInvite} layout="vertical">
          <Form.Item
            name="name"
            label={
              <FormattedMessage
                id="pages.users.name"
                defaultMessage="Username"
              />
            }
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'pages.common.pleaseEnterUsername',
                  defaultMessage: 'Please enter username',
                }),
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label={
              <FormattedMessage id="pages.users.email" defaultMessage="Email" />
            }
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'pages.common.pleaseEnterEmail',
                  defaultMessage: 'Please enter email',
                }),
              },
              {
                type: 'email',
                message: intl.formatMessage({
                  id: 'pages.common.pleaseEnterValidEmail',
                  defaultMessage: 'Please enter valid email',
                }),
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="note"
            label={
              <FormattedMessage id="pages.users.note" defaultMessage="Note" />
            }
          >
            <Input.TextArea />
          </Form.Item>
          <Form.Item
            name="group_name"
            label={
              <FormattedMessage
                id="pages.users.groupName"
                defaultMessage="Device Group"
              />
            }
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        title={
          <FormattedMessage id="pages.users.edit" defaultMessage="Edit User" />
        }
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingUser(null);
          editForm.resetFields();
        }}
        onOk={() => editForm.submit()}
      >
        <Form form={editForm} onFinish={handleEdit} layout="vertical">
          <Form.Item
            name="name"
            label={
              <FormattedMessage
                id="pages.users.name"
                defaultMessage="Username"
              />
            }
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'pages.common.pleaseEnterUsername',
                  defaultMessage: 'Please enter username',
                }),
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label={
              <FormattedMessage id="pages.users.email" defaultMessage="Email" />
            }
            rules={[
              {
                type: 'email',
                message: intl.formatMessage({
                  id: 'pages.common.pleaseEnterValidEmail',
                  defaultMessage: 'Please enter valid email',
                }),
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="note"
            label={
              <FormattedMessage id="pages.users.note" defaultMessage="Note" />
            }
          >
            <Input.TextArea />
          </Form.Item>
          <Form.Item
            name="status"
            label={
              <FormattedMessage
                id="pages.users.status"
                defaultMessage="Status"
              />
            }
          >
            <Select
              options={[
                {
                  label: intl.formatMessage({
                    id: 'pages.users.active',
                    defaultMessage: 'Active',
                  }),
                  value: 1,
                },
                {
                  label: intl.formatMessage({
                    id: 'pages.users.disabled',
                    defaultMessage: 'Disabled',
                  }),
                  value: 0,
                },
                {
                  label: intl.formatMessage({
                    id: 'pages.users.unverified',
                    defaultMessage: 'Unverified',
                  }),
                  value: -1,
                },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="is_admin"
            label={
              <FormattedMessage
                id="pages.users.isAdmin"
                defaultMessage="Admin"
              />
            }
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* Security Settings Modal */}
      <Modal
        title={
          <FormattedMessage
            id="pages.users.securitySettings"
            defaultMessage="Security Settings"
          />
        }
        open={securityModalVisible}
        onCancel={() => {
          setSecurityModalVisible(false);
          setEditingUser(null);
          securityForm.resetFields();
        }}
        onOk={() => securityForm.submit()}
      >
        <Form
          form={securityForm}
          onFinish={handleUpdateSecurity}
          layout="vertical"
        >
          <Form.Item
            name="tfa_enforce"
            label={
              <FormattedMessage
                id="pages.users.tfaEnforce"
                defaultMessage="Enforce Two-Factor Authentication"
              />
            }
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            name="email_verification"
            label={
              <FormattedMessage
                id="pages.users.emailVerification"
                defaultMessage="Require Email Verification"
              />
            }
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default UserList;
