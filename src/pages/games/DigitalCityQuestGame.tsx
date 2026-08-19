import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Coins,
  Copy,
  Crown,
  Dices,
  Download,
  Flag,
  Gamepad2,
  HeartHandshake,
  KeyRound,
  Lightbulb,
  LogIn,
  Maximize2,
  Minimize2,
  Monitor,
  RotateCcw,
  Shield,
  Sparkles,
  Wifi,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import GameLearnCard from '../../components/GameLearnCard';
import {
  DIGITAL_CITY_BOARD,
  DIGITAL_CITY_EVENTS,
  DIGITAL_CITY_QUESTIONS,
  LITERACY_DOMAINS,
  digitalCityQuestionId,
  isDigitalCityEvent,
  isDigitalCityQuestion,
  selectDigitalCityQuestion,
} from '../../data/digitalCityQuest';
import type {
  DigitalCityEvent,
  DigitalCityQuestion,
  LiteracyDomain,
} from '../../data/digitalCityQuest';
import {
  TYCOON_CHARACTERS,
  TYCOON_TOKENS,
  getTycoonCharacter,
  tileGridPos,
} from '../../data/tycoonGame';
import type { TileKind } from '../../data/tycoonGame';
import { useGameProgress } from '../../hooks/useGameProgress';
import {
  cancelTycoonRoom,
  canStartTycoonRoom,
  createTycoonRoom,
  joinTycoonRoom,
  leaveTycoonRoom,
  mergeDigitalCitySupportPlayers,
  orderedTycoonRoomPlayers,
  publishTycoonGame,
  startTycoonMultiplayerRoom,
  subscribeTycoonRoom,
  supportDigitalCityTurn,
  updateTycoonRoomPlayer,
} from '../../services/tycoonMultiplayerService';
import type {
  DigitalCitySupport,
  TycoonGamePhase,
  TycoonGameSnapshot,
  TycoonPlayerState,
  TycoonRoom,
  TycoonRoomSyncMode,
} from '../../services/tycoonMultiplayerService';
import { celebrateVictory } from '../../utils/victoryEffect';
import './GameStyles.css';
import './DigitalCityQuestGame.css';

type Phase = 'setup' | TycoonGamePhase;
type Player = TycoonPlayerState;
type PlayMode = 'shared' | 'online';
type ImpactFxKind = 'earn' | 'pay' | 'build' | 'upgrade' | 'correct' | 'wrong' | 'event' | 'shield';
type TutorialStepId = 'setup' | 'roll' | 'question' | 'economy' | 'project' | 'team' | 'victory';

interface ImpactFx {
  id: number;
  kind: ImpactFxKind;
  icon: string;
  title: string;
  detail: string;
  amount?: number;
}

interface TutorialStep {
  id: TutorialStepId;
  label: string;
  title: string;
  summary: string;
  actions: string[];
  example: string;
}

const START_BUDGET = 7_000;
const ROUND_GRANT = 900;
const QUESTION_SECONDS = 35;
const BOARD_SIZE = DIGITAL_CITY_BOARD.length;
const ROLL_START_DELAY_MS = 360;
const MOVE_STEP_DELAY_MS = 170;
const LANDING_SETTLE_MS = 650;
const ACTIVE_ROOM_KEY = 'kj_digital_city_active_room';
const PLAYER_ID_KEY = 'kj_tycoon_player_id';
const DOMAIN_KEYS = Object.keys(LITERACY_DOMAINS) as LiteracyDomain[];
const FX_PARTICLES = Array.from({ length: 12 }, (_, index) => index);
const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'setup',
    label: 'เตรียมทีม',
    title: 'เลือกโหมด ทีม และตัวละคร',
    summary: 'เริ่มจากเลือกเล่นจอเดียวหรือหลายจอ ตั้งชื่อทีม แล้วเลือกตัวละครที่ยังไม่มีทีมอื่นใช้',
    actions: ['เลือกโหมดให้ตรงกับจำนวนอุปกรณ์', 'กรอกชื่อทีมและเลือกตัวละคร', 'โหมดหลายจอให้ทุกคนกดเตรียมพร้อมก่อนเจ้าของห้องเริ่ม'],
    example: 'ตัวอย่าง: ห้องมีคอมพิวเตอร์ 4 เครื่อง ให้ครูสร้างห้องหลายจอ แล้วนักเรียน 3 ทีมกรอกรหัสเดียวกัน',
  },
  {
    id: 'roll',
    label: 'ทอยและเดิน',
    title: 'ทอยลูกเต๋าแล้วเดินตามจำนวนช่อง',
    summary: 'เมื่อถึงตาของทีม ปุ่มทอยจะทำงาน ตัวละครเดินอัตโนมัติและหยุดทำกิจกรรมของช่องนั้น',
    actions: ['ตรวจชื่อทีมที่กำลังเล่นบนแถบด้านบน', 'กดทอยลูกเต๋าเพียงหนึ่งครั้ง', 'รอให้ตัวละครเดินครบก่อนอ่านภารกิจ'],
    example: 'ตัวอย่าง: ทอยได้ 4 ตัวละครเดิน 4 ช่อง และหยุดที่ช่องภารกิจหลักฐาน',
  },
  {
    id: 'question',
    label: 'ตอบภารกิจ',
    title: 'อ่านหลักฐานก่อนเลือกคำตอบ',
    summary: 'ภารกิจมีสถานการณ์ ตารางหรือข้อมูล และคำถาม 3 ตัวเลือก คำตอบที่ดีต้องอ้างอิงข้อมูลที่เห็นจริง',
    actions: ['อ่านสถานการณ์และหัวตารางให้ครบ', 'ตัดตัวเลือกที่ขัดกับหลักฐานออก', 'เลือกคำตอบภายในเวลาและอ่านคำอธิบายผล'],
    example: 'ตัวอย่าง: ข้อมูลบอกว่าแผง A ใช้ไฟน้อยที่สุด จึงเลือก A แทนการเดาจากชื่ออุปกรณ์',
  },
  {
    id: 'economy',
    label: 'รับ–จ่าย',
    title: 'จัดการเครดิตอย่างมีเหตุผล',
    summary: 'ทีมได้รับเครดิตจากภารกิจและรอบใหม่ ส่วนค่าบริการหรือการลงทุนจะหักจากงบพร้อมเอฟเฟกต์แจ้งผล',
    actions: ['ดูยอดเครดิตก่อนตัดสินใจ', 'กันงบไว้สำหรับค่าบริการที่อาจเกิดขึ้น', 'เปรียบเทียบผลระยะยาวก่อนจ่าย'],
    example: 'ตัวอย่าง: มี 2,000 เครดิต จ่ายค่าบริการ 600 เครดิต จึงเหลือ 1,400 เครดิต',
  },
  {
    id: 'project',
    label: 'สร้างเมือง',
    title: 'เปิดและพัฒนาโครงการของทีม',
    summary: 'ตอบภารกิจสำเร็จในช่องโครงการแล้วเลือกเปิดโครงการ จากนั้นกลับมาที่ช่องเดิมเพื่อพัฒนาได้ถึงขั้น 3',
    actions: ['ตอบคำถามของช่องให้ถูกต้อง', 'ตรวจราคาแล้วเลือกเปิดโครงการ', 'สะสมโครงการหลายกลุ่มและพัฒนาอย่างสมดุล'],
    example: 'ตัวอย่าง: เปิดศูนย์ข้อมูลขั้น 1 แล้วกลับมาอีกครั้งเพื่อพัฒนาเป็นขั้น 2 ซึ่งให้คะแนนกลยุทธ์เพิ่ม',
  },
  {
    id: 'team',
    label: 'ช่วยเพื่อน',
    title: 'ผู้รอสามารถสนับสนุนทีมที่กำลังเล่น',
    summary: 'โหมดหลายจอ ผู้เล่นที่รอไม่เห็นคำตอบ แต่ช่วยเพิ่มเวลา ส่งเกราะงบ หรือให้กำลังใจได้หนึ่งครั้งต่อตา',
    actions: ['ดูสถานะผู้เล่นที่กำลังทำภารกิจ', 'เลือกความช่วยเหลือที่เหมาะกับสถานการณ์', 'แบ่งหน้าที่อ่าน คำนวณ และตรวจหลักฐาน'],
    example: 'ตัวอย่าง: เพื่อนเหลือเวลา 4 วินาที ผู้รอกด +5 วินาที ทีมจึงมีเวลาอ่านตารางจนจบ',
  },
  {
    id: 'victory',
    label: 'ชนะอย่างมีคุณภาพ',
    title: 'สะสมคะแนน K/P/A ให้ครบเกณฑ์',
    summary: 'คะแนนรวมมาจากความรู้ การคิดปฏิบัติ และความร่วมมือ ผู้ชนะที่สมบูรณ์ต้องตอบแม่นอย่างน้อย 60% ครบ 3 ด้าน และผ่านภารกิจขั้นสูง',
    actions: ['K เพิ่มจากการตอบโดยใช้หลักฐาน', 'P เพิ่มจากกลยุทธ์ การตัดสินใจ และพัฒนาโครงการ', 'A เพิ่มจากการช่วยเหลือและทำงานร่วมกัน'],
    example: 'ตัวอย่าง: K 32 + P 43 + A 8 = 83 คะแนน และผ่านเงื่อนไขสมรรถนะครบ จึงเป็นแชมป์มหานคร',
  },
];

const formatNumber = (value: number) => value.toLocaleString('th-TH');
const formatClock = (seconds: number) => (
  `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
);
const rollDice = () => 1 + Math.floor(Math.random() * 6);
const pick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

const getSession = (key: string) => {
  try { return sessionStorage.getItem(key) || ''; } catch { return ''; }
};

const setSession = (key: string, value: string) => {
  try {
    if (value) sessionStorage.setItem(key, value);
    else sessionStorage.removeItem(key);
  } catch {
    // Session recovery is optional.
  }
};

const getPlayerId = () => {
  const saved = getSession(PLAYER_ID_KEY);
  if (saved) return saved;
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `city_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  setSession(PLAYER_ID_KEY, id);
  return id;
};

const createPlayer = (idx: number, name: string, characterId: string): Player => ({
  idx,
  name,
  characterId,
  pos: 0,
  money: START_BUDGET,
  owned: [],
  levels: {},
  skip: 0,
  out: false,
  correct: 0,
  answered: 0,
  mastery: {},
  missionProgress: {},
  evidenceScore: 0,
  strategyScore: 0,
  collaborationScore: 0,
  efficiencyScore: 0,
  advancedMissions: 0,
  recoveryCount: 0,
  shielded: false,
});

