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
  AvatarFaceStyle,
  AvatarTechClass,
  BlockMaterial,
  VirtualRoomState,
  WorldActivityEvent,
  WorldBlock,
  WorldMotion,
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
const AVATAR_COLORS = ['#2563eb', '#e11d48', '#16a34a', '#9333ea', '#ea580c', '#0891b2', '#0f172a', '#d97706'];
const LESSON_COLORS = ['#2563eb', '#ea580c', '#16a34a', '#7c3aed'];

const TECH_CLASSES: Array<{
  id: AvatarTechClass;
  icon: string;
  title: string;
  badge: string;
  gearDesc: string;
  accent: string;
}> = [
  {
    id: 'coder',
    icon: '💻',
    title: 'นักเขียนโค้ด',
    badge: '💻 Full-Stack Coder',
    gearDesc: 'หูฟังโค้ดดิ้ง RGB + เป้แล็ปท็อป + ป้ายโค้ด </>',
    accent: '#38bdf8',
  },
  {
    id: 'ai_engineer',
    icon: '🤖',
    title: 'วิศวกร AI & หุ่นยนต์',
    badge: '🤖 AI & Robotics',
    gearDesc: 'แว่นโฮโลแกรมไซเบอร์ + เสาอากาศ AI + แกนพลังงานหน้าอก',
    accent: '#22d3ee',
  },
  {
    id: 'cyber_guardian',
    icon: '🛡️',
    title: 'นักรบไซเบอร์',
    badge: '🛡️ Cyber Guardian',
    gearDesc: 'หมวกเกราะไซเบอร์ดำทอง + โล่ไฟร์วอลล์ป้องกันไวรัสที่แขน',
    accent: '#f59e0b',
  },
  {
    id: 'vr_explorer',
    icon: '🥽',
    title: 'นักสำรวจโลกเสมือน VR',
    badge: '🥽 VR Metaverse',
    gearDesc: 'แว่น VR Headset 3D + เจ็ตแพ็กไอพ่นคู่ด้านหลัง',
    accent: '#a855f7',
  },
  {
    id: 'hardware_maker',
    icon: '🔧',
    title: 'วิศวกรฮาร์ดแวร์ IoT',
    badge: '🔧 Hardware Maker',
    gearDesc: 'หมวกวิศวกรพร้อมไฟฉาย + เข็มขัดแผงวงจร + ประแจดิจิทัล',
    accent: '#eab308',
  },
  {
    id: 'game_creator',
    icon: '🎮',
    title: 'นักสร้างเกม 3D',
    badge: '🎮 3D Game Creator',
    gearDesc: 'มงกุฎพิกเซลทองคำ + แว่น 8-Bit + คฑาเสกบล็อกเรืองแสง',
    accent: '#ec4899',
  },
];

const FACE_STYLES: Array<{ id: AvatarFaceStyle; icon: string; label: string }> = [
  { id: 'happy', icon: '😊', label: 'ยิ้มสดใส' },
  { id: 'cool', icon: '😎', label: 'แว่นเท่สายโค้ด' },
  { id: 'excited', icon: '🤩', label: 'ตาวาวตื่นเต้น' },
  { id: 'focused', icon: '🧐', label: 'โฟกัสแก้บั๊ก' },
  { id: 'robo', icon: '🤖', label: 'หน้าดิจิทัล LED' },
];

const AVATAR_ACTIONS: Array<{ id: WorldMotion; icon: string; label: string; keyHint: string }> = [
  { id: 'wave', icon: '👋', label: 'โบกมือทัก', keyHint: 'Z' },
  { id: 'cheer', icon: '🙌', label: 'กระโดดดีใจ', keyHint: 'X' },
  { id: 'dance', icon: '💃', label: 'เต้นไซเบอร์', keyHint: 'C' },
  { id: 'build', icon: '🔨', label: 'ท่าสร้างงาน', keyHint: 'V' },
];

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

type TechZoneId =
  | 'zero_to_one'
  | 'matrix_cube'
  | 'how_computer_works'
  | 'wireless_5g'
  | 'green_studio'
  | 'logic_secret_code'
  | 'program_software_robodog'
  | 'quantum_computer'
  | 'ai_revolution_agentic'
  | 'retro_console_esports';

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
    shortTitle: '1. Zero to One 0/1',
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
    shortTitle: '2. ห้องเมทริกซ์ 0/1',
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
    shortTitle: '3. คอม 5 ยุค & IBM 1620',
    title: 'HOW COMPUTER WORKS? · คอมพิวเตอร์ 5 ยุค & IBM 1620 เครื่องแรกของไทย',
    subtitle: 'เปรียบเทียบคอมพิวเตอร์กับอวัยวะมนุษย์ · วิวัฒนาการ 5 ยุค (หลอดสุญญากาศ–AI) · ห้องเครื่อง IBM 1620 พ.ศ. 2506',
    accent: '#f59e0b',
    x: 15.2,
    z: -1,
    lookX: 19.5,
    lookZ: -1,
  },
  {
    id: 'logic_secret_code',
    icon: '🔐',
    shortTitle: '4. ตรรกศาสตร์ & รหัสลับ',
    title: 'LOGIC & ALGORITHM · ตรรกศาสตร์ อัลกอริทึม & การสร้างรหัสลับ',
    subtitle: 'บอร์ดปุ่มไฟสร้างรหัสลับ (A=1..Z=26) · ฝึกคิดเชิงตรรกะและลำดับขั้นตอนอัลกอริทึมในชีวิตประจำวัน',
    accent: '#2563eb',
    x: -15.2,
    z: -14.5,
    lookX: -19.5,
    lookZ: -14.5,
  },
  {
    id: 'program_software_robodog',
    icon: '🐕',
    shortTitle: '5. ภาษาคอม & หุ่นสุนัข',
    title: 'PROGRAM & COMPUTER LANGUAGE · คอมไพเลอร์ ซอฟต์แวร์ & หุ่นยนต์สุนัข 4 ขา',
    subtitle: 'ภาษาคอมพิวเตอร์ 3 ระดับ (Machine / Assembly / High-Level) · Compiler vs Interpreter · ซอฟต์แวร์ระบบ/ประยุกต์',
    accent: '#e11d48',
    x: 15.2,
    z: -14.5,
    lookX: 19.5,
    lookZ: -14.5,
  },
  {
    id: 'quantum_computer',
    icon: '⚛️',
    shortTitle: '6. คอมควอนตัม 0K',
    title: 'QUANTUM COMPUTER · คอมพิวเตอร์เชิงควอนตัม (-273.15°C)',
    subtitle: 'กลศาสตร์ควอนตัมระดับอะตอม · Qubit ซ้อนทับสถานะ 0 และ 1 พร้อมกัน ภายใต้อุณหภูมิ 0 องศาเคลวิน',
    accent: '#059669',
    x: 0,
    z: -15.5,
    lookX: 0,
    lookZ: -20.5,
  },
  {
    id: 'wireless_5g',
    icon: '📡',
    shortTitle: '7. ไร้สาย 1G–5G',
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
    shortTitle: '8. สตูดิโอ Green Screen',
    title: 'KruJames Studio · สตูดิโอถ่ายทอดสด & ห้องควบคุม Chroma Key',
    subtitle: 'เรียนรู้เทคนิค Chroma Key ตัดพื้นหลังสีเขียว และห้องควบคุมผู้กำกับรายการโทรทัศน์ดิจิทัล',
    accent: '#16a34a',
    x: 15.2,
    z: 12.5,
    lookX: 19.5,
    lookZ: 12.5,
  },
  {
    id: 'ai_revolution_agentic',
    icon: '🤖',
    shortTitle: '9. AI Revolution & Deepfake',
    title: 'AI REVOLUTION : THE NEW HUMAN · Agentic AI, Cloud, 3D Print & Deepfake',
    subtitle: 'หุ่นยนต์ฮิวแมนนอยด์ · Agentic AI วางแผนอัตโนมัติ · Cloud & IoE · รู้เท่าทัน Deepfake และทักษะดิจิทัล',
    accent: '#0284c7',
    x: -18.5,
    z: 25.5,
    lookX: -23.5,
    lookZ: 25.5,
  },
  {
    id: 'retro_console_esports',
    icon: '🎮',
    shortTitle: '10. ตู้เกม Famicom–N64',
    title: 'RETRO CONSOLE & E-SPORTS · วิวัฒนาการเกม 8-Bit สู่ 3D และสายอาชีพวงการเกม',
    subtitle: 'Famicom (1983) → Super Famicom (1990) → Nintendo 64 (1996) และเส้นทางอาชีพสู่วงการเกม & E-Sports',
    accent: '#db2777',
    x: 18.5,
    z: 25.5,
    lookX: 23.5,
    lookZ: 25.5,
  },
];

const WORLD_SIZE = 160;
const BUILD_REACH = 18;
const BUILD_BOUNDARY = 76;
const BUILD_MAX_HEIGHT = 36;
const PLAYER_BOUNDARY = 78;

interface BuilderPlotInfo {
  id: string;
  label: string;
  theme: string;
  x: number;
  z: number;
  color: number;
  hex: string;
}

const BUILDER_PLOTS: BuilderPlotInfo[] = [
  { id: 'plot_w1', label: '🏗️ แปลงสร้าง W1 (Smart Home)', theme: 'ลานสร้างบ้านอัจฉริยะ IoT & วงจรไฟ 0/1', x: -40, z: -18, color: 0x38bdf8, hex: '#38bdf8' },
  { id: 'plot_w2', label: '🏗️ แปลงสร้าง W2 (Pixel Art)', theme: 'ลานวาดภาพพิกเซลอาร์ต & ประติมากรรม 3D', x: -40, z: -2, color: 0xf43f5e, hex: '#f43f5e' },
  { id: 'plot_w3', label: '🏗️ แปลงสร้าง W3 (AI Robot)', theme: 'ลานสร้างหุ่นยนต์ AI & เครื่องจักรอนาคต', x: -40, z: 14, color: 0xa855f7, hex: '#a855f7' },
  { id: 'plot_w4', label: '🏗️ แปลงสร้าง W4 (Parkour)', theme: 'ลานออกแบบด่านกระโดด Parkour ให้เพื่อนเล่น', x: -40, z: 30, color: 0x10b981, hex: '#10b981' },
  { id: 'plot_e1', label: '🏗️ แปลงสร้าง E1 (Cyber Tower)', theme: 'ลานสร้างหอคอยไซเบอร์ & เสาอากาศ 5G', x: 40, z: -18, color: 0xfacc15, hex: '#facc15' },
  { id: 'plot_e2', label: '🏗️ แปลงสร้าง E2 (Computer Lab)', theme: 'ลานสร้างคอมพิวเตอร์ยักษ์ Input-Process-Output', x: 40, z: -2, color: 0x06b6d4, hex: '#06b6d4' },
  { id: 'plot_e3', label: '🏗️ แปลงสร้าง E3 (Quantum Core)', theme: 'ลานสร้างเตาปฏิกรณ์ควอนตัม & ยานอวกาศ', x: 40, z: 14, color: 0x22c55e, hex: '#22c55e' },
  { id: 'plot_e4', label: '🏗️ แปลงสร้าง E4 (Free Sandbox)', theme: 'ลานสร้างสรรค์อิสระร่วมกับเพื่อนในห้อง', x: 40, z: 30, color: 0xf97316, hex: '#f97316' },
];

const BINARY_HACK_QUESTIONS = [
  { q: 'รหัสฐานสอง 0101 แปลงเป็นเลขฐานสิบได้เท่าไร?', options: ['5', '3', '9', '10'], ans: 0, explain: '0×8 + 1×4 + 0×2 + 1×1 = 5' },
  { q: 'รหัสฐานสอง 1010 แปลงเป็นเลขฐานสิบได้เท่าไร?', options: ['10', '6', '12', '8'], ans: 0, explain: '1×8 + 0×4 + 1×2 + 0×1 = 10' },
  { q: 'ในบอร์ดสร้างรหัสลับ NSM (A=1..Z=26) คำว่า "AI" ตรงกับรหัสตัวเลขใด?', options: ['1 - 9', '1 - 8', '2 - 9', '1 - 10'], ans: 0, explain: 'A คือตัวอักษรที่ 1 และ I คือตัวอักษรที่ 9' },
  { q: 'เลขฐานสิบ 15 เขียนเป็นรหัสฐานสอง 4 บิตได้อย่างไร?', options: ['1111', '1011', '1110', '0111'], ans: 0, explain: '8 + 4 + 2 + 1 = 15 ดังนั้นเปิดไฟครบทั้ง 4 บิต = 1111' },
  { q: 'วงจรลอจิก AND Gate จะให้ผลลัพธ์เป็น 1 (ไฟติด) เมื่อใด?', options: ['เมื่ออินพุตเป็น 1 ทั้งสองตัว (1 AND 1)', 'เมื่ออินพุตเป็น 0 ทั้งสองตัว', 'เมื่อมีตัวใดตัวหนึ่งเป็น 0', 'ไฟติดตลอดเวลา'], ans: 0, explain: 'AND Gate ต้องเป็นจริง (1) ทั้งสองฝั่ง ผลลัพธ์จึงจะเป็น 1' },
];

const DEEPFAKE_DETECTIVE_CASES = [
  {
    title: 'เคสที่ 1: คลิปวิดีโอดาราดังชวนลงทุนคริปโต การันตีกำไรวันละ 50%',
    clue: 'สังเกตพบขอบปากขยับไม่ตรงเสียง และแสงเงาที่แก้มกระตุกแปลก ๆ',
    options: ['เป็นคลิป Deepfake ตัดต่อใบหน้า/เสียง ห้ามโอนเงินและห้ามแชร์ต่อ', 'เชื่อถือได้เพราะเห็นหน้าดาราชัดเจน', 'รีบแชร์เข้ากลุ่มเพื่อนทันที', 'กรอกรหัสผ่านธนาคารเพื่อทดลอง'],
    ans: 0,
    explain: 'คลิป Deepfake มักมีความผิดปกติที่ขอบใบหน้า การกะพริบตา และใช้อ้างผลตอบแทนเกินจริง ต้องตรวจต้นฉบับและเทียบหลายแหล่งเสมอ',
  },
  {
    title: 'เคสที่ 2: ได้รับ SMS แจ้งว่า "พัสดุตกค้าง กรุณากดลิงก์ http://bit.ly/fake-post-login เพื่อกรอกรหัสผ่าน"',
    clue: 'ชื่อโดเมนไม่ใช่เว็บทางการ และเร่งรัดให้กรอกข้อมูลส่วนตัว',
    options: ['เป็นลิงก์ฟิชชิ่ง (Phishing) ห้ามกดและห้ามกรอกรหัสผ่านเด็ดขาด', 'รีบกดลิงก์แล้วกรอกรหัสผ่านทันที', 'ส่งต่อให้เพื่อนช่วยกด', 'บอกรหัส OTP ให้คนส่ง'],
    ans: 0,
    explain: 'การหลอกลวงแบบ Phishing มักใช้ลิงก์ปลอมเพื่อขโมยรหัสผ่านหรือ OTP',
  },
  {
    title: 'เคสที่ 3: เพื่อนส่งข่าวด่วนในแชทว่า "พรุ่งนี้โรงเรียนหยุดฉุกเฉิน 1 สัปดาห์" โดยไม่มีประกาศจากเพจโรงเรียน',
    clue: 'ไม่มีแหล่งอ้างอิง ไม่มีวันที่ และไม่มีประกาศจากครูหรือโรงเรียน',
    options: ['ตรวจสอบจากเพจทางการของโรงเรียนหรือถามครูประจำชั้นก่อนแชร์', 'แชร์ต่อให้ครบทุกกลุ่มทันที', 'หยุดเรียนเลยโดยไม่ต้องเช็ก', 'โพสต์ด่าในโซเชียล'],
    ans: 0,
    explain: 'ทักษะความเข้าใจดิจิทัล (Digital Literacy): ต้องค้นหาต้นฉบับ เทียบหลายแหล่ง และตรวจวันเวลา/บริบทก่อนเชื่อหรือแชร์',
  },
  {
    title: 'เคสที่ 4: คำคมของ Tim Berners-Lee ผู้ประดิษฐ์ World Wide Web เตือนสติเราเรื่องใด?',
    clue: '"You affect the world by what you browse" (คุณสร้างผลกระทบต่อโลกจากสิ่งที่คุณเรียกดู)',
    options: ['ทุกการค้นหา กดไลก์ และแชร์ของเรา ส่งผลกระทบต่อสังคมออนไลน์เสมอ', 'อินเทอร์เน็ตไม่มีผลกระทบต่อโลกความจริง', 'เราโพสต์อะไรก็ได้โดยไม่ต้องรับผิดชอบ', 'เว็บไซต์ทำงานได้โดยไม่ต้องมีเซิร์ฟเวอร์'],
    ans: 0,
    explain: 'รอยเท้าดิจิทัล (Digital Footprint) และการเลือกเสพ/แชร์เนื้อหาของเราส่งผลต่อสังคมโดยตรง',
  },
];

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

