// ระบบเก็บคะแนนวิชา "ทักษะอาชีพ" — แยกจาก ว 4.2 / ว 4.1
// ตารางเรียบง่าย: นักเรียน 1 คน → K (0-100) + P (พอใช้/ปานกลาง/ดี)
// ครูพิมพ์เอง ไม่มี auto-sync จากเกม/ควิซ

import { db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import type { Skill } from './gradeService';

export interface SkillScore {
  studentCode: string;
  studentNo: number;
  name: string;
  emoji: string;
  k: number;            // 0-100 คะแนนความรู้ (ครูใส่เอง)
  p: Skill;             // ทักษะ (พอใช้/ปานกลาง/ดี)
  pAssessed: boolean;   // ครูได้กรอกแล้วหรือยัง
  note?: string;
  updatedAt: number;
}

export const SKILL_K_MAX = 100;

const fbAvailable = (): boolean => {
  try { return !!db && !!import.meta.env.VITE_FIREBASE_PROJECT_ID; } catch { return false; }
};

const storageKey = (classroom: string) => `krujames_skill_grades_${classroom}`;

export const loadSkillGrades = (classroom: string): SkillScore[] => {
  try {
    const raw = localStorage.getItem(storageKey(classroom));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const syncToFirebase = async (classroom: string, scores: SkillScore[]) => {
  if (!fbAvailable()) return;
  try {
    // เก็บใน collection 'grades' เดียวกับ K/P/A หลัก
    // docId = 'skill_<classroom>' กันชนกับ K/P/A doc ของห้องนั้น
    const ref = doc(db, 'grades', `skill_${classroom}`);
    await setDoc(ref, {
      classroom, subject: 'skill', kind: 'skill-only',
      students: scores, updatedAt: Date.now(),
    }, { merge: true });
  } catch (e) {
    console.debug('skill grade sync skipped', e);
  }
};

export const saveSkillGrades = (classroom: string, scores: SkillScore[]) => {
  try {
    localStorage.setItem(storageKey(classroom), JSON.stringify(scores));
    void syncToFirebase(classroom, scores);
  } catch (e) {
    console.warn('saveSkillGrades failed', e);
  }
};

export const fetchSkillGradesFromFirebase = async (classroom: string): Promise<SkillScore[] | null> => {
  if (!fbAvailable()) return null;
  try {
    // อ่านจาก collection 'grades' เดียวกับ K/P/A หลัก (docId = 'skill_<classroom>')
    const ref = doc(db, 'grades', `skill_${classroom}`);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as { students?: SkillScore[] };
      return data?.students || null;
    }
    // fallback อ่านจาก collection เก่า (กรณีมีข้อมูลค้างจากตอน schema เก่า)
    const legacyRef = doc(db, 'skillGrades', classroom);
    const legacy = await getDoc(legacyRef);
    if (legacy.exists()) {
      const data = legacy.data() as { students?: SkillScore[] };
      return data?.students || null;
    }
  } catch (e) {
    console.debug('skill grade fetch failed', e);
  }
  return null;
};

export const updateSkillScore = (
  classroom: string,
  studentCode: string,
  patch: Partial<Pick<SkillScore, 'k' | 'p' | 'note'>>,
) => {
  const scores = loadSkillGrades(classroom);
  const idx = scores.findIndex((s) => s.studentCode === studentCode);
  if (idx === -1) return;
  scores[idx] = {
    ...scores[idx],
    ...patch,
    k: patch.k !== undefined ? Math.max(0, Math.min(SKILL_K_MAX, patch.k)) : scores[idx].k,
    pAssessed: patch.p !== undefined ? true : scores[idx].pAssessed,
    updatedAt: Date.now(),
  };
  saveSkillGrades(classroom, scores);
};

/** สร้าง row เริ่มต้นจาก roster ถ้ายังไม่มีข้อมูล */
export const initSkillGrades = (
  classroom: string,
  roster: { studentCode: string; no: number; name: string; emoji: string }[]
): SkillScore[] => {
  const existing = loadSkillGrades(classroom);
  const existingMap = new Map(existing.map((s) => [s.studentCode, s]));
  const result: SkillScore[] = roster.map((s) => {
    const prev = existingMap.get(s.studentCode);
    if (prev) return { ...prev, name: s.name, emoji: s.emoji, studentNo: s.no };
    return {
      studentCode: s.studentCode,
      studentNo: s.no,
      name: s.name,
      emoji: s.emoji,
      k: 0,
      p: 'พอใช้',
      pAssessed: false,
      updatedAt: Date.now(),
    };
  });
  saveSkillGrades(classroom, result);
  return result;
};
