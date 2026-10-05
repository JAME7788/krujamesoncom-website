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

for (const c of ['ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6']) {
    console.log(`\n=================== ${c} ===================`);
    for (const docId of [`2569_t1_${c}_main`, c]) {
        const snap = await getDoc(doc(db, 'grades', docId));
        if (snap.exists()) {
            const data = snap.data();
            console.log(`Found docId: ${docId}`);
            console.log(`Students count: ${data.students?.length}`);
            if (data.students && data.students.length > 0) {
                const s0 = data.students[0];
                console.log(`Sample student: No.${s0.studentNo} ${s0.studentCode} ${s0.name} | midterm: ${s0.midtermExam} | final: ${s0.finalExam} | finalMax: ${s0.finalExamMax}`);
                const finalCount = data.students.filter(s => s.finalExam !== undefined && s.finalExam !== null).length;
                console.log(`Students with finalExam: ${finalCount}/${data.students.length}`);
            }
        } else {
            console.log(`DocId ${docId} does not exist`);
        }
    }
}
process.exit(0);
