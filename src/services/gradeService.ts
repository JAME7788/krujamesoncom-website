// ระบบเก็บคะแนน K/P/A ต่อตัวชี้วัด — เลียนแบบไฟล์ Excel "คมด.เก็บคะแนนV.2 2568"
//
// โครงสร้าง:
//   - แต่ละห้อง (ป.1, ป.2, ...) มีตัวชี้วัด ว 4.2 ป.1/1, ป.1/2, ... (สำหรับ cs)
//                                   ว 4.1 ม.1/1, ม.1/2, ...     (สำหรับ dt)
//   - ต่อตัวชี้วัดเก็บ K(คะแนน 0-15), P(พอใช้/ปานกลาง/ดี), A(boolean)
//   - คำนวณคะแนนรวม + เกรด อัตโนมัติ

import { db } from './firebase';
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { allClassrooms2569 } from '../data/students2569';

export type Skill = 'พอใช้' | 'ปานกลาง' | 'ดี';
export const ACADEMIC_YEAR = '2569';
export const COURSE_TEACHER_NAME = 'นายอนันตชัย เพ็ชรรี่';

export interface IndicatorScore {
  k: number;        // คะแนนความรู้ 0-15 (จากการทำควิซ ครูแก้ได้)
  maxK: number;     // คะแนนเต็ม (default 15)
  p: Skill;         // ทักษะ
  a: boolean;       // จิตพิสัย/คุณลักษณะ
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
    { id: 'cs_p1_1', code: 'ว 4.2 ป.1/1', title: 'แก้ปัญหาอย่างง่ายโดยใช้การลองผิดลองถูก', maxScore: 15 },
    { id: 'cs_p1_2', code: 'ว 4.2 ป.1/2', title: 'แสดงลำดับขั้นตอนการทำงาน', maxScore: 15 },
    { id: 'cs_p1_3', code: 'ว 4.2 ป.1/3', title: 'เขียนโปรแกรมอย่างง่ายโดยใช้ซอฟต์แวร์/สื่อ', maxScore: 15 },
    { id: 'cs_p1_4', code: 'ว 4.2 ป.1/4', title: 'ใช้เทคโนโลยีในการสร้าง จัดเก็บ เรียกใช้ข้อมูล', maxScore: 15 },
    { id: 'cs_p1_5', code: 'ว 4.2 ป.1/5', title: 'ใช้เทคโนโลยีอย่างปลอดภัย', maxScore: 15 },
  ],
  'ป.2': [
    { id: 'cs_p2_1', code: 'ว 4.2 ป.2/1', title: 'แสดงลำดับขั้นตอนแก้ปัญหา', maxScore: 15 },
    { id: 'cs_p2_2', code: 'ว 4.2 ป.2/2', title: 'เขียนโปรแกรมอย่างง่ายโดยใช้สื่อ', maxScore: 15 },
    { id: 'cs_p2_3', code: 'ว 4.2 ป.2/3', title: 'ใช้เทคโนโลยีค้นหาข้อมูล', maxScore: 15 },
    { id: 'cs_p2_4', code: 'ว 4.2 ป.2/4', title: 'ใช้เทคโนโลยีอย่างปลอดภัย', maxScore: 15 },
  ],
  'ป.3': [
    { id: 'cs_p3_1', code: 'ว 4.2 ป.3/1', title: 'แสดงอัลกอริทึมแก้ปัญหา', maxScore: 15 },
    { id: 'cs_p3_2', code: 'ว 4.2 ป.3/2', title: 'เขียนโปรแกรมโดยใช้สื่อ', maxScore: 15 },
    { id: 'cs_p3_3', code: 'ว 4.2 ป.3/3', title: 'ใช้อินเทอร์เน็ตค้นหาความรู้', maxScore: 15 },
    { id: 'cs_p3_4', code: 'ว 4.2 ป.3/4', title: 'รวบรวมและประมวลผลข้อมูล', maxScore: 15 },
    { id: 'cs_p3_5', code: 'ว 4.2 ป.3/5', title: 'ใช้เทคโนโลยีอย่างปลอดภัย', maxScore: 15 },
  ],
  'ป.4': [
    { id: 'cs_p4_1', code: 'ว 4.2 ป.4/1', title: 'ใช้เหตุผลเชิงตรรกะ', maxScore: 15 },
    { id: 'cs_p4_2', code: 'ว 4.2 ป.4/2', title: 'ออกแบบและเขียนโปรแกรมอย่างง่าย', maxScore: 15 },
    { id: 'cs_p4_3', code: 'ว 4.2 ป.4/3', title: 'ใช้อินเทอร์เน็ตค้นหา/ประเมินข้อมูล', maxScore: 15 },
    { id: 'cs_p4_4', code: 'ว 4.2 ป.4/4', title: 'รวบรวมประเมินนำเสนอข้อมูล', maxScore: 15 },
    { id: 'cs_p4_5', code: 'ว 4.2 ป.4/5', title: 'ใช้เทคโนโลยีอย่างปลอดภัย เคารพสิทธิ', maxScore: 15 },
  ],
  'ป.5': [
    { id: 'cs_p5_1', code: 'ว 4.2 ป.5/1', title: 'ใช้เหตุผลเชิงตรรกะแก้ปัญหา', maxScore: 15 },
    { id: 'cs_p5_2', code: 'ว 4.2 ป.5/2', title: 'ออกแบบ/เขียนโปรแกรมที่มีเงื่อนไข', maxScore: 15 },
    { id: 'cs_p5_3', code: 'ว 4.2 ป.5/3', title: 'ใช้อินเทอร์เน็ตค้นหาข้อมูล', maxScore: 15 },
    { id: 'cs_p5_4', code: 'ว 4.2 ป.5/4', title: 'รวบรวม/ประเมิน/นำเสนอข้อมูล', maxScore: 15 },
    { id: 'cs_p5_5', code: 'ว 4.2 ป.5/5', title: 'ใช้เทคโนโลยีอย่างปลอดภัย', maxScore: 15 },
  ],
  'ป.6': [
    { id: 'cs_p6_1', code: 'ว 4.2 ป.6/1', title: 'ใช้เหตุผลเชิงตรรกะแก้ปัญหาซับซ้อน', maxScore: 15 },
    { id: 'cs_p6_2', code: 'ว 4.2 ป.6/2', title: 'ออกแบบ/เขียนโปรแกรมที่มีการทำซ้ำ', maxScore: 15 },
    { id: 'cs_p6_3', code: 'ว 4.2 ป.6/3', title: 'ใช้อินเทอร์เน็ตอย่างมีวิจารณญาณ', maxScore: 15 },
    { id: 'cs_p6_4', code: 'ว 4.2 ป.6/4', title: 'นำเสนอข้อมูลเปรียบเทียบความน่าเชื่อถือ', maxScore: 15 },
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

export const saveGrades = (classroom: string, grades: StudentGrade[], subject: Subject = 'main') => {
  try {
    localStorage.setItem(storageKey(classroom, subject), JSON.stringify(grades));
    syncClassroomToFirebase(classroom, grades, subject);
  } catch (e) {
    console.warn('saveGrades failed', e);
  }
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
  student.indicators[indicatorId] = {
    ...cur,
    ...patch,
    pAssessed: patch.p !== undefined ? true : cur.pAssessed,
    aAssessed: patch.a !== undefined ? true : cur.aAssessed,
    updatedAt: Date.now(),
  };
  student.updatedAt = Date.now();
  saveGrades(classroom, grades, subject);
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
  saveGrades(classroom, grades, subject);
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
  saveGrades(classroom, grades, subject);
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
  createdAt: number;
}

export type ManualAssessmentScores = Record<string, Record<string, number>>;

const ASSESSMENT_PREFIX = 'krujames_manual_assessments_v1_';
const ASSESSMENT_SCORE_PREFIX = 'krujames_manual_assessment_scores_v1_';

const assessmentKey = (classroom: string, subject: Subject = 'main') =>
  `${ASSESSMENT_PREFIX}${classroom}_${subject}`;

const assessmentScoreKey = (classroom: string, subject: Subject = 'main') =>
  `${ASSESSMENT_SCORE_PREFIX}${classroom}_${subject}`;

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

const skillFromRatio = (ratio: number): Skill => {
  if (ratio >= 0.8) return 'ดี';
  if (ratio >= 0.5) return 'ปานกลาง';
  return 'พอใช้';
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
      if (related.length === 0) return;

      const current = student.indicators[indicator.id] || emptyIndicatorScore(indicator.maxScore);
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

        if (max <= 0) return;
        const ratio = Math.max(0, Math.min(1, earned / max));
        if (category === 'k') {
          next = { ...next, k: Math.round(ratio * indicator.maxScore), maxK: indicator.maxScore };
        } else {
          next = { ...next, p: skillFromRatio(ratio), pAssessed: true };
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

  if (studentsUpdated > 0) saveGrades(classroom, grades, subject);
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
    subjects.forEach((subj) => {
      // initClassroom จะสร้างข้อมูลจาก roster ถ้ายังไม่มี
      let grades = loadGrades(classroom, subj.id);
      if (grades.length === 0) {
        grades = initClassroom(classroom, subj.id);
      }
      const indicators = getIndicators(classroom, subj.id);
      // หา indicator id ที่ unit 1 มี
      const unit1Indicators = indicators.filter((ind) => {
        const units = findUnitsForIndicator(ind.id);
        return units.some((u) => u.unitNo === 1);
      });
      if (unit1Indicators.length === 0) return;

      grades.forEach((g) => {
        unit1Indicators.forEach((ind) => {
          const existing = g.indicators[ind.id] || emptyIndicatorScore(ind.maxScore);
          // ใส่เฉพาะที่ยังเป็น default (P=ปานกลาง คือ default ของ emptyIndicatorScore)
          // → seed เฉพาะรายการที่ A=true (default) — ไม่ทับงานที่ครูแก้แล้ว
          g.indicators[ind.id] = {
            ...existing,
            p: defaultP,
            a: defaultA,
            updatedAt: Date.now(),
          };
        });
        g.updatedAt = Date.now();
      });
      saveGrades(classroom, grades, subj.id);
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
    const pRatio = s.pAssessed ? P_POINTS[s.p] / 3 : 0;
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
    const docId = subject === 'main' ? classroom : `${classroom}_${subject}`;
    const ref = doc(db, 'grades', docId);
    await setDoc(ref, { classroom, subject, students: grades, updatedAt: Date.now() }, { merge: true });
  } catch (e) {
    console.debug('grade sync skipped', e);
  }
};

export const fetchClassroomFromFirebase = async (
  classroom: string, subject: Subject = 'main'
): Promise<StudentGrade[] | null> => {
  if (!firebaseAvailable()) return null;
  try {
    const docId = subject === 'main' ? classroom : `${classroom}_${subject}`;
    const ref = doc(db, 'grades', docId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as { students?: StudentGrade[] } | undefined;
      return data?.students || null;
    }
  } catch (e) {
    console.debug('grade fetch failed', e);
  }
  return null;
};

// ---------- Sync K from progress (เชื่อมกับ quiz score อัตโนมัติ) ----------

import { grades as curriculumGrades } from '../data/curriculum';
import { loadSchedule, isInClassTime } from '../data/schedule';
import type { StudentProgressData, ActivityLog } from './progressService';

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

/** ดึง progress data จาก localStorage ของ studentId */
const loadProgressData = (studentId: string): StudentProgressData | null => {
  try {
    const raw = localStorage.getItem(`krujames_progress_${studentId}`);
    if (!raw) return null;
    return JSON.parse(raw) as StudentProgressData;
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

  // 2+3) scan all progress keys
  const cleanedName = name.replace(/\s/g, '').toLowerCase();
  const nameTokens = name.split(/\s+/).filter((t) => t.length > 1);

  let numberMatch: { progress: StudentProgressData; key: string } | null = null;
  let nameMatch: { progress: StudentProgressData; key: string } | null = null;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith('krujames_progress_')) continue;

    // key format: krujames_progress_{classroom}_{studentNumber}_{nameNoSpace}
    const idPart = key.slice('krujames_progress_'.length);
    const parts = idPart.split('_');
    if (parts.length < 3) continue;
    const [keyClass, keyNo, ...keyNameParts] = parts;
    if (keyClass !== classroom) continue;

    const keyName = keyNameParts.join('_').toLowerCase();

    // 2) match เลขที่
    if (parseInt(keyNo) === studentNo) {
      try {
        const prog = JSON.parse(localStorage.getItem(key) || 'null');
        if (prog) numberMatch = { progress: prog, key };
      } catch (e) {
        console.error('Failed to parse progress', e);
      }
    }

    // 3) match ชื่อ (ถ้ามี token ของชื่อจริงอยู่ใน key)
    if (!numberMatch) {
      const matchToken =
        keyName === cleanedName ||
        nameTokens.some((t) => keyName.includes(t.toLowerCase())) ||
        cleanedName.includes(keyName) ||
        keyName.includes(cleanedName);
      if (matchToken) {
        try {
          const prog = JSON.parse(localStorage.getItem(key) || 'null');
          if (prog) nameMatch = { progress: prog, key };
        } catch (e) {
          console.error('Failed to parse progress', e);
        }
      }
    }
  }

  if (numberMatch) return { progress: numberMatch.progress, matchedKey: numberMatch.key, matchType: 'number' };
  if (nameMatch) return { progress: nameMatch.progress, matchedKey: nameMatch.key, matchType: 'name' };
  return null;
};

/** สำหรับ diagnostic: นับจำนวน progress key ใน localStorage แยกตามห้อง */
export const diagnoseProgress = (
  classroom: string
): { totalKeys: number; classroomKeys: string[] } => {
  const all: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('krujames_progress_')) {
      all.push(key.slice('krujames_progress_'.length));
    }
  }
  const inClass = all.filter((k) => k.startsWith(classroom + '_'));
  return { totalKeys: all.length, classroomKeys: inClass };
};

