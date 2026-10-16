import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Upload, CheckCircle2, Clock, AlertCircle, FileText, Sparkles, ExternalLink, ClipboardList } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getAssignmentsForStudent,
  submitWork,
  getStudentSubmissionForAssignment,
  getStudentWorkStatusOverview,
  fetchAssignmentsFromFirebase,
  fetchSubmissionsFromFirebase,
  recommendAssignment,
  validateSubmissionContent,
  type Assignment,
} from '../services/homeworkService';
import { isScoreEligibleUser } from '../services/userAccessService';

type HomeworkFilterTab =
  | 'all'
  | 'missing'
  | 'overdue'
  | 'waiting_review'
  | 'graded'
  | 'recommended'
  | 'foundation'
  | 'standard'
  | 'advanced'
  | 'submitted';

const HomeworkStudent: React.FC = () => {
  const { user } = useAuth();
  const [selected, setSelected] = useState<Assignment | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [contentUrl, setContentUrl] = useState('');
  const [comment, setComment] = useState('');
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [usingCachedAssignments, setUsingCachedAssignments] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);
  const [filter, setFilter] = useState<HomeworkFilterTab>('all');
  const openedFromUrlRef = useRef(false);

  const [dtDefine, setDtDefine] = useState('');
  const [dtIdeate, setDtIdeate] = useState('');
  const [dtPrototypeUrl, setDtPrototypeUrl] = useState('');
  const [dtTestFeedback, setDtTestFeedback] = useState('');

  const [packChoices, setPackChoices] = useState<Record<string, string>>({});

  const openSubmission = useCallback((assignment: Assignment) => {
    const previous = user
      ? getStudentSubmissionForAssignment(assignment.id, user.id, user.classroom, parseInt(user.studentNumber))
      : null;
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
    const urlFilter = params.get('filter') as HomeworkFilterTab | null;
    if (urlFilter) {
      setFilter(urlFilter);
    }
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

  const workOverview = useMemo(() => {
    void dataVersion;
    if (!user) return null;
    return getStudentWorkStatusOverview(
      user.classroom,
      user.id,
      parseInt(user.studentNumber),
      user.name,
      packChoices,
    );
  }, [user, packChoices, dataVersion]);

  const filteredTasks = useMemo(() => {
    if (!workOverview || !user) return [];
    return workOverview.tasks.filter((item) => {
      const a = item.assignment;
      const sub = item.submission;
      const recommendedDiff = recommendAssignment(a, user.id).difficulty;
      if (filter === 'missing') return !sub;
      if (filter === 'overdue') return item.status === 'overdue';
      if (filter === 'waiting_review') return item.status === 'waiting_review';
      if (filter === 'graded') return item.status === 'graded';
      if (filter === 'submitted') return Boolean(sub);
      if (filter === 'recommended') return (a.difficulty || 'standard') === recommendedDiff;
      if (filter === 'foundation') return a.difficulty === 'foundation';
      if (filter === 'standard') return !a.difficulty || a.difficulty === 'standard';
      if (filter === 'advanced') return a.difficulty === 'advanced';
      return true;
    });
  }, [workOverview, user, filter]);

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

  const overview = workOverview || {
    tasks: [],
    missingTasks: [],
    overdueTasks: [],
    pendingTasks: [],
    waitingReviewTasks: [],
    gradedTasks: [],
    missingManualAssessments: [],
    totalRequiredCount: 0,
    completedCount: 0,
    totalMissingCount: 0,
    overdueCount: 0,
    pendingCount: 0,
    waitingReviewCount: 0,
    gradedCount: 0,
    completionPercent: 100,
  };

  return (
    <div className="container section-padding" style={{ paddingTop: '6rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: '0 0 4px' }}>📝 ศูนย์ส่งงานและเช็กงานค้างของฉัน</h1>
          <p style={{ color: '#6b7280', margin: 0 }}>
            {user.name} (ชั้น {user.classroom} เลขที่ {user.studentNumber}) • ตรวจสอบงานค้าง ส่งการบ้าน และติดตามผลคะแนน K/P
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

      {/* 📊 แผงสรุปสถานะงานค้างและการส่งงานของฉัน */}
      <div
        className="card"
        style={{
          marginTop: '1.25rem',
          padding: '1.25rem',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          border: '1.5px solid #e2e8f0',
          borderRadius: 18,
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClipboardList size={20} color="#4f46e5" />
            <strong style={{ fontSize: '1.02rem', color: '#0f172a' }}>
              สรุปสถานะการส่งงานของฉัน (ส่งแล้ว {overview.completedCount} / {overview.tasks.length} ชิ้น)
            </strong>
          </div>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: 999,
              fontSize: '0.8rem',
              fontWeight: 800,
              background: overview.totalMissingCount === 0 ? '#dcfce7' : overview.overdueCount > 0 ? '#fee2e2' : '#fef3c7',
              color: overview.totalMissingCount === 0 ? '#166534' : overview.overdueCount > 0 ? '#b91c1c' : '#92400e',
            }}
          >
            {overview.totalMissingCount === 0
              ? '🎉 ส่งงานครบทุกชิ้นแล้ว!'
              : `📌 มีงานค้างที่ต้องติดตามรวม ${overview.totalMissingCount} รายการ`}
          </span>
        </div>

        {/* Progress Bar */}
        <div style={{ height: 10, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden', marginBottom: 14 }}>
          <div
            style={{
              width: `${overview.completionPercent}%`,
              height: '100%',
              background: overview.completionPercent === 100
                ? 'linear-gradient(90deg, #10b981, #22c55e)'
                : 'linear-gradient(90deg, #6366f1, #38bdf8)',
              transition: 'width 0.35s ease',
            }}
          />
        </div>

        {/* 4 Clickable Status Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: 10 }}>
          <button
            type="button"
            onClick={() => setFilter(filter === 'overdue' ? 'all' : 'overdue')}
            style={{
              textAlign: 'left',
              padding: '12px 14px',
              borderRadius: 12,
              border: filter === 'overdue' ? '2px solid #ef4444' : '1px solid #fecaca',
              background: '#fef2f2',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: '0.78rem', color: '#b91c1c', fontWeight: 700 }}>🚨 ค้างส่ง (เลยกำหนด)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#dc2626', marginTop: 2 }}>
              {overview.overdueCount} <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>ชิ้น</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setFilter(filter === 'missing' ? 'all' : 'missing')}
            style={{
              textAlign: 'left',
              padding: '12px 14px',
              borderRadius: 12,
              border: filter === 'missing' ? '2px solid #f59e0b' : '1px solid #fde68a',
              background: '#fffbeb',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: '0.78rem', color: '#b45309', fontWeight: 700 }}>📌 งานค้างรอส่งทั้งหมด</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#d97706', marginTop: 2 }}>
              {overview.overdueCount + overview.pendingCount}{' '}
              <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>ชิ้น</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setFilter(filter === 'waiting_review' ? 'all' : 'waiting_review')}
            style={{
              textAlign: 'left',
              padding: '12px 14px',
              borderRadius: 12,
              border: filter === 'waiting_review' ? '2px solid #0284c7' : '1px solid #bae6fd',
              background: '#f0f9ff',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: '0.78rem', color: '#0369a1', fontWeight: 700 }}>⏳ ส่งแล้ว (รอครูตรวจ)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0284c7', marginTop: 2 }}>
              {overview.waitingReviewCount} <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>ชิ้น</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setFilter(filter === 'graded' ? 'all' : 'graded')}
            style={{
              textAlign: 'left',
              padding: '12px 14px',
              borderRadius: 12,
              border: filter === 'graded' ? '2px solid #16a34a' : '1px solid #bbf7d0',
              background: '#f0fdf4',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 700 }}>✅ ตรวจและได้คะแนนแล้ว</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#16a34a', marginTop: 2 }}>
              {overview.gradedCount} <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>ชิ้น</span>
            </div>
          </button>
        </div>

        {/* 🚨 กล่องแจ้งเตือนรายการงานค้าง (ทั้งการบ้านออนไลน์ และ ใบงานในสมุดคะแนน) */}
        {(overview.missingTasks.length > 0 || overview.missingManualAssessments.length > 0) && (
          <div
            style={{
              marginTop: 14,
              padding: '12px 14px',
              borderRadius: 12,
              background: overview.overdueCount > 0 ? '#fff1f2' : '#fffbeb',
              border: overview.overdueCount > 0 ? '1.5px solid #fda4af' : '1.5px solid #fcd34d',
            }}
          >
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: overview.overdueCount > 0 ? '#9f1239' : '#92400e', marginBottom: 8 }}>
              📋 รายการงานที่เธอยังค้างอยู่ ({overview.totalMissingCount} รายการ) — กดปุ่ม &ldquo;ส่งงานนี้เลย&rdquo; เพื่อทำและส่งได้ทันที:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {overview.missingTasks.map((item) => (
                <div
                  key={item.assignment.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 8,
                    padding: '8px 12px',
                    borderRadius: 10,
                    background: '#ffffff',
                    border: item.isOverdue ? '1px solid #fca5a5' : '1px solid #fde68a',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 999,
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        background: item.isOverdue ? '#ef4444' : '#f59e0b',
                        color: '#ffffff',
                      }}
                    >
                      {item.isOverdue ? '🚨 เลยกำหนด' : '📌 ยังไม่ส่ง'}
                    </span>
                    <strong style={{ fontSize: '0.9rem', color: '#1e293b' }}>{item.assignment.title}</strong>
                    <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                      ({item.subjectTitle}{item.indicatorCode ? ` • ${item.indicatorCode}` : ''} • {item.dueLabel})
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => openSubmission(item.assignment)}
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  >
                    <Upload size={13} /> ส่งงานนี้เลย
                  </button>
                </div>
              ))}

              {overview.missingManualAssessments.map((ma) => (
                <div
                  key={ma.assessmentId}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 8,
                    padding: '8px 12px',
                    borderRadius: 10,
                    background: '#ffffff',
                    border: '1px dashed #fbbf24',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 999,
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        background: '#fef3c7',
                        color: '#92400e',
                        border: '1px solid #f59e0b',
                      }}
                    >
                      📝 ใบงานในชั้นเรียน
                    </span>
                    <strong style={{ fontSize: '0.9rem', color: '#1e293b' }}>{ma.title}</strong>
                    <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                      (วิชา{ma.subjectTitle} • {ma.indicatorCode} • คะแนนเต็ม {ma.maxScore} คะแนน — ยังไม่มีคะแนนในสมุด ปพ.5)
                    </span>
                  </div>
                  {ma.resourceUrl ? (
                    <a
                      href={ma.resourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary"
                      style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                    >
                      <ExternalLink size={13} /> เปิดใบงาน
                    </a>
                  ) : (
                    <span style={{ fontSize: '0.78rem', color: '#b45309', fontWeight: 700 }}>
                      ติดต่อส่งใบงานกับคุณครูในคาบเรียน
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '1.25rem 0' }}>
        {[
          { id: 'all', label: `งานทั้งหมด (${overview.tasks.length})` },
          { id: 'missing', label: `📌 งานค้างยังไม่ส่ง (${overview.overdueCount + overview.pendingCount})` },
          { id: 'overdue', label: `🚨 เลยกำหนด (${overview.overdueCount})` },
          { id: 'waiting_review', label: `⏳ รอครูตรวจ (${overview.waitingReviewCount})` },
          { id: 'graded', label: `✅ ตรวจแล้ว (${overview.gradedCount})` },
          { id: 'recommended', label: '✨ แนะนำสำหรับเธอ' },
          { id: 'foundation', label: '🟢 พื้นฐาน' },
          { id: 'standard', label: '🟡 มาตรฐาน' },
          { id: 'advanced', label: '🔵 ท้าทาย' },
          { id: 'submitted', label: '✓ ส่งแล้วทั้งหมด' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id as HomeworkFilterTab)}
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
      ) : filteredTasks.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <FileText size={48} color="#9ca3af" />
          <h3>ไม่พบรายการในหมวดนี้ 🎉</h3>
          <p>ไม่มีงานต้องส่งในหมวดที่เลือก — ลองเลือกแท็บ &ldquo;งานทั้งหมด&rdquo;</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredTasks.map((item) => {
            const a = item.assignment;
            const sub = item.submission;
            const overdue = item.isOverdue;
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
                      <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700 }}>
                        📚 {item.subjectTitle}{item.indicatorCode ? ` (${item.indicatorCode})` : ''}
                      </span>
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
                    <div style={{ fontSize: '0.85rem', color: overdue ? '#dc2626' : '#6b7280', fontWeight: overdue ? 700 : 500, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <span><Clock size={14} style={{ verticalAlign: 'middle' }} /> {item.dueLabel}</span>
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
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                        <div style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.82rem' }}>
                          <AlertCircle size={15} style={{ verticalAlign: 'middle' }} /> ค้างส่ง (เลยกำหนด)
                        </div>
                        <button onClick={() => openSubmission(a)} className="btn-primary" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white' }}>
                          <Upload size={14} /> ส่งงานย้อนหลัง
                        </button>
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
                    <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600 }}>💡 แนะนำ: เปิดสิทธิ์ &ldquo;ทุกคนที่มีลิงก์ดูได้&rdquo; ก่อนส่ง</span>
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
                    <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 4 }}>📁 Google Drive: เปิดสิทธิ์ &ldquo;ทุกคนที่มีลิงก์&rdquo;</span>
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
