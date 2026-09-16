import { afterEach, expect, it, vi } from 'vitest';
import { createGameRoundGuard } from '../src/utils/gameRoundGuard';
import { readGameRecord, writeGameRecord } from '../src/utils/gameRecords';

afterEach(() => vi.unstubAllGlobals());
it('awards and advances a round once even before a rerender', () => {
  const guard = createGameRoundGuard();
  expect(guard.claim('answer-0')).toBe(true);
  expect(guard.claim('answer-0')).toBe(false);
  expect(guard.claim('next-0')).toBe(true);
  expect(guard.claim('next-0')).toBe(false);
  expect(guard.claim('answer-1')).toBe(true);
});
it('allows a new session to reuse question keys', () => {
  const guard = createGameRoundGuard();
  guard.claim('answer-0'); guard.reset();
  expect(guard.claim('answer-0')).toBe(true);
});
it('does not crash when personal-best storage is unavailable', () => {
  vi.stubGlobal('localStorage', { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } });
  expect(readGameRecord('best', 999)).toBe(999);
  expect(() => writeGameRecord('best', 10)).not.toThrow();
});
it.each(['NaN', '-1', 'Infinity', 'broken'])('ignores invalid stored record %s', (value) => {
  vi.stubGlobal('localStorage', { getItem: () => value });
  expect(readGameRecord('best', 999)).toBe(999);
});
