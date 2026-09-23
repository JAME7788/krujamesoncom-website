import { doc, getDoc } from 'firebase/firestore';
import app, { db } from './firebase';

/** Client feedback only. Firestore Rules remain the actual authorization boundary. */
export async function requireTeacherGradeAccess(): Promise<void> {
  const { getAuth } = await import('firebase/auth');
  const auth = getAuth(app);
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) throw new Error('กรุณาเข้าสู่ระบบครูด้วยบัญชี Firebase ก่อนส่งคะแนน');
  const token = await user.getIdTokenResult();
  if (token.claims.role === 'teacher' || token.claims.role === 'admin') return;
  const snapshot = await getDoc(doc(db, 'teacherProfiles', user.uid));
  const profile = snapshot.data();
  if (profile?.active === true && (profile.role === 'teacher' || profile.role === 'admin')) return;
  throw new Error('บัญชีนี้ไม่มีสิทธิ์บันทึกคะแนนครู');
}
