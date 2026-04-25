import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Alert, App, Button, ColorPicker, Form, Input, Modal, Popconfirm, Select, Space, Spin, Tag, Table, Typography } from 'antd';
import { CloseOutlined, DeleteOutlined, EditOutlined, ImportOutlined, PlusOutlined, SelectOutlined, TagOutlined } from '@ant-design/icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  getPersonalAddressBook,
  getPeers,
  addPeer,
  updatePeer,
  deletePeer,
  getTags,
  addTag,
  renameTag,
  updateTagColor,
  deleteTag,
} from '@/services/rustdesk-console/addressBook';
import { getDeviceList } from '@/services/rustdesk-console/device';

const { Text } = Typography;

const argbToHex = (color: number | undefined): string => {
  if (!color) return '#1677ff';
  return `#${color.toString(16).padStart(8, '0').slice(-6)}`;
};

const PersonalAddressBook: React.FC = () => {
  const intl = useIntl();
  const { message: msgApi } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  
  const [addPeerModalVisible, setAddPeerModalVisible] = useState(false);
  const [editPeerModalVisible, setEditPeerModalVisible] = useState(false);
  const [addTagModalVisible, setAddTagModalVisible] = useState(false);
  const [tagManagementVisible, setTagManagementVisible] = useState(false);
  
  const [addPeerForm] = Form.useForm();
  const [editPeerForm] = Form.useForm();
  const [addTagForm] = Form.useForm();
  const [renameTagForm] = Form.useForm();

  const [availablePeers, setAvailablePeers] = useState<API.DeviceItem[]>([]);
  const [peersLoading, setPeersLoading] = useState(false);
  const [addPeerError, setAddPeerError] = useState('');
  const [editPeerError, setEditPeerError] = useState('');
  const [selectedPeerId, setSelectedPeerId] = useState<string>();
  const [editingPeer, setEditingPeer] = useState<API.PeerItem | null>(null);

  const [abGuid, setAbGuid] = useState<string>();
  const [abLoading, setAbLoading] = useState(true);
  const [tags, setTags] = useState<API.TagItem[]>([]);
  const [pendingColorUpdates, setPendingColorUpdates] = useState<Record<string, number>>({});
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  
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
  
  const fetchTags = useCallback(async () => {
    if (!abGuid) return;
    try {
      const result = await getTags(abGuid);
      setTags(result || []);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
      setTags([]);
    }
  }, [abGuid]);
  
  useEffect(() => {
    if (abGuid) {
      fetchTags();
    }
  }, [abGuid, fetchTags]);

  useEffect(() => {
    if (abGuid) {
      actionRef.current?.reload();
    }
  }, [abGuid]);

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

  const handleAddPeer = async (values: API.AddPeerParams & { peerSelect?: string }) => {
    if (!abGuid) return;
    setAddPeerError('');
    try {
      const { peerSelect, ...peerData } = values;
      await addPeer(abGuid, peerData);
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

  const handleEditPeer = (record: API.PeerItem) => {
    setEditingPeer(record);
    setEditPeerError('');
    editPeerForm.setFieldsValue({
      id: record.id,
      alias: record.alias || '',
      hostname: record.hostname || '',
      note: record.note || '',
      tags: record.tags || [],
    });
    setEditPeerModalVisible(true);
  };

  const handleUpdatePeer = async (values: API.UpdatePeerParams) => {
    if (!abGuid || !editingPeer) return;
    setEditPeerError('');
    try {
      await updatePeer(abGuid, { id: editingPeer.id, ...values });
      msgApi.success(
        intl.formatMessage({ id: 'pages.addressBook.peerUpdated', defaultMessage: 'Peer updated' }),
      );
      setEditPeerModalVisible(false);
      setEditingPeer(null);
      editPeerForm.resetFields();
      actionRef.current?.reload();
    } catch (error: any) {
      const errMsg = error?.response?.data?.error || error?.message || '';
      setEditPeerError(errMsg || intl.formatMessage({
        id: 'pages.addressBook.peerUpdateFailed',
        defaultMessage: 'Failed to update peer',
      }));
    }
  };

  const handleDeletePeer = async (id: string) => {
    if (!abGuid) return;
    try {
      await deletePeer(abGuid, [id]);
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

  const handleAddTag = async (values: { name: string; color?: { toRgb: () => { r: number; g: number; b: number; a: number } } }) => {
    if (!abGuid) return;
    try {
      const tagData: API.AddTagParams = {
        name: values.name,
      };

      if (values.color?.toRgb) {
        const rgb = values.color.toRgb();
        tagData.color = 0xFF000000 + (rgb.r << 16) + (rgb.g << 8) + rgb.b;
      }
      
      await addTag(abGuid, tagData);
      msgApi.success(
        intl.formatMessage({ id: 'pages.addressBook.tagAdded', defaultMessage: 'Tag added' }),
      );
      setAddTagModalVisible(false);
      addTagForm.resetFields();
      fetchTags();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.addressBook.tagAddFailed',
          defaultMessage: 'Failed to add tag',
        }),
      );
    }
  };

  const handleRenameTag = async (values: API.RenameTagParams) => {
    if (!abGuid) return;
    try {
      await renameTag(abGuid, values);
      msgApi.success(
        intl.formatMessage({ id: 'pages.addressBook.tagRenamed', defaultMessage: 'Tag renamed' }),
      );
      renameTagForm.resetFields();
      fetchTags();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.addressBook.tagRenameFailed',
          defaultMessage: 'Failed to rename tag',
        }),
      );
    }
  };

  const handleUpdateTagColor = async (tagName: string, color: number) => {
    if (!abGuid) return;
    try {
      await updateTagColor(abGuid, { name: tagName, color });
      setTags(prev => prev.map(tag => tag.name === tagName ? { ...tag, color } : tag));
      setPendingColorUpdates(prev => {
        const next = { ...prev };
        delete next[tagName];
        return next;
      });
    } catch {
      setPendingColorUpdates(prev => {
        const next = { ...prev };
        delete next[tagName];
        return next;
      });
      msgApi.error(
        intl.formatMessage({
          id: 'pages.addressBook.tagColorUpdateFailed',
          defaultMessage: 'Failed to update tag color',
        }),
      );
    }
  };

  const handleDeleteTag = async (tagName: string) => {
    if (!abGuid) return;
    try {
      await deleteTag(abGuid, [tagName]);
      msgApi.success(
        intl.formatMessage({ id: 'pages.addressBook.tagDeleted', defaultMessage: 'Tag deleted' }),
      );
      fetchTags();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.addressBook.tagDeleteFailed',
          defaultMessage: 'Failed to delete tag',
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
                <Tag key={tag} color={argbToHex(tagInfo?.color)}>
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
      width: 160,
      fixed: "right",
      render: (_: unknown, record: API.PeerItem) => (
        <Space size="small">
          <Button
            key="edit"
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditPeer(record)}
          >
            <FormattedMessage id="pages.common.edit" defaultMessage="Edit" />
          </Button>
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

  const tagColumns = [
    {
      title: intl.formatMessage({ id: 'pages.addressBook.tagName', defaultMessage: 'Tag Name' }),
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text: string, record: API.TagItem) => (
        <Tag color={argbToHex(record.color)} style={{ marginRight: 8 }}>
          {text}
        </Tag>
      ),
    },
    {
      title: intl.formatMessage({ id: 'pages.addressBook.color', defaultMessage: 'Color' }),
      dataIndex: 'color',
      key: 'color',
      width: 120,
      render: (color: number, record: API.TagItem) => {
        const displayColor = pendingColorUpdates[record.name] ?? color;
        return (
          <ColorPicker
            size="small"
            disabledAlpha
            value={argbToHex(displayColor)}
            onChangeComplete={(colorValue) => {
              const rgb = colorValue.toRgb();
              const newArgb = 0xFF000000 + (rgb.r << 16) + (rgb.g << 8) + rgb.b;
              setPendingColorUpdates(prev => ({ ...prev, [record.name]: newArgb }));
              handleUpdateTagColor(record.name, newArgb);
            }}
          />
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'pages.common.action', defaultMessage: 'Action' }),
      key: 'action',
      width: 180,
      render: (_: unknown, record: API.TagItem) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => {
              Modal.confirm({
                title: intl.formatMessage({ id: 'pages.addressBook.renameTag', defaultMessage: 'Rename Tag' }),
                content: (
                  <Form form={renameTagForm} initialValues={{ old: record.name, new: '' }}>
                    <Form.Item name="old" hidden><Input /></Form.Item>
                    <Form.Item
                      name="new"
                      label={intl.formatMessage({ id: 'pages.addressBook.newTagName', defaultMessage: 'New Tag Name' })}
                      rules={[{ required: true }]}
                    >
                      <Input />
                    </Form.Item>
                  </Form>
                ),
                onOk: () => renameTagForm.validateFields().then(handleRenameTag),
              });
            }}
          >
            <FormattedMessage id="pages.common.rename" defaultMessage="Rename" />
          </Button>
          <Popconfirm
            title={
              <FormattedMessage
                id="pages.addressBook.deleteTagConfirm"
                defaultMessage="Are you sure to delete this tag?"
              />
            }
            onConfirm={() => handleDeleteTag(record.name)}
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
      {/* Tags Area */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontWeight: 500, marginRight: 4 }}>
          <FormattedMessage id="pages.addressBook.tags" defaultMessage="Tags" />
        </span>
        <Tag
          style={{ cursor: 'pointer', padding: '2px 8px' }}
          color={selectedTag === null ? 'blue' : undefined}
          onClick={() => { setSelectedTag(null); actionRef.current?.reload(); }}
        >
          Untagged
        </Tag>
        {(tags as API.TagItem[]).map((tag: API.TagItem) => (
          <Tag
            key={tag.name}
            color={selectedTag === tag.name ? argbToHex(tag.color) : undefined}
            style={{ cursor: 'pointer', padding: '2px 8px' }}
            closeIcon={<CloseOutlined style={{ fontSize: 10, marginLeft: 2 }} />}
            closable
            onClose={(e) => {
              e.preventDefault();
              handleDeleteTag(tag.name);
            }}
            onClick={() => {
              setSelectedTag(selectedTag === tag.name ? null : tag.name);
              actionRef.current?.reload();
            }}
          >
            {tag.name}
          </Tag>
        ))}
        <Button
          size="small"
          type="dashed"
          icon={<PlusOutlined />}
          onClick={() => setAddTagModalVisible(true)}
        />
      </div>

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
            id: params.id,
            tags: selectedTag ? [selectedTag] : undefined,
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
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        scroll={{ x: 1100 }}
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
          <Button key="addTag" icon={<TagOutlined />} onClick={() => setAddTagModalVisible(true)}>
            <FormattedMessage id="pages.addressBook.addTag" defaultMessage="Add Tag" />
          </Button>,
          <Button key="manageTags" icon={<TagOutlined />} onClick={() => setTagManagementVisible(true)}>
            <FormattedMessage id="pages.addressBook.manageTags" defaultMessage="Manage Tags" />
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

      {/* Add Peer Modal */}
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
              options={Array.from(
                new Map(availablePeers.map((p: API.DeviceItem) => [p.id, p])).values(),
              ).map((p: API.DeviceItem) => ({
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

      {/* Edit Peer Modal */}
      <Modal
        title={<FormattedMessage id="pages.addressBook.editPeer" defaultMessage="Edit Peer" />}
        open={editPeerModalVisible}
        onCancel={() => {
          setEditPeerModalVisible(false);
          setEditingPeer(null);
          editPeerForm.resetFields();
        }}
        onOk={() => editPeerForm.submit()}
      >
        {editPeerError && (
          <Alert
            message={editPeerError}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Form form={editPeerForm} onFinish={handleUpdatePeer} layout="vertical">
          <Form.Item name="id" label="ID">
            <Input disabled />
          </Form.Item>
          <Form.Item name="hostname" label={<FormattedMessage id="pages.addressBook.device" defaultMessage="Device" />}>
            <Input disabled />
          </Form.Item>
          <Form.Item name="alias" label={<FormattedMessage id="pages.addressBook.alias" defaultMessage="Alias" />}>
            <Input />
          </Form.Item>
          <Form.Item name="note" label={<FormattedMessage id="pages.addressBook.note" defaultMessage="Note" />}>
            <Input.TextArea />
          </Form.Item>
          <Form.Item name="tags" label={<FormattedMessage id="pages.addressBook.tags" defaultMessage="Tags" />}>
            <Select
              mode="multiple"
              placeholder={intl.formatMessage({
                id: 'pages.addressBook.selectTags',
                defaultMessage: 'Select tags',
              })}
              options={(tags as API.TagItem[]).map(tag => ({
                label: tag.name,
                value: tag.name,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Tag Modal */}
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
          <Form.Item
            name="color"
            label={<FormattedMessage id="pages.addressBook.color" defaultMessage="Color" />}
          >
            <ColorPicker disabledAlpha />
          </Form.Item>
        </Form>
      </Modal>

      {/* Tag Management Modal */}
      <Modal
        title={<FormattedMessage id="pages.addressBook.manageTags" defaultMessage="Manage Tags" />}
        open={tagManagementVisible}
        onCancel={() => setTagManagementVisible(false)}
        footer={null}
        width={700}
      >
        <Table
          dataSource={tags as API.TagItem[]}
          columns={tagColumns}
          rowKey="name"
          pagination={false}
          size="middle"
        />
      </Modal>
    </PageContainer>
  );
};

export default PersonalAddressBook;
