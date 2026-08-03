import React, { useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, Copy, Database, Download, FileText, Loader2, Printer, RefreshCw, Sparkles } from 'lucide-react';
import {
  buildResearchDocument, computeResearchData, RESEARCH_CHAPTER_OUTLINE,
  replaceResearchDocumentPart, splitResearchDocument,
} from '../services/researchService';
import type { ResearchDocumentPart, ResearchMeta } from '../services/researchService';
import { completeText } from '../services/aiTutorService';
import { fetchAllProgressFromFirebase } from '../services/progressService';
import { fetchAllSurveys, computeSurveyStats } from '../services/satisfactionSurveyService';
import { loadAllRosters } from '../services/rosterService';
import { useToast } from './Toast';

const DEFAULT_RESEARCH_META: ResearchMeta = {
  title: 'การพัฒนาการเรียนการสอนผ่านเว็บเทคโนโลยีร่วมกับเกมมิฟิเคชันในรายวิชาวิทยาการคำนวณ',
  researcher: 'นายอนันตชัย เพ็ชรรี่',
  school: 'โรงเรียนบ้านคลองมดแดง',
  academicYear: '2569',
  classroomLabel: 'ทุกชั้น (ป.1-ม.3)',
  satisfactionMean: undefined,
};

const waitFor = <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => (
  Promise.race([
    promise,
    new Promise<T>((_, reject) => window.setTimeout(() => reject(new Error('sync-timeout')), timeoutMs)),
  ])
);

