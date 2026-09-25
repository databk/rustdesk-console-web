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
  Tooltip,
} from 'antd';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  assignStrategy,
  getStrategyAssignments,
  getStrategyTargetCandidates,
  getStrategyTargetDeviceGroupList,
  unassignStrategy,
} from '@/services/rustdesk-console';
import {
  getAssignableStrategyTargetTypes,
  type StrategyAssignmentTargetType,
} from '../strategyAccess';
import { loadAllCandidatePages } from './pagination';

type TargetType = StrategyAssignmentTargetType;

interface AssignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: API.StrategyItem | null;
  canAssignUsers: boolean;
  onSuccess: () => void;
  isSuperAdmin?: boolean;
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
const TARGET_PAGE_SIZE = 200;

interface AssignedItem {
  type: TargetType;
  guid: string;
  name: string;
  extra?: string;
  isProtected?: boolean;
}

const AssignModal: React.FC<AssignModalProps> = ({
  open,
  onOpenChange,
  record,
  canAssignUsers,
  onSuccess,
  isSuperAdmin = false,
}) => {
  const intl = useIntl();
  const { message: msgApi } = App.useApp();
  const [targetType, setTargetType] = useState<TargetType>('device');
  const [selectedGuids, setSelectedGuids] = useState<string[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);

  const [deviceList, setDeviceList] = useState<
    API.StrategyTargetDeviceCandidate[]
  >([]);
  const [userList, setUserList] = useState<API.StrategyTargetUserCandidate[]>(
    [],
  );
  const [deviceGroupList, setDeviceGroupList] = useState<API.DeviceGroupItem[]>(
    [],
  );
  const [optionsLoading, setOptionsLoading] = useState(false);

  const [assignedItems, setAssignedItems] = useState<AssignedItem[]>([]);
  const [assignedLoading, setAssignedLoading] = useState(false);
  const assignedRequestVersionRef = useRef(0);
  const optionsRequestVersionRef = useRef(0);
  const assignableTargetTypes = useMemo(
    () =>
      getAssignableStrategyTargetTypes({
        canAssignUsers,
      }),
    [canAssignUsers],
  );

  const loadAssignedTargets = useCallback(async () => {
    const requestVersion = ++assignedRequestVersionRef.current;
    if (!open || !record) {
      setAssignedItems([]);
      return;
    }
    setAssignedLoading(true);
    try {
      const [deviceResult, userResult, groupResult] = await Promise.all([
        getStrategyAssignments(record.guid, {
          target_type: 'device',
          current: 1,
          pageSize: ASSIGNMENT_PAGE_SIZE,
        }),
        canAssignUsers
          ? getStrategyAssignments(record.guid, {
              target_type: 'user',
              current: 1,
              pageSize: ASSIGNMENT_PAGE_SIZE,
            })
          : Promise.resolve({ data: [], total: 0 }),
        getStrategyAssignments(record.guid, {
          target_type: 'device_group',
          current: 1,
          pageSize: ASSIGNMENT_PAGE_SIZE,
        }),
      ]);
      if (requestVersion !== assignedRequestVersionRef.current) return;

      const items: AssignedItem[] = [];

      deviceResult.data.forEach((device) => {
        items.push({
          type: 'device',
          guid: device.uuid,
          name: device.id,
        });
      });

      userResult.data.forEach((user) => {
        items.push({
          type: 'user',
          guid: user.guid,
          name: user.name,
          isProtected: user.is_protected,
        });
      });

      groupResult.data.forEach((group) => {
        items.push({
          type: 'device_group',
          guid: group.guid,
          name: group.name,
        });
      });

      setAssignedItems(items);
    } catch {
      if (requestVersion !== assignedRequestVersionRef.current) return;
      msgApi.error(
        intl.formatMessage({
          id: 'pages.strategies.loadAssignedFailed',
          defaultMessage: 'Failed to load assigned targets',
        }),
      );
    } finally {
      if (requestVersion === assignedRequestVersionRef.current)
        setAssignedLoading(false);
    }
  }, [canAssignUsers, open, record, intl, msgApi]);

  useEffect(() => {
    loadAssignedTargets();
  }, [loadAssignedTargets]);

  useEffect(() => {
    if (!open || assignableTargetTypes.includes(targetType)) return;
    setTargetType(assignableTargetTypes[0]);
    setSelectedGuids([]);
  }, [assignableTargetTypes, open, targetType]);

  useEffect(() => {
    const requestVersion = ++optionsRequestVersionRef.current;
    setSelectedGuids([]);
    setDeviceList([]);
    setUserList([]);
    setDeviceGroupList([]);
    if (!open || !assignableTargetTypes.includes(targetType)) {
      return;
    }
    setOptionsLoading(true);
    const loadOptions = async () => {
      try {
        switch (targetType) {
          case 'device': {
            const result = await loadAllCandidatePages((current) =>
              getStrategyTargetCandidates({
                target_type: 'device',
                current,
                pageSize: TARGET_PAGE_SIZE,
              }),
            );
            if (requestVersion !== optionsRequestVersionRef.current) return;
            setDeviceList(result);
            break;
          }
          case 'user': {
            const result = await loadAllCandidatePages((current) =>
              getStrategyTargetCandidates({
                target_type: 'user',
                current,
                pageSize: TARGET_PAGE_SIZE,
              }),
            );
            if (requestVersion !== optionsRequestVersionRef.current) return;
            setUserList(result);
            break;
          }
          case 'device_group': {
            const result = await loadAllCandidatePages((current) =>
              getStrategyTargetDeviceGroupList({
                current,
                pageSize: TARGET_PAGE_SIZE,
              }),
            );
            if (requestVersion !== optionsRequestVersionRef.current) return;
            setDeviceGroupList(result);
            break;
          }
        }
      } catch {
        if (requestVersion !== optionsRequestVersionRef.current) return;
        msgApi.error(
          intl.formatMessage({
            id: 'pages.strategies.loadTargetsFailed',
            defaultMessage: 'Failed to load targets',
          }),
        );
      } finally {
        if (requestVersion === optionsRequestVersionRef.current)
          setOptionsLoading(false);
      }
    };
    loadOptions();
  }, [assignableTargetTypes, intl, msgApi, open, targetType]);

  const handleAssign = async () => {
    if (!record || selectedGuids.length === 0) return;
    if (
      targetType === 'user' &&
      !isSuperAdmin &&
      selectedGuids.some((guid) =>
        userList.some(
          (user) => user.guid === guid && user.is_protected === true,
        ),
      )
    ) {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.users.protectedAccountInfo',
          defaultMessage:
            'Protected accounts can only be managed by the super administrator.',
        }),
      );
      setSelectedGuids((current) =>
        current.filter(
          (guid) =>
            !userList.some(
              (user) => user.guid === guid && user.is_protected === true,
            ),
        ),
      );
      return;
    }
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
    if (
      tType === 'user' &&
      !isSuperAdmin &&
      assignedItems.some(
        (item) =>
          item.type === 'user' &&
          item.guid === targetGuid &&
          item.isProtected === true,
      )
    ) {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.users.protectedAccountInfo',
          defaultMessage:
            'Protected accounts can only be managed by the super administrator.',
        }),
      );
      return;
    }
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
          value: d.uuid,
          label: d.id,
        }));
      case 'user':
        return userList.map((u) => ({
          value: u.guid,
          label: u.name,
          disabled: !isSuperAdmin && u.is_protected === true,
          title:
            !isSuperAdmin && u.is_protected === true
              ? intl.formatMessage({
                  id: 'pages.users.protectedAccountInfo',
                  defaultMessage:
                    'Protected accounts can only be managed by the super administrator.',
                })
              : undefined,
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
              <Tooltip
                title={
                  !isSuperAdmin && item.isProtected === true
                    ? intl.formatMessage({
                        id: 'pages.users.protectedAccountInfo',
                        defaultMessage:
                          'Protected accounts can only be managed by the super administrator.',
                      })
                    : undefined
                }
              >
                <span>
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    disabled={!isSuperAdmin && item.isProtected === true}
                  />
                </span>
              </Tooltip>
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
      modalProps={{ destroyOnHidden: true }}
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
          options={targetTypeOptions.filter((option) =>
            assignableTargetTypes.includes(option.value),
          )}
          value={targetType}
          onChange={(e) => {
            setTargetType(e.target.value);
            setSelectedGuids([]);
            setDeviceList([]);
            setUserList([]);
            setDeviceGroupList([]);
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
