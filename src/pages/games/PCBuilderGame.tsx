import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  RotateCcw,
  CheckCircle2,
  Trophy,
  ArrowRight,
  Sparkles,
  Laptop,
} from 'lucide-react';
import { useGameProgress } from '../../hooks/useGameProgress';
import { useGameTimers } from '../../hooks/useGameTimers';
import { sfxCorrect, sfxCoin } from '../../utils/gameSounds';
import GameLearnCard from '../../components/GameLearnCard';
import './GameStyles.css';
import './PCBuilderGame.css';

interface HardwarePart {
  id: string;
  name: string;
  nameEn: string;
  emoji: string;
  category: 'Input' | 'Output' | 'Processing' | 'Storage' | 'Power' | 'Case';
  description: string;
}

interface StageConfig {
  stageNumber: number;
  title: string;
  subtitle: string;
  parts: HardwarePart[];
}

const STAGES: StageConfig[] = [
  {
    stageNumber: 1,
    title: 'ด่านที่ 1: อุปกรณ์ภายนอกรอบโต๊ะทำงาน (Peripherals)',
    subtitle: 'นำอุปกรณ์หลักรอบตัวเครื่องมาประกอบเข้ากับโต๊ะทำงานให้ถูกต้อง',
    parts: [
      {
        id: 'monitor',
        name: 'จอภาพ',
        nameEn: 'Monitor',
        emoji: '🖥️',
        category: 'Output',
        description: 'หน่วยส่งออก (Output) แสดงผลลัพธ์ข้อมูล รูปภาพ และวิดีโอให้ผู้ใช้งานมองเห็น',
      },
      {
        id: 'case',
        name: 'เคสคอมพิวเตอร์',
        nameEn: 'Computer Case',
        emoji: '🗄️',
        category: 'Case',
        description: 'โครงเคสหลัก ใช้บรรจุ ยึดจับ และปกป้องแผงวงจรอิเล็กทรอนิกส์ทั้งหมด',
      },
      {
        id: 'keyboard',
        name: 'คีย์บอร์ด / แป้นพิมพ์',
        nameEn: 'Keyboard',
        emoji: '⌨️',
        category: 'Input',
        description: 'หน่วยรับเข้า (Input) ใช้ป้อนข้อมูลตัวอักษร ตัวเลข และคำสั่งเข้าสู่ระบบ',
      },
      {
        id: 'mouse',
        name: 'เมาส์',
        nameEn: 'Mouse',
        emoji: '🖱️',
        category: 'Input',
        description: 'หน่วยรับเข้า (Input) ใช้ชี้ตำแหน่ง เลื่อนเคอร์เซอร์ และคลิกเลือกคำสั่งบนหน้าจอ',
      },
      {
        id: 'speakers',
        name: 'ลำโพงสเตอริโอ',
        nameEn: 'Speakers',
        emoji: '🔊',
        category: 'Output',
        description: 'หน่วยส่งออก (Output) แปลงสัญญาณไฟฟ้าดิจิทัลให้ออกมาเป็นคลื่นเสียงที่ได้ยิน',
      },
    ],
  },
  {
    stageNumber: 2,
    title: 'ด่านที่ 2: ชิ้นส่วนภายในเคสคอมพิวเตอร์ (Internal Hardware)',
    subtitle: 'ประกอบแผงวงจรและหน่วยประมวลผลภายในเคสให้เครื่องสามารถบูตเปิดติด',
    parts: [
      {
        id: 'motherboard',
        name: 'เมนบอร์ด',
        nameEn: 'Motherboard',
        emoji: '🟩',
        category: 'Processing',
        description: 'แผงวงจรหลักขนาดใหญ่ เป็นศูนย์กลางเชื่อมต่อข้อมูลระหว่างอุปกรณ์ทุกชิ้น',
      },
      {
        id: 'cpu',
        name: 'ซีพียู (CPU)',
        nameEn: 'Central Processing Unit',
        emoji: '🔲',
        category: 'Processing',
        description: 'สมองหลักของคอมพิวเตอร์ ทำหน้าที่คิดคำนวณและประมวลผลคำสั่งทั้งหมด',
      },
      {
        id: 'ram',
        name: 'แรม (RAM)',
        nameEn: 'Random Access Memory',
        emoji: '⚡',
        category: 'Storage',
        description: 'หน่วยความจำชั่วคราวความเร็วสูง ช่วยให้เครื่องเปิดหลายโปรแกรมพร้อมกันได้เร็ว',
      },
      {
        id: 'psu',
        name: 'พาวเวอร์ซัพพลาย (PSU)',
        nameEn: 'Power Supply Unit',
        emoji: '🔌',
        category: 'Power',
        description: 'แปลงกระแสไฟบ้านเป็นไฟฟ้ากระแสตรง และจ่ายพลังงานให้ทุกชิ้นส่วนอย่างปลอดภัย',
      },
      {
        id: 'ssd',
        name: 'เอสเอสดี (SSD Storage)',
        nameEn: 'Solid State Drive',
        emoji: '💾',
        category: 'Storage',
        description: 'หน่วยจัดเก็บข้อมูลถาวร จัดเก็บ Windows, แอพพลิเคชัน และไฟล์งานทั้งหมด',
      },
      {
        id: 'gpu',
        name: 'การ์ดแสดงผล (GPU)',
        nameEn: 'Graphics Processing Unit',
        emoji: '🎮',
        category: 'Processing',
        description: 'ประมวลผลกราฟิก 3D ภาพเคลื่อนไหวความละเอียดสูง และการเรนเดอร์ภาพเกม',
      },
    ],
  },
];

