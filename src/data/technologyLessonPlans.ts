import { findGrade } from './curriculum';
import {
  buildTechnologyTeachingSchedule,
  PRIMARY_TECHNOLOGY_GRADE_IDS,
  type PrimaryTechnologyGradeId,
  type TechnologyTeachingScheduleRow,
} from './technologyTeachingSchedule';
import {
  p1LessonPlans,
  type P1LessonPlan,
  type P1PlanAssessment,
  type P1PlanStep,
} from './p1TechnologyPlan';
import {
  ageBandOf,
  classifyLesson,
  getLessonProfile,
  type AgeBand,
  type LessonCategory,
} from './lessonContentProfiles';

export type TechnologyLessonPlan = P1LessonPlan;

const gradeNumber = (gradeId: PrimaryTechnologyGradeId) => Number(gradeId.slice(1));

const indicatorText = (gradeId: PrimaryTechnologyGradeId, code: string): string => {
  const grade = findGrade(gradeId);
  return grade?.indicators.find((indicator) => indicator.code === code)?.text || code;
};

type Profile = ReturnType<typeof getLessonProfile>;

/**
 * ขั้นสอนถูกสร้างจาก "ประเภทบทเรียน × ช่วงวัย" ไม่ใช่เทมเพลตกลางอันเดียว
 * บทเรียนเรื่องความปลอดภัยกับเรื่องเขียนโปรแกรมจึงมีกิจกรรมคนละแบบจริง
 */
const buildSteps = (
  row: TechnologyTeachingScheduleRow,
  profile: Profile,
): P1PlanStep[] => {
  const c = profile.content;
  return [
    {
      phase: 'ขั้นนำเข้าสู่บทเรียน',
      minutes: 5,
      teacher: c.hook,
      students: 'สังเกตสถานการณ์ เล่าประสบการณ์เดิม และคาดการณ์คำตอบด้วยภาษาของตนเอง',
      evidence: 'คำตอบก่อนเรียนและการมีส่วนร่วมในการสนทนา',
    },
    {
      phase: 'ขั้นสร้างความเข้าใจ',
      minutes: 10,
      teacher: c.concept,
      students: `ฟัง สังเกตการสาธิต จดคำสำคัญ (${profile.vocabulary.slice(0, 3).join(' ')}) และตอบคำถามตรวจสอบความเข้าใจ`,
      evidence: 'คำตอบปากเปล่าและบันทึกคำสำคัญระหว่างเรียน',
    },
    {
      phase: 'ขั้นฝึกปฏิบัติแบบมีผู้ชี้แนะ',
      minutes: 15,
      teacher: `นำผู้เรียนทำภารกิจต่อไปนี้โดยให้คำใบ้ทีละขั้นแทนการบอกคำตอบ: ${c.guided}`,
      students: `ลงมือทำเป็นคู่ อธิบายเหตุผลให้เพื่อนฟัง และแก้ไขเมื่อผลไม่เป็นไปตามที่คาด (เชื่อมกับกิจกรรมของหน่วย: ${row.learningActivity})`,
      evidence: row.evidence,
    },
    {
      phase: 'ขั้นประยุกต์ใช้ด้วยตนเอง',
      minutes: 15,
      teacher: 'มอบโจทย์พื้นฐานและโจทย์ท้าทาย เดินสังเกตรายคน และบันทึกหลักฐาน K/P/A ระหว่างปฏิบัติ',
      students: c.independent,
      evidence: `${c.product} (ชั่วโมงที่ ${row.period})`,
    },
    {
      phase: 'ขั้นสรุปและสะท้อนการเรียนรู้',
      minutes: 5,
      teacher: `ทบทวนคำสำคัญ ตั้งคำถามสะท้อนการเรียนรู้: “${c.reflect}” แล้วแจ้งสิ่งที่จะเรียนต่อ`,
      students: 'สรุปสิ่งที่เรียนรู้ 1 ข้อ บอกสิ่งที่ทำได้และสิ่งที่ต้องฝึกเพิ่ม แล้วส่งบัตรออกจากห้อง',
      evidence: 'บัตรออกจากห้องและการประเมินตนเอง',
    },
  ];
};

/** เกณฑ์ประเมินอิงเรื่องที่สอนและวัย ไม่ใช่ข้อความกลางที่ใช้ได้กับทุกแผน */
const buildAssessments = (profile: Profile): P1PlanAssessment[] => {
  const c = profile.content;
  return [
    {
      domain: 'K',
      method: profile.kMethod,
      instrument: 'แบบทดสอบหรือคำถามตรวจสอบความเข้าใจตามตัวชี้วัด',
      criteria: c.kCriteria,
      webRecord: 'คะแนนแบบทดสอบและกิจกรรมความรู้ในเว็บถูกบันทึกเข้าหลักฐาน K อัตโนมัติ',
    },
    {
      domain: 'P',
      method: profile.pMethod,
      instrument: 'รูบริก P 4 ระดับ: ไม่ผ่าน พอใช้ ปานกลาง และดีมาก',
      criteria: c.pCriteria,
      webRecord: 'กิจกรรมในเว็บ ชิ้นงาน และคะแนนรูบริกถูกรวมเป็นหลักฐาน P โดยไม่เกินคะแนนเต็ม',
    },
    {
      domain: 'A',
      method: profile.aMethod,
      instrument: 'แบบสังเกตพฤติกรรมรายบุคคล',
      criteria: c.aCriteria,
      webRecord: 'การเข้าเรียนในคาบและความสม่ำเสมอเป็นข้อมูลประกอบ A โดยครูยืนยันผล',
    },
  ];
};

