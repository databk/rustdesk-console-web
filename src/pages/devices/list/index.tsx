import {
  DeleteOutlined,
  EditOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
  SelectOutlined,
} from '@ant-design/icons';
import {
  batchUpdateDeviceStatus,
  deleteDevice,
  getDeviceList,
  updateDevice,
} from '@/services/rustdesk-console/device';
import {
  addDeviceToGroup,
  removeDeviceFromGroup,
} from '@/services/rustdesk-console/deviceGroup';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import {
  App,
  Button,
  Divider,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
} from 'antd';
import React, { useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Settings from '../../../../config/defaultSettings';
import { getDeviceColumns } from '@/components/DeviceSelectTable/columns';
import DeviceSelectTable from '@/components/DeviceSelectTable';

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

  const [importDevicesModalVisible, setImportDevicesModalVisible] =
    useState(false);
  const [selectedDeviceKeys, setSelectedDeviceKeys] = useState<React.Key[]>([]);
  const [importing, setImporting] = useState(false);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<API.DeviceItem | null>(
    null,
  );
  const [editForm] = Form.useForm();

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

  const handleEdit = async (values: Record<string, string | null>) => {
    if (!editingRecord) return;
    try {
      const data: API.UpdateDeviceParams = {};
      const original: Record<string, string | undefined> = {
        userName: editingRecord.user_name,
        deviceGroupName: editingRecord.device_group_name,
        strategyName: editingRecord.strategy_name,
        note: editingRecord.note,
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
      await updateDevice(editingRecord.guid, data);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.devices.updateSuccess',
          defaultMessage: 'Device updated',
        }),
      );
      setEditModalVisible(false);
      setEditingRecord(null);
      editForm.resetFields();
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.devices.updateFailed',
          defaultMessage: 'Failed to update device',
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

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<API.DeviceItem[]>([]);
  const [batchRemoving, setBatchRemoving] = useState(false);
  const [batchStatusUpdating, setBatchStatusUpdating] = useState(false);

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

  const handleImportDevices = async () => {
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
      setImportDevicesModalVisible(false);
      setSelectedDeviceKeys([]);
      actionRef.current?.reload();
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

  const actionColumn: ProColumns<API.DeviceItem> = {
    title: (
      <FormattedMessage id="pages.common.action" defaultMessage="Action" />
    ),
    valueType: 'option',
    width: '15%',
    fixed: 'right',
    render: (_: unknown, record: API.DeviceItem) => {
      const isDisabled = record.status === 0;

      // When in device group context, only show remove button
      if (deviceGroupGuid) {
        return (
          <Popconfirm
            key="remove"
            title={
              <FormattedMessage
                id="pages.devices.removeFromGroupConfirm"
                defaultMessage="Are you sure to remove this device from the group?"
              />
            }
            onConfirm={() => handleRemoveFromGroup(record.id)}
            okText={intl.formatMessage({
              id: 'pages.common.confirm',
              defaultMessage: 'Yes',
            })}
            cancelText={intl.formatMessage({
              id: 'pages.common.cancel',
              defaultMessage: 'No',
            })}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              <FormattedMessage
                id="pages.devices.remove"
                defaultMessage="Remove"
              />
            </Button>
          </Popconfirm>
        );
      }

      // Normal device list (not in device group context)
      return (
        <Space size={0} split={<Divider type="vertical" />}>
          <Button
            key="edit"
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingRecord(record);
              editForm.setFieldsValue({
                userName: record.user_name || '',
                deviceGroupName: record.device_group_name || '',
                strategyName: record.strategy_name || '',
                note: record.note || '',
              });
              setEditModalVisible(true);
            }}
          >
            <FormattedMessage id="pages.common.edit" defaultMessage="Edit" />
          </Button>
          {isDisabled ? (
            <Button
              key="enable"
              type="link"
              size="small"
              icon={<PlusCircleOutlined />}
              onClick={() => handleEnable(record.guid)}
            >
              <FormattedMessage
                id="pages.devices.enable"
                defaultMessage="Enable"
              />
            </Button>
          ) : (
            <Button
              key="disable"
              type="link"
              size="small"
              icon={<MinusCircleOutlined />}
              onClick={() => handleDisable(record.guid)}
            >
              <FormattedMessage
                id="pages.devices.disable"
                defaultMessage="Disable"
              />
            </Button>
          )}
          {isDisabled && (
            <Popconfirm
              key="delete"
              title={
                <FormattedMessage
                  id="pages.devices.deleteConfirm"
                  defaultMessage="Are you sure to delete this device?"
                />
              }
              onConfirm={() => handleDelete(record.guid)}
              okText={intl.formatMessage({
                id: 'pages.common.confirm',
                defaultMessage: 'Yes',
              })}
              cancelText={intl.formatMessage({
                id: 'pages.common.cancel',
                defaultMessage: 'No',
              })}
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                <FormattedMessage
                  id="pages.common.delete"
                  defaultMessage="Delete"
                />
              </Button>
            </Popconfirm>
          )}
        </Space>
      );
    },
  };
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
                    onClick={() => setImportDevicesModalVisible(true)}
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
          <Modal
            title={
              <FormattedMessage
                id="pages.deviceGroups.importDevices"
                defaultMessage="Import Devices"
              />
            }
            open={importDevicesModalVisible}
            onCancel={() => {
              setImportDevicesModalVisible(false);
              setSelectedDeviceKeys([]);
            }}
            onOk={handleImportDevices}
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
        )}

        <Modal
          title={
            <FormattedMessage
              id="pages.devices.edit"
              defaultMessage="Edit Device"
            />
          }
          open={editModalVisible}
          onCancel={() => {
            setEditModalVisible(false);
            setEditingRecord(null);
            editForm.resetFields();
          }}
          onOk={() => editForm.submit()}
        >
          <Form form={editForm} onFinish={handleEdit} layout="vertical">
            <Form.Item
              name="userName"
              label={
                <FormattedMessage
                  id="pages.devices.user"
                  defaultMessage="User"
                />
              }
            >
              <Input
                placeholder={intl.formatMessage({
                  id: 'pages.devices.enterUserName',
                  defaultMessage: 'Enter username to associate',
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
              <Input
                placeholder={intl.formatMessage({
                  id: 'pages.devices.enterDeviceGroupName',
                  defaultMessage: 'Enter device group name to associate',
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
              <Input
                placeholder={intl.formatMessage({
                  id: 'pages.devices.enterStrategyName',
                  defaultMessage: 'Enter strategy name to associate',
                })}
              />
            </Form.Item>
            <Form.Item
              name="note"
              label={
                <FormattedMessage
                  id="pages.devices.note"
                  defaultMessage="Note"
                />
              }
            >
              <Input.TextArea />
            </Form.Item>
          </Form>
        </Modal>
      </PageContainer>
    </>
  );
};

export default DeviceList;
