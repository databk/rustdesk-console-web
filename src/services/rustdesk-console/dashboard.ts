import { request } from '@umijs/max';

export async function getDashboard() {
  return request<API.DashboardData>('/api/dashboard', {
    method: 'GET',
  });
}

export async function getDashboardTrends(
  params?: {
    range?: '7d' | '30d' | '90d';
  },
  options?: { [key: string]: any },
) {
  return request<API.DashboardTrends>('/api/dashboard/trends', {
    method: 'GET',
    params: {
      range: params?.range || '7d',
    },
    ...(options || {}),
  });
}
