import React, { useEffect, useMemo, useState } from 'react';
import { Download, Users, RefreshCw, FileSpreadsheet, BookOpen, Calculator, Printer, Plus, Trash2 } from 'lucide-react';
import {
  loadGrades, initClassroom, updateStudentScore, updateFinalExam, updateMidtermExam,
  computeBreakdown, computeGrade, getIndicators, examMaxScores,
  syncAllFromProgressAsync, downloadCSV, fetchClassroomFromFirebase,
  getLinkedUnits, diagnoseProgress, getSubjectsForClassroom, saveGrades,
  SCORE_WEIGHT, loadManualAssessments, loadManualAssessmentScores,
  createManualAssessment, deleteManualAssessment, updateManualAssessmentScore,
  applyManualAssessmentsToGrades, COURSE_TEACHER_NAME,
  getGradingPeriodLabel, getExamPolicyLabel,
  seedUnit1ScoresForAllClasses,
} from '../services/gradeService';
import { findGrade } from '../data/curriculum';
import { Link as LinkIcon, Info } from 'lucide-react';
import type { Skill, Subject, ManualAssessment, AssessmentCategory } from '../services/gradeService';
import { allClassrooms2569 } from '../data/students2569';
import { loadAllRosters } from '../services/rosterService';
import { useToast } from './Toast';

const students2569 = loadAllRosters();

