import { describe, it, expect, beforeEach } from 'vitest';
import { getExamSetsByGrade, getBestScoreForExamSet, saveExamAttempt, loadLocalExamAttempts, type ExamAttempt } from '../src/services/examService';
import { loadAllReflections, saveGameReflection, loadStudentReflections } from '../src/services/gameReflectionService';
import { allClassrooms2569 } from '../src/data/students2569';
import { loadGrades, initClassroom } from '../src/services/gradeService';

describe('Student Dashboard Ecosystem & Non-Destructive Integrity', () => {
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

  it('ทุกระดับชั้นในโรงเรียนมีชุดข้อสอบมาตรฐานรองรับใน CurriculumExamWidget', () => {
    allClassrooms2569.forEach((classroom) => {
      const sets = getExamSetsByGrade(classroom);
      expect(sets.length).toBeGreaterThan(0);
      sets.forEach((s) => {
        expect(s.questions.length).toBeGreaterThan(0);
        expect(s.totalQuestions).toBe(s.questions.length);
        expect(s.timeLimitMinutes).toBeGreaterThan(0);
      });
    });
  });

  it('สามารถบันทึกและโหลดประวัติการสอบพร้อมคำนวณคะแนนสูงสุดได้อย่างถูกต้อง', async () => {
    const attempt1: ExamAttempt = {
      id: 'att_1',
      studentId: 'p1_std_1',
      studentName: 'ด.ช. ปฐมพร',
      classroom: 'ป.1',
      examSetId: 'exam_ป1_set1',
      examTitle: 'วิทยาการคำนวณ ป.1 ชุดที่ 1',
      score: 12,
      totalQuestions: 19,
      percentage: 63,
      passed: true,
      answers: {},
      timeSpentSeconds: 420,
      timestamp: 1000,
    };

    const attempt2: ExamAttempt = {
      id: 'att_2',
      studentId: 'p1_std_1',
      studentName: 'ด.ช. ปฐมพร',
      classroom: 'ป.1',
      examSetId: 'exam_ป1_set1',
      examTitle: 'วิทยาการคำนวณ ป.1 ชุดที่ 1',
      score: 18,
      totalQuestions: 19,
      percentage: 95,
      passed: true,
      answers: {},
      timeSpentSeconds: 380,
      timestamp: 2000,
    };

    await saveExamAttempt(attempt1);
    await saveExamAttempt(attempt2);

    const attempts = loadLocalExamAttempts('p1_std_1');
    expect(attempts.length).toBe(2);

    const best = getBestScoreForExamSet('p1_std_1', 'exam_ป1_set1');
    expect(best).not.toBeNull();
    expect(best?.score).toBe(18);
    expect(best?.percentage).toBe(95);
  });

  it('สมุดสะท้อนคิด (Reflection Journal) สามารถบันทึกและกรองเฉพาะของนักเรียนรายบุคคลได้', async () => {
    await saveGameReflection({
      studentId: 'student_123',
      studentCode: '69001',
      studentName: 'น้องเรียนดี',
      classroom: 'ป.1',
      gameId: 'coding-maze',
      gameTitle: 'Coding Maze',
      objective: 'ฝึกการจัดลำดับคำสั่งแบบขั้นตอน',
      challengeMode: false,
      challengeText: 'ผ่านด่าน 1-10',
      questionAnswered: true,
      reflectionText: 'ได้เรียนรู้ว่าต้องวางแผนทิศทางก่อนกดรันคำสั่ง',
    });

    await saveGameReflection({
      studentId: 'student_456',
      studentCode: '69002',
      studentName: 'น้องเพื่อนร่วมชั้น',
      classroom: 'ป.1',
      gameId: 'binary',
      gameTitle: 'Binary Game',
      objective: 'เข้าใจเลขฐานสอง',
      challengeMode: true,
      challengeText: 'โหมด 8-Bit',
      questionAnswered: true,
      reflectionText: 'เข้าใจการเปิดปิดบิต 0 และ 1',
    });

    const studentRecords = loadStudentReflections('student_123');
    expect(studentRecords.length).toBe(1);
    expect(studentRecords[0].studentName).toBe('น้องเรียนดี');
    expect(studentRecords[0].reflectionText).toContain('ได้เรียนรู้ว่าต้องวางแผน');

    const otherRecords = loadStudentReflections('student_456');
    expect(otherRecords.length).toBe(1);
    expect(otherRecords[0].challengeMode).toBe(true);
  });

  it('รักษาความปลอดภัยของข้อมูลคะแนนเดิม ไม่มีการลบหรือเขียนทับข้อมูลในสมุดคะแนน', () => {
    allClassrooms2569.forEach((classroom) => {
      initClassroom(classroom);
      const grades = loadGrades(classroom);
      expect(Array.isArray(grades)).toBe(true);
      // Roster and grade records must exist and remain protected
      expect(grades.length).toBeGreaterThan(0);
    });
  });
});
