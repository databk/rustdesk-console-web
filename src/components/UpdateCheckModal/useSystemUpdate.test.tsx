import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import { act, cleanup, renderHook } from '@testing-library/react';
import { request } from '@umijs/max';
import { readSavedUpdate, saveUpdate } from '@/services/rustdesk-console/systemUpdate';
import { capability, installationId, job, jobId, plan, planId } from '@/services/rustdesk-console/systemUpdate.testFixtures';
import { useSystemUpdate } from './useSystemUpdate';

jest.mock('@umijs/max', () => ({ request: jest.fn(), history: { push: jest.fn() }, getIntl: () => ({ formatMessage: ({ defaultMessage }: { defaultMessage: string }) => defaultMessage }) }));
jest.mock('antd', () => ({ message: { error: jest.fn() }, notification: { open: jest.fn() } }));
const requestMock = jest.mocked<(url: string, options?: { data?: unknown }) => Promise<unknown>>(request);
type FixtureJob = import('@/services/rustdesk-console/systemUpdate').JobView;
type FixturePlan = import('@/services/rustdesk-console/systemUpdate').UpdatePlan;
type FixtureCapability = import('@/services/rustdesk-console/systemUpdate').Capabilities;
let current: FixtureJob | null;
let nextPlan: FixturePlan;
let nextCapability: FixtureCapability;
const submitted: unknown[] = [];

beforeEach(() => {
  jest.useFakeTimers(); jest.clearAllMocks(); localStorage.clear(); sessionStorage.clear();
  current = null; nextPlan = plan(); nextCapability = capability(); submitted.length = 0;
  requestMock.mockImplementation(async (url, options) => {
    if (url.endsWith('/capabilities')) return nextCapability;
    if (url.endsWith('/jobs/current')) return { installationId: nextCapability.installationId, job: current };
    if (url.endsWith('/plans')) return nextPlan;
    if (url.endsWith('/jobs')) { submitted.push(options?.data); current = job(); return { jobId, statusUrl: '/api/system-update/jobs/' + jobId, job: current }; }
    if (url.startsWith('/api/system-update/jobs/')) return current;
    if (url === '/system-update-health.json') return { component: 'web', version: plan().components.find(component => component.component === 'web')?.target, sourceCommit: 'a'.repeat(40), ready: true, maintenanceProtocol: 1 };
    throw new Error('Unexpected request: ' + url);
  });
});
afterEach(() => { cleanup(); jest.useRealTimers(); jest.restoreAllMocks(); });
const settle = async () => { await act(async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); }); };

test('closed dialog does not probe privileged APIs', async () => {
  renderHook(() => useSystemUpdate(false)); await settle(); expect(requestMock).not.toHaveBeenCalled();
});

test('opening discovers current job before creating a plan', async () => {
  const view = renderHook(() => useSystemUpdate(true)); await settle();
  expect(view.result.current.state).toBe('preview');
  expect(requestMock.mock.calls.map(call => call[0])).toEqual(['/api/system-update/capabilities', '/api/system-update/jobs/current', '/api/system-update/plans']);
});

test('refresh restores the server current job even without local browser state', async () => {
  current = job(); const view = renderHook(() => useSystemUpdate(true)); await settle();
  expect(view.result.current.job?.jobId).toBe(jobId);
  expect(view.result.current.state).toBe('tracking');
  expect(readSavedUpdate()).toEqual({ installationId, jobId });
  expect(requestMock.mock.calls.some(call => call[0].endsWith('/plans'))).toBe(false);
});

test('installation replacement discards previous identifiers before previewing', async () => {
  saveUpdate({ installationId: 'old-installation', jobId: 'old-job' });
  const view = renderHook(() => useSystemUpdate(true)); await settle();
  expect(view.result.current.state).toBe('preview'); expect(readSavedUpdate()).toBeNull();
  expect(requestMock.mock.calls.some(call => call[0].includes('old-job'))).toBe(false);
});

test('requires acknowledgement, submits once and persists only identifiers', async () => {
  const view = renderHook(() => useSystemUpdate(true)); await settle();
  await act(async () => { await view.result.current.submit(false); }); expect(submitted).toHaveLength(0);
  await act(async () => { await Promise.all([view.result.current.submit(true), view.result.current.submit(true)]); });
  expect(submitted).toHaveLength(1); expect(view.result.current.state).toBe('tracking');
  expect(readSavedUpdate()).toEqual({ installationId, jobId });
});

