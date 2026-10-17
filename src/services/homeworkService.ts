// ระบบการบ้านกลาง: localStorage เป็น cache และ Firebase เป็นแหล่งข้อมูลจริงร่วมกันทุกเครื่อง
import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import {
  createManualAssessment,
  updateManualAssessmentScore,
  applyManualAssessmentsToGrades,
  loadGrades,
  computeTotal,
  deleteManualAssessment,
  loadManualAssessments,
  loadManualAssessmentScores,
  getSubjectsForClassroom,
  getIndicators,
} from './gradeService';
import type { Subject, AssessmentCategory } from './gradeService';
import { loadRoster } from './rosterService';
import { recordLearningEvidence } from './learningEvidenceService';
import { writeAuditLog } from './auditLogService';

export type AssignmentDifficulty = 'foundation' | 'standard' | 'advanced';
export type AssignmentTargetType = 'all' | 'ability_tier' | 'specific_students';
export type AbilityTier = 'intervention' | 'developing' | 'proficient' | 'advanced';
export type SubmissionMethod =
  | 'screenshot_file'
  | 'canvas_drawing'
  | 'workstation'
  | 'written_answer'
  | 'external_link';

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

  // --- Personalized Assignment Extensions ---
  /** ระดับความยาก: foundation (พื้นฐาน/มีคำใบ้), standard (มาตรฐาน), advanced (ท้าทาย/ต่อยอด) */
  difficulty?: AssignmentDifficulty;
  /** กลุ่มเป้าหมาย: all (ทุกคน), ability_tier (ตามระดับศักยภาพ), specific_students (เจาะจงรายคน) */
  targetType?: AssignmentTargetType;
  /** ระดับความสามารถเป้าหมายเมื่อ targetType === 'ability_tier' */
  targetTier?: AbilityTier;
  /** รายชื่อ studentId หรือ studentCode ที่ได้รับมอบหมายเมื่อ targetType === 'specific_students' */
  targetStudentIds?: string[];
  /** คำใบ้และแนวทางช่วยเหลือทีละขั้นตอน (Scaffolding Hints) */
  hints?: string[];
  /** เหตุผลที่ระบบหรือครูแนะนำภารกิจนี้ */
  recommendedReason?: string;
  /** คะแนนพิเศษ Bonus XP สำหรับภารกิจท้าทาย */
  bonusPoints?: number;
  /** Alternatives share one assessment and count as one task. */
  personalizedPackId?: string;
  /** ระบุว่าเป็นงานโครงงานกระบวนการคิดเชิงออกแบบ (Design Thinking: ว 4.1) หรือไม่ */
  isDesignThinking?: boolean;
}

export interface DesignThinkingSteps {
  /** 1. ขั้น Define & Empathize: ปัญหาที่ต้องการแก้ และกลุ่มเป้าหมาย */
  define?: string;
  /** 2. ขั้น Ideate: แนวคิดสร้างสรรค์และทางเลือกในการแก้ปัญหา */
  ideate?: string;
  /** 3. ขั้น Prototype: ลิงก์ชิ้นงานต้นแบบ (Canva, Scratch, Code, หรือไฟล์) */
  prototypeUrl?: string;
  /** 4. ขั้น Test: ผลการทดสอบจากเพื่อน/ครู และจุดที่ควรนำไปปรับปรุง */
  testFeedback?: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  classroom: string;
  studentNo: number;
  contentUrl?: string;
  /** ข้อมูลไฟล์หรือภาพแคปหน้าจอที่บีบอัดแล้ว (Data URL ≤ 700 KB) สำหรับส่งงานจากคอมโรงเรียนโดยไม่ต้องใช้ Gmail */
  contentData?: string;
  /** ชื่อไฟล์ที่แนบจากเครื่องคอมพิวเตอร์โรงเรียน เช่น งานแมวเดิน.sb3, ภาพหน้าจอ.webp */
  attachmentFileName?: string;
  /** ชนิดของไฟล์ (MIME type) */
  attachmentMimeType?: string;
  /** หมายเลขเครื่องคอมพิวเตอร์ในห้องปฏิบัติการ (เช่น เครื่องที่ 05) */
  workstationNo?: string;
  /** ช่องทางที่ใช้ส่งงาน */
  submissionMethod?: SubmissionMethod;
  comment?: string;
  submittedAt: number;
  score?: number;
  kScore?: number;
  pScore?: number;
  feedback?: string;
  reviewedAt?: number;
  /** ข้อมูลโครงงาน Design Thinking 4 ขั้น (ถ้ามี) */
  designThinkingSteps?: DesignThinkingSteps;
}

const ASS_KEY = 'krujames_assignments_v1';
const SUB_KEY = 'krujames_submissions_v1';
const GDRIVE_CONFIG_KEY = 'krujames_gdrive_bridge_v1';
const GDRIVE_CONFIG_DOC_ID = '__gdrive_bridge_config__';
const ASS_COLLECTION = 'homeworkAssignments';
const SUB_COLLECTION = 'homeworkSubmissions';
const MAX_FIRESTORE_CONTENT_DATA_LEN = 120_000; // จำกัดขนาดรูปย่อสำรองไม่เกิน ~90 KB เพื่อไม่ให้เปลืองความจำฐานข้อมูล
const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export interface GoogleDriveBridgeConfig {
  /** URL ของ Google Apps Script Web App ของครูสำหรับรับไฟล์นักเรียนเข้า Google Drive ครูโดยตรง (ไม่ต้องใช้ Gmail นักเรียน) */
  scriptWebAppUrl: string;
  /** ลิงก์โฟลเดอร์ Google Drive กลางของครู (สำหรับเปิดดูไฟล์ทั้งหมด หรือให้นักเรียนเปิดดู) */
  sharedFolderUrl: string;
  /** ลบข้อมูลไบนารีออกจากฐานข้อมูลเว็บทันทีเมื่อได้ลิงก์ Google Drive แล้ว (เก็บเฉพาะลิงก์ ประหยัดความจำ 100%) */
  storeLinkOnly: boolean;
  updatedAt?: number;
}

const DEFAULT_GDRIVE_CONFIG: GoogleDriveBridgeConfig = {
  scriptWebAppUrl: import.meta.env.VITE_GOOGLE_DRIVE_SCRIPT_URL || '',
  sharedFolderUrl: import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_URL || '',
  storeLinkOnly: true,
};

const firebaseAvailable = () => {
  try { return !!db && !!import.meta.env.VITE_FIREBASE_PROJECT_ID; } catch { return false; }
};

