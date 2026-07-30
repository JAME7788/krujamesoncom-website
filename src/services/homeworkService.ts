// ระบบการบ้านกลาง: localStorage เป็น cache และ Firebase เป็นแหล่งข้อมูลจริงร่วมกันทุกเครื่อง
import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import {
  createManualAssessment,
  updateManualAssessmentScore,
  applyManualAssessmentsToGrades,
  loadGrades,
  deleteManualAssessment,
} from './gradeService';
import type { Subject, AssessmentCategory } from './gradeService';
import { recordLearningEvidence } from './learningEvidenceService';
import { writeAuditLog } from './auditLogService';

export interface Assignment {
  id: string;
  title: string;
  description: string;
  classroom: string;
  dueDate: string;
  maxScore: number;
  /** ลิงก์ใบงาน/คำสั่งงาน เช่น Canva, Google Docs หรือเว็บไซต์อื่น */
  resourceUrl?: string;
  knowledgeMaxScore?: number;
  practiceMaxScore?: number;
  attachmentUrl?: string;
  acceptedFormats?: string[];
  createdAt: number;
  createdBy: string;
  subject?: Subject;
  indicatorId?: string;
  category?: AssessmentCategory;
  linkedAssessmentId?: string;
  linkedKnowledgeAssessmentId?: string;
  linkedPracticeAssessmentId?: string;
  lessonPlanId?: string;
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
  kScore?: number;
  pScore?: number;
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
    const groupId = assignment.id;
    const kMax = Math.max(0, assignment.knowledgeMaxScore || 0);
    const pMax = Math.max(0, assignment.practiceMaxScore || 0);
    if (kMax > 0) {
      assignment.linkedKnowledgeAssessmentId = createManualAssessment(
        assignment.classroom,
        assignment.subject,
        {
          title: assignment.title,
          indicatorId: assignment.indicatorId,
          category: 'k',
          maxScore: kMax,
          groupId,
          resourceUrl: assignment.resourceUrl,
          lessonPlanId: assignment.lessonPlanId,
        },
      ).id;
    }
    if (pMax > 0) {
      assignment.linkedPracticeAssessmentId = createManualAssessment(
        assignment.classroom,
        assignment.subject,
        {
          title: assignment.title,
          indicatorId: assignment.indicatorId,
          category: 'p',
          maxScore: pMax,
          groupId,
          resourceUrl: assignment.resourceUrl,
          lessonPlanId: assignment.lessonPlanId,
        },
      ).id;
    }
    // รองรับรายการรูปแบบเดิมที่เลือกหมวดเดียว
    if (kMax === 0 && pMax === 0) {
      const assessment = createManualAssessment(assignment.classroom, assignment.subject, {
        title: assignment.title,
        indicatorId: assignment.indicatorId,
        category: assignment.category,
        maxScore: assignment.maxScore,
        groupId,
        resourceUrl: assignment.resourceUrl,
        lessonPlanId: assignment.lessonPlanId,
      });
      assignment.linkedAssessmentId = assessment.id;
    }
  }

  const list = [assignment, ...loadAssignments()];
  cache(ASS_KEY, list);
  try {
    await saveAssignmentRemote(assignment);
    await writeAuditLog({
      action: 'create',
      entityType: 'assignment',
      entityId: assignment.id,
      classroom: assignment.classroom,
      subject: assignment.subject,
      summary: `สร้างงาน ${assignment.title}`,
      after: assignment,
    });
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
  if (target?.classroom && target.subject) {
    [
      target.linkedAssessmentId,
      target.linkedKnowledgeAssessmentId,
      target.linkedPracticeAssessmentId,
    ].filter((assessmentId): assessmentId is string => Boolean(assessmentId))
      .forEach((assessmentId) => {
        deleteManualAssessment(target.classroom, target.subject!, assessmentId);
      });
    await writeAuditLog({
      action: 'delete',
      entityType: 'assignment',
      entityId: target.id,
      classroom: target.classroom,
      subject: target.subject,
      summary: `ลบงาน ${target.title}`,
      before: target,
    });
  }
};

export const updateAssignment = async (id: string, patch: Partial<Assignment>): Promise<Assignment | null> => {
  const list = loadAssignments();
  const index = list.findIndex((assignment) => assignment.id === id);
  if (index === -1) return null;
  const before = { ...list[index] };
  const updated = { ...before, ...patch };
  await saveAssignmentRemote(updated);
  list[index] = updated;
  cache(ASS_KEY, list);
  await writeAuditLog({
    action: 'update',
    entityType: 'assignment',
    entityId: updated.id,
    classroom: updated.classroom,
    subject: updated.subject,
    summary: `แก้ไขงาน ${updated.title}`,
    before,
    after: updated,
  });
  return updated;
};

