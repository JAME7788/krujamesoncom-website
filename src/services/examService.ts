// 📝 Exam Service: จัดการการทำแบบทดสอบออนไลน์และการบันทึกผลอย่างปลอดภัย (Non-destructive)
import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import {
  curriculumExamSets,
  getExamSetsByGrade,
  getExamSetById,
  availableExamGrades,
  type ExamSet,
  type ExamQuestion,
} from '../data/curriculumExamBank';

export {
  curriculumExamSets,
  getExamSetsByGrade,
  getExamSetById,
  availableExamGrades,
  type ExamSet,
  type ExamQuestion,
};

export interface ExamAttempt {
  id: string;
  studentId: string;
  studentName?: string;
  classroom: string;
  examSetId: string;
  examTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  answers: Record<string, number>; // questionId -> selectedOptionIndex
  timeSpentSeconds: number;
  timestamp: number;
}

const LOCAL_STORAGE_KEY = 'kj_exam_attempts_v1';
const FIRESTORE_COLLECTION = 'examAttempts';

const firebaseAvailable = (): boolean => {
  try {
    return Boolean(db && import.meta.env.VITE_FIREBASE_PROJECT_ID);
  } catch {
    return false;
  }
};

const inMemoryExamAttempts: ExamAttempt[] = [];

/** โหลดประวัติการสอบจาก LocalStorage */
export const loadLocalExamAttempts = (studentId?: string): ExamAttempt[] => {
  try {
    if (typeof localStorage === 'undefined') {
      if (studentId) {
        return inMemoryExamAttempts.filter((a) => a.studentId === studentId);
      }
      return [...inMemoryExamAttempts];
    }
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed: ExamAttempt[] = JSON.parse(raw);
    if (studentId) {
      return parsed.filter((a) => a.studentId === studentId);
    }
    return parsed;
  } catch {
    return typeof localStorage === 'undefined' ? [...inMemoryExamAttempts] : [];
  }
};

/** บันทึกผลการทำแบบทดสอบ (ทั้ง LocalStorage และ Firestore) */
export const saveExamAttempt = async (attempt: ExamAttempt): Promise<void> => {
  try {
    // 1. บันทึกลง LocalStorage หรือ Memory Fallback
    if (typeof localStorage !== 'undefined') {
      const current = loadLocalExamAttempts();
      const next = [attempt, ...current.filter((a) => a.id !== attempt.id)];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next.slice(0, 500)));
    } else {
      const idx = inMemoryExamAttempts.findIndex((a) => a.id === attempt.id);
      if (idx >= 0) inMemoryExamAttempts[idx] = attempt;
      else inMemoryExamAttempts.unshift(attempt);
    }

    // 2. บันทึกลง Firestore (แยกคอลเลกชันอิสระ ไม่แตะต้องคอลเลกชันคะแนนเดิม)
    if (firebaseAvailable() && db) {
      await setDoc(doc(db, FIRESTORE_COLLECTION, attempt.id), {
        ...attempt,
        serverUpdated: Date.now(),
      });
    }
  } catch (err) {
    console.warn('saveExamAttempt fallback warning:', err);
  }
};

/** ดึงผลการสอบทั้งหมด (ครูใช้ดูทั้งห้อง หรือนักเรียนดูของตนเอง) */
export const fetchExamAttempts = async (
  studentId?: string,
  classroom?: string
): Promise<ExamAttempt[]> => {
  const localItems = loadLocalExamAttempts(studentId);
  if (!firebaseAvailable() || !db) {
    if (classroom) {
      return localItems.filter((i) => i.classroom === classroom);
    }
    return localItems;
  }

  try {
    let q = query(collection(db, FIRESTORE_COLLECTION));
    if (studentId) {
      q = query(collection(db, FIRESTORE_COLLECTION), where('studentId', '==', studentId));
    } else if (classroom) {
      q = query(collection(db, FIRESTORE_COLLECTION), where('classroom', '==', classroom));
    }

    const snap = await getDocs(q);
    const remoteItems: ExamAttempt[] = snap.docs.map((d) => d.data() as ExamAttempt);
    if (remoteItems.length > 0) {
      // Merge with local
      const map = new Map<string, ExamAttempt>();
      for (const item of [...remoteItems, ...localItems]) {
        if (!map.has(item.id)) map.set(item.id, item);
      }
      return Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
    }
    return localItems;
  } catch {
    return localItems;
  }
};

/** คะแนนสูงสุดที่ทำได้ในชุดข้อสอบนั้น */
export const getBestScoreForExamSet = (
  studentId: string,
  examSetId: string
): { score: number; total: number; percentage: number } | null => {
  const attempts = loadLocalExamAttempts(studentId).filter((a) => a.examSetId === examSetId);
  if (attempts.length === 0) return null;
  const best = attempts.reduce((prev, cur) => (cur.score > prev.score ? cur : prev), attempts[0]);
  return {
    score: best.score,
    total: best.totalQuestions,
    percentage: best.percentage,
  };
};

/** สถิติการทำข้อสอบล่าสุด */
export const getLatestAttemptForExamSet = (
  studentId: string,
  examSetId: string
): ExamAttempt | null => {
  const attempts = loadLocalExamAttempts(studentId).filter((a) => a.examSetId === examSetId);
  if (attempts.length === 0) return null;
  return attempts.sort((a, b) => b.timestamp - a.timestamp)[0];
};
