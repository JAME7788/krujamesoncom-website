import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StudentProgressData, UnitProgress } from '../src/services/progressService';

const progressState = vi.hoisted(() => ({
  items: [] as StudentProgressData[],
}));

vi.mock('../src/services/progressService', () => ({
  getAllCachedProgress: () => structuredClone(progressState.items),
  fetchAllProgressFromFirebase: async () => structuredClone(progressState.items),
}));

import {
  PRACTICE_MAX_SCORE,
  applyManualAssessmentsToGrades,
  cacheGradesLocally,
  computeBreakdown,
  computeGrade,
  emptyIndicatorScore,
  getIndicators,
  getLinkedUnits,
  loadGrades,
  saveManualAssessmentScores,
  saveManualAssessments,
  syncAllFromProgress,
  syncFromProgress,
  updatePracticeCriteriaScores,
  type ManualAssessment,
  type StudentGrade,
} from '../src/services/gradeService';
import {
  computeAttendance,
  type StudentRecord,
} from '../src/services/adminService';
import type { ClassSlot } from '../src/data/schedule';

class MemoryStorage implements Storage {
  private readonly data = new Map<string, string>();
  get length() { return this.data.size; }
  clear() { this.data.clear(); }
  getItem(key: string) { return this.data.get(key) ?? null; }
  key(index: number) { return [...this.data.keys()][index] ?? null; }
  removeItem(key: string) { this.data.delete(key); }
  setItem(key: string, value: string) { this.data.set(key, String(value)); }
}

const makeUnit = (patch: Partial<UnitProgress> = {}): UnitProgress => ({
  slidesViewed: [],
  totalSlides: 0,
  videosClicked: [],
  funClicked: [],
  articlesClicked: [],
  practiceCompleted: [],
  bestQuizScore: 0,
  bestQuizMax: 0,
  quizAttempts: 0,
  completionPct: 0,
  inClassDays: [],
  scoreEvidence: [],
  worldEvidence: [],
  worldKnowledgeCorrect: 0,
  worldKnowledgeMax: 0,
  updatedAt: Date.now(),
  ...patch,
});

const makeStudentGrade = (
  classroom = 'ป.1',
  studentCode = 'student-1',
  studentNo = 1,
  name = 'นักเรียนทดสอบ',
): StudentGrade => ({
  studentCode,
  classroom,
  studentNo,
  name,
  emoji: '👤',
  indicators: Object.fromEntries(
    getIndicators(classroom).map((indicator) => [
      indicator.id,
      emptyIndicatorScore(indicator.maxScore),
    ]),
  ),
  updatedAt: Date.now(),
});

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: new MemoryStorage(),
    configurable: true,
  });
  progressState.items = [];
  vi.restoreAllMocks();
});

