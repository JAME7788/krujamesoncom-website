import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { initializeApp } from 'firebase/app';
import {
  collection,
  getCountFromServer,
  getDocs,
  getFirestore,
} from 'firebase/firestore';

const COLLECTIONS = [
  'students',
  'progress',
  'grades',
  'attendance',
  'teachingSessions',
  'learningEvidence',
  'lessonRecords',
  'studentAssessments',
  'primaryCompetencyAssessments',
  'questionBank',
  'homeworkAssignments',
  'homeworkSubmissions',
  'courses',
  'courseVersions',
  'custom_slides',
  'announcements',
  'events',
  'dailyQuestions',
  'surveys',
  'externalVisitors',
  'teacherProfiles',
  'teacherAuditLogs',
  'liveQuizzes',
  'tycoonRooms',
  'virtualRooms',
  'virtualWorlds',
  'virtualActivityEvents',
  'submissions',
];

const EXPECTED_PROTECTED_COLLECTIONS = new Set([
  'externalVisitors',
  'teacherProfiles',
  // Legacy assignmentService collection. The active homework system uses
  // homeworkSubmissions, while this old path remains blocked by rules.
  'submissions',
]);

const DETAIL_COLLECTIONS = [
  'teachingSessions',
  'questionBank',
  'homeworkAssignments',
  'lessonRecords',
  'courses',
  'custom_slides',
  'announcements',
  'events',
  'grades',
  'students',
  'progress',
  'studentAssessments',
  'primaryCompetencyAssessments',
  'dailyQuestions',
];

const DETAIL_COLLECTION_SET = new Set(DETAIL_COLLECTIONS);

