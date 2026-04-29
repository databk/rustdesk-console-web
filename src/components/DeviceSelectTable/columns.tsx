import type { ProColumns } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Badge, Tooltip } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import React from 'react';

/**
 * Get device table columns definition
 * This is shared between device list page and device select table component
 * @param options - Configuration options
 * @param options.hideAction - Whether to hide the action column (default: false)
 */
export const getDeviceColumns = (options?: { hideAction?: boolean }): ProColumns<API.DeviceItem>[] => {
  const intl = useIntl();
  const { hideAction = false } = options || {};

  const baseColumns: ProColumns<API.DeviceItem>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: '15%',
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
      width: 120,
      ellipsis: true,
      hideInSearch: true,
      sorter: true,
      render: (_: unknown, record: API.DeviceItem) => record.device_group_name || '-',
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
      width: 80,
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
      title: (
        <span>
          <FormattedMessage id="pages.devices.strategy" defaultMessage="Strategy" />
          <Tooltip title={intl.formatMessage({ id: 'pages.devices.strategyInfo', defaultMessage: 'Connection strategy' })}>
            <InfoCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </span>
      ),
      dataIndex: 'strategy_name',
      width: 100,
      ellipsis: true,
      search: false,
      render: (_: unknown, record: API.DeviceItem) => record.strategy_name || '-',
    },
    {
      title: <FormattedMessage id="pages.devices.info" defaultMessage="Info" />,
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
  ];

  // Action column placeholder - will be added by the consumer if needed
  if (!hideAction) {
    // Return columns with action placeholder (consumer needs to add action column)
    return [...baseColumns];
  }

  return baseColumns;
};
