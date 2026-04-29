import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { App, Badge, Tooltip } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import React, { useRef } from 'react';
import { getDeviceList } from '@/services/rustdesk-console/device';

interface DeviceSelectTableProps {
  selectedRowKeys?: React.Key[];
  onSelectionChange?: (selectedRowKeys: React.Key[]) => void;
  pageSize?: number;
}

const DeviceSelectTable: React.FC<DeviceSelectTableProps> = ({
  selectedRowKeys = [],
  onSelectionChange,
  pageSize = 10,
}) => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>();

  const columns: ProColumns<API.DeviceItem>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 150,
      ellipsis: true,
      sorter: true,
      render: (_: unknown, record: API.DeviceItem) => (
        <span>
          <Badge status={record.is_online ? 'success' : 'error'} />
          &nbsp;&nbsp;
          <a>{record.id}</a>
        </span>
      ),
    },
    {
      title: (
        <span>
          <FormattedMessage id="pages.devices.device" defaultMessage="Device" />
          <Tooltip title={intl.formatMessage({ id: 'pages.devices.deviceInfo', defaultMessage: 'username@device_name' })}>
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
        if (username && hostname) return `${username}@${hostname}`;
        return hostname || username || '-';
      },
    },
    {
      title: <FormattedMessage id="pages.devices.deviceGroup" defaultMessage="Group" />,
      dataIndex: 'device_group_name',
      width: 100,
      ellipsis: true,
      hideInSearch: true,
      sorter: true,
      render: (_: unknown, record: API.DeviceItem) => record.device_group_name || '-',
    },
    {
      title: <FormattedMessage id="pages.devices.user" defaultMessage="User" />,
      dataIndex: 'user_name',
      width: 100,
      ellipsis: true,
      sorter: true,
    },
    {
      title: <FormattedMessage id="pages.devices.status" defaultMessage="Status" />,
      dataIndex: 'status',
      width: 80,
      valueType: 'select',
      valueEnum: {
        '1': { text: intl.formatMessage({ id: 'pages.devices.statusNormal', defaultMessage: 'Normal' }) },
        '0': { text: intl.formatMessage({ id: 'pages.devices.statusDisabled', defaultMessage: 'Disabled' }) },
      },
      hideInTable: true,
    },
    {
      title: <FormattedMessage id="pages.devices.onlineStatus" defaultMessage="Online Status" />,
      dataIndex: 'is_online',
      width: 80,
      valueType: 'select',
      valueEnum: {
        '1': { text: intl.formatMessage({ id: 'pages.devices.online', defaultMessage: 'Online' }) },
        '0': { text: intl.formatMessage({ id: 'pages.devices.offline', defaultMessage: 'Offline' }) },
      },
      hideInTable: true,
    },
    {
      title: <FormattedMessage id="pages.devices.os" defaultMessage="OS" />,
      dataIndex: 'os',
      hideInTable: true,
    },
    {
      title: <FormattedMessage id="pages.devices.deviceGroup" defaultMessage="Group" />,
      dataIndex: 'device_group_name_search',
      hideInTable: true,
      tooltip: intl.formatMessage({ id: 'pages.devices.deviceGroupSearchTip', defaultMessage: 'Filter by device group name' }),
    },
    {
      title: <FormattedMessage id="pages.devices.status" defaultMessage="Status" />,
      dataIndex: 'status_display',
      width: 60,
      search: false,
      sorter: true,
      render: (_: unknown, record: API.DeviceItem) => {
        const isNormal = record.status === 1;
        return isNormal
          ? <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />
          : <CloseCircleOutlined style={{ color: '#f5222d', fontSize: 16 }} />;
      },
    },
    {
      title: <FormattedMessage id="pages.devices.info" defaultMessage="Info" />,
      dataIndex: 'info',
      width: 150,
      ellipsis: true,
      search: false,
      render: (_: unknown, record: API.DeviceItem) => {
        if (!record.info) return '-';
        return `${record.info.os || ''} ${record.info.ip || ''}`.trim() || '-';
      },
    },
  ];

  return (
    <ProTable<API.DeviceItem>
      actionRef={actionRef}
      rowKey="id"
      search={{
        labelWidth: 'auto',
        defaultCollapsed: true,
      }}
      pagination={{
        defaultPageSize: pageSize,
        showSizeChanger: true,
      }}
      request={async (params) => {
        const result = await getDeviceList({
          current: params.current || 1,
          pageSize: params.pageSize || pageSize,
          id: params.id,
          status: params.status,
          is_online: params.is_online,
          user_name: params.user_name,
          device_group_name: params.device_group_name_search,
          os: params.os,
        });
        return {
          data: result.data || [],
          total: result.total || 0,
          success: true,
        };
      }}
      columns={columns}
      rowSelection={{
        selectedRowKeys,
        onChange: onSelectionChange,
      }}
      options={false}
    />
  );
};

export default DeviceSelectTable;
