import { AppstoreOutlined } from '@ant-design/icons';
import { FormattedMessage, useIntl } from '@umijs/max';
import {
  Col,
  Divider,
  Form,
  Input,
  Modal,
  Radio,
  Row,
  Segmented,
  Select,
  Switch,
} from 'antd';
import React from 'react';
import {
  ARCH_OPTIONS,
  CONN_TYPE_OPTIONS,
  OS_OPTIONS,
  SERVER_FIELDS,
} from '../constants';

const DISABLE_FIELDS = [
  {
    name: 'disable-installation',
    labelKey: 'pages.customClient.disableInstallation',
    defaultMessage: 'Disable Installation',
  },
  {
    name: 'disable-settings',
    labelKey: 'pages.customClient.disableSettings',
    defaultMessage: 'Disable Settings',
  },
  {
    name: 'disable-account',
    labelKey: 'pages.customClient.disableAccount',
    defaultMessage: 'Disable Account',
  },
  {
    name: 'disable-ab',
    labelKey: 'pages.customClient.disableAb',
    defaultMessage: 'Disable AB',
  },
  {
    name: 'disable-tcp-listen',
    labelKey: 'pages.customClient.disableTcpListen',
    defaultMessage: 'Disable TCP Listen',
  },
];

interface CreateBuildModalProps {
  open: boolean;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (values: Record<string, any>) => void;
  initialValues?: Record<string, any>;
}

const CreateBuildModal: React.FC<CreateBuildModalProps> = ({
  open,
  loading,
  onCancel,
  onSubmit,
  initialValues,
}) => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const osValue = Form.useWatch('os', form);
  const isAllOs = osValue === 'all';

  React.useEffect(() => {
    if (open) {
      form.setFieldsValue(
        initialValues || {
          os: 'windows',
          arch: 'x86_64',
          'conn-type': 'both',
        },
      );
    } else {
      form.resetFields();
    }
  }, [open, initialValues, form]);

  const renderDisableField = (field: (typeof DISABLE_FIELDS)[number]) => (
    <Col key={field.name} span={12}>
      <Form.Item
        name={field.name}
        valuePropName="checked"
        getValueFromEvent={(checked: boolean) => (checked ? 'Y' : 'N')}
        getValueProps={(value: string) => ({ checked: value === 'Y' })}
        label={intl.formatMessage({
          id: field.labelKey,
          defaultMessage: field.defaultMessage,
        })}
      >
        <Switch checkedChildren="Yes" unCheckedChildren="No" />
      </Form.Item>
    </Col>
  );

  return (
    <Modal
      title={intl.formatMessage({
        id: 'pages.customClient.createBuildTitle',
        defaultMessage: 'Create Custom Client',
      })}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      width={800}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onSubmit}
        initialValues={
          initialValues || {
            os: 'windows',
            arch: 'x86_64',
            'conn-type': 'both',
          }
        }
        style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: 8 }}
      >
        {/* Section: OS & Architecture */}
        <Divider titlePlacement="left" plain>
          <FormattedMessage
            id="pages.customClient.os"
            defaultMessage="Operating System"
          />{' '}
          &{' '}
          <FormattedMessage
            id="pages.customClient.arch"
            defaultMessage="Architecture"
          />
        </Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="os"
              label={intl.formatMessage({
                id: 'pages.customClient.os',
                defaultMessage: 'Operating System',
              })}
              rules={[{ required: true }]}
            >
              <Select options={OS_OPTIONS} />
            </Form.Item>
          </Col>
          <Col span={12}>
            {!isAllOs && (
              <Form.Item
                name="arch"
                label={intl.formatMessage({
                  id: 'pages.customClient.arch',
                  defaultMessage: 'Architecture',
                })}
                rules={[{ required: true }]}
              >
                <Segmented options={ARCH_OPTIONS} block />
              </Form.Item>
            )}
          </Col>
        </Row>

        <Form.Item
          name="app-name"
          label={intl.formatMessage({
            id: 'pages.customClient.appName',
            defaultMessage: 'Application Name',
          })}
          rules={[
            {
              pattern: /^[a-zA-Z]+$/,
              message: intl.formatMessage({
                id: 'pages.customClient.appNameHint',
                defaultMessage: 'Only English letters allowed',
              }),
            },
          ]}
        >
          <Input
            prefix={<AppstoreOutlined />}
            placeholder={intl.formatMessage({
              id: 'pages.customClient.appNamePlaceholder',
              defaultMessage: 'e.g. my-rustdesk',
            })}
          />
        </Form.Item>

        {/* Section: Custom Configuration */}
        <Divider titlePlacement="left" plain>
          <FormattedMessage
            id="pages.customClient.customConfig"
            defaultMessage="Custom Configuration"
          />
        </Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="password"
              label={intl.formatMessage({
                id: 'pages.customClient.password',
                defaultMessage: 'Password',
              })}
            >
              <Input.Password
                placeholder={intl.formatMessage({
                  id: 'pages.customClient.passwordPlaceholder',
                  defaultMessage: 'Enter password',
                })}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="salt"
              label={intl.formatMessage({
                id: 'pages.customClient.salt',
                defaultMessage: 'Salt',
              })}
            >
              <Input.Password
                placeholder={intl.formatMessage({
                  id: 'pages.customClient.saltPlaceholder',
                  defaultMessage: 'Enter salt',
                })}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="conn-type"
          label={intl.formatMessage({
            id: 'pages.customClient.connType',
            defaultMessage: 'Connection Type',
          })}
        >
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            options={CONN_TYPE_OPTIONS}
          />
        </Form.Item>

        {/* Disable options - 2 per row */}
        <Row gutter={16}>
          {renderDisableField(DISABLE_FIELDS[0])}
          {renderDisableField(DISABLE_FIELDS[1])}
        </Row>
        <Row gutter={16}>
          {renderDisableField(DISABLE_FIELDS[2])}
          {renderDisableField(DISABLE_FIELDS[3])}
        </Row>
        <Row gutter={16}>{renderDisableField(DISABLE_FIELDS[4])}</Row>

        {/* Section: Server Configuration */}
        <Divider titlePlacement="left" plain>
          <FormattedMessage
            id="pages.customClient.serverConfig"
            defaultMessage="Server Configuration"
          />
        </Divider>

        {SERVER_FIELDS.map(({ key, labelKey }) => (
          <Form.Item
            key={key}
            label={
              <span>
                {intl.formatMessage({ id: labelKey, defaultMessage: key })}
              </span>
            }
          >
            <Row gutter={8} align="middle">
              <Col flex="auto">
                <Form.Item name={key} noStyle>
                  <Input
                    placeholder={intl.formatMessage({
                      id: labelKey,
                      defaultMessage: key,
                    })}
                  />
                </Form.Item>
              </Col>
              <Col flex="none">
                <Form.Item name={`${key}_type`} initialValue="override" noStyle>
                  <Segmented
                    size="small"
                    options={[
                      {
                        value: 'override',
                        label: intl.formatMessage({
                          id: 'pages.customClient.overrideSettings',
                          defaultMessage: 'Override',
                        }),
                      },
                      {
                        value: 'default',
                        label: intl.formatMessage({
                          id: 'pages.customClient.defaultSettings',
                          defaultMessage: 'Default',
                        }),
                      },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form.Item>
        ))}
      </Form>
    </Modal>
  );
};

export default CreateBuildModal;
