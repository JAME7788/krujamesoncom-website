import { trackMediaClick } from './progressService';
import {
  cacheGradesLocally,
  ensureStudentGrade,
  fetchClassroomFromFirebase,
  loadGrades,
  syncFromProgress,
  upsertStudentGradeToFirebase,
  getLinkedUnitsForSubject,
} from './gradeService';
import type { Subject } from './gradeService';
import { loadRoster } from './rosterService';
import { recordLearningEvidence } from './learningEvidenceService';
import { isInClassTime, loadSchedule } from '../data/schedule';
import {
  fetchCourseAccessSettings,
  filterTargetUnitsForCourseAccess,
  getActiveSubjectsForClassroom,
  getCourseAccessSettings,
  type CourseAccessSettings,
} from './courseAccessService';
import { isScoreEligibleUser, type PortalAccountType } from './userAccessService';

export type GameProgressId =
  | 'mouse'
  | 'keyboard'
  | 'algorithm'
  | 'binary'
  | 'memory'
  | 'pattern'
  | 'coding-maze'
  | 'maze'
  | 'snake'
  | 'bug-catcher'
  | 'bug'
  | 'quick-answer'
  | 'safety'
  | 'step-sort'
  | 'device-match'
  | 'pixel-art'
  | 'color-code-pixel'
  | 'logic-gates'
  | 'file-organizer'
  | 'algorithm-runner-3d'
  | 'coding-studio'
  | 'circuit-lab'
  | 'robot-maker'
  | 'tech-system'
  | 'search-smart'
  | 'ct-board'
  | 'tycoon'
  | 'digital-city-quest'
  | 'cyber-shield'
  | 'sorting-dash'
  | 'bomb-collector'
  | 'obstacle-dodge'
  | 'situation-reaction'
  | 'pc-builder'
  | 'stroop-color'
  | 'space-treasure'
  | 'cyber-cop'
  | 'krucom-arcade'
  | 'flowchart-bingo';

type StudentLike = {
  id: string;
  name: string;
  classroom: string;
  studentNumber: string;
  accountType?: PortalAccountType;
};

type TargetUnit = {
  gradeId: string;
  unitNo: number;
};

const primaryGradeId = (classroom: string) => `p${classroom.replace('ป.', '')}`;
const middleGradeId = (classroom: string) => `m${classroom.replace('ม.', '')}-cs`;

const primaryDigitalUnit = (classroom: string): TargetUnit => {
  const gradeId = primaryGradeId(classroom);
  const unitByClassroom: Record<string, number> = {
    'ป.1': 1,
    'ป.2': 3,
    'ป.3': 5,
    'ป.4': 4,
    'ป.5': 4,
    'ป.6': 4,
  };
  return { gradeId, unitNo: unitByClassroom[classroom] || 1 };
};

const primaryAlgorithmUnit = (classroom: string): TargetUnit => ({
  gradeId: primaryGradeId(classroom),
  unitNo: classroom === 'ป.1' ? 2 : 1,
});

const primaryCodingUnit = (classroom: string): TargetUnit => ({
  gradeId: primaryGradeId(classroom),
  unitNo: classroom === 'ป.1' ? 3 : 2,
});

const middleAlgorithmUnit = (classroom: string): TargetUnit => ({
  gradeId: middleGradeId(classroom),
  unitNo: 1,
});

const middleCodingUnit = (classroom: string): TargetUnit => ({
  gradeId: middleGradeId(classroom),
  unitNo: classroom === 'ม.3' ? 1 : 2,
});

const middleBinaryUnit = (classroom: string): TargetUnit => ({
  gradeId: middleGradeId(classroom),
  unitNo: classroom === 'ม.2' ? 3 : classroom === 'ม.3' ? 2 : 1,
});

const middleDataUnit = (classroom: string): TargetUnit => ({
  gradeId: middleGradeId(classroom),
  unitNo: classroom === 'ม.3' ? 1 : classroom === 'ม.2' ? 3 : 1,
});

const middleDesignUnit = (classroom: string): TargetUnit => ({
  gradeId: `m${classroom.replace('ม.', '')}-design`,
  unitNo: 1,
});

const normalizeGameId = (gameId: GameProgressId): GameProgressId => {
  if (gameId === 'maze') return 'coding-maze';
  if (gameId === 'bug') return 'bug-catcher';
  return gameId;
};

