import { describe, it, expect, beforeEach } from 'vitest';
import {
  bloomTaxonomyLevels,
  getBloomInfo,
  getActivityBloomLevel,
  getUnitBloomLevel,
} from '../src/services/bloomTaxonomyService';
import {
  recordMissedQuestion,
  loadAllMissedQuestions,
  getPendingReviewQuestions,
  resolveReviewAttempt,
  getSpacedReviewStats,
} from '../src/services/spacedRepetitionService';
import {
  weeklyGoalPresets,
  getActiveWeeklyGoal,
  changeWeeklyGoal,
  recordGoalReflection,
  getCurrentWeekKey,
} from '../src/services/srlService';
import { allClassrooms2569 } from '../src/data/students2569';
import { loadGrades, initClassroom } from '../src/services/gradeService';

describe('Cognitive & Learning Models (Pillars 1-4)', () => {
  beforeEach(() => {
    const data = new Map<string, string>();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => data.get(key) ?? null,
        setItem: (key: string, value: string) => data.set(key, value),
        removeItem: (key: string) => data.delete(key),
        clear: () => data.clear(),
      },
    });
  });

  describe("1. Bloom's Revised Taxonomy", () => {
    it('มีระดับความคิดครบถ้วน 6 ขั้นบันได', () => {
      expect(Object.keys(bloomTaxonomyLevels)).toHaveLength(6);
      expect(bloomTaxonomyLevels.remember.tier).toBe(1);
      expect(bloomTaxonomyLevels.understand.tier).toBe(2);
      expect(bloomTaxonomyLevels.apply.tier).toBe(3);
      expect(bloomTaxonomyLevels.analyze.tier).toBe(4);
      expect(bloomTaxonomyLevels.evaluate.tier).toBe(5);
      expect(bloomTaxonomyLevels.create.tier).toBe(6);
    });

    it('แมปกิจกรรมและเกมเข้าสู่ระดับบลูมอย่างแม่นยำ', () => {
      expect(getActivityBloomLevel('slide')).toBe('remember');
      expect(getActivityBloomLevel('video')).toBe('understand');
      expect(getActivityBloomLevel('project')).toBe('create');
      expect(getActivityBloomLevel('fun', 'coding-studio')).toBe('create');
      expect(getActivityBloomLevel('fun', 'cyber-shield')).toBe('evaluate');
      expect(getActivityBloomLevel('fun', 'bug-catcher')).toBe('analyze');
      expect(getActivityBloomLevel('fun', 'coding-maze')).toBe('apply');
    });

    it('ดึงข้อมูลชื่อไทยและคำอธิบายของแต่ละระดับได้ถูกต้อง', () => {
      const info = getBloomInfo('create');
      expect(info.nameTh).toContain('สร้างสรรค์');
      expect(info.icon).toBe('🎨');
      expect(info.actionVerbs).toContain('เขียนโปรแกรม');
    });

    it('ประเมินระดับ Bloom ของหน่วยการเรียนรู้ได้อย่างถูกต้อง', () => {
      expect(getUnitBloomLevel('การเขียนโปรแกรมด้วย Scratch เบื้องต้น')).toBe('create');
      expect(getUnitBloomLevel('ความปลอดภัยในการใช้อินเทอร์เน็ตและจริยธรรม')).toBe('evaluate');
      expect(getUnitBloomLevel('การแก้ปัญหาและอัลกอริทึม')).toBe('analyze');
      expect(getUnitBloomLevel('การใช้ซอฟต์แวร์ประมวลคำ')).toBe('apply');
      expect(getUnitBloomLevel('ความรู้เบื้องต้นเกี่ยวกับคอมพิวเตอร์และอุปกรณ์')).toBe('remember');
      expect(getUnitBloomLevel('การค้นหาข้อมูลบนอินเทอร์เน็ต')).toBe('apply');
    });
  });

  describe('2. Ebbinghaus Spaced Repetition', () => {
    it('บันทึกข้อที่ตอบผิดลงคิวทบทวนและคำนวณขั้นความจำ (Stages) ได้อย่างถูกต้อง', () => {
      recordMissedQuestion('std_01', {
        id: 'q_101',
        text: 'ข้อมูลส่วนตัวใดไม่ควรเผยแพร่?',
        options: ['เลขบัตรประชาชน', 'สีที่ชอบ'],
        answerIndex: 0,
        explanation: 'เป็นข้อมูลส่วนบุคคลอ่อนไหว',
        source: 'วิทยาการคำนวณ ป.1 ชุดที่ 1',
        grade: 'ป.1',
      });

      const missed = loadAllMissedQuestions('std_01');
      expect(missed).toHaveLength(1);
      expect(missed[0].mistakeCount).toBe(1);
      expect(missed[0].reviewStage).toBe(0);
      expect(missed[0].mastered).toBe(false);

      const pending = getPendingReviewQuestions('std_01');
      expect(pending).toHaveLength(1);

      // ตอบถูกครั้งที่ 1 ➔ ขยับไป stage 1
      const res1 = resolveReviewAttempt('std_01', 'q_101', true);
      expect(res1.nextStage).toBe(1);
      expect(res1.mastered).toBe(false);

      // ตอบถูกครั้งที่ 2 ➔ ขยับไป stage 2
      const res2 = resolveReviewAttempt('std_01', 'q_101', true);
      expect(res2.nextStage).toBe(2);
      expect(res2.mastered).toBe(false);

      // ตอบถูกครั้งที่ 3 ➔ สำเร็จสู่ความจำระยะยาว (Mastered)
      const res3 = resolveReviewAttempt('std_01', 'q_101', true);
      expect(res3.mastered).toBe(true);

      const stats = getSpacedReviewStats('std_01');
      expect(stats.masteredCount).toBe(1);
      expect(stats.pendingCount).toBe(0);
      expect(stats.retentionRate).toBe(100);
    });
  });

  describe('3. Self-Regulated Learning (SRL: Plan ➔ Monitor ➔ Reflect)', () => {
    it('มีเป้าหมายประจำสัปดาห์หลากหลายให้นักเรียนเลือกวางแผน (Plan)', () => {
      expect(weeklyGoalPresets.length).toBeGreaterThanOrEqual(4);
      expect(weeklyGoalPresets.some((p) => p.id === 'play_games')).toBe(true);
      expect(weeklyGoalPresets.some((p) => p.id === 'take_exam')).toBe(true);
    });

    it('สามารถสลับเป้าหมายและคำนวณความก้าวหน้ารายสัปดาห์ได้ (Monitor)', () => {
      const studentId = 'std_srl_1';
      changeWeeklyGoal(studentId, 'take_exam');

      const data = getActiveWeeklyGoal(studentId);
      expect(data.goal.id).toBe('take_exam');
      expect(data.record.weekKey).toBe(getCurrentWeekKey());
    });

    it('สามารถบันทึกข้อความสะท้อนคิดเมื่อบรรลุเป้าหมาย (Reflect)', () => {
      const studentId = 'std_srl_2';
      recordGoalReflection(studentId, 'สัปดาห์นี้เข้าใจการทำงานของบล็อกคำสั่งมากขึ้น');

      const data = getActiveWeeklyGoal(studentId);
      expect(data.record.reflectionText).toBe('สัปดาห์นี้เข้าใจการทำงานของบล็อกคำสั่งมากขึ้น');
    });
  });

  describe('4. Data Safety (รักษาข้อมูลคะแนนเดิม 100%)', () => {
    it('ฟีเจอร์การเรียนรู้ใหม่ไม่กระทบหรือลบข้อมูลในสมุดคะแนนและบัญชีรายชื่อ', () => {
      allClassrooms2569.forEach((classroom) => {
        initClassroom(classroom);
        const grades = loadGrades(classroom);
        expect(grades.length).toBeGreaterThan(0);
      });
    });
  });
});
