import { expect, test } from '@jest/globals';
import { getUsernameWatermark } from './generalSettings';

test('includes the username watermark only when enabled', () => {
  expect(getUsernameWatermark({ watermarkEnabled: true }, 'alice')).toEqual({
    content: 'alice',
  });
  expect(
    getUsernameWatermark({ watermarkEnabled: false }, 'alice'),
  ).toBeUndefined();
  expect(
    getUsernameWatermark({ watermarkEnabled: true }, undefined),
  ).toBeUndefined();
});