export const getGameTargetUnits = (gameId: GameProgressId, classroom: string): TargetUnit[] => {
  const classroomMatch = classroom.trim().match(/^(ป\.[1-6]|ม\.[1-3])(?:\/[1-9]\d*)?$/);
  if (!classroomMatch) return [];
  classroom = classroomMatch[1];
  const normalizedGameId = normalizeGameId(gameId);
  const isPrimary = classroom.startsWith('ป.');
  const isMiddle = classroom.startsWith('ม.');
  if (!isPrimary && !isMiddle) return [];

  if (normalizedGameId === 'mouse' || normalizedGameId === 'keyboard' || normalizedGameId === 'memory') {
    return [isPrimary ? primaryDigitalUnit(classroom) : middleAlgorithmUnit(classroom)];
  }

  if (
    normalizedGameId === 'algorithm'
    || normalizedGameId === 'pattern'
    || normalizedGameId === 'algorithm-runner-3d'
  ) {
    return [isPrimary ? primaryAlgorithmUnit(classroom) : middleAlgorithmUnit(classroom)];
  }

  if (
    normalizedGameId === 'coding-maze'
    || normalizedGameId === 'coding-studio'
    || normalizedGameId === 'snake'
    || normalizedGameId === 'bug-catcher'
  ) {
    return [isPrimary ? primaryCodingUnit(classroom) : middleCodingUnit(classroom)];
  }

  if (normalizedGameId === 'binary') {
    return isMiddle ? [middleBinaryUnit(classroom)] : [];
  }

  // เกมเสริมย้ำเนื้อหา (เด็กเล็ก)
  if (normalizedGameId === 'device-match') {
    return [isPrimary ? primaryDigitalUnit(classroom) : middleAlgorithmUnit(classroom)];
  }
  if (normalizedGameId === 'step-sort') {
    return [isPrimary ? primaryAlgorithmUnit(classroom) : middleAlgorithmUnit(classroom)];
  }
  if (normalizedGameId === 'safety') {
    // ความปลอดภัยดิจิทัล — ป.ใช้หน่วยดิจิทัลพื้นฐาน, ม.ใช้หน่วยที่มี ม.1/4
    return [isPrimary ? primaryDigitalUnit(classroom) : middleCodingUnit(classroom)];
  }
  // การแทนข้อมูล/เลขฐานสอง (บิต→พิกเซล→รูปภาพ)
  if (normalizedGameId === 'pixel-art' || normalizedGameId === 'color-code-pixel') {
    return [isPrimary ? primaryAlgorithmUnit(classroom) : middleBinaryUnit(classroom)];
  }
  // ตรรกะบูลีน AND/OR/NOT — แนวคิดเชิงคำนวณ
  if (normalizedGameId === 'logic-gates') {
    return [isPrimary ? primaryAlgorithmUnit(classroom) : middleAlgorithmUnit(classroom)];
  }
  if (normalizedGameId === 'file-organizer') {
    return [isPrimary ? primaryDigitalUnit(classroom) : middleDataUnit(classroom)];
  }
  if (normalizedGameId === 'circuit-lab') {
    return [isPrimary ? primaryDigitalUnit(classroom) : middleAlgorithmUnit(classroom)];
  }
  if (normalizedGameId === 'robot-maker') {
    return [isPrimary ? primaryDigitalUnit(classroom) : middleDesignUnit(classroom)];
  }
  // ระบบทางเทคโนโลยี (Input–Process–Output) — การออกแบบและเทคโนโลยี
  if (normalizedGameId === 'tech-system') {
    return [isPrimary ? primaryDigitalUnit(classroom) : middleDesignUnit(classroom)];
  }
  // เกมเศรษฐีวิทยาการคำนวณ — บอร์ดเกมเศรษฐศาสตร์ + แนวคิดเชิงคำนวณ
  if (normalizedGameId === 'tycoon' || normalizedGameId === 'digital-city-quest') {
    return [isPrimary ? primaryAlgorithmUnit(classroom) : middleAlgorithmUnit(classroom)];
  }
  // บอร์ดเกมแนวคิดเชิงคำนวณ — ครอบทั้ง 4 ทักษะ
  if (normalizedGameId === 'ct-board') {
    return [isPrimary ? primaryAlgorithmUnit(classroom) : middleAlgorithmUnit(classroom)];
  }
  // ค้นหา/คัดเลือกข้อมูลอย่างมีประสิทธิภาพ — ตามผลลัพธ์การเรียนรู้ข้อ 5
  if (normalizedGameId === 'search-smart') {
    return [isPrimary ? primaryDigitalUnit(classroom) : middleCodingUnit(classroom)];
  }
  // Cyber Shield: ป้อมปราการไซเบอร์ — ความปลอดภัยไซเบอร์และเครือข่าย
  if (normalizedGameId === 'cyber-shield') {
    return [isPrimary ? primaryDigitalUnit(classroom) : middleAlgorithmUnit(classroom)];
  }
  // คัดแยกด่วน: การจำแนกประเภทข้อมูล
  if (normalizedGameId === 'sorting-dash') {
    return [isPrimary ? primaryAlgorithmUnit(classroom) : middleAlgorithmUnit(classroom)];
  }
  // เก็บชิปหลบระเบิด: การควบคุมตัวแปรและอัลกอริทึม
  if (normalizedGameId === 'bomb-collector') {
    return [isPrimary ? primaryAlgorithmUnit(classroom) : middleAlgorithmUnit(classroom)];
  }
  // หลบสิ่งกีดขวาง: อัลกอริทึมการเคลื่อนที่
  if (normalizedGameId === 'obstacle-dodge') {
    return [isPrimary ? primaryAlgorithmUnit(classroom) : middleAlgorithmUnit(classroom)];
  }
  // ไหวพริบตัดสินใจ: จิตสำนึกดิจิทัลและความปลอดภัย
  if (normalizedGameId === 'situation-reaction') {
    return [isPrimary ? primaryDigitalUnit(classroom) : middleCodingUnit(classroom)];
  }
  // ประกอบคอมพิวเตอร์: ฮาร์ดแวร์และระบบคอมพิวเตอร์
  if (normalizedGameId === 'pc-builder') {
    return [isPrimary ? primaryDigitalUnit(classroom) : middleDesignUnit(classroom)];
  }
  // สีลวงสมอง: การประมวลผลข้อมูลและสมาธิ
  if (normalizedGameId === 'stroop-color') {
    return [isPrimary ? primaryAlgorithmUnit(classroom) : middleAlgorithmUnit(classroom)];
  }
  // ล่าสมบัติอวกาศ: การเขียนโค้ดและผังงานตรรกะ
  if (normalizedGameId === 'space-treasure') {
    return [isPrimary ? primaryAlgorithmUnit(classroom) : middleCodingUnit(classroom)];
  }
  // สายลับไอที: ความปลอดภัยไซเบอร์และ พ.ร.บ.คอมพิวเตอร์
  if (normalizedGameId === 'cyber-cop') {
    return [isPrimary ? primaryDigitalUnit(classroom) : middleCodingUnit(classroom)];
  }
  // อาร์เคดภารกิจครูคอม 100+ ด่าน
  if (normalizedGameId === 'krucom-arcade') {
    return [isPrimary ? primaryAlgorithmUnit(classroom) : middleCodingUnit(classroom)];
  }
  // บิงโกสัญลักษณ์ผังงาน
  if (normalizedGameId === 'flowchart-bingo') {
    return [isPrimary ? primaryAlgorithmUnit(classroom) : middleAlgorithmUnit(classroom)];
  }

  if (normalizedGameId === 'quick-answer') {
    if (isPrimary) {
      return [
        classroom === 'ป.1' || classroom === 'ป.2' || classroom === 'ป.3'
          ? primaryDigitalUnit(classroom)
          : primaryAlgorithmUnit(classroom),
      ];
    }
    return [middleAlgorithmUnit(classroom), middleDesignUnit(classroom)];
  }

  return [];
};

