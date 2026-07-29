import { describe, expect, it } from 'vitest';
import {
  ROBOT_LEVELS,
  ROBOT_PART_TYPES,
  analyzeRobotBuild,
  type PlacedRobotPart,
} from '../src/pages/games/robotMakerData';

const buildFromBlueprint = (levelIndex: number): PlacedRobotPart[] => (
  ROBOT_LEVELS[levelIndex].placements.map((placement, index) => ({
    ...placement,
    id: `part-${levelIndex}-${index}`,
  }))
);

describe('เกมนักประดิษฐ์หุ่นยนต์กระดาษ', () => {
  it('มี 10 ด่านและรหัสไม่ซ้ำกัน', () => {
    expect(ROBOT_LEVELS).toHaveLength(10);
    expect(new Set(ROBOT_LEVELS.map((level) => level.id)).size).toBe(10);
  });

  it('พิมพ์เขียวทุกด่านใช้ชิ้นส่วนที่ระบบรู้จักและอยู่ในพื้นที่ทำงาน', () => {
    ROBOT_LEVELS.forEach((level) => {
      expect(level.placements.length).toBeGreaterThanOrEqual(7);
      level.placements.forEach((placement) => {
        expect(ROBOT_PART_TYPES).toContain(placement.type);
        expect(placement.x).toBeGreaterThanOrEqual(4);
        expect(placement.x).toBeLessThanOrEqual(96);
        expect(placement.y).toBeGreaterThanOrEqual(4);
        expect(placement.y).toBeLessThanOrEqual(96);
      });
    });
  });

  it('คำตอบตามพิมพ์เขียวชนะได้จริงครบทุกด่าน', () => {
    ROBOT_LEVELS.forEach((level, index) => {
      const result = analyzeRobotBuild(buildFromBlueprint(index), level);
      expect(result.passed, `ด่าน ${level.id} ต้องผ่านได้`).toBe(true);
      expect(result.score).toBe(100);
      expect(result.stars).toBe(3);
      expect(result.aligned).toBe(level.placements.length);
    });
  });

  it('ชิ้นส่วนขาดหรือเกินต้องยังไม่ผ่าน', () => {
    const level = ROBOT_LEVELS[0];
    const exact = buildFromBlueprint(0);
    const missing = analyzeRobotBuild(exact.slice(1), level);
    const extra = analyzeRobotBuild([...exact, { ...exact[0], id: 'extra-part' }], level);

    expect(missing.passed).toBe(false);
    expect(missing.missing.length).toBeGreaterThan(0);
    expect(extra.passed).toBe(false);
    expect(extra.extra.length).toBeGreaterThan(0);
  });

  it('วางครบแต่ห่างพิมพ์เขียวยังผ่านระดับเริ่มต้นและได้ดาวตามคุณภาพ', () => {
    const level = ROBOT_LEVELS[0];
    const scattered = buildFromBlueprint(0).map((part, index) => ({
      ...part,
      x: 6 + index * 4,
      y: 92,
    }));
    const result = analyzeRobotBuild(scattered, level);

    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.score).toBeLessThan(100);
    expect(result.stars).toBeGreaterThanOrEqual(1);
  });
});
