import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearProgressCache,
  getProgress,
  getUnitProgress,
  saveQuizAttempt,
  trackMediaClick,
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
