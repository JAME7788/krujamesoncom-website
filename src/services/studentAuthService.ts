import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import app from './firebase';

const STUDENT_EMAIL_DOMAIN = 'students.krujames.com';

export const studentEmailFromCode = (studentCode: string) => (
  `student.${studentCode.trim().toLowerCase()}@${STUDENT_EMAIL_DOMAIN}`
);

export const isStudentFirebaseAuthRequired = () => (
  import.meta.env.MODE !== 'test'
  && Boolean(import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID)
);

export const signInStudentAccount = async (
  studentCode: string,
  expectedStudentId: string,
  pin: string,
): Promise<void> => {
  if (!isStudentFirebaseAuthRequired()) return;
  if (!/^\d{6}$/.test(pin)) throw new Error('กรุณากรอกรหัส PIN นักเรียน 6 หลัก');

  const auth = getAuth(app);
  const credential = await signInWithEmailAndPassword(
    auth,
    studentEmailFromCode(studentCode),
    pin,
  );
  const token = await credential.user.getIdTokenResult(true);
  if (token.claims.role !== 'student' || token.claims.studentId !== expectedStudentId) {
    await signOut(auth);
    throw new Error('บัญชีนี้ไม่ตรงกับรายชื่อนักเรียนที่เลือก');
  }
};

export const signOutStudentAccount = async (): Promise<void> => {
  try {
    const auth = getAuth(app);
    if (auth.currentUser) await signOut(auth);
  } catch {
    // Session storage is still cleared by AuthContext.
  }
};
