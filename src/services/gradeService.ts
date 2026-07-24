// ระบบเก็บคะแนน K/P/A ต่อตัวชี้วัด — เลียนแบบไฟล์ Excel "คมด.เก็บคะแนนV.2 2568"
//
// โครงสร้าง:
//   - แต่ละห้อง (ป.1, ป.2, ...) มีตัวชี้วัด ว 4.2 ป.1/1, ป.1/2, ... (สำหรับ cs)
//                                   ว 4.1 ม.1/1, ม.1/2, ...     (สำหรับ dt)
//   - ต่อตัวชี้วัดเก็บ K(คะแนน 0-15), P(พอใช้/ปานกลาง/ดี), A(boolean)
//   - คำนวณคะแนนรวม + เกรด อัตโนมัติ

import { db } from './firebase';
import { doc, setDoc, getDoc, runTransaction } from 'firebase/firestore';
import { allClassrooms2569 } from '../data/students2569';

const cleanForFirestore = <T,>(value: T): T => (
  JSON.parse(JSON.stringify(value)) as T
);

export type Skill = 'พอใช้' | 'ปานกลาง' | 'ดี';
export type PracticeLevel = 'ดีมาก' | 'ปานกลาง' | 'พอใช้' | 'ไม่ผ่าน';
export const PRACTICE_MAX_SCORE = 30;
export const ATTITUDE_MAX_SCORE = 10;

export const getPracticeLevel = (score: number): PracticeLevel => {
  if (score >= 30) return 'ดีมาก';
  if (score >= 20) return 'ปานกลาง';
  if (score >= 15) return 'พอใช้';
  return 'ไม่ผ่าน';
};

const skillFromPracticeScore = (score: number): Skill => {
  if (score >= 30) return 'ดี';
  if (score >= 20) return 'ปานกลาง';
  return 'พอใช้';
};
export const ACADEMIC_YEAR = '2569';
export const COURSE_TEACHER_NAME = 'นายอนันตชัย เพ็ชรรี่';

export interface IndicatorScore {
  k: number;        // คะแนนความรู้ 0-15 (จากการทำควิซ ครูแก้ได้)
  maxK: number;     // คะแนนเต็ม (default 15)
  webK?: number;    // คะแนนอัตโนมัติจากควิซ/กิจกรรมในเว็บ
  manualK?: number; // คะแนนที่คำนวณจากการบ้าน/งานเพิ่มเติม
  teacherK?: number;// คะแนน K ที่ครูใส่ตรง
  pScore?: number;        // คะแนนปฏิบัติรวมที่ใช้จริง 0-30
  webPScore?: number;     // คะแนนปฏิบัติอัตโนมัติจากการใช้เว็บ
  manualPScore?: number;  // คะแนนปฏิบัติจากการบ้าน/งานเพิ่มเติม
  teacherPScore?: number; // ผลรวมรูบริกที่ครูประเมิน
  practiceCriteria?: number[]; // รูบริก 10 รายการ รายการละ 0-3
  practiceLevel?: PracticeLevel;
  practicePassed?: boolean;
  p: Skill;         // ทักษะ
  a: boolean;       // จิตพิสัย/คุณลักษณะ
  webAScore?: number;     // A อัตโนมัติจากการเข้าเรียน ความสม่ำเสมอ และความพยายาม
  aScore?: number;        // คะแนน A ที่ใช้จริง 0-10
  teacherA?: boolean;     // ครูกำหนดผล A โดยตรง
  aEvidence?: {
    inClassDays: number;
    activeDays: number;
    practiceCount: number;
    quizAttempts: number;
    completedUnits: number;
  };
  pAssessed?: boolean;
  aAssessed?: boolean;
  note?: string;    // บันทึกเพิ่ม
  updatedAt: number;
}

export interface StudentGrade {
  studentCode: string;       // รหัสประจำตัว
  classroom: string;         // 'ป.1'
  studentNo: number;         // ลำดับในห้อง
  name: string;
  emoji: string;
  indicators: Record<string, IndicatorScore>;  // key = indicator id เช่น 'cs_p1_1'
  midtermExam?: number;      // คะแนนสอบกลางภาค (เต็ม 15)
  finalExam?: number;        // คะแนนสอบปลายภาค (เต็ม 15)
  comment?: string;
  updatedAt: number;
}

/** คะแนนเต็มของสอบ */
export const examMaxScores = (classroom: string): { midterm: number; final: number } => {
  if (classroom.startsWith('ป.') || classroom.startsWith('ม.')) {
    return { midterm: 15, final: 15 };
  }
  return { midterm: 0, final: 0 };
};

export const getGradingPeriodLabel = (classroom: string): string => {
  if (classroom.startsWith('ป.')) return `ปีการศึกษา ${ACADEMIC_YEAR} (ประถม: 1 ปี 1 เกรด)`;
  if (classroom.startsWith('ม.')) return `ภาคเรียนที่ 1 ปีการศึกษา ${ACADEMIC_YEAR} (มัธยม: 1 เทอม 1 เกรด)`;
  return `ปีการศึกษา ${ACADEMIC_YEAR}`;
};

export const getExamPolicyLabel = (classroom: string): string => {
  const exam = examMaxScores(classroom);
  if (classroom.startsWith('ป.')) {
    return `ประถมออก 1 ปี 1 เกรด: กลางภาค ${exam.midterm} คะแนน + ปลายภาค ${exam.final} คะแนน`;
  }
  if (classroom.startsWith('ม.')) {
    return `มัธยมออก 1 เทอม 1 เกรด: กลางภาค ${exam.midterm} คะแนน + ปลายภาค ${exam.final} คะแนน`;
  }
  return '';
};

const KEY_PREFIX = 'krujames_grades_v1_';
const storageKey = (classroom: string, subject: Subject = 'main') => {
  // สำหรับ ม.X แยก storage key ตามวิชา
  if (classroom.startsWith('ม.') && subject !== 'main') {
    return `${KEY_PREFIX}${classroom}_${subject}`;
  }
  return `${KEY_PREFIX}${classroom}`;
};

// ---------- Indicators per classroom ----------

export interface IndicatorDef {
  id: string;
  code: string;       // 'ว 4.2 ป.1/1'
  title: string;      // ชื่อตัวชี้วัด
  maxScore: number;   // คะแนนเต็ม
}

// ตัวชี้วัด ว 4.2 (วิทยาการคำนวณ) ป.1-ป.6
const csIndicators: Record<string, IndicatorDef[]> = {
  'ป.1': [
    { id: 'cs_p1_1', code: 'ว 4.2 ป.1/1', title: 'แก้ปัญหาอย่างง่ายโดยใช้การลองผิดลองถูก การเปรียบเทียบ', maxScore: 15 },
    { id: 'cs_p1_2', code: 'ว 4.2 ป.1/2', title: 'แสดงลำดับขั้นตอนการทำงานหรือการแก้ปัญหาอย่างง่าย โดยใช้ภาพ สัญลักษณ์ หรือข้อความ', maxScore: 15 },
    { id: 'cs_p1_3', code: 'ว 4.2 ป.1/3', title: 'เขียนโปรแกรมอย่างง่ายโดยใช้ซอฟต์แวร์หรือสื่อ', maxScore: 15 },
    { id: 'cs_p1_4', code: 'ว 4.2 ป.1/4', title: 'ใช้เทคโนโลยีในการสร้าง จัดเก็บ เรียกใช้ข้อมูลตามวัตถุประสงค์', maxScore: 15 },
    { id: 'cs_p1_5', code: 'ว 4.2 ป.1/5', title: 'ใช้เทคโนโลยีสารสนเทศอย่างปลอดภัย ปฏิบัติตามข้อตกลงในการใช้งาน', maxScore: 15 },
  ],
  'ป.2': [
    { id: 'cs_p2_1', code: 'ว 4.2 ป.2/1', title: 'แสดงลำดับขั้นตอนการทำงานหรือการแก้ปัญหาอย่างง่าย โดยใช้ภาพ สัญลักษณ์ หรือข้อความ', maxScore: 15 },
    { id: 'cs_p2_2', code: 'ว 4.2 ป.2/2', title: 'เขียนโปรแกรมอย่างง่าย โดยใช้ซอฟต์แวร์หรือสื่อ และตรวจหาข้อผิดพลาดของโปรแกรม', maxScore: 15 },
    { id: 'cs_p2_3', code: 'ว 4.2 ป.2/3', title: 'ใช้เทคโนโลยีในการสร้าง จัดหมวดหมู่ ค้นหา จัดเก็บ เรียกใช้ข้อมูล', maxScore: 15 },
    { id: 'cs_p2_4', code: 'ว 4.2 ป.2/4', title: 'ใช้เทคโนโลยีสารสนเทศอย่างปลอดภัย ปฏิบัติตามข้อตกลงในการใช้งาน', maxScore: 15 },
  ],
  'ป.3': [
    { id: 'cs_p3_1', code: 'ว 4.2 ป.3/1', title: 'แสดงอัลกอริทึมในการทำงานหรือการแก้ปัญหาอย่างง่าย โดยใช้ภาพ สัญลักษณ์ หรือข้อความ', maxScore: 15 },
    { id: 'cs_p3_2', code: 'ว 4.2 ป.3/2', title: 'เขียนโปรแกรมอย่างง่าย โดยใช้ซอฟต์แวร์หรือสื่อ และตรวจหาข้อผิดพลาดของโปรแกรม', maxScore: 15 },
    { id: 'cs_p3_3', code: 'ว 4.2 ป.3/3', title: 'ใช้อินเทอร์เน็ตค้นหาความรู้', maxScore: 15 },
    { id: 'cs_p3_4', code: 'ว 4.2 ป.3/4', title: 'รวบรวม ประมวลผล และนำเสนอข้อมูลโดยใช้ซอฟต์แวร์ตามวัตถุประสงค์', maxScore: 15 },
    { id: 'cs_p3_5', code: 'ว 4.2 ป.3/5', title: 'ใช้เทคโนโลยีสารสนเทศอย่างปลอดภัย ปฏิบัติตามข้อตกลงในการใช้งาน', maxScore: 15 },
  ],
  'ป.4': [
    { id: 'cs_p4_1', code: 'ว 4.2 ป.4/1', title: 'ใช้เหตุผลเชิงตรรกะในการแก้ปัญหา การอธิบายการทำงาน การคาดการณ์ผลลัพธ์ จากปัญหาอย่างง่าย', maxScore: 15 },
    { id: 'cs_p4_2', code: 'ว 4.2 ป.4/2', title: 'ออกแบบและเขียนโปรแกรมอย่างง่าย โดยใช้ซอฟต์แวร์หรือสื่อ และตรวจหาข้อผิดพลาดและแก้ไข', maxScore: 15 },
    { id: 'cs_p4_3', code: 'ว 4.2 ป.4/3', title: 'ใช้อินเทอร์เน็ตค้นหาความรู้และประเมินความน่าเชื่อถือของข้อมูล', maxScore: 15 },
    { id: 'cs_p4_4', code: 'ว 4.2 ป.4/4', title: 'รวบรวม ประเมิน นำเสนอข้อมูลและสารสนเทศ โดยใช้ซอฟต์แวร์ที่หลากหลาย เพื่อแก้ปัญหาในชีวิตประจำวัน', maxScore: 15 },
    { id: 'cs_p4_5', code: 'ว 4.2 ป.4/5', title: 'ใช้เทคโนโลยีสารสนเทศอย่างปลอดภัย เข้าใจสิทธิและหน้าที่ของตน เคารพในสิทธิของผู้อื่น แจ้งผู้เกี่ยวข้องเมื่อพบข้อมูลหรือบุคคลที่ไม่เหมาะสม', maxScore: 15 },
  ],
  'ป.5': [
    { id: 'cs_p5_1', code: 'ว 4.2 ป.5/1', title: 'ใช้เหตุผลเชิงตรรกะในการแก้ปัญหา การอธิบายการทำงาน การคาดการณ์ผลลัพธ์ จากปัญหาอย่างง่าย', maxScore: 15 },
    { id: 'cs_p5_2', code: 'ว 4.2 ป.5/2', title: 'ออกแบบและเขียนโปรแกรมที่มีการใช้เหตุผลเชิงตรรกะอย่างง่าย ตรวจหาข้อผิดพลาดและแก้ไข', maxScore: 15 },
    { id: 'cs_p5_3', code: 'ว 4.2 ป.5/3', title: 'ใช้อินเทอร์เน็ตค้นหาข้อมูล ติดต่อสื่อสารและทำงานร่วมกัน ประเมินความน่าเชื่อถือของข้อมูล', maxScore: 15 },
    { id: 'cs_p5_4', code: 'ว 4.2 ป.5/4', title: 'รวบรวม ประเมิน นำเสนอข้อมูลและสารสนเทศตามวัตถุประสงค์ โดยใช้ซอฟต์แวร์หรือบริการบนอินเทอร์เน็ตที่หลากหลาย เพื่อแก้ปัญหาในชีวิตประจำวัน', maxScore: 15 },
    { id: 'cs_p5_5', code: 'ว 4.2 ป.5/5', title: 'ใช้เทคโนโลยีสารสนเทศอย่างปลอดภัย มีมารยาท เข้าใจสิทธิและหน้าที่ของตน เคารพในสิทธิของผู้อื่น แจ้งผู้เกี่ยวข้องเมื่อพบข้อมูลหรือบุคคลที่ไม่เหมาะสม', maxScore: 15 },
  ],
  'ป.6': [
    { id: 'cs_p6_1', code: 'ว 4.2 ป.6/1', title: 'ใช้เหตุผลเชิงตรรกะในการอธิบายและออกแบบวิธีการแก้ปัญหาที่พบในชีวิตประจำวัน', maxScore: 15 },
    { id: 'cs_p6_2', code: 'ว 4.2 ป.6/2', title: 'ออกแบบและเขียนโปรแกรมอย่างง่าย เพื่อแก้ปัญหาในชีวิตประจำวัน ตรวจหาข้อผิดพลาดและแก้ไข', maxScore: 15 },
    { id: 'cs_p6_3', code: 'ว 4.2 ป.6/3', title: 'ใช้อินเทอร์เน็ตในการค้นหาข้อมูลอย่างมีประสิทธิภาพ', maxScore: 15 },
    { id: 'cs_p6_4', code: 'ว 4.2 ป.6/4', title: 'ใช้เทคโนโลยีสารสนเทศทำงานร่วมกันอย่างปลอดภัย เข้าใจสิทธิและหน้าที่ของตน เคารพในสิทธิของผู้อื่น แจ้งผู้เกี่ยวข้องเมื่อพบข้อมูลหรือบุคคลที่ไม่เหมาะสม', maxScore: 15 },
  ],
};

