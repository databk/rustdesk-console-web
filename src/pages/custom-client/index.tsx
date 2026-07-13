import {
  CheckCircleOutlined,
  CloudDownloadOutlined,
  DeleteOutlined,
  GithubOutlined,
  LoadingOutlined,
  PlusOutlined,
  ReloadOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import {
  App,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Radio,
  Result,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  createNexusLogin,
  deleteBuild,
  downloadBuildFile,
  getBuildList,
  getBuildStatus,
  getNexusBindStatus,
  pollNexusLoginStatus,
  submitBuild,
  unbindNexus,
} from '@/services/rustdesk-console/nexus';

const { Text, Paragraph, Title } = Typography;

type PageState = 'loading' | 'bind' | 'tokenExpired' | 'repoRequired' | 'ready';

const CONN_TYPE_OPTIONS = [
  { value: 'both', label: 'Both' },
  { value: 'incoming', label: 'Incoming' },
  { value: 'outgoing', label: 'Outgoing' },
];

const DISABLE_OPTIONS = [
  { value: 'N', label: 'No' },
  { value: 'Y', label: 'Yes' },
];

const ARCH_OPTIONS = [
  { value: 'x64', label: 'x64 (x86_64)' },
  { value: 'arm64', label: 'arm64 (aarch64)' },
  { value: 'x86', label: 'x86 (32-bit)' },
];

const SERVER_FIELDS = [
  { key: 'custom-rendezvous-server', labelKey: 'pages.nexus.rendezvousServer' },
  { key: 'relay-server', labelKey: 'pages.nexus.relayServer' },
  { key: 'key', labelKey: 'pages.nexus.key' },
  { key: 'api-server', labelKey: 'pages.nexus.apiServer' },
] as const;

const CustomClientPage: React.FC = () => {
  const intl = useIntl();
  const { message: msgApi, modal } = App.useApp();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [bindStatus, setBindStatus] = useState<API.NexusBindStatus | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [buildRecords, setBuildRecords] = useState<API.BuildRecord[]>([]);
  const [buildListLoading, setBuildListLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [buildLoading, setBuildLoading] = useState(false);
  const [pollingRecords, setPollingRecords] = useState<Set<string>>(new Set());
  const [downloadLoading, setDownloadLoading] = useState<Set<string>>(new Set());

  const [form] = Form.useForm();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const buildPollRefs = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  const fetchBindStatus = useCallback(async () => {
    try {
      setPageState('loading');
      const status = await getNexusBindStatus();
      setBindStatus(status);
      if (!status.bound) {
        setPageState('bind');
      } else if (status.expired) {
        setPageState('tokenExpired');
      } else {
        await fetchBuildList();
      }
    } catch {
      setPageState('bind');
    }
  }, []);

  const fetchBuildList = useCallback(async () => {
    try {
      setBuildListLoading(true);
      const records = await getBuildList();
      setBuildRecords(records);
      setPageState('ready');

      // Start polling for records that are still in progress
      records.forEach((r) => {
        if (r.status === 'pending' || r.status === 'building') {
          startPollingBuild(r.requestId);
        }
      });
    } catch (error: any) {
      if (error?.response?.status === 403) {
        setPageState('repoRequired');
      } else {
        setPageState('ready');
      }
    } finally {
      setBuildListLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBindStatus();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      buildPollRefs.current.forEach((interval) => clearInterval(interval));
    };
  }, [fetchBindStatus]);

  const handleLogin = async () => {
    try {
      setLoginLoading(true);
      const result = await createNexusLogin();
      window.open(result.auth_url, '_blank');

      pollRef.current = setInterval(async () => {
        try {
          const status = await pollNexusLoginStatus(result.login_id);
          if (status.state === 'completed') {
            if (pollRef.current) clearInterval(pollRef.current);
            msgApi.success(
              intl.formatMessage({
                id: 'pages.nexus.bindSuccess',
                defaultMessage: 'Nexus account bound successfully',
              }),
            );
            await fetchBindStatus();
          } else if (status.state === 'failed') {
            if (pollRef.current) clearInterval(pollRef.current);
            msgApi.error(
              status.error ||
                intl.formatMessage({
                  id: 'pages.nexus.bindFailed',
                  defaultMessage: 'Failed to bind Nexus account',
                }),
            );
            setLoginLoading(false);
          }
        } catch {
          if (pollRef.current) clearInterval(pollRef.current);
          setLoginLoading(false);
        }
      }, 3000);
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.nexus.createLoginFailed',
          defaultMessage: 'Failed to create login session',
        }),
      );
      setLoginLoading(false);
    }
  };

  const handleUnbind = () => {
    modal.confirm({
      title: intl.formatMessage({
        id: 'pages.nexus.unbindConfirm',
        defaultMessage: 'Unbind Nexus Account',
      }),
      content: intl.formatMessage({
        id: 'pages.nexus.unbindConfirmContent',
        defaultMessage:
          'Are you sure you want to unbind your Nexus account? You will need to re-bind to generate custom clients.',
      }),
      onOk: async () => {
        try {
          await unbindNexus();
          msgApi.success(
            intl.formatMessage({
              id: 'pages.nexus.unbindSuccess',
              defaultMessage: 'Nexus account unbound',
            }),
          );
          await fetchBindStatus();
        } catch {
          msgApi.error(
            intl.formatMessage({
              id: 'pages.nexus.unbindFailed',
              defaultMessage: 'Failed to unbind Nexus account',
            }),
          );
        }
      },
    });
  };

  const startPollingBuild = (requestId: string) => {
    if (buildPollRefs.current.has(requestId)) return;
    setPollingRecords((prev) => new Set(prev).add(requestId));

    const interval = setInterval(async () => {
      try {
        const status = await getBuildStatus(requestId);
        setBuildRecords((prev) =>
          prev.map((r) =>
            r.requestId === requestId
              ? {
                  ...r,
                  status: status.status,
                  files: status.files ? JSON.stringify(status.files) : r.files,
                  message: status.message || r.message,
                }
              : r,
          ),
        );
        if (['completed', 'failed', 'cancelled'].includes(status.status)) {
          const ref = buildPollRefs.current.get(requestId);
          if (ref) clearInterval(ref);
          buildPollRefs.current.delete(requestId);
          setPollingRecords((prev) => {
            const next = new Set(prev);
            next.delete(requestId);
            return next;
          });
        }
      } catch {
        const ref = buildPollRefs.current.get(requestId);
        if (ref) clearInterval(ref);
        buildPollRefs.current.delete(requestId);
        setPollingRecords((prev) => {
          const next = new Set(prev);
          next.delete(requestId);
          return next;
        });
      }
    }, 5000);

    buildPollRefs.current.set(requestId, interval);
  };

  const handleCreate = async (values: Record<string, any>) => {
    try {
      setBuildLoading(true);

      const custom: API.BuildCustomConfig = {};

      // Basic custom fields
      if (values.password) custom.password = values.password;
      if (values.salt) custom.salt = values.salt;
      if (values['conn-type']) custom['conn-type'] = values['conn-type'];
      if (values['disable-installation']) custom['disable-installation'] = values['disable-installation'];
      if (values['disable-settings']) custom['disable-settings'] = values['disable-settings'];
      if (values['disable-account']) custom['disable-account'] = values['disable-account'];
      if (values['disable-ab']) custom['disable-ab'] = values['disable-ab'];
      if (values['disable-tcp-listen']) custom['disable-tcp-listen'] = values['disable-tcp-listen'];
      if (values['app-name']) custom['app-name'] = values['app-name'];

      // Server fields
      const overrideSettings: Record<string, string> = {};
      const defaultSettings: Record<string, string> = {};

      SERVER_FIELDS.forEach(({ key }) => {
        const value = values[key];
        const settingType = values[`${key}_type`];
        if (value) {
          if (settingType === 'override') {
            overrideSettings[key] = value;
          } else {
            defaultSettings[key] = value;
          }
        }
      });

      if (Object.keys(overrideSettings).length > 0) {
        custom['override-settings'] = overrideSettings;
      }
      if (Object.keys(defaultSettings).length > 0) {
        custom['default-settings'] = defaultSettings;
      }

      const result = await submitBuild({
        os: 'windows',
        arch: values.arch,
        custom,
      });

      msgApi.success(result.message || 'Build request submitted');

      setCreateModalOpen(false);
      form.resetFields();

      // Refresh build list
      await fetchBuildList();
    } catch (error: any) {
      const errMsg = error?.data?.message || error?.message || '';
      if (
        errMsg.includes('Star') ||
        errMsg.includes('Fork') ||
        errMsg.includes('Watch') ||
        error?.response?.status === 403
      ) {
        setPageState('repoRequired');
      } else if (
        errMsg.includes('进行中') ||
        errMsg.includes('ongoing') ||
        error?.response?.status === 409
      ) {
        msgApi.error(
          intl.formatMessage({
            id: 'pages.nexus.buildAlreadyRunning',
            defaultMessage: 'You already have a build in progress',
          }),
        );
      } else {
        msgApi.error(
          intl.formatMessage({
            id: 'pages.nexus.generateFailed',
            defaultMessage: 'Failed to submit build request',
          }),
        );
      }
    } finally {
      setBuildLoading(false);
    }
  };

  const handleDelete = async (requestId: string) => {
    try {
      await deleteBuild(requestId);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.nexus.deleteSuccess',
          defaultMessage: 'Build record deleted',
        }),
      );
      await fetchBuildList();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.nexus.deleteFailed',
          defaultMessage: 'Failed to delete build record',
        }),
      );
    }
  };

  const handleDownload = async (requestId: string, filename: string) => {
    setDownloadLoading((prev) => new Set(prev).add(requestId));
    try {
      const blob = await downloadBuildFile(requestId, filename);
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
        next.delete(requestId);
        return next;
      });
    }
  };

  const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
    pending: { color: 'processing', icon: <LoadingOutlined /> },
    building: { color: 'processing', icon: <LoadingOutlined /> },
    completed: { color: 'success', icon: <CheckCircleOutlined /> },
    failed: { color: 'error', icon: <WarningOutlined /> },
    cancelled: { color: 'warning', icon: <WarningOutlined /> },
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: intl.formatMessage({ id: 'pages.nexus.statusPending', defaultMessage: 'Build Pending' }),
      building: intl.formatMessage({ id: 'pages.nexus.statusBuilding', defaultMessage: 'Building' }),
      completed: intl.formatMessage({ id: 'pages.nexus.statusCompleted', defaultMessage: 'Build Completed' }),
      failed: intl.formatMessage({ id: 'pages.nexus.statusFailed', defaultMessage: 'Build Failed' }),
      cancelled: intl.formatMessage({ id: 'pages.nexus.statusCancelled', defaultMessage: 'Build Cancelled' }),
    };
    return map[status] || status;
  };

  // Render bind prompt (full page)
  const renderBindPrompt = () => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
      }}
    >
      <Result
        icon={<GithubOutlined style={{ color: '#24292e', fontSize: 72 }} />}
        title={intl.formatMessage({
          id: 'pages.nexus.bindTitle',
          defaultMessage: 'Bind Nexus Account',
        })}
        subTitle={intl.formatMessage({
          id: 'pages.nexus.bindDesc',
          defaultMessage:
            'You need to bind your GitHub account to generate custom clients. Click the button below to authorize via GitHub.',
        })}
        extra={
          <Button type="primary" size="large" icon={<GithubOutlined />} loading={loginLoading} onClick={handleLogin}>
            <FormattedMessage id="pages.nexus.bindGithub" defaultMessage="Authorize with GitHub" />
          </Button>
        }
      />
    </div>
  );

  // Render token expired prompt (full page)
  const renderTokenExpiredPrompt = () => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
      }}
    >
      <Result
        icon={<WarningOutlined style={{ color: '#faad14', fontSize: 72 }} />}
        title={intl.formatMessage({
          id: 'pages.nexus.tokenExpired',
          defaultMessage: 'Nexus Token Expired',
        })}
        subTitle={intl.formatMessage(
          {
            id: 'pages.nexus.tokenExpiredDesc',
            defaultMessage: 'Your Nexus token for {username} has expired. Please re-bind your account.',
          },
          { username: bindStatus?.nexus_username },
        )}
        extra={
          <Button type="primary" size="large" icon={<GithubOutlined />} loading={loginLoading} onClick={handleLogin}>
            <FormattedMessage id="pages.nexus.rebind" defaultMessage="Re-bind Nexus Account" />
          </Button>
        }
      />
    </div>
  );

  // Render repo required prompt (full page)
  const renderRepoRequiredPrompt = () => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
      }}
    >
      <Result
        icon={<GithubOutlined style={{ color: '#faad14', fontSize: 72 }} />}
        title={intl.formatMessage({
          id: 'pages.nexus.repoRequired',
          defaultMessage: 'Repository Interaction Required',
        })}
        subTitle={intl.formatMessage({
          id: 'pages.nexus.repoRequiredDesc',
          defaultMessage:
            'You need to Star, Fork or Watch the databk/rustdesk-console repository on GitHub before generating custom clients. It may take up to 5 minutes for the cache to refresh.',
        })}
        extra={
          <Space>
            <Button
              type="primary"
              size="large"
              icon={<GithubOutlined />}
              href="https://github.com/databk/rustdesk-console"
              target="_blank"
            >
              <FormattedMessage id="pages.nexus.goToRepo" defaultMessage="Go to GitHub Repository" />
            </Button>
            <Button size="large" icon={<ReloadOutlined />} onClick={fetchBindStatus}>
              <FormattedMessage id="pages.nexus.buildAgain" defaultMessage="Refresh" />
            </Button>
          </Space>
        }
      />
    </div>
  );

  // Render build list
  const renderBuildList = () => {
    const columns = [
      {
        title: intl.formatMessage({ id: 'pages.nexus.requestId', defaultMessage: 'Request ID' }),
        dataIndex: 'requestId',
        key: 'requestId',
        ellipsis: true,
        width: 200,
      },
      {
        title: intl.formatMessage({ id: 'pages.nexus.appName', defaultMessage: 'Application Name' }),
        dataIndex: 'appName',
        key: 'appName',
        width: 150,
        render: (text: string) => text || '-',
      },
      {
        title: intl.formatMessage({ id: 'pages.nexus.os', defaultMessage: 'OS' }),
        dataIndex: 'os',
        key: 'os',
        width: 100,
      },
      {
        title: intl.formatMessage({ id: 'pages.nexus.arch', defaultMessage: 'Arch' }),
        dataIndex: 'arch',
        key: 'arch',
        width: 100,
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        width: 160,
        render: (status: string) => {
          const config = statusConfig[status] || { color: 'default', icon: null };
          return (
            <Tag color={config.color} icon={config.icon}>
              {statusLabel(status)}
            </Tag>
          );
        },
      },
      {
        title: 'Message',
        dataIndex: 'message',
        key: 'message',
        ellipsis: true,
        width: 200,
        render: (text: string | null) => text || '-',
      },
      {
        title: intl.formatMessage({ id: 'pages.customClients.createdAt', defaultMessage: 'Created At' }),
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 180,
        render: (text: string) => (text ? new Date(text).toLocaleString() : '-'),
      },
      {
        title: intl.formatMessage({ id: 'pages.common.action', defaultMessage: 'Action' }),
        key: 'action',
        width: 250,
        render: (_: any, record: API.BuildRecord) => {
          const isPolling = pollingRecords.has(record.requestId);
          const isDownloading = downloadLoading.has(record.requestId);
          const files: string[] = record.files ? JSON.parse(record.files) : [];

          return (
            <Space size={0} split={<span style={{ color: '#d9d9d9' }}>|</span>}>
              {isPolling && (
                <Button type="link" size="small" disabled>
                  <LoadingOutlined />{' '}
                  {intl.formatMessage({
                    id: 'pages.nexus.pollingBuildStatus',
                    defaultMessage: 'Polling...',
                  })}
                </Button>
              )}
              {record.status === 'completed' &&
                files.map((file) => (
                  <Button
                    key={file}
                    type="link"
                    size="small"
                    icon={isDownloading ? <LoadingOutlined /> : <CloudDownloadOutlined />}
                    loading={isDownloading}
                    onClick={() => handleDownload(record.requestId, file)}
                  >
                    {file}
                  </Button>
                ))}
              {(record.status === 'failed' || record.status === 'cancelled' || record.status === 'completed') && (
                <Popconfirm
                  title={intl.formatMessage({
                    id: 'pages.nexus.deleteBuildConfirm',
                    defaultMessage: 'Delete this build record?',
                  })}
                  onConfirm={() => handleDelete(record.requestId)}
                  okText={intl.formatMessage({ id: 'pages.common.confirm', defaultMessage: 'Yes' })}
                  cancelText={intl.formatMessage({ id: 'pages.common.cancel', defaultMessage: 'No' })}
                >
                  <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                    <FormattedMessage id="pages.common.delete" defaultMessage="Delete" />
                  </Button>
                </Popconfirm>
              )}
            </Space>
          );
        },
      },
    ];

    return (
      <>
        <Card
          style={{ marginBottom: 16 }}
          styles={{ body: { padding: '12px 24px' } }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <Title level={5} style={{ margin: 0 }}>
                <FormattedMessage id="pages.nexus.buildList" defaultMessage="Build History" />
              </Title>
              {bindStatus?.bound && (
                <Text type="secondary">
                  <GithubOutlined /> {bindStatus.nexus_username}
                </Text>
              )}
            </Space>
            <Space>
              <Button size="small" danger onClick={handleUnbind}>
                <FormattedMessage id="pages.nexus.unbind" defaultMessage="Unbind" />
              </Button>
              <Button icon={<ReloadOutlined />} onClick={fetchBuildList} loading={buildListLoading}>
                <FormattedMessage id="pages.nexus.buildAgain" defaultMessage="Refresh" />
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
                <FormattedMessage id="pages.nexus.createBuild" defaultMessage="Create New Client" />
              </Button>
            </Space>
          </div>
        </Card>

        <Card>
          <Table
            dataSource={buildRecords}
            columns={columns}
            rowKey="requestId"
            loading={buildListLoading}
            locale={{
              emptyText: intl.formatMessage({
                id: 'pages.nexus.noBuilds',
                defaultMessage: 'No build records',
              }),
            }}
            pagination={{ pageSize: 20, showSizeChanger: true, showQuickJumper: true }}
            scroll={{ x: 1200 }}
          />
        </Card>
      </>
    );
  };

  // Render create modal
  const renderCreateModal = () => (
    <Modal
      title={intl.formatMessage({
        id: 'pages.nexus.createBuildTitle',
        defaultMessage: 'Create Custom Client',
      })}
      open={createModalOpen}
      onCancel={() => {
        setCreateModalOpen(false);
        form.resetFields();
      }}
      onOk={() => form.submit()}
      confirmLoading={buildLoading}
      width={720}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleCreate}
        initialValues={{
          arch: 'x64',
          'conn-type': 'both',
        }}
        style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: 8 }}
      >
        <Title level={5} style={{ marginTop: 0 }}>
          <FormattedMessage id="pages.nexus.os" defaultMessage="Operating System" /> &{' '}
          <FormattedMessage id="pages.nexus.arch" defaultMessage="Architecture" />
        </Title>

        <Form.Item label={intl.formatMessage({ id: 'pages.nexus.os', defaultMessage: 'Operating System' })}>
          <Select value="windows" disabled options={[{ value: 'windows', label: 'Windows' }]} />
        </Form.Item>

        <Form.Item
          name="arch"
          label={intl.formatMessage({ id: 'pages.nexus.arch', defaultMessage: 'Architecture' })}
          rules={[{ required: true }]}
        >
          <Select options={ARCH_OPTIONS} />
        </Form.Item>

        <Form.Item
          name="app-name"
          label={intl.formatMessage({ id: 'pages.nexus.appName', defaultMessage: 'Application Name' })}
          rules={[
            {
              pattern: /^[a-zA-Z]+$/,
              message: intl.formatMessage({
                id: 'pages.nexus.appNameHint',
                defaultMessage: 'Only English letters allowed',
              }),
            },
          ]}
        >
          <Input
            placeholder={intl.formatMessage({
              id: 'pages.nexus.appNamePlaceholder',
              defaultMessage: 'e.g. my-rustdesk',
            })}
          />
        </Form.Item>

        <Title level={5}>
          <FormattedMessage id="pages.nexus.customConfig" defaultMessage="Custom Configuration" />
        </Title>

        <Form.Item
          name="password"
          label={intl.formatMessage({ id: 'pages.nexus.password', defaultMessage: 'Password' })}
        >
          <Input.Password
            placeholder={intl.formatMessage({
              id: 'pages.nexus.passwordPlaceholder',
              defaultMessage: 'Enter password',
            })}
          />
        </Form.Item>

        <Form.Item
          name="salt"
          label={intl.formatMessage({ id: 'pages.nexus.salt', defaultMessage: 'Salt' })}
        >
          <Input
            placeholder={intl.formatMessage({
              id: 'pages.nexus.saltPlaceholder',
              defaultMessage: 'Enter salt',
            })}
          />
        </Form.Item>

        <Form.Item
          name="conn-type"
          label={intl.formatMessage({ id: 'pages.nexus.connType', defaultMessage: 'Connection Type' })}
        >
          <Select options={CONN_TYPE_OPTIONS} allowClear />
        </Form.Item>

        <Form.Item
          name="disable-installation"
          label={intl.formatMessage({
            id: 'pages.nexus.disableInstallation',
            defaultMessage: 'Disable Installation',
          })}
        >
          <Select options={DISABLE_OPTIONS} allowClear />
        </Form.Item>

        <Form.Item
          name="disable-settings"
          label={intl.formatMessage({
            id: 'pages.nexus.disableSettings',
            defaultMessage: 'Disable Settings',
          })}
        >
          <Select options={DISABLE_OPTIONS} allowClear />
        </Form.Item>

        <Form.Item
          name="disable-account"
          label={intl.formatMessage({
            id: 'pages.nexus.disableAccount',
            defaultMessage: 'Disable Account',
          })}
        >
          <Select options={DISABLE_OPTIONS} allowClear />
        </Form.Item>

        <Form.Item
          name="disable-ab"
          label={intl.formatMessage({
            id: 'pages.nexus.disableAb',
            defaultMessage: 'Disable AB',
          })}
        >
          <Select options={DISABLE_OPTIONS} allowClear />
        </Form.Item>

        <Form.Item
          name="disable-tcp-listen"
          label={intl.formatMessage({
            id: 'pages.nexus.disableTcpListen',
            defaultMessage: 'Disable TCP Listen',
          })}
        >
          <Select options={DISABLE_OPTIONS} allowClear />
        </Form.Item>

        <Title level={5} style={{ marginTop: 24 }}>
          <FormattedMessage id="pages.nexus.serverConfig" defaultMessage="Server Configuration" />
        </Title>
        <Paragraph type="secondary">
          <FormattedMessage
            id="pages.nexus.monthlyLimit"
            defaultMessage="Monthly build limit: 15 per user. Concurrent builds: 1."
          />
        </Paragraph>

        {SERVER_FIELDS.map(({ key, labelKey }) => (
          <div key={key} style={{ marginBottom: 16 }}>
            <Form.Item
              name={key}
              label={intl.formatMessage({ id: labelKey, defaultMessage: key })}
              style={{ marginBottom: 4 }}
            >
              <Input placeholder={intl.formatMessage({ id: labelKey, defaultMessage: key })} />
            </Form.Item>
            <Form.Item
              name={`${key}_type`}
              initialValue="override"
              style={{ marginBottom: 0 }}
            >
              <Radio.Group
                optionType="button"
                size="small"
                options={[
                  {
                    value: 'override',
                    label: intl.formatMessage({
                      id: 'pages.nexus.overrideSettings',
                      defaultMessage: 'Override Settings',
                    }),
                  },
                  {
                    value: 'default',
                    label: intl.formatMessage({
                      id: 'pages.nexus.defaultSettings',
                      defaultMessage: 'Default Settings',
                    }),
                  },
                ]}
              />
            </Form.Item>
          </div>
        ))}
      </Form>
    </Modal>
  );

  // Loading state
  if (pageState === 'loading') {
    return (
      <PageContainer>
        <div style={{ textAlign: 'center', padding: 80 }}>
          <LoadingOutlined style={{ fontSize: 48, color: '#1890ff' }} />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {pageState === 'bind' && renderBindPrompt()}
      {pageState === 'tokenExpired' && renderTokenExpiredPrompt()}
      {pageState === 'repoRequired' && renderRepoRequiredPrompt()}
      {pageState === 'ready' && renderBuildList()}
      {renderCreateModal()}
    </PageContainer>
  );
};

export default CustomClientPage;