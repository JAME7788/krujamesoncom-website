import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  RotateCcw,
  Play,
  Trophy,
  Heart,
  Volume2,
  VolumeX,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Sparkles,
  Award,
  Zap,
  CheckCircle,
  HelpCircle,
  XCircle,
} from 'lucide-react';
import { useGameProgress } from '../../hooks/useGameProgress';
import { sfxCorrect, sfxWrong, sfxCoin } from '../../utils/gameSounds';
import GameLearnCard from '../../components/GameLearnCard';
import './GameStyles.css';
import './ClawPlatformerGame.css';

// Character profile configuration using sprites from claw-empire-main
export interface HeroCharacter {
  id: string;
  name: string;
  role: string;
  spriteUrl: string;
  perk: string;
  color: string;
}

export const HEROES: HeroCharacter[] = [
  {
    id: 'ceo-lobster',
    name: 'CEO Lobster',
    role: 'ผู้บริหารสูงสุดแห่ง Claw-Empire',
    spriteUrl: '/sprites/claw-empire/ceo-lobster.png',
    perk: 'ก้ามหนีบโจมตีทรงพลัง + พลังชีวิตสูงสุด',
    color: '#ea580c',
  },
  {
    id: 'agent-codey',
    name: 'Agent Codey',
    role: 'AI Programmer',
    spriteUrl: '/sprites/claw-empire/1-D-1.png',
    perk: 'ความเร็วในการวิ่งสูงเป็นพิเศษ',
    color: '#06b6d4',
  },
  {
    id: 'agent-codex',
    name: 'Agent Codex',
    role: 'Algorithm Specialist',
    spriteUrl: '/sprites/claw-empire/2-D-1.png',
    perk: 'กระโดดสองชั้นได้สูงเป็นพิเศษ',
    color: '#8b5cf6',
  },
  {
    id: 'agent-nova',
    name: 'Agent Nova',
    role: 'Cyber Security Officer',
    spriteUrl: '/sprites/claw-empire/3-D-1.png',
    perk: 'เริ่มเกมพร้อมเกราะป้องกันดาเมจ',
    color: '#10b981',
  },
];

// Quiz question data for Mystery Terminal blocks
interface PlatformerQuiz {
  question: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
}

const TERMINAL_QUIZZES: PlatformerQuiz[] = [
  {
    question: 'หากระบบเซิร์ฟเวอร์โดนไวรัสและบั๊กแทรกซึม ควรใช้วิธีใดแก้ไขอย่างเป็นระบบ?',
    choices: ['วิเคราะห์หาจุดเกิดเหตุ แล้วแก้ไขโค้ดที่ผิดพลาด', 'ทุบคอมพิวเตอร์ทิ้ง', 'เปิดเครื่องทิ้งไว้เฉย ๆ'],
    correctIndex: 0,
    explanation: 'การตรวจสอบและ Debugging ทีละขั้นตอนช่วยระบุสาเหตุและแก้ปัญหาได้อย่างตรงจุด',
  },
  {
    question: 'อุปกรณ์ใดทำหน้าที่เป็น "หน่วยประมวลผลกลาง" คอยคำนวณและประมวลผลข้อมูลในเซิร์ฟเวอร์?',
    choices: ['CPU (Central Processing Unit)', 'Mouse', 'Monitor'],
    correctIndex: 0,
    explanation: 'CPU คือสมองกลที่ทำหน้าที่ประมวลผลคำสั่งทั้งหมดของระบบคอมพิวเตอร์',
  },
  {
    question: 'คำสั่งวนซ้ำ (Loop) ในการเขียนโปรแกรมมีประโยชน์หลักอย่างไร?',
    choices: ['ทำให้โปรแกรมรันคำสั่งซ้ำ ๆ ได้โดยไม่ต้องเขียนโค้ดเดิมซ้ำซ้อน', 'ทำให้หน้าจอดับ', 'เพิ่มไวรัสลงในเครื่อง'],
    correctIndex: 0,
    explanation: 'Loop ช่วยให้ระบบประมวลผลงานซ้ำ ๆ อย่างมีประสิทธิภาพและโค้ดกระชับ',
  },
  {
    question: 'รหัสลับ OTP ที่ส่งมายังโทรศัพท์มือถือ มีไว้เพื่อวัตถุประสงค์ใด?',
    choices: ['ยืนยันตัวตนความปลอดภัย 2 ชั้น (Two-Factor Authentication)', 'ส่งโฆษณาซื้อของ', 'ล้างข้อมูลโทรศัพท์'],
    correctIndex: 0,
    explanation: 'OTP คือรหัสผ่านใช้ครั้งเดียวเพื่อยืนยันว่าผู้ใช้งานเป็นเจ้าของบัญชีจริง',
  },
  {
    question: 'สัญลักษณ์รูปสี่เหลี่ยมขนมเปียกปูนในผังงาน (Flowchart) ใช้แสดงขั้นตอนใด?',
    choices: ['การตัดสินใจ หรือตรวจสอบเงื่อนไข (Decision)', 'การเริ่มต้นการทำงาน', 'การป้อนข้อมูลทางแป้นพิมพ์'],
    correctIndex: 0,
    explanation: 'Decision ใช้ตรวจสอบเงื่อนไข เช่น ถ้าคะแนน >= 50 ให้ผ่าน',
  },
  {
    question: 'ข้อมูลประเภทใดจัดเป็น "ข้อมูลส่วนบุคคลอ่อนไหว" ที่ต้องเก็บเป็นความลับสูงสุด?',
    choices: ['รหัสผ่าน และประวัติการรักษาพยาบาล', 'สีดอกไม้ที่ชอบ', 'ชื่อสัตว์เลี้ยง'],
    correctIndex: 0,
    explanation: 'รหัสผ่านและข้อมูลสุขภาพเป็นข้อมูลส่วนบุคคลที่อาจก่อให้เกิดความเสียหายร้ายแรงหากรั่วไหล',
  },
];

