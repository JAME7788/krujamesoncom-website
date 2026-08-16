import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpenCheck,
  Check,
  ChevronRight,
  ClipboardCheck,
  FileDown,
  Info,
  ListChecks,
  Loader2,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  calculateAssessmentResult,
  getStudentAssessmentTemplate,
  studentAssessmentTemplates,
  type StudentAssessmentKind,
} from '../data/studentAssessmentTemplates';
import type { StudentInfo } from '../data/students2569';
import type { TechnologyGradeId } from '../data/technologyTeachingSchedule';
import { COURSE_TEACHER_NAME, applyPostLessonAssessmentToGrades } from '../services/gradeService';
import { fetchRostersFromFirebase, loadAllRosters } from '../services/rosterService';
import {
  fetchTeachingSessions,
  type TeachingSession,
} from '../services/teachingSessionService';
import {
  fetchClassroomAssessmentFromFirebase,
  loadClassroomAssessment,
  makeClassroomAssessmentId,
  saveClassroomAssessment,
  type ClassroomAssessment,
  type StudentAssessmentEntry,
} from '../services/studentAssessmentService';
import { buildLessonRecordDraft } from '../services/lessonRecordDraftGenerator';
import { useToast } from './Toast';
import './StudentAssessmentHub.css';

type SaveState = 'idle' | 'loading' | 'saving' | 'saved' | 'error';

const todayKey = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const gradeIdFromClassroom = (classroom: string): TechnologyGradeId | null => {
  const match = classroom.match(/^([ปม])\.(\d)$/);
  if (!match) return null;
  return `${match[1] === 'ป' ? 'p' : 'm'}${match[2]}` as TechnologyGradeId;
};

const makeEntry = (student: StudentInfo, current?: StudentAssessmentEntry): StudentAssessmentEntry => ({
  studentCode: student.studentCode,
  studentNo: student.no,
  studentName: student.name,
  scores: current?.scores || {},
  note: current?.note || '',
  supportPlan: current?.supportPlan || '',
  evidence: current?.evidence || '',
});

const mergeRosterEntries = (
  roster: StudentInfo[],
  entries: Record<string, StudentAssessmentEntry> = {},
): Record<string, StudentAssessmentEntry> => Object.fromEntries(
  roster.map((student) => [
    student.studentCode,
    makeEntry(student, entries[student.studentCode]),
  ]),
);

const emptyAssessment = (
  classroom: string,
  academicYear: string,
  term: string,
  kind: StudentAssessmentKind,
  contextKey: string,
  roster: StudentInfo[],
): ClassroomAssessment => ({
  id: makeClassroomAssessmentId(classroom, academicYear, term, kind, contextKey),
  classroom,
  academicYear,
  term,
  kind,
  contextKey,
  entries: mergeRosterEntries(roster),
  meta: kind === 'post-lesson' ? {
    subjectName: 'เทคโนโลยี',
    teachingDate: contextKey.split('__')[0],
    planNo: contextKey.split('__')[1]?.replace('plan-', '') || '1',
    status: 'draft',
  } : {},
  ...(kind === 'post-lesson' ? { provisional: true, confirmedByTeacher: false } : {}),
  updatedAt: Date.now(),
  updatedBy: COURSE_TEACHER_NAME,
});

const resultToneClass = (tone: string) => `sah-result-${tone}`;

