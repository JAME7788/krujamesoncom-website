import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/data/schedule', () => ({ loadSchedule: () => [], isInClassTime: () => true }));
vi.mock('../src/services/rosterService', () => ({ loadRoster: () => [] }));
vi.mock('../src/services/courseAccessService', () => ({
  getCourseAccessSettings: () => ({}),
  getActiveSubjectsForClassroom: (classroom: string) => (classroom.startsWith('ม.') ? ['cs', 'dt'] : ['main']),
  isCourseOpenForClassroom: () => true,
  getCourseIdsForClassroom: (classroom: string) => {
    if (classroom === 'ป.1') return ['p1'];
    if (classroom === 'ป.5') return ['p5'];
    if (classroom === 'ม.2') return ['m2-cs', 'm2-design'];
    if (classroom === 'ม.3') return ['m3-cs', 'm3-design'];
    return ['p1'];
  },
}));

import {
  describeWorldEvidenceReward,
  getWorldPillarForBuildMission,
  getWorldPillarForTechZone,
  recordWorldScoreActivity,
  resolveWorldTargetUnit,
} from '../src/services/worldScoringService';
import { clearProgressCache, computeGamification, getUnitProgress } from '../src/services/progressService';
import { loadLearningEvidence } from '../src/services/learningEvidenceService';
import { loadGrades } from '../src/services/gradeService';

