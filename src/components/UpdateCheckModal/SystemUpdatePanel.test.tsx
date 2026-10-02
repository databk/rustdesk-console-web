import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { request } from '@umijs/max';
import React from 'react';
import en from '@/locales/en-US/pwa';
import zh from '@/locales/zh-CN/pwa';
import fr from '@/locales/fr-FR/pwa';
import pt from '@/locales/pt-BR/pwa';
import ru from '@/locales/ru-RU/pwa';
import { capability, installationId, job, jobId, plan } from '@/services/rustdesk-console/systemUpdate.testFixtures';
import SystemUpdatePanel from './SystemUpdatePanel';

jest.mock('@umijs/max', () => ({ request: jest.fn(), history: { push: jest.fn() }, useIntl: () => ({ formatMessage: ({ id }: { id: string }) => {
  const messages = jest.requireActual<{ default: Record<string, string> }>('@/locales/en-US/pwa').default;
  return messages[id] || id;
} }), getIntl: () => ({ formatMessage: ({ defaultMessage }: { defaultMessage: string }) => defaultMessage }) }));
jest.mock('antd', () => {
  const R = jest.requireActual<typeof import('react')>('react');
  const Box = ({ children }: any) => R.createElement('div', null, children);
  return { Space: Box, Spin: Box, Tag: Box,
    Typography: { Text: Box, Paragraph: Box, Link: ({ children, href }: any) => R.createElement('a', { href }, children) },
    Alert: ({ title, description }: any) => R.createElement('div', { role: 'status' }, R.createElement('strong', null, title), R.createElement('div', null, description)),
    Descriptions: ({ items }: any) => R.createElement('div', null, items.map((item: any) => R.createElement('div', { key: item.key }, item.label, ': ', item.children))),
    Button: ({ children, disabled, onClick }: any) => R.createElement('button', { disabled, onClick, type: 'button' }, children),
    Checkbox: ({ checked, onChange, children }: any) => R.createElement('label', null, R.createElement('input', { type: 'checkbox', checked, onChange }), children),
    message: { error: jest.fn() }, notification: { open: jest.fn() },
  };
});
const requestMock = jest.mocked<(url: string) => Promise<unknown>>(request);
let nextPlan = plan();
let nextCapability = capability();
let current: import('@/services/rustdesk-console/systemUpdate').JobView | null = null;
beforeEach(() => {
  jest.clearAllMocks(); localStorage.clear(); current = null; nextPlan = plan(); nextCapability = capability();
  requestMock.mockImplementation(async url => {
    if (url.endsWith('/capabilities')) return nextCapability;
    if (url.endsWith('/jobs/current')) return { installationId, job: current };
    if (url.endsWith('/plans')) return nextPlan;
    if (url.endsWith('/jobs')) return { jobId, statusUrl: '/api/system-update/jobs/' + jobId, job: job() };
    if (url.includes('/jobs/')) return job();
    if (url === '/system-update-health.json') return { component: 'web', version: current?.components.find(component => component.component === 'web')?.target, sourceCommit: 'a'.repeat(40), ready: true, maintenanceProtocol: 1 };
    return {};
  });
});
afterEach(cleanup);
const settle = async () => { await act(async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); }); };

test.each([
  ['managed-compose', 'sqlite'], ['managed-compose', 'mysql'], ['managed-linux', 'sqlite'], ['managed-linux', 'mysql'],
] as const)('one confirmed Update system action for %s / %s', async (deployment, database) => {
  nextCapability = capability({ deployment, database });
  nextPlan = plan({ backup: { database, method: database, includesBusinessFiles: true } });
  const view = render(React.createElement(SystemUpdatePanel, { open: true })); await settle();
  const execute = view.getByRole('button', { name: 'Update system' }) as HTMLButtonElement;
  expect(execute.disabled).toBe(true);
  expect(view.getAllByText(`${en['app.systemUpdate.current']}: ${nextPlan.components[0].current}`)).toHaveLength(2);
  expect(view.getAllByText(`${en['app.systemUpdate.target']}: ${nextPlan.components[0].target}`)).toHaveLength(2);
  expect(view.getAllByText(en['app.systemUpdate.update'])).toHaveLength(2);
  expect(view.getAllByRole('checkbox')).toHaveLength(1);
  fireEvent.click(view.getByRole('checkbox')); expect(execute.disabled).toBe(false);
  fireEvent.click(execute); await settle();
  expect(requestMock.mock.calls.filter(call => call[0].endsWith('/jobs'))).toHaveLength(1);
});

