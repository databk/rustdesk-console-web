import type { ColorRef } from 'antd';
import { Button, ColorPicker, Form, Input, Modal, Popconfirm, Space, Table, Tag } from 'antd';
import { FormattedMessage, useIntl } from '@umijs/max';
import React, { useState } from 'react';
import type { TagItem } from '@/services/rustdesk-console/typings';
import { argbToHex } from '../utils';

export interface TagManagementProps {
  open: boolean;
  tags: TagItem[];
  pendingColorUpdates: Record<string, number>;
  onCancel: () => void;
  onRenameTag: (values: { old: string; new: string }) => void;
  onTagColorUpdate: (tagName: string, color: number) => void;
  onDeleteTag: (tagName: string) => void;
}

const TagManagement: React.FC<TagManagementProps> = ({
  open,
  tags,
  pendingColorUpdates,
  onCancel,
  onRenameTag,
  onTagColorUpdate,
  onDeleteTag,
}) => {
  const intl = useIntl();
  const [renameForm] = Form.useForm();

  const handleColorChange = (tagName: string, colorValue: ColorRef) => {
    const rgb = colorValue.toRgb();
    const newArgb = 0xFF000000 + (rgb.r << 16) + (rgb.g << 8) + rgb.b;
    onTagColorUpdate(tagName, newArgb);
  };

  const handleRename = async (values: { old: string; new: string }) => {
    onRenameTag(values);
  };

  const columns = [
    {
      title: intl.formatMessage({ id: 'pages.addressBook.tagName', defaultMessage: 'Tag Name' }),
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text: string, record: TagItem) => (
        <Tag color={argbToHex(record.color)} style={{ marginRight: 8 }}>
          {text}
        </Tag>
      ),
    },
    {
      title: intl.formatMessage({ id: 'pages.addressBook.color', defaultMessage: 'Color' }),
      dataIndex: 'color',
      key: 'color',
      width: 120,
      render: (color: number, record: TagItem) => {
        const displayColor = pendingColorUpdates[record.name] ?? color;
        return (
          <ColorPicker
            size="small"
            disabledAlpha
            value={argbToHex(displayColor)}
            onChangeComplete={(colorValue: ColorRef) => handleColorChange(record.name, colorValue)}
          />
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'pages.common.action', defaultMessage: 'Action' }),
      key: 'action',
      width: 180,
      render: (_: unknown, record: TagItem) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => {
              Modal.confirm({
                title: intl.formatMessage({ id: 'pages.addressBook.renameTag', defaultMessage: 'Rename Tag' }),
                content: (
                  <Form form={renameForm} initialValues={{ old: record.name, new: '' }}>
                    <Form.Item name="old" hidden><Input /></Form.Item>
                    <Form.Item
                      name="new"
                      label={intl.formatMessage({ id: 'pages.addressBook.newTagName', defaultMessage: 'New Tag Name' })}
                      rules={[{ required: true }]}
                    >
                      <Input />
                    </Form.Item>
                  </Form>
                ),
                onOk: () => renameForm.validateFields().then(handleRename),
              });
            }}
          >
            <FormattedMessage id="pages.common.rename" defaultMessage="Rename" />
          </Button>
          <Popconfirm
            title={
              <FormattedMessage
                id="pages.addressBook.deleteTagConfirm"
                defaultMessage="Are you sure to delete this tag?"
              />
            }
            onConfirm={() => onDeleteTag(record.name)}
          >
            <Button type="link" size="small" danger>
              <FormattedMessage id="pages.common.delete" defaultMessage="Delete" />
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Modal
      title={<FormattedMessage id="pages.addressBook.manageTags" defaultMessage="Manage Tags" />}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={700}
    >
      <Table
        dataSource={tags}
        columns={columns}
        rowKey="name"
        pagination={false}
        size="middle"
      />
    </Modal>
  );
};

export default TagManagement;