// ====== ม.1-3 แยก 2 วิชา ======
// วิชา "วิทยาการคำนวณ" (ว 4.2) — 4 ตัวชี้วัดต่อชั้น
const csIndicatorsM: Record<string, IndicatorDef[]> = {
  'ม.1': [
    { id: 'cs_m1_1', code: 'ว 4.2 ม.1/1', title: 'ออกแบบอัลกอริทึมที่ใช้แนวคิดเชิงนามธรรมเพื่อแก้ปัญหา', maxScore: 15 },
    { id: 'cs_m1_2', code: 'ว 4.2 ม.1/2', title: 'ออกแบบและเขียนโปรแกรมอย่างง่ายเพื่อแก้ปัญหาทางคณิตศาสตร์/วิทยาศาสตร์', maxScore: 15 },
    { id: 'cs_m1_3', code: 'ว 4.2 ม.1/3', title: 'รวบรวมข้อมูลปฐมภูมิ ประมวลผล ประเมินผล นำเสนอข้อมูลและสารสนเทศ', maxScore: 15 },
    { id: 'cs_m1_4', code: 'ว 4.2 ม.1/4', title: 'ใช้เทคโนโลยีสารสนเทศอย่างปลอดภัย ใช้สื่อ/แหล่งข้อมูลตามข้อกำหนด', maxScore: 15 },
  ],
  'ม.2': [
    { id: 'cs_m2_1', code: 'ว 4.2 ม.2/1', title: 'ออกแบบอัลกอริทึมที่ใช้แนวคิดเชิงคำนวณในการแก้ปัญหา', maxScore: 15 },
    { id: 'cs_m2_2', code: 'ว 4.2 ม.2/2', title: 'ออกแบบและเขียนโปรแกรมที่ใช้ตรรกะและฟังก์ชันในการแก้ปัญหา', maxScore: 15 },
    { id: 'cs_m2_3', code: 'ว 4.2 ม.2/3', title: 'อภิปรายองค์ประกอบและหลักการทำงานของระบบคอมพิวเตอร์ + Cloud', maxScore: 15 },
    { id: 'cs_m2_4', code: 'ว 4.2 ม.2/4', title: 'ใช้เทคโนโลยีสารสนเทศอย่างปลอดภัย มีจริยธรรม วิเคราะห์สื่อ', maxScore: 15 },
  ],
  'ม.3': [
    { id: 'cs_m3_1', code: 'ว 4.2 ม.3/1', title: 'พัฒนาแอปพลิเคชันที่มีการบูรณาการกับวิชาอื่นเพื่อแก้ปัญหาในชีวิตจริง', maxScore: 15 },
    { id: 'cs_m3_2', code: 'ว 4.2 ม.3/2', title: 'รวบรวมข้อมูล ประมวลผล ประเมินผล นำเสนอข้อมูลและสารสนเทศ', maxScore: 15 },
    { id: 'cs_m3_3', code: 'ว 4.2 ม.3/3', title: 'ประเมินความน่าเชื่อถือของข้อมูล วิเคราะห์สื่อและผลกระทบ', maxScore: 15 },
    { id: 'cs_m3_4', code: 'ว 4.2 ม.3/4', title: 'ใช้เทคโนโลยีสารสนเทศอย่างปลอดภัย รับผิดชอบต่อสังคม ปฏิบัติตามกฎหมาย', maxScore: 15 },
  ],
};

// วิชา "ออกแบบและเทคโนโลยี" (ว 4.1) — 5 ตัวชี้วัดต่อชั้น
const dtIndicatorsOnly: Record<string, IndicatorDef[]> = {
  'ม.1': [
    { id: 'dt_m1_1', code: 'ว 4.1 ม.1/1', title: 'อธิบายแนวคิดหลักของเทคโนโลยีในชีวิตประจำวันและวิเคราะห์การเปลี่ยนแปลง', maxScore: 15 },
    { id: 'dt_m1_2', code: 'ว 4.1 ม.1/2', title: 'ระบุปัญหาหรือความต้องการในชีวิตประจำวัน รวบรวมและวิเคราะห์ข้อมูล', maxScore: 15 },
    { id: 'dt_m1_3', code: 'ว 4.1 ม.1/3', title: 'ออกแบบวิธีการแก้ปัญหา โดยวิเคราะห์เปรียบเทียบและตัดสินใจเลือกข้อมูลที่จำเป็น', maxScore: 15 },
    { id: 'dt_m1_4', code: 'ว 4.1 ม.1/4', title: 'วางแผนและดำเนินการแก้ปัญหา ใช้ความรู้และทักษะ สร้างชิ้นงาน', maxScore: 15 },
    { id: 'dt_m1_5', code: 'ว 4.1 ม.1/5', title: 'ทดสอบ ประเมินผล และระบุข้อบกพร่องที่เกิดขึ้น พร้อมทั้งหาแนวทางการปรับปรุง', maxScore: 15 },
  ],
  'ม.2': [
    { id: 'dt_m2_1', code: 'ว 4.1 ม.2/1', title: 'คาดการณ์แนวโน้มเทคโนโลยี และวิเคราะห์ผลกระทบของเทคโนโลยีต่อชีวิต', maxScore: 15 },
    { id: 'dt_m2_2', code: 'ว 4.1 ม.2/2', title: 'ระบุปัญหาหรือความต้องการในชุมชน รวบรวมข้อมูล วิเคราะห์ และนำเสนอแนวทาง', maxScore: 15 },
    { id: 'dt_m2_3', code: 'ว 4.1 ม.2/3', title: 'ออกแบบวิธีการแก้ปัญหา โดยวิเคราะห์เปรียบเทียบและตัดสินใจเลือกข้อมูล', maxScore: 15 },
    { id: 'dt_m2_4', code: 'ว 4.1 ม.2/4', title: 'วางแผน ดำเนินการแก้ปัญหา ใช้ความรู้/ทักษะ สร้างชิ้นงานหรือพัฒนาวิธีการ', maxScore: 15 },
    { id: 'dt_m2_5', code: 'ว 4.1 ม.2/5', title: 'ทดสอบ ประเมินผล อธิบายปัญหาที่เกิดขึ้น พร้อมแนวทางการปรับปรุงแก้ไข', maxScore: 15 },
  ],
  'ม.3': [
    { id: 'dt_m3_1', code: 'ว 4.1 ม.3/1', title: 'วิเคราะห์สาเหตุหรือปัจจัยที่ส่งผลต่อการเปลี่ยนแปลงเทคโนโลยี และผลกระทบต่อสังคม/สิ่งแวดล้อม', maxScore: 15 },
    { id: 'dt_m3_2', code: 'ว 4.1 ม.3/2', title: 'ระบุปัญหาหรือความต้องการในชุมชนหรือท้องถิ่นเพื่อพัฒนางานอาชีพ', maxScore: 15 },
    { id: 'dt_m3_3', code: 'ว 4.1 ม.3/3', title: 'ออกแบบวิธีการแก้ปัญหา โดยวิเคราะห์เปรียบเทียบ และตัดสินใจเลือก', maxScore: 15 },
    { id: 'dt_m3_4', code: 'ว 4.1 ม.3/4', title: 'วางแผนขั้นตอนการทำงาน และดำเนินการแก้ปัญหา', maxScore: 15 },
    { id: 'dt_m3_5', code: 'ว 4.1 ม.3/5', title: 'ทดสอบ ประเมินผล วิเคราะห์ และให้เหตุผลของปัญหาหรือข้อบกพร่อง พร้อมแนวทางการพัฒนา', maxScore: 15 },
  ],
};

