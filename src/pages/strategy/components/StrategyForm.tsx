import { ModalForm } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Divider, Form, Input } from 'antd';
import React, { useEffect, useState } from 'react';
import ConfigOptionsForm from './ConfigOptionsForm';

interface StrategyFormProps {
  mode: 'create' | 'edit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFinish: (
    values: API.CreateStrategyParams | API.UpdateStrategyParams,
  ) => Promise<boolean>;
  currentRecord?: API.StrategyItem | null;
}

const StrategyForm: React.FC<StrategyFormProps> = ({
  mode,
  open,
  onOpenChange,
  onFinish,
  currentRecord,
}) => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const isEdit = mode === 'edit';
  const [configOptions, setConfigOptions] = useState<Record<string, string>>(
    {},
  );

  useEffect(() => {
    if (open) {
      if (isEdit && currentRecord) {
        form.setFieldsValue({
          name: currentRecord.name,
          note: currentRecord.note || '',
        });
        setConfigOptions(currentRecord.config_options || {});
      } else {
        form.resetFields();
        setConfigOptions({});
      }
    }
  }, [isEdit, open, currentRecord, form]);

  const handleFinish = async () => {
    try {
      const values = await form.validateFields();
      const submitData = {
        name: values.name,
        note: values.note || undefined,
        config_options:
          Object.keys(configOptions).length > 0 ? configOptions : undefined,
      };
      return await onFinish(submitData);
    } catch {
      return false;
    }
  };

  return (
    <ModalForm
      title={
        <FormattedMessage
          id={isEdit ? 'pages.strategies.edit' : 'pages.strategies.create'}
          defaultMessage={isEdit ? 'Edit Strategy' : 'Create Strategy'}
        />
      }
      open={open}
      onOpenChange={onOpenChange}
      onFinish={handleFinish}
      form={form}
      layout="vertical"
      modalProps={{ destroyOnClose: true }}
      width={720}
    >
      <Form.Item
        name="name"
        label={
          <FormattedMessage
            id="pages.strategies.name"
            defaultMessage="Strategy Name"
          />
        }
        rules={[{ required: true }]}
      >
        <Input
          placeholder={intl.formatMessage({
            id: 'pages.strategies.enterName',
            defaultMessage: 'Enter strategy name',
          })}
        />
      </Form.Item>
      <Form.Item
        name="note"
        label={
          <FormattedMessage id="pages.strategies.note" defaultMessage="Note" />
        }
      >
        <Input.TextArea
          rows={2}
          placeholder={intl.formatMessage({
            id: 'pages.common.enterDescription',
            defaultMessage: 'Enter description',
          })}
        />
      </Form.Item>

      <Divider orientation="left" style={{ fontSize: 14 }}>
        <FormattedMessage
          id="pages.strategies.configOptions"
          defaultMessage="Configuration Options"
        />
      </Divider>

      <ConfigOptionsForm value={configOptions} onChange={setConfigOptions} />
    </ModalForm>
  );
};

export default StrategyForm;
