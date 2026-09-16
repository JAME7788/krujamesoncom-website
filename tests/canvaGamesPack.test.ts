import { describe, it, expect } from 'vitest';
import { gamesCatalog } from '../src/data/gamesCatalog';
import { gameLessons } from '../src/data/gameLessons';
import { getGameTargetUnits, GameProgressId } from '../src/services/gameProgressService';

describe('Canva & Kru-IT Games Pack Integration Tests (PC Builder & Stroop Color)', () => {
  const canvaGameIds: GameProgressId[] = [
    'pc-builder',
    'stroop-color',
  ];

  it('both new games are registered in gamesCatalog', () => {
    const catalogIds = gamesCatalog.map((g) => g.id);
    for (const id of canvaGameIds) {
      expect(catalogIds).toContain(id);
    }
  });

  it('both new games have properly defined metadata and valid route paths', () => {
    for (const id of canvaGameIds) {
      const item = gamesCatalog.find((g) => g.id === id);
      expect(item).toBeDefined();
      expect(item?.path).toBe(`/games/${id}`);
      expect(item?.title.length).toBeGreaterThan(3);
      expect(item?.desc.length).toBeGreaterThan(10);
      expect(item?.color).toMatch(/^#[0-9a-f]{3,6}$/i);
    }
  });

  it('both new games have 3 age tiers in gameLessons.ts (lower, upper, middle)', () => {
    for (const id of canvaGameIds) {
      const lesson = gameLessons[id];
      expect(lesson).toBeDefined();
      expect(lesson.lower).toBeDefined();
      expect(lesson.upper).toBeDefined();
      expect(lesson.middle).toBeDefined();

      // Check points and howTo counts
      for (const tier of [lesson.lower, lesson.upper, lesson.middle]) {
        expect(tier.concept.trim().length).toBeGreaterThan(5);
        expect(tier.example.trim().length).toBeGreaterThan(5);
        expect(tier.points.length).toBeGreaterThanOrEqual(2);
        expect(tier.howTo.length).toBeGreaterThanOrEqual(2);
      }

      // Check lower tier concept is concise
      expect(lesson.lower.concept.length).toBeLessThanOrEqual(lesson.middle.concept.length);
    }
  });

  it('both new games map to valid curriculum units in gameProgressService', () => {
    for (const id of canvaGameIds) {
      const targetsPrimary = getGameTargetUnits(id, 'ป.4');
      const targetsMiddle = getGameTargetUnits(id, 'ม.1');
      const combined = [...targetsPrimary, ...targetsMiddle];
      expect(combined.length).toBeGreaterThanOrEqual(1);
      for (const target of combined) {
        expect(target.gradeId.trim().length).toBeGreaterThan(0);
        expect(target.unitNo).toBeGreaterThanOrEqual(1);
      }
    }
  });
});
