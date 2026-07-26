import React, { useState } from 'react';
import { BookOpen, X, Rocket, Lightbulb } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { gameLessons, ageTierFromClassroom, ageTierLabel } from '../data/gameLessons';

interface Props {
  /** คีย์บทเรียนใน gameLessons (เช่น 'pixel-art') */
  gameKey: string;
}

/** แปลงสี hex เป็น rgba — ใช้แทน color-mix() เพื่อให้เครื่องรุ่นเก่าในโรงเรียนแสดงผลได้ */
const rgba = (hex: string, alpha: number) => {
  const raw = hex.replace('#', '');
  const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
  const r = parseInt(full.slice(0, 2), 16) || 0;
  const g = parseInt(full.slice(2, 4), 16) || 0;
  const b = parseInt(full.slice(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/** ทำสีให้เข้มขึ้นสำหรับปลายไล่เฉดของหัวการ์ด */
const darken = (hex: string, amount = 0.42) => {
  const raw = hex.replace('#', '');
  const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
  const ch = [0, 2, 4].map((i) => Math.round((parseInt(full.slice(i, i + 2), 16) || 0) * (1 - amount)));
  return `rgb(${ch[0]}, ${ch[1]}, ${ch[2]})`;
};

/**
 * การ์ด "เรียนก่อนเล่น" — เปิดอัตโนมัติครั้งแรกที่เด็กเข้าเกม
 * เลือกความลึกของเนื้อหาตามระดับชั้นของนักเรียนโดยอัตโนมัติ
 */
const GameLearnCard: React.FC<Props> = ({ gameKey }) => {
  const { user } = useAuth();
  const lesson = gameLessons[gameKey];
  const seenKey = `kj_lesson_seen_${gameKey}`;
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(seenKey) !== '1';
    } catch {
      return true;
    }
  });

  if (!lesson) return null;

  const tier = ageTierFromClassroom(user?.classroom);
  const body = lesson[tier];

  const close = () => {
    setOpen(false);
    try { localStorage.setItem(seenKey, '1'); } catch { /* ignore */ }
  };

  const themeVars = {
    '--glc': lesson.color,
    '--glc-deep': darken(lesson.color),
    '--glc-soft': rgba(lesson.color, 0.09),
    '--glc-line': rgba(lesson.color, 0.26),
    '--glc-shadow': rgba(lesson.color, 0.45),
  } as React.CSSProperties;

  return (
    <>
      <button className="glc-open" onClick={() => setOpen(true)} style={themeVars}>
        <BookOpen size={16} /> บทเรียน
      </button>

      {open && (
        <div className="glc-overlay" onClick={close} role="dialog" aria-label={`บทเรียน ${lesson.title}`}>
          <section className="glc-card" onClick={(e) => e.stopPropagation()} style={themeVars}>
            <header className="glc-head">
              <button className="glc-x" onClick={close} aria-label="ปิด"><X size={18} /></button>
              <div className="glc-emoji">{lesson.emoji}</div>
              <span className="glc-badge">📚 เรียนก่อนเล่น · เนื้อหาสำหรับ {ageTierLabel[tier]}</span>
              <h2>{lesson.title}</h2>
              <p className="glc-subject">{lesson.subject}</p>
            </header>

            <div className="glc-body">
              <div className="glc-concept">
                <Lightbulb size={18} />
                <p>{body.concept}</p>
              </div>

              <h3 className="glc-h3">สิ่งที่ต้องรู้</h3>
              <ul className="glc-points">
                {body.points.map((pt, i) => (
                  <li key={i}>
                    <span className="glc-pt-icon">{pt.icon}</span>
                    <span>{pt.text}</span>
                  </li>
                ))}
              </ul>

              <div className="glc-example">
                <strong>ตัวอย่าง</strong>
                <p>{body.example}</p>
              </div>

              <h3 className="glc-h3">วิธีเล่น</h3>
              <ol className="glc-howto">
                {body.howTo.map((s, i) => (
                  <li key={i}><span className="glc-num">{i + 1}</span><span>{s}</span></li>
                ))}
              </ol>
            </div>

            <button className="glc-cta" onClick={close}>
              <Rocket size={19} /> เข้าใจแล้ว เริ่มเล่นเลย!
            </button>
          </section>
        </div>
      )}

      <style>{`
        .glc-open {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 999px; cursor: pointer;
          border: 2px solid var(--glc, #6366f1); background: #fff; color: var(--glc, #6366f1);
          font-family: inherit; font-weight: 800; font-size: 0.82rem;
          transition: background 0.15s, color 0.15s;
        }
        .glc-open:hover { background: var(--glc, #6366f1); color: #fff; }

        .glc-overlay {
          position: fixed; inset: 0; z-index: 9998;
          display: grid; place-items: center; padding: 16px;
          background: rgba(15, 23, 42, 0.62); backdrop-filter: blur(6px);
          animation: glcFade 0.18s ease;
        }
        @keyframes glcFade { from { opacity: 0; } to { opacity: 1; } }

        .glc-card {
          position: relative; width: min(560px, 100%); max-height: 88vh;
          display: flex; flex-direction: column;
          background: #fff; border-radius: 20px; overflow: hidden;
          box-shadow: 0 28px 70px rgba(15, 23, 42, 0.4);
          animation: glcUp 0.24s cubic-bezier(0.34, 1.4, 0.64, 1);
          font-family: 'Prompt', sans-serif;
        }
        @keyframes glcUp { from { transform: translateY(18px) scale(0.97); opacity: 0; } to { transform: none; opacity: 1; } }

        .glc-head {
          position: relative; padding: 22px 24px 20px; text-align: center; color: #fff;
          background: linear-gradient(140deg, var(--glc, #6366f1), var(--glc-deep, #312e81));
        }
        .glc-x {
          position: absolute; top: 12px; right: 12px;
          width: 34px; height: 34px; display: grid; place-items: center;
          border: 0; border-radius: 50%; cursor: pointer;
          background: rgba(255,255,255,0.22); color: #fff;
        }
        .glc-x:hover { background: rgba(255,255,255,0.35); }
        .glc-emoji {
          width: 74px; height: 74px; margin: 0 auto 10px;
          display: grid; place-items: center; font-size: 2.6rem;
          background: rgba(255,255,255,0.2); border-radius: 22px;
          box-shadow: inset 0 0 0 2px rgba(255,255,255,0.28);
        }
        .glc-badge {
          display: inline-block; padding: 4px 14px; border-radius: 999px;
          background: rgba(255,255,255,0.24); font-size: 0.74rem; font-weight: 800;
        }
        .glc-head h2 { margin: 9px 0 2px; font-size: 1.45rem; letter-spacing: 0; }
        .glc-subject { margin: 0; font-size: 0.85rem; opacity: 0.9; font-weight: 600; }

        .glc-body { padding: 20px 24px 8px; overflow-y: auto; }

        .glc-concept {
          display: flex; gap: 10px; align-items: flex-start;
          padding: 14px 16px; border-radius: 14px; margin-bottom: 18px;
          background: var(--glc-soft, #eef2ff);
          border: 1px solid var(--glc-line, #c7d2fe);
          color: #1e293b;
        }
        .glc-concept svg { flex-shrink: 0; color: var(--glc, #6366f1); margin-top: 2px; }
        .glc-concept p { margin: 0; font-size: 1rem; line-height: 1.68; font-weight: 600; }

        .glc-h3 {
          margin: 0 0 10px; font-size: 0.9rem; font-weight: 800; color: #475569;
          display: flex; align-items: center; gap: 7px;
        }
        .glc-h3::before { content: ''; width: 4px; height: 15px; border-radius: 3px; background: var(--glc, #6366f1); }

        .glc-points { list-style: none; margin: 0 0 18px; padding: 0; display: flex; flex-direction: column; gap: 9px; }
        .glc-points li {
          display: flex; align-items: center; gap: 11px;
          padding: 11px 13px; border-radius: 12px; background: #f8fafc; border: 1px solid #eef2f7;
          font-size: 0.94rem; line-height: 1.55; color: #1f2937;
        }
        .glc-pt-icon {
          flex-shrink: 0; width: 34px; height: 34px; display: grid; place-items: center;
          font-size: 1.25rem; background: #fff; border-radius: 10px; box-shadow: 0 1px 3px rgba(15,23,42,0.1);
        }

        .glc-example {
          padding: 13px 16px; border-radius: 12px; margin-bottom: 18px;
          background: #fffbeb; border: 1px dashed #fcd34d;
        }
        .glc-example strong { display: block; font-size: 0.78rem; color: #b45309; margin-bottom: 4px; }
        .glc-example p { margin: 0; font-size: 0.95rem; line-height: 1.6; color: #78350f; font-weight: 600; }

        .glc-howto { list-style: none; margin: 0 0 6px; padding: 0; display: flex; flex-direction: column; gap: 8px; }
        .glc-howto li { display: flex; align-items: center; gap: 11px; font-size: 0.92rem; color: #334155; line-height: 1.55; }
        .glc-num {
          flex-shrink: 0; width: 26px; height: 26px; display: grid; place-items: center;
          border-radius: 50%; background: var(--glc, #6366f1); color: #fff;
          font-size: 0.78rem; font-weight: 800;
        }

        .glc-cta {
          margin: 8px 20px 20px; padding: 14px; border: 0; border-radius: 14px; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 9px;
          background: linear-gradient(135deg, var(--glc, #6366f1), var(--glc-deep, #312e81));
          color: #fff; font-family: inherit; font-weight: 900; font-size: 1.02rem;
          box-shadow: 0 10px 20px -8px var(--glc-shadow, rgba(99,102,241,0.45));
        }
        .glc-cta:hover { filter: brightness(1.07); }

        @media (max-width: 480px) {
          .glc-head { padding: 18px 18px 16px; }
          .glc-head h2 { font-size: 1.2rem; }
          .glc-emoji { width: 62px; height: 62px; font-size: 2.1rem; }
          .glc-body { padding: 16px 18px 6px; }
          .glc-cta { margin: 6px 16px 16px; }
        }
      `}</style>
    </>
  );
};

export default GameLearnCard;
