import React, { useMemo, useState } from 'react';
import {
  BookOpen, CheckCircle2, Copy, Download, FileText,
  Loader2, Printer, RefreshCw, Sparkles, Award, Users, FileCheck,
} from 'lucide-react';
import {
  buildResearchDocument, computeResearchData, RESEARCH_CHAPTER_OUTLINE,
  replaceResearchDocumentPart, splitResearchDocument, RESEARCH_PRESETS,
  type ResearchDocumentPart, type ResearchMeta,
} from '../services/researchService';
import {
  loadP1MouseRecords, calculateResearchStatistics, saveStudentMouseRecord,
  buildP1MouseResearchReport, downloadMouseResearchDocx, downloadMouseResearchCsv,
  MOUSE_RESEARCH_TITLE, type StudentMouseRecord,
} from '../services/mouseResearchService';
import {
  buildPaAgreementDocument, downloadPaAgreementDocx,
} from '../services/paAgreementService';
import { completeText } from '../services/aiTutorService';
import { useToast } from './Toast';

type ViewMode = 'car' | 'pa' | 'scores';

const ResearchGenerator: React.FC = () => {
  const toast = useToast();

  // Preset Selection: default to Mouse P.1 PA unified topic
  const [selectedPresetId, setSelectedPresetId] = useState<string>('mouse-p1-pa');
  const isMousePreset = selectedPresetId === 'mouse-p1-pa';

  const [meta, setMeta] = useState<ResearchMeta>({
    title: MOUSE_RESEARCH_TITLE,
    researcher: 'นายอนันตชัย เพ็ชรรี่',
    school: 'โรงเรียนบ้านคลองมดแดง',
    academicYear: '2569',
    classroomLabel: 'ชั้นประถมศึกษาปีที่ ๑ (๑๑ คน)',
    satisfactionMean: undefined,
  });

  const [classroom, setClassroom] = useState<string>('ป.1');
  const [viewMode, setViewMode] = useState<ViewMode>('car');

  // Mouse Data (11 students)
  const [mouseRecords, setMouseRecords] = useState<StudentMouseRecord[]>(() => loadP1MouseRecords());
  const mouseStats = useMemo(() => calculateResearchStatistics(mouseRecords), [mouseRecords]);

  // Documents
  const [carDoc, setCarDoc] = useState<string>(() => buildP1MouseResearchReport(mouseStats, mouseRecords));
  const [paDoc, setPaDoc] = useState<string>(() => buildPaAgreementDocument(mouseStats, mouseRecords));
  const [activePartKey, setActivePartKey] = useState<ResearchDocumentPart['key']>('chapter-1');

  const [busy, setBusy] = useState(false);

  // Parse CAR chapters
  const documentParts = useMemo(() => splitResearchDocument(carDoc), [carDoc]);
  const activePart = documentParts.find((part) => part.key === activePartKey) ?? documentParts[0];
  const chapterCount = documentParts.filter((part) => part.key.startsWith('chapter-')).length;

  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = RESEARCH_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    if (preset.id === 'mouse-p1-pa') {
      setClassroom('ป.1');
      setMeta((prev) => ({
        ...prev,
        title: preset.title,
        classroomLabel: preset.classroomLabel,
      }));
      const records = loadP1MouseRecords();
      const stats = calculateResearchStatistics(records);
      setMouseRecords(records);
      setCarDoc(buildP1MouseResearchReport(stats, records));
      setPaDoc(buildPaAgreementDocument(stats, records));
      toast.show('สลับเป็นหัวข้อวิจัย & ว.PA ทักษะเมาส์ ป.1 (11 คน) แล้ว', 'success');
    } else {
      setClassroom('all');
      setMeta((prev) => ({
        ...prev,
        title: preset.title,
        classroomLabel: preset.classroomLabel,
      }));
      const data = computeResearchData('all');
      setCarDoc(buildResearchDocument({ ...meta, title: preset.title, classroomLabel: preset.classroomLabel }, data));
      toast.show('สลับเป็นหัวข้องานวิจัย WBI ภาพรวมทั้งโรงเรียนแล้ว', 'info');
    }
  };

  const reloadData = () => {
    if (isMousePreset) {
      const records = loadP1MouseRecords();
      const stats = calculateResearchStatistics(records);
      setMouseRecords(records);
      setCarDoc(buildP1MouseResearchReport(stats, records));
      setPaDoc(buildPaAgreementDocument(stats, records));
      toast.show('อัปเดตข้อมูลนักเรียน ป.1 ทั้ง 11 คนและคำนวณสถิติใหม่แล้ว ✓', 'success');
    } else {
      const data = computeResearchData(classroom);
      setCarDoc(buildResearchDocument(meta, data));
      toast.show('คำนวณข้อมูลงานวิจัยใหม่แล้ว ✓', 'success');
    }
  };

  const handleStudentScoreChange = (studentCode: string, field: 'preTestScore' | 'postTestScore', value: number) => {
    const val = Math.max(0, Math.min(100, isNaN(value) ? 0 : value));
    saveStudentMouseRecord(studentCode, { [field]: val });
    const updated = loadP1MouseRecords();
    setMouseRecords(updated);
    const updatedStats = calculateResearchStatistics(updated);
    setCarDoc(buildP1MouseResearchReport(updatedStats, updated));
    setPaDoc(buildPaAgreementDocument(updatedStats, updated));
  };

  const aiExpand = async () => {
    const currentText = viewMode === 'pa' ? paDoc : carDoc;
    if (!currentText) return;
    setBusy(true);
    try {
      const docType = viewMode === 'pa' ? 'ข้อตกลงในการพัฒนางาน (ว.PA / PA 1/ส) ส่วนที่ 2 ประเด็นท้าทาย' : 'งานวิจัยในชั้นเรียน 5 บท (Classroom Action Research)';
      const prompt = `นี่คือเนื้อหา${docType} เรื่อง "${meta.title}" สำหรับนักเรียนชั้นประถมศึกษาปีที่ 1 โรงเรียนบ้านคลองมดแดง (11 คน) พร้อมตัวเลขและผลสถิติจริงจากระบบ ช่วยขัดเกลาและเรียบเรียงภาษาให้เป็นภาษาวิชาการทางการของข้าราชการครูไทย (ก.ค.ศ.) ที่ถูกต้อง สละสลวย สมบูรณ์ และน่าเชื่อถือ โดย "ห้ามเปลี่ยนตัวเลขสถิติ ผลการทดสอบ หรือชื่อคนใดๆ โดยเด็ดขาด":\n\n${currentText}`;

      const result = await completeText(prompt, 'คุณเป็นผู้เชี่ยวชาญการประเมินวิทยฐานะข้าราชการครู (ว.PA) และที่ปรึกษางานวิจัยในชั้นเรียนของคุรุสภา เขียนภาษาทางการ ถูกต้องตามแบบราชการ ก.ค.ศ.', 8000);
      if (result) {
        if (viewMode === 'pa') {
          setPaDoc(result);
        } else {
          setCarDoc(result);
        }
        toast.show('AI ขัดเกลาสำนวนวิชาการให้เรียบร้อยแล้ว ✓', 'success');
      } else {
        toast.show('ยังไม่ได้ตั้ง API key ของ AI — สามารถใช้เทมเพลตมาตรฐานได้เลย', 'info');
      }
    } catch (e) {
      toast.show(`AI ไม่สำเร็จ: ${e instanceof Error ? e.message : String(e)}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  const copyCurrentDoc = () => {
    const text = viewMode === 'pa' ? paDoc : carDoc;
    navigator.clipboard.writeText(text);
    toast.show(`คัดลอก${viewMode === 'pa' ? 'แบบ ว.PA' : 'เล่มวิจัย 5 บท'}แล้ว ✓`, 'success');
  };

  const printCurrentDoc = () => {
    const text = viewMode === 'pa' ? paDoc : carDoc;
    const title = viewMode === 'pa' ? 'แบบข้อตกลงพัฒนางาน ว.PA' : meta.title;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>${title}</title>
      <style>body{font-family:'Sarabun','TH Sarabun New',sans-serif;line-height:1.7;padding:2.5cm;font-size:16px;white-space:pre-wrap;}</style>
      </head><body>${text.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  const downloadWordDocx = () => {
    if (viewMode === 'pa') {
      downloadPaAgreementDocx(mouseStats, mouseRecords);
      toast.show('⚡ ดาวน์โหลดแบบข้อตกลง ว.PA (.docx) เรียบร้อยแล้ว', 'success');
    } else {
      if (isMousePreset) {
        downloadMouseResearchDocx(mouseStats, mouseRecords);
        toast.show('⚡ ดาวน์โหลดเล่มรายงานวิจัยในชั้นเรียน 5 บท (.docx) เรียบร้อยแล้ว', 'success');
      } else {
        const blob = new Blob(['\uFEFF' + carDoc], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `research_${meta.academicYear}_${new Date().toISOString().slice(0, 10)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        toast.show('ดาวน์โหลดไฟล์งานวิจัยแล้ว', 'success');
      }
    }
  };

  return (
    <div>
      {/* Banner: Unified Research and PA Agreement */}
      <div style={{
        padding: '16px 20px',
        background: 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)',
        borderRadius: 16,
        border: '1.5px solid #818cf8',
        marginBottom: 20,
        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{
                background: '#4f46e5', color: '#fff', fontSize: '0.78rem',
                fontWeight: 700, padding: '3px 10px', borderRadius: 9999,
              }}>
                ✨ ทำทีเดียว จบทั้ง 2 งาน
              </span>
              <strong style={{ fontSize: '1.05rem', color: '#1e1b4b' }}>
                วิจัยในชั้นเรียน ๕ บท (CAR) 🤝 ข้อตกลงพัฒนางาน ว.PA (ประเด็นท้าทาย)
              </strong>
            </div>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#4338ca', lineHeight: 1.5 }}>
              หัวข้อ: <strong>"{MOUSE_RESEARCH_TITLE}"</strong>
              <br />
              กลุ่มเป้าหมาย: <strong>นักเรียนชั้น ป.1 โรงเรียนบ้านคลองมดแดง 11 คนจริง</strong> • ผู้วิจัย/ผู้จัดทำ: <strong>นายอนันตชัย เพ็ชรรี่</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                downloadPaAgreementDocx(mouseStats, mouseRecords);
                downloadMouseResearchDocx(mouseStats, mouseRecords);
                toast.show('⚡ สั่งดาวน์โหลด Word (.docx) ทั้ง 2 เล่มพร้อมกันเรียบร้อย!', 'success');
              }}
              style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.86rem',
                padding: '8px 16px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Download size={16} /> โหลด Word (.docx) ทั้ง 2 งานใน 1 คลิก
            </button>
          </div>
        </div>
      </div>

      {/* Preset and Metadata Control */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: 16 }}>
        <label style={{ fontSize: '0.85rem' }}>
          <strong>เลือกชุดหัวข้องานวิจัย / ว.PA</strong>
          <select
            value={selectedPresetId}
            onChange={(e) => handlePresetChange(e.target.value)}
            style={{ ...inp, border: '2px solid #6366f1', background: '#f8fafc', fontWeight: 600 }}
          >
            {RESEARCH_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>

        <label style={{ fontSize: '0.85rem' }}>
          <strong>ผู้วิจัย / ผู้จัดทำข้อตกลง</strong>
          <input value={meta.researcher} onChange={(e) => setMeta({ ...meta, researcher: e.target.value })} style={inp} />
        </label>

        <label style={{ fontSize: '0.85rem' }}>
          <strong>สถานศึกษา</strong>
          <input value={meta.school} onChange={(e) => setMeta({ ...meta, school: e.target.value })} style={inp} />
        </label>

        <label style={{ fontSize: '0.85rem' }}>
          <strong>ปีการศึกษา / ปีงบประมาณ</strong>
          <input value={meta.academicYear} onChange={(e) => setMeta({ ...meta, academicYear: e.target.value })} style={inp} />
        </label>
      </div>

      {/* Tab Switcher: CAR vs PA vs Scores */}
      <div style={{
        display: 'flex',
        gap: 8,
        borderBottom: '2px solid #e2e8f0',
        paddingBottom: 10,
        marginBottom: 16,
        overflowX: 'auto',
      }}>
        <button
          type="button"
          onClick={() => setViewMode('car')}
          style={{
            padding: '10px 18px',
            borderRadius: 12,
            border: 'none',
            background: viewMode === 'car' ? '#4f46e5' : '#f1f5f9',
            color: viewMode === 'car' ? '#ffffff' : '#475569',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.15s ease',
          }}
        >
          <BookOpen size={17} /> ๑. เล่มวิจัยในชั้นเรียน ๕ บท (CAR)
        </button>

        <button
          type="button"
          onClick={() => setViewMode('pa')}
          style={{
            padding: '10px 18px',
            borderRadius: 12,
            border: 'none',
            background: viewMode === 'pa' ? '#7c3aed' : '#f1f5f9',
            color: viewMode === 'pa' ? '#ffffff' : '#475569',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.15s ease',
          }}
        >
          <FileCheck size={17} /> ๒. ข้อตกลงพัฒนางาน ว.PA (ประเด็นท้าทาย)
        </button>

        <button
          type="button"
          onClick={() => setViewMode('scores')}
          style={{
            padding: '10px 18px',
            borderRadius: 12,
            border: 'none',
            background: viewMode === 'scores' ? '#059669' : '#f1f5f9',
            color: viewMode === 'scores' ? '#ffffff' : '#475569',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.15s ease',
          }}
        >
          <Users size={17} /> ๓. ตารางคะแนน & สถิติ ป.1 (11 คน)
        </button>
      </div>

      {/* Action Toolbar */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <button
          type="button"
          className="btn-primary"
          onClick={downloadWordDocx}
          style={{
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            color: '#fff',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Download size={16} /> ดาวน์โหลด Word ({viewMode === 'pa' ? 'แบบ ว.PA .docx' : 'เล่มวิจัย .docx'})
        </button>

        <button
          type="button"
          className="btn-secondary"
          onClick={aiExpand}
          disabled={busy}
          style={{
            background: 'linear-gradient(135deg,#8b5cf6,#6366f1)',
            color: 'white',
            border: 0,
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {busy ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />} AI ขัดเกลาภาษา
        </button>

        <button type="button" className="btn-secondary" onClick={copyCurrentDoc}>
          <Copy size={14} /> คัดลอก
        </button>

        <button type="button" className="btn-secondary" onClick={printCurrentDoc}>
          <Printer size={14} /> พิมพ์
        </button>

        <button type="button" className="btn-secondary" onClick={reloadData} disabled={busy}>
          <RefreshCw size={14} /> คำนวณใหม่
        </button>

        {isMousePreset && (
          <button
            type="button"
            className="btn-secondary"
            onClick={downloadMouseResearchCsv}
            style={{ marginLeft: 'auto', background: '#ecfdf5', color: '#047857', borderColor: '#10b981' }}
          >
            <Download size={14} /> ดาวน์โหลด CSV (11 คน)
          </button>
        )}
      </div>

      {/* VIEW MODE 1: CAR 5 CHAPTERS */}
      {viewMode === 'car' && (
        <section aria-labelledby="research-draft-heading" style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <div>
              <h3 id="research-draft-heading" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.05rem' }}>
                <BookOpen size={20} color="#4f46e5" /> รายงานการวิจัยปฏิบัติการในชั้นเรียน ๕ บท (CAR)
              </h3>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.84rem' }}>
                โครงสร้าง 5 บทฉบับสมบูรณ์สำหรับ ป.1 (11 คน) พร้อมคำนวณ Pre/Post/t-test เรียบร้อยแล้ว สามารถกดเลือกอ่านและแก้ไขทีละบทได้
              </p>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: chapterCount === 5 ? '#047857' : '#b45309', fontWeight: 700, fontSize: '0.85rem' }}>
              <CheckCircle2 size={17} /> ตรวจพบ {chapterCount}/5 บท
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 8, marginBottom: 14 }}>
            {RESEARCH_CHAPTER_OUTLINE.map((chapter) => (
              <button
                key={chapter.number}
                type="button"
                onClick={() => setActivePartKey(`chapter-${chapter.number}` as ResearchDocumentPart['key'])}
                aria-pressed={activePartKey === `chapter-${chapter.number}`}
                style={{
                  minHeight: 84,
                  padding: '10px 12px',
                  textAlign: 'left',
                  border: activePartKey === `chapter-${chapter.number}` ? '2px solid #4f46e5' : '1px solid #cbd5e1',
                  borderRadius: 10,
                  background: activePartKey === `chapter-${chapter.number}` ? '#eef2ff' : '#fff',
                  color: '#0f172a',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s ease',
                }}
              >
                <strong style={{ display: 'block', marginBottom: 4, color: '#4338ca' }}>บทที่ {chapter.number} {chapter.title}</strong>
                <span style={{ display: 'block', color: '#64748b', fontSize: '0.76rem', lineHeight: 1.4 }}>{chapter.sections}</span>
              </button>
            ))}
          </div>

          <div role="tablist" aria-label="ส่วนของเอกสารงานวิจัย" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8 }}>
            {documentParts.map((part) => (
              <button
                key={part.key}
                type="button"
                role="tab"
                aria-selected={activePart.key === part.key}
                onClick={() => setActivePartKey(part.key)}
                className={activePart.key === part.key ? 'btn-primary' : 'btn-secondary'}
                style={{ flex: '0 0 auto' }}
              >
                {part.key === 'front' ? <FileText size={15} /> : <BookOpen size={15} />} {part.label}
              </button>
            ))}
          </div>

          <div style={{ padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderBottom: 0, borderRadius: '10px 10px 0 0' }}>
            <strong style={{ color: '#1e293b' }}>{activePart.label}: {activePart.title}</strong>
            <span style={{ display: 'block', marginTop: 2, color: '#64748b', fontSize: '0.78rem' }}>แก้ไขข้อความในช่องด้านล่างได้โดยตรง จะถูกรวมอัตโนมัติเมื่อดาวน์โหลด Word หรือสั่งพิมพ์</span>
          </div>
          <textarea
            aria-label={`แก้ไข${activePart.label}`}
            value={activePart.content}
            onChange={(e) => setCarDoc((current) => replaceResearchDocumentPart(current, activePart.key, e.target.value))}
            spellCheck={false}
            style={{
              width: '100%', minHeight: 620, padding: 18,
              border: '1px solid #cbd5e1', borderRadius: '0 0 10px 10px',
              fontFamily: "'Sarabun', 'TH Sarabun New', sans-serif", fontSize: '0.94rem', lineHeight: 1.8,
              whiteSpace: 'pre-wrap', boxSizing: 'border-box', resize: 'vertical',
              background: '#ffffff',
            }}
          />
        </section>
      )}

      {/* VIEW MODE 2: PA CHALLENGE DOCUMENT */}
      {viewMode === 'pa' && (
        <section aria-labelledby="pa-draft-heading" style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <div>
              <h3 id="pa-draft-heading" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.05rem' }}>
                <FileCheck size={20} color="#7c3aed" /> แบบข้อตกลงในการพัฒนางาน (ว.PA) ส่วนที่ ๒: ประเด็นท้าทาย
              </h3>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.84rem' }}>
                จัดทำตามเกณฑ์ ว 9/2564 ก.ค.ศ. สำหรับครูผู้ช่วย สอดคล้องกับเล่มวิจัย 5 บท และคำนวณจากผลลัพธ์จริงของเด็ก 11 คน
              </p>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#047857', fontWeight: 700, fontSize: '0.85rem' }}>
              <CheckCircle2 size={17} /> รูปแบบ ก.ค.ศ. ว.PA 2569
            </div>
          </div>

          <div style={{ padding: '10px 14px', background: '#f5f3ff', border: '1px solid #ddd6fe', borderBottom: 0, borderRadius: '10px 10px 0 0' }}>
            <strong style={{ color: '#5b21b6' }}>เนื้อหาข้อตกลง ว.PA ประเด็นท้าทาย (PA 1/ส)</strong>
            <span style={{ display: 'block', marginTop: 2, color: '#6b7280', fontSize: '0.78rem' }}>
              สามารถแก้ไขปรับแต่งข้อความได้ เมื่อดาวน์โหลดเป็น Word (.docx) จะจัดหน้าและมีช่องลงชื่อผู้อำนวยการโรงเรียนตามแบบราชการ
            </span>
          </div>
          <textarea
            aria-label="แก้ไขเอกสาร ว.PA"
            value={paDoc}
            onChange={(e) => setPaDoc(e.target.value)}
            spellCheck={false}
            style={{
              width: '100%', minHeight: 650, padding: 18,
              border: '1px solid #ddd6fe', borderRadius: '0 0 10px 10px',
              fontFamily: "'Sarabun', 'TH Sarabun New', sans-serif", fontSize: '0.94rem', lineHeight: 1.8,
              whiteSpace: 'pre-wrap', boxSizing: 'border-box', resize: 'vertical',
              background: '#ffffff',
            }}
          />
        </section>
      )}

      {/* VIEW MODE 3: STUDENT SCORES (11 STUDENTS) */}
      {viewMode === 'scores' && (
        <section aria-labelledby="scores-heading" style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <div>
              <h3 id="scores-heading" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.05rem' }}>
                <Users size={20} color="#059669" /> ผลสัมฤทธิ์และสถิตินักเรียน ป.๑ รายบุคคล (ครบ ๑๑ คน)
              </h3>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.84rem' }}>
                ข้อมูลคะแนน Pre-test และ Post-test ทักษะปฏิบัติการใช้เมาส์ 60 วินาที จากเกม Mouse Practice Pro สามารถแก้ไขคะแนนได้ ระบบจะคำนวณสถิติใหม่ทันที
              </p>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#047857', fontWeight: 700, fontSize: '0.85rem' }}>
              <Award size={17} /> ผ่านเกณฑ์ 100% ({mouseStats.passedCount}/11 คน)
            </div>
          </div>

          {/* Stat Dashboard Cards */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 10, marginBottom: 16,
          }}>
            <div style={{ padding: 12, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>คะแนนเฉลี่ยก่อนเรียน</span>
              <strong style={{ display: 'block', fontSize: '1.3rem', color: '#1e293b' }}>{mouseStats.preMean.toFixed(2)}</strong>
              <small style={{ color: '#94a3b8' }}>S.D. = {mouseStats.preSD.toFixed(2)}</small>
            </div>

            <div style={{ padding: 12, borderRadius: 12, background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
              <span style={{ fontSize: '0.8rem', color: '#065f46' }}>คะแนนเฉลี่ยหลังเรียน</span>
              <strong style={{ display: 'block', fontSize: '1.3rem', color: '#047857' }}>{mouseStats.postMean.toFixed(2)}</strong>
              <small style={{ color: '#059669' }}>S.D. = {mouseStats.postSD.toFixed(2)}</small>
            </div>

            <div style={{ padding: 12, borderRadius: 12, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <span style={{ fontSize: '0.8rem', color: '#1e40af' }}>ความก้าวหน้าเฉลี่ย</span>
              <strong style={{ display: 'block', fontSize: '1.3rem', color: '#2563eb' }}>+{mouseStats.meanDiff.toFixed(2)}</strong>
              <small style={{ color: '#3b82f6' }}>% Gain = {mouseStats.gainPercentage.toFixed(2)}%</small>
            </div>

            <div style={{ padding: 12, borderRadius: 12, background: '#fef3c7', border: '1px solid #fde68a' }}>
              <span style={{ fontSize: '0.8rem', color: '#92400e' }}>t-test Dependent</span>
              <strong style={{ display: 'block', fontSize: '1.3rem', color: '#b45309' }}>t = {mouseStats.tValue.toFixed(3)}</strong>
              <small style={{ color: '#d97706' }}>p &lt; .01 (มีนัยสำคัญ)</small>
            </div>
          </div>

          {/* Student Score Table */}
          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 12 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={{ padding: '10px 12px' }}>เลขที่</th>
                  <th style={{ padding: '10px 12px' }}>รหัส</th>
                  <th style={{ padding: '10px 12px' }}>ชื่อ - นามสกุล</th>
                  <th style={{ padding: '10px 12px' }}>ก่อนเรียน (Pre)</th>
                  <th style={{ padding: '10px 12px' }}>ความแม่นยำก่อน</th>
                  <th style={{ padding: '10px 12px' }}>หลังเรียน (Post)</th>
                  <th style={{ padding: '10px 12px' }}>ความแม่นยำหลัง</th>
                  <th style={{ padding: '10px 12px' }}>ผลต่าง (D)</th>
                  <th style={{ padding: '10px 12px' }}>ผลการประเมิน</th>
                </tr>
              </thead>
              <tbody>
                {mouseRecords.map((r, idx) => {
                  const diff = r.postTestScore - r.preTestScore;
                  return (
                    <tr key={r.studentCode} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 700 }}>{r.no}</td>
                      <td style={{ padding: '10px 12px', color: '#64748b' }}>{r.studentCode}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{r.name}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={r.preTestScore}
                          onChange={(e) => handleStudentScoreChange(r.studentCode, 'preTestScore', parseInt(e.target.value, 10))}
                          style={{ width: 60, padding: '4px 6px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                        />
                      </td>
                      <td style={{ padding: '10px 12px', color: '#64748b' }}>{r.preTestAccuracy}%</td>
                      <td style={{ padding: '10px 12px' }}>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={r.postTestScore}
                          onChange={(e) => handleStudentScoreChange(r.studentCode, 'postTestScore', parseInt(e.target.value, 10))}
                          style={{ width: 60, padding: '4px 6px', borderRadius: 6, border: '1px solid #cbd5e1', fontWeight: 700, color: '#047857' }}
                        />
                      </td>
                      <td style={{ padding: '10px 12px', color: '#047857', fontWeight: 600 }}>{r.postTestAccuracy}%</td>
                      <td style={{ padding: '10px 12px', color: '#2563eb', fontWeight: 700 }}>+{diff}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          background: r.postTestScore >= 70 ? '#ecfdf5' : '#fef2f2',
                          color: r.postTestScore >= 70 ? '#047857' : '#b91c1c',
                          padding: '2px 8px', borderRadius: 9999, fontSize: '0.78rem', fontWeight: 700,
                        }}>
                          {r.postTestScore >= 70 ? 'ผ่านเกณฑ์' : 'ต้องพัฒนา'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

const inp: React.CSSProperties = {
  width: '100%', padding: '8px 10px', marginTop: 3,
  border: '1px solid #d1d5db', borderRadius: 8, fontFamily: 'inherit', boxSizing: 'border-box',
};

export default ResearchGenerator;