export type Subject = 'cs' | 'dt' | 'main';

export interface SubjectInfo {
  id: Subject;
  title: string;
  code: string;
  emoji: string;
}

/** วิชาที่มีในห้องเรียนนั้น */
export const getSubjectsForClassroom = (classroom: string): SubjectInfo[] => {
  if (classroom.startsWith('ป.')) {
    return [{ id: 'main', title: 'เทคโนโลยี', code: 'ว 4.2', emoji: '💻' }];
  }
  if (classroom.startsWith('ม.')) {
    return [
      { id: 'cs', title: 'วิทยาการคำนวณ', code: 'ว 4.2', emoji: '💻' },
      { id: 'dt', title: 'ออกแบบและเทคโนโลยี', code: 'ว 4.1', emoji: '🛠️' },
    ];
  }
  return [];
};

export const getIndicators = (classroom: string, subject: Subject = 'main'): IndicatorDef[] => {
  if (classroom.startsWith('ป.')) {
    return csIndicators[classroom] || [];
  }
  if (classroom.startsWith('ม.')) {
    if (subject === 'cs') return csIndicatorsM[classroom] || [];
    if (subject === 'dt') return dtIndicatorsOnly[classroom] || [];
  }
  return [];
};

// ---------- Default values ----------

export const emptyIndicatorScore = (maxK = 15): IndicatorScore => ({
  k: 0,
  maxK,
  p: 'พอใช้',
  a: false,
  pAssessed: false,
  aAssessed: false,
  updatedAt: Date.now(),
});

/** สร้างแถวคะแนนเฉพาะนักเรียนที่กำลังใช้งาน หากเครื่องนี้ยังไม่มีกระดาษเกรด */
export const ensureStudentGrade = (
  classroom: string,
  student: {
    studentCode: string;
    studentNo: number;
    name: string;
    emoji?: string;
  },
  subject: Subject = 'main',
): StudentGrade => {
  const grades = loadGrades(classroom, subject);
  const existing = grades.find((grade) => (
    grade.studentCode === student.studentCode
    || grade.studentNo === student.studentNo
    || grade.name === student.name
  ));
  if (existing) {
    existing.studentNo = student.studentNo;
    existing.name = student.name;
    existing.emoji = student.emoji || existing.emoji || '👤';
    cacheGradesLocally(classroom, grades, subject);
    return existing;
  }

  const indicators: Record<string, IndicatorScore> = {};
  getIndicators(classroom, subject).forEach((indicator) => {
    indicators[indicator.id] = emptyIndicatorScore(indicator.maxScore);
  });
  const created: StudentGrade = {
    studentCode: student.studentCode,
    classroom,
    studentNo: student.studentNo,
    name: student.name,
    emoji: student.emoji || '👤',
    indicators,
    updatedAt: Date.now(),
  };
  grades.push(created);
  cacheGradesLocally(classroom, grades, subject);
  return created;
};

// ---------- CRUD ----------

export const loadGrades = (classroom: string, subject: Subject = 'main'): StudentGrade[] => {
  try {
    const raw = localStorage.getItem(storageKey(classroom, subject));
    if (!raw) return [];
    const grades = JSON.parse(raw) as StudentGrade[];
    return grades.map((grade) => ({
      ...grade,
      indicators: Object.fromEntries(
        Object.entries(grade.indicators || {}).map(([id, score]) => {
          const hasNewAssessmentFlags =
            score.pAssessed !== undefined || score.aAssessed !== undefined;
          return [
            id,
            {
              ...score,
              p: hasNewAssessmentFlags ? score.p : 'พอใช้',
              pAssessed: score.pAssessed ?? false,
              aAssessed: score.aAssessed ?? false,
              a: hasNewAssessmentFlags ? score.a : false,
            },
          ];
        })
      ),
    }));
  } catch {
    return [];
  }
};

/** เก็บ cache ของกระดาษเกรดในเครื่อง โดยไม่เขียนกลับ Firebase */
export const cacheGradesLocally = (classroom: string, grades: StudentGrade[], subject: Subject = 'main') => {
  try {
    localStorage.setItem(storageKey(classroom, subject), JSON.stringify(grades));
  } catch (e) {
    console.warn('cacheGradesLocally failed', e);
  }
};

export const saveGrades = (classroom: string, grades: StudentGrade[], subject: Subject = 'main') => {
  cacheGradesLocally(classroom, grades, subject);
  void syncClassroomToFirebase(classroom, grades, subject);
};

export const updateStudentScore = (
  classroom: string,
  studentCode: string,
  indicatorId: string,
  patch: Partial<IndicatorScore>,
  subject: Subject = 'main'
) => {
  const grades = loadGrades(classroom, subject);
  const student = grades.find((g) => g.studentCode === studentCode);
  if (!student) return;
  const cur = student.indicators[indicatorId] || emptyIndicatorScore();
  const next: IndicatorScore = {
    ...cur,
    ...patch,
    pAssessed: patch.p !== undefined ? true : cur.pAssessed,
    aAssessed: patch.a !== undefined ? true : cur.aAssessed,
    updatedAt: Date.now(),
  };
  if (patch.k !== undefined) {
    next.teacherK = Math.max(0, Math.min(next.maxK || 15, patch.k));
    next.k = Math.max(
      next.teacherK,
      Math.min(next.maxK || 15, (next.webK || 0) + (next.manualK || 0)),
    );
  }
  if (patch.p !== undefined) {
    const teacherPScore = patch.p === 'ดี' ? 30 : patch.p === 'ปานกลาง' ? 20 : 15;
    next.teacherPScore = teacherPScore;
    next.pScore = Math.max(
      teacherPScore,
      Math.min(PRACTICE_MAX_SCORE, (next.webPScore || 0) + (next.manualPScore || 0)),
    );
    next.p = skillFromPracticeScore(next.pScore);
    next.practiceLevel = getPracticeLevel(next.pScore);
    next.practicePassed = next.pScore >= 15;
  }
  if (patch.a !== undefined) {
    next.teacherA = patch.a;
    next.a = patch.a;
    next.aScore = patch.a ? ATTITUDE_MAX_SCORE : 0;
  }
  student.indicators[indicatorId] = next;
  student.updatedAt = Date.now();
  cacheGradesLocally(classroom, grades, subject);
  void patchStudentGradeInFirebase(classroom, student, subject, {
    indicatorId,
    indicatorScore: student.indicators[indicatorId],
  });
};

/** ตั้งหรือล้างคะแนน K ที่ครูกรอกเอง โดยยังรักษาคะแนนจากเว็บและภาระงานไว้ */
export const updateTeacherKnowledgeScore = (
  classroom: string,
  studentCode: string,
  indicatorId: string,
  score: number | null,
  subject: Subject = 'main',
) => {
  const grades = loadGrades(classroom, subject);
  const student = grades.find((grade) => grade.studentCode === studentCode);
  if (!student) return;
  const indicator = getIndicators(classroom, subject).find((item) => item.id === indicatorId);
  const current = student.indicators[indicatorId] || emptyIndicatorScore(indicator?.maxScore || 15);
  const maxK = indicator?.maxScore || current.maxK || 15;
  const next: IndicatorScore = {
    ...current,
    maxK,
    updatedAt: Date.now(),
  };
  if (score === null) delete next.teacherK;
  else next.teacherK = Math.max(0, Math.min(maxK, score));
  next.k = Math.max(
    next.teacherK || 0,
    Math.min(maxK, (next.webK || 0) + (next.manualK || 0)),
  );
  student.indicators[indicatorId] = next;
  student.updatedAt = Date.now();
  cacheGradesLocally(classroom, grades, subject);
  void patchStudentGradeInFirebase(classroom, student, subject, {
    indicatorId,
    indicatorScore: next,
  });
};

export const updatePracticeCriteriaScores = (
  classroom: string,
  studentCode: string,
  indicatorId: string,
  criteria: number[],
  subject: Subject = 'main',
) => {
  const grades = loadGrades(classroom, subject);
  const student = grades.find((grade) => grade.studentCode === studentCode);
  if (!student) return;
  const indicator = getIndicators(classroom, subject).find((item) => item.id === indicatorId);
  const current = student.indicators[indicatorId] || emptyIndicatorScore(indicator?.maxScore || 15);
  const normalized = Array.from({ length: 10 }, (_, index) => (
    Math.max(0, Math.min(3, Number(criteria[index]) || 0))
  ));
  const teacherPScore = normalized.reduce((sum, score) => sum + score, 0);
  const pScore = Math.max(
    teacherPScore,
    Math.min(PRACTICE_MAX_SCORE, (current.webPScore || 0) + (current.manualPScore || 0)),
  );
  const next: IndicatorScore = {
    ...current,
    practiceCriteria: normalized,
    teacherPScore,
    pScore,
    p: skillFromPracticeScore(pScore),
    practiceLevel: getPracticeLevel(pScore),
    practicePassed: pScore >= 15,
    pAssessed: true,
    updatedAt: Date.now(),
  };
  student.indicators[indicatorId] = next;
  student.updatedAt = Date.now();
  cacheGradesLocally(classroom, grades, subject);
  void patchStudentGradeInFirebase(classroom, student, subject, {
    indicatorId,
    indicatorScore: next,
  });
};

export const updateFinalExam = (
  classroom: string,
  studentCode: string,
  score: number,
  subject: Subject = 'main'
) => {
  const grades = loadGrades(classroom, subject);
  const student = grades.find((g) => g.studentCode === studentCode);
  if (!student) return;
  student.finalExam = score;
  student.updatedAt = Date.now();
  cacheGradesLocally(classroom, grades, subject);
  void patchStudentGradeInFirebase(classroom, student, subject, { finalExam: score });
};

/** อัปเดตคะแนนสอบกลางภาค */
export const updateMidtermExam = (
  classroom: string,
  studentCode: string,
  score: number,
  subject: Subject = 'main'
) => {
  const grades = loadGrades(classroom, subject);
  const student = grades.find((g) => g.studentCode === studentCode);
  if (!student) return;
  student.midtermExam = score;
  student.updatedAt = Date.now();
  cacheGradesLocally(classroom, grades, subject);
  void patchStudentGradeInFirebase(classroom, student, subject, { midtermExam: score });
};

// ---------- Manual/outside-web assessments ----------

export type AssessmentCategory = 'k' | 'p';

export interface ManualAssessment {
  id: string;
  title: string;
  indicatorId: string;
  category: AssessmentCategory;
  maxScore: number;
  source: 'outside-web';
  groupId?: string;
  resourceUrl?: string;
  lessonPlanId?: string;
  createdAt: number;
}

export type ManualAssessmentScores = Record<string, Record<string, number>>;

const ASSESSMENT_PREFIX = 'krujames_manual_assessments_v1_';
const ASSESSMENT_SCORE_PREFIX = 'krujames_manual_assessment_scores_v1_';

const assessmentKey = (classroom: string, subject: Subject = 'main') =>
  `${ASSESSMENT_PREFIX}${classroom}_${subject}`;

