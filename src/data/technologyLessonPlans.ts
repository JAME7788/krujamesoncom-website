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

export type TechnologyLessonPlan = P1LessonPlan;

const gradeNumber = (gradeId: PrimaryTechnologyGradeId) => Number(gradeId.slice(1));

const indicatorText = (gradeId: PrimaryTechnologyGradeId, code: string): string => {
  const grade = findGrade(gradeId);
  return grade?.indicators.find((indicator) => indicator.code === code)?.text || code;
};

const buildSteps = (
  row: TechnologyTeachingScheduleRow,
  gradeLabel: string,
): P1PlanStep[] => [
  {
    phase: 'ขั้นนำเข้าสู่บทเรียน',
    minutes: 5,
    teacher: `นำเสนอสถานการณ์ใกล้ตัวเกี่ยวกับ “${row.lessonTitle}” แล้วตั้งคำถามให้ผู้เรียนคาดการณ์คำตอบ`,
    students: 'สังเกตสถานการณ์ เล่าประสบการณ์เดิม และบอกสิ่งที่อยากรู้ด้วยภาษาของตนเอง',
    evidence: 'คำตอบก่อนเรียนและการมีส่วนร่วมในการสนทนา',
  },
  {
    phase: 'ขั้นสร้างความเข้าใจ',
    minutes: 10,
    teacher: `อธิบายแนวคิดสำคัญของ ${row.lessonTitle} ทีละขั้น พร้อมสาธิตตัวอย่างที่เหมาะกับ${gradeLabel}`,
    students: 'ฟัง สังเกต เปรียบเทียบตัวอย่าง และตอบคำถามตรวจสอบความเข้าใจระหว่างเรียน',
    evidence: 'คำตอบปากเปล่า บันทึกสั้น และผลคำถามระหว่างเรียน',
  },
  {
    phase: 'ขั้นฝึกปฏิบัติแบบมีผู้ชี้แนะ',
    minutes: 15,
    teacher: `สาธิตภารกิจ จากนั้นให้คำใบ้เป็นลำดับโดยไม่บอกคำตอบทั้งหมด: ${row.learningActivity}`,
    students: 'ลงมือทำตามขั้นตอนเป็นคู่ อธิบายเหตุผลให้เพื่อนฟัง ตรวจสอบผล และแก้ไขเมื่อพบข้อผิดพลาด',
    evidence: row.evidence,
  },
  {
    phase: 'ขั้นประยุกต์ใช้ด้วยตนเอง',
    minutes: 15,
    teacher: 'มอบโจทย์ระดับพื้นฐานและโจทย์ท้าทาย สังเกตการทำงาน และบันทึกหลักฐาน K/P/A รายคน',
    students: 'เลือกวิธีทำงาน สร้างชิ้นงานหรือคำตอบ ทดสอบผล ปรับปรุง และขอความช่วยเหลือเมื่อจำเป็น',
    evidence: `ชิ้นงานรายบุคคล ภาพหน้าจอ หรือใบงานประจำชั่วโมงที่ ${row.period}`,
  },
  {
    phase: 'ขั้นสรุปและสะท้อนการเรียนรู้',
    minutes: 5,
    teacher: 'ทบทวนคำสำคัญ ให้ผู้เรียนตอบบัตรออกจากห้อง และแจ้งสิ่งที่จะเรียนต่อในคาบถัดไป',
    students: 'สรุปสิ่งที่เรียนรู้หนึ่งข้อ บอกสิ่งที่ทำได้และสิ่งที่ต้องฝึกเพิ่ม แล้วส่งหลักฐานก่อนออกจากห้อง',
    evidence: 'บัตรออกจากห้องและการประเมินตนเอง',
  },
];

const buildAssessments = (): P1PlanAssessment[] => [
  {
    domain: 'K',
    method: 'ถามตอบระหว่างเรียน แบบฝึกหรือแบบทดสอบท้ายคาบ',
    instrument: 'แบบทดสอบตามตัวชี้วัดและแบบตรวจคำตอบ',
    criteria: 'ตอบถูกอย่างน้อยร้อยละ 60 และอธิบายแนวคิดด้วยภาษาของตนเองได้',
    webRecord: 'คะแนนแบบทดสอบและกิจกรรมความรู้ถูกบันทึกเข้าหลักฐาน K อัตโนมัติ',
  },
  {
    domain: 'P',
    method: 'สังเกตขั้นตอนการปฏิบัติและตรวจชิ้นงาน',
    instrument: 'รูบริก P 4 ระดับ: ไม่ผ่าน พอใช้ ปานกลาง และดีมาก',
    criteria: 'ปฏิบัติครบขั้นตอน ทดสอบผล และปรับปรุงงานจนใช้งานได้',
    webRecord: 'กิจกรรมในเว็บ ชิ้นงาน และคะแนนรูบริกถูกรวมเป็นหลักฐาน P โดยไม่เกินคะแนนเต็ม',
  },
  {
    domain: 'A',
    method: 'สังเกตความรับผิดชอบ ความเพียร การทำงานร่วมกัน และการใช้เทคโนโลยีอย่างปลอดภัย',
    instrument: 'แบบสังเกตพฤติกรรมรายบุคคล',
    criteria: 'แสดงพฤติกรรมที่กำหนดอย่างสม่ำเสมออย่างน้อย 3 ใน 4 รายการ',
    webRecord: 'การเข้าเรียน ความสม่ำเสมอ และความพยายามเป็นข้อมูลประกอบ A โดยครูยืนยันผล',
  },
];

