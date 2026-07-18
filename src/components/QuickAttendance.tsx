import React, { useEffect, useMemo, useState } from 'react';
import { Users, Calendar, CheckCircle2, Download } from 'lucide-react';
import {
  fetchAttendance, setStatus, markAllPresent, todayDateKey,
  ATTENDANCE_LABEL,
} from '../services/manualAttendanceService';
import type { AttendanceStatus, ManualAttendance } from '../services/manualAttendanceService';
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

const ALL_STATUS: AttendanceStatus[] = ['present', 'late', 'absent', 'sick'];

const QuickAttendance: React.FC = () => {
  const rosters = useMemo(() => loadAllRosters(), []);
  const classrooms = useMemo(() => Object.keys(rosters), [rosters]);
  const [classroom, setClassroom] = useState<string>(classrooms[0] || 'ป.1');
  const [date, setDate] = useState<string>(todayDateKey());
  const [att, setAtt] = useState<ManualAttendance | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const toast = useToast();

  const roster = useMemo(() => rosters[classroom] || [], [classroom, rosters]);

  useEffect(() => {
    let cancelled = false;
    void fetchAttendance(date, classroom).then((data) => {
      if (!cancelled) setAtt(data);
    });
    return () => { cancelled = true; };
  }, [date, classroom]);

  const buildStudentId = (s: { no: number; name: string }) =>
    `${classroom}_${s.no}_${s.name.replace(/\s/g, '')}`;

  const counts = useMemo(() => {
    const records = att?.records || {};
    const c = { present: 0, late: 0, absent: 0, sick: 0, unset: 0 };
    roster.forEach((s) => {
      const st = records[s.studentCode];
      if (st) c[st] += 1;
      else c.unset += 1;
    });
    return c;
  }, [att, roster]);

  const handleStatus = async (studentCode: string, studentId: string, status: AttendanceStatus) => {
    setBusy(studentCode);
    try {
      await setStatus(date, classroom, studentCode, studentId, status);
      const info = ATTENDANCE_LABEL[status];
      if (info.xp > 0) {
        toast.show(`${info.emoji} ${info.th} +${info.xp} XP`, 'success');
      } else {
        toast.show(`${info.emoji} ${info.th}`, 'info');
      }
      setAtt(await fetchAttendance(date, classroom));
    } catch (e) {
      toast.show(`ผิดพลาด: ${e instanceof Error ? e.message : String(e)}`, 'error');
    } finally {
      setBusy(null);
    }
  };

  const handleExport = () => {
    const records = att?.records || {};
    let csv = 'เลขที่,ชื่อ-สกุล,สถานะ,Emoji,XP\n';
    [...roster].sort((a, b) => a.no - b.no).forEach((s) => {
      const st = records[s.studentCode];
      if (st) {
        const info = ATTENDANCE_LABEL[st];
        csv += `${s.no},"${s.name}",${info.th},${info.emoji},${info.xp}\n`;
      } else {
        csv += `${s.no},"${s.name}",ยังไม่ติ๊ก,-,0\n`;
      }
    });
    downloadCsv(csv, `attendance_${classroom}_${date}.csv`);
    toast.show(`Export CSV ${roster.length} คน เรียบร้อย`, 'success');
  };

  const handleAllPresent = async () => {
    if (!confirm(`เซ็ตทุกคน (${roster.length} คน) ในห้อง ${classroom} เป็น "มาเรียน" ?`)) return;
    setBusy('__all__');
    try {
      const students = roster.map((s) => ({ studentCode: s.studentCode, studentId: buildStudentId(s) }));
      await markAllPresent(date, classroom, students);
      toast.show(`✅ เซ็ตทุกคนเป็น "มาเรียน" — แจก +${ATTENDANCE_LABEL.present.xp} XP ให้ ${roster.length} คน`, 'success');
      setAtt(await fetchAttendance(date, classroom));
    } catch (e) {
      toast.show(`ผิดพลาด: ${e instanceof Error ? e.message : String(e)}`, 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <div className="filter-row" style={{ marginBottom: 12 }}>
        <div className="filter-group">
          <label><Users size={14} /> ห้อง</label>
          <select value={classroom} onChange={(e) => setClassroom(e.target.value)}>
            {classrooms.map((c) => (
              <option key={c} value={c}>{c} ({rosters[c]?.length || 0} คน)</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label><Calendar size={14} /> วันที่</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontFamily: 'inherit' }}
          />
        </div>
        <div style={{ flex: 1 }} />
        <button className="btn-secondary" onClick={handleExport} disabled={roster.length === 0}>
          <Download size={14} /> Export CSV
        </button>
        <button
          className="btn-primary"
          onClick={handleAllPresent}
          disabled={busy !== null || roster.length === 0}
          style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', border: 0 }}
        >
          <CheckCircle2 size={16} /> ทุกคนมา (Quick)
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {(['present', 'late', 'absent', 'sick'] as AttendanceStatus[]).map((st) => (
          <span
            key={st}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '4px 12px', borderRadius: 999,
              background: `${ATTENDANCE_LABEL[st].color}20`,
              color: ATTENDANCE_LABEL[st].color, fontSize: '0.85rem', fontWeight: 700,
            }}
          >
            {ATTENDANCE_LABEL[st].emoji} {ATTENDANCE_LABEL[st].th} {counts[st]}
          </span>
        ))}
        {counts.unset > 0 && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '4px 12px', borderRadius: 999,
            background: '#f3f4f6', color: '#6b7280', fontSize: '0.85rem', fontWeight: 700,
          }}>
            ⚪ ยังไม่ติ๊ก {counts.unset}
          </span>
        )}
      </div>

      <div className="att-table-wrap">
        <table className="att-table">
          <thead>
            <tr>
              <th style={{ width: 50 }}>เลขที่</th>
              <th>ชื่อ-สกุล</th>
              <th style={{ textAlign: 'center', width: 360 }}>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((s) => {
              const current = att?.records?.[s.studentCode];
              const studentId = buildStudentId(s);
              return (
                <tr key={s.studentCode}>
                  <td>{s.no}</td>
                  <td>{s.emoji} {s.name}</td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: 4 }}>
                      {ALL_STATUS.map((st) => {
                        const info = ATTENDANCE_LABEL[st];
                        const active = current === st;
                        return (
                          <button
                            key={st}
                            onClick={() => handleStatus(s.studentCode, studentId, st)}
                            disabled={busy !== null}
                            style={{
                              padding: '5px 10px', borderRadius: 8,
                              background: active ? info.color : 'white',
                              color: active ? 'white' : info.color,
                              border: `1.5px solid ${info.color}`,
                              fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 700,
                              cursor: busy ? 'not-allowed' : 'pointer',
                              transition: 'all 0.15s',
                              opacity: busy === s.studentCode ? 0.5 : 1,
                            }}
                            title={info.xp > 0 ? `${info.th} (+${info.xp} XP)` : info.th}
                          >
                            {info.emoji} {info.th}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuickAttendance;
