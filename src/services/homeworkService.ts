// ระบบการบ้านกลาง: localStorage เป็น cache และ Firebase เป็นแหล่งข้อมูลจริงร่วมกันทุกเครื่อง
import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import {
  createManualAssessment,
  updateManualAssessmentScore,
  applyManualAssessmentsToGrades,
  loadGrades,
  computeTotal,
  deleteManualAssessment,
} from './gradeService';
import type { Subject, AssessmentCategory } from './gradeService';
import { loadRoster } from './rosterService';
import { recordLearningEvidence } from './learningEvidenceService';
import { writeAuditLog } from './auditLogService';

export type AssignmentDifficulty = 'foundation' | 'standard' | 'advanced';
export type AssignmentTargetType = 'all' | 'ability_tier' | 'specific_students';
export type AbilityTier = 'intervention' | 'developing' | 'proficient' | 'advanced';

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
  /** รองรับข้อมูลเก่าที่เคยเก็บในเครื่อง แต่ข้อมูลใหม่อัปโหลดไฟล์ไป Storage */
  contentData?: string;
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
  if (!firebaseAvailable()) return;
  await setDoc(doc(db, ASS_COLLECTION, assignment.id), cleanForFirestore(assignment));
};

const saveSubmissionRemote = async (submission: Submission) => {
  if (!firebaseAvailable()) return;
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

/** ตรวจสอบความสมบูรณ์ของเนื้อหางานก่อนส่ง (ป้องกันลิงก์ปลอมและข้อความพิมพ์เล่น) */
export const validateSubmissionContent = (data: {
  contentUrl?: string;
  comment?: string;
  isDesignThinking?: boolean;
  dtDefine?: string;
  dtIdeate?: string;
  dtPrototypeUrl?: string;
}): { valid: boolean; error?: string } => {
  const url = data.contentUrl?.trim();
  const comment = data.comment?.trim();

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

  // ถ้ามีการกรอกลิงก์มา ต้องตรวจความถูกต้องของโดเมน
  if (url && !isValidSubmissionUrl(url)) {
    return {
      valid: false,
      error: '❌ ลิงก์ผลงานไม่ถูกต้อง: กรุณาใส่ URL เว็บไซต์จริง (เช่น https://www.canva.com/... หรือ https://scratch.mit.edu/...) ไม่สามารถใส่ข้อความทั่วไปได้ครับ',
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

  // กรณีไม่มีลิงก์ ส่งเฉพาะข้อความตอบคำถาม
  if (!url) {
    if (comment && isSpamText(comment)) {
      return {
        valid: false,
        error: '❌ ข้อความไม่ถูกต้อง: กรุณาพิมพ์คำตอบหรืออธิบายงานจริง ไม่พิมพ์ตัวอักษรซ้ำหรือพิมพ์เล่นครับ',
      };
    }
    if (!comment || comment.length < 10) {
      return {
        valid: false,
        error: '❌ ข้อความสั้นเกินไป: กรุณาพิมพ์คำตอบหรืออธิบายผลงานอย่างน้อย 10 ตัวอักษร',
      };
    }
  }

  // กรณีมีลิงก์และมีข้อความด้วย แต่ข้อความเป็นสแปม
  if (comment && isSpamText(comment)) {
    return {
      valid: false,
      error: '❌ ข้อความคำอธิบายไม่ถูกต้อง: ไม่พิมพ์ตัวอักษรซ้ำหรือพิมพ์เล่นครับ',
    };
  }

  if (!url && !comment) {
    return {
      valid: false,
      error: '❌ กรุณาแนบลิงก์ผลงาน หรือพิมพ์คำตอบ/คำอธิบายผลงาน',
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

  if (data.contentUrl?.trim() && !isValidSubmissionUrl(data.contentUrl)) {
    throw new Error('ลิงก์ผลงานไม่ถูกต้อง กรุณาใส่ URL เว็บไซต์จริง เช่น Canva หรือ Scratch');
  }
  if (data.designThinkingSteps?.prototypeUrl?.trim() && !isValidSubmissionUrl(data.designThinkingSteps.prototypeUrl)) {
    throw new Error('ลิงก์ผลงานต้นแบบไม่ถูกต้อง กรุณาใส่ URL เว็บไซต์จริง');
  }
  if (!data.contentUrl?.trim() && !data.comment?.trim() && !data.designThinkingSteps) {
    throw new Error('กรุณาระบุลิงก์ผลงานหรือคำตอบของงาน');
  }

  const normalizedContentUrl = normalizeHomeworkUrl(data.contentUrl);
  const normalizedDtSteps = data.designThinkingSteps ? {
    ...data.designThinkingSteps,
    prototypeUrl: normalizeHomeworkUrl(data.designThinkingSteps.prototypeUrl),
  } : undefined;

  const submission: Submission = {
    ...data,
    contentUrl: normalizedContentUrl || undefined,
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
): Submission | null => (
  loadSubmissions().find((submission) => (
    submission.assignmentId === assignmentId && submission.studentId === studentId
  )) || null
);
