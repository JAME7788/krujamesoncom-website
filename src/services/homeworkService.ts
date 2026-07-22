// ระบบการบ้านกลาง: localStorage เป็น cache และ Firebase เป็นแหล่งข้อมูลจริงร่วมกันทุกเครื่อง
import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from './firebase';
import {
  createManualAssessment,
  updateManualAssessmentScore,
  applyManualAssessmentsToGrades,
  loadGrades,
  deleteManualAssessment,
} from './gradeService';
import type { Subject, AssessmentCategory } from './gradeService';

export interface Assignment {
  id: string;
  title: string;
  description: string;
  classroom: string;
  dueDate: string;
  maxScore: number;
  attachmentUrl?: string;
  acceptedFormats?: string[];
  createdAt: number;
  createdBy: string;
  subject?: Subject;
  indicatorId?: string;
  category?: AssessmentCategory;
  linkedAssessmentId?: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  classroom: string;
  studentNo: number;
  contentUrl?: string;
  /** รองรับข้อมูลเก่าที่เคยเก็บในเครื่อง แต่ข้อมูลใหม่อัปโหลดไฟล์ไป Storage */
  contentData?: string;
  comment?: string;
  submittedAt: number;
  score?: number;
  feedback?: string;
  reviewedAt?: number;
}

const ASS_KEY = 'krujames_assignments_v1';
const SUB_KEY = 'krujames_submissions_v1';
const ASS_COLLECTION = 'homeworkAssignments';
const SUB_COLLECTION = 'homeworkSubmissions';
const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const firebaseAvailable = () => {
  try { return !!db && !!import.meta.env.VITE_FIREBASE_PROJECT_ID; } catch { return false; }
};

const cache = <T>(key: string, value: T) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (error) {
    console.warn(`cache ${key} failed`, error);
  }
};

const loadCache = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
};

const cleanForFirestore = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export const loadAssignments = (): Assignment[] => loadCache(ASS_KEY, []);
export const loadSubmissions = (): Submission[] => loadCache(SUB_KEY, []);

const saveAssignmentRemote = async (assignment: Assignment) => {
  if (!firebaseAvailable()) throw new Error('Firebase ยังไม่ได้ตั้งค่า');
  await setDoc(doc(db, ASS_COLLECTION, assignment.id), cleanForFirestore(assignment));
};

const saveSubmissionRemote = async (submission: Submission) => {
  if (!firebaseAvailable()) throw new Error('Firebase ยังไม่ได้ตั้งค่า');
  const remote = { ...submission };
  delete remote.contentData;
  await setDoc(doc(db, SUB_COLLECTION, submission.id), cleanForFirestore(remote));
};

/** ดึงรายการงานกลาง และย้ายข้อมูลเก่าในเครื่องขึ้น Firebase เมื่อฐานข้อมูลยังว่าง */
export const fetchAssignmentsFromFirebase = async (): Promise<Assignment[]> => {
  if (!firebaseAvailable()) return loadAssignments();
  try {
    const snap = await getDocs(collection(db, ASS_COLLECTION));
    const remote = snap.docs.map((item) => item.data() as Assignment);
    if (remote.length > 0) {
      const sorted = remote.sort((a, b) => b.createdAt - a.createdAt);
      cache(ASS_KEY, sorted);
      return sorted;
    }
    const local = loadAssignments();
    await Promise.all(local.map(saveAssignmentRemote));
    return local;
  } catch (error) {
    console.warn('fetch assignments failed, using local cache', error);
    return loadAssignments();
  }
};

/** ดึงงานที่ส่งจากทุกเครื่อง และย้ายข้อมูลเก่าเมื่อฐานข้อมูลยังว่าง */
export const fetchSubmissionsFromFirebase = async (): Promise<Submission[]> => {
  if (!firebaseAvailable()) return loadSubmissions();
  try {
    const snap = await getDocs(collection(db, SUB_COLLECTION));
    const remote = snap.docs.map((item) => item.data() as Submission);
    if (remote.length > 0) {
      const sorted = remote.sort((a, b) => b.submittedAt - a.submittedAt);
      cache(SUB_KEY, sorted);
      return sorted;
    }
    const local = loadSubmissions();
    await Promise.all(local.filter((item) => !item.contentData).map(saveSubmissionRemote));
    return local;
  } catch (error) {
    console.warn('fetch submissions failed, using local cache', error);
    return loadSubmissions();
  }
};

