import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  RotateCcw,
  Play,
  Trophy,
  Heart,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Zap,
  Shield,
} from 'lucide-react';
import { useGameProgress } from '../../hooks/useGameProgress';
import { sfxCoin, sfxWrong, sfxCorrect } from '../../utils/gameSounds';
import GameLearnCard from '../../components/GameLearnCard';
import './GameStyles.css';
import './ObstacleDodgeGame.css';

const ARENA_WIDTH = 500;
const ARENA_HEIGHT = 750;
const LANES_COUNT = 5;
const LANE_WIDTH = ARENA_WIDTH / LANES_COUNT; // 100px
const PLAYER_Y = 640;

interface BoulderHazard {
  type: 'boulder';
  id: number;
  lane: number;
  y: number;
  speed: number;
  radius: number;
}

interface WallHazard {
  type: 'wall';
  id: number;
  y: number;
  safeLanes: number[]; // e.g. [2]
  speed: number;
}

interface LaserHazard {
  type: 'laser';
  id: number;
  lanes: number[];
  warningTime: number; // ms remaining
  firingTime: number; // ms remaining
  state: 'warning' | 'firing' | 'done';
}

type Hazard = BoulderHazard | WallHazard | LaserHazard;

interface CollectibleOrb {
  id: number;
  lane: number;
  y: number;
  points: number;
  isBoost?: boolean;
}

const ObstacleDodgeGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // States
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0); // in meters
  const [lives, setLives] = useState(3);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('kj_obstacle_dodge_best') || '0', 10);
  });
  const [overdrive, setOverdrive] = useState(false);
  const [overdriveTime, setOverdriveTime] = useState(0);
  const [hasShield, setHasShield] = useState(false);

  // Hooks
  const recordGame = useGameProgress('obstacle-dodge', 'Cyber Dodge (หลบหลีกสิ่งกีดขวาง)');

  // Mutable Game Loop State
  const gameLoopRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const nextEntityId = useRef(1);

  const playerStateRef = useRef({
    currentLane: 2, // 0 to 4
    targetX: 2 * LANE_WIDTH + LANE_WIDTH / 2,
    x: 2 * LANE_WIDTH + LANE_WIDTH / 2,
    y: PLAYER_Y,
    isJumping: false,
    jumpTimer: 0,
    jumpDuration: 450, // ms
    iframe: 0,
  });

  const hazardsRef = useRef<Hazard[]>([]);
  const collectiblesRef = useRef<CollectibleOrb[]>([]);
  const spawnTimerRef = useRef<number>(1200);
  const orbSpawnTimerRef = useRef<number>(1800);
  const speedScaleRef = useRef<number>(1);

  // Audio tone helper
  const playTone = useCallback((freq: number, duration: number, type: OscillatorType = 'sine') => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Ignored
    }
  }, []);

  // Lane switching
  const shiftLane = useCallback((dir: -1 | 1) => {
    const current = playerStateRef.current.currentLane;
    const next = Math.max(0, Math.min(LANES_COUNT - 1, current + dir));
    if (next !== current) {
      playerStateRef.current.currentLane = next;
      playerStateRef.current.targetX = next * LANE_WIDTH + LANE_WIDTH / 2;
      playTone(520, 0.05, 'triangle');
    }
  }, [playTone]);

  // Jump action
  const performJump = useCallback(() => {
    if (!playerStateRef.current.isJumping) {
      playerStateRef.current.isJumping = true;
      playerStateRef.current.jumpTimer = playerStateRef.current.jumpDuration;
      playTone(660, 0.12, 'sine');
    }
  }, [playTone]);

  // Start game
  const startGame = useCallback(() => {
    playerStateRef.current = {
      currentLane: 2,
      targetX: 2 * LANE_WIDTH + LANE_WIDTH / 2,
      x: 2 * LANE_WIDTH + LANE_WIDTH / 2,
      y: PLAYER_Y,
      isJumping: false,
      jumpTimer: 0,
      jumpDuration: 450,
      iframe: 0,
    };
    hazardsRef.current = [];
    collectiblesRef.current = [];
    speedScaleRef.current = 1;
    spawnTimerRef.current = 1000;
    orbSpawnTimerRef.current = 1200;

    setScore(0);
    setDistance(0);
    setLives(3);
    setOverdrive(false);
    setOverdriveTime(0);
    setHasShield(false);
    setGameState('playing');
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        shiftLane(-1);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        shiftLane(1);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        e.preventDefault();
        performJump();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, shiftLane, performJump]);

  // Canvas drawing (พิกัดตรรกะ 500×750 เดิม วาดคมชัดตามขนาดจอจริง × devicePixelRatio)
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = canvas.clientWidth || ARENA_WIDTH;
    const pxW = Math.round(cssW * dpr);
    const pxH = Math.round(pxW * (ARENA_HEIGHT / ARENA_WIDTH));
    if (canvas.width !== pxW || canvas.height !== pxH) {
      canvas.width = pxW;
      canvas.height = pxH;
    }
    const k = pxW / ARENA_WIDTH;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    const now = performance.now();
    const scroll = (now * 0.32 * speedScaleRef.current) % 60;

    const drawEmoji = (icon: string, x: number, y: number, size: number) => {
      ctx.font = `${size}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(icon, x, y);
    };

    // พื้นอุโมงค์ไซเบอร์: ไล่สีจากบนลงล่าง + แถบเลนสลับสี
    const bg = ctx.createLinearGradient(0, 0, 0, ARENA_HEIGHT);
    bg.addColorStop(0, '#060a1f');
    bg.addColorStop(1, '#101a3d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
    for (let i = 0; i < LANES_COUNT; i++) {
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.045)';
        ctx.fillRect(i * LANE_WIDTH, 0, LANE_WIDTH, ARENA_HEIGHT);
      }
    }
    // เส้นพื้นวิ่งลงมา บอกความเร็ว
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.12)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let y = -60 + scroll; y < ARENA_HEIGHT; y += 60) {
      ctx.moveTo(0, y);
      ctx.lineTo(ARENA_WIDTH, y);
    }
    ctx.stroke();
    // เส้นแบ่งเลนแบบประเคลื่อนที่
    ctx.strokeStyle = 'rgba(103, 232, 249, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([18, 14]);
    ctx.lineDashOffset = -scroll;
    for (let i = 1; i < LANES_COUNT; i++) {
      const lx = i * LANE_WIDTH;
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, ARENA_HEIGHT);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    // ขอบนีออนซ้าย-ขวา
    ctx.fillStyle = '#22d3ee';
    ctx.fillRect(0, 0, 3, ARENA_HEIGHT);
    ctx.fillRect(ARENA_WIDTH - 3, 0, 3, ARENA_HEIGHT);

    // 1. Draw Laser Warnings & Laser Beams
    for (const h of hazardsRef.current) {
      if (h.type === 'laser') {
        for (const lane of h.lanes) {
          const lx = lane * LANE_WIDTH;
          if (h.state === 'warning') {
            const blink = 0.5 + 0.5 * Math.sin(now * 0.02);
            ctx.fillStyle = `rgba(239, 68, 68, ${0.1 + blink * 0.14})`;
            ctx.fillRect(lx, 0, LANE_WIDTH, ARENA_HEIGHT);
            ctx.strokeStyle = '#f87171';
            ctx.lineWidth = 3;
            ctx.setLineDash([10, 8]);
            ctx.strokeRect(lx + 5, 5, LANE_WIDTH - 10, ARENA_HEIGHT - 10);
            ctx.setLineDash([]);
            // ป้ายเตือน
            ctx.fillStyle = '#b91c1c';
            ctx.beginPath();
            ctx.roundRect(lx + 10, 58, LANE_WIDTH - 20, 40, 10);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = '800 20px Kanit, "Prompt", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⚠ ระวัง', lx + LANE_WIDTH / 2, 79);
          } else if (h.state === 'firing') {
            const grad = ctx.createLinearGradient(lx, 0, lx + LANE_WIDTH, 0);
            grad.addColorStop(0, 'rgba(239, 68, 68, 0.25)');
            grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
            grad.addColorStop(1, 'rgba(239, 68, 68, 0.25)');
            ctx.fillStyle = grad;
            ctx.fillRect(lx, 0, LANE_WIDTH, ARENA_HEIGHT);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(lx + LANE_WIDTH / 2 - 10, 0, 20, ARENA_HEIGHT);
            ctx.fillStyle = '#fff';
            ctx.fillRect(lx + LANE_WIDTH / 2 - 3, 0, 6, ARENA_HEIGHT);
          }
        }
      }
    }

    // 2. Draw Collectible Orbs (ลอยและเรืองแสง)
    for (const orb of collectiblesRef.current) {
      const ox = orb.lane * LANE_WIDTH + LANE_WIDTH / 2;
      const glow = ctx.createRadialGradient(ox, orb.y, 4, ox, orb.y, 30);
      glow.addColorStop(0, orb.isBoost ? 'rgba(34, 211, 238, 0.55)' : 'rgba(251, 191, 36, 0.55)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(ox, orb.y, 30, 0, Math.PI * 2);
      ctx.fill();
      drawEmoji(orb.isBoost ? '⚡' : '💎', ox, orb.y + Math.sin(now * 0.006 + orb.y) * 2, 32);
    }

    // 3. Draw Hazards: Boulders & Walls
    for (const h of hazardsRef.current) {
      if (h.type === 'boulder') {
        const bx = h.lane * LANE_WIDTH + LANE_WIDTH / 2;
        const r = h.radius + 4;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(bx, h.y + r * 0.85, r * 0.9, r * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        // หินเหลี่ยม (วาดเอง) หมุนตามระยะทาง
        ctx.save();
        ctx.translate(bx, h.y);
        ctx.rotate(h.y * 0.01);
        const rock = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r);
        rock.addColorStop(0, '#a8a29e');
        rock.addColorStop(0.6, '#57534e');
        rock.addColorStop(1, '#292524');
        ctx.fillStyle = rock;
        ctx.beginPath();
        const pts = 9;
        for (let i = 0; i < pts; i++) {
          const a = (i / pts) * Math.PI * 2;
          const rr = r * (0.82 + ((i * 37) % 7) / 30);
          if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
          else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();
      } else if (h.type === 'wall') {
        const wallHeight = 30;
        const top = h.y - wallHeight / 2;
        for (let l = 0; l < LANES_COUNT; l++) {
          const wx = l * LANE_WIDTH;
          if (!h.safeLanes.includes(l)) {
            // กำแพงพลังงานลายเตือนเหลือง-ดำ
            ctx.save();
            ctx.beginPath();
            ctx.rect(wx + 3, top, LANE_WIDTH - 6, wallHeight);
            ctx.clip();
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(wx + 3, top, LANE_WIDTH - 6, wallHeight);
            ctx.fillStyle = '#fbbf24';
            for (let sx = -wallHeight; sx < LANE_WIDTH; sx += 20) {
              ctx.beginPath();
              ctx.moveTo(wx + sx, top + wallHeight);
              ctx.lineTo(wx + sx + 10, top + wallHeight);
              ctx.lineTo(wx + sx + 10 + wallHeight, top);
              ctx.lineTo(wx + sx + wallHeight, top);
              ctx.closePath();
              ctx.fill();
            }
            ctx.restore();
            ctx.strokeStyle = '#7f1d1d';
            ctx.lineWidth = 3;
            ctx.strokeRect(wx + 3, top, LANE_WIDTH - 6, wallHeight);
          } else {
            // ช่องปลอดภัย: ประตูสีเขียว + ลูกศร
            ctx.fillStyle = 'rgba(16, 185, 129, 0.28)';
            ctx.fillRect(wx + 3, top, LANE_WIDTH - 6, wallHeight);
            ctx.strokeStyle = '#34d399';
            ctx.lineWidth = 3;
            ctx.strokeRect(wx + 3, top, LANE_WIDTH - 6, wallHeight);
            ctx.fillStyle = '#ecfdf5';
            ctx.font = '800 20px Kanit, "Prompt", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('▼ ผ่านได้', wx + LANE_WIDTH / 2, h.y + 1);
          }
        }
      }
    }

    // 4. Draw Player
    const p = playerStateRef.current;
    const isFlashing = p.iframe > 0 && Math.floor(p.iframe / 100) % 2 === 0;

    if (!isFlashing) {
      const jumpOffset = p.isJumping ? Math.sin((p.jumpTimer / p.jumpDuration) * Math.PI) * 35 : 0;
      const drawY = p.y - jumpOffset;
      const playerScale = p.isJumping ? 1.25 : 1;

      // เงา (เล็กลงเมื่อกระโดด)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + 20, 20 - jumpOffset * 0.2, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // วงแสงบอกตำแหน่งผู้เล่น
      const ring = ctx.createRadialGradient(p.x, drawY, 8, p.x, drawY, 42);
      ring.addColorStop(0, overdrive ? 'rgba(34, 211, 238, 0.45)' : 'rgba(250, 204, 21, 0.35)');
      ring.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = ring;
      ctx.beginPath();
      ctx.arc(p.x, drawY, 42, 0, Math.PI * 2);
      ctx.fill();

      if (overdrive) {
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(p.x, drawY, 32, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.save();
      ctx.translate(p.x, drawY);
      ctx.scale(playerScale, playerScale);
      drawEmoji(overdrive ? '🚀' : '🏃', 0, 0, 44);
      ctx.restore();
    }
  }, [overdrive]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      return;
    }

    let currentLives = 3;
    let currentScore = 0;
    let currentDistance = 0;
    let isBoosted = false;
    let boostTimeRemaining = 0;
    let currentShield = false;

    lastTimeRef.current = performance.now();

    const loop = (timestamp: number) => {
      const dt = Math.min(timestamp - lastTimeRef.current, 50);
      lastTimeRef.current = timestamp;

      // Accelerate speed gradually
      speedScaleRef.current = Math.min(2.4, 1 + currentDistance / 600);
      const baseSpeed = 380 * speedScaleRef.current; // px per second

      // Distance increment
      const dDist = (baseSpeed * (dt / 1000)) / 10;
      currentDistance += dDist;
      setDistance(Math.floor(currentDistance));

      currentScore += Math.floor(dDist * (isBoosted ? 4 : 2));
      setScore(currentScore);

      // Boost timer
      if (boostTimeRemaining > 0) {
        boostTimeRemaining -= dt;
        setOverdriveTime(Math.ceil(boostTimeRemaining / 1000));
        if (boostTimeRemaining <= 0) {
          isBoosted = false;
          setOverdrive(false);
        }
      }

      // Update Player Smooth Position
      const p = playerStateRef.current;
      p.x += (p.targetX - p.x) * 0.25;

      if (p.isJumping) {
        p.jumpTimer -= dt;
        if (p.jumpTimer <= 0) {
          p.isJumping = false;
        }
      }

      if (p.iframe > 0) {
        p.iframe -= dt;
      }

      // 1. Spawner for Hazards
      spawnTimerRef.current -= dt;
      if (spawnTimerRef.current <= 0) {
        const randType = Math.random();
        const hazardSpeed = baseSpeed * (0.9 + Math.random() * 0.2);

        if (randType < 0.45) {
          // Boulder
          const lane = Math.floor(Math.random() * LANES_COUNT);
          hazardsRef.current.push({
            type: 'boulder',
            id: nextEntityId.current++,
            lane,
            y: -40,
            speed: hazardSpeed,
            radius: 24,
          });
        } else if (randType < 0.78) {
          // Wall with 1 or 2 safe gaps
          const safeLane1 = Math.floor(Math.random() * LANES_COUNT);
          const safeLanes = [safeLane1];
          if (Math.random() < 0.4) {
            safeLanes.push((safeLane1 + 1) % LANES_COUNT);
          }
          hazardsRef.current.push({
            type: 'wall',
            id: nextEntityId.current++,
            y: -50,
            safeLanes,
            speed: hazardSpeed * 0.9,
          });
        } else {
          // Sweeping Laser Beam
          const laserLane = Math.floor(Math.random() * LANES_COUNT);
          const lanes = [laserLane];
          if (Math.random() < 0.35 && laserLane + 1 < LANES_COUNT) {
            lanes.push(laserLane + 1);
          }
          hazardsRef.current.push({
            type: 'laser',
            id: nextEntityId.current++,
            lanes,
            warningTime: 1200,
            firingTime: 750,
            state: 'warning',
          });
        }

        spawnTimerRef.current = Math.max(550, 1400 - (currentDistance / 10) * 15);
      }

      // 2. Spawner for Orbs
      orbSpawnTimerRef.current -= dt;
      if (orbSpawnTimerRef.current <= 0) {
        const lane = Math.floor(Math.random() * LANES_COUNT);
        const isBoost = Math.random() < 0.15;
        collectiblesRef.current.push({
          id: nextEntityId.current++,
          lane,
          y: -30,
          points: isBoost ? 150 : 50,
          isBoost,
        });
        orbSpawnTimerRef.current = 1500 + Math.random() * 1000;
      }

      // 3. Update Collectible Orbs
      const remainingOrbs: CollectibleOrb[] = [];
      for (const orb of collectiblesRef.current) {
        orb.y += baseSpeed * (dt / 1000);
        const orbX = orb.lane * LANE_WIDTH + LANE_WIDTH / 2;
        const dist = Math.hypot(p.x - orbX, p.y - orb.y);

        if (dist < 36) {
          // Collected!
          sfxCoin();
          currentScore += orb.points;
          setScore(currentScore);

          if (orb.isBoost) {
            isBoosted = true;
            boostTimeRemaining = 4000;
            setOverdrive(true);
            setOverdriveTime(4);
            sfxCorrect();
          }
        } else if (orb.y < ARENA_HEIGHT + 50) {
          remainingOrbs.push(orb);
        }
      }
      collectiblesRef.current = remainingOrbs;

      // 4. Update Hazards & Collision Check
      const remainingHazards: Hazard[] = [];
      for (const h of hazardsRef.current) {
        let active = true;

        if (h.type === 'boulder') {
          h.y += h.speed * (dt / 1000);
          const bX = h.lane * LANE_WIDTH + LANE_WIDTH / 2;
          const dist = Math.hypot(p.x - bX, p.y - h.y);

          // Can jump over boulder!
          if (dist < h.radius + 20 && !p.isJumping) {
            if (isBoosted) {
              // Destroy boulder in overdrive!
              currentScore += 100;
              setScore(currentScore);
              sfxCorrect();
              active = false;
            } else if (p.iframe <= 0) {
              if (currentShield) {
                currentShield = false;
                setHasShield(false);
                p.iframe = 1000;
                sfxWrong();
              } else {
                currentLives -= 1;
                setLives(currentLives);
                p.iframe = 1500;
                sfxWrong();
                if (currentLives <= 0) {
                  setGameState('gameover');
                  return;
                }
              }
            }
          }

          if (h.y > ARENA_HEIGHT + 60) active = false;
        } else if (h.type === 'wall') {
          h.y += h.speed * (dt / 1000);
          const wallTop = h.y - 20;
          const wallBottom = h.y + 20;

          // Check if player overlaps wall vertically
          if (p.y >= wallTop && p.y <= wallBottom) {
            // Check if player is NOT in a safe lane
            if (!h.safeLanes.includes(p.currentLane)) {
              if (isBoosted) {
                currentScore += 200;
                setScore(currentScore);
                sfxCorrect();
                active = false;
              } else if (p.iframe <= 0) {
                if (currentShield) {
                  currentShield = false;
                  setHasShield(false);
                  p.iframe = 1000;
                  sfxWrong();
                } else {
                  currentLives -= 1;
                  setLives(currentLives);
                  p.iframe = 1500;
                  sfxWrong();
                  if (currentLives <= 0) {
                    setGameState('gameover');
                    return;
                  }
                }
              }
            }
          }

          if (h.y > ARENA_HEIGHT + 60) active = false;
        } else if (h.type === 'laser') {
          if (h.state === 'warning') {
            h.warningTime -= dt;
            if (h.warningTime <= 0) {
              h.state = 'firing';
              playTone(180, 0.4, 'sawtooth');
            }
          } else if (h.state === 'firing') {
            h.firingTime -= dt;
            // Laser hits ANYONE in that lane (cannot be jumped over!)
            if (h.lanes.includes(p.currentLane)) {
              if (isBoosted) {
                // Invincible
              } else if (p.iframe <= 0) {
                if (currentShield) {
                  currentShield = false;
                  setHasShield(false);
                  p.iframe = 1000;
                  sfxWrong();
                } else {
                  currentLives -= 1;
                  setLives(currentLives);
                  p.iframe = 1500;
                  sfxWrong();
                  if (currentLives <= 0) {
                    setGameState('gameover');
                    return;
                  }
                }
              }
            }

            if (h.firingTime <= 0) {
              h.state = 'done';
              active = false;
            }
          }
        }

        if (active) remainingHazards.push(h);
      }
      hazardsRef.current = remainingHazards;

      // 5. Render Canvas
      renderCanvas();

      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, playTone, renderCanvas]);

  // Record score when game ends
  useEffect(() => {
    if (gameState === 'gameover' && score > 0) {
      void recordGame(score);
      const timer = window.setTimeout(() => {
        setHighScore((prev) => {
          if (score > prev) {
            localStorage.setItem('kj_obstacle_dodge_best', String(score));
            return score;
          }
          return prev;
        });
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [gameState, score, recordGame]);

  return (
    <div className="dodge-game-container">
      {/* Educational Learning Card */}
      <GameLearnCard gameKey="obstacle-dodge" />

      {/* Header */}
      <div className="od-header">
        <Link to="/games" className="od-back-btn">
          <ChevronLeft size={18} />
          <span>เกมทั้งหมด</span>
        </Link>
        <div className="od-title-wrap">
          <h1 className="od-title">⚡ Cyber Dodge</h1>
          <p className="od-subtitle">หลบหลีกหินกลิ้ง เลเซอร์กวาด และกำแพงดิจิทัล</p>
        </div>
        <div style={{ width: 80 }} />
      </div>

      {/* HUD Bar */}
      <div className="od-hud">
        <div className="od-hud-card">
          <span className="od-hud-label">เกราะพลังงาน</span>
          <div className="od-hud-val" style={{ display: 'flex', gap: '4px' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart
                key={i}
                size={18}
                fill={i < lives ? '#ef4444' : 'none'}
                color={i < lives ? '#ef4444' : '#475569'}
              />
            ))}
          </div>
        </div>

        <div className="od-hud-card">
          <span className="od-hud-label">ระยะทาง</span>
          <span className="od-hud-val cyan">{distance} m</span>
        </div>

        <div className="od-hud-card">
          <span className="od-hud-label">คะแนนรวม</span>
          <span className="od-hud-val gold">{score.toLocaleString()}</span>
        </div>

        <div className="od-hud-card">
          <span className="od-hud-label">คะแนนสูงสุด</span>
          <span className="od-hud-val">{highScore.toLocaleString()}</span>
        </div>
      </div>

      {/* Canvas Arena */}
      <div className="od-canvas-wrap">
        <canvas
          ref={canvasRef}
          width={ARENA_WIDTH}
          height={ARENA_HEIGHT}
          className="od-canvas"
        />

        {/* Active Buffs */}
        <div className="od-active-buffs">
          {overdrive && (
            <div className="od-buff-pill boost">
              <Zap size={14} /> OVERDRIVE ({overdriveTime}s)
            </div>
          )}
          {hasShield && (
            <div className="od-buff-pill shield">
              <Shield size={14} /> เกราะสะท้อน
            </div>
          )}
        </div>

        {/* Start Screen Overlay */}
        {gameState === 'idle' && (
          <div className="od-overlay">
            <div className="od-overlay-icon">🏃‍♂️</div>
            <h2 className="od-overlay-title start">วิ่งทะลุสิ่งกีดขวางไซเบอร์</h2>
            <p className="od-overlay-desc">
              เปลี่ยนเลนซ้าย-ขวา เพื่อหลบหินกลิ้ง 🪨 และหาช่องว่างของกำแพง 🧱 
              ระวังเลเซอร์สีแดง ⚡ กวาดทั้งเลน! กด กระโดด เพื่อข้ามหินกลิ้งได้!
            </p>
            <div className="od-btn-group">
              <button
                type="button"
                className="od-btn-primary"
                onClick={startGame}
              >
                <Play size={20} fill="#fff" />
                <span>เริ่มวิ่งทันที</span>
              </button>
            </div>
          </div>
        )}

        {/* Game Over Screen Overlay */}
        {gameState === 'gameover' && (
          <div className="od-overlay">
            <div className="od-overlay-icon">💥</div>
            <h2 className="od-overlay-title over">ระบบขัดข้อง (Crash!)</h2>
            <p className="od-overlay-desc">
              ชนสิ่งกีดขวางพลังงานสูง! สรุปสถิติความเร็วและการตอบสนอง:
            </p>

            <div className="od-results-grid">
              <div className="od-result-item">
                <div className="od-result-key">ระยะทางที่รอด</div>
                <div className="od-result-val" style={{ color: '#06b6d4' }}>
                  {distance} เมตร
                </div>
              </div>
              <div className="od-result-item">
                <div className="od-result-key">คะแนนการตอบสนอง</div>
                <div className="od-result-val" style={{ color: '#fbbf24' }}>
                  {score.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="od-btn-group">
              <button
                type="button"
                className="od-btn-primary"
                onClick={startGame}
              >
                <RotateCcw size={18} />
                <span>ลองใหม่อีกครั้ง</span>
              </button>
              <Link to="/games" className="od-btn-secondary">
                <Trophy size={18} />
                <span>เลือกเกมอื่น</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="od-controls-panel">
        <button
          type="button"
          className="od-ctrl-btn"
          onClick={() => shiftLane(-1)}
          aria-label="Move Left"
        >
          <ArrowLeft size={24} />
          <span>ซ้าย (A)</span>
        </button>

        <button
          type="button"
          className="od-ctrl-btn jump"
          onClick={performJump}
          aria-label="Jump"
        >
          <ArrowUp size={24} />
          <span>กระโดด (W)</span>
        </button>

        <button
          type="button"
          className="od-ctrl-btn"
          onClick={() => shiftLane(1)}
          aria-label="Move Right"
        >
          <ArrowRight size={24} />
          <span>ขวา (D)</span>
        </button>
      </div>

      {/* Keyboard Instructions */}
      <div className="od-instructions">
        <span>คีย์บอร์ด: <kbd className="od-kbd">←</kbd> <kbd className="od-kbd">→</kbd> หรือ <kbd className="od-kbd">A</kbd> <kbd className="od-kbd">D</kbd> สลับเลน</span>
        <span>กระโดด: <kbd className="od-kbd">Space</kbd> หรือ <kbd className="od-kbd">W</kbd></span>
      </div>
    </div>
  );
};

export default ObstacleDodgeGame;
