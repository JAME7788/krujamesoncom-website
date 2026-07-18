import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Play, Trophy, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Trash2, Repeat } from 'lucide-react';
import { useGameProgress } from '../../hooks/useGameProgress';
import './GameStyles.css';
import './CodingMaze.css';

type Cell = 'wall' | 'path' | 'start' | 'goal' | 'star';
type Cmd = 'up' | 'down' | 'left' | 'right';

interface Level {
  name: string;
  grid: Cell[][];
  start: [number, number];
  goal: [number, number];
  maxBlocks: number;
  hint?: string;
}

// '#' = กำแพง, '.' = ทางเดิน, 'S' = เริ่ม, 'G' = เป้าหมาย, '*' = ดาว (โบนัส)
const parseGrid = (rows: string[]): { grid: Cell[][]; start: [number, number]; goal: [number, number] } => {
  let start: [number, number] = [0, 0];
  let goal: [number, number] = [0, 0];
  const grid: Cell[][] = rows.map((row, y) =>
    row.split('').map((ch, x): Cell => {
      if (ch === '#') return 'wall';
      if (ch === 'S') { start = [x, y]; return 'start'; }
      if (ch === 'G') { goal = [x, y]; return 'goal'; }
      if (ch === '*') return 'star';
      return 'path';
    })
  );
  return { grid, start, goal };
};

const levels: Level[] = [
  {
    name: 'ก้าวแรก',
    ...parseGrid([
      '######',
      '#S..G#',
      '######',
    ]),
    maxBlocks: 5,
    hint: 'แค่เดินไปขวา 3 ครั้ง',
  },
  {
    name: 'หักมุม',
    ...parseGrid([
      '#######',
      '#S....#',
      '#####.#',
      '#G....#',
      '#######',
    ]),
    maxBlocks: 12,
    hint: 'ขวา 4 → ลง 2 → ซ้าย 4',
  },
  {
    name: 'เก็บดาวก่อน!',
    ...parseGrid([
      '########',
      '#S...*.#',
      '#.####.#',
      '#......#',
      '#G####.#',
      '########',
    ]),
    maxBlocks: 20,
    hint: 'ขึ้นเก็บ ⭐ ก่อนแล้วค่อยลงไปเป้าหมาย',
  },
  {
    name: 'ซิกแซก',
    ...parseGrid([
      '########',
      '#S.#..G#',
      '#..#.#.#',
      '##...#.#',
      '########',
    ]),
    maxBlocks: 15,
    hint: 'ลง 1 → ขวา 1 → ลง 1 → ขวา 2 → ขึ้น 2 → ขวา 2',
  },
  {
    name: 'เก็บดาวคู่',
    ...parseGrid([
      '#########',
      '#S..*...#',
      '###.###.#',
      '#*..#G..#',
      '#########',
    ]),
    maxBlocks: 25,
    hint: 'ขวาเก็บ ⭐ บน แล้วใช้ช่องกลางลงมาเก็บ ⭐ ล่าง จากนั้นอ้อมขวาไปเป้าหมาย',
  },
  {
    name: 'อุโมงค์เขาวงกต',
    ...parseGrid([
      '##########',
      '#S........#',
      '#.#######.#',
      '#.......G.#',
      '##########',
    ]),
    maxBlocks: 15,
    hint: 'เดินเลาะอุโมงค์ด้านบนหรือล่างเพื่ออ้อมไปหาเป้าหมาย G',
  },
  {
    name: 'หมุนรอบตัว',
    ...parseGrid([
      '#######',
      '#S.*.G#',
      '#.#.#.#',
      '#*...*#',
      '#######',
    ]),
    maxBlocks: 25,
    hint: 'ใช้ช่องซ้ายหรือขวาเพื่อลงมาด้านล่างและเก็บ ⭐ ให้ครบ',
  },
];