beforeEach(() => {
  const storage = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
    key: (index: number) => [...storage.keys()][index] ?? null,
    get length() { return storage.size; },
  });
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  clearProgressCache();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('worldScoringService — เชื่อมกิจกรรมห้อง 3D เข้าสู่ระบบคะแนน K/P/A และ XP จริง', () => {
  it('จับคู่เสาหลักเนื้อหา (algo/coding/data_tech/safety) ไปยังหน่วยที่ตรงหลักสูตรทุกระดับชั้น ป.1–ม.3', () => {
    expect(resolveWorldTargetUnit('ป.1', 'data_tech')).toEqual({ gradeId: 'p1', unitNo: 1 });
    expect(resolveWorldTargetUnit('ป.1', 'algo')).toEqual({ gradeId: 'p1', unitNo: 2 });
    expect(resolveWorldTargetUnit('ป.1', 'coding')).toEqual({ gradeId: 'p1', unitNo: 3 });
    expect(resolveWorldTargetUnit('ป.1', 'safety')).toEqual({ gradeId: 'p1', unitNo: 4 });

    expect(resolveWorldTargetUnit('ป.5', 'algo')).toEqual({ gradeId: 'p5', unitNo: 1 });
    expect(resolveWorldTargetUnit('ป.5', 'coding')).toEqual({ gradeId: 'p5', unitNo: 2 });
    expect(resolveWorldTargetUnit('ป.5', 'data_tech')).toEqual({ gradeId: 'p5', unitNo: 3 });
    expect(resolveWorldTargetUnit('ป.5', 'safety')).toEqual({ gradeId: 'p5', unitNo: 4 });

    expect(resolveWorldTargetUnit('ม.2', 'data_tech')).toEqual({ gradeId: 'm2-cs', unitNo: 3 });
    expect(resolveWorldTargetUnit('ม.2', 'safety')).toEqual({ gradeId: 'm2-cs', unitNo: 4 });
    expect(resolveWorldTargetUnit('ม.3', 'safety')).toEqual({ gradeId: 'm3-cs', unitNo: 3 });
  });

  it('แยกประเภทโซนนิทรรศการและภารกิจสร้างตามเสาหลักหลักสูตร ไม่กองรวมไว้แค่หน่วย 1', () => {
    expect(getWorldPillarForTechZone('logic_secret_code')).toBe('algo');
    expect(getWorldPillarForTechZone('program_software_robodog')).toBe('coding');
    expect(getWorldPillarForTechZone('ai_revolution_agentic')).toBe('safety');
    expect(getWorldPillarForTechZone('quantum_computer')).toBe('data_tech');

    expect(getWorldPillarForBuildMission('parkour1')).toBe('algo');
    expect(getWorldPillarForBuildMission('circuit01')).toBe('coding');
    expect(getWorldPillarForBuildMission('palette5')).toBe('data_tech');
  });

  it('คำอธิบายรางวัลตรงกับสูตรคำนวณจริง (ในคาบ 100% / นอกคาบ 40%)', () => {
    expect(describeWorldEvidenceReward('artifact', true)).toContain('+5');
    expect(describeWorldEvidenceReward('artifact', false)).toContain('+2');
    expect(describeWorldEvidenceReward('game', true)).toContain('+3');
    expect(describeWorldEvidenceReward('game', false)).toContain('+1.2');
    expect(describeWorldEvidenceReward('question', true)).toContain('K');
  });

  it('บันทึกกิจกรรมจากห้อง 3D แยกหน่วยจริง → เพิ่ม XP จริง, บันทึก learningEvidence และซิงก์พรีวิว K/P/A', async () => {
    const student = {
      id: 'ป.5_7_เด็กชายทดสอบระบบ',
      name: 'เด็กชายทดสอบระบบ',
      classroom: 'ป.5',
      studentNumber: '7',
    };

    // 1) ตอบถูก Deepfake Detective → ต้องลงหน่วยที่ 4 (safety) ในหมวด K
    const kRes = await recordWorldScoreActivity({
      user: student,
      roomId: 'class-ป5',
      kind: 'question',
      eventId: 'deepfake-detective-1',
      detail: 'ไขคดีนักสืบไซเบอร์ Deepfake ข้อ 1',
      pillar: 'safety',
      score: 1,
      maxScore: 1,
    });
    expect(kRes.targetUnit).toEqual({ gradeId: 'p5', unitNo: 4 });
    expect(getUnitProgress(student.id, 'p5', 4).worldKnowledgeCorrect).toBe(1);

    // 2) ทำภารกิจ SPACE RESCUE สำเร็จ → ต้องลงหน่วยที่ 2 (coding) ในหมวด P ปฏิบัติ (+5 XP)
    const pRes = await recordWorldScoreActivity({
      user: student,
      roomId: 'class-ป5',
      kind: 'artifact',
      eventId: 'robodog-space-rescue-clear',
      detail: 'เขียนโปรแกรมหุ่นสุนัขกู้ภัย SPACE RESCUE สำเร็จ',
      pillar: 'coding',
      score: 1,
      maxScore: 1,
    });
    expect(pRes.targetUnit).toEqual({ gradeId: 'p5', unitNo: 2 });
    expect(getUnitProgress(student.id, 'p5', 2).practiceCompleted).toHaveLength(1);
    expect(computeGamification(student.id).xp).toBeGreaterThanOrEqual(5);

    // ตรวจสอบว่าไม่เขียนทับหรือปนเปื้อนลงหน่วย 1
    expect(getUnitProgress(student.id, 'p5', 1).worldEvidence).toHaveLength(0);

    // เมื่อ Firebase ไม่ได้เปิดใน unit test แต่ local cache ของ progress ยังทำงาน:
    // ตรวจสอบว่าบัญชีครู (admin) ถูกกันไม่ให้บันทึกคะแนน
    const adminRes = await recordWorldScoreActivity({
      user: { ...student, id: 'admin_teacher_account', accountType: 'admin' },
      roomId: 'class-ป5',
      kind: 'artifact',
      eventId: 'admin-test',
      detail: 'ทดสอบครู',
      pillar: 'coding',
    });
    expect(adminRes.awarded).toBe(false);
    expect(adminRes.reason).toBe('ineligible');
    expect(loadLearningEvidence().every((item) => item.studentId !== 'admin_teacher_account')).toBe(true);
    expect(Array.isArray(loadGrades('ป.5'))).toBe(true);
  });
});
