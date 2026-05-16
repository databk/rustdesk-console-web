import { SaveOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import {
  App,
  Button,
  Card,
  Form,
  Input,
  Select,
  Space,
  Switch,
  Tabs,
} from 'antd';
import React, { useEffect, useState } from 'react';
import {
  getSettings,
  updateSetting,
} from '@/services/rustdesk-console/settings';

const Settings: React.FC = () => {
  const intl = useIntl();
  const { message: msgApi } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const settings = await getSettings();
      if (settings && Array.isArray(settings)) {
        const formData: Record<string, any> = {};
        settings.forEach((item) => {
          formData[item.key] = item.value;
        });
        form.setFieldsValue(formData);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      msgApi.error(
        intl.formatMessage({
          id: 'pages.settings.fetchFailed',
          defaultMessage: 'Failed to load settings',
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const values = form.getFieldsValue();
      await Promise.all(
        Object.entries(values).map(([key, value]) =>
          updateSetting(key, value as string | number | boolean),
        ),
      );
      msgApi.success(
        intl.formatMessage({
          id: 'pages.settings.saveSuccess',
          defaultMessage: 'Settings saved successfully',
        }),
      );
    } catch (error) {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.settings.saveFailed',
          defaultMessage: 'Failed to save settings',
        }),
      );
    }
  };

  return (
    <PageContainer>
      <Card
        title={
          <FormattedMessage
            id="pages.settings.title"
            defaultMessage="System Settings"
          />
        }
        extra={
          <Space>
            <Button
              icon={<SaveOutlined />}
              type="primary"
              onClick={handleSave}
              loading={loading}
            >
              <FormattedMessage
                id="pages.settings.save"
                defaultMessage="Save Settings"
              />
            </Button>
          </Space>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'general',
              label: (
                <FormattedMessage
                  id="pages.settings.general"
                  defaultMessage="General Settings"
                />
              ),
              children: (
                <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
                  <Form.Item
                    name="site_name"
                    label={
                      <FormattedMessage
                        id="pages.settings.siteName"
                        defaultMessage="Site Name"
                      />
                    }
                  >
                    <Input
                      placeholder={intl.formatMessage({
                        id: 'pages.settings.enterSiteName',
                        defaultMessage: 'Enter site name',
                      })}
                    />
                  </Form.Item>
                  <Form.Item
                    name="admin_email"
                    label={
                      <FormattedMessage
                        id="pages.settings.adminEmail"
                        defaultMessage="Admin Email"
                      />
                    }
                  >
                    <Input
                      placeholder={intl.formatMessage({
                        id: 'pages.settings.enterAdminEmail',
                        defaultMessage: 'Enter admin email',
                      })}
                    />
                  </Form.Item>
                  <Form.Item
                    name="language"
                    label={
                      <FormattedMessage
                        id="pages.settings.language"
                        defaultMessage="Default Language"
                      />
                    }
                  >
                    <Select
                      options={[
                        {
                          value: 'en',
                          label: intl.formatMessage({
                            id: 'pages.settings.english',
                            defaultMessage: 'English',
                          }),
                        },
                        {
                          value: 'zh',
                          label: intl.formatMessage({
                            id: 'pages.settings.chinese',
                            defaultMessage: 'Chinese',
                          }),
                        },
                      ]}
                    />
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'security',
              label: (
                <FormattedMessage
                  id="pages.settings.security"
                  defaultMessage="Security Settings"
                />
              ),
              children: (
                <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
                  <Form.Item
                    name="enable_2fa"
                    label={
                      <FormattedMessage
                        id="pages.settings.enable2FA"
                        defaultMessage="Enable Two-Factor Authentication"
                      />
                    }
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                  <Form.Item
                    name="session_timeout"
                    label={
                      <FormattedMessage
                        id="pages.settings.sessionTimeout"
                        defaultMessage="Session Timeout (minutes)"
                      />
                    }
                  >
                    <Input type="number" placeholder="30" />
                  </Form.Item>
                  <Form.Item
                    name="max_login_attempts"
                    label={
                      <FormattedMessage
                        id="pages.settings.maxLoginAttempts"
                        defaultMessage="Max Login Attempts"
                      />
                    }
                  >
                    <Input type="number" placeholder="5" />
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'advanced',
              label: (
                <FormattedMessage
                  id="pages.settings.advanced"
                  defaultMessage="Advanced Settings"
                />
              ),
              children: (
                <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
                  <Form.Item
                    name="log_level"
                    label={
                      <FormattedMessage
                        id="pages.settings.logLevel"
                        defaultMessage="Log Level"
                      />
                    }
                  >
                    <Select
                      options={[
                        {
                          value: 'info',
                          label: intl.formatMessage({
                            id: 'pages.settings.logInfo',
                            defaultMessage: 'Info',
                          }),
                        },
                        {
                          value: 'warn',
                          label: intl.formatMessage({
                            id: 'pages.settings.logWarning',
                            defaultMessage: 'Warning',
                          }),
                        },
                        {
                          value: 'error',
                          label: intl.formatMessage({
                            id: 'pages.settings.logError',
                            defaultMessage: 'Error',
                          }),
                        },
                      ]}
                    />
                  </Form.Item>
                  <Form.Item
                    name="enable_debug_mode"
                    label={
                      <FormattedMessage
                        id="pages.settings.enableDebugMode"
                        defaultMessage="Enable Debug Mode"
                      />
                    }
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Form>
              ),
            },
          ]}
        />
      </Card>
    </PageContainer>
  );
};

export default Settings;
