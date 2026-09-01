import {
  CheckCircleOutlined,
  CloudDownloadOutlined,
  DeleteOutlined,
  GithubOutlined,
  LoadingOutlined,
  PlusOutlined,
  RedoOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { App, Button, Popconfirm, Space, Tag, Typography } from 'antd';
import React from 'react';
import {
  deleteBuild,
  downloadBuildFile,
  getBuildList,
} from '@/services/rustdesk-console/nexus';

const { Text, Title } = Typography;

interface BuildListProps {
  actionRef: React.MutableRefObject<ActionType | null>;
  bindStatus: API.NexusBindStatus | null;
  onUnbind: () => void;
  onCreate: () => void;
  onRepoRequired: () => void;
  onRetry: (record: API.BuildRecord) => void;
}

const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  pending: { color: 'processing', icon: <LoadingOutlined /> },
  building: { color: 'processing', icon: <LoadingOutlined /> },
  completed: { color: 'success', icon: <CheckCircleOutlined /> },
  failed: { color: 'error', icon: <WarningOutlined /> },
  cancelled: { color: 'warning', icon: <WarningOutlined /> },
};

const BuildList: React.FC<BuildListProps> = ({
  actionRef,
  bindStatus,
  onUnbind,
  onCreate,
  onRepoRequired,
  onRetry,
}) => {
  const intl = useIntl();
  const { message: msgApi } = App.useApp();
  const pollRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const [downloadLoading, setDownloadLoading] = React.useState<Set<string>>(
    new Set(),
  );

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: intl.formatMessage({
        id: 'pages.nexus.statusPending',
        defaultMessage: 'Build Pending',
      }),
      building: intl.formatMessage({
        id: 'pages.nexus.statusBuilding',
        defaultMessage: 'Building',
      }),
      completed: intl.formatMessage({
        id: 'pages.nexus.statusCompleted',
        defaultMessage: 'Build Completed',
      }),
      failed: intl.formatMessage({
        id: 'pages.nexus.statusFailed',
        defaultMessage: 'Build Failed',
      }),
      cancelled: intl.formatMessage({
        id: 'pages.nexus.statusCancelled',
        defaultMessage: 'Build Cancelled',
      }),
    };
    return map[status] || status;
  };

  const managePolling = (records: API.BuildRecord[]) => {
    const hasPending = records.some(
      (r) => r.status === 'pending' || r.status === 'building',
    );
    if (hasPending && !pollRef.current) {
      pollRef.current = setInterval(() => {
        actionRef.current?.reload();
      }, 5000);
    } else if (!hasPending && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  React.useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleDelete = async (uuid: string) => {
    try {
      await deleteBuild(uuid);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.nexus.deleteSuccess',
          defaultMessage: 'Build record deleted',
        }),
      );
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.nexus.deleteFailed',
          defaultMessage: 'Failed to delete build record',
        }),
      );
    }
  };

  const handleDownload = async (uuid: string, filename: string) => {
    setDownloadLoading((prev) => new Set(prev).add(uuid));
    try {
      const blob = await downloadBuildFile(uuid, filename);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.nexus.downloadFailed',
          defaultMessage: 'Failed to download custom client',
        }),
      );
    } finally {
      setDownloadLoading((prev) => {
        const next = new Set(prev);
        next.delete(uuid);
        return next;
      });
    }
  };

  const columns: ProColumns<API.BuildRecord>[] = [
    {
      title: intl.formatMessage({
        id: 'pages.nexus.uuid',
        defaultMessage: 'UUID',
      }),
      dataIndex: 'uuid',
      key: 'uuid',
      ellipsis: true,
    },
    {
      title: intl.formatMessage({
        id: 'pages.nexus.appName',
        defaultMessage: 'Application Name',
      }),
      dataIndex: 'appName',
      key: 'appName',
      ellipsis: true,
      render: (dom: React.ReactNode) => dom || '-',
    },
    {
      title: intl.formatMessage({ id: 'pages.nexus.os', defaultMessage: 'OS' }),
      dataIndex: 'os',
      key: 'os',
      width: 80,
    },
    {
      title: intl.formatMessage({
        id: 'pages.nexus.arch',
        defaultMessage: 'Arch',
      }),
      dataIndex: 'arch',
      key: 'arch',
      width: 90,
    },
    {
      title: intl.formatMessage({
        id: 'pages.nexus.status',
        defaultMessage: 'Status',
      }),
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (_: React.ReactNode, record: API.BuildRecord) => {
        const config = statusConfig[record.status] || {
          color: 'default',
          icon: null,
        };
        return (
          <Tag color={config.color} icon={config.icon}>
            {statusLabel(record.status)}
          </Tag>
        );
      },
    },
    {
      title: intl.formatMessage({
        id: 'pages.customClients.createdAt',
        defaultMessage: 'Created At',
      }),
      dataIndex: 'createdAt',
      key: 'createdAt',
      ellipsis: true,
      render: (_: React.ReactNode, record: API.BuildRecord) =>
        record.createdAt ? new Date(record.createdAt).toLocaleString() : '-',
    },
    {
      title: intl.formatMessage({
        id: 'pages.common.action',
        defaultMessage: 'Action',
      }),
      key: 'action',
      width: 200,
      search: false,
      render: (_: any, record: API.BuildRecord) => {
        const isDownloading = downloadLoading.has(record.uuid);
        const files: string[] = record.files ? JSON.parse(record.files) : [];

        return (
          <Space size={0} split={<span style={{ color: '#d9d9d9' }}>|</span>}>
            {record.status === 'failed' && (
              <Button
                type="link"
                size="small"
                icon={<RedoOutlined />}
                onClick={() => onRetry(record)}
              >
                <FormattedMessage
                  id="pages.nexus.retryBuild"
                  defaultMessage="Retry"
                />
              </Button>
            )}
            {record.status === 'completed' &&
              files.map((file) => (
                <Button
                  key={file}
                  type="link"
                  size="small"
                  icon={
                    isDownloading ? (
                      <LoadingOutlined />
                    ) : (
                      <CloudDownloadOutlined />
                    )
                  }
                  loading={isDownloading}
                  onClick={() => handleDownload(record.uuid, file)}
                >
                  {file}
                </Button>
              ))}
            {(record.status === 'failed' ||
              record.status === 'cancelled' ||
              record.status === 'completed') && (
              <Popconfirm
                title={intl.formatMessage({
                  id: 'pages.nexus.deleteBuildConfirm',
                  defaultMessage:
                    'Are you sure you want to delete this build record?',
                })}
                onConfirm={() => handleDelete(record.uuid)}
                okText={intl.formatMessage({
                  id: 'pages.common.confirm',
                  defaultMessage: 'Yes',
                })}
                cancelText={intl.formatMessage({
                  id: 'pages.common.cancel',
                  defaultMessage: 'No',
                })}
              >
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                >
                  <FormattedMessage
                    id="pages.common.delete"
                    defaultMessage="Delete"
                  />
                </Button>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <ProTable<API.BuildRecord>
      headerTitle={
        <Space>
          <Title level={5} style={{ margin: 0 }}>
            <FormattedMessage
              id="pages.nexus.buildList"
              defaultMessage="Build History"
            />
          </Title>
          {bindStatus?.bound && (
            <Text type="secondary">
              <GithubOutlined /> {bindStatus.nexus_username}
            </Text>
          )}
        </Space>
      }
      columnsState={{
        persistenceType: 'localStorage',
        persistenceKey: 'build_list_columns_state',
      }}
      actionRef={actionRef}
      rowKey="uuid"
      search={false}
      columns={columns}
      pagination={{
        defaultPageSize: 20,
        showSizeChanger: true,
        showQuickJumper: true,
      }}
      scroll={{ x: 'max-content' }}
      options={{
        density: true,
        setting: { listsHeight: 400 },
        fullScreen: false,
        reload: true,
      }}
      toolBarRender={() => [
        <Button key="unbind" size="small" danger onClick={onUnbind}>
          <FormattedMessage id="pages.nexus.unbind" defaultMessage="Unbind" />
        </Button>,
        <Button
          key="create"
          type="primary"
          icon={<PlusOutlined />}
          onClick={onCreate}
        >
          <FormattedMessage
            id="pages.nexus.createBuild"
            defaultMessage="Create New Client"
          />
        </Button>,
      ]}
      request={async () => {
        try {
          const records = await getBuildList();
          managePolling(records);
          return {
            data: records,
            success: true,
          };
        } catch (error: any) {
          if (error?.response?.status === 403) {
            onRepoRequired();
          }
          return {
            data: [],
            success: false,
          };
        }
      }}
    />
  );
};

export default BuildList;
