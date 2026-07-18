// ระบบ Notification — Browser Push API + In-app notifications

export interface InAppNotification {
  id: string;
  title: string;
  body: string;
  emoji?: string;
  type: 'info' | 'success' | 'warning' | 'reminder';
  url?: string;
  read: boolean;
  createdAt: number;
}

const KEY = (userId: string) => `krujames_notifications_${userId}`;
const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

export const requestPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return await Notification.requestPermission();
};

export const showBrowserNotification = (title: string, options?: NotificationOptions) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    new Notification(title, {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      ...options,
    });
  } catch { /* ignore notification display errors */ }
};

// In-app notifications
export const addNotification = (userId: string, n: Omit<InAppNotification, 'id' | 'read' | 'createdAt'>): InAppNotification => {
  const notif: InAppNotification = { ...n, id: uid(), read: false, createdAt: Date.now() };
  const list = loadNotifications(userId);
  list.unshift(notif);
  // เก็บแค่ 50 ล่าสุด
  if (list.length > 50) list.length = 50;
  try { localStorage.setItem(KEY(userId), JSON.stringify(list)); } catch { /* ignore localStorage write errors */ }
  return notif;
};

export const loadNotifications = (userId: string): InAppNotification[] => {
  try {
    const raw = localStorage.getItem(KEY(userId));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

export const markAllRead = (userId: string) => {
  const list = loadNotifications(userId).map((n) => ({ ...n, read: true }));
  try { localStorage.setItem(KEY(userId), JSON.stringify(list)); } catch { /* ignore localStorage write errors */ }
};

export const deleteNotification = (userId: string, id: string) => {
  const list = loadNotifications(userId).filter((n) => n.id !== id);
  try { localStorage.setItem(KEY(userId), JSON.stringify(list)); } catch { /* ignore localStorage write errors */ }
};

export const getUnreadCount = (userId: string): number => {
  return loadNotifications(userId).filter((n) => !n.read).length;
};
