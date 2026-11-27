import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as THREE from 'three';
import { useGameProgress } from '../../hooks/useGameProgress';
import { frameDeltaSeconds } from '../../utils/gameTimers';
import './Electronics101Game.css';
import {
  ELECTRONICS_101_CATEGORIES,
  ELECTRONICS_101_CURRICULUM,
  STUDENT_LAB_MISSIONS,
  TIS_WIRE_SIZES,
  decodeResistorBands,
  getResistorBandColors,
  getShockSeverity,
  solveElectronicsPhysicsStep,
  type CircuitTopologyMode,
  type ElectronicsCategoryKey,
  type PhysicsSimulationState,
} from './electronics101Data';
import {
  BREADBOARD_COLS,
  BREADBOARD_DEPTH,
  BREADBOARD_WIDTH,
  ROW_Z_MAP,
  TOPOLOGY_DEFINITIONS,
  getActiveBreadboardStrips,
  getLabPartTerminals,
  holeToWorld,
  validateBreadboardWiring,
  type BreadboardHole,
  type BreadboardJumper,
  type BreadboardRow,
  type CurrentBranch,
  type LabBlockPart,
  type SelectablePartId,
} from './electronics101Topologies';
import {
  InteractiveBreadboardSvg,
  InteractiveSchematicSvg,
  LessonThumbnailSvg,
  type DiagramTelemetry,
} from './Electronics101Diagrams';

const COMPLETED_STORAGE_KEY = 'krujames_electronics101_completed_v1';

function loadCompletedLessons(): Set<string> {
  try {
    const raw = localStorage.getItem(COMPLETED_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch {
    return new Set();
  }
}

function saveCompletedLessons(set: Set<string>): void {
  try {
    localStorage.setItem(COMPLETED_STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    // ignore storage errors
  }
}

type LabSoundKind = 'switch_on' | 'switch_off' | 'wire_plug' | 'burn_pop' | 'chime';

let sharedAudioCtx: AudioContext | null = null;

function playLabSound(kind: LabSoundKind, enabled: boolean): void {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    if (!sharedAudioCtx) sharedAudioCtx = new Ctx();
    const ctx = sharedAudioCtx;
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }
    const now = ctx.currentTime;

    if (kind === 'switch_on' || kind === 'switch_off') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(kind === 'switch_on' ? 520 : 340, now);
      osc.frequency.exponentialRampToValueAtTime(kind === 'switch_on' ? 880 : 190, now + 0.045);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.055);
    } else if (kind === 'wire_plug') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.exponentialRampToValueAtTime(990, now + 0.06);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.07);
    } else if (kind === 'burn_pop') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(48, now + 0.28);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.32);
    } else if (kind === 'chime') {
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const t0 = now + idx * 0.07;
        osc.frequency.setValueAtTime(freq, t0);
        gain.gain.setValueAtTime(0.11, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.26);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.28);
      });
    }
  } catch {
    // ignore audio restrictions
  }
}

type InfoTab = 'overview' | 'components' | 'circuit' | 'maths';
type ModalTab = 'diagram' | 'breadboard';

const INK_HEX = 0x151a2c;

function addCartoonOutline(mesh: THREE.Mesh, scale = 1.045): void {
  const outlineMat = new THREE.MeshBasicMaterial({
    color: INK_HEX,
    side: THREE.BackSide,
  });
  const outlineMesh = new THREE.Mesh(mesh.geometry, outlineMat);
  outlineMesh.scale.setScalar(scale);
  mesh.add(outlineMesh);
}

function addBoxEdges(mesh: THREE.Mesh, threshold = 25): void {
  const edgesGeo = new THREE.EdgesGeometry(mesh.geometry, threshold);
  const edgesMat = new THREE.LineBasicMaterial({ color: INK_HEX });
  const line = new THREE.LineSegments(edgesGeo, edgesMat);
  mesh.add(line);
}

