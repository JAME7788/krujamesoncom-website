import { beforeEach, describe, expect, it } from 'vitest';
import {
  cacheGradesLocally, computeBreakdown, computeGrade, exportToCSV, fetchClassroomFromFirebase, getFinalExamScore, getIndicators, getSubjectsForClassroom,
  initClassroom, loadGrades, mergeIndicatorForTest, mergeRemoteWithLocalGrades,
  mergeStudentGradeForTest, updateFinalExam, updateTeacherKnowledgeScore,
  type IndicatorScore, type StudentGrade,
} from '../src/services/gradeService';
import { getClassroomExportSummary, generateClassroomCsv, generateMasterAllClassroomsCsv } from '../src/services/gradeExportService';

beforeEach(() => {
  const data = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
    removeItem: (key: string) => data.delete(key), clear: () => data.clear(),
  } });
});
const indicator = (patch: Partial<IndicatorScore> = {}): IndicatorScore => ({
  k: 0, maxK: 15, p: 'พอใช้', a: false, updatedAt: 1, ...patch,
});
const student = (code: string, patch: Partial<StudentGrade> = {}): StudentGrade => ({
  studentCode: code, studentNo: 1, name: 'นักเรียนทดสอบ', classroom: 'ป.1', emoji: '', indicators: {}, updatedAt: 1, ...patch,
});
describe('grade integrity regressions', () => {
  it('preserves legacy primary raw /30 marks and scales once; new /15 edits are never scaled twice', () => {
    initClassroom('ป.1');
    const rows = loadGrades('ป.1'); rows[0].finalExam = 28;
    cacheGradesLocally('ป.1', rows);
    expect(getFinalExamScore(rows[0], 'ป.1')).toBe(14);
    expect(loadGrades('ป.1')[0].finalExam).toBe(28);
    updateFinalExam('ป.1', rows[0].studentCode, 12);
    const edited = loadGrades('ป.1')[0];
    expect(edited.finalExamMax).toBe(15);
    expect(getFinalExamScore(edited, 'ป.1')).toBe(12);
    const merged = mergeStudentGradeForTest(rows[0], edited);
    expect(getFinalExamScore(merged, 'ป.1')).toBe(12);
    expect(edited.gradingPolicyVersion).toBe('school-2569-v1');
  });

  it('primary exports are /50 and pending annual results are not counted as passes or failures', () => {
    initClassroom('ป.1');
    const summary = getClassroomExportSummary('ป.1');
    expect(summary.rows.every(r => r.grade === 'รอผลทั้งปี' && !r.isPassed && r.finalExam === '')).toBe(true);
    expect(summary.stats).toMatchObject({ passCount: 0, failCount: 0, evaluatedStudents: 0 });
    expect(generateClassroomCsv('ป.1')).toContain('คะแนนเก็บ (35)');
    expect(generateClassroomCsv('ป.1')).toContain('คะแนนรวม (50)');
    expect(generateMasterAllClassroomsCsv()).toContain('คะแนนเต็ม,ปีการศึกษา,ภาคเรียน,รุ่นเกณฑ์');
  });

  it('secondary grade waits for missing exams and evaluations while explicit zeros count as assessed', () => {
    const row = student('secondary', { classroom: 'ม.1', finalExam: 30 });
    expect(computeGrade(row, 'ม.1')).toBe('คะแนนยังไม่ครบ');
    row.midtermExam = 0;
    row.indicators = Object.fromEntries(getIndicators('ม.1').map(i => [i.id, indicator({ teacherK: 0, pAssessed: true, aAssessed: true })]));
    expect(computeGrade(row, 'ม.1')).toBe('0');
  });
  it('an unavailable cloud must never restore hardcoded ป.1 scores', async () => {
    initClassroom('ป.1');
    const rows = loadGrades('ป.1'); rows[0].finalExam = 7;
    cacheGradesLocally('ป.1', rows);
    expect(await fetchClassroomFromFirebase('ป.1')).toBeNull();
    expect(loadGrades('ป.1')[0].finalExam).toBe(7);
  });
  it('opening real ป.1 scores of K15 and exam28 never resets any student or writes storage', () => {
    initClassroom('ป.1');
    const rows = loadGrades('ป.1');
    rows[0].finalExam = 28;
    rows[0].indicators[getIndicators('ป.1')[0].id].k = 15;
    rows[1].finalExam = 7;
    cacheGradesLocally('ป.1', rows);
    const before = localStorage.getItem('krujames_grades_v1_ป.1');
    const reloaded = loadGrades('ป.1');
    expect(reloaded.find(s => s.studentCode === rows[0].studentCode)?.finalExam).toBe(28);
    expect(reloaded.find(s => s.studentCode === rows[1].studentCode)?.finalExam).toBe(7);
    expect(localStorage.getItem('krujames_grades_v1_ป.1')).toBe(before);
  });

  it('a cleared K override survives JSON, both merge directions, and later activity timestamps', () => {
    const old = indicator({ teacherK: 15, teacherKUpdatedAt: 10, updatedAt: 9999 });
    const cleared = JSON.parse(JSON.stringify(indicator({ teacherKUpdatedAt: 20, webK: 8, updatedAt: 20 })));
    for (const result of [mergeIndicatorForTest(old, cleared), mergeIndicatorForTest(cleared, old)]) {
      expect(result.teacherK).toBeUndefined(); expect(result.k).toBe(8);
      expect(result.teacherKUpdatedAt).toBe(20);
    }
    expect(mergeIndicatorForTest(cleared, indicator({ teacherK: 0, teacherKUpdatedAt: 21 })).teacherK).toBe(0);
  });

  it('actual edit functions persist a clear marker for K and exam', () => {
    initClassroom('ม.1');
    const row = loadGrades('ม.1')[0]; const id = getIndicators('ม.1')[0].id;
    updateTeacherKnowledgeScore('ม.1', row.studentCode, id, 15);
    updateFinalExam('ม.1', row.studentCode, 28);
    const old = loadGrades('ม.1')[0];
    updateTeacherKnowledgeScore('ม.1', row.studentCode, id, null);
    updateFinalExam('ม.1', row.studentCode, null);
    const cleared = loadGrades('ม.1')[0];
    expect(mergeIndicatorForTest(old.indicators[id], cleared.indicators[id]).teacherK).toBeUndefined();
    for (const result of [mergeStudentGradeForTest(old, cleared), mergeStudentGradeForTest(cleared, old)]) {
      expect(result.finalExam).toBeUndefined();
      expect(result.finalExamUpdatedAt).toBe(cleared.finalExamUpdatedAt);
    }
  });

  it('keeps local-only and remote-only students even with the same name and number', () => {
    const remote = student('remote', { finalExam: 28 });
    const local = student('local', { finalExam: 7 });
    const result = mergeRemoteWithLocalGrades([remote], [local]);
    expect(result.map(s => [s.studentCode, s.finalExam])).toEqual([['remote', 28], ['local', 7]]);
    expect(mergeRemoteWithLocalGrades(result, [local])).toHaveLength(2);
  });

  for (const classroom of ['ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6', 'ม.1', 'ม.2', 'ม.3']) {
    for (const subject of getSubjectsForClassroom(classroom)) {
      it(`full weighted marks follow school templates for ${classroom}/${subject.id}`, () => {
        const row = student('full', { finalExam: 30, midtermExam: 15, indicators: Object.fromEntries(getIndicators(classroom, subject.id).map(i => [i.id,
          indicator({ k: i.maxScore, p: 'ดี', a: true, pAssessed: true, aAssessed: true, practicePassed: true }),
        ])) });
        expect(computeBreakdown(row, classroom, subject.id)).toMatchObject(classroom.startsWith('ป.') ? { k: 21, p: 8.75, a: 5.25, collected: 35, total: 50 } : { k: 33, p: 13.75, a: 8.25, collected: 55, total: 100 });
      });
    }
  }

  it('CSV labels match weights and preserves blank exams separately from zero', () => {
    initClassroom('ม.1'); const rows = loadGrades('ม.1');
    rows[0].finalExam = undefined; rows[1].finalExam = 0; cacheGradesLocally('ม.1', rows);
    const lines = exportToCSV('ม.1').trim().split('\n');
    expect(lines[0]).toContain('คะแนนเก็บ K (33),คะแนน P (13.75),คะแนน A (8.25)');
    const index = lines[0].split(',').findIndex(c => c.startsWith('สอบปลายภาค'));
    expect(lines[1].split(',')[index]).toBe(''); expect(lines[2].split(',')[index]).toBe('0');
  });
});
