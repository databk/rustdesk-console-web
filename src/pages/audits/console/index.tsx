import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useAccess, useIntl } from '@umijs/max';
import { Button, Drawer, message, Typography } from 'antd';
import React, { useRef, useState } from 'react';
import { getConsoleAudits } from '@/services/rustdesk-console/audit';
import {
  endWebClientSession,
  webClientHttpStatus,
} from '@/services/rustdesk-console/webClient';
import { DEFAULT_PAGINATION, toTableResult } from '@/utils/pagination';
import { webClientAuditContext, webClientAuditLabel } from './web-client-audit';

const ConsoleAudit: React.FC = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>(null);
  const [selected, setSelected] = useState<API.ConsoleAuditItem>();
  const access = useAccess();
  const [ending, setEnding] = useState(false);
  const finishSession = async (record: API.ConsoleAuditItem) => {
    if (ending || !record.target_guid) return;
    setEnding(true);
    try {
      await endWebClientSession(record.target_guid);
      message.success(
        intl.formatMessage({
          id: 'pages.audits.webClient.ended',
          defaultMessage: 'The connection has ended.',
        }),
      );
      actionRef.current?.reload();
    } catch (error) {
      if (
        webClientHttpStatus(error) !== 401 &&
        webClientHttpStatus(error) !== 403
      )
        message.error(
          intl.formatMessage({
            id: 'pages.audits.webClient.endFailed',
            defaultMessage: 'Could not end the connection. Try again.',
          }),
        );
    } finally {
      setEnding(false);
    }
  };

  const selectedWebClientContext = selected
    ? webClientAuditContext(selected)
    : undefined;

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
      fieldProps: {
        placeholder: intl.formatMessage({
          id: 'pages.audits.searchOperatorPlaceholder',
          defaultMessage: 'Search by operator',
        }),
      },
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
      render: (_, record) =>
        webClientAuditLabel(record.action, intl.formatMessage),
      fieldProps: {
        placeholder: intl.formatMessage({
          id: 'pages.audits.searchActionPlaceholder',
          defaultMessage: 'Search by action',
        }),
      },
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
      render: (_, record) =>
        record.target_type === 'web_client_session'
          ? intl.formatMessage({
              id: 'pages.audits.webClient.session',
              defaultMessage: 'Web Client session',
            })
          : record.target_type || '-',
      fieldProps: {
        placeholder: intl.formatMessage({
          id: 'pages.audits.searchTargetTypePlaceholder',
          defaultMessage: 'Search by target type',
        }),
      },
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
      search: false,
    },
    {
      title: (
        <FormattedMessage id="pages.audits.result" defaultMessage="Result" />
      ),
      dataIndex: 'result',
      width: 120,
      render: (_, record) =>
        ['web_client.remote_auth_failed', 'web_client.file_failed'].includes(
          record.action || '',
        )
          ? intl.formatMessage({
              id: 'pages.audits.webClient.reportedFailure',
              defaultMessage: 'Failure reported',
            })
          : _,
      valueEnum: {
        allowed: {
          text: intl.formatMessage({
            id: 'pages.audits.result.allowed',
            defaultMessage: 'Allowed',
          }),
          status: 'Success',
        },
        denied: {
          text: intl.formatMessage({
            id: 'pages.audits.result.denied',
            defaultMessage: 'Denied',
          }),
          status: 'Error',
        },
      },
    },
    {
      title: (
        <FormattedMessage id="pages.audits.reason" defaultMessage="Reason" />
      ),
      dataIndex: 'reason',
      ellipsis: true,
      search: false,
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
        <Button key="detail" variant="link" onClick={() => setSelected(record)}>
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
          return toTableResult(result);
        }}
        columns={columns}
        pagination={DEFAULT_PAGINATION}
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
        size={640}
        open={Boolean(selected)}
        onClose={() => setSelected(undefined)}
      >
        {selected && (
          <>
            <Typography.Paragraph>
              <strong>
                {intl.formatMessage({
                  id: 'pages.audits.action',
                  defaultMessage: 'Action',
                })}
                :
              </strong>{' '}
              {webClientAuditLabel(selected.action, intl.formatMessage)}
            </Typography.Paragraph>
            {selectedWebClientContext && (
              <>
                <Typography.Paragraph>
                  {intl.formatMessage({
                    id: 'pages.audits.webClient.device',
                    defaultMessage: 'Remote device',
                  })}
                  : {selectedWebClientContext.targetId || '-'}
                </Typography.Paragraph>
                <Typography.Paragraph>
                  {intl.formatMessage({
                    id: 'pages.audits.webClient.source',
                    defaultMessage: 'Evidence source',
                  })}
                  :{' '}
                  {intl.formatMessage({
                    id: `pages.audits.webClient.source.${selectedWebClientContext.source || 'unknown'}`,
                    defaultMessage: 'Unknown',
                  })}
                </Typography.Paragraph>
                {access.canDevicesDisconnect &&
                  selectedWebClientContext.event &&
                  !['request_denied', 'session_ended'].includes(
                    selectedWebClientContext.event,
                  ) && (
                    <Button
                      danger
                      loading={ending}
                      onClick={() => void finishSession(selected)}
                    >
                      <FormattedMessage
                        id="pages.audits.webClient.disconnect"
                        defaultMessage="End Web Client connection"
                      />
                    </Button>
                  )}
              </>
            )}
            <Typography.Paragraph>
              <strong>
                {intl.formatMessage({
                  id: 'pages.audits.target',
                  defaultMessage: 'Target',
                })}
                :
              </strong>{' '}
              {selected.target_type || '-'} / {selected.target_guid || '-'}
            </Typography.Paragraph>
            <Typography.Paragraph>
              <strong>
                {intl.formatMessage({
                  id: 'pages.audits.beforeState',
                  defaultMessage: 'Before state',
                })}
              </strong>
              <pre>{JSON.stringify(selected.before_state, null, 2) || '-'}</pre>
            </Typography.Paragraph>
            <Typography.Paragraph>
              <strong>
                {intl.formatMessage({
                  id: 'pages.audits.afterState',
                  defaultMessage: 'After state',
                })}
              </strong>
              <pre>{JSON.stringify(selected.after_state, null, 2) || '-'}</pre>
            </Typography.Paragraph>
          </>
        )}
      </Drawer>
    </PageContainer>
  );
};

export default ConsoleAudit;
