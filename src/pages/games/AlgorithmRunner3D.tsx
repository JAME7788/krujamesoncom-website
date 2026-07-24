import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  ArrowUp,
  BatteryMedium,
  CheckCircle2,
  ChevronLeft,
  CornerUpLeft,
  CornerUpRight,
  Flag,
  Lightbulb,
  Play,
  RotateCcw,
  Sparkles,
  Trash2,
  Trophy,
  Undo2,
} from 'lucide-react';
import { useGameProgress } from '../../hooks/useGameProgress';
import './GameStyles.css';
import './AlgorithmRunner3D.css';

type Direction = 0 | 1 | 2 | 3;
type RunnerCommand = 'forward' | 'left' | 'right' | 'jump';
type Position = { x: number; z: number; dir: Direction };

interface RunnerLevel {
  title: string;
  objective: string;
  rows: string[];
  start: [number, number];
  goal: [number, number];
  startDir: Direction;
  optimal: number;
  maxCommands: number;
  hint: string;
}

const LEVELS: RunnerLevel[] = [
  {
    title: 'ทางตรงสู่ธง',
    objective: 'สั่งให้หุ่นยนต์เดินไปถึงธงสีเขียว',
    rows: ['.....', '.S.G.', '.....'],
    start: [1, 1],
    goal: [3, 1],
    startDir: 1,
    optimal: 2,
    maxCommands: 5,
    hint: 'หุ่นยนต์หันหน้าไปทางขวาอยู่แล้ว เดินหน้า 2 ครั้งก็ถึงธง',
  },
  {
    title: 'เลี้ยวให้ถูกทาง',
    objective: 'เดินแล้วเลี้ยวลงไปหาธง',
    rows: ['.....', '.S...', '...G.', '.....'],
    start: [1, 1],
    goal: [3, 2],
    startDir: 1,
    optimal: 4,
    maxCommands: 7,
    hint: 'เดินหน้า 2 ครั้ง เลี้ยวขวา แล้วเดินหน้าอีก 1 ครั้ง',
  },
  {
    title: 'ข้ามหลุมข้อมูล',
    objective: 'ใช้คำสั่งกระโดดข้ามหลุมสีดำ',
    rows: ['......', '.S~G..', '......'],
    start: [1, 1],
    goal: [3, 1],
    startDir: 1,
    optimal: 1,
    maxCommands: 4,
    hint: 'คำสั่งกระโดดจะข้ามช่องอันตราย 1 ช่อง และลงจอดที่ช่องถัดไป',
  },
  {
    title: 'กำแพงทางลัด',
    objective: 'เลือกเส้นทางหรือกระโดดข้ามกำแพงให้ถึงธง',
    rows: ['.......', '.S.#...', '....G..', '.......'],
    start: [1, 1],
    goal: [4, 2],
    startDir: 1,
    optimal: 4,
    maxCommands: 10,
    hint: 'เดินเข้าใกล้กำแพง กระโดดข้าม แล้วเลี้ยวไปหาธง',
  },
  {
    title: 'ภารกิจสองอุปสรรค',
    objective: 'ผสมคำสั่งเดิน กระโดด และเลี้ยวอย่างเป็นขั้นตอน',
    rows: ['.........', '.S.~.#...', '......G..', '.........'],
    start: [1, 1],
    goal: [6, 2],
    startDir: 1,
    optimal: 5,
    maxCommands: 10,
    hint: 'เดินหน้า 1 ครั้ง แล้วกระโดดข้ามหลุมและกำแพง จากนั้นเลี้ยวเข้าหาธง',
  },
  {
    title: 'ธงอยู่ด้านหลัง',
    objective: 'วางแผนการเลี้ยวเมื่อเป้าหมายไม่ได้อยู่ด้านหน้า',
    rows: ['.......', '.G.....', '...S...', '.......'],
    start: [3, 2],
    goal: [1, 1],
    startDir: 0,
    optimal: 4,
    maxCommands: 8,
    hint: 'เลือกเลี้ยวก่อนหรือเดินขึ้นก่อนก็ได้ แต่ต้องหันไปทางซ้ายเพื่อเข้าหาธง',
  },
  {
    title: 'กระโดดสองจังหวะ',
    objective: 'ข้ามกำแพงและหลุมตามลำดับ แล้วเลี้ยวขึ้นหาธง',
    rows: ['.........', '.......G.', '.S.#.~...', '.........'],
    start: [1, 2],
    goal: [7, 1],
    startDir: 1,
    optimal: 6,
    maxCommands: 12,
    hint: 'เดินเข้าใกล้กำแพง กระโดดสองครั้ง แล้วเดินและเลี้ยวขึ้นหาธง',
  },
  {
    title: 'ทางตรงหรือทางลัด',
    objective: 'เปรียบเทียบเส้นทางปกติกับทางลัดที่ต้องใช้การกระโดด',
    rows: ['..........', '......G...', '..#..~....', '.S........', '..........'],
    start: [1, 3],
    goal: [6, 1],
    startDir: 1,
    optimal: 8,
    maxCommands: 14,
    hint: 'เลี้ยวขึ้นไปแถวอุปสรรค แล้วใช้กระโดดข้ามกำแพงและหลุมเพื่อประหยัดคำสั่ง',
  },
];