const assessmentScoreKey = (classroom: string, subject: Subject = 'main') =>
  `${ASSESSMENT_SCORE_PREFIX}${classroom}_${subject}`;

const gradeDocumentId = (classroom: string, subject: Subject = 'main') => (
  subject === 'main' ? classroom : `${classroom}_${subject}`
);

/** เก็บโครงสร้างใบงานนอกเว็บและคะแนนดิบไว้ในเอกสารเดียวกับกระดาษเกรด */
const syncManualAssessmentData = async (classroom: string, subject: Subject = 'main') => {
  try {
    if (!db || !import.meta.env.VITE_FIREBASE_PROJECT_ID) return;
    await setDoc(doc(db, 'grades', gradeDocumentId(classroom, subject)), cleanForFirestore({
      classroom,
      subject,
      manualAssessments: loadManualAssessments(classroom, subject),
      manualAssessmentScores: loadManualAssessmentScores(classroom, subject),
      manualUpdatedAt: Date.now(),
    }), { merge: true });
  } catch (error) {
    console.warn('manual assessment Firebase sync failed', error);
  }
};

let manualAssessmentSyncQueue: Promise<void> = Promise.resolve();
const queueManualAssessmentSync = (classroom: string, subject: Subject) => {
  manualAssessmentSyncQueue = manualAssessmentSyncQueue
    .then(() => syncManualAssessmentData(classroom, subject));
};

