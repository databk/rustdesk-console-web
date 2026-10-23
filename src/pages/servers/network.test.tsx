/** @jest-environment jsdom */
import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { history } from '@umijs/max';
import { App } from 'antd';
import React from 'react';
import {
  controlServer,
  disconnectRelaySession,
  getRelaySessions,
  getServerBans,
  getServerConfig,
  getServerLogs,
  getServerNodes,
  getServerPeers,
  getTcpNetwork,
  saveServerBans,
  saveServerConfig,
} from '@/services/rustdesk-console/server';
import { unavailableTcp } from '@/services/rustdesk-console/tcpObservation';

type TcpObservation =
  import('@/services/rustdesk-console/tcpObservation').TcpObservation;
type ServerNode = import('@/services/rustdesk-console/server').ServerNode;

import Servers from './index';
import NetworkSettings from './network';

const mockAccess = {
  canAdmin: false,
  canServersView: true,
  canServersConfig: false,
  canServersControl: false,
  canServersBan: false,
  canServersDisconnect: false,
};
jest.mock('@umijs/max', () => ({
  request: jest.fn(),
  history: { block: jest.fn(() => jest.fn()) },
  useAccess: () => mockAccess,
  useIntl: () => ({
    locale: 'en-US',
    formatMessage: ({
      id,
      defaultMessage,
    }: {
      id: string;
      defaultMessage?: string;
    }) =>
      jest.requireActual<{ default: Record<string, string> }>(
        '@/locales/en-US/serverNetwork',
      ).default[id] ||
      defaultMessage ||
      id,
  }),
}));
jest.mock('@ant-design/pro-components', () => {
  const runtime = jest.requireActual<{
    createElement: (...args: unknown[]) => unknown;
  }>('react');
  return {
    PageContainer: ({
      children,
      extra,
    }: {
      children: unknown;
      extra: unknown;
    }) => runtime.createElement('div', null, extra, children),
  };
});
jest.mock('@/services/rustdesk-console/server', () => ({
  ...jest.requireActual<typeof import('@/services/rustdesk-console/server')>(
    '@/services/rustdesk-console/server',
  ),
  getServerNodes: jest.fn(),
  getServerConfig: jest.fn(),
  getServerLogs: jest.fn(),
  getRelaySessions: jest.fn(),
  getServerPeers: jest.fn(),
  getServerBans: jest.fn(),
  saveServerBans: jest.fn(),
  saveServerConfig: jest.fn(),
  controlServer: jest.fn(),
  disconnectRelaySession: jest.fn(),
  getTcpNetwork: jest.fn(),
}));
const getNetwork = jest.mocked(getTcpNetwork);
const state: TcpObservation = {
  ...unavailableTcp('system', 'source_unavailable'),
  status: 'identified',
  algorithm: 'cubic',
  reason: null,
  algorithms: ['reno', 'cubic', 'bbr'],
  algorithms_verified: true,
  environment: {
    system: 'linux',
    release: '6.8',
    deployment: 'container',
    network_mode: 'unknown',
    scope: 'container',
    source: 'sysctl',
  },
};
beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: jest.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
  getNetwork.mockReset().mockResolvedValue(state);
  mockAccess.canServersConfig = false;
  mockAccess.canServersControl = false;
  mockAccess.canServersBan = false;
  mockAccess.canServersDisconnect = false;
  mockAccess.canServersView = true;
  jest.mocked(history.block).mockClear();
  jest.mocked(getServerPeers).mockReset().mockResolvedValue({ data: [] });
  jest.mocked(getRelaySessions).mockReset().mockResolvedValue({ data: [] });
  jest
    .mocked(getServerBans)
    .mockReset()
    .mockResolvedValue({
      device_ids: [],
      ips: [],
      synchronization: {
        hbbs: { state: 'applied' },
        hbbr: { state: 'applied' },
      },
    });
  jest
    .mocked(saveServerBans)
    .mockReset()
    .mockImplementation(async (_, values) => ({
      ...values,
      synchronization: {
        hbbs: { state: 'applied' },
        hbbr: { state: 'applied' },
      },
    }));
  jest
    .mocked(controlServer)
    .mockReset()
    .mockResolvedValue({ state: 'restarting' });
  jest
    .mocked(disconnectRelaySession)
    .mockReset()
    .mockResolvedValue({ state: 'closing' });
  jest
    .mocked(saveServerConfig)
    .mockReset()
    .mockImplementation(async (node, service) =>
      getServerConfig(node, service),
    );
  jest.mocked(getServerNodes).mockReset().mockResolvedValue({ data: [] });
  jest
    .mocked(getServerLogs)
    .mockReset()
    .mockImplementation(async (node, service) => ({
      text: `${node}/${service} logs`,
    }));
  jest
    .mocked(getServerConfig)
    .mockReset()
    .mockImplementation(async (node, service) => ({
      values: { setting: `${node}/${service}` },
      effective_values: null,
      available: true,
      pending_restart: false,
      schema: [
        {
          name: 'setting',
          default: '',
          kind: 'string',
          secret: false,
          restart_required: false,
        },
      ],
    }));
});
afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
});
test('one readonly row has no selector/apply control; both information buttons support focus and click', async () => {
  render(React.createElement(NetworkSettings, { node: 'node', revision: 0 }));
  await screen.findByText('CUBIC');
  expect(screen.queryByRole('combobox')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Apply' })).toBeNull();
  const about = screen.getByRole('button', {
    name: 'About TCP congestion control',
  });
  fireEvent.focus(about);
  await screen.findByText(/Make changes in the relevant system/);
  fireEvent.blur(about);
  fireEvent.click(
    screen.getByRole('button', { name: 'Algorithm identification details' }),
  );
  await screen.findByText(
    'Reading scope: the network environment of the enrolled management node.',
  );
  expect(screen.queryByText(/unknown network mode/)).toBeNull();
  expect(screen.getByRole('table')).toBeTruthy();
  expect(screen.getByText('Currently available algorithms')).toBeTruthy();
});
test('unknown result explains the source failure and does not invent supported algorithms for an unknown OS', async () => {
  getNetwork.mockResolvedValueOnce(
    unavailableTcp('system', 'permission_denied'),
  );
  render(React.createElement(NetworkSettings, { node: 'node', revision: 0 }));
  await screen.findByText('Unable to identify');
  fireEvent.click(
    screen.getByRole('button', { name: 'Algorithm identification details' }),
  );
  await screen.findByText('The service cannot read this network scope.');
  expect(screen.queryByRole('table')).toBeNull();
});
test('node changes cancel old requests and discard late readings', async () => {
  let resolve: (state: TcpObservation) => void = () => {};
  getNetwork.mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  const view = render(
    React.createElement(NetworkSettings, { node: 'old', revision: 0 }),
  );
  const oldSignal = getNetwork.mock.calls[0][1]?.signal;
  view.rerender(
    React.createElement(NetworkSettings, { node: 'new', revision: 0 }),
  );
  await screen.findByText('CUBIC');
  expect(oldSignal?.aborted).toBe(true);
  await act(async () => resolve({ ...state, algorithm: 'bbr' }));
  expect(screen.queryByText('BBR')).toBeNull();
});
test('network information is available without installing an extra node agent', async () => {
  renderServers();
  await screen.findByText('CUBIC');
  expect(getNetwork).toHaveBeenCalledWith(
    undefined,
    expect.objectContaining({ signal: expect.any(AbortSignal) }),
  );
  expect(screen.getByText('Network settings')).toBeTruthy();
  for (const name of ['Services', 'Registrations', 'Relay sessions', 'Logs'])
    expect(screen.getByRole('tab', { name })).toBeTruthy();
  expect(screen.getByText('Server management is not connected')).toBeTruthy();
  fireEvent.click(screen.getByRole('tab', { name: 'Registrations' }));
  expect(screen.queryByRole('button', { name: 'Restart' })).toBeNull();
});

test('local management identifies the Console scope and labels the value with a colon', async () => {
  const view = render(
    React.createElement(NetworkSettings, {
      node: 'local',
      local: true,
      revision: 0,
    }),
  );
  await screen.findByText('CUBIC');
  expect(view.container.textContent).toContain('TCP congestion control:CUBIC');
  fireEvent.click(
    screen.getByRole('button', { name: 'Algorithm identification details' }),
  );
  await screen.findByText(
    'Reading scope: the network environment running Console.',
  );
  expect(screen.queryByText(/unknown network mode/)).toBeNull();
});
test('the readonly Console network card is visible with servers.view without administrator mutation powers', async () => {
  jest.mocked(getServerNodes).mockResolvedValue({
    data: [
      {
        id: 'node',
        name: 'Node',
        reachable: true,
        services: [
          { service: 'hbbs', state: 'running', available: true },
          { service: 'hbbr', state: 'running', available: true },
        ],
      },
    ],
  });
  renderServers();
  await screen.findByText('CUBIC');
  const hbbr = screen.getByText('hbbr');
  const network = screen.getByText('Network settings');
  expect(
    hbbr.compareDocumentPosition(network) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Restart' })).toBeNull();
});

const managementNodes: ServerNode[] = [
  {
    id: 'primary',
    name: 'Primary',
    reachable: true,
    services: [{ service: 'hbbs', state: 'running', available: true }],
  },
  {
    id: 'relay-1',
    name: 'Relay',
    relay: true,
    reachable: true,
    services: [{ service: 'hbbr', state: 'running', available: true }],
  },
  {
    id: 'relay-2',
    name: 'Relay 2',
    relay: true,
    reachable: true,
    services: [{ service: 'hbbr', state: 'running', available: true }],
  },
];

function renderServers() {
  return render(React.createElement(App, null, React.createElement(Servers)));
}
async function openFleet() {
  jest.mocked(getServerNodes).mockResolvedValue({ data: managementNodes });
  const view = renderServers();
  await screen.findByText('CUBIC');
  return view;
}
async function choose(label: string, name = 'Service instance') {
  fireEvent.mouseDown(screen.getByRole('combobox', { name }));
  fireEvent.click(
    await screen.findByText(label, {
      selector: '.ant-select-item-option-content',
    }),
  );
}
function poller() {
  const original = global.setInterval;
  let poll: () => void = () => {};
  jest.spyOn(global, 'setInterval').mockImplementation(((
    handler: () => void,
    delay: number,
  ) => {
    if (delay === 10000) poll = handler;
    return original(handler, delay);
  }) as typeof setInterval);
  return async () => act(async () => poll());
}
function configValue(
  value: string,
  pending = false,
): import('@/services/rustdesk-console/server').ServerConfig {
  return {
    values: { setting: value },
    effective_values: { setting: value },
    available: true,
    pending_restart: pending,
    schema: [
      {
        name: 'setting',
        default: '',
        kind: 'string',
        secret: false,
        restart_required: false,
      },
    ],
  };
}
const relaySession = (
  uuid: string,
): import('@/services/rustdesk-console/server').RelaySession => ({
  uuid,
  target_id: '123',
  peer_target_id: '456',
  endpoints: ['a', 'b'],
  transport: 'tcp',
  started_at: 1,
  bytes: 4,
  bytes_per_second: 2,
  closing: false,
});

test('a relay-only deployment requests hbbr logs on first selection', async () => {
  jest.mocked(getServerNodes).mockResolvedValue({ data: [managementNodes[1]] });
  renderServers();
  await screen.findByText('CUBIC');
  fireEvent.click(screen.getByRole('tab', { name: 'Logs' }));
  await screen.findByText('relay-1/hbbr logs');
  expect(getServerLogs).toHaveBeenCalledWith('relay-1', 'hbbr');
  expect(getServerLogs).not.toHaveBeenCalledWith('relay-1', 'hbbs');
});

test('overview displays all instances without a global selector or unsupported lifecycle actions', async () => {
  mockAccess.canServersControl = true;
  mockAccess.canServersConfig = true;
  await openFleet();
  expect(screen.queryByRole('combobox')).toBeNull();
  expect(screen.getAllByRole('button', { name: 'Restart' })).toHaveLength(3);
  expect(screen.queryByRole('button', { name: 'Start' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Stop' })).toBeNull();
  const relay = screen.getByRole('region', { name: 'hbbr · Relay 2' });
  fireEvent.click(within(relay).getByRole('button', { name: 'Logs' }));
  await screen.findByText('relay-2/hbbr logs');
  fireEvent.click(screen.getByRole('tab', { name: 'Configuration' }));
  await screen.findByDisplayValue('relay-2/hbbr');
  expect(getServerConfig).toHaveBeenLastCalledWith('relay-2', 'hbbr');
});

test('logs and configuration share a local instance and never request invalid service pairs', async () => {
  mockAccess.canServersConfig = true;
  await openFleet();
  fireEvent.click(screen.getByRole('tab', { name: 'Logs' }));
  await screen.findByText('primary/hbbs logs');
  await choose('hbbr · Relay');
  await screen.findByText('relay-1/hbbr logs');
  fireEvent.click(screen.getByRole('tab', { name: 'Configuration' }));
  await screen.findByDisplayValue('relay-1/hbbr');
  await choose('hbbs · Primary');
  await screen.findByDisplayValue('primary/hbbs');
  expect(getServerLogs).not.toHaveBeenCalledWith('primary', 'hbbr');
  expect(getServerLogs).not.toHaveBeenCalledWith('relay-1', 'hbbs');
  expect(getServerConfig).not.toHaveBeenCalledWith('primary', 'hbbr');
  expect(getServerConfig).not.toHaveBeenCalledWith('relay-1', 'hbbs');
});

test('a disappeared instance keeps its identity and draft while disabling mutations', async () => {
  const poll = poller();
  mockAccess.canServersConfig = true;
  await openFleet();
  fireEvent.click(
    within(screen.getByRole('region', { name: 'hbbr · Relay' })).getByRole(
      'button',
      { name: 'Configuration' },
    ),
  );
  const input = await screen.findByDisplayValue('relay-1/hbbr');
  fireEvent.change(input, { target: { value: 'unsaved-relay' } });
  jest.mocked(getServerNodes).mockResolvedValue({
    data: managementNodes.filter((node) => node.id !== 'relay-1'),
  });
  await poll();
  await screen.findByText(/Instance hbbr · Relay is no longer listed/);
  expect(screen.getByDisplayValue('unsaved-relay')).toBeTruthy();
  expect(
    (
      screen.getByRole('button', {
        name: 'Save configuration',
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  expect(getServerConfig).not.toHaveBeenCalledWith('primary', 'hbbr');
  expect(saveServerConfig).not.toHaveBeenCalled();
});

test('all relay sessions merge with ownership, filter locally, and disconnect through their owning relay', async () => {
  mockAccess.canServersDisconnect = true;
  jest.mocked(getRelaySessions).mockImplementation(async (node) => ({
    data: [relaySession(`${node}-uuid`)],
  }));
  await openFleet();
  fireEvent.click(screen.getByRole('tab', { name: 'Relay sessions' }));
  await screen.findByText('relay-1-uuid');
  await screen.findByText('relay-2-uuid');
  expect(getRelaySessions).not.toHaveBeenCalledWith('primary');
  const row = screen.getByText('relay-2-uuid').closest('tr');
  expect(row?.textContent).toContain('Relay 2');
  fireEvent.click(
    within(row as HTMLTableRowElement).getByRole('button', {
      name: 'Disconnect',
    }),
  );
  await screen.findByText('Close this relay session on Relay 2?');
  fireEvent.click(screen.getByRole('button', { name: 'OK' }));
  await waitFor(() =>
    expect(disconnectRelaySession).toHaveBeenCalledWith(
      'relay-2',
      'relay-2-uuid',
    ),
  );
  await choose('hbbr · Relay', 'Filter relays');
  await waitFor(() => expect(screen.queryByText('relay-2-uuid')).toBeNull());
  expect(screen.getByText('relay-1-uuid')).toBeTruthy();
  fireEvent.click(screen.getByRole('tab', { name: 'Logs' }));
  await screen.findByText('relay-1/hbbr logs');
});

test('partial relay query failure is visible while successful results stay available', async () => {
  jest.mocked(getRelaySessions).mockImplementation(async (node) => {
    if (node === 'relay-2') throw new Error('offline');
    return { data: [relaySession('available-session')] };
  });
  await openFleet();
  fireEvent.click(screen.getByRole('tab', { name: 'Relay sessions' }));
  await screen.findByText('available-session');
  await screen.findByText(
    'Session queries failed for Relay 2. Results are incomplete.',
  );
});

test('registrations and bans always use the primary service regardless of the last relay', async () => {
  mockAccess.canServersBan = true;
  await openFleet();
  fireEvent.click(
    within(screen.getByRole('region', { name: 'hbbr · Relay 2' })).getByRole(
      'button',
      { name: 'Logs' },
    ),
  );
  await screen.findByText('relay-2/hbbr logs');
  fireEvent.click(screen.getByRole('tab', { name: 'Registrations' }));
  await waitFor(() => expect(getServerPeers).toHaveBeenCalledWith('primary'));
  expect(screen.queryByRole('combobox')).toBeNull();
  fireEvent.click(screen.getByRole('tab', { name: 'Bans' }));
  await screen.findByRole('button', { name: 'Save rules' });
  await waitFor(() => expect(getServerBans).toHaveBeenCalledWith('primary'));
  expect(screen.queryByRole('combobox')).toBeNull();
  fireEvent.change(
    screen.getByRole('textbox', { name: 'Device IDs (one per line)' }),
    { target: { value: '123456' } },
  );
  fireEvent.click(screen.getByRole('button', { name: 'Save rules' }));
  const dialog = await screen.findByRole('dialog');
  expect(dialog.textContent).toContain('every hbbr it manages');
  expect(saveServerBans).not.toHaveBeenCalled();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Save rules' }));
  await waitFor(() =>
    expect(saveServerBans).toHaveBeenCalledWith('primary', {
      device_ids: ['123456'],
      ips: [],
    }),
  );
  expect(screen.getByText('hbbr: Managed by hbbs')).toBeTruthy();
  expect(
    screen.getByText(
      /does not confirm synchronization for each individual relay/,
    ),
  ).toBeTruthy();
});

test('dirty configuration survives polling and cancellation of instance, tab, refresh and route changes', async () => {
  const poll = poller();
  mockAccess.canServersConfig = true;
  await openFleet();
  fireEvent.click(screen.getByRole('tab', { name: 'Configuration' }));
  const input = await screen.findByDisplayValue('primary/hbbs');
  fireEvent.change(input, { target: { value: 'my-draft' } });
  jest.mocked(getServerConfig).mockClear();
  await poll();
  expect(getServerConfig).not.toHaveBeenCalled();
  expect(screen.getByDisplayValue('my-draft')).toBeTruthy();
  for (const action of [
    async () => choose('hbbr · Relay'),
    async () => fireEvent.click(screen.getByRole('tab', { name: 'Logs' })),
    async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Refresh' })),
  ]) {
    await action();
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Keep editing' }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByDisplayValue('my-draft')).toBeTruthy();
  }
  expect(history.block).toHaveBeenCalled();
  const retry = jest.fn();
  const block = jest.mocked(history.block).mock.calls.at(-1)?.[0];
  await act(async () =>
    block?.({
      action: 'PUSH' as import('history').Action,
      location: {
        pathname: '/other',
        search: '',
        hash: '',
        state: null,
        key: 'next',
      },
      retry,
    }),
  );
  const dialog = await screen.findByRole('dialog');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Keep editing' }));
  expect(retry).not.toHaveBeenCalled();
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(true);
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  fireEvent.click(screen.getByRole('tab', { name: 'Logs' }));
  fireEvent.click(
    within(await screen.findByRole('dialog')).getByRole('button', {
      name: 'Discard and continue',
    }),
  );
  await screen.findByText('primary/hbbs logs');
});

test('a delayed polling response cannot overwrite edits made after the request started', async () => {
  const poll = poller();
  mockAccess.canServersConfig = true;
  await openFleet();
  fireEvent.click(screen.getByRole('tab', { name: 'Configuration' }));
  const input = await screen.findByDisplayValue('primary/hbbs');
  let finish: (
    value: import('@/services/rustdesk-console/server').ServerConfig,
  ) => void = () => {};
  jest.mocked(getServerConfig).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const count = jest.mocked(getServerConfig).mock.calls.length;
  await poll();
  await waitFor(() =>
    expect(jest.mocked(getServerConfig).mock.calls.length).toBe(count + 1),
  );
  fireEvent.change(input, { target: { value: 'newer-draft' } });
  await act(async () => finish(configValue('old-poll-result')));
  expect(screen.getByDisplayValue('newer-draft')).toBeTruthy();
  expect(screen.queryByDisplayValue('old-poll-result')).toBeNull();
});

test('late logs from a previous target are ignored', async () => {
  let finish: (value: { text: string }) => void = () => {};
  jest.mocked(getServerLogs).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  await openFleet();
  fireEvent.click(screen.getByRole('tab', { name: 'Logs' }));
  await waitFor(() =>
    expect(getServerLogs).toHaveBeenCalledWith('primary', 'hbbs'),
  );
  await choose('hbbr · Relay 2');
  await screen.findByText('relay-2/hbbr logs');
  await act(async () => finish({ text: 'outdated-primary-log' }));
  expect(screen.queryByText('outdated-primary-log')).toBeNull();
});

test('saving dynamic settings reports no restart and omits unchanged secrets', async () => {
  mockAccess.canServersConfig = true;
  mockAccess.canServersControl = true;
  const initial = {
    ...configValue('32'),
    values: { setting: '32', key: '__REDACTED__' },
    schema: [
      ...configValue('32').schema,
      {
        name: 'key',
        default: '-',
        kind: 'string',
        secret: true,
        restart_required: true,
      },
    ],
  };
  jest.mocked(getServerConfig).mockResolvedValue(initial);
  jest.mocked(saveServerConfig).mockResolvedValue({
    ...initial,
    values: { setting: '17', key: '__REDACTED__' },
  });
  await openFleet();
  fireEvent.click(screen.getByRole('tab', { name: 'Configuration' }));
  fireEvent.change(await screen.findByDisplayValue('32'), {
    target: { value: '17' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save configuration' }));
  await waitFor(() =>
    expect(saveServerConfig).toHaveBeenCalledWith('primary', 'hbbs', {
      setting: '17',
    }),
  );
  await screen.findByText(
    'Dynamic configuration saved for hbbs · Primary; no restart is required.',
  );
  expect(screen.queryByRole('button', { name: 'Restart to apply' })).toBeNull();
});

test('pending restart values remain visible and restart applies to the selected instance only', async () => {
  mockAccess.canServersConfig = true;
  mockAccess.canServersControl = true;
  const pending = {
    ...configValue('21117', true),
    pending_restart_detail: { setting: { current: '21117', pending: '21127' } },
  };
  jest.mocked(getServerConfig).mockResolvedValue(pending);
  await openFleet();
  fireEvent.click(
    within(screen.getByRole('region', { name: 'hbbr · Relay 2' })).getByRole(
      'button',
      { name: 'Configuration' },
    ),
  );
  await screen.findByDisplayValue('21127');
  fireEvent.click(screen.getByRole('button', { name: 'Restart to apply' }));
  await screen.findByText('Restart hbbr · Relay 2 to apply saved settings?');
  fireEvent.click(screen.getByRole('button', { name: 'OK' }));
  await waitFor(() =>
    expect(controlServer).toHaveBeenCalledWith('relay-2', 'hbbr', 'apply'),
  );
});

test('view-only permissions hide mutation controls and skip protected API requests', async () => {
  await openFleet();
  expect(screen.queryByRole('tab', { name: 'Configuration' })).toBeNull();
  expect(screen.queryByRole('tab', { name: 'Bans' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Restart' })).toBeNull();
  fireEvent.click(screen.getByRole('tab', { name: 'Relay sessions' }));
  await waitFor(() => expect(getRelaySessions).toHaveBeenCalled());
  expect(screen.queryByRole('button', { name: 'Disconnect' })).toBeNull();
  expect(getServerConfig).not.toHaveBeenCalled();
  expect(getServerBans).not.toHaveBeenCalled();
});

test('without servers.view the page does not fetch management or network data', async () => {
  mockAccess.canServersView = false;
  renderServers();
  expect(
    screen.getByText('You do not have permission to view server management.'),
  ).toBeTruthy();
  expect(getServerNodes).not.toHaveBeenCalled();
  expect(getNetwork).not.toHaveBeenCalled();
});

test('viewing relay logs first does not replace the default all-relays session filter', async () => {
  jest.mocked(getRelaySessions).mockImplementation(async (node) => ({
    data: [relaySession(`${node}-session`)],
  }));
  await openFleet();
  fireEvent.click(
    within(screen.getByRole('region', { name: 'hbbr · Relay 2' })).getByRole(
      'button',
      { name: 'Logs' },
    ),
  );
  await screen.findByText('relay-2/hbbr logs');
  fireEvent.click(screen.getByRole('tab', { name: 'Relay sessions' }));
  await screen.findByText('relay-1-session');
  await screen.findByText('relay-2-session');
  expect(screen.getByText('All relays')).toBeTruthy();
});

test('a changed primary cannot receive the previous primary ban draft', async () => {
  const poll = poller();
  mockAccess.canServersBan = true;
  await openFleet();
  fireEvent.click(screen.getByRole('tab', { name: 'Bans' }));
  const input = await screen.findByRole('textbox', {
    name: 'Device IDs (one per line)',
  });
  fireEvent.change(input, { target: { value: 'old-primary-draft' } });
  jest.mocked(getServerBans).mockClear();
  jest.mocked(getServerNodes).mockResolvedValue({
    data: [
      {
        ...managementNodes[0],
        id: 'different-primary',
        name: 'Different primary',
      },
      managementNodes[1],
    ],
  });
  await poll();
  await screen.findByText(
    /These ban rules still belong to the previous primary/,
  );
  expect(screen.getByDisplayValue('old-primary-draft')).toBeTruthy();
  expect(
    (screen.getByRole('button', { name: 'Save rules' }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  expect(getServerBans).not.toHaveBeenCalled();
  expect(saveServerBans).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
  fireEvent.click(
    within(await screen.findByRole('dialog')).getByRole('button', {
      name: 'Discard and continue',
    }),
  );
  await waitFor(() =>
    expect(getServerBans).toHaveBeenCalledWith('different-primary'),
  );
  await waitFor(() =>
    expect(
      screen.queryByText(
        /These ban rules still belong to the previous primary/,
      ),
    ).toBeNull(),
  );
  expect(screen.queryByDisplayValue('old-primary-draft')).toBeNull();
});

test('an empty relay inventory explains that sessions could not be listed', async () => {
  jest.mocked(getServerNodes).mockResolvedValue({ data: [managementNodes[0]] });
  renderServers();
  await screen.findByText('CUBIC');
  fireEvent.click(screen.getByRole('tab', { name: 'Relay sessions' }));
  await screen.findByText(
    'No queryable relays were discovered, so sessions cannot be listed. Check hbbr registration and the management connection.',
  );
  expect(getRelaySessions).not.toHaveBeenCalled();
});

test('a configuration save failure preserves the draft and makes retry available', async () => {
  mockAccess.canServersConfig = true;
  mockAccess.canServersControl = true;
  jest.mocked(saveServerConfig).mockRejectedValueOnce(new Error('save failed'));
  await openFleet();
  fireEvent.click(screen.getByRole('tab', { name: 'Configuration' }));
  fireEvent.change(await screen.findByDisplayValue('primary/hbbs'), {
    target: { value: 'retry-me' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save configuration' }));
  await screen.findByText(
    'Operation failed. Check the target instance status and logs.',
  );
  expect(screen.getByDisplayValue('retry-me')).toBeTruthy();
  expect(
    (
      screen.getByRole('button', {
        name: 'Save configuration',
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(false);
  expect(controlServer).not.toHaveBeenCalled();
  expect(screen.queryByText(/Dynamic configuration saved for/)).toBeNull();
});

test('an offline listed relay retains saved configuration while save and restart are disabled', async () => {
  mockAccess.canServersConfig = true;
  mockAccess.canServersControl = true;
  jest.mocked(getServerNodes).mockResolvedValue({
    data: [
      managementNodes[0],
      {
        ...managementNodes[1],
        reachable: false,
        services: [{ service: 'hbbr', state: 'offline', available: false }],
      },
    ],
  });
  jest.mocked(getServerConfig).mockResolvedValue({
    ...configValue('saved-offline-value'),
    available: false,
  });
  renderServers();
  await screen.findByText('CUBIC');
  const relay = screen.getByRole('region', { name: 'hbbr · Relay' });
  expect(
    (
      within(relay).getByRole('button', {
        name: 'Restart',
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  fireEvent.click(within(relay).getByRole('button', { name: 'Configuration' }));
  const input = await screen.findByDisplayValue('saved-offline-value');
  expect((input as HTMLInputElement).disabled).toBe(true);
  expect(
    (
      screen.getByRole('button', {
        name: 'Save configuration',
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  expect(
    screen.getByText(/Service offline. Saved overrides are shown/),
  ).toBeTruthy();
});

test('confirmed route navigation releases the blocker and retries the original transition', async () => {
  mockAccess.canServersConfig = true;
  await openFleet();
  fireEvent.click(screen.getByRole('tab', { name: 'Configuration' }));
  fireEvent.change(await screen.findByDisplayValue('primary/hbbs'), {
    target: { value: 'route-draft' },
  });
  const retry = jest.fn();
  const block = jest.mocked(history.block).mock.calls.at(-1)?.[0];
  await act(async () =>
    block?.({
      action: 'PUSH' as import('history').Action,
      location: {
        pathname: '/devices',
        search: '',
        hash: '',
        state: null,
        key: 'next',
      },
      retry,
    }),
  );
  fireEvent.click(
    within(await screen.findByRole('dialog')).getByRole('button', {
      name: 'Discard and continue',
    }),
  );
  await waitFor(() => expect(retry).toHaveBeenCalledTimes(1));
  expect(
    jest.mocked(history.block).mock.results.at(-1)?.value,
  ).toHaveBeenCalled();
});

test('a relay named like the all-relays option can still be filtered independently', async () => {
  jest.mocked(getServerNodes).mockResolvedValue({
    data: [
      ...managementNodes,
      { ...managementNodes[1], id: '__all_relays__', name: 'Sentinel relay' },
    ],
  });
  jest.mocked(getRelaySessions).mockImplementation(async (node) => ({
    data: [relaySession(`${node}-session`)],
  }));
  renderServers();
  await screen.findByText('CUBIC');
  fireEvent.click(screen.getByRole('tab', { name: 'Relay sessions' }));
  await screen.findByText('relay-1-session');
  await screen.findByText('__all_relays__-session');
  jest.mocked(getRelaySessions).mockClear();
  await choose('hbbr · Sentinel relay', 'Filter relays');
  await waitFor(() => expect(screen.queryByText('relay-1-session')).toBeNull());
  expect(screen.getByText('__all_relays__-session')).toBeTruthy();
  expect(getRelaySessions).toHaveBeenCalledWith('__all_relays__');
  expect(getRelaySessions).not.toHaveBeenCalledWith('relay-1');
  expect(getRelaySessions).not.toHaveBeenCalledWith('relay-2');
});