const COMMANDS: Array<{
  id: RunnerCommand;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
}> = [
  { id: 'forward', label: 'เดินหน้า', shortLabel: 'เดิน', icon: <ArrowUp size={21} /> },
  { id: 'left', label: 'เลี้ยวซ้าย', shortLabel: 'ซ้าย', icon: <CornerUpLeft size={21} /> },
  { id: 'right', label: 'เลี้ยวขวา', shortLabel: 'ขวา', icon: <CornerUpRight size={21} /> },
  { id: 'jump', label: 'กระโดด', shortLabel: 'กระโดด', icon: <Sparkles size={21} /> },
];

const DIRECTION_VECTOR: Record<Direction, [number, number]> = {
  0: [0, -1],
  1: [1, 0],
  2: [0, 1],
  3: [-1, 0],
};

const directionAngle = (direction: Direction) => -direction * (Math.PI / 2);

const createRobot = () => {
  const robot = new THREE.Group();
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.45 });
  const trimMaterial = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
  const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.35 });
  const accentMaterial = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0x7c4a03,
    emissiveIntensity: 0.25,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.72, 0.58), bodyMaterial);
  body.position.y = 0.72;
  body.castShadow = true;
  robot.add(body);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.48, 0.54), trimMaterial);
  head.position.y = 1.28;
  head.castShadow = true;
  robot.add(head);

  [-0.16, 0.16].forEach((x) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12), accentMaterial);
    eye.position.set(x, 1.32, -0.285);
    robot.add(eye);
  });

  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.28, 10), darkMaterial);
  antenna.position.y = 1.66;
  robot.add(antenna);
  const antennaTip = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 12), accentMaterial);
  antennaTip.position.y = 1.84;
  robot.add(antennaTip);

  [-0.24, 0.24].forEach((x) => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.12, 18), darkMaterial);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.3, 0);
    wheel.castShadow = true;
    robot.add(wheel);
  });

  robot.traverse((object) => {
    if (object instanceof THREE.Mesh) object.castShadow = true;
  });
  return robot;
};

const easeInOut = (value: number) => (
  value < 0.5 ? 2 * value * value : 1 - Math.pow(-2 * value + 2, 2) / 2
);