test('lost submission response reconnects to the accepted job', async () => {
  const implementation = requestMock.getMockImplementation()!;
  requestMock.mockImplementation(async (url, options) => {
    if (url.endsWith('/jobs')) { submitted.push(options?.data); current = job(); throw { response: { status: 503 } }; }
    return implementation(url, options);
  });
  const view = renderHook(() => useSystemUpdate(true)); await settle();
  await act(async () => { await view.result.current.submit(true); }); await settle();
  expect(submitted).toHaveLength(1); expect(view.result.current.job?.jobId).toBe(jobId);
  expect(view.result.current.state).toBe('tracking');
});

test('historical terminal job cannot discard an unacknowledged new submission', async () => {
  const submission = { planId, idempotencyKey: '22222222-2222-4222-8222-222222222222', acknowledgeDowntime: true as const };
  saveUpdate({ installationId, submission });
  current = job({ jobId: 'old-job', planId: 'old-plan', status: 'succeeded' });
  const view = renderHook(() => useSystemUpdate(true)); await settle();
  expect(view.result.current.state).toBe('reconnecting'); expect(view.result.current.job).toBeNull();
  expect(readSavedUpdate()?.submission).toEqual(submission);
  await act(async () => { await view.result.current.submit(true); }); await settle();
  expect(submitted).toEqual([submission]); expect(view.result.current.job?.jobId).toBe(jobId);
});

test('preview after a terminal job retains a lost submission until the same request creates the new job', async () => {
  const previous = job({ jobId: 'old-job', planId: 'old-plan', status: 'failed' });
  current = previous;
  const implementation = requestMock.getMockImplementation()!;
  requestMock.mockImplementation(async (url, options) => {
    if (url.endsWith('/jobs') && submitted.length === 0) {
      submitted.push(options?.data);
      throw { response: { status: 503 } };
    }
    return implementation(url, options);
  });
  const view = renderHook(() => useSystemUpdate(true)); await settle();
  expect(view.result.current.state).toBe('terminal');
  expect(view.result.current.job?.jobId).toBe(previous.jobId);
  expect(readSavedUpdate()).toEqual({ installationId, jobId: previous.jobId });

  await act(async () => { await view.result.current.preview(); }); await settle();
  expect(view.result.current.state).toBe('preview');
  expect(view.result.current.plan?.planId).toBe(planId);
  expect(view.result.current.job).toBeNull();

  await act(async () => { await view.result.current.submit(true); }); await settle();
  expect(submitted).toHaveLength(1);
  const submission = submitted[0];
  expect(submission).toEqual({ planId, idempotencyKey: expect.any(String), acknowledgeDowntime: true });
  expect(current).toBe(previous);
  expect(view.result.current.state).toBe('reconnecting');
  expect(view.result.current.pending).toBe(true);
  expect(view.result.current.job).toBeNull();
  expect(readSavedUpdate()).toEqual({ installationId, submission });

  const currentReads = requestMock.mock.calls.filter(call => call[0].endsWith('/jobs/current')).length;
  await act(async () => { jest.advanceTimersByTime(2000); }); await settle();
  expect(requestMock.mock.calls.filter(call => call[0].endsWith('/jobs/current'))).toHaveLength(currentReads + 1);
  expect(view.result.current.state).toBe('reconnecting');
  expect(view.result.current.pending).toBe(true);
  expect(view.result.current.job).toBeNull();
  expect(readSavedUpdate()).toEqual({ installationId, submission });

  await act(async () => { await view.result.current.submit(true); }); await settle();
  expect(submitted).toEqual([submission, submission]);
  expect(view.result.current.state).toBe('tracking');
  expect(view.result.current.pending).toBe(false);
  expect(view.result.current.job?.jobId).toBe(jobId);
  expect(view.result.current.job?.planId).toBe(planId);
  expect(readSavedUpdate()).toEqual({ installationId, jobId });
});

test('temporary polling outage never fabricates a server failure or drops token', async () => {
  current = job({ phase: 'switching' });
  const implementation = requestMock.getMockImplementation()!;
  let disconnected = true;
  requestMock.mockImplementation(async (url, options) => {
    if (url.endsWith('/' + jobId) && disconnected) throw { response: { status: 502 } };
    return implementation(url, options);
  });
  const view = renderHook(() => useSystemUpdate(true)); await settle();
  await act(async () => { jest.advanceTimersByTime(2000); }); await settle();
  expect(view.result.current.state).toBe('reconnecting'); expect(view.result.current.job?.status).toBe('running');
  disconnected = false; current = job({ status: 'rolled_back', phase: 'restoring' });
  await act(async () => { jest.advanceTimersByTime(5000); }); await settle();
  expect(view.result.current.state).toBe('terminal'); expect(view.result.current.job?.status).toBe('rolled_back');
});

