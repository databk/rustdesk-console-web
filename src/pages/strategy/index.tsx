import { PlusOutlined } from '@ant-design/icons';
import type { ActionType } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { App, Button } from 'antd';
import React, { useRef, useState } from 'react';
import {
  createStrategy,
  deleteStrategy,
  getStrategy,
  getStrategyList,
  updateStrategy,
} from '@/services/rustdesk-console';
import StrategyColumns from './columns';
import AssignModal from './components/AssignModal';
import StrategyForm from './components/StrategyForm';

const StrategyList: React.FC = () => {
  const intl = useIntl();
  const { message: msgApi } = App.useApp();
  const actionRef = useRef<ActionType>(null);

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
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

  const handleEdit = async (record: API.StrategyItem) => {
    try {
      const detail = await getStrategy(record.guid);
      setCurrentRecord(detail);
      setEditModalVisible(true);
    } catch {
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
      setEditModalVisible(false);
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
    onEdit: handleEdit,
    onDelete: handleDelete,
    onAssign: handleAssign,
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
        actionRef={actionRef}
        rowKey="guid"
        request={async (params) => {
          const result = await getStrategyList({
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
        scroll={{ x: 1000 }}
        toolBarRender={() => [
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
        ]}
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
        mode="edit"
        open={editModalVisible}
        onOpenChange={setEditModalVisible}
        onFinish={handleUpdate}
        currentRecord={currentRecord}
      />

      <AssignModal
        open={assignModalVisible}
        onOpenChange={setAssignModalVisible}
        record={assignRecord}
        onSuccess={() => actionRef.current?.reload()}
      />
    </PageContainer>
  );
};

export default StrategyList;
