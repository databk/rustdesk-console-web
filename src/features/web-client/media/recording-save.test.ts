import '../input/dom-test-encoding';
import { expect, jest, test } from '@jest/globals';
import { RECORD_LIMITS } from './recorder';
import { recordingSink } from './recording-save';
import { durationOffset, webmFrame, webmHeader } from './webm';

test('真实保存接口逐块写入并seek回填Duration，空录制中止文件', async () => {
  const chunks: Uint8Array[] = [];
  const writer = {
    write: jest.fn<(...args: [Uint8Array]) => Promise<void>>(async (b) => {
      chunks.push(new Uint8Array(b));
    }),
    seek: jest.fn<(...args: [number]) => Promise<void>>().mockResolvedValue(),
    close: jest.fn<() => Promise<void>>().mockResolvedValue(),
    abort: jest.fn<() => Promise<void>>().mockResolvedValue(),
  };
  const sink = recordingSink('test.webm', writer);
  const header = webmHeader('vp8', 160, 96),
    frame = webmFrame(new Uint8Array([1]), 0, true);
  await sink.write(header);
  await sink.write(frame);
  sink.duration(800);
  await sink.close();
  expect(writer.seek.mock.calls).toEqual([
    [durationOffset(header)],
    [header.length + frame.length],
  ]);
  expect(new DataView(chunks[2].buffer).getFloat64(0)).toBe(800);
  expect(writer.close).toHaveBeenCalledTimes(1);
  expect(writer.abort).not.toHaveBeenCalled();
  const empty = recordingSink('empty.webm', writer);
  await empty.close();
  expect(writer.abort).toHaveBeenCalledTimes(1);
});
test('保存回填失败必须中止writer；超大块被拒绝', async () => {
  const abort = jest.fn<() => Promise<void>>().mockResolvedValue();
  const writer = {
    write: async () => {},
    seek: async () => {
      throw new Error('Disk failed');
    },
    close: async () => {},
    abort,
  };
  const sink = recordingSink('test.webm', writer);
  await sink.write(webmHeader('vp9', 160, 96));
  sink.duration(20);
  await expect(sink.close()).rejects.toThrow('Disk failed');
  expect(abort).toHaveBeenCalled();
  await expect(
    recordingSink('bounded.webm').write(
      new Uint8Array(RECORD_LIMITS.block + 1),
    ),
  ).rejects.toThrow();
});

test('收尾seek挂起时仍可abort；迟到seek不能继续写入或close', async () => {
  let resolve: (() => void) | undefined;
  const writer = {
    write: jest
      .fn<(...args: [Uint8Array]) => Promise<void>>()
      .mockResolvedValue(),
    seek: jest.fn<(...args: [number]) => Promise<void>>(
      () =>
        new Promise<void>((r) => {
          resolve = r;
        }),
    ),
    close: jest.fn<() => Promise<void>>().mockResolvedValue(),
    abort: jest.fn<() => Promise<void>>().mockResolvedValue(),
  };
  const sink = recordingSink('test.webm', writer);
  await sink.write(webmHeader('vp9', 160, 96));
  const closing = sink.close();
  await sink.abort();
  expect(writer.abort).toHaveBeenCalledTimes(1);
  resolve?.();
  await expect(closing).rejects.toThrow('Recording cancelled');
  expect(writer.write).toHaveBeenCalledTimes(1);
  expect(writer.close).not.toHaveBeenCalled();
});
