import { describe, expect, it, beforeEach, vi } from 'vitest';

class MemoryStorage implements Storage {
  private readonly data = new Map<string, string>();
  get length() { return this.data.size; }
  clear() { this.data.clear(); }
  getItem(key: string) { return this.data.get(key) ?? null; }
  key(index: number) { return [...this.data.keys()][index] ?? null; }
  removeItem(key: string) { this.data.delete(key); }
  setItem(key: string, value: string) { this.data.set(key, String(value)); }
}

const memoryStorage = new MemoryStorage();
vi.stubGlobal('localStorage', memoryStorage);

import {
  computeBreakdown,
  computeTotal,
  computeGrade,
  getIndicators,
  updateTeacherKnowledgeScore,
  updateFinalExam,
  cacheGradesLocally,
  loadGrades,
  emptyIndicatorScore,
  getGradingPolicy,
  type StudentGrade,
  type IndicatorScore,
} from '../src/services/gradeService';

describe('การตรวจพิสูจน์ระบบคะแนนและเกรดอย่างละเอียด (Scoring System Forensic Audit)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const createDummyStudent = (classroom = 'ป.1', code = 'std_01', no = 1, name = 'สมชาย'): StudentGrade => {
    const indicators = getIndicators(classroom);
    const indScores: Record<string, IndicatorScore> = {};
    indicators.forEach((ind) => {
      indScores[ind.id] = emptyIndicatorScore(ind.maxScore);
    });

    return {
      studentCode: code,
      classroom,
      studentNo: no,
      name,
      emoji: '👦',
      indicators: indScores,
      updatedAt: Date.now(),
    };
  };

  describe('1. ป้องกันข้อผิดพลาดทางคณิตศาสตร์ (Math Safety & NaN Prevention)', () => {
    it('คะแนนรวม (computeTotal) และคะแนนแจกแจง (computeBreakdown) ต้องไม่เป็น NaN ไม่ว่ากรณีใดๆ', () => {
      const student = createDummyStudent('ป.1');
      student.midtermExam = undefined;
      student.finalExam = undefined;

      const breakdown = computeBreakdown(student, 'ป.1');
      expect(Number.isNaN(breakdown.total)).toBe(false);
      expect(Number.isNaN(breakdown.collected)).toBe(false);
      expect(Number.isNaN(breakdown.k)).toBe(false);
      expect(Number.isNaN(breakdown.p)).toBe(false);
      expect(Number.isNaN(breakdown.a)).toBe(false);
      expect(Number.isNaN(breakdown.exam)).toBe(false);
      expect(breakdown.total).toBe(0);

      const total = computeTotal(student, 'ป.1');
      expect(Number.isNaN(total)).toBe(false);
      expect(total).toBe(0);
    });

    it('ป้องกันการหารด้วยศูนย์ (Division by Zero) ในกรณีตัวชี้วัดมี maxScore เป็น 0', () => {
      const student = createDummyStudent('ป.1');
      // สมมุติค่าตัวชี้วัดหนึ่งถูกป้อน maxScore เป็น 0
      const indId = Object.keys(student.indicators)[0];
      student.indicators[indId].maxK = 0;
      student.indicators[indId].k = 10;

      const breakdown = computeBreakdown(student, 'ป.1');
      expect(Number.isNaN(breakdown.total)).toBe(false);
      expect(Number.isFinite(breakdown.total)).toBe(true);
    });

    it('ไม่เกิดบั๊ก Floating Point ปัดเศษทศนิยมไม่เกิน 2 ตำแหน่ง', () => {
      const student = createDummyStudent('ม.1');
      // จำลองคะแนนที่มีทศนิยมไม่รู้จบ (เช่น 1/3)
      Object.values(student.indicators).forEach((ind) => {
        ind.k = 7.333333333333333;
        ind.teacherK = 7.333333333333333;
        ind.p = 'ดี';
        ind.pScore = 20;
        ind.pAssessed = true;
        ind.practicePassed = true;
        ind.a = true;
        ind.aScore = 8;
        ind.aAssessed = true;
      });
      student.midtermExam = 14.777777777;
      student.finalExam = 19.888888888;

      const breakdown = computeBreakdown(student, 'ม.1');
      // ตรวจสอบว่าทศนิยมไม่เกิน 2 ตำแหน่ง
      const strTotal = breakdown.total.toString();
      const decimalPlaces = strTotal.includes('.') ? strTotal.split('.')[1].length : 0;
      expect(decimalPlaces).toBeLessThanOrEqual(2);
      expect(Number.isFinite(breakdown.total)).toBe(true);
    });
  });

  describe('2. การควบคุมเพดานคะแนน (Upper & Lower Bound Overflow Protection)', () => {
    it('คะแนนประถมต้องถูก Cap ไม่ให้เกิน 50 ต่อเทอม แม้ครูจะกรอกคะแนนล้น', () => {
      const student = createDummyStudent('ป.1');
      Object.values(student.indicators).forEach((ind) => {
        ind.k = 9999;
        ind.p = 'ดี';
        ind.pScore = 9999;
        ind.pAssessed = true;
        ind.practicePassed = true;
        ind.a = true;
        ind.aAssessed = true;
      });
      student.finalExam = 9999;

      const breakdown = computeBreakdown(student, 'ป.1');
      expect(breakdown.collected).toBe(35); // เต็ม 35
      expect(breakdown.final).toBe(15);     // เต็ม 15
      expect(breakdown.total).toBe(50);     // เต็ม 50
    });

    it('คะแนนมัธยมต้องถูก Cap ไม่ให้เกิน 100 เต็ม (เก็บ 55 + กลางภาค 15 + ปลายภาค 30)', () => {
      const student = createDummyStudent('ม.1');
      Object.values(student.indicators).forEach((ind) => {
        ind.k = 9999;
        ind.p = 'ดี';
        ind.pScore = 9999;
        ind.pAssessed = true;
        ind.practicePassed = true;
        ind.a = true;
        ind.aAssessed = true;
      });
      student.midtermExam = 9999;
      student.finalExam = 9999;

      const breakdown = computeBreakdown(student, 'ม.1');
      expect(breakdown.collected).toBe(55); // เต็ม 55
      expect(breakdown.midterm).toBe(15);   // เต็ม 15 ตามเกณฑ์ คมด.
      expect(breakdown.final).toBe(30);     // เต็ม 30 ตามเกณฑ์ คมด.
      expect(breakdown.total).toBe(100);    // เต็ม 100
      expect(computeGrade(student, 'ม.1')).toBe('4');
    });

    it('คะแนนติดลบต้องถูก Floor ที่ 0 เสมอ', () => {
      const student = createDummyStudent('ป.1');
      cacheGradesLocally('ป.1', [student]);

      const indId = Object.keys(student.indicators)[0];
      updateTeacherKnowledgeScore('ป.1', student.studentCode, indId, -50);
      updateFinalExam('ป.1', student.studentCode, -20);

      const reloaded = loadGrades('ป.1')[0];
      expect(reloaded.indicators[indId].k).toBe(0);
      expect(reloaded.finalExam).toBe(0);

      const breakdown = computeBreakdown(reloaded, 'ป.1');
      expect(breakdown.total).toBe(0);
    });
  });

  describe('3. กฎการตัดเกรดของหลักสูตรกระทรวงศึกษาธิการ (Educational Policy Standards)', () => {
    it('ประถม (ป.1 - ป.6) ต้องแสดง "รอผลทั้งปี" เสมอในระดับเทอม เพื่อรอรวมสองเทอม', () => {
      ['ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'].forEach((classroom) => {
        const student = createDummyStudent(classroom);
        expect(getGradingPolicy(classroom).annualGrade).toBe(true);
        expect(computeGrade(student, classroom)).toBe('รอผลทั้งปี');
      });
    });

    it('มัธยม (ม.1 - ม.3) ต้องขึ้น "คะแนนยังไม่ครบ" หากยังไม่ได้ประเมินครบทุกส่วน', () => {
      const student = createDummyStudent('ม.1');
      // ยังไม่มีคะแนนสอบ
      expect(computeGrade(student, 'ม.1')).toBe('คะแนนยังไม่ครบ');

      student.midtermExam = 15;
      student.finalExam = 20;
      // ตัวชี้วัดยังไม่ได้ประเมิน P / A
      expect(computeGrade(student, 'ม.1')).toBe('คะแนนยังไม่ครบ');
    });

    it('มัธยม (ม.1 - ม.3) ตัดเกรด 8 ระดับถูกต้อง 100% ตามเกณฑ์คะแนนมาตรฐาน สพฐ.', () => {
      const testCutoffs: { totalScore: number; expectedGrade: string }[] = [
        { totalScore: 80, expectedGrade: '4' },
        { totalScore: 79.5, expectedGrade: '3.5' },
        { totalScore: 75, expectedGrade: '3.5' },
        { totalScore: 74, expectedGrade: '3' },
        { totalScore: 70, expectedGrade: '3' },
        { totalScore: 69, expectedGrade: '2.5' },
        { totalScore: 65, expectedGrade: '2.5' },
        { totalScore: 64, expectedGrade: '2' },
        { totalScore: 60, expectedGrade: '2' },
        { totalScore: 59, expectedGrade: '1.5' },
        { totalScore: 55, expectedGrade: '1.5' },
        { totalScore: 54, expectedGrade: '1' },
        { totalScore: 50, expectedGrade: '1' },
        { totalScore: 49.5, expectedGrade: '0' },
        { totalScore: 0, expectedGrade: '0' },
      ];

      testCutoffs.forEach(({ totalScore, expectedGrade }) => {
        const student = createDummyStudent('ม.1');
        // จัดคะแนนให้ได้ยอดรวมตามจุดตัดจริง โดยใช้สัดส่วนมัธยม 55 + 15 + 30
        const examScore = Math.min(totalScore, 45);
        const needsPracticePoint = totalScore > 78;
        const practiceScore = needsPracticePoint ? (55 * 0.25 / 3) : 0;
        const knowledgeScore = Math.max(0, totalScore - examScore - practiceScore);
        const kRatio = knowledgeScore / (55 * 0.60);
        Object.values(student.indicators).forEach((ind) => {
          ind.k = ind.maxK * kRatio;
          ind.teacherK = ind.k;
          ind.p = 'พอใช้';
          ind.pScore = needsPracticePoint ? 1 : 0;
          ind.pAssessed = true;
          ind.practicePassed = needsPracticePoint;
          ind.a = false;
          ind.aAssessed = true;
        });

        student.midtermExam = Math.min(examScore, 15);
        student.finalExam = Math.max(0, examScore - 15);

        // ตรวจสอบว่า computeGrade คืนค่าเกรดที่ถูกต้อง
        const actualGrade = computeGrade(student, 'ม.1');
        expect(actualGrade).toBe(expectedGrade);
      });
    });
  });

  describe('4. ความปลอดภัยและความคงอยู่ของข้อมูล (Non-Destructive & Data Safety Audit)', () => {
    it('การแก้ไขคะแนนของนักเรียนคนหนึ่ง ต้องไม่ลบหรือกระทบคะแนนของเพื่อนร่วมห้อง', () => {
      const student1 = createDummyStudent('ป.1', 'std_01', 1, 'ด.ช.หนึ่ง');
      const student2 = createDummyStudent('ป.1', 'std_02', 2, 'ด.ช.สอง');

      student1.finalExam = 12;
      student2.finalExam = 14;

      cacheGradesLocally('ป.1', [student1, student2]);

      // แก้คะแนนของ student1
      updateFinalExam('ป.1', 'std_01', 15);

      const reloaded = loadGrades('ป.1');
      expect(reloaded.length).toBeGreaterThanOrEqual(2);

      const reloaded1 = reloaded.find((s) => s.studentCode === 'std_01');
      const reloaded2 = reloaded.find((s) => s.studentCode === 'std_02');

      expect(reloaded1?.finalExam).toBe(15);
      expect(reloaded2?.finalExam).toBe(14); // คะแนน student2 ยังอยู่ครบถ้วน ไม่โดนลบ
      expect(reloaded2?.name).toBe('ด.ช.สอง');
    });

    it('การรีเซ็ตคะแนน K รายบุคคล (ล้างค่าที่ครูกรอก) ต้องไม่ทำให้คะแนนดิบจากข้อสอบหาย', () => {
      const student = createDummyStudent('ป.1');
      const indId = Object.keys(student.indicators)[0];

      student.indicators[indId].webK = 8;     // คะแนนจริงจากการทำข้อสอบในเว็บ
      student.indicators[indId].teacherK = 14; // ครู override ไว้
      student.indicators[indId].k = 14;

      cacheGradesLocally('ป.1', [student]);

      // ครูกดล้างค่า override (ส่ง NaN หรือ null)
      updateTeacherKnowledgeScore('ป.1', student.studentCode, indId, NaN);

      const reloaded = loadGrades('ป.1')[0];
      expect(reloaded.indicators[indId].teacherK).toBeUndefined();
      expect(reloaded.indicators[indId].k).toBe(8); // ดีดกลับมาใช้คะแนนจริงในเว็บ ไม่กลายเป็น 0
      expect(reloaded.indicators[indId].webK).toBe(8);
    });
  });
});
