// ชุดข้อสอบกระดาษ (มีเฉลย) + บันทึกผลที่ตรวจ → ผลสอบ (examAttempts) และช่องกลางภาค/ปลายภาคในสมุดคะแนน
// เฉลยเก็บฝั่งครูเท่านั้น (Firestore paperExams อ่านได้เฉพาะครู) กระดาษคำตอบมีแค่รหัสชุด ไม่มีเฉลย
import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { loadRoster } from './rosterService';
import {
  examMaxScores,
  getIndicators,
  initClassroom,
  loadGrades,
  updateFinalExam,
  updateMidtermExam,
  updateTeacherKnowledgeScore,
  type Subject,
} from './gradeService';
import { loadGradebookWorkflow } from './gradebookWorkflowService';
import { saveExamAttempt, type ExamAttempt } from './examService';
import { CHOICE_LABELS, MAX_EXAM_CODE, MAX_QUESTIONS } from '../utils/answerSheet';

export type GradebookTarget = 'none' | 'indicator' | 'midterm' | 'final';

export const MAX_POINTS_PER_QUESTION = 5;

export interface PaperExam {
  id: string;
  /** รหัสที่พิมพ์เป็นแถววงกลมบนกระดาษคำตอบ (1–4095) */
  code: number;
  title: string;
  classroom: string;
  subject: Subject;
  questionCount: number;
  choiceCount: 4 | 5;
  /**
   * เฉลยรายข้อเป็นบิตมาสก์ของตัวเลือกที่ยอมรับ (บิต 0 = ก, บิต 1 = ข, ...)
   * 0 = ข้อนี้ไม่คิดคะแนน, ตั้งได้หลายบิต = ยอมรับหลายคำตอบ
   */
  keyMasks: number[];
  /** คะแนนรายข้อ 1–5 */
  points: number[];
  gradebookTarget: GradebookTarget;
  /** รหัสตัวชี้วัดเป้าหมายเมื่อ gradebookTarget === 'indicator' */
  indicatorId?: string;
  createdAt: number;
  updatedAt: number;
}

const KEY = 'krujames_paper_exams_v1';
const COLLECTION = 'paperExams';

const firebaseAvailable = () => Boolean(db && import.meta.env.VITE_FIREBASE_PROJECT_ID);

/** เน็ตหลุด: คำสั่งเขียน Firestore รอเซิร์ฟเวอร์ไม่สิ้นสุด จึงรอไม่เกิน 8 วินาที (คิวยังส่งเองเมื่อกลับมาออนไลน์) */
const settleWithin = async (write: Promise<unknown>, ms = 8000): Promise<boolean> => {
  try {
    return await Promise.race([write.then(() => true), new Promise<boolean>((resolve) => setTimeout(() => resolve(false), ms))]);
  } catch (error) {
    console.warn('paper exam remote write failed', error);
    return false;
  }
};

/* ---------- เฉลยแบบบิตมาสก์ ---------- */

export const maskOf = (index: number) => (Number.isInteger(index) && index >= 0 ? 1 << index : 0);

export const isAcceptedAnswer = (mask: number, answer: number | null | undefined) =>
  answer !== null && answer !== undefined && answer >= 0 && ((mask >> answer) & 1) === 1;

export const maskLabels = (mask: number) =>
  CHOICE_LABELS.filter((_, i) => (mask >> i) & 1).join('/') || '-';

type LegacyExam = Partial<PaperExam> & { answerKey?: number[] };

