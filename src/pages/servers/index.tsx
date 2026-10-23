import { PageContainer } from '@ant-design/pro-components';
import { useAccess, useIntl } from '@umijs/max';
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  controlServer,
  disconnectRelaySession,
  getRelaySessions,
  getServerBans,
  getServerConfig,
  getServerLogs,
  getServerNodes,
  getServerPeers,
  type RelaySession,
  type ServerBans,
  type ServerConfig,
  type ServerNode,
  type ServerPeer,
  type ServerService,
  saveServerBans,
  saveServerConfig,
} from '@/services/rustdesk-console/server';
import NetworkSettings from './network';
import { useUnsavedChanges } from './useUnsavedChanges';

interface Instance {
  key: string;
  nodeId: string;
  service: ServerService;
  label: string;
}

type ManagedSession = RelaySession & { relay_id: string };
const ALL_RELAYS = '__all_relays__';
const primaryOf = (nodes: ServerNode[]) =>
  nodes.find((node) => node.services.some((item) => item.service === 'hbbs')) ??
  nodes.find((node) => !node.relay && node.services.length === 0);
const instancesOf = (nodes: ServerNode[]): Instance[] =>
  nodes.flatMap((node) =>
    node.services.map((item) => ({
      key: JSON.stringify([node.id, item.service]),
      nodeId: node.id,
      service: item.service,
      label: `${item.service} · ${node.name}`,
    })),
  );
const editableConfig = (config: ServerConfig) =>
  Object.fromEntries(
    config.schema.map((field) => [
      field.name,
      field.secret
        ? ''
        : (config.pending_restart_detail?.[field.name]?.pending ??
          config.values[field.name] ??
          ''),
    ]),
  );

