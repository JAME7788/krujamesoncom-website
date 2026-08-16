// บั๊กที่ครูเจอจริง: "กรอกข้อมูลแล้วกด F5 ข้อมูลบางอย่างหายไป" และ "ขึ้นเลขค้าง 15"
//
// ต้นเหตุ: ตอนรวมคะแนนจาก Firebase ใช้ Math.max(remote, incoming) กับทุกช่อง
// คะแนนจึงขึ้นได้อย่างเดียว ลดไม่ได้ — ครูแก้ 15 เป็น 12 ระบบเอา 15 กลับมาทุกครั้ง
// และคะแนนสอบใช้ remote ?? incoming ทำให้แก้คะแนนสอบที่เคยกรอกแล้วไม่ได้เลย
//
// เทสต์ชุดนี้ยึดพฤติกรรมที่ถูกต้อง: ค่าที่ครูกรอกล่าสุดต้องชนะเสมอ
import { describe, expect, it } from 'vitest';
import { mergeIndicatorForTest, mergeStudentGradeForTest } from '../src/services/gradeService';
import type { IndicatorScore, StudentGrade } from '../src/services/gradeService';

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
