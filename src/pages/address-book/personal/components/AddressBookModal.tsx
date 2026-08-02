import { FormattedMessage, useIntl } from '@umijs/max';
import { Form, Input, Modal } from 'antd';
import type { FormInstance } from 'antd';
import React from 'react';

interface AddressBookModalProps {
  mode: 'create' | 'edit' | null;
  saving: boolean;
  form: FormInstance<{ name: string; note?: string }>;
  onSubmit: (values: { name: string; note?: string }) => Promise<void>;
  onCancel: () => void;
}

const AddressBookModal: React.FC<AddressBookModalProps> = ({
  mode,
  saving,
  form,
  onSubmit,
  onCancel,
}) => {
  const intl = useIntl();

  return (
    <Modal
      title={
        mode === 'create' ? (
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
      open={mode !== null}
      confirmLoading={saving}
      onCancel={onCancel}
      onOk={() => form.submit()}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
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
  );
};

export default AddressBookModal;