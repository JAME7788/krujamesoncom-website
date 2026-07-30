import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import type { Subject } from './gradeService';

export type EvidenceDomain = 'K' | 'P' | 'A';
export type EvidenceSource =
  | 'attendance'
  | 'game'
  | 'quiz'
  | 'homework'
  | 'worksheet'
  | 'web'
  | 'teacher'
  | 'live-quiz'
  | 'project';

export interface LearningEvidence {
  id: string;
  studentId: string;
  studentCode?: string;
  studentName: string;
  classroom: string;
  subject: Subject;
  indicatorId?: string;
  indicatorCode?: string;
  lessonPlanId?: string;
  sessionId?: string;
  source: EvidenceSource;
  domain: EvidenceDomain;
  title: string;
  detail?: string;
  score?: number;
  maxScore?: number;
  inClass: boolean;
  occurredAt: number;
  createdAt: number;
  dedupKey?: string;
}

const COLLECTION = 'learningEvidence';
const LOCAL_KEY = 'krujames_learning_evidence_v1';
const MAX_LOCAL_RECORDS = 1500;

const firebaseAvailable = () => {
  try { return Boolean(db && import.meta.env.VITE_FIREBASE_PROJECT_ID); } catch { return false; }
};

const clean = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export const loadLearningEvidence = (): LearningEvidence[] => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) as LearningEvidence[] : [];
  } catch {
    return [];
  }
};

const cacheEvidence = (items: LearningEvidence[]) => {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(items.slice(0, MAX_LOCAL_RECORDS)));
  } catch {
    // Local cache is optional.
  }
};

export const makeEvidenceId = (
  input: Pick<LearningEvidence, 'studentId' | 'source' | 'domain' | 'occurredAt'> & {
    dedupKey?: string;
  },
) => {
  const stable = input.dedupKey || String(input.occurredAt);
  return `${input.studentId}_${input.source}_${input.domain}_${stable}`
    .replace(/[^a-zA-Z0-9ก-๙_-]+/g, '-')
    .slice(0, 240);
};

export const recordLearningEvidence = async (
  input: Omit<LearningEvidence, 'id' | 'createdAt'>,
): Promise<LearningEvidence> => {
  const id = makeEvidenceId(input);
  const evidence: LearningEvidence = clean({
    ...input,
    id,
    createdAt: Date.now(),
  });
  const local = loadLearningEvidence();
  cacheEvidence([evidence, ...local.filter((item) => item.id !== id)]);
  if (firebaseAvailable()) {
    await setDoc(doc(db, COLLECTION, id), evidence, { merge: true });
  }
  return evidence;
};

export const fetchLearningEvidence = async (
  classroom: string,
  subject: Subject = 'main',
): Promise<LearningEvidence[]> => {
  if (!firebaseAvailable()) {
    return loadLearningEvidence().filter((item) => (
      item.classroom === classroom && item.subject === subject
    ));
  }
  try {
    const snapshot = await getDocs(query(
      collection(db, COLLECTION),
      where('classroom', '==', classroom),
      where('subject', '==', subject),
    ));
    const remote = snapshot.docs
      .map((item) => item.data() as LearningEvidence)
      .sort((a, b) => b.occurredAt - a.occurredAt);
    const otherLocal = loadLearningEvidence().filter((item) => (
      item.classroom !== classroom || item.subject !== subject
    ));
    cacheEvidence([...remote, ...otherLocal]);
    return remote;
  } catch (error) {
    console.warn('fetch learning evidence failed, using local cache', error);
    return loadLearningEvidence().filter((item) => (
      item.classroom === classroom && item.subject === subject
    ));
  }
};
