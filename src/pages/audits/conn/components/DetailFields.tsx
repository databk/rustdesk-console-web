import { useIntl } from '@umijs/max';
import { formatDateTime, renderDuration, renderLocalField } from '../utils';
import { getConnTypeMsgId } from '../connType';
import type { DetailField } from '../types';

export const useDetailFields = (): DetailField[] => {
  const intl = useIntl();

  return [
    {
      label: intl.formatMessage({
        id: 'pages.audits.type',
        defaultMessage: 'Type',
      }),
      render: (r: API.ConnectionAuditItem) =>
        intl.formatMessage({ id: getConnTypeMsgId(r.type) }),
    },
    {
      label: intl.formatMessage({
        id: 'pages.audits.remote',
        defaultMessage: 'Remote',
      }),
      dataIndex: 'deviceId',
    },
    {
      label: intl.formatMessage({
        id: 'pages.audits.local',
        defaultMessage: 'Local',
      }),
      render: renderLocalField,
    },
    {
      label: intl.formatMessage({
        id: 'pages.audits.requestedAt',
        defaultMessage: 'Requested At',
      }),
      render: (r: API.ConnectionAuditItem) => formatDateTime(r.requestedAt),
    },
    {
      label: intl.formatMessage({
        id: 'pages.audits.establishedAt',
        defaultMessage: 'Established At',
      }),
      render: (r: API.ConnectionAuditItem) => formatDateTime(r.establishedAt),
    },
    {
      label: intl.formatMessage({
        id: 'pages.audits.closedAt',
        defaultMessage: 'Closed At',
      }),
      render: (r: API.ConnectionAuditItem) => formatDateTime(r.closedAt),
    },
    {
      label: intl.formatMessage({
        id: 'pages.audits.duration',
        defaultMessage: 'Duration',
      }),
      render: renderDuration,
    },
    {
      label: intl.formatMessage({
        id: 'pages.audits.note',
        defaultMessage: 'Note',
      }),
      dataIndex: 'note',
    },
  ];
};