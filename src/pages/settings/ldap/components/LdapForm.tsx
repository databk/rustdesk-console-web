import { FormattedMessage, useIntl } from '@umijs/max';
import {
  Button,
  Divider,
  Form,
  Input,
  Space,
  Switch,
  Descriptions,
} from 'antd';
import type { FormInstance } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import React from 'react';

interface LdapFormProps {
  form: FormInstance;
  configExists: boolean;
  configInfo: { createdAt?: string; updatedAt?: string };
}

const LdapForm: React.FC<LdapFormProps> = ({
  form,
  configExists,
  configInfo,
}) => {
  const intl = useIntl();

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        enabled: false,
        urls: [''],
        searchAttributes: [''],
        adminGroups: [''],
      }}
    >
      <Form.Item
        label={
          <FormattedMessage
            id="pages.ldap.urls"
            defaultMessage="Server URLs"
          />
        }
        required
      >
        <Form.List name="urls">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field, index) => (
                <Form.Item
                  key={field.key}
                  style={{ marginBottom: 8 }}
                  rules={[
                    {
                      required: index === 0,
                      message: intl.formatMessage({
                        id: 'pages.ldap.urlsRequired',
                        defaultMessage:
                          'Please enter at least one LDAP server URL',
                      }),
                    },
                  ]}
                >
                  <Space align="baseline" style={{ width: '100%' }}>
                    <Form.Item
                      {...field}
                      noStyle
                      rules={[
                        {
                          required: index === 0,
                          message: intl.formatMessage({
                            id: 'pages.ldap.urlsRequired',
                            defaultMessage:
                              'Please enter at least one LDAP server URL',
                          }),
                        },
                      ]}
                    >
                      <Input
                        style={{ width: 500 }}
                        placeholder={intl.formatMessage({
                          id: 'pages.ldap.urlPlaceholder',
                          defaultMessage:
                            'e.g. ldaps://ad.example.com:636',
                        })}
                      />
                    </Form.Item>
                    {fields.length > 1 && (
                      <MinusCircleOutlined
                        onClick={() => remove(field.name)}
                      />
                    )}
                  </Space>
                </Form.Item>
              ))}
              <Button
                type="dashed"
                onClick={() => add('')}
                icon={<PlusOutlined />}
                style={{ width: 500 }}
              >
                <FormattedMessage
                  id="pages.ldap.addUrl"
                  defaultMessage="Add Server URL"
                />
              </Button>
            </>
          )}
        </Form.List>
      </Form.Item>

      <Form.Item
        name="bindDN"
        label={
          <FormattedMessage
            id="pages.ldap.bindDN"
            defaultMessage="Bind DN"
          />
        }
        rules={[
          {
            required: true,
            message: intl.formatMessage({
              id: 'pages.ldap.bindDNRequired',
              defaultMessage: 'Please enter the service account Bind DN',
            }),
          },
        ]}
      >
        <Input
          placeholder={intl.formatMessage({
            id: 'pages.ldap.bindDNPlaceholder',
            defaultMessage:
              'e.g. CN=svc-ldap,OU=ServiceAccounts,DC=example,DC=com',
          })}
        />
      </Form.Item>

      <Form.Item
        name="bindCredentials"
        label={
          <FormattedMessage
            id="pages.ldap.bindCredentials"
            defaultMessage="Bind Password"
          />
        }
        rules={[
          {
            required: !configExists,
            message: intl.formatMessage({
              id: 'pages.ldap.bindCredentialsRequired',
              defaultMessage: 'Please enter the service account password',
            }),
          },
        ]}
      >
        <Input.Password
          placeholder={intl.formatMessage({
            id: 'pages.ldap.bindCredentialsPlaceholder',
            defaultMessage: 'Please enter the service account password',
          })}
        />
      </Form.Item>

      <Form.Item
        name="searchBase"
        label={
          <FormattedMessage
            id="pages.ldap.searchBase"
            defaultMessage="Search Base DN"
          />
        }
        rules={[
          {
            required: true,
            message: intl.formatMessage({
              id: 'pages.ldap.searchBaseRequired',
              defaultMessage: 'Please enter the search base DN',
            }),
          },
        ]}
      >
        <Input
          placeholder={intl.formatMessage({
            id: 'pages.ldap.searchBasePlaceholder',
            defaultMessage: 'e.g. DC=example,DC=com',
          })}
        />
      </Form.Item>

      <Form.Item
        name="searchFilter"
        label={
          <FormattedMessage
            id="pages.ldap.searchFilter"
            defaultMessage="Search Filter"
          />
        }
        rules={[
          {
            required: true,
            message: intl.formatMessage({
              id: 'pages.ldap.searchFilterRequired',
              defaultMessage: 'Please enter the search filter',
            }),
          },
        ]}
        extra={
          <FormattedMessage
            id="pages.ldap.searchFilterHelp"
            defaultMessage="Use {{username}} as the username placeholder. AD: (sAMAccountName={{username}}), OpenLDAP: (uid={{username}})"
            values={{ username: '{{username}}' }}
          />
        }
      >
        <Input
          placeholder={intl.formatMessage(
            {
              id: 'pages.ldap.searchFilterPlaceholder',
              defaultMessage: 'e.g. (sAMAccountName={{username}})',
            },
            { username: '{{username}}' },
          )}
        />
      </Form.Item>

      <Form.Item
        label={
          <FormattedMessage
            id="pages.ldap.searchAttributes"
            defaultMessage="Search Attributes"
          />
        }
      >
        <Form.List name="searchAttributes">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field) => (
                <Space
                  key={field.key}
                  align="baseline"
                  style={{ marginBottom: 8 }}
                >
                  <Form.Item {...field} noStyle>
                    <Input
                      style={{ width: 300 }}
                      placeholder={intl.formatMessage({
                        id: 'pages.ldap.searchAttributePlaceholder',
                        defaultMessage:
                          'e.g. dn, sAMAccountName, mail, displayName',
                      })}
                    />
                  </Form.Item>
                  {fields.length > 1 && (
                    <MinusCircleOutlined
                      onClick={() => remove(field.name)}
                    />
                  )}
                </Space>
              ))}
              <Button
                type="dashed"
                onClick={() => add('')}
                icon={<PlusOutlined />}
              >
                <FormattedMessage
                  id="pages.ldap.addAttribute"
                  defaultMessage="Add Attribute"
                />
              </Button>
            </>
          )}
        </Form.List>
      </Form.Item>

      <Divider />

      <Form.Item
        name="groupSearchBase"
        label={
          <FormattedMessage
            id="pages.ldap.groupSearchBase"
            defaultMessage="Group Search Base DN"
          />
        }
      >
        <Input
          placeholder={intl.formatMessage({
            id: 'pages.ldap.groupSearchBasePlaceholder',
            defaultMessage: 'e.g. OU=Groups,DC=example,DC=com',
          })}
        />
      </Form.Item>

      <Form.Item
        name="groupSearchFilter"
        label={
          <FormattedMessage
            id="pages.ldap.groupSearchFilter"
            defaultMessage="Group Search Filter"
          />
        }
        extra={
          <FormattedMessage
            id="pages.ldap.groupSearchFilterHelp"
            defaultMessage="Use {{dn}} as the user DN placeholder. e.g. (member={{dn}})"
            values={{ dn: '{{dn}}' }}
          />
        }
      >
        <Input
          placeholder={intl.formatMessage(
            {
              id: 'pages.ldap.groupSearchFilterPlaceholder',
              defaultMessage: 'e.g. (member={{dn}})',
            },
            { dn: '{{dn}}' },
          )}
        />
      </Form.Item>

      <Form.Item
        label={
          <FormattedMessage
            id="pages.ldap.adminGroups"
            defaultMessage="Admin Groups"
          />
        }
        extra={
          <FormattedMessage
            id="pages.ldap.adminGroupsHelp"
            defaultMessage="Users in these LDAP groups will be mapped as administrators (case-insensitive match)"
          />
        }
      >
        <Form.List name="adminGroups">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field) => (
                <Space
                  key={field.key}
                  align="baseline"
                  style={{ marginBottom: 8 }}
                >
                  <Form.Item {...field} noStyle>
                    <Input
                      style={{ width: 500 }}
                      placeholder={intl.formatMessage({
                        id: 'pages.ldap.adminGroupPlaceholder',
                        defaultMessage:
                          'e.g. CN=Admins,OU=Groups,DC=example,DC=com',
                      })}
                    />
                  </Form.Item>
                  <MinusCircleOutlined
                    onClick={() => remove(field.name)}
                  />
                </Space>
              ))}
              <Button
                type="dashed"
                onClick={() => add('')}
                icon={<PlusOutlined />}
              >
                <FormattedMessage
                  id="pages.ldap.addAdminGroup"
                  defaultMessage="Add Admin Group"
                />
              </Button>
            </>
          )}
        </Form.List>
      </Form.Item>

      <Divider />

      <Form.Item
        label={
          <FormattedMessage
            id="pages.ldap.tlsOptions"
            defaultMessage="TLS Options"
          />
        }
      >
        <Form.Item
          name={['tlsOptions', 'ca']}
          label={
            <FormattedMessage
              id="pages.ldap.tlsCa"
              defaultMessage="CA Certificate (PEM)"
            />
          }
        >
          <Input.TextArea
            rows={3}
            placeholder={intl.formatMessage({
              id: 'pages.ldap.tlsCaPlaceholder',
              defaultMessage: '-----BEGIN CERTIFICATE-----\n...',
            })}
          />
        </Form.Item>
        <Form.Item
          name={['tlsOptions', 'cert']}
          label={
            <FormattedMessage
              id="pages.ldap.tlsCert"
              defaultMessage="Client Certificate (PEM)"
            />
          }
        >
          <Input.TextArea
            rows={3}
            placeholder={intl.formatMessage({
              id: 'pages.ldap.tlsCertPlaceholder',
              defaultMessage: '-----BEGIN CERTIFICATE-----\n...',
            })}
          />
        </Form.Item>
        <Form.Item
          name={['tlsOptions', 'key']}
          label={
            <FormattedMessage
              id="pages.ldap.tlsKey"
              defaultMessage="Client Private Key (PEM)"
            />
          }
        >
          <Input.TextArea
            rows={3}
            placeholder={intl.formatMessage({
              id: 'pages.ldap.tlsKeyPlaceholder',
              defaultMessage: '-----BEGIN PRIVATE KEY-----\n...',
            })}
          />
        </Form.Item>
        <Form.Item
          name={['tlsOptions', 'servername']}
          label={
            <FormattedMessage
              id="pages.ldap.tlsServername"
              defaultMessage="SNI Server Name"
            />
          }
        >
          <Input
            placeholder={intl.formatMessage({
              id: 'pages.ldap.tlsServernamePlaceholder',
              defaultMessage: 'Server Name Indication for TLS',
            })}
          />
        </Form.Item>
      </Form.Item>

      <Divider />

      <Form.Item
        name="enabled"
        label={
          <FormattedMessage
            id="pages.ldap.enabled"
            defaultMessage="Enable LDAP Authentication"
          />
        }
        valuePropName="checked"
        extra={
          <FormattedMessage
            id="pages.ldap.enabledHelp"
            defaultMessage="When enabled, users will be authenticated against the LDAP server. Existing LDAP-linked users will always use LDAP authentication regardless of this setting."
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
                    id="pages.ldap.createdAt"
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
                    id="pages.ldap.updatedAt"
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
  );
};

export default LdapForm;