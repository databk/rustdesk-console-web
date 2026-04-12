import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { App, Button, Form, Input, Modal, Popconfirm, Space, Switch, Tag } from 'antd';
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
  const { message: msgApi } = App.useApp();
  const actionRef = useRef<ActionType>();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [createForm] = Form.useForm();
  const [inviteForm] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const handleCreate = async (values: any) => {
    try {
      await createUser({ ...values, is_admin: values.is_admin || false });
      msgApi.success(
        intl.formatMessage({ id: 'pages.users.createSuccess', defaultMessage: 'User created' }),
      );
      setCreateModalVisible(false);
      createForm.resetFields();
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({ id: 'pages.users.createFailed', defaultMessage: 'Failed to create user' }),
      );
    }
  };

  const handleInvite = async (values: any) => {
    try {
      await inviteUser(values);
      msgApi.success(
        intl.formatMessage({ id: 'pages.users.inviteSuccess', defaultMessage: 'Invitation sent' }),
      );
      setInviteModalVisible(false);
      inviteForm.resetFields();
    } catch {
      msgApi.error(
        intl.formatMessage({ id: 'pages.users.inviteFailed', defaultMessage: 'Failed to send invitation' }),
      );
    }
  };

  const handleEnable = async (guid: string) => {
    try {
      await enableUser(guid);
      msgApi.success(
        intl.formatMessage({ id: 'pages.users.enableSuccess', defaultMessage: 'User enabled' }),
      );
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({ id: 'pages.users.enableFailed', defaultMessage: 'Failed to enable user' }),
      );
    }
  };

  const handleDisable = async (guid: string) => {
    try {
      await disableUser(guid);
      msgApi.success(
        intl.formatMessage({ id: 'pages.users.disableSuccess', defaultMessage: 'User disabled' }),
      );
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({ id: 'pages.users.disableFailed', defaultMessage: 'Failed to disable user' }),
      );
    }
  };

  const handleDelete = async (guid: string) => {
    try {
      await deleteUser(guid);
      msgApi.success(
        intl.formatMessage({ id: 'pages.users.deleteSuccess', defaultMessage: 'User deleted' }),
      );
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({ id: 'pages.users.deleteFailed', defaultMessage: 'Failed to delete user' }),
      );
    }
  };

  const columns: ProColumns<API.UserItem>[] = [
    {
      title: "",
      dataIndex: "index",
      valueType: "indexBorder",
      width: 50,
    },
    {
      title: <FormattedMessage id="pages.users.name" defaultMessage="Username" />,
      dataIndex: 'name',
      width: 150,
      ellipsis: true,
    },
    {
      title: <FormattedMessage id="pages.users.email" defaultMessage="Email" />,
      dataIndex: 'email',
      width: 200,
      ellipsis: true,
      render: (_, record) => record.email || '-',
    },
    {
      title: <FormattedMessage id="pages.users.status" defaultMessage="Status" />,
      dataIndex: 'status',
      width: 80,
      valueEnum: {
        0: { text: intl.formatMessage({ id: 'pages.users.disabled', defaultMessage: 'Disabled' }), status: 'Error' },
        1: { text: intl.formatMessage({ id: 'pages.users.active', defaultMessage: 'Active' }), status: 'Success' },
      },
      render: (_, record) => {
        const isActive = record.status === 1;
        return <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'Active' : 'Disabled'}</Tag>;
      },
    },
    {
      title: <FormattedMessage id="pages.users.role" defaultMessage="Role" />,
      dataIndex: 'is_admin',
      width: 100,
      render: (_, record) =>
        record.is_admin ? (
          <Tag color="blue">Admin</Tag>
        ) : (
          <Tag>User</Tag>
        ),
    },
    {
      title: <FormattedMessage id="pages.users.group" defaultMessage="Group" />,
      dataIndex: 'group_name',
      width: 120,
      ellipsis: true,
      render: (_, record) => (record as any).group_name || '-',
    },
    {
      title: <FormattedMessage id="pages.users.note" defaultMessage="Note" />,
      dataIndex: 'note',
      width: 150,
      ellipsis: true,
      search: false,
      render: (_, record) => record.note || '-',
    },
    {
      title: <FormattedMessage id="pages.common.action" defaultMessage="Action" />,
      valueType: 'option',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {record.status === 1 ? (
            <Button key="disable" type="link" size="small" onClick={() => handleDisable(record.guid)}>
              <FormattedMessage id="pages.users.disable" defaultMessage="Disable" />
            </Button>
          ) : (
            <Button key="enable" type="link" size="small" onClick={() => handleEnable(record.guid)}>
              <FormattedMessage id="pages.users.enable" defaultMessage="Enable" />
            </Button>
          )}
          <Popconfirm
            key="delete"
            title={
              <FormattedMessage
                id="pages.users.deleteConfirm"
                defaultMessage="Are you sure to delete this user?"
              />
            }
            onConfirm={() => handleDelete(record.guid)}
          >
            <Button type="link" size="small" danger>
              <FormattedMessage id="pages.common.delete" defaultMessage="Delete" />
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.UserItem>
        headerTitle={<FormattedMessage id="pages.users.list" defaultMessage="User List" />}
        actionRef={actionRef}
        rowKey="guid"
        request={async (params) => {
          const result = await getUserList({
            current: params.current || 1,
            pageSize: params.pageSize || 20,
          });
          return {
            data: result.data || [],
            total: result.total || 0,
            success: true,
          };
        }}
        columns={columns}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        search={
          <Form form={searchForm} layout="inline">
            <Form.Item name="name">
              <Input placeholder={intl.formatMessage({ id: 'pages.users.name', defaultMessage: 'Username' })} style={{ width: 150 }} />
            </Form.Item>
            <Form.Item name="email">
              <Input placeholder={intl.formatMessage({ id: 'pages.users.email', defaultMessage: 'Email' })} style={{ width: 200 }} />
            </Form.Item>
            <Space>
              <Button onClick={() => searchForm.resetFields()}>
                <FormattedMessage id="pages.common.reset" defaultMessage="Reset" />
              </Button>
              <Button type="primary" onClick={() => actionRef.current?.reload()}>
                <FormattedMessage id="pages.common.search" defaultMessage="Search" />
              </Button>
            </Space>
          </Form>
        }
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        scroll={{ x: 1200 }}
        toolBarRender={() => [
          <Button key="create" type="primary" onClick={() => setCreateModalVisible(true)}>
            <FormattedMessage id="pages.users.create" defaultMessage="Create" />
          </Button>,
          <Button key="invite" onClick={() => setInviteModalVisible(true)}>
            <FormattedMessage id="pages.users.invite" defaultMessage="Invite" />
          </Button>,
        ]}
      />

      <Modal
        title={<FormattedMessage id="pages.users.create" defaultMessage="Create User" />}
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={() => createForm.submit()}
      >
        <Form form={createForm} onFinish={handleCreate} layout="vertical">
          <Form.Item
            name="name"
            label={<FormattedMessage id="pages.users.name" defaultMessage="Username" />}
            rules={[{ required: true, message: 'Please enter username' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label={<FormattedMessage id="pages.users.email" defaultMessage="Email" />}
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter valid email' },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="password"
            label={<FormattedMessage id="pages.users.password" defaultMessage="Password" />}
            rules={[{ required: true, message: 'Please enter password' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item name="note" label={<FormattedMessage id="pages.users.note" defaultMessage="Note" />}>
            <Input.TextArea />
          </Form.Item>
          <Form.Item name="is_admin" label={<FormattedMessage id="pages.users.isAdmin" defaultMessage="Admin" />} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={<FormattedMessage id="pages.users.invite" defaultMessage="Invite User" />}
        open={inviteModalVisible}
        onCancel={() => setInviteModalVisible(false)}
        onOk={() => inviteForm.submit()}
      >
        <Form form={inviteForm} onFinish={handleInvite} layout="vertical">
          <Form.Item
            name="email"
            label={<FormattedMessage id="pages.users.email" defaultMessage="Email" />}
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter valid email' },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="note" label={<FormattedMessage id="pages.users.note" defaultMessage="Note" />}>
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default UserList;
