import {
  DeleteOutlined,
  PlusCircleOutlined,
  MinusCircleOutlined,
  SelectOutlined,
} from '@ant-design/icons';
import {
  batchUpdateDeviceStatus,
  deleteDevice,
  getDeviceList,
} from '@/services/rustdesk-console/device';
import { removeDeviceFromGroup } from '@/services/rustdesk-console/deviceGroup';
import type { ActionType } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { App, Button, Popconfirm, Space } from 'antd';
import React, { useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Settings from '../../../../config/defaultSettings';
import { getDeviceColumns } from '@/components/DeviceSelectTable/columns';
import { getActionColumn } from './columns';
import EditDeviceModal from './components/EditDeviceModal';
import ImportDevicesModal from './components/ImportDevicesModal';

export interface DeviceListProps {
  deviceGroupGuid?: string;
  title?: string;
  onBack?: () => void;
}

const DeviceList: React.FC<DeviceListProps> = ({
  deviceGroupGuid,
  title,
  onBack,
}) => {
  const intl = useIntl();
  const { message: msgApi } = App.useApp();
  const actionRef = useRef<ActionType>(null);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<API.DeviceItem | null>(
    null,
  );
  const [importModalVisible, setImportModalVisible] = useState(false);

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<API.DeviceItem[]>([]);
  const [batchRemoving, setBatchRemoving] = useState(false);
  const [batchStatusUpdating, setBatchStatusUpdating] = useState(false);

  const handleEnable = async (guid: string) => {
    try {
      const result = await batchUpdateDeviceStatus({
        guids: [guid],
        status: 'enabled',
      });
      if (result.failedCount > 0) {
        msgApi.warning(
          intl.formatMessage({
            id: 'pages.devices.enableFailed',
            defaultMessage: 'Failed to enable device',
          }),
        );
      } else {
        msgApi.success(
          intl.formatMessage({
            id: 'pages.devices.enableSuccess',
            defaultMessage: 'Device enabled',
          }),
        );
      }
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.devices.enableFailed',
          defaultMessage: 'Failed to enable device',
        }),
      );
    }
  };

  const handleDisable = async (guid: string) => {
    try {
      const result = await batchUpdateDeviceStatus({
        guids: [guid],
        status: 'disabled',
      });
      if (result.failedCount > 0) {
        msgApi.warning(
          intl.formatMessage({
            id: 'pages.devices.disableFailed',
            defaultMessage: 'Failed to disable device',
          }),
        );
      } else {
        msgApi.success(
          intl.formatMessage({
            id: 'pages.devices.disableSuccess',
            defaultMessage: 'Device disabled',
          }),
        );
      }
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.devices.disableFailed',
          defaultMessage: 'Failed to disable device',
        }),
      );
    }
  };

  const handleDelete = async (guid: string) => {
    try {
      await deleteDevice(guid);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.devices.deleteSuccess',
          defaultMessage: 'Device deleted',
        }),
      );
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.devices.deleteFailed',
          defaultMessage: 'Failed to delete device',
        }),
      );
    }
  };

  const handleRemoveFromGroup = async (deviceId: string) => {
    if (!deviceGroupGuid) return;
    try {
      await removeDeviceFromGroup(deviceGroupGuid, [deviceId]);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.devices.removeFromGroupSuccess',
          defaultMessage: 'Device removed from group',
        }),
      );
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.devices.removeFromGroupFailed',
          defaultMessage: 'Failed to remove device from group',
        }),
      );
    }
  };

  const handleBatchEnable = async () => {
    if (selectedRows.length === 0) return;
    setBatchStatusUpdating(true);
    try {
      const guids = selectedRows.map((row) => row.guid);
      const result = await batchUpdateDeviceStatus({
        guids,
        status: 'enabled',
      });
      if (result.failedCount > 0) {
        msgApi.warning(
          intl.formatMessage(
            {
              id: 'pages.devices.batchEnablePartialFailed',
              defaultMessage:
                'Successfully enabled {success} device(s), {failed} failed',
            },
            { success: result.succeededCount, failed: result.failedCount },
          ),
        );
      } else {
        msgApi.success(
          intl.formatMessage(
            {
              id: 'pages.devices.batchEnableSuccess',
              defaultMessage: 'Successfully enabled {count} device(s)',
            },
            { count: result.succeededCount },
          ),
        );
      }
      setSelectedRowKeys([]);
      setSelectedRows([]);
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.devices.batchEnableFailed',
          defaultMessage: 'Failed to enable devices',
        }),
      );
    } finally {
      setBatchStatusUpdating(false);
    }
  };

  const handleBatchDisable = async () => {
    if (selectedRows.length === 0) return;
    setBatchStatusUpdating(true);
    try {
      const guids = selectedRows.map((row) => row.guid);
      const result = await batchUpdateDeviceStatus({
        guids,
        status: 'disabled',
      });
      if (result.failedCount > 0) {
        msgApi.warning(
          intl.formatMessage(
            {
              id: 'pages.devices.batchDisablePartialFailed',
              defaultMessage:
                'Successfully disabled {success} device(s), {failed} failed',
            },
            { success: result.succeededCount, failed: result.failedCount },
          ),
        );
      } else {
        msgApi.success(
          intl.formatMessage(
            {
              id: 'pages.devices.batchDisableSuccess',
              defaultMessage: 'Successfully disabled {count} device(s)',
            },
            { count: result.succeededCount },
          ),
        );
      }
      setSelectedRowKeys([]);
      setSelectedRows([]);
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.devices.batchDisableFailed',
          defaultMessage: 'Failed to disable devices',
        }),
      );
    } finally {
      setBatchStatusUpdating(false);
    }
  };

  const handleBatchRemoveFromGroup = async () => {
    if (!deviceGroupGuid || selectedRows.length === 0) return;
    setBatchRemoving(true);
    try {
      const deviceIds = selectedRows.map((row) => row.id);
      await removeDeviceFromGroup(deviceGroupGuid, deviceIds);
      msgApi.success(
        intl.formatMessage(
          {
            id: 'pages.devices.batchRemoveFromGroupSuccess',
            defaultMessage: 'Successfully removed {count} device(s) from group',
          },
          { count: selectedRows.length },
        ),
      );
      setSelectedRowKeys([]);
      setSelectedRows([]);
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.devices.batchRemoveFromGroupFailed',
          defaultMessage: 'Failed to remove devices from group',
        }),
      );
    } finally {
      setBatchRemoving(false);
    }
  };

  // Use shared columns definition and add action column
  const baseColumns = getDeviceColumns();

  // Filter out device group column if deviceGroupGuid is provided
  const filteredColumns = deviceGroupGuid
    ? baseColumns.filter(
        (col) =>
          col.dataIndex !== 'device_group_name' &&
          col.dataIndex !== 'device_group_name_search',
      )
    : baseColumns;

  const actionColumn = getActionColumn({
    onEdit: (record) => {
      setEditingRecord(record);
      setEditModalVisible(true);
    },
    onEnable: handleEnable,
    onDisable: handleDisable,
    onDelete: handleDelete,
    onRemoveFromGroup: handleRemoveFromGroup,
    deviceGroupGuid,
  });

  const columns = [...filteredColumns, actionColumn];

  return (
    <>
      {title && (
        <Helmet>
          <title>
            {title}
            {Settings.title && ` - ${Settings.title}`}
          </title>
        </Helmet>
      )}
      <PageContainer
        title={
          title || (
            <FormattedMessage
              id="pages.devices.list"
              defaultMessage="Device List"
            />
          )
        }
        onBack={onBack}
      >
        <ProTable<API.DeviceItem>
          headerTitle={
            <FormattedMessage
              id="pages.devices.list"
              defaultMessage="Device List"
            />
          }
          actionRef={actionRef}
          rowKey="guid"
          rowSelection={{
            selectedRowKeys,
            onChange: (keys, rows) => {
              setSelectedRowKeys(keys);
              setSelectedRows(rows);
            },
          }}
          tableAlertOptionRender={() => (
            <Space size={16}>
              {deviceGroupGuid ? (
                <Popconfirm
                  title={
                    <FormattedMessage
                      id="pages.devices.batchRemoveFromGroupConfirm"
                      defaultMessage="Are you sure to remove selected devices from the group?"
                    />
                  }
                  onConfirm={handleBatchRemoveFromGroup}
                  okText={intl.formatMessage({
                    id: 'pages.common.confirm',
                    defaultMessage: 'Yes',
                  })}
                  cancelText={intl.formatMessage({
                    id: 'pages.common.cancel',
                    defaultMessage: 'No',
                  })}
                >
                  <Button
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                    loading={batchRemoving}
                    style={{ padding: 0 }}
                  >
                    <FormattedMessage
                      id="pages.devices.batchRemove"
                      defaultMessage="Batch Remove"
                    />
                  </Button>
                </Popconfirm>
              ) : (
                <>
                  <Popconfirm
                    title={
                      <FormattedMessage
                        id="pages.devices.batchEnableConfirm"
                        defaultMessage="Are you sure to enable selected devices?"
                      />
                    }
                    onConfirm={handleBatchEnable}
                    okText={intl.formatMessage({
                      id: 'pages.common.confirm',
                      defaultMessage: 'Yes',
                    })}
                    cancelText={intl.formatMessage({
                      id: 'pages.common.cancel',
                      defaultMessage: 'No',
                    })}
                  >
                    <Button
                      type="link"
                      icon={<PlusCircleOutlined />}
                      loading={batchStatusUpdating}
                      style={{ padding: 0 }}
                    >
                      <FormattedMessage
                        id="pages.devices.batchEnable"
                        defaultMessage="Batch Enable"
                      />
                    </Button>
                  </Popconfirm>
                  <Popconfirm
                    title={
                      <FormattedMessage
                        id="pages.devices.batchDisableConfirm"
                        defaultMessage="Are you sure to disable selected devices?"
                      />
                    }
                    onConfirm={handleBatchDisable}
                    okText={intl.formatMessage({
                      id: 'pages.common.confirm',
                      defaultMessage: 'Yes',
                    })}
                    cancelText={intl.formatMessage({
                      id: 'pages.common.cancel',
                      defaultMessage: 'No',
                    })}
                  >
                    <Button
                      type="link"
                      icon={<MinusCircleOutlined />}
                      loading={batchStatusUpdating}
                      style={{ padding: 0 }}
                    >
                      <FormattedMessage
                        id="pages.devices.batchDisable"
                        defaultMessage="Batch Disable"
                      />
                    </Button>
                  </Popconfirm>
                </>
              )}
            </Space>
          )}
          request={async (params) => {
            const result = await getDeviceList({
              current: params.current || 1,
              pageSize: params.pageSize || 20,
              id: params.id,
              status: params.status,
              is_online: params.is_online,
              user_name: params.user_name,
              device_group_name: params.device_group_name_search,
              device_group_guid: deviceGroupGuid,
              os: params.os,
            });
            return {
              data: result.data || [],
              total: result.total || 0,
              success: true,
            };
          }}
          columns={columns}
          search={{
            labelWidth: 'auto',
            defaultCollapsed: true,
            optionRender: (_searchConfig, _formProps, dom) => [
              ...dom.reverse(),
            ],
          }}
          pagination={{
            defaultPageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          scroll={{ x: '100%' }}
          toolBarRender={() =>
            deviceGroupGuid
              ? [
                  <Button
                    key="import"
                    icon={<SelectOutlined />}
                    onClick={() => setImportModalVisible(true)}
                  >
                    <FormattedMessage
                      id="pages.deviceGroups.import"
                      defaultMessage="Import"
                    />
                  </Button>,
                ]
              : []
          }
          options={{
            density: true,
            setting: {
              listsHeight: 400,
            },
            fullScreen: false,
            reload: true,
          }}
        />

        {deviceGroupGuid && (
          <ImportDevicesModal
            open={importModalVisible}
            deviceGroupGuid={deviceGroupGuid}
            onCancel={() => setImportModalVisible(false)}
            onSuccess={() => actionRef.current?.reload()}
          />
        )}

        <EditDeviceModal
          open={editModalVisible}
          record={editingRecord}
          onCancel={() => {
            setEditModalVisible(false);
            setEditingRecord(null);
          }}
          onSuccess={() => actionRef.current?.reload()}
        />
      </PageContainer>
    </>
  );
};

export default DeviceList;
