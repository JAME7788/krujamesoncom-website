import { describe, expect, it } from 'vitest';
import { createMemoryRound, emptyMemoryRound, memoryReducer } from '../src/utils/memoryEngine';

describe('memory game rounds', () => {
  it.each([4, 6, 8])('creates exactly %s pairs', (pairs) => {
    const round = createMemoryRound(Array.from({ length: pairs }, (_, i) => String(i)), 1);
    expect(round.cards).toHaveLength(pairs * 2);
    for (let i = 0; i < pairs; i += 1) expect(round.cards.filter((card) => card.symbol === String(i))).toHaveLength(2);
  });
  it('ignores double clicks and a third card until the pair resolves', () => {
    let state = createMemoryRound(['A', 'B'], 1, () => 0.99);
    state = memoryReducer(state, { type: 'flip', index: 0 });
    expect(memoryReducer(state, { type: 'flip', index: 0 })).toBe(state);
    state = memoryReducer(state, { type: 'flip', index: 1 });
    expect(state.moves).toBe(1);
    expect(memoryReducer(state, { type: 'flip', index: 2 })).toBe(state);
    state = memoryReducer(state, { type: 'resolve', roundId: 1 });
    expect(state.matches).toBe(1);
    expect(memoryReducer(state, { type: 'resolve', roundId: 1 })).toBe(state);
  });
  it('hides an unmatched pair without losing moves or corrupting other cards', () => {
    let state = createMemoryRound(['A', 'B'], 1, () => 0.99);
    state = memoryReducer(state, { type: 'flip', index: 0 });
    state = memoryReducer(state, { type: 'flip', index: 2 });
    state = memoryReducer(state, { type: 'resolve', roundId: 1 });
    expect(state.matches).toBe(0);
    expect(state.moves).toBe(1);
    expect(state.cards.every((card) => !card.flipped)).toBe(true);
  });
  it('ignores delayed feedback from a prior round and after changing theme', () => {
    let state = createMemoryRound(['A'], 2);
    state = memoryReducer(state, { type: 'flip', index: 0 });
    state = memoryReducer(state, { type: 'flip', index: 1 });
    expect(memoryReducer(state, { type: 'resolve', roundId: 1 })).toBe(state);
    state = memoryReducer(state, { type: 'reset' });
    expect(memoryReducer(state, { type: 'resolve', roundId: 2 })).toEqual(emptyMemoryRound());
  });
  it('pauses input and feedback, then resolves after resuming', () => {
    let state = createMemoryRound(['A'], 1);
    state = memoryReducer(state, { type: 'flip', index: 0 });
    state = memoryReducer(state, { type: 'flip', index: 1 });
    state = memoryReducer(state, { type: 'pause' });
    expect(memoryReducer(state, { type: 'resolve', roundId: 1 })).toBe(state);
    expect(memoryReducer(state, { type: 'flip', index: 0 })).toBe(state);
    state = memoryReducer(state, { type: 'pause' });
    state = memoryReducer(state, { type: 'resolve', roundId: 1 });
    expect(state.phase).toBe('complete');
    expect(state.matches).toBe(1);
    expect(memoryReducer(state, { type: 'flip', index: 0 })).toBe(state);
  });
  it('restart clears prior score, selection and pause state', () => {
    const state = memoryReducer({ ...createMemoryRound(['A'], 1), moves: 10, paused: true }, { type: 'start', round: createMemoryRound(['B'], 2) });
    expect(state).toMatchObject({ id: 2, moves: 0, matches: 0, paused: false, selected: [] });
    expect(state.cards.every((card) => card.symbol === 'B')).toBe(true);
  });
});
