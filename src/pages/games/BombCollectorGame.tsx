import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  RotateCcw,
  Play,
  Trophy,
  Shield,
  Zap,
  Snowflake,
  Heart,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { useGameProgress } from '../../hooks/useGameProgress';
import { sfxCoin, sfxWrong, sfxCorrect } from '../../utils/gameSounds';
import GameLearnCard from '../../components/GameLearnCard';
import './GameStyles.css';
import './BombCollectorGame.css';

// Logical arena coordinate system
const ARENA_WIDTH = 800;
const ARENA_HEIGHT = 600;
const PLAYER_SIZE = 26;

interface Bomb {
  id: number;
  x: number;
  y: number;
  radius: number;
  totalFuse: number; // ms
  fuseRemaining: number; // ms
  state: 'ticking' | 'exploding' | 'finished';
  explodeElapsed: number; // ms
  explodeDuration: number;
  color: string;
}

interface ChipItem {
  id: number;
  x: number;
  y: number;
  type: 'chip' | 'gem' | 'core';
  points: number;
  label: string;
}

interface PowerUp {
  id: number;
  x: number;
  y: number;
  type: 'shield' | 'speed' | 'freeze' | 'heart';
  icon: string;
  duration: number; // duration on ground
}

interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  opacity: number;
  scale: number;
}

const BombCollectorGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game state
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('kj_bomb_collector_best') || '0', 10);
  });
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [chipsCollected, setChipsCollected] = useState(0);
  const [bombsDodged, setBombsDodged] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Active buffs
  const [hasShield, setHasShield] = useState(false);
  const [speedBoostTimer, setSpeedBoostTimer] = useState(0);
  const [freezeTimer, setFreezeTimer] = useState(0);

  // Game progress recording hook
  const recordGame = useGameProgress('bomb-collector', 'Bomb Collector Pro');

  // Mutable Game Loop State
  const gameLoopRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const playerRef = useRef({
    x: ARENA_WIDTH / 2,
    y: ARENA_HEIGHT / 2,
    vx: 0,
    vy: 0,
    baseSpeed: 5.5,
    iframe: 0, // invulnerability timer in ms
  });

  const bombsRef = useRef<Bomb[]>([]);
  const chipsRef = useRef<ChipItem[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const bombSpawnTimerRef = useRef<number>(1200);
  const powerUpSpawnTimerRef = useRef<number>(12000);
  const nextEntityId = useRef(1);

  // Local audio tone synthesis for ticking and explosions
  const playSfxTone = useCallback((freq: number, duration: number, type: OscillatorType = 'sine') => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio context policy or disabled
    }
  }, []);

  const playExplosionSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      // Low boom
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Fallback
    }
  }, []);

  // Spawn random data chip
  const spawnChip = useCallback(() => {
    const margin = 50;
    const x = margin + Math.random() * (ARENA_WIDTH - margin * 2);
    const y = margin + Math.random() * (ARENA_HEIGHT - margin * 2);
    const rand = Math.random();
    let type: 'chip' | 'gem' | 'core' = 'chip';
    let points = 100;
    let label = '💾 Data Chip';

    if (rand > 0.85) {
      type = 'core';
      points = 300;
      label = '🔋 Energy Core';
    } else if (rand > 0.6) {
      type = 'gem';
      points = 200;
      label = '💎 Cyber Gem';
    }

    chipsRef.current.push({
      id: nextEntityId.current++,
      x,
      y,
      type,
      points,
      label,
    });
  }, []);

  // Spawn random bomb
  const spawnBomb = useCallback((lvl: number) => {
    const margin = 70;
    const x = margin + Math.random() * (ARENA_WIDTH - margin * 2);
    const y = margin + Math.random() * (ARENA_HEIGHT - margin * 2);

    // Harder bombs have varied blast radius
    const isMega = Math.random() < 0.2 + lvl * 0.05;
    const radius = isMega ? 100 : 70;
    const fuse = Math.max(900, 1400 - lvl * 60);

    bombsRef.current.push({
      id: nextEntityId.current++,
      x,
      y,
      radius,
      totalFuse: fuse,
      fuseRemaining: fuse,
      state: 'ticking',
      explodeElapsed: 0,
      explodeDuration: 380,
      color: isMega ? '#ef4444' : '#f97316',
    });
  }, []);

  // Spawn powerup
  const spawnPowerUp = useCallback(() => {
    const margin = 60;
    const x = margin + Math.random() * (ARENA_WIDTH - margin * 2);
    const y = margin + Math.random() * (ARENA_HEIGHT - margin * 2);
    const types: ('shield' | 'speed' | 'freeze' | 'heart')[] = ['shield', 'speed', 'freeze'];
    if (lives < 3) types.push('heart');
    const type = types[Math.floor(Math.random() * types.length)];
    const icons: { [k: string]: string } = {
      shield: '🛡️',
      speed: '⚡',
      freeze: '❄️',
      heart: '❤️',
    };

    powerUpsRef.current.push({
      id: nextEntityId.current++,
      x,
      y,
      type,
      icon: icons[type],
      duration: 9000,
    });
  }, [lives]);

  // Add floating text feedback
  const addFloatingText = (text: string, x: number, y: number, color = '#fbbf24') => {
    floatingTextsRef.current.push({
      id: nextEntityId.current++,
      text,
      x,
      y,
      color,
      opacity: 1,
      scale: 1,
    });
  };

  // Start / Reset Game
  const startGame = useCallback(() => {
    playerRef.current = {
      x: ARENA_WIDTH / 2,
      y: ARENA_HEIGHT / 2,
      vx: 0,
      vy: 0,
      baseSpeed: 5.5,
      iframe: 0,
    };
    bombsRef.current = [];
    chipsRef.current = [];
    powerUpsRef.current = [];
    floatingTextsRef.current = [];

    // Seed initial chips
    for (let i = 0; i < 4; i++) {
      spawnChip();
    }

    setScore(0);
    setLives(3);
    setLevel(1);
    setChipsCollected(0);
    setBombsDodged(0);
    setElapsedTime(0);
    setHasShield(false);
    setSpeedBoostTimer(0);
    setFreezeTimer(0);

    bombSpawnTimerRef.current = 1400;
    powerUpSpawnTimerRef.current = 10000;
    setGameState('playing');
  }, [spawnChip]);

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main Canvas & Game Loop
  useEffect(() => {
    if (gameState !== 'playing') {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      return;
    }

    let currentLives = 3;
    let currentScore = 0;
    let currentLevel = 1;
    let currentChips = 0;
    let currentDodged = 0;
    let currentFreeze = 0;
    let currentSpeedBoost = 0;
    let currentShield = false;

    lastTimeRef.current = performance.now();

    const loop = (timestamp: number) => {
      const dt = Math.min(timestamp - lastTimeRef.current, 50); // cap delta
      lastTimeRef.current = timestamp;

      setElapsedTime((prev) => prev + dt / 1000);

      // 1. Update timers
      if (currentFreeze > 0) {
        currentFreeze = Math.max(0, currentFreeze - dt);
        setFreezeTimer(Math.ceil(currentFreeze / 1000));
      }
      if (currentSpeedBoost > 0) {
        currentSpeedBoost = Math.max(0, currentSpeedBoost - dt);
        setSpeedBoostTimer(Math.ceil(currentSpeedBoost / 1000));
      }

      // 2. Update player position
      const keys = keysPressed.current;
      const speedMultiplier = currentSpeedBoost > 0 ? 1.55 : 1;
      const moveSpeed = playerRef.current.baseSpeed * speedMultiplier;

      let dx = 0;
      let dy = 0;
      if (keys['ArrowUp'] || keys['w'] || keys['W']) dy -= 1;
      if (keys['ArrowDown'] || keys['s'] || keys['S']) dy += 1;
      if (keys['ArrowLeft'] || keys['a'] || keys['A']) dx -= 1;
      if (keys['ArrowRight'] || keys['d'] || keys['D']) dx += 1;

      if (dx !== 0 && dy !== 0) {
        const factor = 1 / Math.SQRT2;
        dx *= factor;
        dy *= factor;
      }

      playerRef.current.x = Math.max(PLAYER_SIZE, Math.min(ARENA_WIDTH - PLAYER_SIZE, playerRef.current.x + dx * moveSpeed));
      playerRef.current.y = Math.max(PLAYER_SIZE, Math.min(ARENA_HEIGHT - PLAYER_SIZE, playerRef.current.y + dy * moveSpeed));

      // Iframe countdown
      if (playerRef.current.iframe > 0) {
        playerRef.current.iframe = Math.max(0, playerRef.current.iframe - dt);
      }

      // 3. Bomb Spawner
      bombSpawnTimerRef.current -= dt;
      if (bombSpawnTimerRef.current <= 0) {
        spawnBomb(currentLevel);
        // Scaling bomb frequency
        const nextDelay = Math.max(650, 1600 - currentLevel * 80 + Math.random() * 200);
        bombSpawnTimerRef.current = nextDelay;
      }

      // 4. Power-up Spawner
      powerUpSpawnTimerRef.current -= dt;
      if (powerUpSpawnTimerRef.current <= 0) {
        spawnPowerUp();
        powerUpSpawnTimerRef.current = 13000 + Math.random() * 5000;
      }

      // 5. Update Bombs
      const remainingBombs: Bomb[] = [];
      for (const bomb of bombsRef.current) {
        if (bomb.state === 'ticking') {
          if (currentFreeze <= 0) {
            bomb.fuseRemaining -= dt;
          }
          // Ticking sound when close to detonation
          if (bomb.fuseRemaining <= 350 && bomb.fuseRemaining > 0 && Math.random() < 0.1) {
            playSfxTone(880, 0.04, 'triangle');
          }

          if (bomb.fuseRemaining <= 0) {
            // Detonate!
            bomb.state = 'exploding';
            playExplosionSound();

            // Check if player is inside blast radius
            const dist = Math.hypot(playerRef.current.x - bomb.x, playerRef.current.y - bomb.y);
            if (dist <= bomb.radius + PLAYER_SIZE / 2) {
              if (playerRef.current.iframe <= 0) {
                if (currentShield) {
                  // Shield absorbs damage!
                  currentShield = false;
                  setHasShield(false);
                  playerRef.current.iframe = 1000;
                  addFloatingText('🛡️ SHIELD BROKEN!', playerRef.current.x, playerRef.current.y - 20, '#38bdf8');
                  sfxWrong();
                } else {
                  // Take damage
                  currentLives -= 1;
                  setLives(currentLives);
                  playerRef.current.iframe = 1500;
                  sfxWrong();
                  addFloatingText('💥 HIT! -1 LIFE', playerRef.current.x, playerRef.current.y - 20, '#ef4444');

                  if (currentLives <= 0) {
                    setGameState('gameover');
                    return;
                  }
                }
              }
            } else {
              // Successfully dodged
              currentDodged += 1;
              setBombsDodged(currentDodged);
              currentScore += 25;
              setScore(currentScore);
            }
          }
          remainingBombs.push(bomb);
        } else if (bomb.state === 'exploding') {
          bomb.explodeElapsed += dt;
          if (bomb.explodeElapsed < bomb.explodeDuration) {
            remainingBombs.push(bomb);
          }
        }
      }
      bombsRef.current = remainingBombs;

      // 6. Check Chip Collection
      const remainingChips: ChipItem[] = [];
      for (const chip of chipsRef.current) {
        const dist = Math.hypot(playerRef.current.x - chip.x, playerRef.current.y - chip.y);
        if (dist <= PLAYER_SIZE + 18) {
          // Collected!
          sfxCoin();
          currentChips += 1;
          setChipsCollected(currentChips);
          const pts = chip.points;
          currentScore += pts;
          setScore(currentScore);
          addFloatingText(`+${pts}`, chip.x, chip.y - 10, '#fbbf24');

          // Level up every 6 chips
          if (currentChips % 6 === 0) {
            currentLevel += 1;
            setLevel(currentLevel);
            sfxCorrect();
            addFloatingText(`LEVEL UP! LV.${currentLevel}`, ARENA_WIDTH / 2, ARENA_HEIGHT / 2, '#a855f7');
          }
        } else {
          remainingChips.push(chip);
        }
      }
      chipsRef.current = remainingChips;

      // Respawn chips if low
      while (chipsRef.current.length < 3) {
        spawnChip();
      }

      // 7. Check Power-up Collection
      const remainingPowerUps: PowerUp[] = [];
      for (const pu of powerUpsRef.current) {
        pu.duration -= dt;
        const dist = Math.hypot(playerRef.current.x - pu.x, playerRef.current.y - pu.y);
        if (dist <= PLAYER_SIZE + 20) {
          sfxCorrect();
          if (pu.type === 'shield') {
            currentShield = true;
            setHasShield(true);
            addFloatingText('🛡️ SHIELD ACQUIRED!', playerRef.current.x, playerRef.current.y - 20, '#38bdf8');
          } else if (pu.type === 'speed') {
            currentSpeedBoost = 6000;
            setSpeedBoostTimer(6);
            addFloatingText('⚡ SPEED BOOST!', playerRef.current.x, playerRef.current.y - 20, '#fbbf24');
          } else if (pu.type === 'freeze') {
            currentFreeze = 4000;
            setFreezeTimer(4);
            addFloatingText('❄️ EMP TIME FREEZE!', playerRef.current.x, playerRef.current.y - 20, '#c084fc');
          } else if (pu.type === 'heart') {
            if (currentLives < 3) {
              currentLives = Math.min(3, currentLives + 1);
              setLives(currentLives);
              addFloatingText('❤️ LIFE RESTORED!', playerRef.current.x, playerRef.current.y - 20, '#f43f5e');
            }
          }
        } else if (pu.duration > 0) {
          remainingPowerUps.push(pu);
        }
      }
      powerUpsRef.current = remainingPowerUps;

      // 8. Update Floating Texts
      const remainingTexts: FloatingText[] = [];
      for (const ft of floatingTextsRef.current) {
        ft.y -= 0.8;
        ft.opacity -= 0.02;
        if (ft.opacity > 0) {
          remainingTexts.push(ft);
        }
      }
      floatingTextsRef.current = remainingTexts;

      // 9. Render Canvas
      renderCanvas();

      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, spawnBomb, spawnChip, spawnPowerUp, playExplosionSound, playSfxTone]);

  // Handle game over hook registration
  useEffect(() => {
    if (gameState === 'gameover' && score > 0) {
      void recordGame(score);
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem('kj_bomb_collector_best', String(score));
      }
    }
  }, [gameState, score, highScore, recordGame]);

  // Canvas drawing function
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear background
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

    // Draw Cyber Grid Lines
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x <= ARENA_WIDTH; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, ARENA_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= ARENA_HEIGHT; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(ARENA_WIDTH, y);
      ctx.stroke();
    }

    // Draw Arena Border Glow
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, ARENA_WIDTH - 4, ARENA_HEIGHT - 4);

    // 1. Draw Bombs
    for (const bomb of bombsRef.current) {
      if (bomb.state === 'ticking') {
        const progress = 1 - bomb.fuseRemaining / bomb.totalFuse;

        // Warning Radius Circle Fill
        ctx.fillStyle = `rgba(239, 68, 68, ${0.12 + progress * 0.18})`;
        ctx.beginPath();
        ctx.arc(bomb.x, bomb.y, bomb.radius, 0, Math.PI * 2);
        ctx.fill();

        // Warning Outer Ring (Pulsing)
        ctx.strokeStyle = progress > 0.7 ? '#ef4444' : 'rgba(239, 68, 68, 0.6)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.arc(bomb.x, bomb.y, bomb.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Depleting Countdown Ring
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(
          bomb.x,
          bomb.y,
          24,
          -Math.PI / 2,
          -Math.PI / 2 + Math.PI * 2 * (1 - progress),
          false,
        );
        ctx.stroke();

        // Bomb Core Icon
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💣', bomb.x, bomb.y);

        // Countdown Text
        const secs = (bomb.fuseRemaining / 1000).toFixed(1);
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 12px Kanit, sans-serif';
        ctx.fillText(`${secs}s`, bomb.x, bomb.y + 36);
      } else if (bomb.state === 'exploding') {
        // Explosion shockwave
        const blastRatio = bomb.explodeElapsed / bomb.explodeDuration;
        const currentRadius = bomb.radius * (0.6 + 0.5 * blastRatio);
        const alpha = Math.max(0, 1 - blastRatio);

        const grad = ctx.createRadialGradient(
          bomb.x,
          bomb.y,
          10,
          bomb.x,
          bomb.y,
          currentRadius,
        );
        grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        grad.addColorStop(0.3, `rgba(251, 191, 36, ${alpha * 0.9})`);
        grad.addColorStop(0.7, `rgba(239, 68, 68, ${alpha * 0.8})`);
        grad.addColorStop(1, `rgba(239, 68, 68, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(bomb.x, bomb.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();

        // Fiery center
        ctx.font = `${26 + blastRatio * 10}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💥', bomb.x, bomb.y);
      }
    }

    // 2. Draw Collectible Data Chips
    for (const chip of chipsRef.current) {
      // Glow circle
      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.beginPath();
      ctx.arc(chip.x, chip.y, 20, 0, Math.PI * 2);
      ctx.fill();

      // Emoji icon
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const icon = chip.type === 'core' ? '🔋' : chip.type === 'gem' ? '💎' : '💾';
      ctx.fillText(icon, chip.x, chip.y);
    }

    // 3. Draw Power-Ups
    for (const pu of powerUpsRef.current) {
      // Pulsing circle
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pu.x, pu.y, 22, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(168, 85, 247, 0.2)';
      ctx.beginPath();
      ctx.arc(pu.x, pu.y, 20, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pu.icon, pu.x, pu.y);
    }

    // 4. Draw Player Character
    const p = playerRef.current;
    const isFlashing = p.iframe > 0 && Math.floor(p.iframe / 100) % 2 === 0;

    if (!isFlashing) {
      // Shield aura
      if (hasShield) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, PLAYER_SIZE + 8, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, PLAYER_SIZE + 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Speed aura
      if (speedBoostTimer > 0) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(p.x, p.y, PLAYER_SIZE + 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Player body
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🤖', p.x, p.y);
    }

    // 5. Draw Floating Texts
    for (const ft of floatingTextsRef.current) {
      ctx.save();
      ctx.font = 'bold 15px Kanit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = ft.opacity;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  };

  // Virtual directional button handlers for mobile
  const handleVirtualDir = (dir: 'up' | 'down' | 'left' | 'right', pressed: boolean) => {
    const keyMap = {
      up: 'ArrowUp',
      down: 'ArrowDown',
      left: 'ArrowLeft',
      right: 'ArrowRight',
    };
    keysPressed.current[keyMap[dir]] = pressed;
  };

  return (
    <div className="bomb-collector-container">
      {/* Educational Learning Card */}
      <GameLearnCard gameKey="bomb-collector" />

      {/* Header */}
      <div className="bc-header">
        <Link to="/games" className="bc-back-btn">
          <ChevronLeft size={18} />
          <span>เกมทั้งหมด</span>
        </Link>
        <div className="bc-title-wrap">
          <h1 className="bc-title">💣 Bomb Collector Pro</h1>
          <p className="bc-subtitle">เก็บชิปข้อมูล & หลบหลีกโซนระเบิดกลยุทธ์</p>
        </div>
        <div style={{ width: 80 }} />
      </div>

      {/* HUD Bar */}
      <div className="bc-hud">
        <div className="bc-hud-card">
          <span className="bc-hud-label">พลังชีวิต</span>
          <div className="bc-hud-val danger" style={{ display: 'flex', gap: '3px' }}>
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

        <div className="bc-hud-card">
          <span className="bc-hud-label">คะแนนรวม</span>
          <span className="bc-hud-val gold">{score.toLocaleString()}</span>
        </div>

        <div className="bc-hud-card">
          <span className="bc-hud-label">ระดับความยาก</span>
          <span className="bc-hud-val cyan">Lv. {level}</span>
        </div>

        <div className="bc-hud-card">
          <span className="bc-hud-label">ชิปที่เก็บได้</span>
          <span className="bc-hud-val">{chipsCollected}</span>
        </div>
      </div>

      {/* Arena Canvas Wrapper */}
      <div className="bc-canvas-wrap">
        <canvas
          ref={canvasRef}
          width={ARENA_WIDTH}
          height={ARENA_HEIGHT}
          className="bc-canvas"
        />

        {/* Active Buffs Overlay */}
        <div className="bc-active-buffs">
          {hasShield && (
            <div className="bc-buff-pill shield">
              <Shield size={14} /> โล่ป้องกัน
            </div>
          )}
          {speedBoostTimer > 0 && (
            <div className="bc-buff-pill speed">
              <Zap size={14} /> ความเร็ว x1.5 ({speedBoostTimer}s)
            </div>
          )}
          {freezeTimer > 0 && (
            <div className="bc-buff-pill freeze">
              <Snowflake size={14} /> แช่แข็งระเบิด ({freezeTimer}s)
            </div>
          )}
        </div>

        {/* Start Screen Overlay */}
        {gameState === 'idle' && (
          <div className="bc-overlay">
            <div className="bc-overlay-icon">🤖</div>
            <h2 className="bc-overlay-title start">ภารกิจกู้ข้อมูลความเร็วสูง</h2>
            <p className="bc-overlay-desc">
              เคลื่อนที่เพื่อสะสม 💾 Data Chips และหลบหนีรัศมีระเบิดสีแดง 💣 
              ที่จะระเบิดภายใน 1.2 วินาที! ระวัง ยิ่งเล่น ระเบิดจะยิ่งเยอะและไวขึ้น!
            </p>
            <div className="bc-btn-group">
              <button
                type="button"
                className="bc-btn-primary"
                onClick={startGame}
              >
                <Play size={20} fill="#fff" />
                <span>เริ่มเล่นเกม</span>
              </button>
            </div>
          </div>
        )}

        {/* Game Over Screen Overlay */}
        {gameState === 'gameover' && (
          <div className="bc-overlay">
            <div className="bc-overlay-icon">💥</div>
            <h2 className="bc-overlay-title over">จบภารกิจ (Game Over)</h2>
            <p className="bc-overlay-desc">
              ระบบได้รับความเสียหายจากคลื่นระเบิด! สรุปผลงานการเก็บข้อมูล:
            </p>

            <div className="bc-results-grid">
              <div className="bc-result-item">
                <div className="bc-result-key">คะแนนสุทธิ</div>
                <div className="bc-result-val" style={{ color: '#fbbf24' }}>
                  {score.toLocaleString()}
                </div>
              </div>
              <div className="bc-result-item">
                <div className="bc-result-key">เวลาที่รอด</div>
                <div className="bc-result-val">
                  {Math.floor(elapsedTime)} วินาที
                </div>
              </div>
              <div className="bc-result-item">
                <div className="bc-result-key">ชิปที่กู้ได้</div>
                <div className="bc-result-val">{chipsCollected} ชิ้น</div>
              </div>
              <div className="bc-result-item">
                <div className="bc-result-key">ระเบิดที่รอดมาได้</div>
                <div className="bc-result-val">{bombsDodged} ลูก</div>
              </div>
            </div>

            <div className="bc-btn-group">
              <button
                type="button"
                className="bc-btn-primary"
                onClick={startGame}
              >
                <RotateCcw size={18} />
                <span>เล่นใหม่อีกครั้ง</span>
              </button>
              <Link to="/games" className="bc-btn-secondary">
                <Trophy size={18} />
                <span>เลือกเกมอื่น</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Virtual D-Pad for Mobile */}
      <div className="bc-touch-controls">
        <button
          type="button"
          className="bc-dpad-btn bc-dpad-up"
          onMouseDown={() => handleVirtualDir('up', true)}
          onMouseUp={() => handleVirtualDir('up', false)}
          onTouchStart={(e) => { e.preventDefault(); handleVirtualDir('up', true); }}
          onTouchEnd={(e) => { e.preventDefault(); handleVirtualDir('up', false); }}
          aria-label="Move Up"
        >
          <ArrowUp size={24} />
        </button>
        <button
          type="button"
          className="bc-dpad-btn bc-dpad-left"
          onMouseDown={() => handleVirtualDir('left', true)}
          onMouseUp={() => handleVirtualDir('left', false)}
          onTouchStart={(e) => { e.preventDefault(); handleVirtualDir('left', true); }}
          onTouchEnd={(e) => { e.preventDefault(); handleVirtualDir('left', false); }}
          aria-label="Move Left"
        >
          <ArrowLeft size={24} />
        </button>
        <button
          type="button"
          className="bc-dpad-btn bc-dpad-right"
          onMouseDown={() => handleVirtualDir('right', true)}
          onMouseUp={() => handleVirtualDir('right', false)}
          onTouchStart={(e) => { e.preventDefault(); handleVirtualDir('right', true); }}
          onTouchEnd={(e) => { e.preventDefault(); handleVirtualDir('right', false); }}
          aria-label="Move Right"
        >
          <ArrowRight size={24} />
        </button>
        <button
          type="button"
          className="bc-dpad-btn bc-dpad-down"
          onMouseDown={() => handleVirtualDir('down', true)}
          onMouseUp={() => handleVirtualDir('down', false)}
          onTouchStart={(e) => { e.preventDefault(); handleVirtualDir('down', true); }}
          onTouchEnd={(e) => { e.preventDefault(); handleVirtualDir('down', false); }}
          aria-label="Move Down"
        >
          <ArrowDown size={24} />
        </button>
      </div>

      {/* Instructions */}
      <div className="bc-instructions">
        <span>คีย์บอร์ด: <kbd className="bc-kbd">W</kbd><kbd className="bc-kbd">A</kbd><kbd className="bc-kbd">S</kbd><kbd className="bc-kbd">D</kbd> หรือ <kbd className="bc-kbd">ปุ่มลูกศร</kbd></span>
        <span>มือถือ: แตะปุ่มลูกศรจำลองบนหน้าจอ</span>
      </div>
    </div>
  );
};

export default BombCollectorGame;
