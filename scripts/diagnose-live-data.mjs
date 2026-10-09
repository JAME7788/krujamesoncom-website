import { readFile } from 'node:fs/promises';
import { initializeApp } from 'firebase/app';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import { createServer } from 'vite';

const env = Object.fromEntries(
  (await readFile('.env', 'utf8')).split(/\r?\n/)
    .filter((line) => line.includes('=') && !line.startsWith('#'))
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index), line.slice(index + 1).replace(/^['"]|['"]$/g, '')];
    }),
);
const db = getFirestore(initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
}));
const [studentSnapshot, progressSnapshot, sessionSnapshot, recordSnapshot] = await Promise.all(
  ['students', 'progress', 'teachingSessions', 'lessonRecords'].map((name) => getDocs(collection(db, name))),
);
const students = studentSnapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
const progress = progressSnapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
const progressIds = new Set(progress.map((item) => item.id));

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const rosterModule = await server.ssrLoadModule('/src/data/students2569.ts');
await server.close();
const rosterIds = new Set();
for (const [classroom, entries] of Object.entries(rosterModule.students2569)) {
  for (const student of entries) rosterIds.add(`${classroom}_${student.no}_${student.name.replace(/\s/g, '')}`);
}

const completedSessions = sessionSnapshot.docs
  .filter((item) => item.data().status === 'completed')
  .map((item) => ({ id: item.id, ...item.data() }));
const records = recordSnapshot.docs
  .filter((item) => item.data().archived !== true)
  .map((item) => ({ id: item.id, ...item.data() }));
const sessionIds = new Set(completedSessions.map((item) => item.id));
const allSessions = new Map(sessionSnapshot.docs.map((item) => [item.id, { id: item.id, ...item.data() }]));

console.log(JSON.stringify({
  missingProgress: students.filter((item) => !progressIds.has(item.id)),
  studentsNotInRoster: students.filter((item) => !rosterIds.has(item.id)),
  lessonRecordsWithoutCompletedSessionId: records.filter((item) => (
    item.sessionId && !sessionIds.has(item.sessionId)
  )).map((item) => ({
    id: item.id,
    sessionId: item.sessionId,
    classroom: item.classroom,
    teachingDate: item.teachingDate,
    lessonTitle: item.lessonTitle,
    referencedSession: allSessions.get(item.sessionId),
  })),
  sampleRecordKeys: records[0] ? Object.keys(records[0]).sort() : [],
  sampleSessionKeys: completedSessions[0] ? Object.keys(completedSessions[0]).sort() : [],
}, null, 2));
