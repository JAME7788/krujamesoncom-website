import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  Camera,
  CheckCircle2,
  Copy,
  Download,
  FileSpreadsheet,
  FlaskConical,
  Images,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  Save,
  ScanLine,
  Send,
  Trash2,
} from 'lucide-react';
import { CLASSROOMS } from '../services/courseAccessService';
import {
  examMaxScores,
  getIndicators,
  getSubjectsForClassroom,
  type Subject,
} from '../services/gradeService';
import {
  fetchExamAttempts,
  getExamSetsByGrade,
  loadLocalExamAttempts,
  type ExamAttempt,
} from '../services/examService';
import { loadRoster } from '../services/rosterService';
import {
  attemptStudentNo,
  buildScoresCsv,
  deletePaperExam,
  duplicatePaperExam,
  fetchPaperExams,
  findRosterStudentByNo,
  isAcceptedAnswer,
  maskLabels,
  maskOf,
  newPaperExam,
  parseAnswerKeyText,
  rescorePaperResults,
  savePaperExam,
  savePaperResult,
  scorePaperAnswers,
  syncAllPaperResultsToGradebook,
  type GradebookTarget,
  type PaperExam,
} from '../services/paperExamService';
import {
  CHOICE_LABELS,
  MAX_QUESTIONS,
  buildAnswerSheetSvg,
  renderDemoAnswerSheetCanvas,
} from '../utils/answerSheet';
import { rgbaToGray, scanAnswerSheets, type MarkStatus, type SheetReading } from '../utils/omrScanner';
import {
  analyzeItems,
  bestAttemptPerStudent,
  buildItemAnalysisCsv,
  computePsychometricSummary,
  describeDifficulty,
  describeDiscrimination,
  describeKr20,
  type AnswerKeyItem,
} from '../utils/examAnalysis';
import { appConfirm } from '../services/appDialogService';
import { useToast } from './Toast';
import LiveOmrCameraScanner, { type LiveCapturePayload } from './LiveOmrCameraScanner';
import './ExamTools.css';

const SCHOOL_NAME = 'โรงเรียนบ้านคลองมดแดง';
const QUESTION_PRESETS = [10, 20, 30, 40] as const;

const TARGET_LABEL: Record<GradebookTarget, string> = {
  none: 'ไม่ส่งอัตโนมัติ (ค่อยกดส่งเข้า ปพ.5 ทีหลังได้)',
  indicator: 'ส่งเข้าคะแนนตัวชี้วัด K (ปพ.5)',
  midterm: 'ส่งเข้าช่องสอบกลางภาค (ปพ.5)',
  final: 'ส่งเข้าช่องสอบปลายภาค (ปพ.5)',
};

const downloadCsv = (csv: string, filename: string) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

/* ---------- พิมพ์กระดาษคำตอบ A4: 2 แผ่น/A4 แนวตั้ง (10–20 ข้อ) หรือ 1 แผ่นเต็ม/A4 แนวนอน (30–40 ข้อ) ---------- */

type PrintLayoutMode = '2-per-a4' | '1-per-a4';

const recommendedLayoutFor = (questionCount: number): PrintLayoutMode =>
  questionCount <= 20 ? '2-per-a4' : '1-per-a4';

const printAnswerSheets = (
  exam: PaperExam,
  mode: 'roster' | 'blank',
  blankCopies: number,
  layout: PrintLayoutMode,
) => {
  const subjectLabel = getSubjectsForClassroom(exam.classroom).find((s) => s.id === exam.subject)?.title;
  const base = {
    title: exam.title,
    classroom: exam.classroom,
    subjectLabel,
    schoolName: SCHOOL_NAME,
    examCode: exam.code,
    questionCount: exam.questionCount,
    choiceCount: exam.choiceCount,
  };
  const sheets = mode === 'roster'
    ? loadRoster(exam.classroom).map((s) => buildAnswerSheetSvg({ ...base, student: { no: s.no, name: s.name } }))
    : Array.from({ length: Math.max(1, blankCopies) }, () => buildAnswerSheetSvg(base));

  const isOnePerPage = layout === '1-per-a4';
  const pages: string[] = [];
  if (isOnePerPage) {
    for (const sheet of sheets) {
      pages.push(`<section class="page landscape"><div class="slot-full">${sheet}</div></section>`);
    }
  } else {
    for (let i = 0; i < sheets.length; i += 2) {
      pages.push(
        `<section class="page portrait"><div class="slot-half">${sheets[i]}</div><div class="cut">✂ ตัดตามเส้นประนี้ (A4 แผ่นเดียวได้ 2 คน — ประหยัดกระดาษ)</div><div class="slot-half">${sheets[i + 1] ?? ''}</div></section>`,
      );
    }
  }

  const html = `<!doctype html><html lang="th"><head><meta charset="utf-8"><title>กระดาษคำตอบ ${exam.title} (${exam.classroom})</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
<style>
@page { size: A4 ${isOnePerPage ? 'landscape' : 'portrait'}; margin: 0; }
html, body { margin: 0; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.page.portrait { width: 210mm; height: 296mm; display: flex; flex-direction: column; align-items: center; justify-content: space-around; page-break-after: always; break-after: page; }
.slot-half { width: 200mm; height: 140mm; }
.slot-half svg { width: 200mm; height: 140mm; display: block; }
.page.landscape { width: 297mm; height: 209mm; display: flex; align-items: center; justify-content: center; page-break-after: always; break-after: page; }
.slot-full { width: 280mm; height: 196mm; }
.slot-full svg { width: 280mm; height: 196mm; display: block; }
.cut { width: 96%; border-top: 1px dashed #94a3b8; padding-top: 2px; font: 9px Sarabun, sans-serif; color: #64748b; text-align: center; }
@media screen {
  body { background: #e2e8f0; padding: 12px 0; }
  .page { background: #fff; margin: 12px auto; box-shadow: 0 4px 18px rgba(15,23,42,.2); }
}
</style></head><body>${pages.join('')}
<script>window.addEventListener('load', function () { (document.fonts ? document.fonts.ready : Promise.resolve()).then(function () { setTimeout(function () { window.print(); }, 300); }); });</script>
</body></html>`;
  const win = window.open('', '_blank');
  if (!win) return false;
  win.document.open();
  win.document.write(html);
  win.document.close();
  return true;
};

/* ---------- โหลดภาพจากไฟล์เป็น Canvas ---------- */

const MAX_SIDE = 1600;

const loadImageCanvas = async (file: File): Promise<HTMLCanvasElement> => {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  return canvas;
};

interface ScanItem {
  id: string;
  fileName: string;
  source: HTMLCanvasElement;
  reading: SheetReading;
  exam: PaperExam | null;
  studentNo: number | null;
  answers: (number | null)[];
  saved: null | { remote: boolean; text: string };
}

const statusColor = (status: MarkStatus) => (status === 'ok' ? '#16a34a' : status === 'blank' ? '#94a3b8' : '#f59e0b');

const describeGradebookTarget = (exam: PaperExam): string => {
  if (exam.gradebookTarget === 'midterm') return 'สอบกลางภาค';
  if (exam.gradebookTarget === 'final') return 'สอบปลายภาค';
  if (exam.gradebookTarget === 'indicator') {
    const ind = getIndicators(exam.classroom, exam.subject).find((i) => i.id === exam.indicatorId);
    return ind ? `ตัวชี้วัด K (${ind.code})` : 'ตัวชี้วัด K';
  }
  return 'ยังไม่ผูกช่อง ปพ.5';
};

/* ---------- การ์ดแสดงผลสแกน + ภาพซ้อนวงกลมตรวจคำตอบ + แก้รายข้อได้ทันที ---------- */

