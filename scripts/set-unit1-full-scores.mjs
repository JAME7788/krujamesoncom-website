import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { initializeApp } from 'firebase/app';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  setDoc,
} from 'firebase/firestore';

const root = process.cwd();
const mode = process.argv.includes('--apply') ? 'apply' : 'dry-run';
const now = Date.now();

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

const importTs = async (relativePath) => {
  const filePath = path.join(root, relativePath);
  const source = fs.readFileSync(filePath, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      verbatimModuleSyntax: false,
    },
    fileName: filePath,
  }).outputText;
  const url = `data:text/javascript;base64,${Buffer.from(output).toString('base64')}`;
  return import(url);
};

const { students2569, allClassrooms2569 } = await importTs('src/data/students2569.ts');
const { grades: curriculumGrades } = await importTs('src/data/curriculum.ts');

const subjectDefs = (classroom) =>
  classroom.startsWith('ป.')
    ? [{ subject: 'main', suffix: '', gradeId: `p${classroom.slice(2)}`, prefix: `cs_p${classroom.slice(2)}` }]
    : [
        { subject: 'cs', suffix: '_cs', gradeId: `m${classroom.slice(2)}-cs`, prefix: `cs_m${classroom.slice(2)}` },
        { subject: 'dt', suffix: '_dt', gradeId: `m${classroom.slice(2)}-design`, prefix: `dt_m${classroom.slice(2)}` },
      ];

const docIdFor = (classroom, subject) => (subject === 'main' ? classroom : `${classroom}_${subject}`);
const studentIdFor = (classroom, student) => `${classroom}_${student.no}_${student.name.replace(/\s/g, '')}`;

const emptyIndicatorScore = (maxK = 15) => ({
  k: 0,
  maxK,
  p: 'พอใช้',
  a: false,
  pAssessed: false,
  aAssessed: false,
  updatedAt: now,
});

const fullIndicatorScore = (maxK = 15) => ({
  k: maxK,
  maxK,
  p: 'ดี',
  a: true,
  pAssessed: true,
  aAssessed: true,
  note: 'ครูใส่คะแนนเต็มบทที่ 1 ให้ทั้งห้อง',
  updatedAt: now,
});

const progressUnitFull = (gradeId, unitNo, previous = {}) => {
  const totalSlides = Math.max(previous.totalSlides || 0, 8);
  return {
    slidesViewed: Array.from({ length: totalSlides }, (_, i) => i),
    totalSlides,
    videosClicked: Array.from(new Set([...(previous.videosClicked || []), 'ครูรับรองสื่อบทที่ 1'])),
    funClicked: Array.from(new Set([...(previous.funClicked || []), 'ครูรับรองกิจกรรมบทที่ 1'])),
    articlesClicked: Array.from(new Set([...(previous.articlesClicked || []), 'ครูรับรองใบงานบทที่ 1'])),
    bestQuizScore: Math.max(previous.bestQuizScore || 0, 10),
    bestQuizMax: Math.max(previous.bestQuizMax || 0, 10),
    quizAttempts: Math.max(previous.quizAttempts || 0, 1),
    lastAttempt: {
      gradeId,
      unitNo,
      score: 10,
      maxScore: 10,
      percentage: 100,
      answers: {},
      timestamp: now,
    },
    completionPct: 100,
    updatedAt: now,
  };
};

const recomputeProgressTotals = (data) => {
  const units = Object.values(data.units || {});
  data.totalSlidesViewed = units.reduce((sum, unit) => sum + (unit.slidesViewed?.length || 0), 0);
  data.totalActivities = units.reduce(
    (sum, unit) =>
      sum +
      (unit.videosClicked?.length || 0) +
      (unit.funClicked?.length || 0) +
      (unit.articlesClicked?.length || 0),
    0
  );
  data.totalPoints = units.reduce((sum, unit) => sum + (unit.bestQuizScore || 0), 0);
  data.unitsCompleted = units.filter((unit) => (unit.completionPct || 0) >= 80).length;
  data.lastActive = now;
};

const gradeDocRefs = [];
for (const classroom of allClassrooms2569) {
  for (const def of subjectDefs(classroom)) {
    gradeDocRefs.push({ classroom, ...def, docId: docIdFor(classroom, def.subject) });
  }
}

const gradeSnap = await getDocs(collection(db, 'grades'));
const existingGradeDocs = new Map();
gradeSnap.forEach((item) => existingGradeDocs.set(item.id, item.data()));

const before = [];
const updates = [];

