import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ModalForm, PageContainer, ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { App, Button, Divider, Form, Input, Popconfirm, Space } from 'antd';
import React, { useRef, useState } from 'react';
import {
  createUserGroup,
  deleteUserGroup,
  getUserGroupList,
  updateUserGroup,
} from '@/services/rustdesk-console/userGroup';

const UserGroupList: React.FC = () => {
  const intl = useIntl();
  const { message: msgApi } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<API.UserGroupItem | null>(
    null,
  );
  const [form] = Form.useForm();

  const handleCreate = async (values: API.CreateUserGroupParams) => {
    try {
      await createUserGroup(values);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.userGroups.createSuccess',
          defaultMessage: 'User group created',
        }),
      );
      setCreateModalVisible(false);
      form.resetFields();
      actionRef.current?.reload();
    } catch (error) {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.userGroups.createFailed',
          defaultMessage: 'Failed to create user group',
        }),
      );
    }
  };

  const handleUpdate = async (values: API.UpdateUserGroupParams) => {
    if (!currentGroup) return;
    try {
      await updateUserGroup(currentGroup.guid, values);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.userGroups.updateSuccess',
          defaultMessage: 'User group updated',
        }),
      );
      setEditModalVisible(false);
      setCurrentGroup(null);
      form.resetFields();
      actionRef.current?.reload();
    } catch (error) {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.userGroups.updateFailed',
          defaultMessage: 'Failed to update user group',
        }),
      );
    }
  };

  const handleDelete = async (guid: string) => {
    try {
      await deleteUserGroup(guid);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.userGroups.deleteSuccess',
          defaultMessage: 'User group deleted',
        }),
      );
      actionRef.current?.reload();
    } catch (error) {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.userGroups.deleteFailed',
          defaultMessage: 'Failed to delete user group',
        }),
      );
    }
  };

  const columns: ProColumns<API.UserGroupItem>[] = [
    {
      title: '',
      dataIndex: 'index',
      valueType: 'indexBorder',
      width: 50,
    },
    {
      title: (
        <FormattedMessage
          id="pages.userGroups.name"
          defaultMessage="Group Name"
        />
      ),
      dataIndex: 'name',
      width: 200,
      render: (_, record) => (
        <Space>
          <TeamOutlined style={{ color: '#13c2c2' }} />
          <span>{record.name}</span>
        </Space>
      ),
    },
    {
      title: (
        <FormattedMessage id="pages.userGroups.note" defaultMessage="Note" />
      ),
      dataIndex: 'note',
      width: 250,
      ellipsis: true,
      render: (_, record) => record.note || '-',
    },
    {
      title: (
        <FormattedMessage
          id="pages.userGroups.userCount"
          defaultMessage="User Count"
        />
      ),
      dataIndex: 'user_count',
      width: 120,
      search: false,
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
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setCurrentGroup(record);
              form.setFieldsValue(record);
              setEditModalVisible(true);
            }}
          >
            <FormattedMessage id="pages.common.edit" defaultMessage="Edit" />
          </Button>
          <Popconfirm
            title={intl.formatMessage({
              id: 'pages.userGroups.deleteConfirm',
              defaultMessage: 'Delete this user group?',
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
      <ProTable<API.UserGroupItem>
        headerTitle={
          <FormattedMessage
            id="pages.userGroups.list"
            defaultMessage="User Group List"
          />
        }
        actionRef={actionRef}
        rowKey="guid"
        request={async (params) => {
          const result = await getUserGroupList({
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
            onClick={() => setCreateModalVisible(true)}
          >
            <FormattedMessage
              id="pages.userGroups.create"
              defaultMessage="Create User Group"
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

      <ModalForm
        title={
          <FormattedMessage
            id="pages.userGroups.create"
            defaultMessage="Create User Group"
          />
        }
        open={createModalVisible}
        onOpenChange={setCreateModalVisible}
        onFinish={handleCreate}
        form={form}
        layout="vertical"
        modalProps={{ destroyOnClose: true }}
      >
        <Form.Item
          name="name"
          label={
            <FormattedMessage
              id="pages.userGroups.name"
              defaultMessage="Name"
            />
          }
          rules={[{ required: true }]}
        >
          <Input
            placeholder={intl.formatMessage({
              id: 'pages.userGroups.enterName',
              defaultMessage: 'Enter group name',
            })}
          />
        </Form.Item>
        <Form.Item
          name="note"
          label={
            <FormattedMessage
              id="pages.userGroups.note"
              defaultMessage="Note"
            />
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
      </ModalForm>

      <ModalForm
        title={
          <FormattedMessage
            id="pages.userGroups.edit"
            defaultMessage="Edit User Group"
          />
        }
        open={editModalVisible}
        onOpenChange={setEditModalVisible}
        onFinish={handleUpdate}
        form={form}
        layout="vertical"
        modalProps={{ destroyOnClose: true }}
      >
        <Form.Item
          name="name"
          label={
            <FormattedMessage
              id="pages.userGroups.name"
              defaultMessage="Name"
            />
          }
          rules={[{ required: true }]}
        >
          <Input
            placeholder={intl.formatMessage({
              id: 'pages.userGroups.enterName',
              defaultMessage: 'Enter group name',
            })}
          />
        </Form.Item>
        <Form.Item
          name="note"
          label={
            <FormattedMessage
              id="pages.userGroups.note"
              defaultMessage="Note"
            />
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
      </ModalForm>
    </PageContainer>
  );
};

export default UserGroupList;