const cache = <T>(key: string, value: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // กรณี localStorage เต็ม ให้ตัด contentData ออกจากสำเนาในเครื่องโดยอัตโนมัติ (เก็บเฉพาะลิงก์)
    if (key === SUB_KEY && Array.isArray(value)) {
      try {
        const slim = (value as Submission[]).map((s) => ({ ...s, contentData: undefined }));
        localStorage.setItem(key, JSON.stringify(slim));
        return;
      } catch {
        // ignore
      }
    }
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

export const loadGoogleDriveBridgeConfig = (): GoogleDriveBridgeConfig => {
  const saved = loadCache<Partial<GoogleDriveBridgeConfig>>(GDRIVE_CONFIG_KEY, {});
  return {
    scriptWebAppUrl: saved.scriptWebAppUrl ?? DEFAULT_GDRIVE_CONFIG.scriptWebAppUrl,
    sharedFolderUrl: saved.sharedFolderUrl ?? DEFAULT_GDRIVE_CONFIG.sharedFolderUrl,
    storeLinkOnly: saved.storeLinkOnly ?? true,
    updatedAt: saved.updatedAt,
  };
};

export const saveGoogleDriveBridgeConfig = async (
  config: Partial<GoogleDriveBridgeConfig>,
): Promise<GoogleDriveBridgeConfig> => {
  const current = loadGoogleDriveBridgeConfig();
  const next: GoogleDriveBridgeConfig = {
    scriptWebAppUrl: normalizeHomeworkUrl(config.scriptWebAppUrl ?? current.scriptWebAppUrl),
    sharedFolderUrl: normalizeHomeworkUrl(config.sharedFolderUrl ?? current.sharedFolderUrl),
    storeLinkOnly: config.storeLinkOnly ?? current.storeLinkOnly,
    updatedAt: Date.now(),
  };
  cache(GDRIVE_CONFIG_KEY, next);

  if (firebaseAvailable()) {
    try {
      // บันทึกเป็นเอกสารตั้งค่าระบบใน homeworkAssignments เพื่อให้คอมพิวเตอร์นักเรียนทุกเครื่องดึงไปใช้ได้อัตโนมัติ
      await setDoc(doc(db, ASS_COLLECTION, GDRIVE_CONFIG_DOC_ID), {
        id: GDRIVE_CONFIG_DOC_ID,
        title: '__GDRIVE_BRIDGE_CONFIG__',
        description: JSON.stringify(next),
        classroom: 'all',
        dueDate: '2099-12-31',
        maxScore: 0,
        createdBy: 'teacher',
        targetType: 'all',
        createdAt: next.updatedAt,
      });
    } catch (err) {
      console.warn('saveGoogleDriveBridgeConfig remote sync failed:', err);
    }
  }
  return next;
};

export const loadAssignments = (): Assignment[] =>
  loadCache<Assignment[]>(ASS_KEY, []).filter((a) => a.id !== GDRIVE_CONFIG_DOC_ID);
export const loadSubmissions = (): Submission[] => loadCache(SUB_KEY, []);

const saveAssignmentRemote = async (assignment: Assignment) => {
  if (!firebaseAvailable()) return;
  await setDoc(doc(db, ASS_COLLECTION, assignment.id), cleanForFirestore(assignment));
};

const isExternalCloudUrl = (url?: string): boolean => {
  if (!url) return false;
  return /^https?:\/\//i.test(url) && !/^https?:\/\/krujames\.school\.local\//i.test(url);
};

const saveSubmissionRemote = async (submission: Submission) => {
  if (!firebaseAvailable()) return;
  const remote = { ...submission };
  // หากมีลิงก์ Google Drive หรือ Cloud URL จริงแล้ว ไม่ต้องเก็บไฟล์ไบนารีซ้ำใน Firestore (ประหยัดความจำ 100%)
  if (isExternalCloudUrl(remote.contentUrl)) {
    delete remote.contentData;
  } else if (remote.contentData && remote.contentData.length > MAX_FIRESTORE_CONTENT_DATA_LEN) {
    delete remote.contentData;
  }
  await setDoc(doc(db, SUB_COLLECTION, submission.id), cleanForFirestore(remote));
};

/** ดึงรายการงานกลาง และซิงก์ค่าตั้งค่า Google Drive Bridge จากครูไปยังเครื่องนักเรียนอัตโนมัติ */
export const fetchAssignmentsFromFirebase = async (): Promise<Assignment[]> => {
  if (!firebaseAvailable()) return loadAssignments();
  try {
    const snap = await getDocs(collection(db, ASS_COLLECTION));
    const allDocs = snap.docs.map((item) => item.data() as Assignment);
    const configDoc = allDocs.find((item) => item.id === GDRIVE_CONFIG_DOC_ID);
    if (configDoc?.description) {
      try {
        const parsed = JSON.parse(configDoc.description) as Partial<GoogleDriveBridgeConfig>;
        if (parsed && typeof parsed === 'object') {
          cache(GDRIVE_CONFIG_KEY, {
            ...loadGoogleDriveBridgeConfig(),
            ...parsed,
          });
        }
      } catch {
        // ignore invalid config JSON
      }
    }
    const remote = allDocs.filter((item) => item.id !== GDRIVE_CONFIG_DOC_ID);
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
    await Promise.all(local.map(saveSubmissionRemote));
    return local;
  } catch (error) {
    console.warn('fetch submissions failed, using local cache', error);
    return loadSubmissions();
  }
};

export const createAssignment = async (
  data: Omit<Assignment, 'id' | 'createdAt'>,
): Promise<Assignment> => {
  if (data.targetType === 'specific_students' && !data.targetStudentIds?.length) throw new Error('กรุณาเลือกนักเรียนอย่างน้อย 1 คน');
  const assignment: Assignment = { ...data, id: uid(), createdAt: Date.now() };

  if (!assignment.linkedKnowledgeAssessmentId && !assignment.linkedPracticeAssessmentId && assignment.classroom && assignment.subject && assignment.indicatorId && assignment.category) {
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
    ].filter((assessmentId): assessmentId is string => Boolean(assessmentId) && !list.some(a => a.id !== id && [a.linkedAssessmentId, a.linkedKnowledgeAssessmentId, a.linkedPracticeAssessmentId].includes(assessmentId)))
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

/**
 * คำนวณระดับความพร้อมของผู้เรียน (Ability Tier) จากผลการเรียนในห้องเรียน
 */
export const calculateStudentAbilityTier = (classroom: string, studentIdentifier?: string | number): AbilityTier => {
  if (!classroom || !studentIdentifier) return 'proficient';
  try {
    const grades = loadGrades(classroom);
    const identifierStr = String(studentIdentifier);
    const student = grades.find((g) =>
      g.studentCode === identifierStr ||
      g.studentNo === Number(studentIdentifier) ||
      (typeof studentIdentifier === 'string' && (studentIdentifier.includes(g.name.replace(/\s/g, '')) || identifierStr === `${classroom}_${g.studentNo}_${g.name.replace(/\s/g, '')}`))
    );
    if (student) {
      const pct = computeTotal(student, classroom);
      if (typeof pct === 'number' && !Number.isNaN(pct)) {
        if (pct >= 80) return 'advanced';
        if (pct >= 65) return 'proficient';
        if (pct >= 45) return 'developing';
        return 'intervention';
      }
    }
  } catch (e) {
    console.warn('calculateStudentAbilityTier failed', e);
  }
  return 'proficient';
};

/**
 * แนะนำระดับความยากที่เหมาะสมกับผู้เรียน
 */
export const getRecommendedDifficulty = (tier: AbilityTier): AssignmentDifficulty => {
  if (tier === 'advanced') return 'advanced';
  if (tier === 'intervention' || tier === 'developing') return 'foundation';
  return 'standard';
};

/**
 * ดึงรายการงานสำหรับนักเรียนคนหนึ่งๆ โดยคำนึงถึงการมอบหมายงานเฉพาะบุคคล
 */
export const getAssignmentsForStudent = (
  classroom: string,
  studentId?: string,
  studentNo?: number,
): Assignment[] => {
  const all = loadAssignments().filter(
    (assignment) => !assignment.classroom || assignment.classroom === classroom
  );
  if (!studentId && studentNo === undefined) {
    return all.filter(a => !a.targetType || a.targetType === 'all');
  }
  const studentCode = loadRoster(classroom).find(s => studentId === s.studentCode || studentId === `${classroom}_${s.no}_${s.name.replace(/\s/g, '')}`)?.studentCode;

  const studentTier = calculateStudentAbilityTier(classroom, studentId || studentNo);

  return all.filter((assignment) => {
    // 1. ถ้าระบุตัวนักเรียนเฉพาะเจาะจง (Specific Students)
    if (assignment.targetType === 'specific_students') {
      const targets = assignment.targetStudentIds || [];
      if (targets.length === 0) return false;
      return targets.some((target) => {
        const t = String(target).trim();
        if (!t) return false;
        if (studentNo !== undefined && (t === String(studentNo) || t === `no_${studentNo}` || t === `#${studentNo}`)) {
          return true;
        }
        if (studentId) {
          if (t === studentId || t === studentCode) return true;
          const parts = studentId.split('_');
          const noPart = parts[1];
          const namePart = parts.slice(2).join('_');
          if (noPart && (t === noPart || t === `no_${noPart}`)) return true;
          if (namePart && t === namePart) return true;
        }
        return false;
      });
    }

    // 2. ถ้ามอบหมายตามกลุ่มความสามารถ (Ability Tier)
    if (assignment.targetType === 'ability_tier' && assignment.targetTier) {
      return assignment.targetTier === studentTier;
    }

    // 3. ทั่วไป: ทุกคนเห็นได้
    return true;
  });
};

/**
 * ตัวช่วยสร้างชุดงาน 3 ระดับ (Differentiated 3-Tier Assignment Pack) อัตโนมัติในคลิกเดียว
 */
export const generate3TierAssignments = async (options: {
  classroom: string;
  subject: Subject;
  indicatorId: string;
  topic: string;
  dueDate: string;
  lessonPlanId?: string;
  category?: AssessmentCategory;
  knowledgeMaxScore?: number;
  practiceMaxScore?: number;
  resourceUrl?: string;
}): Promise<Assignment[]> => {
  const kMax = options.knowledgeMaxScore ?? 5;
  const pMax = options.practiceMaxScore ?? 5;
  const cat = options.category ?? 'k';

  // 1. ระดับพื้นฐาน (Foundation Tier) - มีคำใบ้ช่วยฝึกทีละขั้น
  const foundationDraft: Omit<Assignment, 'id' | 'createdAt'> = {
    title: `[ระดับพื้นฐาน] ${options.topic}`,
    description: `ฝึกความรู้และทักษะพื้นฐานเรื่อง "${options.topic}" เน้นทำความเข้าใจแนวคิดหลัก ทำตามตัวอย่างและศึกษาคำใบ้ช่วยคิดทีละขั้นตอน`,
    classroom: options.classroom,
    subject: options.subject,
    indicatorId: options.indicatorId,
    lessonPlanId: options.lessonPlanId,
    category: cat,
    dueDate: options.dueDate,
    maxScore: kMax + pMax,
    knowledgeMaxScore: kMax,
    practiceMaxScore: pMax,
    resourceUrl: options.resourceUrl,
    difficulty: 'foundation',
    targetType: 'all',
    targetTier: 'developing',
    recommendedReason: 'เหมาะสำหรับผู้ที่ต้องการทบทวนและปูพื้นฐานความเข้าใจ มีคำใบ้ช่วยทีละขั้น',
    hints: [
      'ขั้นตอนที่ 1: ทบทวนคำศัพท์และตัวอย่างจากสไลด์บทเรียนในระบบ',
      'ขั้นตอนที่ 2: เริ่มต้นทดลองจากโจทย์ข้อที่ง่ายที่สุดตามตัวอย่างก่อน',
      'ขั้นตอนที่ 3: ตรวจสอบความถูกต้องของคำตอบก่อนกดยืนยันส่งงาน',
    ],
    createdBy: 'teacher',
  };

  // 2. ระดับมาตรฐาน (Standard Tier) - ตรงตามตัวชี้วัดหลักสูตร
  const standardDraft: Omit<Assignment, 'id' | 'createdAt'> = {
    title: `[ระดับมาตรฐาน] ${options.topic}`,
    description: `ภารกิจฝึกปฏิบัติและประยุกต์ใช้ความรู้เรื่อง "${options.topic}" เพื่อแก้ปัญหาตามเกณฑ์ตัวชี้วัดมาตรฐานของหลักสูตร`,
    classroom: options.classroom,
    subject: options.subject,
    indicatorId: options.indicatorId,
    lessonPlanId: options.lessonPlanId,
    category: cat,
    dueDate: options.dueDate,
    maxScore: kMax + pMax,
    knowledgeMaxScore: kMax,
    practiceMaxScore: pMax,
    resourceUrl: options.resourceUrl,
    difficulty: 'standard',
    targetType: 'all',
    targetTier: 'proficient',
    recommendedReason: 'ภารกิจระดับมาตรฐานตามเกณฑ์ตัวชี้วัด สพฐ.',
    hints: [
      'แนะนำให้วางแผนลำดับขั้นตอนก่อนลงมือปฏิบัติ และทดสอบด้วยตนเองอย่างน้อย 1 ครั้ง',
    ],
    createdBy: 'teacher',
  };

  // 3. ระดับท้าทายต่อยอด (Advanced Tier) - แก้ปัญหาเชิงลึก & Bonus XP
  const advancedDraft: Omit<Assignment, 'id' | 'createdAt'> = {
    title: `[ระดับท้าทาย] ${options.topic} (ต่อยอดสร้างสรรค์)`,
    description: `ภารกิจท้าทายความคิดสร้างสรรค์เรื่อง "${options.topic}" แก้ปัญหาในชีวิตจริง ออกแบบแนวคิดใหม่ หรือสร้างนวัตกรรม พร้อมรับ Bonus XP เพิ่มเติม`,
    classroom: options.classroom,
    subject: options.subject,
    indicatorId: options.indicatorId,
    lessonPlanId: options.lessonPlanId,
    category: cat,
    dueDate: options.dueDate,
    maxScore: kMax + pMax,
    knowledgeMaxScore: kMax,
    practiceMaxScore: pMax,
    resourceUrl: options.resourceUrl,
    difficulty: 'advanced',
    targetType: 'all',
    targetTier: 'advanced',
    bonusPoints: 2,
    recommendedReason: 'เหมาะสำหรับผู้ที่มีทักษะคล่องแคล่วและต้องการความท้าทายระดับสูง พร้อมรับ Bonus XP',
    hints: [
      'ลองคิดค้นฟังก์ชันหรือเพิ่มลูกเล่นพิเศษที่แตกต่างจากตัวอย่างในบทเรียน',
      'เขียนสรุปแนวคิดการออกแบบ (Design Rationale) แนบมาพร้อมผลงาน',
    ],
    createdBy: 'teacher',
  };

  if (options.classroom === 'ป.1' && /ลำดับ|ขั้นตอน/.test(options.topic)) {
    foundationDraft.description = 'เรียงขั้นตอนแปรงฟัน 3 ขั้นให้ถูกต้อง: แปรงฟัน / บ้วนปาก / บีบยาสีฟัน เขียนเป็น 1 → 2 → 3 แล้วบอกว่าเหตุใดต้องเริ่มขั้นตอนนั้น';
    foundationDraft.hints = ['เริ่มด้วยเตรียมแปรงและบีบยาสีฟัน', 'ลองทำท่าประกอบทีละขั้น ก่อนเรียงคำตอบ'];
    standardDraft.description = 'เขียนขั้นตอนเตรียมตัวมาโรงเรียน 5 ขั้น เรียงตั้งแต่ตื่นนอนจนพร้อมออกจากบ้าน แล้วอธิบายว่าถ้าสลับสองขั้นจะเกิดอะไรขึ้น';
    advancedDraft.description = 'ตรวจลำดับนี้: ใส่รองเท้า → ใส่ถุงเท้า → เดินออกจากบ้าน แก้ให้ถูกต้อง อธิบายเหตุผล แล้วสร้างลำดับกิจวัตรของตนเองอีก 5 ขั้น';
    for (const draft of [foundationDraft, standardDraft, advancedDraft]) draft.description += '\nเกณฑ์ร่วม: K 5 คะแนน อธิบายเหตุผลของลำดับได้ / P 5 คะแนน เรียงขั้นตอนและตรวจแก้ได้';
  }
  const packId = uid();
  for (const draft of [foundationDraft, standardDraft, advancedDraft]) {
    draft.personalizedPackId = packId;
    draft.bonusPoints = undefined;
    draft.description = draft.description.replace(' พร้อมรับ Bonus XP เพิ่มเติม', '');
    draft.recommendedReason = 'งานในชุดเดียวกัน เลือกทำหนึ่งทางเลือก ใช้เกณฑ์คะแนนเดียวกัน และใช้คำใบ้ได้โดยไม่หักคะแนน';
  }
  const a1 = await createAssignment(foundationDraft);
  for (const draft of [standardDraft, advancedDraft]) {
    draft.linkedKnowledgeAssessmentId = a1.linkedKnowledgeAssessmentId;
    draft.linkedPracticeAssessmentId = a1.linkedPracticeAssessmentId;
  }
  const a2 = await createAssignment(standardDraft);
  const a3 = await createAssignment(advancedDraft);

  return [a1, a2, a3];
};

/** Recommend from the most recent reviewed work for this skill, never total grades. */
export const recommendAssignment = (assignment: Assignment, studentId: string): { difficulty: AssignmentDifficulty; reason: string } => {
  const related = new Set(loadAssignments().filter(a => a.classroom === assignment.classroom && a.subject === assignment.subject && a.indicatorId === assignment.indicatorId).map(a => a.id));
  const previous = loadSubmissions().filter(s => s.studentId === studentId && related.has(s.assignmentId) && s.reviewedAt && Number.isFinite(s.score)).sort((a,b) => (b.reviewedAt || 0) - (a.reviewedAt || 0))[0];
  const task = previous && loadAssignments().find(a => a.id === previous.assignmentId);
  if (!task || task.maxScore <= 0) return { difficulty: 'standard', reason: 'ยังไม่มีผลประเมินทักษะนี้ เริ่มฝึกด้วยตนเองหรือเลือกตัวช่วยได้' };
  const ratio = previous.score! / task.maxScore;
  return { difficulty: ratio >= .8 ? 'advanced' : ratio >= .5 ? 'standard' : 'foundation', reason: `แนะนำจากงานล่าสุดในตัวชี้วัดนี้ (${previous.score}/${task.maxScore}) เปลี่ยนทางเลือกได้` };
};

/** จัดรูปแบบ URL ให้อยู่ในรูปสมบูรณ์ ป้องกัน browser เปิดเป็น relative link */
export const normalizeHomeworkUrl = (url?: string): string => {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

/** ตรวจสอบความถูกต้องของ URL ลิงก์ผลงาน (ต้องเป็น http/https, มี hostname โดเมนที่ถูกต้อง เช่น canva.com, scratch.mit.edu) */
export const isValidSubmissionUrl = (url?: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  const normalized = normalizeHomeworkUrl(trimmed);
  try {
    const parsed = new URL(normalized);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    const hostname = parsed.hostname.toLowerCase();
    // ป้องกัน localhost หรือคำโดดๆ เช่น asdasd, test
    if (!hostname.includes('.') || hostname === 'localhost') return false;
    const parts = hostname.split('.');
    if (parts.length < 2) return false;
    const tld = parts[parts.length - 1];
    // TLD ต้องเป็นตัวอักษรอย่างน้อย 2 ตัว และส่วนประกอบชื่อโดเมนไม่ว่างเปล่า
    if (!tld || tld.length < 2 || !/^[a-z]{2,}$/i.test(tld)) return false;
    if (parts.some((p) => p.length === 0)) return false;
    return true;
  } catch {
    return false;
  }
};

/** สร้างลิงก์ระบบส่งงานภายในโรงเรียนอัตโนมัติ (สำหรับนักเรียนที่ไม่มี Gmail / ไม่ใช้โทรศัพท์) */
export const buildDirectSubmissionPortalUrl = (
  assignmentId: string,
  studentId: string,
  fileName = 'student-work',
  mode: 'direct-file' | 'workstation' = 'direct-file',
): string => {
  const safeAssign = encodeURIComponent(assignmentId || 'task');
  const safeStudent = encodeURIComponent(studentId || 'student');
  const safeName = encodeURIComponent(fileName.replace(/\s+/g, '-').slice(0, 80) || 'work');
  return `https://krujames.school.local/${mode}/${safeAssign}/${safeStudent}/${safeName}`;
};

export const isDirectPortalSubmissionUrl = (url?: string): boolean => {
  if (!url) return false;
  return /^https?:\/\/krujames\.school\.local\/(direct-file|workstation)\//i.test(url.trim());
};

const readBlobAsDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์ได้'));
    reader.readAsDataURL(blob);
  });

const compressImageFileToDataUrl = async (file: Blob, maxDim = 680, quality = 0.52): Promise<{ dataUrl: string; mimeType: string }> => {
  const rawDataUrl = await readBlobAsDataUrl(file);
  if (typeof document === 'undefined' || typeof Image === 'undefined') {
    return { dataUrl: rawDataUrl, mimeType: file.type || 'image/png' };
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width || 640;
        let height = img.naturalHeight || img.height || 480;
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ dataUrl: rawDataUrl, mimeType: file.type || 'image/png' });
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        let compressed = canvas.toDataURL('image/webp', quality);
        let outMime = 'image/webp';
        if (!compressed.startsWith('data:image/webp') || compressed.length > 95_000) {
          compressed = canvas.toDataURL('image/jpeg', 0.48);
          outMime = 'image/jpeg';
        }
        if (compressed.length > 110_000) {
          compressed = canvas.toDataURL('image/jpeg', 0.36);
          outMime = 'image/jpeg';
        }
        resolve({ dataUrl: compressed, mimeType: outMime });
      } catch {
        resolve({ dataUrl: rawDataUrl, mimeType: file.type || 'image/png' });
      }
    };
    img.onerror = () => resolve({ dataUrl: rawDataUrl, mimeType: file.type || 'image/png' });
    img.src = rawDataUrl;
  });
};

