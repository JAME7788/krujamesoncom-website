import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import type { Subject } from './gradeService';
import { db } from './firebase';

const KEY = 'krujames_course_access_v1';
const ACCESS_DOC = doc(db, 'schedule', 'courseAccess');
const P = '\u0e1b.';
const M = '\u0e21.';

export type CourseAccessSettings = {
  activeSubjectsByClassroom: Record<string, Subject[]>;
  openCourseIdsByClassroom: Record<string, string[]>;
  updatedAt?: number;
};

export type TargetUnitRef = {
  gradeId: string;
  unitNo: number;
};

const validSubjects: Subject[] = ['main', 'cs', 'dt'];

const cls = (prefix: string, n: number) => `${prefix}${n}`;
const mCourse = (classroom: string, subject: 'cs' | 'dt') => {
  const level = classroom.replace(M, '');
  return `m${level}-${subject === 'dt' ? 'design' : 'cs'}`;
};

export const CLASSROOMS = [
  cls(P, 1),
  cls(P, 2),
  cls(P, 3),
  cls(P, 4),
  cls(P, 5),
  cls(P, 6),
  cls(M, 1),
  cls(M, 2),
  cls(M, 3),
];

const classroomCourseIds: Record<string, string[]> = {
  [cls(P, 1)]: ['p1', 'ai-p1-3'],
  [cls(P, 2)]: ['p2', 'ai-p1-3'],
  [cls(P, 3)]: ['p3', 'ai-p1-3'],
  [cls(P, 4)]: ['p4', 'ai-p4-6'],
  [cls(P, 5)]: ['p5', 'ai-p4-6'],
  [cls(P, 6)]: ['p6', 'ai-p4-6'],
  [cls(M, 1)]: ['m1-cs', 'm1-design', 'ai-m1-3', 'arduino-basic', 'electronics-basic'],
  [cls(M, 2)]: ['m2-cs', 'm2-design', 'ai-m1-3', 'arduino-basic', 'electronics-basic'],
  [cls(M, 3)]: ['m3-cs', 'm3-design', 'ai-m1-3', 'arduino-basic', 'electronics-basic'],
};

const defaultOpenCourseIdsByClassroom: Record<string, string[]> = {
  [cls(P, 1)]: ['p1', 'ai-p1-3'],
  [cls(P, 2)]: ['p2', 'ai-p1-3'],
  [cls(P, 3)]: ['p3', 'ai-p1-3'],
  [cls(P, 4)]: ['p4', 'ai-p4-6'],
  [cls(P, 5)]: ['p5', 'ai-p4-6'],
  [cls(P, 6)]: ['p6', 'ai-p4-6'],
  [cls(M, 1)]: ['m1-cs', 'ai-m1-3', 'arduino-basic', 'electronics-basic'],
  [cls(M, 2)]: ['m2-cs', 'ai-m1-3', 'arduino-basic', 'electronics-basic'],
  [cls(M, 3)]: ['m3-cs', 'ai-m1-3', 'arduino-basic', 'electronics-basic'],
};

export const defaultCourseAccessSettings = (): CourseAccessSettings => ({
  activeSubjectsByClassroom: {
    [cls(P, 1)]: ['main'],
    [cls(P, 2)]: ['main'],
    [cls(P, 3)]: ['main'],
    [cls(P, 4)]: ['main'],
    [cls(P, 5)]: ['main'],
    [cls(P, 6)]: ['main'],
    [cls(M, 1)]: ['cs'],
    [cls(M, 2)]: ['cs'],
    [cls(M, 3)]: ['cs'],
  },
  openCourseIdsByClassroom: defaultOpenCourseIdsByClassroom,
});

const normalizeSubjectList = (raw: unknown, fallback: Subject[]): Subject[] => {
  if (!Array.isArray(raw)) return fallback;
  const cleaned = raw.filter((item): item is Subject => validSubjects.includes(item as Subject));
  return cleaned.length > 0 ? Array.from(new Set(cleaned)) : fallback;
};

