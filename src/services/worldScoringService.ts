import { isInClassTime, loadSchedule } from '../data/schedule';
import { getActiveSubjectsForClassroom, getCourseAccessSettings, isCourseOpenForClassroom } from './courseAccessService';
import { syncStudentGradesFromProgress } from './gameProgressService';
import { getLinkedUnitsForSubject } from './gradeService';
import { recordLearningEvidence } from './learningEvidenceService';
import { trackWorldMissionEvidence, type MissionEvidenceKind, type TrackMissionEvidenceResult } from './progressService';
import { loadRoster } from './rosterService';
import { isScoreEligibleUser, type PortalAccountType } from './userAccessService';
import { recordWorldActivityEvent } from './virtualClassroomService';

export type WorldCurriculumPillar = 'algo' | 'coding' | 'data_tech' | 'safety';

export interface WorldTargetUnit {
  gradeId: string;
  unitNo: number;
}

const normalizeClassroom = (classroom: string): string => {
  const match = classroom.trim().match(/^(ป\.[1-6]|ม\.[1-3])(?:\/[1-9]\d*)?$/);
  return match ? match[1] : classroom.trim();
};

/**
 * แปลงเสาหลักเนื้อหาในห้อง 3D (อัลกอริทึม / โค้ดดิ้ง / ข้อมูล-คอมพิวเตอร์ / ความปลอดภัยดิจิทัล)
 * ไปยัง gradeId และ unitNo จริงในหลักสูตรของชั้นเรียนนั้น ๆ (ตรงกับ src/data/curriculum.ts)
 */
export const resolveWorldTargetUnit = (
  classroom: string,
  pillar: WorldCurriculumPillar,
): WorldTargetUnit | null => {
  const cls = normalizeClassroom(classroom);
  const table: Record<string, Record<WorldCurriculumPillar, WorldTargetUnit>> = {
    'ป.1': {
      algo: { gradeId: 'p1', unitNo: 2 },
      coding: { gradeId: 'p1', unitNo: 3 },
      data_tech: { gradeId: 'p1', unitNo: 1 },
      safety: { gradeId: 'p1', unitNo: 4 },
    },
    'ป.2': {
      algo: { gradeId: 'p2', unitNo: 1 },
      coding: { gradeId: 'p2', unitNo: 2 },
      data_tech: { gradeId: 'p2', unitNo: 3 },
      safety: { gradeId: 'p2', unitNo: 4 },
    },
    'ป.3': {
      algo: { gradeId: 'p3', unitNo: 1 },
      coding: { gradeId: 'p3', unitNo: 2 },
      data_tech: { gradeId: 'p3', unitNo: 4 },
      safety: { gradeId: 'p3', unitNo: 3 },
    },
    'ป.4': {
      algo: { gradeId: 'p4', unitNo: 1 },
      coding: { gradeId: 'p4', unitNo: 2 },
      data_tech: { gradeId: 'p4', unitNo: 4 },
      safety: { gradeId: 'p4', unitNo: 5 },
    },
    'ป.5': {
      algo: { gradeId: 'p5', unitNo: 1 },
      coding: { gradeId: 'p5', unitNo: 2 },
      data_tech: { gradeId: 'p5', unitNo: 3 },
      safety: { gradeId: 'p5', unitNo: 4 },
    },
    'ป.6': {
      algo: { gradeId: 'p6', unitNo: 1 },
      coding: { gradeId: 'p6', unitNo: 2 },
      data_tech: { gradeId: 'p6', unitNo: 3 },
      safety: { gradeId: 'p6', unitNo: 4 },
    },
    'ม.1': {
      algo: { gradeId: 'm1-cs', unitNo: 1 },
      coding: { gradeId: 'm1-cs', unitNo: 2 },
      data_tech: { gradeId: 'm1-cs', unitNo: 2 },
      safety: { gradeId: 'm1-cs', unitNo: 2 },
    },
    'ม.2': {
      algo: { gradeId: 'm2-cs', unitNo: 1 },
      coding: { gradeId: 'm2-cs', unitNo: 2 },
      data_tech: { gradeId: 'm2-cs', unitNo: 3 },
      safety: { gradeId: 'm2-cs', unitNo: 4 },
    },
    'ม.3': {
      algo: { gradeId: 'm3-cs', unitNo: 1 },
      coding: { gradeId: 'm3-cs', unitNo: 1 },
      data_tech: { gradeId: 'm3-cs', unitNo: 2 },
      safety: { gradeId: 'm3-cs', unitNo: 3 },
    },
  };
  return table[cls]?.[pillar] || null;
};

