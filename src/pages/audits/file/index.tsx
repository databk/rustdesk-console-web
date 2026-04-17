import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Button, message, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import { getFileAudits } from '@/services/rustdesk-console/audit';
import { DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const FileAudit: React.FC = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>();
  const [dataSource, setDataSource] = useState<API.FileAuditItem[]>([]);

  const handleExportCSV = () => {
    if (dataSource.length === 0) {
      message.warning(
        intl.formatMessage({
          id: 'pages.audits.noDataToExport',
          defaultMessage: 'No data to export',
        }),
      );
      return;
    }

    const headers = [
      intl.formatMessage({ id: 'pages.audits.peerId', defaultMessage: 'Peer ID' }),
      intl.formatMessage({ id: 'pages.audits.clientName', defaultMessage: 'Client Name' }),
      intl.formatMessage({ id: 'pages.audits.clientIp', defaultMessage: 'Client IP' }),
      intl.formatMessage({ id: 'pages.audits.type', defaultMessage: 'Type' }),
      intl.formatMessage({ id: 'pages.audits.path', defaultMessage: 'Path' }),
      intl.formatMessage({ id: 'pages.audits.fileCount', defaultMessage: 'File Count' }),
      intl.formatMessage({ id: 'pages.audits.time', defaultMessage: 'Time' }),
    ];

    const rows = dataSource.map((item) => {
      const files = item.files ? item.files.map((f: any[]) => f[0]).join('; ') : '';
      return [
        item.peerId || '',
        item.clientName || '',
        item.clientIp || '',
        item.type === 0 ? 'Download' : 'Upload',
        item.path || files,
        item.fileCount || 0,
        item.createdAt || '',
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `file-audit-${dayjs().format('YYYY-MM-DD-HHmmss')}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    message.success(
      intl.formatMessage({
        id: 'pages.audits.exportSuccess',
        defaultMessage: 'Export successful',
      }),
    );
  };

  const columns: ProColumns<API.FileAuditItem>[] = [
    {
      title: '',
      dataIndex: 'index',
      valueType: 'indexBorder',
      width: 50,
    },
    {
      title: <FormattedMessage id="pages.audits.peerId" defaultMessage="Peer ID" />,
      dataIndex: 'peerId',
      width: 150,
      ellipsis: true,
      search: false,
      render: (_: unknown, record: API.FileAuditItem) => record.peerId || '-',
    },
    {
      title: <FormattedMessage id="pages.audits.clientName" defaultMessage="Client Name" />,
      dataIndex: 'clientName',
      width: 150,
      ellipsis: true,
      search: false,
      render: (_: unknown, record: API.FileAuditItem) => record.clientName || '-',
    },
    {
      title: <FormattedMessage id="pages.audits.clientIp" defaultMessage="Client IP" />,
      dataIndex: 'clientIp',
      width: 150,
      ellipsis: true,
      search: false,
      render: (_: unknown, record: API.FileAuditItem) => record.clientIp || '-',
    },
    {
      title: <FormattedMessage id="pages.audits.type" defaultMessage="Type" />,
      dataIndex: 'type',
      width: 100,
      search: false,
      render: (_: unknown, record: API.FileAuditItem) => {
        if (record.type === 0) {
          return <Tag color="green">Download</Tag>;
        }
        if (record.type === 1) {
          return <Tag color="blue">Upload</Tag>;
        }
        return <Tag>{record.type}</Tag>;
      },
    },
    {
      title: <FormattedMessage id="pages.audits.path" defaultMessage="Path" />,
      dataIndex: 'path',
      width: 250,
      ellipsis: true,
      search: false,
      render: (_: unknown, record: API.FileAuditItem) => {
        if (record.path) return record.path;
        if (record.files && record.files.length > 0) {
          return record.files.map((f: any[]) => f[0]).join('; ');
        }
        return '-';
      },
    },
    {
      title: <FormattedMessage id="pages.audits.fileCount" defaultMessage="File Count" />,
      dataIndex: 'fileCount',
      width: 100,
      search: false,
      render: (_: unknown, record: API.FileAuditItem) => record.fileCount || 0,
    },
    {
      title: <FormattedMessage id="pages.audits.deviceId" defaultMessage="Device ID" />,
      dataIndex: 'deviceId',
      width: 120,
      ellipsis: true,
      search: false,
      render: (_: unknown, record: API.FileAuditItem) => record.deviceId || '-',
    },
    {
      title: <FormattedMessage id="pages.audits.time" defaultMessage="Time" />,
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      width: 180,
      search: false,
      render: (_: unknown, record: API.FileAuditItem) => record.createdAt || '-',
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.FileAuditItem>
        headerTitle={
          <FormattedMessage id="pages.audits.file" defaultMessage="File Transfer Logs" />
        }
        actionRef={actionRef}
        rowKey="id"
        request={async (params) => {
          const result = await getFileAudits({
            current: params.current || 1,
            pageSize: params.pageSize || 20,
          });
          setDataSource(result.data || []);
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
