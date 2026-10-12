import { afterEach, expect, test } from '@jest/globals';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { LegacyEncryptionNotice } from './legacy-notice';
import zh from '../../locales/zh-CN/webClient';
import en from '../../locales/en-US/webClient';
import pt from '../../locales/pt-BR/webClient';
import ru from '../../locales/ru-RU/webClient';

afterEach(cleanup);

test.each(['desktop', 'files'] as const)(
  '旧加密%s提示直接说明风险与升级对象，不暴露核验证据',
  (context) => {
    const text = (key: string, fallback: string) =>
      zh[`webClient.${key}` as keyof typeof zh] || fallback;
    render(
      <LegacyEncryptionNotice text={text} context={context} version="1.4.9" />,
    );
    fireEvent.click(screen.getByRole('button'));
    const note = screen.getByRole('note');
    expect(note.querySelector('strong')?.textContent).toBe('旧版加密');
    expect(note.textContent).toContain('连接仍已加密');
    expect(note.textContent).toContain('更新远端 RustDesk');
    expect(note.textContent).toContain('1.4.9');
    expect(note.textContent).toContain('nightly 是开发版');
    expect(note.textContent).not.toMatch(/SHA|dc446|核验日期|为什么显示/);
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Escape' });
    expect(screen.queryByRole('note')).toBeNull();
  },
);

test.each([zh, en, pt, ru])(
  '四个已支持locale均使用用户说明且保留开发构建限制',
  (locale) => {
    const copy = [
      locale['webClient.legacyTitle'],
      locale['webClient.legacyRisk'],
      locale['webClient.legacyUpgrade'],
      locale['webClient.legacyCompatibility'],
    ].join(' ');
    expect(copy).not.toMatch(/SHA|dc446|2026-09-30|Verified 2026/);
    expect(locale['webClient.legacyCompatibility']).toContain('1.4.9');
    expect(locale['webClient.legacyCompatibility']).toContain('1.5.0');
    expect(locale['webClient.legacyCompatibility']).toContain('nightly');
  },
);
