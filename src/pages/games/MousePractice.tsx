import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft, RotateCcw, Trophy, Clock, Target,
  MousePointer, Zap, Layers, Award, Sparkles, CheckCircle2,
  Volume2, VolumeX
} from 'lucide-react';
import { useGameProgress } from '../../hooks/useGameProgress';
import { mouseAudio } from '../../services/mouseAudioService';
import './GameStyles.css';

type PracticeMode = 'single' | 'double' | 'right' | 'drag' | 'exam';
type SpeedLevel = 'easy' | 'normal' | 'challenge';

interface TargetItem {
  id: number;
  x: number;
  y: number;
  emoji: string;
  label: string;
  size: number;
  type: 'single' | 'double' | 'right';
  clicksNeeded: number;
  clicksCount: number;
  category?: 'hardware' | 'software' | 'trash';
}

interface DragItem {
  id: number;
  name: string;
  emoji: string;
  category: 'input' | 'output' | 'storage';
}

const DRAG_ITEMS_POOL: DragItem[] = [
  { id: 1, name: 'เมาส์', emoji: '🖱️', category: 'input' },
  { id: 2, name: 'คีย์บอร์ด', emoji: '⌨️', category: 'input' },
  { id: 3, name: 'ไมโครโฟน', emoji: '🎙️', category: 'input' },
  { id: 4, name: 'จอภาพ', emoji: '🖥️', category: 'output' },
  { id: 5, name: 'ลำโพง', emoji: '🔊', category: 'output' },
  { id: 6, name: 'เครื่องพิมพ์', emoji: '🖨️', category: 'output' },
  { id: 7, name: 'แฟลชไดรฟ์', emoji: '💾', category: 'storage' },
  { id: 8, name: 'ฮาร์ดดิสก์', emoji: '💽', category: 'storage' },
];

const EMOJIS = ['🍎', '🍌', '🍇', '🍉', '🍊', '🍓', '🥝', '🍑', '🍒', '🥭', '⭐', '🎈', '🚀', '💎'];

