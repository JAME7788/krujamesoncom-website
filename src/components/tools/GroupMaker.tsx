import React, { useMemo, useState } from 'react';
import { Users, Shuffle, RefreshCw, Grid3x3, Hash } from 'lucide-react';
import { loadRoster, loadAllRosters } from '../../services/rosterService';
import type { StudentInfo } from '../../data/students2569';

const GROUP_COLORS = ['#6366f1', '#f97316', '#16a34a', '#db2777', '#0891b2', '#9333ea', '#ca8a04', '#dc2626', '#0d9488', '#7c3aed'];
const GROUP_EMOJI = ['🦁', '🐯', '🐼', '🦊', '🐨', '🦉', '🐧', '🦄', '🐸', '🐢'];

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const GroupMaker: React.FC = () => {
  const allRosters = useMemo(() => loadAllRosters(), []);
  const classrooms = useMemo(() => Object.keys(allRosters).sort(), [allRosters]);

  const [selectedClass, setSelectedClass] = useState<string>(classrooms[0] || 'ป.1');
  const [mode, setMode] = useState<'byGroups' | 'bySize'>('byGroups');
  const [groupCount, setGroupCount] = useState(4);
  const [groupSize, setGroupSize] = useState(3);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [groups, setGroups] = useState<StudentInfo[][]>([]);

  const roster = useMemo(() => loadRoster(selectedClass), [selectedClass]);
  const activeRoster = useMemo(() => roster.filter((s) => !excluded.has(s.studentCode)), [roster, excluded]);

  const makeGroups = () => {
    const list = shuffle(activeRoster);
    if (list.length === 0) { setGroups([]); return; }
    const result: StudentInfo[][] = [];
    if (mode === 'byGroups') {
      const n = Math.max(1, Math.min(groupCount, list.length));
      for (let i = 0; i < n; i++) result.push([]);
      list.forEach((student, i) => result[i % n].push(student)); // round-robin = กลุ่มสมดุล
    } else {
      const size = Math.max(1, groupSize);
      for (let i = 0; i < list.length; i += size) result.push(list.slice(i, i + size));
    }
    setGroups(result);
  };

  const toggleExclude = (code: string) => {
    const next = new Set(excluded);
    if (next.has(code)) next.delete(code); else next.add(code);
    setExcluded(next);
  };

  return (
    <div className="gm-container">
      <div className="gm-header">
        <div className="gm-title">
          <Users className="gm-title-icon" size={24} />
          <div>
            <h3>สุ่มแบ่งกลุ่มนักเรียน</h3>
            <p>แบ่งนักเรียนเป็นกลุ่มแบบสุ่มและสมดุล — สำหรับงานกลุ่ม/กิจกรรม</p>
          </div>
        </div>
        <div className="gm-class-select">
          <span>ระดับชั้น:</span>
          <select value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); setExcluded(new Set()); setGroups([]); }}>
            {classrooms.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="gm-controls">
        <div className="gm-mode">
          <button className={mode === 'byGroups' ? 'active' : ''} onClick={() => setMode('byGroups')}>
            <Grid3x3 size={15} /> กำหนดจำนวนกลุ่ม
          </button>
          <button className={mode === 'bySize' ? 'active' : ''} onClick={() => setMode('bySize')}>
            <Hash size={15} /> กำหนดคนต่อกลุ่ม
          </button>
        </div>
        <div className="gm-number">
          {mode === 'byGroups' ? (
            <label>จำนวนกลุ่ม:
              <input type="number" min={1} max={activeRoster.length || 1} value={groupCount}
                onChange={(e) => setGroupCount(Math.max(1, Number(e.target.value) || 1))} />
            </label>
          ) : (
            <label>คนต่อกลุ่ม:
              <input type="number" min={1} max={activeRoster.length || 1} value={groupSize}
                onChange={(e) => setGroupSize(Math.max(1, Number(e.target.value) || 1))} />
            </label>
          )}
          <span className="gm-count">นักเรียนที่ร่วม {activeRoster.length}/{roster.length} คน</span>
        </div>
        <button className="gm-make" onClick={makeGroups} disabled={activeRoster.length === 0}>
          {groups.length > 0 ? <RefreshCw size={17} /> : <Shuffle size={17} />}
          {groups.length > 0 ? 'สุ่มใหม่' : 'สุ่มแบ่งกลุ่ม!'}
        </button>
      </div>

      {groups.length > 0 && (
        <div className="gm-groups">
          {groups.map((g, i) => (
            <div key={i} className="gm-group-card" style={{ borderTopColor: GROUP_COLORS[i % GROUP_COLORS.length] }}>
              <div className="gm-group-head" style={{ color: GROUP_COLORS[i % GROUP_COLORS.length] }}>
                <span className="gm-group-emoji">{GROUP_EMOJI[i % GROUP_EMOJI.length]}</span>
                กลุ่มที่ {i + 1} <small>({g.length} คน)</small>
              </div>
              <ul>
                {g.map((s) => <li key={s.studentCode}><span className="gm-no">{s.no}</span> {s.name}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}

      <details className="gm-absent">
        <summary>ตั้งค่านักเรียนที่ไม่เข้าร่วม (ขาด/ลา) — {excluded.size} คน</summary>
        <p className="gm-absent-hint">คลิกชื่อเพื่อยกเว้นออกจากการแบ่งกลุ่ม</p>
        <div className="gm-absent-list">
          {roster.map((s) => {
            const isOut = excluded.has(s.studentCode);
            return (
              <button key={s.studentCode} className={`gm-chip ${isOut ? 'out' : ''}`} onClick={() => toggleExclude(s.studentCode)}>
                {s.emoji} {s.no}. {s.name.split(' ')[0]}
              </button>
            );
          })}
        </div>
      </details>

      <style>{`
        .gm-container { display: flex; flex-direction: column; gap: 1.25rem; font-family: 'Prompt', sans-serif; }
        .gm-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; background: white; padding: 1.25rem 1.5rem; border-radius: 1rem; border: 1px solid #f1f5f9; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
        .gm-title { display: flex; align-items: center; gap: 12px; }
        .gm-title-icon { color: #6366f1; flex-shrink: 0; }
        .gm-title h3 { margin: 0; font-size: 1.05rem; }
        .gm-title p { margin: 2px 0 0; font-size: 0.8rem; color: #64748b; }
        .gm-class-select { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #475569; }
        .gm-class-select select { padding: 6px 10px; border-radius: 8px; border: 1px solid #cbd5e1; font-family: inherit; font-size: 0.9rem; }
        .gm-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; background: white; padding: 1rem 1.25rem; border-radius: 1rem; border: 1px solid #f1f5f9; }
        .gm-mode { display: flex; gap: 6px; }
        .gm-mode button { display: inline-flex; align-items: center; gap: 5px; padding: 8px 12px; border-radius: 8px; border: 1.5px solid #e2e8f0; background: white; color: #64748b; font-weight: 600; font-size: 0.82rem; font-family: inherit; cursor: pointer; }
        .gm-mode button.active { border-color: #6366f1; background: #eef2ff; color: #4f46e5; }
        .gm-number { display: flex; align-items: center; gap: 12px; }
        .gm-number label { font-size: 0.85rem; font-weight: 600; color: #475569; display: inline-flex; align-items: center; gap: 8px; }
        .gm-number input { width: 64px; padding: 7px 10px; border-radius: 8px; border: 1.5px solid #cbd5e1; font-family: inherit; font-size: 0.95rem; text-align: center; }
        .gm-count { font-size: 0.78rem; color: #94a3b8; font-weight: 600; }
        .gm-make { margin-left: auto; display: inline-flex; align-items: center; gap: 8px; padding: 10px 22px; border-radius: 10px; border: none; background: #6366f1; color: white; font-weight: 700; font-size: 0.95rem; font-family: inherit; cursor: pointer; box-shadow: 0 8px 15px -6px rgba(99,102,241,0.5); }
        .gm-make:hover:not(:disabled) { background: #4f46e5; }
        .gm-make:disabled { background: #94a3b8; cursor: not-allowed; box-shadow: none; }
        .gm-groups { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; }
        .gm-group-card { background: white; border: 1px solid #f1f5f9; border-top: 4px solid #6366f1; border-radius: 12px; padding: 14px 16px; box-shadow: 0 2px 8px rgba(15,23,42,0.05); }
        .gm-group-head { display: flex; align-items: center; gap: 7px; font-weight: 800; font-size: 1rem; margin-bottom: 10px; }
        .gm-group-head small { color: #94a3b8; font-weight: 600; }
        .gm-group-emoji { font-size: 1.3rem; }
        .gm-group-card ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
        .gm-group-card li { font-size: 0.85rem; color: #334155; display: flex; align-items: center; gap: 7px; }
        .gm-no { display: inline-flex; align-items: center; justify-content: center; min-width: 22px; height: 22px; background: #f1f5f9; color: #64748b; border-radius: 6px; font-size: 0.72rem; font-weight: 700; }
        .gm-absent { background: white; border: 1px solid #f1f5f9; border-radius: 1rem; padding: 12px 16px; }
        .gm-absent summary { cursor: pointer; font-weight: 600; font-size: 0.85rem; color: #475569; }
        .gm-absent-hint { font-size: 0.76rem; color: #94a3b8; margin: 8px 0; }
        .gm-absent-list { display: flex; flex-wrap: wrap; gap: 6px; }
        .gm-chip { padding: 5px 10px; border-radius: 999px; border: 1.5px solid #e2e8f0; background: white; color: #334155; font-size: 0.78rem; font-family: inherit; cursor: pointer; }
        .gm-chip.out { background: #fef2f2; border-color: #fecaca; color: #b91c1c; text-decoration: line-through; opacity: 0.75; }
        @media (max-width: 600px) { .gm-make { margin-left: 0; width: 100%; justify-content: center; } .gm-number { width: 100%; } }
      `}</style>
    </div>
  );
};

export default GroupMaker;
