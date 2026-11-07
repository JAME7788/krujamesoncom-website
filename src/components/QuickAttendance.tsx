import React, { useEffect, useMemo, useState } from 'react';
import { Users, Calendar, CheckCircle2, Download, Clock } from 'lucide-react';
import {
  fetchAttendance, setStatus, markAllPresent, todayDateKey,
  ATTENDANCE_LABEL,
} from '../services/manualAttendanceService';
import type { AttendanceStatus, ManualAttendance } from '../services/manualAttendanceService';
import {
  loadSchedule,
  TIMETABLE_PERIODS,
  dayNames,
  minutesOf,
  type ClassSlot,
} from '../data/schedule';
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

const ALL_STATUS: AttendanceStatus[] = ['present', 'absent', 'sick'];

const weekdayFromIsoDate = (isoDate: string): number => {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return new Date().getDay();
  return new Date(y, m - 1, d).getDay();
};

const QuickAttendance: React.FC = () => {
  const rosters = useMemo(() => loadAllRosters(), []);
  const classrooms = useMemo(() => Object.keys(rosters), [rosters]);
  const schedule = useMemo(() => loadSchedule(), []);
  const [date, setDate] = useState<string>(todayDateKey());

  const selectedDay = useMemo(() => weekdayFromIsoDate(date), [date]);
  const daySlots = useMemo(
    () => schedule
      .filter((s) => s.day === selectedDay)
      .sort((a, b) => minutesOf(a.start) - minutesOf(b.start)),
    [schedule, selectedDay],
  );

  const [classroom, setClassroom] = useState<string>(() => {
    const todaySlotsList = loadSchedule()
      .filter((s) => s.day === weekdayFromIsoDate(todayDateKey()))
      .sort((a, b) => minutesOf(a.start) - minutesOf(b.start));
    return todaySlotsList[0]?.classroom || classrooms[0] || 'ป.1';
  });
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(() => {
    const todaySlotsList = loadSchedule()
      .filter((s) => s.day === weekdayFromIsoDate(todayDateKey()))
      .sort((a, b) => minutesOf(a.start) - minutesOf(b.start));
    return todaySlotsList[0]?.id || null;
  });
  const [showFullTimetable, setShowFullTimetable] = useState<boolean>(true);
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

  const handleSelectSlot = (slot: ClassSlot) => {
    setSelectedSlotId(slot.id);
    if (classrooms.includes(slot.classroom)) {
      setClassroom(slot.classroom);
    }
  };

  const buildStudentId = (s: { no: number; name: string }) =>
    `${classroom}_${s.no}_${s.name.replace(/\s/g, '')}`;

  const counts = useMemo(() => {
    const records = att?.records || {};
    const c = { present: 0, absent: 0, sick: 0, unset: 0 };
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

  const activeSlot = useMemo(
    () => schedule.find((s) => s.id === selectedSlotId) || daySlots.find((s) => s.classroom === classroom),
    [schedule, selectedSlotId, daySlots, classroom],
  );

  return (
    <div>
      {/* ตารางเรียนตามคาบจริงของโรงเรียน — คลิกคาบเพื่อเลือกห้องเช็คชื่อได้ทันที */}
      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          padding: 14,
          marginBottom: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          <div>
            <strong style={{ fontSize: '0.96rem', color: '#0f172a' }}>
              📅 ตารางเรียนและเช็คชื่อตามคาบสอนจริง (วัน{dayNames[selectedDay]} • {date})
            </strong>
            <div style={{ fontSize: '0.8rem', color: '#475569' }}>
              คลิกที่คาบเรียนในตารางเพื่อสลับห้องเช็คชื่อได้ทันที ตรงตามตารางสอน 7 คาบของโรงเรียน
            </div>
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowFullTimetable((v) => !v)}
            style={{ fontSize: '0.8rem', padding: '6px 10px' }}
          >
            <Clock size={14} /> {showFullTimetable ? 'ซ่อนตารางรวมทั้งสัปดาห์' : 'ดูตารางสอนรวมจันทร์–ศุกร์'}
          </button>
        </div>

        {/* คาบเรียนของวันที่เลือก */}
        {daySlots.length > 0 ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: showFullTimetable ? 12 : 0 }}>
            {daySlots.map((slot) => {
              const periodNum = TIMETABLE_PERIODS.find((p) => p.start === slot.start)?.period;
              const isSelected = slot.id === activeSlot?.id || (slot.classroom === classroom && !selectedSlotId);
              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => handleSelectSlot(slot)}
                  style={{
                    display: 'inline-flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: isSelected ? '2px solid #92400E' : '1px solid #cbd5e1',
                    background: isSelected ? '#FFF9E6' : 'white',
                    color: '#0f172a',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', color: '#92400E', fontWeight: 700 }}>
                    {periodNum ? `คาบที่ ${periodNum}` : 'คาบเรียน'} ({slot.start}–{slot.end})
                  </span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>
                    {slot.subject || 'เทคโนโลยี'} • ชั้น {slot.classroom}/1
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: showFullTimetable ? 12 : 0 }}>
            วันที่เลือกไม่มีคาบสอนในตารางปกติ สามารถคลิกเลือกห้องจากตารางสอนจันทร์–ศุกร์ด้านล่างได้เลยครับ
          </div>
        )}

        {/* ตารางสอนรวม จันทร์ - ศุกร์ (7 คาบ + พักกลางวัน) */}
        {showFullTimetable && (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.78rem',
                background: 'white',
                border: '1px solid #cbd5e1',
              }}
            >
              <thead>
                <tr style={{ background: '#f1f5f9', color: '#0f172a' }}>
                  <th style={{ border: '1px solid #cbd5e1', padding: '6px 8px', minWidth: 78 }}>วัน / เวลา</th>
                  {TIMETABLE_PERIODS.slice(0, 4).map((p) => (
                    <th key={p.period} style={{ border: '1px solid #cbd5e1', padding: '6px 6px', textAlign: 'center' }}>
                      <div>{p.label}</div>
                      <small style={{ color: '#475569', fontWeight: 500 }}>{p.start}-{p.end}</small>
                    </th>
                  ))}
                  <th style={{ border: '1px solid #cbd5e1', padding: '6px 6px', textAlign: 'center', background: '#fef9c3' }}>
                    <div>พักกลางวัน</div>
                    <small style={{ color: '#854d0e', fontWeight: 500 }}>11:50-13:00</small>
                  </th>
                  {TIMETABLE_PERIODS.slice(4).map((p) => (
                    <th key={p.period} style={{ border: '1px solid #cbd5e1', padding: '6px 6px', textAlign: 'center' }}>
                      <div>{p.label}</div>
                      <small style={{ color: '#475569', fontWeight: 500 }}>{p.start}-{p.end}</small>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((dayNum) => (
                  <tr
                    key={dayNum}
                    style={{
                      background: selectedDay === dayNum ? '#f8fafc' : 'white',
                    }}
                  >
                    <td
                      style={{
                        border: '1px solid #cbd5e1',
                        padding: '6px 8px',
                        fontWeight: 700,
                        textAlign: 'center',
                        background: selectedDay === dayNum ? '#FEF3C7' : '#f8fafc',
                      }}
                    >
                      วัน{dayNames[dayNum]}
                    </td>
                    {TIMETABLE_PERIODS.slice(0, 4).map((p) => {
                      const slot = schedule.find((s) => s.day === dayNum && s.start === p.start);
                      const isActive = slot && slot.classroom === classroom && (slot.id === selectedSlotId || selectedDay === dayNum);
                      return (
                        <td
                          key={p.period}
                          onClick={() => slot && handleSelectSlot(slot)}
                          style={{
                            border: '1px solid #cbd5e1',
                            padding: '5px 6px',
                            textAlign: 'center',
                            cursor: slot ? 'pointer' : 'default',
                            background: isActive
                              ? '#FEF3C7'
                              : slot?.subject?.startsWith('⭐')
                                ? '#fffbeb'
                                : 'transparent',
                          }}
                        >
                          {slot ? (
                            <>
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>{slot.subject}</div>
                              <div style={{ fontSize: '0.72rem', color: '#475569' }}>{slot.classroom}/1</div>
                            </>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>-</span>
                          )}
                        </td>
                      );
                    })}
                    <td
                      style={{
                        border: '1px solid #cbd5e1',
                        padding: '5px 6px',
                        textAlign: 'center',
                        background: '#fefce8',
                        color: '#a16207',
                        fontWeight: 600,
                      }}
                    >
                      พัก
                    </td>
                    {TIMETABLE_PERIODS.slice(4).map((p) => {
                      const slot = schedule.find((s) => s.day === dayNum && s.start === p.start);
                      const isActive = slot && slot.classroom === classroom && (slot.id === selectedSlotId || selectedDay === dayNum);
                      return (
                        <td
                          key={p.period}
                          onClick={() => slot && handleSelectSlot(slot)}
                          style={{
                            border: '1px solid #cbd5e1',
                            padding: '5px 6px',
                            textAlign: 'center',
                            cursor: slot ? 'pointer' : 'default',
                            background: isActive
                              ? '#FEF3C7'
                              : slot?.subject?.startsWith('⭐')
                                ? '#fffbeb'
                                : 'transparent',
                          }}
                        >
                          {slot ? (
                            <>
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>{slot.subject}</div>
                              <div style={{ fontSize: '0.72rem', color: '#475569' }}>{slot.classroom}/1</div>
                            </>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="filter-row" style={{ marginBottom: 12 }}>
        <div className="filter-group">
          <label><Users size={14} /> ห้องที่กำลังเช็คชื่อ</label>
          <select
            value={classroom}
            onChange={(e) => {
              setSelectedSlotId(null);
              setClassroom(e.target.value);
            }}
          >
            {classrooms.map((c) => (
              <option key={c} value={c}>{c}/1 ({rosters[c]?.length || 0} คน)</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label><Calendar size={14} /> วันที่</label>
          <input
            type="date"
            value={date}
            onChange={(e) => {
              const nextDate = e.target.value;
              setDate(nextDate);
              const nextDay = weekdayFromIsoDate(nextDate);
              const firstSlot = schedule
                .filter((s) => s.day === nextDay)
                .sort((a, b) => minutesOf(a.start) - minutesOf(b.start))[0];
              if (firstSlot && classrooms.includes(firstSlot.classroom)) {
                setSelectedSlotId(firstSlot.id);
                setClassroom(firstSlot.classroom);
              }
            }}
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

      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        {activeSlot && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 999,
              background: '#FEF3C7',
              color: '#78350F',
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
          >
            📚 คาบที่เลือก: {activeSlot.subject} ({activeSlot.classroom}/1 • {activeSlot.start}–{activeSlot.end})
          </span>
        )}
        {ALL_STATUS.map((st) => (
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
