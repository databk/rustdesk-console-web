import {
  LockOutlined,
  SafetyCertificateOutlined,
  UnlockOutlined,
  KeyOutlined,
  PlusOutlined,
  DeleteOutlined,
  GlobalOutlined,
  DesktopOutlined,
} from '@ant-design/icons';
import { useIntl, FormattedMessage, useModel } from '@umijs/max';
import {
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  message as messageApi,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { QRCodeSVG } from 'qrcode.react';
import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import {
  setup2FA,
  verify2FA,
  disable2FA,
  changePassword,
  getPasskeyList,
  deletePasskey,
  togglePasskeyTfa,
  passkeyRegisterBegin,
  passkeyRegisterVerify,
  getSessions,
  revokeSession,
} from '@/services/rustdesk-console';
import { getTokenJti } from '@/utils/auth';
import {
  isWebAuthnSupported,
  prepareCreationOptions,
  serializeRegistrationResponse,
} from '@/utils/webauthn';

const { Text, Paragraph } = Typography;

const SecuritySetting: React.FC = () => {
  const intl = useIntl();
  const { initialState, refresh } = useModel('@@initialState');
  const { currentUser } = initialState || {};
  const is2FAEnabled = currentUser?.tfa_enabled === true;
  const isThirdPartyUser = !!currentUser?.third_auth_type;
  const hasPassword = currentUser?.has_password !== false;

  // Enable 2FA states
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [setupData, setSetupData] = useState<API.Setup2FAResponse | null>(null);
  const [verifyForm] = Form.useForm();

  // Disable 2FA states
  const [disableModalOpen, setDisableModalOpen] = useState(false);
  const [disableLoading, setDisableLoading] = useState(false);
  const [disableForm] = Form.useForm();

  // Change password states
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordForm] = Form.useForm();

  // Passkey states
  const [passkeyList, setPasskeyList] = useState<API.PasskeyCredential[]>([]);
  const [passkeyListLoading, setPasskeyListLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [registerConfirmLoading, setRegisterConfirmLoading] = useState(false);
  const [registerName, setRegisterName] = useState('');
  const [pendingRegistration, setPendingRegistration] =
    useState<API.RegistrationResponseJSON | null>(null);
  const [passkeyTfaLoading, setPasskeyTfaLoading] = useState(false);

  // Session states
  const [sessionList, setSessionList] = useState<API.SessionItem[]>([]);
  const [sessionListLoading, setSessionListLoading] = useState(false);
  const [revokeLoadingJti, setRevokeLoadingJti] = useState<string | null>(null);
  const currentJti = getTokenJti();

  const isPasskeyTfaEnabled =
    currentUser?.info?.other?.passkey_tfa_enabled === true;
  const passkeySupported = isWebAuthnSupported();

  const fetchPasskeyList = async () => {
    setPasskeyListLoading(true);
    try {
      const list = await getPasskeyList();
      setPasskeyList(list);
    } catch {
      // ignore
    } finally {
      setPasskeyListLoading(false);
    }
  };

  useEffect(() => {
    fetchPasskeyList();
  }, []);

  const fetchSessionList = async () => {
    setSessionListLoading(true);
    try {
      const list = await getSessions();
      setSessionList(list);
    } catch {
      // ignore
    } finally {
      setSessionListLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionList();
  }, []);

  const handleRevokeSession = async (jti: string) => {
    setRevokeLoadingJti(jti);
    try {
      await revokeSession(jti);
      messageApi.success(
        intl.formatMessage({
          id: 'pages.account.security.sessions.revokeSuccess',
          defaultMessage: 'Session revoked successfully',
        }),
      );
      await fetchSessionList();
    } catch {
    } finally {
      setRevokeLoadingJti(null);
    }
  };

  const handleRegisterPasskey = async () => {
    setRegisterLoading(true);
    try {
      const options = await passkeyRegisterBegin();
      const publicKey = prepareCreationOptions(options);
      const credential = await navigator.credentials.create({ publicKey });
      if (!credential || !(credential instanceof PublicKeyCredential)) {
        throw new Error('No credential returned');
      }
      const response = serializeRegistrationResponse(credential);
      setPendingRegistration(response);
      setRegisterName('');
      setRegisterModalOpen(true);
    } catch (error: unknown) {
      // NotAllowedError means user cancelled, ignore; other errors handled by global error handler
      const err = error as { name?: string };
      if (err?.name === 'NotAllowedError') {
        // User cancelled the passkey registration, no action needed
      }
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleConfirmRegister = async () => {
    if (!pendingRegistration) return;
    setRegisterConfirmLoading(true);
    try {
      await passkeyRegisterVerify({
        response: pendingRegistration,
        name: registerName || undefined,
      });
      messageApi.success(
        intl.formatMessage({
          id: 'pages.account.security.passkey.registerSuccess',
          defaultMessage: 'Passkey registered successfully',
        }),
      );
      setRegisterModalOpen(false);
      setPendingRegistration(null);
      await fetchPasskeyList();
      await refresh();
    } catch {
    } finally {
      setRegisterConfirmLoading(false);
    }
  };

  const handleDeletePasskey = async (guid: string) => {
    try {
      await deletePasskey(guid);
      messageApi.success(
        intl.formatMessage({
          id: 'pages.account.security.passkey.deleteSuccess',
          defaultMessage: 'Passkey deleted successfully',
        }),
      );
      await fetchPasskeyList();
      await refresh();
    } catch {
    }
  };

  const handleTogglePasskeyTfa = async (enabled: boolean) => {
    setPasskeyTfaLoading(true);
    try {
      await togglePasskeyTfa({ enabled });
      messageApi.success(
        intl.formatMessage({
          id: enabled
            ? 'pages.account.security.passkey.tfaEnabled'
            : 'pages.account.security.passkey.tfaDisabled',
          defaultMessage: enabled
            ? 'Passkey TFA enabled'
            : 'Passkey TFA disabled',
        }),
      );
      await refresh();
    } catch {
    } finally {
      setPasskeyTfaLoading(false);
    }
  };

  const handleSetup2FA = async () => {
    try {
      setSetupLoading(true);
      const data = await setup2FA();
      setSetupData(data);
      setSetupModalOpen(true);
    } catch {
    } finally {
      setSetupLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    try {
      const values = await verifyForm.validateFields();
      setVerifyLoading(true);
      await verify2FA({ code: values.code });
      messageApi.success(
        intl.formatMessage({
          id: 'pages.account.security.enableSuccess',
          defaultMessage: '2FA enabled successfully',
        }),
      );
      setSetupModalOpen(false);
      setSetupData(null);
      verifyForm.resetFields();
      await refresh();
    } catch (error: any) {
      if (error?.errorFields) return;
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    try {
      const values = await disableForm.validateFields();
      setDisableLoading(true);
      await disable2FA({ code: values.code });
      messageApi.success(
        intl.formatMessage({
          id: 'pages.account.security.disableSuccess',
          defaultMessage: '2FA disabled successfully',
        }),
      );
      setDisableModalOpen(false);
      disableForm.resetFields();
      await refresh();
    } catch (error: any) {
      if (error?.errorFields) return;
    } finally {
      setDisableLoading(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      const values = await passwordForm.validateFields();
      setPasswordLoading(true);
      await changePassword({
        current_password: values.current_password,
        new_password: values.new_password,
      });
      messageApi.success(
        intl.formatMessage({
          id: 'pages.account.security.changePasswordSuccess',
          defaultMessage: 'Password changed successfully',
        }),
      );
      setPasswordModalOpen(false);
      passwordForm.resetFields();
    } catch (error: any) {
      if (error?.errorFields) return;
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleChangePasswordClick = () => {
    if (isThirdPartyUser) {
      messageApi.warning(
        intl.formatMessage({
          id: 'pages.account.security.thirdPartyUser',
          defaultMessage: 'Third-party login users cannot change password',
        }),
      );
      return;
    }
    if (!hasPassword) {
      messageApi.warning(
        intl.formatMessage({
          id: 'pages.account.security.noPasswordUser',
          defaultMessage: 'No password set for this account',
        }),
      );
      return;
    }
    setPasswordModalOpen(true);
  };

  return (
    <>
      <Card
        title={
          <FormattedMessage
            id="pages.account.security.title"
            defaultMessage="Security Settings"
          />
        }
      >
        <Descriptions column={1}>
          <Descriptions.Item
            label={
              <FormattedMessage
                id="pages.account.security.2faStatus"
                defaultMessage="2FA Status"
              />
            }
          >
            <Space>
              {is2FAEnabled ? (
                <Tag icon={<SafetyCertificateOutlined />} color="success">
                  <FormattedMessage
                    id="pages.account.security.enabled"
                    defaultMessage="Enabled"
                  />
                </Tag>
              ) : (
                <Tag icon={<UnlockOutlined />} color="default">
                  <FormattedMessage
                    id="pages.account.security.disabled"
                    defaultMessage="Disabled"
                  />
                </Tag>
              )}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item
            label={
              <FormattedMessage
                id="pages.account.security.2faAction"
                defaultMessage="Action"
              />
            }
          >
            {is2FAEnabled ? (
              <Button
                danger
                icon={<UnlockOutlined />}
                onClick={() => setDisableModalOpen(true)}
              >
                <FormattedMessage
                  id="pages.account.security.disable2FA"
                  defaultMessage="Disable 2FA"
                />
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<LockOutlined />}
                onClick={handleSetup2FA}
                loading={setupLoading}
              >
                <FormattedMessage
                  id="pages.account.security.enable2FA"
                  defaultMessage="Enable 2FA"
                />
              </Button>
            )}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card
        title={
          <FormattedMessage
            id="pages.account.security.password"
            defaultMessage="Login Password"
          />
        }
        style={{ marginTop: 24 }}
      >
        <Descriptions column={1}>
          <Descriptions.Item
            label={
              <FormattedMessage
                id="pages.account.security.password"
                defaultMessage="Login Password"
              />
            }
          >
            <Space>
              {isThirdPartyUser ? (
                <Tag color="warning">
                  <FormattedMessage
                    id="pages.account.security.thirdPartyUser"
                    defaultMessage="Third-party login users cannot change password"
                  />
                </Tag>
              ) : hasPassword ? (
                <Tag icon={<KeyOutlined />} color="success">
                  <FormattedMessage
                    id="pages.account.security.passwordSet"
                    defaultMessage="Set"
                  />
                </Tag>
              ) : (
                <Tag icon={<UnlockOutlined />} color="default">
                  <FormattedMessage
                    id="pages.account.security.passwordNotSet"
                    defaultMessage="Not Set"
                  />
                </Tag>
              )}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item
            label={
              <FormattedMessage
                id="pages.account.security.2faAction"
                defaultMessage="Action"
              />
            }
          >
            <Button
              type="primary"
              icon={<KeyOutlined />}
              onClick={handleChangePasswordClick}
              disabled={isThirdPartyUser || !hasPassword}
            >
              <FormattedMessage
                id="pages.account.security.changePassword"
                defaultMessage="Change Password"
              />
            </Button>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card
        title={
          <FormattedMessage
            id="pages.account.security.passkey.title"
            defaultMessage="Passkey Management"
          />
        }
        style={{ marginTop: 24 }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {passkeySupported && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleRegisterPasskey}
              loading={registerLoading}
            >
              <FormattedMessage
                id="pages.account.security.passkey.register"
                defaultMessage="Register Passkey"
              />
            </Button>
          )}

          <Table
            dataSource={passkeyList}
            rowKey="guid"
            loading={passkeyListLoading}
            size="small"
            pagination={false}
            locale={{
              emptyText: intl.formatMessage({
                id: 'pages.account.security.passkey.noCredentials',
                defaultMessage: 'No Passkeys registered',
              }),
            }}
            columns={[
              {
                title: intl.formatMessage({
                  id: 'pages.account.security.passkey.name',
                  defaultMessage: 'Name',
                }),
                dataIndex: 'name',
                key: 'name',
                render: (name: string) => name || '-',
              },
              {
                title: intl.formatMessage({
                  id: 'pages.account.security.passkey.deviceType',
                  defaultMessage: 'Device Type',
                }),
                dataIndex: 'deviceType',
                key: 'deviceType',
                render: (type: string) => (
                  <Tag>
                    {type === 'multiDevice'
                      ? intl.formatMessage({
                          id: 'pages.account.security.passkey.multiDevice',
                          defaultMessage: 'Multi-device',
                        })
                      : intl.formatMessage({
                          id: 'pages.account.security.passkey.singleDevice',
                          defaultMessage: 'Single-device',
                        })}
                  </Tag>
                ),
              },
              {
                title: intl.formatMessage({
                  id: 'pages.account.security.passkey.createdAt',
                  defaultMessage: 'Created At',
                }),
                dataIndex: 'createdAt',
                key: 'createdAt',
                render: (date: string) =>
                  date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
              },
              {
                title: intl.formatMessage({
                  id: 'pages.common.action',
                  defaultMessage: 'Action',
                }),
                key: 'action',
                width: 100,
                render: (_: unknown, record: API.PasskeyCredential) => (
                  <Popconfirm
                    title={intl.formatMessage({
                      id: 'pages.account.security.passkey.deleteConfirm',
                      defaultMessage: 'Are you sure to delete this Passkey?',
                    })}
                    onConfirm={() => handleDeletePasskey(record.guid)}
                  >
                    <Button danger size="small" icon={<DeleteOutlined />}>
                      <FormattedMessage
                        id="pages.common.delete"
                        defaultMessage="Delete"
                      />
                    </Button>
                  </Popconfirm>
                ),
              },
            ]}
          />

          <Descriptions column={1}>
            <Descriptions.Item
              label={
                <FormattedMessage
                  id="pages.account.security.passkey.tfaStatus"
                  defaultMessage="Passkey TFA"
                />
              }
            >
              <Space>
                <Switch
                  checked={isPasskeyTfaEnabled}
                  loading={passkeyTfaLoading}
                  onChange={handleTogglePasskeyTfa}
                  disabled={passkeyList.length === 0}
                />
                {isPasskeyTfaEnabled ? (
                  <Tag color="success">
                    <FormattedMessage
                      id="pages.account.security.enabled"
                      defaultMessage="Enabled"
                    />
                  </Tag>
                ) : (
                  <Tag color="default">
                    <FormattedMessage
                      id="pages.account.security.disabled"
                      defaultMessage="Disabled"
                    />
                  </Tag>
                )}
              </Space>
            </Descriptions.Item>
          </Descriptions>
        </Space>
      </Card>

      <Card
        title={
          <FormattedMessage
            id="pages.account.security.sessions.title"
            defaultMessage="Login Sessions"
          />
        }
        style={{ marginTop: 24 }}
      >
        <Table
          dataSource={sessionList}
          rowKey="jti"
          loading={sessionListLoading}
          size="small"
          pagination={false}
          locale={{
            emptyText: intl.formatMessage({
              id: 'pages.account.security.sessions.noSessions',
              defaultMessage: 'No active sessions',
            }),
          }}
          columns={[
            {
              title: intl.formatMessage({
                id: 'pages.account.security.sessions.device',
                defaultMessage: 'Device',
              }),
              key: 'device',
              render: (_: unknown, record: API.SessionItem) => (
                <Space>
                  {record.deviceType === 'client' ? (
                    <DesktopOutlined />
                  ) : (
                    <GlobalOutlined />
                  )}
                  <span>{record.deviceName || '-'}</span>
                  {record.jti === currentJti && (
                    <Tag color="blue">
                      <FormattedMessage
                        id="pages.account.security.sessions.current"
                        defaultMessage="Current"
                      />
                    </Tag>
                  )}
                </Space>
              ),
            },
            {
              title: intl.formatMessage({
                id: 'pages.account.security.sessions.type',
                defaultMessage: 'Type',
              }),
              dataIndex: 'deviceType',
              key: 'deviceType',
              render: (type: string) => (
                <Tag>
                  {type === 'client'
                    ? intl.formatMessage({
                        id: 'pages.account.security.sessions.client',
                        defaultMessage: 'Client',
                      })
                    : intl.formatMessage({
                        id: 'pages.account.security.sessions.browser',
                        defaultMessage: 'Browser',
                      })}
                </Tag>
              ),
            },
            {
              title: intl.formatMessage({
                id: 'pages.account.security.sessions.os',
                defaultMessage: 'OS',
              }),
              dataIndex: 'deviceOs',
              key: 'deviceOs',
              render: (os: string) => os || '-',
            },
            {
              title: intl.formatMessage({
                id: 'pages.account.security.sessions.createdAt',
                defaultMessage: 'Created At',
              }),
              dataIndex: 'createdAt',
              key: 'createdAt',
              render: (date: string) =>
                date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
            },
            {
              title: intl.formatMessage({
                id: 'pages.account.security.sessions.expiresAt',
                defaultMessage: 'Expires At',
              }),
              dataIndex: 'expiresAt',
              key: 'expiresAt',
              render: (date: string) =>
                date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
            },
            {
              title: intl.formatMessage({
                id: 'pages.common.action',
                defaultMessage: 'Action',
              }),
              key: 'action',
              width: 100,
              render: (_: unknown, record: API.SessionItem) => {
                const isCurrent = record.jti === currentJti;
                if (isCurrent) {
                  return (
                    <Tooltip
                      title={intl.formatMessage({
                        id: 'pages.account.security.sessions.cannotRevokeCurrent',
                        defaultMessage: 'Cannot revoke current session',
                      })}
                    >
                      <Button
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        disabled
                      >
                        <FormattedMessage
                          id="pages.account.security.sessions.revoke"
                          defaultMessage="Revoke"
                        />
                      </Button>
                    </Tooltip>
                  );
                }
                return (
                  <Popconfirm
                    title={intl.formatMessage({
                      id: 'pages.account.security.sessions.revokeConfirm',
                      defaultMessage: 'Are you sure to revoke this session?',
                    })}
                    onConfirm={() => handleRevokeSession(record.jti)}
                  >
                    <Button
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      loading={revokeLoadingJti === record.jti}
                    >
                      <FormattedMessage
                        id="pages.account.security.sessions.revoke"
                        defaultMessage="Revoke"
                      />
                    </Button>
                  </Popconfirm>
                );
              },
            },
          ]}
        />
      </Card>

      {/* Setup & Verify 2FA Modal */}
      <Modal
        title={
          <FormattedMessage
            id="pages.account.security.setup2FA"
            defaultMessage="Setup 2FA"
          />
        }
        open={setupModalOpen}
        onCancel={() => {
          setSetupModalOpen(false);
          setSetupData(null);
          verifyForm.resetFields();
        }}
        footer={null}
        width={480}
      >
        {setupData && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div style={{ textAlign: 'center' }}>
              <QRCodeSVG value={setupData.otpauth_url} size={200} />
            </div>
            <Paragraph>
              <FormattedMessage
                id="pages.account.security.scanQRCode"
                defaultMessage="Scan the QR code with your authenticator app, then enter the verification code below."
              />
            </Paragraph>
            <Descriptions column={1} size="small">
              <Descriptions.Item
                label={
                  <FormattedMessage
                    id="pages.account.security.secretKey"
                    defaultMessage="Secret Key"
                  />
                }
              >
                <Text copyable code>
                  {setupData.secret}
                </Text>
              </Descriptions.Item>
            </Descriptions>
            <Form form={verifyForm} layout="vertical">
              <Form.Item
                name="code"
                label={
                  <FormattedMessage
                    id="pages.account.security.verificationCode"
                    defaultMessage="Verification Code"
                  />
                }
                rules={[
                  {
                    required: true,
                    message: intl.formatMessage({
                      id: 'pages.account.security.enterCode',
                      defaultMessage: 'Please enter verification code',
                    }),
                  },
                ]}
              >
                <Input.OTP length={6} />
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  onClick={handleVerify2FA}
                  loading={verifyLoading}
                  block
                >
                  <FormattedMessage
                    id="pages.account.security.verifyAndEnable"
                    defaultMessage="Verify & Enable"
                  />
                </Button>
              </Form.Item>
            </Form>
          </Space>
        )}
      </Modal>

      {/* Disable 2FA Modal */}
      <Modal
        title={
          <FormattedMessage
            id="pages.account.security.disable2FA"
            defaultMessage="Disable 2FA"
          />
        }
        open={disableModalOpen}
        onCancel={() => {
          setDisableModalOpen(false);
          disableForm.resetFields();
        }}
        footer={null}
      >
        <Form form={disableForm} layout="vertical">
          <Form.Item
            name="code"
            label={
              <FormattedMessage
                id="pages.account.security.currentCode"
                defaultMessage="Current Verification Code"
              />
            }
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'pages.account.security.enterCode',
                  defaultMessage: 'Please enter verification code',
                }),
              },
            ]}
          >
            <Input.OTP length={6} />
          </Form.Item>
          <Form.Item>
            <Button
              danger
              type="primary"
              onClick={handleDisable2FA}
              loading={disableLoading}
              block
            >
              <FormattedMessage
                id="pages.account.security.confirmDisable"
                defaultMessage="Confirm Disable"
              />
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        title={
          <FormattedMessage
            id="pages.account.security.changePassword"
            defaultMessage="Change Password"
          />
        }
        open={passwordModalOpen}
        onCancel={() => {
          setPasswordModalOpen(false);
          passwordForm.resetFields();
        }}
        onOk={() => passwordForm.submit()}
        confirmLoading={passwordLoading}
        okText={intl.formatMessage({
          id: 'pages.account.security.changePassword',
          defaultMessage: 'Change Password',
        })}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
        >
          <Form.Item
            name="current_password"
            label={
              <FormattedMessage
                id="pages.account.security.currentPassword"
                defaultMessage="Current Password"
              />
            }
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'pages.account.security.enterCurrentPassword',
                  defaultMessage: 'Please enter current password',
                }),
              },
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="new_password"
            label={
              <FormattedMessage
                id="pages.account.security.newPassword"
                defaultMessage="New Password"
              />
            }
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'pages.account.security.enterNewPassword',
                  defaultMessage:
                    'Please enter new password (min 6 characters)',
                }),
              },
              {
                min: 6,
                message: intl.formatMessage({
                  id: 'pages.account.security.passwordMinLength',
                  defaultMessage: 'Password must be at least 6 characters',
                }),
              },
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="confirm_password"
            label={
              <FormattedMessage
                id="pages.account.security.confirmNewPassword"
                defaultMessage="Confirm New Password"
              />
            }
            dependencies={['new_password']}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'pages.account.security.confirmNewPasswordPlaceholder',
                  defaultMessage: 'Please re-enter new password',
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
                        id: 'pages.account.security.passwordMismatch',
                        defaultMessage: 'The two passwords do not match',
                      }),
                    ),
                  );
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>

      {/* Passkey Register Name Modal */}
      <Modal
        title={
          <FormattedMessage
            id="pages.account.security.passkey.namePasskey"
            defaultMessage="Name your Passkey"
          />
        }
        open={registerModalOpen}
        onCancel={() => {
          setRegisterModalOpen(false);
          setPendingRegistration(null);
        }}
        onOk={handleConfirmRegister}
        confirmLoading={registerConfirmLoading}
        okText={intl.formatMessage({
          id: 'pages.common.save',
          defaultMessage: 'Save',
        })}
      >
        <Form layout="vertical">
          <Form.Item
            label={
              <FormattedMessage
                id="pages.account.security.passkey.name"
                defaultMessage="Name"
              />
            }
          >
            <Input
              value={registerName}
              onChange={(e) => setRegisterName(e.target.value)}
              placeholder={intl.formatMessage({
                id: 'pages.account.security.passkey.namePlaceholder',
                defaultMessage: 'e.g. MacBook Touch ID',
              })}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default SecuritySetting;
