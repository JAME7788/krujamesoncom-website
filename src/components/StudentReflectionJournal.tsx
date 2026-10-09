import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  loadAllReflections,
  fetchGameReflectionsFromFirebase,
} from '../services/gameReflectionService';
import { allClassrooms2569 } from '../data/students2569';
import { gamesCatalog } from '../data/gamesCatalog';
import { BookOpen, Search, User, Calendar } from 'lucide-react';

export interface StudentReflectionJournalProps {
  studentId?: string;
  studentName?: string;
  classroom?: string;
  compact?: boolean;
}

type ReflectionModeFilter = 'all' | 'foundation' | 'challenge';

export const StudentReflectionJournal: React.FC<StudentReflectionJournalProps> = ({
  studentId,
  studentName,
  classroom: propClassroom,
  compact = false,
}) => {
  const [selectedClassroom, setSelectedClassroom] = useState<string>(propClassroom || 'all');
  const [selectedGame, setSelectedGame] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [modeFilter, setModeFilter] = useState<ReflectionModeFilter>('all');
  const [allRecords, setAllRecords] = useState(() => loadAllReflections());
  const [cloudStatus, setCloudStatus] = useState<'loading' | 'synced' | 'local'>('loading');

  useEffect(() => {
    let active = true;
    void fetchGameReflectionsFromFirebase(compact ? studentId : undefined)
      .then((records) => {
        if (!active) return;
        setAllRecords(records);
        setCloudStatus('synced');
      })
      .catch(() => {
        if (active) setCloudStatus('local');
      });
    return () => { active = false; };
  }, [compact, studentId]);

  // Filter records specifically for student if studentId / studentName provided
  const studentRecords = useMemo(() => {
    if (!studentId && !studentName) return allRecords;
    return allRecords.filter((r) => {
      const matchId = studentId && (r.studentId === studentId || r.studentCode === studentId);
      const matchName = studentName && r.studentName === studentName;
      return matchId || matchName;
    });
  }, [allRecords, studentId, studentName]);

  const targetRecords = compact ? studentRecords : allRecords;

  const stats = useMemo(() => {
    if (compact) {
      const totalCount = studentRecords.length;
      const challengeCount = studentRecords.filter((r) => r.challengeMode).length;
      const uniqueGamesCount = new Set(studentRecords.map((r) => r.gameId)).size;
      const challengeRatio = totalCount > 0 ? Math.round((challengeCount / totalCount) * 100) : 0;
      return { totalCount, challengeCount, uniqueGamesCount, challengeRatio };
    }
    const records = selectedClassroom === 'all'
      ? allRecords
      : allRecords.filter((record) => record.classroom === selectedClassroom);
    const totalCount = records.length;
    const challengeCount = records.filter((record) => record.challengeMode).length;
    return {
      totalCount,
      challengeCount,
      uniqueGamesCount: new Set(records.map((record) => record.gameId)).size,
      challengeRatio: totalCount > 0 ? Math.round((challengeCount / totalCount) * 100) : 0,
    };
  }, [allRecords, compact, studentRecords, selectedClassroom]);

  const filteredRecords = useMemo(() => {
    return targetRecords.filter((r) => {
      if (selectedClassroom !== 'all' && r.classroom !== selectedClassroom) return false;
      if (selectedGame !== 'all' && r.gameId !== selectedGame) return false;
      if (modeFilter === 'foundation' && r.challengeMode) return false;
      if (modeFilter === 'challenge' && !r.challengeMode) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = r.studentName.toLowerCase().includes(term);
        const matchesCode = r.studentCode.toLowerCase().includes(term);
        const matchesText = r.reflectionText.toLowerCase().includes(term);
        const matchesGame = r.gameTitle.toLowerCase().includes(term);
        if (!matchesName && !matchesCode && !matchesText && !matchesGame) return false;
      }
      return true;
    });
  }, [targetRecords, selectedClassroom, selectedGame, modeFilter, searchTerm]);

  if (compact) {
    return (
      <div className="section-card glass student-reflection-widget" style={{ marginBottom: 16, padding: '1.25rem 1.5rem', borderRadius: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.4rem' }}>📖</span>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#1e293b' }}>
                สมุดสะท้อนคิดการเรียนรู้ของฉัน (Reflection Journal)
              </h3>
            </div>
            <p style={{ margin: '3px 0 0', color: '#64748b', fontSize: '0.85rem' }}>
              ร่องรอยการคิดวิเคราะห์และบทเรียนที่ได้จากภารกิจเกมการเรียนรู้เชิงประจักษ์ (GBL)
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ background: cloudStatus === 'synced' ? '#ecfdf5' : '#f8fafc', padding: '3px 9px', borderRadius: 999, border: '1px solid #cbd5e1', fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
              {cloudStatus === 'loading' ? '⏳ กำลังซิงก์' : cloudStatus === 'synced' ? '☁️ ข้อมูลล่าสุด' : '💾 ข้อมูลในเครื่อง'}
            </span>
            <span style={{ background: '#f0fdf4', padding: '3px 9px', borderRadius: 999, border: '1px solid #bbf7d0', fontSize: '0.78rem', color: '#166534', fontWeight: 600 }}>
              📝 บันทึกแล้ว {stats.totalCount} ครั้ง
            </span>
            <span style={{ background: '#ede9fe', padding: '3px 9px', borderRadius: 999, border: '1px solid #ddd6fe', fontSize: '0.78rem', color: '#6b21a8', fontWeight: 600 }}>
              🚀 โหมดท้าทาย {stats.challengeCount} ครั้ง
            </span>
            <span style={{ background: '#eff6ff', padding: '3px 9px', borderRadius: 999, border: '1px solid #bfdbfe', fontSize: '0.78rem', color: '#1d4ed8', fontWeight: 600 }}>
              🎮 เล่นไป {stats.uniqueGamesCount} เกม
            </span>
          </div>
        </div>

        {studentRecords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.75rem 1rem', background: '#f8fafc', borderRadius: 14, border: '1.5px dashed #cbd5e1' }}>
            <div style={{ fontSize: '2rem', marginBottom: 6 }}>🌱</div>
            <h4 style={{ margin: '0 0 4px', color: '#334155', fontSize: '0.95rem' }}>ยังไม่มีบันทึกการสะท้อนคิด</h4>
            <p style={{ margin: '0 0 12px', fontSize: '0.82rem', color: '#64748b' }}>
              เมื่อเล่นเกมจบในแต่ละรอบ กด "สรุปการฝึกครั้งนี้" เพื่อบันทึกสิ่งที่ได้เรียนรู้และสะสมร่องรอยการเรียนรู้
            </p>
            <Link to="/games" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', padding: '6px 14px', textDecoration: 'none' }}>
              🎮 ไปเล่นเกมและสะท้อนคิด
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {studentRecords.slice(0, 4).map((record) => (
              <div
                key={record.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <strong style={{ fontSize: '0.85rem', color: '#0f766e' }}>
                      🎮 {record.gameTitle}
                    </strong>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        padding: '1px 6px',
                        borderRadius: 999,
                        fontWeight: 600,
                        background: record.challengeMode ? '#ede9fe' : '#dcfce7',
                        color: record.challengeMode ? '#6b21a8' : '#15803d',
                      }}
                    >
                      {record.challengeMode ? '🚀 ท้าทาย' : '🌱 พื้นฐาน'}
                    </span>
                  </div>

                  <p style={{ margin: '0 0 8px', fontSize: '0.78rem', color: '#64748b' }}>
                    🎯 {record.objective}
                  </p>

                  <div style={{ display: 'flex', gap: 6, marginBottom: 8, fontSize: '0.72rem', color: '#92400e' }}>
                    <span>⭐ {record.learningStars || (record.questionAnswered ? 3 : 1)}/3</span>
                    {record.attemptNumber && <span>• รอบที่ {record.attemptNumber}</span>}
                  </div>

                  <div
                    style={{
                      background: '#fffbeb',
                      border: '1px solid #fef3c7',
                      borderRadius: 8,
                      padding: '8px 10px',
                      fontSize: '0.82rem',
                      color: '#92400e',
                      lineHeight: 1.4,
                      fontStyle: 'italic',
                    }}
                  >
                    "{record.reflectionText}"
                  </div>
                </div>

                <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: '#94a3b8' }}>
                  <span>📅 {new Date(record.createdAt).toLocaleDateString('th-TH')}</span>
                  <span>{record.questionAnswered ? '✓ ผ่านคำถามเชื่อมโยง' : '○ ทบทวน'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="section-container" style={{ padding: '1rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.4rem' }}>📖</span>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>
              สมุดบันทึกการสะท้อนคิด (Student Reflection Journal)
            </h2>
          </div>
          <small style={{ color: '#64748b' }}>
            ร่องรอยหลักฐานการเรียนรู้เชิงประจักษ์ (GBL) จากการเล่นจริงของนักเรียน 36 เกม
          </small>
        </div>

        {/* Stats Summary Chips */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ background: '#f0fdf4', padding: '4px 10px', borderRadius: 999, border: '1px solid #bbf7d0', fontSize: '0.8rem', color: '#166534', fontWeight: 600 }}>
            📝 บันทึกทั้งหมด: {stats.totalCount} รายการ
          </div>
          <div style={{ background: '#eff6ff', padding: '4px 10px', borderRadius: 999, border: '1px solid #bfdbfe', fontSize: '0.8rem', color: '#1d4ed8', fontWeight: 600 }}>
            🚀 โหมดท้าทาย: {stats.challengeCount} ({stats.challengeRatio}%)
          </div>
          <div style={{ background: '#f8fafc', padding: '4px 10px', borderRadius: 999, border: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>
            🎮 ครอบคลุม: {stats.uniqueGamesCount}/36 เกม
          </div>
          <div style={{ background: cloudStatus === 'synced' ? '#ecfdf5' : '#f8fafc', padding: '4px 10px', borderRadius: 999, border: '1px solid #d1d5db', fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>
            {cloudStatus === 'loading' ? '⏳ กำลังดึงข้อมูล' : cloudStatus === 'synced' ? '☁️ ซิงก์คลาวด์แล้ว' : '💾 ใช้ข้อมูลในเครื่อง'}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 200px', position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, รหัสนักเรียน, หรือข้อความสะท้อนคิด..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '6px 8px 6px 30px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <select
              value={selectedClassroom}
              onChange={(e) => setSelectedClassroom(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.82rem', background: 'white' }}
            >
              <option value="all">ทุกชั้นเรียน (ป.1 - ม.3)</option>
              {allClassrooms2569.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.82rem', background: 'white' }}
            >
              <option value="all">ทุกเกม (36 เกม)</option>
              {gamesCatalog.map((g) => (
                <option key={g.id} value={g.id}>{g.emoji} {g.title}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value as ReflectionModeFilter)}
              style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.82rem', background: 'white' }}
            >
              <option value="all">ทุกโหมดภารกิจ</option>
              <option value="foundation">🌱 ฝึกพื้นฐาน (Foundation)</option>
              <option value="challenge">🚀 ท้าทายตัวเอง (Challenge)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Record Cards */}
      {filteredRecords.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem', background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', color: '#64748b' }}>
          <BookOpen size={40} style={{ opacity: 0.4, margin: '0 auto 10px' }} />
          <h4 style={{ margin: '0 0 6px', color: '#475569' }}>ยังไม่มีบันทึกการสะท้อนคิดที่ตรงกับเงื่อนไข</h4>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>
            เมื่อนักเรียนเล่นเกมและกด "สรุปการฝึกครั้งนี้" บันทึกจะปรากฏที่นี่โดยอัตโนมัติ
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {filteredRecords.map((record) => (
            <div
              key={record.id}
              className="card"
              style={{
                padding: '14px',
                background: '#ffffff',
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                {/* Header: Student & Game */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <User size={14} color="#0284c7" />
                      <strong style={{ fontSize: '0.9rem', color: '#1e293b' }}>{record.studentName}</strong>
                      <span style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '1px 6px', borderRadius: 4, color: '#475569' }}>
                        {record.classroom}
                      </span>
                    </div>
                    <small style={{ color: '#94a3b8', fontSize: '0.72rem' }}>รหัส {record.studentCode}</small>
                  </div>

                  <span style={{
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    borderRadius: 999,
                    fontWeight: 600,
                    background: record.challengeMode ? '#ede9fe' : '#dcfce7',
                    color: record.challengeMode ? '#6b21a8' : '#15803d',
                  }}>
                    {record.challengeMode ? '🚀 ท้าทาย' : '🌱 พื้นฐาน'}
                  </span>
                </div>

                {/* Game Title & Objective */}
                <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: 8, marginBottom: 10, border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f766e' }}>
                    🎮 {record.gameTitle}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                    🎯 เป้าหมาย: {record.objective}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 5, fontSize: '0.72rem', color: '#92400e' }}>
                    <span>⭐ ดาวการเรียนรู้ {record.learningStars || (record.questionAnswered ? 3 : 1)}/3</span>
                    {record.attemptNumber && <span>🔁 รอบที่ {record.attemptNumber}</span>}
                    {record.learnerStage && <span>🧭 {record.learnerStage === 'first' ? 'เริ่มต้น' : record.learnerStage === 'growing' ? 'กำลังพัฒนา' : 'ชำนาญ'}</span>}
                  </div>
                </div>

                {/* Reflection Quote */}
                <div style={{
                  padding: '10px 12px',
                  background: '#fffbeb',
                  borderRadius: 8,
                  border: '1px solid #fef3c7',
                  fontSize: '0.84rem',
                  color: '#92400e',
                  lineHeight: 1.5,
                  position: 'relative',
                }}>
                  <span style={{ fontWeight: 700, display: 'block', fontSize: '0.75rem', color: '#b45309', marginBottom: 4 }}>
                    💬 ข้อความสะท้อนคิดของผู้เรียน:
                  </span>
                  "{record.reflectionText}"
                </div>
                {record.recommendedNextStep && (
                  <div style={{ marginTop: 8, padding: '7px 10px', borderRadius: 8, background: '#eff6ff', color: '#1e40af', fontSize: '0.76rem' }}>
                    ➜ ขั้นต่อไป: {record.recommendedNextStep}
                  </div>
                )}
              </div>

              {/* Footer Timestamp */}
              <div style={{ marginTop: 12, paddingTop: 8, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#94a3b8' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={12} /> {new Date(record.createdAt).toLocaleDateString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span>{record.questionAnswered ? '✓ ตอบคำถามเชื่อมโยงผ่าน' : '○ กำลังทบทวน'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentReflectionJournal;
