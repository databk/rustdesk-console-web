import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { FormattedMessage, history, useIntl } from '@umijs/max';
import {
  App,
  Button,
  Divider,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
} from 'antd';
import React, { useRef, useState } from 'react';
import {
  createDeviceGroup,
  deleteDeviceGroup,
  getDeviceGroupList,
  updateDeviceGroup,
} from '@/services/rustdesk-console/deviceGroup';

const DeviceGroupList: React.FC = () => {
  const intl = useIntl();
  const { message: msgApi } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] =
    useState<API.DeviceGroupItem | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const handleCreate = async (values: API.CreateDeviceGroupParams) => {
    try {
      await createDeviceGroup(values);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.deviceGroups.createSuccess',
          defaultMessage: 'Device group created',
        }),
      );
      setCreateModalVisible(false);
      createForm.resetFields();
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.deviceGroups.createFailed',
          defaultMessage: 'Failed to create device group',
        }),
      );
    }
  };

  const handleEdit = async (
    guid: string,
    values: API.UpdateDeviceGroupParams,
  ) => {
    try {
      await updateDeviceGroup(guid, values);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.deviceGroups.updateSuccess',
          defaultMessage: 'Device group updated',
        }),
      );
      setEditModalVisible(false);
      setEditingRecord(null);
      editForm.resetFields();
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.deviceGroups.updateFailed',
          defaultMessage: 'Failed to update device group',
        }),
      );
    }
  };

  const handleDelete = async (guid: string) => {
    try {
      await deleteDeviceGroup(guid);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.deviceGroups.deleteSuccess',
          defaultMessage: 'Device group deleted',
        }),
      );
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.deviceGroups.deleteFailed',
          defaultMessage: 'Failed to delete device group',
        }),
      );
    }
  };

  const columns: ProColumns<API.DeviceGroupItem>[] = [
    {
      title: (
        <FormattedMessage id="pages.deviceGroups.name" defaultMessage="Name" />
      ),
      dataIndex: 'name',
      render: (_, record: API.DeviceGroupItem) => (
        <a
          onClick={() => {
            history.push(`/groups/device/${record.guid}`, {
              name: record.name,
            });
          }}
          style={{ cursor: 'pointer' }}
        >
          {record.name}
        </a>
      ),
    },
    {
      title: (
        <FormattedMessage id="pages.deviceGroups.note" defaultMessage="Note" />
      ),
      dataIndex: 'note',
      ellipsis: true,
    },
    {
      title: (
        <FormattedMessage id="pages.common.action" defaultMessage="Action" />
      ),
      valueType: 'option',
      width: 180,
      render: (_, record) => (
        <Space size={0} split={<Divider type="vertical" />}>
          <Button
            key="edit"
            type="link"
            size="small"
            onClick={() => {
              setEditingRecord(record);
              editForm.setFieldsValue(record);
              setEditModalVisible(true);
            }}
          >
            <FormattedMessage id="pages.common.edit" defaultMessage="Edit" />
          </Button>
          <Popconfirm
            key="delete"
            title={
              <FormattedMessage
                id="pages.deviceGroups.deleteConfirm"
                defaultMessage="Are you sure to delete this device group?"
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
            <Button type="link" size="small" danger>
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
      <ProTable<API.DeviceGroupItem>
        headerTitle={
          <FormattedMessage
            id="pages.deviceGroups.list"
            defaultMessage="Device Groups"
          />
        }
        actionRef={actionRef}
        rowKey="guid"
        request={async (params) => {
          const result = await getDeviceGroupList({
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
        search={false}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            onClick={() => setCreateModalVisible(true)}
          >
            <FormattedMessage
              id="pages.deviceGroups.create"
              defaultMessage="Create Device Group"
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
        scroll={{ x: 800 }}
      />

      <Modal
        title={
          <FormattedMessage
            id="pages.deviceGroups.create"
            defaultMessage="Create Device Group"
          />
        }
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={() => createForm.submit()}
      >
        <Form form={createForm} onFinish={handleCreate}>
          <Form.Item
            name="name"
            label={
              <FormattedMessage
                id="pages.deviceGroups.name"
                defaultMessage="Name"
              />
            }
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'pages.common.pleaseEnterName',
                  defaultMessage: 'Please enter name',
                }),
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="note"
            label={
              <FormattedMessage
                id="pages.deviceGroups.note"
                defaultMessage="Note"
              />
            }
          >
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <FormattedMessage
            id="pages.deviceGroups.edit"
            defaultMessage="Edit Device Group"
          />
        }
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingRecord(null);
        }}
        onOk={() => editForm.submit()}
      >
        <Form
          form={editForm}
          onFinish={(values) => {
            if (editingRecord) {
              handleEdit(editingRecord.guid, values);
            }
          }}
        >
          <Form.Item
            name="name"
            label={
              <FormattedMessage
                id="pages.deviceGroups.name"
                defaultMessage="Name"
              />
            }
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'pages.common.pleaseEnterName',
                  defaultMessage: 'Please enter name',
                }),
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="note"
            label={
              <FormattedMessage
                id="pages.deviceGroups.note"
                defaultMessage="Note"
              />
            }
          >
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default DeviceGroupList;