const ScanCard: React.FC<{
  item: ScanItem;
  onChange: (next: ScanItem) => void;
  onRemove: () => void;
}> = ({ item, onChange, onRemove }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [saving, setSaving] = useState(false);
  const { exam, reading } = item;
  const roster = exam ? loadRoster(exam.classroom) : [];
  const student = exam ? findRosterStudentByNo(exam.classroom, item.studentNo) : undefined;
  const result = exam ? scorePaperAnswers(exam, item.answers) : null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = item.source.width;
    canvas.height = item.source.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(item.source, 0, 0);
    ctx.lineWidth = Math.max(2, reading.pixelsPerMm * 0.55);
    for (const b of reading.bubbles) {
      if (b.kind !== 'answer') continue;
      const chosen = item.answers[b.index] === b.choice;
      const mask = exam?.keyMasks[b.index] ?? 0;
      const isKey = ((mask >> b.choice) & 1) === 1;
      if (chosen) {
        ctx.strokeStyle = mask === 0 ? '#2563eb' : isKey ? '#16a34a' : '#dc2626';
      } else if (isKey && !isAcceptedAnswer(mask, item.answers[b.index])) {
        ctx.strokeStyle = '#f59e0b';
      } else continue;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * 1.35, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.strokeStyle = '#2563eb';
    ctx.beginPath();
    reading.corners.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    ctx.stroke();
  }, [exam, item.answers, item.source, reading]);

  const setAnswer = (q: number, choice: number) => {
    const answers = item.answers.slice();
    answers[q] = answers[q] === choice ? null : choice;
    onChange({ ...item, answers, saved: null });
  };

  const save = async () => {
    if (!exam || item.studentNo === null) return;
    setSaving(true);
    try {
      const res = await savePaperResult(exam, item.studentNo, item.answers);
      const gradebookText = res.gradebook === 'saved'
        ? ` • ลง ปพ.5 (${describeGradebookTarget(exam)}) ${res.gradebookScore}/${res.gradebookMax}`
        : res.gradebook === 'closed' ? ' • สมุดคะแนนปิดผลแล้ว จึงไม่ได้ลงคะแนน'
          : res.gradebook === 'no-student' ? ' • ไม่พบเลขที่นี้ในรายชื่อ จึงไม่ได้ลงสมุดคะแนน' : '';
      onChange({
        ...item,
        saved: {
          remote: res.remote,
          text: res.remote
            ? `บันทึกแล้ว${gradebookText}`
            : `บันทึกไว้ในเครื่องนี้แล้ว (ออฟไลน์/ทดสอบ)${gradebookText}`,
        },
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="exam-card">
      <div className="exam-scan-result">
        <div style={{ display: 'grid', gap: 6, alignContent: 'start' }}>
          <canvas ref={canvasRef} aria-label={`ภาพกระดาษคำตอบ ${item.fileName}`} />
          <div className="exam-row" style={{ fontSize: '0.78rem' }}>
            <span className="exam-pill good">วงเขียว = ตอบถูก</span>
            <span className="exam-pill bad">วงแดง = ตอบผิด</span>
            <span className="exam-pill warn">วงส้ม = เฉลยที่ถูก</span>
          </div>
        </div>
        <div style={{ display: 'grid', gap: 8, alignContent: 'start' }}>
          {exam ? (
            <div className="exam-row" style={{ justifyContent: 'space-between' }}>
              <span className="exam-pill paper">ชุด {exam.code}: {exam.title} ({exam.classroom})</span>
              {result && (
                <span className="exam-score-big">
                  {result.score}/{result.total}{' '}
                  <small style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                    ({result.total ? Math.round((result.score / result.total) * 100) : 0}%)
                  </small>
                </span>
              )}
            </div>
          ) : (
            <div className="exam-error">
              {reading.examCode === null ? 'อ่านรหัสชุดข้อสอบไม่ได้' : `ไม่พบชุดข้อสอบรหัส ${reading.examCode} ในระบบ`} ลองถ่ายใหม่ หรือสร้างชุดข้อสอบก่อน
            </div>
          )}
          {exam && (
            <label className="exam-field">
              นักเรียน (อ่านเลขที่อัตโนมัติ — กดเปลี่ยนได้ถ้าฝนไม่ชัด)
              <select
                value={item.studentNo ?? ''}
                onChange={(e) => onChange({ ...item, studentNo: e.target.value === '' ? null : Number(e.target.value), saved: null })}
              >
                <option value="">— เลือกนักเรียน —</option>
                {roster.map((s) => <option key={s.studentCode} value={s.no}>เลขที่ {s.no} {s.name}</option>)}
                {item.studentNo !== null && !student && <option value={item.studentNo}>เลขที่ {item.studentNo} (ไม่พบในรายชื่อ)</option>}
              </select>
            </label>
          )}
          {reading.issues.length > 0 && (
            <ul className="exam-issues">{reading.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul>
          )}
          {exam && (
            <div className="exam-key-grid" aria-label="คำตอบที่อ่านได้ กดเพื่อแก้">
              {item.answers.map((answer, q) => (
                <div key={q} className="exam-key-row" title={reading.statuses[q] !== 'ok' ? 'อ่านไม่ชัด/ฝนเกิน กรุณาตรวจ' : undefined}>
                  <span className="num" style={{ color: statusColor(reading.statuses[q]) }}>{q + 1}</span>
                  {Array.from({ length: exam.choiceCount }, (_, c) => {
                    const mask = exam.keyMasks[q];
                    const cls = answer === c ? (mask === 0 ? 'on' : (mask >> c) & 1 ? 'correct' : 'wrong') : '';
                    return (
                      <button
                        key={c}
                        type="button"
                        className={`exam-choice ${cls}`}
                        onClick={() => setAnswer(q, c)}
                        aria-pressed={answer === c}
                        aria-label={`ข้อ ${q + 1} ตัวเลือก ${CHOICE_LABELS[c]}`}
                      >
                        {CHOICE_LABELS[c]}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
          <div className="exam-row">
            <button type="button" className="exam-btn primary" onClick={() => { void save(); }} disabled={!exam || item.studentNo === null || saving}>
              <Save size={16} /> {saving ? 'กำลังบันทึก…' : item.saved ? 'บันทึกซ้ำ' : 'ยืนยันและบันทึกคะแนน'}
            </button>
            <button type="button" className="exam-btn danger" onClick={onRemove}>
              <Trash2 size={16} /> ลบการ์ดนี้
            </button>
          </div>
          {item.saved && <div className="exam-ok" role="status">{item.saved.text}</div>}
        </div>
      </div>
    </div>
  );
};

/* ---------- แก้ไขชุดข้อสอบและเฉลย ---------- */

const ExamEditor: React.FC<{
  exam: PaperExam;
  existingAttemptCount: number;
  onSave: (exam: PaperExam, rescoreExisting: boolean) => void;
  onCancel: () => void;
}> = ({ exam, existingAttemptCount, onSave, onCancel }) => {
  const [draft, setDraft] = useState<PaperExam>(exam);
  const [keyText, setKeyText] = useState('');
  const [multiKeyMode, setMultiKeyMode] = useState(false);
  const [showPoints, setShowPoints] = useState(false);

  const subjects = getSubjectsForClassroom(draft.classroom);
  const indicators = getIndicators(draft.classroom, draft.subject);
  const maxScores = examMaxScores(draft.classroom);
  const bankSets = getExamSetsByGrade(draft.classroom);
  const missing = draft.keyMasks.filter((m) => m === 0).length;

  const resize = (count: number, choiceCount = draft.choiceCount) => {
    const questionCount = Math.max(1, Math.min(MAX_QUESTIONS, count || 1));
    setDraft({
      ...draft,
      questionCount,
      choiceCount,
      keyMasks: Array.from({ length: questionCount }, (_, i) => (draft.keyMasks[i] ?? 0) & ((1 << choiceCount) - 1)),
      points: Array.from({ length: questionCount }, (_, i) => draft.points[i] ?? 1),
    });
  };

  const setKey = (q: number, c: number) => {
    const keyMasks = draft.keyMasks.slice();
    if (multiKeyMode) {
      keyMasks[q] ^= maskOf(c);
    } else {
      keyMasks[q] = keyMasks[q] === maskOf(c) ? 0 : maskOf(c);
    }
    setDraft({ ...draft, keyMasks });
  };

  const setPoint = (q: number, value: number) => {
    const points = draft.points.slice();
    points[q] = Math.max(1, Math.min(5, Math.round(value) || 1));
    setDraft({ ...draft, points });
  };

  const applyKeyText = () => {
    const parsed = parseAnswerKeyText(keyText, draft.choiceCount);
    if (!parsed.length) return;
    const questionCount = Math.min(MAX_QUESTIONS, Math.max(draft.questionCount, parsed.length));
    setDraft({
      ...draft,
      questionCount,
      keyMasks: Array.from({ length: questionCount }, (_, i) => (parsed[i] === undefined ? draft.keyMasks[i] ?? 0 : maskOf(parsed[i]))),
      points: Array.from({ length: questionCount }, (_, i) => draft.points[i] ?? 1),
    });
  };

  const loadFromBank = (setId: string) => {
    const set = bankSets.find((s) => s.id === setId);
    if (!set) return;
    const questions = set.questions.slice(0, MAX_QUESTIONS);
    const choiceCount = questions.some((q) => q.options.length > 4) ? 5 : 4;
    setDraft({
      ...draft,
      title: draft.title === 'แบบทดสอบ' ? set.title : draft.title,
      questionCount: questions.length,
      choiceCount,
      keyMasks: questions.map((q) => maskOf(q.answerIndex)),
      points: questions.map(() => 1),
    });
  };

  const handleClassroomChange = (classroom: string) => {
    const subject = (getSubjectsForClassroom(classroom)[0]?.id || 'main') as Subject;
    const nextIndicators = getIndicators(classroom, subject);
    const target = draft.gradebookTarget === 'midterm' && !examMaxScores(classroom).midterm ? 'none' : draft.gradebookTarget;
    setDraft({
      ...draft,
      classroom,
      subject,
      gradebookTarget: target,
      indicatorId: target === 'indicator' ? nextIndicators[0]?.id : undefined,
    });
  };

  const handleSubjectChange = (subject: Subject) => {
    const nextIndicators = getIndicators(draft.classroom, subject);
    setDraft({
      ...draft,
      subject,
      indicatorId: draft.gradebookTarget === 'indicator' ? nextIndicators[0]?.id : draft.indicatorId,
    });
  };

  const handleTargetChange = (gradebookTarget: GradebookTarget) => {
    setDraft({
      ...draft,
      gradebookTarget,
      indicatorId: gradebookTarget === 'indicator' ? (draft.indicatorId || indicators[0]?.id) : undefined,
    });
  };

  return (
    <div className="exam-card" style={{ display: 'grid', gap: 14 }}>
      <div className="exam-row" style={{ justifyContent: 'space-between' }}>
        <h3>ตั้งค่าชุดข้อสอบและเฉลย (รหัสชุด {draft.code})</h3>
        <span className="exam-pill paper">
          แนะนำการพิมพ์: {draft.questionCount <= 20 ? '2 แผ่น / A4 แนวตั้ง' : '1 แผ่นเต็ม / A4 แนวนอน'}
        </span>
      </div>

      <div className="exam-row" style={{ alignItems: 'end' }}>
        <label className="exam-field" style={{ flex: '2 1 240px' }}>
          ชื่อการสอบ
          <input value={draft.title} maxLength={60} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        </label>
        <label className="exam-field">
          ชั้นเรียน
          <select value={draft.classroom} onChange={(e) => handleClassroomChange(e.target.value)}>
            {CLASSROOMS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="exam-field">
          รายวิชา
          <select value={draft.subject} onChange={(e) => handleSubjectChange(e.target.value as Subject)}>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        </label>
        <label className="exam-field">
          ตัวเลือก
          <select value={draft.choiceCount} onChange={(e) => resize(draft.questionCount, Number(e.target.value) === 5 ? 5 : 4)}>
            <option value={4}>4 ตัวเลือก (ก–ง)</option>
            <option value={5}>5 ตัวเลือก (ก–จ)</option>
          </select>
        </label>
      </div>

      {/* เลือกจำนวนข้อแบบเร็ว 10 / 20 / 30 / 40 + กรอกเอง */}
      <div className="exam-row" style={{ alignItems: 'end' }}>
        <div className="exam-field">
          <span>จำนวนข้อมาตรฐาน</span>
          <div className="exam-row">
            {QUESTION_PRESETS.map((n) => (
              <button
                key={n}
                type="button"
                className={`exam-btn compact ${draft.questionCount === n ? 'primary' : ''}`}
                onClick={() => resize(n)}
              >
                {n} ข้อ
              </button>
            ))}
          </div>
        </div>
        <label className="exam-field" style={{ width: 110 }}>
          กำหนดเอง (1–{MAX_QUESTIONS})
          <input type="number" min={1} max={MAX_QUESTIONS} value={draft.questionCount} onChange={(e) => resize(Number(e.target.value))} />
        </label>
      </div>

      {/* เป้าหมายสมุดคะแนน ปพ.5 (K / กลางภาค / ปลายภาค) */}
      <div className="exam-row" style={{ alignItems: 'end' }}>
        <label className="exam-field" style={{ flex: '1 1 260px' }}>
          ช่องคะแนนในสมุด ปพ.5 (ซิงก์อัตโนมัติหรือกดส่งทีเดียวทั้งห้อง)
          <select value={draft.gradebookTarget} onChange={(e) => handleTargetChange(e.target.value as GradebookTarget)}>
            <option value="none">{TARGET_LABEL.none}</option>
            {indicators.length > 0 && <option value="indicator">{TARGET_LABEL.indicator}</option>}
            {maxScores.midterm > 0 && <option value="midterm">{TARGET_LABEL.midterm} (เต็ม {maxScores.midterm})</option>}
            <option value="final">{TARGET_LABEL.final} (เต็ม {maxScores.final})</option>
          </select>
        </label>
        {draft.gradebookTarget === 'indicator' && indicators.length > 0 && (
          <label className="exam-field" style={{ flex: '2 1 320px' }}>
            เลือกตัวชี้วัด K เป้าหมาย
            <select
              value={draft.indicatorId || indicators[0].id}
              onChange={(e) => setDraft({ ...draft, indicatorId: e.target.value })}
            >
              {indicators.map((ind) => (
                <option key={ind.id} value={ind.id}>
                  {ind.code} (เต็ม {ind.maxScore}) — {ind.title.slice(0, 60)}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {/* วางเฉลยแบบพิมพ์ / ดึงจากคลังข้อสอบ */}
      <div className="exam-row" style={{ alignItems: 'end' }}>
        <label className="exam-field" style={{ flex: '1 1 260px' }}>
          วางเฉลยแบบพิมพ์เร็ว (เช่น กขคงก… หรือ 1234… หรือ abcd…, ใส่ - สำหรับข้อฟรี)
          <input value={keyText} onChange={(e) => setKeyText(e.target.value)} placeholder="กขคงกขคง…" />
        </label>
        <button type="button" className="exam-btn" onClick={applyKeyText} disabled={!keyText.trim()}>ใช้เฉลยนี้</button>
        {bankSets.length > 0 && (
          <label className="exam-field">
            หรือดึงเฉลยจากคลังข้อสอบในเว็บ
            <select value="" onChange={(e) => loadFromBank(e.target.value)}>
              <option value="">— เลือกชุดในคลัง —</option>
              {bankSets.map((s) => <option key={s.id} value={s.id}>{s.title} ({s.questions.length} ข้อ)</option>)}
            </select>
          </label>
        )}
      </div>

      {/* ตารางติ๊กเฉลย */}
      <div>
        <div className="exam-row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
          <p>
            กดวงกลมเพื่อกำหนดเฉลย {missing > 0 && <strong style={{ color: '#d97706' }}>• ยังไม่ตั้งเฉลย {missing} ข้อ</strong>}
          </p>
          <div className="exam-row">
            <label className="exam-toggle">
              <input type="checkbox" checked={multiKeyMode} onChange={(e) => setMultiKeyMode(e.target.checked)} />
              <span>อนุญาตเฉลยหลายข้อ (เช่น ก หรือ ค)</span>
            </label>
            <label className="exam-toggle">
              <input type="checkbox" checked={showPoints} onChange={(e) => setShowPoints(e.target.checked)} />
              <span>กำหนดน้ำหนักคะแนนรายข้อ</span>
            </label>
          </div>
        </div>
        <div className="exam-key-grid">
          {draft.keyMasks.map((mask, q) => (
            <div key={q} className="exam-key-row">
              <span className="num">{q + 1}</span>
              {Array.from({ length: draft.choiceCount }, (_, c) => (
                <button
                  key={c}
                  type="button"
                  className={`exam-choice ${(mask >> c) & 1 ? 'on' : ''}`}
                  onClick={() => setKey(q, c)}
                  aria-pressed={((mask >> c) & 1) === 1}
                  aria-label={`เฉลยข้อ ${q + 1} ${CHOICE_LABELS[c]}`}
                >
                  {CHOICE_LABELS[c]}
                </button>
              ))}
              {showPoints && (
                <input
                  type="number"
                  min={1}
                  max={5}
                  className="exam-points"
                  value={draft.points[q] ?? 1}
                  onChange={(e) => setPoint(q, Number(e.target.value))}
                  aria-label={`คะแนนข้อ ${q + 1}`}
                  title="คะแนนข้อนี้ (1–5)"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="exam-row">
        <button type="button" className="exam-btn primary" onClick={() => onSave(draft, false)}>
          <Save size={16} /> บันทึกเฉลย แล้วไปพิมพ์/สแกน
        </button>
        {existingAttemptCount > 0 && (
          <button type="button" className="exam-btn success" onClick={() => onSave(draft, true)}>
            <RefreshCw size={16} /> บันทึกและคิดคะแนนใหม่ให้ทั้ง {existingAttemptCount} คน
          </button>
        )}
        <button type="button" className="exam-btn" onClick={onCancel}>ยกเลิก</button>
      </div>
    </div>
  );
};

/* ---------- หน้าพิมพ์กระดาษคำตอบ A4 + ตัวอย่างจริง ---------- */

const AnswerSheetPrintPanel: React.FC<{
  exam: PaperExam;
  onNotify: (msg: string) => void;
  onGoScan: () => void;
}> = ({ exam, onNotify, onGoScan }) => {
  const roster = useMemo(() => loadRoster(exam.classroom), [exam.classroom]);
  const [layout, setLayout] = useState<PrintLayoutMode>(() => recommendedLayoutFor(exam.questionCount));
  const [previewMode, setPreviewMode] = useState<'roster' | 'blank'>('roster');
  const [blankCopies, setBlankCopies] = useState(() => Math.max(20, roster.length || 30));

  const subjectLabel = getSubjectsForClassroom(exam.classroom).find((s) => s.id === exam.subject)?.title;
  const previewSvg = useMemo(() => {
    const sampleStudent = previewMode === 'roster' && roster[0]
      ? { no: roster[0].no, name: roster[0].name }
      : undefined;
    return buildAnswerSheetSvg({
      title: exam.title,
      classroom: exam.classroom,
      subjectLabel,
      schoolName: SCHOOL_NAME,
      examCode: exam.code,
      questionCount: exam.questionCount,
      choiceCount: exam.choiceCount,
      student: sampleStudent,
    });
  }, [exam, previewMode, roster, subjectLabel]);

  const handlePrint = (mode: 'roster' | 'blank') => {
    const ok = printAnswerSheets(exam, mode, blankCopies, layout);
    if (!ok) onNotify('เบราว์เซอร์บล็อกหน้าต่างพิมพ์ กรุณาอนุญาตป๊อปอัป (Pop-up) แล้วลองใหม่');
  };

  const rosterPages = layout === '2-per-a4' ? Math.ceil(roster.length / 2) : roster.length;
  const blankPages = layout === '2-per-a4' ? Math.ceil(blankCopies / 2) : blankCopies;

  return (
    <div className="exam-card" style={{ display: 'grid', gap: 14 }}>
      <div className="exam-row" style={{ justifyContent: 'space-between' }}>
        <div>
          <h3>🖨️ พิมพ์กระดาษคำตอบ OMR มาตรฐาน A4</h3>
          <p>มีสี่เหลี่ยมดำ 4 มุม + แถบรหัสชุดข้อสอบ {exam.code} + ช่องฝนเลขที่ 2 หลัก สแกนด้วยมือถือได้ทันทีทั้ง 2 ขนาด</p>
        </div>
        <button type="button" className="exam-btn primary" onClick={onGoScan}>
          <ScanLine size={16} /> ไปหน้าสแกนตรวจข้อสอบ →
        </button>
      </div>

      {/* เลือกขนาดกระดาษ A4 */}
      <div className="exam-card-subtle" style={{ display: 'grid', gap: 10 }}>
        <div className="exam-row">
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>รูปแบบการจัดวางบนกระดาษ A4:</span>
          <button
            type="button"
            className={`exam-btn compact ${layout === '2-per-a4' ? 'primary' : ''}`}
            onClick={() => setLayout('2-per-a4')}
          >
            2 แผ่น / A4 แนวตั้ง (ประหยัดกระดาษ • แนะนำ 10–20 ข้อ)
          </button>
          <button
            type="button"
            className={`exam-btn compact ${layout === '1-per-a4' ? 'primary' : ''}`}
            onClick={() => setLayout('1-per-a4')}
          >
            1 แผ่นเต็ม / A4 แนวนอน (วงโต ฝนง่าย • แนะนำ 30–40 ข้อ)
          </button>
        </div>

        <div className="exam-row" style={{ alignItems: 'end', gap: 12 }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <strong style={{ fontSize: '0.88rem' }}>โหมด 1: พิมพ์ระบุชื่อ-เลขที่ทั้งห้อง ({roster.length} คน = {rosterPages} แผ่น A4)</strong>
            <span className="exam-muted" style={{ fontSize: '0.82rem' }}>ระบบพิมพ์ชื่อและฝนเลขที่ให้ล่วงหน้า สแกนปุ๊บรู้ชื่อนักเรียนทันที 100%</span>
            <div className="exam-row">
              <button type="button" className="exam-btn primary" onClick={() => handlePrint('roster')} disabled={roster.length === 0}>
                <Printer size={16} /> พิมพ์ระบุชื่อทั้งห้อง {exam.classroom}
              </button>
              <button type="button" className="exam-btn compact" onClick={() => setPreviewMode('roster')}>
                ดูตัวอย่างแบบระบุชื่อ
              </button>
            </div>
          </div>

          <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 12, display: 'grid', gap: 6 }}>
            <strong style={{ fontSize: '0.88rem' }}>โหมด 2: พิมพ์กระดาษคำตอบเปล่า (เด็กฝนเลขที่เอง)</strong>
            <span className="exam-muted" style={{ fontSize: '0.82rem' }}>ใช้ซ้ำได้ทุกห้อง เผื่อเด็กย้ายเข้าใหม่ ({blankPages} แผ่น A4)</span>
            <div className="exam-row" style={{ alignItems: 'end' }}>
              <label className="exam-field" style={{ width: 96 }}>
                จำนวนแผ่น
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={blankCopies}
                  onChange={(e) => setBlankCopies(Math.max(1, Math.min(200, Number(e.target.value) || 1)))}
                />
              </label>
              <button type="button" className="exam-btn" onClick={() => handlePrint('blank')}>
                <Printer size={16} /> พิมพ์กระดาษเปล่า
              </button>
              <button type="button" className="exam-btn compact" onClick={() => setPreviewMode('blank')}>
                ดูตัวอย่างกระดาษเปล่า
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ตัวอย่างกระดาษคำตอบ SVG จริง */}
      <div>
        <div className="exam-row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
          <strong style={{ fontSize: '0.9rem' }}>
            ตัวอย่างกระดาษคำตอบจริง ({previewMode === 'roster' ? `ระบุชื่อ: ${roster[0]?.name || '—'}` : 'แบบกระดาษเปล่า — ฝนเลขที่เอง'})
          </strong>
          <span className="exam-pill">{layout === '2-per-a4' ? 'ขนาด 200×140 มม. (ครึ่ง A4)' : 'ขนาด 280×196 มม. (เต็ม A4 แนวนอน)'}</span>
        </div>
        <div className="exam-sheet-preview-box">
          <div className="exam-sheet-preview-inner" dangerouslySetInnerHTML={{ __html: previewSvg }} />
        </div>
      </div>
    </div>
  );
};

/* ---------- ตรวจแบบติ๊กคำตอบนักเรียนเอง ---------- */

const ManualChecker: React.FC<{ exam: PaperExam; checkedNos: ReadonlySet<number>; onSaved: () => void }> = ({ exam, checkedNos, onSaved }) => {
  const roster = loadRoster(exam.classroom);
  const firstUnchecked = () => roster.find((s) => !checkedNos.has(s.no))?.no ?? roster[0]?.no ?? null;
  const [studentNo, setStudentNo] = useState<number | null>(firstUnchecked);
  const [answers, setAnswers] = useState<(number | null)[]>(() => Array.from({ length: exam.questionCount }, () => null));
  const [quickText, setQuickText] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const { score, total } = scorePaperAnswers(exam, answers);
  const answered = answers.filter((a) => a !== null).length;

  const setAnswer = (q: number, c: number) => {
    const next = answers.slice();
    next[q] = next[q] === c ? null : c;
    setAnswers(next);
  };

  const applyQuickText = (text: string) => {
    setQuickText(text);
    const parsed = parseAnswerKeyText(text, exam.choiceCount);
    setAnswers(Array.from({ length: exam.questionCount }, (_, i) => (parsed[i] === undefined || parsed[i] < 0 ? null : parsed[i])));
  };

  const save = async () => {
    if (studentNo === null) return;
    setSaving(true);
    try {
      const res = await savePaperResult(exam, studentNo, answers);
      const name = findRosterStudentByNo(exam.classroom, studentNo)?.name ?? `เลขที่ ${studentNo}`;
      const gradebook = res.gradebook === 'saved' ? ` • ลง ปพ.5 ${res.gradebookScore}/${res.gradebookMax}`
        : res.gradebook === 'closed' ? ' • สมุดคะแนนปิดผลแล้ว จึงไม่ได้ลงคะแนน' : '';
      setStatus({
        ok: true,
        text: `${name}: ${score}/${total} คะแนน บันทึกเรียบร้อย${gradebook}`,
      });
      onSaved();
      const next = roster.find((s) => s.no !== studentNo && !checkedNos.has(s.no));
      setStudentNo(next?.no ?? studentNo);
      setAnswers(Array.from({ length: exam.questionCount }, () => null));
      setQuickText('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="exam-card" style={{ display: 'grid', gap: 10 }}>
      <div className="exam-row" style={{ justifyContent: 'space-between' }}>
        <label className="exam-field" style={{ flex: '1 1 260px' }}>
          นักเรียน
          <select value={studentNo ?? ''} onChange={(e) => { setStudentNo(e.target.value === '' ? null : Number(e.target.value)); setStatus(null); }}>
            {roster.map((s) => (
              <option key={s.studentCode} value={s.no}>{checkedNos.has(s.no) ? '✓ ' : ''}เลขที่ {s.no} {s.name}</option>
            ))}
          </select>
        </label>
        <div style={{ textAlign: 'right' }}>
          <div className="exam-score-big" aria-live="polite">{score}/{total}</div>
          <div className="exam-muted">ติ๊กแล้ว {answered}/{exam.questionCount} ข้อ</div>
        </div>
      </div>
      <label className="exam-field">
        พิมพ์คำตอบเร็ว (เช่น กขคงก… หรือ 1234…, ข้อที่ไม่ได้ตอบใส่ -)
        <input value={quickText} onChange={(e) => applyQuickText(e.target.value)} placeholder="กขคง…" inputMode="text" />
      </label>
      <div className="exam-key-grid" aria-label="คำตอบของนักเรียน กดเลือก">
        {answers.map((answer, q) => {
          const mask = exam.keyMasks[q];
          return (
            <div key={q} className="exam-key-row">
              <span className="num">{q + 1}</span>
              {Array.from({ length: exam.choiceCount }, (_, c) => {
                const cls = answer === c ? (mask === 0 ? 'on' : (mask >> c) & 1 ? 'correct' : 'wrong') : '';
                return (
                  <button key={c} type="button" className={`exam-choice ${cls}`} onClick={() => setAnswer(q, c)} aria-pressed={answer === c} aria-label={`ข้อ ${q + 1} นักเรียนตอบ ${CHOICE_LABELS[c]}`}>
                    {CHOICE_LABELS[c]}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
      <div className="exam-row">
        <button type="button" className="exam-btn primary" onClick={() => { void save(); }} disabled={studentNo === null || saving || answered === 0}>
          <Save size={16} /> {saving ? 'กำลังบันทึก…' : 'บันทึกคะแนน แล้วไปคนถัดไป'}
        </button>
        <button type="button" className="exam-btn" onClick={() => applyQuickText('')} disabled={!answered}>ล้างคำตอบ</button>
      </div>
      {status && <div className={status.ok ? 'exam-ok' : 'exam-error'} role="status">{status.text}</div>}
    </div>
  );
};

/* ---------- คะแนนทั้งห้อง + ส่งเข้า ปพ.5 ในคลิกเดียว + วิเคราะห์ข้อสอบวิจัย (p, r, KR-20) ---------- */

const useExamAttempts = (exam: PaperExam | null, version: number) => {
  const [remote, setRemote] = useState<ExamAttempt[]>([]);
  const classroom = exam?.classroom;
  const examId = exam?.id;
  useEffect(() => {
    if (!classroom) return undefined;
    let cancelled = false;
    void fetchExamAttempts(undefined, classroom).then((list) => { if (!cancelled) setRemote(list); });
    return () => { cancelled = true; };
  }, [classroom, version]);
  return useMemo(() => {
    void version;
    if (!examId) return [];
    const byId = new Map<string, ExamAttempt>();
    [...remote, ...loadLocalExamAttempts()].forEach((a) => {
      if (a.examSetId !== examId) return;
      const current = byId.get(a.id);
      if (!current || current.timestamp < a.timestamp) byId.set(a.id, a);
    });
    return [...byId.values()];
  }, [examId, remote, version]);
};

const ClassResultsAndAnalytics: React.FC<{
  exam: PaperExam;
  attempts: ExamAttempt[];
  onExamUpdated: (updated: PaperExam) => void;
}> = ({ exam, attempts, onExamUpdated }) => {
  const toast = useToast();
  const [panelTab, setPanelTab] = useState<'scores' | 'analysis'>('scores');
  const indicators = useMemo(() => getIndicators(exam.classroom, exam.subject), [exam.classroom, exam.subject]);
  const maxScores = useMemo(() => examMaxScores(exam.classroom), [exam.classroom]);
  const [pushTarget, setPushTarget] = useState<Exclude<GradebookTarget, 'none'>>(() => {
    if (exam.gradebookTarget !== 'none') return exam.gradebookTarget;
    return indicators.length > 0 ? 'indicator' : 'final';
  });
  const [pushIndicatorId, setPushIndicatorId] = useState<string>(() => exam.indicatorId || indicators[0]?.id || '');

  const roster = useMemo(() => loadRoster(exam.classroom), [exam.classroom]);
  const bestAttempts = useMemo(() => bestAttemptPerStudent(attempts), [attempts]);
  const byNo = useMemo(() => {
    const map = new Map<number, ExamAttempt>();
    bestAttempts.forEach((a) => {
      const no = attemptStudentNo(a);
      if (Number.isFinite(no)) map.set(no, a);
    });
    return map;
  }, [bestAttempts]);

  const scored = useMemo(
    () => roster.map((s) => byNo.get(s.no)).filter((a): a is ExamAttempt => Boolean(a)),
    [roster, byNo],
  );

  const keyItems: AnswerKeyItem[] = useMemo(
    () => exam.keyMasks
      .map((mask, i) => ({ key: `q${i + 1}`, label: `ข้อ ${i + 1}`, mask, choiceCount: exam.choiceCount }))
      .filter((item) => item.mask > 0),
    [exam.keyMasks, exam.choiceCount],
  );

  const totalPossible = Math.max(1, scorePaperAnswers(exam, []).total);
  const psych = useMemo(
    () => computePsychometricSummary(scored, keyItems, totalPossible),
    [scored, keyItems, totalPossible],
  );
  const itemStats = useMemo(() => analyzeItems(scored, keyItems), [scored, keyItems]);
  const krDesc = describeKr20(psych.kr20);

  const handleBulkPushToGradebook = async () => {
    if (scored.length === 0) {
      toast.show('ยังไม่มีนักเรียนที่สแกนตรวจแล้วในชุดข้อสอบนี้', 'info');
      return;
    }
    const targetName = pushTarget === 'indicator'
      ? (() => {
        const ind = indicators.find((i) => i.id === pushIndicatorId) ?? indicators[0];
        return ind ? `คะแนนตัวชี้วัด K (${ind.code} เต็ม ${ind.maxScore})` : 'คะแนนตัวชี้วัด K';
      })()
      : pushTarget === 'midterm'
        ? `ช่องสอบกลางภาค (เต็ม ${maxScores.midterm})`
        : `ช่องสอบปลายภาค (เต็ม ${maxScores.final})`;

    const confirmed = await appConfirm(
      `ยืนยันส่งคะแนนเข้าสมุดคะแนน ปพ.5 ห้อง ${exam.classroom}?\n\n• จำนวนนักเรียนที่ส่ง: ${scored.length} คน\n• เป้าหมาย: ${targetName}\n• ระบบจะคำนวณสัดส่วนจากคะแนนเต็ม ${totalPossible} ให้ตรงช่องอัตโนมัติ (ไม่ลบคะแนนช่องอื่นของนักเรียน)`,
    );
    if (!confirmed) return;

    const result = syncAllPaperResultsToGradebook(exam, scored, {
      target: pushTarget,
      indicatorId: pushTarget === 'indicator' ? (pushIndicatorId || indicators[0]?.id) : undefined,
    });
    if (result.closed) {
      toast.show('สมุดคะแนนห้องนี้ปิดผลแล้ว กรุณาเปิดสมุดคะแนนก่อนส่งคะแนน', 'error');
      return;
    }
    // จำการผูกช่องนี้ไว้บนชุดข้อสอบด้วยเพื่อให้สแกนแผ่นถัดไปซิงก์ตรงช่องเดียวกัน
    if (exam.gradebookTarget !== pushTarget || (pushTarget === 'indicator' && exam.indicatorId !== pushIndicatorId)) {
      const updated = await savePaperExam({
        ...exam,
        gradebookTarget: pushTarget,
        indicatorId: pushTarget === 'indicator' ? (pushIndicatorId || indicators[0]?.id) : undefined,
      });
      onExamUpdated(updated);
    }
    toast.show(
      `ส่งคะแนน ${result.updated} คนเข้า ปพ.5 (${targetName}) เรียบร้อยแล้ว!`,
      'success',
    );
  };

  return (
    <div className="exam-card" style={{ display: 'grid', gap: 14 }}>
      <div className="exam-row" style={{ justifyContent: 'space-between' }}>
        <div className="exam-row" role="tablist" aria-label="มุมมองผลคะแนนและวิเคราะห์ข้อสอบ">
          <button
            type="button"
            role="tab"
            aria-selected={panelTab === 'scores'}
            className={`exam-btn compact ${panelTab === 'scores' ? 'primary' : ''}`}
            onClick={() => setPanelTab('scores')}
          >
            <FileSpreadsheet size={15} /> คะแนนทั้งห้อง ({scored.length}/{roster.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={panelTab === 'analysis'}
            className={`exam-btn compact ${panelTab === 'analysis' ? 'primary' : ''}`}
            onClick={() => setPanelTab('analysis')}
          >
            <BarChart3 size={15} /> วิเคราะห์ข้อสอบวิจัย (p, r, KR-20)
          </button>
        </div>

        <div className="exam-row">
          <button
            type="button"
            className="exam-btn compact"
            disabled={scored.length === 0}
            onClick={() => downloadCsv(
              buildScoresCsv(exam, scored),
              `คะแนน_${exam.classroom}_${exam.title.replace(/\s+/g, '_')}.csv`,
            )}
          >
            <Download size={15} /> CSV คะแนนห้อง
          </button>
          <button
            type="button"
            className="exam-btn compact"
            disabled={scored.length === 0 || keyItems.length === 0}
            onClick={() => downloadCsv(
              buildItemAnalysisCsv(exam.title, exam.classroom, scored, keyItems, CHOICE_LABELS),
              `วิเคราะห์ข้อสอบ_${exam.classroom}_${exam.title.replace(/\s+/g, '_')}.csv`,
            )}
          >
            <Download size={15} /> CSV วิเคราะห์ข้อสอบ (SPSS)
          </button>
        </div>
      </div>

      {/* KPI สรุปผลสอบระดับชั้นเรียน & วิจัย */}
      <div className="exam-kpi-grid">
        <div className="exam-kpi">
          <span>ตรวจแล้ว</span>
          <strong>{scored.length}/{roster.length} คน</strong>
          <small>เหลือยังไม่ตรวจ {Math.max(0, roster.length - scored.length)} คน</small>
        </div>
        <div className="exam-kpi">
          <span>ค่าเฉลี่ย (Mean ± S.D.)</span>
          <strong>{scored.length ? `${psych.meanScore}/${totalPossible}` : '—'}</strong>
          <small>{scored.length ? `S.D. = ${psych.sdScore} (${psych.meanPercent}%)` : 'รอสแกนแผ่นแรก'}</small>
        </div>
        <div className="exam-kpi">
          <span>ผ่านเกณฑ์ (≥50% / ≥70%)</span>
          <strong>{scored.length ? `${psych.passRate50}% / ${psych.passRate70}%` : '—'}</strong>
          <small>{scored.length ? `สูงสุด ${psych.maxScore} • ต่ำสุด ${psych.minScore}` : '—'}</small>
        </div>
        <div className="exam-kpi">
          <span>ความเชื่อมั่น (KR-20)</span>
          <strong>{psych.kr20 !== null ? psych.kr20.toFixed(2) : '—'}</strong>
          <small>{krDesc.label}</small>
        </div>
      </div>

      {/* แถบส่งคะแนนทั้งหมดเข้า ปพ.5 ในคลิกเดียว */}
      <div className="exam-card-subtle">
        <div className="exam-row" style={{ alignItems: 'end' }}>
          <label className="exam-field" style={{ flex: '1 1 200px' }}>
            ส่งคะแนนทั้งหมดเข้า ปพ.5 ช่อง
            <select
              value={pushTarget}
              onChange={(e) => {
                const next = e.target.value as Exclude<GradebookTarget, 'none'>;
                setPushTarget(next);
                if (next === 'indicator' && !pushIndicatorId && indicators[0]) {
                  setPushIndicatorId(indicators[0].id);
                }
              }}
            >
              {indicators.length > 0 && <option value="indicator">ตัวชี้วัด K</option>}
              {maxScores.midterm > 0 && <option value="midterm">สอบกลางภาค (เต็ม {maxScores.midterm})</option>}
              <option value="final">สอบปลายภาค (เต็ม {maxScores.final})</option>
            </select>
          </label>
          {pushTarget === 'indicator' && indicators.length > 0 && (
            <label className="exam-field" style={{ flex: '2 1 260px' }}>
              ตัวชี้วัดเป้าหมาย
              <select value={pushIndicatorId} onChange={(e) => setPushIndicatorId(e.target.value)}>
                {indicators.map((ind) => (
                  <option key={ind.id} value={ind.id}>{ind.code} (เต็ม {ind.maxScore}) — {ind.title.slice(0, 52)}</option>
                ))}
              </select>
            </label>
          )}
          <button
            type="button"
            className="exam-btn success"
            disabled={scored.length === 0}
            onClick={() => { void handleBulkPushToGradebook(); }}
          >
            <Send size={15} /> ส่งคะแนนทั้งหมด ({scored.length} คน) เข้า ปพ.5
          </button>
        </div>
      </div>

      {panelTab === 'scores' && (
        <div className="exam-table-wrap">
          <table className="exam-table">
            <thead>
              <tr>
                <th>เลขที่</th>
                <th>ชื่อ-สกุล</th>
                <th>คะแนน</th>
                <th>ร้อยละ</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((s) => {
                const a = byNo.get(s.no);
                return (
                  <tr key={s.studentCode}>
                    <td>{s.no}</td>
                    <td>{s.name}</td>
                    {a ? (
                      <>
                        <td><strong>{a.score}</strong>/{a.totalQuestions}</td>
                        <td>{a.percentage}%</td>
                        <td>
                          <span className={`exam-pill ${a.percentage >= 70 ? 'good' : a.percentage >= 50 ? 'warn' : 'bad'}`}>
                            {a.percentage >= 70 ? 'ดีมาก (≥70%)' : a.percentage >= 50 ? 'ผ่าน (≥50%)' : 'ต้องซ่อมเสริม'}
                          </span>
                        </td>
                      </>
                    ) : (
                      <td colSpan={3} className="exam-muted">ยังไม่ตรวจ</td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {panelTab === 'analysis' && (
        <div style={{ display: 'grid', gap: 10 }}>
          {scored.length === 0 ? (
            <p>ยังไม่มีข้อมูลคำตอบของนักเรียน กรุณาสแกนหรือติ๊กคะแนนก่อน ระบบจะคำนวณค่า p, r, KR-20 และตัวลวงให้อัตโนมัติ</p>
          ) : (
            <>
              <div className="exam-row">
                <span className="exam-pill good">ข้อสอบคุณภาพดี (p 0.20–0.80, r ≥ 0.20): {psych.goodItemsCount} ข้อ</span>
                <span className={`exam-pill ${psych.reviewItemsCount > 0 ? 'warn' : 'good'}`}>
                  ควรทบทวน/ปรับตัวลวง: {psych.reviewItemsCount} ข้อ
                </span>
                <span className={`exam-pill ${krDesc.level === 'muted' ? '' : krDesc.level}`}>
                  KR-20 = {psych.kr20 !== null ? psych.kr20.toFixed(3) : '—'} ({krDesc.label})
                </span>
              </div>
              <div className="exam-table-wrap">
                <table className="exam-table">
                  <thead>
                    <tr>
                      <th>ข้อ</th>
                      <th>เฉลย</th>
                      <th>ตอบถูก</th>
                      <th>ความยาก (p)</th>
                      <th>อำนาจจำแนก (r)</th>
                      <th>สัดส่วนการเลือกตัวลวง (ก–ง)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemStats.map((item) => (
                      <tr key={item.key}>
                        <td><strong>{item.label}</strong></td>
                        <td><span className="exam-pill good">{maskLabels(item.mask)}</span></td>
                        <td>{Math.round(item.p * item.n)}/{item.n}</td>
                        <td>
                          <strong>{item.p.toFixed(2)}</strong>{' '}
                          <span className={`exam-pill ${item.p >= 0.2 && item.p <= 0.8 ? 'good' : 'warn'}`}>
                            {describeDifficulty(item.p)}
                          </span>
                        </td>
                        <td>
                          <strong>{item.r === null ? '—' : item.r.toFixed(2)}</strong>{' '}
                          <span className={`exam-pill ${item.r === null ? '' : item.r < 0.2 ? 'bad' : 'good'}`}>
                            {describeDiscrimination(item.r)}
                          </span>
                        </td>
                        <td>
                          <div className="exam-distractors">
                            {item.choiceCounts.map((count, c) => {
                              const pct = item.n ? Math.round((count / item.n) * 100) : 0;
                              const isKey = ((item.mask >> c) & 1) === 1;
                              return (
                                <span key={c} className={`exam-distractor-chip ${isKey ? 'is-key' : ''}`}>
                                  {CHOICE_LABELS[c]} {pct}%
                                </span>
                              );
                            })}
                            {item.blank > 0 && <span className="exam-muted">ว่าง {item.blank}</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p style={{ fontSize: '0.82rem' }}>
                เกณฑ์งานวิจัยมาตรฐาน: ความยาก <strong>p = 0.20–0.80</strong>, อำนาจจำแนก <strong>r ≥ 0.20</strong> (กลุ่มสูง–ต่ำ 27%, ต้องมีผู้สอบ ≥ 6 คน), ความเชื่อมั่น <strong>KR-20 ≥ 0.70</strong> • กดปุ่ม “CSV วิเคราะห์ข้อสอบ (SPSS)” เพื่อส่งออกเมทริกซ์ 0/1 ไปทำบทที่ 4 หรือ SPSS ได้ทันที
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

/* ---------- หน้าหลัก ZipGrade OMR Studio: 1 เลือกข้อสอบ → 2 เฉลย → 3 พิมพ์ A4 → 4 สแกน & ปพ.5 ---------- */

type Step = 'pick' | 'key' | 'print' | 'check';

const PaperExamManager: React.FC = () => {
  const toast = useToast();
  const [exams, setExams] = useState<PaperExam[]>([]);
  const [step, setStep] = useState<Step>('pick');
  const [current, setCurrent] = useState<PaperExam | null>(null);
  const [checkMode, setCheckMode] = useState<'live' | 'photo' | 'tick'>('live');
  const [scans, setScans] = useState<ScanItem[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const byCode = useMemo(() => new Map(exams.map((exam) => [exam.code, exam])), [exams]);
  const attempts = useExamAttempts(current, version);
  const checkedNos = useMemo(() => new Set(attempts.map((a) => attemptStudentNo(a))), [attempts]);

  useEffect(() => {
    let cancelled = false;
    void fetchPaperExams().then((list) => { if (!cancelled) setExams(list); });
    return () => { cancelled = true; };
  }, []);

  const openExam = (exam: PaperExam, targetStep?: Step) => {
    setCurrent(exam);
    setScans([]);
    setScanError(null);
    setMessage(null);
    const keyed = exam.keyMasks.some((m) => m > 0);
    setStep(targetStep ?? (keyed ? 'check' : 'key'));
  };

  const saveKey = async (exam: PaperExam, rescoreExisting: boolean) => {
    try {
      const saved = await savePaperExam(exam);
      setExams((prev) => [saved, ...prev.filter((e) => e.id !== saved.id)]);
      setCurrent(saved);
      if (rescoreExisting && attempts.length > 0) {
        const count = await rescorePaperResults(saved, attempts);
        setVersion((v) => v + 1);
        toast.show(`บันทึกเฉลยและคำนวณคะแนนใหม่ให้ ${count} คนเรียบร้อย`, 'success');
        setMessage(`บันทึกเฉลย "${saved.title}" และคำนวณคะแนนใหม่ให้ ${count} คนแล้ว`);
      } else {
        toast.show(`บันทึกเฉลย "${saved.title}" เรียบร้อย`, 'success');
        setMessage(`บันทึกเฉลย "${saved.title}" แล้ว พิมพ์กระดาษคำตอบหรือเริ่มสแกนได้เลย`);
      }
      setStep('check');
    } catch (error) {
      setMessage(`บันทึกไม่สำเร็จ: ${error instanceof Error ? error.message : 'ลองใหม่อีกครั้ง'}`);
    }
  };

  const handleDuplicateExam = async (exam: PaperExam) => {
    const copy = duplicatePaperExam(exam, exams);
    const saved = await savePaperExam(copy);
    setExams((prev) => [saved, ...prev]);
    toast.show(`สร้าง "${saved.title}" (รหัสชุด ${saved.code}) แล้ว`, 'success');
    openExam(saved, 'key');
  };

  const removeExam = async (exam: PaperExam) => {
    if (!(await appConfirm(`ลบชุดข้อสอบ "${exam.title}"?\n(คะแนนที่ตรวจแล้วในสมุดคะแนน ปพ.5 ยังอยู่ครบไม่หาย)`, { danger: true }))) return;
    await deletePaperExam(exam.id);
    setExams((prev) => prev.filter((e) => e.id !== exam.id));
    if (current?.id === exam.id) {
      setCurrent(null);
      setStep('pick');
    }
    toast.show(`ลบชุดข้อสอบ "${exam.title}" แล้ว`, 'info');
  };

  const handleLiveCaptured = useCallback((payload: LiveCapturePayload) => {
    const { source, reading, exam, autoSaveRequested } = payload;
    const itemId = `live-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const answers = exam ? reading.answers.slice(0, exam.questionCount) : reading.answers;
    const baseItem: ScanItem = {
      id: itemId,
      fileName: `กล้องสด-${reading.studentNo ?? 'ไม่พบเลขที่'}`,
      source,
      reading,
      exam,
      studentNo: reading.studentNo,
      answers,
      saved: null,
    };
    setScans((prev) => [baseItem, ...prev.slice(0, 29)]);

    if (autoSaveRequested && exam && reading.studentNo !== null) {
      void savePaperResult(exam, reading.studentNo, answers).then((res) => {
        const gb = res.gradebook === 'saved' ? ` • ลง ปพ.5 ${res.gradebookScore}/${res.gradebookMax}` : '';
        const text = `บันทึกอัตโนมัติแล้ว (${res.attempt.score}/${res.attempt.totalQuestions})${gb}`;
        setScans((prev) => prev.map((s) => (s.id === itemId ? { ...s, saved: { remote: res.remote, text } } : s)));
        setVersion((v) => v + 1);
      });
    }
  }, []);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setScanError(null);
    const added: ScanItem[] = [];
    const errors: string[] = [];
    for (const file of Array.from(files)) {
      try {
        const source = await loadImageCanvas(file);
        const { data } = source.getContext('2d')!.getImageData(0, 0, source.width, source.height);
        const result = scanAnswerSheets(
          rgbaToGray(data, source.width, source.height),
          (code) => {
            const exam = code === null ? undefined : byCode.get(code);
            return exam ? { questionCount: exam.questionCount, choiceCount: exam.choiceCount } : null;
          },
          { questionCount: current?.questionCount ?? 40, choiceCount: current?.choiceCount ?? 4 },
        );
        if (result.error) {
          errors.push(`${file.name}: ${result.error}`);
          continue;
        }
        result.sheets.forEach((reading, i) => {
          const exam = reading.examCode === null ? null : (byCode.get(reading.examCode) ?? null);
          added.push({
            id: `${file.name}-${Date.now()}-${i}`,
            fileName: file.name,
            source,
            reading,
            exam,
            studentNo: reading.studentNo,
            answers: exam ? reading.answers.slice(0, exam.questionCount) : reading.answers,
            saved: null,
          });
        });
      } catch (error) {
        errors.push(`${file.name}: เปิดภาพไม่ได้ (${error instanceof Error ? error.message : 'ไม่ทราบสาเหตุ'})`);
      }
    }
    setScans((prev) => [...added, ...prev]);
    if (errors.length) setScanError(errors.join('\n'));
    setBusy(false);
  };

  /** สร้างภาพกระดาษคำตอบจำลองที่เอียงเล็กน้อยแล้วส่งเข้าตัวสแกน CV จริง เพื่อทดสอบระบบได้ทันทีใน 1 คลิก */
  const handleDemoSyntheticScan = () => {
    if (!current) return;
    setScanError(null);
    const roster = loadRoster(current.classroom);
    const nextStudent = roster.find((s) => !checkedNos.has(s.no)) ?? roster[0] ?? { no: 1, name: 'นักเรียนทดสอบ' };
    const answers = current.keyMasks.map((mask, idx) => {
      // จำลองให้ตอบถูก ~75% ผิด ~20% และเว้นว่าง 1 ข้อ
      if (idx === current.questionCount - 1 && current.questionCount >= 10) return null;
      const correctChoice = Array.from({ length: current.choiceCount }, (_, c) => c).find((c) => ((mask >> c) & 1) === 1);
      if (correctChoice !== undefined && (idx + nextStudent.no) % 4 !== 0) return correctChoice;
      return (idx * 3 + nextStudent.no) % current.choiceCount;
    });
    const source = renderDemoAnswerSheetCanvas({
      title: current.title,
      classroom: current.classroom,
      examCode: current.code,
      questionCount: current.questionCount,
      choiceCount: current.choiceCount,
      studentNo: nextStudent.no,
      studentName: nextStudent.name,
      answers,
      tiltDeg: ((nextStudent.no % 5) - 2) * 1.4,
    });
    const { data } = source.getContext('2d')!.getImageData(0, 0, source.width, source.height);
    const result = scanAnswerSheets(
      rgbaToGray(data, source.width, source.height),
      (code) => {
        const exam = code === null ? undefined : byCode.get(code);
        return exam ? { questionCount: exam.questionCount, choiceCount: exam.choiceCount } : null;
      },
      { questionCount: current.questionCount, choiceCount: current.choiceCount },
    );
    if (result.error || !result.sheets[0]) {
      setScanError(result.error || 'สแกนภาพจำลองไม่สำเร็จ');
      return;
    }
    const reading = result.sheets[0];
    const matchedExam = reading.examCode !== null ? (byCode.get(reading.examCode) ?? current) : current;
    setScans((prev) => [
      {
        id: `demo-${Date.now()}`,
        fileName: `ภาพจำลอง-เลขที่${nextStudent.no}`,
        source,
        reading,
        exam: matchedExam,
        studentNo: reading.studentNo,
        answers: reading.answers.slice(0, matchedExam.questionCount),
        saved: null,
      },
      ...prev,
    ]);
    toast.show(`สแกนภาพจำลอง เลขที่ ${reading.studentNo} สำเร็จ! ตรวจวงกลมเขียว/แดงแล้วกดบันทึกได้เลย`, 'success');
  };

  const steps: { id: Step; label: string }[] = [
    { id: 'pick', label: '1. ชุดข้อสอบ' },
    { id: 'key', label: '2. ตั้งเฉลย & ปพ.5' },
    { id: 'print', label: '3. พิมพ์กระดาษ A4' },
    { id: 'check', label: '4. สแกนตรวจ & วิเคราะห์' },
  ];

  return (
    <div className="exam-tools">
      <div className="exam-hero">
        <div>
          <h2>📷 ระบบสแกนตรวจข้อสอบกระดาษ (ZipGrade OMR ฟรีในเว็บ)</h2>
          <p>
            พิมพ์กระดาษคำตอบ 10–40 ข้อ (ระบุชื่อทั้งห้องหรือแผ่นเปล่า) • ส่องกล้องมือถือตรวจสดพร้อมเสียงติ๊ด • ส่งคะแนนเข้า ปพ.5 (K / กลางภาค / ปลายภาค) + วิเคราะห์ p, r, KR-20 อัตโนมัติ
          </p>
        </div>
        {current && (
          <div className="exam-row">
            <span className="exam-pill paper">ชุด {current.code}: {current.title}</span>
            <span className="exam-pill">{current.classroom} • {current.questionCount} ข้อ</span>
            <span className="exam-pill online">{describeGradebookTarget(current)}</span>
          </div>
        )}
      </div>

      <div className="exam-row" role="tablist" aria-label="ขั้นตอนระบบตรวจข้อสอบ ZipGrade">
        {steps.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={step === s.id}
            className={`exam-btn ${step === s.id ? 'primary' : ''}`}
            disabled={s.id !== 'pick' && !current}
            onClick={() => setStep(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {message && <div className="exam-ok" role="status">{message}</div>}

      {/* ขั้นที่ 1: รายการชุดข้อสอบ */}
      {step === 'pick' && (
        <div className="exam-card" style={{ display: 'grid', gap: 10 }}>
          <div className="exam-row" style={{ justifyContent: 'space-between' }}>
            <h3>ชุดข้อสอบกระดาษทั้งหมด ({exams.length})</h3>
            <button
              type="button"
              className="exam-btn primary"
              onClick={() => {
                setCurrent(newPaperExam(exams, 'ป.4', 'main'));
                setStep('key');
              }}
            >
              <Plus size={16} /> สร้างชุดข้อสอบใหม่
            </button>
          </div>
          {exams.length === 0 && (
            <div className="exam-card-subtle">
              <p>ยังไม่มีชุดข้อสอบ กดปุ่ม <strong>“สร้างชุดข้อสอบใหม่”</strong> เลือกจำนวนข้อ (10 / 20 / 30 / 40) และติ๊กเฉลยได้เลย ใช้เวลาไม่ถึง 1 นาที</p>
            </div>
          )}
          {exams.map((exam) => {
            const missing = exam.keyMasks.filter((m) => m === 0).length;
            return (
              <div key={exam.id} className="exam-card-subtle exam-row" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'grid', gap: 4 }}>
                  <strong>{exam.title}</strong>
                  <div className="exam-row">
                    <span className="exam-pill paper">รหัส {exam.code}</span>
                    <span className="exam-pill">{exam.classroom}</span>
                    <span className="exam-pill">{exam.questionCount} ข้อ ({exam.choiceCount} ตัวเลือก)</span>
                    <span className="exam-pill online">{describeGradebookTarget(exam)}</span>
                    <span className={`exam-pill ${missing ? 'warn' : 'good'}`}>
                      {missing ? `ยังไม่ตั้งเฉลย ${missing} ข้อ` : 'เฉลยครบพร้อมตรวจ'}
                    </span>
                  </div>
                </div>
                <div className="exam-row">
                  <button type="button" className="exam-btn primary compact" onClick={() => openExam(exam, 'check')}>
                    <ScanLine size={15} /> สแกนตรวจ
                  </button>
                  <button type="button" className="exam-btn compact" onClick={() => openExam(exam, 'print')}>
                    <Printer size={15} /> พิมพ์ A4
                  </button>
                  <button type="button" className="exam-btn compact" onClick={() => openExam(exam, 'key')}>
                    <Pencil size={15} /> เฉลย
                  </button>
                  <button
                    type="button"
                    className="exam-btn compact"
                    title="สร้างชุดสลับข้อ (ชุด 2) จากเฉลยนี้"
                    onClick={() => { void handleDuplicateExam(exam); }}
                  >
                    <Copy size={15} /> ชุดสลับข้อ
                  </button>
                  <button
                    type="button"
                    className="exam-btn danger compact"
                    onClick={() => { void removeExam(exam); }}
                    aria-label={`ลบข้อสอบ ${exam.title}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ขั้นที่ 2: แก้เฉลย & ปพ.5 */}
      {step === 'key' && current && (
        <ExamEditor
          key={current.id}
          exam={current}
          existingAttemptCount={attempts.length}
          onSave={(exam, rescore) => { void saveKey(exam, rescore); }}
          onCancel={() => setStep(exams.some((e) => e.id === current.id) ? 'check' : 'pick')}
        />
      )}

      {/* ขั้นที่ 3: พิมพ์กระดาษคำตอบ A4 */}
      {step === 'print' && current && (
        <AnswerSheetPrintPanel
          key={current.id}
          exam={current}
          onNotify={(msg) => toast.show(msg, 'error')}
          onGoScan={() => setStep('check')}
        />
      )}

      {/* ขั้นที่ 4: สแกนตรวจ + คะแนนทั้งห้อง + ส่งเข้า ปพ.5 + วิเคราะห์วิจัย */}
      {step === 'check' && current && (
        <>
          <div className="exam-row" style={{ justifyContent: 'space-between' }}>
            <div className="exam-row" role="tablist" aria-label="วิธีตรวจข้อสอบ">
              <button
                type="button"
                role="tab"
                aria-selected={checkMode === 'live'}
                className={`exam-btn ${checkMode === 'live' ? 'primary' : ''}`}
                onClick={() => setCheckMode('live')}
              >
                <ScanLine size={16} /> สแกนกล้องสด (ZipGrade)
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={checkMode === 'photo'}
                className={`exam-btn ${checkMode === 'photo' ? 'primary' : ''}`}
                onClick={() => setCheckMode('photo')}
              >
                <Images size={16} /> ถ่ายรูป / อัปโหลดหลายแผ่น
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={checkMode === 'tick'}
                className={`exam-btn ${checkMode === 'tick' ? 'primary' : ''}`}
                onClick={() => setCheckMode('tick')}
              >
                <CheckCircle2 size={16} /> ติ๊กคำตอบเอง
              </button>
            </div>
            <button type="button" className="exam-btn" onClick={() => setStep('print')}>
              <Printer size={15} /> พิมพ์กระดาษคำตอบ A4
            </button>
          </div>

          {checkMode === 'live' && (
            <div className="exam-card" style={{ display: 'grid', gap: 12 }}>
              <LiveOmrCameraScanner
                currentExam={current}
                examsByCode={byCode}
                onCaptured={handleLiveCaptured}
              />
              <div className="exam-row" style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                <button type="button" className="exam-btn" onClick={() => galleryRef.current?.click()} disabled={busy}>
                  <Images size={16} /> อัปโหลดรูปหลายแผ่นพร้อมกัน
                </button>
                <button type="button" className="exam-btn" onClick={handleDemoSyntheticScan}>
                  <FlaskConical size={16} /> ทดลองสแกนด้วยภาพจำลอง (Demo)
                </button>
                <span className="exam-muted" style={{ fontSize: '0.82rem' }}>
                  ประมวลผลบนเบราว์เซอร์ 100% ฟรีไม่จำกัดแผ่น ภาพไม่ถูกส่งออกนอกเครื่อง
                </span>
              </div>
              {scanError && <div className="exam-error" style={{ whiteSpace: 'pre-line' }}>{scanError}</div>}
            </div>
          )}

          {checkMode === 'photo' && (
            <div className="exam-card" style={{ display: 'grid', gap: 10 }}>
              <p>รองรับทั้งการถ่ายทีละแผ่นจากกล้องมือถือ และการเลือกหลายรูปพร้อมกันจากแกลเลอรี (A4 ที่ยังไม่ตัด 2 แผ่นก็ตรวจได้ในรูปเดียว!)</p>
              <div className="exam-row">
                <button type="button" className="exam-btn primary" onClick={() => cameraRef.current?.click()} disabled={busy}>
                  <Camera size={16} /> ถ่ายรูปด้วยกล้องมือถือ
                </button>
                <button type="button" className="exam-btn" onClick={() => galleryRef.current?.click()} disabled={busy}>
                  <Images size={16} /> เลือกรูปหลายแผ่นจากเครื่อง
                </button>
                <button type="button" className="exam-btn" onClick={handleDemoSyntheticScan}>
                  <FlaskConical size={16} /> ทดลองสแกนด้วยภาพจำลอง
                </button>
              </div>
              <ul className="exam-muted" style={{ margin: 0, paddingLeft: 18, fontSize: '0.86rem' }}>
                <li>วางกระดาษบนพื้นเรียบ ให้เห็นสี่เหลี่ยมดำครบ 4 มุม (ระบบมี Adaptive Threshold ชดเชยเงาและแสงเอียงอัตโนมัติ)</li>
                <li>ตรวจเสร็จแล้วเห็นวงกลมเขียว/แดงซ้อนบนภาพจริง และกดแก้ข้อที่ฝนไม่ชัดได้ทันที</li>
              </ul>
              {busy && <div className="exam-ok">กำลังตรวจกระดาษคำตอบ…</div>}
              {scanError && <div className="exam-error" style={{ whiteSpace: 'pre-line' }}>{scanError}</div>}
            </div>
          )}

          <input ref={cameraRef} className="exam-file-input" type="file" accept="image/*" capture="environment" onChange={(e) => { void handleFiles(e.target.files); e.target.value = ''; }} />
          <input ref={galleryRef} className="exam-file-input" type="file" accept="image/*" multiple onChange={(e) => { void handleFiles(e.target.files); e.target.value = ''; }} />

          {checkMode === 'tick' && (
            <ManualChecker key={current.id} exam={current} checkedNos={checkedNos} onSaved={() => setVersion((v) => v + 1)} />
          )}

          {checkMode !== 'tick' && scans.map((item) => (
            <ScanCard
              key={item.id}
              item={item}
              onChange={(next) => {
                setScans((prev) => prev.map((s) => (s.id === next.id ? next : s)));
                if (next.saved) setVersion((v) => v + 1);
              }}
              onRemove={() => setScans((prev) => prev.filter((s) => s.id !== item.id))}
            />
          ))}

          <ClassResultsAndAnalytics
            exam={current}
            attempts={attempts}
            onExamUpdated={(updated) => {
              setCurrent(updated);
              setExams((prev) => [updated, ...prev.filter((e) => e.id !== updated.id)]);
            }}
          />
        </>
      )}
    </div>
  );
};

export default PaperExamManager;
