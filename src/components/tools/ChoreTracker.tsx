import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, CheckSquare, Award, Clock, Star, RefreshCw } from 'lucide-react';
import { loadRoster, loadAllRosters } from '../../services/rosterService';
import type { StudentInfo } from '../../data/students2569';

interface ChoreRecord {
  // date string (YYYY-MM-DD) -> studentCode -> boolean (completed)
  [dateStr: string]: Record<string, boolean>;
}

// Student code -> completed chore count
interface ChoreStats {
  [studentCode: string]: number;
}

const STORAGE_KEY_RECORDS = 'krujames_chore_records_v1';
const STORAGE_KEY_STATS = 'krujames_chore_stats_v1';

const DAYS_TH = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์'];
const DAYS_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const ChoreTracker: React.FC = () => {
  const allRosters = useMemo(() => loadAllRosters(), []);
  const classrooms = useMemo(() => Object.keys(allRosters).sort(), [allRosters]);

  const [selectedClass, setSelectedClass] = useState<string>(classrooms[0] || 'ป.1');
  const [choreRecords, setChoreRecords] = useState<ChoreRecord>({});
  const [choreStats, setChoreStats] = useState<ChoreStats>({});
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Load records on mount
  useEffect(() => {
    try {
      const rawRecords = localStorage.getItem(STORAGE_KEY_RECORDS);
      const rawStats = localStorage.getItem(STORAGE_KEY_STATS);
      if (rawRecords) setChoreRecords(JSON.parse(rawRecords));
      if (rawStats) setChoreStats(JSON.parse(rawStats));
    } catch (e) {
      console.error('Failed to load chore tracking data', e);
    }
  }, []);

  const saveChoreData = (newRecords: ChoreRecord, newStats: ChoreStats) => {
    setChoreRecords(newRecords);
    setChoreStats(newStats);
    try {
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(newRecords));
      localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(newStats));
    } catch (e) {
      console.warn('Failed to save chore data', e);
    }
  };

  const currentRoster = useMemo(() => {
    return loadRoster(selectedClass);
  }, [selectedClass]);

  // Deterministically divide classroom into 5 chore groups (Monday - Friday)
  const choreGroups = useMemo(() => {
    const groups: Record<string, StudentInfo[]> = {
      'Monday': [],
      'Tuesday': [],
      'Wednesday': [],
      'Thursday': [],
      'Friday': []
    };

    currentRoster.forEach((student) => {
      const dayIndex = (student.no - 1) % 5;
      const dayName = DAYS_EN[dayIndex];
      groups[dayName].push(student);
    });

    return groups;
  }, [currentRoster]);

  // Check what day of the week it is
  const todayDayName = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay(); // 0: Sun, 1: Mon, ..., 6: Sat
    if (day >= 1 && day <= 5) return DAYS_EN[day - 1];
    return 'Monday'; // Default to Monday on weekends
  }, [currentDate]);

  // Toggle check-in state
  const handleToggleCheckIn = (studentCode: string) => {
    const dayRecords = choreRecords[currentDate] || {};
    const isCompleted = !dayRecords[studentCode];

    const updatedDayRecords = {
      ...dayRecords,
      [studentCode]: isCompleted
    };

    const updatedRecords = {
      ...choreRecords,
      [currentDate]: updatedDayRecords
    };

    // Calculate updated stats
    const currentCount = choreStats[studentCode] || 0;
    const updatedStats = {
      ...choreStats,
      [studentCode]: isCompleted ? currentCount + 1 : Math.max(0, currentCount - 1)
    };

    saveChoreData(updatedRecords, updatedStats);
  };

  // Reset current day records
  const handleResetDay = () => {
    if (confirm('คุณต้องการรีเซ็ตการบันทึกเวรของวันนี้ใช่หรือไม่?')) {
      const dayRecords = choreRecords[currentDate] || {};
      const updatedStats = { ...choreStats };

      // Revert stats for checked students
      Object.keys(dayRecords).forEach(studentCode => {
        if (dayRecords[studentCode]) {
          updatedStats[studentCode] = Math.max(0, (updatedStats[studentCode] || 0) - 1);
        }
      });

      const updatedRecords = { ...choreRecords };
      delete updatedRecords[currentDate];

      saveChoreData(updatedRecords, updatedStats);
    }
  };

  // Completion percentage of today's duty
  const todayDutyStats = useMemo(() => {
    const todayStudents = choreGroups[todayDayName] || [];
    if (todayStudents.length === 0) return { total: 0, checked: 0, pct: 0 };

    const dayRecords = choreRecords[currentDate] || {};
    let checked = 0;
    todayStudents.forEach(s => {
      if (dayRecords[s.studentCode]) checked++;
    });

    return {
      total: todayStudents.length,
      checked,
      pct: Math.round((checked / todayStudents.length) * 100)
    };
  }, [choreGroups, todayDayName, choreRecords, currentDate]);

  // Top helper students (most chores completed)
  const topHelpers = useMemo(() => {
    return currentRoster
      .map(s => ({
        ...s,
        count: choreStats[s.studentCode] || 0
      }))
      .filter(s => s.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [currentRoster, choreStats]);

  return (
    <div className="chore-tracker-container">
      {/* Header and Class Selector */}
      <div className="section-header-chores">
        <div className="title-block">
          <Calendar className="header-icon" size={24} />
          <div>
            <h3>ตารางเวรประจำวันแสนสนุก</h3>
            <p>แบ่งกลุ่มจัดเวรทำความสะอาดห้องเรียนรายวัน</p>
          </div>
        </div>
        
        <div className="header-actions">
          <div className="date-input-group">
            <span className="select-label">วันที่ตรวจเวร:</span>
            <input 
              type="date" 
              value={currentDate} 
              onChange={(e) => setCurrentDate(e.target.value)} 
              className="custom-date-picker"
            />
          </div>
          <div className="class-selector">
            <span className="select-label">เลือกระดับชั้น:</span>
            <select 
              value={selectedClass} 
              onChange={(e) => setSelectedClass(e.target.value)}
              className="custom-select"
            >
              {classrooms.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Progress & Quick Actions */}
      <div className="chores-progress-banner glass-card">
        <div className="progress-left">
          <Clock size={20} className="text-blue" />
          <div>
            <h4>ตรวจเวรประจำวัน{DAYS_TH[DAYS_EN.indexOf(todayDayName)]} ({new Date(currentDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })})</h4>
            <p>สถิติวันนี้เช็คชื่อแล้ว {todayDutyStats.checked} / {todayDutyStats.total} คน ({todayDutyStats.pct}%)</p>
          </div>
        </div>
        <div className="progress-right">
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${todayDutyStats.pct}%` }}></div>
          </div>
          <button onClick={handleResetDay} className="btn-reset-day">
            <RefreshCw size={14} /> รีเซ็ตวันนี้
          </button>
        </div>
      </div>

      {/* Monday - Friday Schedule Columns */}
      <div className="chore-columns-grid">
        {DAYS_EN.map((dayName, idx) => {
          const isToday = dayName === todayDayName;
          const dayStudents = choreGroups[dayName] || [];
          const dayRecords = choreRecords[currentDate] || {};

          return (
            <div key={dayName} className={`chore-column ${isToday ? 'active-column' : ''}`}>
              <div className={`column-header ${isToday ? 'active-header' : ''}`}>
                <span className="day-badge">{DAYS_TH[idx].substring(0, 3)}</span>
                <span className="day-label">วัน{DAYS_TH[idx]}</span>
                {isToday && <span className="today-badge-lbl">วันนี้</span>}
              </div>

              <div className="column-body">
                {dayStudents.length === 0 ? (
                  <p className="no-students">ไม่มีเวร</p>
                ) : (
                  dayStudents.map((s) => {
                    const isChecked = isToday && !!dayRecords[s.studentCode];
                    const completedCount = choreStats[s.studentCode] || 0;

                    return (
                      <div 
                        key={s.studentCode} 
                        className={`chore-student-card ${isChecked ? 'completed' : ''} ${isToday ? 'clickable' : ''}`}
                        onClick={() => isToday && handleToggleCheckIn(s.studentCode)}
                      >
                        <div className="card-left">
                          {isToday ? (
                            <CheckSquare 
                              size={18} 
                              className={`check-icon ${isChecked ? 'checked' : 'unchecked'}`} 
                            />
                          ) : (
                            <span className="bullet-no">{s.no}</span>
                          )}
                          <span className="emoji">{s.emoji}</span>
                          <div className="name-block">
                            <span className="name text-truncate">{s.name.split(' ')[0]} {s.name.split(' ')[1] ? s.name.split(' ')[1].substring(0, 3) + '.' : ''}</span>
                            <span className="sub-info">เลขที่ {s.no}</span>
                          </div>
                        </div>
                        <div className="card-right">
                          <span className="stars-badge" title={`ทำเวรสำเร็จ ${completedCount} ครั้ง`}>
                            <Star size={11} fill={completedCount > 0 ? '#eab308' : 'none'} color="#eab308" />
                            <span className="count">{completedCount}</span>
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Leaderboard / Helper Section */}
      <div className="bottom-stats-row">
        <div className="helper-leaderboard-card glass-card">
          <div className="card-title">
            <Award size={18} className="text-yellow" />
            <h4>🏆 ยอดขยันประจำห้อง ({selectedClass})</h4>
          </div>
          <div className="helpers-grid">
            {topHelpers.length === 0 ? (
              <p className="empty-helpers">ยังไม่มีคะแนนสถิติการทำเวรประจำวัน</p>
            ) : (
              topHelpers.map((h, i) => (
                <div key={h.studentCode} className="helper-stat-item">
                  <div className="helper-avatar">
                    <span className="medal">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '👏'}</span>
                    <span className="avatar-emoji">{h.emoji}</span>
                  </div>
                  <span className="helper-name text-truncate">{h.name.split(' ')[0]}</span>
                  <span className="helper-count">
                    <strong>{h.count}</strong> ครั้ง
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`
        .chore-tracker-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          font-family: 'Prompt', sans-serif;
        }
        .section-header-chores {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          background: white;
          padding: 1.25rem 1.5rem;
          border-radius: 1.25rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          border: 1px solid #f1f5f9;
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .date-input-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .custom-date-picker {
          padding: 6px 10px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          font-size: 0.85rem;
          outline: none;
          color: #1e293b;
          font-weight: 500;
          font-family: 'Prompt', sans-serif;
        }
        .glass-card {
          background: white;
          border-radius: 1.25rem;
          padding: 1.25rem;
          border: 1px solid #f1f5f9;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .chores-progress-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }
        .progress-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .progress-left h4 {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 600;
          color: #1e293b;
        }
        .progress-left p {
          margin: 2px 0 0;
          font-size: 0.78rem;
          color: #64748b;
        }
        .progress-right {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
          justify-content: flex-end;
          min-width: 250px;
        }
        .progress-bar-container {
          flex: 1;
          max-width: 200px;
          height: 8px;
          background: #f1f5f9;
          border-radius: 4px;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          background: #2563eb;
          border-radius: 4px;
          transition: width 0.3s ease;
        }
        .btn-reset-day {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          background: #fee2e2;
          color: #b91c1c;
          border: none;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-reset-day:hover {
          background: #fecaca;
        }
        .chore-columns-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 1rem;
        }
        @media (max-width: 1024px) {
          .chore-columns-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (max-width: 640px) {
          .chore-columns-grid {
            grid-template-columns: 1fr;
          }
        }
        .chore-column {
          background: #f8fafc;
          border-radius: 1.25rem;
          border: 1px solid #f1f5f9;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-height: 250px;
        }
        .chore-column.active-column {
          background: #f0f7ff;
          border-color: #bfdbfe;
          box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.05);
        }
        .column-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: #e2e8f0;
          border-bottom: 1px solid #cbd5e1;
        }
        .column-header.active-header {
          background: #dbeafe;
          border-bottom-color: #bfdbfe;
        }
        .day-badge {
          font-size: 0.72rem;
          background: white;
          color: #475569;
          padding: 2px 6px;
          border-radius: 6px;
          font-weight: 600;
        }
        .column-header.active-header .day-badge {
          background: #2563eb;
          color: white;
        }
        .day-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #334155;
        }
        .today-badge-lbl {
          margin-left: auto;
          font-size: 0.65rem;
          background: #2563eb;
          color: white;
          padding: 1px 5px;
          border-radius: 4px;
          font-weight: 500;
        }
        .column-body {
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
        }
        .no-students {
          text-align: center;
          padding: 2rem;
          color: #94a3b8;
          font-size: 0.8rem;
        }
        .chore-student-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 10px;
          border-radius: 10px;
          background: white;
          border: 1px solid #e2e8f0;
          transition: all 0.2s;
          user-select: none;
        }
        .chore-student-card.clickable {
          cursor: pointer;
        }
        .chore-student-card.clickable:hover {
          border-color: #2563eb;
          transform: translateY(-1px);
        }
        .chore-student-card.completed {
          background: #ecfdf5;
          border-color: #a7f3d0;
        }
        .card-left {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
        }
        .bullet-no {
          font-size: 0.7rem;
          color: #94a3b8;
          width: 14px;
          text-align: center;
          font-weight: 500;
        }
        .check-icon {
          transition: color 0.2s;
        }
        .check-icon.checked { color: #10b981; }
        .check-icon.unchecked { color: #cbd5e1; }
        .chore-student-card.clickable:hover .check-icon.unchecked { color: #93c5fd; }
        .chore-student-card .emoji {
          font-size: 1rem;
        }
        .name-block {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .name-block .name {
          font-size: 0.8rem;
          font-weight: 500;
          color: #1e293b;
        }
        .chore-student-card.completed .name-block .name {
          color: #065f46;
          text-decoration: line-through;
          opacity: 0.8;
        }
        .name-block .sub-info {
          font-size: 0.65rem;
          color: #94a3b8;
        }
        .stars-badge {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 1px 4px;
          border-radius: 6px;
          font-size: 0.68rem;
          color: #64748b;
        }
        .chore-student-card.completed .stars-badge {
          background: #d1fae5;
          border-color: #a7f3d0;
          color: #065f46;
        }
        .stars-badge .count {
          font-weight: 600;
        }
        .bottom-stats-row {
          display: grid;
          grid-template-columns: 1fr;
        }
        .helper-leaderboard-card {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .helper-leaderboard-card .card-title {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .helper-leaderboard-card .card-title h4 {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 600;
          color: #1e293b;
        }
        .helpers-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
        }
        @media (max-width: 768px) {
          .helpers-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (max-width: 480px) {
          .helpers-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .empty-helpers {
          grid-column: 1 / -1;
          text-align: center;
          padding: 1.5rem;
          color: #94a3b8;
          font-size: 0.85rem;
        }
        .helper-stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 10px;
          background: #f8fafc;
          border: 1px solid #f1f5f9;
          border-radius: 12px;
          text-align: center;
        }
        .helper-avatar {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          background: #fff;
          border-radius: 50%;
          border: 1px solid #e2e8f0;
          margin-bottom: 6px;
        }
        .helper-avatar .medal {
          position: absolute;
          top: -6px;
          right: -6px;
          font-size: 1rem;
        }
        .avatar-emoji {
          font-size: 1.3rem;
        }
        .helper-name {
          font-size: 0.78rem;
          font-weight: 500;
          color: #475569;
          width: 100%;
        }
        .helper-count {
          font-size: 0.72rem;
          color: #64748b;
          margin-top: 2px;
        }
        .helper-count strong {
          color: #2563eb;
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  );
};

export default ChoreTracker;
