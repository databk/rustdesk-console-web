/** @jest-environment jsdom */
import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import React from 'react';
import {
  getServerNodes,
  getTcpNetwork,
} from '@/services/rustdesk-console/server';
import { unavailableTcp } from '@/services/rustdesk-console/tcpObservation';

type TcpObservation =
  import('@/services/rustdesk-console/tcpObservation').TcpObservation;

import Servers from './index';
import NetworkSettings from './network';

const mockAccess = {
  canAdmin: false,
  canServersView: true,
  canServersConfig: false,
  canServersControl: false,
};
jest.mock('@umijs/max', () => ({
  request: jest.fn(),
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
  jest.mocked(getServerNodes).mockReset().mockResolvedValue({ data: [] });
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
  render(React.createElement(Servers));
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
test('the readonly card follows hbbs/hbbr and is visible with servers.view without administrator mutation powers', async () => {
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
  render(React.createElement(Servers));
  await screen.findByText('CUBIC');
  const hbbr = screen.getByText('hbbr');
  const network = screen.getByText('Network settings');
  expect(
    hbbr.compareDocumentPosition(network) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Restart' })).toBeNull();
});