const ResearchGenerator: React.FC = () => {
  const rosters = useMemo(() => loadAllRosters(), []);
  const classrooms = useMemo(() => Object.keys(rosters), [rosters]);
  const toast = useToast();

  const [meta, setMeta] = useState<ResearchMeta>(DEFAULT_RESEARCH_META);
  const [classroom, setClassroom] = useState<string>('all');
  const initialDraft = useMemo(() => {
    const data = computeResearchData('all');
    return { document: buildResearchDocument(DEFAULT_RESEARCH_META, data), n: data.n };
  }, []);
  const [doc, setDoc] = useState<string>(initialDraft.document);
  const [activePartKey, setActivePartKey] = useState<ResearchDocumentPart['key']>('chapter-1');
  const [busy, setBusy] = useState(false);
  const [genBusy, setGenBusy] = useState(false);
  const [dataN, setDataN] = useState<number | null>(initialDraft.n);
  const documentParts = useMemo(() => splitResearchDocument(doc), [doc]);
  const activePart = documentParts.find((part) => part.key === activePartKey) ?? documentParts[0];
  const chapterCount = documentParts.filter((part) => part.key.startsWith('chapter-')).length;

  const generate = async () => {
    setGenBusy(true);
    const label = classroom === 'all' ? 'ทุกชั้น (ป.1-ม.3)' : classroom;
    const localMeta = { ...meta, classroomLabel: label };
    const localData = computeResearchData(classroom);
    setDataN(localData.n);
    setDoc(buildResearchDocument(localMeta, localData));
    try {
      const [, surveys] = await waitFor(Promise.all([
        fetchAllProgressFromFirebase(),
        fetchAllSurveys(),
      ]), 12000);
      const surveyStats = computeSurveyStats(surveys, classroom);
      const data = computeResearchData(classroom);
      setDataN(data.n);
      if (data.n === 0 && data.activeStudents === 0) {
        toast.show('ยังไม่มีคะแนน/การใช้งานในระบบสำหรับชั้นที่เลือก', 'info');
      }
      const document = buildResearchDocument(localMeta, data, surveyStats);
      setDoc(document);
      const satNote = surveyStats.n > 0 ? ` · แบบสอบถาม ${surveyStats.n} คน` : '';
      toast.show(`สร้างเอกสารแล้ว — ผลสัมฤทธิ์ ${data.n} คน · เข้าใช้ ${data.activeStudents} คน${satNote}`, 'success');
    } catch (error) {
      console.warn('[ResearchGenerator] Firebase sync unavailable; using cached research data.', error);
      toast.show('แสดงงานวิจัย 5 บทจากข้อมูลในเครื่องแล้ว · Firebase ยังไม่ตอบสนอง แต่เอกสารไม่หาย', 'info');
    } finally {
      setGenBusy(false);
    }
  };

  const aiExpand = async () => {
    if (!doc) { toast.show('กด"สร้างเอกสาร"ก่อน', 'info'); return; }
    setBusy(true);
    try {
      const prompt = `นี่คือโครงร่างงานวิจัยการศึกษาเรื่องการเรียนการสอนผ่านเว็บเทคโนโลยีร่วมกับเกมมิฟิเคชัน (WBI + Gamification + ADDIE) พร้อมตัวเลขผลจริงจากระบบ ช่วยเรียบเรียงให้เป็นภาษาวิชาการที่สละสลวยและสมบูรณ์ขึ้น โดย "ห้ามเปลี่ยนตัวเลขสถิติใดๆ" คงหัวข้อทุกบทไว้ ขยายความบทที่ 1 (ความสำคัญ) เน้นบทบาทของเกมมิฟิเคชันต่อแรงจูงใจ และบทที่ 5 (อภิปรายผล) ให้อ้างอิงทฤษฎีแรงจูงใจและงานวิจัยเกมมิฟิเคชัน:\n\n${doc}`;
    const result = await completeText(prompt, 'คุณเป็นผู้ช่วยเขียนวิทยานิพนธ์/งานวิจัยการศึกษาภาษาไทย เขียนเป็นทางการ ถูกต้องตามระเบียบวิธีวิจัย', 8000);
      if (result) {
        setDoc(result);
        toast.show('AI เรียบเรียงเอกสารให้แล้ว ✓', 'success');
      } else {
        toast.show('ยังไม่ได้ตั้ง API key ของ AI — ไปตั้งที่ปุ่มครู AI ก่อน (ใช้ template ปกติได้เลย)', 'info');
      }
    } catch (e) {
      toast.show(`AI ไม่สำเร็จ: ${e instanceof Error ? e.message : String(e)}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(doc);
    toast.show('คัดลอกเอกสารแล้ว ✓', 'success');
  };

  const download = () => {
    const blob = new Blob(['﻿' + doc], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research_${meta.academicYear}_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const print = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>${meta.title}</title>
      <style>body{font-family:'Sarabun','TH Sarabun New',sans-serif;line-height:1.7;padding:2.5cm;font-size:16px;white-space:pre-wrap;}</style>
      </head><body>${doc.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  return (
    <div>
      <div style={{ padding: 12, background: '#eef2ff', borderRadius: 10, border: '1px dashed #a5b4fc', marginBottom: 16, fontSize: '0.88rem' }}>
        <strong>ต้นฉบับงานวิจัยในชั้นเรียน WBI + ADDIE แสดงอยู่ด้านล่างครบ 5 บทแล้ว</strong> ระบบใช้ผล K/P/A และร่องรอยการเรียนที่มีอยู่มาคำนวณสถิติ โดยไม่แต่งตัวเลขที่ยังไม่มี ครูเลือกอ่านและแก้ไขทีละบทได้ก่อนพิมพ์
      </div>

      {/* Meta fields */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, marginBottom: 14 }}>
        <label style={{ fontSize: '0.85rem' }}>
          <strong>ชื่อเรื่องวิจัย</strong>
          <input value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })}
            style={inp} />
        </label>
        <label style={{ fontSize: '0.85rem' }}>
          <strong>ผู้วิจัย</strong>
          <input value={meta.researcher} onChange={(e) => setMeta({ ...meta, researcher: e.target.value })} style={inp} />
        </label>
        <label style={{ fontSize: '0.85rem' }}>
          <strong>สถาบัน/โรงเรียน</strong>
          <input value={meta.school} onChange={(e) => setMeta({ ...meta, school: e.target.value })} style={inp} />
        </label>
        <label style={{ fontSize: '0.85rem' }}>
          <strong>ปีการศึกษา</strong>
          <input value={meta.academicYear} onChange={(e) => setMeta({ ...meta, academicYear: e.target.value })} style={inp} />
        </label>
        <label style={{ fontSize: '0.85rem' }}>
          <strong>ชั้นเรียน (แหล่งข้อมูล)</strong>
          <select value={classroom} onChange={(e) => setClassroom(e.target.value)} style={inp}>
            <option value="all">ทุกชั้น (ป.1-ม.3)</option>
            {classrooms.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label style={{ fontSize: '0.85rem' }}>
          <strong>ความพึงพอใจเฉลี่ย (1-5, ถ้ามีแบบสอบถาม)</strong>
          <input type="number" min={1} max={5} step={0.01} placeholder="เว้นว่างถ้ายังไม่เก็บ"
            value={meta.satisfactionMean ?? ''}
            onChange={(e) => setMeta({ ...meta, satisfactionMean: e.target.value ? parseFloat(e.target.value) : undefined })}
            style={inp} />
        </label>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <button className="btn-primary" onClick={generate} disabled={genBusy}>
          {genBusy ? <Loader2 size={16} className="spin" /> : <Database size={16} />} ซิงก์ข้อมูลจริงและอัปเดต 5 บท
        </button>
        <button className="btn-secondary" onClick={aiExpand} disabled={busy || !doc}
          style={{ background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', color: 'white', border: 0 }}>
          {busy ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />} ให้ AI เรียบเรียง
        </button>
        {doc && (
          <>
            <button className="btn-secondary" onClick={copy}><Copy size={14} /> คัดลอก</button>
            <button className="btn-secondary" onClick={print}><Printer size={14} /> พิมพ์</button>
            <button className="btn-secondary" onClick={download}><Download size={14} /> ดาวน์โหลด .txt</button>
            <button className="btn-secondary" onClick={generate} disabled={genBusy}><RefreshCw size={14} /> คำนวณตัวเลขใหม่</button>
          </>
        )}
      </div>

      {dataN === 0 && (
        <div style={{ padding: 10, background: '#fef3c7', borderRadius: 8, marginBottom: 12, fontSize: '0.85rem' }}>
          ⚠️ ชั้นที่เลือกยังไม่มีคะแนนในระบบ — เอกสารจะมีโครงครบแต่ตัวเลขเป็น 0 กรอกคะแนนใน "เก็บคะแนน K/P/A" ก่อนเพื่อให้ผลสัมฤทธิ์จริงปรากฏ
        </div>
      )}

      {doc && activePart && (
        <section aria-labelledby="research-draft-heading" style={{ borderTop: '1px solid #e2e8f0', paddingTop: 18 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <div>
              <h3 id="research-draft-heading" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.05rem' }}>
                <BookOpen size={20} /> เนื้อหางานวิจัยในชั้นเรียน 5 บท
              </h3>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.84rem' }}>
                เลือกบทเพื่ออ่านและแก้ไข ต้นฉบับทั้งหมดจะถูกใช้ร่วมกันเมื่อคัดลอก พิมพ์ หรือดาวน์โหลด
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
                  minHeight: 88,
                  padding: '10px 12px',
                  textAlign: 'left',
                  border: activePartKey === `chapter-${chapter.number}` ? '2px solid #4f46e5' : '1px solid #cbd5e1',
                  borderRadius: 8,
                  background: activePartKey === `chapter-${chapter.number}` ? '#eef2ff' : '#fff',
                  color: '#0f172a',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <strong style={{ display: 'block', marginBottom: 4 }}>บทที่ {chapter.number} {chapter.title}</strong>
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

          <div style={{ padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderBottom: 0, borderRadius: '8px 8px 0 0' }}>
            <strong>{activePart.label}: {activePart.title}</strong>
            <span style={{ display: 'block', marginTop: 2, color: '#64748b', fontSize: '0.78rem' }}>แก้ไขข้อความในช่องด้านล่างได้โดยตรง</span>
          </div>
          <textarea
            aria-label={`แก้ไข${activePart.label}`}
            value={activePart.content}
            onChange={(e) => setDoc((current) => replaceResearchDocumentPart(current, activePart.key, e.target.value))}
            spellCheck={false}
            style={{
              width: '100%', minHeight: 620, padding: 18,
              border: '1px solid #cbd5e1', borderRadius: '0 0 8px 8px',
              fontFamily: "'Sarabun', sans-serif", fontSize: '0.94rem', lineHeight: 1.8,
              whiteSpace: 'pre-wrap', boxSizing: 'border-box', resize: 'vertical',
            }}
          />
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
