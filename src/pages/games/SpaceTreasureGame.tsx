import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  RotateCcw,
  Play,
  Trash2,
  Trophy,
  ExternalLink,
  FileText,
  X,
  Sparkles,
} from 'lucide-react';
import { useGameProgress } from '../../hooks/useGameProgress';
import { sfxStep, sfxDice, sfxCoin, sfxCorrect, sfxWrong } from '../../utils/gameSounds';
import GameLearnCard from '../../components/GameLearnCard';
import './GameStyles.css';
import './SpaceTreasureGame.css';

type CommandType = 'FORWARD' | 'TURN_LEFT' | 'TURN_RIGHT' | 'COLLECT' | 'SCAN';

interface LevelConfig {
  levelNum: number;
  title: string;
  subtitle: string;
  start: { x: number; y: number; dir: number }; // 0: East, 1: South, 2: West, 3: North
  station: { x: number; y: number };
  treasures: { x: number; y: number }[];
  asteroids: { x: number; y: number }[];
  energies: { x: number; y: number }[];
}

const LEVELS: LevelConfig[] = [
  {
    levelNum: 1,
    title: 'ด่าน 1: เส้นทางอวกาศสายตรง (Sequence)',
    subtitle: 'ใช้คำสั่งเดินหน้าและเลี้ยวเพื่อเก็บกล่องสมบัติ 2 กล่องแล้วเข้าสู่สถานี',
    start: { x: 0, y: 0, dir: 0 },
    station: { x: 5, y: 5 },
    treasures: [{ x: 2, y: 0 }, { x: 4, y: 3 }],
    asteroids: [{ x: 2, y: 2 }, { x: 3, y: 2 }, { x: 1, y: 4 }],
    energies: [{ x: 0, y: 3 }],
  },
  {
    levelNum: 2,
    title: 'ด่าน 2: เขาวงกตอุกกาบาต & พลังงาน (Loops & Energy)',
    subtitle: 'ชาร์จพลังงานสำรอง เลี้ยวหลบแถบอุกกาบาต และเก็บสมบัติ 3 ชิ้น',
    start: { x: 0, y: 1, dir: 0 },
    station: { x: 5, y: 5 },
    treasures: [{ x: 3, y: 1 }, { x: 1, y: 5 }, { x: 5, y: 2 }],
    asteroids: [{ x: 2, y: 1 }, { x: 2, y: 3 }, { x: 4, y: 4 }, { x: 4, y: 1 }],
    energies: [{ x: 1, y: 1 }, { x: 3, y: 4 }],
  },
  {
    levelNum: 3,
    title: 'ด่าน 3: ผังงานตรรกะ & ทางแยกเงื่อนไข (Condition Logic)',
    subtitle: 'สแกนเส้นทางและเลือกทางเดินที่ปลอดภัยที่สุดในเขาวงกตอวกาศชั้นลึก',
    start: { x: 0, y: 5, dir: 3 },
    station: { x: 5, y: 5 },
    treasures: [{ x: 2, y: 5 }, { x: 2, y: 1 }, { x: 5, y: 0 }],
    asteroids: [{ x: 1, y: 5 }, { x: 1, y: 3 }, { x: 3, y: 5 }, { x: 3, y: 2 }, { x: 4, y: 1 }],
    energies: [{ x: 0, y: 2 }, { x: 4, y: 3 }],
  },
];

const DIR_LABELS = ['👉 หันขวา (ตะวันออก)', '👇 หันลง (ใต้)', '👈 หันซ้าย (ตะวันตก)', '👆 หันขึ้น (เหนือ)'];
const DIR_ANGLES = [0, 90, 180, 270];

