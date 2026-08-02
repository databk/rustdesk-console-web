import { FormattedMessage } from '@umijs/max';
import { Modal, Table } from 'antd';
import React from 'react';

interface TagManagementModalProps {
  visible: boolean;
  tags: API.TagItem[];
  columns: Record<string, unknown>[];
  onCancel: () => void;
}

const TagManagementModal: React.FC<TagManagementModalProps> = ({
  visible,
  tags,
  columns,
  onCancel,
}) => {
  return (
    <Modal
      title={
        <FormattedMessage
          id="pages.addressBook.manageTags"
          defaultMessage="Manage Tags"
        />
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={700}
    >
      <Table
        dataSource={tags as API.TagItem[]}
        columns={columns}
        rowKey="name"
        pagination={false}
        size="middle"
      />
    </Modal>
  );
};

export default TagManagementModal;
