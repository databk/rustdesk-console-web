import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import { request, history } from '@umijs/max';
import { TOKEN_KEY } from '@/utils/auth';
import {
  createIdempotencyKey, createUpdatePlan, decodeCapabilities, decodeJob, decodePlan, getCurrentUpdateJob,
  getUpdateCapabilities, getUpdateJob, pollingDelay, readSavedUpdate, saveUpdate, submitUpdateJob,
} from './systemUpdate';
import { capability, installationId, job, jobId, plan } from './systemUpdate.testFixtures';
import protocol from './systemUpdate.protocol.fixture.json';

jest.mock('@umijs/max', () => ({ request: jest.fn(), history: { push: jest.fn() }, getIntl: () => ({ formatMessage: ({ defaultMessage }: { defaultMessage: string }) => defaultMessage }) }));
jest.mock('antd', () => ({ message: { error: jest.fn(), warning: jest.fn() }, notification: { open: jest.fn() } }));
const requestMock = jest.mocked(request);
beforeEach(() => { jest.clearAllMocks(); localStorage.clear(); sessionStorage.clear(); });
afterEach(() => { jest.restoreAllMocks(); });

test('consumes the backend-owned route fixture and sends only the allowed body', async () => {
  const body = protocol.routes['POST /api/system-update/jobs'].body;
  requestMock.mockResolvedValueOnce(plan()).mockResolvedValueOnce({ jobId, statusUrl: '/api/system-update/jobs/' + jobId, job: job() });
  await createUpdatePlan();
  await submitUpdateJob({ ...body, acknowledgeDowntime: true, url: 'https://untrusted.invalid' } as typeof body & { acknowledgeDowntime: true });
  expect(requestMock.mock.calls[0]).toEqual(['/api/system-update/plans', expect.objectContaining({ method: 'POST', data: {} })]);
  expect(requestMock.mock.calls[1]).toEqual(['/api/system-update/jobs', expect.objectContaining({ method: 'POST', data: body })]);
});

test.each(Object.entries(protocol.examples.capabilities))('consumes canonical %s capabilities through the request boundary', async (_name, example) => {
  requestMock.mockResolvedValueOnce(example);
  await expect(getUpdateCapabilities()).resolves.toEqual(example);
});

test.each(Object.entries(protocol.examples.plans))('consumes the canonical %s plan without inferring execution eligibility', async (_name, example) => {
  requestMock.mockResolvedValueOnce(example);
  await expect(createUpdatePlan()).resolves.toEqual(example);
});

test.each(Object.entries(protocol.examples.jobs))('preserves the canonical %s result and recovery details', async (_name, example) => {
  requestMock.mockResolvedValueOnce(example);
  await expect(getUpdateJob(example.jobId)).resolves.toEqual(example);
});

test.each(Object.entries(protocol.examples.currentJob))('consumes canonical current-job %s including null job', async (_name, example) => {
  requestMock.mockResolvedValueOnce(example);
  await expect(getCurrentUpdateJob()).resolves.toEqual(example);
});

test('consumes the canonical durable create-job response', async () => {
  const body = { ...protocol.routes['POST /api/system-update/jobs'].body, acknowledgeDowntime: true as const };
  requestMock.mockResolvedValueOnce(protocol.examples.createJob);
  await expect(submitUpdateJob(body)).resolves.toEqual(protocol.examples.createJob);
});

test.each([
  ['job identity', { ...protocol.examples.createJob, jobId: 'different-job' }],
  ['plan identity', { ...protocol.examples.createJob, job: { ...protocol.examples.createJob.job, planId: 'different-plan' } }],
  ['job payload', { ...protocol.examples.createJob, job: null }],
])('rejects a malformed create-job %s instead of tracking it', async (_name, example) => {
  const body = { ...protocol.routes['POST /api/system-update/jobs'].body, acknowledgeDowntime: true as const };
  requestMock.mockResolvedValueOnce(example);
  await expect(submitUpdateJob(body)).rejects.toThrow('INVALID_RESPONSE');
});

test('only a capabilities 404 enables old-backend fallback', async () => {
  requestMock.mockRejectedValue({ response: { status: 404 } });
  await expect(getUpdateCapabilities()).resolves.toBeNull();
  await expect(getCurrentUpdateJob()).rejects.toMatchObject({ status: 404 });
  await expect(getUpdateJob(jobId)).rejects.toMatchObject({ status: 404 });
});

