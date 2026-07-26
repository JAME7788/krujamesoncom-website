import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as THREE from 'three';
import {
  BookOpen,
  Box,
  BrickWall,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsUp,
  Crown,
  DoorClosed,
  DoorOpen,
  Eraser,
  Eye,
  Gauge,
  Gamepad2,
  Hammer,
  Hand,
  LockKeyhole,
  Maximize2,
  MonitorPlay,
  MoveDown,
  MoveLeft,
  MoveRight,
  MoveUp,
  Palette,
  Paintbrush,
  Pipette,
  Play,
  Presentation,
  Radio,
  ScanFace,
  Settings2,
  ShieldCheck,
  Star,
  Timer,
  UserCheck,
  UserX,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { findGrade } from '../data/curriculum';
import { gamesCatalog } from '../data/gamesCatalog';
import { celebrate } from '../utils/celebrate';
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
  defaultVirtualRoomState,
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
  CamouflagePose,
  CamouflageRound,
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
  if (/AI|ปัญญาประดิษฐ์|หุ่นยนต์/i.test(text)) return '🤖';
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
const CAMOUFLAGE_COLORS = ['#2f8f46', '#0f766e', '#2563eb', '#d97706', '#dc5f45', '#64748b', '#f8fafc', '#172033'];
const CAMOUFLAGE_HIDE_SECONDS = 45;
const CAMOUFLAGE_SEEK_SECONDS = 90;
const epochNow = () => Date.now();

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
  const camouflageColorRef = useRef(playerColor(playerId));
  const camouflagePoseRef = useRef<CamouflagePose>('stand');
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
  const sampleColorRef = useRef<() => void>(() => undefined);
  const findPlayerRef = useRef<() => void>(() => undefined);
  const applyCamouflageRef = useRef<(color: string, pose: CamouflagePose) => void>(() => undefined);
  const lockRef = useRef<() => void>(() => undefined);
  const jumpRef = useRef<() => void>(() => undefined);
  const [mode, setMode] = useState<WorldMode>('build');
  const [material, setMaterial] = useState<BlockMaterial>('grass');
  const [teacherRoom, setTeacherRoom] = useState(user?.classroom || 'ป.1');
  const [avatarColor, setAvatarColor] = useState(() => (
    localStorage.getItem(`kj_world_avatar_${playerId}`) || playerColor(playerId)
  ));
  const [thirdPerson, setThirdPerson] = useState(false);
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
  const [camouflageColor, setCamouflageColor] = useState(() => playerColor(playerId));
  const [camouflagePose, setCamouflagePose] = useState<CamouflagePose>('stand');
  const [roundClock, setRoundClock] = useState(() => Date.now());
  const [partyPanelOpen, setPartyPanelOpen] = useState(false);
  const [customSlides, setCustomSlides] = useState<Record<number, RichSlide[]>>({});
  const [status, setStatus] = useState('');
  const [pointerLocked, setPointerLocked] = useState(false);

  const activeClassroom = isTeacher ? teacherRoom : (user?.classroom || 'ป.1');
  const partyMap = new URLSearchParams(window.location.search).get('map') === 'camouflage';
  const roomClassroom = partyMap ? 'ทุกชั้น' : activeClassroom;
  const gradeId = getDefaultProgressGradeIdForClassroom(activeClassroom);
  const grade = gradeId ? findGrade(gradeId) : undefined;
  const roomId = `${partyMap ? 'school-camouflage' : `class-${activeClassroom.replace(/[^0-9ก-๙]/g, '')}`}${qaMode ? `-qa-${qaId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32)}` : ''}`;
  const gameStations = useMemo(() => gamesForClassroom(activeClassroom), [activeClassroom]);
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
  const camouflageRound = roomState.camouflageRound;
  const camouflagePhase = !camouflageRound
    ? 'idle'
    : roundClock < camouflageRound.hideEndsAt
      ? 'hide'
      : roundClock < camouflageRound.roundEndsAt
        ? 'seek'
        : 'result';
  const camouflageRole = !camouflageRound?.participantIds.includes(playerId)
    ? 'spectator'
    : camouflageRound.seekerId === playerId
      ? 'seeker'
      : 'hider';
  const camouflageFound = Boolean(camouflageRound?.foundPlayerIds.includes(playerId));
  const camouflageRemaining = camouflageRound
    ? Math.max(0, Math.ceil(((
      camouflagePhase === 'hide' ? camouflageRound.hideEndsAt : camouflageRound.roundEndsAt
    ) - roundClock) / 1000))
    : 0;
  const activePartyPlayers = useMemo(() => (
    onlinePlayers
      .filter((player) => player.joinStatus !== 'blocked' && player.joinStatus !== 'waiting')
      .slice(0, 10)
  ), [onlinePlayers]);

  useEffect(() => {
    if (!camouflageRound || camouflagePhase === 'result') return;
    const timer = window.setInterval(() => setRoundClock(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [camouflagePhase, camouflageRound]);

  const startCamouflageRound = () => {
    if (!isTeacher) {
      setStatus('ครูเป็นผู้เริ่มรอบพรางสีซ่อนหา');
      return;
    }
    if (activePartyPlayers.length < 2) {
      setStatus('ต้องมีผู้เล่นอย่างน้อย 2 คนจึงจะเริ่มได้');
      return;
    }
    const startedAt = epochNow();
    const seeker = activePartyPlayers[startedAt % activePartyPlayers.length];
    const nextRound: CamouflageRound = {
      id: `camouflage_${startedAt}`,
      seekerId: seeker.id,
      participantIds: activePartyPlayers.map((player) => player.id),
      foundPlayerIds: [],
      startedAt,
      hideEndsAt: startedAt + CAMOUFLAGE_HIDE_SECONDS * 1000,
      roundEndsAt: startedAt + (CAMOUFLAGE_HIDE_SECONDS + CAMOUFLAGE_SEEK_SECONDS) * 1000,
    };
    setRoundClock(startedAt);
    updateRoom({ camouflageRound: nextRound });
    setPartyPanelOpen(true);
    setStatus(`เริ่มรอบแล้ว ${seeker.name} เป็นฝ่ายหา`);
  };

  const stopCamouflageRound = () => {
    if (!isTeacher) return;
    updateRoom({ camouflageRound: null });
    setStatus('จบรอบพรางสีซ่อนหาแล้ว');
  };

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
    camouflageColorRef.current = camouflageColor;
    camouflagePoseRef.current = camouflagePose;
    applyCamouflageRef.current(camouflageColor, camouflagePose);
  }, [camouflageColor, camouflagePose]);

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

    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xfffbeb, roughness: 0.9 });
    const addWall = (x: number, y: number, z: number, w: number, h: number, d: number) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMaterial);
      wall.position.set(x, y, z);
      wall.castShadow = true;
      wall.receiveShadow = true;
      scene.add(wall);
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

    const tableMaterial = new THREE.MeshStandardMaterial({ color: 0xc58b4c, roughness: 0.75 });
    // แพลตฟอร์มที่ยืน/กระโดดขึ้นไปเหยียบได้ (เช่น ผิวโต๊ะ) — AABB + ความสูงผิวด้านบน
    const platforms: { minX: number; maxX: number; minZ: number; maxZ: number; top: number }[] = [];
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
    };
    [[-15, -9], [15, -9], [-15, 8], [15, 8]].forEach(([x, z]) => makeTree(x, z));

    const camouflageGeometries: THREE.BufferGeometry[] = [];
    const camouflageMaterials: THREE.MeshStandardMaterial[] = [];
    const camouflageSurfaces: THREE.Mesh[] = [];
    const camouflageColliders: THREE.Box3[] = [];
    if (partyMap) {
      const coverLayout: Array<[number, number, number, number, number, string]> = [
        [-18, 2, -15, 8, 4, '#2f8f46'],
        [-5, 1.5, -17, 6, 3, '#0f766e'],
        [9, 2.5, -15, 10, 5, '#2563eb'],
        [19, 1.5, -9, 5, 3, '#d97706'],
        [-20, 1.5, 2, 5, 3, '#dc5f45'],
        [-9, 2.25, 1, 8, 4.5, '#64748b'],
        [8, 1.75, 1, 7, 3.5, '#f8fafc'],
        [20, 2.5, 5, 8, 5, '#172033'],
        [-17, 2, 16, 9, 4, '#7c3aed'],
        [0, 1.5, 17, 8, 3, '#0891b2'],
        [16, 2, 17, 7, 4, '#65a30d'],
      ];
      coverLayout.forEach(([x, y, z, width, height, color], index) => {
        const depth = index % 3 === 0 ? 2.8 : 1.4;
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({
          color,
          roughness: 0.82,
          metalness: 0.02,
        });
        const cover = new THREE.Mesh(geometry, material);
        cover.position.set(x, y, z);
        cover.castShadow = true;
        cover.receiveShadow = true;
        cover.userData = { kind: 'cover', sampleColor: color };
        scene.add(cover);
        camouflageGeometries.push(geometry);
        camouflageMaterials.push(material);
        camouflageSurfaces.push(cover);
        camouflageColliders.push(new THREE.Box3().setFromObject(cover).expandByScalar(0.42));
      });
    }

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
    const setAvatarAppearance = (group: THREE.Group, colorValue: string, pose: CamouflagePose) => {
      const paintMeshes = (group.userData.paintMeshes || []) as THREE.Mesh[];
      paintMeshes.forEach((mesh) => {
        const material = mesh.material as THREE.MeshStandardMaterial;
        material.color.set(colorValue);
      });
      const parts = group.userData.parts as {
        leftArm: THREE.Mesh;
        rightArm: THREE.Mesh;
        leftLeg: THREE.Mesh;
        rightLeg: THREE.Mesh;
      };
      group.userData.pose = pose;
      group.scale.y = pose === 'crouch' ? 0.72 : 1;
      parts.leftArm.rotation.set(0, 0, pose === 'freeze' ? 1.25 : 0);
      parts.rightArm.rotation.set(0, 0, pose === 'freeze' ? -1.25 : 0);
      parts.leftLeg.rotation.set(0, 0, 0);
      parts.rightLeg.rotation.set(0, 0, 0);
    };

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
      if (!parts || group.userData.pose === 'freeze') return;
      const swing = moving ? Math.sin(now * 0.011 * speedScale) * 0.62 : 0;
      const jumpLift = jumping ? -0.38 : 0;
      parts.leftArm.rotation.x = swing + jumpLift;
      parts.rightArm.rotation.x = -swing + jumpLift;
      parts.leftLeg.rotation.x = -swing * 0.72;
      parts.rightLeg.rotation.x = swing * 0.72;
    };

    const createAvatar = (player: WorldPlayer) => {
      const group = new THREE.Group();
      const paintColor = partyMap ? (player.camouflageColor || player.color) : player.color;
      const color = new THREE.Color(paintColor);
      const paintMaterial = new THREE.MeshStandardMaterial({ color });
      group.userData.profile = [
        player.name,
        player.classroom,
        player.color,
        player.camouflageColor || '',
        player.camouflagePose || 'stand',
        player.role || 'student',
      ].join('_');
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 1.15, 0.48),
        paintMaterial,
      );
      body.position.y = 1.15;
      const head = new THREE.Mesh(
        new THREE.BoxGeometry(0.62, 0.62, 0.62),
        partyMap ? paintMaterial : new THREE.MeshStandardMaterial({ color: 0xf4c7a1 }),
      );
      head.position.y = 2.05;
      const legGeometry = new THREE.BoxGeometry(0.27, 0.82, 0.4);
      const legMaterial = partyMap ? paintMaterial : new THREE.MeshStandardMaterial({ color: 0x263449 });
      const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
      leftLeg.position.set(-0.18, 0.42, 0);
      const rightLeg = leftLeg.clone();
      rightLeg.position.x = 0.18;
      const hair = new THREE.Mesh(
        new THREE.BoxGeometry(0.66, 0.17, 0.66),
        partyMap ? paintMaterial : new THREE.MeshStandardMaterial({ color: 0x382519 }),
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
      const leftArm = new THREE.Mesh(armGeometry, paintMaterial);
      leftArm.position.set(-0.54, 1.15, 0);
      const rightArm = leftArm.clone();
      rightArm.position.x = 0.54;
      const avatarMeshes = [body, head, leftLeg, rightLeg, hair, leftArm, rightArm];
      avatarMeshes.forEach((part) => {
        part.castShadow = true;
        part.userData = { kind: 'avatar', playerId: player.id };
      });
      const nameSprite = createNameSprite(
        partyMap ? `${player.name} · ${player.classroom}` : player.name,
        player.role === 'teacher',
      );
      group.add(
        body, head, leftLeg, rightLeg, hair, leftEye, rightEye, smile, leftArm, rightArm,
        nameSprite,
      );
      group.userData.parts = { leftArm, rightArm, leftLeg, rightLeg };
      group.userData.paintMeshes = partyMap ? avatarMeshes : [body, leftArm, rightArm];
      group.userData.nameSprite = nameSprite;
      group.userData.playerId = player.id;
      group.userData.motion = player.motion || 'idle';
      group.userData.targetPosition = new THREE.Vector3(player.x, player.y || 0, player.z);
      setAvatarAppearance(group, paintColor, player.camouflagePose || 'stand');
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
      camouflageColor: camouflageColorRef.current,
      camouflagePose: camouflagePoseRef.current,
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
        const profile = [
          player.name,
          player.classroom,
          player.color,
          player.camouflageColor || '',
          player.camouflagePose || 'stand',
          player.role || 'student',
        ].join('_');
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
        ...camouflageSurfaces,
        ...boardMeshes,
        ...gameMeshes,
        ...portalMeshes,
        ...blockMeshes.values(),
        ...avatarTargets,
      ];
      return raycaster.intersectObjects(targets, false)[0];
    };

    applyCamouflageRef.current = (nextColor, nextPose) => {
      setAvatarAppearance(localAvatar, nextColor, nextPose);
    };

    sampleColorRef.current = () => {
      const round = roomStateRef.current?.camouflageRound;
      const canSample = partyMap
        && round
        && round.participantIds.includes(playerId)
        && round.seekerId !== playerId
        && Date.now() < round.hideEndsAt;
      if (!canSample) {
        setStatus('ฝ่ายซ่อนดูดสีได้เฉพาะช่วงเตรียมตัว');
        return;
      }
      const hit = getHit();
      if (!hit || hit.distance > 18 || hit.object.userData.kind === 'avatar') {
        setStatus('เล็งพื้นผิวใกล้ ๆ แล้วลองดูดสีอีกครั้ง');
        return;
      }
      const mesh = hit.object as THREE.Mesh;
      const material = mesh.material as THREE.MeshStandardMaterial;
      const sampled = hit.object.userData.sampleColor
        || (material.color ? `#${material.color.getHexString()}` : '');
      if (!sampled) return;
      setCamouflageColor(sampled);
      setStatus(`ดูดสี ${sampled.toUpperCase()} สำเร็จ`);
    };

    findPlayerRef.current = () => {
      const round = roomStateRef.current?.camouflageRound;
      const now = Date.now();
      if (!partyMap || !round || round.seekerId !== playerId || now < round.hideEndsAt || now >= round.roundEndsAt) {
        setStatus('ใช้ปุ่มค้นหาได้เมื่อคุณเป็นฝ่ายหาและเริ่มช่วงค้นหาแล้ว');
        return;
      }
      const hit = getHit();
      const targetId = hit?.object.userData.playerId as string | undefined;
      if (!hit || hit.distance > 18 || hit.object.userData.kind !== 'avatar' || !targetId) {
        setStatus('ยังไม่พบผู้เล่นในเป้าเล็ง');
        return;
      }
      if (!round.participantIds.includes(targetId) || targetId === round.seekerId) return;
      if (round.foundPlayerIds.includes(targetId)) {
        setStatus('พบผู้เล่นคนนี้แล้ว');
        return;
      }
      const nextRound: CamouflageRound = {
        ...round,
        foundPlayerIds: [...round.foundPlayerIds, targetId],
      };
      void updateVirtualRoomState(
        roomId,
        roomClassroom,
        { camouflageRound: nextRound },
        playerId,
      );
      setStatus('พบผู้เล่นแล้ว');
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

    lockRef.current = () => renderer.domElement.requestPointerLock();
    jumpRef.current = () => {
      if (!canParticipateRef.current) return;
      if (!isTeacher && roomStateRef.current?.movementLocked) {
        setStatus('ครูพักการเดินชั่วคราว');
        return;
      }
      if (!grounded) return;
      grounded = false;
      verticalVelocity = 8.2;
      setStatus('กระโดด!');
    };
    summonRef.current = () => {
      const state = roomStateRef.current;
      playerPosition.set(state?.summonX || 0, 1.7, state?.summonZ || 10);
      verticalVelocity = 0;
      yaw = Math.PI;
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
      if (event.code === 'KeyF' && partyMap) sampleColorRef.current();
      if (event.code === 'KeyT' && partyMap) findPlayerRef.current();
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
        renderer.domElement.requestPointerLock();
        return;
      }
      if (event.button === 0) {
        const hit = getHit();
        const kind = hit?.object.userData.kind;
        if (kind === 'avatar' && partyMap) findPlayerRef.current();
        else if (kind === 'portal') { if (document.pointerLockElement) document.exitPointerLock(); setGamesPanelOpen(true); }
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
      const previousX = playerPosition.x;
      const previousZ = playerPosition.z;
      playerPosition.addScaledVector(forward, forwardAmount * speed * delta);
      playerPosition.addScaledVector(right, sideAmount * speed * delta);
      if (partyMap && camouflageColliders.some((box) => (
        playerPosition.x >= box.min.x
        && playerPosition.x <= box.max.x
        && playerPosition.z >= box.min.z
        && playerPosition.z <= box.max.z
      ))) {
        playerPosition.x = previousX;
        playerPosition.z = previousZ;
      }
      verticalVelocity -= 20 * delta;
      playerPosition.y += verticalVelocity * delta;
      // ยืนบนพื้น (0) หรือบนบล็อกที่วางไว้ในช่องนี้ — Minecraft: กระโดดขึ้นไปเหยียบบล็อกได้
      const feetCellX = Math.floor(playerPosition.x) + 0.5;
      const feetCellZ = Math.floor(playerPosition.z) + 0.5;
      const feetY = playerPosition.y - 1.7;
      let floorTop = 0;
      blockData.forEach((b) => {
        if (b.x !== feetCellX || b.z !== feetCellZ) return;
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
      playerPosition.x = THREE.MathUtils.clamp(playerPosition.x, -PLAYER_BOUNDARY, PLAYER_BOUNDARY);
      playerPosition.z = THREE.MathUtils.clamp(playerPosition.z, -PLAYER_BOUNDARY, PLAYER_BOUNDARY);
      const isMoving = Math.abs(forwardAmount) + Math.abs(sideAmount) > 0;
      localAvatar.visible = thirdPersonRef.current;
      localAvatar.position.set(playerPosition.x, playerPosition.y - 1.7, playerPosition.z);
      localAvatar.rotation.y = yaw;
      animateAvatar(localAvatar, isMoving, !grounded, now, keys.has('ShiftLeft') ? 1.35 : 1);
      remoteAvatars.forEach((avatar, remoteId) => {
        const target = avatar.userData.targetPosition as THREE.Vector3;
        const distance = target ? avatar.position.distanceTo(target) : 0;
        if (target) avatar.position.lerp(target, Math.min(1, delta * 9));
        const remoteMoving = avatar.userData.motion === 'walk' || distance > 0.035;
        animateAvatar(avatar, remoteMoving, avatar.userData.motion === 'jump', now, 0.9);
        const activeRound = roomStateRef.current?.camouflageRound;
        const nameSprite = avatar.userData.nameSprite as THREE.Sprite;
        if (nameSprite) {
          const hiding = Boolean(
            partyMap
            && activeRound
            && Date.now() >= activeRound.hideEndsAt
            && Date.now() < activeRound.roundEndsAt
            && activeRound.participantIds.includes(remoteId)
            && activeRound.seekerId !== remoteId
            && !activeRound.foundPlayerIds.includes(remoteId)
          );
          nameSprite.visible = !hiding;
        }
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

      collectibles.forEach((star, index) => {
        star.rotation.y += delta * 1.8;
        star.rotation.x += delta * 0.7;
        if (!star.visible) return;
        const horizontal = Math.hypot(playerPosition.x - star.position.x, playerPosition.z - star.position.z);
        const vertical = Math.abs((playerPosition.y - 0.8) - star.position.y);
        if (horizontal > 1.1 || vertical > 1) return;
        star.visible = false;
        star.userData.collected = true;
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
          camouflageColor: camouflageColorRef.current,
          camouflagePose: camouflagePoseRef.current,
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
      sampleColorRef.current = () => undefined;
      findPlayerRef.current = () => undefined;
      applyCamouflageRef.current = () => undefined;
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
      camouflageGeometries.forEach((geometry) => geometry.dispose());
      camouflageMaterials.forEach((material) => material.dispose());
      Object.values(blockMaterials).forEach((item) => item.dispose());
      pixelTextures.forEach((texture) => texture.dispose());
      mount.removeChild(renderer.domElement);
    };
  }, [activeClassroom, avatarColor, boards, displayName, gameStations, graphicsQuality, isTeacher, openLessonBoard, partyMap, playerId, recordActivity, roomClassroom, roomId]);

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

      <div className="world-room-label">
        {partyMap ? (
          <strong><Paintbrush size={17} /> สนามพรางสีรวมทุกชั้น</strong>
        ) : isTeacher ? (
          <label className="world-room-picker">
            <Crown size={16} />
            <select value={teacherRoom} onChange={(event) => setTeacherRoom(event.target.value)} aria-label="เลือกห้องเรียนที่ครูจะเข้าร่วม">
              {CLASSROOMS.map((room) => <option key={room} value={room}>ห้อง {room}</option>)}
            </select>
          </label>
        ) : <strong>ห้อง {activeClassroom} 3D</strong>}
        <span><Users size={15} /> {Math.max(1, onlinePlayers.length)}</span>
        <Link
          className="world-map-switch"
          to={partyMap ? '/world' : '/world?map=camouflage'}
          title={partyMap ? 'กลับห้องเรียนประจำชั้น' : 'เข้าสนามพรางสีรวมทุกชั้น'}
        >
          {partyMap ? <BookOpen size={15} /> : <Paintbrush size={15} />}
          {partyMap ? 'ห้องเรียน' : 'พรางสี'}
        </Link>
      </div>

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

      {partyMap && (
        <>
          {!partyPanelOpen && (
            <button className="world-party-toggle" onClick={() => { setAvatarPanelOpen(false); setPartyPanelOpen(true); }}>
              <Paintbrush size={19} />
              <span>พรางสีซ่อนหา</span>
              {camouflagePhase !== 'idle' && <b>{camouflageRemaining}s</b>}
            </button>
          )}
          {partyPanelOpen && (
            <aside className="world-party-panel">
              <button className="world-panel-close" onClick={() => setPartyPanelOpen(false)} aria-label="ปิดแผงเกมพรางสี">
                <X size={18} />
              </button>
              <header>
                <Paintbrush size={21} />
                <div>
                  <h2>พรางสีซ่อนหา</h2>
                  <small>สนามรวมทุกชั้น • 2-10 คน</small>
                </div>
              </header>

              <div className={`world-party-phase phase-${camouflagePhase}`}>
                <Timer size={18} />
                <span>
                  {camouflagePhase === 'idle' && 'รอเริ่มรอบ'}
                  {camouflagePhase === 'hide' && `เตรียมพรางตัว ${camouflageRemaining} วินาที`}
                  {camouflagePhase === 'seek' && `ฝ่ายหากำลังค้นหา ${camouflageRemaining} วินาที`}
                  {camouflagePhase === 'result' && 'จบรอบแล้ว'}
                </span>
              </div>

              {camouflageRound && (
                <div className={`world-party-role role-${camouflageRole}`}>
                  <strong>
                    {camouflageRole === 'seeker' && 'คุณคือฝ่ายหา'}
                    {camouflageRole === 'hider' && (camouflageFound ? 'คุณถูกพบแล้ว' : 'คุณคือฝ่ายซ่อน')}
                    {camouflageRole === 'spectator' && 'คุณกำลังชมรอบนี้'}
                  </strong>
                  <small>
                    พบแล้ว {camouflageRound.foundPlayerIds.length}/{Math.max(0, camouflageRound.participantIds.length - 1)} คน
                  </small>
                </div>
              )}

              {camouflagePhase === 'idle' && (
                <div className="world-party-start">
                  <p>ฝ่ายซ่อนดูดสีจากฉาก ทาสีตัวละคร และเลือกท่าให้กลมกลืน ก่อนฝ่ายหาเริ่มค้นหา</p>
                  {isTeacher ? (
                    <button onClick={startCamouflageRound} disabled={activePartyPlayers.length < 2}>
                      <Play size={17} /> เริ่มเกม ({activePartyPlayers.length}/10)
                    </button>
                  ) : <small>รอครูเริ่มเกมเมื่อมีผู้เล่นอย่างน้อย 2 คน</small>}
                </div>
              )}

              {camouflageRole === 'hider' && camouflagePhase === 'hide' && (
                <section className="world-camouflage-tools">
                  <div className="world-tool-heading">
                    <strong><Paintbrush size={16} /> สีพรางตัว</strong>
                    <button onClick={() => sampleColorRef.current()} title="ดูดสีจากพื้นผิวที่เล็ง">
                      <Pipette size={16} /> ดูดสี
                    </button>
                  </div>
                  <div className="world-camouflage-colors" aria-label="เลือกสีพรางตัว">
                    {CAMOUFLAGE_COLORS.map((color) => (
                      <button
                        key={color}
                        className={camouflageColor === color ? 'active' : ''}
                        style={{ '--paint': color } as React.CSSProperties}
                        onClick={() => setCamouflageColor(color)}
                        aria-label={`ใช้สี ${color}`}
                      />
                    ))}
                  </div>
                  <strong className="world-pose-label">ท่าพราง</strong>
                  <div className="world-pose-control" role="group" aria-label="เลือกท่าพราง">
                    {([
                      ['stand', 'ยืน'],
                      ['crouch', 'ย่อตัว'],
                      ['freeze', 'ตรึงท่า'],
                    ] as Array<[CamouflagePose, string]>).map(([pose, label]) => (
                      <button
                        key={pose}
                        className={camouflagePose === pose ? 'active' : ''}
                        onClick={() => setCamouflagePose(pose)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {camouflageRole === 'seeker' && camouflagePhase === 'seek' && (
                <button className="world-find-player" onClick={() => findPlayerRef.current()}>
                  <Eye size={18} /> ตรวจผู้เล่นในเป้า
                </button>
              )}

              {camouflagePhase === 'result' && camouflageRound && (
                <div className="world-party-result">
                  <strong>
                    {camouflageRound.foundPlayerIds.length >= camouflageRound.participantIds.length - 1
                      ? 'ฝ่ายหาพบทุกคน'
                      : `ฝ่ายซ่อนรอด ${camouflageRound.participantIds.length - 1 - camouflageRound.foundPlayerIds.length} คน`}
                  </strong>
                  {isTeacher && <button onClick={startCamouflageRound}><Play size={16} /> เล่นรอบใหม่</button>}
                </div>
              )}

              {isTeacher && camouflageRound && camouflagePhase !== 'result' && (
                <button className="world-stop-party" onClick={stopCamouflageRound}>จบรอบทันที</button>
              )}
            </aside>
          )}
        </>
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
        {partyMap && camouflageRole === 'hider' && camouflagePhase === 'hide' && (
          <button onClick={() => sampleColorRef.current()} title="ดูดสีจากพื้นผิว (F)" aria-label="ดูดสีจากพื้นผิว">
            <Pipette size={20} />
          </button>
        )}
        {partyMap && camouflageRole === 'seeker' && camouflagePhase === 'seek' && (
          <button onClick={() => findPlayerRef.current()} title="ตรวจผู้เล่นในเป้า (T)" aria-label="ตรวจผู้เล่นในเป้า">
            <Eye size={20} />
          </button>
        )}
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
    </div>
  );
};

export default VirtualClassroom;
