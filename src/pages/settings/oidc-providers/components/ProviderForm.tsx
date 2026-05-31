import { ModalForm } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Collapse, Form, Input, InputNumber, Select, Switch } from 'antd';
import React, { useEffect } from 'react';

interface ProviderFormProps {
  mode: 'create' | 'edit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFinish: (values: any) => Promise<boolean>;
  currentRecord?: API.OidcProvider | null;
}

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
        enabled: currentRecord.enabled,
        priority: currentRecord.priority,
      });
    }
  }, [isEdit, open, currentRecord, form]);

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
      onFinish={onFinish}
      form={form}
      layout="vertical"
      modalProps={{ destroyOnClose: true }}
      width={560}
    >
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
        />
      </Form.Item>
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
      <Form.Item
        name="priority"
        label={
          <FormattedMessage
            id="pages.oidcProviders.priority"
            defaultMessage="Priority"
          />
        }
        initialValue={0}
      >
        <InputNumber min={0} style={{ width: '100%' }} />
      </Form.Item>
    </ModalForm>
  );
};

export default ProviderForm;
