import {
  deleteDevice,
  disableDevice,
  enableDevice,
  getDeviceList,
} from "@/services/rustdesk-console/device";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { PageContainer, ProTable } from "@ant-design/pro-components";
import { FormattedMessage, useIntl } from "@umijs/max";
import { App, Button, Popconfirm, Space, Tag } from "antd";
import React, { useRef, useState } from "react";

const DeviceList: React.FC = () => {
  const intl = useIntl();
  const { message: msgApi } = App.useApp();
  const actionRef = useRef<ActionType>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchParams, setSearchParams] = useState<{
    search?: string;
    status?: string;
  }>({});

  const handleEnable = async (guid: string) => {
    try {
      await enableDevice(guid);
      msgApi.success(
        intl.formatMessage({
          id: "pages.devices.enableSuccess",
          defaultMessage: "Device enabled",
        })
      );
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: "pages.devices.enableFailed",
          defaultMessage: "Failed to enable device",
        })
      );
    }
  };

  const handleDisable = async (guid: string) => {
    try {
      await disableDevice(guid);
      msgApi.success(
        intl.formatMessage({
          id: "pages.devices.disableSuccess",
          defaultMessage: "Device disabled",
        })
      );
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: "pages.devices.disableFailed",
          defaultMessage: "Failed to disable device",
        })
      );
    }
  };

  const handleDelete = async (guid: string) => {
    try {
      await deleteDevice(guid);
      msgApi.success(
        intl.formatMessage({
          id: "pages.devices.deleteSuccess",
          defaultMessage: "Device deleted",
        })
      );
      actionRef.current?.reload();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: "pages.devices.deleteFailed",
          defaultMessage: "Failed to delete device",
        })
      );
    }
  };

  const handleSearch = (values: { search?: string; status?: string }) => {
    setSearchParams(values);
    actionRef.current?.reload();
  };

  const columns: ProColumns<API.DeviceItem>[] = [
    {
      title: "",
      dataIndex: "index",
      valueType: "indexBorder",
      width: 50,
    },
    {
      title: "ID",
      dataIndex: "id",
      copyable: true,
      width: 150,
      ellipsis: true,
    },
    {
      title: (
        <FormattedMessage id="pages.devices.device" defaultMessage="Device" />
      ),
      dataIndex: "device_name",
      width: 150,
      ellipsis: true,
      search: false,
      render: (_: unknown, record: API.DeviceItem) => record.info?.device_name || "-",
    },
    {
      title: (
        <FormattedMessage
          id="pages.devices.deviceGroup"
          defaultMessage="Group"
        />
      ),
      dataIndex: "device_group_name",
      width: 120,
      ellipsis: true,
      search: false,
      render: (_: unknown, record: API.DeviceItem) => record.device_group_name || "-",
    },
    {
      title: <FormattedMessage id="pages.devices.user" defaultMessage="User" />,
      dataIndex: "user_name",
      width: 120,
      ellipsis: true,
      search: false,
      render: (_: unknown, record: API.DeviceItem) => record.user_name || "-",
    },
    {
      title: <FormattedMessage id="pages.devices.status" defaultMessage="Status" />,
      dataIndex: "status",
      width: 80,
      search: false,
      render: (_: unknown, record: API.DeviceItem) => {
        const isOnline = record.status === "online" || record.status === 1;
        return (
          <Tag color={isOnline ? "green" : "default"}>
            {isOnline ? (
              <FormattedMessage
                id="pages.devices.online"
                defaultMessage="Online"
              />
            ) : (
              <FormattedMessage
                id="pages.devices.offline"
                defaultMessage="Offline"
              />
            )}
          </Tag>
        );
      },
    },
    {
      title: (
        <FormattedMessage id="pages.devices.info" defaultMessage="Info" />
      ),
      dataIndex: "info",
      width: 200,
      ellipsis: true,
      search: false,
      render: (_: unknown, record: API.DeviceItem) => record.info?.os || "-",
    },
    {
      title: <FormattedMessage id="pages.devices.note" defaultMessage="Note" />,
      dataIndex: "note",
      width: 150,
      ellipsis: true,
      search: false,
      render: (_: unknown, record: API.DeviceItem) => record.note || "-",
    },
    {
      title: (
        <FormattedMessage id="pages.common.action" defaultMessage="Action" />
      ),
      valueType: "option",
      width: 200,
      fixed: "right",
      render: (_: unknown, record: API.DeviceItem) => (
        <Space size="small">
          <Button
            key="enable"
            type="link"
            size="small"
            onClick={() => handleEnable(record.guid)}
          >
            <FormattedMessage
              id="pages.devices.enable"
              defaultMessage="Enable"
            />
          </Button>
          <Button
            key="disable"
            type="link"
            size="small"
            onClick={() => handleDisable(record.guid)}
          >
            <FormattedMessage
              id="pages.devices.disable"
              defaultMessage="Disable"
            />
          </Button>
          <Popconfirm
            key="delete"
            title={
              <FormattedMessage
                id="pages.devices.deleteConfirm"
                defaultMessage="Are you sure to delete this device?"
              />
            }
            onConfirm={() => handleDelete(record.guid)}
          >
            <Button type="link" size="small" danger>
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
      <ProTable<API.DeviceItem>
        headerTitle={
          <FormattedMessage
            id="pages.devices.list"
            defaultMessage="Device List"
          />
        }
        actionRef={actionRef}
        rowKey="guid"
        request={async (params) => {
          const result = await getDeviceList({
            current: params.current || 1,
            pageSize: params.pageSize || 20,
            search: searchParams.search,
            status: searchParams.status,
          });
          return {
            data: result.data || [],
            total: result.total || 0,
            success: true,
          };
        }}
        columns={columns}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        search={{
          labelWidth: 'auto',
          defaultCollapsed: false,
          optionRender: (searchConfig, formProps, dom) => [
            ...dom.reverse(),
          ],
        }}
        form={{
          onSubmit: handleSearch,
          onReset: () => {
            setSearchParams({});
          },
        }}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        scroll={{ x: 1200 }}
      />
    </PageContainer>
  );
};

export default DeviceList;
