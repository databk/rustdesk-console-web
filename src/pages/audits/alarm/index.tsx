import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Breadcrumb, Tag } from 'antd';
import dayjs from 'dayjs';
import React, { useRef } from 'react';
import { getAlarmAudits } from '@/services/rustdesk-console/audit';
import { renderNameIp } from '@/utils/audit';

const ALARM_TYPE_MAP: Record<number, { msgId: string; color: string }> = {
  0: { msgId: 'pages.audits.alarmType.ipWhitelist', color: 'red' },
  1: { msgId: 'pages.audits.alarmType.exceedThirtyAttempts', color: 'orange' },
  2: { msgId: 'pages.audits.alarmType.sixAttemptsWithinOneMinute', color: 'orange' },
  6: { msgId: 'pages.audits.alarmType.exceedIpv6PrefixAttempts', color: 'orange' },
  7: { msgId: 'pages.audits.alarmType.terminalOsLoginBackoff', color: 'volcano' },
  8: { msgId: 'pages.audits.alarmType.terminalOsLoginConcurrency', color: 'volcano' },
};

interface AlarmAuditSearchParams extends API.PageParams {
  deviceId?: string;
  type?: number;
  createdAt?: [string, string];
}

const AlarmAudit: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const intl = useIntl();

  const alarmTypeValueEnum: Record<number, { text: string }> = Object.fromEntries(
    Object.entries(ALARM_TYPE_MAP).map(([key, val]) => [
      Number(key),
      { text: intl.formatMessage({ id: val.msgId }) },
    ]),
  );

  const columns: ProColumns<API.AlarmAuditItem>[] = [
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
      render: (_, record) => renderNameIp(record.infoName, record.infoIp),
    },
    {
      title: (
        <FormattedMessage
          id="pages.audits.alarmType"
          defaultMessage="Alarm Type"
        />
      ),
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
