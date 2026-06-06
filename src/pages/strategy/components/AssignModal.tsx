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
  Spin,
  Tag,
} from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import {
  assignStrategy,
  getDeviceGroupList,
  getDeviceList,
  getAdminUserList,
  getStrategyAssignments,
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

const ASSIGNMENT_PAGE_SIZE = 200;

interface AssignedItem {
  type: TargetType;
  guid: string;
  name: string;
  extra?: string;
}

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

  const [assignedItems, setAssignedItems] = useState<AssignedItem[]>([]);
  const [assignedLoading, setAssignedLoading] = useState(false);

  const loadAssignedTargets = useCallback(async () => {
    if (!open || !record) return;
    setAssignedLoading(true);
    try {
      const [deviceResult, userResult, groupResult] = await Promise.all([
        getStrategyAssignments(record.guid, {
          target_type: 'device',
          current: 1,
          pageSize: ASSIGNMENT_PAGE_SIZE,
        }),
        getStrategyAssignments(record.guid, {
          target_type: 'user',
          current: 1,
          pageSize: ASSIGNMENT_PAGE_SIZE,
        }),
        getStrategyAssignments(record.guid, {
          target_type: 'device_group',
          current: 1,
          pageSize: ASSIGNMENT_PAGE_SIZE,
        }),
      ]);

      const items: AssignedItem[] = [];

      (deviceResult.data || []).forEach((d) => {
        const device = d as API.StrategyAssignmentDeviceItem;
        items.push({
          type: 'device',
          guid: device.uuid,
          name: device.id,
        });
      });

      (userResult.data || []).forEach((u) => {
        const user = u as API.StrategyAssignmentUserItem;
        items.push({
          type: 'user',
          guid: user.guid,
          name: user.username,
          extra: user.email,
        });
      });

      (groupResult.data || []).forEach((g) => {
        const group = g as API.StrategyAssignmentDeviceGroupItem;
        items.push({
          type: 'device_group',
          guid: group.guid,
          name: group.name,
          extra: group.note,
        });
      });

      setAssignedItems(items);
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.strategies.loadAssignedFailed',
          defaultMessage: 'Failed to load assigned targets',
        }),
      );
    } finally {
      setAssignedLoading(false);
    }
  }, [open, record, intl, msgApi]);

  useEffect(() => {
    loadAssignedTargets();
  }, [loadAssignedTargets]);

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
            const result = await getAdminUserList({
              current: 1,
              pageSize: 200,
            });
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
      loadAssignedTargets();
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
      loadAssignedTargets();
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
    if (assignedLoading) {
      return (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Spin />
        </div>
      );
    }

    if (assignedItems.length === 0) {
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
        {assignedItems.map((item) => (
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
              {item.extra && (
                <span style={{ color: '#999', fontSize: 12 }}>
                  {item.extra}
                </span>
              )}
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
