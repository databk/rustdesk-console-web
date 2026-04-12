import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { App, Button, Space, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import { getConnectionAudits } from '@/services/rustdesk-console/audit';
import { DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const ConnectionAudit: React.FC = () => {
  const intl = useIntl();
  const { message: msgApi } = App.useApp();
  const actionRef = useRef<ActionType>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [dataSource, setDataSource] = useState<API.ConnectionAuditItem[]>([]);
  const [searchParams, setSearchParams] = useState<{
    remote?: string;
    conn_type?: number;
    created_at?: string;
  }>({});

  const handleExportCSV = () => {
    if (dataSource.length === 0) {
      msgApi.warning(
        intl.formatMessage({
          id: 'pages.audits.noDataToExport',
          defaultMessage: 'No data to export',
        }),
      );
      return;
    }

    const headers = [
      intl.formatMessage({ id: 'pages.audits.type', defaultMessage: 'Type' }),
      intl.formatMessage({ id: 'pages.audits.controlledDevice', defaultMessage: 'Controlled Device' }),
      intl.formatMessage({ id: 'pages.audits.masterDevice', defaultMessage: 'Master Device' }),
      intl.formatMessage({ id: 'pages.audits.startTime', defaultMessage: 'Start Time' }),
      intl.formatMessage({ id: 'pages.audits.endTime', defaultMessage: 'End Time' }),
      intl.formatMessage({ id: 'pages.audits.duration', defaultMessage: 'Duration' }),
      intl.formatMessage({ id: 'pages.audits.note', defaultMessage: 'Note' }),
    ];

    const rows = dataSource.map((item) => [
      item.action || '',
      item.to || '',
      item.from || '',
      item.start_time || '',
      item.end_time || '',
      item.duration || '',
      item.note || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `connection-audit-${dayjs().format('YYYY-MM-DD-HHmmss')}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    msgApi.success(
      intl.formatMessage({
        id: 'pages.audits.exportSuccess',
        defaultMessage: 'Export successful',
      }),
    );
  };

  const columns: ProColumns<API.ConnectionAuditItem>[] = [
    {
      title: "",
      dataIndex: "index",
      valueType: "indexBorder",
      width: 50,
    },
    {
      title: (
        <FormattedMessage id="pages.audits.type" defaultMessage="Type" />
      ),
      dataIndex: "action",
      width: 100,
      render: (_: unknown, record: API.ConnectionAuditItem) => {
        const action = record.action || '';
        if (action === 'connect' || action === 'CONNECT') {
          return <Tag color="green">{action}</Tag>;
        }
        if (action === 'disconnect' || action === 'DISCONNECT') {
          return <Tag color="red">{action}</Tag>;
        }
        return <Tag>{action}</Tag>;
      },
    },
    {
      title: (
        <FormattedMessage id="pages.audits.controlledDevice" defaultMessage="Controlled Device" />
      ),
      dataIndex: "to",
      width: 150,
      ellipsis: true,
      render: (_: unknown, record: API.ConnectionAuditItem) => (
        <span>
          {record.to}
          {record.to_name && <span style={{ color: '#999' }}> ({record.to_name})</span>}
        </span>
      ),
    },
    {
      title: (
        <FormattedMessage id="pages.audits.masterDevice" defaultMessage="Master Device" />
      ),
      dataIndex: "from",
      width: 150,
      ellipsis: true,
      render: (_: unknown, record: API.ConnectionAuditItem) => (
        <span>
          {record.from}
          {record.from_name && <span style={{ color: '#999' }}> ({record.from_name})</span>}
        </span>
      ),
    },
    {
      title: (
        <FormattedMessage id="pages.audits.startTime" defaultMessage="Start Time" />
      ),
      dataIndex: "start_time",
      width: 180,
      valueType: "dateTime",
      render: (_: unknown, record: API.ConnectionAuditItem) => record.start_time || '-',
    },
    {
      title: (
        <FormattedMessage id="pages.audits.endTime" defaultMessage="End Time" />
      ),
      dataIndex: "end_time",
      width: 180,
      valueType: "dateTime",
      render: (_: unknown, record: API.ConnectionAuditItem) => record.end_time || '-',
    },
    {
      title: (
        <FormattedMessage id="pages.audits.duration" defaultMessage="Duration" />
      ),
      dataIndex: "duration",
      width: 100,
      render: (_: unknown, record: API.ConnectionAuditItem) => record.duration || '-',
    },
    {
      title: (
        <FormattedMessage id="pages.audits.note" defaultMessage="Note" />
      ),
      dataIndex: "note",
      width: 150,
      ellipsis: true,
      render: (_: unknown, record: API.ConnectionAuditItem) => record.note || '-',
    },
    {
      title: (
        <FormattedMessage id="pages.common.action" defaultMessage="Action" />
      ),
      valueType: "option",
      width: 80,
      fixed: "right",
      render: () => (
        <Space size="small">
          <Button type="link" size="small">
            <FormattedMessage id="pages.common.detail" defaultMessage="Detail" />
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.ConnectionAuditItem>
        headerTitle={
          <FormattedMessage id="pages.audits.conn" defaultMessage="Connection Logs" />
        }
        actionRef={actionRef}
        rowKey="id"
        request={async (params) => {
          const result = await getConnectionAudits({
            current: params.current || 1,
            pageSize: params.pageSize || 20,
            remote: searchParams.remote,
            conn_type: searchParams.conn_type,
            created_at: searchParams.created_at,
          });
          setDataSource(result.data || []);
          return {
            data: result.data || [],
            total: result.total || 0,
            success: true,
          };
        }}
        columns={columns}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        search={{
          labelWidth: 'auto',
          defaultCollapsed: false,
          optionRender: (searchConfig, formProps, dom) => [
            ...dom.reverse(),
          ],
        }}
        form={{
          onSubmit: (values) => {
            setSearchParams(values);
            actionRef.current?.reload();
          },
          onReset: () => {
            setSearchParams({});
          },
        }}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        scroll={{ x: 1300 }}
        toolBarRender={() => [
          <Button
            key="export"
            icon={<DownloadOutlined />}
            onClick={handleExportCSV}
          >
            <FormattedMessage id="pages.audits.exportCSV" defaultMessage="Export CSV" />
          </Button>,
        ]}
      />
    </PageContainer>
  );
};

export default ConnectionAudit;
