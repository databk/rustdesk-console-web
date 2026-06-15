import { request } from '@umijs/max';

/**
 * 获取 LDAP 配置
 */
export async function getLdapConfig() {
  return request<API.LdapConfig>('/api/settings/ldap', {
    method: 'GET',
    skipErrorHandler: true,
  });
}

/**
 * 创建或更新 LDAP 配置
 */
export async function updateLdapConfig(data: API.UpdateLdapConfigParams) {
  return request<API.LdapConfig>('/api/settings/ldap', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    data,
  });
}

/**
 * 测试 LDAP 连接
 */
export async function testLdapConfig(data?: API.TestLdapConfigParams) {
  return request<API.TestLdapResult>('/api/settings/ldap/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
  });
}
