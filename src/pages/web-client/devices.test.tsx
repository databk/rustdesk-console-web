import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import React from 'react';
import { DevicePicker } from './devices';

let mockOwner: { id: number } | undefined = { id: 1 };
const mockList =
  jest.fn<
    (...args: unknown[]) => Promise<{ data: API.DeviceItem[]; total: number }>
  >();
jest.mock('@/services/rustdesk-console/device', () => ({
  getDeviceList: (...args: unknown[]) => mockList(...args),
}));
jest.mock('@umijs/max', () => ({
  useIntl: () => ({
    formatMessage: ({ defaultMessage }: { defaultMessage: string }) =>
      defaultMessage,
  }),
  useModel: () => ({ initialState: { currentUser: mockOwner } }),
}));
const device = {
  id: '123456789',
  guid: 'one',
  is_online: true,
  info: { device_name: '办公室', os: 'Windows' },
} as API.DeviceItem;
beforeEach(() => {
  mockOwner = { id: 1 };
  mockList.mockReset().mockResolvedValue({ data: [device], total: 7 });
});
afterEach(cleanup);

test('默认读取当前账号的可访问设备，点击卡片直接交付 ID', async () => {
  const connect = jest.fn();
  render(
    React.createElement(DevicePicker, {
      disabled: false,
      onConnect: connect,
    }),
  );
  fireEvent.click(
    await screen.findByRole('button', { name: 'Connect: 办公室 (123456789)' }),
  );
  expect(connect).toHaveBeenCalledWith('123456789');
  expect(mockList).toHaveBeenCalledWith(
    { current: 1, pageSize: 6, status: '1' },
    expect.objectContaining({ signal: expect.any(AbortSignal) }),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  await waitFor(() =>
    expect(mockList).toHaveBeenLastCalledWith(
      { current: 2, pageSize: 6, status: '1' },
      expect.anything(),
    ),
  );
});

test('在线开关重置分页，切换账号立即遮蔽旧数据', async () => {
  const view = render(
    React.createElement(DevicePicker, {
      disabled: false,
      onConnect: jest.fn(),
    }),
  );
  await screen.findByText('办公室');
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  await waitFor(() =>
    expect(mockList).toHaveBeenLastCalledWith(
      expect.objectContaining({ current: 2 }),
      expect.anything(),
    ),
  );
  fireEvent.click(screen.getByRole('switch', { name: 'Online only' }));
  await waitFor(() =>
    expect(mockList).toHaveBeenLastCalledWith(
      { current: 1, pageSize: 6, status: '1', is_online: '1' },
      expect.anything(),
    ),
  );
  await screen.findByText('办公室');
  mockList.mockImplementation(() => new Promise(() => {}));
  mockOwner = { id: 2 };
  view.rerender(
    React.createElement(DevicePicker, {
      disabled: false,
      onConnect: jest.fn(),
    }),
  );
  expect(screen.queryByText('办公室')).toBeNull();
});

test('旧账号的晚到响应被丢弃，失败可刷新重试', async () => {
  let finish!: (value: { data: API.DeviceItem[]; total: number }) => void;
  mockList.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const view = render(
    React.createElement(DevicePicker, {
      disabled: false,
      onConnect: jest.fn(),
    }),
  );
  mockList.mockRejectedValueOnce(new Error('network'));
  mockOwner = { id: 2 };
  view.rerender(
    React.createElement(DevicePicker, {
      disabled: false,
      onConnect: jest.fn(),
    }),
  );
  await screen.findByText(
    'Could not load devices. Refresh to retry, or connect using an ID.',
  );
  await act(async () => finish({ data: [device], total: 1 }));
  expect(screen.queryByText('办公室')).toBeNull();
  fireEvent.click(screen.getByLabelText('Refresh devices'));
  await screen.findByText('办公室');
});
