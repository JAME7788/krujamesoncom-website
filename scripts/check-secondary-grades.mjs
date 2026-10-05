import fs from 'node:fs';
import path from 'node:path';
import { initializeApp } from 'firebase/app';
import { doc, getDoc, getFirestore } from 'firebase/firestore';

const root = process.cwd();
const envPath = path.join(root, '.env');
const env = Object.fromEntries(
  fs
    .readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const idx = line.indexOf('=');
      return [line.slice(0, idx), line.slice(idx + 1)];
    })
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

const targets = [
  'ม.1_cs', 'ม.1_dt',
  'ม.2_cs', 'ม.2_dt',
  'ม.3_cs', 'ม.3_dt',
];

for (const target of targets) {
  const snap = await getDoc(doc(db, 'grades', target));
  if (!snap.exists()) {
    console.log(`[NOT FOUND] grades/${target}`);
  } else {
    const data = snap.data();
    const students = data.students || [];
    console.log(`[FOUND] grades/${target}: ${students.length} students`);
    const sample = students.slice(0, 3).map(s => ({
      no: s.studentNo,
      name: s.name,
      midterm: s.midtermExam,
      final: s.finalExam,
      indicatorCount: Object.keys(s.indicators || {}).length,
    }));
    console.log('Sample:', JSON.stringify(sample, null, 2));
  }
}
process.exit(0);
