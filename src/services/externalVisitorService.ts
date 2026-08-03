import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { EXTERNAL_USER_PREFIX } from './userAccessService';

export interface ExternalVisitorRecord {
  id: string;
  displayName: string;
  firstSeenAt: number;
  lastSeenAt: number;
  visitCount: number;
  source: 'website-trial';
}

export interface ExternalVisitorReport {
  visitors: ExternalVisitorRecord[];
  totalVisits: number;
  protectedListAvailable: boolean;
}

const COLLECTION = 'externalVisitors';
const STATS_COLLECTION = 'externalVisitorStats';
const STATS_DOCUMENT = 'summary';
const LOCAL_KEY = 'krujames_external_visitors_v1';
const SESSION_KEY = 'krujames_external_visitor_session_v1';

const firebaseAvailable = () => {
  try { return Boolean(db && import.meta.env.VITE_FIREBASE_PROJECT_ID); } catch { return false; }
};

const normalizeName = (name: string) => name.replace(/\s+/g, ' ').trim().slice(0, 100);

const makeSessionId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '');
  }
  return `${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
};

const getSessionId = (): string => {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const created = makeSessionId();
    sessionStorage.setItem(SESSION_KEY, created);
    return created;
  } catch {
    return makeSessionId();
  }
};

const loadLocal = (): ExternalVisitorRecord[] => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) as ExternalVisitorRecord[] : [];
  } catch {
    return [];
  }
};

const saveLocal = (records: ExternalVisitorRecord[]) => {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(records.slice(0, 500))); } catch { /* optional */ }
};

export const recordExternalVisitor = async (
  rawName: string,
): Promise<{ userId: string; visitor: ExternalVisitorRecord }> => {
  const displayName = normalizeName(rawName);
  if (displayName.length < 2) throw new Error('กรุณากรอกชื่ออย่างน้อย 2 ตัวอักษร');

  const sessionId = getSessionId();
  const id = `${EXTERNAL_USER_PREFIX}${sessionId}`;
  const now = Date.now();
  const current = loadLocal().find((item) => item.id === id);
  const visitor: ExternalVisitorRecord = {
    id,
    displayName,
    firstSeenAt: current?.firstSeenAt || now,
    lastSeenAt: now,
    visitCount: (current?.visitCount || 0) + 1,
    source: 'website-trial',
  };
  saveLocal([visitor, ...loadLocal().filter((item) => item.id !== id)]);

  if (firebaseAvailable()) {
    try {
      await Promise.all([
        setDoc(doc(db, COLLECTION, id), {
          id,
          displayName,
          firstSeenAt: visitor.firstSeenAt,
          lastSeenAt: now,
          visitCount: increment(1),
          source: 'website-trial',
        }, { merge: true }),
        setDoc(doc(db, STATS_COLLECTION, STATS_DOCUMENT), {
          totalVisits: increment(1),
          lastVisitAt: now,
          source: 'website-trial',
        }, { merge: true }),
      ]);
    } catch (error) {
      console.warn('external visitor Firebase write failed; local record retained', error);
    }
  }

  return { userId: id, visitor };
};

export const fetchExternalVisitorReport = async (): Promise<ExternalVisitorReport> => {
  let totalVisits = loadLocal().reduce((sum, item) => sum + item.visitCount, 0);
  if (!firebaseAvailable()) {
    return { visitors: loadLocal(), totalVisits, protectedListAvailable: false };
  }

  try {
    const stats = await getDoc(doc(db, STATS_COLLECTION, STATS_DOCUMENT));
    if (stats.exists()) totalVisits = Number(stats.data().totalVisits) || totalVisits;
  } catch (error) {
    console.warn('fetch external visitor stats failed', error);
  }

  try {
    const snapshot = await getDocs(collection(db, COLLECTION));
    const visitors = snapshot.docs
      .map((item) => item.data() as ExternalVisitorRecord)
      .sort((a, b) => b.lastSeenAt - a.lastSeenAt);
    saveLocal(visitors);
    return { visitors, totalVisits, protectedListAvailable: true };
  } catch {
    return { visitors: loadLocal(), totalVisits, protectedListAvailable: false };
  }
};

export const deleteExternalVisitor = async (id: string): Promise<void> => {
  saveLocal(loadLocal().filter((item) => item.id !== id));
  if (firebaseAvailable()) await deleteDoc(doc(db, COLLECTION, id));
};
