import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useIntl, history, useLocation } from '@umijs/max';
import { App, Button, Card, Form, Input, Modal, Popconfirm, Space, Tag, ColorPicker, Radio } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, RightOutlined } from '@ant-design/icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  addSharedAddressBook,
  deleteSharedAddressBooks,
  getSharedAddressBooks,
  updateSharedAddressBook,
  getTags,
  addTag,
  renameTag,
  updateTagColor,
  deleteTag,
} from '@/services/rustdesk-console/addressBook';
import DetailTable from '../components/DetailTable';

const argbToHex = (color: number | undefined): string => {
  if (!color) return '#1677ff';
  return `#${color.toString(16).padStart(8, '0').slice(-6)}`;
};

const SharedAddressBook: React.FC = () => {
  const intl = useIntl();
  const { message: msgApi } = App.useApp();
  const actionRef = useRef<ActionType>();
  const deviceTableActionRef = useRef<ActionType>();
  const location = useLocation();

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<API.SharedAddressBook | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const [selectedAddressBook, setSelectedAddressBook] = useState<API.SharedAbProfile | null>(null);
  const [abTags, setAbTags] = useState<API.AbTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagMode, setTagMode] = useState<'union' | 'intersection'>('union');
  const [pendingColorUpdates, setPendingColorUpdates] = useState<Record<string, number>>({});

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
      if (selectedAddressBook && guids.includes(selectedAddressBook.guid)) {
        setSelectedAddressBook(null);
      }
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.addressBook.deleteFailed',
          defaultMessage: 'Failed to delete address book(s)',
        }),
      );
    }
  };

  const handleViewAddressBook = (record: API.SharedAddressBook) => {
    setSelectedAddressBook({
      guid: record.guid,
      name: record.name,
      note: record.note,
      password: record.password,
      rule: 1,
    });
  };

  const fetchTags = useCallback(async () => {
    if (!selectedAddressBook) return;
    try {
      const result = await getTags(selectedAddressBook.guid);
      setAbTags(result || []);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
      setAbTags([]);
    }
  }, [selectedAddressBook]);

  useEffect(() => {
    if (selectedAddressBook) {
      fetchTags();
    }
  }, [selectedAddressBook, fetchTags]);

  const handleAddTag = async (tagName: string, color?: number) => {
    if (!selectedAddressBook) return;
    try {
      await addTag(selectedAddressBook.guid, { name: tagName, color });
      msgApi.success(
        intl.formatMessage({ id: 'pages.addressBook.tagAdded', defaultMessage: 'Tag added' }),
      );
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

  const handleDeleteTag = async (tagName: string) => {
    if (!selectedAddressBook) return;
    try {
      await deleteTag(selectedAddressBook.guid, [tagName]);
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

  const handleUpdateTagColor = async (tagName: string, color: number) => {
    if (!selectedAddressBook) return;
    try {
      await updateTagColor(selectedAddressBook.guid, { name: tagName, color });
      setAbTags(prev => prev.map(tag => tag.name === tagName ? { ...tag, color } : tag));
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

  const columns: ProColumns<API.SharedAddressBook>[] = [
    {
      title: <FormattedMessage id="pages.addressBook.name" defaultMessage="Name" />,
      dataIndex: 'name',
      render: (text, record) => (
        <Space>
          <span>{text}</span>
          <Button
            type="link"
            size="small"
            icon={<RightOutlined />}
            onClick={() => handleViewAddressBook(record)}
          >
            <FormattedMessage id="pages.addressBook.view" defaultMessage="View" />
          </Button>
        </Space>
      ),
    },
    {
      title: <FormattedMessage id="pages.addressBook.note" defaultMessage="Note" />,
      dataIndex: 'note',
      ellipsis: true,
    },
    {
      title: <FormattedMessage id="pages.addressBook.peerCount" defaultMessage="Peer Count" />,
      dataIndex: 'peer_count',
      width: 100,
    },
    {
      title: <FormattedMessage id="pages.common.action" defaultMessage="Action" />,
      valueType: 'option',
      width: 180,
      render: (_, record) => (
        <>
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
          >
            <Button type="link" size="small" danger>
              <FormattedMessage id="pages.common.delete" defaultMessage="Delete" />
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  if (selectedAddressBook) {
    return (
      <PageContainer
        title={
          <Space>
            <Button
              type="link"
              onClick={() => {
                setSelectedAddressBook(null);
                setSelectedTags([]);
              }}
            >
              <FormattedMessage id="pages.addressBook.shared" defaultMessage="Shared Address Books" />
            </Button>
            <span>/</span>
            <span>{selectedAddressBook.name}</span>
          </Space>
        }
      >
        <Card
          style={{ marginBottom: 16 }}
          bodyStyle={{ padding: '12px 24px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontWeight: 500, marginRight: 4 }}>
              <FormattedMessage id="pages.addressBook.tags" defaultMessage="Tags" />
            </span>
            <Tag
              style={{ cursor: 'pointer', padding: '2px 8px' }}
              color={selectedTags.length === 0 ? 'blue' : undefined}
              onClick={() => {
                setSelectedTags([]);
                deviceTableActionRef.current?.reload();
              }}
            >
              <FormattedMessage id="pages.addressBook.untagged" defaultMessage="Untagged" />
            </Tag>
            {abTags.map((tag) => {
              const displayColor = argbToHex(pendingColorUpdates[tag.name] ?? tag.color);
              const isSelected = selectedTags.includes(tag.name);
              return (
                <Tag
                  key={tag.name}
                  color={isSelected ? displayColor : undefined}
                  style={{ cursor: 'pointer', padding: '2px 8px' }}
                  closable
                  onClose={(e) => {
                    e.preventDefault();
                    handleDeleteTag(tag.name);
                  }}
                  onClick={() => {
                    setSelectedTags(prev =>
                      isSelected ? prev.filter(t => t !== tag.name) : [...prev, tag.name]
                    );
                    deviceTableActionRef.current?.reload();
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <ColorPicker
                      disabledAlpha
                      value={displayColor}
                      onChange={(colorValue) => {
                        const rgb = colorValue.toRgb();
                        const newArgb = 0xFF000000 + (rgb.r << 16) + (rgb.g << 8) + rgb.b;
                        setPendingColorUpdates(prev => ({ ...prev, [tag.name]: newArgb }));
                      }}
                      onChangeComplete={(colorValue) => {
                        const rgb = colorValue.toRgb();
                        const newArgb = 0xFF000000 + (rgb.r << 16) + (rgb.g << 8) + rgb.b;
                        handleUpdateTagColor(tag.name, newArgb);
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-block',
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: isSelected ? '#fff' : displayColor,
                          cursor: 'pointer',
                          marginRight: 4,
                        }}
                      />
                    </ColorPicker>
                    {tag.name}
                  </span>
                </Tag>
              );
            })}
            <Button
              size="small"
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => {
                Modal.confirm({
                  title: intl.formatMessage({ id: 'pages.addressBook.addTag', defaultMessage: 'Add Tag' }),
                  content: (
                    <Form
                      onFinish={(values) => {
                        handleAddTag(values.name);
                        Modal.destroyAll();
                      }}
                    >
                      <Form.Item
                        name="name"
                        rules={[{ required: true }]}
                      >
                        <Input
                          placeholder={intl.formatMessage({
                            id: 'pages.addressBook.tagName',
                            defaultMessage: 'Tag Name',
                          })}
                        />
                      </Form.Item>
                    </Form>
                  ),
                  onOk: () => {},
                });
              }}
            />
            {selectedTags.length > 1 && (
              <Radio.Group
                size="small"
                value={tagMode}
                onChange={(e) => {
                  setTagMode(e.target.value);
                  deviceTableActionRef.current?.reload();
                }}
                optionType="button"
                buttonStyle="solid"
              >
                <Radio.Button value="union">
                  <FormattedMessage id="pages.addressBook.tagModeUnion" defaultMessage="Any" />
                </Radio.Button>
                <Radio.Button value="intersection">
                  <FormattedMessage id="pages.addressBook.tagModeIntersection" defaultMessage="All" />
                </Radio.Button>
              </Radio.Group>
            )}
          </div>
        </Card>

        <DetailTable
          personal={false}
          profile={selectedAddressBook}
          abTags={abTags}
          deviceTableActionRef={deviceTableActionRef}
          selectedTags={selectedTags}
          intersection={tagMode === 'intersection'}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ProTable<API.SharedAddressBook>
        headerTitle={
          <FormattedMessage id="pages.addressBook.shared" defaultMessage="Shared Address Books" />
        }
        actionRef={actionRef}
        rowKey="guid"
        request={async (params) => {
          const result = await getSharedAddressBooks({
            pageSize: params.pageSize || 10,
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
        toolBarRender={() => [
          <Button key="create" type="primary" onClick={() => setCreateModalVisible(true)}>
            <FormattedMessage id="pages.addressBook.create" defaultMessage="Create Address Book" />
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
            >
              <Button danger>
                <FormattedMessage id="pages.common.batchDelete" defaultMessage="Batch Delete" />
              </Button>
            </Popconfirm>
          ),
        ]}
      />

      <Modal
        title={
          <FormattedMessage id="pages.addressBook.create" defaultMessage="Create Address Book" />
        }
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={() => createForm.submit()}
      >
        <Form form={createForm} onFinish={handleCreate}>
          <Form.Item
            name="name"
            label={<FormattedMessage id="pages.addressBook.name" defaultMessage="Name" />}
            rules={[{ required: true, message: intl.formatMessage({ id: 'pages.common.pleaseEnterName', defaultMessage: 'Please enter name' }) }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="note" label={<FormattedMessage id="pages.addressBook.note" defaultMessage="Note" />}>
            <Input.TextArea />
          </Form.Item>
          <Form.Item name="password" label={<FormattedMessage id="pages.users.password" defaultMessage="Password" />}>
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <FormattedMessage id="pages.addressBook.edit" defaultMessage="Edit Address Book" />
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
            label={<FormattedMessage id="pages.addressBook.name" defaultMessage="Name" />}
            rules={[{ required: true, message: intl.formatMessage({ id: 'pages.common.pleaseEnterName', defaultMessage: 'Please enter name' }) }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="note" label={<FormattedMessage id="pages.addressBook.note" defaultMessage="Note" />}>
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default SharedAddressBook;