export const getWorldPillarForTechZone = (zoneId: string): WorldCurriculumPillar => {
  if (zoneId === 'logic_secret_code') return 'algo';
  if (zoneId === 'program_software_robodog') return 'coding';
  if (zoneId === 'ai_revolution_agentic') return 'safety';
  return 'data_tech';
};

export const getWorldPillarForBuildMission = (missionId: string): WorldCurriculumPillar => {
  if (missionId === 'wall10' || missionId === 'parkour1') return 'algo';
  if (missionId === 'tower8' || missionId === 'circuit01') return 'coding';
  return 'data_tech';
};

export const describeWorldEvidenceReward = (
  kind: MissionEvidenceKind,
  inClass: boolean,
): string => {
  if (kind === 'question') {
    return 'หลักฐาน K (ความรู้ 3D สูงสุด 50% ของตัวชี้วัด)';
  }
  if (kind === 'artifact') {
    const pts = inClass ? '5' : '2';
    return `P ปฏิบัติ +${pts} (${inClass ? 'ในคาบ 100%' : 'นอกคาบ 40%'}) · +5 XP · +1 ผลงาน A`;
  }
  if (kind === 'game') {
    const pts = inClass ? '3' : '1.2';
    return `P ทักษะ +${pts} (${inClass ? 'ในคาบ 100%' : 'นอกคาบ 40%'}) · +5 XP`;
  }
  const pts = inClass ? '1' : '0.4';
  return `P การเรียนรู้ +${pts} (${inClass ? 'ในคาบ 100%' : 'นอกคาบ 40%'}) · +1 XP`;
};

export interface RecordWorldScoreInput {
  user: {
    id: string;
    name: string;
    classroom: string;
    studentNumber: string;
    accountType?: PortalAccountType;
  };
  roomId: string;
  kind: MissionEvidenceKind;
  eventId: string;
  detail: string;
  /** ระบุ gradeId + unitNo ตรง ๆ (เช่น กดสไลด์/ควิซบนกระดานบทเรียน) หรือใช้ pillar เพื่อให้ระบบจับคู่หน่วยอัตโนมัติ */
  gradeId?: string;
  unitNo?: number;
  pillar?: WorldCurriculumPillar;
  slideIndex?: number;
  totalSlides?: number;
  score?: number;
  maxScore?: number;
  qaMode?: boolean;
}

export interface RecordWorldScoreResult {
  saved: boolean;
  awarded: boolean;
  reason?: TrackMissionEvidenceResult['reason'] | 'ineligible';
  inClass: boolean;
  targetUnit: WorldTargetUnit | null;
  indicatorCode?: string;
  rewardText: string;
}

/**
 * บันทึกกิจกรรมจากห้อง 3D เข้าสู่ระบบคะแนนจริงของเว็บไซต์แบบครบวงจร:
 * 1) progress/{studentId} (trackWorldMissionEvidence) → คิด XP/Level และ K/P/A
 * 2) learningEvidence/{id} → หลักฐานรายตัวชี้วัดให้ครูตรวจสอบในสมุดคะแนน
 * 3) virtualActivityEvents → บันทึกกิจกรรมของห้อง 3D
 * 4) syncStudentGradesFromProgress → อัปเดตพรีวิวเกรด K/P/A ทันที
 */
