import { readFileSync } from 'node:fs';
import process from 'node:process';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';

const APPLY = process.argv.includes('--apply');

const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
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

const classroomCourseIds = {
  'ป.1': ['p1', 'ai-p1-3'],
  'ป.2': ['p2', 'ai-p1-3'],
  'ป.3': ['p3', 'ai-p1-3'],
  'ป.4': ['p4', 'ai-p4-6'],
  'ป.5': ['p5', 'ai-p4-6'],
  'ป.6': ['p6', 'ai-p4-6'],
  'ม.1': ['m1-cs', 'm1-design', 'ai-m1-3', 'arduino-basic', 'electronics-basic'],
  'ม.2': ['m2-cs', 'm2-design', 'ai-m1-3', 'arduino-basic', 'electronics-basic'],
  'ม.3': ['m3-cs', 'm3-design', 'ai-m1-3', 'arduino-basic', 'electronics-basic'],
};

const snap = await getDocs(collection(db, 'progress'));
console.log(`[cleanup] Found ${snap.size} progress documents. Mode: ${APPLY ? 'APPLY (Writing to Firestore)' : 'DRY-RUN (Preview only, use --apply to write)'}`);

let affectedCount = 0;
let totalForeignUnitsRemoved = 0;

for (const d of snap.docs) {
  const m = d.id.match(/^(ป\.\d+|ม\.\d+)_/);
  if (!m) continue;
  const classroom = m[1];
  const allowed = (classroomCourseIds[classroom] || []).map((c) => c.toLowerCase());
  if (allowed.length === 0) continue;

  const data = d.data();
  const units = data.units || {};
  const foreignUnitKeys = Object.keys(units).filter((k) => {
    const gradeId = k.split('_')[0].toLowerCase();
    return !allowed.includes(gradeId);
  });

  if (foreignUnitKeys.length === 0) continue;

  affectedCount++;
  totalForeignUnitsRemoved += foreignUnitKeys.length;

  console.log(`[${d.id}] (${classroom}) Removing ${foreignUnitKeys.length} foreign units:`, foreignUnitKeys);

  const cleanUnits = { ...units };
  for (const k of foreignUnitKeys) {
    delete cleanUnits[k];
  }

  // Recompute totals
  let slides = 0;
  let acts = 0;
  let points = 0;
  let completed = 0;
  for (const u of Object.values(cleanUnits)) {
    slides += (u.slidesViewed || []).length;
    acts += (u.videosClicked || []).length
      + (u.funClicked || []).length
      + (u.articlesClicked || []).length
      + (u.practiceCompleted || []).length;
    points += Number(u.bestQuizScore) || 0;
    if ((Number(u.completionPct) || 0) >= 80) completed++;
  }

  const cleanAttempts = Array.isArray(data.attempts)
    ? data.attempts.filter((a) => !a.gradeId || allowed.includes(String(a.gradeId).toLowerCase()))
    : [];

  const cleanActivities = Array.isArray(data.activities)
    ? data.activities.filter((a) => !a.gradeId || a.gradeId === 'login' || allowed.includes(String(a.gradeId).toLowerCase()))
    : [];

  const updatedDoc = {
    ...data,
    units: cleanUnits,
    totalSlidesViewed: slides,
    totalActivities: acts,
    totalPoints: points,
    unitsCompleted: completed,
    attempts: cleanAttempts,
    activities: cleanActivities,
  };

  if (APPLY) {
    await setDoc(doc(db, 'progress', d.id), updatedDoc);
    console.log(`  -> Applied update to Firestore for ${d.id}`);
  }
}

console.log(`\n[cleanup] Done! Affected documents: ${affectedCount}/${snap.size}. Total foreign units removed: ${totalForeignUnitsRemoved}.`);
if (!APPLY) {
  console.log('[cleanup] To apply changes to Firestore, re-run with: node scripts/cleanup-foreign-units.mjs --apply');
}
