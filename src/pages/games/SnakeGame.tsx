import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Play, Trophy, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import './GameStyles.css';
import './SnakeGame.css';

type Dir = 'U' | 'D' | 'L' | 'R';
type Pos = { x: number; y: number };

const SIZE = 18;
const SPEEDS = { easy: 200, medium: 130, hard: 80 };

const SnakeGame: React.FC = () => {
  const [snake, setSnake] = useState<Pos[]>([{ x: 9, y: 9 }, { x: 8, y: 9 }, { x: 7, y: 9 }]);
  const [food, setFood] = useState<Pos>({ x: 12, y: 9 });
  const [dir, setDir] = useState<Dir>('R');
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState<keyof typeof SPEEDS>('medium');
  const [bestScore, setBestScore] = useState(() => parseInt(localStorage.getItem('kj_snake_best') || '0'));
  const dirRef = useRef(dir);
  dirRef.current = dir;

  const randomFood = useCallback((snakeBody: Pos[]): Pos => {
    while (true) {
      const f = { x: Math.floor(Math.random() * SIZE), y: Math.floor(Math.random() * SIZE) };
      if (!snakeBody.some((s) => s.x === f.x && s.y === f.y)) return f;
    }
  }, []);

  const reset = () => {
    const initSnake = [{ x: 9, y: 9 }, { x: 8, y: 9 }, { x: 7, y: 9 }];
    setSnake(initSnake);
    setFood(randomFood(initSnake));
    setDir('R');
    setScore(0);
    setGameOver(false);
    setRunning(true);
  };

  // Game loop
  useEffect(() => {
    if (!running || gameOver) return;
    const tick = setInterval(() => {
      setSnake((prev) => {
        const head = prev[0];
        let nx = head.x, ny = head.y;
        if (dirRef.current === 'U') ny -= 1;
        if (dirRef.current === 'D') ny += 1;
        if (dirRef.current === 'L') nx -= 1;
        if (dirRef.current === 'R') nx += 1;

        // Wall collision
        if (nx < 0 || nx >= SIZE || ny < 0 || ny >= SIZE) {
          setGameOver(true);
          setRunning(false);
          return prev;
        }
        // Self collision
        if (prev.some((s) => s.x === nx && s.y === ny)) {
          setGameOver(true);
          setRunning(false);
          return prev;
        }

        const newHead = { x: nx, y: ny };
        const ate = nx === food.x && ny === food.y;
        const newSnake = [newHead, ...prev];
        if (!ate) newSnake.pop();
        else {
          setScore((s) => {
            const ns = s + 10;
            if (ns > bestScore) {
              setBestScore(ns);
              localStorage.setItem('kj_snake_best', String(ns));
            }
            return ns;
          });
          setFood(randomFood(newSnake));
        }
        return newSnake;
      });
    }, SPEEDS[speed]);
    return () => clearInterval(tick);
  }, [running, gameOver, food, speed, randomFood, bestScore]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!running) return;
      const cur = dirRef.current;
      const k = e.key;
      if ((k === 'ArrowUp' || k === 'w' || k === 'W') && cur !== 'D') setDir('U');
      else if ((k === 'ArrowDown' || k === 's' || k === 'S') && cur !== 'U') setDir('D');
      else if ((k === 'ArrowLeft' || k === 'a' || k === 'A') && cur !== 'R') setDir('L');
      else if ((k === 'ArrowRight' || k === 'd' || k === 'D') && cur !== 'L') setDir('R');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [running]);

  const tryDir = (d: Dir) => {
    const cur = dirRef.current;
    if (d === 'U' && cur === 'D') return;
    if (d === 'D' && cur === 'U') return;
    if (d === 'L' && cur === 'R') return;
    if (d === 'R' && cur === 'L') return;
    setDir(d);
  };

  return (
    <div className="game-page">
      <div className="game-topbar">
        <Link to="/games" className="game-back"><ChevronLeft size={18} /> เกมทั้งหมด</Link>
        <h2>🐍 งูกินผลไม้</h2>
      </div>

      <div className="game-stats">
        <div className="gstat"><Trophy size={18} /> คะแนน: <strong>{score}</strong></div>
        <div className="gstat">📏 ยาว: <strong>{snake.length}</strong></div>
        <div className="gstat">🏆 ดีที่สุด: <strong>{bestScore}</strong></div>
        <div className="gstat">⚡ ความเร็ว:
          <select
            value={speed}
            onChange={(e) => setSpeed(e.target.value as any)}
            style={{ marginLeft: 6, padding: '2px 6px', border: '1px solid #d1d5db', borderRadius: 4 }}
            disabled={running}
          >
            <option value="easy">🐢 ช้า</option>
            <option value="medium">🐰 กลาง</option>
            <option value="hard">🚀 เร็ว</option>
          </select>
        </div>
      </div>

      <div className="snake-wrap">
        <div className="snake-board" style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}>
          {Array.from({ length: SIZE * SIZE }).map((_, i) => {
            const x = i % SIZE;
            const y = Math.floor(i / SIZE);
            const isHead = snake[0].x === x && snake[0].y === y;
            const isBody = !isHead && snake.some((s) => s.x === x && s.y === y);
            const isFood = food.x === x && food.y === y;
            return (
              <div key={i} className={`snake-cell ${isHead ? 'head' : isBody ? 'body' : ''} ${isFood ? 'food' : ''}`}>
                {isFood && '🍎'}
                {isHead && (dir === 'U' ? '⬆️' : dir === 'D' ? '⬇️' : dir === 'L' ? '⬅️' : '➡️')}
              </div>
            );
          })}

          {(!running || gameOver) && (
            <div className="game-overlay">
              <h1 style={{ fontSize: '3rem' }}>🐍</h1>
              {gameOver ? (
                <>
                  <h2>เกมจบ!</h2>
                  <p>คะแนนของคุณ: <strong style={{ fontSize: '1.5rem' }}>{score}</strong></p>
                  <p>งูยาว <strong>{snake.length}</strong> ช่อง</p>
                  {score === bestScore && score > 0 && <p>🎉 สถิติใหม่!</p>}
                </>
              ) : (
                <>
                  <h2>กดเริ่มเล่น!</h2>
                  <p>📱 ใช้ปุ่มลูกศรด้านล่าง<br/>💻 หรือกด WASD / ปุ่มลูกศรบนคีย์บอร์ด</p>
                </>
              )}
              <button className="btn-game-start" onClick={reset}>
                <Play size={20} /> {gameOver ? 'เล่นใหม่' : 'เริ่มเลย'}
              </button>
            </div>
          )}
        </div>

        {/* Mobile controls */}
        <div className="snake-controls">
          <button onClick={() => tryDir('U')} className="snake-btn"><ArrowUp size={24} /></button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => tryDir('L')} className="snake-btn"><ArrowLeft size={24} /></button>
            <button onClick={() => tryDir('D')} className="snake-btn"><ArrowDown size={24} /></button>
            <button onClick={() => tryDir('R')} className="snake-btn"><ArrowRight size={24} /></button>
          </div>
        </div>
      </div>

      <div className="game-tips">
        💡 <strong>เกมงู</strong> สอนเรื่อง <strong>Loop, Conditional, Array</strong> ในแบบที่เห็นภาพได้ — งูเดินไปข้างหน้าเรื่อยๆ (Loop) ถ้าชนกำแพง/ตัวเอง = จบ (Condition)
      </div>
    </div>
  );
};

export default SnakeGame;
