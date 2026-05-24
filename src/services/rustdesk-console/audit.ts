import { request } from '@umijs/max';

export async function getConnectionAudits(
  params: {
    current?: number;
    pageSize?: number;
    deviceId?: string;
    type?: number;
    startTime?: string;
    endTime?: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.PaginatedResult<API.ConnectionAuditItem>>('/api/audits/conn', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function getFileAudits(
  params: {
    current?: number;
    pageSize?: number;
    peerId?: string;
    type?: number;
    startTime?: string;
    endTime?: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.PaginatedResult<API.FileAuditItem>>('/api/audits/file', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function getAlarmAudits(
  params: {
    current?: number;
    pageSize?: number;
    created_at?: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.PaginatedResult<API.AlarmAuditItem>>('/api/audits/alarm', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function getConsoleAudits(
  params: {
    current?: number;
    pageSize?: number;
    created_at?: string;
  },
  options?: { [key: string]: any },
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
  options?: { [key: string]: any },
) {
  return request<API.ResponseResult>(`/api/audits/conn/${id}`, {
    method: 'PATCH',
    data,
    ...(options || {}),
  });
}

export async function disconnectConnection(
  connId: string,
  options?: { [key: string]: any },
) {
  return request<API.ResponseResult>('/api/audits/conn/disconnect', {
    method: 'POST',
    data: { connId },
    ...(options || {}),
  });
}
