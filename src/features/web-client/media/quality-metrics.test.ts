import { expect, test } from '@jest/globals';
import { QualitySampler } from './quality-metrics';

test('首个采样留空，帧率按实际绘制数、码率按实际时间计算', () => {
  const sampler = new QualitySampler();
  const counters = {
    decoded: 100,
    received: 150,
    videoBytes: 1000,
    displayGeneration: 1,
    delay: 42,
  };
  expect(sampler.sample(1000, 10, counters)).toEqual({ delay: 42 });
  expect(
    sampler.sample(2500, 40, {
      ...counters,
      received: 225,
      decoded: 160,
      videoBytes: 301000,
    }),
  ).toEqual({
    fps: 20,
    receivedFps: 50,
    decodedFps: 40,
    videoBitrate: 1600000,
    delay: 42,
  });
  expect(
    sampler.sample(3500, 40, {
      ...counters,
      received: 225,
      decoded: 160,
      videoBytes: 301000,
    }),
  ).toEqual({
    fps: 0,
    receivedFps: 0,
    decodedFps: 0,
    videoBitrate: 0,
    delay: 42,
  });
});

test('诊断读数只取有界有限耗时；解码或接收回退清旧窗口', () => {
  const sampler = new QualitySampler();
  const initial = {
    received: 20,
    decoded: 10,
    videoBytes: 100,
    displayGeneration: 1,
  };
  sampler.sample(0, 5, initial);
  expect(
    sampler.sample(1000, 10, {
      ...initial,
      received: 40,
      decoded: 20,
      videoBytes: 200,
      decodeLatencyMs: 5,
      ackLatencyMs: 8,
      presentationLatencyMs: 3,
      decodeQueue: 2,
      pendingBatches: 1,
    }),
  ).toMatchObject({
    fps: 5,
    receivedFps: 20,
    decodedFps: 10,
    decodeLatencyMs: 5,
    ackLatencyMs: 8,
    presentationLatencyMs: 3,
    decodeQueue: 2,
    pendingBatches: 1,
  });
  expect(
    sampler.sample(2000, 11, {
      ...initial,
      received: 41,
      decoded: 1,
      videoBytes: 300,
    }),
  ).toEqual({ delay: undefined });
  expect(
    sampler.sample(3000, 12, {
      ...initial,
      received: 1,
      decoded: 2,
      videoBytes: 400,
      decodeLatencyMs: Infinity,
      ackLatencyMs: -1,
    }),
  ).toEqual({ delay: undefined });
});

test('切屏、计数回退、重置和非单调时间废弃基线，不产生假峰值', () => {
  const sampler = new QualitySampler();
  const counters = { decoded: 10, videoBytes: 100, displayGeneration: 0 };
  sampler.sample(1000, 10, counters);
  expect(
    sampler.sample(2000, 100, { ...counters, displayGeneration: 1 }),
  ).toEqual({ delay: undefined });
  expect(
    sampler.sample(3000, 1, {
      ...counters,
      videoBytes: 1,
      displayGeneration: 1,
    }),
  ).toEqual({ delay: undefined });
  expect(
    sampler.sample(3000, 2, { ...counters, displayGeneration: 1 }),
  ).toEqual({ delay: undefined });
  sampler.reset();
  expect(sampler.sample(600000, 100000, counters)).toEqual({
    delay: undefined,
  });
});

test('无效计数或时间不显示数值，无效延迟留空', () => {
  for (const invalid of [NaN, Infinity, -1]) {
    const sampler = new QualitySampler();
    expect(
      sampler.sample(1000, 1, {
        decoded: 1,
        videoBytes: invalid,
        displayGeneration: 0,
      }),
    ).toEqual({});
    expect(
      sampler.sample(invalid, 1, {
        decoded: 1,
        videoBytes: 1,
        displayGeneration: 0,
      }),
    ).toEqual({});
  }
  const sampler = new QualitySampler();
  expect(
    sampler.sample(1000, 1, {
      decoded: 1,
      videoBytes: 1,
      displayGeneration: 0,
      delay: 0,
    }),
  ).toEqual({ delay: undefined });
});
