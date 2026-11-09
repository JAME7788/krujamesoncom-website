import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as THREE from 'three';
import { useGameProgress } from '../../hooks/useGameProgress';
import { frameDeltaSeconds } from '../../utils/gameTimers';
import './Electronics101Game.css';
import {
  ELECTRONICS_101_CATEGORIES,
  ELECTRONICS_101_CURRICULUM,
  getResistorBandColors,
  solveElectronicsPhysicsStep,
  type ElectronicsCategoryKey,
  type PhysicsSimulationState,
} from './electronics101Data';

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

type InfoTab = 'overview' | 'components' | 'circuit' | 'maths';

const Electronics101Game: React.FC = () => {
  const recordGame = useGameProgress('electronics-101', 'ห้องปฏิบัติการอิเล็กทรอนิกส์ 3D (Electronics 101)', {
    recordOnce: false,
  });

  const [category, setCategory] = useState<ElectronicsCategoryKey>('basics');
  const [lessonIndex, setLessonIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<InfoTab>('overview');
  const [switchClosed, setSwitchClosed] = useState<boolean>(true);
  const [sw2Closed, setSw2Closed] = useState<boolean>(true);
  const [Vs, setVs] = useState<number>(3.0);
  const [R, setR] = useState<number>(100);
  const [C, setC] = useState<number>(470);
  const [Rb, setRb] = useState<number>(10000);
  const [lightLevel, setLightLevel] = useState<number>(30);
  const [showDMM, setShowDMM] = useState<boolean>(true);
  const [timeScale, setTimeScale] = useState<number>(1.0);
  const [showSchematic, setShowSchematic] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(() => loadCompletedLessons());
  const [clockTime, setClockTime] = useState<string>(() => new Date().toTimeString().split(' ')[0]);

  const [telemetry, setTelemetry] = useState({
    Vload: 3.0,
    I_mA: 11.0,
    I2_mA: 0,
    P_mW: 12.1,
    Vc: 0,
    Ib_uA: 0,
    R_ldr: 15000,
  });

  const currentLesson = useMemo(
    () => ELECTRONICS_101_CURRICULUM[category][lessonIndex] || ELECTRONICS_101_CURRICULUM.basics[0],
    [category, lessonIndex],
  );

  const bandColors = useMemo(() => getResistorBandColors(R), [R]);

  const shellRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scopeCanvasRef = useRef<HTMLCanvasElement>(null);
  const labelsLayerRef = useRef<HTMLDivElement>(null);
  const resetCamRef = useRef<(() => void) | null>(null);

  const simRef = useRef<PhysicsSimulationState>({
    switchClosed: true,
    sw2Closed: true,
    Vs: 3.0,
    R: 100,
    C: 470,
    Vf: 1.9,
    mode: 'DC',
    Vc: 0,
    Vload: 3.0,
    I_mA: 11.0,
    I2_mA: 0,
    P_mW: 12.1,
    Rb: 10000,
    hFE: 200,
    Ib_uA: 0,
    Vb: 0,
    lightLevel: 30,
    R_ldr: 15000,
    timeScale: 1.0,
    simTime: 0,
  });

  // Sync React controls into physics simulation state
  useEffect(() => {
    simRef.current.switchClosed = switchClosed;
    simRef.current.sw2Closed = sw2Closed;
    simRef.current.Vs = Vs;
    simRef.current.R = R;
    simRef.current.C = C;
    simRef.current.Rb = Rb;
    simRef.current.lightLevel = lightLevel;
    simRef.current.mode = currentLesson.mode;
    simRef.current.timeScale = timeScale;
  }, [switchClosed, sw2Closed, Vs, R, C, Rb, lightLevel, currentLesson.mode, timeScale]);

  const selectLesson = useCallback((catKey: ElectronicsCategoryKey, idx: number) => {
    const item = ELECTRONICS_101_CURRICULUM[catKey][idx];
    if (!item) return;
    setCategory(catKey);
    setLessonIndex(idx);
    setVs(item.v);
    setR(item.r);
    setC(item.c ?? 470);
    setRb(item.rb ?? 10000);
    setLightLevel(item.light !== undefined ? item.light : 30);
    setSwitchClosed(item.sw);
    setSw2Closed(true);
    simRef.current.Vc = 0;
    simRef.current.mode = item.mode;
  }, []);

  const handleMarkLessonComplete = useCallback(() => {
    const next = new Set(completedLessons);
    next.add(currentLesson.id);
    setCompletedLessons(next);
    saveCompletedLessons(next);
    const score = Math.min(480, next.size * 10);
    void recordGame(score, `e101-${currentLesson.id}`, 480);
  }, [completedLessons, currentLesson.id, recordGame]);

  // Clock ticker
  useEffect(() => {
    const timer = window.setInterval(() => {
      setClockTime(new Date().toTimeString().split(' ')[0]);
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Three.js 3D Workbench Engine
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
    renderer.toneMappingExposure = 1.15;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0e14);
    scene.fog = new THREE.FogExp2(0x0b0e14, 0.025);

    const camera = new THREE.PerspectiveCamera(42, initW / initH, 0.1, 100);
    const camTarget = new THREE.Vector3(0, 0.4, 0);
    const desiredTarget = new THREE.Vector3(0, 0.4, 0);
    let camRadius = 11.5;
    let desiredRadius = 11.5;
    let camTheta = 0.35;
    let camPhi = 0.92;

    resetCamRef.current = () => {
      desiredTarget.set(0, 0.4, 0);
      desiredRadius = 11.5;
      camTheta = 0.35;
      camPhi = 0.92;
    };

    function updateCameraOrbit() {
      camTarget.lerp(desiredTarget, 0.12);
      camRadius += (desiredRadius - camRadius) * 0.12;
      camera.position.x = camTarget.x + camRadius * Math.sin(camPhi) * Math.sin(camTheta);
      camera.position.y = camTarget.y + camRadius * Math.cos(camPhi);
      camera.position.z = camTarget.z + camRadius * Math.sin(camPhi) * Math.cos(camTheta);
      camera.lookAt(camTarget);
    }

    // Lighting
    scene.add(new THREE.AmbientLight(0xdbeafe, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.6);
    dirLight.position.set(6, 12, 8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(1024, 1024);
    scene.add(dirLight);

    // Workbench & Breadboard Base
    scene.add(new THREE.GridHelper(36, 36, 0x1e293b, 0x151c28));
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(10.2, 0.35, 6.4),
      new THREE.MeshStandardMaterial({ color: 0x161f2e, roughness: 0.7, metalness: 0.1 }),
    );
    board.position.y = -0.175;
    board.receiveShadow = true;
    scene.add(board);

    // 1. Power Supply Unit (-3.5, 0, 0)
    const batteryGroup = new THREE.Group();
    batteryGroup.position.set(-3.5, 0, 0);
    const batBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1.3, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.5 }),
    );
    batBody.position.y = 0.65;
    batBody.castShadow = true;
    const batTop = new THREE.Mesh(
      new THREE.BoxGeometry(1.52, 0.35, 2.22),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.6 }),
    );
    batTop.position.y = 1.15;
    batteryGroup.add(batBody, batTop);
    scene.add(batteryGroup);

    // 2. Interactive Knife Switch (-1.2, 0, -1.5)
    const switchGroup = new THREE.Group();
    switchGroup.position.set(-1.2, 0, -1.5);
    const swBase = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 0.2, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 }),
    );
    swBase.position.y = 0.1;
    const swPivot = new THREE.Group();
    swPivot.position.set(-0.55, 0.28, 0);
    const swBlade = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 0.08, 0.16),
      new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.85, roughness: 0.2 }),
    );
    swBlade.position.set(0.55, 0, 0);
    const swHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 0.45, 16),
      new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 }),
    );
    swHandle.rotation.z = Math.PI / 2;
    swHandle.position.set(1.15, 0.08, 0);
    swPivot.add(swBlade, swHandle);
    switchGroup.add(swBase, swPivot);
    scene.add(switchGroup);

    // 3. 3D Resistor R1 & R2 with 4-Band Color Rings
    const resistorGroup = new THREE.Group();
    resistorGroup.position.set(1.3, 0.55, -1.5);
    const resBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.26, 1.35, 24),
      new THREE.MeshStandardMaterial({ color: 0xd6b88a, roughness: 0.45 }),
    );
    resBody.rotation.z = Math.PI / 2;
    resBody.castShadow = true;
    resistorGroup.add(resBody);

    const bandMeshes: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshStandardMaterial>[] = [];
    [-0.42, -0.16, 0.1, 0.42].forEach((xPos, idx) => {
      const bMat = new THREE.MeshStandardMaterial({
        color: idx === 3 ? 0xd4af37 : 0xff0000,
        roughness: 0.3,
      });
      const bMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.272, 0.272, 0.11, 24), bMat);
      bMesh.rotation.z = Math.PI / 2;
      bMesh.position.x = xPos;
      resistorGroup.add(bMesh);
      bandMeshes.push(bMesh);
    });
    scene.add(resistorGroup);

    const resistor2Group = resistorGroup.clone();
    resistor2Group.position.set(1.3, 0.55, 0);
    scene.add(resistor2Group);

    // 4. Electrolytic Capacitor (0.2, 0, 0)
    const capGroup = new THREE.Group();
    capGroup.position.set(0.2, 0, 0);
    const capCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.48, 1.25, 28),
      new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.3, metalness: 0.5 }),
    );
    capCylinder.position.y = 0.72;
    capCylinder.castShadow = true;
    const capTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 0.05, 28),
      new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.9, roughness: 0.15 }),
    );
    capTop.position.y = 1.35;
    const capChargeRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.15,
    });
    const capChargeRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.58, 0.05, 16, 36),
      capChargeRingMat,
    );
    capChargeRing.rotation.x = Math.PI / 2;
    capChargeRing.position.y = 0.25;
    capGroup.add(capCylinder, capTop, capChargeRing);
    scene.add(capGroup);

    // 5. 3D NPN Transistor TO-92 (0.2, 0, 0.3)
    const bjtGroup = new THREE.Group();
    bjtGroup.position.set(0.2, 0, 0.3);
    const to92Body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, 0.75, 24, 1, false, 0, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35, metalness: 0.2 }),
    );
    to92Body.position.y = 0.85;
    to92Body.castShadow = true;
    const to92Flat = new THREE.Mesh(
      new THREE.PlaneGeometry(0.84, 0.75),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, side: THREE.DoubleSide }),
    );
    to92Flat.position.y = 0.85;
    bjtGroup.add(to92Body, to92Flat);

    const legGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.55, 12);
    const legMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.9,
      roughness: 0.15,
    });
    [-0.24, 0, 0.24].forEach((xOff) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(xOff, 0.25, 0);
      bjtGroup.add(leg);
    });
    const bjtBaseGlowMat = new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      transparent: true,
      opacity: 0.15,
    });
    const bjtBaseGlow = new THREE.Mesh(
      new THREE.TorusGeometry(0.48, 0.04, 12, 32),
      bjtBaseGlowMat,
    );
    bjtBaseGlow.rotation.x = Math.PI / 2;
    bjtBaseGlow.position.y = 0.45;
    bjtGroup.add(bjtBaseGlow);
    scene.add(bjtGroup);

    // 6. 3D LDR / Sensor Unit (-1.2, 0, 0.9)
    const ldrGroup = new THREE.Group();
    ldrGroup.position.set(-1.2, 0, 0.9);
    const ldrDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 0.18, 28),
      new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.4 }),
    );
    ldrDisc.position.y = 0.58;
    ldrDisc.castShadow = true;
    const ldrTrack = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.38, 0.19, 24),
      new THREE.MeshStandardMaterial({
        color: 0xdc2626,
        roughness: 0.3,
        emissive: 0x991b1b,
        emissiveIntensity: 0.2,
      }),
    );
    ldrTrack.position.y = 0.585;
    [-0.22, 0.22].forEach((xOff) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(xOff, 0.28, 0);
      ldrGroup.add(leg);
    });
    const lightConeMat = new THREE.MeshBasicMaterial({
      color: 0xfde047,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    });
    const lightCone = new THREE.Mesh(
      new THREE.ConeGeometry(0.55, 1.3, 24, 1, true),
      lightConeMat,
    );
    lightCone.position.y = 1.3;
    ldrGroup.add(ldrDisc, ldrTrack, lightCone);
    scene.add(ldrGroup);

    // 7. 3D Digital Multimeter Unit (0.1, 0, -2.55)
    const dmmGroup = new THREE.Group();
    dmmGroup.position.set(0.1, 0, -2.55);
    const dmmBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.9, 1.25, 0.45),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 }),
    );
    dmmBody.position.y = 0.65;
    dmmBody.rotation.x = -0.22;
    dmmBody.castShadow = true;
    const dmmScreen = new THREE.Mesh(
      new THREE.BoxGeometry(1.45, 0.48, 0.47),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 }),
    );
    dmmScreen.position.set(0, 0.85, 0.02);
    dmmScreen.rotation.x = -0.22;
    const dmmDial = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.28, 0.52, 20),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 }),
    );
    dmmDial.rotation.x = Math.PI / 2 - 0.22;
    dmmDial.position.set(0, 0.38, 0.05);
    dmmGroup.add(dmmBody, dmmScreen, dmmDial);
    scene.add(dmmGroup);

    // 8. Dual 3D LEDs (Red LED 1 & Green LED 2)
    const ledGroup = new THREE.Group();
    ledGroup.position.set(3.3, 0, 0);
    const ledMat = new THREE.MeshStandardMaterial({
      color: 0xff2222,
      emissive: 0xff0000,
      emissiveIntensity: 0.2,
      roughness: 0.15,
      transparent: true,
      opacity: 0.88,
    });
    const ledDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.48, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      ledMat,
    );
    ledDome.position.y = 1.15;
    const ledCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.65, 28), ledMat);
    ledCyl.position.y = 0.825;
    const ledLight = new THREE.PointLight(0xff3300, 0, 7);
    ledLight.position.set(0, 1.3, 0);
    ledGroup.add(ledDome, ledCyl, ledLight);
    scene.add(ledGroup);

    const led2Mat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x00ff44,
      emissiveIntensity: 0.2,
      roughness: 0.15,
      transparent: true,
      opacity: 0.88,
    });
    const led2Group = new THREE.Group();
    led2Group.position.set(3.3, 0, 1.35);
    const led2Dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.48, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      led2Mat,
    );
    led2Dome.position.y = 1.15;
    const led2Cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.65, 28), led2Mat);
    led2Cyl.position.y = 0.825;
    const led2Light = new THREE.PointLight(0x22ff55, 0, 6);
    led2Light.position.set(0, 1.3, 0);
    led2Group.add(led2Dome, led2Cyl, led2Light);
    scene.add(led2Group);

    // 9. Main Wire Loop, Parallel Branch & Electron Particles
    const wirePoints = [
      new THREE.Vector3(-3.5, 0.25, -0.8),
      new THREE.Vector3(-3.5, 0.25, -1.5),
      new THREE.Vector3(-1.8, 0.25, -1.5),
      new THREE.Vector3(-0.5, 0.25, -1.5),
      new THREE.Vector3(0.5, 0.55, -1.5),
      new THREE.Vector3(2.1, 0.55, -1.5),
      new THREE.Vector3(3.3, 0.25, -1.5),
      new THREE.Vector3(3.3, 0.25, 1.5),
      new THREE.Vector3(-3.5, 0.25, 1.5),
      new THREE.Vector3(-3.5, 0.25, 0.8),
    ];
    const wireCurve = new THREE.CatmullRomCurve3(wirePoints, true, 'catmullrom', 0.12);
    const wireMesh = new THREE.Mesh(
      new THREE.TubeGeometry(wireCurve, 120, 0.055, 12, true),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6, roughness: 0.35 }),
    );
    scene.add(wireMesh);

    const branchCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.2, 0.25, -1.5),
      new THREE.Vector3(-0.2, 0.55, 0),
      new THREE.Vector3(2.5, 0.55, 0),
      new THREE.Vector3(2.5, 0.25, 1.5),
    ]);
    const branchWireMesh = new THREE.Mesh(
      new THREE.TubeGeometry(branchCurve, 40, 0.045, 10, false),
      new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.6, roughness: 0.35 }),
    );
    scene.add(branchWireMesh);

    const PARTICLE_COUNT = 44;
    const particleMeshes: { mesh: THREE.Mesh; t: number }[] = [];
    const pGeo = new THREE.SphereGeometry(0.095, 10, 10);
    const pMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const m = new THREE.Mesh(pGeo, pMat);
      scene.add(m);
      particleMeshes.push({ mesh: m, t: i / PARTICLE_COUNT });
    }

    // Floating 3D-to-2D Pins
    interface PinEntry {
      id: string;
      title: string;
      sub: string;
      pos: THREE.Vector3;
      onClick?: () => void;
      el?: HTMLDivElement;
      valSpan?: HTMLSpanElement;
    }

    const pinsData: PinEntry[] = [
      { id: 'pin-bat', title: 'Supply', sub: 'Click to focus / adjust V', pos: new THREE.Vector3(-3.5, 1.6, 0) },
      {
        id: 'pin-sw',
        title: 'Switch',
        sub: 'Click to toggle open/close',
        pos: new THREE.Vector3(-1.2, 0.9, -1.5),
        onClick: () => setSwitchClosed((prev) => !prev),
      },
      { id: 'pin-res', title: 'Resistor R1', sub: 'Limits current (I = V/R)', pos: new THREE.Vector3(1.3, 1.15, -1.5) },
      { id: 'pin-cap', title: 'Capacitor', sub: 'Stores electric charge', pos: new THREE.Vector3(0.2, 1.65, 0) },
      { id: 'pin-bjt', title: 'Transistor', sub: 'C-B-E Amplifier (β=200)', pos: new THREE.Vector3(0.2, 1.55, 0.3) },
      { id: 'pin-ldr', title: 'Sensor (LDR)', sub: 'Varies Ω with stimulus', pos: new THREE.Vector3(-1.2, 1.65, 0.9) },
      { id: 'pin-dmm', title: 'Multimeter', sub: 'Live V / I / Ω probe', pos: new THREE.Vector3(0.1, 1.5, -2.55) },
      { id: 'pin-led', title: 'LED Load', sub: 'Glows when V > Vf (1.9V)', pos: new THREE.Vector3(3.3, 1.85, 0) },
    ];

    labelsLayer.innerHTML = '';
    pinsData.forEach((p) => {
      const el = document.createElement('div');
      el.className = 'e101-hud-pin';
      const b = document.createElement('b');
      b.textContent = `${p.title} `;
      const valSpan = document.createElement('span');
      valSpan.className = 'val';
      b.appendChild(valSpan);
      const small = document.createElement('small');
      small.textContent = p.sub;
      el.appendChild(b);
      el.appendChild(small);
      el.addEventListener('click', () => {
        desiredTarget.copy(p.pos).setY(0.4);
        desiredRadius = 7.8;
        if (p.onClick) p.onClick();
      });
      labelsLayer.appendChild(el);
      p.el = el;
      p.valSpan = valSpan;
    });

    const historyV = new Array<number>(140).fill(0);
    const historyI = new Array<number>(140).fill(0);

    // Pointer & Keyboard navigation
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
      camTheta -= dx * 0.007;
      camPhi = Math.max(0.25, Math.min(1.42, camPhi - dy * 0.007));
    };
    const onPointerUp = (e: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;
      if (Math.hypot(e.clientX - downX, e.clientY - downY) < 5) {
        const rect = canvas.getBoundingClientRect();
        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(switchGroup.children, true);
        if (hits.length > 0) {
          setSwitchClosed((prev) => !prev);
        }
      }
    };
    const onWheel = (e: WheelEvent) => {
      desiredRadius = Math.max(5.2, Math.min(20, desiredRadius + e.deltaY * 0.008));
    };

    const keys: Record<string, boolean> = {};
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      keys[e.key.toLowerCase()] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const handleResize = () => {
      if (!shell) return;
      const w = Math.max(320, shell.clientWidth);
      const h = Math.max(320, shell.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(handleResize) : null;
    resizeObserver?.observe(shell);
    window.addEventListener('resize', handleResize);

    let animId = 0;
    let lastTime = performance.now();
    let uiTick = 0;

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = frameDeltaSeconds(now, lastTime);
      lastTime = now;

      const panSpeed = 4.5 * dt;
      if (keys['w']) desiredTarget.z -= panSpeed;
      if (keys['s']) desiredTarget.z += panSpeed;
      if (keys['a']) desiredTarget.x -= panSpeed;
      if (keys['d']) desiredTarget.x += panSpeed;
      if (keys['q']) camTheta -= 1.8 * dt;
      if (keys['e']) camTheta += 1.8 * dt;

      updateCameraOrbit();

      const s = simRef.current;
      solveElectronicsPhysicsStep(s, dt);

      const m = s.mode;
      const isCapMode = m === 'RC' || m === 'AC' || m === 'ASTABLE';
      const isBjtMode = m === 'BJT' || m === 'LDR_NIGHT' || m === 'NOT' || m === 'ASTABLE';
      const isLdrMode = m === 'LDR_DIRECT' || m === 'LDR_NIGHT';

      capGroup.visible = isCapMode;
      bjtGroup.visible = isBjtMode;
      ldrGroup.visible = isLdrMode;
      resistor2Group.visible = m === 'SERIES' || m === 'PARALLEL' || m === 'VDIV';
      led2Group.visible = m === 'PARALLEL' || m === 'ASTABLE' || m === 'SERIES';
      branchWireMesh.visible = m === 'PARALLEL' || m === 'VDIV' || m === 'ASTABLE';

      if (m === 'SERIES') {
        resistor2Group.position.set(2.35, 0.55, -1.5);
        ledGroup.position.set(3.3, 0, -0.55);
        led2Group.position.set(3.3, 0, 0.65);
      } else {
        resistor2Group.position.set(1.3, 0.55, 0);
        ledGroup.position.set(3.3, 0, -0.35);
        led2Group.position.set(3.3, 0, 1.15);
      }

      // Update 3D resistor bands
      const colors = getResistorBandColors(s.R);
      bandMeshes[0].material.color.set(colors[0]);
      bandMeshes[1].material.color.set(colors[1]);
      bandMeshes[2].material.color.set(colors[2]);

      // Switch animation
      const targetSwAngle = s.switchClosed ? 0 : 0.65;
      swPivot.rotation.z += (targetSwAngle - swPivot.rotation.z) * 0.2;

      // LEDs & Glow
      const normI = Math.min(1.6, s.I_mA / 25);
      const isOvercurrent = s.I_mA > 35;
      ledMat.color.setHex(isOvercurrent ? 0xffaa00 : 0xff2222);
      ledMat.emissive.setHex(isOvercurrent ? 0xffea00 : 0xff1100);
      ledMat.emissiveIntensity = 0.15 + normI * 2.8;
      ledLight.intensity = normI * 3.5;

      const normI2 = Math.min(1.6, s.I2_mA / 25);
      led2Mat.emissiveIntensity = 0.15 + normI2 * 2.8;
      led2Light.intensity = normI2 * 3.2;

      const capRatio = Math.min(1, s.Vc / Math.max(1, s.Vs));
      capChargeRingMat.opacity = 0.1 + capRatio * 0.85;
      capChargeRing.scale.setScalar(0.95 + capRatio * 0.2);
      bjtBaseGlowMat.opacity = Math.min(0.9, 0.1 + (s.Ib_uA / 150) * 0.8);

      lightConeMat.opacity = (s.lightLevel / 100) * 0.55;
      lightCone.scale.setScalar(0.6 + (s.lightLevel / 100) * 0.5);

      const effDt = dt * s.timeScale;
      const flowSpeed = (s.I_mA / 1000) * 8.5 * effDt;
      particleMeshes.forEach((p) => {
        p.mesh.visible = s.I_mA > 0.05;
        p.t = (p.t + flowSpeed) % 1;
        wireCurve.getPointAt(p.t, p.mesh.position);
      });

      historyV.push(s.Vload);
      historyV.shift();
      historyI.push(s.I_mA);
      historyI.shift();

      // Update projected pins
      const halfW = shell.clientWidth / 2;
      const halfH = shell.clientHeight / 2;
      pinsData.forEach((p) => {
        if (!p.el || !p.valSpan) return;
        const hiddenByMode =
          (p.id === 'pin-cap' && !isCapMode) ||
          (p.id === 'pin-bjt' && !isBjtMode) ||
          (p.id === 'pin-ldr' && !isLdrMode);
        if (hiddenByMode) {
          p.el.style.display = 'none';
          return;
        }
        const v = p.pos.clone().project(camera);
        if (v.z > 1) {
          p.el.style.display = 'none';
        } else {
          p.el.style.display = 'block';
          p.el.style.left = `${v.x * halfW + halfW}px`;
          p.el.style.top = `${-(v.y * halfH) + halfH}px`;
        }
      });

      if (pinsData[0].valSpan) pinsData[0].valSpan.textContent = `${s.Vs.toFixed(1)}V`;
      if (pinsData[1].valSpan) pinsData[1].valSpan.textContent = s.switchClosed ? 'CLOSED' : 'OPEN';
      if (pinsData[2].valSpan) pinsData[2].valSpan.textContent = `${s.R}Ω`;
      if (pinsData[3].valSpan) pinsData[3].valSpan.textContent = `${s.Vc.toFixed(1)}V`;
      if (pinsData[4].valSpan) pinsData[4].valSpan.textContent = `Ib:${s.Ib_uA.toFixed(0)}µA`;
      if (pinsData[5].valSpan) {
        pinsData[5].valSpan.textContent =
          s.R_ldr >= 1000 ? `${(s.R_ldr / 1000).toFixed(1)}kΩ` : `${s.R_ldr}Ω`;
      }
      if (pinsData[6].valSpan) pinsData[6].valSpan.textContent = `${s.Vload.toFixed(2)}V`;
      if (pinsData[7].valSpan) {
        pinsData[7].valSpan.textContent = s.I_mA > 35 ? 'OVERLOAD!' : `${s.I_mA.toFixed(1)}mA`;
      }

      // Draw Oscilloscope
      const scopeCanvas = scopeCanvasRef.current;
      const scopeCtx = scopeCanvas?.getContext('2d');
      if (scopeCtx && scopeCanvas) {
        const w = scopeCanvas.width;
        const h = scopeCanvas.height;
        scopeCtx.clearRect(0, 0, w, h);

        scopeCtx.strokeStyle = 'rgba(255,255,255,0.06)';
        scopeCtx.beginPath();
        for (let x = 0; x < w; x += 34) {
          scopeCtx.moveTo(x, 0);
          scopeCtx.lineTo(x, h);
        }
        for (let y = 0; y < h; y += 25) {
          scopeCtx.moveTo(0, y);
          scopeCtx.lineTo(w, y);
        }
        scopeCtx.stroke();

        scopeCtx.strokeStyle = '#38bdf8';
        scopeCtx.lineWidth = 2;
        scopeCtx.beginPath();
        historyV.forEach((v, i) => {
          const x = (i / (historyV.length - 1)) * w;
          const y = h - 8 - (v / 12) * (h - 16);
          if (i === 0) scopeCtx.moveTo(x, y);
          else scopeCtx.lineTo(x, y);
        });
        scopeCtx.stroke();

        scopeCtx.strokeStyle = '#f59e0b';
        scopeCtx.lineWidth = 1.8;
        scopeCtx.beginPath();
        historyI.forEach((curr, i) => {
          const x = (i / (historyI.length - 1)) * w;
          const y = h - 8 - (Math.min(50, curr) / 50) * (h - 16);
          if (i === 0) scopeCtx.moveTo(x, y);
          else scopeCtx.lineTo(x, y);
        });
        scopeCtx.stroke();
      }

      renderer.render(scene, camera);

      if (++uiTick % 12 === 0) {
        setTelemetry({
          Vload: s.Vload,
          I_mA: s.I_mA,
          I2_mA: s.I2_mA,
          P_mW: s.P_mW,
          Vc: s.Vc,
          Ib_uA: s.Ib_uA,
          R_ldr: s.R_ldr,
        });
      }
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
      renderer.dispose();
    };
  }, []);

  const lessonsInCat = ELECTRONICS_101_CURRICULUM[category];
  const isCapVisible =
    currentLesson.mode === 'RC' || currentLesson.mode === 'AC' || currentLesson.mode === 'ASTABLE';
  const isBjtVisible =
    currentLesson.mode === 'BJT' || currentLesson.mode === 'LDR_NIGHT' || currentLesson.mode === 'NOT';
  const isLdrVisible =
    currentLesson.mode === 'LDR_DIRECT' || currentLesson.mode === 'LDR_NIGHT';
  const isSw2Visible = currentLesson.mode === 'AND' || currentLesson.mode === 'SPDT';
  const isCurrentCompleted = completedLessons.has(currentLesson.id);

  return (
    <div ref={shellRef} className={`e101-shell ${isFullscreen ? 'is-fullscreen' : ''}`}>
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
              onClick={() => setShowSchematic(true)}
            >
              <span>2D Circuit & Breadboard</span>
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
        <p>Discover · Experiment · Build (48 3D Lessons)</p>
      </header>

      <main className="e101-main">
        <canvas
          ref={canvasRef}
          className="e101-canvas"
          aria-label="Interactive 3D workbench. Drag or use WASD to pan, Q and E to rotate, scroll to zoom."
        />

        {/* 3D-to-2D Projected Floating Pins */}
        <div ref={labelsLayerRef} className="e101-labels-layer" />

        {/* Part Inspector */}
        <div aria-label="Part inspector" role="region" className="e101-inspector">
          <div className="e101-inspector-title">
            <h3>Part Inspector</h3>
            <span style={{ fontSize: '0.76rem', fontFamily: 'var(--e101-font-mono)', color: 'var(--e101-green)' }}>
              ONLINE
            </span>
          </div>

          <div className="e101-control-row">
            <button
              type="button"
              className="e101-btn-action"
              style={{ borderColor: switchClosed ? 'var(--e101-green)' : 'var(--e101-red)' }}
              onClick={() => setSwitchClosed((v) => !v)}
            >
              Switch 1: {switchClosed ? 'CLOSED (ON)' : 'OPEN (OFF)'}
            </button>
            {isSw2Visible && (
              <button
                type="button"
                className="e101-btn-action"
                style={{
                  marginTop: 6,
                  borderColor: sw2Closed ? 'var(--e101-green)' : 'var(--e101-red)',
                }}
                onClick={() => setSw2Closed((v) => !v)}
              >
                Switch 2: {sw2Closed ? 'CLOSED (ON)' : 'OPEN (OFF)'}
              </button>
            )}
          </div>

          <div className="e101-control-row">
            <label>
              <span>Supply Voltage (Vs)</span>
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

          <div className="e101-control-row">
            <label>
              <span>Resistance (R1)</span>
              <b>{R} Ω</b>
            </label>
            <input
              type="range"
              min="10"
              max="2000"
              step="10"
              value={R}
              onChange={(e) => setR(parseInt(e.target.value, 10))}
            />
            <div className="e101-resistor-bands" title="4-Band Resistor Colour Code">
              <span className="e101-band" style={{ background: bandColors[0] }} />
              <span className="e101-band" style={{ background: bandColors[1] }} />
              <span className="e101-band" style={{ background: bandColors[2] }} />
              <span className="e101-band" style={{ background: '#d4af37', marginLeft: 6 }} />
            </div>
          </div>

          {isCapVisible && (
            <div className="e101-control-row">
              <label>
                <span>Capacitance (C1)</span>
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
                <span>Base / Trimmer (RB)</span>
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

          {isLdrVisible && (
            <div className="e101-control-row">
              <label>
                <span>Sensor Stimulus (Light/Temp)</span>
                <b>{lightLevel} %</b>
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
        </div>

        {/* Oscilloscope Chart */}
        <section aria-label="Chart" className="e101-chart-panel">
          <header>
            <span style={{ color: 'var(--e101-cyan)' }}>■ V_load (V)</span>
            <span style={{ color: 'var(--e101-accent)' }}>■ Current (mA)</span>
            <span>
              {telemetry.Vload.toFixed(1)}V | {telemetry.I_mA.toFixed(1)}mA
            </span>
          </header>
          <canvas ref={scopeCanvasRef} className="e101-scope-canvas" width={272} height={100} />
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
                  <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Circuit Schematic & Breadboard View</h2>
                  <span style={{ fontSize: '0.8rem', color: 'var(--e101-text-muted)' }}>
                    Live interactive topology ({currentLesson.mode})
                  </span>
                </div>
                <button
                  type="button"
                  className="e101-toolbar-btn"
                  onClick={() => setShowSchematic(false)}
                >
                  Close ✕
                </button>
              </header>
              <div className="e101-schematic-box">
                <svg width="560" height="240" viewBox="0 0 560 240" fill="none" stroke="#f1f5f9" strokeWidth="2.5">
                  <line x1="60" y1="50" x2="170" y2="50" />
                  <line
                    x1="170"
                    y1="50"
                    x2="220"
                    y2={switchClosed ? 50 : 22}
                    stroke="#f59e0b"
                    strokeWidth="3.5"
                  />
                  <circle cx="170" cy="50" r="4" fill="#f59e0b" />
                  <circle cx="225" cy="50" r="4" fill="#f59e0b" />
                  <line x1="225" y1="50" x2="290" y2="50" />
                  <rect x="290" y="36" width="85" height="28" fill="#1e293b" stroke="#38bdf8" />
                  <text x="302" y="55" fill="#38bdf8" fontSize="13" fontFamily="monospace" stroke="none">
                    R1={R}Ω
                  </text>
                  <line x1="375" y1="50" x2="470" y2="50" />
                  <line x1="470" y1="50" x2="470" y2="185" />
                  <polygon
                    points="456,105 484,105 470,132"
                    fill={telemetry.I_mA > 0.2 ? '#ef4444' : 'none'}
                    stroke="#ef4444"
                  />
                  <line x1="454" y1="132" x2="486" y2="132" stroke="#ef4444" />
                  <line x1="470" y1="185" x2="60" y2="185" />
                  <line x1="60" y1="50" x2="60" y2="105" />
                  <line x1="42" y1="105" x2="78" y2="105" stroke="#22c55e" strokeWidth="3" />
                  <line x1="50" y1="119" x2="70" y2="119" stroke="#22c55e" strokeWidth="3" />
                  <line x1="60" y1="119" x2="60" y2="185" />
                  <text x="76" y="117" fill="#22c55e" fontSize="13" fontFamily="monospace" stroke="none">
                    {Vs.toFixed(1)}V ({currentLesson.mode})
                  </text>
                  <text x="385" y="122" fill="#f59e0b" fontSize="13" fontFamily="monospace" stroke="none">
                    I={telemetry.I_mA.toFixed(1)}mA
                  </text>
                </svg>
              </div>
            </section>
          </div>
        )}

        {/* 3D View Controls Toolbar */}
        <div aria-label="3D view" role="toolbar" className="e101-view-toolbar">
          <span>Drag/WASD: Pan · Q/E: Rotate · Scroll: Zoom · Click Pin: Focus</span>
          <button
            type="button"
            className={`e101-toolbar-btn ${timeScale !== 1.0 ? 'active' : ''}`}
            onClick={() => setTimeScale((prev) => (prev === 1.0 ? 0.04 : 1.0))}
          >
            {timeScale === 1.0 ? 'Speed: 1x (Real)' : 'Speed: 0.04x (25x Slow)'}
          </button>
          <button
            type="button"
            className="e101-toolbar-btn"
            onClick={() => resetCamRef.current?.()}
          >
            Reset Camera
          </button>
        </div>
      </main>

      {/* Progress & Clock */}
      <section aria-label="Progress" className="e101-progress-panel">
        <div className="e101-prog-wrap">
          <div className="e101-prog-head">
            <span>{category.toUpperCase()}</span>
            <span>
              {lessonIndex + 1}/{lessonsInCat.length} (สะสม {completedLessons.size}/48)
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

      {/* 4-Tab Lesson Information */}
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
          {activeTab === 'overview' && (
            <>
              <h3 style={{ color: '#fff', marginBottom: 6, marginTop: 0 }}>{currentLesson.title}</h3>
              <p style={{ color: 'var(--e101-text-muted)', margin: 0 }}>{currentLesson.desc}</p>
              <div className="e101-telemetry-grid">
                <div className="e101-stat-card">
                  <span>Load Current (I)</span>
                  <b>{telemetry.I_mA.toFixed(2)} mA</b>
                </div>
                <div className="e101-stat-card">
                  <span>Resistor Power (P)</span>
                  <b>{telemetry.P_mW.toFixed(1)} mW</b>
                </div>
              </div>
            </>
          )}
          {activeTab === 'components' && (
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7, margin: 0, padding: 0 }}>
              <li>
                <b style={{ color: 'var(--e101-accent)' }}>Supply:</b> {Vs.toFixed(1)} V (Topology: {currentLesson.mode})
              </li>
              <li>
                <b style={{ color: 'var(--e101-accent)' }}>Switch 1:</b> {switchClosed ? 'Closed (ON)' : 'Open (OFF)'}
              </li>
              <li>
                <b style={{ color: 'var(--e101-accent)' }}>Resistor R1:</b> {R} Ω (±5% Gold)
              </li>
              <li>
                <b style={{ color: 'var(--e101-accent)' }}>Digital Multimeter:</b> Reading {telemetry.Vload.toFixed(2)} V /{' '}
                {telemetry.I_mA.toFixed(2)} mA
              </li>
            </ul>
          )}
          {activeTab === 'circuit' && (
            <>
              <p style={{ margin: 0 }}>
                Circuit State:{' '}
                <b style={{ color: switchClosed ? 'var(--e101-green)' : 'var(--e101-red)' }}>
                  {switchClosed ? 'CLOSED LOOP' : 'OPEN CIRCUIT'}
                </b>
              </p>
              <div className="e101-formula-box">
                V_supply = {Vs.toFixed(2)} V | V_load = {telemetry.Vload.toFixed(2)} V
                <br />
                Branch 1 = {telemetry.I_mA.toFixed(2)} mA | Branch 2 = {telemetry.I2_mA.toFixed(2)} mA
                <br />
                Status = {telemetry.I_mA > 35 ? '⚠️ OVERCURRENT (>35mA)' : '✅ SAFE OPERATING AREA'}
              </div>
            </>
          )}
          {activeTab === 'maths' && (
            <>
              <p style={{ margin: 0 }}>Live Ohm&apos;s &amp; Kirchhoff&apos;s Law Maths:</p>
              <div className="e101-formula-box">
                I = (V_s - V_f) / R = <b>{telemetry.I_mA.toFixed(2)} mA</b>
                <br />
                P = I² × R = <b>{telemetry.P_mW.toFixed(1)} mW</b>
                <br />
                RC Time Constant (τ) = <b>{((R * C) / 1000).toFixed(1)} ms</b>
              </div>
            </>
          )}

          <button
            type="button"
            className={`e101-complete-btn ${isCurrentCompleted ? 'is-done' : ''}`}
            onClick={handleMarkLessonComplete}
          >
            {isCurrentCompleted
              ? `✓ ทดลองบทเรียนนี้แล้ว (${completedLessons.size}/48 บท)`
              : '✅ บันทึกผลการทดลองบทเรียนนี้ (+10 คะแนน)'}
          </button>
        </div>
      </section>

      {/* All 7 Categories / 48 Lessons Selector */}
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
                className={`${i === lessonIndex ? 'active' : ''} ${completedLessons.has(les.id) ? 'completed' : ''}`}
                onClick={() => selectLesson(category, i)}
              >
                {completedLessons.has(les.id) ? `✓ ${les.title}` : les.title}
              </button>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
};

export default Electronics101Game;
