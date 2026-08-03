import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  ChevronLeft,
  Eraser,
  Lightbulb,
  Paintbrush,
  RotateCcw,
  Trophy,
} from 'lucide-react';
import GameLearnCard from '../../components/GameLearnCard';
import { useGameProgress } from '../../hooks/useGameProgress';
import { COLOR_CODE_LEVELS, type ColorId } from './colorCodePixelData';
import './ColorCodePixelGame.css';

const PALETTE: Array<{ id: ColorId; name: string; color: string }> = [
  { id: 0, name: 'ว่าง', color: '#ffffff' },
  { id: 1, name: 'ดำ', color: '#172033' },
  { id: 2, name: 'แดง', color: '#ef3340' },
  { id: 3, name: 'ฟ้า', color: '#25a7e8' },
  { id: 4, name: 'เหลือง', color: '#ffc928' },
  { id: 5, name: 'เขียว', color: '#34b66b' },
  { id: 6, name: 'ม่วง', color: '#8b5cf6' },
  { id: 7, name: 'ส้ม', color: '#ff842b' },
];

const parseRows = (rows: string[]): ColorId[][] => rows.map((row) => (
  row.split('').map((value) => Number(value) as ColorId)
));

const blankGrid = (size: number): ColorId[][] => (
  Array.from({ length: size }, () => Array.from({ length: size }, () => 0 as ColorId))
);

