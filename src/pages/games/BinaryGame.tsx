import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, RotateCcw, CheckCircle2, XCircle, Lightbulb } from 'lucide-react';
import { useGameProgress } from '../../hooks/useGameProgress';
import { createGameRoundGuard } from '../../utils/gameRoundGuard';
import { readGameRecord, writeGameRecord } from '../../utils/gameRecords';
import GameLearnCard from '../../components/GameLearnCard';
import './GameStyles.css';

const binToDec = (bin: string) => parseInt(bin, 2);
const SESSION_ROUNDS = 12;

type BinaryDifficulty = '4bit' | '6bit' | '8bit';

const DIFFICULTY_CONFIGS: Record<BinaryDifficulty, { name: string; maxVal: number; positions: number[] }> = {
  '4bit': { name: '🟢 4-Bit (0-15: ป.1-4)', maxVal: 15, positions: [8, 4, 2, 1] },
  '6bit': { name: '🔵 6-Bit (0-63: ป.5-6)', maxVal: 63, positions: [32, 16, 8, 4, 2, 1] },
  '8bit': { name: '🟠 8-Bit (0-255: ม.1-3)', maxVal: 255, positions: [128, 64, 32, 16, 8, 4, 2, 1] },
};

const makeTargets = (maxVal: number = 255) => {
  const values = Array.from({ length: maxVal + 1 }, (_, value) => value);
  for (let i = values.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }
  return values.slice(0, SESSION_ROUNDS);
};

