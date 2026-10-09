import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Upload, CheckCircle2, Clock, AlertCircle, FileText, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getAssignmentsForStudent, submitWork, getStudentSubmissionForAssignment,
  fetchAssignmentsFromFirebase, fetchSubmissionsFromFirebase,
  recommendAssignment,
  validateSubmissionContent,
  type Assignment,
} from '../services/homeworkService';
import { isScoreEligibleUser } from '../services/userAccessService';

const HomeworkStudent: React.FC = () => {
  const { user } = useAuth();
  const [selected, setSelected] = useState<Assignment | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [contentUrl, setContentUrl] = useState('');
  const [comment, setComment] = useState('');
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [usingCachedAssignments, setUsingCachedAssignments] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [, setDataVersion] = useState(0);
  const [filter, setFilter] = useState<'all' | 'recommended' | 'foundation' | 'standard' | 'advanced' | 'submitted'>('all');
  const openedFromUrlRef = useRef(false);

  const [dtDefine, setDtDefine] = useState('');
  const [dtIdeate, setDtIdeate] = useState('');
  const [dtPrototypeUrl, setDtPrototypeUrl] = useState('');
  const [dtTestFeedback, setDtTestFeedback] = useState('');

  const [packChoices, setPackChoices] = useState<Record<string, string>>({});
  const openSubmission = useCallback((assignment: Assignment) => {
    const previous = user ? getStudentSubmissionForAssignment(assignment.id, user.id) : null;
    setContentUrl(previous?.contentUrl || '');
    setComment(previous?.comment || '');
    setDtDefine(previous?.designThinkingSteps?.define || '');
    setDtIdeate(previous?.designThinkingSteps?.ideate || '');
    setDtPrototypeUrl(previous?.designThinkingSteps?.prototypeUrl || previous?.contentUrl || '');
    setDtTestFeedback(previous?.designThinkingSteps?.testFeedback || '');
    setSelected(assignment);
  }, [user]);

  const closeSubmission = () => {
    setSelected(null);
    setContentUrl('');
    setComment('');
    setDtDefine('');
    setDtIdeate('');
    setDtPrototypeUrl('');
    setDtTestFeedback('');
  };

  useEffect(() => {
    if (!isScoreEligibleUser(user)) return;
    let cancelled = false;
    const fallback = window.setTimeout(() => {
      if (cancelled) return;
      setAssignments(getAssignmentsForStudent(user.classroom, user.id, parseInt(user.studentNumber)));
      setDataVersion((version) => version + 1);
      setUsingCachedAssignments(true);
      setLoadingAssignments(false);
    }, 5000);
    Promise.all([fetchAssignmentsFromFirebase(), fetchSubmissionsFromFirebase()])
      .then(() => {
        if (!cancelled) {
          setAssignments(getAssignmentsForStudent(user.classroom, user.id, parseInt(user.studentNumber)));
          setDataVersion((version) => version + 1);
          setUsingCachedAssignments(false);
        }
      })
      .catch((error) => {
        console.warn('load homework failed, using local cache', error);
        if (!cancelled) {
          setAssignments(getAssignmentsForStudent(user.classroom, user.id, parseInt(user.studentNumber)));
          setUsingCachedAssignments(true);
        }
      })
      .finally(() => {
        window.clearTimeout(fallback);
        if (!cancelled) setLoadingAssignments(false);
      });
    return () => { cancelled = true; window.clearTimeout(fallback); };
  }, [user]);

  useEffect(() => {
    if (openedFromUrlRef.current || !assignments.length) return;
    const params = new URLSearchParams(window.location.search);
    const targetId = params.get('id') || params.get('assignmentId');
    if (targetId) {
      const match = assignments.find((a) => a.id === targetId);
      if (match) {
        openedFromUrlRef.current = true;
        const timer = window.setTimeout(() => openSubmission(match), 0);
        return () => window.clearTimeout(timer);
      }
    }
    return undefined;
  }, [assignments, openSubmission]);

  const filteredAssignments = (() => {
    const chosen = new Map<string, string>();
    for (const a of assignments) {
      if (!a.personalizedPackId || chosen.has(a.personalizedPackId)) continue;
      const variants = assignments.filter(v => v.personalizedPackId === a.personalizedPackId);
      const submitted = variants.find(v => user && getStudentSubmissionForAssignment(v.id, user.id));
      const recommended = user ? recommendAssignment(a, user.id).difficulty : 'standard';
      chosen.set(a.personalizedPackId, submitted?.id || packChoices[a.personalizedPackId] || variants.find(v => v.difficulty === recommended)?.id || a.id);
    }
    return assignments.filter((a) => {
      if (a.personalizedPackId && chosen.get(a.personalizedPackId) !== a.id) return false;
      const recommendedDiff = user ? recommendAssignment(a, user.id).difficulty : 'standard';
      const sub = user ? getStudentSubmissionForAssignment(a.id, user.id) : undefined;
      if (filter === 'submitted') return Boolean(sub);
      if (filter === 'recommended') return (a.difficulty || 'standard') === recommendedDiff;
      if (filter === 'foundation') return a.difficulty === 'foundation';
      if (filter === 'standard') return !a.difficulty || a.difficulty === 'standard';
      if (filter === 'advanced') return a.difficulty === 'advanced';
      return true;
    });
  })();

  if (!user) {
    return (
      <div className="container section-padding" style={{ paddingTop: '6rem', textAlign: 'center' }}>
        <h2>กรุณา Login ก่อน</h2>
      </div>
    );
  }

  if (!isScoreEligibleUser(user)) {
    return (
      <div className="container section-padding" style={{ paddingTop: '7rem', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: 620, margin: '0 auto', padding: '2rem' }}>
          <AlertCircle size={44} color="#f59e0b" />
          <h2>การบ้านสำหรับนักเรียนในโรงเรียน</h2>
          <p>บัญชีครูและผู้ทดลองภายนอกไม่สามารถส่งงาน และระบบจะไม่สร้างคะแนนจากหน้านี้</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!selected) return;
    const finalUrl = contentUrl.trim();
    let finalComment = comment.trim();
    let dtSteps = undefined;

    if (selected.isDesignThinking) {
      const proto = dtPrototypeUrl.trim();
      dtSteps = {
        define: dtDefine.trim(),
        ideate: dtIdeate.trim(),
        prototypeUrl: proto,
        testFeedback: dtTestFeedback.trim(),
      };
      if (!finalComment) {
        finalComment = `[Design Thinking]\n1. ปัญหา: ${dtDefine.trim()}\n2. ไอเดีย: ${dtIdeate.trim()}\n3. ผลทดสอบ: ${dtTestFeedback.trim()}`;
      }
    }

    const validation = validateSubmissionContent({
      contentUrl: finalUrl,
      comment: finalComment,
      isDesignThinking: selected.isDesignThinking,
      dtDefine,
      dtIdeate,
      dtPrototypeUrl,
    });

    if (!validation.valid) {
      alert(validation.error || 'ข้อมูลการส่งงานไม่ถูกต้อง');
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
        contentUrl: finalUrl,
        comment: finalComment,
        designThinkingSteps: dtSteps,
      });

      setDataVersion((version) => version + 1);
      alert('ส่งงานสำเร็จเรียบร้อยแล้ว! 📋 ชิ้นงานถูกส่งให้คุณครูแล้ว อยู่ในสถานะ "รอคุณครูตรวจและให้คะแนน" ครับ');
      closeSubmission();
    } catch (error: unknown) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'ส่งงานไม่สำเร็จ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="container section-padding" style={{ paddingTop: '6rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: '0 0 4px' }}>📝 ภารกิจของฉัน</h1>
          <p style={{ color: '#6b7280', margin: 0 }}>
            รายการการบ้านของชั้น {user.classroom} • ระบบจัดภารกิจแบบปรับตามศักยภาพผู้เรียน (Personalized Assignment)
          </p>
        </div>
        <div style={{ padding: '6px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, fontSize: '0.82rem', color: '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={16} /> เลือกหนึ่งทางต่อชุดงาน • ใช้คำใบ้ได้โดยไม่หักคะแนน
        </div>
      </div>

      {usingCachedAssignments && (
        <p role="status" style={{ color: '#92400e', background: '#fef3c7', padding: '8px 12px', borderRadius: 8, marginTop: 12 }}>
          กำลังแสดงรายการที่บันทึกไว้ในเครื่อง ข้อมูลออนไลน์อาจยังไม่ล่าสุด
        </p>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '1.25rem 0' }}>
        {[
          { id: 'all', label: `งานทั้งหมด (${assignments.length})` },
          { id: 'recommended', label: '✨ แนะนำสำหรับเธอ' },
          { id: 'foundation', label: '🟢 พื้นฐาน' },
          { id: 'standard', label: '🟡 มาตรฐาน' },
          { id: 'advanced', label: '🔵 ท้าทาย' },
          { id: 'submitted', label: '✓ ส่งแล้ว' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id as typeof filter)}
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: '0.82rem',
              fontWeight: filter === tab.id ? 700 : 500,
              border: filter === tab.id ? '2px solid var(--primary, #6366f1)' : '1px solid #d1d5db',
              background: filter === tab.id ? '#e0e7ff' : '#f9fafb',
              color: filter === tab.id ? '#3730a3' : '#374151',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loadingAssignments && assignments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>กำลังดึงงานจากฐานข้อมูล...</div>
      ) : filteredAssignments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <FileText size={48} color="#9ca3af" />
          <h3>ไม่พบรายการในหมวดนี้ 🎉</h3>
          <p>ไม่มีงานต้องส่งในหมวดที่เลือก — ลองเลือกแท็บ "งานทั้งหมด"</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredAssignments.map((a) => {
            const sub = getStudentSubmissionForAssignment(a.id, user.id);
            const overdue = new Date(`${a.dueDate}T23:59:59`) < new Date() && !sub;
            const recommendation = recommendAssignment(a, user.id);
            const isRecommended = (a.difficulty || 'standard') === recommendation.difficulty;
            return (
              <div key={a.id} className="card" style={{
                borderLeft: overdue ? '4px solid #ef4444' : sub ? '4px solid #22c55e' : isRecommended ? '4px solid #f59e0b' : '4px solid #cbd5e1',
                background: isRecommended && !sub ? 'linear-gradient(to right, #fffdf5, #ffffff)' : 'white',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                      <h3 style={{ margin: 0 }}>{a.title}</h3>
                      {a.difficulty === 'foundation' ? (
                        <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700 }}>
                          🟢 พื้นฐาน (มีคำใบ้)
                        </span>
                      ) : a.difficulty === 'advanced' ? (
                        <span style={{ background: '#ede9fe', color: '#5b21b6', padding: '2px 8px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700 }}>
                          🔵 ท้าทาย {a.bonusPoints ? `+${a.bonusPoints} XP` : ''}
                        </span>
                      ) : (
                        <span style={{ background: '#fef3c7', color: '#854d0e', padding: '2px 8px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700 }}>
                          🟡 มาตรฐาน
                        </span>
                      )}
                      {isRecommended && (
                        <span style={{ background: 'linear-gradient(135deg, #fef08a, #fde047)', color: '#713f12', padding: '2px 8px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <Sparkles size={11} /> แนะนำสำหรับเธอ
                        </span>
                      )}
                    </div>
                    {a.recommendedReason && (
                      <div style={{ fontSize: '0.8rem', color: '#4b5563', margin: '4px 0 6px', background: '#f8fafc', borderLeft: '3px solid #6366f1', padding: '3px 8px', borderRadius: 4 }}>
                        💡 {recommendation.reason}
                      </div>
                    )}
                    {a.personalizedPackId && !sub && <label style={{ display: 'block', margin: '10px 0' }}>
                      ทางเลือกของงานนี้{' '}
                      <select aria-label={`ทางเลือก ${a.title}`} value={a.id} onChange={e => setPackChoices(prev => ({ ...prev, [a.personalizedPackId!]: e.target.value }))}>
                        {assignments.filter(v => v.personalizedPackId === a.personalizedPackId).map(v => <option key={v.id} value={v.id}>{v.difficulty === 'foundation' ? 'ฝึกพร้อมตัวช่วย' : v.difficulty === 'advanced' ? 'โจทย์ท้าทาย' : 'ฝึกด้วยตนเอง'}</option>)}
                      </select>
                    </label>}
                    <p style={{ color: '#6b7280', margin: '0 0 8px', fontSize: '0.88rem' }}>{a.description}</p>
                    {a.hints && a.hints.length > 0 && (
                      <details style={{ margin: '6px 0 8px', fontSize: '0.82rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '6px 10px' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#1d4ed8' }}>
                          💡 ดูคำใบ้ช่วยคิด ({a.hints.length} ข้อ)
                        </summary>
                        <ul style={{ margin: '6px 0 0 16px', padding: 0, color: '#1e40af' }}>
                          {a.hints.map((h, i) => <li key={i} style={{ marginBottom: 2 }}>{h}</li>)}
                        </ul>
                      </details>
                    )}
                    {a.resourceUrl && (
                      <a href={a.resourceUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', marginBottom: 8, fontSize: '0.85rem' }}>
                        เปิดใบงาน/คำสั่งงาน ↗
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
                        {sub.reviewedAt === undefined && <button className="btn-secondary" onClick={() => openSubmission(a)}>แก้ไขการส่งงาน</button>}
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
                      <button onClick={() => openSubmission(a)} className="btn-primary">
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
        }} onClick={() => { if (!syncing) closeSubmission(); }}>
          <div className="card" style={{ width: '100%', maxWidth: 520, background: 'white' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <h2 style={{ margin: 0 }}>{selected.title}</h2>
              {selected.difficulty === 'foundation' ? (
                <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700 }}>
                  🟢 พื้นฐาน
                </span>
              ) : selected.difficulty === 'advanced' ? (
                <span style={{ background: '#ede9fe', color: '#5b21b6', padding: '2px 8px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700 }}>
                  🔵 ท้าทาย
                </span>
              ) : null}
            </div>
            {selected.recommendedReason && (
              <div style={{ fontSize: '0.8rem', color: '#4b5563', margin: '0 0 8px', background: '#f8fafc', padding: '4px 8px', borderRadius: 4 }}>
                💡 {selected.recommendedReason}
              </div>
            )}
            <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>{selected.description}</p>

            {selected.hints && selected.hints.length > 0 && (
              <div style={{ margin: '10px 0', padding: '8px 12px', background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                <strong style={{ fontSize: '0.82rem', color: '#1d4ed8' }}>💡 คำใบ้และแนวทางช่วยเหลือ:</strong>
                <ul style={{ margin: '4px 0 0 16px', padding: 0, fontSize: '0.8rem', color: '#1e40af' }}>
                  {selected.hints.map((h, i) => <li key={i}>{h}</li>)}
                </ul>
              </div>
            )}

            {selected.isDesignThinking ? (
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ padding: '8px 12px', background: '#f0fdfa', borderRadius: 8, border: '1px solid #99f6e4', color: '#0f766e', fontSize: '0.82rem', fontWeight: 700 }}>
                  💡 บันทึกกระบวนการคิดเชิงออกแบบ (Design Thinking: ว 4.1)
                </div>
                <div>
                  <label style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f766e' }}>🎯 ขั้นที่ 1: ปัญหาที่พบและกลุ่มผู้ใช้ (Define & Empathize)</label>
                  <textarea
                    value={dtDefine}
                    onChange={(e) => setDtDefine(e.target.value)}
                    rows={2}
                    placeholder="ปัญหาที่ต้องการแก้ไขคืออะไร? ใครได้รับผลกระทบ?"
                    style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6, marginTop: 4, fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f766e' }}>🧠 ขั้นที่ 2: ไอเดียแนวทางแก้ปัญหา (Ideate)</label>
                  <textarea
                    value={dtIdeate}
                    onChange={(e) => setDtIdeate(e.target.value)}
                    rows={2}
                    placeholder="คิดแนวทางแก้ปัญหาอย่างไรบ้าง? ทำไมจึงเลือกวิธีนี้?"
                    style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6, marginTop: 4, fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f766e' }}>🛠️ ขั้นที่ 3: ลิงก์ชิ้นงานต้นแบบ (Prototype เช่น Canva, Scratch หรือไฟล์)</label>
                  <input
                    value={dtPrototypeUrl}
                    onChange={(e) => setDtPrototypeUrl(e.target.value)}
                    placeholder="https://canva.com/... หรือ https://scratch.mit.edu/..."
                    style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6, marginTop: 4, fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f766e' }}>🧪 ขั้นที่ 4: ผลการทดสอบและข้อคิดเห็น (Test & Feedback)</label>
                  <textarea
                    value={dtTestFeedback}
                    onChange={(e) => setDtTestFeedback(e.target.value)}
                    rows={2}
                    placeholder="เมื่อทดสอบกับเพื่อน/ครู ผลเป็นอย่างไร? มีจุดที่ต้องปรับปรุงตรงไหน?"
                    style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6, marginTop: 4, fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            ) : (
              <>
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 4 }}>
                    <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>📎 ลิงก์ผลงาน (Canva, Scratch, Google Drive ฯลฯ)</label>
                    <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600 }}>💡 แนะนำ: เปิดสิทธิ์ "ทุกคนที่มีลิงก์ดูได้" ก่อนส่ง</span>
                  </div>
                  <input
                    value={contentUrl}
                    onChange={(e) => setContentUrl(e.target.value)}
                    placeholder="https://www.canva.com/design/... หรือ https://scratch.mit.edu/projects/..."
                    style={{ width: '100%', padding: 10, border: '1px solid #e5e7eb', borderRadius: 8, marginTop: 4, fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6, fontSize: '0.74rem', color: '#4b5563' }}>
                    <span style={{ background: '#ede9fe', color: '#6d28d9', padding: '2px 8px', borderRadius: 4 }}>🎨 Canva: ปุ่มแชร์ ➔ ลิงก์สำหรับดูเท่านั้น</span>
                    <span style={{ background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: 4 }}>🐱 Scratch: กด Share ➔ Copy Link</span>
                    <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 4 }}>📁 Google Drive: เปิดสิทธิ์ "ทุกคนที่มีลิงก์"</span>
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>💬 คำตอบหรือคำอธิบายผลงาน (ส่งข้อความแทนลิงก์ได้)</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={5}
                    style={{ width: '100%', padding: 10, border: '1px solid #e5e7eb', borderRadius: 8, marginTop: 4, fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={closeSubmission} className="btn-secondary" disabled={syncing}>ยกเลิก</button>
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