describe('ระบบคำนวณเกรด K/P/A', () => {
  it('คะแนนเต็มทุกตัวชี้วัด กลางภาค และปลายภาคต้องรวมได้ 100 และเกรด 4', () => {
    const grade = makeStudentGrade();
    Object.values(grade.indicators).forEach((score) => {
      score.k = 15;
      score.p = 'ดี';
      score.pScore = 30;
      score.practicePassed = true;
      score.pAssessed = true;
      score.a = true;
      score.aScore = 10;
      score.aAssessed = true;
    });
    grade.midtermExam = 15;
    grade.finalExam = 15;

    const result = computeBreakdown(grade, 'ป.1');
    expect(result.collected).toBe(70);
    expect(result.exam).toBe(30);
    expect(result.total).toBe(100);
    expect(computeGrade(grade, 'ป.1')).toBe('4');
  });

  it('ต้อง cap คะแนน K/P และคะแนนสอบ ไม่ให้คะแนนรวมเกิน 100', () => {
    const grade = makeStudentGrade();
    Object.values(grade.indicators).forEach((score) => {
      score.k = 999;
      score.p = 'ดี';
      score.pScore = 999;
      score.practicePassed = true;
      score.pAssessed = true;
      score.a = true;
      score.aAssessed = true;
    });
    grade.midtermExam = 999;
    grade.finalExam = 999;

    expect(computeBreakdown(grade, 'ป.1').total).toBe(100);
  });

  it('P และ A ที่ยังไม่ประเมินต้องไม่ถูกนำไปคิดคะแนน', () => {
    const grade = makeStudentGrade();
    Object.values(grade.indicators).forEach((score) => {
      score.p = 'ดี';
      score.a = true;
      score.pAssessed = false;
      score.aAssessed = false;
    });

    const result = computeBreakdown(grade, 'ป.1');
    expect(result.p).toBe(0);
    expect(result.a).toBe(0);
  });

  it('ใบงานต้องหารตามคะแนนเต็ม: ได้ครึ่งหนึ่งต้องเป็น K 7.5 และ P 15', () => {
    const grade = makeStudentGrade();
    const indicatorId = getIndicators('ป.1')[0].id;
    cacheGradesLocally('ป.1', [grade]);
    const assessments: ManualAssessment[] = [
      {
        id: 'k-half',
        title: 'ใบงานความรู้',
        indicatorId,
        category: 'k',
        maxScore: 20,
        createdAt: Date.now(),
      },
      {
        id: 'p-half',
        title: 'งานปฏิบัติ',
        indicatorId,
        category: 'p',
        maxScore: 40,
        createdAt: Date.now(),
      },
    ];
    saveManualAssessments('ป.1', assessments);
    saveManualAssessmentScores('ป.1', {
      'k-half': { 'student-1': 10 },
      'p-half': { 'student-1': 20 },
    });

    applyManualAssessmentsToGrades('ป.1');
    const score = loadGrades('ป.1')[0].indicators[indicatorId];
    expect(score.manualK).toBe(7.5);
    expect(score.manualPScore).toBe(15);
  });

  it('รูบริก P เลือก 1/2/3 ทุกข้อ ต้องได้ 10/20/30 และไม่เกิน 30', () => {
    const indicatorId = getIndicators('ป.1')[0].id;
    cacheGradesLocally('ป.1', [makeStudentGrade()]);

    updatePracticeCriteriaScores('ป.1', 'student-1', indicatorId, Array(10).fill(1));
    expect(loadGrades('ป.1')[0].indicators[indicatorId].teacherPScore).toBe(10);

    updatePracticeCriteriaScores('ป.1', 'student-1', indicatorId, Array(10).fill(2));
    expect(loadGrades('ป.1')[0].indicators[indicatorId].teacherPScore).toBe(20);

    updatePracticeCriteriaScores('ป.1', 'student-1', indicatorId, Array(10).fill(99));
    expect(loadGrades('ป.1')[0].indicators[indicatorId].teacherPScore).toBe(PRACTICE_MAX_SCORE);
  });

  it('กิจกรรมในคาบได้ 100% นอกคาบได้ 40% และไม่ทับ K ที่ครูกรอก', () => {
    const grade = makeStudentGrade();
    const indicator = getIndicators('ป.1')[0];
    const linked = getLinkedUnits('ป.1').find((item) => item.indicator.id === indicator.id);
    // ป.1 เรียนพฤหัสบดี 13:00-14:00 — 21 พ.ค. 2026 เป็นวันพฤหัสบดี
    const inClassTimestamp = new Date(2026, 4, 21, 13, 30).getTime();
    const outsideTimestamp = new Date(2026, 4, 21, 15, 0).getTime();
    expect(linked?.units.length).toBeGreaterThan(0);
    const unit = linked!.units[0];
    grade.indicators[indicator.id] = {
      ...grade.indicators[indicator.id],
      k: 12,
      teacherK: 12,
    };
    cacheGradesLocally('ป.1', [grade]);
    progressState.items = [{
      studentId: 'ป.1_1_นักเรียนทดสอบ',
      units: {
        [`${unit.gradeId}_${unit.unitNo}`]: makeUnit({
          bestQuizScore: 2,
          bestQuizMax: 10,
          // ตั้ง inClass เป็น false ทั้งคู่โดยตั้งใจ — จำลองหลักฐานที่บันทึกไว้ตอนตารางสอนยังผิด
          // ระบบต้องคิดใหม่จาก timestamp ไม่ใช่เชื่อค่าที่ค้างไว้ ไม่งั้นจะได้ 4 (2+2) แทน 7 (5+2)
          scoreEvidence: [
            { id: 'in-class', type: 'practice', timestamp: inClassTimestamp, inClass: false, basePoints: 5 },
            { id: 'outside', type: 'practice', timestamp: outsideTimestamp, inClass: false, basePoints: 5 },
          ],
        }),
      },
      attempts: [],
      activities: [],
      daysActive: [],
      inClassDays: [],
      totalPoints: 0,
      totalSlidesViewed: 0,
      totalActivities: 0,
      unitsCompleted: 0,
      lastActive: Date.now(),
    }];

    syncFromProgress('ป.1', 'student-1', 'ป.1_1_นักเรียนทดสอบ', 'main', 'local');
    const score = loadGrades('ป.1')[0].indicators[indicator.id];
    expect(score.webPScore).toBe(7);
    expect(score.k).toBe(12);
  });

  // ข้อมูลเก่าส่วนใหญ่ไม่มี scoreEvidence (ป.1 มีแค่ 1 ใน 26 คน) จึงตกมาทางนี้
  // เดิมทางนี้เหมา ×0.4 ให้ทุกอย่าง ทำให้งานที่ทำในคาบถูกหักคะแนน 60% ทั้งที่มาเรียนจริง
  it.each([
    { case: 'ทำในคาบทั้งหมด ต้องได้เต็ม', hours: [13, 13], expected: 6 },
    { case: 'ทำนอกคาบทั้งหมด ต้องได้ 40%', hours: [15, 16], expected: 2.4 },
    { case: 'ทำในคาบครึ่งหนึ่ง ต้องได้ตามสัดส่วน', hours: [13, 16], expected: 4.2 },
  ])('ข้อมูลเก่าที่ไม่มี scoreEvidence: $case', ({ hours, expected }) => {
    const grade = makeStudentGrade();
    const indicator = getIndicators('ป.1')[0];
    const unit = getLinkedUnits('ป.1').find((item) => item.indicator.id === indicator.id)!.units[0];
    cacheGradesLocally('ป.1', [grade]);
    progressState.items = [{
      studentId: 'ป.1_1_นักเรียนทดสอบ',
      units: {
        // 2 กิจกรรม fun = 3 คะแนน/ชิ้น = 6 คะแนนก่อนคูณ และไม่มี scoreEvidence เลย
        [`${unit.gradeId}_${unit.unitNo}`]: makeUnit({
          funClicked: ['เกมที่ 1', 'เกมที่ 2'],
          scoreEvidence: [],
        }),
      },
      // 21 พ.ค. 2026 = พฤหัสบดี, คาบ ป.1 คือ 13:00-14:00
      activities: hours.map((hour, i) => ({
        type: 'fun' as const,
        gradeId: unit.gradeId,
        unitNo: unit.unitNo,
        detail: `เกมที่ ${i + 1}`,
        timestamp: new Date(2026, 4, 21, hour, 30).getTime(),
      })),
      attempts: [],
      daysActive: [],
      inClassDays: [],
      totalPoints: 0,
      totalSlidesViewed: 0,
      totalActivities: 0,
      unitsCompleted: 0,
      lastActive: Date.now(),
    }];

    syncFromProgress('ป.1', 'student-1', 'ป.1_1_นักเรียนทดสอบ', 'main', 'local');
    expect(loadGrades('ป.1')[0].indicators[indicator.id].webPScore).toBe(expected);
  });

  it('คำถามห้อง 3D ต้องให้ K ได้ไม่เกิน 50% ของตัวชี้วัด', () => {
    const grade = makeStudentGrade();
    const indicator = getIndicators('ป.1')[0];
    const unit = getLinkedUnits('ป.1').find((item) => item.indicator.id === indicator.id)!.units[0];
    cacheGradesLocally('ป.1', [grade]);
    progressState.items = [{
      studentId: 'ป.1_1_นักเรียนทดสอบ',
      units: {
        [`${unit.gradeId}_${unit.unitNo}`]: makeUnit({
          worldKnowledgeCorrect: 100,
          worldKnowledgeMax: 100,
        }),
      },
      attempts: [],
      activities: [],
      totalPoints: 0,
      totalSlidesViewed: 0,
      totalActivities: 0,
      unitsCompleted: 0,
      lastActive: Date.now(),
    }];

    syncFromProgress('ป.1', 'student-1', 'ป.1_1_นักเรียนทดสอบ', 'main', 'local');
    expect(loadGrades('ป.1')[0].indicators[indicator.id].webK).toBe(8);
  });

  it('ซิงก์ทั้งห้องต้องเก็บผลครบทุกคนและรอบที่ไม่มีข้อมูลใหม่ต้องไม่เขียนซ้ำ', () => {
    const indicator = getIndicators('ป.1')[0];
    const unit = getLinkedUnits('ป.1').find((item) => item.indicator.id === indicator.id)!.units[0];
    cacheGradesLocally('ป.1', [
      makeStudentGrade('ป.1', 'student-1', 1, 'นักเรียนหนึ่ง'),
      makeStudentGrade('ป.1', 'student-2', 2, 'นักเรียนสอง'),
    ]);
    progressState.items = [1, 2].map((studentNo) => ({
      studentId: `ป.1_${studentNo}_นักเรียน${studentNo === 1 ? 'หนึ่ง' : 'สอง'}`,
      units: {
        [`${unit.gradeId}_${unit.unitNo}`]: makeUnit({
          bestQuizScore: studentNo === 1 ? 8 : 6,
          bestQuizMax: 10,
        }),
      },
      attempts: [],
      activities: [],
      totalPoints: 0,
      totalSlidesViewed: 0,
      totalActivities: 0,
      unitsCompleted: 0,
      lastActive: Date.now(),
    }));

    const first = syncAllFromProgress('ป.1');
    const grades = loadGrades('ป.1');
    expect(first.studentsUpdated).toBe(2);
    expect(grades[0].indicators[indicator.id].webK).toBe(12);
    expect(grades[1].indicators[indicator.id].webK).toBe(9);

    const second = syncAllFromProgress('ป.1');
    expect(second.studentsUpdated).toBe(0);
    expect(second.indicatorsUpdated).toBe(0);
  });
});

