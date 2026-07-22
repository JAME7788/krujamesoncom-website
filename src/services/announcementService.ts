// ระบบประกาศข่าวกลาง: Firestore เป็นข้อมูลจริงและ localStorage เป็น cache
import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  emoji?: string;
  type: 'info' | 'warn' | 'urgent' | 'celebration';
  classroom?: string;
  createdAt: number;
  expiresAt?: number;
  pinned?: boolean;
}

const KEY = 'krujames_announcements_v1';
const COLLECTION = 'announcements';
const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const loadAnnouncements = (): Announcement[] => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) as Announcement[] : [];
  } catch { return []; }
};

const cache = (list: Announcement[]) => {
  localStorage.setItem(KEY, JSON.stringify(list));
};

const clean = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export const fetchAnnouncementsFromFirebase = async (): Promise<Announcement[]> => {
  try {
    const snap = await getDocs(collection(db, COLLECTION));
    const remote = snap.docs.map((item) => item.data() as Announcement);
    if (remote.length > 0) {
      const sorted = remote.sort((a, b) => b.createdAt - a.createdAt);
      cache(sorted);
      return sorted;
    }
    const local = loadAnnouncements();
    await Promise.all(local.map((item) => setDoc(doc(db, COLLECTION, item.id), clean(item))));
    return local;
  } catch (error) {
    console.warn('fetch announcements failed, using local cache', error);
    return loadAnnouncements();
  }
};

export const createAnnouncement = async (
  data: Omit<Announcement, 'id' | 'createdAt'>,
): Promise<Announcement> => {
  const announcement: Announcement = { ...data, id: uid(), createdAt: Date.now() };
  await setDoc(doc(db, COLLECTION, announcement.id), clean(announcement));
  cache([announcement, ...loadAnnouncements()]);
  return announcement;
};

export const updateAnnouncement = async (id: string, patch: Partial<Announcement>): Promise<void> => {
  const list = loadAnnouncements();
  const index = list.findIndex((item) => item.id === id);
  if (index === -1) return;
  const updated = { ...list[index], ...patch };
  await setDoc(doc(db, COLLECTION, id), clean(updated));
  list[index] = updated;
  cache(list);
};

export const deleteAnnouncement = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTION, id));
  cache(loadAnnouncements().filter((item) => item.id !== id));
};

export const getActiveAnnouncements = (classroom?: string): Announcement[] => {
  const now = Date.now();
  return loadAnnouncements()
    .filter((item) => !item.expiresAt || item.expiresAt > now)
    .filter((item) => !item.classroom || !classroom || item.classroom === classroom)
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.createdAt - a.createdAt;
    });
};
