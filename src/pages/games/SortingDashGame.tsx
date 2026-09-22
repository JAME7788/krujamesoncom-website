import React, { useState, useEffect, useEffectEvent, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  RotateCcw,
  Zap,
  Heart,
  Trophy,
  ArrowLeft,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { useGameProgress } from '../../hooks/useGameProgress';
import { useGameTimers } from '../../hooks/useGameTimers';
import { sfxCorrect, sfxWrong, sfxCoin } from '../../utils/gameSounds';
import GameLearnCard from '../../components/GameLearnCard';
import './GameStyles.css';
import './SortingDashGame.css';

interface SortItem {
  id: string;
  name: string;
  emoji: string;
  target: 'left' | 'right';
  explanation: string;
}

interface ThemeConfig {
  id: string;
  title: string;
  leftName: string;
  leftEmoji: string;
  rightName: string;
  rightEmoji: string;
  items: SortItem[];
}

const THEMES: ThemeConfig[] = [
  {
    id: 'privacy',
    title: 'ข้อมูลส่วนตัว vs ข้อมูลสาธารณะ',
    leftName: 'ข้อมูลส่วนบุคคล (ลับ)',
    leftEmoji: '🔒',
    rightName: 'ข้อมูลสาธารณะ (เปิดเผยได้)',
    rightEmoji: '🌐',
    items: [
      { id: 'p1', name: 'รหัสผ่านบัญชีอีเมล', emoji: '🔑', target: 'left', explanation: 'รหัสผ่านเป็นความลับสูงสุด ห้ามเปิดเผย' },
      { id: 'p2', name: 'เลขประจำตัวประชาชน 13 หลัก', emoji: '🪪', target: 'left', explanation: 'เลขบัตรประชาชนใช้ระบุตัวตนและธุรกรรมสำคัญ' },
      { id: 'p3', name: 'รูปภาพวิวธรรมชาติในสวนสาธารณะ', emoji: '🌄', target: 'right', explanation: 'ภาพวิวทิวทัศน์ทั่วไปสามารถแชร์ได้' },
      { id: 'p4', name: 'รหัสผ่านบัตร ATM / PIN', emoji: '💳', target: 'left', explanation: 'รหัส PIN ธนาคารต้องเก็บเป็นความลับ' },
      { id: 'p5', name: 'ปฏิทินวันหยุดโรงเรียนประจำปี', emoji: '📅', target: 'right', explanation: 'ประกาศวันหยุดเป็นข้อมูลสาธารณะของโรงเรียน' },
      { id: 'p6', name: 'รหัส OTP 6 หลักที่ส่งเข้ามือถือ', emoji: '📱', target: 'left', explanation: 'รหัส OTP มีไว้สำหรับเจ้าของเครื่องเท่านั้น' },
      { id: 'p7', name: 'สูตรทำขนมไทยโบราณ', emoji: '🍲', target: 'right', explanation: 'ความรู้และสูตรอาหารทั่วไปสามารถแบ่งปันได้' },
      { id: 'p8', name: 'ประวัติการรักษาพยาบาลส่วนตัว', emoji: '🏥', target: 'left', explanation: 'ข้อมูลสุขภาพเป็นข้อมูลส่วนบุคคลอ่อนไหว' },
      { id: 'p9', name: 'เบอร์โทรฉุกเฉินเหตุด่วนเหตุร้าย 191', emoji: '☎️', target: 'right', explanation: 'เบอร์โทรช่วยเหลือฉุกเฉินเป็นข้อมูลสาธารณะ' },
      { id: 'p10', name: 'แชทคุยความลับกับครอบครัว', emoji: '💬', target: 'left', explanation: 'การสื่อสารส่วนตัวไม่ควรเผยแพร่ต่อสาธารณะ' },
      { id: 'p11', name: 'ตราสัญลักษณ์โรงเรียนบ้านคลองมดแดง', emoji: '🏫', target: 'right', explanation: 'สัญลักษณ์หน่วยงานเป็นข้อมูลทางการ' },
      { id: 'p12', name: 'หมายเลขบัญชีและยอดเงินในธนาคาร', emoji: '💰', target: 'left', explanation: 'ข้อมูลยอดเงินในบัญชีเป็นความลับทางการเงิน' },
    ],
  },
  {
    id: 'hardware-software',
    title: 'ฮาร์ดแวร์ vs ซอฟต์แวร์',
    leftName: 'ฮาร์ดแวร์ (อุปกรณ์ที่จับต้องได้)',
    leftEmoji: '🖥️',
    rightName: 'ซอฟต์แวร์ (โปรแกรม/ชุดคำสั่ง)',
    rightEmoji: '💾',
    items: [
      { id: 'hs1', name: 'เมาส์คอมพิวเตอร์', emoji: '🖱️', target: 'left', explanation: 'เมาส์เป็นอุปกรณ์ฮาร์ดแวร์รับเข้า (Input)' },
      { id: 'hs2', name: 'ระบบปฏิบัติการ Windows 11', emoji: '🪟', target: 'right', explanation: 'OS เป็นซอฟต์แวร์ระบบควบคุมเครื่อง' },
      { id: 'hs3', name: 'คีย์บอร์ดแป้นพิมพ์', emoji: '⌨️', target: 'left', explanation: 'คีย์บอร์ดเป็นอุปกรณ์ฮาร์ดแวร์ป้อนข้อมูล' },
      { id: 'hs4', name: 'โปรแกรมพิมพ์งาน Microsoft Word', emoji: '📄', target: 'right', explanation: 'Word เป็นซอฟต์แวร์ประยุกต์จัดการเอกสาร' },
      { id: 'hs5', name: 'แผงวงจรหลัก (Mainboard)', emoji: '🎛️', target: 'left', explanation: 'เมนบอร์ดเป็นฮาร์ดแวร์วงจรหลัก' },
      { id: 'hs6', name: 'โปรแกรม Scratch บล็อกต่อโค้ด', emoji: '🐱', target: 'right', explanation: 'Scratch เป็นซอฟต์แวร์เขียนโปรแกรม' },
      { id: 'hs7', name: 'จอภาพคอมพิวเตอร์ (Monitor)', emoji: '🖥️', target: 'left', explanation: 'จอภาพเป็นอุปกรณ์ฮาร์ดแวร์แสดงผล (Output)' },
      { id: 'hs8', name: 'เว็บบราวเซอร์ Google Chrome', emoji: '🌐', target: 'right', explanation: 'Chrome เป็นซอฟต์แวร์ท่องอินเทอร์เน็ต' },
      { id: 'hs9', name: 'ชิปหน่วยประมวลผล CPU', emoji: '🧠', target: 'left', explanation: 'CPU เป็นฮาร์ดแวร์สมองกลคำนวณ' },
      { id: 'hs10', name: 'แอปพลิเคชัน Line แชท', emoji: '💬', target: 'right', explanation: 'Line เป็นซอฟต์แวร์แอปพลิเคชันสื่อสาร' },
    ],
  },
  {
    id: 'ewaste',
    title: 'ขยะอิเล็กทรอนิกส์ vs ขยะทั่วไป/รีไซเคิล',
    leftName: 'ขยะอิเล็กทรอนิกส์ (E-Waste)',
    leftEmoji: '🔋',
    rightName: 'ขยะทั่วไป / รีไซเคิล',
    rightEmoji: '♻️',
    items: [
      { id: 'ew1', name: 'ถ่านไฟฉายและแบตเตอรี่เสื่อม', emoji: '🔋', target: 'left', explanation: 'แบตเตอรี่มีสารพิษและโลหะหนัก ต้องทิ้งแยกเป็น E-waste' },
      { id: 'ew2', name: 'ขวดพลาสติกน้ำดื่ม', emoji: '🧴', target: 'right', explanation: 'ขวดพลาสติกสามารถรีไซเคิลเป็นเม็ดพลาสติกใหม่ได้' },
      { id: 'ew3', name: 'สายชาร์จโทรศัพท์ขาดชำรุด', emoji: '🔌', target: 'left', explanation: 'สายชาร์จและอะแดปเตอร์เป็นขยะอิเล็กทรอนิกส์' },
      { id: 'ew4', name: 'เศษกระดาษลังและกล่องพัสดุ', emoji: '📦', target: 'right', explanation: 'กระดาษสามารถนำไปแปรรูปรอบใหม่ได้' },
      { id: 'ew5', name: 'สมาร์ทโฟนเก่าหน้าจอแตก', emoji: '📱', target: 'left', explanation: 'สมาร์ทโฟนเก่าต้องส่งโรงงานรีไซเคิลขยะอิเล็กทรอนิกส์' },
      { id: 'ew6', name: 'กระป๋องน้ำอัดลมอลูมิเนียม', emoji: '🥫', target: 'right', explanation: 'กระป๋องอลูมิเนียมหลอมรีไซเคิลได้ไม่จำกัดรอบ' },
    ],
  },
  {
    id: 'fruit-veg',
    title: 'ผลไม้ vs ผัก (ประถมต้น)',
    leftName: 'ผลไม้ (Fruit)',
    leftEmoji: '🍎',
    rightName: 'ผัก (Vegetable)',
    rightEmoji: '🥦',
    items: [
      { id: 'fv1', name: 'แอปเปิ้ลสีแดง', emoji: '🍎', target: 'left', explanation: 'แอปเปิ้ลเป็นผลไม้รสหวาน' },
      { id: 'fv2', name: 'ผักคะน้าใบเขียว', emoji: '🥬', target: 'right', explanation: 'คะน้าเป็นผักใบเขียว' },
      { id: 'fv3', name: 'กล้วยหอมสุก', emoji: '🍌', target: 'left', explanation: 'กล้วยเป็นผลไม้ให้พลังงาน' },
      { id: 'fv4', name: 'ผักบรอกโคลี', emoji: '🥦', target: 'right', explanation: 'บรอกโคลีเป็นผักดอก' },
      { id: 'fv5', name: 'แตงโมหวานฉ่ำ', emoji: '🍉', target: 'left', explanation: 'แตงโมเป็นผลไม้สดชื่น' },
      { id: 'fv6', name: 'แครอทสีส้ม', emoji: '🥕', target: 'right', explanation: 'แครอทเป็นผักหัว' },
    ],
  },
];

const SortingDashGame: React.FC = () => {
  const recordProgress = useGameProgress('sorting-dash', 'คัดแยกด่วน (Sorting Dash)');

  const [themeIndex, setThemeIndex] = useState(0);
  const currentTheme = THEMES[themeIndex];

  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [currentItem, setCurrentItem] = useState<SortItem>(currentTheme.items[0]);
  const [timeRemaining, setTimeRemaining] = useState(2.5); // seconds
  const [cardOffset, setCardOffset] = useState(0); // for visual swipe
  const [highlightBin, setHighlightBin] = useState<'left' | 'right' | null>(null);

  const timers = useGameTimers();
  const livesRef = useRef(3);
  const endedRef = useRef(false);
  const deadlineRef = useRef(0);
  const answerLockedRef = useRef(false);

  // Pick random next item (not the same as current)
  const pickNextItem = useCallback((theme: ThemeConfig, prevId?: string): SortItem => {
    const pool = theme.items.filter((item) => item.id !== prevId);
    return pool[Math.floor(Math.random() * pool.length)] || theme.items[0];
  }, []);

  const resetGame = useCallback((idx = themeIndex) => {
    timers.clear();
    livesRef.current = 3;
    endedRef.current = false;
    answerLockedRef.current = false;
    deadlineRef.current = performance.now() + 2500;
    const selected = THEMES[idx] || THEMES[0];
    setThemeIndex(idx);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setLives(3);
    setGameOver(false);
    setCardOffset(0);
    setHighlightBin(null);
    const firstItem = pickNextItem(selected);
    setCurrentItem(firstItem);
    setTimeRemaining(2.5);
  }, [themeIndex, pickNextItem, timers]);

  const missItem = useCallback(() => {
    if (endedRef.current) return true;
    sfxWrong();
    setCombo(0);
    livesRef.current = Math.max(0, livesRef.current - 1);
    setLives(livesRef.current);
    if (livesRef.current === 0) {
      endedRef.current = true;
      timers.clear();
      setTimeRemaining(0);
      setGameOver(true);
      void recordProgress(score, `theme-${currentTheme.id}`);
      return true;
    }
    return false;
  }, [score, currentTheme.id, recordProgress, timers]);

  // Handle Sort Action (Left or Right)
  const handleSort = useCallback((choice: 'left' | 'right') => {
    if (endedRef.current || answerLockedRef.current) return;
    answerLockedRef.current = true;
    timers.clear();

    setHighlightBin(choice);
    timers.schedule(() => {
      setHighlightBin(null);
      answerLockedRef.current = false;
    }, 180);

    const isCorrect = choice === currentItem.target;

    if (isCorrect) {
      sfxCorrect();
      setCombo(combo + 1);
      setMaxCombo((prev) => Math.max(prev, combo + 1));
      const bonusMultiplier = Math.min(3, 1 + Math.floor(combo / 3) * 0.5);
      const earned = Math.round(100 * bonusMultiplier);
      setScore((prev) => prev + earned);
      sfxCoin();
    } else if (missItem()) return;

    // Next item & reset time
    // Timer speed gets tighter as score increases (down to 1.2s)
    const nextLimit = Math.max(1.2, 2.5 - Math.floor(score / 500) * 0.2);
    deadlineRef.current = performance.now() + nextLimit * 1000;
    setTimeRemaining(nextLimit);
    setCurrentItem((prev) => pickNextItem(currentTheme, prev.id));
    setCardOffset(choice === 'left' ? -80 : 80);
    timers.schedule(() => setCardOffset(0), 120);
  }, [currentItem, combo, score, currentTheme, pickNextItem, missItem, timers]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || (e.target instanceof HTMLElement && e.target.closest('input, select, textarea, [contenteditable="true"]'))) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        handleSort('left');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        handleSort('right');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSort]);

  const tick = useEffectEvent(() => {
    if (endedRef.current) return;
    // Reading a lesson must not spend the player's decision time.
    if (document.querySelector('dialog[open]')) {
      deadlineRef.current = performance.now() + timeRemaining * 1000;
      return;
    }
    const remaining = Math.max(0, (deadlineRef.current - performance.now()) / 1000);
    if (remaining > 0) {
      setTimeRemaining(remaining);
      return;
    }
    if (missItem()) return;
    const nextLimit = Math.max(1.2, 2.5 - Math.floor(score / 500) * 0.2);
    deadlineRef.current = performance.now() + nextLimit * 1000;
    setTimeRemaining(nextLimit);
    setCurrentItem((curr) => pickNextItem(currentTheme, curr.id));
  });

  useEffect(() => {
    if (gameOver) return;
    deadlineRef.current = performance.now() + 2500;
    const timer = setInterval(tick, 50);
    return () => clearInterval(timer);
  }, [gameOver]);

  return (
    <div className="sorting-dash-wrap">
      <GameLearnCard gameKey="sorting-dash" />
      <div className="sorting-dash-container">
        {/* Top Bar */}
        <header className="dash-top-bar">
          <Link to="/games" className="cyber-back-btn">
            <ChevronLeft size={18} /> ออกจากเกม
          </Link>

          <select
            className="dash-theme-select"
            value={themeIndex}
            onChange={(e) => resetGame(Number(e.target.value))}
          >
            {THEMES.map((th, idx) => (
              <option key={th.id} value={idx}>
                {th.title}
              </option>
            ))}
          </select>

          <div className="dash-stats">
            {/* Lives */}
            <div className="dash-stat-pill" style={{ color: '#ef4444' }}>
              <Heart size={18} fill="#ef4444" />
              <span>{lives}</span>
            </div>

            {/* Combo */}
            {combo > 1 && (
              <div className="dash-stat-pill" style={{ color: '#f59e0b' }}>
                <Flame size={18} fill="#f59e0b" />
                <span>x{combo}</span>
              </div>
            )}

            {/* Score */}
            <div className="dash-stat-pill" style={{ color: '#eab308' }}>
              <Zap size={18} />
              <span>{score}</span>
            </div>
          </div>
        </header>

        {/* Main Arena */}
        <div className="dash-arena">
          {/* Left Bin */}
          <div
            className={`dash-bin left ${highlightBin === 'left' ? 'highlight' : ''}`}
            onClick={() => handleSort('left')}
          >
            <span className="dash-bin-emoji">{currentTheme.leftEmoji}</span>
            <span className="dash-bin-title">{currentTheme.leftName}</span>
            <button type="button" className="dash-bin-btn">
              <ArrowLeft size={12} style={{ display: 'inline', marginRight: 4 }} /> กดซ้าย [←]
            </button>
          </div>

          {/* Center Falling Card */}
          <div
            className="dash-card-wrap"
            style={{
              '--dash-card-offset': `${cardOffset}px`,
            } as React.CSSProperties}
          >
            <span className="dash-card-emoji">{currentItem.emoji}</span>
            <span className="dash-card-text">{currentItem.name}</span>

            {/* Decision Timer Bar */}
            <div
              className="dash-timer-bar"
              style={{
                width: `${(timeRemaining / 2.5) * 100}%`,
                background: timeRemaining > 1.0 ? '#eab308' : '#ef4444',
              }}
            />
          </div>

          {/* Right Bin */}
          <div
            className={`dash-bin right ${highlightBin === 'right' ? 'highlight' : ''}`}
            onClick={() => handleSort('right')}
          >
            <span className="dash-bin-emoji">{currentTheme.rightEmoji}</span>
            <span className="dash-bin-title">{currentTheme.rightName}</span>
            <button type="button" className="dash-bin-btn">
              กดขวา [→] <ArrowRight size={12} style={{ display: 'inline', marginLeft: 4 }} />
            </button>
          </div>
        </div>

        {/* Controls Guide */}
        <div className="dash-controls-guide">
          <span>
            💡 ใช้ปุ่มคีย์บอร์ด <span className="key-badge">← ซ้าย</span> และ{' '}
            <span className="key-badge">ขวา →</span> หรือแตะที่กล่องแต่ละฝั่ง
          </span>
        </div>

        {/* Game Over Modal */}
        {gameOver && (
          <div className="cyber-modal-backdrop">
            <div className="cyber-modal-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏆</div>
              <h2>จบเกมคัดแยกด่วน!</h2>
              <p style={{ color: '#cbd5e1' }}>หมวดหมู่: {currentTheme.title}</p>

              <div className="cyber-victory-stats" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                <div className="cyber-stat-box">
                  <small>คะแนนที่ทำได้</small>
                  <strong style={{ color: '#eab308' }}>{score}</strong>
                </div>
                <div className="cyber-stat-box">
                  <small>คอมโบสูงสุด</small>
                  <strong style={{ color: '#38bdf8' }}>{maxCombo} ครั้ง</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="cyber-modal-btn"
                  onClick={() => resetGame()}
                >
                  <RotateCcw size={16} style={{ display: 'inline', marginRight: 4 }} /> เล่นใหม่อีกครั้ง
                </button>
                <Link to="/games" className="cyber-modal-btn" style={{ textDecoration: 'none', background: 'rgba(255,255,255,0.1)' }}>
                  <Trophy size={16} style={{ display: 'inline', marginRight: 4 }} /> กลับหน้าเกม
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SortingDashGame;
