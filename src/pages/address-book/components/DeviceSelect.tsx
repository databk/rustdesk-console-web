import { Modal, message } from 'antd';
import { useState } from 'react';
import { useIntl } from '@umijs/max';
import DeviceSelectTable from '@/components/DeviceSelectTable';
import { addPeer } from '@/services/rustdesk-console/addressBook';

type DeviceSelectProps = {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  ab_guid: string;
  abName: string;
  closeChangedCallback: () => void;
};

const DeviceSelect: React.FC<DeviceSelectProps> = (props) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [loading, setLoading] = useState(false);
  const intl = useIntl();

  const handleOk = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning(
        intl.formatMessage({
          id: 'pages.addressBook.selectAtLeastOne',
          defaultMessage: 'Please select at least one device',
        }),
      );
      return;
    }

    setLoading(true);
    let successCount = 0;
    let failCount = 0;

    for (const deviceId of selectedRowKeys) {
      try {
        await addPeer(props.ab_guid, { id: deviceId as string });
        successCount++;
      } catch {
        failCount++;
      }
    }

    setLoading(false);

    if (successCount > 0) {
      message.success(
        intl.formatMessage(
          {
            id: 'pages.addressBook.importSuccess',
            defaultMessage: 'Successfully imported {count} device(s)',
          },
          { count: successCount },
        ),
      );
      props.closeChangedCallback();
    }

    if (failCount > 0) {
      message.warning(
        intl.formatMessage(
          {
            id: 'pages.addressBook.importPartialFailed',
            defaultMessage: '{count} device(s) failed to import',
          },
          { count: failCount },
        ),
      );
    }

    props.setVisible(false);
    setSelectedRowKeys([]);
  };

  return (
    <Modal
      title={intl.formatMessage(
        {
          id: 'pages.addressBook.importDevicesTo',
          defaultMessage: 'Import Devices to {name}',
        },
        { name: props.abName },
      )}
      open={props.visible}
      onCancel={() => {
        props.setVisible(false);
        setSelectedRowKeys([]);
      }}
      onOk={handleOk}
      confirmLoading={loading}
      width={1000}
    >
      <DeviceSelectTable
        selectedRowKeys={selectedRowKeys}
        onSelectionChange={setSelectedRowKeys}
      />
    </Modal>
  );
};

export default DeviceSelect;
