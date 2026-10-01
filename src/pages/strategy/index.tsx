import { PlusOutlined } from '@ant-design/icons';
import type { ActionType } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useAccess, useIntl, useModel } from '@umijs/max';
import { App, Button } from 'antd';
import React, { useRef, useState } from 'react';
import {
  createStrategy,
  deleteStrategy,
  getStrategy,
  getStrategyCandidates,
  getStrategyList,
  updateStrategy,
} from '@/services/rustdesk-console';
import StrategyColumns from './columns';
import AssignModal from './components/AssignModal';
import StrategyForm from './components/StrategyForm';
import { getStrategyListMode } from './strategyAccess';
import { DEFAULT_PAGINATION } from '@/utils/pagination';

const StrategyList: React.FC = () => {
  const intl = useIntl();
  const access = useAccess();
  const { initialState } = useModel('@@initialState');
  const { message: msgApi } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const openRequestVersionRef = useRef(0);

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailMode, setDetailMode] = useState<'view' | 'edit' | null>(null);
  const [currentRecord, setCurrentRecord] = useState<API.StrategyItem | null>(
    null,
  );
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [assignRecord, setAssignRecord] = useState<API.StrategyItem | null>(
    null,
  );

  const handleCreate = async (
    values: API.CreateStrategyParams | API.UpdateStrategyParams,
  ) => {
    try {
      await createStrategy(values as API.CreateStrategyParams);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.strategies.createSuccess',
          defaultMessage: 'Strategy created',
        }),
      );
      setCreateModalVisible(false);
      actionRef.current?.reload();
      return true;
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.strategies.createFailed',
          defaultMessage: 'Failed to create strategy',
        }),
      );
      return false;
    }
  };

  const openStrategy = async (
    record: API.StrategyItem,
    mode: 'view' | 'edit',
  ) => {
    const requestVersion = ++openRequestVersionRef.current;
    try {
      const detail = await getStrategy(record.guid);
      if (requestVersion !== openRequestVersionRef.current) return;
      setCurrentRecord(detail);
      setDetailMode(mode);
    } catch {
      if (requestVersion !== openRequestVersionRef.current) return;
      msgApi.error(
        intl.formatMessage({
          id: 'pages.strategies.fetchDetailFailed',
          defaultMessage: 'Failed to fetch strategy details',
        }),
      );
    }
  };

  const handleUpdate = async (values: API.UpdateStrategyParams) => {
    if (!currentRecord) return false;
    try {
      await updateStrategy(currentRecord.guid, values);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.strategies.updateSuccess',
          defaultMessage: 'Strategy updated',
        }),
      );
      setDetailMode(null);
      setCurrentRecord(null);
      actionRef.current?.reload();
      return true;
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.strategies.updateFailed',
          defaultMessage: 'Failed to update strategy',
        }),
      );
      return false;
    }
  };

  const handleDelete = async (guid: string) => {
    try {
      await deleteStrategy(guid);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.strategies.deleteSuccess',
          defaultMessage: 'Strategy deleted',
        }),
      );
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.strategies.deleteFailed',
          defaultMessage: 'Failed to delete strategy',
        }),
      );
    }
  };

  const handleAssign = (record: API.StrategyItem) => {
    setAssignRecord(record);
    setAssignModalVisible(true);
  };

  const columns = StrategyColumns({
    onView: (record) => void openStrategy(record, 'view'),
    onEdit: (record) => void openStrategy(record, 'edit'),
    onDelete: handleDelete,
    onAssign: handleAssign,
    canView: access.canStrategiesView,
    canEdit: access.canStrategiesEdit,
    canDelete: access.canStrategiesDelete,
    canAssign: access.canStrategiesAssign,
  });

  return (
    <PageContainer>
      <ProTable<API.StrategyItem>
        headerTitle={
          <FormattedMessage
            id="pages.strategies.list"
            defaultMessage="Strategy List"
          />
        }
        columnsState={{
          persistenceType: 'localStorage',
          persistenceKey: 'strategy_list_columns_state',
        }}
        actionRef={actionRef}
        rowKey="guid"
        request={async (params) => {
          const loadStrategies =
            getStrategyListMode(access.canStrategiesView) === 'full'
              ? getStrategyList
              : getStrategyCandidates;
          const result = await loadStrategies({
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
        pagination={DEFAULT_PAGINATION}
        scroll={{ x: 1000 }}
        toolBarRender={() =>
          access.canStrategiesCreate
            ? [
                <Button
                  key="create"
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setCreateModalVisible(true)}
                >
                  <FormattedMessage
                    id="pages.strategies.create"
                    defaultMessage="Create Strategy"
                  />
                </Button>,
              ]
            : []
        }
        options={{
          density: true,
          setting: { listsHeight: 400 },
          fullScreen: false,
          reload: true,
        }}
      />

      <StrategyForm
        mode="create"
        open={createModalVisible}
        onOpenChange={setCreateModalVisible}
        onFinish={handleCreate}
      />

      <StrategyForm
        mode={detailMode || 'view'}
        open={detailMode !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDetailMode(null);
            setCurrentRecord(null);
          }
        }}
        onFinish={detailMode === 'edit' ? handleUpdate : undefined}
        currentRecord={currentRecord}
      />

      {access.canStrategiesAssign && (
        <AssignModal
          open={assignModalVisible}
          onOpenChange={setAssignModalVisible}
          record={assignRecord}
          canAssignUsers={
            access.isSuperAdmin ||
            initialState?.permissions?.scopes['strategies.assign']
              ?.scope_type === 'global'
          }
          isSuperAdmin={access.isSuperAdmin}
          onSuccess={() => actionRef.current?.reload()}
        />
      )}
    </PageContainer>
  );
};

export default StrategyList;
