import { describe, it, expect, beforeEach } from 'vitest';
import {
  curriculumExamSets,
  getExamSetsByGrade,
  getExamSetById,
  saveExamAttempt,
  loadLocalExamAttempts,
  getBestScoreForExamSet,
  type ExamAttempt,
} from '../src/services/examService';

describe('Digital Curriculum Exam Bank & Exam Service', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('มีชุดข้อสอบครบถ้วนทั้ง 25 ชุดตามหลักสูตร', () => {
    expect(curriculumExamSets.length).toBe(25);
  });

  it('ทุกชุดข้อสอบมีคำถาม ตัวเลือก และคำอธิบายอย่างถูกต้อง', () => {
    curriculumExamSets.forEach((set) => {
      expect(set.totalQuestions).toBeGreaterThan(0);
      expect(set.questions.length).toBe(set.totalQuestions);
      expect(set.grade).toBeDefined();
      expect(set.title).toBeDefined();

      set.questions.forEach((q) => {
        expect(q.text.length).toBeGreaterThan(0);
        expect(q.options.length).toBeGreaterThanOrEqual(3);
        expect(q.answerIndex).toBeGreaterThanOrEqual(0);
        expect(q.answerIndex).toBeLessThan(q.options.length);
        expect(q.explanation).toBeDefined();
      });
    });
  });

  it('สามารถกรองชุดข้อสอบตามระดับชั้นได้อย่างถูกต้อง', () => {
    const p1Sets = getExamSetsByGrade('ป.1');
    expect(p1Sets.length).toBe(4);

    const p2Sets = getExamSetsByGrade('ป.2');
    expect(p2Sets.length).toBe(4);

    const p4Sets = getExamSetsByGrade('ป.4');
    expect(p4Sets.length).toBe(4);

    const m1Sets = getExamSetsByGrade('ม.1');
    expect(m1Sets.length).toBe(5);

    const m2Sets = getExamSetsByGrade('ม.2');
    expect(m2Sets.length).toBe(4);

    const m3Sets = getExamSetsByGrade('ม.3');
    expect(m3Sets.length).toBe(4);
  });

  it('ค้นหาชุดข้อสอบด้วย ID ได้อย่างถูกต้อง', () => {
    const set = getExamSetById('exam_ป1_set1');
    expect(set).toBeDefined();
    expect(set?.grade).toBe('ป.1');
    expect(set?.setNumber).toBe(1);
  });

  it('บันทึกและโหลดผลการทำแบบทดสอบได้อย่างปลอดภัยโดยไม่กระทบข้อมูลอื่น', async () => {
    const attempt: ExamAttempt = {
      id: 'test_attempt_1',
      studentId: 'std_001',
      studentName: 'น้องทดสอบ',
      classroom: 'ป.1',
      examSetId: 'exam_ป1_set1',
      examTitle: 'วิทยาการคำนวณ ป.1 ชุดที่ 1',
      score: 18,
      totalQuestions: 20,
      percentage: 90,
      passed: true,
      answers: { exam_ป1_set1_q1: 0, exam_ป1_set1_q2: 1 },
      timeSpentSeconds: 600,
      timestamp: Date.now(),
    };

    await saveExamAttempt(attempt);

    const loaded = loadLocalExamAttempts('std_001');
    expect(loaded.length).toBe(1);
    expect(loaded[0].score).toBe(18);
    expect(loaded[0].percentage).toBe(90);
    expect(loaded[0].passed).toBe(true);

    const best = getBestScoreForExamSet('std_001', 'exam_ป1_set1');
    expect(best).not.toBeNull();
    expect(best?.score).toBe(18);
    expect(best?.percentage).toBe(90);
  });
});