const normalizeCourseIds = (raw: unknown, fallback: string[]): string[] => {
  if (!Array.isArray(raw)) return fallback;
  const cleaned = raw.map(String).map((item) => item.trim()).filter(Boolean);
  return cleaned.length > 0 ? Array.from(new Set(cleaned)) : fallback;
};

export const normalizeCourseAccessSettings = (raw: unknown): CourseAccessSettings => {
  const defaults = defaultCourseAccessSettings();
  const data = raw && typeof raw === 'object' && !Array.isArray(raw)
    ? raw as Partial<CourseAccessSettings>
    : {};

  const activeSubjectsByClassroom: Record<string, Subject[]> = {};
  Object.entries(defaults.activeSubjectsByClassroom).forEach(([classroom, fallback]) => {
    activeSubjectsByClassroom[classroom] = normalizeSubjectList(
      data.activeSubjectsByClassroom?.[classroom],
      fallback,
    );
  });

  const openCourseIdsByClassroom: Record<string, string[]> = {};
  Object.entries(defaults.openCourseIdsByClassroom).forEach(([classroom, fallback]) => {
    const subjects = activeSubjectsByClassroom[classroom] || [];
    const normalized = normalizeCourseIds(data.openCourseIdsByClassroom?.[classroom], fallback);
    const withCore = normalized.filter((courseId) => {
      if (courseId.endsWith('-design')) return subjects.includes('dt');
      if (courseId.endsWith('-cs')) return subjects.includes('cs');
      return true;
    });
    const coreIds = classroom.startsWith(M)
      ? subjects
          .filter((subject): subject is 'cs' | 'dt' => subject === 'cs' || subject === 'dt')
          .map((subject) => subject === 'dt' ? mCourse(classroom, 'dt') : mCourse(classroom, 'cs'))
      : [];
    openCourseIdsByClassroom[classroom] = Array.from(new Set([...withCore, ...coreIds]));
  });

  return {
    activeSubjectsByClassroom,
    openCourseIdsByClassroom,
    updatedAt: Number(data.updatedAt) || Date.now(),
  };
};

const loadLocalCourseAccessSettings = (): CourseAccessSettings => {
  try {
    const raw = localStorage.getItem(KEY);
    return normalizeCourseAccessSettings(raw ? JSON.parse(raw) : {});
  } catch {
    return normalizeCourseAccessSettings({});
  }
};

const saveLocalCourseAccessSettings = (settings: CourseAccessSettings) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(normalizeCourseAccessSettings(settings)));
  } catch (e) {
    console.warn('save local course access failed', e);
  }
};

export const getCourseAccessSettings = (): CourseAccessSettings => loadLocalCourseAccessSettings();

export const fetchCourseAccessSettings = async (): Promise<CourseAccessSettings> => {
  try {
    const snap = await getDoc(ACCESS_DOC);
    if (snap.exists()) {
      const remote = normalizeCourseAccessSettings(snap.data());
      saveLocalCourseAccessSettings(remote);
      return remote;
    }

    const local = loadLocalCourseAccessSettings();
    await saveCourseAccessSettings(local);
    return local;
  } catch (e) {
    console.warn('fetch course access failed, using local cache', e);
    return loadLocalCourseAccessSettings();
  }
};

export const saveCourseAccessSettings = async (
  settings: CourseAccessSettings,
): Promise<CourseAccessSettings> => {
  const normalized = normalizeCourseAccessSettings({ ...settings, updatedAt: Date.now() });
  saveLocalCourseAccessSettings(normalized);
  await setDoc(ACCESS_DOC, normalized, { merge: true });
  return normalized;
};

