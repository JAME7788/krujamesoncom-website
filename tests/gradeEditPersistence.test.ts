// บั๊กที่ครูเจอจริง: "กรอกข้อมูลแล้วกด F5 ข้อมูลบางอย่างหายไป" และ "ขึ้นเลขค้าง 15"
//
// ต้นเหตุ: ตอนรวมคะแนนจาก Firebase ใช้ Math.max(remote, incoming) กับทุกช่อง
// คะแนนจึงขึ้นได้อย่างเดียว ลดไม่ได้ — ครูแก้ 15 เป็น 12 ระบบเอา 15 กลับมาทุกครั้ง
// และคะแนนสอบใช้ remote ?? incoming ทำให้แก้คะแนนสอบที่เคยกรอกแล้วไม่ได้เลย
//
// เทสต์ชุดนี้ยึดพฤติกรรมที่ถูกต้อง: ค่าที่ครูกรอกล่าสุดต้องชนะเสมอ
import { beforeEach, describe, expect, it } from 'vitest';
import { mergeIndicatorForTest, mergeStudentGradeForTest } from '../src/services/gradeService';
import type { IndicatorScore, StudentGrade } from '../src/services/gradeService';

class MemoryStorage implements Storage {
  private readonly data = new Map<string, string>();
  get length() { return this.data.size; }
  clear() { this.data.clear(); }
  getItem(key: string) { return this.data.get(key) ?? null; }
  key(index: number) { return [...this.data.keys()][index] ?? null; }
  removeItem(key: string) { this.data.delete(key); }
  setItem(key: string, value: string) { this.data.set(key, String(value)); }
}

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: new MemoryStorage(),
    configurable: true,
  });
});

const score = (patch: Partial<IndicatorScore>): IndicatorScore => ({
  k: 0,
  maxK: 15,
  p: 'พอใช้',
  a: false,
  updatedAt: 1000,
  ...patch,
});

describe('ครูต้องลดคะแนนได้ ไม่ใช่ขึ้นอย่างเดียว', () => {
  it('ลด K ที่ครูกรอกจาก 15 เป็น 12 ต้องได้ 12 ไม่ใช่ 15', () => {
    const remote = score({ teacherK: 15, k: 15, updatedAt: 1000 });
    const incoming = score({ teacherK: 12, k: 12, updatedAt: 2000 });
    const merged = mergeIndicatorForTest(remote, incoming);
    expect(merged.teacherK).toBe(12);
    expect(merged.k).toBe(12);
  });

  it('ลบคะแนน K ที่ครูกรอกออก ต้องหายจริง ไม่ค้างค่าเดิม', () => {
    const remote = score({ teacherK: 15, k: 15, updatedAt: 1000 });
    const incoming = score({ teacherK: 0, k: 0, updatedAt: 2000 });
    expect(mergeIndicatorForTest(remote, incoming).teacherK).toBe(0);
  });

  it('ลดคะแนน P ที่ครูประเมินได้', () => {
    const remote = score({ teacherPScore: 30, updatedAt: 1000 });
    const incoming = score({ teacherPScore: 18, updatedAt: 2000 });
    expect(mergeIndicatorForTest(remote, incoming).teacherPScore).toBe(18);
  });

  it('เปลี่ยน A จากผ่านเป็นไม่ผ่านได้', () => {
    const remote = score({ teacherA: true, updatedAt: 1000 });
    const incoming = score({ teacherA: false, updatedAt: 2000 });
    expect(mergeIndicatorForTest(remote, incoming).teacherA).toBe(false);
  });

  it('ข้อมูลเก่ากว่าต้องไม่ทับของใหม่ที่ครูเพิ่งแก้', () => {
    // เครื่องหนึ่ง sync ช้า ส่งค่าเก่ามาทีหลัง ต้องไม่ย้อนคะแนนที่ครูแก้แล้ว
    const remote = score({ teacherK: 12, updatedAt: 2000 });
    const incoming = score({ teacherK: 15, updatedAt: 1000 });
    expect(mergeIndicatorForTest(remote, incoming).teacherK).toBe(12);
  });

  it('คะแนนอัตโนมัติจากกิจกรรมนักเรียนยังเก็บค่าที่ดีที่สุดไว้', () => {
    // webK มาจากคะแนนควิซที่ดีที่สุด จึงถูกต้องแล้วที่ไม่ลดลง
    const remote = score({ webK: 12, updatedAt: 2000 });
    const incoming = score({ webK: 8, updatedAt: 3000 });
    expect(mergeIndicatorForTest(remote, incoming).webK).toBe(12);
  });

  it('ไม่มีข้อมูลเดิม ต้องใช้ของใหม่ทั้งก้อน', () => {
    const incoming = score({ teacherK: 9 });
    expect(mergeIndicatorForTest(undefined, incoming)).toEqual(incoming);
  });

  it('ครูกรอก K ต่ำกว่าคะแนนเว็บ (webK = 15, teacherK = 8) ต้องได้ 8 ไม่ถูก Math.max กลืนเป็น 15', () => {
    const remote = score({ webK: 15, k: 15, updatedAt: 1000 });
    const incoming = score({ teacherK: 8, updatedAt: 2000 });
    const merged = mergeIndicatorForTest(remote, incoming);
    expect(merged.teacherK).toBe(8);
    expect(merged.k).toBe(8);
  });

  it('ครูประเมิน P ต่ำกว่าคะแนนเว็บ (webPScore = 30, teacherPScore = 18) ต้องได้ 18', () => {
    const remote = score({ webPScore: 30, pScore: 30, updatedAt: 1000 });
    const incoming = score({ teacherPScore: 18, updatedAt: 2000 });
    const merged = mergeIndicatorForTest(remote, incoming);
    expect(merged.teacherPScore).toBe(18);
    expect(merged.pScore).toBe(18);
  });
});