const Servers: React.FC = () => {
  const intl = useIntl();
  const zh = intl.locale.startsWith('zh');
  const t = (cn: string, en: string) => (zh ? cn : en);
  const networkText = (key: string) =>
    intl.formatMessage({ id: `pages.servers.network.${key}` });
  const access = useAccess();
  const { message, modal } = App.useApp();
  const [nodes, setNodes] = useState<ServerNode[]>([]);
  const [target, setTarget] = useState<Instance | null>(null);
  const [relayFilter, setRelayFilter] = useState<string | null>(null);
  const [tab, setTab] = useState('overview');
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [peers, setPeers] = useState<ServerPeer[]>([]);
  const [sessions, setSessions] = useState<ManagedSession[]>([]);
  const [sessionFailures, setSessionFailures] = useState<string[]>([]);
  const [logs, setLogs] = useState('');
  const [config, setConfig] = useState<ServerConfig>();
  const [configDirty, setConfigDirty] = useState(false);
  const [bans, setBans] = useState<ServerBans>();
  const [bansOwner, setBansOwner] = useState<{ id: string; name: string }>();
  const [bansDirty, setBansDirty] = useState(false);
  const [configForm] = Form.useForm<{ values: Record<string, string> }>();
  const [bansForm] = Form.useForm<{ deviceIds: string; ips: string }>();
  const nodesRef = useRef(nodes);
  const targetRef = useRef(target);
  const configDirtyRef = useRef(false);
  const bansDirtyRef = useRef(false);
  const editVersion = useRef(0);
  const mutationVersion = useRef(0);
  const busyRef = useRef(false);
  const mounted = useRef(true);
  nodesRef.current = nodes;
  targetRef.current = target;
  const primary = primaryOf(nodes);
  const bansTargetChanged = !!bansOwner && bansOwner.id !== primary?.id;
  const instances = instancesOf(nodes);
  const selected = nodes.find((item) => item.id === target?.nodeId);
  const selectedService = selected?.services.find(
    (item) => item.service === target?.service,
  );
  const targetExists = !!selectedService;
  const targetReady = !!selected?.reachable && !!selectedService?.available;
  const relays = nodes.filter((node) =>
    node.services.some((item) => item.service === 'hbbr'),
  );
  const filterMissing =
    relayFilter !== null && !relays.some((node) => node.id === relayFilter);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const discardDrafts = useCallback(() => {
    editVersion.current += 1;
    if (configDirtyRef.current) {
      setConfig(undefined);
      configForm.resetFields();
    }
    if (bansDirtyRef.current) {
      setBans(undefined);
      setBansOwner(undefined);
      bansForm.resetFields();
    }
    configDirtyRef.current = false;
    bansDirtyRef.current = false;
    setConfigDirty(false);
    setBansDirty(false);
  }, [configForm, bansForm]);
  const confirmDiscard = useUnsavedChanges(
    configDirty || bansDirty,
    discardDrafts,
    configDirty ? target?.label || '' : t('全局封禁规则', 'global ban rules'),
    zh,
  );

  useEffect(() => {
    if (tab === 'config' && !access.canServersConfig) {
      configDirtyRef.current = false;
      setConfigDirty(false);
      setConfig(undefined);
      setTab('overview');
    }
    if (tab === 'bans' && !access.canServersBan) {
      bansDirtyRef.current = false;
      setBansDirty(false);
      setBans(undefined);
      setTab('overview');
    }
  }, [tab, access.canServersConfig, access.canServersBan]);

  useEffect(() => {
    if (!access.canServersView) {
      setLoading(false);
      return;
    }
    let active = true;
    let fetching = false;
    setLoading(true);
    setFailed(false);
    setPeers([]);
    setSessions([]);
    setSessionFailures([]);
    setLogs('');
    const load = async () => {
      if (fetching) return;
      fetching = true;
      const mutation = mutationVersion.current;
      try {
        const response = await getServerNodes();
        if (!active) return;
        const currentNodes = response.data;
        nodesRef.current = currentNodes;
        setNodes(currentNodes);
        if (!target) {
          const choices = instancesOf(currentNodes);
          setTarget(
            choices.find((item) => item.service === 'hbbs') ??
              choices[0] ??
              null,
          );
        }
        const currentPrimary = primaryOf(currentNodes);
        const currentTarget =
          target &&
          currentNodes.find(
            (item) =>
              item.id === target.nodeId &&
              item.services.some(
                (service) => service.service === target.service,
              ),
          );
        const current = () => active && mutation === mutationVersion.current;
        if (busyRef.current) return;
        if (tab === 'peers' && currentPrimary?.reachable) {
          const result = await getServerPeers(currentPrimary.id);
          if (current()) setPeers(result.data);
        } else if (tab === 'sessions') {
          const currentRelays = currentNodes.filter(
            (item) =>
              item.services.some((service) => service.service === 'hbbr') &&
              (relayFilter === null || item.id === relayFilter),
          );
          const results = await Promise.allSettled(
            currentRelays.map((item) =>
              item.reachable
                ? getRelaySessions(item.id)
                : Promise.reject(new Error('Relay unreachable')),
            ),
          );
          if (current()) {
            const merged: ManagedSession[] = [];
            const failures: string[] = [];
            results.forEach((result, index) => {
              const relay = currentRelays[index];
              if (result.status === 'fulfilled') {
                merged.push(
                  ...result.value.data.map((session) => ({
                    ...session,
                    relay_id: relay.id,
                  })),
                );
              } else failures.push(relay.name);
            });
            setSessions(merged);
            setSessionFailures(failures);
          }
        } else if (tab === 'logs' && target && currentTarget?.reachable) {
          const result = await getServerLogs(target.nodeId, target.service);
          if (current()) setLogs(result.text);
        } else if (
          tab === 'config' &&
          access.canServersConfig &&
          target &&
          currentTarget &&
          !configDirtyRef.current
        ) {
          const edits = editVersion.current;
          const result = await getServerConfig(target.nodeId, target.service);
          if (
            current() &&
            edits === editVersion.current &&
            !configDirtyRef.current
          ) {
            setConfig(result);
            configForm.resetFields();
            configForm.setFieldsValue({ values: editableConfig(result) });
          }
        } else if (
          tab === 'bans' &&
          access.canServersBan &&
          currentPrimary &&
          !bansDirtyRef.current
        ) {
          const edits = editVersion.current;
          const result = await getServerBans(currentPrimary.id);
          if (
            current() &&
            edits === editVersion.current &&
            !bansDirtyRef.current
          ) {
            setBans(result);
            setBansOwner({ id: currentPrimary.id, name: currentPrimary.name });
            bansForm.resetFields();
            bansForm.setFieldsValue({
              deviceIds: result.device_ids.join('\n'),
              ips: result.ips.join('\n'),
            });
          }
        }
        if (current()) setFailed(false);
      } catch {
        if (active) setFailed(true);
      } finally {
        fetching = false;
        if (active) setLoading(false);
      }
    };
    void load();
    const timer = setInterval(() => void load(), 10000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [
    tab,
    target?.key,
    relayFilter,
    revision,
    access.canServersView,
    access.canServersConfig,
    access.canServersBan,
    configForm,
    bansForm,
  ]);

  const run = async (operation: () => Promise<void>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    mutationVersion.current += 1;
    setBusy(true);
    try {
      await operation();
      if (mounted.current) setRevision((value) => value + 1);
    } catch {
      if (mounted.current)
        message.error(
          t(
            '操作失败，请检查目标实例的状态和日志。',
            'Operation failed. Check the target instance status and logs.',
          ),
        );
    } finally {
      busyRef.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  const requireInstance = (instance: Instance) => {
    const current = nodesRef.current.find(
      (item) => item.id === instance.nodeId,
    );
    if (
      !current?.reachable ||
      !current.services.some(
        (item) => item.service === instance.service && item.available,
      )
    ) {
      throw new Error('Target instance unavailable');
    }
  };
  const selectInstance = (instance: Instance, nextTab = tab) => {
    if (target?.key === instance.key && tab === nextTab) return;
    confirmDiscard(() => {
      setConfig(undefined);
      configForm.resetFields();
      setLogs('');
      setTarget(instance);
      setTab(nextTab);
    });
  };
  const instanceSelect = (
    <Select
      aria-label={t('服务实例', 'Service instance')}
      value={target?.key}
      placeholder={t('选择服务实例', 'Select a service instance')}
      disabled={busy || instances.length === 0}
      style={{ minWidth: 240, maxWidth: '100%' }}
      onChange={(key) => {
        const instance = instances.find((item) => item.key === key);
        if (instance) selectInstance(instance);
      }}
      options={[
        ...instances.map((item) => ({ value: item.key, label: item.label })),
        ...(target && !targetExists
          ? [
              {
                value: target.key,
                label: `${target.label} · ${t('不可用', 'Unavailable')}`,
                disabled: true,
              },
            ]
          : []),
      ]}
    />
  );
  const targetWarning =
    target && !targetExists ? (
      <Alert
        showIcon
        type="warning"
        title={t(
          `实例 ${target.label} 已不在当前服务列表中。请选择其他实例或等待其重新连接；不会自动切换操作目标。`,
          `Instance ${target.label} is no longer listed. Select another instance or wait for it to reconnect. The operation target will not change automatically.`,
        )}
      />
    ) : target && !targetReady ? (
      <Alert
        showIcon
        type="warning"
        title={t(
          `${target.label} 当前不可达，无法确认运行状态。`,
          `${target.label} is currently unreachable; runtime status cannot be confirmed.`,
        )}
      />
    ) : null;
  const managementUnavailable = (
    <Alert type="info" title={networkText('managementUnavailable')} />
  );
  const restart = (instance: Instance, apply = false) =>
    run(async () => {
      requireInstance(instance);
      await controlServer(
        instance.nodeId,
        instance.service,
        apply ? 'apply' : 'restart',
      );
      message.success(
        t(
          `${instance.label} 的重启请求已提交。`,
          `Restart requested for ${instance.label}.`,
        ),
      );
    });

  const overview = (
    <Space orientation="vertical" style={{ width: '100%' }} size="large">
      <Typography.Text type="secondary">
        {t(
          '同时查看主服务和全部中继；每张卡片的操作只针对该服务实例。',
          'View the primary service and every relay together. Card actions target that service instance only.',
        )}
      </Typography.Text>
      <Row gutter={[16, 16]}>
        {nodes.flatMap((item) => {
          if (!item.services.length)
            return [
              <Col xs={24} xl={12} key={item.id}>
                <Card
                  title={item.name}
                  extra={<Tag color="orange">{t('不可达', 'Unreachable')}</Tag>}
                >
                  {t(
                    '无法获取服务实例，请检查管理连接。',
                    'Service instances are unavailable. Check the management connection.',
                  )}
                </Card>
              </Col>,
            ];
          return item.services.map((service) => {
            const instance = instances.find(
              (entry) =>
                entry.nodeId === item.id && entry.service === service.service,
            );
            if (!instance) return null;
            const reachable = item.reachable && service.available;
            return (
              <Col xs={24} xl={12} key={instance.key}>
                <Card
                  role="region"
                  aria-label={instance.label}
                  style={{ height: '100%' }}
                  title={
                    <Space wrap>
                      <Tag color={service.service === 'hbbs' ? 'blue' : 'cyan'}>
                        {service.service}
                      </Tag>
                      {item.name}
                    </Space>
                  }
                  extra={
                    <Tag color={reachable ? 'green' : 'orange'}>
                      {reachable ? service.state : t('不可达', 'Unreachable')}
                    </Tag>
                  }
                >
                  <Descriptions
                    column={{ xs: 1, sm: 2 }}
                    items={[
                      {
                        key: 'version',
                        label: t('版本', 'Version'),
                        children: service.runtime?.version || '—',
                      },
                      {
                        key: 'uptime',
                        label: t('运行时间（秒）', 'Uptime (seconds)'),
                        children: service.runtime?.uptime_seconds ?? '—',
                      },
                      ...(service.runtime?.address
                        ? [
                            {
                              key: 'address',
                              label: t('中继地址', 'Relay address'),
                              children: service.runtime.address,
                            },
                          ]
                        : []),
                      ...(service.runtime?.sessions_count === undefined
                        ? []
                        : [
                            {
                              key: 'sessions',
                              label: t('中继会话', 'Relay sessions'),
                              children: service.runtime.sessions_count,
                            },
                          ]),
                      ...(service.image
                        ? [
                            {
                              key: 'image',
                              label: t('镜像', 'Image'),
                              children: service.image,
                            },
                          ]
                        : []),
                      ...(service.restart_count === undefined
                        ? []
                        : [
                            {
                              key: 'restarts',
                              label: t('自动重启次数', 'Restart count'),
                              children: service.restart_count,
                            },
                          ]),
                      ...(service.runtime?.public_key
                        ? [
                            {
                              key: 'key',
                              label: t('公钥', 'Public key'),
                              children: (
                                <Typography.Text
                                  copyable
                                  style={{ wordBreak: 'break-all' }}
                                >
                                  {service.runtime.public_key}
                                </Typography.Text>
                              ),
                              span: 2,
                            },
                          ]
                        : []),
                    ]}
                  />
                  <Space wrap>
                    <Button
                      disabled={busy}
                      onClick={() => selectInstance(instance, 'logs')}
                    >
                      {t('日志', 'Logs')}
                    </Button>
                    {access.canServersConfig && (
                      <Button
                        disabled={busy}
                        onClick={() => selectInstance(instance, 'config')}
                      >
                        {t('配置', 'Configuration')}
                      </Button>
                    )}
                    {access.canServersControl && (
                      <Popconfirm
                        title={t(
                          `重启 ${instance.label}？`,
                          `Restart ${instance.label}?`,
                        )}
                        description={t(
                          '将中断此实例正在处理的连接。',
                          'Connections handled by this instance will be interrupted.',
                        )}
                        onConfirm={() => restart(instance)}
                        okButtonProps={{ disabled: busy || !reachable }}
                      >
                        <Button disabled={busy || !reachable}>
                          {t('重启', 'Restart')}
                        </Button>
                      </Popconfirm>
                    )}
                  </Space>
                </Card>
              </Col>
            );
          });
        })}
      </Row>
      {tab === 'overview' && (
        <div>
          <Typography.Paragraph type="secondary">
            {t(
              '以下 TCP 信息来自 Console 后端运行环境。',
              'The TCP information below describes the environment running the Console backend.',
            )}
          </Typography.Paragraph>
          <NetworkSettings revision={revision} local />
        </div>
      )}
    </Space>
  );

  const peerTable = (
    <Space orientation="vertical" style={{ width: '100%' }}>
      <Alert
        type="info"
        title={t(
          `注册表来自 hbbs · ${primary?.name || ''}，与 Console 客户端心跳在线状态分别记录。`,
          `Registrations come from hbbs · ${primary?.name || ''}, tracked separately from Console client heartbeats.`,
        )}
      />
      {!primary?.reachable && (
        <Alert
          type="warning"
          title={t(
            '主服务不可达，无法获取当前注册表。',
            'The primary service is unreachable; current registrations are unavailable.',
          )}
        />
      )}
      <Table<ServerPeer>
        rowKey="id"
        dataSource={peers}
        scroll={{ x: 800 }}
        columns={[
          { title: 'ID', dataIndex: 'id' },
          { title: t('地址', 'Address'), dataIndex: 'address' },
          {
            title: t('注册状态', 'Registration'),
            render: (_, item) => (
              <Tag color={item.online ? 'green' : undefined}>
                {item.online ? t('在线', 'Online') : t('离线', 'Offline')}
              </Tag>
            ),
          },
          {
            title: t('封禁', 'Banned'),
            render: (_, item) => (item.banned ? t('是', 'Yes') : t('否', 'No')),
          },
          {
            title: t('距上次注册（秒）', 'Registration age (seconds)'),
            dataIndex: 'last_registration_age_seconds',
          },
        ]}
      />
    </Space>
  );
  const sessionTable = (
    <Space orientation="vertical" style={{ width: '100%' }}>
      <Select
        aria-label={t('筛选中继', 'Filter relays')}
        value={relayFilter === null ? ALL_RELAYS : JSON.stringify(relayFilter)}
        disabled={busy}
        style={{ minWidth: 240, maxWidth: '100%' }}
        options={[
          { value: ALL_RELAYS, label: t('全部中继', 'All relays') },
          ...relays.map((item) => ({
            value: JSON.stringify(item.id),
            label: `hbbr · ${item.name}`,
          })),
          ...(filterMissing
            ? [
                {
                  value: JSON.stringify(relayFilter),
                  label: `${relayFilter} · ${t('不可用', 'Unavailable')}`,
                  disabled: true,
                },
              ]
            : []),
        ]}
        onChange={(value) => {
          if (value === ALL_RELAYS) {
            setRelayFilter(null);
            return;
          }
          const relay = relays.find(
            (item) => JSON.stringify(item.id) === value,
          );
          if (!relay) return;
          setRelayFilter(relay.id);
          const instance = instances.find(
            (item) => item.nodeId === relay.id && item.service === 'hbbr',
          );
          if (instance) {
            setTarget(instance);
            setConfig(undefined);
            configForm.resetFields();
          }
        }}
      />
      <Alert
        type="info"
        title={t(
          '仅显示 hbbr 中继会话；断开操作只针对该行所属的中继。直连会话继续使用客户端心跳断开机制。',
          'Only hbbr relay sessions are shown. Disconnect targets the relay owning that row. Direct connections use the client heartbeat disconnect mechanism.',
        )}
      />
      {filterMissing && (
        <Alert
          showIcon
          type="warning"
          title={t(
            `中继 ${relayFilter} 已不在当前列表中，筛选目标保持不变。`,
            `Relay ${relayFilter} is no longer listed. The filter target has been preserved.`,
          )}
        />
      )}
      {primary && !primary.reachable && (
        <Alert
          type="warning"
          title={t(
            '主服务不可达，无法获取完整中继列表。',
            'The primary service is unreachable; the full relay list is unavailable.',
          )}
        />
      )}
      {relays.length === 0 && (
        <Alert
          showIcon
          type="warning"
          title={t(
            '未发现可查询的中继，暂时无法列出会话。请检查 hbbr 注册状态和管理连接。',
            'No queryable relays were discovered, so sessions cannot be listed. Check hbbr registration and the management connection.',
          )}
        />
      )}
      {sessionFailures.length > 0 && (
        <Alert
          showIcon
          type="warning"
          title={t(
            `以下中继的会话查询失败：${sessionFailures.join('、')}。当前结果不完整。`,
            `Session queries failed for ${sessionFailures.join(', ')}. Results are incomplete.`,
          )}
        />
      )}
      <Table<ManagedSession>
        rowKey={(item) => JSON.stringify([item.relay_id, item.uuid])}
        dataSource={sessions}
        scroll={{ x: 1200 }}
        columns={[
          {
            title: t('所属中继', 'Relay'),
            render: (_, item) =>
              nodes.find((entry) => entry.id === item.relay_id)?.name ||
              item.relay_id,
          },
          { title: 'UUID', dataIndex: 'uuid' },
          {
            title: t('请求中的目标 ID', 'Reported target ID'),
            render: (_, item) =>
              [item.target_id, item.peer_target_id]
                .filter(Boolean)
                .join(' / ') || '—',
          },
          {
            title: t('两端地址', 'Endpoints'),
            render: (_, item) => item.endpoints.join(' ↔ '),
          },
          { title: t('传输', 'Transport'), dataIndex: 'transport' },
          {
            title: t('开始时间', 'Started'),
            render: (_, item) =>
              new Date(item.started_at * 1000).toLocaleString(intl.locale),
          },
          { title: t('流量（字节）', 'Traffic (bytes)'), dataIndex: 'bytes' },
          { title: 'B/s', dataIndex: 'bytes_per_second' },
          ...(access.canServersDisconnect
            ? [
                {
                  title: t('操作', 'Action'),
                  render: (_: unknown, item: ManagedSession) => {
                    const owner = nodes.find(
                      (entry) => entry.id === item.relay_id,
                    );
                    const ready =
                      owner?.reachable &&
                      owner.services.some(
                        (entry) => entry.service === 'hbbr' && entry.available,
                      );
                    return (
                      <Popconfirm
                        title={t(
                          `关闭 ${owner?.name || item.relay_id} 上的这条中继会话？`,
                          `Close this relay session on ${owner?.name || item.relay_id}?`,
                        )}
                        onConfirm={() =>
                          run(async () => {
                            requireInstance({
                              key: '',
                              nodeId: item.relay_id,
                              service: 'hbbr',
                              label: owner?.name || item.relay_id,
                            });
                            await disconnectRelaySession(
                              item.relay_id,
                              item.uuid,
                            );
                            message.success(
                              t('关闭请求已提交。', 'Session close requested.'),
                            );
                          })
                        }
                        okButtonProps={{ disabled: busy || !ready }}
                      >
                        <Button
                          danger
                          disabled={busy || item.closing || !ready}
                        >
                          {item.closing
                            ? t('关闭中', 'Closing')
                            : t('断开', 'Disconnect')}
                        </Button>
                      </Popconfirm>
                    );
                  },
                },
              ]
            : []),
        ]}
      />
    </Space>
  );

  const configuration = (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      {instanceSelect}
      {targetWarning}
      {config && target && (
        <>
          <Alert
            type={configDirty || config.pending_restart ? 'warning' : 'info'}
            title={
              configDirty
                ? t(
                    '有未保存的修改。保存前不会应用这些修改。',
                    'There are unsaved changes. They will not be applied until saved.',
                  )
                : config.pending_restart
                  ? t(
                      `配置已保存；${target.label} 仍需重启以应用部分设置。`,
                      `Configuration saved; ${target.label} still needs a restart for some settings.`,
                    )
                  : t(
                      '动态设置保存后无需重启；标记为“需重启”的字段会在保存后提示。',
                      'Dynamic settings do not require a restart after saving. Fields marked “Restart required” will be identified after saving.',
                    )
            }
          />
          {!config.available && (
            <Alert
              type="warning"
              title={t(
                '服务离线，展示已保存配置；未设置的字段沿用部署参数。',
                'Service offline. Saved overrides are shown; unset fields retain deployment settings.',
              )}
            />
          )}
          <Form
            form={configForm}
            layout="vertical"
            disabled={busy || !targetReady}
            onValuesChange={() => {
              editVersion.current += 1;
              configDirtyRef.current = true;
              setConfigDirty(true);
            }}
            onFinish={(values) => {
              const instance = target;
              const settings = Object.fromEntries(
                Object.entries(values.values || {}).filter(([name, value]) => {
                  if (typeof value !== 'string') return false;
                  const field = config.schema.find(
                    (entry) => entry.name === name,
                  );
                  return (
                    !field?.secret ||
                    (value !== '' &&
                      value !== '__REDACTED__' &&
                      value !== '<redacted>')
                  );
                }),
              );
              void run(async () => {
                requireInstance(instance);
                const result = await saveServerConfig(
                  instance.nodeId,
                  instance.service,
                  settings,
                );
                if (!mounted.current || targetRef.current?.key !== instance.key)
                  return;
                editVersion.current += 1;
                configDirtyRef.current = false;
                setConfigDirty(false);
                setConfig(result);
                configForm.resetFields();
                configForm.setFieldsValue({ values: editableConfig(result) });
                message.success(
                  result.pending_restart
                    ? t(
                        `${instance.label} 的配置已保存，部分设置需重启。`,
                        `Configuration saved for ${instance.label}; some settings require a restart.`,
                      )
                    : t(
                        `${instance.label} 的动态配置已保存，无需重启。`,
                        `Dynamic configuration saved for ${instance.label}; no restart is required.`,
                      ),
                );
              });
            }}
          >
            {config.schema.map((field) => (
              <Form.Item
                key={field.name}
                name={['values', field.name]}
                label={
                  <Space wrap>
                    {field.name}
                    <Tag color={field.restart_required ? 'orange' : 'blue'}>
                      {field.restart_required
                        ? t('需重启', 'Restart required')
                        : t('动态设置', 'Dynamic setting')}
                    </Tag>
                  </Space>
                }
                extra={
                  field.minimum === undefined
                    ? undefined
                    : `${field.minimum} – ${field.maximum}`
                }
              >
                {field.secret ? (
                  <Input.Password
                    autoComplete="new-password"
                    placeholder={t(
                      '保留现有值，或输入新值',
                      'Keep the existing value or enter a replacement',
                    )}
                  />
                ) : (
                  <Input placeholder={field.default} />
                )}
              </Form.Item>
            ))}
            <Space wrap>
              <Button
                htmlType="submit"
                type="primary"
                loading={busy}
                disabled={!targetReady || !configDirty}
              >
                {t('保存配置', 'Save configuration')}
              </Button>
              {access.canServersControl && config.pending_restart && (
                <Popconfirm
                  title={t(
                    `重启 ${target.label} 以应用已保存的设置？`,
                    `Restart ${target.label} to apply saved settings?`,
                  )}
                  description={t(
                    '将中断此实例正在处理的连接。',
                    'Connections handled by this instance will be interrupted.',
                  )}
                  onConfirm={() => restart(target, true)}
                  okButtonProps={{
                    disabled: busy || configDirty || !targetReady,
                  }}
                >
                  <Button disabled={busy || configDirty || !targetReady}>
                    {t('重启并应用', 'Restart to apply')}
                  </Button>
                </Popconfirm>
              )}
            </Space>
          </Form>
        </>
      )}
    </Space>
  );
  const banEditor = (
    <Space orientation="vertical" style={{ width: '100%' }} size={16}>
      <Alert
        type="info"
        title={t(
          `作用范围：hbbs · ${bansOwner?.name || primary?.name || ''} 及它管理的全部 hbbr。这里保存的是整组封禁规则。`,
          `Scope: hbbs · ${bansOwner?.name || primary?.name || ''} and every hbbr it manages. Saving replaces the complete ban rule set.`,
        )}
        description={t(
          '设备 ID 规则限制注册和以该 ID 为目标的连接；IP 规则检查中继两端。现有直连无法由中继服务器关闭。',
          'Device ID rules block registration and connections targeting that ID. IP rules check both relay endpoints. Existing direct connections cannot be closed by the relay server.',
        )}
      />
      {bansTargetChanged && (
        <Alert
          showIcon
          type="warning"
          title={t(
            '主服务已变更。这份封禁规则仍属于原主服务，无法保存到新目标；请刷新并确认放弃草稿后重新读取。',
            'The primary service has changed. These ban rules still belong to the previous primary and cannot be saved to the new target. Refresh and discard the draft to reload.',
          )}
        />
      )}
      {bans && (
        <>
          <Space wrap>
            {Object.entries(bans.synchronization).map(([name, status]) => (
              <Tag
                key={name}
                color={status.state === 'pending' ? 'orange' : 'blue'}
              >
                {name}:{' '}
                {status.state === 'pending'
                  ? t('等待同步', 'Pending')
                  : name === 'hbbr'
                    ? t('由主服务同步', 'Managed by hbbs')
                    : t('已应用', 'Applied')}
              </Tag>
            ))}
          </Space>
          <Typography.Text type="secondary">
            {t(
              '封禁规则由 hbbs 统一下发；当前页面不提供逐台中继的同步确认。',
              'Ban rules are distributed by hbbs. This page does not confirm synchronization for each individual relay.',
            )}
          </Typography.Text>
          {bansDirty && (
            <Alert
              type="warning"
              title={t(
                '封禁规则有未保存的修改。',
                'Ban rules have unsaved changes.',
              )}
            />
          )}
          <Form
            form={bansForm}
            layout="vertical"
            disabled={busy || !primary?.reachable || bansTargetChanged}
            onValuesChange={() => {
              editVersion.current += 1;
              bansDirtyRef.current = true;
              setBansDirty(true);
            }}
            onFinish={(values) => {
              if (!bansOwner || bansTargetChanged) return;
              const nodeId = bansOwner.id;
              const lines = (value: string) =>
                value
                  .split('\n')
                  .map((line) => line.trim())
                  .filter(Boolean);
              const rules = {
                device_ids: lines(values.deviceIds || ''),
                ips: lines(values.ips || ''),
              };
              modal.confirm({
                title: t(
                  '替换整组封禁规则？',
                  'Replace the complete ban rule set?',
                ),
                content: t(
                  `本次保存将作用于 hbbs · ${bansOwner.name} 及它管理的全部 hbbr，而非单台中继。`,
                  `This save affects hbbs · ${bansOwner.name} and every hbbr it manages, rather than one relay.`,
                ),
                okText: t('确认保存规则', 'Save rules'),
                cancelText: t('继续编辑', 'Keep editing'),
                onOk: () =>
                  run(async () => {
                    const currentPrimary = primaryOf(nodesRef.current);
                    if (
                      !currentPrimary?.reachable ||
                      currentPrimary.id !== nodeId
                    )
                      throw new Error('Primary unavailable');
                    const result = await saveServerBans(nodeId, rules);
                    if (!mounted.current) return;
                    editVersion.current += 1;
                    bansDirtyRef.current = false;
                    setBansDirty(false);
                    setBans(result);
                    bansForm.resetFields();
                    bansForm.setFieldsValue({
                      deviceIds: result.device_ids.join('\n'),
                      ips: result.ips.join('\n'),
                    });
                    message.success(
                      t('全局封禁规则已保存。', 'Global ban rules saved.'),
                    );
                    if (
                      Object.values(result.synchronization).some(
                        (status) => status.state === 'pending',
                      )
                    )
                      message.warning(
                        t(
                          '部分规则仍在等待同步。',
                          'Some rules are still waiting to synchronize.',
                        ),
                      );
                  }),
              });
            }}
          >
            <Form.Item
              name="deviceIds"
              label={t('设备 ID（每行一个）', 'Device IDs (one per line)')}
            >
              <Input.TextArea rows={6} />
            </Form.Item>
            <Form.Item
              name="ips"
              label={t('IP 地址（每行一个）', 'IP addresses (one per line)')}
            >
              <Input.TextArea rows={6} />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={busy}
              disabled={!primary?.reachable || !bansDirty || bansTargetChanged}
            >
              {t('保存规则', 'Save rules')}
            </Button>
          </Form>
        </>
      )}
    </Space>
  );

  if (!access.canServersView)
    return (
      <Alert
        type="warning"
        title={t(
          '无权查看服务器管理。',
          'You do not have permission to view server management.',
        )}
      />
    );
  return (
    <PageContainer
      title={t('服务器管理', 'Server management')}
      extra={[
        <Button
          key="refresh"
          disabled={busy}
          onClick={() =>
            confirmDiscard(() => setRevision((value) => value + 1))
          }
        >
          {t('刷新', 'Refresh')}
        </Button>,
      ]}
    >
      {failed && (
        <Alert
          type="error"
          showIcon
          title={t(
            '无法获取服务数据，当前内容可能已过期。',
            'Unable to fetch service data. Displayed information may be stale.',
          )}
          style={{ marginBottom: 16 }}
        />
      )}
      {!loading && nodes.length === 0 && (
        <Alert
          type="info"
          showIcon
          title={networkText('managementUnavailable')}
          description={networkText('managementSetup')}
          style={{ marginBottom: 16 }}
        />
      )}
      <Spin spinning={loading}>
        <Tabs
          activeKey={tab}
          destroyOnHidden
          onChange={
            busy ? undefined : (next) => confirmDiscard(() => setTab(next))
          }
          items={[
            {
              key: 'overview',
              label: t('服务概览', 'Services'),
              children: overview,
            },
            {
              key: 'peers',
              label: t('注册设备', 'Registrations'),
              children: primary ? peerTable : managementUnavailable,
            },
            {
              key: 'sessions',
              label: t('中继会话', 'Relay sessions'),
              children: nodes.length ? sessionTable : managementUnavailable,
            },
            {
              key: 'logs',
              label: t('日志', 'Logs'),
              children: target ? (
                <Space orientation="vertical" style={{ width: '100%' }}>
                  {instanceSelect}
                  {targetWarning}
                  <pre
                    style={{
                      maxHeight: 600,
                      overflow: 'auto',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {logs}
                  </pre>
                </Space>
              ) : (
                managementUnavailable
              ),
            },
            ...(access.canServersConfig
              ? [
                  {
                    key: 'config',
                    label: t('配置', 'Configuration'),
                    children: target ? configuration : managementUnavailable,
                  },
                ]
              : []),
            ...(access.canServersBan
              ? [
                  {
                    key: 'bans',
                    label: t('封禁规则', 'Bans'),
                    children: primary ? banEditor : managementUnavailable,
                  },
                ]
              : []),
          ]}
        />
      </Spin>
    </PageContainer>
  );
};

export default Servers;
