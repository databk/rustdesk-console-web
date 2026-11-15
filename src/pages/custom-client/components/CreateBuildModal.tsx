import { AppstoreOutlined } from '@ant-design/icons';
import { FormattedMessage, useIntl } from '@umijs/max';
import {
  Button,
  Col,
  Divider,
  Form,
  Input,
  Modal,
  Radio,
  Row,
  Segmented,
  Select,
  Steps,
  Switch,
} from 'antd';
import React from 'react';
import {
  ARCH_OPTIONS,
  CONN_TYPE_OPTIONS,
  OS_ARCH_MAP,
  OS_OPTIONS,
} from '../constants';
import StrategyConfigStep, {
  type StrategyConfigValues,
} from './StrategyConfigStep';

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
}

const CreateBuildModal: React.FC<CreateBuildModalProps> = ({
  open,
  loading,
  onCancel,
  onSubmit,
}) => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = React.useState(0);
  const [strategyConfig, setStrategyConfig] =
    React.useState<StrategyConfigValues>({});
  const osValue = Form.useWatch('os', form);
  const isAllOs = osValue === 'all';
  const availableArchs =
    osValue && OS_ARCH_MAP[osValue]
      ? ARCH_OPTIONS.filter((opt) => OS_ARCH_MAP[osValue].includes(opt.value))
      : ARCH_OPTIONS;

  React.useEffect(() => {
    if (open) {
      form.setFieldsValue({
        os: 'windows',
        arch: 'x86_64',
        'conn-type': 'both',
      });
      setCurrentStep(0);
      setStrategyConfig({});
    } else {
      form.resetFields();
      setCurrentStep(0);
      setStrategyConfig({});
    }
  }, [open, form]);

  React.useEffect(() => {
    if (isAllOs) return;
    const currentArch = form.getFieldValue('arch');
    if (
      currentArch &&
      availableArchs.length > 0 &&
      !availableArchs.some((a) => a.value === currentArch)
    ) {
      form.setFieldValue('arch', availableArchs[0].value);
    }
  }, [osValue, availableArchs, isAllOs, form]);

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

  const handleNext = async () => {
    try {
      await form.validateFields();
      setCurrentStep(1);
    } catch {
      // validation errors shown by form
    }
  };

  const handlePrev = () => {
    setCurrentStep(0);
  };

  const handleSubmit = () => {
    const formValues = form.getFieldsValue();
    onSubmit({
      ...formValues,
      strategyConfig,
    });
  };

  const stepItems = [
    {
      title: intl.formatMessage({
        id: 'pages.customClient.stepBasicConfig',
        defaultMessage: 'Basic Config',
      }),
    },
    {
      title: intl.formatMessage({
        id: 'pages.customClient.stepStrategyConfig',
        defaultMessage: 'Strategy Config',
      }),
    },
  ];

  return (
    <Modal
      title={intl.formatMessage({
        id: 'pages.customClient.createBuildTitle',
        defaultMessage: 'Create Custom Client',
      })}
      open={open}
      onCancel={onCancel}
      width={900}
      destroyOnHidden
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={onCancel}>
            {intl.formatMessage({
              id: 'pages.common.cancel',
              defaultMessage: 'Cancel',
            })}
          </Button>
          <div style={{ display: 'flex', gap: 8 }}>
            {currentStep > 0 && (
              <Button onClick={handlePrev}>
                {intl.formatMessage({
                  id: 'pages.customClient.prevStep',
                  defaultMessage: 'Previous',
                })}
              </Button>
            )}
            {currentStep === 0 && (
              <Button type="primary" onClick={handleNext}>
                {intl.formatMessage({
                  id: 'pages.customClient.nextStep',
                  defaultMessage: 'Next',
                })}
              </Button>
            )}
            {currentStep === 1 && (
              <Button type="primary" loading={loading} onClick={handleSubmit}>
                {intl.formatMessage({
                  id: 'pages.customClient.submitBuild',
                  defaultMessage: 'Submit Build',
                })}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <Steps
        current={currentStep}
        items={stepItems}
        size="small"
        style={{ marginBottom: 24 }}
      />

      {currentStep === 0 && (
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            os: 'windows',
            arch: 'x86_64',
            'conn-type': 'both',
          }}
          style={{ maxHeight: '55vh', overflowY: 'auto', paddingRight: 8 }}
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
                  <Segmented options={availableArchs} block />
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
        </Form>
      )}

      {currentStep === 1 && (
        <div style={{ maxHeight: '55vh', overflowY: 'auto', paddingRight: 8 }}>
          <StrategyConfigStep
            value={strategyConfig}
            onChange={setStrategyConfig}
          />
        </div>
      )}
    </Modal>
  );
};

export default CreateBuildModal;
