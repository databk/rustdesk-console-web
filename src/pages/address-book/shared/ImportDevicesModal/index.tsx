import { Button, Modal } from 'antd';
import { FormattedMessage, useIntl } from '@umijs/max';
import React from 'react';
import DeviceSelectTable from '@/components/DeviceSelectTable';

export interface ImportDevicesModalProps {
  open: boolean;
  selectedDeviceKeys: React.Key[];
  importing: boolean;
  onSelectionChange: (keys: React.Key[]) => void;
  onCancel: () => void;
  onSubmit: () => void;
}

const ImportDevicesModal: React.FC<ImportDevicesModalProps> = ({
  open,
  selectedDeviceKeys,
  importing,
  onSelectionChange,
  onCancel,
  onSubmit,
}) => {
  const intl = useIntl();

  return (
    <Modal
      title={<FormattedMessage id="pages.addressBook.importDevices" defaultMessage="Import Devices" />}
      open={open}
      onCancel={() => {
        onCancel();
      }}
      onOk={onSubmit}
      okButtonProps={{ loading: importing, disabled: selectedDeviceKeys.length === 0 }}
      width={1000}
    >
      <DeviceSelectTable
        selectedRowKeys={selectedDeviceKeys}
        onSelectionChange={onSelectionChange}
      />
    </Modal>
  );
};

export default ImportDevicesModal;