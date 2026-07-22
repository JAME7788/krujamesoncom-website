import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, RotateCcw, CheckCircle2, XCircle, Lightbulb, Eraser } from 'lucide-react';
import { useGameProgress } from '../../hooks/useGameProgress';
import './GameStyles.css';

interface Pic {
  name: string;
  emoji: string;
  color: string;
  rows: string[]; // แต่ละแถวเป็นสตริงบิต เช่น "01100110"
}

// ภาพพิกเซล 8x8 — 1 = ระบาย, 0 = เว้นว่าง
const PICS: Pic[] = [
  { name: 'หัวใจ', emoji: '❤️', color: '#ef4444', rows: ['01100110', '11111111', '11111111', '11111111', '01111110', '00111100', '00011000', '00000000'] },
  { name: 'ดาว', emoji: '⭐', color: '#f59e0b', rows: ['00011000', '00011000', '11111111', '01111110', '00111100', '01100110', '11000011', '00000000'] },
  { name: 'หน้ายิ้ม', emoji: '🙂', color: '#eab308', rows: ['00111100', '01000010', '10100101', '10000001', '10100101', '10011001', '01000010', '00111100'] },
  { name: 'บ้าน', emoji: '🏠', color: '#f97316', rows: ['00011000', '00111100', '01111110', '11111111', '11011011', '11011011', '11111111', '11111111'] },
  { name: 'ต้นไม้', emoji: '🌳', color: '#22c55e', rows: ['00011000', '00111100', '01111110', '11111111', '00111100', '01111110', '00011000', '00011000'] },
];

const emptyGrid = (rows: string[]): number[][] => rows.map((r) => r.split('').map(() => 0));

