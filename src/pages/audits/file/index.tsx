import React, { useState, useRef, Fragment } from 'react';
import { Breadcrumb, Button, Drawer, Tooltip, Typography, App, Modal } from 'antd';
import { PageContainer } from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { getFileAudits } from '@/services/rustdesk-console/audit';
import type { API } from '@/services/rustdesk-console/typings';
import { ArrowLeftOutlined, ArrowRightOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useIntl, FormattedMessage } from '@umijs/max';
import dayjs from 'dayjs';

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const safeDecimals = decimals < 0 ? 0 : decimals;
  const exponent = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${parseFloat((bytes / 1024 ** exponent).toFixed(safeDecimals))} ${['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'][exponent]}`;
}

interface IInfo {
  name?: string;
  ip?: string;
  num?: number;
  files?: [string, number][];
}

const { Text } = Typography;

const EllipsisMiddle: React.FC<{ suffixCount: number; children: string }> = ({
  suffixCount,
  children,
}) => {
  let start = children;
  let suffix = '';
  if (children.length > suffixCount) {
    start = children.slice(0, children.length - suffixCount).trim();
    suffix = children.slice(-suffixCount).trim();
  }
  return (
    <Tooltip title={children}>
      <Text style={{ maxWidth: '100%' }} ellipsis={{ suffix }}>
        {start}
      </Text>
    </Tooltip>
  );
};

const FileAudit: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [info, setInfo] = useState<IInfo>();
  const [pageParams, setPageParams] = useState<Partial<API.PageParams>>();
  const intl = useIntl();
  const { message: msgApi, modal } = App.useApp();

  const onShowDrawer = (i: IInfo) => {
    setInfo(i);
    setDrawerOpen(true);
  };

  const directionEnumMap = (type: number) => {
    const remoteText = intl.formatMessage({ id: 'pages.audits.remote', defaultMessage: 'Remote' });
    const localText = intl.formatMessage({ id: 'pages.audits.local', defaultMessage: 'Local' });
    switch (type) {
      case 0:
        return `${remoteText}->${localText}`;
      case 1:
        return `${localText}->${remoteText}`;
      default:
        return type.toString();
    }
  };

  const fetchExportData = async (): Promise<API.FileAuditItem[]> => {
    let allItems: API.FileAuditItem[] = [];
    let total = 0;
    const pageSize = 100;
    let current = 0;
    
    do {
      current++;
      const items = await getFileAudits({
        ...pageParams,
        current: current,
        pageSize: pageSize,
      });
      if (total === 0 && items.total != null) {
        total = items.total;
      }
      if (items.data != null) {
        allItems = allItems.concat(items.data);
      }
    } while (current < 10 && pageSize * current < total);

    return allItems;
  };

  const generateCsvContent = (items: API.FileAuditItem[]): string => {
    const titles = [
      intl.formatMessage({ id: 'pages.audits.remote', defaultMessage: 'Remote' }),
      intl.formatMessage({ id: 'pages.audits.local', defaultMessage: 'Local' }),
      intl.formatMessage({ id: 'pages.audits.time', defaultMessage: 'Time' }),
      intl.formatMessage({ id: 'pages.audits.direction', defaultMessage: 'Direction' }),
      intl.formatMessage({ id: 'pages.audits.file', defaultMessage: 'File' }),
      intl.formatMessage({ id: 'pages.audits.detail', defaultMessage: 'Detail' }),
    ];

    const rows: string[][] = [];
    items.forEach((record) => {
      const row: string[] = [];
      row.push(record.deviceId || '');
      const localTxt = `${record.clientName || ''}@${record.clientIp || ''}`;
      row.push(localTxt);
      row.push(record.createdAt || '');
      row.push(directionEnumMap(record.type || 0));
      row.push(record.path || '');
      let detail = '';
      if (record.files && record.files.length > 0) {
        const detailObj = {
          num: record.fileCount,
          files: record.files,
        };
        detail = JSON.stringify(detailObj);
      }
      row.push(detail);
      rows.push(row);
    });

    return [
      titles.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');
  };

  const downloadCsv = (csvContent: string) => {
    const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `file-audit-${dayjs().format('YYYY-MM-DD-HHmmss')}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportCsv = async () => {
    modal.confirm({
      title: intl.formatMessage({ id: 'pages.audits.exportConfirmTitle', defaultMessage: 'Export CSV' }),
      content: intl.formatMessage({ id: 'pages.audits.exportConfirmContent', defaultMessage: 'Export up to 1000 records. Continue?' }),
      okText: intl.formatMessage({ id: 'pages.common.confirm', defaultMessage: 'Yes' }),
      cancelText: intl.formatMessage({ id: 'pages.common.cancel', defaultMessage: 'No' }),
      onOk: async () => {
        try {
          const items = await fetchExportData();
          const csvContent = generateCsvContent(items);
          downloadCsv(csvContent);
          msgApi.success(
            intl.formatMessage({
              id: 'pages.audits.exportSuccess',
              defaultMessage: 'Export successful',
            }),
          );
        } catch (error) {
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

  const renderDetailColumn = (record: API.FileAuditItem) => {
    if (record.isFile) {
      if (record.fileCount === 1 && record.files && record.files.length === 1) {
        return formatBytes(record.files[0][1]);
      }
      return '';
    }

    if (record.fileCount !== undefined && record.files) {
      const text = `${record.fileCount} ${intl.formatMessage({
        id: 'pages.audits.files',
        defaultMessage: 'Files',
      })}`;
      
      if (record.fileCount > 0 && record.files.length > 0) {
        const localInfo: IInfo = {
          num: record.fileCount,
          files: record.files,
          name: record.clientName,
          ip: record.clientIp,
        };
        return (
          <Button type="link" onClick={() => onShowDrawer(localInfo)}>
            {text}
          </Button>
        );
      }
      
      return text;
    }

    return '';
  };

  const columns: ProColumns<API.FileAuditItem>[] = [
    {
      title: <FormattedMessage id="pages.audits.remote" defaultMessage="Remote" />,
      dataIndex: 'peerId',
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
      title: <FormattedMessage id="pages.audits.remote" defaultMessage="Remote" />,
      dataIndex: 'deviceId',
      tip: intl.formatMessage({
        id: 'pages.audits.remoteTip',
        defaultMessage: 'Remotely controlled computer or terminal',
      }),
      hideInSearch: true,
      render: (_, record) => record.deviceId || '-',
    },
    {
      title: <FormattedMessage id="pages.audits.direction" defaultMessage="Direction" />,
      dataIndex: 'type',
      valueType: 'select',
      width: 80,
      render: (_, record) => {
        const tip = directionEnumMap(record.type || 0);
        return (
          <Tooltip title={tip}>
            {record.type === 1 ? <ArrowLeftOutlined /> : <ArrowRightOutlined />}
          </Tooltip>
        );
      },
      valueEnum: {
        0: {
          text: directionEnumMap(0),
        },
        1: {
          text: directionEnumMap(1),
        },
      },
    },
    {
      title: <FormattedMessage id="pages.audits.local" defaultMessage="Local" />,
      dataIndex: 'local',
      search: false,
      width: 200,
      render: (_, record) => {
        let txt = '';
        const name = record.clientName || '';
        const ip = (record.clientIp || '').replace('::ffff:', '');
        if (name) txt = name;
        if (ip) txt += '@' + ip;
        return txt || '-';
      },
    },
    {
      title: <FormattedMessage id="pages.audits.time" defaultMessage="Time" />,
      dataIndex: 'createdAt',
      valueType: 'dateTimeRange',
      width: 180,
      render: (_, record) => {
        if (!record.createdAt) return '-';
        return dayjs(record.createdAt).format('YYYY-MM-DD HH:mm:ss');
      },
      fieldProps: {
        placeholder: [
          intl.formatMessage({ id: 'pages.audits.startTime', defaultMessage: 'Start Time' }),
          intl.formatMessage({ id: 'pages.audits.endTime', defaultMessage: 'End Time' }),
        ],
      },
    },
    {
      title: <FormattedMessage id="pages.audits.file" defaultMessage="File" />,
      search: false,
      dataIndex: 'path',
      width: '30%',
      ellipsis: true,
      tip: intl.formatMessage({
        id: 'pages.audits.pathTip',
        defaultMessage: 'Path of Remote Device',
      }),
      render: (_, record) => {
        if (record.path) {
          return <EllipsisMiddle suffixCount={16}>{record.path}</EllipsisMiddle>;
        }
        if (record.files && record.files.length > 0) {
          const filePath = record.files[0][0];
          return <EllipsisMiddle suffixCount={16}>{filePath}</EllipsisMiddle>;
        }
        return '-';
      },
    },
    {
      title: <FormattedMessage id="pages.audits.detail" defaultMessage="Detail" />,
      dataIndex: 'detail',
      search: false,
      align: 'center',
      render: (_, record) => renderDetailColumn(record),
    },
  ];

  return (
    <PageContainer
      breadcrumbRender={() => (
        <Breadcrumb
          items={[
            {
              title: (
                <FormattedMessage id="menu.list.audit-list" defaultMessage="Audit List" />
              ),
            },
            {
              title: (
                <FormattedMessage
                  id="menu.list.audit-list.File"
                  defaultMessage="File Transfer"
                />
              ),
            },
          ]}
        />
      )}
    >
      <ProTable<API.FileAuditItem, API.PageParams>
        headerTitle={
          <FormattedMessage id="pages.audits.file" defaultMessage="File Transfer Logs" />
        }
        columnsState={{
          persistenceType: 'localStorage',
          persistenceKey: 'filelist_columns_state',
        }}
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        request={async (params) => {
          const requestParams: any = {
            current: params.current,
            pageSize: params.pageSize,
          };

          if (params.peerId) {
            requestParams.peerId = params.peerId;
          }

          if (params.type !== undefined && params.type !== null) {
            requestParams.type = params.type;
          }

          if (params.createdAt && Array.isArray(params.createdAt) && params.createdAt.length === 2) {
            requestParams.startTime = dayjs(params.createdAt[0]).toISOString();
            requestParams.endTime = dayjs(params.createdAt[1]).toISOString();
          }

          const result = await getFileAudits(requestParams);
          return {
            data: result.data || [],
            total: result.total || 0,
            success: true,
          };
        }}
        columns={columns}
        beforeSearchSubmit={(params) => {
          setPageParams(params);
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
            <Button type="default" onClick={exportCsv}>
              <FormattedMessage id="pages.audits.exportCSV" defaultMessage="Export as csv" />
            </Button>
          </Tooltip>,
        ]}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />
      <Drawer
        title={
          <Fragment>
            <FormattedMessage id="pages.audits.detail" defaultMessage="Detail" />
            {info?.num && info?.files?.length && info?.num > info.files.length ? (
              <Tooltip
                title={intl.formatMessage({
                  id: 'pages.audits.limitedTip',
                  defaultMessage: 'Show the 10 largest files by size',
                })}
              >
                <InfoCircleOutlined style={{ float: 'right' }} />
              </Tooltip>
            ) : (
              ''
            )}
          </Fragment>
        }
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
      >
        {info?.files?.map(([name, size]) => (
          <p key={name}>
            <span>{name}</span>
            <span style={{ float: 'right' }}>{formatBytes(size)}</span>
          </p>
        ))}
        {info?.num && info?.files?.length && info?.num > info.files.length ? '...' : ''}
      </Drawer>
    </PageContainer>
  );
};

export default FileAudit;