const StudentAssessmentHub: React.FC = () => {
  const { show: showToast } = useToast();
  const [rosters, setRosters] = useState<Record<string, StudentInfo[]>>(loadAllRosters());
  const [classroom, setClassroom] = useState('ป.1');
  const [academicYear, setAcademicYear] = useState('2569');
  const [term, setTerm] = useState('1');
  const [kind, setKind] = useState<StudentAssessmentKind>('learner-analysis');
  const [lessonDate, setLessonDate] = useState(todayKey());
  const [lessonNo, setLessonNo] = useState('1');
  const [assessment, setAssessment] = useState<ClassroomAssessment | null>(null);
  const [selectedCode, setSelectedCode] = useState('');
  const [search, setSearch] = useState('');
  const [showGuidance, setShowGuidance] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [bulkBusy, setBulkBusy] = useState(false);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [bulkCategory, setBulkCategory] = useState('knowledge');
  const [bulkScore, setBulkScore] = useState(3);
  const [teachingSessions, setTeachingSessions] = useState<TeachingSession[]>([]);
  const dirtyRef = useRef(false);
  const loadSequenceRef = useRef(0);

  const template = useMemo(() => getStudentAssessmentTemplate(kind), [kind]);
  const classrooms = useMemo(
    () => Object.keys(rosters).sort((a, b) => a.localeCompare(b, 'th', { numeric: true })),
    [rosters],
  );
  const roster = useMemo(() => rosters[classroom] || [], [classroom, rosters]);
  const postLessonPlans = useMemo(() => teachingSessions.filter((session) => {
    const inSelectedTerm = term === 'ทั้งปี' || String(session.semester) === term;
    const hasStartedClass = session.status === 'completed'
      || session.status === 'in_progress'
      || session.status === 'makeup';
    return inSelectedTerm && hasStartedClass;
  }), [teachingSessions, term]);
  const selectedPostSession = useMemo(
    () => postLessonPlans.find((item) => String(item.period) === lessonNo),
    [lessonNo, postLessonPlans],
  );
  const contextKey = kind === 'post-lesson' ? `${lessonDate}__plan-${lessonNo || '1'}` : 'main';

  useEffect(() => {
    void fetchRostersFromFirebase().then((remote) => {
      setAssessment(null);
      setRosters(remote);
      setClassroom((current) => remote[current] ? current : (Object.keys(remote)[0] || 'ป.1'));
    });
  }, []);

  useEffect(() => {
    const gradeId = gradeIdFromClassroom(classroom);
    let active = true;
    const request = gradeId ? fetchTeachingSessions(gradeId) : Promise.resolve([]);
    void request.then((items) => {
      if (active) setTeachingSessions(items);
    });
    return () => { active = false; };
  }, [classroom]);

  useEffect(() => {
    if (kind !== 'post-lesson' || postLessonPlans.length === 0) return;
    if (postLessonPlans.some((item) => String(item.period) === lessonNo)) return;
    const latest = postLessonPlans[postLessonPlans.length - 1];
    const timer = window.setTimeout(() => {
      setLessonNo(String(latest.period));
      setLessonDate(latest.teachingDate || latest.plannedDate);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [kind, lessonNo, postLessonPlans]);

  useEffect(() => {
    const sequence = ++loadSequenceRef.current;
    dirtyRef.current = false;
    void loadClassroomAssessment(classroom, academicYear, term, kind, contextKey)
      .then((stored) => {
        if (sequence !== loadSequenceRef.current) return;
        const base = stored || emptyAssessment(classroom, academicYear, term, kind, contextKey, roster);
        const next: ClassroomAssessment = {
          ...base,
          id: makeClassroomAssessmentId(classroom, academicYear, term, kind, contextKey),
          classroom,
          academicYear,
          term,
          kind,
          contextKey,
          ...(kind === 'post-lesson' && selectedPostSession
            ? { sessionId: selectedPostSession.id, archived: false }
            : {}),
          entries: mergeRosterEntries(roster, base.entries),
          meta: {
            ...base.meta,
            ...(kind === 'post-lesson' ? {
              teachingDate: lessonDate,
              planNo: lessonNo,
              unitName: selectedPostSession?.unitTitle || base.meta.unitName,
              lessonTitle: selectedPostSession?.lessonTitle || base.meta.lessonTitle,
            } : {}),
          },
        };
        setAssessment(next);
        setSelectedCode((current) => (
          roster.some((student) => student.studentCode === current)
            ? current
            : roster[0]?.studentCode || ''
        ));
        setSaveState(stored ? 'saved' : 'idle');
      })
      .catch((error) => {
        if (sequence !== loadSequenceRef.current) return;
        setAssessment(emptyAssessment(classroom, academicYear, term, kind, contextKey, roster));
        setSaveState('error');
        showToast(`โหลดแบบประเมินไม่สำเร็จ: ${error instanceof Error ? error.message : String(error)}`, 'error');
      });
  }, [academicYear, classroom, contextKey, kind, lessonDate, lessonNo, roster, selectedPostSession, showToast, term]);

  const persist = useCallback(async (value: ClassroomAssessment, silent = false) => {
    setSaveState('saving');
    try {
      const shouldConfirmPostLesson = value.kind === 'post-lesson' && value.meta.status === 'complete';
      const prepared: ClassroomAssessment = value.kind === 'post-lesson'
        ? {
          ...value,
          confirmedByTeacher: shouldConfirmPostLesson,
          provisional: !shouldConfirmPostLesson,
        }
        : value;
      const saved = await saveClassroomAssessment(prepared);
      const gradeSync = shouldConfirmPostLesson
        ? applyPostLessonAssessmentToGrades(saved, selectedPostSession)
        : null;
      setAssessment((current) => current?.id === saved.id ? { ...current, ...saved } : current);
      dirtyRef.current = false;
      setSaveState('saved');
      if (!silent) {
        const suffix = gradeSync && gradeSync.studentsUpdated > 0
          ? ` และเพิ่มคะแนนเก็บให้ ${gradeSync.studentsUpdated} คน`
          : '';
        showToast(`บันทึกแบบประเมินลง Firebase แล้ว${suffix}`, 'success');
      }
    } catch (error) {
      setSaveState('error');
      if (!silent) {
        showToast(`บันทึกออนไลน์ไม่สำเร็จ: ${error instanceof Error ? error.message : String(error)}`, 'error');
      }
    }
  }, [selectedPostSession, showToast]);

  /** เติมร่างของคาบที่เลือกอยู่ ลงในฟอร์มให้ครูอ่านแล้วแก้ ยังไม่บันทึกจนกว่าครูจะกดบันทึก */
  const fillDraftForCurrent = () => {
    if (!assessment || !selectedPostSession) return;
    const draft = buildLessonRecordDraft({
      gradeId: gradeIdFromClassroom(classroom) || 'p1',
      unitTitle: selectedPostSession.unitTitle,
      lessonTitle: selectedPostSession.lessonTitle,
      teachingDate: lessonDate,
      planNo: selectedPostSession.period,
      week: selectedPostSession.week,
      totalStudents: roster.length,
    });
    changeAssessment((current) => ({
      ...current,
      meta: { ...current.meta, ...draft },
    }));
    showToast('เติมร่างจากหัวข้อแผนแล้ว — ครูแก้ให้ตรงกับที่สอนจริงก่อนบันทึก', 'info');
  };

  /**
   * เติมร่างให้ทุกคาบที่สอนไปแล้วของห้องนี้ในครั้งเดียว
   * ข้ามคาบที่ครูเขียนไว้แล้ว เพื่อไม่ให้ทับงานที่ครูทำเอง
   */
  const fillDraftForAllTaught = async () => {
    const gradeId = gradeIdFromClassroom(classroom);
    if (!gradeId || postLessonPlans.length === 0) return;
    setBulkBusy(true);
    let created = 0;
    let skipped = 0;
    try {
      for (const session of postLessonPlans) {
        const date = session.teachingDate || session.plannedDate;
        const key = `${date}__plan-${session.period}`;
        const stored = await loadClassroomAssessment(classroom, academicYear, term, kind, key);
        // มีของเดิมที่ครูเขียนไว้แล้ว ไม่ทับ
        if (stored?.meta?.strengths) { skipped += 1; continue; }
        const base = stored
          || emptyAssessment(classroom, academicYear, term, kind, key, roster);
        await saveClassroomAssessment({
          ...base,
          meta: {
            ...base.meta,
            ...buildLessonRecordDraft({
              gradeId,
              unitTitle: session.unitTitle,
              lessonTitle: session.lessonTitle,
              teachingDate: date,
              planNo: session.period,
              week: session.week,
              totalStudents: roster.length,
            }),
          },
          updatedAt: Date.now(),
        });
        created += 1;
      }
      showToast(
        `เติมร่าง ${created} คาบของ ${classroom} แล้ว${skipped ? ` (ข้าม ${skipped} คาบที่ครูเขียนไว้แล้ว)` : ''}`,
        'success',
      );
    } catch (error) {
      showToast(`เติมร่างไม่สำเร็จ: ${error instanceof Error ? error.message : String(error)}`, 'error');
    } finally {
      setBulkBusy(false);
    }
  };

  const handleFetchFromFirebase = async () => {
    setCloudLoading(true);
    try {
      const stored = await fetchClassroomAssessmentFromFirebase(
        classroom,
        academicYear,
        term,
        kind,
        contextKey,
      );
      if (!stored) {
        showToast('ไม่พบแบบประเมินฉบับออนไลน์สำหรับรายการนี้', 'info');
        return;
      }
      const next: ClassroomAssessment = {
        ...stored,
        id: makeClassroomAssessmentId(classroom, academicYear, term, kind, contextKey),
        classroom,
        academicYear,
        term,
        kind,
        contextKey,
        ...(kind === 'post-lesson' && selectedPostSession
          ? { sessionId: selectedPostSession.id, archived: false }
          : {}),
        entries: mergeRosterEntries(roster, stored.entries),
        meta: {
          ...stored.meta,
          ...(kind === 'post-lesson' ? {
            teachingDate: lessonDate,
            planNo: lessonNo,
            unitName: selectedPostSession?.unitTitle || stored.meta.unitName,
            lessonTitle: selectedPostSession?.lessonTitle || stored.meta.lessonTitle,
          } : {}),
        },
      };
      dirtyRef.current = false;
      setAssessment(next);
      setSelectedCode((current) => (
        roster.some((student) => student.studentCode === current)
          ? current
          : roster[0]?.studentCode || ''
      ));
      setSaveState('saved');
      showToast('ดึงแบบประเมินฉบับล่าสุดจาก Firebase แล้ว', 'success');
    } catch (error) {
      showToast(
        `ดึงข้อมูลออนไลน์ไม่สำเร็จ: ${error instanceof Error ? error.message : String(error)}`,
        'error',
      );
    } finally {
      setCloudLoading(false);
    }
  };

  useEffect(() => {
    if (!assessment || !dirtyRef.current) return;
    const timer = window.setTimeout(() => {
      void persist(assessment, true);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [assessment, persist]);

  const handleKindChange = (nextKind: StudentAssessmentKind) => {
    const nextTemplate = getStudentAssessmentTemplate(nextKind);
    const latestPlan = postLessonPlans[postLessonPlans.length - 1];
    if (nextKind === 'post-lesson' && latestPlan) {
      setLessonNo(String(latestPlan.period));
      setLessonDate(latestPlan.teachingDate || latestPlan.plannedDate);
    }
    setAssessment(null);
    setSaveState('idle');
    setKind(nextKind);
    setBulkCategory(nextTemplate.categories[0]?.id || '');
    setShowGuidance(false);
  };

  const changeAssessment = useCallback((updater: (current: ClassroomAssessment) => ClassroomAssessment) => {
    dirtyRef.current = true;
    setSaveState('idle');
    setAssessment((current) => current ? updater(current) : current);
  }, []);

  const updateEntry = useCallback((
    studentCode: string,
    updater: (entry: StudentAssessmentEntry) => StudentAssessmentEntry,
  ) => {
    changeAssessment((current) => ({
      ...current,
      entries: {
        ...current.entries,
        [studentCode]: updater(current.entries[studentCode]),
      },
      updatedBy: COURSE_TEACHER_NAME,
    }));
  }, [changeAssessment]);

  const setScore = (studentCode: string, categoryId: string, value: number) => {
    updateEntry(studentCode, (entry) => ({
      ...entry,
      scores: { ...entry.scores, [categoryId]: value },
    }));
  };

  const applyBulkScore = () => {
    if (!bulkCategory || roster.length === 0) return;
    changeAssessment((current) => ({
      ...current,
      entries: Object.fromEntries(
        Object.entries(current.entries).map(([studentCode, entry]) => [
          studentCode,
          { ...entry, scores: { ...entry.scores, [bulkCategory]: bulkScore } },
        ]),
      ),
      updatedBy: COURSE_TEACHER_NAME,
    }));
    showToast(`กำหนด ${template.categories.find((item) => item.id === bulkCategory)?.shortTitle || ''} ให้ทั้งห้องแล้ว`, 'success');
  };

  const selectedEntry = assessment?.entries[selectedCode];
  const selectedResult = selectedEntry ? calculateAssessmentResult(kind, selectedEntry.scores) : null;
  const filteredRoster = useMemo(() => roster.filter((student) => (
    !search
    || student.name.toLocaleLowerCase('th').includes(search.toLocaleLowerCase('th'))
    || student.studentCode.includes(search)
    || String(student.no).includes(search)
  )), [roster, search]);

  const classSummary = useMemo(() => {
    if (!assessment) return { evaluated: 0, passed: 0, needSupport: 0, average: 0 };
    const results = roster
      .map((student) => calculateAssessmentResult(kind, assessment.entries[student.studentCode]?.scores || {}))
      .filter((result) => result.completed > 0);
    const passed = results.filter((result) => result.passed).length;
    return {
      evaluated: results.length,
      passed,
      needSupport: results.length - passed,
      average: results.length
        ? Math.round(results.reduce((sum, result) => sum + result.percent, 0) / results.length)
        : 0,
    };
  }, [assessment, kind, roster]);

  const categorySummary = useMemo(() => template.categories.map((category) => {
    const values = roster
      .map((student) => assessment?.entries[student.studentCode]?.scores[category.id])
      .filter((value): value is number => Number.isFinite(value));
    return {
      ...category,
      evaluated: values.length,
      good: values.filter((value) => value >= (kind === 'post-lesson' ? 3 : 2)).length,
      supportNames: roster
        .filter((student) => {
          const score = assessment?.entries[student.studentCode]?.scores[category.id];
          return kind === 'post-lesson' ? score === 1 : score === 0;
        })
        .map((student) => `${student.no}. ${student.name}`),
    };
  }), [assessment, kind, roster, template.categories]);

  const effectiveSaveState: SaveState = assessment ? saveState : 'loading';
  const saveLabel = {
    idle: 'รอบันทึกอัตโนมัติ',
    loading: 'กำลังดึงข้อมูล...',
    saving: 'กำลังบันทึก...',
    saved: 'บันทึกแล้ว',
    error: 'บันทึกออนไลน์ไม่สำเร็จ',
  }[effectiveSaveState];

  return (
    <section className="student-assessment-hub">
      <header className="sah-header">
        <div>
          <span className="sah-eyebrow"><BookOpenCheck size={16} /> ระบบเอกสารประจำชั้นเรียน</span>
          <h2>แบบประเมินและบันทึกหลังสอน</h2>
          <p>ใช้โครงสร้างจากเอกสารอ้างอิง แต่จัดทำเกณฑ์และแบบฟอร์มใหม่สำหรับโรงเรียนนี้โดยเฉพาะ</p>
        </div>
        <div className={`sah-save-state is-${effectiveSaveState}`}>
          {effectiveSaveState === 'saving' || effectiveSaveState === 'loading'
            ? <RefreshCw size={16} className="spin" />
            : <Check size={16} />}
          <span>{saveLabel}</span>
        </div>
      </header>

      <div className="sah-controls">
        <label>ชั้นเรียน
          <select value={classroom} onChange={(event) => {
            const nextClassroom = event.target.value;
            setAssessment(null);
            setSaveState('idle');
            setClassroom(nextClassroom);
            setLessonNo('');
          }}>
            {classrooms.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>ปีการศึกษา
          <input value={academicYear} inputMode="numeric" onChange={(event) => {
            setAssessment(null);
            setSaveState('idle');
            setAcademicYear(event.target.value);
          }} />
        </label>
        <label>ภาคเรียน
          <select value={term} onChange={(event) => {
            setAssessment(null);
            setSaveState('idle');
            setTerm(event.target.value);
          }}>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="ทั้งปี">ทั้งปี</option>
          </select>
        </label>
        {kind === 'post-lesson' && (
          <>
            <label>แผนหลังสอน ({postLessonPlans.length} คาบที่เริ่มสอนแล้ว)
              <select value={lessonNo} onChange={(event) => {
                const selected = postLessonPlans.find((item) => String(item.period) === event.target.value);
                setAssessment(null);
                setSaveState('idle');
                setLessonNo(event.target.value);
                if (selected) setLessonDate(selected.teachingDate || selected.plannedDate);
              }}>
                {postLessonPlans.map((item) => (
                  <option key={item.id} value={item.period}>
                    แผนที่ {item.period} — {item.lessonTitle}
                    {item.status === 'completed' ? ' · สอนแล้ว' : item.plannedDate === todayKey() ? ' · วันนี้' : ''}
                  </option>
                ))}
              </select>
            </label>
            <label>วันที่สอน
              <input type="date" value={lessonDate} onChange={(event) => {
                setAssessment(null);
                setSaveState('idle');
                setLessonDate(event.target.value);
              }} />
            </label>
          </>
        )}
        <button
          type="button"
          className="sah-button subtle"
          disabled={cloudLoading}
          onClick={() => void handleFetchFromFirebase()}
        >
          <RefreshCw size={16} className={cloudLoading ? 'spin' : ''} />
          {cloudLoading ? 'กำลังดึง...' : 'ดึงจาก Firebase'}
        </button>
        <button type="button" className="sah-button subtle" onClick={() => window.print()}>
          <FileDown size={16} /> พิมพ์/บันทึก PDF
        </button>
        <button
          type="button"
          className="sah-button primary"
          disabled={!assessment || saveState === 'saving'}
          onClick={() => assessment && void persist(assessment)}
        >
          <Save size={16} /> บันทึกทันที
        </button>
      </div>

      <nav className="sah-tabs" aria-label="เลือกแบบประเมิน">
        {studentAssessmentTemplates.map((item) => (
          <button
            type="button"
            key={item.id}
            className={kind === item.id ? 'active' : ''}
            onClick={() => handleKindChange(item.id)}
          >
            {item.id === 'post-lesson' ? <ClipboardCheck size={17} /> : <BookOpenCheck size={17} />}
            <span>{item.shortTitle}</span>
          </button>
        ))}
      </nav>

      <div className="sah-intro">
        <div>
          <h3>{template.title}</h3>
          <p>{template.description}</p>
        </div>
        <button type="button" onClick={() => setShowGuidance((value) => !value)}>
          <Info size={16} /> {showGuidance ? 'ซ่อนคำแนะนำ' : 'ดูหลักการประเมิน'}
        </button>
      </div>
      {showGuidance && <div className="sah-guidance">{template.guidance}</div>}

      {kind === 'post-lesson' && assessment && (
        <div className="sah-lesson-fields">
          <label>รายวิชา
            <input
              value={assessment.meta.subjectName || ''}
              onChange={(event) => changeAssessment((current) => ({ ...current, meta: { ...current.meta, subjectName: event.target.value } }))}
            />
          </label>
          <label>หน่วยการเรียนรู้
            <input
              value={assessment.meta.unitName || ''}
              placeholder="เช่น หน่วยที่ 1 การใช้เทคโนโลยี"
              onChange={(event) => changeAssessment((current) => ({ ...current, meta: { ...current.meta, unitName: event.target.value } }))}
            />
          </label>
          <label className="wide">เรื่องที่สอน
            <input
              value={assessment.meta.lessonTitle || ''}
              placeholder="ชื่อเรื่องของแผนรายชั่วโมง"
              onChange={(event) => changeAssessment((current) => ({ ...current, meta: { ...current.meta, lessonTitle: event.target.value } }))}
            />
          </label>
        </div>
      )}

      <div className="sah-kpis">
        <div><Users size={19} /><span>นักเรียน</span><strong>{roster.length}</strong></div>
        <div><ClipboardCheck size={19} /><span>ประเมินแล้ว</span><strong>{classSummary.evaluated}</strong></div>
        <div className="positive"><Check size={19} /><span>ผ่าน/พร้อม</span><strong>{classSummary.passed}</strong></div>
        <div className="attention"><Info size={19} /><span>ควรช่วยเหลือ</span><strong>{classSummary.needSupport}</strong></div>
        <div><Sparkles size={19} /><span>เฉลี่ยทั้งห้อง</span><strong>{classSummary.average}%</strong></div>
      </div>

      <div className="sah-bulk">
        <div>
          <strong>ตั้งคะแนนแบบเร็วทั้งห้อง</strong>
          <span>เลือกค่าพื้นฐานก่อน แล้วแก้เฉพาะนักเรียนที่แตกต่าง</span>
        </div>
        <select value={bulkCategory} onChange={(event) => setBulkCategory(event.target.value)}>
          {template.categories.map((category) => <option key={category.id} value={category.id}>{category.shortTitle}</option>)}
        </select>
        <select value={bulkScore} onChange={(event) => setBulkScore(Number(event.target.value))}>
          {template.scale.map((scale) => <option key={scale.value} value={scale.value}>{scale.value} — {scale.label}</option>)}
        </select>
        <button type="button" onClick={applyBulkScore} disabled={!assessment || roster.length === 0}>
          ใช้กับทั้งห้อง
        </button>
      </div>

      <div className="sah-workspace">
        <aside className="sah-roster">
          <div className="sah-search">
            <Search size={16} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาชื่อหรือเลขที่" />
          </div>
          <div className="sah-roster-list">
            {filteredRoster.map((student) => {
              const entry = assessment?.entries[student.studentCode];
              const result = calculateAssessmentResult(kind, entry?.scores || {});
              return (
                <button
                  type="button"
                  key={student.studentCode}
                  className={selectedCode === student.studentCode ? 'active' : ''}
                  onClick={() => setSelectedCode(student.studentCode)}
                >
                  <span className="sah-student-no">{student.no}</span>
                  <span className="sah-student-name">{student.name}</span>
                  <span className={`sah-mini-result ${resultToneClass(result.tone)}`}>
                    {result.completed ? `${result.percent}%` : 'ยังไม่กรอก'}
                  </span>
                  <ChevronRight size={15} />
                </button>
              );
            })}
            {filteredRoster.length === 0 && <p className="sah-empty">ไม่พบรายชื่อนักเรียน</p>}
          </div>
        </aside>

        <main className="sah-editor">
          {!assessment || saveState === 'loading' ? (
            <div className="sah-loading"><RefreshCw className="spin" /> กำลังดึงรายชื่อและผลประเมิน...</div>
          ) : selectedEntry ? (
            <>
              <div className="sah-student-header">
                <div className="sah-avatar">{selectedEntry.studentNo}</div>
                <div>
                  <span>{classroom} · เลขที่ {selectedEntry.studentNo}</span>
                  <h3>{selectedEntry.studentName}</h3>
                </div>
                {selectedResult && (
                  <div className={`sah-current-result ${resultToneClass(selectedResult.tone)}`}>
                    <strong>{selectedResult.percent}%</strong>
                    <span>{selectedResult.level}</span>
                    <small>{selectedResult.completed}/{selectedResult.categoryCount} ด้าน</small>
                  </div>
                )}
              </div>

              <div className="sah-category-list">
                {template.categories.map((category) => (
                  <article key={category.id} className="sah-category">
                    <div className="sah-category-copy">
                      <strong>{category.title}</strong>
                      <p>{category.description}</p>
                      {showGuidance && (
                        <ul>
                          {category.indicators.map((indicator) => <li key={indicator}>{indicator}</li>)}
                        </ul>
                      )}
                    </div>
                    <div className="sah-rating" aria-label={`คะแนน ${category.title}`}>
                      {template.scale.map((scale) => (
                        <button
                          type="button"
                          key={scale.value}
                          title={`${scale.value} — ${scale.label}`}
                          className={`tone-${scale.tone} ${selectedEntry.scores[category.id] === scale.value ? 'selected' : ''}`}
                          onClick={() => setScore(selectedEntry.studentCode, category.id, scale.value)}
                        >
                          <b>{scale.value}</b>
                          <span>{scale.label}</span>
                        </button>
                      ))}
                    </div>
                  </article>
                ))}
              </div>

              <div className="sah-notes">
                <label>หลักฐาน/ชิ้นงานที่ใช้ประเมิน
                  <textarea
                    rows={2}
                    value={selectedEntry.evidence}
                    placeholder="เช่น ใบงานที่ 1 การสังเกตขณะทำงาน หรือผลงานในเว็บ"
                    onChange={(event) => updateEntry(selectedEntry.studentCode, (entry) => ({ ...entry, evidence: event.target.value }))}
                  />
                </label>
                <label>บันทึกเพิ่มเติม
                  <textarea
                    rows={2}
                    value={selectedEntry.note}
                    placeholder="จุดเด่นหรือสิ่งที่ควรติดตาม"
                    onChange={(event) => updateEntry(selectedEntry.studentCode, (entry) => ({ ...entry, note: event.target.value }))}
                  />
                </label>
                <label className="wide">แนวทางช่วยเหลือ/พัฒนา
                  <textarea
                    rows={2}
                    value={selectedEntry.supportPlan}
                    placeholder="กิจกรรมซ่อมเสริม การจับคู่เพื่อนช่วยเพื่อน หรือภารกิจต่อยอด"
                    onChange={(event) => updateEntry(selectedEntry.studentCode, (entry) => ({ ...entry, supportPlan: event.target.value }))}
                  />
                </label>
              </div>
            </>
          ) : (
            <div className="sah-loading">ชั้นเรียนนี้ยังไม่มีรายชื่อนักเรียน</div>
          )}
        </main>
      </div>

      <section className="sah-class-summary">
        <div className="sah-section-heading">
          <div>
            <h3>สรุปผลทั้งห้องอัตโนมัติ</h3>
            <p>ตัวเลขปรับทันทีเมื่อครูเลือกระดับผลประเมิน</p>
          </div>
          <span>{classroom} · ภาคเรียน {term}/{academicYear}</span>
        </div>
        <div className="sah-summary-grid">
          {categorySummary.map((category) => {
            const goodPercent = category.evaluated
              ? Math.round((category.good / category.evaluated) * 100)
              : 0;
            return (
              <article key={category.id}>
                <strong>{category.shortTitle}</strong>
                <div className="sah-summary-number">{category.good}/{category.evaluated}</div>
                <span>{goodPercent}% อยู่ในระดับดีขึ้นไป</span>
                {category.supportNames.length > 0 && (
                  <details>
                    <summary>ควรช่วยเหลือ {category.supportNames.length} คน</summary>
                    <p>{category.supportNames.join(', ')}</p>
                  </details>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {kind === 'post-lesson' && assessment && (
        <section className="sah-post-lesson-notes">
          <div className="sah-section-heading">
            <div>
              <h3>สรุปบันทึกหลังสอน</h3>
              <p>ครูกรอกเฉพาะสาระสำคัญ ระบบเก็บพร้อมผล K/P/A และรายชื่อซ่อมเสริม</p>
            </div>
            <label>สถานะ
              <select
                value={assessment.meta.status || 'draft'}
                onChange={(event) => {
                  const status = event.target.value as 'draft' | 'complete';
                  changeAssessment((current) => ({
                    ...current,
                    confirmedByTeacher: status === 'complete',
                    provisional: status !== 'complete',
                    meta: { ...current.meta, status },
                  }));
                }}
              >
                <option value="draft">ฉบับร่าง</option>
                <option value="complete">บันทึกสมบูรณ์</option>
              </select>
            </label>
          </div>

          <div className="sah-draft-tools">
            <button type="button" onClick={fillDraftForCurrent} disabled={!selectedPostSession}>
              <Sparkles size={15} /> เติมร่างคาบนี้จากหัวข้อแผน
            </button>
            <button
              type="button"
              className="bulk"
              onClick={() => void fillDraftForAllTaught()}
              disabled={bulkBusy || postLessonPlans.length === 0}
            >
              {bulkBusy ? <Loader2 size={15} className="sah-spin" /> : <ListChecks size={15} />}
              {bulkBusy
                ? 'กำลังเติม...'
                : `เติมร่างทุกคาบที่สอนแล้วของ ${classroom} (${postLessonPlans.length} คาบ)`}
            </button>
            <small>
              ร่างสร้างจากหัวข้อของแผน ไม่ใช่สิ่งที่เกิดขึ้นจริงในห้อง
              ครูต้องอ่านทวนและแก้ก่อนเปลี่ยนสถานะเป็นฉบับสมบูรณ์ ·
              ระบบจะข้ามคาบที่ครูเขียนไว้แล้ว ไม่ทับของเดิม
            </small>
          </div>
          <div className="sah-post-fields">
            {[
              ['strengths', 'สิ่งที่ผู้เรียนทำได้ดี'],
              ['problems', 'ปัญหาที่พบ'],
              ['causes', 'สาเหตุ'],
              ['improvements', 'แนวทางแก้ไข/ซ่อมเสริม'],
              ['nextAction', 'สิ่งที่จะทำในคาบถัดไป'],
              ['suggestion', 'ข้อเสนอแนะ'],
            ].map(([field, label]) => (
              <label key={field}>{label}
                <textarea
                  rows={3}
                  value={String(assessment.meta[field as keyof typeof assessment.meta] || '')}
                  onChange={(event) => changeAssessment((current) => ({
                    ...current,
                    meta: { ...current.meta, [field]: event.target.value },
                  }))}
                />
              </label>
            ))}
          </div>
        </section>
      )}

      <footer className="sah-footer">
        <span>ผู้ประเมิน: {COURSE_TEACHER_NAME}</span>
        <span>ข้อมูลรายชื่อมาจากระบบจัดการนักเรียนของเว็บไซต์</span>
      </footer>
    </section>
  );
};

export default StudentAssessmentHub;