test.each(['backend', 'web'] as const)('one-sided %s update keeps the other version unchanged', async changed => {
  nextPlan = plan({}, changed === 'backend' ? 'backendOnly' : 'webOnly');
  const view = render(React.createElement(SystemUpdatePanel, { open: true })); await settle();
  expect(view.getByText('Unchanged — installation skipped')).toBeTruthy();
  expect(view.getAllByRole('button', { name: 'Update system' })).toHaveLength(1);
});

test('no changes and incompatible releases never expose an execution button', async () => {
  nextPlan = plan({}, 'noUpdates');
  const view = render(React.createElement(SystemUpdatePanel, { open: true })); await settle();
  expect(view.queryByRole('button', { name: 'Update system' })).toBeNull();
  expect(view.getByText('Both components are already at the selected official versions.')).toBeTruthy();
  view.unmount(); nextPlan = plan({}, 'blocked');
  const blocked = render(React.createElement(SystemUpdatePanel, { open: true })); await settle();
  expect(blocked.queryByRole('button', { name: 'Update system' })).toBeNull();
  expect(blocked.getByText(en['app.systemUpdate.releaseBlocked'])).toBeTruthy();
});

test('old backend fallback displays manual guide without execution', async () => {
  requestMock.mockRejectedValue({ response: { status: 404 } });
  const view = render(React.createElement(SystemUpdatePanel, { open: true })); await settle();
  expect(view.getByText(en['app.systemUpdate.unsupported'])).toBeTruthy();
  expect(view.getByRole('link', { name: en['app.systemUpdate.manual'] })).toBeTruthy();
  expect(view.queryByRole('button', { name: 'Update system' })).toBeNull();
});

test('canonical missing-helper capability shows migration guidance without making a plan', async () => {
  nextCapability = capability({}, 'helperMissing');
  const view = render(React.createElement(SystemUpdatePanel, { open: true })); await settle();
  expect(view.getByText(en['app.systemUpdate.helperUnavailable'])).toBeTruthy();
  expect(view.getByRole('link', { name: en['app.systemUpdate.manual'] })).toBeTruthy();
  expect(view.queryByRole('button', { name: 'Update system' })).toBeNull();
  expect(requestMock.mock.calls.some(call => call[0].endsWith('/plans'))).toBe(false);
  expect(view.queryByText(nextCapability.blockers[0].message)).toBeNull();
});

test('internal update verification uses built-in feature wording while preserving failure status', async () => {
  current = job({ status: 'failed', phase: 'updating_helper', resultCode: 'HELPER_VERIFY_FAILED', safeMessage: 'The updated helper did not become ready.' });
  const view = render(React.createElement(SystemUpdatePanel, { open: true })); await settle();
  expect(view.getByText(en['app.systemUpdate.status.failed'])).toBeTruthy();
  expect(view.getByText(en['app.systemUpdate.internalUpdateFailed'])).toBeTruthy();
  expect(view.queryByText(current.safeMessage)).toBeNull();
  expect(view.queryByRole('button', { name: 'Update system' })).toBeNull();
});

test('unrelated blocker diagnostics remain visible', async () => {
  const detail = 'Database backup requires 128 MiB of additional space.';
  nextCapability = capability({ ready: false, blockers: [{ code: 'DISK_SPACE', message: detail }] });
  const view = render(React.createElement(SystemUpdatePanel, { open: true })); await settle();
  expect(view.getByText(detail)).toBeTruthy();
  expect(view.getByText(en['app.systemUpdate.backupBlocked'])).toBeTruthy();
});