function createBatteryTexture(volts: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#84cc16';
    ctx.fillRect(0, 0, 512, 256);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 512, 46);
    ctx.fillStyle = '#eab308';
    ctx.fillRect(0, 46, 512, 20);

    ctx.save();
    ctx.translate(256, 152);
    ctx.fillStyle = '#151a2c';
    ctx.font = '800 54px "Barlow Semi Condensed", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${volts.toFixed(volts % 1 === 0 ? 0 : 1)} V`, 0, 0);

    ctx.fillStyle = '#dc2626';
    ctx.font = '800 34px "JetBrains Mono", monospace';
    ctx.fillText('+', 0, -64);
    ctx.fillStyle = '#1e293b';
    ctx.fillText('−', 0, 66);
    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function createPowerPuckTopTexture(volts: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#252936';
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = '#3b4254';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(128, 128, 114, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 54px "Barlow Semi Condensed", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${volts.toFixed(volts % 1 === 0 ? 0 : 1)} V`, 128, 108);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 22px "Barlow Semi Condensed", Arial, sans-serif';
    ctx.fillText('POWER', 128, 154);

    // Red switch slider graphic
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(102, 174, 52, 22);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(126, 176, 24, 18);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// 100% Mathematically Aligned Breadboard Texture (matches holeToWorld to the sub-pixel!)
function createBreadboardTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1320;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const W = canvas.width;
    const H = canvas.height;
    const worldXToPx = (wx: number) => ((wx + BREADBOARD_WIDTH / 2) / BREADBOARD_WIDTH) * W;
    const worldZToPy = (wz: number) => ((wz + BREADBOARD_DEPTH / 2) / BREADBOARD_DEPTH) * H;

    ctx.fillStyle = '#f6f0e2';
    ctx.fillRect(0, 0, W, H);

    // Subtle outer border
    ctx.strokeStyle = '#d8ceba';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, W - 8, H - 8);

    // Center IC ravine channel (z = -0.11 to +0.11)
    const chTop = worldZToPy(-0.115);
    const chBot = worldZToPy(0.115);
    ctx.fillStyle = '#e3dac6';
    ctx.fillRect(28, chTop, W - 56, chBot - chTop);
    ctx.strokeStyle = '#cfc4ae';
    ctx.lineWidth = 3;
    ctx.strokeRect(28, chTop, W - 56, chBot - chTop);

    // Power rail stripes aligned with exact rail rows
    const drawRailLine = (wz: number, color: string, sign: '+' | '−') => {
      const y = worldZToPy(wz);
      const xStart = worldXToPx((1 - 12.5) * 0.28) - 24;
      const xEnd = worldXToPx((24 - 12.5) * 0.28) + 24;
      ctx.strokeStyle = color;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(xStart, y);
      ctx.lineTo(xEnd, y);
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.font = '800 30px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sign, xStart - 24, y);
      ctx.fillText(sign, xEnd + 24, y);
    };

    drawRailLine(ROW_Z_MAP['+T'] - 0.14, '#ef4444', '+');
    drawRailLine(ROW_Z_MAP['-T'] + 0.14, '#3b82f6', '−');
    drawRailLine(ROW_Z_MAP['+B'] - 0.14, '#ef4444', '+');
    drawRailLine(ROW_Z_MAP['-B'] + 0.14, '#3b82f6', '−');

    const allRows: BreadboardRow[] = [
      '+T',
      '-T',
      'a',
      'b',
      'c',
      'd',
      'e',
      'f',
      'g',
      'h',
      'i',
      'j',
      '+B',
      '-B',
    ];

    for (let col = 1; col <= BREADBOARD_COLS; col++) {
      const [wx] = holeToWorld({ col, row: 'a' });
      const px = worldXToPx(wx);

      if (col % 5 === 0 || col === 1) {
        ctx.fillStyle = '#64748b';
        ctx.font = '800 24px "Barlow Semi Condensed", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(col), px, worldZToPy(-1.5));
        ctx.fillText(String(col), px, worldZToPy(1.52));
      }

      for (const r of allRows) {
        const [, , wz] = holeToWorld({ col, row: r });
        const py = worldZToPy(wz);

        // Beveled socket rim
        ctx.fillStyle = '#ddd2bc';
        ctx.fillRect(px - 14, py - 14, 28, 28);
        // Dark contact hole centered at exact (px, py)
        ctx.fillStyle = '#232736';
        ctx.fillRect(px - 8, py - 8, 16, 16);
      }
    }

    const letterRows: BreadboardRow[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    ctx.fillStyle = '#64748b';
    ctx.font = '800 25px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const leftLabelX = worldXToPx((1 - 12.5) * 0.28) - 42;
    const rightLabelX = worldXToPx((24 - 12.5) * 0.28) + 42;
    letterRows.forEach((r) => {
      const py = worldZToPy(ROW_Z_MAP[r]);
      ctx.fillText(r, leftLabelX, py);
      ctx.fillText(r, rightLabelX, py);
    });
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

function updateDmmScreenTexture(
  ctx: CanvasRenderingContext2D,
  tex: THREE.CanvasTexture,
  vLoad: number,
  iMa: number,
  ohms: number,
  mode: CircuitTopologyMode,
): void {
  ctx.fillStyle = '#9db090';
  ctx.fillRect(0, 0, 256, 128);
  ctx.strokeStyle = '#151a2c';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, 250, 122);

  ctx.fillStyle = 'rgba(21, 26, 44, 0.08)';
  ctx.font = '800 44px "JetBrains Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillText('88.88V', 238, 62);

  ctx.fillStyle = '#151a2c';
  ctx.fillText(`${vLoad.toFixed(2)}V`, 238, 62);

  ctx.font = '700 22px "JetBrains Mono", monospace';
  const secText =
    mode === 'LDR_DIRECT' || mode === 'LDR_NIGHT'
      ? `${(ohms / 1000).toFixed(1)}kΩ · ${iMa.toFixed(1)}mA`
      : `V · Ω · ${iMa.toFixed(1)} mA`;
  ctx.fillText(secText, 238, 104);
  tex.needsUpdate = true;
}

const JUMPER_WIRE_COLORS = ['#d9483b', '#1f7a4c', '#2563eb', '#d97706', '#9333ea'];

const Electronics101Game: React.FC = () => {
  const recordGame = useGameProgress(
    'electronics-101',
    'ห้องปฏิบัติการอิเล็กทรอนิกส์ 3D (Electronics 101)',
    { recordOnce: false },
  );

  const [category, setCategory] = useState<ElectronicsCategoryKey>('basics');
  const [lessonIndex, setLessonIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<InfoTab>('circuit');
  const [selectedPart, setSelectedPart] = useState<SelectablePartId>('sw1');

  const [buildOnBreadboard, setBuildOnBreadboard] = useState<boolean>(false);
  const [breadboardInside, setBreadboardInside] = useState<boolean>(false);
  const [breadboardStep, setBreadboardStep] = useState<1 | 2 | 3>(2);

  const [wiringChallengeMode, setWiringChallengeMode] = useState<boolean>(false);
  const [userJumpers, setUserJumpers] = useState<BreadboardJumper[]>([]);
  const [pendingHole, setPendingHole] = useState<BreadboardHole | null>(null);
  const [showWiringHint, setShowWiringHint] = useState<boolean>(false);

  const [isBurned, setIsBurned] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const [switchClosed, setSwitchClosed] = useState<boolean>(true);
  const [sw2Closed, setSw2Closed] = useState<boolean>(true);
  const [Vs, setVs] = useState<number>(3.0);
  const [R, setR] = useState<number>(100);
  const [R2, setR2] = useState<number>(220);
  const [C, setC] = useState<number>(470);
  const [Rb, setRb] = useState<number>(10000);
  const [lightLevel, setLightLevel] = useState<number>(30);

  const [led1Inserted, setLed1Inserted] = useState<boolean>(true);
  const [led2Inserted, setLed2Inserted] = useState<boolean>(true);
  const [resistorWattage, setResistorWattage] = useState<number>(0.25);
  const [wireGaugeMm2, setWireGaugeMm2] = useState<number>(2.5);
  const [breakerRatingA, setBreakerRatingA] = useState<number>(20);
  const [fuseBlown, setFuseBlown] = useState<boolean>(false);
  const [breakerTripped, setBreakerTripped] = useState<boolean>(false);
  const [faultRepaired, setFaultRepaired] = useState<boolean>(false);

  const [missionMode, setMissionMode] = useState<boolean>(false);
  const [missionIndex, setMissionIndex] = useState<number>(0);
  const [completedMissions, setCompletedMissions] = useState<Set<string>>(() => new Set());
  const [showMissionHint, setShowMissionHint] = useState<boolean>(false);

  const [showDMM, setShowDMM] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showCurrentFlow, setShowCurrentFlow] = useState<boolean>(true);
  const [turntable, setTurntable] = useState<boolean>(false);
  const [darkTheme, setDarkTheme] = useState<boolean>(false);
  const [timeScale, setTimeScale] = useState<number>(1.0);
  const [showSchematic, setShowSchematic] = useState<boolean>(false);
  const [modalTab, setModalTab] = useState<ModalTab>('diagram');
  const [chartCollapsed, setChartCollapsed] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(() =>
    loadCompletedLessons(),
  );
  const [clockTime, setClockTime] = useState<string>(
    () => new Date().toTimeString().split(' ')[0],
  );

  const [telemetry, setTelemetry] = useState({
    Vload: 3.0,
    I_mA: 11.0,
    I2_mA: 0,
    P_mW: 12.1,
    P2_mW: 0,
    VR1: 1.1,
    VR2: 0,
    Vc: 0,
    Ib_uA: 0,
    R_ldr: 15000,
    touchVoltage: 0,
    bodyCurrentMa: 0,
  });

  const currentLesson = useMemo(
    () =>
      ELECTRONICS_101_CURRICULUM[category][lessonIndex] ||
      ELECTRONICS_101_CURRICULUM.basics[0],
    [category, lessonIndex],
  );

  const currentTopo = useMemo(
    () => TOPOLOGY_DEFINITIONS[currentLesson.mode] || TOPOLOGY_DEFINITIONS.DC,
    [currentLesson.mode],
  );

  const wiringStatus = useMemo(
    () => validateBreadboardWiring(currentTopo, userJumpers),
    [currentTopo, userJumpers],
  );

  const bandColors = useMemo(() => getResistorBandColors(R), [R]);
  const bandColorsR2 = useMemo(() => getResistorBandColors(R2), [R2]);
  const bandDecoded = useMemo(
    () => decodeResistorBands(selectedPart === 'r2' ? R2 : R),
    [R, R2, selectedPart],
  );

  const shellRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scopeCanvasRef = useRef<HTMLCanvasElement>(null);
  const labelsLayerRef = useRef<HTMLDivElement>(null);

  const camControlRef = useRef<{
    reset: () => void;
    topView: () => void;
    rotateBy: (deltaTheta: number) => void;
    zoomBy: (deltaZoom: number) => void;
    focusOn: (x: number, z: number) => void;
  } | null>(null);

  const rebuildSceneRef = useRef<(() => void) | null>(null);

  const simRef = useRef<PhysicsSimulationState>({
    switchClosed: true,
    sw2Closed: true,
    Vs: 3.0,
    R: 100,
    R2: 220,
    C: 470,
    Vf: 1.9,
    mode: 'DC',
    Vc: 0,
    Vload: 3.0,
    I_mA: 11.0,
    I2_mA: 0,
    P_mW: 12.1,
    P2_mW: 0,
    VR1: 1.1,
    VR2: 0,
    Rb: 10000,
    hFE: 200,
    Ib_uA: 0,
    Vb: 0,
    lightLevel: 30,
    R_ldr: 15000,
    led1Inserted: true,
    led2Inserted: true,
    resistorWattage: 0.25,
    wireGaugeMm2: 2.5,
    breakerRatingA: 20,
    fuseBlown: false,
    breakerTripped: false,
    faultKind: 'none',
    faultRepaired: false,
    touchVoltage: 0,
    bodyCurrentMa: 0,
    timeScale: 1.0,
    simTime: 0,
  });

  const uiFlagsRef = useRef({
    buildOnBreadboard: false,
    breadboardInside: false,
    breadboardStep: 2 as 1 | 2 | 3,
    wiringChallengeMode: false,
    userJumpers: [] as BreadboardJumper[],
    isBurned: false,
    fuseBlown: false,
    breakerTripped: false,
    led1Inserted: true,
    led2Inserted: true,
    resistorWattage: 0.25,
    wireGaugeMm2: 2.5,
    lessonId: 'b1',
    showDMM: true,
    showLabels: true,
    showCurrentFlow: true,
    turntable: false,
    darkTheme: false,
    selectedPart: 'sw1' as SelectablePartId,
  });

  const isWiringComplete = !wiringChallengeMode || wiringStatus.status === 'complete';

  useEffect(() => {
    const effectiveClosed =
      !isBurned &&
      isWiringComplete &&
      !(buildOnBreadboard && breadboardStep !== 2) &&
      switchClosed;
    simRef.current.switchClosed = effectiveClosed;
    simRef.current.sw2Closed = sw2Closed;
    simRef.current.Vs = Vs;
    simRef.current.R = R;
    simRef.current.R2 = R2;
    simRef.current.C = C;
    simRef.current.Rb = Rb;
    simRef.current.lightLevel = lightLevel;
    simRef.current.led1Inserted = led1Inserted;
    simRef.current.led2Inserted = led2Inserted;
    simRef.current.resistorWattage = resistorWattage;
    simRef.current.wireGaugeMm2 = wireGaugeMm2;
    simRef.current.breakerRatingA = breakerRatingA;
    simRef.current.fuseBlown = fuseBlown;
    simRef.current.breakerTripped = breakerTripped;
    simRef.current.faultKind = currentLesson.fault ?? 'none';
    simRef.current.faultRepaired = faultRepaired;
    simRef.current.mode = currentLesson.mode;
    simRef.current.timeScale = timeScale;
  }, [
    switchClosed,
    sw2Closed,
    Vs,
    R,
    R2,
    C,
    Rb,
    lightLevel,
    led1Inserted,
    led2Inserted,
    resistorWattage,
    wireGaugeMm2,
    breakerRatingA,
    fuseBlown,
    breakerTripped,
    faultRepaired,
    currentLesson.fault,
    currentLesson.mode,
    timeScale,
    buildOnBreadboard,
    breadboardStep,
    isBurned,
    isWiringComplete,
  ]);

  // Overcurrent Burn, Fuse Blow, and Circuit Breaker Trip Handler
  useEffect(() => {
    if (currentLesson.mode === 'FUSE_TRIP') {
      if (!fuseBlown && switchClosed && (telemetry.I_mA > 35 || sw2Closed)) {
        const timer = window.setTimeout(() => {
          setFuseBlown(true);
          playLabSound('burn_pop', soundEnabled);
        }, 320);
        return () => window.clearTimeout(timer);
      }
      return;
    }

    if (currentLesson.mode === 'BREAKER') {
      if (!breakerTripped && telemetry.I_mA > breakerRatingA * 1.45) {
        const timer = window.setTimeout(() => {
          setBreakerTripped(true);
          playLabSound('switch_off', soundEnabled);
        }, 380);
        return () => window.clearTimeout(timer);
      }
      return;
    }

    if (isBurned) return;
    const maxWattageMw = resistorWattage * 1000;
    const isPowerOverload =
      (currentLesson.id === 'r7' || currentLesson.id === 'p1' || currentLesson.id === 'p2') &&
      telemetry.P_mW > maxWattageMw * 1.05;
    if (telemetry.I_mA > 38 && currentLesson.id !== 'p1' && currentLesson.id !== 'p2' || isPowerOverload) {
      const timer = window.setTimeout(() => {
        setIsBurned(true);
        playLabSound('burn_pop', soundEnabled);
      }, 450);
      return () => window.clearTimeout(timer);
    }
  }, [
    telemetry.I_mA,
    telemetry.P_mW,
    currentLesson.id,
    currentLesson.mode,
    resistorWattage,
    breakerRatingA,
    switchClosed,
    sw2Closed,
    fuseBlown,
    breakerTripped,
    isBurned,
    soundEnabled,
  ]);

  useEffect(() => {
    uiFlagsRef.current = {
      buildOnBreadboard,
      breadboardInside,
      breadboardStep,
      wiringChallengeMode,
      userJumpers,
      isBurned,
      fuseBlown,
      breakerTripped,
      led1Inserted,
      led2Inserted,
      resistorWattage,
      wireGaugeMm2,
      lessonId: currentLesson.id,
      showDMM,
      showLabels,
      showCurrentFlow,
      turntable,
      darkTheme,
      selectedPart,
    };
    rebuildSceneRef.current?.();
  }, [
    buildOnBreadboard,
    breadboardInside,
    breadboardStep,
    wiringChallengeMode,
    userJumpers,
    isBurned,
    fuseBlown,
    breakerTripped,
    led1Inserted,
    led2Inserted,
    resistorWattage,
    wireGaugeMm2,
    Vs,
    switchClosed,
    sw2Closed,
    currentLesson.id,
    currentLesson.mode,
    showDMM,
    showLabels,
    showCurrentFlow,
    turntable,
    darkTheme,
    selectedPart,
  ]);

  const toggleSwitch1WithSound = useCallback(() => {
    if (breakerTripped) {
      setBreakerTripped(false);
      if (R < 150) setR(220);
      playLabSound('switch_on', soundEnabled);
      return;
    }
    setSwitchClosed((prev) => {
      const next = !prev;
      playLabSound(next ? 'switch_on' : 'switch_off', soundEnabled);
      return next;
    });
  }, [breakerTripped, R, soundEnabled]);

  const toggleSwitch2WithSound = useCallback(() => {
    setSw2Closed((prev) => {
      const next = !prev;
      playLabSound(next ? 'switch_on' : 'switch_off', soundEnabled);
      return next;
    });
  }, [soundEnabled]);

  const toggleSwitch1Ref = useRef(toggleSwitch1WithSound);
  const toggleSwitch2Ref = useRef(toggleSwitch2WithSound);
  useEffect(() => {
    toggleSwitch1Ref.current = toggleSwitch1WithSound;
    toggleSwitch2Ref.current = toggleSwitch2WithSound;
  }, [toggleSwitch1WithSound, toggleSwitch2WithSound]);

  const handleReplaceBurnedPart = useCallback(() => {
    setIsBurned(false);
    setFuseBlown(false);
    setBreakerTripped(false);
    setFaultRepaired(true);
    if (currentLesson.mode === 'FUSE_TRIP') {
      setSw2Closed(false);
    }
    if (R < 150 && currentLesson.id !== 'p1') setR(220);
    if (currentLesson.id === 'r7' || currentLesson.id === 'p1') {
      setResistorWattage(1.0);
    }
    playLabSound('wire_plug', soundEnabled);
  }, [R, currentLesson.id, currentLesson.mode, soundEnabled]);

  const handleBreadboardHoleClick = useCallback(
    (hole: BreadboardHole) => {
      if (!wiringChallengeMode) return;
      if (!pendingHole) {
        setPendingHole(hole);
        playLabSound('wire_plug', soundEnabled);
        return;
      }
      if (pendingHole.col === hole.col && pendingHole.row === hole.row) {
        setPendingHole(null);
        return;
      }
      const nextJumpers: BreadboardJumper[] = [
        ...userJumpers,
        {
          from: pendingHole,
          to: hole,
          color: JUMPER_WIRE_COLORS[userJumpers.length % JUMPER_WIRE_COLORS.length],
          branch: 'main',
        },
      ];
      setUserJumpers(nextJumpers);
      setPendingHole(null);

      const res = validateBreadboardWiring(currentTopo, nextJumpers);
      if (res.status === 'complete') {
        playLabSound('chime', soundEnabled);
      } else if (res.status === 'short') {
        playLabSound('burn_pop', soundEnabled);
      } else {
        playLabSound('wire_plug', soundEnabled);
      }
    },
    [wiringChallengeMode, pendingHole, userJumpers, currentTopo, soundEnabled],
  );

  const selectLesson = useCallback((catKey: ElectronicsCategoryKey, idx: number) => {
    const item = ELECTRONICS_101_CURRICULUM[catKey][idx];
    if (!item) return;
    setCategory(catKey);
    setLessonIndex(idx);
    setVs(item.v);
    setR(item.r);
    setR2(item.r2 ?? item.r);
    setC(item.c ?? 470);
    setRb(item.rb ?? 10000);
    setLightLevel(item.light !== undefined ? item.light : 30);
    setSwitchClosed(item.sw);
    setSw2Closed(item.mode === 'FUSE_TRIP' ? false : true);
    setLed1Inserted(true);
    setLed2Inserted(true);
    setResistorWattage(item.wattage ?? 0.25);
    setWireGaugeMm2(item.wireMm2 ?? 2.5);
    setBreakerRatingA(item.breakerA ?? 20);
    setFuseBlown(false);
    setBreakerTripped(false);
    setFaultRepaired(false);
    setBreadboardStep(2);
    setIsBurned(false);
    setWiringChallengeMode(false);
    setUserJumpers([]);
    setPendingHole(null);
    setShowWiringHint(false);

    if (item.id === 'b7') {
      setBuildOnBreadboard(true);
      setBreadboardInside(true);
      setModalTab('breadboard');
    } else if (item.id === 'b8' || item.id === 'c9') {
      setBuildOnBreadboard(true);
      setBreadboardInside(false);
    }

    if (item.mode === 'LDR_DIRECT' || item.mode === 'LDR_NIGHT') {
      setSelectedPart('ldr');
    } else if (item.mode === 'RC' || item.mode === 'ASTABLE') {
      setSelectedPart('cap1');
    } else if (item.mode === 'BJT' || item.mode === 'NOT') {
      setSelectedPart('bjt1');
    } else if (item.mode === 'FUSE_TRIP' || item.mode === 'TROUBLESHOOT') {
      setSelectedPart('fuse1');
    } else if (catKey === 'resistors') {
      setSelectedPart('r1');
    } else {
      setSelectedPart('sw1');
    }

    simRef.current.Vc = 0;
    simRef.current.mode = item.mode;
  }, []);

  const currentMission = STUDENT_LAB_MISSIONS[missionIndex] || STUDENT_LAB_MISSIONS[0];

  const selectMission = useCallback(
    (mIdx: number) => {
      const m = STUDENT_LAB_MISSIONS[mIdx];
      if (!m) return;
      setMissionIndex(mIdx);
      setMissionMode(true);
      setShowMissionHint(false);
      selectLesson(m.category, m.lessonIndex);
      if (m.requireBreadboardWiring) {
        setBuildOnBreadboard(true);
        setBreadboardInside(true);
        setWiringChallengeMode(true);
        setUserJumpers([]);
      } else if (m.id === 'm5') {
        setVs(12.0);
        setR(120);
        setResistorWattage(0.25);
      } else if (m.id === 'm6') {
        setWireGaugeMm2(1.0);
        setBreakerRatingA(10);
      } else if (m.id === 'm7') {
        setLightLevel(70);
        setSw2Closed(false);
      }
    },
    [selectLesson],
  );

  const missionEval = useMemo(() => {
    const m = currentMission;
    if (m.id === 'm1') {
      const passed = wiringChallengeMode && wiringStatus.status === 'complete' && telemetry.I_mA > 5;
      return {
        passed,
        statusTh: passed
          ? '🎉 สำเร็จ! โยงสายโฟโต้บอร์ดครบวงจรและไฟติดสว่างแล้ว'
          : `กำลังต่อสาย: ${wiringStatus.matchedCount}/${wiringStatus.requiredCount} เส้น`,
      };
    }
    if (m.id === 'm2') {
      const passed = !isBurned && telemetry.I_mA >= 18.0 && telemetry.I_mA <= 22.0;
      return {
        passed,
        statusTh: passed
          ? `🎉 สำเร็จ! กระแสอยู่ในเกณฑ์ (${telemetry.I_mA.toFixed(1)} mA)`
          : `กระแสปัจจุบัน: ${telemetry.I_mA.toFixed(1)} mA (เป้าหมาย 18.0–22.0 mA)`,
      };
    }
    if (m.id === 'm3') {
      const diff = Math.abs(R - R2);
      const passed =
        currentLesson.mode === 'SERIES' &&
        Math.abs(Vs - 9.0) < 0.2 &&
        diff >= 200 &&
        led1Inserted &&
        led2Inserted &&
        telemetry.I_mA > 2;
      return {
        passed,
        statusTh: passed
          ? `🎉 สำเร็จ! R1=${R}Ω (VR1=${telemetry.VR1.toFixed(2)}V), R2=${R2}Ω (VR2=${telemetry.VR2.toFixed(2)}V)`
          : `Vs=${Vs.toFixed(1)}V, |R1 - R2| = ${diff}Ω (ต้องต่างกัน ≥ 200Ω ที่ 9.0V)`,
      };
    }
    if (m.id === 'm4') {
      const ratio = telemetry.I2_mA > 0.1 ? telemetry.I_mA / telemetry.I2_mA : 0;
      const passed =
        currentLesson.mode === 'PARALLEL' &&
        led1Inserted &&
        led2Inserted &&
        ratio >= 2.0 &&
        telemetry.I2_mA > 2;
      return {
        passed,
        statusTh: passed
          ? `🎉 สำเร็จ! กิ่งที่ 1 (${telemetry.I_mA.toFixed(1)} mA) > 2× กิ่งที่ 2 (${telemetry.I2_mA.toFixed(1)} mA)`
          : `I1 = ${telemetry.I_mA.toFixed(1)} mA, I2 = ${telemetry.I2_mA.toFixed(1)} mA (อัตราส่วน ${ratio.toFixed(2)}×)`,
      };
    }
    if (m.id === 'm5') {
      const passed =
        !isBurned &&
        Vs >= 10 &&
        R <= 150 &&
        resistorWattage >= 0.5 &&
        telemetry.P_mW > 250 &&
        telemetry.P_mW <= resistorWattage * 1000;
      return {
        passed,
        statusTh: passed
          ? `🎉 สำเร็จ! ตัวต้านทาน ${resistorWattage}W ทนกำลังไฟ ${telemetry.P_mW.toFixed(0)} mW ได้สบาย`
          : `กำลังไฟ ${telemetry.P_mW.toFixed(0)} mW vs พิกัด ${(resistorWattage * 1000).toFixed(0)} mW`,
      };
    }
    if (m.id === 'm6') {
      const passed =
        currentLesson.mode === 'BREAKER' &&
        !breakerTripped &&
        wireGaugeMm2 >= 2.5 &&
        breakerRatingA >= 20 &&
        telemetry.I_mA > 5;
      return {
        passed,
        statusTh: passed
          ? `🎉 สำเร็จ! สาย ${wireGaugeMm2} ตร.มม. + CB ${breakerRatingA}A ปลอดภัยตาม มอก.11-2553`
          : `ขนาดสายปัจจุบัน: ${wireGaugeMm2} ตร.มม., CB: ${breakerRatingA}A`,
      };
    }
    if (m.id === 'm7') {
      const passed =
        currentLesson.mode === 'SAFETY_GROUND' &&
        lightLevel >= 50 &&
        sw2Closed &&
        telemetry.touchVoltage < 5;
      return {
        passed,
        statusTh: passed
          ? `🎉 สำเร็จ! สายดิน G พากระแสรั่วลงดิน แรงดันสัมผัสเหลือเพียง ${telemetry.touchVoltage.toFixed(1)}V`
          : `แรงดันสัมผัสที่โครงโลหะ: ${telemetry.touchVoltage.toFixed(0)}V (ความชื้น ${lightLevel}%)`,
      };
    }
    const passed =
      currentLesson.mode === 'TROUBLESHOOT' && faultRepaired && telemetry.I_mA > 10;
    return {
      passed,
      statusTh: passed
        ? `🎉 สำเร็จ! ซ่อมจุดเสียเรียบร้อย กระแสไหลปกติ ${telemetry.I_mA.toFixed(1)} mA`
        : 'วงจรยังขัดข้อง: ใช้มัลติมิเตอร์ตรวจเช็กแล้วกดปุ่มซ่อมจุดชำรุด',
    };
  }, [
    currentMission,
    wiringChallengeMode,
    wiringStatus,
    telemetry,
    isBurned,
    R,
    R2,
    Vs,
    led1Inserted,
    led2Inserted,
    resistorWattage,
    wireGaugeMm2,
    breakerRatingA,
    breakerTripped,
    lightLevel,
    sw2Closed,
    faultRepaired,
    currentLesson.mode,
  ]);

  // บันทึกภารกิจที่ผ่านระหว่าง render (React แนะนำแบบนี้แทน setState ใน effect ที่ทำให้ render ซ้ำ)
  // ส่วนเสียงเป็น side effect จึงเล่นใน effect เมื่อจำนวนภารกิจที่ผ่านเพิ่มขึ้น
  if (missionMode && missionEval.passed && !completedMissions.has(currentMission.id)) {
    setCompletedMissions(new Set(completedMissions).add(currentMission.id));
  }
  const completedMissionCountRef = useRef(completedMissions.size);
  useEffect(() => {
    if (completedMissions.size > completedMissionCountRef.current) playLabSound('chime', soundEnabled);
    completedMissionCountRef.current = completedMissions.size;
  }, [completedMissions.size, soundEnabled]);

  const handleMarkLessonComplete = useCallback(() => {
    const next = new Set(completedLessons);
    next.add(currentLesson.id);
    setCompletedLessons(next);
    saveCompletedLessons(next);
    playLabSound('chime', soundEnabled);
    const score = Math.min(600, next.size * 10);
    void recordGame(score, `e101-${currentLesson.id}`, 600);
  }, [completedLessons, currentLesson.id, recordGame, soundEnabled]);

  const handleSelectPartAndFocus = useCallback((partId: SelectablePartId) => {
    setSelectedPart(partId);
    const topo = TOPOLOGY_DEFINITIONS[simRef.current.mode] || TOPOLOGY_DEFINITIONS.DC;
    if (!uiFlagsRef.current.buildOnBreadboard) {
      const found = topo.parts.find((p) => p.id === partId);
      if (found) {
        camControlRef.current?.focusOn(found.x, found.z);
      }
    } else {
      const foundBb = topo.bbParts.find((p) => p.id === partId);
      if (foundBb && foundBb.pins[0]) {
        const [wx, , wz] = holeToWorld(foundBb.pins[0]);
        camControlRef.current?.focusOn(wx, wz);
      }
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClockTime(new Date().toTimeString().split(' ')[0]);
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Three.js Isometric Orthographic 3D Workbench Engine
  useEffect(() => {
    const shell = shellRef.current;
    const canvas = canvasRef.current;
    const labelsLayer = labelsLayerRef.current;
    if (!shell || !canvas || !labelsLayer) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    const initW = Math.max(320, shell.clientWidth);
    const initH = Math.max(320, shell.clientHeight);
    renderer.setSize(initW, initH);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5efe3);

    const frustumHalfH = 4.65;
    const initAspect = initW / initH;
    const camera = new THREE.OrthographicCamera(
      -frustumHalfH * initAspect,
      frustumHalfH * initAspect,
      frustumHalfH,
      -frustumHalfH,
      0.1,
      120,
    );

    const DEFAULT_TARGET = new THREE.Vector3(1.35, 0.15, 0.15);
    const camTarget = DEFAULT_TARGET.clone();
    const desiredTarget = DEFAULT_TARGET.clone();
    const camDist = 24;
    let camZoom = 1.0;
    let desiredZoom = 1.0;
    let camTheta = -0.58;
    let desiredTheta = -0.58;
    let camPhi = 0.96;
    let desiredPhi = 0.96;

    camControlRef.current = {
      reset: () => {
        desiredTarget.copy(DEFAULT_TARGET);
        desiredZoom = 1.0;
        desiredTheta = -0.58;
        desiredPhi = 0.96;
      },
      topView: () => {
        desiredTarget.set(1.2, 0.1, 0);
        desiredZoom = 1.08;
        desiredTheta = 0;
        desiredPhi = 0.12;
      },
      rotateBy: (dTheta: number) => {
        desiredTheta += dTheta;
      },
      zoomBy: (dZ: number) => {
        desiredZoom = Math.max(0.62, Math.min(2.1, desiredZoom + dZ));
      },
      focusOn: (x: number, z: number) => {
        desiredTarget.set(x * 0.35 + 1.1, 0.15, z * 0.35);
      },
    };

    function updateCameraOrbit() {
      camTarget.lerp(desiredTarget, 0.14);
      if (Math.abs(desiredZoom - camZoom) > 0.001) {
        camZoom += (desiredZoom - camZoom) * 0.14;
        camera.zoom = camZoom;
        camera.updateProjectionMatrix();
      }
      camTheta += (desiredTheta - camTheta) * 0.14;
      camPhi += (desiredPhi - camPhi) * 0.14;
      camera.position.x = camTarget.x + camDist * Math.sin(camPhi) * Math.sin(camTheta);
      camera.position.y = camTarget.y + camDist * Math.cos(camPhi);
      camera.position.z = camTarget.z + camDist * Math.sin(camPhi) * Math.cos(camTheta);
      camera.lookAt(camTarget);
    }

    const hemiLight = new THREE.HemisphereLight(0xfffbeb, 0xd6cebe, 1.2);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.3);
    dirLight.position.set(8, 16, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(1024, 1024);
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 40;
    const d = 8.5;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);

    const gridHelper = new THREE.GridHelper(32, 32, 0xd8cfc0, 0xe7dfd0);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(34, 34),
      new THREE.ShadowMaterial({ opacity: 0.1 }),
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    const circuitRoot = new THREE.Group();
    scene.add(circuitRoot);

    const breadboardTex = createBreadboardTexture();
    const dmmCanvas = document.createElement('canvas');
    dmmCanvas.width = 256;
    dmmCanvas.height = 128;
    const dmmCtx = dmmCanvas.getContext('2d');
    const dmmTex = new THREE.CanvasTexture(dmmCanvas);

    let lastBatteryVolts = -1;
    let batteryTex = createBatteryTexture(3.0);
    let puckTopTex = createPowerPuckTopTexture(3.0);

    interface AnimatedReferences {
      sw1Pivot?: THREE.Object3D;
      sw2Pivot?: THREE.Object3D;
      r1Bands: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshStandardMaterial>[];
      r2Bands: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshStandardMaterial>[];
      led1Mat?: THREE.MeshStandardMaterial;
      led1Light?: THREE.PointLight;
      led1Halo?: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
      led2Mat?: THREE.MeshStandardMaterial;
      led2Light?: THREE.PointLight;
      led2Halo?: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
      capRing?: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;
      lampCone?: THREE.Mesh<THREE.ConeGeometry, THREE.MeshBasicMaterial>;
      lampBulbMat?: THREE.MeshBasicMaterial;
      magnetGroup?: THREE.Group;
      magnetBasePos?: THREE.Vector3;
      heaterCoilMat?: THREE.MeshStandardMaterial;
      potKnobGroup?: THREE.Group;
      acCrankGroup?: THREE.Group;
      smokePuffs: {
        mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
        phase: number;
        origin: THREE.Vector3;
      }[];
      flowParticles: {
        mesh: THREE.Mesh;
        curve: THREE.Curve<THREE.Vector3>;
        t: number;
        branch: CurrentBranch;
      }[];
      interactiveTargets: { obj: THREE.Object3D; partId: SelectablePartId; toggleSw?: 1 | 2 }[];
    }

    let animRefs: AnimatedReferences = {
      r1Bands: [],
      r2Bands: [],
      smokePuffs: [],
      flowParticles: [],
      interactiveTargets: [],
    };

    interface PinEntry {
      id: SelectablePartId;
      title: string;
      pos: THREE.Vector3;
      el?: HTMLDivElement;
      valSpan?: HTMLSpanElement;
    }

    let pinsData: PinEntry[] = [];

    function buildBrassPost(x: number, y: number, z: number): THREE.Group {
      const g = new THREE.Group();
      g.position.set(x, y, z);
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.11, 0.16, 16),
        new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.65, roughness: 0.28 }),
      );
      addCartoonOutline(base, 1.07);
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.075, 0.075, 0.09, 16),
        new THREE.MeshStandardMaterial({ color: 0xfef08a, metalness: 0.75, roughness: 0.2 }),
      );
      cap.position.y = 0.11;
      g.add(base, cap);
      return g;
    }

    function buildWoodenBlock(w: number, d: number): THREE.Mesh {
      const wood = new THREE.Mesh(
        new THREE.BoxGeometry(w, 0.2, d),
        new THREE.MeshStandardMaterial({ color: 0xbe8e57, roughness: 0.75 }),
      );
      wood.position.y = 0.1;
      wood.castShadow = true;
      wood.receiveShadow = true;
      addBoxEdges(wood);
      return wood;
    }

    function buildResistorMesh(
      length: number,
      radius: number,
      bandSlot: 'r1' | 'r2' | 'none',
    ): THREE.Group {
      const g = new THREE.Group();
      const watt = uiFlagsRef.current.resistorWattage || 0.25;
      const wScale =
        bandSlot === 'r1'
          ? watt <= 0.13
            ? 0.84
            : watt <= 0.26
              ? 1.0
              : watt <= 0.55
                ? 1.24
                : 1.48
          : 1.0;
      const effLen = length * Math.min(1.22, 0.88 + (wScale - 1) * 0.45);
      const effRad = radius * wScale;

      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(effRad, effRad, effLen, 24),
        new THREE.MeshStandardMaterial({
          color: watt >= 0.9 ? 0x93c5fd : 0xe5c799,
          roughness: 0.42,
        }),
      );
      body.rotation.z = Math.PI / 2;
      body.castShadow = true;
      addCartoonOutline(body, 1.06);
      g.add(body);

      const offsets = [-0.32, -0.11, 0.1, 0.32].map((f) => f * effLen);
      const ohmVal = bandSlot === 'r2' ? (simRef.current.R2 ?? simRef.current.R) : simRef.current.R;
      const initColors = getResistorBandColors(ohmVal);
      offsets.forEach((xOff, idx) => {
        const bMat = new THREE.MeshStandardMaterial({
          color: idx === 3 ? '#d4af37' : initColors[idx],
          roughness: 0.3,
        });
        const bMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(effRad * 1.055, effRad * 1.055, effLen * 0.1, 20),
          bMat,
        );
        bMesh.rotation.z = Math.PI / 2;
        bMesh.position.x = xOff;
        g.add(bMesh);
        if (bandSlot === 'r1' && idx < 3) {
          animRefs.r1Bands.push(bMesh);
        } else if (bandSlot === 'r2' && idx < 3) {
          animRefs.r2Bands.push(bMesh);
        }
      });
      return g;
    }

    // Unified Single-Mesh LatheGeometry LED Capsule (No internal seam lines or ghost rings!)
    function buildLedAssembly(isRed: boolean, scale = 1): THREE.Group {
      const g = new THREE.Group();
      const burned = uiFlagsRef.current.isBurned;
      const baseColor = burned ? 0x1e293b : isRed ? 0xef4444 : 0x22c55e;
      const emisColor = burned ? 0x000000 : isRed ? 0xff1100 : 0x00ff44;

      const mat = new THREE.MeshStandardMaterial({
        color: baseColor,
        emissive: emisColor,
        emissiveIntensity: burned ? 0 : 0.35,
        roughness: 0.22,
        metalness: 0.05,
      });

      const r = 0.26 * scale;
      const cylH = 0.38 * scale;
      const rimH = 0.06 * scale;

      const pts: THREE.Vector2[] = [
        new THREE.Vector2(0, 0),
        new THREE.Vector2(r * 1.15, 0),
        new THREE.Vector2(r * 1.15, rimH),
        new THREE.Vector2(r, rimH),
        new THREE.Vector2(r, cylH),
      ];
      for (let i = 1; i <= 10; i++) {
        const ang = (i / 10) * (Math.PI / 2);
        pts.push(new THREE.Vector2(r * Math.cos(ang), cylH + r * Math.sin(ang)));
      }

      const latheGeo = new THREE.LatheGeometry(pts, 28);
      const ledMesh = new THREE.Mesh(latheGeo, mat);
      ledMesh.castShadow = true;
      addCartoonOutline(ledMesh, 1.055);

      const haloMat = new THREE.MeshBasicMaterial({
        color: isRed ? 0xfca5a5 : 0x86efac,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const halo = new THREE.Mesh(new THREE.SphereGeometry(r * 1.9, 20, 20), haloMat);
      halo.position.y = cylH * 0.85;

      const ptLight = new THREE.PointLight(isRed ? 0xff4422 : 0x22ff55, 0, 4.5);
      ptLight.position.y = cylH + 0.2;

      g.add(ledMesh, halo, ptLight);

      if (isRed) {
        animRefs.led1Mat = mat;
        animRefs.led1Light = ptLight;
        animRefs.led1Halo = halo;
      } else {
        animRefs.led2Mat = mat;
        animRefs.led2Light = ptLight;
        animRefs.led2Halo = halo;
      }
      return g;
    }

    function addSmokeEmitterAt(origin: THREE.Vector3) {
      const puffGeo = new THREE.SphereGeometry(0.16, 12, 12);
      for (let i = 0; i < 10; i++) {
        const puffMat = new THREE.MeshBasicMaterial({
          color: i % 2 === 0 ? 0x475569 : 0x64748b,
          transparent: true,
          opacity: 0,
        });
        const puff = new THREE.Mesh(puffGeo, puffMat);
        circuitRoot.add(puff);
        animRefs.smokePuffs.push({
          mesh: puff,
          phase: i / 10,
          origin: origin.clone(),
        });
      }
    }

    function buildSensorStimulusModel(
      stimPos: THREE.Vector3,
      ldrTargetPos: THREE.Vector3,
      lessonId: string,
    ): THREE.Group {
      if (lessonId === 's4' || lessonId === 's7') {
        const magGroup = new THREE.Group();
        magGroup.position.copy(stimPos);
        const nHalf = new THREE.Mesh(
          new THREE.BoxGeometry(0.55, 0.28, 0.36),
          new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35 }),
        );
        nHalf.position.set(-0.275, 0.65, 0);
        addBoxEdges(nHalf);
        const sHalf = new THREE.Mesh(
          new THREE.BoxGeometry(0.55, 0.28, 0.36),
          new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.35 }),
        );
        sHalf.position.set(0.275, 0.65, 0);
        addBoxEdges(sHalf);
        magGroup.add(nHalf, sHalf);
        animRefs.magnetGroup = magGroup;
        animRefs.magnetBasePos = ldrTargetPos.clone();
        return magGroup;
      }

      if (lessonId === 's3' || lessonId === 's5') {
        const heatGroup = new THREE.Group();
        heatGroup.position.copy(stimPos);
        const base = new THREE.Mesh(
          new THREE.CylinderGeometry(0.42, 0.46, 0.2, 24),
          new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 }),
        );
        base.position.y = 0.1;
        addCartoonOutline(base, 1.05);
        const coilMat = new THREE.MeshStandardMaterial({
          color: 0xf97316,
          emissive: 0xdc2626,
          emissiveIntensity: 0.6,
          roughness: 0.3,
        });
        const coil = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.08, 14, 28), coilMat);
        coil.rotation.x = Math.PI / 2;
        coil.position.y = 0.65;
        addCartoonOutline(coil, 1.05);
        animRefs.heaterCoilMat = coilMat;
        heatGroup.add(base, coil);
        return heatGroup;
      }

      const lampGroup = new THREE.Group();
      lampGroup.position.copy(stimPos);

      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.48, 0.18, 24),
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 }),
      );
      base.position.y = 0.09;
      base.castShadow = true;
      addCartoonOutline(base, 1.05);

      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.055, 1.38, 14),
        new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.5, roughness: 0.3 }),
      );
      stem.position.set(0, 0.78, 0);
      addCartoonOutline(stem, 1.05);

      const headPivot = new THREE.Group();
      headPivot.position.set(0, 1.45, 0);
      const localTarget = ldrTargetPos.clone().sub(stimPos);
      headPivot.lookAt(localTarget);

      const shade = new THREE.Mesh(
        new THREE.ConeGeometry(0.34, 0.48, 24, 1, true),
        new THREE.MeshStandardMaterial({
          color: 0xd9483b,
          roughness: 0.35,
          side: THREE.DoubleSide,
        }),
      );
      shade.rotation.x = -Math.PI / 2;
      shade.position.z = 0.18;
      addCartoonOutline(shade, 1.05);

      const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfef9c3 });
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), bulbMat);
      bulb.position.z = 0.22;
      animRefs.lampBulbMat = bulbMat;

      const distToLdr = Math.max(1.2, localTarget.distanceTo(new THREE.Vector3(0, 1.45, 0)));
      const coneMat = new THREE.MeshBasicMaterial({
        color: 0xfde047,
        transparent: true,
        opacity: 0.26,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(0.62, distToLdr, 24, 1, true),
        coneMat,
      );
      cone.rotation.x = -Math.PI / 2;
      cone.position.z = 0.22 + distToLdr / 2;
      animRefs.lampCone = cone;

      headPivot.add(shade, bulb, cone);
      lampGroup.add(base, stem, headPivot);
      return lampGroup;
    }

    // Concentric Tube Geometry Builder (100% zero offset black outline!)
    function addConcentricTube(
      pts: THREE.Vector3[],
      colorHex: string | number,
      radius: number,
      tension = 0.08,
      metal = false,
    ): THREE.CatmullRomCurve3 | null {
      if (pts.length < 2) return null;
      const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', tension);
      const segs = Math.max(24, pts.length * 16);

      const innerGeo = new THREE.TubeGeometry(curve, segs, radius, 12, false);
      const innerMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness: metal ? 0.22 : 0.42,
        metalness: metal ? 0.8 : 0.1,
      });
      const innerMesh = new THREE.Mesh(innerGeo, innerMat);
      innerMesh.castShadow = true;

      const outerGeo = new THREE.TubeGeometry(curve, segs, radius + 0.012, 12, false);
      const outerMat = new THREE.MeshBasicMaterial({
        color: INK_HEX,
        side: THREE.BackSide,
      });
      const outerMesh = new THREE.Mesh(outerGeo, outerMat);

      circuitRoot.add(innerMesh, outerMesh);
      return curve;
    }

    function addWireWithParticles(
      pts: THREE.Vector3[],
      colorHex: string,
      branch: CurrentBranch,
      radius = 0.05,
    ) {
      const curve = addConcentricTube(pts, colorHex, radius, 0.08, false);
      if (!curve) return;

      if (branch !== 'none') {
        const len = curve.getLength();
        const count = Math.max(3, Math.min(12, Math.round(len * 2.1)));
        const pGeo = new THREE.SphereGeometry(radius * 1.15, 10, 10);
        const pMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
        for (let i = 0; i < count; i++) {
          const pm = new THREE.Mesh(pGeo, pMat);
          circuitRoot.add(pm);
          animRefs.flowParticles.push({
            mesh: pm,
            curve,
            t: i / count,
            branch,
          });
        }
      }
    }

    // Build a 3D Multimeter Handheld Probe Pen touching a breadboard hole
    function buildProbePenAt(targetHole: [number, number, number], colorHex: number): THREE.Vector3 {
      const [hx, hy, hz] = targetHole;
      const penGroup = new THREE.Group();
      penGroup.position.set(hx, hy, hz);
      // Tilt the probe pen back slightly towards the multimeter
      penGroup.rotation.x = -0.32;
      penGroup.rotation.z = colorHex === 0xdc2626 ? -0.15 : 0.15;

      const needle = new THREE.Mesh(
        new THREE.ConeGeometry(0.025, 0.22, 12),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.15 }),
      );
      needle.rotation.x = Math.PI;
      needle.position.y = 0.11;

      const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.04, 0.62, 14),
        new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.35 }),
      );
      handle.position.y = 0.52;
      addCartoonOutline(handle, 1.07);

      penGroup.add(needle, handle);
      circuitRoot.add(penGroup);

      // Compute world position of the top of the probe pen for the cable attachment
      const topLocal = new THREE.Vector3(0, 0.83, 0);
      penGroup.updateMatrixWorld(true);
      return topLocal.applyMatrix4(penGroup.matrixWorld);
    }

    function disposeSceneObject(root: THREE.Object3D, sharedTextures: Set<THREE.Texture>) {
      root.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.Points) {
          obj.geometry?.dispose();
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((mat) => {
            if (!mat) return;
            const std = mat as THREE.MeshStandardMaterial;
            if (std.map && !sharedTextures.has(std.map)) std.map.dispose();
            mat.dispose();
          });
        }
      });
    }

    function rebuildCircuitScene() {
      const sharedTexSet = new Set<THREE.Texture>([breadboardTex, dmmTex, batteryTex, puckTopTex]);
      while (circuitRoot.children.length > 0) {
        const child = circuitRoot.children[0];
        circuitRoot.remove(child);
        disposeSceneObject(child, sharedTexSet);
      }
      animRefs = {
        r1Bands: [],
        r2Bands: [],
        smokePuffs: [],
        flowParticles: [],
        interactiveTargets: [],
      };
      pinsData = [];

      const flags = uiFlagsRef.current;
      const s = simRef.current;
      solveElectronicsPhysicsStep(s, 0);
      const topo = TOPOLOGY_DEFINITIONS[s.mode] || TOPOLOGY_DEFINITIONS.DC;

      scene.background = new THREE.Color(flags.darkTheme ? 0x0d111a : 0xf5efe3);

      if (Math.abs(lastBatteryVolts - s.Vs) > 0.05) {
        batteryTex.dispose();
        puckTopTex.dispose();
        batteryTex = createBatteryTexture(s.Vs);
        puckTopTex = createPowerPuckTopTexture(s.Vs);
        lastBatteryVolts = s.Vs;
      }

      if (dmmCtx) {
        updateDmmScreenTexture(dmmCtx, dmmTex, s.Vload, s.I_mA, s.R_ldr, s.mode);
      }

      const leadMat = new THREE.MeshStandardMaterial({
        color: 0xcbd5e1,
        metalness: 0.85,
        roughness: 0.2,
      });

      if (!flags.buildOnBreadboard) {
        // ============================================================
        // MODE A: WITHOUT A BREADBOARD (WOODEN LAB BLOCKS)
        // ============================================================
        const ldrPart = topo.parts.find((p) => p.kind === 'ldr');
        const ldrWorldPos = ldrPart
          ? new THREE.Vector3(ldrPart.x, 0.65, ldrPart.z)
          : new THREE.Vector3(0, 0.5, 0);

        topo.parts.forEach((part: LabBlockPart) => {
          if (part.kind === 'lamp') {
            const stimMesh = buildSensorStimulusModel(
              new THREE.Vector3(part.x, 0, part.z),
              ldrWorldPos,
              flags.lessonId,
            );
            circuitRoot.add(stimMesh);
            animRefs.interactiveTargets.push({ obj: stimMesh, partId: 'ldr' });
            return;
          }

          const group = new THREE.Group();
          group.position.set(part.x, 0, part.z);
          group.rotation.y = part.rotY ?? 0;

          if (part.kind === 'battery') {
            const cradle = buildWoodenBlock(1.38, 2.48);
            const cell = new THREE.Mesh(
              new THREE.CylinderGeometry(0.52, 0.52, 2.08, 28),
              new THREE.MeshStandardMaterial({ map: batteryTex, roughness: 0.35 }),
            );
            cell.rotation.x = Math.PI / 2;
            cell.position.y = 0.58;
            cell.castShadow = true;
            addCartoonOutline(cell, 1.04);

            const nub = new THREE.Mesh(
              new THREE.CylinderGeometry(0.2, 0.2, 0.14, 20),
              leadMat,
            );
            nub.rotation.x = Math.PI / 2;
            nub.position.set(0, 0.58, -1.08);
            addCartoonOutline(nub, 1.06);

            const postPos = buildBrassPost(0, 0.24, -1.18);
            const postNeg = buildBrassPost(0, 0.24, 1.18);
            group.add(cradle, cell, nub, postPos, postNeg);

            if (s.mode === 'AC') {
              const crankGroup = new THREE.Group();
              crankGroup.position.set(0, 0.85, 0);
              const wheel = new THREE.Mesh(
                new THREE.CylinderGeometry(0.45, 0.45, 0.1, 24),
                new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.7 }),
              );
              addCartoonOutline(wheel, 1.05);
              const arm = new THREE.Mesh(
                new THREE.BoxGeometry(0.55, 0.08, 0.12),
                leadMat,
              );
              arm.position.set(0.22, 0.1, 0);
              const knob = new THREE.Mesh(
                new THREE.CylinderGeometry(0.08, 0.08, 0.28, 14),
                new THREE.MeshStandardMaterial({ color: 0xdc2626 }),
              );
              knob.position.set(0.45, 0.24, 0);
              crankGroup.add(wheel, arm, knob);
              group.add(crankGroup);
              animRefs.acCrankGroup = crankGroup;
            }

            animRefs.interactiveTargets.push({ obj: group, partId: 'supply' });
            pinsData.push({
              id: 'supply',
              title: part.label,
              pos: new THREE.Vector3(part.x, 1.38, part.z),
            });
          } else if (part.kind === 'switch') {
            const wood = buildWoodenBlock(1.52, 0.78);
            const p1 = buildBrassPost(-0.66, 0.24, 0);
            const p2 = buildBrassPost(0.66, 0.24, 0);

            const pivot = new THREE.Group();
            pivot.position.set(-0.66, 0.34, 0);
            const blade = new THREE.Mesh(
              new THREE.BoxGeometry(1.2, 0.065, 0.13),
              new THREE.MeshStandardMaterial({
                color: 0xd97706,
                metalness: 0.75,
                roughness: 0.25,
              }),
            );
            blade.position.set(0.58, 0, 0);
            addBoxEdges(blade);

            const handle = new THREE.Mesh(
              new THREE.CylinderGeometry(0.12, 0.12, 0.4, 16),
              new THREE.MeshStandardMaterial({
                color: part.id === 'sw2' ? 0x2563eb : 0x3b82f6,
                roughness: 0.35,
              }),
            );
            handle.rotation.z = Math.PI / 2;
            handle.position.set(1.2, 0.03, 0);
            addCartoonOutline(handle, 1.06);

            pivot.add(blade, handle);
            group.add(wood, p1, p2, pivot);

            if (part.id === 'sw1') animRefs.sw1Pivot = pivot;
            else animRefs.sw2Pivot = pivot;

            animRefs.interactiveTargets.push({
              obj: group,
              partId: part.id,
              toggleSw: part.id === 'sw2' ? 2 : 1,
            });
            pinsData.push({
              id: part.id,
              title: part.label,
              pos: new THREE.Vector3(part.x, 1.1, part.z),
            });
          } else if (part.kind === 'resistor') {
            const wood = buildWoodenBlock(1.56, 0.74);
            const p1 = buildBrassPost(-0.68, 0.24, 0);
            const p2 = buildBrassPost(0.68, 0.24, 0);

            const legL = new THREE.Mesh(
              new THREE.CylinderGeometry(0.035, 0.035, 0.38, 12),
              leadMat,
            );
            legL.position.set(-0.68, 0.48, 0);
            const legR = legL.clone();
            legR.position.set(0.68, 0.48, 0);
            const bar = new THREE.Mesh(
              new THREE.CylinderGeometry(0.035, 0.035, 1.36, 12),
              leadMat,
            );
            bar.rotation.z = Math.PI / 2;
            bar.position.y = 0.66;

            const resBody = buildResistorMesh(
              0.88,
              0.19,
              part.id === 'r1' ? 'r1' : part.id === 'r2' ? 'r2' : 'none',
            );
            resBody.position.y = 0.66;

            if (
              (flags.lessonId === 'r6' && part.id === 'r1') ||
              (flags.lessonId === 's6' && part.id === 'r2')
            ) {
              const potDial = new THREE.Group();
              potDial.position.set(0, 0.92, 0);
              const knob = new THREE.Mesh(
                new THREE.CylinderGeometry(0.28, 0.3, 0.22, 20),
                new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.35 }),
              );
              addCartoonOutline(knob, 1.06);
              const pointerLine = new THREE.Mesh(
                new THREE.BoxGeometry(0.06, 0.24, 0.26),
                new THREE.MeshBasicMaterial({ color: 0xffffff }),
              );
              pointerLine.position.z = -0.06;
              potDial.add(knob, pointerLine);
              group.add(potDial);
              animRefs.potKnobGroup = potDial;
            }

            group.add(wood, p1, p2, legL, legR, bar, resBody);
            animRefs.interactiveTargets.push({ obj: group, partId: part.id });
            pinsData.push({
              id: part.id,
              title: part.label,
              pos: new THREE.Vector3(part.x, 1.2, part.z),
            });
          } else if (part.kind === 'led_red' || part.kind === 'led_green') {
            const wood = buildWoodenBlock(1.18, 0.78);
            const p1 = buildBrassPost(-0.46, 0.24, 0);
            const p2 = buildBrassPost(0.46, 0.24, 0);

            const leg1 = new THREE.Mesh(
              new THREE.CylinderGeometry(0.036, 0.036, 0.48, 12),
              leadMat,
            );
            leg1.position.set(-0.15, 0.5, 0);
            const leg2 = leg1.clone();
            leg2.position.set(0.15, 0.5, 0);

            const bridge1 = new THREE.Mesh(
              new THREE.CylinderGeometry(0.035, 0.035, 0.31, 12),
              leadMat,
            );
            bridge1.rotation.z = Math.PI / 2;
            bridge1.position.set(-0.3, 0.33, 0);
            const bridge2 = bridge1.clone();
            bridge2.position.set(0.3, 0.33, 0);

            const isPlugged =
              part.id === 'led2' ? flags.led2Inserted : flags.led1Inserted;
            const led = buildLedAssembly(part.kind === 'led_red', 1.15);
            led.position.y = isPlugged ? 0.68 : 1.12;

            if (part.id === 'led1') {
              addSmokeEmitterAt(new THREE.Vector3(part.x, 1.35, part.z));
            }

            group.add(wood, p1, p2, leg1, leg2, bridge1, bridge2, led);
            animRefs.interactiveTargets.push({ obj: group, partId: part.id });
            pinsData.push({
              id: part.id,
              title: part.label,
              pos: new THREE.Vector3(part.x, 1.75, part.z),
            });
          } else if (part.kind === 'fuse') {
            const wood = buildWoodenBlock(1.48, 0.78);
            const p1 = buildBrassPost(-0.62, 0.24, 0);
            const p2 = buildBrassPost(0.62, 0.24, 0);

            const capL = new THREE.Mesh(
              new THREE.CylinderGeometry(0.18, 0.18, 0.22, 20),
              leadMat,
            );
            capL.rotation.z = Math.PI / 2;
            capL.position.set(-0.36, 0.56, 0);
            addCartoonOutline(capL, 1.06);

            const capR = capL.clone();
            capR.position.set(0.36, 0.56, 0);

            const glassTube = new THREE.Mesh(
              new THREE.CylinderGeometry(0.16, 0.16, 0.56, 24),
              new THREE.MeshStandardMaterial({
                color: flags.fuseBlown ? 0x64748b : 0xe0f2fe,
                transparent: true,
                opacity: 0.52,
                roughness: 0.15,
              }),
            );
            glassTube.rotation.z = Math.PI / 2;
            glassTube.position.set(0, 0.56, 0);
            addCartoonOutline(glassTube, 1.05);

            if (!flags.fuseBlown) {
              const filament = new THREE.Mesh(
                new THREE.CylinderGeometry(0.024, 0.024, 0.54, 12),
                new THREE.MeshStandardMaterial({
                  color: 0xf59e0b,
                  emissive: 0xd97706,
                  emissiveIntensity: 0.4,
                }),
              );
              filament.rotation.z = Math.PI / 2;
              filament.position.set(0, 0.56, 0);
              group.add(filament);
            } else {
              addSmokeEmitterAt(new THREE.Vector3(part.x, 0.9, part.z));
            }

            group.add(wood, p1, p2, capL, capR, glassTube);
            animRefs.interactiveTargets.push({ obj: group, partId: 'fuse1' });
            pinsData.push({
              id: 'fuse1',
              title: part.label,
              pos: new THREE.Vector3(part.x, 1.18, part.z),
            });
          } else if (part.kind === 'breaker') {
            const wood = buildWoodenBlock(1.48, 0.92);
            const p1 = buildBrassPost(-0.62, 0.24, 0);
            const p2 = buildBrassPost(0.62, 0.24, 0);

            const mcbBody = new THREE.Mesh(
              new THREE.BoxGeometry(0.92, 0.72, 0.66),
              new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4 }),
            );
            mcbBody.position.set(0, 0.56, 0);
            addBoxEdges(mcbBody);

            const statusWin = new THREE.Mesh(
              new THREE.BoxGeometry(0.32, 0.1, 0.22),
              new THREE.MeshBasicMaterial({
                color:
                  s.switchClosed && !flags.breakerTripped ? 0x22c55e : 0xdc2626,
              }),
            );
            statusWin.position.set(-0.2, 0.93, 0);

            const pivot = new THREE.Group();
            pivot.position.set(0.12, 0.92, 0);
            const lever = new THREE.Mesh(
              new THREE.BoxGeometry(0.18, 0.34, 0.36),
              new THREE.MeshStandardMaterial({
                color: flags.breakerTripped ? 0xdc2626 : 0x0f766e,
                roughness: 0.35,
              }),
            );
            lever.position.set(0, 0.14, 0);
            addBoxEdges(lever);
            pivot.add(lever);
            animRefs.sw1Pivot = pivot;

            group.add(wood, p1, p2, mcbBody, statusWin, pivot);
            animRefs.interactiveTargets.push({
              obj: group,
              partId: 'sw1',
              toggleSw: 1,
            });
            pinsData.push({
              id: 'sw1',
              title: part.label,
              pos: new THREE.Vector3(part.x, 1.48, part.z),
            });
          } else if (part.kind === 'earth_rod') {
            const wood = buildWoodenBlock(1.46, 0.78);
            const p1 = buildBrassPost(-0.62, 0.24, 0);
            const p2 = buildBrassPost(0.62, 0.24, 0);

            const copperRod = new THREE.Mesh(
              new THREE.CylinderGeometry(0.11, 0.08, 1.15, 20),
              new THREE.MeshStandardMaterial({
                color: 0xb45309,
                metalness: 0.75,
                roughness: 0.25,
              }),
            );
            copperRod.position.set(0.35, 0.42, 0);
            addCartoonOutline(copperRod, 1.06);

            const pivot = new THREE.Group();
            pivot.position.set(-0.62, 0.34, 0);
            const blade = new THREE.Mesh(
              new THREE.BoxGeometry(0.95, 0.06, 0.12),
              new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.3 }),
            );
            blade.position.set(0.46, 0, 0);
            addBoxEdges(blade);
            pivot.add(blade);
            animRefs.sw2Pivot = pivot;

            group.add(wood, p1, p2, copperRod, pivot);
            animRefs.interactiveTargets.push({
              obj: group,
              partId: 'sw2',
              toggleSw: 2,
            });
            pinsData.push({
              id: 'sw2',
              title: part.label,
              pos: new THREE.Vector3(part.x, 1.25, part.z),
            });
          } else if (part.kind === 'capacitor') {
            const wood = buildWoodenBlock(1.18, 0.8);
            const p1 = buildBrassPost(-0.46, 0.24, 0);
            const p2 = buildBrassPost(0.46, 0.24, 0);

            const cyl = new THREE.Mesh(
              new THREE.CylinderGeometry(0.34, 0.34, 0.86, 24),
              new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.35 }),
            );
            cyl.position.y = 0.78;
            cyl.castShadow = true;
            addCartoonOutline(cyl, 1.05);

            const top = new THREE.Mesh(
              new THREE.CylinderGeometry(0.3, 0.3, 0.04, 24),
              leadMat,
            );
            top.position.y = 1.22;

            const ringMat = new THREE.MeshBasicMaterial({
              color: 0x14b8a6,
              transparent: true,
              opacity: 0.3,
            });
            const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.04, 12, 28), ringMat);
            ring.rotation.x = Math.PI / 2;
            ring.position.y = 0.34;
            animRefs.capRing = ring;

            group.add(wood, p1, p2, cyl, top, ring);
            animRefs.interactiveTargets.push({ obj: group, partId: 'cap1' });
            pinsData.push({
              id: 'cap1',
              title: part.label,
              pos: new THREE.Vector3(part.x, 1.55, part.z),
            });
          } else if (part.kind === 'bjt') {
            const wood = buildWoodenBlock(1.18, 1.18);
            const pC = buildBrassPost(0, 0.24, -0.45);
            const pB = buildBrassPost(-0.48, 0.24, 0);
            const pE = buildBrassPost(0, 0.24, 0.45);

            const to92 = new THREE.Mesh(
              new THREE.CylinderGeometry(0.32, 0.32, 0.62, 24, 1, false, 0, Math.PI),
              new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35 }),
            );
            to92.position.y = 0.86;
            to92.castShadow = true;
            addCartoonOutline(to92, 1.06);

            [-0.16, 0, 0.16].forEach((zOff) => {
              const leg = new THREE.Mesh(
                new THREE.CylinderGeometry(0.03, 0.03, 0.5, 10),
                leadMat,
              );
              leg.position.set(0, 0.46, zOff);
              group.add(leg);
            });

            group.add(wood, pC, pB, pE, to92);
            animRefs.interactiveTargets.push({ obj: group, partId: 'bjt1' });
            pinsData.push({
              id: 'bjt1',
              title: part.label,
              pos: new THREE.Vector3(part.x, 1.5, part.z),
            });
          } else if (part.kind === 'ldr') {
            const wood = buildWoodenBlock(1.2, 0.82);
            const p1 = buildBrassPost(-0.48, 0.24, 0);
            const p2 = buildBrassPost(0.48, 0.24, 0);

            const disc = new THREE.Mesh(
              new THREE.CylinderGeometry(0.36, 0.36, 0.15, 24),
              new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.4 }),
            );
            disc.position.y = 0.64;
            addCartoonOutline(disc, 1.06);

            const track = new THREE.Mesh(
              new THREE.CylinderGeometry(0.28, 0.28, 0.16, 20),
              new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35 }),
            );
            track.position.y = 0.645;

            const leg1 = new THREE.Mesh(
              new THREE.CylinderGeometry(0.032, 0.032, 0.42, 10),
              leadMat,
            );
            leg1.position.set(-0.2, 0.42, 0);
            const leg2 = leg1.clone();
            leg2.position.set(0.2, 0.42, 0);

            group.add(wood, p1, p2, disc, track, leg1, leg2);
            animRefs.interactiveTargets.push({ obj: group, partId: 'ldr' });
            pinsData.push({
              id: 'ldr',
              title: part.label,
              pos: new THREE.Vector3(part.x, 1.18, part.z),
            });
          }

          circuitRoot.add(group);
        });

        const wireRadius =
          s.mode === 'BREAKER'
            ? Math.max(0.032, Math.min(0.088, 0.028 + flags.wireGaugeMm2 * 0.014))
            : 0.052;
        topo.wires.forEach((w) => {
          const vecs = w.points.map(([x, y, z]) => new THREE.Vector3(x, y, z));
          addWireWithParticles(vecs, w.color, w.branch, wireRadius);
        });
      } else {
        // ============================================================
        // MODE B: ON A BREADBOARD (SOLDERLESS BREADBOARD WORKBENCH)
        // ============================================================
        const bbGroup = new THREE.Group();
        const sideMat = new THREE.MeshStandardMaterial({
          color: 0xe6decb,
          roughness: 0.55,
          transparent: flags.breadboardInside,
          opacity: flags.breadboardInside ? 0.68 : 1.0,
        });
        const topMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          map: breadboardTex,
          roughness: 0.45,
          transparent: flags.breadboardInside,
          opacity: flags.breadboardInside ? 0.68 : 1.0,
        });
        // Apply breadboard texture ONLY to top face (index 2)!
        const bbMaterials = [sideMat, sideMat, topMat, sideMat, sideMat, sideMat];
        const bbSlab = new THREE.Mesh(
          new THREE.BoxGeometry(BREADBOARD_WIDTH, 0.28, BREADBOARD_DEPTH),
          bbMaterials,
        );
        bbSlab.position.y = 0.14;
        bbSlab.receiveShadow = true;
        bbSlab.castShadow = true;
        addBoxEdges(bbSlab);
        bbGroup.add(bbSlab);

        if (flags.breadboardInside) {
          const active = getActiveBreadboardStrips(topo);
          for (let col = 1; col <= BREADBOARD_COLS; col++) {
            const x = (col - 12.5) * 0.28;
            const upperActive = active.upperCols.has(col);
            const lowerActive = active.lowerCols.has(col);

            const stripGeo = new THREE.BoxGeometry(0.11, 0.03, 1.08);
            const upStrip = new THREE.Mesh(
              stripGeo,
              new THREE.MeshBasicMaterial({
                color: upperActive ? 0x0d9488 : 0x94a3b8,
                transparent: true,
                opacity: upperActive ? 0.85 : 0.3,
              }),
            );
            upStrip.position.set(x, 0.284, -0.76);

            const lowStrip = new THREE.Mesh(
              stripGeo,
              new THREE.MeshBasicMaterial({
                color: lowerActive ? 0x0d9488 : 0x94a3b8,
                transparent: true,
                opacity: lowerActive ? 0.85 : 0.3,
              }),
            );
            lowStrip.position.set(x, 0.284, 0.76);
            bbGroup.add(upStrip, lowStrip);
          }

          const railGeo = new THREE.BoxGeometry(6.45, 0.03, 0.09);
          const posRail = new THREE.Mesh(
            railGeo,
            new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.7 }),
          );
          posRail.position.set(0, 0.284, 1.77);
          const negRail = new THREE.Mesh(
            railGeo,
            new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.7 }),
          );
          negRail.position.set(0, 0.284, 2.05);
          bbGroup.add(posRail, negRail);
        }

        circuitRoot.add(bbGroup);

        // Round Black Power Supply Puck with Top Voltage Label Texture (-4.4, 0, 1.55)
        const puckGroup = new THREE.Group();
        puckGroup.position.set(-4.4, 0, 1.55);
        const puckSideMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.38 });
        const puckTopMat = new THREE.MeshStandardMaterial({ map: puckTopTex, roughness: 0.35 });
        const puckCyl = new THREE.Mesh(
          new THREE.CylinderGeometry(0.7, 0.74, 0.42, 32),
          [puckSideMat, puckTopMat, puckSideMat],
        );
        puckCyl.position.y = 0.21;
        puckCyl.castShadow = true;
        addCartoonOutline(puckCyl, 1.05);

        const puckLed = new THREE.Mesh(
          new THREE.SphereGeometry(0.065, 12, 12),
          new THREE.MeshBasicMaterial({ color: s.switchClosed ? 0x22c55e : 0x64748b }),
        );
        puckLed.position.set(-0.36, 0.43, 0.16);
        puckGroup.add(puckCyl, puckLed);
        circuitRoot.add(puckGroup);
        animRefs.interactiveTargets.push({ obj: puckGroup, partId: 'supply' });
        pinsData.push({
          id: 'supply',
          title: 'POWER SUPPLY',
          pos: new THREE.Vector3(-4.4, 0.9, 1.55),
        });

        const [posHoleX, , posHoleZ] = holeToWorld({ col: 1, row: '+B' });
        const [negHoleX, , negHoleZ] = holeToWorld({ col: 2, row: '-B' });
        addConcentricTube(
          [
            new THREE.Vector3(-4.12, 0.38, 1.48),
            new THREE.Vector3(-4.12, 0.86, 1.48),
            new THREE.Vector3((-4.12 + posHoleX) / 2, 0.94, (1.48 + posHoleZ) / 2),
            new THREE.Vector3(posHoleX, 0.65, posHoleZ),
            new THREE.Vector3(posHoleX, 0.28, posHoleZ),
          ],
          '#dc2626',
          0.036,
          0.25,
          false,
        );
        addConcentricTube(
          [
            new THREE.Vector3(-4.48, 0.38, 1.66),
            new THREE.Vector3(-4.48, 0.92, 1.66),
            new THREE.Vector3((-4.48 + negHoleX) / 2, 0.98, (1.66 + negHoleZ) / 2),
            new THREE.Vector3(negHoleX, 0.68, negHoleZ),
            new THREE.Vector3(negHoleX, 0.28, negHoleZ),
          ],
          '#1e293b',
          0.036,
          0.25,
          false,
        );

        let ldrBbWorldPos = new THREE.Vector3(0, 0.6, -0.8);

        if (flags.breadboardStep !== 1) {
          const activeJumpers = flags.wiringChallengeMode ? flags.userJumpers : topo.bbJumpers;
          activeJumpers.forEach((j) => {
            const [x1, y1, z1] = holeToWorld(j.from);
            const [x2, y2, z2] = holeToWorld(j.to);
            addWireWithParticles(
              [
                new THREE.Vector3(x1, y1, z1),
                new THREE.Vector3(x1, 0.39, z1),
                new THREE.Vector3((x1 + x2) / 2, 0.41, (z1 + z2) / 2),
                new THREE.Vector3(x2, 0.39, z2),
                new THREE.Vector3(x2, y2, z2),
              ],
              j.color,
              flags.breadboardStep === 3 ? 'none' : j.branch,
              0.032,
            );
          });

          topo.bbParts.forEach((part) => {
            const [x1, , z1] = holeToWorld(part.pins[0]);
            const pin2 =
              flags.breadboardStep === 3 && part.id === 'led1'
                ? { col: part.pins[0].col, row: 'd' as BreadboardRow }
                : part.pins[1];
            const [x2, , z2] = holeToWorld(pin2);
            const mx = (x1 + x2) / 2;
            const mz = (z1 + z2) / 2;
            const angle = Math.atan2(z1 - z2, x2 - x1);
            const span = Math.hypot(x2 - x1, z2 - z1);

            const pGroup = new THREE.Group();

            if (part.kind === 'resistor') {
              // Continuous bent metallic lead from hole 1 through resistor body to hole 2
              addConcentricTube(
                [
                  new THREE.Vector3(x1, 0.28, z1),
                  new THREE.Vector3(x1, 0.49, z1),
                  new THREE.Vector3(x2, 0.49, z2),
                  new THREE.Vector3(x2, 0.28, z2),
                ],
                0xcbd5e1,
                0.02,
                0.04,
                true,
              );

              const resMesh = buildResistorMesh(
                Math.min(0.68, span * 0.68),
                0.13,
                part.id === 'r1' ? 'r1' : part.id === 'r2' ? 'r2' : 'none',
              );
              resMesh.position.set(mx, 0.49, mz);
              resMesh.rotation.y = angle;

              pGroup.add(resMesh);
              pinsData.push({
                id: part.id,
                title: part.label,
                pos: new THREE.Vector3(mx, 0.88, mz),
              });
            } else if (part.kind === 'fuse') {
              addConcentricTube(
                [
                  new THREE.Vector3(x1, 0.28, z1),
                  new THREE.Vector3(x1, 0.49, z1),
                  new THREE.Vector3(x2, 0.49, z2),
                  new THREE.Vector3(x2, 0.28, z2),
                ],
                0xcbd5e1,
                0.02,
                0.04,
                true,
              );
              const glass = new THREE.Mesh(
                new THREE.CylinderGeometry(0.13, 0.13, Math.min(0.62, span * 0.66), 20),
                new THREE.MeshStandardMaterial({
                  color: flags.fuseBlown ? 0xef4444 : 0xe0f2fe,
                  transparent: true,
                  opacity: 0.65,
                }),
              );
              glass.rotation.z = Math.PI / 2;
              glass.position.set(mx, 0.49, mz);
              glass.rotation.y = angle;
              addCartoonOutline(glass, 1.06);
              pGroup.add(glass);
              pinsData.push({
                id: 'fuse1',
                title: part.label,
                pos: new THREE.Vector3(mx, 0.88, mz),
              });
            } else if (part.kind === 'led_red' || part.kind === 'led_green') {
              const isPlugged =
                part.id === 'led2' ? flags.led2Inserted : flags.led1Inserted;
              // Leads go straight up from the 2 adjacent holes directly into the bottom rim of the LED!
              addConcentricTube(
                [
                  new THREE.Vector3(x1, 0.28, z1),
                  new THREE.Vector3(x1, 0.56, z1),
                  new THREE.Vector3(mx - (x2 - x1) * 0.28, 0.72, mz - (z2 - z1) * 0.28),
                ],
                0xcbd5e1,
                0.02,
                0.05,
                true,
              );
              addConcentricTube(
                [
                  new THREE.Vector3(x2, 0.28, z2),
                  new THREE.Vector3(x2, 0.56, z2),
                  new THREE.Vector3(mx + (x2 - x1) * 0.28, 0.72, mz + (z2 - z1) * 0.28),
                ],
                0xcbd5e1,
                0.02,
                0.05,
                true,
              );

              const led = buildLedAssembly(part.kind === 'led_red', 0.74);
              led.position.set(mx, isPlugged ? 0.7 : 1.06, mz);

              if (part.id === 'led1') {
                addSmokeEmitterAt(new THREE.Vector3(mx, 1.2, mz));
              }

              pGroup.add(led);
              pinsData.push({
                id: part.id,
                title: part.label,
                pos: new THREE.Vector3(mx, 1.44, mz),
              });
            } else if (part.kind === 'capacitor') {
              addConcentricTube(
                [new THREE.Vector3(x1, 0.28, z1), new THREE.Vector3(x1, 0.62, z1)],
                0xcbd5e1,
                0.02,
                0.02,
                true,
              );
              addConcentricTube(
                [new THREE.Vector3(x2, 0.28, z2), new THREE.Vector3(x2, 0.62, z2)],
                0xcbd5e1,
                0.02,
                0.02,
                true,
              );

              const cyl = new THREE.Mesh(
                new THREE.CylinderGeometry(0.22, 0.22, 0.52, 24),
                new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.35 }),
              );
              cyl.position.set(mx, 0.76, mz);
              addCartoonOutline(cyl, 1.06);

              const capTop = new THREE.Mesh(
                new THREE.CylinderGeometry(0.19, 0.19, 0.02, 24),
                leadMat,
              );
              capTop.position.set(mx, 1.03, mz);

              pGroup.add(cyl, capTop);
              pinsData.push({
                id: 'cap1',
                title: part.label,
                pos: new THREE.Vector3(mx, 1.28, mz),
              });
            } else if (part.kind === 'bjt' && part.pins[2]) {
              const [x3, , z3] = holeToWorld(part.pins[2]);
              [
                [x1, z1, -0.1],
                [x2, z2, 0],
                [x3, z3, 0.1],
              ].forEach(([lx, lz, dx]) => {
                addConcentricTube(
                  [
                    new THREE.Vector3(lx, 0.28, lz),
                    new THREE.Vector3(lx, 0.5, lz),
                    new THREE.Vector3(x2 + dx, 0.68, z2),
                  ],
                  0xcbd5e1,
                  0.018,
                  0.05,
                  true,
                );
              });
              const to92 = new THREE.Mesh(
                new THREE.CylinderGeometry(0.21, 0.21, 0.42, 20, 1, false, 0, Math.PI),
                new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35 }),
              );
              to92.position.set(x2, 0.82, z2);
              addCartoonOutline(to92, 1.06);
              pGroup.add(to92);
              pinsData.push({
                id: 'bjt1',
                title: part.label,
                pos: new THREE.Vector3(x2, 1.24, z2),
              });
            } else if (part.kind === 'ldr') {
              ldrBbWorldPos = new THREE.Vector3(mx, 0.68, mz);
              addConcentricTube(
                [
                  new THREE.Vector3(x1, 0.28, z1),
                  new THREE.Vector3(x1, 0.52, z1),
                  new THREE.Vector3(mx - 0.14, 0.68, mz),
                ],
                0xcbd5e1,
                0.018,
                0.05,
                true,
              );
              addConcentricTube(
                [
                  new THREE.Vector3(x2, 0.28, z2),
                  new THREE.Vector3(x2, 0.52, z2),
                  new THREE.Vector3(mx + 0.14, 0.68, mz),
                ],
                0xcbd5e1,
                0.018,
                0.05,
                true,
              );
              const disc = new THREE.Mesh(
                new THREE.CylinderGeometry(0.24, 0.24, 0.1, 24),
                new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.4 }),
              );
              disc.position.set(mx, 0.68, mz);
              addCartoonOutline(disc, 1.06);
              pGroup.add(disc);
              pinsData.push({
                id: 'ldr',
                title: part.label,
                pos: new THREE.Vector3(mx, 1.08, mz),
              });
            } else {
              // Tactile Switch on Breadboard
              addConcentricTube(
                [new THREE.Vector3(x1, 0.28, z1), new THREE.Vector3(x1, 0.42, z1)],
                0xcbd5e1,
                0.02,
                0.02,
                true,
              );
              addConcentricTube(
                [new THREE.Vector3(x2, 0.28, z2), new THREE.Vector3(x2, 0.42, z2)],
                0xcbd5e1,
                0.02,
                0.02,
                true,
              );
              const swBody = new THREE.Mesh(
                new THREE.BoxGeometry(Math.max(0.48, span + 0.12), 0.18, 0.42),
                new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 }),
              );
              swBody.position.set(mx, 0.39, mz);
              addBoxEdges(swBody);
              const btn = new THREE.Mesh(
                new THREE.CylinderGeometry(0.12, 0.12, 0.12, 16),
                new THREE.MeshStandardMaterial({
                  color: (part.id === 'sw2' ? s.sw2Closed : s.switchClosed) ? 0x22c55e : 0xef4444,
                }),
              );
              btn.position.set(mx, 0.52, mz);
              addCartoonOutline(btn, 1.06);
              pGroup.add(swBody, btn);
              pinsData.push({
                id: part.id,
                title: part.label,
                pos: new THREE.Vector3(mx, 0.88, mz),
              });
            }

            animRefs.interactiveTargets.push({
              obj: pGroup,
              partId: part.id,
              toggleSw: part.kind === 'switch' ? (part.id === 'sw2' ? 2 : 1) : undefined,
            });
            circuitRoot.add(pGroup);
          });
        }

        if (s.mode === 'LDR_DIRECT' || s.mode === 'LDR_NIGHT') {
          const stimMesh = buildSensorStimulusModel(
            new THREE.Vector3(-0.85, 0, -2.95),
            ldrBbWorldPos,
            flags.lessonId,
          );
          circuitRoot.add(stimMesh);
          animRefs.interactiveTargets.push({ obj: stimMesh, partId: 'ldr' });
        }
      }

      // Benchtop Yellow Digital Multimeter with Front Probe Jacks & Handheld Probe Pens
      if (flags.showDMM) {
        const dmmGroup = new THREE.Group();
        dmmGroup.position.set(1.65, 0, -3.45);
        const body = new THREE.Mesh(
          new THREE.BoxGeometry(2.05, 1.28, 0.52),
          new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.4 }),
        );
        body.position.y = 0.64;
        body.rotation.x = -0.14;
        body.castShadow = true;
        addBoxEdges(body);

        const screen = new THREE.Mesh(
          new THREE.PlaneGeometry(1.68, 0.72),
          new THREE.MeshBasicMaterial({ map: dmmTex }),
        );
        screen.position.set(0, 0.78, 0.28);
        screen.rotation.x = -0.14;

        // Front lower probe sockets (below the screen so cables NEVER cross the screen!)
        const sockRed = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 0.14, 16),
          new THREE.MeshStandardMaterial({ color: 0xdc2626 }),
        );
        sockRed.rotation.x = Math.PI / 2;
        sockRed.position.set(0.42, 0.22, 0.28);
        addCartoonOutline(sockRed, 1.08);

        const sockBlk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 0.14, 16),
          new THREE.MeshStandardMaterial({ color: 0x1e293b }),
        );
        sockBlk.rotation.x = Math.PI / 2;
        sockBlk.position.set(-0.42, 0.22, 0.28);
        addCartoonOutline(sockBlk, 1.08);

        dmmGroup.add(body, screen, sockRed, sockBlk);
        circuitRoot.add(dmmGroup);
        animRefs.interactiveTargets.push({ obj: dmmGroup, partId: 'dmm' });
        pinsData.push({
          id: 'dmm',
          title: 'METER',
          pos: new THREE.Vector3(1.65, 1.48, -3.45),
        });

        // บนเบรดบอร์ดโพรบจิ้มรูตามผังวงจร ส่วนบนแท่นไม้จิ้มขั้วของโหลดที่มิเตอร์วัด (LED หรือหลอดไฟ)
        // จะได้เห็นว่ามิเตอร์ต่อคร่อมอุปกรณ์ไหน ไม่ลอยอยู่เฉย ๆ
        const loadPart = flags.buildOnBreadboard
          ? undefined
          : topo.parts.find((part) => part.id === 'led1') ?? topo.parts.find((part) => part.kind === 'lamp');
        const loadTerminals = loadPart ? getLabPartTerminals(loadPart) : undefined;
        const probeTargets: [[number, number, number], [number, number, number]] | undefined = flags.buildOnBreadboard
          ? [holeToWorld(topo.dmmProbes.red), holeToWorld(topo.dmmProbes.black)]
          : loadTerminals
            ? [loadTerminals.p1, loadTerminals.p2]
            : undefined;

        if (probeTargets) {
          const [redHolePos, blkHolePos] = probeTargets;

          const redPenTop = buildProbePenAt(redHolePos, 0xdc2626);
          const blkPenTop = buildProbePenAt(blkHolePos, 0x1e293b);

          // Route probe cables smoothly from the front sockets into the vertical probe pens!
          addConcentricTube(
            [
              new THREE.Vector3(1.65 + 0.42, 0.22, -3.12),
              new THREE.Vector3(1.65 + 0.42, 0.22, -2.55),
              new THREE.Vector3((2.07 + redPenTop.x) / 2, 0.98, (-2.3 + redPenTop.z) / 2),
              new THREE.Vector3(redPenTop.x, redPenTop.y + 0.22, redPenTop.z - 0.1),
              redPenTop,
            ],
            '#dc2626',
            0.03,
            0.35,
            false,
          );
          addConcentricTube(
            [
              new THREE.Vector3(1.65 - 0.42, 0.22, -3.12),
              new THREE.Vector3(1.65 - 0.42, 0.22, -2.55),
              new THREE.Vector3((1.23 + blkPenTop.x) / 2, 0.98, (-2.3 + blkPenTop.z) / 2),
              new THREE.Vector3(blkPenTop.x, blkPenTop.y + 0.22, blkPenTop.z - 0.1),
              blkPenTop,
            ],
            '#1e293b',
            0.03,
            0.35,
            false,
          );
        }
      }

      const layerEl = labelsLayerRef.current;
      if (layerEl) {
        layerEl.innerHTML = '';
        pinsData.forEach((p) => {
          const el = document.createElement('div');
          el.className = `e101-hud-pin ${flags.selectedPart === p.id ? 'selected' : ''}`;
          const b = document.createElement('b');
          b.textContent = p.title;
          const valSpan = document.createElement('span');
          valSpan.className = 'val';
          b.appendChild(valSpan);
          el.appendChild(b);
          el.addEventListener('click', (ev) => {
            ev.stopPropagation();
            setSelectedPart(p.id);
            if (p.id === 'sw1') toggleSwitch1Ref.current();
            if (p.id === 'sw2') toggleSwitch2Ref.current();
          });
          layerEl.appendChild(el);
          p.el = el;
          p.valSpan = valSpan;
        });
      }
    }

    rebuildSceneRef.current = rebuildCircuitScene;
    rebuildCircuitScene();

    const historyV = new Array<number>(140).fill(0);
    const historyI = new Array<number>(140).fill(0);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let downX = 0;
    let downY = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevX = downX = e.clientX;
      prevY = downY = e.clientY;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      prevX = e.clientX;
      prevY = e.clientY;
      desiredTheta -= dx * 0.007;
      desiredPhi = Math.max(0.16, Math.min(1.38, desiredPhi - dy * 0.007));
    };
    const onPointerUp = (e: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;
      if (Math.hypot(e.clientX - downX, e.clientY - downY) < 6) {
        const rect = canvas.getBoundingClientRect();
        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);

        for (const item of animRefs.interactiveTargets) {
          const hits = raycaster.intersectObject(item.obj, true);
          if (hits.length > 0) {
            setSelectedPart(item.partId);
            if (item.toggleSw === 1) toggleSwitch1Ref.current();
            if (item.toggleSw === 2) toggleSwitch2Ref.current();
            break;
          }
        }
      }
    };
    const onWheel = (e: WheelEvent) => {
      desiredZoom = Math.max(0.62, Math.min(2.1, desiredZoom - e.deltaY * 0.0008));
    };

    const keys: Record<string, boolean> = {};
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      keys[e.key.toLowerCase()] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
    };
    const onWindowBlur = () => {
      Object.keys(keys).forEach((k) => {
        keys[k] = false;
      });
      isDragging = false;
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onWindowBlur);

    const handleResize = () => {
      if (!shell) return;
      const w = Math.max(320, shell.clientWidth);
      const h = Math.max(320, shell.clientHeight);
      const aspect = w / h;
      camera.left = -frustumHalfH * aspect;
      camera.right = frustumHalfH * aspect;
      camera.top = frustumHalfH;
      camera.bottom = -frustumHalfH;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(handleResize) : null;
    resizeObserver?.observe(shell);
    window.addEventListener('resize', handleResize);

    let animId = 0;
    let lastTime = performance.now();
    let uiTick = 0;

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = frameDeltaSeconds(now, lastTime);
      lastTime = now;

      const flags = uiFlagsRef.current;
      const panSpeed = 4.2 * dt;
      if (keys['w']) desiredTarget.z -= panSpeed;
      if (keys['s']) desiredTarget.z += panSpeed;
      if (keys['a']) desiredTarget.x -= panSpeed;
      if (keys['d']) desiredTarget.x += panSpeed;
      if (keys['q']) desiredTheta -= 1.8 * dt;
      if (keys['e']) desiredTheta += 1.8 * dt;
      if (flags.turntable) desiredTheta += 0.35 * dt;

      updateCameraOrbit();

      const s = simRef.current;
      solveElectronicsPhysicsStep(s, dt);

      const colors = getResistorBandColors(s.R);
      if (animRefs.r1Bands.length === 3) {
        animRefs.r1Bands[0].material.color.set(colors[0]);
        animRefs.r1Bands[1].material.color.set(colors[1]);
        animRefs.r1Bands[2].material.color.set(colors[2]);
      }

      const colorsR2 = getResistorBandColors(s.R2 ?? s.R);
      if (animRefs.r2Bands.length === 3) {
        animRefs.r2Bands[0].material.color.set(colorsR2[0]);
        animRefs.r2Bands[1].material.color.set(colorsR2[1]);
        animRefs.r2Bands[2].material.color.set(colorsR2[2]);
      }

      if (animRefs.sw1Pivot) {
        const targetAngle = s.switchClosed && !flags.breakerTripped ? 0 : 0.62;
        animRefs.sw1Pivot.rotation.z += (targetAngle - animRefs.sw1Pivot.rotation.z) * 0.22;
      }
      if (animRefs.sw2Pivot) {
        const targetAngle2 = s.sw2Closed ? 0 : 0.62;
        animRefs.sw2Pivot.rotation.z += (targetAngle2 - animRefs.sw2Pivot.rotation.z) * 0.22;
      }

      if (animRefs.acCrankGroup) {
        animRefs.acCrankGroup.rotation.y = s.simTime * Math.PI * 2 * 1.5;
      }
      if (animRefs.potKnobGroup) {
        const ratio = flags.lessonId === 's6' ? s.Rb / 50000 : s.R / 2000;
        animRefs.potKnobGroup.rotation.y = (ratio - 0.5) * Math.PI * 1.4;
      }
      if (animRefs.magnetGroup && animRefs.magnetBasePos) {
        const distOffset = 1.65 - (s.lightLevel / 100) * 1.15;
        animRefs.magnetGroup.position.set(
          animRefs.magnetBasePos.x,
          0,
          animRefs.magnetBasePos.z - distOffset,
        );
      }
      if (animRefs.heaterCoilMat) {
        animRefs.heaterCoilMat.emissiveIntensity = 0.15 + (s.lightLevel / 100) * 1.8;
      }

      animRefs.smokePuffs.forEach((sp) => {
        if (!flags.isBurned && !flags.fuseBlown) {
          sp.mesh.visible = false;
          return;
        }
        sp.mesh.visible = true;
        sp.phase = (sp.phase + dt * 0.55) % 1;
        sp.mesh.position.set(
          sp.origin.x + Math.sin(sp.phase * Math.PI * 4) * 0.14,
          sp.origin.y + sp.phase * 1.65,
          sp.origin.z + Math.cos(sp.phase * Math.PI * 3) * 0.12,
        );
        const sScale = 0.55 + sp.phase * 1.75;
        sp.mesh.scale.setScalar(sScale);
        sp.mesh.material.opacity = Math.max(0, (1 - sp.phase) * 0.55);
      });

      const normI = flags.isBurned ? 0 : Math.min(1.6, s.I_mA / 20);
      const isOvercurrent = s.I_mA > 35;
      if (animRefs.led1Mat && animRefs.led1Light && animRefs.led1Halo) {
        if (flags.isBurned) {
          animRefs.led1Mat.color.setHex(0x1f2937);
          animRefs.led1Mat.emissive.setHex(0x000000);
          animRefs.led1Mat.emissiveIntensity = 0;
          animRefs.led1Light.intensity = 0;
          animRefs.led1Halo.material.opacity = 0;
        } else {
          animRefs.led1Mat.color.setHex(isOvercurrent ? 0xffaa00 : 0xef4444);
          animRefs.led1Mat.emissive.setHex(isOvercurrent ? 0xffea00 : 0xff1100);
          animRefs.led1Mat.emissiveIntensity = 0.25 + normI * 1.8;
          animRefs.led1Light.intensity = normI * 3.0;
          animRefs.led1Halo.material.opacity = Math.min(0.36, normI * 0.28);
        }
      }

      const normI2 = flags.isBurned ? 0 : Math.min(1.6, s.I2_mA / 20);
      if (animRefs.led2Mat && animRefs.led2Light && animRefs.led2Halo) {
        animRefs.led2Mat.emissiveIntensity = 0.25 + normI2 * 1.8;
        animRefs.led2Light.intensity = normI2 * 2.8;
        animRefs.led2Halo.material.opacity = Math.min(0.36, normI2 * 0.28);
      }

      if (animRefs.capRing) {
        const capRatio = Math.min(1, s.Vc / Math.max(1, s.Vs));
        animRefs.capRing.material.opacity = 0.15 + capRatio * 0.75;
        animRefs.capRing.scale.setScalar(0.95 + capRatio * 0.22);
      }

      if (animRefs.lampCone) {
        animRefs.lampCone.material.opacity = (s.lightLevel / 100) * 0.38;
      }

      const effDt = dt * s.timeScale;
      animRefs.flowParticles.forEach((fp) => {
        let branchMa = s.I_mA;
        if (fp.branch === 'branch2') branchMa = s.I2_mA;
        else if (fp.branch === 'base') branchMa = s.Ib_uA > 1 ? 6 : 0;
        else if (fp.branch === 'cap')
          branchMa = Math.abs(s.Vs - s.Vc) > 0.15 && s.switchClosed ? 8 : 0;

        const visible = !flags.isBurned && flags.showCurrentFlow && branchMa > 0.08;
        fp.mesh.visible = visible;
        if (visible) {
          const speed = Math.max(0.18, Math.min(1.6, branchMa / 15)) * effDt;
          fp.t = (fp.t + speed) % 1;
          fp.curve.getPointAt(fp.t, fp.mesh.position);
        }
      });

      historyV.push(s.Vload);
      historyV.shift();
      historyI.push(s.I_mA);
      historyI.shift();

      const halfW = shell.clientWidth / 2;
      const halfH = shell.clientHeight / 2;
      const placedPositions: { x: number; y: number }[] = [];
      pinsData.forEach((p) => {
        if (!p.el || !p.valSpan) return;
        if (!flags.showLabels) {
          p.el.style.display = 'none';
          return;
        }
        const v = p.pos.clone().project(camera);
        if (v.z > 1) {
          p.el.style.display = 'none';
        } else {
          let sx = v.x * halfW + halfW;
          let sy = -(v.y * halfH) + halfH;
          let guard = 0;
          while (guard++ < 8) {
            const hit = placedPositions.find(
              (prev) => Math.abs(sx - prev.x) < 92 && Math.abs(sy - prev.y) < 23,
            );
            if (!hit) break;
            sx += sx >= hit.x ? 34 : -34;
            sy += sy <= hit.y ? -22 : 22;
          }
          placedPositions.push({ x: sx, y: sy });
          p.el.style.display = 'block';
          p.el.style.left = `${sx}px`;
          p.el.style.top = `${sy}px`;
        }

        if (p.id === 'supply') p.valSpan.textContent = ` ${s.Vs.toFixed(1)}V`;
        else if (p.id === 'sw1')
          p.valSpan.textContent = flags.breakerTripped
            ? ' TRIPPED!'
            : s.switchClosed
              ? ' ON'
              : ' OFF';
        else if (p.id === 'sw2')
          p.valSpan.textContent =
            s.mode === 'SAFETY_GROUND'
              ? s.sw2Closed
                ? ' G: CONNECTED'
                : ' G: OPEN!'
              : s.sw2Closed
                ? ' ON'
                : ' OFF';
        else if (p.id === 'fuse1')
          p.valSpan.textContent = flags.fuseBlown
            ? ' BLOWN!'
            : ` ${s.I_mA.toFixed(1)}mA`;
        else if (p.id === 'r1') p.valSpan.textContent = ` ${s.R}Ω`;
        else if (p.id === 'r2')
          p.valSpan.textContent =
            s.mode === 'BJT' || s.mode === 'LDR_NIGHT' || s.mode === 'NOT'
              ? ` ${(s.Rb / 1000).toFixed(0)}kΩ`
              : ` ${s.R2 ?? s.R}Ω`;
        else if (p.id === 'cap1') p.valSpan.textContent = ` ${s.Vc.toFixed(1)}V`;
        else if (p.id === 'bjt1') p.valSpan.textContent = ` ${s.Ib_uA.toFixed(0)}µA`;
        else if (p.id === 'ldr')
          p.valSpan.textContent =
            s.R_ldr >= 1000 ? ` ${(s.R_ldr / 1000).toFixed(1)}kΩ` : ` ${s.R_ldr}Ω`;
        else if (p.id === 'dmm') p.valSpan.textContent = ` ${s.Vload.toFixed(2)}V`;
        else if (p.id === 'led1')
          p.valSpan.textContent = !flags.led1Inserted
            ? ' UNPLUGGED'
            : flags.isBurned
              ? ' BURNED!'
              : s.mode === 'SAFETY_GROUND'
                ? ` ${(s.touchVoltage ?? 0).toFixed(0)}V Touch`
                : s.I_mA > 35
                  ? ' OVERLOAD!'
                  : ` ${s.I_mA.toFixed(1)}mA`;
        else if (p.id === 'led2')
          p.valSpan.textContent = !flags.led2Inserted
            ? ' UNPLUGGED'
            : ` ${s.I2_mA.toFixed(1)}mA`;
      });

      if (++uiTick % 5 === 0) {
        if (dmmCtx && flags.showDMM) {
          updateDmmScreenTexture(dmmCtx, dmmTex, s.Vload, s.I_mA, s.R_ldr, s.mode);
        }

        const scopeCanvas = scopeCanvasRef.current;
        const scopeCtx = scopeCanvas?.getContext('2d');
        if (scopeCtx && scopeCanvas) {
          const w = scopeCanvas.width;
          const h = scopeCanvas.height;
          scopeCtx.clearRect(0, 0, w, h);

          const padL = 26;
          const padR = 12;
          const padT = 12;
          const padB = 20;
          const plotW = w - padL - padR;
          const plotH = h - padT - padB;

          scopeCtx.strokeStyle = 'rgba(21, 26, 44, 0.08)';
          scopeCtx.lineWidth = 1;
          scopeCtx.beginPath();
          for (let i = 0; i <= 4; i++) {
            const gx = padL + (i / 4) * plotW;
            scopeCtx.moveTo(gx, padT);
            scopeCtx.lineTo(gx, padT + plotH);
          }
          for (let j = 0; j <= 3; j++) {
            const gy = padT + (j / 3) * plotH;
            scopeCtx.moveTo(padL, gy);
            scopeCtx.lineTo(padL + plotW, gy);
          }
          scopeCtx.stroke();

          scopeCtx.strokeStyle = '#151a2c';
          scopeCtx.lineWidth = 1.4;
          scopeCtx.beginPath();
          scopeCtx.moveTo(padL, padT);
          scopeCtx.lineTo(padL, padT + plotH);
          scopeCtx.lineTo(padL + plotW, padT + plotH);
          scopeCtx.stroke();

          if (s.mode === 'LDR_NIGHT' || s.mode === 'LDR_DIRECT') {
            const maxY = 25;
            scopeCtx.strokeStyle = '#0f766e';
            scopeCtx.lineWidth = 2.2;
            scopeCtx.beginPath();
            for (let b = 0; b <= 100; b += 2) {
              const rLdr = 150 + 49850 * Math.pow(1 - b / 100, 2.4);
              let iVal = 0;
              if (s.switchClosed) {
                if (s.mode === 'LDR_NIGHT') {
                  const vTh = s.Vs * (rLdr / (s.Rb + rLdr));
                  const rTh = (s.Rb * rLdr) / (s.Rb + rLdr);
                  if (vTh > 0.68) {
                    const ib = (vTh - 0.68) / Math.max(200, rTh);
                    const icMax = Math.max(0, (s.Vs - s.Vf - 0.1) / s.R);
                    iVal = Math.min(icMax, ib * s.hFE) * 1000;
                  }
                } else {
                  iVal = s.Vs > s.Vf ? ((s.Vs - s.Vf) / (s.R + rLdr * 0.12)) * 1000 : 0;
                }
              }
              const px = padL + (b / 100) * plotW;
              const py = padT + plotH - Math.min(1, iVal / maxY) * plotH;
              if (b === 0) scopeCtx.moveTo(px, py);
              else scopeCtx.lineTo(px, py);
            }
            scopeCtx.stroke();

            const opX = padL + (s.lightLevel / 100) * plotW;
            const opY = padT + plotH - Math.min(1, s.I_mA / maxY) * plotH;
            scopeCtx.setLineDash([3, 3]);
            scopeCtx.strokeStyle = '#0f766e';
            scopeCtx.lineWidth = 1.2;
            scopeCtx.beginPath();
            scopeCtx.moveTo(opX, padT + plotH);
            scopeCtx.lineTo(opX, opY);
            scopeCtx.lineTo(padL, opY);
            scopeCtx.stroke();
            scopeCtx.setLineDash([]);

            scopeCtx.fillStyle = '#0f766e';
            scopeCtx.beginPath();
            scopeCtx.arc(opX, opY, 4, 0, Math.PI * 2);
            scopeCtx.fill();

            scopeCtx.fillStyle = '#57534e';
            scopeCtx.font = '700 9px "JetBrains Mono", monospace';
            scopeCtx.fillText('0%', padL, h - 5);
            scopeCtx.fillText('50%', padL + plotW * 0.45, h - 5);
            scopeCtx.fillText('100%', padL + plotW - 24, h - 5);
          } else if (s.mode === 'RC' || s.mode === 'AC' || s.mode === 'ASTABLE') {
            const threshY = padT + plotH - (1.9 / 12) * plotH;
            scopeCtx.setLineDash([4, 3]);
            scopeCtx.strokeStyle = '#dc2626';
            scopeCtx.lineWidth = 1;
            scopeCtx.beginPath();
            scopeCtx.moveTo(padL, threshY);
            scopeCtx.lineTo(padL + plotW, threshY);
            scopeCtx.stroke();
            scopeCtx.setLineDash([]);

            scopeCtx.strokeStyle = '#0f766e';
            scopeCtx.lineWidth = 2.2;
            scopeCtx.beginPath();
            historyV.forEach((v, i) => {
              const x = padL + (i / (historyV.length - 1)) * plotW;
              const y = padT + plotH - (Math.min(12, v) / 12) * plotH;
              if (i === 0) scopeCtx.moveTo(x, y);
              else scopeCtx.lineTo(x, y);
            });
            scopeCtx.stroke();
          } else {
            const maxI = 40;
            scopeCtx.strokeStyle = '#0f766e';
            scopeCtx.lineWidth = 2.2;
            scopeCtx.beginPath();
            for (let rVal = 40; rVal <= 2000; rVal += 25) {
              const iVal = s.switchClosed && s.Vs > s.Vf ? ((s.Vs - s.Vf) / rVal) * 1000 : 0;
              const px = padL + ((rVal - 40) / 1960) * plotW;
              const py = padT + plotH - Math.min(1, iVal / maxI) * plotH;
              if (rVal === 40) scopeCtx.moveTo(px, py);
              else scopeCtx.lineTo(px, py);
            }
            scopeCtx.stroke();

            const opX = padL + (Math.max(0, s.R - 40) / 1960) * plotW;
            const opY = padT + plotH - Math.min(1, s.I_mA / maxI) * plotH;
            scopeCtx.setLineDash([3, 3]);
            scopeCtx.strokeStyle = '#0f766e';
            scopeCtx.lineWidth = 1.2;
            scopeCtx.beginPath();
            scopeCtx.moveTo(opX, padT + plotH);
            scopeCtx.lineTo(opX, opY);
            scopeCtx.lineTo(padL, opY);
            scopeCtx.stroke();
            scopeCtx.setLineDash([]);

            scopeCtx.fillStyle = '#0f766e';
            scopeCtx.beginPath();
            scopeCtx.arc(opX, opY, 4, 0, Math.PI * 2);
            scopeCtx.fill();

            scopeCtx.fillStyle = '#57534e';
            scopeCtx.font = '700 9px "JetBrains Mono", monospace';
            scopeCtx.fillText('10Ω', padL, h - 5);
            scopeCtx.fillText('1kΩ', padL + plotW * 0.46, h - 5);
            scopeCtx.fillText('2kΩ', padL + plotW - 22, h - 5);
          }
        }
      }

      if (uiTick % 10 === 0) {
        setTelemetry({
          Vload: s.Vload,
          I_mA: s.I_mA,
          I2_mA: s.I2_mA,
          P_mW: s.P_mW,
          P2_mW: s.P2_mW ?? 0,
          VR1: s.VR1 ?? 0,
          VR2: s.VR2 ?? 0,
          Vc: s.Vc,
          Ib_uA: s.Ib_uA,
          R_ldr: s.R_ldr,
          touchVoltage: s.touchVoltage ?? 0,
          bodyCurrentMa: s.bodyCurrentMa ?? 0,
        });
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onWindowBlur);
      disposeSceneObject(scene, new Set<THREE.Texture>());
      breadboardTex.dispose();
      dmmTex.dispose();
      batteryTex.dispose();
      puckTopTex.dispose();
      renderer.dispose();
    };
  }, []);

  const lessonsInCat = ELECTRONICS_101_CURRICULUM[category];
  const isR2Visible =
    currentLesson.mode === 'SERIES' ||
    currentLesson.mode === 'PARALLEL' ||
    currentLesson.mode === 'VDIV' ||
    currentLesson.mode === 'ASTABLE';
  const isTwoLedVisible =
    currentLesson.mode === 'SERIES' || currentLesson.mode === 'PARALLEL';
  const isWattageVisible =
    currentLesson.id === 'r7' ||
    currentLesson.id === 'p1' ||
    currentLesson.id === 'p2';
  const isWireSizeVisible = currentLesson.mode === 'BREAKER';
  const isCapVisible =
    currentLesson.mode === 'RC' ||
    currentLesson.mode === 'AC' ||
    currentLesson.mode === 'ASTABLE';
  const isBjtVisible =
    currentLesson.mode === 'BJT' ||
    currentLesson.mode === 'LDR_NIGHT' ||
    currentLesson.mode === 'NOT';
  const isLdrVisible =
    currentLesson.mode === 'LDR_DIRECT' ||
    currentLesson.mode === 'LDR_NIGHT' ||
    currentLesson.mode === 'SAFETY_GROUND';
  const isSw2Visible =
    currentLesson.mode === 'AND' ||
    currentLesson.mode === 'SPDT' ||
    currentLesson.mode === 'FUSE_TRIP' ||
    currentLesson.mode === 'SAFETY_GROUND';
  const isCurrentCompleted = completedLessons.has(currentLesson.id);
  const currentWireSpec =
    TIS_WIRE_SIZES.find((w) => w.mm2 === wireGaugeMm2) || TIS_WIRE_SIZES[3];
  const currentShockInfo = getShockSeverity(telemetry.bodyCurrentMa);

  const diagramTelemetry: DiagramTelemetry = {
    Vs,
    R,
    R2,
    C,
    Rb,
    lightLevel,
    switchClosed: !isBurned && isWiringComplete && switchClosed,
    sw2Closed,
    Vload: telemetry.Vload,
    I_mA: telemetry.I_mA,
    I2_mA: telemetry.I2_mA,
    P_mW: telemetry.P_mW,
    Vc: telemetry.Vc,
    Ib_uA: telemetry.Ib_uA,
    R_ldr: telemetry.R_ldr,
    showDMM,
    led1Inserted,
    led2Inserted,
    fuseBlown,
    breakerTripped,
    wireGaugeMm2,
    touchVoltage: telemetry.touchVoltage,
    bodyCurrentMa: telemetry.bodyCurrentMa,
    faultRepaired,
  };

  const chartTitle =
    currentLesson.mode === 'LDR_NIGHT' || currentLesson.mode === 'LDR_DIRECT'
      ? 'LED CURRENT AGAINST LAMP BRIGHTNESS'
      : currentLesson.mode === 'RC' ||
          currentLesson.mode === 'AC' ||
          currentLesson.mode === 'ASTABLE'
        ? 'VOLTAGE WAVEFORM OVER TIME'
        : 'CURRENT AGAINST RESISTANCE (R1)';

  const chartReadout =
    currentLesson.mode === 'LDR_NIGHT' || currentLesson.mode === 'LDR_DIRECT'
      ? `${lightLevel}% → ${telemetry.I_mA.toFixed(1)} mA`
      : currentLesson.mode === 'RC' ||
          currentLesson.mode === 'AC' ||
          currentLesson.mode === 'ASTABLE'
        ? `Vc ${telemetry.Vc.toFixed(2)}V · I ${telemetry.I_mA.toFixed(1)}mA`
        : `${R} Ω → ${telemetry.I_mA.toFixed(1)} mA`;

  const goPrevLesson = () => {
    if (lessonIndex > 0) selectLesson(category, lessonIndex - 1);
  };
  const goNextLesson = () => {
    if (lessonIndex < lessonsInCat.length - 1) selectLesson(category, lessonIndex + 1);
  };

  return (
    <div
      ref={shellRef}
      className={`e101-shell ${isFullscreen ? 'is-fullscreen' : ''} ${darkTheme ? 'is-dark' : ''}`}
    >
      {/* Top Navigation */}
      <nav className="e101-nav" aria-label="Electronics 101 Navigation">
        <ul>
          <li>
            <Link to="/games" className="e101-nav-btn">
              ← หน้าเกม
            </Link>
          </li>
          <li>
            <Link to="/curriculum/electronics-basic/unit/1" className="e101-nav-btn">
              📚 คอร์สอิเล็กทรอนิกส์
            </Link>
          </li>
          <li>
            <button
              type="button"
              className={`e101-nav-btn ${showSchematic ? 'active' : ''}`}
              onClick={() => {
                setModalTab(buildOnBreadboard ? 'breadboard' : 'diagram');
                setShowSchematic(true);
              }}
            >
              <span>2D Circuit &amp; Breadboard</span>
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`e101-nav-btn ${missionMode ? 'active' : ''}`}
              onClick={() => {
                if (!missionMode) selectMission(missionIndex);
                else setMissionMode(false);
              }}
            >
              <span>🏆 ภารกิจต่อวงจร ({completedMissions.size}/8)</span>
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`e101-nav-btn ${showDMM ? 'active' : ''}`}
              onClick={() => setShowDMM((v) => !v)}
            >
              <span>Multimeter: {showDMM ? 'ON' : 'OFF'}</span>
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`e101-nav-btn ${soundEnabled ? 'active' : ''}`}
              onClick={() => setSoundEnabled((v) => !v)}
            >
              <span>{soundEnabled ? '🔊 เสียง: ON' : '🔇 เสียง: OFF'}</span>
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`e101-nav-btn ${darkTheme ? 'active' : ''}`}
              onClick={() => setDarkTheme((v) => !v)}
            >
              <span>{darkTheme ? '☀️ โหมดดราฟต์' : '🌙 โหมดมืด'}</span>
            </button>
          </li>
          <li>
            <button
              type="button"
              className="e101-nav-btn"
              onClick={() => selectLesson(category, lessonIndex)}
            >
              <span>Reset</span>
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`e101-nav-btn ${isFullscreen ? 'active' : ''}`}
              onClick={() => setIsFullscreen((v) => !v)}
            >
              <span>{isFullscreen ? 'ย่อหน้าจอ' : 'ขยายเต็มจอ'}</span>
              <span className="e101-lang-badge">3D</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Brand Header */}
      <header className="e101-brand-header">
        <h2>Electronics 101</h2>
        <p>Discover · Experiment · Build</p>
      </header>

      <main className="e101-main">
        <canvas
          ref={canvasRef}
          className="e101-canvas"
          aria-label="Interactive 3D workbench. Drag or use WASD to pan, Q and E to rotate, scroll to zoom."
        />

        {/* 3D-to-2D Projected Floating Callout Pills */}
        <div ref={labelsLayerRef} className="e101-labels-layer" />

        {/* Floating Characteristic Curve & Oscilloscope Chart */}
        <section aria-label="Chart" className="e101-chart-panel">
          <header>
            <div>
              <strong className="e101-chart-title">{chartTitle}</strong>
              <span className="e101-chart-sub">{chartReadout}</span>
            </div>
            <button
              type="button"
              className="e101-chart-fold-btn"
              onClick={() => setChartCollapsed((v) => !v)}
              title="ย่อ/ขยายกราฟ"
            >
              {chartCollapsed ? '▲' : '▼'}
            </button>
          </header>
          <canvas
            ref={scopeCanvasRef}
            className="e101-scope-canvas"
            width={260}
            height={112}
            style={{ display: chartCollapsed ? 'none' : 'block' }}
          />
        </section>

        {/* 2D Circuit Diagram & Breadboard Modal */}
        {showSchematic && (
          <div className="e101-modal-backdrop" onClick={() => setShowSchematic(false)}>
            <section
              role="dialog"
              aria-label="Circuit Schematic & Breadboard View"
              className="e101-modal-dialog"
              onClick={(e) => e.stopPropagation()}
            >
              <header className="e101-modal-head">
                <div>
                  <h2 style={{ fontSize: '1.08rem', margin: 0 }}>
                    CIRCUIT · {currentLesson.title}
                  </h2>
                  <span style={{ fontSize: '0.8rem', color: 'var(--e101-text-muted)' }}>
                    {currentTopo.titleTh} ({currentLesson.mode})
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div className="e101-seg-group">
                    <button
                      type="button"
                      className={modalTab === 'diagram' ? 'active' : ''}
                      onClick={() => setModalTab('diagram')}
                    >
                      DIAGRAM (ผังวงจร)
                    </button>
                    <button
                      type="button"
                      className={modalTab === 'breadboard' ? 'active' : ''}
                      onClick={() => setModalTab('breadboard')}
                    >
                      BREADBOARD (โฟโต้บอร์ด)
                    </button>
                  </div>
                  <button
                    type="button"
                    className="e101-toolbar-btn"
                    onClick={() => setShowSchematic(false)}
                  >
                    Close ✕
                  </button>
                </div>
              </header>

              <div className="e101-schematic-box">
                {modalTab === 'diagram' ? (
                  <InteractiveSchematicSvg
                    mode={currentLesson.mode}
                    telemetry={diagramTelemetry}
                    selectedPart={selectedPart}
                    onSelectPart={handleSelectPartAndFocus}
                    onToggleSwitch1={toggleSwitch1WithSound}
                    onToggleSwitch2={toggleSwitch2WithSound}
                  />
                ) : (
                  <InteractiveBreadboardSvg
                    mode={currentLesson.mode}
                    telemetry={diagramTelemetry}
                    selectedPart={selectedPart}
                    onSelectPart={handleSelectPartAndFocus}
                    seeThrough={breadboardInside}
                    breadboardStep={breadboardStep}
                    customJumpers={wiringChallengeMode ? userJumpers : undefined}
                    pendingHole={pendingHole}
                    onClickHole={wiringChallengeMode ? handleBreadboardHoleClick : undefined}
                    showWiringHint={showWiringHint}
                  />
                )}
              </div>

              <footer className="e101-modal-foot">
                <span>
                  {modalTab === 'breadboard'
                    ? wiringChallengeMode
                      ? `🎯 ${wiringStatus.message}`
                      : 'มุมมองด้านบนตามที่เสียบอุปกรณ์จริงบนโฟโต้บอร์ด 24 แถว (คลิกอุปกรณ์เพื่อดูค่า)'
                    : 'คลิกสัญลักษณ์อุปกรณ์ในผังวงจรเพื่อเลือกปรับค่า หรือคลิกสวิตช์เพื่อเปิด-ปิด'}
                </span>
                {modalTab === 'breadboard' && (
                  <button
                    type="button"
                    className={`e101-toolbar-btn ${breadboardInside ? 'active' : ''}`}
                    onClick={() => setBreadboardInside((v) => !v)}
                  >
                    👁 {breadboardInside ? 'ซ่อนรางโลหะใต้บอร์ด' : 'ทะลุดูรางโลหะ 5 รู (See through)'}
                  </button>
                )}
              </footer>
            </section>
          </div>
        )}

        {/* Bottom-Left 3D View Controls Toolbar */}
        <div aria-label="3D view" role="toolbar" className="e101-view-toolbar">
          <button
            type="button"
            className="e101-toolbar-btn"
            onClick={() => camControlRef.current?.rotateBy(-0.35)}
            title="หมุนซ้าย (Q)"
          >
            ↺
          </button>
          <button
            type="button"
            className="e101-toolbar-btn"
            onClick={() => camControlRef.current?.rotateBy(0.35)}
            title="หมุนขวา (E)"
          >
            ↻
          </button>
          <button
            type="button"
            className="e101-toolbar-btn"
            onClick={() => camControlRef.current?.zoomBy(-0.18)}
            title="ซูมออก"
          >
            −
          </button>
          <button
            type="button"
            className="e101-toolbar-btn"
            onClick={() => camControlRef.current?.zoomBy(0.18)}
            title="ซูมเข้า"
          >
            +
          </button>
          <button
            type="button"
            className="e101-toolbar-btn"
            onClick={() => camControlRef.current?.topView()}
            title="มุมมองจากด้านบน"
          >
            มุมบน
          </button>
          <button
            type="button"
            className={`e101-toolbar-btn ${showLabels ? 'active' : ''}`}
            onClick={() => setShowLabels((v) => !v)}
          >
            {showLabels ? 'ป้ายชื่อ' : 'ซ่อนป้าย'}
          </button>
          <button
            type="button"
            className={`e101-toolbar-btn ${showCurrentFlow ? 'active' : ''}`}
            onClick={() => setShowCurrentFlow((v) => !v)}
          >
            {showCurrentFlow ? '⚡ กระแส' : 'ซ่อนกระแส'}
          </button>
          <button
            type="button"
            className={`e101-toolbar-btn ${timeScale !== 1.0 ? 'active' : ''}`}
            onClick={() => setTimeScale((prev) => (prev === 1.0 ? 0.04 : 1.0))}
          >
            {timeScale === 1.0 ? '1x' : '0.04x'}
          </button>
          <button
            type="button"
            className={`e101-toolbar-btn ${turntable ? 'active' : ''}`}
            onClick={() => setTurntable((v) => !v)}
            title="หมุนอัตโนมัติ (Turntable)"
          >
            {turntable ? 'หมุน: ON' : 'หมุน'}
          </button>
          <button
            type="button"
            className="e101-toolbar-btn"
            onClick={() => camControlRef.current?.reset()}
          >
            Reset
          </button>
        </div>
      </main>

      {/* Top-Right Progress & Clock */}
      <section aria-label="Progress" className="e101-progress-panel">
        <div className="e101-prog-wrap">
          <div className="e101-prog-head">
            <span>{category.toUpperCase()}</span>
            <span>
              {lessonIndex + 1}/{lessonsInCat.length} ({completedLessons.size}/60)
            </span>
          </div>
          <span
            role="progressbar"
            className="e101-prog-bar"
            aria-valuemin={0}
            aria-valuemax={lessonsInCat.length}
            aria-valuenow={lessonIndex + 1}
          >
            <span style={{ width: `${((lessonIndex + 1) / lessonsInCat.length) * 100}%` }} />
          </span>
        </div>
        <time className="e101-clock">
          <span>3D LAB</span>
          <span>{clockTime}</span>
        </time>
      </section>

      {/* Unified Right Inspector Panel */}
      <section aria-label="Lesson information" className="e101-lesson-panel">
        <div role="tablist" className="e101-tablist">
          {(['overview', 'components', 'circuit', 'maths'] as InfoTab[]).map((tabKey) => (
            <button
              key={tabKey}
              type="button"
              role="tab"
              className="e101-tab"
              aria-selected={activeTab === tabKey}
              onClick={() => setActiveTab(tabKey)}
            >
              {tabKey.charAt(0).toUpperCase() + tabKey.slice(1)}
            </button>
          ))}
        </div>

        <div role="tabpanel" className="e101-tabpanel">
          <div className="e101-circuit-tab-head">
            <div>
              <strong style={{ fontSize: '0.96rem', textTransform: 'uppercase' }}>
                {activeTab === 'circuit' ? 'CIRCUIT' : currentLesson.title}
              </strong>
              <small style={{ display: 'block', fontSize: '0.74rem', color: 'var(--e101-text-muted)' }}>
                Click a highlighted part to change it.
              </small>
            </div>
            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              <button
                type="button"
                className="e101-icon-btn"
                title="Open the circuit larger"
                onClick={() => {
                  setModalTab(buildOnBreadboard ? 'breadboard' : 'diagram');
                  setShowSchematic(true);
                }}
              >
                ⛶
              </button>
              <button
                type="button"
                className="e101-icon-btn"
                title="Put the values back"
                onClick={() => selectLesson(category, lessonIndex)}
              >
                ↺
              </button>
              <button
                type="button"
                className={`e101-power-pill ${switchClosed ? 'is-on' : 'is-off'}`}
                onClick={toggleSwitch1WithSound}
              >
                <span className="dot" />
                {switchClosed ? 'POWER ON' : 'POWER OFF'}
              </button>
            </div>
          </div>

          {missionMode && (
            <div
              className={`e101-mission-card ${missionEval.passed ? 'is-passed' : ''}`}
              role="region"
              aria-label="Student Mission"
            >
              <div className="e101-mission-head">
                <select
                  className="e101-mission-select"
                  value={missionIndex}
                  onChange={(e) => selectMission(parseInt(e.target.value, 10))}
                  aria-label="เลือกด่านภารกิจ"
                >
                  {STUDENT_LAB_MISSIONS.map((m, idx) => (
                    <option key={m.id} value={idx}>
                      {completedMissions.has(m.id) ? `✓ ${m.titleTh}` : m.titleTh}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="e101-icon-btn"
                  title="ปิดโหมดภารกิจ"
                  onClick={() => setMissionMode(false)}
                >
                  ✕
                </button>
              </div>
              <p className="e101-mission-goal">{currentMission.goalTh}</p>
              <div className="e101-mission-status">
                <span>{missionEval.statusTh}</span>
              </div>
              {showMissionHint && (
                <small className="e101-mission-hint">💡 {currentMission.hintTh}</small>
              )}
              <div className="e101-challenge-toolbar">
                <button
                  type="button"
                  className={showMissionHint ? 'active' : ''}
                  onClick={() => setShowMissionHint((v) => !v)}
                >
                  💡 คำใบ้ภารกิจ
                </button>
                <button
                  type="button"
                  disabled={missionIndex >= STUDENT_LAB_MISSIONS.length - 1}
                  onClick={() => selectMission(missionIndex + 1)}
                >
                  ด่านถัดไป →
                </button>
              </div>
            </div>
          )}

          {(isBurned || fuseBlown || breakerTripped || (currentLesson.mode === 'TROUBLESHOOT' && !faultRepaired)) && (
            <div className="e101-burn-banner" role="alert">
              <div>
                <strong>
                  {fuseBlown
                    ? '💥 ฟิวส์หลอมขาด (Fuse Blown)! ตัดวงจรป้องกันอุปกรณ์เรียบร้อย'
                    : breakerTripped
                      ? '⚡ เซอร์กิตเบรกเกอร์ทริปตัดวงจรอัตโนมัติ (CB Tripped)!'
                      : currentLesson.mode === 'TROUBLESHOOT'
                        ? currentLesson.fault === 'high_res_joint'
                          ? '🔍 พบจุดเสีย: ขั้วต่อสายไฟเป็นสนิม/หลวม (ความต้านทานสูงผิดปกติ)'
                          : '🔍 พบจุดเสีย: ฟิวส์ในวงจรขาดทำให้ไม่มีกระแสไหลเข้าหลอดไฟ'
                        : '💥 อุปกรณ์เสียหายเนื่องจากกระแสหรือกำลังไฟเกินพิกัด!'}
                </strong>
                <small>
                  {fuseBlown
                    ? 'ปลดสวิตช์ลัดวงจร SW2 หรือเพิ่มค่า R1 แล้วกดเปลี่ยนฟิวส์ตัวใหม่'
                    : breakerTripped
                      ? 'กระแสเกินพิกัดเบรกเกอร์ แผ่นไบเมตัล/ขดลวดแม่เหล็กจึงดีดก้านสวิตช์ลง'
                      : currentLesson.mode === 'TROUBLESHOOT'
                        ? 'สังเกตค่าแรงดันบนมัลติมิเตอร์ แล้วกดปุ่มซ่อมจุดชำรุดด้านล่าง'
                        : `กำลังไฟ ${telemetry.P_mW.toFixed(0)} mW (พิกัด ${(resistorWattage * 1000).toFixed(0)} mW)`}
                </small>
              </div>
              <button
                type="button"
                className="e101-replace-btn"
                onClick={handleReplaceBurnedPart}
              >
                {fuseBlown
                  ? '🔧 เปลี่ยนฟิวส์ใหม่'
                  : breakerTripped
                    ? '🔄 ยกก้านเบรกเกอร์ (Reset CB)'
                    : currentLesson.mode === 'TROUBLESHOOT'
                      ? '🔧 ซ่อมจุดชำรุด / เปลี่ยนฟิวส์'
                      : '🔧 เปลี่ยนอะไหล่ใหม่ & ตั้งค่าปลอดภัย'}
              </button>
            </div>
          )}

          {activeTab === 'overview' && (
            <>
              <p style={{ color: 'var(--e101-text-muted)', margin: '0 0 8px' }}>
                {currentLesson.desc}
              </p>
              <div className="e101-telemetry-grid">
                <div className="e101-stat-card">
                  <span>
                    {currentLesson.mode === 'PARALLEL' ? 'Branch I1 / I2' : 'Load Current (I)'}
                  </span>
                  <b>
                    {currentLesson.mode === 'PARALLEL'
                      ? `${telemetry.I_mA.toFixed(1)} / ${telemetry.I2_mA.toFixed(1)} mA`
                      : `${telemetry.I_mA.toFixed(2)} mA`}
                  </b>
                </div>
                <div className="e101-stat-card">
                  <span>
                    {currentLesson.mode === 'SERIES'
                      ? 'Drops VR1 / VR2'
                      : currentLesson.mode === 'SAFETY_GROUND'
                        ? 'Touch V / Shock I'
                        : 'Resistor Power (P)'}
                  </span>
                  <b>
                    {currentLesson.mode === 'SERIES'
                      ? `${telemetry.VR1.toFixed(2)}V / ${telemetry.VR2.toFixed(2)}V`
                      : currentLesson.mode === 'SAFETY_GROUND'
                        ? `${telemetry.touchVoltage.toFixed(1)}V · ${telemetry.bodyCurrentMa.toFixed(1)}mA`
                        : `${telemetry.P_mW.toFixed(1)} mW`}
                  </b>
                </div>
              </div>
            </>
          )}

          {activeTab === 'components' && (
            <div className="e101-bom-list">
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5, margin: '0 0 8px', padding: 0 }}>
                <li
                  className={`e101-bom-item ${selectedPart === 'supply' ? 'active' : ''}`}
                  onClick={() => handleSelectPartAndFocus('supply')}
                >
                  <b>Supply:</b> <span>{Vs.toFixed(1)} V ({currentLesson.mode})</span>
                </li>
                <li
                  className={`e101-bom-item ${selectedPart === 'sw1' ? 'active' : ''}`}
                  onClick={() => handleSelectPartAndFocus('sw1')}
                >
                  <b>{currentLesson.mode === 'BREAKER' ? `Breaker (${breakerRatingA}A):` : 'Switch 1:'}</b>{' '}
                  <span>{breakerTripped ? 'TRIPPED!' : switchClosed ? 'Closed (ON)' : 'Open (OFF)'}</span>
                </li>
                <li
                  className={`e101-bom-item ${selectedPart === 'r1' ? 'active' : ''}`}
                  onClick={() => handleSelectPartAndFocus('r1')}
                >
                  <b>Resistor R1:</b> <span>{R} Ω ({resistorWattage}W · ±5%)</span>
                </li>
                {isR2Visible && (
                  <li
                    className={`e101-bom-item ${selectedPart === 'r2' ? 'active' : ''}`}
                    onClick={() => handleSelectPartAndFocus('r2')}
                  >
                    <b>Resistor R2:</b> <span>{R2} Ω (±5% Gold)</span>
                  </li>
                )}
                <li
                  className={`e101-bom-item ${selectedPart === 'dmm' ? 'active' : ''}`}
                  onClick={() => handleSelectPartAndFocus('dmm')}
                >
                  <b>Digital Multimeter:</b>{' '}
                  <span>
                    {telemetry.Vload.toFixed(2)} V / {telemetry.I_mA.toFixed(2)} mA
                  </span>
                </li>
              </ul>
            </div>
          )}

          {activeTab === 'maths' && (
            <div style={{ marginBottom: 8 }}>
              <div className="e101-formula-box">
                {currentLesson.mode === 'SERIES' ? (
                  <>
                    R_total = R1 + R2 = {R} + {R2} = <b>{R + R2} Ω</b>
                    <br />
                    I = (Vs − 2×Vf) / R_total = <b>{telemetry.I_mA.toFixed(2)} mA</b>
                    <br />
                    V_R1 = {telemetry.VR1.toFixed(2)} V · V_R2 = <b>{telemetry.VR2.toFixed(2)} V</b>
                  </>
                ) : currentLesson.mode === 'PARALLEL' ? (
                  <>
                    R_eq = (R1×R2)/(R1+R2) = <b>{((R * R2) / (R + R2)).toFixed(1)} Ω</b>
                    <br />
                    I1 = {telemetry.I_mA.toFixed(1)} mA · I2 = {telemetry.I2_mA.toFixed(1)} mA
                    <br />
                    I_total = I1 + I2 = <b>{(telemetry.I_mA + telemetry.I2_mA).toFixed(1)} mA</b>
                  </>
                ) : currentLesson.id === 'p2' ? (
                  <>
                    P = V × I = <b>{telemetry.P_mW.toFixed(1)} mW</b>
                    <br />
                    เปิดวันละ 8 ชม. นาน 30 วัน (เทียบสเกล ×1000):
                    <br />
                    พลังงาน = <b>{((telemetry.P_mW * 8 * 30) / 1000).toFixed(2)} kWh (หน่วย)</b> · ค่าไฟ ≈{' '}
                    <b>{(((telemetry.P_mW * 8 * 30) / 1000) * 4.2).toFixed(0)} บาท</b>
                  </>
                ) : currentLesson.mode === 'BREAKER' ? (
                  <>
                    พิกัดสายไฟ = 1.25 × I_load → เลือกสาย <b>{currentWireSpec.labelTh}</b>
                    <br />
                    ชนิดสาย: <b>{currentWireSpec.cableType}</b>
                    <br />
                    พิกัดเซอร์กิตเบรกเกอร์ (CB) = <b>{breakerRatingA} A</b>
                  </>
                ) : (
                  <>
                    I = (V_s - V_f) / R1 = <b>{telemetry.I_mA.toFixed(2)} mA</b>
                    <br />
                    P = I² × R1 = <b>{telemetry.P_mW.toFixed(1)} mW</b> (พิกัด {(resistorWattage * 1000).toFixed(0)} mW)
                    <br />
                    RC Time Constant (τ) = <b>{((R * C) / 1000).toFixed(1)} ms</b>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="e101-build-mode-box">
            <span className="e101-box-kicker">BUILD IT</span>
            <div className="e101-seg-group">
              <button
                type="button"
                className={!buildOnBreadboard && !wiringChallengeMode ? 'active' : ''}
                onClick={() => {
                  setWiringChallengeMode(false);
                  setBuildOnBreadboard(false);
                }}
              >
                Without a breadboard
              </button>
              <button
                type="button"
                className={buildOnBreadboard && !wiringChallengeMode ? 'active' : ''}
                onClick={() => {
                  setWiringChallengeMode(false);
                  setBuildOnBreadboard(true);
                }}
              >
                On a breadboard
              </button>
              <button
                type="button"
                className={wiringChallengeMode ? 'active' : ''}
                onClick={() => {
                  setBuildOnBreadboard(true);
                  setBreadboardInside(true);
                  setWiringChallengeMode((prev) => !prev);
                  setUserJumpers([]);
                  setPendingHole(null);
                }}
              >
                🎯 ฝึกต่อสายเอง
              </button>
            </div>
            <small className="e101-mode-hint">
              {wiringChallengeMode
                ? wiringStatus.message
                : buildOnBreadboard
                  ? 'The same circuit as you would really build it: a power supply, a breadboard and jumper wires.'
                  : 'Big parts on wooden blocks and thick wires, laid out like the circuit diagram.'}
            </small>

            {wiringChallengeMode && (
              <div className="e101-challenge-toolbar">
                <button
                  type="button"
                  onClick={() => {
                    setUserJumpers((prev) => prev.slice(0, -1));
                    setPendingHole(null);
                  }}
                  disabled={userJumpers.length === 0}
                >
                  ↩ ลบสายล่าสุด
                </button>
                <button
                  type="button"
                  className={showWiringHint ? 'active' : ''}
                  onClick={() => setShowWiringHint((v) => !v)}
                >
                  💡 คำใบ้จุดเสียบ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUserJumpers(currentTopo.bbJumpers);
                    setPendingHole(null);
                    playLabSound('chime', soundEnabled);
                  }}
                >
                  ✨ เฉลยสายไฟ
                </button>
              </div>
            )}

            {buildOnBreadboard && !wiringChallengeMode && (
              <div className="e101-bb-extra">
                <div className="e101-seg-group" style={{ marginTop: 5 }}>
                  <button
                    type="button"
                    className={!breadboardInside ? 'active' : ''}
                    onClick={() => setBreadboardInside(false)}
                  >
                    From above
                  </button>
                  <button
                    type="button"
                    className={breadboardInside ? 'active' : ''}
                    onClick={() => setBreadboardInside(true)}
                  >
                    Inside (ดูแถบโลหะ)
                  </button>
                </div>

                {currentLesson.id === 'b7' && (
                  <div className="e101-step-pills">
                    <div className="e101-seg-group">
                      <button
                        type="button"
                        className={breadboardStep === 1 ? 'active' : ''}
                        onClick={() => setBreadboardStep(1)}
                      >
                        1·Connect battery
                      </button>
                      <button
                        type="button"
                        className={breadboardStep === 2 ? 'active' : ''}
                        onClick={() => setBreadboardStep(2)}
                      >
                        2·Build a loop
                      </button>
                      <button
                        type="button"
                        className={breadboardStep === 3 ? 'active' : ''}
                        onClick={() => setBreadboardStep(3)}
                      >
                        3·Common mistake
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="e101-inline-schematic-wrap">
            {wiringChallengeMode ? (
              <InteractiveBreadboardSvg
                mode={currentLesson.mode}
                telemetry={diagramTelemetry}
                selectedPart={selectedPart}
                onSelectPart={handleSelectPartAndFocus}
                seeThrough={breadboardInside}
                breadboardStep={breadboardStep}
                customJumpers={userJumpers}
                pendingHole={pendingHole}
                onClickHole={handleBreadboardHoleClick}
                showWiringHint={showWiringHint}
              />
            ) : (
              <InteractiveSchematicSvg
                mode={currentLesson.mode}
                telemetry={diagramTelemetry}
                selectedPart={selectedPart}
                onSelectPart={handleSelectPartAndFocus}
                onToggleSwitch1={toggleSwitch1WithSound}
                onToggleSwitch2={toggleSwitch2WithSound}
              />
            )}
          </div>

          <div aria-label="Part inspector" role="region" className="e101-part-card">
            <div className="e101-context-head">
              {selectedPart === 'r1' || selectedPart === 'r2' ? (
                <div className="e101-band-decoder">
                  <span>
                    อ่านแถบสี 4 แถบ ({selectedPart === 'r2' ? `R2: ${R2}` : `R1: ${R}`} Ω):
                  </span>
                  <div className="e101-band-pills">
                    <b style={{ borderLeft: `4px solid ${bandDecoded.band1.hex}` }}>
                      {bandDecoded.band1.nameTh} ({bandDecoded.band1.digit})
                    </b>
                    <b style={{ borderLeft: `4px solid ${bandDecoded.band2.hex}` }}>
                      {bandDecoded.band2.nameTh} ({bandDecoded.band2.digit})
                    </b>
                    <b style={{ borderLeft: `4px solid ${bandDecoded.multiplier.hex}` }}>
                      {bandDecoded.multiplier.nameTh} ({bandDecoded.multiplier.label})
                    </b>
                    <b style={{ borderLeft: '4px solid #d4af37' }}>ทอง (±5%)</b>
                  </div>
                </div>
              ) : currentLesson.mode === 'SAFETY_GROUND' ? (
                <div className="e101-bjt-decoder">
                  <b style={{ color: currentShockInfo.colorHex }}>
                    ⚡ ระดับอันตรายต่อร่างกาย: {currentShockInfo.levelTh}
                  </b>
                  <span>
                    แรงดันโครงโลหะ {telemetry.touchVoltage.toFixed(1)}V · กระแสผ่านตัว{' '}
                    {telemetry.bodyCurrentMa.toFixed(2)} mA — {currentShockInfo.symptomTh}
                  </span>
                </div>
              ) : selectedPart === 'bjt1' ? (
                <div className="e101-bjt-decoder">
                  <b>BC547 NPN (C · B · E) · Gain β = 200</b>
                  <span>
                    Ib {telemetry.Ib_uA.toFixed(0)} µA → Ic {telemetry.I_mA.toFixed(1)} mA (
                    {telemetry.Ib_uA < 0.5
                      ? 'Cut-off'
                      : telemetry.I_mA > 8
                        ? 'Saturated'
                        : 'Active'}
                    )
                  </span>
                </div>
              ) : selectedPart === 'cap1' ? (
                <div className="e101-bjt-decoder">
                  <b>Capacitor C1 ({C} µF) · τ = {((R * C) / 1000).toFixed(0)} ms</b>
                  <span>
                    แรงดันสะสม Vc = {telemetry.Vc.toFixed(2)} V (
                    {Math.min(100, Math.round((telemetry.Vc / Math.max(1, Vs)) * 100))}%)
                  </span>
                </div>
              ) : null}
            </div>

            {isLdrVisible && (
              <div className="e101-control-row">
                <label>
                  <span>
                    {currentLesson.mode === 'SAFETY_GROUND'
                      ? 'MOISTURE / LEAKAGE LEVEL (ความชื้นร่างกาย & ไฟรั่ว)'
                      : currentLesson.id === 's4' || currentLesson.id === 's7'
                        ? 'MAGNET PROXIMITY (N/S POLE)'
                        : currentLesson.id === 's3' || currentLesson.id === 's5'
                          ? 'TEMPERATURE / HEAT SOURCE'
                          : 'LAMP BRIGHTNESS (LIGHT SENSOR LDR)'}
                  </span>
                  <b>{lightLevel}%</b>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={lightLevel}
                  onChange={(e) => setLightLevel(parseInt(e.target.value, 10))}
                />
              </div>
            )}

            {isTwoLedVisible && (
              <div className="e101-control-row">
                <label>
                  <span>ทดลองถอด/เสียบหลอดไฟ (เปรียบเทียบอนุกรม vs ขนาน)</span>
                </label>
                <div className="e101-preset-row">
                  <button
                    type="button"
                    className={led1Inserted ? 'active' : ''}
                    onClick={() => {
                      setLed1Inserted((v) => !v);
                      playLabSound('wire_plug', soundEnabled);
                    }}
                  >
                    {led1Inserted ? '💡 LED 1: เสียบอยู่' : '🔌 LED 1: ถอดออก'}
                  </button>
                  <button
                    type="button"
                    className={led2Inserted ? 'active' : ''}
                    onClick={() => {
                      setLed2Inserted((v) => !v);
                      playLabSound('wire_plug', soundEnabled);
                    }}
                  >
                    {led2Inserted ? '💡 LED 2: เสียบอยู่' : '🔌 LED 2: ถอดออก'}
                  </button>
                </div>
              </div>
            )}

            <div className="e101-control-row">
              <label>
                <span>RESISTANCE (R1)</span>
                <b>
                  {R} Ω {currentLesson.mode === 'SERIES' ? `(VR1 = ${telemetry.VR1.toFixed(2)}V)` : ''}
                </b>
              </label>
              <input
                type="range"
                min="10"
                max="2000"
                step="10"
                value={R}
                onChange={(e) => {
                  setR(parseInt(e.target.value, 10));
                  setSelectedPart('r1');
                }}
              />
              <div className="e101-preset-row">
                {[100, 220, 470, 1000].map((rPreset) => (
                  <button
                    key={rPreset}
                    type="button"
                    className={R === rPreset ? 'active' : ''}
                    onClick={() => {
                      setR(rPreset);
                      setSelectedPart('r1');
                    }}
                  >
                    {rPreset >= 1000 ? `${rPreset / 1000} kΩ` : `${rPreset} Ω`}
                  </button>
                ))}
                <div
                  className="e101-resistor-bands"
                  title="คลิกเพื่อดูตารางถอดรหัสแถบสี R1"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedPart('r1')}
                >
                  <span className="e101-band" style={{ background: bandColors[0] }} />
                  <span className="e101-band" style={{ background: bandColors[1] }} />
                  <span className="e101-band" style={{ background: bandColors[2] }} />
                  <span className="e101-band" style={{ background: '#d4af37', marginLeft: 3 }} />
                </div>
              </div>
            </div>

            {isR2Visible && (
              <div className="e101-control-row">
                <label>
                  <span>RESISTANCE (R2)</span>
                  <b>
                    {R2} Ω{' '}
                    {currentLesson.mode === 'SERIES'
                      ? `(VR2 = ${telemetry.VR2.toFixed(2)}V)`
                      : currentLesson.mode === 'PARALLEL'
                        ? `(I2 = ${telemetry.I2_mA.toFixed(1)}mA)`
                        : ''}
                  </b>
                </label>
                <input
                  type="range"
                  min="10"
                  max="2000"
                  step="10"
                  value={R2}
                  onChange={(e) => {
                    setR2(parseInt(e.target.value, 10));
                    setSelectedPart('r2');
                  }}
                />
                <div className="e101-preset-row">
                  {[100, 220, 470, 1000].map((rPreset) => (
                    <button
                      key={rPreset}
                      type="button"
                      className={R2 === rPreset ? 'active' : ''}
                      onClick={() => {
                        setR2(rPreset);
                        setSelectedPart('r2');
                      }}
                    >
                      {rPreset >= 1000 ? `${rPreset / 1000} kΩ` : `${rPreset} Ω`}
                    </button>
                  ))}
                  <div
                    className="e101-resistor-bands"
                    title="คลิกเพื่อดูตารางถอดรหัสแถบสี R2"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedPart('r2')}
                  >
                    <span className="e101-band" style={{ background: bandColorsR2[0] }} />
                    <span className="e101-band" style={{ background: bandColorsR2[1] }} />
                    <span className="e101-band" style={{ background: bandColorsR2[2] }} />
                    <span className="e101-band" style={{ background: '#d4af37', marginLeft: 3 }} />
                  </div>
                </div>
              </div>
            )}

            {isWattageVisible && (
              <div className="e101-control-row">
                <label>
                  <span>ขนาดพิกัดกำลังวัตต์ตัวต้านทาน (RESISTOR WATTAGE)</span>
                  <b>
                    {resistorWattage} W ({(resistorWattage * 1000).toFixed(0)} mW)
                  </b>
                </label>
                <div className="e101-preset-row">
                  {[
                    { w: 0.125, label: '1/8 W (125mW)' },
                    { w: 0.25, label: '1/4 W (250mW)' },
                    { w: 0.5, label: '1/2 W (500mW)' },
                    { w: 1.0, label: '1 W (1000mW)' },
                  ].map((item) => (
                    <button
                      key={item.w}
                      type="button"
                      className={resistorWattage === item.w ? 'active' : ''}
                      onClick={() => {
                        setResistorWattage(item.w);
                        setIsBurned(false);
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isWireSizeVisible && (
              <div className="e101-control-row">
                <label>
                  <span>ขนาดสายไฟ มอก.11-2553 &amp; พิกัด CB</span>
                  <b>
                    {wireGaugeMm2} ตร.มม. · CB {breakerRatingA}A
                  </b>
                </label>
                <div className="e101-preset-row">
                  {TIS_WIRE_SIZES.map((spec) => (
                    <button
                      key={spec.mm2}
                      type="button"
                      className={wireGaugeMm2 === spec.mm2 ? 'active' : ''}
                      onClick={() => setWireGaugeMm2(spec.mm2)}
                    >
                      {spec.mm2} mm² ({spec.maxAmpAir}A)
                    </button>
                  ))}
                </div>
                <div className="e101-preset-row" style={{ marginTop: 4 }}>
                  {[10, 15, 20, 30].map((cbA) => (
                    <button
                      key={cbA}
                      type="button"
                      className={breakerRatingA === cbA ? 'active' : ''}
                      onClick={() => {
                        setBreakerRatingA(cbA);
                        setBreakerTripped(false);
                      }}
                    >
                      CB {cbA}A
                    </button>
                  ))}
                </div>
                <small style={{ fontSize: '0.73rem', color: 'var(--e101-text-muted)' }}>
                  {currentWireSpec.cableType}: {currentWireSpec.usageTh}
                </small>
              </div>
            )}

            <div className="e101-control-row">
              <label>
                <span>SUPPLY VOLTAGE (Vs)</span>
                <b>{Vs.toFixed(1)} V</b>
              </label>
              <input
                type="range"
                min="1.5"
                max="12"
                step="0.5"
                value={Vs}
                onChange={(e) => setVs(parseFloat(e.target.value))}
              />
            </div>

            {isCapVisible && (
              <div className="e101-control-row">
                <label>
                  <span>CAPACITANCE (C1)</span>
                  <b>{C} µF</b>
                </label>
                <input
                  type="range"
                  min="47"
                  max="2200"
                  step="10"
                  value={C}
                  onChange={(e) => setC(parseInt(e.target.value, 10))}
                />
              </div>
            )}

            {isBjtVisible && (
              <div className="e101-control-row">
                <label>
                  <span>BASE / DIVIDER RESISTOR (RB)</span>
                  <b>{(Rb / 1000).toFixed(1)} kΩ</b>
                </label>
                <input
                  type="range"
                  min="1000"
                  max="50000"
                  step="500"
                  value={Rb}
                  onChange={(e) => setRb(parseInt(e.target.value, 10))}
                />
              </div>
            )}

            {isSw2Visible && (
              <div className="e101-control-row">
                <button
                  type="button"
                  className="e101-btn-action"
                  onClick={toggleSwitch2WithSound}
                >
                  {currentLesson.mode === 'FUSE_TRIP'
                    ? `⚡ สวิตช์จำลองลัดวงจร (SW2): ${sw2Closed ? 'SHORT CIRCUIT (ลัดวงจร!)' : 'NORMAL (ปกติ)'}`
                    : currentLesson.mode === 'SAFETY_GROUND'
                      ? `🟢 สายดิน Earth Ground (G): ${sw2Closed ? 'CONNECTED (ต่อลงดินปลอดภัย)' : 'DISCONNECTED (สายดินหลุด!)'}`
                      : `Switch 2: ${sw2Closed ? 'CLOSED (ON)' : 'OPEN (OFF)'}`}
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            className={`e101-complete-btn ${isCurrentCompleted ? 'is-done' : ''}`}
            onClick={handleMarkLessonComplete}
          >
            {isCurrentCompleted
              ? `✓ ทดลองบทเรียนนี้แล้ว (${completedLessons.size}/60 บท)`
              : '✅ บันทึกผลการทดลองบทเรียนนี้ (+10 คะแนน)'}
          </button>
        </div>
      </section>

      {/* Bottom 7 Categories / 48 Lessons Selector with Thumbnails */}
      <section aria-label="Lessons" className="e101-lessons-bar">
        <select
          className="e101-cat-select"
          aria-label="Select Category"
          value={category}
          onChange={(e) => selectLesson(e.target.value as ElectronicsCategoryKey, 0)}
        >
          {ELECTRONICS_101_CATEGORIES.map((cat) => (
            <option key={cat.key} value={cat.key}>
              {cat.label}
            </option>
          ))}
        </select>

        <ol className="e101-lesson-list">
          {lessonsInCat.map((les, i) => (
            <li key={les.id}>
              <button
                type="button"
                className={`e101-lesson-card-btn ${i === lessonIndex ? 'active' : ''} ${completedLessons.has(les.id) ? 'completed' : ''}`}
                onClick={() => selectLesson(category, i)}
              >
                <LessonThumbnailSvg category={category} index={i} mode={les.mode} />
                <span className="e101-lesson-card-text">
                  {completedLessons.has(les.id) ? `✓ ${les.title}` : les.title}
                </span>
              </button>
            </li>
          ))}
        </ol>

        <div className="e101-lesson-nav-btns">
          <button
            type="button"
            className="e101-step-nav-btn"
            disabled={lessonIndex === 0}
            onClick={goPrevLesson}
            aria-label="Previous lesson"
          >
            ‹
          </button>
          <button
            type="button"
            className="e101-step-nav-btn is-next"
            disabled={lessonIndex >= lessonsInCat.length - 1}
            onClick={goNextLesson}
            aria-label="Next lesson"
          >
            ›
          </button>
        </div>
      </section>
    </div>
  );
};

export default Electronics101Game;
