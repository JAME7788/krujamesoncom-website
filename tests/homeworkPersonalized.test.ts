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

  it('คำนวณสรุปงานค้างส่ง งานรอส่ง งานรอตรวจ และรวมชุดงาน 3 ระดับไม่ให้นับซ้ำ (getStudentWorkStatusOverview)', async () => {
    const {
      getStudentWorkStatusOverview,
      submitWork,
      reviewSubmission,
    } = await import('../src/services/homeworkService');

    // 1. งานเลยกำหนดส่ง (Overdue)
    await createAssignment({
      title: 'ใบงานที่ 1 (เลยกำหนด)',
      description: 'ส่งย้อนหลังได้',
      classroom: 'ป.5',
      dueDate: '2020-01-01',
      maxScore: 10,
      createdBy: 'teacher',
      targetType: 'all',
    });

    // 2. งานยังไม่เลยกำหนด (Pending)
    const pendingTask = await createAssignment({
      title: 'ใบงานที่ 2 (รอส่ง)',
      description: 'ยังไม่ถึงกำหนด',
      classroom: 'ป.5',
      dueDate: '2099-12-31',
      maxScore: 10,
      createdBy: 'teacher',
      targetType: 'all',
    });

    // 3. ชุดงาน 3 ระดับ (ควรนับเป็น 1 งาน ไม่ใช่ 3 งาน)
    const packList = await generate3TierAssignments({
      classroom: 'ป.5',
      subject: 'cs',
      indicatorId: 'w4.2-p5-1',
      topic: 'อัลกอริทึมและผังงาน',
      dueDate: '2099-12-31',
    });
    expect(packList).toHaveLength(3);

    // ตรวจสอบสถานะเริ่มต้นของนักเรียน ป.5 เลขที่ 1 (ยังไม่ส่งสักชิ้น)
    const beforeOverview = getStudentWorkStatusOverview('ป.5', 'p5_student_1', 1, 'เด็กชายขยัน เรียนดี');
    // ต้องมีทั้งหมด 3 งานหลัก (ใบงานที่ 1 + ใบงานที่ 2 + ชุดงาน 3 ระดับนับเป็น 1)
    expect(beforeOverview.tasks).toHaveLength(3);
    expect(beforeOverview.overdueCount).toBe(1);
    expect(beforeOverview.pendingCount).toBe(2);
    expect(beforeOverview.missingTasks).toHaveLength(3);

    // นักเรียนส่งใบงานที่ 2
    const sub2 = await submitWork({
      assignmentId: pendingTask.id,
      studentId: 'p5_student_1',
      studentName: 'เด็กชายขยัน เรียนดี',
      classroom: 'ป.5',
      studentNo: 1,
      contentUrl: 'https://scratch.mit.edu/projects/12345',
      comment: 'ส่งงานใบงานที่ 2 ครับผม',
    });

    const afterSubmitOverview = getStudentWorkStatusOverview('ป.5', 'p5_student_1', 1, 'เด็กชายขยัน เรียนดี');
    expect(afterSubmitOverview.overdueCount).toBe(1);
    expect(afterSubmitOverview.pendingCount).toBe(1);
    expect(afterSubmitOverview.waitingReviewCount).toBe(1);
    expect(afterSubmitOverview.missingTasks).toHaveLength(2);

    // ครูตรวจให้คะแนนใบงานที่ 2
    await reviewSubmission(sub2.id, { kScore: 9 }, 'ทำได้ดีมากครับ');
    const afterGradeOverview = getStudentWorkStatusOverview('ป.5', 'p5_student_1', 1, 'เด็กชายขยัน เรียนดี');
    expect(afterGradeOverview.waitingReviewCount).toBe(0);
    expect(afterGradeOverview.gradedCount).toBe(1);
  });
});

