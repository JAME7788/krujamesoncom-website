import { describe, it, expect, beforeEach } from 'vitest';
import { gamesCatalog } from '../src/data/gamesCatalog';
import { gameMissions } from '../src/data/gameMissions';
import { gameChallenges } from '../src/data/gameChallenges';
import { gameLessons } from '../src/data/gameLessons';
import {
  getAllUnifiedGames,
  getUnifiedGameRecord,
  getUnifiedLessonForClassroom,
  getUnifiedRegistryIntegrityReport,
  saveGameCustomOverride,
  resetGameCustomOverride,
} from '../src/data/unifiedGameRegistry';
import {
  getUnifiedStudentLearningSnapshot,
  recordUnifiedPlayHistory,
  loadStudentPlayHistory,
} from '../src/services/unifiedDatabaseService';

describe('Unified Game Registry & Single Database Architecture', () => {
  beforeEach(() => {
    try {
      localStorage.clear();
    } catch {
      // ignore if not stubbed
    }
  });

  it('links all 38 games across catalog, lessons, missions, challenges, CT pillars, and Bloom taxonomy without deleting any data', () => {
    const allUnified = getAllUnifiedGames('ป.4');
    expect(allUnified.length).toBe(gamesCatalog.length);
    expect(allUnified.length).toBeGreaterThanOrEqual(38);

    const report = getUnifiedRegistryIntegrityReport('ป.4');
    expect(report.totalGames).toBe(gamesCatalog.length);
    expect(report.withMission).toBe(gamesCatalog.length);
    expect(report.withChallenge).toBe(gamesCatalog.length);
    expect(report.withLesson).toBe(gamesCatalog.length);

    for (const item of allUnified) {
      expect(item.catalog.title.length).toBeGreaterThan(2);
      expect(item.lesson).not.toBeNull();
      expect(item.mission).not.toBeNull();
      expect(item.advancedChallenge.length).toBeGreaterThan(10);
      expect(item.ctPillar.id).toBeDefined();
      expect(item.bloom.level).toBeDefined();
    }
  });

  it('supports non-destructive teacher customization overrides and restores defaults cleanly', () => {
    const originalObjective = gameMissions['cyber-racer'].objective;
    const originalTitle = gamesCatalog.find((g) => g.id === 'cyber-racer')!.title;

    saveGameCustomOverride('cyber-racer', {
      customTitle: '🏎️ ซิ่งสายฟ้าท้าสมอง (ปรับแต่งโดยครู)',
      customObjective: 'ฝึกคิดวิเคราะห์และเลือกเลนให้แม่นยำ 5 ข้อติดกัน',
      speedMultiplier: 0.75,
      timerBonusSeconds: 15,
    });

    const customized = getUnifiedGameRecord('cyber-racer', 'ป.4');
    expect(customized).not.toBeNull();
    expect(customized!.effectiveTitle).toBe('🏎️ ซิ่งสายฟ้าท้าสมอง (ปรับแต่งโดยครู)');
    expect(customized!.effectiveMission?.objective).toBe('ฝึกคิดวิเคราะห์และเลือกเลนให้แม่นยำ 5 ข้อติดกัน');
    expect(customized!.effectiveSpeedMultiplier).toBe(0.75);
    expect(customized!.effectiveTimerBonusSeconds).toBe(15);

    // Ensure original catalog & mission data are untouched (zero data deleted)
    expect(gameMissions['cyber-racer'].objective).toBe(originalObjective);
    expect(gamesCatalog.find((g) => g.id === 'cyber-racer')!.title).toBe(originalTitle);
    expect( Object.keys(gameLessons).length ).toBeGreaterThanOrEqual(38);
    expect( Object.keys(gameChallenges).length ).toBeGreaterThanOrEqual(38);

    // Reset override and verify defaults return
    resetGameCustomOverride('cyber-racer');
    const restored = getUnifiedGameRecord('cyber-racer', 'ป.4');
    expect(restored!.effectiveTitle).toBe(originalTitle);
    expect(restored!.effectiveMission?.objective).toBe(originalObjective);
    expect(restored!.effectiveSpeedMultiplier).toBe(1);
  });

  it('retrieves age-tiered lesson content for lower, upper, and middle classrooms', () => {
    const lower = getUnifiedLessonForClassroom('claw-platformer', 'ป.2');
    const upper = getUnifiedLessonForClassroom('claw-platformer', 'ป.5');
    const middle = getUnifiedLessonForClassroom('claw-platformer', 'ม.2');

    expect(lower?.band).toBe('lower');
    expect(upper?.band).toBe('upper');
    expect(middle?.band).toBe('middle');
    expect(lower?.content.concept).not.toBe(middle?.content.concept);
  });

  it('records play history and builds a unified student learning snapshot', () => {
    const studentId = 'ป.4_101_TEST';
    recordUnifiedPlayHistory(studentId, 'cyber-racer', 'Cyber Racer', 450, 500, 'round-1');
    recordUnifiedPlayHistory(studentId, 'cyber-racer', 'Cyber Racer', 620, 700, 'round-2');
    recordUnifiedPlayHistory(studentId, 'claw-platformer', 'Claw Platformer', 880, 1000, 'stage-2');

    const history = loadStudentPlayHistory(studentId);
    expect(history['cyber-racer'].playCount).toBe(2);
    expect(history['cyber-racer'].bestScore).toBe(620);
    expect(history['claw-platformer'].bestScore).toBe(880);

    const snapshot = getUnifiedStudentLearningSnapshot(studentId, 'ป.4');
    expect(snapshot.studentId).toBe(studentId);
    expect(snapshot.games.length).toBe(gamesCatalog.length);

    const racerSnap = snapshot.games.find((g) => g.record.id === 'cyber-racer');
    expect(racerSnap?.played).toBe(true);
    expect(racerSnap?.bestScore).toBe(620);
    expect(racerSnap?.playCount).toBe(2);
  });
});
