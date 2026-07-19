import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, RotateCcw } from 'lucide-react';
import { useGameProgress } from '../../hooks/useGameProgress';

interface Device { emoji: string; name: string; use: string }

const DEVICES: Device[] = [
  { emoji: '🖱️', name: 'เมาส์', use: 'เลื่อนตัวชี้และคลิก' },
  { emoji: '⌨️', name: 'แป้นพิมพ์', use: 'พิมพ์ตัวอักษรและตัวเลข' },
  { emoji: '🖥️', name: 'จอภาพ', use: 'แสดงภาพและข้อความ' },
  { emoji: '🖨️', name: 'เครื่องพิมพ์', use: 'พิมพ์งานลงกระดาษ' },
  { emoji: '🎧', name: 'หูฟัง', use: 'ฟังเสียงส่วนตัว' },
  { emoji: '📷', name: 'กล้องเว็บแคม', use: 'ถ่ายภาพและวิดีโอคอล' },
  { emoji: '💾', name: 'แฟลชไดรฟ์', use: 'เก็บและพกพาไฟล์' },
  { emoji: '🔊', name: 'ลำโพง', use: 'เปิดเสียงให้ทุกคนได้ยิน' },
];

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

const DeviceMatch: React.FC = () => {
  const recordGame = useGameProgress('device-match', 'จับคู่อุปกรณ์คอมพิวเตอร์');
  const [order, setOrder] = useState<Device[]>(() => shuffle(DEVICES));
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const current = order[idx];
  const options = useMemo(() => {
    const wrong = shuffle(DEVICES.filter((d) => d.name !== current.name)).slice(0, 3);
    return shuffle([current, ...wrong]);
  }, [current]);

  const pick = (name: string) => {
    if (picked) return;
    setPicked(name);
    const correct = name === current.name;
    if (correct) setScore((s) => s + 1);
    setTimeout(() => {
      if (idx + 1 >= order.length) {
        setDone(true);
        recordGame(score + (correct ? 1 : 0));
      } else {
        setIdx((i) => i + 1);
        setPicked(null);
      }
    }, 900);
  };

  const restart = () => {
    setOrder(shuffle(DEVICES)); setIdx(0); setScore(0); setPicked(null); setDone(false);
  };

  return (
    <div className="container section-padding" style={{ paddingTop: '5rem', maxWidth: 640, textAlign: 'center' }}>
      <Link to="/games" className="btn-ghost" style={{ float: 'left' }}><ChevronLeft size={16} /> เกมทั้งหมด</Link>
      <h1>🔌 จับคู่อุปกรณ์คอมพิวเตอร์</h1>
      <p style={{ color: '#6b7280' }}>ดูรูปแล้วเลือกชื่อที่ถูกต้อง — เหมาะกับ ป.1-3</p>

      {done ? (
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ fontSize: '3rem' }}>{score >= 6 ? '🏆' : score >= 4 ? '😃' : '💪'}</div>
          <h2>ได้ {score}/{order.length} คะแนน!</h2>
          <p>{score >= 6 ? 'เก่งมาก! รู้จักอุปกรณ์ครบเลย' : 'ลองอีกครั้งให้ได้คะแนนเต็มนะ'}</p>
          <button className="btn-primary" onClick={restart}><RotateCcw size={16} /> เล่นอีกครั้ง</button>
        </div>
      ) : (
        <>
          <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: 8 }}>
            ข้อ {idx + 1}/{order.length} • คะแนน {score}
          </div>
          <div className="card" style={{ padding: '2rem 1.5rem' }}>
            <div style={{ fontSize: '5rem', marginBottom: 8 }}>{current.emoji}</div>
            <p style={{ color: '#6b7280', margin: '0 0 4px' }}>อุปกรณ์นี้ใช้ {current.use}</p>
            <strong style={{ fontSize: '1.1rem' }}>อุปกรณ์นี้คืออะไร?</strong>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
              {options.map((o) => {
                const isPicked = picked === o.name;
                const isCorrect = o.name === current.name;
                const show = picked !== null;
                return (
                  <button
                    key={o.name}
                    onClick={() => pick(o.name)}
                    disabled={show}
                    style={{
                      padding: '14px', borderRadius: 12, fontSize: '1.05rem', fontWeight: 700,
                      fontFamily: 'inherit', cursor: show ? 'default' : 'pointer',
                      background: show ? (isCorrect ? '#22c55e' : isPicked ? '#ef4444' : 'white') : 'white',
                      color: show && (isCorrect || isPicked) ? 'white' : '#1f2937',
                      border: '2px solid ' + (show && isCorrect ? '#16a34a' : '#e5e7eb'),
                      transition: 'all 0.2s',
                    }}
                  >
                    {o.name}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DeviceMatch;
