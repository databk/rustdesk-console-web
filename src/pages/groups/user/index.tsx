import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ModalForm, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import {
  Button,
  Form,
  Input,
  message as messageApi,
  Popconfirm,
  Space,
} from 'antd';
import React, { useRef, useState } from 'react';
import {
  createUserGroup,
  deleteUserGroup,
  getUserGroupList,
  updateUserGroup,
} from '@/services/rustdesk-console/userGroup';

const UserGroupList: React.FC = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<API.UserGroupItem | null>(null);
  const [form] = Form.useForm();

  const handleCreate = async (values: API.CreateUserGroupParams) => {
    try {
      await createUserGroup(values);
      messageApi.success(intl.formatMessage({ id: 'pages.userGroups.createSuccess', defaultMessage: 'User group created' }));
      setCreateModalVisible(false);
      form.resetFields();
      actionRef.current?.reload();
    } catch (error) {
      messageApi.error(intl.formatMessage({ id: 'pages.userGroups.createFailed', defaultMessage: 'Failed to create user group' }));
    }
  };

  const handleUpdate = async (values: API.UpdateUserGroupParams) => {
    if (!currentGroup) return;
    try {
      await updateUserGroup(currentGroup.guid, values);
      messageApi.success(intl.formatMessage({ id: 'pages.userGroups.updateSuccess', defaultMessage: 'User group updated' }));
      setEditModalVisible(false);
      setCurrentGroup(null);
      form.resetFields();
      actionRef.current?.reload();
    } catch (error) {
      messageApi.error(intl.formatMessage({ id: 'pages.userGroups.updateFailed', defaultMessage: 'Failed to update user group' }));
    }
  };

  const handleDelete = async (guid: string) => {
    try {
      await deleteUserGroup(guid);
      messageApi.success(intl.formatMessage({ id: 'pages.userGroups.deleteSuccess', defaultMessage: 'User group deleted' }));
      actionRef.current?.reload();
    } catch (error) {
      messageApi.error(intl.formatMessage({ id: 'pages.userGroups.deleteFailed', defaultMessage: 'Failed to delete user group' }));
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
      title: <FormattedMessage id="pages.userGroups.name" defaultValue="Group Name" />,
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
      title: <FormattedMessage id="pages.userGroups.note" defaultValue="Note" />,
      dataIndex: 'note',
      width: 250,
      ellipsis: true,
      render: (_, record) => record.note || '-',
    },
    {
      title: <FormattedMessage id="pages.userGroups.userCount" defaultValue="User Count" />,
      dataIndex: 'user_count',
      width: 120,
      search: false,
    },
    {
      title: <FormattedMessage id="pages.common.action" defaultValue="Action" />,
      valueType: 'option',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => {
            setCurrentGroup(record);
            form.setFieldsValue(record);
            setEditModalVisible(true);
          }}>
            <FormattedMessage id="pages.common.edit" defaultValue="Edit" />
          </Button>
          <Popconfirm
            title={intl.formatMessage({ id: 'pages.userGroups.deleteConfirm', defaultMessage: 'Delete this user group?' })}
            onConfirm={() => handleDelete(record.guid)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              <FormattedMessage id="pages.common.delete" defaultValue="Delete" />
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <ProTable<API.UserGroupItem>
        headerTitle={<FormattedMessage id="pages.userGroups.list" defaultValue="User Group List" />}
        actionRef={actionRef}
        rowKey="guid"
        request={async (params) => {
          const result = await getUserGroupList({
            current: params.current,
            pageSize: params.pageSize,
            search: params.name,
          });
          return { data: result.data || [], total: result.total || 0, success: true };
        }}
        columns={columns}
        pagination={{ defaultPageSize: 20, showSizeChanger: true, showQuickJumper: true }}
        scroll={{ x: 800 }}
        toolBarRender={() => [
          <Button key="create" type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
            <FormattedMessage id="pages.userGroups.create" defaultValue="Create User Group" />
          </Button>,
        ]}
        options={{ density: true, setting: { listsHeight: 400 }, fullScreen: false, reload: true }}
      />

      <ModalForm
        title={<FormattedMessage id="pages.userGroups.create" defaultValue="Create User Group" />}
        open={createModalVisible}
        onOpenChange={setCreateModalVisible}
        onFinish={handleCreate}
        form={form}
        layout="vertical"
        modalProps={{ destroyOnClose: true }}
      >
        <Form.Item name="name" label={<FormattedMessage id="pages.userGroups.name" defaultValue="Name" />} rules={[{ required: true }]}>
          <Input placeholder="Enter group name" />
        </Form.Item>
        <Form.Item name="note" label={<FormattedMessage id="pages.userGroups.note" defaultValue="Note" />}>
          <Input.TextArea rows={3} placeholder="Enter description" />
        </Form.Item>
      </ModalForm>

      <ModalForm
        title={<FormattedMessage id="pages.userGroups.edit" defaultValue="Edit User Group" />}
        open={editModalVisible}
        onOpenChange={setEditModalVisible}
        onFinish={handleUpdate}
        form={form}
        layout="vertical"
        modalProps={{ destroyOnClose: true }}
      >
        <Form.Item name="name" label={<FormattedMessage id="pages.userGroups.name" defaultValue="Name" />} rules={[{ required: true }]}>
          <Input placeholder="Enter group name" />
        </Form.Item>
        <Form.Item name="note" label={<FormattedMessage id="pages.userGroups.note" defaultValue="Note" />}>
          <Input.TextArea rows={3} placeholder="Enter description" />
        </Form.Item>
      </ModalForm>
    </>
  );
};

export default UserGroupList;

function FormattedMessage(props: { id: string; defaultMessage?: string }): React.JSX.Element {
  const intl = useIntl();
  return <>{intl.formatMessage(props)}</>;
}
