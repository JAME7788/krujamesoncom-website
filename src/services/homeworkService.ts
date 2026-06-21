// ระบบส่งการบ้าน — ครูสร้างงาน, นักเรียน upload, ครูตรวจให้คะแนน

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
  try { localStorage.setItem(ASS_KEY, JSON.stringify(list)); } catch {}
};

export const createAssignment = (data: Omit<Assignment, 'id' | 'createdAt'>): Assignment => {
  const a: Assignment = { ...data, id: uid(), createdAt: Date.now() };
  const list = loadAssignments();
  list.unshift(a);
  saveAssignments(list);
  return a;
};

export const deleteAssignment = (id: string) => {
  saveAssignments(loadAssignments().filter((a) => a.id !== id));
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
  try { localStorage.setItem(SUB_KEY, JSON.stringify(list)); } catch {}
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
  list[idx] = { ...list[idx], score, feedback, reviewedAt: Date.now() };
  saveSubmissions(list);
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
