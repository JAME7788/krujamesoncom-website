import React, { useEffect, useMemo, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { CLASSROOMS } from '../services/courseAccessService';
import { fetchExamAttempts, getExamSetById, type ExamAttempt } from '../services/examService';
import { fetchPaperExams, maskLabels, type PaperExam } from '../services/paperExamService';
import { loadRoster } from '../services/rosterService';
import {
  analyzeItems,
  bestAttemptPerStudent,
  buildItemAnalysisCsv,
  computePsychometricSummary,
  describeDifficulty,
  describeDiscrimination,
  describeKr20,
  summarizeAttempts,
  type AnswerKeyItem,
} from '../utils/examAnalysis';
import { CHOICE_LABELS } from '../utils/answerSheet';
import './ExamTools.css';

const downloadCsvFile = (csv: string, filename: string) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const keyFor = (examSetId: string, paperExams: PaperExam[]): AnswerKeyItem[] => {
  const paper = paperExams.find((exam) => exam.id === examSetId);
  if (paper) {
    return paper.keyMasks
      .map((mask, i) => ({ key: `q${i + 1}`, label: `ข้อ ${i + 1}`, mask, choiceCount: paper.choiceCount }))
      .filter((item) => item.mask > 0);
  }
  const set = getExamSetById(examSetId);
  return set
    ? set.questions.map((q) => ({ key: q.id, label: `ข้อ ${q.number}`, mask: 1 << q.answerIndex, choiceCount: q.options.length }))
    : [];
};

const ExamGroup: React.FC<{ examSetId: string; attempts: ExamAttempt[]; classroom: string; paperExams: PaperExam[] }> = ({
  examSetId, attempts, classroom, paperExams,
}) => {
  const [showItems, setShowItems] = useState(false);
  const roster = loadRoster(classroom);
  const rosterNos = new Set(roster.map((s) => s.no));
  const best = useMemo(() => bestAttemptPerStudent(attempts), [attempts]);
  const noOf = (a: ExamAttempt) => a.studentNo ?? Number(a.studentId.split('_')[1]);
  // นับเฉพาะนักเรียนในรายชื่อห้อง (เลขที่ที่อ่านผิดหรือไม่อยู่ในรายชื่อ แยกแสดงต่างหาก)
  const inRoster = best.filter((a) => rosterNos.has(noOf(a)));
  const outsideRoster = best.length - inRoster.length;
  const summary = summarizeAttempts(inRoster);
  const isPaper = attempts.some((a) => a.source === 'paper');
  const key = useMemo(() => keyFor(examSetId, paperExams), [examSetId, paperExams]);
  const psych = computePsychometricSummary(inRoster, key);
  const krDesc = describeKr20(psych.kr20);
  const items = useMemo(() => (showItems ? analyzeItems(best, key) : []), [best, key, showItems]);
  const countByStudent = new Map<string, number>();
  attempts.forEach((a) => countByStudent.set(a.studentId, (countByStudent.get(a.studentId) || 0) + 1));
  const bestByNo = new Map<number, ExamAttempt>();
  inRoster.forEach((a) => bestByNo.set(noOf(a), a));

  return (
    <div className="exam-card">
      <div className="exam-row" style={{ justifyContent: 'space-between' }}>
        <div>
          <h3>{attempts[0].examTitle}</h3>
          <div className="exam-row">
            <span className={`exam-pill ${isPaper ? 'paper' : 'online'}`}>{isPaper ? 'ข้อสอบกระดาษ (สแกน)' : 'คลังข้อสอบออนไลน์'}</span>
            <span className="exam-pill">สอบแล้ว {summary.takers}/{roster.length} คน</span>
            {outsideRoster > 0 && <span className="exam-pill warn">เลขที่นอกรายชื่อ {outsideRoster} คน</span>}
            <span className="exam-pill">เฉลี่ย {psych.meanScore}/{psych.totalPossible} (S.D. {psych.sdScore})</span>
            <span className={`exam-pill ${summary.passRate >= 70 ? 'good' : summary.passRate >= 50 ? 'warn' : 'bad'}`}>ผ่าน 50% ขึ้นไป {summary.passRate}%</span>
            {psych.kr20 !== null && (
              <span className={`exam-pill ${krDesc.level === 'muted' ? '' : krDesc.level}`} title={krDesc.label}>
                KR-20 = {psych.kr20.toFixed(2)}
              </span>
            )}
          </div>
        </div>
        <div className="exam-row">
          <button type="button" className="exam-btn" onClick={() => setShowItems(!showItems)} disabled={!key.length}>
            {showItems ? 'ซ่อนการวิเคราะห์ข้อสอบ' : 'วิเคราะห์ข้อสอบ (p, r, KR-20)'}
          </button>
          {key.length > 0 && best.length > 0 && (
            <button
              type="button"
              className="exam-btn"
              onClick={() => downloadCsvFile(
                buildItemAnalysisCsv(attempts[0].examTitle, classroom, best, key, CHOICE_LABELS),
                `วิเคราะห์ข้อสอบ_${classroom}_${attempts[0].examTitle.replace(/\s+/g, '_')}.csv`,
              )}
            >
              <Download size={15} /> Export CSV (SPSS/Excel)
            </button>
          )}
        </div>
      </div>

      {showItems && (
        <div className="exam-table-wrap" style={{ marginTop: 10 }}>
          <table className="exam-table">
            <thead>
              <tr><th>ข้อ</th><th>เฉลย</th><th>ตอบถูก</th><th>ค่าความยาก p</th><th>อำนาจจำแนก r</th><th>เลือกแต่ละตัว</th></tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.key}>
                  <td>{item.label}</td>
                  <td>{maskLabels(item.mask)}</td>
                  <td>{Math.round(item.p * item.n)}/{item.n}</td>
                  <td>{item.p.toFixed(2)} <span className="exam-muted">{describeDifficulty(item.p)}</span></td>
                  <td>
                    {item.r === null ? '-' : item.r.toFixed(2)}{' '}
                    <span className={`exam-pill ${item.r !== null && item.r < 0.2 ? 'bad' : 'good'}`}>{describeDiscrimination(item.r)}</span>
                  </td>
                  <td>
                    {item.choiceCounts.map((count, c) => (
                      <span key={c} style={{ marginRight: 8, fontWeight: (item.mask >> c) & 1 ? 800 : 400 }}>
                        {CHOICE_LABELS[c]} {item.n ? Math.round((count / item.n) * 100) : 0}%
                      </span>
                    ))}
                    {item.blank > 0 && <span className="exam-muted">ว่าง {item.blank}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ marginTop: 6 }}>p 0.20–0.80 = ความยากพอเหมาะ, r ตั้งแต่ 0.20 = จำแนกเด็กเก่ง/อ่อนได้ (ใช้ผลดีที่สุดของแต่ละคน) • ตัวหนาคือเฉลย ตัวลวงที่ไม่มีใครเลือกควรปรับ</p>
        </div>
      )}

      <div className="exam-table-wrap" style={{ marginTop: 10 }}>
        <table className="exam-table">
          <thead>
            <tr><th>เลขที่</th><th>ชื่อ</th><th>คะแนนดีสุด</th><th>%</th><th>ครั้งที่ทำ</th><th>ล่าสุด</th></tr>
          </thead>
          <tbody>
            {roster.map((student) => {
              const attempt = bestByNo.get(student.no);
              return (
                <tr key={student.studentCode}>
                  <td>{student.no}</td>
                  <td>{student.name}</td>
                  {attempt ? (
                    <>
                      <td>{attempt.score}/{attempt.totalQuestions}</td>
                      <td>{attempt.percentage}%</td>
                      <td>{countByStudent.get(attempt.studentId) || 1}</td>
                      <td>{new Date(attempt.timestamp).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</td>
                    </>
                  ) : (
                    <td colSpan={4} className="exam-muted">ยังไม่สอบ</td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ExamResultsPanel: React.FC = () => {
  const [classroom, setClassroom] = useState<string>(CLASSROOMS[3] || 'ป.4');
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [paperExams, setPaperExams] = useState<PaperExam[]>([]);
  const [loading, setLoading] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      void Promise.all([fetchExamAttempts(undefined, classroom), fetchPaperExams()]).then(([list, exams]) => {
        if (cancelled) return;
        setAttempts(list.filter((a) => a.classroom === classroom));
        setPaperExams(exams);
        setLoading(false);
      });
    }, 0);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [classroom, version]);

  const groups = useMemo(() => {
    const map = new Map<string, ExamAttempt[]>();
    attempts.forEach((a) => map.set(a.examSetId, [...(map.get(a.examSetId) || []), a]));
    return [...map.entries()].sort((a, b) => Math.max(...b[1].map((x) => x.timestamp)) - Math.max(...a[1].map((x) => x.timestamp)));
  }, [attempts]);

  return (
    <div className="exam-tools">
      <div>
        <h2>ผลสอบรายห้อง</h2>
        <p>รวมผลจากคลังข้อสอบออนไลน์ที่นักเรียนทำในเว็บ และข้อสอบกระดาษที่ครูสแกนตรวจ พร้อมวิเคราะห์ข้อสอบรายข้อ</p>
      </div>
      <div className="exam-row">
        <label className="exam-field">
          ห้อง
          <select value={classroom} onChange={(e) => setClassroom(e.target.value)}>
            {CLASSROOMS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <button type="button" className="exam-btn" style={{ alignSelf: 'end' }} onClick={() => setVersion(version + 1)} disabled={loading}>
          <RefreshCw size={16} /> {loading ? 'กำลังโหลด…' : 'โหลดใหม่'}
        </button>
      </div>
      {!loading && groups.length === 0 && (
        <div className="exam-card">
          <p>ยังไม่มีผลสอบของ {classroom} ในฐานข้อมูลกลาง ผลที่นักเรียนทำก่อนเปิดกฎฐานข้อมูลจะอยู่แค่ในเครื่องที่นักเรียนใช้สอบ</p>
        </div>
      )}
      {groups.map(([examSetId, list]) => (
        <ExamGroup key={examSetId} examSetId={examSetId} attempts={list} classroom={classroom} paperExams={paperExams} />
      ))}
    </div>
  );
};

export default ExamResultsPanel;
