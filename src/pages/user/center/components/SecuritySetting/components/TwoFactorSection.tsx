import { FormattedMessage, useIntl } from '@umijs/max';
import {
  Button,
  Card,
  Descriptions,
  Flex,
  Form,
  Input,
  Modal,
  Space,
  Tag,
  Typography,
} from 'antd';
import type { FormInstance } from 'antd';
import {
  LockOutlined,
  SafetyCertificateOutlined,
  UnlockOutlined,
} from '@ant-design/icons';
import { QRCodeSVG } from 'qrcode.react';
import React from 'react';

const { Text, Paragraph } = Typography;

interface TwoFactorSectionProps {
  is2FAEnabled: boolean;
  setupModalOpen: boolean;
  setupLoading: boolean;
  verifyLoading: boolean;
  setupData: API.Setup2FAResponse | null;
  verifyForm: FormInstance<{ code: string }>;
  disableModalOpen: boolean;
  disableLoading: boolean;
  disableForm: FormInstance<{ code: string }>;
  onSetup: () => Promise<void>;
  onVerify: () => Promise<void>;
  onDisable: () => Promise<void>;
  onOpenDisable: () => void;
  onCloseSetup: () => void;
  onCloseDisable: () => void;
}

const TwoFactorSection: React.FC<TwoFactorSectionProps> = ({
  is2FAEnabled,
  setupModalOpen,
  setupLoading,
  verifyLoading,
  setupData,
  verifyForm,
  disableModalOpen,
  disableLoading,
  disableForm,
  onSetup,
  onVerify,
  onDisable,
  onOpenDisable,
  onCloseSetup,
  onCloseDisable,
}) => {
  const intl = useIntl();

  return (
    <>
      <Card
        title={
          <Space>
            <SafetyCertificateOutlined />
            <FormattedMessage
              id="pages.user.center.security.title"
              defaultMessage="Security Settings"
            />
          </Space>
        }
        styles={{ body: { padding: '16px 24px' } }}
      >
        <Flex vertical gap="middle">
          <Flex align="center" justify="space-between">
            <FormattedMessage
              id="pages.user.center.security.2faStatus"
              defaultMessage="2FA Status"
            />
            {is2FAEnabled ? (
              <Tag icon={<SafetyCertificateOutlined />} color="success">
                <FormattedMessage
                  id="pages.user.center.security.enabled"
                  defaultMessage="Enabled"
                />
              </Tag>
            ) : (
              <Tag icon={<UnlockOutlined />} color="default">
                <FormattedMessage
                  id="pages.user.center.security.disabled"
                  defaultMessage="Disabled"
                />
              </Tag>
            )}
          </Flex>
          {is2FAEnabled ? (
            <Button
              danger
              icon={<UnlockOutlined />}
              onClick={onOpenDisable}
              block
            >
              <FormattedMessage
                id="pages.user.center.security.disable2FA"
                defaultMessage="Disable 2FA"
              />
            </Button>
          ) : (
            <Button
              type="primary"
              icon={<LockOutlined />}
              onClick={onSetup}
              loading={setupLoading}
              block
            >
              <FormattedMessage
                id="pages.user.center.security.enable2FA"
                defaultMessage="Enable 2FA"
              />
            </Button>
          )}
        </Flex>
      </Card>

      <Modal
        title={
          <FormattedMessage
            id="pages.user.center.security.setup2FA"
            defaultMessage="Setup Two-Factor Authentication"
          />
        }
        open={setupModalOpen}
        onCancel={onCloseSetup}
        footer={null}
        width={480}
      >
        {setupData && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div style={{ textAlign: 'center' }}>
              <QRCodeSVG value={setupData.otpauth_url} size={200} />
            </div>
            <Paragraph type="secondary">
              <FormattedMessage
                id="pages.user.center.security.scanQRCode"
                defaultMessage="Scan the QR code with your authenticator app, then enter the verification code below."
              />
            </Paragraph>
            <Descriptions column={1} size="small">
              <Descriptions.Item
                label={
                  <FormattedMessage
                    id="pages.user.center.security.secretKey"
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
                    id="pages.user.center.security.verificationCode"
                    defaultMessage="Verification Code"
                  />
                }
                rules={[
                  {
                    required: true,
                    message: intl.formatMessage({
                      id: 'pages.user.center.security.enterCode',
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
                  onClick={onVerify}
                  loading={verifyLoading}
                  block
                >
                  <FormattedMessage
                    id="pages.user.center.security.verifyAndEnable"
                    defaultMessage="Verify & Enable"
                  />
                </Button>
              </Form.Item>
            </Form>
          </Space>
        )}
      </Modal>

      <Modal
        title={
          <FormattedMessage
            id="pages.user.center.security.disable2FA"
            defaultMessage="Disable 2FA"
          />
        }
        open={disableModalOpen}
        onCancel={onCloseDisable}
        footer={null}
      >
        <Form form={disableForm} layout="vertical">
          <Form.Item
            name="code"
            label={
              <FormattedMessage
                id="pages.user.center.security.currentCode"
                defaultMessage="Current Verification Code"
              />
            }
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'pages.user.center.security.enterCode',
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
              onClick={onDisable}
              loading={disableLoading}
              block
            >
              <FormattedMessage
                id="pages.user.center.security.confirmDisable"
                defaultMessage="Confirm Disable"
              />
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default TwoFactorSection;
