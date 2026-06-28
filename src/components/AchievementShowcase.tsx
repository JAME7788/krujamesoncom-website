import React, { useEffect, useState } from 'react';
import { Award, Trophy } from 'lucide-react';
import { getAchievementStats, checkAchievements } from '../services/achievementService';

interface Props {
  studentId: string;
}

const TIER_COLOR: Record<string, string> = {
  bronze: '#cd7f32',
  silver: '#9ca3af',
  gold: '#f59e0b',
  diamond: '#06b6d4',
};

const AchievementShowcase: React.FC<Props> = ({ studentId }) => {
  const [stats, setStats] = useState(() => getAchievementStats(studentId));

  useEffect(() => {
    if (!studentId) return;
    const refresh = () => {
      checkAchievements(studentId);    // ตรวจสอบ achievements ใหม่ก่อน
      setStats(getAchievementStats(studentId));
    };
    refresh();
    const t = setInterval(refresh, 3000);
    return () => clearInterval(t);
  }, [studentId]);

  // หา 3 อันที่ปลดล็อกล่าสุด + 3 อันที่ยังไม่ปลดล็อก
  const unlocked = stats.achievements
    .filter((a) => a.unlocked)
    .sort((a, b) => (b.unlockedAt || 0) - (a.unlockedAt || 0))
    .slice(0, 3);

  const locked = stats.achievements
    .filter((a) => !a.unlocked)
    .slice(0, 3);

  return (
    <div style={{
      padding: '1rem 1.25rem', borderRadius: 16, marginBottom: 16,
      background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.06), rgba(99, 102, 241, 0.06))',
      border: '1px solid rgba(168, 85, 247, 0.18)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Trophy size={18} color="#a855f7" />
          <strong style={{ fontSize: '1rem' }}>เหรียญตรา (Achievements)</strong>
        </div>
        <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
          ปลดล็อกแล้ว <strong style={{ color: '#a855f7' }}>{stats.unlockedCount}/{stats.total}</strong>
          ({stats.percentage}%)
        </div>
      </div>

      {/* progress bar */}
      <div style={{ height: 8, background: '#f3f4f6', borderRadius: 999, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{
          width: `${stats.percentage}%`, height: '100%',
          background: 'linear-gradient(90deg, #a855f7, #6366f1)',
          transition: 'width 0.4s',
        }} />
      </div>

      {/* unlocked recent */}
      {unlocked.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 600, marginBottom: 4 }}>🏆 ปลดล็อกล่าสุด</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {unlocked.map((a) => (
              <div
                key={a.id}
                title={`${a.title} — ${a.desc}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 999,
                  background: 'white',
                  border: `2px solid ${TIER_COLOR[a.tier]}`,
                  fontSize: '0.85rem',
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>{a.emoji}</span>
                <span style={{ fontWeight: 700 }}>{a.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* locked next goals */}
      {locked.length > 0 && (
        <div>
          <div style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 600, marginBottom: 4 }}>🔒 เป้าหมายถัดไป</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {locked.map((a) => (
              <div
                key={a.id}
                title={`${a.title} — ${a.desc}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 10px', borderRadius: 999,
                  background: '#f9fafb', border: '1px dashed #d1d5db',
                  opacity: 0.7, fontSize: '0.8rem',
                }}
              >
                <span style={{ filter: 'grayscale(1)' }}>{a.emoji}</span>
                <span style={{ color: '#6b7280' }}>{a.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {unlocked.length === 0 && (
        <div style={{ textAlign: 'center', padding: '0.5rem', color: '#6b7280', fontSize: '0.85rem' }}>
          <Award size={20} style={{ opacity: 0.4 }} /> เริ่มเรียนเพื่อปลดล็อกเหรียญตรา
        </div>
      )}
    </div>
  );
};

export default AchievementShowcase;
