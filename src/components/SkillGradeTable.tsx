import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Download, Users, Plus, Trash2, Save, BookOpen, Printer, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import IsKnowledgeBlog from '../pages/IsKnowledgeBlog';
import {
  loadSkillGradeData, saveSkillGradeData,
  fetchSkillGradeDataFromFirebase, resetSkillStudentsFromRoster,
  addSkillAssignment, renameSkillAssignment, deleteSkillAssignment,
  updateSkillStudentScore, updateSkillStudentP, totalSkillK,
  applyIsSkillTemplate,
} from '../services/skillGradeService';
import type { SkillGradeData, SkillAssignment } from '../services/skillGradeService';
import type { Skill } from '../services/gradeService';
import { loadAllRosters } from '../services/rosterService';
import { seedIsAgriAssignmentsForClassroom } from '../services/homeworkService';
import {
  IS_CAREER_CURRICULUM,
  buildPrintableIsWorksheetHtml,
  type IsStepModule,
} from '../data/isCareerCurriculum';
import { useToast } from './Toast';

const SkillGradeTable: React.FC = () => {
  const rosters = useMemo(() => loadAllRosters(), []);
  const availableClassrooms = useMemo(() => Object.keys(rosters), [rosters]);
  const [classroom, setClassroom] = useState<string>(availableClassrooms.includes('ม.1') ? 'ม.1' : (availableClassrooms[0] || 'ม.1'));
  const [data, setData] = useState<SkillGradeData>(() => loadSkillGradeData('ม.1'));
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [showIsCurriculum, setShowIsCurriculum] = useState<boolean>(true);
  const [showIsKnowledgeBlog, setShowIsKnowledgeBlog] = useState<boolean>(false);
  const [selectedIsStepNo, setSelectedIsStepNo] = useState<number>(1);
  const [showAnswerKey, setShowAnswerKey] = useState<boolean>(false);
  const toast = useToast();
  const isCourse = classroom === 'ม.1' || classroom === 'ม.2' ? IS_CAREER_CURRICULUM[classroom] : null;
  const activeStep: IsStepModule | undefined = isCourse?.steps.find((s) => s.stepNo === selectedIsStepNo) || isCourse?.steps[0];

  const handlePrintIsWorksheet = (step?: IsStepModule, withKey = false) => {
    if (!isCourse) return;
    const html = buildPrintableIsWorksheetHtml(isCourse, step, withKey);
    const win = window.open('', '_blank', 'width=960,height=800');
    if (!win) {
      toast.show('กรุณาอนุญาตให้เปิดหน้าต่างป๊อปอัปเพื่อพิมพ์ใบงาน', 'error');
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    window.setTimeout(() => win.print(), 250);
  };

  const handleSeedIsHomework = async () => {
    if (classroom !== 'ม.1' && classroom !== 'ม.2') return;
    const res = await seedIsAgriAssignmentsForClassroom(classroom);
    if (res.createdCount > 0) {
      toast.show(`สร้างใบงานออนไลน์ IS นวัตกรรมการเกษตร ${res.createdCount} ขั้นตอนเข้าสู่ระบบการบ้านเรียบร้อย`, 'success');
    } else {
      toast.show(`ใบงานออนไลน์ IS นวัตกรรมการเกษตรทั้ง ${res.totalCount} ขั้นตอนมีอยู่ในระบบการบ้านแล้ว`, 'info');
    }
  };

  // โหลด + sync จาก Firebase ตอนเปลี่ยนห้อง
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const remote = await fetchSkillGradeDataFromFirebase(classroom);
        if (cancelled) return;
        if (remote) saveSkillGradeData(remote);
        const local = loadSkillGradeData(classroom);
        const roster = rosters[classroom] || [];
        if (local.students.length === 0 && roster.length > 0) {
          resetSkillStudentsFromRoster(classroom, roster);
        }
        if (!cancelled) {
          setData(loadSkillGradeData(classroom));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [classroom, rosters]);

  // re-render after edits
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void reloadKey;
      setData(loadSkillGradeData(classroom));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [reloadKey, classroom]);

  const refresh = () => setReloadKey((k) => k + 1);

  // ---------- Assignment handlers ----------
  const handleAddAssignment = () => {
    const title = prompt('ชื่อช่องคะแนน (เช่น "ใบงานที่ 1: Logo")');
    if (!title) return;
    const maxRaw = prompt(`คะแนนเต็มของ "${title}":`, '10');
    const max = parseInt(maxRaw || '10', 10);
    if (Number.isNaN(max) || max < 1) { alert('คะแนนเต็มต้องเป็นตัวเลขมากกว่า 0'); return; }
    addSkillAssignment(classroom, title, max);
    refresh();
  };

  const handleRenameAssignment = (a: SkillAssignment) => {
    const title = prompt('ชื่อใหม่:', a.title);
    if (title === null) return;
    const maxRaw = prompt(`คะแนนเต็มของ "${title}":`, String(a.maxScore));
    const max = parseInt(maxRaw || String(a.maxScore), 10);
    renameSkillAssignment(classroom, a.id, { title, maxScore: max });
    refresh();
  };

  const handleDeleteAssignment = (a: SkillAssignment) => {
    if (!confirm(`ลบช่อง "${a.title}"? คะแนนของทุกคนในช่องนี้จะหายไปด้วย`)) return;
    deleteSkillAssignment(classroom, a.id);
    refresh();
  };

  // ---------- Score handlers ----------
  const handleScore = (studentCode: string, assignmentId: string, raw: string) => {
    const n = parseFloat(raw);
    if (Number.isNaN(n)) return;
    updateSkillStudentScore(classroom, studentCode, assignmentId, n);
    refresh();
  };

  const handleP = (studentCode: string, p: Skill) => {
    updateSkillStudentP(classroom, studentCode, p);
    refresh();
  };

  const handleResetStudents = () => {
    if (!confirm(`รีเซ็ตรายชื่อนักเรียนห้อง ${classroom} จาก roster ปัจจุบัน?\n(คะแนน + ช่อง K ที่มีอยู่จะคงไว้)`)) return;
    resetSkillStudentsFromRoster(classroom, rosters[classroom] || []);
    refresh();
    toast.show(`รีเซ็ตรายชื่อห้อง ${classroom} แล้ว`, 'success');
  };

  const handleApplyIsTemplate = () => {
    applyIsSkillTemplate(classroom);
    refresh();
    toast.show(`โหลดแม่แบบคะแนน IS 5 ขั้นตอน สำหรับห้อง ${classroom} เรียบร้อย`, 'success');
  };

  const handleExport = () => {
    const headers = ['เลขที่', 'ชื่อ-สกุล', ...data.assignments.map((a) => `${a.title} (${a.maxScore})`), 'รวม K', 'รวมเต็ม', 'P'];
    let csv = headers.join(',') + '\n';
    [...data.students].sort((a, b) => a.studentNo - b.studentNo).forEach((s) => {
      const { earned, total } = totalSkillK(s, data.assignments);
      const row = [
        s.studentNo,
        `"${s.name}"`,
        ...data.assignments.map((a) => s.scores[a.id] ?? ''),
        earned,
        total,
        s.pAssessed ? s.p : '-',
      ];
      csv += row.join(',') + '\n';
    });
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skill_${classroom}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sortedStudents = useMemo(
    () => [...data.students].sort((a, b) => a.studentNo - b.studentNo),
    [data.students],
  );

  return (
    <div className="skill-grade">
      <div className="filter-row">
        <div className="filter-group">
          <label><Users size={14} /> ห้องเรียน</label>
          <select value={classroom} onChange={(e) => setClassroom(e.target.value)}>
            {availableClassrooms.map((c) => (
              <option key={c} value={c}>{c} ({rosters[c]?.length || 0} คน)</option>
            ))}
          </select>
        </div>
        <button className="btn-secondary" onClick={handleAddAssignment}>
          <Plus size={14} /> เพิ่มช่อง K (ใบงาน/กิจกรรม)
        </button>
        {(classroom === 'ม.1' || classroom === 'ม.2') && (
          <button className="btn-secondary" onClick={handleApplyIsTemplate}>
            <Plus size={14} /> แม่แบบ IS 5 ขั้นตอน
          </button>
        )}
        <button className="btn-secondary" onClick={handleResetStudents}>
          <RefreshCw size={14} /> รีเซ็ตรายชื่อจาก roster
        </button>
        <div style={{ flex: 1 }} />
        <button className="btn-export" onClick={handleExport}>
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div style={{ padding: 12, background: '#f0fdf4', borderRadius: 10, border: '1px dashed #86efac', marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <strong>💼 วิชาทักษะอาชีพ {classroom === 'ม.2' ? '2 (ง 22201)' : classroom === 'ม.1' ? '1 (ง 21201)' : `(${classroom})`} — สอนแบบ IS (Independent Study 5 ขั้นตอน) &amp; ตลาดนัดอาชีพ</strong>
            <br />
            <small style={{ color: '#6b7280' }}>
              ครอบคลุมกระบวนการ IS 5 ขั้นตอน: (1) ตั้งประเด็นคำถาม (2) สืบค้นข้อมูลอาชีพ (3) สรุปองค์ความรู้และสร้างชิ้นงาน (4) สื่อสารนำเสนอ Logo/Poster/Canva (5) บริการสังคมและออกบูธตลาดนัดอาชีพ |
              สามารถเปิดสมุดคะแนน K/P/A และออกเล่ม ปพ.5 ฉบับสมบูรณ์ได้ที่แท็บ &ldquo;สมุดคะแนน ปพ.5&rdquo; เลือกวิชา &ldquo;ทักษะอาชีพ (IS)&rdquo;
            </small>
          </div>
          {isCourse && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowIsCurriculum((v) => !v)}
              >
                <BookOpen size={14} /> {showIsCurriculum ? 'ซ่อนเนื้อหา & ใบงาน IS' : 'ดูเนื้อหา & ใบงาน IS 5 ขั้นตอน'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => handlePrintIsWorksheet(undefined, false)}
                title="พิมพ์ใบงาน IS ทั้ง 5 ขั้นตอนสำหรับแจกนักเรียน"
              >
                <Printer size={14} /> พิมพ์ใบงานครบ 5 ขั้น
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => handlePrintIsWorksheet(undefined, true)}
                title="พิมพ์ใบงาน IS ทั้ง 5 ขั้นตอนพร้อมแนวคำตอบและเฉลยครู"
              >
                <Printer size={14} /> พิมพ์ฉบับเฉลยครู
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => void handleSeedIsHomework()}
                title="สร้างชุดการบ้านออนไลน์ IS นวัตกรรมการเกษตร 5 ขั้นตอนให้นักเรียนส่งงานผ่านเว็บ"
              >
                <Plus size={14} /> ส่งเข้าคลังการบ้านออนไลน์
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowIsKnowledgeBlog((v) => !v)}
                style={{ background: showIsKnowledgeBlog ? '#059669' : undefined, color: showIsKnowledgeBlog ? '#fff' : undefined }}
              >
                <BookOpen size={14} /> {showIsKnowledgeBlog ? 'ซ่อนบล็อกคลังความรู้ IS (I20201)' : '📰 เปิดบล็อกคลังความรู้ IS (คาบ 1–7 + ใบงาน)'}
              </button>
              <Link
                to="/is-blog"
                className="btn-secondary"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <ExternalLink size={14} /> หน้าบล็อก IS เต็มจอ
              </Link>
            </div>
          )}
        </div>
      </div>

      {isCourse && showIsKnowledgeBlog && (
        <div style={{ marginBottom: 16 }}>
          <IsKnowledgeBlog embedded />
        </div>
      )}

      {isCourse && showIsCurriculum && activeStep && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            boxShadow: '0 1px 4px rgba(15, 23, 42, 0.05)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            <div>
              <h4 style={{ margin: 0, color: '#0f172a', fontSize: '1rem' }}>
                📘 คลังเนื้อหา ใบงาน และแบบฝึกหัด {isCourse.courseTitle} ({isCourse.courseCode})
              </h4>
              <small style={{ color: '#475569' }}>
                ตารางเรียน: {isCourse.scheduleText} | รวม {isCourse.totalHours} ชั่วโมง ({isCourse.credit} หน่วยกิต)
              </small>
              <div style={{ marginTop: 4, fontSize: '0.84rem', color: '#15803d', fontWeight: 700 }}>
                {isCourse.themeTitle}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#334155', marginTop: 2 }}>
                💡 <strong>ตัวอย่างหัวข้อโครงงานนวัตกรรมการเกษตร:</strong> {isCourse.projectIdeas.join(' • ')}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', cursor: 'pointer', color: '#047857', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={showAnswerKey}
                  onChange={(e) => setShowAnswerKey(e.target.checked)}
                />
                แสดงแนวคำตอบและเฉลยแบบฝึกหัด
              </label>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => handlePrintIsWorksheet(activeStep, showAnswerKey)}
              >
                <Printer size={13} /> พิมพ์ใบงานขั้นที่ {activeStep.stepNo}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {isCourse.steps.map((step) => {
              const active = step.stepNo === activeStep.stepNo;
              return (
                <button
                  key={step.stepNo}
                  type="button"
                  onClick={() => setSelectedIsStepNo(step.stepNo)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 999,
                    border: active ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    background: active ? '#eff6ff' : '#f8fafc',
                    color: active ? '#1d4ed8' : '#334155',
                    fontWeight: active ? 700 : 500,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  ขั้นที่ {step.stepNo} ({step.isStage}) • {step.maxScore} คะแนน
                </button>
              );
            })}
          </div>

          <div style={{ background: '#f8fafc', borderRadius: 10, padding: 12, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              <div>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: '#dbeafe',
                    color: '#1e40af',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    marginRight: 8,
                  }}
                >
                  {activeStep.indicatorCode} ({activeStep.isStage})
                </span>
                <strong style={{ color: '#0f172a' }}>{activeStep.title}</strong>
                <div style={{ fontSize: '0.83rem', color: '#475569', marginTop: 2 }}>{activeStep.subtitle}</div>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 600 }}>
                ⏱️ {activeStep.hours} ชั่วโมง | 🎯 คะแนนเต็ม {activeStep.maxScore} คะแนน
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <strong style={{ fontSize: '0.85rem', color: '#1e293b' }}>1) เนื้อหาสาระสำคัญประจำขั้น:</strong>
              <ul style={{ margin: '4px 0 0 18px', padding: 0, fontSize: '0.84rem', color: '#334155' }}>
                {activeStep.coreConcepts.map((c, idx) => (
                  <li key={idx} style={{ marginBottom: 2 }}>{c}</li>
                ))}
              </ul>
            </div>

            <div style={{ marginBottom: 10 }}>
              <strong style={{ fontSize: '0.85rem', color: '#1e293b' }}>2) {activeStep.worksheetTitle}:</strong>
              <div style={{ display: 'grid', gap: 8, marginTop: 6 }}>
                {activeStep.worksheetItems.map((item) => (
                  <div
                    key={item.partNo}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: 8,
                      padding: '8px 12px',
                      fontSize: '0.83rem',
                    }}
                  >
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>
                      ตอนที่ {item.partNo}: {item.title}
                    </div>
                    <div style={{ color: '#475569', marginBottom: 4 }}>คำชี้แจง: {item.instruction}</div>
                    <ul style={{ margin: '0 0 0 16px', padding: 0, color: '#1e293b' }}>
                      {item.prompts.map((p, pIdx) => (
                        <li key={pIdx}>{p}</li>
                      ))}
                    </ul>
                    {showAnswerKey && (
                      <div
                        style={{
                          marginTop: 6,
                          padding: '6px 10px',
                          background: '#ecfdf5',
                          borderLeft: '3px solid #10b981',
                          borderRadius: 4,
                          color: '#065f46',
                        }}
                      >
                        <strong>🔑 แนวคำตอบตัวอย่าง:</strong> {item.sampleAnswer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <strong style={{ fontSize: '0.85rem', color: '#1e293b' }}>
                3) แบบฝึกหัดปรนัยวัดความรู้ K ({activeStep.indicatorCode}) จำนวน {activeStep.quiz.length} ข้อ:
              </strong>
              <div style={{ display: 'grid', gap: 6, marginTop: 6 }}>
                {activeStep.quiz.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      padding: '8px 12px',
                      fontSize: '0.82rem',
                    }}
                  >
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>
                      ข้อ {qIdx + 1}. {q.q}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 4, color: '#334155' }}>
                      {q.options.map((opt, oIdx) => {
                        const isCorrect = showAnswerKey && oIdx === q.answer;
                        return (
                          <span
                            key={oIdx}
                            style={{
                              padding: '2px 8px',
                              borderRadius: 6,
                              background: isCorrect ? '#dcfce7' : '#f1f5f9',
                              color: isCorrect ? '#166534' : '#334155',
                              fontWeight: isCorrect ? 700 : 400,
                            }}
                          >
                            {['ก', 'ข', 'ค', 'ง'][oIdx]}) {opt}
                          </span>
                        );
                      })}
                    </div>
                    {showAnswerKey && (
                      <div style={{ marginTop: 4, color: '#047857', fontSize: '0.78rem' }}>
                        ✓ เฉลยข้อ {['ก', 'ข', 'ค', 'ง'][q.answer]} — {q.explain}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <RefreshCw size={32} style={{ color: '#6366f1', animation: 'spin 1s linear infinite' }} />
          <p>กำลังโหลดคะแนน...</p>
        </div>
      ) : sortedStudents.length === 0 ? (
        <div className="empty-state-card">
          <p>ยังไม่มีรายชื่อ — กด "รีเซ็ตรายชื่อจาก roster"</p>
        </div>
      ) : (
        <div className="att-table-wrap" style={{ overflowX: 'auto' }}>
          <table className="att-table" style={{ minWidth: 700 }}>
            <thead>
              <tr>
                <th style={{ width: 60, textAlign: 'center', position: 'sticky', left: 0, background: '#f9fafb', zIndex: 1 }}>เลขที่</th>
                <th style={{ position: 'sticky', left: 60, background: '#f9fafb', zIndex: 1, minWidth: 180 }}>ชื่อ-สกุล</th>
                {data.assignments.map((a) => (
                  <th key={a.id} style={{ textAlign: 'center', minWidth: 100 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <span
                        style={{ cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted' }}
                        onClick={() => handleRenameAssignment(a)}
                        title="คลิกเพื่อแก้ชื่อ/คะแนนเต็ม"
                      >
                        {a.title}
                      </span>
                      <small style={{ color: '#6b7280', fontSize: '0.7rem' }}>(เต็ม {a.maxScore})</small>
                      <button
                        className="link-btn danger"
                        onClick={() => handleDeleteAssignment(a)}
                        style={{ padding: 0, fontSize: '0.7rem' }}
                      >
                        <Trash2 size={11} /> ลบช่อง
                      </button>
                    </div>
                  </th>
                ))}
                <th style={{ textAlign: 'center', background: '#fef3c7', minWidth: 90 }}>รวม K</th>
                <th style={{ textAlign: 'center', minWidth: 110 }}>P</th>
                <th style={{ textAlign: 'center', width: 90 }}>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {sortedStudents.map((s) => {
                const { earned, total } = totalSkillK(s, data.assignments);
                const pct = total > 0 ? Math.round((earned / total) * 100) : 0;
                return (
                  <tr key={s.studentCode}>
                    <td style={{ textAlign: 'center', position: 'sticky', left: 0, background: 'white', zIndex: 1 }}>{s.studentNo}</td>
                    <td style={{ position: 'sticky', left: 60, background: 'white', zIndex: 1 }}>{s.emoji} {s.name}</td>
                    {data.assignments.map((a) => (
                      <td key={a.id} style={{ textAlign: 'center' }}>
                        <input
                          type="number"
                          value={s.scores[a.id] ?? ''}
                          min={0}
                          max={a.maxScore}
                          onChange={(e) => handleScore(s.studentCode, a.id, e.target.value)}
                          placeholder="—"
                          style={{
                            width: 70, padding: '4px 6px', textAlign: 'center',
                            border: '1px solid #d1d5db', borderRadius: 6, fontFamily: 'inherit',
                          }}
                        />
                      </td>
                    ))}
                    <td style={{ textAlign: 'center', background: '#fef3c7', fontWeight: 700 }}>
                      {total > 0 ? (
                        <>
                          {earned}/{total}
                          <br />
                          <small style={{ color: '#6b7280', fontSize: '0.7rem', fontWeight: 400 }}>({pct}%)</small>
                        </>
                      ) : (
                        <small style={{ color: '#9ca3af' }}>—</small>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <select
                        value={s.p}
                        onChange={(e) => handleP(s.studentCode, e.target.value as Skill)}
                        style={{
                          padding: '4px 10px',
                          border: '1px solid #d1d5db', borderRadius: 6, fontFamily: 'inherit',
                          background: s.pAssessed ? '#dcfce7' : 'white',
                        }}
                      >
                        <option value="พอใช้">พอใช้</option>
                        <option value="ปานกลาง">ปานกลาง</option>
                        <option value="ดี">ดี</option>
                      </select>
                    </td>
                    <td style={{ textAlign: 'center', fontSize: '0.78rem' }}>
                      {s.pAssessed || earned > 0 ? (
                        <span style={{ color: '#16a34a' }}><Save size={12} /></span>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SkillGradeTable;