// 2D Physics Entities
interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'solid' | 'cloud' | 'terminal' | 'spring';
  used?: boolean;
}

interface CoinItem {
  id: number;
  x: number;
  y: number;
  type: 'coin' | 'disk' | 'coffee';
  collected: boolean;
}

interface EnemyBug {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  minX: number;
  maxX: number;
  alive: boolean;
  type: 'bug' | 'glitch';
}

interface AttackEffect {
  x: number;
  y: number;
  w: number;
  h: number;
  life: number;
}

const LEVEL_CONFIGS = [
  {
    name: 'ชั้น 1: แผนกพัฒนาซอฟต์แวร์ (Dev & Office Floor)',
    bgGradient: ['#0f172a', '#1e293b', '#334155'],
    worldWidth: 2600,
    platforms: [
      { x: 0, y: 440, w: 2600, h: 60, type: 'solid' as const }, // Main ground floor
      // Elevated desks & servers
      { x: 220, y: 350, w: 140, h: 22, type: 'solid' as const },
      { x: 420, y: 280, w: 160, h: 22, type: 'solid' as const },
      { x: 500, y: 180, w: 40, h: 40, type: 'terminal' as const }, // Quiz terminal
      { x: 660, y: 330, w: 130, h: 22, type: 'cloud' as const },
      { x: 860, y: 260, w: 150, h: 22, type: 'solid' as const },
      { x: 1080, y: 320, w: 140, h: 22, type: 'solid' as const },
      { x: 1140, y: 210, w: 40, h: 40, type: 'terminal' as const }, // Quiz terminal
      { x: 1300, y: 240, w: 120, h: 22, type: 'cloud' as const },
      { x: 1500, y: 340, w: 160, h: 22, type: 'solid' as const },
      { x: 1720, y: 270, w: 140, h: 22, type: 'solid' as const },
      { x: 1940, y: 200, w: 130, h: 22, type: 'cloud' as const },
      { x: 2000, y: 120, w: 40, h: 40, type: 'terminal' as const }, // Quiz terminal
      { x: 2150, y: 320, w: 150, h: 22, type: 'solid' as const },
      { x: 2360, y: 380, w: 50, h: 20, type: 'spring' as const }, // Bounce pad
      { x: 2460, y: 330, w: 140, h: 30, type: 'solid' as const }, // Exit platform
    ],
    coins: [
      { id: 1, x: 250, y: 310, type: 'coin' as const, collected: false },
      { id: 2, x: 290, y: 310, type: 'coin' as const, collected: false },
      { id: 3, x: 450, y: 240, type: 'disk' as const, collected: false },
      { id: 4, x: 700, y: 290, type: 'coin' as const, collected: false },
      { id: 5, x: 900, y: 220, type: 'coffee' as const, collected: false },
      { id: 6, x: 1120, y: 280, type: 'disk' as const, collected: false },
      { id: 7, x: 1340, y: 200, type: 'coin' as const, collected: false },
      { id: 8, x: 1540, y: 300, type: 'coin' as const, collected: false },
      { id: 9, x: 1760, y: 230, type: 'disk' as const, collected: false },
      { id: 10, x: 1980, y: 160, type: 'coffee' as const, collected: false },
      { id: 11, x: 2200, y: 280, type: 'coin' as const, collected: false },
    ],
    enemies: [
      { id: 1, x: 500, y: 408, w: 34, h: 32, vx: 1.2, minX: 400, maxX: 700, alive: true, type: 'bug' as const },
      { id: 2, x: 920, y: 228, w: 34, h: 32, vx: 1.0, minX: 870, maxX: 1000, alive: true, type: 'bug' as const },
      { id: 3, x: 1200, y: 408, w: 34, h: 32, vx: 1.4, minX: 1050, maxX: 1450, alive: true, type: 'bug' as const },
      { id: 4, x: 1540, y: 308, w: 34, h: 32, vx: 1.1, minX: 1510, maxX: 1650, alive: true, type: 'bug' as const },
      { id: 5, x: 1800, y: 408, w: 34, h: 32, vx: 1.5, minX: 1700, maxX: 2100, alive: true, type: 'bug' as const },
    ],
    exitX: 2520,
    exitY: 330,
  },
  {
    name: 'ชั้น 2: ศูนย์ข้อมูลคลาวด์เซิร์ฟเวอร์ (Cloud Data Center)',
    bgGradient: ['#09090b', '#18181b', '#27272a'],
    worldWidth: 2800,
    platforms: [
      { x: 0, y: 440, w: 600, h: 60, type: 'solid' as const },
      { x: 680, y: 440, w: 700, h: 60, type: 'solid' as const }, // Pit between 600-680
      { x: 1460, y: 440, w: 1340, h: 60, type: 'solid' as const }, // Pit between 1380-1460
      { x: 300, y: 340, w: 130, h: 22, type: 'cloud' as const },
      { x: 480, y: 260, w: 140, h: 22, type: 'solid' as const },
      { x: 530, y: 160, w: 40, h: 40, type: 'terminal' as const },
      { x: 740, y: 320, w: 140, h: 22, type: 'solid' as const },
      { x: 950, y: 240, w: 120, h: 22, type: 'cloud' as const },
      { x: 1140, y: 310, w: 150, h: 22, type: 'solid' as const },
      { x: 1200, y: 200, w: 40, h: 40, type: 'terminal' as const },
      { x: 1360, y: 250, w: 80, h: 20, type: 'cloud' as const },
      { x: 1550, y: 330, w: 150, h: 22, type: 'solid' as const },
      { x: 1780, y: 250, w: 130, h: 22, type: 'cloud' as const },
      { x: 1980, y: 190, w: 140, h: 22, type: 'solid' as const },
      { x: 2040, y: 90, w: 40, h: 40, type: 'terminal' as const },
      { x: 2250, y: 300, w: 140, h: 22, type: 'solid' as const },
      { x: 2460, y: 380, w: 50, h: 20, type: 'spring' as const },
      { x: 2600, y: 330, w: 160, h: 30, type: 'solid' as const },
    ],
    coins: [
      { id: 1, x: 330, y: 300, type: 'coin' as const, collected: false },
      { id: 2, x: 520, y: 220, type: 'disk' as const, collected: false },
      { id: 3, x: 780, y: 280, type: 'coin' as const, collected: false },
      { id: 4, x: 990, y: 200, type: 'coffee' as const, collected: false },
      { id: 5, x: 1180, y: 270, type: 'disk' as const, collected: false },
      { id: 6, x: 1580, y: 290, type: 'coin' as const, collected: false },
      { id: 7, x: 1820, y: 210, type: 'disk' as const, collected: false },
      { id: 8, x: 2020, y: 150, type: 'coffee' as const, collected: false },
      { id: 9, x: 2290, y: 260, type: 'coin' as const, collected: false },
    ],
    enemies: [
      { id: 1, x: 400, y: 408, w: 34, h: 32, vx: 1.3, minX: 200, maxX: 550, alive: true, type: 'bug' as const },
      { id: 2, x: 780, y: 288, w: 34, h: 32, vx: 1.1, minX: 750, maxX: 870, alive: true, type: 'glitch' as const },
      { id: 3, x: 1000, y: 408, w: 34, h: 32, vx: 1.4, minX: 800, maxX: 1250, alive: true, type: 'bug' as const },
      { id: 4, x: 1600, y: 408, w: 34, h: 32, vx: 1.6, minX: 1480, maxX: 1850, alive: true, type: 'bug' as const },
      { id: 5, x: 1820, y: 218, w: 34, h: 32, vx: 1.2, minX: 1790, maxX: 1900, alive: true, type: 'glitch' as const },
      { id: 6, x: 2100, y: 408, w: 34, h: 32, vx: 1.5, minX: 1900, maxX: 2350, alive: true, type: 'bug' as const },
    ],
    exitX: 2680,
    exitY: 330,
  },
];

const ClawPlatformerGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game lifecycle states
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover' | 'victory'>('idle');
  const [selectedHero, setSelectedHero] = useState<HeroCharacter>(HEROES[0]);
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [chipsCollected, setChipsCollected] = useState(0);
  const [activeQuiz, setActiveQuiz] = useState<PlatformerQuiz | null>(null);
  const [quizAnswered, setQuizAnswered] = useState<number | null>(null);
  const [starPowerDuration, setStarPowerDuration] = useState(0);
  const [isSoundMuted, setIsSoundMuted] = useState(false);

  // High score tracking
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('kj_claw_platformer_best') || '0', 10);
    } catch {
      return 0;
    }
  });

  // Educational progress recording
  const recordGame = useGameProgress('claw-platformer', '🦞 Claw Empire: ตะลุยด่านกู้เซิร์ฟเวอร์');

  // Loaded character image ref
  const heroImageRef = useRef<HTMLImageElement | null>(null);

  // Physical Player State
  const playerRef = useRef({
    x: 80,
    y: 350,
    w: 42,
    h: 46,
    vx: 0,
    vy: 0,
    isGrounded: false,
    facingRight: true,
    coyoteTime: 0,
    jumpBuffer: 0,
    canDoubleJump: true,
    invincibleTimer: 0,
  });

  // Input states
  const keysRef = useRef<{ left: boolean; right: boolean; jump: boolean; attack: boolean }>({
    left: false,
    right: false,
    jump: false,
    attack: false,
  });

  // World objects refs for mutable simulation
  const platformsRef = useRef<Platform[]>([]);
  const coinsRef = useRef<CoinItem[]>([]);
  const enemiesRef = useRef<EnemyBug[]>([]);
  const attacksRef = useRef<AttackEffect[]>([]);
  const cameraXRef = useRef(0);

  // Preload hero images
  useEffect(() => {
    const img = new Image();
    img.src = selectedHero.spriteUrl;
    img.onload = () => {
      heroImageRef.current = img;
    };
  }, [selectedHero]);

  // Sound synthesizer
  const playBeep = useCallback((freq: number, duration: number, type: OscillatorType = 'sine', gain = 0.1) => {
    if (isSoundMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gainNode.gain.setValueAtTime(gain, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Ignored
    }
  }, [isSoundMuted]);

  // Load level data into mutable refs
  const loadLevel = useCallback((lvlIndex: number) => {
    const lvl = LEVEL_CONFIGS[lvlIndex] || LEVEL_CONFIGS[0];
    setCurrentLevelIdx(lvlIndex);
    platformsRef.current = lvl.platforms.map((p) => ({ ...p }));
    coinsRef.current = lvl.coins.map((c) => ({ ...c, collected: false }));
    enemiesRef.current = lvl.enemies.map((e) => ({ ...e, alive: true }));
    attacksRef.current = [];

    // Reset player position
    playerRef.current = {
      x: 80,
      y: 350,
      w: 42,
      h: 46,
      vx: 0,
      vy: 0,
      isGrounded: false,
      facingRight: true,
      coyoteTime: 0,
      jumpBuffer: 0,
      canDoubleJump: true,
      invincibleTimer: 0,
    };
    cameraXRef.current = 0;
  }, []);

  // Start game session
  const startGame = useCallback((hero = selectedHero) => {
    setSelectedHero(hero);
    setScore(0);
    setLives(3);
    setChipsCollected(0);
    setStarPowerDuration(0);
    setActiveQuiz(null);
    setQuizAnswered(null);
    loadLevel(0);
    setGameState('playing');
  }, [loadLevel, selectedHero]);

  // Keyboard Event Listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing' || activeQuiz) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = true;
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        e.preventDefault();
        keysRef.current.jump = true;
        playerRef.current.jumpBuffer = 8; // Buffer jump
      }
      if (e.key === 'j' || e.key === 'J' || e.key === 'x' || e.key === 'X' || e.key === 'Enter') {
        triggerAttack();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = false;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = false;
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        keysRef.current.jump = false;
        // Variable jump height: release early cuts jump velocity
        if (playerRef.current.vy < -3) {
          playerRef.current.vy *= 0.45;
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [activeQuiz, gameState]);

  // Player Attack Action (Claw Snap)
  const triggerAttack = useCallback(() => {
    if (gameState !== 'playing' || activeQuiz) return;
    const p = playerRef.current;
    const attackX = p.facingRight ? p.x + p.w : p.x - 38;
    attacksRef.current.push({
      x: attackX,
      y: p.y + 8,
      w: 42,
      h: p.h - 16,
      life: 10, // Frames duration
    });
    playBeep(320, 0.08, 'sawtooth', 0.12);
  }, [activeQuiz, gameState, playBeep]);

  // Handle Game Over
  const handleGameOver = useCallback(() => {
    setGameState('gameover');
    setScore((currScore) => {
      if (currScore > highScore) {
        setHighScore(currScore);
        try {
          localStorage.setItem('kj_claw_platformer_best', currScore.toString());
        } catch {
          // Ignored
        }
      }
      void recordGame(currScore);
      return currScore;
    });
  }, [highScore, recordGame]);

  // Handle Level Clear / Victory
  const handleLevelClear = useCallback(() => {
    if (currentLevelIdx + 1 < LEVEL_CONFIGS.length) {
      // Advance to next level
      playBeep(620, 0.25, 'triangle', 0.15);
      setScore((s) => s + 500); // Stage clear bonus
      loadLevel(currentLevelIdx + 1);
    } else {
      // Final Victory!
      setGameState('victory');
      setScore((currScore) => {
        const finalScore = currScore + 1000;
        if (finalScore > highScore) {
          setHighScore(finalScore);
          try {
            localStorage.setItem('kj_claw_platformer_best', finalScore.toString());
          } catch {
            // Ignored
          }
        }
        void recordGame(finalScore);
        return finalScore;
      });
    }
  }, [currentLevelIdx, highScore, loadLevel, playBeep, recordGame]);

  // ----------------------------------------------------
  // Main Platformer Physics & Animation Loop
  // ----------------------------------------------------
  useEffect(() => {
    if (gameState !== 'playing' || activeQuiz) return;

    let animId: number;

    const gameLoop = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(gameLoop);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animId = requestAnimationFrame(gameLoop);
        return;
      }

      const p = playerRef.current;
      const keys = keysRef.current;
      const lvl = LEVEL_CONFIGS[currentLevelIdx];

      // Update Star Power Duration
      if (starPowerDuration > 0) {
        setStarPowerDuration((d) => Math.max(0, d - 1));
      }

      // Invincibility cooldown
      if (p.invincibleTimer > 0) p.invincibleTimer--;

      // 1. Horizontal Movement Physics
      const accel = p.isGrounded ? 0.8 : 0.45;
      const friction = p.isGrounded ? 0.78 : 0.92;
      const maxSpeed = selectedHero.id === 'agent-codey' ? 5.2 : 4.4;

      if (keys.left) {
        p.vx -= accel;
        p.facingRight = false;
      } else if (keys.right) {
        p.vx += accel;
        p.facingRight = true;
      } else {
        p.vx *= friction;
      }
      p.vx = Math.max(-maxSpeed, Math.min(maxSpeed, p.vx));
      if (Math.abs(p.vx) < 0.05) p.vx = 0;

      // 2. Vertical Movement & Gravity
      const gravity = 0.52;
      p.vy = Math.min(11, p.vy + gravity);

      // Coyote Time counter
      if (p.isGrounded) {
        p.coyoteTime = 8;
        p.canDoubleJump = true;
      } else if (p.coyoteTime > 0) {
        p.coyoteTime--;
      }

      // Jump Execution
      const jumpPower = selectedHero.id === 'agent-codex' ? -11.2 : -10.2;
      if (p.jumpBuffer > 0) {
        if (p.coyoteTime > 0) {
          // Normal Jump from platform
          p.vy = jumpPower;
          p.coyoteTime = 0;
          p.jumpBuffer = 0;
          p.isGrounded = false;
          playBeep(480, 0.12, 'square', 0.1);
        } else if (p.canDoubleJump) {
          // Double Jump in air!
          p.vy = jumpPower * 0.92;
          p.canDoubleJump = false;
          p.jumpBuffer = 0;
          playBeep(560, 0.12, 'triangle', 0.12);
        }
        p.jumpBuffer = Math.max(0, p.jumpBuffer - 1);
      }

      // 3. Horizontal Collision Detection
      p.x += p.vx;
      for (const plat of platformsRef.current) {
        if (
          p.x < plat.x + plat.w &&
          p.x + p.w > plat.x &&
          p.y < plat.y + plat.h &&
          p.y + p.h > plat.y
        ) {
          if (plat.type === 'solid' || plat.type === 'terminal') {
            if (p.vx > 0) p.x = plat.x - p.w;
            else if (p.vx < 0) p.x = plat.x + plat.w;
            p.vx = 0;
          }
        }
      }

      // 4. Vertical Collision Detection
      p.y += p.vy;
      p.isGrounded = false;

      for (const plat of platformsRef.current) {
        if (
          p.x + p.w > plat.x &&
          p.x < plat.x + plat.w &&
          p.y + p.h >= plat.y &&
          p.y + p.h <= plat.y + plat.h + 12 &&
          p.vy >= 0
        ) {
          // Landed on top of platform
          p.y = plat.y - p.h;
          p.vy = 0;
          p.isGrounded = true;

          // Special platform: Spring Bounce Pad
          if (plat.type === 'spring') {
            p.vy = -14.5; // Super high jump!
            p.isGrounded = false;
            playBeep(680, 0.2, 'sawtooth', 0.14);
          }
        }

        // Head hit ceiling / Quiz Terminal Box from below
        if (
          p.x + p.w > plat.x &&
          p.x < plat.x + plat.w &&
          p.y <= plat.y + plat.h &&
          p.y >= plat.y &&
          p.vy < 0
        ) {
          p.y = plat.y + plat.h;
          p.vy = 0;

          if (plat.type === 'terminal' && !plat.used) {
            plat.used = true;
            // Pop up question!
            const randomQ = TERMINAL_QUIZZES[Math.floor(Math.random() * TERMINAL_QUIZZES.length)];
            setActiveQuiz(randomQ);
            setQuizAnswered(null);
            playBeep(520, 0.15, 'triangle', 0.12);
          }
        }
      }

      // Abyss check (falling into pit)
      if (p.y > 600) {
        // Lost a life and respawn at start
        setLives((l) => {
          const nextL = l - 1;
          if (nextL <= 0) handleGameOver();
          return nextL;
        });
        p.x = 80;
        p.y = 300;
        p.vx = 0;
        p.vy = 0;
        p.invincibleTimer = 60;
        playBeep(220, 0.2, 'sawtooth', 0.15);
      }

      // 5. Coins & Collectibles Pickup
      for (const coin of coinsRef.current) {
        if (!coin.collected && Math.hypot(p.x + p.w / 2 - coin.x, p.y + p.h / 2 - coin.y) < 28) {
          coin.collected = true;
          sfxCoin();
          if (coin.type === 'coin') {
            setScore((s) => s + 20);
            setChipsCollected((c) => c + 1);
          } else if (coin.type === 'disk') {
            setScore((s) => s + 50);
            setChipsCollected((c) => c + 1);
          } else if (coin.type === 'coffee') {
            setScore((s) => s + 30);
            setLives((l) => Math.min(3, l + 1)); // Heal heart
          }
        }
      }

      // 6. Update Attacks & Hitboxes
      const activeAttacks: AttackEffect[] = [];
      for (const atk of attacksRef.current) {
        atk.life--;
        // Check hit against enemies
        for (const enemy of enemiesRef.current) {
          if (
            enemy.alive &&
            atk.x < enemy.x + enemy.w &&
            atk.x + atk.w > enemy.x &&
            atk.y < enemy.y + enemy.h &&
            atk.y + atk.h > enemy.y
          ) {
            enemy.alive = false;
            setScore((s) => s + 100);
            playBeep(440, 0.1, 'square', 0.15);
          }
        }
        if (atk.life > 0) activeAttacks.push(atk);
      }
      attacksRef.current = activeAttacks;

      // 7. Enemies Patrol & Collision
      for (const enemy of enemiesRef.current) {
        if (!enemy.alive) continue;
        enemy.x += enemy.vx;
        if (enemy.x <= enemy.minX || enemy.x + enemy.w >= enemy.maxX) {
          enemy.vx *= -1; // Bounce back
        }

        // Collision with Player
        if (
          p.x < enemy.x + enemy.w &&
          p.x + p.w > enemy.x &&
          p.y < enemy.y + enemy.h &&
          p.y + p.h > enemy.y
        ) {
          const isStarPowered = starPowerDuration > 0;
          const isStomp = p.vy > 0 && p.y + p.h - enemy.y < 16;

          if (isStarPowered || isStomp) {
            // Stomp kill!
            enemy.alive = false;
            p.vy = -8.5; // Bounce off enemy
            setScore((s) => s + 100);
            playBeep(420, 0.12, 'square', 0.15);
          } else if (p.invincibleTimer <= 0) {
            // Player takes damage
            p.invincibleTimer = 60;
            p.vy = -6;
            p.vx = p.facingRight ? -4 : 4;
            setLives((l) => {
              const nextL = l - 1;
              if (nextL <= 0) handleGameOver();
              return nextL;
            });
            sfxWrong();
          }
        }
      }

      // 8. Level Exit Check
      if (Math.hypot(p.x - lvl.exitX, p.y - lvl.exitY) < 45) {
        handleLevelClear();
      }

      // 9. Camera Following Player
      const targetCamX = p.x - canvas.width * 0.38;
      cameraXRef.current += (targetCamX - cameraXRef.current) * 0.12;
      cameraXRef.current = Math.max(0, Math.min(lvl.worldWidth - canvas.width, cameraXRef.current));
      const camX = cameraXRef.current;

      // ----------------------------------------------------
      // DRAW CANVAS FRAME
      // ----------------------------------------------------
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background Gradient & Office Grid
      const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGrad.addColorStop(0, lvl.bgGradient[0]);
      bgGrad.addColorStop(0.5, lvl.bgGradient[1]);
      bgGrad.addColorStop(1, lvl.bgGradient[2]);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Distant Parallax Server Pillars
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      for (let i = 0; i < 18; i++) {
        const pillarX = (i * 180 - camX * 0.25) % (canvas.width + 200);
        ctx.fillRect(pillarX, 40, 60, canvas.height - 40);
      }

      ctx.save();
      ctx.translate(-camX, 0);

      // Draw Platforms
      for (const plat of platformsRef.current) {
        if (plat.type === 'solid') {
          // Solid office desk / server slab
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(plat.x, plat.y, plat.w, 4); // Glowing top lip
        } else if (plat.type === 'cloud') {
          // Semi-floating cyber platform
          ctx.fillStyle = 'rgba(6, 182, 212, 0.35)';
          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = 2;
          ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
          ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
        } else if (plat.type === 'terminal') {
          // Mystery Question Terminal Box
          ctx.fillStyle = plat.used ? '#475569' : '#f59e0b';
          ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
          ctx.strokeStyle = plat.used ? '#64748b' : '#fbbf24';
          ctx.lineWidth = 3;
          ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
          // Question mark symbol
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 22px "Prompt", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(plat.used ? '✓' : '?', plat.x + plat.w / 2, plat.y + plat.h / 2);
        } else if (plat.type === 'spring') {
          // Bounce spring
          ctx.fillStyle = '#ec4899';
          ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
          ctx.fillStyle = '#f472b6';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('⚡', plat.x + plat.w / 2, plat.y + plat.h / 2 + 4);
        }
      }

      // Draw Collectibles
      for (const coin of coinsRef.current) {
        if (coin.collected) continue;
        if (coin.type === 'coin') {
          // Spinning gold chip
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(coin.x, coin.y, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (coin.type === 'disk') {
          // Floppy disk
          ctx.fillStyle = '#3b82f6';
          ctx.fillRect(coin.x - 10, coin.y - 10, 20, 20);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(coin.x - 6, coin.y - 8, 12, 6);
        } else if (coin.type === 'coffee') {
          // Coffee mug (Heals heart)
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.arc(coin.x, coin.y, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('☕', coin.x, coin.y + 4);
        }
      }

      // Draw Enemies
      for (const enemy of enemiesRef.current) {
        if (!enemy.alive) continue;
        if (enemy.type === 'bug') {
          // Bug Monster
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.ellipse(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, enemy.w / 2, enemy.h / 2, 0, 0, Math.PI * 2);
          ctx.fill();
          // Bug antenna & eyes
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(enemy.x + 8, enemy.y + 6, 5, 5);
          ctx.fillRect(enemy.x + enemy.w - 13, enemy.y + 6, 5, 5);
        } else {
          // Glitch Virus
          ctx.fillStyle = '#a855f7';
          ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(enemy.x + 4, enemy.y + 4, enemy.w - 8, enemy.h - 8);
        }
      }

      // Draw Attacks
      for (const atk of attacksRef.current) {
        ctx.fillStyle = 'rgba(234, 88, 12, 0.7)';
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(atk.x + atk.w / 2, atk.y + atk.h / 2, atk.w / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Draw Exit Portal / Gateway
      ctx.fillStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(lvl.exitX, lvl.exitY - 30, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🚪', lvl.exitX, lvl.exitY - 22);

      // Draw Player Hero
      ctx.save();
      ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
      if (!p.facingRight) ctx.scale(-1, 1);

      // Flicker if invincible
      if (p.invincibleTimer > 0 && Math.floor(p.invincibleTimer / 4) % 2 === 0) {
        ctx.globalAlpha = 0.35;
      }

      // Star Power Rainbow Glow
      if (starPowerDuration > 0) {
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 18;
      }

      // Render actual Hero Sprite from claw-empire
      if (heroImageRef.current && heroImageRef.current.complete) {
        ctx.drawImage(
          heroImageRef.current,
          -p.w / 2,
          -p.h / 2,
          p.w,
          p.h
        );
      } else {
        // Fallback procedural lobster avatar
        ctx.fillStyle = selectedHero.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('🦞', 0, 4);
      }

      ctx.restore();
      ctx.restore();

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [activeQuiz, currentLevelIdx, gameState, handleGameOver, handleLevelClear, playBeep, selectedHero, starPowerDuration]);

  // Answer Quiz from Terminal Block
  const handleAnswerQuiz = (choiceIdx: number) => {
    if (!activeQuiz || quizAnswered !== null) return;
    setQuizAnswered(choiceIdx);

    if (choiceIdx === activeQuiz.correctIndex) {
      sfxCorrect();
      setScore((s) => s + 150);
      setStarPowerDuration(280); // Invincible Star Power!
      setTimeout(() => {
        setActiveQuiz(null);
        setQuizAnswered(null);
      }, 1500);
    } else {
      sfxWrong();
      setTimeout(() => {
        setActiveQuiz(null);
        setQuizAnswered(null);
      }, 2000);
    }
  };

  return (
    <div className="claw-game-container">
      {/* Top Header & Navigation */}
      <div className="cg-top-bar">
        <Link to="/games" className="cg-back-link">
          <ChevronLeft size={20} />
          <span>เกมฝึกทักษะ</span>
        </Link>
        <div className="cg-header-title">
          <span className="cg-icon">🦞</span>
          <h1>Claw Empire: ตะลุยด่านกู้เซิร์ฟเวอร์</h1>
        </div>
        <button
          className="cg-mute-btn"
          onClick={() => setIsSoundMuted(!isSoundMuted)}
          aria-label={isSoundMuted ? 'เปิดเสียง' : 'ปิดเสียง'}
        >
          {isSoundMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

      {/* Quick Switch to Cyber Racer */}
      <div className="cg-game-switcher-banner">
        <Link to="/games/cyber-racer" className="cg-switcher-link">
          <span className="cg-switcher-tag">🏎️ เกมขับรถ:</span>
          <span>ลองเล่นเกม Cyber Racer: แข่งรถซิ่งตอบคำถามวิทยาการคำนวณ</span>
          <span className="cg-switcher-arrow">เล่นเลย →</span>
        </Link>
      </div>

      {/* Hero Selection Bar */}
      <div className="cg-hero-select-bar">
        <span className="cg-hero-label">เลือกฮีโร่ AI:</span>
        <div className="cg-hero-pills">
          {HEROES.map((hero) => (
            <button
              key={hero.id}
              className={`cg-hero-btn ${selectedHero.id === hero.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedHero(hero);
                if (gameState === 'playing') startGame(hero);
              }}
            >
              <img src={hero.spriteUrl} alt={hero.name} className="cg-hero-thumb" />
              <span>{hero.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* HUD Info Bar */}
      <div className="cg-hud-bar">
        <div className="cg-hud-item cg-score">
          <Trophy size={18} className="text-amber-400" />
          <span>{score.toLocaleString()} แต้ม</span>
        </div>

        <div className="cg-hud-item cg-lives">
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart
              key={i}
              size={18}
              className={i < lives ? 'text-rose-500 fill-rose-500' : 'text-slate-600'}
            />
          ))}
        </div>

        <div className="cg-hud-item cg-chips">
          <Sparkles size={18} className="text-yellow-400" />
          <span>{chipsCollected} ชิ้น</span>
        </div>

        <div className="cg-hud-item cg-stage">
          <span>{LEVEL_CONFIGS[currentLevelIdx]?.name.split(':')[0]}</span>
        </div>
      </div>

      {/* Main Viewport & Canvas */}
      <div className="cg-viewport">
        <canvas ref={canvasRef} width={760} height={500} className="cg-canvas" />

        {/* Start / Idle Overlay */}
        {gameState === 'idle' && (
          <div className="cg-overlay">
            <div className="cg-modal-box">
              <img src={selectedHero.spriteUrl} alt={selectedHero.name} className="cg-modal-hero-img" />
              <h2>CLAW EMPIRE: 2D PLATFORMER</h2>
              <p className="cg-modal-desc">
                เซิร์ฟเวอร์สำนักงานใหญ่ Claw-Empire โดนบั๊กและมัลแวร์บุก! ร่วมมือกับ <strong>{selectedHero.name}</strong>{' '}
                กระโดดเหยียบสิ่งกีดขวาง ปราบไวรัสคอมพิวเตอร์ และโหม่งกล่องคำถามกู้รหัสผ่านระบบ!
              </p>

              <div className="cg-hero-perk-box">
                <span className="font-bold text-amber-300">ความสามารถพิเศษ:</span> {selectedHero.perk}
              </div>

              <div className="cg-how-to-play">
                <div className="cg-rule-item">
                  <span>◀ ▶</span>
                  <span>เดินซ้าย / เดินขวา</span>
                </div>
                <div className="cg-rule-item">
                  <span>🦘 Space</span>
                  <span>กระโดด (กด 2 ครั้ง = ดับเบิ้ลจัมป์ / เหยียบหัวบั๊ก)</span>
                </div>
                <div className="cg-rule-item">
                  <span>🦞 J / Enter</span>
                  <span>ก้ามหนีบโจมตีปราบศัตรู</span>
                </div>
                <div className="cg-rule-item">
                  <span>❓ Terminal</span>
                  <span>โหม่งกล่องตอบโจทย์คำถามเพื่อรับพลังดาวกระพริบ</span>
                </div>
              </div>

              <button className="cg-primary-btn" onClick={() => startGame()}>
                <Play size={20} /> เริ่มภารกิจกู้เซิร์ฟเวอร์
              </button>
            </div>
          </div>
        )}

        {/* Game Over Modal */}
        {gameState === 'gameover' && (
          <div className="cg-overlay">
            <div className="cg-modal-box">
              <div className="cg-modal-emoji">💥</div>
              <h2>เซิร์ฟเวอร์ถูกตัดการเชื่อมต่อ!</h2>
              <p className="cg-modal-desc">พลังชีวิตหมดลง แต่คุณสามารถลองใหม่อีกครั้งเพื่อกู้คืนระบบได้</p>
              <div className="cg-score-display">
                <span>คะแนนที่ทำได้:</span>
                <strong>{score.toLocaleString()} แต้ม</strong>
              </div>
              <div className="cg-modal-actions">
                <button className="cg-primary-btn" onClick={() => startGame()}>
                  <RotateCcw size={18} /> เล่นใหม่อีกครั้ง
                </button>
                <Link to="/games" className="cg-secondary-btn">
                  <Award size={18} /> กลับหน้าเกม
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Victory Modal */}
        {gameState === 'victory' && (
          <div className="cg-overlay">
            <div className="cg-modal-box">
              <div className="cg-modal-emoji">🏆</div>
              <h2>ภารกิจกู้เซิร์ฟเวอร์สำเร็จสมบูรณ์!</h2>
              <p className="cg-modal-desc">
                คุณพา {selectedHero.name} กำจัดไวรัสและกู้คืนเซิร์ฟเวอร์ทั้งหมดของ Claw-Empire ได้สำเร็จ!
              </p>
              <div className="cg-score-display">
                <span>คะแนนสูงสุด:</span>
                <strong className="text-amber-400">{score.toLocaleString()} แต้ม</strong>
              </div>
              <div className="cg-modal-actions">
                <button className="cg-primary-btn" onClick={() => startGame()}>
                  <RotateCcw size={18} /> ลุยอีกรอบ
                </button>
                <Link to="/games" className="cg-secondary-btn">
                  <Award size={18} /> กลับหน้าหลัก
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Quiz Terminal Modal */}
        {activeQuiz && (
          <div className="cg-quiz-overlay">
            <div className="cg-quiz-card">
              <div className="cg-quiz-header">
                <HelpCircle size={22} className="text-amber-400" />
                <span>TERMINAL DECRYPTOR: ถอดรหัสคำถามวิทยาการคำนวณ</span>
              </div>
              <p className="cg-quiz-question">{activeQuiz.question}</p>
              <div className="cg-quiz-options">
                {activeQuiz.choices.map((choice, idx) => {
                  let btnClass = 'cg-quiz-btn';
                  if (quizAnswered !== null) {
                    if (idx === activeQuiz.correctIndex) btnClass += ' correct';
                    else if (idx === quizAnswered) btnClass += ' wrong';
                  }
                  return (
                    <button
                      key={idx}
                      className={btnClass}
                      onClick={() => handleAnswerQuiz(idx)}
                      disabled={quizAnswered !== null}
                    >
                      <span className="cg-opt-index">{idx + 1}</span>
                      <span className="cg-opt-text">{choice}</span>
                      {quizAnswered !== null && idx === activeQuiz.correctIndex && (
                        <CheckCircle size={18} className="text-emerald-400 ml-auto" />
                      )}
                      {quizAnswered !== null && idx === quizAnswered && idx !== activeQuiz.correctIndex && (
                        <XCircle size={18} className="text-rose-400 ml-auto" />
                      )}
                    </button>
                  );
                })}
              </div>
              {quizAnswered !== null && (
                <div className="cg-quiz-feedback">
                  <div className="cg-fb-explain font-bold">
                    {quizAnswered === activeQuiz.correctIndex ? '🎉 ถูกต้อง! ได้รับพลังดาว Star Power +150 แต้ม!' : '💡 คำอธิบาย:'}
                  </div>
                  <div className="text-slate-300 text-xs mt-1">{activeQuiz.explanation}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* On-Screen Mobile Touch Controls */}
      <div className="cg-touch-controls">
        <div className="cg-dpad-left">
          <button
            className="cg-btn cg-btn-move"
            onPointerDown={() => { keysRef.current.left = true; }}
            onPointerUp={() => { keysRef.current.left = false; }}
            onPointerLeave={() => { keysRef.current.left = false; }}
            aria-label="เดินซ้าย"
          >
            <ArrowLeft size={24} />
          </button>
          <button
            className="cg-btn cg-btn-move"
            onPointerDown={() => { keysRef.current.right = true; }}
            onPointerUp={() => { keysRef.current.right = false; }}
            onPointerLeave={() => { keysRef.current.right = false; }}
            aria-label="เดินขวา"
          >
            <ArrowRight size={24} />
          </button>
        </div>

        <div className="cg-dpad-right">
          <button
            className="cg-btn cg-btn-action"
            onClick={triggerAttack}
            aria-label="ก้ามหนีบ โจมตี"
          >
            <Zap size={22} />
            <span>ก้ามหนีบ</span>
          </button>
          <button
            className="cg-btn cg-btn-jump"
            onPointerDown={() => {
              keysRef.current.jump = true;
              playerRef.current.jumpBuffer = 8;
            }}
            onPointerUp={() => {
              keysRef.current.jump = false;
              if (playerRef.current.vy < -3) playerRef.current.vy *= 0.45;
            }}
            aria-label="กระโดด"
          >
            <ArrowUp size={24} />
            <span>กระโดด</span>
          </button>
        </div>
      </div>

      {/* Keyboard Controls Guide */}
      <div className="cg-keys-hint">
        <span>🎮 คีย์บอร์ด:</span>
        <kbd>A</kbd> <kbd>←</kbd> เดินซ้าย &bull; <kbd>D</kbd> <kbd>→</kbd> เดินขวา &bull;{' '}
        <kbd>Space</kbd> <kbd>W</kbd> กระโดด (กดซ้ำเพื่อกระโดด 2 ชั้น) &bull;{' '}
        <kbd>J</kbd> <kbd>Enter</kbd> ก้ามหนีบโจมตี
      </div>

      {/* Pedagogical Reflection Card */}
      <div className="cg-learn-card-wrap">
        <GameLearnCard gameKey="claw-platformer" />
      </div>
    </div>
  );
};

export default ClawPlatformerGame;