const AlgorithmRunner3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const robotRef = useRef<THREE.Group | null>(null);
  const runTokenRef = useRef(0);
  const [levelIndex, setLevelIndex] = useState(0);
  const [unlockedLevel, setUnlockedLevel] = useState(0);
  const [program, setProgram] = useState<RunnerCommand[]>([]);
  const [running, setRunning] = useState(false);
  const [activeCommand, setActiveCommand] = useState(-1);
  const [energy, setEnergy] = useState(3);
  const [message, setMessage] = useState('วางคำสั่งจากซ้ายไปขวา แล้วกดรันโปรแกรม');
  const [messageTone, setMessageTone] = useState<'info' | 'success' | 'error'>('info');
  const [levelScores, setLevelScores] = useState<number[]>(() => LEVELS.map(() => 0));
  const [showHint, setShowHint] = useState(false);
  const recordGame = useGameProgress('algorithm-runner-3d', 'นักวิ่งอัลกอริทึม 3D');

  const level = LEVELS[levelIndex];
  const totalScore = useMemo(() => levelScores.reduce((sum, score) => sum + score, 0), [levelScores]);
  const completedCount = useMemo(() => levelScores.filter((score) => score > 0).length, [levelScores]);
  const maxScore = LEVELS.length * 30;
  const cols = Math.max(...level.rows.map((row) => row.length));
  const rows = level.rows.length;

  const worldPosition = (x: number, z: number) => new THREE.Vector3(
    x - (cols - 1) / 2,
    0.22,
    z - (rows - 1) / 2
  );

  const setRobotPose = (position: Position) => {
    const robot = robotRef.current;
    if (!robot) return;
    const point = worldPosition(position.x, position.z);
    robot.position.set(point.x, point.y, point.z);
    robot.rotation.y = directionAngle(position.dir);
  };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9ed9f5);
    scene.fog = new THREE.Fog(0x9ed9f5, 10, 28);

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 60);
    const span = Math.max(cols, rows);
    camera.position.set(span * 0.55, span * 0.68 + 1.5, span * 0.75);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.replaceChildren(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 4;
    controls.maxDistance = 22;
    controls.maxPolarAngle = Math.PI * 0.47;
    controls.target.set(0, 0.4, 0);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x315d2c, 2.1));
    const sun = new THREE.DirectionalLight(0xffffff, 2.6);
    sun.position.set(7, 12, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -10;
    sun.shadow.camera.right = 10;
    sun.shadow.camera.top = 10;
    sun.shadow.camera.bottom = -10;
    scene.add(sun);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(cols + 9, rows + 9),
      new THREE.MeshStandardMaterial({ color: 0x4f9b47, roughness: 0.95 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.32;
    ground.receiveShadow = true;
    scene.add(ground);

    const tileGeometry = new THREE.BoxGeometry(0.92, 0.18, 0.92);
    const floorMaterials = [
      new THREE.MeshStandardMaterial({ color: 0xeef2f6, roughness: 0.72 }),
      new THREE.MeshStandardMaterial({ color: 0xdbe5ed, roughness: 0.72 }),
    ];
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xe05c43, roughness: 0.55 });
    const wallTopMaterial = new THREE.MeshStandardMaterial({ color: 0xffb23f, roughness: 0.45 });
    const pitMaterial = new THREE.MeshStandardMaterial({ color: 0x172033, roughness: 0.82 });

    level.rows.forEach((row, z) => {
      Array.from({ length: cols }).forEach((_, x) => {
        const cell = row[x] || ' ';
        const point = worldPosition(x, z);

        if (cell === '~') {
          const pit = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.08, 0.92), pitMaterial);
          pit.position.set(point.x, -0.25, point.z);
          scene.add(pit);
          return;
        }

        if (cell === ' ') return;
        const tile = new THREE.Mesh(tileGeometry, floorMaterials[(x + z) % 2]);
        tile.position.set(point.x, -0.09, point.z);
        tile.receiveShadow = true;
        scene.add(tile);

        if (cell === '#') {
          const wall = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.92, 0.72), wallMaterial);
          wall.position.set(point.x, 0.46, point.z);
          wall.castShadow = true;
          wall.receiveShadow = true;
          scene.add(wall);
          const cap = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.12, 0.78), wallTopMaterial);
          cap.position.set(point.x, 0.98, point.z);
          cap.castShadow = true;
          scene.add(cap);
        }
      });
    });

    const startPoint = worldPosition(level.start[0], level.start[1]);
    const startRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.34, 0.055, 12, 32),
      new THREE.MeshStandardMaterial({ color: 0x2563eb, emissive: 0x123877, emissiveIntensity: 0.35 })
    );
    startRing.rotation.x = Math.PI / 2;
    startRing.position.set(startPoint.x, 0.04, startPoint.z);
    scene.add(startRing);

    const goalPoint = worldPosition(level.goal[0], level.goal[1]);
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.045, 1.65, 12),
      new THREE.MeshStandardMaterial({ color: 0x334155 })
    );
    pole.position.set(goalPoint.x, 0.82, goalPoint.z);
    pole.castShadow = true;
    scene.add(pole);
    const flag = new THREE.Mesh(
      new THREE.PlaneGeometry(0.72, 0.44),
      new THREE.MeshStandardMaterial({ color: 0x16a34a, side: THREE.DoubleSide })
    );
    flag.position.set(goalPoint.x + 0.36, 1.34, goalPoint.z);
    scene.add(flag);

    const robot = createRobot();
    robotRef.current = robot;
    scene.add(robot);
    setRobotPose({
      x: level.start[0],
      z: level.start[1],
      dir: level.startDir,
    });

    const resize = () => {
      const width = Math.max(mount.clientWidth, 320);
      const height = Math.max(mount.clientHeight, 320);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    let animationFrame = 0;
    const animate = () => {
      animationFrame = requestAnimationFrame(animate);
      controls.update();
      flag.rotation.y = Math.sin(Date.now() * 0.002) * 0.1;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      runTokenRef.current += 1;
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrame);
      controls.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
      robotRef.current = null;
      mount.replaceChildren();
    };
    // The whole scene is rebuilt only when the selected level changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelIndex]);

  const tweenRobot = (
    duration: number,
    update: (progress: number, eased: number, robot: THREE.Group) => void
  ) => new Promise<void>((resolve) => {
    const startedAt = performance.now();
    const frame = (now: number) => {
      const robot = robotRef.current;
      if (!robot) {
        resolve();
        return;
      }
      const progress = Math.min(1, (now - startedAt) / duration);
      update(progress, easeInOut(progress), robot);
      if (progress < 1) requestAnimationFrame(frame);
      else resolve();
    };
    requestAnimationFrame(frame);
  });

  const animateMove = async (from: Position, to: Position, jumping: boolean) => {
    const start = worldPosition(from.x, from.z);
    const end = worldPosition(to.x, to.z);
    await tweenRobot(jumping ? 620 : 420, (progress, eased, robot) => {
      robot.position.lerpVectors(start, end, eased);
      robot.position.y = start.y + (jumping ? Math.sin(progress * Math.PI) * 1.35 : Math.sin(progress * Math.PI) * 0.1);
    });
  };

  const animateTurn = async (delta: number) => {
    const startAngle = robotRef.current?.rotation.y || 0;
    await tweenRobot(320, (_progress, eased, robot) => {
      robot.rotation.y = startAngle + delta * eased;
    });
  };

  const animateBump = async (position: Position) => {
    const start = worldPosition(position.x, position.z);
    const [dx, dz] = DIRECTION_VECTOR[position.dir];
    await tweenRobot(360, (progress, _eased, robot) => {
      const amount = Math.sin(progress * Math.PI) * 0.18;
      robot.position.set(start.x + dx * amount, start.y, start.z + dz * amount);
    });
  };

  const cellAt = (x: number, z: number) => {
    if (z < 0 || z >= level.rows.length || x < 0 || x >= cols) return ' ';
    return level.rows[z]?.[x] || ' ';
  };

  const isSafeCell = (x: number, z: number) => {
    const cell = cellAt(x, z);
    return cell !== ' ' && cell !== '#' && cell !== '~';
  };

  const resetRunner = (clearProgram = false) => {
    runTokenRef.current += 1;
    setRunning(false);
    setActiveCommand(-1);
    setEnergy(3);
    setMessageTone('info');
    setMessage('พร้อมเริ่มใหม่ วางคำสั่งแล้วกดรันโปรแกรม');
    if (clearProgram) setProgram([]);
    setRobotPose({ x: level.start[0], z: level.start[1], dir: level.startDir });
  };

  const changeLevel = (nextLevel: number) => {
    if (running || nextLevel > unlockedLevel) return;
    runTokenRef.current += 1;
    setLevelIndex(nextLevel);
    setProgram([]);
    setEnergy(3);
    setActiveCommand(-1);
    setShowHint(false);
    setMessageTone('info');
    setMessage('วางคำสั่งจากซ้ายไปขวา แล้วกดรันโปรแกรม');
  };

  const addCommand = (command: RunnerCommand) => {
    if (running) return;
    if (program.length >= level.maxCommands) {
      setMessageTone('error');
      setMessage(`ด่านนี้ใช้ได้ไม่เกิน ${level.maxCommands} คำสั่ง ลองลบคำสั่งที่ไม่จำเป็น`);
      return;
    }
    setProgram((current) => [...current, command]);
    setMessageTone('info');
    setMessage('จัดลำดับคำสั่งให้ครบ แล้วกดรันโปรแกรม');
  };

  const runProgram = async () => {
    if (running) return;
    if (program.length === 0) {
      setMessageTone('error');
      setMessage('ต้องเพิ่มคำสั่งอย่างน้อย 1 คำสั่งก่อน');
      return;
    }

    const token = runTokenRef.current + 1;
    runTokenRef.current = token;
    let player: Position = {
      x: level.start[0],
      z: level.start[1],
      dir: level.startDir,
    };
    setRobotPose(player);
    setRunning(true);
    setEnergy(3);
    setMessageTone('info');
    setMessage('หุ่นยนต์กำลังทำงานตามโปรแกรมทีละคำสั่ง');

    let reachedGoal = false;
    for (let index = 0; index < program.length; index += 1) {
      if (runTokenRef.current !== token) return;
      setActiveCommand(index);
      const command = program[index];

      if (command === 'left' || command === 'right') {
        const direction = command === 'left'
          ? ((player.dir + 3) % 4) as Direction
          : ((player.dir + 1) % 4) as Direction;
        await animateTurn(command === 'left' ? Math.PI / 2 : -Math.PI / 2);
        player = { ...player, dir: direction };
      } else {
        const [dx, dz] = DIRECTION_VECTOR[player.dir];
        const distance = command === 'jump' ? 2 : 1;
        const target = { ...player, x: player.x + dx * distance, z: player.z + dz * distance };
        const middleCell = cellAt(player.x + dx, player.z + dz);
        const validJump = command !== 'jump' || middleCell === '#' || middleCell === '~';

        if (!isSafeCell(target.x, target.z) || !validJump) {
          await animateBump(player);
          setEnergy((current) => Math.max(0, current - 1));
          setMessageTone('error');
          setMessage(
            command === 'jump' && !validJump
              ? `คำสั่งที่ ${index + 1}: กระโดดใช้สำหรับข้ามหลุมหรือกำแพง 1 ช่อง`
              : `คำสั่งที่ ${index + 1}: เส้นทางข้างหน้าไปไม่ได้ ลองแก้ลำดับคำสั่ง`
          );
          setRunning(false);
          setActiveCommand(-1);
          return;
        }

        await animateMove(player, target, command === 'jump');
        player = target;
      }

      if (player.x === level.goal[0] && player.z === level.goal[1]) {
        reachedGoal = true;
        break;
      }
    }

    setActiveCommand(-1);
    setRunning(false);
    if (!reachedGoal) {
      setMessageTone('error');
      setMessage('โปรแกรมทำงานครบแล้ว แต่ยังไม่ถึงธง ลองเพิ่มหรือสลับคำสั่ง');
      return;
    }

    const efficiencyBonus = Math.max(0, 10 - Math.max(0, program.length - level.optimal) * 2);
    const levelScore = 20 + efficiencyBonus;
    const nextScores = [...levelScores];
    nextScores[levelIndex] = Math.max(nextScores[levelIndex], levelScore);
    setLevelScores(nextScores);
    setUnlockedLevel((current) => Math.min(LEVELS.length - 1, Math.max(current, levelIndex + 1)));
    setMessageTone('success');
    setMessage(
      efficiencyBonus === 10
        ? `ผ่านด่านด้วยโปรแกรมกระชับที่สุด ได้ ${levelScore} คะแนน`
        : `ผ่านด่านแล้ว ได้ ${levelScore} คะแนน ลองลดจำนวนคำสั่งเพื่อรับคะแนนเต็ม`
    );

    if (nextScores.every((score) => score > 0)) {
      recordGame(nextScores.reduce((sum, score) => sum + score, 0));
    }
  };

  const allComplete = completedCount === LEVELS.length;

  return (
    <div className="game-page runner-page">
      <header className="game-topbar runner-topbar">
        <Link to="/games" className="game-back"><ChevronLeft size={18} /> เกมทั้งหมด</Link>
        <div>
          <h2>นักวิ่งอัลกอริทึม 3D</h2>
          <p>วางแผนคำสั่งก่อนลงมือ แล้วสังเกตผลการทำงานของโปรแกรม</p>
        </div>
      </header>

      <div className="runner-status" aria-label="สถานะเกม">
        <div><Trophy size={18} /> คะแนน <strong>{totalScore}/{maxScore}</strong></div>
        <div><Flag size={18} /> ผ่าน <strong>{completedCount}/{LEVELS.length}</strong></div>
        <div><BatteryMedium size={19} /> พลังงาน <strong>{'●'.repeat(energy)}{'○'.repeat(3 - energy)}</strong></div>
        <div>ด่าน <strong>{levelIndex + 1}/{LEVELS.length}</strong></div>
      </div>

      <section className="runner-stage" aria-label={`สนาม 3 มิติ ด่าน ${levelIndex + 1}`}>
        <div ref={mountRef} className="runner-canvas-host" />
        <div className="runner-stage-copy">
          <span>ด่าน {levelIndex + 1}</span>
          <h3>{level.title}</h3>
          <p>{level.objective}</p>
        </div>
        <div className="runner-legend" aria-label="สัญลักษณ์ในสนาม">
          <span><i className="legend-start" /> จุดเริ่ม</span>
          <span><i className="legend-wall" /> กำแพง</span>
          <span><i className="legend-pit" /> หลุม</span>
          <span><i className="legend-goal" /> เป้าหมาย</span>
        </div>
      </section>

      <main className="runner-workbench">
        <section className="runner-palette" aria-labelledby="runner-command-title">
          <div className="runner-section-heading">
            <div>
              <span>ขั้นที่ 1</span>
              <h3 id="runner-command-title">เลือกคำสั่ง</h3>
            </div>
            <small>แตะเพื่อเพิ่มลงในโปรแกรม</small>
          </div>
          <div className="runner-command-buttons">
            {COMMANDS.map((command) => (
              <button
                key={command.id}
                type="button"
                className={`runner-command command-${command.id}`}
                onClick={() => addCommand(command.id)}
                disabled={running}
              >
                {command.icon}
                <span>{command.label}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            className={`runner-hint-toggle${showHint ? ' active' : ''}`}
            onClick={() => setShowHint((current) => !current)}
          >
            <Lightbulb size={18} /> {showHint ? level.hint : 'เปิดคำใบ้เมื่อคิดไม่ออก'}
          </button>
        </section>

        <section className="runner-program" aria-labelledby="runner-program-title">
          <div className="runner-section-heading">
            <div>
              <span>ขั้นที่ 2</span>
              <h3 id="runner-program-title">โปรแกรมของฉัน</h3>
            </div>
            <small>{program.length}/{level.maxCommands} คำสั่ง · เป้าหมาย {level.optimal} คำสั่ง</small>
          </div>

          <div className="runner-sequence" aria-label="ลำดับคำสั่งของโปรแกรม">
            {program.length === 0 ? (
              <p>เลือกคำสั่งด้านบน โปรแกรมจะเรียงทำงานจากซ้ายไปขวา</p>
            ) : (
              program.map((commandId, index) => {
                const command = COMMANDS.find((item) => item.id === commandId)!;
                return (
                  <button
                    key={`${commandId}-${index}`}
                    type="button"
                    className={`runner-program-block command-${commandId}${activeCommand === index ? ' active' : ''}`}
                    onClick={() => !running && setProgram((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                    disabled={running}
                    title="คลิกเพื่อลบคำสั่งนี้"
                  >
                    <span>{index + 1}</span>
                    {command.icon}
                    <b>{command.shortLabel}</b>
                  </button>
                );
              })
            )}
          </div>

          <div className={`runner-message ${messageTone}`} role="status">
            {messageTone === 'success' && <CheckCircle2 size={19} />}
            {messageTone === 'info' && <Lightbulb size={19} />}
            {messageTone === 'error' && <Undo2 size={19} />}
            <span>{message}</span>
          </div>

          <div className="runner-actions">
            <button
              type="button"
              className="runner-icon-action"
              onClick={() => setProgram((current) => current.slice(0, -1))}
              disabled={running || program.length === 0}
              title="ย้อนกลับหนึ่งคำสั่ง"
              aria-label="ย้อนกลับหนึ่งคำสั่ง"
            >
              <Undo2 size={19} />
            </button>
            <button
              type="button"
              className="runner-icon-action"
              onClick={() => {
                setProgram([]);
                resetRunner(false);
              }}
              disabled={running || program.length === 0}
              title="ล้างคำสั่งทั้งหมด"
              aria-label="ล้างคำสั่งทั้งหมด"
            >
              <Trash2 size={19} />
            </button>
            <button type="button" className="runner-reset" onClick={() => resetRunner(false)} disabled={running}>
              <RotateCcw size={18} /> เริ่มตำแหน่งใหม่
            </button>
            <button type="button" className="runner-run" onClick={runProgram} disabled={running}>
              <Play size={20} /> {running ? 'กำลังรันโปรแกรม' : 'รันโปรแกรม'}
            </button>
          </div>
        </section>
      </main>

      <nav className="runner-levels" aria-label="เลือกด่าน">
        <div>
          <strong>เส้นทางการเรียนรู้</strong>
          <span>ผ่านด่านก่อนหน้าเพื่อปลดล็อกด่านถัดไป</span>
        </div>
        <div className="runner-level-list">
          {LEVELS.map((item, index) => {
            const unlocked = index <= unlockedLevel;
            return (
              <button
                key={item.title}
                type="button"
                className={`${index === levelIndex ? 'active' : ''}${levelScores[index] > 0 ? ' solved' : ''}`}
                onClick={() => changeLevel(index)}
                disabled={!unlocked || running}
                title={!unlocked ? 'ผ่านด่านก่อนหน้าเพื่อปลดล็อก' : item.title}
              >
                {levelScores[index] > 0 ? <CheckCircle2 size={17} /> : <span>{index + 1}</span>}
                <b>{item.title}</b>
                {levelScores[index] > 0 && <small>{levelScores[index]}/30</small>}
              </button>
            );
          })}
        </div>
      </nav>

      {allComplete && (
        <section className="runner-complete" aria-label="ผลการเล่นครบทุกด่าน">
          <Trophy size={38} />
          <div>
            <h3>ภารกิจสำเร็จครบทุกด่าน</h3>
            <p>คะแนน {totalScore}/{maxScore} ถูกส่งเข้าสู่กิจกรรมวิทยาการคำนวณแล้ว</p>
          </div>
          <button type="button" onClick={() => changeLevel(0)}>เล่นด่านแรกอีกครั้ง</button>
        </section>
      )}
    </div>
  );
};

export default AlgorithmRunner3D;
