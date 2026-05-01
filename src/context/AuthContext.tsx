import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface Student {
  id: string; // สร้างจาก ชื่อ+เลขที่
  name: string;
  classroom: string;
  studentNumber: string;
}

interface AuthContextType {
  user: Student | null;
  loading: boolean;
  loginAsStudent: (name: string, classroom: string, studentNumber: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // เช็คว่าเคยล็อคอินไว้ในเครื่องนี้ไหม
    const savedStudent = localStorage.getItem('current_student');
    if (savedStudent) {
      setUser(JSON.parse(savedStudent));
    }
    setLoading(false);
  }, []);

  const loginAsStudent = async (name: string, classroom: string, studentNumber: string) => {
    const studentId = `${classroom}_${studentNumber}_${name.replace(/\s/g, '')}`;
    const studentData: Student = {
      id: studentId,
      name,
      classroom,
      studentNumber
    };

    // บันทึกข้อมูลนักเรียนลง Firestore (แยกบัญชี Gmail ใหม่ของคุณ)
    try {
      const studentDocRef = doc(db, 'students', studentId);
      const studentDoc = await getDoc(studentDocRef);
      
      if (!studentDoc.exists()) {
        await setDoc(studentDocRef, {
          ...studentData,
          createdAt: new Date()
        });
      }
      
      localStorage.setItem('current_student', JSON.stringify(studentData));
      setUser(studentData);
    } catch (error) {
      console.error("Error saving student data", error);
      // ถึงเซฟลง DB ไม่ได้ ก็ให้เข้าใช้งานแบบ Local ได้ก่อน
      localStorage.setItem('current_student', JSON.stringify(studentData));
      setUser(studentData);
    }
  };

  const logout = () => {
    localStorage.removeItem('current_student');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginAsStudent, logout }}>
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
