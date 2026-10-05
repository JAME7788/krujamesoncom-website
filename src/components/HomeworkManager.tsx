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
  Sparkles,
  Wand2,
  Link2,
  Check,
} from 'lucide-react';
import {
  loadAssignments, createAssignment, deleteAssignment,
  getSubmissionsByAssignment, reviewSubmission,
  fetchAssignmentsFromFirebase, fetchSubmissionsFromFirebase,
  generate3TierAssignments,
  type AssignmentDifficulty, type AssignmentTargetType, type AbilityTier,
} from '../services/homeworkService';
import type { Assignment, Submission } from '../services/homeworkService';
import { allClassrooms2569 } from '../data/students2569';
import { getSubjectsForClassroom, getIndicators } from '../services/gradeService';
import type { Subject } from '../services/gradeService';
import { getTechnologyLessonPlans } from '../data/technologyLessonPlans';
import type { PrimaryTechnologyGradeId } from '../data/technologyTeachingSchedule';
import { loadRoster } from '../services/rosterService';
import './HomeworkManager.css';

const getSubmissionLinkBadge = (url: string) => {
  if (/canva\.com/i.test(url)) return { label: '🎨 เปิดดูงาน Canva', bg: '#ede9fe', color: '#6d28d9', border: '#ddd6fe' };
  if (/scratch\.mit\.edu/i.test(url)) return { label: '🐱 เปิดโปรเจกต์ Scratch', bg: '#fef3c7', color: '#b45309', border: '#fde68a' };
  if (/drive\.google\.com|docs\.google\.com/i.test(url)) return { label: '📁 เปิด Google Drive / Docs', bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' };
  if (/youtube\.com|youtu\.be/i.test(url)) return { label: '▶️ เปิดคลิป YouTube', bg: '#fee2e2', color: '#b91c1c', border: '#fecaca' };
  if (/github\.com/i.test(url)) return { label: '💻 เปิดโค้ด GitHub', bg: '#f1f5f9', color: '#0f172a', border: '#cbd5e1' };
  if (/figma\.com/i.test(url)) return { label: '📐 เปิด Figma Design', bg: '#fae8ff', color: '#86198f', border: '#f5d0fe' };
  return { label: '🔗 เปิดลิงก์ผลงาน', bg: '#f8fafc', color: '#334155', border: '#e2e8f0' };
};

const HomeworkManager: React.FC = () => {
  const [list, setList] = useState(loadAssignments());
  const [show, setShow] = useState(false);
  const [showAuto3Tier, setShowAuto3Tier] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = (id: string) => {
    const shareUrl = `${window.location.origin}/homework?id=${id}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2500);
      }).catch(() => {
        prompt('คัดลอกลิงก์ส่งงานให้นักเรียน:', shareUrl);
      });
    } else {
      prompt('คัดลอกลิงก์ส่งงานให้นักเรียน:', shareUrl);
    }
  };
  const [draft, setDraft] = useState<Partial<Assignment>>({
    title: '',
    description: '',
    classroom: '',
    dueDate: new Date().toISOString().slice(0, 10),
    maxScore: 10,
    knowledgeMaxScore: 5,
    practiceMaxScore: 5,
    resourceUrl: '',
    category: 'k',
    difficulty: 'standard',
    targetType: 'all',
    targetTier: 'proficient',
    targetStudentIds: [],
    hints: [''],
    recommendedReason: '',
    bonusPoints: 0,
  });

  // 3-Tier Auto Modal state
  const [autoDraft, setAutoDraft] = useState({
    classroom: 'ป.1',
    subject: '' as Subject | '',
    indicatorId: '',
    topic: '',
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    lessonPlanId: '',
  });

  const [filterDifficulty, setFilterDifficulty] = useState<'all' | AssignmentDifficulty>('all');
  const [filterTarget, setFilterTarget] = useState<'all' | AssignmentTargetType>('all');
  const [filterClassroom, setFilterClassroom] = useState<string>('all');

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

  const classroomRoster = useMemo(() => {
    return draft.classroom ? loadRoster(draft.classroom) : [];
  }, [draft.classroom]);

  // Auto 3-Tier subjects & indicators
  const autoSubjects = useMemo(
    () => (autoDraft.classroom ? getSubjectsForClassroom(autoDraft.classroom) : []),
    [autoDraft.classroom]
  );
  const autoIndicators = useMemo(
    () => (autoDraft.classroom && autoDraft.subject ? getIndicators(autoDraft.classroom, autoDraft.subject) : []),
    [autoDraft.classroom, autoDraft.subject]
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

  const handleAddHint = () => {
    setDraft((prev) => ({
      ...prev,
      hints: [...(prev.hints || []), ''],
    }));
  };

  const handleHintChange = (index: number, val: string) => {
    setDraft((prev) => {
      const updated = [...(prev.hints || [])];
      updated[index] = val;
      return { ...prev, hints: updated };
    });
  };

  const handleRemoveHint = (index: number) => {
    setDraft((prev) => {
      const updated = [...(prev.hints || [])];
      updated.splice(index, 1);
      return { ...prev, hints: updated };
    });
  };

  const toggleTargetStudent = (code: string) => {
    setDraft((prev) => {
      const current = prev.targetStudentIds || [];
      const exists = current.includes(code);
      const updated = exists ? current.filter((id) => id !== code) : [...current, code];
      return { ...prev, targetStudentIds: updated };
    });
  };

  const submit = async () => {
    const kMax = Math.max(0, draft.knowledgeMaxScore || 0);
    const pMax = Math.max(0, draft.practiceMaxScore || 0);
    if (!draft.title || !draft.dueDate || !draft.classroom || !draft.subject || !draft.indicatorId) {
      alert('กรอกชื่องาน ห้อง วิชา ตัวชี้วัด และกำหนดส่งให้ครบ');
      return;
    }
    if (draft.targetType === 'specific_students' && !draft.targetStudentIds?.length) { alert('กรุณาเลือกนักเรียนอย่างน้อย 1 คน'); return; }
    if (kMax + pMax <= 0) {
      alert('กำหนดคะแนน K หรือ P อย่างน้อย 1 คะแนน');
      return;
    }
    setSyncing(true);
    try {
      const cleanHints = (draft.hints || []).map((h) => h.trim()).filter(Boolean);
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
        difficulty: draft.difficulty || 'standard',
        targetType: draft.targetType || 'all',
        targetTier: draft.targetType === 'ability_tier' ? draft.targetTier : undefined,
        targetStudentIds: draft.targetType === 'specific_students' ? draft.targetStudentIds : undefined,
        hints: cleanHints.length > 0 ? cleanHints : undefined,
        recommendedReason: draft.recommendedReason?.trim() || undefined,
        bonusPoints: draft.difficulty === 'advanced' ? Number(draft.bonusPoints) || 0 : undefined,
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
        difficulty: 'standard',
        targetType: 'all',
        targetTier: 'proficient',
        targetStudentIds: [],
        hints: [''],
        recommendedReason: '',
        bonusPoints: 0,
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

  const handleExecuteAuto3Tier = async () => {
    if (!autoDraft.classroom || !autoDraft.subject || !autoDraft.indicatorId || !autoDraft.topic.trim()) {
      alert('กรุณาเลือกห้อง วิชา ตัวชี้วัด และพิมพ์หัวข้อบทเรียนให้ครบถ้วน');
      return;
    }
    setSyncing(true);
    try {
      await generate3TierAssignments({
        classroom: autoDraft.classroom,
        subject: autoDraft.subject,
        indicatorId: autoDraft.indicatorId,
        topic: autoDraft.topic.trim(),
        dueDate: autoDraft.dueDate,
        lessonPlanId: autoDraft.lessonPlanId || undefined,
      });
      setShowAuto3Tier(false);
      setAutoDraft({
        classroom: 'ป.1',
        subject: '',
        indicatorId: '',
        topic: '',
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        lessonPlanId: '',
      });
      reload();
      alert('สร้างชุดภารกิจ 3 ระดับ (พื้นฐาน, มาตรฐาน, ท้าทาย) สำเร็จแล้ว 🎉');
    } catch (e) {
      console.error(e);
      alert('เกิดข้อผิดพลาดในการสร้างชุดงานอัตโนมัติ');
    } finally {
      setSyncing(false);
    }
  };

  const filteredList = useMemo(() => {
    return list.filter((a) => {
      if (filterClassroom !== 'all' && a.classroom !== filterClassroom) return false;
      if (filterDifficulty !== 'all') {
        const diff = a.difficulty || 'standard';
        if (diff !== filterDifficulty) return false;
      }
      if (filterTarget !== 'all') {
        const tgt = a.targetType || 'all';
        if (tgt !== filterTarget) return false;
      }
      return true;
    });
  }, [list, filterClassroom, filterDifficulty, filterTarget]);

  return (
    <div>
      <div className="filter-row" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button className="btn-primary" onClick={() => setShow(!show)}>
          <Plus size={16} /> {show ? 'ยกเลิก' : 'สร้างการบ้านใหม่'}
        </button>
        <button
          className="btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ede9fe', color: '#5b21b6', border: '1px solid #c4b5fd' }}
          onClick={() => setShowAuto3Tier(!showAuto3Tier)}
        >
          <Wand2 size={16} /> ⚡ สร้างชุดงาน 3 ระดับอัตโนมัติ (Differentiated 3-Tier)
        </button>
      </div>

      {/* Auto 3-Tier Generator Modal */}
      {showAuto3Tier && (
        <div className="card" style={{ marginTop: 12, background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', border: '1px solid #c4b5fd', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, color: '#4c1d95', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Wand2 size={18} /> ตัวช่วยสร้างชุดงาน 3 ระดับอัตโนมัติ (Personalized Learning)
            </h3>
            <button className="btn-ghost" onClick={() => setShowAuto3Tier(false)}><X size={16} /></button>
          </div>
          <p style={{ margin: '0 0 12px', fontSize: '0.85rem', color: '#5b21b6' }}>
            ระบบจะสร้างการบ้านพร้อมกัน 3 ฉบับแบ่งตามศักยภาพ: <strong>🟢 ระดับพื้นฐาน (มีคำใบ้ช่วยคิด)</strong>, <strong>🟡 ระดับมาตรฐาน (ตัวชี้วัด สพฐ.)</strong>, และ <strong>🔵 ระดับท้าทาย (ต่อยอดสร้างสรรค์ + Bonus XP)</strong>
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>ห้องเรียน</label>
              <select
                value={autoDraft.classroom}
                onChange={(e) => setAutoDraft({ ...autoDraft, classroom: e.target.value, subject: '', indicatorId: '' })}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #c4b5fd', background: 'white' }}
              >
                {allClassrooms2569.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>วิชา</label>
              <select
                value={autoDraft.subject}
                onChange={(e) => setAutoDraft({ ...autoDraft, subject: e.target.value as Subject, indicatorId: '' })}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #c4b5fd', background: 'white' }}
              >
                <option value="">-- เลือกวิชา --</option>
                {autoSubjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.emoji} {s.title} ({s.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>ตัวชี้วัด</label>
              <select
                value={autoDraft.indicatorId}
                onChange={(e) => setAutoDraft({ ...autoDraft, indicatorId: e.target.value })}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #c4b5fd', background: 'white' }}
              >
                <option value="">-- เลือกตัวชี้วัด --</option>
                {autoIndicators.map((ind) => (
                  <option key={ind.id} value={ind.id}>{ind.code} — {ind.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>กำหนดส่ง</label>
              <input
                type="date"
                value={autoDraft.dueDate}
                onChange={(e) => setAutoDraft({ ...autoDraft, dueDate: e.target.value })}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #c4b5fd', background: 'white' }}
              />
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>หัวข้อบทเรียน/โจทย์ภารกิจ *</label>
            <input
              type="text"
              placeholder="เช่น การเขียนโปรแกรมวนซ้ำ Scratch, การค้นหาข้อมูลอย่างปลอดภัย"
              value={autoDraft.topic}
              onChange={(e) => setAutoDraft({ ...autoDraft, topic: e.target.value })}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #c4b5fd', background: 'white' }}
            />
          </div>

          <p>นักเรียนเลือกทำหนึ่งทางเลือกต่อชุด ระบบแนะนำจากผลตรวจงานในตัวชี้วัดเดียวกัน ทุกทางเลือกใช้คะแนนเต็มและรายการประเมิน K/P ร่วมกัน คำใบ้ไม่ลดคะแนน</p>
          <button
            className="btn-primary"
            style={{ marginTop: 12, background: '#6d28d9', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            onClick={() => void handleExecuteAuto3Tier()}
            disabled={syncing}
          >
            <Sparkles size={16} /> {syncing ? 'กำลังสร้างชุดงาน...' : 'มอบหมายชุดงาน 3 ทางเลือก (เลือกทำหนึ่งงาน)'}
          </button>
        </div>
      )}

      {/* Manual / Customized Create Form */}
      {show && (
        <div className="sm-add-form" style={{ flexDirection: 'column', gap: 10, marginTop: 12 }}>
          <div className="filter-row" style={{ width: '100%' }}>
            <div className="filter-group" style={{ flex: 2 }}>
              <label>หัวข้องาน *</label>
              <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="เช่น ใบงานที่ 1: เขียน Flowchart" />
            </div>
            <div className="filter-group">
              <label>ห้อง</label>
              <select value={draft.classroom} onChange={(e) => setDraft({ ...draft, classroom: e.target.value, targetStudentIds: [] })}>
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

          {/* Section: Personalized Settings */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontWeight: 700, color: '#334155' }}>
              <Sparkles size={16} className="text-primary" /> ปรับแต่งเฉพาะบุคคล (Personalized Assignment Settings)
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>ระดับความยาก (Difficulty Tier)</label>
                <select
                  value={draft.difficulty || 'standard'}
                  onChange={(e) => setDraft({ ...draft, difficulty: e.target.value as AssignmentDifficulty })}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', background: 'white' }}
                >
                  <option value="foundation">🟢 ระดับพื้นฐาน (Foundation - มีคำใบ้ช่วย)</option>
                  <option value="standard">🟡 ระดับมาตรฐาน (Standard - ตามตัวชี้วัด)</option>
                  <option value="advanced">🔵 ระดับท้าทาย (Advanced - ต่อยอดสร้างสรรค์)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>กลุ่มเป้าหมาย (Target Mode)</label>
                <select
                  value={draft.targetType || 'all'}
                  onChange={(e) => setDraft({ ...draft, targetType: e.target.value as AssignmentTargetType })}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', background: 'white' }}
                >
                  <option value="all">👥 นักเรียนทั้งห้อง (ทุกคน)</option>
                  <option value="ability_tier">🎯 ตามกลุ่มศักยภาพ (Ability Tier)</option>
                  <option value="specific_students">👤 เจาะจงนักเรียนรายบุคคล (Specific Students)</option>
                </select>
              </div>

              {draft.targetType === 'ability_tier' && (
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>กลุ่มศักยภาพเป้าหมาย</label>
                  <select
                    value={draft.targetTier || 'proficient'}
                    onChange={(e) => setDraft({ ...draft, targetTier: e.target.value as AbilityTier })}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', background: 'white' }}
                  >
                    <option value="advanced">กลุ่มต่อยอด/ก้าวหน้า (Advanced)</option>
                    <option value="proficient">กลุ่มปกติ/มาตรฐาน (Proficient)</option>
                    <option value="developing">กลุ่มควรเสริม (Developing)</option>
                    <option value="intervention">กลุ่มช่วยเหลือเร่งด่วน (Intervention)</option>
                  </select>
                </div>
              )}

              {draft.difficulty === 'advanced' && (
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>คะแนนพิเศษ Bonus XP</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={draft.bonusPoints || 0}
                    onChange={(e) => setDraft({ ...draft, bonusPoints: parseInt(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', background: 'white' }}
                  />
                </div>
              )}
            </div>

            {/* Target specific students checkbox list */}
            {draft.targetType === 'specific_students' && draft.classroom && (
              <div style={{ marginTop: 10, padding: 10, background: '#ffffff', borderRadius: 8, border: '1px dashed #cbd5e1' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 6, display: 'block' }}>
                  เลือกนักเรียนที่ได้รับมอบหมาย ({draft.targetStudentIds?.length || 0}/{classroomRoster.length} คน):
                </label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxHeight: 150, overflowY: 'auto' }}>
                  {classroomRoster.map((s) => {
                    const selected = draft.targetStudentIds?.includes(s.studentCode) || draft.targetStudentIds?.includes(String(s.no));
                    return (
                      <button
                        key={s.studentCode}
                        type="button"
                        onClick={() => toggleTargetStudent(s.studentCode)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 6,
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          border: selected ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                          background: selected ? '#eff6ff' : '#f8fafc',
                          color: selected ? '#1d4ed8' : '#475569',
                          fontWeight: selected ? 700 : 400,
                        }}
                      >
                        {s.no}. {s.name} {selected ? '✓' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Scaffolding Hints */}
            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>💡 คำใบ้และแนวทางช่วยเหลือ (Scaffolding Hints):</label>
                <button
                  type="button"
                  onClick={handleAddHint}
                  style={{ fontSize: '0.75rem', padding: '2px 6px', background: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe', borderRadius: 4, cursor: 'pointer' }}
                >
                  + เพิ่มคำใบ้
                </button>
              </div>
              {(draft.hints || []).map((h, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                  <input
                    type="text"
                    placeholder={`คำใบ้ที่ ${i + 1} เช่น ตรวจสอบตัวแปร และทดสอบลูปวนซ้ำ`}
                    value={h}
                    onChange={(e) => handleHintChange(i, e.target.value)}
                    style={{ flex: 1, padding: '5px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                  {(draft.hints || []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveHint(i)}
                      style={{ background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 6, padding: '0 8px', cursor: 'pointer' }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 8 }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>เหตุผลที่แนะนำ (เช่น เหมาะสำหรับผู้ที่ต้องการทบทวนคำสั่งเบื้องต้น)</label>
              <input
                type="text"
                placeholder="ระบุข้อความแนะนำสั้นๆ แก่นักเรียน"
                value={draft.recommendedReason || ''}
                onChange={(e) => setDraft({ ...draft, recommendedReason: e.target.value })}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
              />
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

          <div style={{ width: '100%', marginTop: 2 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', color: '#0f766e' }}>
              <input
                type="checkbox"
                checked={!!draft.isDesignThinking}
                onChange={(e) => setDraft({ ...draft, isDesignThinking: e.target.checked })}
              />
              💡 งานโครงงานกระบวนการคิดเชิงออกแบบ (Design Thinking: ว 4.1 - 4 ขั้นตอน Define, Ideate, Prototype, Test)
            </label>
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

      {/* Filter Row for Table */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', margin: '14px 0 8px' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>ตัวกรอง:</span>
        <select
          value={filterClassroom}
          onChange={(e) => setFilterClassroom(e.target.value)}
          style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
        >
          <option value="all">ทุกห้อง ({list.length})</option>
          {allClassrooms2569.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={filterDifficulty}
          onChange={(e) => setFilterDifficulty(e.target.value as typeof filterDifficulty)}
          style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
        >
          <option value="all">ทุกระดับความยาก</option>
          <option value="foundation">🟢 ระดับพื้นฐาน</option>
          <option value="standard">🟡 ระดับมาตรฐาน</option>
          <option value="advanced">🔵 ระดับท้าทาย</option>
        </select>

        <select
          value={filterTarget}
          onChange={(e) => setFilterTarget(e.target.value as typeof filterTarget)}
          style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
        >
          <option value="all">ทุกกลุ่มเป้าหมาย</option>
          <option value="all">👥 ทั้งห้อง (ทุกคน)</option>
          <option value="ability_tier">🎯 ตามกลุ่มศักยภาพ</option>
          <option value="specific_students">👤 เจาะจงรายคน</option>
        </select>
      </div>

      {filteredList.length === 0 ? (
        <div className="empty-state-card">
          <p>ยังไม่มีการบ้านในเงื่อนไขนี้ — กดสร้างใหม่ หรือเลือกตัวช่วยสร้าง 3 ระดับ</p>
        </div>
      ) : (
        <div className="att-table-wrap">
          <table className="att-table">
            <thead>
              <tr>
                <th>หัวข้อภารกิจ</th>
                <th>ระดับ / เป้าหมาย</th>
                <th>ห้อง</th>
                <th>ส่งภายใน</th>
                <th>K/P</th>
                <th>ส่งแล้ว</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((a) => {
                const subs = getSubmissionsByAssignment(a.id);
                return (
                  <tr key={a.id}>
                    <td>
                      <strong>{a.title}</strong>
                      {a.hints && a.hints.length > 0 && (
                        <div style={{ fontSize: '0.72rem', color: '#2563eb' }}>
                          💡 มี {a.hints.length} คำใบ้ช่วยคิด
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-start' }}>
                        {a.difficulty === 'foundation' ? (
                          <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700 }}>
                            🟢 พื้นฐาน
                          </span>
                        ) : a.difficulty === 'advanced' ? (
                          <span style={{ background: '#ede9fe', color: '#5b21b6', padding: '2px 6px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700 }}>
                            🔵 ท้าทาย {a.bonusPoints ? `+${a.bonusPoints} XP` : ''}
                          </span>
                        ) : (
                          <span style={{ background: '#fef3c7', color: '#854d0e', padding: '2px 6px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700 }}>
                            🟡 มาตรฐาน
                          </span>
                        )}
                        {a.targetType === 'specific_students' ? (
                          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            👤 เจาะจง ({a.targetStudentIds?.length || 0} คน)
                          </span>
                        ) : a.targetType === 'ability_tier' ? (
                          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            🎯 กลุ่ม {a.targetTier}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            👥 ทั้งห้อง
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{a.classroom || 'ทุกห้อง'}</td>
                    <td>{a.dueDate}</td>
                    <td>
                      K {a.knowledgeMaxScore ?? (a.category === 'k' ? a.maxScore : 0)}
                      {' / '}
                      P {a.practiceMaxScore ?? (a.category === 'p' ? a.maxScore : 0)}
                    </td>
                    <td>{subs.length} คน</td>
                    <td>
                      <button
                        className="cb-icon-btn"
                        title={copiedId === a.id ? 'คัดลอกลิงก์แล้ว!' : 'คัดลอกลิงก์ส่งงาน (แชร์ให้นักเรียน)'}
                        onClick={() => handleCopyLink(a.id)}
                        style={copiedId === a.id ? { color: '#16a34a', borderColor: '#86efac' } : undefined}
                      >
                        {copiedId === a.id ? <Check size={14} /> : <Link2 size={14} />}
                      </button>
                      <button className="cb-icon-btn" title="ดูผลงานและตรวจงาน" onClick={() => setViewing(a)}><Eye size={14} /></button>
                      <button className="cb-icon-btn danger" title="ลบการบ้าน" disabled={syncing} onClick={() => {
                        if (!confirm('ยืนยันลบการบ้านนี้?')) return;
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <h2 style={{ margin: 0 }}>{assignment.title}</h2>
              {assignment.difficulty === 'foundation' ? (
                <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700 }}>
                  🟢 พื้นฐาน
                </span>
              ) : assignment.difficulty === 'advanced' ? (
                <span style={{ background: '#ede9fe', color: '#5b21b6', padding: '2px 8px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700 }}>
                  🔵 ท้าทาย
                </span>
              ) : null}
            </div>
            {assignment.resourceUrl && (() => {
              const safeUrl = /^https?:\/\//i.test(assignment.resourceUrl) ? assignment.resourceUrl : `https://${assignment.resourceUrl}`;
              return (
                <a href={safeUrl} target="_blank" rel="noreferrer">
                  <ExternalLink size={13} /> เปิดใบงานต้นฉบับ
                </a>
              );
            })()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ fontSize: '0.8rem', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 5 }}
              onClick={() => {
                const shareUrl = `${window.location.origin}/homework?id=${assignment.id}`;
                if (navigator?.clipboard?.writeText) {
                  navigator.clipboard.writeText(shareUrl).then(() => {
                    alert('คัดลอกลิงก์ส่งงานแล้ว:\n' + shareUrl);
                  }).catch(() => {
                    prompt('คัดลอกลิงก์ส่งงาน:', shareUrl);
                  });
                } else {
                  prompt('คัดลอกลิงก์ส่งงาน:', shareUrl);
                }
              }}
              title="คัดลอกลิงก์ส่งงานให้นักเรียนในกลุ่มไลน์"
            >
              <Link2 size={13} /> คัดลอกลิงก์ส่งงาน
            </button>
            <button onClick={onClose} className="btn-ghost"><X size={16} /></button>
          </div>
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
                    {s?.designThinkingSteps && (
                      <div style={{ marginTop: 8, padding: 8, background: '#f0fdfa', borderRadius: 8, border: '1px solid #ccfbf1', fontSize: '0.82rem' }}>
                        <strong style={{ color: '#0f766e', display: 'block', marginBottom: 4 }}>💡 รายละเอียดกระบวนการ Design Thinking:</strong>
                        {s.designThinkingSteps.define && <div style={{ marginBottom: 2 }}><strong>1. ปัญหา (Define):</strong> {s.designThinkingSteps.define}</div>}
                        {s.designThinkingSteps.ideate && <div style={{ marginBottom: 2 }}><strong>2. ไอเดีย (Ideate):</strong> {s.designThinkingSteps.ideate}</div>}
                        {s.designThinkingSteps.prototypeUrl && (() => {
                          const safeProto = /^https?:\/\//i.test(s.designThinkingSteps.prototypeUrl) ? s.designThinkingSteps.prototypeUrl : `https://${s.designThinkingSteps.prototypeUrl}`;
                          return (
                            <div style={{ marginBottom: 2 }}><strong>3. ต้นแบบ (Prototype):</strong> <a href={safeProto} target="_blank" rel="noreferrer" style={{ color: '#0284c7' }}>เปิดลิงก์ชิ้นงาน</a></div>
                          );
                        })()}
                        {s.designThinkingSteps.testFeedback && <div><strong>4. ผลทดสอบ (Test):</strong> {s.designThinkingSteps.testFeedback}</div>}
                      </div>
                    )}
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
                    {s.contentUrl && (() => {
                      const safeUrl = /^https?:\/\//i.test(s.contentUrl) ? s.contentUrl : `https://${s.contentUrl}`;
                      const badge = getSubmissionLinkBadge(safeUrl);
                      return (
                        <a
                          href={safeUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '4px 10px',
                            borderRadius: 6,
                            background: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          <span>{badge.label}</span>
                          <ExternalLink size={12} />
                        </a>
                      );
                    })()}
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
