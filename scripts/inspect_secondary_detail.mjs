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

for (const id of ['ม.1_cs', 'ม.1_dt', 'ม.2_cs', 'ม.2_dt', 'ม.3_cs', 'ม.3_dt']) {
  const snap = await getDoc(doc(db, 'grades', id));
  if (snap.exists()) {
    const data = snap.data();
    const s0 = data.students?.[0];
    console.log(`Doc ${id}: students=${data.students?.length}, s0=${s0?.name}, mid=${s0?.midtermExam}, fin=${s0?.finalExam}, rawTotal=${s0?.rawExamTotal}`);
  } else {
    console.log(`Doc ${id}: does not exist`);
  }
}
process.exit(0);
