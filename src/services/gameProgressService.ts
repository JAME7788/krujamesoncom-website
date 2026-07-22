import { trackMediaClick } from './progressService';
import {
  cacheGradesLocally,
  ensureStudentGrade,
  fetchClassroomFromFirebase,
  loadGrades,
  syncFromProgress,
  upsertStudentGradeToFirebase,
} from './gradeService';
import type { Subject } from './gradeService';
import { loadRoster } from './rosterService';
import {
  fetchCourseAccessSettings,
  filterTargetUnitsForCourseAccess,
  getActiveSubjectsForClassroom,
  getCourseAccessSettings,
  type CourseAccessSettings,
} from './courseAccessService';

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
  | 'logic-gates';

type StudentLike = {
  id: string;
  name: string;
  classroom: string;
  studentNumber: string;
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
  const normalizedGameId = normalizeGameId(gameId);
  const isPrimary = classroom.startsWith('ป.');
  const isMiddle = classroom.startsWith('ม.');
  if (!isPrimary && !isMiddle) return [];

  if (normalizedGameId === 'mouse' || normalizedGameId === 'keyboard' || normalizedGameId === 'memory') {
    return [isPrimary ? primaryDigitalUnit(classroom) : middleAlgorithmUnit(classroom)];
  }

  if (normalizedGameId === 'algorithm' || normalizedGameId === 'pattern') {
    return [isPrimary ? primaryAlgorithmUnit(classroom) : middleAlgorithmUnit(classroom)];
  }

  if (normalizedGameId === 'coding-maze' || normalizedGameId === 'snake' || normalizedGameId === 'bug-catcher') {
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
  if (normalizedGameId === 'pixel-art') {
    return [isPrimary ? primaryAlgorithmUnit(classroom) : middleBinaryUnit(classroom)];
  }
  // ตรรกะบูลีน AND/OR/NOT — แนวคิดเชิงคำนวณ
  if (normalizedGameId === 'logic-gates') {
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

    const result = syncFromProgress(
      student.classroom,
      grade.studentCode,
      student.id,
      subject,
      'local',
    );
    if (result.changed === 0) return;

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
  score?: number
) => {
  let saved = 0;
  const seen = new Set<string>();
  const activeStudents: StudentLike[] = [];
  const courseAccessSettings = await fetchCourseAccessSettings().catch(() => getCourseAccessSettings());

  students.forEach((student) => {
    if (!student?.id || student.id === 'admin_teacher_account' || seen.has(student.id)) return;
    seen.add(student.id);
    activeStudents.push(student);
  });

  for (const student of activeStudents) {
    const targets = filterTargetUnitsForCourseAccess(
      student.classroom,
      getGameTargetUnits(gameId, student.classroom),
      courseAccessSettings,
    );
    for (const target of targets) {
      const scoreText = typeof score === 'number' ? ` score=${score}` : '';
      const stored = await trackMediaClick(
        student.id,
        target.gradeId,
        target.unitNo,
        'fun',
        `[Game] ${gameTitle}${scoreText}`
      );
      if (!stored) {
        throw new Error(`บันทึกผลเกมของ ${student.name} ลง Firebase ไม่สำเร็จ`);
      }
      saved += 1;
    }
    await syncStudentGradesFromProgress(student, courseAccessSettings);
  }

  return { saved, students: activeStudents.length };
};
