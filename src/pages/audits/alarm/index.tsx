import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { FormattedMessage } from '@umijs/max';
import { Tag } from 'antd';
import React, { useRef } from 'react';
import { getAlarmAudits } from '@/services/rustdesk-console/audit';

const AlarmAudit: React.FC = () => {
  const actionRef = useRef<ActionType>(null);

  const columns: ProColumns<API.AlarmAuditItem>[] = [
    {
      title: <FormattedMessage id="pages.audits.from" defaultMessage="From" />,
      dataIndex: 'from',
      width: 150,
      ellipsis: true,
    },
    {
      title: (
        <FormattedMessage
          id="pages.audits.fromName"
          defaultMessage="From Name"
        />
      ),
      dataIndex: 'from_name',
      width: 150,
      ellipsis: true,
    },
    {
      title: <FormattedMessage id="pages.audits.to" defaultMessage="To" />,
      dataIndex: 'to',
      width: 150,
      ellipsis: true,
    },
    {
      title: (
        <FormattedMessage id="pages.audits.toName" defaultMessage="To Name" />
      ),
      dataIndex: 'to_name',
      width: 150,
      ellipsis: true,
    },
    {
      title: (
        <FormattedMessage
          id="pages.audits.alarmType"
          defaultMessage="Alarm Type"
        />
      ),
      dataIndex: 'alarm_type',
      width: 120,
      render: (_, record) => {
        const type = record.alarm_type || '';
        return <Tag color="orange">{type}</Tag>;
      },
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
      <ProTable<API.AlarmAuditItem>
        headerTitle={
          <FormattedMessage
            id="pages.audits.alarm"
            defaultMessage="Alarm Audits"
          />
        }
        actionRef={actionRef}
        rowKey="id"
        request={async (params) => {
          const result = await getAlarmAudits({
            current: params.current || 1,
            pageSize: params.pageSize || 20,
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
