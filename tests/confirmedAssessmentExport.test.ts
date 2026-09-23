import { beforeEach, describe, expect, it } from 'vitest';
import { getConfirmedAssessmentScore, makeClassroomAssessmentId, saveClassroomAssessment, type ClassroomAssessment } from '../src/services/studentAssessmentService';
import { getStudentAssessmentTemplate } from '../src/data/studentAssessmentTemplates';
import { generateSchoolMisCsv } from '../src/services/gradeExportService';
import { cacheGradesLocally, getIndicators, initClassroom, loadGrades } from '../src/services/gradeService';
beforeEach(() => {
  const data = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value),
  } });
});
const fixture = (value = 3): ClassroomAssessment => ({
  id: makeClassroomAssessmentId('ม.1', '2569', '1', 'literacy'),
  classroom: 'ม.1', academicYear: '2569', term: '1', kind: 'literacy', contextKey: 'main',
  confirmedByTeacher: true, provisional: false, meta: { status: 'complete' }, updatedAt: 1, updatedBy: 'teacher',
  entries: { student: { studentCode: 'student', studentName: 'QA', studentNo: 1, note: '', supportPlan: '', evidence: '',
    scores: Object.fromEntries(getStudentAssessmentTemplate('literacy').categories.map(c => [c.id, value])),
  } },
});
const put = (record: ClassroomAssessment) => localStorage.setItem(`krujames_student_assessment_v1:${record.id}`, JSON.stringify(record));
const result = () => getConfirmedAssessmentScore('ม.1', '2569', '1', 'literacy', 'student');
describe('confirmed assessment exports', () => {
  it('blocks registry exports when annual marks or confirmed assessments are missing', () => {
    expect(() => generateSchoolMisCsv('ป.1')).toThrow('ยังส่ง SchoolMIS ไม่ได้');
  });
  it('allows a complete secondary class using confirmed evaluations, including a genuine failed evaluation', () => {
    initClassroom('ม.1', 'cs');
    const rows = loadGrades('ม.1', 'cs');
    rows.forEach(row => {
      row.midtermExam = 15; row.finalExam = 30;
      getIndicators('ม.1', 'cs').forEach(i => {
        row.indicators[i.id] = { k: 15, maxK: 15, p: 'ดี', a: true, pAssessed: true, aAssessed: true, updatedAt: 1 };
      });
    });
    cacheGradesLocally('ม.1', rows, 'cs');
    for (const kind of ['literacy', 'competencies', 'desirable-attributes'] as const) {
      const record = fixture(); record.kind = kind;
      record.id = makeClassroomAssessmentId('ม.1', '2569', '1', kind);
      record.entries = Object.fromEntries(rows.map(row => [row.studentCode, { ...fixture().entries.student, studentCode: row.studentCode,
        scores: Object.fromEntries(getStudentAssessmentTemplate(kind).categories.map(c => [c.id, 0])),
      }]));
      put(record);
    }
    const csv = generateSchoolMisCsv('ม.1', 'cs');
    expect(csv).toContain('รหัสประจำตัว,เลขที่');
    expect(csv).toContain(',100,4,0,0,0');
  });
  it('uses actual confirmed assessments including zero', () => {
    expect(result()).toBeNull(); put(fixture(3)); expect(result()).toBe(3);
    put(fixture(0)); expect(result()).toBe(0);
  });
  it('does not export drafts, partial assessments, or another period', () => {
    const record = fixture(); record.confirmedByTeacher = false; put(record); expect(result()).toBeNull();
    record.confirmedByTeacher = true; record.term = '2'; put(record); expect(result()).toBeNull();
    record.term = '1'; delete record.entries.student.scores[getStudentAssessmentTemplate('literacy').categories[0].id];
    put(record); expect(result()).toBeNull();
  });
  it('does not retain a local confirmation when cloud saving fails', async () => {
    await expect(saveClassroomAssessment(fixture())).rejects.toThrow();
    expect(result()).toBeNull();
  });
});