const completedGroups = (player: Player) => {
  const groups = new Map<string, number[]>();
  DIGITAL_CITY_BOARD.forEach((tile, index) => {
    if (!tile.property) return;
    const indexes = groups.get(tile.property.group) || [];
    indexes.push(index);
    groups.set(tile.property.group, indexes);
  });
  return [...groups.values()].filter((indexes) => indexes.every((index) => player.owned.includes(index))).length;
};

const projectFee = (tileIndex: number, level = 0) => {
  const price = DIGITAL_CITY_BOARD[tileIndex].property?.price || 0;
  return Math.round(price * (0.16 + (level * 0.09)));
};

const projectUpgradeCost = (tileIndex: number, level = 0) => {
  const price = DIGITAL_CITY_BOARD[tileIndex].property?.price || 0;
  return Math.round(price * (0.35 + (level * 0.15)));
};

export interface DigitalCityScore {
  knowledge: number;
  strategy: number;
  advanced: number;
  collaboration: number;
  efficiency: number;
  total: number;
  accuracy: number;
  masteredDomains: number;
  qualified: boolean;
}

const scoreDigitalCityPlayer = (player: Player): DigitalCityScore => {
  const accuracy = player.answered > 0 ? player.correct / player.answered : 0;
  const masteredDomains = DOMAIN_KEYS.filter((domain) => (player.mastery?.[domain] || 0) > 0).length;
  const knowledge = Math.min(
    40,
    Math.round(accuracy * 25 * Math.min(1, player.answered / 8))
      + (masteredDomains * 2)
      + Math.min(5, player.evidenceScore || 0),
  );
  const strategy = Math.min(25, player.strategyScore || 0);
  const advanced = Math.min(20, ((player.advancedMissions || 0) * 5) + Math.min(5, player.evidenceScore || 0));
  const collaboration = Math.min(10, player.collaborationScore || 0);
  const efficiency = Math.min(5, player.efficiencyScore || 0);
  return {
    knowledge,
    strategy,
    advanced,
    collaboration,
    efficiency,
    total: knowledge + strategy + advanced + collaboration + efficiency,
    accuracy,
    masteredDomains,
    qualified: accuracy >= 0.6 && masteredDomains >= 3 && (player.advancedMissions || 0) >= 1,
  };
};

const gameSignature = (game: Omit<TycoonGameSnapshot, 'version' | 'updatedBy'>) => JSON.stringify(game);

const Avatar: React.FC<{
  characterId: string;
  size?: 'token' | 'small' | 'large';
  active?: boolean;
  walking?: boolean;
}> = ({ characterId, size = 'small', active = false, walking = false }) => {
  const character = getTycoonCharacter(characterId);
  const base = character.image.replace(/\.webp$/, '');
  return (
    <span className={`dcq-avatar is-${size}${active ? ' active' : ''}${walking ? ' walking' : ''}`} title={character.name}>
      {[character.image, `${base}-2.webp`, `${base}-3.webp`].map((src, index) => (
        <img key={src} src={src} alt={index === 0 ? character.name : ''} aria-hidden={index > 0} draggable={false} />
      ))}
    </span>
  );
};

const CharacterPicker: React.FC<{
  selected: string;
  onSelect: (value: string) => void;
  taken?: string[];
  disabled?: boolean;
}> = ({ selected, onSelect, taken = [], disabled = false }) => (
  <div className="dcq-character-grid">
    {TYCOON_CHARACTERS.map((character) => {
      const unavailable = taken.includes(character.id) && character.id !== selected;
      return (
        <button
          key={character.id}
          type="button"
          className={selected === character.id ? 'selected' : ''}
          onClick={() => onSelect(character.id)}
          disabled={disabled || unavailable}
        >
          <Avatar characterId={character.id} size="large" active={selected === character.id} />
          <b>{character.name}</b>
          <small>{unavailable ? 'มีคนเลือกแล้ว' : character.role}</small>
        </button>
      );
    })}
  </div>
);

const TutorialVisual: React.FC<{ step: TutorialStepId }> = ({ step }) => {
  const firstCharacter = TYCOON_CHARACTERS[0].id;
  const secondCharacter = TYCOON_CHARACTERS[1].id;

  if (step === 'setup') {
    return (
      <div className="dcq-tutorial-scene is-setup">
        <span className="dcq-tutorial-room">ห้อง 452731</span>
        <div className="dcq-tutorial-team"><Avatar characterId={firstCharacter} size="large" active /><b>ทีมสิงโต</b><small>พร้อมแล้ว</small></div>
        <div className="dcq-tutorial-team"><Avatar characterId={secondCharacter} size="large" /><b>ทีมโลมา</b><small>กำลังเตรียม</small></div>
        <span className="dcq-tutorial-ready"><Check size={18} /> ทุกทีมพร้อม</span>
      </div>
    );
  }

  if (step === 'roll') {
    return (
      <div className="dcq-tutorial-scene is-roll">
        <span className="dcq-tutorial-dice">⚃</span>
        <div className="dcq-tutorial-track">
          {['เริ่ม', 'ข้อมูล', 'ภารกิจ', 'พลังงาน', 'หลักฐาน'].map((label, index) => (
            <span key={label} className={index === 4 ? 'target' : ''}>{index === 0 && <Avatar characterId={firstCharacter} size="token" />}{label}</span>
          ))}
        </div>
        <span className="dcq-tutorial-move">เดิน 4 ช่อง <ChevronRight size={18} /></span>
      </div>
    );
  }

  if (step === 'question') {
    return (
      <div className="dcq-tutorial-scene is-question">
        <div className="dcq-tutorial-evidence"><b>หลักฐานการใช้พลังงาน</b><span>อาคาร A <strong>40 หน่วย</strong></span><span>อาคาร B <strong>65 หน่วย</strong></span></div>
        <div className="dcq-tutorial-answers"><b>อาคารใดใช้พลังงานน้อยกว่า?</b><span className="correct"><Check size={16} /> อาคาร A</span><span>อาคาร B</span><span>ข้อมูลไม่เพียงพอ</span></div>
      </div>
    );
  }

  if (step === 'economy') {
    return (
      <div className="dcq-tutorial-scene is-economy">
        <div><Coins /><small>งบก่อนจ่าย</small><b>2,000</b></div>
        <span className="dcq-tutorial-transaction">-600<small>ค่าบริการ</small></span>
        <div><Coins /><small>งบคงเหลือ</small><b>1,400</b></div>
      </div>
    );
  }

  if (step === 'project') {
    return (
      <div className="dcq-tutorial-scene is-project">
        {[1, 2, 3].map((level) => <div key={level} className={level === 2 ? 'active' : ''}><span>{level === 1 ? '🏗️' : level === 2 ? '🏢' : '🌆'}</span><b>ขั้น {level}</b><small>{level === 1 ? 'เปิดโครงการ' : level === 2 ? 'พัฒนาระบบ' : 'ต้นแบบเมือง'}</small></div>)}
        <span className="dcq-tutorial-upgrade"><Sparkles size={17} /> พัฒนาทีละขั้น</span>
      </div>
    );
  }

  if (step === 'team') {
    return (
      <div className="dcq-tutorial-scene is-team">
        <div className="dcq-tutorial-active-player"><Avatar characterId={firstCharacter} size="large" active /><b>กำลังตอบภารกิจ</b><span><Clock3 size={15} /> 4 วินาที</span></div>
        <HeartHandshake className="dcq-tutorial-handshake" />
        <div className="dcq-tutorial-support"><Avatar characterId={secondCharacter} size="large" /><b>ทีมผู้ช่วย</b><span>+5 วินาที</span><span><Shield size={15} /> เกราะงบ</span></div>
      </div>
    );
  }

  return (
    <div className="dcq-tutorial-scene is-victory">
      <Crown className="dcq-tutorial-crown" />
      <strong>83 / 100</strong>
      <div className="dcq-tutorial-score"><span style={{ '--tutorial-score': '80%' } as React.CSSProperties}>K หลักฐาน <b>32/40</b></span><span style={{ '--tutorial-score': '86%' } as React.CSSProperties}>P ปฏิบัติคิด <b>43/50</b></span><span style={{ '--tutorial-score': '80%' } as React.CSSProperties}>A ร่วมมือ <b>8/10</b></span></div>
      <small><Check size={15} /> ผ่านเกณฑ์แชมป์มหานคร</small>
    </div>
  );
};

const SpecialIcon: React.FC<{ kind: TileKind }> = ({ kind }) => {
  if (kind === 'start') return <Flag size={22} />;
  if (kind === 'chance') return <Sparkles size={22} />;
  if (kind === 'rest') return <HeartHandshake size={22} />;
  if (kind === 'gotoRest') return <Shield size={22} />;
  if (kind === 'learn') return <BookOpen size={22} />;
  return <BarChart3 size={22} />;
};

