import {
  DeleteOutlined,
  EditOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Button, Divider, Popconfirm, Space } from 'antd';
import type { ProColumns } from '@ant-design/pro-components';
import React from 'react';

export interface ActionColumnCallbacks {
  onEdit: (record: API.DeviceItem) => void;
  onEnable: (guid: string) => void;
  onDisable: (guid: string) => void;
  onDelete: (guid: string) => void;
  onRemoveFromGroup: (deviceId: string) => void;
  deviceGroupGuid?: string;
}

export const getActionColumn = (
  callbacks: ActionColumnCallbacks,
): ProColumns<API.DeviceItem> => {
  const intl = useIntl();
  const {
    onEdit,
    onEnable,
    onDisable,
    onDelete,
    onRemoveFromGroup,
    deviceGroupGuid,
  } = callbacks;

  return {
    title: (
      <FormattedMessage id="pages.common.action" defaultMessage="Action" />
    ),
    valueType: 'option',
    width: '15%',
    fixed: 'right',
    render: (_: unknown, record: API.DeviceItem) => {
      const isDisabled = record.status === 0;

      // When in device group context, only show remove button
      if (deviceGroupGuid) {
        return (
          <Popconfirm
            key="remove"
            title={
              <FormattedMessage
                id="pages.devices.removeFromGroupConfirm"
                defaultMessage="Are you sure to remove this device from the group?"
              />
            }
            onConfirm={() => onRemoveFromGroup(record.id)}
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
                id="pages.devices.remove"
                defaultMessage="Remove"
              />
            </Button>
          </Popconfirm>
        );
      }

      // Normal device list (not in device group context)
      return (
        <Space size={0} split={<Divider type="vertical" />}>
          <Button
            key="edit"
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
          >
            <FormattedMessage id="pages.common.edit" defaultMessage="Edit" />
          </Button>
          {isDisabled ? (
            <Button
              key="enable"
              type="link"
              size="small"
              icon={<PlusCircleOutlined />}
              onClick={() => onEnable(record.guid)}
            >
              <FormattedMessage
                id="pages.devices.enable"
                defaultMessage="Enable"
              />
            </Button>
          ) : (
            <Button
              key="disable"
              type="link"
              size="small"
              icon={<MinusCircleOutlined />}
              onClick={() => onDisable(record.guid)}
            >
              <FormattedMessage
                id="pages.devices.disable"
                defaultMessage="Disable"
              />
            </Button>
          )}
          {isDisabled && (
            <Popconfirm
              key="delete"
              title={
                <FormattedMessage
                  id="pages.devices.deleteConfirm"
                  defaultMessage="Are you sure to delete this device?"
                />
              }
              onConfirm={() => onDelete(record.guid)}
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
          )}
        </Space>
      );
    },
  };
};