export const SpaceTreasureGame: React.FC = () => {
  const [currentLevelIdx, setCurrentLevelIdx] = useState<number>(0);
  const currentLevel = LEVELS[currentLevelIdx];

  // Ship Position & Direction
  const [shipPos, setShipPos] = useState<{ x: number; y: number; dir: number }>(currentLevel.start);

  // Collected Items
  const [collectedTreasures, setCollectedTreasures] = useState<{ x: number; y: number }[]>([]);
  const [collectedEnergies, setCollectedEnergies] = useState<{ x: number; y: number }[]>([]);

  // Commands Stack
  const [program, setProgram] = useState<CommandType[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [executingIdx, setExecutingIdx] = useState<number>(-1);

  // Game Results & Modals
  const [score, setScore] = useState<number>(0);
  const [winModal, setWinModal] = useState<boolean>(false);
  const [sheetModal, setSheetModal] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('พร้อมรับคำสั่ง นำบล็อกคำสั่งมาเรียงทางขวาได้เลย!');

  const recordGame = useGameProgress('space-treasure', 'ล่าสมบัติอวกาศ (Space Treasure Coder)');
  const executionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset ship to level start
  const resetBoard = () => {
    if (executionTimeoutRef.current) clearTimeout(executionTimeoutRef.current);
    setIsRunning(false);
    setExecutingIdx(-1);
    setShipPos(currentLevel.start);
    setCollectedTreasures([]);
    setCollectedEnergies([]);
    setStatusMessage('รีเซ็ตตำแหน่งยานเรียบร้อย พร้อมบินใหม่!');
  };

  // Switch Level
  const selectLevel = (idx: number) => {
    setCurrentLevelIdx(idx);
    setProgram([]);
    setShipPos(LEVELS[idx].start);
    setCollectedTreasures([]);
    setCollectedEnergies([]);
    setIsRunning(false);
    setExecutingIdx(-1);
    setStatusMessage(`เริ่ม ${LEVELS[idx].title}`);
  };

  // Add block to program
  const addCommand = (cmd: CommandType) => {
    if (isRunning) return;
    if (program.length >= 24) {
      setStatusMessage('หน่วยความจำโปรแกรมเต็มแล้ว (สูงสุด 24 คำสั่ง)');
      return;
    }
    setProgram((prev) => [...prev, cmd]);
    sfxDice();
  };

  // Remove block
  const removeCommand = (idx: number) => {
    if (isRunning) return;
    setProgram((prev) => prev.filter((_, i) => i !== idx));
  };

  // Clear all blocks
  const clearProgram = () => {
    if (isRunning) return;
    setProgram([]);
    resetBoard();
  };

  // Execute Program Step-by-Step
  const runProgram = () => {
    if (isRunning || program.length === 0) return;

    resetBoard();
    setIsRunning(true);
    setStatusMessage('กำลังรันชุดคำสั่ง...');

    let currentPos = { ...currentLevel.start };
    let currTreasures: { x: number; y: number }[] = [];
    let currEnergies: { x: number; y: number }[] = [];

    const step = (index: number) => {
      if (index >= program.length) {
        setIsRunning(false);
        setExecutingIdx(-1);

        // Check if reached station
        const isAtStation = currentPos.x === currentLevel.station.x && currentPos.y === currentLevel.station.y;
        const allTreasuresCollected = currTreasures.length === currentLevel.treasures.length;

        if (isAtStation && allTreasuresCollected) {
          sfxCorrect();
          const newScore = score + 10;
          setScore(newScore);
          recordGame(newScore);
          setWinModal(true);
          setStatusMessage('🎉 ยอดเยี่ยมมาก! เก็บสมบัติครบและเข้าสู่สถานีอวกาศสำเร็จ!');
        } else if (isAtStation && !allTreasuresCollected) {
          sfxWrong();
          setStatusMessage(`⚠️ ถึงสถานีแล้วแต่ยังเก็บสมบัติไม่ครบ (${currTreasures.length}/${currentLevel.treasures.length})`);
        } else {
          setStatusMessage('สิ้นสุดโปรแกรม แต่ยังไม่ถึงสถานีอวกาศ ลองตรวจสอบคำสั่งอีกครั้ง');
        }
        return;
      }

      setExecutingIdx(index);
      const cmd = program[index];

      if (cmd === 'FORWARD') {
        let nx = currentPos.x;
        let ny = currentPos.y;

        if (currentPos.dir === 0) nx += 1; // East
        else if (currentPos.dir === 1) ny += 1; // South
        else if (currentPos.dir === 2) nx -= 1; // West
        else if (currentPos.dir === 3) ny -= 1; // North

        // Check boundaries
        if (nx < 0 || nx >= 6 || ny < 0 || ny >= 6) {
          sfxWrong();
          setStatusMessage('💥 ยานบินออกนอกขอบเขตอวกาศ! กรุณาเขียนคำสั่งใหม่');
          setIsRunning(false);
          setExecutingIdx(-1);
          return;
        }

        // Check asteroids
        const hitAsteroid = currentLevel.asteroids.some((a) => a.x === nx && a.y === ny);
        if (hitAsteroid) {
          sfxWrong();
          setStatusMessage('💥 ยานชนอุกกาบาต! กรุณาหลบสิ่งกีดขวาง');
          setIsRunning(false);
          setExecutingIdx(-1);
          return;
        }

        currentPos.x = nx;
        currentPos.y = ny;
        setShipPos({ ...currentPos });
        sfxStep();

        // Check energy pickup
        const hitEnergy = currentLevel.energies.some((e) => e.x === nx && e.y === ny);
        if (hitEnergy && !currEnergies.some((e) => e.x === nx && e.y === ny)) {
          currEnergies.push({ x: nx, y: ny });
          setCollectedEnergies([...currEnergies]);
          sfxCoin();
        }
      } else if (cmd === 'TURN_LEFT') {
        currentPos.dir = (currentPos.dir + 3) % 4;
        setShipPos({ ...currentPos });
        sfxDice();
      } else if (cmd === 'TURN_RIGHT') {
        currentPos.dir = (currentPos.dir + 1) % 4;
        setShipPos({ ...currentPos });
        sfxDice();
      } else if (cmd === 'COLLECT') {
        const foundTreasure = currentLevel.treasures.find(
          (t) => t.x === currentPos.x && t.y === currentPos.y
        );
        if (foundTreasure && !currTreasures.some((t) => t.x === foundTreasure.x && t.y === foundTreasure.y)) {
          currTreasures.push(foundTreasure);
          setCollectedTreasures([...currTreasures]);
          sfxCoin();
          setStatusMessage(`💎 เก็บสมบัติได้แล้ว! (${currTreasures.length}/${currentLevel.treasures.length})`);
        } else {
          setStatusMessage('ℹ️ ช่องนี้ไม่มีสมบัติให้เก็บ');
        }
      } else if (cmd === 'SCAN') {
        sfxDice();
        setStatusMessage('⚡ สแกนเซนเซอร์: ตรวจพบเส้นทางปลอดภัย!');
      }

      executionTimeoutRef.current = setTimeout(() => {
        step(index + 1);
      }, 420);
    };

    step(0);
  };

  useEffect(() => {
    return () => {
      if (executionTimeoutRef.current) clearTimeout(executionTimeoutRef.current);
    };
  }, []);

  return (
    <div className="space-treasure-container">
      {/* Header */}
      <div className="st-header">
        <Link to="/games" className="st-back-btn">
          <ChevronLeft size={18} />
          กลับคลังเกม
        </Link>
        <div className="st-title-wrap">
          <h1 className="st-title">🚀 ล่าสมบัติอวกาศ (Space Treasure Coder)</h1>
          <p className="st-subtitle">
            Unplugged Coding &amp; Flowchart: วางบล็อกคำสั่งพายานอวกาศหลบอุกกาบาตและเก็บสมบัติ
          </p>
        </div>
        <button className="st-sheet-btn" onClick={() => setSheetModal(true)}>
          <FileText size={15} />
          ดูสื่อใบงานครูคอม
        </button>
      </div>

      {/* Level Selection Tabs */}
      <div className="st-level-tabs">
        {LEVELS.map((lvl, idx) => (
          <button
            key={lvl.levelNum}
            className={`st-level-btn ${currentLevelIdx === idx ? 'active' : ''}`}
            onClick={() => selectLevel(idx)}
          >
            {lvl.title.split(':')[0]}
          </button>
        ))}
      </div>

      {/* Main Arena */}
      <div className="st-game-arena">
        {/* Left: Cosmic Grid */}
        <div className="st-grid-card">
          <div className="st-grid-info-bar">
            <div>
              <strong>{currentLevel.title}</strong>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{currentLevel.subtitle}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ color: '#fbbf24', fontWeight: 700 }}>
                💎 สมบัติ: {collectedTreasures.length} / {currentLevel.treasures.length}
              </span>
              <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>
                {DIR_LABELS[shipPos.dir]}
              </div>
            </div>
          </div>

          {/* 6x6 Cosmic Grid */}
          <div className="st-cosmic-board">
            {Array.from({ length: 36 }).map((_, i) => {
              const x = i % 6;
              const y = Math.floor(i / 6);

              const isShip = shipPos.x === x && shipPos.y === y;
              const isStation = currentLevel.station.x === x && currentLevel.station.y === y;
              const isTreasure = currentLevel.treasures.some(
                (t) => t.x === x && t.y === y && !collectedTreasures.some((ct) => ct.x === x && ct.y === y)
              );
              const isAsteroid = currentLevel.asteroids.some((a) => a.x === x && a.y === y);
              const isEnergy = currentLevel.energies.some(
                (e) => e.x === x && e.y === y && !collectedEnergies.some((ce) => ce.x === x && ce.y === y)
              );

              return (
                <div
                  key={i}
                  className={`st-cell ${isStation ? 'target' : ''} ${x === 0 && y === 0 ? 'start' : ''}`}
                >
                  {isShip && (
                    <span
                      className="st-ship"
                      style={{ transform: `rotate(${DIR_ANGLES[shipPos.dir]}deg)` }}
                    >
                      🚀
                    </span>
                  )}
                  {!isShip && isStation && <span>🛰️</span>}
                  {!isShip && isTreasure && <span>💎</span>}
                  {!isShip && isAsteroid && <span>🪨</span>}
                  {!isShip && isEnergy && <span>⚡</span>}
                </div>
              );
            })}
          </div>

          {/* Status Alert Bar */}
          <div
            style={{
              marginTop: 14,
              width: '100%',
              padding: '10px 14px',
              borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '0.85rem',
              color: '#e2e8f0',
              textAlign: 'center',
            }}
          >
            {statusMessage}
          </div>
        </div>

        {/* Right: Code Toolbox & Program Stack */}
        <div className="st-code-card">
          <div className="st-code-header">
            <span>📦 กล่องคำสั่ง (Command Blocks)</span>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              {program.length} / 24 บล็อก
            </span>
          </div>

          {/* Toolbox Palette */}
          <div className="st-toolbox">
            <button className="st-block-btn" onClick={() => addCommand('FORWARD')}>
              <span>🚀</span> เดินหน้า 1 ก้าว
            </button>
            <button className="st-block-btn" onClick={() => addCommand('COLLECT')}>
              <span>💎</span> เก็บสมบัติ
            </button>
            <button className="st-block-btn" onClick={() => addCommand('TURN_LEFT')}>
              <span>↩️</span> เลี้ยวซ้าย 90°
            </button>
            <button className="st-block-btn" onClick={() => addCommand('TURN_RIGHT')}>
              <span>↪️</span> เลี้ยวขวา 90°
            </button>
            <button className="st-block-btn" onClick={() => addCommand('SCAN')} style={{ gridColumn: 'span 2' }}>
              <span>⚡</span> สแกนเส้นทาง (Check If-Else)
            </button>
          </div>

          {/* Program Stack Panel */}
          <div className="st-code-header" style={{ marginTop: 4 }}>
            <span>📜 ลำดับชุดคำสั่ง (Sequence Panel)</span>
            {program.length > 0 && (
              <button
                onClick={clearProgram}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#f43f5e',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Trash2 size={13} /> ล้างคำสั่ง
              </button>
            )}
          </div>

          <div className="st-stack-panel">
            {program.length === 0 ? (
              <div style={{ color: '#64748b', fontSize: '0.82rem', textAlign: 'center', padding: '30px 10px' }}>
                ยังไม่มีคำสั่ง กดเลือกบล็อกด้านบนเพื่อเพิ่มคำสั่งลงในโปรแกรม
              </div>
            ) : (
              program.map((cmd, idx) => (
                <div
                  key={idx}
                  className={`st-stack-item ${executingIdx === idx ? 'executing' : ''}`}
                >
                  <span>
                    <strong style={{ color: '#818cf8', marginRight: 6 }}>{idx + 1}.</strong>
                    {cmd === 'FORWARD' && '🚀 เดินหน้า (Move Forward)'}
                    {cmd === 'TURN_LEFT' && '↩️ เลี้ยวซ้าย (Turn Left)'}
                    {cmd === 'TURN_RIGHT' && '↪️ เลี้ยวขวา (Turn Right)'}
                    {cmd === 'COLLECT' && '💎 เก็บสมบัติ (Collect Treasure)'}
                    {cmd === 'SCAN' && '⚡ สแกนเส้นทาง (Scan Radar)'}
                  </span>
                  {!isRunning && (
                    <button className="st-stack-remove-btn" onClick={() => removeCommand(idx)}>
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Action Buttons */}
          <div className="st-actions-wrap">
            <button
              className="st-run-btn"
              onClick={runProgram}
              disabled={isRunning || program.length === 0}
            >
              <Play size={18} />
              {isRunning ? 'กำลังบิน...' : 'รันคำสั่ง (Run)'}
            </button>
            <button className="st-reset-btn" onClick={resetBoard} title="รีเซ็ตตำแหน่ง">
              <RotateCcw size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Win Stage Modal */}
      {winModal && (
        <div className="st-modal-overlay">
          <div className="st-modal-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: 10 }}>🎉🛰️</div>
            <h2 className="st-modal-title">ยินดีด้วย! ผ่านด่านอวกาศสำเร็จ</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: 20 }}>
              คุณเขียนชุดคำสั่งและผังงานได้อย่างถูกต้อง นำยานไปเก็บสมบัติและถึงสถานีอวกาศอย่างปลอดภัย!
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              {currentLevelIdx < LEVELS.length - 1 ? (
                <button
                  className="st-run-btn"
                  style={{ maxWidth: 220 }}
                  onClick={() => {
                    setWinModal(false);
                    selectLevel(currentLevelIdx + 1);
                  }}
                >
                  <Sparkles size={16} /> ลุยด่านถัดไป!
                </button>
              ) : (
                <button
                  className="st-run-btn"
                  style={{ maxWidth: 220 }}
                  onClick={() => {
                    setWinModal(false);
                    resetBoard();
                  }}
                >
                  <Trophy size={16} /> เล่นใหม่อีกครั้ง
                </button>
              )}
              <button
                className="st-reset-btn"
                onClick={() => setWinModal(false)}
                style={{ padding: '10px 18px' }}
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kru-Com Sheet Resource References Modal */}
      {sheetModal && (
        <div className="st-modal-overlay">
          <div className="st-modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="st-modal-title" style={{ margin: 0 }}>
                📄 สื่อและใบงานต้นฉบับ (Google Sheets ครูคอม)
              </h3>
              <button
                onClick={() => setSheetModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '8px 0 16px 0' }}>
              เกมนี้ดัดแปลงและต่อยอดมาจากสื่อบอร์ดเกมและใบงาน Unplugged Coding ของครูคอม คุณครูสามารถกดลิงก์เพื่อเปิดดูหรือดาวน์โหลดไฟล์ PDF ต้นฉบับบน Google Drive ได้ทันที:
            </p>

            <div className="st-modal-list">
              <a
                href="https://drive.google.com/file/d/1l3SELv8y0GYcpM-nrubeguhvzNfeG2_R/view?usp=drivesdk"
                target="_blank"
                rel="noreferrer"
                className="st-modal-item"
              >
                <span>🚀 [346] Uplug coding ล่าสมบัติอวกาศ.pdf</span>
                <ExternalLink size={16} color="#818cf8" />
              </a>
              <a
                href="https://drive.google.com/file/d/1TTBxo0EwzSijIEv_M92ogL6WWX7InIN6/view?usp=drivesdk"
                target="_blank"
                rel="noreferrer"
                className="st-modal-item"
              >
                <span>🤖 [377] ใบงานผังงานแบบมีเงื่อนไข หุ่นยนต์เก็บขยะ.pdf</span>
                <ExternalLink size={16} color="#818cf8" />
              </a>
              <a
                href="https://drive.google.com/file/d/1KM16ws4zwzYAcjNviZZxGStiChjv-SrN/view?usp=drivesdk"
                target="_blank"
                rel="noreferrer"
                className="st-modal-item"
              >
                <span>🧭 [368] โปรแกรมสัญลักษณ์ เดินทางไปหาแม่.pdf</span>
                <ExternalLink size={16} color="#818cf8" />
              </a>
              <a
                href="https://drive.google.com/file/d/1Ys_c7O7M9JIDk2cSGSQ20rOt6Ayr2gGJ/view?usp=drivesdk"
                target="_blank"
                rel="noreferrer"
                className="st-modal-item"
              >
                <span>📊 [212] Bingo Flow Chart สัญลักษณ์ผังงาน.pdf</span>
                <ExternalLink size={16} color="#818cf8" />
              </a>
            </div>

            <button
              className="st-reset-btn"
              onClick={() => setSheetModal(false)}
              style={{ width: '100%', padding: '10px' }}
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}

      {/* Educational Knowledge Card */}
      <GameLearnCard gameKey="space-treasure" />
    </div>
  );
};

export default SpaceTreasureGame;
