import fs from 'node:fs';
import path from 'node:path';
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

for (const c of ['ป.5', 'ป.6']) {
  const snap = await getDoc(doc(db, 'grades', c));
  if (snap.exists()) {
    const data = snap.data();
    console.log(`=== ${c} (top-level fields) ===`);
    console.log('classroom:', data.classroom, 'subject:', data.subject);
    console.log('students count:', data.students?.length);
    console.log('Sample student 0:', JSON.stringify(data.students[0], null, 2));
  }
}
process.exit(0);
