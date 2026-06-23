import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Download, Users, Save } from 'lucide-react';
import {
  loadSkillGrades, saveSkillGrades, updateSkillScore, initSkillGrades,
  fetchSkillGradesFromFirebase, SKILL_K_MAX,
} from '../services/skillGradeService';
import type { SkillScore } from '../services/skillGradeService';
import type { Skill } from '../services/gradeService';
import { loadAllRosters } from '../services/rosterService';
import { useToast } from './Toast';

const SkillGradeTable: React.FC = () => {
  const rosters = useMemo(() => loadAllRosters(), []);
  const availableClassrooms = useMemo(() => Object.keys(rosters), [rosters]);
  const [classroom, setClassroom] = useState<string>(availableClassrooms.includes('ม.1') ? 'ม.1' : (availableClassrooms[0] || 'ม.1'));
  const [scores, setScores] = useState<SkillScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const toast = useToast();

  // โหลด + sync จาก Firebase ตอนเปลี่ยนห้อง
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const remote = await fetchSkillGradesFromFirebase(classroom);
        if (cancelled) return;
        if (remote && remote.length > 0) {
          saveSkillGrades(classroom, remote);
        }
        const local = loadSkillGrades(classroom);
        const roster = rosters[classroom] || [];
        if (local.length === 0 && roster.length > 0) {
          initSkillGrades(classroom, roster);
        }
        if (!cancelled) {
          setScores(loadSkillGrades(classroom));
          setReloadKey((k) => k + 1);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [classroom, rosters]);

  // re-render เมื่อมี update
  useEffect(() => {
    void reloadKey;
    setScores(loadSkillGrades(classroom));
  }, [reloadKey, classroom]);

  const handleK = (code: string, raw: string) => {
    const n = parseInt(raw, 10);
    if (Number.isNaN(n)) return;
    updateSkillScore(classroom, code, { k: n });
    setReloadKey((k) => k + 1);
  };

  const handleP = (code: string, p: Skill) => {
    updateSkillScore(classroom, code, { p });
    setReloadKey((k) => k + 1);
  };

  const handleReset = () => {
    if (!confirm(`รีเซ็ตคะแนนทักษะอาชีพห้อง ${classroom} จาก roster ปัจจุบัน?\n(จะเริ่มจาก 0 ใหม่ทั้งหมด)`)) return;
    const roster = rosters[classroom] || [];
    initSkillGrades(classroom, roster);
    setReloadKey((k) => k + 1);
    toast.show(`รีเซ็ตห้อง ${classroom} แล้ว`, 'success');
  };

  const handleExport = () => {
    let csv = 'เลขที่,ชื่อ-สกุล,K (0-100),P\n';
    scores.forEach((s) => {
      csv += `${s.studentNo},"${s.name}",${s.k},${s.pAssessed ? s.p : '-'}\n`;
    });
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skill_${classroom}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
        <button className="btn-secondary" onClick={handleReset}>
          <RefreshCw size={14} /> รีเซ็ตจากรายชื่อ
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
          K = คะแนนความรู้ (0-{SKILL_K_MAX}) — ครูใส่เอง | P = ทักษะ — เลือกจาก dropdown |
          บันทึกอัตโนมัติทันทีลง Firebase
        </small>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <RefreshCw size={32} style={{ color: '#6366f1', animation: 'spin 1s linear infinite' }} />
          <p>กำลังโหลดคะแนน...</p>
        </div>
      ) : scores.length === 0 ? (
        <div className="empty-state-card">
          <p>ยังไม่มีข้อมูล — กด "รีเซ็ตจากรายชื่อ" เพื่อสร้างจาก roster</p>
        </div>
      ) : (
        <div className="att-table-wrap">
          <table className="att-table">
            <thead>
              <tr>
                <th style={{ width: 60, textAlign: 'center' }}>เลขที่</th>
                <th>ชื่อ-สกุล</th>
                <th style={{ width: 140, textAlign: 'center' }}>K (0-{SKILL_K_MAX})</th>
                <th style={{ width: 140, textAlign: 'center' }}>P</th>
                <th style={{ width: 100, textAlign: 'center' }}>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {scores.sort((a, b) => a.studentNo - b.studentNo).map((s) => (
                <tr key={s.studentCode}>
                  <td style={{ textAlign: 'center' }}>{s.studentNo}</td>
                  <td>{s.emoji} {s.name}</td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="number"
                      value={s.k}
                      min={0}
                      max={SKILL_K_MAX}
                      onChange={(e) => handleK(s.studentCode, e.target.value)}
                      style={{
                        width: 80, padding: '4px 8px', textAlign: 'center',
                        border: '1px solid #d1d5db', borderRadius: 6, fontFamily: 'inherit',
                      }}
                    />
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
                  <td style={{ textAlign: 'center', fontSize: '0.8rem' }}>
                    {s.pAssessed || s.k > 0 ? (
                      <span style={{ color: '#16a34a' }}><Save size={12} /> บันทึก</span>
                    ) : (
                      <span style={{ color: '#9ca3af' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SkillGradeTable;