for (const item of gradeDocRefs) {
  const roster = students2569[item.classroom] || [];
  const course = curriculumGrades.find((g) => g.id === item.gradeId);
  const unit1 = course?.units?.find((unit) => unit.no === 1);
  const unitIndicatorIds = (unit1?.indicators || []).map((idx) => `${item.prefix}_${idx + 1}`);
  const allIndicatorIds = (course?.indicators || []).map((_, idx) => `${item.prefix}_${idx + 1}`);
  const existing = existingGradeDocs.get(item.docId);
  const existingStudents = existing?.students || [];
  const currentFull = existingStudents.filter((student) =>
    unitIndicatorIds.every((id) => {
      const score = student.indicators?.[id];
      return score?.k === 15 && score?.p === 'ดี' && score?.a === true && score?.pAssessed && score?.aAssessed;
    })
  ).length;

  before.push({
    docId: item.docId,
    classroom: item.classroom,
    subject: item.subject,
    unit: unit1?.title || 'หน่วยที่ 1',
    indicators: unitIndicatorIds,
    students: roster.length,
    existed: Boolean(existing),
    fullBefore: currentFull,
  });

  const students = roster.map((student) => {
    const existingStudent =
      existingStudents.find((s) => s.studentCode === student.studentCode) ||
      existingStudents.find((s) => Number(s.studentNo) === Number(student.no)) ||
      {};
    const indicators = { ...(existingStudent.indicators || {}) };
    for (const id of allIndicatorIds) {
      indicators[id] = { ...emptyIndicatorScore(15), ...(indicators[id] || {}) };
    }
    for (const id of unitIndicatorIds) {
      indicators[id] = { ...(indicators[id] || emptyIndicatorScore(15)), ...fullIndicatorScore(15) };
    }
    return {
      studentCode: student.studentCode,
      classroom: item.classroom,
      studentNo: student.no,
      name: student.name,
      emoji: student.emoji,
      midtermExam: existingStudent.midtermExam || 0,
      finalExam: existingStudent.finalExam || 0,
      comment: existingStudent.comment || '',
      ...existingStudent,
      indicators,
      updatedAt: now,
    };
  });

  updates.push({
    grade: item,
    unit1,
    unitIndicatorIds,
    gradePayload: {
      classroom: item.classroom,
      subject: item.subject,
      students,
      updatedAt: now,
      unit1FullUpdatedAt: now,
    },
  });
}

if (mode === 'apply') {
  for (const update of updates) {
    await setDoc(doc(db, 'grades', update.grade.docId), update.gradePayload, { merge: true });
    for (const student of update.gradePayload.students) {
      const studentId = studentIdFor(update.grade.classroom, student);
      const ref = doc(db, 'progress', studentId);
      const snap = await getDoc(ref);
      const previous = snap.exists() ? snap.data() : {};
      const units = { ...(previous.units || {}) };
      const key = `${update.grade.gradeId}_1`;
      units[key] = progressUnitFull(update.grade.gradeId, 1, units[key]);
      const attempt = units[key].lastAttempt;
      const attempts = [
        attempt,
        ...(previous.attempts || []).filter(
          (old) => !(old.gradeId === update.grade.gradeId && old.unitNo === 1 && old.score === 10 && old.maxScore === 10)
        ),
      ].slice(0, 50);
      const activities = [
        {
          type: 'quiz',
          gradeId: update.grade.gradeId,
          unitNo: 1,
          detail: '10/10 (ครูใส่คะแนนเต็มบทที่ 1)',
          timestamp: now,
        },
        ...(previous.activities || []),
      ].slice(0, 100);
      const payload = {
        studentId,
        ...previous,
        studentId,
        units,
        attempts,
        activities,
      };
      recomputeProgressTotals(payload);
      await setDoc(ref, { ...payload, syncedAt: now }, { merge: true });
    }
  }
}

const after = before.map((row) => ({
  ...row,
  fullAfter: mode === 'apply' ? row.students : row.fullBefore,
  changed: mode === 'apply' ? row.students - row.fullBefore : 0,
}));

const totals = after.reduce(
  (acc, row) => {
    acc.docs += 1;
    acc.students += row.students;
    acc.fullBefore += row.fullBefore;
    acc.fullAfter += row.fullAfter;
    acc.changed += row.changed;
    return acc;
  },
  { docs: 0, students: 0, fullBefore: 0, fullAfter: 0, changed: 0 }
);

console.log(JSON.stringify({ mode, projectId: env.VITE_FIREBASE_PROJECT_ID, totals, rows: after }, null, 2));
