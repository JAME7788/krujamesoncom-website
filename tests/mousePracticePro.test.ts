import { describe, it, expect } from 'vitest';
import {
  loadP1MouseRecords,
  calculateResearchStatistics,
  generateMouseResearchCsv,
  saveStudentMouseRecord,
  type StudentMouseRecord,
} from '../src/services/mouseResearchService';
import { mouseAudio } from '../src/services/mouseAudioService';

describe('MousePracticePro & PA Research System', () => {
  it('loads Grade 1 roster records with baseline scores', () => {
    const records = loadP1MouseRecords();
    expect(records.length).toBeGreaterThan(0);

    const firstStudent = records[0];
    expect(firstStudent.no).toBe(1);
    expect(firstStudent.name).toBeDefined();
    expect(firstStudent.preTestScore).toBeGreaterThanOrEqual(0);
    expect(firstStudent.postTestScore).toBeGreaterThanOrEqual(0);
  });

  it('calculates comprehensive PA research statistics correctly', () => {
    const mockRecords: StudentMouseRecord[] = [
      {
        no: 1,
        studentCode: '3069',
        name: 'เด็กชาย ก',
        emoji: '👦',
        preTestScore: 40,
        preTestAccuracy: 60,
        postTestScore: 80,
        postTestAccuracy: 90,
        bestModeScores: { single: 100, double: 100, right: 100, drag: 100 },
        lastUpdated: Date.now(),
      },
      {
        no: 2,
        studentCode: '3071',
        name: 'เด็กชาย ข',
        emoji: '👦',
        preTestScore: 50,
        preTestAccuracy: 70,
        postTestScore: 85,
        postTestAccuracy: 95,
        bestModeScores: { single: 100, double: 100, right: 100, drag: 100 },
        lastUpdated: Date.now(),
      },
    ];

    const stats = calculateResearchStatistics(mockRecords);

    expect(stats.count).toBe(2);
    expect(stats.preMean).toBe(45);
    expect(stats.postMean).toBe(82.5);
    expect(stats.meanDiff).toBe(37.5);
    expect(stats.gainPercentage).toBeGreaterThan(0);
    expect(stats.passedCount).toBe(2);
    expect(stats.passedPercentage).toBe(100);
    expect(stats.tValue).toBeGreaterThan(0);
  });

  it('generates research CSV with required Thai school and PA headers', () => {
    const csv = generateMouseResearchCsv();
    expect(csv).toContain('รายงานผลการวิจัยและประเด็นท้าทาย ว.PA (ชั้นประถมศึกษาปีที่ 1)');
    expect(csv).toContain('โรงเรียนบ้านคลองมดแดง');
    expect(csv).toContain('นายอนันตชัย เพ็ชรรี่');
    expect(csv).toContain('สรุปผลการวิเคราะห์ทางสถิติ (สำหรับบทที่ 4)');
    expect(csv).toContain('ร้อยละของความก้าวหน้า (% Gain)');
    expect(csv).toContain('ค่าสถิติทดสอบที (t-test Dependent)');
  });

  it('persists student mouse record updates safely', () => {
    const records = loadP1MouseRecords();
    const target = records[0];

    saveStudentMouseRecord(target.studentCode, {
      postTestScore: 99,
      postTestAccuracy: 100,
    });

    const updatedRecords = loadP1MouseRecords();
    const updatedTarget = updatedRecords.find((r) => r.studentCode === target.studentCode);
    expect(updatedTarget?.postTestScore).toBe(99);
    expect(updatedTarget?.postTestAccuracy).toBe(100);
  });

  it('handles sound effects synthesizer and toggle state safely', () => {
    expect(mouseAudio.isSoundEnabled()).toBe(true);
    mouseAudio.setSoundEnabled(false);
    expect(mouseAudio.isSoundEnabled()).toBe(false);

    // Call sound methods without throwing
    expect(() => mouseAudio.playPop()).not.toThrow();
    expect(() => mouseAudio.playDoubleClick()).not.toThrow();
    expect(() => mouseAudio.playRightClick()).not.toThrow();
    expect(() => mouseAudio.playDragSuccess()).not.toThrow();
    expect(() => mouseAudio.playMiss()).not.toThrow();
    expect(() => mouseAudio.playCombo()).not.toThrow();
    expect(() => mouseAudio.playVictory()).not.toThrow();

    mouseAudio.setSoundEnabled(true);
  });
});
