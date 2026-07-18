// ระบบส่งการบ้าน — ครูสร้างงาน, นักเรียน upload, ครูตรวจให้คะแนน
import {
  createManualAssessment, updateManualAssessmentScore,
  applyManualAssessmentsToGrades, loadGrades, deleteManualAssessment,
} from './gradeService';
import type { Subject, AssessmentCategory } from './gradeService';

export interface Assignment {
  id: string;
  title: string;
  description: string;
  classroom: string;
  dueDate: string; // YYYY-MM-DD
  maxScore: number;
  attachmentUrl?: string;
  acceptedFormats?: string[]; // ['image/*', '.pdf']
  createdAt: number;
  createdBy: string;
  /** ผูกคะแนนเข้ากระดาษเกรด (ใช้ Manual Assessment ของ gradeService) */
  subject?: Subject;
  indicatorId?: string;
  category?: AssessmentCategory;     // 'k' (ความรู้) หรือ 'p' (ทักษะ)
  linkedAssessmentId?: string;       // id ของ ManualAssessment ที่สร้างเชื่อมไว้
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  classroom: string;
  studentNo: number;
  // ส่งเป็น URL หรือ base64 (รูปขนาดเล็ก)
  contentUrl?: string;
  contentData?: string; // base64 for small files
  comment?: string;
  submittedAt: number;
  // ครูตรวจ
  score?: number;
  feedback?: string;
  reviewedAt?: number;
}

const ASS_KEY = 'krujames_assignments_v1';
const SUB_KEY = 'krujames_submissions_v1';
const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// ---------- Assignments ----------
export const loadAssignments = (): Assignment[] => {
  try {
    const raw = localStorage.getItem(ASS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const saveAssignments = (list: Assignment[]) => {
  try { localStorage.setItem(ASS_KEY, JSON.stringify(list)); } catch { /* ignore localStorage write errors */ }
};

export const createAssignment = (data: Omit<Assignment, 'id' | 'createdAt'>): Assignment => {
  const a: Assignment = { ...data, id: uid(), createdAt: Date.now() };

  // ถ้าผูกตัวชี้วัด → สร้าง Manual Assessment ขึ้นใน gradeService ของห้องนั้น
  if (a.classroom && a.subject && a.indicatorId && a.category) {
    try {
      const ma = createManualAssessment(a.classroom, a.subject, {
        title: a.title,
        indicatorId: a.indicatorId,
        category: a.category,
        maxScore: a.maxScore,
      });
      a.linkedAssessmentId = ma.id;
    } catch (e) {
      console.warn('createAssignment: link to manual assessment failed', e);
    }
  }

  const list = loadAssignments();
  list.unshift(a);
  saveAssignments(list);
  return a;
};

export const deleteAssignment = (id: string) => {
  const list = loadAssignments();
  const target = list.find((a) => a.id === id);
  if (target?.linkedAssessmentId && target.classroom && target.subject) {
    try {
      deleteManualAssessment(target.classroom, target.subject, target.linkedAssessmentId);
    } catch (e) {
      console.warn('deleteAssignment: cleanup manual assessment failed', e);
    }
  }
  saveAssignments(list.filter((a) => a.id !== id));
};

export const updateAssignment = (id: string, patch: Partial<Assignment>) => {
  const list = loadAssignments();
  const idx = list.findIndex((a) => a.id === id);
  if (idx === -1) return;
  list[idx] = { ...list[idx], ...patch };
  saveAssignments(list);
};

export const getAssignmentsForStudent = (classroom: string): Assignment[] => {
  return loadAssignments().filter((a) => !a.classroom || a.classroom === classroom);
};

// ---------- Submissions ----------
export const loadSubmissions = (): Submission[] => {
  try {
    const raw = localStorage.getItem(SUB_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const saveSubmissions = (list: Submission[]) => {
  try { localStorage.setItem(SUB_KEY, JSON.stringify(list)); } catch { /* ignore localStorage write errors */ }
};

export const submitWork = (data: Omit<Submission, 'id' | 'submittedAt'>): Submission => {
  // ถ้าส่งซ้ำ — แทนที่ของเก่า
  const list = loadSubmissions().filter(
    (s) => !(s.assignmentId === data.assignmentId && s.studentId === data.studentId)
  );
  const s: Submission = { ...data, id: uid(), submittedAt: Date.now() };
  list.unshift(s);
  saveSubmissions(list);
  return s;
};

export const reviewSubmission = (id: string, score: number, feedback: string) => {
  const list = loadSubmissions();
  const idx = list.findIndex((s) => s.id === id);
  if (idx === -1) return;
  const sub = { ...list[idx], score, feedback, reviewedAt: Date.now() };
  list[idx] = sub;
  saveSubmissions(list);

  // ถ้าการบ้านนี้ผูก Manual Assessment → push คะแนนเข้ากระดาษเกรด
  const assignment = loadAssignments().find((a) => a.id === sub.assignmentId);
  if (
    assignment?.linkedAssessmentId &&
    assignment.classroom &&
    assignment.subject
  ) {
    try {
      const grades = loadGrades(assignment.classroom, assignment.subject);
      const student = grades.find(
        (g) => g.name === sub.studentName || g.studentNo === sub.studentNo
      );
      if (student) {
        updateManualAssessmentScore(
          assignment.classroom,
          assignment.subject,
          assignment.linkedAssessmentId,
          student.studentCode,
          score,
        );
        applyManualAssessmentsToGrades(assignment.classroom, assignment.subject);
      }
    } catch (e) {
      console.warn('reviewSubmission: push to gradebook failed', e);
    }
  }
};

export const getSubmissionsByAssignment = (assignmentId: string): Submission[] => {
  return loadSubmissions().filter((s) => s.assignmentId === assignmentId);
};

export const getSubmissionsByStudent = (studentId: string): Submission[] => {
  return loadSubmissions().filter((s) => s.studentId === studentId);
};

export const getStudentSubmissionForAssignment = (assignmentId: string, studentId: string): Submission | null => {
  return loadSubmissions().find((s) => s.assignmentId === assignmentId && s.studentId === studentId) || null;
};