const subjectsForClassroom = (
  classroom: string,
  settings: CourseAccessSettings = getCourseAccessSettings(),
): Subject[] => {
  return getActiveSubjectsForClassroom(classroom, settings);
};

const hydratedGradebooks = new Set<string>();

export const buildGameProgressDedupKey = (gameTitle: string, activityKey?: string): string => {
  const normalizedActivityKey = activityKey?.trim().replace(/\s+/g, '-').slice(0, 120);
  return normalizedActivityKey
    ? `[Game] ${gameTitle}:${normalizedActivityKey}`
    : `[Game] ${gameTitle}`;
};

/** อัปเดต K/P/A ในกระดาษเกรดจาก progress ของนักเรียน (ใช้ทุกครั้งหลังบันทึกกิจกรรม) */
export const syncStudentGradesFromProgress = async (
  student: StudentLike,
  settings: CourseAccessSettings = getCourseAccessSettings(),
): Promise<void> => {
  await Promise.all(subjectsForClassroom(student.classroom, settings).map(async (subject) => {
    const gradebookKey = `${student.classroom}_${subject}`;
    if (!hydratedGradebooks.has(gradebookKey)) {
      const remote = await fetchClassroomFromFirebase(student.classroom, subject);
      if (remote) cacheGradesLocally(student.classroom, remote, subject);
      hydratedGradebooks.add(gradebookKey);
    }

    const rosterStudent = loadRoster(student.classroom).find((entry) => (
      entry.no === Number(student.studentNumber) || entry.name === student.name
    ));
    const grade = ensureStudentGrade(student.classroom, {
      studentCode: rosterStudent?.studentCode || student.id,
      studentNo: Number(student.studentNumber),
      name: student.name,
      emoji: rosterStudent?.emoji || '👤',
    }, subject);

    syncFromProgress(
      student.classroom,
      grade.studentCode,
      student.id,
      subject,
      'local',
    );
    // A previous attempt may have updated the local grade but failed remotely.
    // Always confirm the student row on retry, even when local values match.

    const updated = loadGrades(student.classroom, subject).find((entry) => (
      entry.studentCode === grade.studentCode
    ));
    if (updated) {
      await upsertStudentGradeToFirebase(student.classroom, updated, subject);
    }
  }));
};

