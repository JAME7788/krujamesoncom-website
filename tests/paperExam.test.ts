import { beforeEach, describe, expect, it, vi } from 'vitest';

class MemoryStorage implements Storage {
  private readonly data = new Map<string, string>();
  get length() { return this.data.size; }
  clear() { this.data.clear(); }
  getItem(key: string) { return this.data.get(key) ?? null; }
  key(index: number) { return [...this.data.keys()][index] ?? null; }
  removeItem(key: string) { this.data.delete(key); }
  setItem(key: string, value: string) { this.data.set(key, String(value)); }
}
vi.stubGlobal('localStorage', new MemoryStorage());

import {
  loadPaperExams,
  newPaperExam,
  nextExamCode,
  parseAnswerKeyText,
  savePaperExam,
  savePaperResult,
  scorePaperAnswers,
  syncAllPaperResultsToGradebook,
  type PaperExam,
} from '../src/services/paperExamService';
import { loadLocalExamAttempts, type ExamAttempt } from '../src/services/examService';
import { getIndicators, loadGrades } from '../src/services/gradeService';
import { loadRoster } from '../src/services/rosterService';
import {
  analyzeItems,
  bestAttemptPerStudent,
  buildItemAnalysisCsv,
  computeKr20,
  computePsychometricSummary,
  describeKr20,
  summarizeAttempts,
} from '../src/utils/examAnalysis';

const exam = (overrides: Partial<PaperExam> = {}): PaperExam => ({
  id: 'pe_test', code: 1234, title: 'ปลายภาค ป.4', classroom: 'ป.4', subject: 'main',
  questionCount: 20, choiceCount: 4, keyMasks: Array.from({ length: 20 }, (_, i) => 1 << (i % 4)),
  points: Array.from({ length: 20 }, () => 1),
  gradebookTarget: 'final', createdAt: 1, updatedAt: 1, ...overrides,
});

beforeEach(() => localStorage.clear());

