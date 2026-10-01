import { request } from '@umijs/max';
import { errorConfig } from '@/requestErrorConfig';

// Public protocol v1, owned by rustdesk-console/src/updater/contracts.ts.
// Keep the wire names (including `web`) independent from presentation labels.
export interface Blocker { code: string; message: string }
export type DatabaseKind = 'sqlite' | 'mysql';
export type DeploymentKind = 'managed-compose' | 'managed-linux';
export interface ComponentChange {
  component: 'backend' | 'web'; action: 'update' | 'unchanged';
  current: string; target: string; releaseUrl: string;
}
export interface Capabilities {
  protocolVersion: 1; installationId: string | null; supported: boolean; ready: boolean;
  deployment: DeploymentKind | null; database: DatabaseKind | null;
  current: { backend: string; web: string } | null; blockers: Blocker[]; activeJobId: string | null;
}
export interface UpdatePlan {
  protocolVersion: 1; installationId: string; planId: string; createdAt: string; expiresAt: string;
  components: ComponentChange[]; changes: boolean; downtime: boolean;
  backup: { database: DatabaseKind; method: string; includesBusinessFiles: true };
  blockers: Blocker[]; executable: boolean;
}
export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'rolled_back' | 'recovery_required';
export type JobPhase = 'preparing' | 'maintenance' | 'backing_up' | 'switching' | 'verifying' | 'updating_helper' | 'committing' | 'restoring';
export interface JobView {
  protocolVersion: 1; installationId: string; jobId: string; planId: string;
  status: JobStatus; phase: JobPhase; components: ComponentChange[];
  createdAt: string; updatedAt: string; finishedAt: string | null;
  resultCode: string | null; safeMessage: string; recoveryGuidance: string | null;
}
export interface CreateJobRequest { planId: string; idempotencyKey: string; acknowledgeDowntime: true }
export interface CreateJobResponse { jobId: string; statusUrl: string; job: JobView }
export interface CurrentJobResponse { installationId: string | null; job: JobView | null }
export interface WebHealth { component: 'web'; version: string; sourceCommit: string; ready: boolean; maintenanceProtocol: 1 }

export class SystemUpdateError extends Error {
  constructor(public readonly code: string, public readonly status?: number) { super(code); }
  get transient() { return this.status === 502 || this.status === 503 || this.status === 504 || this.code === 'NETWORK'; }
  get auth() { return this.status === 401 || this.status === 403; }
}

const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const string = (value: unknown): value is string => typeof value === 'string';
const nullableString = (value: unknown) => value === null || string(value);
const boolean = (value: unknown) => typeof value === 'boolean';
const date = (value: unknown) => string(value) && Number.isFinite(Date.parse(value));
const database = (value: unknown) => value === 'sqlite' || value === 'mysql';
const blockers = (value: unknown) => Array.isArray(value) && value.every(item => object(item) && string(item.code) && string(item.message));
const components = (value: unknown) => Array.isArray(value) && value.length === 2 &&
  new Set(value.map(item => object(item) ? item.component : null)).size === 2 &&
  value.every(item => object(item) && ['backend', 'web'].includes(String(item.component)) &&
    ['update', 'unchanged'].includes(String(item.action)) && string(item.current) && string(item.target) && string(item.releaseUrl));
const protocol = (value: unknown): value is Record<string, unknown> => object(value) && value.protocolVersion === 1;
function decode<T>(value: unknown, valid: boolean): T {
  if (!valid) throw new SystemUpdateError('INVALID_RESPONSE');
  return value as T;
}
export function decodeCapabilities(value: unknown): Capabilities {
  return decode(value, protocol(value) && nullableString(value.installationId) && boolean(value.supported) && boolean(value.ready) &&
    (value.deployment === null || ['managed-compose', 'managed-linux'].includes(String(value.deployment))) &&
    (value.database === null || database(value.database)) &&
    (value.current === null || (object(value.current) && string(value.current.backend) && string(value.current.web))) &&
    blockers(value.blockers) && nullableString(value.activeJobId));
}
export function decodePlan(value: unknown): UpdatePlan {
  return decode(value, protocol(value) && string(value.installationId) && string(value.planId) && date(value.createdAt) && date(value.expiresAt) &&
    components(value.components) && boolean(value.changes) && boolean(value.downtime) && boolean(value.executable) && blockers(value.blockers) &&
    object(value.backup) && database(value.backup.database) && string(value.backup.method) && value.backup.includesBusinessFiles === true);
}
export function decodeJob(value: unknown): JobView {
  return decode(value, protocol(value) && string(value.installationId) && string(value.jobId) && string(value.planId) &&
    ['queued', 'running', 'succeeded', 'failed', 'rolled_back', 'recovery_required'].includes(String(value.status)) &&
    ['preparing', 'maintenance', 'backing_up', 'switching', 'verifying', 'updating_helper', 'committing', 'restoring'].includes(String(value.phase)) &&
    components(value.components) && date(value.createdAt) && date(value.updatedAt) &&
    (value.finishedAt === null || date(value.finishedAt)) && nullableString(value.resultCode) && string(value.safeMessage) && nullableString(value.recoveryGuidance));
}