const PCBuilderGame: React.FC = () => {
  const timers = useGameTimers();
  const occupiedSlots = useRef(new Set<string>());
  const scoredParts = useRef(new Set<string>());
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [placedParts, setPlacedParts] = useState<{ [slotId: string]: string }>({});
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [score, setScore] = useState(0);
  const [draggedPartId, setDraggedPartId] = useState<string | null>(null);
  const [dragOverSlotId, setDragOverSlotId] = useState<string | null>(null);

  const recordGame = useGameProgress('pc-builder', 'ประกอบคอมพิวเตอร์ (PC Builder)');

  const currentStage = STAGES[currentStageIndex];

  // Sound effects helper
  const playSnapTone = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
      osc.onended = () => { void ctx.close(); };
    } catch {
      // Ignore
    }
  }, []);

  const playStartupChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.36);
        if (idx === notes.length - 1) osc.onended = () => { void ctx.close(); };
      });
    } catch {
      // Ignore
    }
  }, []);

  // Check if current stage is completely assembled
  const isStageComplete = useCallback(() => {
    return currentStage.parts.every((part) => placedParts[part.id] === part.id);
  }, [currentStage.parts, placedParts]);

  // Handle placement logic
  const tryPlacePart = useCallback((slotId: string, partId: string) => {
    if (showSummaryModal || occupiedSlots.current.has(slotId) || !currentStage.parts.some(part => part.id === partId)) return;
    if (slotId === partId) {
      occupiedSlots.current.add(slotId);
      // Correct match!
      playSnapTone();
      const nextPlaced = { ...placedParts, [slotId]: partId };
      setPlacedParts(nextPlaced);
      setSelectedPartId(null);
      const scoreKey = `${currentStageIndex}:${partId}`;
      if (!scoredParts.current.has(scoreKey)) {
        scoredParts.current.add(scoreKey);
        setScore((s) => s + 100);
      }

      // Check if all placed
      const allDone = currentStage.parts.every((p) => nextPlaced[p.id] === p.id);
      if (allDone) {
        timers.schedule(() => {
          playStartupChime();
          setShowSummaryModal(true);
        }, 400);
      }
    } else {
      // Mismatched
      setSelectedPartId(null);
    }
  }, [currentStage.parts, currentStageIndex, placedParts, playSnapTone, playStartupChime, showSummaryModal, timers]);

  // Click handler on a slot
  const handleSlotClick = (slotId: string) => {
    if (placedParts[slotId]) return; // already placed
    if (selectedPartId) {
      tryPlacePart(slotId, selectedPartId);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, partId: string) => {
    e.dataTransfer.setData('text/plain', partId);
    setDraggedPartId(partId);
  };

  const handleDragOver = (e: React.DragEvent, slotId: string) => {
    e.preventDefault();
    setDragOverSlotId(slotId);
  };

  const handleDragLeave = () => {
    setDragOverSlotId(null);
  };

  const handleDrop = (e: React.DragEvent, slotId: string) => {
    e.preventDefault();
    setDragOverSlotId(null);
    const partId = e.dataTransfer.getData('text/plain') || draggedPartId;
    if (partId) {
      tryPlacePart(slotId, partId);
    }
    setDraggedPartId(null);
  };

  // Move to next stage
  const handleNextStage = () => {
    timers.clear();
    setShowSummaryModal(false);
    if (currentStageIndex + 1 < STAGES.length) {
      occupiedSlots.current.clear();
      setCurrentStageIndex((i) => i + 1);
      setPlacedParts({});
      setSelectedPartId(null);
      sfxCoin();
    } else {
      // Entire game finished
      sfxCorrect();
    }
  };

  // Restart game
  const handleResetGame = () => {
    timers.clear();
    occupiedSlots.current.clear();
    scoredParts.current.clear();
    setDraggedPartId(null);
    setDragOverSlotId(null);
    setCurrentStageIndex(0);
    setPlacedParts({});
    setSelectedPartId(null);
    setShowSummaryModal(false);
    setScore(0);
  };

  // Check game completion effect
  useEffect(() => {
    if (score === STAGES.reduce((total, stage) => total + stage.parts.length * 100, 0) && isStageComplete()) {
      void recordGame(score, undefined, STAGES.reduce((total, stage) => total + stage.parts.length * 100, 0));
    }
  }, [currentStageIndex, isStageComplete, score, recordGame]);

  return (
    <div className="pcb-container">
      {/* Educational Learning Card */}
      <GameLearnCard gameKey="pc-builder" />

      {/* Header */}
      <header className="pcb-header">
        <Link to="/games" className="pcb-back-btn">
          <ChevronLeft size={18} />
          <span>เกมทั้งหมด</span>
        </Link>
        <div className="pcb-title-wrap">
          <h1 className="pcb-title">🖥️ PC Builder Pro</h1>
          <p className="pcb-subtitle">เกมประกอบคอมพิวเตอร์ & เรียนรู้หน้าที่ฮาร์ดแวร์</p>
        </div>
        <button
          type="button"
          className="pcb-back-btn"
          onClick={handleResetGame}
          title="เริ่มใหม่"
        >
          <RotateCcw size={16} />
          <span>เริ่มใหม่</span>
        </button>
      </header>

      {/* Level Selection Tabs */}
      <div className="pcb-level-tabs">
        {STAGES.map((stg, idx) => (
          <button
            key={stg.stageNumber}
            type="button"
            className={`pcb-tab-btn ${idx === currentStageIndex ? 'active' : ''} ${
              idx < currentStageIndex ? 'completed' : ''
            }`}
            onClick={() => {
              timers.clear();
              occupiedSlots.current.clear();
              setDraggedPartId(null);
              setDragOverSlotId(null);
              setCurrentStageIndex(idx);
              setPlacedParts({});
              setSelectedPartId(null);
              setShowSummaryModal(false);
            }}
          >
            {idx < currentStageIndex ? <CheckCircle2 size={16} /> : <Laptop size={16} />}
            <span>ด่าน {stg.stageNumber}: {stg.parts.length} ชิ้นส่วน</span>
          </button>
        ))}
      </div>

      {/* Main Assembly Workstation Desk */}
      <div className="pcb-workspace">
        {/* Stage Title and Instruction */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
            {currentStage.title}
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '4px 0 0 0' }}>
            {currentStage.subtitle}
          </p>
        </div>

        {/* Droppable Component Target Slots */}
        <div className={`pcb-slots-grid ${currentStageIndex === 1 ? 'stage2' : ''}`}>
          {currentStage.parts.map((part) => {
            const isFilled = placedParts[part.id] === part.id;
            const isDragOver = dragOverSlotId === part.id;

            return (
              <div
                key={part.id}
                className={`pcb-slot-card ${isFilled ? 'filled' : ''} ${isDragOver ? 'drag-over' : ''}`}
                onClick={() => handleSlotClick(part.id)}
                onDragOver={(e) => handleDragOver(e, part.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, part.id)}
              >
                <div className="pcb-slot-icon">
                  {isFilled ? part.emoji : '⭕'}
                </div>
                <div className="pcb-slot-label">
                  {isFilled ? part.name : `ช่องวาง: ${part.name}`}
                </div>
                <div className="pcb-slot-sublabel">
                  {isFilled ? `(${part.category})` : 'ลากหรือแตะวางที่นี่'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Parts Shelf (Available Items) */}
        <div className="pcb-shelf">
          <div className="pcb-shelf-header">
            <span>🧱 ชิ้นส่วนที่ต้องนำไปประกอบ (คลิกเลือกหรือลากไปวาง):</span>
            <span style={{ color: '#38bdf8' }}>คะแนนสะสม: {score}</span>
          </div>

          <div className="pcb-parts-row">
            {currentStage.parts.map((part) => {
              const isUsed = placedParts[part.id] === part.id;
              const isSelected = selectedPartId === part.id;

              return (
                <div
                  key={part.id}
                  draggable={!isUsed}
                  onDragStart={(e) => handleDragStart(e, part.id)}
                  onClick={() => {
                    if (!isUsed) {
                      setSelectedPartId(isSelected ? null : part.id);
                    }
                  }}
                  className={`pcb-part-item ${isUsed ? 'used' : ''} ${isSelected ? 'selected' : ''}`}
                >
                  <div className="pcb-part-emoji">{part.emoji}</div>
                  <div className="pcb-part-name">{part.name}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stage Summary Knowledge Modal */}
        {showSummaryModal && (
          <div className="pcb-modal-overlay">
            <div className="pcb-modal-card">
              <div className="pcb-modal-badge">
                <Sparkles size={16} /> ประกอบเสร็จสมบูรณ์!
              </div>
              <h3 className="pcb-modal-title">
                {currentStageIndex === 0 ? '✨ โต๊ะคอมพิวเตอร์พร้อมใช้งาน!' : '🚀 ระบบเครื่องบูตติดสมบูรณ์!'}
              </h3>
              <p className="pcb-modal-desc">
                คุณได้ประกอบฮาร์ดแวร์ครบทุกชิ้นส่วน สรุปชื่อและหน้าที่การทำงานของอุปกรณ์:
              </p>

              {/* Hardware duties list */}
              <div className="pcb-learn-list">
                {currentStage.parts.map((part) => (
                  <div key={part.id} className="pcb-learn-item">
                    <span className="pcb-learn-icon">{part.emoji}</span>
                    <div className="pcb-learn-info">
                      <div className="pcb-learn-name">
                        {part.name} ({part.nameEn}) • <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{part.category}</span>
                      </div>
                      <div className="pcb-learn-duty">{part.description}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                {currentStageIndex + 1 < STAGES.length ? (
                  <button
                    type="button"
                    className="pcb-btn-primary"
                    onClick={handleNextStage}
                  >
                    <span>ไปด่านที่ 2 (ชิ้นส่วนภายในเคส)</span>
                    <ArrowRight size={18} />
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      className="pcb-btn-primary"
                      onClick={handleResetGame}
                    >
                      <RotateCcw size={18} />
                      <span>เล่นใหม่อีกครั้ง</span>
                    </button>
                    <Link to="/games" className="pcb-btn-secondary">
                      <Trophy size={18} />
                      <span>เลือกเกมอื่น</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PCBuilderGame;
