import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { App, Breadcrumb, Button, Modal, Tag, Tooltip } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import React, { useRef, useState } from 'react';
import { getAlarmAudits } from '@/services/rustdesk-console/audit';
import { renderNameIp } from '@/utils/audit';

const ALARM_TYPE_MAP: Record<number, { msgId: string; color: string }> = {
  0: { msgId: 'pages.audits.alarmType.ipWhitelist', color: 'red' },
  1: { msgId: 'pages.audits.alarmType.exceedThirtyAttempts', color: 'orange' },
  2: {
    msgId: 'pages.audits.alarmType.sixAttemptsWithinOneMinute',
    color: 'orange',
  },
  6: {
    msgId: 'pages.audits.alarmType.exceedIpv6PrefixAttempts',
    color: 'orange',
  },
  7: {
    msgId: 'pages.audits.alarmType.terminalOsLoginBackoff',
    color: 'volcano',
  },
  8: {
    msgId: 'pages.audits.alarmType.terminalOsLoginConcurrency',
    color: 'volcano',
  },
};

const getAlarmTypeMsgId = (typ?: number): string => {
  return ALARM_TYPE_MAP[typ ?? -1]?.msgId ?? 'pages.audits.alarmType';
};

const sanitizeCsvCell = (cell: string): string => {
  let safe = cell.replace(/"/g, '""');
  if (/^[=+\-@\t\r]/.test(safe)) {
    safe = `'${safe}`;
  }
  return `"${safe}"`;
};

interface AlarmAuditSearchParams extends API.PageParams {
  deviceId?: string;
  type?: number;
  createdAt?: [string, string];
}

const AlarmAudit: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const intl = useIntl();
  const { message: msgApi, modal } = App.useApp();
  const [pageParams, setPageParams] =
    useState<Partial<AlarmAuditSearchParams>>();

  const alarmTypeValueEnum: Record<number, { text: string }> =
    Object.fromEntries(
      Object.entries(ALARM_TYPE_MAP).map(([key, val]) => [
        Number(key),
        { text: intl.formatMessage({ id: val.msgId }) },
      ]),
    );

  const fetchExportData = async (): Promise<API.AlarmAuditItem[]> => {
    let allItems: API.AlarmAuditItem[] = [];
    let total = 0;
    const pageSize = 100;
    let current = 0;

    do {
      current++;
      const requestParams: Record<string, any> = {
        ...pageParams,
        current,
        pageSize,
      };
      const items = await getAlarmAudits(requestParams);
      if (total === 0 && items.total != null) {
        total = items.total;
      }
      if (items.data != null) {
        allItems = allItems.concat(items.data);
      }
    } while (current < 10 && pageSize * current < total);

    return allItems;
  };

  const generateCsvContent = (items: API.AlarmAuditItem[]): string => {
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
        id: 'pages.audits.time',
        defaultMessage: 'Time',
      }),
    ];

    const rows: string[][] = [];
    items.forEach((record) => {
      const row: string[] = [];
      row.push(
        intl.formatMessage({
          id: getAlarmTypeMsgId(record.typ),
          defaultMessage: '-',
        }),
      );
      row.push(record.deviceId || '');
      row.push(renderNameIp(record.infoName, record.infoIp));
      row.push(record.createdAt || '');
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
    link.download = `alarm-audit-${dayjs().format('YYYY-MM-DD-HHmmss')}.csv`;
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

  const columns: ProColumns<API.AlarmAuditItem>[] = [
    {
      title: <FormattedMessage id="pages.audits.type" defaultMessage="Type" />,
      dataIndex: 'type',
      valueType: 'select',
      width: 200,
      valueEnum: alarmTypeValueEnum,
      render: (_, record) => {
        const config = ALARM_TYPE_MAP[record.typ ?? -1];
        if (!config) return <Tag>{record.typ}</Tag>;
        return (
          <Tag color={config.color}>
            {intl.formatMessage({ id: config.msgId })}
          </Tag>
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
      render: (_, record) => renderNameIp(record.infoName, record.infoIp),
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
      title: <FormattedMessage id="pages.audits.time" defaultMessage="Time" />,
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      width: 180,
      hideInSearch: true,
    },
  ];

  return (
    <PageContainer
      breadcrumbRender={() => (
        <Breadcrumb
          items={[
            {
              title: (
                <FormattedMessage
                  id="menu.list.audit-list"
                  defaultMessage="Audit List"
                />
              ),
            },
            {
              title: (
                <FormattedMessage
                  id="menu.list.audit-list.Alarm"
                  defaultMessage="Alarm"
                />
              ),
            },
          ]}
        />
      )}
    >
      <ProTable<API.AlarmAuditItem, AlarmAuditSearchParams>
        headerTitle={
          <FormattedMessage
            id="pages.audits.alarm"
            defaultMessage="Alarm Audits"
          />
        }
        columnsState={{
          persistenceType: 'localStorage',
          persistenceKey: 'alarm_audit_columns_state',
        }}
        actionRef={actionRef}
        rowKey="id"
        search={{ labelWidth: 120 }}
        request={async (params) => {
          const requestParams: Record<string, any> = {
            current: params.current,
            pageSize: params.pageSize,
          };
          if (params.deviceId) {
            requestParams.deviceId = params.deviceId;
          }
          if (params.type !== undefined && params.type !== null) {
            requestParams.type = params.type;
          }
          if (
            params.createdAt &&
            Array.isArray(params.createdAt) &&
            params.createdAt.length === 2
          ) {
            requestParams.startTime = dayjs(params.createdAt[0]).toISOString();
            requestParams.endTime = dayjs(params.createdAt[1]).toISOString();
          }
          const result = await getAlarmAudits(requestParams);
          return {
            data: result.data || [],
            total: result.total || 0,
            success: true,
          };
        }}
        columns={columns}
        beforeSearchSubmit={(params) => {
          setPageParams(params as Partial<AlarmAuditSearchParams>);
          return params;
        }}
        toolBarRender={() => [
          <Tooltip
            key="export"
            title={intl.formatMessage({
              id: 'pages.audits.exportCsvTip',
              defaultMessage: 'Export up to 1000 records at a time',
            })}
          >
            <Button
              type="default"
              icon={<DownloadOutlined />}
              onClick={exportCsv}
            >
              <FormattedMessage
                id="pages.audits.exportCSV"
                defaultMessage="Export CSV"
              />
            </Button>
          </Tooltip>,
        ]}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        scroll={{ x: 1000 }}
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

export default AlarmAudit;
