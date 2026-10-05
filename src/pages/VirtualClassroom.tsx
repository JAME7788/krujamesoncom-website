import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import {
  BookOpen,
  Box,
  BrickWall,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsUp,
  Crown,
  DoorClosed,
  DoorOpen,
  Eraser,
  Eye,
  Flag,
  Gauge,
  Gamepad2,
  Hammer,
  Hand,
  Home,
  LayoutDashboard,
  Library,
  LockKeyhole,
  LogOut,
  Maximize2,
  Menu,
  MonitorPlay,
  MoveDown,
  MoveLeft,
  MoveRight,
  MoveUp,
  Palette,
  Presentation,
  Radio,
  RotateCcw,
  ScanFace,
  Settings2,
  ShieldCheck,
  Sparkles,
  Star,
  UserCheck,
  UserX,
  Users,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { findGrade } from '../data/curriculum';
import { gamesCatalog } from '../data/gamesCatalog';
import { celebrate } from '../utils/celebrate';
import { virtualAudioService } from '../services/virtualAudioService';
import { QUESTION_BANK } from '../data/ctBoardGame';
import type { CTQuestion, CTPillar } from '../data/ctBoardGame';
import { ageTierFromClassroom, ageTierLabel } from '../data/gameLessons';
import { getRichSlides } from '../data/richSlides';
import type { RichSlide } from '../data/richSlides';
import { unitExtras } from '../data/unitExtras';
import type { UnitExtras } from '../data/unitExtras';
import { getDefaultProgressGradeIdForClassroom } from '../services/courseAccessService';
import {
  fetchStudentProgress,
  getUnitProgress,
  trackWorldMissionEvidence,
} from '../services/progressService';
import type { MissionEvidenceKind, UnitProgress } from '../services/progressService';
import { syncStudentGradesFromProgress } from '../services/gameProgressService';
import { fetchCustomSlides } from '../services/slideService';
import {
  addWorldBlock,
  cleanupVirtualQaRoom,
  clearWorldBlocks,
  defaultVirtualRoomState,
  getWeekDisplayLabel,
  getWorldWeekKey,
  MAX_WORLD_BLOCKS,
  recordWorldActivityEvent,
  removeWorldBlock,
  removeWorldPlayer,
  setVirtualRoomAccessCode,
  subscribeVirtualRoomState,
  subscribeWorldActivityEvents,
  subscribeWorldBlocks,
  subscribeWorldPlayers,
  updateVirtualRoomState,
  updateWorldPlayer,
  verifyVirtualRoomAccessCode,
} from '../services/virtualClassroomService';
import type {
  BlockMaterial,
  VirtualRoomState,
  WorldActivityEvent,
  WorldBlock,
  WorldPlayer,
  WorldSyncMode,
} from '../services/virtualClassroomService';
import './VirtualClassroom.css';

type WorldMode = 'explore' | 'build';
type GraphicsQuality = 'low' | 'medium' | 'high';

const GUEST_PLAYER_ID = `guest_${crypto.randomUUID().slice(0, 8)}`;

interface LessonBoard {
  unitNo: number;
  title: string;
  topics: string[];
  href: string;
  slides: RichSlide[];
  extras?: UnitExtras;
  visualColor: string;
  visualEmoji: string;
}

interface GameStation {
  id: string;
  title: string;
  skill: string;
  path: string;
  color: string;
}

const CLASSROOMS = ['ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6', 'ม.1', 'ม.2', 'ม.3'];
const AVATAR_COLORS = ['#2563eb', '#e11d48', '#16a34a', '#9333ea', '#ea580c', '#0891b2'];
const LESSON_COLORS = ['#2563eb', '#ea580c', '#16a34a', '#7c3aed'];

const initialGraphicsQuality = (): GraphicsQuality => {
  const saved = localStorage.getItem('kj_world_graphics');
  if (saved === 'low' || saved === 'medium' || saved === 'high') return saved;
  const device = navigator as Navigator & { deviceMemory?: number };
  if (window.matchMedia('(max-width: 720px)').matches || (device.deviceMemory || 4) <= 2) return 'low';
  if ((device.deviceMemory || 4) <= 4 || navigator.hardwareConcurrency <= 4) return 'medium';
  return 'high';
};

const lessonEmoji = (title: string, topics: string[], index: number) => {
  const text = `${title} ${topics.join(' ')}`;
  if (/\bAI\b|ปัญญาประดิษฐ์|หุ่นยนต์/i.test(text)) return '🤖';
  if (/ปลอดภัย|กฎหมาย|ภัย|สิทธิ|ดิจิทัล/i.test(text)) return '🛡️';
  if (/ข้อมูล|สารสนเทศ|ประมวลผล|ตาราง/i.test(text)) return '📊';
  if (/โปรแกรม|อัลกอริทึม|ขั้นตอน|ผังงาน|โค้ด/i.test(text)) return '🧩';
  if (/อุปกรณ์|คอมพิวเตอร์|เทคโนโลยีเบื้องต้น/i.test(text)) return '💻';
  if (/ออกแบบ|โครงงาน|สร้างสรรค์/i.test(text)) return '🛠️';
  return ['💡', '🔎', '🧠', '🚀'][index % 4];
};

const FILE_GAME_STATION: GameStation = {
  id: 'files',
  title: 'จัดแฟ้มข้อมูล',
  skill: 'จำแนกและจัดเก็บข้อมูล',
  path: '/games/file-organizer',
  color: '#1d4ed8',
};

const RUNNER_GAME_STATION: GameStation = {
  id: 'runner-3d',
  title: 'นักวิ่งอัลกอริทึม 3D',
  skill: 'วางแผนและตรวจสอบโปรแกรม',
  path: '/games/algorithm-runner-3d',
  color: '#2563eb',
};

const CIRCUIT_GAME_STATION: GameStation = {
  id: 'circuit-lab',
  title: 'ห้องทดลองวงจรไฟฟ้า',
  skill: 'ออกแบบวงจรและแก้ปัญหา',
  path: '/games/circuit-lab',
  color: '#0f766e',
};

const GAME_STATIONS: GameStation[] = [
  { id: 'device', title: 'จับคู่อุปกรณ์', skill: 'รู้จักอุปกรณ์คอมพิวเตอร์', path: '/games/device-match', color: '#0ea5e9' },
  { id: 'step', title: 'เรียงขั้นตอน', skill: 'คิดเป็นลำดับ', path: '/games/step-sort', color: '#f97316' },
  { id: 'mouse', title: 'ภารกิจเมาส์', skill: 'ฝึกควบคุมเมาส์', path: '/games/mouse-practice', color: '#2563eb' },
  { id: 'maze', title: 'Coding Maze', skill: 'เขียนโปรแกรมแบบบล็อก', path: '/games/coding-maze', color: '#7c3aed' },
  { id: 'algorithm', title: 'จัดอัลกอริทึม', skill: 'วางแผนแก้ปัญหา', path: '/games/algorithm-sorter', color: '#16a34a' },
  { id: 'safety', title: 'ดิจิทัลปลอดภัย', skill: 'รู้เท่าทันภัยออนไลน์', path: '/games/safety', color: '#0f766e' },
  { id: 'quick', title: 'ตอบไวคอมพิวเตอร์', skill: 'ทบทวนความรู้', path: '/games/quick-answer-computing', color: '#dc2626' },
  { id: 'binary', title: 'เลขฐานสอง', skill: 'คิดแบบคอมพิวเตอร์', path: '/games/binary', color: '#d97706' },
  { id: 'snake', title: 'งูกินผลไม้', skill: 'ฝึกตรรกะและเงื่อนไข', path: '/games/snake', color: '#15803d' },
  FILE_GAME_STATION,
  RUNNER_GAME_STATION,
  CIRCUIT_GAME_STATION,
];

const gamesForClassroom = (classroom: string) => {
  if (classroom.startsWith('ป.1') || classroom.startsWith('ป.2') || classroom.startsWith('ป.3')) {
    return [FILE_GAME_STATION, ...GAME_STATIONS.slice(0, 2)];
  }
  if (classroom.startsWith('ป.')) return [CIRCUIT_GAME_STATION, RUNNER_GAME_STATION, FILE_GAME_STATION];
  return [CIRCUIT_GAME_STATION, RUNNER_GAME_STATION, FILE_GAME_STATION];
};

const MATERIALS: Array<{ id: BlockMaterial; color: string; label: string }> = [
  { id: 'grass', color: '#65a30d', label: 'หญ้า' },
  { id: 'brick', color: '#dc5f45', label: 'อิฐ' },
  { id: 'wood', color: '#a16207', label: 'ไม้' },
  { id: 'glass', color: '#7dd3fc', label: 'กระจก' },
  { id: 'gold', color: '#facc15', label: 'ทอง' },
  { id: 'stone', color: '#94a3b8', label: 'หิน' },
  { id: 'sand', color: '#e0c896', label: 'ทราย' },
  { id: 'ice', color: '#a5d8f0', label: 'น้ำแข็ง' },
  { id: 'ruby', color: '#e11d48', label: 'อัญมณี' },
];

// ภารกิจสร้าง — เปลี่ยน "การวางบล็อก" ให้เป็น "การเรียนรู้" (มีเป้าหมาย ตรวจได้ ได้ดาว+คะแนน P)
interface BuildStats { count: number; maxHeight: number; materials: number; ruby: number; }
interface BuildMission {
  id: string; icon: string; title: string; concept: string; goal: string; stars: number;
  check: (s: BuildStats) => boolean; progress: (s: BuildStats) => string;
}
const BUILD_MISSIONS: BuildMission[] = [
  { id: 'wall10', icon: '🧱', title: 'กำแพงเริ่มต้น', concept: 'นับปริมาณและวางแผนใช้ทรัพยากร', goal: 'วางบล็อกรวม 10 ก้อน', stars: 2, check: (s) => s.count >= 10, progress: (s) => `วางแล้ว ${s.count}/10 ก้อน` },
  { id: 'palette5', icon: '🌈', title: 'จานสีข้อมูล', concept: 'คอมพิวเตอร์เก็บภาพเป็นข้อมูลสี', goal: 'ใช้บล็อกให้ครบ 5 สีต่างกัน', stars: 2, check: (s) => s.materials >= 5, progress: (s) => `ใช้แล้ว ${s.materials}/5 สี` },
  { id: 'tower8', icon: '🔢', title: 'หอคอย 8 บิต', concept: 'เลขฐานสอง 1 ไบต์ = 8 บิต', goal: 'สร้างหอสูง 8 ชั้น', stars: 3, check: (s) => s.maxHeight >= 8, progress: (s) => `สูง ${s.maxHeight}/8 ชั้น` },
  { id: 'gems5', icon: '💎', title: 'ล่าอัญมณี', concept: 'เงื่อนไข: เลือกเฉพาะบล็อกอัญมณี', goal: 'วางบล็อกอัญมณี 5 ก้อน', stars: 3, check: (s) => s.ruby >= 5, progress: (s) => `อัญมณี ${s.ruby}/5 ก้อน` },
];

const WORLD_SIZE = 96;
const BUILD_REACH = 15;
const BUILD_BOUNDARY = 46;
const BUILD_MAX_HEIGHT = 24;
const PLAYER_BOUNDARY = 47;

const playerHash = (id: string) => {
  let hash = 0;
  for (const char of id) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  return Math.abs(hash);
};

const playerColor = (id: string) => AVATAR_COLORS[playerHash(id) % AVATAR_COLORS.length];

const playerSpawn = (id: string) => {
  if (id === 'admin_teacher_account') return { x: 0, z: 15 };
  const studentNumber = Number(id.match(/_(\d+)_/)?.[1]);
  const slot = Number.isFinite(studentNumber) && studentNumber > 0
    ? (studentNumber - 1) % 35
    : playerHash(id) % 35;
  return {
    x: (slot % 7 - 3) * 1.45,
    z: 9.5 + Math.floor(slot / 7) * 1.35,
  };
};

const wrapCanvasText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
) => {
  const rawTokens = text.replace(/\s+/g, ' ').trim().match(/\S+\s*/g) || [];
  const words = rawTokens.flatMap((token) => (
    ctx.measureText(token).width > maxWidth ? Array.from(token) : [token]
  ));
  const lines: string[] = [];
  let line = '';
  words.forEach((word) => {
    const next = `${line}${word}`;
    if (ctx.measureText(next).width > maxWidth && line) {
      if (lines.length < maxLines) lines.push(line.trim());
      line = word;
    } else line = next;
  });
  if (line && lines.length < maxLines) lines.push(line.trim());
  return lines;
};

