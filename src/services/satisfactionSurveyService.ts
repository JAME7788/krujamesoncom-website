// แบบสอบถามความพึงพอใจการเรียนการสอนผ่านเว็บ (WBI + Gamification)
// เด็กตอบ 5 ระดับ (Likert) → ระบบเฉลี่ย → ป้อนเข้างานวิจัยอัตโนมัติ
// เก็บ Firestore surveys/{studentId} + localStorage mirror

import { db } from './firebase';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';

export const SURVEY_QUESTIONS: string[] = [
  'เนื้อหาบทเรียนในเว็บเข้าใจง่าย',
  'เว็บไซต์ใช้งานสะดวก ไม่ซับซ้อน',
  'ระบบเกม คะแนน XP และเหรียญตรา ทำให้อยากเรียนมากขึ้น',
  'แบบทดสอบและเกมช่วยให้เข้าใจบทเรียนดีขึ้น',
  'โดยรวมพอใจกับการเรียนผ่านเว็บนี้',
];

export interface SurveyResponse {
  studentId: string;
  classroom: string;
  answers: number[];   // 1-5 ต่อข้อ
  mean: number;
  submittedAt: number;
}

export interface SurveyStats {
  n: number;
  mean: number;                 // ค่าเฉลี่ยรวมทุกข้อทุกคน
  perQuestion: number[];        // ค่าเฉลี่ยรายข้อ
}

const fbAvailable = (): boolean => {
  try { return !!db && !!import.meta.env.VITE_FIREBASE_PROJECT_ID; } catch { return false; }
};

const LOCAL_KEY = (studentId: string) => `krujames_survey_${studentId}`;

export const hasSubmittedSurvey = (studentId: string): boolean => {
  try { return !!localStorage.getItem(LOCAL_KEY(studentId)); } catch { return false; }
};

export const submitSurvey = async (
  studentId: string,
  classroom: string,
  answers: number[],
): Promise<void> => {
  const mean = answers.length ? answers.reduce((s, x) => s + x, 0) / answers.length : 0;
  const resp: SurveyResponse = { studentId, classroom, answers, mean, submittedAt: Date.now() };
  try { localStorage.setItem(LOCAL_KEY(studentId), JSON.stringify(resp)); } catch { /* ignore */ }
  if (!fbAvailable()) return;
  try {
    await setDoc(doc(db, 'surveys', studentId), resp, { merge: true });
  } catch (e) {
    console.warn('submitSurvey firebase failed', e);
  }
};

/** ดึงแบบสอบถามทุกคนจาก Firebase → เก็บลง localStorage (สำหรับสรุปงานวิจัย) */
export const fetchAllSurveys = async (): Promise<SurveyResponse[]> => {
  if (!fbAvailable()) return loadLocalSurveys();
  try {
    const snap = await getDocs(collection(db, 'surveys'));
    const result: SurveyResponse[] = [];
    snap.forEach((d) => {
      const r = d.data() as SurveyResponse;
      if (r?.studentId && Array.isArray(r.answers)) {
        result.push(r);
        try { localStorage.setItem(LOCAL_KEY(r.studentId), JSON.stringify(r)); } catch { /* ignore */ }
      }
    });
    return result;
  } catch (e) {
    console.debug('fetchAllSurveys failed', e);
    return loadLocalSurveys();
  }
};

const loadLocalSurveys = (): SurveyResponse[] => {
  const result: SurveyResponse[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k?.startsWith('krujames_survey_')) continue;
    try {
      const r = JSON.parse(localStorage.getItem(k) || 'null');
      if (r?.studentId) result.push(r);
    } catch { /* ignore */ }
  }
  return result;
};

/** สรุปสถิติแบบสอบถาม (filter ตามชั้น — 'all' = ทุกชั้น) */
export const computeSurveyStats = (
  surveys: SurveyResponse[],
  classroom: string,
): SurveyStats => {
  const rows = classroom === 'all'
    ? surveys
    : surveys.filter((s) => s.classroom === classroom || s.studentId.startsWith(`${classroom}_`));
  const n = rows.length;
  if (n === 0) return { n: 0, mean: 0, perQuestion: SURVEY_QUESTIONS.map(() => 0) };
  const perQuestion = SURVEY_QUESTIONS.map((_, qi) => {
    const vals = rows.map((r) => r.answers[qi] || 0).filter((v) => v > 0);
    return vals.length ? Math.round((vals.reduce((s, x) => s + x, 0) / vals.length) * 100) / 100 : 0;
  });
  const mean = Math.round((rows.reduce((s, r) => s + r.mean, 0) / n) * 100) / 100;
  return { n, mean, perQuestion };
};
