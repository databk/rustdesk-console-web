import { expect, test } from '@jest/globals';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { SessionState } from '../features/web-client/core/session';
import type { SessionErrorCode } from '../features/web-client/core/errors';
import type { CallState } from '../features/web-client/worker/contract';
import type { PasteStatus } from '../features/web-client/clipboard/paste';
import type { FileProgress } from '../features/web-client/files/transfer';
import en from './en-US/webClient';
import frenchEntry from './fr-FR';
import fr from './fr-FR/webClient';
import pt from './pt-BR/webClient';
import ru from './ru-RU/webClient';
import zh from './zh-CN/webClient';

const dictionaries: Record<string, Record<string, string>> = {
  'zh-CN': zh,
  'en-US': en,
  'pt-BR': pt,
  'ru-RU': ru,
  'fr-FR': fr,
};
const english: Record<string, string> = en;
const keys = Object.keys(english).sort();
const sharedTerms = new Set([
  'Chat',
  'Codec',
  'Cursor',
  'Message',
  'Offline',
  'Online',
  'Session',
  'Type',
  'Volume',
  'Zoom',
]);

function parameters(message: string): string[] {
  return Array.from(
    new Set(
      Array.from(
        message.matchAll(/\{\s*([A-Za-z][A-Za-z0-9_]*)\s*(?:,|\})/g),
        (match) => match[1],
      ),
    ),
  ).sort();
}

test.each(Object.entries(dictionaries))(
  '%s 网页远控文案完整、无重复或空值，消息参数与基准一致',
  (language, dictionary) => {
    expect(Object.keys(dictionary).sort()).toEqual(keys);
    const source = readFileSync(
      join(__dirname, language, 'webClient.ts'),
      'utf8',
    );
    const declared = Array.from(
      source.matchAll(/^\s*'((?:webClient\.|menu\.webClient)[^']*)'\s*:/gm),
      (match) => match[1],
    );
    expect(declared.length).toBe(keys.length);
    expect(new Set(declared).size).toBe(declared.length);
    for (const key of keys) {
      expect({ key, empty: dictionary[key].trim().length === 0 }).toEqual({
        key,
        empty: false,
      });
      expect({ key, parameters: parameters(dictionary[key]) }).toEqual({
        key,
        parameters: parameters(english[key]),
      });
      if (language !== 'en-US' && !sharedTerms.has(english[key])) {
        expect({
          key,
          copiedEnglish: dictionary[key] === english[key],
        }).toEqual({
          key,
          copiedEnglish: false,
        });
      }
    }
  },
);

test('法语入口实际包含整套网页远控文案', () => {
  const entry: Record<string, string> = frenchEntry;
  for (const [key, message] of Object.entries(fr)) {
    expect({ key, message: entry[key] }).toEqual({ key, message });
  }
});

test('会话、权限、粘贴和文件的动态状态也都有翻译', () => {
  const states: SessionState[] = [
    'idle',
    'connecting',
    'securing',
    'checkingCredentials',
    'automaticAuthenticating',
    'authenticating',
    'awaitingApproval',
    'connected',
    'closed',
    'failed',
  ];
  const errors: (
    | SessionErrorCode
    | 'unsupported'
    | 'media'
    | 'worker'
    | 'clipboard'
    | 'fullscreen'
    | 'audio'
    | 'files'
    | 'filePath'
    | 'localFiles'
  )[] = [
    'configuration',
    'identity',
    'encryption',
    'password',
    'denied',
    'offline',
    'timeout',
    'transport',
    'protocol',
    'overload',
    'unsupported',
    'media',
    'worker',
    'clipboard',
    'fullscreen',
    'cancelled',
    'audio',
    'files',
    'filePath',
    'localFiles',
  ];
  const phases: FileProgress['phase'][] = [
    'waiting',
    'transferring',
    'conflict',
    'verifying',
    'done',
    'skipped',
    'cancelled',
    'error',
  ];
  const results: (Exclude<PasteStatus, 'cancelled'> | 'denied')[] = [
    'sending',
    'sent',
    'failed',
    'denied',
    'image-too-large',
  ];
  const calls: (CallState | 'preparing')[] = [
    'idle',
    'preparing',
    'requesting',
    'active',
    'declined',
    'timeout',
    'failed',
    'ended',
  ];
  const dynamicKeys = [
    ...states.map((state) => `state.${state}`),
    ...errors.map((error) => `error.${error}`),
    ...phases.map((phase) => `filePhase.${phase}`),
    ...results.map((result) => `paste.${result}`),
    ...calls.map((state) => `call${state[0].toUpperCase()}${state.slice(1)}`),
    'keyboardLeftKey',
    'keyboardRightKey',
  ];
  for (const key of dynamicKeys) {
    for (const [language, dictionary] of Object.entries(dictionaries)) {
      expect({
        language,
        key,
        translated: !!dictionary[`webClient.${key}`]?.trim(),
      }).toEqual({ language, key, translated: true });
    }
  }
});

