import { describe, it, expect } from 'vitest';
import { gamesCatalog } from '../src/data/gamesCatalog';
import { gameMissions } from '../src/data/gameMissions';
import { gameChallenges } from '../src/data/gameChallenges';

describe('Game-based learning curriculum coverage', () => {
  it('covers every published game without stale missions', () => {
    expect(Object.keys(gameMissions).sort()).toEqual(gamesCatalog.map(game => game.id).sort());
    expect(Object.keys(gameChallenges).sort()).toEqual(gamesCatalog.map(game => game.id).sort());
  });
  it.each(gamesCatalog)('$id has an actionable mission and explanatory feedback', game => {
    const mission = gameMissions[game.id];
    for (const value of [mission.objective, mission.challenge, mission.hint, mission.question, mission.explanation]) expect(value.length).toBeGreaterThan(8);
    expect(new Set(mission.options).size).toBe(2);
    expect(gameChallenges[game.id].length).toBeGreaterThan(20);
  });

  it('persists and loads game reflections without overwriting or deleting any data', async () => {
    const { saveGameReflection, loadStudentReflections, getReflectionStats } = await import('../src/services/gameReflectionService');
    const saved = await saveGameReflection({
      studentId: 'test_student_01',
      studentCode: '3069',
      studentName: 'น้องทดสอบ',
      classroom: 'ป.1',
      gameId: 'binary',
      gameTitle: 'เลขฐานสอง',
      objective: 'แปลงค่าฐานสอง',
      challengeMode: true,
      challengeText: 'สร้างเลขเป้าหมายแล้วบอกผลรวม',
      questionAnswered: true,
      reflectionText: 'เปิดหลัก 4 และ 1 ได้ 5 รอบหน้าจะรวมค่าก่อนกด',
    });

    expect(saved.id).toBeDefined();
    expect(saved.createdAt).toBeGreaterThan(0);

    const studentReflections = loadStudentReflections('test_student_01');
    expect(studentReflections.length).toBeGreaterThanOrEqual(1);
    expect(studentReflections[0].reflectionText).toContain('รอบหน้าจะรวมค่าก่อนกด');

    const stats = getReflectionStats('ป.1');
    expect(stats.totalCount).toBeGreaterThanOrEqual(1);
    expect(stats.challengeCount).toBeGreaterThanOrEqual(1);
  });
});