const progressBelongsToClassroom = (
  data: StudentProgressData,
  studentId: string,
  classroom: string
) => {
  const id = data.studentId || studentId;
  if (id.startsWith(`${classroom}_`)) return true;
  const maybeClassroom = (data as StudentProgressData & { classroom?: string }).classroom;
  return maybeClassroom === classroom;
};

const saveProgressForSync = (data: StudentProgressData, fallbackId: string) => {
  const studentId = data.studentId || fallbackId;
  if (!studentId) return false;
  try {
    localStorage.setItem(`krujames_progress_${studentId}`, JSON.stringify({ ...data, studentId }));
    return true;
  } catch (e) {
    console.warn('save progress from firebase failed', e);
    return false;
  }
};

export const hydrateProgressFromFirebase = async (
  classroom: string
): Promise<{ available: boolean; downloaded: number; error?: string }> => {
  if (!firebaseAvailable()) {
    return { available: false, downloaded: 0, error: 'Firebase is not configured' };
  }
  try {
    const snap = await getDocs(collection(db, 'progress'));
    let downloaded = 0;
    snap.forEach((d) => {
      const data = d.data() as StudentProgressData;
      const studentId = data.studentId || d.id;
      if (!progressBelongsToClassroom(data, studentId, classroom)) return;
      if (saveProgressForSync(data, studentId)) downloaded += 1;
    });
    return { available: true, downloaded };
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
  subject: Subject = 'main'
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

    // ============ P = ทักษะที่เกี่ยวกับตัวชี้วัด ============
    // นับการลงมือทำ — เน้น hands-on (เกม) > วิดีโอ > สไลด์
    let skillPoints = 0;

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

      // P: skill points = เกม ×3 + วิดีโอ ×2 + สไลด์ ×1 + บทความ ×1
      skillPoints +=
        (u.funClicked?.length || 0) * 3 +
        (u.videosClicked?.length || 0) * 2 +
        (u.slidesViewed?.length || 0) +
        (u.articlesClicked?.length || 0);
    });

    if (unitsWithData === 0) return;

    // K: ระดับความรู้
    const k =
      totalQuizMax > 0
        ? Math.round((totalQuizScore / totalQuizMax) * ind.maxScore)
        : student.indicators[ind.id]?.k || 0;

    // P: ระดับทักษะ — เกณฑ์ตามคะแนน skill points
    // ≥ 15 → ดี (ลงมือเยอะ), ≥ 5 → ปานกลาง, < 5 → พอใช้
    const p: Skill = skillPoints >= 15 ? 'ดี' : skillPoints >= 5 ? 'ปานกลาง' : 'พอใช้';

    // ============ A = จิตพิสัย ============
    // เกณฑ์: เข้าเรียนในเวลาเรียน (ตาราง) + เข้าหน่วยที่เกี่ยวกับตัวชี้วัดนี้บ่อย
    // นับจำนวน "วันที่แตกต่างกัน" ที่นักเรียนทำกิจกรรมในเวลาเรียน
    const inClassDays = new Set<string>();
    allActivities.forEach((act: ActivityLog) => {
      // 1) ต้องเป็นกิจกรรมในหน่วยที่ link กับตัวชี้วัดนี้
      const actKey = `${act.gradeId}_${act.unitNo}`;
      if (!linkedUnitKeys.has(actKey)) return;
      // 2) ต้องอยู่ในเวลาเรียนของห้องนี้
      if (!isInClassTime(act.timestamp, classroom, schedule)) return;
      // 3) นับเป็นวัน
      const d = new Date(act.timestamp);
      const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      inClassDays.add(dayKey);
    });

    // A = true ถ้าเข้าเรียนในเวลาเรียนของหน่วยนี้ ≥ 2 วันที่ต่างกัน
    // (แสดงว่ามาเรียนสม่ำเสมอ ไม่ใช่ทำตอนนอกเวลาอย่างเดียว)
    const a = inClassDays.size >= 2;

    student.indicators[ind.id] = {
      ...student.indicators[ind.id],
      k,
      maxK: ind.maxScore,
      p,
      a,
      pAssessed: true,
      aAssessed: true,
      updatedAt: Date.now(),
    };
    changed += 1;
  });

  if (changed > 0) {
    student.updatedAt = Date.now();
    saveGrades(classroom, grades, subject);
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
