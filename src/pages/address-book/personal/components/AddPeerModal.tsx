import { FormattedMessage, useIntl } from '@umijs/max';
import { Alert, Form, Input, Modal, Select } from 'antd';
import type { FormInstance } from 'antd';
import React from 'react';

interface AddPeerModalProps {
  visible: boolean;
  error: string;
  tags: API.TagItem[];
  form: FormInstance<API.AddPeerParams>;
  onSubmit: (values: API.AddPeerParams) => Promise<void>;
  onCancel: () => void;
}

const AddPeerModal: React.FC<AddPeerModalProps> = ({
  visible,
  error,
  tags,
  form,
  onSubmit,
  onCancel,
}) => {
  const intl = useIntl();

  return (
    <Modal
      title={
        <FormattedMessage
          id="pages.addressBook.addPeer"
          defaultMessage="Add by ID"
        />
      }
      open={visible}
      onCancel={onCancel}
      onOk={() => form.submit()}
    >
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      <Form form={form} onFinish={onSubmit} layout="vertical">
        <Form.Item
          name="id"
          label={<FormattedMessage id="pages.common.id" defaultMessage="ID" />}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'pages.common.pleaseEnterId',
                defaultMessage: 'Please enter ID',
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
  );
};

export default AddPeerModal;
