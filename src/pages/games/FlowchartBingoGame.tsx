import React, { useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Play,
  Check,
} from 'lucide-react';
import { useGameProgress } from '../../hooks/useGameProgress';
import { useGameTimers } from '../../hooks/useGameTimers';
import { sfxCorrect, sfxWrong, sfxCoin } from '../../utils/gameSounds';
import GameLearnCard from '../../components/GameLearnCard';
import './GameStyles.css';
import './FlowchartBingoGame.css';

interface SymbolDef {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  shapeDescription: string;
  clues: string[];
}

const SYMBOLS: SymbolDef[] = [
  {
    id: 'terminator',
    name: 'เริ่มต้น / สิ้นสุด',
    nameEn: 'Terminator',
    icon: '🛑',
    shapeDescription: 'สี่เหลี่ยมมุมมน หรือวงรี',
    clues: [
      'สัญลักษณ์ที่ต้องอยู่จุดแรกและจุดสุดท้ายของทุกผังงาน',
      'สัญลักษณ์รูปวงรี/สี่เหลี่ยมมน บ่งบอกจุด Start และ Stop',
    ],
  },
  {
    id: 'process',
    name: 'ประมวลผล / คำนวณ',
    nameEn: 'Process',
    icon: '🟦',
    shapeDescription: 'สี่เหลี่ยมผืนผ้า',
    clues: [
      'สัญลักษณ์ที่ใช้สำหรับการคิดคำนวณ เช่น Sum = A + B',
      'สัญลักษณ์สี่เหลี่ยมผืนผ้า ใช้กำหนดค่าตัวแปรหรือการกระทำทั่วไป',
    ],
  },
  {
    id: 'decision',
    name: 'ตัดสินใจ / เงื่อนไข',
    nameEn: 'Decision',
    icon: '🔷',
    shapeDescription: 'สี่เหลี่ยมขนมเปียกปูน (ข้าวหลามตัด)',
    clues: [
      'สัญลักษณ์ที่ใช้ตรวจสอบเงื่อนไข มีทางแยกออก 2 ทาง (จริง/เท็จ)',
      'สัญลักษณ์ข้าวหลามตัด เปรียบเทียบค่า เช่น คะแนน >= 50 หรือไม่',
    ],
  },
  {
    id: 'input_output',
    name: 'รับ / แสดงผลทั่วไป',
    nameEn: 'Input / Output',
    icon: '▰',
    shapeDescription: 'สี่เหลี่ยมด้านขนาน',
    clues: [
      'สัญลักษณ์สี่เหลี่ยมด้านขนาน นำข้อมูลเข้าหรือแสดงผลโดยไม่ระบุอุปกรณ์',
      'ใช้แทนคำสั่ง Read หรือ Print ข้อมูลทั่วไป',
    ],
  },
  {
    id: 'manual_input',
    name: 'รับข้อมูลจากแป้นพิมพ์',
    nameEn: 'Manual Input',
    icon: '⌨️',
    shapeDescription: 'สี่เหลี่ยมคางหมูด้านไม่เท่า (ด้านบนเอียง)',
    clues: [
      'สัญลักษณ์ระบุเฉพาะเจาะจงว่า ผู้ใช้พิมพ์ข้อมูลผ่านแป้นพิมพ์ (Keyboard)',
      'ใช้เมื่อต้องการให้ผู้ใช้กรอกข้อความหรือตัวเลขผ่านคีย์บอร์ด',
    ],
  },
  {
    id: 'display',
    name: 'แสดงผลทางหน้าจอ',
    nameEn: 'Display',
    icon: '🖥️',
    shapeDescription: 'ปลายด้านซ้ายโค้ง ด้านขวาแหลม',
    clues: [
      'สัญลักษณ์เฉพาะสำหรับการแสดงข้อความหรือกราฟิกบนหน้าจอมอนิเตอร์',
      'ใช้เมื่อต้องการให้ผลลัพธ์ปรากฏบนจอภาพ (Monitor)',
    ],
  },
  {
    id: 'connector',
    name: 'จุดเชื่อมต่อในหน้า',
    nameEn: 'On-Page Connector',
    icon: '⚪',
    shapeDescription: 'วงกลมขนาดเล็ก',
    clues: [
      'สัญลักษณ์วงกลม ใช้เชื่อมต่อเส้นทิศทางที่ซับซ้อนในหน้าเดียวกัน',
      'ช่วยให้ผังงานดูเป็นระเบียบ ไม่ต้องลากเส้นทับกันไปมาในหน้าเดียว',
    ],
  },
  {
    id: 'offpage',
    name: 'จุดเชื่อมต่อข้ามหน้า',
    nameEn: 'Off-Page Connector',
    icon: '📄',
    shapeDescription: 'ห้าเหลี่ยมคล้ายชายธงคว่ำ',
    clues: [
      'สัญลักษณ์ห้าเหลี่ยม ใช้เชื่อมโยงผังงานเมื่อเนื้อหายาวข้ามไปหน้าถัดไป',
      'ระบุจุดสิ้นสุดของหน้านี้และจุดเริ่มต้นของหน้าใหม่ในเอกสาร',
    ],
  },
  {
    id: 'flowline',
    name: 'ทิศทางการทำงาน',
    nameEn: 'Flowline',
    icon: '➡️',
    shapeDescription: 'เส้นลูกศร',
    clues: [
      'สัญลักษณ์เส้นตรงพร้อมหัวลูกศร ระบุลำดับการทำงานจากบนลงล่าง หรือซ้ายไปขวา',
      'ชี้บอกว่าคอมพิวเตอร์ต้องทำงานคำสั่งใดเป็นลำดับถัดไป',
    ],
  },
  {
    id: 'preparation',
    name: 'กำหนดค่าลูป / เตรียมการ',
    nameEn: 'Preparation',
    icon: '⬡',
    shapeDescription: 'หกเหลี่ยม',
    clues: [
      'สัญลักษณ์หกเหลี่ยม ใช้กำหนดค่าเริ่มต้นให้ตัวนับรอบ เช่น For i = 1 to 10',
      'ใช้เตรียมโครงสร้างสำหรับการทำงานแบบวนซ้ำ (Loop)',
    ],
  },
  {
    id: 'document',
    name: 'แสดงผลออกเครื่องพิมพ์',
    nameEn: 'Document Output',
    icon: '🖨️',
    shapeDescription: 'สี่เหลี่ยมด้านล่างเป็นคลื่นคล้ายกระดาษฉีก',
    clues: [
      'สัญลักษณ์แสดงเอกสารหรือรายงานที่พิมพ์ออกมาทางเครื่องพิมพ์ (Printer)',
      'ใช้เมื่อระบบต้องสั่งพิมพ์สลิป ใบเสร็จ หรือเอกสารกระดาษ',
    ],
  },
  {
    id: 'subroutine',
    name: 'ฟังก์ชัน / โปรแกรมย่อย',
    nameEn: 'Subroutine / Predefined Process',
    icon: '📑',
    shapeDescription: 'สี่เหลี่ยมผืนผ้ามีขีดแถบข้าง 2 ข้าง',
    clues: [
      'สัญลักษณ์สี่เหลี่ยมมีแถบข้างซ้ายขวา เรียกใช้งานโมดูลหรือฟังก์ชันย่อยที่เขียนไว้แล้ว',
      'ช่วยลดการเขียนโค้ดซ้ำซ้อน โดยเรียกชื่อโปรแกรมย่อยมาทำงาน',
    ],
  },
];