const ColorCodePixelGame: React.FC = () => {
  const [levelIndex, setLevelIndex] = useState(0);
  const [grid, setGrid] = useState<ColorId[][]>(() => blankGrid(10));
  const [selectedColor, setSelectedColor] = useState<ColorId>(1);
  const [drawing, setDrawing] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [hints, setHints] = useState(0);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<'idle' | 'wrong' | 'correct' | 'finished'>('idle');
  const recordGame = useGameProgress('color-code-pixel', 'ภารกิจระบายสีตามรหัสพิกเซล');

  const level = COLOR_CODE_LEVELS[levelIndex];
  const target = useMemo(() => parseRows(level.rows), [level]);
  const wrongCount = useMemo(() => grid.reduce((sum, row, rowIndex) => (
    sum + row.filter((value, colIndex) => value !== target[rowIndex][colIndex]).length
  ), 0), [grid, target]);
  const targetColorCount = target.flat().filter((value) => value !== 0).length;
  const completedColorCount = grid.reduce((sum, row, rowIndex) => (
    sum + row.filter((value, colIndex) => value !== 0 && value === target[rowIndex][colIndex]).length
  ), 0);
  const progressPercent = Math.round((completedColorCount / Math.max(1, targetColorCount)) * 100);
  const usedColors = useMemo(() => PALETTE.filter((item) => (
    target.some((row) => row.includes(item.id))
  )), [target]);

  const paint = (rowIndex: number, colIndex: number) => {
    if (result === 'correct' || result === 'finished') return;
    setResult('idle');
    setGrid((current) => current.map((row, r) => (
      r === rowIndex ? row.map((value, c) => c === colIndex ? selectedColor : value) : row
    )));
  };

  const resetCanvas = () => {
    setGrid(blankGrid(10));
    setAttempts(0);
    setHints(0);
    setResult('idle');
  };

  const revealHint = () => {
    const mismatch = grid.flatMap((row, rowIndex) => row.map((value, colIndex) => ({
      rowIndex,
      colIndex,
      wrong: value !== target[rowIndex][colIndex],
    }))).find((cell) => cell.wrong);
    if (!mismatch || result === 'correct' || result === 'finished') return;
    setGrid((current) => current.map((row, r) => (
      r === mismatch.rowIndex
        ? row.map((value, c) => c === mismatch.colIndex ? target[r][c] : value)
        : row
    )));
    setHints((value) => value + 1);
    setResult('idle');
  };

  const checkAnswer = () => {
    if (wrongCount > 0) {
      setAttempts((value) => value + 1);
      setResult('wrong');
      return;
    }
    const earned = Math.max(8, 20 - hints * 2 - attempts);
    setScore((value) => value + earned);
    setResult('correct');
  };

  const nextLevel = () => {
    if (levelIndex + 1 >= COLOR_CODE_LEVELS.length) {
      setResult('finished');
      void recordGame(score);
      return;
    }
    setLevelIndex((value) => value + 1);
    setGrid(blankGrid(10));
    setAttempts(0);
    setHints(0);
    setResult('idle');
  };

  const restart = () => {
    setLevelIndex(0);
    setGrid(blankGrid(10));
    setAttempts(0);
    setHints(0);
    setScore(0);
    setResult('idle');
  };

  return (
    <div className="ccp-page" onPointerUp={() => setDrawing(false)} onPointerLeave={() => setDrawing(false)}>
      <header className="ccp-topbar">
        <Link to="/games" className="ccp-back"><ChevronLeft size={19} /> เกมทั้งหมด</Link>
        <div>
          <span>PIXEL CODE LAB</span>
          <h1>ภารกิจระบายสีตามรหัสพิกเซล</h1>
        </div>
        <div className="ccp-score"><Trophy size={19} /> {score} คะแนน</div>
      </header>

      <div className="ccp-toolbar">
        <GameLearnCard gameKey="color-code-pixel" />
        <div><strong>ด่าน {levelIndex + 1}/{COLOR_CODE_LEVELS.length}</strong><small>{level.name}</small></div>
        <div><strong>{progressPercent}%</strong><small>ความคืบหน้า</small></div>
        <div><strong>{hints}</strong><small>คำใบ้ที่ใช้</small></div>
      </div>

      <main className="ccp-workspace">
        <aside className="ccp-code-panel">
          <div className="ccp-panel-title"><span>{level.icon}</span><div><small>แบบรหัสสี</small><h2>{level.name}</h2></div></div>
          <div className="ccp-legend">
            {usedColors.map((item) => (
              <div key={item.id}><i style={{ background: item.color }} /> <b>{item.id}</b> {item.name}</div>
            ))}
          </div>
          <div className="ccp-code-grid" aria-label="รหัสสีของภาพ">
            {level.rows.map((row, rowIndex) => (
              <div key={rowIndex}><b>{String(rowIndex + 1).padStart(2, '0')}</b><code>{row.split('').join(' ')}</code></div>
            ))}
          </div>
          <p>อ่านทีละแถว แล้วเลือกสีตามตัวเลขเพื่อระบายลงตาราง</p>
        </aside>

        <section className="ccp-canvas-panel">
          <div className="ccp-coordinates ccp-columns" aria-hidden="true">
            {Array.from({ length: 10 }, (_, index) => <span key={index}>{String.fromCharCode(65 + index)}</span>)}
          </div>
          <div className="ccp-canvas-row">
            <div className="ccp-coordinates ccp-rows" aria-hidden="true">
              {Array.from({ length: 10 }, (_, index) => <span key={index}>{index + 1}</span>)}
            </div>
            <div className="ccp-canvas" role="grid" aria-label="ตารางระบายสี 10 คูณ 10">
              {grid.map((row, rowIndex) => row.map((value, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  type="button"
                  role="gridcell"
                  aria-label={`แถว ${rowIndex + 1} คอลัมน์ ${colIndex + 1} สี ${PALETTE[value].name}`}
                  style={{ background: PALETTE[value].color }}
                  onPointerDown={() => { setDrawing(true); paint(rowIndex, colIndex); }}
                  onPointerEnter={() => { if (drawing) paint(rowIndex, colIndex); }}
                />
              )))}
            </div>
          </div>

          <div className="ccp-palette" aria-label="จานสี">
            {PALETTE.map((item) => (
              <button
                key={item.id}
                type="button"
                className={selectedColor === item.id ? 'selected' : ''}
                onClick={() => setSelectedColor(item.id)}
                title={`${item.id} ${item.name}`}
              >
                <i style={{ background: item.color }} />
                <span>{item.id}</span>
              </button>
            ))}
          </div>

          <div className="ccp-tools">
            <button type="button" onClick={() => setSelectedColor(0)}><Eraser size={18} /> ยางลบ</button>
            <button type="button" onClick={resetCanvas}><RotateCcw size={18} /> เริ่มภาพใหม่</button>
            <button type="button" onClick={revealHint} disabled={wrongCount === 0}><Lightbulb size={18} /> เติมคำใบ้ 1 ช่อง</button>
            <button type="button" className="primary" onClick={checkAnswer}><Paintbrush size={18} /> ตรวจภาพ</button>
          </div>

          {result === 'wrong' && <div className="ccp-message wrong">ยังต่างจากรหัส {wrongCount} ช่อง ลองตรวจทีละแถวอีกครั้ง</div>}
          {result === 'correct' && (
            <div className="ccp-message correct">
              <CheckCircle2 size={22} /> สำเร็จ ภาพตรงกับรหัสทุกช่อง
              <button type="button" onClick={nextLevel}>{levelIndex + 1 === COLOR_CODE_LEVELS.length ? 'สรุปผล' : 'ด่านต่อไป'}</button>
            </div>
          )}
          {result === 'finished' && (
            <div className="ccp-finish">
              <Trophy size={52} />
              <h2>จบภารกิจพิกเซลแล้ว</h2>
              <p>ผ่านครบ {COLOR_CODE_LEVELS.length} ภาพ ได้ {score} คะแนน</p>
              <button type="button" onClick={restart}><RotateCcw size={18} /> เล่นใหม่</button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default ColorCodePixelGame;
