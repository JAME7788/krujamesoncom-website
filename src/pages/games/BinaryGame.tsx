import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, RotateCcw, CheckCircle2, XCircle, Lightbulb } from 'lucide-react';
import './GameStyles.css';

const binToDec = (bin: string) => parseInt(bin, 2);

const BinaryGame: React.FC = () => {
  const [target, setTarget] = useState(0);
  const [bits, setBits] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0]);
  const [checked, setChecked] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showHelp, setShowHelp] = useState(true);
  const [bestStreak, setBestStreak] = useState(() => parseInt(localStorage.getItem('kj_bin_best') || '0'));

  const newRound = () => {
    setTarget(Math.floor(Math.random() * 256));
    setBits([0, 0, 0, 0, 0, 0, 0, 0]);
    setChecked(null);
  };

  useEffect(() => {
    newRound();
  }, []);

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
      setScore((s) => s + 10);
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
        <div className="gstat">🏆 คะแนน: <strong>{score}</strong></div>
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
          {checked === 'correct' ? (
            <button className="btn-game-start" onClick={newRound}>
              <RotateCcw size={16} /> ข้อต่อไป →
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
