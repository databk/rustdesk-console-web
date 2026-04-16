import { request } from '@umijs/max';

export async function getStrategyList(
  params?: {
    current?: number;
    pageSize?: number;
    search?: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.PaginatedResult<API.StrategyItem>>('/api/strategies', {
    method: 'GET',
    params: {
      current: params?.current || 1,
      pageSize: params?.pageSize || 20,
      search: params?.search,
    },
    ...(options || {}),
  });
}

export async function createStrategy(data: API.CreateStrategyParams) {
  return request<API.StrategyItem>('/api/strategies', { method: 'POST', data });
}

export async function updateStrategy(guid: string, data: API.UpdateStrategyParams) {
  return request<API.StrategyItem>(`/api/strategies/${guid}`, { method: 'PUT', data });
}

export async function deleteStrategy(guid: string) {
  return request(`/api/strategies/${guid}`, { method: 'DELETE' });
}
