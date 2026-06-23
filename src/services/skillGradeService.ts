// ระบบเก็บคะแนนวิชา "ทักษะอาชีพ" — แยกจาก ว 4.2 / ว 4.1
// ครูเพิ่มคอลัมน์ K ได้ (ใบงาน/กิจกรรม) แต่ละช่องมี maxScore ของตัวเอง
// P (ทักษะ) เก็บเป็น พอใช้/ปานกลาง/ดี เหมือนระบบหลัก
// ทุกอย่างเก็บใน Firestore collection 'grades' (docId = 'skill_<classroom>')

import { db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import type { Skill } from './gradeService';

/** คอลัมน์คะแนน K — ครูตั้งชื่อและคะแนนเต็มเอง */
export interface SkillAssignment {
  id: string;
  title: string;       // เช่น "ใบงานที่ 1: Logo"
  maxScore: number;    // คะแนนเต็มของช่องนี้
  createdAt: number;
}

export interface SkillScore {
  studentCode: string;
  studentNo: number;
  name: string;
  emoji: string;
  /** คะแนน K แต่ละช่อง — key = assignment.id, value = คะแนนที่ได้ (0..assignment.maxScore) */
  scores: Record<string, number>;
  p: Skill;
  pAssessed: boolean;
  note?: string;
  updatedAt: number;
}

export interface SkillGradeData {
  classroom: string;
  assignments: SkillAssignment[];
  students: SkillScore[];
  updatedAt: number;
}

const fbAvailable = (): boolean => {
  try { return !!db && !!import.meta.env.VITE_FIREBASE_PROJECT_ID; } catch { return false; }
};

const uid = () => `a_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const storageKey = (classroom: string) => `krujames_skill_grades_${classroom}`;

const empty = (classroom: string): SkillGradeData => ({
  classroom, assignments: [], students: [], updatedAt: Date.now(),
});

/** แปลง schema เก่า (k: number) → schema ใหม่ (scores: Record<string, number>) */
const migrateLegacy = (raw: unknown, classroom: string): SkillGradeData => {
  if (!raw || typeof raw !== 'object') return empty(classroom);
  const r = raw as Record<string, unknown>;
  // schema ใหม่ครบแล้ว
  if (Array.isArray(r.assignments) && Array.isArray(r.students)) {
    return r as unknown as SkillGradeData;
  }
  // schema เก่า — เป็น SkillScore[] ที่มี k: number ตรงๆ
  if (Array.isArray(r)) {
    const legacyAssignment: SkillAssignment = {
      id: 'legacy_k', title: 'คะแนน K (เก่า)', maxScore: 100, createdAt: Date.now(),
    };
    const students: SkillScore[] = (r as Array<Record<string, unknown>>).map((s) => ({
      studentCode: String(s.studentCode || ''),
      studentNo: Number(s.studentNo || 0),
      name: String(s.name || ''),
      emoji: String(s.emoji || '👤'),
      scores: { legacy_k: Number(s.k || 0) },
      p: (s.p as Skill) || 'พอใช้',
      pAssessed: !!s.pAssessed,
      note: s.note as string | undefined,
      updatedAt: Number(s.updatedAt || Date.now()),
    }));
    return { classroom, assignments: [legacyAssignment], students, updatedAt: Date.now() };
  }
  return empty(classroom);
};

export const loadSkillGradeData = (classroom: string): SkillGradeData => {
  try {
    const raw = localStorage.getItem(storageKey(classroom));
    if (!raw) return empty(classroom);
    return migrateLegacy(JSON.parse(raw), classroom);
  } catch {
    return empty(classroom);
  }
};

const syncToFirebase = async (data: SkillGradeData) => {
  if (!fbAvailable()) return;
  try {
    const ref = doc(db, 'grades', `skill_${data.classroom}`);
    await setDoc(ref, {
      classroom: data.classroom, subject: 'skill', kind: 'skill-only',
      assignments: data.assignments, students: data.students, updatedAt: Date.now(),
    }, { merge: true });
  } catch (e) {
    console.debug('skill grade sync skipped', e);
  }
};

export const saveSkillGradeData = (data: SkillGradeData) => {
  try {
    const next = { ...data, updatedAt: Date.now() };
    localStorage.setItem(storageKey(data.classroom), JSON.stringify(next));
    void syncToFirebase(next);
  } catch (e) {
    console.warn('saveSkillGradeData failed', e);
  }
};

export const fetchSkillGradeDataFromFirebase = async (classroom: string): Promise<SkillGradeData | null> => {
  if (!fbAvailable()) return null;
  try {
    // อ่านจาก collection 'grades' (docId = skill_<classroom>)
    const ref = doc(db, 'grades', `skill_${classroom}`);
    const snap = await getDoc(ref);
    if (snap.exists()) return migrateLegacy(snap.data(), classroom);
    // fallback อ่านจาก collection เก่า skillGrades/ (รุ่นแรกๆ)
    const legacy = await getDoc(doc(db, 'skillGrades', classroom));
    if (legacy.exists()) return migrateLegacy(legacy.data(), classroom);
  } catch (e) {
    console.debug('skill grade fetch failed', e);
  }
  return null;
};

// ---------- Assignment CRUD ----------
export const addSkillAssignment = (
  classroom: string,
  title: string,
  maxScore: number,
): SkillAssignment => {
  const data = loadSkillGradeData(classroom);
  const a: SkillAssignment = {
    id: uid(),
    title: title.trim() || 'ช่องคะแนนใหม่',
    maxScore: Math.max(1, Math.floor(maxScore || 10)),
    createdAt: Date.now(),
  };
  data.assignments.push(a);
  saveSkillGradeData(data);
  return a;
};

export const renameSkillAssignment = (
  classroom: string, assignmentId: string, patch: Partial<Pick<SkillAssignment, 'title' | 'maxScore'>>,
) => {
  const data = loadSkillGradeData(classroom);
  const idx = data.assignments.findIndex((a) => a.id === assignmentId);
  if (idx === -1) return;
  data.assignments[idx] = {
    ...data.assignments[idx],
    ...patch,
    title: patch.title !== undefined ? patch.title.trim() || data.assignments[idx].title : data.assignments[idx].title,
    maxScore: patch.maxScore !== undefined ? Math.max(1, Math.floor(patch.maxScore)) : data.assignments[idx].maxScore,
  };
  saveSkillGradeData(data);
};

export const deleteSkillAssignment = (classroom: string, assignmentId: string) => {
  const data = loadSkillGradeData(classroom);
  data.assignments = data.assignments.filter((a) => a.id !== assignmentId);
  // ลบช่อง score ของทุกนักเรียนด้วย
  data.students.forEach((s) => { delete s.scores[assignmentId]; });
  saveSkillGradeData(data);
};

// ---------- Student score CRUD ----------
export const updateSkillStudentScore = (
  classroom: string,
  studentCode: string,
  assignmentId: string,
  score: number,
) => {
  const data = loadSkillGradeData(classroom);
  const a = data.assignments.find((x) => x.id === assignmentId);
  if (!a) return;
  const s = data.students.find((x) => x.studentCode === studentCode);
  if (!s) return;
  const clamped = Math.max(0, Math.min(a.maxScore, score));
  s.scores[assignmentId] = clamped;
  s.updatedAt = Date.now();
  saveSkillGradeData(data);
};

export const updateSkillStudentP = (
  classroom: string,
  studentCode: string,
  p: Skill,
) => {
  const data = loadSkillGradeData(classroom);
  const s = data.students.find((x) => x.studentCode === studentCode);
  if (!s) return;
  s.p = p;
  s.pAssessed = true;
  s.updatedAt = Date.now();
  saveSkillGradeData(data);
};

/** สร้าง row นักเรียนจาก roster (ไม่ทับ assignment/คะแนนที่กรอกแล้ว) */
export const resetSkillStudentsFromRoster = (
  classroom: string,
  roster: { studentCode: string; no: number; name: string; emoji: string }[],
): SkillGradeData => {
  const data = loadSkillGradeData(classroom);
  const existingMap = new Map(data.students.map((s) => [s.studentCode, s]));
  data.students = roster.map((r) => {
    const prev = existingMap.get(r.studentCode);
    if (prev) return { ...prev, studentNo: r.no, name: r.name, emoji: r.emoji };
    return {
      studentCode: r.studentCode, studentNo: r.no, name: r.name, emoji: r.emoji,
      scores: {}, p: 'พอใช้', pAssessed: false, updatedAt: Date.now(),
    };
  });
  saveSkillGradeData(data);
  return data;
};

/** คะแนน K รวมของนักเรียน — แสดง earned/total ของทุกช่อง */
export const totalSkillK = (student: SkillScore, assignments: SkillAssignment[]): { earned: number; total: number } => {
  let earned = 0;
  let total = 0;
  assignments.forEach((a) => {
    earned += student.scores[a.id] || 0;
    total += a.maxScore;
  });
  return { earned, total };
};
