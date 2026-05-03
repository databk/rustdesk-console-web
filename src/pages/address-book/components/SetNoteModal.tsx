import { Modal, Form, Input, message } from 'antd';
import { useState } from 'react';
import { useIntl } from '@umijs/max';

type SetNoteModalProps = {
  visible: boolean;
  setModalVisible: (visible: boolean) => void;
  actionRef: any;
  guids: string[];
  setFunction: (guids: string[], note: string) => Promise<any>;
};

const SetNoteModal: React.FC<SetNoteModalProps> = (props) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const intl = useIntl();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await props.setFunction(props.guids, values.note);
      message.success(
        intl.formatMessage({
          id: 'pages.addressBook.setNoteSuccess',
          defaultMessage: 'Note set successfully',
        }),
      );
      props.setModalVisible(false);
      form.resetFields();
      props.actionRef.current?.reload();
    } catch (error) {
      message.error(
        intl.formatMessage({
          id: 'pages.addressBook.setNoteFailed',
          defaultMessage: 'Failed to set note',
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={intl.formatMessage({
        id: 'pages.addressBook.setNote',
        defaultMessage: 'Set Note',
      })}
      open={props.visible}
      onCancel={() => {
        props.setModalVisible(false);
        form.resetFields();
      }}
      onOk={handleOk}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="note"
          label={intl.formatMessage({
            id: 'pages.addressBook.note',
            defaultMessage: 'Note',
          })}
        >
          <Input.TextArea rows={4} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SetNoteModal;
