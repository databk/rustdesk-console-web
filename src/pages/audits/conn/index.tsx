import {
  CameraOutlined,
  CodeOutlined,
  DownloadOutlined,
  EditTwoTone,
  FileSyncOutlined,
  FundProjectionScreenOutlined,
  QuestionOutlined,
  RetweetOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { FormattedMessage, useAccess, useIntl } from '@umijs/max';
import {
  App,
  Breadcrumb,
  Button,
  Drawer,
  Modal,
  Tooltip,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import React, { Fragment, useRef, useState } from 'react';
import {
  disconnectConnection,
  getConnectionAudits,
  updateConnectionAudit,
} from '@/services/rustdesk-console/audit';

const { Text } = Typography;

const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss';

const formatDateTime = (val?: string): string =>
  val ? dayjs(val).format(DATE_FORMAT) : '-';

const renderLocalField = (record: API.ConnectionAuditItem): string => {
  const name = record.peerName || '';
  const ip = (record.ip || '').replace('::ffff:', '');
  let txt = '';
  if (name) txt = name;
  if (ip) txt += `@${ip}`;
  return txt || '-';
};

const sanitizeCsvCell = (cell: string): string => {
  let safe = cell.replace(/"/g, '""');
  if (/^[=+\-@\t\r]/.test(safe)) {
    safe = `'${safe}`;
  }
  return `"${safe}"`;
};

const renderDuration = (record: API.ConnectionAuditItem): string => {
  if (!record.establishedAt || !record.closedAt) return '-';
  const start = dayjs(record.establishedAt);
  const end = dayjs(record.closedAt);
  const durationSeconds = end.diff(start, 'second');
  if (durationSeconds < 0) return '-';

  const days = Math.floor(durationSeconds / 86400);
  const hours = Math.floor((durationSeconds % 86400) / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);
  const seconds = durationSeconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(' ');
};

const renderConnTypeIcon = (type?: number) => {
  switch (type) {
    case -1:
      return <QuestionOutlined />;
    case 0:
      return <FundProjectionScreenOutlined />;
    case 1:
      return <FileSyncOutlined />;
    case 2:
      return <RetweetOutlined />;
    case 3:
      return <CameraOutlined />;
    case 4:
      return <CodeOutlined />;
    default:
      return <QuestionOutlined />;
  }
};

const getConnTypeMsgId = (type?: number): string => {
  switch (type) {
    case -1:
      return 'pages.audits.connType.notLoggedIn';
    case 0:
      return 'pages.audits.connType.remoteDesktop';
    case 1:
      return 'pages.audits.connType.fileTransfer';
    case 2:
      return 'pages.audits.connType.portTransfer';
    case 3:
      return 'pages.audits.connType.viewCamera';
    case 4:
      return 'pages.audits.connType.terminal';
    default:
      return 'pages.audits.connType.notLoggedIn';
  }
};

interface DetailField {
  label: string;
  dataIndex?: keyof API.ConnectionAuditItem;
  render?: (r: API.ConnectionAuditItem) => string;
}

interface ConnectionAuditSearchParams extends API.PageParams {
  deviceId?: string;
  type?: number;
  createdAt?: [string, string];
}

const ConnectionAudit: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const intl = useIntl();
  const { message: msgApi, modal } = App.useApp();
  const access = useAccess();
  const canEdit = access.canAdmin;

  const [pageParams, setPageParams] =
    useState<Partial<ConnectionAuditSearchParams>>();
  const [currentRow, setCurrentRow] = useState<API.ConnectionAuditItem>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [disconnectConfirmLoading, setDisconnectConfirmLoading] =
    useState(false);
  const [currentDisconnectId, setCurrentDisconnectId] = useState<string>('');

  const handleDisconnect = async () => {
    setDisconnectConfirmLoading(true);
    try {
      const res = await disconnectConnection(currentDisconnectId);
      if (res.succ !== false) {
        msgApi.success(
          intl.formatMessage({
            id: 'pages.audits.disconnectSuccess',
            defaultMessage: 'Successfully disconnected!',
          }),
        );
        actionRef.current?.reload();
      } else {
        msgApi.error(
          intl.formatMessage({
            id: 'pages.audits.disconnectFailed',
            defaultMessage: 'Disconnect failed!',
          }),
        );
      }
    } catch (error) {
      msgApi.error(
        typeof error === 'string'
          ? error
          : intl.formatMessage({
              id: 'pages.audits.disconnectFailed',
              defaultMessage: 'Disconnect failed!',
            }),
      );
    } finally {
      setDisconnectConfirmLoading(false);
      setDisconnectModalOpen(false);
    }
  };

  const handleUpdateNote = async (
    fields: API.ConnectionAuditItem,
    old: API.ConnectionAuditItem,
  ) => {
    const data: Record<string, any> = { id: old.id };
    if ((fields.note || '') !== (old.note || '')) {
      data.note = fields.note;
    }
    if (Object.keys(data).length === 1) return true;

    try {
      await updateConnectionAudit(data);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.audits.updateSuccess',
          defaultMessage: 'Update is successful',
        }),
      );
      return true;
    } catch (error) {
      msgApi.error(
        typeof error === 'string'
          ? error
          : intl.formatMessage({
              id: 'pages.audits.updateFailed',
              defaultMessage: 'Update failed, please try again!',
            }),
      );
      return false;
    }
  };

  const fetchExportData = async (): Promise<API.ConnectionAuditItem[]> => {
    let allItems: API.ConnectionAuditItem[] = [];
    let total = 0;
    const pageSize = 100;
    let current = 0;

    do {
      current++;
      const items = await getConnectionAudits({
        ...pageParams,
        current,
        pageSize,
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

  const generateCsvContent = (items: API.ConnectionAuditItem[]): string => {
    const titles = [
      intl.formatMessage({ id: 'pages.audits.type', defaultMessage: 'Type' }),
      intl.formatMessage({
        id: 'pages.audits.remote',
        defaultMessage: 'Remote',
      }),
      intl.formatMessage({
        id: 'pages.audits.local',
        defaultMessage: 'Local',
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
        id: 'pages.audits.duration',
        defaultMessage: 'Duration',
      }),
      intl.formatMessage({
        id: 'pages.audits.note',
        defaultMessage: 'Note',
      }),
    ];

    const rows: string[][] = [];
    items.forEach((record) => {
      const row: string[] = [];
      row.push(
        intl.formatMessage({
          id: getConnTypeMsgId(record.type),
          defaultMessage: '-',
        }),
      );
      row.push(record.deviceId || '');
      row.push(renderLocalField(record));
      row.push(record.requestedAt || '');
      row.push(record.establishedAt || '');
      row.push(record.closedAt || '');
      row.push(renderDuration(record));
      row.push(record.note || '');
      rows.push(row);
    });

    return [
      titles.map(sanitizeCsvCell).join(','),
      ...rows.map((row) => row.map(sanitizeCsvCell).join(',')),
    ].join('\n');
  };

  const downloadCsv = (csvContent: string) => {
    const blob = new Blob([`\ufeff${csvContent}`], {
      type: 'text/csv;charset=utf-8;',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `connection-audit-${dayjs().format('YYYY-MM-DD-HHmmss')}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportCsv = async () => {
    modal.confirm({
      title: intl.formatMessage({
        id: 'pages.audits.exportConfirmTitle',
        defaultMessage: 'Export CSV',
      }),
      content: intl.formatMessage({
        id: 'pages.audits.exportConfirmContent',
        defaultMessage: 'Export up to 1000 records. Continue?',
      }),
      okText: intl.formatMessage({
        id: 'pages.common.confirm',
        defaultMessage: 'Yes',
      }),
      cancelText: intl.formatMessage({
        id: 'pages.common.cancel',
        defaultMessage: 'No',
      }),
      onOk: async () => {
        try {
          const items = await fetchExportData();
          if (items.length === 0) {
            msgApi.warning(
              intl.formatMessage({
                id: 'pages.audits.noDataToExport',
                defaultMessage: 'No data to export',
              }),
            );
            return;
          }
          const csvContent = generateCsvContent(items);
          downloadCsv(csvContent);
          msgApi.success(
            intl.formatMessage({
              id: 'pages.audits.exportSuccess',
              defaultMessage: 'Export successful',
            }),
          );
        } catch (_error) {
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

  const connTypeValueEnum: Record<number, { text: string }> = {
    [-1]: {
      text: intl.formatMessage({
        id: 'pages.audits.connType.notLoggedIn',
        defaultMessage: 'Not Logged In',
      }),
    },
    0: {
      text: intl.formatMessage({
        id: 'pages.audits.connType.remoteDesktop',
        defaultMessage: 'Remote Desktop',
      }),
    },
    1: {
      text: intl.formatMessage({
        id: 'pages.audits.connType.fileTransfer',
        defaultMessage: 'File Transfer',
      }),
    },
    2: {
      text: intl.formatMessage({
        id: 'pages.audits.connType.portTransfer',
        defaultMessage: 'Port Transfer',
      }),
    },
    3: {
      text: intl.formatMessage({
        id: 'pages.audits.connType.viewCamera',
        defaultMessage: 'View Camera',
      }),
    },
    4: {
      text: intl.formatMessage({
        id: 'pages.audits.connType.terminal',
        defaultMessage: 'Terminal',
      }),
    },
  };

  const columns: ProColumns<API.ConnectionAuditItem>[] = [
    {
      title: <FormattedMessage id="pages.audits.type" defaultMessage="Type" />,
      dataIndex: 'type',
      width: 60,
      valueType: 'select',
      valueEnum: connTypeValueEnum,
      render: (_, record) => {
        const icon = renderConnTypeIcon(record.type);
        const msgId = getConnTypeMsgId(record.type);
        return (
          <Button
            type="link"
            style={{ padding: 0 }}
            onClick={() => {
              setCurrentRow(record);
              setDrawerOpen(true);
            }}
          >
            <Tooltip title={intl.formatMessage({ id: msgId })}>{icon}</Tooltip>
          </Button>
        );
      },
    },
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
      render: (_, record) => renderLocalField(record),
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
      title: (
        <FormattedMessage
          id="pages.audits.requestedAt"
          defaultMessage="Requested At"
        />
      ),
      dataIndex: 'requestedAt',
      width: 180,
      search: false,
      render: (_, record) => formatDateTime(record.requestedAt),
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
      render: (_, record) => formatDateTime(record.establishedAt),
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
      render: (_, record) => formatDateTime(record.closedAt),
    },
    {
      title: (
        <FormattedMessage
          id="pages.audits.duration"
          defaultMessage="Duration"
        />
      ),
      dataIndex: 'duration',
      search: false,
      width: 120,
      render: (_, record) => renderDuration(record),
    },
    {
      title: <FormattedMessage id="pages.audits.note" defaultMessage="Note" />,
      dataIndex: 'note',
      valueType: 'textarea',
      search: false,
      width: 200,
      ellipsis: true,
      render: (_, record) => (
        <Fragment>
          <Text
            ellipsis={{ tooltip: record.note || '' }}
            style={{ maxWidth: 150 }}
          >
            {record.note || ''}
          </Text>
          {canEdit && (
            <Button
              icon={<EditTwoTone />}
              type="text"
              size="small"
              onClick={() => {
                setCurrentRow(record);
                setEditModalVisible(true);
              }}
            />
          )}
        </Fragment>
      ),
    },
    {
      title: (
        <FormattedMessage id="pages.common.action" defaultMessage="Action" />
      ),
      search: false,
      hideInTable: !canEdit,
      width: 120,
      render: (_, record) => {
        if (!canEdit) {
          return <Text type="secondary">-</Text>;
        }
        const isActive = record.action === 'established' && !record.closedAt;
        if (!isActive) return '';
        return (
          <Button
            size="small"
            type="default"
            danger
            onClick={() => {
              setCurrentDisconnectId(record.connId || String(record.id));
              setDisconnectModalOpen(true);
            }}
          >
            <FormattedMessage
              id="pages.audits.disconnect"
              defaultMessage="Disconnect"
            />
          </Button>
        );
      },
    },
  ];

  const detailFields: DetailField[] = [
    {
      label: intl.formatMessage({
        id: 'pages.audits.type',
        defaultMessage: 'Type',
      }),
      render: (r: API.ConnectionAuditItem) =>
        intl.formatMessage({ id: getConnTypeMsgId(r.type) }),
    },
    {
      label: intl.formatMessage({
        id: 'pages.audits.remote',
        defaultMessage: 'Remote',
      }),
      dataIndex: 'deviceId',
    },
    {
      label: intl.formatMessage({
        id: 'pages.audits.local',
        defaultMessage: 'Local',
      }),
      render: renderLocalField,
    },
    {
      label: intl.formatMessage({
        id: 'pages.audits.requestedAt',
        defaultMessage: 'Requested At',
      }),
      render: (r: API.ConnectionAuditItem) => formatDateTime(r.requestedAt),
    },
    {
      label: intl.formatMessage({
        id: 'pages.audits.establishedAt',
        defaultMessage: 'Established At',
      }),
      render: (r: API.ConnectionAuditItem) => formatDateTime(r.establishedAt),
    },
    {
      label: intl.formatMessage({
        id: 'pages.audits.closedAt',
        defaultMessage: 'Closed At',
      }),
      render: (r: API.ConnectionAuditItem) => formatDateTime(r.closedAt),
    },
    {
      label: intl.formatMessage({
        id: 'pages.audits.duration',
        defaultMessage: 'Duration',
      }),
      render: renderDuration,
    },
    {
      label: intl.formatMessage({
        id: 'pages.audits.note',
        defaultMessage: 'Note',
      }),
      dataIndex: 'note',
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
                  id="menu.list.audit-list.Connection"
                  defaultMessage="Connection"
                />
              ),
            },
          ]}
        />
      )}
    >
      <ProTable<API.ConnectionAuditItem, ConnectionAuditSearchParams>
        headerTitle={
          <FormattedMessage
            id="pages.audits.conn"
            defaultMessage="Connection Audits"
          />
        }
        columnsState={{
          persistenceType: 'localStorage',
          persistenceKey: 'conn_audit_columns_state',
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
          const result = await getConnectionAudits(requestParams);
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
            <Button
              type="default"
              icon={<DownloadOutlined />}
              onClick={exportCsv}
            >
              <FormattedMessage
                id="pages.audits.exportCSV"
                defaultMessage="Export CSV"
              />
            </Button>
          </Tooltip>,
        ]}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        scroll={{ x: 1500 }}
        options={{
          density: true,
          setting: { listsHeight: 400 },
          fullScreen: false,
          reload: true,
        }}
      />

      <Drawer
        title={
          <FormattedMessage id="pages.audits.detail" defaultMessage="Detail" />
        }
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width={400}
      >
        {currentRow &&
          detailFields.map((field) => (
            <div
              key={field.dataIndex || field.label}
              style={{ marginBottom: 16 }}
            >
              <Text type="secondary">{field.label}</Text>
              <div>
                {field.render
                  ? field.render(currentRow)
                  : currentRow[field.dataIndex || 'note'] || '-'}
              </div>
            </div>
          ))}
      </Drawer>

      <ModalForm
        title={
          <FormattedMessage id="pages.common.edit" defaultMessage="Edit" />
        }
        open={editModalVisible}
        width={400}
        initialValues={currentRow}
        onOpenChange={setEditModalVisible}
        onFinish={async (value) => {
          const success = await handleUpdateNote(
            value as API.ConnectionAuditItem,
            currentRow as API.ConnectionAuditItem,
          );
          if (success) {
            setEditModalVisible(false);
            actionRef.current?.reload();
          }
        }}
      >
        <ProFormTextArea
          fieldProps={{ autoComplete: 'off' }}
          width="md"
          name="note"
          rules={[{ max: 300 }]}
          label={
            <FormattedMessage id="pages.audits.note" defaultMessage="Note" />
          }
        />
      </ModalForm>

      <Modal
        title={
          <FormattedMessage
            id="pages.audits.disconnectConfirmTitle"
            defaultMessage="Confirm Operation"
          />
        }
        open={disconnectModalOpen}
        onOk={handleDisconnect}
        onCancel={() => setDisconnectModalOpen(false)}
        confirmLoading={disconnectConfirmLoading}
      >
        <p>
          <FormattedMessage
            id="pages.audits.disconnectConfirmTip"
            defaultMessage="Are you sure you want to disconnect this device?"
          />
        </p>
      </Modal>
    </PageContainer>
  );
};

export default ConnectionAudit;
