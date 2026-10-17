import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { App, Form, Input, Modal, Typography } from 'antd';
import React, { useState } from 'react';
import { requestPasswordReset } from '@/services/rustdesk-console/auth';

type ForgotPasswordModalProps = {
  open: boolean;
  initialUsername?: string;
  onClose: () => void;
};

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  open,
  initialUsername,
  onClose,
}) => {
  const [form] = Form.useForm<{ username_or_email: string }>();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const { message } = App.useApp();
  const intl = useIntl();

  const handleClose = () => {
    form.resetFields();
    setSent(false);
    setSubmitting(false);
    onClose();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      try {
        await requestPasswordReset({
          username_or_email: values.username_or_email.trim(),
        });
        setSent(true);
      } catch (error: unknown) {
        const err = error as {
          response?: { status?: number; data?: { error?: string } };
        };
        const status = err?.response?.status;
        if (status === 400 || status === 401 || status === 429) {
          message.error(
            err?.response?.data?.error ||
              intl.formatMessage({
                id: 'pages.login.forgotPassword.failed',
                defaultMessage: 'Failed to send the reset email',
              }),
          );
        } else {
          message.error(
            intl.formatMessage({
              id: 'pages.login.forgotPassword.failed',
              defaultMessage: 'Failed to send the reset email',
            }),
          );
        }
      } finally {
        setSubmitting(false);
      }
    } catch {
      // Validation errors are rendered by the form
    }
  };

  return (
    <Modal
      open={open}
      title={intl.formatMessage({
        id: 'pages.login.forgotPassword.title',
        defaultMessage: 'Reset Password',
      })}
      okText={
        sent
          ? intl.formatMessage({
              id: 'pages.login.forgotPassword.done',
              defaultMessage: 'Done',
            })
          : intl.formatMessage({
              id: 'pages.login.forgotPassword.send',
              defaultMessage: 'Send Reset Link',
            })
      }
      okButtonProps={{ loading: submitting }}
      onOk={sent ? handleClose : handleSubmit}
      onCancel={handleClose}
      destroyOnHidden
    >
      {sent ? (
        <Typography.Paragraph>
          {intl.formatMessage({
            id: 'pages.login.forgotPassword.sent',
            defaultMessage:
              'If the account exists and has a bound email address, a password reset link has been sent. Please check your inbox (the link expires in 30 minutes).',
          })}
        </Typography.Paragraph>
      ) : (
        <Form
          form={form}
          layout="vertical"
          initialValues={{ username_or_email: initialUsername }}
        >
          <Typography.Paragraph type="secondary">
            {intl.formatMessage({
              id: 'pages.login.forgotPassword.description',
              defaultMessage:
                'Enter your username or email address and we will send you a password reset link.',
            })}
          </Typography.Paragraph>
          <Form.Item
            name="username_or_email"
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'pages.login.forgotPassword.accountRequired',
                  defaultMessage: 'Please enter your username or email',
                }),
              },
            ]}
          >
            <Input
              size="large"
              prefix={<UserOutlined />}
              placeholder={intl.formatMessage({
                id: 'pages.login.forgotPassword.accountPlaceholder',
                defaultMessage: 'Username or email',
              })}
              onPressEnter={handleSubmit}
            />
          </Form.Item>
        </Form>
      )}
      {!sent && (
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          <LockOutlined style={{ marginRight: 4 }} />
          {intl.formatMessage({
            id: 'pages.login.forgotPassword.contactAdmin',
            defaultMessage:
              'Accounts without a bound email address need to contact the administrator.',
          })}
        </Typography.Paragraph>
      )}
    </Modal>
  );
};

export default ForgotPasswordModal;
