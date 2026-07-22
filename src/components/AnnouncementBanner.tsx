import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, X, Pin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchAnnouncementsFromFirebase, getActiveAnnouncements } from '../services/announcementService';
import type { Announcement } from '../services/announcementService';

const typeStyles = {
  info:        { bg: 'linear-gradient(135deg,#dbeafe,#e0e7ff)', border: '#3b82f6', emoji: 'ℹ️' },
  warn:        { bg: 'linear-gradient(135deg,#fef3c7,#fde68a)', border: '#f59e0b', emoji: '⚠️' },
  urgent:      { bg: 'linear-gradient(135deg,#fee2e2,#fecaca)', border: '#dc2626', emoji: '🚨' },
  celebration: { bg: 'linear-gradient(135deg,#dcfce7,#bbf7d0)', border: '#16a34a', emoji: '🎉' },
};

const AnnouncementBanner: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Announcement[]>(() => getActiveAnnouncements(user?.classroom));
  const [dismissed, setDismissed] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('kj_dismissed_ann') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    let cancelled = false;
    fetchAnnouncementsFromFirebase().then(() => {
      if (!cancelled) setItems(getActiveAnnouncements(user?.classroom));
    });
    return () => { cancelled = true; };
  }, [user?.classroom]);

  const dismiss = (id: string) => {
    const next = [...dismissed, id];
    setDismissed(next);
    try {
      localStorage.setItem('kj_dismissed_ann', JSON.stringify(next));
    } catch (e) {
      console.debug('Dismiss storage failed', e);
    }
  };

  const visible = items.filter((a) => a.pinned || !dismissed.includes(a.id));
  if (visible.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '1.5rem' }}>
      <AnimatePresence>
        {visible.map((a) => {
          const s = typeStyles[a.type];
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -50 }}
              style={{
                background: s.bg,
                borderLeft: `4px solid ${s.border}`,
                borderRadius: 12,
                padding: '0.85rem 1.1rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{a.emoji || s.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <strong style={{ color: s.border }}>{a.title}</strong>
                  {a.pinned && <Pin size={14} style={{ color: s.border }} />}
                </div>
                <div style={{ fontSize: '0.88rem', marginTop: 4, color: '#374151' }}>{a.body}</div>
                <small style={{ color: '#9ca3af', fontSize: '0.75rem', display: 'block', marginTop: 4 }}>
                  📅 {new Date(a.createdAt).toLocaleDateString('th-TH')}
                  {a.classroom && ` • สำหรับห้อง ${a.classroom}`}
                </small>
              </div>
              {!a.pinned && (
                <button
                  onClick={() => dismiss(a.id)}
                  style={{
                    background: 'transparent', border: 0, cursor: 'pointer',
                    color: '#6b7280', padding: 2,
                  }}
                  title="ปิดการแจ้งเตือน"
                >
                  <X size={16} />
                </button>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export const AnnouncementIcon = Megaphone;
export default AnnouncementBanner;
