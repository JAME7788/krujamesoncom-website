import { describe, expect, it } from 'vitest';
import { PILLAR_ORDER, QUESTION_BANK } from '../src/data/ctBoardGame';
import type { CTQuestion } from '../src/data/ctBoardGame';
import type { AgeTier } from '../src/data/gameLessons';
import {
  pickQuestionWithoutRecent,
  questionKey,
  QUESTIONS_PER_PILLAR,
} from '../src/data/ctQuestionBank';

const TIERS: AgeTier[] = ['lower', 'upper', 'middle'];

describe('computational-thinking question bank', () => {
  it('contains 100 unique questions per pillar for every age tier', () => {
    TIERS.forEach((tier) => {
      const bank = QUESTION_BANK[tier];
      expect(bank).toHaveLength(QUESTIONS_PER_PILLAR * PILLAR_ORDER.length);
      expect(new Set(bank.map(questionKey)).size).toBe(bank.length);

      PILLAR_ORDER.forEach((pillar) => {
        const questions = bank.filter((question) => question.pillar === pillar);
        expect(questions).toHaveLength(QUESTIONS_PER_PILLAR);
      });
    });
  });

  it('keeps every question answerable and gives an explanation', () => {
    TIERS.forEach((tier) => {
      QUESTION_BANK[tier].forEach((question) => {
        expect(question.q.trim().length).toBeGreaterThan(12);
        expect(question.choices).toHaveLength(3);
        expect(new Set(question.choices).size).toBe(3);
        expect(question.answer).toBeGreaterThanOrEqual(0);
        expect(question.answer).toBeLessThan(question.choices.length);
        expect(question.choices[question.answer].trim().length).toBeGreaterThan(0);
        expect(question.why.trim().length).toBeGreaterThan(10);
      });
    });
  });

  it('spreads correct choices across all three positions', () => {
    TIERS.forEach((tier) => {
      PILLAR_ORDER.forEach((pillar) => {
        const distribution = [0, 0, 0];
        QUESTION_BANK[tier]
          .filter((question) => question.pillar === pillar)
          .forEach((question) => {
            distribution[question.answer] += 1;
          });
        distribution.forEach((count) => expect(count).toBeGreaterThan(15));
      });
    });
  });

  it('does not repeat a recently used question', () => {
    const pool: CTQuestion[] = QUESTION_BANK.lower;
    let recentKeys: string[] = [];
    const drawn: string[] = [];

    for (let index = 0; index < 60; index += 1) {
      const result = pickQuestionWithoutRecent(pool, recentKeys, undefined, () => 0);
      recentKeys = result.recentKeys;
      drawn.push(questionKey(result.question));
    }

    expect(new Set(drawn).size).toBe(drawn.length);
    expect(recentKeys).toHaveLength(60);
  });
});
