import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Eye,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import {
  loadAssignments, createAssignment, deleteAssignment,
  getSubmissionsByAssignment, reviewSubmission,
  fetchAssignmentsFromFirebase, fetchSubmissionsFromFirebase,
} from '../services/homeworkService';
import type { Assignment, Submission } from '../services/homeworkService';
import { allClassrooms2569 } from '../data/students2569';
import { getSubjectsForClassroom, getIndicators } from '../services/gradeService';
import type { Subject } from '../services/gradeService';
import { getTechnologyLessonPlans } from '../data/technologyLessonPlans';
import type { PrimaryTechnologyGradeId } from '../data/technologyTeachingSchedule';
import { loadRoster } from '../services/rosterService';
import './HomeworkManager.css';

const HomeworkManager: React.FC = () => {
  const [list, setList] = useState(loadAssignments());
  const [show, setShow] = useState(false);
  const [draft, setDraft] = useState<Partial<Assignment>>({
    title: '', description: '', classroom: '', dueDate: new Date().toISOString().slice(0, 10),
    maxScore: 10, knowledgeMaxScore: 5, practiceMaxScore: 5, resourceUrl: '', category: 'k',
  });
  const [viewing, setViewing] = useState<Assignment | null>(null);
  const [syncing, setSyncing] = useState(true);

  const draftSubjects = useMemo(
    () => (draft.classroom ? getSubjectsForClassroom(draft.classroom) : []),
    [draft.classroom]
  );
  const draftIndicators = useMemo(
    () => (draft.classroom && draft.subject ? getIndicators(draft.classroom, draft.subject) : []),
    [draft.classroom, draft.subject]
  );
  const draftLessonPlans = useMemo(() => {
    const match = draft.classroom?.match(/^ป\.([1-6])$/);
    if (!match) return [];
    return getTechnologyLessonPlans(`p${match[1]}` as PrimaryTechnologyGradeId);
  }, [draft.classroom]);

  const reload = () => setList(loadAssignments());

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchAssignmentsFromFirebase(), fetchSubmissionsFromFirebase()])
      .then(([assignments]) => {
        if (!cancelled) setList(assignments);
      })
      .finally(() => {
        if (!cancelled) setSyncing(false);
      });
    return () => { cancelled = true; };
  }, []);

  const submit = async () => {
    const kMax = Math.max(0, draft.knowledgeMaxScore || 0);
    const pMax = Math.max(0, draft.practiceMaxScore || 0);
    if (!draft.title || !draft.dueDate || !draft.classroom || !draft.subject || !draft.indicatorId) {
      alert('กรอกชื่องาน ห้อง วิชา ตัวชี้วัด และกำหนดส่งให้ครบ');
      return;
    }
    if (kMax + pMax <= 0) {
      alert('กำหนดคะแนน K หรือ P อย่างน้อย 1 คะแนน');
      return;
    }
    setSyncing(true);
    try {
      await createAssignment({
        title: draft.title,
        description: draft.description || '',
        classroom: draft.classroom || '',
        dueDate: draft.dueDate,
        maxScore: kMax + pMax,
        knowledgeMaxScore: kMax,
        practiceMaxScore: pMax,
        resourceUrl: draft.resourceUrl?.trim() || undefined,
        createdBy: 'teacher',
        subject: draft.subject,
        indicatorId: draft.indicatorId,
        category: 'k',
        lessonPlanId: draft.lessonPlanId,
      });
      setDraft({
        title: '',
        description: '',
        classroom: '',
        dueDate: new Date().toISOString().slice(0, 10),
        maxScore: 10,
        knowledgeMaxScore: 5,
        practiceMaxScore: 5,
        resourceUrl: '',
        category: 'k',
      });
      setShow(false);
      reload();
    } catch (error) {
      console.error(error);
      alert('สร้างการบ้านไม่สำเร็จ กรุณาตรวจการเชื่อมต่อ Firebase');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div>
      <div className="filter-row">
        <button className="btn-primary" onClick={() => setShow(!show)}>
          <Plus size={16} /> {show ? 'ยกเลิก' : 'สร้างการบ้านใหม่'}
        </button>
      </div>

      {show && (
        <div className="sm-add-form" style={{ flexDirection: 'column', gap: 8 }}>
          <div className="filter-row" style={{ width: '100%' }}>
            <div className="filter-group" style={{ flex: 2 }}>
              <label>หัวข้องาน *</label>
              <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="เช่น ใบงานที่ 1: เขียน Flowchart" />
            </div>
            <div className="filter-group">
              <label>ห้อง</label>
              <select value={draft.classroom} onChange={(e) => setDraft({ ...draft, classroom: e.target.value })}>
                <option value="">ทุกห้อง</option>
                {allClassrooms2569.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <label>ส่งภายใน *</label>
              <input type="date" value={draft.dueDate} onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })} />
            </div>
            <div className="filter-group">
              <label>K ความรู้</label>
              <input type="number" value={draft.knowledgeMaxScore || 0} min={0} max={15} onChange={(e) => setDraft({ ...draft, knowledgeMaxScore: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="filter-group">
              <label>P ปฏิบัติ</label>
              <input type="number" value={draft.practiceMaxScore || 0} min={0} max={30} onChange={(e) => setDraft({ ...draft, practiceMaxScore: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="filter-group" style={{ width: '100%' }}>
            <label>ลิงก์ใบงาน/คำสั่งงาน (Canva, Google Docs หรือเว็บไซต์อื่น)</label>
            <input
              type="url"
              value={draft.resourceUrl || ''}
              onChange={(e) => setDraft({ ...draft, resourceUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="filter-group" style={{ width: '100%' }}>
            <label>รายละเอียด</label>
            <textarea
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              rows={3}
              style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 8, fontFamily: 'inherit' }}
            />
          </div>
          {draft.classroom && draftSubjects.length > 0 && (
            <div className="filter-row" style={{ width: '100%', background: '#f0fdf4', padding: 10, borderRadius: 10, border: '1px dashed #86efac' }}>
              <div className="filter-group" style={{ flex: 1 }}>
                <label>📊 ผูกเข้ากระดาษเกรด — เลือกวิชา</label>
                <select
                  value={draft.subject || ''}
                  onChange={(e) => setDraft({ ...draft, subject: (e.target.value as Subject) || undefined, indicatorId: undefined })}
                >
                  <option value="">(ไม่ผูก — ให้คะแนนเฉยๆ)</option>
                  {draftSubjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.emoji} {s.title} ({s.code})</option>
                  ))}
                </select>
              </div>
              {draft.subject && (
                <>
                  <div className="filter-group" style={{ flex: 2 }}>
                    <label>ตัวชี้วัด</label>
                    <select
                      value={draft.indicatorId || ''}
                      onChange={(e) => setDraft({ ...draft, indicatorId: e.target.value || undefined })}
                    >
                      <option value="">(ไม่ผูกตัวชี้วัด)</option>
                      {draftIndicators.map((ind) => (
                        <option key={ind.id} value={ind.id}>{ind.code} — {ind.title}</option>
                      ))}
                    </select>
                  </div>
                  {draft.indicatorId && draftLessonPlans.length > 0 && (
                    <div className="filter-group">
                      <label>แผนรายคาบ (ไม่บังคับ)</label>
                      <select
                        value={draft.lessonPlanId || ''}
                        onChange={(e) => setDraft({ ...draft, lessonPlanId: e.target.value || undefined })}
                      >
                        <option value="">ไม่ระบุแผน</option>
                        {draftLessonPlans.map((plan) => (
                          <option key={plan.no} value={`p${draft.classroom?.slice(2)}-${plan.no}`}>
                            แผน {plan.no}: {plan.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          <button className="btn-export" onClick={() => void submit()} disabled={syncing}>
            {syncing ? 'กำลังบันทึก...' : 'สร้างการบ้าน'}
          </button>
        </div>
      )}

      {list.length === 0 ? (
        <div className="empty-state-card">
          <p>ยังไม่มีการบ้าน — กดสร้างใหม่</p>
        </div>
      ) : (
        <div className="att-table-wrap">
          <table className="att-table">
            <thead><tr>
              <th>หัวข้อ</th><th>ห้อง</th><th>ส่งภายใน</th><th>K/P</th><th>ส่งแล้ว</th><th></th>
            </tr></thead>
            <tbody>
              {list.map((a) => {
                const subs = getSubmissionsByAssignment(a.id);
                return (
                  <tr key={a.id}>
                    <td><strong>{a.title}</strong></td>
                    <td>{a.classroom || 'ทุกห้อง'}</td>
                    <td>{a.dueDate}</td>
                    <td>
                      K {a.knowledgeMaxScore ?? (a.category === 'k' ? a.maxScore : 0)}
                      {' / '}
                      P {a.practiceMaxScore ?? (a.category === 'p' ? a.maxScore : 0)}
                    </td>
                    <td>{subs.length} คน</td>
                    <td>
                      <button className="cb-icon-btn" onClick={() => setViewing(a)}><Eye size={14} /></button>
                      <button className="cb-icon-btn danger" disabled={syncing} onClick={() => {
                        if (!confirm('ลบ?')) return;
                        setSyncing(true);
                        void deleteAssignment(a.id)
                          .then(reload)
                          .catch(() => alert('ลบไม่สำเร็จ กรุณาตรวจการเชื่อมต่อ Firebase'))
                          .finally(() => setSyncing(false));
                      }}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {viewing && (
        <ReviewSubmissions assignment={viewing} onClose={() => setViewing(null)} />
      )}
    </div>
  );
};

const ReviewSubmissions: React.FC<{ assignment: Assignment; onClose: () => void }> = ({ assignment, onClose }) => {
  const [subs, setSubs] = useState<Submission[]>(getSubmissionsByAssignment(assignment.id));
  const [syncing, setSyncing] = useState(true);
  const [grading, setGrading] = useState<Submission | null>(null);
  const [kScore, setKScore] = useState(0);
  const [pCriteria, setPCriteria] = useState([0, 0, 0, 0]);
  const [pOverride, setPOverride] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const reload = () => setSubs(getSubmissionsByAssignment(assignment.id));
  const roster = loadRoster(assignment.classroom);
  const kMax = assignment.knowledgeMaxScore ?? (assignment.category === 'k' ? assignment.maxScore : 0);
  const pMax = assignment.practiceMaxScore ?? (assignment.category === 'p' ? assignment.maxScore : 0);
  const pRaw = pCriteria.reduce((sum, value) => sum + value, 0);
  const calculatedPScore = pMax > 0 ? Math.round((pRaw / 12) * pMax) : 0;
  const pScore = pOverride ?? calculatedPScore;

  useEffect(() => {
    let cancelled = false;
    fetchSubmissionsFromFirebase()
      .then(() => { if (!cancelled) setSubs(getSubmissionsByAssignment(assignment.id)); })
      .finally(() => { if (!cancelled) setSyncing(false); });
    return () => { cancelled = true; };
  }, [assignment.id]);

  const openScore = (submission: Submission) => {
    setGrading(submission);
    setKScore(submission.kScore || 0);
    const existingRatio = pMax > 0 ? (submission.pScore || 0) / pMax : 0;
    const criterion = Math.max(0, Math.min(3, Math.round(existingRatio * 3)));
    setPCriteria([criterion, criterion, criterion, criterion]);
    setPOverride(submission.pScore === undefined ? null : submission.pScore);
    setFeedback(submission.feedback || '');
  };

  const saveScore = async () => {
    if (!grading) return;
    setSyncing(true);
    try {
      await reviewSubmission(
        grading.id,
        {
          kScore: Math.max(0, Math.min(kMax, kScore)),
          pScore: Math.max(0, Math.min(pMax, pScore)),
        },
        feedback,
      );
      reload();
      setGrading(null);
    } catch (error) {
      console.error(error);
      alert('บันทึกคะแนนไม่สำเร็จ กรุณาตรวจการเชื่อมต่อ Firebase');
    } finally {
      setSyncing(false);
    }
  };

  const setPracticePreset = (ratio: number) => {
    if (ratio <= 0) {
      setPCriteria([0, 0, 0, 0]);
      setPOverride(Math.min(1, pMax));
      return;
    }
    setPOverride(null);
    const level = ratio >= 1 ? 3 : ratio >= 0.8 ? 2.4 : ratio >= 0.5 ? 1.5 : 0.1;
    const base = Math.floor(level);
    const total = Math.round(level * 4);
    setPCriteria(Array.from({ length: 4 }, (_, index) => (
      index < total - base * 4 ? Math.min(3, base + 1) : base
    )));
  };

  const dueTime = new Date(`${assignment.dueDate}T23:59:59`).getTime();
  const rosterRows = roster.map((student) => ({
    student,
    submission: subs.find((item) => (
      item.studentId === student.studentCode
      || item.studentNo === student.no
      || item.studentName === student.name
    )),
  }));

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }} onClick={onClose}>
      <div className="card homework-review-modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h2 style={{ margin: 0 }}>{assignment.title}</h2>
            {assignment.resourceUrl && (
              <a href={assignment.resourceUrl} target="_blank" rel="noreferrer">
                <ExternalLink size={13} /> เปิดใบงานต้นฉบับ
              </a>
            )}
          </div>
          <button onClick={onClose} className="btn-ghost"><X size={16} /></button>
        </div>
        <div className="homework-review-summary">
          <div><span>ส่งแล้ว</span><strong>{subs.length}/{roster.length}</strong></div>
          <div><span>ตรวจแล้ว</span><strong>{subs.filter((item) => item.reviewedAt).length}</strong></div>
          <div><span>ส่งช้า</span><strong>{subs.filter((item) => item.submittedAt > dueTime).length}</strong></div>
          <div><span>ขาดส่ง</span><strong>{Math.max(0, roster.length - subs.length)}</strong></div>
        </div>
        {rosterRows.length === 0 ? <p>ยังไม่มีรายชื่อนักเรียนในห้องนี้</p> : (
          <div className="homework-submission-list">
            {rosterRows.map(({ student, submission: s }) => (
              <div key={student.studentCode} className={`homework-submission-row ${s ? '' : 'missing'}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <strong>{student.no}. {student.name}</strong>
                    {s ? (
                      <div className="submission-status-line">
                        {s.submittedAt > dueTime
                          ? <span className="late"><Clock3 size={13} /> ส่งช้า</span>
                          : <span className="submitted"><CheckCircle2 size={13} /> ส่งแล้ว</span>}
                        <small>{new Date(s.submittedAt).toLocaleString('th-TH')}</small>
                      </div>
                    ) : (
                      <span className="missing-label"><AlertTriangle size={13} /> ยังไม่ส่ง</span>
                    )}
                    {s?.comment && <div style={{ fontSize: '0.85rem', marginTop: 6 }}>{s.comment}</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {s?.score !== undefined ? (
                      <div>
                        <strong style={{ color: '#22c55e' }}>{s.score}/{assignment.maxScore}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          K {s.kScore ?? '-'} / P {s.pScore ?? '-'}
                        </div>
                        <button type="button" className="homework-edit-score" onClick={() => openScore(s)}>แก้คะแนน</button>
                      </div>
                    ) : s ? (
                      <button className="btn-primary" disabled={syncing} onClick={() => openScore(s)} style={{ padding: '4px 12px', fontSize: '0.85rem' }}>
                        ให้คะแนน
                      </button>
                    ) : <span className="no-score">-</span>}
                  </div>
                </div>
                {s && (s.contentUrl || s.contentData) && (
                  <div style={{ marginTop: 8 }}>
                    {s.contentUrl && <a href={s.contentUrl} target="_blank" rel="noreferrer"><ExternalLink size={12} /> เปิดลิงก์</a>}
                    {s.contentData?.startsWith('data:image') && (
                      <img src={s.contentData} alt="งานนักเรียน" style={{ maxWidth: '100%', maxHeight: 200, marginTop: 8, borderRadius: 8 }} />
                    )}
                    {s.contentData?.startsWith('data:application/pdf') && (
                      <a href={s.contentData} download="งาน.pdf">📄 ดาวน์โหลด PDF</a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {grading && (
          <div className="homework-score-overlay">
            <div className="homework-score-dialog">
              <div className="homework-score-heading">
                <div>
                  <span>ตรวจงานและบันทึกเข้า K/P/A</span>
                  <h3>{grading.studentName}</h3>
                </div>
                <button type="button" className="btn-ghost" onClick={() => setGrading(null)}><X size={17} /></button>
              </div>

              {kMax > 0 && (
                <section>
                  <div className="score-section-title">
                    <strong>K ความรู้</strong>
                    <span>{kScore}/{kMax}</span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={kMax}
                    value={kScore}
                    onChange={(event) => setKScore(Number(event.target.value) || 0)}
                  />
                  <div className="score-presets">
                    <button type="button" onClick={() => setKScore(kMax)}>เต็ม</button>
                    <button type="button" onClick={() => setKScore(Math.round(kMax * 0.8))}>ปานกลาง 80%</button>
                    <button type="button" onClick={() => setKScore(Math.round(kMax * 0.5))}>พอใช้ 50%</button>
                    <button type="button" onClick={() => setKScore(Math.min(1, kMax))}>ไม่ผ่าน</button>
                  </div>
                </section>
              )}

              {pMax > 0 && (
                <section>
                  <div className="score-section-title">
                    <strong>P การปฏิบัติ</strong>
                    <span>{pScore}/{pMax}</span>
                  </div>
                  {[
                    'ปฏิบัติตามขั้นตอน',
                    'ใช้เครื่องมือถูกต้องและปลอดภัย',
                    'ตรวจสอบและแก้ไขผลงาน',
                    'อธิบายผลงานหรือทำงานร่วมกับผู้อื่น',
                  ].map((label, index) => (
                    <label className="practice-criterion" key={label}>
                      <span>{label}</span>
                      <select
                        value={pCriteria[index]}
                        onChange={(event) => {
                          setPOverride(null);
                          setPCriteria((items) => (
                            items.map((value, itemIndex) => itemIndex === index ? Number(event.target.value) : value)
                          ));
                        }}
                      >
                        <option value={0}>0 ไม่ผ่าน</option>
                        <option value={1}>1 พอใช้</option>
                        <option value={2}>2 ปานกลาง</option>
                        <option value={3}>3 ดีมาก</option>
                      </select>
                    </label>
                  ))}
                  <div className="score-presets">
                    <button type="button" onClick={() => setPracticePreset(1)}>เต็ม</button>
                    <button type="button" onClick={() => setPracticePreset(0.8)}>ปานกลาง 80%</button>
                    <button type="button" onClick={() => setPracticePreset(0.5)}>พอใช้ 50%</button>
                    <button type="button" onClick={() => setPracticePreset(0)}>ไม่ผ่าน 1 คะแนน</button>
                  </div>
                </section>
              )}

              <label className="feedback-field">
                ข้อเสนอแนะ
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(event) => setFeedback(event.target.value)}
                  placeholder="สิ่งที่ทำได้ดีและสิ่งที่ควรปรับปรุง"
                />
              </label>
              <button type="button" className="save-homework-score" onClick={() => void saveScore()} disabled={syncing}>
                <Save size={17} /> {syncing ? 'กำลังบันทึก...' : 'บันทึกคะแนน'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeworkManager;