const makeAssessmentId = () =>
  `ma_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const clampManualScore = (score: number, maxScore: number) =>
  Math.max(0, Math.min(maxScore, Number.isFinite(score) ? score : 0));

export const loadManualAssessments = (
  classroom: string,
  subject: Subject = 'main'
): ManualAssessment[] => {
  try {
    const raw = localStorage.getItem(assessmentKey(classroom, subject));
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const saveManualAssessments = (
  classroom: string,
  assessments: ManualAssessment[],
  subject: Subject = 'main'
) => {
  localStorage.setItem(assessmentKey(classroom, subject), JSON.stringify(assessments));
  queueManualAssessmentSync(classroom, subject);
};

export const loadManualAssessmentScores = (
  classroom: string,
  subject: Subject = 'main'
): ManualAssessmentScores => {
  try {
    const raw = localStorage.getItem(assessmentScoreKey(classroom, subject));
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

export const saveManualAssessmentScores = (
  classroom: string,
  scores: ManualAssessmentScores,
  subject: Subject = 'main'
) => {
  localStorage.setItem(assessmentScoreKey(classroom, subject), JSON.stringify(scores));
  queueManualAssessmentSync(classroom, subject);
};

export const createManualAssessment = (
  classroom: string,
  subject: Subject,
  data: Omit<ManualAssessment, 'id' | 'source' | 'createdAt'>
): ManualAssessment => {
  const assessments = loadManualAssessments(classroom, subject);
  const assessment: ManualAssessment = {
    ...data,
    title: data.title.trim(),
    maxScore: Math.max(1, data.maxScore || 1),
    source: 'outside-web',
    id: makeAssessmentId(),
    createdAt: Date.now(),
  };
  saveManualAssessments(classroom, [...assessments, assessment], subject);
  return assessment;
};

export const updateManualAssessment = (
  classroom: string,
  subject: Subject,
  assessmentId: string,
  patch: Partial<Pick<ManualAssessment, 'title' | 'maxScore' | 'resourceUrl' | 'lessonPlanId'>>,
): ManualAssessment | null => {
  const assessments = loadManualAssessments(classroom, subject);
  const index = assessments.findIndex((assessment) => assessment.id === assessmentId);
  if (index < 0) return null;
  const current = assessments[index];
  const updated: ManualAssessment = {
    ...current,
    title: patch.title === undefined ? current.title : (patch.title.trim() || current.title),
    maxScore: patch.maxScore === undefined ? current.maxScore : Math.max(1, patch.maxScore || 1),
    resourceUrl: patch.resourceUrl === undefined ? current.resourceUrl : patch.resourceUrl.trim(),
    lessonPlanId: patch.lessonPlanId === undefined ? current.lessonPlanId : patch.lessonPlanId,
  };
  assessments[index] = updated;
  saveManualAssessments(classroom, assessments, subject);

  if (updated.maxScore !== current.maxScore) {
    const scores = loadManualAssessmentScores(classroom, subject);
    Object.keys(scores[assessmentId] || {}).forEach((studentCode) => {
      scores[assessmentId][studentCode] = clampManualScore(scores[assessmentId][studentCode], updated.maxScore);
    });
    saveManualAssessmentScores(classroom, scores, subject);
  }
  return updated;
};

export const deleteManualAssessment = (
  classroom: string,
  subject: Subject,
  assessmentId: string
) => {
  const assessments = loadManualAssessments(classroom, subject).filter((a) => a.id !== assessmentId);
  const scores = loadManualAssessmentScores(classroom, subject);
  delete scores[assessmentId];
  saveManualAssessments(classroom, assessments, subject);
  saveManualAssessmentScores(classroom, scores, subject);
};

export const updateManualAssessmentScore = (
  classroom: string,
  subject: Subject,
  assessmentId: string,
  studentCode: string,
  score: number | null
) => {
  const assessment = loadManualAssessments(classroom, subject).find((a) => a.id === assessmentId);
  if (!assessment) return;

  const scores = loadManualAssessmentScores(classroom, subject);
  scores[assessmentId] = scores[assessmentId] || {};
  if (score === null || Number.isNaN(score)) {
    delete scores[assessmentId][studentCode];
  } else {
    scores[assessmentId][studentCode] = clampManualScore(score, assessment.maxScore);
  }
  saveManualAssessmentScores(classroom, scores, subject);
};

export const applyManualAssessmentsToGrades = (
  classroom: string,
  subject: Subject = 'main'
): { studentsUpdated: number; indicatorsUpdated: number; assessmentsUsed: number } => {
  const assessments = loadManualAssessments(classroom, subject);
  const scores = loadManualAssessmentScores(classroom, subject);
  const grades = loadGrades(classroom, subject);
  const indicators = getIndicators(classroom, subject);
  if (assessments.length === 0 || grades.length === 0) {
    return { studentsUpdated: 0, indicatorsUpdated: 0, assessmentsUsed: assessments.length };
  }

  const byIndicator = new Map<string, ManualAssessment[]>();
  assessments.forEach((assessment) => {
    byIndicator.set(assessment.indicatorId, [
      ...(byIndicator.get(assessment.indicatorId) || []),
      assessment,
    ]);
  });

  let studentsUpdated = 0;
  let indicatorsUpdated = 0;

  grades.forEach((student) => {
    let changedForStudent = false;

    indicators.forEach((indicator) => {
      const related = byIndicator.get(indicator.id) || [];
      const current = student.indicators[indicator.id] || emptyIndicatorScore(indicator.maxScore);
      if (related.length === 0) {
        if (current.manualK !== undefined || current.manualPScore !== undefined) {
          const next = { ...current, manualK: 0, manualPScore: 0, updatedAt: Date.now() };
          next.k = Math.max(next.webK || 0, next.teacherK || 0);
          next.pScore = Math.max(next.webPScore || 0, next.teacherPScore || 0);
          next.p = skillFromPracticeScore(next.pScore);
          next.practiceLevel = getPracticeLevel(next.pScore);
          next.practicePassed = next.pScore >= 15;
          student.indicators[indicator.id] = next;
          indicatorsUpdated += 1;
          changedForStudent = true;
        }
        return;
      }

      let next: IndicatorScore = { ...current, maxK: indicator.maxScore };
      let changedForIndicator = false;

      (['k', 'p'] as AssessmentCategory[]).forEach((category) => {
        const categoryAssessments = related.filter((a) => a.category === category);
        let earned = 0;
        let max = 0;

        categoryAssessments.forEach((assessment) => {
          const raw = scores[assessment.id]?.[student.studentCode];
          if (raw === undefined || raw === null) return;
          earned += clampManualScore(raw, assessment.maxScore);
          max += assessment.maxScore;
        });

        if (max <= 0) {
          if (category === 'k' && next.manualK !== undefined) {
            next = {
              ...next,
              manualK: 0,
              k: Math.max(next.webK || 0, next.teacherK || 0),
            };
            changedForIndicator = true;
          }
          if (category === 'p' && next.manualPScore !== undefined) {
            const pScore = Math.max(next.webPScore || 0, next.teacherPScore || 0);
            next = {
              ...next,
              manualPScore: 0,
              pScore,
              p: skillFromPracticeScore(pScore),
              practiceLevel: getPracticeLevel(pScore),
              practicePassed: pScore >= 15,
              pAssessed: true,
            };
            changedForIndicator = true;
          }
          return;
        }
        if (category === 'k') {
          const newK = Math.min(indicator.maxScore, Math.round(earned * 10) / 10);
          const legacyTeacherK = next.webK === undefined
            && next.manualK === undefined
            && next.teacherK === undefined
            ? next.k || 0
            : next.teacherK || 0;
          next = {
            ...next,
            teacherK: legacyTeacherK || next.teacherK,
            manualK: newK,
            k: Math.max(
              legacyTeacherK,
              Math.min(indicator.maxScore, (next.webK || 0) + newK),
            ),
            maxK: indicator.maxScore,
          };
        } else {
          const manualPScore = Math.min(PRACTICE_MAX_SCORE, Math.round(earned * 10) / 10);
          const legacyPScore = next.webPScore === undefined
            && next.manualPScore === undefined
            && next.teacherPScore === undefined
            && next.pAssessed
            ? (next.p === 'ดี' ? 30 : next.p === 'ปานกลาง' ? 20 : 15)
            : next.teacherPScore || 0;
          const pScore = Math.max(
            legacyPScore,
            Math.min(PRACTICE_MAX_SCORE, (next.webPScore || 0) + manualPScore),
          );
          next = {
            ...next,
            teacherPScore: legacyPScore || next.teacherPScore,
            manualPScore,
            pScore,
            p: skillFromPracticeScore(pScore),
            practiceLevel: getPracticeLevel(pScore),
            practicePassed: pScore >= 15,
            pAssessed: true,
          };
        }
        changedForIndicator = true;
      });

      if (changedForIndicator) {
        const titles = related.map((a) => `${a.category.toUpperCase()}: ${a.title}`).join(', ');
        student.indicators[indicator.id] = {
          ...next,
          note: `คำนวณจากงาน/ใบงานนอกเว็บ: ${titles}`,
          updatedAt: Date.now(),
        };
        indicatorsUpdated += 1;
        changedForStudent = true;
      }
    });

    if (changedForStudent) {
      student.updatedAt = Date.now();
      studentsUpdated += 1;
    }
  });

  if (studentsUpdated > 0) {
    cacheGradesLocally(classroom, grades, subject);
    void Promise.all(grades.map((student) => (
      upsertStudentGradeToFirebase(classroom, student, subject)
    ))).catch((error) => console.warn('manual grade upsert failed', error));
  }
  return { studentsUpdated, indicatorsUpdated, assessmentsUsed: assessments.length };
};

// ---------- Initialization (จาก roster 2569) ----------

import { loadRoster } from './rosterService';

/** สร้างหรืออัปเดตรายการคะแนนทั้งห้อง จากรายชื่อปัจจุบัน */
/**
 * Seed P + A เริ่มต้นสำหรับ "บท 1" (unit 1) ของทุกห้อง/ทุกวิชา
 * - P = ปานกลาง (ค่ามาตรฐานเริ่มต้น)
 * - A = true (ผ่าน)
 * จะไม่แก้ค่าที่ครูตั้งเองมาแล้ว (เช็คว่า P/A เคยถูกเซ็ตหรือไม่)
 */
export const seedUnit1ScoresForAllClasses = (
  defaultP: Skill = 'ปานกลาง',
  defaultA: boolean = true
): { classroom: string; subject: Subject; students: number; indicators: number }[] => {
  const result: { classroom: string; subject: Subject; students: number; indicators: number }[] = [];

  allClassrooms2569.forEach((classroom) => {
    const subjects = getSubjectsForClassroom(classroom);
    const primaryGradeIds = new Set(classroomToGradeIds(classroom));
    subjects.forEach((subj) => {
      // initClassroom จะสร้างข้อมูลจาก roster ถ้ายังไม่มี
      let grades = loadGrades(classroom, subj.id);
      if (grades.length === 0) {
        grades = initClassroom(classroom, subj.id);
      }
      const indicators = getIndicators(classroom, subj.id);
      // หา indicator ที่อยู่ใน unit 1 ของ "วิชาหลัก" (ไม่นับ AI bonus ที่อาจมี unitNo=1)
      const unit1Indicators = indicators.filter((ind) => {
        const units = findUnitsForIndicator(ind.id);
        return units.some((u) => u.unitNo === 1 && primaryGradeIds.has(u.gradeId));
      });
      if (unit1Indicators.length === 0) return;

      grades.forEach((g) => {
        unit1Indicators.forEach((ind) => {
          const existing = g.indicators[ind.id] || emptyIndicatorScore(ind.maxScore);
          // ต้องตั้ง pAssessed/aAssessed = true ด้วย ไม่งั้น computeBreakdown จะคิด P/A เป็น 0
          g.indicators[ind.id] = {
            ...existing,
            p: defaultP,
            a: defaultA,
            pAssessed: true,
            aAssessed: true,
            updatedAt: Date.now(),
          };
        });
        g.updatedAt = Date.now();
      });
      cacheGradesLocally(classroom, grades, subj.id);
      void Promise.all(grades.map((student) => (
        upsertStudentGradeToFirebase(classroom, student, subj.id)
      ))).catch((error) => console.warn('seed grade upsert failed', error));
      result.push({
        classroom,
        subject: subj.id,
        students: grades.length,
        indicators: unit1Indicators.length,
      });
    });
  });

  return result;
};

export const initClassroom = (classroom: string, subject: Subject = 'main'): StudentGrade[] => {
  const roster = loadRoster(classroom);
  const existing = loadGrades(classroom, subject);
  const existingMap = new Map(existing.map((s) => [s.studentCode, s]));
  const indicators = getIndicators(classroom, subject);

  const result: StudentGrade[] = roster.map((s) => {
    const prev = existingMap.get(s.studentCode);
    if (prev) {
      return { ...prev, name: s.name, emoji: s.emoji, studentNo: s.no };
    }
    const indicatorScores: Record<string, IndicatorScore> = {};
    indicators.forEach((ind) => {
      indicatorScores[ind.id] = emptyIndicatorScore(ind.maxScore);
    });
    return {
      studentCode: s.studentCode,
      classroom,
      studentNo: s.no,
      name: s.name,
      emoji: s.emoji,
      indicators: indicatorScores,
      updatedAt: Date.now(),
    };
  });
  saveGrades(classroom, result, subject);
  return result;
};

// ---------- Calculations (เกรด/คะแนนรวม) ----------

// ===== โครงสร้างคะแนนมาตรฐานไทย — แบ่งตามตัวชี้วัด =====
// คะแนนรวม 100 = คะแนนเก็บ 70 + สอบ 30
// คะแนนเก็บ 70 หารเท่าๆ กันให้ทุกตัวชี้วัด (เช่น 5 ตัวชี้วัด = 14 คะแนน/ตัว)
// ในแต่ละตัวชี้วัดแบ่งเป็น K (60%) + P (25%) + A (15%)
export const SCORE_WEIGHT = {
  COLLECTED: 70,     // คะแนนเก็บรวม
  EXAM: 30,          // คะแนนสอบ
  TOTAL: 100,
  // สัดส่วนใน "ตัวชี้วัดแต่ละตัว"
  K_RATIO: 0.60,     // K = 60% ของน้ำหนักตัวชี้วัด
  P_RATIO: 0.25,     // P = 25%
  A_RATIO: 0.15,     // A = 15%
};

const P_POINTS: Record<Skill, number> = { 'พอใช้': 1, 'ปานกลาง': 2, 'ดี': 3 };

/** คะแนนของตัวชี้วัดเดี่ยว */
export interface IndicatorContribution {
  indicatorId: string;
  code: string;
  weight: number;     // คะแนนเต็มของตัวชี้วัดนี้ (เช่น 14)
  kMax: number;       // คะแนนเต็ม K = weight × 60%
  pMax: number;       // คะแนนเต็ม P = weight × 25%
  aMax: number;       // คะแนนเต็ม A = weight × 15%
  k: number;          // คะแนน K ที่ได้
  p: number;          // คะแนน P ที่ได้
  a: number;          // คะแนน A ที่ได้
  total: number;      // K + P + A ของตัวชี้วัดนี้
}

/** คำนวณคะแนนแยกตามตัวชี้วัด — รวม 100 เต็ม */
export interface ScoreBreakdown {
  contributions: IndicatorContribution[]; // แยกตามตัวชี้วัด
  k: number;          // K รวม (จากทุกตัวชี้วัด)
  p: number;          // P รวม
  a: number;          // A รวม
  collected: number;  // คะแนนเก็บรวม (จาก 70)
  midterm: number;
  final: number;
  exam: number;       // คะแนนสอบรวม (จาก 30)
  total: number;      // รวมทั้งหมด (จาก 100)
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export const computeBreakdown = (
  g: StudentGrade,
  classroom: string,
  subject: Subject = 'main'
): ScoreBreakdown => {
  const indicators = getIndicators(classroom, subject);
  const exam = examMaxScores(classroom);

  if (indicators.length === 0) {
    return { contributions: [], k: 0, p: 0, a: 0, collected: 0, midterm: 0, final: 0, exam: 0, total: 0 };
  }

  // คะแนนต่อตัวชี้วัด = 70 / จำนวนตัวชี้วัด
  const weightPer = SCORE_WEIGHT.COLLECTED / indicators.length;
  const kMaxPer = weightPer * SCORE_WEIGHT.K_RATIO;
  const pMaxPer = weightPer * SCORE_WEIGHT.P_RATIO;
  const aMaxPer = weightPer * SCORE_WEIGHT.A_RATIO;

  const contributions: IndicatorContribution[] = indicators.map((ind) => {
    const s = g.indicators[ind.id] || emptyIndicatorScore(ind.maxScore);
    // K: สัดส่วนคะแนน K × kMaxPer
    const kRatio = ind.maxScore > 0 ? Math.min(1, s.k / ind.maxScore) : 0;
    const kVal = kRatio * kMaxPer;
    // P/A ยังไม่คิดคะแนนจนกว่าจะมีการประเมินจริงจากครูหรือจากระบบ
    const pRatio = s.pAssessed && s.practicePassed !== false ? P_POINTS[s.p] / 3 : 0;
    const pVal = pRatio * pMaxPer;
    const aVal = (s.aAssessed && s.a ? 1 : 0) * aMaxPer;

    return {
      indicatorId: ind.id,
      code: ind.code,
      weight: weightPer,
      kMax: kMaxPer,
      pMax: pMaxPer,
      aMax: aMaxPer,
      k: round1(kVal),
      p: round1(pVal),
      a: round1(aVal),
      total: round1(kVal + pVal + aVal),
    };
  });

  const totalK = contributions.reduce((s, c) => s + c.k, 0);
  const totalP = contributions.reduce((s, c) => s + c.p, 0);
  const totalA = contributions.reduce((s, c) => s + c.a, 0);
  const collected = totalK + totalP + totalA;

  const midterm = Math.min(g.midtermExam || 0, exam.midterm);
  const final = Math.min(g.finalExam || 0, exam.final);
  const examTotal = midterm + final;

  return {
    contributions,
    k: round1(totalK),
    p: round1(totalP),
    a: round1(totalA),
    collected: round1(collected),
    midterm,
    final,
    exam: examTotal,
    total: round1(collected + examTotal),
  };
};

export const computeTotal = (
  g: StudentGrade,
  classroom?: string,
  subject: Subject = 'main'
): number => {
  if (!classroom) {
    // legacy fallback (ไม่ส่ง classroom): รวม K + สอบ
    return (
      Object.values(g.indicators).reduce((sum, s) => sum + (s.k || 0), 0)
      + (g.midtermExam || 0) + (g.finalExam || 0)
    );
  }
  return computeBreakdown(g, classroom, subject).total;
};

/** คะแนนเต็ม = 100 เสมอ (มาตรฐานไทย) */
export const computeMaxTotal = (): number => {
  return SCORE_WEIGHT.TOTAL;
};

/** เกรดตามเกณฑ์ไทย: 80=4, 75=3.5, 70=3, 65=2.5, 60=2, 55=1.5, 50=1, <50=0 */
export const computeGrade = (g: StudentGrade, classroom: string, subject: Subject = 'main'): string => {
  const total = computeTotal(g, classroom, subject);
  const pct = total; // คะแนน = % เพราะ max = 100
  if (pct >= 80) return '4';
  if (pct >= 75) return '3.5';
  if (pct >= 70) return '3';
  if (pct >= 65) return '2.5';
  if (pct >= 60) return '2';
  if (pct >= 55) return '1.5';
  if (pct >= 50) return '1';
  return '0';
};

// ---------- Firebase sync (best-effort) ----------

const firebaseAvailable = (): boolean => {
  try { return !!db && !!import.meta.env.VITE_FIREBASE_PROJECT_ID; } catch { return false; }
};

const syncClassroomToFirebase = async (
  classroom: string, grades: StudentGrade[], subject: Subject = 'main'
) => {
  if (!firebaseAvailable()) return;
  try {
    const docId = gradeDocumentId(classroom, subject);
    const ref = doc(db, 'grades', docId);
    await setDoc(
      ref,
      cleanForFirestore({ classroom, subject, students: grades, updatedAt: Date.now() }),
      { merge: true },
    );
  } catch (e) {
    console.debug('grade sync skipped', e);
  }
};

export const fetchClassroomFromFirebase = async (
  classroom: string, subject: Subject = 'main'
): Promise<StudentGrade[] | null> => {
  if (!firebaseAvailable()) return null;
  try {
    const docId = gradeDocumentId(classroom, subject);
    const ref = doc(db, 'grades', docId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as {
        students?: StudentGrade[];
        manualAssessments?: ManualAssessment[];
        manualAssessmentScores?: ManualAssessmentScores;
      } | undefined;
      if (data?.manualAssessments) {
        localStorage.setItem(
          assessmentKey(classroom, subject),
          JSON.stringify(data.manualAssessments),
        );
      }
      if (data?.manualAssessmentScores) {
        localStorage.setItem(
          assessmentScoreKey(classroom, subject),
          JSON.stringify(data.manualAssessmentScores),
        );
      }
      return data?.students || null;
    }
  } catch (e) {
    console.debug('grade fetch failed', e);
  }
  return null;
};

const skillRank: Record<Skill, number> = { 'พอใช้': 1, 'ปานกลาง': 2, 'ดี': 3 };

const mergeIndicatorForStudent = (
  remote: IndicatorScore | undefined,
  incoming: IndicatorScore,
): IndicatorScore => {
  if (!remote) return incoming;
  const p = skillRank[incoming.p] >= skillRank[remote.p] ? incoming.p : remote.p;
  const webPScore = Math.max(remote.webPScore || 0, incoming.webPScore || 0);
  const manualPScore = Math.max(remote.manualPScore || 0, incoming.manualPScore || 0);
  const teacherPScore = Math.max(remote.teacherPScore || 0, incoming.teacherPScore || 0);
  const pScore = Math.max(
    teacherPScore,
    Math.min(PRACTICE_MAX_SCORE, webPScore + manualPScore),
  );
  const webK = Math.max(remote.webK || 0, incoming.webK || 0);
  const manualK = Math.max(remote.manualK || 0, incoming.manualK || 0);
  const teacherK = Math.max(remote.teacherK || 0, incoming.teacherK || 0);
  const maxK = Math.max(remote.maxK || 0, incoming.maxK || 0, 15);
  const teacherA = incoming.teacherA ?? remote.teacherA;
  const webAScore = Math.max(remote.webAScore || 0, incoming.webAScore || 0);
  const aScore = teacherA === undefined
    ? webAScore
    : teacherA ? ATTITUDE_MAX_SCORE : 0;
  return {
    ...remote,
    ...incoming,
    k: Math.max(teacherK, Math.min(maxK, webK + manualK)),
    webK,
    manualK,
    teacherK,
    maxK,
    webPScore,
    manualPScore,
    teacherPScore,
    pScore,
    practiceCriteria: incoming.practiceCriteria || remote.practiceCriteria,
    practiceLevel: getPracticeLevel(pScore),
    practicePassed: pScore > 0 ? pScore >= 15 : (remote.practicePassed ?? incoming.practicePassed),
    p: pScore > 0 ? skillFromPracticeScore(pScore) : p,
    teacherA,
    webAScore,
    aScore,
    aEvidence: incoming.aEvidence || remote.aEvidence,
    a: teacherA ?? (aScore >= 6),
    pAssessed: Boolean(remote.pAssessed || incoming.pAssessed),
    aAssessed: Boolean(remote.aAssessed || incoming.aAssessed),
    updatedAt: Math.max(remote.updatedAt || 0, incoming.updatedAt || 0),
  };
};

type TeacherGradePatch = {
  indicatorId?: string;
  indicatorScore?: IndicatorScore;
  midtermExam?: number;
  finalExam?: number;
};

/** ครูแก้เฉพาะช่องด้วย transaction โดยไม่ส่งสำเนาคะแนนทั้งห้องไปทับข้อมูลล่าสุด */
const patchStudentGradeInFirebase = async (
  classroom: string,
  fallbackStudent: StudentGrade,
  subject: Subject,
  patch: TeacherGradePatch,
): Promise<void> => {
  if (!firebaseAvailable()) return;
  const ref = doc(db, 'grades', gradeDocumentId(classroom, subject));
  try {
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(ref);
      const students = snap.exists()
        ? [...((snap.data().students as StudentGrade[] | undefined) || [])]
        : [];
      let index = students.findIndex((student) => student.studentCode === fallbackStudent.studentCode);
      const current = index >= 0 ? students[index] : fallbackStudent;
      const next: StudentGrade = {
        ...current,
        updatedAt: Date.now(),
        indicators: { ...(current.indicators || {}) },
      };
      if (patch.indicatorId && patch.indicatorScore) {
        next.indicators[patch.indicatorId] = patch.indicatorScore;
      }
      if (patch.midtermExam !== undefined) next.midtermExam = patch.midtermExam;
      if (patch.finalExam !== undefined) next.finalExam = patch.finalExam;
      if (index < 0) {
        index = students.length;
        students.push(next);
      } else {
        students[index] = next;
      }
      transaction.set(
        ref,
        cleanForFirestore({ classroom, subject, students, updatedAt: Date.now() }),
        { merge: true },
      );
    });
  } catch (error) {
    console.warn('teacher grade patch failed', error);
  }
};

/**
 * เขียนคะแนนเฉพาะนักเรียนคนเดียวด้วย transaction
 * ป้องกันเครื่องนักเรียนส่งสำเนาเก่าของทั้งห้องไปทับคะแนนเพื่อน
 */
export const upsertStudentGradeToFirebase = async (
  classroom: string,
  incoming: StudentGrade,
  subject: Subject = 'main',
): Promise<void> => {
  if (!firebaseAvailable()) throw new Error('Firebase is not configured');
  const docId = gradeDocumentId(classroom, subject);
  const ref = doc(db, 'grades', docId);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    const current = snap.exists()
      ? (snap.data().students as StudentGrade[] | undefined) || []
      : [];
    const index = current.findIndex((student) => (
      student.studentCode === incoming.studentCode
      || student.studentNo === incoming.studentNo
      || student.name === incoming.name
    ));
    const remote = index >= 0 ? current[index] : undefined;
    const mergedIndicators: Record<string, IndicatorScore> = { ...(remote?.indicators || {}) };
    Object.entries(incoming.indicators || {}).forEach(([indicatorId, score]) => {
      mergedIndicators[indicatorId] = mergeIndicatorForStudent(mergedIndicators[indicatorId], score);
    });
    const merged: StudentGrade = {
      ...remote,
      ...incoming,
      midtermExam: remote?.midtermExam ?? incoming.midtermExam,
      finalExam: remote?.finalExam ?? incoming.finalExam,
      comment: remote?.comment ?? incoming.comment,
      indicators: mergedIndicators,
      updatedAt: Date.now(),
    };
    const students = [...current];
    if (index >= 0) students[index] = merged;
    else students.push(merged);
    transaction.set(ref, cleanForFirestore({
      classroom,
      subject,
      students,
      updatedAt: Date.now(),
    }), { merge: true });
  });
};

// ---------- Sync K from progress (เชื่อมกับ quiz score อัตโนมัติ) ----------

import { grades as curriculumGrades } from '../data/curriculum';
import { loadSchedule, isInClassTime } from '../data/schedule';
import type { StudentProgressData, ActivityLog } from './progressService';
import { getAllCachedProgress, fetchAllProgressFromFirebase } from './progressService';

/**
 * Map ห้อง (classroom) → gradeId ใน curriculum
 * ห้อง 'ป.1' มี gradeId 'p1' (วิทยาการคำนวณ) — บางห้องอาจมีหลาย gradeId เช่น ม.1 มี 'm1-cs' และ 'm1-design'
 */
export const classroomToGradeIds = (classroom: string): string[] => {
  const map: Record<string, string[]> = {
    'ป.1': ['p1'], 'ป.2': ['p2'], 'ป.3': ['p3'],
    'ป.4': ['p4'], 'ป.5': ['p5'], 'ป.6': ['p6'],
    'ม.1': ['m1-cs', 'm1-design'],
    'ม.2': ['m2-cs', 'm2-design'],
    'ม.3': ['m3-cs', 'm3-design'],
  };
  return map[classroom] || [];
};

/**
 * แปลง indicator id เช่น 'cs_p1_3' → { gradeIds: ['p1'], indicatorIndex: 2 }
 *                          'dt_m1_2' → { gradeIds: ['m1-design'], indicatorIndex: 1 }
 *                          'cs_m1_1' → { gradeIds: ['m1-cs'], indicatorIndex: 0 }
 */
const parseIndicatorId = (id: string): { gradeIds: string[]; indicatorIndex: number } | null => {
  // pattern: {cs|dt}_{p1-p6|m1-m3}_{n}
  const m = id.match(/^(cs|dt)_(p[1-6]|m[1-3])_(\d+)$/);
  if (!m) return null;
  const [, type, level, idxStr] = m;
  const indicatorIndex = parseInt(idxStr) - 1;
  // primary
  if (level.startsWith('p')) {
    return { gradeIds: [level], indicatorIndex };
  }
  // mathayom: cs → m{n}-cs, dt → m{n}-design
  if (level.startsWith('m')) {
    const suffix = type === 'dt' ? 'design' : 'cs';
    return { gradeIds: [`${level}-${suffix}`], indicatorIndex };
  }
  return null;
};

/**
 * Bonus mapping: คอร์ส AI ให้คะแนน K/P เพิ่มเติมกับตัวชี้วัด ว 4.2 ที่เกี่ยวข้อง
 * (เพราะ AI เป็นเนื้อหาเสริมที่ครอบคลุมตัวชี้วัดหลายข้อ)
 *
 * รูปแบบ: indicator id → [{ gradeId, unitNo } ของ AI course ที่ส่งผล]
 */
const aiBonusForIndicator: Record<string, { gradeId: string; unitNo: number }[]> = {
  // ====== ว 4.2 ป.1-3 (เด็กเล็ก) ======
  // AI-2 (เรียนรู้จากข้อมูล) → cs_p1_3, cs_p2_2, cs_p3_2 (programming)
  'cs_p1_3': [{ gradeId: 'ai-p1-3', unitNo: 2 }],
  'cs_p2_2': [{ gradeId: 'ai-p1-3', unitNo: 2 }],
  'cs_p3_2': [{ gradeId: 'ai-p1-3', unitNo: 2 }],
  // AI-1, AI-3 (รู้จัก AI, ใช้ปลอดภัย) → ตัวชี้วัดเรื่องเทคโนโลยี + ปลอดภัย
  'cs_p1_4': [{ gradeId: 'ai-p1-3', unitNo: 1 }],
  'cs_p1_5': [{ gradeId: 'ai-p1-3', unitNo: 1 }, { gradeId: 'ai-p1-3', unitNo: 3 }],
  'cs_p2_3': [{ gradeId: 'ai-p1-3', unitNo: 1 }],
  'cs_p2_4': [{ gradeId: 'ai-p1-3', unitNo: 3 }],
  'cs_p3_3': [{ gradeId: 'ai-p1-3', unitNo: 1 }],
  'cs_p3_4': [{ gradeId: 'ai-p1-3', unitNo: 2 }],
  'cs_p3_5': [{ gradeId: 'ai-p1-3', unitNo: 3 }],

  // ====== ว 4.2 ป.4-6 (ฉลาดยังไง) ======
  // AI-1 (ML) → ข้อมูล, AI-2 (สร้างโมเดล) → programming
  'cs_p4_2': [{ gradeId: 'ai-p4-6', unitNo: 2 }],
  'cs_p4_3': [{ gradeId: 'ai-p4-6', unitNo: 1 }],
  'cs_p4_4': [{ gradeId: 'ai-p4-6', unitNo: 1 }],
  'cs_p4_5': [{ gradeId: 'ai-p4-6', unitNo: 3 }, { gradeId: 'ai-p4-6', unitNo: 4 }],
  'cs_p5_2': [{ gradeId: 'ai-p4-6', unitNo: 2 }],
  'cs_p5_3': [{ gradeId: 'ai-p4-6', unitNo: 1 }],
  'cs_p5_4': [{ gradeId: 'ai-p4-6', unitNo: 1 }],
  'cs_p5_5': [{ gradeId: 'ai-p4-6', unitNo: 3 }, { gradeId: 'ai-p4-6', unitNo: 4 }],
  'cs_p6_2': [{ gradeId: 'ai-p4-6', unitNo: 2 }],
  'cs_p6_3': [{ gradeId: 'ai-p4-6', unitNo: 3 }, { gradeId: 'ai-p4-6', unitNo: 4 }],
  'cs_p6_4': [{ gradeId: 'ai-p4-6', unitNo: 1 }],

  // ====== ว 4.2/4.1 ม.1-3 (ขั้นปฏิบัติ) ======
  'cs_m1_1': [{ gradeId: 'ai-m1-3', unitNo: 1 }],
  'cs_m1_2': [{ gradeId: 'ai-m1-3', unitNo: 2 }, { gradeId: 'ai-m1-3', unitNo: 3 }, { gradeId: 'ai-m1-3', unitNo: 5 }],
  'cs_m2_1': [{ gradeId: 'ai-m1-3', unitNo: 1 }],
  'cs_m2_2': [{ gradeId: 'ai-m1-3', unitNo: 2 }, { gradeId: 'ai-m1-3', unitNo: 3 }, { gradeId: 'ai-m1-3', unitNo: 5 }],
  'cs_m3_1': [{ gradeId: 'ai-m1-3', unitNo: 5 }],
  'cs_m3_2': [{ gradeId: 'ai-m1-3', unitNo: 4 }],
  // ออกแบบเทคโนโลยี — AI ethics
  'dt_m1_1': [{ gradeId: 'ai-m1-3', unitNo: 4 }],
  'dt_m2_1': [{ gradeId: 'ai-m1-3', unitNo: 4 }],
  'dt_m3_1': [{ gradeId: 'ai-m1-3', unitNo: 4 }],
};

/**
 * Find ทุก unit ใน curriculum ที่มี indicator นี้ (ใช้ indicators: number[] ใน unit)
 * + รวม AI bonus units ที่ map ไว้ด้วย
 */
const findUnitsForIndicator = (id: string): { gradeId: string; unitNo: number }[] => {
  const parsed = parseIndicatorId(id);
  if (!parsed) return [];
  const result: { gradeId: string; unitNo: number }[] = [];
  parsed.gradeIds.forEach((gid) => {
    const grade = curriculumGrades.find((g) => g.id === gid);
    if (!grade?.units) return;
    grade.units.forEach((u: { no: number; indicators?: number[] }) => {
      const inds: number[] = u.indicators || [];
      if (inds.includes(parsed.indicatorIndex)) {
        result.push({ gradeId: gid, unitNo: u.no });
      }
    });
  });
  // รวม AI bonus units
  const aiBonus = aiBonusForIndicator[id] || [];
  aiBonus.forEach((b) => {
    if (!result.some((r) => r.gradeId === b.gradeId && r.unitNo === b.unitNo)) {
      result.push(b);
    }
  });
  return result;
};

/** ดึง progress data จาก in-memory cache ของ progressService (Firebase-only mode) */
const loadProgressData = (studentId: string): StudentProgressData | null => {
  try {
    // ใช้ getAllCachedProgress + find เพื่อหลีกเลี่ยง circular import จาก getProgress
    const all = getAllCachedProgress();
    const found = all.find((p) => p.studentId === studentId);
    return found || null;
  } catch {
    return null;
  }
};

/**
 * สร้าง studentId ที่ใช้ใน progressService
 * ต้อง match กับ format ใน AuthContext.loginAsStudent: `${classroom}_${studentNumber}_${nameNoSpace}`
 */
const buildStudentId = (classroom: string, studentNo: number, name: string): string => {
  return `${classroom}_${studentNo}_${name.replace(/\s/g, '')}`;
};

/**
 * ค้นหา progress data ของนักเรียนใน localStorage แบบ fuzzy
 * เพราะชื่อที่ผู้ใช้พิมพ์ login อาจไม่ตรงกับ roster เป๊ะ
 *
 * ลำดับการค้น:
 * 1. exact studentId match
 * 2. classroom + studentNumber match (ไม่สนชื่อ — ใช้เลขที่อย่างเดียว)
 * 3. classroom + name substring match (ค้นชื่อบางส่วน)
 */
const findProgressForStudent = (
  classroom: string,
  studentNo: number,
  name: string
): { progress: StudentProgressData; matchedKey: string; matchType: 'exact' | 'number' | 'name' } | null => {
  // 1) exact
  const exactId = buildStudentId(classroom, studentNo, name);
  const exactProg = loadProgressData(exactId);
  if (exactProg) return { progress: exactProg, matchedKey: exactId, matchType: 'exact' };

  // 2+3) scan all progress data ใน in-memory cache ของ progressService
  // (cache ถูก populate จาก fetchAllProgressFromFirebase / fetchStudentProgress)
  const cleanedName = name.replace(/\s/g, '').toLowerCase();
  const nameTokens = name.split(/\s+/).filter((t) => t.length > 1);

  let numberMatch: { progress: StudentProgressData; key: string } | null = null;
  let nameMatch: { progress: StudentProgressData; key: string } | null = null;

  const allProgress = getAllCachedProgress();
  for (const prog of allProgress) {
    const id = prog.studentId || '';
    if (!id) continue;
    const parts = id.split('_');
    if (parts.length < 3) continue;
    const [keyClass, keyNo, ...keyNameParts] = parts;
    if (keyClass !== classroom) continue;

    const keyName = keyNameParts.join('_').toLowerCase();

    if (parseInt(keyNo) === studentNo) {
      numberMatch = { progress: prog, key: id };
    }

    if (!numberMatch) {
      const matchToken =
        keyName === cleanedName ||
        nameTokens.some((t) => keyName.includes(t.toLowerCase())) ||
        cleanedName.includes(keyName) ||
        keyName.includes(cleanedName);
      if (matchToken) {
        nameMatch = { progress: prog, key: id };
      }
    }
  }

  if (numberMatch) return { progress: numberMatch.progress, matchedKey: numberMatch.key, matchType: 'number' };
  if (nameMatch) return { progress: nameMatch.progress, matchedKey: nameMatch.key, matchType: 'name' };
  return null;
};

/** สำหรับ diagnostic: นับจำนวน progress ใน cache แยกตามห้อง */
export const diagnoseProgress = (
  classroom: string
): { totalKeys: number; classroomKeys: string[] } => {
  const all = getAllCachedProgress().map((p) => p.studentId).filter(Boolean);
  const inClass = all.filter((k) => k.startsWith(classroom + '_'));
  return { totalKeys: all.length, classroomKeys: inClass };
};

/** ดึง progress ทุกคนจาก Firebase ลง cache — wrapper ของ progressService.fetchAllProgressFromFirebase */
export const hydrateProgressFromFirebase = async (
  _classroom: string
): Promise<{ available: boolean; downloaded: number; error?: string }> => {
  void _classroom;
  if (!firebaseAvailable()) {
    return { available: false, downloaded: 0, error: 'Firebase is not configured' };
  }
  try {
    const all = await fetchAllProgressFromFirebase();
    return { available: true, downloaded: all.length };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.warn('fetch progress from firebase failed', e);
    return { available: true, downloaded: 0, error };
  }
};

/**
 * Sync K, P, A จาก progress data → grade
 * - K: คำนวณจาก best quiz score ของทุก unit ที่ map กับตัวชี้วัดนี้ (เฉลี่ย %)
 * - P: คำนวณจาก completion (ดู slides + media): ดี ≥80%, ปานกลาง 50-79%, พอใช้ <50%
 * - A: true ถ้านักเรียนเข้าระบบและทำกิจกรรมครบ ≥3 อย่างในหน่วยใดหน่วยหนึ่ง
 */
export const syncFromProgress = (
  classroom: string,
  studentCode: string,
  studentId?: string,
  subject: Subject = 'main',
  persistScope: 'classroom' | 'local' = 'classroom',
): { changed: number; matchType?: string } => {
  const grades = loadGrades(classroom, subject);
  const student = grades.find((g) => g.studentCode === studentCode);
  if (!student) return { changed: 0 };

  // ลอง exact id ที่ส่งมาก่อน
  let prog: StudentProgressData | null = null;
  let matchType: string | undefined;
  if (studentId) {
    prog = loadProgressData(studentId);
    if (prog) matchType = 'exact';
  }
  // ถ้าไม่เจอ ค้นแบบ fuzzy ใน localStorage
  if (!prog) {
    const found = findProgressForStudent(classroom, student.studentNo, student.name);
    if (found) {
      prog = found.progress;
      matchType = found.matchType;
    }
  }
  if (!prog) return { changed: 0 };

  const indicators = getIndicators(classroom, subject);
  const schedule = loadSchedule();
  const allActivities: ActivityLog[] = prog.activities || [];
  let changed = 0;

  indicators.forEach((ind) => {
    const linkedUnits = findUnitsForIndicator(ind.id);
    if (linkedUnits.length === 0) return;

    const linkedUnitKeys = new Set(
      linkedUnits.map(({ gradeId, unitNo }) => `${gradeId}_${unitNo}`)
    );

    // ============ K = ความรู้ ============
    // คำนวณจากคะแนนควิซเฉลี่ย × maxScore ของทุก unit ที่ link กับตัวชี้วัดนี้
    let totalQuizScore = 0;
    let totalQuizMax = 0;
    let totalWorldKnowledgeScore = 0;
    let totalWorldKnowledgeMax = 0;

    // ============ P = ทักษะที่เกี่ยวกับตัวชี้วัด ============
    // หลักฐานในคาบได้ 100% นอกคาบได้ 40% และแต่ละกิจกรรมนับครั้งเดียว
    let skillPoints = 0;
    let practiceCount = 0;
    let quizAttempts = 0;
    let completedUnits = 0;

    let unitsWithData = 0;

    linkedUnits.forEach(({ gradeId, unitNo }) => {
      const key = `${gradeId}_${unitNo}`;
      const u = prog.units?.[key];
      if (!u) return;
      unitsWithData += 1;

      // K: best quiz score
      if (u.bestQuizMax > 0) {
        totalQuizScore += u.bestQuizScore;
        totalQuizMax += u.bestQuizMax;
      }
      if ((u.worldKnowledgeMax || 0) > 0) {
        totalWorldKnowledgeScore += u.worldKnowledgeCorrect || 0;
        totalWorldKnowledgeMax += Math.max(2, u.worldKnowledgeMax || 0);
      }

      const evidence = u.scoreEvidence || [];
      skillPoints += evidence.reduce(
        (sum, item) => sum + item.basePoints * (item.inClass ? 1 : 0.4),
        0,
      );

      // ข้อมูลรุ่นเก่าไม่มี scoreEvidence: นับรายการที่ยังไม่มีหลักฐานในอัตรานอกคาบ
      const evidenceCounts = evidence.reduce<Record<string, number>>((counts, item) => {
        counts[item.type] = (counts[item.type] || 0) + 1;
        return counts;
      }, {});
      const legacyCounts = {
        practice: Math.max(0, (u.practiceCompleted?.length || 0) - (evidenceCounts.practice || 0)),
        fun: Math.max(0, (u.funClicked?.length || 0) - (evidenceCounts.fun || 0)),
        video: Math.max(0, (u.videosClicked?.length || 0) - (evidenceCounts.video || 0)),
        slide: Math.max(0, (u.slidesViewed?.length || 0) - (evidenceCounts.slide || 0)),
        article: Math.max(0, (u.articlesClicked?.length || 0) - (evidenceCounts.article || 0)),
      };
      skillPoints += (
        legacyCounts.practice * 5
        + legacyCounts.fun * 3
        + legacyCounts.video * 2
        + legacyCounts.slide
        + legacyCounts.article
      ) * 0.4;
      practiceCount += u.practiceCompleted?.length || 0;
      quizAttempts += u.quizAttempts || 0;
      if ((u.completionPct || 0) >= 60) completedUnits += 1;
    });

    if (unitsWithData === 0) return;

    // K: ระดับความรู้ — ใช้ max(K เดิม, K จาก quiz) ป้องกัน sync ทับคะแนนที่ครูตั้งเอง
    // หรือคะแนน Manual Assessment (homework) ที่ apply ไว้ก่อน
    const quizK =
      totalQuizMax > 0
        ? Math.round((totalQuizScore / totalQuizMax) * ind.maxScore)
        : 0;
    // คำถามสั้นในห้อง 3D เป็นหลักฐาน K แบบ formative และมีน้ำหนักสูงสุด 50%
    // เพื่อไม่ให้ตอบเพียงข้อเดียวแล้วได้คะแนนความรู้เต็มตัวชี้วัด
    const worldK =
      totalWorldKnowledgeMax > 0
        ? Math.min(
          Math.round(ind.maxScore * 0.5),
          Math.round((totalWorldKnowledgeScore / totalWorldKnowledgeMax) * ind.maxScore),
        )
        : 0;
    const currentScore = student.indicators[ind.id] || emptyIndicatorScore(ind.maxScore);
    const webK = Math.max(quizK, worldK, currentScore.webK || 0);
    const legacyTeacherK = currentScore.webK === undefined
      && currentScore.manualK === undefined
      && currentScore.teacherK === undefined
      ? currentScore.k || 0
      : currentScore.teacherK || 0;
    const k = Math.max(
      legacyTeacherK,
      Math.min(ind.maxScore, webK + (currentScore.manualK || 0)),
    );

    // P: คะแนนปฏิบัติจากการใช้เว็บ รวมสูงสุด 30 คะแนน
    const webPScore = Math.min(PRACTICE_MAX_SCORE, Math.round(skillPoints * 10) / 10);
    const legacyTeacherPScore = currentScore.webPScore === undefined
      && currentScore.manualPScore === undefined
      && currentScore.teacherPScore === undefined
      && currentScore.pAssessed
      ? (currentScore.p === 'ดี' ? 30 : currentScore.p === 'ปานกลาง' ? 20 : 15)
      : currentScore.teacherPScore || 0;
    const pScore = Math.max(
      legacyTeacherPScore,
      Math.min(PRACTICE_MAX_SCORE, webPScore + (currentScore.manualPScore || 0)),
    );
    const p = skillFromPracticeScore(pScore);

    // ============ A = จิตพิสัย ============
    // เกณฑ์: เข้าเรียนในเวลาเรียน (ตาราง) ≥ 2 วันที่ต่างกัน
    // ใช้ u.inClassDays (persistent ต่อ unit) เป็นแหล่งหลัก — ทนต่อ activity buffer truncation
    // fallback เป็น activities log (ถ้า progress data รุ่นเก่ายังไม่มี inClassDays)
    const inClassDays = new Set<string>();
    linkedUnits.forEach(({ gradeId, unitNo }) => {
      const u = prog.units?.[`${gradeId}_${unitNo}`];
      u?.inClassDays?.forEach((d) => inClassDays.add(d));
    });
    if (inClassDays.size === 0) {
      // legacy fallback — สแกน activities array (อาจถูกตัดถ้าใช้นานๆ)
      allActivities.forEach((act: ActivityLog) => {
        const actKey = `${act.gradeId}_${act.unitNo}`;
        if (!linkedUnitKeys.has(actKey)) return;
        if (!isInClassTime(act.timestamp, classroom, schedule)) return;
        const d = new Date(act.timestamp);
        const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        inClassDays.add(dayKey);
      });
    }

    (prog.inClassDays || []).forEach((day) => inClassDays.add(day));
    const activeDays = new Set(prog.daysActive || []);
    const webAScore = Math.min(
      ATTITUDE_MAX_SCORE,
      Math.min(4, inClassDays.size * 2)
      + Math.min(2, activeDays.size)
      + Math.min(2, practiceCount)
      + Math.min(1, quizAttempts)
      + Math.min(1, completedUnits),
    );
    const a = currentScore.teacherA ?? (webAScore >= 6);
    const aScore = currentScore.teacherA === undefined
      ? webAScore
      : currentScore.teacherA ? ATTITUDE_MAX_SCORE : 0;

    student.indicators[ind.id] = {
      ...currentScore,
      k,
      webK,
      teacherK: legacyTeacherK || currentScore.teacherK,
      maxK: ind.maxScore,
      p,
      webPScore,
      teacherPScore: legacyTeacherPScore || currentScore.teacherPScore,
      pScore,
      practiceLevel: getPracticeLevel(pScore),
      practicePassed: pScore >= 15,
      a,
      webAScore,
      aScore,
      aEvidence: {
        inClassDays: inClassDays.size,
        activeDays: activeDays.size,
        practiceCount,
        quizAttempts,
        completedUnits,
      },
      pAssessed: true,
      aAssessed: true,
      updatedAt: Date.now(),
    };
    changed += 1;
  });

  if (changed > 0) {
    student.updatedAt = Date.now();
    if (persistScope === 'local') cacheGradesLocally(classroom, grades, subject);
    else {
      cacheGradesLocally(classroom, grades, subject);
      void Promise.all(grades.map((student) => (
        upsertStudentGradeToFirebase(classroom, student, subject)
      ))).catch((error) => console.warn('progress grade upsert failed', error));
    }
  }
  return { changed, matchType };
};

/** sync ทุกคนในห้อง — คืน diagnostic info */
export const syncAllFromProgress = (classroom: string, subject: Subject = 'main'): {
  studentsUpdated: number;
  indicatorsUpdated: number;
  notFound: { no: number; name: string }[];
  matchedByExact: number;
  matchedByNumber: number;
  matchedByName: number;
} => {
  const grades = loadGrades(classroom, subject);
  let studentsUpdated = 0;
  let indicatorsUpdated = 0;
  let matchedByExact = 0;
  let matchedByNumber = 0;
  let matchedByName = 0;
  const notFound: { no: number; name: string }[] = [];

  grades.forEach((g) => {
    const r = syncFromProgress(classroom, g.studentCode, undefined, subject);
    if (r.changed > 0) {
      studentsUpdated += 1;
      indicatorsUpdated += r.changed;
      if (r.matchType === 'exact') matchedByExact += 1;
      else if (r.matchType === 'number') matchedByNumber += 1;
      else if (r.matchType === 'name') matchedByName += 1;
    } else {
      notFound.push({ no: g.studentNo, name: g.name });
    }
  });
  return { studentsUpdated, indicatorsUpdated, notFound, matchedByExact, matchedByNumber, matchedByName };
};

export const syncAllFromProgressAsync = async (
  classroom: string,
  subject: Subject = 'main'
): Promise<{
  studentsUpdated: number;
  indicatorsUpdated: number;
  notFound: { no: number; name: string }[];
  matchedByExact: number;
  matchedByNumber: number;
  matchedByName: number;
  firebaseProgressAvailable: boolean;
  firebaseProgressDownloaded: number;
  firebaseProgressError?: string;
}> => {
  const remote = await hydrateProgressFromFirebase(classroom);
  const result = syncAllFromProgress(classroom, subject);
  return {
    ...result,
    firebaseProgressAvailable: remote.available,
    firebaseProgressDownloaded: remote.downloaded,
    firebaseProgressError: remote.error,
  };
};

/** ดึง mapping ของ indicator → units (สำหรับแสดงในหน้าครู/นักเรียน) */
export const getLinkedUnitsForSubject = (classroom: string, subject: Subject = 'main') => {
  const indicators = getIndicators(classroom, subject);
  return indicators.map((ind) => ({
    indicator: ind,
    units: findUnitsForIndicator(ind.id),
  }));
};

/** legacy — สำหรับ ป.X */
export const getLinkedUnits = (classroom: string, subject: Subject = 'main') => {
  return getLinkedUnitsForSubject(classroom, subject);
};

// ---------- Export ----------

export const exportToCSV = (classroom: string, subject: Subject = 'main'): string => {
  const grades = loadGrades(classroom, subject);
  const indicators = getIndicators(classroom, subject);
  const exam = examMaxScores(classroom);
  let csv = 'เลขที่,รหัสนักเรียน,ชื่อ-สกุล';
  indicators.forEach((ind) => {
    csv += `,${ind.code} (K),${ind.code} (P),${ind.code} (A)`;
  });
  csv += ',คะแนนเก็บ K (40),คะแนน P (20),คะแนน A (10),รวมเก็บ (70)';
  if (exam.midterm > 0) csv += `,สอบกลางภาค (${exam.midterm})`;
  csv += `,สอบปลายภาค (${exam.final}),รวมสอบ (30),คะแนนรวม (100),เกรด\n`;

  grades.forEach((g) => {
    csv += `${g.studentNo},${g.studentCode},${g.name}`;
    indicators.forEach((ind) => {
      const s = g.indicators[ind.id] || emptyIndicatorScore();
      csv += `,${s.k},${s.p},${s.a ? '1' : '0'}`;
    });
    const b = computeBreakdown(g, classroom, subject);
    csv += `,${b.k},${b.p},${b.a},${b.collected}`;
    if (exam.midterm > 0) csv += `,${g.midtermExam || 0}`;
    csv += `,${g.finalExam || 0},${b.exam},${b.total},${computeGrade(g, classroom, subject)}\n`;
  });
  return csv;
};

export const downloadCSV = (classroom: string, subject: Subject = 'main') => {
  const csv = exportToCSV(classroom, subject);
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const subjLabel = subject === 'cs' ? '_วิทยาการคำนวณ' : subject === 'dt' ? '_ออกแบบ' : '';
  a.download = `เก็บคะแนน_${classroom}${subjLabel}_2569.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
