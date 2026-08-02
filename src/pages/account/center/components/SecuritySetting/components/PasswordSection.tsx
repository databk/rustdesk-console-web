import { FormattedMessage, useIntl } from '@umijs/max';
import { Button, Card, Flex, Form, Input, Modal, Space, Tag } from 'antd';
import type { FormInstance } from 'antd';
import { KeyOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';
import React from 'react';

interface PasswordSectionProps {
  isThirdPartyUser: boolean;
  hasPassword: boolean;
  passwordModalOpen: boolean;
  passwordLoading: boolean;
  passwordForm: FormInstance<{
    current_password: string;
    new_password: string;
    confirm_password: string;
  }>;
  onChangePasswordClick: () => void;
  onSubmit: () => Promise<void>;
  onCancel: () => void;
}

const PasswordSection: React.FC<PasswordSectionProps> = ({
  isThirdPartyUser,
  hasPassword,
  passwordModalOpen,
  passwordLoading,
  passwordForm,
  onChangePasswordClick,
  onSubmit,
  onCancel,
}) => {
  const intl = useIntl();

  return (
    <>
      <Card
        title={
          <Space>
            <LockOutlined />
            <FormattedMessage
              id="pages.account.security.password"
              defaultMessage="Login Password"
            />
          </Space>
        }
        styles={{ body: { padding: '16px 24px' } }}
      >
        <Flex vertical gap="middle">
          <Flex align="center" justify="space-between">
            <FormattedMessage
              id="pages.account.security.password"
              defaultMessage="Login Password"
            />
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
          </Flex>
          <Button
            type="primary"
            icon={<KeyOutlined />}
            onClick={onChangePasswordClick}
            disabled={isThirdPartyUser || !hasPassword}
            block
          >
            <FormattedMessage
              id="pages.account.security.changePassword"
              defaultMessage="Change Password"
            />
          </Button>
        </Flex>
      </Card>

      <Modal
        title={
          <FormattedMessage
            id="pages.account.security.changePassword"
            defaultMessage="Change Password"
          />
        }
        open={passwordModalOpen}
        onCancel={onCancel}
        onOk={() => passwordForm.submit()}
        confirmLoading={passwordLoading}
        okText={intl.formatMessage({
          id: 'pages.account.security.changePassword',
          defaultMessage: 'Change Password',
        })}
      >
        <Form form={passwordForm} layout="vertical" onFinish={onSubmit}>
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
    </>
  );
};

export default PasswordSection;
