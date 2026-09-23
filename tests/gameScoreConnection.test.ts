import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LearningEvidence } from '../src/services/learningEvidenceService';
import type { StudentGrade } from '../src/services/gradeService';

// In-memory Firestore boundary: the real progress, evidence and grade services
// run together; no test can contact production or write a student's records.
const backend = vi.hoisted(() => ({
  docs: new Map<string, Record<string, unknown>>(),
  failCollection: '',
  failures: 0,
  loseAcknowledgement: false,
  writes: [] as string[],
  queue: Promise.resolve(),
}));
vi.mock('../src/services/firebase', () => ({ db: {} }));
vi.mock('firebase/firestore', async (importOriginal) => {
  const original = await importOriginal<typeof import('firebase/firestore')>();
  const snapshot = (path: string) => ({
    exists: () => backend.docs.has(path),
    data: () => structuredClone(backend.docs.get(path)),
  });
  const fail = (path: string) => {
    if (backend.failures > 0 && path.startsWith(`${backend.failCollection}/`)) {
      backend.failures -= 1;
      throw Object.assign(new Error('Simulated connection failure'), { code: 'unavailable' });
    }
  };
  const write = (path: string, data: Record<string, unknown>, merge = false) => {
    backend.docs.set(path, structuredClone(merge ? { ...backend.docs.get(path), ...data } : data));
    backend.writes.push(path);
  };
  return {
    ...original,
    doc: (_db: unknown, ...parts: string[]) => parts.join('/'),
    serverTimestamp: () => 123456,
    getDoc: async (path: string) => snapshot(path),
    setDoc: async (path: string, data: Record<string, unknown>, options?: { merge?: boolean }) => {
      fail(path);
      write(path, data, options?.merge);
    },
    runTransaction: (_db: unknown, callback: (tx: unknown) => Promise<unknown>) => {
      const operation = backend.queue.then(async () => {
        const staged: Array<{ path: string; data: Record<string, unknown>; merge: boolean }> = [];
        const result = await callback({
          get: async (path: string) => { fail(path); return snapshot(path); },
          set: (path: string, data: Record<string, unknown>, options?: { merge?: boolean }) => {
            staged.push({ path, data, merge: Boolean(options?.merge) });
          },
        });
        staged.forEach(({ path, data, merge }) => write(path, data, merge));
        if (backend.loseAcknowledgement && staged.some((item) => item.path.startsWith('progress/'))) {
          backend.loseAcknowledgement = false;
          throw Object.assign(new Error('Committed but acknowledgement lost'), { code: 'unavailable' });
        }
        return result;
      });
      backend.queue = operation.then(() => undefined, () => undefined);
      return operation;
    },
  };
});
vi.mock('../src/data/schedule', () => ({ loadSchedule: () => [], isInClassTime: () => true }));
vi.mock('../src/services/rosterService', () => ({ loadRoster: () => [] }));
vi.mock('../src/services/courseAccessService', () => ({
  fetchCourseAccessSettings: async () => ({}),
  getCourseAccessSettings: () => ({}),
  filterTargetUnitsForCourseAccess: (_classroom: string, targets: unknown[]) => targets,
  getActiveSubjectsForClassroom: (classroom: string) => classroom.startsWith('ม.') ? ['cs', 'dt'] : ['main'],
  getCourseIdsForClassroom: () => ['p1', 'm1-cs', 'm1-design'],
}));

import { recordGameProgress } from '../src/services/gameProgressService';
import { clearProgressCache, getProgress, trackMediaClick } from '../src/services/progressService';
import { loadLearningEvidence, makeEvidenceId, recordLearningEvidence } from '../src/services/learningEvidenceService';
import { cacheGradesLocally, loadGrades, upsertStudentGradeToFirebase } from '../src/services/gradeService';

const student = { id: 'ป.1_901_QA', classroom: 'ป.1', name: 'QA synthetic', studentNumber: '901' };
const save = (score = 20, maxScore?: number) => recordGameProgress('stroop-color', 'QA Stroop', [student], score, 'round', maxScore);
const documents = (collection: string) => [...backend.docs.entries()].filter(([path]) => path.startsWith(`${collection}/`)).map(([, data]) => data);

