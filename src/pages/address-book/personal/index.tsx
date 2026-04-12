import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { App, Button, Form, Input, Modal, Popconfirm, Space, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import { getPeers, addPeer, updatePeer, deletePeer, getTags } from '@/services/rustdesk-console/addressBook';

const PersonalAddressBook: React.FC = () => {
  const intl = useIntl();
  const { message: msgApi } = App.useApp();
  const actionRef = useRef<ActionType>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentPeer, setCurrentPeer] = useState<API.PeerItem | null>(null);
  const [form] = Form.useForm();
  const [tags, setTags] = useState<API.TagItem[]>([]);
  const [searchParams, setSearchParams] = useState<{
    search?: string;
  }>({});

  const loadTags = async () => {
    try {
      const result = await getTags('personal');
      setTags(result || []);
    } catch {
      console.error('Failed to load tags');
    }
  };

  const handleEdit = (record: API.PeerItem) => {
    setCurrentPeer(record);
    form.setFieldsValue({
      id: record.id,
      username: record.username,
      hostname: record.hostname,
      alias: record.alias,
      platform: record.platform,
      tags: record.tags,
    });
    setEditModalVisible(true);
  };

  const handleSave = async (values: API.UpdatePeerParams) => {
    try {
      if (currentPeer) {
        await updatePeer('personal', { ...values, id: currentPeer.id });
        msgApi.success(
          intl.formatMessage({ id: 'pages.addressBook.updateSuccess', defaultMessage: 'Peer updated' }),
        );
      } else {
        await addPeer('personal', values as API.AddPeerParams);
        msgApi.success(
          intl.formatMessage({ id: 'pages.addressBook.addSuccess', defaultMessage: 'Peer added' }),
        );
      }
      setEditModalVisible(false);
      form.resetFields();
      setCurrentPeer(null);
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({ id: 'pages.addressBook.saveFailed', defaultMessage: 'Failed to save peer' }),
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePeer('personal', { id });
      msgApi.success(
        intl.formatMessage({ id: 'pages.addressBook.deleteSuccess', defaultMessage: 'Peer deleted' }),
      );
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({ id: 'pages.addressBook.deleteFailed', defaultMessage: 'Failed to delete peer' }),
      );
    }
  };

  const handleSearch = (values: { search?: string }) => {
    setSearchParams(values);
    actionRef.current?.reload();
  };

  const columns: ProColumns<API.PeerItem>[] = [
    {
      title: "",
      dataIndex: "index",
      valueType: "indexBorder",
      width: 50,
    },
    {
      title: <FormattedMessage id="pages.addressBook.id" defaultMessage="ID" />,
      dataIndex: 'id',
      width: 150,
      ellipsis: true,
      render: (_: unknown, record: API.PeerItem) => (
        <span>
          {record.id}
          {record.alias && <span style={{ color: '#999' }}> ({record.alias})</span>}
        </span>
      ),
    },
    {
      title: <FormattedMessage id="pages.addressBook.username" defaultMessage="Username" />,
      dataIndex: 'username',
      width: 120,
      ellipsis: true,
      render: (_: unknown, record: API.PeerItem) => record.username || '-',
    },
    {
      title: <FormattedMessage id="pages.addressBook.hostname" defaultMessage="Hostname" />,
      dataIndex: 'hostname',
      width: 150,
      ellipsis: true,
      render: (_: unknown, record: API.PeerItem) => record.hostname || '-',
    },
    {
      title: <FormattedMessage id="pages.addressBook.platform" defaultMessage="Platform" />,
      dataIndex: 'platform',
      width: 100,
      render: (_: unknown, record: API.PeerItem) => record.platform || '-',
    },
    {
      title: <FormattedMessage id="pages.addressBook.tags" defaultMessage="Tags" />,
      dataIndex: 'tags',
      width: 200,
      search: false,
      render: (_: unknown, record: API.PeerItem) => {
        if (!record.tags || record.tags.length === 0) return '-';
        return (
          <Space size={[0, 4]} wrap>
            {record.tags.map((tag: string) => {
              const tagInfo = tags.find((t) => t.name === tag);
              return (
                <Tag key={tag} color={tagInfo?.color || 'blue'}>
                  {tag}
                </Tag>
              );
            })}
          </Space>
        );
      },
    },
    {
      title: <FormattedMessage id="pages.common.action" defaultMessage="Action" />,
      valueType: 'option',
      width: 150,
      fixed: 'right',
      render: (_: unknown, record: API.PeerItem) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleEdit(record)}>
            <FormattedMessage id="pages.common.edit" defaultMessage="Edit" />
          </Button>
          <Popconfirm
            title={
              <FormattedMessage
                id="pages.addressBook.deleteConfirm"
                defaultMessage="Are you sure to delete this peer?"
              />
            }
            onConfirm={() => handleDelete(record.id)}
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
      <ProTable<API.PeerItem>
        headerTitle={<FormattedMessage id="pages.addressBook.personal" defaultMessage="Personal Address Book" />}
        actionRef={actionRef}
        rowKey="id"
        request={async (params) => {
          const result = await getPeers({
            current: params.current || 1,
            pageSize: params.pageSize || 20,
            ab: 'personal',
            search: searchParams.search,
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
        search={{
          labelWidth: 'auto',
          defaultCollapsed: false,
          optionRender: (searchConfig, formProps, dom) => [
            ...dom.reverse(),
          ],
        }}
        form={{
          onSubmit: handleSearch,
          onReset: () => {
            setSearchParams({});
          },
        }}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        scroll={{ x: 1000 }}
        toolBarRender={() => [
          <Button
            key="add"
            type="primary"
            onClick={() => {
              setCurrentPeer(null);
              form.resetFields();
              setEditModalVisible(true);
            }}
          >
            <FormattedMessage id="pages.addressBook.addPeer" defaultMessage="Add Peer" />
          </Button>,
        ]}
      />

      <Modal
        title={
          currentPeer ? (
            <FormattedMessage id="pages.addressBook.editPeer" defaultMessage="Edit Peer" />
          ) : (
            <FormattedMessage id="pages.addressBook.addPeer" defaultMessage="Add Peer" />
          )
        }
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setCurrentPeer(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
      >
        <Form form={form} onFinish={handleSave} layout="vertical">
          <Form.Item
            name="id"
            label={<FormattedMessage id="pages.addressBook.id" defaultMessage="ID" />}
            rules={[{ required: true, message: 'Please enter ID' }]}
          >
            <Input disabled={!!currentPeer} />
          </Form.Item>
          <Form.Item name="username" label={<FormattedMessage id="pages.addressBook.username" defaultMessage="Username" />}>
            <Input />
          </Form.Item>
          <Form.Item name="hostname" label={<FormattedMessage id="pages.addressBook.hostname" defaultMessage="Hostname" />}>
            <Input />
          </Form.Item>
          <Form.Item name="alias" label={<FormattedMessage id="pages.addressBook.alias" defaultMessage="Alias" />}>
            <Input />
          </Form.Item>
          <Form.Item name="platform" label={<FormattedMessage id="pages.addressBook.platform" defaultMessage="Platform" />}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label={<FormattedMessage id="pages.addressBook.password" defaultMessage="Password" />}>
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default PersonalAddressBook;
