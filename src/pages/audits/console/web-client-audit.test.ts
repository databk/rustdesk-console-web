import { expect, test } from '@jest/globals';
import { webClientAuditContext, webClientAuditLabel } from './web-client-audit';

test('网页审计只翻译固定操作，明确浏览器报告来源', () => {
  expect(
    webClientAuditLabel('web_client.remote_auth_succeeded', ({ id }) => id),
  ).toBe('pages.audits.webClient.remote_auth_succeeded');
  expect(webClientAuditLabel('other.operation', ({ id }) => id)).toBe(
    'other.operation',
  );
  expect(
    webClientAuditContext({
      guid: 'a',
      target_type: 'web_client_session',
      after_state: JSON.stringify({
        source: 'browser',
        targetId: '123',
        kind: 'file',
        event: 'file_started',
      }),
    }),
  ).toEqual({
    source: 'browser',
    targetId: '123',
    kind: 'file',
    event: 'file_started',
  });
  expect(
    webClientAuditContext({
      guid: 'a',
      target_type: 'web_client_session',
      after_state: {
        source: 'server',
        targetId: '123',
        kind: 'desktop',
        event: 'gateway_open',
      },
    }),
  ).toEqual({
    source: 'server',
    targetId: '123',
    kind: 'desktop',
    event: 'gateway_open',
  });
  expect(
    webClientAuditContext({
      guid: 'a',
      target_type: 'web_client_session',
      after_state: JSON.stringify({
        source: 'server',
        targetId: '123',
        kind: 'desktop',
        event: 'request_denied',
      }),
    }),
  ).toMatchObject({ event: 'request_denied' });
  expect(
    webClientAuditContext({
      guid: 'a',
      target_type: 'native',
      after_state: JSON.stringify({ source: 'server' }),
    }),
  ).toBeUndefined();
  expect(
    webClientAuditContext({
      guid: 'a',
      target_type: 'web_client_session',
      after_state: JSON.stringify({
        source: 'trusted_user_supplied',
        kind: 'unknown',
      }),
    }),
  ).toEqual({ source: undefined, targetId: undefined, kind: undefined });
});