beforeEach(() => {
  vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'mock-only');
  const storage = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
    key: (index: number) => [...storage.keys()][index] ?? null,
    get length() { return storage.size; },
  });
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  backend.docs.clear();
  backend.writes = [];
  backend.failCollection = '';
  backend.failures = 0;
  backend.loseAcknowledgement = false;
  backend.queue = Promise.resolve();
  clearProgressCache();
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('game -> progress -> evidence -> teacher grades', () => {
  it('saves game evidence and local preview without accessing teacher-only grades', async () => {
    expect((await save(20, 40)).saved).toBe(1);
    expect(documents('learningEvidence')).toHaveLength(2);
    expect(documents('learningEvidence').every((item) => item.score === 20 && item.maxScore === 40)).toBe(true);
    expect(documents('grades')).toHaveLength(0);
    const rows = loadGrades(student.classroom);
    expect(rows.find((row) => row.studentNo === 901)?.indicators).toBeDefined();
    expect(Object.values(rows.find((row) => row.studentNo === 901)!.indicators).some((item) => item.webPScore === 3)).toBe(true);
  });

  it('does not invent a percentage for an unbounded score', async () => {
    await save(2500);
    expect(documents('learningEvidence').every((item) => item.score === 2500 && !('maxScore' in item))).toBe(true);
  });

  it.each([[NaN, 40], [-1, 40], [41, 40], [1, 0], [1, Infinity]])('rejects invalid result %s/%s before writing', async (score, max) => {
    await expect(save(score, max)).rejects.toBeInstanceOf(RangeError);
    expect(backend.writes).toHaveLength(0);
  });

  it('failure before progress write cannot become a false cached success', async () => {
    backend.failCollection = 'progress'; backend.failures = 2;
    await expect(save()).rejects.toThrow();
    await expect(save()).rejects.toThrow();
    expect(documents('progress')).toHaveLength(0);
    expect(Object.keys(getProgress(student.id).units)).toHaveLength(0);
    await save();
    expect(getProgress(student.id).totalActivities).toBe(1);
  });

  it('retry after lost acknowledgement neither duplicates an activity nor its P credit', async () => {
    backend.loseAcknowledgement = true;
    await expect(save()).rejects.toThrow();
    await save();
    expect(getProgress(student.id).totalActivities).toBe(1);
    expect(Object.values(getProgress(student.id).units)[0].scoreEvidence).toHaveLength(1);
    expect(backend.writes.filter((path) => path.startsWith('progress/'))).toHaveLength(1);
  });

  it('retry repairs a failed evidence write without duplicating progress', async () => {
    backend.failCollection = 'learningEvidence'; backend.failures = 1;
    await expect(save()).rejects.toThrow();
    await save();
    expect(documents('learningEvidence')).toHaveLength(2);
    expect(getProgress(student.id).totalActivities).toBe(1);
  });

  it('games still save when official grade writes are forbidden', async () => {
    backend.failCollection = 'grades'; backend.failures = 100;
    await save();
    expect(documents('grades')).toHaveLength(0);
    await save();
    expect(documents('grades')).toHaveLength(0);
    expect(getProgress(student.id).totalActivities).toBe(1);
  });

  it('reopening with an empty client cache keeps the remote deduplication', async () => {
    await save(); clearProgressCache(); await save();
    expect(getProgress(student.id).totalActivities).toBe(1);
    expect(documents('learningEvidence')).toHaveLength(2);
  });

  it('simultaneous independent media completions preserve both activities', async () => {
    await Promise.all(['one', 'two'].map((key) => trackMediaClick(student.id, 'p1', 2, 'fun', key, key)));
    clearProgressCache();
    await trackMediaClick(student.id, 'p1', 2, 'fun', 'one', 'one');
    expect(getProgress(student.id).totalActivities).toBe(2);
  });

  it('separates two subjects and does not file evidence under an unrelated indicator', async () => {
    const middle = { ...student, id: 'ม.1_901_QA', classroom: 'ม.1' };
    await recordGameProgress('quick-answer', 'QA quiz', [middle], 10, 'round');
    const evidence = documents('learningEvidence');
    expect(evidence).toHaveLength(4);
    expect(evidence.filter((item) => item.subject === 'cs')).toHaveLength(2);
    expect(evidence.filter((item) => item.subject === 'dt')).toHaveLength(2);
    expect(evidence.every((item) => item.indicatorId)).toBe(true);
    expect(new Set(evidence.map((item) => item.id)).size).toBe(4);
  });

  it('rejects admin and visitor accounts without writing grades or evidence', async () => {
    const result = await recordGameProgress('stroop-color', 'QA', [
      { ...student, id: 'admin_teacher_account', accountType: 'admin' },
      { ...student, id: 'external_visitor_QA', accountType: 'external' },
    ], 20, undefined, 40);
    expect(result.saved).toBe(0);
    expect(backend.writes).toHaveLength(0);
  });

  it('deduplicates the same student supplied twice in partner mode', async () => {
    await recordGameProgress('stroop-color', 'QA', [student, student], 20, undefined, 40);
    expect(getProgress(student.id).totalActivities).toBe(1);
    expect(documents('learningEvidence')).toHaveLength(2);
  });

  it('a game without a curriculum target cannot create or claim a saved grade', async () => {
    const result = await recordGameProgress('binary', 'QA Binary', [student], 10);
    expect(result).toEqual({ saved: 0, students: 0 });
    expect(backend.writes).toHaveLength(0);
  });

  it('partner mode writes only to eligible students, never the visitor', async () => {
    const result = await recordGameProgress('stroop-color', 'QA', [student,
      { ...student, id: 'external_visitor_QA', accountType: 'external' },
    ], 20, undefined, 40);
    expect(result.students).toBe(1);
    expect(documents('learningEvidence').every((item) => item.studentId === student.id)).toBe(true);
  });

  it('a student sync cannot overwrite newer teacher edits or another student', async () => {
    await save();
    const path = `grades/${student.classroom}`;
    const data = { students: loadGrades(student.classroom).filter(row => row.studentNo === 901) };
    backend.docs.set(path, data);
    const existing = structuredClone((data.students as StudentGrade[])[0]);
    const indicatorId = Object.keys(existing.indicators)[0];
    const remote = { ...existing, finalExam: 12, comment: 'Teacher verified' };
    remote.indicators[indicatorId] = { ...remote.indicators[indicatorId],
      teacherK: 5, teacherPScore: 18, teacherA: false, manualK: 2, manualPScore: 4, note: 'Keep', updatedAt: 1 };
    const other = { ...existing, studentCode: 'other', studentNo: 902, name: 'QA other', finalExam: 30 };
    backend.docs.set(path, { ...data, students: [remote, other] });
    const stale = structuredClone(existing);
    stale.finalExam = 30; stale.comment = 'Old comment'; stale.updatedAt = Date.now() + 100;
    stale.indicators[indicatorId] = { ...stale.indicators[indicatorId],
      teacherK: 15, teacherPScore: 30, teacherA: true, manualK: 8, manualPScore: 20, note: 'Old', updatedAt: Date.now() + 100 };
    cacheGradesLocally(student.classroom, [stale]);
    await upsertStudentGradeToFirebase(student.classroom, loadGrades(student.classroom)[0]);
    const rows = backend.docs.get(path)!.students as StudentGrade[];
    expect(rows[0]).toMatchObject({ finalExam: 12, comment: 'Teacher verified' });
    expect(rows[0].indicators[indicatorId]).toMatchObject({ teacherK: 5, teacherPScore: 18, teacherA: false, manualK: 2, manualPScore: 4, note: 'Keep' });
    expect(rows[1]).toEqual(other);
  });

  it('failed evidence is not presented as a confirmed local record', async () => {
    const input = { studentId: student.id, studentName: student.name, classroom: student.classroom,
      subject: 'main', source: 'game', domain: 'P', title: 'QA', inClass: true, occurredAt: 1,
      dedupKey: 'raw-replace', score: 8 } satisfies Omit<LearningEvidence, 'id' | 'createdAt'>;
    backend.failCollection = 'learningEvidence'; backend.failures = 1;
    await expect(recordLearningEvidence(input)).rejects.toThrow();
    expect(loadLearningEvidence()).toHaveLength(0);
    await recordLearningEvidence({ ...input, maxScore: 10 });
    await recordLearningEvidence(input);
    expect(backend.docs.get(`learningEvidence/${makeEvidenceId(input)}`)).not.toHaveProperty('maxScore');
  });
});
