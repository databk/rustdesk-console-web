import type { ActionType } from '@ant-design/pro-components';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { App, Button, Result, Space, Tag } from 'antd';
import { LoadingOutlined, SettingOutlined } from '@ant-design/icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  getBuildList,
  getCustomClientSettings,
  submitBuild,
} from '@/services/rustdesk-console/custom-client';
import { SERVER_FIELDS } from './constants';
import BuildList from './components/BuildList';
import CreateBuildModal from './components/CreateBuildModal';
import ProgressModal from './components/ProgressModal';
import SettingsModal from './components/SettingsModal';

type PageState = 'loading' | 'settingsRequired' | 'loadFailed' | 'ready';

const CustomClientPage: React.FC = () => {
  const intl = useIntl();
  const { message: msgApi } = App.useApp();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [buildLoading, setBuildLoading] = useState(false);
  const [progressUuid, setProgressUuid] = useState<string | null>(null);

  const buildListActionRef = useRef<ActionType | null>(null);

  const checkSettings = useCallback(async () => {
    setPageState('loading');
    let settings: API.CustomClientSettings;
    try {
      settings = await getCustomClientSettings();
    } catch {
      setPageState('settingsRequired');
      return;
    }
    if (!settings.githubToken) {
      setPageState('settingsRequired');
      return;
    }
    try {
      await getBuildList();
      setPageState('ready');
    } catch {
      setPageState('loadFailed');
    }
  }, []);

  useEffect(() => {
    checkSettings();
  }, [checkSettings]);

  const buildCustomConfig = (
    values: Record<string, any>,
  ): API.CustomClientBuildCustom => {
    const custom: API.CustomClientBuildCustom = {};

    if (values.password) custom.password = values.password;
    if (values.salt) custom.salt = values.salt;
    if (values['conn-type']) custom['conn-type'] = values['conn-type'];
    if (values['disable-installation'] === 'Y')
      custom['disable-installation'] = values['disable-installation'];
    if (values['disable-settings'] === 'Y')
      custom['disable-settings'] = values['disable-settings'];
    if (values['disable-account'] === 'Y')
      custom['disable-account'] = values['disable-account'];
    if (values['disable-ab'] === 'Y')
      custom['disable-ab'] = values['disable-ab'];
    if (values['disable-tcp-listen'] === 'Y')
      custom['disable-tcp-listen'] = values['disable-tcp-listen'];
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

  const handleCreate = async (values: Record<string, any>) => {
    try {
      setBuildLoading(true);
      const custom = buildCustomConfig(values);
      const result = await submitBuild({
        os: values.os,
        arch: values.os === 'all' ? undefined : values.arch,
        custom,
      });
      msgApi.success(result.message || 'Build request submitted');
      setCreateModalOpen(false);
      setPageState('ready');
      buildListActionRef.current?.reload();
    } catch (error: any) {
      msgApi.error(
        error?.data?.message ||
          intl.formatMessage({
            id: 'pages.customClient.generateFailed',
            defaultMessage: 'Failed to submit build request',
          }),
      );
    } finally {
      setBuildLoading(false);
    }
  };

  const handleRetry = async (record: API.CustomClientBuild) => {
    try {
      const custom = record.custom ? JSON.parse(record.custom) : {};
      const result = await submitBuild({
        os: record.os as any,
        arch: record.arch ? (record.arch as any) : undefined,
        custom,
      });
      msgApi.success(result.message || 'Build request submitted');
      buildListActionRef.current?.reload();
    } catch (error: any) {
      msgApi.error(
        error?.data?.message ||
          intl.formatMessage({
            id: 'pages.customClient.retryBuildFailed',
            defaultMessage: 'Failed to retry build',
          }),
      );
    }
  };

  const pageTitle = (
    <Space>
      {intl.formatMessage({
        id: 'menu.customClients',
        defaultMessage: 'Custom Clients',
      })}
      <Tag color="blue">Beta</Tag>
    </Space>
  );

  if (pageState === 'loading') {
    return (
      <PageContainer title={pageTitle}>
        <div style={{ textAlign: 'center', padding: 80 }}>
          <LoadingOutlined style={{ fontSize: 48, color: '#1890ff' }} />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={pageTitle}
      extra={[
        <Button
          key="settings"
          icon={<SettingOutlined />}
          onClick={() => setSettingsModalOpen(true)}
        >
          {intl.formatMessage({
            id: 'pages.customClient.settings',
            defaultMessage: 'Settings',
          })}
        </Button>,
      ]}
    >
      {pageState === 'settingsRequired' && (
        <Result
          status="warning"
          title={intl.formatMessage({
            id: 'pages.customClient.settingsRequired',
            defaultMessage: 'GitHub token not configured',
          })}
          subTitle={intl.formatMessage({
            id: 'pages.customClient.settingsRequiredDesc',
            defaultMessage:
              'Configure the GitHub token and generator repository in settings to enable custom client builds.',
          })}
          extra={
            <Button type="primary" onClick={() => setSettingsModalOpen(true)}>
              {intl.formatMessage({
                id: 'pages.customClient.openSettings',
                defaultMessage: 'Open Settings',
              })}
            </Button>
          }
        />
      )}
      {pageState === 'loadFailed' && (
        <Result
          status="error"
          title={intl.formatMessage({
            id: 'pages.customClient.loadFailed',
            defaultMessage: 'Failed to load builds',
          })}
          extra={
            <Button type="primary" onClick={checkSettings}>
              {intl.formatMessage({
                id: 'pages.customClient.retry',
                defaultMessage: 'Retry',
              })}
            </Button>
          }
        />
      )}
      {pageState === 'ready' && (
        <BuildList
          actionRef={buildListActionRef}
          onCreate={() => setCreateModalOpen(true)}
          onRetry={handleRetry}
          onProgress={(uuid) => setProgressUuid(uuid)}
        />
      )}
      <CreateBuildModal
        open={createModalOpen}
        loading={buildLoading}
        onCancel={() => setCreateModalOpen(false)}
        onSubmit={handleCreate}
      />
      <ProgressModal
        uuid={progressUuid || ''}
        open={progressUuid !== null}
        onClose={() => setProgressUuid(null)}
      />
      <SettingsModal
        open={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        onSaved={checkSettings}
      />
    </PageContainer>
  );
};

export default CustomClientPage;
