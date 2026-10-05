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
  submitWork,
  reviewSubmission,
  loadAssignments,
  loadSubmissions,
  normalizeHomeworkUrl,
  isValidSubmissionUrl,
  validateSubmissionContent,
  type Assignment,
} from '../src/services/homeworkService';

describe('ระบบรับงานผ่านลิงก์และตรวจงานด้วยรูบริก (Link & Rubric Verification)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('1. ฟังก์ชันจัดรูปแบบ URL (normalizeHomeworkUrl)', () => {
    it('เติม https:// ให้อัตโนมัติเมื่อผู้ใช้ไม่ได้พิมพ์โปรโตคอล', () => {
      expect(normalizeHomeworkUrl('canva.com/design/DAF123')).toBe('https://canva.com/design/DAF123');
      expect(normalizeHomeworkUrl('scratch.mit.edu/projects/987654')).toBe('https://scratch.mit.edu/projects/987654');
      expect(normalizeHomeworkUrl('  drive.google.com/drive/folders/abc  ')).toBe('https://drive.google.com/drive/folders/abc');
    });

    it('คงค่า URL เดิมไว้หากมี https:// หรือ http:// อยู่แล้ว', () => {
      expect(normalizeHomeworkUrl('https://canva.com/design/DAF123')).toBe('https://canva.com/design/DAF123');
      expect(normalizeHomeworkUrl('http://myschool.ac.th/work')).toBe('http://myschool.ac.th/work');
    });

    it('คืนค่าสตริงว่างเมื่อไม่มีลิงก์หรือเป็นช่องว่าง', () => {
      expect(normalizeHomeworkUrl('')).toBe('');
      expect(normalizeHomeworkUrl('   ')).toBe('');
      expect(normalizeHomeworkUrl(undefined)).toBe('');
    });
  });

  describe('2. การส่งงานผ่านลิงก์ (Link Submission & Design Thinking)', () => {
    it('ส่งงานผ่านลิงก์ Canva และจัดรูปแบบ URL ให้อัตโนมัติ', async () => {
      const assignment = await createAssignment({
        title: 'โปสเตอร์แนะนำตนเองด้วย Canva',
        description: 'ออกแบบโปสเตอร์ใน Canva แล้วส่งลิงก์',
        classroom: 'ป.2',
        dueDate: '2026-10-31',
        maxScore: 10,
        knowledgeMaxScore: 5,
        practiceMaxScore: 5,
        createdBy: 'teacher',
        targetType: 'all',
      });

      const submission = await submitWork({
        assignmentId: assignment.id,
        studentId: 'p2_01_somchai',
        studentName: 'เด็กชายสมชาย สายลม',
        classroom: 'ป.2',
        studentNo: 1,
        contentUrl: 'canva.com/design/DAFabc123/view',
        comment: 'ส่งงานโปสเตอร์ครับครู',
      });

      expect(submission.id).toBeDefined();
      expect(submission.contentUrl).toBe('https://canva.com/design/DAFabc123/view');
      expect(submission.score).toBeUndefined(); // ยังไม่ได้ตรวจ

      const saved = loadSubmissions().find(s => s.id === submission.id);
      expect(saved).toBeDefined();
      expect(saved?.contentUrl).toBe('https://canva.com/design/DAFabc123/view');
    });

    it('ส่งโครงงานกระบวนการคิดเชิงออกแบบพร้อมลิงก์ Prototype', async () => {
      const dtTask = await createAssignment({
        title: 'โครงงานต้นแบบเกม Scratch (ว 4.1)',
        description: 'สร้างเกมและบันทึกกระบวนการคิด 4 ขั้นตอน',
        classroom: 'ป.5',
        dueDate: '2026-11-15',
        maxScore: 20,
        knowledgeMaxScore: 10,
        practiceMaxScore: 10,
        createdBy: 'teacher',
        targetType: 'all',
        isDesignThinking: true,
      });

      const submission = await submitWork({
        assignmentId: dtTask.id,
        studentId: 'p5_02_somying',
        studentName: 'เด็กหญิงสมหญิง ยิ้มหวาน',
        classroom: 'ป.5',
        studentNo: 2,
        comment: 'โครงงานเกมจับขยะ',
        designThinkingSteps: {
          define: 'เพื่อนๆ ทิ้งขยะไม่ถูกถังในโรงเรียน',
          ideate: 'ทำเกมจำลองการแยกประเภทขยะ',
          prototypeUrl: 'scratch.mit.edu/projects/123456789',
          testFeedback: 'เพื่อนลองเล่นแล้วบอกว่าแยกขยะได้เข้าใจง่ายขึ้น',
        },
      });

      expect(submission.designThinkingSteps?.prototypeUrl).toBe('https://scratch.mit.edu/projects/123456789');
    });

    it('ป้องกันไม่ให้นักเรียนส่งงานในชิ้นที่ไม่ได้มอบหมายให้ตนเอง', async () => {
      const privateTask = await createAssignment({
        title: 'งานซ่อมเสริมเฉพาะบุคคล',
        description: 'สำหรับเลขที่ 10 เท่านั้น',
        classroom: 'ป.3',
        dueDate: '2026-10-31',
        maxScore: 10,
        createdBy: 'teacher',
        targetType: 'specific_students',
        targetStudentIds: ['10'],
      });

      await expect(
        submitWork({
          assignmentId: privateTask.id,
          studentId: 'p3_01_somchai',
          studentName: 'เด็กชายสมชาย',
          classroom: 'ป.3',
          studentNo: 1, // เลขที่ 1 ไม่ใช่เป้าหมาย
          comment: 'พยายามส่งงาน',
        }),
      ).rejects.toThrow('งานนี้ไม่ได้มอบหมายให้นักเรียนคนนี้');
    });
  });

  describe('3. การตรวจงานและการให้คะแนนรูบริก (Rubric Scoring & Clamping)', () => {
    it('ตรวจงานและตัดคะแนน K และ P ได้ถูกต้องตามเกณฑ์', async () => {
      const task = await createAssignment({
        title: 'การเขียนอัลกอริทึมอย่างง่าย',
        description: 'บอกขั้นตอนการทำไข่เจียว',
        classroom: 'ป.1',
        dueDate: '2026-10-31',
        maxScore: 10,
        knowledgeMaxScore: 5,
        practiceMaxScore: 5,
        createdBy: 'teacher',
        targetType: 'all',
      });

      const submission = await submitWork({
        assignmentId: task.id,
        studentId: 'p1_01_sompong',
        studentName: 'เด็กชายสมพงษ์ รักเรียน',
        classroom: 'ป.1',
        studentNo: 1,
        contentUrl: 'https://canva.com/design/egg-recipe',
        comment: 'ส่งงานอัลกอริทึมครับ',
      });

      // คุณครูตรวจงาน: K=4, P=5 พร้อมคำติชม
      await reviewSubmission(
        submission.id,
        { kScore: 4, pScore: 5 },
        'ขั้นตอนเรียงได้ดีมาก มีภาพประกอบชัดเจน',
      );

      const reviewed = loadSubmissions().find(s => s.id === submission.id);
      expect(reviewed).toBeDefined();
      expect(reviewed?.kScore).toBe(4);
      expect(reviewed?.pScore).toBe(5);
      expect(reviewed?.score).toBe(9); // 4 + 5 = 9
      expect(reviewed?.feedback).toBe('ขั้นตอนเรียงได้ดีมาก มีภาพประกอบชัดเจน');
      expect(reviewed?.reviewedAt).toBeDefined();
    });

    it('ควบคุมคะแนนไม่ให้เกินคะแนนเต็ม (Score Clamping Upper Bound)', async () => {
      const task = await createAssignment({
        title: 'ทดสอบการตรวจเกินคะแนนเต็ม',
        description: 'ทดสอบความปลอดภัย',
        classroom: 'ป.1',
        dueDate: '2026-10-31',
        maxScore: 10,
        knowledgeMaxScore: 5,
        practiceMaxScore: 5,
        createdBy: 'teacher',
        targetType: 'all',
      });

      const sub = await submitWork({
        assignmentId: task.id,
        studentId: 'p1_01_test',
        studentName: 'ทดสอบ',
        classroom: 'ป.1',
        studentNo: 1,
        comment: 'งานทดสอบ',
      });

      // ครูเผลอกรอก 99 คะแนน
      await reviewSubmission(sub.id, { kScore: 99, pScore: 99 }, 'ยอดเยี่ยม');

      const reviewed = loadSubmissions().find(s => s.id === sub.id);
      expect(reviewed?.kScore).toBe(5); // ถูกจำกัดที่ max 5
      expect(reviewed?.pScore).toBe(5); // ถูกจำกัดที่ max 5
      expect(reviewed?.score).toBe(10);
    });

    it('ควบคุมคะแนนไม่ให้ติดลบ (Score Clamping Lower Bound)', async () => {
      const task = await createAssignment({
        title: 'ทดสอบคะแนนติดลบ',
        description: 'ทดสอบความปลอดภัย',
        classroom: 'ป.1',
        dueDate: '2026-10-31',
        maxScore: 10,
        knowledgeMaxScore: 5,
        practiceMaxScore: 5,
        createdBy: 'teacher',
        targetType: 'all',
      });

      const sub = await submitWork({
        assignmentId: task.id,
        studentId: 'p1_01_neg',
        studentName: 'ทดสอบติดลบ',
        classroom: 'ป.1',
        studentNo: 1,
        comment: 'งานทดสอบติดลบ',
      });

      // ครูเผลอกรอกคะแนนติดลบ
      await reviewSubmission(sub.id, { kScore: -5, pScore: -10 }, 'ปรับปรุง');

      const reviewed = loadSubmissions().find(s => s.id === sub.id);
      expect(reviewed?.kScore).toBe(0);
      expect(reviewed?.pScore).toBe(0);
      expect(reviewed?.score).toBe(0);
    });

    it('ป้องกันไม่ให้นักเรียนแก้งานทับหลังจากที่ครูตรวจแล้ว', async () => {
      const task = await createAssignment({
        title: 'ใบงานที่ต้องล็อกหลังตรวจ',
        description: 'ทดสอบล็อกงาน',
        classroom: 'ป.1',
        dueDate: '2026-10-31',
        maxScore: 10,
        knowledgeMaxScore: 5,
        practiceMaxScore: 5,
        createdBy: 'teacher',
        targetType: 'all',
      });

      const sub = await submitWork({
        assignmentId: task.id,
        studentId: 'p1_01_lock',
        studentName: 'ทดสอบล็อก',
        classroom: 'ป.1',
        studentNo: 1,
        comment: 'งานรอบแรก',
      });

      await reviewSubmission(sub.id, { kScore: 5, pScore: 5 }, 'ตรวจแล้ว');

      // เด็กพยายามส่งงานทับ
      await expect(
        submitWork({
          assignmentId: task.id,
          studentId: 'p1_01_lock',
          studentName: 'ทดสอบล็อก',
          classroom: 'ป.1',
          studentNo: 1,
          comment: 'พยายามส่งแก้ทับ',
        }),
      ).rejects.toThrow('ครูตรวจงานนี้แล้ว กรุณาติดต่อครูก่อนแก้ไข');
    });
  });

  describe('4. การตรวจสอบความถูกต้องของลิงก์และเนื้อหาก่อนส่ง (Validation Guard)', () => {
    it('isValidSubmissionUrl ตรวจจับและปฏิเสธ URL ที่ไม่ถูกต้องอย่างเข้มงวด', () => {
      // ตัวอย่างคำมั่ว / คำโดดๆ ที่ไม่ใช่เว็บจริง
      expect(isValidSubmissionUrl('asdasd')).toBe(false);
      expect(isValidSubmissionUrl('http://asdasd')).toBe(false);
      expect(isValidSubmissionUrl('https://asdasd')).toBe(false);
      expect(isValidSubmissionUrl('test')).toBe(false);
      expect(isValidSubmissionUrl('localhost')).toBe(false);
      expect(isValidSubmissionUrl('')).toBe(false);
      expect(isValidSubmissionUrl(undefined)).toBe(false);
      expect(isValidSubmissionUrl('12345')).toBe(false);

      // URL เว็บไซต์จริง
      expect(isValidSubmissionUrl('canva.com/design/DAF123')).toBe(true);
      expect(isValidSubmissionUrl('https://scratch.mit.edu/projects/987654')).toBe(true);
      expect(isValidSubmissionUrl('drive.google.com/drive/folders/abc')).toBe(true);
      expect(isValidSubmissionUrl('http://myschool.ac.th/work')).toBe(true);
    });

    it('validateSubmissionContent ปฏิเสธเมื่อนักเรียนพิมพ์คำมั่ว asdasd', () => {
      // กรณีพิมพ์ asdasd ในช่องลิงก์ และ asdasd ในช่องคำตอบ (ตามภาพที่ผู้ใช้พบ)
      const res1 = validateSubmissionContent({
        contentUrl: 'asdasd',
        comment: 'asdasd',
      });
      expect(res1.valid).toBe(false);
      expect(res1.error).toContain('ลิงก์ผลงานไม่ถูกต้อง');

      // กรณีไม่ใส่ลิงก์ แต่พิมพ์คำตอบเป็นสแปมแป้นพิมพ์
      const res2 = validateSubmissionContent({
        comment: 'asdasdasd',
      });
      expect(res2.valid).toBe(false);
      expect(res2.error).toContain('ข้อความไม่ถูกต้อง');

      // กรณีไม่ใส่ลิงก์ และพิมพ์สั้นเกินไป (< 10 ตัวอักษร)
      const res3 = validateSubmissionContent({
        comment: 'ส่งงาน',
      });
      expect(res3.valid).toBe(false);
      expect(res3.error).toContain('ข้อความสั้นเกินไป');

      // กรณีส่งลิงก์ Canva หรือ Scratch ที่ถูกต้อง
      const res4 = validateSubmissionContent({
        contentUrl: 'canva.com/design/DAFabc/view',
      });
      expect(res4.valid).toBe(true);

      // กรณีตอบคำถามอย่างตั้งใจ (> 10 ตัวอักษร)
      const res5 = validateSubmissionContent({
        comment: 'กลุ่มของผมได้ออกแบบอัลกอริทึมการแปรงฟัน 5 ขั้นตอนครับ',
      });
      expect(res5.valid).toBe(true);
    });

    it('submitWork ปฏิเสธและโยน Exception หากส่ง URL ที่ไม่ใช่เว็บไซต์จริง', async () => {
      const task = await createAssignment({
        title: 'ทดสอบส่ง URL ปลอม',
        description: 'ทดสอบความปลอดภัย',
        classroom: 'ป.1',
        dueDate: '2026-10-31',
        maxScore: 10,
        createdBy: 'teacher',
        targetType: 'all',
      });

      await expect(
        submitWork({
          assignmentId: task.id,
          studentId: 'p1_01_fake',
          studentName: 'เด็กชายทดสอบ',
          classroom: 'ป.1',
          studentNo: 1,
          contentUrl: 'asdasd',
          comment: 'งานส่งครับ',
        }),
      ).rejects.toThrow('ลิงก์ผลงานไม่ถูกต้อง');
    });
  });
});
