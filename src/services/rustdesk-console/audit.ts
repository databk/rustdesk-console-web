import { request } from '@umijs/max';

export async function getConnectionAudits(
  params: API.ConnectionAuditQueryParams,
  options?: Record<string, unknown>,
) {
  return request<API.PaginatedResult<API.ConnectionAuditItem>>('/api/audits/conn', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function getActiveConnections(
  params: API.ActiveConnectionQueryParams,
  options?: Record<string, unknown>,
) {
  return request<API.PaginatedResult<API.ActiveConnectionItem>>(
    '/api/audits/conn/active',
    {
      method: 'GET',
      params,
      ...(options || {}),
    },
  );
}

export async function getFileAudits(
  params: API.FileAuditQueryParams,
  options?: Record<string, unknown>,
) {
  return request<API.PaginatedResult<API.FileAuditItem>>('/api/audits/file', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function getAlarmAudits(
  params: API.AlarmAuditQueryParams,
  options?: Record<string, unknown>,
) {
  return request<API.PaginatedResult<API.AlarmAuditItem>>('/api/audits/alarm', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function getConsoleAudits(
  params: API.ConsoleAuditQueryParams,
  options?: Record<string, unknown>,
) {
  return request<API.PaginatedResult<API.ConsoleAuditItem>>('/api/audits/console', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function updateConnectionAudit(
  id: number,
  data: { note: string },
  options?: Record<string, unknown>,
) {
  return request<API.ResponseResult>(`/api/audits/conn/${id}`, {
    method: 'PATCH',
    data,
    ...(options || {}),
  });
}

export async function disconnectConnection(
  uuid: string,
  connIds: number[],
  options?: Record<string, unknown>,
) {
  return request<API.ResponseResult>(`/api/devices/${uuid}/disconnect`, {
    method: 'POST',
    data: { connIds },
    ...(options || {}),
  });
}