const parseEnv = (source) => Object.fromEntries(
  source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const index = line.indexOf('=');
      const key = line.slice(0, index).trim();
      return [key, line.slice(index + 1).trim().replace(/^(['"])(.*)\1$/, '$2')];
    }),
);

const countBy = (items, key) => items.reduce((result, item) => {
  const value = String(item[key] ?? '(missing)');
  result[value] = (result[value] || 0) + 1;
  return result;
}, {});

const classifyProgressAlias = (item) => {
  const identity = [item.id, item.studentId, item.studentName, item.name]
    .map((value) => String(value || ''))
    .join(' ');
  if (/external_visitor_|admin_teacher_account/i.test(identity)) return 'non-scoring-account';
  if (/ทดสอบ|(?:^|[_-])qa(?:[_-]|$)|test/i.test(identity)) return 'test-account';
  if (/undefined|null|nan/i.test(identity)) return 'invalid-legacy-id';
  return 'legacy-or-unknown';
};

const main = async () => {
  const env = parseEnv(await readFile(path.resolve('.env'), 'utf8'));
  const db = getFirestore(initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  }));

  const detailEntries = await Promise.all(DETAIL_COLLECTIONS.map(async (name) => {
    try {
      const snapshot = await getDocs(collection(db, name));
      return [name, snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))];
    } catch (error) {
      return [name, { error: error instanceof Error ? error.message : String(error) }];
    }
  }));
  const details = Object.fromEntries(detailEntries);

  // Collections used for coverage already have every document in memory. Reusing
  // those snapshots avoids a second Firestore aggregation read for the same data.
  const countEntries = await Promise.all(COLLECTIONS.map(async (name) => {
    if (DETAIL_COLLECTION_SET.has(name)) {
      const value = details[name];
      return Array.isArray(value)
        ? [name, { count: value.length, source: 'documents' }]
        : [name, { error: value?.error || 'detail read failed', source: 'documents' }];
    }
    try {
      const snapshot = await getCountFromServer(collection(db, name));
      return [name, { count: snapshot.data().count, source: 'aggregation' }];
    } catch (error) {
      return [name, {
        error: error instanceof Error ? error.message : String(error),
        source: 'aggregation',
      }];
    }
  }));

  const collectionResults = Object.fromEntries(countEntries);
  const sessions = Array.isArray(details.teachingSessions) ? details.teachingSessions : [];
  const questions = Array.isArray(details.questionBank) ? details.questionBank : [];
  const assignments = Array.isArray(details.homeworkAssignments) ? details.homeworkAssignments : [];
  const records = Array.isArray(details.lessonRecords) ? details.lessonRecords : [];
  const activeRecords = records.filter((item) => item.archived !== true);
  const courses = Array.isArray(details.courses) ? details.courses : [];
  const studentAssessments = Array.isArray(details.studentAssessments) ? details.studentAssessments : [];
  const activeStudentAssessments = studentAssessments.filter((item) => item.archived !== true);
  const competencyAssessments = Array.isArray(details.primaryCompetencyAssessments)
    ? details.primaryCompetencyAssessments
    : [];
  const students = Array.isArray(details.students) ? details.students : null;
  const progress = Array.isArray(details.progress) ? details.progress : null;
  const studentIds = students ? new Set(students.map((item) => item.id)) : null;
  const progressIds = progress ? new Set(progress.map((item) => item.id)) : null;
  const extraProgress = studentIds && progress
    ? progress.filter((item) => !studentIds.has(item.id))
    : [];
  const missingProgress = progressIds && students
    ? students.filter((item) => !progressIds.has(item.id))
    : [];

  const expectedProtected = Object.entries(collectionResults)
    .filter(([collectionName, value]) => (
      value.error && EXPECTED_PROTECTED_COLLECTIONS.has(collectionName)
    ))
    .map(([collectionName, value]) => ({
      collection: collectionName,
      error: value.error,
    }));
  const readFailures = Object.entries(collectionResults)
    .filter(([, value]) => value.error)
    .filter(([collectionName]) => !EXPECTED_PROTECTED_COLLECTIONS.has(collectionName))
    .map(([collectionName, value]) => ({
      collection: collectionName,
      error: value.error,
    }));
  const successfulReads = Object.values(collectionResults)
    .filter((value) => !value.error)
    .length;
  const issues = [];
  if (readFailures.length > 0) {
    issues.push({
      severity: 'critical',
      code: 'FIRESTORE_READ_FAILURE',
      message: `อ่าน Firebase ไม่สำเร็จ ${readFailures.length} collection`,
    });
  }
  if (students && progress && (extraProgress.length > 0 || missingProgress.length > 0)) {
    issues.push({
      severity: 'warning',
      code: 'STUDENT_PROGRESS_COUNT_MISMATCH',
      message: `progress เกินรายชื่อ ${extraProgress.length} รายการ และนักเรียนที่ยังไม่มี progress ${missingProgress.length} รายการ`,
    });
  }
  const completedSessions = sessions.filter((item) => item.status === 'completed');
  if (sessions.length > 0 && completedSessions.length !== activeRecords.length) {
    issues.push({
      severity: 'warning',
      code: 'POST_LESSON_RECORD_MISMATCH',
      message: `คาบสอนแล้ว ${completedSessions.length} คาบ แต่บันทึกหลังสอนที่ใช้งาน ${activeRecords.length} รายการ`,
    });
  }
  const incompleteSessions = sessions.filter((item) => (
    !item.unitNo
    || !item.unitTitle
    || !item.lessonTitle
    || !Array.isArray(item.indicatorCodes)
  ));
  if (incompleteSessions.length > 0) {
    issues.push({
      severity: 'warning',
      code: 'INCOMPLETE_TEACHING_SESSION',
      message: `คาบสอนขาดข้อมูลแผนรายชั่วโมง ${incompleteSessions.length} คาบ`,
    });
  }
  const unpublishedQuestions = questions.filter((item) => item.status !== 'published');
  if (questions.length > 0 && unpublishedQuestions.length > 0) {
    issues.push({
      severity: 'warning',
      code: 'UNPUBLISHED_QUESTION_BANK_ITEMS',
      message: `คลังข้อสอบยังไม่เผยแพร่ ${unpublishedQuestions.length} ข้อ`,
    });
  }

  const report = {
    auditedAt: new Date().toISOString(),
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    health: {
      ok: issues.length === 0,
      collectionsChecked: COLLECTIONS.length,
      collectionsReadSuccessfully: successfulReads,
      collectionsAvailableOrExpectedProtected: successfulReads + expectedProtected.length,
      readFailures,
      expectedProtected,
      issues,
    },
    collections: collectionResults,
    coverage: {
      teachingSessions: {
        total: sessions.length,
        byClassroom: countBy(sessions, 'classroom'),
        missingFullLessonData: incompleteSessions.length,
        completed: completedSessions.length,
        completedByClassroom: countBy(
          completedSessions,
          'classroom',
        ),
        withTeachingDate: sessions.filter((item) => item.teachingDate).length,
      },
      questionBank: {
        total: questions.length,
        published: questions.filter((item) => item.status === 'published').length,
        byClassroom: countBy(questions, 'classroom'),
        byDifficulty: countBy(questions, 'difficulty'),
        indicatorsCovered: new Set(questions.map((item) => item.indicatorCode).filter(Boolean)).size,
      },
      homework: {
        total: assignments.length,
        byClassroom: countBy(assignments, 'classroom'),
        withIndicator: assignments.filter((item) => item.indicatorId).length,
        withResourceUrl: assignments.filter((item) => item.resourceUrl).length,
      },
      lessonRecords: {
        total: records.length,
        active: activeRecords.length,
        archived: records.length - activeRecords.length,
        byClassroom: countBy(activeRecords, 'classroom'),
        withTeachingDate: activeRecords.filter((item) => item.teachingDate).length,
      },
      customCourses: {
        total: courses.length,
        published: courses.filter((item) => item.status === 'published').length,
        units: courses.reduce((sum, item) => sum + (item.units?.length || 0), 0),
        slides: courses.reduce((sum, item) => (
          sum + (item.units || []).reduce((unitSum, unit) => unitSum + (unit.slides?.length || 0), 0)
        ), 0),
        questions: courses.reduce((sum, item) => (
          sum + (item.units || []).reduce((unitSum, unit) => unitSum + (unit.quiz?.length || 0), 0)
        ), 0),
      },
      customSlides: Array.isArray(details.custom_slides) ? details.custom_slides.length : 0,
      announcements: Array.isArray(details.announcements) ? details.announcements.length : 0,
      calendarEvents: Array.isArray(details.events) ? details.events.length : 0,
      gradeDocuments: Array.isArray(details.grades) ? details.grades.length : 0,
      identities: {
        students: students?.length ?? null,
        progress: progress?.length ?? null,
        difference: students && progress ? progress.length - students.length : null,
        extraProgressDocuments: extraProgress.length,
        studentsMissingProgress: missingProgress.length,
        extraProgressCategories: countBy(
          extraProgress.map((item) => ({ category: classifyProgressAlias(item) })),
          'category',
        ),
      },
      studentAssessments: {
        documents: studentAssessments.length,
        active: activeStudentAssessments.length,
        archived: studentAssessments.length - activeStudentAssessments.length,
        entries: activeStudentAssessments.reduce(
          (sum, item) => sum + Object.keys(item.entries || {}).length,
          0,
        ),
        awaitingTeacherConfirmation: activeStudentAssessments.filter((item) => item.provisional !== false).length,
        confirmedByTeacher: activeStudentAssessments.filter((item) => item.confirmedByTeacher === true).length,
        postLessonDrafts: activeStudentAssessments.filter((item) => item.kind === 'post-lesson').length,
        postLessonByClassroom: countBy(
          activeStudentAssessments.filter((item) => item.kind === 'post-lesson'),
          'classroom',
        ),
      },
      primaryCompetencyAssessments: {
        total: competencyAssessments.length,
        provisional: competencyAssessments.filter((item) => item.provisional === true).length,
        confirmedByTeacher: competencyAssessments.filter((item) => item.confirmedByTeacher === true).length,
      },
      dailyQuestions: Array.isArray(details.dailyQuestions) ? details.dailyQuestions.length : 0,
    },
  };

  console.log(JSON.stringify(report, null, 2));
  if (!report.health.ok) process.exitCode = 1;
};

main().then(() => {
  process.exit(process.exitCode || 0);
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
