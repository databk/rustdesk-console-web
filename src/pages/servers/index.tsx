import { PageContainer } from '@ant-design/pro-components';
import { useAccess, useIntl } from '@umijs/max';
import {
  Alert,
  App,
  Button,
  Card,
  Descriptions,
  Empty,
  Form,
  Input,
  Popconfirm,
  Select,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import React, { useEffect, useState } from 'react';
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

const Servers: React.FC = () => {
  const intl = useIntl();
  const zh = intl.locale.startsWith('zh');
  const t = (cn: string, en: string) => (zh ? cn : en);
  const access = useAccess();
  const { message } = App.useApp();
  const [nodes, setNodes] = useState<ServerNode[]>([]);
  const [node, setNode] = useState('');
  const [tab, setTab] = useState('overview');
  const [service, setService] = useState<ServerService>('hbbs');
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [peers, setPeers] = useState<ServerPeer[]>([]);
  const [sessions, setSessions] = useState<RelaySession[]>([]);
  const [logs, setLogs] = useState('');
  const [config, setConfig] = useState<ServerConfig>();
  const [configDirty, setConfigDirty] = useState(false);
  const [bans, setBans] = useState<ServerBans>();
  const [configForm] = Form.useForm<{ values: Record<string, string> }>();
  const [bansForm] = Form.useForm<{ deviceIds: string; ips: string }>();

  useEffect(() => {
    let active = true;
    let fetching = false;
    setLoading(true);
    setFailed(false);
    setPeers([]);
    setSessions([]);
    setLogs('');
    setConfig(undefined);
    setConfigDirty(false);
    setBans(undefined);
    const load = async (initial: boolean) => {
      if (fetching) return;
      fetching = true;
      try {
        const response = await getServerNodes();
        if (!active) return;
        setNodes(response.data);
        if (!node && response.data[0]) {
          setNode(response.data[0].id);
          return;
        }
        if (!node) return;
        if (tab === 'peers') {
          const response = await getServerPeers(node);
          if (active) setPeers(response.data);
        } else if (tab === 'sessions') {
          const response = await getRelaySessions(node);
          if (active) setSessions(response.data);
        } else if (tab === 'logs') {
          const response = await getServerLogs(node, service);
          if (active) setLogs(response.text);
        } else if (tab === 'config' && initial) {
          const response = await getServerConfig(node, service);
          if (active) {
            setConfig(response);
            configForm.resetFields();
            configForm.setFieldsValue({ values: response.values });
          }
        } else if (tab === 'bans') {
          const response = await getServerBans(node);
          if (active) {
            setBans(response);
            if (initial) {
              bansForm.setFieldsValue({
                deviceIds: response.device_ids.join('\n'),
                ips: response.ips.join('\n'),
              });
            }
          }
        }
        if (active) setFailed(false);
      } catch {
        if (active) setFailed(true);
      } finally {
        fetching = false;
        if (active) setLoading(false);
      }
    };
    void load(true);
    const timer = setInterval(() => {
      void load(false);
    }, 10000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [node, tab, service, revision, configForm, bansForm]);

  const run = async (operation: () => Promise<unknown>, success: string) => {
    setBusy(true);
    try {
      await operation();
      message.success(success);
      setRevision((value) => value + 1);
    } catch {
      message.error(
        t(
          '操作失败，请检查服务状态和日志。',
          'Operation failed. Check service status and logs.',
        ),
      );
    } finally {
      setBusy(false);
    }
  };
  const selected = nodes.find((item) => item.id === node);
  const serviceSelect = (
    <Select
      value={service}
      disabled={busy}
      onChange={setService}
      options={[
        { value: 'hbbs', label: 'hbbs' },
        { value: 'hbbr', label: 'hbbr' },
      ]}
    />
  );
  const overview = (
    <Space orientation="vertical" style={{ width: '100%' }} size="large">
      {!selected?.reachable && (
        <Alert
          type="warning"
          title={t(
            '节点不可达，无法确认服务状态。',
            'Node unreachable; service status is unknown.',
          )}
        />
      )}
      {selected?.services.map((item) => (
        <Card
          key={item.service}
          title={item.service}
          extra={
            <Tag color={item.available ? 'green' : 'orange'}>{item.state}</Tag>
          }
        >
          <Descriptions
            column={2}
            items={[
              {
                key: 'image',
                label: t('镜像', 'Image'),
                children: item.image || '—',
              },
              {
                key: 'version',
                label: t('版本', 'Version'),
                children: item.runtime?.version || '—',
              },
              {
                key: 'uptime',
                label: t('运行时间（秒）', 'Uptime (seconds)'),
                children: item.runtime?.uptime_seconds ?? '—',
              },
              {
                key: 'restarts',
                label: t('自动重启次数', 'Restart count'),
                children: item.restart_count ?? '—',
              },
              {
                key: 'key',
                label: t('公钥', 'Public key'),
                children: item.runtime?.public_key ? (
                  <Typography.Text copyable>
                    {item.runtime.public_key}
                  </Typography.Text>
                ) : (
                  '—'
                ),
                span: 2,
              },
            ]}
          />
          {access.canServersControl && (
            <Space wrap>
              <Button
                disabled={busy || item.running}
                onClick={() =>
                  void run(
                    () => controlServer(node, item.service, 'start'),
                    t('服务已启动。', 'Service started.'),
                  )
                }
              >
                {t('启动', 'Start')}
              </Button>
              {(['stop', 'restart'] as const).map((action) => (
                <Popconfirm
                  key={action}
                  title={t(
                    '操作将中断此服务上的连接，是否继续？',
                    'This will interrupt connections on this service. Continue?',
                  )}
                  onConfirm={() =>
                    run(
                      () => controlServer(node, item.service, action),
                      t('服务操作已完成。', 'Service operation completed.'),
                    )
                  }
                >
                  <Button
                    disabled={busy || !item.running}
                    danger={action === 'stop'}
                  >
                    {action === 'stop'
                      ? t('停止', 'Stop')
                      : t('重启', 'Restart')}
                  </Button>
                </Popconfirm>
              ))}
            </Space>
          )}
        </Card>
      ))}
    </Space>
  );
  const peerTable = (
    <Space orientation="vertical" style={{ width: '100%' }}>
      <Alert
        type="info"
        title={t(
          '此列表来自 hbbs 注册状态，与 Console 客户端心跳在线状态分别记录。',
          'These are hbbs registrations, tracked separately from Console client heartbeats.',
        )}
      />
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
      <Alert
        type="info"
        title={t(
          '仅显示 hbbr 中继会话。直连会话继续使用现有客户端心跳断开机制。',
          'Only hbbr relay sessions are shown. Direct connections use the existing client heartbeat disconnect mechanism.',
        )}
      />
      <Table<RelaySession>
        rowKey="uuid"
        dataSource={sessions}
        scroll={{ x: 1000 }}
        columns={[
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
                  render: (_: unknown, item: RelaySession) => (
                    <Popconfirm
                      title={t(
                        '关闭这条中继会话？',
                        'Close this relay session?',
                      )}
                      onConfirm={() =>
                        run(
                          () => disconnectRelaySession(node, item.uuid),
                          t('关闭请求已提交。', 'Session close requested.'),
                        )
                      }
                    >
                      <Button danger disabled={busy || item.closing}>
                        {item.closing
                          ? t('关闭中', 'Closing')
                          : t('断开', 'Disconnect')}
                      </Button>
                    </Popconfirm>
                  ),
                },
              ]
            : []),
        ]}
      />
    </Space>
  );
  const configuration = (
    <Space orientation="vertical" style={{ width: '100%' }}>
      {serviceSelect}
      {config && (
        <>
          <Alert
            type={configDirty || config.pending_restart ? 'warning' : 'info'}
            title={
              configDirty
                ? t(
                    '有未保存的修改，请先保存再应用。',
                    'Save your changes before applying configuration.',
                  )
                : config.pending_restart
                  ? t(
                      '已保存的配置尚未应用。',
                      'Saved configuration is pending application.',
                    )
                  : t(
                      '保存配置后需应用并重启才能生效。',
                      'Save, then apply and restart to activate configuration.',
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
            onValuesChange={() => setConfigDirty(true)}
            layout="vertical"
            disabled={busy}
            onFinish={(values) => {
              const settings = Object.fromEntries(
                Object.entries(values.values).filter(
                  ([, value]) => typeof value === 'string',
                ),
              );
              void run(
                () => saveServerConfig(node, service, settings),
                t(
                  '配置已保存，等待应用。',
                  'Configuration saved, pending application.',
                ),
              );
            }}
          >
            {config.schema.map((field) => (
              <Form.Item
                key={field.name}
                name={['values', field.name]}
                label={field.name}
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
            <Space>
              <Button htmlType="submit" type="primary" loading={busy}>
                {t('保存配置', 'Save configuration')}
              </Button>
              {access.canServersControl && (
                <Popconfirm
                  title={t(
                    '应用配置将重启服务并中断连接。继续？',
                    'Applying configuration restarts the service and interrupts connections. Continue?',
                  )}
                  onConfirm={() =>
                    run(
                      () => controlServer(node, service, 'apply'),
                      t('配置已应用。', 'Configuration applied.'),
                    )
                  }
                >
                  <Button disabled={busy || configDirty}>
                    {t('应用并重启', 'Apply and restart')}
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
    <Space orientation="vertical" style={{ width: '100%' }}>
      <Alert
        type="info"
        title={t(
          '设备 ID 规则限制注册和以该 ID 为目标的连接；IP 规则检查中继两端。现有直连无法由中继服务器关闭。',
          'Device ID rules block registration and connections targeting that ID. IP rules check both relay endpoints. Existing direct connections cannot be closed by the relay server.',
        )}
      />
      {bans && (
        <Space>
          {Object.entries(bans.synchronization).map(([name, status]) => (
            <Tag
              key={name}
              color={status.state === 'applied' ? 'green' : 'orange'}
            >
              {name}:{' '}
              {status.state === 'applied'
                ? t('已同步', 'Applied')
                : t('等待同步', 'Pending')}
            </Tag>
          ))}
        </Space>
      )}
      {bans && (
        <Form
          form={bansForm}
          layout="vertical"
          disabled={busy}
          onFinish={(values) => {
            const lines = (value: string) =>
              value
                .split('\n')
                .map((line) => line.trim())
                .filter(Boolean);
            void run(
              async () => {
                const result = await saveServerBans(node, {
                  device_ids: lines(values.deviceIds || ''),
                  ips: lines(values.ips || ''),
                });
                if (
                  Object.values(result.synchronization).some(
                    (status) => status.state === 'pending',
                  )
                )
                  message.warning(
                    t(
                      '部分服务离线，规则将在恢复后同步。',
                      'Some services are offline; rules will synchronize when they recover.',
                    ),
                  );
              },
              t('封禁规则已保存。', 'Ban rules saved.'),
            );
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
          <Button type="primary" htmlType="submit" loading={busy}>
            {t('保存并同步', 'Save and synchronize')}
          </Button>
        </Form>
      )}
    </Space>
  );

  return (
    <PageContainer
      title={t('服务器管理', 'Server management')}
      extra={[
        <Select
          key="node"
          value={node || undefined}
          placeholder={t('选择节点', 'Select a node')}
          disabled={busy}
          style={{ minWidth: 180 }}
          onChange={setNode}
          options={nodes.map((item) => ({ value: item.id, label: item.name }))}
        />,
        <Button
          key="refresh"
          disabled={busy}
          onClick={() => setRevision((value) => value + 1)}
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
      {!loading && nodes.length === 0 ? (
        <Empty
          description={t(
            '尚未配置服务器节点，请在后端设置 RUSTDESK_NODES。',
            'No server nodes configured. Set RUSTDESK_NODES in the backend.',
          )}
        />
      ) : (
        <Spin spinning={loading}>
          <Tabs
            activeKey={tab}
            onChange={busy ? undefined : setTab}
            items={[
              {
                key: 'overview',
                label: t('服务概览', 'Services'),
                children: overview,
              },
              {
                key: 'peers',
                label: t('注册设备', 'Registrations'),
                children: peerTable,
              },
              {
                key: 'sessions',
                label: t('中继会话', 'Relay sessions'),
                children: sessionTable,
              },
              {
                key: 'logs',
                label: t('日志', 'Logs'),
                children: (
                  <Space orientation="vertical" style={{ width: '100%' }}>
                    {serviceSelect}
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
                ),
              },
              ...(access.canServersConfig
                ? [
                    {
                      key: 'config',
                      label: t('配置', 'Configuration'),
                      children: configuration,
                    },
                  ]
                : []),
              ...(access.canServersBan
                ? [
                    {
                      key: 'bans',
                      label: t('封禁规则', 'Bans'),
                      children: banEditor,
                    },
                  ]
                : []),
            ]}
          />
        </Spin>
      )}
    </PageContainer>
  );
};

export default Servers;