const BinaryGame: React.FC = () => {
  const [roundGuard] = useState(createGameRoundGuard);
  const [difficulty, setDifficulty] = useState<BinaryDifficulty>('8bit');
  const [targets, setTargets] = useState(() => makeTargets(255));
  const [roundIndex, setRoundIndex] = useState(0);
  const [done, setDone] = useState(false);
  const target = targets[roundIndex];
  const [bits, setBits] = useState<number[]>(() => Array(8).fill(0));
  const [checked, setChecked] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showHelp, setShowHelp] = useState(true);
  const [bestStreak, setBestStreak] = useState(() => readGameRecord('kj_bin_best'));
  const recordGame = useGameProgress('binary', 'แปลงเลขฐานสอง');

  const positions = DIFFICULTY_CONFIGS[difficulty].positions;

  const changeDifficulty = (nextDiff: BinaryDifficulty) => {
    roundGuard.reset();
    setDifficulty(nextDiff);
    const newTgts = makeTargets(DIFFICULTY_CONFIGS[nextDiff].maxVal);
    setTargets(newTgts);
    setRoundIndex(0);
    setBits(Array(DIFFICULTY_CONFIGS[nextDiff].positions.length).fill(0));
    setChecked(null);
    setScore(0);
    setStreak(0);
    setDone(false);
  };

  const newRound = () => {
    if (done || checked !== 'correct' || !roundGuard.claim(`next-${roundIndex}`)) return;
    if (roundIndex + 1 >= targets.length) {
      setDone(true);
      void recordGame(score, undefined, targets.length * 10);
      return;
    }
    setRoundIndex((value) => value + 1);
    setBits(Array(positions.length).fill(0));
    setChecked(null);
  };

  const restart = () => {
    roundGuard.reset();
    setTargets(makeTargets(DIFFICULTY_CONFIGS[difficulty].maxVal));
    setRoundIndex(0);
    setBits(Array(positions.length).fill(0));
    setChecked(null);
    setScore(0);
    setStreak(0);
    setDone(false);
  };

  const toggle = (idx: number) => {
    if (checked === 'correct') return;
    const next = [...bits];
    next[idx] = next[idx] === 0 ? 1 : 0;
    setBits(next);
    setChecked(null);
  };

  const current = binToDec(bits.join(''));

  const check = () => {
    if (done || checked === 'correct') return;
    if (current === target) {
      if (!roundGuard.claim(`answer-${roundIndex}`)) return;
      setChecked('correct');
      const nextScore = score + 10;
      setScore(nextScore);
      const ns = streak + 1;
      setStreak(ns);
      if (ns > bestStreak) { setBestStreak(ns); writeGameRecord('kj_bin_best', ns); }
    } else {
      setChecked('wrong');
      setStreak(0);
    }
  };

  return (
    <div className="game-page">
      <div className="game-topbar">
        <Link to="/games" className="game-back"><ChevronLeft size={18} /> เกมทั้งหมด</Link>
        <h2>🔢 แปลงเลขฐานสอง (Binary)</h2>
      </div>

      <div className="game-stats">
        <GameLearnCard gameKey="binary" />
        <div className="gstat">🏆 คะแนน: <strong>{score}</strong></div>
        <div className="gstat">🔢 ข้อ: <strong>{Math.min(roundIndex + 1, targets.length)}/{targets.length}</strong></div>
        <div className="gstat">🔥 ติดต่อกัน: <strong>{streak}</strong></div>
        <div className="gstat">🎯 ดีที่สุด: <strong>{bestStreak}</strong></div>
        <button className="gstat" onClick={() => setShowHelp(!showHelp)}>
          <Lightbulb size={16} /> {showHelp ? 'ซ่อนคำใบ้' : 'แสดงคำใบ้'}
        </button>
      </div>

      {/* Difficulty selector */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', margin: '0.75rem 0' }}>
        <span style={{ fontSize: '0.88rem', fontWeight: 'bold', color: '#475569' }}>ระดับความยาก:</span>
        {(['4bit', '6bit', '8bit'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: difficulty === mode ? '2px solid #2563eb' : '1px solid #cbd5e1',
              background: difficulty === mode ? '#2563eb' : '#fff',
              color: difficulty === mode ? '#fff' : '#1e293b',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
            onClick={() => changeDifficulty(mode)}
          >
            {DIFFICULTY_CONFIGS[mode].name}
          </button>
        ))}
      </div>

      <div className="binary-card">
        <div className="binary-target">
          <p>แปลงเลขนี้เป็น Binary ({difficulty === '4bit' ? '4 หลัก' : difficulty === '6bit' ? '6 หลัก' : '8 หลัก'}):</p>
          <h1>{target}</h1>
        </div>

        <div className="bits-row">
          {positions.map((pos, i) => (
            <button
              key={i}
              className={`bit-btn ${bits[i] === 1 ? 'on' : ''}`}
              onClick={() => toggle(i)}
            >
              <span className="bit-value">{bits[i]}</span>
              {showHelp && <span className="bit-pos">{pos}</span>}
            </button>
          ))}
        </div>

        <div className="binary-current">
          <span>คุณกด: </span>
          <strong className="bin-string">{bits.join('')}</strong>
          <span> = </span>
          <strong className={`bin-decimal ${current === target ? 'match' : ''}`}>{current}</strong>
        </div>

        {checked === 'correct' && (
          <div className="puzzle-result success">
            <CheckCircle2 size={20} /> ถูกต้อง! +10 คะแนน
          </div>
        )}
        {checked === 'wrong' && (
          <div className="puzzle-result fail">
            <XCircle size={20} /> ยังไม่ใช่ — ลองนับใหม่ • ตอนนี้ {current}, ต้องการ {target}
          </div>
        )}

        <div className="puzzle-actions">
          {done ? (
            <div className="puzzle-result success">
              <CheckCircle2 size={20} /> จบเกมแล้ว ได้ {score}/{targets.length * 10} คะแนน
              <button className="btn-game-start" type="button" onClick={restart}><RotateCcw size={16} /> เล่นชุดใหม่</button>
            </div>
          ) : checked === 'correct' ? (
            <button className="btn-game-start" onClick={newRound}>
              <RotateCcw size={16} /> {roundIndex + 1 >= targets.length ? 'ดูผลการเล่น' : 'ข้อต่อไป →'}
            </button>
          ) : (
            <>
              <button className="btn-secondary" onClick={() => setBits(Array(positions.length).fill(0))}>
                <RotateCcw size={16} /> ล้าง
              </button>
              <button className="btn-game-start" onClick={check}>
                ✓ ตรวจคำตอบ
              </button>
            </>
          )}
        </div>
      </div>

      <div className="game-tips">
        💡 <strong>วิธีคิด:</strong> เลขแต่ละช่อง = 128, 64, 32, 16, 8, 4, 2, 1 → กด on (1) ให้รวมกันได้เท่ากับเป้าหมาย
        <br />ตัวอย่าง: <strong>5</strong> = 4 + 1 → 00000<u>1</u>0<u>1</u>
      </div>
    </div>
  );
};

export default BinaryGame;
