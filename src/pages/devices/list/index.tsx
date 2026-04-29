import {
  DeleteOutlined,
  EditOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';
import {
  deleteDevice,
  disableDevice,
  enableDevice,
  getDeviceList,
} from '@/services/rustdesk-console/device';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { App, Button, Popconfirm, Space } from 'antd';
import React, { useRef, useState } from 'react';
import { getDeviceColumns } from '@/components/DeviceSelectTable/columns';

const DeviceList: React.FC = () => {
  const intl = useIntl();
  const { message: msgApi } = App.useApp();
  const actionRef = useRef<ActionType>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [totalDevices, setTotalDevices] = useState<number>(0);

  const handleEnable = async (guid: string) => {
    try {
      await enableDevice(guid);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.devices.enableSuccess',
          defaultMessage: 'Device enabled',
        }),
      );
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
      await disableDevice(guid);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.devices.disableSuccess',
          defaultMessage: 'Device disabled',
        }),
      );
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

  // Use shared columns definition and add action column
  const baseColumns = getDeviceColumns();
  const actionColumn: ProColumns<API.DeviceItem> = {
    title: <FormattedMessage id="pages.common.action" defaultMessage="Action" />,
    valueType: 'option',
    width: '15%',
    fixed: 'right',
    render: (_: unknown, record: API.DeviceItem) => {
      const isDisabled = record.status === 0;
      return (
        <Space size="small" split={<span style={{ color: '#ccc' }}>|</span>}>
          <Button key="edit" type="link" size="small" icon={<EditOutlined />}>
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
              <FormattedMessage id="pages.devices.enable" defaultMessage="Enable" />
            </Button>
          ) : (
            <Button
              key="disable"
              type="link"
              size="small"
              icon={<MinusCircleOutlined />}
              onClick={() => handleDisable(record.guid)}
            >
              <FormattedMessage id="pages.devices.disable" defaultMessage="Disable" />
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
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                <FormattedMessage id="pages.common.delete" defaultMessage="Delete" />
              </Button>
            </Popconfirm>
          )}
        </Space>
      );
    },
  };
  const columns = [...baseColumns, actionColumn];

  return (
    <PageContainer>
      <ProTable<API.DeviceItem>
        headerTitle={
          <span>
            <FormattedMessage
              id="pages.devices.list"
              defaultMessage="Device List"
            />{' '}
            ({totalDevices}/-)
          </span>
        }
        actionRef={actionRef}
        rowKey="guid"
        request={async (params) => {
          const result = await getDeviceList({
            current: params.current || 1,
            pageSize: params.pageSize || 20,
            id: params.id,
            status: params.status,
            is_online: params.is_online,
            user_name: params.user_name,
            device_group_name: params.device_group_name_search,
            os: params.os,
          });
          setTotalDevices(result.total || 0);
          return {
            data: result.data || [],
            total: result.total || 0,
            success: true,
          };
        }}
        columns={columns}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        search={{
          labelWidth: 'auto',
          defaultCollapsed: true,
          optionRender: (_searchConfig, _formProps, dom) => [...dom.reverse()],
        }}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        scroll={{ x: 1400 }}
        toolBarRender={false}
        options={{
          density: true,
          setting: {
            listsHeight: 400,
          },
          fullScreen: false,
          reload: true,
        }}
      />
    </PageContainer>
  );
};

export default DeviceList;
