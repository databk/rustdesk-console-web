import { FormattedMessage, useIntl } from '@umijs/max';
import { Button, Select, Tooltip, Typography } from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import React from 'react';

const { Text } = Typography;

interface AddressBookSelectorProps {
  abGuid: string | undefined;
  abLoading: boolean;
  addressBooks: API.AddressBookProfile[];
  addressBookSaving: boolean;
  isDefaultAddressBook: boolean;
  onSelectAddressBook: (guid: string) => void;
  onOpenCreate: () => void;
  onOpenEdit: () => void;
  onConfirmDelete: () => void;
}

const AddressBookSelector: React.FC<AddressBookSelectorProps> = ({
  abGuid,
  abLoading,
  addressBooks,
  addressBookSaving,
  isDefaultAddressBook,
  onSelectAddressBook,
  onOpenCreate,
  onOpenEdit,
  onConfirmDelete,
}) => {
  const intl = useIntl();

  return (
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
        onChange={onSelectAddressBook}
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
          onClick={onOpenCreate}
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
            onClick={onOpenEdit}
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
            onClick={onConfirmDelete}
            style={{ width: 32 }}
          />
        </span>
      </Tooltip>
    </div>
  );
};

export default AddressBookSelector;