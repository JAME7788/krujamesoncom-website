import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  ChevronLeft,
  RotateCcw,
  Play,
  FastForward,
  Trophy,
  Server,
  Coins,
  HelpCircle,
  ArrowUpCircle,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { useGameProgress } from '../../hooks/useGameProgress';
import {
  MISSION_LEVELS,
  TOWER_CONFIGS,
  THREAT_CONFIGS,
  type TowerType,
  type ThreatType,
  type MissionLevel,
} from './cyberShieldData';
import { sfxCoin, sfxCorrect, sfxWrong } from '../../utils/gameSounds';
import { playGameTone } from '../../utils/gameAudio';
import './GameStyles.css';
import './CyberShieldGame.css';

// Singleton Web Audio sound synthesizer for laser and alarms (zero AudioContext leak)
const playLaserSound = (freq = 880) => {
  playGameTone(freq, 0.12, 'sawtooth', 0.08, 120);
};

const playAlarmSound = () => {
  playGameTone(440, 0.16, 'square', 0.09, 330);
};

interface ActiveThreat {
  id: string;
  type: ThreatType;
  hp: number;
  maxHp: number;
  pathProgress: number; // 0.0 to 1.0 along the waypoints
  isSlowed: boolean;
  slowTimer: number;
  x: number;
  y: number;
}

interface DeployedTower {
  nodeIndex: number;
  type: TowerType;
  level: number;
  lastShotTime: number;
}

interface LaserEffect {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
  expiresAt: number;
}

