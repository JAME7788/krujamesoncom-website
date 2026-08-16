import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import ts from 'typescript';
import { initializeApp } from 'firebase/app';
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  setDoc,
} from 'firebase/firestore';

const root = process.cwd();
const args = process.argv.slice(2);
const mode = args.includes('--apply') ? 'apply' : 'dry-run';
const includeDrafts = args.includes('--include-drafts');
const allowDraftApply = args.includes('--yes');
const classroomFilter = valueAfter('--classroom');
const subjectFilter = valueAfter('--subject');
const now = Date.now();

if (mode === 'apply' && includeDrafts && !allowDraftApply) {
  throw new Error('Applying provisional post-lesson drafts requires --include-drafts --yes');
}

function valueAfter(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function parseEnv() {
  const envPath = path.join(root, '.env');
  if (!fs.existsSync(envPath)) throw new Error(`Missing .env at ${envPath}`);
  return Object.fromEntries(
    fs
      .readFileSync(envPath, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=');
        const key = line.slice(0, index);
        const value = line.slice(index + 1).replace(/^"|"$/g, '');
        return [key, value];
      }),
  );
}

async function importTs(relativePath) {
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
}

const cleanForJson = (value) => (
  JSON.parse(JSON.stringify(value, (_key, nested) => {
    if (nested && typeof nested.toDate === 'function') return nested.toDate().toISOString();
    return nested;
  }))
);

const subjectFromDoc = (id, data) => {
  if (data.subject) return data.subject;
  const match = id.match(/_(cs|dt)$/u);
  return match ? match[1] : 'main';
};

const classroomFromDoc = (id, data) => (
  data.classroom || id.replace(/_(cs|dt)$/u, '')
);

const inferIndicators = (students, sessions, indicatorIdFromCode) => {
  const map = new Map();
  students.forEach((student) => {
    Object.entries(student.indicators || {}).forEach(([id, score]) => {
      map.set(id, { id, maxScore: score?.maxK || 15 });
    });
  });
  sessions.forEach((session) => {
    (session.indicatorCodes || []).forEach((code) => {
      const id = indicatorIdFromCode(code);
      if (id && !map.has(id)) map.set(id, { id, code, maxScore: 15 });
      else if (id && map.has(id)) map.set(id, { ...map.get(id), code });
    });
  });
  return [...map.values()];
};

const addSummary = (target, source) => {
  Object.entries(source).forEach(([key, value]) => {
    if (typeof value === 'number') target[key] = (target[key] || 0) + value;
  });
};

async function main() {
  const env = parseEnv();
  const app = initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  });
  const db = getFirestore(app);
  const {
    applyPostLessonAssessmentsToGradeRows,
    indicatorIdFromCode,
  } = await importTs('src/services/postLessonGradeSync.ts');

  const [gradeSnap, assessmentSnap, sessionSnap] = await Promise.all([
    getDocs(collection(db, 'grades')),
    getDocs(collection(db, 'studentAssessments')),
    getDocs(collection(db, 'teachingSessions')),
  ]);
  const assessments = assessmentSnap.docs.map((item) => ({ id: item.id, ...item.data() }));
  const sessions = sessionSnap.docs.map((item) => ({ id: item.id, ...item.data() }));
  const gradeDocs = gradeSnap.docs.map((item) => ({ id: item.id, data: item.data() }));

  const changes = [];
  const skippedGradeDocs = [];
  const totalSummary = {};

  gradeDocs.forEach(({ id, data }) => {
    const classroom = classroomFromDoc(id, data);
    const subject = subjectFromDoc(id, data);
    if (classroomFilter && classroom !== classroomFilter) return;
    if (subjectFilter && subject !== subjectFilter) return;

    const students = Array.isArray(data.students) ? data.students : [];
    const docSessions = sessions.filter((session) => (
      session.classroom === classroom
      && (session.subject || (classroom.startsWith('\u0e21.') ? 'cs' : 'main')) === subject
    ));
    if (students.length === 0 || docSessions.length === 0) {
      skippedGradeDocs.push({ id, classroom, subject, students: students.length, sessions: docSessions.length });
      return;
    }

    const indicators = inferIndicators(students, docSessions, indicatorIdFromCode);
    const docAssessments = assessments.filter((assessment) => assessment.classroom === classroom);
    const result = applyPostLessonAssessmentsToGradeRows({
      grades: students,
      indicators,
      sessions: docSessions,
      assessments: docAssessments,
      options: { includeDrafts, now },
    });
    addSummary(totalSummary, result.summary);
    if (result.summary.studentsUpdated === 0) return;

    changes.push({
      id,
      classroom,
      subject,
      before: data,
      after: {
        ...data,
        classroom,
        subject,
        students: result.grades,
        postLessonGradeSync: {
          source: 'post-lesson-assessments',
          includeDrafts,
          syncedAt: now,
          summary: result.summary,
        },
        updatedAt: now,
      },
      summary: result.summary,
    });
  });

  let backupPath = null;
  if (mode === 'apply' && changes.length > 0) {
    const backupDir = path.join(os.homedir(), '.codex', 'backups', 'krujamesoncom-website');
    fs.mkdirSync(backupDir, { recursive: true });
    backupPath = path.join(backupDir, `post-lesson-grade-sync-${now}.json`);
    fs.writeFileSync(
      backupPath,
      JSON.stringify(cleanForJson({
        createdAt: new Date(now).toISOString(),
        includeDrafts,
        changes: changes.map((item) => ({ id: item.id, classroom: item.classroom, subject: item.subject, before: item.before })),
      }), null, 2),
      'utf8',
    );

    for (const change of changes) {
      await setDoc(doc(db, 'grades', change.id), cleanForJson(change.after), { merge: true });
    }
  }

  console.log(JSON.stringify({
    mode,
    includeDrafts,
    classroomFilter: classroomFilter || null,
    subjectFilter: subjectFilter || null,
    gradeDocsChanged: changes.length,
    skippedGradeDocs,
    backupPath,
    totalSummary,
    changedDocs: changes.map((item) => ({
      id: item.id,
      classroom: item.classroom,
      subject: item.subject,
      summary: item.summary,
    })),
    nextAction: mode === 'dry-run'
      ? 'Review summary, then run with --apply. Use --include-drafts --yes only if the teacher intentionally accepts provisional drafts.'
      : 'Applied changes to grades collection.',
  }, null, 2));
}

try {
  await main();
  process.exitCode = 0;
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  setTimeout(() => process.exit(process.exitCode || 0), 0);
}
