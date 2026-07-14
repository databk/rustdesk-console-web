import { AppstoreOutlined, QuestionCircleOutlined } from '@ant-design/icons';
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
  Switch,
  Tooltip,
  Typography,
} from 'antd';
import React from 'react';
import {
  ARCH_OPTIONS,
  CONN_TYPE_OPTIONS,
  SERVER_FIELDS,
} from '../constants';

const { Paragraph } = Typography;

const DISABLE_FIELDS = [
  {
    name: 'disable-installation',
    labelKey: 'pages.nexus.disableInstallation',
    defaultMessage: 'Disable Installation',
  },
  {
    name: 'disable-settings',
    labelKey: 'pages.nexus.disableSettings',
    defaultMessage: 'Disable Settings',
  },
  {
    name: 'disable-account',
    labelKey: 'pages.nexus.disableAccount',
    defaultMessage: 'Disable Account',
  },
  {
    name: 'disable-ab',
    labelKey: 'pages.nexus.disableAb',
    defaultMessage: 'Disable AB',
  },
  {
    name: 'disable-tcp-listen',
    labelKey: 'pages.nexus.disableTcpListen',
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

  React.useEffect(() => {
    if (open) {
      form.setFieldsValue(initialValues || {
        arch: 'x86_64',
        'conn-type': 'both',
      });
    } else {
      form.resetFields();
    }
  }, [open, initialValues, form]);

  const renderDisableField = (field: typeof DISABLE_FIELDS[number]) => (
    <Col key={field.name} span={12}>
      <Form.Item
        name={field.name}
        valuePropName="checked"
        getValueFromEvent={(checked: boolean) => (checked ? 'Y' : 'N')}
        getValueProps={(value: string) => ({ checked: value === 'Y' })}
        label={intl.formatMessage({ id: field.labelKey, defaultMessage: field.defaultMessage })}
      >
        <Switch checkedChildren="Yes" unCheckedChildren="No" />
      </Form.Item>
    </Col>
  );

  return (
    <Modal
      title={intl.formatMessage({
        id: 'pages.nexus.createBuildTitle',
        defaultMessage: 'Create Custom Client',
      })}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      width={800}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onSubmit}
        initialValues={initialValues || {
          arch: 'x86_64',
          'conn-type': 'both',
        }}
        style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: 8 }}
      >
        {/* Section: OS & Architecture */}
        <Divider orientation="left" plain>
          <FormattedMessage id="pages.nexus.os" defaultMessage="Operating System" /> &{' '}
          <FormattedMessage id="pages.nexus.arch" defaultMessage="Architecture" />
        </Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={intl.formatMessage({ id: 'pages.nexus.os', defaultMessage: 'Operating System' })}
            >
              <Input value="Windows" disabled />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="arch"
              label={intl.formatMessage({ id: 'pages.nexus.arch', defaultMessage: 'Architecture' })}
              rules={[{ required: true }]}
            >
              <Segmented options={ARCH_OPTIONS} block />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="app-name"
          label={intl.formatMessage({ id: 'pages.nexus.appName', defaultMessage: 'Application Name' })}
          rules={[
            {
              pattern: /^[a-zA-Z]+$/,
              message: intl.formatMessage({
                id: 'pages.nexus.appNameHint',
                defaultMessage: 'Only English letters allowed',
              }),
            },
          ]}
        >
          <Input
            prefix={<AppstoreOutlined />}
            placeholder={intl.formatMessage({
              id: 'pages.nexus.appNamePlaceholder',
              defaultMessage: 'e.g. my-rustdesk',
            })}
          />
        </Form.Item>

        {/* Section: Custom Configuration */}
        <Divider orientation="left" plain>
          <FormattedMessage id="pages.nexus.customConfig" defaultMessage="Custom Configuration" />
        </Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="password"
              label={intl.formatMessage({ id: 'pages.nexus.password', defaultMessage: 'Password' })}
            >
              <Input.Password
                placeholder={intl.formatMessage({
                  id: 'pages.nexus.passwordPlaceholder',
                  defaultMessage: 'Enter password',
                })}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="salt"
              label={intl.formatMessage({ id: 'pages.nexus.salt', defaultMessage: 'Salt' })}
            >
              <Input.Password
                placeholder={intl.formatMessage({
                  id: 'pages.nexus.saltPlaceholder',
                  defaultMessage: 'Enter salt',
                })}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="conn-type"
          label={intl.formatMessage({ id: 'pages.nexus.connType', defaultMessage: 'Connection Type' })}
        >
          <Radio.Group optionType="button" buttonStyle="solid" options={CONN_TYPE_OPTIONS} />
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
        <Row gutter={16}>
          {renderDisableField(DISABLE_FIELDS[4])}
        </Row>

        {/* Section: Server Configuration */}
        <Divider orientation="left" plain>
          <FormattedMessage id="pages.nexus.serverConfig" defaultMessage="Server Configuration" />
        </Divider>
        <Paragraph type="secondary" style={{ marginBottom: 16 }}>
          <FormattedMessage
            id="pages.nexus.monthlyLimit"
            defaultMessage="Monthly build limit: 15 per user. Concurrent builds: 1."
          />
        </Paragraph>

        {SERVER_FIELDS.map(({ key, labelKey }) => (
          <Form.Item
            key={key}
            label={
              <span>
                {intl.formatMessage({ id: labelKey, defaultMessage: key })}
                <Tooltip
                  title={intl.formatMessage({
                    id: 'pages.nexus.serverConfigTooltip',
                    defaultMessage:
                      "Override replaces the user's setting. Default applies only if the user hasn't set a value.",
                  })}
                >
                  <QuestionCircleOutlined style={{ marginLeft: 4, color: '#999' }} />
                </Tooltip>
              </span>
            }
          >
            <Row gutter={8} align="middle">
              <Col flex="auto">
                <Form.Item name={key} noStyle>
                  <Input placeholder={intl.formatMessage({ id: labelKey, defaultMessage: key })} />
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
                          id: 'pages.nexus.overrideSettings',
                          defaultMessage: 'Override',
                        }),
                      },
                      {
                        value: 'default',
                        label: intl.formatMessage({
                          id: 'pages.nexus.defaultSettings',
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