test('实际会话组件的静态及条件文案键均有五语翻译，不依赖英文回退', () => {
  const pageDirectory = join(__dirname, '../pages/web-client');
  const referenced = new Set<string>();
  for (const file of readdirSync(pageDirectory)) {
    if (!file.endsWith('.tsx') || file.endsWith('.test.tsx')) continue;
    const source = readFileSync(join(pageDirectory, file), 'utf8');
    for (const match of source.matchAll(
      /(?:\btext|\btextRef\.current)\(\s*(['"])([A-Za-z][A-Za-z0-9_.-]*)\1\s*[,)]/g,
    )) {
      referenced.add(`webClient.${match[2]}`);
    }
    for (const call of source.matchAll(
      /(?:\btext|\btextRef\.current)\(\s*([^,]+),/g,
    )) {
      for (const branch of call[1].matchAll(
        /[?:]\s*(['"])([A-Za-z][A-Za-z0-9_.-]*)\1(?!\s*\+)/g,
      )) {
        referenced.add(`webClient.${branch[2]}`);
      }
    }
  }
  expect(referenced.size).toBeGreaterThan(100);
  for (const key of referenced) {
    for (const [language, dictionary] of Object.entries(dictionaries)) {
      expect({
        language,
        key,
        translated: (dictionary[key]?.trim().length || 0) > 0,
      }).toEqual({ language, key, translated: true });
    }
  }
});

test('中文快捷键状态与已批准文案一致，键名参数可以实际替换', () => {
  expect(zh['webClient.captureIdle']).toBe('未开启快捷键接管');
  expect(zh['webClient.captureEnterFullscreen']).toBe('全屏并开启');
  expect(zh['webClient.captureEnable']).toBe('开启接管');
  expect(zh['webClient.captureRequesting']).toBe('正在开启快捷键接管…');
  expect(zh['webClient.capturePendingAction']).toBe('开启中…');
  expect(zh['webClient.captureLocked']).toBe('快捷键接管已开启');
  expect(zh['webClient.captureDisable']).toBe('关闭接管');
  expect(zh['webClient.captureDenied']).toBe('未能开启快捷键接管');
  expect(zh['webClient.captureRetry']).toBe('重试');
  expect(zh['webClient.captureUnsupported']).toBe('当前浏览器不支持快捷键接管');
  expect(zh['webClient.captureRemoteDenied']).toBe('对方未允许键鼠操作');
  expect(zh['webClient.viewOnlyReason']).toBe('仅查看模式下无法发送键鼠操作');
  expect(zh['webClient.captureNonFullscreenHint']).toBe(
    '非全屏：部分快捷键可能触发本机或浏览器的操作。',
  );
  expect(zh['webClient.captureFullscreenHint']).toBe(
    '全屏并开启接管：可将更多快捷键发送到远端。',
  );
  expect(zh['webClient.captureSystemHint']).toBe(
    '部分系统快捷键仍可能在本机生效。',
  );
  expect(zh['webClient.captureUnsupportedHint']).toBe(
    '可改用屏幕键盘发送按键。',
  );
  for (const dictionary of Object.values(dictionaries)) {
    expect(parameters(dictionary['webClient.keyboardKey'])).toEqual(['key']);
    expect(
      dictionary['webClient.keyboardKey'].replace('{key}', 'Ctrl'),
    ).toContain('Ctrl');
  }
});
