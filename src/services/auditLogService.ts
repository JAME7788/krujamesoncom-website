import { collection, doc, getDocs, limit, orderBy, query, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { getAdminSession } from './authAdmin';

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'publish'
  | 'restore'
  | 'score'
  | 'attendance'
  | 'session';

export interface AuditLogEntry {
  id: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  classroom?: string;
  subject?: string;
  summary: string;
  before?: unknown;
  after?: unknown;
  actor: string;
  createdAt: number;
}

const COLLECTION = 'teacherAuditLogs';
const LOCAL_KEY = 'krujames_teacher_audit_logs_v1';
const MAX_LOCAL_RECORDS = 500;

const firebaseAvailable = () => {
  try { return Boolean(db && import.meta.env.VITE_FIREBASE_PROJECT_ID); } catch { return false; }
};

const clean = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export const loadAuditLogs = (): AuditLogEntry[] => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) as AuditLogEntry[] : [];
  } catch {
    return [];
  }
};

const cacheAuditLogs = (items: AuditLogEntry[]) => {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(items.slice(0, MAX_LOCAL_RECORDS)));
  } catch {
    // Audit cache is optional. Firebase remains the shared source.
  }
};

export const writeAuditLog = async (
  input: Omit<AuditLogEntry, 'id' | 'actor' | 'createdAt'>,
): Promise<AuditLogEntry> => {
  const createdAt = Date.now();
  const actor = getAdminSession()?.user || 'teacher';
  const id = `${createdAt}_${Math.random().toString(36).slice(2, 10)}`;
  const entry: AuditLogEntry = clean({ ...input, id, actor, createdAt });
  cacheAuditLogs([entry, ...loadAuditLogs()]);
  if (firebaseAvailable()) {
    try {
      await setDoc(doc(db, COLLECTION, id), entry);
    } catch (error) {
      console.warn('audit log Firebase write failed; local audit retained', error);
    }
  }
  return entry;
};

export const fetchAuditLogs = async (maxItems = 200): Promise<AuditLogEntry[]> => {
  if (!firebaseAvailable()) return loadAuditLogs().slice(0, maxItems);
  try {
    const snapshot = await getDocs(
      query(collection(db, COLLECTION), orderBy('createdAt', 'desc'), limit(maxItems)),
    );
    const items = snapshot.docs.map((item) => item.data() as AuditLogEntry);
    cacheAuditLogs(items);
    return items;
  } catch (error) {
    console.warn('fetch audit logs failed, using local cache', error);
    return loadAuditLogs().slice(0, maxItems);
  }
};