const createSlideTexture = (board: LessonBoard) => {
  const slide = board.slides[0];
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const themeColors: Record<string, string> = {
    blue: '#2563eb', green: '#15803d', orange: '#ea580c', purple: '#7c3aed',
    pink: '#db2777', yellow: '#ca8a04', red: '#dc2626',
  };
  const accent = board.visualColor || themeColors[slide?.theme || 'blue'];
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, 1024, 70);
  ctx.fillStyle = '#eff6ff';
  ctx.fillRect(0, 460, 1024, 52);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 28px Sarabun, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`สไลด์บทเรียน · หน่วยที่ ${board.unitNo}`, 44, 36);
  ctx.fillStyle = '#172033';
  ctx.font = '800 50px Sarabun, sans-serif';
  const titleLines = wrapCanvasText(ctx, slide?.title || board.title, 735, 2);
  titleLines.forEach((text, index) => ctx.fillText(text, 48, 128 + index * 58));
  ctx.fillStyle = '#f1f5f9';
  ctx.beginPath();
  ctx.arc(892, 145, 72, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = '76px "Segoe UI Emoji", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(slide?.emoji || board.visualEmoji, 892, 148);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#475569';
  ctx.font = '500 29px Sarabun, sans-serif';
  const body = slide?.body || slide?.bullets?.map((item) => item.text).join(' · ') || board.topics[0] || 'เปิดเพื่อดูเนื้อหาบทเรียน';
  wrapCanvasText(ctx, body, 900, 3).forEach((text, index) => ctx.fillText(text, 50, 270 + index * 42));
  ctx.fillStyle = accent;
  ctx.font = '700 25px Sarabun, sans-serif';
  ctx.fillText(`${board.slides.length} สไลด์ · กิจกรรม · แบบทดสอบ · สื่อเสริม`, 48, 486);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

const createGameTexture = (game: GameStation) => {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = game.color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(255,255,255,.16)';
  ctx.fillRect(30, 30, 708, 452);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '800 44px Sarabun, sans-serif';
  wrapCanvasText(ctx, game.title, 620, 2).forEach((text, index) => ctx.fillText(text, 384, 205 + index * 54));
  ctx.font = '600 27px Sarabun, sans-serif';
  ctx.fillText(game.skill, 384, 330);
  ctx.fillStyle = '#facc15';
  ctx.font = '800 27px Sarabun, sans-serif';
  ctx.fillText(`GAME STATION · ${game.skill}`, 384, 420);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

const createNameSprite = (name: string, isTeacher = false) => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = isTeacher ? 'rgba(146,64,14,.94)' : 'rgba(17,24,39,.88)';
  ctx.fillRect(0, 10, 512, 100);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 42px Sarabun, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${isTeacher ? 'ครู ' : ''}${name}`.slice(0, 22), 256, 60);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
  sprite.scale.set(3.2, 0.8, 1);
  sprite.position.y = 2.8;
  return sprite;
};

/**
 * ขอล็อกเมาส์แบบไม่ทำให้เกิด unhandled rejection
 * เบราว์เซอร์ใหม่คืน Promise และจะ reject ถ้าเพิ่งปลดล็อกไปหมาด ๆ
 * (เจอจริงใน error log: "Pointer lock cannot be acquired immediately after the user has exited the lock")
 * กรณีนี้ไม่ใช่ความผิดพลาดที่ต้องแจ้งเด็ก แค่ให้กดใหม่อีกครั้ง
 */
const requestPointerLockSafely = (element: HTMLElement) => {
  try {
    const result = element.requestPointerLock() as unknown as Promise<void> | undefined;
    if (result && typeof result.catch === 'function') result.catch(() => undefined);
  } catch {
    /* เบราว์เซอร์เก่าโยน error แบบ synchronous — ไม่ต้องทำอะไร */
  }
};

export interface ObbyCheckpointData {
  index: number;
  x: number;
  z: number;
  topY: number;
  size: number;
  pillar: CTPillar;
  title: string;
}

export const OBBY_CHECKPOINTS: ObbyCheckpointData[] = [
  { index: 0, x: 17.8, z: 14.5, topY: 2.70, size: 2.6, pillar: 'decompose', title: 'ด่าน 1: แยกย่อยปัญหา' },
  { index: 1, x: 17.0, z: 8.0, topY: 4.05, size: 2.6, pillar: 'pattern', title: 'ด่าน 2: หารูปแบบ' },
  { index: 2, x: 21.5, z: 18.0, topY: 6.25, size: 2.6, pillar: 'abstract', title: 'ด่าน 3: คิดเชิงนามธรรม' },
  { index: 3, x: 14.0, z: 15.5, topY: 7.85, size: 2.6, pillar: 'algorithm', title: 'ด่าน 4: อัลกอริทึม' },
];

const VirtualClassroom: React.FC = () => {
  const { user } = useAuth();
  const qaId = new URLSearchParams(window.location.search).get('qa') || '';
  const qaMode = Boolean(qaId);
  const isTeacher = user?.id === 'admin_teacher_account';
  const playerId = user?.id || GUEST_PLAYER_ID;
  const displayName = isTeacher ? 'อนันตชัย' : (user?.name || 'ผู้เยี่ยมชม');
  const mountRef = useRef<HTMLDivElement>(null);
  const keysRef = useRef(new Set<string>());
  const modeRef = useRef<WorldMode>('build');
  const materialRef = useRef<BlockMaterial>('grass');
  const avatarColorRef = useRef(playerColor(playerId));
  const thirdPersonRef = useRef(false);
  const roomStateRef = useRef<VirtualRoomState | null>(null);
  const canParticipateRef = useRef(true);
  const joinStatusRef = useRef<'active' | 'waiting' | 'blocked'>('active');
  const summonRef = useRef<() => void>(() => undefined);
  const lastPresentationVersionRef = useRef(0);
  const lastGameVersionRef = useRef(0);
  const lastSummonVersionRef = useRef(0);
  const placeRef = useRef<() => void>(() => undefined);
  const removeRef = useRef<() => void>(() => undefined);
  const interactRef = useRef<() => void>(() => undefined);
  const lockRef = useRef<() => void>(() => undefined);
  const jumpRef = useRef<() => void>(() => undefined);
  const [mode, setMode] = useState<WorldMode>('build');
  const [material, setMaterial] = useState<BlockMaterial>('grass');
  const [teacherRoom, setTeacherRoom] = useState(user?.classroom || 'ป.1');
  const [avatarColor, setAvatarColor] = useState(() => (
    localStorage.getItem(`kj_world_avatar_${playerId}`) || playerColor(playerId)
  ));
  const [thirdPerson, setThirdPerson] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => virtualAudioService.isSoundEnabled());
  const [currentObbyStep, setCurrentObbyStep] = useState<number>(-1);
  const teleportRef = useRef<(x: number, y: number, z: number) => void>(() => undefined);
  const [activeCheckpointQuiz, setActiveCheckpointQuiz] = useState<{
    checkpointIndex: number;
    question: CTQuestion;
    title: string;
    pillar: CTPillar;
  } | null>(null);
  const [checkpointAnswer, setCheckpointAnswer] = useState<number | null>(null);
  const [unlockedCheckpoints, setUnlockedCheckpoints] = useState<boolean[]>(() => {
    try {
      const saved = localStorage.getItem(`kj_world_obby_unlocked_${playerId}`);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [false, false, false, false];
  });
  const [highestCheckpoint, setHighestCheckpoint] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`kj_world_obby_unlocked_${playerId}`);
      if (saved) {
        const arr = JSON.parse(saved) as boolean[];
        let h = -1;
        arr.forEach((v, idx) => { if (v) h = Math.max(h, idx); });
        return h;
      }
    } catch {
      // ignore
    }
    return -1;
  });

  const markCheckpointUnlocked = (index: number) => {
    setUnlockedCheckpoints((prev) => {
      const next = [...prev];
      next[index] = true;
      try {
        localStorage.setItem(`kj_world_obby_unlocked_${playerId}`, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    setHighestCheckpoint((prev) => Math.max(prev, index));
  };
  const [graphicsQuality, setGraphicsQuality] = useState<GraphicsQuality>(initialGraphicsQuality);
  const [avatarPanelOpen, setAvatarPanelOpen] = useState(false);
  const [teacherPanelOpen, setTeacherPanelOpen] = useState(false);
  const [onlinePlayers, setOnlinePlayers] = useState<WorldPlayer[]>([]);
  const [syncMode, setSyncMode] = useState<WorldSyncMode>('connecting');
  const [selectedBoard, setSelectedBoard] = useState<LessonBoard | null>(null);
  const [selectedGame, setSelectedGame] = useState<GameStation | null>(null);
  const [gamesPanelOpen, setGamesPanelOpen] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [worldStars, setWorldStars] = useState(0);
  const [worldBlockCount, setWorldBlockCount] = useState(0);
  const [buildStats, setBuildStats] = useState<BuildStats>({ count: 0, maxHeight: 0, materials: 0, ruby: 0 });
  const [buildMissionIdx, setBuildMissionIdx] = useState(() => {
    const v = parseInt(localStorage.getItem('kj_world_build_mission') || '0', 10);
    return Number.isFinite(v) ? Math.min(Math.max(v, 0), BUILD_MISSIONS.length) : 0;
  });
  const [customSlides, setCustomSlides] = useState<Record<number, RichSlide[]>>({});
  const [status, setStatus] = useState('');
  const [pointerLocked, setPointerLocked] = useState(false);
  const navigate = useNavigate();
  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const [confirmRemapOpen, setConfirmRemapOpen] = useState(false);
  const currentWeekKey = useMemo(() => getWorldWeekKey(), []);
  const weekDisplayLabel = useMemo(() => getWeekDisplayLabel(currentWeekKey), [currentWeekKey]);

  const activeClassroom = isTeacher ? teacherRoom : (user?.classroom || 'ป.1');
  const roomClassroom = activeClassroom;
  const gradeId = getDefaultProgressGradeIdForClassroom(activeClassroom);
  const grade = gradeId ? findGrade(gradeId) : undefined;
  const roomId = `class-${activeClassroom.replace(/[^0-9ก-๙]/g, '')}${qaMode ? `-qa-${qaId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32)}` : ''}`;
  const gameStations = useMemo(() => gamesForClassroom(activeClassroom), [activeClassroom]);

  const unlockedCheckpointsRef = useRef(unlockedCheckpoints);
  useEffect(() => {
    unlockedCheckpointsRef.current = unlockedCheckpoints;
  }, [unlockedCheckpoints]);

  const highestCheckpointRef = useRef(highestCheckpoint);
  useEffect(() => {
    highestCheckpointRef.current = highestCheckpoint;
  }, [highestCheckpoint]);

  const activeCheckpointQuizRef = useRef<boolean>(false);
  useEffect(() => {
    activeCheckpointQuizRef.current = activeCheckpointQuiz !== null;
  }, [activeCheckpointQuiz]);

  const teleportToCheckpoint = useCallback((targetIndex: number) => {
    const cp = OBBY_CHECKPOINTS[targetIndex];
    if (!cp) return;
    teleportRef.current(cp.x, cp.topY + 0.7, cp.z);
    virtualAudioService.playStar();
    setStatus(`🚩 วาร์ปมายัง${cp.title}`);
  }, []);

  const openCheckpointQuizRef = useRef<(index: number) => void>(() => undefined);

  const openCheckpointQuiz = useCallback((index: number) => {
    const tier = ageTierFromClassroom(activeClassroom);
    const pillars: CTPillar[] = ['decompose', 'pattern', 'abstract', 'algorithm'];
    const titles = [
      'ด่านที่ 1: การแยกส่วนประกอบ (Decomposition)',
      'ด่านที่ 2: การหารูปแบบ (Pattern Recognition)',
      'ด่านที่ 3: การคิดเชิงนามธรรม (Abstraction)',
      'ด่านที่ 4: การออกแบบอัลกอริทึม (Algorithm Design)',
    ];
    const pillar = pillars[index] || 'decompose';
    const pool = QUESTION_BANK[tier].filter((q) => q.pillar === pillar);
    const q = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : QUESTION_BANK[tier][0];

    activeCheckpointQuizRef.current = true;
    if (document.pointerLockElement) document.exitPointerLock();
    setCheckpointAnswer(null);
    setActiveCheckpointQuiz({
      checkpointIndex: index,
      question: q,
      title: titles[index],
      pillar,
    });
  }, [activeClassroom]);

  useEffect(() => {
    openCheckpointQuizRef.current = openCheckpointQuiz;
  }, [openCheckpointQuiz]);

  const handleAnswerCheckpoint = (chosenIndex: number) => {
    if (!activeCheckpointQuiz || checkpointAnswer !== null) return;
    setCheckpointAnswer(chosenIndex);
    const isCorrect = chosenIndex === activeCheckpointQuiz.question.answer;
    if (isCorrect) {
      virtualAudioService.playStar();
      celebrate();
      setWorldStars((c) => c + 2);
      markCheckpointUnlocked(activeCheckpointQuiz.checkpointIndex);
      const unitNo = boards[0]?.unitNo || 1;
      void recordActivity(
        'question',
        `u${unitNo}-obby-checkpoint-${activeCheckpointQuiz.checkpointIndex}`,
        unitNo,
        `ตอบคำถามด่าน ${activeCheckpointQuiz.checkpointIndex + 1}: ${activeCheckpointQuiz.title}`,
      );
    } else {
      virtualAudioService.playBlockRemove();
    }
  };
  const [roomState, setRoomState] = useState<VirtualRoomState>(() => (
    defaultVirtualRoomState(roomId, roomClassroom)
  ));
  const [roomEvents, setRoomEvents] = useState<WorldActivityEvent[]>([]);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [grantedCodeHash, setGrantedCodeHash] = useState('');
  const [followTeacher, setFollowTeacher] = useState(true);
  const [missionVersion, setMissionVersion] = useState(0);
  const [teacherCodeInput, setTeacherCodeInput] = useState('');

  const boards = useMemo<LessonBoard[]>(() => (
    (grade?.units || []).slice(0, 4).map((unit, index) => {
      const slides = customSlides[unit.no] || getRichSlides(grade!.id, unit.no);
      const topics = unit.topics?.length ? unit.topics : ['สังเกตตัวอย่าง', 'อธิบายด้วยคำของตนเอง', 'ทดลองทำและตรวจสอบผล'];
      const activities = unit.activities?.length ? unit.activities : [
        `สำรวจตัวอย่างเรื่อง ${unit.title}`,
        'จับคู่กับเพื่อนแล้วอธิบายสิ่งที่ค้นพบ',
        'ลงมือทำภารกิจและตรวจสอบผลลัพธ์',
      ];
      const fallbackSlides: RichSlide[] = [
        {
          title: unit.title,
          theme: 'blue',
          body: `เริ่มต้นเรียนรู้หน่วยที่ ${unit.no} จากเรื่องใกล้ตัว แล้วค่อยทดลองทำทีละขั้นตอน`,
          bullets: topics.slice(0, 3).map((text) => ({ text })),
        },
        {
          title: 'หัวใจสำคัญที่ต้องรู้',
          theme: 'green',
          body: 'อ่านทีละข้อ ลองยกตัวอย่างของตนเอง และถามครูทันทีเมื่อยังไม่เข้าใจ',
          bullets: topics.slice(0, 6).map((text) => ({ text })),
        },
        {
          title: 'ภารกิจลงมือทำ',
          theme: 'orange',
          body: 'เรียนรู้ให้ชัดขึ้นด้วยการลงมือทำจริง ร่วมมือกับเพื่อน และบอกเหตุผลของวิธีที่เลือก',
          bullets: activities.slice(0, 5).map((text) => ({ text })),
        },
        {
          title: 'ทบทวนก่อนผ่านด่าน',
          theme: 'purple',
          body: `ฉันอธิบายเรื่อง “${unit.title}” ด้วยคำของตนเองได้หรือยัง?`,
          callout: { type: 'fun', emoji: '⭐', text: 'เปิดบทเรียนเต็ม ทำกิจกรรม และเล่นเกมประจำหน่วยเพื่อสะสมคะแนน' },
          bullets: [
            { text: 'บอกสิ่งที่เรียนรู้ได้อย่างน้อย 2 ข้อ' },
            { text: 'ยกตัวอย่างการนำไปใช้ได้ 1 ตัวอย่าง' },
            { text: 'ตรวจผลงานและปรับปรุงก่อนส่ง' },
          ],
        },
      ];
      return {
        unitNo: unit.no,
        title: unit.title,
        topics,
        href: `/curriculum/${grade!.id}/unit/${unit.no}`,
        slides: slides.length > 0 ? slides : fallbackSlides,
        extras: unitExtras[grade!.id]?.[unit.no],
        visualColor: LESSON_COLORS[index % LESSON_COLORS.length],
        visualEmoji: lessonEmoji(unit.title, topics, index),
      };
    })
  ), [customSlides, grade]);

  useEffect(() => {
    if (!grade) return;
    let active = true;
    void Promise.all((grade.units || []).slice(0, 4).map(async (unit) => ({
      unitNo: unit.no,
      slides: await fetchCustomSlides(grade.id, unit.no),
    }))).then((items) => {
      if (!active) return;
      const next: Record<number, RichSlide[]> = {};
      items.forEach((item) => {
        if (item.slides?.length) next[item.unitNo] = item.slides;
      });
      setCustomSlides(next);
    });
    return () => { active = false; };
  }, [grade]);

  const codeGranted = isTeacher || !roomState.accessCodeHash || grantedCodeHash === roomState.accessCodeHash;
  const blocked = roomState.blockedPlayerIds.includes(playerId);
  const approved = !roomState.requireApproval || roomState.approvedPlayerIds.includes(playerId);
  const canParticipate = isTeacher || (
    roomState.isOpen && codeGranted && approved && !blocked
  );
  const joinStatus: 'active' | 'waiting' | 'blocked' = blocked
    ? 'blocked'
    : canParticipate
      ? 'active'
      : 'waiting';
  const missionBoard = selectedBoard || boards[0];
  const missionUnit = useMemo<UnitProgress | null>(() => (
    user && gradeId && missionBoard
      ? getUnitProgress(user.id, gradeId, missionBoard.unitNo)
      : null
    // missionVersion triggers a fresh read from the progress cache after each awarded action
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [gradeId, missionBoard, missionVersion, user]);
  const missionCounts = useMemo(() => {
    const evidence = missionUnit?.worldEvidence || [];
    return {
      slides: evidence.filter((item) => item.kind === 'slide').length,
      questions: evidence.filter((item) => item.kind === 'question').length,
      games: evidence.filter((item) => item.kind === 'game').length,
      artifacts: evidence.filter((item) => item.kind === 'artifact').length,
    };
  }, [missionUnit]);
  const todayEvents = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return roomEvents.filter((event) => event.createdAt >= start.getTime());
  }, [roomEvents]);
  const roomAnalytics = useMemo(() => ({
    active: onlinePlayers.filter((player) => player.joinStatus !== 'blocked').length,
    waiting: onlinePlayers.filter((player) => player.joinStatus === 'waiting').length,
    slides: todayEvents.filter((event) => event.kind === 'slide').length,
    questions: todayEvents.filter((event) => event.kind === 'question').length,
    games: todayEvents.filter((event) => event.kind === 'game').length,
    artifacts: todayEvents.filter((event) => event.kind === 'artifact').length,
  }), [onlinePlayers, todayEvents]);

  useEffect(() => {
    const unsubscribeRoom = subscribeVirtualRoomState(
      roomId,
      roomClassroom,
      (next) => {
        setRoomState(next);
        setGrantedCodeHash(sessionStorage.getItem(`kj_world_access_${roomId}_${playerId}`) || '');
      },
      setSyncMode,
    );
    const unsubscribeEvents = subscribeWorldActivityEvents(roomId, setRoomEvents);
    return () => {
      unsubscribeRoom();
      unsubscribeEvents();
    };
  }, [playerId, roomClassroom, roomId]);

  useEffect(() => {
    if (!qaMode) return;
    const cleanup = () => { void cleanupVirtualQaRoom(roomId); };
    window.addEventListener('kj-world-qa-cleanup', cleanup);
    return () => window.removeEventListener('kj-world-qa-cleanup', cleanup);
  }, [qaMode, roomId]);

  useEffect(() => {
    roomStateRef.current = roomState;
  }, [roomState]);

  useEffect(() => {
    canParticipateRef.current = canParticipate;
    joinStatusRef.current = joinStatus;
  }, [canParticipate, joinStatus]);

  useEffect(() => {
    localStorage.setItem('kj_world_graphics', graphicsQuality);
  }, [graphicsQuality]);

  useEffect(() => {
    if (!user || user.id === 'admin_teacher_account') return;
    void fetchStudentProgress(user.id).then(() => setMissionVersion((value) => value + 1));
  }, [user]);

  const recordActivity = useCallback(async (
    kind: MissionEvidenceKind,
    eventId: string,
    unitNo: number,
    detail: string,
    options?: { slideIndex?: number; totalSlides?: number },
  ) => {
    if (!user || !gradeId || user.id === 'admin_teacher_account' || qaMode) return;
    const result = await trackWorldMissionEvidence({
      studentId: user.id,
      gradeId,
      unitNo,
      eventId,
      kind,
      detail,
      slideIndex: options?.slideIndex,
      totalSlides: options?.totalSlides,
    });
    setMissionVersion((value) => value + 1);
    if (!result.saved) {
      setStatus('บันทึกผลการเรียนไม่สำเร็จ กรุณาตรวจอินเทอร์เน็ต');
      return;
    }
    if (!result.awarded) return;
    await recordWorldActivityEvent({
      eventId,
      roomId,
      playerId: user.id,
      playerName: user.name,
      classroom: user.classroom,
      kind,
      unitNo,
      detail,
    });
    await syncStudentGradesFromProgress({
      id: user.id,
      name: user.name,
      classroom: user.classroom,
      studentNumber: user.studentNumber,
    });
  }, [gradeId, qaMode, roomId, setMissionVersion, setStatus, user]);

  const broadcastPresentation = useCallback((board: LessonBoard, index: number) => {
    if (!isTeacher) return;
    void updateVirtualRoomState(roomId, roomClassroom, {
      presentationUnitNo: board.unitNo,
      presentationSlideIndex: index,
      presentationVersion: roomStateRef.current?.presentationVersion
        ? roomStateRef.current.presentationVersion + 1
        : Date.now(),
    }, playerId);
  }, [isTeacher, playerId, roomClassroom, roomId]);

  const openLessonBoard = useCallback((board: LessonBoard, index = 0, broadcast = false) => {
    const safeIndex = Math.max(0, Math.min(board.slides.length - 1, index));
    setSlideIndex(safeIndex);
    setQuizAnswer(null);
    setSelectedBoard(board);
    if (broadcast) broadcastPresentation(board, safeIndex);
    void recordActivity(
      'slide',
      `u${board.unitNo}-slide-${safeIndex}`,
      board.unitNo,
      `เปิดสไลด์ ${safeIndex + 1}: ${board.title}`,
      { slideIndex: safeIndex, totalSlides: board.slides.length },
    );
  }, [broadcastPresentation, recordActivity, setQuizAnswer, setSelectedBoard, setSlideIndex]);

  useEffect(() => {
    if (isTeacher || !followTeacher || roomState.presentationVersion <= lastPresentationVersionRef.current) return;
    const board = boards.find((item) => item.unitNo === roomState.presentationUnitNo);
    if (!board) return;
    lastPresentationVersionRef.current = roomState.presentationVersion;
    const timer = window.setTimeout(() => {
      openLessonBoard(board, roomState.presentationSlideIndex, false);
      setStatus('ครูส่งสไลด์ใหม่มาแล้ว');
    }, 0);
    return () => window.clearTimeout(timer);
  }, [boards, followTeacher, isTeacher, openLessonBoard, roomState.presentationSlideIndex, roomState.presentationUnitNo, roomState.presentationVersion]);

  useEffect(() => {
    if (isTeacher || !followTeacher || roomState.gameVersion <= lastGameVersionRef.current) return;
    const game = gameStations.find((item) => item.path === roomState.activeGamePath);
    if (!game) return;
    lastGameVersionRef.current = roomState.gameVersion;
    const timer = window.setTimeout(() => {
      setSelectedGame(game);
      setStatus('ครูเปิดสถานีเกมแล้ว');
    }, 0);
    return () => window.clearTimeout(timer);
  }, [followTeacher, gameStations, isTeacher, roomState.activeGamePath, roomState.gameVersion]);

  useEffect(() => {
    if (isTeacher || roomState.summonVersion <= lastSummonVersionRef.current) return;
    lastSummonVersionRef.current = roomState.summonVersion;
    const timer = window.setTimeout(() => {
      summonRef.current();
      setStatus('ครูเรียกรวมหน้าห้องเรียน');
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isTeacher, roomState.summonVersion]);

  const updateRoom = (patch: Partial<VirtualRoomState>) => {
    if (!isTeacher) return;
    void updateVirtualRoomState(roomId, roomClassroom, patch, playerId);
  };

  const submitRoomCode = async () => {
    if (!isTeacher) return;
    if (teacherCodeInput && !/^\d{4,6}$/.test(teacherCodeInput)) {
      setStatus('รหัสห้องต้องเป็นตัวเลข 4-6 หลัก');
      return;
    }
    const saved = await setVirtualRoomAccessCode(
      roomId,
      roomClassroom,
      teacherCodeInput,
      playerId,
    );
    setStatus(saved
      ? (teacherCodeInput ? 'ตั้งรหัสเข้าห้องแล้ว' : 'ยกเลิกรหัสเข้าห้องแล้ว')
      : 'บันทึกรหัสไว้ในเครื่องนี้เท่านั้น');
    setTeacherCodeInput('');
  };

  const submitJoinCode = async () => {
    const valid = await verifyVirtualRoomAccessCode(roomState, joinCodeInput);
    if (!valid) {
      setStatus('รหัสห้องไม่ถูกต้อง');
      return;
    }
    sessionStorage.setItem(`kj_world_access_${roomId}_${playerId}`, roomState.accessCodeHash);
    setGrantedCodeHash(roomState.accessCodeHash);
    setJoinCodeInput('');
  };

  const approvePlayer = (id: string) => updateRoom({
    approvedPlayerIds: Array.from(new Set([...roomState.approvedPlayerIds, id])),
    blockedPlayerIds: roomState.blockedPlayerIds.filter((item) => item !== id),
  });

  const kickPlayer = (id: string) => updateRoom({
    approvedPlayerIds: roomState.approvedPlayerIds.filter((item) => item !== id),
    blockedPlayerIds: Array.from(new Set([...roomState.blockedPlayerIds, id])),
  });

  const unblockPlayer = (id: string) => updateRoom({
    blockedPlayerIds: roomState.blockedPlayerIds.filter((item) => item !== id),
  });

  const startRoomGame = (game: GameStation) => updateRoom({
    activeGamePath: game.path,
    activeGameTitle: game.title,
    gameVersion: (roomState.gameVersion || 0) + 1,
  });

  const changeSlide = (nextIndex: number) => {
    if (!selectedBoard) return;
    const safeIndex = Math.max(0, Math.min(selectedBoard.slides.length - 1, nextIndex));
    setSlideIndex(safeIndex);
    setQuizAnswer(null);
    if (isTeacher) broadcastPresentation(selectedBoard, safeIndex);
    void recordActivity(
      'slide',
      `u${selectedBoard.unitNo}-slide-${safeIndex}`,
      selectedBoard.unitNo,
      `เปิดสไลด์ ${safeIndex + 1}: ${selectedBoard.title}`,
      { slideIndex: safeIndex, totalSlides: selectedBoard.slides.length },
    );
  };

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    materialRef.current = material;
  }, [material]);

  useEffect(() => {
    avatarColorRef.current = avatarColor;
    localStorage.setItem(`kj_world_avatar_${playerId}`, avatarColor);
  }, [avatarColor, playerId]);

  useEffect(() => {
    thirdPersonRef.current = thirdPerson;
  }, [thirdPerson]);

  useEffect(() => {
    virtualAudioService.setSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9bd9ff);
    scene.fog = new THREE.Fog(0x9bd9ff, 24, graphicsQuality === 'low' ? 48 : 65);
    const camera = new THREE.PerspectiveCamera(70, mount.clientWidth / mount.clientHeight, 0.1, 120);
    const spawn = playerSpawn(playerId);
    const playerPosition = new THREE.Vector3(spawn.x, 1.7, spawn.z);
    camera.position.copy(playerPosition);
    // เริ่มต้นหันเข้าหาบอร์ดหน่วยแรก เพื่อให้เด็กเห็นจุดโต้ตอบทันที
    const targetBoardX = [-6.7, -2.2, 2.2, 6.7]
      .reduce((closest, x) => (Math.abs(x - spawn.x) < Math.abs(closest - spawn.x) ? x : closest));
    let yaw = boards.length > 0 ? Math.atan2(-(targetBoardX - spawn.x), 8.2 + spawn.z) : 0;
    let pitch = 0;
    let frame = 0;
    let lastTime = performance.now();
    let lastRenderedAt = 0;
    let lastPresence = 0;
    let verticalVelocity = 0;
    let grounded = true;
    let worldGameRecorded = false;
    let touchLook: { x: number; y: number } | null = null;
    const respawnTimers: number[] = [];

    const renderer = new THREE.WebGLRenderer({
      antialias: graphicsQuality !== 'low',
      powerPreference: graphicsQuality === 'low' ? 'low-power' : 'high-performance',
    });
    const pixelRatio = graphicsQuality === 'low'
      ? Math.min(window.devicePixelRatio, 0.8)
      : graphicsQuality === 'medium'
        ? Math.min(window.devicePixelRatio, 1.2)
        : Math.min(window.devicePixelRatio, 1.75);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = graphicsQuality !== 'low';
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute('aria-label', 'ห้องเรียนออนไลน์สามมิติ');
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xdff4ff, 0x4d6b3c, 2.1));
    const sun = new THREE.DirectionalLight(0xffffff, 2.2);
    sun.position.set(14, 24, 10);
    sun.castShadow = graphicsQuality !== 'low';
    const shadowSize = graphicsQuality === 'high' ? 2048 : 1024;
    sun.shadow.mapSize.set(shadowSize, shadowSize);
    sun.shadow.camera.left = -48;
    sun.shadow.camera.right = 48;
    sun.shadow.camera.top = 48;
    sun.shadow.camera.bottom = -48;
    scene.add(sun);

    // พื้นผิวแบบพิกเซล (Minecraft) — noise เล็กๆ ต่อพิกเซล + ขอบคมด้วย NearestFilter
    const pixelTextures: THREE.Texture[] = [];
    const makePixelTexture = (hex: number, variance = 24, px = 16) => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = px;
      const ctx = canvas.getContext('2d')!;
      const base = new THREE.Color(hex);
      for (let y = 0; y < px; y++) {
        for (let x = 0; x < px; x++) {
          const d = (Math.random() - 0.5) * (variance / 255);
          const r = Math.max(0, Math.min(1, base.r + d));
          const g = Math.max(0, Math.min(1, base.g + d));
          const b = Math.max(0, Math.min(1, base.b + d));
          ctx.fillStyle = `rgb(${(r * 255) | 0}, ${(g * 255) | 0}, ${(b * 255) | 0})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      pixelTextures.push(texture);
      return texture;
    };
    // พื้นหญ้าแบบตารางบล็อก 1x1 พร้อมเส้นขอบช่อง
    const makeGroundTexture = () => {
      const cells = 8, cell = 16, size = cells * cell;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      for (let cy = 0; cy < cells; cy++) {
        for (let cx = 0; cx < cells; cx++) {
          const shade = 0.85 + Math.random() * 0.15;
          const r = (0x6c * shade) | 0, g = (0xa8 * shade) | 0, b = (0x3c * shade) | 0;
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fillRect(cx * cell, cy * cell, cell, cell);
          for (let i = 0; i < 26; i++) {
            const dd = ((Math.random() - 0.5) * 46) | 0;
            ctx.fillStyle = `rgba(${Math.max(0, r + dd)}, ${Math.max(0, g + dd)}, ${Math.max(0, b + dd)}, 0.55)`;
            ctx.fillRect(cx * cell + ((Math.random() * cell) | 0), cy * cell + ((Math.random() * cell) | 0), 1, 1);
          }
        }
      }
      ctx.strokeStyle = 'rgba(26, 56, 18, 0.4)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= cells; i++) {
        ctx.beginPath(); ctx.moveTo(i * cell + 0.5, 0); ctx.lineTo(i * cell + 0.5, size); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i * cell + 0.5); ctx.lineTo(size, i * cell + 0.5); ctx.stroke();
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(WORLD_SIZE / 8, WORLD_SIZE / 8);
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      pixelTextures.push(texture);
      return texture;
    };

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE),
      new THREE.MeshStandardMaterial({ map: makeGroundTexture(), roughness: 0.97 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.userData = { kind: 'ground', sampleColor: '#6ca83c' };
    scene.add(ground);

    const classroomFloor = new THREE.Mesh(
      new THREE.BoxGeometry(20, 0.25, 17),
      new THREE.MeshStandardMaterial({ color: 0xe8e2d5, roughness: 0.85 }),
    );
    classroomFloor.position.set(0, 0.08, 0);
    classroomFloor.receiveShadow = true;
    scene.add(classroomFloor);

    interface StaticCollider {
      minX: number;
      maxX: number;
      minZ: number;
      maxZ: number;
      minY: number;
      maxY: number;
    }
    const staticColliders: StaticCollider[] = [];

    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xfffbeb, roughness: 0.9 });
    const addWall = (x: number, y: number, z: number, w: number, h: number, d: number) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMaterial);
      wall.position.set(x, y, z);
      wall.castShadow = true;
      wall.receiveShadow = true;
      scene.add(wall);
      staticColliders.push({
        minX: x - w / 2,
        maxX: x + w / 2,
        minZ: z - d / 2,
        maxZ: z + d / 2,
        minY: y - h / 2,
        maxY: y + h / 2,
      });
    };
    addWall(0, 2.75, -8.4, 20, 5.5, 0.35);
    addWall(-10, 2.75, 0, 0.35, 5.5, 17);
    addWall(10, 2.75, 0, 0.35, 5.5, 17);

    const roofBeams = new THREE.Group();
    [-7.5, -2.5, 2.5, 7.5].forEach((x) => {
      const beam = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.28, 17),
        new THREE.MeshStandardMaterial({ color: 0x315b4c }),
      );
      beam.position.set(x, 5.55, 0);
      roofBeams.add(beam);
    });
    scene.add(roofBeams);

    const boardMeshes: THREE.Object3D[] = [];
    const gameMeshes: THREE.Object3D[] = [];
    const lessonProps: THREE.Object3D[] = [];
    const boardPositions = [
      [-6.7, 2.7, -8.2],
      [-2.2, 2.7, -8.2],
      [2.2, 2.7, -8.2],
      [6.7, 2.7, -8.2],
    ];
    boards.forEach((board, index) => {
      const texture = createSlideTexture(board);
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(4.28, 2.78, 0.12),
        new THREE.MeshStandardMaterial({ color: board.visualColor, roughness: 0.62 }),
      );
      frame.position.set(boardPositions[index][0], boardPositions[index][1], -8.27);
      frame.userData = { kind: 'board', board };
      frame.castShadow = true;
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(4.08, 2.58),
        new THREE.MeshStandardMaterial({ map: texture, roughness: 0.72 }),
      );
      mesh.position.set(...boardPositions[index] as [number, number, number]);
      mesh.userData = { kind: 'board', board };
      const rug = new THREE.Mesh(
        new THREE.BoxGeometry(3.85, 0.06, 2.1),
        new THREE.MeshStandardMaterial({ color: board.visualColor, roughness: 0.95 }),
      );
      rug.position.set(boardPositions[index][0], 0.24, -6.35);
      rug.receiveShadow = true;
      const pedestal = new THREE.Mesh(
        new THREE.CylinderGeometry(0.72, 0.86, 0.52, 8),
        new THREE.MeshStandardMaterial({ color: 0x172033, roughness: 0.7 }),
      );
      pedestal.position.set(boardPositions[index][0], 0.52, -6.35);
      pedestal.castShadow = true;
      pedestal.userData = { kind: 'board', board };
      const propGeometry = index % 4 === 0
        ? new THREE.BoxGeometry(0.72, 0.72, 0.72)
        : index % 4 === 1
          ? new THREE.OctahedronGeometry(0.54)
          : index % 4 === 2
            ? new THREE.TorusGeometry(0.45, 0.17, 12, 24)
            : new THREE.ConeGeometry(0.5, 0.9, 6);
      const prop = new THREE.Mesh(
        propGeometry,
        new THREE.MeshStandardMaterial({
          color: board.visualColor,
          emissive: new THREE.Color(board.visualColor).multiplyScalar(0.22),
          metalness: 0.35,
          roughness: 0.3,
        }),
      );
      prop.position.set(boardPositions[index][0], 1.28, -6.35);
      prop.userData = { kind: 'board', board, baseY: 1.28, index };
      prop.castShadow = true;
      scene.add(frame, mesh, rug, pedestal, prop);
      boardMeshes.push(frame, mesh, pedestal, prop);
      lessonProps.push(prop);
      staticColliders.push({
        minX: boardPositions[index][0] - 0.75,
        maxX: boardPositions[index][0] + 0.75,
        minZ: -6.35 - 0.75,
        maxZ: -6.35 + 0.75,
        minY: 0,
        maxY: 0.8,
      });
    });

    gameStations.forEach((game, index) => {
      const station = new THREE.Group();
      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(3.6, 2.4),
        new THREE.MeshStandardMaterial({ map: createGameTexture(game), roughness: 0.6 }),
      );
      screen.rotation.y = -Math.PI / 2;
      screen.position.set(9.79, 2.85, -4.6 + index * 4.6);
      screen.userData = { kind: 'game', game };
      const consoleBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.75, 1.25, 2.3),
        new THREE.MeshStandardMaterial({ color: game.color, roughness: 0.7 }),
      );
      consoleBody.position.set(9.25, 0.75, -4.6 + index * 4.6);
      consoleBody.castShadow = true;
      const button = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.16, 0.1, 20),
        new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0x5b4700 }),
      );
      button.rotation.z = Math.PI / 2;
      button.position.set(8.84, 1.25, -4.6 + index * 4.6);
      station.add(screen, consoleBody, button);
      scene.add(station);
      gameMeshes.push(screen, consoleBody, button);
      [consoleBody, button].forEach((part) => { part.userData = { kind: 'game', game }; });
      staticColliders.push({
        minX: 9.25 - 0.75 / 2,
        maxX: 9.25 + 0.75 / 2,
        minZ: -4.6 + index * 4.6 - 2.3 / 2,
        maxZ: -4.6 + index * 4.6 + 2.3 / 2,
        minY: 0,
        maxY: 1.5,
      });
    });

    // 🎮 พอร์ทัลรวมเกม — เดินมาคลิก (หรือกดปุ่ม 🎮) เพื่อเปิดแผงเกมทั้งหมด (ผนังซ้าย)
    const portalMeshes: THREE.Object3D[] = [];
    const makePortalTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 256;
      const ctx = canvas.getContext('2d')!;
      const grad = ctx.createLinearGradient(0, 0, 256, 256);
      grad.addColorStop(0, '#7c3aed');
      grad.addColorStop(1, '#c026d3');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '110px serif';
      ctx.fillText('🎮', 128, 96);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 40px "Segoe UI", Tahoma, sans-serif';
      ctx.fillText('เกมทั้งหมด', 128, 182);
      ctx.fillStyle = 'rgba(255,255,255,0.88)';
      ctx.font = '22px "Segoe UI", Tahoma, sans-serif';
      ctx.fillText('คลิกเพื่อเลือกเกม', 128, 224);
      const texture = new THREE.CanvasTexture(canvas);
      pixelTextures.push(texture);
      return texture;
    };
    const portalBase = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.35, 0.5, 20),
      new THREE.MeshStandardMaterial({ color: 0x4c1d95, roughness: 0.6 }),
    );
    portalBase.position.set(-9.3, 0.25, 0);
    portalBase.castShadow = true;
    portalBase.userData = { kind: 'portal' };
    const portalArch = new THREE.Mesh(
      new THREE.TorusGeometry(1.5, 0.26, 16, 36),
      new THREE.MeshStandardMaterial({ color: 0x8b5cf6, emissive: 0x7c3aed, emissiveIntensity: 0.6, metalness: 0.4, roughness: 0.3 }),
    );
    portalArch.position.set(-9.3, 2.2, 0);
    portalArch.rotation.y = Math.PI / 2;
    portalArch.userData = { kind: 'portal' };
    const portalScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(2.3, 2.3),
      new THREE.MeshStandardMaterial({ map: makePortalTexture(), emissive: 0xffffff, emissiveIntensity: 0.12, transparent: true, opacity: 0.94, side: THREE.DoubleSide }),
    );
    portalScreen.position.set(-9.15, 2.2, 0);
    portalScreen.rotation.y = Math.PI / 2;
    portalScreen.userData = { kind: 'portal' };
    scene.add(portalBase, portalArch, portalScreen);
    portalMeshes.push(portalBase, portalArch, portalScreen);
    staticColliders.push({
      minX: -9.3 - 1.35,
      maxX: -9.3 + 1.35,
      minZ: -1.35,
      maxZ: 1.35,
      minY: 0,
      maxY: 0.6,
    });

    const tableMaterial = new THREE.MeshStandardMaterial({ color: 0xc58b4c, roughness: 0.75 });
    // แพลตฟอร์มที่ยืน/กระโดดขึ้นไปเหยียบได้ (เช่น ผิวโต๊ะ) — AABB + ความสูงผิวด้านบน
    const platforms: { minX: number; maxX: number; minZ: number; maxZ: number; top: number }[] = [];
    // ผิวพื้นห้องเรียนสูง 0.205m จากระดับลานดิน
    platforms.push({ minX: -10, maxX: 10, minZ: -8.5, maxZ: 8.5, top: 0.205 });
    [-5.2, 0, 5.2].forEach((x) => {
      [0, 4.3].forEach((z) => {
        const table = new THREE.Group();
        const top = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.18, 1.45), tableMaterial);
        top.position.y = 1.05;
        top.castShadow = true;
        table.add(top);
        [-1.5, 1.5].forEach((legX) => [-0.52, 0.52].forEach((legZ) => {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1, 0.16), tableMaterial);
          leg.position.set(legX, 0.5, legZ);
          leg.castShadow = true;
          table.add(leg);
        }));
        table.position.set(x, 0, z);
        scene.add(table);
        // ผิวโต๊ะ: y = 1.05 + 0.18/2 = 1.14, กว้าง 3.6 (x) ลึก 1.45 (z)
        platforms.push({ minX: x - 1.8, maxX: x + 1.8, minZ: z - 0.725, maxZ: z + 0.725, top: 1.14 });
      });
    });

    const makeTree = (x: number, z: number) => {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 2.8, 0.7),
        new THREE.MeshStandardMaterial({ color: 0x8b5a2b }),
      );
      trunk.position.y = 1.4;
      trunk.castShadow = true;
      const crown = new THREE.Mesh(
        new THREE.DodecahedronGeometry(2.1, 0),
        new THREE.MeshStandardMaterial({ color: 0x2f8f46, roughness: 0.95 }),
      );
      crown.position.y = 4.2;
      crown.castShadow = true;
      tree.add(trunk, crown);
      tree.position.set(x, 0, z);
      scene.add(tree);
      staticColliders.push({
        minX: x - 0.45,
        maxX: x + 0.45,
        minZ: z - 0.45,
        maxZ: z + 0.45,
        minY: 0,
        maxY: 2.8,
      });
    };
    [[-15, -9], [15, -9], [-15, 8], [15, 8]].forEach(([x, z]) => makeTree(x, z));

    const starGeometry = new THREE.OctahedronGeometry(0.3, 0);
    const starMaterial = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0x8a5b00,
      emissiveIntensity: 0.65,
      metalness: 0.45,
      roughness: 0.3,
    });
    const collectibles = [
      [-6, 0.9, 11], [-3, 2.2, 9], [2, 0.9, 8], [6, 2.4, 7],
      [13, 0.9, 7], [13, 2.3, 1], [-13, 0.9, 3], [-13, 2.2, -4],
    ].map(([x, y, z], index) => {
      const star = new THREE.Mesh(starGeometry, starMaterial);
      star.position.set(x, y, z);
      star.castShadow = true;
      star.userData = { kind: 'star', index, collected: false };
      scene.add(star);
      return star;
    });

    // =========================================================================
    // ลานกระโดดผจญภัยฝึกคิดเป็นลำดับ (Multi-Zone Algorithm Obby Adventure)
    // 4 โซนท้าทาย + 4 ประตูทดสอบคำถามประจำชั้นเรียน + แท่นสปริง + สะพานบาลานซ์ + ยอดเขาแห่งปัญญา
    // =========================================================================
    const obbyMeshes: THREE.Object3D[] = [];
    const checkpointTotemGems: THREE.Mesh[] = [];

    // โครงสร้างด่านและแท่นกระโดดทั้งหมด 18 แท่น
    interface CoursePlatform {
      name: string;
      zone: 1 | 2 | 3 | 4;
      type: 'stone' | 'checkpoint' | 'beam' | 'pad' | 'launch' | 'floating' | 'summit';
      x: number;
      z: number;
      sizeX: number;
      sizeZ: number;
      topY: number;
      color: number;
      emissive?: number;
      checkpointIndex?: number;
    }

    const checkpointsData = OBBY_CHECKPOINTS;

    const allCoursePlatforms: CoursePlatform[] = [
      // 🌟 โซน 1: ลานบันไดหินวน (Spiral Stepping Stones)
      { name: 'หินก้าวที่ 1', zone: 1, type: 'stone', x: 18.5, z: 22.5, sizeX: 1.6, sizeZ: 1.6, topY: 0.65, color: 0x3b82f6, emissive: 0x1d4ed8 },
      { name: 'หินก้าวที่ 2', zone: 1, type: 'stone', x: 21.0, z: 20.2, sizeX: 1.5, sizeZ: 1.5, topY: 1.20, color: 0x2563eb, emissive: 0x1e40af },
      { name: 'หินก้าวที่ 3', zone: 1, type: 'stone', x: 23.2, z: 17.8, sizeX: 1.5, sizeZ: 1.5, topY: 1.75, color: 0x1d4ed8, emissive: 0x172554 },
      { name: 'หินก้าวที่ 4', zone: 1, type: 'stone', x: 21.0, z: 15.2, sizeX: 1.5, sizeZ: 1.5, topY: 2.30, color: 0x38bdf8, emissive: 0x0284c7 },
      { name: 'เช็คพอยต์ 1', zone: 1, type: 'checkpoint', x: 17.8, z: 14.5, sizeX: 2.6, sizeZ: 2.6, topY: 2.70, color: 0xe11d48, emissive: 0x9f1239, checkpointIndex: 0 },

      // 🌟 โซน 2: สะพานคานแคบทรงตัว & แท่นก้าวทแยง (Balance Beam & Diagonal Leap)
      { name: 'สะพานคานแคบทรงตัว', zone: 2, type: 'beam', x: 14.5, z: 14.5, sizeX: 3.8, sizeZ: 0.8, topY: 2.70, color: 0xa16207, emissive: 0x713f12 },
      { name: 'แท่นทแยงที่ 1', zone: 2, type: 'pad', x: 11.5, z: 12.0, sizeX: 1.4, sizeZ: 1.4, topY: 3.15, color: 0x0891b2, emissive: 0x155e75 },
      { name: 'แท่นทแยงที่ 2', zone: 2, type: 'pad', x: 13.5, z: 9.2, sizeX: 1.4, sizeZ: 1.4, topY: 3.65, color: 0x0284c7, emissive: 0x075985 },
      { name: 'เช็คพอยต์ 2', zone: 2, type: 'checkpoint', x: 17.0, z: 8.0, sizeX: 2.6, sizeZ: 2.6, topY: 4.05, color: 0x0891b2, emissive: 0x164e63, checkpointIndex: 1 },

      // 🌟 โซน 3: แท่นสปริงผลักตัว & เกาะลอยน้ำพริ้วไหว (Super Launch Pad & Floating Islands)
      { name: 'สปริงบอร์ดกระโดดสูง', zone: 3, type: 'launch', x: 20.5, z: 8.0, sizeX: 1.8, sizeZ: 1.8, topY: 4.05, color: 0xfacc15, emissive: 0xd97706 },
      { name: 'เกาะลอยน้ำที่ 1', zone: 3, type: 'floating', x: 23.5, z: 11.2, sizeX: 1.7, sizeZ: 1.7, topY: 5.20, color: 0x10b981, emissive: 0x047857 },
      { name: 'เกาะลอยน้ำที่ 2', zone: 3, type: 'floating', x: 24.0, z: 14.8, sizeX: 1.6, sizeZ: 1.6, topY: 5.75, color: 0x059669, emissive: 0x065f46 },
      { name: 'เช็คพอยต์ 3', zone: 3, type: 'checkpoint', x: 21.5, z: 18.0, sizeX: 2.6, sizeZ: 2.6, topY: 6.25, color: 0xf59e0b, emissive: 0xb45309, checkpointIndex: 2 },

      // 🌟 โซน 4: บันไดลอยฟ้าสู่ยอดเขาแห่งปัญญา (Sky Stairway to Wisdom Summit)
      { name: 'บันไดลอยฟ้า 1', zone: 4, type: 'pad', x: 18.5, z: 20.2, sizeX: 1.5, sizeZ: 1.5, topY: 6.80, color: 0x8b5cf6, emissive: 0x6d28d9 },
      { name: 'บันไดลอยฟ้า 2', zone: 4, type: 'pad', x: 15.5, z: 18.5, sizeX: 1.5, sizeZ: 1.5, topY: 7.35, color: 0x7c3aed, emissive: 0x5b21b6 },
      { name: 'เช็คพอยต์ 4', zone: 4, type: 'checkpoint', x: 14.0, z: 15.5, sizeX: 2.6, sizeZ: 2.6, topY: 7.85, color: 0x7c3aed, emissive: 0x4c1d95, checkpointIndex: 3 },
      { name: 'บันไดสู่ยอดเขา', zone: 4, type: 'pad', x: 14.0, z: 12.6, sizeX: 1.6, sizeZ: 1.6, topY: 8.25, color: 0x6366f1, emissive: 0x4338ca },
      { name: 'ยอดเขาแห่งปัญญา', zone: 4, type: 'summit', x: 14.0, z: 9.2, sizeX: 3.6, sizeZ: 3.6, topY: 8.65, color: 0x4f46e5, emissive: 0x3730a3 },
    ];

    const floatingIslandMeshes: { mesh: THREE.Mesh; baseTopY: number; pfIndex: number }[] = [];

    // ฟังก์ชันสร้างป้ายลอย 3D Canvas
    const makeTextSprite = (text: string, subText: string, bgColor: string, w = 480, h = 150) => {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = bgColor;
      ctx.beginPath();
      ctx.roundRect(8, 8, w - 16, h - 16, 18);
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px "Segoe UI", Tahoma, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(text, w / 2, 60);

      ctx.fillStyle = '#fef08a';
      ctx.font = '600 24px "Segoe UI", Tahoma, sans-serif';
      ctx.fillText(subText, w / 2, 110);

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
      sprite.scale.set(2.4, 0.75, 1);
      return sprite;
    };

    allCoursePlatforms.forEach((p) => {
      const slabThick = p.type === 'summit' ? 0.45 : p.type === 'beam' ? 0.28 : 0.32;
      const pillarH = p.topY - slabThick;

      // 1. เสาค้ำฐาน (ถ้าสูงจากพื้นดิน)
      if (pillarH > 0.05 && p.type !== 'floating') {
        const pillarGeo = p.type === 'beam'
          ? new THREE.BoxGeometry(0.35, pillarH, 0.35)
          : new THREE.CylinderGeometry(0.55, 0.75, pillarH, 16);
        const pillarMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 });
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(p.x, pillarH / 2, p.z);
        pillar.castShadow = true;
        scene.add(pillar);
        obbyMeshes.push(pillar);
      }

      // 2. แผ่นเหยียบกระโดด (Platform Mesh)
      const slabMat = new THREE.MeshStandardMaterial({
        color: p.color,
        emissive: p.emissive || 0x000000,
        emissiveIntensity: p.type === 'launch' ? 0.7 : p.type === 'checkpoint' ? 0.4 : 0.25,
        roughness: p.type === 'beam' ? 0.75 : 0.35,
        metalness: p.type === 'summit' ? 0.6 : 0.2,
      });

      const slabGeo = p.type === 'launch'
        ? new THREE.CylinderGeometry(p.sizeX / 2, p.sizeX / 2 + 0.1, slabThick, 24)
        : new THREE.BoxGeometry(p.sizeX, slabThick, p.sizeZ);
      const slab = new THREE.Mesh(slabGeo, slabMat);
      slab.position.set(p.x, p.topY - slabThick / 2, p.z);
      slab.castShadow = true;
      slab.receiveShadow = true;
      scene.add(slab);
      obbyMeshes.push(slab);

      // ลงทะเบียนเข้าแพลตฟอร์มยืนเหยียบ AABB
      const pfIndex = platforms.length;
      platforms.push({
        minX: p.x - p.sizeX / 2,
        maxX: p.x + p.sizeX / 2,
        minZ: p.z - p.sizeZ / 2,
        maxZ: p.z + p.sizeZ / 2,
        top: p.topY,
      });

      if (p.type === 'floating') {
        floatingIslandMeshes.push({ mesh: slab, baseTopY: p.topY, pfIndex });
      }

      // 3. ป้ายและโทเทมประจำเช็คพอยต์ (Checkpoint Totem)
      if (p.type === 'checkpoint' && p.checkpointIndex !== undefined) {
        const cpIdx = p.checkpointIndex;
        const totemPole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.22, 1.8, 12),
          new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 }),
        );
        totemPole.position.set(p.x, p.topY + 0.9, p.z - (p.sizeZ / 2 - 0.4));
        scene.add(totemPole);
        obbyMeshes.push(totemPole);

        const gemMat = new THREE.MeshStandardMaterial({
          color: p.color,
          emissive: p.emissive || p.color,
          emissiveIntensity: 0.75,
          roughness: 0.15,
        });
        const totemGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 0), gemMat);
        totemGem.position.set(p.x, p.topY + 2.0, p.z - (p.sizeZ / 2 - 0.4));
        scene.add(totemGem);
        obbyMeshes.push(totemGem);
        checkpointTotemGems.push(totemGem);

        const cpData = checkpointsData[cpIdx];
        const badge = makeTextSprite(
          cpData.title,
          'คลิกหรือเหยียบเพื่อตอบคำถาม 💡',
          cpIdx === 0 ? '#9f1239' : cpIdx === 1 ? '#0e7490' : cpIdx === 2 ? '#b45309' : '#6b21a8',
        );
        badge.position.set(p.x, p.topY + 2.8, p.z - (p.sizeZ / 2 - 0.4));
        scene.add(badge);
        obbyMeshes.push(badge);
      }

      // ป้ายสัญลักษณ์บนสปริงบอร์ด (Launch Pad Icon)
      if (p.type === 'launch') {
        const launchRing = new THREE.Mesh(
          new THREE.TorusGeometry(0.65, 0.08, 12, 24),
          new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x22d3ee, emissiveIntensity: 0.9 }),
        );
        launchRing.rotation.x = Math.PI / 2;
        launchRing.position.set(p.x, p.topY + 0.05, p.z);
        scene.add(launchRing);
        obbyMeshes.push(launchRing);

        const launchSprite = makeTextSprite('🚀 สปริงบอร์ดซูเปอร์จัมป์', 'ดีดตัวลอยฟ้าสู่เกาะลอยน้ำ!', '#0369a1', 400, 130);
        launchSprite.position.set(p.x, p.topY + 1.2, p.z);
        scene.add(launchSprite);
        obbyMeshes.push(launchSprite);
      }
    });

    // ---------------------------------------------------------
    // โมเดลถ้วยรางวัลทองคำ 3D (Golden Trophy) บนยอดเขาแห่งปัญญา
    // ---------------------------------------------------------
    const summitP = allCoursePlatforms[allCoursePlatforms.length - 1];
    const trophyGroup = new THREE.Group();
    trophyGroup.position.set(summitP.x, summitP.topY, summitP.z);

    const trophyMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 0.35,
      metalness: 0.88,
      roughness: 0.16,
    });
    const trophyBaseMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 });

    const tBase = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.55, 0.22, 16), trophyBaseMat);
    tBase.position.y = 0.11;
    trophyGroup.add(tBase);

    const tStem = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, 0.45, 16), trophyMat);
    tStem.position.y = 0.44;
    trophyGroup.add(tStem);

    const tCup = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.22, 0.72, 18), trophyMat);
    tCup.position.y = 0.95;
    trophyGroup.add(tCup);

    const handleGeo = new THREE.TorusGeometry(0.24, 0.055, 8, 16);
    const tHandleL = new THREE.Mesh(handleGeo, trophyMat);
    tHandleL.position.set(-0.58, 0.95, 0);
    tHandleL.rotation.y = Math.PI / 2;
    const tHandleR = new THREE.Mesh(handleGeo, trophyMat);
    tHandleR.position.set(0.58, 0.95, 0);
    tHandleR.rotation.y = Math.PI / 2;
    trophyGroup.add(tHandleL, tHandleR);

    const trophyStar = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.32, 0),
      new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.85,
        metalness: 0.6,
        roughness: 0.15,
      }),
    );
    trophyStar.position.y = 1.75;
    trophyGroup.add(trophyStar);

    // ลำแสงบีคอนขึ้นสู่ท้องฟ้า (Beacon of Wisdom) สูง 25 เมตร
    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0xfde047,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.95, 25, 16), beaconMat);
    beacon.position.y = 13.5;
    trophyGroup.add(beacon);

    scene.add(trophyGroup);
    obbyMeshes.push(trophyGroup);

    const summitSign = makeTextSprite('🏆 ยอดเขาแห่งปัญญา', 'Computational Master Summit ✨', '#312e81', 480, 150);
    summitSign.position.set(summitP.x, summitP.topY + 3.0, summitP.z);
    scene.add(summitSign);
    obbyMeshes.push(summitSign);

    // ---------------------------------------------------------
    // ซุ้มประตูเริ่มต้น & แท่นวาร์ปกลับเช็คพอยต์ (Respawn Pad)
    // ---------------------------------------------------------
    const archGroup = new THREE.Group();
    archGroup.position.set(18.5, 0, 26.0);
    const archWoodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });

    const archPoleL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.4, 0.4), archWoodMat);
    archPoleL.position.set(-2.0, 1.7, 0);
    const archPoleR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.4, 0.4), archWoodMat);
    archPoleR.position.set(2.0, 1.7, 0);
    const archBeam = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.45, 0.45), archWoodMat);
    archBeam.position.set(0, 3.2, 0);
    archGroup.add(archPoleL, archPoleR, archBeam);

    const archSign = makeTextSprite('🏃 ลานผจญภัยคิดเป็นลำดับ', 'พิชิต 4 ด่านคำถาม & ยอดเขาแห่งปัญญา 🏆', '#0f172a', 520, 150);
    archSign.scale.set(3.6, 1.05, 1);
    archSign.position.set(0, 4.0, 0);
    archGroup.add(archSign);

    scene.add(archGroup);
    obbyMeshes.push(archGroup);

    // แท่นวาร์ปกลับเช็คพอยต์ล่าสุด (Respawn Return Pad)
    const returnPadMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(1.0, 1.15, 0.18, 20),
      new THREE.MeshStandardMaterial({ color: 0x6366f1, emissive: 0x818cf8, emissiveIntensity: 0.65 }),
    );
    returnPadMesh.position.set(18.5, 0.09, 24.5);
    scene.add(returnPadMesh);
    obbyMeshes.push(returnPadMesh);

    const returnSign = makeTextSprite('🚩 วาร์ปสู่เช็คพอยต์', 'เหยียบเพื่อขึ้นสู่ด่านล่าสุด', '#4338ca', 380, 120);
    returnSign.scale.set(2.2, 0.7, 1);
    returnSign.position.set(18.5, 1.1, 24.5);
    scene.add(returnSign);
    obbyMeshes.push(returnSign);

    staticColliders.push(
      { minX: 18.5 - 2.0 - 0.25, maxX: 18.5 - 2.0 + 0.25, minZ: 26.0 - 0.25, maxZ: 26.0 + 0.25, minY: 0, maxY: 3.4 },
      { minX: 18.5 + 2.0 - 0.25, maxX: 18.5 + 2.0 + 0.25, minZ: 26.0 - 0.25, maxZ: 26.0 + 0.25, minY: 0, maxY: 3.4 },
    );

    let lastObbyStep = -1;
    let lastGoalRewardTime = 0;
    let lastLaunchPadTime = 0;
    let lastTeleportTime = 0;

    const blockGeometry = new THREE.BoxGeometry(1, 1, 1);
    const blockMaterials: Record<BlockMaterial, THREE.MeshStandardMaterial> = {
      grass: new THREE.MeshStandardMaterial({ map: makePixelTexture(0x65a30d), roughness: 0.92 }),
      brick: new THREE.MeshStandardMaterial({ map: makePixelTexture(0xd85d45), roughness: 0.86 }),
      wood: new THREE.MeshStandardMaterial({ map: makePixelTexture(0xa16207), roughness: 0.8 }),
      glass: new THREE.MeshStandardMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.55, roughness: 0.25 }),
      gold: new THREE.MeshStandardMaterial({ map: makePixelTexture(0xfacc15, 12), metalness: 0.55, roughness: 0.35 }),
      stone: new THREE.MeshStandardMaterial({ map: makePixelTexture(0x94a3b8, 26), roughness: 0.95 }),
      sand: new THREE.MeshStandardMaterial({ map: makePixelTexture(0xe0c896, 20), roughness: 0.98 }),
      ice: new THREE.MeshStandardMaterial({ color: 0xa5d8f0, transparent: true, opacity: 0.6, roughness: 0.08, metalness: 0.2 }),
      ruby: new THREE.MeshStandardMaterial({ map: makePixelTexture(0xe11d48, 14), metalness: 0.4, roughness: 0.22 }),
    };
    const blockMeshes = new Map<string, THREE.Mesh>();
    const blockData = new Map<string, WorldBlock>();

    const syncBlocks = (blocks: WorldBlock[]) => {
      setWorldBlockCount(blocks.length);
      // สถิติบล็อกของผู้เล่นคนนี้ — ใช้ตรวจภารกิจสร้าง
      const mine = blocks.filter((b) => b.ownerId === playerId);
      const columns = new Map<string, number>();
      const mats = new Set<string>();
      let ruby = 0;
      mine.forEach((b) => {
        const key = `${b.x},${b.z}`;
        columns.set(key, Math.max(columns.get(key) || 0, b.y + 0.5));
        mats.add(b.material);
        if (b.material === 'ruby') ruby += 1;
      });
      let maxHeight = 0;
      columns.forEach((h) => { if (h > maxHeight) maxHeight = h; });
      setBuildStats({ count: mine.length, maxHeight: Math.round(maxHeight), materials: mats.size, ruby });
      const nextIds = new Set(blocks.map((block) => block.id));
      blockMeshes.forEach((mesh, id) => {
        if (nextIds.has(id)) return;
        scene.remove(mesh);
        blockMeshes.delete(id);
        blockData.delete(id);
      });
      blocks.forEach((block) => {
        blockData.set(block.id, block);
        let mesh = blockMeshes.get(block.id);
        if (!mesh) {
          mesh = new THREE.Mesh(blockGeometry, blockMaterials[block.material]);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.userData = { kind: 'block', blockId: block.id };
          blockMeshes.set(block.id, mesh);
          scene.add(mesh);
        }
        mesh.position.set(block.x, block.y, block.z);
      });
    };
    const unsubscribeBlocks = subscribeWorldBlocks(roomId, syncBlocks);

    const remoteAvatars = new Map<string, THREE.Group>();

    const animateAvatar = (
      group: THREE.Group,
      moving: boolean,
      jumping: boolean,
      now: number,
      speedScale = 1,
    ) => {
      const parts = group.userData.parts as {
        leftArm: THREE.Mesh;
        rightArm: THREE.Mesh;
        leftLeg: THREE.Mesh;
        rightLeg: THREE.Mesh;
      };
      if (!parts) return;
      const swing = moving ? Math.sin(now * 0.011 * speedScale) * 0.62 : 0;
      const jumpLift = jumping ? -0.38 : 0;
      parts.leftArm.rotation.x = swing + jumpLift;
      parts.rightArm.rotation.x = -swing + jumpLift;
      parts.leftLeg.rotation.x = -swing * 0.72;
      parts.rightLeg.rotation.x = swing * 0.72;
    };

    const createAvatar = (player: WorldPlayer) => {
      const group = new THREE.Group();
      const shirtMaterial = new THREE.MeshStandardMaterial({ color: new THREE.Color(player.color) });
      group.userData.profile = `${player.name}_${player.classroom}_${player.color}_${player.role || 'student'}`;
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 1.15, 0.48),
        shirtMaterial,
      );
      body.position.y = 1.15;
      const head = new THREE.Mesh(
        new THREE.BoxGeometry(0.62, 0.62, 0.62),
        new THREE.MeshStandardMaterial({ color: 0xf4c7a1 }),
      );
      head.position.y = 2.05;
      const legGeometry = new THREE.BoxGeometry(0.27, 0.82, 0.4);
      const legMaterial = new THREE.MeshStandardMaterial({ color: 0x263449 });
      const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
      leftLeg.position.set(-0.18, 0.42, 0);
      const rightLeg = leftLeg.clone();
      rightLeg.position.x = 0.18;
      const hair = new THREE.Mesh(
        new THREE.BoxGeometry(0.66, 0.17, 0.66),
        new THREE.MeshStandardMaterial({ color: 0x382519 }),
      );
      hair.position.set(0, 2.35, 0);
      const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x172033 });
      const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.04), eyeMaterial);
      leftEye.position.set(-0.16, 2.1, -0.325);
      const rightEye = leftEye.clone();
      rightEye.position.x = 0.16;
      const smile = new THREE.Mesh(
        new THREE.BoxGeometry(0.23, 0.055, 0.04),
        new THREE.MeshStandardMaterial({ color: 0x9f1239 }),
      );
      smile.position.set(0, 1.92, -0.325);
      const armGeometry = new THREE.BoxGeometry(0.22, 1.02, 0.3);
      const leftArm = new THREE.Mesh(armGeometry, shirtMaterial);
      leftArm.position.set(-0.54, 1.15, 0);
      const rightArm = leftArm.clone();
      rightArm.position.x = 0.54;
      const avatarMeshes = [body, head, leftLeg, rightLeg, hair, leftArm, rightArm];
      avatarMeshes.forEach((part) => {
        part.castShadow = true;
        part.userData = { kind: 'avatar', playerId: player.id };
      });
      const nameSprite = createNameSprite(
        player.name,
        player.role === 'teacher',
      );
      group.add(
        body, head, leftLeg, rightLeg, hair, leftEye, rightEye, smile, leftArm, rightArm,
        nameSprite,
      );
      group.userData.parts = { leftArm, rightArm, leftLeg, rightLeg };
      group.userData.nameSprite = nameSprite;
      group.userData.playerId = player.id;
      group.userData.motion = player.motion || 'idle';
      group.userData.targetPosition = new THREE.Vector3(player.x, player.y || 0, player.z);
      if (player.role === 'teacher') {
        const crownMaterial = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.55 });
        [-0.2, 0, 0.2].forEach((x) => {
          const point = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.28, 4), crownMaterial);
          point.position.set(x, 2.57, 0);
          group.add(point);
        });
      }
      scene.add(group);
      return group;
    };

    const localAvatar = createAvatar({
      id: playerId,
      roomId,
      name: displayName,
      classroom: activeClassroom,
      x: spawn.x,
      y: 0,
      z: spawn.z,
      rotation: yaw,
      color: avatarColorRef.current,
      motion: 'idle',
      role: isTeacher ? 'teacher' : 'student',
      updatedAt: Date.now(),
    });
    localAvatar.visible = thirdPersonRef.current;

    const unsubscribePlayers = subscribeWorldPlayers(roomId, (players) => {
      setOnlinePlayers(players);
      const remote = players.filter((player) => player.id !== playerId);
      const ids = new Set(remote.map((player) => player.id));
      remoteAvatars.forEach((avatar, id) => {
        if (ids.has(id)) return;
        scene.remove(avatar);
        remoteAvatars.delete(id);
      });
      remote.forEach((player) => {
        let avatar = remoteAvatars.get(player.id);
        const profile = `${player.name}_${player.classroom}_${player.color}_${player.role || 'student'}`;
        if (avatar && avatar.userData.profile !== profile) {
          scene.remove(avatar);
          remoteAvatars.delete(player.id);
          avatar = undefined;
        }
        avatar ||= createAvatar(player);
        remoteAvatars.set(player.id, avatar);
        if (!avatar.userData.hasPosition) {
          avatar.position.set(player.x, player.y || 0, player.z);
          avatar.userData.hasPosition = true;
        }
        (avatar.userData.targetPosition as THREE.Vector3).set(player.x, player.y || 0, player.z);
        avatar.userData.motion = player.motion || 'idle';
        avatar.rotation.y = player.rotation;
      });
    }, setSyncMode);

    const raycaster = new THREE.Raycaster();
    const center = new THREE.Vector2(0, 0);
    const selection = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1.04, 1.04, 1.04)),
      new THREE.LineBasicMaterial({ color: 0xffffff }),
    );
    selection.visible = false;
    scene.add(selection);

    const getHit = () => {
      raycaster.setFromCamera(center, camera);
      const avatarTargets = Array.from(remoteAvatars.values()).flatMap((avatar) => (
        avatar.children.filter((child) => child.userData.kind === 'avatar')
      ));
      const targets = [
        ground,
        ...boardMeshes,
        ...gameMeshes,
        ...portalMeshes,
        ...blockMeshes.values(),
        ...avatarTargets,
      ];
      return raycaster.intersectObjects(targets, false)[0];
    };

    placeRef.current = () => {
      if (!canParticipateRef.current) return;
      if (!isTeacher && roomStateRef.current?.buildLocked) {
        setStatus('ครูปิดโหมดสร้างชั่วคราว');
        return;
      }
      if (modeRef.current !== 'build') {
        setStatus('เลือกโหมดสร้างก่อน');
        return;
      }
      const hit = getHit();
      if (!hit || hit.distance > BUILD_REACH || !['ground', 'block'].includes(hit.object.userData.kind)) {
        setStatus(`เข้าใกล้พื้นที่ก่อสร้างอีกนิด วางได้ไกลสูงสุด ${BUILD_REACH} ช่อง`);
        return;
      }
      const point = hit.point.clone();
      if (hit.object.userData.kind === 'block' && hit.face) {
        point.add(hit.face.normal.clone().multiplyScalar(0.55));
      }
      const x = Math.floor(point.x) + 0.5;
      const z = Math.floor(point.z) + 0.5;
      const y = hit.object.userData.kind === 'ground'
        ? 0.5
        : Math.max(0.5, Math.floor(point.y) + 0.5);
      if (Math.abs(x) > BUILD_BOUNDARY || Math.abs(z) > BUILD_BOUNDARY) {
        setStatus('ถึงขอบพื้นที่ก่อสร้างแล้ว');
        return;
      }
      if (y > BUILD_MAX_HEIGHT - 0.5) {
        setStatus(`สร้างได้สูงสุด ${BUILD_MAX_HEIGHT} ชั้น`);
        return;
      }
      const playerFeet = playerPosition.y - 1.7;
      const playerHead = playerPosition.y + 0.1;
      const blockMinY = y - 0.5;
      const blockMaxY = y + 0.5;
      const inPlayerCellX = Math.abs(x - playerPosition.x) < 0.88;
      const inPlayerCellZ = Math.abs(z - playerPosition.z) < 0.88;
      const inPlayerHeight = blockMaxY > playerFeet + 0.05 && blockMinY < playerHead;
      if (inPlayerCellX && inPlayerCellZ && inPlayerHeight) {
        setStatus('ไม่สามารถวางบล็อกทับตัวเราได้ ถอยหลังออกมานิดนึงนะ');
        return;
      }
      const block: WorldBlock = {
        id: `${playerId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        x, y, z,
        material: materialRef.current,
        ownerId: playerId,
        createdAt: Date.now(),
      };
      void addWorldBlock(roomId, block).then((added) => {
        if (!added) {
          setStatus('ช่องนี้มีบล็อกอยู่แล้ว ลองเล็งช่องข้าง ๆ');
          return;
        }
        virtualAudioService.playBlockPlace();
        setStatus(`วางบล็อก${MATERIALS.find((item) => item.id === block.material)?.label || ''}แล้ว`);
        const unitNo = boards[0]?.unitNo || 1;
        void recordActivity(
          'artifact',
          `u${unitNo}-artifact-${block.material}`,
          unitNo,
          `สร้างผลงานด้วยบล็อก${MATERIALS.find((item) => item.id === block.material)?.label || block.material}`,
        );
      }).catch((error) => setStatus(error instanceof Error ? error.message : 'วางบล็อกไม่สำเร็จ'));
    };

    removeRef.current = () => {
      if (!canParticipateRef.current) return;
      if (!isTeacher && roomStateRef.current?.buildLocked) return;
      if (modeRef.current !== 'build') return;
      const hit = getHit();
      if (!hit || hit.distance > BUILD_REACH || hit.object.userData.kind !== 'block') return;
      const block = blockData.get(hit.object.userData.blockId as string);
      if (!block) return;
      void removeWorldBlock(roomId, block);
      virtualAudioService.playBlockRemove();
      setStatus('ลบบล็อกแล้ว');
    };

    interactRef.current = () => {
      if (!canParticipateRef.current) return;
      const hit = getHit();
      if (hit && hit.object.userData.kind === 'portal' && hit.distance <= 24) {
        if (document.pointerLockElement) document.exitPointerLock();
        setGamesPanelOpen(true);
        return;
      }
      if (!hit || hit.distance > 24 || !['board', 'game'].includes(hit.object.userData.kind)) {
        setStatus('หันไปที่สไลด์ สถานีเกม หรือพอร์ทัลเกมก่อน');
        return;
      }
      if (document.pointerLockElement) document.exitPointerLock();
      if (hit.object.userData.kind === 'game') {
        const game = hit.object.userData.game as GameStation;
        setSelectedGame(game);
        return;
      }
      const board = hit.object.userData.board as LessonBoard;
      openLessonBoard(board, 0, isTeacher);
    };

    lockRef.current = () => requestPointerLockSafely(renderer.domElement);
    jumpRef.current = () => {
      if (!canParticipateRef.current) return;
      if (!isTeacher && roomStateRef.current?.movementLocked) {
        setStatus('ครูพักการเดินชั่วคราว');
        return;
      }
      if (!grounded) return;
      grounded = false;
      verticalVelocity = 8.2;
      virtualAudioService.playJump();
      setStatus('กระโดด!');
    };
    summonRef.current = () => {
      const state = roomStateRef.current;
      playerPosition.set(state?.summonX || 0, 1.7, state?.summonZ || 10);
      verticalVelocity = 0;
      yaw = Math.PI;
    };
    teleportRef.current = (targetX: number, targetY: number, targetZ: number) => {
      playerPosition.set(targetX, targetY, targetZ);
      verticalVelocity = 0;
      grounded = true;
      virtualAudioService.playStar();
    };

    const onPointerLock = () => setPointerLocked(document.pointerLockElement === renderer.domElement);
    const onMouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement !== renderer.domElement) return;
      yaw -= event.movementX * 0.0022;
      pitch -= event.movementY * 0.0022;
      pitch = Math.max(-1.25, Math.min(1.25, pitch));
    };
    const onKeyDown = (event: KeyboardEvent) => {
      keysRef.current.add(event.code);
      if (event.code === 'KeyE') interactRef.current();
      if (event.code === 'KeyQ') placeRef.current();
      if (event.code === 'KeyR') removeRef.current();
      if (event.code.startsWith('Digit')) {
        const slot = Number(event.code.slice(5));
        if (slot >= 1 && slot <= MATERIALS.length) {
          setMaterial(MATERIALS[slot - 1].id);
          if (modeRef.current !== 'build') setMode('build');
        }
      }
      if (event.code === 'Space') {
        event.preventDefault();
        jumpRef.current();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => keysRef.current.delete(event.code);
    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };
    // Minecraft-style: click จอครั้งแรกเพื่อจับเมาส์ → คลิกซ้าย ทุบ/เปิดกระดาน, คลิกขวา วางบล็อก
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'touch') {
        touchLook = { x: event.clientX, y: event.clientY };
        return;
      }
      if (document.pointerLockElement !== renderer.domElement) {
        requestPointerLockSafely(renderer.domElement);
        return;
      }
      if (event.button === 0) {
        const hit = getHit();
        const kind = hit?.object.userData.kind;
        if (kind === 'portal') { if (document.pointerLockElement) document.exitPointerLock(); setGamesPanelOpen(true); }
        else if (kind === 'board' || kind === 'game') interactRef.current();
        else removeRef.current();
      } else if (event.button === 2) {
        placeRef.current();
      }
    };
    const onTouchMove = (event: PointerEvent) => {
      if (event.pointerType !== 'touch' || !touchLook) return;
      yaw -= (event.clientX - touchLook.x) * 0.006;
      pitch -= (event.clientY - touchLook.y) * 0.006;
      pitch = Math.max(-1.2, Math.min(1.2, pitch));
      touchLook = { x: event.clientX, y: event.clientY };
    };
    const onTouchEnd = () => { touchLook = null; };
    const onResize = () => {
      if (!mount.clientWidth || !mount.clientHeight) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };

    document.addEventListener('pointerlockchange', onPointerLock);
    document.addEventListener('mousemove', onMouseMove);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onResize);
    renderer.domElement.addEventListener('contextmenu', onContextMenu);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onTouchMove);
    renderer.domElement.addEventListener('pointerup', onTouchEnd);

    const animate = (now: number) => {
      if (graphicsQuality === 'low' && now - lastRenderedAt < 32) {
        frame = requestAnimationFrame(animate);
        return;
      }
      lastRenderedAt = now;
      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const keys = keysRef.current;
      const movementAllowed = canParticipateRef.current
        && (isTeacher || !roomStateRef.current?.movementLocked);
      const forwardAmount = movementAllowed
        ? (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0)
          - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0)
        : 0;
      const sideAmount = movementAllowed
        ? (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0)
          - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0)
        : 0;
      const speed = keys.has('ShiftLeft') ? 8.5 : 5.2;
      const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
      const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
      const PLAYER_RADIUS = 0.34;
      const currentFeetY = playerPosition.y - 1.7;

      // ตรวจสอบการชนในแนวราบ AABB กับบล็อก โต๊ะ และสิ่งกีดขวาง
      const collidesAt = (testX: number, testZ: number, feetYLevel: number): boolean => {
        // 1. ตรวจสอบก้อนบล็อกที่วาง (กรองเฉพาะบล็อกใกล้ตัวในระยะ 1.6 เมตรเพื่อความเร็ว 60fps)
        for (const block of blockData.values()) {
          if (Math.abs(block.x - testX) > 1.6 || Math.abs(block.z - testZ) > 1.6) continue;
          const blockBottom = block.y - 0.5;
          const blockTop = block.y + 0.5;
          // ถ้าบล็อกอยู่ต่ำกว่าระดับก้าวขึ้นได้ หรืออยู่เหนือศีรษะ -> ไม่ขวางแนวระนาบ
          if (blockTop <= feetYLevel + 0.35 || blockBottom >= feetYLevel + 1.7) continue;
          if (
            testX + PLAYER_RADIUS > block.x - 0.5
            && testX - PLAYER_RADIUS < block.x + 0.5
            && testZ + PLAYER_RADIUS > block.z - 0.5
            && testZ - PLAYER_RADIUS < block.z + 0.5
          ) {
            return true;
          }
        }
        // 2. ตรวจสอบโต๊ะเรียน (platforms)
        for (const pf of platforms) {
          if (pf.top <= feetYLevel + 0.35) continue;
          if (
            testX + PLAYER_RADIUS > pf.minX
            && testX - PLAYER_RADIUS < pf.maxX
            && testZ + PLAYER_RADIUS > pf.minZ
            && testZ - PLAYER_RADIUS < pf.maxZ
          ) {
            return true;
          }
        }
        // 3. ตรวจสอบวัตถุกายภาพคงที่ (ผนังห้องเรียน ฐานกระดาน เสาต้นไม้ ตู้เกม พอร์ทัล)
        for (const col of staticColliders) {
          if (col.maxY <= feetYLevel + 0.35 || col.minY >= feetYLevel + 1.7) continue;
          if (
            testX + PLAYER_RADIUS > col.minX
            && testX - PLAYER_RADIUS < col.maxX
            && testZ + PLAYER_RADIUS > col.minZ
            && testZ - PLAYER_RADIUS < col.maxZ
          ) {
            return true;
          }
        }
        return false;
      };

      // คำนวณระยะการขยับตามทิศทาง
      const dispX = forward.x * forwardAmount * speed * delta + right.x * sideAmount * speed * delta;
      const dispZ = forward.z * forwardAmount * speed * delta + right.z * sideAmount * speed * delta;

      // เลื่อนไถลตามแนวกำแพงแบบแยกแกน (Axis-Separated Sliding)
      if (dispX !== 0) {
        const nextX = THREE.MathUtils.clamp(playerPosition.x + dispX, -PLAYER_BOUNDARY, PLAYER_BOUNDARY);
        if (!collidesAt(nextX, playerPosition.z, currentFeetY)) {
          playerPosition.x = nextX;
        }
      }
      if (dispZ !== 0) {
        const nextZ = THREE.MathUtils.clamp(playerPosition.z + dispZ, -PLAYER_BOUNDARY, PLAYER_BOUNDARY);
        if (!collidesAt(playerPosition.x, nextZ, currentFeetY)) {
          playerPosition.z = nextZ;
        }
      }

      // ระบบดันตัวออกจากวัตถุ (Anti-Stuck Depenetration) ป้องกันตัวละครจมหรือทะลุติดในกำแพงหรือบล็อก
      const feetForDepen = playerPosition.y - 1.7;
      for (const col of staticColliders) {
        if (col.maxY <= feetForDepen + 0.1 || col.minY >= feetForDepen + 1.7) continue;
        const overlapMinX = (playerPosition.x + PLAYER_RADIUS) - col.minX;
        const overlapMaxX = col.maxX - (playerPosition.x - PLAYER_RADIUS);
        const overlapMinZ = (playerPosition.z + PLAYER_RADIUS) - col.minZ;
        const overlapMaxZ = col.maxZ - (playerPosition.z - PLAYER_RADIUS);
        if (overlapMinX > 0 && overlapMaxX > 0 && overlapMinZ > 0 && overlapMaxZ > 0) {
          const penX = overlapMinX < overlapMaxX ? -overlapMinX : overlapMaxX;
          const penZ = overlapMinZ < overlapMaxZ ? -overlapMinZ : overlapMaxZ;
          if (Math.abs(penX) < Math.abs(penZ)) {
            playerPosition.x += penX * 1.05;
          } else {
            playerPosition.z += penZ * 1.05;
          }
        }
      }
      for (const block of blockData.values()) {
        if (Math.abs(block.x - playerPosition.x) > 1.2 || Math.abs(block.z - playerPosition.z) > 1.2) continue;
        const bMinY = block.y - 0.5;
        const bMaxY = block.y + 0.5;
        if (bMaxY <= feetForDepen + 0.1 || bMinY >= feetForDepen + 1.7) continue;
        const bMinX = block.x - 0.5;
        const bMaxX = block.x + 0.5;
        const bMinZ = block.z - 0.5;
        const bMaxZ = block.z + 0.5;
        const overlapMinX = (playerPosition.x + PLAYER_RADIUS) - bMinX;
        const overlapMaxX = bMaxX - (playerPosition.x - PLAYER_RADIUS);
        const overlapMinZ = (playerPosition.z + PLAYER_RADIUS) - bMinZ;
        const overlapMaxZ = bMaxZ - (playerPosition.z - PLAYER_RADIUS);
        if (overlapMinX > 0 && overlapMaxX > 0 && overlapMinZ > 0 && overlapMaxZ > 0) {
          const penX = overlapMinX < overlapMaxX ? -overlapMinX : overlapMaxX;
          const penZ = overlapMinZ < overlapMaxZ ? -overlapMinZ : overlapMaxZ;
          if (Math.abs(penX) < Math.abs(penZ)) {
            playerPosition.x += penX * 1.05;
          } else {
            playerPosition.z += penZ * 1.05;
          }
        }
      }

      verticalVelocity -= 20 * delta;
      playerPosition.y += verticalVelocity * delta;

      // ตรวจสอบการชนศีรษะด้านบน (Ceiling Overhead Collision ป้องกันกระโดดทะลุเพดาน/บล็อก)
      if (verticalVelocity > 0) {
        const headY = playerPosition.y + 0.1;
        for (const block of blockData.values()) {
          if (Math.abs(block.x - playerPosition.x) >= 0.72 || Math.abs(block.z - playerPosition.z) >= 0.72) continue;
          const bBottom = block.y - 0.5;
          if (headY >= bBottom && playerPosition.y - 1.7 < bBottom) {
            playerPosition.y = bBottom - 0.1;
            verticalVelocity = 0;
            break;
          }
        }
        if (playerPosition.x >= -10 && playerPosition.x <= 10 && playerPosition.z >= -8.5 && playerPosition.z <= 8.5) {
          if (headY >= 5.4) {
            playerPosition.y = 5.4 - 0.1;
            verticalVelocity = 0;
          }
        }
      }

      // ยืนบนพื้น (0) หรือบนบล็อกที่วางไว้ในช่องนี้ — Minecraft: กระโดดขึ้นไปเหยียบบล็อกได้
      const feetY = playerPosition.y - 1.7;
      let floorTop = 0;
      blockData.forEach((b) => {
        if (Math.abs(b.x - playerPosition.x) >= 0.72 || Math.abs(b.z - playerPosition.z) >= 0.72) return;
        const top = b.y + 0.5;
        if (top > floorTop && top <= feetY + 0.35) floorTop = top;
      });
      // ยืน/กระโดดขึ้นเหยียบผิวโต๊ะ (และแพลตฟอร์มอื่น) ได้
      platforms.forEach((pf) => {
        if (playerPosition.x < pf.minX || playerPosition.x > pf.maxX || playerPosition.z < pf.minZ || playerPosition.z > pf.maxZ) return;
        if (pf.top > floorTop && pf.top <= feetY + 0.35) floorTop = pf.top;
      });
      const floorCamera = floorTop + 1.7;
      if (playerPosition.y <= floorCamera) {
        playerPosition.y = floorCamera;
        verticalVelocity = 0;
        grounded = true;
      }

      // ป้องกันการตกแมพลงเหว/Void Fall Guard
      if (playerPosition.y < -2.0) {
        const state = roomStateRef.current;
        playerPosition.set(state?.summonX || 0, 1.7, state?.summonZ || 10);
        verticalVelocity = 0;
        grounded = true;
        setStatus('รีเซ็ตตำแหน่งกลับสู่ลานกิจกรรม');
      }
      playerPosition.x = THREE.MathUtils.clamp(playerPosition.x, -PLAYER_BOUNDARY, PLAYER_BOUNDARY);
      playerPosition.z = THREE.MathUtils.clamp(playerPosition.z, -PLAYER_BOUNDARY, PLAYER_BOUNDARY);
      const isMoving = Math.abs(forwardAmount) + Math.abs(sideAmount) > 0;
      if (grounded && isMoving) {
        virtualAudioService.playStep();
      }
      localAvatar.visible = thirdPersonRef.current;
      localAvatar.position.set(playerPosition.x, playerPosition.y - 1.7, playerPosition.z);
      localAvatar.rotation.y = yaw;
      animateAvatar(localAvatar, isMoving, !grounded, now, keys.has('ShiftLeft') ? 1.35 : 1);
      remoteAvatars.forEach((avatar) => {
        const target = avatar.userData.targetPosition as THREE.Vector3;
        const distance = target ? avatar.position.distanceTo(target) : 0;
        if (target) avatar.position.lerp(target, Math.min(1, delta * 9));
        const remoteMoving = avatar.userData.motion === 'walk' || distance > 0.035;
        animateAvatar(avatar, remoteMoving, avatar.userData.motion === 'jump', now, 0.9);
      });
      if (thirdPersonRef.current) {
        camera.position.copy(playerPosition).addScaledVector(forward, -4.8);
        camera.position.y += 2.2;
        const lookTarget = playerPosition.clone().addScaledVector(forward, 3.5);
        lookTarget.y += pitch * 1.8;
        camera.lookAt(lookTarget);
      } else {
        camera.position.copy(playerPosition);
        camera.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
      }

      lessonProps.forEach((prop, index) => {
        prop.rotation.y += delta * (0.65 + index * 0.08);
        prop.position.y = prop.userData.baseY + Math.sin(now * 0.0018 + index) * 0.08;
      });

      // หมุนอัญมณีโทเทมและดาวถ้วยรางวัลลานกระโดดผจญภัย
      checkpointTotemGems.forEach((gem) => {
        gem.rotation.y += delta * 2.2;
        gem.rotation.x += delta * 1.1;
      });
      trophyStar.rotation.y += delta * 2.5;
      trophyStar.rotation.x += delta * 0.8;
      beacon.rotation.y += delta * 0.5;

      // ปรับความสูงของเกาะลอยน้ำที่ขยับขึ้น-ลง (Oscillating Floating Islands)
      floatingIslandMeshes.forEach((item, idx) => {
        const floatOffset = Math.sin(now * 0.0018 + idx * 1.5) * 0.16;
        item.mesh.position.y = item.baseTopY - 0.16 + floatOffset;
        if (platforms[item.pfIndex]) {
          platforms[item.pfIndex].top = item.baseTopY + floatOffset;
        }
      });

      // ตรวจสอบการเหยียบสปริงบอร์ดกระโดดสูง (Super Launch Pad)
      const curX = playerPosition.x;
      const curZ = playerPosition.z;
      const curFeetY = playerPosition.y - 1.7;

      if (
        Math.abs(curX - 20.5) < 0.95
        && Math.abs(curZ - 8.0) < 0.95
        && Math.abs(curFeetY - 4.05) < 0.35
        && now - lastLaunchPadTime > 800
      ) {
        lastLaunchPadTime = now;
        verticalVelocity = 12.0;
        grounded = false;
        virtualAudioService.playJump();
        setStatus('🚀 สปริงบอร์ดส่งตัวลอยฟ้าข้ามสู่เกาะลอยน้ำ!');
      }

      // ตรวจสอบการเหยียบแท่นวาร์ปกลับเช็คพอยต์ (Respawn Return Pad)
      if (
        Math.abs(curX - 18.5) < 1.1
        && Math.abs(curZ - 24.5) < 1.1
        && Math.abs(curFeetY - 0.15) < 0.35
        && now - lastTeleportTime > 1500
      ) {
        lastTeleportTime = now;
        const highest = highestCheckpointRef.current;
        if (highest >= 0 && checkpointsData[highest]) {
          const cp = checkpointsData[highest];
          playerPosition.set(cp.x, cp.topY + 1.7, cp.z);
          verticalVelocity = 0;
          grounded = true;
          virtualAudioService.playStar();
          setStatus(`🚩 วาร์ปกลับสู่เช็คพอยต์ด่านที่ ${highest + 1}: ${cp.title}`);
        } else {
          setStatus('🚩 เดินหน้ากระโดดพิชิตเช็คพอยต์ด่านแรกเพื่อบันทึกจุดวาร์ป!');
        }
      }

      // ตรวจสอบตำแหน่งผู้เล่นบนลานกระโดดผจญภัย
      let detectedObbyStep = -1;
      for (let cIdx = 0; cIdx < checkpointsData.length; cIdx++) {
        const cp = checkpointsData[cIdx];
        if (
          Math.abs(curX - cp.x) <= cp.size / 2
          && Math.abs(curZ - cp.z) <= cp.size / 2
          && Math.abs(curFeetY - cp.topY) < 0.28
        ) {
          detectedObbyStep = cIdx;
          if (!unlockedCheckpointsRef.current[cIdx] && !activeCheckpointQuizRef.current) {
            openCheckpointQuizRef.current(cIdx);
          }
          break;
        }
      }

      const summit = allCoursePlatforms[allCoursePlatforms.length - 1];
      if (
        Math.abs(curX - summit.x) <= summit.sizeX / 2
        && Math.abs(curZ - summit.z) <= summit.sizeZ / 2
        && Math.abs(curFeetY - summit.topY) < 0.3
      ) {
        detectedObbyStep = 4;
      }

      if (detectedObbyStep !== lastObbyStep) {
        lastObbyStep = detectedObbyStep;
        setCurrentObbyStep(detectedObbyStep);

        if (detectedObbyStep >= 0 && detectedObbyStep <= 3) {
          virtualAudioService.playObbyStep(detectedObbyStep);
          const cp = checkpointsData[detectedObbyStep];
          const isDone = unlockedCheckpointsRef.current[detectedObbyStep];
          setStatus(`🎯 ${cp.title} ${isDone ? '(ผ่านด่านแล้ว ✓)' : '(ตอบคำถามเพื่อปลดล็อก)'}`);
        } else if (detectedObbyStep === 4) {
          if (now - lastGoalRewardTime > 15_000) {
            lastGoalRewardTime = now;
            virtualAudioService.playVictory();
            celebrate();
            setWorldStars((c) => c + 10);
            setStatus('🏆 ยินดีด้วยอย่างยิ่ง! พิชิตยอดเขาแห่งปัญญาสำเร็จ (+10 ⭐)');
            const unitNo = boards[0]?.unitNo || 1;
            void recordActivity(
              'game',
              `u${unitNo}-game-algorithm-mastery`,
              unitNo,
              'พิชิตยอดเขาแห่งปัญญา (ลานผจญภัยคิดเป็นลำดับและตอบคำถาม 4 ด่าน)',
            );
          }
        }
      }

      collectibles.forEach((star, index) => {
        star.rotation.y += delta * 1.8;
        star.rotation.x += delta * 0.7;
        if (!star.visible) return;
        const horizontal = Math.hypot(playerPosition.x - star.position.x, playerPosition.z - star.position.z);
        const vertical = Math.abs((playerPosition.y - 0.8) - star.position.y);
        if (horizontal > 1.1 || vertical > 1) return;
        star.visible = false;
        star.userData.collected = true;
        virtualAudioService.playStar();
        setWorldStars((current) => current + 1);
        setStatus('เก็บดาวสำเร็จ +1');
        if (!worldGameRecorded) {
          worldGameRecorded = true;
          const unitNo = boards[0]?.unitNo || 1;
          void recordActivity('game', `u${unitNo}-game-star-hunt`, unitNo, 'เกมเก็บดาวในห้อง 3D');
        }
        const timer = window.setTimeout(() => {
          star.visible = true;
          star.userData.collected = false;
          star.position.y += Math.sin(index) * 0.01;
        }, 8_000);
        respawnTimers.push(timer);
      });

      const hit = getHit();
      if (hit?.object.userData.kind === 'block' && hit.distance <= BUILD_REACH) {
        selection.position.copy(hit.object.position);
        selection.visible = true;
      } else selection.visible = false;

      if (now - lastPresence > 1_200) {
        lastPresence = now;
        void updateWorldPlayer({
          id: playerId,
          roomId,
          name: displayName,
          classroom: activeClassroom,
          x: playerPosition.x,
          y: playerPosition.y - 1.7,
          z: playerPosition.z,
          rotation: yaw,
          color: avatarColorRef.current,
          motion: !grounded ? 'jump' : isMoving ? 'walk' : 'idle',
          role: isTeacher ? 'teacher' : 'student',
          joinStatus: joinStatusRef.current,
          updatedAt: Date.now(),
        });
      }

      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
      respawnTimers.forEach((timer) => window.clearTimeout(timer));
      unsubscribeBlocks();
      unsubscribePlayers();
      void removeWorldPlayer(roomId, playerId);
      summonRef.current = () => undefined;
      teleportRef.current = () => undefined;
      document.removeEventListener('pointerlockchange', onPointerLock);
      document.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('contextmenu', onContextMenu);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onTouchMove);
      renderer.domElement.removeEventListener('pointerup', onTouchEnd);
      if (document.pointerLockElement === renderer.domElement) document.exitPointerLock();
      renderer.dispose();
      blockGeometry.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      Object.values(blockMaterials).forEach((item) => item.dispose());
      pixelTextures.forEach((texture) => texture.dispose());
      obbyMeshes.forEach((mesh) => scene.remove(mesh));
      mount.removeChild(renderer.domElement);
    };
  }, [activeClassroom, avatarColor, boards, displayName, gameStations, graphicsQuality, isTeacher, openLessonBoard, playerId, recordActivity, roomClassroom, roomId]);

  useEffect(() => {
    if (!status) return;
    const timer = window.setTimeout(() => setStatus(''), 2400);
    return () => window.clearTimeout(timer);
  }, [status]);

  const holdDirection = (code: string, active: boolean) => {
    if (active) keysRef.current.add(code);
    else keysRef.current.delete(code);
  };

  const currentBuildMission = BUILD_MISSIONS[buildMissionIdx];
  const checkBuildMission = () => {
    const m = currentBuildMission;
    if (!m) return;
    if (!m.check(buildStats)) {
      setStatus(`ภารกิจยังไม่ครบ — ${m.progress(buildStats)}`);
      return;
    }
    celebrate();
    setWorldStars((s) => s + m.stars);
    setStatus(`สำเร็จภารกิจ "${m.title}" +${m.stars}⭐`);
    const unitNo = boards[0]?.unitNo || 1;
    void recordActivity('artifact', `u${unitNo}-build-${m.id}`, unitNo, `ภารกิจสร้าง: ${m.title} — ${m.concept}`);
    const nextIdx = buildMissionIdx + 1;
    setBuildMissionIdx(nextIdx);
    localStorage.setItem('kj_world_build_mission', String(nextIdx));
  };

  const selectedSlide = selectedBoard?.slides[slideIndex];

  return (
    <div className="virtual-classroom">
      <div ref={mountRef} className="virtual-classroom-canvas" />

      <header className="world-top-nav">
        <button
          className="world-nav-btn world-exit-btn"
          onClick={() => {
            if (document.pointerLockElement) document.exitPointerLock();
            setExitModalOpen(true);
          }}
          title="ออกจากห้องเรียน 3D เพื่อกลับหน้าหลักหรือบทเรียน"
        >
          <LogOut size={16} />
          <span>ออกจากห้อง 3D</span>
        </button>

        <button
          className="world-nav-btn world-menu-btn"
          onClick={() => {
            if (document.pointerLockElement) document.exitPointerLock();
            setQuickMenuOpen(true);
          }}
          title="เปิดเมนูเว็บไซต์ KruJames.com"
        >
          <Menu size={16} />
          <span>เมนู</span>
        </button>

        <div className="world-room-label">
          {isTeacher ? (
            <label className="world-room-picker">
              <Crown size={16} />
              <select value={teacherRoom} onChange={(event) => setTeacherRoom(event.target.value)} aria-label="เลือกห้องเรียนที่ครูจะเข้าร่วม">
                {CLASSROOMS.map((room) => <option key={room} value={room}>ห้อง {room}</option>)}
              </select>
            </label>
          ) : <strong>ห้อง {activeClassroom} 3D</strong>}
          <span><Users size={15} /> {Math.max(1, onlinePlayers.length)}</span>
          <span className="world-week-chip" title="แผนที่ประจำสัปดาห์นี้ รีเซ็ตอัตโนมัติทุกวันจันทร์">
            <Calendar size={13} /> {weekDisplayLabel}
          </span>
          {isTeacher && (
            <button
              className="world-remap-btn"
              onClick={() => {
                if (document.pointerLockElement) document.exitPointerLock();
                setConfirmRemapOpen(true);
              }}
              title="ล้างบล็อกทั้งหมดในแผนที่สัปดาห์นี้"
            >
              <RotateCcw size={13} /> รีแมพ
            </button>
          )}
        </div>
      </header>

      {pointerLocked && (
        <div className="world-pointer-tip">
          <span>💡 กดแป้น <strong>[Esc]</strong> เพื่อแสดงเมาส์ หรือคลิก <strong>🚪 ออกจากห้อง 3D</strong> ด้านบนซ้าย</span>
        </div>
      )}


      <button className="world-avatar-badge" onClick={() => setAvatarPanelOpen((open) => !open)} aria-label="ปรับตัวละครและดูผู้เล่นในห้อง">
        <span className="world-avatar-face" style={{ '--avatar': avatarColor } as React.CSSProperties}><ScanFace size={22} /></span>
        <span>
          <strong>{isTeacher ? 'ครูอนันตชัย' : displayName}</strong>
          <small>{activeClassroom} · {syncMode === 'firebase' ? 'ออนไลน์หลายเครื่อง' : syncMode === 'local' ? 'เฉพาะเครื่องนี้' : 'กำลังเชื่อมต่อ'}</small>
        </span>
      </button>

      {avatarPanelOpen && (
        <aside className="world-avatar-panel">
          <button className="world-panel-close" onClick={() => setAvatarPanelOpen(false)} aria-label="ปิดแผงตัวละคร"><X size={18} /></button>
          <h2><Palette size={19} /> ตัวละครของฉัน</h2>
          <p>{isTeacher ? 'ครูอนันตชัย' : displayName}</p>
          <div className="world-avatar-colors" aria-label="เลือกสีเสื้อตัวละคร">
            {AVATAR_COLORS.map((color) => (
              <button
                key={color}
                className={avatarColor === color ? 'active' : ''}
                style={{ '--avatar': color } as React.CSSProperties}
                onClick={() => setAvatarColor(color)}
                aria-label={`เลือกสี ${color}`}
              />
            ))}
          </div>
          <h3><Gauge size={17} /> ระดับภาพ</h3>
          <div className="world-quality-control" role="group" aria-label="เลือกระดับคุณภาพกราฟิก">
            {([
              ['low', 'เบา'],
              ['medium', 'สมดุล'],
              ['high', 'สวย'],
            ] as Array<[GraphicsQuality, string]>).map(([quality, label]) => (
              <button
                key={quality}
                className={graphicsQuality === quality ? 'active' : ''}
                onClick={() => setGraphicsQuality(quality)}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="world-sound-toggle">
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(event) => {
                const next = event.target.checked;
                setSoundEnabled(next);
                virtualAudioService.setSoundEnabled(next);
                if (next) virtualAudioService.playStar();
              }}
            />
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>เสียงเอฟเฟกต์ 3D (SFX)</span>
          </label>
          {!isTeacher && (
            <label className="world-follow-toggle">
              <input type="checkbox" checked={followTeacher} onChange={(event) => setFollowTeacher(event.target.checked)} />
              <MonitorPlay size={16} /> ตามสไลด์และเกมของครู
            </label>
          )}
          <h3><Users size={17} /> ผู้เล่นในห้อง ({Math.max(1, onlinePlayers.length)})</h3>
          <div className="world-player-list">
            {onlinePlayers.length > 0 ? onlinePlayers.map((player) => (
              <span key={player.id}>
                <i style={{ background: player.color }} />
                {player.role === 'teacher' ? 'ครู ' : ''}{player.name}
                {player.joinStatus === 'waiting' && <small>รออนุมัติ</small>}
              </span>
            )) : <span><i style={{ background: avatarColor }} />{displayName}</span>}
          </div>
        </aside>
      )}

      {isTeacher && teacherPanelOpen && (
        <aside className="world-teacher-panel">
          <button className="world-panel-close" onClick={() => setTeacherPanelOpen(false)} aria-label="ปิดแผงควบคุมครู"><X size={18} /></button>
          <header>
            <Settings2 size={20} />
            <div><h2>ควบคุมห้อง {activeClassroom}</h2><small>{syncMode === 'firebase' ? 'ซิงก์ออนไลน์หลายเครื่อง' : 'กำลังใช้ข้อมูลสำรองในเครื่อง'}</small></div>
          </header>

          <div className="world-live-stats">
            <span><b>{roomAnalytics.active}</b>ออนไลน์</span>
            <span><b>{roomAnalytics.waiting}</b>รอเข้า</span>
            <span><b>{todayEvents.length}</b>หลักฐานวันนี้</span>
          </div>

          <section>
            <h3><Radio size={17} /> การสอนพร้อมกัน</h3>
            <button
              className="world-teacher-command"
              onClick={() => missionBoard && broadcastPresentation(missionBoard, slideIndex)}
              disabled={!missionBoard}
            >
              <Presentation size={17} /> ส่งสไลด์ปัจจุบันให้นักเรียน
            </button>
            <button
              className="world-teacher-command"
              onClick={() => updateRoom({
                summonVersion: (roomState.summonVersion || 0) + 1,
                summonX: 0,
                summonZ: 10,
              })}
            >
              <Users size={17} /> เรียกรวมหน้าห้อง
            </button>
            <div className="world-game-launcher">
              {gameStations.map((game) => (
                <button key={game.id} onClick={() => startRoomGame(game)} title={`เริ่ม ${game.title}`}>
                  <Gamepad2 size={16} /><span>{game.title}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3><ShieldCheck size={17} /> ระเบียบในห้อง</h3>
            <button className={`world-setting-row ${roomState.isOpen ? 'active' : ''}`} onClick={() => updateRoom({ isOpen: !roomState.isOpen })}>
              {roomState.isOpen ? <DoorOpen size={18} /> : <DoorClosed size={18} />}
              <span><b>เปิดรับนักเรียน</b><small>{roomState.isOpen ? 'เข้าห้องได้' : 'ปิดห้องชั่วคราว'}</small></span>
              <i />
            </button>
            <button className={`world-setting-row ${roomState.movementLocked ? 'active' : ''}`} onClick={() => updateRoom({ movementLocked: !roomState.movementLocked })}>
              <LockKeyhole size={18} /><span><b>พักการเดิน</b><small>ใช้เมื่อต้องการให้นักเรียนดูสไลด์</small></span><i />
            </button>
            <button className={`world-setting-row ${roomState.buildLocked ? 'active' : ''}`} onClick={() => updateRoom({ buildLocked: !roomState.buildLocked })}>
              <Box size={18} /><span><b>ปิดโหมดสร้าง</b><small>ป้องกันการวางบล็อกระหว่างสอน</small></span><i />
            </button>
            <button className={`world-setting-row ${roomState.requireApproval ? 'active' : ''}`} onClick={() => updateRoom({ requireApproval: !roomState.requireApproval })}>
              <UserCheck size={18} /><span><b>ครูอนุมัติก่อนเข้า</b><small>ตรวจรายชื่อผู้เรียนทีละคน</small></span><i />
            </button>
            <div className="world-room-code">
              <input
                inputMode="numeric"
                maxLength={6}
                value={teacherCodeInput}
                onChange={(event) => setTeacherCodeInput(event.target.value.replace(/\D/g, ''))}
                placeholder={roomState.accessCodeHash ? 'ตั้งรหัสใหม่' : 'รหัส 4-6 หลัก'}
                aria-label="รหัสเข้าห้องใหม่"
              />
              <button onClick={() => void submitRoomCode()}>{teacherCodeInput ? 'บันทึก' : roomState.accessCodeHash ? 'ยกเลิกรหัส' : 'ตั้งรหัส'}</button>
            </div>
          </section>

          <section>
            <h3><Users size={17} /> จัดการผู้เรียน</h3>
            <div className="world-teacher-player-list">
              {onlinePlayers.filter((player) => player.role !== 'teacher').length === 0 && <p>ยังไม่มีนักเรียนในห้อง</p>}
              {onlinePlayers.filter((player) => player.role !== 'teacher').map((player) => (
                <div key={player.id}>
                  <span><i style={{ background: player.color }} />{player.name}<small>{player.joinStatus === 'waiting' ? 'รออนุมัติ' : player.joinStatus === 'blocked' ? 'นำออกแล้ว' : 'กำลังเรียน'}</small></span>
                  <div>
                    {player.joinStatus === 'waiting' && !roomState.blockedPlayerIds.includes(player.id) && (
                      <button onClick={() => approvePlayer(player.id)} title="อนุมัติเข้าห้อง" aria-label={`อนุมัติ ${player.name}`}><UserCheck size={16} /></button>
                    )}
                    {roomState.blockedPlayerIds.includes(player.id) ? (
                      <button onClick={() => unblockPlayer(player.id)} title="ปลดการนำออก" aria-label={`อนุญาต ${player.name} อีกครั้ง`}><DoorOpen size={16} /></button>
                    ) : (
                      <button onClick={() => kickPlayer(player.id)} title="นำออกจากห้อง" aria-label={`นำ ${player.name} ออกจากห้อง`}><UserX size={16} /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3><Gauge size={17} /> หลักฐานวันนี้</h3>
            <div className="world-evidence-summary">
              <span><b>{roomAnalytics.slides}</b>สไลด์</span>
              <span><b>{roomAnalytics.questions}</b>คำถาม</span>
              <span><b>{roomAnalytics.games}</b>เกม</span>
              <span><b>{roomAnalytics.artifacts}</b>ผลงาน</span>
            </div>
            <div className="world-recent-events">
              {todayEvents.slice(0, 5).map((event) => <p key={event.id}><b>{event.playerName}</b><span>{event.detail}</span></p>)}
            </div>
          </section>
        </aside>
      )}

      <div className="world-star-score" title="ดาวจากเกมเก็บดาว"><Star size={18} fill="currentColor" /> {worldStars}</div>

      {(currentObbyStep >= 0 || highestCheckpoint >= 0) && (
        <div className="world-obby-hud" aria-label="ความคืบหน้าลานกระโดดคิดเป็นลำดับ">
          <div className="world-obby-hud-title">
            <span>🏃 ลานฝึกคิดเป็นลำดับ ({activeClassroom})</span>
            <small>{currentObbyStep === 4 ? '🏆 พิชิตยอดเขา!' : `ขั้นที่ ${Math.max(1, currentObbyStep + 1)}/4`}</small>
          </div>
          <div className="world-obby-hud-track">
            {OBBY_CHECKPOINTS.map((cp, idx) => {
              const isUnlocked = unlockedCheckpoints[idx];
              const isCurrent = currentObbyStep === idx;
              return (
                <button
                  key={cp.index}
                  type="button"
                  className={`world-obby-node ${isCurrent ? 'current' : ''} ${isUnlocked ? 'unlocked' : ''}`}
                  onClick={() => {
                    if (isUnlocked) teleportToCheckpoint(idx);
                  }}
                  title={isUnlocked ? `คลิกเพื่อวาร์ปไป${cp.title} (ผ่านแล้ว)` : `${cp.title} (ยังไม่ผ่าน)`}
                  disabled={!isUnlocked}
                >
                  {isUnlocked ? '✓ ' : ''}{idx + 1}. {cp.pillar === 'decompose' ? 'แยกย่อย' : cp.pillar === 'pattern' ? 'รูปแบบ' : cp.pillar === 'abstract' ? 'นามธรรม' : 'อัลกอริทึม'}
                </button>
              );
            })}
            <span className={`world-obby-node goal ${currentObbyStep === 4 ? 'active' : ''}`} title="ยอดเขาแห่งปัญญา">
              🏆 ยอดเขา
            </span>
          </div>
          {highestCheckpoint >= 0 && (
            <button
              type="button"
              className="world-obby-teleport-chip"
              onClick={() => teleportToCheckpoint(highestCheckpoint)}
              title={`วาร์ปกลับสู่เช็คพอยต์สูงสุดที่ปลดล็อก (ด่าน ${highestCheckpoint + 1})`}
            >
              <Flag size={13} /> วาร์ปกลับด่าน {highestCheckpoint + 1}
            </button>
          )}
        </div>
      )}

      {mode === 'build' && (
        <div className="world-build-capacity" aria-label={`ใช้บล็อก ${worldBlockCount} จาก ${MAX_WORLD_BLOCKS} ชิ้น`}>
          <BrickWall size={17} />
          <strong>{worldBlockCount.toLocaleString('th-TH')}/{MAX_WORLD_BLOCKS.toLocaleString('th-TH')}</strong>
          <span>ระยะ {BUILD_REACH} ช่อง • สูง {BUILD_MAX_HEIGHT} ชั้น</span>
        </div>
      )}

      {mode === 'build' && currentBuildMission && (
        <div style={{ position: 'absolute', zIndex: 6, top: 146, right: 14, width: 204, background: 'rgba(255,255,255,0.94)', border: '1px solid rgba(15,23,42,0.12)', borderRadius: 10, boxShadow: '0 8px 24px rgba(15,23,42,0.14)', backdropFilter: 'blur(8px)', padding: '10px 12px' }}>
          <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#4f46e5', display: 'flex', alignItems: 'center', gap: 5 }}>{currentBuildMission.icon} ภารกิจสร้าง {buildMissionIdx + 1}/{BUILD_MISSIONS.length}</div>
          <div style={{ fontWeight: 700, fontSize: '0.88rem', margin: '5px 0 2px', color: '#172033' }}>{currentBuildMission.goal}</div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.45 }}>💡 {currentBuildMission.concept}</div>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f766e', margin: '7px 0' }}>{currentBuildMission.progress(buildStats)}</div>
          <button onClick={checkBuildMission} style={{ width: '100%', padding: '8px', borderRadius: 8, border: 0, background: currentBuildMission.check(buildStats) ? '#22c55e' : '#6366f1', color: '#fff', fontWeight: 800, fontSize: '0.8rem', fontFamily: 'inherit', cursor: 'pointer' }}>✓ ตรวจภารกิจ (+{currentBuildMission.stars}⭐)</button>
        </div>
      )}
      {mode === 'build' && !currentBuildMission && (
        <div style={{ position: 'absolute', zIndex: 6, top: 146, right: 14, width: 204, background: 'rgba(220,252,231,0.95)', border: '1px solid #86efac', borderRadius: 10, padding: '10px 12px', fontSize: '0.82rem', fontWeight: 700, color: '#15803d' }}>🎉 ทำภารกิจสร้างครบทุกข้อแล้ว! เก่งมาก</div>
      )}

      <div className="world-mode-control" role="group" aria-label="โหมดการใช้งาน">
        <button className={mode === 'explore' ? 'active' : ''} onClick={() => setMode('explore')} title="โหมดสำรวจ" aria-label="โหมดสำรวจ" disabled={!canParticipate}>
          <Eye size={19} /><span>สำรวจ</span>
        </button>
        <button
          className={mode === 'build' ? 'active' : ''}
          onClick={() => setMode('build')}
          title="โหมดสร้าง"
          aria-label="โหมดสร้าง"
          disabled={!canParticipate || (!isTeacher && roomState.buildLocked)}
        >
          <Hammer size={19} /><span>สร้าง</span>
        </button>
      </div>

      <div className="world-materials" aria-label="แถบเลือกบล็อก (กดเลข 1-9)">
        {MATERIALS.map((item, index) => (
          <button
            key={item.id}
            className={material === item.id ? 'active' : ''}
            style={{ '--swatch': item.color } as React.CSSProperties}
            onClick={() => { setMaterial(item.id); if (mode !== 'build') setMode('build'); }}
            title={`${item.label} (กด ${index + 1})`}
            aria-label={item.label}
          >
            <span className="slot-num">{index + 1}</span>
          </button>
        ))}
      </div>

      <div className="world-actions">
        <button onClick={() => lockRef.current()} title="ควบคุมมุมมอง" aria-label="ควบคุมมุมมอง" disabled={!canParticipate}>
          <Maximize2 size={20} />
        </button>
        <button onClick={() => setThirdPerson((active) => !active)} title="สลับมุมมองตัวละคร" aria-label="สลับมุมมองตัวละคร" className={thirdPerson ? 'active' : ''}>
          <ScanFace size={20} />
        </button>
        <button onClick={() => jumpRef.current()} title="กระโดด" aria-label="กระโดด" disabled={!canParticipate || (!isTeacher && roomState.movementLocked)}>
          <ChevronsUp size={20} />
        </button>
        <button onClick={() => interactRef.current()} title="โต้ตอบกับสไลด์หรือเกม" aria-label="โต้ตอบกับสไลด์หรือเกม" disabled={!canParticipate}>
          <Hand size={20} />
        </button>
        <button onClick={() => setGamesPanelOpen(true)} title="เปิดแผงเกมทั้งหมด" aria-label="เปิดแผงเกมทั้งหมด" className={gamesPanelOpen ? 'active' : ''}>
          <Gamepad2 size={20} />
        </button>
        <button
          onClick={() => {
            setSoundEnabled((prev) => {
              const next = !prev;
              virtualAudioService.setSoundEnabled(next);
              if (next) virtualAudioService.playStar();
              return next;
            });
          }}
          title={soundEnabled ? 'ปิดเสียงเอฟเฟกต์ (SFX)' : 'เปิดเสียงเอฟเฟกต์ (SFX)'}
          aria-label={soundEnabled ? 'ปิดเสียงเอฟเฟกต์ (SFX)' : 'เปิดเสียงเอฟเฟกต์ (SFX)'}
          className={soundEnabled ? 'active' : ''}
        >
          {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
        {mode === 'build' && (
          <>
            <button onClick={() => placeRef.current()} title="วางบล็อก" aria-label="วางบล็อก">
              <Box size={20} />
            </button>
            <button onClick={() => removeRef.current()} title="ลบบล็อก" aria-label="ลบบล็อก">
              <Eraser size={20} />
            </button>
          </>
        )}
        {isTeacher && (
          <button onClick={() => setTeacherPanelOpen((open) => !open)} title="ควบคุมห้องเรียน" aria-label="ควบคุมห้องเรียน" className={teacherPanelOpen ? 'active' : ''}>
            <Settings2 size={20} />
          </button>
        )}
      </div>

      <div className="world-dpad" aria-label="ควบคุมการเดิน">
        <button className="up" onPointerDown={() => holdDirection('ArrowUp', true)} onPointerUp={() => holdDirection('ArrowUp', false)} onPointerLeave={() => holdDirection('ArrowUp', false)} aria-label="เดินหน้า"><MoveUp /></button>
        <button className="left" onPointerDown={() => holdDirection('ArrowLeft', true)} onPointerUp={() => holdDirection('ArrowLeft', false)} onPointerLeave={() => holdDirection('ArrowLeft', false)} aria-label="เดินซ้าย"><MoveLeft /></button>
        <button className="down" onPointerDown={() => holdDirection('ArrowDown', true)} onPointerUp={() => holdDirection('ArrowDown', false)} onPointerLeave={() => holdDirection('ArrowDown', false)} aria-label="ถอยหลัง"><MoveDown /></button>
        <button className="right" onPointerDown={() => holdDirection('ArrowRight', true)} onPointerUp={() => holdDirection('ArrowRight', false)} onPointerLeave={() => holdDirection('ArrowRight', false)} aria-label="เดินขวา"><MoveRight /></button>
      </div>

      <div className={`world-crosshair ${pointerLocked ? 'locked' : ''}`} aria-hidden="true" />
      {!pointerLocked && canParticipate && (
        <div className="world-controls-hint">
          <b>🎮 คลิกที่จอเพื่อเริ่มเล่น</b>
          <span>🖱️ คลิกซ้าย = ทุบบล็อก / เปิดสไลด์ • คลิกขวา = วางบล็อก</span>
          <span>⌨️ WASD หรือ ลูกศร = เดิน • Space = กระโดด • เลข 1-9 = เลือกบล็อก</span>
        </div>
      )}
      {status && <div className="world-status">{status}</div>}

      {!isTeacher && missionBoard && (
        <div className="world-mission-hint">
          <strong><Presentation size={17} /> ภารกิจหน่วยที่ {missionBoard.unitNo}</strong>
          <span className={missionCounts.slides >= Math.min(4, missionBoard.slides.length) ? 'done' : ''}>
            {missionCounts.slides >= Math.min(4, missionBoard.slides.length) ? <CheckCircle2 /> : <BookOpen />} สไลด์ {missionCounts.slides}/{Math.min(4, missionBoard.slides.length)}
          </span>
          <span className={missionCounts.questions >= 1 ? 'done' : ''}>
            {missionCounts.questions >= 1 ? <CheckCircle2 /> : <ShieldCheck />} คำถาม K
          </span>
          <span className={missionCounts.games >= 1 ? 'done' : ''}>
            {missionCounts.games >= 1 ? <CheckCircle2 /> : <Gamepad2 />} เกม P
          </span>
          <span className={missionCounts.artifacts >= 3 ? 'done' : ''}>
            {missionCounts.artifacts >= 3 ? <CheckCircle2 /> : <Box />} ผลงาน {missionCounts.artifacts}/3
          </span>
          <small>A: เข้าเรียนตามตาราง {missionUnit?.inClassDays?.length || 0}/2 วัน</small>
        </div>
      )}

      {!isTeacher && !canParticipate && (
        <div className="world-access-overlay">
          <section>
            {blocked ? (
              <>
                <UserX size={42} />
                <h2>ครูนำออกจากห้องชั่วคราว</h2>
                <p>รอครูอนุญาตอีกครั้ง ชื่อของนักเรียนยังคงอยู่ในรายชื่อเพื่อให้ครูตรวจสอบได้</p>
              </>
            ) : !roomState.isOpen ? (
              <>
                <DoorClosed size={42} />
                <h2>ห้องเรียนยังไม่เปิด</h2>
                <p>ครูจะเปิดห้องเมื่อพร้อมเริ่มกิจกรรม</p>
              </>
            ) : !codeGranted ? (
              <>
                <LockKeyhole size={42} />
                <h2>ใส่รหัสเข้าห้อง</h2>
                <div className="world-join-code">
                  <input
                    inputMode="numeric"
                    maxLength={6}
                    value={joinCodeInput}
                    onChange={(event) => setJoinCodeInput(event.target.value.replace(/\D/g, ''))}
                    onKeyDown={(event) => { if (event.key === 'Enter') void submitJoinCode(); }}
                    aria-label="รหัสเข้าห้อง"
                    autoFocus
                  />
                  <button onClick={() => void submitJoinCode()}>เข้าห้อง</button>
                </div>
              </>
            ) : (
              <>
                <UserCheck size={42} />
                <h2>ส่งคำขอเข้าห้องแล้ว</h2>
                <p>ครูเห็นชื่อของนักเรียนแล้ว กรุณารอครูกดอนุมัติ</p>
              </>
            )}
          </section>
        </div>
      )}

      {!grade && (
        <div className="world-empty-board">
          <BrickWall size={24} />
          <span>เข้าสู่ระบบนักเรียนเพื่อเชื่อมบอร์ดบทเรียนของชั้นเรียน</span>
        </div>
      )}

      {selectedBoard && selectedSlide && (
        <div className="world-lesson-overlay" onClick={() => setSelectedBoard(null)}>
          <section className={`world-lesson-modal theme-${selectedSlide.theme || 'blue'}`} onClick={(event) => event.stopPropagation()}>
            <button className="world-modal-close" onClick={() => setSelectedBoard(null)} aria-label="ปิด"><X /></button>
            <span className="world-unit-number">หน่วยที่ {selectedBoard.unitNo} · สไลด์ {slideIndex + 1}/{selectedBoard.slides.length}</span>
            <h2>{selectedSlide.emoji && <span>{selectedSlide.emoji} </span>}{selectedSlide.title}</h2>
            <div className="world-slide-content">
              {selectedSlide.image && <img src={selectedSlide.image} alt={selectedSlide.imageCaption || selectedSlide.title} />}
              <div>
                {selectedSlide.body && <p>{selectedSlide.body}</p>}
                {selectedSlide.bullets && (
                  <div className="world-topic-list">
                    {selectedSlide.bullets.slice(0, 6).map((item, index) => (
                      <span key={`${item.text}_${index}`}>{item.emoji && <b>{item.emoji}</b>}{item.text}{item.sub && <small>{item.sub}</small>}</span>
                    ))}
                  </div>
                )}
                {(selectedSlide.compareLeft || selectedSlide.compareRight) && (
                  <div className="world-slide-compare">
                    {[selectedSlide.compareLeft, selectedSlide.compareRight].filter(Boolean).map((side) => (
                      <div key={side!.title}><strong>{side!.emoji} {side!.title}</strong>{side!.items.map((item) => <span key={item}>{item}</span>)}</div>
                    ))}
                  </div>
                )}
                {selectedSlide.callout && <div className="world-slide-callout">{selectedSlide.callout.emoji} {selectedSlide.callout.text}</div>}
                {selectedSlide.code && <pre><code>{selectedSlide.code.content}</code></pre>}
              </div>
            </div>
            {selectedBoard.extras && (
              <section className="world-lesson-library">
                <h3><BookOpen size={19} /> เนื้อหาและกิจกรรมจากบทเรียนในเว็บ</h3>
                {selectedBoard.extras.intro && <p>{selectedBoard.extras.intro}</p>}
                {selectedBoard.extras.lessonNotes?.objectives?.length && (
                  <div className="world-learning-goals">
                    <strong>เป้าหมายการเรียนรู้</strong>
                    {selectedBoard.extras.lessonNotes.objectives.slice(0, 4).map((item) => <span key={item}>{item}</span>)}
                  </div>
                )}
                {selectedBoard.extras.lessonNotes?.vocabulary?.length && (
                  <div className="world-vocabulary">
                    {selectedBoard.extras.lessonNotes.vocabulary.slice(0, 8).map((word) => <span key={word}>{word}</span>)}
                  </div>
                )}
                {selectedBoard.extras.fun?.some((item) => item.url) && (
                  <div className="world-resource-links">
                    {selectedBoard.extras.fun.filter((item) => item.url).slice(0, 3).map((item) => (
                      item.url!.startsWith('/') ? (
                        <Link
                          key={item.title}
                          to={item.url!}
                          onClick={() => void recordActivity(
                            'game',
                            `u${selectedBoard.unitNo}-resource-${item.title}`,
                            selectedBoard.unitNo,
                            `กิจกรรมเสริม ${item.title}`,
                          )}
                        >
                          <b>{item.emoji}</b><span>{item.title}<small>{item.desc}</small></span>
                        </Link>
                      ) : (
                        <a
                          key={item.title}
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => void recordActivity(
                            'game',
                            `u${selectedBoard.unitNo}-resource-${item.title}`,
                            selectedBoard.unitNo,
                            `สื่อเสริม ${item.title}`,
                          )}
                        >
                          <b>{item.emoji}</b><span>{item.title}<small>{item.desc}</small></span>
                        </a>
                      )
                    ))}
                  </div>
                )}
                {selectedBoard.extras.quiz?.[0] && (
                  <div className="world-knowledge-check">
                    <strong>ลองตอบก่อนผ่านด่าน</strong>
                    <p>{selectedBoard.extras.quiz[0].q}</p>
                    <div>
                      {selectedBoard.extras.quiz[0].options.map((option, index) => {
                        const answered = quizAnswer !== null;
                        const correct = index === selectedBoard.extras!.quiz![0].answer;
                        const selected = quizAnswer === index;
                        return (
                          <button
                            key={option}
                            className={answered ? (correct ? 'correct' : selected ? 'wrong' : '') : ''}
                            onClick={() => {
                              setQuizAnswer(index);
                              if (correct) void recordActivity(
                                'question',
                                `u${selectedBoard.unitNo}-question-0`,
                                selectedBoard.unitNo,
                                'ตอบคำถามตรวจความเข้าใจถูกต้อง',
                              );
                            }}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                    {quizAnswer !== null && (
                      <small className={quizAnswer === selectedBoard.extras.quiz[0].answer ? 'correct-text' : 'wrong-text'}>
                        {quizAnswer === selectedBoard.extras.quiz[0].answer
                          ? `ตอบถูก ${selectedBoard.extras.quiz[0].explain || 'เก่งมาก ลองอธิบายเหตุผลให้เพื่อนฟังด้วยนะ'}`
                          : 'ยังไม่ถูก ลองอ่านสไลด์อีกครั้งแล้วเลือกใหม่'}
                      </small>
                    )}
                  </div>
                )}
              </section>
            )}
            <div className="world-slide-footer">
              <div className="world-slide-nav">
                <button onClick={() => changeSlide(slideIndex - 1)} disabled={slideIndex === 0} aria-label="สไลด์ก่อนหน้า"><ChevronLeft /></button>
                <button onClick={() => changeSlide(slideIndex + 1)} disabled={slideIndex === selectedBoard.slides.length - 1} aria-label="สไลด์ถัดไป"><ChevronRight /></button>
              </div>
              <Link to={selectedBoard.href} className="world-enter-lesson">
                <BookOpen size={18} /> เข้าสู่บทเรียนเต็ม
              </Link>
            </div>
          </section>
        </div>
      )}

      {gamesPanelOpen && (
        <div className="world-lesson-overlay" onClick={() => setGamesPanelOpen(false)}>
          <section className="world-games-panel" onClick={(event) => event.stopPropagation()}>
            <button className="world-modal-close" onClick={() => setGamesPanelOpen(false)} aria-label="ปิด"><X /></button>
            <h2><Gamepad2 size={26} style={{ verticalAlign: 'middle', marginRight: 8 }} />เลือกเกมฝึกทักษะ</h2>
            <p>มีทั้งหมด {gamesCatalog.length} เกม — ผลการเล่นจะเชื่อมกับกิจกรรมและคะแนนของนักเรียน</p>
            <div className="world-games-grid">
              {gamesCatalog.map((game) => (
                <Link
                  key={game.id}
                  to={game.path}
                  className="world-game-card"
                  style={{ '--gc': game.color } as React.CSSProperties}
                  onClick={() => {
                    const unitNo = boards[0]?.unitNo || 1;
                    void recordActivity('game', `u${unitNo}-game-${game.id}`, unitNo, `เริ่มเล่น ${game.title}`);
                  }}
                >
                  <span className="world-game-emoji">{game.emoji}</span>
                  <b>{game.title}</b>
                  <small>{game.level} · {game.skill}</small>
                </Link>
              ))}
            </div>
          </section>
        </div>
      )}

      {selectedGame && (
        <div className="world-lesson-overlay" onClick={() => setSelectedGame(null)}>
          <section className="world-game-modal" onClick={(event) => event.stopPropagation()}>
            <button className="world-modal-close" onClick={() => setSelectedGame(null)} aria-label="ปิด"><X /></button>
            <Gamepad2 size={42} style={{ color: selectedGame.color }} />
            <span>สถานีเกมสำหรับ {activeClassroom}</span>
            <h2>{selectedGame.title}</h2>
            <p>{selectedGame.skill} ผลการเล่นจะเชื่อมกับระบบกิจกรรมและคะแนนของนักเรียน</p>
            <Link
              to={selectedGame.path}
              className="world-play-game"
              style={{ background: selectedGame.color }}
              onClick={() => {
                const unitNo = selectedBoard?.unitNo || boards[0]?.unitNo || 1;
                void recordActivity(
                  'game',
                  `u${unitNo}-game-${selectedGame.id}`,
                  unitNo,
                  `เริ่มเล่น ${selectedGame.title}`,
                );
              }}
            >
              <Gamepad2 size={20} /> เริ่มเล่นเกม
            </Link>
          </section>
        </div>
      )}

      {/* หน้าต่างยืนยันการออกจากห้อง 3D เข้าใจง่ายสำหรับเด็ก */}
      {exitModalOpen && (
        <div
          className="world-modal-backdrop"
          onClick={() => setExitModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="world-exit-title"
        >
          <div className="world-modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="world-modal-header">
              <div className="world-modal-title">
                <DoorOpen size={24} style={{ color: '#059669' }} />
                <h3 id="world-exit-title">ต้องการออกจากห้องเรียน 3D ใช่ไหม?</h3>
              </div>
              <button
                className="world-modal-close-btn"
                onClick={() => setExitModalOpen(false)}
                aria-label="ปิด"
              >
                <X size={20} />
              </button>
            </div>
            <p className="world-modal-desc">
              น้อง ๆ สามารถเลือกหน้าที่ต้องการไปต่อได้เลยครับ หรือกดเล่นต่อเพื่อสร้างบล็อกในห้องเรียน 3D
            </p>
            <div className="world-exit-options">
              <button
                type="button"
                className="world-exit-card card-home"
                onClick={() => {
                  if (document.pointerLockElement) document.exitPointerLock();
                  navigate('/');
                }}
              >
                <div className="world-exit-card-icon">🏠</div>
                <div className="world-exit-card-body">
                  <strong>กลับหน้าแรก</strong>
                  <small>ไปหน้าแรกของ krujames.com</small>
                </div>
              </button>

              <button
                type="button"
                className="world-exit-card card-curriculum"
                onClick={() => {
                  if (document.pointerLockElement) document.exitPointerLock();
                  navigate(gradeId ? `/curriculum/${gradeId}/unit/1` : '/courses');
                }}
              >
                <div className="world-exit-card-icon">📚</div>
                <div className="world-exit-card-body">
                  <strong>กลับหน้าบทเรียน</strong>
                  <small>ไปเรียนเนื้อหาสไลด์และตัวชี้วัด</small>
                </div>
              </button>

              <button
                type="button"
                className="world-exit-card card-games"
                onClick={() => {
                  if (document.pointerLockElement) document.exitPointerLock();
                  navigate('/games');
                }}
              >
                <div className="world-exit-card-icon">🎮</div>
                <div className="world-exit-card-body">
                  <strong>ไปศูนย์รวมเกม</strong>
                  <small>ฝึกเมาส์ คีย์บอร์ด และเกมโค้ดดิ้ง</small>
                </div>
              </button>
            </div>
            <div className="world-modal-footer">
              <button
                type="button"
                className="world-btn-cancel"
                onClick={() => setExitModalOpen(false)}
              >
                ✕ เล่นต่อในห้อง 3D
              </button>
            </div>
          </div>
        </div>
      )}

      {/* เมนูนำทางด่วน KruJames.com */}
      {quickMenuOpen && (
        <div
          className="world-modal-backdrop"
          onClick={() => setQuickMenuOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="world-menu-title"
        >
          <div className="world-modal-card quick-menu-card" onClick={(event) => event.stopPropagation()}>
            <div className="world-modal-header">
              <div className="world-modal-title">
                <Menu size={22} style={{ color: '#2563eb' }} />
                <h3 id="world-menu-title">เมนูเว็บไซต์ KruJames.com</h3>
              </div>
              <button
                className="world-modal-close-btn"
                onClick={() => setQuickMenuOpen(false)}
                aria-label="ปิด"
              >
                <X size={20} />
              </button>
            </div>
            <div className="world-quick-menu-grid">
              <Link
                to="/"
                className="world-menu-link"
                onClick={() => { if (document.pointerLockElement) document.exitPointerLock(); }}
              >
                <Home size={20} />
                <div>
                  <strong>หน้าแรก</strong>
                  <small>ข่าวสารและภาพรวม</small>
                </div>
              </Link>
              <Link
                to="/courses"
                className="world-menu-link"
                onClick={() => { if (document.pointerLockElement) document.exitPointerLock(); }}
              >
                <BookOpen size={20} />
                <div>
                  <strong>คอร์สเรียน</strong>
                  <small>ประถม 1 - มัธยม 3</small>
                </div>
              </Link>
              <Link
                to="/curriculum"
                className="world-menu-link"
                onClick={() => { if (document.pointerLockElement) document.exitPointerLock(); }}
              >
                <Presentation size={20} />
                <div>
                  <strong>หลักสูตร & ตัวชี้วัด</strong>
                  <small>เนื้อหาและสไลด์ 73 หน่วย</small>
                </div>
              </Link>
              <Link
                to="/games"
                className="world-menu-link"
                onClick={() => { if (document.pointerLockElement) document.exitPointerLock(); }}
              >
                <Gamepad2 size={20} />
                <div>
                  <strong>เกมฝึกทักษะ</strong>
                  <small>เกมเมาส์ คีย์บอร์ด โค้ดดิ้ง</small>
                </div>
              </Link>
              <Link
                to="/resources"
                className="world-menu-link"
                onClick={() => { if (document.pointerLockElement) document.exitPointerLock(); }}
              >
                <Library size={20} />
                <div>
                  <strong>แหล่งเรียนรู้</strong>
                  <small>สื่อ เอกสาร ซอฟต์แวร์</small>
                </div>
              </Link>
              <Link
                to="/dashboard"
                className="world-menu-link"
                onClick={() => { if (document.pointerLockElement) document.exitPointerLock(); }}
              >
                <LayoutDashboard size={20} />
                <div>
                  <strong>แดชบอร์ด</strong>
                  <small>สรุปผลและคะแนน</small>
                </div>
              </Link>
            </div>
            <div className="world-quick-menu-footer">
              <button
                type="button"
                className="world-menu-exit-action"
                onClick={() => {
                  setQuickMenuOpen(false);
                  setExitModalOpen(true);
                }}
              >
                <DoorOpen size={18} /> ออกจากห้องเรียน 3D
              </button>
              <button
                type="button"
                className="world-btn-cancel"
                onClick={() => setQuickMenuOpen(false)}
              >
                ปิดเมนู
              </button>
            </div>
          </div>
        </div>
      )}

      {/* หน้าต่างยืนยันรีแมพสัปดาห์นี้สำหรับคุณครู */}
      {confirmRemapOpen && (
        <div
          className="world-modal-backdrop"
          onClick={() => setConfirmRemapOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="world-remap-title"
        >
          <div className="world-modal-card remap-modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="world-modal-header">
              <div className="world-modal-title" style={{ color: '#d97706' }}>
                <RotateCcw size={22} />
                <h3 id="world-remap-title">รีแมพแผนที่สัปดาห์นี้?</h3>
              </div>
              <button
                className="world-modal-close-btn"
                onClick={() => setConfirmRemapOpen(false)}
                aria-label="ปิด"
              >
                <X size={20} />
              </button>
            </div>
            <p className="world-modal-desc">
              คุณครูต้องการล้างบล็อกทั้งหมด ({worldBlockCount} ก้อน) ในแผนที่ <strong>{weekDisplayLabel}</strong> ของห้อง {activeClassroom} ใช่หรือไม่?
              <br />
              <small style={{ display: 'inline-block', marginTop: 6, color: '#64748b' }}>
                * แผนที่จะถูกรีเซ็ตใหม่สะอาดทันที เพื่อให้เริ่มกิจกรรมสร้างสรรค์รอบใหม่
              </small>
            </p>
            <div className="world-modal-actions">
              <button
                type="button"
                className="world-btn-danger"
                onClick={async () => {
                  setConfirmRemapOpen(false);
                  try {
                    await clearWorldBlocks(roomId, currentWeekKey);
                    celebrate();
                    setStatus('รีแมพแผนที่สัปดาห์นี้เรียบร้อยแล้ว');
                  } catch (err) {
                    setStatus(err instanceof Error ? err.message : 'รีแมพไม่สำเร็จ');
                  }
                }}
              >
                <RotateCcw size={16} /> ยืนยันรีแมพสัปดาห์นี้
              </button>
              <button
                type="button"
                className="world-btn-cancel"
                onClick={() => setConfirmRemapOpen(false)}
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal คำถามประจำด่านตามระดับชั้น */}
      {activeCheckpointQuiz && (
        <div
          className="world-quiz-modal-backdrop"
          onClick={() => {
            if (checkpointAnswer !== null) {
              activeCheckpointQuizRef.current = false;
              setActiveCheckpointQuiz(null);
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="checkpoint-quiz-title"
        >
          <div className="world-quiz-modal" onClick={(e) => e.stopPropagation()}>
            <div className="world-quiz-header">
              <div className="world-quiz-header-info">
                <div className="world-quiz-badge">
                  <Sparkles size={16} />
                  <span>ทดสอบแนวคิดเชิงคำนวณ • ได้รับ +2 ⭐</span>
                </div>
                <h3 id="checkpoint-quiz-title">{activeCheckpointQuiz.title}</h3>
                <span className="world-quiz-tier">
                  ระดับชั้น {activeClassroom} ({ageTierLabel[ageTierFromClassroom(activeClassroom)]})
                </span>
              </div>
              <button
                type="button"
                className="world-modal-close-btn"
                onClick={() => {
                  activeCheckpointQuizRef.current = false;
                  setActiveCheckpointQuiz(null);
                }}
                aria-label="ปิดคำถาม"
              >
                <X size={20} />
              </button>
            </div>

            <div className="world-quiz-prompt">
              <h4>คำถามประจำด่าน:</h4>
              <p>{activeCheckpointQuiz.question.q}</p>
            </div>

            <div className="world-quiz-choices">
              {activeCheckpointQuiz.question.choices.map((opt, idx) => {
                const isSelected = checkpointAnswer === idx;
                const isCorrect = idx === activeCheckpointQuiz.question.answer;
                let choiceState = '';
                if (checkpointAnswer !== null) {
                  if (isCorrect) choiceState = 'correct';
                  else if (isSelected) choiceState = 'wrong';
                  else choiceState = 'dimmed';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    className={`world-quiz-choice ${choiceState}`}
                    onClick={() => handleAnswerCheckpoint(idx)}
                    disabled={checkpointAnswer !== null}
                  >
                    <span className="choice-number">{['ก', 'ข', 'ค', 'ง'][idx] || idx + 1}</span>
                    <span className="choice-text">{opt}</span>
                    {checkpointAnswer !== null && isCorrect && (
                      <CheckCircle2 size={20} className="choice-feedback-icon correct" />
                    )}
                    {checkpointAnswer !== null && isSelected && !isCorrect && (
                      <X size={20} className="choice-feedback-icon wrong" />
                    )}
                  </button>
                );
              })}
            </div>

            {checkpointAnswer !== null && (
              <div
                className={`world-quiz-feedback ${
                  checkpointAnswer === activeCheckpointQuiz.question.answer ? 'success' : 'retry'
                }`}
              >
                {checkpointAnswer === activeCheckpointQuiz.question.answer ? (
                  <>
                    <div className="world-quiz-feedback-banner">
                      <Sparkles size={20} />
                      <strong>ถูกต้องยอดเยี่ยม! ปลดล็อกด่านแล้ว (+2 ⭐)</strong>
                    </div>
                    {activeCheckpointQuiz.question.why && (
                      <p className="world-quiz-explanation">
                        💡 <strong>คำอธิบาย:</strong> {activeCheckpointQuiz.question.why}
                      </p>
                    )}
                    <button
                      type="button"
                      className="world-quiz-btn-primary"
                      onClick={() => {
                        activeCheckpointQuizRef.current = false;
                        setActiveCheckpointQuiz(null);
                      }}
                    >
                      🚀 ลุยกระโดดด่านถัดไป!
                    </button>
                  </>
                ) : (
                  <>
                    <div className="world-quiz-feedback-banner retry">
                      <RotateCcw size={20} />
                      <strong>ยังไม่ถูกต้องนะ ลองคิดใหม่อีกครั้ง!</strong>
                    </div>
                    {activeCheckpointQuiz.question.why && (
                      <p className="world-quiz-explanation">
                        💡 <strong>คำใบ้ / แนวคิด:</strong> {activeCheckpointQuiz.question.why}
                      </p>
                    )}
                    <div className="world-quiz-retry-actions">
                      <button
                        type="button"
                        className="world-quiz-btn-retry"
                        onClick={() => setCheckpointAnswer(null)}
                      >
                        <RotateCcw size={16} /> ลองตอบใหม่อีกครั้ง
                      </button>
                      <button
                        type="button"
                        className="world-quiz-btn-cancel"
                        onClick={() => {
                          activeCheckpointQuizRef.current = false;
                          setActiveCheckpointQuiz(null);
                        }}
                      >
                        ปิดหน้าต่าง
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VirtualClassroom;
