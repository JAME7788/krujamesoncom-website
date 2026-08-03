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

  const countEntries = await Promise.all(COLLECTIONS.map(async (name) => {
    try {
      const snapshot = await getCountFromServer(collection(db, name));
      return [name, { count: snapshot.data().count }];
    } catch (error) {
      return [name, { error: error instanceof Error ? error.message : String(error) }];
    }
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

  const report = {
    auditedAt: new Date().toISOString(),
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    collections: Object.fromEntries(countEntries),
    coverage: {
      teachingSessions: {
        total: sessions.length,
        byClassroom: countBy(sessions, 'classroom'),
        missingFullLessonData: sessions.filter((item) => (
          !item.unitNo
          || !item.unitTitle
          || !item.lessonTitle
          || !Array.isArray(item.indicatorCodes)
        )).length,
        completed: sessions.filter((item) => item.status === 'completed').length,
        completedByClassroom: countBy(
          sessions.filter((item) => item.status === 'completed'),
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
        students: Array.isArray(details.students) ? details.students.length : 0,
        progress: Array.isArray(details.progress) ? details.progress.length : 0,
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
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
