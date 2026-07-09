import { MailOutlined, SaveOutlined, ApiOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl, FormattedMessage } from '@umijs/max';
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  message as messageApi,
  Space,
  Switch,
  Spin,
  Descriptions,
  Divider,
} from 'antd';
import React, { useEffect, useState } from 'react';
import {
  getSMTPConfig,
  updateSMTPConfig,
  testSMTPConfig,
} from '@/services/rustdesk-console';

const SMTPSettings: React.FC = () => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [configExists, setConfigExists] = useState(false);
  const [configInfo, setConfigInfo] = useState<{
    createdAt?: string;
    updatedAt?: string;
  }>({});

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const config = await getSMTPConfig();
      if (config) {
        setConfigExists(true);
        setConfigInfo({
          createdAt: config.createdAt,
          updatedAt: config.updatedAt,
        });
        form.setFieldsValue({
          host: config.host,
          port: config.port,
          secure: config.secure,
          user: config.user || '',
          pass: config.user ? '******' : '', // 有用户名时显示脱敏占位符，无认证时为空
          from: config.from,
          enabled: config.enabled,
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch SMTP config:', error);
      if (error?.response?.status === 404) {
        // 404 表示配置不存在，这是正常情况，不需要显示错误提示
        setConfigExists(false);
      } else {
        // 其他错误重新抛出，让全局错误处理器处理
        throw error;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      // 如果密码是脱敏占位符，不传递密码字段
      const submitData: any = {
        host: values.host,
        port: values.port,
        secure: values.secure,
        from: values.from,
        enabled: values.enabled,
      };

      if (values.user) {
        submitData.user = values.user;
      }

      if (values.pass && values.pass !== '******') {
        submitData.pass = values.pass;
      }

      await updateSMTPConfig(submitData);
      messageApi.success(
        intl.formatMessage({
          id: 'pages.smtp.saveSuccess',
          defaultMessage: 'SMTP configuration saved successfully',
        }),
      );

      // 重新加载配置
      await fetchConfig();
    } catch (error: any) {
      console.error('Failed to save SMTP config:', error);
      if (error?.errorFields) {
        // 表单验证错误，不需要显示消息
        return;
      }
      messageApi.error(
        intl.formatMessage({
          id: 'pages.smtp.saveFailed',
          defaultMessage: 'Failed to save SMTP configuration',
        }),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      const values = await form.validateFields([
        'host',
        'port',
        'secure',
        'from',
      ]);
      setTesting(true);

      // 构建测试数据
      const testData: any = {
        host: values.host,
        port: values.port,
        secure: values.secure,
        from: values.from,
      };

      if (values.user) {
        testData.user = values.user;
      }

      // 如果密码不是脱敏占位符，使用表单中的密码
      const password = form.getFieldValue('pass');
      if (password && password !== '******') {
        testData.pass = password;
      }

      const result = await testSMTPConfig(testData);

      if (result.success) {
        messageApi.success(
          result.message ||
            intl.formatMessage({
              id: 'pages.smtp.testSuccess',
              defaultMessage: 'SMTP connection test successful',
            }),
        );
      } else {
        messageApi.error(
          result.message ||
            intl.formatMessage({
              id: 'pages.smtp.testFailed',
              defaultMessage: 'SMTP connection test failed',
            }),
        );
      }
    } catch (error: any) {
      console.error('Failed to test SMTP config:', error);
      if (error?.errorFields) {
        // 表单验证错误
        return;
      }
      messageApi.error(
        intl.formatMessage({
          id: 'pages.smtp.testFailed',
          defaultMessage: 'SMTP connection test failed',
        }),
      );
    } finally {
      setTesting(false);
    }
  };

  return (
    <PageContainer>
      <Card
        title={
          <Space>
            <MailOutlined />
            <FormattedMessage
              id="pages.smtp.title"
              defaultMessage="SMTP Configuration"
            />
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<ApiOutlined />}
              onClick={handleTest}
              loading={testing}
              disabled={loading}
            >
              <FormattedMessage
                id="pages.smtp.testConnection"
                defaultMessage="Test Connection"
              />
            </Button>
            <Button
              icon={<SaveOutlined />}
              type="primary"
              onClick={handleSave}
              loading={saving}
              disabled={loading}
            >
              <FormattedMessage id="pages.common.save" defaultMessage="Save" />
            </Button>
          </Space>
        }
      >
        <Spin spinning={loading}>
          <p style={{ color: '#666', marginBottom: 24 }}>
            <FormattedMessage
              id="pages.smtp.description"
              defaultMessage="Configure SMTP mail server for sending system notification emails"
            />
          </p>

          <Form
            form={form}
            layout="vertical"
            initialValues={{ port: 587, secure: true, enabled: false }}
          >
            <Form.Item
              name="host"
              label={
                <FormattedMessage
                  id="pages.smtp.host"
                  defaultMessage="Server Address"
                />
              }
              rules={[
                { required: true, message: 'Please enter SMTP server address' },
              ]}
            >
              <Input
                placeholder={intl.formatMessage({
                  id: 'pages.smtp.hostPlaceholder',
                  defaultMessage: 'Please enter SMTP server address',
                })}
              />
            </Form.Item>

            <Form.Item
              name="port"
              label={
                <FormattedMessage id="pages.smtp.port" defaultMessage="Port" />
              }
              rules={[
                { required: true, message: 'Please enter port number' },
                {
                  type: 'number',
                  min: 1,
                  max: 65535,
                  message: 'Port must be between 1-65535',
                },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder={intl.formatMessage({
                  id: 'pages.smtp.portPlaceholder',
                  defaultMessage: 'Please enter port number',
                })}
                min={1}
                max={65535}
              />
            </Form.Item>

            <Form.Item
              name="secure"
              label={
                <FormattedMessage
                  id="pages.smtp.secure"
                  defaultMessage="Use SSL/TLS"
                />
              }
              valuePropName="checked"
              extra={
                <FormattedMessage
                  id="pages.smtp.secureHelp"
                  defaultMessage="Enable secure connection (usually port 465 uses SSL, port 587 uses TLS)"
                />
              }
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="user"
              label={
                <FormattedMessage
                  id="pages.smtp.user"
                  defaultMessage="Username"
                />
              }
            >
              <Input
                placeholder={intl.formatMessage({
                  id: 'pages.smtp.userPlaceholder',
                  defaultMessage: 'Please enter SMTP authentication username',
                })}
              />
            </Form.Item>

            <Form.Item
              name="pass"
              label={
                <FormattedMessage
                  id="pages.smtp.password"
                  defaultMessage="Password"
                />
              }
            >
              <Input.Password
                placeholder={intl.formatMessage({
                  id: 'pages.smtp.passwordPlaceholder',
                  defaultMessage: 'Please enter SMTP authentication password',
                })}
              />
            </Form.Item>

            <Form.Item
              name="from"
              label={
                <FormattedMessage
                  id="pages.smtp.from"
                  defaultMessage="Sender Email"
                />
              }
              rules={[
                {
                  required: true,
                  message: 'Please enter sender email address',
                },
                {
                  type: 'email',
                  message: 'Please enter a valid email address',
                },
              ]}
            >
              <Input
                placeholder={intl.formatMessage({
                  id: 'pages.smtp.fromPlaceholder',
                  defaultMessage: 'Please enter sender email address',
                })}
              />
            </Form.Item>

            <Form.Item
              name="enabled"
              label={
                <FormattedMessage
                  id="pages.smtp.enabled"
                  defaultMessage="Enable Configuration"
                />
              }
              valuePropName="checked"
              extra={
                <FormattedMessage
                  id="pages.smtp.enabledHelp"
                  defaultMessage="When enabled, this configuration will be used to send system emails"
                />
              }
            >
              <Switch />
            </Form.Item>

            {configExists && (configInfo.createdAt || configInfo.updatedAt) && (
              <>
                <Divider />
                <Descriptions column={1} size="small">
                  {configInfo.createdAt && (
                    <Descriptions.Item
                      label={
                        <FormattedMessage
                          id="pages.smtp.createdAt"
                          defaultMessage="Created At"
                        />
                      }
                    >
                      {new Date(configInfo.createdAt).toLocaleString()}
                    </Descriptions.Item>
                  )}
                  {configInfo.updatedAt && (
                    <Descriptions.Item
                      label={
                        <FormattedMessage
                          id="pages.smtp.updatedAt"
                          defaultMessage="Updated At"
                        />
                      }
                    >
                      {new Date(configInfo.updatedAt).toLocaleString()}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </>
            )}
          </Form>
        </Spin>
      </Card>
    </PageContainer>
  );
};

export default SMTPSettings;