/**
 * สร้างโค้ด Google Apps Script สำเร็จรูปสำหรับให้คุณครูวางใน script.google.com
 * เพื่อให้เด็กส่งไฟล์เข้า Google Drive ของครูได้โดยตรง (ใช้พื้นที่ Google Drive ฟรี 15 GB ของครู ไม่เปลืองความจำเว็บ และเด็กไม่ต้องมี Gmail!)
 */
export const getGoogleDriveAppsScriptTemplate = (sharedFolderUrl = ''): string => {
  const folderPathMatch = sharedFolderUrl.match(/\/folders\/([a-zA-Z0-9_-]{8,})/);
  const tokenMatch = sharedFolderUrl.match(/[-\w]{25,}/);
  const defaultFolderId = folderPathMatch ? folderPathMatch[1] : tokenMatch ? tokenMatch[0] : '';
  return `// ============================================================================
// ☁️ ระบบรับไฟล์งานนักเรียนเข้า Google Drive ของครูเจมส์โดยตรง (KruJames Drive Bridge)
// เด็กไม่ต้องล็อกอิน Gmail • ไม่ต้องใช้โทรศัพท์ • ไม่เปลืองความจำฐานข้อมูลเว็บไซต์ (เก็บเฉพาะลิงก์!)
// ============================================================================
// วิธีติดตั้ง (ทำครั้งเดียวใช้ได้ตลอดปี):
// 1. เข้าเว็บ https://script.google.com ด้วยบัญชี Gmail ของคุณครู -> กด "โปรเจกต์ใหม่ (New project)"
// 2. ลบโค้ดเดิมออกทั้งหมด แล้ววางโค้ดนี้ลงไป -> กดปุ่มรูปแผ่นดิสก์ (บันทึก)
// 3. กดปุ่มสีน้ำเงินมุมขวาบน "การทำให้ใช้งานได้ (Deploy)" -> "การทำให้ใช้งานได้รายการใหม่ (New deployment)"
// 4. กดรูปเฟือง -> เลือก "เว็บแอป (Web app)"
//    - ดำเนินการในฐานะ (Execute as): เลือก "ฉัน (Me)"
//    - ผู้ที่มีสิทธิ์เข้าถึง (Who has access): เลือก "ทุกคน (Anyone)"  <-- สำคัญมาก เพื่อให้เด็กส่งได้โดยไม่ต้องล็อกอิน Gmail
// 5. กด "การทำให้ใช้งานได้ (Deploy)" -> กดอนุญาตสิทธิ์ (Authorize access) -> คัดลอก "URL ของเว็บแอป" มาวางในหน้าเว็บครูเจมส์!

const ROOT_FOLDER_ID = "${defaultFolderId}"; // หากว่างไว้ ระบบจะสร้างโฟลเดอร์ชื่อ "งานนักเรียน_KruJamesOnCom" ใน Google Drive ให้อัตโนมัติ

function getOrCreateSubFolder(parent, name) {
  const safeName = String(name || "ทั่วไป").trim();
  const iter = parent.getFoldersByName(safeName);
  if (iter.hasNext()) return iter.next();
  return parent.createFolder(safeName);
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    let rootFolder;
    if (ROOT_FOLDER_ID && ROOT_FOLDER_ID.length > 10) {
      rootFolder = DriveApp.getFolderById(ROOT_FOLDER_ID);
    } else {
      const iter = DriveApp.getFoldersByName("งานนักเรียน_KruJamesOnCom");
      rootFolder = iter.hasNext() ? iter.next() : DriveApp.createFolder("งานนักเรียน_KruJamesOnCom");
    }

    const classFolder = getOrCreateSubFolder(rootFolder, payload.classroom || "รวมชั้นเรียน");
    const taskFolder = getOrCreateSubFolder(classFolder, payload.assignmentTitle || "ใบงาน");

    const base64Data = String(payload.base64Data || "").replace(/^data:[^;]+;base64,/, "");
    const decoded = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(decoded, payload.mimeType || "application/octet-stream", payload.fileName || "work.png");

    const file = taskFolder.createFile(blob);
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (shareErr) {
      // กรณีบัญชีองค์กรจำกัดสิทธิ์สาธารณะ ลิงก์ยังเปิดได้โดยครูเจ้าของไดรฟ์
    }

    const fileId = file.getId();
    const fileUrl = "https://drive.google.com/file/d/" + fileId + "/view?usp=sharing";

    return ContentService.createTextOutput(JSON.stringify({
      ok: true,
      fileId: fileId,
      fileUrl: fileUrl,
      fileName: file.getName()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      error: String(err)
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`;
};

