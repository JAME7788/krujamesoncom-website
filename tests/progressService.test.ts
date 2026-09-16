import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearProgressCache,
  getProgress,
  getSummary,
  getUnitProgress,
  isCourseAllowedForStudent,
  saveQuizAttempt,
  trackMediaClick,
  trackSlideView,
  trackWorldMissionEvidence,
} from '../src/services/progressService';

const STUDENT_ID = 'ป.1_1_นักเรียนทดสอบ';
const GRADE_ID = 'P1';
const UNIT_NO = 1;

beforeEach(() => {
  clearProgressCache();
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

describe('การกันคะแนนซ้ำและเพดานกิจกรรม', () => {
  it('กดสื่อเดิมซ้ำต้องเก็บกิจกรรมและหลักฐานคะแนนเพียงครั้งเดียว', async () => {
    await trackMediaClick(
      STUDENT_ID,
      GRADE_ID,
      UNIT_NO,
      'fun',
      'เปิดเกมครั้งแรก',
      'game-coding-maze',
    );
    await trackMediaClick(
      STUDENT_ID,
      GRADE_ID,
      UNIT_NO,
      'fun',
      'เปิดเกมซ้ำ',
      'game-coding-maze',
    );

    const unit = getUnitProgress(STUDENT_ID, GRADE_ID, UNIT_NO);
    const progress = getProgress(STUDENT_ID);
    expect(unit.funClicked).toEqual(['game-coding-maze']);
    expect(unit.scoreEvidence?.filter((item) => item.type === 'fun')).toHaveLength(1);
    expect(progress.activities.filter((item) => item.type === 'fun')).toHaveLength(1);
  });

  it('ภารกิจเกมในห้อง 3D ให้คะแนนได้ไม่เกิน 4 เกมต่อหน่วย', async () => {
    for (let index = 0; index < 4; index += 1) {
      await trackWorldMissionEvidence({
        studentId: STUDENT_ID,
        gradeId: GRADE_ID,
        unitNo: UNIT_NO,
        eventId: `game-${index}`,
        kind: 'game',
        detail: `เกม ${index + 1}`,
      });
    }

    const limited = await trackWorldMissionEvidence({
      studentId: STUDENT_ID,
      gradeId: GRADE_ID,
      unitNo: UNIT_NO,
      eventId: 'game-5',
      kind: 'game',
      detail: 'เกมที่ 5',
    });
    const duplicate = await trackWorldMissionEvidence({
      studentId: STUDENT_ID,
      gradeId: GRADE_ID,
      unitNo: UNIT_NO,
      eventId: 'game-0',
      kind: 'game',
      detail: 'เกมเดิม',
    });
    const unit = getUnitProgress(STUDENT_ID, GRADE_ID, UNIT_NO);

    expect(unit.worldEvidence.filter((item) => item.kind === 'game')).toHaveLength(4);
    expect(unit.scoreEvidence?.filter((item) => item.type === 'fun')).toHaveLength(4);
    expect(limited.reason).toBe('limit');
    expect(duplicate.reason).toBe('duplicate');
  });
});

describe('การเก็บคะแนนแบบทดสอบ', () => {
  it('ทำหลายครั้งต้องเก็บคะแนนที่ดีที่สุดและนับจำนวนครั้งถูกต้อง', async () => {
    await saveQuizAttempt(STUDENT_ID, GRADE_ID, UNIT_NO, 8, 10, {});
    await saveQuizAttempt(STUDENT_ID, GRADE_ID, UNIT_NO, 3, 10, {});

    const unit = getUnitProgress(STUDENT_ID, GRADE_ID, UNIT_NO);
    expect(unit.quizAttempts).toBe(2);
    expect(unit.bestQuizScore).toBe(8);
    expect(unit.bestQuizMax).toBe(10);
    expect(getProgress(STUDENT_ID).attempts).toHaveLength(2);
  });
});

describe('การจำกัดสิทธิ์วิชาตามระดับชั้นและ Dashboard filtering', () => {
  it('นักเรียน ป.2 เข้าถึงได้เฉพาะ p2 และ ai-p1-3 ไม่อนุญาต arduino หรือมัธยม', () => {
    const studentP2 = 'ป.2_1_เด็กชายธนาทิปภู่ระหงษ์';
    expect(isCourseAllowedForStudent(studentP2, 'p2')).toBe(true);
    expect(isCourseAllowedForStudent(studentP2, 'ai-p1-3')).toBe(true);
    expect(isCourseAllowedForStudent(studentP2, 'arduino-basic')).toBe(false);
    expect(isCourseAllowedForStudent(studentP2, 'm3-design')).toBe(false);
    expect(isCourseAllowedForStudent(studentP2, 'm1-cs')).toBe(false);
  });

  it('บล็อกไม่ให้นักเรียน ป.2 บันทึก progress ข้ามระดับชั้นไปยัง Arduino หรือ ม.3', async () => {
    const studentP2 = 'ป.2_1_เด็กชายธนาทิปภู่ระหงษ์';
    const slideResult = await trackSlideView(studentP2, 'arduino-basic', 4, 1, 10);
    expect(slideResult).toBe(false);

    const quizResult = await saveQuizAttempt(studentP2, 'arduino-basic', 4, 10, 10, {});
    expect(quizResult.saved).toBe(false);

    const mediaResult = await trackMediaClick(studentP2, 'm3-design', 3, 'fun', 'game');
    expect(mediaResult).toBe(false);
  });

  it('getSummary ต้องกรองหน่วยแปลกปลอมข้ามระดับชั้นออก ไม่ให้แสดงใน Dashboard ป.2', async () => {
    const studentP2 = 'ป.2_1_เด็กชายธนาทิปภู่ระหงษ์';
    // บันทึกหน่วย ป.2 ที่ถูกต้อง
    await trackSlideView(studentP2, 'p2', 1, 0, 8);

    // จำลองหน่วยตกค้างใน cache เช่นเดียวกับใน Firestore
    const rawProgress = getProgress(studentP2);
    rawProgress.units['arduino-basic_4'] = {
      slidesViewed: [],
      totalSlides: 10,
      videosClicked: [],
      funClicked: [],
      articlesClicked: [],
      practiceCompleted: [],
      bestQuizScore: 10,
      bestQuizMax: 10,
      quizAttempts: 1,
      completionPct: 10,
      inClassDays: [],
      updatedAt: Date.now() + 1000,
    };
    rawProgress.units['m3-design_3'] = {
      slidesViewed: [],
      totalSlides: 10,
      videosClicked: [],
      funClicked: [],
      articlesClicked: [],
      practiceCompleted: [],
      bestQuizScore: 0,
      bestQuizMax: 0,
      quizAttempts: 0,
      completionPct: 10,
      inClassDays: [],
      updatedAt: Date.now() + 2000,
    };

    const summary = getSummary(studentP2, 'ป.2');
    expect(summary.unitsStarted).toBe(1);
    expect(summary.units).toHaveLength(1);
    expect(summary.units[0].gradeId).toBe('p2');
    expect(summary.units.some((u) => u.key.includes('arduino-basic'))).toBe(false);
    expect(summary.units.some((u) => u.key.includes('m3-design'))).toBe(false);
  });
});
