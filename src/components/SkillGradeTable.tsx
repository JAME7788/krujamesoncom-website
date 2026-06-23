import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Download, Users, Plus, Trash2, Save } from 'lucide-react';
import {
  loadSkillGradeData, saveSkillGradeData,
  fetchSkillGradeDataFromFirebase, resetSkillStudentsFromRoster,
  addSkillAssignment, renameSkillAssignment, deleteSkillAssignment,
  updateSkillStudentScore, updateSkillStudentP, totalSkillK,
} from '../services/skillGradeService';
import type { SkillGradeData, SkillAssignment } from '../services/skillGradeService';
import type { Skill } from '../services/gradeService';
import { loadAllRosters } from '../services/rosterService';
import { useToast } from './Toast';

const SkillGradeTable: React.FC = () => {
  const rosters = useMemo(() => loadAllRosters(), []);
  const availableClassrooms = useMemo(() => Object.keys(rosters), [rosters]);
  const [classroom, setClassroom] = useState<string>(availableClassrooms.includes('ม.1') ? 'ม.1' : (availableClassrooms[0] || 'ม.1'));
  const [data, setData] = useState<SkillGradeData>(() => loadSkillGradeData('ม.1'));
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const toast = useToast();

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
    void reloadKey;
    setData(loadSkillGradeData(classroom));
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
        <button className="btn-secondary" onClick={handleResetStudents}>
          <RefreshCw size={14} /> รีเซ็ตรายชื่อจาก roster
        </button>
        <div style={{ flex: 1 }} />
        <button className="btn-export" onClick={handleExport}>
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div style={{ padding: 12, background: '#f0fdf4', borderRadius: 10, border: '1px dashed #86efac', marginBottom: 12 }}>
        <strong>📝 วิชาทักษะอาชีพ ({classroom})</strong> — Logo / Poster / Canva / Online Marketing
        <br />
        <small style={{ color: '#6b7280' }}>
          ครูสร้างช่อง K ได้กี่ช่องก็ได้ (เช่น ใบงาน 1, กิจกรรม Logo, สอบกลางภาค) แต่ละช่องตั้งคะแนนเต็มของตัวเอง |
          P เลือกจาก dropdown | บันทึกอัตโนมัติทันทีลง Firebase
        </small>
      </div>

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
