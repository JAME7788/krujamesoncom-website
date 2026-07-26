import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, RotateCcw, CheckCircle2, XCircle, Lightbulb } from 'lucide-react';
import { useGameProgress } from '../../hooks/useGameProgress';
import GameLearnCard from '../../components/GameLearnCard';
import './GameStyles.css';

const binToDec = (bin: string) => parseInt(bin, 2);
const SESSION_ROUNDS = 12;

const makeTargets = () => {
  const values = Array.from({ length: 256 }, (_, value) => value);
  for (let i = values.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }
  return values.slice(0, SESSION_ROUNDS);
};

const BinaryGame: React.FC = () => {
  const [targets, setTargets] = useState(makeTargets);
  const [roundIndex, setRoundIndex] = useState(0);
  const [done, setDone] = useState(false);
  const target = targets[roundIndex];
  const [bits, setBits] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0]);
  const [checked, setChecked] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showHelp, setShowHelp] = useState(true);
  const [bestStreak, setBestStreak] = useState(() => parseInt(localStorage.getItem('kj_bin_best') || '0'));
  const recordGame = useGameProgress('binary', 'แปลงเลขฐานสอง');

  const newRound = () => {
    if (roundIndex + 1 >= targets.length) {
      setDone(true);
      void recordGame(score);
      return;
    }
    setRoundIndex((value) => value + 1);
    setBits([0, 0, 0, 0, 0, 0, 0, 0]);
    setChecked(null);
  };

  const restart = () => {
    setTargets(makeTargets());
    setRoundIndex(0);
    setBits([0, 0, 0, 0, 0, 0, 0, 0]);
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
    if (current === target) {
      setChecked('correct');
      const nextScore = score + 10;
      setScore(nextScore);
      // บันทึกเมื่อตอบถูกเท่านั้น พร้อมคะแนนจริง — ไม่ให้ฉลองตอนตอบผิด
      recordGame(nextScore);
      setStreak((st) => {
        const ns = st + 1;
        if (ns > bestStreak) {
          setBestStreak(ns);
          localStorage.setItem('kj_bin_best', String(ns));
        }
        return ns;
      });
    } else {
      setChecked('wrong');
      setStreak(0);
    }
  };

  const positions = [128, 64, 32, 16, 8, 4, 2, 1];

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

      <div className="binary-card">
        <div className="binary-target">
          <p>แปลงเลขนี้เป็น Binary:</p>
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
              <button className="btn-secondary" onClick={() => setBits([0,0,0,0,0,0,0,0])}>
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
