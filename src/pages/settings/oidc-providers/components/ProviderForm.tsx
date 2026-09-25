import { ModalForm } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import {
  App,
  Collapse,
  Form,
  Input,
  Select,
  Switch,
  Upload,
  Button,
  Space,
} from 'antd';
import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
import OidcIcon, { BUILTIN_ICONS } from '@/components/OidcIcon';

interface ProviderFormProps {
  mode: 'create' | 'edit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFinish: (values: any) => Promise<boolean>;
  currentRecord?: API.OidcProvider | null;
}

const BUILTIN_PROVIDER_PRESETS: Record<
  string,
  {
    name: string;
    type: 'oidc' | 'oauth2';
    issuer?: string;
    scope?: string;
    authorizationEndpoint?: string;
    tokenEndpoint?: string;
    userinfoEndpoint?: string;
  }
> = {
  google: {
    name: 'Google',
    type: 'oidc',
    issuer: 'https://accounts.google.com',
    scope: 'openid email profile',
  },
  github: {
    name: 'GitHub',
    type: 'oauth2',
    issuer: 'https://github.com',
    scope: 'read:user user:email',
    authorizationEndpoint: 'https://github.com/login/oauth/authorize',
    tokenEndpoint: 'https://github.com/login/oauth/access_token',
    userinfoEndpoint: 'https://api.github.com/user',
  },
  gitlab: {
    name: 'GitLab',
    type: 'oauth2',
    issuer: 'https://gitlab.com',
    scope: 'read_user',
    authorizationEndpoint: 'https://gitlab.com/oauth/authorize',
    tokenEndpoint: 'https://gitlab.com/oauth/token',
    userinfoEndpoint: 'https://gitlab.com/api/v4/user',
  },
  apple: {
    name: 'Apple',
    type: 'oidc',
    issuer: 'https://appleid.apple.com',
    scope: 'name email',
  },
  facebook: {
    name: 'Facebook',
    type: 'oauth2',
    issuer: 'https://graph.facebook.com',
    scope: 'email public_profile',
    authorizationEndpoint: 'https://www.facebook.com/v26.0/dialog/oauth',
    tokenEndpoint: 'https://graph.facebook.com/v26.0/oauth/access_token',
    userinfoEndpoint: 'https://graph.facebook.com/me',
  },
  okta: {
    name: 'Okta',
    type: 'oidc',
    scope: 'openid email profile',
  },

  auth0: {
    name: 'Auth0',
    type: 'oidc',
    scope: 'openid email profile',
  },
  microsoft: {
    name: 'Microsoft',
    type: 'oidc',
    issuer: 'https://login.microsoftonline.com/common',
    scope: 'openid email profile',
  },
};