describe('ชุดข้อสอบกระดาษ', () => {
  it('แปลงเฉลยแบบพิมพ์ได้ทั้ง ก-ง ตัวเลข และตัวอักษร พร้อมข้อที่ไม่คิดคะแนน', () => {
    expect(parseAnswerKeyText('กขค ง', 4)).toEqual([0, 1, 2, 3]);
    expect(parseAnswerKeyText('1,2,3,4,5', 4)).toEqual([0, 1, 2, 3, -1]);
    expect(parseAnswerKeyText('ab-d', 4)).toEqual([0, 1, -1, 3]);
  });

  it('คิดคะแนนเฉพาะข้อที่มีเฉลย', () => {
    const e = exam({ questionCount: 4, keyMasks: [1, 2, 0, 8], points: [1, 1, 1, 1] });
    expect(scorePaperAnswers(e, [0, 2, 1, 3])).toEqual({ score: 2, total: 3, correct: [true, false, false, true] });
    // ยอมรับหลายคำตอบ (ก หรือ ค) และคะแนนรายข้อ
    const multi = exam({ questionCount: 2, keyMasks: [0b101, 2], points: [2, 3] });
    expect(scorePaperAnswers(multi, [2, 1])).toEqual({ score: 5, total: 5, correct: [true, true] });
  });

  it('รหัสชุดใหม่ไม่ซ้ำของเดิม', () => {
    let calls = 0;
    const fixed = () => (calls++ === 0 ? 0 : 0.5);
    const taken = [exam({ code: 100 })];
    expect(nextExamCode(taken, fixed)).not.toBe(100);
    const created = newPaperExam([], 'ม.2', 'cs');
    expect(created.keyMasks).toHaveLength(20);
    expect(created.code).toBeGreaterThanOrEqual(100);
  });

  it('บันทึกชุดข้อสอบในเครื่องได้ ตัดเฉลยที่เกินจำนวนตัวเลือก และแปลงชุดเก่า (answerKey) เป็นบิตมาสก์', async () => {
    await savePaperExam(exam({ keyMasks: [16, 2, 4], points: [1, 9, 2], questionCount: 3 }));
    const [saved] = loadPaperExams();
    expect(saved.keyMasks).toEqual([0, 2, 4]);
    expect(saved.points).toEqual([1, 1, 2]);
    localStorage.setItem('krujames_paper_exams_v1', JSON.stringify([{ ...exam({ questionCount: 3 }), keyMasks: undefined, answerKey: [0, -1, 2] }]));
    expect(loadPaperExams()[0].keyMasks).toEqual([1, 0, 4]);
  });

  it('สแกนแล้วบันทึกผลสอบ และลงช่องปลายภาคตามสัดส่วนคะแนนเต็ม', async () => {
    const student = loadRoster('ป.4')[0];
    const e = exam();
    const keyIndex = (i: number) => i % 4;
    const answers = e.keyMasks.map((_, i) => (i < 15 ? keyIndex(i) : (keyIndex(i) + 1) % 4));
    const result = await savePaperResult(e, student.no, answers);
    expect(result.attempt).toMatchObject({ score: 15, totalQuestions: 20, percentage: 75, source: 'paper', studentNo: student.no });
    expect(result.remote).toBe(false); // ในเทสต์ปิด Firebase
    expect(result.gradebook).toBe('saved');
    expect(result.gradebookScore).toBe(11.25); // 15/20 × 15 คะแนนเต็มปลายภาคประถม
    const row = loadGrades('ป.4', 'main').find((g) => g.studentCode === student.studentCode);
    expect(row?.finalExam).toBe(11.25);
    // สแกนซ้ำคนเดิม → เขียนทับผลเดิม ไม่เพิ่มรายการ
    await savePaperResult(e, student.no, e.keyMasks.map((_, i) => keyIndex(i)));
    expect(loadLocalExamAttempts().filter((a) => a.examSetId === e.id)).toHaveLength(1);
  });

  it('เลขที่ไม่อยู่ในรายชื่อ: เก็บผลไว้ แต่ไม่ลงสมุดคะแนน', async () => {
    const result = await savePaperResult(exam(), 99, exam().keyMasks.map((_, i) => i % 4));
    expect(result.gradebook).toBe('no-student');
  });

  it('ส่งคะแนนเข้าตัวชี้วัด K ทั้งรายคนและส่งทั้งห้อง 1 คลิก โดยไม่กระทบตัวชี้วัดอื่น', async () => {
    const roster = loadRoster('ป.4');
    const indicators = getIndicators('ป.4', 'main');
    const targetInd = indicators[1];
    const e = exam({ gradebookTarget: 'indicator', indicatorId: targetInd.id });
    const fullAnswers = e.keyMasks.map((_, i) => i % 4);
    const halfAnswers = e.keyMasks.map((_, i) => (i < 10 ? i % 4 : (i + 1) % 4));

    const res1 = await savePaperResult(e, roster[0].no, fullAnswers);
    expect(res1.gradebook).toBe('saved');
    expect(res1.gradebookScore).toBe(targetInd.maxScore);

    // บันทึกคนที่ 2 แบบไม่ผูกช่องก่อน แล้วทดสอบส่งทั้งห้อง 1 คลิก
    const noTargetExam = exam({ gradebookTarget: 'none' });
    const res2 = await savePaperResult(noTargetExam, roster[1].no, halfAnswers);
    expect(res2.gradebook).toBe('skipped');

    const bulk = syncAllPaperResultsToGradebook(noTargetExam, [res1.attempt, res2.attempt], {
      target: 'indicator',
      indicatorId: targetInd.id,
    });
    expect(bulk.closed).toBe(false);
    expect(bulk.updated).toBe(2);

    const grades = loadGrades('ป.4', 'main');
    const row1 = grades.find((g) => g.studentCode === roster[0].studentCode);
    const row2 = grades.find((g) => g.studentCode === roster[1].studentCode);
    expect(row1?.indicators[targetInd.id]?.k).toBe(15);
    expect(row2?.indicators[targetInd.id]?.k).toBe(7.5);
    // ตัวชี้วัดอื่นต้องไม่ถูกเขียนทับ
    expect(row1?.indicators[indicators[0].id]?.k).toBe(0);
  });
});

