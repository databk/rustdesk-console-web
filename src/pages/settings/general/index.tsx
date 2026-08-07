import {
  GlobalOutlined,
  HighlightOutlined,
  LinkOutlined,
  SafetyOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { FormattedMessage, useIntl, useModel } from '@umijs/max';
import {
  Alert,
  App,
  Button,
  Card,
  Form,
  Input,
  Select,
  Space,
  Spin,
  Switch,
  Typography,
} from 'antd';
import React, { useEffect, useState } from 'react';
import {
  getGeneralSettings,
  updateGeneralSettings,
} from '@/services/rustdesk-console/settings';
import { isWebAuthnSupported } from '@/utils/webauthn';
import {
  DEFAULT_GENERAL_SETTINGS,
  toFrontendSettings,
} from '@/utils/generalSettings';

const { Title } = Typography;

const LANGUAGE_OPTIONS = [
  { value: 'en-US', label: 'English' },
  { value: 'zh-CN', label: '中文' },
  { value: 'pt-BR', label: 'Português' },
];

const GeneralSettings: React.FC = () => {
  const intl = useIntl();
  const { message } = App.useApp();
  const { setInitialState } = useModel('@@initialState');
  const [form] = Form.useForm<API.GeneralSettings>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const webauthnEnabled = Form.useWatch(['webauthn', 'enabled'], form);
  const passkeySupported = isWebAuthnSupported();

  useEffect(() => {
    void getGeneralSettings({ skipErrorHandler: true })
      .then((settings) => form.setFieldsValue(settings))
      .catch(() => {
        message.error(
          intl.formatMessage({
            id: 'pages.settings.fetchFailed',
            defaultMessage: 'Failed to load settings',
          }),
        );
      })
      .finally(() => setLoading(false));
  }, [form, intl, message]);

  const handleSave = async (values: API.GeneralSettings) => {
    setSaving(true);
    try {
      const saved = await updateGeneralSettings(values);
      form.setFieldsValue(saved);
      setInitialState((state) => ({
        ...state,
        frontendSettings: toFrontendSettings(saved),
      }));
      message.success(
        intl.formatMessage({
          id: 'pages.settings.saveSuccess',
          defaultMessage: 'Settings saved successfully',
        }),
      );
    } catch {
      message.error(
        intl.formatMessage({
          id: 'pages.settings.saveFailed',
          defaultMessage: 'Failed to save settings',
        }),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer title={false}>
      <div style={{ maxWidth: 720 }}>
        <Title level={4} style={{ marginTop: 0, marginBottom: 24 }}>
          <FormattedMessage
            id="pages.settings.general"
            defaultMessage="General Settings"
          />
        </Title>
        <Spin spinning={loading}>
          <Form
            form={form}
            layout="vertical"
            disabled={loading}
            initialValues={DEFAULT_GENERAL_SETTINGS}
            onFinish={handleSave}
            requiredMark={false}
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Card
                title={
                  <Space>
                    <HighlightOutlined />
                    <FormattedMessage
                      id="pages.settings.generalSection.watermark"
                      defaultMessage="Username Watermark"
                    />
                  </Space>
                }
              >
                <Form.Item
                  name="watermarkEnabled"
                  label={
                    <FormattedMessage
                      id="pages.settings.generalSection.watermark"
                      defaultMessage="Username Watermark"
                    />
                  }
                  valuePropName="checked"
                  extra={
                    <FormattedMessage
                      id="pages.settings.generalSection.watermarkExtra"
                      defaultMessage="Overlay the current username on each page for accountability."
                    />
                  }
                >
                  <Switch />
                </Form.Item>
              </Card>

              <Card
                title={
                  <Space>
                    <GlobalOutlined />
                    <FormattedMessage
                      id="pages.settings.generalSection.language"
                      defaultMessage="Default Language"
                    />
                  </Space>
                }
              >
                <Form.Item
                  name="defaultLanguage"
                  label={
                    <FormattedMessage
                      id="pages.settings.generalSection.language"
                      defaultMessage="Default Language"
                    />
                  }
                  extra={
                    <FormattedMessage
                      id="pages.settings.generalSection.languageExtra"
                      defaultMessage="Default UI language for new visitors. Signed-in users keep their own preference."
                    />
                  }
                >
                  <Select
                    options={LANGUAGE_OPTIONS}
                    placeholder={intl.formatMessage({
                      id: 'pages.settings.generalSection.languagePlaceholder',
                      defaultMessage: 'Select default language',
                    })}
                  />
                </Form.Item>
              </Card>

              <Card
                title={
                  <Space>
                    <LinkOutlined />
                    <FormattedMessage
                      id="pages.settings.generalSection.site"
                      defaultMessage="Site"
                    />
                  </Space>
                }
              >
                <Form.Item
                  name={['site', 'frontendUrl']}
                  label={
                    <FormattedMessage
                      id="pages.settings.generalSection.frontendUrl"
                      defaultMessage="Frontend URL"
                    />
                  }
                  rules={[
                    {
                      type: 'url',
                      message: intl.formatMessage({
                        id: 'pages.settings.generalSection.urlInvalid',
                        defaultMessage: 'Please enter a valid URL',
                      }),
                    },
                  ]}
                >
                  <Input
                    placeholder={intl.formatMessage({
                      id: 'pages.settings.generalSection.frontendUrlPlaceholder',
                      defaultMessage: 'https://console.example.com',
                    })}
                  />
                </Form.Item>
                <Form.Item
                  name={['site', 'backendUrl']}
                  label={
                    <FormattedMessage
                      id="pages.settings.generalSection.backendUrl"
                      defaultMessage="Backend URL"
                    />
                  }
                  extra={
                    <FormattedMessage
                      id="pages.settings.generalSection.backendUrlExtra"
                      defaultMessage="Leave blank to use the same origin as the frontend."
                    />
                  }
                  rules={[
                    {
                      type: 'url',
                      message: intl.formatMessage({
                        id: 'pages.settings.generalSection.urlInvalid',
                        defaultMessage: 'Please enter a valid URL',
                      }),
                    },
                  ]}
                >
                  <Input
                    placeholder={intl.formatMessage({
                      id: 'pages.settings.generalSection.backendUrlPlaceholder',
                      defaultMessage: 'https://api.example.com',
                    })}
                  />
                </Form.Item>
              </Card>

              <Card
                title={
                  <Space>
                    <SafetyOutlined />
                    <FormattedMessage
                      id="pages.settings.generalSection.webauthn"
                      defaultMessage="WebAuthn / Passkeys"
                    />
                  </Space>
                }
              >
                {!passkeySupported && (
                  <Alert
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                    message={
                      <FormattedMessage
                        id="pages.settings.generalSection.webauthnUnsupported"
                        defaultMessage="This browser does not support WebAuthn. Passkey login will be unavailable for users on unsupported clients."
                      />
                    }
                  />
                )}
                <Form.Item
                  name={['webauthn', 'enabled']}
                  label={
                    <FormattedMessage
                      id="pages.settings.generalSection.webauthnEnabled"
                      defaultMessage="Enable WebAuthn"
                    />
                  }
                  valuePropName="checked"
                  extra={
                    <FormattedMessage
                      id="pages.settings.generalSection.webauthnEnabledExtra"
                      defaultMessage="Allow users to register and sign in with passkeys."
                    />
                  }
                >
                  <Switch />
                </Form.Item>
                <Form.Item
                  name={['webauthn', 'rpName']}
                  label={
                    <FormattedMessage
                      id="pages.settings.generalSection.rpName"
                      defaultMessage="Relying Party Name"
                    />
                  }
                  extra={
                    <FormattedMessage
                      id="pages.settings.generalSection.rpNameExtra"
                      defaultMessage="Human-friendly name shown in the passkey prompt."
                    />
                  }
                >
                  <Input
                    disabled={!webauthnEnabled}
                    placeholder={intl.formatMessage({
                      id: 'pages.settings.generalSection.rpNamePlaceholder',
                      defaultMessage: 'RustDesk Console',
                    })}
                  />
                </Form.Item>
              </Card>
            </Space>

            <Form.Item style={{ marginTop: 28, marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={saving}
              >
                <FormattedMessage
                  id="pages.settings.save"
                  defaultMessage="Save Settings"
                />
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </div>
    </PageContainer>
  );
};

export default GeneralSettings;
