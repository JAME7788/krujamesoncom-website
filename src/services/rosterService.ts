// ระบบจัดการรายชื่อนักเรียน — เพิ่ม/ลบ/แก้ไข
//
// Layer:
//   1. Built-in: students2569 (จากไฟล์ Excel โรงเรียน)
//   2. Override: localStorage `krujames_roster_overrides_v1`
//      → admin แก้ไขแล้ว save เข้า override layer
//   3. loadRoster() merge ทั้ง 2 layer ก่อนคืนค่า

import { students2569 as defaultRoster } from '../data/students2569';
import type { StudentInfo } from '../data/students2569';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const KEY = 'krujames_roster_overrides_v1';
const ROSTER_DOC = doc(db, 'settings', 'rosters2569');

interface RosterOverrides {
  // classroom → list ทั้งหมด (override สมบูรณ์ ของห้องนั้น)
  // ถ้าไม่มี key ห้องนั้นใน overrides → ใช้ default
  [classroom: string]: StudentInfo[];
}

const loadOverrides = (): RosterOverrides => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const saveOverridesLocal = (data: RosterOverrides) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('saveOverrides failed', e);
  }
};

const normalizeRosters = (raw: unknown): RosterOverrides => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const result: RosterOverrides = {};
  Object.entries(raw as Record<string, unknown>).forEach(([classroom, value]) => {
    if (!Array.isArray(value)) return;
    result[classroom] = value
      .map((item) => item as Partial<StudentInfo>)
      .filter((item) => item && item.name && item.studentCode)
      .map((item, index) => ({
        no: Number(item.no) || index + 1,
        studentCode: String(item.studentCode),
        name: String(item.name),
        emoji: String(item.emoji || '👤'),
      }));
  });
  return result;
};

const mergeWithDefaultRoster = (overrides: RosterOverrides): Record<string, StudentInfo[]> => {
  const result: Record<string, StudentInfo[]> = {};
  Object.keys(defaultRoster).forEach((classroom) => {
    result[classroom] = overrides[classroom] || defaultRoster[classroom];
  });
  Object.keys(overrides).forEach((classroom) => {
    if (!result[classroom]) result[classroom] = overrides[classroom];
  });
  return result;
};

const persistRostersToFirebase = async (
  classrooms: Record<string, StudentInfo[]> = mergeWithDefaultRoster(loadOverrides()),
): Promise<void> => {
  await setDoc(ROSTER_DOC, {
    classrooms,
    academicYear: '2569',
    updatedAt: Date.now(),
  });
};

const commitOverrides = async (data: RosterOverrides): Promise<void> => {
  await persistRostersToFirebase(mergeWithDefaultRoster(data));
  saveOverridesLocal(data);
};

/** ดึงรายชื่อกลางจาก Firebase ลง cache ของเครื่อง เพื่อให้ Login/Admin ใช้ชุดเดียวกัน */
export const fetchRostersFromFirebase = async (): Promise<Record<string, StudentInfo[]>> => {
  try {
    const snap = await getDoc(ROSTER_DOC);
    if (snap.exists()) {
      const remote = normalizeRosters(snap.data().classrooms);
      if (Object.keys(remote).length > 0) {
        saveOverridesLocal(remote);
        return loadAllRosters();
      }
    }
    await persistRostersToFirebase();
  } catch (error) {
    console.warn('fetch rosters from Firebase failed, using local roster', error);
  }
  return loadAllRosters();
};

/** อ่าน roster ของห้อง — merge default + overrides */
export const loadRoster = (classroom: string): StudentInfo[] => {
  const overrides = loadOverrides();
  if (overrides[classroom]) return overrides[classroom];
  return defaultRoster[classroom] || [];
};

/** อ่านทุกห้อง */
export const loadAllRosters = (): Record<string, StudentInfo[]> => {
  return mergeWithDefaultRoster(loadOverrides());
};

/** บันทึก roster ของห้อง (เก็บใน overrides) */
export const saveRoster = async (classroom: string, students: StudentInfo[]): Promise<void> => {
  const overrides = loadOverrides();
  overrides[classroom] = students;
  await commitOverrides(overrides);
};

/** เพิ่มนักเรียน */
export const addStudent = async (classroom: string, student: Omit<StudentInfo, 'no'> & { no?: number }): Promise<StudentInfo> => {
  const list = loadRoster(classroom);
  const newNo = student.no ?? (list.reduce((m, s) => Math.max(m, s.no), 0) + 1);
  const newStudent: StudentInfo = {
    no: newNo,
    studentCode: student.studentCode || `new_${Date.now()}`,
    name: student.name,
    emoji: student.emoji || '👦',
  };
  await saveRoster(classroom, [...list, newStudent]);
  return newStudent;
};

/** แก้ไขนักเรียน */
export const updateStudent = async (classroom: string, studentCode: string, patch: Partial<StudentInfo>): Promise<void> => {
  const list = loadRoster(classroom);
  const idx = list.findIndex((s) => s.studentCode === studentCode);
  if (idx === -1) return;
  list[idx] = { ...list[idx], ...patch };
  await saveRoster(classroom, list);
};

/** ลบนักเรียน */
export const deleteStudent = async (classroom: string, studentCode: string): Promise<void> => {
  const list = loadRoster(classroom).filter((s) => s.studentCode !== studentCode);
  await saveRoster(classroom, list);
};

/** ย้ายนักเรียนข้ามห้อง */
export const moveStudent = async (fromClassroom: string, studentCode: string, toClassroom: string): Promise<void> => {
  const fromList = loadRoster(fromClassroom);
  const student = fromList.find((s) => s.studentCode === studentCode);
  if (!student) return;
  const toList = loadRoster(toClassroom);
  const newNo = toList.reduce((m, s) => Math.max(m, s.no), 0) + 1;
  const overrides = loadOverrides();
  overrides[fromClassroom] = fromList.filter((s) => s.studentCode !== studentCode);
  overrides[toClassroom] = [...toList, { ...student, no: newNo }];
  await commitOverrides(overrides);
};

/** จัดเรียงเลขที่ใหม่ตามลำดับ (1, 2, 3...) */
export const renumberClassroom = async (classroom: string): Promise<void> => {
  const list = loadRoster(classroom);
  await saveRoster(
    classroom,
    list.map((s, i) => ({ ...s, no: i + 1 }))
  );
};

/** รีเซ็ตห้องกลับเป็น default จากไฟล์ Excel */
export const resetClassroom = async (classroom: string): Promise<void> => {
  const overrides = loadOverrides();
  delete overrides[classroom];
  await commitOverrides(overrides);
};

/** Export roster เป็น CSV */
export const exportRosterCSV = (classroom: string): string => {
  const list = loadRoster(classroom);
  let csv = 'เลขที่,รหัสประจำตัว,ชื่อ-สกุล,Emoji\n';
  list.forEach((s) => {
    csv += `${s.no},${s.studentCode},${s.name},${s.emoji}\n`;
  });
  return csv;
};

export const downloadRosterCSV = (classroom: string) => {
  const csv = exportRosterCSV(classroom);
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `รายชื่อ_${classroom}_2569.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
