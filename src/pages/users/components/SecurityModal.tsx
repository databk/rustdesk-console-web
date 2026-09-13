import { FormattedMessage, useIntl } from '@umijs/max';
import { Form, Input, Modal, Switch } from 'antd';
import type { FormInstance } from 'antd';
import React from 'react';

interface SecurityModalProps {
  visible: boolean;
  form: FormInstance<API.UpdateUserSecurityParams>;
  onSubmit: (values: API.UpdateUserSecurityParams) => Promise<void>;
  onCancel: () => void;
  thirdAuthType?: string;
}

const SecurityModal: React.FC<SecurityModalProps> = ({
  visible,
  form,
  onSubmit,
  onCancel,
  thirdAuthType,
}) => {
  const intl = useIntl();

  const handleFinish = (values: API.UpdateUserSecurityParams) => {
    const payload: API.UpdateUserSecurityParams = {
      tfa_enforce: values.tfa_enforce,
      email_verification: values.email_verification,
    };
    if (values.new_password) {
      payload.new_password = values.new_password;
    }
    return onSubmit(payload);
  };

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
      <Form form={form} onFinish={handleFinish} layout="vertical">
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
        {!thirdAuthType && (
          <>
            <Form.Item
              name="new_password"
              label={
                <FormattedMessage
                  id="pages.users.resetPassword"
                  defaultMessage="Reset Password"
                />
              }
              tooltip={
                <FormattedMessage
                  id="pages.users.resetPasswordTooltip"
                  defaultMessage="Leave blank to keep current password"
                />
              }
              rules={[
                {
                  min: 6,
                  message: intl.formatMessage({
                    id: 'pages.users.passwordTooShort',
                    defaultMessage:
                      'Password must be at least 6 characters',
                  }),
                },
              ]}
            >
              <Input.Password placeholder="" autoComplete="new-password" />
            </Form.Item>
            <Form.Item
              name="confirm_password"
              label={
                <FormattedMessage
                  id="pages.users.confirmPassword"
                  defaultMessage="Confirm Password"
                />
              }
              dependencies={['new_password']}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const newPassword = getFieldValue('new_password');
                    if (!newPassword && !value) return Promise.resolve();
                    if (newPassword === value) return Promise.resolve();
                    return Promise.reject(
                      intl.formatMessage({
                        id: 'pages.users.passwordMismatch',
                        defaultMessage: 'Passwords do not match',
                      }),
                    );
                  },
                }),
              ]}
            >
              <Input.Password placeholder="" autoComplete="new-password" />
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
};

export default SecurityModal;
