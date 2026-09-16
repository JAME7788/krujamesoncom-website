import { describe, expect, it } from 'vitest';
import { getFinishedPlayerResult } from '../src/utils/gameResultOwnership';

const players = [{ score: 30 }, { score: 100 }, { score: 0 }];
describe('online game result ownership', () => {
  it('returns each seat result, not the winner for all participants', () => {
    const game = { phase: 'over', finishReason: 'Time expired', players };
    expect(getFinishedPlayerResult(game, 0)?.score).toBe(30);
    expect(getFinishedPlayerResult(game, 1)?.score).toBe(100);
    expect(getFinishedPlayerResult(game, 2)?.score).toBe(0);
  });
  it.each([-1, 3, 0.5, NaN])('does not assign a result to missing seat %s', (seat) => {
    expect(getFinishedPlayerResult({ phase: 'over', finishReason: '', players }, seat)).toBeUndefined();
  });
  it('does not save unfinished or cancelled games', () => {
    expect(getFinishedPlayerResult({ phase: 'roll', finishReason: '', players }, 0)).toBeUndefined();
    expect(getFinishedPlayerResult({ phase: 'over', finishReason: 'เจ้าของห้องยกเลิกการแข่งขัน', players }, 0)).toBeUndefined();
    expect(getFinishedPlayerResult(undefined, 0)).toBeUndefined();
  });
});
