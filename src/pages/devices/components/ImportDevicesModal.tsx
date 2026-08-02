import { addDeviceToGroup } from '@/services/rustdesk-console/deviceGroup';
import { FormattedMessage, useIntl } from '@umijs/max';
import { App, Modal } from 'antd';
import React, { useState } from 'react';
import DeviceSelectTable from '@/components/DeviceSelectTable';

export interface ImportDevicesModalProps {
  open: boolean;
  deviceGroupGuid: string;
  onCancel: () => void;
  onSuccess: () => void;
}

const ImportDevicesModal: React.FC<ImportDevicesModalProps> = ({
  open,
  deviceGroupGuid,
  onCancel,
  onSuccess,
}) => {
  const intl = useIntl();
  const { message: msgApi } = App.useApp();
  const [selectedDeviceKeys, setSelectedDeviceKeys] = useState<React.Key[]>([]);
  const [importing, setImporting] = useState(false);

  const handleImport = async () => {
    if (!deviceGroupGuid || selectedDeviceKeys.length === 0) return;
    setImporting(true);
    try {
      await addDeviceToGroup(deviceGroupGuid, selectedDeviceKeys as string[]);
      msgApi.success(
        intl.formatMessage(
          {
            id: 'pages.deviceGroups.importSuccess',
            defaultMessage: 'Successfully imported {count} device(s)',
          },
          { count: selectedDeviceKeys.length },
        ),
      );
      handleCancel();
      onSuccess();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.deviceGroups.importFailed',
          defaultMessage: 'Failed to import devices',
        }),
      );
    } finally {
      setImporting(false);
    }
  };

  const handleCancel = () => {
    setSelectedDeviceKeys([]);
    onCancel();
  };

  return (
    <Modal
      title={
        <FormattedMessage
          id="pages.deviceGroups.importDevices"
          defaultMessage="Import Devices"
        />
      }
      open={open}
      onCancel={handleCancel}
      onOk={handleImport}
      okButtonProps={{
        loading: importing,
        disabled: selectedDeviceKeys.length === 0,
      }}
      width={1000}
    >
      <DeviceSelectTable
        selectedRowKeys={selectedDeviceKeys}
        onSelectionChange={setSelectedDeviceKeys}
      />
    </Modal>
  );
};

export default ImportDevicesModal;
