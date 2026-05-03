import type { ActionType } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import {
  Alert,
  App,
  Button,
  ColorPicker,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Tag,
} from 'antd';
import { DeleteOutlined, PlusOutlined, SelectOutlined } from '@ant-design/icons';
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
import {
  TagFilter,
  TagManagement,
  AddPeerModal,
  EditPeerModal,
  ImportDevicesModal,
  argbToHex,
} from '@/pages/address-book/shared';
import DeviceSelectTable from '@/components/DeviceSelectTable';

const PersonalAddressBook: React.FC = () => {
  const intl = useIntl();
  const { message: msgApi } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // Modal states
  const [addPeerModalVisible, setAddPeerModalVisible] = useState(false);
  const [editPeerModalVisible, setEditPeerModalVisible] = useState(false);
  const [addTagModalVisible, setAddTagModalVisible] = useState(false);
  const [tagManagementVisible, setTagManagementVisible] = useState(false);
  const [importDevicesModalVisible, setImportDevicesModalVisible] = useState(false);
  const [selectedDeviceKeys, setSelectedDeviceKeys] = useState<React.Key[]>([]);
  const [importing, setImporting] = useState(false);

  // Form instances
  const [addPeerForm] = Form.useForm();
  const [editPeerForm] = Form.useForm();
  const [addTagForm] = Form.useForm();
  const [renameTagForm] = Form.useForm();

  // Error states
  const [addPeerError, setAddPeerError] = useState('');
  const [editPeerError, setEditPeerError] = useState('');
  const [editingPeer, setEditingPeer] = useState<API.PeerItem | null>(null);

  // Data states
  const [abGuid, setAbGuid] = useState<string>();
  const [abLoading, setAbLoading] = useState(true);
  const [tags, setTags] = useState<API.TagItem[]>([]);
  const [pendingColorUpdates, setPendingColorUpdates] = useState<Record<string, number>>({});
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagMode, setTagMode] = useState<'union' | 'intersection'>('union');

  // Fetch address book GUID
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

  // Fetch tags
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

  // Reload table when abGuid changes
  useEffect(() => {
    if (abGuid) {
      actionRef.current?.reload();
    }
  }, [abGuid]);

  // Reset add peer form when modal opens
  useEffect(() => {
    if (addPeerModalVisible) {
      setAddPeerError('');
      addPeerForm.resetFields();
    }
  }, [addPeerModalVisible, addPeerForm]);

  // Add peer handler
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
      setAddPeerError(
        errMsg ||
          intl.formatMessage({
            id: 'pages.addressBook.peerAddFailed',
            defaultMessage: 'Failed to add peer',
          }),
      );
    }
  };

  // Edit peer handler
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

  // Update peer handler
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
      setEditPeerError(
        errMsg ||
          intl.formatMessage({
            id: 'pages.addressBook.peerUpdateFailed',
            defaultMessage: 'Failed to update peer',
          }),
      );
    }
  };

  // Delete peer handler
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

  // Add tag handler
  const handleAddTag = async (values: {
    name: string;
    color?: { toRgb: () => { r: number; g: number; b: number; a: number } };
  }) => {
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

  // Rename tag handler
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

  // Update tag color handler
  const handleUpdateTagColor = async (tagName: string, color: number) => {
    if (!abGuid) return;
    try {
      await updateTagColor(abGuid, { name: tagName, color });
      setTags((prev) => prev.map((tag) => (tag.name === tagName ? { ...tag, color } : tag)));
      setPendingColorUpdates((prev) => {
        const next = { ...prev };
        delete next[tagName];
        return next;
      });
    } catch {
      setPendingColorUpdates((prev) => {
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

  // Delete tag handler
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

  // Import devices handler
  const handleImportDevices = async () => {
    if (!abGuid || selectedDeviceKeys.length === 0) return;
    setImporting(true);
    let successCount = 0;
    let failCount = 0;
    for (const deviceId of selectedDeviceKeys) {
      try {
        await addPeer(abGuid, { id: deviceId as string });
        successCount++;
      } catch {
        failCount++;
      }
    }
    setImporting(false);
    setImportDevicesModalVisible(false);
    setSelectedDeviceKeys([]);
    if (successCount > 0) {
      msgApi.success(
        intl.formatMessage(
          { id: 'pages.addressBook.importSuccess', defaultMessage: 'Successfully imported {count} device(s)' },
          { count: successCount },
        ),
      );
      actionRef.current?.reload();
    }
    if (failCount > 0) {
      msgApi.warning(
        intl.formatMessage(
          { id: 'pages.addressBook.importPartialFailed', defaultMessage: '{count} device(s) failed to import' },
          { count: failCount },
        ),
      );
    }
  };

  // Tag selection handler
  const handleTagSelect = (tagName: string) => {
    setSelectedTags((prev) => {
      const isSelected = prev.includes(tagName);
      return isSelected ? prev.filter((t) => t !== tagName) : [...prev, tagName];
    });
    actionRef.current?.reload();
  };

  // Reset filter handler
  const handleResetFilter = () => {
    setSelectedTags([]);
    actionRef.current?.reload();
  };

  return (
    <PageContainer>
      {/* Tag Filter Area */}
      <TagFilter
        tags={tags}
        selectedTags={selectedTags}
        tagMode={tagMode}
        pendingColorUpdates={pendingColorUpdates}
        onTagSelect={handleTagSelect}
        onTagDelete={handleDeleteTag}
        onTagModeChange={setTagMode}
        onTagColorUpdate={handleUpdateTagColor}
        onAddTag={() => setAddTagModalVisible(true)}
        onResetFilter={handleResetFilter}
      />

      {/* Peer Table */}
      <ProTable<API.PeerItem>
        headerTitle={
          <FormattedMessage id="pages.addressBook.personal" defaultMessage="Personal Address Book" />
        }
        actionRef={actionRef}
        rowKey="id"
        loading={abLoading}
        request={async (params: any) => {
          if (!abGuid) {
            return { data: [], total: 0, success: true };
          }
          const result = await getPeers({
            current: params.current || 1,
            pageSize: params.pageSize || 20,
            ab: abGuid,
            id: params.id,
            tags: selectedTags.length > 0 ? selectedTags : undefined,
            tagMode: selectedTags.length > 1 ? tagMode : undefined,
          });
          return {
            data: result.data || [],
            total: result.total || 0,
            success: true,
          };
        }}
        columns={[
          {
            title: <FormattedMessage id="pages.common.id" defaultMessage="ID" />,
            dataIndex: 'id',
            width: 150,
            ellipsis: true,
            sorter: true,
          },
          {
            title: (
              <Space size={4}>
                <FormattedMessage id="pages.addressBook.device" defaultMessage="Device" />
              </Space>
            ),
            dataIndex: 'hostname',
            width: 150,
            ellipsis: true,
            search: false,
            sorter: true,
            render: (_: unknown, record: API.PeerItem) => record.hostname || '-',
          },
          {
            title: <FormattedMessage id="pages.addressBook.alias" defaultMessage="Alias" />,
            dataIndex: 'alias',
            width: 150,
            ellipsis: true,
            search: false,
            sorter: true,
            render: (_: unknown, record: API.PeerItem & { alias?: string }) => record.alias || '-',
          },
          {
            title: <FormattedMessage id="pages.addressBook.tags" defaultMessage="Tags" />,
            dataIndex: 'tags',
            width: 200,
            search: false,
            render: (_: unknown, record: API.PeerItem) => {
              const peerTags = record.tags || [];
              if (peerTags.length === 0) return '-';
              return (
                <Space size={[0, 4]} wrap>
                  {peerTags.map((tag: string) => {
                    const tagInfo = tags.find((t: API.TagItem) => t.name === tag);
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
            title: <FormattedMessage id="pages.addressBook.note" defaultMessage="Note" />,
            dataIndex: 'note',
            width: 150,
            ellipsis: true,
            search: false,
            sorter: true,
            render: (_: unknown, record: API.PeerItem) => record.note || '-',
          },
          {
            title: <FormattedMessage id="pages.common.action" defaultMessage="Action" />,
            valueType: 'option',
            width: 160,
            fixed: 'right',
            render: (_: unknown, record: API.PeerItem) => (
              <Space size="small" split={<span style={{ color: '#ccc' }}>|</span>}>
                <Button
                  key="edit"
                  type="link"
                  size="small"
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
        ]}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        search={{
          labelWidth: 'auto',
          defaultCollapsed: false,
          optionRender: (_searchConfig, _formProps, dom) => [dom[1], dom[0]],
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
          <Button key="import" icon={<SelectOutlined />} onClick={() => setImportDevicesModalVisible(true)}>
            <FormattedMessage id="pages.addressBook.import" defaultMessage="Import" />
          </Button>,
          <Button key="recycle" icon={<DeleteOutlined />}>
            <FormattedMessage id="pages.addressBook.recycleBin" defaultMessage="Recycle Bin" />
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
      <AddPeerModal
        open={addPeerModalVisible}
        tags={tags}
        addPeerForm={addPeerForm}
        addPeerError={addPeerError}
        onCancel={() => setAddPeerModalVisible(false)}
        onSubmit={handleAddPeer}
      />

      {/* Edit Peer Modal */}
      <EditPeerModal
        open={editPeerModalVisible}
        tags={tags}
        editPeerForm={editPeerForm}
        editingPeer={editingPeer}
        editPeerError={editPeerError}
        onCancel={() => {
          setEditPeerModalVisible(false);
          setEditingPeer(null);
        }}
        onSubmit={handleUpdatePeer}
      />

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
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'pages.common.pleaseEnterTagName',
                  defaultMessage: 'Please enter tag name',
                }),
              },
            ]}
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
      <TagManagement
        open={tagManagementVisible}
        tags={tags}
        pendingColorUpdates={pendingColorUpdates}
        onCancel={() => setTagManagementVisible(false)}
        onRenameTag={handleRenameTag}
        onTagColorUpdate={handleUpdateTagColor}
        onDeleteTag={handleDeleteTag}
      />

      {/* Import Devices Modal */}
      <ImportDevicesModal
        open={importDevicesModalVisible}
        selectedDeviceKeys={selectedDeviceKeys}
        importing={importing}
        onSelectionChange={setSelectedDeviceKeys}
        onCancel={() => {
          setImportDevicesModalVisible(false);
          setSelectedDeviceKeys([]);
        }}
        onSubmit={handleImportDevices}
      />
    </PageContainer>
  );
};

export default PersonalAddressBook;