export const recordGameProgress = async (
  gameId: GameProgressId,
  gameTitle: string,
  students: Array<StudentLike | null | undefined>,
  score?: number,
  activityKey?: string,
  maxScore?: number,
) => {
  if (score !== undefined && (!Number.isFinite(score) || score < 0)) {
    throw new RangeError('Invalid game score');
  }
  if (maxScore !== undefined && (!Number.isFinite(maxScore) || maxScore <= 0 || score === undefined || score > maxScore)) {
    throw new RangeError('Invalid game maximum');
  }
  let saved = 0;
  let savedStudents = 0;
  const seen = new Set<string>();
  const activeStudents: StudentLike[] = [];
  const courseAccessSettings = await fetchCourseAccessSettings().catch(() => getCourseAccessSettings());

  students.forEach((student) => {
    if (!isScoreEligibleUser(student) || seen.has(student.id)) return;
    seen.add(student.id);
    activeStudents.push(student);
  });

  for (const student of activeStudents) {
    const targets = filterTargetUnitsForCourseAccess(
      student.classroom,
      getGameTargetUnits(gameId, student.classroom),
      courseAccessSettings,
    );
    if (targets.length === 0) continue;
    for (const target of targets) {
      const scoreText = typeof score === 'number' ? ` score=${score}` : '';
      const normalizedActivityKey = activityKey?.trim().replace(/\s+/g, '-').slice(0, 120);
      const activityText = normalizedActivityKey ? ` activity=${normalizedActivityKey}` : '';
      const dedupKey = buildGameProgressDedupKey(gameTitle, activityKey);
      // กันซ้ำด้วยชื่อเกม (คงที่) ไม่รวมคะแนน — ไม่งั้นเล่นซ้ำแล้วได้คะแนนต่างกัน
      // จะกลายเป็นคนละรายการ ทำให้ปั๊มคะแนน P ได้เรื่อย ๆ
      const stored = await trackMediaClick(
        student.id,
        target.gradeId,
        target.unitNo,
        'fun',
        `[Game] ${gameTitle}${activityText}${scoreText}`,
        dedupKey,
      );
      if (!stored) {
        throw new Error(`บันทึกผลเกมของ ${student.name} ลง Firebase ไม่สำเร็จ`);
      }
      const inClass = isInClassTime(Date.now(), student.classroom, loadSchedule());
      const activeSubjects = subjectsForClassroom(student.classroom, courseAccessSettings);
      for (const subject of activeSubjects) {
        const linkedIndicator = getLinkedUnitsForSubject(student.classroom, subject)
          .find((entry) => entry.units.some((unit) => (
            unit.gradeId === target.gradeId && unit.unitNo === target.unitNo
          )))?.indicator;
        if (!linkedIndicator) continue;
        const evidenceKey = `${normalizeGameId(gameId)}-${subject}-${target.gradeId}-${target.unitNo}-${normalizedActivityKey || 'complete'}`;
        const evidenceBase = {
          studentId: student.id,
          studentCode: loadRoster(student.classroom).find((entry) => (
            entry.no === Number(student.studentNumber) || entry.name === student.name
          ))?.studentCode,
          studentName: student.name,
          classroom: student.classroom,
          subject,
          indicatorId: linkedIndicator?.id,
          indicatorCode: linkedIndicator?.code,
          source: 'game' as const,
          title: gameTitle,
          detail: `เกม ${gameTitle} หน่วย ${target.unitNo}${typeof score === 'number' ? ` คะแนน ${score}` : ''}`,
          score,
          maxScore,
          inClass,
          occurredAt: Date.now(),
        };
        await Promise.all([
          recordLearningEvidence({
            ...evidenceBase,
            domain: 'K',
            dedupKey: `${evidenceKey}-k`,
          }),
          recordLearningEvidence({
            ...evidenceBase,
            domain: 'P',
            dedupKey: `${evidenceKey}-p`,
          }),
        ]);
      }
      saved += 1;
    }
    await syncStudentGradesFromProgress(student, courseAccessSettings);
    savedStudents += 1;
  }

  return { saved, students: savedStudents };
};
