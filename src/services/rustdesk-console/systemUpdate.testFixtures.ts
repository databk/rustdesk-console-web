import { type Capabilities, type JobView, type UpdatePlan, decodeCapabilities, decodeJob, decodePlan } from './systemUpdate';
import protocol from './systemUpdate.protocol.fixture.json';

// Byte-for-byte snapshot of runtime-owned src/updater/protocol.fixture.json.
// Decode examples at the service boundary; only rebase dates for live timer tests.
const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
export const installationId = protocol.examples.capabilities.ready.installationId;
export const planId = protocol.examples.plans.both.planId;
export const jobId = protocol.examples.jobs.running.jobId;
export function capability(overrides: Partial<Capabilities> = {}, example: keyof typeof protocol.examples.capabilities = 'ready'): Capabilities {
  return { ...decodeCapabilities(copy(protocol.examples.capabilities[example])), ...overrides };
}
export function plan(overrides: Partial<UpdatePlan> = {}, example: keyof typeof protocol.examples.plans = 'both'): UpdatePlan {
  return {
    ...decodePlan(copy(protocol.examples.plans[example])),
    createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 900000).toISOString(), ...overrides,
  };
}
export function job(overrides: Partial<JobView> = {}): JobView {
  return { ...decodeJob(copy(protocol.examples.jobs[overrides.status || 'running'])), ...overrides };
}
