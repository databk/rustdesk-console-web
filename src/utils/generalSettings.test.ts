import { expect, test } from '@jest/globals';
import {
  containsControlCharacters,
  getRuntimePageTitle,
  getUsernameWatermark,
} from './generalSettings';

test('detects control characters without rejecting ordinary symbols', () => {
  expect(containsControlCharacters('Operations #1')).toBe(false);
  expect(containsControlCharacters('Operations\n')).toBe(true);
});

test('applies the runtime site name to page titles', () => {
  expect(
    getRuntimePageTitle('Dashboard - RustDesk Console', 'Operations'),
  ).toBe('Dashboard - Operations');
  expect(getRuntimePageTitle('RustDesk Console', 'Operations')).toBe(
    'Operations',
  );
  expect(getRuntimePageTitle('Dashboard - Operations', 'Operations')).toBe(
    'Dashboard - Operations',
  );
});

test('includes the username watermark only when enabled', () => {
  expect(
    getUsernameWatermark(
      { siteName: 'Operations', watermarkEnabled: true },
      'alice',
    ),
  ).toEqual({ content: 'alice' });
  expect(
    getUsernameWatermark(
      { siteName: 'Operations', watermarkEnabled: false },
      'alice',
    ),
  ).toBeUndefined();
  expect(
    getUsernameWatermark(
      { siteName: 'Operations', watermarkEnabled: true },
      undefined,
    ),
  ).toBeUndefined();
});