const CodingMaze: React.FC = () => {
  const [levelIdx, setLevelIdx] = useState(0);
  const [prevLevelIdx, setPrevLevelIdx] = useState(0);
  const [program, setProgram] = useState<{ cmd: Cmd; loop?: number }[]>([]);
  const [running, setRunning] = useState(false);
  const [pos, setPos] = useState<[number, number]>(() => levels[0].start);
  const [grid, setGrid] = useState<Cell[][]>(() => levels[0].grid.map(row => [...row]));
  const [collected, setCollected] = useState(0);
  const [solved, setSolved] = useState<boolean[]>(() => Array(levels.length).fill(false));
  const [message, setMessage] = useState<string>('');
  const [stepIdx, setStepIdx] = useState(-1);
  const recordGame = useGameProgress('coding-maze', 'Coding Maze');

  const level = levels[levelIdx];

  if (levelIdx !== prevLevelIdx) {
    setPrevLevelIdx(levelIdx);
    setProgram([]);
    setPos(level.start);
    setGrid(level.grid.map(row => [...row]));
    setRunning(false);
    setMessage('');
    setStepIdx(-1);
    setCollected(0);
  }

  const resetLevel = () => {
    setProgram([]);
    setPos(level.start);
    setGrid(level.grid.map(row => [...row]));
    setRunning(false);
    setMessage('');
    setStepIdx(-1);
    setCollected(0);
  };


  const addCmd = (cmd: Cmd) => {
    if (running) return;
    if (program.length >= level.maxBlocks) {
      setMessage(`⚠️ ใช้ได้สูงสุด ${level.maxBlocks} บล็อก`);
      return;
    }
    setProgram((p) => [...p, { cmd }]);
    setMessage('');
  };

  const removeBlock = (idx: number) => {
    setProgram((p) => p.filter((_, i) => i !== idx));
  };

  const expand = (prog: { cmd: Cmd; loop?: number }[]): Cmd[] => {
    const result: Cmd[] = [];
    prog.forEach((p) => {
      const times = p.loop || 1;
      for (let i = 0; i < times; i++) result.push(p.cmd);
    });
    return result;
  };

  const run = async () => {
    if (program.length === 0) {
      setMessage('🤔 ต้องวางบล็อกก่อนนะ!');
      return;
    }
    recordGame(solved.filter(Boolean).length);
    setRunning(true);
    setMessage('');
    setPos(level.start);
    setGrid(level.grid.map(row => [...row]));
    setCollected(0);

    const commands = expand(program);
    let [x, y] = level.start;
    let stars = 0;
    const collectedStars = new Set<string>();

    for (let i = 0; i < commands.length; i++) {
      setStepIdx(i);
      const cmd = commands[i];
      let [nx, ny] = [x, y];
      if (cmd === 'up') ny -= 1;
      if (cmd === 'down') ny += 1;
      if (cmd === 'left') nx -= 1;
      if (cmd === 'right') nx += 1;

      // Check wall / out of bounds
      if (
        ny < 0 || ny >= level.grid.length ||
        nx < 0 || nx >= level.grid[0].length ||
        level.grid[ny][nx] === 'wall'
      ) {
        setMessage(`💥 ชนกำแพง! (ขั้นที่ ${i + 1})`);
        setRunning(false);
        setStepIdx(-1);
        return;
      }

      x = nx; y = ny;
      setPos([x, y]);

      // Collect star
      const starKey = `${x},${y}`;
      if (level.grid[y][x] === 'star' && !collectedStars.has(starKey)) {
        collectedStars.add(starKey);
        stars += 1;
        setCollected(stars);
        setGrid((g) => {
          const ng = g.map(r => [...r]);
          ng[y][x] = 'path';
          return ng;
        });
      }

      // Check goal
      if (x === level.goal[0] && y === level.goal[1]) {
        const totalStars = level.grid.flat().filter(c => c === 'star').length;
        if (stars === totalStars) {
          setMessage(`🎉 เยี่ยม! ผ่านด่านนี้แล้ว เก็บดาวครบ ⭐${stars}/${totalStars}`);
          setSolved((s) => {
            const ns = [...s];
            ns[levelIdx] = true;
            const solvedCount = ns.filter(Boolean).length;
            recordGame(solvedCount);
            return ns;
          });
        } else {
          setMessage(`✅ ถึงเป้าหมายแล้ว! แต่ยังไม่ครบดาว ⭐${stars}/${totalStars}`);
        }
        setRunning(false);
        setStepIdx(-1);
        return;
      }

      // Animate delay
      await new Promise((r) => setTimeout(r, 350));
    }

    setMessage('🤖 โปรแกรมจบแล้ว แต่ยังไม่ถึงเป้าหมาย — ลองวางบล็อกเพิ่ม');
    setRunning(false);
    setStepIdx(-1);
  };

  const totalStars = level.grid.flat().filter(c => c === 'star').length;

  const arrows: { cmd: Cmd; icon: React.ReactNode; label: string }[] = [
    { cmd: 'up', icon: <ArrowUp size={20} />, label: 'ขึ้น' },
    { cmd: 'down', icon: <ArrowDown size={20} />, label: 'ลง' },
    { cmd: 'left', icon: <ArrowLeft size={20} />, label: 'ซ้าย' },
    { cmd: 'right', icon: <ArrowRight size={20} />, label: 'ขวา' },
  ];

  const arrowEmoji: Record<Cmd, string> = { up: '↑', down: '↓', left: '←', right: '→' };

  return (
    <div className="game-page">
      <div className="game-topbar">
        <Link to="/games" className="game-back"><ChevronLeft size={18} /> เกมทั้งหมด</Link>
        <h2>🤖 Coding Maze — โปรแกรมหุ่นยนต์</h2>
      </div>

      <div className="game-stats">
        <div className="gstat"><Trophy size={18} /> ผ่านแล้ว: <strong>{solved.filter(Boolean).length}/{levels.length}</strong></div>
        <div className="gstat">⭐ เก็บดาว: <strong>{collected}/{totalStars}</strong></div>
        <div className="gstat">🧩 บล็อกใช้: <strong>{program.length}/{level.maxBlocks}</strong></div>
      </div>

      <div className="maze-container">
        {/* Maze grid */}
        <div className="maze-side">
          <h3>🗺️ ด่าน {levelIdx + 1}: {level.name}</h3>
          {level.hint && <p className="maze-hint">💡 {level.hint}</p>}
          <div
            className="maze-grid"
            style={{
              gridTemplateColumns: `repeat(${grid[0]?.length || 0}, 1fr)`,
              maxWidth: `${(grid[0]?.length || 0) * 50}px`,
            }}
          >
            {grid.map((row, y) =>
              row.map((cell, x) => {
                const isRobot = pos[0] === x && pos[1] === y;
                const isStart = level.start[0] === x && level.start[1] === y;
                const isGoal = level.goal[0] === x && level.goal[1] === y;
                return (
                  <div key={`${x}-${y}`} className={`maze-cell maze-${cell}`}>
                    {isRobot && <div className="robot">🤖</div>}
                    {!isRobot && isGoal && <span>🏁</span>}
                    {!isRobot && !isGoal && cell === 'star' && <span>⭐</span>}
                    {!isRobot && !isGoal && isStart && cell !== 'star' && <span style={{ opacity: 0.3 }}>🟢</span>}
                  </div>
                );
              })
            )}
          </div>
          {message && <div className={`maze-msg ${message.includes('🎉') || message.includes('✅') ? 'success' : message.includes('💥') ? 'fail' : ''}`}>{message}</div>}
        </div>

        {/* Programming side */}
        <div className="prog-side">
          <h3>🧱 ลากบล็อกมาเรียงลำดับ</h3>
          <div className="block-palette">
            {arrows.map((a) => (
              <button
                key={a.cmd}
                className={`block-btn block-${a.cmd}`}
                onClick={() => addCmd(a.cmd)}
                disabled={running}
              >
                {a.icon} {a.label}
              </button>
            ))}
            <button
              className="block-btn block-loop"
              onClick={() => {
                if (program.length === 0) {
                  setMessage('💡 ลากคำสั่งก่อน แล้วใช้ Loop ครอบ');
                  return;
                }
                const last = program[program.length - 1];
                const next = [...program];
                next[next.length - 1] = { ...last, loop: (last.loop || 1) + 1 };
                setProgram(next);
              }}
              disabled={running}
              title="ทำซ้ำคำสั่งล่าสุด +1 ครั้ง"
            >
              <Repeat size={18} /> ทำซ้ำ +1
            </button>
          </div>

          <div className="program-area">
            {program.length === 0 ? (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem 0' }}>
                ↑ กดปุ่มข้างบนเพื่อเพิ่มบล็อกที่นี่
              </p>
            ) : (
              <div className="program-blocks">
                {program.map((b, i) => (
                  <div
                    key={i}
                    className={`prog-block prog-${b.cmd} ${stepIdx === i ? 'active' : ''}`}
                    onClick={() => !running && removeBlock(i)}
                    title="คลิกเพื่อลบ"
                  >
                    <span className="prog-arrow">{arrowEmoji[b.cmd]}</span>
                    {b.loop && b.loop > 1 && <span className="prog-loop">×{b.loop}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="prog-actions">
            <button className="btn-secondary" onClick={resetLevel} disabled={running}>
              <Trash2 size={16} /> ล้าง
            </button>
            <button className="btn-game-start" onClick={run} disabled={running}>
              <Play size={18} /> {running ? 'กำลังรัน...' : 'รันโปรแกรม'}
            </button>
          </div>
        </div>
      </div>

      {/* Level navigation */}
      <div className="level-nav">
        <h4>เลือกด่าน:</h4>
        <div className="level-pills">
          {levels.map((l, i) => (
            <button
              key={i}
              className={`level-pill ${i === levelIdx ? 'active' : ''} ${solved[i] ? 'solved' : ''}`}
              onClick={() => setLevelIdx(i)}
            >
              {solved[i] && '✓ '}ด่าน {i + 1}: {l.name}
            </button>
          ))}
        </div>
      </div>

      <div className="game-tips">
        💡 <strong>นี่คือพื้นฐานของ Code.org และ Scratch!</strong> — ลากบล็อกคำสั่งให้หุ่นยนต์ทำตามขั้นตอน → เก็บ ⭐ ทุกด่าน → ใช้ "ทำซ้ำ" ลดจำนวนบล็อก
      </div>
    </div>
  );
};

export default CodingMaze;
