import React, { useMemo, useState } from 'react';
import { FileText, Sparkles, Copy, Printer, Download, Loader2, RefreshCw } from 'lucide-react';
import {
  computeResearchData, buildResearchDocument,
} from '../services/researchService';
import type { ResearchMeta } from '../services/researchService';
import { completeText } from '../services/aiTutorService';
import { fetchAllProgressFromFirebase } from '../services/progressService';
import { loadAllRosters } from '../services/rosterService';
import { useToast } from './Toast';

const ResearchGenerator: React.FC = () => {
  const rosters = useMemo(() => loadAllRosters(), []);
  const classrooms = useMemo(() => Object.keys(rosters), [rosters]);
  const toast = useToast();

  const [meta, setMeta] = useState<ResearchMeta>({
    title: 'การพัฒนาการเรียนการสอนผ่านเว็บเทคโนโลยีร่วมกับเกมมิฟิเคชันในรายวิชาวิทยาการคำนวณ',
    researcher: 'นายอนันตชัย เพ็ชรรี่',
    school: 'โรงเรียนบ้านคลองมดแดง',
    academicYear: '2569',
    classroomLabel: 'ทุกชั้น',
    satisfactionMean: undefined,
  });
  const [classroom, setClassroom] = useState<string>('all');
  const [doc, setDoc] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [genBusy, setGenBusy] = useState(false);
  const [dataN, setDataN] = useState<number | null>(null);

  const generate = async () => {
    setGenBusy(true);
    try {
      // ดึง progress ทุกคนจาก Firebase ก่อน เพื่อให้ข้อมูล engagement เกมมิฟิเคชันครบ
      await fetchAllProgressFromFirebase();
      const data = computeResearchData(classroom);
      setDataN(data.n);
      if (data.n === 0 && data.activeStudents === 0) {
        toast.show('ยังไม่มีคะแนน/การใช้งานในระบบสำหรับชั้นที่เลือก', 'info');
      }
      const label = classroom === 'all' ? 'ทุกชั้น (ป.1-ม.3)' : classroom;
      const document = buildResearchDocument({ ...meta, classroomLabel: label }, data);
      setDoc(document);
      toast.show(`สร้างเอกสารแล้ว — ผลสัมฤทธิ์ ${data.n} คน · เข้าใช้ระบบ ${data.activeStudents} คน`, 'success');
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
        📄 สร้างเอกสารงานวิจัย (การเรียนการสอนผ่านเว็บ WBI + ADDIE Model) — <strong>ดึงผลสัมฤทธิ์จริงจากกระดาษเกรด K/P/A</strong> ของนักเรียนมาคำนวณค่าเฉลี่ย/SD/ระดับ แล้วประกอบเป็นเอกสาร 5 บท กด "ให้ AI เรียบเรียง" เพื่อขยายเป็นภาษาวิชาการ (ต้องตั้ง API key ครู AI)
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
          {genBusy ? <Loader2 size={16} className="spin" /> : <FileText size={16} />} สร้างเอกสารจากข้อมูลจริง
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
            <button className="btn-secondary" onClick={generate}><RefreshCw size={14} /> สร้างใหม่ (อัปเดตตัวเลข)</button>
          </>
        )}
      </div>

      {dataN === 0 && (
        <div style={{ padding: 10, background: '#fef3c7', borderRadius: 8, marginBottom: 12, fontSize: '0.85rem' }}>
          ⚠️ ชั้นที่เลือกยังไม่มีคะแนนในระบบ — เอกสารจะมีโครงครบแต่ตัวเลขเป็น 0 กรอกคะแนนใน "เก็บคะแนน K/P/A" ก่อนเพื่อให้ผลสัมฤทธิ์จริงปรากฏ
        </div>
      )}

      {doc && (
        <textarea
          value={doc}
          onChange={(e) => setDoc(e.target.value)}
          spellCheck={false}
          style={{
            width: '100%', minHeight: 480, padding: 16,
            border: '1px solid #e5e7eb', borderRadius: 10,
            fontFamily: "'Sarabun', sans-serif", fontSize: '0.92rem', lineHeight: 1.7,
            whiteSpace: 'pre-wrap', boxSizing: 'border-box', resize: 'vertical',
          }}
        />
      )}
    </div>
  );
};

const inp: React.CSSProperties = {
  width: '100%', padding: '8px 10px', marginTop: 3,
  border: '1px solid #d1d5db', borderRadius: 8, fontFamily: 'inherit', boxSizing: 'border-box',
};

export default ResearchGenerator;
