import { FormattedMessage, useIntl } from '@umijs/max';
import { Alert, Form, Input, Modal, Select, Typography } from 'antd';
import type { FormInstance } from 'antd';
import React from 'react';

const { Text } = Typography;

interface EditPeerModalProps {
  visible: boolean;
  error: string;
  editingPeer: API.PeerItem | null;
  tags: API.TagItem[];
  form: FormInstance<API.UpdatePeerParams>;
  onSubmit: (values: API.UpdatePeerParams) => Promise<void>;
  onCancel: () => void;
}

const EditPeerModal: React.FC<EditPeerModalProps> = ({
  visible,
  error,
  editingPeer,
  tags,
  form,
  onSubmit,
  onCancel,
}) => {
  const intl = useIntl();

  return (
    <Modal
      title={<FormattedMessage id="pages.common.edit" defaultMessage="Edit" />}
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
  );
};

export default EditPeerModal;
