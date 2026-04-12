import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useIntl, useRequest } from '@umijs/max';
import { App, Button, Form, Input, Modal, Popconfirm, Space, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import {
  getPersonalAddressBook,
  getPeers,
  addPeer,
  deletePeer,
  getTags,
  addTag,
} from '@/services/rustdesk-console/addressBook';

const PersonalAddressBook: React.FC = () => {
  const intl = useIntl();
  const { message: msgApi } = App.useApp();
  const actionRef = useRef<ActionType>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [addPeerModalVisible, setAddPeerModalVisible] = useState(false);
  const [addTagModalVisible, setAddTagModalVisible] = useState(false);
  const [addPeerForm] = Form.useForm();
  const [addTagForm] = Form.useForm();
  const [searchParams, setSearchParams] = useState<{
    search?: string;
  }>({});

  const { data: abData, loading: abLoading } = useRequest(getPersonalAddressBook);
  const { data: tags = [] } = useRequest(
    () => (abData ? getTags(abData) : Promise.resolve([])),
    { ready: !!abData }
  );

  const handleAddPeer = async (values: API.AddPeerParams) => {
    if (!abData) return;
    try {
      await addPeer(abData, values);
      msgApi.success(
        intl.formatMessage({ id: 'pages.addressBook.peerAdded', defaultMessage: 'Peer added' }),
      );
      setAddPeerModalVisible(false);
      addPeerForm.resetFields();
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.addressBook.peerAddFailed',
          defaultMessage: 'Failed to add peer',
        }),
      );
    }
  };

  const handleAddTag = async (values: API.AddTagParams) => {
    if (!abData) return;
    try {
      await addTag(abData, values);
      msgApi.success(
        intl.formatMessage({ id: 'pages.addressBook.tagAdded', defaultMessage: 'Tag added' }),
      );
      setAddTagModalVisible(false);
      addTagForm.resetFields();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.addressBook.tagAddFailed',
          defaultMessage: 'Failed to add tag',
        }),
      );
    }
  };

  const handleDeletePeer = async (id: string) => {
    if (!abData) return;
    try {
      await deletePeer(abData, { id });
      msgApi.success(
        intl.formatMessage({ id: 'pages.addressBook.peerDeleted', defaultMessage: 'Peer deleted' }),
      );
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.addressBook.peerDeleteFailed',
          defaultMessage: 'Failed to delete peer',
        }),
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
      title: "ID",
      dataIndex: "id",
      copyable: true,
      width: 150,
      ellipsis: true,
    },
    {
      title: (
        <FormattedMessage id="pages.addressBook.device" defaultMessage="Device" />
      ),
      dataIndex: "hostname",
      width: 150,
      ellipsis: true,
      search: false,
      render: (_: unknown, record: API.PeerItem) => record.hostname || "-",
    },
    {
      title: (
        <FormattedMessage id="pages.addressBook.alias" defaultMessage="Alias" />
      ),
      dataIndex: "alias",
      width: 150,
      ellipsis: true,
      search: false,
      render: (_: unknown, record: API.PeerItem) => (record as API.PeerItem & { alias?: string }).alias || "-",
    },
    {
      title: (
        <FormattedMessage id="pages.addressBook.tags" defaultMessage="Tags" />
      ),
      dataIndex: "tags",
      width: 200,
      search: false,
      render: (_: unknown, record: API.PeerItem) => {
        const peerTags = record.tags || [];
        if (peerTags.length === 0) return "-";
        return (
          <Space size={[0, 4]} wrap>
            {peerTags.map((tag: string) => {
              const tagInfo = (tags as API.TagItem[]).find((t: API.TagItem) => t.name === tag);
              return (
                <Tag key={tag} color={tagInfo?.color || "blue"}>
                  {tag}
                </Tag>
              );
            })}
          </Space>
        );
      },
    },
    {
      title: (
        <FormattedMessage id="pages.addressBook.note" defaultMessage="Note" />
      ),
      dataIndex: "note",
      width: 150,
      ellipsis: true,
      search: false,
      render: (_: unknown, record: API.PeerItem) => record.note || "-",
    },
    {
      title: (
        <FormattedMessage id="pages.common.action" defaultMessage="Action" />
      ),
      valueType: "option",
      width: 120,
      fixed: "right",
      render: (_: unknown, record: API.PeerItem) => (
        <Space size="small">
          <Popconfirm
            key="delete"
            title={
              <FormattedMessage
                id="pages.addressBook.deletePeerConfirm"
                defaultMessage="Are you sure to delete this peer?"
              />
            }
            onConfirm={() => handleDeletePeer(record.id)}
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
        headerTitle={
          <FormattedMessage id="pages.addressBook.personal" defaultMessage="Personal Address Book" />
        }
        actionRef={actionRef}
        rowKey="id"
        loading={abLoading}
        request={async (params) => {
          if (!abData) {
            return { data: [], total: 0, success: true };
          }
          const result = await getPeers({
            current: params.current || 1,
            pageSize: params.pageSize || 20,
            ab: abData,
            hide_password: true,
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
          <Button key="add" type="primary" onClick={() => setAddPeerModalVisible(true)}>
            <FormattedMessage id="pages.addressBook.addPeer" defaultMessage="Add" />
          </Button>,
          <Button key="addTag" onClick={() => setAddTagModalVisible(true)}>
            <FormattedMessage id="pages.addressBook.addTag" defaultMessage="Add Tag" />
          </Button>,
        ]}
      />

      <Modal
        title={<FormattedMessage id="pages.addressBook.addPeer" defaultMessage="Add Peer" />}
        open={addPeerModalVisible}
        onCancel={() => setAddPeerModalVisible(false)}
        onOk={() => addPeerForm.submit()}
      >
        <Form form={addPeerForm} onFinish={handleAddPeer} layout="vertical">
          <Form.Item
            name="id"
            label="ID"
            rules={[{ required: true, message: 'Please enter peer ID' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="hostname" label={<FormattedMessage id="pages.addressBook.device" defaultMessage="Device" />}>
            <Input />
          </Form.Item>
          <Form.Item name="note" label={<FormattedMessage id="pages.addressBook.note" defaultMessage="Note" />}>
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={<FormattedMessage id="pages.addressBook.addTag" defaultMessage="Add Tag" />}
        open={addTagModalVisible}
        onCancel={() => setAddTagModalVisible(false)}
        onOk={() => addTagForm.submit()}
      >
        <Form form={addTagForm} onFinish={handleAddTag} layout="vertical">
          <Form.Item
            name="name"
            label={<FormattedMessage id="pages.addressBook.tagName" defaultMessage="Tag Name" />}
            rules={[{ required: true, message: 'Please enter tag name' }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default PersonalAddressBook;
