import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { ModalForm } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import {
  App,
  Button,
  Divider,
  Popconfirm,
  Radio,
  Select,
  Space,
  Tag,
} from 'antd';
import React, { useEffect, useState } from 'react';
import {
  assignStrategy,
  getDeviceGroupList,
  getDeviceList,
  getUserList,
  unassignStrategy,
} from '@/services/rustdesk-console';

type TargetType = 'device' | 'user' | 'device_group';

interface AssignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: API.StrategyItem | null;
  onSuccess: () => void;
}

const targetTypeOptions: { label: React.ReactNode; value: TargetType }[] = [
  {
    label: (
      <FormattedMessage
        id="pages.strategies.assignDevice"
        defaultMessage="Device"
      />
    ),
    value: 'device',
  },
  {
    label: (
      <FormattedMessage
        id="pages.strategies.assignUser"
        defaultMessage="User"
      />
    ),
    value: 'user',
  },
  {
    label: (
      <FormattedMessage
        id="pages.strategies.assignDeviceGroup"
        defaultMessage="Device Group"
      />
    ),
    value: 'device_group',
  },
];

const AssignModal: React.FC<AssignModalProps> = ({
  open,
  onOpenChange,
  record,
  onSuccess,
}) => {
  const intl = useIntl();
  const { message: msgApi } = App.useApp();
  const [targetType, setTargetType] = useState<TargetType>('device');
  const [selectedGuids, setSelectedGuids] = useState<string[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);

  const [deviceList, setDeviceList] = useState<API.DeviceItem[]>([]);
  const [userList, setUserList] = useState<API.UserItem[]>([]);
  const [deviceGroupList, setDeviceGroupList] = useState<API.DeviceGroupItem[]>(
    [],
  );
  const [optionsLoading, setOptionsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setOptionsLoading(true);
    const loadOptions = async () => {
      try {
        switch (targetType) {
          case 'device': {
            const result = await getDeviceList({ current: 1, pageSize: 200 });
            setDeviceList(result.data || []);
            break;
          }
          case 'user': {
            const result = await getUserList({ current: 1, pageSize: 200 });
            setUserList(result.data || []);
            break;
          }
          case 'device_group': {
            const result = await getDeviceGroupList({
              current: 1,
              pageSize: 200,
            });
            setDeviceGroupList(result.data || []);
            break;
          }
        }
      } catch {
        msgApi.error(
          intl.formatMessage({
            id: 'pages.strategies.loadTargetsFailed',
            defaultMessage: 'Failed to load targets',
          }),
        );
      } finally {
        setOptionsLoading(false);
      }
    };
    loadOptions();
  }, [open, targetType]);

  const handleAssign = async () => {
    if (!record || selectedGuids.length === 0) return;
    setAssignLoading(true);
    try {
      const result = await assignStrategy(record.guid, {
        target_type: targetType,
        target_guids: selectedGuids,
      });
      if (result.errors && result.errors.length > 0) {
        const errorNames = result.errors.map((e) => e.reason).join(', ');
        msgApi.warning(
          intl.formatMessage(
            {
              id: 'pages.strategies.assignPartialFailed',
              defaultMessage:
                'Assigned {success} target(s), {failed} failed: {errors}',
            },
            {
              success: result.success?.length || 0,
              failed: result.errors.length,
              errors: errorNames,
            },
          ),
        );
      } else {
        msgApi.success(
          intl.formatMessage({
            id: 'pages.strategies.assignSuccess',
            defaultMessage: 'Strategy assigned successfully',
          }),
        );
      }
      setSelectedGuids([]);
      onSuccess();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.strategies.assignFailed',
          defaultMessage: 'Failed to assign strategy',
        }),
      );
    } finally {
      setAssignLoading(false);
    }
  };

  const handleUnassign = async (tType: TargetType, targetGuid: string) => {
    if (!record) return;
    try {
      const result = await unassignStrategy(record.guid, {
        target_type: tType,
        target_guids: [targetGuid],
      });
      if (result.errors && result.errors.length > 0) {
        msgApi.warning(
          intl.formatMessage({
            id: 'pages.strategies.unassignFailed',
            defaultMessage: 'Failed to unassign strategy',
          }),
        );
      } else {
        msgApi.success(
          intl.formatMessage({
            id: 'pages.strategies.unassignSuccess',
            defaultMessage: 'Strategy unassigned successfully',
          }),
        );
      }
      onSuccess();
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.strategies.unassignFailed',
          defaultMessage: 'Failed to unassign strategy',
        }),
      );
    }
  };

  const getSelectOptions = () => {
    switch (targetType) {
      case 'device':
        return deviceList.map((d) => ({
          value: d.uuid || d.guid,
          label: `${d.id} - ${d.info?.device_name || d.info?.username || ''}`,
        }));
      case 'user':
        return userList.map((u) => ({
          value: u.guid,
          label: `${u.name} (${u.email})`,
        }));
      case 'device_group':
        return deviceGroupList.map((g) => ({
          value: g.guid,
          label: g.name,
        }));
      default:
        return [];
    }
  };

  const renderAssignedList = () => {
    if (!record) return null;

    const assignedDevices = (record as any).assigned_devices || [];
    const assignedUsers = (record as any).assigned_users || [];
    const assignedDeviceGroups = (record as any).assigned_device_groups || [];

    const allAssigned: Array<{ type: TargetType; guid: string; name: string }> =
      [
        ...assignedDevices.map((d: any) => ({
          type: 'device' as TargetType,
          guid: d.uuid || d.guid,
          name: d.id || d.name || d.guid,
        })),
        ...assignedUsers.map((u: any) => ({
          type: 'user' as TargetType,
          guid: u.guid,
          name: u.name || u.email || u.guid,
        })),
        ...assignedDeviceGroups.map((g: any) => ({
          type: 'device_group' as TargetType,
          guid: g.guid,
          name: g.name || g.guid,
        })),
      ];

    if (allAssigned.length === 0) {
      return (
        <div style={{ color: '#999', textAlign: 'center', padding: '20px 0' }}>
          <FormattedMessage
            id="pages.strategies.noAssigned"
            defaultMessage="No assigned targets"
          />
        </div>
      );
    }

    return (
      <div style={{ maxHeight: 200, overflow: 'auto' }}>
        {allAssigned.map((item) => (
          <div
            key={`${item.type}-${item.guid}`}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '4px 0',
              borderBottom: '1px solid #f5f5f5',
            }}
          >
            <Space>
              <Tag
                color={
                  item.type === 'device'
                    ? 'blue'
                    : item.type === 'user'
                      ? 'green'
                      : 'orange'
                }
              >
                {item.type === 'device'
                  ? intl.formatMessage({
                      id: 'pages.strategies.assignDevice',
                      defaultMessage: 'Device',
                    })
                  : item.type === 'user'
                    ? intl.formatMessage({
                        id: 'pages.strategies.assignUser',
                        defaultMessage: 'User',
                      })
                    : intl.formatMessage({
                        id: 'pages.strategies.assignDeviceGroup',
                        defaultMessage: 'Device Group',
                      })}
              </Tag>
              <span>{item.name}</span>
            </Space>
            <Popconfirm
              title={intl.formatMessage({
                id: 'pages.strategies.unassignConfirm',
                defaultMessage: 'Unassign this target?',
              })}
              onConfirm={() => handleUnassign(item.type, item.guid)}
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
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </div>
        ))}
      </div>
    );
  };

  return (
    <ModalForm
      title={
        <FormattedMessage
          id="pages.strategies.assignManagement"
          defaultMessage="Assign Management"
        />
      }
      open={open}
      onOpenChange={onOpenChange}
      submitter={false}
      modalProps={{ destroyOnClose: true }}
      width={560}
    >
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 500, marginBottom: 8 }}>
          <FormattedMessage
            id="pages.strategies.assignedTargets"
            defaultMessage="Assigned Targets"
          />
        </div>
        {renderAssignedList()}
      </div>

      <Divider />

      <div>
        <div style={{ fontWeight: 500, marginBottom: 8 }}>
          <FormattedMessage
            id="pages.strategies.addAssignment"
            defaultMessage="Add Assignment"
          />
        </div>
        <Radio.Group
          options={targetTypeOptions}
          value={targetType}
          onChange={(e) => {
            setTargetType(e.target.value);
            setSelectedGuids([]);
          }}
          optionType="button"
          buttonStyle="solid"
          style={{ marginBottom: 12 }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <Select
            mode="multiple"
            value={selectedGuids}
            onChange={setSelectedGuids}
            options={getSelectOptions()}
            loading={optionsLoading}
            showSearch
            optionFilterProp="label"
            maxCount={200}
            placeholder={intl.formatMessage({
              id: 'pages.strategies.selectTarget',
              defaultMessage: 'Select target',
            })}
            style={{ flex: 1 }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            loading={assignLoading}
            disabled={selectedGuids.length === 0}
            onClick={handleAssign}
          >
            <FormattedMessage
              id="pages.strategies.assign"
              defaultMessage="Assign"
            />
          </Button>
        </div>
      </div>
    </ModalForm>
  );
};

export default AssignModal;
