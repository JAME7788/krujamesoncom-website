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

export type TeacherRole = 'admin' | 'teacher' | 'viewer';

export interface AdminSession {
  user: string;
  loginAt: number;
  expiresAt: number;
  uid?: string;
  email?: string;
  role?: TeacherRole;
  authSource?: 'firebase' | 'legacy';
}

export const adminLogin = (user: string, pass: string): boolean => {
  if (user.trim() === ADMIN_USER && pass === ADMIN_PASS) {
    const session: AdminSession = {
      user,
      loginAt: Date.now(),
      expiresAt: Date.now() + SESSION_TTL_MS,
      role: 'admin',
      authSource: 'legacy',
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
  void import('firebase/auth')
    .then(async ({ getAuth, signOut }) => {
      const { default: app } = await import('./firebase');
      const auth = getAuth(app);
      if (auth.currentUser) await signOut(auth);
    })
    .catch(() => undefined);
};

const storeSession = (session: AdminSession) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const firebaseTeacherLogin = async (
  identifier: string,
  password: string,
): Promise<AdminSession | null> => {
  const configuredEmail = import.meta.env.VITE_TEACHER_AUTH_EMAIL;
  const email = identifier.includes('@') ? identifier.trim() : configuredEmail;
  if (!email || !import.meta.env.VITE_FIREBASE_API_KEY) return null;

  try {
    const [
      { getAuth, signInWithEmailAndPassword },
      { doc, getDoc },
      { default: app, db },
    ] = await Promise.all([
      import('firebase/auth'),
      import('firebase/firestore'),
      import('./firebase'),
    ]);
    const credential = await signInWithEmailAndPassword(getAuth(app), email, password);
    const profileSnapshot = await getDoc(doc(db, 'teacherProfiles', credential.user.uid));
    const profile = profileSnapshot.exists()
      ? profileSnapshot.data() as { displayName?: string; role?: TeacherRole; active?: boolean }
      : {};
    const token = await credential.user.getIdTokenResult();
    const claimedRole = (
      token.claims.role === 'admin'
      || token.claims.role === 'teacher'
      || token.claims.role === 'viewer'
    ) ? token.claims.role as TeacherRole : undefined;
    if (!profileSnapshot.exists() && !claimedRole) {
      await import('firebase/auth').then(({ signOut }) => signOut(getAuth(app)));
      throw new Error('บัญชีนี้ยังไม่ได้รับสิทธิ์ครู');
    }
    if (profile.active === false) {
      await import('firebase/auth').then(({ signOut }) => signOut(getAuth(app)));
      throw new Error('บัญชีครูถูกระงับการใช้งาน');
    }
    const session: AdminSession = {
      user: profile.displayName || credential.user.displayName || credential.user.email || 'teacher',
      uid: credential.user.uid,
      email: credential.user.email || email,
      role: profile.role || claimedRole || 'viewer',
      authSource: 'firebase',
      loginAt: Date.now(),
      expiresAt: Date.now() + SESSION_TTL_MS,
    };
    storeSession(session);
    return session;
  } catch (error) {
    console.warn('Firebase teacher login failed', error);
    return null;
  }
};

export const adminLoginSecure = async (
  identifier: string,
  password: string,
): Promise<AdminSession | null> => {
  const firebaseSession = await firebaseTeacherLogin(identifier, password);
  if (firebaseSession) return firebaseSession;
  return adminLogin(identifier, password) ? getAdminSession() : null;
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
