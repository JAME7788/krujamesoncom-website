import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface Student {
  id: string;
  name: string;
  classroom: string;
  studentNumber: string;
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
  /** คืน id ของทุกคนที่ active อยู่ตอนนี้ (1 หรือ 2) — ใช้บันทึกคะแนนให้ครบ */
  getActiveIds: () => string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const buildId = (name: string, classroom: string, studentNumber: string) =>
  `${classroom}_${studentNumber}_${name.replace(/\s/g, '')}`;

const PARTNER_KEY = 'current_partner';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Student | null>(null);
  const [partner, setPartner] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedStudent = localStorage.getItem('current_student');
    if (savedStudent) {
      setUser(JSON.parse(savedStudent));
    } else {
      const adminSession = localStorage.getItem('krujames_admin_session_v1');
      if (adminSession) {
        try {
          const parsed = JSON.parse(adminSession);
          if (Date.now() < parsed.expiresAt) {
            setUser({
              id: 'admin_teacher_account',
              name: 'คุณครู (Admin)',
              classroom: 'ป.1',
              studentNumber: '00',
            });
          }
        } catch {}
      }
    }
    const savedPartner = localStorage.getItem(PARTNER_KEY);
    if (savedPartner) setPartner(JSON.parse(savedPartner));
    setLoading(false);
  }, []);

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
    };
    localStorage.setItem('current_student', JSON.stringify(main));
    setUser(main);
    persistStudent(main);

    if (partnerInfo) {
      const p: Student = {
        id: buildId(partnerInfo.name, partnerInfo.classroom, partnerInfo.studentNumber),
        name: partnerInfo.name,
        classroom: partnerInfo.classroom,
        studentNumber: partnerInfo.studentNumber,
      };
      localStorage.setItem(PARTNER_KEY, JSON.stringify(p));
      setPartner(p);
      persistStudent(p);
    } else {
      localStorage.removeItem(PARTNER_KEY);
      setPartner(null);
    }
  };

  const logout = () => {
    localStorage.removeItem('current_student');
    localStorage.removeItem(PARTNER_KEY);
    localStorage.removeItem('krujames_admin_session_v1');
    setUser(null);
    setPartner(null);
    window.location.reload();
  };

  const getActiveIds = (): string[] => {
    const ids: string[] = [];
    if (user) ids.push(user.id);
    if (partner) ids.push(partner.id);
    return ids;
  };

  return (
    <AuthContext.Provider value={{ user, partner, loading, loginAsStudent, logout, getActiveIds }}>
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