const createNameSprite = (name: string, isTeacher = false, techClass: AvatarTechClass = 'coder') => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;
  const classInfo = TECH_CLASSES.find((c) => c.id === techClass) || TECH_CLASSES[0];
  ctx.fillStyle = isTeacher ? 'rgba(146,64,14,.94)' : 'rgba(15,23,42,.9)';
  ctx.fillRect(12, 10, 488, 138);
  ctx.strokeStyle = isTeacher ? '#facc15' : classInfo.accent;
  ctx.lineWidth = 5;
  ctx.strokeRect(14, 12, 484, 134);
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 38px Sarabun, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${isTeacher ? '👑 ครู ' : ''}${name}`.slice(0, 22), 256, 56);
  ctx.fillStyle = isTeacher ? '#fde047' : classInfo.accent;
  ctx.font = '700 26px Sarabun, sans-serif';
  ctx.fillText(isTeacher ? '⚡ อาจารย์ที่ปรึกษาโลก 3D' : classInfo.badge, 256, 110);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
  sprite.scale.set(3.2, 0.96, 1);
  sprite.position.y = 2.95;
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
  const techClassRef = useRef<AvatarTechClass>('coder');
  const faceStyleRef = useRef<AvatarFaceStyle>('happy');
  const activeEmoteRef = useRef<WorldMotion | null>(null);
  const emoteUntilRef = useRef(0);
  const rebuildLocalAvatarRef = useRef<() => void>(() => undefined);
  const triggerEmoteRef = useRef<(emote: WorldMotion, durationMs?: number) => void>(() => undefined);
  const thirdPersonRef = useRef(true);
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
  const [selectedComputerGen, setSelectedComputerGen] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedGenG, setSelectedGenG] = useState<'1G' | '2G' | '3G' | '4G' | '5G'>('5G');
  const [studioBackdropIdx, setStudioBackdropIdx] = useState(0);
  const [secretWordIdx, setSecretWordIdx] = useState(0);
  const [roboDogAction, setRoboDogAction] = useState<'scan' | 'patrol' | 'wave' | 'rescue'>('scan');
  const [quantumQubits, setQuantumQubits] = useState(4);
  const [agentGoalIdx, setAgentGoalIdx] = useState(0);
  const [selectedConsoleEra, setSelectedConsoleEra] = useState<'fc' | 'sfc' | 'n64'>('fc');
  const [miniGameOpen, setMiniGameOpen] = useState(false);
  const [miniGameTab, setMiniGameTab] = useState<'obby' | 'hack' | 'detective' | 'rescue'>('obby');
  const [hackQIdx, setHackQIdx] = useState(0);
  const [hackPicked, setHackPicked] = useState<number | null>(null);
  const [hackCorrectCount, setHackCorrectCount] = useState(0);
  const [detectiveIdx, setDetectiveIdx] = useState(0);
  const [detectivePicked, setDetectivePicked] = useState<number | null>(null);
  const [detectiveCorrectCount, setDetectiveCorrectCount] = useState(0);
  const [rescueProgram, setRescueProgram] = useState<Array<'F' | 'R' | 'L'>>(['F', 'F', 'R', 'F', 'F']);
  const [rescueStatusMsg, setRescueStatusMsg] = useState('จัดเรียงคำสั่งให้หุ่นยนต์สุนัขเดินจาก (0,0) ไปเก็บถังออกซิเจนที่ (2,2) โดยหลบหลุมอุกกาบาตที่ (0,1)');
  const [obbyBestStage, setObbyBestStage] = useState(0);
  const teleportToCoordsRef = useRef<(x: number, y: number, z: number, label: string) => void>(() => undefined);
  const [visitedTechZones, setVisitedTechZones] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(`kj_world_techpassport_${playerId}`);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });
  const applyStudioBackdropRef = useRef<(idx: number) => void>(() => undefined);
  const teleportToTechZoneRef = useRef<(zone: TechZoneInfo, openModal?: boolean) => void>(() => undefined);
  const [mode, setMode] = useState<WorldMode>('build');
  const [material, setMaterial] = useState<BlockMaterial>('grass');
  const [teacherRoom, setTeacherRoom] = useState(user?.classroom || 'ป.1');
  const [avatarColor, setAvatarColor] = useState(() => (
    localStorage.getItem(`kj_world_avatar_${playerId}`) || playerColor(playerId)
  ));
  const [avatarTechClass, setAvatarTechClass] = useState<AvatarTechClass>(() => (
    (localStorage.getItem(`kj_world_class_${playerId}`) as AvatarTechClass) || 'coder'
  ));
  const [avatarFaceStyle, setAvatarFaceStyle] = useState<AvatarFaceStyle>(() => (
    (localStorage.getItem(`kj_world_face_${playerId}`) as AvatarFaceStyle) || 'happy'
  ));
  const [activeEmote, setActiveEmote] = useState<WorldMotion | null>(null);
  const [thirdPerson, setThirdPerson] = useState(true);
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
    rebuildLocalAvatarRef.current();
  }, [avatarColor, playerId]);

  useEffect(() => {
    techClassRef.current = avatarTechClass;
    localStorage.setItem(`kj_world_class_${playerId}`, avatarTechClass);
    rebuildLocalAvatarRef.current();
  }, [avatarTechClass, playerId]);

  useEffect(() => {
    faceStyleRef.current = avatarFaceStyle;
    localStorage.setItem(`kj_world_face_${playerId}`, avatarFaceStyle);
    rebuildLocalAvatarRef.current();
  }, [avatarFaceStyle, playerId]);

  useEffect(() => {
    thirdPersonRef.current = thirdPerson;
  }, [thirdPerson]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c192c);
    scene.fog = new THREE.Fog(0x0c192c, 42, graphicsQuality === 'low' ? 92 : 140);
    const camera = new THREE.PerspectiveCamera(70, mount.clientWidth / mount.clientHeight, 0.1, 210);
    const spawn = playerSpawn(playerId);
    const playerPosition = new THREE.Vector3(spawn.x, 1.7, spawn.z);
    camera.position.copy(playerPosition);
    // เริ่มต้นหันเข้าหาบอร์ดหน่วยแรก เพื่อให้เด็กเห็นจุดโต้ตอบทันที
    const targetBoardX = [-6.7, -2.2, 2.2, 6.7]
      .reduce((closest, x) => (Math.abs(x - spawn.x) < Math.abs(closest - spawn.x) ? x : closest));
    let yaw = boards.length > 0 ? Math.atan2(-(targetBoardX - spawn.x), 8.2 + spawn.z) : 0;
    let avatarYaw = yaw;
    let velX = 0;
    let velZ = 0;
    const smoothCamPos = new THREE.Vector3(
      spawn.x + Math.sin(yaw) * 4.4,
      3.4,
      spawn.z + Math.cos(yaw) * 4.4,
    );
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
    renderer.toneMappingExposure = 1.12;
    renderer.domElement.setAttribute('aria-label', 'ห้องเรียนออนไลน์สามมิติ');
    mount.appendChild(renderer.domElement);

    const hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x0f172a, 2.15);
    scene.add(hemiLight);
    const sun = new THREE.DirectionalLight(0xf8fafc, 2.25);
    sun.position.set(16, 28, 14);
    sun.castShadow = graphicsQuality !== 'low';
    const shadowSize = graphicsQuality === 'high' ? 2048 : 1024;
    sun.shadow.mapSize.set(shadowSize, shadowSize);
    sun.shadow.camera.left = -48;
    sun.shadow.camera.right = 48;
    sun.shadow.camera.top = 48;
    sun.shadow.camera.bottom = -48;
    scene.add(sun);

    // พื้นผิวแบบพิกเซล (Minecraft Cyber Voxel) — noise เล็กๆ ต่อพิกเซล + ขอบคมด้วย NearestFilter
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
    // พื้นโลกเทคโนโลยี (Cyber Motherboard Voxel Grid 1x1) เห็นช่องตารางวางบล็อกชัดเจนและล้ำสมัย
    const makeGroundTexture = () => {
      const cells = 8, cell = 16, size = cells * cell;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      for (let cy = 0; cy < cells; cy++) {
        for (let cx = 0; cx < cells; cx++) {
          const isAlt = (cx + cy) % 2 === 0;
          const r = isAlt ? 15 : 19;
          const g = isAlt ? 29 : 37;
          const b = isAlt ? 52 : 66;
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fillRect(cx * cell, cy * cell, cell, cell);
          // จุดไมโครชิปในแต่ละช่องตาราง 1x1
          ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
          ctx.fillRect(cx * cell + 3, cy * cell + 3, 2, 2);
          ctx.fillRect(cx * cell + cell - 5, cy * cell + cell - 5, 2, 2);
          if ((cx * 3 + cy * 5) % 4 === 0) {
            ctx.fillStyle = 'rgba(34, 211, 238, 0.22)';
            ctx.fillRect(cx * cell + 7, cy * cell + 7, 2, 2);
          }
        }
      }
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.34)';
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
      new THREE.MeshStandardMaterial({ map: makeGroundTexture(), roughness: 0.78, metalness: 0.15 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.userData = { kind: 'ground', sampleColor: '#132542' };
    scene.add(ground);

    // ทางเดินไฟเบอร์ออปติกเรืองแสงจากจุดเกิดเข้าสู่โดมเทคโนโลยีกลาง
    const entryPath = new THREE.Mesh(
      new THREE.BoxGeometry(4.4, 0.08, 28),
      new THREE.MeshStandardMaterial({
        map: makeRepeatedPixelTexture(0x0f172a, 16, 2, 14),
        emissive: new THREE.Color(0x0284c7),
        emissiveIntensity: 0.18,
        roughness: 0.45,
        metalness: 0.35,
      }),
    );
    entryPath.position.set(0, 0.025, 20.5);
    entryPath.receiveShadow = true;
    scene.add(entryPath);
    [-2.25, 2.25].forEach((railX) => {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.1, 28),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 }),
      );
      rail.position.set(railX, 0.04, 20.5);
      scene.add(rail);
    });

    // พื้นลานโดมไซเบอร์กลาง (Cyber Tech Hub Floor) ลายแผงวงจรดิจิทัล
    const makeCyberHubFloorTexture = () => {
      const w = 64, h = 64;
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 2;
      ctx.strokeRect(2, 2, w - 4, h - 4);
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.28)';
      ctx.lineWidth = 1;
      ctx.strokeRect(10, 10, w - 20, h - 20);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
      ctx.fillRect(28, 28, 8, 8);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(10, 8.5);
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      pixelTextures.push(texture);
      return texture;
    };
    const classroomFloor = new THREE.Mesh(
      new THREE.BoxGeometry(20, 0.25, 17),
      new THREE.MeshStandardMaterial({
        map: makeCyberHubFloorTexture(),
        roughness: 0.45,
        metalness: 0.25,
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

    // 🏛️ โดมเทคโนโลยีเปิดโล่ง 360 องศา (Open 360° Cyber Tech Dome Pavilion)
    // มีฉากหลัง Command Wall สำหรับกระดานบทเรียนทั้ง 4 หน่วย และเสาพลังงานไซเบอร์ 6 ต้น + วงแหวนโฮโลแกรมลอยฟ้าโดยไม่มีกำแพงทึบข้างซ้าย-ขวามาบังวิวโลกเทคโนโลยี!
    const wallMaterial = new THREE.MeshStandardMaterial({
      map: makeRepeatedPixelTexture(0x0f172a, 14, 12, 4),
      roughness: 0.45,
      metalness: 0.35,
    });
    const backCommandWall = new THREE.Mesh(new THREE.BoxGeometry(20, 5.5, 0.38), wallMaterial);
    backCommandWall.position.set(0, 2.75, -8.4);
    backCommandWall.castShadow = true;
    backCommandWall.receiveShadow = true;
    scene.add(backCommandWall);
    staticColliders.push({
      minX: -10,
      maxX: 10,
      minZ: -8.6,
      maxZ: -8.2,
      minY: 0,
      maxY: 5.5,
    });

    const neonCyanTrimMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: new THREE.Color(0x0284c7),
      emissiveIntensity: 0.9,
      roughness: 0.2,
    });
    const neonGoldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: new THREE.Color(0xd97706),
      emissiveIntensity: 0.85,
      roughness: 0.25,
    });
    const pillarBodyMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.65,
      roughness: 0.3,
    });

    // ขอบเรืองแสงบนและล่างของ Command Wall
    const wallTopGlow = new THREE.Mesh(new THREE.BoxGeometry(20.4, 0.18, 0.48), neonCyanTrimMat);
    wallTopGlow.position.set(0, 5.52, -8.4);
    const wallBottomGlow = new THREE.Mesh(new THREE.BoxGeometry(20.2, 0.22, 0.46), neonGoldTrimMat);
    wallBottomGlow.position.set(0, 0.32, -8.4);
    scene.add(wallTopGlow, wallBottomGlow);

    // เสาไซเบอร์ 6 ต้นรอบโดม + คานโค้งพลังงานด้านบน เปิดมุมมอง 360° ไปยัง 5 โซนพิพิธภัณฑ์เทคโนโลยี
    const cyberDomeGroup = new THREE.Group();
    const pillarCoords: Array<[number, number]> = [
      [-10, -8.4], [10, -8.4],
      [-10, 0], [10, 0],
      [-10, 8.4], [10, 8.4],
    ];
    pillarCoords.forEach(([px, pz]) => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.68, 6.2, 0.68), pillarBodyMat);
      col.position.set(px, 3.1, pz);
      col.castShadow = true;
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.22, 5.6, 0.74), neonCyanTrimMat);
      strip.position.set(px, 3.1, pz);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.28, 0.92), neonGoldTrimMat);
      cap.position.set(px, 6.25, pz);
      cyberDomeGroup.add(col, strip, cap);
      staticColliders.push({
        minX: px - 0.42,
        maxX: px + 0.42,
        minZ: pz - 0.42,
        maxZ: pz + 0.42,
        minY: 0,
        maxY: 6.2,
      });
    });

    // คานพลังงานเชื่อมซ้าย-ขวาและหน้า-หลังเหนือศีรษะ
    [-8.4, 0, 8.4].forEach((bz) => {
      const archBeam = new THREE.Mesh(new THREE.BoxGeometry(20.6, 0.28, 0.42), pillarBodyMat);
      archBeam.position.set(0, 6.35, bz);
      const archGlow = new THREE.Mesh(new THREE.BoxGeometry(20.4, 0.12, 0.48), neonCyanTrimMat);
      archGlow.position.set(0, 6.18, bz);
      cyberDomeGroup.add(archBeam, archGlow);
    });
    [-10, 10].forEach((bx) => {
      const sideBeam = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 17.4), pillarBodyMat);
      sideBeam.position.set(bx, 6.35, 0);
      const sideGlow = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.12, 17.2), neonCyanTrimMat);
      sideGlow.position.set(bx, 6.18, 0);
      cyberDomeGroup.add(sideBeam, sideGlow);
    });

    // วงแหวน Skylight Hologram กลางเพดานโดม + ลูกโลกแกนพลังงานหมุนได้
    const skylightRing = new THREE.Mesh(
      new THREE.TorusGeometry(4.8, 0.14, 10, 48),
      neonCyanTrimMat,
    );
    skylightRing.rotation.x = Math.PI / 2;
    skylightRing.position.set(0, 6.45, 0);
    const skylightInnerRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.6, 0.1, 10, 36),
      neonGoldTrimMat,
    );
    skylightInnerRing.rotation.x = Math.PI / 2;
    skylightInnerRing.position.set(0, 6.65, 0);
    const domeCoreOrb = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.85, 0),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: new THREE.Color(0x0ea5e9),
        emissiveIntensity: 0.95,
        wireframe: false,
        roughness: 0.15,
      }),
    );
    domeCoreOrb.position.set(0, 7.1, 0);
    cyberDomeGroup.add(skylightRing, skylightInnerRing, domeCoreOrb);
    scene.add(cyberDomeGroup);

    // ภูเขาคริสตัลข้อมูลว็อกเซล (Cyber Data Crystal Hills) รอบขอบแผนที่ ใช้ InstancedMesh เพื่อลด draw call
    const terrainGeometry = new THREE.BoxGeometry(1, 1, 1);
    const dirtMaterial = new THREE.MeshStandardMaterial({
      map: makePixelTexture(0x1e293b, 22),
      roughness: 0.75,
      metalness: 0.3,
    });
    const grassMaterial = new THREE.MeshStandardMaterial({
      map: makePixelTexture(0x0ea5e9, 26),
      emissive: new THREE.Color(0x0369a1),
      emissiveIntensity: 0.35,
      roughness: 0.35,
    });
    const hillCenters = [[-62, -56], [62, -56], [-64, 56], [64, 56]] as const;
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

    // ท้องฟ้าโลกไซเบอร์: ดวงอาทิตย์ควอนตัม + วงแหวนดาวเทียมโคจร (Orbital Cyber Ring)
    const skyDecor = new THREE.Group();
    const cubeSun = new THREE.Mesh(
      new THREE.BoxGeometry(4.5, 4.5, 1),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, fog: false }),
    );
    cubeSun.position.set(-28, 27, -42);
    skyDecor.add(cubeSun);
    const orbitalSkyRing = new THREE.Mesh(
      new THREE.TorusGeometry(32, 0.22, 8, 64),
      new THREE.MeshBasicMaterial({ color: 0x0ea5e9, fog: false }),
    );
    orbitalSkyRing.rotation.x = Math.PI / 2.25;
    orbitalSkyRing.rotation.y = 0.28;
    orbitalSkyRing.position.set(0, 24, 0);
    skyDecor.add(orbitalSkyRing);
    const cloudMaterial = new THREE.MeshBasicMaterial({ color: 0x38bdf8, fog: false });
    [[-18, 19, -28], [20, 22, -35], [6, 18, 32]].forEach(([x, y, z], cloudIndex) => {
      const cloud = new THREE.Group();
      [[0, 0, 0, 4.5], [2.8, 0, 0, 3], [-2.8, 0, 0, 2.5]].forEach(([cx, cy, cz, width]) => {
        const part = new THREE.Mesh(new THREE.BoxGeometry(width, 0.9, 1.4), cloudMaterial);
        part.position.set(cx, cy, cz);
        cloud.add(part);
      });
      cloud.position.set(x, y, z + cloudIndex * 2);
      skyDecor.add(cloud);
    });
    scene.add(skyDecor);

    applyWorldTimeRef.current = (timeMode: 'day' | 'sunset' | 'night') => {
      if (timeMode === 'night') {
        scene.background = new THREE.Color(0x050b14);
        scene.fog = new THREE.Fog(0x050b14, 42, graphicsQuality === 'low' ? 92 : 140);
        hemiLight.color.setHex(0x38bdf8);
        hemiLight.groundColor.setHex(0x090d16);
        hemiLight.intensity = 1.1;
        sun.color.setHex(0x7dd3fc);
        sun.intensity = 1.05;
        (cubeSun.material as THREE.MeshBasicMaterial).color.setHex(0xe2e8f0);
      } else if (timeMode === 'sunset') {
        scene.background = new THREE.Color(0x2e1065);
        scene.fog = new THREE.Fog(0x2e1065, 42, graphicsQuality === 'low' ? 92 : 140);
        hemiLight.color.setHex(0xf472b6);
        hemiLight.groundColor.setHex(0x1e1b4b);
        hemiLight.intensity = 1.75;
        sun.color.setHex(0xfb923c);
        sun.intensity = 1.9;
        (cubeSun.material as THREE.MeshBasicMaterial).color.setHex(0xf97316);
      } else {
        scene.background = new THREE.Color(0x0c192c);
        scene.fog = new THREE.Fog(0x0c192c, 42, graphicsQuality === 'low' ? 92 : 140);
        hemiLight.color.setHex(0xbae6fd);
        hemiLight.groundColor.setHex(0x0f172a);
        hemiLight.intensity = 2.15;
        sun.color.setHex(0xf8fafc);
        sun.intensity = 2.25;
        (cubeSun.material as THREE.MeshBasicMaterial).color.setHex(0x38bdf8);
      }
    };

    // ป้ายแลนด์มาร์กหน้าโดมเทคโนโลยี "KRUJAMES DIGITAL PLAYGROUND · CYBER TECH WORLD 3D"
    const makeSchoolBannerTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 192;
      const ctx = canvas.getContext('2d')!;
      const grad = ctx.createLinearGradient(0, 0, 1024, 192);
      grad.addColorStop(0, '#090d16');
      grad.addColorStop(0.5, '#0f172a');
      grad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 192);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 10;
      ctx.strokeRect(8, 8, 1008, 176);
      ctx.fillStyle = '#fde047';
      ctx.font = '800 46px Sarabun, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🚀 KRUJAMES DIGITAL PLAYGROUND · โลกเทคโนโลยี 3D', 512, 72);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '700 28px Sarabun, sans-serif';
      ctx.fillText('10 โซนพิพิธภัณฑ์ไอที อพวช. · ลานสร้างบล็อก 8 แปลง · หอคอย Sky Obby & 4 มินิเกมโค้ดดิ้ง', 512, 138);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      pixelTextures.push(texture);
      return texture;
    };
    const bannerTex = makeSchoolBannerTexture();
    const schoolBanner = new THREE.Mesh(
      new THREE.BoxGeometry(14.5, 1.95, 0.32),
      new THREE.MeshStandardMaterial({
        map: bannerTex,
        emissive: new THREE.Color(0x0284c7),
        emissiveIntensity: 0.38,
        roughness: 0.3,
      }),
    );
    schoolBanner.position.set(0, 7.45, 8.4);
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

    // เส้นลายวงจรดิจิทัลเรืองแสงเชื่อมลานกลางไปสู่ทั้ง 10 โซนพิพิธภัณฑ์เทคโนโลยีสารสนเทศ
    const circuitTraceMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    [
      [0, 12.5, 0.45, 7],
      [-9.5, 12.5, 16, 0.35],
      [9.5, 12.5, 16, 0.35],
      [-14.5, 5.5, 0.35, 42],
      [14.5, 5.5, 0.35, 42],
      [0, -14.5, 32, 0.35],
      [0, -17.5, 0.45, 7],
      [-19, 25.5, 10, 0.35],
      [19, 25.5, 10, 0.35],
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
    chipMascot.position.set(0.5, 0, -2.6);

    // 3 ตู้จัดแสดงนิทรรศการ (จากภาพที่ 2, 5, 7, 9):
    // 1) ตู้กระจกรุ่นที่ 1 หลอดสุญญากาศ (1940-1956)
    // 2) ตู้กระจกรุ่นที่ 4 ไมโครโพรเซสเซอร์ & คอมคลาสสิก (1972-2010)
    // 3) แท่นแว่น VR "เร็ว แรง ทะลุอนาคต (FAST AND FURIOUS)"
    const glassCaseMat = new THREE.MeshStandardMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.35,
      roughness: 0.15,
    });
    const casePedestalMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });

    const case1 = new THREE.Group();
    const ped1 = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.85, 0.95), casePedestalMat);
    ped1.position.y = 0.425;
    const glass1 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.75, 0.9), glassCaseMat);
    glass1.position.y = 1.22;
    const vacuumTube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.16, 0.45, 12),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: new THREE.Color(0xf59e0b), emissiveIntensity: 0.85 }),
    );
    vacuumTube.position.y = 1.15;
    case1.add(ped1, glass1, vacuumTube);
    case1.position.set(0.6, 0, -1.25);

    const case2 = new THREE.Group();
    const ped2 = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.85, 0.95), casePedestalMat);
    ped2.position.y = 0.425;
    const glass2 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.75, 0.9), glassCaseMat);
    glass2.position.y = 1.22;
    const retroPc = new THREE.Mesh(
      new THREE.BoxGeometry(0.52, 0.28, 0.48),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6 }),
    );
    retroPc.position.y = 1.05;
    const cpuChip = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.08, 0.24),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.6, roughness: 0.3 }),
    );
    cpuChip.position.set(0, 1.28, 0);
    case2.add(ped2, glass2, retroPc, cpuChip);
    case2.position.set(0.6, 0, 0.25);

    const vrPod = new THREE.Group();
    const ped3 = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.85, 0.95), casePedestalMat);
    ped3.position.y = 0.425;
    const vrVisor = new THREE.Mesh(
      new THREE.BoxGeometry(0.54, 0.28, 0.36),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.5, roughness: 0.25 }),
    );
    vrVisor.position.y = 1.32;
    const vrStrap = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.14, 0.44),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc }),
    );
    vrStrap.position.set(0.08, 1.32, 0);
    vrPod.add(ped3, vrVisor, vrStrap);
    vrPod.position.set(0.6, 0, 1.85);

    // 4) โมเดล IBM 1620 เครื่องคอมพิวเตอร์เครื่องแรกของประเทศไทย (พ.ศ. 2506) + ตู้เทปแม่เหล็กหมุนคู่ IBM 729 (จากภาพ IMG_111650!)
    const ibm1620Group = new THREE.Group();
    const ibmDesk = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.78, 0.85),
      new THREE.MeshStandardMaterial({ color: 0xd6d3c4, roughness: 0.6 }),
    );
    ibmDesk.position.set(0, 0.39, 0);
    const ibmConsole = new THREE.Mesh(
      new THREE.BoxGeometry(1.42, 0.36, 0.42),
      new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.4 }),
    );
    ibmConsole.position.set(0, 0.96, -0.15);
    const ibmTapeCabinet = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 1.95, 0.62),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.4, roughness: 0.45 }),
    );
    ibmTapeCabinet.position.set(-1.25, 0.975, -0.1);
    const tapeReelMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.3, roughness: 0.3 });
    const tapeReel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 16), tapeReelMat);
    tapeReel1.rotation.x = Math.PI / 2;
    tapeReel1.position.set(-1.45, 1.52, 0.23);
    const tapeReel2 = tapeReel1.clone();
    tapeReel2.position.set(-1.05, 1.52, 0.23);
    ibm1620Group.add(ibmDesk, ibmConsole, ibmTapeCabinet, tapeReel1, tapeReel2);
    ibm1620Group.rotation.y = -Math.PI / 2;
    ibm1620Group.position.set(0.55, 0, 3.35);

    zone3Group.add(hcwWall, chipMascot, case1, case2, vrPod, ibm1620Group);
    zone3Group.position.set(19.5, 0, -1);
    tagExhibitGroup(zone3Group, zone3Info);
    scene.add(zone3Group);
    techAnimatedObjects.push((now, delta) => {
      chipMascot.position.y = Math.abs(Math.sin(now * 0.003)) * 0.18;
      vrVisor.rotation.y += delta * 1.1;
      vrStrap.rotation.y = vrVisor.rotation.y;
      tapeReel1.rotation.z += delta * 2.4;
      tapeReel2.rotation.z -= delta * 2.4;
    });

    // --- ZONE 4 (wireless_5g): วิวัฒนาการเครือข่ายไร้สาย 1G → 2G → 3G → 4G → 5G (x = -19.5, z = 12.5) ---
    const zone4Info = TECH_ZONES.find((z) => z.id === 'wireless_5g')!;
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

    // --- ZONE 5 (green_studio): KRUJAMES STUDIO · สตูดิโอถ่ายทอดสด & เวที GREEN SCREEN (x = 19.5, z = 12.5) ---
    const zone5Info = TECH_ZONES.find((z) => z.id === 'green_studio')!;
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
    const studioDesk = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.82, 1.4),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 }),
    );
    studioDesk.position.set(1.3, 0.65, 0);
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

    const stemDecor = new THREE.Group();
    const atomCore = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.55, 0.55),
      new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: new THREE.Color(0xe11d48), emissiveIntensity: 0.5 }),
    );
    atomCore.position.set(2.4, 2.2, -3.5);
    const atomRing1 = new THREE.Mesh(
      new THREE.TorusGeometry(0.95, 0.08, 8, 24),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: new THREE.Color(0x0284c7), emissiveIntensity: 0.45 }),
    );
    atomRing1.position.copy(atomCore.position);
    atomRing1.rotation.y = Math.PI / 3;
    const yellowTriangle = new THREE.Mesh(
      new THREE.ConeGeometry(1.15, 2.1, 3),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 }),
    );
    yellowTriangle.position.set(2.4, 2.4, 3.5);
    yellowTriangle.rotation.z = 0.25;
    const ideaBulb = new THREE.Mesh(
      new THREE.BoxGeometry(0.68, 0.85, 0.68),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: new THREE.Color(0xfacc15), emissiveIntensity: 0.9 }),
    );
    ideaBulb.position.set(2.4, 3.8, 0);
    stemDecor.add(atomCore, atomRing1, yellowTriangle, ideaBulb);

    applyStudioBackdropRef.current = (idx: number) => {
      const palette: Array<[number, number]> = [
        [0x16a34a, 0x15803d],
        [0x1e1b4b, 0x4f46e5],
        [0x1e3a8a, 0x0284c7],
        [0x4a044e, 0xd97706],
      ];
      const [baseHex, emHex] = palette[idx] || palette[0];
      chromaGreenMat.color.setHex(baseHex);
      chromaGreenMat.emissive.setHex(emHex);
      (camMonitor.material as THREE.MeshStandardMaterial).color.setHex(baseHex);
      (camMonitor.material as THREE.MeshStandardMaterial).emissive.setHex(emHex);
    };

    zone5Group.add(studioStage, greenBackdrop, studioDesk, camGroup, stemDecor);
    zone5Group.position.set(19.5, 0, 12.5);
    tagExhibitGroup(zone5Group, zone5Info);
    scene.add(zone5Group);
    techAnimatedObjects.push((_now, delta) => {
      atomRing1.rotation.z += delta * 1.4;
    });

    // --- ZONE 6 (logic_secret_code): 2. ตรรกศาสตร์และอัลกอริทึม & สร้างรหัสลับ CREATING A SECRET CODE (x = -19.5, z = -14.5) ---
    const zoneLogicInfo = TECH_ZONES.find((z) => z.id === 'logic_secret_code')!;
    const zoneLogicGroup = new THREE.Group();
    const logicWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 4.3, 6.8),
      new THREE.MeshStandardMaterial({
        map: makeExhibitPosterTexture(
          '#1e3a8a',
          '#0f172a',
          '#60a5fa',
          'ZONE 2 · LOGIC & ALGORITHM',
          'ตรรกศาสตร์ อัลกอริทึม & สร้างรหัสลับ',
          'CREATING A SECRET CODE · เปิด/ปิดป้ายไฟแทนค่าตัวอักษร A=1..Z=26',
          [
            '• ตรรกศาสตร์ (Logic): ศาสตร์แห่งเหตุผลและการพิสูจน์ความจริง (True / False)',
            '• อัลกอริทึม (Algorithm): ลำดับขั้นตอนการแก้ปัญหาอย่างเป็นระบบทีละขั้น',
            '• สร้างรหัสลับ: แปลงภาษาของมนุษย์เป็นรหัสตัวเลข (DRESS · WATER · APPLE)',
          ],
        ),
        roughness: 0.4,
      }),
    );
    logicWall.position.set(-2.2, 2.2, 0);
    // แผงปุ่มไฟสี่เหลี่ยม 4x4 เรืองแสงบนบอร์ดสร้างรหัสลับ (เหมือนภาพ IMG_111928!)
    const secretTiles: THREE.Mesh[] = [];
    for (let r = 0; r < 4; r += 1) {
      for (let c = 0; c < 4; c += 1) {
        const isLit = (r + c) % 2 === 0;
        const tile = new THREE.Mesh(
          new THREE.BoxGeometry(0.14, 0.42, 0.42),
          new THREE.MeshStandardMaterial({
            color: isLit ? 0xfef08a : 0xe2e8f0,
            emissive: new THREE.Color(isLit ? 0x38bdf8 : 0x1e293b),
            emissiveIntensity: isLit ? 0.85 : 0.15,
          }),
        );
        tile.position.set(-1.95, 1.1 + r * 0.62, -1.05 + c * 0.68);
        secretTiles.push(tile);
        zoneLogicGroup.add(tile);
      }
    }
    // แผ่นเกมเส้นทางอัลกอริทึมบนพื้น (Algorithm Decision Tree Floor Mat จากภาพ IMG_111928!)
    const algoFloorMat = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 0.06, 5.2),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 }),
    );
    algoFloorMat.position.set(0.2, 0.03, 0);
    zoneLogicGroup.add(logicWall, algoFloorMat);
    zoneLogicGroup.position.set(-19.5, 0, -14.5);
    tagExhibitGroup(zoneLogicGroup, zoneLogicInfo);
    scene.add(zoneLogicGroup);
    techAnimatedObjects.push((now) => {
      const step = Math.floor(now * 0.0025);
      secretTiles.forEach((tile, idx) => {
        const active = (idx + step) % 5 === 0;
        const mat = tile.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = active ? 0.95 : 0.18;
      });
    });

    // --- ZONE 7 (program_software_robodog): 4. โปรแกรม ภาษาคอมพิวเตอร์ ซอฟต์แวร์ & หุ่นยนต์สุนัข 4 ขา (x = 19.5, z = -14.5) ---
    const zoneProgInfo = TECH_ZONES.find((z) => z.id === 'program_software_robodog')!;
    const zoneProgGroup = new THREE.Group();
    const progWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 4.3, 7.0),
      new THREE.MeshStandardMaterial({
        map: makeExhibitPosterTexture(
          '#ca8a04',
          '#be123c',
          '#fde047',
          'ZONE 4 · PROGRAM & COMPUTER LANGUAGE',
          'ภาษาคอมพิวเตอร์ ซอฟต์แวร์ & หุ่นยนต์สุนัข',
          'Compiler vs Interpreter · ภาษา 3 ระดับ · System & Application Software',
          [
            '• 1. คอมไพเลอร์ (แปลทั้งโปรแกรมรวดเดียว) vs 2. อินเทอร์พรีเตอร์ (แปลทีละบรรทัด)',
            '• 3 ระดับภาษา: ภาษาเครื่อง (0/1) → ภาษาระดับต่ำ (Assembly) → ภาษาระดับสูง (Python #1)',
            '• ซอฟต์แวร์ระบบ (Windows, macOS, Linux, iOS) & ซอฟต์แวร์ประยุกต์ + เกม SPACE RESCUE',
          ],
        ),
        roughness: 0.45,
      }),
    );
    progWall.position.set(2.2, 2.2, 0);
    // โมเดล 3D หุ่นยนต์สุนัข 4 ขา (Quadruped Robot Dog สีดำบนแท่นจัดแสดง จากภาพ IMG_112026!)
    const roboDogPedestal = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 0.78, 1.35),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 }),
    );
    roboDogPedestal.position.set(0.2, 0.39, 0);
    const roboDog = new THREE.Group();
    const dogBlackMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.65, roughness: 0.28 });
    const dogBody = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.26, 0.38), dogBlackMat);
    dogBody.position.set(0, 0.58, 0);
    const dogHead = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.24, 0.34), dogBlackMat);
    dogHead.position.set(-0.52, 0.66, 0);
    const dogCamLens = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.1, 0.22),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: new THREE.Color(0x0284c7), emissiveIntensity: 0.9 }),
    );
    dogCamLens.position.set(-0.69, 0.66, 0);
    const dogLegs: THREE.Mesh[] = [];
    [[-0.32, -0.17], [-0.32, 0.17], [0.32, -0.17], [0.32, 0.17]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.52, 0.11), dogBlackMat);
      leg.position.set(lx, 0.26, lz);
      dogLegs.push(leg);
      roboDog.add(leg);
    });
    roboDog.add(dogBody, dogHead, dogCamLens);
    roboDog.position.set(0.2, 0.78, 0);
    zoneProgGroup.add(progWall, roboDogPedestal, roboDog);
    zoneProgGroup.position.set(19.5, 0, -14.5);
    tagExhibitGroup(zoneProgGroup, zoneProgInfo);
    scene.add(zoneProgGroup);
    techAnimatedObjects.push((now) => {
      const t = now * 0.005;
      roboDog.position.y = 0.78 + Math.abs(Math.sin(t)) * 0.05;
      dogHead.rotation.z = Math.sin(t * 0.7) * 0.12;
      dogLegs.forEach((leg, idx) => {
        leg.rotation.z = Math.sin(t + (idx % 2 === 0 ? 0 : Math.PI)) * 0.22;
      });
    });

    // --- ZONE 8 (quantum_computer): 5. คอมพิวเตอร์เชิงควอนตัม QUANTUM COMPUTER 0 KELVIN (x = 0, z = -20.5) ---
    const zoneQuantumInfo = TECH_ZONES.find((z) => z.id === 'quantum_computer')!;
    const zoneQuantumGroup = new THREE.Group();
    const quantumWall = new THREE.Mesh(
      new THREE.BoxGeometry(7.4, 4.3, 0.32),
      new THREE.MeshStandardMaterial({
        map: makeExhibitPosterTexture(
          '#064e3b',
          '#881337',
          '#34d399',
          'ZONE 5 · QUANTUM COMPUTER (-273.15 °C)',
          'คอมพิวเตอร์เชิงควอนตัม · เหมือนหรือต่าง?',
          'ประมวลผลด้วยกลศาสตร์ควอนตัม (Qubit) ภายใต้อุณหภูมิ 0 องศาเคลวิน',
          [
            '• คอมพิวเตอร์ทั่วไปใช้ Bit (0 หรือ 1) เน้นลดขนาดให้พกพาสะดวกในชีวิตประจำวัน',
            '• คอมพิวเตอร์ควอนตัมใช้ Qubit ซ้อนทับสถานะ แก้โจทย์ข้อมูลซับซ้อนมหาศาลได้รวดเร็ว',
            '• ต้องควบคุมอนุภาคที่ 0 เคลวิน (-273.15°C) และใช้พื้นที่ติดตั้ง 30–50 ตร.ม. กันสั่นสะเทือน',
          ],
        ),
        roughness: 0.4,
      }),
    );
    quantumWall.position.set(0, 2.2, -2.2);
    // โมเดล 3D เครื่องควอนตัมทรงแชนเดอเลียร์สีทองหลายชั้นในตู้กระจกไครโอเจนิก (จากภาพ IMG_112042!)
    const quantumChandelier = new THREE.Group();
    const goldQuantumMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: new THREE.Color(0xd97706),
      emissiveIntensity: 0.55,
      metalness: 0.85,
      roughness: 0.18,
    });
    [
      [1.1, 3.55, 0.14],
      [0.92, 3.0, 0.12],
      [0.74, 2.45, 0.12],
      [0.54, 1.9, 0.1],
      [0.32, 1.38, 0.18],
    ].forEach(([radius, yLevel, thickness]) => {
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, thickness, 20), goldQuantumMat);
      disc.position.y = yLevel;
      quantumChandelier.add(disc);
    });
    const centralRod = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.08, 2.5, 12), goldQuantumMat);
    centralRod.position.y = 2.45;
    const cryoGlass = new THREE.Mesh(
      new THREE.CylinderGeometry(1.32, 1.32, 3.4, 24),
      new THREE.MeshStandardMaterial({ color: 0x6ee7b7, transparent: true, opacity: 0.25, roughness: 0.1 }),
    );
    cryoGlass.position.y = 2.3;
    const quantumBase = new THREE.Mesh(
      new THREE.CylinderGeometry(1.45, 1.55, 0.6, 24),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.6, roughness: 0.3 }),
    );
    quantumBase.position.y = 0.3;
    quantumChandelier.add(centralRod, cryoGlass, quantumBase);
    quantumChandelier.position.set(0, 0, 0.4);
    zoneQuantumGroup.add(quantumWall, quantumChandelier);
    zoneQuantumGroup.position.set(0, 0, -20.5);
    tagExhibitGroup(zoneQuantumGroup, zoneQuantumInfo);
    scene.add(zoneQuantumGroup);
    techAnimatedObjects.push((_now, delta) => {
      quantumChandelier.rotation.y += delta * 0.55;
    });

    // --- ZONE 9 (ai_revolution_agentic): AI REVOLUTION : THE NEW HUMAN · Agentic AI, Cloud, 3D Print & Deepfake (x = -23.5, z = 25.5) ---
    const zoneAiInfo = TECH_ZONES.find((z) => z.id === 'ai_revolution_agentic')!;
    const zoneAiGroup = new THREE.Group();
    const aiWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 4.5, 7.6),
      new THREE.MeshStandardMaterial({
        map: makeExhibitPosterTexture(
          '#090d16',
          '#1e3a8a',
          '#38bdf8',
          'AI REVOLUTION : THE NEW HUMAN',
          'ปฏิวัติปัญญาประดิษฐ์ · Agentic AI & Deepfake',
          'หุ่นยนต์ฮิวแมนนอยด์ · Cloud Computing · 3D Printing · IoE · ทักษะดิจิทัล',
          [
            '• Agentic AI: เอไอที่คิดวางแผน แตกงานย่อย และใช้เครื่องมือทำงานแทนมนุษย์ได้อัตโนมัติ',
            '• Cloud Computing & IoE: ก้อนเมฆแห่งมหาเครือข่ายข้อมูล และทุกสิ่งเชื่อมผ่านอินเทอร์เน็ต',
            '• รู้เท่าทัน Deepfake & โซเชียล: ค้นหาต้นฉบับ · เทียบหลายแหล่ง · คิดก่อนแชร์',
          ],
        ),
        roughness: 0.35,
      }),
    );
    aiWall.position.set(-2.6, 2.25, 0);
    // เวทีกระจกกลม + หุ่นยนต์ฮิวแมนนอยด์สีขาว (Humanoid Robot) + ก้อนเมฆ Cloud Computing ลอยเหนือหัว (จากภาพ IMG_112407!)
    const humanoidStage = new THREE.Mesh(
      new THREE.CylinderGeometry(1.75, 1.85, 0.28, 24),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.6, roughness: 0.25 }),
    );
    humanoidStage.position.set(0.2, 0.14, 0);
    const humanoidRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.72, 0.06, 8, 32),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 }),
    );
    humanoidRing.rotation.x = Math.PI / 2;
    humanoidRing.position.set(0.2, 0.29, 0);
    const humanoidRobot = new THREE.Group();
    const whiteBotMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.35, roughness: 0.25 });
    const botJointMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 });
    const hTorso = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.88, 0.36), whiteBotMat);
    hTorso.position.y = 1.45;
    const hHead = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 16), whiteBotMat);
    hHead.position.y = 2.15;
    const hVisor = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.12, 0.16),
      new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: new THREE.Color(0xe11d48), emissiveIntensity: 0.9 }),
    );
    hVisor.position.set(0.18, 2.15, 0);
    const hLegL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.95, 10), botJointMat);
    hLegL.position.set(0, 0.5, -0.16);
    const hLegR = hLegL.clone();
    hLegR.position.z = 0.16;
    humanoidRobot.add(hTorso, hHead, hVisor, hLegL, hLegR);
    humanoidRobot.position.set(0.2, 0.28, 0);
    // ก้อนเมฆ Cloud Computing ลอยเหนือเวที
    const cloudSculpture = new THREE.Group();
    const cloudMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.85 });
    [[0, 0, 0, 0.75], [0, 0.2, 0.55, 0.58], [0, -0.1, -0.55, 0.58]].forEach(([cx, cy, cz, r]) => {
      const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), cloudMat);
      puff.position.set(cx, cy, cz);
      cloudSculpture.add(puff);
    });
    cloudSculpture.position.set(0.2, 4.15, -1.6);
    zoneAiGroup.add(aiWall, humanoidStage, humanoidRing, humanoidRobot, cloudSculpture);
    zoneAiGroup.position.set(-23.5, 0, 25.5);
    tagExhibitGroup(zoneAiGroup, zoneAiInfo);
    scene.add(zoneAiGroup);
    techAnimatedObjects.push((now) => {
      humanoidRobot.rotation.y = Math.sin(now * 0.0015) * 0.45;
      cloudSculpture.position.y = 4.15 + Math.sin(now * 0.002) * 0.14;
    });

    // --- ZONE 10 (retro_console_esports): วิวัฒนาการเครื่องเกมคอนโซล Famicom → Super Famicom → N64 & อาชีพวงการเกม (x = 23.5, z = 25.5) ---
    const zoneRetroInfo = TECH_ZONES.find((z) => z.id === 'retro_console_esports')!;
    const zoneRetroGroup = new THREE.Group();
    const retroWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 4.5, 7.6),
      new THREE.MeshStandardMaterial({
        map: makeExhibitPosterTexture(
          '#be185d',
          '#4c1d95',
          '#facc15',
          'RETRO CONSOLE ARCHIVE & E-SPORTS CAREER',
          'วิวัฒนาการเกมคอนโซล & สายอาชีพวงการเกม',
          'Famicom (1983) → Super Famicom (1990) → Nintendo 64 (1996)',
          [
            '• 1983 Famicom (8-Bit): จุดเริ่มต้นตำนาน Super Mario Bros. & Mega Man บนทีวี CRT',
            '• 1990 Super Famicom (16-Bit): ยกระดับสีสันกราฟิกและเสียงดนตรี Super Mario World',
            '• 1996 Nintendo 64 (64-Bit 3D): ก้าวสู่โลกโพลิกอน 3 มิติ & สายอาชีพ E-Sports ยุคใหม่',
          ],
        ),
        roughness: 0.4,
      }),
    );
    retroWall.position.set(2.6, 2.25, 0);
    // แท่นทีวี CRT 3 เครื่องพร้อมเครื่องเกม Famicom (ขาว-แดง), Super Famicom (เทา), Nintendo 64 (ดำ) (จากภาพ IMG_112552!)
    [
      [-2.1, 0xdc2626, 0x38bdf8],
      [0, 0x94a3b8, 0x4ade80],
      [2.1, 0x1e293b, 0xfacc15],
    ].forEach(([zOffset, consoleHex, screenHex]) => {
      const stand = new THREE.Mesh(
        new THREE.BoxGeometry(1.05, 0.92, 1.15),
        new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.5 }),
      );
      stand.position.set(0.5, 0.46, zOffset);
      const crtTv = new THREE.Mesh(
        new THREE.BoxGeometry(0.76, 0.68, 0.82),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 }),
      );
      crtTv.position.set(0.62, 1.26, zOffset);
      const crtScreen = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.52, 0.66),
        new THREE.MeshStandardMaterial({
          color: screenHex,
          emissive: new THREE.Color(screenHex),
          emissiveIntensity: 0.75,
        }),
      );
      crtScreen.position.set(0.22, 1.26, zOffset);
      const consoleBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.36, 0.14, 0.44),
        new THREE.MeshStandardMaterial({ color: consoleHex, roughness: 0.35 }),
      );
      consoleBox.position.set(0.12, 0.99, zOffset);
      zoneRetroGroup.add(stand, crtTv, crtScreen, consoleBox);
    });
    zoneRetroGroup.add(retroWall);
    zoneRetroGroup.position.set(23.5, 0, 25.5);
    tagExhibitGroup(zoneRetroGroup, zoneRetroInfo);
    scene.add(zoneRetroGroup);

    // โครงเพดานไซเบอร์โปร่งแสง (Cyber Skylight Grid) + แถบไฟนีออน LED เติมแสงในโดม
    const roofBeams = new THREE.Group();
    const beamMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.7,
      roughness: 0.25,
    });
    [-6.5, 6.5].forEach((x) => {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 16.8), beamMaterial);
      beam.position.set(x, 6.15, 0);
      roofBeams.add(beam);
    });
    if (graphicsQuality !== 'low') {
      const lampMaterial = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      [-5, 5].forEach((x) => {
        [-4, 2.5].forEach((z) => {
          const lamp = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 0.36), lampMaterial);
          lamp.position.set(x, 6.02, z);
          roofBeams.add(lamp);
        });
      });
      const roomFill = new THREE.PointLight(0xbae6fd, 16, 24, 1.5);
      roomFill.position.set(0, 5.4, 0);
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

    const tableMaterial = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.45, roughness: 0.25 });
    const tableLegMaterial = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.65, roughness: 0.3 });
    const tableGlowMaterial = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: new THREE.Color(0x0284c7),
      emissiveIntensity: 0.85,
      roughness: 0.2,
    });
    // แพลตฟอร์มที่ยืน/กระโดดขึ้นไปเหยียบได้ (เช่น ผิวโต๊ะ Cyber Workstation) — AABB + ความสูงผิวด้านบน
    const platforms: { minX: number; maxX: number; minZ: number; maxZ: number; top: number }[] = [];
    // ผิวพื้นห้องเรียนสูง 0.205m จากระดับลานดิน
    platforms.push({ minX: -10, maxX: 10, minZ: -8.5, maxZ: 8.5, top: 0.205 });
    [-5.2, 0, 5.2].forEach((x) => {
      [0, 4.3].forEach((z) => {
        const table = new THREE.Group();
        const top = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.16, 1.45), tableMaterial);
        top.position.y = 1.05;
        top.castShadow = true;
        const edgeGlow = new THREE.Mesh(new THREE.BoxGeometry(3.64, 0.05, 1.49), tableGlowMaterial);
        edgeGlow.position.y = 1.05;
        table.add(top, edgeGlow);
        // จอโฮโลแกรมจำลอง 2 เครื่องบนโต๊ะแล็บไซเบอร์
        [-0.95, 0.95].forEach((mx) => {
          const holoPad = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.03, 0.36), tableLegMaterial);
          holoPad.position.set(mx, 1.145, 0);
          const holoScreen = new THREE.Mesh(
            new THREE.BoxGeometry(0.54, 0.32, 0.03),
            new THREE.MeshStandardMaterial({
              color: 0x38bdf8,
              emissive: new THREE.Color(0x0ea5e9),
              emissiveIntensity: 0.75,
              transparent: true,
              opacity: 0.72,
            }),
          );
          holoScreen.position.set(mx, 1.31, -0.14);
          table.add(holoPad, holoScreen);
        });
        [-1.5, 1.5].forEach((legX) => [-0.52, 0.52].forEach((legZ) => {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1, 0.16), tableLegMaterial);
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
        new THREE.BoxGeometry(0.68, 2.9, 0.68),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.25 }),
      );
      trunk.position.y = 1.45;
      trunk.castShadow = true;
      const leafMaterial = new THREE.MeshStandardMaterial({
        map: makePixelTexture(0x06b6d4, 24),
        emissive: new THREE.Color(0x0284c7),
        emissiveIntensity: 0.55,
        transparent: true,
        opacity: 0.88,
        roughness: 0.25,
      });
      const crowns = [
        [0, 3.65, 0, 3.2, 1.5, 3.2],
        [0, 4.85, 0, 2.2, 1.2, 2.2],
        [0.9, 4.1, 0, 1.5, 1.5, 1.5],
        [-0.9, 4.1, 0, 1.5, 1.5, 1.5],
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

    // =========================================================================
    // 🏗️ 8 แปลงลานสร้างสรรค์ของนักเรียน (STUDENT BUILDER PLOTS · W1–W4 & E1–E4)
    // ขยายเขตแดนออกไปวงนอก (x = ±40) พร้อมกรอบนีออน 10×10 ช่อง และเสาป้ายประจำแปลง
    // =========================================================================
    [
      [-27, 0, 22, 0.35],
      [27, 0, 22, 0.35],
      [-40, 3, 0.4, 52],
      [40, 3, 0.4, 52],
    ].forEach(([tx, tz, tw, td]) => {
      const road = new THREE.Mesh(
        new THREE.BoxGeometry(tw, 0.05, td),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 }),
      );
      road.position.set(tx, 0.025, tz);
      scene.add(road);
    });

    BUILDER_PLOTS.forEach((plot) => {
      const plotGroup = new THREE.Group();
      const plotColor = new THREE.Color(plot.color);
      const borderMat = new THREE.MeshBasicMaterial({ color: plotColor });
      const padMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        emissive: plotColor,
        emissiveIntensity: 0.12,
        roughness: 0.55,
      });
      const padFloor = new THREE.Mesh(new THREE.BoxGeometry(10, 0.05, 10), padMat);
      padFloor.position.set(0, 0.02, 0);
      padFloor.userData = { kind: 'ground', sampleColor: plot.hex };
      plotGroup.add(padFloor);

      // กรอบนีออนรอบแปลง 10×10
      [
        [0, -5, 10.2, 0.18],
        [0, 5, 10.2, 0.18],
        [-5, 0, 0.18, 10.2],
        [5, 0, 0.18, 10.2],
      ].forEach(([bx, bz, bw, bd]) => {
        const edge = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.1, bd), borderMat);
        edge.position.set(bx, 0.06, bz);
        plotGroup.add(edge);
      });

      // ป้ายโฮโลแกรมประจำแปลง (คลิกเพื่อเปิดโหมดสร้างบล็อกหรือ Code Builder ทันที)
      const signPost = new THREE.Mesh(
        new THREE.BoxGeometry(3.4, 1.35, 0.2),
        new THREE.MeshStandardMaterial({
          map: makeExhibitPosterTexture(
            '#0f172a',
            '#1e293b',
            plot.hex,
            `BUILDER PLOT ${plot.id.toUpperCase()} (10×10)`,
            plot.label,
            `หัวข้อแนะนำ: ${plot.theme}`,
            [
              '• พื้นที่ส่วนตัว 10×10 ช่อง สูงสุด 36 ชั้น สำหรับสร้างผลงาน 3D',
              '• กด [2 โหมดสร้าง] หรือปุ่ม [🤖 โค้ดสร้างบล็อก] เพื่อเสกสิ่งปลูกสร้าง',
              '• วางบล็อกป้ายชื่อ 🪧 เพื่อเขียนชื่อเจ้าของผลงานได้เลย!',
            ],
          ),
          roughness: 0.3,
        }),
      );
      const signSideX = plot.x < 0 ? 5.2 : -5.2;
      signPost.position.set(signSideX, 1.3, 0);
      signPost.rotation.y = plot.x < 0 ? Math.PI / 2 : -Math.PI / 2;
      signPost.userData = { kind: 'builder_plot', plot };
      techExhibitMeshes.push(signPost);
      plotGroup.add(signPost);

      plotGroup.position.set(plot.x, 0, plot.z);
      scene.add(plotGroup);
    });

    // =========================================================================
    // 🏃‍♂️ หอคอยกระโดดลอยฟ้า 3D CYBER SKY OBBY (10 ด่านลอยฟ้า + ถ้วยรางวัลยอดหอคอย +15⭐)
    // และตู้ Kiosk ศูนย์รวม 4 กิจกรรม & มินิเกมโค้ดดิ้ง (x = 0, z = -25.2..-45.5)
    // =========================================================================
    const obbyKiosk = new THREE.Mesh(
      new THREE.BoxGeometry(5.6, 2.3, 0.28),
      new THREE.MeshStandardMaterial({
        map: makeExhibitPosterTexture(
          '#1e1b4b',
          '#090d16',
          '#facc15',
          'CYBER SKY OBBY & MINI-GAMES',
          '🎯 ลานกิจกรรม & 4 มินิเกมโลกเทคโนโลยี',
          'กระโดดพิชิตยอดหอคอย Sky Obby 10 ขั้น หรือคลิกเปิดศูนย์มินิเกม!',
          [
            '1) 🏃 Cyber Sky Obby: กระโดดขึ้นแท่นนีออนลอยฟ้า 10 ขั้นไปแตะถ้วยทอง (+15⭐)',
            '2) ⚡ Speed Hack 0/1 & รหัสลับ A=1..Z=26 (+10⭐)',
            '3) 🕵️ นักสืบจับผิด Deepfake & ข่าวปลอม (+10⭐) | 4) 🐕 โค้ดดิ้งหุ่นสุนัขกู้ภัย (+12⭐)',
          ],
        ),
        roughness: 0.25,
      }),
    );
    obbyKiosk.position.set(0, 1.65, -25.2);
    obbyKiosk.userData = { kind: 'minigame_kiosk' };
    techExhibitMeshes.push(obbyKiosk);
    scene.add(obbyKiosk);

    const obbyStages: Array<{ x: number; y: number; z: number; w: number; d: number; color: number }> = [
      { x: 0, y: 1.0, z: -27.5, w: 3.2, d: 2.4, color: 0x38bdf8 },
      { x: -3.2, y: 1.9, z: -29.8, w: 2.8, d: 2.4, color: 0x22d3ee },
      { x: -6.2, y: 2.8, z: -32.2, w: 2.8, d: 2.4, color: 0x4ade80 },
      { x: -3.0, y: 3.7, z: -34.8, w: 2.7, d: 2.4, color: 0xa3e635 },
      { x: 0.4, y: 4.6, z: -37.0, w: 2.7, d: 2.4, color: 0xfacc15 },
      { x: 3.8, y: 5.5, z: -39.2, w: 2.7, d: 2.4, color: 0xfb923c },
      { x: 6.6, y: 6.4, z: -41.5, w: 2.7, d: 2.4, color: 0xf43f5e },
      { x: 3.4, y: 7.4, z: -43.5, w: 2.7, d: 2.4, color: 0xe879f9 },
      { x: -0.2, y: 8.4, z: -44.8, w: 2.8, d: 2.4, color: 0xa78bfa },
      { x: 0, y: 9.5, z: -47.5, w: 4.6, d: 4.6, color: 0xfacc15 },
    ];
    obbyStages.forEach((st) => {
      const padMesh = new THREE.Mesh(
        new THREE.BoxGeometry(st.w, 0.32, st.d),
        new THREE.MeshStandardMaterial({
          color: 0x0f172a,
          emissive: new THREE.Color(st.color),
          emissiveIntensity: 0.65,
          roughness: 0.25,
          metalness: 0.4,
        }),
      );
      padMesh.position.set(st.x, st.y - 0.16, st.z);
      padMesh.castShadow = true;
      padMesh.receiveShadow = true;
      scene.add(padMesh);
      platforms.push({
        minX: st.x - st.w / 2,
        maxX: st.x + st.w / 2,
        minZ: st.z - st.d / 2,
        maxZ: st.z + st.d / 2,
        top: st.y,
      });
    });

    const skyObbyTrophy = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.75, 0),
      new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        emissive: new THREE.Color(0xf59e0b),
        emissiveIntensity: 0.95,
        metalness: 0.7,
        roughness: 0.15,
      }),
    );
    skyObbyTrophy.position.set(0, 10.9, -47.5);
    skyObbyTrophy.userData = { kind: 'minigame_kiosk' };
    techExhibitMeshes.push(skyObbyTrophy);
    scene.add(skyObbyTrophy);
    techAnimatedObjects.push((now, delta) => {
      skyObbyTrophy.rotation.y += delta * 1.6;
      skyObbyTrophy.position.y = 10.9 + Math.sin(now * 0.003) * 0.18;
    });

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
      flying: boolean,
      motion: WorldMotion,
      now: number,
      delta: number,
      speedScale = 1,
      headLookYaw = 0,
      turnRoll = 0,
      holdingBlock = false,
    ) => {
      const parts = group.userData.parts as {
        headGroup: THREE.Group;
        bodyGroup: THREE.Group;
        leftArmPivot: THREE.Group;
        rightArmPivot: THREE.Group;
        leftLegPivot: THREE.Group;
        rightLegPivot: THREE.Group;
        heldBlockMesh?: THREE.Mesh;
      };
      if (!parts) return;
      const damp = Math.min(1, delta * 15);
      const t = now * 0.0115 * speedScale;
      const walkSwing = moving ? Math.sin(t) * 0.72 : 0;
      const breath = Math.sin(now * 0.0028) * 0.035;

      let targetLX = walkSwing;
      let targetLZ = -0.06 - Math.abs(breath);
      let targetRX = holdingBlock ? (-0.42 - walkSwing * 0.35) : -walkSwing;
      let targetRZ = 0.06 + Math.abs(breath);
      let targetLegLX = -walkSwing * 0.82;
      let targetLegRX = walkSwing * 0.82;
      let targetHeadX = moving ? 0.05 : breath * 0.6;
      let targetHeadY = THREE.MathUtils.clamp(headLookYaw, -0.58, 0.58);
      let targetHeadZ = -turnRoll * 0.35;
      let targetBodyY = moving ? Math.abs(Math.sin(t)) * 0.048 : 0;
      let targetBodyRotX = moving ? -0.075 * speedScale : 0;
      let targetBodyRotZ = turnRoll;

      if (flying || motion === 'fly') {
        targetLX = 0.28;
        targetLZ = -0.32;
        targetRX = holdingBlock ? -0.35 : 0.28;
        targetRZ = 0.32;
        targetLegLX = 0.36 + Math.sin(now * 0.006) * 0.08;
        targetLegRX = 0.36 - Math.sin(now * 0.006) * 0.08;
        targetBodyY = Math.sin(now * 0.005) * 0.08;
        targetBodyRotX = moving ? -0.18 : -0.05;
      } else if (jumping || motion === 'jump') {
        targetLX = -0.62;
        targetLZ = -0.24;
        targetRX = -0.62;
        targetRZ = 0.24;
        targetLegLX = -0.32;
        targetLegRX = 0.24;
        targetBodyRotX = -0.06;
      }

      if (motion === 'wave') {
        targetRX = -2.55;
        targetRZ = 0.35 + Math.sin(now * 0.016) * 0.45;
        targetHeadZ = Math.sin(now * 0.008) * 0.1;
        targetHeadY = Math.sin(now * 0.006) * 0.12;
      } else if (motion === 'cheer') {
        targetLX = -2.65;
        targetLZ = -0.35 - Math.sin(now * 0.015) * 0.18;
        targetRX = -2.65;
        targetRZ = 0.35 + Math.sin(now * 0.015) * 0.18;
        targetBodyY = Math.abs(Math.sin(now * 0.012)) * 0.18;
        targetHeadX = -0.15;
      } else if (motion === 'dance') {
        const beat = now * 0.012;
        targetLX = -1.35 + Math.sin(beat) * 0.75;
        targetLZ = -0.35;
        targetRX = -1.35 - Math.sin(beat) * 0.75;
        targetRZ = 0.35;
        targetLegLX = Math.sin(beat) * 0.55;
        targetLegRX = -Math.sin(beat) * 0.55;
        targetHeadZ = Math.cos(beat) * 0.16;
        targetBodyY = Math.abs(Math.sin(beat * 2)) * 0.11;
        targetBodyRotZ = Math.sin(beat) * 0.08;
      } else if (motion === 'build') {
        targetRX = -1.12 + Math.sin(now * 0.028) * 0.82;
        targetRZ = 0.1;
        targetHeadX = 0.12;
        targetBodyRotX = -0.08;
      }

      parts.leftArmPivot.rotation.x = THREE.MathUtils.lerp(parts.leftArmPivot.rotation.x, targetLX, damp);
      parts.leftArmPivot.rotation.z = THREE.MathUtils.lerp(parts.leftArmPivot.rotation.z, targetLZ, damp);
      parts.rightArmPivot.rotation.x = THREE.MathUtils.lerp(parts.rightArmPivot.rotation.x, targetRX, damp);
      parts.rightArmPivot.rotation.z = THREE.MathUtils.lerp(parts.rightArmPivot.rotation.z, targetRZ, damp);
      parts.leftLegPivot.rotation.x = THREE.MathUtils.lerp(parts.leftLegPivot.rotation.x, targetLegLX, damp);
      parts.rightLegPivot.rotation.x = THREE.MathUtils.lerp(parts.rightLegPivot.rotation.x, targetLegRX, damp);
      parts.headGroup.rotation.x = THREE.MathUtils.lerp(parts.headGroup.rotation.x, targetHeadX, damp);
      parts.headGroup.rotation.y = THREE.MathUtils.lerp(parts.headGroup.rotation.y, targetHeadY, damp);
      parts.headGroup.rotation.z = THREE.MathUtils.lerp(parts.headGroup.rotation.z, targetHeadZ, damp);
      parts.bodyGroup.position.y = THREE.MathUtils.lerp(parts.bodyGroup.position.y, targetBodyY, damp);
      parts.bodyGroup.rotation.x = THREE.MathUtils.lerp(parts.bodyGroup.rotation.x, targetBodyRotX, damp);
      parts.bodyGroup.rotation.z = THREE.MathUtils.lerp(parts.bodyGroup.rotation.z, targetBodyRotZ, damp);
    };

    const createAvatar = (player: WorldPlayer) => {
      const group = new THREE.Group();
      const bodyGroup = new THREE.Group();
      group.add(bodyGroup);
      const techClass: AvatarTechClass = player.techClass || 'coder';
      const faceStyle: AvatarFaceStyle = player.faceStyle || 'happy';
      const primaryColor = new THREE.Color(player.color);
      const shirtMaterial = new THREE.MeshStandardMaterial({ color: primaryColor, roughness: 0.55 });
      const darkTrimMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.65 });
      const glowAccentMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: new THREE.Color(0x0284c7),
        emissiveIntensity: 0.65,
        roughness: 0.25,
      });
      const skinMaterial = new THREE.MeshStandardMaterial({ color: 0xf4c7a1, roughness: 0.7 });
      group.userData.profile = `${player.name}_${player.classroom}_${player.color}_${player.role || 'student'}_${techClass}_${faceStyle}`;

      // ลำตัว + เสื้อฮู้ดแจ็กเก็ตนักคอมพิวเตอร์ไซเบอร์
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.96, 0.46), shirtMaterial);
      body.position.y = 1.24;
      const collar = new THREE.Mesh(
        new THREE.BoxGeometry(0.46, 0.14, 0.5),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 }),
      );
      collar.position.set(0, 1.66, 0);
      const hoodBack = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.22, 0.18), shirtMaterial);
      hoodBack.position.set(0, 1.64, 0.24);
      const jacketPocket = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.24, 0.48), darkTrimMat);
      jacketPocket.position.set(0, 0.96, 0);
      const cyberBelt = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.08, 0.48), glowAccentMat);
      cyberBelt.position.set(0, 0.8, 0);
      bodyGroup.add(body, collar, hoodBack, jacketPocket, cyberBelt);

      // ขาซ้าย-ขวา หมุนจากข้อสะโพก (y = 0.78) + รองเท้าผ้าใบไซเบอร์ทูโทน
      const legGeometry = new THREE.BoxGeometry(0.28, 0.66, 0.36);
      const legMaterial = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
      const shoeMaterial = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
      const leftLegPivot = new THREE.Group();
      leftLegPivot.position.set(-0.19, 0.78, 0);
      const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
      leftLeg.position.set(0, -0.33, 0);
      const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.15, 0.45), shoeMaterial);
      leftShoe.position.set(0, -0.69, -0.04);
      const leftSole = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.05, 0.46), shirtMaterial);
      leftSole.position.set(0, -0.755, -0.04);
      leftLegPivot.add(leftLeg, leftShoe, leftSole);

      const rightLegPivot = new THREE.Group();
      rightLegPivot.position.set(0.19, 0.78, 0);
      const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
      rightLeg.position.set(0, -0.33, 0);
      const rightShoe = leftShoe.clone();
      const rightSole = leftSole.clone();
      rightLegPivot.add(rightLeg, rightShoe, rightSole);
      bodyGroup.add(leftLegPivot, rightLegPivot);

      // แขนซ้าย-ขวา หมุนจากหัวไหล่ (y = 1.64) + ขอบแขนเสื้อ + มือ + บล็อกที่ถือในมือขวา
      const armGeometry = new THREE.BoxGeometry(0.23, 0.74, 0.28);
      const cuffGeometry = new THREE.BoxGeometry(0.25, 0.09, 0.3);
      const handGeometry = new THREE.BoxGeometry(0.21, 0.2, 0.24);
      const leftArmPivot = new THREE.Group();
      leftArmPivot.position.set(-0.53, 1.64, 0);
      const leftArm = new THREE.Mesh(armGeometry, shirtMaterial);
      leftArm.position.set(0, -0.34, 0);
      const leftCuff = new THREE.Mesh(cuffGeometry, darkTrimMat);
      leftCuff.position.set(0, -0.66, 0);
      const leftHand = new THREE.Mesh(handGeometry, skinMaterial);
      leftHand.position.set(0, -0.78, 0);
      leftArmPivot.add(leftArm, leftCuff, leftHand);

      const rightArmPivot = new THREE.Group();
      rightArmPivot.position.set(0.53, 1.64, 0);
      const rightArm = new THREE.Mesh(armGeometry, shirtMaterial);
      rightArm.position.set(0, -0.34, 0);
      const rightCuff = new THREE.Mesh(cuffGeometry, darkTrimMat);
      rightCuff.position.set(0, -0.66, 0);
      const rightHand = new THREE.Mesh(handGeometry, skinMaterial);
      rightHand.position.set(0, -0.78, 0);
      const heldBlockMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.27, 0.27, 0.27),
        blockMaterials[materialRef.current] || blockMaterials.grass,
      );
      heldBlockMesh.position.set(0, -0.82, -0.24);
      heldBlockMesh.rotation.set(0.25, 0.45, 0);
      heldBlockMesh.visible = player.id === playerId && modeRef.current === 'build';
      rightArmPivot.add(rightArm, rightCuff, rightHand, heldBlockMesh);
      bodyGroup.add(leftArmPivot, rightArmPivot);

      // ศีรษะ หมุนจากคอ (y = 1.74) พร้อมทรงผมหน้าม้า จอนผม และใบหู 3 มิติ
      const headGroup = new THREE.Group();
      headGroup.position.set(0, 1.74, 0);
      const head = new THREE.Mesh(
        new THREE.BoxGeometry(0.64, 0.64, 0.64),
        faceStyle === 'robo'
          ? new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.4, roughness: 0.3 })
          : skinMaterial,
      );
      head.position.y = 0.32;
      const hairMat = new THREE.MeshStandardMaterial({ color: 0x241710, roughness: 0.85 });
      const hairTop = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.18, 0.68), hairMat);
      hairTop.position.set(0, 0.64, 0);
      const hairFront = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.13, 0.12), hairMat);
      hairFront.position.set(0, 0.56, -0.29);
      const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.44, 0.14), hairMat);
      hairBack.position.set(0, 0.42, 0.29);
      const hairSideL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.26, 0.52), hairMat);
      hairSideL.position.set(-0.31, 0.48, 0.04);
      const hairSideR = hairSideL.clone();
      hairSideR.position.x = 0.31;
      const earMat = faceStyle === 'robo' ? darkTrimMat : skinMaterial;
      const headEarL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.12), earMat);
      headEarL.position.set(-0.34, 0.32, -0.02);
      const headEarR = headEarL.clone();
      headEarR.position.x = 0.34;
      headGroup.add(head, hairTop, hairFront, hairBack, hairSideL, hairSideR, headEarL, headEarR);

      // ปรับหน้าตา 5 รูปแบบ (faceStyle)
      if (faceStyle === 'robo') {
        const ledMat = new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: new THREE.Color(0x0ea5e9),
          emissiveIntensity: 0.95,
        });
        const lEye = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.04), ledMat);
        lEye.position.set(-0.16, 0.36, -0.33);
        const rEye = lEye.clone();
        rEye.position.x = 0.16;
        const roboMouth = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.04), ledMat);
        roboMouth.position.set(0, 0.18, -0.33);
        headGroup.add(lEye, rEye, roboMouth);
      } else if (faceStyle === 'cool') {
        const shadeMat = new THREE.MeshStandardMaterial({ color: 0x090d16, metalness: 0.7, roughness: 0.15 });
        const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.14, 0.05), shadeMat);
        bridge.position.set(0, 0.37, -0.335);
        const smirk = new THREE.Mesh(
          new THREE.BoxGeometry(0.22, 0.05, 0.04),
          new THREE.MeshStandardMaterial({ color: 0x9f1239 }),
        );
        smirk.position.set(0.03, 0.18, -0.33);
        smirk.rotation.z = 0.12;
        headGroup.add(bridge, smirk);
      } else if (faceStyle === 'excited') {
        const starEyeMat = new THREE.MeshStandardMaterial({
          color: 0xfacc15,
          emissive: new THREE.Color(0xeab308),
          emissiveIntensity: 0.85,
        });
        const lEye = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.13, 0.04), starEyeMat);
        lEye.position.set(-0.16, 0.37, -0.33);
        const rEye = lEye.clone();
        rEye.position.x = 0.16;
        const wowMouth = new THREE.Mesh(
          new THREE.BoxGeometry(0.18, 0.12, 0.04),
          new THREE.MeshStandardMaterial({ color: 0xbe123c }),
        );
        wowMouth.position.set(0, 0.17, -0.33);
        headGroup.add(lEye, rEye, wowMouth);
      } else if (faceStyle === 'focused') {
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
        const lEye = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.04), eyeMat);
        lEye.position.set(-0.16, 0.36, -0.33);
        const rEye = lEye.clone();
        rEye.position.x = 0.16;
        const browL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.045), hairMat);
        browL.position.set(-0.16, 0.45, -0.33);
        browL.rotation.z = -0.18;
        const browR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.045), hairMat);
        browR.position.set(0.16, 0.45, -0.33);
        browR.rotation.z = 0.18;
        const focusMouth = new THREE.Mesh(
          new THREE.BoxGeometry(0.18, 0.045, 0.04),
          new THREE.MeshStandardMaterial({ color: 0x881337 }),
        );
        focusMouth.position.set(0, 0.18, -0.33);
        headGroup.add(lEye, rEye, browL, browR, focusMouth);
      } else {
        // happy (ค่าเริ่มต้น)
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0x172033 });
        const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const blushMat = new THREE.MeshBasicMaterial({ color: 0xfda4af });
        const lEye = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.11, 0.04), eyeMat);
        lEye.position.set(-0.16, 0.37, -0.33);
        const rEye = lEye.clone();
        rEye.position.x = 0.16;
        const lSpark = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 0.045), sparkMat);
        lSpark.position.set(-0.14, 0.39, -0.332);
        const rSpark = lSpark.clone();
        rSpark.position.x = 0.18;
        const lBlush = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.05, 0.04), blushMat);
        lBlush.position.set(-0.22, 0.26, -0.328);
        const rBlush = lBlush.clone();
        rBlush.position.x = 0.22;
        const smile = new THREE.Mesh(
          new THREE.BoxGeometry(0.24, 0.06, 0.04),
          new THREE.MeshStandardMaterial({ color: 0x9f1239 }),
        );
        smile.position.set(0, 0.18, -0.33);
        headGroup.add(lEye, rEye, lSpark, rSpark, lBlush, rBlush, smile);
      }

      // ชุดอุปกรณ์นักคอมพิวเตอร์ 6 สายอาชีพ (techClass)
      if (techClass === 'coder') {
        // 🎧 หูฟัง RGB + เป้แล็ปท็อป + ป้ายโค้ด </>
        const phoneMat = new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: new THREE.Color(0x0284c7),
          emissiveIntensity: 0.7,
        });
        const band = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.09, 0.16), phoneMat);
        band.position.set(0, 0.71, 0);
        const earL = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.24, 0.24), phoneMat);
        earL.position.set(-0.36, 0.35, 0);
        const earR = earL.clone();
        earR.position.x = 0.36;
        headGroup.add(band, earL, earR);
        const backpack = new THREE.Mesh(
          new THREE.BoxGeometry(0.56, 0.68, 0.24),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 }),
        );
        backpack.position.set(0, 1.25, 0.34);
        const chestBadge = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.03), phoneMat);
        chestBadge.position.set(0, 1.36, -0.245);
        bodyGroup.add(backpack, chestBadge);
      } else if (techClass === 'ai_engineer') {
        // 🥽 แว่นโฮโลแกรมไซเบอร์ + เสาอากาศ AI + แกนพลังงานหน้าอก
        const aiMat = new THREE.MeshStandardMaterial({
          color: 0x22d3ee,
          emissive: new THREE.Color(0x06b6d4),
          emissiveIntensity: 0.9,
          transparent: true,
          opacity: 0.88,
        });
        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.17, 0.12), aiMat);
        visor.position.set(0, 0.37, -0.31);
        const antennaStem = new THREE.Mesh(
          new THREE.CylinderGeometry(0.025, 0.025, 0.32, 8),
          new THREE.MeshStandardMaterial({ color: 0x94a3b8 }),
        );
        antennaStem.position.set(0, 0.84, 0);
        const antennaOrb = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.13, 0.13), aiMat);
        antennaOrb.position.set(0, 1.02, 0);
        headGroup.add(visor, antennaStem, antennaOrb);
        const arcCore = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.05), aiMat);
        arcCore.position.set(0, 1.32, -0.24);
        bodyGroup.add(arcCore);
      } else if (techClass === 'cyber_guardian') {
        // 🪖 หมวกเกราะไซเบอร์ + โล่ไฟร์วอลล์ที่แขนซ้าย
        const helmMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.6, roughness: 0.3 });
        const goldMat = new THREE.MeshStandardMaterial({
          color: 0xfacc15,
          emissive: new THREE.Color(0xd97706),
          emissiveIntensity: 0.5,
        });
        const helmCrest = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.24, 0.72), helmMat);
        helmCrest.position.set(0, 0.66, 0);
        const helmTrim = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.76), goldMat);
        helmTrim.position.set(0, 0.72, 0);
        headGroup.add(helmCrest, helmTrim);
        const shield = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.68, 0.54), goldMat);
        shield.position.set(-0.18, -0.42, 0);
        const shieldCore = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.44, 0.34), helmMat);
        shieldCore.position.set(-0.19, -0.42, 0);
        leftArmPivot.add(shield, shieldCore);
      } else if (techClass === 'vr_explorer') {
        // 🥽 แว่น VR Headset 3D + 🚀 เจ็ตแพ็กไอพ่นคู่ด้านหลัง
        const vrBodyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.5, roughness: 0.2 });
        const vrGlowMat = new THREE.MeshStandardMaterial({
          color: 0xc084fc,
          emissive: new THREE.Color(0x9333ea),
          emissiveIntensity: 0.85,
        });
        const vrGoggle = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.24, 0.22), vrBodyMat);
        vrGoggle.position.set(0, 0.37, -0.32);
        const vrStrip = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.08, 0.24), vrGlowMat);
        vrStrip.position.set(0, 0.37, -0.33);
        headGroup.add(vrGoggle, vrStrip);
        const jetpackGroup = new THREE.Group();
        [-0.18, 0.18].forEach((jx) => {
          const tank = new THREE.Mesh(
            new THREE.CylinderGeometry(0.11, 0.13, 0.64, 10),
            new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.6, roughness: 0.3 }),
          );
          tank.position.set(jx, 1.28, 0.34);
          const flame = new THREE.Mesh(
            new THREE.ConeGeometry(0.09, 0.26, 8),
            new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: new THREE.Color(0x0284c7), emissiveIntensity: 0.95 }),
          );
          flame.rotation.x = Math.PI;
          flame.position.set(jx, 0.86, 0.34);
          jetpackGroup.add(tank, flame);
        });
        bodyGroup.add(jetpackGroup);
      } else if (techClass === 'hardware_maker') {
        // ⛑️ หมวกนิรภัยวิศวกรสีเหลือง + ไฟฉายคาดหัว + ประแจดิจิทัลที่มือขวา
        const hatMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35 });
        const hardHat = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.24, 0.74), hatMat);
        hardHat.position.set(0, 0.66, -0.02);
        const headlamp = new THREE.Mesh(
          new THREE.BoxGeometry(0.18, 0.12, 0.08),
          new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: new THREE.Color(0xfef08a), emissiveIntensity: 0.95 }),
        );
        headlamp.position.set(0, 0.66, -0.39);
        headGroup.add(hardHat, headlamp);
        const toolBelt = new THREE.Mesh(
          new THREE.BoxGeometry(0.84, 0.14, 0.5),
          new THREE.MeshStandardMaterial({ color: 0x15803d }),
        );
        toolBelt.position.set(0, 0.84, 0);
        bodyGroup.add(toolBelt);
        const wrench = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 0.12, 0.54),
          new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.6 }),
        );
        wrench.position.set(0, -0.78, -0.24);
        rightArmPivot.add(wrench);
      } else if (techClass === 'game_creator') {
        // 👑 มงกุฎพิกเซลทองคำ + 🪄 คฑาบล็อกเรืองแสงที่มือขวา
        const crownMat = new THREE.MeshStandardMaterial({
          color: 0xfacc15,
          emissive: new THREE.Color(0xca8a04),
          emissiveIntensity: 0.5,
          metalness: 0.6,
        });
        [-0.2, 0, 0.2].forEach((cx) => {
          const spike = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.24, 0.14), crownMat);
          spike.position.set(cx, 0.82, -0.12);
          headGroup.add(spike);
        });
        const wandShaft = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.08, 0.62),
          new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.6 }),
        );
        wandShaft.position.set(0, -0.78, -0.26);
        const wandCube = new THREE.Mesh(
          new THREE.BoxGeometry(0.22, 0.22, 0.22),
          new THREE.MeshStandardMaterial({
            color: 0xf43f5e,
            emissive: new THREE.Color(0xe11d48),
            emissiveIntensity: 0.9,
          }),
        );
        wandCube.position.set(0, -0.78, -0.58);
        rightArmPivot.add(wandShaft, wandCube);
      }

      if (player.role === 'teacher') {
        const crownMaterial = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.55 });
        [-0.2, 0, 0.2].forEach((x) => {
          const point = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.28, 4), crownMaterial);
          point.position.set(x, 0.86, 0);
          headGroup.add(point);
        });
      }

      bodyGroup.add(headGroup);
      const enableAvatarShadow = graphicsQuality === 'high' || (graphicsQuality === 'medium' && player.id === playerId);
      bodyGroup.traverse((part) => {
        if ((part as THREE.Mesh).isMesh) {
          part.castShadow = enableAvatarShadow;
          part.userData = { kind: 'avatar', playerId: player.id };
        }
      });

      const nameSprite = createNameSprite(
        player.name,
        player.role === 'teacher',
        techClass,
      );
      // ซ่อนป้ายชื่อลอยเหนือหัวตัวเองในมุมมองบุคคลที่ 3 เพื่อไม่ให้บังเป้าเล็งกลางจอ (แสดงเฉพาะป้ายชื่อเพื่อนร่วมห้อง)
      nameSprite.visible = player.id !== playerId;
      group.add(nameSprite);
      group.userData.parts = {
        headGroup,
        bodyGroup,
        leftArmPivot,
        rightArmPivot,
        leftLegPivot,
        rightLegPivot,
        heldBlockMesh,
      };
      group.userData.nameSprite = nameSprite;
      group.userData.playerId = player.id;
      group.userData.motion = player.motion || 'idle';
      group.userData.targetPosition = new THREE.Vector3(player.x, player.y || 0, player.z);
      group.userData.targetRotation = player.rotation || 0;
      scene.add(group);
      return group;
    };

    const disposeAvatarGroup = (avatarGroup: THREE.Group) => {
      avatarGroup.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.isMesh && mesh !== (avatarGroup.userData.parts?.heldBlockMesh as THREE.Mesh)) {
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
          else mesh.material?.dispose();
        }
        const sprite = obj as THREE.Sprite;
        if (sprite.isSprite) {
          sprite.material?.map?.dispose();
          sprite.material?.dispose();
        }
      });
    };

    let localAvatar = createAvatar({
      id: playerId,
      roomId,
      name: displayName,
      classroom: activeClassroom,
      x: spawn.x,
      y: 0,
      z: spawn.z,
      rotation: yaw,
      color: avatarColorRef.current,
      techClass: techClassRef.current,
      faceStyle: faceStyleRef.current,
      motion: 'idle',
      role: isTeacher ? 'teacher' : 'student',
      updatedAt: Date.now(),
    });
    localAvatar.visible = thirdPersonRef.current;

    rebuildLocalAvatarRef.current = () => {
      const prevPos = localAvatar.position.clone();
      const prevRot = localAvatar.rotation.y;
      scene.remove(localAvatar);
      disposeAvatarGroup(localAvatar);
      localAvatar = createAvatar({
        id: playerId,
        roomId,
        name: displayName,
        classroom: activeClassroom,
        x: prevPos.x,
        y: prevPos.y,
        z: prevPos.z,
        rotation: prevRot,
        color: avatarColorRef.current,
        techClass: techClassRef.current,
        faceStyle: faceStyleRef.current,
        motion: activeEmoteRef.current || 'idle',
        role: isTeacher ? 'teacher' : 'student',
        updatedAt: Date.now(),
      });
      localAvatar.position.copy(prevPos);
      localAvatar.rotation.y = prevRot;
      localAvatar.visible = thirdPersonRef.current;
    };

    // ป้องกัน React Re-render Storm เมื่อเล่นพร้อมกัน 10-30 คน:
    // อัปเดตตำแหน่ง 3D ของเพื่อนใน Three.js ทันที 60fps แต่ซิงก์ React State เฉพาะเมื่อรายชื่อ/ชุดเปลี่ยน หรือทุก 2.5 วินาที
    let lastRosterSignature = '';
    let lastRosterReactSyncAt = 0;

    const unsubscribePlayers = subscribeWorldPlayers(roomId, (players) => {
      const nowSync = performance.now();
      const rosterSig = players
        .map((p) => `${p.id}:${p.name}:${p.color}:${p.techClass || ''}:${p.faceStyle || ''}:${p.role || ''}:${p.joinStatus || ''}`)
        .join('|');
      if (rosterSig !== lastRosterSignature || nowSync - lastRosterReactSyncAt > 2_500) {
        lastRosterSignature = rosterSig;
        lastRosterReactSyncAt = nowSync;
        setOnlinePlayers(players);
      }
      const remote = players.filter((player) => player.id !== playerId);
      const ids = new Set(remote.map((player) => player.id));
      remoteAvatars.forEach((avatar, id) => {
        if (ids.has(id)) return;
        scene.remove(avatar);
        disposeAvatarGroup(avatar);
        remoteAvatars.delete(id);
      });
      remote.forEach((player) => {
        let avatar = remoteAvatars.get(player.id);
        const profile = `${player.name}_${player.classroom}_${player.color}_${player.role || 'student'}_${player.techClass || 'coder'}_${player.faceStyle || 'happy'}`;
        let prevPos: THREE.Vector3 | null = null;
        let prevRot: number | null = null;
        if (avatar && avatar.userData.profile !== profile) {
          prevPos = avatar.position.clone();
          prevRot = avatar.rotation.y;
          scene.remove(avatar);
          disposeAvatarGroup(avatar);
          remoteAvatars.delete(player.id);
          avatar = undefined;
        }
        avatar ||= createAvatar(player);
        remoteAvatars.set(player.id, avatar);
        if (prevPos) {
          avatar.position.copy(prevPos);
          avatar.rotation.y = prevRot ?? player.rotation;
          avatar.userData.hasPosition = true;
        } else if (!avatar.userData.hasPosition) {
          avatar.position.set(player.x, player.y || 0, player.z);
          avatar.rotation.y = player.rotation || 0;
          avatar.userData.hasPosition = true;
        }
        (avatar.userData.targetPosition as THREE.Vector3).set(player.x, player.y || 0, player.z);
        avatar.userData.targetRotation = player.rotation || 0;
        avatar.userData.motion = player.motion || 'idle';
      });
    }, setSyncMode);

    const raycaster = new THREE.Raycaster();
    const center = new THREE.Vector2(0, 0);
    const selection = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1.04, 1.04, 1.04)),
      new THREE.LineBasicMaterial({ color: 0xfacc15 }),
    );
    selection.visible = false;
    scene.add(selection);

    // โฮโลแกรมแสดงตำแหน่งช่องตารางที่จะวางบล็อกล่วงหน้า (ช่วยให้เล็งในมุมมองบุคคลที่ 3 แม่นยำ 100%)
    const placementPreview = new THREE.Mesh(
      new THREE.BoxGeometry(0.98, 0.98, 0.98),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.26,
        depthWrite: false,
      }),
    );
    const placementEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1.0, 1.0, 1.0)),
      new THREE.LineBasicMaterial({ color: 0x38bdf8 }),
    );
    placementPreview.add(placementEdges);
    placementPreview.visible = false;
    scene.add(placementPreview);

    const getHit = () => {
      raycaster.setFromCamera(center, camera);
      const targets = [
        ground,
        ...boardMeshes,
        ...gameMeshes,
        ...portalMeshes,
        ...techExhibitMeshes,
        ...blockMeshes.values(),
      ];
      return raycaster.intersectObjects(targets, false)[0];
    };

    // Raycast เฉพาะบล็อกใกล้ตัวในระยะ BUILD_REACH + พื้นดิน สำหรับแสดงกรอบโฮโลแกรมเล็งวางบล็อก (ลดภาระ CPU 85% เมื่อมีผู้เล่นและบล็อกจำนวนมาก)
    const getBuildHoverHit = () => {
      raycaster.setFromCamera(center, camera);
      const nearbyBlocks: THREE.Object3D[] = [ground];
      const maxDist = BUILD_REACH + 2.5;
      blockMeshes.forEach((mesh) => {
        if (
          Math.abs(mesh.position.x - playerPosition.x) <= maxDist
          && Math.abs(mesh.position.z - playerPosition.z) <= maxDist
        ) {
          nearbyBlocks.push(mesh);
        }
      });
      return raycaster.intersectObjects(nearbyBlocks, false)[0];
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
      avatarYaw = yaw;
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
        triggerEmoteRef.current('build', 650);
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
      triggerEmoteRef.current('build', 550);
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
      if (hit && hit.object.userData.kind === 'minigame_kiosk' && hit.distance <= 26) {
        if (document.pointerLockElement) document.exitPointerLock();
        setMiniGameOpen(true);
        return;
      }
      if (hit && hit.object.userData.kind === 'builder_plot' && hit.distance <= 26) {
        const plot = hit.object.userData.plot as (typeof BUILDER_PLOTS)[number];
        setMode('build');
        setStatus(`🏗️ เข้าสู่ "${plot.label}" (${plot.theme}) — เปิดโหมดสร้างบล็อกแล้ว! คลิกซ้ายวางบล็อก หรือกด [🤖 โค้ดสร้างบล็อก]`);
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
    const publishPresence = (force = false, motionState: WorldMotion = 'idle') => {
      const effectiveMotion: WorldMotion = (activeEmoteRef.current && performance.now() < emoteUntilRef.current)
        ? activeEmoteRef.current
        : motionState;
      void updateWorldPlayer({
        id: playerId,
        roomId,
        name: displayName,
        classroom: activeClassroom,
        x: playerPosition.x,
        y: playerPosition.y - 1.7,
        z: playerPosition.z,
        rotation: thirdPersonRef.current ? avatarYaw : yaw,
        color: avatarColorRef.current,
        techClass: techClassRef.current,
        faceStyle: faceStyleRef.current,
        motion: effectiveMotion,
        role: isTeacher ? 'teacher' : 'student',
        joinStatus: joinStatusRef.current,
        updatedAt: Date.now(),
      }, force);
    };

    triggerEmoteRef.current = (emote: WorldMotion, durationMs = 2_800) => {
      activeEmoteRef.current = emote;
      emoteUntilRef.current = performance.now() + durationMs;
      setActiveEmote(emote);
      publishPresence(true, emote);
    };

    summonRef.current = () => {
      const state = roomStateRef.current;
      playerPosition.set(state?.summonX || 0, 1.7, state?.summonZ || 10);
      verticalVelocity = 0;
      velX = 0;
      velZ = 0;
      yaw = Math.PI;
      avatarYaw = yaw;
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
      velX = 0;
      velZ = 0;
      grounded = true;
      const dx = target.x - destX;
      const dz = target.z - destZ;
      yaw = Math.atan2(-dx, -dz);
      avatarYaw = yaw;
      pitch = 0;
      publishPresence(true, 'idle');
      setStatus(`เดินไปหา ${target.role === 'teacher' ? 'ครู ' : ''}${target.name} แล้ว`);
    };
    teleportToTechZoneRef.current = (zone: TechZoneInfo, openModal = false) => {
      if (!zone) return;
      playerPosition.set(zone.x, 1.7, zone.z);
      verticalVelocity = 0;
      velX = 0;
      velZ = 0;
      grounded = true;
      flyingRef.current = false;
      setIsFlying(false);
      const dx = zone.lookX - zone.x;
      const dz = zone.lookZ - zone.z;
      yaw = Math.atan2(-dx, -dz);
      avatarYaw = yaw;
      pitch = 0;
      publishPresence(true, 'idle');
      setStatus(`🏛️ วาร์ปมายังโซน "${zone.shortTitle}" แล้ว — คลิกที่นิทรรศการเพื่อทดลองเล่น!`);
      if (openModal) {
        if (document.pointerLockElement) document.exitPointerLock();
        setActiveTechZone(zone);
      }
    };
    teleportToCoordsRef.current = (tx: number, ty: number, tz: number, label: string) => {
      playerPosition.set(tx, ty, tz);
      verticalVelocity = 0;
      velX = 0;
      velZ = 0;
      grounded = true;
      flyingRef.current = false;
      setIsFlying(false);
      pitch = 0;
      publishPresence(true, 'idle');
      setStatus(label);
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
      if (event.code === 'KeyZ' && !event.repeat) {
        triggerEmoteRef.current('wave', 2_800);
        setStatus('👋 โบกมือทักทายเพื่อนในห้อง!');
      }
      if (event.code === 'KeyX' && !event.repeat) {
        triggerEmoteRef.current('cheer', 2_800);
        setStatus('🙌 กระโดดดีใจ เย้!');
      }
      if (event.code === 'KeyC' && !event.repeat && !flyingRef.current) {
        triggerEmoteRef.current('dance', 3_600);
        setStatus('💃 ออกสเต็ปเต้นโรบอทไซเบอร์!');
      }
      if (event.code === 'KeyV' && !event.repeat) {
        triggerEmoteRef.current('build', 2_200);
        setStatus('🔨 ท่าลงมือสร้างงาน!');
      }
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
    let lastHoverCheckAt = 0;
    let lastSentX = playerPosition.x;
    let lastSentY = playerPosition.y;
    let lastSentZ = playerPosition.z;
    let lastSentRot = avatarYaw;
    let lastSentMotion: WorldMotion = 'idle';

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
      const baseSpeed = keys.has('ShiftLeft') ? 8.5 : 5.4;
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

      // คำนวณทิศทางการเคลื่อนที่จริง + ระบบความเฉื่อย (Smooth Velocity Acceleration & Deceleration)
      const inputMag = Math.hypot(forwardAmount, sideAmount);
      const normF = inputMag > 0 ? forwardAmount / inputMag : 0;
      const normS = inputMag > 0 ? sideAmount / inputMag : 0;
      const moveDirX = forward.x * normF + right.x * normS;
      const moveDirZ = forward.z * normF + right.z * normS;
      const targetVelX = moveDirX * speed;
      const targetVelZ = moveDirZ * speed;
      const accelLerp = Math.min(1, delta * (inputMag > 0 ? 16 : 13));
      velX = THREE.MathUtils.lerp(velX, targetVelX, accelLerp);
      velZ = THREE.MathUtils.lerp(velZ, targetVelZ, accelLerp);
      if (Math.abs(velX) < 0.015) velX = 0;
      if (Math.abs(velZ) < 0.015) velZ = 0;

      // หมุนตัวละครไปตามทิศทางที่กำลังวิ่งจริง (True 3rd-Person Directional Facing)
      let turnRoll = 0;
      if (inputMag > 0) {
        const desiredAvatarYaw = Math.atan2(-moveDirX, -moveDirZ);
        let yawDiff = ((desiredAvatarYaw - avatarYaw + Math.PI) % (Math.PI * 2)) - Math.PI;
        if (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
        avatarYaw += yawDiff * Math.min(1, delta * 15);
        turnRoll = THREE.MathUtils.clamp(-yawDiff * 0.14, -0.14, 0.14);
      }

      const dispX = velX * delta;
      const dispZ = velZ * delta;

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
        velX = 0;
        velZ = 0;
        grounded = true;
        setStatus('รีเซ็ตตำแหน่งกลับสู่ลานกิจกรรม');
      }
      playerPosition.x = THREE.MathUtils.clamp(playerPosition.x, -PLAYER_BOUNDARY, PLAYER_BOUNDARY);
      playerPosition.z = THREE.MathUtils.clamp(playerPosition.z, -PLAYER_BOUNDARY, PLAYER_BOUNDARY);
      const isMoving = inputMag > 0 || Math.hypot(velX, velZ) > 0.35;
      if (activeEmoteRef.current && now >= emoteUntilRef.current) {
        activeEmoteRef.current = null;
        setActiveEmote(null);
      }
      const currentLocalMotion: WorldMotion = activeEmoteRef.current
        ? activeEmoteRef.current
        : flyingRef.current
          ? 'fly'
          : !grounded
            ? 'jump'
            : isMoving
              ? 'walk'
              : 'idle';
      localAvatar.visible = thirdPersonRef.current;
      localAvatar.position.set(playerPosition.x, playerPosition.y - 1.7, playerPosition.z);
      localAvatar.rotation.y = thirdPersonRef.current ? avatarYaw : yaw;

      // อัปเดตบล็อกที่ถือในมือขวาของตัวละครให้ตรงกับวัสดุที่เลือกอยู่
      const localParts = localAvatar.userData.parts as { heldBlockMesh?: THREE.Mesh } | undefined;
      const isHoldingBlock = modeRef.current === 'build';
      if (localParts?.heldBlockMesh) {
        localParts.heldBlockMesh.visible = isHoldingBlock;
        const targetMat = blockMaterials[materialRef.current] || blockMaterials.grass;
        if (localParts.heldBlockMesh.material !== targetMat) {
          localParts.heldBlockMesh.material = targetMat;
        }
      }

      let headLookDiff = ((yaw - avatarYaw + Math.PI) % (Math.PI * 2)) - Math.PI;
      if (headLookDiff < -Math.PI) headLookDiff += Math.PI * 2;
      const headLookYaw = Math.abs(headLookDiff) > 2.2 ? 0 : headLookDiff * 0.65;

      animateAvatar(
        localAvatar,
        isMoving,
        !grounded,
        flyingRef.current,
        currentLocalMotion,
        now,
        delta,
        keys.has('ShiftLeft') ? 1.38 : 1,
        headLookYaw,
        turnRoll,
        isHoldingBlock,
      );
      remoteAvatars.forEach((avatar) => {
        const target = avatar.userData.targetPosition as THREE.Vector3;
        const distance = target ? avatar.position.distanceTo(target) : 0;
        if (target) {
          if (distance > 14) avatar.position.copy(target);
          else avatar.position.lerp(target, Math.min(1, delta * 11));
        }
        const targetRot = typeof avatar.userData.targetRotation === 'number'
          ? (avatar.userData.targetRotation as number)
          : avatar.rotation.y;
        let rotDiff = ((targetRot - avatar.rotation.y + Math.PI) % (Math.PI * 2)) - Math.PI;
        if (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
        avatar.rotation.y += rotDiff * Math.min(1, delta * 12);
        const remoteMotion = (avatar.userData.motion as WorldMotion) || 'idle';
        const remoteMoving = remoteMotion === 'walk' || distance > 0.04;
        animateAvatar(
          avatar,
          remoteMoving,
          remoteMotion === 'jump',
          remoteMotion === 'fly',
          remoteMotion,
          now,
          delta,
          0.95,
          0,
          THREE.MathUtils.clamp(-rotDiff * 0.12, -0.12, 0.12),
          false,
        );
      });

      // กล้อง Spring-Arm มุมมองบุคคลที่ 3 นุ่มนวลตามหลังตัวละครและปรับระดับตามมุมก้ม-เงย (pitch)
      if (thirdPersonRef.current) {
        const camDist = flyingRef.current ? 5.1 : 4.35;
        const camHeight = 1.65 - pitch * 1.55;
        const desiredCamPos = new THREE.Vector3(
          playerPosition.x - forward.x * camDist + right.x * 0.35,
          Math.max(floorTop + 0.6, playerPosition.y - 0.35 + camHeight),
          playerPosition.z - forward.z * camDist + right.z * 0.35,
        );
        if (smoothCamPos.distanceTo(desiredCamPos) > 14) {
          smoothCamPos.copy(desiredCamPos);
        } else {
          smoothCamPos.lerp(desiredCamPos, Math.min(1, delta * 16));
        }
        camera.position.copy(smoothCamPos);
        const lookTarget = new THREE.Vector3(
          playerPosition.x + forward.x * 6.5,
          playerPosition.y + 0.15 + Math.sin(pitch) * 4.5,
          playerPosition.z + forward.z * 6.5,
        );
        camera.lookAt(lookTarget);
      } else {
        camera.position.copy(playerPosition);
        camera.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
      }

      // หมุนวงแหวนโฮโลแกรมบนเพดานโดมเทคโนโลยีและวงแหวนดาวเทียมบนท้องฟ้า
      skylightRing.rotation.z += delta * 0.32;
      skylightInnerRing.rotation.z -= delta * 0.55;
      domeCoreOrb.rotation.y += delta * 1.15;
      domeCoreOrb.position.y = 7.1 + Math.sin(now * 0.0024) * 0.16;
      orbitalSkyRing.rotation.z += delta * 0.08;

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

      // ตรวจสอบการกระโดดพิชิตด่านหอคอยลอยฟ้า 3D Cyber Sky Obby (10 ด่าน)
      if (!flyingRef.current && grounded && playerPosition.z < -26) {
        for (let idx = 0; idx < obbyStages.length; idx += 1) {
          const st = obbyStages[idx];
          if (
            Math.abs(playerPosition.x - st.x) <= st.w / 2 + 0.25
            && Math.abs(playerPosition.z - st.z) <= st.d / 2 + 0.25
            && Math.abs((playerPosition.y - 1.7) - st.y) <= 0.35
          ) {
            const stageNum = idx + 1;
            setObbyBestStage((prev) => {
              if (stageNum <= prev) return prev;
              if (stageNum === 10) {
                celebrate();
                setWorldStars((s) => s + 15);
                const unitNo = boards[0]?.unitNo || 1;
                void recordActivity('game', `u${unitNo}-sky-obby-clear`, unitNo, 'พิชิตยอดหอคอย 3D Cyber Sky Obby 10 ชั้น');
                setStatus('🏆 สุดยอด! กระโดดพิชิตยอดหอคอย 3D Cyber Sky Obby ชั้นที่ 10 สำเร็จ รับโบนัส +15⭐!');
              } else {
                setStatus(`🏃‍♂️ Cyber Sky Obby: ผ่านด่านลอยฟ้าขั้นที่ ${stageNum}/10 แล้ว! กระโดดต่อไปให้ถึงยอดหอคอย!`);
              }
              return stageNum;
            });
            break;
          }
        }
      }

      if (now - lastHoverCheckAt >= 40) {
        lastHoverCheckAt = now;
        const hit = getBuildHoverHit();
        if (hit?.object.userData.kind === 'block' && hit.distance <= BUILD_REACH) {
          selection.position.copy(hit.object.position);
          selection.visible = true;
        } else {
          selection.visible = false;
        }

        if (
          modeRef.current === 'build'
          && hit
          && hit.distance <= BUILD_REACH
          && ['ground', 'block'].includes(hit.object.userData.kind)
        ) {
          const pt = hit.point.clone();
          if (hit.object.userData.kind === 'block' && hit.face) {
            pt.add(hit.face.normal.clone().multiplyScalar(0.55));
          }
          const px = Math.floor(pt.x) + 0.5;
          const pz = Math.floor(pt.z) + 0.5;
          const py = hit.object.userData.kind === 'ground' ? 0.5 : Math.max(0.5, Math.floor(pt.y) + 0.5);
          if (Math.abs(px) <= BUILD_BOUNDARY && Math.abs(pz) <= BUILD_BOUNDARY && py <= BUILD_MAX_HEIGHT - 0.5) {
            placementPreview.position.set(px, py, pz);
            placementPreview.visible = true;
          } else {
            placementPreview.visible = false;
          }
        } else {
          placementPreview.visible = false;
        }
      }

      if (now - lastPresence > 900) {
        const curRot = thirdPersonRef.current ? avatarYaw : yaw;
        const movedDist = Math.hypot(
          playerPosition.x - lastSentX,
          playerPosition.y - lastSentY,
          playerPosition.z - lastSentZ,
        );
        const rotDelta = Math.abs(curRot - lastSentRot);
        if (movedDist > 0.05 || rotDelta > 0.06 || currentLocalMotion !== lastSentMotion) {
          lastPresence = now;
          lastSentX = playerPosition.x;
          lastSentY = playerPosition.y;
          lastSentZ = playerPosition.z;
          lastSentRot = curRot;
          lastSentMotion = currentLocalMotion;
          publishPresence(false, currentLocalMotion);
        }
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
  }, [activeClassroom, boards, displayName, gameStations, graphicsQuality, isTeacher, openLessonBoard, playerId, recordActivity, roomClassroom, roomId]);

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
            flexWrap: 'nowrap',
            overflowX: 'auto',
            maxWidth: 'calc(100vw - 36px)',
            whiteSpace: 'nowrap',
            padding: '4px 9px',
            borderRadius: 999,
            background: 'rgba(15, 23, 42, 0.88)',
            border: '1px solid rgba(56, 189, 248, 0.45)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            fontSize: '0.75rem',
          }}
        >
          <button
            type="button"
            onClick={() => {
              if (document.pointerLockElement) document.exitPointerLock();
              setMiniGameTab('obby');
              setMiniGameOpen(true);
            }}
            title="เปิดศูนย์กิจกรรม หอคอย 3D Sky Obby, ลานสร้างบล็อก 8 แปลง และ 4 มินิเกมโค้ดดิ้ง"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              flexShrink: 0,
              padding: '3px 10px',
              borderRadius: 999,
              border: '1px solid #facc15',
              background: 'linear-gradient(135deg, #ca8a04, #eab308)',
              color: '#0f172a',
              fontSize: '0.74rem',
              fontWeight: 900,
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            🎯 กิจกรรม & 4 มินิเกม (+47⭐)
          </button>
          <button
            type="button"
            onClick={() => {
              if (document.pointerLockElement) document.exitPointerLock();
              setMiniGameTab('obby');
              setMiniGameOpen(true);
            }}
            title="เลือกวาร์ปไปแปลงก่อสร้างส่วนตัว 8 แปลง (W1–W4, E1–E4)"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              flexShrink: 0,
              padding: '3px 9px',
              borderRadius: 999,
              border: '1px solid #38bdf8',
              background: 'rgba(14, 165, 233, 0.28)',
              color: '#e0f2fe',
              fontSize: '0.73rem',
              fontWeight: 800,
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            🏗️ ลานสร้าง 8 แปลง
          </button>
          <span style={{ fontWeight: 800, color: '#38bdf8', flexShrink: 0 }}>
            🏛️ โลกเทคโนโลยี ({visitedTechZones.length}/{TECH_ZONES.length}):
          </span>
          {TECH_ZONES.map((zone) => {
            const visited = visitedTechZones.includes(zone.id);
            return (
              <button
                key={zone.id}
                type="button"
                onClick={() => teleportToTechZoneRef.current(zone, true)}
                title={`วาร์ปไปโซน ${zone.title}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  flexShrink: 0,
                  padding: '2px 8px',
                  borderRadius: 999,
                  border: `1px solid ${visited ? '#4ade80' : zone.accent}`,
                  background: visited ? 'rgba(22, 163, 74, 0.28)' : 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '0.73rem',
                  fontWeight: 700,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                <span>{zone.icon}</span>
                <span>{zone.shortTitle}</span>
                {visited && <span style={{ color: '#4ade80', fontWeight: 900 }}>✓</span>}
              </button>
            );
          })}
        </div>
      </header>

      {pointerLocked && (
        <div className="world-pointer-tip">
          <span>💡 กดแป้น <strong>[Esc]</strong> เพื่อแสดงเมาส์ หรือคลิก <strong>🚪 ออกจากห้อง 3D</strong> ด้านบนซ้าย</span>
        </div>
      )}


      <button className="world-avatar-badge" onClick={() => setAvatarPanelOpen((open) => !open)} aria-label="ปรับตัวละครและดูผู้เล่นในห้อง">
        <span className="world-avatar-face" style={{ '--avatar': avatarColor, fontSize: '1.15rem' } as React.CSSProperties}>
          {TECH_CLASSES.find((c) => c.id === avatarTechClass)?.icon || <ScanFace size={22} />}
        </span>
        <span>
          <strong>
            {FACE_STYLES.find((f) => f.id === avatarFaceStyle)?.icon}{' '}
            {isTeacher ? 'ครูอนันตชัย' : displayName}
          </strong>
          <small>
            {TECH_CLASSES.find((c) => c.id === avatarTechClass)?.title} · {activeClassroom} · {syncMode === 'firebase' ? 'ออนไลน์หลายเครื่อง' : syncMode === 'local' ? 'เฉพาะเครื่องนี้' : 'กำลังเชื่อมต่อ'}
          </small>
        </span>
      </button>

      {avatarPanelOpen && (
        <aside
          className="world-avatar-panel"
          style={{
            width: 'min(360px, calc(100vw - 36px))',
            maxHeight: 'calc(100dvh - 148px)',
            overflowY: 'auto',
          }}
        >
          <button className="world-panel-close" onClick={() => setAvatarPanelOpen(false)} aria-label="ปิดแผงตัวละคร"><X size={18} /></button>
          <h2><Palette size={19} /> แต่งตัวละคร & ท่าทาง</h2>
          <p style={{ marginBottom: 8 }}>
            {isTeacher ? 'ครูอนันตชัย' : displayName} ·{' '}
            <strong style={{ color: '#2563eb' }}>
              {TECH_CLASSES.find((c) => c.id === avatarTechClass)?.icon}{' '}
              {TECH_CLASSES.find((c) => c.id === avatarTechClass)?.title}
            </strong>
          </p>

          <h3 style={{ marginTop: 10 }}>🧑‍💻 สายอาชีพนักคอมพิวเตอร์ (6 รูปแบบ)</h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 6,
              marginTop: 7,
            }}
            role="group"
            aria-label="เลือกชุดสายอาชีพนักคอมพิวเตอร์"
          >
            {TECH_CLASSES.map((tc) => {
              const active = avatarTechClass === tc.id;
              return (
                <button
                  key={tc.id}
                  type="button"
                  onClick={() => {
                    setAvatarTechClass(tc.id);
                    setThirdPerson(true);
                    triggerEmoteRef.current('cheer', 1_800);
                    setStatus(`🧑‍💻 เปลี่ยนชุดเป็น "${tc.title}" (${tc.gearDesc})`);
                  }}
                  title={tc.gearDesc}
                  style={{
                    textAlign: 'left',
                    padding: '7px 9px',
                    borderRadius: 8,
                    border: active ? `2px solid ${tc.accent}` : '1px solid #cbd5e1',
                    background: active ? '#0f172a' : '#f8fafc',
                    color: active ? '#ffffff' : '#1e293b',
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span>{tc.icon}</span>
                    <span>{tc.title}</span>
                  </div>
                  <small
                    style={{
                      display: 'block',
                      fontSize: '0.66rem',
                      color: active ? '#93c5fd' : '#64748b',
                      marginTop: 2,
                      lineHeight: 1.25,
                    }}
                  >
                    {tc.gearDesc}
                  </small>
                </button>
              );
            })}
          </div>

          <h3 style={{ marginTop: 13 }}>😊 ปรับหน้าตา & อารมณ์</h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
              gap: 5,
              marginTop: 7,
            }}
            role="group"
            aria-label="เลือกหน้าตาตัวละคร"
          >
            {FACE_STYLES.map((face) => {
              const active = avatarFaceStyle === face.id;
              return (
                <button
                  key={face.id}
                  type="button"
                  onClick={() => {
                    setAvatarFaceStyle(face.id);
                    setThirdPerson(true);
                    setStatus(`${face.icon} เปลี่ยนหน้าตาเป็น "${face.label}"`);
                  }}
                  title={face.label}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    padding: '6px 4px',
                    borderRadius: 7,
                    border: active ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    background: active ? '#eff6ff' : '#ffffff',
                    color: '#1e293b',
                    fontSize: '0.66rem',
                    fontWeight: 800,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: '1.15rem' }}>{face.icon}</span>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                    {face.label}
                  </span>
                </button>
              );
            })}
          </div>

          <h3 style={{ marginTop: 13 }}>🕺 ท่าทางแอ็กชัน (Move Actions)</h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 6,
              marginTop: 7,
            }}
            role="group"
            aria-label="แสดงท่าทางตัวละคร"
          >
            {AVATAR_ACTIONS.map((act) => {
              const active = activeEmote === act.id;
              return (
                <button
                  key={act.id}
                  type="button"
                  onClick={() => {
                    setThirdPerson(true);
                    triggerEmoteRef.current(act.id, act.id === 'dance' ? 3_800 : 2_800);
                    setStatus(`${act.icon} แสดงท่า "${act.label}" ให้เพื่อนในห้องเห็น!`);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '7px 10px',
                    borderRadius: 7,
                    border: active ? '2px solid #16a34a' : '1px solid #cbd5e1',
                    background: active ? '#dcfce7' : '#ffffff',
                    color: '#1e293b',
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                  }}
                >
                  <span>{act.icon} {act.label}</span>
                  <kbd
                    style={{
                      padding: '1px 5px',
                      borderRadius: 4,
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.66rem',
                      color: '#475569',
                    }}
                  >
                    {act.keyHint}
                  </kbd>
                </button>
              );
            })}
          </div>

          <h3 style={{ marginTop: 13 }}>🎨 สีเสื้อตัวละคร</h3>
          <div className="world-avatar-colors" aria-label="เลือกสีเสื้อตัวละคร" style={{ marginTop: 7, flexWrap: 'wrap' }}>
            {AVATAR_COLORS.map((color) => (
              <button
                key={color}
                className={avatarColor === color ? 'active' : ''}
                style={{ '--avatar': color } as React.CSSProperties}
                onClick={() => {
                  setAvatarColor(color);
                  setThirdPerson(true);
                }}
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
            {onlinePlayers.length > 0 ? onlinePlayers.map((player) => {
              const pClass = TECH_CLASSES.find((c) => c.id === (player.techClass || 'coder')) || TECH_CLASSES[0];
              return (
                <span
                  key={player.id}
                  onClick={() => {
                    if (player.id !== playerId) {
                      teleportToPlayerRef.current(player);
                      setAvatarPanelOpen(false);
                    }
                  }}
                  style={{ cursor: player.id !== playerId ? 'pointer' : 'default' }}
                  title={player.id !== playerId ? `คลิกเพื่อเดินไปหา ${player.name} (${pClass.title})` : 'ตัวละครของคุณ'}
                >
                  <i style={{ background: player.color }} />
                  <span>{pClass.icon}</span>
                  {player.role === 'teacher' ? 'ครู ' : ''}{player.name}
                  {player.id !== playerId && <small style={{ marginLeft: 'auto', opacity: 0.78 }}>เดินไปหา →</small>}
                  {player.joinStatus === 'waiting' && <small>รออนุมัติ</small>}
                </span>
              );
            }) : <span><i style={{ background: avatarColor }} />{displayName}</span>}
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
        <button onClick={() => setThirdPerson((active) => !active)} title="สลับมุมมองตัวละคร (ดูชุดและท่าทางของฉัน)" aria-label="สลับมุมมองตัวละคร" className={thirdPerson ? 'active' : ''}>
          <ScanFace size={20} />
        </button>
        <button
          onClick={() => {
            const cycle: WorldMotion[] = ['wave', 'cheer', 'dance'];
            const nextIdx = activeEmote ? (cycle.indexOf(activeEmote) + 1) % cycle.length : 0;
            const nextEmote = cycle[nextIdx] || 'wave';
            setThirdPerson(true);
            triggerEmoteRef.current(nextEmote, nextEmote === 'dance' ? 3_600 : 2_800);
            const info = AVATAR_ACTIONS.find((a) => a.id === nextEmote);
            setStatus(`${info?.icon || '👋'} แสดงท่า "${info?.label || 'ทักทาย'}" (กด Z/X/C/V เพื่อเปลี่ยนท่า)`);
          }}
          title="แสดงท่าทางทักทายเพื่อน (โบกมือ Z / ดีใจ X / เต้น C)"
          aria-label="แสดงท่าทางทักทายเพื่อน"
          className={activeEmote ? 'active' : ''}
          disabled={!canParticipate}
        >
          <span style={{ fontSize: '1.05rem', lineHeight: 1 }} aria-hidden="true">👋</span>
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
                <div style={{ padding: 12, borderRadius: 10, background: '#fff7ed', border: '1px solid #fed7aa' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#9a3412', marginBottom: 8 }}>
                    🏛️ วิวัฒนาการคอมพิวเตอร์ครบทั้ง 5 ยุค (1st–5th Generation) & IBM 1620 เครื่องแรกของไทย
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                    {([
                      [1, '1️⃣ หลอดสุญญากาศ (1940–1956)'],
                      [2, '2️⃣ ทรานซิสเตอร์ (1956–1963)'],
                      [3, '3️⃣ วงจรรวม IC (1964–1971)'],
                      [4, '4️⃣ ไมโครโพรเซสเซอร์ (1972–2010)'],
                      [5, '5️⃣ ปัญญาประดิษฐ์ AI (2010–ปัจจุบัน)'],
                    ] as const).map(([genNo, label]) => (
                      <button
                        key={genNo}
                        type="button"
                        onClick={() => setSelectedComputerGen(genNo)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 8,
                          border: selectedComputerGen === genNo ? '2px solid #ea580c' : '1px solid #fed7aa',
                          background: selectedComputerGen === genNo ? '#ea580c' : '#ffffff',
                          color: selectedComputerGen === genNo ? '#ffffff' : '#9a3412',
                          fontWeight: 800,
                          fontSize: '0.76rem',
                          fontFamily: 'inherit',
                          cursor: 'pointer',
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {(() => {
                    const genInfo: Record<1 | 2 | 3 | 4 | 5, { title: string; hw: string; desc: string }> = {
                      1: {
                        title: 'รุ่นที่ 1 หลอดสุญญากาศ (First Generation · ค.ศ. 1940–1956)',
                        hw: 'หลอดสุญญากาศ (Vacuum Tube) + บัตรเจาะรู (Punched Card) เช่น ENIAC, UNIVAC',
                        desc: 'มนุษย์เริ่มสื่อสารกับคอมพิวเตอร์ผ่านบัตรเจาะรู ใช้หลอดสุญญากาศนับหมื่นหลอดขับเคลื่อนเครื่องจักรขนาดใหญ่เท่าห้องเรียน ใช้พลังงานไฟฟ้าและเกิดความร้อนสูงมาก',
                      },
                      2: {
                        title: 'รุ่นที่ 2 ทรานซิสเตอร์ (Second Generation · ค.ศ. 1956–1963)',
                        hw: 'ทรานซิสเตอร์ (Transistor) + วงแหวนแม่เหล็ก (Magnetic Core) + เทปแม่เหล็ก',
                        desc: 'จุดเปลี่ยนสำคัญที่ทำให้คอมพิวเตอร์มีขนาดเล็กลง เร็วขึ้น ประหยัดไฟ และเชื่อถือได้มากขึ้น รวมถึงเครื่อง IBM 1620 เครื่องคอมพิวเตอร์เครื่องแรกของประเทศไทย (พ.ศ. 2506 ที่จุฬาลงกรณ์มหาวิทยาลัย)!',
                      },
                      3: {
                        title: 'รุ่นที่ 3 แผงวงจรรวม (Third Generation · ค.ศ. 1964–1971)',
                        hw: 'แผงวงจรรวม (Integrated Circuit : IC) บนแผ่นซิลิคอน',
                        desc: 'รวมทรานซิสเตอร์ ตัวต้านทาน และตัวเก็บประจุหลายร้อยตัวลงบนชิปซิลิคอนขนาดเล็ก เริ่มมีคีย์บอร์ด จอภาพ และระบบปฏิบัติการที่ทำงานหลายโปรแกรมพร้อมกันได้',
                      },
                      4: {
                        title: 'รุ่นที่ 4 ไมโครโพรเซสเซอร์ (Fourth Generation · ค.ศ. 1972–2010)',
                        hw: 'ไมโครโพรเซสเซอร์ (Microprocessor / CPU ชิปเดียว) + ชิป BIOS + เครือข่ายอินเทอร์เน็ต',
                        desc: 'ย่อทรานซิสเตอร์นับล้านชิ้นลงบนชิป CPU แผ่นเดียว (เช่น Intel 4004, Apple II, IBM PC) เกิดภาษา BASIC, ระบบปฏิบัติการ Windows/macOS และการเชื่อมต่อเครือข่ายทั่วโลก',
                      },
                      5: {
                        title: 'รุ่นที่ 5 ระบบปัญญาประดิษฐ์ (Fifth Generation · ค.ศ. 2010–ปัจจุบัน)',
                        hw: 'ชิปประมวลผล AI / GPU ความเร็วสูง + Cloud + VR Headset + Quantum',
                        desc: 'คอมพิวเตอร์สามารถเรียนรู้ด้วยตนเอง (Machine Learning & Deep Learning) เข้าใจภาษามนุษย์ สร้างภาพ/เสียง และเชื่อมชุมชนโลกเสมือนจริง (Virtual Community)',
                      },
                    };
                    const curGen = genInfo[selectedComputerGen];
                    return (
                      <div style={{ padding: 11, borderRadius: 8, background: '#ffffff', border: '1px solid #fdba74' }}>
                        <strong style={{ fontSize: '0.86rem', color: '#c2410c' }}>{curGen.title}</strong>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1d4ed8', margin: '3px 0' }}>🔧 หัวใจเทคโนโลยี: {curGen.hw}</div>
                        <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#334155', lineHeight: 1.45 }}>{curGen.desc}</p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {activeTechZone.id === 'logic_secret_code' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(() => {
                  const secretWords = [
                    { word: 'DRESS', clue: 'โจทย์ NSM ที่ 1: เครื่องแต่งกาย (D=4, R=18, E=5, S=19, S=19)', meaning: 'ชุดเครื่องแต่งกาย' },
                    { word: 'WATER', clue: 'โจทย์ NSM ที่ 2:ทรัพยากรสำคัญของชีวิต (W=23, A=1, T=20, E=5, R=18)', meaning: 'น้ำสะอาด' },
                    { word: 'APPLE', clue: 'โจทย์ NSM ที่ 3: ผลไม้และชื่อบริษัทคอมพิวเตอร์ระดับโลก (A=1, P=16, P=16, L=12, E=5)', meaning: 'แอปเปิล' },
                    { word: 'LOGIC', clue: 'โจทย์ที่ 4: ศาสตร์แห่งเหตุผลและการพิสูจน์ความจริง (L=12, O=15, G=7, I=9, C=3)', meaning: 'ตรรกศาสตร์' },
                  ];
                  const cur = secretWords[secretWordIdx] || secretWords[0];
                  const charCodes = Array.from(cur.word).map((ch) => ({
                    ch,
                    num: ch.charCodeAt(0) - 64,
                    bin: (ch.charCodeAt(0) - 64).toString(2).padStart(5, '0'),
                  }));
                  return (
                    <>
                      <div style={{ padding: 14, borderRadius: 12, background: '#0f172a', color: '#ffffff', border: '2px solid #3b82f6' }}>
                        <div style={{ fontWeight: 800, color: '#60a5fa', marginBottom: 6 }}>
                          🔐 บอร์ดปุ่มไฟ "สร้างรหัสลับ (CREATING A SECRET CODE)" · ตารางแทนค่า A=1 ถึง Z=26
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                          {secretWords.map((sw, idx) => (
                            <button
                              key={sw.word}
                              type="button"
                              onClick={() => setSecretWordIdx(idx)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: 8,
                                border: secretWordIdx === idx ? '2px solid #facc15' : '1px solid #475569',
                                background: secretWordIdx === idx ? '#1d4ed8' : '#1e293b',
                                color: '#ffffff',
                                fontWeight: 800,
                                fontSize: '0.8rem',
                                fontFamily: 'inherit',
                                cursor: 'pointer',
                              }}
                            >
                              โจทย์: {sw.word}
                            </button>
                          ))}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: 8 }}>{cur.clue}</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                          {charCodes.map((item, i) => (
                            <div
                              key={`${item.ch}-${i}`}
                              style={{
                                minWidth: 86,
                                padding: '10px 8px',
                                borderRadius: 10,
                                background: '#1e3a8a',
                                border: '2px solid #93c5fd',
                                textAlign: 'center',
                              }}
                            >
                              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#fde047' }}>{item.ch}</div>
                              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#ffffff' }}>รหัสเลข: {item.num}</div>
                              <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: '#7dd3fc' }}>ฐานสอง: {item.bin}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
                        <div style={{ padding: 11, borderRadius: 10, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                          <strong style={{ fontSize: '0.85rem', color: '#1e40af' }}>🧩 ตรรกศาสตร์ (Logic) คืออะไร?</strong>
                          <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#334155', lineHeight: 1.45 }}>
                            ศาสตร์ที่ว่าด้วยเหตุผลและการพิสูจน์ความจริง (จริง True / เท็จ False) เช่น เงื่อนไข <code>IF-ELSE</code> และวงจรลอจิกเกต <code>AND, OR, NOT</code> ในซีพียู
                          </p>
                        </div>
                        <div style={{ padding: 11, borderRadius: 10, background: '#fef3c7', border: '1px solid #fde68a' }}>
                          <strong style={{ fontSize: '0.85rem', color: '#92400e' }}>👣 อัลกอริทึม (Algorithm) คืออะไร?</strong>
                          <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#334155', lineHeight: 1.45 }}>
                            กระบวนการทำงานหรือลำดับขั้นตอนการแก้ปัญหาทีละขั้นอย่างชัดเจน เหมือนเส้นทางบนพื้นในพิพิธภัณฑ์และคำสั่งที่เราใช้สั่งคอมพิวเตอร์ทำงาน
                          </p>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {activeTechZone.id === 'program_software_robodog' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ padding: 13, borderRadius: 12, background: '#0f172a', color: '#ffffff', border: '2px solid #f43f5e' }}>
                  <div style={{ fontWeight: 800, color: '#fda4af', marginBottom: 8 }}>
                    🐕 ห้องควบคุมหุ่นยนต์สุนัข 4 ขา (Quadruped Robot Dog) & เกมโค้ดดิ้ง SPACE RESCUE
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                    {([
                      ['scan', '🔍 scan_environment()', 'สแกนพื้นที่ 3 มิติด้วยกล้องสเตอริโอและเซนเซอร์ LiDAR ด้านหน้า'],
                      ['patrol', '🐾 walk_patrol(steps=4)', 'ควบคุมมอเตอร์เซอร์โว 12 ข้อต่อให้ก้าวเดินทรงตัวข้ามสิ่งกีดขวาง'],
                      ['wave', '👋 greet_student()', 'ย่อขาหน้าและพยักหน้าทักทายผู้เข้าชมนิทรรศการ'],
                      ['rescue', '🚀 run_space_rescue()', 'จำลองภารกิจกู้ภัยอวกาศอัตโนมัติตามชุดคำสั่งโปรแกรม'],
                    ] as const).map(([actId, cmdLabel]) => (
                      <button
                        key={actId}
                        type="button"
                        onClick={() => setRoboDogAction(actId)}
                        style={{
                          padding: '7px 11px',
                          borderRadius: 8,
                          border: roboDogAction === actId ? '2px solid #fde047' : '1px solid #475569',
                          background: roboDogAction === actId ? '#e11d48' : '#1e293b',
                          color: '#ffffff',
                          fontWeight: 800,
                          fontSize: '0.76rem',
                          fontFamily: 'monospace',
                          cursor: 'pointer',
                        }}
                      >
                        {cmdLabel}
                      </button>
                    ))}
                  </div>
                  <div style={{ padding: 10, borderRadius: 8, background: '#1e293b', fontSize: '0.8rem', color: '#38bdf8', fontFamily: 'monospace' }}>
                    {roboDogAction === 'scan' && '>> [High-Level Python]: robot.scan_environment()  -->  [Machine Code]: 10110010 01001101 (สแกนสิ่งกีดขวางรอบตัวสำเร็จ!)'}
                    {roboDogAction === 'patrol' && '>> [High-Level Python]: for step in range(4): robot.step_forward()  -->  [Machine Code]: 11001010 (ก้าวเดิน 4 จังหวะเสถียร!)'}
                    {roboDogAction === 'wave' && '>> [High-Level Python]: robot.pose("bow_greeting")  -->  [Machine Code]: 01110101 (หุ่นยนต์สุนัขทักทายผู้เรียน!)'}
                    {roboDogAction === 'rescue' && '>> [SPACE RESCUE MISSION]: if oxygen_low: deploy_rescue_pod()  -->  [Machine Code]: 11110001 (ภารกิจช่วยเหลือสำเร็จ!)'}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 8 }}>
                  <div style={{ padding: 10, borderRadius: 8, background: '#fffbeb', border: '1px solid #fde68a' }}>
                    <strong style={{ fontSize: '0.83rem', color: '#b45309' }}>1️⃣ คอมไพเลอร์ vs อินเทอร์พรีเตอร์</strong>
                    <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#475569', lineHeight: 1.4 }}>
                      <strong>Compiler:</strong> แปลภาษามนุษย์ทั้งโปรแกรมรวดเดียวให้เป็นภาษาเครื่องก่อนรัน (เช่น C, C++)<br />
                      <strong>Interpreter:</strong> แปลและประมวลผลทีละคำสั่ง/ทีละบรรทัด (เช่น Python, JavaScript)
                    </p>
                  </div>
                  <div style={{ padding: 10, borderRadius: 8, background: '#fdf2f8', border: '1px solid #fbcfe8' }}>
                    <strong style={{ fontSize: '0.83rem', color: '#be185d' }}>2️⃣ ภาษาคอมพิวเตอร์ 3 ระดับ</strong>
                    <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#475569', lineHeight: 1.4 }}>
                      • <strong>ภาษาเครื่อง:</strong> รหัสตัวเลข 0 กับ 1 ล้วน<br />
                      • <strong>ภาษาระดับต่ำ:</strong> ภาษา Assembly ใช้รหัสย่อ<br />
                      • <strong>ภาษาระดับสูง:</strong> ใกล้เคียงภาษาอังกฤษ เช่น Python (นิยมอันดับ 1 ที่ 30.21%), JS, Java, C#
                    </p>
                  </div>
                  <div style={{ padding: 10, borderRadius: 8, background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                    <strong style={{ fontSize: '0.83rem', color: '#0369a1' }}>3️⃣ ซอฟต์แวร์ระบบ vs ซอฟต์แวร์ประยุกต์</strong>
                    <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#475569', lineHeight: 1.4 }}>
                      • <strong>ซอฟต์แวร์ระบบ (OS):</strong> ควบคุมฮาร์ดแวร์ เช่น Windows, macOS, Linux, Ubuntu, iOS<br />
                      • <strong>ซอฟต์แวร์ประยุกต์:</strong> แอปใช้งานเฉพาะด้าน เช่น Canva, เกม, โปรแกรมพิมพ์งาน
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTechZone.id === 'quantum_computer' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ padding: 14, borderRadius: 12, background: 'linear-gradient(135deg, #064e3b, #0f172a)', color: '#ffffff', border: '2px solid #34d399' }}>
                  <div style={{ fontWeight: 800, color: '#6ee7b7', marginBottom: 8 }}>
                    ⚛️ ห้องทดลอง Qubit Superposition · คอมพิวเตอร์ทั่วไป vs คอมพิวเตอร์เชิงควอนตัม
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>เลือกจำนวนบิต / คิวบิต (Qubits):</span>
                    {[2, 4, 8, 10].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setQuantumQubits(q)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 8,
                          border: quantumQubits === q ? '2px solid #facc15' : '1px solid #34d399',
                          background: quantumQubits === q ? '#facc15' : '#065f46',
                          color: quantumQubits === q ? '#0f172a' : '#ffffff',
                          fontWeight: 900,
                          fontSize: '0.82rem',
                          fontFamily: 'inherit',
                          cursor: 'pointer',
                        }}
                      >
                        {q} Qubits
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                    <div style={{ padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid #94a3b8' }}>
                      <strong style={{ color: '#93c5fd', fontSize: '0.84rem' }}>💻 คอมพิวเตอร์ทั่วไป ({quantumQubits} Bits)</strong>
                      <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#ffffff', margin: '4px 0' }}>
                        ประมวลผลได้ทีละ 1 สถานะ
                      </div>
                      <small style={{ color: '#cbd5e1', fontSize: '0.74rem' }}>
                        จากทั้งหมด {(2 ** quantumQubits).toLocaleString()} รูปแบบ (ต้องเรียงทำทีละรอบ)
                      </small>
                    </div>
                    <div style={{ padding: 10, borderRadius: 8, background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #34d399' }}>
                      <strong style={{ color: '#fde047', fontSize: '0.84rem' }}>⚛️ คอมพิวเตอร์ควอนตัม ({quantumQubits} Qubits)</strong>
                      <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#6ee7b7', margin: '4px 0' }}>
                        ซ้อนทับได้ {(2 ** quantumQubits).toLocaleString()} สถานะพร้อมกัน!
                      </div>
                      <small style={{ color: '#d1fae5', fontSize: '0.74rem' }}>
                        ด้วยปรากฏการณ์ Superposition (เป็นทั้ง 0 และ 1 ในเวลาเดียวกัน)
                      </small>
                    </div>
                  </div>
                </div>
                <div style={{ padding: 11, borderRadius: 10, background: '#ecfdf5', border: '1px solid #a7f3d0', fontSize: '0.8rem', color: '#065f46', lineHeight: 1.5 }}>
                  ❄️ <strong>ทำไมเครื่องควอนตัมต้องเย็นถึง 0 องศาเคลวิน (-273.15°C) และใหญ่เท่าสนามฟุตบอล?</strong><br />
                  เพราะอนุภาคควอนตัมระดับอะตอมไวต่อความร้อนและแรงสั่นสะเทือนมาก จึงต้องมีท่อทำความเย็นหลายชั้น (ทรงแชนเดอเลียร์สีทอง) ควบคุมอุณหภูมิให้ใกล้ศูนย์สัมบูรณ์ และใช้พื้นที่ 30–50 ตร.ม. เหมาะกับงานจำลองโมเลกุลยา พยากรณ์อากาศโลก และเข้ารหัสขั้นสูง ส่วนคอมพิวเตอร์ทั่วไปยังจำเป็นและพกพาสะดวกสำหรับชีวิตประจำวัน!
                </div>
              </div>
            )}

            {activeTechZone.id === 'ai_revolution_agentic' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(() => {
                  const goals = [
                    {
                      title: '🚌 เป้าหมายที่ 1: จัดทริปทัศนศึกษาพิพิธภัณฑ์ไอที อพวช.',
                      step1: 'รับโจทย์กว้าง ๆ: พานักเรียนไปทัศนศึกษาพิพิธภัณฑ์เทคโนโลยีสารสนเทศ 1 วัน',
                      step2: 'AI แตกงานย่อย (Task Decomposition): 1) เช็กรอบเข้าชม 2) คำนวณงบรถบัส 3) จัดกลุ่มทำภารกิจ 10 โซน',
                      step3: 'ใช้เครื่องมืออัตโนมัติ (Tools): จองตั๋วออนไลน์ + สร้างตารางกำหนดการและใบงานพาสปอร์ตสำเร็จ!',
                    },
                    {
                      title: '🌱 เป้าหมายที่ 2: สร้างโครงงานสมาร์ตฟาร์มโรงเรียน',
                      step1: 'รับโจทย์กว้าง ๆ: ดูแลแปลงผักโรงเรียนให้อัตโนมัติช่วงวันหยุด',
                      step2: 'AI แตกงานย่อย: 1) อ่านค่าความชื้นดิน 2) เช็กพยากรณ์อากาศ 3) คำนวณเวลาเปิดปั๊มน้ำ',
                      step3: 'ใช้เครื่องมืออัตโนมัติ: สั่งบอร์ด IoT เปิดน้ำเมื่อดินแห้ง < 40% และส่งรายงานเข้าแชทครู!',
                    },
                    {
                      title: '🕵️ เป้าหมายที่ 3: ตรวจสอบคลิปต้องสงสัยว่าเป็น Deepfake หรือไม่',
                      step1: 'รับโจทย์กว้าง ๆ: พบคลิปคนดังพูดชวนลงทุนในโซเชียลมีเดีย',
                      step2: 'AI & มนุษย์ช่วยกันตรวจ 3 ขั้น: 1) ค้นหาต้นฉบับ 2) เทียบข่าวจากหลายแหล่ง 3) ตรวจวันเวลาและแสงเงาใบหน้า',
                      step3: 'สรุปผลลัพธ์: พบเป็นคลิป Deepfake ดัดแปลงใบหน้าและเสียง! แจ้งเตือนเพื่อนไม่ให้หลงเชื่อและไม่แชร์ต่อ',
                    },
                  ];
                  const curGoal = goals[agentGoalIdx] || goals[0];
                  return (
                    <>
                      <div style={{ padding: 13, borderRadius: 12, background: '#0f172a', color: '#ffffff', border: '2px solid #38bdf8' }}>
                        <div style={{ fontWeight: 800, color: '#38bdf8', marginBottom: 8 }}>
                          🤖 ทดลองสั่งงาน "ปัญญาประดิษฐ์แบบเอเจนต์ (AGENTIC AI)" · กลไก 3 ขั้นตอนอัตโนมัติ
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                          {goals.map((g, idx) => (
                            <button
                              key={g.title}
                              type="button"
                              onClick={() => setAgentGoalIdx(idx)}
                              style={{
                                padding: '6px 10px',
                                borderRadius: 8,
                                border: agentGoalIdx === idx ? '2px solid #facc15' : '1px solid #475569',
                                background: agentGoalIdx === idx ? '#0284c7' : '#1e293b',
                                color: '#ffffff',
                                fontWeight: 800,
                                fontSize: '0.76rem',
                                fontFamily: 'inherit',
                                cursor: 'pointer',
                              }}
                            >
                              {g.title}
                            </button>
                          ))}
                        </div>
                        <div style={{ display: 'grid', gap: 6, fontSize: '0.78rem' }}>
                          <div style={{ padding: 8, borderRadius: 7, background: '#1e293b' }}>
                            <strong style={{ color: '#fde047' }}>ขั้นที่ 1 บอกเป้าหมายกว้าง ๆ (Broad Goal):</strong> {curGoal.step1}
                          </div>
                          <div style={{ padding: 8, borderRadius: 7, background: '#1e293b' }}>
                            <strong style={{ color: '#38bdf8' }}>ขั้นที่ 2 คิดเหตุผลและแตกงานย่อย (Reasoning & Decomposition):</strong> {curGoal.step2}
                          </div>
                          <div style={{ padding: 8, borderRadius: 7, background: '#1e293b' }}>
                            <strong style={{ color: '#4ade80' }}>ขั้นที่ 3 เลือกใช้เครื่องมือและปฏิบัติการได้เอง (Using Tools Autonomously):</strong> {curGoal.step3}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
                        <div style={{ padding: 10, borderRadius: 8, background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                          <strong style={{ fontSize: '0.8rem', color: '#0369a1' }}>☁️ Cloud · 🖨️ 3D Print · 🌐 IoE</strong>
                          <p style={{ margin: '4px 0 0', fontSize: '0.74rem', color: '#334155', lineHeight: 1.4 }}>
                            <strong>Cloud:</strong> ก้อนเมฆเครือข่ายข้อมูลขนาดใหญ่<br />
                            <strong>3D Printing:</strong> เปลี่ยนไฟล์ CAD 3 มิติเป็นชิ้นงานจริง<br />
                            <strong>IoE:</strong> ทุกสิ่งเชื่อมถึงกันผ่านอินเทอร์เน็ต
                          </p>
                        </div>
                        <div style={{ padding: 10, borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca' }}>
                          <strong style={{ fontSize: '0.8rem', color: '#b91c1c' }}>🎭 รู้เท่าทัน ดีปเฟก (DEEPFAKE)</strong>
                          <p style={{ margin: '4px 0 0', fontSize: '0.74rem', color: '#334155', lineHeight: 1.4 }}>
                            AI สามารถสลับใบหน้าและเลียนแบบเสียงบุคคลได้แนบเนียน ต้องตรวจให้ลึก: <strong>ค้นหาต้นฉบับ • เทียบหลายแหล่ง • ตรวจวันเวลาและบริบท</strong>
                          </p>
                        </div>
                        <div style={{ padding: 10, borderRadius: 8, background: '#f8fafc', border: '1px solid #cbd5e1' }}>
                          <strong style={{ fontSize: '0.8rem', color: '#0f172a' }}>💬 คำคมผู้บุกเบิกโลกดิจิทัล</strong>
                          <p style={{ margin: '4px 0 0', fontSize: '0.74rem', color: '#334155', lineHeight: 1.4 }}>
                            <strong>Tim Berners-Lee (ผู้สร้าง WWW):</strong> <em>&ldquo;คุณสร้างผลกระทบให้เกิดขึ้นกับโลก จากสิ่งที่คุณเรียกดูบนอินเทอร์เน็ต&rdquo;</em>
                          </p>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {activeTechZone.id === 'retro_console_esports' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {([
                    ['fc', '🕹️ 1983 · Famicom / NES (8-Bit)'],
                    ['sfc', '🎮 1990 · Super Famicom / SNES (16-Bit)'],
                    ['n64', '🌟 1996 · Nintendo 64 (64-Bit 3D)'],
                  ] as const).map(([eraId, label]) => (
                    <button
                      key={eraId}
                      type="button"
                      onClick={() => setSelectedConsoleEra(eraId)}
                      style={{
                        flex: 1,
                        minWidth: 150,
                        padding: '10px 10px',
                        borderRadius: 10,
                        border: selectedConsoleEra === eraId ? '2px solid #db2777' : '1px solid #cbd5e1',
                        background: selectedConsoleEra === eraId ? 'linear-gradient(135deg, #be185d, #6d28d9)' : '#f8fafc',
                        color: selectedConsoleEra === eraId ? '#ffffff' : '#1e293b',
                        fontWeight: 900,
                        fontSize: '0.82rem',
                        fontFamily: 'inherit',
                        cursor: 'pointer',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {(() => {
                  const consoles = {
                    fc: {
                      title: 'Famicom (FC) / Nintendo Entertainment System (NES) · ค.ศ. 1983',
                      spec: 'ซีพียู 8-Bit · กราฟิกพิกเซล 2 มิติ · ตลับเกม ROM',
                      games: 'Super Mario Bros., Mega Man, Metroid',
                      desc: 'วางจำหน่ายครั้งแรกในญี่ปุ่นปี 1983 จุดประกายอุตสาหกรรมวิดีโอเกมในบ้านด้วยกราฟิกพิกเซล 8 บิต และเสียงดนตรี Chiptune อันเป็นเอกลักษณ์',
                    },
                    sfc: {
                      title: 'Super Famicom (SFC) / Super Nintendo (SNES) · ค.ศ. 1990',
                      spec: 'ซีพียู 16-Bit · สีสันและฉากหลังหลายเลเยอร์ (Mode 7) · เสียงดนตรีสเตอริโอละเอียดขึ้น',
                      games: 'Super Mario World, Donkey Kong Country, Super Mario Kart',
                      desc: 'พัฒนาทั้งกราฟิกและดนตรีประกอบให้มีความละเอียดอ่อนและสีสันสดใสขึ้นมาก กลายเป็นเครื่องเกมที่ขายดีที่สุดของยุค 90s',
                    },
                    n64: {
                      title: 'Nintendo 64 (N64) · ค.ศ. 1996',
                      spec: 'ซีพียู 64-Bit · กราฟิกโพลิกอน 3 มิติเต็มรูปแบบ · ตลับเกมความจุ 4–64 MB',
                      games: 'Super Mario 64, The Legend of Zelda: Ocarina of Time, GoldenEye 007',
                      desc: 'ปฏิวัติวงการเกมจากภาพ 2 มิติสู่โลก 3 มิติ 360 องศา พร้อมคันโยก Analog Stick บนจอยเกมที่เป็นต้นแบบของเกม 3D ในปัจจุบัน!',
                    },
                  };
                  const cur = consoles[selectedConsoleEra];
                  return (
                    <div style={{ padding: 13, borderRadius: 12, background: '#fdf2f8', border: '2px solid #f472b6' }}>
                      <strong style={{ fontSize: '0.95rem', color: '#831843' }}>{cur.title}</strong>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#6d28d9', margin: '4px 0' }}>⚡ สเปกเทคโนโลยี: {cur.spec}</div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#be185d' }}>🏆 เกมระดับตำนาน: {cur.games}</div>
                      <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: '#4c1d95', lineHeight: 1.45 }}>{cur.desc}</p>
                    </div>
                  );
                })()}
                <div style={{ padding: 11, borderRadius: 10, background: '#f5f3ff', border: '1px solid #ddd6fe', fontSize: '0.79rem', color: '#4c1d95', lineHeight: 1.48 }}>
                  🎯 <strong>สายอาชีพของวงการเกมและ E-Sports (E-Sports Career):</strong> วงการเกมไม่ได้มีแค่ผู้เล่น แต่รวมความรู้หลายศาสตร์เข้าด้วยกัน ทั้ง <strong>สายวิทยาศาสตร์และคอมพิวเตอร์</strong> (Game Programmer, AI & Physics Developer, Game Designer) และ <strong>สายศิลปะ/นิเทศศาสตร์</strong> (3D Modeler, Animator, Sound Designer, นักพากย์และผู้จัดการแข่งขัน E-Sports)!
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
                            onClick={() => {
                              setStudioBackdropIdx(idx);
                              applyStudioBackdropRef.current(idx);
                            }}
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
                  const alreadyVisited = visitedTechZones.includes(activeTechZone.id);
                  const nextVisited = alreadyVisited
                    ? visitedTechZones
                    : [...visitedTechZones, activeTechZone.id];
                  const completedAllNow = !alreadyVisited && nextVisited.length === TECH_ZONES.length;
                  const earnedStars = completedAllNow ? 20 : 2;
                  setVisitedTechZones(nextVisited);
                  try {
                    localStorage.setItem(`kj_world_techpassport_${playerId}`, JSON.stringify(nextVisited));
                  } catch { /* ignore */ }
                  setWorldStars((s) => s + earnedStars);
                  const unitNo = boards[0]?.unitNo || 1;
                  void recordActivity('question', `u${unitNo}-techzone-${activeTechZone.id}`, unitNo, `เรียนรู้โซนโลกเทคโนโลยี: ${activeTechZone.title}`);
                  setStatus(
                    completedAllNow
                      ? `🏆 ยินดีด้วย! สำรวจพาสปอร์ตโลกเทคโนโลยีครบทั้ง ${TECH_ZONES.length} โซน รับโบนัสใหญ่ +20⭐!`
                      : `🌟 สำรวจโซน "${activeTechZone.shortTitle}" สำเร็จ (${nextVisited.length}/${TECH_ZONES.length}) รับ +2⭐!`,
                  );
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
                🌟 บันทึกพาสปอร์ตนักสำรวจ ({visitedTechZones.includes(activeTechZone.id) ? 'สำรวจแล้ว ✓' : '+2⭐'})
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

      {miniGameOpen && (
        <div
          className="world-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="ศูนย์กิจกรรม 3D ลานสร้างบล็อก 8 แปลง และ 4 มินิเกมโลกเทคโนโลยี"
          onClick={() => setMiniGameOpen(false)}
        >
          <div
            className="world-modal"
            style={{ maxWidth: 820, maxHeight: '88vh', overflowY: 'auto' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
              <div>
                <span className="world-kicker" style={{ color: '#0284c7' }}>
                  🎯 KRUJAMES 3D METAVERSE · ACTIVITIES & BUILDER PLOTS
                </span>
                <h2 style={{ margin: '4px 0 6px', fontSize: '1.25rem' }}>
                  ศูนย์กิจกรรม 3D · ลานสร้างบล็อก 8 แปลง & 4 มินิเกมเทคโนโลยี
                </h2>
                <p style={{ margin: 0, fontSize: '0.84rem', color: '#475569' }}>
                  เลือกวาร์ปไปกระโดดหอคอย 3D Cyber Sky Obby, จองแปลงสร้างผลงาน 3D ส่วนตัว หรือเล่นมินิเกมสะสมดาว!
                </p>
              </div>
              <button
                type="button"
                className="world-btn-cancel"
                onClick={() => setMiniGameOpen(false)}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '12px 0' }}>
              {[
                { id: 'obby' as const, label: '🏃 Sky Obby & 🏗️ ลานสร้าง 8 แปลง' },
                { id: 'hack' as const, label: '⚡ ถอดรหัสไว 0/1 & รหัสลับ (+10⭐)' },
                { id: 'detective' as const, label: '🕵️ นักสืบจับผิด Deepfake (+10⭐)' },
                { id: 'rescue' as const, label: '🐕 โค้ดดิ้งหุ่นสุนัขกู้ภัย (+12⭐)' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setMiniGameTab(t.id)}
                  style={{
                    flex: 1,
                    minWidth: 165,
                    padding: '9px 10px',
                    borderRadius: 10,
                    border: miniGameTab === t.id ? '2px solid #0284c7' : '1px solid #cbd5e1',
                    background: miniGameTab === t.id ? '#e0f2fe' : '#f8fafc',
                    color: '#0f172a',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {miniGameTab === 'obby' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ padding: 14, borderRadius: 12, background: 'linear-gradient(135deg, #0f172a, #1e1b4b)', color: '#fff', border: '2px solid #facc15' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: '0.76rem', color: '#fde047', fontWeight: 800 }}>
                        🏃‍♂️ กิจกรรมกระโดดในฉาก 3D · CYBER SKY OBBY (10 ด่านลอยฟ้า)
                      </div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 900, marginTop: 2 }}>
                        สถิติสูงสุดของคุณ: ด่านที่ {obbyBestStage} / 10 {obbyBestStage >= 10 ? '🏆 (พิชิตยอดหอคอยแล้ว!)' : ''}
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#cbd5e1' }}>
                        กดปุ่มวาร์ปไปจุดเริ่มต้นด้านหลังโดม แล้วใช้ปุ่ม W A S D + Spacebar กระโดดไต่แท่นนีออนลอยฟ้า 10 ชั้นขึ้นไปแตะถ้วยทองคำบนยอดหอคอย รับทันที +15⭐!
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setMiniGameOpen(false);
                        teleportToCoordsRef.current(
                          0,
                          1.7,
                          -25.8,
                          '🏃‍♂️ วาร์ปมาจุดเริ่ม 3D Cyber Sky Obby แล้ว! กด Space กระโดดไต่แท่นนีออน 10 ชั้นขึ้นไปแตะถ้วยทองเลย!',
                        );
                      }}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 10,
                        border: 0,
                        background: 'linear-gradient(135deg, #eab308, #f59e0b)',
                        color: '#0f172a',
                        fontWeight: 900,
                        fontSize: '0.86rem',
                        fontFamily: 'inherit',
                        cursor: 'pointer',
                      }}
                    >
                      🚀 วาร์ปไปจุดเริ่ม Sky Obby (+15⭐)
                    </button>
                  </div>
                </div>

                <div>
                  <div style={{ fontWeight: 900, fontSize: '0.95rem', color: '#0f172a', marginBottom: 8 }}>
                    🏗️ ลานสร้างสรรค์ของนักเรียน 8 แปลง (Student Builder Plots · ขนาดแปลงละ 10×10 ช่อง สูง 36 ชั้น)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: 8 }}>
                    {BUILDER_PLOTS.map((plot) => (
                      <div
                        key={plot.id}
                        style={{
                          padding: 10,
                          borderRadius: 10,
                          background: '#f8fafc',
                          border: `2px solid ${plot.hex}`,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: 8,
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 900, fontSize: '0.85rem', color: '#0f172a' }}>{plot.label}</div>
                          <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: 2 }}>
                            โจทย์แนะนำ: <strong>{plot.theme}</strong>
                          </div>
                          <div style={{ fontSize: '0.71rem', color: '#64748b', marginTop: 2 }}>
                            พิกัด: ({plot.x}, {plot.z})
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setMiniGameOpen(false);
                            setMode('build');
                            teleportToCoordsRef.current(
                              plot.x,
                              1.7,
                              plot.z,
                              `🏗️ วาร์ปมายัง "${plot.label}" (${plot.theme}) พร้อมเปิดโหมดสร้างบล็อกแล้ว! คลิกซ้ายวางบล็อก หรือกด [🤖 โค้ดสร้างบล็อก] ได้เลย`,
                            );
                          }}
                          style={{
                            padding: '7px 10px',
                            borderRadius: 8,
                            border: 0,
                            background: '#0f172a',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: '0.76rem',
                            fontFamily: 'inherit',
                            cursor: 'pointer',
                          }}
                        >
                          🏗️ วาร์ปไปสร้างที่แปลง {plot.id.toUpperCase()}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {miniGameTab === 'hack' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(() => {
                  const q = BINARY_HACK_QUESTIONS[hackQIdx] || BINARY_HACK_QUESTIONS[0];
                  return (
                    <div style={{ padding: 14, borderRadius: 12, background: '#0f172a', color: '#fff', border: '2px solid #38bdf8' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#38bdf8' }}>
                          ⚡ BINARY & SECRET CODE SPEED HACK · ข้อที่ {hackQIdx + 1} / {BINARY_HACK_QUESTIONS.length}
                        </span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#4ade80' }}>
                          ตอบถูกสะสม: {hackCorrectCount} ข้อ
                        </span>
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 12, lineHeight: 1.45 }}>
                        {q.q}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
                        {q.options.map((ch, idx) => {
                          const isSelected = hackPicked === idx;
                          const isAnswer = idx === q.ans;
                          const bg = hackPicked === null
                            ? '#1e293b'
                            : isAnswer
                              ? '#166534'
                              : isSelected
                                ? '#991b1b'
                                : '#1e293b';
                          return (
                            <button
                              key={ch}
                              type="button"
                              onClick={() => {
                                if (hackPicked !== null) return;
                                setHackPicked(idx);
                                if (idx === q.ans) {
                                  const nextCount = hackCorrectCount + 1;
                                  setHackCorrectCount(nextCount);
                                  celebrate();
                                  setWorldStars((s) => s + 2);
                                  const unitNo = boards[0]?.unitNo || 1;
                                  void recordActivity('game', `u${unitNo}-binary-hack-q${hackQIdx + 1}`, unitNo, `ถอดรหัส Binary/Secret Code ข้อที่ ${hackQIdx + 1}`);
                                }
                              }}
                              style={{
                                padding: '10px 12px',
                                borderRadius: 10,
                                border: isSelected ? '2px solid #facc15' : '1px solid #475569',
                                background: bg,
                                color: '#fff',
                                fontWeight: 800,
                                fontSize: '0.86rem',
                                fontFamily: 'inherit',
                                cursor: hackPicked === null ? 'pointer' : 'default',
                              }}
                            >
                              {ch}
                            </button>
                          );
                        })}
                      </div>
                      {hackPicked !== null && (
                        <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: 'rgba(56, 189, 248, 0.16)', border: '1px solid #38bdf8', fontSize: '0.82rem' }}>
                          <strong>{hackPicked === q.ans ? '✅ ถูกต้อง! (+2⭐) ' : '💡 เฉลย: '}</strong>
                          {q.explain}
                          <div style={{ marginTop: 8 }}>
                            <button
                              type="button"
                              onClick={() => {
                                setHackPicked(null);
                                setHackQIdx((idx) => (idx + 1) % BINARY_HACK_QUESTIONS.length);
                              }}
                              style={{
                                padding: '6px 14px',
                                borderRadius: 8,
                                border: 0,
                                background: '#38bdf8',
                                color: '#0f172a',
                                fontWeight: 900,
                                fontSize: '0.8rem',
                                fontFamily: 'inherit',
                                cursor: 'pointer',
                              }}
                            >
                              ข้อถัดไป ▶
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {miniGameTab === 'detective' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(() => {
                  const item = DEEPFAKE_DETECTIVE_CASES[detectiveIdx] || DEEPFAKE_DETECTIVE_CASES[0];
                  return (
                    <div style={{ padding: 14, borderRadius: 12, background: '#1e1b4b', color: '#fff', border: '2px solid #f472b6' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f472b6' }}>
                          🕵️ แฟ้มคดีนักสืบไซเบอร์ · คดีที่ {detectiveIdx + 1} / {DEEPFAKE_DETECTIVE_CASES.length}
                        </span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#4ade80' }}>
                          ไขคดีสำเร็จ: {detectiveCorrectCount} คดี
                        </span>
                      </div>
                      <div style={{ fontSize: '0.98rem', fontWeight: 900, color: '#fde047', marginBottom: 4 }}>
                        {item.title}
                      </div>
                      <p style={{ margin: '0 0 12px', fontSize: '0.86rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                        เบาะแส: “{item.clue}”
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {item.options.map((ch, idx) => {
                          const isSelected = detectivePicked === idx;
                          const isAnswer = idx === item.ans;
                          const bg = detectivePicked === null
                            ? '#312e81'
                            : isAnswer
                              ? '#166534'
                              : isSelected
                                ? '#991b1b'
                                : '#312e81';
                          return (
                            <button
                              key={ch}
                              type="button"
                              onClick={() => {
                                if (detectivePicked !== null) return;
                                setDetectivePicked(idx);
                                if (idx === item.ans) {
                                  setDetectiveCorrectCount((c) => c + 1);
                                  celebrate();
                                  setWorldStars((s) => s + 3);
                                  const unitNo = boards[0]?.unitNo || 1;
                                  void recordActivity('game', `u${unitNo}-deepfake-detective-${detectiveIdx + 1}`, unitNo, `ไขคดีนักสืบไซเบอร์: ${item.title}`);
                                }
                              }}
                              style={{
                                textAlign: 'left',
                                padding: '10px 12px',
                                borderRadius: 10,
                                border: isSelected ? '2px solid #fde047' : '1px solid #6366f1',
                                background: bg,
                                color: '#fff',
                                fontWeight: 800,
                                fontSize: '0.84rem',
                                fontFamily: 'inherit',
                                cursor: detectivePicked === null ? 'pointer' : 'default',
                              }}
                            >
                              {ch}
                            </button>
                          );
                        })}
                      </div>
                      {detectivePicked !== null && (
                        <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: 'rgba(244, 114, 182, 0.16)', border: '1px solid #f472b6', fontSize: '0.82rem' }}>
                          <strong>{detectivePicked === item.ans ? '✅ วินิจฉัยถูกต้อง! (+3⭐) ' : '💡 คำแนะนำนักสืบไซเบอร์: '}</strong>
                          {item.explain}
                          <div style={{ marginTop: 8 }}>
                            <button
                              type="button"
                              onClick={() => {
                                setDetectivePicked(null);
                                setDetectiveIdx((idx) => (idx + 1) % DEEPFAKE_DETECTIVE_CASES.length);
                              }}
                              style={{
                                padding: '6px 14px',
                                borderRadius: 8,
                                border: 0,
                                background: '#f472b6',
                                color: '#0f172a',
                                fontWeight: 900,
                                fontSize: '0.8rem',
                                fontFamily: 'inherit',
                                cursor: 'pointer',
                              }}
                            >
                              คดีถัดไป ▶
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {miniGameTab === 'rescue' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ padding: 14, borderRadius: 12, background: '#0f172a', color: '#fff', border: '2px solid #34d399' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#34d399' }}>
                    🐕 SPACE RESCUE · โค้ดดิ้งสั่งการหุ่นยนต์สุนัข 4 ขากู้ภัยอวกาศ (NSM Zone 4)
                  </div>
                  <p style={{ margin: '4px 0 10px', fontSize: '0.82rem', color: '#cbd5e1' }}>
                    ภารกิจ: หุ่นสุนัขเริ่มต้นที่ช่อง <strong>(0,0) หันหน้าไปทางขวา (➡️ ทิศตะวันออก)</strong> ต้องเดินไปเก็บถังออกซิเจน <strong>⛽ ที่ช่อง (2,2)</strong> โดยห้ามชนหลุมอุกกาบาต <strong>☄️ ที่ (1,0) และ (2,1)</strong>! (คำใบ้: หันลง ➡️ เดินหน้า 2 ครั้ง ➡️ หันซ้าย ➡️ เดินหน้า 2 ครั้ง)
                  </p>

                  {/* ตารางดาวอังคาร 3x3 */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 68px)', gap: 6, justifyContent: 'center', margin: '10px 0' }}>
                    {[0, 1, 2].map((row) =>
                      [0, 1, 2].map((col) => {
                        const isStart = row === 0 && col === 0;
                        const isGoal = row === 2 && col === 2;
                        const isHazard = (row === 0 && col === 1) || (row === 1 && col === 2);
                        return (
                          <div
                            key={`${row}-${col}`}
                            style={{
                              width: 68,
                              height: 68,
                              borderRadius: 10,
                              background: isGoal ? '#065f46' : isHazard ? '#7f1d1d' : isStart ? '#1e3a8a' : '#1e293b',
                              border: '2px solid #475569',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.25rem',
                            }}
                          >
                            <span>{isStart ? '🐕➡️' : isGoal ? '⛽' : isHazard ? '☄️' : '·'}</span>
                            <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>({col},{row})</span>
                          </div>
                        );
                      }),
                    )}
                  </div>

                  {/* ปุ่มเพิ่มชุดคำสั่ง */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
                    {[
                      { cmd: 'F' as const, label: '⬆️ เดินหน้า 1 ช่อง (F)', bg: '#0284c7' },
                      { cmd: 'L' as const, label: '↩️ หันซ้าย 90° (L)', bg: '#7c3aed' },
                      { cmd: 'R' as const, label: '↪️ หันขวา 90° (R)', bg: '#d97706' },
                    ].map((b) => (
                      <button
                        key={b.cmd}
                        type="button"
                        onClick={() => {
                          if (rescueProgram.length >= 10) return;
                          setRescueProgram((p) => [...p, b.cmd]);
                        }}
                        style={{
                          padding: '7px 12px',
                          borderRadius: 8,
                          border: 0,
                          background: b.bg,
                          color: '#fff',
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          fontFamily: 'inherit',
                          cursor: 'pointer',
                        }}
                      >
                        + {b.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setRescueProgram([]);
                        setRescueStatusMsg('ล้างลำดับคำสั่งแล้ว — เรียงคำสั่งใหม่ได้เลย!');
                      }}
                      style={{
                        padding: '7px 12px',
                        borderRadius: 8,
                        border: '1px solid #94a3b8',
                        background: 'transparent',
                        color: '#e2e8f0',
                        fontWeight: 800,
                        fontSize: '0.78rem',
                        fontFamily: 'inherit',
                        cursor: 'pointer',
                      }}
                    >
                      🗑️ ล้างคำสั่ง
                    </button>
                  </div>

                  {/* แสดงโปรแกรมที่เรียงไว้ */}
                  <div style={{ margin: '10px 0', padding: 10, borderRadius: 8, background: '#090d16', border: '1px solid #334155', fontFamily: 'monospace', fontSize: '0.84rem' }}>
                    <strong>ลำดับคำสั่ง ({rescueProgram.length}/10): </strong>
                    {rescueProgram.length === 0
                      ? 'ยังไม่มีคำสั่ง (กดปุ่มด้านบนเพื่อเรียงบล็อกคำสั่ง)'
                      : rescueProgram.map((c, i) => `${i + 1}.${c === 'F' ? 'เดินหน้า(F)' : c === 'L' ? 'หันซ้าย(L)' : 'หันขวา(R)'}`).join(' → ')}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => {
                        // จำลองการทำงานของหุ่นสุนัข: เริ่มที่ (col=0, row=0), dir=0 (0:ขวา, 1:ลง, 2:ซ้าย, 3:ขึ้น)
                        let col = 0;
                        let row = 0;
                        let dir = 0;
                        const dx = [1, 0, -1, 0];
                        const dy = [0, 1, 0, -1];
                        for (let step = 0; step < rescueProgram.length; step += 1) {
                          const cmd = rescueProgram[step];
                          if (cmd === 'R') dir = (dir + 1) % 4;
                          else if (cmd === 'L') dir = (dir + 3) % 4;
                          else if (cmd === 'F') {
                            col += dx[dir];
                            row += dy[dir];
                            if (col < 0 || col > 2 || row < 0 || row > 2) {
                              setRescueStatusMsg(`❌ ขั้นที่ ${step + 1}: หุ่นสุนัขเดินหลุดออกนอกแผนที่ดาวอังคาร! ลองปรับคำสั่งใหม่นะ`);
                              return;
                            }
                            if ((row === 0 && col === 1) || (row === 1 && col === 2)) {
                              setRescueStatusMsg(`💥 ขั้นที่ ${step + 1}: หุ่นสุนัขชนหลุมอุกกาบาตที่ช่อง (${col},${row})! ลองหันหลบก่อนเดินหน้านะ`);
                              return;
                            }
                          }
                        }
                        if (col === 2 && row === 2) {
                          celebrate();
                          setWorldStars((s) => s + 12);
                          const unitNo = boards[0]?.unitNo || 1;
                          void recordActivity('game', `u${unitNo}-robodog-space-rescue`, unitNo, 'เขียนโปรแกรมหุ่นสุนัขกู้ภัย SPACE RESCUE สำเร็จ');
                          setRescueStatusMsg('🏆 ภารกิจสำเร็จ! หุ่นยนต์สุนัข 4 ขาเดินทางถึงช่อง (2,2) และเก็บถังออกซิเจนกู้ภัยสำเร็จ รับโบนัส +12⭐!');
                        } else {
                          setRescueStatusMsg(`🤖 หุ่นสุนัขหยุดอยู่ที่ช่อง (${col},${row}) ยังไม่ถึงถังออกซิเจน (2,2) — ลองเพิ่มคำสั่งอีกนิด!`);
                        }
                      }}
                      style={{
                        padding: '9px 18px',
                        borderRadius: 10,
                        border: 0,
                        background: 'linear-gradient(135deg, #059669, #10b981)',
                        color: '#fff',
                        fontWeight: 900,
                        fontSize: '0.86rem',
                        fontFamily: 'inherit',
                        cursor: 'pointer',
                      }}
                    >
                      ▶ รันโปรแกรมหุ่นสุนัขกู้ภัย (+12⭐)
                    </button>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fde047' }}>
                      {rescueStatusMsg}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VirtualClassroom;
