import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, RotateCcw, Trophy, Clock } from 'lucide-react';
import './GameStyles.css';

const themes = {
  emoji: ['🐶', '🐱', '🐭', '🐰', '🦊', '🐻', '🐼', '🐨'],
  fruit: ['🍎', '🍌', '🍇', '🍉', '🍊', '🍓', '🥝', '🍒'],
  tech:  ['💻', '⌨️', '🖱️', '📱', '🎧', '📷', '🔋', '💾'],
};

interface Card {
  id: number;
  symbol: string;
  flipped: boolean;
  matched: boolean;
}

const MemoryMatch: React.FC = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [theme, setTheme] = useState<keyof typeof themes>('emoji');
  const [bestMoves, setBestMoves] = useState(() => parseInt(localStorage.getItem('kj_mem_best') || '999'));

  const shuffle = (arr: any[]) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const start = (selected: keyof typeof themes = theme) => {
    const symbols = themes[selected];
    const pairs = [...symbols, ...symbols];
    const shuffled = shuffle(pairs).map((s, i) => ({ id: i, symbol: s, flipped: false, matched: false }));
    setCards(shuffled);
    setFlipped([]);
    setMoves(0);
    setMatches(0);
    setTime(0);
    setRunning(true);
  };

  // timer
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setTime((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  // check match
  useEffect(() => {
    if (flipped.length !== 2) return;
    const [a, b] = flipped;
    setMoves((m) => m + 1);
    if (cards[a].symbol === cards[b].symbol) {
      // match!
      setTimeout(() => {
        setCards((prev) => prev.map((c, i) => i === a || i === b ? { ...c, matched: true } : c));
        setFlipped([]);
        setMatches((m) => {
          const next = m + 1;
          if (next === themes[theme].length) {
            setRunning(false);
            if (moves + 1 < bestMoves) {
              setBestMoves(moves + 1);
              localStorage.setItem('kj_mem_best', String(moves + 1));
            }
          }
          return next;
        });
      }, 500);
    } else {
      // no match
      setTimeout(() => {
        setCards((prev) => prev.map((c, i) => i === a || i === b ? { ...c, flipped: false } : c));
        setFlipped([]);
      }, 1000);
    }
  }, [flipped]);

  const flip = (idx: number) => {
    if (flipped.length >= 2) return;
    if (cards[idx].flipped || cards[idx].matched) return;
    setCards((prev) => prev.map((c, i) => i === idx ? { ...c, flipped: true } : c));
    setFlipped((f) => [...f, idx]);
  };

  const won = matches === themes[theme].length && cards.length > 0;

  return (
    <div className="game-page">
      <div className="game-topbar">
        <Link to="/games" className="game-back"><ChevronLeft size={18} /> เกมทั้งหมด</Link>
        <h2>🃏 จับคู่ความจำ</h2>
      </div>

      <div className="game-stats">
        <div className="gstat"><Trophy size={18} /> จำนวนครั้ง: <strong>{moves}</strong></div>
        <div className="gstat">✅ จับคู่ได้: <strong>{matches}/{themes[theme].length}</strong></div>
        <div className="gstat"><Clock size={18} /> เวลา: <strong>{time}s</strong></div>
        <div className="gstat">🏆 ดีที่สุด: <strong>{bestMoves === 999 ? '-' : `${bestMoves} ครั้ง`}</strong></div>
      </div>

      {!running && cards.length === 0 && (
        <div className="puzzle-card" style={{ textAlign: 'center' }}>
          <h2>🃏 เลือกธีมก่อนเริ่ม</h2>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', margin: '16px 0' }}>
            {(['emoji', 'fruit', 'tech'] as const).map((t) => (
              <button
                key={t}
                className={`mode-btn ${theme === t ? 'active' : ''}`}
                onClick={() => setTheme(t)}
              >
                {themes[t].slice(0, 4).join('')} {t === 'emoji' ? 'สัตว์' : t === 'fruit' ? 'ผลไม้' : 'เทคโนโลยี'}
              </button>
            ))}
          </div>
          <button className="btn-game-start" onClick={() => start(theme)}>
            <RotateCcw size={20} /> เริ่มเล่น
          </button>
        </div>
      )}

      {cards.length > 0 && (
        <>
          <div className="memory-grid">
            {cards.map((c, i) => (
              <div
                key={c.id}
                className={`mem-card ${c.flipped ? 'flipped' : ''} ${c.matched ? 'matched' : ''}`}
                onClick={() => flip(i)}
              >
                <div className="mem-card-inner">
                  <div className="mem-card-front">?</div>
                  <div className="mem-card-back">{c.symbol}</div>
                </div>
              </div>
            ))}
          </div>

          {won && (
            <div className="puzzle-result success" style={{ marginTop: 16 }}>
              🎉 เก่งมาก! ใช้ {moves} ครั้ง • {time} วินาที
              {moves <= bestMoves && <strong> — สถิติใหม่!</strong>}
            </div>
          )}

          <div className="puzzle-actions">
            <button className="btn-secondary" onClick={() => { setCards([]); setRunning(false); }}>
              เปลี่ยนธีม
            </button>
            <button className="btn-game-start" onClick={() => start(theme)}>
              <RotateCcw size={16} /> เล่นใหม่
            </button>
          </div>
        </>
      )}

      <div className="game-tips">
        💡 <strong>ฝึกความจำ</strong> — มองดีๆ จำตำแหน่งของการ์ด แล้วจับคู่ที่เหมือนกันให้ครบ
      </div>
    </div>
  );
};

export default MemoryMatch;
