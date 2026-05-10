import { request } from '@umijs/max';

export async function getConnectionAudits(
  params: {
    current?: number;
    pageSize?: number;
    remote?: string;
    conn_type?: number;
    created_at?: string;
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
