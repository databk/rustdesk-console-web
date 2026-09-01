import { useIntl } from '@umijs/max';
import {
  Button,
  ColorPicker,
  Divider,
  Form,
  Input,
  Popconfirm,
  Space,
  Tag,
} from 'antd';
import type { FormInstance } from 'antd';
import { FormattedMessage } from '@umijs/max';
import React from 'react';
import { argbToHex, rgbToArgb } from '../utils';

interface TagColumnsOptions {
  pendingColorUpdates: Record<string, number>;
  renameTagForm: FormInstance<API.RenameTagParams>;
  modal: { confirm: (config: Record<string, unknown>) => void };
  onUpdateTagColor: (tagName: string, color: number) => void;
  onRenameTag: (values: API.RenameTagParams) => Promise<void>;
  onDeleteTag: (tagName: string) => void;
}

export const useTagColumns = (options: TagColumnsOptions) => {
  const intl = useIntl();
  const {
    pendingColorUpdates,
    renameTagForm,
    modal,
    onUpdateTagColor,
    onRenameTag,
    onDeleteTag,
  } = options;

  return [
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
              const newArgb = rgbToArgb(colorValue.toRgb());
              onUpdateTagColor(record.name, newArgb);
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
                onOk: () => renameTagForm.validateFields().then(onRenameTag),
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
            onConfirm={() => onDeleteTag(record.name)}
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
};