const CyberShieldGame: React.FC = () => {
  const recordProgress = useGameProgress('cyber-shield', 'Cyber Shield: ป้อมปราการไซเบอร์');

  // Level & Game State
  const [levelIndex, setLevelIndex] = useState(0);
  const currentMission: MissionLevel = MISSION_LEVELS[levelIndex] || MISSION_LEVELS[0];

  const [serverHp, setServerHp] = useState(100);
  const [bandwidth, setBandwidth] = useState(currentMission.initialBandwidth);
  const [score, setScore] = useState(0);
  const [gameSpeed, setGameSpeed] = useState<1 | 2>(1);

  const [waveIndex, setWaveIndex] = useState(0);
  const [waveActive, setWaveActive] = useState(false);

  // Tower Selection & Deployment
  const [selectedTowerDeck, setSelectedTowerDeck] = useState<TowerType>('firewall');
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number | null>(null);
  const [towers, setTowers] = useState<Map<number, DeployedTower>>(new Map());

  // Threats & Visual FX
  const [threats, setThreats] = useState<ActiveThreat[]>([]);
  const [lasers, setLasers] = useState<LaserEffect[]>([]);

  // Modals
  const [briefingOpen, setBriefingOpen] = useState(true);
  const [briefingAnswered, setBriefingAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [missionWon, setMissionWon] = useState(false);
  const [missionLost, setMissionLost] = useState(false);

  // Authoritative simulation refs (prevents StrictMode double-damage, missing lasers & stale HP checks)
  const spawnQueueRef = useRef<Array<{ type: ThreatType; delay: number }>>([]);
  const waveElapsedRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const reqAnimationRef = useRef<number | null>(null);
  const threatsRef = useRef<ActiveThreat[]>([]);
  const towersRef = useRef<Map<number, DeployedTower>>(new Map());
  const lasersRef = useRef<LaserEffect[]>([]);
  const serverHpRef = useRef<number>(100);
  const scoreRef = useRef<number>(0);

  // Calculate coordinates along multi-point path
  const getPositionOnPath = useCallback((progress: number, points: Array<{ x: number; y: number }>) => {
    if (points.length < 2) return { x: 0, y: 0 };
    const clamped = Math.max(0, Math.min(1, progress));

    // Calculate total path distance
    const segmentDistances: number[] = [];
    let totalDist = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const dx = points[i + 1].x - points[i].x;
      const dy = points[i + 1].y - points[i].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      segmentDistances.push(dist);
      totalDist += dist;
    }

    const targetDist = clamped * totalDist;
    let accumulated = 0;
    for (let i = 0; i < segmentDistances.length; i++) {
      const segDist = segmentDistances[i];
      if (accumulated + segDist >= targetDist || i === segmentDistances.length - 1) {
        const remaining = targetDist - accumulated;
        const ratio = segDist === 0 ? 0 : Math.max(0, Math.min(1, remaining / segDist));
        return {
          x: points[i].x + (points[i + 1].x - points[i].x) * ratio,
          y: points[i].y + (points[i + 1].y - points[i].y) * ratio,
        };
      }
      accumulated += segDist;
    }
    return points[points.length - 1];
  }, []);

  // Reset/Initialize Level
  const initLevel = useCallback((lvlIdx: number) => {
    const lvl = MISSION_LEVELS[lvlIdx] || MISSION_LEVELS[0];
    serverHpRef.current = 100;
    scoreRef.current = 0;
    towersRef.current = new Map();
    threatsRef.current = [];
    lasersRef.current = [];
    spawnQueueRef.current = [];
    waveElapsedRef.current = 0;
    lastFrameTimeRef.current = 0;
    setLevelIndex(lvlIdx);
    setServerHp(100);
    setScore(0);
    setBandwidth(lvl.initialBandwidth);
    setWaveIndex(0);
    setWaveActive(false);
    setTowers(new Map());
    setThreats([]);
    setLasers([]);
    setSelectedNodeIndex(null);
    setMissionWon(false);
    setMissionLost(false);
    setBriefingOpen(true);
    setBriefingAnswered(false);
    setSelectedOption(null);
  }, []);

  // Start Level Briefing Answer
  const handleAnswerBriefing = (optionIdx: number) => {
    if (briefingAnswered) return;
    setSelectedOption(optionIdx);
    setBriefingAnswered(true);
    if (optionIdx === currentMission.briefing.correctIndex) {
      sfxCorrect();
      setBandwidth((prev) => prev + currentMission.briefing.bonusBandwidth);
    } else {
      sfxWrong();
    }
  };

  const handleCloseBriefing = () => {
    setBriefingOpen(false);
  };

  // Start Next Wave
  const handleStartWave = () => {
    if (waveActive || missionWon || missionLost || waveIndex >= currentMission.waves.length) return;
    const wave = currentMission.waves[waveIndex];
    if (!wave) return;

    // Build cumulative spawn schedule (matched against waveElapsedRef, never reset per spawn)
    const queue: Array<{ type: ThreatType; delay: number }> = [];
    let currentDelay = 0.5;
    wave.threats.forEach((group) => {
      for (let i = 0; i < group.count; i++) {
        queue.push({ type: group.type, delay: currentDelay });
        currentDelay += group.intervalSeconds;
      }
    });

    spawnQueueRef.current = queue;
    waveElapsedRef.current = 0;
    lastFrameTimeRef.current = 0;
    setWaveActive(true);
  };

  // Deploy or Upgrade Tower
  const handleNodeClick = (nodeIdx: number) => {
    setSelectedNodeIndex(nodeIdx);
    const existing = towersRef.current.get(nodeIdx);

    // If empty node, place selected tower if enough bandwidth
    if (!existing) {
      const cfg = TOWER_CONFIGS[selectedTowerDeck];
      if (bandwidth >= cfg.cost) {
        setBandwidth((prev) => prev - cfg.cost);
        sfxCoin();
        const next = new Map(towersRef.current);
        next.set(nodeIdx, {
          nodeIndex: nodeIdx,
          type: selectedTowerDeck,
          level: 1,
          lastShotTime: 0,
        });
        towersRef.current = next;
        setTowers(next);
      }
    }
  };

  const handleUpgradeTower = (nodeIdx: number) => {
    const current = towersRef.current.get(nodeIdx);
    if (!current || current.level >= 3) return;
    const cfg = TOWER_CONFIGS[current.type];
    const cost = cfg.upgradeCost * current.level;
    if (bandwidth >= cost) {
      setBandwidth((prev) => prev - cost);
      sfxCoin();
      const next = new Map(towersRef.current);
      next.set(nodeIdx, { ...current, level: current.level + 1 });
      towersRef.current = next;
      setTowers(next);
    }
  };

  const handleSellTower = (nodeIdx: number) => {
    const current = towersRef.current.get(nodeIdx);
    if (!current) return;
    const cfg = TOWER_CONFIGS[current.type];
    const refund = Math.floor(cfg.cost * 0.7);
    setBandwidth((prev) => prev + refund);
    sfxCoin();
    const next = new Map(towersRef.current);
    next.delete(nodeIdx);
    towersRef.current = next;
    setTowers(next);
    setSelectedNodeIndex(null);
  };

  // Main Game Loop (Physics, Combat, Pathing) — active only during live waves
  useEffect(() => {
    if (!waveActive || briefingOpen || missionWon || missionLost) {
      if (reqAnimationRef.current) {
        cancelAnimationFrame(reqAnimationRef.current);
        reqAnimationRef.current = null;
      }
      lastFrameTimeRef.current = 0;
      return;
    }

    const loop = (time: number) => {
      const rawDeltaSec = lastFrameTimeRef.current === 0
        ? 0
        : Math.max(0, Math.min(0.1, (time - lastFrameTimeRef.current) / 1000));
      lastFrameTimeRef.current = time;
      const deltaSec = rawDeltaSec * gameSpeed;
      waveElapsedRef.current += deltaSec;

      // 1. Spawning from cumulative schedule
      const currentThreats = threatsRef.current.slice();
      while (spawnQueueRef.current.length > 0 && waveElapsedRef.current >= spawnQueueRef.current[0].delay) {
        const nextInQueue = spawnQueueRef.current.shift()!;
        const conf = THREAT_CONFIGS[nextInQueue.type];
        const startPt = currentMission.pathPoints[0];
        currentThreats.push({
          id: `${nextInQueue.type}-${Date.now()}-${Math.random()}`,
          type: nextInQueue.type,
          hp: conf.maxHp,
          maxHp: conf.maxHp,
          pathProgress: 0,
          isSlowed: false,
          slowTimer: 0,
          x: startPt.x,
          y: startPt.y,
        });
      }

      // 2. Move Threats along path & Check Server Reach
      const movedThreats: ActiveThreat[] = [];
      let serverHitDamage = 0;

      for (const t of currentThreats) {
        const conf = THREAT_CONFIGS[t.type];
        const currentSpeed = t.isSlowed ? conf.speed * 0.6 : conf.speed;
        const pathStep = (currentSpeed * deltaSec) / 900;
        const nextProgress = t.pathProgress + pathStep;

        if (nextProgress >= 1.0) {
          serverHitDamage += conf.serverDamage;
        } else {
          const pos = getPositionOnPath(nextProgress, currentMission.pathPoints);
          const slowTimer = Math.max(0, t.slowTimer - deltaSec);
          movedThreats.push({
            ...t,
            pathProgress: nextProgress,
            x: pos.x,
            y: pos.y,
            slowTimer,
            isSlowed: slowTimer > 0,
          });
        }
      }

      if (serverHitDamage > 0) {
        playAlarmSound();
        const nextHp = Math.max(0, serverHpRef.current - serverHitDamage);
        serverHpRef.current = nextHp;
        setServerHp(nextHp);
        if (nextHp <= 0) {
          threatsRef.current = movedThreats;
          lasersRef.current = [];
          setThreats(movedThreats);
          setLasers([]);
          setMissionLost(true);
          setWaveActive(false);
          return;
        }
      }

      // 3. Towers Target & Attack (synchronous simulation -> lasers render immediately)
      const newLasers: LaserEffect[] = [];
      let bonusHeal = 0;
      let bonusBw = 0;

      towersRef.current.forEach((tower, nodeIdx) => {
        const node = currentMission.mapNodes[nodeIdx];
        if (!node) return;
        const cfg = TOWER_CONFIGS[tower.type];
        const fireInterval = 1 / (cfg.fireRate * (1 + (tower.level - 1) * 0.3));
        const timeSinceShot = (time - tower.lastShotTime) / 1000;

        // Cloud Backup special action (only runs during active wave)
        if (tower.type === 'cloudbackup') {
          if (timeSinceShot >= 4.0 / gameSpeed) {
            bonusHeal += 10 * tower.level;
            bonusBw += 15 * tower.level;
            tower.lastShotTime = time;
            newLasers.push({
              id: `heal-${time.toFixed(1)}-${nodeIdx}`,
              fromX: node.x,
              fromY: node.y,
              toX: currentMission.pathPoints[currentMission.pathPoints.length - 1].x,
              toY: currentMission.pathPoints[currentMission.pathPoints.length - 1].y,
              color: '#0ea5e9',
              expiresAt: time + 300,
            });
          }
          return;
        }

        if (timeSinceShot < fireInterval / gameSpeed || movedThreats.length === 0) return;

        const effectiveRange = cfg.range * (1 + (tower.level - 1) * 0.2);
        const effectiveDamage = cfg.damage * (1 + (tower.level - 1) * 0.5);
        const canDetect = (t: ActiveThreat) => {
          const tConf = THREAT_CONFIGS[t.type];
          return !tConf.stealth || tower.type === 'twofa' || tower.level >= 3;
        };
        const calcDamage = (t: ActiveThreat) => {
          const tConf = THREAT_CONFIGS[t.type];
          return tConf.shield && tower.type !== 'twofa' ? effectiveDamage * 0.6 : effectiveDamage;
        };

        // AoE Tower (Encryption Gateway)
        if (tower.type === 'encryption') {
          let hitAny = false;
          for (const t of movedThreats) {
            if (t.hp <= 0 || !canDetect(t)) continue;
            if (Math.hypot(t.x - node.x, t.y - node.y) <= effectiveRange) {
              hitAny = true;
              t.hp -= calcDamage(t);
            }
          }
          if (hitAny) {
            tower.lastShotTime = time;
            playLaserSound(520);
            newLasers.push({
              id: `aoe-${time.toFixed(1)}-${nodeIdx}`,
              fromX: node.x,
              fromY: node.y,
              toX: node.x,
              toY: node.y,
              color: cfg.color,
              expiresAt: time + 250,
            });
          }
          return;
        }

        // Single Target Towers (Firewall, Antivirus, 2FA) — priority: furthest along path
        let target: ActiveThreat | null = null;
        for (const t of movedThreats) {
          if (t.hp <= 0 || !canDetect(t)) continue;
          if (Math.hypot(t.x - node.x, t.y - node.y) <= effectiveRange) {
            if (!target || t.pathProgress > target.pathProgress) {
              target = t;
            }
          }
        }
        if (!target) return;

        tower.lastShotTime = time;
        playLaserSound(tower.type === 'twofa' ? 1200 : 780);
        newLasers.push({
          id: `beam-${time.toFixed(1)}-${nodeIdx}`,
          fromX: node.x,
          fromY: node.y,
          toX: target.x,
          toY: target.y,
          color: cfg.color,
          expiresAt: time + 180,
        });
        target.hp -= calcDamage(target);
        if (tower.type === 'firewall') {
          target.isSlowed = true;
          target.slowTimer = 1.5;
        }
      });

      if (bonusHeal > 0) {
        serverHpRef.current = Math.min(100, serverHpRef.current + bonusHeal);
        setServerHp(serverHpRef.current);
      }

      // 4. Filter Dead Threats & Award Bounty
      const alive: ActiveThreat[] = [];
      let earnedBw = bonusBw;
      let earnedPts = 0;

      for (const t of movedThreats) {
        if (t.hp <= 0) {
          const conf = THREAT_CONFIGS[t.type];
          earnedBw += conf.reward;
          earnedPts += conf.reward * 10;
        } else {
          alive.push(t);
        }
      }

      if (earnedBw > 0) {
        if (earnedPts > 0) sfxCoin();
        setBandwidth((bw) => bw + earnedBw);
      }
      if (earnedPts > 0) {
        scoreRef.current += earnedPts;
        setScore(scoreRef.current);
      }

      threatsRef.current = alive;
      setThreats(alive);

      // 5. Merge new lasers & drop expired visual lasers
      const activeLasers = lasersRef.current.filter((l) => l.expiresAt > time);
      if (newLasers.length > 0) activeLasers.push(...newLasers);
      lasersRef.current = activeLasers;
      setLasers(activeLasers);

      // 6. Check wave completion (only when server is alive)
      if (
        serverHpRef.current > 0 &&
        spawnQueueRef.current.length === 0 &&
        alive.length === 0
      ) {
        setWaveActive(false);
        const nextWave = waveIndex + 1;
        if (nextWave >= currentMission.waves.length) {
          sfxCorrect();
          const finalScore = scoreRef.current + 1000;
          scoreRef.current = finalScore;
          setScore(finalScore);
          setMissionWon(true);
          void recordProgress(finalScore, `level-${currentMission.id}`);
        } else {
          setWaveIndex(nextWave);
          setBandwidth((bw) => bw + 60);
        }
        return;
      }

      reqAnimationRef.current = requestAnimationFrame(loop);
    };

    reqAnimationRef.current = requestAnimationFrame(loop);
    return () => {
      if (reqAnimationRef.current) {
        cancelAnimationFrame(reqAnimationRef.current);
        reqAnimationRef.current = null;
      }
    };
  }, [
    waveActive,
    briefingOpen,
    missionWon,
    missionLost,
    gameSpeed,
    currentMission,
    getPositionOnPath,
    waveIndex,
    recordProgress,
  ]);

  const selectedNodeTower = selectedNodeIndex !== null ? towers.get(selectedNodeIndex) : null;

  return (
    <div className="cyber-shield-wrap">
      <div className="cyber-shield-container">
        {/* Top Bar Navigation & Stats */}
        <header className="cyber-top-nav">
          <div className="cyber-nav-left">
            <Link to="/games" className="cyber-back-btn">
              <ChevronLeft size={18} /> ออกจากเกม
            </Link>
            <div className="cyber-mission-info">
              <h1>
                <Shield className="text-teal-400" size={22} /> {currentMission.title}
              </h1>
              <p>📍 {currentMission.location} • {currentMission.targetUnit}</p>
            </div>
          </div>

          <div className="cyber-stats-bar">
            {/* Bandwidth Coins */}
            <div className="cyber-stat-pill bandwidth" title="เหรียญแบนด์วิดท์สำหรับติดตั้งและอัปเกรดป้อม">
              <Coins size={18} className="text-amber-400" />
              <div>
                <div className="cyber-stat-label">แบนด์วิดท์</div>
                <div className="cyber-stat-val text-amber-300">{bandwidth}</div>
              </div>
            </div>

            {/* Server Integrity Health */}
            <div className="cyber-stat-pill server-health" title="ความสมบูรณ์ของเซิร์ฟเวอร์โรงเรียน">
              <Server size={18} className={serverHp > 40 ? 'text-emerald-400' : 'text-rose-400'} />
              <div>
                <div className="cyber-stat-label">ความสมบูรณ์</div>
                <div className="cyber-stat-val">{serverHp}%</div>
              </div>
            </div>

            {/* Wave Counter */}
            <div className="cyber-stat-pill">
              <Sparkles size={16} className="text-sky-400" />
              <div>
                <div className="cyber-stat-label">เวฟ</div>
                <div className="cyber-stat-val">
                  {waveIndex + 1} / {currentMission.waves.length}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Battlefield Network Map */}
        <div className="cyber-battlefield-wrap">
          <div className="cyber-grid-overlay" />

          <svg className="cyber-svg-stage" viewBox="0 0 700 450" preserveAspectRatio="none">
            {/* Network Cable Background */}
            <path
              d={`M ${currentMission.pathPoints.map((p) => `${p.x},${p.y}`).join(' L ')}`}
              className="network-cable-bg"
            />
            {/* Network Cable Core Glow */}
            <path
              d={`M ${currentMission.pathPoints.map((p) => `${p.x},${p.y}`).join(' L ')}`}
              className="network-cable-core"
            />
            {/* Network Data Pulse */}
            <path
              d={`M ${currentMission.pathPoints.map((p) => `${p.x},${p.y}`).join(' L ')}`}
              className="network-pulse"
            />

            {/* Laser & Beam Visual FX */}
            {lasers.map((beam) => {
              if (beam.fromX === beam.toX && beam.fromY === beam.toY) {
                // AoE Pulse Circle
                return (
                  <circle
                    key={beam.id}
                    cx={beam.fromX}
                    cy={beam.fromY}
                    r={75}
                    fill={beam.color}
                    fillOpacity={0.2}
                    stroke={beam.color}
                    strokeWidth={2}
                    className="animate-ping"
                  />
                );
              }
              return (
                <line
                  key={beam.id}
                  x1={beam.fromX}
                  y1={beam.fromY}
                  x2={beam.toX}
                  y2={beam.toY}
                  stroke={beam.color}
                  strokeWidth={3.5}
                  strokeLinecap="round"
                  filter={`drop-shadow(0 0 6px ${beam.color})`}
                />
              );
            })}

            {/* Node Sockets for Towers */}
            {currentMission.mapNodes.map((node, idx) => {
              const deployed = towers.get(idx);
              const isSelected = selectedNodeIndex === idx;
              const cfg = deployed ? TOWER_CONFIGS[deployed.type] : null;

              return (
                <g
                  key={`node-${idx}`}
                  className="cyber-node-socket"
                  onClick={() => handleNodeClick(idx)}
                >
                  {/* Range indicator if selected */}
                  {isSelected && cfg && deployed && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={cfg.range * (1 + (deployed.level - 1) * 0.2)}
                      fill={cfg.color}
                      fillOpacity={0.12}
                      stroke={cfg.color}
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                    />
                  )}

                  {/* Socket Base */}
                  <circle
                    className="socket-base"
                    cx={node.x}
                    cy={node.y}
                    r={24}
                    fill={deployed ? 'rgba(15, 23, 42, 0.9)' : 'rgba(30, 41, 59, 0.5)'}
                    stroke={isSelected ? '#38bdf8' : deployed ? cfg?.color : 'rgba(56, 189, 248, 0.4)'}
                    strokeWidth={isSelected ? 3 : 1.8}
                  />

                  {/* Tower Icon or Add Icon */}
                  {deployed ? (
                    <>
                      <text
                        x={node.x}
                        y={node.y + 6}
                        textAnchor="middle"
                        fontSize={20}
                        style={{ userSelect: 'none' }}
                      >
                        {cfg?.emoji}
                      </text>
                      {/* Level Badge */}
                      <circle
                        cx={node.x + 14}
                        cy={node.y - 14}
                        r={8}
                        fill="#0284c7"
                        stroke="#f8fafc"
                        strokeWidth={1.5}
                      />
                      <text
                        x={node.x + 14}
                        y={node.y - 11}
                        textAnchor="middle"
                        fontSize={10}
                        fontWeight="bold"
                        fill="#f8fafc"
                      >
                        {deployed.level}
                      </text>
                    </>
                  ) : (
                    <text
                      x={node.x}
                      y={node.y + 5}
                      textAnchor="middle"
                      fontSize={15}
                      fill="rgba(56, 189, 248, 0.6)"
                    >
                      +
                    </text>
                  )}
                </g>
              );
            })}

            {/* Internet Source Gateway (Left) */}
            <g transform={`translate(${currentMission.pathPoints[0].x - 10}, ${currentMission.pathPoints[0].y - 22})`}>
              <rect width={44} height={44} rx={10} fill="#1e293b" stroke="#38bdf8" strokeWidth={2} />
              <text x={22} y={28} textAnchor="middle" fontSize={22}>🌐</text>
              <text x={22} y={54} textAnchor="middle" fontSize={10} fill="#94a3b8" fontWeight="bold">Gateway</text>
            </g>

            {/* School Server Destination (Right) */}
            <g
              transform={`translate(${
                currentMission.pathPoints[currentMission.pathPoints.length - 1].x - 20
              }, ${currentMission.pathPoints[currentMission.pathPoints.length - 1].y - 25})`}
            >
              <rect
                width={50}
                height={50}
                rx={10}
                fill="#0f172a"
                stroke={serverHp > 40 ? '#10b981' : '#ef4444'}
                strokeWidth={2.5}
              />
              <text x={25} y={32} textAnchor="middle" fontSize={26}>🖥️</text>
              <text x={25} y={62} textAnchor="middle" fontSize={10} fill="#10b981" fontWeight="bold">Server</text>
            </g>
          </svg>

          {/* Active Threats Overlay */}
          {threats.map((threat) => {
            const conf = THREAT_CONFIGS[threat.type];
            const hpRatio = Math.max(0, threat.hp / threat.maxHp);

            return (
              <div
                key={threat.id}
                className="threat-icon"
                style={{
                  position: 'absolute',
                  left: `${(threat.x / 700) * 100}%`,
                  top: `${(threat.y / 450) * 100}%`,
                  color: conf.color,
                }}
              >
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  {conf.emoji}
                  {/* Threat HP Bar */}
                  <div
                    style={{
                      position: 'absolute',
                      top: -6,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 28,
                      height: 4,
                      background: 'rgba(0,0,0,0.7)',
                      borderRadius: 2,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${hpRatio * 100}%`,
                        height: '100%',
                        background: hpRatio > 0.5 ? '#10b981' : hpRatio > 0.25 ? '#f59e0b' : '#ef4444',
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Tower Inspector (if node clicked) */}
        {selectedNodeIndex !== null && selectedNodeTower && (
          <div className="cyber-inspector">
            <div className="cyber-inspector-left">
              <span style={{ fontSize: '1.8rem' }}>
                {TOWER_CONFIGS[selectedNodeTower.type].emoji}
              </span>
              <div>
                <strong>
                  {TOWER_CONFIGS[selectedNodeTower.type].name} (ระดับ {selectedNodeTower.level})
                </strong>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  {TOWER_CONFIGS[selectedNodeTower.type].desc}
                </div>
              </div>
            </div>

            <div className="cyber-inspector-actions">
              {selectedNodeTower.level < 3 && (
                <button
                  type="button"
                  className="cyber-btn-upgrade"
                  disabled={
                    bandwidth <
                    TOWER_CONFIGS[selectedNodeTower.type].upgradeCost * selectedNodeTower.level
                  }
                  onClick={() => handleUpgradeTower(selectedNodeIndex)}
                >
                  <ArrowUpCircle size={14} style={{ display: 'inline', marginRight: 4 }} />
                  อัปเกรด (
                  {TOWER_CONFIGS[selectedNodeTower.type].upgradeCost * selectedNodeTower.level} Bw)
                </button>
              )}
              <button
                type="button"
                className="cyber-btn-sell"
                onClick={() => handleSellTower(selectedNodeIndex)}
              >
                <Trash2 size={14} style={{ display: 'inline', marginRight: 4 }} />
                ถอนการติดตั้ง (+{Math.floor(TOWER_CONFIGS[selectedNodeTower.type].cost * 0.7)} Bw)
              </button>
            </div>
          </div>
        )}

        {/* Lower Toolbar: Tower Deck & Controls */}
        <div className="cyber-toolbar">
          <div className="cyber-towers-deck">
            {(Object.keys(TOWER_CONFIGS) as TowerType[]).map((tType) => {
              const cfg = TOWER_CONFIGS[tType];
              const isSelected = selectedTowerDeck === tType;
              const canAfford = bandwidth >= cfg.cost;

              return (
                <button
                  key={tType}
                  type="button"
                  className={`cyber-tower-card ${isSelected ? 'active' : ''}`}
                  disabled={!canAfford}
                  onClick={() => setSelectedTowerDeck(tType)}
                >
                  <span className="cyber-card-emoji">{cfg.emoji}</span>
                  <span className="cyber-card-title">{cfg.name}</span>
                  <span className="cyber-card-cost">{cfg.cost} Bw</span>
                </button>
              );
            })}
          </div>

          <div className="cyber-action-controls">
            <button
              type="button"
              className="cyber-start-wave-btn"
              disabled={waveActive || waveIndex >= currentMission.waves.length}
              onClick={handleStartWave}
            >
              <Play size={18} />
              {waveActive
                ? 'ภัยคุกคามกำลังโจมตี...'
                : `ปล่อยคลื่นที่ ${waveIndex + 1}/${currentMission.waves.length}`}
            </button>

            <button
              type="button"
              className="cyber-speed-btn"
              onClick={() => setGameSpeed((sp) => (sp === 1 ? 2 : 1))}
            >
              <FastForward size={14} style={{ display: 'inline', marginRight: 4 }} />
              ความเร็ว: {gameSpeed}x
            </button>
          </div>
        </div>
      </div>

      {/* Cyber Briefing Modal (Before Level Starts) */}
      {briefingOpen && (
        <div className="cyber-modal-backdrop">
          <div className="cyber-modal-card">
            <div className="cyber-briefing-badge">
              <HelpCircle size={15} /> ภารกิจบรรยายสรุปความปลอดภัยไซเบอร์
            </div>
            <h2>{currentMission.title}</h2>
            <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '1rem' }}>
              {currentMission.story}
            </p>

            <div className="cyber-briefing-q">
              ❓ {currentMission.briefing.question}
            </div>

            <div className="cyber-options-grid">
              {currentMission.briefing.options.map((opt, oIdx) => {
                const isSelected = selectedOption === oIdx;
                const isCorrect = oIdx === currentMission.briefing.correctIndex;
                let optClass = '';
                if (briefingAnswered) {
                  if (isCorrect) optClass = 'correct';
                  else if (isSelected) optClass = 'wrong';
                }

                return (
                  <button
                    key={oIdx}
                    type="button"
                    className={`cyber-option-btn ${optClass}`}
                    disabled={briefingAnswered}
                    onClick={() => handleAnswerBriefing(oIdx)}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {briefingAnswered && (
              <div className="cyber-explanation-box">
                <strong>💡 คำอธิบาย: </strong>
                {currentMission.briefing.explanation}
                {selectedOption === currentMission.briefing.correctIndex && (
                  <div style={{ color: '#34d399', marginTop: '0.4rem', fontWeight: 'bold' }}>
                    🎉 ตอบถูกต้อง! ได้รับโบนัส +{currentMission.briefing.bonusBandwidth} แบนด์วิดท์
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              className="cyber-modal-btn"
              disabled={!briefingAnswered}
              onClick={handleCloseBriefing}
            >
              {briefingAnswered ? 'เข้าสู่สนามเครือข่าย วางป้อมปราการ 🛡️' : 'ตอบคำถามก่อนเพื่อรับโบนัส'}
            </button>
          </div>
        </div>
      )}

      {/* Mission Victory Modal */}
      {missionWon && (
        <div className="cyber-modal-backdrop">
          <div className="cyber-modal-card" style={{ textAlign: 'center' }}>
            <div className="cyber-victory-header">
              <div className="stars">⭐⭐⭐</div>
              <h2 style={{ color: '#34d399' }}>ภารกิจสำเร็จ! เครือข่ายปลอดภัย</h2>
              <p style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                คุณสามารถปกป้องข้อมูลของโรงเรียนจากภัยคุกคามไซเบอร์ได้ 100%
              </p>
            </div>

            <div className="cyber-victory-stats">
              <div className="cyber-stat-box">
                <small>ความสมบูรณ์ Server</small>
                <strong style={{ color: '#10b981' }}>{serverHp}%</strong>
              </div>
              <div className="cyber-stat-box">
                <small>คะแนนสมรรถนะ</small>
                <strong style={{ color: '#38bdf8' }}>{score + 1000}</strong>
              </div>
              <div className="cyber-stat-box">
                <small>แบนด์วิดท์คงเหลือ</small>
                <strong style={{ color: '#f59e0b' }}>{bandwidth}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className="cyber-modal-btn"
                style={{ background: 'rgba(255,255,255,0.1)' }}
                onClick={() => initLevel(levelIndex)}
              >
                <RotateCcw size={16} style={{ display: 'inline', marginRight: 4 }} /> เล่นด่านนี้อีกครั้ง
              </button>
              {levelIndex < MISSION_LEVELS.length - 1 ? (
                <button
                  type="button"
                  className="cyber-modal-btn"
                  onClick={() => initLevel(levelIndex + 1)}
                >
                  ลุยภารกิจถัดไป ({levelIndex + 2}) ➡️
                </button>
              ) : (
                <Link to="/games" className="cyber-modal-btn" style={{ textDecoration: 'none' }}>
                  <Trophy size={16} style={{ display: 'inline', marginRight: 4 }} /> จบครบทุกภารกิจ! กลับหน้าเกม
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mission Defeat Modal */}
      {missionLost && (
        <div className="cyber-modal-backdrop">
          <div className="cyber-modal-card" style={{ textAlign: 'center', borderColor: '#ef4444' }}>
            <div className="cyber-victory-header">
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚠️</div>
              <h2 style={{ color: '#f87171' }}>เซิร์ฟเวอร์ถูกเจาะระบบ!</h2>
              <p style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                ภัยคุกคามไซเบอร์ทะลวงเข้ามาถึงระบบฐานข้อมูลโรงเรียนได้สำเร็จ
              </p>
            </div>

            <div className="cyber-explanation-box" style={{ borderColor: '#ef4444', textAlign: 'left' }}>
              <strong>💡 กลยุทธ์แนะนำ:</strong>
              <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1.2rem', fontSize: '0.85rem' }}>
                <li>วาง <strong>Firewall</strong> บริเวณต้นทางเพื่อชะลอความเร็วของศัตรู</li>
                <li>ใช้ <strong>2FA</strong> สอยสปายแวร์และเจาะเกราะแรนซัมแวร์</li>
                <li>ใช้ <strong>เกตเวย์เข้ารหัส SSL</strong> ปล่อยคลื่นกระจายจัดการฝูง DDoS</li>
                <li>อย่าลืมตอบควิซ Cyber Briefing ให้ถูกเพื่อรับโบนัสแบนด์วิดท์</li>
              </ul>
            </div>

            <button
              type="button"
              className="cyber-modal-btn"
              style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}
              onClick={() => initLevel(levelIndex)}
            >
              <RotateCcw size={16} style={{ display: 'inline', marginRight: 4 }} /> ลองใหม่อีกครั้ง
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CyberShieldGame;
