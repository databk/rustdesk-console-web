import {
  LockOutlined,
  SafetyCertificateOutlined,
  UnlockOutlined,
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
  Space,
  Tag,
  Typography,
} from 'antd';
import { QRCodeSVG } from 'qrcode.react';
import React, { useState } from 'react';
import { setup2FA, verify2FA, disable2FA } from '@/services/rustdesk-console';

const { Text, Paragraph } = Typography;

const SecuritySetting: React.FC = () => {
  const intl = useIntl();
  const { initialState, refresh } = useModel('@@initialState');
  const { currentUser } = initialState || {};
  const is2FAEnabled = currentUser?.tfa_enabled === true;

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

  const handleSetup2FA = async () => {
    try {
      setSetupLoading(true);
      const data = await setup2FA();
      setSetupData(data);
      setSetupModalOpen(true);
    } catch (error: any) {
      messageApi.error(
        error?.data?.message ||
          intl.formatMessage({
            id: 'pages.account.security.setupFailed',
            defaultMessage: 'Failed to setup 2FA',
          }),
      );
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
      messageApi.error(
        error?.data?.message ||
          intl.formatMessage({
            id: 'pages.account.security.enableFailed',
            defaultMessage: 'Failed to enable 2FA',
          }),
      );
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
      messageApi.error(
        error?.data?.message ||
          intl.formatMessage({
            id: 'pages.account.security.disableFailed',
            defaultMessage: 'Failed to disable 2FA',
          }),
      );
    } finally {
      setDisableLoading(false);
    }
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
    </>
  );
};

export default SecuritySetting;
