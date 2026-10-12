import { expect, test } from '@jest/globals';
import zh from './zh-CN/serverNetwork';
import en from './en-US/serverNetwork';
import fr from './fr-FR/serverNetwork';
import pt from './pt-BR/serverNetwork';
import ru from './ru-RU/serverNetwork';
test('all five locales include the same network setting and failure keys', () => {
  const keys = Object.keys(en).sort();
  for (const locale of [zh, en, fr, pt, ru]) {
    expect(Object.keys(locale).sort()).toEqual(keys);
    for (const value of Object.values(locale))
      expect(value.trim()).not.toBe('');
  }
  expect(keys).toContain('pages.servers.network.reason.proxy_unobservable');
  expect(keys).toContain('pages.servers.network.commonAlgorithms');
  expect(keys).not.toContain('pages.servers.network.apply');
});
