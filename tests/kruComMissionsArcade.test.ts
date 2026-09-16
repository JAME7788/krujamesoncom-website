import { describe, it, expect } from 'vitest';
import { kruComMissions } from '../src/data/kruComMissions';
import { kruComSheetItems } from '../src/data/kruComSheetData';
import { gamesCatalog } from '../src/data/gamesCatalog';
import { gameLessons } from '../src/data/gameLessons';
import { getGameTargetUnits } from '../src/services/gameProgressService';

describe('Kru-Com 100+ Missions Arcade System', () => {
  it('has at least 100 missions generated from Google Sheet teaching media', () => {
    expect(kruComMissions.length).toBeGreaterThanOrEqual(100);
    expect(kruComMissions.length).toBe(104);
  });

  it('has unique mission IDs for all 104 missions', () => {
    const ids = kruComMissions.map((m) => m.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('verifies all 4 game modes are properly distributed', () => {
    const types = new Set(kruComMissions.map((m) => m.type));
    expect(types.has('sorting')).toBe(true);
    expect(types.has('matching')).toBe(true);
    expect(types.has('sequence')).toBe(true);
    expect(types.has('quiz')).toBe(true);

    const sortingCount = kruComMissions.filter((m) => m.type === 'sorting').length;
    const matchingCount = kruComMissions.filter((m) => m.type === 'matching').length;
    const sequenceCount = kruComMissions.filter((m) => m.type === 'sequence').length;
    const quizCount = kruComMissions.filter((m) => m.type === 'quiz').length;

    expect(sortingCount).toBeGreaterThanOrEqual(10);
    expect(matchingCount).toBeGreaterThanOrEqual(10);
    expect(sequenceCount).toBeGreaterThanOrEqual(10);
    expect(quizCount).toBeGreaterThanOrEqual(10);
  });

  it('validates each mission has complete and correct data payload for its mode', () => {
    kruComMissions.forEach((m) => {
      expect(m.id).toBeTruthy();
      expect(m.title).toBeTruthy();
      expect(m.desc).toBeTruthy();
      expect(m.sheetFolder).toBeTruthy();
      expect(m.pdfUrl).toMatch(/^https:\/\/drive\.google\.com/);
      expect(m.rewardXP).toBeGreaterThan(0);

      if (m.type === 'sorting') {
        expect(m.bins).toBeDefined();
        expect(m.bins!.length).toBeGreaterThanOrEqual(2);
        expect(m.sortingItems).toBeDefined();
        expect(m.sortingItems!.length).toBeGreaterThanOrEqual(2);
        m.sortingItems!.forEach((item) => {
          expect(item.text).toBeTruthy();
          expect(m.bins).toContain(item.category);
        });
      } else if (m.type === 'matching') {
        expect(m.matchingPairs).toBeDefined();
        expect(m.matchingPairs!.length).toBeGreaterThanOrEqual(2);
        m.matchingPairs!.forEach((pair) => {
          expect(pair.left).toBeTruthy();
          expect(pair.right).toBeTruthy();
        });
      } else if (m.type === 'sequence') {
        expect(m.sequenceSteps).toBeDefined();
        expect(m.sequenceSteps!.length).toBeGreaterThanOrEqual(2);
        m.sequenceSteps!.forEach((s) => {
          expect(s.stepText).toBeTruthy();
          expect(s.order).toBeGreaterThanOrEqual(1);
        });
      } else if (m.type === 'quiz') {
        expect(m.quizQuestions).toBeDefined();
        expect(m.quizQuestions!.length).toBeGreaterThanOrEqual(1);
        m.quizQuestions!.forEach((q) => {
          expect(q.question).toBeTruthy();
          expect(q.choices.length).toBeGreaterThanOrEqual(2);
          expect(q.correctIdx).toBeGreaterThanOrEqual(0);
          expect(q.correctIdx).toBeLessThan(q.choices.length);
          expect(q.explanation).toBeTruthy();
        });
      }
    });
  });

  it('verifies integration with gamesCatalog and gameLessons', () => {
    const arcadeEntry = gamesCatalog.find((g) => g.id === 'krucom-arcade');
    expect(arcadeEntry).toBeDefined();
    expect(arcadeEntry?.path).toBe('/games/krucom-arcade');

    const spaceEntry = gamesCatalog.find((g) => g.id === 'space-treasure');
    expect(spaceEntry).toBeDefined();

    const cyberEntry = gamesCatalog.find((g) => g.id === 'cyber-cop');
    expect(cyberEntry).toBeDefined();

    const bingoEntry = gamesCatalog.find((g) => g.id === 'flowchart-bingo');
    expect(bingoEntry).toBeDefined();
    expect(bingoEntry?.path).toBe('/games/flowchart-bingo');

    expect(gameLessons['krucom-arcade']).toBeDefined();
    expect(gameLessons['space-treasure']).toBeDefined();
    expect(gameLessons['cyber-cop']).toBeDefined();
    expect(gameLessons['flowchart-bingo']).toBeDefined();

    const arcadeUnits = getGameTargetUnits('krucom-arcade', 'ป.4/1');
    expect(arcadeUnits.length).toBeGreaterThan(0);

    const bingoUnits = getGameTargetUnits('flowchart-bingo', 'ป.4/1');
    expect(bingoUnits.length).toBeGreaterThan(0);
  });

  it('validates 409 items in kruComSheetItems with valid URLs and categories', () => {
    expect(kruComSheetItems.length).toBe(409);
    kruComSheetItems.forEach((item) => {
      expect(item.id).toBeTruthy();
      expect(item.title).toBeTruthy();
      expect(item.url).toMatch(/^https:\/\/drive\.google\.com/);
      expect(item.category).toBeTruthy();
    });
  });
});
