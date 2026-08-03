import { findGrade, type Grade, type Unit } from './curriculum';
import {
  p1AnnualUnits,
  p1LessonPlans,
  type P1LessonPlan,
} from './p1TechnologyPlan';

export type PrimaryTechnologyGradeId = 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6';
export type SecondaryComputingGradeId = 'm1' | 'm2' | 'm3';
export type TechnologyGradeId = PrimaryTechnologyGradeId | SecondaryComputingGradeId;

export interface TechnologyTeachingScheduleRow {
  period: number;
  week: number;
  semester: 1 | 2;
  unitNo: number;
  unitTitle: string;
  lessonTitle: string;
  indicators: string[];
  learningActivity: string;
  evidence: string;
  assessment: string;
}

export interface TechnologyTeachingScheduleUnit {
  no: number;
  title: string;
  hours: number;
  indicators: string[];
  keyEvidence: string;
}

export interface TechnologyTeachingSchedule {
  gradeId: TechnologyGradeId;
  gradeLabel: string;
  fullGradeLabel: string;
  courseCode: string;
  courseName: string;
  weeklySlot: string;
  totalHours: number;
  description: string;
  focus: string[];
  rows: TechnologyTeachingScheduleRow[];
  units: TechnologyTeachingScheduleUnit[];
}

export const PRIMARY_TECHNOLOGY_GRADE_IDS: PrimaryTechnologyGradeId[] = [
  'p1',
  'p2',
  'p3',
  'p4',
  'p5',
  'p6',
];

export const TECHNOLOGY_GRADE_IDS: TechnologyGradeId[] = [
  ...PRIMARY_TECHNOLOGY_GRADE_IDS,
  'm1',
  'm2',
  'm3',
];

// หมายเหตุ: ตารางชุดนี้ใช้พิมพ์ลงหัวแผนการสอน ต้องตรงกับ src/data/schedule.ts เสมอ
// (คนละชุดกัน ถ้าแก้ที่เดียวจะทำให้เอกสารที่พิมพ์ออกมาไม่ตรงกับที่ระบบใช้คิดคะแนน)
const WEEKLY_SLOTS: Record<TechnologyGradeId, string> = {
  p1: 'วันพฤหัสบดี 13:00-14:00 น.',
  p2: 'วันจันทร์ 13:50-14:40 น.',
  p3: 'วันศุกร์ 11:00-11:50 น.',
  p4: 'วันพุธ 09:20-10:10 น.',
  p5: 'วันพุธ 13:50-14:40 น.',
  p6: 'วันพฤหัสบดี 11:00-11:50 น.',
  m1: 'วันจันทร์ 08:30-09:20 น.',
  m2: 'วันศุกร์ 10:10-11:00 น.',
  m3: 'วันพฤหัสบดี 09:20-10:10 น.',
};

const gradeNumber = (gradeId: TechnologyGradeId) => Number(gradeId.slice(1));

const courseCode = (gradeId: TechnologyGradeId) => (
  `${gradeId.startsWith('p') ? 'ว1' : 'ว2'}${gradeNumber(gradeId)}101`
);

export const curriculumGradeIdForTechnology = (gradeId: TechnologyGradeId) => (
  gradeId.startsWith('m') ? `${gradeId}-cs` : gradeId
);

const allocatePeriods = (units: Unit[], total: number): number[] => {
  if (units.length === 0) return [];

  const weights = units.map((unit) => Math.max(1, unit.topics?.length || 1));
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
  const allocated = weights.map((weight) => Math.max(1, Math.floor((total * weight) / weightTotal)));
  let remaining = total - allocated.reduce((sum, periods) => sum + periods, 0);

  const priority = weights
    .map((weight, index) => ({ index, weight }))
    .sort((a, b) => b.weight - a.weight);

  let cursor = 0;
  while (remaining > 0) {
    allocated[priority[cursor % priority.length].index] += 1;
    cursor += 1;
    remaining -= 1;
  }

  return allocated;
};

const unitIndicators = (grade: Grade, unit: Unit): string[] => {
  const selected = (unit.indicators || [])
    .map((index) => grade.indicators[index]?.code)
    .filter((code): code is string => Boolean(code));
  return selected.length > 0 ? selected : grade.indicators.map((indicator) => indicator.code);
};

const phaseFor = (index: number, total: number) => {
  const ratio = (index + 1) / total;
  if (index === 0) {
    return {
      label: 'สำรวจความรู้เดิมและตั้งคำถาม',
      evidence: 'คำตอบก่อนเรียน บัตรคำถาม หรือแผนผังความคิด',
      assessment: 'K/A: ตรวจความเข้าใจเดิมและการมีส่วนร่วม',
    };
  }
  if (ratio <= 0.35) {
    return {
      label: 'เรียนรู้แนวคิดและดูตัวอย่าง',
      evidence: 'ใบงานความรู้และคำอธิบายด้วยภาษาของผู้เรียน',
      assessment: 'K: คำถามระหว่างเรียนและใบงาน',
    };
  }
  if (ratio <= 0.65) {
    return {
      label: 'ฝึกปฏิบัติแบบมีผู้ชี้แนะ',
      evidence: 'ผลกิจกรรมในเว็บ เช็กลิสต์ขั้นตอน และภาพหน้าจอผลงาน',
      assessment: 'P/A: รูบริกการปฏิบัติและความรับผิดชอบ',
    };
  }
  if (ratio < 1) {
    return {
      label: 'ประยุกต์ใช้ ทดสอบ และปรับปรุง',
      evidence: 'ชิ้นงานฉบับทดลอง บันทึกข้อผิดพลาด และชิ้นงานฉบับแก้ไข',
      assessment: 'K/P/A: ชิ้นงาน การอธิบายเหตุผล และพฤติกรรมการทำงาน',
    };
  }
  return {
    label: 'สรุป นำเสนอ และสะท้อนการเรียนรู้',
    evidence: 'ชิ้นงานปลายหน่วย แบบทดสอบ และบัตรสะท้อนการเรียนรู้',
    assessment: 'K/P/A: แบบทดสอบ รูบริกชิ้นงาน และแบบสังเกต',
  };
};

