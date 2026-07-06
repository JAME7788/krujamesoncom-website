/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface Student {
  id: string;
  name: string;
  classroom: string;
  studentNumber: string;
  loginTime?: number;
}

interface AuthContextType {
  user: Student | null;
  partner: Student | null;          // เพื่อนร่วมเครื่อง (โหมดนั่งคู่)
  loading: boolean;
  loginAsStudent: (
    name: string,
    classroom: string,
    studentNumber: string,
    partner?: { name: string; classroom: string; studentNumber: string }
  ) => Promise<void>;
  logout: () => void;
  clearStudentSession: () => void;
  /** คืน id ของทุกคนที่ active อยู่ตอนนี้ (1 หรือ 2) — ใช้บันทึกคะแนนให้ครบ */
  getActiveIds: () => string[];
  persistStudent: (s: Student) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const buildId = (name: string, classroom: string, studentNumber: string) =>
  `${classroom}_${studentNumber}_${name.replace(/\s/g, '')}`;

const STUDENT_KEY = 'current_student';
const PARTNER_KEY = 'current_partner';
const STUDENT_SESSION_MS = 45 * 60 * 1000;

const getSessionItem = (key: string) => {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

const setSessionItem = (key: string, value: string) => {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    localStorage.setItem(key, value);
  }
};

const removeStudentSessionStorage = () => {
  try {
    sessionStorage.removeItem(STUDENT_KEY);
    sessionStorage.removeItem(PARTNER_KEY);
  } catch {
    // ignore
  }
  localStorage.removeItem(STUDENT_KEY);
  localStorage.removeItem(PARTNER_KEY);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Student | null>(() => {
    const legacyStudent = localStorage.getItem(STUDENT_KEY);
    if (legacyStudent) {
      localStorage.removeItem(STUDENT_KEY);
      localStorage.removeItem(PARTNER_KEY);
    }

    const savedStudent = getSessionItem(STUDENT_KEY);
    if (savedStudent) {
      try {
        const parsed = JSON.parse(savedStudent);
        if (parsed.loginTime && Date.now() - parsed.loginTime > STUDENT_SESSION_MS) {
          removeStudentSessionStorage();
          return null;
        }
        return parsed;
      } catch (e) {
        console.error('Failed to parse current student', e);
      }
    }
    const adminSession = localStorage.getItem('krujames_admin_session_v1');
    if (adminSession) {
      try {
        const parsed = JSON.parse(adminSession);
        if (Date.now() < parsed.expiresAt) {
          return {
            id: 'admin_teacher_account',
            name: 'คุณครู (Admin)',
            classroom: 'ป.1',
            studentNumber: '00',
          };
        }
      } catch (e) {
        console.error('Failed to parse admin session', e);
      }
    }
    return null;
  });

  const [partner, setPartner] = useState<Student | null>(() => {
    const savedPartner = getSessionItem(PARTNER_KEY);
    if (savedPartner) {
      try {
        const parsed = JSON.parse(savedPartner);
        if (parsed.loginTime && Date.now() - parsed.loginTime > STUDENT_SESSION_MS) {
          removeStudentSessionStorage();
          return null;
        }
        return parsed;
      } catch (e) {
        console.error('Failed to parse partner', e);
      }
    }
    return null;
  });

  const [loading] = useState(false);

  const persistStudent = async (s: Student) => {
    try {
      const ref = doc(db, 'students', s.id);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, { ...s, createdAt: new Date() });
      }
    } catch (e) {
      console.warn('Firebase persist student failed (ignored)', e);
    }
  };

  const loginAsStudent = async (
    name: string,
    classroom: string,
    studentNumber: string,
    partnerInfo?: { name: string; classroom: string; studentNumber: string }
  ) => {
    const main: Student = {
      id: buildId(name, classroom, studentNumber),
      name,
      classroom,
      studentNumber,
      loginTime: Date.now(),
    };
    removeStudentSessionStorage();
    setSessionItem(STUDENT_KEY, JSON.stringify(main));
    setUser(main);
    persistStudent(main);
    // นับ login เป็นกิจกรรม → เช็คชื่อตามตารางเห็นเวลาเข้าเรียนจริง (ไม่ตีเป็นขาด/สาย)
    void import('../services/progressService').then(({ trackLogin }) => trackLogin(main.id));

    if (partnerInfo) {
      const p: Student = {
        id: buildId(partnerInfo.name, partnerInfo.classroom, partnerInfo.studentNumber),
        name: partnerInfo.name,
        classroom: partnerInfo.classroom,
        studentNumber: partnerInfo.studentNumber,
        loginTime: Date.now(),
      };
      setSessionItem(PARTNER_KEY, JSON.stringify(p));
      setPartner(p);
      persistStudent(p);
      void import('../services/progressService').then(({ trackLogin }) => trackLogin(p.id));
    } else {
      try {
        sessionStorage.removeItem(PARTNER_KEY);
      } catch {
        // ignore
      }
      localStorage.removeItem(PARTNER_KEY);
      setPartner(null);
    }
  };

  const clearStudentSession = () => {
    removeStudentSessionStorage();
    setUser(null);
    setPartner(null);
  };

  const logout = () => {
    removeStudentSessionStorage();
    localStorage.removeItem('krujames_admin_session_v1');
    setUser(null);
    setPartner(null);
    window.location.reload();
  };

  useEffect(() => {
    if (!user || user.id === 'admin_teacher_account') return;

    const checkSession = () => {
      const savedStudent = getSessionItem(STUDENT_KEY);
      if (savedStudent) {
        try {
          const parsed = JSON.parse(savedStudent);
          if (parsed.loginTime && Date.now() - parsed.loginTime > STUDENT_SESSION_MS) {
            alert('เซสชันการเรียนหมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่');
            logout();
          }
        } catch (e) {
          console.error('Error checking student session expiration', e);
        }
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const getActiveIds = (): string[] => {
    const ids: string[] = [];
    if (user) ids.push(user.id);
    if (partner) ids.push(partner.id);
    return ids;
  };

  return (
    <AuthContext.Provider value={{ user, partner, loading, loginAsStudent, logout, clearStudentSession, getActiveIds, persistStudent }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
