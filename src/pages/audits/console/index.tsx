import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Button, Drawer, Typography } from 'antd';
import { FormattedMessage, useIntl } from '@umijs/max';
import React, { useRef, useState } from 'react';
import { getConsoleAudits } from '@/services/rustdesk-console/audit';

const ConsoleAudit: React.FC = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>(null);
  const [selected, setSelected] = useState<API.ConsoleAuditItem>();

  const columns: ProColumns<API.ConsoleAuditItem>[] = [
    {
      title: (
        <FormattedMessage
          id="pages.audits.operator"
          defaultMessage="Operator"
        />
      ),
      dataIndex: 'operator',
      hideInTable: true,
    },
    {
      title: <FormattedMessage id="pages.audits.user" defaultMessage="User" />,
      dataIndex: 'actor_user_name',
      width: 150,
      search: false,
      render: (_, record) =>
        record.actor_user_name ||
        record.actor_user_guid ||
        intl.formatMessage({
          id: 'pages.audits.unknownUser',
          defaultMessage: 'Unknown user',
        }),
    },
    {
      title: (
        <FormattedMessage id="pages.audits.action" defaultMessage="Action" />
      ),
      dataIndex: 'action',
      width: 150,
    },
    {
      title: (
        <FormattedMessage
          id="pages.audits.targetType"
          defaultMessage="Target type"
        />
      ),
      dataIndex: 'target_type',
      width: 150,
    },
    {
      title: (
        <FormattedMessage
          id="pages.audits.targetId"
          defaultMessage="Target ID"
        />
      ),
      dataIndex: 'target_guid',
      width: 180,
      ellipsis: true,
    },
    {
      title: (
        <FormattedMessage id="pages.audits.result" defaultMessage="Result" />
      ),
      dataIndex: 'result',
      width: 120,
      valueEnum: {
        allowed: { text: 'Allowed', status: 'Success' },
        denied: { text: 'Denied', status: 'Error' },
      },
    },
    {
      title: (
        <FormattedMessage id="pages.audits.reason" defaultMessage="Reason" />
      ),
      dataIndex: 'reason',
      ellipsis: true,
    },
    {
      title: <FormattedMessage id="pages.audits.time" defaultMessage="Time" />,
      dataIndex: 'created_at',
      valueType: 'dateTime',
      width: 180,
      search: false,
    },
    {
      title: <FormattedMessage id="pages.audits.time" defaultMessage="Time" />,
      dataIndex: 'time_range',
      valueType: 'dateRange',
      hideInTable: true,
    },
    {
      title: (
        <FormattedMessage id="pages.audits.detail" defaultMessage="Detail" />
      ),
      valueType: 'option',
      width: 80,
      render: (_, record) => [
        <Button key="detail" type="link" onClick={() => setSelected(record)}>
          <FormattedMessage id="pages.audits.detail" defaultMessage="Detail" />
        </Button>,
      ],
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.ConsoleAuditItem>
        headerTitle={
          <FormattedMessage
            id="pages.audits.console"
            defaultMessage="Console Audits"
          />
        }
        columnsState={{
          persistenceType: 'localStorage',
          persistenceKey: 'console_audit_columns_state',
        }}
        actionRef={actionRef}
        rowKey="guid"
        dateFormatter={false}
        request={async (params) => {
          const timeRange = (
            params as typeof params & {
              time_range?: { toISOString(): string }[];
            }
          ).time_range;
          const result = await getConsoleAudits({
            current: params.current || 1,
            pageSize: params.pageSize || 20,
            operator: params.operator,
            action: params.action,
            target_type: params.target_type,
            result: params.result,
            start_time: timeRange?.[0]?.toISOString(),
            end_time: timeRange?.[1]?.toISOString(),
          });
          return {
            data: result.data || [],
            total: result.total || 0,
            success: true,
          };
        }}
        columns={columns}
        search={{
          defaultCollapsed: false,
          labelWidth: 'auto',
        }}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        options={{
          density: true,
          setting: {
            listsHeight: 400,
          },
          fullScreen: false,
          reload: true,
        }}
        scroll={{ x: 1200 }}
      />
      <Drawer
        title={
          <FormattedMessage id="pages.audits.detail" defaultMessage="Detail" />
        }
        width={640}
        open={Boolean(selected)}
        onClose={() => setSelected(undefined)}
      >
        {selected && (
          <>
            <Typography.Paragraph>
              <strong>Action:</strong> {selected.action || '-'}
            </Typography.Paragraph>
            <Typography.Paragraph>
              <strong>Target:</strong> {selected.target_type || '-'} /{' '}
              {selected.target_guid || '-'}
            </Typography.Paragraph>
            <Typography.Paragraph>
              <strong>Before state</strong>
              <pre>{JSON.stringify(selected.before_state, null, 2) || '-'}</pre>
            </Typography.Paragraph>
            <Typography.Paragraph>
              <strong>After state</strong>
              <pre>{JSON.stringify(selected.after_state, null, 2) || '-'}</pre>
            </Typography.Paragraph>
          </>
        )}
      </Drawer>
    </PageContainer>
  );
};

export default ConsoleAudit;
