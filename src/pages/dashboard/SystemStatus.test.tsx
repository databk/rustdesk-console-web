import { afterEach, expect, jest, test } from '@jest/globals';
import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import SystemStatus from './SystemStatus';

jest.mock('@umijs/max', () => ({
  FormattedMessage: ({ defaultMessage }: { defaultMessage: string }) =>
    defaultMessage,
}));

afterEach(cleanup);

test('renders unavailable system metrics as dashes instead of zeros', () => {
  render(
    React.createElement(SystemStatus, {
      systemStatus: { cpu: null, memory: 42, disk: null, uptime: null },
    }),
  );

  expect(screen.getAllByText('--')).toHaveLength(2);
  expect(screen.getByText(/Uptime/).textContent).toContain('--');
  expect(screen.getByText('42%')).not.toBeNull();
  expect(screen.queryByText('0%')).toBeNull();
});

test('keeps genuine zero metrics visible', () => {
  render(
    React.createElement(SystemStatus, {
      systemStatus: { cpu: 0, memory: 0, disk: 0, uptime: 0 },
    }),
  );

  expect(screen.getAllByText('0%')).toHaveLength(3);
  expect(screen.getByText(/Uptime/).textContent).toContain('0d 0h 0m');
});