test.each([401, 403])('HTTP %i stops polling and preserves the tracked job', async status => {
  current = job(); const view = renderHook(() => useSystemUpdate(true)); await settle();
  requestMock.mockRejectedValue({ response: { status } });
  await act(async () => { jest.advanceTimersByTime(2000); }); await settle();
  expect(view.result.current.state).toBe('auth'); expect(readSavedUpdate()?.jobId).toBe(jobId);
  const calls = requestMock.mock.calls.length;
  await act(async () => { jest.advanceTimersByTime(60000); }); await settle();
  expect(requestMock.mock.calls).toHaveLength(calls);
});

test.each(['failed', 'rolled_back', 'recovery_required'] as const)('keeps the genuine %s outcome and never marks web verification successful', async status => {
  current = job({ status }); const view = renderHook(() => useSystemUpdate(true)); await settle();
  expect(view.result.current.job?.status).toBe(status); expect(view.result.current.verified).toBe(false);
  expect(requestMock.mock.calls.some(call => call[0] === '/system-update-health.json')).toBe(false);
});

test('succeeded still requires the live web to report the target version', async () => {
  current = job({ status: 'succeeded' });
  const implementation = requestMock.getMockImplementation()!;
  requestMock.mockImplementation(async (url, options) => url === '/system-update-health.json' ? { component: 'web', version: plan().components.find(component => component.component === 'web')?.current, sourceCommit: 'a'.repeat(40), ready: true, maintenanceProtocol: 1 } : implementation(url, options));
  const view = renderHook(() => useSystemUpdate(true)); await settle();
  expect(view.result.current.job?.status).toBe('succeeded'); expect(view.result.current.verified).toBe(false);
  expect(view.result.current.error?.code).toBe('WEB_VERSION_MISMATCH');
  requestMock.mockImplementation(implementation);
  await act(async () => { jest.advanceTimersByTime(2000); }); await settle();
  expect(view.result.current.verified).toBe(true);
});

test('expired or blocked plans never send a create-job request', async () => {
  nextPlan = plan({ expiresAt: new Date(Date.now() - 1000).toISOString() });
  const view = renderHook(() => useSystemUpdate(true)); await settle();
  await act(async () => { await view.result.current.submit(true); });
  expect(submitted).toHaveLength(0); expect(view.result.current.error?.code).toBe('PLAN_EXPIRED');
});

test('submits and tracks an update when secure-context randomUUID is undefined', async () => {
  const descriptor = Object.getOwnPropertyDescriptor(crypto, 'randomUUID');
  try {
    Object.defineProperty(crypto, 'randomUUID', { configurable: true, value: undefined });
    const view = renderHook(() => useSystemUpdate(true)); await settle();
    await act(async () => { await view.result.current.submit(true); });
    expect(submitted).toEqual([{
      planId, acknowledgeDowntime: true,
      idempotencyKey: expect.stringMatching(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/),
    }]);
    expect(view.result.current.state).toBe('tracking');
    expect(view.result.current.error).toBeNull();
    expect(readSavedUpdate()).toEqual({ installationId, jobId });
  } finally {
    if (descriptor) Object.defineProperty(crypto, 'randomUUID', descriptor);
    else Reflect.deleteProperty(crypto, 'randomUUID');
  }
});

test('UUID generation failure is surfaced and does not lock future submission', async () => {
  const view = renderHook(() => useSystemUpdate(true)); await settle();
  const random = jest.spyOn(crypto, 'getRandomValues').mockImplementationOnce(() => { throw new Error('No entropy'); });
  await act(async () => { await view.result.current.submit(true); });
  expect(view.result.current.state).toBe('error');
  expect(view.result.current.error?.code).toBe('INVALID_RESPONSE');
  expect(view.result.current.pending).toBe(false);
  expect(readSavedUpdate()).toBeNull();
  expect(submitted).toHaveLength(0);
  random.mockRestore();
  await act(async () => { await view.result.current.submit(true); });
  expect(submitted).toHaveLength(1);
  expect(view.result.current.state).toBe('tracking');
  expect(view.result.current.error).toBeNull();
});
