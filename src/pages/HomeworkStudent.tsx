import React, { useEffect, useState } from 'react';
import { Upload, CheckCircle2, Clock, AlertCircle, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getAssignmentsForStudent, submitWork, getStudentSubmissionForAssignment,
  fetchAssignmentsFromFirebase, fetchSubmissionsFromFirebase,
} from '../services/homeworkService';
import type { Assignment } from '../services/homeworkService';
import { trackMediaClick } from '../services/progressService';
import { syncStudentGradesFromProgress } from '../services/gameProgressService';
import { getDefaultProgressGradeIdForClassroom } from '../services/courseAccessService';
import { getLinkedUnits } from '../services/gradeService';

const HomeworkStudent: React.FC = () => {
  const { user } = useAuth();
  const [selected, setSelected] = useState<Assignment | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [contentUrl, setContentUrl] = useState('');
  const [comment, setComment] = useState('');
  const [syncing, setSyncing] = useState(true);
  const [, setDataVersion] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([fetchAssignmentsFromFirebase(), fetchSubmissionsFromFirebase()])
      .then(() => {
        if (!cancelled) {
          setAssignments(getAssignmentsForStudent(user.classroom));
          setDataVersion((version) => version + 1);
        }
      })
      .finally(() => { if (!cancelled) setSyncing(false); });
    return () => { cancelled = true; };
  }, [user]);

  if (!user) {
    return <div className="container section-padding" style={{ paddingTop: '6rem', textAlign: 'center' }}>
      <h2>กรุณา Login ก่อน</h2>
    </div>;
  }

  const handleSubmit = async () => {
    if (!selected) return;
    if (!/^https?:\/\//i.test(contentUrl.trim())) {
      alert('กรุณาใส่ลิงก์ผลงานที่ขึ้นต้นด้วย http:// หรือ https://');
      return;
    }
    setSyncing(true);
    try {
      await submitWork({
        assignmentId: selected.id,
        studentId: user.id,
        studentName: user.name,
        classroom: user.classroom,
        studentNo: parseInt(user.studentNumber),
        contentUrl: contentUrl.trim(),
        comment,
      });

      let progressSaved = true;
      const linkedTarget = selected.indicatorId && selected.subject
        ? getLinkedUnits(user.classroom, selected.subject)
            .find((item) => item.indicator.id === selected.indicatorId)?.units[0]
        : undefined;
      const gradeId = linkedTarget?.gradeId || getDefaultProgressGradeIdForClassroom(user.classroom);
      const unitNo = linkedTarget?.unitNo || 1;
      if (gradeId) {
        progressSaved = await trackMediaClick(user.id, gradeId, unitNo, 'fun', `[Homework] ${selected.title}`);
        if (progressSaved) await syncStudentGradesFromProgress({
          id: user.id,
          name: user.name,
          classroom: user.classroom,
          studentNumber: user.studentNumber,
        });
      }
      setDataVersion((version) => version + 1);
      alert(progressSaved ? 'ส่งงานสำเร็จ ✓ +5 XP' : 'ส่งงานสำเร็จ แต่ยังบันทึก XP ไม่สำเร็จ กรุณาแจ้งครู');
      setSelected(null);
      setContentUrl('');
      setComment('');
    } catch (error) {
      console.error(error);
      alert('ส่งงานไม่สำเร็จ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="container section-padding" style={{ paddingTop: '6rem' }}>
      <h1>📝 งานที่ครูสั่ง</h1>
      <p style={{ color: '#6b7280' }}>รายการการบ้านของชั้น {user.classroom}</p>

      {syncing && assignments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>กำลังดึงงานจากฐานข้อมูล...</div>
      ) : assignments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <FileText size={48} color="#9ca3af" />
          <h3>ยังไม่มีการบ้าน 🎉</h3>
          <p>ไม่มีงานต้องส่ง — สบายๆ ไปก่อน</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {assignments.map((a) => {
            const sub = getStudentSubmissionForAssignment(a.id, user.id);
            const overdue = new Date(a.dueDate) < new Date() && !sub;
            return (
              <div key={a.id} className="card" style={{
                borderLeft: overdue ? '4px solid #ef4444' : sub ? '4px solid #22c55e' : '4px solid #f59e0b',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <h3 style={{ margin: '0 0 4px' }}>{a.title}</h3>
                    <p style={{ color: '#6b7280', margin: '0 0 8px', fontSize: '0.88rem' }}>{a.description}</p>
                    {a.resourceUrl && (
                      <a href={a.resourceUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', marginBottom: 8 }}>
                        เปิดใบงาน/คำสั่งงาน
                      </a>
                    )}
                    <div style={{ fontSize: '0.85rem', color: '#6b7280', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <span><Clock size={14} style={{ verticalAlign: 'middle' }} /> ส่งภายใน {a.dueDate}</span>
                      <span>K {a.knowledgeMaxScore ?? (a.category === 'k' ? a.maxScore : 0)}</span>
                      <span>P {a.practiceMaxScore ?? (a.category === 'p' ? a.maxScore : 0)}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {sub ? (
                      <div>
                        <div style={{ color: '#22c55e', fontWeight: 700 }}>
                          <CheckCircle2 size={16} style={{ verticalAlign: 'middle' }} /> ส่งแล้ว
                        </div>
                        {sub.score !== undefined ? (
                          <div style={{ marginTop: 4, padding: '4px 12px', background: '#dcfce7', borderRadius: 999, fontSize: '0.85rem' }}>
                            ได้ {sub.score}/{a.maxScore} (K {sub.kScore ?? '-'} / P {sub.pScore ?? '-'})
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>รอครูตรวจ</div>
                        )}
                        {sub.feedback && (
                          <div style={{ marginTop: 8, padding: 8, background: '#fef3c7', borderRadius: 8, fontSize: '0.82rem' }}>
                            💬 {sub.feedback}
                          </div>
                        )}
                      </div>
                    ) : overdue ? (
                      <div style={{ color: '#ef4444', fontWeight: 700 }}>
                        <AlertCircle size={16} style={{ verticalAlign: 'middle' }} /> เกินกำหนด
                      </div>
                    ) : (
                      <button onClick={() => setSelected(a)} className="btn-primary">
                        <Upload size={14} /> ส่งงาน
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submit modal */}
      {selected && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }} onClick={() => setSelected(null)}>
          <div className="card" style={{ width: '100%', maxWidth: 500, background: 'white' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>{selected.title}</h2>
            <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>{selected.description}</p>

            <div style={{ marginTop: 16 }}>
              <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>📎 ลิงก์ผลงาน (Canva, Google Drive หรือเว็บไซต์อื่น)</label>
              <input
                value={contentUrl}
                onChange={(e) => setContentUrl(e.target.value)}
                placeholder="https://..."
                style={{ width: '100%', padding: 10, border: '1px solid #e5e7eb', borderRadius: 8, marginTop: 4, fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginTop: 12 }}>
              <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>💬 หมายเหตุถึงครู (ไม่จำเป็น)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                style={{ width: '100%', padding: 10, border: '1px solid #e5e7eb', borderRadius: 8, marginTop: 4, fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => setSelected(null)} className="btn-secondary">ยกเลิก</button>
              <button onClick={() => void handleSubmit()} className="btn-primary" disabled={syncing}>
                {syncing ? 'กำลังส่ง...' : 'ส่งงาน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeworkStudent;