const normalize = (raw: LegacyExam): PaperExam | null => {
  if (!raw || typeof raw.id !== 'string' || !Number.isInteger(raw.code)) return null;
  const questionCount = Math.max(1, Math.min(MAX_QUESTIONS, Number(raw.questionCount) || 0));
  const choiceCount = raw.choiceCount === 5 ? 5 : 4;
  const allChoices = (1 << choiceCount) - 1;
  // ชุดเก่าเก็บเฉลยเป็นเลขตัวเลือกเดียว (answerKey) แปลงเป็นบิตมาสก์
  const masks = Array.isArray(raw.keyMasks)
    ? raw.keyMasks
    : (Array.isArray(raw.answerKey) ? raw.answerKey.map((i) => maskOf(Number(i))) : []);
  const points = Array.isArray(raw.points) ? raw.points : [];
  const gradebookTarget: GradebookTarget =
    raw.gradebookTarget === 'indicator' || raw.gradebookTarget === 'midterm' || raw.gradebookTarget === 'final'
      ? raw.gradebookTarget
      : 'none';
  const indicatorId = typeof raw.indicatorId === 'string' && raw.indicatorId.trim() ? raw.indicatorId.trim() : undefined;
  const result: PaperExam = {
    id: raw.id,
    code: raw.code as number,
    title: String(raw.title || 'ข้อสอบ'),
    classroom: String(raw.classroom || ''),
    subject: (raw.subject || 'main') as Subject,
    questionCount,
    choiceCount,
    keyMasks: Array.from({ length: questionCount }, (_, i) => (Number(masks[i]) || 0) & allChoices),
    points: Array.from({ length: questionCount }, (_, i) => {
      const value = Math.round(Number(points[i]));
      return value >= 1 && value <= MAX_POINTS_PER_QUESTION ? value : 1;
    }),
    gradebookTarget,
    ...(indicatorId ? { indicatorId } : {}),
    createdAt: Number(raw.createdAt) || Date.now(),
    updatedAt: Number(raw.updatedAt) || Date.now(),
  };
  return result;
};

export const loadPaperExams = (): PaperExam[] => {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    return (Array.isArray(raw) ? raw : []).map(normalize).filter((e): e is PaperExam => e !== null);
  } catch {
    return [];
  }
};

const cache = (exams: PaperExam[]) => {
  try { localStorage.setItem(KEY, JSON.stringify(exams)); } catch { /* ignore */ }
};

export const fetchPaperExams = async (): Promise<PaperExam[]> => {
  const local = loadPaperExams();
  if (!firebaseAvailable()) return local;
  try {
    const snap = await getDocs(collection(db, COLLECTION));
    const merged = new Map(local.map((exam) => [exam.id, exam]));
    snap.docs.forEach((d) => {
      const exam = normalize(d.data() as LegacyExam);
      if (exam && (!merged.has(exam.id) || merged.get(exam.id)!.updatedAt <= exam.updatedAt)) merged.set(exam.id, exam);
    });
    const list = [...merged.values()].sort((a, b) => b.updatedAt - a.updatedAt);
    cache(list);
    return list;
  } catch (error) {
    console.warn('fetch paper exams failed, using local cache', error);
    return local;
  }
};

export const savePaperExam = async (exam: PaperExam): Promise<PaperExam> => {
  const clean = normalize({ ...exam, updatedAt: Date.now() });
  if (!clean) throw new Error('ข้อมูลชุดข้อสอบไม่ครบ');
  const list = loadPaperExams().filter((item) => item.id !== clean.id);
  cache([clean, ...list]);
  if (firebaseAvailable()) await settleWithin(setDoc(doc(db, COLLECTION, clean.id), clean));
  return clean;
};

export const deletePaperExam = async (id: string): Promise<void> => {
  cache(loadPaperExams().filter((item) => item.id !== id));
  if (firebaseAvailable()) await settleWithin(deleteDoc(doc(db, COLLECTION, id)));
};

/** รหัสชุดที่ยังไม่ซ้ำกับชุดเดิม */
export const nextExamCode = (existing: PaperExam[], random: () => number = Math.random): number => {
  const used = new Set(existing.map((exam) => exam.code));
  for (let tries = 0; tries < 10_000; tries += 1) {
    const code = 100 + Math.floor(random() * (MAX_EXAM_CODE - 100));
    if (!used.has(code)) return code;
  }
  throw new Error('รหัสชุดข้อสอบเต็มแล้ว');
};

