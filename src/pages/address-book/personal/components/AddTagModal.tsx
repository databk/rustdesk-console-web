import { FormattedMessage, useIntl } from '@umijs/max';
import { ColorPicker, Form, Input, Modal } from 'antd';
import type { FormInstance } from 'antd';
import React, { useEffect, useRef } from 'react';

const generateRandomColor = (): string => {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 65 + Math.floor(Math.random() * 20);
  const lightness = 45 + Math.floor(Math.random() * 15);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

interface AddTagModalProps {
  visible: boolean;
  form: FormInstance;
  onSubmit: (values: {
    name: string;
    color?: { toRgb: () => { r: number; g: number; b: number; a: number } };
  }) => Promise<void>;
  onCancel: () => void;
}

const AddTagModal: React.FC<AddTagModalProps> = ({
  visible,
  form,
  onSubmit,
  onCancel,
}) => {
  const intl = useIntl();
  const colorInitializedRef = useRef(false);

  useEffect(() => {
    if (visible && !colorInitializedRef.current) {
      form.setFieldValue('color', generateRandomColor());
      colorInitializedRef.current = true;
    }
    if (!visible) {
      colorInitializedRef.current = false;
    }
  }, [visible, form]);

  return (
    <Modal
      title={
        <FormattedMessage
          id="pages.addressBook.addTag"
          defaultMessage="Add Tag"
        />
      }
      open={visible}
      onCancel={onCancel}
      onOk={() => form.submit()}
    >
      <Form form={form} onFinish={onSubmit} layout="vertical">
        <Form.Item
          name="name"
          label={
            <FormattedMessage
              id="pages.addressBook.tagName"
              defaultMessage="Tag Name"
            />
          }
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'pages.common.pleaseEnterTagName',
                defaultMessage: 'Please enter tag name',
              }),
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="color"
          label={
            <FormattedMessage
              id="pages.addressBook.color"
              defaultMessage="Color"
            />
          }
        >
          <ColorPicker disabledAlpha />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddTagModal;