describe('คะแนนสอบและหมายเหตุต้องแก้ได้', () => {
  const grade = (patch: Partial<StudentGrade>): StudentGrade => ({
    studentCode: 's1',
    classroom: 'ป.1',
    studentNo: 1,
    name: 'เด็กชายทดสอบ',
    emoji: '👤',
    indicators: {},
    updatedAt: 1000,
    ...patch,
  });

  it('แก้คะแนนกลางภาคที่เคยกรอกไว้แล้วได้', () => {
    const remote = grade({ midtermExam: 12, updatedAt: 1000 });
    const incoming = grade({ midtermExam: 14, updatedAt: 2000 });
    expect(mergeStudentGradeForTest(remote, incoming).midtermExam).toBe(14);
  });

  it('แก้คะแนนปลายภาคให้ลดลงได้', () => {
    const remote = grade({ finalExam: 15, updatedAt: 1000 });
    const incoming = grade({ finalExam: 10, updatedAt: 2000 });
    expect(mergeStudentGradeForTest(remote, incoming).finalExam).toBe(10);
  });

  it('ค่าที่ยังไม่เคยกรอกต้องไม่ถูกล้างด้วยค่าว่างจากการ sync', () => {
    // sync จากกิจกรรมนักเรียนไม่ได้ส่งคะแนนสอบมา ต้องไม่ไปลบของที่ครูกรอกไว้
    const remote = grade({ midtermExam: 13, updatedAt: 2000 });
    const incoming = grade({ midtermExam: undefined, updatedAt: 3000 });
    expect(mergeStudentGradeForTest(remote, incoming).midtermExam).toBe(13);
  });
});

