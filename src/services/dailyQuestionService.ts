// คำถามประจำวัน — ครูตั้ง 1 คำถามต่อวัน นักเรียนตอบได้ครั้งเดียว
// ตอบถูก +10 XP, ตอบผิด/พยายาม +3 XP
// เก็บ Firebase dailyQuestions/{YYYY-MM-DD}

import { db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { awardBonus, getProgress, fetchStudentProgress } from './progressService';

export interface DailyQuestion {
  date: string;              // YYYY-MM-DD
  question: string;
  options: string[];         // 2-4 choices
  correctIndex: number;
  createdAt: number;
  createdBy?: string;
}

export interface DailyAnswerRecord {
  studentId: string;
  date: string;
  choice: number;
  correct: boolean;
  answeredAt: number;
}

const fbAvailable = (): boolean => {
  try { return !!db && !!import.meta.env.VITE_FIREBASE_PROJECT_ID; } catch { return false; }
};

export const todayDateKey = (): string => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const LOCAL_KEY = (date: string) => `krujames_daily_q_${date}`;

export const loadDailyQuestionLocal = (date: string): DailyQuestion | null => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY(date));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

export const fetchDailyQuestion = async (date: string): Promise<DailyQuestion | null> => {
  const local = loadDailyQuestionLocal(date);
  if (!fbAvailable()) return local;
  try {
    const ref = doc(db, 'dailyQuestions', date);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as DailyQuestion;
      try { localStorage.setItem(LOCAL_KEY(date), JSON.stringify(data)); } catch { /* ignore */ }
      return data;
    }
  } catch (e) {
    console.debug('dailyQuestion fetch failed', e);
  }
  return local;
};

export const saveDailyQuestion = async (q: DailyQuestion): Promise<{ ok: boolean; error?: string }> => {
  try { localStorage.setItem(LOCAL_KEY(q.date), JSON.stringify(q)); } catch { /* ignore */ }
  if (!fbAvailable()) return { ok: true };
  try {
    await setDoc(doc(db, 'dailyQuestions', q.date), q, { merge: true });
    return { ok: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.warn('saveDailyQuestion failed', e);
    return { ok: false, error };
  }
};

/** ตรวจว่านักเรียนตอบคำถามวันนี้แล้วหรือยัง (ดูจาก progress.bonuses) */
export const hasAnsweredToday = (studentId: string, date: string): boolean => {
  const prog = getProgress(studentId);
  const tag = `[Daily:${date}]`;
  return (prog.bonuses || []).some((b) => b.reason.startsWith(tag));
};

/** บันทึกคำตอบของนักเรียน — เพิ่ม XP (10 ถ้าถูก, 3 ถ้าผิด) ผ่าน awardBonus */
export const answerDailyQuestion = async (
  studentId: string,
  date: string,
  question: DailyQuestion,
  choice: number,
): Promise<{ correct: boolean; xpAwarded: number }> => {
  // ensure cache
  await fetchStudentProgress(studentId);
  if (hasAnsweredToday(studentId, date)) {
    return { correct: choice === question.correctIndex, xpAwarded: 0 };
  }
  const correct = choice === question.correctIndex;
  const xp = correct ? 10 : 3;
  const stored = await awardBonus(studentId, {
    emoji: correct ? '✅' : '📝',
    reason: `[Daily:${date}] ${correct ? 'ตอบถูก' : 'พยายามตอบ'}`,
    xp,
  });
  if (!stored) throw new Error('บันทึกคำตอบเข้า Firebase ไม่สำเร็จ');
  return { correct, xpAwarded: xp };
};
