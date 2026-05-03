import { Alert, Form, Input, Modal, Select, Typography } from 'antd';
import { FormattedMessage, useIntl } from '@umijs/max';
import React from 'react';
import type { TagItem } from '@/services/rustdesk-console/typings';
import type { PeerItem } from '@/services/rustdesk-console/typings';

const { Text } = Typography;

export interface EditPeerModalProps {
  open: boolean;
  tags: TagItem[];
  editPeerForm: any;
  editingPeer: PeerItem | null;
  editPeerError: string;
  onCancel: () => void;
  onSubmit: (values: API.UpdatePeerParams) => void;
}

const EditPeerModal: React.FC<EditPeerModalProps> = ({
  open,
  tags,
  editPeerForm,
  editingPeer,
  editPeerError,
  onCancel,
  onSubmit,
}) => {
  const intl = useIntl();

  return (
    <Modal
      title={<FormattedMessage id="pages.common.edit" defaultMessage="Edit" />}
      open={open}
      onCancel={() => {
        onCancel();
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
      <Form form={editPeerForm} onFinish={onSubmit} layout="vertical">
        <Form.Item name="id" label="ID">
          <Text>{editingPeer?.id}</Text>
        </Form.Item>
        <Form.Item
          name="alias"
          label={<FormattedMessage id="pages.addressBook.alias" defaultMessage="Alias" />}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="note"
          label={<FormattedMessage id="pages.addressBook.note" defaultMessage="Note" />}
        >
          <Input.TextArea />
        </Form.Item>
        <Form.Item
          name="tags"
          label={<FormattedMessage id="pages.addressBook.tags" defaultMessage="Tags" />}
        >
          <Select
            mode="multiple"
            placeholder={intl.formatMessage({
              id: 'pages.addressBook.selectTags',
              defaultMessage: 'Select tags',
            })}
            options={tags.map((tag) => ({
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