describe('การลบคะแนนและป้องกันค่า NaN ในสมุดคะแนน', () => {
  it('ครูสามารถลบคะแนนสอบปลายภาคและกลางภาคให้กลับเป็นค่าว่างได้', async () => {
    const { updateFinalExam, updateMidtermExam, loadGrades, initClassroom } = await import('../src/services/gradeService');
    const testClass = 'ม.1';
    initClassroom(testClass);
    const students = loadGrades(testClass);
    expect(students.length).toBeGreaterThan(0);
    const targetCode = students[0].studentCode;

    // กรอกคะแนน
    updateFinalExam(testClass, targetCode, 25);
    updateMidtermExam(testClass, targetCode, 15);
    let current = loadGrades(testClass).find((s) => s.studentCode === targetCode);
    expect(current?.finalExam).toBe(25);
    expect(current?.midtermExam).toBe(15);

    // ลบคะแนนด้วย undefined
    updateFinalExam(testClass, targetCode, undefined);
    updateMidtermExam(testClass, targetCode, undefined);
    current = loadGrades(testClass).find((s) => s.studentCode === targetCode);
    expect(current?.finalExam).toBeUndefined();
    expect(current?.midtermExam).toBeUndefined();
  });

  it('ส่งค่า NaN เข้า updateTeacherKnowledgeScore ต้องไม่ทำให้คะแนนกลายเป็น NaN', async () => {
    const { updateTeacherKnowledgeScore, loadGrades, getIndicators, initClassroom } = await import('../src/services/gradeService');
    const testClass = 'ม.1';
    initClassroom(testClass);
    const students = loadGrades(testClass);
    expect(students.length).toBeGreaterThan(0);
    const targetCode = students[0].studentCode;
    const indId = getIndicators(testClass)[0].id;

    updateTeacherKnowledgeScore(testClass, targetCode, indId, NaN);
    const current = loadGrades(testClass).find((s) => s.studentCode === targetCode);
    const indScore = current?.indicators[indId];
    expect(indScore?.teacherK).toBeUndefined();
    expect(Number.isNaN(indScore?.k)).toBe(false);
  });

  it('loadGrades ต้องเรียงลำดับและปรับชื่อตาม roster ล่าสุดโดยคะแนนเดิมไม่หาย', async () => {
    const { loadGrades, updateFinalExam, initClassroom } = await import('../src/services/gradeService');
    const testClass = 'ม.1';
    initClassroom(testClass);
    const initial = loadGrades(testClass);
    expect(initial.length).toBeGreaterThan(0);
    const firstCode = initial[0].studentCode;

    updateFinalExam(testClass, firstCode, 28);
    const reloaded = loadGrades(testClass);
    expect(reloaded[0].studentCode).toBe(firstCode);
    expect(reloaded[0].finalExam).toBe(28);
    expect(reloaded[0].studentNo).toBe(1);
  });

  it('updateTeacherKnowledgeScore สามารถตั้งคะแนนต่ำกว่า webK ได้ และเมื่อล้างด้วย null จะกลับไปใช้ webK', async () => {
    const { updateTeacherKnowledgeScore, loadGrades, getIndicators, initClassroom, cacheGradesLocally } = await import('../src/services/gradeService');
    const testClass = 'ป.1';
    initClassroom(testClass);
    const students = loadGrades(testClass);
    const targetCode = students[0].studentCode;
    const indId = getIndicators(testClass)[0].id;

    // จำลองว่านักเรียนมีคะแนนจากเว็บ webK = 11.3
    const currentGrades = loadGrades(testClass);
    const student = currentGrades.find((s) => s.studentCode === targetCode)!;
    student.indicators[indId] = {
      k: 11.3,
      webK: 11.3,
      maxK: 15,
      p: 'ปานกลาง',
      a: true,
      updatedAt: 1000,
    };
    cacheGradesLocally(testClass, currentGrades, 'main');

    // ครูกรอก 8 ทับคะแนนเว็บ 11.3
    updateTeacherKnowledgeScore(testClass, targetCode, indId, 8);
    let afterEdit = loadGrades(testClass).find((s) => s.studentCode === targetCode);
    expect(afterEdit?.indicators[indId].teacherK).toBe(8);
    expect(afterEdit?.indicators[indId].k).toBe(8); // ต้องเป็น 8 ไม่ใช่ 11.3!

    // ครูล้างช่องคะแนน (ส่ง null)
    updateTeacherKnowledgeScore(testClass, targetCode, indId, null);
    afterEdit = loadGrades(testClass).find((s) => s.studentCode === targetCode);
    expect(afterEdit?.indicators[indId].teacherK).toBeUndefined();
    expect(afterEdit?.indicators[indId].k).toBe(11.3); // กลับมาใช้ webK 11.3 อย่างถูกต้อง
  });
});
