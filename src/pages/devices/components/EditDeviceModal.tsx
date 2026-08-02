import { updateDevice } from '@/services/rustdesk-console/device';
import { getDeviceGroupList } from '@/services/rustdesk-console/deviceGroup';
import { getStrategyList } from '@/services/rustdesk-console/strategy';
import { getAdminUserList } from '@/services/rustdesk-console/user';
import { FormattedMessage, useIntl } from '@umijs/max';
import { App, Form, Input, Modal, Select } from 'antd';
import React, { useEffect, useState } from 'react';

export interface EditDeviceModalProps {
  open: boolean;
  record: API.DeviceItem | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const EditDeviceModal: React.FC<EditDeviceModalProps> = ({
  open,
  record,
  onCancel,
  onSuccess,
}) => {
  const intl = useIntl();
  const { message: msgApi } = App.useApp();
  const [form] = Form.useForm();
  const [userOptions, setUserOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [deviceGroupOptions, setDeviceGroupOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [strategyOptions, setStrategyOptions] = useState<
    { label: string; value: string }[]
  >([]);

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        userName: record?.user_name || undefined,
        deviceGroupName: record?.device_group_name || undefined,
        strategyName: record?.strategy_name || undefined,
        note: record?.note || '',
      });
      fetchOptions();
    }
  }, [open, record]);

  const fetchOptions = async () => {
    try {
      const [usersRes, groupsRes, strategiesRes] = await Promise.all([
        getAdminUserList({ current: 1, pageSize: 1000 }),
        getDeviceGroupList({ current: 1, pageSize: 1000 }),
        getStrategyList({ current: 1, pageSize: 1000 }),
      ]);
      setUserOptions(
        (usersRes.data || []).map((u) => ({ label: u.name, value: u.name })),
      );
      setDeviceGroupOptions(
        (groupsRes.data || []).map((g) => ({ label: g.name, value: g.name })),
      );
      setStrategyOptions(
        (strategiesRes.data || []).map((s) => ({
          label: s.name,
          value: s.name,
        })),
      );
    } catch {
      // Options will remain empty, user can still type manually
    }
  };

  const handleFinish = async (values: Record<string, string | undefined>) => {
    if (!record) return;
    try {
      const data: API.UpdateDeviceParams = {};
      const original: Record<string, string | undefined> = {
        userName: record.user_name,
        deviceGroupName: record.device_group_name,
        strategyName: record.strategy_name,
        note: record.note,
      };
      const fieldMap: Record<string, keyof API.UpdateDeviceParams> = {
        userName: 'userName',
        deviceGroupName: 'deviceGroupName',
        strategyName: 'strategyName',
        note: 'note',
      };
      for (const [formKey, paramKey] of Object.entries(fieldMap)) {
        const originalValue = original[formKey] || '';
        const newValue = values[formKey] ?? '';
        if (newValue !== originalValue) {
          data[paramKey] = newValue === '' ? null : newValue;
        }
      }
      await updateDevice(record.guid, data);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.devices.updateSuccess',
          defaultMessage: 'Device updated',
        }),
      );
      handleCancel();
      onSuccess();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.devices.updateFailed',
          defaultMessage: 'Failed to update device',
        }),
      );
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={
        <FormattedMessage
          id="pages.devices.edit"
          defaultMessage="Edit Device"
        />
      }
      open={open}
      onCancel={handleCancel}
      onOk={() => form.submit()}
    >
      <Form form={form} onFinish={handleFinish} layout="vertical">
        <Form.Item
          name="userName"
          label={
            <FormattedMessage id="pages.devices.user" defaultMessage="User" />
          }
        >
          <Select
            allowClear
            showSearch
            options={userOptions}
            placeholder={intl.formatMessage({
              id: 'pages.devices.selectUser',
              defaultMessage: 'Select user',
            })}
          />
        </Form.Item>
        <Form.Item
          name="deviceGroupName"
          label={
            <FormattedMessage
              id="pages.devices.deviceGroup"
              defaultMessage="Group"
            />
          }
        >
          <Select
            allowClear
            showSearch
            options={deviceGroupOptions}
            placeholder={intl.formatMessage({
              id: 'pages.devices.selectDeviceGroup',
              defaultMessage: 'Select device group',
            })}
          />
        </Form.Item>
        <Form.Item
          name="strategyName"
          label={
            <FormattedMessage
              id="pages.devices.strategy"
              defaultMessage="Strategy"
            />
          }
        >
          <Select
            allowClear
            showSearch
            options={strategyOptions}
            placeholder={intl.formatMessage({
              id: 'pages.devices.selectStrategy',
              defaultMessage: 'Select strategy',
            })}
          />
        </Form.Item>
        <Form.Item
          name="note"
          label={
            <FormattedMessage id="pages.devices.note" defaultMessage="Note" />
          }
        >
          <Input.TextArea />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditDeviceModal;
