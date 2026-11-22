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
  Star,
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
  addWorldBlocksBatch,
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
  updateWorldBlock,
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
  id: 'electronics-101',
  title: 'ห้องแล็บอิเล็กทรอนิกส์ 3D',
  skill: 'ออกแบบวงจรและแก้ปัญหา',
  path: '/games/electronics-101',
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

const MATERIALS: Array<{ id: BlockMaterial; color: string; label: string; icon?: string; hint?: string }> = [
  { id: 'grass', color: '#65a30d', label: 'หญ้า' },
  { id: 'brick', color: '#dc5f45', label: 'อิฐ' },
  { id: 'wood', color: '#a16207', label: 'ไม้' },
  { id: 'glass', color: '#7dd3fc', label: 'กระจก' },
  { id: 'gold', color: '#facc15', label: 'ทอง' },
  { id: 'stone', color: '#94a3b8', label: 'หิน' },
  { id: 'sand', color: '#e0c896', label: 'ทราย' },
  { id: 'ice', color: '#a5d8f0', label: 'น้ำแข็ง' },
  { id: 'ruby', color: '#e11d48', label: 'อัญมณี' },
  { id: 'jumppad', color: '#10b981', label: 'สปริงเด้งสูง', icon: '🚀', hint: 'เหยียบแล้วกระโดดสูง 2 เท่า ใช้สร้างด่าน Parkour' },
  { id: 'speedpad', color: '#06b6d4', label: 'บล็อกเร่งสปีด', icon: '⚡', hint: 'เหยียบแล้ววิ่งเร็วพิเศษ 2 วินาที' },
  { id: 'lamp', color: '#fde047', label: 'ไฟนีออนลอจิก', icon: '💡', hint: 'สว่างเรืองแสง เชื่อมกับสวิตช์ 0/1 ในระยะ 6 ช่อง' },
  { id: 'switch', color: '#f97316', label: 'สวิตช์ 0/1', icon: '🎛️', hint: 'กดปุ่มโต้ตอบ (E) เพื่อสลับเปิด/ปิดไฟนีออนรอบข้าง' },
  { id: 'sign', color: '#8b5cf6', label: 'ป้ายชื่อผลงาน', icon: '🪧', hint: 'วางป้ายลอย 3D ตั้งชื่อผลงานหรือจุดเส้นชัย 🏁' },
];

// ภารกิจสร้าง — เปลี่ยน "การวางบล็อก" ให้เป็น "การเรียนรู้" (มีเป้าหมาย ตรวจได้ ได้ดาว+คะแนน P)
interface BuildStats {
  count: number;
  maxHeight: number;
  materials: number;
  ruby: number;
  logicCount: number;
  parkourCount: number;
  signCount: number;
}
interface BuildMission {
  id: string; icon: string; title: string; concept: string; goal: string; stars: number;
  check: (s: BuildStats) => boolean; progress: (s: BuildStats) => string;
}
const BUILD_MISSIONS: BuildMission[] = [
  { id: 'wall10', icon: '🧱', title: 'กำแพงเริ่มต้น', concept: 'นับปริมาณและวางแผนใช้ทรัพยากร', goal: 'วางบล็อกรวม 10 ก้อน', stars: 2, check: (s) => s.count >= 10, progress: (s) => `วางแล้ว ${s.count}/10 ก้อน` },
  { id: 'palette5', icon: '🌈', title: 'จานสีข้อมูล', concept: 'คอมพิวเตอร์เก็บภาพเป็นข้อมูลสี', goal: 'ใช้บล็อกให้ครบ 5 สีต่างกัน', stars: 2, check: (s) => s.materials >= 5, progress: (s) => `ใช้แล้ว ${s.materials}/5 สี` },
  { id: 'tower8', icon: '🔢', title: 'หอคอย 8 บิต', concept: 'เลขฐานสอง 1 ไบต์ = 8 บิต', goal: 'สร้างหอสูง 8 ชั้น', stars: 3, check: (s) => s.maxHeight >= 8, progress: (s) => `สูง ${s.maxHeight}/8 ชั้น` },
  { id: 'gems5', icon: '💎', title: 'ล่าอัญมณี', concept: 'เงื่อนไข: เลือกเฉพาะบล็อกอัญมณี', goal: 'วางบล็อกอัญมณี 5 ก้อน', stars: 3, check: (s) => s.ruby >= 5, progress: (s) => `อัญมณี ${s.ruby}/5 ก้อน` },
  { id: 'circuit01', icon: '💡', title: 'วงจรไฟลอจิก 0/1', concept: 'สวิตช์ควบคุมสถานะบูลีน 1 (เปิด) และ 0 (ปิด)', goal: 'วางสวิตช์ 0/1 และไฟนีออนรวม 2 ชิ้น', stars: 3, check: (s) => s.logicCount >= 2, progress: (s) => `บล็อกไฟ/สวิตช์ ${s.logicCount}/2 ชิ้น` },
  { id: 'parkour1', icon: '🚀', title: 'นักออกแบบด่าน Parkour', concept: 'ออกแบบลำดับขั้นและจุดหมายให้เพื่อนร่วมชั้นทดลองเล่น', goal: 'วางสปริงหรือสปีด 2 ชิ้น และป้ายผลงาน 1 ป้าย', stars: 4, check: (s) => s.parkourCount >= 2 && s.signCount >= 1, progress: (s) => `สปริง/สปีด ${s.parkourCount}/2 · ป้าย ${s.signCount}/1` },
];

type TechZoneId = 'zero_to_one' | 'matrix_cube' | 'how_computer_works' | 'wireless_5g' | 'green_studio';

interface TechZoneInfo {
  id: TechZoneId;
  icon: string;
  shortTitle: string;
  title: string;
  subtitle: string;
  accent: string;
  x: number;
  z: number;
  lookX: number;
  lookZ: number;
}

