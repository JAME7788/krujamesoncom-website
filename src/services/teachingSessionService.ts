import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import {
  buildTechnologyTeachingSchedule,
  type TechnologyGradeId,
  type TechnologyTeachingScheduleRow,
} from '../data/technologyTeachingSchedule';
import type { Subject } from './gradeService';
import { writeAuditLog } from './auditLogService';
import { isSchoolTeachingDate } from '../data/schoolCalendar2569';

export type TeachingSessionStatus =
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'postponed'
  | 'makeup';

export interface TeachingSession {
  id: string;
  academicYear: string;
  gradeId: TechnologyGradeId;
  classroom: string;
  subject: Subject;
  period: number;
  week: number;
  semester: 1 | 2;
  unitNo: number;
  unitTitle: string;
  lessonTitle: string;
  indicatorCodes: string[];
  plannedDate: string;
  teachingDate?: string;
  status: TeachingSessionStatus;
  note?: string;
  startedAt?: number;
  completedAt?: number;
  updatedAt: number;
  updatedBy: string;
}

const COLLECTION = 'teachingSessions';
const ACADEMIC_YEAR = '2569';
const LOCAL_KEY = 'krujames_teaching_sessions_v1';
export const TERM_1_START_DATE = '2026-05-05';
export const TERM_2_START_DATE = '2026-11-02';

const firebaseAvailable = () => {
  try { return Boolean(db && import.meta.env.VITE_FIREBASE_PROJECT_ID); } catch { return false; }
};

const toIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ต้องตรงกับ defaultSchedule ใน src/data/schedule.ts เสมอ — มีเทสต์กันไว้ใน scheduleConsistency.test.ts
// นี่คือสำเนาตารางสอนชุดที่ 3 ของระบบ (อีกสองชุดคือ schedule.ts และ WEEKLY_SLOTS)
// ค่าทั้งหมดยึดตามตารางสอนจริงของโรงเรียน ไม่ใช่การอนุมานจาก log การใช้งาน
const weekdayByGrade: Record<TechnologyGradeId, number> = {
  p1: 3,
  p2: 1,
  p3: 5,
  p4: 3,
  p5: 3,
  p6: 4,
  m1: 1,
  m2: 5,
  m3: 4,
};

const firstWeekdayOnOrAfter = (start: Date, weekday: number) => {
  const date = new Date(start);
  const offset = (weekday - date.getDay() + 7) % 7;
  date.setDate(date.getDate() + offset);
  return date;
};

const teachingDatesForRows = (
  gradeId: TechnologyGradeId,
  rows: TechnologyTeachingScheduleRow[],
): Map<number, string> => {
  const result = new Map<number, string>();
  ([1, 2] as const).forEach((semester) => {
    const semesterRows = rows
      .filter((row) => row.semester === semester)
      .sort((a, b) => a.period - b.period);
    const [year, month, day] = (semester === 1
      ? TERM_1_START_DATE
      : TERM_2_START_DATE).split('-').map(Number);
    const cursor = firstWeekdayOnOrAfter(
      new Date(year, month - 1, day),
      weekdayByGrade[gradeId],
    );

    semesterRows.forEach((row) => {
      while (!isSchoolTeachingDate(toIsoDate(cursor))) {
        cursor.setDate(cursor.getDate() + 7);
      }
      result.set(row.period, toIsoDate(cursor));
      cursor.setDate(cursor.getDate() + 7);
    });
  });
  return result;
};

const sessionId = (
  gradeId: TechnologyGradeId,
  subject: Subject,
  period: number,
) => `${ACADEMIC_YEAR}_${gradeId}_${subject}_${String(period).padStart(2, '0')}`;

const cacheSessions = (sessions: TeachingSession[]) => {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(sessions)); } catch { /* optional */ }
};

export const loadTeachingSessions = (): TeachingSession[] => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) as TeachingSession[] : [];
  } catch {
    return [];
  }
};

export const buildDefaultTeachingSessions = (
  gradeId: TechnologyGradeId,
): TeachingSession[] => {
  const schedule = buildTechnologyTeachingSchedule(gradeId);
  const subject: Subject = gradeId.startsWith('m') ? 'cs' : 'main';
  const plannedDates = teachingDatesForRows(gradeId, schedule.rows);
  return schedule.rows.map((row) => ({
    id: sessionId(gradeId, subject, row.period),
    academicYear: ACADEMIC_YEAR,
    gradeId,
    classroom: schedule.gradeLabel,
    subject,
    period: row.period,
    week: row.week,
    semester: row.semester,
    unitNo: row.unitNo,
    unitTitle: row.unitTitle,
    lessonTitle: row.lessonTitle,
    indicatorCodes: row.indicators,
    plannedDate: plannedDates.get(row.period) || '',
    status: 'planned',
    updatedAt: 0,
    updatedBy: 'system',
  }));
};

const mergeDefaults = (
  gradeId: TechnologyGradeId,
  saved: TeachingSession[],
): TeachingSession[] => {
  const byId = new Map(saved.map((item) => [item.id, item]));
  return buildDefaultTeachingSessions(gradeId).map((item) => {
    const saved = byId.get(item.id);
    return {
      ...item,
      ...(saved || {}),
      // วันที่ตามแผนเป็นข้อมูลกลางจากปฏิทินโรงเรียน ไม่ใช้ค่ารุ่นเก่าที่นับวันหยุดเป็นคาบ
      plannedDate: item.plannedDate,
    };
  });
};

export const fetchTeachingSessions = async (
  gradeId: TechnologyGradeId,
): Promise<TeachingSession[]> => {
  const localForGrade = loadTeachingSessions().filter((item) => item.gradeId === gradeId);
  if (!firebaseAvailable()) return mergeDefaults(gradeId, localForGrade);
  try {
    const snapshot = await getDocs(query(
      collection(db, COLLECTION),
      where('gradeId', '==', gradeId),
    ));
    const remote = snapshot.docs.map((item) => item.data() as TeachingSession);
    const merged = mergeDefaults(gradeId, remote.length ? remote : localForGrade);
    const otherGrades = loadTeachingSessions().filter((item) => item.gradeId !== gradeId);
    cacheSessions([...otherGrades, ...merged]);
    return merged;
  } catch (error) {
    console.warn('fetch teaching sessions failed, using local cache', error);
    return mergeDefaults(gradeId, localForGrade);
  }
};

export const saveTeachingSession = async (
  session: TeachingSession,
  patch: Partial<TeachingSession>,
  actor = 'teacher',
): Promise<TeachingSession> => {
  const updated: TeachingSession = {
    ...session,
    ...patch,
    updatedAt: Date.now(),
    updatedBy: actor,
  };
  const local = loadTeachingSessions();
  cacheSessions([updated, ...local.filter((item) => item.id !== updated.id)]);
  if (firebaseAvailable()) {
    await setDoc(doc(db, COLLECTION, updated.id), updated, { merge: true });
  }
  await writeAuditLog({
    action: 'session',
    entityType: 'teachingSession',
    entityId: updated.id,
    classroom: updated.classroom,
    subject: updated.subject,
    summary: `${updated.lessonTitle}: ${updated.status}`,
    before: session,
    after: updated,
  });
  return updated;
};