const PixelArtGame: React.FC = () => {
  const [picIndex, setPicIndex] = useState(() => Math.floor(Math.random() * PICS.length));
  const pic = PICS[picIndex];
  const [grid, setGrid] = useState<number[][]>(() => emptyGrid(PICS[picIndex].rows));
  const [checked, setChecked] = useState<'correct' | 'wrong' | null>(null);
  const [showBits, setShowBits] = useState(true);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(() => parseInt(localStorage.getItem('kj_pixel_best') || '0', 10));
  const recordGame = useGameProgress('pixel-art', 'วาดภาพจากเลขฐานสอง');

  const target = useMemo(() => pic.rows.map((r) => r.split('').map((c) => Number(c))), [pic]);

  const toggle = (r: number, c: number) => {
    if (checked === 'correct') return;
    setChecked(null);
    setGrid((g) => g.map((row, ri) => (ri === r ? row.map((v, ci) => (ci === c ? (v === 0 ? 1 : 0) : v)) : row)));
  };

  const nextPic = () => {
    const next = Math.floor(Math.random() * PICS.length);
    setPicIndex(next);
    setGrid(emptyGrid(PICS[next].rows));
    setChecked(null);
  };

  const check = () => {
    recordGame(score);
    const win = grid.every((row, r) => row.every((v, c) => v === target[r][c]));
    if (win) {
      setChecked('correct');
      setScore((s) => s + 10);
      setStreak((st) => {
        const ns = st + 1;
        if (ns > best) { setBest(ns); localStorage.setItem('kj_pixel_best', String(ns)); }
        return ns;
      });
    } else {
      setChecked('wrong');
      setStreak(0);
    }
  };

  const wrongCount = grid.reduce((acc, row, r) => acc + row.reduce((a, v, c) => a + (v !== target[r][c] ? 1 : 0), 0), 0);

  return (
    <div className="game-page">
      <div className="game-topbar">
        <Link to="/games" className="game-back"><ChevronLeft size={18} /> เกมทั้งหมด</Link>
        <h2>🎨 วาดภาพจากเลขฐานสอง</h2>
      </div>

      <div className="game-stats">
        <div className="gstat">🏆 คะแนน: <strong>{score}</strong></div>
        <div className="gstat">🔥 ติดต่อกัน: <strong>{streak}</strong></div>
        <div className="gstat">🎯 ดีที่สุด: <strong>{best}</strong></div>
        <button className="gstat" onClick={() => setShowBits((s) => !s)}>
          <Lightbulb size={16} /> {showBits ? 'ซ่อนรหัสบิต' : 'แสดงรหัสบิต'}
        </button>
      </div>

      <div className="binary-card pixel-card">
        <p className="pixel-instruct">ระบายช่องให้ตรงกับ <strong>รหัสบิต</strong> ของแต่ละแถว (<strong>1</strong> = ระบาย, <strong>0</strong> = เว้นว่าง) แล้วดูว่าได้รูปอะไร!</p>

        <div className="pixel-wrap">
          {grid.map((row, r) => (
            <div key={r} className="pixel-row">
              {showBits && <code className="pixel-code">{pic.rows[r]}</code>}
              <div className="pixel-cells">
                {row.map((v, c) => {
                  const state = checked === 'correct' ? 'win' : v === 1 ? 'on' : 'off';
                  return (
                    <button
                      key={c}
                      className={`pixel-cell ${state}`}
                      style={checked === 'correct' && v === 1 ? { background: pic.color } : undefined}
                      onClick={() => toggle(r, c)}
                      aria-label={`ช่องแถว ${r + 1} คอลัมน์ ${c + 1}`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {checked === 'correct' && (
          <div className="puzzle-result success">
            <CheckCircle2 size={20} /> เก่งมาก! ได้รูป {pic.emoji} {pic.name} — +10 คะแนน
          </div>
        )}
        {checked === 'wrong' && (
          <div className="puzzle-result fail">
            <XCircle size={20} /> ยังไม่ตรง — มี {wrongCount} ช่องผิด ลองเทียบกับรหัสบิตอีกที
          </div>
        )}

        <div className="puzzle-actions">
          {checked === 'correct' ? (
            <button className="btn-game-start" onClick={nextPic}><RotateCcw size={16} /> รูปต่อไป →</button>
          ) : (
            <>
              <button className="btn-secondary" onClick={() => { setGrid(emptyGrid(pic.rows)); setChecked(null); }}>
                <Eraser size={16} /> ล้าง
              </button>
              <button className="btn-game-start" onClick={check}>✓ ตรวจคำตอบ</button>
            </>
          )}
        </div>
      </div>

      <div className="game-tips">
        💡 <strong>รู้ไหม?</strong> คอมพิวเตอร์เก็บรูปภาพเป็นเลข <strong>0</strong> กับ <strong>1</strong> — แต่ละช่องคือ 1 พิกเซล (จุดภาพ) = 1 บิต ภาพจริงมีล้านพิกเซล!
      </div>

      <style>{`
        .pixel-card { max-width: 560px; }
        .pixel-instruct { text-align: center; color: #475569; margin: 0 0 16px; line-height: 1.6; }
        .pixel-wrap { display: flex; flex-direction: column; gap: 4px; align-items: center; }
        .pixel-row { display: flex; align-items: center; gap: 10px; }
        .pixel-code { font-family: 'JetBrains Mono', Consolas, monospace; font-size: 0.9rem; letter-spacing: 2px; color: #6366f1; background: #eef2ff; padding: 3px 8px; border-radius: 6px; min-width: 96px; text-align: center; }
        .pixel-cells { display: flex; gap: 3px; }
        .pixel-cell { width: 30px; height: 30px; border-radius: 5px; border: 1px solid #e2e8f0; cursor: pointer; transition: background 0.12s, transform 0.05s; padding: 0; }
        .pixel-cell.off { background: #f8fafc; }
        .pixel-cell.on { background: #334155; border-color: #334155; }
        .pixel-cell.win { background: #f8fafc; border-color: #e2e8f0; }
        .pixel-cell:active { transform: scale(0.92); }
        @media (max-width: 520px) {
          .pixel-code { min-width: 74px; font-size: 0.72rem; letter-spacing: 1px; padding: 2px 5px; }
          .pixel-cell { width: 24px; height: 24px; }
        }
      `}</style>
    </div>
  );
};

export default PixelArtGame;
