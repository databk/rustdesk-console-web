import { SaveOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import {
  Card,
  Form,
  Input,
  message as messageApi,
  Select,
  Space,
  Switch,
  Tabs,
} from 'antd';
import React, { useEffect, useState } from 'react';
import { getSettings, updateSetting } from '@/services/rustdesk-console/settings';

const Settings: React.FC = () => {
  const intl = useIntl();
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
      messageApi.error(intl.formatMessage({ id: 'pages.settings.fetchFailed', defaultMessage: 'Failed to load settings' }));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const values = form.getFieldsValue();
      await Promise.all(
        Object.entries(values).map(([key, value]) =>
          updateSetting(key, value)
        )
      );
      messageApi.success(intl.formatMessage({ id: 'pages.settings.saveSuccess', defaultMessage: 'Settings saved successfully' }));
    } catch (error) {
      messageApi.error(intl.formatMessage({ id: 'pages.settings.saveFailed', defaultMessage: 'Failed to save settings' }));
    }
  };

  return (
    <PageContainer>
      <Card
        title={<FormattedMessage id="pages.settings.title" defaultValue="System Settings" />}
        extra={
          <Space>
            <Button icon={<SaveOutlined />} type="primary" onClick={handleSave} loading={loading}>
              <FormattedMessage id="pages.settings.save" defaultValue="Save Settings" />
            </Button>
          </Space>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
          {
            key: 'general',
            label: <FormattedMessage id="pages.settings.general" defaultValue="General Settings" />,
            children: (
              <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
                <Form.Item name="site_name" label={<FormattedMessage id="pages.settings.siteName" defaultValue="Site Name" />}>
                  <Input placeholder="Enter site name" />
                </Form.Item>
                <Form.Item name="admin_email" label={<FormattedMessage id="pages.settings.adminEmail" defaultValue="Admin Email" />}>
                  <Input placeholder="Enter admin email" />
                </Form.Item>
                <Form.Item name="language" label={<FormattedMessage id="pages.settings.language" defaultValue="Default Language" />}>
                  <Select options={[{ value: 'en', label: 'English' }, { value: 'zh', label: 'Chinese' }]} />
                </Form.Item>
              </Form>
            ),
          },
          {
            key: 'security',
            label: <FormattedMessage id="pages.settings.security" defaultValue="Security Settings" />,
            children: (
              <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
                <Form.Item name="enable_2fa" label={<FormattedMessage id="pages.settings.enable2FA" defaultValue="Enable Two-Factor Authentication" />} valuePropName="checked">
                  <Switch />
                </Form.Item>
                <Form.Item name="session_timeout" label={<FormattedMessage id="pages.settings.sessionTimeout" defaultValue="Session Timeout (minutes)" />}>
                  <Input type="number" placeholder="30" />
                </Form.Item>
                <Form.Item name="max_login_attempts" label={<FormattedMessage id="pages.settings.maxLoginAttempts" defaultValue="Max Login Attempts" />}>
                  <Input type="number" placeholder="5" />
                </Form.Item>
              </Form>
            ),
          },
          {
            key: 'advanced',
            label: <FormattedMessage id="pages.settings.advanced" defaultValue="Advanced Settings" />,
            children: (
              <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
                <Form.Item name="log_level" label={<FormattedMessage id="pages.settings.logLevel" defaultValue="Log Level" />}>
                  <Select options={[{ value: 'info', label: 'Info' }, { value: 'warn', label: 'Warning' }, { value: 'error', label: 'Error' }]} />
                </Form.Item>
                <Form.Item name="enable_debug_mode" label={<FormattedMessage id="pages.settings.enableDebugMode" defaultValue="Enable Debug Mode" />} valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Form>
            ),
          },
        ]} />
      </Card>
    </PageContainer>
  );
};

export default Settings;

function FormattedMessage(props: { id: string; defaultMessage?: string }): React.JSX.Element {
  const intl = useIntl();
  return <>{intl.formatMessage(props)}</>;
}
