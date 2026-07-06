import React, { useEffect, useRef, useState } from 'react';
import { Flame, Zap } from 'lucide-react';
import { computeGamification, getProgress } from '../services/progressService';
import type { GamificationStats, BonusEntry } from '../services/progressService';
import { useToast } from './Toast';

interface Props {
  studentId: string;
}

const GamificationCard: React.FC<Props> = ({ studentId }) => {
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [recentBonuses, setRecentBonuses] = useState<BonusEntry[]>([]);
  const lastLevelRef = useRef<number | null>(null);
  const lastBonusCountRef = useRef<number | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (!studentId) return;
    const recompute = () => {
      const next = computeGamification(studentId);
      // ตรวจ bonus ใหม่จากครู → toast แจ้ง + อัปเดต showcase
      const prog = getProgress(studentId);
      const bonuses = prog.bonuses || [];
      setRecentBonuses(bonuses.slice(0, 5));
      const bonusCount = bonuses.length;
      // Toast ใหม่ก็ต่อเมื่อ:
      // 1. count เพิ่ม
      // 2. bonus ล่าสุดถูกแจกจริงๆ ไม่เกิน 30 วิที่แล้ว
      // → กันบั๊ก: cache เพิ่งโหลดตอน mount → นับ 0→5 → fake toast
      if (lastBonusCountRef.current !== null && bonusCount > lastBonusCountRef.current) {
        const newest = bonuses[0];
        // ข้ามการ toast สำหรับ reason ที่ widget อื่นแสดง toast อยู่แล้ว
        // (Daily → DailyQuestionWidget, Attend → QuickAttendance)
        const isFromOtherWidget =
          newest?.reason.startsWith('[Daily:') || newest?.reason.startsWith('[Attend:');
        if (newest && !isFromOtherWidget && (Date.now() - newest.awardedAt) < 30000) {
          toast.show(`${newest.emoji} +${newest.xp} XP จากครู — ${newest.reason}`, 'success');
        }
      }
      lastBonusCountRef.current = bonusCount;

      setStats((prev) => {
        // Level up celebration — เฉพาะกรณีที่ prev "เคยมีข้อมูลจริง" (xp > 0)
        // กันบั๊ก: cache เปล่าตอน mount → fetch เสร็จ → level พุ่งจาก 1 → 15 → fake celebrate
        const wasRealData = prev && prev.xp > 0;
        const isLevelUp = prev && next.level > prev.level;
        if (wasRealData && isLevelUp && lastLevelRef.current !== next.level) {
          lastLevelRef.current = next.level;
          setCelebrate(true);
          toast.show(`🎉 LEVEL UP! ตอนนี้คุณคือ ${next.title.emoji} ${next.title.name} (Level ${next.level})`, 'success');
          setTimeout(() => setCelebrate(false), 4000);
        } else if (!prev || prev.xp === 0) {
          // first mount หรือ cache เพิ่งโหลด — sync ref เงียบๆ
          lastLevelRef.current = next.level;
        }
        return next;
      });
    };
    recompute();
    // Quick follow-up หลัง 800ms เผื่อ Dashboard fetchStudentProgress เพิ่งเสร็จ
    // → นักเรียนไม่ต้องรอ 10 วิก่อนเห็น XP/Level จริง
    const quick = setTimeout(recompute, 800);
    const t = setInterval(recompute, 10000);
    return () => { clearTimeout(quick); clearInterval(t); };
  }, [studentId, toast]);

  if (!stats) return null;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 10,
      padding: '1.25rem 1.5rem', borderRadius: 18, marginBottom: 16,
      background: celebrate
        ? 'linear-gradient(135deg, #fde68a 0%, #fbbf24 40%, #f59e0b 100%)'
        : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 60%, #fbbf24 100%)',
      boxShadow: celebrate
        ? '0 0 32px rgba(251, 191, 36, 0.7), 0 4px 14px rgba(251, 191, 36, 0.4)'
        : '0 4px 14px rgba(251, 191, 36, 0.25)',
      transition: 'all 0.5s ease-out',
      animation: celebrate ? 'pulseGlow 1.2s ease-in-out 3' : undefined,
    }}>
      <style>{`
        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
      `}</style>
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

      {recentBonuses.length > 0 && (
        <div style={{
          padding: 10, borderRadius: 10,
          background: 'rgba(255, 255, 255, 0.55)',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <div style={{ fontSize: '0.78rem', color: '#78350f', fontWeight: 700 }}>
            🎁 รางวัลจากครู
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {recentBonuses.map((b, i) => (
              <div
                key={i}
                title={new Date(b.awardedAt).toLocaleString('th-TH')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '4px 10px', borderRadius: 999,
                  background: 'white', border: '1px solid #fbbf24',
                  fontSize: '0.78rem',
                }}
              >
                <span style={{ fontSize: '1.05rem' }}>{b.emoji}</span>
                <span>{b.reason}</span>
                <strong style={{ color: '#d97706' }}>+{b.xp}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ fontSize: '0.72rem', color: '#78350f', opacity: 0.85, textAlign: 'center' }}>
        💡 ทำควิซ +10 XP/คะแนน · เล่นเกม/อ่านสื่อ +5 XP · อ่านสไลด์ +1 XP · 🎁 ครูแจกรางวัล · เข้าทุกวัน 🔥 streak ไม่หาย
      </div>
    </div>
  );
};

export default GamificationCard;
