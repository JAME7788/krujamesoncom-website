// Admin authentication — แยกจาก student login
// Hardcoded credentials (สำหรับครูเจ้าของเว็บ)

const ADMIN_USER = 'jameskmd';
const ADMIN_PASS = '12345678kmd';
const SESSION_KEY = 'krujames_admin_session_v1';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 ชั่วโมง

export interface AdminSession {
  user: string;
  loginAt: number;
  expiresAt: number;
}

export const adminLogin = (user: string, pass: string): boolean => {
  if (user.trim() === ADMIN_USER && pass === ADMIN_PASS) {
    const session: AdminSession = {
      user,
      loginAt: Date.now(),
      expiresAt: Date.now() + SESSION_TTL_MS,
    };
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {}
    return true;
  }
  return false;
};

export const adminLogout = () => {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {}
};

export const getAdminSession = (): AdminSession | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s: AdminSession = JSON.parse(raw);
    if (Date.now() > s.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
};

export const isAdminAuthed = (): boolean => !!getAdminSession();
