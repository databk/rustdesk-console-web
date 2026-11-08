import { SettingOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { App, Divider, Form, Input, Modal } from 'antd';
import React from 'react';
import {
  getCustomClientSettings,
  updateCustomClientSettings,
} from '@/services/rustdesk-console/custom-client';
import LogoManager from './LogoManager';

const TOKEN_MASK = '******';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onClose,
  onSaved,
}) => {
  const intl = useIntl();
  const { message: msgApi } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      getCustomClientSettings()
        .then((settings) => {
          form.setFieldsValue(settings);
        })
        .catch(() => {
          msgApi.error('Failed to load settings');
        });
    }
  }, [open, form, msgApi]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await updateCustomClientSettings(values);
      msgApi.success('Settings saved');
      onClose();
      onSaved();
    } catch {
      msgApi.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <span>
          <SettingOutlined />{' '}
          {intl.formatMessage({
            id: 'pages.customClient.settings',
            defaultMessage: 'Custom Client Settings',
          })}
        </span>
      }
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={loading}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="githubToken"
          label={intl.formatMessage({
            id: 'pages.customClient.githubToken',
            defaultMessage: 'GitHub Token',
          })}
          tooltip={intl.formatMessage({
            id: 'pages.customClient.githubTokenTip',
            defaultMessage:
              'Personal access token with repo and workflow scopes',
          })}
        >
          <Input.Password
            placeholder={TOKEN_MASK}
            autoComplete="new-password"
          />
        </Form.Item>
        <Form.Item
          name="generatorRepo"
          label={intl.formatMessage({
            id: 'pages.customClient.generatorRepo',
            defaultMessage: 'Generator Repository',
          })}
          tooltip="owner/repo format, e.g. databk/rustdesk-generator"
        >
          <Input placeholder="databk/rustdesk-generator" />
        </Form.Item>
        <Form.Item
          name="generatorRef"
          label={intl.formatMessage({
            id: 'pages.customClient.generatorRef',
            defaultMessage: 'Generator Branch/Tag',
          })}
        >
          <Input placeholder="main" />
        </Form.Item>

        <Divider titlePlacement="left" plain>
          {intl.formatMessage({
            id: 'pages.customClient.signingKeys',
            defaultMessage: 'Signing Keys',
          })}
        </Divider>

        <Form.Item
          name="signingPublicKey"
          label={intl.formatMessage({
            id: 'pages.customClient.signingPublicKey',
            defaultMessage: 'Signing Public Key',
          })}
          tooltip={intl.formatMessage({
            id: 'pages.customClient.signingPublicKeyTip',
            defaultMessage:
              'Ed25519 public key in base64 (44 chars ending with =)',
          })}
        >
          <Input placeholder="base64 encoded public key" />
        </Form.Item>
        <Form.Item
          name="signingPrivateKey"
          label={intl.formatMessage({
            id: 'pages.customClient.signingPrivateKey',
            defaultMessage: 'Signing Private Key',
          })}
          tooltip={intl.formatMessage({
            id: 'pages.customClient.signingPrivateKeyTip',
            defaultMessage:
              'Ed25519 private key in base64. Leave as ****** to keep existing key.',
          })}
        >
          <Input.Password
            placeholder={TOKEN_MASK}
            autoComplete="new-password"
          />
        </Form.Item>

        <Divider titlePlacement="left" plain>
          {intl.formatMessage({
            id: 'pages.customClient.logoManagement',
            defaultMessage: 'Logo Management',
          })}
        </Divider>

        <LogoManager open={open} />
      </Form>
    </Modal>
  );
};

export default SettingsModal;
