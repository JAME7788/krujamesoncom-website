import { describe, expect, it } from 'vitest';
import { canTurnSnake, chooseSnakeFood, stepSnake } from '../src/utils/snakeEngine';

describe('snake engine', () => {
  it('returns no food when the board is full instead of looping forever', () => {
    expect(chooseSnakeFood([{ x: 0, y: 0 }], 1)).toBeNull();
  });
  it('finds the only empty cell even on a nearly full board', () => {
    expect(chooseSnakeFood([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }], 2)).toEqual({ x: 1, y: 1 });
  });
  it('allows moving into a tail cell that moves away', () => {
    const body = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }];
    const next = stepSnake(body, 'D', { x: 2, y: 2 }, 3);
    expect(next.collided).toBe(false);
    expect(next.body).toHaveLength(4);
    expect(body[0]).toEqual({ x: 0, y: 0 });
  });
  it('rejects walls and occupied body cells', () => {
    const body = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }];
    expect(stepSnake(body, 'U', null, 3).collided).toBe(true);
    expect(stepSnake(body, 'R', null, 3).collided).toBe(true);
  });
  it('grows only when eating without collision', () => {
    const next = stepSnake([{ x: 1, y: 1 }], 'R', { x: 2, y: 1 }, 3);
    expect(next.ate).toBe(true);
    expect(next.body).toHaveLength(2);
  });
  it('rejects a reverse turn and redundant direction', () => {
    expect(canTurnSnake('R', 'L')).toBe(false);
    expect(canTurnSnake('R', 'R')).toBe(false);
    expect(canTurnSnake('R', 'U')).toBe(true);
  });
});
