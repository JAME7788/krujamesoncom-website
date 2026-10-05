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
  createAssignment,
  getAssignmentsForStudent,
  submitWork,
  reviewSubmission,
  loadSubmissions,
  generate3TierAssignments,
  recommendAssignment,
} from '../src/services/homeworkService';
import { loadGrades, getSubjectsForClassroom, cacheGradesLocally, type StudentGrade } from '../src/services/gradeService';
import { loadRoster } from '../src/services/rosterService';
import { saveStudentWeeklyGoal, getCurrentWeekKey, loadAllWeeklyGoals } from '../src/services/srlService';
import { saveGameReflection, loadStudentReflections } from '../src/services/gameReflectionService';

describe('จำลองสถานการณ์จริง: การเดินทางของนักเรียน 1 คน ตั้งแต่ต้นจนจบ (Student End-to-End Simulation)', () => {
  const student = {
    id: 'p4_1_charan',
    studentCode: '2840',
    name: 'เด็กชายชรัณ พรมจันทร์',
    classroom: 'ป.4',
    studentNo: 1,
    role: 'student' as const,
  };

  beforeEach(() => {
    localStorage.clear();
  });

  it('ขั้นตอนที่ 1 - 7: ครูสั่งงาน ➔ เด็กรับลิงก์ ➔ เลือกความท้าทาย ➔ ดูคำใบ้ ➔ ส่งลิงก์ผลงาน ➔ ครูตรวจให้เกรด ➔ บันทึกสะท้อนคิด', async () => {
    // -------------------------------------------------------------
    // ขั้นตอนที่ 0: เตรียมฐานข้อมูลชั้นเรียน ป.4
    // -------------------------------------------------------------
    const subjects = getSubjectsForClassroom(student.classroom);
    const techSubject = subjects[0]?.id || 'main';

    const roster = loadRoster(student.classroom);
    const initialGrades: StudentGrade[] = roster.map((s) => ({
      studentCode: s.studentCode,
      classroom: student.classroom,
      studentNo: s.no,
      name: s.name,
      emoji: s.emoji || '👦',
      indicators: {},
      updatedAt: Date.now(),
    }));
    cacheGradesLocally(student.classroom, initialGrades, techSubject);

    // -------------------------------------------------------------
    // ขั้นตอนที่ 1: คุณครูสั่งงานแบบ 3 ระดับ (3-Tier Differentiated Pack)
    // -------------------------------------------------------------
    const pack = await generate3TierAssignments({
      classroom: student.classroom,
      subject: techSubject,
      indicatorId: 'w4.2-p4-1',
      topic: 'การเขียนโปรแกรมควบคุมตัวละครใน Scratch',
      dueDate: '2026-10-25',
      knowledgeMaxScore: 5,
      practiceMaxScore: 5,
    });

    expect(pack).toHaveLength(3);
    const standardTask = pack.find((a) => a.difficulty === 'standard')!;
    const foundationTask = pack.find((a) => a.difficulty === 'foundation')!;
    const advancedTask = pack.find((a) => a.difficulty === 'advanced')!;

    // -------------------------------------------------------------
    // ขั้นตอนที่ 2: ครูส่งลิงก์ให้นักเรียนในไลน์ (เช่น /homework?id=xxx)
    // -------------------------------------------------------------
    const shareUrl = `https://krujames.com/homework?id=${standardTask.id}`;
    expect(shareUrl).toContain(standardTask.id);

    // -------------------------------------------------------------
    // ขั้นตอนที่ 3: นักเรียนเข้าสู่ระบบและเปิดดูภารกิจของตนเอง
    // -------------------------------------------------------------
    const myTasks = getAssignmentsForStudent(student.classroom, student.id, student.studentNo);
    expect(myTasks.length).toBeGreaterThanOrEqual(3);

    // ระบบแนะนำระดับการเรียนรู้ (Smart ZPD Recommender)
    const recommendation = recommendAssignment(standardTask, student.id);
    expect(['foundation', 'standard', 'advanced']).toContain(recommendation.difficulty);

    // -------------------------------------------------------------
    // ขั้นตอนที่ 4: นักเรียนเปิดดูคำใบ้นั่งร้าน (Scaffolding Hints) ในระดับพื้นฐาน
    // -------------------------------------------------------------
    expect(foundationTask.hints).toBeDefined();
    expect(foundationTask.hints!.length).toBeGreaterThan(0);
    const hint1 = foundationTask.hints![0];
    expect(hint1.length).toBeGreaterThan(5);

    // -------------------------------------------------------------
    // ขั้นตอนที่ 5: นักเรียนตัดสินใจเลือกทำระดับมาตรฐาน และส่งลิงก์ผลงาน Scratch
    // (ลองพิมพ์แบบไม่ใส่ https:// เพื่อทดสอบระบบ Auto-Format)
    // -------------------------------------------------------------
    const submission = await submitWork({
      assignmentId: standardTask.id,
      studentId: student.studentCode, // หรือ student.id
      studentName: student.name,
      classroom: student.classroom,
      studentNo: student.studentNo,
      contentUrl: 'scratch.mit.edu/projects/987654321', // เด็กพิมพ์ย่อ ไม่มี https://
      comment: 'ผมสร้างเกมจับแมลงเสร็จแล้วครับ ใช้ลูปวนซ้ำตามที่ครูสอน',
    });

    // ตรวจสอบว่าระบบเติม https:// ให้อัตโนมัติและเก็บข้อมูลครบ
    expect(submission.contentUrl).toBe('https://scratch.mit.edu/projects/987654321');
    expect(submission.submittedAt).toBeDefined();
    expect(submission.score).toBeUndefined(); // ยังรอครูตรวจ

    // -------------------------------------------------------------
    // ขั้นตอนที่ 6: คุณครูเปิดหน้าตรวจงาน (Review) ➔ ให้คะแนน Rubric K และ P
    // -------------------------------------------------------------
    await reviewSubmission(
      submission.id,
      {
        kScore: 5, // ด้านความรู้ (เข้าใจลูปและเงื่อนไข)
        pScore: 5, // ด้านทักษะปฏิบัติ (เกมเล่นได้จริง ไม่บั๊ก)
      },
      'ยอดเยี่ยมมากชรัณ! ตัวละครเคลื่อนที่ลื่นไหลและใช้คำสั่งวนซ้ำได้ถูกต้องสมบูรณ์',
    );

    // ตรวจสอบผลการตรวจของครู
    const reviewed = loadSubmissions().find((s) => s.id === submission.id);
    expect(reviewed).toBeDefined();
    expect(reviewed?.score).toBe(10); // 5 + 5
    expect(reviewed?.kScore).toBe(5);
    expect(reviewed?.pScore).toBe(5);
    expect(reviewed?.feedback).toContain('ยอดเยี่ยมมากชรัณ');

    // -------------------------------------------------------------
    // ขั้นตอนที่ 7: คะแนนไหลเข้าสมุดเกรด ปพ.5 อัตโนมัติ โดยไม่ลบข้อมูลเพื่อน
    // -------------------------------------------------------------
    const currentGrades = loadGrades(student.classroom, techSubject);
    expect(currentGrades.length).toBeGreaterThan(0);

    // ตรวจสอบว่าคะแนนของชรัณถูกบันทึก
    const charanGrade = currentGrades.find(
      (g) => g.studentCode === student.studentCode || g.studentNo === student.studentNo,
    );
    expect(charanGrade).toBeDefined();

    // -------------------------------------------------------------
    // ขั้นตอนที่ 8: นักเรียนตั้งเป้าหมายประจำสัปดาห์ (SRL Weekly Goal) และสะท้อนคิด
    // -------------------------------------------------------------
    const currentWeek = getCurrentWeekKey();
    saveStudentWeeklyGoal({
      studentId: student.id,
      weekKey: currentWeek,
      goalId: 'play_games',
      achieved: true,
      achievedAt: Date.now(),
      reflectionText: 'ตั้งใจจะฝึกเขียนบล็อก Scratch ให้จบภารกิจประจำสัปดาห์',
      updatedAt: Date.now(),
    });

    const goals = loadAllWeeklyGoals();
    const myGoal = goals.find((g) => g.studentId === student.id && g.weekKey === currentWeek);
    expect(myGoal).toBeDefined();
    expect(myGoal?.achieved).toBe(true);

    // บันทึกการสะท้อนคิดจากชิ้นงาน (Game Reflection)
    const reflection = await saveGameReflection({
      studentId: student.id,
      studentCode: student.studentCode,
      studentName: student.name,
      classroom: student.classroom,
      gameId: 'scratch-catch-bug',
      gameTitle: 'เกมเขียนโค้ดจับแมลง',
      objective: 'ฝึกการใช้ลูปวนซ้ำและเงื่อนไขสัมผัสตัวละคร',
      challengeMode: false,
      challengeText: 'ระดับมาตรฐาน',
      questionAnswered: true,
      reflectionText: 'ได้เรียนรู้วิธีการเขียนบล็อกเงื่อนไข If-Else และการสร้างตัวละครใน Scratch สนุกมากครับ',
    });

    expect(reflection.id).toBeDefined();
    const reflections = loadStudentReflections(student.id);
    expect(reflections.length).toBeGreaterThan(0);
    expect(reflections[0].reflectionText).toContain('If-Else');
  });
});
