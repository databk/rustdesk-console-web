import type { ProColumns } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Button, Tooltip, Typography } from 'antd';
import { EditTwoTone } from '@ant-design/icons';
import React, { Fragment } from 'react';
import { formatDateTime, renderDuration, renderLocalField } from '../utils';
import { getConnTypeMsgId, renderConnTypeIcon } from '../connType';

const { Text } = Typography;

interface UseConnColumnsOptions {
  canEdit: boolean;
  onViewDetail: (record: API.ConnectionAuditItem) => void;
  onEditNote: (record: API.ConnectionAuditItem) => void;
  onDisconnect: (record: API.ConnectionAuditItem) => void;
}

export const useConnColumns = (
  options: UseConnColumnsOptions,
): ProColumns<API.ConnectionAuditItem>[] => {
  const intl = useIntl();
  const { canEdit, onViewDetail, onEditNote, onDisconnect } = options;

  const connTypeValueEnum: Record<number, { text: string }> = {
    [-1]: {
      text: intl.formatMessage({
        id: 'pages.audits.connType.notLoggedIn',
        defaultMessage: 'Not Logged In',
      }),
    },
    0: {
      text: intl.formatMessage({
        id: 'pages.audits.connType.remoteDesktop',
        defaultMessage: 'Remote Desktop',
      }),
    },
    1: {
      text: intl.formatMessage({
        id: 'pages.audits.connType.fileTransfer',
        defaultMessage: 'File Transfer',
      }),
    },
    2: {
      text: intl.formatMessage({
        id: 'pages.audits.connType.portTransfer',
        defaultMessage: 'Port Transfer',
      }),
    },
    3: {
      text: intl.formatMessage({
        id: 'pages.audits.connType.viewCamera',
        defaultMessage: 'View Camera',
      }),
    },
    4: {
      text: intl.formatMessage({
        id: 'pages.audits.connType.terminal',
        defaultMessage: 'Terminal',
      }),
    },
  };

  return [
    {
      title: <FormattedMessage id="pages.audits.type" defaultMessage="Type" />,
      dataIndex: 'type',
      width: 60,
      valueType: 'select',
      valueEnum: connTypeValueEnum,
      render: (_, record) => {
        const icon = renderConnTypeIcon(record.type);
        const msgId = getConnTypeMsgId(record.type);
        return (
          <Button
            type="link"
            style={{ padding: 0 }}
            onClick={() => onViewDetail(record)}
          >
            <Tooltip title={intl.formatMessage({ id: msgId })}>{icon}</Tooltip>
          </Button>
        );
      },
    },
    {
      title: (
        <FormattedMessage id="pages.audits.remote" defaultMessage="Remote" />
      ),
      dataIndex: 'deviceId',
      tip: intl.formatMessage({
        id: 'pages.audits.remoteSearchTip',
        defaultMessage: 'Search by remote device ID (fuzzy match)',
      }),
      fieldProps: {
        placeholder: intl.formatMessage({
          id: 'pages.audits.remotePlaceholder',
          defaultMessage: 'Enter remote device ID',
        }),
      },
      hideInTable: true,
    },
    {
      title: (
        <FormattedMessage id="pages.audits.remote" defaultMessage="Remote" />
      ),
      dataIndex: 'deviceId',
      tip: intl.formatMessage({
        id: 'pages.audits.remoteTip',
        defaultMessage: 'Remotely controlled computer or terminal',
      }),
      hideInSearch: true,
      render: (_, record) => record.deviceId || '-',
    },
    {
      title: (
        <FormattedMessage id="pages.audits.local" defaultMessage="Local" />
      ),
      dataIndex: 'local',
      search: false,
      width: 200,
      render: (_, record) => renderLocalField(record),
    },
    {
      title: <FormattedMessage id="pages.audits.time" defaultMessage="Time" />,
      dataIndex: 'createdAt',
      valueType: 'dateTimeRange',
      hideInTable: true,
      fieldProps: {
        placeholder: [
          intl.formatMessage({
            id: 'pages.audits.startTime',
            defaultMessage: 'Start Time',
          }),
          intl.formatMessage({
            id: 'pages.audits.endTime',
            defaultMessage: 'End Time',
          }),
        ],
      },
    },
    {
      title: (
        <FormattedMessage
          id="pages.audits.requestedAt"
          defaultMessage="Requested At"
        />
      ),
      dataIndex: 'requestedAt',
      width: 180,
      search: false,
      render: (_, record) => formatDateTime(record.requestedAt),
    },
    {
      title: (
        <FormattedMessage
          id="pages.audits.establishedAt"
          defaultMessage="Established At"
        />
      ),
      dataIndex: 'establishedAt',
      width: 180,
      search: false,
      render: (_, record) => formatDateTime(record.establishedAt),
    },
    {
      title: (
        <FormattedMessage
          id="pages.audits.closedAt"
          defaultMessage="Closed At"
        />
      ),
      dataIndex: 'closedAt',
      width: 180,
      search: false,
      render: (_, record) => formatDateTime(record.closedAt),
    },
    {
      title: (
        <FormattedMessage
          id="pages.audits.duration"
          defaultMessage="Duration"
        />
      ),
      dataIndex: 'duration',
      search: false,
      width: 120,
      render: (_, record) => renderDuration(record),
    },
    {
      title: <FormattedMessage id="pages.audits.note" defaultMessage="Note" />,
      dataIndex: 'note',
      valueType: 'textarea',
      search: false,
      width: 200,
      ellipsis: true,
      render: (_, record) => (
        <Fragment>
          <Text
            ellipsis={{ tooltip: record.note || '' }}
            style={{ maxWidth: 150 }}
          >
            {record.note || ''}
          </Text>
          {canEdit && (
            <Button
              icon={<EditTwoTone />}
              type="text"
              size="small"
              onClick={() => onEditNote(record)}
            />
          )}
        </Fragment>
      ),
    },
    {
      title: (
        <FormattedMessage id="pages.common.action" defaultMessage="Action" />
      ),
      search: false,
      hideInTable: !canEdit,
      width: 120,
      render: (_, record) => {
        if (!canEdit) {
          return <Text type="secondary">-</Text>;
        }
        const isActive = record.action === 'established' && !record.closedAt;
        if (!isActive) return '';
        return (
          <Button size="small" type="default" danger onClick={() => onDisconnect(record)}>
            <FormattedMessage
              id="pages.audits.disconnect"
              defaultMessage="Disconnect"
            />
          </Button>
        );
      },
    },
  ];
};