const addExamEvidence = (
  row: TechnologyTeachingScheduleRow,
): TechnologyTeachingScheduleRow => {
  if (row.period === 20) {
    return {
      ...row,
      lessonTitle: `${row.lessonTitle} และประเมินกลางปี`,
      evidence: `${row.evidence}; แบบประเมินกลางปี`,
      assessment: `${row.assessment}; สอบกลางปี 15 คะแนน`,
    };
  }
  if (row.period === 40) {
    return {
      ...row,
      lessonTitle: `${row.lessonTitle} และประเมินปลายปี`,
      evidence: `${row.evidence}; แบบประเมินปลายปีและแฟ้มสะสมงาน`,
      assessment: `${row.assessment}; สอบปลายปี 15 คะแนน`,
    };
  }
  return row;
};

const p1CoreStep = (plan: P1LessonPlan) =>
  [...plan.steps].sort((a, b) => b.minutes - a.minutes)[0];

const buildP1Rows = (): TechnologyTeachingScheduleRow[] =>
  p1LessonPlans.map((plan) => {
    const unit = p1AnnualUnits.find((item) => item.no === plan.unitNo);
    const coreStep = p1CoreStep(plan);
    return addExamEvidence({
      period: plan.no,
      week: plan.no,
      semester: plan.no <= 20 ? 1 : 2,
      unitNo: plan.unitNo,
      unitTitle: unit?.title || plan.title,
      lessonTitle: plan.title,
      indicators: plan.indicators,
      learningActivity: coreStep?.students || plan.content[0] || plan.title,
      evidence: plan.product || coreStep?.evidence || plan.worksheet,
      assessment: `${[...new Set(plan.assessments.map((item) => item.domain))].join('/')} จาก ${plan.assessments.map((item) => item.instrument).join(', ')}`,
    });
  });

const buildGeneratedRows = (grade: Grade): TechnologyTeachingScheduleRow[] => {
  const units = grade.units || [];
  const allocations = allocatePeriods(units, 40);
  const rows: TechnologyTeachingScheduleRow[] = [];
  let period = 1;

  units.forEach((unit, unitIndex) => {
    const periods = allocations[unitIndex];
    const topics = unit.topics?.length ? unit.topics : [unit.title];
    const activities = unit.activities?.length ? unit.activities : topics;
    const indicators = unitIndicators(grade, unit);

    for (let index = 0; index < periods; index += 1) {
      const topic = topics[index % topics.length];
      const activity = activities[index % activities.length];
      const phase = phaseFor(index, periods);
      const topicRound = Math.floor(index / topics.length);
      const lessonTitle = topicRound === 0
        ? topic
        : `${topic}: ฝึกระดับ ${topicRound + 1}`;

      rows.push(addExamEvidence({
        period,
        week: period,
        semester: period <= 20 ? 1 : 2,
        unitNo: unit.no,
        unitTitle: unit.title,
        lessonTitle,
        indicators,
        learningActivity: `${phase.label}: ${activity}`,
        evidence: phase.evidence,
        assessment: phase.assessment,
      }));
      period += 1;
    }
  });

  return rows;
};

const summarizeUnits = (
  grade: Grade,
  rows: TechnologyTeachingScheduleRow[],
): TechnologyTeachingScheduleUnit[] =>
  (grade.units || []).map((unit) => {
    const unitRows = rows.filter((row) => row.unitNo === unit.no);
    return {
      no: unit.no,
      title: unit.title,
      hours: unitRows.length,
      indicators: unitIndicators(grade, unit),
      keyEvidence: unit.activities?.[0] || unit.topics?.[0] || unit.title,
    };
  });

export const buildTechnologyTeachingSchedule = (
  gradeId: TechnologyGradeId,
): TechnologyTeachingSchedule => {
  const grade = findGrade(curriculumGradeIdForTechnology(gradeId));
  if (!grade) {
    throw new Error(`ไม่พบข้อมูลกำหนดการสอน ${gradeId}`);
  }

  const number = gradeNumber(gradeId);
  const rows = gradeId === 'p1' ? buildP1Rows() : buildGeneratedRows(grade);

  return {
    gradeId,
    gradeLabel: `${gradeId.startsWith('p') ? 'ป' : 'ม'}.${number}`,
    fullGradeLabel: grade.title,
    courseCode: courseCode(gradeId),
    courseName: gradeId.startsWith('p') ? 'เทคโนโลยี (วิทยาการคำนวณ)' : 'วิทยาการคำนวณ',
    weeklySlot: WEEKLY_SLOTS[gradeId],
    totalHours: rows.length,
    description: grade.technologyProfile?.courseDescription || '',
    focus: grade.technologyProfile?.focus || [],
    rows,
    units: gradeId === 'p1'
      ? p1AnnualUnits.map((unit) => ({
        no: unit.no,
        title: unit.title,
        hours: rows.filter((row) => row.unitNo === unit.no).length,
        indicators: unit.indicators,
        keyEvidence: unit.evidence,
      }))
      : summarizeUnits(grade, rows),
  };
};

export const primaryTechnologyTeachingSchedules = PRIMARY_TECHNOLOGY_GRADE_IDS.map(
  buildTechnologyTeachingSchedule,
);
