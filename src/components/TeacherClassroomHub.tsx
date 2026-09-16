import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileDown,
  FileQuestion,
  Gamepad2,
  Loader2,
  LockOpen,
  Play,
  Presentation,
  Printer,
  RefreshCw,
  Save,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import {
  TECHNOLOGY_GRADE_IDS,
  buildTechnologyTeachingSchedule,
  type TechnologyGradeId,
} from '../data/technologyTeachingSchedule';
import {
  fetchScheduleFromFirebase,
  currentOrNextTeachingSlot,
  loadSchedule,
  type ClassSlot,
} from '../data/schedule';
import { getTechnologyLessonPlans } from '../data/technologyLessonPlans';
import {
  fetchTeachingSessions,
  saveTeachingSession,
  type TeachingSession,
  type TeachingSessionStatus,
} from '../services/teachingSessionService';
import {
  fetchAttendance,
  markAllPresent,
  setStatus,
  type AttendanceStatus,
  type ManualAttendance,
} from '../services/manualAttendanceService';
import { loadRoster } from '../services/rosterService';
import {
  ACADEMIC_YEAR,
  COURSE_TEACHER_NAME,
  fetchClassroomFromFirebase,
  getIndicators,
  loadGrades,
  type Subject,
  type StudentGrade,
} from '../services/gradeService';
import {
  fetchLessonRecords,
  saveLessonRecord,
  type LessonRecord,
  type LessonRecordSnapshot,
} from '../services/lessonRecordService';
import {
  downloadLessonRecordDocx,
  splitIsoToThai,
  percentOf,
} from '../utils/lessonRecordDocx';
import {
  buildP1PostTeachingDraft,
  hasPostTeachingResult,
  isLegacyPostTeachingText,
  isPostTeachingReady,
} from '../utils/p1PostTeachingDraft';
import {
  fetchAssignmentsFromFirebase,
  fetchSubmissionsFromFirebase,
  type Assignment,
  type Submission,
} from '../services/homeworkService';
import {
  fetchLearningEvidence,
  type LearningEvidence,
} from '../services/learningEvidenceService';
import {
  fetchExitTickets,
  getExitTicketSummary,
  formatExitTicketNarrative,
  type ExitTicket,
} from '../services/exitTicketService';
import { getAdminSession } from '../services/authAdmin';
import { getClassroomExportSummary } from '../services/gradeExportService';
import RosterSpinner from './tools/RosterSpinner';
import { StudentGradeSlipPrintLayout } from './StudentGradeSlipPrintLayout';
import { useToast } from './Toast';
import './TeacherClassroomHub.css';

type TeacherTab = 'attendance' | 'gradebook' | 'homework' | 'slides' | 'locks' | 'assessments';

interface Props {
  onNavigate: (tab: TeacherTab) => void;
}

const classroomFromGrade = (gradeId: TechnologyGradeId) => (
  `${gradeId.startsWith('p') ? 'ป' : 'ม'}.${gradeId.slice(1)}`
);
const gradeFromClassroom = (classroom: string): TechnologyGradeId | null => {
  const match = classroom.match(/^([ปม])\.(\d)$/);
  if (!match) return null;
  const candidate = `${match[1] === 'ป' ? 'p' : 'm'}${match[2]}` as TechnologyGradeId;
  return TECHNOLOGY_GRADE_IDS.includes(candidate) ? candidate : null;
};
const gradeForCurrentOrNextSlot = (slots: ClassSlot[], at = new Date()): TechnologyGradeId | null => {
  return gradeFromClassroom(currentOrNextTeachingSlot(slots, at)?.classroom || '');
};
const studentIdFromRoster = (
  classroom: string,
  student: { no: number; name: string },
) => `${classroom}_${student.no}_${student.name.replace(/\s/g, '')}`;
const initialGrade = () => gradeForCurrentOrNextSlot(loadSchedule()) || 'p1';
const today = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const emptyAttendance = (date: string, classroom: string): ManualAttendance => ({
  date,
  classroom,
  records: {},
  updatedAt: 0,
});

const emptySnapshot: LessonRecordSnapshot = {
  present: 0,
  absent: 0,
  totalStudents: 0,
  passed: 0,
  averageK: 0,
  averageP: 0,
  attitudePassed: 0,
};

const statusLabel: Record<TeachingSessionStatus, string> = {
  planned: 'ยังไม่สอน',
  in_progress: 'กำลังสอน',
  completed: 'สอนแล้ว',
  postponed: 'เลื่อน',
  makeup: 'สอนชดเชย',
};

const statusClass: Record<AttendanceStatus, string> = {
  present: 'present',
  absent: 'absent',
  sick: 'sick',
};

// ช่องของแบบฟอร์มราชการ (ไฟล์ตัวอย่างบันทึกหลังสอน 2569) รวมอยู่ในฟอร์มเดียวกับของเดิม
// ไม่แยกเป็นเมนูใหม่ เพราะบันทึกหลังสอนต้องผูกกับแผนรายคาบและเพิ่มคาบใหม่ได้เอง
const recordFormDefault = {
  totalStudents: 0,
  passedCount: 0,
  summary: '',
  strengths: '',
  problems: '',
  causes: '',
  improvements: '',
  nextAction: '',
};