const TECH_ZONES: TechZoneInfo[] = [
  {
    id: 'zero_to_one',
    icon: '0️⃣',
    shortTitle: 'Zero to One 0/1',
    title: 'DIGITAL PLAYGROUND · FROM ZERO TO ONE',
    subtitle: '0 และ 1 สร้างความเป็นไปได้ไม่สิ้นสุด · แท่นโฮโลแกรม BINARY & ไทม์ไลน์คอมพิวเตอร์ 1936–ปัจจุบัน',
    accent: '#06b6d4',
    x: 0,
    z: 13.2,
    lookX: 0,
    lookZ: 17.5,
  },
  {
    id: 'matrix_cube',
    icon: '🟢',
    shortTitle: 'ห้องเมทริกซ์ 0/1',
    title: 'Matrix Binary Room & อุโมงค์ไฟอินฟินิตี้ LED',
    subtitle: 'เบื้องหลังภาพ เสียง AI และโลก Metaverse ล้วนเกิดจากสายธารข้อมูลรหัสฐานสอง 0 และ 1',
    accent: '#10b981',
    x: -15.2,
    z: -1,
    lookX: -19.5,
    lookZ: -1,
  },
  {
    id: 'how_computer_works',
    icon: '🧠',
    shortTitle: 'คอมทำงานอย่างไร',
    title: 'HOW COMPUTER WORKS? · คอมพิวเตอร์กับร่างกายมนุษย์',
    subtitle: 'เปรียบเทียบอุปกรณ์คอมพิวเตอร์กับอวัยวะในร่างกาย และระบบ Input → Memory/CPU → Output',
    accent: '#f59e0b',
    x: 15.2,
    z: -1,
    lookX: 19.5,
    lookZ: -1,
  },
  {
    id: 'wireless_5g',
    icon: '📡',
    shortTitle: 'ไร้สาย 1G–5G',
    title: 'Evolution of Wireless Networks · วิวัฒนาการ 1G สู่ 5G',
    subtitle: 'จากมือถืออนาล็อกยุค 1980s สู่เครือข่ายอัจฉริยะ 5G ความเร็วสูงเชื่อมต่อ IoT และ Smart City',
    accent: '#8b5cf6',
    x: -15.2,
    z: 12.5,
    lookX: -19.5,
    lookZ: 12.5,
  },
  {
    id: 'green_studio',
    icon: '🎬',
    shortTitle: 'สตูดิโอ Green Screen',
    title: 'KruJames Studio · สตูดิโอถ่ายทอดสด & ฉาก Green Screen',
    subtitle: 'เรียนรู้เทคนิค Chroma Key ตัดพื้นหลังสีเขียวเปลี่ยนเป็นฉากโลกอนาคต อวกาศ และห้องข่าวดิจิทัล',
    accent: '#16a34a',
    x: 15.2,
    z: 12.5,
    lookX: 19.5,
    lookZ: 12.5,
  },
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

const createSignSprite = (label: string, ownerName?: string) => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;
  const isFinish = label.includes('เส้นชัย') || label.includes('🏁');
  ctx.fillStyle = isFinish ? 'rgba(180, 83, 9, 0.94)' : 'rgba(88, 28, 135, 0.92)';
  ctx.fillRect(8, 12, 496, 136);
  ctx.strokeStyle = isFinish ? '#fde047' : '#d8b4fe';
  ctx.lineWidth = 6;
  ctx.strokeRect(11, 15, 490, 130);
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 36px Sarabun, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label.slice(0, 26), 256, ownerName ? 62 : 80);
  if (ownerName) {
    ctx.fillStyle = '#fde047';
    ctx.font = '600 24px Sarabun, sans-serif';
    ctx.fillText(`โดย ${ownerName}`.slice(0, 30), 256, 112);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
  sprite.scale.set(2.8, 0.88, 1);
  sprite.position.set(0, 1.18, 0);
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
  const teleportToPlayerRef = useRef<(target: WorldPlayer) => void>(() => undefined);
  const lastPresentationVersionRef = useRef(0);
  const lastGameVersionRef = useRef(0);
  const lastSummonVersionRef = useRef(0);
  const placeRef = useRef<() => void>(() => undefined);
  const removeRef = useRef<() => void>(() => undefined);
  const interactRef = useRef<() => void>(() => undefined);
  const lockRef = useRef<() => void>(() => undefined);
  const jumpRef = useRef<() => void>(() => undefined);
  const flyingRef = useRef(false);
  const applyWorldTimeRef = useRef<(t: 'day' | 'sunset' | 'night') => void>(() => undefined);
  const runCodeBuilderRef = useRef<(kind: string, stepsCount: number) => void>(() => undefined);
  const [isFlying, setIsFlying] = useState(false);
  const [worldTime, setWorldTime] = useState<'day' | 'sunset' | 'night'>('day');
  const [codeBuilderOpen, setCodeBuilderOpen] = useState(false);
  const [codeBuilderTab, setCodeBuilderTab] = useState<'algo' | 'blueprint'>('algo');
  const [algoSteps, setAlgoSteps] = useState(5);
  const [activeTechZone, setActiveTechZone] = useState<TechZoneInfo | null>(null);
  const [binaryBits, setBinaryBits] = useState<[number, number, number, number]>([0, 1, 0, 1]);
  const [selectedOrganIdx, setSelectedOrganIdx] = useState(0);
  const [selectedGenG, setSelectedGenG] = useState<'1G' | '2G' | '3G' | '4G' | '5G'>('5G');
  const [studioBackdropIdx, setStudioBackdropIdx] = useState(0);
  const teleportToTechZoneRef = useRef<(zone: TechZoneInfo, openModal?: boolean) => void>(() => undefined);
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
  const [buildStats, setBuildStats] = useState<BuildStats>({
    count: 0,
    maxHeight: 0,
    materials: 0,
    ruby: 0,
    logicCount: 0,
    parkourCount: 0,
    signCount: 0,
  });
  const [editingSignBlock, setEditingSignBlock] = useState<WorldBlock | null>(null);
  const [signDraftText, setSignDraftText] = useState('');
  const [buildMissionIdx, setBuildMissionIdx] = useState(() => {
    const v = parseInt(localStorage.getItem('kj_world_build_mission') || '0', 10);
    return Number.isFinite(v) ? Math.min(Math.max(v, 0), BUILD_MISSIONS.length) : 0;
  });
  const [customSlides, setCustomSlides] = useState<Record<number, RichSlide[]>>({});
  const [status, setStatus] = useState('');
  // จอเล็กเริ่มแบบย่อ จะได้ไม่บังฉากครึ่งจอ
  const [buildMissionOpen, setBuildMissionOpen] = useState(() => !window.matchMedia('(max-width: 720px)').matches);
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
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.domElement.setAttribute('aria-label', 'ห้องเรียนออนไลน์สามมิติ');
    mount.appendChild(renderer.domElement);

    const hemiLight = new THREE.HemisphereLight(0xdff4ff, 0x4d6b3c, 2.1);
    scene.add(hemiLight);
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
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      pixelTextures.push(texture);
      return texture;
    };
    const makeRepeatedPixelTexture = (
      hex: number,
      variance: number,
      repeatX: number,
      repeatY: number,
    ) => {
      const texture = makePixelTexture(hex, variance);
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(repeatX, repeatY);
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
      texture.colorSpace = THREE.SRGBColorSpace;
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

    // ทางเดินพิกเซลจากจุดเกิดเข้าสู่ห้องเรียน ช่วยบอกทิศทางโดยไม่ต้องเพิ่มแผง UI
    const entryPath = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.08, 28),
      new THREE.MeshStandardMaterial({
        map: makeRepeatedPixelTexture(0xb6a279, 30, 2, 14),
        roughness: 0.96,
      }),
    );
    entryPath.position.set(0, 0.025, 20.5);
    entryPath.receiveShadow = true;
    scene.add(entryPath);

    // พื้นไม้โอ๊กแบบแผ่น (พิกเซล) — แต่ละแผ่นสีต่างกันเล็กน้อย มีร่องระหว่างแผ่น
    const makePlankTexture = () => {
      const w = 64, h = 64, plankH = 8;
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      for (let row = 0; row < h / plankH; row += 1) {
        const offset = (row % 2) * 24;
        for (let seg = -1; seg < 3; seg += 1) {
          const x0 = seg * 32 + offset;
          const shade = 0.9 + (Math.abs(row * 7 + seg * 13) % 5) * 0.03;
          const r = (0xd8 * shade) | 0, g = (0xa8 * shade) | 0, b = (0x6c * shade) | 0;
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fillRect(x0, row * plankH, 32, plankH);
          for (let i = 0; i < 18; i += 1) {
            const d = ((Math.random() - 0.5) * 26) | 0;
            ctx.fillStyle = `rgba(${r + d}, ${g + d}, ${b + d}, 0.6)`;
            ctx.fillRect(x0 + ((Math.random() * 32) | 0), row * plankH + ((Math.random() * plankH) | 0), 2, 1);
          }
          ctx.fillStyle = 'rgba(92, 58, 26, 0.55)';
          ctx.fillRect(x0, row * plankH, 1, plankH);
        }
        ctx.fillStyle = 'rgba(92, 58, 26, 0.6)';
        ctx.fillRect(0, row * plankH + plankH - 1, w, 1);
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(5, 4.25);
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      pixelTextures.push(texture);
      return texture;
    };
    const classroomFloor = new THREE.Mesh(
      new THREE.BoxGeometry(20, 0.25, 17),
      new THREE.MeshStandardMaterial({
        map: makePlankTexture(),
        roughness: 0.82,
      }),
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

    const wallMaterial = new THREE.MeshStandardMaterial({
      map: makeRepeatedPixelTexture(0xf1ece0, 14, 12, 4),
      roughness: 0.95,
    });
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

    // แถบผนังล่างสีเหลือง (ธีมเว็บ) + บัวไม้ บนด้านในของผนังทั้ง 3 ด้าน
    const wainscotMaterial = new THREE.MeshStandardMaterial({ map: makePixelTexture(0xf4c542, 16), roughness: 0.85 });
    const trimMaterial = new THREE.MeshStandardMaterial({ map: makePixelTexture(0x8a5a2e, 14), roughness: 0.8 });
    const wallTrim = new THREE.Group();
    const addTrim = (x: number, z: number, w: number, d: number) => {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(w, 1.1, d), wainscotMaterial);
      panel.position.set(x, 0.75, z);
      panel.receiveShadow = true;
      const rail = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, d + 0.06), trimMaterial);
      rail.position.set(x, 1.32, z);
      const base = new THREE.Mesh(new THREE.BoxGeometry(w, 0.22, d + 0.06), trimMaterial);
      base.position.set(x, 0.32, z);
      wallTrim.add(panel, rail, base);
    };
    addTrim(0, -8.2, 19.6, 0.06);
    addTrim(-9.8, 0, 0.06, 16.6);
    addTrim(9.8, 0, 0.06, 16.6);
    scene.add(wallTrim);

    // ภูมิประเทศแบบว็อกเซลรอบพื้นที่เล่น ใช้ InstancedMesh เพื่อลด draw call
    const terrainGeometry = new THREE.BoxGeometry(1, 1, 1);
    const dirtMaterial = new THREE.MeshStandardMaterial({
      map: makePixelTexture(0x8b5a2b, 28),
      roughness: 1,
    });
    const grassMaterial = new THREE.MeshStandardMaterial({
      map: makePixelTexture(0x5d9f35, 26),
      roughness: 1,
    });
    const hillCenters = [[-28, -24], [28, -23], [-30, 23], [30, 24]] as const;
    const hillRadius = graphicsQuality === 'low' ? 4 : 7;
    const dirtPositions: THREE.Vector3[] = [];
    const grassPositions: THREE.Vector3[] = [];
    hillCenters.forEach(([centerX, centerZ], hillIndex) => {
      for (let dx = -hillRadius; dx <= hillRadius; dx += 1) {
        for (let dz = -hillRadius; dz <= hillRadius; dz += 1) {
          const distance = Math.hypot(dx, dz);
          if (distance > hillRadius) continue;
          const ripple = ((Math.abs(dx * 13 + dz * 7 + hillIndex * 3) % 3) - 1) * 0.35;
          const height = Math.max(1, Math.floor((hillRadius - distance) / 1.9 + 1 + ripple));
          for (let level = 0; level < height - 1; level += 1) {
            dirtPositions.push(new THREE.Vector3(centerX + dx + 0.5, level + 0.5, centerZ + dz + 0.5));
          }
          grassPositions.push(new THREE.Vector3(centerX + dx + 0.5, height - 0.5, centerZ + dz + 0.5));
        }
      }
      staticColliders.push({
        minX: centerX - hillRadius,
        maxX: centerX + hillRadius + 1,
        minZ: centerZ - hillRadius,
        maxZ: centerZ + hillRadius + 1,
        minY: 0,
        maxY: hillRadius,
      });
    });
    const dummy = new THREE.Object3D();
    const addTerrainInstances = (positions: THREE.Vector3[], material: THREE.Material) => {
      const mesh = new THREE.InstancedMesh(terrainGeometry, material, positions.length);
      positions.forEach((position, index) => {
        dummy.position.copy(position);
        dummy.updateMatrix();
        mesh.setMatrixAt(index, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      mesh.castShadow = graphicsQuality === 'high';
      mesh.receiveShadow = true;
      scene.add(mesh);
      return mesh;
    };
    addTerrainInstances(dirtPositions, dirtMaterial);
    addTerrainInstances(grassPositions, grassMaterial);

    // ดวงอาทิตย์และเมฆทรงบล็อก ให้บรรยากาศเป็นโลกว็อกเซลโดยใช้เรขาคณิตเบา ๆ
    const skyDecor = new THREE.Group();
    const cubeSun = new THREE.Mesh(
      new THREE.BoxGeometry(4.5, 4.5, 1),
      new THREE.MeshBasicMaterial({ color: 0xffee77, fog: false }),
    );
    cubeSun.position.set(-28, 27, -42);
    skyDecor.add(cubeSun);
    const cloudMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });
    [[-18, 18, -28], [20, 22, -35], [6, 16, 32]].forEach(([x, y, z], cloudIndex) => {
      const cloud = new THREE.Group();
      [[0, 0, 0, 5], [3, 0, 0, 4], [-3, 0, 0, 3], [0, 1.2, 0, 3]].forEach(([cx, cy, cz, width]) => {
        const part = new THREE.Mesh(new THREE.BoxGeometry(width, 1.5, 2.2), cloudMaterial);
        part.position.set(cx, cy, cz);
        cloud.add(part);
      });
      cloud.position.set(x, y, z + cloudIndex * 2);
      skyDecor.add(cloud);
    });
    scene.add(skyDecor);

    applyWorldTimeRef.current = (timeMode: 'day' | 'sunset' | 'night') => {
      if (timeMode === 'night') {
        scene.background = new THREE.Color(0x0f172a);
        scene.fog = new THREE.Fog(0x0f172a, 24, graphicsQuality === 'low' ? 50 : 68);
        hemiLight.color.setHex(0x38bdf8);
        hemiLight.groundColor.setHex(0x1e293b);
        hemiLight.intensity = 0.85;
        sun.color.setHex(0x93c5fd);
        sun.intensity = 0.75;
        (cubeSun.material as THREE.MeshBasicMaterial).color.setHex(0xe2e8f0);
      } else if (timeMode === 'sunset') {
        scene.background = new THREE.Color(0xfd9869);
        scene.fog = new THREE.Fog(0xfd9869, 24, graphicsQuality === 'low' ? 50 : 68);
        hemiLight.color.setHex(0xfef08a);
        hemiLight.groundColor.setHex(0x5c4033);
        hemiLight.intensity = 1.6;
        sun.color.setHex(0xfb923c);
        sun.intensity = 1.85;
        (cubeSun.material as THREE.MeshBasicMaterial).color.setHex(0xf97316);
      } else {
        scene.background = new THREE.Color(0x9bd9ff);
        scene.fog = new THREE.Fog(0x9bd9ff, 24, graphicsQuality === 'low' ? 48 : 65);
        hemiLight.color.setHex(0xdff4ff);
        hemiLight.groundColor.setHex(0x4d6b3c);
        hemiLight.intensity = 2.1;
        sun.color.setHex(0xffffff);
        sun.intensity = 2.2;
        (cubeSun.material as THREE.MeshBasicMaterial).color.setHex(0xffee77);
      }
    };

    // ป้ายแลนด์มาร์กหน้าอาคารเรียน "KRUJAMES CRAFT · ห้องเรียนวิทยาการคำนวณ 3D" + เสาธงโรงเรียนพิกเซล
    const makeSchoolBannerTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 192;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 1024, 192);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 10;
      ctx.strokeRect(8, 8, 1008, 176);
      ctx.fillStyle = '#facc15';
      ctx.font = '800 50px Sarabun, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚡ KRUJAMES CRAFT · ห้องเรียนวิทยาการคำนวณ 3D', 512, 74);
      ctx.fillStyle = '#7dd3fc';
      ctx.font = '700 32px Sarabun, sans-serif';
      ctx.fillText('สร้างสรรค์บล็อก · วงจรลอจิก 0/1 · โค้ดดิ้งอัลกอริทึม · เรียนรู้ร่วมกับเพื่อน', 512, 138);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      pixelTextures.push(texture);
      return texture;
    };
    const bannerTex = makeSchoolBannerTexture();
    const schoolBanner = new THREE.Mesh(
      new THREE.BoxGeometry(13.5, 1.9, 0.28),
      new THREE.MeshStandardMaterial({
        map: bannerTex,
        emissive: new THREE.Color(0x1e293b),
        emissiveIntensity: 0.45,
        roughness: 0.4,
      }),
    );
    schoolBanner.position.set(0, 6.25, 8.2);
    scene.add(schoolBanner);

    // เสาธงชาติไทยพิกเซลหน้าลานกิจกรรม
    const flagGroup = new THREE.Group();
    const poleMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 7.2, 0.24),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.6, roughness: 0.3 }),
    );
    poleMesh.position.set(0, 3.6, 0);
    const poleBase = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.45, 1.4),
      new THREE.MeshStandardMaterial({ map: makePixelTexture(0x94a3b8, 18), roughness: 0.9 }),
    );
    poleBase.position.set(0, 0.225, 0);
    flagGroup.add(poleMesh, poleBase);
    const flagStripes: Array<[number, number, number]> = [
      [0xdc2626, 0.2, 6.85],
      [0xffffff, 0.2, 6.65],
      [0x1d4ed8, 0.4, 6.35],
      [0xffffff, 0.2, 6.05],
      [0xdc2626, 0.2, 5.85],
    ];
    flagStripes.forEach(([hex, h, yPos]) => {
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(1.85, h, 0.1),
        new THREE.MeshStandardMaterial({ color: hex, roughness: 0.7 }),
      );
      stripe.position.set(1.02, yPos, 0);
      flagGroup.add(stripe);
    });
    flagGroup.position.set(-11.5, 0, 13.5);
    scene.add(flagGroup);

    // =========================================================================
    // 🌐 5 โซนโลกเทคโนโลยีสารสนเทศ 3D (DIGITAL PLAYGROUND: FROM ZERO TO ONE)
    // =========================================================================
    const techExhibitMeshes: THREE.Object3D[] = [];
    const techAnimatedObjects: Array<(now: number, delta: number) => void> = [];

    const makeExhibitPosterTexture = (
      bgTop: string,
      bgBottom: string,
      borderHex: string,
      badgeText: string,
      headline: string,
      subHeadline: string,
      lines: string[],
    ) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 640;
      const ctx = canvas.getContext('2d')!;
      const grad = ctx.createLinearGradient(0, 0, 0, 640);
      grad.addColorStop(0, bgTop);
      grad.addColorStop(1, bgBottom);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 640);
      ctx.strokeStyle = borderHex;
      ctx.lineWidth = 12;
      ctx.strokeRect(10, 10, 1004, 620);
      ctx.fillStyle = borderHex;
      ctx.fillRect(42, 38, 420, 54);
      ctx.fillStyle = '#0f172a';
      ctx.font = '800 28px Sarabun, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, 60, 65);
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 54px Sarabun, sans-serif';
      ctx.fillText(headline, 44, 148);
      ctx.fillStyle = borderHex;
      ctx.font = '700 32px Sarabun, sans-serif';
      ctx.fillText(subHeadline, 44, 208);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '600 28px Sarabun, sans-serif';
      lines.forEach((line, idx) => {
        ctx.fillText(line, 52, 280 + idx * 54);
      });
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(42, 546, 940, 56);
      ctx.fillStyle = '#fde047';
      ctx.font = '800 26px Sarabun, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✨ คลิกซ้าย หรือกดปุ่ม [E / ✋] เพื่อเปิดห้องทดลองอินเทอร์แอกทีฟ (+2⭐)', 512, 575);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      pixelTextures.push(texture);
      return texture;
    };

    const tagExhibitGroup = (root: THREE.Object3D, zone: TechZoneInfo) => {
      root.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.userData = { kind: 'tech_exhibit', techZone: zone };
          techExhibitMeshes.push(child);
        }
      });
    };

    // เส้นลายวงจรดิจิทัลเรืองแสงเชื่อมลานกลางไปสู่ทั้ง 5 โซนเทคโนโลยี
    const circuitTraceMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    [
      [0, 12.5, 0.45, 7],
      [-9.5, 12.5, 16, 0.35],
      [9.5, 12.5, 16, 0.35],
      [-14.5, 5.5, 0.35, 14],
      [14.5, 5.5, 0.35, 14],
    ].forEach(([cx, cz, cw, cd]) => {
      const trace = new THREE.Mesh(new THREE.BoxGeometry(cw, 0.05, cd), circuitTraceMat);
      trace.position.set(cx, 0.03, cz);
      scene.add(trace);
    });

    // --- ZONE 1: DIGITAL PLAYGROUND · FROM ZERO TO ONE (x = 0, z = 16.5) ---
    const zone1Info = TECH_ZONES[0];
    const zone1Group = new THREE.Group();
    const neonZeroMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: new THREE.Color(0xe11d48),
      emissiveIntensity: 0.9,
      roughness: 0.2,
    });
    const neonOneMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: new THREE.Color(0x0284c7),
      emissiveIntensity: 0.9,
      roughness: 0.2,
    });
    // เลข 0 นีออนสีชมพู-แดง
    const zeroGroup = new THREE.Group();
    [
      [-0.75, 2.2, 0.42, 3.2],
      [0.75, 2.2, 0.42, 3.2],
      [0, 3.6, 1.92, 0.42],
      [0, 0.8, 1.92, 0.42],
    ].forEach(([zx, zy, zw, zh]) => {
      const seg = new THREE.Mesh(new THREE.BoxGeometry(zw, zh, 0.45), neonZeroMat);
      seg.position.set(zx, zy, 0);
      zeroGroup.add(seg);
    });
    zeroGroup.position.set(-2.5, 0, 18.2);
    // เลข 1 นีออนสีฟ้าไซเบอร์
    const oneGroup = new THREE.Group();
    const oneStem = new THREE.Mesh(new THREE.BoxGeometry(0.48, 3.2, 0.45), neonOneMat);
    oneStem.position.set(0, 2.2, 0);
    const oneTop = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.42, 0.45), neonOneMat);
    oneTop.position.set(-0.25, 3.58, 0);
    const oneBase = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.42, 0.45), neonOneMat);
    oneBase.position.set(0, 0.8, 0);
    oneGroup.add(oneStem, oneTop, oneBase);
    oneGroup.position.set(2.5, 0, 18.2);

    // ป้ายซุ้มโค้ง FROM ZERO TO ONE + แท่นโฮโลแกรมวงกลม BINARY
    const zeroOnePoster = new THREE.Mesh(
      new THREE.BoxGeometry(7.6, 1.6, 0.25),
      new THREE.MeshStandardMaterial({
        map: makeExhibitPosterTexture(
          '#090d16',
          '#1e1b4b',
          '#38bdf8',
          'NSM · DIGITAL PLAYGROUND',
          'FROM ZERO TO ONE (0 และ 1)',
          'เบื้องหลังการทำงานของโลกดิจิทัล คือ “รหัสฐานสอง”',
          [
            '• 0 (ปิด) และ 1 (เปิด) สร้างข้อความ ภาพ เสียง AI และ Metaverse',
            '• 1936 Turing Machine → 1946 ENIAC → 1947 Transistor',
            '• 1958 Integrated Circuit (IC) → 1971 Microprocessor → 1980 PC',
          ],
        ),
        emissive: new THREE.Color(0x0ea5e9),
        emissiveIntensity: 0.25,
      }),
    );
    zeroOnePoster.position.set(0, 4.75, 18.2);

    const holoBase = new THREE.Mesh(
      new THREE.CylinderGeometry(1.55, 1.7, 0.88, 24),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.5, roughness: 0.35 }),
    );
    holoBase.position.set(0, 0.44, 15.2);
    const makeHoloDiscTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 512;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, 512, 512);
      const rings: Array<[number, string]> = [
        [240, '#a3e635'],
        [195, '#38bdf8'],
        [145, '#0ea5e9'],
        [95, '#f43f5e'],
      ];
      rings.forEach(([r, col]) => {
        ctx.beginPath();
        ctx.arc(256, 256, r, 0, Math.PI * 2);
        ctx.strokeStyle = col;
        ctx.lineWidth = 16;
        ctx.stroke();
      });
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 46px Sarabun, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('BINARY 0/1', 256, 225);
      ctx.fillStyle = '#a3e635';
      ctx.font = '700 28px Sarabun, sans-serif';
      ctx.fillText('คลิกทดลองถอดรหัส', 256, 282);
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      pixelTextures.push(tex);
      return tex;
    };
    const holoDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(1.48, 1.48, 0.08, 24),
      new THREE.MeshStandardMaterial({
        map: makeHoloDiscTexture(),
        emissive: new THREE.Color(0x22d3ee),
        emissiveIntensity: 0.65,
      }),
    );
    holoDisc.position.set(0, 0.92, 15.2);
    zone1Group.add(zeroGroup, oneGroup, zeroOnePoster, holoBase, holoDisc);
    tagExhibitGroup(zone1Group, zone1Info);
    scene.add(zone1Group);
    techAnimatedObjects.push((now, delta) => {
      holoDisc.rotation.y += delta * 0.95;
      zeroGroup.position.y = Math.sin(now * 0.0022) * 0.12;
      oneGroup.position.y = Math.cos(now * 0.0022) * 0.12;
    });

    // --- ZONE 2: MATRIX BINARY 0/1 ROOM & INFINITY LED CUBE (x = -19.5, z = -1) ---
    const zone2Info = TECH_ZONES[1];
    const zone2Group = new THREE.Group();
    const makeMatrixWallTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#02120a';
      ctx.fillRect(0, 0, 512, 512);
      ctx.font = '800 22px monospace';
      for (let col = 0; col < 16; col += 1) {
        for (let row = 0; row < 18; row += 1) {
          const bit = (col * 7 + row * 13) % 2 === 0 ? '1' : '0';
          ctx.fillStyle = (row + col) % 4 === 0 ? '#86efac' : '#16a34a';
          ctx.fillText(bit, 16 + col * 31, 24 + row * 28);
        }
      }
      ctx.fillStyle = 'rgba(2, 18, 10, 0.72)';
      ctx.fillRect(36, 175, 440, 155);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 5;
      ctx.strokeRect(36, 175, 440, 155);
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 42px Sarabun, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('DIGITAL PLAYGROUND', 256, 232);
      ctx.fillStyle = '#4ade80';
      ctx.font = '700 26px Sarabun, sans-serif';
      ctx.fillText('ห้องเมทริกซ์ 0/1 & อุโมงค์ไฟอินฟินิตี้', 256, 286);
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      pixelTextures.push(tex);
      return tex;
    };
    const matrixTex = makeMatrixWallTexture();
    const matrixWallMat = new THREE.MeshStandardMaterial({
      map: matrixTex,
      emissive: new THREE.Color(0x16a34a),
      emissiveIntensity: 0.55,
      roughness: 0.3,
    });
    const matrixFloor = new THREE.Mesh(
      new THREE.BoxGeometry(6.2, 0.16, 6.2),
      new THREE.MeshStandardMaterial({ color: 0x052e16, metalness: 0.65, roughness: 0.2 }),
    );
    matrixFloor.position.set(0, 0.08, 0);
    const matrixBack = new THREE.Mesh(new THREE.BoxGeometry(0.25, 4.2, 6.2), matrixWallMat);
    matrixBack.position.set(-3, 2.1, 0);
    const matrixLeft = new THREE.Mesh(new THREE.BoxGeometry(6.2, 4.2, 0.25), matrixWallMat);
    matrixLeft.position.set(0, 2.1, -3);
    const matrixRight = new THREE.Mesh(new THREE.BoxGeometry(6.2, 4.2, 0.25), matrixWallMat);
    matrixRight.position.set(0, 2.1, 3);
    const ledPillars: THREE.Mesh[] = [];
    const ledPillarMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: new THREE.Color(0x38bdf8),
      emissiveIntensity: 0.95,
    });
    [[-1.6, -1.6], [-1.6, 1.6], [1.2, -1.6], [1.2, 1.6]].forEach(([px, pz]) => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.9, 0.22), ledPillarMat);
      pillar.position.set(px, 2.0, pz);
      ledPillars.push(pillar);
      zone2Group.add(pillar);
    });
    zone2Group.add(matrixFloor, matrixBack, matrixLeft, matrixRight);
    zone2Group.position.set(-19.5, 0, -1);
    tagExhibitGroup(zone2Group, zone2Info);
    scene.add(zone2Group);

    // --- ZONE 3: HOW COMPUTER WORKS? & น้องชิปสีส้มสวมหมวก (x = 19.5, z = -1) ---
    const zone3Info = TECH_ZONES[2];
    const zone3Group = new THREE.Group();
    const hcwWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 4.3, 6.8),
      new THREE.MeshStandardMaterial({
        map: makeExhibitPosterTexture(
          '#d97706',
          '#b45309',
          '#fef08a',
          'HOW COMPUTER WORKS?',
          'คอมพิวเตอร์ทำงานอย่างไร?',
          'เปรียบเทียบส่วนประกอบคอมพิวเตอร์กับอวัยวะในร่างกายของเรา',
          [
            '• 🧠 สมอง = ซีพียู (CPU) & แรม (RAM) ประมวลผลและจดจำข้อมูล',
            '• 👁️ ดวงตา = กล้อง/สแกนเนอร์  |  👂 หู = ไมโครโฟน  |  👄 ปาก = ลำโพง',
            '• 🖐️ มือ = คีย์บอร์ด & เมาส์   |  🩸 เส้นเลือด = สายไฟ & บัสข้อมูล',
            '• 4 ยุคคอมพิวเตอร์: หลอดสุญญากาศ → ทรานซิสเตอร์ → IC → ไมโครโพรเซสเซอร์',
          ],
        ),
        roughness: 0.5,
      }),
    );
    hcwWall.position.set(2.2, 2.2, 0);
    // มาสคอต "น้องชิปสีส้มสวมหมวก" 3D (จากภาพนิทรรศการ)
    const chipMascot = new THREE.Group();
    const chipBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.35, 1.15, 0.45),
      new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.45 }),
    );
    chipBody.position.set(0, 1.35, 0);
    const chipHatBrim = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.12, 0.52),
      new THREE.MeshStandardMaterial({ color: 0x172033 }),
    );
    chipHatBrim.position.set(0, 1.98, 0);
    const chipHatTop = new THREE.Mesh(
      new THREE.BoxGeometry(0.54, 0.42, 0.46),
      new THREE.MeshStandardMaterial({ color: 0x172033 }),
    );
    chipHatTop.position.set(0, 2.24, 0);
    const eyeGlassMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const leftGlass = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.48), eyeGlassMat);
    leftGlass.position.set(-0.24, 1.45, 0);
    const rightGlass = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.48), eyeGlassMat);
    rightGlass.position.set(0.24, 1.45, 0);
    chipMascot.add(chipBody, chipHatBrim, chipHatTop, leftGlass, rightGlass);
    chipMascot.rotation.y = -Math.PI / 2;
    chipMascot.position.set(0.5, 0, -2.2);
    zone3Group.add(hcwWall, chipMascot);
    zone3Group.position.set(19.5, 0, -1);
    tagExhibitGroup(zone3Group, zone3Info);
    scene.add(zone3Group);
    techAnimatedObjects.push((now) => {
      chipMascot.position.y = Math.abs(Math.sin(now * 0.003)) * 0.18;
    });

    // --- ZONE 4: วิวัฒนาการเครือข่ายไร้สาย 1G → 2G → 3G → 4G → 5G (x = -19.5, z = 12.5) ---
    const zone4Info = TECH_ZONES[3];
    const zone4Group = new THREE.Group();
    const wirelessWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 4.1, 6.6),
      new THREE.MeshStandardMaterial({
        map: makeExhibitPosterTexture(
          '#3b0764',
          '#065f46',
          '#c084fc',
          'EVOLUTION OF WIRELESS NETWORKS',
          'วิวัฒนาการเครือข่ายไร้สาย 1G → 5G',
          'จากยุคเสียงอนาล็อก 1980s สู่ยุค 5G IoT & Smart City',
          [
            '• 1G (1980s): โทรศัพท์มือถืออนาล็อกรุ่นกระติกน้ำ โทรคุยเสียงอย่างเดียว',
            '• 2G (1990s): สัญญาณดิจิทัล ส่งข้อความ SMS   |   3G (2000s): อินเทอร์เน็ตมือถือ',
            '• 4G (2010s): วิดีโอสตรีมมิง HD ความเร็วสูง   |   5G (2020s+): เชื่อมต่อ IoT & AI',
          ],
        ),
        roughness: 0.45,
      }),
    );
    wirelessWall.position.set(-2.2, 2.1, 0);
    // โมเดลมือถือ 1G สีม่วงยุค 1980s บนแท่นจัดแสดง + เสาอากาศ 5G
    const phonePedestal = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 1.0, 1.1),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc }),
    );
    phonePedestal.position.set(-0.6, 0.5, -1.6);
    const brickPhone1G = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.85, 0.42),
      new THREE.MeshStandardMaterial({ color: 0x6d28d9, roughness: 0.4 }),
    );
    brickPhone1G.position.set(-0.6, 1.42, -1.6);
    const tower5G = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.35, 5.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.6, roughness: 0.3 }),
    );
    tower5G.position.set(-0.6, 2.6, 2.1);
    const signalRing = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.18, 1.2),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee }),
    );
    signalRing.position.set(-0.6, 4.9, 2.1);
    zone4Group.add(wirelessWall, phonePedestal, brickPhone1G, tower5G, signalRing);
    zone4Group.position.set(-19.5, 0, 12.5);
    tagExhibitGroup(zone4Group, zone4Info);
    scene.add(zone4Group);
    techAnimatedObjects.push((now, delta) => {
      signalRing.rotation.y += delta * 2.2;
      const pulse = 1 + Math.sin(now * 0.004) * 0.35;
      signalRing.scale.set(pulse, 1, pulse);
    });

    // --- ZONE 5: KRUJAMES STUDIO · สตูดิโอถ่ายทอดสด & เวที GREEN SCREEN (x = 19.5, z = 12.5) ---
    const zone5Info = TECH_ZONES[4];
    const zone5Group = new THREE.Group();
    const chromaGreenMat = new THREE.MeshStandardMaterial({
      color: 0x16a34a,
      emissive: new THREE.Color(0x15803d),
      emissiveIntensity: 0.25,
      roughness: 0.6,
    });
    const studioStage = new THREE.Mesh(new THREE.CylinderGeometry(3.1, 3.2, 0.26, 24), chromaGreenMat);
    studioStage.position.set(1.2, 0.13, 0);
    const greenBackdrop = new THREE.Mesh(new THREE.BoxGeometry(0.28, 3.9, 5.6), chromaGreenMat);
    greenBackdrop.position.set(3.4, 2.0, 0);
    // โต๊ะเรียนไม้บนเวที Green Screen (เหมือนภาพที่ 8 ใน NSM Studio!)
    const studioDesk = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.82, 1.4),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 }),
    );
    studioDesk.position.set(1.3, 0.65, 0);
    // กล้องถ่ายทอดสดโทรทัศน์บนขาตั้ง (NSM / KruJames Studio Camera)
    const camGroup = new THREE.Group();
    const tripod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.55, 1.45, 6),
      new THREE.MeshStandardMaterial({ color: 0x0f172a }),
    );
    tripod.position.set(0, 0.72, 0);
    const camBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.55, 0.52),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5 }),
    );
    camBody.position.set(0, 1.62, 0);
    const camMonitor = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.45, 0.45),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: new THREE.Color(0x0284c7),
        emissiveIntensity: 0.75,
      }),
    );
    camMonitor.position.set(-0.1, 2.15, 0);
    camGroup.add(tripod, camBody, camMonitor);
    camGroup.position.set(-1.6, 0, 0);
    zone5Group.add(studioStage, greenBackdrop, studioDesk, camGroup);
    zone5Group.position.set(19.5, 0, 12.5);
    tagExhibitGroup(zone5Group, zone5Info);
    scene.add(zone5Group);

    // โครงหลังคาไม้แบบเปิดโล่ง (skylight) — คานหลัก + คานขวาง สีไม้อุ่นแทนสีเข้มเกือบดำ
    const roofBeams = new THREE.Group();
    const beamMaterial = new THREE.MeshStandardMaterial({
      map: makePixelTexture(0xa0703c, 16),
      roughness: 0.85,
      emissive: new THREE.Color(0x3a2410),
      emissiveIntensity: 0.35,
    });
    [-7.5, -2.5, 2.5, 7.5].forEach((x) => {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.36, 17), beamMaterial);
      beam.position.set(x, 5.55, 0);
      roofBeams.add(beam);
    });
    [-8.1, -4, 0, 4, 8.1].forEach((z) => {
      const tie = new THREE.Mesh(new THREE.BoxGeometry(20, 0.24, 0.26), beamMaterial);
      tie.position.set(0, 5.62, z);
      roofBeams.add(tie);
    });
    // โคมไฟห้อยใต้คาน + แสงอุ่นเติมในห้อง (ไม่ใช้ shadow เพื่อประหยัด)
    if (graphicsQuality !== 'low') {
      const lampMaterial = new THREE.MeshBasicMaterial({ color: 0xfff1c2 });
      [-5, 5].forEach((x) => {
        [-4, 2.5].forEach((z) => {
          const lamp = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.5), lampMaterial);
          lamp.position.set(x, 5.3, z);
          roofBeams.add(lamp);
        });
      });
      const roomFill = new THREE.PointLight(0xffe2a8, 18, 22, 1.6);
      roomFill.position.set(0, 4.8, -1);
      scene.add(roomFill);
    }
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
    const portalFrameMaterial = new THREE.MeshStandardMaterial({
      map: makePixelTexture(0x24123d, 16),
      roughness: 0.78,
      metalness: 0.18,
    });
    const portalBase = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.55, 3.8), portalFrameMaterial);
    portalBase.position.set(-9.25, 0.28, 0);
    portalBase.castShadow = true;
    portalBase.userData = { kind: 'portal' };
    const portalFrame = new THREE.Group();
    [
      [0, 2.1, -1.55, 0.75, 3.7, 0.75],
      [0, 2.1, 1.55, 0.75, 3.7, 0.75],
      [0, 4.05, 0, 0.75, 0.75, 3.85],
    ].forEach(([x, y, z, w, h, d]) => {
      const part = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), portalFrameMaterial);
      part.position.set(x, y, z);
      part.castShadow = true;
      part.userData = { kind: 'portal' };
      portalFrame.add(part);
      portalMeshes.push(part);
    });
    portalFrame.position.x = -9.25;
    const portalScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(2.65, 2.9),
      new THREE.MeshStandardMaterial({ map: makePortalTexture(), emissive: 0x6d28d9, emissiveIntensity: 0.45, transparent: true, opacity: 0.94, side: THREE.DoubleSide }),
    );
    portalScreen.position.set(-8.84, 2.25, 0);
    portalScreen.rotation.y = Math.PI / 2;
    portalScreen.userData = { kind: 'portal' };
    scene.add(portalBase, portalFrame, portalScreen);
    portalMeshes.push(portalBase, portalScreen);
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
        new THREE.MeshStandardMaterial({ map: makePixelTexture(0x8b5a2b, 24), roughness: 1 }),
      );
      trunk.position.y = 1.4;
      trunk.castShadow = true;
      const leafMaterial = new THREE.MeshStandardMaterial({
        map: makePixelTexture(0x2f8f46, 30),
        roughness: 1,
      });
      const crowns = [
        [0, 3.65, 0, 3.4, 1.7, 3.4],
        [0, 4.9, 0, 2.5, 1.3, 2.5],
        [0.9, 4.1, 0, 1.7, 1.7, 1.7],
        [-0.9, 4.1, 0, 1.7, 1.7, 1.7],
      ].map(([cx, cy, cz, w, h, d]) => {
        const crown = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), leafMaterial);
        crown.position.set(cx, cy, cz);
        crown.castShadow = true;
        return crown;
      });
      tree.add(trunk, ...crowns);
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

    const makeMagicBlockTexture = (
      bgHex: string,
      borderHex: string,
      symbol: string,
      subText?: string,
    ) => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 64;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = bgHex;
      ctx.fillRect(0, 0, 64, 64);
      ctx.strokeStyle = borderHex;
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, 58, 58);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '800 26px "Segoe UI Emoji", Sarabun, sans-serif';
      ctx.fillText(symbol, 32, subText ? 25 : 33);
      if (subText) {
        ctx.fillStyle = borderHex;
        ctx.font = '800 13px Sarabun, sans-serif';
        ctx.fillText(subText, 32, 48);
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      pixelTextures.push(texture);
      return texture;
    };

    const blockGeometry = new THREE.BoxGeometry(1, 1, 1);
    const lampOffMaterial = new THREE.MeshStandardMaterial({
      map: makeMagicBlockTexture('#334155', '#94a3b8', '💡', 'OFF 0'),
      roughness: 0.7,
    });
    const switchOffMaterial = new THREE.MeshStandardMaterial({
      map: makeMagicBlockTexture('#7f1d1d', '#f87171', '🎛️', 'OFF 0'),
      emissive: new THREE.Color(0xef4444),
      emissiveIntensity: 0.22,
      roughness: 0.55,
    });
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
      jumppad: new THREE.MeshStandardMaterial({
        map: makeMagicBlockTexture('#059669', '#6ee7b7', '🚀', 'JUMP'),
        emissive: new THREE.Color(0x10b981),
        emissiveIntensity: 0.28,
        roughness: 0.45,
      }),
      speedpad: new THREE.MeshStandardMaterial({
        map: makeMagicBlockTexture('#0891b2', '#67e8f9', '⚡', 'SPEED'),
        emissive: new THREE.Color(0x06b6d4),
        emissiveIntensity: 0.32,
        roughness: 0.4,
      }),
      lamp: new THREE.MeshStandardMaterial({
        map: makeMagicBlockTexture('#ca8a04', '#fef08a', '💡', 'ON 1'),
        emissive: new THREE.Color(0xfacc15),
        emissiveIntensity: 0.82,
        roughness: 0.25,
      }),
      switch: new THREE.MeshStandardMaterial({
        map: makeMagicBlockTexture('#15803d', '#86efac', '🎛️', 'ON 1'),
        emissive: new THREE.Color(0x22c55e),
        emissiveIntensity: 0.42,
        roughness: 0.45,
      }),
      sign: new THREE.MeshStandardMaterial({
        map: makeMagicBlockTexture('#6d28d9', '#fde047', '🪧', 'SIGN'),
        emissive: new THREE.Color(0x7c3aed),
        emissiveIntensity: 0.24,
        roughness: 0.5,
      }),
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
      let logicCount = 0;
      let parkourCount = 0;
      let signCount = 0;
      mine.forEach((b) => {
        const key = `${b.x},${b.z}`;
        columns.set(key, Math.max(columns.get(key) || 0, b.y + 0.5));
        mats.add(b.material);
        if (b.material === 'ruby') ruby += 1;
        if (b.material === 'lamp' || b.material === 'switch') logicCount += 1;
        if (b.material === 'jumppad' || b.material === 'speedpad') parkourCount += 1;
        if (b.material === 'sign') signCount += 1;
      });
      let maxHeight = 0;
      columns.forEach((h) => { if (h > maxHeight) maxHeight = h; });
      setBuildStats({
        count: mine.length,
        maxHeight: Math.round(maxHeight),
        materials: mats.size,
        ruby,
        logicCount,
        parkourCount,
        signCount,
      });

      const switches = blocks.filter((b) => b.material === 'switch');
      const isLampPowered = (lamp: WorldBlock): boolean => {
        const nearbySwitches = switches.filter(
          (sw) => Math.hypot(sw.x - lamp.x, sw.y - lamp.y, sw.z - lamp.z) <= 6.5,
        );
        if (nearbySwitches.length === 0) return true;
        return nearbySwitches.some((sw) => sw.powered !== false);
      };

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
        const targetMaterial = block.material === 'lamp'
          ? (isLampPowered(block) ? blockMaterials.lamp : lampOffMaterial)
          : block.material === 'switch'
            ? (block.powered !== false ? blockMaterials.switch : switchOffMaterial)
            : (blockMaterials[block.material] || blockMaterials.grass);
        if (!mesh) {
          mesh = new THREE.Mesh(blockGeometry, targetMaterial);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.userData = { kind: 'block', blockId: block.id };
          blockMeshes.set(block.id, mesh);
          scene.add(mesh);
        } else if (mesh.material !== targetMaterial) {
          mesh.material = targetMaterial;
        }
        mesh.position.set(block.x, block.y, block.z);
        if (block.material === 'sign') {
          const signText = block.label || `⭐ ผลงานของ ${block.ownerName || 'นักเรียน'}`;
          const signKey = `${signText}__${block.ownerName || ''}`;
          if (mesh.userData.signKey !== signKey) {
            if (mesh.userData.signSprite) {
              mesh.remove(mesh.userData.signSprite as THREE.Object3D);
            }
            const sprite = createSignSprite(signText, block.ownerName);
            mesh.add(sprite);
            mesh.userData.signSprite = sprite;
            mesh.userData.signKey = signKey;
          }
        }
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
        ...techExhibitMeshes,
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
      const isSign = materialRef.current === 'sign';
      const isSwitch = materialRef.current === 'switch';
      const block: WorldBlock = {
        id: `${playerId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        x, y, z,
        material: materialRef.current,
        ownerId: playerId,
        ownerName: displayName,
        ...(isSign ? { label: `⭐ ผลงานของ ${displayName}` } : {}),
        ...(isSwitch ? { powered: true } : {}),
        createdAt: Date.now(),
      };
      void addWorldBlock(roomId, block).then((added) => {
        if (!added) {
          setStatus('ช่องนี้มีบล็อกอยู่แล้ว ลองเล็งช่องข้าง ๆ');
          return;
        }
        if (isSign) {
          if (document.pointerLockElement) document.exitPointerLock();
          setEditingSignBlock(block);
          setSignDraftText(block.label || `⭐ ผลงานของ ${displayName}`);
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
      if (hit && hit.object.userData.kind === 'block' && hit.distance <= BUILD_REACH) {
        const targetBlock = blockData.get(hit.object.userData.blockId as string);
        if (targetBlock?.material === 'switch') {
          const nextPowered = !(targetBlock.powered !== false);
          void updateWorldBlock(roomId, targetBlock.id, { powered: nextPowered });
          setStatus(nextPowered ? '🎛️ สวิตช์ ON (1) — เปิดไฟนีออนรอบข้างแล้ว!' : '🎛️ สวิตช์ OFF (0) — ปิดไฟนีออนรอบข้างแล้ว!');
          return;
        }
        if (targetBlock?.material === 'sign') {
          if (targetBlock.ownerId === playerId || isTeacher) {
            if (document.pointerLockElement) document.exitPointerLock();
            setEditingSignBlock(targetBlock);
            setSignDraftText(targetBlock.label || `⭐ ผลงานของ ${targetBlock.ownerName || displayName}`);
          } else {
            setStatus(`🪧 ป้ายของ ${targetBlock.ownerName || 'เพื่อน'}: "${targetBlock.label || 'ผลงานสร้างสรรค์'}"`);
          }
          return;
        }
      }
      if (hit && hit.object.userData.kind === 'tech_exhibit' && hit.distance <= 26) {
        if (document.pointerLockElement) document.exitPointerLock();
        const zone = hit.object.userData.techZone as TechZoneInfo;
        setActiveTechZone(zone);
        const unitNo = boards[0]?.unitNo || 1;
        void recordActivity('slide', `u${unitNo}-techexhibit-${zone.id}`, unitNo, `สำรวจนิทรรศการโลกเทคโนโลยี: ${zone.title}`);
        return;
      }
      if (hit && hit.object.userData.kind === 'portal' && hit.distance <= 24) {
        if (document.pointerLockElement) document.exitPointerLock();
        setGamesPanelOpen(true);
        return;
      }
      if (!hit || hit.distance > 24 || !['board', 'game'].includes(hit.object.userData.kind)) {
        setStatus('หันไปที่สไลด์ สถานีเกม สวิตช์ 0/1 หรือป้ายชื่อผลงานก่อน');
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
      if (flyingRef.current) {
        playerPosition.y = Math.min(BUILD_MAX_HEIGHT + 2, playerPosition.y + 1.35);
        setStatus('🕊️ บินขึ้น (+1 ชั้น)');
        return;
      }
      if (!grounded) return;
      grounded = false;
      verticalVelocity = 8.2;
      setStatus('กระโดด!');
    };

    runCodeBuilderRef.current = (kind: string, stepsCount: number) => {
      if (!canParticipateRef.current) return;
      if (!isTeacher && roomStateRef.current?.buildLocked) {
        setStatus('ครูปิดโหมดสร้างชั่วคราว');
        return;
      }
      const n = Math.max(2, Math.min(10, stepsCount || 5));
      const fX = -Math.sin(yaw);
      const fZ = -Math.cos(yaw);
      const stepDx = Math.abs(fX) >= Math.abs(fZ) ? (fX >= 0 ? 1 : -1) : 0;
      const stepDz = Math.abs(fZ) > Math.abs(fX) ? (fZ >= 0 ? 1 : -1) : 0;
      const rightDx = -stepDz;
      const rightDz = stepDx;
      const anchorX = Math.floor(playerPosition.x + fX * 2.6) + 0.5;
      const anchorZ = Math.floor(playerPosition.z + fZ * 2.6) + 0.5;
      const baseY = Math.max(0.5, Math.floor(playerPosition.y - 1.7) + 0.5);
      const mat = materialRef.current;
      const candidates: WorldBlock[] = [];
      let labelSummary = '';

      const pushBlock = (
        relForward: number,
        relUp: number,
        relRight: number,
        blockMat: BlockMaterial,
        extra?: Partial<Pick<WorldBlock, 'label' | 'powered'>>,
      ) => {
        const bx = anchorX + relForward * stepDx + relRight * rightDx;
        const bz = anchorZ + relForward * stepDz + relRight * rightDz;
        const by = baseY + relUp;
        if (Math.abs(bx) > BUILD_BOUNDARY || Math.abs(bz) > BUILD_BOUNDARY || by > BUILD_MAX_HEIGHT - 0.5) return;
        candidates.push({
          id: `${playerId}_${Date.now()}_${candidates.length}_${Math.random().toString(36).slice(2, 6)}`,
          x: bx,
          y: by,
          z: bz,
          material: blockMat,
          ownerId: playerId,
          ownerName: displayName,
          ...extra,
          createdAt: Date.now(),
        });
      };

      if (kind === 'wall_loop') {
        for (let i = 0; i < n; i += 1) {
          pushBlock(i, 0, 0, mat);
          pushBlock(i, 1, 0, mat);
        }
        labelSummary = `รัน Loop สร้างกำแพง ${n} ช่องสำเร็จ!`;
      } else if (kind === 'stairs_algo') {
        for (let i = 0; i < n; i += 1) {
          pushBlock(i, i, 0, mat);
        }
        labelSummary = `รัน Algorithm สร้างบันได ${n} ขั้นสำเร็จ!`;
      } else if (kind === 'binary_tower') {
        pushBlock(0, 0, -1, 'switch', { powered: true });
        for (let i = 0; i < n; i += 1) {
          pushBlock(0, i, 0, i % 2 === 0 ? mat : 'lamp');
        }
        labelSummary = `รันเงื่อนไข If-Else สร้างหอคอยเลขฐานสอง ${n} ชั้นพร้อมสวิตช์ 0/1!`;
      } else if (kind === 'grid_nested') {
        for (let r = 0; r < 4; r += 1) {
          for (let c = -1; c <= 2; c += 1) {
            pushBlock(r, 0, c, mat);
          }
        }
        labelSummary = 'รัน Nested Loop 2 มิติ สร้างลาน 4×4 สำเร็จ!';
      } else if (kind === 'bp_pc') {
        // โต๊ะ + หน้าจอคอม + เคส CPU + คีย์บอร์ด + ป้าย IPO
        for (let c = -1; c <= 1; c += 1) pushBlock(1, 0, c, 'wood');
        for (let c = -1; c <= 1; c += 1) {
          pushBlock(1, 1, c, 'stone');
          pushBlock(1, 2, c, c === 0 ? 'lamp' : 'glass');
        }
        pushBlock(1, 1, 2, 'gold');
        pushBlock(1, 2, 2, 'switch', { powered: true });
        pushBlock(0, 0, 0, 'sign', { label: '🖥️ คอมพิวเตอร์ (Input→CPU→Output)' });
        labelSummary = 'เสกแม่แบบ "คอมพิวเตอร์ยักษ์ 3D (Input → CPU → Output)" สำเร็จ!';
      } else if (kind === 'bp_smarthome') {
        for (let f = 0; f <= 3; f += 1) {
          for (let r = -1; r <= 2; r += 1) {
            const isEdge = f === 0 || f === 3 || r === -1 || r === 2;
            const isDoor = f === 0 && r === 0;
            if (isEdge && !isDoor) {
              pushBlock(f + 1, 0, r, 'brick');
              pushBlock(f + 1, 1, r, (f === 0 || f === 3) ? 'glass' : 'brick');
            }
            pushBlock(f + 1, 2, r, f === 1 && r === 0 ? 'lamp' : 'wood');
          }
        }
        pushBlock(0, 0, -1, 'switch', { powered: true });
        pushBlock(0, 0, 1, 'sign', { label: `🏠 Smart Home IoT ของ ${displayName}` });
        labelSummary = 'เสกแม่แบบ "บ้านสมาร์ตโฮม IoT + สวิตช์ไฟ 0/1" สำเร็จ!';
      } else if (kind === 'bp_robot') {
        pushBlock(1, 0, -1, 'stone');
        pushBlock(1, 0, 1, 'stone');
        for (let r = -1; r <= 1; r += 1) {
          pushBlock(1, 1, r, r === 0 ? 'switch' : 'gold', r === 0 ? { powered: true } : undefined);
          pushBlock(1, 2, r, 'gold');
        }
        pushBlock(1, 3, -1, 'lamp');
        pushBlock(1, 3, 0, 'stone');
        pushBlock(1, 3, 1, 'lamp');
        pushBlock(0, 0, 0, 'sign', { label: `🤖 หุ่นยนต์ AI ของ ${displayName}` });
        labelSummary = 'เสกแม่แบบ "หุ่นยนต์โค้ดดิ้ง AI" สำเร็จ!';
      } else if (kind === 'bp_parkour') {
        pushBlock(0, 0, 0, 'speedpad');
        pushBlock(1, 0, 0, 'jumppad');
        pushBlock(3, 2, 0, 'gold');
        pushBlock(4, 2, 0, 'jumppad');
        pushBlock(6, 4, 0, 'ruby');
        pushBlock(7, 4, 0, 'sign', { label: '🏁 เส้นชัย Parkour! พิชิตสำเร็จ' });
        labelSummary = 'เสกแม่แบบ "ชุดด่าน Parkour อัลกอริทึม + เส้นชัย 🏁" สำเร็จ!';
      } else if (kind === 'bp_pixelboard') {
        for (let h = 0; h < 5; h += 1) {
          for (let c = -2; c <= 2; c += 1) {
            const isFrame = h === 0 || h === 4 || c === -2 || c === 2;
            pushBlock(1, h, c, isFrame ? 'stone' : mat);
          }
        }
        pushBlock(0, 0, 0, 'sign', { label: `🎨 กระดาน Pixel Art ของ ${displayName}` });
        labelSummary = 'เสกแม่แบบ "กระดานวาดภาพ Pixel Art 5×5" สำเร็จ!';
      }

      void addWorldBlocksBatch(roomId, candidates).then((addedCount) => {
        if (addedCount === 0) {
          setStatus('พื้นที่ด้านหน้ามีบล็อกเต็มหรือติดขอบแผนที่ ลองขยับไปลานโล่ง ๆ นะ');
          return;
        }
        celebrate();
        setCodeBuilderOpen(false);
        setStatus(`🤖 ${labelSummary} (+${addedCount} บล็อก)`);
        const unitNo = boards[0]?.unitNo || 1;
        void recordActivity(
          'artifact',
          `u${unitNo}-codebuilder-${kind}`,
          unitNo,
          `เขียนโค้ดสร้างบล็อก 3D: ${labelSummary}`,
        );
      }).catch((err) => setStatus(err instanceof Error ? err.message : 'รันโค้ดสร้างไม่สำเร็จ'));
    };
    const publishPresence = (force = false, motionState: 'idle' | 'walk' | 'jump' = 'idle') => {
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
        motion: motionState,
        role: isTeacher ? 'teacher' : 'student',
        joinStatus: joinStatusRef.current,
        updatedAt: Date.now(),
      }, force);
    };

    summonRef.current = () => {
      const state = roomStateRef.current;
      playerPosition.set(state?.summonX || 0, 1.7, state?.summonZ || 10);
      verticalVelocity = 0;
      yaw = Math.PI;
      publishPresence(true, 'idle');
    };
    teleportToPlayerRef.current = (target: WorldPlayer) => {
      if (!target || target.id === playerId) return;
      const offsetX = target.x >= 0 ? -1.5 : 1.5;
      const offsetZ = 1.5;
      const destX = THREE.MathUtils.clamp(target.x + offsetX, -PLAYER_BOUNDARY, PLAYER_BOUNDARY);
      const destZ = THREE.MathUtils.clamp(target.z + offsetZ, -PLAYER_BOUNDARY, PLAYER_BOUNDARY);
      const destY = Math.max(1.7, (target.y || 0) + 1.7);
      playerPosition.set(destX, destY, destZ);
      verticalVelocity = 0;
      grounded = true;
      const dx = target.x - destX;
      const dz = target.z - destZ;
      yaw = Math.atan2(-dx, -dz);
      pitch = 0;
      publishPresence(true, 'idle');
      setStatus(`เดินไปหา ${target.role === 'teacher' ? 'ครู ' : ''}${target.name} แล้ว`);
    };
    teleportToTechZoneRef.current = (zone: TechZoneInfo, openModal = false) => {
      if (!zone) return;
      playerPosition.set(zone.x, 1.7, zone.z);
      verticalVelocity = 0;
      grounded = true;
      flyingRef.current = false;
      setIsFlying(false);
      const dx = zone.lookX - zone.x;
      const dz = zone.lookZ - zone.z;
      yaw = Math.atan2(-dx, -dz);
      pitch = 0;
      publishPresence(true, 'idle');
      setStatus(`🏛️ วาร์ปมายังโซน "${zone.shortTitle}" แล้ว — คลิกที่นิทรรศการเพื่อทดลองเล่น!`);
      if (openModal) {
        if (document.pointerLockElement) document.exitPointerLock();
        setActiveTechZone(zone);
      }
    };

    // ส่งสถานะเข้าห้องทันทีที่โหลดฉาก และส่งซ้ำเป็นระยะแม้แท็บอยู่เบื้องหลัง
    publishPresence(true, 'idle');
    const presenceHeartbeatTimer = window.setInterval(() => {
      publishPresence(true, 'idle');
    }, 3_500);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') publishPresence(true, 'idle');
    };
    const onBeforeUnload = () => {
      void removeWorldPlayer(roomId, playerId);
    };

    const onPointerLock = () => setPointerLocked(document.pointerLockElement === renderer.domElement);
    const onMouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement !== renderer.domElement) return;
      yaw -= event.movementX * 0.0022;
      pitch -= event.movementY * 0.0022;
      pitch = Math.max(-1.25, Math.min(1.25, pitch));
    };
    let lastSpaceTapAt = 0;
    const onKeyDown = (event: KeyboardEvent) => {
      keysRef.current.add(event.code);
      if (event.code === 'KeyE') interactRef.current();
      if (event.code === 'KeyQ') placeRef.current();
      if (event.code === 'KeyR') removeRef.current();
      if (event.code === 'KeyF' && canParticipateRef.current) {
        const nextFly = !flyingRef.current;
        flyingRef.current = nextFly;
        setIsFlying(nextFly);
        verticalVelocity = 0;
        setStatus(nextFly ? '🕊️ เปิดโหมดบินสร้าง (กด Space บินขึ้น / Shift บินลง / F หรือ Space 2 ครั้งเพื่อลงพื้น)' : 'เดินบนพื้นปกติ');
      }
      if (event.code.startsWith('Digit')) {
        const slot = Number(event.code.slice(5));
        if (slot >= 1 && slot <= MATERIALS.length) {
          setMaterial(MATERIALS[slot - 1].id);
          if (modeRef.current !== 'build') setMode('build');
        }
      }
      if (event.code === 'Space') {
        event.preventDefault();
        const nowTap = performance.now();
        if (!event.repeat && nowTap - lastSpaceTapAt < 340 && canParticipateRef.current) {
          const nextFly = !flyingRef.current;
          flyingRef.current = nextFly;
          setIsFlying(nextFly);
          verticalVelocity = 0;
          lastSpaceTapAt = 0;
          setStatus(nextFly ? '🕊️ เปิดโหมดบินสร้าง (กด Space ค้างบินขึ้น / Shift บินลง)' : 'ลงสู่พื้นปกติ');
          return;
        }
        lastSpaceTapAt = nowTap;
        if (!flyingRef.current) jumpRef.current();
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
        const targetBlock = kind === 'block' ? blockData.get(hit?.object.userData.blockId as string) : undefined;
        if (kind === 'portal') { if (document.pointerLockElement) document.exitPointerLock(); setGamesPanelOpen(true); }
        else if (kind === 'board' || kind === 'game' || kind === 'tech_exhibit') interactRef.current();
        else if (modeRef.current === 'explore' && (targetBlock?.material === 'switch' || targetBlock?.material === 'sign')) interactRef.current();
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
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onResize);
    renderer.domElement.addEventListener('contextmenu', onContextMenu);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onTouchMove);
    renderer.domElement.addEventListener('pointerup', onTouchEnd);

    let speedBoostUntil = 0;
    let lastPadTriggerAt = 0;
    let lastFinishSignId = '';

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
      const baseSpeed = keys.has('ShiftLeft') ? 8.5 : 5.2;
      const speed = (now < speedBoostUntil ? 1.65 : 1) * baseSpeed;
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

      if (flyingRef.current && movementAllowed) {
        verticalVelocity = 0;
        grounded = false;
        const flyUp = keys.has('Space') ? 1 : 0;
        const flyDown = (keys.has('ShiftLeft') || keys.has('ShiftRight') || keys.has('KeyC')) ? 1 : 0;
        playerPosition.y = THREE.MathUtils.clamp(
          playerPosition.y + (flyUp - flyDown) * 6.8 * delta,
          1.7,
          BUILD_MAX_HEIGHT + 2.5,
        );
      } else {
        verticalVelocity -= 20 * delta;
        playerPosition.y += verticalVelocity * delta;
      }

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
      let standingBlock: WorldBlock | null = null;
      blockData.forEach((b) => {
        if (Math.abs(b.x - playerPosition.x) >= 0.72 || Math.abs(b.z - playerPosition.z) >= 0.72) return;
        const top = b.y + 0.5;
        if (top > floorTop && top <= feetY + 0.35) {
          floorTop = top;
          standingBlock = b;
        }
      });
      // ยืน/กระโดดขึ้นเหยียบผิวโต๊ะ (และแพลตฟอร์มอื่น) ได้
      platforms.forEach((pf) => {
        if (playerPosition.x < pf.minX || playerPosition.x > pf.maxX || playerPosition.z < pf.minZ || playerPosition.z > pf.maxZ) return;
        if (pf.top > floorTop && pf.top <= feetY + 0.35) {
          floorTop = pf.top;
          standingBlock = null;
        }
      });
      const floorCamera = floorTop + 1.7;
      if (playerPosition.y <= floorCamera) {
        const landedBlock = standingBlock as WorldBlock | null;
        if (landedBlock?.material === 'jumppad' && movementAllowed) {
          playerPosition.y = floorCamera;
          verticalVelocity = 14.2;
          grounded = false;
          if (now - lastPadTriggerAt > 800) {
            lastPadTriggerAt = now;
            setStatus('🚀 เด้งสปริงกระโดดสูง!');
          }
        } else {
          playerPosition.y = floorCamera;
          verticalVelocity = 0;
          grounded = true;
          if (landedBlock?.material === 'speedpad' && movementAllowed) {
            speedBoostUntil = now + 2_200;
            if (now - lastPadTriggerAt > 800) {
              lastPadTriggerAt = now;
              setStatus('⚡ เทอร์โบเร่งความเร็ว!');
            }
          } else if (
            landedBlock?.material === 'sign'
            && (landedBlock.label?.includes('เส้นชัย') || landedBlock.label?.includes('🏁'))
          ) {
            if (lastFinishSignId !== landedBlock.id) {
              lastFinishSignId = landedBlock.id;
              celebrate();
              setStatus(`🏁 พิชิตเส้นชัย: ${landedBlock.label}!`);
            }
          } else if (!landedBlock) {
            lastFinishSignId = '';
          }
        }
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
      techAnimatedObjects.forEach((fn) => fn(now, delta));

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
        publishPresence(false, !grounded ? 'jump' : isMoving ? 'walk' : 'idle');
      }

      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(presenceHeartbeatTimer);
      respawnTimers.forEach((timer) => window.clearTimeout(timer));
      unsubscribeBlocks();
      unsubscribePlayers();
      void removeWorldPlayer(roomId, playerId);
      summonRef.current = () => undefined;
      teleportToPlayerRef.current = () => undefined;
      document.removeEventListener('pointerlockchange', onPointerLock);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('contextmenu', onContextMenu);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onTouchMove);
      renderer.domElement.removeEventListener('pointerup', onTouchEnd);
      if (document.pointerLockElement === renderer.domElement) document.exitPointerLock();
      // คืนหน่วยความจำ GPU ของทุก mesh ในฉาก (dispose ซ้ำได้อย่างปลอดภัย)
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose();
        const material = mesh.material;
        if (Array.isArray(material)) material.forEach((item) => item.dispose());
        else material?.dispose();
      });
      renderer.dispose();
      blockGeometry.dispose();
      terrainGeometry.dispose();
      dirtMaterial.dispose();
      grassMaterial.dispose();
      portalFrameMaterial.dispose();
      cloudMaterial.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      lampOffMaterial.dispose();
      switchOffMaterial.dispose();
      Object.values(blockMaterials).forEach((item) => item.dispose());
      pixelTextures.forEach((texture) => texture.dispose());
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
  const otherPlayers = onlinePlayers.filter((player) => player.id !== playerId && player.joinStatus !== 'blocked');

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
          <span
            onClick={() => setAvatarPanelOpen((open) => !open)}
            style={{ cursor: 'pointer' }}
            title="คลิกเพื่อดูรายชื่อเพื่อนในห้อง"
          >
            <Users size={15} /> {Math.max(1, onlinePlayers.length)}
          </span>
          <span className="world-week-chip" title="แผนที่ประจำสัปดาห์นี้ รีเซ็ตอัตโนมัติทุกวันจันทร์">
            <Calendar size={13} /> {weekDisplayLabel}
          </span>
          <button
            type="button"
            onClick={() => {
              const nextTime = worldTime === 'day' ? 'sunset' : worldTime === 'sunset' ? 'night' : 'day';
              setWorldTime(nextTime);
              applyWorldTimeRef.current(nextTime);
              setStatus(
                nextTime === 'night'
                  ? '🌙 โหมดกลางคืนไซเบอร์ — บล็อกไฟนีออนและสวิตช์จะเรืองแสงชัดเจน!'
                  : nextTime === 'sunset'
                    ? '🌅 บรรยากาศยามเย็น'
                    : '☀️ บรรยากาศกลางวันสดใส',
              );
            }}
            title="สลับบรรยากาศ กลางวัน / ยามเย็น / กลางคืนไซเบอร์"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              background: worldTime === 'night' ? '#0f172a' : worldTime === 'sunset' ? '#fff7ed' : '#f8fafc',
              color: worldTime === 'night' ? '#fde047' : worldTime === 'sunset' ? '#c2410c' : '#334155',
              fontSize: '0.75rem',
              fontWeight: 700,
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            {worldTime === 'night' ? '🌙 กลางคืน' : worldTime === 'sunset' ? '🌅 ยามเย็น' : '☀️ กลางวัน'}
          </button>
          {isTeacher && (
            <button
              className="world-remap-btn"
              onClick={() => {
                if (document.pointerLockElement) document.exitPointerLock();
                setConfirmRemapOpen(true);
              }}
              title="ล้างบล็อกทั้งหมดในแผนที่สัปดาห์นี้"
            >
              <RotateCcw size={13} /> <span>รีแมพ</span>
            </button>
          )}
        </div>

        {otherPlayers.length > 0 && (
          <div
            className="world-classmates-bar"
            aria-label="เพื่อนในห้อง (คลิกเพื่อเดินไปหาเพื่อน)"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              flexWrap: 'wrap',
              padding: '5px 10px',
              borderRadius: 999,
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.22)',
              backdropFilter: 'blur(8px)',
              color: '#fff',
              fontSize: '0.78rem',
            }}
          >
            <span style={{ fontWeight: 700, color: '#93c5fd', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Users size={13} /> เพื่อนในห้อง ({otherPlayers.length}):
            </span>
            {otherPlayers.slice(0, 6).map((player) => (
              <button
                key={player.id}
                type="button"
                onClick={() => teleportToPlayerRef.current(player)}
                title={`คลิกเพื่อเดินไปหา ${player.role === 'teacher' ? 'ครู ' : ''}${player.name}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '3px 9px',
                  borderRadius: 999,
                  border: '1px solid rgba(255, 255, 255, 0.22)',
                  background: 'rgba(255, 255, 255, 0.14)',
                  color: '#fff',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                <i style={{ width: 8, height: 8, borderRadius: '50%', background: player.color, display: 'inline-block' }} />
                {player.role === 'teacher' ? 'ครู ' : ''}{player.name}
              </button>
            ))}
            {otherPlayers.length > 6 && (
              <button
                type="button"
                onClick={() => setAvatarPanelOpen(true)}
                style={{
                  padding: '3px 8px',
                  borderRadius: 999,
                  border: 0,
                  background: 'rgba(59, 130, 246, 0.35)',
                  color: '#fff',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                +{otherPlayers.length - 6} คน
              </button>
            )}
          </div>
        )}

        <div
          className="world-techzones-bar"
          aria-label="โซนนิทรรศการโลกเทคโนโลยี (คลิกเพื่อวาร์ปไปชม)"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            flexWrap: 'wrap',
            padding: '4px 9px',
            borderRadius: 999,
            background: 'rgba(15, 23, 42, 0.88)',
            border: '1px solid rgba(56, 189, 248, 0.45)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            fontSize: '0.75rem',
          }}
        >
          <span style={{ fontWeight: 800, color: '#38bdf8' }}>🏛️ โลกเทคโนโลยี:</span>
          {TECH_ZONES.map((zone) => (
            <button
              key={zone.id}
              type="button"
              onClick={() => teleportToTechZoneRef.current(zone, true)}
              title={`วาร์ปไปโซน ${zone.title}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 8px',
                borderRadius: 999,
                border: `1px solid ${zone.accent}`,
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                fontSize: '0.73rem',
                fontWeight: 700,
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              <span>{zone.icon}</span>
              <span>{zone.shortTitle}</span>
            </button>
          ))}
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
          {!isTeacher && (
            <label className="world-follow-toggle">
              <input type="checkbox" checked={followTeacher} onChange={(event) => setFollowTeacher(event.target.checked)} />
              <MonitorPlay size={16} /> ตามสไลด์และเกมของครู
            </label>
          )}
          <h3><Users size={17} /> ผู้เล่นในห้อง ({Math.max(1, onlinePlayers.length)})</h3>
          <div className="world-player-list">
            {onlinePlayers.length > 0 ? onlinePlayers.map((player) => (
              <span
                key={player.id}
                onClick={() => {
                  if (player.id !== playerId) {
                    teleportToPlayerRef.current(player);
                    setAvatarPanelOpen(false);
                  }
                }}
                style={{ cursor: player.id !== playerId ? 'pointer' : 'default' }}
                title={player.id !== playerId ? `คลิกเพื่อเดินไปหา ${player.name}` : 'ตัวละครของคุณ'}
              >
                <i style={{ background: player.color }} />
                {player.role === 'teacher' ? 'ครู ' : ''}{player.name}
                {player.id !== playerId && <small style={{ marginLeft: 'auto', opacity: 0.78 }}>เดินไปหา →</small>}
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

      {mode === 'build' && (
        <div className="world-build-capacity" aria-label={`ใช้บล็อก ${worldBlockCount} จาก ${MAX_WORLD_BLOCKS} ชิ้น`}>
          <BrickWall size={17} />
          <strong>{worldBlockCount.toLocaleString('th-TH')}/{MAX_WORLD_BLOCKS.toLocaleString('th-TH')}</strong>
          <span>
            {MATERIALS.find((m) => m.id === material)?.hint
              ? `${MATERIALS.find((m) => m.id === material)?.icon || ''} ${MATERIALS.find((m) => m.id === material)?.label}: ${MATERIALS.find((m) => m.id === material)?.hint}`
              : `บล็อก${MATERIALS.find((m) => m.id === material)?.label || ''} • ระยะ ${BUILD_REACH} ช่อง • สูง ${BUILD_MAX_HEIGHT} ชั้น`}
          </span>
        </div>
      )}

      {mode === 'build' && currentBuildMission && (
        <section className={`world-build-mission ${buildMissionOpen ? '' : 'is-folded'}`} aria-label="ภารกิจสร้าง">
          <button
            type="button"
            className="world-build-mission-head"
            onClick={() => setBuildMissionOpen((open) => !open)}
            aria-expanded={buildMissionOpen}
            title={buildMissionOpen ? 'ย่อการ์ดภารกิจ' : 'เปิดการ์ดภารกิจ'}
          >
            <span>{currentBuildMission.icon} ภารกิจสร้าง {buildMissionIdx + 1}/{BUILD_MISSIONS.length}</span>
            <small>{buildMissionOpen ? 'ย่อ' : currentBuildMission.progress(buildStats)}</small>
          </button>
          {buildMissionOpen && (
            <>
              <strong>{currentBuildMission.goal}</strong>
              <p>💡 {currentBuildMission.concept}</p>
              <em>{currentBuildMission.progress(buildStats)}</em>
              <button
                type="button"
                className={`world-build-mission-check ${currentBuildMission.check(buildStats) ? 'is-ready' : ''}`}
                onClick={checkBuildMission}
              >
                ✓ ตรวจภารกิจ (+{currentBuildMission.stars}⭐)
              </button>
            </>
          )}
        </section>
      )}
      {mode === 'build' && !currentBuildMission && (
        <div className="world-build-mission is-done">🎉 ทำภารกิจสร้างครบทุกข้อแล้ว! เก่งมาก</div>
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
        <button
          className={codeBuilderOpen ? 'active' : ''}
          onClick={() => {
            if (document.pointerLockElement) document.exitPointerLock();
            setCodeBuilderOpen((open) => !open);
          }}
          title="เขียนโค้ดสั่งบอทสร้างอัลกอริทึม & เสกแม่แบบวิชาคอมพิวเตอร์"
          aria-label="โค้ดสร้าง"
          disabled={!canParticipate || (!isTeacher && roomState.buildLocked)}
        >
          <span aria-hidden="true">🤖</span><span>โค้ดสร้าง</span>
        </button>
      </div>

      <div className="world-materials" aria-label="แถบเลือกบล็อกและบล็อกวิเศษ" style={{ maxWidth: 'calc(100vw - 24px)', overflowX: 'auto' }}>
        {MATERIALS.map((item, index) => (
          <button
            key={item.id}
            className={material === item.id ? 'active' : ''}
            style={{ '--swatch': item.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 42px', width: 42, height: 42 } as React.CSSProperties}
            onClick={() => { setMaterial(item.id); if (mode !== 'build') setMode('build'); }}
            title={item.hint ? `${item.icon || ''} ${item.label} — ${item.hint}` : `${item.label}${index < 9 ? ` (กด ${index + 1})` : ''}`}
            aria-label={item.label}
          >
            {index < 9 && <span className="slot-num">{index + 1}</span>}
            {item.icon && (
              <span
                style={{
                  fontSize: '1.18rem',
                  lineHeight: 1,
                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.65))',
                }}
                aria-hidden="true"
              >
                {item.icon}
              </span>
            )}
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
        <button onClick={() => jumpRef.current()} title="กระโดด (กด Space 2 ครั้งติดกันเพื่อบินสร้างแบบมายคราฟ)" aria-label="กระโดด" disabled={!canParticipate || (!isTeacher && roomState.movementLocked)}>
          <ChevronsUp size={20} />
        </button>
        <button
          onClick={() => {
            const nextFly = !flyingRef.current;
            flyingRef.current = nextFly;
            setIsFlying(nextFly);
            setStatus(nextFly ? '🕊️ เปิดโหมดบินสร้าง (กด Space บินขึ้น / Shift บินลง)' : 'ลงสู่พื้นปกติ');
          }}
          title="โหมดบินสร้างแบบมายคราฟ (กด F หรือกด Space 2 ครั้ง)"
          aria-label="โหมดบินสร้าง"
          className={isFlying ? 'active' : ''}
          disabled={!canParticipate || (!isTeacher && roomState.movementLocked)}
        >
          <span style={{ fontSize: '1.05rem', lineHeight: 1 }} aria-hidden="true">🕊️</span>
        </button>
        <button onClick={() => interactRef.current()} title="โต้ตอบกับสไลด์ สถานีเกม สวิตช์ 0/1 หรือป้ายชื่อผลงาน (กด E)" aria-label="โต้ตอบกับสไลด์หรือเกม" disabled={!canParticipate}>
          <Hand size={20} />
        </button>
        <button onClick={() => setGamesPanelOpen(true)} title="เปิดแผงเกมทั้งหมด" aria-label="เปิดแผงเกมทั้งหมด" className={gamesPanelOpen ? 'active' : ''}>
          <Gamepad2 size={20} />
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

      {/* หน้าต่างตั้งชื่อป้ายผลงาน 3D และจุดเส้นชัย Parkour */}
      {editingSignBlock && (
        <div
          className="world-modal-backdrop"
          onClick={() => setEditingSignBlock(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="world-sign-title"
        >
          <div className="world-modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="world-modal-header">
              <div className="world-modal-title" style={{ color: '#7c3aed' }}>
                <span style={{ fontSize: '1.35rem' }}>🪧</span>
                <h3 id="world-sign-title">ตั้งข้อความบนป้าย 3D</h3>
              </div>
              <button
                className="world-modal-close-btn"
                onClick={() => setEditingSignBlock(null)}
                aria-label="ปิด"
              >
                <X size={20} />
              </button>
            </div>
            <p className="world-modal-desc">
              ข้อความนี้จะลอยอยู่เหนือป้ายในห้อง 3D ให้เพื่อนทุกคนมองเห็น (หากมีคำว่า <strong>เส้นชัย</strong> หรือ <strong>🏁</strong> เพื่อนที่กระโดดมาเหยียบป้ายจะได้พลุฉลอง!)
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
              <input
                type="text"
                maxLength={40}
                value={signDraftText}
                onChange={(event) => setSignDraftText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    const nextLabel = signDraftText.trim() || `⭐ ผลงานของ ${displayName}`;
                    void updateWorldBlock(roomId, editingSignBlock.id, { label: nextLabel, ownerName: displayName });
                    setEditingSignBlock(null);
                    setStatus(`บันทึกป้าย "${nextLabel}" แล้ว`);
                  }
                }}
                placeholder={`เช่น 🏠 บ้านของ ${displayName}`}
                aria-label="ข้อความบนป้าย 3D"
                autoFocus
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '2px solid #c4b5fd',
                  fontSize: '0.96rem',
                  fontWeight: 700,
                  fontFamily: 'inherit',
                  color: '#172033',
                }}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[
                  `🏠 บ้านของ ${displayName}`,
                  '🚀 จุดเริ่มต้นด่าน Parkour',
                  '🏁 เส้นชัย Parkour! พิชิตสำเร็จ',
                  '💡 ห้องทดลองวงจรลอจิก 0/1',
                  `🎨 แกลเลอรีของ ${displayName}`,
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setSignDraftText(preset)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 999,
                      border: '1px solid #ddd6fe',
                      background: signDraftText === preset ? '#7c3aed' : '#f5f3ff',
                      color: signDraftText === preset ? '#ffffff' : '#5b21b6',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
            <div className="world-modal-actions">
              <button
                type="button"
                onClick={() => {
                  const nextLabel = signDraftText.trim() || `⭐ ผลงานของ ${displayName}`;
                  void updateWorldBlock(roomId, editingSignBlock.id, { label: nextLabel, ownerName: displayName });
                  setEditingSignBlock(null);
                  setStatus(`บันทึกป้าย "${nextLabel}" แล้ว`);
                }}
                style={{
                  padding: '10px 18px',
                  borderRadius: 8,
                  border: 0,
                  background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                ✓ บันทึกข้อความบนป้าย
              </button>
              <button
                type="button"
                className="world-btn-cancel"
                onClick={() => setEditingSignBlock(null)}
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* หน้าต่าง KruJames Code Builder & แม่แบบวิชาคอมพิวเตอร์ */}
      {codeBuilderOpen && (
        <div
          className="world-modal-backdrop"
          onClick={() => setCodeBuilderOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="world-codebuilder-title"
        >
          <div
            className="world-modal-card"
            onClick={(event) => event.stopPropagation()}
            style={{ maxWidth: 680, width: 'calc(100vw - 28px)', maxHeight: '88vh', overflowY: 'auto' }}
          >
            <div className="world-modal-header">
              <div className="world-modal-title" style={{ color: '#1d4ed8' }}>
                <span style={{ fontSize: '1.4rem' }}>🤖</span>
                <h3 id="world-codebuilder-title">KruJames Code Builder · เขียนโค้ดสร้างโลก 3D</h3>
              </div>
              <button
                className="world-modal-close-btn"
                onClick={() => setCodeBuilderOpen(false)}
                aria-label="ปิด"
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <button
                type="button"
                onClick={() => setCodeBuilderTab('algo')}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: codeBuilderTab === 'algo' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  background: codeBuilderTab === 'algo' ? '#eff6ff' : '#ffffff',
                  color: codeBuilderTab === 'algo' ? '#1d4ed8' : '#475569',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                🧩 โค้ดอัลกอริทึม (Loop & If-Else)
              </button>
              <button
                type="button"
                onClick={() => setCodeBuilderTab('blueprint')}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: codeBuilderTab === 'blueprint' ? '2px solid #7c3aed' : '1px solid #cbd5e1',
                  background: codeBuilderTab === 'blueprint' ? '#f5f3ff' : '#ffffff',
                  color: codeBuilderTab === 'blueprint' ? '#6d28d9' : '#475569',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                🖥️ เสกแม่แบบวิชาคอม (KruJames Craft)
              </button>
            </div>

            {codeBuilderTab === 'algo' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                    บล็อกที่ใช้สร้าง:{' '}
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: MATERIALS.find((m) => m.id === material)?.color || '#65a30d',
                        color: '#fff',
                        textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                      }}
                    >
                      {MATERIALS.find((m) => m.id === material)?.icon || '🧱'}{' '}
                      {MATERIALS.find((m) => m.id === material)?.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 700 }}>
                    <span>จำนวนรอบ (N):</span>
                    {[3, 5, 7, 9].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setAlgoSteps(n)}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 6,
                          border: algoSteps === n ? '2px solid #1d4ed8' : '1px solid #cbd5e1',
                          background: algoSteps === n ? '#1d4ed8' : '#ffffff',
                          color: algoSteps === n ? '#ffffff' : '#1e293b',
                          fontWeight: 800,
                          fontFamily: 'inherit',
                          cursor: 'pointer',
                        }}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
                  {[
                    {
                      id: 'wall_loop',
                      title: '🔁 Loop กำแพงเรียงลำดับ',
                      concept: 'การทำซ้ำ (For Loop) ช่วยวางบล็อกแนวยาวแทนการคลิกทีละก้อน',
                      code: `for step in range(${algoSteps}):\n  place_block(forward=step, height=2)`,
                    },
                    {
                      id: 'stairs_algo',
                      title: '🪜 Algorithm บันไดขึ้นฟ้า',
                      concept: 'เพิ่มตำแหน่งแนวราบ (X/Z) และความสูง (Y) พร้อมกันทีละขั้น',
                      code: `for step in range(${algoSteps}):\n  place_block(forward=step, up=step)`,
                    },
                    {
                      id: 'binary_tower',
                      title: '🔀 If-Else หอคอยเลขฐานสอง 0/1',
                      concept: 'เงื่อนไขคู่/คี่ สลับบล็อกปกติกับไฟนีออน พร้อมสวิตช์ 0/1 ที่ฐาน',
                      code: `for y in range(${algoSteps}):\n  if y % 2 == 0: place("${material}")\n  else: place("lamp")`,
                    },
                    {
                      id: 'grid_nested',
                      title: '🟦 Nested Loop ลาน 4×4',
                      concept: 'ลูปซ้อนลูป 2 มิติ (แถว × คอลัมน์) สร้างพื้นอาคาร 16 บล็อกทันที',
                      code: `for row in range(4):\n  for col in range(4):\n    place_block(row, col)`,
                    },
                  ].map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: 8,
                        padding: 12,
                        borderRadius: 10,
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '0.92rem', color: '#0f172a' }}>{item.title}</strong>
                        <p style={{ margin: '4px 0 8px', fontSize: '0.78rem', color: '#475569', lineHeight: 1.4 }}>
                          {item.concept}
                        </p>
                        <pre
                          style={{
                            margin: 0,
                            padding: '7px 9px',
                            borderRadius: 6,
                            background: '#0f172a',
                            color: '#38bdf8',
                            fontSize: '0.74rem',
                            overflowX: 'auto',
                          }}
                        >
                          <code>{item.code}</code>
                        </pre>
                      </div>
                      <button
                        type="button"
                        onClick={() => runCodeBuilderRef.current(item.id, algoSteps)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 7,
                          border: 0,
                          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                          color: '#ffffff',
                          fontWeight: 800,
                          fontSize: '0.84rem',
                          fontFamily: 'inherit',
                          cursor: 'pointer',
                        }}
                      >
                        ▶ รันโค้ดสร้างตรงหน้า
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 10 }}>
                {[
                  {
                    id: 'bp_pc',
                    icon: '🖥️',
                    title: 'คอมพิวเตอร์ยักษ์ 3D (IPO)',
                    desc: 'ชุดโต๊ะคอมพิวเตอร์ เคส CPU หน้าจอไฟนีออน และสวิตช์เปิดเครื่อง เรียนรู้ Input → Process → Output',
                  },
                  {
                    id: 'bp_smarthome',
                    icon: '🏠',
                    title: 'บ้านสมาร์ตโฮม IoT + สวิตช์ 0/1',
                    desc: 'โครงบ้านอิฐมีหน้าต่างกระจก โคมไฟเพดาน และสวิตช์ลอจิกหน้าประตูที่กดเปิด-ปิดไฟบ้านได้จริง',
                  },
                  {
                    id: 'bp_robot',
                    icon: '🤖',
                    title: 'หุ่นยนต์โค้ดดิ้ง AI ประจำห้อง',
                    desc: 'หุ่นยนต์พิกเซลสีทองมีดวงตาไฟนีออนและสวิตช์แกนพลังงานที่หน้าอก พร้อมป้ายชื่อผู้สร้าง',
                  },
                  {
                    id: 'bp_parkour',
                    icon: '🚀',
                    title: 'ชุดด่าน Parkour อัลกอริทึม',
                    desc: 'ลู่เร่งสปีด + แท่นสปริงเด้งสูง + แท่นลอยฟ้า 3 ระดับ พร้อมป้าย 🏁 เส้นชัยจุดพลุฉลองบนยอด',
                  },
                  {
                    id: 'bp_pixelboard',
                    icon: '🎨',
                    title: 'กระดานวาดภาพ Pixel Art 5×5',
                    desc: 'กรอบกระดานแนวตั้งพร้อมป้ายชื่อแกลเลอรี ให้ทุบ/แต้มสีบล็อกวาดเป็นรูปพิกเซลโชว์เพื่อน',
                  },
                ].map((bp) => (
                  <div
                    key={bp.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: 10,
                      padding: 12,
                      borderRadius: 10,
                      border: '1px solid #ddd6fe',
                      background: '#faf5ff',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '1.45rem', marginBottom: 4 }}>{bp.icon}</div>
                      <strong style={{ fontSize: '0.92rem', color: '#4c1d95' }}>{bp.title}</strong>
                      <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#5b21b6', lineHeight: 1.42 }}>
                        {bp.desc}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => runCodeBuilderRef.current(bp.id, algoSteps)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 7,
                        border: 0,
                        background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '0.84rem',
                        fontFamily: 'inherit',
                        cursor: 'pointer',
                      }}
                    >
                      ✨ เสกแม่แบบตรงหน้า
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="world-modal-footer" style={{ marginTop: 14 }}>
              <button
                type="button"
                className="world-btn-cancel"
                onClick={() => setCodeBuilderOpen(false)}
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* หน้าต่างสำรวจนิทรรศการโลกเทคโนโลยี 3D (NSM Digital Playground: From Zero to One) */}
      {activeTechZone && (
        <div
          className="world-modal-backdrop"
          onClick={() => setActiveTechZone(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="world-techzone-title"
        >
          <div
            className="world-modal-card"
            onClick={(event) => event.stopPropagation()}
            style={{ maxWidth: 720, width: 'calc(100vw - 28px)', maxHeight: '88vh', overflowY: 'auto' }}
          >
            <div className="world-modal-header">
              <div className="world-modal-title" style={{ color: activeTechZone.accent }}>
                <span style={{ fontSize: '1.5rem' }}>{activeTechZone.icon}</span>
                <div>
                  <h3 id="world-techzone-title" style={{ margin: 0 }}>{activeTechZone.title}</h3>
                  <small style={{ color: '#64748b', fontWeight: 600 }}>{activeTechZone.subtitle}</small>
                </div>
              </div>
              <button
                className="world-modal-close-btn"
                onClick={() => setActiveTechZone(null)}
                aria-label="ปิด"
              >
                <X size={20} />
              </button>
            </div>

            {/* แถบเลือกสลับทั้ง 5 โซนภายในหน้าต่าง */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {TECH_ZONES.map((z) => (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => teleportToTechZoneRef.current(z, true)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 999,
                    border: activeTechZone.id === z.id ? `2px solid ${z.accent}` : '1px solid #cbd5e1',
                    background: activeTechZone.id === z.id ? '#0f172a' : '#f8fafc',
                    color: activeTechZone.id === z.id ? '#ffffff' : '#334155',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                  }}
                >
                  {z.icon} {z.shortTitle}
                </button>
              ))}
            </div>

            {activeTechZone.id === 'zero_to_one' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ padding: 14, borderRadius: 12, background: '#0f172a', color: '#fff', border: '2px solid #38bdf8' }}>
                  <div style={{ fontWeight: 800, color: '#38bdf8', marginBottom: 8 }}>
                    🎛️ แท่นโฮโลแกรม BINARY 0/1 · ลองกดสลับสวิตช์บิต (4-Bit Decoder)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap', margin: '10px 0' }}>
                    {binaryBits.map((bit, idx) => {
                      const placeVal = 8 >> idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            const next: [number, number, number, number] = [...binaryBits] as [number, number, number, number];
                            next[idx] = bit === 1 ? 0 : 1;
                            setBinaryBits(next);
                          }}
                          style={{
                            width: 68,
                            padding: '10px 6px',
                            borderRadius: 10,
                            border: bit === 1 ? '2px solid #38bdf8' : '2px solid #f43f5e',
                            background: bit === 1 ? 'rgba(56, 189, 248, 0.22)' : 'rgba(244, 63, 94, 0.18)',
                            color: '#ffffff',
                            fontWeight: 900,
                            fontSize: '1.25rem',
                            fontFamily: 'inherit',
                            cursor: 'pointer',
                          }}
                        >
                          <div>{bit}</div>
                          <small style={{ fontSize: '0.68rem', color: '#cbd5e1', fontWeight: 700 }}>หลัก {placeVal}</small>
                        </button>
                      );
                    })}
                    <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#a3e635', padding: '0 8px' }}>
                      = เลขฐานสิบ: {binaryBits[0] * 8 + binaryBits[1] * 4 + binaryBits[2] * 2 + binaryBits[3] * 1}
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#cbd5e1', textAlign: 'center' }}>
                    รหัสฐานสองใช้เพียงเลข <strong>0 (ปิด)</strong> และ <strong>1 (เปิด)</strong> เป็นจุดกำเนิดของคอมพิวเตอร์ ปัญญาประดิษฐ์ (AI) และโลกเสมือน (Metaverse)
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
                  {[
                    ['1936 · Turing Machine', 'อลัน ทัวริง คิดค้นแบบจำลองเครื่องจักรทัวริง ต้นแบบคอมพิวเตอร์ที่ทำงานตามอัลกอริทึม'],
                    ['1946 · ENIAC (เอนิแอก)', 'คอมพิวเตอร์อิเล็กทรอนิกส์ยุคแรก ใช้หลอดสุญญากาศกว่า 17,000 หลอด'],
                    ['1947 · Transistor', 'ทรานซิสเตอร์เข้ามาแทนหลอดสุญญากาศ ทำให้คอมพิวเตอร์เล็กลงและประหยัดไฟ'],
                    ['1958 · Integrated Circuit', 'วงจรรวม (IC) รวมชิ้นส่วนอิเล็กทรอนิกส์จำนวนมากไว้บนชิปแผ่นเดียว'],
                    ['1971 · Microprocessor', 'ไมโครโพรเซสเซอร์ (CPU บนชิปเดียว) จุดประกายยุคคอมพิวเตอร์ส่วนบุคคล'],
                    ['1980–ปัจจุบัน · PC, AI & Metaverse', 'จากคอมพิวเตอร์ตั้งโต๊ะสู่สมาร์ตโฟน ปัญญาประดิษฐ์ และโลกเสมือน 3D'],
                  ].map(([era, desc]) => (
                    <div key={era} style={{ padding: 10, borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <strong style={{ fontSize: '0.84rem', color: '#0284c7' }}>{era}</strong>
                      <p style={{ margin: '4px 0 0', fontSize: '0.76rem', color: '#475569', lineHeight: 1.4 }}>{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTechZone.id === 'matrix_cube' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ padding: 14, borderRadius: 12, background: '#02120a', color: '#4ade80', border: '2px solid #22c55e' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: 6, color: '#86efac' }}>
                    🟢 เครื่องแปลงชื่อนักเรียนเป็นรหัสฐานสอง (Binary Matrix Encoder)
                  </div>
                  <div style={{ fontSize: '0.84rem', color: '#d1fae5', marginBottom: 8 }}>
                    ชื่อของคุณ: <strong>{displayName}</strong> เมื่อคอมพิวเตอร์เก็บในหน่วยความจำ จะมองเห็นเป็นรหัส 0 และ 1 ดังนี้:
                  </div>
                  <div
                    style={{
                      padding: 10,
                      borderRadius: 8,
                      background: 'rgba(0,0,0,0.65)',
                      fontFamily: 'monospace',
                      fontSize: '0.82rem',
                      color: '#4ade80',
                      lineHeight: 1.6,
                      wordBreak: 'break-all',
                    }}
                  >
                    {Array.from(displayName.slice(0, 12))
                      .map((ch) => ch.charCodeAt(0).toString(2).padStart(12, '0'))
                      .join('  ')}
                  </div>
                </div>
                <div style={{ padding: 12, borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: '0.83rem', color: '#14532d', lineHeight: 1.5 }}>
                  💡 <strong>ความลับของห้องอุโมงค์ไฟอินฟินิตี้ LED:</strong> ดวงไฟแต่ละดวงเปรียบเสมือน <strong>1 บิต (Bit)</strong> เมื่อนำหลอดไฟหลายล้านดวงมาเรียงต่อกันและสั่งเปิด (1) หรือปิด (0) ด้วยความเร็วสูง จึงกลายเป็นหน้าจอภาพยนตร์ เกม 3D และเครือข่ายอินเทอร์เน็ตที่เชื่อมโลกเข้าด้วยกัน!
                </div>
              </div>
            )}

            {activeTechZone.id === 'how_computer_works' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#92400e' }}>
                  คลิกเลือกอวัยวะของร่างกาย เพื่อดูว่าตรงกับชิ้นส่วนใดของคอมพิวเตอร์:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))', gap: 8 }}>
                  {[
                    {
                      organ: '🧠 สมองมนุษย์',
                      hw: 'ซีพียู (CPU), แรม (RAM) & ฮาร์ดดิสก์',
                      role: 'Process & Memory',
                      desc: 'ทำหน้าที่คิดคำนวณ ประมวลผลคำสั่ง และจดจำข้อมูลเหมือนสมองของเรา',
                    },
                    {
                      organ: '👁️ ดวงตา',
                      hw: 'กล้องเว็บแคม & สแกนเนอร์',
                      role: 'Input Device (รับภาพ)',
                      desc: 'ทำหน้าที่มองเห็นและรับข้อมูลภาพเข้าสู่เครื่องคอมพิวเตอร์',
                    },
                    {
                      organ: '👂 หู',
                      hw: 'ไมโครโฟน (Microphone)',
                      role: 'Input Device (รับเสียง)',
                      desc: 'ทำหน้าที่ฟังและรับคลื่นเสียงแปลงเป็นสัญญาณดิจิทัลเข้าสู่เครื่อง',
                    },
                    {
                      organ: '👄 ปาก',
                      hw: 'ลำโพง & หูฟัง (Speaker)',
                      role: 'Output Device (ส่งเสียง)',
                      desc: 'ทำหน้าที่เปล่งเสียงพูด เสียงเพลง และผลลัพธ์เสียงออกมาให้เราได้ยิน',
                    },
                    {
                      organ: '🖐️ มือและการสัมผัส',
                      hw: 'คีย์บอร์ด, เมาส์ & จอทัชสกรีน',
                      role: 'Input Device (สั่งงาน)',
                      desc: 'รับการกดปุ่มและการชี้ตำแหน่งจากผู้ใช้เข้าสู่ระบบ',
                    },
                    {
                      organ: '🩸 เส้นเลือด & ระบบประสาท',
                      hw: 'สายไฟ & สายส่งข้อมูล (Data Bus)',
                      role: 'System Bus & Power',
                      desc: 'ลำเลียงพลังงานไฟฟ้าและส่งผ่านข้อมูลระหว่างอุปกรณ์ทุกชิ้นในเครื่อง',
                    },
                  ].map((item, idx) => (
                    <button
                      key={item.organ}
                      type="button"
                      onClick={() => setSelectedOrganIdx(idx)}
                      style={{
                        textAlign: 'left',
                        padding: 11,
                        borderRadius: 10,
                        border: selectedOrganIdx === idx ? '2px solid #d97706' : '1px solid #fde68a',
                        background: selectedOrganIdx === idx ? '#fffbeb' : '#ffffff',
                        fontFamily: 'inherit',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#92400e' }}>{item.organ}</div>
                      <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#1d4ed8', margin: '3px 0' }}>↔ {item.hw}</div>
                      <span style={{ display: 'inline-block', padding: '1px 6px', borderRadius: 4, background: '#fef3c7', color: '#b45309', fontSize: '0.7rem', fontWeight: 700 }}>
                        {item.role}
                      </span>
                      <p style={{ margin: '5px 0 0', fontSize: '0.75rem', color: '#475569', lineHeight: 1.38 }}>{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTechZone.id === 'wireless_5g' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(['1G', '2G', '3G', '4G', '5G'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setSelectedGenG(g)}
                      style={{
                        flex: 1,
                        minWidth: 72,
                        padding: '10px 8px',
                        borderRadius: 10,
                        border: selectedGenG === g ? '2px solid #7c3aed' : '1px solid #cbd5e1',
                        background: selectedGenG === g ? 'linear-gradient(135deg, #7c3aed, #059669)' : '#f8fafc',
                        color: selectedGenG === g ? '#ffffff' : '#1e293b',
                        fontWeight: 900,
                        fontSize: '1.05rem',
                        fontFamily: 'inherit',
                        cursor: 'pointer',
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
                {(() => {
                  const specs: Record<'1G' | '2G' | '3G' | '4G' | '5G', { era: string; speed: string; icon: string; title: string; detail: string }> = {
                    '1G': {
                      era: 'ทศวรรษ 1980s',
                      speed: '~2.4 Kbps (สัญญาณอนาล็อก)',
                      icon: '📻',
                      title: 'ยุคที่ 1 (1G) · โทรศัพท์มือถือรุ่นกระติกน้ำ',
                      detail: 'ใช้สัญญาณวิทยุแบบอนาล็อก โทรพูดคุยด้วยเสียงได้อย่างเดียว ตัวเครื่องมีขนาดใหญ่และหนักมาก ยังส่งข้อความหรือเล่นอินเทอร์เน็ตไม่ได้',
                    },
                    '2G': {
                      era: 'ทศวรรษ 1990s',
                      speed: '~64 Kbps (สัญญาณดิจิทัล)',
                      icon: '💬',
                      title: 'ยุคที่ 2 (2G) · ก้าวสู่ระบบดิจิทัล & ข้อความ SMS',
                      detail: 'เปลี่ยนเสียงเป็นรหัสดิจิทัล 0/1 ทำให้เสียงคมชัดขึ้น ปลอดภัยขึ้น และส่งข้อความสั้น (SMS) กับริงโทนได้เป็นครั้งแรก!',
                    },
                    '3G': {
                      era: 'ทศวรรษ 2000s',
                      speed: '~2–14 Mbps',
                      icon: '🌐',
                      title: 'ยุคที่ 3 (3G) · อินเทอร์เน็ตบนสมาร์ตโฟน',
                      detail: 'เปิดโลกการเข้าเว็บไซต์ แชต ส่งรูปภาพ แผนที่นำทาง GPS และวิดีโอคอลบนหน้าจอสมาร์ตโฟนได้ทุกที่',
                    },
                    '4G': {
                      era: 'ทศวรรษ 2010s',
                      speed: '~100 Mbps',
                      icon: '🎬',
                      title: 'ยุคที่ 4 (4G) · วิดีโอสตรีมมิง HD & เกมออนไลน์',
                      detail: 'ความเร็วสูงระดับบรอดแบนด์ ดูวิดีโอ YouTube ความละเอียดสูง ไลฟ์สด และเรียนออนไลน์ผ่านมือถือได้อย่างลื่นไหล',
                    },
                    '5G': {
                      era: 'ทศวรรษ 2020s – ปัจจุบัน',
                      speed: '~1,000–10,000 Mbps (1–10 Gbps)',
                      icon: '🚀',
                      title: 'ยุคที่ 5 (5G) · เครือข่ายอัจฉริยะ IoT, AI & Smart City',
                      detail: 'ความหน่วงต่ำมาก (Real-time) เชื่อมต่ออุปกรณ์ IoT นับล้านชิ้น หุ่นยนต์ผ่าตัดทางไกล รถยนต์ไร้คนขับ และห้องเรียน Metaverse 3D!',
                    },
                  };
                  const cur = specs[selectedGenG];
                  return (
                    <div style={{ padding: 14, borderRadius: 12, background: '#faf5ff', border: '2px solid #c084fc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                        <strong style={{ fontSize: '1rem', color: '#581c87' }}>{cur.icon} {cur.title}</strong>
                        <span style={{ padding: '3px 9px', borderRadius: 999, background: '#065f46', color: '#fff', fontSize: '0.75rem', fontWeight: 800 }}>
                          {cur.era} · ความเร็ว {cur.speed}
                        </span>
                      </div>
                      <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: '#3b0764', lineHeight: 1.5 }}>{cur.detail}</p>
                    </div>
                  );
                })()}
              </div>
            )}

            {activeTechZone.id === 'green_studio' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(() => {
                  const backdrops = [
                    { name: '🟩 ฉาก Green Screen ต้นฉบับ', bg: 'linear-gradient(135deg, #16a34a, #22c55e)', desc: 'ในสตูดิโอจริงจะใช้ผ้าหรือผนังสีเขียวสด เพราะสีเขียวไม่ตรงกับสีผิวมนุษย์ ทำให้คอมพิวเตอร์แยกตัวคนออกจากฉากหลังได้แม่นยำ' },
                    { name: '🌌 ฉากอวกาศไซเบอร์ Metaverse', bg: 'linear-gradient(135deg, #0f172a, #1d4ed8, #7c3aed)', desc: 'คอมพิวเตอร์ตัดสีเขียวออก (Chroma Key) แล้วแทนที่ด้วยภาพกราฟิกอวกาศ 3D ทันที!' },
                    { name: '📰 ห้องข่าวเยาวชน KruJames News', bg: 'linear-gradient(135deg, #1e3a8a, #0284c7)', desc: 'ใช้รายงานข่าวสารเทคโนโลยีและผลงานของนักเรียนหน้ากล้องถ่ายทอดสด' },
                    { name: '🤖 ห้องปฏิบัติการ AI อนาคต', bg: 'linear-gradient(135deg, #31102f, #be185d, #f59e0b)', desc: 'จำลองฉากห้องแล็บหุ่นยนต์และปัญญาประดิษฐ์เหมือนในภาพยนตร์ไซไฟ' },
                  ];
                  const cur = backdrops[studioBackdropIdx] || backdrops[0];
                  return (
                    <>
                      <div
                        style={{
                          padding: 18,
                          borderRadius: 12,
                          background: cur.bg,
                          color: '#ffffff',
                          border: '3px solid #0f172a',
                          textAlign: 'center',
                          boxShadow: 'inset 0 0 24px rgba(0,0,0,0.35)',
                        }}
                      >
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, opacity: 0.9 }}>🔴 LIVE · KRUJAMES STUDIO MONITOR</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 900, margin: '6px 0' }}>🎙️ ผู้ประกาศข่าวดิจิทัล: {displayName}</div>
                        <div style={{ fontSize: '0.84rem', background: 'rgba(0,0,0,0.45)', padding: '6px 12px', borderRadius: 8, display: 'inline-block' }}>
                          {cur.name}
                        </div>
                        <p style={{ margin: '8px 0 0', fontSize: '0.8rem', opacity: 0.95 }}>{cur.desc}</p>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {backdrops.map((b, idx) => (
                          <button
                            key={b.name}
                            type="button"
                            onClick={() => setStudioBackdropIdx(idx)}
                            style={{
                              flex: 1,
                              minWidth: 140,
                              padding: '8px 10px',
                              borderRadius: 8,
                              border: studioBackdropIdx === idx ? '2px solid #16a34a' : '1px solid #cbd5e1',
                              background: studioBackdropIdx === idx ? '#dcfce7' : '#ffffff',
                              color: '#14532d',
                              fontWeight: 800,
                              fontSize: '0.78rem',
                              fontFamily: 'inherit',
                              cursor: 'pointer',
                            }}
                          >
                            {b.name}
                          </button>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            <div className="world-modal-footer" style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  celebrate();
                  setWorldStars((s) => s + 2);
                  const unitNo = boards[0]?.unitNo || 1;
                  void recordActivity('question', `u${unitNo}-techzone-${activeTechZone.id}`, unitNo, `เรียนรู้โซนโลกเทคโนโลยี: ${activeTechZone.title}`);
                  setStatus(`🌟 สำรวจโซน "${activeTechZone.shortTitle}" สำเร็จ รับ +2⭐!`);
                  setActiveTechZone(null);
                }}
                style={{
                  padding: '10px 18px',
                  borderRadius: 8,
                  border: 0,
                  background: 'linear-gradient(135deg, #059669, #10b981)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                🌟 บันทึกการสำรวจโซนนี้ (+2⭐)
              </button>
              <button
                type="button"
                className="world-btn-cancel"
                onClick={() => setActiveTechZone(null)}
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VirtualClassroom;
