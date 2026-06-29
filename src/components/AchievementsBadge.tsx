import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trophy, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getAchievementStats, markSeen, checkAchievements, allAchievements
} from '../services/achievementService';
import { useToast } from './Toast';
import './AchievementsBadge.css';

const tierColor = {
  bronze: '#a16207',
  silver: '#6b7280',
  gold: '#f59e0b',
  diamond: '#06b6d4',
};

const AchievementsBadge: React.FC = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState(() => user ? getAchievementStats(user.id) : null);
  const toast = useToast();

  useEffect(() => {
    if (!user) return;
    // Re-check ทุก 5 วินาที
    const refresh = () => {
      const newlyUnlocked = checkAchievements(user.id);
      if (newlyUnlocked && newlyUnlocked.length > 0) {
        newlyUnlocked.forEach((id) => {
          const ach = allAchievements.find((a) => a.id === id);
          if (ach) {
            toast.show(`🏆 ยินดีด้วย! ปลดล็อกเหรียญตรา "${ach.title}": ${ach.desc}`, 'success');
          }
        });
      }
      setStats(getAchievementStats(user.id));
    };
    refresh();
    const t = setInterval(refresh, 20000);
    return () => clearInterval(t);
  }, [user, toast]);

  if (!user || !stats) return null;

  const handleOpen = () => {
    setOpen(true);
    if (user) markSeen(user.id);
  };

  return (
    <>
      <button className="ach-trigger" onClick={handleOpen}>
        <Trophy size={18} />
        <span>{stats.unlockedCount}/{stats.total}</span>
        {stats.pendingNotifications.length > 0 && (
          <span className="ach-badge-dot">{stats.pendingNotifications.length}</span>
        )}
      </button>

      {open && createPortal(
        <div className="ach-overlay" onClick={() => setOpen(false)}>
          <div className="ach-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ach-modal-head">
              <div>
                <h2>🏆 Achievements</h2>
                <p>ปลดล็อกแล้ว {stats.unlockedCount}/{stats.total} ({stats.percentage}%)</p>
                <div className="ach-progress">
                  <div className="ach-progress-fill" style={{ width: `${stats.percentage}%` }} />
                </div>
              </div>
              <button className="ach-close" onClick={() => setOpen(false)}><X size={20} /></button>
            </div>

            <div className="ach-tier-summary">
              {(['bronze', 'silver', 'gold', 'diamond'] as const).map((t) => (
                <div key={t} className="ach-tier" style={{ borderTopColor: tierColor[t] }}>
                  <span style={{ color: tierColor[t] }}>{stats.byTier[t]}</span>
                  <small>{t === 'bronze' ? 'ทองแดง' : t === 'silver' ? 'เงิน' : t === 'gold' ? 'ทอง' : 'เพชร'}</small>
                </div>
              ))}
            </div>

            <div className="ach-list">
              {stats.achievements.map((a) => (
                <div key={a.id} className={`ach-item ${a.unlocked ? 'unlocked' : 'locked'}`}>
                  <div className="ach-emoji" style={{ background: a.unlocked ? `${tierColor[a.tier]}20` : '#f3f4f6' }}>
                    {a.unlocked ? a.emoji : '🔒'}
                  </div>
                  <div className="ach-info">
                    <div className="ach-title">
                      {a.title}
                      <span className={`ach-tier-badge tier-${a.tier}`}>{a.tier}</span>
                    </div>
                    <div className="ach-desc">{a.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default AchievementsBadge;