const MousePractice: React.FC = () => {
  const [mode, setMode] = useState<PracticeMode>('single');
  const [speed, setSpeed] = useState<SpeedLevel>('easy');
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [time, setTime] = useState(60);
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [targets, setTargets] = useState<TargetItem[]>([]);
  const [soundOn, setSoundOn] = useState(true);

  // Drag & drop state
  const [currentDragItem, setCurrentDragItem] = useState<DragItem | null>(null);

  const [bestScore, setBestScore] = useState(() =>
    parseInt(localStorage.getItem('kj_mouse_best') || '0')
  );

  const arenaRef = useRef<HTMLDivElement>(null);
  const recordGame = useGameProgress('mouse', 'ภารกิจเมาส์แม่นยำ Pro (ว.PA ป.1)');

  const scoreRef = useRef(score);
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  // Sound toggle
  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    mouseAudio.setSoundEnabled(next);
  };

  // Handle Game End
  const handleGameEnd = useCallback(() => {
    setRunning(false);
    setGameOver(true);
    const currentScore = scoreRef.current;

    setBestScore((currentBest) => {
      if (currentScore > currentBest) {
        localStorage.setItem('kj_mouse_best', String(currentScore));
        return currentScore;
      }
      return currentBest;
    });

    if (currentScore > 0) void recordGame(currentScore);

    if (soundOn) mouseAudio.playVictory();

    // Save detailed assessment for PA report
    const accuracy = hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 100;
    const assessmentData = {
      mode,
      score: currentScore,
      hits,
      misses,
      accuracy,
      maxCombo,
      timestamp: Date.now(),
    };
    try {
      const history = JSON.parse(localStorage.getItem('kj_mouse_assessment_history') || '[]');
      history.push(assessmentData);
      localStorage.setItem('kj_mouse_assessment_history', JSON.stringify(history.slice(-30)));
    } catch {
      // ignore
    }
  }, [hits, misses, maxCombo, mode, recordGame, soundOn]);

  // Timer Effect
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleGameEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [running, handleGameEnd]);

  // Spawn Targets Effect
  useEffect(() => {
    if (!running || mode === 'drag') return;

    // Timing & sizing parameters tuned specifically for Grade 1 children
    const baseInterval = speed === 'easy' ? 2200 : speed === 'normal' ? 1500 : 900;
    const intervalMs = mode === 'double' ? baseInterval + 400 : baseInterval;
    const targetSize = speed === 'easy' ? (mode === 'double' ? 88 : 80) : speed === 'normal' ? (mode === 'double' ? 74 : 66) : (mode === 'double' ? 62 : 54);
    const lifetime = speed === 'easy' ? 6000 : speed === 'normal' ? 4200 : 2500;
    const maxTargets = speed === 'easy' ? 3 : speed === 'normal' ? 5 : 7;

    const spawn = setInterval(() => {
      if (!arenaRef.current) return;
      const rect = arenaRef.current.getBoundingClientRect();
      const size = targetSize;

      let targetType: 'single' | 'double' | 'right' = 'single';
      let clicksNeeded = 1;
      let label = 'คลิกซ้าย';

      if (mode === 'double') {
        targetType = 'double';
        clicksNeeded = 2;
        label = 'ดับเบิลคลิก! ⚡';
      } else if (mode === 'right') {
        targetType = 'right';
        label = 'คลิกขวา! 🖱️';
      } else if (mode === 'exam') {
        const rand = Math.random();
        if (rand < 0.45) {
          targetType = 'single';
          label = 'คลิกซ้าย';
        } else if (rand < 0.8) {
          targetType = 'double';
          clicksNeeded = 2;
          label = 'ดับเบิลคลิก! ⚡';
        } else {
          targetType = 'right';
          label = 'คลิกขวา! 🖱️';
        }
      }

      const newTarget: TargetItem = {
        id: Date.now() + Math.random(),
        x: Math.random() * (rect.width - size - 40) + 20,
        y: Math.random() * (rect.height - size - 40) + 20,
        emoji: targetType === 'double' ? '📦' : targetType === 'right' ? '💎' : EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
        label,
        size,
        type: targetType,
        clicksNeeded,
        clicksCount: 0,
      };

      setTargets((prev) => [...prev.slice(-(maxTargets - 1)), newTarget]);

      // Auto-remove target after generous lifetime
      setTimeout(() => {
        setTargets((prev) => prev.filter((t) => t.id !== newTarget.id));
      }, lifetime);
    }, intervalMs);

    return () => clearInterval(spawn);
  }, [running, mode, speed]);

  // Drag Mode: Spawn initial item
  useEffect(() => {
    if (running && mode === 'drag' && !currentDragItem) {
      const randomItem = DRAG_ITEMS_POOL[Math.floor(Math.random() * DRAG_ITEMS_POOL.length)];
      const timer = window.setTimeout(() => setCurrentDragItem(randomItem), 0);
      return () => window.clearTimeout(timer);
    }
  }, [running, mode, currentDragItem]);

  const start = () => {
    setScore(0);
    setHits(0);
    setMisses(0);
    setCombo(0);
    setMaxCombo(0);
    setTime(mode === 'exam' ? 60 : 45);
    setTargets([]);
    setGameOver(false);
    if (mode === 'drag') {
      setCurrentDragItem(DRAG_ITEMS_POOL[Math.floor(Math.random() * DRAG_ITEMS_POOL.length)]);
    }
    setRunning(true);
  };

  const handleHit = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = targets.find((t) => t.id === id);
    if (!target) return;

    // Check if right click was required
    if (target.type === 'right') {
      if (soundOn) mouseAudio.playMiss();
      setMisses((m) => m + 1);
      setCombo(0);
      return;
    }

    if (target.type === 'double') {
      const nextCount = target.clicksCount + 1;
      if (nextCount < target.clicksNeeded) {
        if (soundOn) mouseAudio.playPop(1.2);
        setTargets((prev) =>
          prev.map((t) => (t.id === id ? { ...t, clicksCount: nextCount, emoji: '✨' } : t))
        );
        return;
      }
      if (soundOn) mouseAudio.playDoubleClick();
    } else {
      if (soundOn) mouseAudio.playPop(1 + Math.min(combo * 0.05, 0.8));
    }

    // Success hit
    const addedPoints = 10 + combo * 2;
    setScore((s) => s + addedPoints);
    setHits((h) => h + 1);
    setCombo((c) => {
      const next = c + 1;
      if (next % 5 === 0 && soundOn) mouseAudio.playCombo();
      setMaxCombo((m) => Math.max(m, next));
      return next;
    });
    setTargets((prev) => prev.filter((t) => t.id !== id));
  };

  const handleContextMenu = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const target = targets.find((t) => t.id === id);
    if (!target) return;

    if (target.type === 'right') {
      if (soundOn) mouseAudio.playRightClick();
      const addedPoints = 15 + combo * 2;
      setScore((s) => s + addedPoints);
      setHits((h) => h + 1);
      setCombo((c) => {
        const next = c + 1;
        if (next % 5 === 0 && soundOn) mouseAudio.playCombo();
        setMaxCombo((m) => Math.max(m, next));
        return next;
      });
      setTargets((prev) => prev.filter((t) => t.id !== id));
    } else {
      if (soundOn) mouseAudio.playMiss();
      setMisses((m) => m + 1);
      setCombo(0);
    }
  };

  const handleMiss = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.mouse-target-item') || (e.target as HTMLElement).closest('.drag-zone')) {
      return;
    }
    if (running) {
      if (soundOn) mouseAudio.playMiss();
      setMisses((m) => m + 1);
      setCombo(0);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent) => {
    if (!currentDragItem) return;
    e.dataTransfer.setData('text/plain', currentDragItem.category);
  };

  const handleDrop = (category: 'input' | 'output' | 'storage', e: React.DragEvent) => {
    e.preventDefault();
    if (!currentDragItem) return;

    if (currentDragItem.category === category) {
      if (soundOn) mouseAudio.playDragSuccess();
      setScore((s) => s + 20);
      setHits((h) => h + 1);
      setCombo((c) => {
        const next = c + 1;
        if (next % 5 === 0 && soundOn) mouseAudio.playCombo();
        setMaxCombo((m) => Math.max(m, next));
        return next;
      });
    } else {
      if (soundOn) mouseAudio.playMiss();
      setMisses((m) => m + 1);
      setCombo(0);
    }

    // Pick next item
    const nextItem = DRAG_ITEMS_POOL[Math.floor(Math.random() * DRAG_ITEMS_POOL.length)];
    setCurrentDragItem(nextItem);
  };

  const accuracy = hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 100;

  return (
    <div className="game-page-container">
      {/* Top Navbar */}
      <div className="game-top-nav">
        <Link to="/games" className="game-back-link">
          <ChevronLeft size={20} /> กลับหน้ารวมเกม
        </Link>
        <h1 className="game-title">🖱️ ภารกิจฝึกทักษะเมาส์ Pro (ว.PA ป.1)</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            className="mode-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', fontSize: '0.8rem', background: soundOn ? '#e0f2fe' : '#f1f5f9', color: soundOn ? '#0284c7' : '#64748b' }}
            onClick={toggleSound}
          >
            {soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
            <span>{soundOn ? 'เสียงเปิด' : 'เสียงปิด'}</span>
          </button>
          <div className="game-best-badge">
            <Trophy size={16} /> สถิติสูงสุด: {bestScore}
          </div>
        </div>
      </div>

      {/* Mode Selector Chips */}
      <div className="mouse-mode-bar">
        <span className="mode-bar-label">🎯 เลือกทักษะที่ต้องการฝึก:</span>
        <div className="mode-chip-group">
          <button
            type="button"
            className={`mode-btn ${mode === 'single' ? 'active' : ''}`}
            onClick={() => { if (!running) setMode('single'); }}
            disabled={running}
          >
            <MousePointer size={15} /> 1. คลิกซ้ายเดี่ยว
          </button>
          <button
            type="button"
            className={`mode-btn ${mode === 'double' ? 'active' : ''}`}
            onClick={() => { if (!running) setMode('double'); }}
            disabled={running}
          >
            <Zap size={15} /> 2. ดับเบิลคลิก (Double Click)
          </button>
          <button
            type="button"
            className={`mode-btn ${mode === 'right' ? 'active' : ''}`}
            onClick={() => { if (!running) setMode('right'); }}
            disabled={running}
          >
            <Target size={15} /> 3. คลิกขวา (Right Click)
          </button>
          <button
            type="button"
            className={`mode-btn ${mode === 'drag' ? 'active' : ''}`}
            onClick={() => { if (!running) setMode('drag'); }}
            disabled={running}
          >
            <Layers size={15} /> 4. ลากและวาง (Drag & Drop)
          </button>
          <button
            type="button"
            className={`mode-btn mode-btn-exam ${mode === 'exam' ? 'active' : ''}`}
            onClick={() => { if (!running) setMode('exam'); }}
            disabled={running}
          >
            <Award size={15} /> ⭐ โหมดทดสอบ ว.PA
          </button>
        </div>
      </div>

      {/* Speed / Difficulty Level for Kids */}
      <div className="mouse-speed-bar">
        <span className="speed-bar-label">⚡ ระดับความเร็ว:</span>
        <div className="speed-chip-group">
          <button
            type="button"
            className={`speed-chip ${speed === 'easy' ? 'active-easy' : ''}`}
            onClick={() => { if (!running) setSpeed('easy'); }}
            disabled={running}
          >
            🐢 ช้ามาก (เป้าใหญ่อยู่นาน 6 วินาที — แนะนำสำหรับเด็ก ป.1)
          </button>
          <button
            type="button"
            className={`speed-chip ${speed === 'normal' ? 'active-normal' : ''}`}
            onClick={() => { if (!running) setSpeed('normal'); }}
            disabled={running}
          >
            🚶 ปานกลาง (4.2 วิ)
          </button>
          <button
            type="button"
            className={`speed-chip ${speed === 'challenge' ? 'active-challenge' : ''}`}
            onClick={() => { if (!running) setSpeed('challenge'); }}
            disabled={running}
          >
            🏃 ไว / ท้าทาย (2.5 วิ)
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="game-stats-header">
        <div className="stat-pill score-pill">
          <span>คะแนน</span>
          <strong>{score}</strong>
        </div>
        <div className="stat-pill time-pill">
          <Clock size={16} />
          <span>เวลา</span>
          <strong>{time} วินาที</strong>
        </div>
        <div className="stat-pill accuracy-pill">
          <span>ความแม่นยำ</span>
          <strong>{accuracy}%</strong>
        </div>
        {combo > 1 && (
          <div className="stat-pill combo-pill">
            <Sparkles size={16} />
            <span>Combo</span>
            <strong>x{combo}</strong>
          </div>
        )}
      </div>

      {/* Game Play Arena */}
      <div
        ref={arenaRef}
        className="mouse-arena"
        onClick={handleMiss}
        onContextMenu={(e) => { if (mode !== 'right' && mode !== 'exam') e.preventDefault(); }}
      >
        {!running && !gameOver && (
          <div className="arena-overlay">
            <div className="arena-prompt-card">
              <div className="prompt-icon">🖱️</div>
              <h2>
                {mode === 'single' && 'ฝึกคลิกซ้ายเดี่ยว (Single Click)'}
                {mode === 'double' && 'ฝึกดับเบิลคลิกเปิดกล่อง (Double Click)'}
                {mode === 'right' && 'ฝึกคลิกขวาด้วยนิ้วกลาง (Right Click)'}
                {mode === 'drag' && 'ฝึกลากและวางอุปกรณ์ (Drag & Drop)'}
                {mode === 'exam' && 'ทดสอบทักษะการใช้เมาส์รวม (ว.PA Pre/Post Test)'}
              </h2>
              <p>
                {mode === 'single' && 'จับเมาส์ เล็งลูกศรไปที่ผลไม้ แล้วคลิกซ้ายให้เร็วและแม่นยำที่สุด'}
                {mode === 'double' && 'เล็งลูกศรไปที่กล่องพัสดุ แล้วคลิกซ้าย 2 ครั้งติดกันเร็วๆ เพื่อเปิดกล่อง'}
                {mode === 'right' && 'ใช้นิ้วกลางคลิกขวาที่อัญมณีเพื่อเก็บคะแนน (ห้ามคลิกซ้าย!)'}
                {mode === 'drag' && 'ลากอุปกรณ์คอมพิวเตอร์ไปปล่อยในหมวดหมู่ที่ถูกต้อง (หน่วยรับเข้า / หน่วยส่งออก / หน่วยบันทึก)'}
                {mode === 'exam' && 'ทดสอบทักษะเมาส์ครบทุกแบบ 60 วินาที บันทึกผลความแม่นยำลงประเด็นท้าทาย ว.PA'}
              </p>
              <button type="button" className="btn-start-game" onClick={start}>
                ▶️ เริ่มทดสอบเมาส์!
              </button>
            </div>
          </div>
        )}

        {gameOver && (
          <div className="arena-overlay">
            <div className="arena-prompt-card result-card">
              <div className="prompt-icon">🏆</div>
              <h2>สรุปผลการทดสอบการใช้เมาส์</h2>
              <div className="result-stats-grid">
                <div className="res-stat-box">
                  <span className="res-stat-lbl">คะแนนที่ได้</span>
                  <strong className="res-stat-val text-primary">{score}</strong>
                </div>
                <div className="res-stat-box">
                  <span className="res-stat-lbl">คลิกโดนเป้า</span>
                  <strong className="res-stat-val text-success">{hits} ครั้ง</strong>
                </div>
                <div className="res-stat-box">
                  <span className="res-stat-lbl">ความแม่นยำ</span>
                  <strong className="res-stat-val text-info">{accuracy}%</strong>
                </div>
                <div className="res-stat-box">
                  <span className="res-stat-lbl">คอมโบสูงสุด</span>
                  <strong className="res-stat-val text-warning">{maxCombo} ต่อเนื่อง</strong>
                </div>
              </div>
              <div className="pa-evaluation-badge">
                <CheckCircle2 size={18} />
                <span>
                  ระดับประเมิน: <strong>{score >= 200 ? 'ดีมาก (ผ่านเกณฑ์ประเด็นท้าทาย)' : score >= 100 ? 'ปานกลาง (ผ่านเกณฑ์)' : 'กำลังพัฒนา'}</strong>
                </span>
              </div>
              <div className="result-buttons">
                <button type="button" className="btn-start-game" onClick={start}>
                  <RotateCcw size={16} /> ทดสอบอีกครั้ง
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Targets Mode (Single, Double, Right, Exam) */}
        {running && mode !== 'drag' && targets.map((t) => (
          <div
            key={t.id}
            className={`mouse-target-item target-${t.type}`}
            style={{
              left: `${t.x}px`,
              top: `${t.y}px`,
              width: `${t.size}px`,
              height: `${t.size}px`,
            }}
            onClick={(e) => handleHit(t.id, e)}
            onContextMenu={(e) => handleContextMenu(t.id, e)}
          >
            <span className="target-emoji">{t.emoji}</span>
            <span className="target-label">{t.label}</span>
          </div>
        ))}

        {/* Drag & Drop Mode Arena */}
        {running && mode === 'drag' && (
          <div className="drag-mode-container">
            {/* Draggable Item */}
            <div className="draggable-source-area">
              <div className="drag-instruction-text">
                👇 ลากอุปกรณ์นี้ไปใส่ในกล่องหมวดหมู่ที่ถูกต้อง:
              </div>
              {currentDragItem && (
                <div
                  className="draggable-card"
                  draggable
                  onDragStart={handleDragStart}
                >
                  <span className="drag-emoji">{currentDragItem.emoji}</span>
                  <span className="drag-name">{currentDragItem.name}</span>
                  <span className="drag-hint">👈 คลิกค้างแล้วลาก</span>
                </div>
              )}
            </div>

            {/* Drop Target Bins */}
            <div className="drop-zones-grid">
              <div
                className="drop-zone input-zone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop('input', e)}
              >
                <div className="zone-icon">📥</div>
                <h4>หน่วยรับเข้า (Input)</h4>
                <p>เช่น เมาส์, คีย์บอร์ด, ไมค์</p>
              </div>

              <div
                className="drop-zone output-zone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop('output', e)}
              >
                <div className="zone-icon">📤</div>
                <h4>หน่วยส่งออก (Output)</h4>
                <p>เช่น จอภาพ, ลำโพง, ปริ้นเตอร์</p>
              </div>

              <div
                className="drop-zone storage-zone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop('storage', e)}
              >
                <div className="zone-icon">💾</div>
                <h4>หน่วยเก็บข้อมูล (Storage)</h4>
                <p>เช่น แฟลชไดรฟ์, ฮาร์ดดิสก์</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .game-page-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 16px 20px 40px;
          font-family: 'Prompt', 'Sarabun', sans-serif;
          color: #1e293b;
        }

        .game-top-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          flex-wrap: wrap;
          gap: 8px;
        }

        .game-back-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #6366f1;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.95rem;
        }

        .game-title {
          font-size: 1.35rem;
          font-weight: bold;
          margin: 0;
          color: #0f172a;
        }

        .game-best-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #fef3c7;
          color: #b45309;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: bold;
        }

        .mouse-mode-bar {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 10px 14px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .mode-bar-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #475569;
        }

        .mode-chip-group {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .mode-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 0.82rem;
          font-weight: 600;
          background: white;
          border: 1px solid #cbd5e1;
          color: #334155;
          cursor: pointer;
          transition: all 0.15s;
        }

        .mode-btn:hover:not(:disabled) {
          background: #e2e8f0;
        }

        .mode-btn.active {
          background: #4f46e5;
          color: white;
          border-color: #4f46e5;
          box-shadow: 0 2px 6px rgba(79, 70, 229, 0.25);
        }

        .mode-btn-exam.active {
          background: #f59e0b;
          border-color: #f59e0b;
          box-shadow: 0 2px 6px rgba(245, 158, 11, 0.3);
        }

        .game-stats-header {
          display: flex;
          gap: 10px;
          margin-bottom: 12px;
        }

        .stat-pill {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 6px 14px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.03);
        }

        .stat-pill strong { font-size: 1rem; color: #0f172a; }
        .score-pill strong { color: #16a34a; }
        .combo-pill { background: #fdf4ff; border-color: #f0abfc; color: #a21caf; }

        .mouse-arena {
          position: relative;
          width: 100%;
          height: 480px;
          background: linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%);
          border: 2px dashed #cbd5e1;
          border-radius: 16px;
          overflow: hidden;
          cursor: crosshair;
          user-select: none;
        }

        .arena-overlay {
          position: absolute;
          inset: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 20;
          padding: 20px;
        }

        .arena-prompt-card {
          background: white;
          max-width: 480px;
          padding: 24px;
          border-radius: 16px;
          text-align: center;
          box-shadow: 0 12px 30px rgba(0,0,0,0.2);
        }

        .prompt-icon { font-size: 2.5rem; margin-bottom: 8px; }
        .arena-prompt-card h2 { font-size: 1.25rem; font-weight: bold; margin: 0 0 8px; color: #0f172a; }
        .arena-prompt-card p { font-size: 0.88rem; color: #64748b; line-height: 1.45; margin: 0 0 16px; }

        .btn-start-game {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
          border: none;
          padding: 10px 24px;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
          transition: transform 0.15s;
        }
        .btn-start-game:hover { transform: scale(1.03); }

        .result-stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 14px;
        }

        .res-stat-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 8px;
        }
        .res-stat-lbl { font-size: 0.75rem; color: #64748b; display: block; }
        .res-stat-val { font-size: 1.1rem; }

        .pa-evaluation-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #15803d;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 0.85rem;
          margin-bottom: 16px;
        }

        .mouse-speed-bar {
          background: #fdf4ff;
          border: 1px solid #f0abfc;
          border-radius: 12px;
          padding: 8px 14px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .speed-bar-label {
          font-size: 0.84rem;
          font-weight: 700;
          color: #86198f;
        }

        .speed-chip-group {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .speed-chip {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          background: white;
          border: 1px solid #e2e8f0;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s;
        }

        .speed-chip:hover:not(:disabled) {
          background: #f8fafc;
        }

        .speed-chip.active-easy {
          background: #16a34a;
          color: white;
          border-color: #16a34a;
          box-shadow: 0 2px 6px rgba(22, 163, 74, 0.3);
          font-weight: bold;
        }

        .speed-chip.active-normal {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
        }

        .speed-chip.active-challenge {
          background: #f97316;
          color: white;
          border-color: #f97316;
          box-shadow: 0 2px 6px rgba(249, 115, 22, 0.3);
        }

        .mouse-target-item {
          position: absolute;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 16px rgba(0,0,0,0.14);
          cursor: pointer;
          animation: popIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          user-select: none;
          transition: transform 0.1s;
        }

        .mouse-target-item:hover { transform: scale(1.08); }
        .target-single { background: #fee2e2; border: 3px solid #ef4444; }
        .target-double { background: #fef3c7; border: 3px solid #f59e0b; border-radius: 18px; }
        .target-right { background: #e0e7ff; border: 3px solid #6366f1; border-radius: 16px; }

        .target-emoji { font-size: 2.3rem; line-height: 1; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15)); }
        .target-label { font-size: 0.72rem; font-weight: 700; color: #1e293b; margin-top: 2px; }

        .drag-mode-container {
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 20px;
        }

        .draggable-source-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .drag-instruction-text {
          font-size: 0.95rem;
          font-weight: bold;
          color: #334155;
        }

        .draggable-card {
          background: white;
          border: 2px solid #4f46e5;
          border-radius: 14px;
          padding: 12px 24px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          cursor: grab;
          box-shadow: 0 6px 16px rgba(79, 70, 229, 0.15);
          transition: transform 0.15s;
        }
        .draggable-card:active { cursor: grabbing; transform: scale(0.96); }

        .drag-emoji { font-size: 2rem; }
        .drag-name { font-size: 1.15rem; font-weight: bold; color: #0f172a; }
        .drag-hint { font-size: 0.75rem; color: #64748b; }

        .drop-zones-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }

        .drop-zone {
          background: white;
          border: 2px dashed #cbd5e1;
          border-radius: 14px;
          padding: 16px;
          text-align: center;
          transition: all 0.2s;
        }

        .drop-zone:hover {
          border-color: #4f46e5;
          background: #f8fafc;
        }

        .zone-icon { font-size: 1.8rem; margin-bottom: 4px; }
        .drop-zone h4 { font-size: 0.95rem; font-weight: bold; margin: 0 0 2px; color: #0f172a; }
        .drop-zone p { font-size: 0.75rem; color: #64748b; margin: 0; }

        @keyframes popIn {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default MousePractice;
