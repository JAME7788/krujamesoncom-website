import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import ts from 'typescript';
import { initializeApp } from 'firebase/app';
import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  writeBatch,
} from 'firebase/firestore';

const DAY_MS = 24 * 60 * 60 * 1000;
const START_DATE = '2026-05-05';
const BATCH_SIZE = 400;

const hasFlag = (flag) => process.argv.includes(flag);
const argValue = (name, fallback) => {
  const prefix = `${name}=`;
  const value = process.argv.find((item) => item.startsWith(prefix));
  return value ? value.slice(prefix.length) : fallback;
};

const assertDateKey = (value, name) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${name} must use YYYY-MM-DD, received ${value}`);
  }
  return value;
};

const bangkokDateKey = (date) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Bangkok',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(date);

const yesterdayBangkok = () => bangkokDateKey(new Date(Date.now() - DAY_MS));

const parseEnv = (source) => Object.fromEntries(
  source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const index = line.indexOf('=');
      const key = line.slice(0, index).trim();
      const raw = line.slice(index + 1).trim();
      const value = raw.replace(/^(['"])(.*)\1$/, '$2');
      return [key, value];
    }),
);

const loadEnv = async () => parseEnv(await readFile(path.resolve('.env'), 'utf8'));

const loadDefaultRosters = async () => {
  const source = await readFile(path.resolve('src/data/students2569.ts'), 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const encoded = Buffer.from(output, 'utf8').toString('base64');
  const module = await import(`data:text/javascript;base64,${encoded}`);
  return module.students2569;
};

const loadDefaultSchedule = async () => {
  const source = await readFile(path.resolve('src/data/schedule.ts'), 'utf8');
  const marker = 'export const defaultSchedule: ClassSlot[] = [';
  const start = source.indexOf(marker);
  const end = source.indexOf('\n];', start);
  if (start < 0 || end < 0) throw new Error('Cannot parse defaultSchedule');
  const literal = source.slice(start + marker.length - 1, end + 2);
  return Function(`"use strict"; return (${literal});`)();
};

const enumerateDates = (startKey, endKey) => {
  const start = new Date(`${startKey}T12:00:00+07:00`);
  const end = new Date(`${endKey}T12:00:00+07:00`);
  if (start > end) throw new Error('Start date must not be after end date');
  const dates = [];
  for (let cursor = start; cursor <= end; cursor = new Date(cursor.getTime() + DAY_MS)) {
    dates.push({
      key: bangkokDateKey(cursor),
      // Bangkok noon is still the same calendar date in UTC.
      day: cursor.getUTCDay(),
    });
  }
  return dates;
};

const normalizeRosters = (raw) => Object.fromEntries(
  Object.entries(raw || {})
    .filter(([, students]) => Array.isArray(students))
    .map(([classroom, students]) => [
      classroom,
      students
        .filter((student) => student?.name && student?.studentCode)
        .map((student, index) => ({
          no: Number(student.no) || index + 1,
          studentCode: String(student.studentCode),
          name: String(student.name),
          emoji: String(student.emoji || ''),
        })),
    ]),
);

const buildStudentId = (classroom, student) => (
  `${classroom}_${student.no}_${student.name.replace(/\s/g, '')}`
);

const commitOperations = async (db, operations) => {
  for (let offset = 0; offset < operations.length; offset += BATCH_SIZE) {
    const batch = writeBatch(db);
    operations.slice(offset, offset + BATCH_SIZE).forEach((operation) => {
      batch.set(operation.ref, operation.data, operation.options || { merge: true });
    });
    await batch.commit();
  }
};

const main = async () => {
  const apply = hasFlag('--apply');
  const verify = hasFlag('--verify');
  const startDate = assertDateKey(argValue('--from', START_DATE), '--from');
  const endDate = assertDateKey(argValue('--through', yesterdayBangkok()), '--through');
  const env = await loadEnv();
  const app = initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  });
  const { getFirestore } = await import('firebase/firestore');
  const db = getFirestore(app);

  const [rosterSnap, scheduleSnap] = await Promise.all([
    getDoc(doc(db, 'settings', 'rosters2569')),
    getDoc(doc(db, 'schedule', 'main')),
  ]);

  const [defaultRosters, defaultSchedule] = await Promise.all([
    loadDefaultRosters(),
    loadDefaultSchedule(),
  ]);
  const remoteRosters = rosterSnap.exists()
    ? normalizeRosters(rosterSnap.data().classrooms)
    : {};
  const rosters = Object.keys(remoteRosters).length > 0
    ? remoteRosters
    : normalizeRosters(defaultRosters);
  const remoteSchedule = scheduleSnap.exists() && Array.isArray(scheduleSnap.data().slots)
    ? scheduleSnap.data().slots
    : defaultSchedule;
  const defaultSlotById = new Map(defaultSchedule.map((slot) => [slot.id, slot]));
  const schedule = remoteSchedule
    .filter((slot) => (
      slot
      && typeof slot.classroom === 'string'
      && Number.isInteger(Number(slot.day))
    ))
    .map((slot) => ({
      ...slot,
      // Older remote schedules did not persist this field. Preserve the
      // current grading policy without discarding teacher-edited days/times.
      excludeFromGrading: Boolean(
        slot.excludeFromGrading
        || defaultSlotById.get(slot.id)?.excludeFromGrading
        || slot.subject === 'ทักษะอาชีพ'
      ),
    }));

  const [progressSnap, attendanceSnap] = apply
    ? await Promise.all([
      getDocs(collection(db, 'progress')),
      getDocs(collection(db, 'attendance')),
    ])
    : [{ docs: [] }, { docs: [] }];
  const progressById = new Map(progressSnap.docs.map((item) => [item.id, item.data()]));
  const attendanceById = new Map(attendanceSnap.docs.map((item) => [item.id, item.data()]));
  const range = enumerateDates(startDate, endDate);
  const scheduledDatesByClassroom = {};

  for (const classroom of Object.keys(rosters)) {
    const gradingDays = new Set(
      schedule
        .filter((slot) => slot.classroom === classroom && !slot.excludeFromGrading)
        .map((slot) => Number(slot.day)),
    );
    scheduledDatesByClassroom[classroom] = range
      .filter((date) => gradingDays.has(date.day))
      .map((date) => date.key);
  }

  const attendanceTargets = [];
  for (const date of range) {
    const classrooms = new Set(
      schedule
        .filter((slot) => Number(slot.day) === date.day)
        .map((slot) => slot.classroom),
    );
    classrooms.forEach((classroom) => {
      if (rosters[classroom]?.length) attendanceTargets.push({ classroom, date: date.key });
    });
  }
  const attendanceTargetIds = new Set(
    attendanceTargets.map((target) => `${target.date}_${target.classroom}`),
  );

  const operations = [];
  let studentCount = 0;
  for (const [classroom, students] of Object.entries(rosters)) {
    const inClassDays = scheduledDatesByClassroom[classroom] || [];
    for (const student of students) {
      studentCount += 1;
      const studentId = buildStudentId(classroom, student);
      operations.push({
        ref: doc(db, 'students', studentId),
        data: {
          id: studentId,
          name: student.name,
          classroom,
          studentNumber: String(student.no),
          studentCode: student.studentCode,
          accountType: 'student',
        },
      });
      if (inClassDays.length > 0) {
        const existing = progressById.get(studentId);
        const existingDays = Array.isArray(existing?.inClassDays) ? existing.inClassDays : [];
        const nextInClassDays = [...new Set([
          ...existingDays.filter((date) => (
            !/^\d{4}-\d{2}-\d{2}$/.test(date)
            || date < startDate
            || date > endDate
            || inClassDays.includes(date)
          )),
          ...inClassDays,
        ])];
        operations.push({
          ref: doc(db, 'progress', studentId),
          data: {
            studentId,
            inClassDays: existing ? nextInClassDays : arrayUnion(...inClassDays),
            ...(existing ? {} : { createdAt: Date.now() }),
          },
        });
      }
    }
  }

  for (const target of attendanceTargets) {
    const id = `${target.date}_${target.classroom}`;
    const existing = attendanceById.get(id) || {};
    const records = { ...(existing.records || {}) };
    rosters[target.classroom].forEach((student) => {
      records[student.studentCode] = 'present';
    });
    operations.push({
      ref: doc(db, 'attendance', id),
      data: {
        date: target.date,
        classroom: target.classroom,
        records,
        updatedAt: Date.now(),
        source: 'scheduled-attendance-backfill',
      },
    });
  }

  if (apply) {
    attendanceById.forEach((existing, id) => {
      const date = String(existing.date || '');
      const classroom = String(existing.classroom || '');
      if (
        existing.source !== 'scheduled-attendance-backfill'
        || date < startDate
        || date > endDate
        || attendanceTargetIds.has(id)
        || !rosters[classroom]
      ) return;
      const records = { ...(existing.records || {}) };
      rosters[classroom].forEach((student) => delete records[student.studentCode]);
      operations.push({
        ref: doc(db, 'attendance', id),
        data: {
          records,
          updatedAt: Date.now(),
          source: 'scheduled-attendance-backfill-corrected',
        },
      });
    });
  }

  const summary = {
    mode: apply ? 'APPLY' : 'DRY_RUN',
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    startDate,
    endDate,
    classrooms: Object.keys(rosters).length,
    students: studentCount,
    attendanceDocuments: attendanceTargets.length,
    progressDocuments: Object.values(rosters).reduce(
      (sum, students, index) => {
        const classroom = Object.keys(rosters)[index];
        return sum + ((scheduledDatesByClassroom[classroom]?.length || 0) > 0 ? students.length : 0);
      },
      0,
    ),
    scheduledDatesByClassroom: Object.fromEntries(
      Object.entries(scheduledDatesByClassroom).map(([classroom, dates]) => [
        classroom,
        { count: dates.length, first: dates[0] || null, last: dates.at(-1) || null },
      ]),
    ),
    schedule: schedule.map((slot) => ({
      id: slot.id,
      classroom: slot.classroom,
      day: Number(slot.day),
      start: slot.start,
      end: slot.end,
      subject: slot.subject || null,
      excludeFromGrading: Boolean(slot.excludeFromGrading),
    })),
  };
  console.log(JSON.stringify(summary, null, 2));

  if (!apply && !verify) {
    console.log('No database writes were made. Re-run with --apply after reviewing this summary.');
    return;
  }

  if (apply) {
    await commitOperations(db, operations);
    await setDoc(doc(db, 'settings', 'attendanceBackfill'), {
      startDate,
      endDate,
      appliedAt: Date.now(),
      mode: 'scheduled-days-only',
      studentCount,
      attendanceDocumentCount: attendanceTargets.length,
      scheduledDatesByClassroom: summary.scheduledDatesByClassroom,
    });
    console.log(`Applied ${operations.length} writes and saved the audit record.`);
  }

  if (verify) {
    const [studentVerifySnap, progressVerifySnap, attendanceVerifySnap] = await Promise.all([
      getDocs(collection(db, 'students')),
      getDocs(collection(db, 'progress')),
      getDocs(collection(db, 'attendance')),
    ]);
    const studentVerify = new Set(studentVerifySnap.docs.map((item) => item.id));
    const progressVerify = new Map(progressVerifySnap.docs.map((item) => [item.id, item.data()]));
    const attendanceVerify = new Map(attendanceVerifySnap.docs.map((item) => [item.id, item.data()]));
    const missingStudentDocs = [];
    const missingInClassDays = [];
    const missingAttendance = [];
    const stalePresentRecords = [];

    for (const [classroom, students] of Object.entries(rosters)) {
      const expectedDays = scheduledDatesByClassroom[classroom] || [];
      for (const student of students) {
        const studentId = buildStudentId(classroom, student);
        if (!studentVerify.has(studentId)) missingStudentDocs.push(studentId);
        const actualDays = new Set(progressVerify.get(studentId)?.inClassDays || []);
        expectedDays.forEach((date) => {
          if (!actualDays.has(date)) missingInClassDays.push(`${studentId}:${date}`);
        });
      }
    }

    attendanceTargets.forEach((target) => {
      const id = `${target.date}_${target.classroom}`;
      const records = attendanceVerify.get(id)?.records || {};
      rosters[target.classroom].forEach((student) => {
        if (records[student.studentCode] !== 'present') {
          missingAttendance.push(`${id}:${student.studentCode}`);
        }
      });
    });
    attendanceVerify.forEach((existing, id) => {
      const date = String(existing.date || '');
      const classroom = String(existing.classroom || '');
      if (
        date < startDate
        || date > endDate
        || attendanceTargetIds.has(id)
        || !rosters[classroom]
      ) return;
      const records = existing.records || {};
      rosters[classroom].forEach((student) => {
        if (records[student.studentCode] === 'present') {
          stalePresentRecords.push(`${id}:${student.studentCode}`);
        }
      });
    });

    const verification = {
      expectedStudents: studentCount,
      expectedAttendanceDocuments: attendanceTargets.length,
      missingStudentDocs: missingStudentDocs.length,
      missingInClassDays: missingInClassDays.length,
      missingPresentRecords: missingAttendance.length,
      stalePresentRecords: stalePresentRecords.length,
      ok: missingStudentDocs.length === 0
        && missingInClassDays.length === 0
        && missingAttendance.length === 0
        && stalePresentRecords.length === 0,
    };
    console.log(JSON.stringify({ verification }, null, 2));
    if (!verification.ok) {
      throw new Error('Attendance verification failed');
    }
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
