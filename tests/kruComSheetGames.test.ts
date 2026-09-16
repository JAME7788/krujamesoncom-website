import { describe, it, expect } from 'vitest';
import { kruComSheetItems, KRU_COM_CATEGORIES } from '../src/data/kruComSheetData';
import { gamesCatalog } from '../src/data/gamesCatalog';
import { gameLessons } from '../src/data/gameLessons';
import { getGameTargetUnits, GameProgressId } from '../src/services/gameProgressService';

describe('Kru-Com Google Sheet (409 Files) Games & Resource Integration Tests', () => {
  it('kruComSheetItems parsed 409 files with valid metadata and Google Drive URLs', () => {
    expect(kruComSheetItems.length).toBe(409);
    for (const item of kruComSheetItems) {
      expect(item.id).toMatch(/^krucom-\d{3}$/);
      expect(item.folder.length).toBeGreaterThan(0);
      expect(item.title.length).toBeGreaterThan(0);
      expect(item.url).toMatch(/^https:\/\/drive\.google\.com\//);
      expect(['coding', 'cyber-safety', 'hardware', 'office-tools', 'data-detective', 'ai-tech', 'general']).toContain(item.category);
      expect(['ป.1-3', 'ป.4-6', 'ม.1-3', 'ทุกระดับชั้น']).toContain(item.targetLevel);
    }
  });

  it('all 7 Kru-Com categories have categorized resources', () => {
    for (const cat of KRU_COM_CATEGORIES) {
      const count = kruComSheetItems.filter((i) => i.category === cat.key).length;
      expect(count).toBeGreaterThan(0);
    }
  });

  it('both space-treasure and cyber-cop are registered in gamesCatalog', () => {
    const ids = gamesCatalog.map((g) => g.id);
    expect(ids).toContain('space-treasure');
    expect(ids).toContain('cyber-cop');

    const st = gamesCatalog.find((g) => g.id === 'space-treasure');
    expect(st?.path).toBe('/games/space-treasure');
    expect(st?.color).toMatch(/^#[0-9a-f]{3,6}$/i);

    const cc = gamesCatalog.find((g) => g.id === 'cyber-cop');
    expect(cc?.path).toBe('/games/cyber-cop');
    expect(cc?.color).toMatch(/^#[0-9a-f]{3,6}$/i);
  });

  it('both new games have complete 3 age tiers in gameLessons.ts', () => {
    for (const gameId of ['space-treasure', 'cyber-cop']) {
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

  it('both new games map to valid curriculum targets in gameProgressService', () => {
    for (const gameId of ['space-treasure', 'cyber-cop'] as GameProgressId[]) {
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
