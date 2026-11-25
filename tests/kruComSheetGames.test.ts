import { describe, it, expect } from 'vitest';
import { gamesCatalog } from '../src/data/gamesCatalog';
import { gameLessons } from '../src/data/gameLessons';
import { getGameTargetUnits, GameProgressId } from '../src/services/gameProgressService';

describe('Space Treasure, Cyber Cop & Flowchart Bingo Games Integration Tests', () => {
  it('space-treasure, cyber-cop, and flowchart-bingo are registered in gamesCatalog', () => {
    const ids = gamesCatalog.map((g) => g.id);
    expect(ids).toContain('space-treasure');
    expect(ids).toContain('cyber-cop');
    expect(ids).toContain('flowchart-bingo');
    expect(ids).not.toContain('krucom-arcade');

    const st = gamesCatalog.find((g) => g.id === 'space-treasure');
    expect(st?.path).toBe('/games/space-treasure');
    expect(st?.color).toMatch(/^#[0-9a-f]{3,6}$/i);

    const cc = gamesCatalog.find((g) => g.id === 'cyber-cop');
    expect(cc?.path).toBe('/games/cyber-cop');
    expect(cc?.color).toMatch(/^#[0-9a-f]{3,6}$/i);

    const fb = gamesCatalog.find((g) => g.id === 'flowchart-bingo');
    expect(fb?.path).toBe('/games/flowchart-bingo');
  });

  it('all 3 games have complete 3 age tiers in gameLessons.ts', () => {
    expect(gameLessons['krucom-arcade']).toBeUndefined();
    for (const gameId of ['space-treasure', 'cyber-cop', 'flowchart-bingo']) {
      const lesson = gameLessons[gameId];
      expect(lesson).toBeDefined();
      expect(lesson.lower).toBeDefined();
      expect(lesson.upper).toBeDefined();
      expect(lesson.middle).toBeDefined();

      for (const tier of [lesson.lower, lesson.upper, lesson.middle]) {
        expect(tier.concept.trim().length).toBeGreaterThan(5);
        expect(tier.example.trim().length).toBeGreaterThan(5);
        expect(tier.points.length).toBeGreaterThanOrEqual(2);
        expect(tier.howTo.length).toBeGreaterThanOrEqual(2);
      }

      // Check concept length hierarchy
      expect(lesson.lower.concept.length).toBeLessThanOrEqual(lesson.middle.concept.length);
    }
  });

  it('all 3 games map to valid curriculum targets in gameProgressService', () => {
    for (const gameId of ['space-treasure', 'cyber-cop', 'flowchart-bingo'] as GameProgressId[]) {
      const primaryTargets = getGameTargetUnits(gameId, 'ป.4');
      const middleTargets = getGameTargetUnits(gameId, 'ม.1');
      const allTargets = [...primaryTargets, ...middleTargets];

      expect(allTargets.length).toBeGreaterThanOrEqual(1);
      for (const t of allTargets) {
        expect(t.gradeId.trim().length).toBeGreaterThan(0);
        expect(t.unitNo).toBeGreaterThanOrEqual(1);
      }
    }
  });
});
