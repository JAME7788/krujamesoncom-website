import { trackMediaClick } from './progressService';
import { loadGrades, syncFromProgress } from './gradeService';
import type { Subject } from './gradeService';

export type GameProgressId =
  | 'mouse'
  | 'keyboard'
  | 'algorithm'
  | 'binary'
  | 'memory'
  | 'pattern'
  | 'coding-maze'
  | 'snake'
  | 'bug-catcher';

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

export const getGameTargetUnits = (gameId: GameProgressId, classroom: string): TargetUnit[] => {
  const isPrimary = classroom.startsWith('ป.');
  const isMiddle = classroom.startsWith('ม.');
  if (!isPrimary && !isMiddle) return [];

  if (gameId === 'mouse' || gameId === 'keyboard' || gameId === 'memory') {
    return [isPrimary ? primaryDigitalUnit(classroom) : middleAlgorithmUnit(classroom)];
  }

  if (gameId === 'algorithm' || gameId === 'pattern') {
    return [isPrimary ? primaryAlgorithmUnit(classroom) : middleAlgorithmUnit(classroom)];
  }

  if (gameId === 'coding-maze' || gameId === 'snake' || gameId === 'bug-catcher') {
    return [isPrimary ? primaryCodingUnit(classroom) : middleCodingUnit(classroom)];
  }

  if (gameId === 'binary') {
    return isMiddle ? [middleBinaryUnit(classroom)] : [];
  }

  return [];
};

const subjectsForClassroom = (classroom: string): Subject[] => {
  if (classroom.startsWith('ม.')) return ['cs', 'dt'];
  return ['main'];
};

/** อัปเดต K/P/A ในกระดาษเกรดจาก progress ของนักเรียน (ใช้ทุกครั้งหลังบันทึกกิจกรรม) */
export const syncStudentGradesFromProgress = (student: StudentLike) => {
  subjectsForClassroom(student.classroom).forEach((subject) => {
    const grades = loadGrades(student.classroom, subject);
    const grade = grades.find(
      (g) => g.studentNo === Number(student.studentNumber) || g.name === student.name
    );
    if (grade) syncFromProgress(student.classroom, grade.studentCode, student.id, subject);
  });
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

  students.forEach((student) => {
    if (!student?.id || student.id === 'admin_teacher_account' || seen.has(student.id)) return;
    seen.add(student.id);
    activeStudents.push(student);
  });

  for (const student of activeStudents) {
    const targets = getGameTargetUnits(gameId, student.classroom);
    for (const target of targets) {
      const scoreText = typeof score === 'number' ? ` score=${score}` : '';
      await trackMediaClick(
        student.id,
        target.gradeId,
        target.unitNo,
        'fun',
        `[Game] ${gameTitle}${scoreText}`
      );
      saved += 1;
    }
    syncStudentGradesFromProgress(student);
  }

  return { saved, students: activeStudents.length };
};
