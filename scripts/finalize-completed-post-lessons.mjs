import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { initializeApp } from 'firebase/app';
import { collection, doc, getDocs, getFirestore, setDoc } from 'firebase/firestore';

const apply = process.argv.includes('--apply');
const now = Date.now();

const env = Object.fromEntries(
  fs.readFileSync(path.resolve('.env'), 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index), line.slice(index + 1).replace(/^["']|["']$/g, '')];
    }),
);

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
});
const db = getFirestore(app);
const clean = (value) => JSON.parse(JSON.stringify(value));

const [assessmentSnap, recordSnap, sessionSnap] = await Promise.all([
  getDocs(collection(db, 'studentAssessments')),
  getDocs(collection(db, 'lessonRecords')),
  getDocs(collection(db, 'teachingSessions')),
]);

const completedSessionIds = new Set(
  sessionSnap.docs.filter((item) => item.data().status === 'completed').map((item) => item.id),
);
const assessments = assessmentSnap.docs
  .map((item) => ({ id: item.id, ...item.data() }))
  .filter((item) => (
    item.kind === 'post-lesson'
    && item.archived !== true
    && completedSessionIds.has(item.sessionId)
    && item.confirmedByTeacher !== true
  ));
const records = recordSnap.docs
  .map((item) => ({ id: item.id, ...item.data() }))
  .filter((item) => (
    item.archived !== true
    && completedSessionIds.has(item.sessionId)
    && item.status !== 'complete'
  ));

console.log(JSON.stringify({
  mode: apply ? 'apply' : 'dry-run',
  completedSessions: completedSessionIds.size,
  assessmentsToConfirm: assessments.length,
  lessonRecordsToComplete: records.length,
}, null, 2));

if (apply) {
  const backupDir = path.join(os.homedir(), '.codex', 'backups', 'krujamesoncom-website');
  fs.mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `completed-post-lessons-${now}.json`);
  fs.writeFileSync(backupPath, JSON.stringify({ assessments, records }, null, 2), 'utf8');

  for (const item of assessments) {
    await setDoc(doc(db, 'studentAssessments', item.id), clean({
      confirmedByTeacher: true,
      provisional: false,
      meta: {
        ...(item.meta || {}),
        status: 'complete',
        suggestion: 'ยืนยันแบบกลุ่มตามคำสั่งครู โดยอ้างอิงคะแนน K/P/A และโปรไฟล์ความสามารถรายบุคคลในระบบ',
      },
      updatedAt: now,
      updatedBy: 'teacher-bulk-confirmation-2026-08-16',
    }), { merge: true });
  }
  for (const item of records) {
    await setDoc(doc(db, 'lessonRecords', item.id), clean({
      status: 'complete',
      summary: item.summary || 'สรุปผลจากคะแนน K/P/A และโปรไฟล์ความสามารถรายบุคคลของผู้เรียนหลังจบคาบ',
      updatedAt: now,
      confirmedAt: now,
      confirmedBy: 'นายอนันตชัย เพ็ชรรี่',
      confirmationSource: 'teacher-bulk-confirmation',
    }), { merge: true });
  }
  console.log(JSON.stringify({ applied: true, backupPath }));
}

process.exit(0);
