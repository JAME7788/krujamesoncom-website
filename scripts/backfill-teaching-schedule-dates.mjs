import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { initializeApp } from 'firebase/app';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  setDoc,
  writeBatch,
} from 'firebase/firestore';

const ACADEMIC_YEAR = '2569';
const TERM_START = {
  1: '2026-05-05',
  2: '2026-11-02',
};
const GRADES = [
  { gradeId: 'p1', classroom: 'ป.1', weekday: 4 },
  { gradeId: 'p2', classroom: 'ป.2', weekday: 1 },
  { gradeId: 'p3', classroom: 'ป.3', weekday: 5 },
  { gradeId: 'p4', classroom: 'ป.4', weekday: 3 },
  { gradeId: 'p5', classroom: 'ป.5', weekday: 3 },
  { gradeId: 'p6', classroom: 'ป.6', weekday: 4 },
];
const P1_LIVE_SLOT = {
  id: 's-wed-1',
  classroom: 'ป.1',
  day: 4,
  start: '13:00',
  end: '14:00',
  subject: 'เทคโนโลยี',
};

const parseEnv = (source) => Object.fromEntries(
  source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const index = line.indexOf('=');
      const key = line.slice(0, index).trim();
      const raw = line.slice(index + 1).trim();
      return [key, raw.replace(/^(['"])(.*)\1$/, '$2')];
    }),
);

const dateKey = (date) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Bangkok',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(date);

const firstWeekdayOnOrAfter = (startKey, weekday) => {
  const date = new Date(`${startKey}T12:00:00+07:00`);
  const offset = (weekday - date.getUTCDay() + 7) % 7;
  return new Date(date.getTime() + offset * 24 * 60 * 60 * 1000);
};

const plannedDateFor = (grade, period) => {
  const semester = period <= 20 ? 1 : 2;
  const termPeriod = semester === 1 ? period - 1 : period - 21;
  const first = firstWeekdayOnOrAfter(TERM_START[semester], grade.weekday);
  return dateKey(new Date(first.getTime() + termPeriod * 7 * 24 * 60 * 60 * 1000));
};

const sessionId = (gradeId, period) => (
  `${ACADEMIC_YEAR}_${gradeId}_main_${String(period).padStart(2, '0')}`
);

const main = async () => {
  const apply = process.argv.includes('--apply');
  const verify = process.argv.includes('--verify');
  const env = parseEnv(await readFile(path.resolve('.env'), 'utf8'));
  const db = getFirestore(initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  }));

  const [snapshot, liveScheduleSnapshot] = await Promise.all([
    getDocs(collection(db, 'teachingSessions')),
    getDoc(doc(db, 'schedule', 'main')),
  ]);
  const existingById = new Map(snapshot.docs.map((item) => [item.id, item.data()]));
  const liveSlots = liveScheduleSnapshot.exists() && Array.isArray(liveScheduleSnapshot.data().slots)
    ? liveScheduleSnapshot.data().slots
    : [];
  const liveP1Slot = liveSlots.find((slot) => slot.classroom === 'ป.1');
  const p1LiveScheduleNeedsUpdate = !liveP1Slot
    || liveP1Slot.day !== P1_LIVE_SLOT.day
    || liveP1Slot.start !== P1_LIVE_SLOT.start
    || liveP1Slot.end !== P1_LIVE_SLOT.end;
  const expected = GRADES.flatMap((grade) => (
    Array.from({ length: 40 }, (_, index) => {
      const period = index + 1;
      return {
        grade,
        period,
        id: sessionId(grade.gradeId, period),
        plannedDate: plannedDateFor(grade, period),
      };
    })
  ));
  const changed = expected.filter((item) => (
    existingById.get(item.id)?.plannedDate !== item.plannedDate
  ));

  console.log(JSON.stringify({
    mode: apply ? 'APPLY' : 'DRY_RUN',
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    term1Start: TERM_START[1],
    term2Start: TERM_START[2],
    expectedSessions: expected.length,
    existingSessions: expected.filter((item) => existingById.has(item.id)).length,
    datesToChange: changed.length,
    p1LiveScheduleNeedsUpdate,
    byGrade: Object.fromEntries(GRADES.map((grade) => {
      const rows = expected.filter((item) => item.grade.gradeId === grade.gradeId);
      return [grade.classroom, {
        firstTerm1: rows[0].plannedDate,
        lastTerm1: rows[19].plannedDate,
        firstTerm2: rows[20].plannedDate,
        lastTerm2: rows[39].plannedDate,
      }];
    })),
  }, null, 2));

  if (apply) {
    const batch = writeBatch(db);
    expected.forEach((item) => {
      const existing = existingById.get(item.id) || {};
      batch.set(doc(db, 'teachingSessions', item.id), {
        id: item.id,
        academicYear: ACADEMIC_YEAR,
        gradeId: item.grade.gradeId,
        classroom: item.grade.classroom,
        subject: 'main',
        period: item.period,
        week: item.period,
        semester: item.period <= 20 ? 1 : 2,
        plannedDate: item.plannedDate,
        status: existing.status || 'planned',
        updatedAt: Date.now(),
        updatedBy: 'system:term-start-correction',
      }, { merge: true });
    });
    await batch.commit();
    if (p1LiveScheduleNeedsUpdate) {
      const nextSlots = liveSlots.filter((slot) => slot.classroom !== 'ป.1');
      nextSlots.push({ ...liveP1Slot, ...P1_LIVE_SLOT });
      await setDoc(doc(db, 'schedule', 'main'), {
        slots: nextSlots,
        updatedAt: Date.now(),
      }, { merge: true });
      console.log('Corrected the live P1 slot to Thursday 13:00-14:00.');
    }
    await setDoc(doc(db, 'settings', 'teachingScheduleBackfill'), {
      academicYear: ACADEMIC_YEAR,
      term1Start: TERM_START[1],
      term2Start: TERM_START[2],
      appliedAt: Date.now(),
      sessionCount: expected.length,
      mode: 'planned-date-correction',
    });
    console.log(`Applied ${expected.length} teaching-session date records.`);
  }

  if (verify) {
    const [verifySnapshot, verifyScheduleSnapshot] = await Promise.all([
      getDocs(collection(db, 'teachingSessions')),
      getDoc(doc(db, 'schedule', 'main')),
    ]);
    const actual = new Map(verifySnapshot.docs.map((item) => [item.id, item.data()]));
    const verifiedP1Slot = verifyScheduleSnapshot.data()?.slots?.find(
      (slot) => slot.classroom === 'ป.1',
    );
    const missing = expected.filter((item) => !actual.has(item.id));
    const wrongDates = expected.filter((item) => (
      actual.get(item.id)?.plannedDate !== item.plannedDate
    ));
    const result = {
      expected: expected.length,
      missing: missing.length,
      wrongDates: wrongDates.length,
      preservedCompleted: expected.filter((item) => actual.get(item.id)?.status === 'completed').length,
      p1LiveScheduleCorrect: verifiedP1Slot?.day === P1_LIVE_SLOT.day
        && verifiedP1Slot?.start === P1_LIVE_SLOT.start
        && verifiedP1Slot?.end === P1_LIVE_SLOT.end,
      ok: missing.length === 0
        && wrongDates.length === 0
        && verifiedP1Slot?.day === P1_LIVE_SLOT.day
        && verifiedP1Slot?.start === P1_LIVE_SLOT.start
        && verifiedP1Slot?.end === P1_LIVE_SLOT.end,
    };
    console.log(JSON.stringify({ verification: result }, null, 2));
    if (!result.ok) throw new Error('Teaching schedule verification failed');
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
