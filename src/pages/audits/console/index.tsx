import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import React, { useRef } from 'react';
import { getConsoleAudits } from '@/services/rustdesk-console/audit';

const ConsoleAudit: React.FC = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>(null);

  const columns: ProColumns<API.ConsoleAuditItem>[] = [
    {
      title: <FormattedMessage id="pages.audits.user" defaultMessage="User" />,
      dataIndex: 'user',
      width: 150,
    },
    {
      title: <FormattedMessage id="pages.audits.action" defaultMessage="Action" />,
      dataIndex: 'action',
      width: 150,
    },
    {
      title: <FormattedMessage id="pages.audits.detail" defaultMessage="Detail" />,
      dataIndex: 'detail',
      ellipsis: true,
    },
    {
      title: <FormattedMessage id="pages.audits.time" defaultMessage="Time" />,
      dataIndex: 'time',
      valueType: 'dateTime',
      width: 180,
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.ConsoleAuditItem>
        headerTitle={
          <FormattedMessage id="pages.audits.console" defaultMessage="Console Audits" />
        }
        actionRef={actionRef}
        rowKey="id"
        request={async (params) => {
          const result = await getConsoleAudits({
            current: params.current || 1,
            pageSize: params.pageSize || 10,
          });
          return {
            data: result.data || [],
            total: result.total || 0,
            success: true,
          };
        }}
        columns={columns}
        search={false}
        pagination={{
          defaultPageSize: 10,
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
      />
    </PageContainer>
  );
};

export default ConsoleAudit;