/**
 * อัปโหลดไฟล์ของนักเรียนพุ่งตรงเข้า Google Drive ของคุณครูผ่าน Apps Script Web App
 * คืนค่าลิงก์ https://drive.google.com/file/d/.../view เมื่อสำเร็จ (ไม่ต้องเก็บไฟล์ในเว็บเลย!)
 */
export const uploadFileToTeacherGoogleDrive = async (
  file: Blob,
  meta: {
    fileName: string;
    mimeType: string;
    classroom: string;
    assignmentTitle?: string;
    studentNo?: number;
    studentName?: string;
    studentId: string;
  },
): Promise<string | null> => {
  const config = loadGoogleDriveBridgeConfig();
  const scriptUrl = config.scriptWebAppUrl?.trim();
  if (!scriptUrl || !/^https:\/\/script\.google\.com\/macros\/s\//i.test(scriptUrl)) {
    return null;
  }

  const dataUrl = await readBlobAsDataUrl(file);
  const base64Data = dataUrl.replace(/^data:[^;]+;base64,/, '');
  const prefixNo = meta.studentNo ? `เลขที่${String(meta.studentNo).padStart(2, '0')}_` : '';
  const prefixName = meta.studentName ? `${meta.studentName.replace(/\s+/g, '_')}_` : '';
  const cleanFileName = `${prefixNo}${prefixName}${meta.fileName}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        fileName: cleanFileName,
        mimeType: meta.mimeType,
        classroom: meta.classroom,
        assignmentTitle: meta.assignmentTitle || 'ใบงาน',
        studentId: meta.studentId,
        base64Data,
      }),
      signal: controller.signal,
    });
    const json = (await res.json()) as { ok?: boolean; fileUrl?: string; error?: string };
    if (json?.ok && json.fileUrl && /^https:\/\/drive\.google\.com\//i.test(json.fileUrl)) {
      return json.fileUrl;
    }
    return null;
  } catch (err) {
    console.warn('Google Drive Bridge upload failed, falling back:', err);
    return null;
  } finally {
    clearTimeout(timer);
  }
};

/** คำนวณขนาดความจำที่ใช้เก็บไฟล์สำรองในระบบ เพื่อแสดงให้ครูเห็นและกดล้างความจำได้ */
export const getSubmissionStorageUsageSummary = (): {
  totalSubmissions: number;
  cloudLinkCount: number;
  embeddedBinaryCount: number;
  embeddedBinaryKB: number;
  driveLinkedCount: number;
  inlineFallbackCount: number;
  inlineBytesApprox: number;
  inlineKB: number;
} => {
  const subs = loadSubmissions();
  let driveLinkedCount = 0;
  let inlineFallbackCount = 0;
  let inlineBytesApprox = 0;
  for (const s of subs) {
    if (s.contentUrl && isExternalCloudUrl(s.contentUrl)) {
      driveLinkedCount += 1;
    }
    if (s.contentData && s.contentData.length > 0) {
      inlineFallbackCount += 1;
      inlineBytesApprox += s.contentData.length;
    }
  }
  const inlineKB = Math.round((inlineBytesApprox / 1024) * 10) / 10;
  return {
    totalSubmissions: subs.length,
    cloudLinkCount: driveLinkedCount,
    embeddedBinaryCount: inlineFallbackCount,
    embeddedBinaryKB: inlineKB,
    driveLinkedCount,
    inlineFallbackCount,
    inlineBytesApprox,
    inlineKB,
  };
};

/** ล้างข้อมูลไบนารีสำรอง (contentData) ออกจากความจำเว็บ โดยคงคะแนนและลิงก์งานไว้ครบ 100% */
export const purgeSubmissionBinaryCache = async (
  onlyReviewed = false,
): Promise<{ purgedCount: number; freedKB: number }> => {
  const subs = loadSubmissions();
  let purgedCount = 0;
  let freedBytes = 0;
  const updated = subs.map((s) => {
    if (!s.contentData) return s;
    if (onlyReviewed && !s.reviewedAt && !isExternalCloudUrl(s.contentUrl)) return s;
    purgedCount += 1;
    freedBytes += s.contentData.length;
    const cleaned: Submission = { ...s };
    delete cleaned.contentData;
    return cleaned;
  });
  cache(SUB_KEY, updated);
  if (firebaseAvailable() && purgedCount > 0) {
    await Promise.all(
      updated
        .filter((_, idx) => subs[idx]?.contentData && !updated[idx]?.contentData)
        .map((s) => saveSubmissionRemote(s)),
    );
  }
  return {
    purgedCount,
    freedKB: Math.round((freedBytes / 1024) * 10) / 10,
  };
};

/**
 * แปลงไฟล์ภาพแคปหน้าจอ / ไฟล์โปรเจกต์จากคอมพิวเตอร์โรงเรียนให้พร้อมส่งทันทีโดยไม่ต้องใช้ Gmail ของนักเรียน:
 * 1) หากครูตั้งค่า Google Drive Bridge ไว้ -> อัปโหลดเข้า Google Drive ของครูโดยตรง ได้ลิงก์ https://drive.google.com/... และไม่เก็บไฟล์ในเว็บเลย (ใช้ความจำเว็บ 0 KB!)
 * 2) หากเปิด Firebase Storage ไว้ -> อัปโหลดขึ้น Cloud Storage และเก็บเฉพาะลิงก์ (ใช้ความจำฐานข้อมูล 0 KB!)
 * 3) กรณีสำรอง (ยังไม่ผูก Google Drive) -> บีบอัดภาพขนาดจิ๋วประหยัดความจำพิเศษ (Ultra-Light ~15-25 KB)
 */
export const prepareDirectStudentSubmissionFile = async (
  file: File | Blob,
  options: {
    studentId: string;
    studentName?: string;
    studentNo?: number;
    classroom: string;
    assignmentId: string;
    assignmentTitle?: string;
    fileName?: string;
  },
): Promise<{
  contentData: string;
  contentUrl: string;
  attachmentFileName: string;
  attachmentMimeType: string;
  uploadedToDrive: boolean;
}> => {
  const originalName =
    options.fileName ||
    (file instanceof File && file.name ? file.name : `screenshot-${Date.now()}.png`);
  const mimeType = file.type || 'application/octet-stream';
  const isImage = mimeType.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp)$/i.test(originalName);
  const gdriveConfig = loadGoogleDriveBridgeConfig();

  // 1. ลองอัปโหลดเข้า Google Drive กลางของคุณครูก่อนเป็นอันดับแรก (รองรับไฟล์ใหญ่ถึง 15 MB และไม่เปลืองความจำเว็บเลย!)
  if (gdriveConfig.scriptWebAppUrl) {
    if (file.size > 15 * 1024 * 1024) {
      throw new Error('ไฟล์มีขนาดใหญ่เกิน 15 MB กรุณาเลือกไฟล์ขนาดไม่เกิน 15 MB ครับ');
    }
    const uploadBlob = isImage
      ? await (async () => {
          const c = await compressImageFileToDataUrl(file, 1280, 0.8);
          const res = await fetch(c.dataUrl);
          return await res.blob();
        })()
      : file;

    const driveUrl = await uploadFileToTeacherGoogleDrive(uploadBlob, {
      fileName: originalName,
      mimeType: isImage ? 'image/jpeg' : mimeType,
      classroom: options.classroom,
      assignmentTitle: options.assignmentTitle,
      studentNo: options.studentNo,
      studentName: options.studentName,
      studentId: options.studentId,
    });

    if (driveUrl) {
      return {
        contentData: '', // ไม่เก็บไฟล์ลงฐานข้อมูลเว็บเลย ประหยัดความจำ 100%!
        contentUrl: driveUrl,
        attachmentFileName: originalName,
        attachmentMimeType: mimeType,
        uploadedToDrive: true,
      };
    }
  }

  // 2. ลองอัปโหลดขึ้น Firebase Storage (หากสำเร็จ จะได้ลิงก์ Cloud และไม่เก็บไฟล์ลง Firestore!)
  try {
    const safePath = `homework_uploads/${encodeURIComponent(options.classroom || 'class')}/${encodeURIComponent(options.assignmentId)}/${encodeURIComponent(options.studentId)}_${Date.now()}_${originalName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const storageRef = ref(storage, safePath);
    const uploadPromise = (async () => {
      await uploadBytes(storageRef, file, { contentType: mimeType });
      return await getDownloadURL(storageRef);
    })();
    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('storage-timeout')), 2500),
    );
    const remoteUrl = await Promise.race([uploadPromise, timeoutPromise]);
    if (remoteUrl && /^https?:\/\//i.test(remoteUrl)) {
      return {
        contentData: '', // ได้ลิงก์ Cloud แล้ว ไม่ต้องเก็บ base64 ในฐานข้อมูล!
        contentUrl: remoteUrl,
        attachmentFileName: originalName,
        attachmentMimeType: mimeType,
        uploadedToDrive: true,
      };
    }
  } catch {
    // ไปยังโหมดประหยัดความจำสำรอง
  }

  // 3. โหมดสำรอง (กรณีครูยังไม่ได้ผูก Google Drive Bridge): บีบอัดภาพขนาดประหยัดความจำสูงสุด (~15-25 KB)
  let contentData = '';
  let finalMimeType = mimeType;

  if (isImage) {
    const compressed = await compressImageFileToDataUrl(file, 640, 0.5);
    contentData = compressed.dataUrl;
    finalMimeType = compressed.mimeType;
  } else {
    if (file.size > 90 * 1024) {
      throw new Error(
        `ขณะนี้คุณครูยังไม่ได้เชื่อมโฟลเดอร์ Google Drive กลาง จึงแนบไฟล์ตรงได้เฉพาะไฟล์เล็กไม่เกิน 90 KB หรือใช้ปุ่ม "📸 แคปหน้าจอโปรแกรม (ประหยัดความจำ)" แทนครับ`,
      );
    }
    contentData = await readBlobAsDataUrl(file);
  }

  if (contentData.length > MAX_FIRESTORE_CONTENT_DATA_LEN) {
    throw new Error('ขนาดข้อมูลเกินขีดจำกัดประหยัดความจำ กรุณาใช้ปุ่มแคปหน้าจอแทนครับ');
  }

  const contentUrl = buildDirectSubmissionPortalUrl(
    options.assignmentId,
    options.studentId,
    originalName,
    'direct-file',
  );

  return {
    contentData,
    contentUrl,
    attachmentFileName: originalName,
    attachmentMimeType: finalMimeType,
    uploadedToDrive: false,
  };
};