// Shuffle helper
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Check lines for 4x4 board
const BINGO_LINES = [
  // 4 Rows
  [0, 1, 2, 3],
  [4, 5, 6, 7],
  [8, 9, 10, 11],
  [12, 13, 14, 15],
  // 4 Cols
  [0, 4, 8, 12],
  [1, 5, 9, 13],
  [2, 6, 10, 14],
  [3, 7, 11, 15],
  // 2 Diagonals
  [0, 5, 10, 15],
  [3, 6, 9, 12],
];

interface BoardTile {
  index: number;
  symbol: SymbolDef | null; // null = FREE space
  isFree: boolean;
  marked: boolean;
}

interface ClueCard {
  symbolId: string;
  symbolName: string;
  clueText: string;
}

const createRound = () => {
  const selected = [...shuffleArray(SYMBOLS), ...shuffleArray(SYMBOLS)].slice(0, 15);
  let nextSymbol = 0;
  const board: BoardTile[] = Array.from({ length: 16 }, (_, index) => ({
    index, symbol: index === 5 ? null : selected[nextSymbol++], isFree: index === 5, marked: index === 5,
  }));
  const ids = new Set(board.flatMap(tile => tile.symbol ? [tile.symbol.id] : []));
  const deck = SYMBOLS.filter(symbol => ids.has(symbol.id)).flatMap(symbol =>
    symbol.clues.map(clueText => ({ symbolId: symbol.id, symbolName: symbol.name, clueText })));
  return { board, deck: shuffleArray(deck) };
};