describe('วิเคราะห์ข้อสอบ', () => {
  const attempt = (studentId: string, score: number, answers: Record<string, number>, timestamp = 1): ExamAttempt => ({
    id: `${studentId}-${timestamp}`, studentId, classroom: 'ป.4', examSetId: 'x', examTitle: 'x', score, totalQuestions: 2,
    percentage: score * 50, passed: score >= 1, answers, timeSpentSeconds: 0, timestamp,
  });

  it('ใช้ผลดีที่สุดของแต่ละคน', () => {
    const best = bestAttemptPerStudent([attempt('a', 1, {}, 1), attempt('a', 2, {}, 2), attempt('b', 0, {}, 3)]);
    expect(best.map((a) => [a.studentId, a.score])).toEqual([['a', 2], ['b', 0]]);
    expect(summarizeAttempts(best)).toEqual({ takers: 2, averagePercent: 50, passRate: 50 });
  });

  it('คำนวณค่าความยาก p และอำนาจจำแนก r', () => {
    // 10 คน: 5 คนเก่งตอบข้อ 1 ถูก, 5 คนอ่อนตอบผิด → p = 0.5, r = 1
    const list = Array.from({ length: 10 }, (_, i) => attempt(`s${i}`, i < 5 ? 2 : 0, { q1: i < 5 ? 0 : 1, q2: 1 }));
    const [item1, item2] = analyzeItems(list, [{ key: 'q1', label: 'ข้อ 1', mask: 1, choiceCount: 4 }, { key: 'q2', label: 'ข้อ 2', mask: 2, choiceCount: 4 }]);
    expect(item1.choiceCounts).toEqual([5, 5, 0, 0]);
    expect(item1.p).toBe(0.5);
    expect(item1.r).toBe(1);
    expect(item2.p).toBe(1);
    expect(item2.r).toBe(0);
    expect(analyzeItems(list.slice(0, 4), [{ key: 'q1', label: 'ข้อ 1', mask: 1, choiceCount: 4 }])[0].r).toBeNull();
  });

  it('คำนวณ KR-20, Mean, S.D. และสร้าง CSV เมทริกซ์ 0/1 สำหรับ SPSS/Excel', () => {
    const key = [
      { key: 'q1', label: 'ข้อ 1', mask: 1, choiceCount: 4 },
      { key: 'q2', label: 'ข้อ 2', mask: 2, choiceCount: 4 },
      { key: 'q3', label: 'ข้อ 3', mask: 4, choiceCount: 4 },
      { key: 'q4', label: 'ข้อ 4', mask: 8, choiceCount: 4 },
    ];
    // 6 คน: 3 คนเก่งได้เต็ม 4/4, 3 คนอ่อนได้ 0/4 → ความสอดคล้องภายในสมบูรณ์ KR-20 = 1.00
    const list: ExamAttempt[] = Array.from({ length: 6 }, (_, i) => {
      const high = i < 3;
      return {
        id: `s${i}`,
        studentId: `ป.4_${i + 1}_คนที่${i + 1}`,
        studentName: `นักเรียน ${i + 1}`,
        studentNo: i + 1,
        classroom: 'ป.4',
        examSetId: 'x',
        examTitle: 'สอบกลางภาค',
        score: high ? 4 : 0,
        totalQuestions: 4,
        percentage: high ? 100 : 0,
        passed: high,
        answers: high ? { q1: 0, q2: 1, q3: 2, q4: 3 } : { q1: 1, q2: 0, q3: 0, q4: 0 },
        timeSpentSeconds: 0,
        timestamp: 100 + i,
      };
    });
    const kr20 = computeKr20(list, key);
    expect(kr20).toBe(1);
    expect(describeKr20(kr20).level).toBe('good');

    const psych = computePsychometricSummary(list, key, 4);
    expect(psych.meanScore).toBe(2);
    expect(psych.sdScore).toBe(2);
    expect(psych.passRate50).toBe(50);
    expect(psych.passRate70).toBe(50);
    expect(psych.goodItemsCount).toBe(4);

    const csv = buildItemAnalysisCsv('สอบกลางภาค', 'ป.4', list, key);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('KR-20');
    expect(csv).toContain('เมทริกซ์คะแนนรายข้อแบบ 0/1');
    expect(csv).toContain('1,นักเรียน 1,1,1,1,1,4,100');
  });
});
