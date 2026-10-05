import fs from 'node:fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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
const snap = await getDocs(collection(db, 'grades'));
console.log('All documents in grades collection:');
for (const d of snap.docs) {
  const data = d.data();
  const students = data.students || [];
  const withMid = students.filter(s => s.midtermExam !== undefined && s.midtermExam !== null).length;
  const withFinal = students.filter(s => s.finalExam !== undefined && s.finalExam !== null).length;
  console.log(`- ${d.id}: classroom=${data.classroom}, subject=${data.subject}, academicYear=${data.academicYear}, term=${data.term}, students=${students.length}, midterm=${withMid}, final=${withFinal}`);
}
process.exit(0);