const GradeBook: React.FC = () => {
  const [classroom, setClassroom] = useState<string>('ป.1');
  const [subject, setSubject] = useState<Subject>('main');
  const [loading, setLoading] = useState(false);
  const [showLinkage, setShowLinkage] = useState(false);
  const [printableMode, setPrintableMode] = useState(false);
  const [draftAssessment, setDraftAssessment] = useState({
    title: '',
    indicatorId: '',
    category: 'k' as AssessmentCategory,
    maxScore: 10,
  });
  const [reloadKey, setReloadKey] = useState(0);
  const [loadedGradebookKey, setLoadedGradebookKey] = useState('');
  const toast = useToast();
  const gradebookKey = `${classroom}_${subject}`;
  const gradebookReady = loadedGradebookKey === gradebookKey;

  const handlePrint = () => {
    setPrintableMode(true);
    setTimeout(() => {
      window.print();
      setPrintableMode(false);
    }, 100);
  };

  const subjectsAvailable = useMemo(() => getSubjectsForClassroom(classroom), [classroom]);
  const indicators = useMemo(() => getIndicators(classroom, subject), [classroom, subject]);

  // เมื่อเปลี่ยนห้อง — เลือกวิชาแรกอัตโนมัติ (main สำหรับ ป., cs สำหรับ ม.)
  const [prevClassroom, setPrevClassroom] = useState(classroom);
  if (classroom !== prevClassroom) {
    setPrevClassroom(classroom);
    const subs = getSubjectsForClassroom(classroom);
    if (subs.length > 0 && !subs.find((s) => s.id === subject)) {
      setSubject(subs[0].id);
    }
  }

  // Synchronize draft assessment indicator when indicators change
  const [prevIndicators, setPrevIndicators] = useState(indicators);
  if (indicators !== prevIndicators) {
    setPrevIndicators(indicators);
    if (indicators.length > 0 && !indicators.some((ind) => ind.id === draftAssessment.indicatorId)) {
      setDraftAssessment((prev) => ({ ...prev, indicatorId: indicators[0].id }));
    }
  }

  // Auto-seed P/A defaults for unit 1 (one-time per browser) — รันครั้งเดียวเมื่อเข้าหน้านี้ครั้งแรก
  useEffect(() => {
    const FLAG = 'krujames_seeded_unit1_pa_v1';
    if (localStorage.getItem(FLAG)) return;
    try {
      const res = seedUnit1ScoresForAllClasses('ปานกลาง', true);
      localStorage.setItem(FLAG, JSON.stringify({ at: Date.now(), result: res }));
      const total = res.reduce((acc, r) => acc + r.students * r.indicators, 0);
      if (total > 0) {
        toast.show(`✅ ใส่ค่า P/A เริ่มต้น "บท 1" ให้ ${res.length} ห้อง×วิชา (รวม ${total} ช่อง) แล้ว`, 'success');
        setReloadKey((k) => k + 1);
      }
    } catch (e) {
      console.warn('Auto-seed unit 1 P/A failed:', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grades = useMemo(() => {
    void reloadKey;
    return loadGrades(classroom, subject);
  }, [classroom, subject, reloadKey]);

  const manualAssessments = useMemo(() => {
    void reloadKey;
    return loadManualAssessments(classroom, subject);
  }, [classroom, subject, reloadKey]);

  const manualScores = useMemo(() => {
    void reloadKey;
    return loadManualAssessmentScores(classroom, subject);
  }, [classroom, subject, reloadKey]);

  const reload = () => {
    setReloadKey((k) => k + 1);
  };

  useEffect(() => {
    let cancelled = false;

    const loadRemoteFirst = async () => {
      setLoading(true);
      setLoadedGradebookKey('');
      try {
        const remote = await fetchClassroomFromFirebase(classroom, subject);
        if (cancelled) return;

        if (remote && remote.length > 0) {
          saveGrades(classroom, remote, subject);
        } else if (loadGrades(classroom, subject).length === 0 && students2569[classroom]) {
          initClassroom(classroom, subject);
        }

        // Pull the latest lesson/game progress into K/P/A whenever the teacher opens a gradebook.
        try {
          await syncAllFromProgressAsync(classroom, subject);
        } catch (syncError) {
          console.debug('Auto progress sync skipped', syncError);
        }
        if (cancelled) return;

        setLoadedGradebookKey(gradebookKey);
        setReloadKey((k) => k + 1);
      } catch (e) {
        if (!cancelled && loadGrades(classroom, subject).length === 0 && students2569[classroom]) {
          initClassroom(classroom, subject);
          setReloadKey((k) => k + 1);
        }
        if (!cancelled) setLoadedGradebookKey(gradebookKey);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadRemoteFirst();
    return () => {
      cancelled = true;
    };
  }, [gradebookKey]);

  const handleK = (studentCode: string, indicatorId: string, value: string) => {
    const ind = indicators.find((i) => i.id === indicatorId);
    const max = ind?.maxScore || 15;
    const k = Math.max(0, Math.min(max, parseInt(value) || 0));
    updateStudentScore(classroom, studentCode, indicatorId, { k, maxK: max }, subject);
    reload();
  };

  const handleP = (studentCode: string, indicatorId: string, p: Skill) => {
    updateStudentScore(classroom, studentCode, indicatorId, { p }, subject);
    reload();
  };

  const handleA = (studentCode: string, indicatorId: string, a: boolean) => {
    updateStudentScore(classroom, studentCode, indicatorId, { a }, subject);
    reload();
  };

  const examMax = useMemo(() => examMaxScores(classroom), [classroom]);

  const handleFinal = (studentCode: string, value: string) => {
    const v = Math.max(0, Math.min(examMax.final, parseInt(value) || 0));
    updateFinalExam(classroom, studentCode, v, subject);
    reload();
  };

  const handleMidterm = (studentCode: string, value: string) => {
    const v = Math.max(0, Math.min(examMax.midterm, parseInt(value) || 0));
    updateMidtermExam(classroom, studentCode, v, subject);
    reload();
  };

  const handleSync = async () => {
    setLoading(true);
    try {
      const r = await syncAllFromProgressAsync(classroom, subject);
      reload();
      let msg = `🔄 ผลการนำเข้าคะแนนจากเว็บ — ${classroom}\n\n`;
      msg += `☁️ ดึง progress จาก Firebase: ${r.firebaseProgressDownloaded} คน\n`;
      if (!r.firebaseProgressAvailable) {
        msg += `⚠️ Firebase ยังไม่ได้ตั้งค่า ระบบใช้ข้อมูลในเครื่องนี้เท่านั้น\n`;
      } else if (r.firebaseProgressError) {
        msg += `⚠️ ดึง Firebase ไม่สำเร็จ: ${r.firebaseProgressError}\n`;
      }
      msg += `✅ อัปเดตได้: ${r.studentsUpdated} คน (${r.indicatorsUpdated} รายการตัวชี้วัด)\n`;
      msg += `   • Match จากชื่อตรง: ${r.matchedByExact} คน\n`;
      msg += `   • Match จากเลขที่: ${r.matchedByNumber} คน\n`;
      msg += `   • Match จากชื่อบางส่วน: ${r.matchedByName} คน\n\n`;
      if (r.notFound.length > 0) {
        msg += `⚠️ ไม่พบ progress data: ${r.notFound.length} คน\n`;
        msg += `   (นักเรียนเหล่านี้ยังไม่ได้ login + เรียนในเว็บ)\n`;
        if (r.notFound.length <= 10) {
          r.notFound.forEach((n) => (msg += `   • เลข ${n.no}: ${n.name}\n`));
        }
      }
      toast.show(msg, r.studentsUpdated > 0 ? 'success' : 'info');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.show(`นำเข้า K/P/A ไม่สำเร็จ: ${msg}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDiagnose = () => {
    const d = diagnoseProgress(classroom);
    let msg = `🔍 Diagnostic — ห้อง ${classroom}\n\n`;
    msg += `จำนวน progress key ทั้งหมดในเครื่อง: ${d.totalKeys}\n`;
    msg += `ที่อยู่ในห้อง ${classroom}: ${d.classroomKeys.length} key\n\n`;
    if (d.classroomKeys.length > 0) {
      msg += `รายละเอียด progress data ที่พบในห้องนี้:\n`;
      d.classroomKeys.forEach((k) => {
        const parts = k.split('_');
        msg += `   • เลข ${parts[1]}: ${parts.slice(2).join('_')}\n`;
      });
    } else {
      msg += `❌ ไม่พบ progress data ของห้องนี้เลย\n`;
      msg += `แปลว่ายังไม่มีนักเรียนในห้องนี้ login + เรียนในเว็บ\n\n`;
      msg += `วิธีทดสอบ:\n`;
      msg += `1. Logout admin\n`;
      msg += `2. ไป /login → กรอกชื่อ + ห้อง ${classroom} + เลขที่\n`;
      msg += `3. ไปคอร์สเรียน → เปิดบทเรียน → ดูสไลด์ + ทำควิซ\n`;
      msg += `4. กลับมา admin → กดปุ่ม "นำเข้า K/P/A จากเว็บ"`;
    }
    toast.show(msg, 'info');
  };

  const handleReset = () => {
    if (!confirm(`ลบคะแนนทั้งห้อง ${classroom} แล้วเริ่มใหม่จากรายชื่อ 2569?`)) return;
    initClassroom(classroom, subject);
    reload();
  };

  const handleFetchFirebase = async () => {
    setLoading(true);
    const remote = await fetchClassroomFromFirebase(classroom, subject);
    if (remote) {
      saveGrades(classroom, remote, subject);
      reload();
      toast.show('ดึงข้อมูลจาก Firebase สำเร็จ ✓', 'success');
    } else {
      toast.show('ไม่พบข้อมูลสำหรับห้องเรียนนี้บน Firebase', 'error');
    }
    setLoading(false);
  };

  const handleCreateManualAssessment = () => {
    const title = draftAssessment.title.trim();
    const indicatorId = draftAssessment.indicatorId || indicators[0]?.id;
    if (!title) {
      toast.show('กรุณาตั้งชื่องานหรือใบงานก่อน', 'error');
      return;
    }
    if (!indicatorId) {
      toast.show('ยังไม่มีตัวชี้วัดให้ผูกคะแนน', 'error');
      return;
    }
    createManualAssessment(classroom, subject, {
      title,
      indicatorId,
      category: draftAssessment.category,
      maxScore: Math.max(1, draftAssessment.maxScore || 1),
    });
    setDraftAssessment((prev) => ({ ...prev, title: '' }));
    reload();
    toast.show('เพิ่มงาน/ใบงานนอกเว็บแล้ว กรอกคะแนนแล้วกดคำนวณเข้า K/P ได้เลย', 'success');
  };

  const handleManualScore = (assessment: ManualAssessment, studentCode: string, raw: string) => {
    const score = raw.trim() === '' ? null : Number(raw);
    updateManualAssessmentScore(classroom, subject, assessment.id, studentCode, score);
    reload();
  };

  const handleApplyManualAssessments = () => {
    const result = applyManualAssessmentsToGrades(classroom, subject);
    reload();
    toast.show(
      `คำนวณงานนอกเว็บเข้า K/P แล้ว: นักเรียน ${result.studentsUpdated} คน, ตัวชี้วัด ${result.indicatorsUpdated} รายการ`,
      'success'
    );
  };

  const handleDeleteManualAssessment = (assessmentId: string) => {
    if (!confirm('ลบงานนี้และคะแนนที่กรอกไว้ทั้งหมด?')) return;
    deleteManualAssessment(classroom, subject, assessmentId);
    applyManualAssessmentsToGrades(classroom, subject);
    reload();
  };

  return (
    <div className={`gradebook ${printableMode ? 'print-mode' : ''}`}>
      {/* Printable header */}
      <div className="gb-print-header">
        <h1>โรงเรียนบ้านคลองมดแดง</h1>
        <p>รายงานผลคะแนนเก็บวิชาเทคโนโลยี (K/P/A) • {getGradingPeriodLabel(classroom)}</p>
        <p style={{ fontWeight: 'bold', marginTop: '0.25rem' }}>
          ชั้น {classroom} • วิชา{subjectsAvailable.find((s) => s.id === subject)?.title || ''} ({subjectsAvailable.find((s) => s.id === subject)?.code || ''})
        </p>
        <p style={{ marginTop: '0.25rem' }}>ครูประจำวิชา: {COURSE_TEACHER_NAME}</p>
      </div>
      {/* Toolbar */}
      <div className="gb-toolbar">
        <div className="filter-group">
          <label><Users size={14} /> ชั้นเรียน (ปีการศึกษา 2569)</label>
          <select value={classroom} onChange={(e) => setClassroom(e.target.value)}>
            {allClassrooms2569.map((c) => (
              <option key={c} value={c}>
                {c} ({students2569[c]?.length || 0} คน)
              </option>
            ))}
          </select>
        </div>
        <button className="btn-secondary" onClick={handleSync} disabled={loading}>
          <RefreshCw size={14} /> {loading ? 'กำลังดึงคะแนน...' : 'นำเข้า K/P/A จากเว็บ (Firebase)'}
        </button>
        <button className="btn-secondary" onClick={() => setShowLinkage(!showLinkage)}>
          <LinkIcon size={14} /> {showLinkage ? 'ซ่อน' : 'ดู'} การเชื่อมโยงตัวชี้วัด↔หน่วย
        </button>
        <button className="btn-secondary" onClick={handleDiagnose}>
          <Info size={14} /> Diagnose (ตรวจปัญหา)
        </button>
        <button className="btn-secondary" onClick={handleFetchFirebase} disabled={loading}>
          <BookOpen size={14} /> ดึงจาก Firebase
        </button>
        <button className="btn-secondary" onClick={handleReset}>
          <RefreshCw size={14} /> รีเซ็ตจากรายชื่อ
        </button>
        <button
          className="btn-secondary"
          onClick={() => {
            if (!confirm('ใส่ P (ปานกลาง) และ A (ผ่าน) ให้ทุกตัวชี้วัด "บท 1" ของทุกห้อง/ทุกวิชาที่สอนจริง?\n\n* P ที่เคยตั้งเองจะถูกทับด้วย "ปานกลาง"\n* A จะถูกตั้งเป็นผ่านทั้งหมด\n* คะแนน K ไม่กระทบ')) return;
            const res = seedUnit1ScoresForAllClasses('ปานกลาง', true);
            const total = res.reduce((acc, r) => acc + r.students * r.indicators, 0);
            const lines = res.map((r) => `• ${r.classroom} (${r.subject}): ${r.students} คน × ${r.indicators} ตัวชี้วัด`).join('\n');
            toast.show(`เซ็ต P/A บท 1 สำเร็จ — รวม ${total} ช่อง\n${lines}`, 'success');
            setReloadKey((k) => k + 1);
          }}
          style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 0 }}
          title="ใส่ค่าเริ่มต้น P=ปานกลาง, A=ผ่าน ให้บท 1 ของทุกชั้น/ทุกวิชา"
        >
          ⚡ ใส่ P/A บท 1 ทุกห้อง
        </button>
        <button className="btn-secondary" onClick={handlePrint}>
          <Printer size={14} /> พิมพ์รายงานคะแนน
        </button>
        <div style={{ flex: 1 }} />
        <button className="btn-export" onClick={() => downloadCSV(classroom, subject)}>
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Subject tabs — แสดงเฉพาะห้องที่มีหลายวิชา (ม.1-3) */}
      {subjectsAvailable.length > 1 && (
        <div className="subject-tabs">
          <span className="st-label">📚 เลือกวิชา:</span>
          {subjectsAvailable.map((s) => (
            <button
              key={s.id}
              className={`subject-tab ${subject === s.id ? 'active' : ''}`}
              onClick={() => setSubject(s.id)}
            >
              <span style={{ fontSize: '1.1rem' }}>{s.emoji}</span>
              <strong>{classroom} {s.title}</strong>
              <small>({s.code})</small>
            </button>
          ))}
        </div>
      )}

      {/* Info */}
      {!gradebookReady ? (
        <div className="empty-state-card">
          <RefreshCw size={48} style={{ color: '#6366f1' }} />
          <h3>กำลังดึงคะแนนจาก Firebase...</h3>
          <p>รอสักครู่ ระบบกำลังโหลดคะแนนจริงของห้อง {classroom}</p>
        </div>
      ) : indicators.length === 0 ? (
        <div className="empty-state-card">
          <FileSpreadsheet size={48} style={{ color: '#6b7280' }} />
          <h3>ยังไม่มีตัวชี้วัดสำหรับชั้น {classroom}</h3>
          <p>(ระดับอนุบาล ไม่มีตัวชี้วัด ว 4.2 ในระบบนี้)</p>
        </div>
      ) : grades.length === 0 ? (
        <div className="empty-state-card">
          <Users size={48} style={{ color: '#6366f1' }} />
          <h3>ยังไม่ได้นำเข้ารายชื่อห้องนี้</h3>
          <button className="btn-primary" onClick={() => { initClassroom(classroom, subject); reload(); }}>
            นำเข้ารายชื่อนักเรียน 2569
          </button>
        </div>
      ) : (
        <>
          {/* Help banner — แสดงเฉพาะตอนคะแนนยังเป็น 0 หมด */}
          {grades.every((g) =>
            Object.values(g.indicators).every((s) => s.k === 0)
          ) && (
            <div className="gb-help-banner">
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 24 }}>💡</span>
                <div>
                  <strong>ทำไมคะแนนยังเป็น 0 หมด?</strong>
                  <p style={{ margin: '4px 0 8px', fontSize: '0.88rem', lineHeight: 1.6 }}>
                    คะแนน K (และ P, A) จะอัปเดตอัตโนมัติเมื่อนักเรียนทำกิจกรรมในเว็บ
                    (อ่านสไลด์ ดูวิดีโอ เล่นเกม ทำควิซ) เนื่องจากตอนนี้ยังเป็น 0 ทั้งหมด
                    แปลว่ายังไม่มีนักเรียนในห้องนี้ login เข้ามาเรียน
                  </p>
                  <strong style={{ fontSize: '0.88rem' }}>วิธีแก้:</strong>
                  <ol style={{ margin: '4px 0 0', paddingLeft: 20, fontSize: '0.85rem', lineHeight: 1.7 }}>
                    <li>ให้นักเรียนเข้าเว็บ → กดปุ่ม <em>"เข้าสู่ระบบ"</em> → กรอกชื่อ + ห้อง + เลขที่ <strong style={{ color: '#dc2626' }}>(ตามรายชื่อในตารางนี้)</strong></li>
                    <li>นักเรียนเลือก <em>"คอร์สเรียน"</em> → ทำกิจกรรม + แบบทดสอบ</li>
                    <li>ครูกลับมาที่นี่ → กดปุ่ม <strong>🔄 "นำเข้า K/P/A จากเว็บ"</strong> → คะแนนจะปรากฏ!</li>
                    <li>ถ้ายังไม่ขึ้น → กดปุ่ม <strong>ℹ️ "Diagnose"</strong> เพื่อดูว่ามี progress data ของใครบ้าง</li>
                  </ol>
                  <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
                    💡 ครูสามารถกรอก K, P, A เองได้โดยตรงในตาราง — ระบบ auto-sync เป็นแค่ตัวช่วย
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Manual/outside-web assignments */}
          <div className="gb-manual">
            <div className="gb-manual-head">
              <div>
                <h4>งาน/ใบงานนอกเว็บที่นำมาคิดคะแนน</h4>
                <p>
                  ใช้กับใบงานกระดาษ งานในห้อง งานกลุ่ม หรือคะแนนจากกิจกรรมนอกเว็บ
                  เลือกตัวชี้วัดและประเภท K/P แล้วระบบจะหารคะแนนตามคะแนนเต็มของงานนั้น
                </p>
              </div>
              <button
                className="btn-primary"
                onClick={handleApplyManualAssessments}
                disabled={manualAssessments.length === 0}
              >
                <Calculator size={14} /> คำนวณเข้า K/P
              </button>
            </div>

            <div className="gb-manual-form">
              <input
                type="text"
                value={draftAssessment.title}
                onChange={(e) => setDraftAssessment((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="ชื่องาน เช่น ใบงานที่ 1 ลำดับขั้นตอน"
              />
              <select
                value={draftAssessment.indicatorId}
                onChange={(e) => setDraftAssessment((prev) => ({ ...prev, indicatorId: e.target.value }))}
              >
                {indicators.map((ind) => (
                  <option key={ind.id} value={ind.id}>
                    {ind.code} — {ind.title}
                  </option>
                ))}
              </select>
              <select
                value={draftAssessment.category}
                onChange={(e) => setDraftAssessment((prev) => ({ ...prev, category: e.target.value as AssessmentCategory }))}
              >
                <option value="k">K ความรู้</option>
                <option value="p">P ทักษะ/ปฏิบัติ</option>
              </select>
              <input
                type="number"
                min={1}
                value={draftAssessment.maxScore}
                onChange={(e) => setDraftAssessment((prev) => ({ ...prev, maxScore: parseInt(e.target.value) || 1 }))}
                aria-label="คะแนนเต็มของงาน"
              />
              <button className="btn-secondary" onClick={handleCreateManualAssessment}>
                <Plus size={14} /> เพิ่มงาน
              </button>
            </div>

            {manualAssessments.length === 0 ? (
              <div className="gb-manual-empty">
                ยังไม่มีงานนอกเว็บ ครูสามารถเพิ่มใบงานหรือภาระงาน แล้วกรอกคะแนนเพื่อคิดเข้า K/P ของตัวชี้วัดได้
              </div>
            ) : (
              <div className="gb-manual-table-wrap">
                <table className="gb-manual-table">
                  <thead>
                    <tr>
                      <th className="ma-student-col">เลขที่</th>
                      <th className="ma-name-col">ชื่อ-สกุล</th>
                      {manualAssessments.map((assessment) => {
                        const indicator = indicators.find((ind) => ind.id === assessment.indicatorId);
                        return (
                          <th key={assessment.id}>
                            <div className="ma-assessment-head">
                              <strong>{assessment.title}</strong>
                              <small>
                                {indicator?.code || 'ตัวชี้วัด'} • {assessment.category.toUpperCase()} • เต็ม {assessment.maxScore}
                              </small>
                              <button
                                type="button"
                                className="ma-delete"
                                onClick={() => handleDeleteManualAssessment(assessment.id)}
                                title="ลบงานนี้"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map((g) => (
                      <tr key={g.studentCode}>
                        <td className="text-center ma-student-col">{g.studentNo}</td>
                        <td className="ma-name-col">{g.name}</td>
                        {manualAssessments.map((assessment) => (
                          <td key={assessment.id} className="text-center">
                            <input
                              type="number"
                              min={0}
                              max={assessment.maxScore}
                              className="ma-score-input"
                              value={manualScores[assessment.id]?.[g.studentCode] ?? ''}
                              onChange={(e) => handleManualScore(assessment, g.studentCode, e.target.value)}
                              placeholder="-"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Linkage panel */}
          {showLinkage && (
            <div className="gb-linkage">
              <h4>🔗 การเชื่อมโยงตัวชี้วัด ↔ หน่วยการเรียนในเว็บ</h4>
              <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '0 0 1rem' }}>
                เมื่อนักเรียนทำกิจกรรมในหน่วยที่เชื่อมโยง → คะแนน K/P/A ของตัวชี้วัดนั้นจะอัปเดตอัตโนมัติ
              </p>
              <div className="gb-linkage-grid">
                {getLinkedUnits(classroom, subject).map(({ indicator, units }) => (
                  <div key={indicator.id} className="linkage-card">
                    <div className="lc-head">
                      <span className="lc-code">{indicator.code}</span>
                      <span className="lc-max">เต็ม {indicator.maxScore}</span>
                    </div>
                    <div className="lc-title">{indicator.title}</div>
                    {units.length === 0 ? (
                      <div className="lc-empty">⚠ ยังไม่มีหน่วยที่เชื่อม</div>
                    ) : (
                      <div className="lc-units">
                        {units.map(({ gradeId, unitNo }) => {
                          const g = findGrade(gradeId);
                          const unit = g?.units?.find((u: { no: number }) => u.no === unitNo);
                          return (
                            <a
                              key={`${gradeId}_${unitNo}`}
                              href={`/curriculum/${gradeId}/unit/${unitNo}`}
                              target="_blank"
                              rel="noreferrer"
                              className="lc-unit-pill"
                            >
                              {g?.emoji} หน่วย {unitNo}: {unit?.title}
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Indicator legend */}
          <div className="gb-indicators">
            <strong>ตัวชี้วัดของชั้น {classroom}:</strong>
            <div className="ind-list">
              {indicators.map((ind) => (
                <span key={ind.id} className="ind-pill" title={ind.title}>
                  {ind.code}
                </span>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="gb-table-wrap">
            <table className="gb-table">
              <thead>
                <tr>
                  <th rowSpan={2} className="sticky-col">เลขที่</th>
                  <th rowSpan={2} className="sticky-col" style={{ minWidth: 200 }}>ชื่อ-สกุล</th>
                  {indicators.map((ind) => {
                    const weightPer = SCORE_WEIGHT.COLLECTED / indicators.length;
                    return (
                      <th
                        key={ind.id}
                        colSpan={3}
                        className="ind-header"
                        title={`${ind.title}\n— น้ำหนักในคะแนนเก็บ: ${weightPer.toFixed(1)} คะแนน`}
                      >
                        {ind.code}
                        <br/><small style={{ opacity: 0.85 }}>(เต็ม {weightPer.toFixed(1)})</small>
                      </th>
                    );
                  })}
                  <th rowSpan={2} title="คะแนนเก็บรวมจากทุกตัวชี้วัด">
                    คะแนนเก็บ<br/><small>(เต็ม {SCORE_WEIGHT.COLLECTED})</small>
                  </th>
                  {examMax.midterm > 0 && (
                    <th rowSpan={2}><Calculator size={12}/> กลางภาค<br/><small>(เต็ม {examMax.midterm})</small></th>
                  )}
                  <th rowSpan={2}><Calculator size={12}/> ปลายภาค<br/><small>(เต็ม {examMax.final})</small></th>
                  <th rowSpan={2} className="total-col">รวม<br/><small>(เต็ม 100)</small></th>
                  <th rowSpan={2} className="grade-col">เกรด</th>
                </tr>
                <tr>
                  {indicators.map((ind) => (
                    <React.Fragment key={ind.id}>
                      <th className="sub-h">K<br/><small>({ind.maxScore})</small></th>
                      <th className="sub-h">P</th>
                      <th className="sub-h">A</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grades.map((g) => {
                  const breakdown = computeBreakdown(g, classroom, subject);
                  const grade = computeGrade(g, classroom, subject);
                  return (
                    <tr key={g.studentCode}>
                      <td className="text-center sticky-col">{g.studentNo}</td>
                      <td className="sticky-col">
                        <span style={{ marginRight: 4 }}>{g.emoji}</span>
                        {g.name}
                      </td>
                      {indicators.map((ind) => {
                        const s = g.indicators[ind.id] || { k: 0, maxK: ind.maxScore, p: 'ปานกลาง' as Skill, a: true, updatedAt: 0 };
                        return (
                          <React.Fragment key={ind.id}>
                            <td className="text-center">
                              <input
                                type="number"
                                className="k-input"
                                value={s.k}
                                min={0}
                                max={ind.maxScore}
                                onChange={(e) => handleK(g.studentCode, ind.id, e.target.value)}
                              />
                            </td>
                            <td className="text-center">
                              <select
                                className={`p-select skill-${s.p}`}
                                value={s.p}
                                onChange={(e) => handleP(g.studentCode, ind.id, e.target.value as Skill)}
                              >
                                <option value="พอใช้">พอใช้</option>
                                <option value="ปานกลาง">ปานกลาง</option>
                                <option value="ดี">ดี</option>
                              </select>
                            </td>
                            <td className="text-center">
                              <input
                                type="checkbox"
                                checked={s.a}
                                onChange={(e) => handleA(g.studentCode, ind.id, e.target.checked)}
                              />
                            </td>
                          </React.Fragment>
                        );
                      })}
                      <td
                        className="text-center"
                        title={`K=${breakdown.k}/${(SCORE_WEIGHT.COLLECTED * SCORE_WEIGHT.K_RATIO).toFixed(1)} • P=${breakdown.p}/${(SCORE_WEIGHT.COLLECTED * SCORE_WEIGHT.P_RATIO).toFixed(1)} • A=${breakdown.a}/${(SCORE_WEIGHT.COLLECTED * SCORE_WEIGHT.A_RATIO).toFixed(1)}`}
                        style={{ background: '#fef9c3', fontWeight: 700 }}
                      >
                        {breakdown.collected.toFixed(1)}
                      </td>
                      {examMax.midterm > 0 && (
                        <td className="text-center">
                          <input
                            type="number"
                            className="k-input"
                            value={g.midtermExam || 0}
                            min={0}
                            max={examMax.midterm}
                            onChange={(e) => handleMidterm(g.studentCode, e.target.value)}
                          />
                        </td>
                      )}
                      <td className="text-center">
                        <input
                          type="number"
                          className="k-input"
                          value={g.finalExam || 0}
                          min={0}
                          max={examMax.final}
                          onChange={(e) => handleFinal(g.studentCode, e.target.value)}
                        />
                      </td>
                      <td className="text-center total-col"><strong>{breakdown.total.toFixed(1)}</strong></td>
                      <td className={`text-center grade-col grade-${grade.replace('.', '_')}`}>
                        <strong>{grade}</strong>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="gb-summary">
            <div>
              <strong>นักเรียนทั้งหมด:</strong> {grades.length} คน
            </div>
            <div>
              <strong>คะแนนเฉลี่ย:</strong>{' '}
              {(grades.reduce((s, g) => s + computeBreakdown(g, classroom, subject).total, 0) / grades.length).toFixed(1)} / 100
            </div>
            <div>
              <strong>เกรดเฉลี่ย:</strong>{' '}
              {(grades.reduce((s, g) => s + parseFloat(computeGrade(g, classroom, subject)), 0) / grades.length).toFixed(2)}
            </div>
            <div>
              <strong>ผ่านเกณฑ์ (≥ 50/100):</strong>{' '}
              {grades.filter((g) => parseFloat(computeGrade(g, classroom, subject)) >= 1).length} / {grades.length}
            </div>
          </div>

          {/* คำอธิบายโครงสร้างคะแนน */}
          <div className="score-structure">
            <strong>📐 โครงสร้างคะแนน (รวม 100):</strong>
            <span className="ss-pill ss-period">{getGradingPeriodLabel(classroom)}</span>
            <span className="ss-pill ss-collected">
              คะแนนเก็บ {SCORE_WEIGHT.COLLECTED}
              <small style={{ marginLeft: 4, opacity: 0.7 }}>
                ÷ {indicators.length} ตัวชี้วัด = {(SCORE_WEIGHT.COLLECTED / indicators.length).toFixed(1)}/ตัว
              </small>
            </span>
            <span style={{ color: '#9ca3af' }}>=</span>
            <span className="ss-pill ss-k">K {Math.round(SCORE_WEIGHT.K_RATIO * 100)}%</span>
            <span style={{ color: '#9ca3af' }}>+</span>
            <span className="ss-pill ss-p">P {Math.round(SCORE_WEIGHT.P_RATIO * 100)}%</span>
            <span style={{ color: '#9ca3af' }}>+</span>
            <span className="ss-pill ss-a">A {Math.round(SCORE_WEIGHT.A_RATIO * 100)}%</span>
            <span style={{ color: '#9ca3af' }}>+</span>
            {examMax.midterm > 0 && (
              <>
                <span className="ss-pill ss-exam">กลางภาค {examMax.midterm}</span>
                <span style={{ color: '#9ca3af' }}>+</span>
              </>
            )}
            <span className="ss-pill ss-exam">ปลายภาค {examMax.final}</span>
          </div>
        </>
      )}

      <div className="gb-help">
        <h4>💡 ระบบคำนวณ K / P / A อัตโนมัติ (กดปุ่ม "นำเข้า K/P/A จากเว็บ")</h4>
        <ul>
          <li>
            <strong>K = ความรู้</strong> — คำนวณจาก<em>คะแนนควิซเฉลี่ย</em>ของทุกหน่วยที่เกี่ยวกับตัวชี้วัดนี้
            (ตัวชี้วัด 1 อัน อาจมีหลายหน่วยเรียน → เอามาเฉลี่ย × คะแนนเต็ม)
          </li>
          <li>
            <strong>P = ทักษะ</strong> — คำนวณจาก<em>การลงมือทำ</em>: เกม×3 + วิดีโอ×2 + สไลด์/บทความ×1
            <br/>≥ 15 คะแนน = <span style={{ color: '#16a34a', fontWeight: 700 }}>ดี</span> •
            ≥ 5 = <span style={{ color: '#d97706', fontWeight: 700 }}>ปานกลาง</span> •
            น้อยกว่า = <span style={{ color: '#dc2626', fontWeight: 700 }}>พอใช้</span>
          </li>
          <li>
            <strong>A = จิตพิสัย</strong> — เก็บจาก<em>การเข้าเรียนตรงเวลา</em>ตามตารางสอน
            (ต้องเข้าหน่วยที่เกี่ยวกับตัวชี้วัดนี้ ≥ <strong>2 วันที่ต่างกัน</strong> ในเวลาเรียน)
            <br/>👉 ตั้งตารางสอนได้ที่ Tab "จัดการตารางสอน"
          </li>
          <li><strong>ครูแก้ค่าเองได้</strong> — กรอก K, เลือก P, ติ๊ก A ในตารางได้ตลอด (ระบบ auto-sync เป็นแค่ตัวช่วย)</li>
          <li><strong>งานนอกเว็บ/ใบงาน</strong> — เพิ่มงาน เลือกตัวชี้วัด เลือก K หรือ P กรอกคะแนน แล้วกด “คำนวณเข้า K/P” ระบบจะหารคะแนนตามคะแนนเต็มของงานนั้น</li>
          <li><strong>AI ป.1-6</strong> — คิดเป็นคะแนนเสริมในตัวชี้วัดที่เกี่ยวข้องเมื่อครูกด “นำเข้า K/P/A จากเว็บ” ไม่แยกเป็นวิชาหลักอีกหนึ่งเกรด</li>
          <li><strong>โครงสร้างสอบ</strong> — {getExamPolicyLabel(classroom)}</li>
          <li><strong>เกรด</strong>: คำนวณอัตโนมัติตามเกณฑ์ไทย (≥80%=4, ≥75%=3.5, ≥70%=3, ≥65%=2.5...)</li>
          <li><strong>Export CSV</strong>: ส่งออกตามรูปแบบไฟล์ Excel เดิม</li>
        </ul>
      </div>

      {/* Printable signatures */}
      <div className="gb-print-signatures">
        <div className="gb-sig-block">
          <div className="gb-sig-line"></div>
          <p>{COURSE_TEACHER_NAME}</p>
          <small>ครูประจำวิชา</small>
        </div>
        <div className="gb-sig-block">
          <div className="gb-sig-line"></div>
          <p>ลงชื่อ.........................................................</p>
          <small>ผู้บริหารโรงเรียน / หัวหน้าฝ่ายวิชาการ</small>
        </div>
      </div>
    </div>
  );
};

export default GradeBook;