const TeacherClassroomHub: React.FC<Props> = ({ onNavigate }) => {
  const [gradeId, setGradeId] = useState<TechnologyGradeId>(initialGrade);
  const classroom = classroomFromGrade(gradeId);
  const subject: Subject = gradeId.startsWith('m') ? 'cs' : 'main';
  const [sessions, setSessions] = useState<TeachingSession[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState(1);
  const [teachingDate, setTeachingDate] = useState(today());
  const [attendance, setAttendanceState] = useState<ManualAttendance>(
    emptyAttendance(today(), classroom),
  );
  const [grades, setGrades] = useState<StudentGrade[]>([]);
  const [records, setRecords] = useState<LessonRecord[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [evidence, setEvidence] = useState<LearningEvidence[]>([]);
  const [exitTickets, setExitTickets] = useState<ExitTicket[]>([]);
  const [recordForm, setRecordForm] = useState(recordFormDefault);
  const [autoPostTeaching, setAutoPostTeaching] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSpinner, setShowSpinner] = useState(false);
  const [showGradeSlips, setShowGradeSlips] = useState(false);
  const toast = useToast();

  const schedule = useMemo(() => buildTechnologyTeachingSchedule(gradeId), [gradeId]);
  const plans = useMemo(() => getTechnologyLessonPlans(gradeId), [gradeId]);
  const selectedSession = sessions.find((item) => item.period === selectedPeriod);
  const selectedPlan = plans.find((item) => item.no === selectedPeriod) || plans[0];
  const roster = useMemo(() => loadRoster(classroom), [classroom]);
  const exitTicketSummary = useMemo(() => getExitTicketSummary(exitTickets), [exitTickets]);
  const selectedRecord = records.find((item) => (
    (selectedSession?.id && item.sessionId === selectedSession.id)
    || (
      item.planNo === selectedPeriod
      && item.classroom === classroom
      && item.subject === subject
    )
  ));
  const postTeachingReady = isPostTeachingReady({
    sessionStatus: selectedSession?.status,
    recordStatus: selectedRecord?.status,
    teachingDate: selectedRecord?.teachingDate,
    hasResult: hasPostTeachingResult(selectedRecord?.snapshot),
  });

  const loadClassroomData = async (nextGradeId: TechnologyGradeId = gradeId) => {
    const nextClassroom = classroomFromGrade(nextGradeId);
    const nextSubject: Subject = nextGradeId.startsWith('m') ? 'cs' : 'main';
    setLoading(true);
    try {
      const [
        sessionItems,
        attendanceData,
        remoteGrades,
        lessonRecords,
        assignmentItems,
        submissionItems,
        evidenceItems,
        ticketItems,
      ] = await Promise.all([
        fetchTeachingSessions(nextGradeId),
        fetchAttendance(teachingDate, nextClassroom),
        fetchClassroomFromFirebase(nextClassroom, nextSubject),
        fetchLessonRecords(nextClassroom, nextSubject),
        fetchAssignmentsFromFirebase(),
        fetchSubmissionsFromFirebase(),
        fetchLearningEvidence(nextClassroom, nextSubject),
        fetchExitTickets(nextClassroom, teachingDate),
      ]);
      setSessions(sessionItems);
      const exactToday = sessionItems.find((item) => (
        item.plannedDate === teachingDate || item.teachingDate === teachingDate
      ));
      const nextPending = sessionItems.find((item) => item.status !== 'completed');
      setSelectedPeriod(exactToday?.period || nextPending?.period || 1);
      setAttendanceState(attendanceData);
      setGrades(remoteGrades?.length ? remoteGrades : loadGrades(nextClassroom, nextSubject));
      setRecords(lessonRecords);
      setAssignments(assignmentItems);
      setSubmissions(submissionItems);
      setEvidence(evidenceItems);
      setExitTickets(ticketItems);
    } catch (error) {
      toast.show(`โหลดคาบเรียนไม่สำเร็จ: ${error instanceof Error ? error.message : String(error)}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadClassroomData(gradeId);
    }, 0);
    return () => window.clearTimeout(timer);
    // Reload only when class changes. Date has its own explicit handler.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gradeId]);

  useEffect(() => {
    let active = true;
    void fetchScheduleFromFirebase().then((remoteSchedule) => {
      if (!active || !remoteSchedule) return;
      const scheduledGrade = gradeForCurrentOrNextSlot(remoteSchedule);
      if (scheduledGrade) setGradeId(scheduledGrade);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const existing = selectedRecord;
      if (!postTeachingReady) {
        setRecordForm({ ...recordFormDefault, totalStudents: roster.length });
        return;
      }
      const resultSnapshot = existing?.snapshot;
      const narrative = buildP1PostTeachingDraft(selectedPlan, resultSnapshot);
      const resultText = (value: string | undefined, fallback: string) => (
        isLegacyPostTeachingText(value) ? fallback : value || fallback
      );
      setRecordForm(existing ? {
        // บันทึกเก่ายังไม่มีช่องของแบบราชการ จึงเติมจากรายชื่อห้องและช่องเดิมให้แทน
        totalStudents: resultSnapshot?.totalStudents || existing.totalStudents || roster.length,
        passedCount: resultSnapshot?.passed ?? existing.passedCount ?? 0,
        summary: resultText(existing.summary ?? existing.strengths, narrative.summary),
        strengths: resultText(existing.strengths, narrative.strengths),
        problems: resultText(existing.problems, narrative.problems),
        causes: resultText(existing.causes, narrative.causes),
        improvements: resultText(existing.improvements, narrative.improvements),
        nextAction: resultText(existing.nextAction, narrative.nextAction),
      } : {
        ...recordFormDefault,
        totalStudents: resultSnapshot?.totalStudents || roster.length,
        passedCount: resultSnapshot?.passed || 0,
        ...narrative,
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [postTeachingReady, roster.length, selectedPlan, selectedRecord]);

  const indicatorIds = useMemo(() => new Set(
    getIndicators(classroom, subject)
      .filter((indicator) => selectedPlan.indicators.includes(indicator.code))
      .map((indicator) => indicator.id),
  ), [classroom, selectedPlan.indicators, subject]);

  const snapshot = useMemo<LessonRecordSnapshot>(() => {
    if (!grades.length) return { ...emptySnapshot, totalStudents: roster.length };
    const present = grades.filter((student) => (
      attendance.records[student.studentCode] === 'present'
    )).length;
    const linkedScores = grades.flatMap((student) => (
      Object.entries(student.indicators)
        .filter(([indicatorId]) => indicatorIds.has(indicatorId))
        .map(([, score]) => score)
    ));
    const passed = grades.filter((student) => {
      const scores = Object.entries(student.indicators)
        .filter(([indicatorId]) => indicatorIds.has(indicatorId))
        .map(([, score]) => score);
      return scores.length > 0 && scores.every((score) => (
        score.k >= Math.ceil((score.maxK || 15) * 0.6)
        && (score.pScore || 0) >= 15
        && score.a
      ));
    }).length;
    return {
      present,
      absent: Math.max(0, grades.length - present),
      totalStudents: grades.length,
      passed,
      averageK: linkedScores.length
        ? Math.round((linkedScores.reduce((sum, score) => sum + score.k, 0) / linkedScores.length) * 10) / 10
        : 0,
      averageP: linkedScores.length
        ? Math.round((linkedScores.reduce((sum, score) => sum + (score.pScore || 0), 0) / linkedScores.length) * 10) / 10
        : 0,
      attitudePassed: grades.filter((student) => {
        const scores = Object.entries(student.indicators)
          .filter(([indicatorId]) => indicatorIds.has(indicatorId))
          .map(([, score]) => score);
        return scores.length > 0 && scores.every((score) => score.a);
      }).length,
    };
  }, [attendance.records, grades, indicatorIds, roster.length]);

  useEffect(() => {
    if (!postTeachingReady || !hasPostTeachingResult(snapshot)) return;
    const narrative = buildP1PostTeachingDraft(selectedPlan, snapshot);
    const timer = window.setTimeout(() => {
      setRecordForm((current) => ({
        ...current,
        totalStudents: snapshot.totalStudents,
        passedCount: snapshot.passed,
        summary: autoPostTeaching || isLegacyPostTeachingText(current.summary) ? narrative.summary : current.summary,
        strengths: autoPostTeaching || isLegacyPostTeachingText(current.strengths) ? narrative.strengths : current.strengths,
        problems: autoPostTeaching || isLegacyPostTeachingText(current.problems) ? narrative.problems : current.problems,
        causes: autoPostTeaching || isLegacyPostTeachingText(current.causes) ? narrative.causes : current.causes,
        improvements: autoPostTeaching || isLegacyPostTeachingText(current.improvements) ? narrative.improvements : current.improvements,
        nextAction: autoPostTeaching || isLegacyPostTeachingText(current.nextAction) ? narrative.nextAction : current.nextAction,
      }));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [autoPostTeaching, postTeachingReady, selectedPlan, snapshot]);

  const classAssignments = assignments.filter((item) => (
    item.classroom === classroom
    && (!item.subject || item.subject === subject)
    && (!item.lessonPlanId || item.lessonPlanId === `${gradeId}-${selectedPeriod}`)
  ));

  const studentsAtRisk = useMemo(() => grades.map((student) => {
    const scores = Object.entries(student.indicators)
      .filter(([indicatorId]) => indicatorIds.has(indicatorId))
      .map(([, score]) => score);
    const missing = classAssignments.filter((assignment) => (
      !submissions.some((submission) => (
        submission.assignmentId === assignment.id
        && (
          submission.studentId === student.studentCode
          || submission.studentName === student.name
        )
      ))
    )).length;
    const lowK = scores.some((score) => score.k < Math.ceil((score.maxK || 15) * 0.6));
    const lowP = scores.some((score) => (score.pScore || 0) < 15);
    const absent = attendance.records[student.studentCode] === 'absent';
    return {
      student,
      missing,
      lowK,
      lowP,
      absent,
      needsHelp: missing > 0 || lowK || lowP || absent,
    };
  }).filter((item) => item.needsHelp), [
    attendance.records,
    classAssignments,
    grades,
    indicatorIds,
    submissions,
  ]);

  const sessionEvidence = evidence.filter((item) => (
    item.lessonPlanId === `${gradeId}-${selectedPeriod}`
    || item.indicatorCode && selectedPlan.indicators.includes(item.indicatorCode)
  ));

  const updateAttendance = async (
    studentCode: string,
    status: AttendanceStatus,
  ) => {
    const student = roster.find((item) => item.studentCode === studentCode);
    if (!student) return;
    setBusy(true);
    try {
      await setStatus(
        teachingDate,
        classroom,
        studentCode,
        studentIdFromRoster(classroom, student),
        status,
      );
      setAttendanceState(await fetchAttendance(teachingDate, classroom));
    } catch (error) {
      toast.show(`เช็กชื่อไม่สำเร็จ: ${error instanceof Error ? error.message : String(error)}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  const setAllPresent = async () => {
    setBusy(true);
    try {
      await markAllPresent(
        teachingDate,
        classroom,
        roster.map((student) => ({
          studentCode: student.studentCode,
          studentId: studentIdFromRoster(classroom, student),
        })),
      );
      setAttendanceState(await fetchAttendance(teachingDate, classroom));
      toast.show(`เช็กชื่อ ${classroom} ว่ามาเรียนครบแล้ว`, 'success');
    } catch (error) {
      toast.show(`เช็กชื่อทั้งห้องไม่สำเร็จ: ${error instanceof Error ? error.message : String(error)}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  const changeSessionStatus = async (status: TeachingSessionStatus) => {
    if (!selectedSession) return;
    setBusy(true);
    try {
      const now = Date.now();
      const updated = await saveTeachingSession(selectedSession, {
        status,
        teachingDate: status === 'planned' ? undefined : teachingDate,
        startedAt: status === 'in_progress' ? now : selectedSession.startedAt,
        completedAt: status === 'completed' ? now : undefined,
      }, getAdminSession()?.user || 'teacher');
      setSessions((items) => items.map((item) => item.id === updated.id ? updated : item));
      toast.show(`อัปเดตคาบที่ ${updated.period}: ${statusLabel[status]}`, 'success');
    } catch (error) {
      toast.show(`อัปเดตคาบไม่สำเร็จ: ${error instanceof Error ? error.message : String(error)}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  const failedCount = Math.max(0, recordForm.totalStudents - recordForm.passedCount);

  const regeneratePostTeachingNarrative = () => {
    if (!postTeachingReady) return;
    const narrative = buildP1PostTeachingDraft(selectedPlan, snapshot);
    setRecordForm((current) => ({
      ...current,
      totalStudents: snapshot.totalStudents || current.totalStudents,
      passedCount: snapshot.passed,
      ...narrative,
    }));
    toast.show('เรียบเรียงบันทึกเชิงบวกจากผล K/P/A และความสามารถของผู้เรียนแล้ว', 'success');
  };

  const toggleAutoPostTeaching = (checked: boolean) => {
    setAutoPostTeaching(checked);
    if (!checked || !postTeachingReady || !hasPostTeachingResult(snapshot)) return;
    const narrative = buildP1PostTeachingDraft(selectedPlan, snapshot);
    setRecordForm((current) => ({
      ...current,
      totalStudents: snapshot.totalStudents || current.totalStudents,
      passedCount: snapshot.passed,
      ...narrative,
    }));
    toast.show('เปิดสรุปหลังแผนอัตโนมัติ และกรอกครบทุกช่องแล้ว', 'success');
  };

  /** ออกไฟล์ Word จริงตามแบบฟอร์มราชการของโรงเรียน ใช้ได้ทุกชั้นและทุกคาบ */
  const downloadOfficialDocx = () => {
    const thai = splitIsoToThai(teachingDate);
    const row = schedule.rows.find((item) => item.period === selectedPeriod);
    downloadLessonRecordDocx([{
      courseName: schedule.courseName,
      gradeLabel: gradeId.slice(1),
      unitNo: row?.unitNo ?? '',
      unitTitle: row?.unitTitle ?? '',
      planNo: selectedPeriod,
      planTitle: selectedPlan?.title ?? row?.lessonTitle ?? '',
      week: row?.week ?? '',
      day: thai.day,
      month: thai.month,
      buddhistYear: thai.buddhistYear,
      semester: row?.semester ?? 1,
      academicYear: ACADEMIC_YEAR,
      totalStudents: recordForm.totalStudents,
      passedCount: recordForm.passedCount,
      summary: recordForm.summary,
      problems: recordForm.problems,
      improvements: recordForm.improvements,
      teacherName: COURSE_TEACHER_NAME,
      teacherPosition: 'ครูผู้ช่วย',
      deputyName: 'นางสาวเจนจีรา บุญเกตุ',
      directorName: 'นายปรัชญา ปรางค์ชัยภูมิ',
      schoolName: 'โรงเรียนบ้านคลองมดแดง',
    }], `บันทึกหลังสอน_${classroom}_คาบ${selectedPeriod}_${teachingDate}.docx`);
  };

  /** สร้างบันทึกหลังสอน 1 คลิก: ดึงผลเข้าเรียนและ K/P/A จริง เรียบเรียงตามแบบราชการ บันทึกลงฐานข้อมูล และโหลด Word (.docx) ทันที */
  const handleOneClickAutoRecord = async () => {
    if (!selectedSession) {
      toast.show('กรุณาเลือกคาบเรียนที่ต้องการบันทึกก่อน', 'info');
      return;
    }
    setBusy(true);
    try {
      // 1. ดึง/คำนวณ narrative จากผลจริง
      const narrative = buildP1PostTeachingDraft(selectedPlan, snapshot);
      const row = schedule.rows.find((item) => item.period === selectedPeriod);
      const thai = splitIsoToThai(teachingDate);
      const postTotal = snapshot.totalStudents || roster.length;
      const postPassed = snapshot.passed;
      const postFailed = Math.max(0, postTotal - postPassed);

      let finalSummary = narrative.summary;
      let finalProblems = narrative.problems;
      if (exitTickets.length > 0) {
        const exitAdditions = formatExitTicketNarrative(exitTicketSummary);
        if (exitAdditions.summaryAddition) {
          finalSummary += exitAdditions.summaryAddition;
        }
        if (exitAdditions.problemsAddition) {
          finalProblems = finalProblems ? `${finalProblems}\n${exitAdditions.problemsAddition}` : exitAdditions.problemsAddition;
        }
      }

      const postData = {
        totalStudents: postTotal,
        passedCount: postPassed,
        failedCount: postFailed,
        ...narrative,
        summary: finalSummary,
        problems: finalProblems,
      };

      // 2. บันทึกเอกสาร LessonRecord ลง Firestore
      const saved = await saveLessonRecord({
        sessionId: selectedSession.id,
        classroom,
        subject,
        courseName: schedule.courseName,
        planNo: selectedPeriod,
        hourNo: 1,
        teachingDate,
        indicatorCodes: selectedPlan.indicators,
        snapshot,
        week: row?.week,
        semester: row?.semester,
        academicYear: ACADEMIC_YEAR,
        unitNo: row?.unitNo,
        unitTitle: row?.unitTitle,
        planTitle: selectedPlan?.title ?? row?.lessonTitle,
        ...postData,
        status: 'complete',
      });
      setRecords((items) => [saved, ...items.filter((item) => item.id !== saved.id)]);

      // 3. อัปเดตสถานะคาบเรียนเป็น completed
      if (selectedSession.status !== 'completed') {
        await changeSessionStatus('completed');
      }

      // 4. สั่งดาวน์โหลดไฟล์เอกสาร Word ทันที
      downloadLessonRecordDocx([{
        courseName: schedule.courseName,
        gradeLabel: gradeId.slice(1),
        unitNo: row?.unitNo ?? '',
        unitTitle: row?.unitTitle ?? '',
        planNo: selectedPeriod,
        planTitle: selectedPlan?.title ?? row?.lessonTitle ?? '',
        week: row?.week ?? '',
        day: thai.day,
        month: thai.month,
        buddhistYear: thai.buddhistYear,
        semester: row?.semester ?? 1,
        academicYear: ACADEMIC_YEAR,
        totalStudents: postData.totalStudents,
        passedCount: postData.passedCount,
        summary: postData.summary,
        problems: postData.problems,
        improvements: postData.improvements,
        teacherName: COURSE_TEACHER_NAME,
        teacherPosition: 'ครูผู้ช่วย',
        deputyName: 'นางสาวเจนจีรา บุญเกตุ',
        directorName: 'นายปรัชญา ปรางค์ชัยภูมิ',
        schoolName: 'โรงเรียนบ้านคลองมดแดง',
      }], `บันทึกหลังสอน_${classroom}_คาบ${selectedPeriod}_${teachingDate}.docx`);

      // อัปเดตแบบฟอร์มหน้าเว็บให้ตรงกัน
      setRecordForm((current) => ({
        ...current,
        ...postData,
      }));

      toast.show(
        `⚡ บันทึกหลังสอน 1 คลิกสำเร็จ! เข้าเรียน ${snapshot.present}/${snapshot.totalStudents} คน ผ่านเกณฑ์ ${snapshot.passed} คน (ดาวน์โหลด Word เรียบร้อย)`,
        'success',
      );
    } catch (error) {
      toast.show(`บันทึกหลังสอนไม่สำเร็จ: ${error instanceof Error ? error.message : String(error)}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  const savePostTeaching = async () => {
    if (!selectedSession || !postTeachingReady) {
      toast.show('ต้องเริ่มคาบหรือสอนแผนนี้ก่อน จึงจะบันทึกหลังสอนได้', 'info');
      return;
    }
    setBusy(true);
    try {
      const row = schedule.rows.find((item) => item.period === selectedPeriod);
      const saved = await saveLessonRecord({
        sessionId: selectedSession.id,
        classroom,
        subject,
        courseName: schedule.courseName,
        planNo: selectedPeriod,
        hourNo: 1,
        teachingDate,
        indicatorCodes: selectedPlan.indicators,
        snapshot,
        // ช่องของแบบฟอร์มราชการ เก็บคู่กับช่องเดิมของระบบ
        week: row?.week,
        semester: row?.semester,
        academicYear: ACADEMIC_YEAR,
        unitNo: row?.unitNo,
        unitTitle: row?.unitTitle,
        planTitle: selectedPlan?.title ?? row?.lessonTitle,
        failedCount,
        ...recordForm,
        status: 'complete',
      });
      setRecords((items) => [saved, ...items.filter((item) => item.id !== saved.id)]);
      if (selectedSession.status !== 'completed') {
        await changeSessionStatus('completed');
      }
      toast.show(`บันทึกหลังสอนคาบที่ ${selectedPeriod} แล้ว`, 'success');
    } catch (error) {
      toast.show(`บันทึกหลังสอนไม่สำเร็จ: ${error instanceof Error ? error.message : String(error)}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleApplyExitTicketToRecord = () => {
    if (exitTickets.length === 0) {
      toast.show('ยังไม่มีข้อมูล Exit Ticket จากนักเรียนในคาบนี้', 'info');
      return;
    }
    const exitAdditions = formatExitTicketNarrative(exitTicketSummary);
    setRecordForm((prev) => ({
      ...prev,
      summary: prev.summary ? `${prev.summary}\n\n${exitAdditions.summaryAddition}` : exitAdditions.summaryAddition,
      problems: exitAdditions.problemsAddition
        ? (prev.problems ? `${prev.problems}\n\n${exitAdditions.problemsAddition}` : exitAdditions.problemsAddition)
        : prev.problems,
    }));
    toast.show('⚡ ผสานข้อมูล Exit Ticket จากนักเรียนลงในแบบบันทึกหลังสอนแล้ว', 'success');
  };

  const changeDate = async (value: string) => {
    setTeachingDate(value);
    const [attendanceData, ticketItems] = await Promise.all([
      fetchAttendance(value, classroom),
      fetchExitTickets(classroom, value),
    ]);
    setAttendanceState(attendanceData);
    setExitTickets(ticketItems);
  };

  if (loading) {
    return (
      <div className="teacher-classroom-loading">
        <Loader2 className="spin" size={28} />
        <strong>กำลังเตรียมคาบเรียนและหลักฐานของนักเรียน...</strong>
      </div>
    );
  }

  return (
    <div className="teacher-classroom">
      <header className="teacher-classroom-header">
        <div>
          <span className="teacher-classroom-eyebrow">ศูนย์ควบคุมการสอนรายคาบ</span>
          <h2><Presentation size={24} /> คาบเรียนวันนี้</h2>
          <p>เช็กชื่อ เปิดบทเรียน สอน เก็บหลักฐาน K/P/A และบันทึกหลังสอนในหน้าจอเดียว</p>
        </div>
        <button type="button" className="icon-button" title="รีเฟรชข้อมูล" onClick={() => void loadClassroomData()}>
          <RefreshCw size={18} />
        </button>
      </header>

      <section className="teacher-classroom-toolbar">
        <label>
          ชั้นเรียน
          <select value={gradeId} onChange={(event) => setGradeId(event.target.value as TechnologyGradeId)}>
            {TECHNOLOGY_GRADE_IDS.map((item) => (
              <option value={item} key={item}>{item.startsWith('p') ? 'ป' : 'ม'}.{item.slice(1)}</option>
            ))}
          </select>
        </label>
        <label>
          วันที่สอน
          <input type="date" value={teachingDate} onChange={(event) => void changeDate(event.target.value)} />
        </label>
        <label className="teacher-classroom-period">
          แผนรายชั่วโมง
          <select value={selectedPeriod} onChange={(event) => setSelectedPeriod(Number(event.target.value))}>
            {sessions.map((item) => (
              <option value={item.period} key={item.id}>
                {item.period}. {item.lessonTitle} · {statusLabel[item.status]}
              </option>
            ))}
          </select>
        </label>
        <div className="teacher-classroom-progress">
          <span>สอนแล้ว {sessions.filter((item) => item.status === 'completed').length}/{sessions.length} คาบ</span>
          <progress value={sessions.filter((item) => item.status === 'completed').length} max={sessions.length || 40} />
        </div>
      </section>

      {selectedSession && (
        <>
          <section className="teacher-classroom-focus">
            <button
              type="button"
              className="period-arrow"
              title="แผนก่อนหน้า"
              disabled={selectedPeriod <= 1}
              onClick={() => setSelectedPeriod((value) => Math.max(1, value - 1))}
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <span>หน่วยที่ {selectedSession.unitNo} · แผนที่ {selectedSession.period} · วันที่ตามแผน {selectedSession.plannedDate}</span>
              <h3>{selectedPlan.title}</h3>
              <div className="teacher-classroom-indicators">
                {selectedPlan.indicators.map((indicator) => <b key={indicator}>{indicator}</b>)}
              </div>
            </div>
            <span className={`session-status ${selectedSession.status}`}>
              {statusLabel[selectedSession.status]}
            </span>
            <button
              type="button"
              className="period-arrow"
              title="แผนถัดไป"
              disabled={selectedPeriod >= sessions.length}
              onClick={() => setSelectedPeriod((value) => Math.min(sessions.length, value + 1))}
            >
              <ChevronRight size={20} />
            </button>
          </section>

          <div className="teacher-classroom-actions">
            <button type="button" className="primary" onClick={() => void changeSessionStatus('in_progress')} disabled={busy}>
              <Play size={17} /> เริ่มคาบ
            </button>
            <button type="button" onClick={() => onNavigate('slides')}><Presentation size={17} /> เปิดสไลด์</button>
            <button type="button" onClick={() => onNavigate('locks')}><LockOpen size={17} /> เปิดบทเรียน</button>
            <button type="button" onClick={() => window.open('/live/host', '_blank')}><FileQuestion size={17} /> ควิซสด</button>
            <button type="button" onClick={() => window.open('/games', '_blank')}><Gamepad2 size={17} /> เกมฝึก</button>
            <button type="button" className="action-spinner" onClick={() => setShowSpinner(true)} title="สุ่มรายชื่อนักเรียนห้องนี้มาตอบคำถามหน้าห้อง">
              <Sparkles size={17} /> วงล้อสุ่มชื่อ
            </button>
            <button type="button" className="action-auto-record" onClick={() => void handleOneClickAutoRecord()} disabled={busy} title="คำนวณผลจริง บันทึกปิดคาบ และโหลด Word (.docx) ทันที">
              <Zap size={17} /> บันทึกหลังสอน 1 คลิก
            </button>
            <button type="button" className="action-slips" onClick={() => setShowGradeSlips(true)} title="พิมพ์ใบแจ้งผลการเรียนรายบุคคล (ปพ.6) ทั้งห้อง 2 คน/แผ่น">
              <Printer size={17} /> พิมพ์ใบแจ้งเกรดทั้งห้อง
            </button>
            <button type="button" onClick={() => onNavigate('homework')}><BookOpen size={17} /> มอบหมายงาน</button>
            <button
              type="button"
              className="complete"
              onClick={() => document.getElementById('post-teaching-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              disabled={busy}
            >
              <CheckCircle2 size={17} /> บันทึกหลังสอน
            </button>
          </div>
        </>
      )}

      <div className="teacher-classroom-grid">
        <section className="teacher-classroom-panel attendance-panel">
          <div className="panel-heading">
            <div>
              <span>ขั้นที่ 1</span>
              <h3><Users size={19} /> เช็กชื่อ</h3>
            </div>
            <button type="button" onClick={() => void setAllPresent()} disabled={busy}>
              <Check size={16} /> ทุกคนมา
            </button>
          </div>
          <div className="attendance-list">
            {roster.map((student) => {
              const value = attendance.records[student.studentCode];
              return (
                <div className="attendance-row" key={student.studentCode}>
                  <span className="student-no">{student.no}</span>
                  <strong>{student.name}</strong>
                  <div className="attendance-options">
                    {(['present', 'sick', 'absent'] as AttendanceStatus[]).map((status) => (
                      <button
                        type="button"
                        className={`${statusClass[status]} ${value === status ? 'active' : ''}`}
                        onClick={() => void updateAttendance(student.studentCode, status)}
                        title={status === 'present' ? 'มาเรียน' : status === 'sick' ? 'ลา' : 'ขาด'}
                        key={status}
                      >
                        {status === 'present' ? 'มา' : status === 'sick' ? 'ลา' : 'ขาด'}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="teacher-classroom-panel lesson-panel">
          <div className="panel-heading">
            <div>
              <span>ขั้นที่ 2</span>
              <h3><BookOpen size={19} /> แผนสอน 1 ชั่วโมง</h3>
            </div>
            <b>รวม {selectedPlan.steps.reduce((sum, step) => sum + step.minutes, 0)} นาที</b>
          </div>
          <p className="essential-question"><strong>คำถามสำคัญ:</strong> {selectedPlan.essentialQuestion}</p>
          <div className="lesson-objectives">
            {selectedPlan.objectives.map((objective) => (
              <div key={`${objective.domain}-${objective.text}`}>
                <b>{objective.domain}</b>
                <span>{objective.text}</span>
              </div>
            ))}
          </div>
          <ol className="lesson-steps">
            {selectedPlan.steps.map((step) => (
              <li key={step.phase}>
                <span>{step.minutes} นาที</span>
                <div>
                  <strong>{step.phase}</strong>
                  <p><b>ครู:</b> {step.teacher}</p>
                  <p><b>นักเรียน:</b> {step.students}</p>
                  <small>หลักฐาน: {step.evidence}</small>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="teacher-classroom-panel evidence-panel">
          <div className="panel-heading">
            <div>
              <span>ขั้นที่ 3</span>
              <h3><ClipboardCheck size={19} /> หลักฐานและผู้เรียนที่ต้องช่วย</h3>
            </div>
            <button type="button" onClick={() => onNavigate('gradebook')}>เปิดสมุดคะแนน</button>
          </div>
          <div className="snapshot-grid">
            <div><span>มาเรียน</span><strong>{postTeachingReady ? `${snapshot.present}/${snapshot.totalStudents}` : '-'}</strong></div>
            <div><span>ผ่านตัวชี้วัด</span><strong>{postTeachingReady ? snapshot.passed : '-'}</strong></div>
            <div><span>K เฉลี่ย</span><strong>{postTeachingReady ? snapshot.averageK : '-'}</strong></div>
            <div><span>P เฉลี่ย</span><strong>{postTeachingReady ? snapshot.averageP : '-'}</strong></div>
          </div>
          <div className="evidence-summary">
            <span>หลักฐานคาบนี้ {sessionEvidence.length} รายการ</span>
            <span>งานที่เชื่อม {classAssignments.length} งาน</span>
          </div>
          {studentsAtRisk.length === 0 ? (
            <div className="all-clear"><CheckCircle2 size={18} /> ยังไม่พบผู้เรียนที่ต้องติดตามในคาบนี้</div>
          ) : (
            <div className="risk-list">
              {studentsAtRisk.slice(0, 8).map(({ student, missing, lowK, lowP, absent }) => (
                <div key={student.studentCode}>
                  <AlertTriangle size={16} />
                  <strong>{student.name}</strong>
                  <span>
                    {[
                      absent && 'ขาดเรียน',
                      lowK && 'K ต่ำ',
                      lowP && 'P ต้องฝึก',
                      missing > 0 && `ขาดงาน ${missing}`,
                    ].filter(Boolean).join(' · ')}
                  </span>
                </div>
              ))}
            </div>
          )}
          <button type="button" className="remedial-button" onClick={() => onNavigate('homework')}>
            สร้างงานซ่อมเสริมให้กลุ่มนี้
          </button>
        </section>

        {/* ขั้นที่ 3.5: เสียงสะท้อนจากผู้เรียน (Exit Ticket) */}
        <section className="teacher-classroom-panel exit-ticket-panel">
          <div className="panel-heading">
            <div>
              <span>สะท้อนคิด</span>
              <h3><Sparkles size={19} /> ตั๋วบอกลาคาบเรียน (Exit Ticket)</h3>
            </div>
            <button
              type="button"
              onClick={handleApplyExitTicketToRecord}
              disabled={exitTickets.length === 0}
              style={{
                background: exitTickets.length > 0 ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' : '#e2e8f0',
                color: exitTickets.length > 0 ? '#ffffff' : '#94a3b8',
                border: 'none',
                borderRadius: 10,
                padding: '7px 14px',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: exitTickets.length > 0 ? 'pointer' : 'not-allowed',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: exitTickets.length > 0 ? '0 2px 8px rgba(79, 70, 229, 0.25)' : 'none',
              }}
            >
              <Zap size={15} /> ผสานสู่บันทึกหลังสอน
            </button>
          </div>

          <div className="snapshot-grid">
            <div><span>ส่งแล้ว</span><strong>{exitTickets.length} คน</strong></div>
            <div><span>สมาธิเฉลี่ย</span><strong>{exitTicketSummary.averageStars > 0 ? `${exitTicketSummary.averageStars} ⭐` : '-'}</strong></div>
            <div>
              <span>บรรยากาศส่วนใหญ่</span>
              <strong>
                {exitTicketSummary.moodCounts.great >= exitTicketSummary.moodCounts.good && exitTicketSummary.moodCounts.great > 0 ? '😄 สนุกมาก' :
                 exitTicketSummary.moodCounts.good > 0 ? '🙂 ทำได้' :
                 exitTicketSummary.moodCounts.confused > 0 ? '🤔 ยังงงๆ' :
                 exitTicketSummary.moodCounts.tired > 0 ? '😴 เหนื่อย' : '-'}
              </strong>
            </div>
            <div><span>คำถาม/ข้อสงสัย</span><strong>{exitTicketSummary.questions.length} ข้อ</strong></div>
          </div>

          {exitTickets.length === 0 ? (
            <div className="all-clear" style={{ marginTop: 10 }}>
              ยังไม่มีนักเรียนส่งตั๋วบอกลาคาบเรียนในวันนี้ (นักเรียนสามารถกดส่งผ่านหน้าหลักหรือท้ายบทเรียนเพื่อรับคะแนน A ได้ทันที)
            </div>
          ) : (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {exitTicketSummary.topLearned.length > 0 && (
                <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                  <strong style={{ display: 'block', marginBottom: 4 }}>💡 สิ่งที่ผู้เรียนเข้าใจดีที่สุด:</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {exitTicketSummary.topLearned.map((item) => (
                      <span
                        key={item.keyword}
                        style={{
                          background: '#e0e7ff',
                          color: '#3730a3',
                          fontWeight: 600,
                          padding: '3px 10px',
                          borderRadius: 9999,
                          fontSize: '0.8rem',
                        }}
                      >
                        {item.keyword} ({item.count} คน)
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {exitTicketSummary.questions.length > 0 && (
                <div
                  style={{
                    background: '#fffbeb',
                    border: '1.5px solid #fde68a',
                    borderRadius: 12,
                    padding: '10px 14px',
                    fontSize: '0.83rem',
                  }}
                >
                  <strong style={{ color: '#92400e', display: 'block', marginBottom: 6 }}>
                    💬 คำถาม/ข้อสงสัยจากนักเรียน ({exitTicketSummary.questions.length} ข้อ):
                  </strong>
                  <ul style={{ margin: 0, paddingLeft: 18, color: '#78350f', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {exitTicketSummary.questions.slice(0, 5).map((q, idx) => (
                      <li key={idx}>
                        <b>{q.studentName} (เลขที่ {q.studentNumber}):</b> "{q.text}"
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>

        <section id="post-teaching-form" className="teacher-classroom-panel post-panel">
          <div className="panel-heading">
            <div>
              <span>ขั้นที่ 4</span>
              <h3><Save size={19} /> บันทึกหลังสอนทันที</h3>
            </div>
            <b><CalendarDays size={15} /> {teachingDate}</b>
          </div>
          {!postTeachingReady && (
            <div className="all-clear">แผนนี้ยังไม่เริ่มสอน ระบบจึงเว้นบันทึกหลังสอนไว้ก่อน</div>
          )}
          {postTeachingReady && <div className="post-counts">
            <label>นักเรียนทั้งหมด (คน)
              <input
                type="number"
                min={0}
                disabled={!postTeachingReady}
                value={recordForm.totalStudents}
                onChange={(event) => setRecordForm({ ...recordForm, totalStudents: Number(event.target.value) })}
              />
            </label>
            <label>ผ่านจุดประสงค์ (คน)
              <input
                type="number"
                min={0}
                max={recordForm.totalStudents}
                disabled={!postTeachingReady}
                value={recordForm.passedCount}
                onChange={(event) => setRecordForm({ ...recordForm, passedCount: Number(event.target.value) })}
              />
            </label>
            <div className="post-calc">
              ไม่ผ่าน <b>{failedCount}</b> คน
              <small>ผ่าน {percentOf(recordForm.passedCount, recordForm.totalStudents)}% · ไม่ผ่าน {percentOf(failedCount, recordForm.totalStudents)}%</small>
            </div>
          </div>}
          <label className={`auto-post-toggle ${autoPostTeaching ? 'active' : ''}`}>
            <input
              type="checkbox"
              checked={autoPostTeaching}
              disabled={!postTeachingReady || !hasPostTeachingResult(snapshot)}
              onChange={(event) => toggleAutoPostTeaching(event.target.checked)}
            />
            <span>
              <strong>สรุปหลังแผนอัตโนมัติ</strong>
              <small>ติ๊กเพื่อเรียบเรียงผลจริงลงครบทุกช่อง และปรับตาม K/P/A ล่าสุด</small>
            </span>
          </label>
          <div className="post-form">
            <label className="wide">2. สรุปผลการจัดการเรียนรู้ <em>(ลงในแบบราชการ)</em>
              <textarea rows={3} disabled={!postTeachingReady} value={recordForm.summary} onChange={(event) => setRecordForm({ ...recordForm, summary: event.target.value })} />
            </label>
            <label>3. ปัญหาและอุปสรรคระหว่างการจัดกิจกรรมการสอน
              <textarea rows={3} disabled={!postTeachingReady} value={recordForm.problems} onChange={(event) => setRecordForm({ ...recordForm, problems: event.target.value })} />
            </label>
            <label>4. การปรับปรุงและพัฒนา
              <textarea rows={3} disabled={!postTeachingReady} value={recordForm.improvements} onChange={(event) => setRecordForm({ ...recordForm, improvements: event.target.value })} />
            </label>
            <label>สิ่งที่ผู้เรียนทำได้ดี <em>(บันทึกภายใน)</em>
              <textarea rows={2} disabled={!postTeachingReady} value={recordForm.strengths} onChange={(event) => setRecordForm({ ...recordForm, strengths: event.target.value })} />
            </label>
            <label>สาเหตุ <em>(บันทึกภายใน)</em>
              <textarea rows={2} disabled={!postTeachingReady} value={recordForm.causes} onChange={(event) => setRecordForm({ ...recordForm, causes: event.target.value })} />
            </label>
            <label className="wide">สิ่งที่จะทำคาบถัดไป <em>(บันทึกภายใน)</em>
              <textarea rows={2} disabled={!postTeachingReady} value={recordForm.nextAction} onChange={(event) => setRecordForm({ ...recordForm, nextAction: event.target.value })} />
            </label>
          </div>
          <div className="post-buttons">
            <button type="button" className="word-post-button" onClick={regeneratePostTeachingNarrative} disabled={!postTeachingReady || !hasPostTeachingResult(snapshot)}>
              <Sparkles size={17} /> เรียบเรียงจากผลจริง
            </button>
            <button type="button" className="save-post-button" onClick={() => void savePostTeaching()} disabled={busy || !postTeachingReady}>
              {busy ? <Loader2 className="spin" size={17} /> : <Save size={17} />}
              บันทึกหลังสอนและปิดคาบ
            </button>
            <button type="button" className="word-post-button" onClick={downloadOfficialDocx} disabled={!postTeachingReady}>
              <FileDown size={17} /> ดาวน์โหลด Word (แบบราชการ)
            </button>
          </div>
        </section>
      </div>

      {/* วงล้อสุ่มชื่อนักเรียน Modal */}
      {showSpinner && (
        <RosterSpinner
          initialClass={classroom}
          isModal
          onClose={() => setShowSpinner(false)}
        />
      )}

      {/* ใบแจ้งผลการเรียนรายบุคคล (ปพ.6) พิมพ์ทั้งห้อง Modal */}
      {showGradeSlips && (
        <StudentGradeSlipPrintLayout
          summary={getClassroomExportSummary(classroom, subject)}
          onClose={() => setShowGradeSlips(false)}
        />
      )}
    </div>
  );
};

export default TeacherClassroomHub;
