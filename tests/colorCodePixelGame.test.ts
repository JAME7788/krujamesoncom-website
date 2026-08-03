import { describe, expect, it } from 'vitest';
import { COLOR_CODE_LEVELS } from '../src/pages/games/colorCodePixelData';
import { gamesCatalog } from '../src/data/gamesCatalog';
import { gameLessons } from '../src/data/gameLessons';
import { getGameTargetUnits } from '../src/services/gameProgressService';

describe('เกมระบายสีตามรหัสพิกเซล', () => {
  it('มี 8 ด่านและทุกด่านเป็นตาราง 10 คูณ 10 ที่ใช้รหัสสีถูกต้อง', () => {
    expect(COLOR_CODE_LEVELS).toHaveLength(8);
    COLOR_CODE_LEVELS.forEach((level) => {
      expect(level.rows).toHaveLength(10);
      expect(level.rows.every((row) => row.length === 10)).toBe(true);
      expect(level.rows.every((row) => /^[0-7]+$/.test(row))).toBe(true);
      expect(level.rows.some((row) => /[1-7]/.test(row))).toBe(true);
    });
  });

  it('เชื่อมแคตตาล็อก บทเรียน และหน่วยคะแนนครบ', () => {
    expect(gamesCatalog.some((game) => game.id === 'color-code-pixel')).toBe(true);
    expect(gameLessons['color-code-pixel']).toBeDefined();
    expect(getGameTargetUnits('color-code-pixel', 'ป.1')).toEqual([{ gradeId: 'p1', unitNo: 2 }]);
    expect(getGameTargetUnits('color-code-pixel', 'ม.2')).toEqual([{ gradeId: 'm2-cs', unitNo: 3 }]);
  });
});
