import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Eye, X, ExternalLink } from 'lucide-react';
import {
  loadAssignments, createAssignment, deleteAssignment,
  getSubmissionsByAssignment, reviewSubmission,
  fetchAssignmentsFromFirebase, fetchSubmissionsFromFirebase,
} from '../services/homeworkService';
import type { Assignment, Submission } from '../services/homeworkService';
import { allClassrooms2569 } from '../data/students2569';
import { getSubjectsForClassroom, getIndicators } from '../services/gradeService';
import type { Subject, AssessmentCategory } from '../services/gradeService';

const HomeworkManager: React.FC = () => {
  const [list, setList] = useState(loadAssignments());
  const [show, setShow] = useState(false);
  const [draft, setDraft] = useState<Partial<Assignment>>({
    title: '', description: '', classroom: '', dueDate: new Date().toISOString().slice(0, 10),
    maxScore: 10, category: 'k',
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
    if (!draft.title || !draft.dueDate) { alert('กรอกข้อมูลให้ครบ'); return; }
    setSyncing(true);
    try {
      await createAssignment({
        title: draft.title,
        description: draft.description || '',
        classroom: draft.classroom || '',
        dueDate: draft.dueDate,
        maxScore: draft.maxScore || 10,
        createdBy: 'teacher',
        subject: draft.subject,
        indicatorId: draft.indicatorId,
        category: draft.indicatorId ? (draft.category || 'k') : undefined,
      });
      setDraft({ title: '', description: '', classroom: '', dueDate: new Date().toISOString().slice(0, 10), maxScore: 10, category: 'k' });
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
              <label>คะแนนเต็ม</label>
              <input type="number" value={draft.maxScore} min={1} max={100} onChange={(e) => setDraft({ ...draft, maxScore: parseInt(e.target.value) || 10 })} />
            </div>
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
                  {draft.indicatorId && (
                    <div className="filter-group">
                      <label>หมวด</label>
                      <select
                        value={draft.category || 'k'}
                        onChange={(e) => setDraft({ ...draft, category: e.target.value as AssessmentCategory })}
                      >
                        <option value="k">K ความรู้</option>
                        <option value="p">P ทักษะ</option>
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
              <th>หัวข้อ</th><th>ห้อง</th><th>ส่งภายใน</th><th>เต็ม</th><th>ส่งแล้ว</th><th></th>
            </tr></thead>
            <tbody>
              {list.map((a) => {
                const subs = getSubmissionsByAssignment(a.id);
                return (
                  <tr key={a.id}>
                    <td><strong>{a.title}</strong></td>
                    <td>{a.classroom || 'ทุกห้อง'}</td>
                    <td>{a.dueDate}</td>
                    <td>{a.maxScore}</td>
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
  const reload = () => setSubs(getSubmissionsByAssignment(assignment.id));

  useEffect(() => {
    let cancelled = false;
    fetchSubmissionsFromFirebase()
      .then(() => { if (!cancelled) setSubs(getSubmissionsByAssignment(assignment.id)); })
      .finally(() => { if (!cancelled) setSyncing(false); });
    return () => { cancelled = true; };
  }, [assignment.id]);

  const score = async (id: string) => {
    const s = prompt(`คะแนน (เต็ม ${assignment.maxScore}):`);
    if (s === null) return;
    const sc = parseFloat(s);
    if (isNaN(sc)) return;
    const fb = prompt('Feedback (optional):') || '';
    setSyncing(true);
    try {
      await reviewSubmission(id, Math.max(0, Math.min(assignment.maxScore, sc)), fb);
      reload();
    } catch (error) {
      console.error(error);
      alert('บันทึกคะแนนไม่สำเร็จ กรุณาตรวจการเชื่อมต่อ Firebase');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }} onClick={onClose}>
      <div className="card" style={{ background: 'white', width: '100%', maxWidth: 700, maxHeight: '85vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>{assignment.title}</h2>
          <button onClick={onClose} className="btn-ghost"><X size={16} /></button>
        </div>
        {subs.length === 0 ? <p>ยังไม่มีคนส่ง</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {subs.map((s) => (
              <div key={s.id} style={{ padding: 12, background: '#f9fafb', borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <strong>{s.studentNo}. {s.studentName}</strong>
                    <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                      {new Date(s.submittedAt).toLocaleString('th-TH')}
                    </div>
                    {s.comment && <div style={{ fontSize: '0.85rem', marginTop: 6 }}>💬 {s.comment}</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {s.score !== undefined ? (
                      <strong style={{ color: '#22c55e' }}>{s.score}/{assignment.maxScore}</strong>
                    ) : (
                      <button className="btn-primary" disabled={syncing} onClick={() => void score(s.id)} style={{ padding: '4px 12px', fontSize: '0.85rem' }}>
                        ให้คะแนน
                      </button>
                    )}
                  </div>
                </div>
                {(s.contentUrl || s.contentData) && (
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
      </div>
    </div>
  );
};

export default HomeworkManager;
