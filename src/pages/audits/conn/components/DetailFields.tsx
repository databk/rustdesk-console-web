import { useIntl } from '@umijs/max';
import { formatDateTime, renderDuration, renderLocalField } from '../utils';
import { getConnTypeMsgId } from '../connType';
import type { DetailField } from '../types';

const PRIMARY_AUTH_MSG_IDS: Record<number, string> = {
  0: 'pages.audits.primaryAuth.none',
  1: 'pages.audits.primaryAuth.click',
  2: 'pages.audits.primaryAuth.temporaryPassword',
  3: 'pages.audits.primaryAuth.permanentPassword',
  4: 'pages.audits.primaryAuth.switchSides',
};

const TWO_FACTOR_MSG_IDS: Record<number, string> = {
  0: 'pages.audits.twoFactor.none',
  1: 'pages.audits.twoFactor.totp',
  2: 'pages.audits.twoFactor.trustedDevice',
};

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
        id: 'pages.audits.primaryAuth',
        defaultMessage: 'Primary Auth',
      }),
      render: (r: API.ConnectionAuditItem) => {
        if (r.primaryAuth === undefined || r.primaryAuth === null) return '-';
        const msgId = PRIMARY_AUTH_MSG_IDS[r.primaryAuth];
        return msgId
          ? intl.formatMessage({ id: msgId })
          : String(r.primaryAuth);
      },
    },
    {
      label: intl.formatMessage({
        id: 'pages.audits.twoFactor',
        defaultMessage: 'Two-Factor Auth',
      }),
      render: (r: API.ConnectionAuditItem) => {
        if (r.twoFactor === undefined || r.twoFactor === null) return '-';
        const msgId = TWO_FACTOR_MSG_IDS[r.twoFactor];
        return msgId ? intl.formatMessage({ id: msgId }) : String(r.twoFactor);
      },
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
