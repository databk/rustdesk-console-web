import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useIntl, useRequest } from '@umijs/max';
import { Alert, App, Button, Form, Input, Modal, Popconfirm, Select, Space, Spin, Tag } from 'antd';
import { DeleteOutlined, ImportOutlined, PlusOutlined } from '@ant-design/icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  getPersonalAddressBook,
  getPeers,
  addPeer,
  deletePeer,
  getTags,
  addTag,
} from '@/services/rustdesk-console/addressBook';
import { getDeviceList } from '@/services/rustdesk-console/device';

const PersonalAddressBook: React.FC = () => {
  const intl = useIntl();
  const { message: msgApi } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [addPeerModalVisible, setAddPeerModalVisible] = useState(false);
  const [addTagModalVisible, setAddTagModalVisible] = useState(false);
  const [addPeerForm] = Form.useForm();
  const [addTagForm] = Form.useForm();
  const [searchParams, setSearchParams] = useState<{
    search?: string;
  }>({});
  const [availablePeers, setAvailablePeers] = useState<API.DeviceItem[]>([]);
  const [peersLoading, setPeersLoading] = useState(false);
  const [addPeerError, setAddPeerError] = useState('');
  const [selectedPeerId, setSelectedPeerId] = useState<string>();

  const [abGuid, setAbGuid] = useState<string>();
  const [abLoading, setAbLoading] = useState(true);
  
  useEffect(() => {
    const fetchAbGuid = async () => {
      setAbLoading(true);
      try {
        const result = await getPersonalAddressBook();
        setAbGuid(result.guid);
      } catch (error) {
        console.error('Failed to fetch personal address book:', error);
      } finally {
        setAbLoading(false);
      }
    };
    fetchAbGuid();
  }, []);
  
  const { data: tags = [] } = useRequest(
    () => (abGuid ? getTags(abGuid) : Promise.resolve([])),
    { ready: !!abGuid }
  );

  const fetchAvailablePeers = useCallback(async () => {
    if (!abGuid) return;
    setPeersLoading(true);
    try {
      const res = await getPeers({
        current: 1,
        pageSize: 1000,
        ab: abGuid,
      });
      const existingIds = new Set((res.data || []).map((p: API.PeerItem) => p.id));
      const allDevices = await getDeviceList({ current: 1, pageSize: 1000 });
      const notInAb = (allDevices.data || []).filter((d: API.DeviceItem) => !existingIds.has(d.id));
      setAvailablePeers(notInAb);
    } catch {
      setAvailablePeers([]);
    } finally {
      setPeersLoading(false);
    }
  }, [abGuid]);

  useEffect(() => {
    if (addPeerModalVisible && abGuid) {
      setAddPeerError('');
      setSelectedPeerId(undefined);
      addPeerForm.resetFields();
      fetchAvailablePeers();
    }
  }, [addPeerModalVisible, abGuid, addPeerForm, fetchAvailablePeers]);

  const handleAddPeer = async (values: API.AddPeerParams) => {
    if (!abGuid) return;
    setAddPeerError('');
    try {
      await addPeer(abGuid, values);
      msgApi.success(
        intl.formatMessage({ id: 'pages.addressBook.peerAdded', defaultMessage: 'Peer added' }),
      );
      setAddPeerModalVisible(false);
      addPeerForm.resetFields();
      actionRef.current?.reload();
    } catch (error: any) {
      const errMsg = error?.response?.data?.error || error?.message || '';
      setAddPeerError(errMsg || intl.formatMessage({
        id: 'pages.addressBook.peerAddFailed',
        defaultMessage: 'Failed to add peer',
      }));
    }
  };

  const handleAddTag = async (values: API.AddTagParams) => {
    if (!abGuid) return;
    try {
      await addTag(abGuid, values);
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
    if (!abGuid) return;
    try {
      await deletePeer(abGuid, { id });
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

  const handlePeerSelect = (peerId: string) => {
    setSelectedPeerId(peerId);
    const peer = availablePeers.find((p: API.DeviceItem) => p.id === peerId);
    if (peer) {
      addPeerForm.setFieldsValue({ id: peer.id, hostname: peer.hostname || '' });
    }
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
          if (!abGuid) {
            return { data: [], total: 0, success: true };
          }
          const result = await getPeers({
            current: params.current || 1,
            pageSize: params.pageSize || 20,
            ab: abGuid,
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
        params={{ search: searchParams.search }}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        scroll={{ x: 1000 }}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => setAddPeerModalVisible(true)}>
            <FormattedMessage id="pages.addressBook.addPeer" defaultMessage="Add" />
          </Button>,
          <Button key="import" icon={<ImportOutlined />}>
            <FormattedMessage id="pages.addressBook.import" defaultMessage="Import" />
          </Button>,
          <Button key="recycle" icon={<DeleteOutlined />}>
            <FormattedMessage id="pages.addressBook.recycleBin" defaultMessage="Recycle Bin" />
          </Button>,
          <Button key="addTag" onClick={() => setAddTagModalVisible(true)}>
            <FormattedMessage id="pages.addressBook.addTag" defaultMessage="Add Tag" />
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
        title={<FormattedMessage id="pages.addressBook.addPeer" defaultMessage="Add Peer" />}
        open={addPeerModalVisible}
        onCancel={() => setAddPeerModalVisible(false)}
        onOk={() => addPeerForm.submit()}
      >
        {addPeerError && (
          <Alert
            message={addPeerError}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Form form={addPeerForm} onFinish={handleAddPeer} layout="vertical">
          <Form.Item
            name="peerSelect"
            label={<FormattedMessage id="pages.addressBook.selectDevice" defaultMessage="Select Device" />}
          >
            <Select
              placeholder={intl.formatMessage({
                id: 'pages.addressBook.selectDevicePlaceholder',
                defaultMessage: 'Select a device from the system',
              })}
              loading={peersLoading}
              onChange={handlePeerSelect}
              allowClear
              showSearch
              optionFilterProp="label"
              options={availablePeers.map((p: API.DeviceItem) => ({
                label: `${p.hostname || p.id} (${p.id})`,
                value: p.id,
              }))}
              notFoundContent={peersLoading ? <Spin size="small" /> : intl.formatMessage({
                id: 'pages.addressBook.noAvailableDevices',
                defaultMessage: 'No available devices. Devices must connect to the server first.',
              })}
            />
          </Form.Item>
          <Form.Item
            name="id"
            label="ID"
            rules={[{ required: true, message: 'Please enter peer ID' }]}
          >
            <Input disabled={!!selectedPeerId} />
          </Form.Item>
          <Form.Item name="hostname" label={<FormattedMessage id="pages.addressBook.device" defaultMessage="Device" />}>
            <Input disabled={!!selectedPeerId} />
          </Form.Item>
          <Form.Item name="alias" label={<FormattedMessage id="pages.addressBook.alias" defaultMessage="Alias" />}>
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
