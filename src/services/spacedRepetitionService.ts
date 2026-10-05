// 🧠 Ebbinghaus Spaced Repetition Service (ระบบการทบทวนความจำเว้นระยะห่าง)
// ช่วยแก้ปัญหาการลืมตามเส้นโค้งการลืมของ Ebbinghaus (Forgetting Curve)
// บันทึกเฉพาะจุดที่ผู้เรียนตอบผิดเพื่อจัดคิวทบทวนตามคาบเวลาอย่างชาญฉลาด (Non-destructive)

export interface MissedQuestionItem {
  id: string;
  studentId: string;
  questionText: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  source: string; // e.g. "exam_ป1_set1", "unit_quiz_p1_1"
  grade?: string;
  mistakeCount: number;
  reviewStage: number; // 0 = New, 1 = 1 day, 2 = 3 days, 3 = 7 days (Mastered)
  lastReviewedAt: number;
  nextReviewDue: number;
  mastered: boolean;
}

const STORAGE_KEY = 'kj_spaced_review_mistakes_v1';
const REVIEW_INTERVALS_MS = [
  0,                  // Stage 0: ทันที / ภายในวันนี้
  24 * 3600 * 1000,   // Stage 1: 1 วันถัดไป
  3 * 24 * 3600 * 1000, // Stage 2: 3 วันถัดไป
  7 * 24 * 3600 * 1000, // Stage 3: 7 วันถัดไป ➔ ผ่านสมบูรณ์ (Mastered)
];

const inMemoryStore: MissedQuestionItem[] = [];

/** โหลดรายการข้อที่ตอบผิดทั้งหมด */
export const loadAllMissedQuestions = (studentId?: string): MissedQuestionItem[] => {
  try {
    let items: MissedQuestionItem[] = [];
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      items = raw ? JSON.parse(raw) : [];
    } else {
      items = [...inMemoryStore];
    }
    if (studentId) {
      return items.filter((i) => i.studentId === studentId);
    }
    return items;
  } catch {
    return studentId ? inMemoryStore.filter((i) => i.studentId === studentId) : [...inMemoryStore];
  }
};

/** บันทึกข้อที่ตอบผิดลงคิวทบทวน */
export const recordMissedQuestion = (
  studentId: string,
  question: {
    id: string;
    text: string;
    options: string[];
    answerIndex: number;
    explanation: string;
    source: string;
    grade?: string;
  }
): void => {
  try {
    const all = loadAllMissedQuestions();
    const existingIdx = all.findIndex((i) => i.studentId === studentId && i.id === question.id);

    const now = Date.now();
    if (existingIdx >= 0) {
      const current = all[existingIdx];
      current.mistakeCount += 1;
      current.reviewStage = 0; // รีเซ็ตมา stage 0 เมื่อตอบผิดซ้ำ
      current.nextReviewDue = now;
      current.mastered = false;
      current.lastReviewedAt = now;
    } else {
      const newItem: MissedQuestionItem = {
        id: question.id,
        studentId,
        questionText: question.text,
        options: question.options,
        answerIndex: question.answerIndex,
        explanation: question.explanation,
        source: question.source,
        grade: question.grade,
        mistakeCount: 1,
        reviewStage: 0,
        lastReviewedAt: now,
        nextReviewDue: now,
        mastered: false,
      };
      all.unshift(newItem);
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(0, 300)));
    } else {
      inMemoryStore.length = 0;
      inMemoryStore.push(...all.slice(0, 300));
    }
  } catch (e) {
    console.warn('recordMissedQuestion warning:', e);
  }
};

/** ดึงข้อที่ถึงกำหนดทบทวน (Due) สำหรับนักเรียน */
export const getPendingReviewQuestions = (studentId: string): MissedQuestionItem[] => {
  const all = loadAllMissedQuestions(studentId);
  const now = Date.now();
  return all.filter((i) => !i.mastered && i.nextReviewDue <= now);
};

/** อัปเดตผลการทบทวนข้อที่ตอบ */
export const resolveReviewAttempt = (
  studentId: string,
  questionId: string,
  wasCorrect: boolean
): { mastered: boolean; nextStage: number } => {
  try {
    const all = loadAllMissedQuestions();
    const target = all.find((i) => i.studentId === studentId && i.id === questionId);
    if (!target) return { mastered: false, nextStage: 0 };

    const now = Date.now();
    target.lastReviewedAt = now;

    if (wasCorrect) {
      target.reviewStage += 1;
      if (target.reviewStage >= 3) {
        target.mastered = true;
        target.nextReviewDue = Infinity;
      } else {
        const interval = REVIEW_INTERVALS_MS[target.reviewStage] || REVIEW_INTERVALS_MS[1];
        target.nextReviewDue = now + interval;
      }
    } else {
      // ตอบผิดอีกรอบ ➔ อยู่ที่ stage 0 รอทบทวนใหม่
      target.mistakeCount += 1;
      target.reviewStage = 0;
      target.nextReviewDue = now;
      target.mastered = false;
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    }

    return { mastered: target.mastered, nextStage: target.reviewStage };
  } catch {
    return { mastered: false, nextStage: 0 };
  }
};

/** สถิติการทบทวนความจำของนักเรียน */
export const getSpacedReviewStats = (studentId: string) => {
  const items = loadAllMissedQuestions(studentId);
  const total = items.length;
  const masteredCount = items.filter((i) => i.mastered).length;
  const now = Date.now();
  const pendingCount = items.filter((i) => !i.mastered && i.nextReviewDue <= now).length;
  const learningCount = total - masteredCount;

  return {
    total,
    masteredCount,
    pendingCount,
    learningCount,
    retentionRate: total > 0 ? Math.round((masteredCount / total) * 100) : 100,
  };
};
