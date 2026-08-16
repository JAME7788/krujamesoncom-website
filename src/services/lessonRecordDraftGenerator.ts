// สร้าง "ร่าง" บันทึกหลังสอนจากหัวข้อของแผนและช่วงวัยของผู้เรียน
//
// ทำไมต้องมี: ครูสอนสัปดาห์ละหลายห้อง พอสะสมหลายสัปดาห์แล้วต้องมานั่งเขียนย้อนหลังทีละคาบ
// ตัวนี้เติมโครงให้ก่อน ครูอ่านแล้วแก้ให้ตรงกับสิ่งที่เกิดขึ้นจริง เร็วกว่าเริ่มจากหน้าว่าง
//
// ใช้ตัวจัดประเภทบทเรียนและช่วงวัยชุดเดียวกับที่ใช้สร้างแผนการสอน
// จึงได้ข้อความที่สอดคล้องกับเนื้อหาของคาบนั้นจริง ไม่ใช่ข้อความกลางที่ใช้ได้กับทุกคาบ
//
// ⚠️ ผลลัพธ์เป็นร่างเสมอ (status: 'draft') เพราะระบบไม่รู้ว่าในห้องเกิดอะไรขึ้นจริง

import {
  ageBandOf,
  classifyLesson,
  getLessonProfile,
  type AgeBand,
  type LessonCategory,
} from '../data/lessonContentProfiles';
import type { StudentAssessmentMeta } from './studentAssessmentService';

export interface DraftSource {
  gradeId: string;          // เช่น 'p1', 'm2'
  unitTitle: string;
  lessonTitle: string;
  teachingDate: string;
  planNo: number | string;
  week?: number;
  /** จำนวนนักเรียนในห้อง ใช้เขียนภาพรวมให้สมจริง */
  totalStudents?: number;
}

/** แปลง gradeId เป็นตัวเลขชั้นเพื่อหาช่วงวัย — ม.1 นับต่อจาก ป.6 */
const gradeNumberOf = (gradeId: string): number => {
  const n = Number(gradeId.replace(/\D/g, '')) || 1;
  return gradeId.startsWith('m') ? n + 6 : n;
};

const bandLabel: Record<AgeBand, string> = {
  early: 'ระดับประถมต้น',
  middle: 'ระดับประถมปลาย',
  upper: 'ระดับโต',
};

/** ปัญหาที่พบบ่อยจริงในห้องคอมพิวเตอร์ แยกตามประเภทบทเรียน */
const commonProblem: Record<LessonCategory, string> = {
  algorithm: 'ผู้เรียนบางส่วนข้ามขั้นวางแผนแล้วลงมือทันที ทำให้ต้องย้อนกลับมาแก้หลายรอบ',
  programming: 'ผู้เรียนบางส่วนแก้โปรแกรมด้วยการลองสุ่มแทนการไล่อ่านทีละบรรทัด จึงไม่รู้ว่าผิดตรงไหน',
  internet: 'ผู้เรียนบางส่วนใช้คำค้นกว้างเกินไป ทำให้ได้ผลลัพธ์จำนวนมากแต่ไม่ตรงคำถาม',
  data: 'ผู้เรียนบางส่วนเก็บข้อมูลไม่ครบหรือจดผิด ทำให้สรุปผลคลาดเคลื่อน',
  safety: 'ผู้เรียนบางส่วนยังตอบตามที่คิดว่าครูอยากได้ยิน มากกว่าสะท้อนพฤติกรรมจริงของตนเอง',
  hardware: 'อุปกรณ์บางเครื่องชำรุดหรือช้า ทำให้ผู้เรียนกลุ่มนั้นทำกิจกรรมไม่ทันเพื่อน',
};

const commonCause: Record<LessonCategory, string> = {
  algorithm: 'ยังไม่คุ้นกับการคิดเป็นลำดับก่อนลงมือ และมองว่าการวางแผนเป็นการเสียเวลา',
  programming: 'ทักษะการไล่ลำดับการทำงานยังไม่แข็งแรง จึงเลือกวิธีที่เห็นผลเร็วกว่า',
  internet: 'ยังแยกไม่ออกระหว่างคำค้นกว้างกับคำค้นเจาะจง และยังไม่คุ้นกับการเปลี่ยนคำค้น',
  data: 'ยังไม่เห็นความสำคัญของความถูกต้องของข้อมูลต้นทางว่าส่งผลถึงข้อสรุปปลายทาง',
  safety: 'เนื้อหาเป็นเรื่องพฤติกรรมส่วนตัว ผู้เรียนจึงลังเลที่จะเล่าตามจริงต่อหน้าเพื่อน',
  hardware: 'จำนวนเครื่องที่ใช้งานได้ไม่พอกับจำนวนผู้เรียน และบางเครื่องยังไม่ได้ซ่อม',
};

/**
 * สร้างร่างบันทึกหลังสอนของหนึ่งคาบ
 * ข้อความอ้างอิงชื่อเรื่องจริงของคาบนั้น จึงไม่ซ้ำกันทุกคาบ
 */
export const buildLessonRecordDraft = (source: DraftSource): StudentAssessmentMeta => {
  const band = ageBandOf(gradeNumberOf(source.gradeId));
  const category = classifyLesson({
    title: source.lessonTitle,
    unit: source.unitTitle,
  });
  const profile = getLessonProfile(category, band);
  const content = profile.content;
  const total = source.totalStudents;
  const countText = total ? `จากผู้เรียน ${total} คน ` : '';

  return {
    unitName: source.unitTitle,
    lessonTitle: source.lessonTitle,
    planNo: String(source.planNo),
    teachingDate: source.teachingDate,
    strengths: `${countText}ผู้เรียนส่วนใหญ่ร่วมกิจกรรมเรื่อง “${source.lessonTitle}” ได้ตามเป้าหมาย `
      + `และ${content.independent}`,
    problems: commonProblem[category],
    causes: commonCause[category],
    improvements: `${content.support[0]} และ${content.support[1] || 'จัดเพื่อนช่วยเพื่อนในกลุ่มที่ยังไม่คล่อง'}`,
    nextAction: `ทบทวนคำสำคัญ (${profile.vocabulary.slice(0, 3).join(' ')}) ต้นคาบหน้า `
      + `แล้วตรวจด้วยคำถาม “${content.reflect}”`,
    suggestion: `ร่างอัตโนมัติจากหัวข้อของแผนสำหรับ${bandLabel[band]} `
      + 'ครูต้องแก้ให้ตรงกับสิ่งที่เกิดขึ้นจริงในห้องก่อนเปลี่ยนสถานะเป็นฉบับสมบูรณ์',
    status: 'draft',
  };
};

/** ตรวจว่าคาบนี้ถึงกำหนดสอนแล้วหรือยัง เทียบกับวันที่ปัจจุบัน */
export const isTaughtAlready = (plannedDate: string, today = new Date()): boolean => {
  const [y, m, d] = plannedDate.split('-').map(Number);
  if (!y || !m || !d) return false;
  const planned = new Date(y, m - 1, d);
  const cutoff = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return planned <= cutoff;
};