const buildGeneratedPlan = (
  gradeId: PrimaryTechnologyGradeId,
  row: TechnologyTeachingScheduleRow,
): TechnologyLessonPlan => {
  const number = gradeNumber(gradeId);
  const gradeLabel = `ชั้นประถมศึกษาปีที่ ${number}`;
  const descriptions = row.indicators.map((code) => indicatorText(gradeId, code));

  return {
    no: row.period,
    unitNo: row.unitNo,
    title: row.lessonTitle,
    weeks: `สัปดาห์ที่ ${row.week}`,
    hours: 1,
    indicators: row.indicators,
    essentialQuestion: `เราจะใช้ความรู้เรื่อง “${row.lessonTitle}” แก้ปัญหาหรือสร้างผลงานให้ดีขึ้นได้อย่างไร`,
    concept: `${row.lessonTitle} เป็นส่วนหนึ่งของหน่วย ${row.unitTitle} ผู้เรียนต้องเข้าใจแนวคิด เลือกวิธีทำงานอย่างเป็นขั้นตอน ลงมือปฏิบัติ ตรวจสอบผล และอธิบายเหตุผลได้เหมาะสมกับวัย`,
    vocabulary: [
      row.unitTitle,
      row.lessonTitle,
      'ขั้นตอน',
      'ตรวจสอบ',
      'ปรับปรุง',
    ].filter((value, index, values) => value && values.indexOf(value) === index),
    objectives: [
      {
        domain: 'K',
        text: `อธิบายความหมาย หลักการ หรือตัวอย่างของ ${row.lessonTitle} ได้ถูกต้อง`,
      },
      {
        domain: 'P',
        text: `ปฏิบัติภารกิจ “${row.learningActivity}” ตามขั้นตอน พร้อมตรวจสอบและปรับปรุงผลงานได้`,
      },
      {
        domain: 'A',
        text: 'มีวินัย ใฝ่เรียนรู้ รับผิดชอบ ใช้อุปกรณ์อย่างปลอดภัย และรับฟังความคิดเห็นของผู้อื่น',
      },
    ],
    content: [
      ...descriptions,
      `แนวคิดสำคัญของบทเรียน: ${row.lessonTitle}`,
      `การนำไปใช้: ${row.learningActivity}`,
      'การตรวจสอบผลและอธิบายเหตุผลจากหลักฐาน',
    ],
    steps: buildSteps(row, gradeLabel),
    media: [
      { label: 'สไลด์บทเรียนในเว็บ' },
      { label: 'เกมหรือกิจกรรมฝึกทักษะที่เชื่อมตัวชี้วัด' },
      { label: 'ใบงานประจำชั่วโมงและบัตรออกจากห้อง' },
    ],
    worksheet: `ใบงานชั่วโมงที่ ${row.period}: ${row.lessonTitle}`,
    product: row.evidence,
    checkQuestions: [
      `${row.lessonTitle} หมายถึงอะไร อธิบายด้วยภาษาของตนเอง`,
      'ขั้นตอนสำคัญของภารกิจวันนี้มีอะไรบ้าง',
      'เราตรวจสอบได้อย่างไรว่าคำตอบหรือชิ้นงานถูกต้อง',
      'ถ้าผลยังไม่สำเร็จ ควรย้อนกลับไปแก้ไขขั้นตอนใด เพราะอะไร',
      'ความรู้นี้นำไปใช้ในชีวิตประจำวันหรือวิชาอื่นได้อย่างไร',
    ],
    assessments: buildAssessments(),
    support: [
      'ผู้เรียนที่ต้องการความช่วยเหลือใช้บัตรภาพ ตัวอย่างสำเร็จ และคำใบ้ทีละขั้น',
      'จัดเพื่อนช่วยเพื่อนโดยสลับบทบาทผู้ปฏิบัติและผู้ตรวจสอบ',
      'ผู้เรียนที่ทำได้เร็วรับโจทย์ท้าทายที่ต้องอธิบายเหตุผลหรือสร้างวิธีใหม่',
    ],
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
