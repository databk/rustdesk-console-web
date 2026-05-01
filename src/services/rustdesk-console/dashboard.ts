import { request } from '@umijs/max';

/**
 * 获取总览数据
 */
export async function getDashboardOverview() {
  return request<API.DashboardOverview>('/api/dashboard/overview', {
    method: 'GET',
  });
}

/**
 * 获取统计数据
 */
export async function getDashboardStatistics() {
  return request<API.DashboardStatistics>('/api/dashboard/statistics', {
    method: 'GET',
  });
}

/**
 * 获取趋势数据
 */
export async function getDashboardTrends(
  params?: {
    range?: '7d' | '30d' | '90d';
    metric?: 'all' | 'connection' | 'user' | 'alarm';
  },
  options?: { [key: string]: any },
) {
  return request<API.DashboardTrends>('/api/dashboard/trends', {
    method: 'GET',
    params: {
      range: params?.range || '7d',
      metric: params?.metric || 'all',
    },
    ...(options || {}),
  });
}

/**
 * 获取实时数据
 */
export async function getDashboardRealtime() {
  return request<API.DashboardRealtime>('/api/dashboard/realtime', {
    method: 'GET',
  });
}
