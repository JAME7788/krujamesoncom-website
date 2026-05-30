// ระบบจัดการรายชื่อนักเรียน — เพิ่ม/ลบ/แก้ไข
//
// Layer:
//   1. Built-in: students2569 (จากไฟล์ Excel โรงเรียน)
//   2. Override: localStorage `krujames_roster_overrides_v1`
//      → admin แก้ไขแล้ว save เข้า override layer
//   3. loadRoster() merge ทั้ง 2 layer ก่อนคืนค่า

import { students2569 as defaultRoster } from '../data/students2569';
import type { StudentInfo } from '../data/students2569';

const KEY = 'krujames_roster_overrides_v1';

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

const saveOverrides = (data: RosterOverrides) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('saveOverrides failed', e);
  }
};

/** อ่าน roster ของห้อง — merge default + overrides */
export const loadRoster = (classroom: string): StudentInfo[] => {
  const overrides = loadOverrides();
  if (overrides[classroom]) return overrides[classroom];
  return defaultRoster[classroom] || [];
};

/** อ่านทุกห้อง */
export const loadAllRosters = (): Record<string, StudentInfo[]> => {
  const overrides = loadOverrides();
  const result: Record<string, StudentInfo[]> = {};
  Object.keys(defaultRoster).forEach((c) => {
    result[c] = overrides[c] || defaultRoster[c];
  });
  // ห้องใหม่ที่อาจสร้างใน overrides
  Object.keys(overrides).forEach((c) => {
    if (!result[c]) result[c] = overrides[c];
  });
  return result;
};

/** บันทึก roster ของห้อง (เก็บใน overrides) */
export const saveRoster = (classroom: string, students: StudentInfo[]) => {
  const overrides = loadOverrides();
  overrides[classroom] = students;
  saveOverrides(overrides);
};

/** เพิ่มนักเรียน */
export const addStudent = (classroom: string, student: Omit<StudentInfo, 'no'> & { no?: number }): StudentInfo => {
  const list = loadRoster(classroom);
  const newNo = student.no ?? (list.reduce((m, s) => Math.max(m, s.no), 0) + 1);
  const newStudent: StudentInfo = {
    no: newNo,
    studentCode: student.studentCode || `new_${Date.now()}`,
    name: student.name,
    emoji: student.emoji || '👦',
  };
  saveRoster(classroom, [...list, newStudent]);
  return newStudent;
};

/** แก้ไขนักเรียน */
export const updateStudent = (classroom: string, studentCode: string, patch: Partial<StudentInfo>) => {
  const list = loadRoster(classroom);
  const idx = list.findIndex((s) => s.studentCode === studentCode);
  if (idx === -1) return;
  list[idx] = { ...list[idx], ...patch };
  saveRoster(classroom, list);
};

/** ลบนักเรียน */
export const deleteStudent = (classroom: string, studentCode: string) => {
  const list = loadRoster(classroom).filter((s) => s.studentCode !== studentCode);
  saveRoster(classroom, list);
};

/** ย้ายนักเรียนข้ามห้อง */
export const moveStudent = (fromClassroom: string, studentCode: string, toClassroom: string) => {
  const fromList = loadRoster(fromClassroom);
  const student = fromList.find((s) => s.studentCode === studentCode);
  if (!student) return;
  saveRoster(fromClassroom, fromList.filter((s) => s.studentCode !== studentCode));
  const toList = loadRoster(toClassroom);
  const newNo = toList.reduce((m, s) => Math.max(m, s.no), 0) + 1;
  saveRoster(toClassroom, [...toList, { ...student, no: newNo }]);
};

/** จัดเรียงเลขที่ใหม่ตามลำดับ (1, 2, 3...) */
export const renumberClassroom = (classroom: string) => {
  const list = loadRoster(classroom);
  saveRoster(
    classroom,
    list.map((s, i) => ({ ...s, no: i + 1 }))
  );
};

/** รีเซ็ตห้องกลับเป็น default จากไฟล์ Excel */
export const resetClassroom = (classroom: string) => {
  const overrides = loadOverrides();
  delete overrides[classroom];
  saveOverrides(overrides);
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