test.each([502, 503, 504])('temporary HTTP %i is retriable and preserves authentication', async status => {
  localStorage.setItem(TOKEN_KEY, 'session');
  requestMock.mockRejectedValue({ response: { status } });
  await expect(getUpdateCapabilities()).rejects.toMatchObject({ status, transient: true });
  expect(localStorage.getItem(TOKEN_KEY)).toBe('session');
  expect(history.push).not.toHaveBeenCalled();
});

test('real 401 follows the existing session-expired flow and retains job identity', async () => {
  localStorage.setItem(TOKEN_KEY, 'expired');
  saveUpdate({ installationId, jobId });
  const listener = jest.fn(); window.addEventListener('auth:session-expired', listener);
  requestMock.mockRejectedValue({ response: { status: 401 } });
  await expect(getUpdateJob(jobId)).rejects.toMatchObject({ status: 401, auth: true, transient: false });
  expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  expect(history.push).toHaveBeenCalledWith('/user/login');
  expect(listener).toHaveBeenCalledTimes(1);
  expect(readSavedUpdate()).toEqual({ installationId, jobId });
  window.removeEventListener('auth:session-expired', listener);
});

test('real 403 refreshes permissions without treating it as a restart', async () => {
  localStorage.setItem(TOKEN_KEY, 'session');
  const listener = jest.fn(); window.addEventListener('auth:permissions-stale', listener);
  requestMock.mockRejectedValue({ response: { status: 403 } });
  await expect(getUpdateCapabilities()).rejects.toMatchObject({ status: 403, auth: true, transient: false });
  expect(listener).toHaveBeenCalledTimes(1);
  expect(localStorage.getItem(TOKEN_KEY)).toBe('session');
  window.removeEventListener('auth:permissions-stale', listener);
});

test('decodes all supported deployment/database combinations without browser inference', () => {
  for (const deployment of ['managed-compose', 'managed-linux'] as const) {
    for (const database of ['sqlite', 'mysql'] as const) expect(decodeCapabilities(capability({ deployment, database }))).toMatchObject({ deployment, database });
  }
});

test('invalid protocol, incomplete components and invented outcomes fail closed', () => {
  expect(() => decodeCapabilities({ ...capability(), protocolVersion: 2 })).toThrow('INVALID_RESPONSE');
  expect(() => decodePlan({ ...plan(), components: [] })).toThrow('INVALID_RESPONSE');
  expect(() => decodeJob({ ...job(), status: 'probably_succeeded' })).toThrow('INVALID_RESPONSE');
});

test('rejects mismatched current installation identity', async () => {
  requestMock.mockResolvedValue({ installationId: 'another-installation', job: job() });
  await expect(getCurrentUpdateJob()).rejects.toThrow('INSTALLATION_CHANGED');
});

test('generates distinct UUIDv4 keys without secure-context randomUUID', () => {
  const descriptor = Object.getOwnPropertyDescriptor(crypto, 'randomUUID');
  try {
    Object.defineProperty(crypto, 'randomUUID', { configurable: true, value: undefined });
    jest.spyOn(Math, 'random').mockImplementation(() => { throw new Error('Insecure entropy'); });
    const a = createIdempotencyKey(); const b = createIdempotencyKey();
    for (const key of [a, b]) {
      expect(key).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
    }
    expect(a).not.toBe(b);
  } finally {
    if (descriptor) Object.defineProperty(crypto, 'randomUUID', descriptor);
    else Reflect.deleteProperty(crypto, 'randomUUID');
  }
});

test.each([
  [0x00, '00000000-0000-4000-8000-000000000000'],
  [0x55, '55555555-5555-4555-9555-555555555555'],
  [0xaa, 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'],
  [0xff, 'ffffffff-ffff-4fff-bfff-ffffffffffff'],
])('sets UUIDv4 version and variant bits while preserving entropy %i', (fill, expected) => {
  const random = jest.spyOn(crypto, 'getRandomValues').mockImplementation(bytes => {
    if (!(bytes instanceof Uint8Array)) throw new Error('Unexpected entropy buffer');
    bytes.fill(fill);
    return bytes;
  });
  expect(createIdempotencyKey()).toBe(expected);
  expect(random).toHaveBeenCalledTimes(1);
  expect(random.mock.calls[0][0]).toHaveLength(16);
});

test('backoff is bounded and storage never requires credentials', () => {
  expect([0, 1, 2, 20].map(pollingDelay)).toEqual([2000, 5000, 10000, 10000]);
  saveUpdate({ installationId, jobId });
  expect(readSavedUpdate()).toEqual({ installationId, jobId });
  expect(localStorage.length).toBe(1);
  saveUpdate(null); expect(readSavedUpdate()).toBeNull();
});
