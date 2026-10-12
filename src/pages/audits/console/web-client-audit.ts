type Formatter = (message: { id: string; defaultMessage: string }) => string;
const events = new Set([
  'request_allowed',
  'request_denied',
  'gateway_open',
  'session_ended',
  'remote_auth_succeeded',
  'remote_auth_failed',
  'file_started',
  'file_completed',
  'file_failed',
]);
export function webClientAuditLabel(
  action: string | undefined,
  format: Formatter,
) {
  const event = action?.startsWith('web_client.')
    ? action.slice(11)
    : undefined;
  return event && events.has(event)
    ? format({
        id: `pages.audits.webClient.${event}`,
        defaultMessage: action || event,
      })
    : action || '-';
}
export function webClientAuditContext(record: API.ConsoleAuditItem) {
  if (record.target_type !== 'web_client_session' || !record.after_state)
    return;
  let value: unknown = record.after_state;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value) as unknown;
    } catch {
      return;
    }
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;
  const data = value as Record<string, unknown>;
  const event =
    typeof data.event === 'string' && events.has(data.event)
      ? data.event
      : undefined;
  return {
    source:
      data.source === 'browser' || data.source === 'server'
        ? data.source
        : undefined,
    targetId: typeof data.targetId === 'string' ? data.targetId : undefined,
    kind:
      data.kind === 'file' || data.kind === 'desktop' ? data.kind : undefined,
    ...(event ? { event } : {}),
  };
}
