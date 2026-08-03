import { describe, expect, it } from 'vitest';
import { buildAbilityScores, scorePercent } from '../src/data/studentAbilityProfile';

describe('การกระจายโปรไฟล์ความสามารถไปยังแบบประเมิน', () => {
  it.each([33, 60, 67, 73, 80, 87, 93, 100])(
    'สร้างคะแนน 5 ด้านให้ใกล้ %s%%',
    (target) => {
      const categories = ['a', 'b', 'c', 'd', 'e'];
      const scores = buildAbilityScores(categories, target, 2);
      expect(Object.keys(scores)).toEqual(categories);
      expect(scorePercent(scores, categories.length)).toBe(target);
    },
  );

  it('ปรับเข้ากับจำนวนด้านของแต่ละแบบโดยคะแนนไม่เกิน 0-3', () => {
    [3, 5, 8, 12].forEach((size) => {
      const categories = Array.from({ length: size }, (_, index) => `c${index}`);
      const scores = buildAbilityScores(categories, 73, size);
      expect(Object.values(scores).every((score) => score >= 0 && score <= 3)).toBe(true);
      expect(Math.abs(scorePercent(scores, size) - 73)).toBeLessThanOrEqual(Math.ceil(100 / (size * 3)));
    });
  });
});
