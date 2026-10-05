import fs from 'node:fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const env = Object.fromEntries(
  fs.readFileSync('.env', 'utf8').split(/\r?\n/)
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).replace(/^["']|["']$/g, '').trim()];
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

for (const id of ['ม.1_cs', 'ม.2_cs', 'ม.3_cs']) {
  const snap = await getDoc(doc(db, 'grades', id));
  if (snap.exists()) {
    const data = snap.data();
    console.log(`\n=================== ${id} (${data.students?.length} คน) ===================`);
    for (const s of data.students || []) {
      console.log(`เลขที่ ${s.studentNo} | ${s.studentCode} | ${s.name} | กลางภาค: ${s.midtermExam} | ปลายภาค: ${s.finalExam} (max: ${s.finalExamMax})`);
    }
  }
}
process.exit(0);
