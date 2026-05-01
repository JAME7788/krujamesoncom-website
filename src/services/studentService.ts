import { db } from './firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

export interface UnitScore {
  k: number; // Knowledge (Quiz score)
  maxK: number;
  p: string; // Performance (Manual by teacher)
  a: boolean; // Attitude (Manual by teacher)
  updatedAt: any;
}

export interface StudentProgress {
  id: string;
  name: string;
  classroom: string;
  studentNumber: string;
  units: Record<string, UnitScore>; // key is unitNo
  totalPoints: number;
}

/**
 * บันทึกคะแนนสอบ (K) ลง Firestore
 */
export const saveQuizResult = async (
  studentId: string, 
  unitNo: number, 
  score: number, 
  maxScore: number
) => {
  const studentDocRef = doc(db, 'students', studentId);
  
  try {
    const studentDoc = await getDoc(studentDocRef);
    if (!studentDoc.exists()) return;

    const data = studentDoc.data() as StudentProgress;
    const units = data.units || {};
    
    // บันทึกเฉพาะคะแนนที่ดีที่สุด (Best Score)
    const existingK = units[unitNo]?.k || 0;
    if (score > existingK) {
      units[unitNo] = {
        ...units[unitNo],
        k: score,
        maxK: maxScore,
        p: units[unitNo]?.p || 'ปานกลาง',
        a: units[unitNo]?.a ?? true,
        updatedAt: new Date()
      };

      // คำนวณคะแนนรวมใหม่
      const totalPoints = Object.values(units).reduce((acc, curr) => acc + curr.k, 0);

      await updateDoc(studentDocRef, {
        units,
        totalPoints
      });
    }
  } catch (error) {
    console.error("Error saving quiz result:", error);
  }
};

/**
 * ดึงข้อมูลความคืบหน้าของนักเรียนคนเดียว
 */
export const getStudentProgress = async (studentId: string): Promise<StudentProgress | null> => {
  const studentDocRef = doc(db, 'students', studentId);
  const studentDoc = await getDoc(studentDocRef);
  if (studentDoc.exists()) {
    return studentDoc.data() as StudentProgress;
  }
  return null;
};

/**
 * ดึงรายชื่อนักเรียนทั้งหมดในห้องเรียนนั้น (สำหรับครู)
 */
export const getClassroomProgress = async (classroom: string): Promise<StudentProgress[]> => {
  const q = query(collection(db, 'students'), where('classroom', '==', classroom));
  const querySnapshot = await getDocs(q);
  const results: StudentProgress[] = [];
  querySnapshot.forEach((doc) => {
    results.push(doc.data() as StudentProgress);
  });
  // เรียงลำดับตามเลขที่
  return results.sort((a, b) => parseInt(a.studentNumber) - parseInt(b.studentNumber));
};

/**
 * อัปเดตข้อมูล P และ A โดยคุณครู
 */
export const updateTeacherFields = async (
  studentId: string,
  unitNo: number,
  field: 'p' | 'a',
  value: any
) => {
  const studentDocRef = doc(db, 'students', studentId);
  const studentDoc = await getDoc(studentDocRef);
  if (!studentDoc.exists()) return;

  const data = studentDoc.data() as StudentProgress;
  const units = data.units || {};
  
  if (!units[unitNo]) {
    units[unitNo] = { k: 0, maxK: 0, p: 'ปานกลาง', a: true, updatedAt: new Date() };
  }

  units[unitNo] = {
    ...units[unitNo],
    [field]: value,
    updatedAt: new Date()
  };

  await updateDoc(studentDocRef, { units });
};