const ProviderForm: React.FC<ProviderFormProps> = ({
  mode,
  open,
  onOpenChange,
  onFinish,
  currentRecord,
}) => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const isEdit = mode === 'edit';
  const { message } = App.useApp();
  const [iconPreview, setIconPreview] = useState<string | undefined>(undefined);
  const [providerName, setProviderName] = useState<string>('');
  const [isBuiltin, setIsBuiltin] = useState(false);
  const [needsIssuer, setNeedsIssuer] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('');

  const PRESETS_WITH_OVERRIDABLE_ISSUER = new Set(['microsoft']);

  useEffect(() => {
    if (isEdit && open && currentRecord) {
      form.setFieldsValue({
        name: currentRecord.name,
        type: currentRecord.type || 'oidc',
        issuer: currentRecord.issuer,
        clientId: currentRecord.clientId,
        clientSecret: currentRecord.clientSecret || '',
        scope: currentRecord.scope,
        authorizationEndpoint: currentRecord.authorizationEndpoint,
        tokenEndpoint: currentRecord.tokenEndpoint,
        userinfoEndpoint: currentRecord.userinfoEndpoint,
        jwksUri: currentRecord.jwksUri,
        icon: currentRecord.icon || undefined,
        enabled: currentRecord.enabled,
      });
      setIconPreview(currentRecord.icon || undefined);
      setProviderName(currentRecord.name);
    } else if (!open) {
      setIconPreview(undefined);
      setProviderName('');
      setIsBuiltin(false);
      setNeedsIssuer(false);
      setSelectedPreset('');
    }
  }, [isEdit, open, currentRecord, form]);

  const handlePresetChange = (preset: string) => {
    if (preset && BUILTIN_PROVIDER_PRESETS[preset]) {
      const config = BUILTIN_PROVIDER_PRESETS[preset];
      form.setFieldsValue({
        name: config.name,
        type: config.type,
        issuer: config.issuer || '',
        scope: config.scope || '',
        authorizationEndpoint: config.authorizationEndpoint || '',
        tokenEndpoint: config.tokenEndpoint || '',
        userinfoEndpoint: config.userinfoEndpoint || '',
        jwksUri: '',
      });
      setProviderName(config.name);
      setIsBuiltin(true);
      setSelectedPreset(preset);
      setNeedsIssuer(
        !config.issuer || PRESETS_WITH_OVERRIDABLE_ISSUER.has(preset),
      );
    } else {
      form.setFieldsValue({
        name: '',
        type: 'oidc',
        issuer: '',
        scope: '',
        authorizationEndpoint: '',
        tokenEndpoint: '',
        userinfoEndpoint: '',
        jwksUri: '',
      });
      setProviderName('');
      setIsBuiltin(false);
      setSelectedPreset('');
      setNeedsIssuer(false);
    }
  };

  const handleSvgUpload = (file: File) => {
    if (file.size > 100 * 1024) {
      message.error(
        intl.formatMessage({
          id: 'pages.oidcProviders.svgTooLarge',
          defaultMessage: 'SVG file too large (max 100KB)',
        }),
      );
      return false;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const svgContent = e.target?.result as string;
      if (!/<svg[\s>]/i.test(svgContent)) {
        message.error(
          intl.formatMessage({
            id: 'pages.oidcProviders.invalidSvg',
            defaultMessage: 'Invalid SVG content',
          }),
        );
        return;
      }
      form.setFieldValue('icon', svgContent);
      setIconPreview(svgContent);
    };
    reader.readAsText(file);
    return false;
  };

  const clearIcon = () => {
    form.setFieldValue('icon', undefined);
    setIconPreview(undefined);
  };

  const handleFinish = async (values: any) => {
    const finalValues = { ...values };
    if (isBuiltin && selectedPreset) {
      const config = BUILTIN_PROVIDER_PRESETS[selectedPreset];
      if (config) {
        if (!finalValues.type) finalValues.type = config.type;
        if (!finalValues.issuer && config.issuer)
          finalValues.issuer = config.issuer;
        if (!finalValues.scope && config.scope)
          finalValues.scope = config.scope;
        if (!finalValues.authorizationEndpoint && config.authorizationEndpoint)
          finalValues.authorizationEndpoint = config.authorizationEndpoint;
        if (!finalValues.tokenEndpoint && config.tokenEndpoint)
          finalValues.tokenEndpoint = config.tokenEndpoint;
        if (!finalValues.userinfoEndpoint && config.userinfoEndpoint)
          finalValues.userinfoEndpoint = config.userinfoEndpoint;
      }
    }
    for (const key of [
      'authorizationEndpoint',
      'tokenEndpoint',
      'userinfoEndpoint',
      'jwksUri',
    ]) {
      if (finalValues[key] === '') delete finalValues[key];
    }
    return onFinish(finalValues);
  };

  return (
    <ModalForm
      title={
        <FormattedMessage
          id={
            isEdit ? 'pages.oidcProviders.edit' : 'pages.oidcProviders.create'
          }
          defaultMessage={
            isEdit ? 'Edit OIDC Provider' : 'Create OIDC Provider'
          }
        />
      }
      open={open}
      onOpenChange={onOpenChange}
      onFinish={handleFinish}
      form={form}
      layout="vertical"
      modalProps={{ destroyOnHidden: true }}
      width={560}
    >
      {!isEdit && (
        <Form.Item
          name="preset"
          label={
            <FormattedMessage
              id="pages.oidcProviders.preset"
              defaultMessage="Provider Template"
            />
          }
        >
          <Select
            placeholder={intl.formatMessage({
              id: 'pages.oidcProviders.presetPlaceholder',
              defaultMessage: 'Select a built-in provider or custom',
            })}
            onChange={handlePresetChange}
            allowClear
          >
            {BUILTIN_ICONS.map((name) => (
              <Select.Option key={name} value={name}>
                <Space>
                  <OidcIcon name={name} width={16} height={16} />
                  {BUILTIN_PROVIDER_PRESETS[name]?.name || name}
                </Space>
              </Select.Option>
            ))}
            <Select.Option value="custom">
              <FormattedMessage
                id="pages.oidcProviders.custom"
                defaultMessage="Custom"
              />
            </Select.Option>
          </Select>
        </Form.Item>
      )}
      {isBuiltin ? (
        <Form.Item name="name" hidden>
          <Input />
        </Form.Item>
      ) : (
        <Form.Item
          name="name"
          label={
            <FormattedMessage
              id="pages.oidcProviders.name"
              defaultMessage="Provider Name"
            />
          }
          rules={[{ required: true }]}
        >
          <Input
            placeholder={intl.formatMessage({
              id: 'pages.oidcProviders.enterName',
              defaultMessage: 'Enter provider name',
            })}
            onChange={(e) => setProviderName(e.target.value)}
          />
        </Form.Item>
      )}
      {!isBuiltin && (
        <Form.Item
          name="type"
          label={
            <FormattedMessage
              id="pages.oidcProviders.type"
              defaultMessage="Type"
            />
          }
          initialValue="oidc"
        >
          <Select>
            <Select.Option value="oidc">OIDC</Select.Option>
            <Select.Option value="oauth2">OAuth2</Select.Option>
          </Select>
        </Form.Item>
      )}
      {(!isBuiltin || needsIssuer) && (
        <Form.Item
          name="issuer"
          label={
            <FormattedMessage
              id="pages.oidcProviders.issuer"
              defaultMessage="Issuer URL"
            />
          }
          rules={[
            { required: true },
            { type: 'url', message: 'Please enter a valid URL' },
          ]}
        >
          <Input
            placeholder={intl.formatMessage({
              id: 'pages.oidcProviders.enterIssuer',
              defaultMessage: 'Enter issuer URL',
            })}
          />
        </Form.Item>
      )}
      <Form.Item
        name="clientId"
        label={
          <FormattedMessage
            id="pages.oidcProviders.clientId"
            defaultMessage="Client ID"
          />
        }
        rules={[{ required: true }]}
      >
        <Input
          placeholder={intl.formatMessage({
            id: 'pages.oidcProviders.enterClientId',
            defaultMessage: 'Enter client ID',
          })}
        />
      </Form.Item>
      <Form.Item
        name="clientSecret"
        label={
          <FormattedMessage
            id="pages.oidcProviders.clientSecret"
            defaultMessage="Client Secret"
          />
        }
      >
        <Input.Password
          placeholder={intl.formatMessage({
            id: 'pages.oidcProviders.enterClientSecret',
            defaultMessage: 'Enter client secret',
          })}
        />
      </Form.Item>
      {!isBuiltin && (
        <Form.Item
          name="scope"
          label={
            <FormattedMessage
              id="pages.oidcProviders.scope"
              defaultMessage="Scope"
            />
          }
        >
          <Input placeholder="openid email profile" />
        </Form.Item>
      )}
      {!isBuiltin && (
        <Collapse
          ghost
          items={[
            {
              key: 'endpoints',
              label: (
                <FormattedMessage
                  id="pages.oidcProviders.endpointConfig"
                  defaultMessage="Endpoint Configuration"
                />
              ),
              children: (
                <>
                  <Form.Item
                    name="authorizationEndpoint"
                    label={
                      <FormattedMessage
                        id="pages.oidcProviders.authorizationEndpoint"
                        defaultMessage="Authorization Endpoint"
                      />
                    }
                  >
                    <Input
                      placeholder={intl.formatMessage({
                        id: 'pages.oidcProviders.enterEndpoint',
                        defaultMessage: 'Auto-discovered if empty',
                      })}
                    />
                  </Form.Item>
                  <Form.Item
                    name="tokenEndpoint"
                    label={
                      <FormattedMessage
                        id="pages.oidcProviders.tokenEndpoint"
                        defaultMessage="Token Endpoint"
                      />
                    }
                  >
                    <Input
                      placeholder={intl.formatMessage({
                        id: 'pages.oidcProviders.enterEndpoint',
                        defaultMessage: 'Auto-discovered if empty',
                      })}
                    />
                  </Form.Item>
                  <Form.Item
                    name="userinfoEndpoint"
                    label={
                      <FormattedMessage
                        id="pages.oidcProviders.userinfoEndpoint"
                        defaultMessage="Userinfo Endpoint"
                      />
                    }
                  >
                    <Input
                      placeholder={intl.formatMessage({
                        id: 'pages.oidcProviders.enterEndpoint',
                        defaultMessage: 'Auto-discovered if empty',
                      })}
                    />
                  </Form.Item>
                  <Form.Item
                    name="jwksUri"
                    label={
                      <FormattedMessage
                        id="pages.oidcProviders.jwksUri"
                        defaultMessage="JWKS URI"
                      />
                    }
                  >
                    <Input
                      placeholder={intl.formatMessage({
                        id: 'pages.oidcProviders.enterEndpoint',
                        defaultMessage: 'Auto-discovered if empty',
                      })}
                    />
                  </Form.Item>
                </>
              ),
            },
          ]}
        />
      )}
      {!isBuiltin && (
        <Form.Item
          label={
            <FormattedMessage
              id="pages.oidcProviders.icon"
              defaultMessage="Icon (SVG)"
            />
          }
        >
          <Space>
            <OidcIcon
              name={providerName}
              icon={iconPreview}
              width={24}
              height={24}
            />
            <Upload
              accept=".svg"
              maxCount={1}
              showUploadList={false}
              beforeUpload={handleSvgUpload}
            >
              <Button icon={<UploadOutlined />}>
                <FormattedMessage
                  id="pages.oidcProviders.uploadSvg"
                  defaultMessage="Upload SVG"
                />
              </Button>
            </Upload>
            {iconPreview && (
              <Button icon={<DeleteOutlined />} onClick={clearIcon} danger>
                <FormattedMessage
                  id="pages.oidcProviders.clearIcon"
                  defaultMessage="Clear"
                />
              </Button>
            )}
          </Space>
        </Form.Item>
      )}
      <Form.Item name="icon" hidden>
        <Input />
      </Form.Item>
      <Form.Item
        name="enabled"
        label={
          <FormattedMessage
            id="pages.oidcProviders.enabled"
            defaultMessage="Enabled"
          />
        }
        valuePropName="checked"
        initialValue={true}
      >
        <Switch />
      </Form.Item>
    </ModalForm>
  );
};

export default ProviderForm;
