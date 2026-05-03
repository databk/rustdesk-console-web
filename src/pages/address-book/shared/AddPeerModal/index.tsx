import { Alert, Form, Input, Modal, Select } from 'antd';
import { FormattedMessage, useIntl } from '@umijs/max';
import React from 'react';
import type { TagItem } from '@/services/rustdesk-console/typings';

export interface AddPeerModalProps {
  open: boolean;
  tags: TagItem[];
  addPeerForm: any;
  addPeerError: string;
  onCancel: () => void;
  onSubmit: (values: API.AddPeerParams) => void;
}

const AddPeerModal: React.FC<AddPeerModalProps> = ({
  open,
  tags,
  addPeerForm,
  addPeerError,
  onCancel,
  onSubmit,
}) => {
  const intl = useIntl();

  return (
    <Modal
      title={<FormattedMessage id="pages.addressBook.addPeer" defaultMessage="Add Peer" />}
      open={open}
      onCancel={onCancel}
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
      <Form form={addPeerForm} onFinish={onSubmit} layout="vertical">
        <Form.Item
          name="id"
          label={<FormattedMessage id="pages.common.id" defaultMessage="ID" />}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'pages.common.pleaseEnterPeerId',
                defaultMessage: 'Please enter peer ID',
              }),
            },
          ]}
        >
          <Input />
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

export default AddPeerModal;