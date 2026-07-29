import React, { useCallback, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Play, Trophy, Heart, Clock } from 'lucide-react';
import { useGameProgress } from '../../hooks/useGameProgress';
import './GameStyles.css';
import './BugCatcher.css';

interface Bug {
  id: number;
  x: number;
  y: number;
  type: 'normal' | 'fast' | 'big' | 'good';
  born: number;
}

const BugCatcher: React.FC = () => {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [time, setTime] = useState(0);
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [running, setRunning] = useState(false);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [bestScore, setBestScore] = useState(() => parseInt(localStorage.getItem('kj_bug_best') || '0'));
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; emoji: string; ts: number }[]>([]);
  const arenaRef = useRef<HTMLDivElement>(null);
  const runningRef = useRef(running);
  const scoreRef = useRef(score);
  const recordGame = useGameProgress('bug-catcher', 'จับบั๊ก');
  useEffect(() => {
    runningRef.current = running;
  }, [running]);
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  const start = () => {
    setScore(0);
    setLives(3);
    setTime(0);
    setBugs([]);
    setRunning(true);
    setCombo(0);
    setMaxCombo(0);
    setParticles([]);
  };

  const endGame = useCallback(() => {
    setRunning(false);
    const finalScore = scoreRef.current;
    setBestScore((currentBest) => {
      if (finalScore > currentBest) {
        localStorage.setItem('kj_bug_best', String(finalScore));
        return finalScore;
      }
      return currentBest;
    });
    if (finalScore > 0) void recordGame(finalScore);
  }, [recordGame]);

  // Time + game over check
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setTime((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  // Spawn bugs
  useEffect(() => {
    if (!running) return;
    const spawnInterval = Math.max(400, 900 - time * 15); // เร็วขึ้นเรื่อยๆ
    const spawn = setInterval(() => {
      if (!arenaRef.current) return;
      const rect = arenaRef.current.getBoundingClientRect();
      const r = Math.random();
      let type: Bug['type'] = 'normal';
      if (r < 0.1) type = 'good';        // 🦋 ห้ามตี!
      else if (r < 0.3) type = 'fast';    // เร็ว หาย 0.8s
      else if (r < 0.45) type = 'big';    // ใหญ่ หาย 1.2s
      // เหลือ normal

      const bug: Bug = {
        id: Date.now() + Math.random(),
        x: Math.random() * (rect.width - 80) + 10,
        y: Math.random() * (rect.height - 80) + 10,
        type,
        born: Date.now(),
      };
      setBugs((prev) => [...prev, bug]);

      // Auto remove
      const lifetime = type === 'fast' ? 800 : type === 'big' ? 1200 : type === 'good' ? 1500 : 1500;
      setTimeout(() => {
        if (!runningRef.current) return;
        setBugs((prev) => {
          const exists = prev.find((b) => b.id === bug.id);
          if (exists && exists.type !== 'good') {
            // bug หนีไป — เสียชีวิต
            setLives((l) => {
              const next = Math.max(0, l - 1);
              if (next <= 0) {
                endGame();
              }
              return next;
            });
            setCombo(0);
          }
          return prev.filter((b) => b.id !== bug.id);
        });
      }, lifetime);
    }, spawnInterval);
    return () => clearInterval(spawn);
  }, [endGame, running, time]);

  // Cleanup particles
  useEffect(() => {
    if (particles.length === 0) return;
    const t = setTimeout(() => {
      const now = Date.now();
      setParticles((prev) => prev.filter((p) => now - p.ts < 700));
    }, 100);
    return () => clearTimeout(t);
  }, [particles]);

  const hit = (bug: Bug, e: React.MouseEvent) => {
    e.stopPropagation();
    if (bug.type === 'good') {
      // ตีผีเสื้อ — เสียคะแนน
      setLives((l) => {
        const next = Math.max(0, l - 1);
        if (next <= 0) {
          endGame();
        }
        return next;
      });
      setCombo(0);
      setParticles((p) => [...p, { id: Date.now(), x: bug.x, y: bug.y, emoji: '💔', ts: Date.now() }]);
    } else {
      const points = bug.type === 'fast' ? 20 : bug.type === 'big' ? 15 : 10;
      const bonusPoints = points + combo;
      setScore((s) => s + bonusPoints);
      setCombo((c) => {
        const next = c + 1;
        setMaxCombo((m) => Math.max(m, next));
        return next;
      });
      setParticles((p) => [...p, { id: Date.now(), x: bug.x, y: bug.y, emoji: `+${bonusPoints}`, ts: Date.now() }]);
    }
    setBugs((prev) => prev.filter((b) => b.id !== bug.id));
  };

  const bugEmoji = (type: Bug['type']) => {
    if (type === 'good') return '🦋';
    if (type === 'fast') return '🪲';
    if (type === 'big') return '🐛';
    return '🐞';
  };

  const bugSize = (type: Bug['type']) => {
    if (type === 'big') return 70;
    if (type === 'fast') return 40;
    return 50;
  };

  return (
    <div className="game-page">
      <div className="game-topbar">
        <Link to="/games" className="game-back"><ChevronLeft size={18} /> เกมทั้งหมด</Link>
        <h2>🐞 จับบั๊ก (Bug Catcher!)</h2>
      </div>

      <div className="game-stats">
        <div className="gstat"><Trophy size={18} /> คะแนน: <strong>{score}</strong></div>
        <div className="gstat">
          <Heart size={16} fill="red" color="red" /> ชีวิต:
          <strong>{'❤️'.repeat(lives) + '🤍'.repeat(3 - lives)}</strong>
        </div>
        <div className="gstat">🔥 Combo: <strong>{combo}</strong> (สูงสุด {maxCombo})</div>
        <div className="gstat"><Clock size={16} /> เวลา: <strong>{time}s</strong></div>
        <div className="gstat">🏆 Best: <strong>{bestScore}</strong></div>
      </div>

      <div className="bug-arena" ref={arenaRef}>
        {!running ? (
          <div className="game-overlay">
            <h1 style={{ fontSize: '3rem' }}>🐞</h1>
            {lives <= 0 ? (
              <>
                <h2>เกมจบ!</h2>
                <p>คะแนน: <strong style={{ fontSize: '1.5rem' }}>{score}</strong></p>
                <p>Combo สูงสุด: <strong>{maxCombo}</strong></p>
              </>
            ) : (
              <>
                <h2>จับบั๊กให้ทัน!</h2>
                <p>คลิกบั๊กก่อนหนีไป — ถ้าหนีได้เสียชีวิต</p>
                <ul style={{ textAlign: 'left', marginTop: 12, listStyle: 'none' }}>
                  <li>🐞 บั๊กธรรมดา = +10 คะแนน</li>
                  <li>🪲 บั๊กเร็ว = +20 (หายเร็ว!)</li>
                  <li>🐛 บั๊กใหญ่ = +15</li>
                  <li>🦋 ผีเสื้อ = <strong style={{ color: '#ef4444' }}>ห้ามตี! เสียชีวิต</strong></li>
                  <li>🔥 Combo: ตอบติดต่อกัน คะแนน bonus</li>
                </ul>
              </>
            )}
            <button className="btn-game-start" onClick={start}>
              <Play size={20} /> {lives <= 0 ? 'เล่นใหม่' : 'เริ่มจับบั๊ก!'}
            </button>
          </div>
        ) : (
          <>
            {bugs.map((b) => (
              <button
                key={b.id}
                className={`bug bug-${b.type}`}
                style={{
                  left: b.x,
                  top: b.y,
                  width: bugSize(b.type),
                  height: bugSize(b.type),
                  fontSize: bugSize(b.type) * 0.7,
                }}
                onClick={(e) => hit(b, e)}
              >
                {bugEmoji(b.type)}
              </button>
            ))}
            {particles.map((p) => (
              <div
                key={p.id}
                className="bug-particle"
                style={{ left: p.x, top: p.y }}
              >
                {p.emoji}
              </div>
            ))}
          </>
        )}
      </div>

      <div className="game-tips">
        💡 <strong>Debugging</strong> = หาและแก้ไขบั๊ก — ทักษะสำคัญของโปรแกรมเมอร์! ฝึกความเร็วและการจดจำสีโดยไม่กดผิด
      </div>
    </div>
  );
};

export default BugCatcher;