describe('ระบบเช็คชื่อ', () => {
  const date = new Date(2026, 6, 20, 10, 0, 0);
  const schedule: ClassSlot[] = [{
    id: 'test-slot',
    classroom: 'ป.1',
    day: date.getDay(),
    start: '09:00',
    end: '11:00',
    subject: 'เทคโนโลยี',
  }];

  it('กิจกรรมเข้าสู่ระบบในคาบต้องเป็นมาเรียน และไม่มีสถานะสาย', () => {
    const students: StudentRecord[] = [{
      id: 'ป.1_1_นักเรียนทดสอบ',
      name: 'นักเรียนทดสอบ',
      classroom: 'ป.1',
      studentNumber: '1',
      progress: {
        studentId: 'ป.1_1_นักเรียนทดสอบ',
        units: {},
        attempts: [],
        activities: [{
          type: 'fun',
          gradeId: 'login',
          unitNo: 0,
          detail: 'เข้าสู่ระบบ',
          timestamp: date.getTime(),
        }],
        totalPoints: 0,
        totalSlidesViewed: 0,
        totalActivities: 0,
        unitsCompleted: 0,
        lastActive: date.getTime(),
      },
    }];

    expect(computeAttendance(students, 'ป.1', schedule, date.getTime())[0].status).toBe('present');
  });

  it('หลักฐาน inClassDays ต้องรักษาสถานะมาเรียนแม้ activity เก่าถูกตัดออก', () => {
    const students: StudentRecord[] = [{
      id: 'ป.1_1_นักเรียนทดสอบ',
      name: 'นักเรียนทดสอบ',
      classroom: 'ป.1',
      studentNumber: '1',
      progress: {
        studentId: 'ป.1_1_นักเรียนทดสอบ',
        units: {},
        attempts: [],
        activities: [],
        inClassDays: ['2026-6-20'],
        totalPoints: 0,
        totalSlidesViewed: 0,
        totalActivities: 0,
        unitsCompleted: 0,
        lastActive: date.getTime(),
      },
    }];

    expect(computeAttendance(students, 'ป.1', schedule, date.getTime())[0].status).toBe('present');
  });
});
