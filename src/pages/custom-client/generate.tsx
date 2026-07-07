import {
  CheckCircleOutlined,
  CloudDownloadOutlined,
  GithubOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  LoadingOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { App, Button, Card, Form, Input, Result, Select, Space, Steps, Typography, Alert } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  createNexusLogin,
  downloadCustomClientBuild,
  generateCustomClientBuild,
  getClientBuildStatus,
  getNexusBindStatus,
  pollNexusLoginStatus,
  unbindNexus,
} from '@/services/rustdesk-console/nexus';

const { Text, Paragraph } = Typography;

type PageStep = 'bind' | 'build' | 'status';

const CustomClientGenerate: React.FC = () => {
  const intl = useIntl();
  const { message: msgApi, modal } = App.useApp();

  const [currentStep, setCurrentStep] = useState<PageStep>('bind');
  const [bindStatus, setBindStatus] = useState<API.NexusBindStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [buildLoading, setBuildLoading] = useState(false);
  const [buildStatus, setBuildStatus] = useState<API.ClientBuildStatus | null>(null);
  const [form] = Form.useForm();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const buildPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchBindStatus = useCallback(async () => {
    try {
      setLoading(true);
      const status = await getNexusBindStatus();
      setBindStatus(status);
      if (status.bound) {
        setCurrentStep('build');
      } else {
        setCurrentStep('bind');
      }
    } catch {
      setCurrentStep('bind');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBindStatus();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (buildPollRef.current) clearInterval(buildPollRef.current);
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
        defaultMessage: 'Are you sure you want to unbind your Nexus account? You will need to re-bind to generate custom clients.',
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

  const handleGenerate = async (values: API.GenerateClientParams) => {
    try {
      setBuildLoading(true);
      const result = await generateCustomClientBuild(values);
      setBuildStatus({
        request_id: result.request_id,
        status: 'pending',
      });
      setCurrentStep('status');
      startBuildPolling();
    } catch (error: any) {
      const errMsg = error?.data?.message || error?.message || '';
      if (errMsg.includes('Star') || errMsg.includes('Fork') || errMsg.includes('Watch') || error?.response?.status === 403) {
        msgApi.error({
          content: intl.formatMessage({
            id: 'pages.nexus.repoInteractionRequired',
            defaultMessage: 'Please Star, Fork or Watch the databk/rustdesk-console repository on GitHub first. It may take up to 5 minutes for the cache to refresh.',
          }),
          duration: 8,
        });
      } else if (errMsg.includes('进行中') || errMsg.includes('ongoing') || error?.response?.status === 409) {
        msgApi.error(
          intl.formatMessage({
            id: 'pages.nexus.buildAlreadyRunning',
            defaultMessage: 'You already have a build in progress',
          }),
        );
        // Check current build status
        try {
          const status = await getClientBuildStatus();
          setBuildStatus(status);
          setCurrentStep('status');
          startBuildPolling();
        } catch {
          // ignore
        }
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

  const startBuildPolling = () => {
    buildPollRef.current = setInterval(async () => {
      try {
        const status = await getClientBuildStatus();
        setBuildStatus(status);
        if (['completed', 'failed', 'cancelled'].includes(status.status)) {
          if (buildPollRef.current) clearInterval(buildPollRef.current);
        }
      } catch {
        if (buildPollRef.current) clearInterval(buildPollRef.current);
      }
    }, 5000);
  };

  const handleDownload = async () => {
    if (!buildStatus?.request_id) return;
    try {
      const blob = await downloadCustomClientBuild(buildStatus.request_id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `custom-client.zip`);
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
    }
  };

  const handleReset = () => {
    setBuildStatus(null);
    setCurrentStep('build');
    form.resetFields();
  };

  // Render bind section
  const renderBindSection = () => {
    if (bindStatus?.expired) {
      return (
        <Result
          icon={<WarningOutlined style={{ color: '#faad14' }} />}
          title={intl.formatMessage({
            id: 'pages.nexus.tokenExpired',
            defaultMessage: 'Nexus Token Expired',
          })}
          subTitle={intl.formatMessage(
            {
              id: 'pages.nexus.tokenExpiredDesc',
              defaultMessage: 'Your Nexus token for {username} has expired. Please re-bind your account.',
            },
            { username: bindStatus.nexus_username },
          )}
          extra={
            <Button type="primary" icon={<GithubOutlined />} loading={loginLoading} onClick={handleLogin}>
              <FormattedMessage id="pages.nexus.rebind" defaultMessage="Re-bind Nexus Account" />
            </Button>
          }
        />
      );
    }

    return (
      <Result
        icon={<GithubOutlined style={{ color: '#24292e' }} />}
        title={intl.formatMessage({
          id: 'pages.nexus.bindTitle',
          defaultMessage: 'Bind Nexus Account',
        })}
        subTitle={intl.formatMessage({
          id: 'pages.nexus.bindDesc',
          defaultMessage: 'You need to bind your GitHub account to generate custom clients. Click the button below to authorize via GitHub.',
        })}
        extra={
          <Button type="primary" icon={<GithubOutlined />} loading={loginLoading} onClick={handleLogin}>
            <FormattedMessage id="pages.nexus.bindGithub" defaultMessage="Authorize with GitHub" />
          </Button>
        }
      />
    );
  };

  // Render build form
  const renderBuildForm = () => (
    <Card
      title={intl.formatMessage({
        id: 'pages.nexus.generateTitle',
        defaultMessage: 'Generate Custom Client',
      })}
      extra={
        bindStatus?.bound && (
          <Space>
            <Text type="secondary">
              <GithubOutlined /> {bindStatus.nexus_username}
            </Text>
            <Button size="small" danger onClick={handleUnbind}>
              <FormattedMessage id="pages.nexus.unbind" defaultMessage="Unbind" />
            </Button>
          </Space>
        )
      }
    >
      <Alert
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        message={intl.formatMessage({
          id: 'pages.nexus.generateNotice',
          defaultMessage: 'You need to Star, Fork or Watch the databk/rustdesk-console repository on GitHub before generating. Each user is limited to 15 builds per month.',
        })}
        style={{ marginBottom: 24 }}
        action={
          <Button
            size="small"
            type="link"
            icon={<LinkOutlined />}
            href="https://github.com/databk/rustdesk-console"
            target="_blank"
          >
            GitHub
          </Button>
        }
      />
      <Form
        form={form}
        layout="vertical"
        onFinish={handleGenerate}
        initialValues={{ os: 'windows', arch: 'x64' }}
        style={{ maxWidth: 480 }}
      >
        <Form.Item
          name="app_name"
          label={intl.formatMessage({
            id: 'pages.nexus.appName',
            defaultMessage: 'Application Name',
          })}
          rules={[{ required: true, message: intl.formatMessage({ id: 'pages.nexus.enterAppName', defaultMessage: 'Please enter application name' }) }]}
        >
          <Input
            placeholder={intl.formatMessage({
              id: 'pages.nexus.appNamePlaceholder',
              defaultMessage: 'e.g. my-rustdesk',
            })}
          />
        </Form.Item>
        <Form.Item
          name="os"
          label={intl.formatMessage({
            id: 'pages.nexus.os',
            defaultMessage: 'Operating System',
          })}
          rules={[{ required: true }]}
        >
          <Select
            options={[
              { value: 'windows', label: 'Windows' },
              { value: 'linux', label: 'Linux' },
              { value: 'macos', label: 'macOS' },
            ]}
          />
        </Form.Item>
        <Form.Item
          name="arch"
          label={intl.formatMessage({
            id: 'pages.nexus.arch',
            defaultMessage: 'Architecture',
          })}
          rules={[{ required: true }]}
        >
          <Select
            options={[
              { value: 'x64', label: 'x64' },
              { value: 'arm64', label: 'arm64' },
            ]}
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={buildLoading}>
            <FormattedMessage id="pages.nexus.submitBuild" defaultMessage="Submit Build" />
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );

  // Render build status
  const renderBuildStatus = () => {
    if (!buildStatus) return null;

    const statusConfig: Record<string, { icon: React.ReactNode; title: string; subTitle: string; color: string }> = {
      pending: {
        icon: <LoadingOutlined />,
        title: intl.formatMessage({ id: 'pages.nexus.statusPending', defaultMessage: 'Build Pending' }),
        subTitle: intl.formatMessage({ id: 'pages.nexus.statusPendingDesc', defaultMessage: 'Your build request has been submitted and is waiting to be processed...' }),
        color: '#1890ff',
      },
      building: {
        icon: <LoadingOutlined />,
        title: intl.formatMessage({ id: 'pages.nexus.statusBuilding', defaultMessage: 'Building' }),
        subTitle: intl.formatMessage({ id: 'pages.nexus.statusBuildingDesc', defaultMessage: 'GitHub Actions is building your custom client. This may take several minutes...' }),
        color: '#1890ff',
      },
      completed: {
        icon: <CheckCircleOutlined />,
        title: intl.formatMessage({ id: 'pages.nexus.statusCompleted', defaultMessage: 'Build Completed' }),
        subTitle: intl.formatMessage({ id: 'pages.nexus.statusCompletedDesc', defaultMessage: 'Your custom client is ready for download.' }),
        color: '#52c41a',
      },
      failed: {
        icon: <WarningOutlined />,
        title: intl.formatMessage({ id: 'pages.nexus.statusFailed', defaultMessage: 'Build Failed' }),
        subTitle: buildStatus.message || intl.formatMessage({ id: 'pages.nexus.statusFailedDesc', defaultMessage: 'The build process encountered an error.' }),
        color: '#ff4d4f',
      },
      cancelled: {
        icon: <WarningOutlined />,
        title: intl.formatMessage({ id: 'pages.nexus.statusCancelled', defaultMessage: 'Build Cancelled' }),
        subTitle: buildStatus.message || intl.formatMessage({ id: 'pages.nexus.statusCancelledDesc', defaultMessage: 'The build was cancelled, usually because you un-starred/un-forked the repository.' }),
        color: '#faad14',
      },
    };

    const config = statusConfig[buildStatus.status] || statusConfig.pending;
    const isTerminal = ['completed', 'failed', 'cancelled'].includes(buildStatus.status);

    return (
      <Card>
        <Result
          icon={<span style={{ fontSize: 72, color: config.color }}>{config.icon}</span>}
          title={config.title}
          subTitle={config.subTitle}
          extra={
            <Space>
              {buildStatus.status === 'completed' && (
                <Button type="primary" icon={<CloudDownloadOutlined />} onClick={handleDownload}>
                  <FormattedMessage id="pages.nexus.download" defaultMessage="Download" />
                </Button>
              )}
              {isTerminal && (
                <Button onClick={handleReset}>
                  <FormattedMessage id="pages.nexus.buildAgain" defaultMessage="Build Again" />
                </Button>
              )}
            </Space>
          }
        >
          <Paragraph type="secondary" style={{ textAlign: 'center' }}>
            Request ID: {buildStatus.request_id}
          </Paragraph>
        </Result>
      </Card>
    );
  };

  const stepsItems = [
    {
      title: intl.formatMessage({ id: 'pages.nexus.stepBind', defaultMessage: 'Bind Nexus' }),
    },
    {
      title: intl.formatMessage({ id: 'pages.nexus.stepBuild', defaultMessage: 'Build Client' }),
    },
    {
      title: intl.formatMessage({ id: 'pages.nexus.stepStatus', defaultMessage: 'Build Status' }),
    },
  ];

  const stepIndex = currentStep === 'bind' ? 0 : currentStep === 'build' ? 1 : 2;

  return (
    <PageContainer>
      <Steps current={stepIndex} items={stepsItems} style={{ marginBottom: 32 }} />
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <LoadingOutlined style={{ fontSize: 32 }} />
        </div>
      ) : (
        <>
          {currentStep === 'bind' && renderBindSection()}
          {currentStep === 'build' && renderBuildForm()}
          {currentStep === 'status' && renderBuildStatus()}
        </>
      )}
    </PageContainer>
  );
};

export default CustomClientGenerate;
