import { afterEach, expect, jest, test } from '@jest/globals';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { FrameRate, ResolutionOptions } from './display-options';
afterEach(cleanup);
const text = (_: string, fallback: string) => fallback;
test('FPS 5–120草稿同步数字与滑杆，仅结束提交且拒绝非法数值', () => {
  const commit = jest.fn();
  render(<FrameRate value={30} onCommit={commit} text={text} />);
  const slider = screen.getByRole('slider', { name: 'Frame rate limit' });
  const number = screen.getByRole('spinbutton', { name: 'Frame rate value' });
  fireEvent.change(slider, { target: { value: '120' } });
  expect((number as HTMLInputElement).value).toBe('120');
  expect(commit).not.toHaveBeenCalled();
  fireEvent.pointerUp(slider);
  fireEvent.blur(slider);
  expect(commit).toHaveBeenCalledTimes(1);
  expect(commit).toHaveBeenLastCalledWith(120);
  fireEvent.change(number, { target: { value: '5' } });
  fireEvent.keyUp(number, { key: 'Enter' });
  expect(commit).toHaveBeenLastCalledWith(5);
  fireEvent.change(number, { target: { value: '5.5' } });
  fireEvent.blur(number);
  expect((number as HTMLInputElement).value).toBe('5');
  expect(commit).toHaveBeenCalledTimes(2);
});
test('原始分辨率始终为次级信息，只有真实列表可恢复且尺寸偏离才出现短动作', () => {
  const options = {
    display: 0,
    identity: 'A',
    supported: true,
    resolutions: [
      { width: 800, height: 600 },
      { width: 1024, height: 768 },
    ],
    originalResolution: { width: 800, height: 600 },
  };
  const view = render(
    <ResolutionOptions
      options={options}
      current={options.originalResolution}
      disabled={false}
      status=""
      onChange={() => {}}
      text={text}
    />,
  );
  expect(screen.queryByRole('button', { name: 'Restore' })).toBeNull();
  expect(screen.getByText('Original resolution: 800 × 600')).toBeTruthy();
  view.rerender(
    <ResolutionOptions
      options={options}
      current={{ width: 1024, height: 768 }}
      disabled
      status=""
      onChange={() => {}}
      text={text}
    />,
  );
  expect(
    (screen.getByRole('button', { name: 'Restore' }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
});