export const newPaperExam = (existing: PaperExam[], classroom: string, subject: Subject): PaperExam => {
  const code = nextExamCode(existing);
  return {
    id: `pe_${code}_${Date.now().toString(36)}`,
    code,
    title: 'แบบทดสอบ',
    classroom,
    subject,
    questionCount: 20,
    choiceCount: 4,
    keyMasks: Array.from({ length: 20 }, () => 0),
    points: Array.from({ length: 20 }, () => 1),
    gradebookTarget: 'none',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
};

/** ข้อสอบชุดสลับข้อ (ชุด 2, 3, ...) รหัสใหม่ เฉลยเริ่มจากชุดเดิมให้ครูแก้ตามลำดับข้อที่สลับ */
export const duplicatePaperExam = (exam: PaperExam, existing: PaperExam[]): PaperExam => {
  const code = nextExamCode(existing);
  const version = existing.filter((e) => e.title.replace(/ \(ชุด \d+\)$/, '') === exam.title.replace(/ \(ชุด \d+\)$/, '')).length + 1;
  return {
    ...exam,
    id: `pe_${code}_${Date.now().toString(36)}`,
    code,
    title: `${exam.title.replace(/ \(ชุด \d+\)$/, '')} (ชุด ${version})`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
};

/** แปลงเฉลยแบบพิมพ์ เช่น "กขคง..." หรือ "1234..." หรือ "abcd..." (เว้นวรรค/จุลภาคได้ ใช้ - หรือ 0 สำหรับข้อที่ไม่คิดคะแนน) */
export const parseAnswerKeyText = (text: string, choiceCount: number): number[] => {
  const map: Record<string, number> = { ก: 0, ข: 1, ค: 2, ง: 3, จ: 4, a: 0, b: 1, c: 2, d: 3, e: 4, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 };
  const out: number[] = [];
  for (const ch of text.toLowerCase()) {
    if (ch === '-' || ch === '0' || ch === '?') { out.push(-1); continue; }
    if (ch in map) out.push(map[ch] < choiceCount ? map[ch] : -1);
  }
  return out;
};

export interface PaperScore {
  score: number;
  total: number;
  correct: boolean[];
}

export const scorePaperAnswers = (exam: PaperExam, answers: (number | null)[]): PaperScore => {
  const correct = exam.keyMasks.map((mask, i) => mask > 0 && isAcceptedAnswer(mask, answers[i]));
  const total = exam.keyMasks.reduce((sum, mask, i) => sum + (mask > 0 ? exam.points[i] : 0), 0);
  const score = correct.reduce((sum, ok, i) => sum + (ok ? exam.points[i] : 0), 0);
  return { score, total, correct };
};

export const findRosterStudentByNo = (classroom: string, no: number | null) =>
  no === null ? undefined : loadRoster(classroom).find((student) => student.no === no);

export const paperAttemptId = (exam: PaperExam, studentNo: number) => `paper_${exam.id}_no${studentNo}`;

/** คำตอบที่เก็บใน attempt.answers ({ q1: 0, q2: -1, ... }) → อาร์เรย์ */
export const attemptAnswers = (attempt: ExamAttempt, questionCount: number): (number | null)[] =>
  Array.from({ length: questionCount }, (_, i) => {
    const value = attempt.answers?.[`q${i + 1}`];
    return typeof value === 'number' && value >= 0 ? value : null;
  });

export const attemptStudentNo = (attempt: ExamAttempt) => attempt.studentNo ?? Number(attempt.studentId.split('_')[1]);

export interface SavePaperResult {
  attempt: ExamAttempt;
  /** ขึ้นฐานข้อมูลกลางแล้ว (false = อยู่แค่ในเครื่องนี้ ต้องลองบันทึกใหม่) */
  remote: boolean;
  gradebook: 'saved' | 'skipped' | 'closed' | 'no-student';
  gradebookScore?: number;
  gradebookMax?: number;
}

/** ลงคะแนนของนักเรียน 1 คนเข้าสมุดคะแนน ปพ.5 ตามเป้าหมายที่ตั้งไว้ (ตัวชี้วัด K / กลางภาค / ปลายภาค) */
const applyScoreToGradebook = (
  exam: PaperExam,
  student: { studentCode: string } | undefined,
  score: number,
  total: number,
): Pick<SavePaperResult, 'gradebook' | 'gradebookScore' | 'gradebookMax'> => {
  if (exam.gradebookTarget === 'none') return { gradebook: 'skipped' };
  if (!student) return { gradebook: 'no-student' };
  if (loadGradebookWorkflow(exam.classroom, exam.subject).state === 'finalized') return { gradebook: 'closed' };

  if (exam.gradebookTarget === 'indicator') {
    const indicators = getIndicators(exam.classroom, exam.subject);
    const ind = indicators.find((i) => i.id === exam.indicatorId) ?? indicators[0];
    if (!ind) return { gradebook: 'skipped' };
    if (loadGrades(exam.classroom, exam.subject).length === 0) initClassroom(exam.classroom, exam.subject);
    const max = ind.maxScore || 15;
    const scaled = total ? Math.round((score / total) * max * 100) / 100 : 0;
    updateTeacherKnowledgeScore(exam.classroom, student.studentCode, ind.id, scaled, exam.subject);
    return { gradebook: 'saved', gradebookScore: scaled, gradebookMax: max };
  }

  const max = examMaxScores(exam.classroom)[exam.gradebookTarget];
  if (!max) return { gradebook: 'skipped' };
  if (loadGrades(exam.classroom, exam.subject).length === 0) initClassroom(exam.classroom, exam.subject);
  const scaled = total ? Math.round((score / total) * max * 100) / 100 : 0;
  if (exam.gradebookTarget === 'midterm') updateMidtermExam(exam.classroom, student.studentCode, scaled, exam.subject);
  else updateFinalExam(exam.classroom, student.studentCode, scaled, exam.subject);
  return { gradebook: 'saved', gradebookScore: scaled, gradebookMax: max };
};

/** บันทึกผลหนึ่งคน: ผลสอบ (เขียนทับเมื่อตรวจซ้ำ) และลงสมุดคะแนน ปพ.5 (K / กลางภาค / ปลายภาค) ถ้าตั้งไว้ */
export const savePaperResult = async (
  exam: PaperExam,
  studentNo: number,
  answers: (number | null)[],
): Promise<SavePaperResult> => {
  const student = findRosterStudentByNo(exam.classroom, studentNo);
  const { score, total } = scorePaperAnswers(exam, answers);
  const percentage = total ? Math.round((score / total) * 100) : 0;
  const attempt: ExamAttempt = {
    id: paperAttemptId(exam, studentNo),
    studentId: student ? `${exam.classroom}_${student.no}_${student.name.replace(/\s/g, '')}` : `${exam.classroom}_${studentNo}_ไม่พบชื่อ`,
    studentName: student?.name ?? `เลขที่ ${studentNo}`,
    classroom: exam.classroom,
    examSetId: exam.id,
    examTitle: exam.title,
    score,
    totalQuestions: Math.max(1, total),
    percentage,
    passed: percentage >= 50,
    answers: Object.fromEntries(answers.map((value, i) => [`q${i + 1}`, value ?? -1])),
    timeSpentSeconds: 0,
    timestamp: Date.now(),
    source: 'paper',
    studentNo,
    studentCode: student?.studentCode,
  };
  const { remote } = await saveExamAttempt(attempt);
  const gb = applyScoreToGradebook(exam, student, score, total);
  return { attempt, remote, ...gb };
};

export interface BulkSyncGradebookResult {
  updated: number;
  skippedNoStudent: number;
  closed: boolean;
  gradebookMax: number;
}

/** ส่งคะแนนที่ตรวจแล้วทั้งห้องเข้าสมุดคะแนน ปพ.5 ในคลิกเดียว (ไม่ลบข้อมูลเดิมของนักเรียนคนอื่น) */
export const syncAllPaperResultsToGradebook = (
  exam: PaperExam,
  attempts: ExamAttempt[],
  overrideTarget?: { target: Exclude<GradebookTarget, 'none'>; indicatorId?: string },
): BulkSyncGradebookResult => {
  const effectiveExam: PaperExam = overrideTarget
    ? { ...exam, gradebookTarget: overrideTarget.target, indicatorId: overrideTarget.indicatorId }
    : exam;
  if (effectiveExam.gradebookTarget === 'none') {
    return { updated: 0, skippedNoStudent: 0, closed: false, gradebookMax: 0 };
  }
  if (loadGradebookWorkflow(effectiveExam.classroom, effectiveExam.subject).state === 'finalized') {
    return { updated: 0, skippedNoStudent: 0, closed: true, gradebookMax: 0 };
  }

  const latestByNo = new Map<number, ExamAttempt>();
  attempts
    .filter((a) => a.examSetId === effectiveExam.id)
    .forEach((a) => {
      const no = attemptStudentNo(a);
      if (Number.isFinite(no) && (!latestByNo.has(no) || latestByNo.get(no)!.timestamp < a.timestamp)) {
        latestByNo.set(no, a);
      }
    });

  let updated = 0;
  let skippedNoStudent = 0;
  let gradebookMax = 0;
  for (const [no, attempt] of latestByNo) {
    const student = findRosterStudentByNo(effectiveExam.classroom, no);
    if (!student) {
      skippedNoStudent += 1;
      continue;
    }
    const answers = attemptAnswers(attempt, effectiveExam.questionCount);
    const { score, total } = scorePaperAnswers(effectiveExam, answers);
    const res = applyScoreToGradebook(effectiveExam, student, score, total);
    if (res.gradebook === 'saved') {
      updated += 1;
      gradebookMax = res.gradebookMax ?? gradebookMax;
    }
  }
  return { updated, skippedNoStudent, closed: false, gradebookMax };
};

/** เฉลยหรือคะแนนรายข้อเปลี่ยน: คิดคะแนนทุกคนที่ตรวจแล้วใหม่จากคำตอบที่เก็บไว้ (เขียนทับผลเดิมและสมุดคะแนน) */
export const rescorePaperResults = async (exam: PaperExam, attempts: ExamAttempt[]): Promise<number> => {
  const latest = new Map<number, ExamAttempt>();
  attempts
    .filter((a) => a.examSetId === exam.id && a.source === 'paper')
    .forEach((a) => {
      const no = attemptStudentNo(a);
      if (Number.isFinite(no) && (!latest.has(no) || latest.get(no)!.timestamp < a.timestamp)) latest.set(no, a);
    });
  for (const [no, attempt] of latest) {
    await savePaperResult(exam, no, attemptAnswers(attempt, exam.questionCount));
  }
  return latest.size;
};

/* ---------- ส่งออกผล ---------- */

const csvCell = (value: string | number) => {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** CSV สำหรับเปิดใน Excel (มี BOM ให้ภาษาไทยไม่เพี้ยน) */
export const buildScoresCsv = (exam: PaperExam, attempts: ExamAttempt[]): string => {
  const byNo = new Map(attempts.filter((a) => a.examSetId === exam.id).map((a) => [attemptStudentNo(a), a]));
  const header = ['เลขที่', 'ชื่อ-สกุล', 'คะแนน', 'คะแนนเต็ม', 'ร้อยละ', ...Array.from({ length: exam.questionCount }, (_, i) => `ข้อ ${i + 1}`)];
  const keyRow = ['', 'เฉลย', '', '', '', ...exam.keyMasks.map(maskLabels)];
  const rows = loadRoster(exam.classroom).map((student) => {
    const attempt = byNo.get(student.no);
    if (!attempt) return [student.no, student.name, 'ยังไม่ตรวจ', '', '', ...Array.from({ length: exam.questionCount }, () => '')];
    const answers = attemptAnswers(attempt, exam.questionCount);
    return [
      student.no, student.name, attempt.score, attempt.totalQuestions, attempt.percentage,
      ...answers.map((a, i) => (a === null ? '-' : `${CHOICE_LABELS[a]}${exam.keyMasks[i] && !isAcceptedAnswer(exam.keyMasks[i], a) ? ' (ผิด)' : ''}`)),
    ];
  });
  return `\uFEFF${[header, keyRow, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')}`;
};