/** ตรวจสอบความสมบูรณ์ของเนื้อหางานก่อนส่ง (รองรับโหมดไร้ Gmail: แคปหน้าจอ, แนบไฟล์, วาดผังงาน, ระบุเครื่องคอมฯ) */
export const validateSubmissionContent = (data: {
  contentUrl?: string;
  contentData?: string;
  workstationNo?: string;
  submissionMethod?: SubmissionMethod;
  comment?: string;
  isDesignThinking?: boolean;
  dtDefine?: string;
  dtIdeate?: string;
  dtPrototypeUrl?: string;
}): { valid: boolean; error?: string } => {
  const url = data.contentUrl?.trim();
  const comment = data.comment?.trim();
  const hasDirectFile = Boolean(data.contentData && data.contentData.trim().length > 20);
  const hasWorkstation = Boolean(data.workstationNo && data.workstationNo.trim().length >= 1);

  if (data.isDesignThinking) {
    const define = data.dtDefine?.trim() || '';
    const ideate = data.dtIdeate?.trim() || '';
    const proto = data.dtPrototypeUrl?.trim() || '';
    if (define.length < 10) {
      return { valid: false, error: 'กรุณาระบุปัญหาและกลุ่มผู้ใช้ในขั้นที่ 1 อย่างน้อย 10 ตัวอักษร' };
    }
    if (ideate.length < 10) {
      return { valid: false, error: 'กรุณาระบุแนวทางแก้ปัญหาในขั้นที่ 2 อย่างน้อย 10 ตัวอักษร' };
    }
    if (proto && !isValidSubmissionUrl(proto)) {
      return { valid: false, error: 'ลิงก์ต้นแบบ (Prototype) ในขั้นที่ 3 ไม่ถูกต้อง กรุณาใส่ URL เว็บไซต์จริง เช่น Canva หรือ Scratch' };
    }
    return { valid: true };
  }

  // ถ้ามีการกรอกลิงก์มา ต้องตรวจความถูกต้องของโดเมนก่อนเสมอ
  if (url && !isValidSubmissionUrl(url)) {
    return {
      valid: false,
      error: '❌ ลิงก์ผลงานไม่ถูกต้อง: กรุณาใส่ URL เว็บไซต์จริง (เช่น https://www.canva.com/... หรือ https://scratch.mit.edu/...) หรือเปลี่ยนไปใช้โหมด "📸 แคปจอ/แนบไฟล์ (ไม่ต้องใช้ Gmail)" แทนครับ',
    };
  }

  // ตรวจจับข้อความพิมพ์เล่น / สแปมคีย์บอร์ด
  const isSpamText = (text: string) => {
    const clean = text.trim().toLowerCase();
    if (/(.)\1{4,}/.test(clean)) return true; // พิมพ์ตัวเดิมซ้ำ 5 ครั้งขึ้นไป เช่น aaaaa
    if (/^(asd|asdf|qwe|qwer|zxc|zxcv|123)+$/i.test(clean)) return true; // แป้นเหย้า/ตัวเลขซ้ำ
    const unique = new Set(clean.replace(/\s/g, '').split(''));
    if (clean.length >= 6 && unique.size <= 2) return true;
    return false;
  };

  if (comment && isSpamText(comment)) {
    return {
      valid: false,
      error: '❌ ข้อความไม่ถูกต้อง: กรุณาพิมพ์คำตอบหรืออธิบายงานจริง ไม่พิมพ์ตัวอักษรซ้ำหรือพิมพ์เล่นครับ',
    };
  }

  // กรณีแนบภาพแคปหน้าจอ / ไฟล์จากคอมฯ / กระดานวาดภาพ -> ผ่านทันทีโดยไม่ต้องมี Gmail หรือลิงก์ภายนอก!
  if (hasDirectFile) {
    return { valid: true };
  }

  // กรณีส่งงานหน้าเครื่องคอมพิวเตอร์ห้องเรียน (ระบุหมายเลขเครื่อง PC)
  if (hasWorkstation) {
    if (!comment || comment.length < 3) {
      return {
        valid: false,
        error: '❌ กรุณาพิมพ์ชื่อไฟล์ที่บันทึกไว้ หรือสรุปสั้นๆ ว่าทำอะไรเสร็จที่เครื่องคอมพิวเตอร์นี้ครับ (อย่างน้อย 3 ตัวอักษร)',
      };
    }
    return { valid: true };
  }

  // กรณีไม่มีลิงก์ ส่งเฉพาะข้อความตอบคำถาม
  if (!url) {
    if (!comment || comment.length < 10) {
      return {
        valid: false,
        error: '❌ ข้อความสั้นเกินไป: กรุณาพิมพ์คำตอบอย่างน้อย 10 ตัวอักษร หรือใช้ปุ่ม "📸 แคปหน้าจอโปรแกรมส่งทันที" ด้านบนครับ',
      };
    }
  }

  if (!url && !comment) {
    return {
      valid: false,
      error: '❌ กรุณาแคปหน้าจอ/แนบไฟล์ หรือเลือกเครื่องคอมพิวเตอร์ หรือพิมพ์คำตอบก่อนส่งงานครับ',
    };
  }

  return { valid: true };
};

