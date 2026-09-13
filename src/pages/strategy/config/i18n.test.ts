import { expect, test } from '@jest/globals';
import enUS from '@/locales/en-US/pages';
import frFR from '@/locales/fr-FR/pages';
import ptBR from '@/locales/pt-BR/pages';
import ruRU from '@/locales/ru-RU/pages';
import zhCN from '@/locales/zh-CN/pages';
import { configOptions } from '../configOptions';
import {
  getConfigOptionLocaleMessageIds,
  getConfigOptionValueMessageId,
  humanizeConfigOptionKey,
} from './i18n';

const locales = { enUS, zhCN, ptBR, ruRU, frFR };
const requiredMessageIds = new Set(
  configOptions.flatMap(getConfigOptionLocaleMessageIds),
);

test('every strategy option has localized labels, descriptions, and values', () => {
  for (const [locale, messages] of Object.entries(locales)) {
    for (const messageId of requiredMessageIds) {
      expect(messages[messageId as keyof typeof messages]).toBeTruthy();
    }

    for (const option of configOptions) {
      const label =
        messages[
          `pages.strategies.option.${option.key}.label` as keyof typeof messages
        ];
      expect(label).not.toBe(option.key);

      if (option.options) {
        for (const value of option.options) {
          const valueMessageId = getConfigOptionValueMessageId(
            option.key,
            value,
          );
          expect(
            messages[valueMessageId as keyof typeof messages],
          ).toBeTruthy();
        }
      }
    }

    expect(locale).toBeTruthy();
  }
});

test('all supported locales expose the same strategy option message IDs', () => {
  const expected = new Set(requiredMessageIds);

  for (const messages of Object.values(locales)) {
    const actual = new Set(
      Object.keys(messages).filter(
        (key) =>
          key.startsWith('pages.strategies.option.') ||
          key.startsWith('pages.strategies.values.'),
      ),
    );
    expect(actual).toEqual(expected);
  }
});

test('localized display metadata does not alter protocol values', () => {
  const select = configOptions.find((option) => option.key === 'access-mode');

  expect(select?.options).toEqual(['custom', 'full', 'view']);
  expect(getConfigOptionValueMessageId('access-mode', 'full')).not.toBe('full');
  expect(humanizeConfigOptionKey('enable-keyboard')).toBe('Enable Keyboard');
});

test('empty defaults stay raw values instead of becoming message IDs', () => {
  const emptyDefaults = configOptions.filter(
    (option) => option.defaultValue.trim() === '',
  );

  expect(emptyDefaults.map((option) => option.key)).toContain('whitelist');

  for (const option of emptyDefaults) {
    expect(getConfigOptionValueMessageId(option.key, option.defaultValue)).toBe(
      undefined,
    );
    expect(getConfigOptionLocaleMessageIds(option)).not.toContain(
      `pages.strategies.option.${option.key}.value.empty`,
    );
  }

  expect(getConfigOptionValueMessageId('whitelist', '   ')).toBeUndefined();
});
