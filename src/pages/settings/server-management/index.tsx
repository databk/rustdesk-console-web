import {
  CloudServerOutlined,
  SaveOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl, FormattedMessage } from '@umijs/max';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Divider,
  Form,
  Input,
  message as messageApi,
  Space,
  Spin,
} from 'antd';
import React, { useEffect, useState } from 'react';
import {
  getServerManagementSettings,
  updateServerManagementSettings,
} from '@/services/rustdesk-console';

const TOKEN_MASK = '******';
const NODE_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;
const UNSAFE_CHARS = /[\s\\?#]/;

const isHttpOrigin = (value: string): boolean => {
  if (!value || UNSAFE_CHARS.test(value) || value !== value.trim())
    return false;
  try {
    const url = new URL(value);
    return (
      ['http:', 'https:'].includes(url.protocol) &&
      !!url.hostname &&
      !url.username &&
      !url.password &&
      (url.pathname === '/' || url.pathname === '') &&
      !url.search &&
      !url.hash
    );
  } catch {
    return false;
  }
};

const ServerManagementSettings: React.FC = () => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [configured, setConfigured] = useState(false);
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
      const config = await getServerManagementSettings();
      setLoadFailed(false);
      setConfigured(config.configured);
      setConfigInfo({
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      });
      form.setFieldsValue({
        url: config.url || '',
        token: config.token || '',
        nodeId: config.nodeId || 'rustdesk',
        nodeName: config.nodeName || 'RustDesk',
      });
    } catch (error) {
      console.error('Failed to fetch server management settings:', error);
      // Block saving so a failed load cannot disable an existing connection.
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const submitData: API.UpdateServerManagementSettingsParams = {
        url: (values.url ?? '').trim(),
        nodeId: (values.nodeId ?? '').trim(),
        nodeName: (values.nodeName ?? '').trim(),
      };
      if (values.token && values.token !== TOKEN_MASK)
        submitData.token = values.token.trim();
      await updateServerManagementSettings(submitData);
      messageApi.success(
        intl.formatMessage({
          id: 'pages.serverManagementSettings.saveSuccess',
          defaultMessage: 'Server management configuration saved successfully',
        }),
      );
      await fetchConfig();
    } catch (error: any) {
      console.error('Failed to save server management settings:', error);
      if (error?.errorFields) {
        // Form validation error; no message needed
        return;
      }
      messageApi.error(
        error?.response?.data?.message ||
          intl.formatMessage({
            id: 'pages.serverManagementSettings.saveFailed',
            defaultMessage: 'Failed to save server management configuration',
          }),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer>
      <Card
        title={
          <Space>
            <CloudServerOutlined />
            <FormattedMessage
              id="pages.serverManagementSettings.title"
              defaultMessage="Server Management"
            />
          </Space>
        }
        extra={
          <Button
            icon={<SaveOutlined />}
            type="primary"
            onClick={handleSave}
            loading={saving}
            disabled={loading || loadFailed}
          >
            <FormattedMessage id="pages.common.save" defaultMessage="Save" />
          </Button>
        }
      >
        <Spin spinning={loading}>
          {loadFailed && (
            <Alert
              type="error"
              showIcon
              message={
                <FormattedMessage
                  id="pages.serverManagementSettings.loadFailed"
                  defaultMessage="Failed to load the server management configuration"
                />
              }
              action={
                <Button
                  size="small"
                  danger
                  onClick={fetchConfig}
                  disabled={loading}
                >
                  <FormattedMessage
                    id="pages.common.retry"
                    defaultMessage="Retry"
                  />
                </Button>
              }
              style={{ marginBottom: 24 }}
            />
          )}
          <p style={{ color: '#666', marginBottom: 24 }}>
            <FormattedMessage
              id="pages.serverManagementSettings.description"
              defaultMessage="Configure how the console talks to the hbbs/hbbr management API"
            />
          </p>

          <Form
            form={form}
            layout="vertical"
            disabled={loadFailed}
            initialValues={{
              url: '',
              token: '',
              nodeId: 'rustdesk',
              nodeName: 'RustDesk',
            }}
          >
            <Form.Item
              name="url"
              label={
                <FormattedMessage
                  id="pages.serverManagementSettings.url"
                  defaultMessage="Management API URL"
                />
              }
              rules={[
                {
                  validator(_: unknown, value: string) {
                    if (!(value ?? '').trim()) return Promise.resolve();
                    if (!isHttpOrigin(value.trim()))
                      return Promise.reject(
                        intl.formatMessage({
                          id: 'pages.serverManagementSettings.urlInvalid',
                          defaultMessage:
                            'Must be an HTTP(S) origin without a path, e.g. http://hbbs:21120',
                        }),
                      );
                    return Promise.resolve();
                  },
                },
              ]}
              extra={
                <FormattedMessage
                  id="pages.serverManagementSettings.urlHelp"
                  defaultMessage="HTTP(S) origin of the hbbs management API. Leave empty to disable server management."
                />
              }
            >
              <Input placeholder="http://hbbs:21120" />
            </Form.Item>

            <Form.Item
              name="token"
              label={
                <FormattedMessage
                  id="pages.serverManagementSettings.token"
                  defaultMessage="Management Token"
                />
              }
              dependencies={['url']}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_: unknown, value: string) {
                    const url = (getFieldValue('url') ?? '').trim();
                    if (!url) return Promise.resolve();
                    if (!(value ?? '').trim())
                      return Promise.reject(
                        intl.formatMessage({
                          id: 'pages.serverManagementSettings.tokenRequired',
                          defaultMessage:
                            'A management token is required when a URL is set',
                        }),
                      );
                    if (value !== TOKEN_MASK && value.trim().length < 32)
                      return Promise.reject(
                        intl.formatMessage({
                          id: 'pages.serverManagementSettings.tokenTooShort',
                          defaultMessage:
                            'The token must contain at least 32 characters',
                        }),
                      );
                    return Promise.resolve();
                  },
                }),
              ]}
              extra={
                <FormattedMessage
                  id="pages.serverManagementSettings.tokenHelp"
                  defaultMessage="Shared secret configured on hbbs/hbbr (RD_MANAGEMENT_TOKEN). Enter ****** to keep the stored token unchanged."
                />
              }
            >
              <Input.Password placeholder={TOKEN_MASK} />
            </Form.Item>

            <Form.Item
              name="nodeId"
              label={
                <FormattedMessage
                  id="pages.serverManagementSettings.nodeId"
                  defaultMessage="Node ID"
                />
              }
              rules={[
                {
                  validator(_: unknown, value: string) {
                    const trimmed = (value ?? '').trim();
                    if (!trimmed)
                      return Promise.reject(
                        intl.formatMessage({
                          id: 'pages.serverManagementSettings.nodeIdRequired',
                          defaultMessage: 'Please enter a node ID',
                        }),
                      );
                    if (!NODE_ID_PATTERN.test(trimmed))
                      return Promise.reject(
                        intl.formatMessage({
                          id: 'pages.serverManagementSettings.nodeIdInvalid',
                          defaultMessage:
                            'Only letters, numbers, hyphens and underscores (max 64 characters)',
                        }),
                      );
                    return Promise.resolve();
                  },
                },
              ]}
              extra={
                <FormattedMessage
                  id="pages.serverManagementSettings.nodeIdHelp"
                  defaultMessage="Identifier of this console node, e.g. rustdesk"
                />
              }
            >
              <Input placeholder="rustdesk" />
            </Form.Item>

            <Form.Item
              name="nodeName"
              label={
                <FormattedMessage
                  id="pages.serverManagementSettings.nodeName"
                  defaultMessage="Node Name"
                />
              }
              rules={[
                {
                  validator(_: unknown, value: string) {
                    if (!(value ?? '').trim())
                      return Promise.reject(
                        intl.formatMessage({
                          id: 'pages.serverManagementSettings.nodeNameRequired',
                          defaultMessage: 'Please enter a node name',
                        }),
                      );
                    return Promise.resolve();
                  },
                },
              ]}
              extra={
                <FormattedMessage
                  id="pages.serverManagementSettings.nodeNameHelp"
                  defaultMessage="Display name of this console node, e.g. RustDesk"
                />
              }
            >
              <Input placeholder="RustDesk" />
            </Form.Item>

            <Alert
              type="warning"
              showIcon
              icon={<WarningOutlined />}
              message={
                <FormattedMessage
                  id="pages.serverManagementSettings.tokenSyncWarning"
                  defaultMessage="After changing the token, update SERVER_MANAGEMENT_TOKEN in the .env file of hbbs/hbbr and restart them so both sides use the same token."
                />
              }
              style={{ marginBottom: 8 }}
            />

            {configured && (configInfo.createdAt || configInfo.updatedAt) && (
              <>
                <Divider />
                <Descriptions column={1} size="small">
                  {configInfo.createdAt && (
                    <Descriptions.Item
                      label={
                        <FormattedMessage
                          id="pages.serverManagementSettings.createdAt"
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
                          id="pages.serverManagementSettings.updatedAt"
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

export default ServerManagementSettings;
