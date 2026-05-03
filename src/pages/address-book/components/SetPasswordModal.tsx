import { Modal, Form, Input, message } from 'antd';
import { useState } from 'react';
import { useIntl } from '@umijs/max';
import { setAbPeersPassword } from '@/services/rustdesk-console/addressBook';

type SetPasswordModalProps = {
  visible: boolean;
  setModalVisible: (visible: boolean) => void;
  actionRef: any;
  profile: API.SharedAbProfile;
  abPeers: API.AbPeer[];
};

const SetPasswordModal: React.FC<SetPasswordModalProps> = (props) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const intl = useIntl();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await setAbPeersPassword({
        guids: props.abPeers.map((x) => x.guid),
        password: values.password,
        ab: props.profile.guid,
      });
      message.success(
        intl.formatMessage({
          id: 'pages.addressBook.setPasswordSuccess',
          defaultMessage: 'Password set successfully',
        }),
      );
      props.setModalVisible(false);
      form.resetFields();
      props.actionRef.current?.reload();
    } catch (error) {
      message.error(
        intl.formatMessage({
          id: 'pages.addressBook.setPasswordFailed',
          defaultMessage: 'Failed to set password',
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={intl.formatMessage({
        id: 'pages.addressBook.setPassword',
        defaultMessage: 'Set Password',
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
          name="password"
          label={intl.formatMessage({
            id: 'pages.users.password',
            defaultMessage: 'Password',
          })}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'pages.common.pleaseEnterPassword',
                defaultMessage: 'Please enter password',
              }),
            },
          ]}
        >
          <Input.Password />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SetPasswordModal;
