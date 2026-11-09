import { describe, expect, it } from 'vitest';
import { moveCorrectTo, spreadAnswers } from '../src/utils/answerOrder';

describe('moveCorrectTo', () => {
  it('moves the correct option to the target slot and keeps every option', () => {
    const r = moveCorrectTo(['ถูก', 'ผิด1', 'ผิด2'], 0, 2);
    expect(r.answer).toBe(2);
    expect(r.options[r.answer]).toBe('ถูก');
    expect([...r.options].sort()).toEqual(['ถูก', 'ผิด1', 'ผิด2'].sort());
  });

  it('wraps target positions beyond the option count', () => {
    const r = moveCorrectTo(['a', 'b', 'c'], 1, 4);
    expect(r.answer).toBe(1);
    expect(r.options[r.answer]).toBe('b');
  });
});

describe('spreadAnswers', () => {
  it('spreads correct answers across positions instead of always the first', () => {
    const qs = Array.from({ length: 6 }, (_, i) => ({ q: `ข้อ ${i}`, options: ['ถูก', 'ผิด', 'ผิดอีก'], answer: 0 }));
    const out = spreadAnswers(qs, 0);
    expect(new Set(out.map((x) => x.answer)).size).toBe(3);
    out.forEach((x) => expect(x.options[x.answer]).toBe('ถูก'));
  });
});