export const subscribeCourseAccessSettings = (
  onChange: (settings: CourseAccessSettings) => void,
  onError?: (error: unknown) => void,
) => onSnapshot(
  ACCESS_DOC,
  (snap) => {
    if (!snap.exists()) {
      onChange(loadLocalCourseAccessSettings());
      return;
    }
    const remote = normalizeCourseAccessSettings(snap.data());
    saveLocalCourseAccessSettings(remote);
    onChange(remote);
  },
  (error) => {
    console.warn('course access subscription failed', error);
    onError?.(error);
  },
);

export const getOpenCourseIdsForClassroom = (
  classroom: string,
  settings: CourseAccessSettings = loadLocalCourseAccessSettings(),
): string[] => settings.openCourseIdsByClassroom[classroom] || [];

export const getCourseIdsForClassroom = (classroom: string): string[] => (
  classroomCourseIds[classroom] || []
);

export const getClassroomsForCourseId = (courseId: string): string[] => (
  CLASSROOMS.filter((classroom) => getCourseIdsForClassroom(classroom).includes(courseId))
);

export const getActiveSubjectsForClassroom = (
  classroom: string,
  settings: CourseAccessSettings = loadLocalCourseAccessSettings(),
): Subject[] => settings.activeSubjectsByClassroom[classroom] || (classroom.startsWith(M) ? ['cs'] : ['main']);

export const isCourseOpenForClassroom = (
  classroom: string,
  gradeId: string,
  settings: CourseAccessSettings = loadLocalCourseAccessSettings(),
): boolean => getOpenCourseIdsForClassroom(classroom, settings).includes(gradeId);

export const getSubjectForGradeId = (
  gradeId: string,
  classroom: string,
  settings: CourseAccessSettings = loadLocalCourseAccessSettings(),
): Subject | null => {
  const activeSubjects = getActiveSubjectsForClassroom(classroom, settings);
  if (classroom.startsWith(P) || gradeId.startsWith('p')) return activeSubjects.includes('main') ? 'main' : null;
  if (gradeId.endsWith('-cs')) return activeSubjects.includes('cs') ? 'cs' : null;
  if (gradeId.endsWith('-design')) return activeSubjects.includes('dt') ? 'dt' : null;
  return activeSubjects.find((subject) => subject !== 'main') || activeSubjects[0] || null;
};

export const getDefaultProgressGradeIdForClassroom = (
  classroom: string,
  settings: CourseAccessSettings = loadLocalCourseAccessSettings(),
): string | null => {
  if (classroom.startsWith(P)) return `p${classroom.replace(P, '')}`;
  if (!classroom.startsWith(M)) return null;
  const activeSubjects = getActiveSubjectsForClassroom(classroom, settings);
  if (activeSubjects.includes('cs')) return mCourse(classroom, 'cs');
  if (activeSubjects.includes('dt')) return mCourse(classroom, 'dt');
  return null;
};

export const filterTargetUnitsForCourseAccess = (
  classroom: string,
  targetUnits: TargetUnitRef[],
  settings: CourseAccessSettings = loadLocalCourseAccessSettings(),
): TargetUnitRef[] => {
  if (!classroom) return [];
  return targetUnits.filter((target) => {
    if (!isCourseOpenForClassroom(classroom, target.gradeId, settings)) return false;
    return getSubjectForGradeId(target.gradeId, classroom, settings) !== null;
  });
};

export const setMiddleSchoolCsOnly = (
  settings: CourseAccessSettings = loadLocalCourseAccessSettings(),
): CourseAccessSettings => {
  const next = normalizeCourseAccessSettings(settings);
  [cls(M, 1), cls(M, 2), cls(M, 3)].forEach((classroom) => {
    next.activeSubjectsByClassroom[classroom] = ['cs'];
    next.openCourseIdsByClassroom[classroom] = getOpenCourseIdsForClassroom(classroom, next)
      .filter((courseId) => !courseId.endsWith('-design'));
    const csId = mCourse(classroom, 'cs');
    if (!next.openCourseIdsByClassroom[classroom].includes(csId)) {
      next.openCourseIdsByClassroom[classroom].unshift(csId);
    }
  });
  return normalizeCourseAccessSettings(next);
};
