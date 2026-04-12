import {
  deleteDevice,
  disableDevice,
  enableDevice,
  getDeviceList,
} from "@/services/rustdesk-console/device";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { PageContainer, ProTable } from "@ant-design/pro-components";
import { FormattedMessage, useIntl } from "@umijs/max";
import { App, Button, Popconfirm, Select, Space, Tag } from "antd";
import React, { useRef, useState } from "react";

const DeviceList: React.FC = () => {
  const intl = useIntl();
  const { message: msgApi } = App.useApp();
  const actionRef = useRef<ActionType>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [accessibleFilter, setAccessibleFilter] = useState<string>("all");
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
      title: "ID",
      dataIndex: "id",
      copyable: true,
      width: 200,
      ellipsis: true,
    },
    {
      title: (
        <FormattedMessage
          id="pages.devices.hostname"
          defaultMessage="Hostname"
        />
      ),
      dataIndex: "hostname",
      ellipsis: true,
    },
    {
      title: <FormattedMessage id="pages.devices.os" defaultMessage="OS" />,
      dataIndex: "os",
      width: 120,
      ellipsis: true,
    },
    {
      title: <FormattedMessage id="pages.devices.status" defaultMessage="Status" />,
      dataIndex: "status",
      width: 100,
      search: false,
      render: (_: unknown, record: API.DeviceItem) => {
        const isOnline = record.status === "online";
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
      title: <FormattedMessage id="pages.devices.user" defaultMessage="User" />,
      dataIndex: "user_name",
      ellipsis: true,
    },
    {
      title: (
        <FormattedMessage
          id="pages.devices.deviceGroup"
          defaultMessage="Device Group"
        />
      ),
      dataIndex: "device_group_name",
      ellipsis: true,
    },
    {
      title: <FormattedMessage id="pages.devices.note" defaultMessage="Note" />,
      dataIndex: "note",
      ellipsis: true,
      search: false,
    },
    {
      title: (
        <FormattedMessage
          id="pages.devices.lastOnline"
          defaultMessage="Last Online"
        />
      ),
      dataIndex: "last_online_time",
      valueType: "dateTime",
      width: 180,
      search: false,
    },
    {
      title: (
        <FormattedMessage id="pages.common.action" defaultMessage="Action" />
      ),
      valueType: "option",
      width: 200,
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
            pageSize: params.pageSize || 10,
            accessible: accessibleFilter,
            status: statusFilter === "all" ? searchParams.status : statusFilter,
            search: searchParams.search,
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
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        toolBarRender={() => [
          <Select
            key="status"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 120 }}
            options={[
              {
                label: intl.formatMessage({
                  id: "pages.devices.allStatus",
                  defaultMessage: "All Status",
                }),
                value: "all",
              },
              {
                label: intl.formatMessage({
                  id: "pages.devices.online",
                  defaultMessage: "Online",
                }),
                value: "online",
              },
              {
                label: intl.formatMessage({
                  id: "pages.devices.offline",
                  defaultMessage: "Offline",
                }),
                value: "offline",
              },
            ]}
          />,
          <Select
            key="accessible"
            value={accessibleFilter}
            onChange={setAccessibleFilter}
            style={{ width: 150 }}
            options={[
              {
                label: intl.formatMessage({
                  id: "pages.devices.allDevices",
                  defaultMessage: "All Devices",
                }),
                value: "all",
              },
              {
                label: intl.formatMessage({
                  id: "pages.devices.myDevices",
                  defaultMessage: "My Devices",
                }),
                value: "me",
              },
            ]}
          />,
        ]}
      />
    </PageContainer>
  );
};

export default DeviceList;
