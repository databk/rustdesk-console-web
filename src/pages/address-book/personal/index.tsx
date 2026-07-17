import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import {
  Alert,
  App,
  Button,
  ColorPicker,
  Divider,
  Form,
  Input,
  Modal,
  Popconfirm,
  Radio,
  Select,
  Space,
  Tag,
  Table,
  Tooltip,
  Typography,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  SelectOutlined,
  WindowsFilled,
  AndroidFilled,
  AppleFilled,
  QqCircleFilled,
} from '@ant-design/icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Settings from '../../../../config/defaultSettings';
import {
  getPersonalAddressBook,
  getCustomAddressBooks,
  addCustomAddressBook,
  updateCustomAddressBook,
  deleteCustomAddressBooks,
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
import DeviceSelectTable from '@/components/DeviceSelectTable';

const { Text } = Typography;

const argbToHex = (color: number | undefined): string => {
  if (!color) return '#1677ff';
  return `#${color.toString(16).padStart(8, '0').slice(-6)}`;
};

const getOSIcon = (os: string): React.ReactNode => {
  const osLower = (os || '').toLowerCase();

  if (osLower.includes('windows')) {
    return <WindowsFilled />;
  }
  if (osLower.includes('android')) {
    return <AndroidFilled />;
  }
  if (
    osLower.includes('macos') ||
    osLower.includes('ios') ||
    osLower.includes('mac')
  ) {
    return <AppleFilled />;
  }
  if (osLower.includes('linux')) {
    return <QqCircleFilled />;
  }

  return null;
};

export interface PersonalAddressBookProps {
  guid?: string;
  title?: string;
  onBack?: () => void;
  canWrite?: boolean;
}

const PersonalAddressBook: React.FC<PersonalAddressBookProps> = ({
  guid: propGuid,
  title: propTitle,
  onBack,
  canWrite = true,
}) => {
  const intl = useIntl();
  const { message: msgApi, modal } = App.useApp();
  const actionRef = useRef<ActionType>(null);

  const [addPeerModalVisible, setAddPeerModalVisible] = useState(false);
  const [editPeerModalVisible, setEditPeerModalVisible] = useState(false);
  const [addTagModalVisible, setAddTagModalVisible] = useState(false);
  const [tagManagementVisible, setTagManagementVisible] = useState(false);
  const [importDevicesModalVisible, setImportDevicesModalVisible] =
    useState(false);
  const [selectedDeviceKeys, setSelectedDeviceKeys] = useState<React.Key[]>([]);
  const [importing, setImporting] = useState(false);

  const [addPeerForm] = Form.useForm();
  const [editPeerForm] = Form.useForm();
  const [addTagForm] = Form.useForm();
  const [renameTagForm] = Form.useForm();
  const [addressBookForm] = Form.useForm();

  const [addPeerError, setAddPeerError] = useState('');
  const [editPeerError, setEditPeerError] = useState('');
  const [editingPeer, setEditingPeer] = useState<API.PeerItem | null>(null);

  const [abGuid, setAbGuid] = useState<string | undefined>(propGuid);
  const [abLoading, setAbLoading] = useState(!propGuid);
  const [addressBooks, setAddressBooks] = useState<API.AddressBookProfile[]>(
    [],
  );
  const [defaultAbGuid, setDefaultAbGuid] = useState<string>();
  const [addressBookModalMode, setAddressBookModalMode] = useState<
    'create' | 'edit' | null
  >(null);
  const [addressBookSaving, setAddressBookSaving] = useState(false);
  const [tags, setTags] = useState<API.TagItem[]>([]);
  const [pendingColorUpdates, setPendingColorUpdates] = useState<
    Record<string, number>
  >({});
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagMode, setTagMode] = useState<'union' | 'intersection'>('union');
  const [hoveredColorDot, setHoveredColorDot] = useState<string | null>(null);
  const colorPickerCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const tagLoadIdRef = useRef(0);

  const loadAddressBooks = useCallback(
    async (preferredGuid?: string) => {
      setAbLoading(true);
      try {
        const [personal, custom] = await Promise.all([
          getPersonalAddressBook(),
          getCustomAddressBooks({ current: 1, pageSize: 100 }),
        ]);
        const profiles: API.AddressBookProfile[] = [
          {
            guid: personal.guid,
            name: intl.formatMessage({
              id: 'pages.addressBook.myAddressBook',
              defaultMessage: 'My address book',
            }),
            is_personal: true,
          },
          ...(custom.data || []),
        ];
        setAddressBooks(profiles);
        setDefaultAbGuid(personal.guid);
        setAbGuid((currentGuid) => {
          const nextGuid = preferredGuid || currentGuid;
          return profiles.some((profile) => profile.guid === nextGuid)
            ? nextGuid
            : personal.guid;
        });
      } catch (error) {
        console.error('Failed to fetch address books:', error);
        msgApi.error(
          intl.formatMessage({
            id: 'pages.addressBook.loadFailed',
            defaultMessage: 'Failed to load address books',
          }),
        );
      } finally {
        setAbLoading(false);
      }
    },
    [intl, msgApi],
  );

  useEffect(() => {
    if (propGuid) {
      setAbGuid(propGuid);
      setAbLoading(false);
      return;
    }
    void loadAddressBooks();
  }, [loadAddressBooks, propGuid]);

  const fetchTags = useCallback(async () => {
    if (!abGuid) return;
    const loadId = ++tagLoadIdRef.current;
    try {
      const result = await getTags(abGuid);
      if (loadId === tagLoadIdRef.current) {
        setTags(result || []);
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error);
      if (loadId === tagLoadIdRef.current) {
        setTags([]);
      }
    }
  }, [abGuid]);

  useEffect(() => {
    if (abGuid) {
      void fetchTags();
    }
    return () => {
      tagLoadIdRef.current += 1;
    };
  }, [abGuid, fetchTags]);

  useEffect(() => {
    if (abGuid) {
      actionRef.current?.reload();
    }
  }, [abGuid]);

  useEffect(() => {
    if (addPeerModalVisible) {
      setAddPeerError('');
      addPeerForm.resetFields();
    }
  }, [addPeerModalVisible, addPeerForm]);

  const currentAddressBook = addressBooks.find(
    (profile) => profile.guid === abGuid,
  );
  const isDefaultAddressBook = !abGuid || abGuid === defaultAbGuid;

  const selectAddressBook = (guid: string) => {
    tagLoadIdRef.current += 1;
    setTags([]);
    setSelectedTags([]);
    setPendingColorUpdates({});
    setTagMode('union');
    setSelectedDeviceKeys([]);
    setAbGuid(guid);
  };

  const openCreateAddressBook = () => {
    addressBookForm.resetFields();
    setAddressBookModalMode('create');
  };

  const openEditAddressBook = () => {
    if (!currentAddressBook || isDefaultAddressBook) return;
    addressBookForm.setFieldsValue({
      name: currentAddressBook.name,
      note: currentAddressBook.note || '',
    });
    setAddressBookModalMode('edit');
  };

  const handleAddressBookSubmit = async (values: {
    name: string;
    note?: string;
  }) => {
    setAddressBookSaving(true);
    try {
      if (addressBookModalMode === 'create') {
        const created = await addCustomAddressBook(values);
        await loadAddressBooks(created.guid);
        msgApi.success(
          intl.formatMessage({
            id: 'pages.addressBook.createSuccess',
            defaultMessage: 'Address book created',
          }),
        );
      } else if (abGuid) {
        await updateCustomAddressBook({ guid: abGuid, ...values });
        await loadAddressBooks(abGuid);
        msgApi.success(
          intl.formatMessage({
            id: 'pages.addressBook.updateSuccess',
            defaultMessage: 'Address book updated',
          }),
        );
      }
      setAddressBookModalMode(null);
      addressBookForm.resetFields();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id:
            addressBookModalMode === 'create'
              ? 'pages.addressBook.createFailed'
              : 'pages.addressBook.updateFailed',
          defaultMessage:
            addressBookModalMode === 'create'
              ? 'Failed to create address book'
              : 'Failed to update address book',
        }),
      );
    } finally {
      setAddressBookSaving(false);
    }
  };

  const handleDeleteAddressBook = async () => {
    if (!abGuid || isDefaultAddressBook) return;
    setAddressBookSaving(true);
    try {
      await deleteCustomAddressBooks([abGuid]);
      await loadAddressBooks(defaultAbGuid);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.addressBook.deleteSuccess',
          defaultMessage: 'Address book deleted',
        }),
      );
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.addressBook.deleteFailed',
          defaultMessage: 'Failed to delete address book',
        }),
      );
    } finally {
      setAddressBookSaving(false);
    }
  };

  const confirmDeleteAddressBook = () => {
    modal.confirm({
      title: intl.formatMessage({
        id: 'pages.addressBook.deleteConfirm',
        defaultMessage: 'Are you sure to delete this address book?',
      }),
      okText: intl.formatMessage({
        id: 'pages.common.confirm',
        defaultMessage: 'Yes',
      }),
      cancelText: intl.formatMessage({
        id: 'pages.common.cancel',
        defaultMessage: 'No',
      }),
      okButtonProps: { danger: true },
      onOk: handleDeleteAddressBook,
    });
  };

  const handleAddPeer = async (values: API.AddPeerParams) => {
    if (!abGuid) return;
    setAddPeerError('');
    try {
      await addPeer(abGuid, values);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.addressBook.peerAdded',
          defaultMessage: 'Peer added',
        }),
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
        intl.formatMessage({
          id: 'pages.addressBook.peerUpdated',
          defaultMessage: 'Peer updated',
        }),
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

  const handleDeletePeer = async (id: string) => {
    if (!abGuid) return;
    try {
      await deletePeer(abGuid, [id]);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.addressBook.peerDeleted',
          defaultMessage: 'Peer deleted',
        }),
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
        tagData.color = 0xff000000 + (rgb.r << 16) + (rgb.g << 8) + rgb.b;
      }

      await addTag(abGuid, tagData);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.addressBook.tagAdded',
          defaultMessage: 'Tag added',
        }),
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
        intl.formatMessage({
          id: 'pages.addressBook.tagRenamed',
          defaultMessage: 'Tag renamed',
        }),
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
      setTags((prev) =>
        prev.map((tag) => (tag.name === tagName ? { ...tag, color } : tag)),
      );
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

  const handleDeleteTag = async (tagName: string) => {
    if (!abGuid) return;
    try {
      await deleteTag(abGuid, [tagName]);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.addressBook.tagDeleted',
          defaultMessage: 'Tag deleted',
        }),
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
          {
            id: 'pages.addressBook.importSuccess',
            defaultMessage: 'Successfully imported {count} device(s)',
          },
          { count: successCount },
        ),
      );
      actionRef.current?.reload();
    }
    if (failCount > 0) {
      msgApi.warning(
        intl.formatMessage(
          {
            id: 'pages.addressBook.importPartialFailed',
            defaultMessage: '{count} device(s) failed to import',
          },
          { count: failCount },
        ),
      );
    }
  };

  const columns: ProColumns<API.PeerItem>[] = [
    {
      title: (
        <FormattedMessage
          id="pages.addressBook.rustDeskId"
          defaultMessage="RustDesk ID"
        />
      ),
      dataIndex: 'id',
      width: '15%',
      ellipsis: true,
      sorter: true,
      render: (_: unknown, record: API.PeerItem) => {
        const peerRecord = record as API.PeerItem & { platform?: string };
        const platformParts = (peerRecord.platform || '').split(' / ');
        const osIcon = getOSIcon(peerRecord.platform || '');
        const osTooltip = platformParts[1] || platformParts[0] || '';

        return (
          <span>
            {osIcon && osTooltip && (
              <Tooltip
                title={osTooltip}
                styles={{
                  root: {
                    maxWidth: 'none',
                  },
                }}
                overlayStyle={{
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{osIcon}</span>
              </Tooltip>
            )}
            {osIcon && <>&nbsp;&nbsp;</>}
            {record.id}
          </span>
        );
      },
    },
    {
      title: (
        <span>
          <FormattedMessage
            id="pages.addressBook.device"
            defaultMessage="Device"
          />
          <Tooltip
            title={intl.formatMessage({
              id: 'pages.addressBook.deviceInfo',
              defaultMessage: 'username@device_name',
            })}
          >
            <InfoCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </span>
      ),
      dataIndex: 'hostname',
      width: 150,
      ellipsis: true,
      search: false,
      sorter: true,
      render: (_: unknown, record: API.PeerItem) => {
        const username = (record as API.PeerItem & { username?: string })
          .username;
        const hostname = record.hostname;
        if (username && hostname) return `${username}@${hostname}`;
        return hostname || username || '-';
      },
    },
    {
      title: (
        <FormattedMessage id="pages.addressBook.alias" defaultMessage="Alias" />
      ),
      dataIndex: 'alias',
      width: 150,
      ellipsis: true,
      search: false,
      sorter: true,
      render: (_: unknown, record: API.PeerItem) =>
        (record as API.PeerItem & { alias?: string }).alias || '-',
    },
    {
      title: (
        <FormattedMessage id="pages.addressBook.tags" defaultMessage="Tags" />
      ),
      dataIndex: 'tags',
      width: 200,
      search: false,
      render: (_: unknown, record: API.PeerItem) => {
        const peerTags = record.tags || [];
        if (peerTags.length === 0) return '-';
        return (
          <Space size={[0, 4]} wrap>
            {peerTags.map((tag: string) => {
              const tagInfo = (tags as API.TagItem[]).find(
                (t: API.TagItem) => t.name === tag,
              );
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
      dataIndex: 'note',
      width: 150,
      ellipsis: true,
      search: false,
      sorter: true,
      render: (_: unknown, record: API.PeerItem) => record.note || '-',
    },
    {
      title: (
        <FormattedMessage id="pages.common.action" defaultMessage="Action" />
      ),
      valueType: 'option',
      width: 160,
      fixed: 'right',
      render: (_: unknown, record: API.PeerItem) => (
        <Space size={0} split={<Divider type="vertical" />}>
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

  const tagColumns = [
    {
      title: intl.formatMessage({
        id: 'pages.addressBook.tagName',
        defaultMessage: 'Tag Name',
      }),
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
      title: intl.formatMessage({
        id: 'pages.addressBook.color',
        defaultMessage: 'Color',
      }),
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
              const newArgb = 0xff000000 + (rgb.r << 16) + (rgb.g << 8) + rgb.b;
              setPendingColorUpdates((prev) => ({
                ...prev,
                [record.name]: newArgb,
              }));
              handleUpdateTagColor(record.name, newArgb);
            }}
          />
        );
      },
    },
    {
      title: intl.formatMessage({
        id: 'pages.common.action',
        defaultMessage: 'Action',
      }),
      key: 'action',
      width: 180,
      render: (_: unknown, record: API.TagItem) => (
        <Space size={0} split={<Divider type="vertical" />}>
          <Button
            type="link"
            size="small"
            onClick={() => {
              modal.confirm({
                title: intl.formatMessage({
                  id: 'pages.addressBook.renameTag',
                  defaultMessage: 'Rename Tag',
                }),
                content: (
                  <Form
                    form={renameTagForm}
                    initialValues={{ old: record.name, new: '' }}
                  >
                    <Form.Item name="old" hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item
                      name="new"
                      label={intl.formatMessage({
                        id: 'pages.addressBook.newTagName',
                        defaultMessage: 'New Tag Name',
                      })}
                      rules={[{ required: true }]}
                    >
                      <Input />
                    </Form.Item>
                  </Form>
                ),
                onOk: () =>
                  renameTagForm.validateFields().then(handleRenameTag),
              });
            }}
          >
            <FormattedMessage
              id="pages.common.rename"
              defaultMessage="Rename"
            />
          </Button>
          <Popconfirm
            title={
              <FormattedMessage
                id="pages.addressBook.deleteTagConfirm"
                defaultMessage="Are you sure to delete this tag?"
              />
            }
            onConfirm={() => handleDeleteTag(record.name)}
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
    <>
      {propTitle && (
        <Helmet>
          <title>
            {propTitle}
            {Settings.title && ` - ${Settings.title}`}
          </title>
        </Helmet>
      )}
      <PageContainer title={propTitle} onBack={onBack}>
        {!propGuid && (
          <div
            style={{
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <Text strong>
              <FormattedMessage
                id="pages.addressBook.currentAddressBook"
                defaultMessage="Address book"
              />
            </Text>
            <Select
              aria-label={intl.formatMessage({
                id: 'pages.addressBook.currentAddressBook',
                defaultMessage: 'Address book',
              })}
              value={abGuid}
              loading={abLoading}
              showSearch
              optionFilterProp="label"
              options={addressBooks.map((profile) => ({
                value: profile.guid,
                label: profile.name,
              }))}
              onChange={selectAddressBook}
              style={{ width: 280, maxWidth: '100%' }}
            />
            <Tooltip
              title={intl.formatMessage({
                id: 'pages.addressBook.create',
                defaultMessage: 'Create address book',
              })}
            >
              <Button
                aria-label={intl.formatMessage({
                  id: 'pages.addressBook.create',
                  defaultMessage: 'Create address book',
                })}
                type="text"
                icon={<PlusOutlined />}
                disabled={addressBookSaving}
                onClick={openCreateAddressBook}
                style={{ width: 32 }}
              />
            </Tooltip>
            <Tooltip
              title={intl.formatMessage({
                id: 'pages.addressBook.edit',
                defaultMessage: 'Edit address book',
              })}
            >
              <span style={{ display: 'inline-flex' }}>
                <Button
                  aria-label={intl.formatMessage({
                    id: 'pages.addressBook.edit',
                    defaultMessage: 'Edit address book',
                  })}
                  type="text"
                  icon={<EditOutlined />}
                  disabled={isDefaultAddressBook || addressBookSaving}
                  onClick={openEditAddressBook}
                  style={{ width: 32 }}
                />
              </span>
            </Tooltip>
            <Tooltip
              title={intl.formatMessage({
                id: 'pages.common.delete',
                defaultMessage: 'Delete',
              })}
            >
              <span style={{ display: 'inline-flex' }}>
                <Button
                  aria-label={intl.formatMessage({
                    id: 'pages.common.delete',
                    defaultMessage: 'Delete',
                  })}
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  disabled={isDefaultAddressBook || addressBookSaving}
                  onClick={confirmDeleteAddressBook}
                  style={{ width: 32 }}
                />
              </span>
            </Tooltip>
          </div>
        )}

        {/* Tags Area */}
        <div
          style={{
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <span style={{ fontWeight: 500, marginRight: 4 }}>
            <FormattedMessage
              id="pages.addressBook.tags"
              defaultMessage="Tags"
            />
          </span>
          <Tag
            style={{ cursor: 'pointer', padding: '2px 8px' }}
            color={selectedTags.length === 0 ? 'blue' : undefined}
            onClick={() => {
              setSelectedTags([]);
              actionRef.current?.reload();
            }}
          >
            <FormattedMessage
              id="pages.addressBook.untagged"
              defaultMessage="Untagged"
            />
          </Tag>
          {(tags as API.TagItem[]).map((tag: API.TagItem) => {
            const displayColor = argbToHex(
              pendingColorUpdates[tag.name] ?? tag.color,
            );
            const isSelected = selectedTags.includes(tag.name);
            return (
              <Tag
                key={tag.name}
                color={isSelected ? displayColor : undefined}
                style={{
                  cursor: 'pointer',
                  padding: '2px 8px',
                  paddingLeft: 0,
                }}
                closable={canWrite}
                closeIcon={
                  <Popconfirm
                    title={
                      <FormattedMessage
                        id="pages.addressBook.deleteTagConfirm"
                        defaultMessage="Are you sure to delete this tag?"
                      />
                    }
                    okText={intl.formatMessage({
                      id: 'pages.common.confirm',
                      defaultMessage: 'Yes',
                    })}
                    cancelText={intl.formatMessage({
                      id: 'pages.common.cancel',
                      defaultMessage: 'No',
                    })}
                    onConfirm={(e) => {
                      e?.stopPropagation();
                      handleDeleteTag(tag.name);
                    }}
                    onCancel={(e) => {
                      e?.stopPropagation();
                    }}
                  >
                    <span
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        marginLeft: 4,
                        cursor: 'pointer',
                        color: isSelected ? '#fff' : undefined,
                      }}
                    >
                      ×
                    </span>
                  </Popconfirm>
                }
                onClose={(e) => {
                  e.preventDefault();
                }}
                onClick={() => {
                  setSelectedTags((prev) =>
                    isSelected
                      ? prev.filter((t) => t !== tag.name)
                      : [...prev, tag.name],
                  );
                  actionRef.current?.reload();
                }}
              >
                <span
                  style={{
                    paddingLeft: 6,
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  <ColorPicker
                    disabled={!canWrite}
                    disabledAlpha
                    value={displayColor}
                    open={canWrite && hoveredColorDot === tag.name}
                    onOpenChange={(open) => {
                      if (!open) {
                        setHoveredColorDot(null);
                      }
                    }}
                    onChange={(colorValue) => {
                      const rgb = colorValue.toRgb();
                      const newArgb =
                        0xff000000 + (rgb.r << 16) + (rgb.g << 8) + rgb.b;
                      setPendingColorUpdates((prev) => ({
                        ...prev,
                        [tag.name]: newArgb,
                      }));
                    }}
                    onChangeComplete={(colorValue) => {
                      const rgb = colorValue.toRgb();
                      const newArgb =
                        0xff000000 + (rgb.r << 16) + (rgb.g << 8) + rgb.b;
                      handleUpdateTagColor(tag.name, newArgb);
                    }}
                    panelRender={(panel) => (
                      <div
                        onMouseEnter={() => {
                          if (colorPickerCloseTimerRef.current) {
                            clearTimeout(colorPickerCloseTimerRef.current);
                            colorPickerCloseTimerRef.current = null;
                          }
                        }}
                        onMouseLeave={() => {
                          colorPickerCloseTimerRef.current = setTimeout(() => {
                            setHoveredColorDot(null);
                          }, 100);
                        }}
                      >
                        {panel}
                      </div>
                    )}
                  >
                    <span
                      onMouseEnter={() => {
                        if (!canWrite) return;
                        if (colorPickerCloseTimerRef.current) {
                          clearTimeout(colorPickerCloseTimerRef.current);
                          colorPickerCloseTimerRef.current = null;
                        }
                        setHoveredColorDot(tag.name);
                      }}
                      onMouseLeave={() => {
                        if (!canWrite) return;
                        colorPickerCloseTimerRef.current = setTimeout(() => {
                          setHoveredColorDot(null);
                        }, 100);
                      }}
                      style={{
                        display: 'inline-block',
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: isSelected ? '#fff' : displayColor,
                        cursor: canWrite ? 'pointer' : 'default',
                      }}
                    />
                  </ColorPicker>
                  <span style={{ display: 'inline-block', width: 8 }} />
                </span>
                {tag.name}
              </Tag>
            );
          })}
          {canWrite && (
            <Button
              size="small"
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => setAddTagModalVisible(true)}
            />
          )}
          {selectedTags.length > 1 && (
            <Radio.Group
              size="small"
              value={tagMode}
              onChange={(e) => {
                setTagMode(e.target.value);
                actionRef.current?.reload();
              }}
              optionType="button"
              buttonStyle="solid"
            >
              <Radio.Button value="union">
                <FormattedMessage
                  id="pages.addressBook.tagModeUnion"
                  defaultMessage="Any"
                />
              </Radio.Button>
              <Radio.Button value="intersection">
                <FormattedMessage
                  id="pages.addressBook.tagModeIntersection"
                  defaultMessage="All"
                />
              </Radio.Button>
            </Radio.Group>
          )}
        </div>

        <ProTable<API.PeerItem>
          key={abGuid || 'loading'}
          headerTitle={
            propTitle ||
            currentAddressBook?.name || (
              <FormattedMessage
                id="pages.addressBook.personal"
                defaultMessage="Personal Address Book"
              />
            )
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
              tags: selectedTags.length > 0 ? selectedTags : undefined,
              tagMode: selectedTags.length > 1 ? tagMode : undefined,
            });
            return {
              data: result.data || [],
              total: result.total || 0,
              success: true,
            };
          }}
          columns={
            canWrite
              ? columns
              : columns.filter((column) => column.valueType !== 'option')
          }
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
          toolBarRender={() =>
            canWrite
              ? [
                  <Button
                    key="import"
                    type="primary"
                    icon={<SelectOutlined />}
                    onClick={() => setImportDevicesModalVisible(true)}
                  >
                    <FormattedMessage
                      id="pages.addressBook.import"
                      defaultMessage="Import from devices"
                    />
                  </Button>,
                  <Button
                    key="add"
                    icon={<PlusOutlined />}
                    onClick={() => setAddPeerModalVisible(true)}
                  >
                    <FormattedMessage
                      id="pages.addressBook.addPeer"
                      defaultMessage="Add by RustDesk ID"
                    />
                  </Button>,
                  <Button key="recycle" icon={<DeleteOutlined />}>
                    <FormattedMessage
                      id="pages.addressBook.recycleBin"
                      defaultMessage="Recycle Bin"
                    />
                  </Button>,
                ]
              : []
          }
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
          title={
            addressBookModalMode === 'create' ? (
              <FormattedMessage
                id="pages.addressBook.create"
                defaultMessage="Create Address Book"
              />
            ) : (
              <FormattedMessage
                id="pages.addressBook.edit"
                defaultMessage="Edit Address Book"
              />
            )
          }
          open={addressBookModalMode !== null}
          confirmLoading={addressBookSaving}
          onCancel={() => {
            setAddressBookModalMode(null);
            addressBookForm.resetFields();
          }}
          onOk={() => addressBookForm.submit()}
        >
          <Form
            form={addressBookForm}
            layout="vertical"
            onFinish={handleAddressBookSubmit}
          >
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
                  whitespace: true,
                  message: intl.formatMessage({
                    id: 'pages.common.pleaseEnterName',
                    defaultMessage: 'Please enter name',
                  }),
                },
              ]}
            >
              <Input maxLength={255} />
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
              <Input.TextArea maxLength={2000} rows={3} />
            </Form.Item>
          </Form>
        </Modal>

        {/* Add Peer Modal */}
        <Modal
          title={
            <FormattedMessage
              id="pages.addressBook.addPeer"
              defaultMessage="Add by RustDesk ID"
            />
          }
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
              name="id"
              label={
                <FormattedMessage
                  id="pages.addressBook.rustDeskId"
                  defaultMessage="RustDesk ID"
                />
              }
              rules={[
                {
                  required: true,
                  message: intl.formatMessage({
                    id: 'pages.addressBook.pleaseEnterRustDeskId',
                    defaultMessage: 'Please enter RustDesk ID',
                  }),
                },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="alias"
              label={
                <FormattedMessage
                  id="pages.addressBook.alias"
                  defaultMessage="Alias"
                />
              }
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
              name="tags"
              label={
                <FormattedMessage
                  id="pages.addressBook.tags"
                  defaultMessage="Tags"
                />
              }
            >
              <Select
                mode="multiple"
                placeholder={intl.formatMessage({
                  id: 'pages.addressBook.selectTags',
                  defaultMessage: 'Select tags',
                })}
                options={(tags as API.TagItem[]).map((tag) => ({
                  label: tag.name,
                  value: tag.name,
                }))}
              />
            </Form.Item>
          </Form>
        </Modal>

        {/* Edit Peer Modal */}
        <Modal
          title={
            <FormattedMessage id="pages.common.edit" defaultMessage="Edit" />
          }
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
          <Form
            form={editPeerForm}
            onFinish={handleUpdatePeer}
            layout="vertical"
          >
            <Form.Item
              name="id"
              label={
                <FormattedMessage
                  id="pages.addressBook.rustDeskId"
                  defaultMessage="RustDesk ID"
                />
              }
            >
              <Text>{editingPeer?.id}</Text>
            </Form.Item>
            <Form.Item
              name="alias"
              label={
                <FormattedMessage
                  id="pages.addressBook.alias"
                  defaultMessage="Alias"
                />
              }
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
              name="tags"
              label={
                <FormattedMessage
                  id="pages.addressBook.tags"
                  defaultMessage="Tags"
                />
              }
            >
              <Select
                mode="multiple"
                placeholder={intl.formatMessage({
                  id: 'pages.addressBook.selectTags',
                  defaultMessage: 'Select tags',
                })}
                options={(tags as API.TagItem[]).map((tag) => ({
                  label: tag.name,
                  value: tag.name,
                }))}
              />
            </Form.Item>
          </Form>
        </Modal>

        {/* Add Tag Modal */}
        <Modal
          title={
            <FormattedMessage
              id="pages.addressBook.addTag"
              defaultMessage="Add Tag"
            />
          }
          open={addTagModalVisible}
          onCancel={() => setAddTagModalVisible(false)}
          onOk={() => addTagForm.submit()}
        >
          <Form form={addTagForm} onFinish={handleAddTag} layout="vertical">
            <Form.Item
              name="name"
              label={
                <FormattedMessage
                  id="pages.addressBook.tagName"
                  defaultMessage="Tag Name"
                />
              }
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
              label={
                <FormattedMessage
                  id="pages.addressBook.color"
                  defaultMessage="Color"
                />
              }
            >
              <ColorPicker disabledAlpha />
            </Form.Item>
          </Form>
        </Modal>

        {/* Tag Management Modal */}
        <Modal
          title={
            <FormattedMessage
              id="pages.addressBook.manageTags"
              defaultMessage="Manage Tags"
            />
          }
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

        {/* Import Devices Modal */}
        <Modal
          title={
            <FormattedMessage
              id="pages.addressBook.importDevices"
              defaultMessage="Import Devices"
            />
          }
          open={importDevicesModalVisible}
          onCancel={() => {
            setImportDevicesModalVisible(false);
            setSelectedDeviceKeys([]);
          }}
          onOk={handleImportDevices}
          okButtonProps={{
            loading: importing,
            disabled: selectedDeviceKeys.length === 0,
          }}
          width={1000}
        >
          <DeviceSelectTable
            selectedRowKeys={selectedDeviceKeys}
            onSelectionChange={setSelectedDeviceKeys}
            defaultSearchCollapsed={false}
          />
        </Modal>
      </PageContainer>
    </>
  );
};

export default PersonalAddressBook;