const buildGeneratedPlan = (
  gradeId: PrimaryTechnologyGradeId,
  row: TechnologyTeachingScheduleRow,
): TechnologyLessonPlan => {
  const number = gradeNumber(gradeId);
  const gradeLabel = `ชั้นประถมศึกษาปีที่ ${number}`;
  const descriptions = row.indicators.map((code) => indicatorText(gradeId, code));

  // จัดประเภทบทเรียนจากชื่อเรื่อง หน่วย และคำอธิบายตัวชี้วัด แล้วเลือกเนื้อหาให้ตรงวัย
  const category: LessonCategory = classifyLesson({
    title: row.lessonTitle,
    unit: row.unitTitle,
    indicators: descriptions,
    activity: row.learningActivity,
  });
  const band: AgeBand = ageBandOf(number);
  const profile = getLessonProfile(category, band);
  const c = profile.content;

  return {
    no: row.period,
    unitNo: row.unitNo,
    title: row.lessonTitle,
    weeks: `สัปดาห์ที่ ${row.week}`,
    hours: 1,
    indicators: row.indicators,
    // ต่างจากคำถามสะท้อนท้ายคาบ (c.reflect) — อันนี้เป็นคำถามกรอบของทั้งแผน
    essentialQuestion: `เราจะใช้ความรู้เรื่อง “${row.lessonTitle}” กับงาน${profile.label}ให้ได้ผลดีขึ้นอย่างไร`,
    concept: `${row.lessonTitle} อยู่ในหน่วย ${row.unitTitle} จัดอยู่ในกลุ่ม${profile.label} `
      + `สำหรับ${gradeLabel} เน้นให้ผู้เรียน${c.independent}`,
    vocabulary: [
      ...profile.vocabulary,
      row.lessonTitle,
    ].filter((value, index, values) => value && values.indexOf(value) === index),
    objectives: [
      {
        domain: 'K',
        text: `อธิบายความหมาย หลักการ หรือตัวอย่างของ ${row.lessonTitle} ได้ถูกต้อง`,
      },
      {
        domain: 'P',
        text: c.independent,
      },
      {
        domain: 'A',
        text: c.aCriteria,
      },
    ],
    content: [
      ...descriptions,
      `แนวคิดสำคัญของบทเรียน: ${row.lessonTitle}`,
      `การนำไปใช้: ${row.learningActivity}`,
      'การตรวจสอบผลและอธิบายเหตุผลจากหลักฐาน',
    ],
    steps: buildSteps(row, profile),
    media: [
      { label: 'สไลด์บทเรียนในเว็บ' },
      { label: `เกมหรือกิจกรรมฝึก${profile.label}ที่เชื่อมตัวชี้วัด` },
      { label: 'ใบงานประจำชั่วโมงและบัตรออกจากห้อง' },
    ],
    worksheet: `ใบงานชั่วโมงที่ ${row.period}: ${row.lessonTitle}`,
    product: c.product,
    checkQuestions: [
      `${row.lessonTitle} หมายถึงอะไร อธิบายด้วยภาษาของตนเอง`,
      ...c.questions,
    ].filter((value, index, values) => values.indexOf(value) === index),
    assessments: buildAssessments(profile),
    support: c.support,
    researchEvidence: [
      'คะแนนก่อนเรียนและหลังเรียนตามตัวชี้วัด',
      'เวลาปฏิบัติ จำนวนครั้งที่ลอง และการแก้ไขข้อผิดพลาด',
      'ชิ้นงาน รูบริก P แบบสังเกต A และบัตรสะท้อนการเรียนรู้',
    ],
  };
};

export const getTechnologyLessonPlans = (
  gradeId: PrimaryTechnologyGradeId,
): TechnologyLessonPlan[] => {
  if (gradeId === 'p1') {
    return p1LessonPlans.map((plan) => ({
      ...plan,
      checkQuestions: [
        ...plan.checkQuestions,
        'เราตรวจสอบได้อย่างไรว่าคำตอบหรือชิ้นงานถูกต้อง',
        'ความรู้นี้นำไปใช้ในชีวิตประจำวันได้อย่างไร',
      ].filter((question, index, questions) => questions.indexOf(question) === index),
    }));
  }
  return buildTechnologyTeachingSchedule(gradeId).rows
    .map((row) => buildGeneratedPlan(gradeId, row));
};

export const getAllTechnologyLessonPlans = (): Record<PrimaryTechnologyGradeId, TechnologyLessonPlan[]> => (
  Object.fromEntries(
    PRIMARY_TECHNOLOGY_GRADE_IDS.map((gradeId) => [
      gradeId,
      getTechnologyLessonPlans(gradeId),
    ]),
  ) as Record<PrimaryTechnologyGradeId, TechnologyLessonPlan[]>
);
