import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { useAccess } from '@umijs/max';
import React from 'react';
import en from '@/locales/en-US/pwa';
import { checkUpdate } from '@/services/rustdesk-console/system';
import { readSavedUpdate } from '@/services/rustdesk-console/systemUpdate';
import HeaderUpdateEntry from './index';

jest.mock('@umijs/max', () => ({
  useAccess: jest.fn(),
  useIntl: () => ({ formatMessage: ({ id }: { id: string }) =>
    jest.requireActual<{ default: Record<string, string> }>('@/locales/en-US/pwa').default[id] || id }),
}));
jest.mock('@/services/rustdesk-console/system', () => ({ checkUpdate: jest.fn() }));
jest.mock('@/services/rustdesk-console/systemUpdate', () => ({ readSavedUpdate: jest.fn() }));
jest.mock('@/utils/auth', () => ({ getToken: () => 'test-token' }));
jest.mock('@/components/UpdateCheckModal/SystemUpdatePanel', () => () => null);
jest.mock('react-markdown', () => ({ __esModule: true, default: ({ children }: any) => children }));
jest.mock('remark-gfm', () => ({ __esModule: true, default: () => undefined }));
jest.mock('antd', () => {
  const R = jest.requireActual<typeof import('react')>('react');
  const Box = ({ children }: any) => R.createElement('div', null, children);
  return {
    theme: { useToken: () => ({ token: { colorPrimary: '#1677ff' } }) },
    Tooltip: ({ children, title }: any) => R.createElement('span', { title }, children),
    Button: ({ children, icon, disabled, loading, onClick, 'aria-label': label, 'aria-haspopup': popup }: any) =>
      R.createElement('button', { type: 'button', disabled: disabled || loading, onClick, 'aria-label': label, 'aria-haspopup': popup }, icon, children),
    Modal: ({ open, title, children, footer }: any) => open ? R.createElement('div', { role: 'dialog', 'aria-label': title }, children, footer) : null,
    Space: Box, Spin: Box, Tag: Box, Divider: Box, Skeleton: Box,
    Typography: { Text: Box, Paragraph: Box },
    Alert: ({ title }: any) => R.createElement('div', { role: 'status' }, title),
  };
});

const checkMock = jest.mocked(checkUpdate);
const accessMock = jest.mocked<() => { isSuperAdmin: boolean }>(useAccess);
const savedMock = jest.mocked(readSavedUpdate);
const noUpdates = (): API.UpdateCheckResult => ({ backend: { has_update: false }, frontend: { has_update: false } });
const available = (): API.UpdateCheckResult => ({
  backend: { has_update: true, version: '1.9.1', release_url: 'https://github.com/databk/rustdesk-console/releases/tag/v1.9.1' },
  frontend: { has_update: false },
});
const settle = async () => { await act(async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); }); };

beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(globalThis, 'FRONTEND_VERSION', { value: '1.6.0', configurable: true });
  accessMock.mockReturnValue({ isSuperAdmin: true });
  savedMock.mockReturnValue(null);
  checkMock.mockResolvedValue(noUpdates());
});
afterEach(cleanup);

test('only the administrator sees an icon-only entry and triggers the initial check', async () => {
  accessMock.mockReturnValue({ isSuperAdmin: false });
  const view = render(React.createElement(HeaderUpdateEntry));
  await settle();
  expect(view.queryByRole('button')).toBeNull();
  expect(checkMock).not.toHaveBeenCalled();
  accessMock.mockReturnValue({ isSuperAdmin: true });
  view.rerender(React.createElement(HeaderUpdateEntry)); await settle();
  const button = view.getByRole('button', { name: en['app.systemUpdate.check'] });
  expect(button.textContent).toBe('');
  expect(button.querySelector('svg[data-icon=info-circle]')).toBeTruthy();
  expect(button.getAttribute('aria-haspopup')).toBe('dialog');
  expect(checkMock).toHaveBeenCalledTimes(1);
  expect(view.queryByRole('dialog')).toBeNull();
});

test('an official stable update changes the icon and opens the dialog only on click', async () => {
  checkMock.mockResolvedValue(available());
  const view = render(React.createElement(HeaderUpdateEntry)); await settle();
  const button = view.getByRole('button', { name: en['app.systemUpdate.available'] });
  expect(button.querySelector('svg[data-icon=up-circle]')).toBeTruthy();
  expect(view.queryByRole('dialog')).toBeNull();
  fireEvent.click(button); await settle();
  expect(view.getAllByRole('dialog')).toHaveLength(1);
  expect(checkMock).toHaveBeenCalledTimes(1);
});

test.each([
  { version: '1.9.1-rc.1', release_url: 'https://github.com/databk/rustdesk-console/releases/tag/v1.9.1-rc.1' },
  { version: '1.9.1', release_url: 'https://github.com/another/rustdesk-console/releases/tag/v1.9.1' },
  { version: '1.9.1', release_url: 'https://github.com/databk/rustdesk-console/releases/tag/v1.9.0' },
  { version: '1.9.1', release_url: undefined },
])('unverified or prerelease cache does not show the upgrade icon: %j', async (release) => {
  checkMock.mockResolvedValue({ ...noUpdates(), backend: { has_update: true, ...release } });
  const view = render(React.createElement(HeaderUpdateEntry)); await settle();
  expect(view.getByRole('button', { name: en['app.systemUpdate.check'] })).toBeTruthy();
  expect(view.queryByRole('dialog')).toBeNull();
});

test('manual recheck updates the header notification without creating a second controller', async () => {
  checkMock.mockResolvedValueOnce(available()).mockResolvedValue(noUpdates());
  const view = render(React.createElement(HeaderUpdateEntry)); await settle();
  fireEvent.click(view.getByRole('button', { name: en['app.systemUpdate.available'] }));
  fireEvent.click(view.getByRole('button', { name: /Recheck$/ })); await settle();
  expect(view.getByRole('button', { name: en['app.systemUpdate.check'] })).toBeTruthy();
  expect(checkMock).toHaveBeenCalledTimes(2);
  fireEvent.click(view.getByRole('button', { name: en['app.updateCheck.close'] }));
  expect(view.queryByRole('dialog')).toBeNull();
  fireEvent.click(view.getByRole('button', { name: en['app.systemUpdate.check'] })); await settle();
  expect(view.getAllByRole('dialog')).toHaveLength(1);
  expect(checkMock).toHaveBeenCalledTimes(2);
});

test('clicking during the initial check shares the pending request', async () => {
  let finish: (result: API.UpdateCheckResult) => void = () => undefined;
  checkMock.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  const view = render(React.createElement(HeaderUpdateEntry));
  const button = view.getByRole('button', { name: en['app.systemUpdate.checkingUpdates'] });
  expect(button.getAttribute('aria-busy')).toBe('true');
  expect(button.querySelector('svg[data-icon=info-circle]')).toBeTruthy();
  fireEvent.click(button); await settle();
  expect(view.getByRole('dialog')).toBeTruthy();
  expect(checkMock).toHaveBeenCalledTimes(1);
  await act(async () => finish(noUpdates())); await settle();
  expect(view.getByRole('button', { name: en['app.systemUpdate.check'] }).getAttribute('aria-busy')).toBe('false');
  expect(checkMock).toHaveBeenCalledTimes(1);
});

test('a saved update resumes the dialog instead of suppressing task recovery', async () => {
  savedMock.mockReturnValue({ installationId: 'installation', jobId: 'job' });
  const view = render(React.createElement(HeaderUpdateEntry)); await settle();
  expect(view.getByRole('dialog')).toBeTruthy();
  expect(checkMock).toHaveBeenCalledTimes(1);
});
