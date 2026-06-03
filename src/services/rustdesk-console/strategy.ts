import { request } from '@umijs/max';

export async function getStrategyList(
  params?: {
    current?: number;
    pageSize?: number;
    name?: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.PaginatedResult<API.StrategyItem>>('/api/strategies', {
    method: 'GET',
    params: {
      current: params?.current || 1,
      pageSize: params?.pageSize || 20,
      name: params?.name,
    },
    ...(options || {}),
  });
}

export async function getStrategy(guid: string) {
  return request<API.StrategyItem>(`/api/strategies/${guid}`, {
    method: 'GET',
  });
}

export async function createStrategy(data: API.CreateStrategyParams) {
  return request<API.StrategyItem>('/api/strategies', { method: 'POST', data });
}

export async function updateStrategy(guid: string, data: API.UpdateStrategyParams) {
  return request<API.StrategyItem>(`/api/strategies/${guid}`, { method: 'PATCH', data });
}

export async function deleteStrategy(guid: string) {
  return request(`/api/strategies/${guid}`, { method: 'DELETE' });
}

export async function assignStrategy(guid: string, data: API.StrategyAssignParams) {
  return request<API.StrategyBatchResult>(`/api/strategies/${guid}/assign`, {
    method: 'POST',
    data,
  });
}

export async function unassignStrategy(guid: string, data: API.StrategyAssignParams) {
  return request<API.StrategyBatchResult>(`/api/strategies/${guid}/unassign`, {
    method: 'POST',
    data,
  });
}