export const getAssignmentsForStudent = (classroom: string): Assignment[] => (
  loadAssignments().filter((assignment) => !assignment.classroom || assignment.classroom === classroom)
);

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

export const reviewSubmission = async (
  id: string,
  scores: { kScore?: number; pScore?: number },
  feedback: string,
): Promise<void> => {
  const list = loadSubmissions();
  const index = list.findIndex((submission) => submission.id === id);
  if (index === -1) throw new Error('ไม่พบงานที่ส่ง');
  const assignment = loadAssignments().find((item) => item.id === list[index].assignmentId);
  if (!assignment) throw new Error('ไม่พบใบงานที่เชื่อมกับงานส่ง');
  const kScore = assignment.knowledgeMaxScore
    ? Math.max(0, Math.min(assignment.knowledgeMaxScore, scores.kScore || 0))
    : undefined;
  const pScore = assignment.practiceMaxScore
    ? Math.max(0, Math.min(assignment.practiceMaxScore, scores.pScore || 0))
    : undefined;
  const legacyScore = !assignment.knowledgeMaxScore && !assignment.practiceMaxScore
    ? Math.max(
      0,
      Math.min(
        assignment.maxScore,
        assignment.category === 'p' ? scores.pScore || 0 : scores.kScore || 0,
      ),
    )
    : 0;
  const score = (kScore || 0) + (pScore || 0) + legacyScore;
  const submission = {
    ...list[index],
    score,
    kScore,
    pScore,
    feedback,
    reviewedAt: Date.now(),
  };
  await saveSubmissionRemote(submission);
  list[index] = submission;
  cache(SUB_KEY, list);

  if (!assignment.classroom || !assignment.subject) return;

  const grades = loadGrades(assignment.classroom, assignment.subject);
  const student = grades.find((grade) => (
    grade.name === submission.studentName || grade.studentNo === submission.studentNo
  ));
  if (!student) return;
  if (assignment.linkedKnowledgeAssessmentId && kScore !== undefined) {
    updateManualAssessmentScore(
      assignment.classroom,
      assignment.subject,
      assignment.linkedKnowledgeAssessmentId,
      student.studentCode,
      kScore,
    );
  }
  if (assignment.linkedPracticeAssessmentId && pScore !== undefined) {
    updateManualAssessmentScore(
      assignment.classroom,
      assignment.subject,
      assignment.linkedPracticeAssessmentId,
      student.studentCode,
      pScore,
    );
  }
  if (assignment.linkedAssessmentId) {
    updateManualAssessmentScore(
      assignment.classroom,
      assignment.subject,
      assignment.linkedAssessmentId,
      student.studentCode,
      score,
    );
  }
  applyManualAssessmentsToGrades(assignment.classroom, assignment.subject);

  const evidenceBase = {
    studentId: submission.studentId,
    studentCode: student.studentCode,
    studentName: submission.studentName,
    classroom: assignment.classroom,
    subject: assignment.subject,
    indicatorId: assignment.indicatorId,
    lessonPlanId: assignment.lessonPlanId,
    source: 'homework' as const,
    title: assignment.title,
    detail: feedback,
    inClass: false,
    occurredAt: submission.reviewedAt || Date.now(),
  };
  const evidenceTasks: Promise<unknown>[] = [];
  if (kScore !== undefined) {
    evidenceTasks.push(recordLearningEvidence({
      ...evidenceBase,
      domain: 'K',
      score: kScore,
      maxScore: assignment.knowledgeMaxScore,
      dedupKey: `${assignment.id}-k`,
    }));
  }
  if (pScore !== undefined) {
    evidenceTasks.push(recordLearningEvidence({
      ...evidenceBase,
      domain: 'P',
      score: pScore,
      maxScore: assignment.practiceMaxScore,
      dedupKey: `${assignment.id}-p`,
    }));
  }
  await Promise.all(evidenceTasks);
  await writeAuditLog({
    action: 'score',
    entityType: 'submission',
    entityId: submission.id,
    classroom: assignment.classroom,
    subject: assignment.subject,
    summary: `ตรวจงาน ${assignment.title} ของ ${submission.studentName}`,
    after: submission,
  });
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