export const createAssignment = async (
  data: Omit<Assignment, 'id' | 'createdAt'>,
): Promise<Assignment> => {
  const assignment: Assignment = { ...data, id: uid(), createdAt: Date.now() };

  if (assignment.classroom && assignment.subject && assignment.indicatorId && assignment.category) {
    const assessment = createManualAssessment(assignment.classroom, assignment.subject, {
      title: assignment.title,
      indicatorId: assignment.indicatorId,
      category: assignment.category,
      maxScore: assignment.maxScore,
    });
    assignment.linkedAssessmentId = assessment.id;
  }

  const list = [assignment, ...loadAssignments()];
  cache(ASS_KEY, list);
  try {
    await saveAssignmentRemote(assignment);
    return assignment;
  } catch (error) {
    cache(ASS_KEY, list.filter((item) => item.id !== assignment.id));
    throw error;
  }
};

export const deleteAssignment = async (id: string): Promise<void> => {
  const list = loadAssignments();
  const target = list.find((assignment) => assignment.id === id);
  if (firebaseAvailable()) await deleteDoc(doc(db, ASS_COLLECTION, id));
  cache(ASS_KEY, list.filter((assignment) => assignment.id !== id));
  if (target?.linkedAssessmentId && target.classroom && target.subject) {
    deleteManualAssessment(target.classroom, target.subject, target.linkedAssessmentId);
  }
};

export const updateAssignment = async (id: string, patch: Partial<Assignment>): Promise<Assignment | null> => {
  const list = loadAssignments();
  const index = list.findIndex((assignment) => assignment.id === id);
  if (index === -1) return null;
  const updated = { ...list[index], ...patch };
  await saveAssignmentRemote(updated);
  list[index] = updated;
  cache(ASS_KEY, list);
  return updated;
};

export const getAssignmentsForStudent = (classroom: string): Assignment[] => (
  loadAssignments().filter((assignment) => !assignment.classroom || assignment.classroom === classroom)
);

export const uploadHomeworkFile = async (
  file: File,
  studentId: string,
  assignmentId: string,
): Promise<string> => {
  if (!firebaseAvailable()) throw new Error('Firebase ยังไม่ได้ตั้งค่า');
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileRef = ref(storage, `homework/${studentId}/${assignmentId}/${Date.now()}_${safeName}`);
  const snapshot = await uploadBytes(fileRef, file, { contentType: file.type });
  return getDownloadURL(snapshot.ref);
};

export const submitWork = async (
  data: Omit<Submission, 'id' | 'submittedAt'>,
): Promise<Submission> => {
  const previous = loadSubmissions().find((submission) => (
    submission.assignmentId === data.assignmentId && submission.studentId === data.studentId
  ));
  const submission: Submission = {
    ...data,
    id: previous?.id || uid(),
    submittedAt: Date.now(),
    score: undefined,
    feedback: undefined,
    reviewedAt: undefined,
  };
  await saveSubmissionRemote(submission);
  const list = loadSubmissions().filter((item) => item.id !== submission.id);
  cache(SUB_KEY, [submission, ...list]);
  return submission;
};

export const reviewSubmission = async (id: string, score: number, feedback: string): Promise<void> => {
  const list = loadSubmissions();
  const index = list.findIndex((submission) => submission.id === id);
  if (index === -1) throw new Error('ไม่พบงานที่ส่ง');
  const submission = { ...list[index], score, feedback, reviewedAt: Date.now() };
  await saveSubmissionRemote(submission);
  list[index] = submission;
  cache(SUB_KEY, list);

  const assignment = loadAssignments().find((item) => item.id === submission.assignmentId);
  if (!assignment?.linkedAssessmentId || !assignment.classroom || !assignment.subject) return;

  const grades = loadGrades(assignment.classroom, assignment.subject);
  const student = grades.find((grade) => (
    grade.name === submission.studentName || grade.studentNo === submission.studentNo
  ));
  if (!student) return;
  updateManualAssessmentScore(
    assignment.classroom,
    assignment.subject,
    assignment.linkedAssessmentId,
    student.studentCode,
    score,
  );
  applyManualAssessmentsToGrades(assignment.classroom, assignment.subject);
};

export const getSubmissionsByAssignment = (assignmentId: string): Submission[] => (
  loadSubmissions().filter((submission) => submission.assignmentId === assignmentId)
);

export const getSubmissionsByStudent = (studentId: string): Submission[] => (
  loadSubmissions().filter((submission) => submission.studentId === studentId)
);

export const getStudentSubmissionForAssignment = (
  assignmentId: string,
  studentId: string,
): Submission | null => (
  loadSubmissions().find((submission) => (
    submission.assignmentId === assignmentId && submission.studentId === studentId
  )) || null
);
