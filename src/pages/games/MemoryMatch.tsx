import React, { useState, useEffect, useReducer, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, RotateCcw, Trophy, Clock, Pause, Play } from 'lucide-react';
import { useGameProgress } from '../../hooks/useGameProgress';
import { createMemoryRound, emptyMemoryRound, memoryReducer } from '../../utils/memoryEngine';
import { readGameRecord, writeGameRecord } from '../../utils/gameRecords';
import './GameStyles.css';

const themes = {
  emoji: ['🐶', '🐱', '🐭', '🐰', '🦊', '🐻', '🐼', '🐨'],
  fruit: ['🍎', '🍌', '🍇', '🍉', '🍊', '🍓', '🥝', '🍒'],
  tech: ['💻', '⌨️', '🖱️', '📱', '🎧', '📷', '🔋', '💾'],
};

const MemoryMatch: React.FC = () => {
  const [round, dispatch] = useReducer(memoryReducer, undefined, emptyMemoryRound);
  const roundId = useRef(0);
  const { cards, moves, matches, paused } = round;
  const running = round.phase === 'playing' || round.phase === 'resolving';
  const won = round.phase === 'complete';
  const [pairCount, setPairCount] = useState(8);
  const [time, setTime] = useState(0);
  const [theme, setTheme] = useState<keyof typeof themes>('emoji');
  const bestKey = `kj_mem_best_${theme}_${pairCount}`;
  const storedBest = readGameRecord(bestKey, 999);
  const bestMoves = won ? Math.min(moves, storedBest) : storedBest;
  const recordGame = useGameProgress('memory', 'จับคู่ความจำ');

  const start = () => {
    roundId.current += 1;
    dispatch({ type: 'start', round: createMemoryRound(themes[theme].slice(0, pairCount), roundId.current) });
    setTime(0);
  };

  useEffect(() => {
    if (!running || paused) return;
    const timer = setInterval(() => setTime((seconds) => seconds + 1), 1000);
    return () => clearInterval(timer);
  }, [running, paused, round.id]);

  useEffect(() => {
    if (round.phase !== 'resolving' || paused) return;
    const [a, b] = round.selected;
    const timeout = setTimeout(() => dispatch({ type: 'resolve', roundId: round.id }), cards[a].symbol === cards[b].symbol ? 500 : 1000);
    return () => clearTimeout(timeout);
  }, [round.phase, round.selected, round.id, cards, paused]);

  useEffect(() => {
    if (!won) return;
    if (moves < readGameRecord(bestKey, 999)) writeGameRecord(bestKey, moves);
    void recordGame(matches, `${theme}-${pairCount}-pairs`, pairCount);
  }, [bestKey, matches, moves, pairCount, recordGame, theme, won]);

  return (
    <div className="game-page">
      <div className="game-topbar">
        <Link to="/games" className="game-back"><ChevronLeft size={18} /> เกมทั้งหมด</Link>
        <h2>🃏 จับคู่ความจำ</h2>
      </div>
      <div className="game-stats">
        <div className="gstat"><Trophy size={18} /> จำนวนครั้ง: <strong>{moves}</strong></div>
        <div className="gstat">จับคู่ได้: <strong>{matches}/{pairCount}</strong></div>
        <div className="gstat"><Clock size={18} /> เวลา: <strong>{time}s</strong></div>
        <div className="gstat">ดีที่สุด: <strong>{bestMoves === 999 ? '-' : `${bestMoves} ครั้ง`}</strong></div>
        {running && <button type="button" className="gstat" onClick={() => dispatch({ type: 'pause' })} aria-label={paused ? 'เล่นต่อ' : 'พักเกม'} title={paused ? 'เล่นต่อ' : 'พักเกม'}>{paused ? <Play size={18} /> : <Pause size={18} />}{paused ? 'เล่นต่อ' : 'พักเกม'}</button>}
      </div>
      {cards.length === 0 && (
        <div className="puzzle-card" style={{ textAlign: 'center' }}>
          <h2>เลือกธีมก่อนเริ่ม</h2>
          <label>ระดับความยาก <select value={pairCount} onChange={(event) => setPairCount(Number(event.target.value))} aria-label="ระดับความยาก"><option value={4}>ง่าย · 4 คู่</option><option value={6}>ปานกลาง · 6 คู่</option><option value={8}>ท้าทาย · 8 คู่</option></select></label>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', margin: '16px 0' }}>
            {(['emoji', 'fruit', 'tech'] as const).map((value) => (
              <button type="button" key={value} className={`mode-btn ${theme === value ? 'active' : ''}`} onClick={() => setTheme(value)} aria-pressed={theme === value}>
                {themes[value].slice(0, 4).join('')} {value === 'emoji' ? 'สัตว์' : value === 'fruit' ? 'ผลไม้' : 'เทคโนโลยี'}
              </button>
            ))}
          </div>
          <button type="button" className="btn-game-start" onClick={start}><Play size={20} /> เริ่มเล่น</button>
        </div>
      )}
      {cards.length > 0 && (
        <>
          <div className={`memory-grid ${paused ? 'memory-paused' : ''}`} aria-label="กระดานจับคู่">
            {cards.map((card, index) => (
              <button type="button" key={index} className={`mem-card ${card.flipped ? 'flipped' : ''} ${card.matched ? 'matched' : ''}`}
                onClick={() => dispatch({ type: 'flip', index })}
                aria-label={`การ์ด ${index + 1}${card.matched ? ' จับคู่แล้ว' : card.flipped && !paused ? ` ${card.symbol}` : ''}`}
                aria-pressed={card.flipped} disabled={!running || paused || card.matched || round.phase === 'resolving'}>
                <div className="mem-card-inner" aria-hidden="true"><div className="mem-card-front">?</div><div className="mem-card-back">{card.symbol}</div></div>
              </button>
            ))}
          </div>
          {paused && <p className="memory-pause-status" role="status">พักเกมอยู่</p>}
          {won && <div className="puzzle-result success" style={{ marginTop: 16 }} role="status">เก่งมาก! ใช้ {moves} ครั้ง • {time} วินาที{moves <= bestMoves && <strong> — สถิติใหม่!</strong>}</div>}
          <div className="puzzle-actions">
            <button type="button" className="btn-secondary" onClick={() => { dispatch({ type: 'reset' }); setTime(0); }}>เปลี่ยนธีมและระดับ</button>
            <button type="button" className="btn-game-start" onClick={start}><RotateCcw size={16} /> เล่นใหม่</button>
          </div>
        </>
      )}
      <div className="game-tips">💡 <strong>ฝึกความจำ</strong> — มองดีๆ จำตำแหน่งของการ์ด แล้วจับคู่ที่เหมือนกันให้ครบ</div>
    </div>
  );
};

export default MemoryMatch;
