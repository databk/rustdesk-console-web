import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Tag } from 'antd';
import React, { useRef } from 'react';
import { getFileAudits } from '@/services/rustdesk-console/audit';

const FileAudit: React.FC = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>();

  const columns: ProColumns<API.FileAuditItem>[] = [
    {
      title: <FormattedMessage id="pages.audits.from" defaultMessage="From" />,
      dataIndex: 'from',
      width: 150,
      ellipsis: true,
    },
    {
      title: <FormattedMessage id="pages.audits.fromName" defaultMessage="From Name" />,
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
      title: <FormattedMessage id="pages.audits.toName" defaultMessage="To Name" />,
      dataIndex: 'to_name',
      width: 150,
      ellipsis: true,
    },
    {
      title: <FormattedMessage id="pages.audits.filename" defaultMessage="Filename" />,
      dataIndex: 'filename',
      width: 200,
      ellipsis: true,
      copyable: true,
    },
    {
      title: <FormattedMessage id="pages.audits.action" defaultMessage="Action" />,
      dataIndex: 'action',
      width: 100,
      render: (_, record) => {
        const action = record.action || '';
        if (action === 'upload' || action === 'send') {
          return <Tag color="blue">{action}</Tag>;
        }
        if (action === 'download' || action === 'receive') {
          return <Tag color="green">{action}</Tag>;
        }
        return <Tag>{action}</Tag>;
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
      <ProTable<API.FileAuditItem>
        headerTitle={
          <FormattedMessage id="pages.audits.file" defaultMessage="File Transfer Audits" />
        }
        actionRef={actionRef}
        rowKey="id"
        request={async (params) => {
          const result = await getFileAudits({
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
        scroll={{ x: 1200 }}
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

export default FileAudit;
