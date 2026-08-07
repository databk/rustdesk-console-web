import { useIntl } from '@umijs/max';
import { App } from 'antd';
import dayjs from 'dayjs';
import { getConnectionAudits } from '@/services/rustdesk-console/audit';
import { renderDuration, renderLocalField, sanitizeCsvCell } from '../utils';
import { getConnTypeMsgId } from '../connType';
import type { ConnectionAuditSearchParams } from '../types';

interface UseCsvExportOptions {
  pageParams: Partial<ConnectionAuditSearchParams> | undefined;
}

export const useCsvExport = (options: UseCsvExportOptions) => {
  const intl = useIntl();
  const { message: msgApi, modal } = App.useApp();
  const { pageParams } = options;

  const fetchExportData = async (): Promise<API.ConnectionAuditItem[]> => {
    let allItems: API.ConnectionAuditItem[] = [];
    let total = 0;
    const pageSize = 100;
    let current = 0;

    do {
      current++;
      const items = await getConnectionAudits({
        ...pageParams,
        current,
        pageSize,
      }, { skipErrorHandler: true });
      if (total === 0 && items.total != null) {
        total = items.total;
      }
      if (items.data != null) {
        allItems = allItems.concat(items.data);
      }
    } while (current < 10 && pageSize * current < total);

    return allItems;
  };

  const generateCsvContent = (items: API.ConnectionAuditItem[]): string => {
    const titles = [
      intl.formatMessage({ id: 'pages.audits.type', defaultMessage: 'Type' }),
      intl.formatMessage({
        id: 'pages.audits.remote',
        defaultMessage: 'Remote',
      }),
      intl.formatMessage({
        id: 'pages.audits.local',
        defaultMessage: 'Local',
      }),
      intl.formatMessage({
        id: 'pages.audits.requestedAt',
        defaultMessage: 'Requested At',
      }),
      intl.formatMessage({
        id: 'pages.audits.establishedAt',
        defaultMessage: 'Established At',
      }),
      intl.formatMessage({
        id: 'pages.audits.closedAt',
        defaultMessage: 'Closed At',
      }),
      intl.formatMessage({
        id: 'pages.audits.duration',
        defaultMessage: 'Duration',
      }),
      intl.formatMessage({
        id: 'pages.audits.note',
        defaultMessage: 'Note',
      }),
    ];

    const rows: string[][] = [];
    items.forEach((record) => {
      const row: string[] = [];
      row.push(
        intl.formatMessage({
          id: getConnTypeMsgId(record.type),
          defaultMessage: '-',
        }),
      );
      row.push(record.deviceId || '');
      row.push(renderLocalField(record));
      row.push(record.requestedAt || '');
      row.push(record.establishedAt || '');
      row.push(record.closedAt || '');
      row.push(renderDuration(record));
      row.push(record.note || '');
      rows.push(row);
    });

    return [
      titles.map(sanitizeCsvCell).join(','),
      ...rows.map((row) => row.map(sanitizeCsvCell).join(',')),
    ].join('\n');
  };

  const downloadCsv = (csvContent: string) => {
    const blob = new Blob([`\ufeff${csvContent}`], {
      type: 'text/csv;charset=utf-8;',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `connection-audit-${dayjs().format('YYYY-MM-DD-HHmmss')}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportCsv = async () => {
    modal.confirm({
      title: intl.formatMessage({
        id: 'pages.audits.exportConfirmTitle',
        defaultMessage: 'Export CSV',
      }),
      content: intl.formatMessage({
        id: 'pages.audits.exportConfirmContent',
        defaultMessage: 'Export up to 1000 records. Continue?',
      }),
      okText: intl.formatMessage({
        id: 'pages.common.confirm',
        defaultMessage: 'Yes',
      }),
      cancelText: intl.formatMessage({
        id: 'pages.common.cancel',
        defaultMessage: 'No',
      }),
      onOk: async () => {
        try {
          const items = await fetchExportData();
          if (items.length === 0) {
            msgApi.warning(
              intl.formatMessage({
                id: 'pages.audits.noDataToExport',
                defaultMessage: 'No data to export',
              }),
            );
            return;
          }
          const csvContent = generateCsvContent(items);
          downloadCsv(csvContent);
          msgApi.success(
            intl.formatMessage({
              id: 'pages.audits.exportSuccess',
              defaultMessage: 'Export successful',
            }),
          );
        } catch (_error) {
          msgApi.error(
            intl.formatMessage({
              id: 'pages.audits.exportFailed',
              defaultMessage: 'Export failed',
            }),
          );
        }
      },
    });
  };

  return { exportCsv };
};
