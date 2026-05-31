import { PlusOutlined } from '@ant-design/icons';
import type { ActionType } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { App, Button } from 'antd';
import React, { useRef, useState } from 'react';
import {
  createOidcProvider,
  deleteOidcProvider,
  getOidcProvider,
  getOidcProviderList,
  testOidcProvider,
  toggleOidcProvider,
  updateOidcProvider,
} from '@/services/rustdesk-console';
import OidcProviderColumns from './columns';
import ProviderForm from './components/ProviderForm';
import TestResultModal from './components/TestResultModal';

const OidcProviderList: React.FC = () => {
  const intl = useIntl();
  const { message: msgApi } = App.useApp();
  const actionRef = useRef<ActionType>(null);

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<API.OidcProvider | null>(
    null,
  );
  const [testingGuid, setTestingGuid] = useState<string | null>(null);
  const [testResultVisible, setTestResultVisible] = useState(false);
  const [testResult, setTestResult] = useState<API.OidcTestResult | null>(null);

  const handleCreate = async (values: API.CreateOidcProviderParams) => {
    try {
      await createOidcProvider(values);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.oidcProviders.createSuccess',
          defaultMessage: 'OIDC provider created',
        }),
      );
      setCreateModalVisible(false);
      actionRef.current?.reload();
      return true;
    } catch (_error) {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.oidcProviders.createFailed',
          defaultMessage: 'Failed to create OIDC provider',
        }),
      );
      return false;
    }
  };

  const handleEdit = async (record: API.OidcProvider) => {
    try {
      const detail = await getOidcProvider(record.guid);
      setCurrentRecord(detail);
      setEditModalVisible(true);
    } catch (_error) {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.oidcProviders.fetchDetailFailed',
          defaultMessage: 'Failed to fetch provider details',
        }),
      );
    }
  };

  const handleUpdate = async (values: API.UpdateOidcProviderParams) => {
    if (!currentRecord) return false;
    try {
      await updateOidcProvider(currentRecord.guid, values);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.oidcProviders.updateSuccess',
          defaultMessage: 'OIDC provider updated',
        }),
      );
      setEditModalVisible(false);
      setCurrentRecord(null);
      actionRef.current?.reload();
      return true;
    } catch (_error) {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.oidcProviders.updateFailed',
          defaultMessage: 'Failed to update OIDC provider',
        }),
      );
      return false;
    }
  };

  const handleDelete = async (guid: string) => {
    try {
      await deleteOidcProvider(guid);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.oidcProviders.deleteSuccess',
          defaultMessage: 'OIDC provider deleted',
        }),
      );
      actionRef.current?.reload();
    } catch (_error) {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.oidcProviders.deleteFailed',
          defaultMessage: 'Failed to delete OIDC provider',
        }),
      );
    }
  };

  const handleToggle = async (guid: string, enabled: boolean) => {
    try {
      await toggleOidcProvider(guid, { enabled });
      msgApi.success(
        intl.formatMessage({
          id: enabled
            ? 'pages.oidcProviders.enableSuccess'
            : 'pages.oidcProviders.disableSuccess',
          defaultMessage: enabled
            ? 'OIDC provider enabled'
            : 'OIDC provider disabled',
        }),
      );
      actionRef.current?.reload();
    } catch (_error) {
      msgApi.error(
        intl.formatMessage({
          id: enabled
            ? 'pages.oidcProviders.enableFailed'
            : 'pages.oidcProviders.disableFailed',
          defaultMessage: enabled
            ? 'Failed to enable OIDC provider'
            : 'Failed to disable OIDC provider',
        }),
      );
    }
  };

  const handleTest = async (guid: string) => {
    try {
      setTestingGuid(guid);
      const result = await testOidcProvider(guid);
      setTestResult(result);
      setTestResultVisible(true);
    } catch (_error) {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.oidcProviders.testFailed',
          defaultMessage: 'Failed to test OIDC connection',
        }),
      );
    } finally {
      setTestingGuid(null);
    }
  };

  const columns = OidcProviderColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
    onToggle: handleToggle,
    onTest: handleTest,
    testingGuid,
  });

  return (
    <PageContainer>
      <ProTable<API.OidcProvider>
        headerTitle={
          <FormattedMessage
            id="pages.oidcProviders.list"
            defaultMessage="OIDC Providers"
          />
        }
        actionRef={actionRef}
        rowKey="guid"
        request={async (params) => {
          const result = await getOidcProviderList({
            current: params.current,
            pageSize: params.pageSize,
            name: params.name,
          });
          return {
            data: result.data || [],
            total: result.total || 0,
            success: true,
          };
        }}
        columns={columns}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        scroll={{ x: 1100 }}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            <FormattedMessage
              id="pages.oidcProviders.create"
              defaultMessage="Create Provider"
            />
          </Button>,
        ]}
        options={{
          density: true,
          setting: { listsHeight: 400 },
          fullScreen: false,
          reload: true,
        }}
      />

      <ProviderForm
        mode="create"
        open={createModalVisible}
        onOpenChange={setCreateModalVisible}
        onFinish={handleCreate}
      />

      <ProviderForm
        mode="edit"
        open={editModalVisible}
        onOpenChange={setEditModalVisible}
        onFinish={handleUpdate}
        currentRecord={currentRecord}
      />

      <TestResultModal
        open={testResultVisible}
        onClose={() => setTestResultVisible(false)}
        result={testResult}
      />
    </PageContainer>
  );
};

export default OidcProviderList;
