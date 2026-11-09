import { afterEach, describe, expect, it, vi } from 'vitest';
import { createGameTimers, frameDeltaSeconds } from '../src/utils/gameTimers';

afterEach(() => vi.useRealTimers());

describe('game round timers', () => {
  it('runs a delayed action once', () => {
    vi.useFakeTimers();
    const timers = createGameTimers();
    const action = vi.fn();
    timers.schedule(action, 420);
    vi.advanceTimersByTime(419);
    expect(action).not.toHaveBeenCalled();
    vi.advanceTimersByTime(500);
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('cancels old feedback and completion when restarting or unmounting', () => {
    vi.useFakeTimers();
    const timers = createGameTimers();
    const stale = vi.fn();
    const nextRound = vi.fn();
    timers.schedule(stale, 400);
    timers.schedule(stale, 900);
    timers.clear();
    timers.schedule(nextRound, 500);
    vi.runAllTimers();
    expect(stale).not.toHaveBeenCalled();
    expect(nextRound).toHaveBeenCalledTimes(1);
  });

  it('also cancels a follow-up scheduled by an animation step', () => {
    vi.useFakeTimers();
    const timers = createGameTimers();
    const completion = vi.fn();
    timers.schedule(() => timers.schedule(completion, 500), 100);
    vi.advanceTimersByTime(100);
    timers.clear();
    vi.runAllTimers();
    expect(completion).not.toHaveBeenCalled();
  });
});

describe('frameDeltaSeconds', () => {
  it('never goes negative when the first animation frame timestamp is earlier than performance.now()', () => {
    // requestAnimationFrame passes the frame start time, which can predate the setup timestamp
    expect(frameDeltaSeconds(1000, 1004)).toBe(0);
  });

  it('converts milliseconds to seconds and caps long pauses', () => {
    expect(frameDeltaSeconds(1016, 1000)).toBeCloseTo(0.016, 6);
    expect(frameDeltaSeconds(5000, 1000)).toBe(0.05);
    expect(frameDeltaSeconds(5000, 1000, 0.1)).toBe(0.1);
  });

  it('treats invalid timestamps as no time passing', () => {
    expect(frameDeltaSeconds(Number.NaN, 1000)).toBe(0);
  });
});