const DigitalCityQuestGame: React.FC = () => {
  const { user } = useAuth();
  const recordGame = useGameProgress('digital-city-quest', 'ภารกิจกู้มหานครอัจฉริยะ');
  const [multiplayerPlayerId] = useState(getPlayerId);
  const [phase, setPhase] = useState<Phase>('setup');
  const [playMode, setPlayMode] = useState<PlayMode>(() => (getSession(ACTIVE_ROOM_KEY) ? 'online' : 'shared'));
  const [count, setCount] = useState(3);
  const [minutes, setMinutes] = useState<5 | 10 | 15>(10);
  const [teamNames, setTeamNames] = useState(() => TYCOON_TOKENS.map((token) => token.name));
  const [teamCharacters, setTeamCharacters] = useState(() => TYCOON_CHARACTERS.slice(0, 4).map((item) => item.id));
  const [editingTeam, setEditingTeam] = useState(0);
  const [players, setPlayers] = useState<Player[]>([]);
  const [turn, setTurn] = useState(0);
  const [turnSerial, setTurnSerial] = useState(0);
  const [dice, setDice] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [question, setQuestion] = useState<DigitalCityQuestion | null>(null);
  const [usedQuestionIds, setUsedQuestionIds] = useState<string[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [questionTime, setQuestionTime] = useState(QUESTION_SECONDS);
  const [questionEndsAt, setQuestionEndsAt] = useState(0);
  const [eventCard, setEventCard] = useState<DigitalCityEvent | null>(null);
  const [message, setMessage] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [buyTile, setBuyTile] = useState<number | null>(null);
  const [upgradeTile, setUpgradeTile] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(10 * 60);
  const [gameEndsAt, setGameEndsAt] = useState(0);
  const [finishReason, setFinishReason] = useState('');
  const [showDashboard, setShowDashboard] = useState(false);
  const [showPlayerReveal, setShowPlayerReveal] = useState(false);
  const [impactQueue, setImpactQueue] = useState<ImpactFx[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reflection, setReflection] = useState({ strategy: '', evidence: '', transfer: '' });
  const [reflectionSaved, setReflectionSaved] = useState(false);

  const [onlineRoomCode, setOnlineRoomCode] = useState(() => getSession(ACTIVE_ROOM_KEY));
  const [onlineRoom, setOnlineRoom] = useState<TycoonRoom | null>(null);
  const [syncMode, setSyncMode] = useState<TycoonRoomSyncMode>('connecting');
  const [roomName, setRoomName] = useState('ห้องภารกิจกู้มหานครอัจฉริยะ');
  const [roomPassword, setRoomPassword] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [onlineName, setOnlineName] = useState(() => user?.name || 'นักพัฒนาเมือง');
  const [onlineCharacter, setOnlineCharacter] = useState(TYCOON_CHARACTERS[0].id);
  const [roomBusy, setRoomBusy] = useState(false);
  const [roomError, setRoomError] = useState('');
  const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  const appliedRemoteVersionRef = useRef(0);
  const applyingRemoteRef = useRef(false);
  const lastSignatureRef = useRef('');
  const revealedOnlineGameRef = useRef(0);

  const activePlayer = players[turn];
  const onlineMembers = onlineRoom ? orderedTycoonRoomPlayers(onlineRoom) : [];
  const onlineSeat = onlineMembers.findIndex((member) => member.id === multiplayerPlayerId);
  const onlineMember = onlineMembers.find((member) => member.id === multiplayerPlayerId);
  const isOnlineGame = playMode === 'online' && Boolean(onlineRoomCode);
  const isRoomHost = onlineRoom?.hostId === multiplayerPlayerId;
  const canTakeTurn = !isOnlineGame || onlineSeat === turn;
  const onlineTurnOwnerId = onlineRoom?.game
    ? onlineMembers[onlineRoom.game.turn]?.id
    : null;
  const canPublishTurn = !isOnlineGame || onlineTurnOwnerId === multiplayerPlayerId;
  const authoritativeGameEndsAt = isOnlineGame && onlineRoom?.game?.endsAt
    ? onlineRoom.game.endsAt
    : gameEndsAt;
  const canSendSupport = phase === 'question'
    && Boolean(question)
    && picked === null
    && onlineMember?.lastSupportSerial !== turnSerial;
  const rankedPlayers = useMemo(() => (
    [...players].sort((a, b) => scoreDigitalCityPlayer(b).total - scoreDigitalCityPlayer(a).total)
  ), [players]);
  const impactFx = impactQueue[0] || null;

  const queueImpact = (kind: ImpactFxKind, icon: string, title: string, detail: string, amount?: number) => {
    setImpactQueue((current) => [...current, {
      id: Date.now() + current.length,
      kind,
      icon,
      title,
      detail,
      amount,
    }]);
  };

  const drawQuestion = (player: Player) => selectDigitalCityQuestion(
    player.missionProgress || {},
    player.mastery || {},
    usedQuestionIds,
  );

  const rememberQuestion = (nextQuestion: DigitalCityQuestion) => {
    const questionId = digitalCityQuestionId(nextQuestion);
    setUsedQuestionIds((current) => (
      current.includes(questionId) ? current : [...current, questionId]
    ));
  };

  const recoverBudget = (list: Player[]): Player[] => list.map((player) => {
    if (player.money >= 0) return player;
    if (player.shielded) return { ...player, money: 0, shielded: false };
    return { ...player, money: 500, recoveryCount: (player.recoveryCount || 0) + 1 };
  });

  const resetTurnUi = () => {
    setDice(null);
    setQuestion(null);
    setPicked(null);
    setQuestionEndsAt(0);
    setQuestionTime(QUESTION_SECONDS);
    setEventCard(null);
    setBuyTile(null);
    setUpgradeTile(null);
  };

  const finish = (list: Player[], reason = 'หมดเวลาแข่งขัน') => {
    setPlayers(list);
    setFinishReason(reason);
    setPhase('over');
    setShowDashboard(false);
    const winner = [...list].sort((a, b) => scoreDigitalCityPlayer(b).total - scoreDigitalCityPlayer(a).total)[0];
    celebrateVictory();
    void recordGame(Math.max(10, scoreDigitalCityPlayer(winner).total), 'digital-city-competition');
  };

  const nextTurn = (list: Player[]) => {
    if (isOnlineGame && !canTakeTurn) return;
    const next = (turn + 1) % list.length;
    setPlayers(recoverBudget(list));
    setTurn(next);
    setTurnSerial((value) => value + 1);
    setPhase('roll');
    resetTurnUi();
    setSupportMessage('');
    setMessage(`ถึงตา ${list[next].name}`);
  };

  const startShared = () => {
    const list = Array.from({ length: count }, (_, index) => createPlayer(
      index,
      teamNames[index].trim() || TYCOON_TOKENS[index].name,
      teamCharacters[index],
    ));
    const endsAt = Date.now() + (minutes * 60_000);
    setPlayers(list);
    setTurn(0);
    setTurnSerial(0);
    setUsedQuestionIds([]);
    setPhase('roll');
    setTimeLeft(minutes * 60);
    setGameEndsAt(endsAt);
    setFinishReason('');
    setShowPlayerReveal(true);
    setImpactQueue([]);
    setReflectionSaved(false);
    resetTurnUi();
    setMessage(`เริ่มภารกิจ ทุกทีมได้รับงบพัฒนา ${formatNumber(START_BUDGET)} เครดิต`);
  };

  const land = (list: Player[], position: number) => {
    const tile = DIGITAL_CITY_BOARD[position];
    const current = list[turn];
    if (tile.kind === 'property') {
      const owner = list.find((player) => player.owned.includes(position));
      if (!owner) {
        const nextQuestion = drawQuestion(current);
        rememberQuestion(nextQuestion);
        setQuestion(nextQuestion);
        setPicked(null);
        setQuestionTime(QUESTION_SECONDS);
        setQuestionEndsAt(Date.now() + (QUESTION_SECONDS * 1000));
        setBuyTile(position);
        setPhase('question');
        setMessage(`พิสูจน์แนวคิดก่อนเปิดโครงการ ${tile.property?.name}`);
        return;
      }
      if (owner.idx === current.idx) {
        setUpgradeTile(position);
        setPhase('info');
        setMessage(`โครงการ ${tile.property?.name} พร้อมพัฒนาต้นแบบขั้นถัดไป`);
        return;
      }
      const fee = projectFee(position, owner.levels[position] || 0);
      const protectedByFriend = Boolean(current.shielded);
      const paid = protectedByFriend ? 0 : Math.min(fee, Math.max(0, current.money));
      const after = list.map((player) => {
        if (player.idx === current.idx) return { ...player, money: player.money - paid, shielded: false };
        if (player.idx === owner.idx) return {
          ...player,
          money: player.money + paid,
          collaborationScore: Math.min(10, (player.collaborationScore || 0) + 1),
        };
        return player;
      });
      setPlayers(recoverBudget(after));
      setPhase('info');
      queueImpact(
        protectedByFriend ? 'shield' : 'pay',
        protectedByFriend ? '🛡️' : '💳',
        protectedByFriend ? 'เกราะงบทำงาน!' : 'ชำระค่าบริการ',
        protectedByFriend ? `${current.name} ไม่เสียเครดิตในรอบนี้` : `${current.name} จ่ายให้ ${owner.name}`,
        protectedByFriend ? 0 : -paid,
      );
      setMessage(protectedByFriend
        ? `เกราะจากเพื่อนช่วยคุ้มครองงบในโครงการ ${tile.property?.name}`
        : `ใช้บริการ ${tile.property?.name} ${formatNumber(paid)} เครดิต เจ้าของได้คะแนนร่วมพัฒนา`);
      return;
    }
    if (tile.kind === 'chance') {
      setEventCard(pick(DIGITAL_CITY_EVENTS));
      setPicked(null);
      setPhase('chance');
      setMessage('เหตุการณ์ตัดสินใจของเมือง เลือกจากหลักฐานให้รอบคอบ');
      return;
    }
    if (tile.kind === 'question' || tile.kind === 'learn') {
      const nextQuestion = drawQuestion(current);
      rememberQuestion(nextQuestion);
      setQuestion(nextQuestion);
      setPicked(null);
      setQuestionTime(QUESTION_SECONDS);
      setQuestionEndsAt(Date.now() + (QUESTION_SECONDS * 1000));
      setPhase('question');
      setMessage(tile.kind === 'learn' ? 'ศูนย์วิจัย: ภารกิจนี้มีโบนัสหลักฐาน' : 'ภารกิจวิเคราะห์สถานการณ์');
      return;
    }
    if (tile.kind === 'rest') {
      const after = list.map((player) => player.idx === current.idx ? {
        ...player,
        money: player.money + 250,
        collaborationScore: Math.min(10, (player.collaborationScore || 0) + 1),
      } : player);
      setPlayers(after);
      setPhase('info');
      queueImpact('earn', '🤝', 'ทุนชุมชน', `${current.name} ได้รับทุนและคะแนนความร่วมมือ`, 250);
      setMessage('เวิร์กช็อปชุมชน: รับงบ 250 เครดิต และความร่วมมือ +1');
      return;
    }
    if (tile.kind === 'gotoRest') {
      const rest = DIGITAL_CITY_BOARD.findIndex((item) => item.kind === 'rest');
      const after = list.map((player) => player.idx === current.idx
        ? { ...player, pos: rest, money: player.money - 300 }
        : player);
      setPlayers(recoverBudget(after));
      setPhase('info');
      queueImpact('pay', '🚨', 'กู้คืนระบบ', `${current.name} ย้ายเข้าศูนย์ฟื้นฟู`, -300);
      setMessage('ตรวจพบช่องโหว่: ย้ายเข้าศูนย์ฟื้นฟูระบบ ใช้งบ 300 เครดิต แต่ยังแข่งขันต่อได้');
      return;
    }
    setPhase('info');
    setMessage('ศูนย์บัญชาการเมือง: เตรียมรับทุนรอบใหม่');
  };

  const roll = () => {
    if (!activePlayer || isRolling || !canTakeTurn) return;
    const value = rollDice();
    setDice(value);
    setIsRolling(true);
    setMessage(`${activePlayer.name} กำลังทอยลูกเต๋า`);
    const raw = activePlayer.pos + value;
    const passed = raw >= BOARD_SIZE;
    let moving = players;
    const move = (step: number) => {
      const position = (activePlayer.pos + step) % BOARD_SIZE;
      moving = moving.map((player) => player.idx === activePlayer.idx ? { ...player, pos: position } : player);
      setPlayers(moving);
      if (step < value) {
        window.setTimeout(() => move(step + 1), MOVE_STEP_DELAY_MS);
        return;
      }
      const funded = moving.map((player) => (
        player.idx === activePlayer.idx && passed
          ? { ...player, money: player.money + ROUND_GRANT, efficiencyScore: Math.min(5, (player.efficiencyScore || 0) + 1) }
          : player
      ));
      setPlayers(funded);
      setMessage(`${activePlayer.name} เดินครบ ${value} ช่องแล้ว กำลังหยุดที่จุดหมาย`);
      window.setTimeout(() => {
        setIsRolling(false);
        if (passed) queueImpact('earn', '🏙️', 'ผ่านรอบมหานคร', `${activePlayer.name} รับทุนพัฒนารอบใหม่`, ROUND_GRANT);
        land(funded, position);
      }, LANDING_SETTLE_MS);
    };
    window.setTimeout(() => move(1), ROLL_START_DELAY_MS);
  };

  const answerQuestion = (choice: number) => {
    if (!question || !activePlayer || picked !== null || !canTakeTurn) return;
    const correct = choice === question.answer;
    setPicked(choice);
    setQuestionEndsAt(0);
    setQuestionTime(0);
    const quick = questionTime >= Math.ceil(QUESTION_SECONDS / 2);
    const after = players.map((player) => {
      if (player.idx !== activePlayer.idx) return player;
      const previousMissionStage = player.missionProgress?.[question.missionId] || 0;
      return {
        ...player,
        answered: player.answered + 1,
        correct: player.correct + (correct ? 1 : 0),
        money: player.money + (correct ? 350 + (question.stage * 100) : 0),
        mastery: correct ? {
          ...player.mastery,
          [question.domain]: (player.mastery?.[question.domain] || 0) + 1,
        } : player.mastery,
        missionProgress: correct ? {
          ...player.missionProgress,
          [question.missionId]: Math.max(previousMissionStage, question.stage),
        } : player.missionProgress,
        evidenceScore: Math.min(20, (player.evidenceScore || 0) + (correct ? question.stage : 0)),
        strategyScore: Math.min(25, (player.strategyScore || 0) + (correct && question.stage === 3 ? 2 : 0)),
        efficiencyScore: Math.min(5, (player.efficiencyScore || 0) + (correct && quick ? 1 : 0)),
        advancedMissions: (player.advancedMissions || 0)
          + (correct && question.stage === 3 && previousMissionStage < 3 ? 1 : 0),
      };
    });
    setPlayers(after);
    queueImpact(
      correct ? 'correct' : 'wrong',
      correct ? '✅' : '💡',
      correct ? 'วิเคราะห์ถูกต้อง!' : choice < 0 ? 'หมดเวลาภารกิจ' : 'ลองใหม่ในภารกิจถัดไป',
      correct ? `รับรางวัลหลักฐานขั้น ${question.stage}` : 'ระบบแสดงเหตุผลเพื่อใช้พัฒนาคำตอบ',
      correct ? 350 + (question.stage * 100) : undefined,
    );
    setMessage(correct
      ? `ถูกต้อง: ${question.why}`
      : `${choice < 0 ? 'หมดเวลา' : 'ยังไม่ถูก'}: ${question.why}`);
  };

  const buyProject = (yes: boolean) => {
    if (buyTile === null || !activePlayer || !canTakeTurn) return;
    const project = DIGITAL_CITY_BOARD[buyTile].property;
    if (!yes || picked !== question?.answer) {
      nextTurn(players);
      return;
    }
    if (!project || activePlayer.money < project.price) {
      setMessage('งบยังไม่พอเปิดโครงการนี้ ระบบจะพาไปตาถัดไป');
      window.setTimeout(() => nextTurn(players), 700);
      return;
    }
    const after = players.map((player) => player.idx === activePlayer.idx ? {
      ...player,
      money: player.money - project.price,
      owned: [...player.owned, buyTile],
      strategyScore: Math.min(25, (player.strategyScore || 0) + 2),
    } : player);
    setPlayers(after);
    setBuyTile(null);
    setUpgradeTile(null);
    setPhase('info');
    queueImpact('build', '🏗️', 'เปิดโครงการสำเร็จ', `${activePlayer.name} สร้าง ${project.name}`, -project.price);
    setMessage(`เปิดโครงการ ${project.name} สำเร็จ ได้คะแนนกลยุทธ์ +2`);
  };

  const upgradeProject = () => {
    if (upgradeTile === null || !activePlayer || !canTakeTurn) return;
    const project = DIGITAL_CITY_BOARD[upgradeTile].property;
    const level = activePlayer.levels[upgradeTile] || 0;
    const cost = projectUpgradeCost(upgradeTile, level);
    if (!project || level >= 3 || activePlayer.money < cost) {
      setMessage(level >= 3 ? 'โครงการนี้ใช้งานเต็มประสิทธิภาพแล้ว' : `ต้องมีงบ ${formatNumber(cost)} เครดิต`);
      return;
    }
    setPlayers(players.map((player) => player.idx === activePlayer.idx ? {
      ...player,
      money: player.money - cost,
      levels: { ...player.levels, [upgradeTile]: level + 1 },
      strategyScore: Math.min(25, (player.strategyScore || 0) + 1),
    } : player));
    setUpgradeTile(null);
    queueImpact('upgrade', '⚙️', 'อัปเกรดโครงการ', `${project.name} ขึ้นสู่ขั้น ${level + 1}`, -cost);
    setMessage(`พัฒนา ${project.name} เป็นขั้น ${level + 1} ได้คะแนนกลยุทธ์ +1`);
  };

  const chooseEvent = (choiceIndex: number) => {
    if (!eventCard || !activePlayer || picked !== null || !canTakeTurn) return;
    const choice = eventCard.choices[choiceIndex];
    setPicked(choiceIndex);
    const after = players.map((player) => player.idx === activePlayer.idx ? {
      ...player,
      money: player.money + choice.budget,
      strategyScore: Math.min(25, (player.strategyScore || 0) + choice.strategy),
      collaborationScore: Math.min(10, (player.collaborationScore || 0) + choice.collaboration),
      evidenceScore: Math.min(20, (player.evidenceScore || 0) + choice.evidence),
    } : player);
    setPlayers(recoverBudget(after));
    queueImpact(
      'event',
      eventCard.emoji,
      choice.budget >= 0 ? 'เหตุการณ์สร้างโอกาส' : 'เหตุการณ์ท้าทาย',
      choice.result,
      choice.budget || undefined,
    );
    setMessage(choice.result);
  };

  const createRoom = async () => {
    if (!onlineName.trim()) return setRoomError('กรุณาใส่ชื่อผู้เล่น');
    setRoomBusy(true);
    setRoomError('');
    const result = await createTycoonRoom({
      name: roomName,
      password: roomPassword,
      minutes,
      variant: 'digital-city',
      host: { id: multiplayerPlayerId, name: onlineName.trim(), characterId: onlineCharacter },
    });
    setRoomBusy(false);
    if (!result.ok || !result.room) return setRoomError(result.error || 'สร้างห้องไม่สำเร็จ');
    setOnlineRoom(result.room);
    setMinutes(result.room.minutes);
    setOnlineRoomCode(result.room.code);
    setJoinCode(result.room.code);
    setSession(ACTIVE_ROOM_KEY, result.room.code);
  };

  const joinRoom = async () => {
    if (joinCode.length !== 6) return setRoomError('กรุณาใส่รหัสห้อง 6 หลัก');
    if (!onlineName.trim()) return setRoomError('กรุณาใส่ชื่อผู้เล่น');
    setRoomBusy(true);
    setRoomError('');
    const result = await joinTycoonRoom(
      joinCode,
      roomPassword,
      { id: multiplayerPlayerId, name: onlineName.trim(), characterId: onlineCharacter },
      'digital-city',
    );
    setRoomBusy(false);
    if (!result.ok || !result.room) return setRoomError(result.error || 'เข้าห้องไม่สำเร็จ');
    setOnlineRoom(result.room);
    setMinutes(result.room.minutes);
    setOnlineRoomCode(result.room.code);
    setSession(ACTIVE_ROOM_KEY, result.room.code);
  };

  const leaveRoom = () => {
    if (onlineRoomCode) void leaveTycoonRoom(onlineRoomCode, multiplayerPlayerId);
    setSession(ACTIVE_ROOM_KEY, '');
    setOnlineRoomCode('');
    setOnlineRoom(null);
    revealedOnlineGameRef.current = 0;
    setPhase('setup');
  };

  const cancelOrLeaveOnlineGame = async () => {
    if (!onlineRoomCode) return;
    if (!isRoomHost) {
      if (window.confirm('ออกจากห้องแข่งขันนี้ใช่หรือไม่?')) leaveRoom();
      return;
    }
    if (!window.confirm('ยกเลิกการแข่งขันสำหรับผู้เล่นทุกคนใช่หรือไม่?')) return;
    setRoomBusy(true);
    setRoomError('');
    const result = await cancelTycoonRoom(onlineRoomCode, multiplayerPlayerId);
    setRoomBusy(false);
    if (!result.ok || !result.room?.game) {
      setRoomError(result.error || 'ยกเลิกเกมไม่สำเร็จ');
      return;
    }
    setOnlineRoom(result.room);
    setPlayers(result.room.game.players);
    setFinishReason(result.room.game.finishReason);
    setPhase('over');
  };

  const changeOnlineCharacter = async (characterId: string) => {
    setOnlineCharacter(characterId);
    if (!onlineRoomCode || !onlineMember) return;
    setRoomBusy(true);
    const result = await updateTycoonRoomPlayer(onlineRoomCode, multiplayerPlayerId, { characterId, ready: false });
    setRoomBusy(false);
    if (!result.ok) setRoomError(result.error || 'เปลี่ยนตัวละครไม่สำเร็จ');
  };

  const toggleReady = async () => {
    if (!onlineRoomCode || !onlineMember) return;
    setRoomBusy(true);
    const result = await updateTycoonRoomPlayer(onlineRoomCode, multiplayerPlayerId, {
      ready: !onlineMember.ready,
      name: onlineName.trim() || onlineMember.name,
    });
    setRoomBusy(false);
    if (!result.ok) setRoomError(result.error || 'เปลี่ยนสถานะไม่สำเร็จ');
  };

  const startOnline = async () => {
    if (!onlineRoom || !isRoomHost || !canStartTycoonRoom(onlineRoom)) return;
    const list = orderedTycoonRoomPlayers(onlineRoom).map((member, index) => createPlayer(index, member.name, member.characterId));
    const endsAt = Date.now() + (onlineRoom.minutes * 60_000);
    const base: Omit<TycoonGameSnapshot, 'version' | 'updatedBy'> = {
      variant: 'digital-city',
      turnSerial: 0,
      supportMessage: '',
      usedQuestionIds: [],
      phase: 'roll',
      players: list,
      turn: 0,
      dice: null,
      isRolling: false,
      question: null,
      picked: null,
      chance: null,
      message: `เริ่มภารกิจ ทุกคนได้รับงบ ${formatNumber(START_BUDGET)} เครดิต`,
      buyTile: null,
      rentTile: null,
      rentOwner: null,
      pendingRent: 0,
      upgradeTile: null,
      finishReason: '',
      endsAt,
      questionEndsAt: 0,
    };
    const snapshot: TycoonGameSnapshot = { ...base, version: Date.now(), updatedBy: multiplayerPlayerId };
    setRoomBusy(true);
    const result = await startTycoonMultiplayerRoom(onlineRoom.code, multiplayerPlayerId, snapshot);
    setRoomBusy(false);
    if (!result.ok) return setRoomError(result.error || 'เริ่มเกมไม่สำเร็จ');
    const authoritativeRoom = result.room || onlineRoom;
    const authoritativeEndsAt = authoritativeRoom.game?.endsAt || endsAt;
    setOnlineRoom(authoritativeRoom);
    setMinutes(authoritativeRoom.minutes);
    appliedRemoteVersionRef.current = snapshot.version;
    lastSignatureRef.current = gameSignature(base);
    setPlayers(list);
    setTurn(0);
    setTurnSerial(0);
    setUsedQuestionIds([]);
    setPhase('roll');
    setGameEndsAt(authoritativeEndsAt);
    setTimeLeft(Math.max(0, Math.ceil((authoritativeEndsAt - Date.now()) / 1000)));
    setMessage(base.message);
    setShowPlayerReveal(true);
  };

  const sendSupport = async (support: DigitalCitySupport) => {
    if (!onlineRoomCode) return;
    setRoomBusy(true);
    const result = await supportDigitalCityTurn(onlineRoomCode, multiplayerPlayerId, support);
    setRoomBusy(false);
    if (!result.ok) setRoomError(result.error || 'ส่งความช่วยเหลือไม่สำเร็จ');
    else if (result.room) setOnlineRoom(result.room);
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await modalRoot?.requestFullscreen();
    } catch {
      setMessage('เบราว์เซอร์ไม่อนุญาตให้เปิดเต็มจอ กรุณาลองกดปุ่มอีกครั้ง');
    }
  };

  const exportScores = () => {
    const rows = [
      ['อันดับ', 'ทีม', 'K', 'P', 'A', 'รวม', 'ความแม่นยำ', 'ผ่านเกณฑ์'],
      ...rankedPlayers.map((player, index) => {
        const score = scoreDigitalCityPlayer(player);
        return [
          index + 1,
          player.name,
          score.knowledge,
          score.strategy + score.advanced + score.efficiency,
          score.collaboration,
          score.total,
          `${Math.round(score.accuracy * 100)}%`,
          score.qualified ? 'ผ่าน' : 'ยังไม่ผ่าน',
        ];
      }),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `digital-city-scores-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const restart = () => {
    if (onlineRoomCode) leaveRoom();
    setPhase('setup');
    setPlayers([]);
    setShowPlayerReveal(false);
    setImpactQueue([]);
    setUsedQuestionIds([]);
    setReflection({ strategy: '', evidence: '', transfer: '' });
    setReflectionSaved(false);
  };

  const finishActionRef = useRef(finish);
  const answerActionRef = useRef(answerQuestion);

  useEffect(() => {
    finishActionRef.current = finish;
    answerActionRef.current = answerQuestion;
  });

  useEffect(() => {
    const listener = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', listener);
    return () => document.removeEventListener('fullscreenchange', listener);
  }, []);

  useEffect(() => {
    if (phase !== 'setup') window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [phase]);

  useEffect(() => {
    if (!showPlayerReveal) return undefined;
    const timer = window.setTimeout(() => setShowPlayerReveal(false), 2_250);
    return () => window.clearTimeout(timer);
  }, [showPlayerReveal]);

  useEffect(() => {
    if (!impactFx) return undefined;
    const timer = window.setTimeout(() => {
      setImpactQueue((current) => current.filter((item) => item.id !== impactFx.id));
    }, 1_450);
    return () => window.clearTimeout(timer);
  }, [impactFx]);

  useEffect(() => {
    if (playMode !== 'online' || !onlineRoomCode) return undefined;
    return subscribeTycoonRoom(onlineRoomCode, (room) => {
      setOnlineRoom(room);
      if (room) setMinutes(room.minutes);
      if (room?.game?.endsAt) {
        setGameEndsAt(room.game.endsAt);
        setTimeLeft(Math.max(0, Math.ceil((room.game.endsAt - Date.now()) / 1000)));
      }
      if (room?.game?.variant === 'digital-city' && revealedOnlineGameRef.current === 0) {
        revealedOnlineGameRef.current = room.game.version;
        setShowPlayerReveal(true);
      }
      const member = room?.players.find((item) => item.id === multiplayerPlayerId);
      if (member) {
        setOnlineName(member.name);
        setOnlineCharacter(member.characterId);
      }
    }, setSyncMode);
  }, [multiplayerPlayerId, onlineRoomCode, playMode]);

  useEffect(() => {
    const remote = onlineRoom?.game;
    if (!remote || remote.variant !== 'digital-city' || remote.version <= appliedRemoteVersionRef.current) return undefined;
    const applyRemoteTimer = window.setTimeout(() => {
      if (remote.version <= appliedRemoteVersionRef.current) return;
      const remoteActiveMember = onlineRoom
        ? orderedTycoonRoomPlayers(onlineRoom)[remote.turn]
        : null;
      const supportOnlyUpdate = Boolean(
        remote.phase === 'question'
        && remote.picked === null
        && remote.question
        && remoteActiveMember
        && remote.updatedBy
        && remote.updatedBy !== remoteActiveMember.id,
      );
      applyingRemoteRef.current = true;
      appliedRemoteVersionRef.current = remote.version;
      const ownActiveAcknowledgement = remote.updatedBy === multiplayerPlayerId
        && remoteActiveMember?.id === multiplayerPlayerId
        && phase !== 'setup'
        && players.length > 0;
      if (ownActiveAcknowledgement) {
        setPlayers((current) => mergeDigitalCitySupportPlayers(current, remote.players, remote.turn));
        setSupportMessage(remote.supportMessage || '');
        if (phase === 'question' && picked === null) {
          setQuestionEndsAt((current) => Math.max(current, remote.questionEndsAt));
          setQuestionTime((current) => Math.max(
            current,
            Math.max(0, Math.ceil((remote.questionEndsAt - Date.now()) / 1000)),
          ));
        }
        window.setTimeout(() => { applyingRemoteRef.current = false; }, 90);
        return;
      }
      if (supportOnlyUpdate && remoteActiveMember?.id === multiplayerPlayerId) {
        setPlayers((current) => mergeDigitalCitySupportPlayers(current, remote.players, remote.turn));
        setSupportMessage(remote.supportMessage || '');
        setQuestionEndsAt((current) => Math.max(current, remote.questionEndsAt));
        setQuestionTime((current) => Math.max(
          current,
          Math.max(0, Math.ceil((remote.questionEndsAt - Date.now()) / 1000)),
        ));
        window.setTimeout(() => { applyingRemoteRef.current = false; }, 90);
        return;
      }
      const remoteQuestion = isDigitalCityQuestion(remote.question) ? remote.question : null;
      const remoteEvent = isDigitalCityEvent(remote.chance) ? remote.chance : null;
      const base: Omit<TycoonGameSnapshot, 'version' | 'updatedBy'> = {
        ...remote,
        question: remoteQuestion,
        chance: remoteEvent,
      };
      delete (base as Partial<TycoonGameSnapshot>).version;
      delete (base as Partial<TycoonGameSnapshot>).updatedBy;
      lastSignatureRef.current = gameSignature(base);
      setPlayers(remote.players);
      setTurn(remote.turn);
      setTurnSerial(remote.turnSerial || 0);
      setPhase(remote.phase);
      setDice(remote.dice);
      setIsRolling(remote.isRolling);
      setQuestion(remoteQuestion);
      setPicked(remote.picked);
      setEventCard(remoteEvent);
      setMessage(remote.message);
      setSupportMessage(remote.supportMessage || '');
      setUsedQuestionIds(remote.usedQuestionIds || []);
      setBuyTile(remote.buyTile);
      setUpgradeTile(remote.upgradeTile);
      setFinishReason(remote.finishReason);
      setGameEndsAt(remote.endsAt);
      setQuestionEndsAt(remote.questionEndsAt);
      setTimeLeft(Math.max(0, Math.ceil((remote.endsAt - Date.now()) / 1000)));
      setQuestionTime(remote.questionEndsAt ? Math.max(0, Math.ceil((remote.questionEndsAt - Date.now()) / 1000)) : QUESTION_SECONDS);
      window.setTimeout(() => { applyingRemoteRef.current = false; }, 90);
    }, 0);
    return () => window.clearTimeout(applyRemoteTimer);
  }, [multiplayerPlayerId, onlineRoom, phase, picked, players.length]);

  useEffect(() => {
    if (!isOnlineGame || !onlineRoomCode || !canPublishTurn || phase === 'setup' || players.length === 0) return undefined;
    const base: Omit<TycoonGameSnapshot, 'version' | 'updatedBy'> = {
      variant: 'digital-city',
      turnSerial,
      supportMessage,
      usedQuestionIds,
      phase,
      players,
      turn,
      dice,
      isRolling,
      question,
      picked,
      chance: eventCard,
      message,
      buyTile,
      rentTile: null,
      rentOwner: null,
      pendingRent: 0,
      upgradeTile,
      finishReason,
      endsAt: authoritativeGameEndsAt,
      questionEndsAt,
    };
    const signature = gameSignature(base);
    if (signature === lastSignatureRef.current) return undefined;
    let cancelled = false;
    let retryTimer: number | undefined;
    const publish = async (attempt: number) => {
      const version = Math.max(Date.now(), appliedRemoteVersionRef.current + 1);
      const published = await publishTycoonGame(
        onlineRoomCode,
        multiplayerPlayerId,
        { ...base, version, updatedBy: multiplayerPlayerId },
      );
      if (cancelled) return;
      if (published) {
        lastSignatureRef.current = signature;
        appliedRemoteVersionRef.current = Math.max(appliedRemoteVersionRef.current, version);
        return;
      }
      if (attempt < 2) {
        retryTimer = window.setTimeout(() => { void publish(attempt + 1); }, 220 * (attempt + 1));
      }
    };
    const timer = window.setTimeout(() => {
      void publish(0);
    }, 130);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
    };
  }, [authoritativeGameEndsAt, buyTile, canPublishTurn, dice, eventCard, finishReason, isOnlineGame, isRolling, message, multiplayerPlayerId, onlineRoomCode, phase, picked, players, question, questionEndsAt, supportMessage, turn, turnSerial, upgradeTile, usedQuestionIds]);

  useEffect(() => {
    if (phase === 'setup' || phase === 'over') return undefined;
    const timer = window.setTimeout(() => {
      const remaining = Math.max(0, Math.ceil((authoritativeGameEndsAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0 && (!isOnlineGame || isRoomHost)) {
        finishActionRef.current(players, 'หมดเวลา ภารกิจกู้เมืองเสร็จสิ้น');
      }
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [authoritativeGameEndsAt, isOnlineGame, isRoomHost, phase, players]);

  useEffect(() => {
    if (phase !== 'question' || picked !== null || !question) return undefined;
    const timer = window.setTimeout(() => {
      const remaining = Math.max(0, Math.ceil((questionEndsAt - Date.now()) / 1000));
      setQuestionTime(remaining);
      if (remaining === 0 && canTakeTurn) answerActionRef.current(-1);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [canTakeTurn, phase, picked, question, questionEndsAt]);

  useEffect(() => {
    if (!showTutorial) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowTutorial(false);
      if (event.key === 'ArrowLeft') setTutorialStep((current) => Math.max(0, current - 1));
      if (event.key === 'ArrowRight') setTutorialStep((current) => Math.min(TUTORIAL_STEPS.length - 1, current + 1));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showTutorial]);

  const openTutorial = () => {
    setTutorialStep(0);
    setShowTutorial(true);
  };
  const tutorial = TUTORIAL_STEPS[tutorialStep];
  const tutorialModal = showTutorial && modalRoot ? createPortal((
    <div className="dcq-modal dcq-tutorial-modal" role="dialog" aria-modal="true" aria-label={`คู่มือภาพ ${tutorial.title}`}>
      <section className="dcq-tutorial-card">
        <button type="button" className="dcq-modal-close" onClick={() => setShowTutorial(false)} aria-label="ปิดคู่มือ"><X /></button>
        <header>
          <span><BookOpen size={18} /> คู่มือภาพการเล่น</span>
          <h2>{tutorialStep + 1}. {tutorial.title}</h2>
          <p>{tutorial.summary}</p>
          <div className="dcq-tutorial-progress" aria-label={`ขั้นที่ ${tutorialStep + 1} จาก ${TUTORIAL_STEPS.length}`}>
            {TUTORIAL_STEPS.map((step, index) => <button key={step.id} type="button" className={index === tutorialStep ? 'active' : index < tutorialStep ? 'done' : ''} onClick={() => setTutorialStep(index)} aria-label={`ขั้น ${index + 1} ${step.label}`}><span>{index < tutorialStep ? <Check size={13} /> : index + 1}</span><b>{step.label}</b></button>)}
          </div>
        </header>
        <div className="dcq-tutorial-body">
          <figure>
            <TutorialVisual step={tutorial.id} />
            <figcaption>ภาพจำลองจากหน้าจอเกมจริง</figcaption>
          </figure>
          <article>
            <span>ทำตามทีละขั้น</span>
            <ol>{tutorial.actions.map((action) => <li key={action}>{action}</li>)}</ol>
            <div className="dcq-tutorial-example"><Lightbulb size={20} /><p>{tutorial.example}</p></div>
            <small>เคล็ดลับ: อ่านข้อมูลให้ครบก่อนกดทุกครั้ง คะแนน K/P/A จะเพิ่มจากวิธีคิดและการร่วมมือ ไม่ได้วัดแค่ความเร็ว</small>
          </article>
        </div>
        <footer>
          <button type="button" onClick={() => setTutorialStep((current) => Math.max(0, current - 1))} disabled={tutorialStep === 0}><ChevronLeft size={18} /> ก่อนหน้า</button>
          <span>ขั้น {tutorialStep + 1} / {TUTORIAL_STEPS.length}</span>
          {tutorialStep < TUTORIAL_STEPS.length - 1
            ? <button type="button" className="next" onClick={() => setTutorialStep((current) => current + 1)}>ขั้นถัดไป <ChevronRight size={18} /></button>
            : <button type="button" className="next" onClick={() => setShowTutorial(false)}><Check size={18} /> พร้อมเล่น</button>}
        </footer>
      </section>
    </div>
  ), modalRoot) : null;

  if (phase === 'setup') {
    return (
      <main ref={setModalRoot} className="game-page dcq-page dcq-setup-page">
        <header className="dcq-topbar">
          <Link to="/games"><ChevronLeft size={19} /> เกมทั้งหมด</Link>
          <div><span>DIGITAL CITY LEAGUE</span><strong>ภารกิจกู้มหานครอัจฉริยะ</strong></div>
          <span className="dcq-new-badge">เกมแข่งขันใหม่</span>
        </header>
        <GameLearnCard gameKey="digital-city-quest" />
        <div className="dcq-tutorial-launchbar">
          <button type="button" onClick={openTutorial}><BookOpen size={19} /> คู่มือภาพ 7 ขั้น</button>
          <span>ดูตัวอย่างการเลือกทีม ทอย ตอบคำถาม รับ–จ่ายเครดิต สร้างโครงการ และเก็บคะแนน</span>
        </div>
        <section className="dcq-setup-panel">
          <div className="dcq-setup-hero">
            <div>
              <span className="dcq-kicker"><Sparkles size={16} /> PISA MISSION BOARD</span>
              <h1>ร่วมทีมคิด วิเคราะห์ และกู้ระบบเมือง</h1>
              <p>อ่านหลักฐานจากคลัง {DIGITAL_CITY_QUESTIONS.length} ข้อที่ไม่ซ้ำกันทั้งห้อง ตัดสินใจเป็นลำดับ และสะสมคะแนนสมรรถนะ 100 คะแนน</p>
            </div>
            <div className="dcq-score-orbit" aria-label="คะแนนเต็ม 100">
              <strong>100</strong><span>คะแนนสมรรถนะ</span>
            </div>
          </div>
          <div className="dcq-score-rule">
            <span>K หลักฐาน 40</span><span>P กลยุทธ์ 25</span><span>P คิดขั้นสูง 20</span><span>A ร่วมมือ 10</span><span>ประสิทธิภาพ 5</span>
          </div>
          <div className="dcq-mode-tabs">
            <button type="button" className={playMode === 'shared' ? 'active' : ''} onClick={() => { if (onlineRoomCode) leaveRoom(); setPlayMode('shared'); }}>
              <Monitor size={22} /><b>จอเดียว</b><small>ผลัดกันเล่น 2-4 ทีม</small>
            </button>
            <button type="button" className={playMode === 'online' ? 'active' : ''} onClick={() => setPlayMode('online')}>
              <Wifi size={22} /><b>หลายจอ</b><small>เปิดห้องเล่นพร้อมเพื่อน</small>
            </button>
          </div>
          {playMode === 'shared' ? (
            <div className="dcq-shared-setup">
              <div className="dcq-inline-controls">
                <label>จำนวนทีม <span>{[2, 3, 4].map((value) => <button key={value} type="button" className={count === value ? 'active' : ''} onClick={() => setCount(value)}>{value}</button>)}</span></label>
                <label>เวลา <span>{([5, 10, 15] as const).map((value) => <button key={value} type="button" className={minutes === value ? 'active' : ''} onClick={() => setMinutes(value)}>{value} นาที</button>)}</span></label>
              </div>
              <div className="dcq-team-editor">
                {Array.from({ length: count }, (_, index) => (
                  <label key={index} className={editingTeam === index ? 'active' : ''} onClick={() => setEditingTeam(index)}>
                    <Avatar characterId={teamCharacters[index]} />
                    <input value={teamNames[index]} onChange={(event) => setTeamNames((current) => current.map((name, i) => i === index ? event.target.value : name))} aria-label={`ชื่อทีม ${index + 1}`} />
                  </label>
                ))}
              </div>
              <CharacterPicker selected={teamCharacters[editingTeam]} taken={teamCharacters.slice(0, count).filter((_, index) => index !== editingTeam)} onSelect={(characterId) => setTeamCharacters((current) => current.map((id, index) => index === editingTeam ? characterId : id))} />
              <button type="button" className="dcq-primary" onClick={startShared}><Gamepad2 size={20} /> เริ่มภารกิจจอเดียว</button>
            </div>
          ) : (
            <div className="dcq-online-setup">
              {!onlineRoom ? (
                <>
                  <div className="dcq-online-fields">
                    <label>ชื่อผู้เล่น<input value={onlineName} onChange={(event) => setOnlineName(event.target.value)} /></label>
                    <label><KeyRound size={15} /> รหัสผ่านห้อง<input type="password" value={roomPassword} onChange={(event) => setRoomPassword(event.target.value)} /></label>
                  </div>
                  <CharacterPicker selected={onlineCharacter} onSelect={setOnlineCharacter} disabled={roomBusy} />
                  <div className="dcq-room-actions">
                    <section><h3>สร้างห้องใหม่</h3><input value={roomName} onChange={(event) => setRoomName(event.target.value)} />
                      <div>{([5, 10, 15] as const).map((value) => <button key={value} type="button" className={minutes === value ? 'active' : ''} onClick={() => setMinutes(value)}>{value} นาที</button>)}</div>
                      <button type="button" onClick={createRoom} disabled={roomBusy}><Gamepad2 size={18} /> สร้างห้อง</button>
                    </section>
                    <section><h3>เข้าห้องเพื่อน</h3><input inputMode="numeric" maxLength={6} placeholder="รหัส 6 หลัก" value={joinCode} onChange={(event) => setJoinCode(event.target.value.replace(/\D/g, '').slice(0, 6))} />
                      <button type="button" onClick={joinRoom} disabled={roomBusy || joinCode.length !== 6}><LogIn size={18} /> เข้าร่วม</button>
                    </section>
                  </div>
                </>
              ) : (
                <div className="dcq-lobby">
                  <header><div><span className={`sync-${syncMode}`}><Wifi size={15} /> {syncMode === 'firebase' ? 'เชื่อมต่อหลายจอแล้ว' : 'กำลังเชื่อมต่อ'}</span><h2>{onlineRoom.name}</h2><button type="button" onClick={() => navigator.clipboard?.writeText(onlineRoom.code)}>ห้อง {onlineRoom.code} <Copy size={15} /></button><strong className="dcq-room-duration"><Clock3 size={15} /> เวลาแข่งขัน {onlineRoom.minutes} นาที กำหนดโดยเจ้าของห้อง</strong></div><button type="button" onClick={leaveRoom} aria-label="ออกจากห้อง"><X /></button></header>
                  <div className="dcq-member-grid">{onlineMembers.map((member) => <article key={member.id} className={member.ready ? 'ready' : ''}><Avatar characterId={member.characterId} size="large" active={member.ready} /><b>{member.name}</b><span>{member.id === onlineRoom.hostId ? 'เจ้าของห้อง' : 'สมาชิก'}</span><strong>{member.ready ? 'พร้อม' : 'กำลังเตรียม'}</strong></article>)}</div>
                  {onlineMember && <><CharacterPicker selected={onlineMember.characterId} taken={onlineMembers.filter((member) => member.id !== multiplayerPlayerId).map((member) => member.characterId)} onSelect={changeOnlineCharacter} disabled={roomBusy || onlineMember.ready} /><div className="dcq-ready-row"><button type="button" className={onlineMember.ready ? 'ready' : ''} onClick={toggleReady}><Check size={18} /> {onlineMember.ready ? 'พร้อมแล้ว' : 'กดเตรียมพร้อม'}</button>{isRoomHost ? <button type="button" onClick={startOnline} disabled={!canStartTycoonRoom(onlineRoom)}><Gamepad2 size={18} /> เริ่มแข่งขัน</button> : <span>รอเจ้าของห้องเริ่ม</span>}</div></>}
                </div>
              )}
              {roomError && <div className="dcq-error">{roomError}</div>}
            </div>
          )}
        </section>
        {tutorialModal}
      </main>
    );
  }

  if (phase === 'over') {
    const winner = rankedPlayers[0];
    const winnerScore = scoreDigitalCityPlayer(winner);
    return (
      <main ref={setModalRoot} className="game-page dcq-page dcq-over-page">
        <section className="dcq-results">
          <div className="dcq-result-hero">
            <div className="dcq-victory-rays" aria-hidden="true" />
            <div className="dcq-victory-pixels" aria-hidden="true">
              {FX_PARTICLES.map((particle) => <i key={particle} style={{ '--fx-i': particle } as React.CSSProperties} />)}
            </div>
            <div className="dcq-crown"><Avatar characterId={winner.characterId} size="large" active /><Crown /></div>
            <span>SMART CITY CHAMPION</span><h1>{winner.name} ชนะ!</h1>
            <p>{finishReason}</p><strong>{winnerScore.total}/100 คะแนน</strong>
            <em>{winnerScore.qualified ? 'ผ่านเกณฑ์แชมป์ครบทั้งความแม่นยำ 60% สมรรถนะ 3 ด้าน และภารกิจขั้นสูง' : 'ได้อันดับสูงสุด แต่ยังควรสะสมสมรรถนะให้ครบเกณฑ์แชมป์'}</em>
          </div>
          <div className="dcq-result-table">
            {rankedPlayers.map((player, index) => {
              const score = scoreDigitalCityPlayer(player);
              return <article key={player.idx} className={index === 0 ? 'winner' : ''}><b>#{index + 1}</b><Avatar characterId={player.characterId} /><div><strong>{player.name}</strong><small>ถูก {player.correct}/{player.answered} • เชี่ยวชาญ {score.masteredDomains}/5 ด้าน</small></div><span>K {score.knowledge}</span><span>P {score.strategy + score.advanced + score.efficiency}</span><span>A {score.collaboration}</span><em>{score.total}</em></article>;
            })}
          </div>
          <div className="dcq-reflection">
            <header><BookOpen size={22} /><div><strong>สะท้อนคิดหลังภารกิจ</strong><small>หลักฐานสำคัญสำหรับการเรียนรู้ ไม่คิดคะแนนแพ้ชนะ</small></div></header>
            <label>กลยุทธ์ใดช่วยทีมมากที่สุด?<textarea value={reflection.strategy} onChange={(event) => setReflection((current) => ({ ...current, strategy: event.target.value }))} /></label>
            <label>หลักฐานใดทำให้ทีมเปลี่ยนการตัดสินใจ?<textarea value={reflection.evidence} onChange={(event) => setReflection((current) => ({ ...current, evidence: event.target.value }))} /></label>
            <label>จะนำวิธีคิดนี้ไปใช้กับเรื่องใด?<textarea value={reflection.transfer} onChange={(event) => setReflection((current) => ({ ...current, transfer: event.target.value }))} /></label>
            <button type="button" onClick={() => setReflectionSaved(true)} disabled={!reflection.strategy.trim() || !reflection.evidence.trim() || !reflection.transfer.trim()}>{reflectionSaved ? <><Check size={18} /> บันทึกแล้ว</> : 'บันทึกการสะท้อนคิด'}</button>
          </div>
          <div className="dcq-result-actions"><button type="button" onClick={exportScores}><Download size={18} /> Export K/P/A</button><button type="button" onClick={restart}><RotateCcw size={18} /> เล่นใหม่</button><Link to="/games"><ChevronLeft size={18} /> กลับหน้าเกม</Link></div>
        </section>
      </main>
    );
  }

  return (
    <main ref={setModalRoot} className="game-page dcq-page dcq-playing-page">
      <header className="dcq-game-header">
        <Link to="/games"><ChevronLeft size={18} /> เกม</Link>
        <div><span>PIXEL TECH</span><strong>DIGITAL CITY QUEST</strong><small>ภารกิจกู้มหานครอัจฉริยะ</small></div>
        <div className="dcq-header-score"><Coins size={20} /><b>{formatNumber(activePlayer?.money || 0)}</b><span>เครดิต</span></div>
      </header>
      {showPlayerReveal && <div className="dcq-player-reveal" aria-hidden="true">
        <div className="dcq-player-reveal-flare" />
        <div className="dcq-player-reveal-title"><span>ภารกิจเริ่มแล้ว</span><strong>ทีมกู้มหานคร</strong></div>
        <div className="dcq-player-reveal-cast">
          {players.map((player) => (
            <div key={player.idx} className="dcq-player-reveal-card" style={{ '--player-i': player.idx, '--player-color': TYCOON_TOKENS[player.idx].color } as React.CSSProperties}>
              <Avatar characterId={player.characterId} size="large" walking active={player.idx === turn} />
              <b>{player.name}</b>
            </div>
          ))}
        </div>
        <div className="dcq-launch-countdown"><span>3</span><span>2</span><span>1</span><strong>GO!</strong></div>
        <div className="dcq-player-reveal-confetti">
          {FX_PARTICLES.map((particle) => <i key={particle} style={{ '--fx-i': particle } as React.CSSProperties} />)}
        </div>
      </div>}
      {impactFx && <div key={impactFx.id} className={`dcq-impact-fx is-${impactFx.kind}`} role="status" aria-live="polite">
        <div className="dcq-impact-wave" aria-hidden="true" />
        <span className="dcq-impact-icon">{impactFx.icon}</span>
        <div><small>MISSION EFFECT</small><strong>{impactFx.title}</strong><p>{impactFx.detail}</p></div>
        {impactFx.amount !== undefined && <b className={impactFx.amount >= 0 ? 'positive' : 'negative'}>{impactFx.amount >= 0 ? '+' : ''}{formatNumber(impactFx.amount)} เครดิต</b>}
        <span className="dcq-impact-particles" aria-hidden="true">{FX_PARTICLES.map((particle) => <i key={particle} style={{ '--fx-i': particle } as React.CSSProperties} />)}</span>
      </div>}
      <nav className="dcq-game-tools">
        <span><Clock3 size={17} /><b>{formatClock(timeLeft)}</b></span>
        <span><Avatar characterId={activePlayer.characterId} size="token" /><b>{activePlayer.name}</b></span>
        <span><Dices size={18} /><b>{dice || '-'}</b></span>
        <button type="button" onClick={() => setShowDashboard(true)}><BarChart3 size={18} /> คะแนน K/P/A</button>
        <button type="button" onClick={openTutorial}><BookOpen size={18} /> วิธีเล่น</button>
        {isOnlineGame && onlineRoom && <span><Wifi size={17} /> ห้อง {onlineRoom.code}</span>}
        <button type="button" onClick={toggleFullscreen} aria-label={isFullscreen ? 'ออกจากเต็มจอ' : 'เต็มจอ'}>{isFullscreen ? <Minimize2 /> : <Maximize2 />}</button>
      </nav>
      {supportMessage && <div className="dcq-support-toast"><HeartHandshake size={18} /> {supportMessage}</div>}
      <section className={`dcq-board-shell${isRolling ? ' rolling' : ''}`}>
        {isRolling && (
          <div key={`${turn}-${dice}-${activePlayer.pos}`} className="dcq-roll-fx" aria-hidden="true">
            <span className="dcq-roll-ring ring-a" />
            <span className="dcq-roll-ring ring-b" />
            <span className="dcq-roll-burst">
              {FX_PARTICLES.map((particle) => <i key={particle} style={{ '--fx-i': particle } as React.CSSProperties} />)}
            </span>
            <span className="dcq-flying-dice dice-a">⚄</span>
            <span className="dcq-flying-dice dice-b">⚂</span>
            <span className="dcq-flying-dice dice-c">⚅</span>
            <span className="dcq-roll-result"><small>ผลทอย</small><b>{dice ? DICE_FACES[dice - 1] : '⚄'}</b><strong>{dice}</strong></span>
          </div>
        )}
        <div className="dcq-board">
          {DIGITAL_CITY_BOARD.map((tile, index) => {
            const [row, column] = tileGridPos(index);
            const owner = players.find((player) => player.owned.includes(index));
            const occupants = players.filter((player) => player.pos === index);
            return <article key={index} className={`dcq-tile kind-${tile.kind}${owner ? ' owned' : ''}${occupants.length ? ' occupied' : ''}${occupants.some((player) => player.idx === turn) ? ' current' : ''}`} style={{ gridRow: row, gridColumn: column, '--project': tile.property?.groupColor || '#38bdf8', '--owner': owner ? TYCOON_TOKENS[owner.idx].color : '#fff', '--tile-i': index } as React.CSSProperties}>
              <span className="dcq-tile-icon">{tile.property ? tile.property.emoji : <SpecialIcon kind={tile.kind} />}</span>
              <b>{tile.property?.name || (tile.kind === 'start' ? 'ศูนย์บัญชาการ' : tile.kind === 'chance' ? 'เหตุการณ์เมือง' : tile.kind === 'question' ? 'ภารกิจหลักฐาน' : tile.kind === 'rest' ? 'เวิร์กช็อปชุมชน' : tile.kind === 'gotoRest' ? 'ตรวจช่องโหว่' : 'ศูนย์วิจัย')}</b>
              {tile.property && <small>{formatNumber(tile.property.price)}</small>}
              {owner && <i className="dcq-owner-mark">{(owner.levels[index] || 0) + 1}</i>}
              {occupants.length > 0 && <div className="dcq-tokens">{isRolling && occupants.some((player) => player.idx === turn) && <span className="dcq-step-fx" aria-hidden="true">{FX_PARTICLES.slice(0, 8).map((particle) => <i key={particle} style={{ '--fx-i': particle } as React.CSSProperties} />)}</span>}{occupants.map((player) => <Avatar key={player.idx} characterId={player.characterId} size="token" walking={isRolling && player.idx === turn} active={player.idx === turn} />)}</div>}
            </article>;
          })}
          <div className="dcq-board-center">
            <span>SMART CITY CORE</span>
            <img src="/media/games/tycoon-theme/pixel-tech-campus.webp" alt="มหานครเทคโนโลยีพิกเซล" />
            <aside className="dcq-map-fx" aria-hidden="true">
              <i className="beacon beacon-a" /><i className="beacon beacon-b" /><i className="beacon beacon-c" />
              <i className="data-bit bit-a" /><i className="data-bit bit-b" /><i className="data-bit bit-c" /><i className="data-bit bit-d" />
              <b className="status-a">GRID ONLINE</b><b className="status-b">ENERGY 100%</b>
            </aside>
            <div><b>ตา {activePlayer.name}</b><small>{message}</small></div>
            {phase === 'roll' && <button type="button" onClick={roll} disabled={isRolling || !canTakeTurn}><Dices size={28} /><span>{isRolling ? 'กำลังเดิน' : canTakeTurn ? 'ทอยลูกเต๋า' : 'รอผู้เล่น'}</span></button>}
          </div>
        </div>
        <aside className="dcq-player-rail">
          {players.map((player) => {
            const score = scoreDigitalCityPlayer(player);
            return <article key={player.idx} className={player.idx === turn ? 'active' : ''} style={{ '--team': TYCOON_TOKENS[player.idx].color, '--player-i': player.idx } as React.CSSProperties}><Avatar characterId={player.characterId} size="small" active={player.idx === turn} /><div><b>{player.name}</b><span>{player.idx === turn ? 'กำลังปฏิบัติภารกิจ' : 'รอสนับสนุนทีม'}</span><small>งบ {formatNumber(player.money)} • โครงการ {player.owned.length} • ครบ {completedGroups(player)} กลุ่ม</small></div><strong>{score.total}</strong></article>;
          })}
        </aside>
      </section>

      {showDashboard && modalRoot && createPortal(<div className="dcq-modal" role="dialog" aria-modal="true" aria-label="คะแนนสมรรถนะ"><section className="dcq-dashboard"><button type="button" className="dcq-modal-close" onClick={() => setShowDashboard(false)} aria-label="ปิดหน้าคะแนน"><X /></button><header><BarChart3 size={28} /><div><span>REAL-TIME ASSESSMENT</span><h2>คะแนนสมรรถนะ K/P/A</h2></div><button type="button" onClick={exportScores}><Download size={17} /> CSV</button></header><div className="dcq-dashboard-grid">{rankedPlayers.map((player, index) => { const score = scoreDigitalCityPlayer(player); return <article key={player.idx}><div className="dcq-dash-player"><b>#{index + 1}</b><Avatar characterId={player.characterId} /><div><strong>{player.name}</strong><small>แม่นยำ {Math.round(score.accuracy * 100)}%</small></div><em>{score.total}</em></div><div className="dcq-score-bars"><span style={{ '--value': `${score.knowledge / 40 * 100}%` } as React.CSSProperties}>K หลักฐาน <b>{score.knowledge}/40</b></span><span style={{ '--value': `${(score.strategy + score.advanced + score.efficiency) / 50 * 100}%` } as React.CSSProperties}>P ปฏิบัติคิด <b>{score.strategy + score.advanced + score.efficiency}/50</b></span><span style={{ '--value': `${score.collaboration / 10 * 100}%` } as React.CSSProperties}>A ร่วมมือ <b>{score.collaboration}/10</b></span></div><div className="dcq-domain-badges">{DOMAIN_KEYS.map((domain) => <span key={domain} className={(player.mastery?.[domain] || 0) > 0 ? 'mastered' : ''}>{LITERACY_DOMAINS[domain].emoji} {LITERACY_DOMAINS[domain].short}</span>)}</div><small className={score.qualified ? 'qualified' : ''}>{score.qualified ? 'ผ่านเกณฑ์แชมป์แล้ว' : 'ต้องแม่นยำ 60% • ครบ 3 ด้าน • ภารกิจขั้นสูง 1 ภารกิจ'}</small></article>; })}</div></section></div>, modalRoot)}

      {isOnlineGame && !canTakeTurn && (phase === 'roll' || phase === 'question') && activePlayer && modalRoot && createPortal(<div className="dcq-modal dcq-wait-modal" role="status"><section className="dcq-wait-card"><div className="dcq-wait-spinner"><Clock3 /></div><span>กำลังรอผู้เล่น</span><Avatar characterId={activePlayer.characterId} size="large" active /><h2>{activePlayer.name} กำลังเล่น</h2><p>{phase === 'question' ? 'กำลังวิเคราะห์ภารกิจจากหลักฐาน' : isRolling ? 'กำลังเดินตามผลการทอย' : 'กำลังเตรียมทอยลูกเต๋า'}</p><div className="dcq-wait-facts"><b><Dices /> ผลทอย {dice || '-'}</b><b><Clock3 /> {phase === 'question' ? `${questionTime} วินาที` : formatClock(timeLeft)}</b></div><div className="dcq-support-actions"><span>{canSendSupport ? 'ช่วยเพื่อนได้ 1 ครั้งในตานี้' : 'ปุ่มช่วยเหลือจะเปิดเมื่อเพื่อนเริ่มตอบภารกิจ'}</span><button type="button" onClick={() => sendSupport('time')} disabled={roomBusy || !canSendSupport}>+5 วินาที</button><button type="button" onClick={() => sendSupport('shield')} disabled={roomBusy || !canSendSupport}>ส่งเกราะงบ</button><button type="button" onClick={() => sendSupport('encourage')} disabled={roomBusy || !canSendSupport}>กำลังใจ +กลยุทธ์</button></div>{roomError && <small className="dcq-error">{roomError}</small>}</section></div>, modalRoot)}

      {phase === 'question' && question && canTakeTurn && modalRoot && createPortal(<div className="dcq-modal" role="dialog" aria-modal="true" aria-label="ภารกิจวิเคราะห์"><section className="dcq-question-card" style={{ '--domain': LITERACY_DOMAINS[question.domain].color } as React.CSSProperties}><header><span>{LITERACY_DOMAINS[question.domain].emoji} {LITERACY_DOMAINS[question.domain].name}</span><b>ภารกิจ {question.stage}/3</b><strong><Clock3 size={16} /> {picked === null ? `${questionTime} วิ` : 'ตอบแล้ว'}</strong></header><div className="dcq-question-body"><aside><small>สถานการณ์</small><h2>{question.missionTitle}</h2><p>{question.stimulus}</p>{question.table && <div className="dcq-evidence-table"><table><thead><tr>{question.table.headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{question.table.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>}<em>ทักษะ: {question.competency}</em></aside><main><span>คำถามเชื่อมโยงขั้นที่ {question.stage}</span><h3>{question.q}</h3><div>{question.choices.map((choice, index) => <button key={choice} type="button" className={picked === null ? '' : index === question.answer ? 'correct' : picked === index ? 'wrong' : 'dim'} onClick={() => answerQuestion(index)} disabled={picked !== null}><b>{String.fromCharCode(65 + index)}</b>{choice}</button>)}</div>{picked !== null && <p className="dcq-feedback">{message}</p>}{picked !== null && <footer>{buyTile !== null && picked === question.answer ? <><button type="button" onClick={() => buyProject(true)}>เปิดโครงการ {DIGITAL_CITY_BOARD[buyTile].property?.name}</button><button type="button" onClick={() => buyProject(false)}>ข้าม</button></> : <button type="button" onClick={() => nextTurn(players)}>ตาถัดไป</button>}</footer>}</main></div></section></div>, modalRoot)}

      {phase === 'chance' && eventCard && modalRoot && createPortal(<div className="dcq-modal" role="dialog" aria-modal="true" aria-label="เหตุการณ์ตัดสินใจ"><section className="dcq-event-card"><span>DECISION EVENT</span><div>{eventCard.emoji}</div><h2>{eventCard.text}</h2><p>{eventCard.prompt}</p>{canTakeTurn && picked === null ? <div className="dcq-event-choices">{eventCard.choices.map((choice, index) => <button key={choice.label} type="button" onClick={() => chooseEvent(index)}>{choice.label}<small>เลือกแล้วเห็นผลทันที</small></button>)}</div> : picked === null ? <div className="dcq-event-wait"><Clock3 /> {activePlayer.name} กำลังตัดสินใจ</div> : null}{picked !== null && <><div className="dcq-event-result"><Check /> {message}</div>{canTakeTurn ? <button type="button" className="dcq-primary" onClick={() => nextTurn(players)}>ตาถัดไป</button> : <div className="dcq-event-wait"><Clock3 /> รอผู้เล่นไปตาถัดไป</div>}</>}</section></div>, modalRoot)}

      {phase === 'info' && modalRoot && createPortal(<div className="dcq-modal" role="dialog" aria-modal="true" aria-label="ผลภารกิจ"><section className="dcq-info-card"><span>MISSION UPDATE</span><Avatar characterId={activePlayer.characterId} size="large" active /><h2>{activePlayer.name}</h2><p>{message}</p>{canTakeTurn ? <div>{upgradeTile !== null && activePlayer.owned.includes(upgradeTile) && (activePlayer.levels[upgradeTile] || 0) < 3 && <button type="button" onClick={upgradeProject}>พัฒนาต้นแบบขั้น {(activePlayer.levels[upgradeTile] || 0) + 1}</button>}<button type="button" className="dcq-primary" onClick={() => nextTurn(players)}>ตาถัดไป</button></div> : <div className="dcq-event-wait"><Clock3 /> รอ {activePlayer.name}</div>}</section></div>, modalRoot)}
      {isOnlineGame && modalRoot && createPortal(<button type="button" className="dcq-emergency-exit" onClick={cancelOrLeaveOnlineGame} disabled={roomBusy}><X size={17} /> {isRoomHost ? 'ยกเลิกเกม' : 'ออกจากห้อง'}</button>, modalRoot)}
      {tutorialModal}
    </main>
  );
};

export default DigitalCityQuestGame;
