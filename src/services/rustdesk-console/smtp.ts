import { request } from '@umijs/max';

/**
 * 获取 SMTP 配置
 */
export async function getSMTPConfig() {
  return request<API.SMTPConfig>('/api/settings/smtp', {
    method: 'GET',
    skipErrorHandler: true,
  });
}

/**
 * 更新 SMTP 配置
 */
export async function updateSMTPConfig(data: API.UpdateSMTPConfigParams) {
  return request<API.SMTPConfig>('/api/settings/smtp', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    data,
  });
}

/**
 * 测试 SMTP 连接
 */
export async function testSMTPConfig(data?: API.TestSMTPConfigParams) {
  return request<API.TestSMTPResult>('/api/settings/smtp/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
  });
}
