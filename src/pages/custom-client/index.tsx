import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  FormOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ModalForm, PageContainer, ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { App, Button, Divider, Form, Input, Popconfirm, Space } from 'antd';
import React, { useRef, useState } from 'react';
import {
  createCustomClient,
  deleteCustomClient,
  downloadCustomClient,
  getCustomClientList,
  updateCustomClient,
} from '@/services/rustdesk-console/customClient';

const CustomClientList: React.FC = () => {
  const intl = useIntl();
  const { message: msgApi } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentClient, setCurrentClient] =
    useState<API.CustomClientItem | null>(null);
  const [form] = Form.useForm();

  const handleCreate = async (values: API.CreateCustomClientParams) => {
    try {
      await createCustomClient(values);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.customClients.createSuccess',
          defaultMessage: 'Custom client created',
        }),
      );
      setCreateModalVisible(false);
      form.resetFields();
      actionRef.current?.reload();
    } catch (error) {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.customClients.createFailed',
          defaultMessage: 'Failed to create custom client',
        }),
      );
    }
  };

  const handleUpdate = async (values: API.UpdateCustomClientParams) => {
    if (!currentClient) return;
    try {
      await updateCustomClient(currentClient.guid, values);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.customClients.updateSuccess',
          defaultMessage: 'Custom client updated',
        }),
      );
      setEditModalVisible(false);
      setCurrentClient(null);
      form.resetFields();
      actionRef.current?.reload();
    } catch (error) {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.customClients.updateFailed',
          defaultMessage: 'Failed to update custom client',
        }),
      );
    }
  };

  const handleDelete = async (guid: string) => {
    try {
      await deleteCustomClient(guid);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.customClients.deleteSuccess',
          defaultMessage: 'Custom client deleted',
        }),
      );
      actionRef.current?.reload();
    } catch (error) {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.customClients.deleteFailed',
          defaultMessage: 'Failed to delete custom client',
        }),
      );
    }
  };

  const handleDownload = async (guid: string, name: string) => {
    try {
      const blob = await downloadCustomClient(guid);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${name}.exe`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.customClients.downloadFailed',
          defaultMessage: 'Failed to download client',
        }),
      );
    }
  };

  const columns: ProColumns<API.CustomClientItem>[] = [
    {
      title: '',
      dataIndex: 'index',
      valueType: 'indexBorder',
      width: 50,
    },
    {
      title: (
        <FormattedMessage
          id="pages.customClients.name"
          defaultMessage="Client Name"
        />
      ),
      dataIndex: 'name',
      width: 200,
      render: (_, record) => (
        <Space>
          <FormOutlined style={{ color: '#fa8c16' }} />
          <span>{record.name}</span>
        </Space>
      ),
    },
    {
      title: (
        <FormattedMessage
          id="pages.customClients.createdAt"
          defaultMessage="Created At"
        />
      ),
      dataIndex: 'created_at',
      width: 180,
      search: false,
      render: (_, record) => record.created_at || '-',
    },
    {
      title: (
        <FormattedMessage id="pages.common.action" defaultMessage="Action" />
      ),
      valueType: 'option',
      width: 250,
      fixed: 'right',
      render: (_, record) => (
        <Space size={0} split={<Divider type="vertical" />}>
          <Button
            type="link"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record.guid, record.name)}
          >
            <FormattedMessage
              id="pages.common.download"
              defaultMessage="Download"
            />
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setCurrentClient(record);
              form.setFieldsValue(record);
              setEditModalVisible(true);
            }}
          >
            <FormattedMessage id="pages.common.edit" defaultMessage="Edit" />
          </Button>
          <Popconfirm
            title={intl.formatMessage({
              id: 'pages.customClients.deleteConfirm',
              defaultMessage: 'Delete this custom client?',
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
      <ProTable<API.CustomClientItem>
        headerTitle={
          <FormattedMessage
            id="pages.customClients.list"
            defaultMessage="Custom Client List"
          />
        }
        actionRef={actionRef}
        rowKey="guid"
        request={async (params) => {
          const result = await getCustomClientList({
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
              id="pages.customClients.create"
              defaultMessage="Create Custom Client"
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
            id="pages.customClients.create"
            defaultMessage="Create Custom Client"
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
              id="pages.customClients.name"
              defaultMessage="Name"
            />
          }
          rules={[{ required: true }]}
        >
          <Input
            placeholder={intl.formatMessage({
              id: 'pages.customClients.enterName',
              defaultMessage: 'Enter client name',
            })}
          />
        </Form.Item>
      </ModalForm>

      <ModalForm
        title={
          <FormattedMessage
            id="pages.customClients.edit"
            defaultMessage="Edit Custom Client"
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
              id="pages.customClients.name"
              defaultMessage="Name"
            />
          }
          rules={[{ required: true }]}
        >
          <Input
            placeholder={intl.formatMessage({
              id: 'pages.customClients.enterName',
              defaultMessage: 'Enter client name',
            })}
          />
        </Form.Item>
      </ModalForm>
    </PageContainer>
  );
};

export default CustomClientList;
