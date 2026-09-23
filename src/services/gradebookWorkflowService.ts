import type { GradingPeriod } from './gradingPeriodService';
import { getActiveGradingPeriod, gradingPeriodKey } from './gradingPeriodService';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { requireTeacherGradeAccess } from './teacherGradeAccess';
import { PersistentSaveQueue } from './persistentSaveQueue';

export type GradebookWorkflowState = 'draft' | 'review' | 'finalized';

export interface GradebookWorkflow {
  state: GradebookWorkflowState;
  period: GradingPeriod;
  classroom: string;
  subject: string;
  updatedAt: number;
  finalizedAt?: number;
  reopenedAt?: number;
  reopenReason?: string;
  policyVersion?: string;
  snapshot?: unknown;
  history?: Array<{
    state: 'finalized' | 'reopened';
    at: number;
    policyVersion?: string;
    reason?: string;
    snapshot?: unknown;
  }>;
}

const PREFIX = 'krujames_gradebook_workflow_v1_';
const key = (classroom: string, subject: string, period = getActiveGradingPeriod()) => (
  `${PREFIX}${gradingPeriodKey(period)}_${classroom}_${subject}`
);

export const loadGradebookWorkflow = (
  classroom: string,
  subject: string,
  period = getActiveGradingPeriod(),
): GradebookWorkflow => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key(classroom, subject, period)) || 'null') as GradebookWorkflow | null;
    if (parsed?.classroom === classroom && parsed.subject === subject) return parsed;
  } catch {
    // A damaged workflow record must not hide the current gradebook.
  }
  return { state: 'draft', period, classroom, subject, updatedAt: 0 };
};

export const cacheGradebookWorkflow = (workflow: GradebookWorkflow): GradebookWorkflow => {
  localStorage.setItem(key(workflow.classroom, workflow.subject, workflow.period), JSON.stringify(workflow));
  return workflow;
};

export const markGradebookForReview = (classroom: string, subject: string): GradebookWorkflow => cacheGradebookWorkflow({
  ...loadGradebookWorkflow(classroom, subject),
  state: 'review',
  updatedAt: Date.now(),
});

export const finalizeGradebook = (
  classroom: string,
  subject: string,
  snapshot: unknown,
  policyVersion: string,
): GradebookWorkflow => {
  const now = Date.now();
  const current = loadGradebookWorkflow(classroom, subject);
  const history = [...(current.history || []), {
    state: 'finalized' as const,
    at: now,
    policyVersion,
    snapshot,
  }];
  return cacheGradebookWorkflow({
    ...current,
    state: 'finalized',
    snapshot,
    policyVersion,
    finalizedAt: now,
    updatedAt: now,
    history,
  });
};

export const reopenGradebook = (classroom: string, subject: string, reason: string): GradebookWorkflow => {
  const current = loadGradebookWorkflow(classroom, subject);
  const now = Date.now();
  return cacheGradebookWorkflow({
    ...current,
    state: 'draft',
    snapshot: current.snapshot,
    reopenedAt: now,
    reopenReason: reason.trim(),
    updatedAt: now,
    history: [...(current.history || []), { state: 'reopened', at: now, reason: reason.trim() }],
  });
};

const cloudId = (workflow: Pick<GradebookWorkflow, 'period' | 'classroom' | 'subject'>): string => (
  `${gradingPeriodKey(workflow.period)}_${workflow.classroom}_${workflow.subject}`
    .replace(/[^0-9A-Za-zก-๙._-]/g, '_')
);

const firebaseAvailable = (): boolean => {
  try { return Boolean(db && import.meta.env.VITE_FIREBASE_PROJECT_ID); } catch { return false; }
};

const writeWorkflowToCloud = async (workflow: GradebookWorkflow): Promise<void> => {
  if (!firebaseAvailable()) throw new Error('ยังไม่ได้เชื่อมต่อ Firebase');
  await requireTeacherGradeAccess();
  await setDoc(doc(db, 'gradeClosures', cloudId(workflow)), JSON.parse(JSON.stringify(workflow)), { merge: false });
};

let cloudQueue: PersistentSaveQueue<GradebookWorkflow> | undefined;
let queueStorage: Storage | undefined;
const getCloudQueue = () => {
  if (!cloudQueue || queueStorage !== localStorage) {
    queueStorage = localStorage;
    cloudQueue = new PersistentSaveQueue(localStorage, 'krujames_gradebook_workflow_outbox_v1', writeWorkflowToCloud);
  }
  return cloudQueue;
};

export const queueGradebookWorkflowCloudSync = (workflow: GradebookWorkflow): void => {
  const scope = `${gradingPeriodKey(workflow.period)}_${workflow.classroom}_${workflow.subject}`;
  getCloudQueue().enqueue(cloudId(workflow), scope, workflow);
};

export const getGradebookWorkflowCloudStatus = (classroom: string, subject: string) => (
  getCloudQueue().status(`${gradingPeriodKey()}_${classroom}_${subject}`)
);

export const subscribeGradebookWorkflowCloudStatus = (listener: () => void) => getCloudQueue().subscribe(listener);
export const retryGradebookWorkflowCloudSync = () => getCloudQueue().retry();

export const fetchGradebookWorkflowFromCloud = async (
  classroom: string,
  subject: string,
  period = getActiveGradingPeriod(),
): Promise<GradebookWorkflow | null> => {
  if (!firebaseAvailable()) return null;
  await requireTeacherGradeAccess();
  const snapshot = await getDoc(doc(db, 'gradeClosures', cloudId({ classroom, subject, period })));
  if (!snapshot.exists()) return null;
  const remote = snapshot.data() as GradebookWorkflow;
  if (remote.classroom !== classroom || remote.subject !== subject || gradingPeriodKey(remote.period) !== gradingPeriodKey(period)) return null;
  const local = loadGradebookWorkflow(classroom, subject, period);
  return cacheGradebookWorkflow(remote.updatedAt >= local.updatedAt ? remote : local);
};
