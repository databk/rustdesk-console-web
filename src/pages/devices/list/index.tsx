import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
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
import { useIntl } from '@umijs/max';
import { App, Badge, Button, Popconfirm, Space, Tooltip } from 'antd';
import React, { useRef, useState } from 'react';

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

  const columns: ProColumns<API.DeviceItem>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: '15%',
      ellipsis: true,
      sorter: true,
      render: (_: unknown, record: API.DeviceItem) => (
        <span>
          <Badge
            status={record.is_online ? 'success' : 'error'}
          />
          &nbsp;&nbsp;
          <a>{record.id}</a>
        </span>
      ),
    },
    {
      title: (
        <span>
          <FormattedMessage id="pages.devices.device" defaultMessage="Device" />
          <Tooltip
            title={intl.formatMessage({
              id: 'pages.devices.deviceInfo',
              defaultMessage: 'username@device_name',
            })}
          >
            <InfoCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </span>
      ),
      dataIndex: 'device_name',
      width: 150,
      ellipsis: true,
      search: false,
      sorter: true,
      render: (_: unknown, record: API.DeviceItem) => {
        const username = record.info?.username;
        const hostname = record.info?.device_name;
        if (username && hostname) {
          return `${username}@${hostname}`;
        }
        return hostname || username || '-';
      },
    },
    {
      title: (
        <FormattedMessage
          id="pages.devices.deviceGroup"
          defaultMessage="Group"
        />
      ),
      dataIndex: 'device_group_name',
      width: 120,
      ellipsis: true,
      hideInSearch: true,
      sorter: true,
      render: (_: unknown, record: API.DeviceItem) =>
        record.device_group_name || '-',
    },
    {
      title: <FormattedMessage id="pages.devices.user" defaultMessage="User" />,
      dataIndex: 'user_name',
      width: 120,
      ellipsis: true,
      sorter: true,
      render: (_: unknown, record: API.DeviceItem) => record.user_name || '-',
    },
    {
      title: (
        <FormattedMessage id="pages.devices.status" defaultMessage="Status" />
      ),
      dataIndex: 'status',
      width: 80,
      valueType: 'select',
      valueEnum: {
        '1': {
          text: intl.formatMessage({
            id: 'pages.devices.statusNormal',
            defaultMessage: 'Normal',
          }),
        },
        '0': {
          text: intl.formatMessage({
            id: 'pages.devices.statusDisabled',
            defaultMessage: 'Disabled',
          }),
        },
      },
      hideInTable: true,
    },
    {
      title: (
        <FormattedMessage
          id="pages.devices.onlineStatus"
          defaultMessage="Online Status"
        />
      ),
      dataIndex: 'is_online',
      width: 80,
      valueType: 'select',
      valueEnum: {
        '1': {
          text: intl.formatMessage({
            id: 'pages.devices.online',
            defaultMessage: 'Online',
          }),
        },
        '0': {
          text: intl.formatMessage({
            id: 'pages.devices.offline',
            defaultMessage: 'Offline',
          }),
        },
      },
      hideInTable: true,
    },
    {
      title: (
        <FormattedMessage id="pages.devices.os" defaultMessage="OS" />
      ),
      dataIndex: 'os',
      hideInTable: true,
    },
    {
      title: (
        <FormattedMessage
          id="pages.devices.deviceGroup"
          defaultMessage="Group"
        />
      ),
      dataIndex: 'device_group_name_search',
      hideInTable: true,
      tooltip: intl.formatMessage({
        id: 'pages.devices.deviceGroupSearchTip',
        defaultMessage: 'Filter by device group name',
      }),
    },
    {
      title: (
        <FormattedMessage id="pages.devices.status" defaultMessage="Status" />
      ),
      dataIndex: 'status_display',
      width: 80,
      search: false,
      sorter: true,
      render: (_: unknown, record: API.DeviceItem) => {
        const isNormal = record.status === 1;
        return isNormal ? (
          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />
        ) : (
          <CloseCircleOutlined style={{ color: '#f5222d', fontSize: 16 }} />
        );
      },
    },
    {
      title: (
        <span>
          <FormattedMessage
            id="pages.devices.strategy"
            defaultMessage="Strategy"
          />
          <Tooltip
            title={intl.formatMessage({
              id: 'pages.devices.strategyInfo',
              defaultMessage: 'Connection strategy',
            })}
          >
            <InfoCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </span>
      ),
      dataIndex: 'strategy_name',
      width: 100,
      ellipsis: true,
      search: false,
      render: (_: unknown, record: API.DeviceItem) =>
        record.strategy_name || '-',
    },
    {
      title: (
        <FormattedMessage id="pages.devices.info" defaultMessage="Info" />
      ),
      dataIndex: 'info',
      width: 200,
      ellipsis: true,
      search: false,
      render: (_: unknown, record: API.DeviceItem) => {
        if (!record.info) return '-';
        return `${record.info.os || ''} ${record.info.ip || ''}`.trim() || '-';
      },
    },
    {
      title: <FormattedMessage id="pages.devices.note" defaultMessage="Note" />,
      dataIndex: 'note',
      width: 150,
      ellipsis: true,
      search: false,
      sorter: true,
      render: (_: unknown, record: API.DeviceItem) => record.note || '-',
    },
    {
      title: (
        <FormattedMessage id="pages.common.action" defaultMessage="Action" />
      ),
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
              >
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                >
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
    },
  ];

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

function FormattedMessage(props: {
  id: string;
  defaultMessage: string;
}): React.JSX.Element {
  const intl = useIntl();
  return <>{intl.formatMessage(props)}</>;
}
