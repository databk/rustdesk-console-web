import type { ActionType } from '@ant-design/pro-components';
import { PageContainer } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { App, Form } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Settings from '../../../../config/defaultSettings';
import {
  getPersonalAddressBook,
  getAllCustomAddressBooks,
  addCustomAddressBook,
  updateCustomAddressBook,
  deleteCustomAddressBooks,
  addPeer,
  updatePeer,
  deletePeer,
  getTags,
  addTag,
  renameTag,
  updateTagColor,
  deleteTag,
} from '@/services/rustdesk-console/addressBook';
import type { PersonalAddressBookProps } from './types';
import { rgbToArgb } from './utils';
import AddressBookSelector from './components/AddressBookSelector';
import AddressBookModal from './components/AddressBookModal';
import AddPeerModal from './components/AddPeerModal';
import EditPeerModal from './components/EditPeerModal';
import AddTagModal from './components/AddTagModal';
import TagManagementModal from './components/TagManagementModal';
import ImportDevicesModal from './components/ImportDevicesModal';
import TagFilterBar from './components/TagFilterBar';
import PeerTable from './components/PeerTable';
import { usePeerColumns } from './components/PeerColumns';
import { useTagColumns } from './components/TagColumns';

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

  const [addPeerForm] = Form.useForm<API.AddPeerParams>();
  const [editPeerForm] = Form.useForm<API.UpdatePeerParams>();
  const [addTagForm] = Form.useForm();
  const [renameTagForm] = Form.useForm<API.RenameTagParams>();
  const [addressBookForm] = Form.useForm<{ name: string; note?: string }>();

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
        const [personal, customProfiles] = await Promise.all([
          getPersonalAddressBook(),
          getAllCustomAddressBooks(),
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
          ...customProfiles,
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
        const createdGuid = (created as { guid?: string } | null)?.guid;
        if (!createdGuid) {
          throw new Error('Missing guid in addCustomAddressBook response');
        }
        await loadAddressBooks(createdGuid);
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
        tagData.color = rgbToArgb(values.color.toRgb());
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

  const columns = usePeerColumns({
    tags,
    onEditPeer: handleEditPeer,
    onDeletePeer: handleDeletePeer,
  });

  const tagColumns = useTagColumns({
    pendingColorUpdates,
    renameTagForm,
    modal,
    onUpdateTagColor: handleUpdateTagColor,
    onRenameTag: handleRenameTag,
    onDeleteTag: handleDeleteTag,
  });

  const headerTitle =
    propTitle ||
    currentAddressBook?.name || (
      <FormattedMessage
        id="pages.addressBook.personal"
        defaultMessage="Personal Address Book"
      />
    );

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
          <AddressBookSelector
            abGuid={abGuid}
            abLoading={abLoading}
            addressBooks={addressBooks}
            addressBookSaving={addressBookSaving}
            isDefaultAddressBook={isDefaultAddressBook}
            onSelectAddressBook={selectAddressBook}
            onOpenCreate={openCreateAddressBook}
            onOpenEdit={openEditAddressBook}
            onConfirmDelete={confirmDeleteAddressBook}
          />
        )}

        <TagFilterBar
          tags={tags}
          selectedTags={selectedTags}
          tagMode={tagMode}
          pendingColorUpdates={pendingColorUpdates}
          hoveredColorDot={hoveredColorDot}
          canWrite={canWrite}
          colorPickerCloseTimerRef={colorPickerCloseTimerRef}
          onSelectTags={setSelectedTags}
          onSetTagMode={(mode) => {
            setTagMode(mode);
            actionRef.current?.reload();
          }}
          onSetHoveredColorDot={setHoveredColorDot}
          onUpdatePendingColor={(tagName, color) => {
            setPendingColorUpdates((prev) => ({
              ...prev,
              [tagName]: color,
            }));
          }}
          onUpdateTagColor={handleUpdateTagColor}
          onDeleteTag={handleDeleteTag}
          onOpenAddTag={() => setAddTagModalVisible(true)}
          onClearTags={() => {
            setSelectedTags([]);
            actionRef.current?.reload();
          }}
        />

        <PeerTable
          abGuid={abGuid}
          abLoading={abLoading}
          columns={columns}
          selectedTags={selectedTags}
          tagMode={tagMode}
          canWrite={canWrite}
          headerTitle={headerTitle}
          actionRef={actionRef}
          onOpenImport={() => setImportDevicesModalVisible(true)}
          onOpenAddPeer={() => setAddPeerModalVisible(true)}
        />

        <AddressBookModal
          mode={addressBookModalMode}
          saving={addressBookSaving}
          form={addressBookForm}
          onSubmit={handleAddressBookSubmit}
          onCancel={() => {
            setAddressBookModalMode(null);
            addressBookForm.resetFields();
          }}
        />

        <AddPeerModal
          visible={addPeerModalVisible}
          error={addPeerError}
          tags={tags}
          form={addPeerForm}
          onSubmit={handleAddPeer}
          onCancel={() => setAddPeerModalVisible(false)}
        />

        <EditPeerModal
          visible={editPeerModalVisible}
          error={editPeerError}
          editingPeer={editingPeer}
          tags={tags}
          form={editPeerForm}
          onSubmit={handleUpdatePeer}
          onCancel={() => {
            setEditPeerModalVisible(false);
            setEditingPeer(null);
            editPeerForm.resetFields();
          }}
        />

        <AddTagModal
          visible={addTagModalVisible}
          form={addTagForm}
          onSubmit={handleAddTag}
          onCancel={() => setAddTagModalVisible(false)}
        />

        <TagManagementModal
          visible={tagManagementVisible}
          tags={tags}
          columns={tagColumns}
          onCancel={() => setTagManagementVisible(false)}
        />

        <ImportDevicesModal
          visible={importDevicesModalVisible}
          importing={importing}
          selectedDeviceKeys={selectedDeviceKeys}
          onSelectionChange={setSelectedDeviceKeys}
          onOk={handleImportDevices}
          onCancel={() => {
            setImportDevicesModalVisible(false);
            setSelectedDeviceKeys([]);
          }}
        />
      </PageContainer>
    </>
  );
};

export default PersonalAddressBook;
