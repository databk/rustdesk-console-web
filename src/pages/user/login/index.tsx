import {
  LockOutlined,
  MailOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  ArrowLeftOutlined,
  GithubOutlined,
} from '@ant-design/icons';
import { LoginForm, ProFormText } from '@ant-design/pro-components';
import {
  FormattedMessage,
  Helmet,
  SelectLang,
  useIntl,
  useModel,
  history,
} from '@umijs/max';
import {
  Alert,
  App,
  Button,
  Checkbox,
  Divider,
  Form,
  Input,
  Typography,
} from 'antd';
import { createStyles } from 'antd-style';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { flushSync } from 'react-dom';
import { setToken } from '@/utils/auth';
import { Footer } from '@/components';
import { login, getLoginOptions } from '@/services/rustdesk-console/auth';
import Settings from '../../../../config/defaultSettings';

// --- Auth step types ---
type AuthStep = 'account' | 'email_check' | 'tfa_check';

// --- Session data for 2nd-step verification ---
type VerifySession = {
  username: string;
  secret: string;
  emailHint?: string;
};

// --- Device info ---
function getDeviceInfo(): API.DeviceInfo {
  const ua = navigator.userAgent;
  let os = 'Unknown';
  if (ua.includes('Win')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  let browserName = 'Unknown';
  if (ua.includes('Firefox')) browserName = 'Firefox';
  else if (ua.includes('Edg')) browserName = 'Edge';
  else if (ua.includes('Chrome')) browserName = 'Chrome';
  else if (ua.includes('Safari')) browserName = 'Safari';

  return { os, type: 'browser', name: browserName };
}

// --- OIDC icon mapping ---
const OIDC_ICONS: Record<string, React.ReactNode> = {
  github: <GithubOutlined style={{ fontSize: 20 }} />,
};

const OIDC_LABELS: Record<string, string> = {
  github: 'GitHub',
  gitlab: 'GitLab',
  google: 'Google',
};

// --- Styles ---
const useStyles = createStyles(({ token }) => ({
  lang: {
    width: 42,
    height: 42,
    lineHeight: '42px',
    position: 'fixed',
    right: 16,
    borderRadius: token.borderRadius,
    ':hover': {
      backgroundColor: token.colorBgTextHover,
    },
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'auto',
    backgroundImage:
      "url('https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/V-_oS6r-i7wAAAAAAAAAAAAAFl94AQBr')",
    backgroundSize: '100% 100%',
  },
  loginFormExtra: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  forgotPassword: {
    color: token.colorPrimary,
    cursor: 'pointer',
    transition: `color ${token.motionDurationMid} ${token.motionEaseInOut}`,
    ':hover': {
      color: token.colorPrimaryHover,
      textDecoration: 'underline',
    },
  },
  verifySection: {
    marginTop: 8,
    opacity: 0,
    animation: `fadeIn ${token.motionDurationSlow} ${token.motionEaseInOut} forwards`,
  },
  verifyHint: {
    color: token.colorTextSecondary,
    marginBottom: 16,
    fontSize: 14,
  },
  otpInput: {
    justifyContent: 'center',
    marginBottom: 24,
  },
  oidcSection: {
    marginTop: 24,
  },
  oidcDivider: {
    color: token.colorTextSecondary,
    fontSize: 13,
  },
  oidcButton: {
    width: '100%',
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  verifyIcon: {
    fontSize: 40,
    color: token.colorPrimary,
    marginBottom: 12,
  },
  '@keyframes fadeIn': {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
}));

// --- Lang selector ---
const Lang = () => {
  const { styles } = useStyles();
  return (
    <div className={styles.lang} data-lang>
      {SelectLang && <SelectLang />}
    </div>
  );
};

// --- Error alert ---
const LoginMessage: React.FC<{ content: string }> = ({ content }) => (
  <Alert style={{ marginBottom: 24 }} message={content} type="error" showIcon />
);

// --- OIDC login buttons ---
const OidcLogin: React.FC<{
  options: API.OidcLoginInfo[];
  loading: boolean;
}> = ({ options, loading }) => {
  const { styles } = useStyles();
  const intl = useIntl();
  const { message } = App.useApp();

  if (options.length === 0) return null;

  return (
    <div className={styles.oidcSection}>
      <Divider className={styles.oidcDivider}>
        {intl.formatMessage({
          id: 'pages.login.oidc.divider',
          defaultMessage: 'Or continue with',
        })}
      </Divider>
      {options.map((item) => {
        const label = OIDC_LABELS[item.name.toLowerCase()] || item.name;
        const icon = OIDC_ICONS[item.name.toLowerCase()];
        return (
          <Button
            key={item.name}
            className={styles.oidcButton}
            disabled={loading}
            onClick={() => {
              message.info(
                intl.formatMessage({
                  id: 'pages.login.oidc.comingSoon',
                  defaultMessage: 'Third-party login is coming soon',
                }),
              );
            }}
          >
            {icon}
            {intl.formatMessage(
              {
                id: 'pages.login.oidc.continueWith',
                defaultMessage: 'Continue with {provider}',
              },
              { provider: label },
            )}
          </Button>
        );
      })}
    </div>
  );
};

// --- Verify Step (shared by email_check and tfa_check) ---
const VerifyStep: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  resetKey: string;
  error: string;
  submitting: boolean;
  onSubmit: (code: string) => void;
  onBack: () => void;
}> = ({
  icon,
  title,
  description,
  resetKey,
  error,
  submitting,
  onSubmit,
  onBack,
}) => {
  const { styles } = useStyles();
  const intl = useIntl();
  const [otpValue, setOtpValue] = useState('');
  const submittingRef = useRef(false);

  // Reset OTP when step changes
  useEffect(() => {
    setOtpValue('');
    submittingRef.current = false;
  }, [resetKey]);

  // Reset ref when submission completes (success or failure)
  useEffect(() => {
    if (!submitting) {
      submittingRef.current = false;
    }
  }, [submitting]);

  const handleSubmit = useCallback(
    (code: string) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      onSubmit(code);
    },
    [onSubmit],
  );

  const handleChange = useCallback(
    (value: string) => {
      setOtpValue(value);
      if (value.length === 6) {
        handleSubmit(value);
      }
    },
    [handleSubmit],
  );

  return (
    <div className={styles.verifySection}>
      {error && <LoginMessage content={error} />}

      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        {icon}
        <Typography.Title level={5}>{title}</Typography.Title>
        <Typography.Text className={styles.verifyHint}>
          {description}
        </Typography.Text>
      </div>

      <Input.OTP
        key={resetKey}
        length={6}
        value={otpValue}
        onChange={handleChange}
        variant="outlined"
        size="large"
        autoFocus
        className={styles.otpInput}
      />

      <Button
        type="primary"
        size="large"
        block
        loading={submitting}
        disabled={otpValue.length < 6}
        onClick={() => handleSubmit(otpValue)}
      >
        {intl.formatMessage({
          id: 'pages.login.verifyCode.submit',
          defaultMessage: 'Verify',
        })}
      </Button>

      <Button
        size="large"
        block
        style={{ marginTop: 12 }}
        icon={<ArrowLeftOutlined />}
        onClick={onBack}
      >
        {intl.formatMessage({
          id: 'pages.login.back',
          defaultMessage: 'Back',
        })}
      </Button>
    </div>
  );
};

// --- Parse OIDC login options from API response ---
function parseOidcOptions(res: string[]): API.OidcLoginInfo[] {
  const ops: API.OidcLoginInfo[] = [];
  for (const item of res) {
    if (item.startsWith('common-oidc/')) {
      try {
        const parsed = JSON.parse(item.substring('common-oidc/'.length));
        if (Array.isArray(parsed)) {
          ops.push(...parsed);
        }
      } catch {
        // Skip malformed JSON entries
      }
    } else if (item.startsWith('oidc/')) {
      ops.push({ name: item.substring('oidc/'.length) });
    }
  }
  return ops;
}

// --- Main Login Component ---
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
  const { initialState, setInitialState } = useModel('@@initialState');
  const { styles } = useStyles();
  const { message } = App.useApp();
  const intl = useIntl();
  const [accountForm] = Form.useForm();

  const isVerifyStep = authStep === 'email_check' || authStep === 'tfa_check';

  // Fetch OIDC login options on mount
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
          setVerifySession({
            username: values.username?.trim() || '',
            secret: msg.secret || '',
            emailHint: msg.user?.email,
          });
          setAuthStep('email_check');
          message.info(
            intl.formatMessage({
              id: 'pages.login.emailCheck.sent',
              defaultMessage: 'A verification code has been sent to your email',
            }),
          );
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

        // TFA check might follow email check
        if (msg.type === 'tfa_check') {
          setVerifySession((prev) =>
            prev ? { ...prev, secret: msg.secret || '' } : null,
          );
          setAuthStep('tfa_check');
          return;
        }

        if (msg.type === 'email_check') {
          setVerifySession((prev) =>
            prev
              ? {
                  ...prev,
                  secret: msg.secret || '',
                  emailHint: msg.user?.email,
                }
              : null,
          );
          setAuthStep('email_check');
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
          {/* Account Login Step */}
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

              <OidcLogin options={oidcOptions} loading={submitting} />
            </div>
          )}

          {/* Email Verification Step */}
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

          {/* TFA Verification Step */}
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
        </LoginForm>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
