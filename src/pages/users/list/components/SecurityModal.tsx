import { FormattedMessage } from '@umijs/max';
import { Form, Modal, Switch } from 'antd';
import type { FormInstance } from 'antd';
import React from 'react';

interface SecurityModalProps {
  visible: boolean;
  form: FormInstance<API.UpdateUserSecurityParams>;
  onSubmit: (values: API.UpdateUserSecurityParams) => Promise<void>;
  onCancel: () => void;
}

const SecurityModal: React.FC<SecurityModalProps> = ({
  visible,
  form,
  onSubmit,
  onCancel,
}) => {
  return (
    <Modal
      title={
        <FormattedMessage
          id="pages.users.securitySettings"
          defaultMessage="Security Settings"
        />
      }
      open={visible}
      onCancel={onCancel}
      onOk={() => form.submit()}
    >
      <Form form={form} onFinish={onSubmit} layout="vertical">
        <Form.Item
          name="tfa_enforce"
          label={
            <FormattedMessage
              id="pages.users.tfaEnforce"
              defaultMessage="Enforce Two-Factor Authentication"
            />
          }
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
        <Form.Item
          name="email_verification"
          label={
            <FormattedMessage
              id="pages.users.emailVerification"
              defaultMessage="Require Email Verification"
            />
          }
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SecurityModal;