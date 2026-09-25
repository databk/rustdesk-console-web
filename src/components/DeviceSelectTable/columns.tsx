import type { ProColumns } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Badge, Button, Dropdown, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import {
  ApiOutlined,
  CameraOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CodeOutlined,
  DesktopOutlined,
  FolderOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
  SafetyCertificateOutlined,
  WindowsFilled,
  AndroidFilled,
  AppleFilled,
  QqCircleFilled,
} from '@ant-design/icons';
import React from 'react';

const buildConnectUrl = (command: string, id: string): string => {
  return `rustdesk://${command}/${id}`;
};

const openCustomProtocol = (url: string): void => {
  const link = window.document.createElement('a');
  link.href = url;
  link.style.display = 'none';
  window.document.body.appendChild(link);
  link.click();
  window.document.body.removeChild(link);
};

/**
 * Get offline duration text
 */
const getOfflineDuration = (lastOnlineTime: string, intl: any): string => {
  try {
    const lastOnline = new Date(
      lastOnlineTime + (lastOnlineTime.endsWith('Z') ? '' : 'Z'),
    );
    const now = new Date();
    const diffMs = now.getTime() - lastOnline.getTime();

    if (diffMs > 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays > 0) {
        return ` (${diffDays} ${intl.formatMessage({ id: 'pages.devices.days', defaultMessage: 'days' })})`;
      } else if (diffHours > 0) {
        return ` (${diffHours} ${intl.formatMessage({ id: 'pages.devices.hours', defaultMessage: 'hours' })})`;
      } else if (diffMinutes > 0) {
        return ` (${diffMinutes} ${intl.formatMessage({ id: 'pages.devices.minutes', defaultMessage: 'minutes' })})`;
      } else {
        return ` (${intl.formatMessage({ id: 'pages.devices.justNow', defaultMessage: 'just now' })})`;
      }
    } else {
      return '';
    }
  } catch {
    return '';
  }
};

/**
 * Get OS icon component
 */
const getOSIcon = (os: string): React.ReactNode => {
  const osLower = (os || '').toLowerCase();

  if (osLower.includes('windows')) {
    return <WindowsFilled />;
  }
  if (osLower.includes('android')) {
    return <AndroidFilled />;
  }
  if (
    osLower.includes('macos') ||
    osLower.includes('ios') ||
    osLower.includes('mac')
  ) {
    return <AppleFilled />;
  }
  if (osLower.includes('linux')) {
    return <QqCircleFilled />;
  }

  return null;
};

/**
 * Get device table columns definition
 * This is shared between device list page and device select table component
 * @param options - Configuration options
 * @param options.hideAction - Whether to hide the action column (default: false)
 */
