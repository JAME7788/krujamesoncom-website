import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { GraduationCap, BookOpen, Award, TrendingUp, Calendar, Activity } from 'lucide-react';
import { getSummary } from '../services/progressService';
import { loadGrades, getSubjectsForClassroom, computeBreakdown, computeGrade } from '../services/gradeService';
import type { Subject } from '../services/gradeService';
import { loadRoster } from '../services/rosterService';
import { getUpcomingEvents, eventTypeInfo } from '../services/calendarService';
import { getAchievementStats } from '../services/achievementService';
import TrendChart from '../components/TrendChart';

const ParentPortal: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const studentInfo = useMemo(() => {
    if (!studentId) return;
    // studentId format: classroom_no_nameNoSpace
    const parts = studentId.split('_');
    if (parts.length < 3) return;
    const [classroom, noStr] = parts;
    const no = parseInt(noStr, 10);
    const roster = loadRoster(classroom);
    const found = roster.find((s) => s.no === no);
    if (found) {
      return { classroom, no, name: found.name, emoji: found.emoji };
    }
    return null;
  }, [studentId]);

  const summary = useMemo(() => studentId ? getSummary(studentId) : null, [studentId]);
  const achievements = useMemo(() => studentId ? getAchievementStats(studentId) : null, [studentId]);

  if (!studentId || !studentInfo) {
    return (
      <div className="container section-padding" style={{ paddingTop: '6rem', textAlign: 'center' }}>
        <h1>🔍 ไม่พบนักเรียน</h1>
        <p>QR Code หรือลิงก์อาจไม่ถูกต้อง</p>
        <Link to="/" className="btn-primary">กลับหน้าหลัก</Link>
      </div>
    );
  }

  const subjects = getSubjectsForClassroom(studentInfo.classroom);
  const events = getUpcomingEvents(studentInfo.classroom, 14);

  // Trend
  const trendData = (() => {
    if (!summary) return [];
    const byDay: Record<string, { total: number; count: number }> = {};
    summary.recentAttempts.forEach((a) => {
      const d = new Date(a.timestamp);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!byDay[k]) byDay[k] = { total: 0, count: 0 };
      byDay[k].total += a.percentage;
      byDay[k].count += 1;
    });
    return Object.entries(byDay)
      .map(([date, v]) => ({ date, value: Math.round(v.total / v.count) }))
      .sort((a, b) => a.date.localeCompare(b.date));
  })();

  return (
    <div className="container section-padding" style={{ paddingTop: '6rem', maxWidth: 900 }}>
      {/* Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)',
        padding: '1.5rem', borderRadius: 16, marginBottom: '1.5rem',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '0.85rem', color: '#5b21b6', fontWeight: 700 }}>👨‍👩‍👧 Portal สำหรับผู้ปกครอง</div>
        <h1 style={{ margin: '8px 0 4px' }}>
          {studentInfo.emoji} {studentInfo.name}
        </h1>
        <p style={{ color: '#6b7280', margin: 0 }}>
          ชั้น {studentInfo.classroom} • เลขที่ {studentInfo.no}
        </p>
      </div>

      {/* Key Stats */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: '1.5rem' }}>
          <StatCard icon={<BookOpen />} label="สไลด์ที่อ่าน" value={summary.totalSlidesViewed} color="#a855f7" />
          <StatCard icon={<Award />} label="คะแนนรวม" value={summary.totalPoints} color="#6366f1" />
          <StatCard icon={<Activity />} label="กิจกรรม" value={summary.totalActivities} color="#ec4899" />
          <StatCard icon={<TrendingUp />} label="หน่วยที่จบ" value={summary.unitsCompleted} color="#22c55e" />
        </div>
      )}

      {/* Grades */}
      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <GraduationCap /> ผลการเรียน
        </h2>
        {subjects.map((sub) => {
          const grades = loadGrades(studentInfo.classroom, sub.id as Subject);
          const grade = grades.find((g) => g.studentNo === studentInfo.no);
          if (!grade) return (
            <div key={sub.id} style={{ padding: '0.75rem 1rem', marginBottom: 8, background: '#f9fafb', borderRadius: 8 }}>
              <strong>{sub.emoji} {sub.title}</strong>
              <p style={{ color: '#9ca3af', margin: 0, fontSize: '0.85rem' }}>ยังไม่มีคะแนน</p>
            </div>
          );
          const breakdown = computeBreakdown(grade, studentInfo.classroom, sub.id as Subject);
          const finalGrade = computeGrade(grade, studentInfo.classroom, sub.id as Subject);
          return (
            <div key={sub.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '0.75rem 1rem', marginBottom: 8,
              background: '#f9fafb', borderRadius: 8,
            }}>
              <div>
                <strong>{sub.emoji} {sub.title}</strong>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                  เก็บ {breakdown.collected.toFixed(1)}/70 • สอบ {breakdown.exam}/30
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#6366f1' }}>{breakdown.total.toFixed(1)}/100</div>
                <div style={{
                  display: 'inline-block', padding: '2px 12px',
                  borderRadius: 999, fontSize: '0.78rem', fontWeight: 700,
                  background: parseFloat(finalGrade) >= 3 ? '#dcfce7' : parseFloat(finalGrade) >= 2 ? '#fef3c7' : '#fee2e2',
                  color: parseFloat(finalGrade) >= 3 ? '#166534' : parseFloat(finalGrade) >= 2 ? '#92400e' : '#991b1b',
                }}>
                  เกรด {finalGrade}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Trend Chart */}
      {trendData.length > 0 && (
        <section className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ marginTop: 0 }}>📈 พัฒนาการคะแนนควิซ</h2>
          <TrendChart data={trendData} title="" color="#6366f1" />
        </section>
      )}

      {/* Achievements */}
      {achievements && (
        <section className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ marginTop: 0 }}>🏆 ความสำเร็จ</h2>
          <p style={{ color: '#6b7280', margin: '0 0 12px' }}>
            ปลดล็อก {achievements.unlockedCount}/{achievements.total} ({achievements.percentage}%)
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {achievements.achievements.filter(a => a.unlocked).slice(0, 12).map((a) => (
              <div key={a.id} style={{
                padding: '6px 12px', background: '#fef3c7', borderRadius: 999,
                fontSize: '0.85rem', fontWeight: 600,
              }} title={a.desc}>
                {a.emoji} {a.title}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      {events.length > 0 && (
        <section className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar /> กิจกรรมที่กำลังจะถึง
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {events.slice(0, 5).map((e) => {
              const info = eventTypeInfo[e.type];
              return (
                <div key={e.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', background: '#fafafa', borderRadius: 8,
                  borderLeft: `3px solid ${info.color}`,
                }}>
                  <div style={{ fontSize: '1.4rem' }}>{e.emoji || info.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <strong>{e.title}</strong>
                    <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{info.label} • {e.date}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.8rem', marginTop: '2rem' }}>
        🔒 ข้อมูลนี้สำหรับผู้ปกครองของ {studentInfo.name} เท่านั้น
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: number; color: string }> = ({ icon, label, value, color }) => (
  <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
    <div style={{ color, marginBottom: 4 }}>{icon}</div>
    <div style={{ fontSize: '1.6rem', fontWeight: 800, color }}>{value}</div>
    <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{label}</div>
  </div>
);

export default ParentPortal;
