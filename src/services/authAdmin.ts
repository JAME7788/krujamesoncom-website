// Admin authentication — แยกจาก student login
//
// ⚠️ ข้อจำกัดด้านความปลอดภัย: การตรวจรหัสฝั่ง client (browser) ไม่ใช่กำแพงจริง
// ค่านี้ถูกฝังใน JS bundle เสมอ ใครเปิด DevTools ก็อ่านได้ → ถือเป็นแค่ "กันคนทั่วไป"
// การป้องกันข้อมูลจริงอยู่ที่ Firestore App Check + Rules (ดู SECURITY.md)
//
// ตั้งค่าผ่าน .env ได้ (VITE_ADMIN_USER / VITE_ADMIN_PASS) เพื่อเปลี่ยนรหัส
// โดยไม่ต้องแก้ซอร์ส และไม่ให้รหัสค้างอยู่ในประวัติ git ของซอร์ส
const ADMIN_USER = import.meta.env.VITE_ADMIN_USER || 'jameskmd';
const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASS || '12345678kmd';
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
    } catch (e) {
      console.error('Failed to set admin session', e);
    }
    return true;
  }
  return false;
};

export const adminLogout = () => {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (e) {
    console.error('Failed to remove admin session', e);
  }
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
