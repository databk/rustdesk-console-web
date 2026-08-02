import type { ActionType } from '@ant-design/pro-components';
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
import React, { useRef, useState } from 'react';
import {
  disconnectConnection,
  getConnectionAudits,
  updateConnectionAudit,
} from '@/services/rustdesk-console/audit';
import { DownloadOutlined } from '@ant-design/icons';
import type { ConnectionAuditSearchParams } from './types';
import { useConnColumns } from './components/ConnColumns';
import { useDetailFields } from './components/DetailFields';
import { useCsvExport } from './components/useCsvExport';

const { Text } = Typography;

const ConnectionAudit: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const intl = useIntl();
  const { message: msgApi } = App.useApp();
  const access = useAccess();
  const canEdit = !!access.canAdmin;

  const [pageParams, setPageParams] =
    useState<Partial<ConnectionAuditSearchParams>>();
  const [currentRow, setCurrentRow] = useState<API.ConnectionAuditItem>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [disconnectConfirmLoading, setDisconnectConfirmLoading] =
    useState(false);
  const [disconnectTarget, setDisconnectTarget] = useState<{
    uuid: string;
    connId: number;
  }>();

  const { exportCsv } = useCsvExport({ pageParams });

  const handleDisconnect = async () => {
    if (!disconnectTarget) return;
    setDisconnectConfirmLoading(true);
    try {
      const res = await disconnectConnection(disconnectTarget.uuid, [
        disconnectTarget.connId,
      ]);
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
    if (!old.id) return false;
    if ((fields.note || '') === (old.note || '')) return true;

    try {
      await updateConnectionAudit(old.id, { note: fields.note || '' });
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

  const columns = useConnColumns({
    canEdit,
    onViewDetail: (record) => {
      setCurrentRow(record);
      setDrawerOpen(true);
    },
    onEditNote: (record) => {
      setCurrentRow(record);
      setEditModalVisible(true);
    },
    onDisconnect: (record) => {
      setDisconnectTarget({
        uuid: record.deviceUuid || '',
        connId: Number(record.connId || record.id),
      });
      setDisconnectModalOpen(true);
    },
  });

  const detailFields = useDetailFields();

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
        modalProps={{ destroyOnClose: true }}
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
