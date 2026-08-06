import {
  LockOutlined,
  MailOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import { LoginForm, ProFormText } from '@ant-design/pro-components';
import {
  FormattedMessage,
  Helmet,
  useIntl,
  useModel,
  history,
} from '@umijs/max';
import { App, Button, Checkbox, Form } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { setToken } from '@/utils/auth';
import { Footer } from '@/components';
import { login, getLoginOptions } from '@/services/rustdesk-console/auth';
import {
  passkeyAuthBegin,
  passkeyAuthVerify,
} from '@/services/rustdesk-console/passkey';
import {
  isWebAuthnSupported,
  prepareRequestOptions,
  serializeAuthenticationResponse,
} from '@/utils/webauthn';
import Settings from '../../../../config/defaultSettings';
import type { AuthStep, VerifySession } from './types';
import { getDeviceInfo, parseOidcOptions } from './utils';
import { useStyles } from './styles';
import Lang from './components/Lang';
import LoginMessage from './components/LoginMessage';
import OidcLogin from './components/OidcLogin';
import VerifyStep from './components/VerifyStep';
import PasskeyVerifyStep from './components/PasskeyVerifyStep';

const Login: React.FC = () => {
  const [authStep, setAuthStep] = useState<AuthStep>('account');
  const [verifySession, setVerifySession] = useState<VerifySession | null>(
    null,
  );
  const [loginError, setLoginError] = useState<string>('');
  const [rememberMe, setRememberMe] = useState(
    () => localStorage.getItem('rememberMe') === '1',
  );
  const [submitting, setSubmitting] = useState(false);
  const [oidcOptions, setOidcOptions] = useState<API.OidcLoginInfo[]>([]);
  const [passkeySupported] = useState(() => isWebAuthnSupported());
  const { initialState, setInitialState } = useModel('@@initialState');
  const webauthnEnabled =
    initialState?.frontendSettings?.webauthnEnabled ?? false;
  const { styles } = useStyles();
  const { message } = App.useApp();
  const intl = useIntl();
  const [accountForm] = Form.useForm();

  const isVerifyStep =
    authStep === 'email_check' ||
    authStep === 'tfa_check' ||
    authStep === 'passkey_check';

  useEffect(() => {
    (async () => {
      try {
        const res = await getLoginOptions();
        setOidcOptions(parseOidcOptions(res));
      } catch {
        // Silently ignore - OIDC is optional
      }
    })();
  }, []);

  const handleLoginSuccess = useCallback(
    async (token: string, user?: API.CurrentUser) => {
      setToken(token, rememberMe);
      message.success(
        intl.formatMessage({
          id: 'pages.login.success',
          defaultMessage: 'Login successful!',
        }),
      );
      if (user) {
        flushSync(() => {
          setInitialState((s) => ({
            ...s,
            currentUser: user,
          }));
        });
      }
      const urlParams = new URL(window.location.href).searchParams;
      history.push(urlParams.get('redirect') || '/');
    },
    [rememberMe, intl, message, setInitialState],
  );

  const handleLoginError = useCallback(
    (error: unknown, defaultMsgId: string, defaultMsg: string) => {
      const err = error as {
        response?: {
          status?: number;
          data?: { error?: string; message?: string };
        };
      };
      const status = err?.response?.status;
      if (status === 400 || status === 401) {
        const errorData = err?.response?.data;
        setLoginError(
          errorData?.error ||
            errorData?.message ||
            intl.formatMessage({
              id: defaultMsgId,
              defaultMessage: defaultMsg,
            }),
        );
      } else {
        setLoginError(
          intl.formatMessage({ id: defaultMsgId, defaultMessage: defaultMsg }),
        );
      }
    },
    [intl],
  );

  const completePasskeyAuth = useCallback(
    async (
      secret: string,
      options: API.PublicKeyCredentialRequestOptionsJSON,
    ): Promise<API.LoginResponse> => {
      const publicKey = prepareRequestOptions(options);
      const credential = await navigator.credentials.get({ publicKey });
      if (!credential || !(credential instanceof PublicKeyCredential)) {
        throw new Error('No credential returned');
      }
      const response = serializeAuthenticationResponse(credential);
      const deviceInfo = getDeviceInfo();
      return passkeyAuthVerify({ secret, response, deviceInfo });
    },
    [],
  );

  const handlePasskeyVerify = useCallback(async () => {
    if (!verifySession?.passkeyOptions || !verifySession?.secret) return;
    setLoginError('');
    setSubmitting(true);
    try {
      const msg = await completePasskeyAuth(
        verifySession.secret,
        verifySession.passkeyOptions,
      );
      if (msg.access_token) {
        await handleLoginSuccess(msg.access_token, msg.user);
      }
    } catch (error: unknown) {
      const err = error as { name?: string };
      if (err?.name === 'NotAllowedError') {
        setLoginError(
          intl.formatMessage({
            id: 'pages.login.passkey.cancelled',
            defaultMessage: 'Passkey verification was cancelled',
          }),
        );
      } else {
        handleLoginError(
          error,
          'pages.login.passkey.failed',
          'Passkey verification failed',
        );
      }
    } finally {
      setSubmitting(false);
    }
  }, [
    verifySession,
    completePasskeyAuth,
    handleLoginSuccess,
    handleLoginError,
    intl,
  ]);

  const handlePasskeyLogin = useCallback(async () => {
    setLoginError('');
    setSubmitting(true);
    try {
      const beginRes = await passkeyAuthBegin();
      const msg = await completePasskeyAuth(beginRes.secret, beginRes.options);
      if (msg.access_token) {
        await handleLoginSuccess(msg.access_token, msg.user);
      }
    } catch (error: unknown) {
      const err = error as { name?: string };
      if (err?.name === 'NotAllowedError') {
        // User cancelled - silently reset, no error message
      } else {
        handleLoginError(
          error,
          'pages.login.passkey.failed',
          'Passkey login failed',
        );
      }
    } finally {
      setSubmitting(false);
    }
  }, [completePasskeyAuth, handleLoginSuccess, handleLoginError, intl]);

  const handleAccountSubmit = useCallback(
    async (values: API.LoginParams) => {
      setLoginError('');
      setSubmitting(true);
      try {
        const deviceInfo = getDeviceInfo();
        const msg = await login({
          username: values.username?.trim(),
          password: values.password,
          autoLogin: rememberMe,
          deviceInfo,
        });

        if (msg.type === 'access_token' && msg.access_token) {
          await handleLoginSuccess(msg.access_token, msg.user);
          return;
        }

        if (msg.type === 'email_check') {
          const actualType = msg.tfa_type || 'email_check';
          setVerifySession({
            username: values.username?.trim() || '',
            secret: msg.secret || '',
            emailHint: msg.user?.email,
          });
          setAuthStep(actualType);
          if (actualType === 'email_check') {
            message.info(
              intl.formatMessage({
                id: 'pages.login.emailCheck.sent',
                defaultMessage:
                  'A verification code has been sent to your email',
              }),
            );
          }
          return;
        }

        if (msg.type === 'tfa_check') {
          setVerifySession({
            username: values.username?.trim() || '',
            secret: msg.secret || '',
          });
          setAuthStep('tfa_check');
          return;
        }

        if (msg.type === 'passkey_check') {
          setVerifySession({
            username: values.username?.trim() || '',
            secret: msg.secret || '',
            passkeyOptions: msg.passkey_options,
          });
          setAuthStep('passkey_check');
          return;
        }

        setLoginError(
          intl.formatMessage({
            id: 'pages.login.failure',
            defaultMessage: 'Login failed, please try again!',
          }),
        );
      } catch (error: unknown) {
        handleLoginError(
          error,
          'pages.login.failure',
          'Login failed, please try again!',
        );
      } finally {
        setSubmitting(false);
      }
    },
    [rememberMe, intl, message, handleLoginSuccess, handleLoginError],
  );

  const handleVerifySubmit = useCallback(
    async (code: string) => {
      if (!verifySession || code.length < 6) return;
      setLoginError('');
      setSubmitting(true);
      try {
        const deviceInfo = getDeviceInfo();
        const params: API.LoginParams = {
          username: verifySession.username,
          secret: verifySession.secret,
          autoLogin: rememberMe,
          deviceInfo,
        };

        if (authStep === 'email_check') {
          params.type = 'email_code';
          params.verificationCode = code;
        } else if (authStep === 'tfa_check') {
          params.type = 'tfa_code';
          params.tfaCode = code;
        }

        const msg = await login(params);

        if (msg.type === 'access_token' && msg.access_token) {
          await handleLoginSuccess(msg.access_token, msg.user);
          return;
        }

        if (msg.type === 'tfa_check') {
          setVerifySession((prev) =>
            prev ? { ...prev, secret: msg.secret || '' } : null,
          );
          setAuthStep('tfa_check');
          return;
        }

        if (msg.type === 'email_check') {
          const actualType = msg.tfa_type || 'email_check';
          setVerifySession((prev) =>
            prev
              ? {
                  ...prev,
                  secret: msg.secret || '',
                  emailHint: msg.user?.email,
                }
              : null,
          );
          setAuthStep(actualType);
          if (actualType === 'email_check') {
            message.info(
              intl.formatMessage({
                id: 'pages.login.emailCheck.sent',
                defaultMessage:
                  'A verification code has been sent to your email',
              }),
            );
          }
          return;
        }

        setLoginError(
          intl.formatMessage({
            id: 'pages.login.failure',
            defaultMessage: 'Login failed, please try again!',
          }),
        );
      } catch (error: unknown) {
        handleLoginError(
          error,
          'pages.login.verifyCode.invalid',
          'Invalid verification code',
        );
      } finally {
        setSubmitting(false);
      }
    },
    [
      authStep,
      verifySession,
      rememberMe,
      intl,
      message,
      handleLoginSuccess,
      handleLoginError,
    ],
  );

  const handleBackToAccount = useCallback(() => {
    setAuthStep('account');
    setVerifySession(null);
    setLoginError('');
  }, []);

  const handleForgotPassword = () => {
    message.info(
      intl.formatMessage({
        id: 'pages.login.forgotPasswordInfo',
        defaultMessage: 'Please contact administrator to reset password',
      }),
    );
  };

  const verifyStepTitle = useMemo(() => {
    if (authStep === 'email_check') {
      return intl.formatMessage({
        id: 'pages.login.emailCheck.title',
        defaultMessage: 'Email Verification',
      });
    }
    if (authStep === 'tfa_check') {
      return intl.formatMessage({
        id: 'pages.login.tfaCheck.title',
        defaultMessage: 'Two-Factor Authentication',
      });
    }
    return '';
  }, [authStep, intl]);

  const verifyStepDescription = useMemo(() => {
    if (authStep === 'email_check' && verifySession?.emailHint) {
      return intl.formatMessage(
        {
          id: 'pages.login.emailCheck.description',
          defaultMessage: 'A 6-digit code has been sent to {email}',
        },
        { email: verifySession.emailHint },
      );
    }
    if (authStep === 'tfa_check') {
      return intl.formatMessage({
        id: 'pages.login.tfaCheck.description',
        defaultMessage: 'Enter the 6-digit code from your authenticator app',
      });
    }
    return '';
  }, [authStep, verifySession, intl]);

  return (
    <div className={styles.container}>
      <Helmet>
        <title>
          {intl.formatMessage({ id: 'menu.login', defaultMessage: 'Login' })}
          {Settings.title && ` - ${Settings.title}`}
        </title>
      </Helmet>
      <Lang />
      <div style={{ flex: 1, padding: '32px 0' }}>
        <LoginForm
          form={accountForm}
          contentStyle={{ minWidth: 280, maxWidth: '75vw' }}
          logo={<img alt="logo" src="/logo.svg" />}
          title="RustDesk Console"
          subTitle="RustDesk Remote Desktop Management Console"
          initialValues={{ rememberMe }}
          onValuesChange={(values) => {
            if (values.rememberMe !== undefined) {
              setRememberMe(values.rememberMe);
              if (values.rememberMe) {
                localStorage.setItem('rememberMe', '1');
              } else {
                localStorage.removeItem('rememberMe');
              }
            }
          }}
          onFinish={async (values) => {
            await handleAccountSubmit(values as API.LoginParams);
          }}
          submitter={
            isVerifyStep
              ? { render: () => null }
              : {
                  searchConfig: {
                    submitText: intl.formatMessage({
                      id: 'pages.login.submit',
                      defaultMessage: 'Login',
                    }),
                  },
                  submitButtonProps: {
                    loading: submitting,
                    size: 'large',
                    style: { width: '100%' },
                  },
                }
          }
        >
          {authStep === 'account' && (
            <div>
              {loginError && <LoginMessage content={loginError} />}

              <ProFormText
                name="username"
                fieldProps={{
                  size: 'large',
                  prefix: <UserOutlined />,
                  autoComplete: 'username',
                }}
                placeholder={intl.formatMessage({
                  id: 'pages.login.username.placeholder',
                  defaultMessage: 'Username',
                })}
                rules={[
                  {
                    required: true,
                    message: (
                      <FormattedMessage
                        id="pages.login.username.required"
                        defaultMessage="Please enter your username!"
                      />
                    ),
                  },
                ]}
              />

              <ProFormText.Password
                name="password"
                fieldProps={{
                  size: 'large',
                  prefix: <LockOutlined />,
                  autoComplete: 'current-password',
                }}
                placeholder={intl.formatMessage({
                  id: 'pages.login.password.placeholder',
                  defaultMessage: 'Password',
                })}
                rules={[
                  {
                    required: true,
                    message: (
                      <FormattedMessage
                        id="pages.login.password.required"
                        defaultMessage="Please enter your password!"
                      />
                    ),
                  },
                ]}
              />

              <div className={styles.loginFormExtra}>
                <Form.Item name="rememberMe" valuePropName="checked" noStyle>
                  <Checkbox>
                    {intl.formatMessage({
                      id: 'pages.login.rememberMe',
                      defaultMessage: 'Remember me',
                    })}
                  </Checkbox>
                </Form.Item>
                <a
                  className={styles.forgotPassword}
                  onClick={handleForgotPassword}
                >
                  {intl.formatMessage({
                    id: 'pages.login.forgotPassword',
                    defaultMessage: 'Forgot Password?',
                  })}
                </a>
              </div>

              {passkeySupported && webauthnEnabled && (
                <Button
                  block
                  size="large"
                  icon={<KeyOutlined />}
                  loading={submitting}
                  onClick={handlePasskeyLogin}
                  style={{ marginTop: 16 }}
                >
                  {intl.formatMessage({
                    id: 'pages.login.passkey.login',
                    defaultMessage: 'Sign in with Passkey',
                  })}
                </Button>
              )}

              <OidcLogin options={oidcOptions} loading={submitting} />
            </div>
          )}

          {authStep === 'email_check' && (
            <VerifyStep
              icon={<MailOutlined className={styles.verifyIcon} />}
              title={verifyStepTitle}
              description={verifyStepDescription}
              resetKey="email"
              error={loginError}
              submitting={submitting}
              onSubmit={handleVerifySubmit}
              onBack={handleBackToAccount}
            />
          )}

          {authStep === 'tfa_check' && (
            <VerifyStep
              icon={<SafetyCertificateOutlined className={styles.verifyIcon} />}
              title={verifyStepTitle}
              description={verifyStepDescription}
              resetKey="tfa"
              error={loginError}
              submitting={submitting}
              onSubmit={handleVerifySubmit}
              onBack={handleBackToAccount}
            />
          )}

          {authStep === 'passkey_check' && (
            <PasskeyVerifyStep
              error={loginError}
              submitting={submitting}
              onVerify={handlePasskeyVerify}
              onBack={handleBackToAccount}
            />
          )}
        </LoginForm>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