export const getDeviceColumns = (options?: {
  hideAction?: boolean;
}): ProColumns<API.DeviceItem>[] => {
  const intl = useIntl();
  const { hideAction = false } = options || {};

  const connectMenuItems: MenuProps['items'] = [
    {
      key: 'connect',
      icon: <DesktopOutlined />,
      label: (
        <FormattedMessage
          id="pages.devices.connectRemoteDesktop"
          defaultMessage="Remote Desktop"
        />
      ),
    },
    {
      key: 'file-transfer',
      icon: <FolderOutlined />,
      label: (
        <FormattedMessage
          id="pages.devices.connectFileTransfer"
          defaultMessage="File Transfer"
        />
      ),
    },
    {
      key: 'view-camera',
      icon: <CameraOutlined />,
      label: (
        <FormattedMessage
          id="pages.devices.connectViewCamera"
          defaultMessage="View Camera"
        />
      ),
    },
    {
      key: 'terminal',
      icon: <CodeOutlined />,
      label: (
        <FormattedMessage
          id="pages.devices.connectTerminal"
          defaultMessage="Terminal"
        />
      ),
    },
    {
      key: 'terminal-admin',
      icon: <SafetyCertificateOutlined />,
      label: (
        <FormattedMessage
          id="pages.devices.connectTerminalAdmin"
          defaultMessage="Terminal (Admin)"
        />
      ),
    },
    {
      key: 'port-forward',
      icon: <ApiOutlined />,
      label: (
        <FormattedMessage
          id="pages.devices.connectPortForward"
          defaultMessage="Port Forward"
        />
      ),
    },
    {
      key: 'rdp',
      icon: <GlobalOutlined />,
      label: (
        <FormattedMessage id="pages.devices.connectRdp" defaultMessage="RDP" />
      ),
    },
  ];

  const baseColumns: ProColumns<API.DeviceItem>[] = [
    {
      title: <FormattedMessage id="pages.common.id" defaultMessage="ID" />,
      dataIndex: 'id',
      width: '11%',
      ellipsis: true,
      sorter: true,
      render: (_: unknown, record: API.DeviceItem) => {
        const osParts = (record.info?.os || '').split(' / ');
        const osIcon = getOSIcon(record.info?.os || '');

        // Build online status tooltip
        let onlineTooltip: string;
        if (record.is_online) {
          onlineTooltip = intl.formatMessage({
            id: 'pages.devices.online',
            defaultMessage: 'Online',
          });
        } else {
          const offlineDuration = record.last_online
            ? getOfflineDuration(record.last_online, intl)
            : '';
          onlineTooltip = `${intl.formatMessage({ id: 'pages.devices.offline', defaultMessage: 'Offline' })}${offlineDuration}`;
        }

        // Build OS tooltip - show full OS info in one line
        const osTooltip = osParts[1] || osParts[0] || '';

        return (
          <span>
            <Tooltip title={onlineTooltip}>
              <span>
                <Badge status={record.is_online ? 'success' : 'error'} />
              </span>
            </Tooltip>
            &nbsp;&nbsp;
            {osIcon && osTooltip && (
              <Tooltip
                title={osTooltip}
                styles={{
                  root: {
                    maxWidth: 'none',
                    whiteSpace: 'nowrap',
                  },
                }}
              >
                <span>{osIcon}</span>
              </Tooltip>
            )}
            {osIcon && <>&nbsp;&nbsp;</>}
            <Dropdown
              menu={{
                items: connectMenuItems,
                onClick: ({ key }) => {
                  openCustomProtocol(buildConnectUrl(key, record.id));
                },
              }}
              trigger={['click']}
            >
              <Button
                type="link"
                style={{ padding: 0, height: 'auto', lineHeight: 'inherit' }}
                title={intl.formatMessage({
                  id: 'pages.devices.connect',
                  defaultMessage: 'Connect',
                })}
              >
                {record.id}
              </Button>
            </Dropdown>
          </span>
        );
      },
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
      title: (
        <FormattedMessage
          id="pages.devices.deviceGroup"
          defaultMessage="Group"
        />
      ),
      dataIndex: 'device_group_name',
      ellipsis: true,
      search: false,
      sorter: true,
      render: (_: unknown, record: API.DeviceItem) =>
        record.device_group_name || '-',
    },
    {
      title: <FormattedMessage id="pages.devices.user" defaultMessage="User" />,
      dataIndex: 'user_name',
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
      title: <FormattedMessage id="pages.devices.os" defaultMessage="OS" />,
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
      width: 71,
      search: false,
      sorter: true,
      render: (_: unknown, record: API.DeviceItem) => {
        if (record.status === undefined) return '-';
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
      ellipsis: true,
      search: false,
      render: (_: unknown, record: API.DeviceItem) =>
        record.strategy_name || '-',
    },
    {
      title: <FormattedMessage id="pages.devices.info" defaultMessage="Info" />,
      dataIndex: 'info',
      ellipsis: true,
      search: false,
      render: (_: unknown, record: API.DeviceItem) => {
        if (!record.info) return '-';
        const parts = [
          record.info.cpu,
          record.info.memory,
          record.info.version,
        ].filter(Boolean);
        return parts.join(' | ') || '-';
      },
    },
    {
      title: <FormattedMessage id="pages.devices.note" defaultMessage="Note" />,
      dataIndex: 'note',
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
