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
  addSharedAddressBook,
  deleteSharedAddressBooks,
  getSharedAddressBooks,
  updateSharedAddressBook,
} from '@/services/rustdesk-console/addressBook';

const SharedAddressBook: React.FC = () => {
  const intl = useIntl();
  const { message: msgApi } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] =
    useState<API.SharedAddressBook | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const handleCreate = async (values: API.AddSharedAddressBookParams) => {
    try {
      await addSharedAddressBook(values);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.addressBook.createSuccess',
          defaultMessage: 'Address book created',
        }),
      );
      setCreateModalVisible(false);
      createForm.resetFields();
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.addressBook.createFailed',
          defaultMessage: 'Failed to create address book',
        }),
      );
    }
  };

  const handleEdit = async (values: API.UpdateSharedAddressBookParams) => {
    try {
      await updateSharedAddressBook(values);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.addressBook.updateSuccess',
          defaultMessage: 'Address book updated',
        }),
      );
      setEditModalVisible(false);
      setEditingRecord(null);
      editForm.resetFields();
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.addressBook.updateFailed',
          defaultMessage: 'Failed to update address book',
        }),
      );
    }
  };

  const handleDelete = async (guids: string[]) => {
    try {
      await deleteSharedAddressBooks(guids);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.addressBook.deleteSuccess',
          defaultMessage: 'Address book(s) deleted',
        }),
      );
      setSelectedRowKeys([]);
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.addressBook.deleteFailed',
          defaultMessage: 'Failed to delete address book(s)',
        }),
      );
    }
  };

  const columns: ProColumns<API.SharedAddressBook>[] = [
    {
      title: (
        <FormattedMessage id="pages.addressBook.name" defaultMessage="Name" />
      ),
      dataIndex: 'name',
      render: (_, record: API.SharedAddressBook) => (
        <a
          onClick={() => {
            history.push(`/address-book/shared/${record.guid}`, {
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
        <FormattedMessage id="pages.addressBook.note" defaultMessage="Note" />
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
                id="pages.addressBook.deleteConfirm"
                defaultMessage="Are you sure to delete this address book?"
              />
            }
            onConfirm={() => handleDelete([record.guid])}
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
      <ProTable<API.SharedAddressBook>
        headerTitle={
          <FormattedMessage
            id="pages.addressBook.shared"
            defaultMessage="Shared Address Books"
          />
        }
        actionRef={actionRef}
        rowKey="guid"
        request={async (params) => {
          const result = await getSharedAddressBooks({
            pageSize: params.pageSize || 20,
            current: params.current || 1,
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
              id="pages.addressBook.create"
              defaultMessage="Create Address Book"
            />
          </Button>,
          selectedRowKeys.length > 0 && (
            <Popconfirm
              key="batchDelete"
              title={
                <FormattedMessage
                  id="pages.addressBook.batchDeleteConfirm"
                  defaultMessage="Are you sure to delete selected address books?"
                />
              }
              onConfirm={() => handleDelete(selectedRowKeys as string[])}
              okText={intl.formatMessage({
                id: 'pages.common.confirm',
                defaultMessage: 'Yes',
              })}
              cancelText={intl.formatMessage({
                id: 'pages.common.cancel',
                defaultMessage: 'No',
              })}
            >
              <Button danger>
                <FormattedMessage
                  id="pages.common.batchDelete"
                  defaultMessage="Batch Delete"
                />
              </Button>
            </Popconfirm>
          ),
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
            id="pages.addressBook.create"
            defaultMessage="Create Address Book"
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
                id="pages.addressBook.name"
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
                id="pages.addressBook.note"
                defaultMessage="Note"
              />
            }
          >
            <Input.TextArea />
          </Form.Item>
          <Form.Item
            name="password"
            label={
              <FormattedMessage
                id="pages.users.password"
                defaultMessage="Password"
              />
            }
          >
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <FormattedMessage
            id="pages.addressBook.edit"
            defaultMessage="Edit Address Book"
          />
        }
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingRecord(null);
        }}
        onOk={() => editForm.submit()}
      >
        <Form form={editForm} onFinish={handleEdit}>
          <Form.Item name="guid" hidden>
            <Input />
          </Form.Item>
          <Form.Item
            name="name"
            label={
              <FormattedMessage
                id="pages.addressBook.name"
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
                id="pages.addressBook.note"
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

export default SharedAddressBook;
