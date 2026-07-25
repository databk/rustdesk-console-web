import { PlusOutlined } from '@ant-design/icons';
import type { ActionType } from '@ant-design/pro-components';
import { DragSortTable, PageContainer } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { App, Button } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  createOidcProvider,
  deleteOidcProvider,
  getOidcProvider,
  getOidcProviderList,
  sortOidcProviderList,
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

  const [dataSource, setDataSource] = useState<API.OidcProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<API.OidcProvider | null>(
    null,
  );
  const [testingGuid, setTestingGuid] = useState<string | null>(null);
  const [testResultVisible, setTestResultVisible] = useState(false);
  const [testResult, setTestResult] = useState<API.OidcTestResult | null>(null);

  const fetchData = useCallback(
    async (name?: string) => {
      setLoading(true);
      try {
        const result = await getOidcProviderList({ name });
        setDataSource(result.data || []);
      } catch (_error) {
        // Error is handled by global error handler
      } finally {
        setLoading(false);
      }
    },
    [msgApi, intl],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      fetchData();
      return true;
    } catch (_error) {
      // Error is handled by global error handler
      return false;
    }
  };

  const handleEdit = async (record: API.OidcProvider) => {
    try {
      const detail = await getOidcProvider(record.guid);
      setCurrentRecord(detail);
      setEditModalVisible(true);
    } catch (_error) {
      // Error is handled by global error handler
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
      fetchData();
      return true;
    } catch (_error) {
      // Error is handled by global error handler
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
      fetchData();
    } catch (_error) {
      // Error is handled by global error handler
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
      fetchData();
    } catch (_error) {
      // Error is handled by global error handler
    }
  };

  const handleTest = async (guid: string) => {
    try {
      setTestingGuid(guid);
      const result = await testOidcProvider(guid);
      setTestResult(result);
      setTestResultVisible(true);
    } catch (_error) {
      // Error is handled by global error handler
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

  const handleDragSortEnd = (
    _beforeIndex: number,
    _afterIndex: number,
    newDataSource: API.OidcProvider[],
  ) => {
    setDataSource(newDataSource);
    sortOidcProviderList(newDataSource.map((item) => item.guid)).catch(() => {
      fetchData();
    });
  };

  return (
    <PageContainer>
      <DragSortTable<API.OidcProvider>
        headerTitle={
          <FormattedMessage
            id="pages.oidcProviders.list"
            defaultMessage="OIDC Providers"
          />
        }
        columnsState={{
          persistenceType: 'localStorage',
          persistenceKey: 'oidc_provider_list_columns_state',
        }}
        actionRef={actionRef}
        rowKey="guid"
        dragSortKey="sort"
        onDragSortEnd={handleDragSortEnd}
        dataSource={dataSource}
        loading={loading}
        columns={columns}
        pagination={false}
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
