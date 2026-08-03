// บริการสำหรับ Admin/Teacher Dashboard
// รวบรวมข้อมูลนักเรียนและสร้างสถิติ

import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
import type { StudentProgressData, ActivityLog } from './progressService';
import type { ClassSlot } from '../data/schedule';
import { isInClassTime } from '../data/schedule';
import { isNonScoringUserId } from './userAccessService';

export interface StudentRecord {
  id: string;
  name: string;
  classroom: string;
  studentNumber: string;
  progress?: StudentProgressData;
}

export interface AttendanceRecord {
  studentId: string;
  studentName: string;
  classroom: string;
  studentNumber: string;
  inClassEvents: number;     // events ในเวลาเรียน
  outClassEvents: number;    // events นอกเวลาเรียน
  firstSeen?: number;        // timestamp แรกของวัน
  lastSeen?: number;         // timestamp สุดท้ายของวัน
  status: 'present' | 'absent' | 'self-study';
}

const firebaseAvailable = (): boolean => {
  try {
    return !!db && !!import.meta.env.VITE_FIREBASE_PROJECT_ID;
  } catch {
    return false;
  }
};

/** ดึงข้อมูลนักเรียนทั้งหมดจาก Firebase + local progress */
export const fetchAllStudents = async (): Promise<StudentRecord[]> => {
  const records: Record<string, StudentRecord> = {};

  // 1) จาก Firebase students collection
  if (firebaseAvailable()) {
    try {
      const sSnap = await getDocs(collection(db, 'students'));
      sSnap.forEach((d) => {
        const data = d.data() as { id: string; name: string; classroom: string; studentNumber: string };
        if (!data.id || isNonScoringUserId(data.id)) return;
        records[data.id] = {
          id: data.id,
          name: data.name,
          classroom: data.classroom,
          studentNumber: data.studentNumber,
        };
      });

      const pSnap = await getDocs(collection(db, 'progress'));
      pSnap.forEach((d) => {
        const data = d.data() as StudentProgressData;
        if (!data.studentId || isNonScoringUserId(data.studentId)) return;
        if (records[data.studentId]) {
          records[data.studentId].progress = data;
        } else {
          // มี progress แต่ไม่มี student doc — แปลก แต่ก็ใส่ไว้
          records[data.studentId] = {
            id: data.studentId,
            name: data.studentId,
            classroom: '?',
            studentNumber: '?',
            progress: data,
          };
        }
      });
    } catch (e) {
      console.warn('Firebase fetch failed', e);
    }
  }

  // (online-only mode — ไม่ต้องเสริมจาก localStorage แล้ว Firebase ดึงครบหมด)

  return Object.values(records).sort((a, b) => {
    if (a.classroom !== b.classroom) return a.classroom.localeCompare(b.classroom);
    return parseInt(a.studentNumber || '0') - parseInt(b.studentNumber || '0');
  });
};

/** เช็คชื่อนักเรียนของห้องหนึ่ง สำหรับวันที่กำหนด */
export const computeAttendance = (
  students: StudentRecord[],
  classroom: string,
  schedule: ClassSlot[],
  dateMs: number
): AttendanceRecord[] => {
  // ช่วง 00:00 - 23:59 ของวันนั้น
  const dayStart = new Date(dateMs);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dateMs);
  dayEnd.setHours(23, 59, 59, 999);

  return students
    .filter((s) => s.classroom === classroom)
    .map<AttendanceRecord>((s) => {
      const acts = (s.progress?.activities || []).filter(
        (a: ActivityLog) => a.timestamp >= dayStart.getTime() && a.timestamp <= dayEnd.getTime()
      );

      let inClass = 0;
      let outClass = 0;
      let firstSeen: number | undefined;
      let lastSeen: number | undefined;

      acts.forEach((a) => {
        if (isInClassTime(a.timestamp, classroom, schedule)) inClass += 1;
        else outClass += 1;
        firstSeen = firstSeen ? Math.min(firstSeen, a.timestamp) : a.timestamp;
        lastSeen = lastSeen ? Math.max(lastSeen, a.timestamp) : a.timestamp;
      });

      // activities ที่ sync ขึ้น Firebase เก็บเฉพาะรายการล่าสุด จึงอาจตัด login
      // ในคาบออกไปแล้ว ใช้ inClassDays เป็นหลักฐานถาวรสำรองสำหรับวันนั้น
      const year = dayStart.getFullYear();
      const month = dayStart.getMonth();
      const day = dayStart.getDate();
      const persistedInClassDays = new Set(s.progress?.inClassDays || []);
      const hasPersistedInClassDay = [
        `${year}-${month}-${day}`, // รูปแบบเดิม (เดือนเริ่มที่ 0)
        `${year}-${month + 1}-${day}`,
        `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      ].some((key) => persistedInClassDays.has(key));

      let status: AttendanceRecord['status'] = 'absent';
      if (inClass > 0 || hasPersistedInClassDay) status = 'present';
      else if (outClass > 0) status = 'self-study';

      return {
        studentId: s.id,
        studentName: s.name,
        classroom: s.classroom,
        studentNumber: s.studentNumber,
        inClassEvents: inClass,
        outClassEvents: outClass,
        firstSeen,
        lastSeen,
        status,
      };
    })
    .sort(
      (a, b) => parseInt(a.studentNumber || '0') - parseInt(b.studentNumber || '0')
    );
};

/** สถิติภาพรวมเว็บ (รวมทุกห้อง) */
export const getSiteStats = (students: StudentRecord[]) => {
  const total = students.length;
  let activeToday = 0;
  let activeWeek = 0;
  let totalSlides = 0;
  let totalActivities = 0;
  let totalQuizzes = 0;
  let totalPoints = 0;
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const byClassroom: Record<string, { count: number; active: number; points: number }> = {};

  students.forEach((s) => {
    const last = s.progress?.lastActive || 0;
    if (now - last <= dayMs) activeToday += 1;
    if (now - last <= 7 * dayMs) activeWeek += 1;
    totalSlides += s.progress?.totalSlidesViewed || 0;
    totalActivities += s.progress?.totalActivities || 0;
    totalPoints += s.progress?.totalPoints || 0;
    totalQuizzes += (s.progress?.attempts?.length || 0);

    const c = s.classroom || '?';
    if (!byClassroom[c]) byClassroom[c] = { count: 0, active: 0, points: 0 };
    byClassroom[c].count += 1;
    if (now - last <= 7 * dayMs) byClassroom[c].active += 1;
    byClassroom[c].points += s.progress?.totalPoints || 0;
  });

  return {
    total,
    activeToday,
    activeWeek,
    totalSlides,
    totalActivities,
    totalQuizzes,
    totalPoints,
    byClassroom,
  };
};

/** พัฒนาการรายคน — กราฟคะแนนตามวัน */
export const getStudentDevelopment = (student: StudentRecord) => {
  const attempts = student.progress?.attempts || [];
  // group by date (yyyy-mm-dd)
  const byDay: Record<string, { date: string; avgPct: number; attempts: number }> = {};
  attempts.forEach((a) => {
    const d = new Date(a.timestamp);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!byDay[key]) byDay[key] = { date: key, avgPct: 0, attempts: 0 };
    byDay[key].avgPct =
      (byDay[key].avgPct * byDay[key].attempts + a.percentage) / (byDay[key].attempts + 1);
    byDay[key].attempts += 1;
  });
  return Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date));
};
