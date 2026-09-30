/** @jest-environment node */
import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import { hbb } from '../protocol';
import { RemotePaste, PASTE_SETTLE_MS } from './paste';
import { MAX_TEXT_BYTES } from './text';

const mockImage = jest.fn<(value: unknown) => Promise<Uint8Array>>();
jest.mock('./image', () => ({
  clipboardPng: (value: unknown) => mockImage(value),
}));
beforeEach(() => {
  jest.useFakeTimers();
  mockImage.mockReset();
});
afterEach(() => jest.useRealTimers());
function setup() {
  const transport = {
    clipboard: jest.fn<() => boolean>().mockReturnValue(true),
    image: jest.fn<() => boolean>().mockReturnValue(true),
    flush: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    input: jest.fn<() => boolean>().mockReturnValue(true),
    status: jest.fn(),
  };
  return { transport, paste: new RemotePaste(transport) };
}

test('文字先发送剪贴板，稍后仅发送一次远端粘贴快捷键', async () => {
  const { transport, paste } = setup();
  await paste.send({ text: '本机复制的文字' }, () => true, false);
  expect(transport.clipboard).toHaveBeenCalledTimes(1);
  expect(transport.input).not.toHaveBeenCalled();
  jest.advanceTimersByTime(PASTE_SETTLE_MS);
  expect(transport.input).toHaveBeenCalledWith({
    keyEvent: {
      chr: 118,
      press: true,
      mode: hbb.KeyboardMode.Legacy,
      modifiers: [hbb.ControlKey.Control],
    },
  });
  expect(transport.status).toHaveBeenLastCalledWith('sent');
});

test('发送队列尚未清空时不开始粘贴延时', async () => {
  const { transport, paste } = setup();
  let finish!: () => void;
  transport.flush.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const job = paste.send({ text: '排队内容' }, () => true, false);
  jest.advanceTimersByTime(5000);
  expect(transport.input).not.toHaveBeenCalled();
  finish();
  await job;
  jest.advanceTimersByTime(PASTE_SETTLE_MS);
  expect(transport.input).toHaveBeenCalledTimes(1);
});

test('图片转换完成前不发送快捷键；Mac 使用 Meta', async () => {
  let finish!: (value: Uint8Array) => void;
  mockImage.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const { transport, paste } = setup();
  const job = paste.send({ bytes: new Uint8Array([1]) }, () => true, true);
  jest.advanceTimersByTime(1000);
  expect(transport.input).not.toHaveBeenCalled();
  expect(transport.image).not.toHaveBeenCalled();
  finish(new Uint8Array([2]));
  await job;
  expect(transport.image).toHaveBeenCalledWith(new Uint8Array([2]));
  jest.advanceTimersByTime(PASTE_SETTLE_MS);
  expect(transport.input).toHaveBeenCalledWith({
    keyEvent: expect.objectContaining({ modifiers: [hbb.ControlKey.Meta] }),
  });
});

test('离开输入目标或会话失效时取消排队的粘贴', async () => {
  const { transport, paste } = setup();
  await paste.send({ text: 'old' }, () => true, false);
  paste.cancel();
  jest.runAllTimers();
  expect(transport.input).not.toHaveBeenCalled();
  let valid = true;
  await paste.send({ text: 'other' }, () => valid, false);
  valid = false;
  jest.runAllTimers();
  expect(transport.input).not.toHaveBeenCalled();
});

test('旧图片异步完成不会污染新会话，也不会清除新会话忙状态', async () => {
  let finish!: (value: Uint8Array) => void;
  mockImage.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const { transport, paste } = setup();
  const old = paste.send({ bytes: new Uint8Array([1]) }, () => true, false);
  paste.cancel();
  await paste.send({ text: 'new' }, () => true, false);
  finish(new Uint8Array([2]));
  await old;
  await paste.send({ text: 'duplicate' }, () => true, false);
  jest.runAllTimers();
  expect(transport.image).not.toHaveBeenCalled();
  expect(transport.clipboard).toHaveBeenCalledTimes(1);
  expect(transport.input).toHaveBeenCalledTimes(1);
});

test('大小或权限不符合要求、图片失败、发送失败均不会粘贴旧内容', async () => {
  const { transport, paste } = setup();
  await paste.send({ text: 'blocked' }, () => false, false);
  await paste.send(
    { text: '大'.repeat(MAX_TEXT_BYTES / 2) },
    () => true,
    false,
  );
  mockImage.mockRejectedValue(new Error('Invalid PNG'));
  await paste.send({ bytes: new Uint8Array([1]) }, () => true, false);
  transport.clipboard.mockReturnValue(false);
  await paste.send({ text: 'failed' }, () => true, false);
  jest.runAllTimers();
  expect(transport.image).not.toHaveBeenCalled();
  expect(transport.input).not.toHaveBeenCalled();
  expect(transport.status).toHaveBeenLastCalledWith('failed');
});
