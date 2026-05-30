// ระบบประกาศข่าว — ครูประกาศใน Admin → นักเรียนเห็นบน Home/Dashboard

export interface Announcement {
  id: string;
  title: string;
  body: string;
  emoji?: string;
  type: 'info' | 'warn' | 'urgent' | 'celebration';
  /** target classroom — '' = ทุกห้อง */
  classroom?: string;
  createdAt: number;
  expiresAt?: number;
  pinned?: boolean;
}

const KEY = 'krujames_announcements_v1';

const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const loadAnnouncements = (): Announcement[] => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const save = (list: Announcement[]) => {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {}
};

export const createAnnouncement = (data: Omit<Announcement, 'id' | 'createdAt'>): Announcement => {
  const a: Announcement = { ...data, id: uid(), createdAt: Date.now() };
  const list = loadAnnouncements();
  list.unshift(a);
  save(list);
  return a;
};

export const updateAnnouncement = (id: string, patch: Partial<Announcement>) => {
  const list = loadAnnouncements();
  const i = list.findIndex((a) => a.id === id);
  if (i === -1) return;
  list[i] = { ...list[i], ...patch };
  save(list);
};

export const deleteAnnouncement = (id: string) => {
  save(loadAnnouncements().filter((a) => a.id !== id));
};

/** ดึงประกาศที่ active สำหรับห้องที่ระบุ */
export const getActiveAnnouncements = (classroom?: string): Announcement[] => {
  const now = Date.now();
  return loadAnnouncements()
    .filter((a) => !a.expiresAt || a.expiresAt > now)
    .filter((a) => !a.classroom || !classroom || a.classroom === classroom)
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.createdAt - a.createdAt;
    });
};