export const recordWorldScoreActivity = async (
  input: RecordWorldScoreInput,
): Promise<RecordWorldScoreResult> => {
  const { user, roomId, kind, eventId, detail, qaMode } = input;
  const inClass = isInClassTime(Date.now(), user.classroom, loadSchedule());
  const rewardText = describeWorldEvidenceReward(kind, inClass);

  if (qaMode || !isScoreEligibleUser(user)) {
    return { saved: false, awarded: false, reason: 'ineligible', inClass, targetUnit: null, rewardText };
  }

  const resolved = input.pillar
    ? resolveWorldTargetUnit(user.classroom, input.pillar)
    : (input.gradeId && input.unitNo ? { gradeId: input.gradeId, unitNo: input.unitNo } : null);

  const targetUnit = resolved || (input.gradeId && input.unitNo ? { gradeId: input.gradeId, unitNo: input.unitNo } : null);
  if (!targetUnit) {
    return { saved: false, awarded: false, reason: 'invalid', inClass, targetUnit: null, rewardText };
  }

  const settings = getCourseAccessSettings();
  if (!isCourseOpenForClassroom(user.classroom, targetUnit.gradeId, settings)) {
    return { saved: false, awarded: false, reason: 'invalid', inClass, targetUnit, rewardText };
  }

  const result = await trackWorldMissionEvidence({
    studentId: user.id,
    gradeId: targetUnit.gradeId,
    unitNo: targetUnit.unitNo,
    eventId,
    kind,
    detail,
    slideIndex: input.slideIndex,
    totalSlides: input.totalSlides,
  });

  let indicatorCode: string | undefined;
  const activeSubjects = getActiveSubjectsForClassroom(user.classroom, settings);
  const rosterStudent = loadRoster(user.classroom).find((entry) => (
    entry.no === Number(user.studentNumber) && entry.name.replace(/\s/g, '') === user.name.replace(/\s/g, '')
  ));

  if (result.saved && result.awarded) {
    await recordWorldActivityEvent({
      eventId,
      roomId,
      playerId: user.id,
      playerName: user.name,
      classroom: user.classroom,
      kind,
      unitNo: targetUnit.unitNo,
      detail,
    });

    for (const subject of activeSubjects) {
      const linkedIndicator = getLinkedUnitsForSubject(user.classroom, subject)
        .find((entry) => entry.units.some((unit) => (
          unit.gradeId === targetUnit.gradeId && unit.unitNo === targetUnit.unitNo
        )))?.indicator;
      if (!linkedIndicator) continue;
      if (!indicatorCode) indicatorCode = linkedIndicator.code;

      const domain = kind === 'question' ? 'K' : 'P';
      await recordLearningEvidence({
        studentId: user.id,
        studentCode: rosterStudent?.studentCode,
        studentName: user.name,
        classroom: user.classroom,
        subject,
        indicatorId: linkedIndicator.id,
        indicatorCode: linkedIndicator.code,
        source: kind === 'game' ? 'game' : 'web',
        domain,
        title: `[3D] ${detail.slice(0, 80)}`,
        detail: `ห้องเรียน 3D หน่วยที่ ${targetUnit.unitNo}: ${detail}`,
        score: input.score,
        maxScore: input.maxScore,
        inClass,
        occurredAt: Date.now(),
        dedupKey: `world-${subject}-${targetUnit.gradeId}-u${targetUnit.unitNo}-${eventId}`,
      }).catch((error) => {
        console.warn('[worldScoring] recordLearningEvidence failed', error);
      });
    }

    await syncStudentGradesFromProgress(user, settings);
  } else {
    for (const subject of activeSubjects) {
      const linkedIndicator = getLinkedUnitsForSubject(user.classroom, subject)
        .find((entry) => entry.units.some((unit) => (
          unit.gradeId === targetUnit.gradeId && unit.unitNo === targetUnit.unitNo
        )))?.indicator;
      if (linkedIndicator) {
        indicatorCode = linkedIndicator.code;
        break;
      }
    }
  }

  return {
    saved: result.saved,
    awarded: result.awarded,
    reason: result.reason,
    inClass,
    targetUnit,
    indicatorCode,
    rewardText,
  };
};
