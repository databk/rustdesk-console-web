import { LockOutlined } from '@ant-design/icons';
import { Helmet, history, useIntl } from '@umijs/max';
import { App, Button, Form, Input, Typography } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { createStyles } from 'antd-style';
import { Footer } from '@/components';
import {
  confirmPasswordReset,
  validateResetToken,
} from '@/services/rustdesk-console/auth';
import Settings from '../../../../config/defaultSettings';
import Lang from '../login/components/Lang';

const useStyles = createStyles(({ token }) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    overflow: 'auto',
    backgroundImage:
      "url('https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/V-_oS6r-i7wAAAAAAAAAAAAAFl94AQBr')",
    backgroundSize: '100% 100%',
  },
  card: {
    maxWidth: 400,
    width: '90vw',
    margin: 'auto',
    padding: '32px 28px',
    borderRadius: token.borderRadiusLG,
    backgroundColor: token.colorBgContainer,
    boxShadow: token.boxShadowTertiary,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 40,
    color: token.colorPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  submit: {
    width: '100%',
    marginTop: 8,
  },
  backToLogin: {
    textAlign: 'center',
    marginTop: 16,
  },
  link: {
    color: token.colorPrimary,
    cursor: 'pointer',
    ':hover': {
      color: token.colorPrimaryHover,
    },
  },
}));

type ResetPasswordForm = {
  new_password: string;
  confirm_password: string;
};

const ResetPassword: React.FC = () => {
  const [form] = Form.useForm<ResetPasswordForm>();
  const [token, setToken] = useState<string>('');
  const [status, setStatus] = useState<'validating' | 'invalid' | 'ready'>(
    'validating',
  );
  const [accountName, setAccountName] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { message } = App.useApp();
  const intl = useIntl();
  const { styles } = useStyles();

  useEffect(() => {
    const urlToken = new URL(window.location.href).searchParams.get('token');
    if (!urlToken) {
      setStatus('invalid');
      return;
    }
    setToken(urlToken);
    (async () => {
      try {
        const info = await validateResetToken({ token: urlToken });
        setAccountName(info.display_name || info.username);
        setStatus('ready');
      } catch {
        setStatus('invalid');
      }
    })();
  }, []);

  const handleSubmit = useCallback(
    async (values: ResetPasswordForm) => {
      setSubmitting(true);
      setErrorMessage('');
      try {
        await confirmPasswordReset({
          token,
          new_password: values.new_password,
        });
        message.success(
          intl.formatMessage({
            id: 'pages.resetPassword.success',
            defaultMessage:
              'Password has been reset successfully. Redirecting to login...',
          }),
        );
        setTimeout(() => {
          history.replace('/user/login');
        }, 2000);
      } catch (error: unknown) {
        const err = error as {
          response?: { status?: number; data?: { error?: string } };
        };
        const status = err?.response?.status;
        setErrorMessage(
          err?.response?.data?.error ||
            intl.formatMessage({
              id: 'pages.resetPassword.failed',
              defaultMessage: 'Failed to reset the password',
            }),
        );
        if (status === 401) {
          setStatus('invalid');
        }
      } finally {
        setSubmitting(false);
      }
    },
    [token, intl, message],
  );

  const goLogin = () => {
    history.replace('/user/login');
  };

  const renderInvalid = () => (
    <div className={styles.card}>
      <div className={styles.icon}>
        <LockOutlined />
      </div>
      <Typography.Title level={3} className={styles.title}>
        {intl.formatMessage({
          id: 'pages.resetPassword.invalid.title',
          defaultMessage: 'Invalid or Expired Link',
        })}
      </Typography.Title>
      <Typography.Paragraph type="secondary" className={styles.subtitle}>
        {intl.formatMessage({
          id: 'pages.resetPassword.invalid.description',
          defaultMessage:
            'This password reset link is invalid, has already been used, or has expired. Please request a new one.',
        })}
      </Typography.Paragraph>
      <Button type="primary" size="large" block onClick={goLogin}>
        {intl.formatMessage({
          id: 'pages.resetPassword.backToLogin',
          defaultMessage: 'Back to Login',
        })}
      </Button>
    </div>
  );

  const renderReady = () => (
    <div className={styles.card}>
      <div className={styles.icon}>
        <LockOutlined />
      </div>
      <Typography.Title level={3} className={styles.title}>
        {intl.formatMessage({
          id: 'pages.resetPassword.title',
          defaultMessage: 'Set a New Password',
        })}
      </Typography.Title>
      <Typography.Paragraph type="secondary" className={styles.subtitle}>
        {intl.formatMessage(
          {
            id: 'pages.resetPassword.subtitle',
            defaultMessage: 'Setting a new password for {account}',
          },
          { account: accountName },
        )}
      </Typography.Paragraph>
      {errorMessage && (
        <Typography.Paragraph type="danger">
          {errorMessage}
        </Typography.Paragraph>
      )}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark={false}
      >
        <Form.Item
          name="new_password"
          label={intl.formatMessage({
            id: 'pages.resetPassword.newPassword',
            defaultMessage: 'New Password',
          })}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'pages.resetPassword.newPasswordRequired',
                defaultMessage: 'Please enter the new password',
              }),
            },
            {
              min: 6,
              message: intl.formatMessage(
                {
                  id: 'pages.resetPassword.passwordMinLength',
                  defaultMessage:
                    'Password must be at least {count} characters',
                },
                { count: 6 },
              ),
            },
          ]}
        >
          <Input.Password
            size="large"
            prefix={<LockOutlined />}
            autoComplete="new-password"
          />
        </Form.Item>
        <Form.Item
          name="confirm_password"
          label={intl.formatMessage({
            id: 'pages.resetPassword.confirmPassword',
            defaultMessage: 'Confirm Password',
          })}
          dependencies={['new_password']}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'pages.resetPassword.confirmPasswordRequired',
                defaultMessage: 'Please confirm the new password',
              }),
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('new_password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error(
                    intl.formatMessage({
                      id: 'pages.resetPassword.passwordMismatch',
                      defaultMessage: 'The two passwords do not match',
                    }),
                  ),
                );
              },
            }),
          ]}
        >
          <Input.Password
            size="large"
            prefix={<LockOutlined />}
            autoComplete="new-password"
          />
        </Form.Item>
        <Button
          type="primary"
          size="large"
          htmlType="submit"
          loading={submitting}
          className={styles.submit}
        >
          {intl.formatMessage({
            id: 'pages.resetPassword.submit',
            defaultMessage: 'Reset Password',
          })}
        </Button>
      </Form>
      <div className={styles.backToLogin}>
        <a className={styles.link} onClick={goLogin}>
          {intl.formatMessage({
            id: 'pages.resetPassword.backToLogin',
            defaultMessage: 'Back to Login',
          })}
        </a>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <Helmet>
        <title>
          {intl.formatMessage({
            id: 'pages.resetPassword.title',
            defaultMessage: 'Set a New Password',
          })}
          {` - ${Settings.title}`}
        </title>
      </Helmet>
      <Lang />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        {status === 'invalid' ? renderInvalid() : renderReady()}
      </div>
      <Footer />
    </div>
  );
};

export default ResetPassword;