async function updateRequest(path: string, method = 'GET', data?: CreateJobRequest | Record<string, never>): Promise<unknown> {
  try {
    return await request(path, { method, ...(data ? { data } : {}), skipErrorHandler: true, timeout: 15000, headers: { 'Cache-Control': 'no-cache' } });
  } catch (error: unknown) {
    const response = object(error) && object(error.response) ? error.response : undefined;
    const status = response && typeof response.status === 'number' ? response.status : undefined;
    // Only this request family suppresses global errors; restore actual auth behavior.
    if (status === 401 || status === 403) errorConfig.errorConfig?.errorHandler?.(Object.assign(new Error('Authentication failed'), { response }), {});
    const body = response && object(response.data) ? response.data : undefined;
    throw new SystemUpdateError(body && string(body.code) ? body.code : status ? 'HTTP_ERROR' : 'NETWORK', status);
  }
}

export async function getUpdateCapabilities(): Promise<Capabilities | null> {
  try { return decodeCapabilities(await updateRequest('/api/system-update/capabilities')); }
  catch (error) { if (error instanceof SystemUpdateError && error.status === 404) return null; throw error; }
}
export async function createUpdatePlan() { return decodePlan(await updateRequest('/api/system-update/plans', 'POST', {})); }
export async function getCurrentUpdateJob(): Promise<CurrentJobResponse> {
  const value = await updateRequest('/api/system-update/jobs/current');
  if (!object(value) || !nullableString(value.installationId)) throw new SystemUpdateError('INVALID_RESPONSE');
  const job = value.job === null ? null : decodeJob(value.job);
  if (job && job.installationId !== value.installationId) throw new SystemUpdateError('INSTALLATION_CHANGED');
  return { installationId: value.installationId as string | null, job };
}
export async function getUpdateJob(id: string) { return decodeJob(await updateRequest(`/api/system-update/jobs/${encodeURIComponent(id)}`)); }
export async function submitUpdateJob(data: CreateJobRequest): Promise<CreateJobResponse> {
  // Reconstruct the allowed request: callers cannot smuggle version/URL/command fields.
  const value = await updateRequest('/api/system-update/jobs', 'POST', { planId: data.planId, idempotencyKey: data.idempotencyKey, acknowledgeDowntime: true });
  if (!object(value) || !string(value.jobId) || !string(value.statusUrl)) throw new SystemUpdateError('INVALID_RESPONSE');
  const job = decodeJob(value.job);
  if (job.jobId !== value.jobId || job.planId !== data.planId) throw new SystemUpdateError('INVALID_RESPONSE');
  return { jobId: value.jobId, statusUrl: value.statusUrl, job };
}
export async function getWebHealth(): Promise<WebHealth> {
  const value = await updateRequest('/system-update-health.json');
  return decode(value, object(value) && value.component === 'web' && string(value.version) && string(value.sourceCommit) &&
    /^[a-f0-9]{40}$/.test(value.sourceCommit) && boolean(value.ready) && value.maintenanceProtocol === 1);
}
export const isTerminalJob = (job: JobView) => job.status !== 'queued' && job.status !== 'running';
export const pollingDelay = (failures: number) => [2000, 5000, 10000][Math.min(Math.max(failures, 0), 2)];
export function createIdempotencyKey() {
  // getRandomValues also works on existing HTTP installations where randomUUID is absent.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = [...bytes].map(value => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// Browser state contains identifiers only, scoped by origin and checked against the server.
export interface SavedUpdate { installationId: string; jobId?: string; submission?: CreateJobRequest }
const STORAGE_KEY = 'console.system-update.v1';
export function readSavedUpdate(): SavedUpdate | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!object(value) || !string(value.installationId) || (value.jobId !== undefined && !string(value.jobId))) return null;
    if (value.submission !== undefined && (!object(value.submission) || !string(value.submission.planId) || !string(value.submission.idempotencyKey) || value.submission.acknowledgeDowntime !== true)) return null;
    return value as unknown as SavedUpdate;
  } catch { return null; }
}
export function saveUpdate(value: SavedUpdate | null) {
  try { if (value) localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); else localStorage.removeItem(STORAGE_KEY); } catch { /* The server's current job remains the source of truth. */ }
}
