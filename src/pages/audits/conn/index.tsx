import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { App, Button, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import { getConnectionAudits } from '@/services/rustdesk-console/audit';
import { DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const ConnectionAudit: React.FC = () => {
  const intl = useIntl();
  const { message: msgApi } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [dataSource, setDataSource] = useState<API.ConnectionAuditItem[]>([]);

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
      intl.formatMessage({
        id: 'pages.audits.peerName',
        defaultMessage: 'Peer Name',
      }),
      intl.formatMessage({
        id: 'pages.audits.peerId',
        defaultMessage: 'Peer ID',
      }),
      intl.formatMessage({
        id: 'pages.audits.ip',
        defaultMessage: 'IP Address',
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
        id: 'pages.audits.deviceId',
        defaultMessage: 'Device ID',
      }),
    ];

    const rows = dataSource.map((item) => [
      item.action || '',
      item.peerName || '',
      item.peerId || '',
      item.ip || '',
      item.requestedAt || '',
      item.establishedAt || '',
      item.closedAt || '',
      item.deviceId || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([`\ufeff${csvContent}`], {
      type: 'text/csv;charset=utf-8;',
    });
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
      title: '',
      dataIndex: 'index',
      valueType: 'indexBorder',
      width: 50,
    },
    {
      title: <FormattedMessage id="pages.audits.type" defaultMessage="Type" />,
      dataIndex: 'action',
      width: 120,
      search: false,
      render: (_: unknown, record: API.ConnectionAuditItem) => {
        const action = record.action || '';
        if (action === 'established') {
          return (
            <Tag color="green">
              <FormattedMessage
                id="pages.audits.established"
                defaultMessage="Established"
              />
            </Tag>
          );
        }
        if (action === 'close') {
          return (
            <Tag color="red">
              <FormattedMessage
                id="pages.audits.closed"
                defaultMessage="Closed"
              />
            </Tag>
          );
        }
        return <Tag>{action}</Tag>;
      },
    },
    {
      title: (
        <FormattedMessage
          id="pages.audits.peerName"
          defaultMessage="Peer Name"
        />
      ),
      dataIndex: 'peerName',
      width: 150,
      ellipsis: true,
      search: false,
      render: (_: unknown, record: API.ConnectionAuditItem) =>
        record.peerName || '-',
    },
    {
      title: (
        <FormattedMessage id="pages.audits.peerId" defaultMessage="Peer ID" />
      ),
      dataIndex: 'peerId',
      width: 150,
      ellipsis: true,
      search: false,
      render: (_: unknown, record: API.ConnectionAuditItem) =>
        record.peerId || '-',
    },
    {
      title: (
        <FormattedMessage id="pages.audits.ip" defaultMessage="IP Address" />
      ),
      dataIndex: 'ip',
      width: 150,
      ellipsis: true,
      search: false,
      render: (_: unknown, record: API.ConnectionAuditItem) => record.ip || '-',
    },
    {
      title: (
        <FormattedMessage
          id="pages.audits.requestedAt"
          defaultMessage="Requested At"
        />
      ),
      dataIndex: 'requestedAt',
      width: 180,
      search: false,
      valueType: 'dateTime',
      render: (_: unknown, record: API.ConnectionAuditItem) =>
        record.requestedAt || '-',
    },
    {
      title: (
        <FormattedMessage
          id="pages.audits.establishedAt"
          defaultMessage="Established At"
        />
      ),
      dataIndex: 'establishedAt',
      width: 180,
      search: false,
      valueType: 'dateTime',
      render: (_: unknown, record: API.ConnectionAuditItem) =>
        record.establishedAt || '-',
    },
    {
      title: (
        <FormattedMessage
          id="pages.audits.closedAt"
          defaultMessage="Closed At"
        />
      ),
      dataIndex: 'closedAt',
      width: 180,
      search: false,
      valueType: 'dateTime',
      render: (_: unknown, record: API.ConnectionAuditItem) =>
        record.closedAt || '-',
    },
    {
      title: (
        <FormattedMessage
          id="pages.audits.deviceId"
          defaultMessage="Device ID"
        />
      ),
      dataIndex: 'deviceId',
      width: 120,
      ellipsis: true,
      search: false,
      render: (_: unknown, record: API.ConnectionAuditItem) =>
        record.deviceId || '-',
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.ConnectionAuditItem>
        headerTitle={
          <FormattedMessage
            id="pages.audits.conn"
            defaultMessage="Connection Logs"
          />
        }
        actionRef={actionRef}
        rowKey="id"
        request={async (params) => {
          const result = await getConnectionAudits({
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
            <FormattedMessage
              id="pages.audits.exportCSV"
              defaultMessage="Export CSV"
            />
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

export default ConnectionAudit;
