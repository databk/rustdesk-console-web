import { SaveOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { FormattedMessage, useIntl, useModel } from '@umijs/max';
import { App, Button, Form, Space, Switch, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import {
  getGeneralSettings,
  updateGeneralSettings,
} from '@/services/rustdesk-console/settings';
import {
  DEFAULT_GENERAL_SETTINGS,
} from '@/utils/generalSettings';

const { Title } = Typography;

const GeneralSettings: React.FC = () => {
  const intl = useIntl();
  const { message } = App.useApp();
  const { setInitialState } = useModel('@@initialState');
  const [form] = Form.useForm<API.GeneralSettings>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void getGeneralSettings()
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
        generalSettings: saved,
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
      <div style={{ maxWidth: 640 }}>
        <Title level={4} style={{ marginTop: 0, marginBottom: 24 }}>
          <FormattedMessage
            id="pages.settings.general"
            defaultMessage="General Settings"
          />
        </Title>
        <Form
          form={form}
          layout="vertical"
          disabled={loading}
          initialValues={{
            watermarkEnabled: DEFAULT_GENERAL_SETTINGS.watermarkEnabled,
          }}
          onFinish={handleSave}
          requiredMark={false}
        >
          <Form.Item
            name="watermarkEnabled"
            label={
              <FormattedMessage
                id="pages.settings.watermarkEnabled"
                defaultMessage="Username Watermark"
              />
            }
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item style={{ marginTop: 28, marginBottom: 0 }}>
            <Space>
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
            </Space>
          </Form.Item>
        </Form>
      </div>
    </PageContainer>
  );
};

export default GeneralSettings;