export const FlowchartBingoGame: React.FC = () => {
  const timers = useGameTimers();
  const advancing = useRef(false);
  const recordGame = useGameProgress('flowchart-bingo', 'บิงโกสัญลักษณ์ผังงาน (Flowchart Bingo)');

  const [initialRound] = useState(createRound);
  const [board, setBoard] = useState<BoardTile[]>(initialRound.board);
  const [clueDeck, setClueDeck] = useState<ClueCard[]>(initialRound.deck);
  const [currentClueIdx, setCurrentClueIdx] = useState<number>(0);
  const [bingoLinesCompleted, setBingoLinesCompleted] = useState<number[][]>([]);
  const [gameWon, setGameWon] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showHelper, setShowHelper] = useState<boolean>(false);

  // Initialize game board and deck
  const initGame = () => {
    timers.clear();
    advancing.current = false;
    const next = createRound();
    setBoard(next.board);
    setClueDeck(next.deck);
    setCurrentClueIdx(0);
    setBingoLinesCompleted([]);
    setGameWon(false);
    setFeedback(null);
  };

  const currentClue = clueDeck[currentClueIdx] || null;

  // Handle tile click
  const handleTileClick = (tileIndex: number) => {
    if (gameWon || advancing.current) return;
    const tile = board[tileIndex];
    if (tile.marked) return;
    if (!currentClue || !tile.symbol) return;

    if (tile.symbol.id === currentClue.symbolId) {
      advancing.current = true;
      timers.clear();
      // Correct!
      sfxCorrect();
      setFeedback('🎉 ถูกต้อง! กาช่องสำเร็จ');

      const nextBoard = board.map((t) => (t.index === tileIndex ? { ...t, marked: true } : t));
      setBoard(nextBoard);

      // Check for Bingo lines
      checkBingo(nextBoard);

      // Advance to next clue after brief pause
      timers.schedule(() => {
        advancing.current = false;
        setFeedback(null);
        if (currentClueIdx + 1 < clueDeck.length) {
          setCurrentClueIdx((prev) => prev + 1);
        } else {
          // Reshuffle deck if ran out
          setClueDeck(shuffleArray(clueDeck));
          setCurrentClueIdx(0);
        }
      }, 700);
    } else {
      // Wrong tile for this clue
      sfxWrong();
      setFeedback(`❌ ยังไม่ใช่จ้า ช่องนี้คือ "${tile.symbol.name}" ลองอ่านคำใบ้อีกครั้งนะ!`);
      timers.clear();
      timers.schedule(() => setFeedback(null), 1800);
    }
  };

  // Draw next clue manually if stuck
  const handleSkipClue = () => {
    if (gameWon || advancing.current) return;
    timers.clear();
    if (currentClueIdx + 1 < clueDeck.length) {
      setCurrentClueIdx((prev) => prev + 1);
      setFeedback(null);
    } else {
      setClueDeck(shuffleArray(clueDeck));
      setCurrentClueIdx(0);
      setFeedback(null);
    }
  };

  // Check Bingo
  const checkBingo = (tiles: BoardTile[]) => {
    const completed: number[][] = [];
    BINGO_LINES.forEach((line) => {
      const allMarked = line.every((idx) => tiles[idx].marked);
      if (allMarked) {
        completed.push(line);
      }
    });

    setBingoLinesCompleted(completed);

    if (completed.length > 0 && !gameWon) {
      setGameWon(true);
      sfxCoin();
      recordGame(25);
    }
  };

  // Set of tile indices that belong to any completed bingo line
  const winningTileIndices = useMemo(() => {
    const set = new Set<number>();
    bingoLinesCompleted.forEach((line) => line.forEach((idx) => set.add(idx)));
    return set;
  }, [bingoLinesCompleted]);

  return (
    <div className="fcb-container">
      {/* Header */}
      <div className="fcb-header">
        <Link to="/games" className="fcb-back-btn">
          <ArrowLeft size={16} /> กลับหน้ารวมเกม
        </Link>
        <div className="fcb-title-wrap">
          <h1 className="fcb-title">🎯 บิงโกสัญลักษณ์ผังงาน (Flowchart Bingo)</h1>
          <p className="fcb-subtitle">ประยุกต์จากบอร์ดเกมผังงานวิทยาการคำนวณ ฝึกสังเกตและจดจำสัญลักษณ์ Flowchart</p>
        </div>
        <button className="fcb-back-btn" onClick={() => setShowHelper(true)}>
          <HelpCircle size={16} /> ดูสรุปสัญลักษณ์
        </button>
      </div>

      {/* Caller Clue Box */}
      <div className="fcb-caller-box">
        <div className="fcb-caller-badge">
          <Sparkles size={14} /> การ์ดคำใบ้ที่ {currentClueIdx + 1} / {clueDeck.length}
        </div>

        {currentClue ? (
          <>
            <p className="fcb-caller-prompt">
              &quot;{currentClue.clueText}&quot;
            </p>
            <p className="fcb-caller-hint">
              👉 มองหากระดานของคุณ แล้วแตะสัญลักษณ์ที่ตรงกับคำใบ้นี้!
            </p>
          </>
        ) : (
          <p className="fcb-caller-prompt">กดปุ่มสุ่มการ์ดเพื่อเริ่มเล่น</p>
        )}

        {feedback && (
          <div
            style={{
              padding: '6px 16px',
              borderRadius: 10,
              background: feedback.includes('🎉')
                ? 'rgba(16, 185, 129, 0.2)'
                : 'rgba(239, 68, 68, 0.2)',
              color: feedback.includes('🎉') ? '#6ee7b7' : '#fca5a5',
              fontWeight: 600,
              fontSize: '0.88rem',
              marginBottom: 12,
            }}
          >
            {feedback}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="fcb-draw-btn" onClick={handleSkipClue} disabled={gameWon}>
            🔄 ข้ามไปการ์ดคำใบ้ถัดไป
          </button>
          <button className="fcb-back-btn" onClick={initGame}>
            <RotateCcw size={15} /> สลับกระดานใหม่
          </button>
        </div>
      </div>

      {/* 4x4 Bingo Board */}
      <div className="fcb-board-wrap">
        <div className="fcb-lines-hud">
          <div className="fcb-lines-count">
            🏆 จำนวนแถวที่บิงโก: <strong>{bingoLinesCompleted.length} แถว</strong>
          </div>
          <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
            ทำแถวตรง แนวนอน แนวตั้ง หรือแนวทแยง 4 ช่องติดต่อกันเพื่อ BINGO!
          </span>
        </div>

        <div className="fcb-grid-4x4">
          {board.map((tile) => {
            const isWinning = winningTileIndices.has(tile.index);
            let cls = 'fcb-tile';
            if (tile.marked) cls += ' marked';
            if (isWinning) cls += ' in-bingo';

            if (tile.isFree) {
              return (
                <div key={tile.index} className={`${cls} marked`}>
                  <div className="fcb-tile-icon">⭐</div>
                  <div className="fcb-tile-name" style={{ color: '#fbbf24' }}>ช่องฟรี (FREE)</div>
                  <div className="fcb-stamp">
                    <Check size={18} />
                  </div>
                </div>
              );
            }

            return (
              <button
                key={tile.index}
                className={cls}
                onClick={() => handleTileClick(tile.index)}
              >
                <div className="fcb-tile-icon">{tile.symbol?.icon}</div>
                <div className="fcb-tile-name">{tile.symbol?.name}</div>
                <div className="fcb-tile-en">{tile.symbol?.nameEn}</div>
                {tile.marked && (
                  <div className="fcb-stamp">
                    <Check size={18} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* WIN CELEBRATION MODAL */}
      {gameWon && (
        <div className="fcb-overlay">
          <div className="fcb-win-card">
            <div style={{ fontSize: '3.8rem', marginBottom: 8 }}>🎉</div>
            <h2 style={{ fontSize: '1.8rem', color: '#fbbf24', margin: '0 0 6px 0', fontWeight: 800 }}>
              BINGO! ชนะแล้ว!
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: 20 }}>
              ยินดีด้วย! คุณสามารถเรียงแถวสัญลักษณ์ผังงานครบ {bingoLinesCompleted.length} แถวสำเร็จ (+25 XP)
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                className="fcb-draw-btn"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={initGame}
              >
                <Play size={16} /> เล่นบิงโกกระดานใหม่
              </button>
              <Link
                to="/games"
                className="fcb-back-btn"
                style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
              >
                🏠 กลับหน้ารวมเกม
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* SYMBOL HELPER REFERENCE MODAL */}
      {showHelper && (
        <div className="fcb-overlay" onClick={() => setShowHelper(false)}>
          <div
            className="fcb-win-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 640, textAlign: 'left', maxHeight: '85vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#38bdf8' }}>
                📖 ตารางสรุปสัญลักษณ์ผังงาน (Flowchart Reference)
              </h3>
              <button className="fcb-back-btn" onClick={() => setShowHelper(false)}>✕ ปิด</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {SYMBOLS.map((s) => (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 12,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div style={{ fontSize: '1.8rem', minWidth: 40, textAlign: 'center' }}>{s.icon}</div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>
                      {s.name} ({s.nameEn})
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      รูปร่าง: {s.shapeDescription} • {s.clues[0]}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              className="fcb-draw-btn"
              style={{ width: '100%', marginTop: 20, justifyContent: 'center' }}
              onClick={() => setShowHelper(false)}
            >
              เข้าใจแล้ว กลับไปเล่นบิงโกต่อ! 🎮
            </button>
          </div>
        </div>
      )}

      {/* Learning Outcomes */}
      <div style={{ width: '100%', maxWidth: 680, marginTop: 28 }}>
        <GameLearnCard gameKey="flowchart-bingo" />
      </div>
    </div>
  );
};

export default FlowchartBingoGame;
