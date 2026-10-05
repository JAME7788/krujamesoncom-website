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
      return [line.slice(0, idx).trim(), line.slice(idx + 1).replace(/^["']|["']$/g, '').trim()];
    })
);

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
});
const db = getFirestore(app);

const SCORE_WEIGHT = { COLLECTED: 70, EXAM: 30, TOTAL: 100, K_RATIO: 0.60, P_RATIO: 0.25, A_RATIO: 0.15 };
const P_POINTS = { 'ดี': 3, 'ปานกลาง': 2, 'พอใช้': 1 };
const round1 = (n) => Math.round(n * 10) / 10;

function computeScore(student, indicatorIds) {
  const weightPer = SCORE_WEIGHT.COLLECTED / indicatorIds.length;
  const kMaxPer = weightPer * SCORE_WEIGHT.K_RATIO;
  const pMaxPer = weightPer * SCORE_WEIGHT.P_RATIO;
  const aMaxPer = weightPer * SCORE_WEIGHT.A_RATIO;

  let totalK = 0, totalP = 0, totalA = 0;
  for (const id of indicatorIds) {
    const s = student.indicators?.[id] || { k: 0, p: 'พอใช้', a: false };
    const kRatio = (s.maxK || 15) > 0 ? Math.min(1, (s.k || 0) / (s.maxK || 15)) : 0;
    const kVal = kRatio * kMaxPer;
    const pRatio = s.pAssessed && s.practicePassed !== false ? (P_POINTS[s.p] || 1) / 3 : 0;
    const pVal = pRatio * pMaxPer;
    const aVal = (s.aAssessed && s.a ? 1 : 0) * aMaxPer;
    totalK += kVal;
    totalP += pVal;
    totalA += aVal;
  }
  const collected = round1(totalK + totalP + totalA);
  const midterm = Number(student.midtermExam) || 0;
  const final = Number(student.finalExam) || 0;
  const total = round1(collected + midterm + final);

  let grade = '0';
  if (total >= 80) grade = '4';
  else if (total >= 75) grade = '3.5';
  else if (total >= 70) grade = '3';
  else if (total >= 65) grade = '2.5';
  else if (total >= 60) grade = '2';
  else if (total >= 55) grade = '1.5';
  else if (total >= 50) grade = '1';

  return {
    k: round1(totalK),
    p: round1(totalP),
    a: round1(totalA),
    collected,
    midterm,
    final,
    examTotal: midterm + final,
    total,
    grade,
    isPassed: grade !== '0',
  };
}

const targets = [
  { classroom: 'ม.1', subject: 'cs', docId: 'ม.1_cs', code: 'ว21103', title: 'วิทยาการคำนวณ', indicators: ['cs_m1_1', 'cs_m1_2', 'cs_m1_3', 'cs_m1_4'] },
  { classroom: 'ม.1', subject: 'dt', docId: 'ม.1_dt', code: 'ว21104', title: 'การออกแบบและเทคโนโลยี', indicators: ['dt_m1_1', 'dt_m1_2', 'dt_m1_3', 'dt_m1_4', 'dt_m1_5'] },
  { classroom: 'ม.2', subject: 'cs', docId: 'ม.2_cs', code: 'ว22103', title: 'วิทยาการคำนวณ', indicators: ['cs_m2_1', 'cs_m2_2', 'cs_m2_3', 'cs_m2_4'] },
  { classroom: 'ม.2', subject: 'dt', docId: 'ม.2_dt', code: 'ว22104', title: 'การออกแบบและเทคโนโลยี', indicators: ['dt_m2_1', 'dt_m2_2', 'dt_m2_3', 'dt_m2_4', 'dt_m2_5'] },
  { classroom: 'ม.3', subject: 'cs', docId: 'ม.3_cs', code: 'ว23103', title: 'วิทยาการคำนวณ', indicators: ['cs_m3_1', 'cs_m3_2', 'cs_m3_3', 'cs_m3_4'] },
  { classroom: 'ม.3', subject: 'dt', docId: 'ม.3_dt', code: 'ว23104', title: 'การออกแบบและเทคโนโลยี', indicators: ['dt_m3_1', 'dt_m3_2', 'dt_m3_3', 'dt_m3_4', 'dt_m3_5'] },
];

const exportData = {};

for (const target of targets) {
  const snap = await getDoc(doc(db, 'grades', target.docId));
  const data = snap.data();
  const students = (data?.students || []).sort((a, b) => (a.studentNo || 0) - (b.studentNo || 0));

  const rows = students.map((s) => ({
    studentNo: s.studentNo,
    studentCode: s.studentCode,
    name: s.name,
    classroom: target.classroom,
    subject: target.subject,
    subjectCode: target.code,
    subjectTitle: target.title,
    ...computeScore(s, target.indicators),
  }));

  // Stats
  const scores = rows.map((r) => r.total);
  const mean = round1(scores.reduce((a, b) => a + b, 0) / (scores.length || 1));
  const variance = scores.reduce((acc, score) => acc + Math.pow(score - mean, 2), 0) / (scores.length || 1);
  const sd = round1(Math.sqrt(variance));
  const max = Math.max(...scores);
  const min = Math.min(...scores);
  const passCount = rows.filter((r) => r.isPassed).length;
  const gradeCounts = { '4': 0, '3.5': 0, '3': 0, '2.5': 0, '2': 0, '1.5': 0, '1': 0, '0': 0 };
  rows.forEach((r) => { gradeCounts[r.grade] = (gradeCounts[r.grade] || 0) + 1; });

  exportData[target.docId] = {
    target,
    rows,
    stats: {
      totalStudents: rows.length,
      mean,
      sd,
      max,
      min,
      passCount,
      passPercentage: round1((passCount / (rows.length || 1)) * 100),
      gradeCounts,
    },
  };
}

const outputPath = path.join(root, 'scripts', 'secondary_grades_export.json');
fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2), 'utf8');
console.log(`Saved secondary grades export JSON to: ${outputPath}`);
process.exit(0);
