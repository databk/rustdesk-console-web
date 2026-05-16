import {
  CrownOutlined,
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useIntl, useModel } from '@umijs/max';
import {
  App,
  Button,
  Divider,
  Dropdown,
  Form,
  Input,
  Modal,
  Space,
  Switch,
  Tag,
  Tooltip,
} from 'antd';
import React, { useRef, useState } from 'react';
import {
  createUser,
  deleteUser,
  disableUser,
  enableUser,
  getUserList,
  inviteUser,
} from '@/services/rustdesk-console/user';

const UserList: React.FC = () => {
  const intl = useIntl();
  const { message: msgApi, modal } = App.useApp();
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const actionRef = useRef<ActionType>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [createForm] = Form.useForm();
  const [inviteForm] = Form.useForm();
  const [searchParams, setSearchParams] = useState<{
    search?: string;
    status?: string;
  }>({});

  const handleCreate = async (values: API.CreateUserParams) => {
    try {
      await createUser({ ...values, is_admin: values.is_admin || false });
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
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.users.inviteFailed',
          defaultMessage: 'Failed to send invitation',
        }),
      );
    }
  };

  const handleEnable = async (guid: string) => {
    try {
      await enableUser(guid);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.users.enableSuccess',
          defaultMessage: 'User enabled',
        }),
      );
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.users.enableFailed',
          defaultMessage: 'Failed to enable user',
        }),
      );
    }
  };

  const handleDisable = async (guid: string) => {
    try {
      await disableUser(guid);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.users.disableSuccess',
          defaultMessage: 'User disabled',
        }),
      );
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.users.disableFailed',
          defaultMessage: 'Failed to disable user',
        }),
      );
    }
  };

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

  const handleSearch = (values: { search?: string; status?: string }) => {
    setSearchParams(values);
    actionRef.current?.reload();
  };

  const columns: ProColumns<API.UserItem>[] = [
    {
      title: '',
      dataIndex: 'index',
      valueType: 'indexBorder',
      width: 50,
    },
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
        <span>
          <FormattedMessage id="pages.users.status" defaultMessage="Status" />
          <Tooltip
            title={intl.formatMessage({
              id: 'pages.users.statusInfo',
              defaultMessage: 'User account status',
            })}
          >
            <InfoCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </span>
      ),
      dataIndex: 'status',
      width: 80,
      search: false,
      render: (_: unknown, record: API.UserItem) => {
        const isActive = record.status === 1;
        return isActive ? (
          <Tag icon={<PlusCircleOutlined />} color="green">
            <FormattedMessage id="pages.users.active" defaultMessage="Active" />
          </Tag>
        ) : (
          <Tag icon={<MinusCircleOutlined />} color="red">
            <FormattedMessage
              id="pages.users.disabled"
              defaultMessage="Disabled"
            />
          </Tag>
        );
      },
    },
    {
      title: (
        <span>
          <FormattedMessage id="pages.users.roles" defaultMessage="Roles" />
          <Tooltip
            title={intl.formatMessage({
              id: 'pages.users.rolesInfo',
              defaultMessage: 'User roles and permissions',
            })}
          >
            <InfoCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </span>
      ),
      dataIndex: 'is_admin',
      width: 100,
      search: false,
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
        <span>
          <FormattedMessage
            id="pages.users.strategy"
            defaultMessage="Strategy"
          />
          <Tooltip
            title={intl.formatMessage({
              id: 'pages.users.strategyInfo',
              defaultMessage: 'Connection strategy for user',
            })}
          >
            <InfoCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </span>
      ),
      dataIndex: 'strategy_name' as keyof API.UserItem,
      width: 100,
      search: false,
      render: () => '-',
    },
    {
      title: (
        <span>
          <FormattedMessage id="pages.users.group" defaultMessage="Group" />
          <Tooltip
            title={intl.formatMessage({
              id: 'pages.users.groupInfo',
              defaultMessage: 'User group assignment',
            })}
          >
            <InfoCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </span>
      ),
      dataIndex: 'group_name' as keyof API.UserItem,
      width: 120,
      search: false,
      render: () => '-',
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
      width: 180,
      fixed: 'right',
      render: (_: unknown, record: API.UserItem) => (
        <Space size={0} split={<Divider type="vertical" />}>
          <Button key="edit" type="link" size="small" icon={<EditOutlined />}>
            <FormattedMessage id="pages.common.edit" defaultMessage="Edit" />
          </Button>
          <Dropdown
            menu={{
              items: [
                ...(record.status === 1
                  ? [
                      {
                        key: 'disable',
                        label: intl.formatMessage({
                          id: 'pages.users.disable',
                          defaultMessage: 'Disable',
                        }),
                        onClick: () => handleDisable(record.guid),
                      },
                    ]
                  : [
                      {
                        key: 'enable',
                        label: intl.formatMessage({
                          id: 'pages.users.enable',
                          defaultMessage: 'Enable',
                        }),
                        onClick: () => handleEnable(record.guid),
                      },
                    ]),
                {
                  key: 'divider-1',
                  type: 'divider',
                },
                {
                  key: 'delete',
                  label: (
                    <FormattedMessage
                      id="pages.common.delete"
                      defaultMessage="Delete"
                    />
                  ),
                  danger: true,
                  onClick: () => {
                    modal.confirm({
                      title: intl.formatMessage({
                        id: 'pages.users.deleteConfirm',
                        defaultMessage: 'Are you sure to delete this user?',
                      }),
                      okText: intl.formatMessage({
                        id: 'pages.common.confirm',
                        defaultMessage: 'Yes',
                      }),
                      cancelText: intl.formatMessage({
                        id: 'pages.common.cancel',
                        defaultMessage: 'No',
                      }),
                      onOk: () => handleDelete(record.guid),
                    });
                  },
                },
              ],
            }}
          >
            <Button type="link" size="small">
              <FormattedMessage id="pages.common.more" defaultMessage="More" />
            </Button>
          </Dropdown>
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
        request={async (params) => {
          const result = await getUserList({
            current: params.current || 1,
            pageSize: params.pageSize || 20,
            search: searchParams.search,
            status: searchParams.status,
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
          defaultCollapsed: false,
          optionRender: (searchConfig, formProps, dom) => [...dom.reverse()],
        }}
        form={{
          onFinish: handleSearch,
          onReset: () => {
            setSearchParams({});
          },
        }}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        scroll={{ x: 1200 }}
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
            name="note"
            label={
              <FormattedMessage id="pages.users.note" defaultMessage="Note" />
            }
          >
            <Input.TextArea />
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
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default UserList;
