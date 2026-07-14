import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { App } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  createNexusLogin,
  getBuildList,
  getNexusBindStatus,
  pollNexusLoginStatus,
  submitBuild,
  unbindNexus,
} from '@/services/rustdesk-console/nexus';
import { SERVER_FIELDS, type PageState } from './constants';
import BindPrompt from './components/BindPrompt';
import TokenExpiredPrompt from './components/TokenExpiredPrompt';
import RepoRequiredPrompt from './components/RepoRequiredPrompt';
import BuildList from './components/BuildList';
import CreateBuildModal from './components/CreateBuildModal';

const CustomClientPage: React.FC = () => {
  const intl = useIntl();
  const { message: msgApi, modal } = App.useApp();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [bindStatus, setBindStatus] = useState<API.NexusBindStatus | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [buildLoading, setBuildLoading] = useState(false);
  const [buildAgainLoading, setBuildAgainLoading] = useState(false);
  const [pendingBuildConfig, setPendingBuildConfig] = useState<Record<string, any> | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
        try {
          await getBuildList();
          setPageState('ready');
        } catch (error: any) {
          if (error?.response?.status === 403) {
            setPageState('repoRequired');
          } else {
            setPageState('ready');
          }
        }
      }
    } catch {
      setPageState('bind');
    }
  }, []);

  useEffect(() => {
    fetchBindStatus();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
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
            setLoginLoading(false);
            msgApi.success(
              intl.formatMessage({
                id: 'pages.nexus.bindSuccess',
                defaultMessage: 'Nexus account bound successfully',
              }),
            );
            await fetchBindStatus();
          } else if (status.state === 'failed') {
            if (pollRef.current) clearInterval(pollRef.current);
            setLoginLoading(false);
            msgApi.error(
              status.error ||
                intl.formatMessage({
                  id: 'pages.nexus.bindFailed',
                  defaultMessage: 'Failed to bind Nexus account',
                }),
            );
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

  const buildCustomConfig = (values: Record<string, any>): API.BuildCustomConfig => {
    const custom: API.BuildCustomConfig = {};

    if (values.password) custom.password = values.password;
    if (values.salt) custom.salt = values.salt;
    if (values['conn-type']) custom['conn-type'] = values['conn-type'];
    if (values['disable-installation'] === 'Y') custom['disable-installation'] = values['disable-installation'];
    if (values['disable-settings'] === 'Y') custom['disable-settings'] = values['disable-settings'];
    if (values['disable-account'] === 'Y') custom['disable-account'] = values['disable-account'];
    if (values['disable-ab'] === 'Y') custom['disable-ab'] = values['disable-ab'];
    if (values['disable-tcp-listen'] === 'Y') custom['disable-tcp-listen'] = values['disable-tcp-listen'];
    if (values['app-name']) custom['app-name'] = values['app-name'];

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

    return custom;
  };

  const isRepoRequiredError = (error: any): boolean => {
    const errMsg = error?.data?.message || error?.message || '';
    return (
      errMsg.includes('Star') ||
      errMsg.includes('Fork') ||
      errMsg.includes('Watch') ||
      error?.response?.status === 403
    );
  };

  const handleCreate = async (values: Record<string, any>) => {
    try {
      setBuildLoading(true);

      const custom = buildCustomConfig(values);
      const result = await submitBuild({
        os: 'windows',
        arch: values.arch,
        custom,
      });

      msgApi.success(result.message || 'Build request submitted');

      setCreateModalOpen(false);
      setPendingBuildConfig(null);
      setPageState('ready');
    } catch (error: any) {
      if (isRepoRequiredError(error)) {
        setCreateModalOpen(false);
        setPendingBuildConfig(values);
        setPageState('repoRequired');
      } else if (
        error?.data?.message?.includes('进行中') ||
        error?.data?.message?.includes('ongoing') ||
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

  const handleBuildAgain = async () => {
    if (pendingBuildConfig) {
      try {
        setBuildAgainLoading(true);

        const custom = buildCustomConfig(pendingBuildConfig);
        const result = await submitBuild({
          os: 'windows',
          arch: pendingBuildConfig.arch,
          custom,
        });

        msgApi.success(result.message || 'Build request submitted');
        setPendingBuildConfig(null);
        setPageState('ready');
      } catch (error: any) {
        if (isRepoRequiredError(error)) {
          msgApi.warning(
            intl.formatMessage({
              id: 'pages.nexus.repoInteractionRequired',
              defaultMessage:
                'Please Star, Fork or Watch the databk/rustdesk-console repository on GitHub first. It may take up to 5 minutes for the cache to refresh.',
            }),
          );
        } else if (
          error?.data?.message?.includes('进行中') ||
          error?.data?.message?.includes('ongoing') ||
          error?.response?.status === 409
        ) {
          msgApi.error(
            intl.formatMessage({
              id: 'pages.nexus.buildAlreadyRunning',
              defaultMessage: 'You already have a build in progress',
            }),
          );
          setPendingBuildConfig(null);
          setPageState('ready');
        } else {
          msgApi.error(
            intl.formatMessage({
              id: 'pages.nexus.generateFailed',
              defaultMessage: 'Failed to submit build request',
            }),
          );
          setPendingBuildConfig(null);
          setPageState('ready');
        }
      } finally {
        setBuildAgainLoading(false);
      }
    } else {
      await fetchBindStatus();
    }
  };

  const handleCancelCreate = () => {
    setCreateModalOpen(false);
    setPendingBuildConfig(null);
  };

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
      {pageState === 'bind' && (
        <BindPrompt loginLoading={loginLoading} onLogin={handleLogin} />
      )}
      {pageState === 'tokenExpired' && (
        <TokenExpiredPrompt
          username={bindStatus?.nexus_username}
          loginLoading={loginLoading}
          onLogin={handleLogin}
        />
      )}
      {pageState === 'repoRequired' && (
        <RepoRequiredPrompt
          buildAgainLoading={buildAgainLoading}
          onBuildAgain={handleBuildAgain}
        />
      )}
      {pageState === 'ready' && (
        <BuildList
          bindStatus={bindStatus}
          onUnbind={handleUnbind}
          onCreate={() => setCreateModalOpen(true)}
          onRepoRequired={() => setPageState('repoRequired')}
        />
      )}
      <CreateBuildModal
        open={createModalOpen}
        loading={buildLoading}
        onCancel={handleCancelCreate}
        onSubmit={handleCreate}
      />
    </PageContainer>
  );
};

export default CustomClientPage;
