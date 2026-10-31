import { GlobalOutlined, SaveOutlined } from '@ant-design/icons';
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
  Switch,
} from 'antd';
import React, { useEffect, useState } from 'react';
import {
  getWebClientSettings,
  updateWebClientSettings,
} from '@/services/rustdesk-console';
import {
  formatIceServersText,
  loadIceServers,
  parseIceServersText,
  saveIceServers,
} from '@/features/web-client/core/ice-config';

const UNSAFE_CHARS = /[\s\\?#]/;

const isHttpsOrigin = (value: string): boolean => {
  if (!value || UNSAFE_CHARS.test(value) || value !== value.trim())
    return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      !!url.hostname &&
      !url.username &&
      !url.password &&
      url.origin === value
    );
  } catch {
    return false;
  }
};

const isWssUrl = (value: string): boolean => {
  if (!value || UNSAFE_CHARS.test(value) || value !== value.trim())
    return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === 'wss:' &&
      !!url.hostname &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
};

const isWsUrl = (value: string): boolean => {
  if (!value || UNSAFE_CHARS.test(value) || value !== value.trim())
    return false;
  try {
    const url = new URL(value);
    return (
      (url.protocol === 'ws:' || url.protocol === 'wss:') &&
      !!url.hostname &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
};

const isServerPublicKey = (value: string): boolean => {
  if (!value || value !== value.trim()) return false;
  try {
    const decoded = atob(value);
    return decoded.length === 32 && btoa(decoded) === value;
  } catch {
    return false;
  }
};

const WebClientSettings: React.FC = () => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
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
      const config = await getWebClientSettings();
      setLoadFailed(false);
      setConfigExists(true);
      setConfigInfo({
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      });
      form.setFieldsValue({
        enabled: config.enabled,
        allowedOrigin: config.allowedOrigin || '',
        idServerUrl: config.idServerUrl || '',
        relayServerUrl: config.relayServerUrl || '',
        serverPublicKey: config.serverPublicKey || '',
        idUpstreamUrl: config.idUpstreamUrl || '',
        relayUpstreamUrl: config.relayUpstreamUrl || '',
        iceServers: formatIceServersText(loadIceServers()),
      });
    } catch (error: any) {
      console.error('Failed to fetch web client settings:', error);
      if (error?.response?.status === 404) {
        // 404 means no config exists yet, which is normal; no error toast needed
        setConfigExists(false);
        setLoadFailed(false);
      } else {
        // Block saving so a failed load cannot wipe an existing configuration.
        setLoadFailed(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await updateWebClientSettings({
        enabled: values.enabled,
        allowedOrigin: (values.allowedOrigin ?? '').trim(),
        idServerUrl: (values.idServerUrl ?? '').trim(),
        relayServerUrl: (values.relayServerUrl ?? '').trim(),
        serverPublicKey: (values.serverPublicKey ?? '').trim(),
        idUpstreamUrl: (values.idUpstreamUrl ?? '').trim(),
        relayUpstreamUrl: (values.relayUpstreamUrl ?? '').trim(),
      });
      saveIceServers(parseIceServersText(values.iceServers ?? ''));
      messageApi.success(
        intl.formatMessage({
          id: 'pages.webClientSettings.saveSuccess',
          defaultMessage: 'Web client configuration saved successfully',
        }),
      );
      await fetchConfig();
    } catch (error: any) {
      console.error('Failed to save web client settings:', error);
      if (error?.errorFields) {
        // Form validation error; no message needed
        return;
      }
      const issues: API.WebClientSettingsIssue[] | undefined =
        error?.response?.data?.issues;
      if (Array.isArray(issues) && issues.length > 0) {
        form.setFields(
          issues.map((item) => ({
            name: item.field,
            errors: [
              intl.formatMessage({
                id: `pages.webClientSettings.validation.${item.field}`,
                defaultMessage: item.message,
              }),
            ],
          })),
        );
        return;
      }
      messageApi.error(
        intl.formatMessage({
          id: 'pages.webClientSettings.saveFailed',
          defaultMessage: 'Failed to save web client configuration',
        }),
      );
    } finally {
      setSaving(false);
    }
  };

  const requiredWhenEnabled = (messageId: string, fallback: string) => ({
    validator(_: unknown, value: string) {
      const enabled = form.getFieldValue('enabled');
      if (!(value ?? '').trim()) {
        if (enabled)
          return Promise.reject(
            intl.formatMessage({ id: messageId, defaultMessage: fallback }),
          );
        return Promise.resolve();
      }
      return Promise.resolve();
    },
  });

  return (
    <PageContainer>
      <Card
        title={
          <Space>
            <GlobalOutlined />
            <FormattedMessage
              id="pages.webClientSettings.title"
              defaultMessage="Web Client"
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
                  id="pages.webClientSettings.loadFailed"
                  defaultMessage="Failed to load the web client configuration"
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
              id="pages.webClientSettings.description"
              defaultMessage="Configure the browser-based remote control client exposed by the console gateway"
            />
          </p>

          <Form
            form={form}
            layout="vertical"
            initialValues={{ enabled: false }}
            disabled={loadFailed}
          >
            <Form.Item
              name="enabled"
              label={
                <FormattedMessage
                  id="pages.webClientSettings.enabled"
                  defaultMessage="Enable Web Client"
                />
              }
              valuePropName="checked"
              extra={
                <FormattedMessage
                  id="pages.webClientSettings.enabledHelp"
                  defaultMessage="When enabled, the configuration below must be complete and valid"
                />
              }
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="allowedOrigin"
              label={
                <FormattedMessage
                  id="pages.webClientSettings.allowedOrigin"
                  defaultMessage="Allowed Origin"
                />
              }
              dependencies={['enabled']}
              rules={[
                requiredWhenEnabled(
                  'pages.webClientSettings.allowedOriginRequired',
                  'Please enter the allowed origin',
                ),
                {
                  validator(_: unknown, value: string) {
                    if (!(value ?? '').trim()) return Promise.resolve();
                    if (!isHttpsOrigin(value.trim()))
                      return Promise.reject(
                        intl.formatMessage({
                          id: 'pages.webClientSettings.allowedOriginInvalid',
                          defaultMessage:
                            'Must be an exact HTTPS origin, e.g. https://console.example.com',
                        }),
                      );
                    return Promise.resolve();
                  },
                },
              ]}
              extra={
                <FormattedMessage
                  id="pages.webClientSettings.allowedOriginHelp"
                  defaultMessage="Exact HTTPS origin of the site allowed to open the web client, e.g. https://console.example.com"
                />
              }
            >
              <Input placeholder="https://console.example.com" />
            </Form.Item>

            <Form.Item
              name="idServerUrl"
              label={
                <FormattedMessage
                  id="pages.webClientSettings.idServerUrl"
                  defaultMessage="ID Server URL"
                />
              }
              dependencies={['enabled']}
              rules={[
                requiredWhenEnabled(
                  'pages.webClientSettings.idServerUrlRequired',
                  'Please enter the ID server URL',
                ),
                {
                  validator(_: unknown, value: string) {
                    if (!(value ?? '').trim()) return Promise.resolve();
                    if (!isWssUrl(value.trim()))
                      return Promise.reject(
                        intl.formatMessage({
                          id: 'pages.webClientSettings.idServerUrlInvalid',
                          defaultMessage: 'Must be a wss:// URL',
                        }),
                      );
                    return Promise.resolve();
                  },
                },
              ]}
              extra={
                <FormattedMessage
                  id="pages.webClientSettings.idServerUrlHelp"
                  defaultMessage="Public WebSocket URL of the ID server, e.g. wss://console.example.com/ws/id"
                />
              }
            >
              <Input placeholder="wss://console.example.com/ws/id" />
            </Form.Item>

            <Form.Item
              name="relayServerUrl"
              label={
                <FormattedMessage
                  id="pages.webClientSettings.relayServerUrl"
                  defaultMessage="Relay Server URL"
                />
              }
              dependencies={['enabled']}
              rules={[
                requiredWhenEnabled(
                  'pages.webClientSettings.relayServerUrlRequired',
                  'Please enter the relay server URL',
                ),
                {
                  validator(_: unknown, value: string) {
                    if (!(value ?? '').trim()) return Promise.resolve();
                    if (!isWssUrl(value.trim()))
                      return Promise.reject(
                        intl.formatMessage({
                          id: 'pages.webClientSettings.relayServerUrlInvalid',
                          defaultMessage: 'Must be a wss:// URL',
                        }),
                      );
                    return Promise.resolve();
                  },
                },
              ]}
              extra={
                <FormattedMessage
                  id="pages.webClientSettings.relayServerUrlHelp"
                  defaultMessage="Public WebSocket URL of the relay server, e.g. wss://console.example.com/ws/relay"
                />
              }
            >
              <Input placeholder="wss://console.example.com/ws/relay" />
            </Form.Item>

            <Form.Item
              name="serverPublicKey"
              label={
                <FormattedMessage
                  id="pages.webClientSettings.serverPublicKey"
                  defaultMessage="Server Public Key"
                />
              }
              dependencies={['enabled']}
              rules={[
                requiredWhenEnabled(
                  'pages.webClientSettings.serverPublicKeyRequired',
                  'Please enter the server public key',
                ),
                {
                  validator(_: unknown, value: string) {
                    if (!(value ?? '').trim()) return Promise.resolve();
                    if (!isServerPublicKey(value.trim()))
                      return Promise.reject(
                        intl.formatMessage({
                          id: 'pages.webClientSettings.serverPublicKeyInvalid',
                          defaultMessage:
                            'Must be a base64-encoded 32-byte key (same as the hbbs/hbbr key pair)',
                        }),
                      );
                    return Promise.resolve();
                  },
                },
              ]}
              extra={
                <FormattedMessage
                  id="pages.webClientSettings.serverPublicKeyHelp"
                  defaultMessage="Base64-encoded 32-byte public key generated by hbbs/hbbr (contents of id_ed25519.pub)"
                />
              }
            >
              <Input.TextArea rows={2} />
            </Form.Item>

            <Divider>
              <FormattedMessage
                id="pages.webClientSettings.iceTitle"
                defaultMessage="WebRTC ICE Servers (Optional)"
              />
            </Divider>

            <Form.Item
              name="iceServers"
              label={
                <FormattedMessage
                  id="pages.webClientSettings.iceServers"
                  defaultMessage="ICE Servers"
                />
              }
              extra={
                <FormattedMessage
                  id="pages.webClientSettings.iceServersHelp"
                  defaultMessage="One per line. STUN/TURN servers for browser WebRTC P2P, e.g. 'stun:stun.example.com:3478' or 'turn:turn.example.com:3478 user credential'. Stored in this browser only."
                />
              }
            >
              <Input.TextArea
                rows={3}
                placeholder={
                  'stun:stun.example.com:3478\nturn:turn.example.com:3478 user credential'
                }
              />
            </Form.Item>

            <Divider>
              <FormattedMessage
                id="pages.webClientSettings.upstreamTitle"
                defaultMessage="Internal Upstreams (Optional)"
              />
            </Divider>

            <p style={{ color: '#666', marginBottom: 24 }}>
              <FormattedMessage
                id="pages.webClientSettings.upstreamHelp"
                defaultMessage="Internal WebSocket endpoints the gateway proxies to. Leave empty to use the console gateway defaults."
              />
            </p>

            <Form.Item
              name="idUpstreamUrl"
              label={
                <FormattedMessage
                  id="pages.webClientSettings.idUpstreamUrl"
                  defaultMessage="ID Upstream URL"
                />
              }
              dependencies={['enabled']}
              rules={[
                {
                  validator(_: unknown, value: string) {
                    if (!(value ?? '').trim()) return Promise.resolve();
                    if (!isWsUrl(value.trim()))
                      return Promise.reject(
                        intl.formatMessage({
                          id: 'pages.webClientSettings.idUpstreamUrlInvalid',
                          defaultMessage: 'Must be a ws:// or wss:// URL',
                        }),
                      );
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input placeholder="ws://hbbs:21118" />
            </Form.Item>

            <Form.Item
              name="relayUpstreamUrl"
              label={
                <FormattedMessage
                  id="pages.webClientSettings.relayUpstreamUrl"
                  defaultMessage="Relay Upstream URL"
                />
              }
              dependencies={['enabled']}
              rules={[
                {
                  validator(_: unknown, value: string) {
                    if (!(value ?? '').trim()) return Promise.resolve();
                    if (!isWsUrl(value.trim()))
                      return Promise.reject(
                        intl.formatMessage({
                          id: 'pages.webClientSettings.relayUpstreamUrlInvalid',
                          defaultMessage: 'Must be a ws:// or wss:// URL',
                        }),
                      );
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input placeholder="ws://hbbr:21119" />
            </Form.Item>

            {configExists && (configInfo.createdAt || configInfo.updatedAt) && (
              <>
                <Divider />
                <Descriptions column={1} size="small">
                  {configInfo.createdAt && (
                    <Descriptions.Item
                      label={
                        <FormattedMessage
                          id="pages.webClientSettings.createdAt"
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
                          id="pages.webClientSettings.updatedAt"
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

export default WebClientSettings;
