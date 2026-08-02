import { FormattedMessage, useIntl } from '@umijs/max';
import { Button, Popconfirm, Select, Space } from 'antd';
import {
  LogoutOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import React from 'react';

interface BatchActionsBarProps {
  mode: 'move' | 'status';
  userGroups: API.UserGroupItem[];
  userGroupsLoading: boolean;
  currentGroupGuid?: string;
  destinationGuid: string | undefined;
  moving: boolean;
  batchStatusUpdating: boolean;
  batchForceLoggingOut: boolean;
  selectedRowCount: number;
  onDestinationChange: (guid: string | undefined) => void;
  onBatchMove: () => void;
  onBatchEnable: () => void;
  onBatchDisable: () => void;
  onBatchForceLogout: () => void;
}

const BatchActionsBar: React.FC<BatchActionsBarProps> = ({
  mode,
  userGroups,
  userGroupsLoading,
  currentGroupGuid,
  destinationGuid,
  moving,
  batchStatusUpdating,
  batchForceLoggingOut,
  selectedRowCount,
  onDestinationChange,
  onBatchMove,
  onBatchEnable,
  onBatchDisable,
  onBatchForceLogout,
}) => {
  const intl = useIntl();

  if (mode === 'move') {
    return (
      <Space size={16}>
        <Select
          aria-label={intl.formatMessage({
            id: 'pages.userGroups.destination',
            defaultMessage: 'Destination group',
          })}
          showSearch
          optionFilterProp="label"
          loading={userGroupsLoading}
          value={destinationGuid}
          onChange={onDestinationChange}
          placeholder={intl.formatMessage({
            id: 'pages.userGroups.selectDestination',
            defaultMessage: 'Select destination group',
          })}
          options={userGroups
            .filter((g) => g.guid !== currentGroupGuid)
            .map((g) => ({ label: g.name, value: g.guid }))}
          style={{ width: 200 }}
        />
        <Button
          type="link"
          icon={<SwapOutlined />}
          disabled={!destinationGuid || selectedRowCount === 0}
          loading={moving}
          onClick={onBatchMove}
          style={{ padding: 0 }}
        >
          <FormattedMessage
            id="pages.userGroups.batchMove"
            defaultMessage="Batch Move"
          />
        </Button>
      </Space>
    );
  }

  return (
    <Space size={16}>
      <Popconfirm
        title={
          <FormattedMessage
            id="pages.users.batchEnableConfirm"
            defaultMessage="Are you sure to enable selected users?"
          />
        }
        onConfirm={onBatchEnable}
        okText={intl.formatMessage({
          id: 'pages.common.confirm',
          defaultMessage: 'Yes',
        })}
        cancelText={intl.formatMessage({
          id: 'pages.common.cancel',
          defaultMessage: 'No',
        })}
      >
        <Button
          type="link"
          icon={<PlusCircleOutlined />}
          loading={batchStatusUpdating}
          style={{ padding: 0 }}
        >
          <FormattedMessage
            id="pages.users.batchEnable"
            defaultMessage="Batch Enable"
          />
        </Button>
      </Popconfirm>
      <Popconfirm
        title={
          <FormattedMessage
            id="pages.users.batchDisableConfirm"
            defaultMessage="Are you sure to disable selected users?"
          />
        }
        onConfirm={onBatchDisable}
        okText={intl.formatMessage({
          id: 'pages.common.confirm',
          defaultMessage: 'Yes',
        })}
        cancelText={intl.formatMessage({
          id: 'pages.common.cancel',
          defaultMessage: 'No',
        })}
      >
        <Button
          type="link"
          icon={<MinusCircleOutlined />}
          loading={batchStatusUpdating}
          style={{ padding: 0 }}
        >
          <FormattedMessage
            id="pages.users.batchDisable"
            defaultMessage="Batch Disable"
          />
        </Button>
      </Popconfirm>
      <Popconfirm
        title={
          <FormattedMessage
            id="pages.users.batchForceLogoutConfirm"
            defaultMessage="Are you sure to force logout selected users?"
          />
        }
        onConfirm={onBatchForceLogout}
        okText={intl.formatMessage({
          id: 'pages.common.confirm',
          defaultMessage: 'Yes',
        })}
        cancelText={intl.formatMessage({
          id: 'pages.common.cancel',
          defaultMessage: 'No',
        })}
      >
        <Button
          type="link"
          icon={<LogoutOutlined />}
          loading={batchForceLoggingOut}
          style={{ padding: 0 }}
        >
          <FormattedMessage
            id="pages.users.batchForceLogout"
            defaultMessage="Batch Force Logout"
          />
        </Button>
      </Popconfirm>
    </Space>
  );
};

export default BatchActionsBar;