export const submitWork = async (
  data: Omit<Submission, 'id' | 'submittedAt'>,
): Promise<Submission> => {
  const assignment = loadAssignments().find(a => a.id === data.assignmentId);
  if (!assignment || !getAssignmentsForStudent(data.classroom, data.studentId, data.studentNo).some(a => a.id === assignment.id)) throw new Error('งานนี้ไม่ได้มอบหมายให้นักเรียนคนนี้');
  const alternatives = new Set(loadAssignments().filter(a => a.id === assignment.id || (assignment.personalizedPackId && a.personalizedPackId === assignment.personalizedPackId)).map(a => a.id));
  const previous = loadSubmissions().find(s => alternatives.has(s.assignmentId) && s.studentId === data.studentId);
  if (previous?.reviewedAt) throw new Error('ครูตรวจงานนี้แล้ว กรุณาติดต่อครูก่อนแก้ไข');

  const hasDirectFile = Boolean(data.contentData && data.contentData.trim().length > 20);
  const hasWorkstation = Boolean(data.workstationNo && data.workstationNo.trim().length >= 1);

  let effectiveUrl = data.contentUrl?.trim() || '';
  if (!effectiveUrl && hasDirectFile) {
    effectiveUrl = buildDirectSubmissionPortalUrl(
      data.assignmentId,
      data.studentId,
      data.attachmentFileName || 'student-file',
      'direct-file',
    );
  } else if (!effectiveUrl && hasWorkstation) {
    effectiveUrl = buildDirectSubmissionPortalUrl(
      data.assignmentId,
      data.studentId,
      data.workstationNo || 'pc',
      'workstation',
    );
  }

  if (effectiveUrl && !isValidSubmissionUrl(effectiveUrl)) {
    throw new Error('ลิงก์ผลงานไม่ถูกต้อง กรุณาใส่ URL เว็บไซต์จริง เช่น Canva หรือ Scratch');
  }
  if (data.designThinkingSteps?.prototypeUrl?.trim() && !isValidSubmissionUrl(data.designThinkingSteps.prototypeUrl)) {
    throw new Error('ลิงก์ผลงานต้นแบบไม่ถูกต้อง กรุณาใส่ URL เว็บไซต์จริง');
  }
  if (!effectiveUrl && !hasDirectFile && !hasWorkstation && !data.comment?.trim() && !data.designThinkingSteps) {
    throw new Error('กรุณาแนบภาพหน้าจอ/ไฟล์งาน หรือระบุลิงก์ผลงาน หรือพิมพ์คำตอบของงาน');
  }

  const normalizedContentUrl = normalizeHomeworkUrl(effectiveUrl);
  const normalizedDtSteps = data.designThinkingSteps ? {
    ...data.designThinkingSteps,
    prototypeUrl: normalizeHomeworkUrl(data.designThinkingSteps.prototypeUrl),
  } : undefined;

  const submission: Submission = {
    ...data,
    contentUrl: normalizedContentUrl || undefined,
    contentData: hasDirectFile ? data.contentData : undefined,
    attachmentFileName: data.attachmentFileName?.trim() || undefined,
    attachmentMimeType: data.attachmentMimeType?.trim() || undefined,
    workstationNo: data.workstationNo?.trim() || undefined,
    submissionMethod:
      data.submissionMethod ||
      (hasDirectFile
        ? 'screenshot_file'
        : hasWorkstation
        ? 'workstation'
        : normalizedContentUrl
        ? 'external_link'
        : 'written_answer'),
    designThinkingSteps: normalizedDtSteps,
    id: previous?.id || uid(),
    submittedAt: Date.now(),
    score: undefined,
    kScore: undefined,
    pScore: undefined,
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
    (submission.studentId && (grade.studentCode === submission.studentId || submission.studentId.includes(grade.studentCode))) ||
    grade.name === submission.studentName ||
    grade.studentNo === submission.studentNo
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
  classroom?: string,
  studentNo?: number,
): Submission | null => {
  const allSubs = loadSubmissions();
  const direct = allSubs.find(
    (submission) => submission.assignmentId === assignmentId && submission.studentId === studentId,
  );
  if (direct) return direct;

  if (classroom && studentNo !== undefined && !Number.isNaN(studentNo)) {
    const byNo = allSubs.find(
      (submission) =>
        submission.assignmentId === assignmentId &&
        submission.classroom === classroom &&
        submission.studentNo === studentNo,
    );
    if (byNo) return byNo;
  }
  return null;
};

export type StudentTaskStatus = 'overdue' | 'pending' | 'waiting_review' | 'graded';

export interface StudentTaskStatusItem {
  assignment: Assignment;
  submission: Submission | null;
  status: StudentTaskStatus;
  isOverdue: boolean;
  daysRemaining: number; // ติดลบถ้าเลยกำหนดแล้ว, 0 ถ้าครบกำหนดวันนี้, บวกถ้ายังไม่ถึงกำหนด
  dueLabel: string;
  subjectTitle: string;
  indicatorCode?: string;
}

export interface MissingManualAssessmentItem {
  assessmentId: string;
  title: string;
  subject: Subject;
  subjectTitle: string;
  indicatorId: string;
  indicatorCode: string;
  category: AssessmentCategory;
  maxScore: number;
  resourceUrl?: string;
  linkedAssignmentId?: string;
}

export interface StudentWorkStatusOverview {
  tasks: StudentTaskStatusItem[];
  missingTasks: StudentTaskStatusItem[];
  overdueTasks: StudentTaskStatusItem[];
  pendingTasks: StudentTaskStatusItem[];
  waitingReviewTasks: StudentTaskStatusItem[];
  gradedTasks: StudentTaskStatusItem[];
  missingManualAssessments: MissingManualAssessmentItem[];
  totalRequiredCount: number;
  completedCount: number;
  totalMissingCount: number;
  overdueCount: number;
  pendingCount: number;
  waitingReviewCount: number;
  gradedCount: number;
  completionPercent: number;
}

/**
 * สรุปภาพรวมงานที่ต้องส่ง งานค้างส่ง งานเลยกำหนด และใบงานในสมุดคะแนนที่ยังไม่มีคะแนนของนักเรียนรายคน
 */
export const getStudentWorkStatusOverview = (
  classroom: string,
  studentId: string,
  studentNo?: number,
  studentName?: string,
  packChoices: Record<string, string> = {},
): StudentWorkStatusOverview => {
  const rawAssignments = getAssignmentsForStudent(classroom, studentId, studentNo);
  const subjects = getSubjectsForClassroom(classroom);
  const subjectTitleMap = new Map<string, string>(subjects.map((s) => [s.id, s.title]));

  // Deduplicate 3-tier personalized packs into 1 task per pack
  const chosenPackAssignmentId = new Map<string, string>();
  for (const a of rawAssignments) {
    if (!a.personalizedPackId || chosenPackAssignmentId.has(a.personalizedPackId)) continue;
    const variants = rawAssignments.filter((v) => v.personalizedPackId === a.personalizedPackId);
    const submittedVariant = variants.find((v) =>
      Boolean(getStudentSubmissionForAssignment(v.id, studentId, classroom, studentNo)),
    );
    const recommendedDiff = recommendAssignment(a, studentId).difficulty;
    const chosenId =
      submittedVariant?.id ||
      packChoices[a.personalizedPackId] ||
      variants.find((v) => (v.difficulty || 'standard') === recommendedDiff)?.id ||
      a.id;
    chosenPackAssignmentId.set(a.personalizedPackId, chosenId);
  }

  const deduplicatedAssignments = rawAssignments.filter((a) => {
    if (!a.personalizedPackId) return true;
    return chosenPackAssignmentId.get(a.personalizedPackId) === a.id;
  });

  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const tasks: StudentTaskStatusItem[] = deduplicatedAssignments.map((a) => {
    const sub = getStudentSubmissionForAssignment(a.id, studentId, classroom, studentNo);
    const dueTime = a.dueDate ? new Date(`${a.dueDate}T23:59:59`).getTime() : todayMidnight + 86400000 * 7;
    const dueMidnight = a.dueDate
      ? new Date(`${a.dueDate}T00:00:00`).getTime()
      : todayMidnight + 86400000 * 7;
    const daysRemaining = Number.isFinite(dueMidnight)
      ? Math.round((dueMidnight - todayMidnight) / 86400000)
      : 7;
    const isOverdue = !sub && Number.isFinite(dueTime) && dueTime < now.getTime();

    let status: StudentTaskStatus = 'pending';
    if (sub) {
      status = sub.score !== undefined ? 'graded' : 'waiting_review';
    } else if (isOverdue) {
      status = 'overdue';
    }

    let dueLabel = a.dueDate ? `ส่งภายใน ${a.dueDate}` : 'ไม่ระบุวันครบกำหนด';
    if (!sub) {
      if (isOverdue) {
        const lateDays = Math.max(1, Math.abs(daysRemaining));
        dueLabel = `เลยกำหนดมาแล้ว ${lateDays} วัน (กำหนด ${a.dueDate})`;
      } else if (daysRemaining === 0) {
        dueLabel = `ครบกำหนดส่งวันนี้! (${a.dueDate})`;
      } else if (daysRemaining > 0 && daysRemaining <= 3) {
        dueLabel = `เหลือเวลาอีก ${daysRemaining} วัน (${a.dueDate})`;
      }
    }

    const subj = a.subject || 'main';
    const indicators = getIndicators(classroom, subj);
    const indObj = indicators.find((ind) => ind.id === a.indicatorId);

    return {
      assignment: a,
      submission: sub,
      status,
      isOverdue,
      daysRemaining,
      dueLabel,
      subjectTitle: subjectTitleMap.get(subj) || 'เทคโนโลยี (วิทยาการคำนวณ)',
      indicatorCode: indObj?.code || a.indicatorId,
    };
  });

  // Sort tasks: overdue first, then pending (by due date), then waiting_review, then graded
  const statusPriority: Record<StudentTaskStatus, number> = {
    overdue: 0,
    pending: 1,
    waiting_review: 2,
    graded: 3,
  };
  tasks.sort((x, y) => {
    if (statusPriority[x.status] !== statusPriority[y.status]) {
      return statusPriority[x.status] - statusPriority[y.status];
    }
    return (x.assignment.dueDate || '').localeCompare(y.assignment.dueDate || '');
  });

  // Check manual assessments in Gradebook (ชิ้นงาน/ใบงานในชั้นเรียนที่ยังไม่มีคะแนน)
  const linkedAssessmentIdsFromSubmittedHomework = new Set<string>();
  const assignmentByAssessmentId = new Map<string, string>();
  for (const a of rawAssignments) {
    const sub = getStudentSubmissionForAssignment(a.id, studentId, classroom, studentNo);
    const ids = [
      a.linkedAssessmentId,
      a.linkedKnowledgeAssessmentId,
      a.linkedPracticeAssessmentId,
    ].filter((id): id is string => Boolean(id));
    ids.forEach((id) => {
      if (!assignmentByAssessmentId.has(id)) {
        assignmentByAssessmentId.set(id, a.id);
      }
      if (sub) {
        linkedAssessmentIdsFromSubmittedHomework.add(id);
      }
    });
  }

  const missingManualAssessments: MissingManualAssessmentItem[] = [];
  const seenGroupKeys = new Set<string>();

  for (const subj of subjects) {
    const grades = loadGrades(classroom, subj.id);
    const me = grades.find(
      (g) =>
        (studentNo !== undefined && g.studentNo === studentNo) ||
        (studentName && g.name === studentName) ||
        g.studentCode === studentId,
    );
    if (!me) continue;

    const assessments = loadManualAssessments(classroom, subj.id);
    const scores = loadManualAssessmentScores(classroom, subj.id);
    const indicators = getIndicators(classroom, subj.id);

    for (const assmt of assessments) {
      // Skip if this manual assessment is already linked to a homework task in `tasks`
      if (assignmentByAssessmentId.has(assmt.id)) continue;
      if (linkedAssessmentIdsFromSubmittedHomework.has(assmt.id)) continue;

      const rawScore = scores[assmt.id]?.[me.studentCode];
      if (rawScore !== undefined && rawScore !== null && rawScore > 0) continue;

      const dedupGroupKey = `${subj.id}:${assmt.groupId || assmt.title}`;
      if (seenGroupKeys.has(dedupGroupKey)) continue;
      seenGroupKeys.add(dedupGroupKey);

      const indObj = indicators.find((ind) => ind.id === assmt.indicatorId);
      missingManualAssessments.push({
        assessmentId: assmt.id,
        title: assmt.title,
        subject: subj.id,
        subjectTitle: subj.title,
        indicatorId: assmt.indicatorId,
        indicatorCode: indObj?.code || assmt.indicatorId,
        category: assmt.category,
        maxScore: assmt.maxScore,
        resourceUrl: assmt.resourceUrl,
      });
    }
  }

  const overdueTasks = tasks.filter((t) => t.status === 'overdue');
  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const waitingReviewTasks = tasks.filter((t) => t.status === 'waiting_review');
  const gradedTasks = tasks.filter((t) => t.status === 'graded');
  const missingTasks = [...overdueTasks, ...pendingTasks];

  const totalRequiredCount = tasks.length + missingManualAssessments.length;
  const completedCount = waitingReviewTasks.length + gradedTasks.length;
  const totalMissingCount = missingTasks.length + missingManualAssessments.length;
  const completionPercent =
    totalRequiredCount > 0 ? Math.round((completedCount / totalRequiredCount) * 100) : 100;

  return {
    tasks,
    missingTasks,
    overdueTasks,
    pendingTasks,
    waitingReviewTasks,
    gradedTasks,
    missingManualAssessments,
    totalRequiredCount,
    completedCount,
    totalMissingCount,
    overdueCount: overdueTasks.length,
    pendingCount: pendingTasks.length,
    waitingReviewCount: waitingReviewTasks.length,
    gradedCount: gradedTasks.length,
    completionPercent,
  };
};

/**
 * ครูรับงานและให้คะแนนหน้าชั้นเรียนทันที (สำหรับนักเรียนที่ทำเสร็จในห้องคอมฯ หรือส่งกระดาษ/ตรวจหน้าเครื่องโดยยังไม่กดส่งเอง)
 */
export const submitTeacherClassroomCheckIn = async (params: {
  assignmentId: string;
  studentId: string;
  studentName: string;
  studentNo: number;
  classroom: string;
  workstationNo?: string;
  scores: { kScore?: number; pScore?: number };
  feedback?: string;
}): Promise<Submission> => {
  const assignment = loadAssignments().find((a) => a.id === params.assignmentId);
  if (!assignment) throw new Error('ไม่พบใบงานนี้');

  const existing = getStudentSubmissionForAssignment(
    params.assignmentId,
    params.studentId,
    params.classroom,
    params.studentNo,
  );

  let targetSubId = existing?.id;
  if (!existing) {
    const portalUrl = buildDirectSubmissionPortalUrl(
      params.assignmentId,
      params.studentId,
      params.workstationNo || 'classroom-checkin',
      'workstation',
    );
    const created: Submission = {
      id: uid(),
      assignmentId: params.assignmentId,
      studentId: params.studentId,
      studentName: params.studentName,
      studentNo: params.studentNo,
      classroom: params.classroom,
      contentUrl: portalUrl,
      workstationNo: params.workstationNo || 'ตรวจรับหน้าชั้นเรียน',
      submissionMethod: 'workstation',
      comment: params.workstationNo
        ? `ส่งงานหน้าชั้นเรียน (${params.workstationNo})`
        : 'ครูตรวจรับผลงานหน้าชั้นเรียนเรียบร้อยแล้ว',
      submittedAt: Date.now(),
    };
    await saveSubmissionRemote(created);
    const list = loadSubmissions().filter((item) => item.id !== created.id);
    cache(SUB_KEY, [created, ...list]);
    targetSubId = created.id;
  }

  await reviewSubmission(
    targetSubId!,
    params.scores,
    params.feedback?.trim() || 'ตรวจรับผลงานหน้าชั้นเรียนเรียบร้อยแล้ว ยอดเยี่ยมมาก!',
  );

  return loadSubmissions().find((s) => s.id === targetSubId)!;
};

/**
 * เชื่อมหรือสร้างใบงานออนไลน์อัตโนมัติจากรายการใบงานในชั้นเรียน (ManualAssessment)
 * เพื่อให้นักเรียนกด "ส่งใบงานนี้ผ่านเว็บ" ได้ทันทีโดยไม่ต้องใช้ Gmail
 */
export const ensureAssignmentForManualAssessment = async (
  classroom: string,
  item: MissingManualAssessmentItem,
): Promise<Assignment> => {
  const allAssignments = loadAssignments();
  const existing = allAssignments.find(
    (a) =>
      a.classroom === classroom &&
      (a.linkedAssessmentId === item.assessmentId ||
        a.linkedKnowledgeAssessmentId === item.assessmentId ||
        a.linkedPracticeAssessmentId === item.assessmentId ||
        (a.title.trim() === item.title.trim() && (a.subject || 'main') === item.subject)),
  );
  if (existing) return existing;

  const isPractice = item.category === 'p';
  const kMax = isPractice ? 0 : item.maxScore;
  const pMax = isPractice ? item.maxScore : 0;
  const dueDate = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const created: Assignment = {
    id: uid(),
    title: item.title,
    description: `ส่งผลงานใบงาน "${item.title}" (${item.indicatorCode}) สามารถแคปภาพหน้าจอ แนบไฟล์จากเครื่องคอมพิวเตอร์ วาดผังงาน หรือระบุหมายเลขเครื่องคอมฯ ได้ทันทีโดยไม่ต้องใช้ Gmail`,
    classroom,
    subject: item.subject,
    dueDate,
    maxScore: item.maxScore,
    knowledgeMaxScore: kMax,
    practiceMaxScore: pMax,
    indicatorId: item.indicatorId,
    category: item.category,
    linkedAssessmentId: item.assessmentId,
    linkedKnowledgeAssessmentId: !isPractice ? item.assessmentId : undefined,
    linkedPracticeAssessmentId: isPractice ? item.assessmentId : undefined,
    resourceUrl: item.resourceUrl,
    createdBy: 'teacher',
    targetType: 'all',
    difficulty: 'standard',
    createdAt: Date.now(),
  };

  await saveAssignmentRemote(created);
  cache(ASS_KEY, [created, ...allAssignments]);
  return created;
};


