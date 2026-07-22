import React, { useMemo, useState } from 'react';
import { Users, Award, Send, Sparkles, Download } from 'lucide-react';
import { awardBonus, fetchStudentProgress, fetchAllProgressFromFirebase, getProgress } from '../services/progressService';
import { loadAllRosters } from '../services/rosterService';
import { useToast } from './Toast';

const downloadCsv = (csv: string, filename: string) => {
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const PRESETS = [
  { emoji: '⭐', label: 'ดีมาก', xp: 10 },
  { emoji: '👍', label: 'ตั้งใจ', xp: 5 },
  { emoji: '🌟', label: 'ช่วยเพื่อน', xp: 10 },
  { emoji: '🏆', label: 'คะแนนเต็ม', xp: 20 },
  { emoji: '💡', label: 'ตอบเก่ง', xp: 8 },
  { emoji: '🎨', label: 'สร้างสรรค์', xp: 8 },
  { emoji: '🤝', label: 'ทำงานเป็นทีม', xp: 8 },
  { emoji: '📚', label: 'ขยันอ่าน', xp: 5 },
];

const EMOJI_PALETTE = ['⭐', '👍', '🌟', '🏆', '💡', '🎨', '🤝', '📚', '✨', '🎯', '💯', '🥇', '🥈', '🥉', '🎉', '🚀'];

const BonusAwarder: React.FC = () => {
  const rosters = useMemo(() => loadAllRosters(), []);
  const classrooms = useMemo(() => Object.keys(rosters), [rosters]);
  const [classroom, setClassroom] = useState<string>(classrooms[0] || 'ป.1');
  const [selectedStudent, setSelectedStudent] = useState<{ code: string; name: string; no: number; emoji: string } | null>(null);
  const [emoji, setEmoji] = useState('⭐');
  const [reason, setReason] = useState('');
  const [xp, setXp] = useState(10);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const roster = rosters[classroom] || [];

  const buildStudentId = (s: { studentCode: string; no: number; name: string }) =>
    `${classroom}_${s.no}_${s.name.replace(/\s/g, '')}`;

  const applyPreset = (p: typeof PRESETS[0]) => {
    setEmoji(p.emoji);
    setReason(p.label);
    setXp(p.xp);
  };

  const handleExport = async () => {
    // ดึง progress ทุกคนจาก Firebase (เผื่อ cache ไม่มี)
    await fetchAllProgressFromFirebase();
    let csv = 'ห้อง,เลขที่,ชื่อ-สกุล,รวมโบนัส XP,จำนวนรางวัล,รางวัลล่าสุด,วันที่ล่าสุด\n';
    roster.forEach((s) => {
      const studentId = buildStudentId(s);
      const prog = getProgress(studentId);
      const bonuses = prog.bonuses || [];
      const latest = bonuses[0];
      const latestStr = latest ? `${latest.emoji} ${latest.reason} (+${latest.xp})` : '-';
      const latestDate = latest ? new Date(latest.awardedAt).toLocaleDateString('th-TH') : '-';
      csv += `${classroom},${s.no},"${s.name}",${prog.bonusXp || 0},${bonuses.length},"${latestStr}",${latestDate}\n`;
    });
    downloadCsv(csv, `bonus_summary_${classroom}_${new Date().toISOString().slice(0, 10)}.csv`);
    toast.show(`Export โบนัส ${roster.length} คนแล้ว`, 'success');
  };

  const handleExportHistory = async () => {
    // history ทุกรางวัลแบบรายการ
    await fetchAllProgressFromFirebase();
    let csv = 'ห้อง,เลขที่,ชื่อ-สกุล,วันที่ได้รับ,Emoji,เหตุผล,XP\n';
    roster.forEach((s) => {
      const prog = getProgress(buildStudentId(s));
      (prog.bonuses || []).forEach((b) => {
        csv += `${classroom},${s.no},"${s.name}",${new Date(b.awardedAt).toLocaleString('th-TH')},${b.emoji},"${b.reason}",${b.xp}\n`;
      });
    });
    downloadCsv(csv, `bonus_history_${classroom}_${new Date().toISOString().slice(0, 10)}.csv`);
    toast.show(`Export ประวัติรางวัลเรียบร้อย`, 'success');
  };

  const handleAward = async () => {
    if (!selectedStudent) return;
    setBusy(true);
    try {
      const studentId = buildStudentId({ studentCode: selectedStudent.code, no: selectedStudent.no, name: selectedStudent.name });
      // ensure cache populated
      await fetchStudentProgress(studentId);
      const stored = await awardBonus(studentId, { emoji, reason, xp });
      if (!stored) throw new Error('บันทึกรางวัลเข้า Firebase ไม่สำเร็จ');
      toast.show(`${emoji} +${xp} XP → ${selectedStudent.name} (${reason || 'รางวัลจากครู'})`, 'success');
      setSelectedStudent(null);
      setReason('');
      setEmoji('⭐');
      setXp(10);
    } catch (e) {
      toast.show(`บันทึกไม่สำเร็จ: ${e instanceof Error ? e.message : String(e)}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="filter-row" style={{ marginBottom: 16 }}>
        <div className="filter-group">
          <label><Users size={14} /> ห้องเรียน</label>
          <select value={classroom} onChange={(e) => { setClassroom(e.target.value); setSelectedStudent(null); }}>
            {classrooms.map((c) => (
              <option key={c} value={c}>{c} ({rosters[c]?.length || 0} คน)</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }} />
        <button className="btn-secondary" onClick={handleExport}>
          <Download size={14} /> Export สรุป
        </button>
        <button className="btn-secondary" onClick={handleExportHistory}>
          <Download size={14} /> Export ประวัติ
        </button>
      </div>

      <div style={{ padding: 12, background: '#fef3c7', borderRadius: 10, marginBottom: 16, fontSize: '0.88rem' }}>
        💡 คลิกที่ชื่อเด็ก → เลือก preset หรือกรอกเอง → กดส่ง — ระบบจะเพิ่ม XP ใน Dashboard เด็กทันที + sync Firebase ไปทุกเครื่อง
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 8, marginBottom: 16,
      }}>
        {roster.map((s) => {
          const studentId = buildStudentId(s);
          const prog = getProgress(studentId);
          const bonusCount = prog.bonuses?.length || 0;
          const isSelected = selectedStudent?.code === s.studentCode;
          return (
            <button
              key={s.studentCode}
              onClick={() => setSelectedStudent({ code: s.studentCode, name: s.name, no: s.no, emoji: s.emoji })}
              style={{
                padding: 10, borderRadius: 10,
                background: isSelected ? '#fbbf24' : 'white',
                border: isSelected ? '2px solid #f59e0b' : '1px solid #e5e7eb',
                cursor: 'pointer', textAlign: 'left',
                fontFamily: 'inherit', fontSize: '0.85rem',
                display: 'flex', alignItems: 'center', gap: 6,
                color: isSelected ? '#78350f' : 'inherit',
                fontWeight: isSelected ? 700 : 500,
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>{s.emoji}</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.no}. {s.name}
              </span>
              {bonusCount > 0 && (
                <span style={{ fontSize: '0.7rem', background: '#fbbf24', color: '#78350f', padding: '1px 6px', borderRadius: 999 }}>
                  ⭐{bonusCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selectedStudent && (
        <div style={{
          padding: 20, borderRadius: 14,
          background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
          border: '2px solid #f59e0b',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 10,
              background: 'white', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem',
            }}>
              {selectedStudent.emoji}
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#92400e', fontWeight: 600 }}>กำลังแจกรางวัลให้</div>
              <strong style={{ fontSize: '1.1rem' }}>{selectedStudent.no}. {selectedStudent.name}</strong>
            </div>
          </div>

          {/* Preset buttons */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 6 }}>
              <Sparkles size={14} style={{ verticalAlign: 'middle' }} /> Quick preset
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => applyPreset(p)}
                  style={{
                    padding: '6px 10px', borderRadius: 999,
                    background: emoji === p.emoji && reason === p.label ? '#f59e0b' : 'white',
                    color: emoji === p.emoji && reason === p.label ? 'white' : '#92400e',
                    border: '1px solid #fbbf24', cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: '0.83rem',
                  }}
                >
                  {p.emoji} {p.label} +{p.xp}
                </button>
              ))}
            </div>
          </div>

          {/* Custom */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
            <select value={emoji} onChange={(e) => setEmoji(e.target.value)} style={{ fontSize: '1.2rem', padding: '6px 10px', borderRadius: 8 }}>
              {EMOJI_PALETTE.map((e) => <option key={e}>{e}</option>)}
            </select>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="เหตุผล (เช่น ตอบคำถามเก่ง)"
              style={{ flex: 1, minWidth: 160, padding: '8px 12px', border: '1px solid #fbbf24', borderRadius: 8, fontFamily: 'inherit' }}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem' }}>
              XP
              <input
                type="number"
                value={xp}
                onChange={(e) => setXp(Math.max(0, parseInt(e.target.value, 10) || 0))}
                min={0}
                max={100}
                style={{ width: 60, padding: '6px 8px', border: '1px solid #fbbf24', borderRadius: 8, fontFamily: 'inherit', textAlign: 'center' }}
              />
            </label>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              onClick={() => setSelectedStudent(null)}
              className="btn-secondary"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleAward}
              disabled={busy || xp === 0}
              className="btn-primary"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', border: 0 }}
            >
              <Send size={14} /> {busy ? 'กำลังส่ง...' : `ส่งรางวัล +${xp} XP`}
            </button>
          </div>
        </div>
      )}

      {!selectedStudent && roster.length > 0 && (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: '#6b7280' }}>
          <Award size={32} style={{ opacity: 0.4 }} />
          <p style={{ marginTop: 8 }}>เลือกนักเรียนที่จะแจกรางวัลด้านบน</p>
        </div>
      )}
    </div>
  );
};

export default BonusAwarder;