test('canonical active-job capability resumes its job while readiness is false', async () => {
  nextCapability = capability({}, 'activeJob');
  current = job({ status: 'queued' });
  const view = render(React.createElement(SystemUpdatePanel, { open: true })); await settle();
  expect(view.getByText(en['app.systemUpdate.status.queued'])).toBeTruthy();
  expect(view.queryByRole('button', { name: 'Update system' })).toBeNull();
  expect(requestMock.mock.calls.some(call => call[0].endsWith('/plans'))).toBe(false);
});

test('recovery_required is visible and cannot be confused with completed or rerun', async () => {
  current = job({ status: 'recovery_required', phase: 'restoring', recoveryGuidance: 'Inspect the protected host journal.' });
  const view = render(React.createElement(SystemUpdatePanel, { open: true })); await settle();
  expect(view.getByText(en['app.systemUpdate.status.recovery_required'])).toBeTruthy();
  expect(view.queryByText(en['app.systemUpdate.status.succeeded'])).toBeNull();
  expect(view.queryByRole('button', { name: 'Update system' })).toBeNull();
  expect(view.queryByRole('button', { name: en['app.systemUpdate.preview'] })).toBeNull();
});

test.each([
  ['succeeded', 'committing'], ['rolled_back', 'restoring'],
] as const)('%s shows historical versions without future actions or an ongoing phase', async (status, phase) => {
  current = job({ status, phase, components: plan({}, 'webOnly').components.map(component => ({
    ...component, current: component.component === 'backend' ? '1.9.0' : '1.6.0',
    target: component.component === 'backend' ? '1.9.0' : '1.6.1',
  })) });
  const view = render(React.createElement(SystemUpdatePanel, { open: true })); await settle();
  expect(view.getByText(en[`app.systemUpdate.status.${status}`])).toBeTruthy();
  for (const component of current.components) {
    expect(view.getByText(`${en['app.systemUpdate.jobFrom']}: ${component.current}`)).toBeTruthy();
    expect(view.getByText(`${en['app.systemUpdate.jobTarget']}: ${component.target}`)).toBeTruthy();
  }
  expect(view.queryByText(en['app.systemUpdate.current'], { exact: false })).toBeNull();
  expect(view.queryByText(en['app.systemUpdate.target'], { exact: false })).toBeNull();
  expect(view.queryByText(en['app.systemUpdate.update'])).toBeNull();
  expect(view.queryByText(en['app.systemUpdate.unchanged'])).toBeNull();
  expect(view.queryByText(en[`app.systemUpdate.phase.${phase}`])).toBeNull();
  expect(view.queryByRole('button', { name: 'Update system' })).toBeNull();
  if (status === 'succeeded') {
    expect(view.getByText(en['app.systemUpdate.webVerified'])).toBeTruthy();
    expect(view.getByRole('button', { name: en['app.systemUpdate.refreshPage'] })).toBeTruthy();
  } else {
    expect(view.queryByText(en['app.systemUpdate.status.succeeded'])).toBeNull();
    expect(view.queryByText(en['app.systemUpdate.webVerified'])).toBeNull();
    expect(view.queryByRole('button', { name: en['app.systemUpdate.refreshPage'] })).toBeNull();
  }
});

test('a running job keeps its progress phase and labels captured versions as history', async () => {
  current = job({ phase: 'switching' });
  const view = render(React.createElement(SystemUpdatePanel, { open: true })); await settle();
  expect(view.getByText(en['app.systemUpdate.status.running'])).toBeTruthy();
  expect(view.getByText(en['app.systemUpdate.phase.switching'])).toBeTruthy();
  expect(view.getAllByText(`${en['app.systemUpdate.jobFrom']}: ${current.components[0].current}`)).toHaveLength(2);
  expect(view.queryByText(en['app.systemUpdate.update'])).toBeNull();
});

test('all five locales contain the complete update vocabulary', () => {
  const keys = Object.keys(en).filter(key => key.startsWith('app.systemUpdate.')).sort();
  for (const locale of [zh, fr, pt, ru]) {
    expect(Object.keys(locale).filter(key => key.startsWith('app.systemUpdate.')).sort()).toEqual(keys);
    for (const key of keys) expect((locale as Record<string, string>)[key]).not.toBe('');
  }
});
