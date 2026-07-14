import { FormattedMessage, useIntl } from '@umijs/max';
import { Form, Input, Modal, Radio, Select, Typography } from 'antd';
import React from 'react';
import {
  ARCH_OPTIONS,
  CONN_TYPE_OPTIONS,
  DISABLE_OPTIONS,
  SERVER_FIELDS,
} from '../constants';

const { Title, Paragraph } = Typography;

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
      width={720}
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
        <Title level={5} style={{ marginTop: 0 }}>
          <FormattedMessage id="pages.nexus.os" defaultMessage="Operating System" /> &{' '}
          <FormattedMessage id="pages.nexus.arch" defaultMessage="Architecture" />
        </Title>

        <Form.Item
          label={intl.formatMessage({ id: 'pages.nexus.os', defaultMessage: 'Operating System' })}
        >
          <Select value="windows" disabled options={[{ value: 'windows', label: 'Windows' }]} />
        </Form.Item>

        <Form.Item
          name="arch"
          label={intl.formatMessage({ id: 'pages.nexus.arch', defaultMessage: 'Architecture' })}
          rules={[{ required: true }]}
        >
          <Select options={ARCH_OPTIONS} />
        </Form.Item>

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
            placeholder={intl.formatMessage({
              id: 'pages.nexus.appNamePlaceholder',
              defaultMessage: 'e.g. my-rustdesk',
            })}
          />
        </Form.Item>

        <Title level={5}>
          <FormattedMessage id="pages.nexus.customConfig" defaultMessage="Custom Configuration" />
        </Title>

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

        <Form.Item
          name="salt"
          label={intl.formatMessage({ id: 'pages.nexus.salt', defaultMessage: 'Salt' })}
        >
          <Input
            placeholder={intl.formatMessage({
              id: 'pages.nexus.saltPlaceholder',
              defaultMessage: 'Enter salt',
            })}
          />
        </Form.Item>

        <Form.Item
          name="conn-type"
          label={intl.formatMessage({ id: 'pages.nexus.connType', defaultMessage: 'Connection Type' })}
        >
          <Select options={CONN_TYPE_OPTIONS} allowClear />
        </Form.Item>

        <Form.Item
          name="disable-installation"
          label={intl.formatMessage({
            id: 'pages.nexus.disableInstallation',
            defaultMessage: 'Disable Installation',
          })}
        >
          <Select options={DISABLE_OPTIONS} allowClear />
        </Form.Item>

        <Form.Item
          name="disable-settings"
          label={intl.formatMessage({
            id: 'pages.nexus.disableSettings',
            defaultMessage: 'Disable Settings',
          })}
        >
          <Select options={DISABLE_OPTIONS} allowClear />
        </Form.Item>

        <Form.Item
          name="disable-account"
          label={intl.formatMessage({
            id: 'pages.nexus.disableAccount',
            defaultMessage: 'Disable Account',
          })}
        >
          <Select options={DISABLE_OPTIONS} allowClear />
        </Form.Item>

        <Form.Item
          name="disable-ab"
          label={intl.formatMessage({ id: 'pages.nexus.disableAb', defaultMessage: 'Disable AB' })}
        >
          <Select options={DISABLE_OPTIONS} allowClear />
        </Form.Item>

        <Form.Item
          name="disable-tcp-listen"
          label={intl.formatMessage({
            id: 'pages.nexus.disableTcpListen',
            defaultMessage: 'Disable TCP Listen',
          })}
        >
          <Select options={DISABLE_OPTIONS} allowClear />
        </Form.Item>

        <Title level={5} style={{ marginTop: 24 }}>
          <FormattedMessage id="pages.nexus.serverConfig" defaultMessage="Server Configuration" />
        </Title>
        <Paragraph type="secondary">
          <FormattedMessage
            id="pages.nexus.monthlyLimit"
            defaultMessage="Monthly build limit: 15 per user. Concurrent builds: 1."
          />
        </Paragraph>

        {SERVER_FIELDS.map(({ key, labelKey }) => (
          <div key={key} style={{ marginBottom: 16 }}>
            <Form.Item
              name={key}
              label={intl.formatMessage({ id: labelKey, defaultMessage: key })}
              style={{ marginBottom: 4 }}
            >
              <Input placeholder={intl.formatMessage({ id: labelKey, defaultMessage: key })} />
            </Form.Item>
            <Form.Item
              name={`${key}_type`}
              initialValue="override"
              style={{ marginBottom: 0 }}
            >
              <Radio.Group
                optionType="button"
                size="small"
                options={[
                  {
                    value: 'override',
                    label: intl.formatMessage({
                      id: 'pages.nexus.overrideSettings',
                      defaultMessage: 'Override Settings',
                    }),
                  },
                  {
                    value: 'default',
                    label: intl.formatMessage({
                      id: 'pages.nexus.defaultSettings',
                      defaultMessage: 'Default Settings',
                    }),
                  },
                ]}
              />
            </Form.Item>
          </div>
        ))}
      </Form>
    </Modal>
  );
};

export default CreateBuildModal;
