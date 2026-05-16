import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SolutionOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ModalForm, PageContainer, ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import {
  App,
  Button,
  Divider,
  Form,
  Input,
  Popconfirm,
  Space,
  Switch,
} from 'antd';
import React, { useRef, useState } from 'react';
import {
  createStrategy,
  deleteStrategy,
  getStrategyList,
  updateStrategy,
} from '@/services/rustdesk-console/strategy';

const StrategyList: React.FC = () => {
  const intl = useIntl();
  const { message: msgApi } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentStrategy, setCurrentStrategy] =
    useState<API.StrategyItem | null>(null);
  const [form] = Form.useForm();

  const handleCreate = async (values: API.CreateStrategyParams) => {
    try {
      await createStrategy(values);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.strategies.createSuccess',
          defaultMessage: 'Strategy created',
        }),
      );
      setCreateModalVisible(false);
      form.resetFields();
      actionRef.current?.reload();
    } catch (error) {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.strategies.createFailed',
          defaultMessage: 'Failed to create strategy',
        }),
      );
    }
  };

  const handleUpdate = async (values: API.UpdateStrategyParams) => {
    if (!currentStrategy) return;
    try {
      await updateStrategy(currentStrategy.guid, values);
      msgApi.success(
        intl.formatMessage({
          id: 'pages.strategies.updateSuccess',
          defaultMessage: 'Strategy updated',
        }),
      );
      setEditModalVisible(false);
      setCurrentStrategy(null);
      form.resetFields();
      actionRef.current?.reload();
    } catch (error) {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.strategies.updateFailed',
          defaultMessage: 'Failed to update strategy',
        }),
      );
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
    } catch (error) {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.strategies.deleteFailed',
          defaultMessage: 'Failed to delete strategy',
        }),
      );
    }
  };

  const columns: ProColumns<API.StrategyItem>[] = [
    {
      title: '',
      dataIndex: 'index',
      valueType: 'indexBorder',
      width: 50,
    },
    {
      title: (
        <FormattedMessage
          id="pages.strategies.name"
          defaultMessage="Strategy Name"
        />
      ),
      dataIndex: 'name',
      width: 200,
      render: (_, record) => (
        <Space>
          <SolutionOutlined style={{ color: '#722ed1' }} />
          <span>{record.name}</span>
        </Space>
      ),
    },
    {
      title: (
        <FormattedMessage id="pages.strategies.note" defaultMessage="Note" />
      ),
      dataIndex: 'note',
      width: 250,
      ellipsis: true,
      render: (_, record) => record.note || '-',
    },
    {
      title: (
        <FormattedMessage
          id="pages.strategies.status"
          defaultMessage="Status"
        />
      ),
      dataIndex: 'status',
      width: 100,
      search: false,
      render: (_, record) => <Switch checked={record.status === 1} disabled />,
    },
    {
      title: (
        <FormattedMessage id="pages.common.action" defaultMessage="Action" />
      ),
      valueType: 'option',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size={0} split={<Divider type="vertical" />}>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setCurrentStrategy(record);
              form.setFieldsValue(record);
              setEditModalVisible(true);
            }}
          >
            <FormattedMessage id="pages.common.edit" defaultMessage="Edit" />
          </Button>
          <Popconfirm
            title={intl.formatMessage({
              id: 'pages.strategies.deleteConfirm',
              defaultMessage: 'Delete this strategy?',
            })}
            onConfirm={() => handleDelete(record.guid)}
            okText={intl.formatMessage({
              id: 'pages.common.confirm',
              defaultMessage: 'Yes',
            })}
            cancelText={intl.formatMessage({
              id: 'pages.common.cancel',
              defaultMessage: 'No',
            })}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              <FormattedMessage
                id="pages.common.delete"
                defaultMessage="Delete"
              />
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

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
            search: params.name,
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
        scroll={{ x: 800 }}
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

      <ModalForm
        title={
          <FormattedMessage
            id="pages.strategies.create"
            defaultMessage="Create Strategy"
          />
        }
        open={createModalVisible}
        onOpenChange={setCreateModalVisible}
        onFinish={handleCreate}
        form={form}
        layout="vertical"
        modalProps={{ destroyOnClose: true }}
      >
        <Form.Item
          name="name"
          label={
            <FormattedMessage
              id="pages.strategies.name"
              defaultMessage="Name"
            />
          }
          rules={[{ required: true }]}
        >
          <Input
            placeholder={intl.formatMessage({
              id: 'pages.strategies.enterName',
              defaultMessage: 'Enter strategy name',
            })}
          />
        </Form.Item>
        <Form.Item
          name="note"
          label={
            <FormattedMessage
              id="pages.strategies.note"
              defaultMessage="Note"
            />
          }
        >
          <Input.TextArea
            rows={3}
            placeholder={intl.formatMessage({
              id: 'pages.common.enterDescription',
              defaultMessage: 'Enter description',
            })}
          />
        </Form.Item>
      </ModalForm>

      <ModalForm
        title={
          <FormattedMessage
            id="pages.strategies.edit"
            defaultMessage="Edit Strategy"
          />
        }
        open={editModalVisible}
        onOpenChange={setEditModalVisible}
        onFinish={handleUpdate}
        form={form}
        layout="vertical"
        modalProps={{ destroyOnClose: true }}
      >
        <Form.Item
          name="name"
          label={
            <FormattedMessage
              id="pages.strategies.name"
              defaultMessage="Name"
            />
          }
          rules={[{ required: true }]}
        >
          <Input
            placeholder={intl.formatMessage({
              id: 'pages.strategies.enterName',
              defaultMessage: 'Enter strategy name',
            })}
          />
        </Form.Item>
        <Form.Item
          name="note"
          label={
            <FormattedMessage
              id="pages.strategies.note"
              defaultMessage="Note"
            />
          }
        >
          <Input.TextArea
            rows={3}
            placeholder={intl.formatMessage({
              id: 'pages.common.enterDescription',
              defaultMessage: 'Enter description',
            })}
          />
        </Form.Item>
      </ModalForm>
    </PageContainer>
  );
};

export default StrategyList;
