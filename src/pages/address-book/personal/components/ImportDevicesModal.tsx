import { FormattedMessage } from '@umijs/max';
import { Modal } from 'antd';
import React from 'react';
import DeviceSelectTable from '@/components/DeviceSelectTable';

interface ImportDevicesModalProps {
  visible: boolean;
  importing: boolean;
  selectedDeviceKeys: React.Key[];
  onSelectionChange: (keys: React.Key[]) => void;
  onOk: () => void;
  onCancel: () => void;
}

const ImportDevicesModal: React.FC<ImportDevicesModalProps> = ({
  visible,
  importing,
  selectedDeviceKeys,
  onSelectionChange,
  onOk,
  onCancel,
}) => {
  return (
    <Modal
      title={
        <FormattedMessage
          id="pages.addressBook.importDevices"
          defaultMessage="Import Devices"
        />
      }
      open={visible}
      onCancel={onCancel}
      onOk={onOk}
      okButtonProps={{
        loading: importing,
        disabled: selectedDeviceKeys.length === 0,
      }}
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
