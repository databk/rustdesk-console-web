import { expect, test } from '@jest/globals';
import en from './en-US/pages';
import zh from './zh-CN/pages';
import fr from './fr-FR/pages';
import pt from './pt-BR/pages';
import ru from './ru-RU/pages';
const keys = Object.keys(en).filter(
  (key) =>
    key.startsWith('pages.audits.webClient.') ||
    key.includes('roles.permission.web_client.') ||
    key === 'pages.roles.resource.web_client',
);
test.each([
  ['中文', zh],
  ['英语', en],
  ['法语', fr],
  ['葡萄牙语', pt],
  ['俄语', ru],
] as const)('%s 网页角色和审计文案完整', (_, dictionary) => {
  expect(keys.length).toBe(22);
  for (const key of keys)
    expect((dictionary as Record<string, string>)[key]?.trim()).toBeTruthy();
});
