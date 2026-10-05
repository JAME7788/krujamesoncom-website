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
  recommendAssignment,
  getRecommendedDifficulty,
  getAssignmentsForStudent,
  createAssignment,
  generate3TierAssignments,
  type Assignment,
} from '../src/services/homeworkService';

describe('Personalized Assignment & Differentiated Learning', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('ไม่เปิดงานเฉพาะคนเมื่อไม่มีข้อมูลผู้เรียน', () => {
    localStorage.setItem('krujames_assignments_v1', JSON.stringify([{ id: 'private', classroom: 'ป.1', targetType: 'specific_students', targetStudentIds: [] }]));
    expect(getAssignmentsForStudent('ป.1')).toEqual([]);
    expect(getAssignmentsForStudent('ป.1', 'ป.1_1_สมชาย', 1)).toEqual([]);
  });

  it('ไม่มีหลักฐานให้เลือกมาตรฐานโดยไม่ตีตราจากคะแนนรวม', () => {
    expect(recommendAssignment({classroom: 'ป.1', subject: 'cs', indicatorId: 'test'} as Assignment, 'student').difficulty).toBe('standard');
  });

  it('คำนวณ AbilityTier และแนะนำระดับความยากได้อย่างถูกต้อง', () => {
    expect(getRecommendedDifficulty('advanced')).toBe('advanced');
    expect(getRecommendedDifficulty('proficient')).toBe('standard');
    expect(getRecommendedDifficulty('developing')).toBe('foundation');
    expect(getRecommendedDifficulty('intervention')).toBe('foundation');
  });

  it('กรองงานตามเป้าหมายเฉพาะบุคคล (Specific Students)', async () => {
    const aAll: Omit<Assignment, 'id' | 'createdAt'> = {
      title: 'งานสำหรับทุกคน',
      description: 'ทุกคนต้องทำ',
      classroom: 'ป.1',
      dueDate: '2026-10-01',
      maxScore: 10,
      createdBy: 'teacher',
      targetType: 'all',
    };

    const aSpecific: Omit<Assignment, 'id' | 'createdAt'> = {
      title: 'งานเสริมเฉพาะคน',
      description: 'สำหรับนักเรียนเลขที่ 1 และ 2',
      classroom: 'ป.1',
      dueDate: '2026-10-01',
      maxScore: 10,
      createdBy: 'teacher',
      targetType: 'specific_students',
      targetStudentIds: ['1', '2'],
    };

    await createAssignment(aAll);
    await createAssignment(aSpecific);

    // นักเรียนเลขที่ 1 ควรเห็นทั้ง 2 งาน
    const student1Tasks = getAssignmentsForStudent('ป.1', 'ป.1_1_สมชาย', 1);
    expect(student1Tasks).toHaveLength(2);

    // นักเรียนเลขที่ 5 ควรเห็นเฉพาะงานสำหรับทุกคน
    const student5Tasks = getAssignmentsForStudent('ป.1', 'ป.1_5_สมหญิง', 5);
    expect(student5Tasks).toHaveLength(1);
    expect(student5Tasks[0].title).toBe('งานสำหรับทุกคน');
  });

  it('สร้างชุดงาน 3 ระดับอัตโนมัติ (generate3TierAssignments) สำเร็จครบทั้ง Foundation, Standard, Advanced', async () => {
    const list = await generate3TierAssignments({
      classroom: 'ป.4',
      subject: 'cs',
      indicatorId: 'w4.2-p4-1',
      topic: 'การเขียนโปรแกรมด้วย Scratch',
      dueDate: '2026-10-15',
    });

    expect(list).toHaveLength(3);

    const foundation = list.find((a) => a.difficulty === 'foundation');
    const standard = list.find((a) => a.difficulty === 'standard');
    const advanced = list.find((a) => a.difficulty === 'advanced');

    expect(foundation).toBeDefined();
    expect(foundation?.hints).toBeDefined();
    expect(foundation?.hints?.length).toBeGreaterThan(0);
    expect(foundation?.title).toContain('[ระดับพื้นฐาน]');

    expect(standard).toBeDefined();
    expect(standard?.title).toContain('[ระดับมาตรฐาน]');

    expect(advanced).toBeDefined();
    expect(advanced?.title).toContain('[ระดับท้าทาย]');
    expect(advanced?.bonusPoints).toBeUndefined();
    expect(new Set(list.map(a => a.personalizedPackId)).size).toBe(1);
    expect(new Set(list.map(a => a.linkedKnowledgeAssessmentId)).size).toBe(1);
  });

  it('รองรับการสร้างและส่งงานโครงงานกระบวนการคิดเชิงออกแบบ (Design Thinking) 4 ขั้นตอน', async () => {
    const { submitWork, loadSubmissions } = await import('../src/services/homeworkService');
    const dtAssignment = await createAssignment({
      title: 'โครงงานออกแบบเทคโนโลยีเพื่อชุมชน',
      description: 'ใช้กระบวนการคิดเชิงออกแบบแก้ปัญหาในโรงเรียนหรือชุมชน',
      classroom: 'ม.1',
      dueDate: '2026-10-30',
      maxScore: 20,
      knowledgeMaxScore: 10,
      practiceMaxScore: 10,
      createdBy: 'teacher',
      targetType: 'all',
      isDesignThinking: true,
    });

    expect(dtAssignment.isDesignThinking).toBe(true);

    const submission = await submitWork({
      assignmentId: dtAssignment.id,
      studentId: 'student_m1_01',
      studentName: 'เด็กชายสมหมาย มั่งมี',
      classroom: 'ม.1',
      studentNo: 1,
      contentUrl: 'https://canva.com/design/sample-prototype',
      comment: '[Design Thinking Project]',
      designThinkingSteps: {
        define: 'ขยะพลาสติกในโรงอาหารมีจำนวนมากและไม่ได้คัดแยก',
        ideate: 'ออกแบบถังขยะอัจฉริยะพร้อมบอร์ดจำแนกประเภทและป้ายแนะนำสีสดใส',
        prototypeUrl: 'https://canva.com/design/sample-prototype',
        testFeedback: 'เพื่อนๆ ชอบสีสันและเข้าใจการแยกขยะได้เร็วขึ้น แต่เสนอให้เพิ่มเสียงขอบคุณ',
      },
    });

    expect(submission.id).toBeDefined();
    expect(submission.designThinkingSteps?.define).toContain('ขยะพลาสติก');
    expect(submission.designThinkingSteps?.prototypeUrl).toBe('https://canva.com/design/sample-prototype');

    const allSubs = loadSubmissions();
    const found = allSubs.find(s => s.assignmentId === dtAssignment.id);
    expect(found).toBeDefined();
    expect(found?.designThinkingSteps?.testFeedback).toContain('เพื่อนๆ ชอบสีสัน');
  });
});
