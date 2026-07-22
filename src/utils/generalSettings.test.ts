import { expect, test } from '@jest/globals';
import { getUsernameWatermark } from './generalSettings';

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
