import React, { useEffect, useState } from 'react';
import { Flame, Zap } from 'lucide-react';
import { computeGamification } from '../services/progressService';
import type { GamificationStats } from '../services/progressService';

interface Props {
  studentId: string;
}

const GamificationCard: React.FC<Props> = ({ studentId }) => {
  const [stats, setStats] = useState<GamificationStats | null>(null);

  useEffect(() => {
    if (!studentId) return;
    const recompute = () => setStats(computeGamification(studentId));
    recompute();
    // อัปเดตทุก 3 วิ — เผื่อนักเรียนเปิด Dashboard ค้างไว้แล้ว XP/Level ขึ้น
    const t = setInterval(recompute, 3000);
    return () => clearInterval(t);
  }, [studentId]);

  if (!stats) return null;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 10,
      padding: '1.25rem 1.5rem', borderRadius: 18, marginBottom: 16,
      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 60%, #fbbf24 100%)',
      boxShadow: '0 4px 14px rgba(251, 191, 36, 0.25)',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: 'rgba(255,255,255,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem',
        }}>
          {stats.title.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: '0.78rem', color: '#78350f', fontWeight: 600 }}>
            ยศของคุณ
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#78350f' }}>
            {stats.title.name}
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: '6px 14px', background: 'rgba(255,255,255,0.7)', borderRadius: 12 }}>
          <div style={{ fontSize: '0.7rem', color: '#78350f', fontWeight: 600 }}>LEVEL</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#92400e', lineHeight: 1 }}>{stats.level}</div>
        </div>
        {stats.streakDays >= 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '6px 12px', borderRadius: 999,
            background: stats.isActiveToday ? '#fee2e2' : '#f3f4f6',
            color: stats.isActiveToday ? '#dc2626' : '#6b7280',
            fontWeight: 700, fontSize: '0.95rem',
          }}>
            <Flame size={16} fill={stats.isActiveToday ? '#dc2626' : 'none'} />
            {stats.streakDays} วันติด
          </div>
        )}
      </div>

      {/* XP bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#78350f', marginBottom: 4, fontWeight: 600 }}>
          <span>
            <Zap size={12} style={{ verticalAlign: 'middle' }} /> XP {stats.levelXp} / {stats.xpInLevel}
          </span>
          <span>รวม {stats.xp} XP</span>
        </div>
        <div style={{
          height: 12, borderRadius: 999,
          background: 'rgba(255,255,255,0.5)', overflow: 'hidden', position: 'relative',
        }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${stats.progressPct}%`,
            background: 'linear-gradient(90deg, #f59e0b, #d97706)',
            transition: 'width 0.5s ease-out',
            borderRadius: 999,
          }} />
        </div>
        <div style={{ fontSize: '0.72rem', color: '#92400e', marginTop: 4, textAlign: 'center', fontWeight: 600 }}>
          อีก {Math.max(0, stats.xpInLevel - stats.levelXp)} XP จะถึง Level {stats.level + 1}
        </div>
      </div>

      <div style={{ fontSize: '0.72rem', color: '#78350f', opacity: 0.85, textAlign: 'center' }}>
        💡 ทำควิซ +10 XP/คะแนน · เล่นเกม/อ่านสื่อ +5 XP · อ่านสไลด์ +1 XP · เข้าทุกวัน 🔥 streak ไม่หาย
      </div>
    </div>
  );
};

export default GamificationCard;
