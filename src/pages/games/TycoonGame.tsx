import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bed,
  Building2,
  Check,
  ChevronLeft,
  CircleHelp,
  Clock3,
  Coins,
  Copy,
  Crown,
  Dices,
  DoorOpen,
  Flag,
  Gamepad2,
  GraduationCap,
  Heart,
  KeyRound,
  Laptop,
  LogIn,
  Monitor,
  RotateCcw,
  ShieldCheck,
  Shuffle,
  Users,
  Volume2,
  VolumeX,
  Wifi,
  X,
} from 'lucide-react';
import { useGameProgress } from '../../hooks/useGameProgress';
import { useAuth } from '../../context/AuthContext';
import GameLearnCard from '../../components/GameLearnCard';
import { ageTierFromClassroom } from '../../data/gameLessons';
import { QUESTION_BANK, CT_PILLARS, PILLAR_ORDER } from '../../data/ctBoardGame';
import type { CTQuestion } from '../../data/ctBoardGame';
import {
  TYCOON_BOARD, CHANCE_CARDS, TYCOON_TOKENS, TYCOON_CHARACTERS,
  getTycoonCharacter, tileGridPos,
  START_MONEY, SALARY, REST_FINE, countCompletedPropertyGroups, ABILITY_VALUES,
  propertyRent, propertyUpgradeCost, propertyUpgradeInvestment,
} from '../../data/tycoonGame';
import type { ChanceCard, TileKind } from '../../data/tycoonGame';
import {
  canStartTycoonRoom,
  createTycoonRoom,
  joinTycoonRoom,
  leaveTycoonRoom,
  orderedTycoonRoomPlayers,
  publishTycoonGame,
  startTycoonMultiplayerRoom,
  subscribeTycoonRoom,
  updateTycoonRoomPlayer,
} from '../../services/tycoonMultiplayerService';
import type {
  TycoonGamePhase,
  TycoonGameSnapshot,
  TycoonPlayerState,
  TycoonRoom,
  TycoonRoomSyncMode,
} from '../../services/tycoonMultiplayerService';
import './GameStyles.css';

type Phase = 'setup' | TycoonGamePhase;
type P = TycoonPlayerState;
type PlayMode = 'shared' | 'online';

const SIZE = TYCOON_BOARD.length;
const REST_TILE = TYCOON_BOARD.findIndex((t) => t.kind === 'rest');
const baht = (n: number) => n.toLocaleString('th-TH');
const clock = (seconds: number) => (
  `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
);

// สุ่มนอกคอมโพเนนต์ (กฎ React purity)
/** เวลาตอบคำถามต่อข้อ — ให้เด็กได้คิดจริง ไม่ต้องรีบเดา */
const QUESTION_SECONDS = 20;

/** พลังของตัวละครที่ผู้เล่นคนนี้เลือก */
const abilityOf = (characterId: string) => getTycoonCharacter(characterId).ability;

const rollDice = () => 1 + Math.floor(Math.random() * 6);
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const ACTIVE_ROOM_KEY = 'kj_tycoon_active_room';
const PLAYER_ID_KEY = 'kj_tycoon_player_id';
const TYCOON_FX_PARTICLES = Array.from({ length: 12 }, (_, index) => index);

const getSessionValue = (key: string) => {
  try { return sessionStorage.getItem(key) || ''; } catch { return ''; }
};

const setSessionValue = (key: string, value: string) => {
  try {
    if (value) sessionStorage.setItem(key, value);
    else sessionStorage.removeItem(key);
  } catch {
    // Session recovery is optional.
  }
};

const getMultiplayerPlayerId = () => {
  const saved = getSessionValue(PLAYER_ID_KEY);
  if (saved) return saved;
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `player_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  setSessionValue(PLAYER_ID_KEY, id);
  return id;
};

const gameSignature = (game: Omit<TycoonGameSnapshot, 'version' | 'updatedBy'>) => (
  JSON.stringify(game)
);

const createPlayerState = (
  idx: number,
  name: string,
  characterId: string,
): P => ({
  idx,
  name,
  characterId,
  pos: 0,
  money: START_MONEY,
  owned: [],
  levels: {},
  skip: 0,
  out: false,
  correct: 0,
  answered: 0,
});

const TycoonAvatar: React.FC<{
  characterId: string;
  size?: 'token' | 'small' | 'medium' | 'large';
  active?: boolean;
  walking?: boolean;
  className?: string;
}> = ({
  characterId,
  size = 'medium',
  active = false,
  walking = false,
  className = '',
}) => {
  const character = getTycoonCharacter(characterId);
  const imageBase = character.image.replace(/\.webp$/, '');
  const frames = [character.image, `${imageBase}-2.webp`, `${imageBase}-3.webp`];
  return (
    <span
      className={`tyc-avatar size-${size}${active ? ' active' : ''}${walking ? ' walking' : ''} ${className}`}
      style={{ '--avatar-accent': character.accent } as React.CSSProperties}
      title={`${character.name} - ${character.role}`}
    >
      {frames.map((frame, index) => (
        <img
          key={frame}
          src={frame}
          alt={index === 0 ? character.name : ''}
          aria-hidden={index > 0}
          draggable={false}
        />
      ))}
    </span>
  );
};

const CharacterPicker: React.FC<{
  selectedId: string;
  onSelect: (characterId: string) => void;
  takenIds?: string[];
  disabled?: boolean;
}> = ({ selectedId, onSelect, takenIds = [], disabled = false }) => (
  <div className="tyc-character-picker" aria-label="เลือกตัวละคร">
    {TYCOON_CHARACTERS.map((character) => {
      const taken = takenIds.includes(character.id) && character.id !== selectedId;
      return (
        <button
          key={character.id}
          type="button"
          className={selectedId === character.id ? 'selected' : ''}
          onClick={() => onSelect(character.id)}
          disabled={disabled || taken}
          aria-pressed={selectedId === character.id}
          title={taken ? 'มีเพื่อนเลือกแล้ว' : `${character.name}: ${character.role}`}
        >
          <TycoonAvatar characterId={character.id} size="large" />
          <span>{character.name}</span>
          <small>{taken ? 'ถูกเลือกแล้ว' : character.role}</small>
          {selectedId === character.id && <Check size={15} />}
        </button>
      );
    })}
  </div>
);

const SpecialTileIcon: React.FC<{ kind: TileKind }> = ({ kind }) => {
  if (kind === 'start') return <Flag size={22} />;
  if (kind === 'chance') return <Shuffle size={22} />;
  if (kind === 'question') return <CircleHelp size={22} />;
  if (kind === 'rest') return <Bed size={22} />;
  if (kind === 'gotoRest') return <Laptop size={22} />;
  return <GraduationCap size={22} />;
};

const TycoonGame: React.FC = () => {
  const { user } = useAuth();
  const bank = QUESTION_BANK[ageTierFromClassroom(user?.classroom)];
  const recordGame = useGameProgress('tycoon', 'เกมเศรษฐีวิทยาการคำนวณ');

  const [count, setCount] = useState(3);
  const [minutes, setMinutes] = useState<5 | 10 | 15>(10);
  const [teamNames, setTeamNames] = useState(() => TYCOON_TOKENS.map((token) => token.name));
  const [teamCharacters, setTeamCharacters] = useState(() => (
    TYCOON_CHARACTERS.slice(0, TYCOON_TOKENS.length).map((character) => character.id)
  ));
  const [editingTeam, setEditingTeam] = useState(0);
  const [playMode, setPlayMode] = useState<PlayMode>(() => (
    getSessionValue(ACTIVE_ROOM_KEY) ? 'online' : 'shared'
  ));
  const [onlineRoomCode, setOnlineRoomCode] = useState(() => getSessionValue(ACTIVE_ROOM_KEY));
  const [onlineRoom, setOnlineRoom] = useState<TycoonRoom | null>(null);
  const [roomSyncMode, setRoomSyncMode] = useState<TycoonRoomSyncMode>('connecting');
  const [roomName, setRoomName] = useState('ห้องเศรษฐีวิทยาการคำนวณ');
  const [roomPassword, setRoomPassword] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [onlinePlayerName, setOnlinePlayerName] = useState(() => user?.name || 'ผู้เล่นใหม่');
  const [onlineCharacterId, setOnlineCharacterId] = useState(TYCOON_CHARACTERS[0].id);
  const [roomBusy, setRoomBusy] = useState(false);
  const [roomError, setRoomError] = useState('');
  const [ps, setPs] = useState<P[]>([]);
  const [turn, setTurn] = useState(0);
  const [phase, setPhase] = useState<Phase>('setup');
  const [dice, setDice] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [q, setQ] = useState<CTQuestion | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [questionTime, setQuestionTime] = useState(QUESTION_SECONDS);
  const [chance, setChance] = useState<ChanceCard | null>(null);
  const [msg, setMsg] = useState('');
  const [buyTile, setBuyTile] = useState<number | null>(null);
  const [rentTile, setRentTile] = useState<number | null>(null);
  const [rentOwner, setRentOwner] = useState<number | null>(null);
  const [pendingRent, setPendingRent] = useState(0);
  const [upgradeTile, setUpgradeTile] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(10 * 60);
  const [finishReason, setFinishReason] = useState('');
  const [soundOn, setSoundOn] = useState(true);
  const [view3d, setView3d] = useState(true);
  const [gameEndsAt, setGameEndsAt] = useState(0);
  const [questionEndsAt, setQuestionEndsAt] = useState(0);

  const [multiplayerPlayerId] = useState(getMultiplayerPlayerId);
  const applyingRemoteRef = useRef(false);
  const appliedRemoteVersionRef = useRef(0);
  const lastGameSignatureRef = useRef('');

  const me = ps[turn];
  const alive = ps.filter((p) => !p.out);
  const turnQueue = Array.from(
    { length: Math.max(0, ps.length - 1) },
    (_, offset) => (turn + offset + 1) % ps.length,
  ).filter((playerIndex) => ps[playerIndex] && !ps[playerIndex].out);
  const onlinePlayers = onlineRoom ? orderedTycoonRoomPlayers(onlineRoom) : [];
  const onlineSeat = onlinePlayers.findIndex((player) => player.id === multiplayerPlayerId);
  const onlineMember = onlinePlayers.find((player) => player.id === multiplayerPlayerId);
  const isOnlineGame = playMode === 'online' && Boolean(onlineRoomCode);
  const isRoomHost = onlineRoom?.hostId === multiplayerPlayerId;
  const canTakeTurn = !isOnlineGame || onlineSeat === turn;
  const worth = (p: P) => p.money + p.owned.reduce((sum, tileIndex) => {
    const price = TYCOON_BOARD[tileIndex].property?.price || 0;
    return sum + price + propertyUpgradeInvestment(tileIndex, p.levels[tileIndex] || 0);
  }, 0);

  const completedGroups = (p: P) => countCompletedPropertyGroups(p.owned);

  const playTone = (frequency: number, duration = 0.12) => {
    if (!soundOn || typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext
        || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const context = new AudioContextClass();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.055, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + duration);
    } catch {
      // Sound is optional; gameplay must continue when audio is blocked.
    }
  };

  const start = () => {
    const endsAt = Date.now() + (minutes * 60_000);
    setPs(Array.from(
      { length: count },
      (_, i) => createPlayerState(
        i,
        teamNames[i].trim() || TYCOON_TOKENS[i].name,
        teamCharacters[i],
      ),
    ));
    setTurn(0);
    setPhase('roll');
    setDice(null);
    setTimeLeft(minutes * 60);
    setGameEndsAt(endsAt);
    setQuestionEndsAt(0);
    setFinishReason('');
    setMsg(`เริ่มเกม! ทุกทีมได้เงิน ${baht(START_MONEY)} บาท`);
    playTone(620, 0.18);
  };
  const restart = () => {
    if (onlineRoomCode) {
      void leaveTycoonRoom(onlineRoomCode, multiplayerPlayerId);
      setSessionValue(ACTIVE_ROOM_KEY, '');
      setOnlineRoomCode('');
      setOnlineRoom(null);
    }
    setPhase('setup');
    setPs([]);
    setMsg('');
    setFinishReason('');
    setUpgradeTile(null);
    setRentTile(null);
  };

  const finish = (list: P[], reason = 'เหลือผู้เล่นเพียงทีมเดียว') => {
    const live = list.filter((p) => !p.out);
    const ranked = [...(live.length > 0 ? live : list)].sort((a, b) => worth(b) - worth(a));
    const winner = ranked[0];
    const totalAnswered = list.reduce((sum, player) => sum + player.answered, 0);
    const totalCorrect = list.reduce((sum, player) => sum + player.correct, 0);
    const learningScore = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 10;
    setPs(list);
    setFinishReason(reason);
    setPhase('over');
    playTone(880, 0.35);
    void recordGame(winner ? Math.max(10, learningScore) : 10);
  };

  /** ไปตาถัดไป (ข้ามคนที่ล้มละลาย/ต้องหยุดพัก) */
  const next = (list: P[]) => {
    if (isOnlineGame && !canTakeTurn) return;
    const live = list.filter((p) => !p.out);
    if (live.length <= 1) { finish(list); return; }
    let t = turn;
    for (let i = 0; i < SIZE; i++) {
      t = (t + 1) % list.length;
      if (list[t].out) continue;
      if (list[t].skip > 0) {
        list = list.map((p) => (p.idx === t ? { ...p, skip: p.skip - 1 } : p));
        continue;
      }
      break;
    }
    setPs(list); setTurn(t); setPhase('roll');
    setDice(null);
    setQ(null);
    setPicked(null);
    setChance(null);
    setBuyTile(null);
    setRentTile(null);
    setRentOwner(null);
    setPendingRent(0);
    setUpgradeTile(null);
    setQuestionTime(QUESTION_SECONDS);
    setQuestionEndsAt(0);
    setMsg(`ถึงตา ${list[t].name}`);
  };

  /** ตรวจเงินติดลบ = ล้มละลาย */
  const settle = (list: P[]): P[] => list.map((p) => (
    p.money < 0 && !p.out ? { ...p, out: true, owned: [], levels: {} } : p
  ));

  /** เงินเดือนของผู้เล่น (พลัง "ขยันเก็บออม" ได้เพิ่ม) */
  const salaryFor = (player: P) => (
    abilityOf(player.characterId) === 'salary'
      ? Math.round(SALARY * (1 + ABILITY_VALUES.salaryBonus))
      : SALARY
  );

  /** เวลาคิดคำตอบของผู้เล่น (พลัง "สมาธิเฉียบ" ได้เวลาเพิ่ม) */
  const questionSecondsFor = (player?: P) => (
    player && abilityOf(player.characterId) === 'brain'
      ? QUESTION_SECONDS + ABILITY_VALUES.brainExtraSeconds
      : QUESTION_SECONDS
  );

  const roll = () => {
    if (!me || isRolling || (isOnlineGame && !canTakeTurn)) return;
    let d = rollDice();
    // พลัง "ทอยซ้ำได้" — ทอยได้น้อยเกินไป ระบบทอยใหม่ให้อัตโนมัติ 1 ครั้ง
    if (abilityOf(me.characterId) === 'dice' && d < ABILITY_VALUES.diceRerollUnder) {
      d = rollDice();
    }
    setDice(d);
    setIsRolling(true);
    setMsg(`${me.name} กำลังทอยลูกเต๋า...`);
    playTone(360, 0.1);
    const raw = me.pos + d;
    const finalPos = raw % SIZE;
    const passed = raw >= SIZE;
    let movingPlayers = ps;
    const moveStep = (step: number) => {
      const pos = (me.pos + step) % SIZE;
      movingPlayers = movingPlayers.map((player) => (
        player.idx === me.idx ? { ...player, pos } : player
      ));
      setPs(movingPlayers);
      playTone(390 + (step * 24), 0.055);
      if (step < d) {
        window.setTimeout(() => moveStep(step + 1), 180);
        return;
      }
      let settledPlayers = movingPlayers.map((player) => (
        player.idx === me.idx && passed
          ? { ...player, money: player.money + salaryFor(player) }
          : player
      ));
      if (passed) setMsg(`เดินครบรอบ! รับเงินเดือน ${baht(SALARY)} บาท`);
      settledPlayers = settle(settledPlayers);
      setPs(settledPlayers);
      setIsRolling(false);
      playTone(520 + (d * 30), 0.12);
      land(settledPlayers, finalPos);
    };
    window.setTimeout(() => moveStep(1), 420);
  };

  const land = (list: P[], pos: number) => {
    const tile = TYCOON_BOARD[pos];
    const cur = list[turn];

    if (tile.kind === 'property') {
      const owner = list.find((p) => !p.out && p.owned.includes(pos));
      if (!owner) { // ยังไม่มีเจ้าของ → ตอบคำถามให้ถูกก่อนจึงมีสิทธิ์ซื้อ
        setQ(pick(bank));
        setPicked(null);
        const secs = questionSecondsFor(cur);
        setQuestionTime(secs);
        setQuestionEndsAt(Date.now() + (secs * 1000));
        setBuyTile(pos);
        setRentTile(null);
        setPhase('question');
        setMsg(`${tile.property!.emoji} ${tile.property!.name} ยังว่าง — ตอบถูกจึงมีสิทธิ์ซื้อ`);
        return;
      }
      if (owner.idx === cur.idx) {
        // พลัง "สนามแม่เหล็ก" — หยุดที่ที่ดินตัวเองแล้วดึงเพื่อนที่อยู่ใกล้
        // มาติดกับดัก และเก็บค่าเช่าจากพวกเขาทันที
        if (abilityOf(cur.characterId) === 'magnet') {
          const range = ABILITY_VALUES.magnetRange;
          const near = list.filter((p) => {
            if (p.out || p.idx === cur.idx) return false;
            const gap = Math.min((p.pos - pos + SIZE) % SIZE, (pos - p.pos + SIZE) % SIZE);
            return gap > 0 && gap <= range;
          });
          if (near.length > 0) {
            const magnetGroup = tile.property!.group;
            const groupTiles = TYCOON_BOARD
              .map((t, i) => ({ t, i }))
              .filter((x) => x.t.property?.group === magnetGroup);
            const fullGroup = groupTiles.every((x) => cur.owned.includes(x.i));
            const toll = propertyRent(pos, cur.levels?.[pos] || 0, fullGroup);
            const pulledIds = new Set(near.map((p) => p.idx));
            let collected = 0;
            const pulled = list.map((p) => {
              if (!pulledIds.has(p.idx)) return p;
              const pay = Math.min(toll, Math.max(0, p.money));
              collected += pay;
              return { ...p, pos, money: p.money - pay };
            });
            setPs(settle(pulled.map((p) => (
              p.idx === cur.idx ? { ...p, money: p.money + collected } : p
            ))));
            setUpgradeTile(pos);
            setPhase('info');
            setMsg(`🧲 สนามแม่เหล็ก! ดึงเพื่อน ${near.length} คนมาติดกับดัก เก็บค่าเช่ารวม ${baht(collected)} บาท`);
            return;
          }
        }
        setUpgradeTile(pos);
        setPhase('info');
        setMsg('ที่ดินของทีมคุณ เลือกพัฒนาอาคารได้สูงสุด 3 ระดับ');
        return;
      }
      // ตอบคำถามเพื่อรับส่วนลดค่าเช่า 50% ก่อนชำระ
      const group = tile.property!.group;
      const inGroup = TYCOON_BOARD.map((t, i) => ({ t, i })).filter((x) => x.t.property?.group === group);
      const all = inGroup.every((x) => owner.owned.includes(x.i));
      const level = owner.levels[pos] || 0;
      const baseRent = propertyRent(pos, level, all);
      // พลัง "เกราะไฟร์วอลล์" ของผู้จ่าย ลดค่าเช่าที่ต้องจ่าย
      const rent = abilityOf(cur.characterId) === 'shield'
        ? Math.round(baseRent * (1 - ABILITY_VALUES.shieldRate))
        : baseRent;
      setRentTile(pos);
      setRentOwner(owner.idx);
      setPendingRent(rent);
      setBuyTile(null);
      setQ(pick(bank));
      setPicked(null);
      const secs = questionSecondsFor(cur);
      setQuestionTime(secs);
      setQuestionEndsAt(Date.now() + (secs * 1000));
      setPhase('question');
      setMsg(`ตอบถูกลดค่าเช่า 50% จาก ${baht(rent)} บาท${all ? ' ที่ดินครบกลุ่ม ×2' : ''}`);
      return;
    }

    if (tile.kind === 'chance') {
      const c = pick(CHANCE_CARDS);
      setChance(c); setPhase('chance');
      // พลัง "ดวงเฮง" ลดความเสียหายจากบัตรที่ทำให้เสียเงินลงครึ่งหนึ่ง
      const rawMoney = c.money || 0;
      const cardMoney = (rawMoney < 0 && abilityOf(cur.characterId) === 'lucky')
        ? Math.round(rawMoney * (1 - ABILITY_VALUES.luckyRate))
        : rawMoney;
      let after = list.map((p) => (p.idx === cur.idx
        ? {
          ...p,
          money: p.money + cardMoney,
          pos: c.move ? (p.pos + c.move + SIZE) % SIZE : p.pos,
          out: c.bankrupt ? true : p.out,
          owned: c.bankrupt ? [] : p.owned,
        }
        : p));

      // บัตรที่กระทบผู้เล่นคนอื่น — ทำให้ทั้งวงลุ้นไปด้วยกัน
      if (c.effect) {
        const rivals = after.filter((p) => !p.out && p.idx !== cur.idx);
        const richest = rivals.length
          ? rivals.reduce((best, p) => (p.money > best.money ? p : best))
          : null;
        const amount = c.amount || 0;

        if (c.effect === 'takeFromRichest' && richest) {
          const paid = Math.min(amount, Math.max(0, richest.money));
          after = after.map((p) => {
            if (p.idx === cur.idx) return { ...p, money: p.money + paid };
            if (p.idx === richest.idx) return { ...p, money: p.money - paid };
            return p;
          });
          setMsg(`${c.emoji} เก็บ ${baht(paid)} บาท จาก ${richest.name}`);
        } else if (c.effect === 'everyonePays') {
          const total = rivals.length * amount;
          after = after.map((p) => {
            if (p.idx === cur.idx) return { ...p, money: p.money + total };
            if (!p.out) return { ...p, money: p.money - amount };
            return p;
          });
          setMsg(`${c.emoji} รับรวม ${baht(total)} บาท จากเพื่อน ${rivals.length} คน`);
        } else if (c.effect === 'payEveryone') {
          const total = rivals.length * amount;
          after = after.map((p) => {
            if (p.idx === cur.idx) return { ...p, money: p.money - total };
            if (!p.out) return { ...p, money: p.money + amount };
            return p;
          });
          setMsg(`${c.emoji} จ่ายไป ${baht(total)} บาท ให้เพื่อน ${rivals.length} คน`);
        } else if (c.effect === 'swapWithRichest' && richest) {
          const mine = after.find((p) => p.idx === cur.idx)?.money ?? 0;
          after = after.map((p) => {
            if (p.idx === cur.idx) return { ...p, money: richest.money };
            if (p.idx === richest.idx) return { ...p, money: mine };
            return p;
          });
          setMsg(`${c.emoji} สลับเงินกับ ${richest.name}! ตอนนี้มี ${baht(richest.money)} บาท`);
        }
      }

      after = settle(after);
      setPs(after);
      return;
    }

    if (tile.kind === 'question' || tile.kind === 'learn') {
      setQ(pick(bank));
      setPicked(null);
      const secs = questionSecondsFor(cur);
      setQuestionTime(secs);
      setQuestionEndsAt(Date.now() + (secs * 1000));
      setBuyTile(null);
      setRentTile(null);
      setPhase('question');
      setMsg(tile.kind === 'learn' ? '🎓 ศูนย์เรียนรู้ — ตอบถูกรับ 800 บาท' : '❓ ตอบถูกรับ 500 บาท');
      return;
    }

    if (tile.kind === 'rest') {
      const after = settle(list.map((p) => (p.idx === cur.idx ? { ...p, money: p.money - REST_FINE, skip: 1 } : p)));
      setPs(after); setPhase('info');
      setMsg(`🛌 หยุดพัก! จ่ายค่าปรับ ${baht(REST_FINE)} บาท และพัก 1 รอบ`);
      return;
    }

    if (tile.kind === 'gotoRest') {
      const after = list.map((p) => (p.idx === cur.idx ? { ...p, pos: REST_TILE, money: p.money - REST_FINE, skip: 1 } : p));
      setPs(settle(after)); setPhase('info');
      setMsg('💻 เครื่องพัง! ไปช่องหยุดพัก จ่าย 500 บาท และพัก 1 รอบ');
      return;
    }

    setPhase('info'); setMsg('🏁 ช่องเริ่มต้น');
  };

  const answer = (i: number) => {
    if (picked !== null || !q || !me || (isOnlineGame && !canTakeTurn)) return;
    setPicked(i);
    setQuestionTime(0);
    setQuestionEndsAt(0);
    const ok = i === q.answer;
    const withStats = ps.map((player) => (
      player.idx === me.idx
        ? {
          ...player,
          answered: player.answered + 1,
          correct: player.correct + (ok ? 1 : 0),
        }
        : player
    ));
    playTone(ok ? 760 : 210, ok ? 0.16 : 0.22);

    if (rentTile !== null && rentOwner !== null) {
      const charged = ok ? Math.ceil(pendingRent / 2) : pendingRent;
      const after = settle(withStats.map((player) => {
        if (player.idx === me.idx) return { ...player, money: player.money - charged };
        if (player.idx === rentOwner) return { ...player, money: player.money + charged };
        return player;
      }));
      setPs(after);
      setMsg(
        ok
          ? `ตอบถูก ลดค่าเช่าเหลือ ${baht(charged)} บาท • ${q.why}`
          : `${i < 0 ? 'หมดเวลา' : 'ยังไม่ถูก'} จ่ายค่าเช่าเต็ม ${baht(charged)} บาท • ${q.why}`,
      );
      return;
    }

    setPs(withStats);
    if (!ok) {
      setMsg(`${i < 0 ? 'หมดเวลาตอบ' : 'ยังไม่ถูก'} • ${q.why}`);
      return;
    }

    if (buyTile !== null) {
      setMsg(`ถูกต้อง! ${q.why}`);
      return;
    }
    const baseReward = TYCOON_BOARD[me.pos].kind === 'learn' ? 800 : 500;
    // พลัง "หัวไว" — ตอบถูกได้เงินรางวัลมากขึ้น
    const isScholar = abilityOf(me.characterId) === 'scholar';
    const reward = isScholar
      ? Math.round(baseReward * (1 + ABILITY_VALUES.scholarBonus))
      : baseReward;
    setPs(withStats.map((player) => (
      player.idx === me.idx ? { ...player, money: player.money + reward } : player
    )));
    setMsg(`✅ ถูกต้อง! รับ ${baht(reward)} บาท${isScholar ? ' (หัวไว +50%)' : ''} — ${q.why}`);
  };

  const buy = (yes: boolean) => {
    if (isOnlineGame && !canTakeTurn) return;
    if (buyTile === null || !me) { next(ps); return; }
    const info = TYCOON_BOARD[buyTile].property!;
    if (!yes) { next(ps); return; }
    // พลัง "ต่อราคาเก่ง" ทำให้ซื้อที่ดินถูกลง
    const price = abilityOf(me.characterId) === 'discount'
      ? Math.round(info.price * (1 - ABILITY_VALUES.discountRate))
      : info.price;
    if (me.money < price) { setMsg('เงินไม่พอซื้อที่ดินนี้'); next(ps); return; }
    const after = ps.map((p) => (p.idx === me.idx
      ? { ...p, money: p.money - price, owned: [...p.owned, buyTile] } : p));
    setPs(after);
    setBuyTile(null);
    setUpgradeTile(buyTile);
    playTone(680, 0.2);
    if (completedGroups(after[turn]) >= 3) {
      finish(after, 'ครองที่ดินครบ 3 กลุ่มเทคโนโลยี');
      return;
    }
    setPhase('info');
    setMsg(`ซื้อ ${info.emoji} ${info.name} แล้ว พร้อมพัฒนาอาคารเมื่อมีเงินเพียงพอ`);
  };

  const upgrade = () => {
    if (upgradeTile === null || !me || (isOnlineGame && !canTakeTurn)) return;
    const property = TYCOON_BOARD[upgradeTile].property;
    if (!property || !me.owned.includes(upgradeTile)) return;
    const currentLevel = me.levels[upgradeTile] || 0;
    if (currentLevel >= 3) {
      setMsg('ที่ดินนี้พัฒนาถึงระดับสูงสุดแล้ว');
      return;
    }
    const cost = propertyUpgradeCost(upgradeTile, currentLevel);
    if (me.money < cost) {
      setMsg(`ต้องมีเงิน ${baht(cost)} บาทเพื่อพัฒนาเป็นระดับ ${currentLevel + 1}`);
      return;
    }
    const after = ps.map((player) => (
      player.idx === me.idx
        ? {
          ...player,
          money: player.money - cost,
          levels: { ...player.levels, [upgradeTile]: currentLevel + 1 },
        }
        : player
    ));
    setPs(after);
    playTone(820, 0.18);
    setMsg(`พัฒนา ${property.emoji} ${property.name} เป็นระดับ ${currentLevel + 1} แล้ว ค่าเช่าเพิ่มขึ้น`);
  };

  const handleCreateOnlineRoom = async () => {
    if (!onlinePlayerName.trim()) {
      setRoomError('กรุณาใส่ชื่อผู้เล่น');
      return;
    }
    setRoomBusy(true);
    setRoomError('');
    const result = await createTycoonRoom({
      name: roomName,
      password: roomPassword,
      minutes,
      host: {
        id: multiplayerPlayerId,
        name: onlinePlayerName.trim(),
        characterId: onlineCharacterId,
      },
    });
    setRoomBusy(false);
    if (!result.ok || !result.room) {
      setRoomError(result.error || 'สร้างห้องไม่สำเร็จ');
      return;
    }
    setOnlineRoom(result.room);
    setOnlineRoomCode(result.room.code);
    setJoinCode(result.room.code);
    setSessionValue(ACTIVE_ROOM_KEY, result.room.code);
  };

  const handleJoinOnlineRoom = async () => {
    if (joinCode.length !== 6) {
      setRoomError('กรุณาใส่รหัสห้อง 6 หลัก');
      return;
    }
    if (!onlinePlayerName.trim()) {
      setRoomError('กรุณาใส่ชื่อผู้เล่น');
      return;
    }
    setRoomBusy(true);
    setRoomError('');
    const result = await joinTycoonRoom(joinCode, roomPassword, {
      id: multiplayerPlayerId,
      name: onlinePlayerName.trim(),
      characterId: onlineCharacterId,
    });
    setRoomBusy(false);
    if (!result.ok || !result.room) {
      setRoomError(result.error || 'เข้าห้องไม่สำเร็จ');
      return;
    }
    setOnlineRoom(result.room);
    setOnlineRoomCode(result.room.code);
    setSessionValue(ACTIVE_ROOM_KEY, result.room.code);
  };

  const handleLeaveOnlineRoom = () => {
    if (onlineRoomCode) void leaveTycoonRoom(onlineRoomCode, multiplayerPlayerId);
    setSessionValue(ACTIVE_ROOM_KEY, '');
    setOnlineRoomCode('');
    setOnlineRoom(null);
    setRoomError('');
    setPhase('setup');
  };

  const handleOnlineCharacter = async (characterId: string) => {
    setOnlineCharacterId(characterId);
    if (!onlineRoomCode || !onlineMember) return;
    setRoomBusy(true);
    const result = await updateTycoonRoomPlayer(
      onlineRoomCode,
      multiplayerPlayerId,
      { characterId, ready: false },
    );
    setRoomBusy(false);
    if (!result.ok) {
      setRoomError(result.error || 'เปลี่ยนตัวละครไม่สำเร็จ');
      setOnlineCharacterId(onlineMember.characterId);
      return;
    }
    if (result.room) setOnlineRoom(result.room);
    setRoomError('');
  };

  const handleReady = async () => {
    if (!onlineRoomCode || !onlineMember) return;
    setRoomBusy(true);
    const result = await updateTycoonRoomPlayer(
      onlineRoomCode,
      multiplayerPlayerId,
      { ready: !onlineMember.ready, name: onlinePlayerName.trim() || onlineMember.name },
    );
    setRoomBusy(false);
    if (!result.ok) {
      setRoomError(result.error || 'เปลี่ยนสถานะไม่สำเร็จ');
      return;
    }
    if (result.room) setOnlineRoom(result.room);
    setRoomError('');
  };

  const handleStartOnlineGame = async () => {
    if (!onlineRoom || !isRoomHost || !canStartTycoonRoom(onlineRoom)) return;
    const players = orderedTycoonRoomPlayers(onlineRoom).map((player, index) => (
      createPlayerState(index, player.name, player.characterId)
    ));
    const endsAt = Date.now() + (onlineRoom.minutes * 60_000);
    const baseGame: Omit<TycoonGameSnapshot, 'version' | 'updatedBy'> = {
      phase: 'roll',
      players,
      turn: 0,
      dice: null,
      isRolling: false,
      question: null,
      picked: null,
      chance: null,
      message: `เริ่มเกม! ทุกคนได้รับเงิน ${baht(START_MONEY)} บาท`,
      buyTile: null,
      rentTile: null,
      rentOwner: null,
      pendingRent: 0,
      upgradeTile: null,
      finishReason: '',
      endsAt,
      questionEndsAt: 0,
    };
    const snapshot: TycoonGameSnapshot = {
      ...baseGame,
      version: Date.now(),
      updatedBy: multiplayerPlayerId,
    };
    setRoomBusy(true);
    const result = await startTycoonMultiplayerRoom(
      onlineRoom.code,
      multiplayerPlayerId,
      snapshot,
    );
    setRoomBusy(false);
    if (!result.ok) {
      setRoomError(result.error || 'เริ่มเกมไม่สำเร็จ');
      return;
    }
    appliedRemoteVersionRef.current = snapshot.version;
    lastGameSignatureRef.current = gameSignature(baseGame);
    setPs(players);
    setTurn(0);
    setPhase('roll');
    setDice(null);
    setTimeLeft(onlineRoom.minutes * 60);
    setGameEndsAt(endsAt);
    setQuestionEndsAt(0);
    setMsg(baseGame.message);
    if (result.room) setOnlineRoom(result.room);
    playTone(620, 0.18);
  };

  const copyRoomCode = () => {
    if (!onlineRoom?.code || !navigator.clipboard) return;
    void navigator.clipboard.writeText(onlineRoom.code);
    setMsg('คัดลอกรหัสห้องแล้ว');
  };

  const finishRef = useRef(finish);
  const answerRef = useRef(answer);

  useEffect(() => {
    finishRef.current = finish;
    answerRef.current = answer;
  });

  useEffect(() => {
    if (playMode !== 'online' || !onlineRoomCode) return undefined;
    return subscribeTycoonRoom(
      onlineRoomCode,
      (room) => {
        setOnlineRoom(room);
        if (!room) return;
        const member = room.players.find((player) => player.id === multiplayerPlayerId);
        if (member) {
          setOnlineCharacterId(member.characterId);
          setOnlinePlayerName(member.name);
        }
      },
      setRoomSyncMode,
    );
  }, [multiplayerPlayerId, onlineRoomCode, playMode]);

  useEffect(() => {
    const game = onlineRoom?.game;
    if (!game || game.version <= appliedRemoteVersionRef.current) return;
    applyingRemoteRef.current = true;
    appliedRemoteVersionRef.current = game.version;
    const baseGame: Omit<TycoonGameSnapshot, 'version' | 'updatedBy'> = {
      phase: game.phase,
      players: game.players,
      turn: game.turn,
      dice: game.dice,
      isRolling: game.isRolling,
      question: game.question,
      picked: game.picked,
      chance: game.chance,
      message: game.message,
      buyTile: game.buyTile,
      rentTile: game.rentTile,
      rentOwner: game.rentOwner,
      pendingRent: game.pendingRent,
      upgradeTile: game.upgradeTile,
      finishReason: game.finishReason,
      endsAt: game.endsAt,
      questionEndsAt: game.questionEndsAt,
    };
    lastGameSignatureRef.current = gameSignature(baseGame);
    setPs(game.players);
    setTurn(game.turn);
    setPhase(game.phase);
    setDice(game.dice);
    setIsRolling(game.isRolling);
    setQ(game.question);
    setPicked(game.picked);
    setChance(game.chance);
    setMsg(game.message);
    setBuyTile(game.buyTile);
    setRentTile(game.rentTile);
    setRentOwner(game.rentOwner);
    setPendingRent(game.pendingRent);
    setUpgradeTile(game.upgradeTile);
    setFinishReason(game.finishReason);
    setGameEndsAt(game.endsAt);
    setQuestionEndsAt(game.questionEndsAt);
    setTimeLeft(Math.max(0, Math.ceil((game.endsAt - Date.now()) / 1000)));
    setQuestionTime(
      game.questionEndsAt
        ? Math.max(0, Math.ceil((game.questionEndsAt - Date.now()) / 1000))
        : 10,
    );
    window.setTimeout(() => {
      applyingRemoteRef.current = false;
    }, 80);
  }, [onlineRoom?.game]);

  useEffect(() => {
    if (
      !isOnlineGame
      || !onlineRoom
      || (onlineRoom.status !== 'playing' && phase !== 'over')
      || phase === 'setup'
      || applyingRemoteRef.current
      || ps.length === 0
    ) return undefined;

    const baseGame: Omit<TycoonGameSnapshot, 'version' | 'updatedBy'> = {
      phase,
      players: ps,
      turn,
      dice,
      isRolling,
      question: q,
      picked,
      chance,
      message: msg,
      buyTile,
      rentTile,
      rentOwner,
      pendingRent,
      upgradeTile,
      finishReason,
      endsAt: gameEndsAt,
      questionEndsAt,
    };
    const signature = gameSignature(baseGame);
    if (signature === lastGameSignatureRef.current) return undefined;

    const timer = window.setTimeout(() => {
      const version = Math.max(Date.now(), appliedRemoteVersionRef.current + 1);
      const snapshot: TycoonGameSnapshot = {
        ...baseGame,
        version,
        updatedBy: multiplayerPlayerId,
      };
      lastGameSignatureRef.current = signature;
      appliedRemoteVersionRef.current = version;
      void publishTycoonGame(onlineRoom.code, multiplayerPlayerId, snapshot);
    }, 120);
    return () => window.clearTimeout(timer);
  }, [
    buyTile,
    chance,
    dice,
    finishReason,
    gameEndsAt,
    isOnlineGame,
    isRolling,
    msg,
    multiplayerPlayerId,
    onlineRoom,
    pendingRent,
    phase,
    picked,
    ps,
    q,
    questionEndsAt,
    rentOwner,
    rentTile,
    turn,
    upgradeTile,
  ]);

  useEffect(() => {
    if (phase === 'setup' || phase === 'over' || timeLeft <= 0) return undefined;
    const timer = window.setTimeout(() => {
      if (timeLeft <= 1) {
        if (!isOnlineGame || isRoomHost) finishRef.current(ps, 'หมดเวลาแข่งขัน');
        else setTimeLeft(0);
      } else {
        setTimeLeft((current) => current - 1);
      }
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [isOnlineGame, isRoomHost, phase, ps, timeLeft]);

  useEffect(() => {
    if (phase !== 'question' || picked !== null || !q) return undefined;
    const timer = window.setTimeout(() => {
      if (questionTime <= 1) {
        if (canTakeTurn) answerRef.current(-1);
        else setQuestionTime(0);
      } else {
        setQuestionTime((current) => current - 1);
      }
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [canTakeTurn, phase, picked, q, questionTime]);

  // ---------- SETUP ----------
  if (phase === 'setup') {
    return (
      <div className="game-page tyc-pixel-game tyc-pixel-setup">
        <div className="game-topbar">
          <Link to="/games" className="game-back"><ChevronLeft size={18} /> เกมทั้งหมด</Link>
          <h2>💰 เกมเศรษฐีวิทยาการคำนวณ</h2>
        </div>
        <div className="game-stats"><GameLearnCard gameKey="tycoon" /></div>
        <div className="binary-card tyc-setup">
          <div className="tyc-mode-switch" aria-label="รูปแบบการเล่น">
            <button
              type="button"
              className={playMode === 'shared' ? 'active' : ''}
              onClick={() => {
                if (onlineRoomCode) handleLeaveOnlineRoom();
                setPlayMode('shared');
              }}
            >
              <Monitor size={21} />
              <span>จอเดียว</span>
              <small>ผลัดกันเล่นหน้าเครื่องเดียว</small>
            </button>
            <button
              type="button"
              className={playMode === 'online' ? 'active' : ''}
              onClick={() => setPlayMode('online')}
            >
              <Wifi size={21} />
              <span>หลายจอในห้อง</span>
              <small>เปิดห้องแล้วเล่นพร้อมเพื่อน</small>
            </button>
          </div>

          {playMode === 'shared' ? (
            <>
              <div className="tyc-setup-heading">
                <div>
                  <span className="tyc-eyebrow"><Gamepad2 size={15} /> โหมดจอเดียว</span>
                  <h3>แบ่งทีมแล้วผลัดกันทอย 2-4 ทีม</h3>
                </div>
                <Monitor size={34} />
              </div>
              <p className="tyc-sub">
                ตอบคำถามให้ถูกเพื่อซื้อพื้นที่ พัฒนาอาคาร และเก็บค่าเช่า
              </p>
              <div className="tyc-rules">
                <span>เริ่มต้น {baht(START_MONEY)} บาท</span>
                <span>ครบรอบรับ {baht(SALARY)} บาท</span>
                <span>ตอบถูกลดค่าเช่า 50%</span>
                <span>ครองครบ 3 กลุ่มชนะ</span>
              </div>
              <div className="tyc-setup-controls">
                <div className="tyc-count">
                  <Users size={17} /> จำนวนทีม
                  {[2, 3, 4].map((n) => (
                    <button key={n} className={count === n ? 'on' : ''} onClick={() => setCount(n)}>{n}</button>
                  ))}
                </div>
                <div className="tyc-count">
                  <Clock3 size={17} /> เวลาแข่งขัน
                  {([5, 10, 15] as const).map((value) => (
                    <button
                      key={value}
                      className={minutes === value ? 'on' : ''}
                      onClick={() => setMinutes(value)}
                    >
                      {value} นาที
                    </button>
                  ))}
                </div>
              </div>
              <div className="tyc-lobby" aria-label="รายชื่อทีม">
                <div className="tyc-lobby-head">
                  <span><Users size={17} /> ทีมที่ร่วมเล่น</span>
                  <b>{count} ทีม</b>
                </div>
                <div className="tyc-team-grid">
                  {Array.from({ length: count }, (_, index) => (
                    <label
                      key={TYCOON_TOKENS[index].name}
                      className={editingTeam === index ? 'editing' : ''}
                      style={{
                        '--team': TYCOON_TOKENS[index].color,
                        '--team-i': index,
                      } as React.CSSProperties}
                      onClick={() => setEditingTeam(index)}
                    >
                      <TycoonAvatar characterId={teamCharacters[index]} size="small" />
                      <input
                        value={teamNames[index]}
                        maxLength={24}
                        onFocus={() => setEditingTeam(index)}
                        onChange={(event) => setTeamNames((current) => current.map(
                          (name, nameIndex) => (nameIndex === index ? event.target.value : name),
                        ))}
                        aria-label={`ชื่อทีม ${index + 1}`}
                      />
                      <ShieldCheck size={16} />
                    </label>
                  ))}
                </div>
                <div className="tyc-picker-heading">
                  <span>ตัวละครของ {teamNames[editingTeam] || `ทีม ${editingTeam + 1}`}</span>
                  <small>{getTycoonCharacter(teamCharacters[editingTeam]).role}</small>
                </div>
                <CharacterPicker
                  selectedId={teamCharacters[editingTeam]}
                  takenIds={teamCharacters.slice(0, count).filter((_, index) => index !== editingTeam)}
                  onSelect={(characterId) => setTeamCharacters((current) => (
                    current.map((id, index) => (index === editingTeam ? characterId : id))
                  ))}
                />
              </div>
              <button className="btn-game-start tyc-start" onClick={start}>
                <Gamepad2 size={19} /> เริ่มเล่นจอเดียว
              </button>
            </>
          ) : (
            <div className="tyc-online-setup">
              {!onlineRoomCode || !onlineRoom ? (
                <>
                  <div className="tyc-setup-heading">
                    <div>
                      <span className="tyc-eyebrow"><Wifi size={15} /> โหมดหลายจอในห้องเรียน</span>
                      <h3>สร้างห้องหรือเข้าร่วมด้วยรหัส 6 หลัก</h3>
                    </div>
                    <Users size={34} />
                  </div>
                  <div className="tyc-online-identity">
                    <label>
                      <span>ชื่อผู้เล่น</span>
                      <input
                        value={onlinePlayerName}
                        maxLength={40}
                        onChange={(event) => setOnlinePlayerName(event.target.value)}
                        placeholder="ชื่อที่แสดงในห้อง"
                      />
                    </label>
                    <label>
                      <span><KeyRound size={15} /> รหัสผ่านห้อง</span>
                      <input
                        type="password"
                        value={roomPassword}
                        maxLength={20}
                        onChange={(event) => setRoomPassword(event.target.value)}
                        placeholder="ตั้งหรือใส่รหัสผ่าน"
                      />
                    </label>
                  </div>
                  <div className="tyc-picker-heading">
                    <span>เลือกตัวละครของคุณ</span>
                    <small>{getTycoonCharacter(onlineCharacterId).role}</small>
                  </div>
                  <CharacterPicker
                    selectedId={onlineCharacterId}
                    onSelect={setOnlineCharacterId}
                    disabled={roomBusy}
                  />
                  <div className="tyc-room-actions">
                    <section>
                      <div className="tyc-room-section-title">
                        <DoorOpen size={19} />
                        <div><b>สร้างห้องใหม่</b><small>คุณจะเป็นเจ้าของห้อง</small></div>
                      </div>
                      <label>
                        <span>ชื่อห้อง</span>
                        <input
                          value={roomName}
                          maxLength={60}
                          onChange={(event) => setRoomName(event.target.value)}
                        />
                      </label>
                      <div className="tyc-count">
                        <Clock3 size={16} />
                        {([5, 10, 15] as const).map((value) => (
                          <button
                            key={value}
                            className={minutes === value ? 'on' : ''}
                            onClick={() => setMinutes(value)}
                          >
                            {value} นาที
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        className="tyc-room-primary"
                        onClick={handleCreateOnlineRoom}
                        disabled={roomBusy}
                      >
                        <DoorOpen size={18} /> สร้างห้อง
                      </button>
                    </section>
                    <section>
                      <div className="tyc-room-section-title">
                        <LogIn size={19} />
                        <div><b>เข้าห้องเพื่อน</b><small>ใช้รหัสจากเจ้าของห้อง</small></div>
                      </div>
                      <label>
                        <span>รหัสห้อง 6 หลัก</span>
                        <input
                          className="tyc-code-input"
                          inputMode="numeric"
                          value={joinCode}
                          maxLength={6}
                          onChange={(event) => setJoinCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="000000"
                        />
                      </label>
                      <button
                        type="button"
                        className="tyc-room-secondary"
                        onClick={handleJoinOnlineRoom}
                        disabled={roomBusy || joinCode.length !== 6}
                      >
                        <LogIn size={18} /> เข้าร่วมห้อง
                      </button>
                    </section>
                  </div>
                  {onlineRoomCode && !onlineRoom && (
                    <div className="tyc-room-loading">กำลังเชื่อมต่อห้อง {onlineRoomCode}...</div>
                  )}
                </>
              ) : (
                <div className="tyc-room-lobby">
                  <header>
                    <div>
                      <span className={`tyc-sync is-${roomSyncMode}`}>
                        <Wifi size={14} />
                        {roomSyncMode === 'firebase'
                          ? 'เชื่อมต่อหลายจอแล้ว'
                          : roomSyncMode === 'local' ? 'โหมดเครื่องเดียวชั่วคราว' : 'กำลังเชื่อมต่อ'}
                      </span>
                      <h3>{onlineRoom.name}</h3>
                      <button type="button" className="tyc-room-code" onClick={copyRoomCode}>
                        ห้อง {onlineRoom.code} <Copy size={15} />
                      </button>
                    </div>
                    <button type="button" className="tyc-close-room" onClick={handleLeaveOnlineRoom} title="ออกจากห้อง">
                      <X size={19} />
                    </button>
                  </header>
                  <div className="tyc-room-members">
                    {onlinePlayers.map((player, index) => (
                      <div
                        key={player.id}
                        className={`${player.ready ? 'ready' : ''}${player.id === multiplayerPlayerId ? ' mine' : ''}`}
                        style={{
                          '--team': TYCOON_TOKENS[index].color,
                          '--member-i': index,
                        } as React.CSSProperties}
                      >
                        <TycoonAvatar characterId={player.characterId} size="large" active={player.ready} />
                        <div>
                          <b>{player.name}</b>
                          <span>{getTycoonCharacter(player.characterId).name}</span>
                        </div>
                        {player.id === onlineRoom.hostId && <small>เจ้าของห้อง</small>}
                        <strong>{player.ready ? 'พร้อม' : 'กำลังเตรียมตัว'}</strong>
                      </div>
                    ))}
                    {Array.from({ length: 4 - onlinePlayers.length }, (_, index) => (
                      <div key={`empty-${index}`} className="empty">
                        <Users size={22} />
                        <span>รอเพื่อนเข้าห้อง</span>
                      </div>
                    ))}
                  </div>
                  {onlineMember && onlineRoom.status === 'lobby' && (
                    <>
                      <div className="tyc-picker-heading">
                        <span>ตัวละครของคุณ</span>
                        <small>เปลี่ยนได้ก่อนกดพร้อม</small>
                      </div>
                      <CharacterPicker
                        selectedId={onlineMember.characterId}
                        takenIds={onlinePlayers
                          .filter((player) => player.id !== multiplayerPlayerId)
                          .map((player) => player.characterId)}
                        onSelect={handleOnlineCharacter}
                        disabled={roomBusy || onlineMember.ready}
                      />
                      <div className="tyc-ready-actions">
                        <button
                          type="button"
                          className={onlineMember.ready ? 'is-ready' : ''}
                          onClick={handleReady}
                          disabled={roomBusy}
                        >
                          <Check size={19} />
                          {onlineMember.ready ? 'พร้อมแล้ว' : 'กดเตรียมพร้อม'}
                        </button>
                        {isRoomHost ? (
                          <button
                            type="button"
                            className="tyc-start-room"
                            onClick={handleStartOnlineGame}
                            disabled={roomBusy || !canStartTycoonRoom(onlineRoom)}
                          >
                            <Gamepad2 size={19} /> เริ่มเกม
                          </button>
                        ) : (
                          <span className="tyc-wait-host">รอเจ้าของห้องเริ่มเกม</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
              {roomError && <div className="tyc-room-error">{roomError}</div>}
            </div>
          )}
        </div>
        <div className="game-tips">
          <strong>{playMode === 'shared' ? 'จอเดียว:' : 'หลายจอ:'}</strong>
          {' '}
          {playMode === 'shared'
            ? 'แบ่งทีมแล้วผลัดกันควบคุมจากเครื่องหน้าห้อง'
            : 'ทุกคนเปิดหน้าเกมนี้ ใส่รหัสห้อง และกดพร้อมก่อนเริ่ม'}
        </div>
        <TycoonStyles />
      </div>
    );
  }

  // ---------- GAME OVER ----------
  if (phase === 'over') {
    const rank = [...ps].sort((a, b) => (a.out === b.out ? worth(b) - worth(a) : a.out ? 1 : -1));
    return (
      <div className="game-page tyc-pixel-game tyc-pixel-over">
        <div className="game-topbar">
          <Link to="/games" className="game-back"><ChevronLeft size={18} /> เกมทั้งหมด</Link>
          <h2>💰 เกมเศรษฐีวิทยาการคำนวณ</h2>
        </div>
        <div className="binary-card tyc-win">
          <TycoonAvatar characterId={rank[0].characterId} size="large" active />
          <Crown size={34} style={{ color: '#f59e0b' }} />
          <h2>{rank[0].name} ชนะ!</h2>
          <span className="tyc-finish-reason">{finishReason}</span>
          <p>ทรัพย์สินรวม {baht(worth(rank[0]))} บาท</p>
          <div className="tyc-rank">
            {rank.map((p, i) => (
              <div key={p.idx} className={p.out ? 'out' : ''}>
                <b>#{i + 1}</b>
                <TycoonAvatar characterId={p.characterId} size="small" />
                <strong>{p.name}</strong>
                <small>ตอบถูก {p.correct}/{p.answered} • ครบ {completedGroups(p)} กลุ่ม</small>
                <span>{p.out ? 'ล้มละลาย' : `${baht(worth(p))} บาท`}</span>
              </div>
            ))}
          </div>
          <button className="btn-game-start" onClick={restart}><RotateCcw size={16} /> เล่นใหม่</button>
        </div>
        <TycoonStyles />
      </div>
    );
  }

  // ---------- PLAYING ----------
  return (
    <div className="game-page tyc-pixel-game tyc-pixel-playing">
      <div className="game-topbar">
        <Link to="/games" className="game-back"><ChevronLeft size={18} /> เกมทั้งหมด</Link>
        <h2>💰 เกมเศรษฐีวิทยาการคำนวณ</h2>
      </div>

      <div className="tyc-arcade-banner">
        <div className="tyc-arcade-hearts" aria-label={`ผู้เล่นที่ยังอยู่ ${alive.length} คน`}>
          {ps.map((player) => (
            <Heart
              key={player.idx}
              size={26}
              fill={player.out ? 'transparent' : '#ff3f75'}
              stroke={player.out ? '#64748b' : '#fff'}
              strokeWidth={2.6}
            />
          ))}
        </div>
        <div className="tyc-arcade-logo">
          <span>PIXEL TECH</span>
          <strong>TYCOON QUEST</strong>
          <small>พิชิตอาณาจักรวิทยาการคำนวณ</small>
        </div>
        <div className="tyc-arcade-coins">
          <Coins size={25} />
          <span>×</span>
          <strong>{baht(me?.money || 0)}</strong>
        </div>
      </div>

      <div className="tyc-player-reveal" aria-hidden="true">
        <div className="tyc-player-reveal-flare" />
        <div className="tyc-player-reveal-title">
          <span>พร้อมลุย!</span>
          <strong>เปิดตัวผู้เล่น</strong>
        </div>
        <div className="tyc-player-reveal-cast">
          {ps.map((player) => (
            <div
              key={player.idx}
              className="tyc-player-reveal-card"
              style={{
                '--player-i': player.idx,
                '--player-color': TYCOON_TOKENS[player.idx].color,
              } as React.CSSProperties}
            >
              <TycoonAvatar
                characterId={player.characterId}
                size="large"
                walking
                active={player.idx === turn}
              />
              <b>{player.name}</b>
            </div>
          ))}
        </div>
        <div className="tyc-player-reveal-confetti">
          {TYCOON_FX_PARTICLES.map((particle) => (
            <i
              key={particle}
              style={{ '--fx-i': particle } as React.CSSProperties}
            />
          ))}
        </div>
      </div>

      <div className="game-stats">
        <GameLearnCard gameKey="tycoon" />
        <div className="gstat tyc-turn-stat">
          {me && <TycoonAvatar characterId={me.characterId} size="token" active />}
          <span>ตาของ</span>
          <strong>{me?.name}</strong>
        </div>
        <div className={`gstat tyc-timer${timeLeft <= 60 ? ' warning' : ''}`}><Clock3 size={15} /> <strong>{clock(timeLeft)}</strong></div>
        {dice !== null && <div className={`gstat tyc-dice-stat${isRolling ? ' rolling' : ''}`}>🎲 <strong>{dice}</strong></div>}
        <div className="gstat">👥 เหลือ <strong>{alive.length}</strong> คน</div>
        <button className="gstat" onClick={() => setView3d((v) => !v)} title="สลับมุมมองกระดาน">
          {view3d ? '🧊 มุมมอง 3D' : '⬜ มุมมอง 2D'}
        </button>
        <button
          className="gstat tyc-icon-control"
          onClick={() => setSoundOn((current) => !current)}
          title={soundOn ? 'ปิดเสียง' : 'เปิดเสียง'}
          aria-label={soundOn ? 'ปิดเสียง' : 'เปิดเสียง'}
        >
          {soundOn ? <Volume2 size={17} /> : <VolumeX size={17} />}
        </button>
      </div>

      <div className="tyc-wrap">
        {/* กระดานสี่เหลี่ยม — มุมมอง 3D เอียงเหมือนวางบนโต๊ะจริง */}
        <div className={`tyc-stage ${view3d ? 'is3d' : ''} ${isRolling ? 'is-moving' : ''}`}>
        {isRolling && (
          <div
            key={`${turn}-${dice}-${me?.pos ?? 0}`}
            className="tyc-roll-fx"
            aria-hidden="true"
          >
            <span className="tyc-roll-ring ring-a" />
            <span className="tyc-roll-ring ring-b" />
            <span className="tyc-roll-burst">
              {TYCOON_FX_PARTICLES.map((particle) => (
                <i
                  key={particle}
                  style={{ '--fx-i': particle } as React.CSSProperties}
                />
              ))}
            </span>
            <span className="tyc-flying-dice dice-a">⚄</span>
            <span className="tyc-flying-dice dice-b">⚂</span>
            <span className="tyc-flying-dice dice-c">⚅</span>
          </div>
        )}
        <div className="tyc-board">
          {TYCOON_BOARD.map((tile, i) => {
            const [r, c] = tileGridPos(i);
            const here = ps.filter((p) => !p.out && p.pos === i);
            const owner = ps.find((p) => !p.out && p.owned.includes(i));
            const pr = tile.property;
            return (
              <div
                key={i}
                className={`tyc-tile k-${tile.kind}${owner ? ' is-owned' : ''}${here.length > 0 ? ' has-player' : ''}${here.some((p) => p.idx === turn) ? ' is-current-position' : ''}`}
                style={{
                  gridRow: r, gridColumn: c,
                  ['--g' as string]: pr ? pr.groupColor : undefined,
                  ['--owner' as string]: owner ? TYCOON_TOKENS[owner.idx].color : undefined,
                  ['--tile-i' as string]: i,
                }}
              >
                {pr ? (
                  <>
                    <span className="tyc-face">{pr.emoji}</span>
                    <span className="tyc-name">{pr.name}</span>
                    <span className="tyc-price">{baht(pr.price)}</span>
                    {owner && (
                      <TycoonAvatar
                        characterId={owner.characterId}
                        size="token"
                        className="tyc-owner-avatar"
                      />
                    )}
                    {owner && (
                      <span className="tyc-house" style={{ '--h': TYCOON_TOKENS[owner.idx].color } as React.CSSProperties} aria-hidden="true">
                        {Array.from({ length: (owner.levels[i] || 0) + 1 }, (_, houseIndex) => <i key={houseIndex} />)}
                      </span>
                    )}
                    {owner && (owner.levels[i] || 0) > 0 && (
                      <span className="tyc-level">L{owner.levels[i]}</span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="tyc-face"><SpecialTileIcon kind={tile.kind} /></span>
                    <span className="tyc-name">
                      {tile.kind === 'start' ? 'เริ่มต้น' : tile.kind === 'chance' ? 'เสี่ยงดวง'
                        : tile.kind === 'question' ? 'คำถาม' : tile.kind === 'rest' ? 'หยุดพัก'
                          : tile.kind === 'gotoRest' ? 'เครื่องพัง' : 'ศูนย์เรียนรู้'}
                    </span>
                  </>
                )}
                {here.length > 0 && (
                  <span className="tyc-tokens">
                    {isRolling && here.some((player) => player.idx === turn) && (
                      <span className="tyc-step-fx" aria-hidden="true">
                        {TYCOON_FX_PARTICLES.slice(0, 8).map((particle) => (
                          <i
                            key={particle}
                            style={{ '--fx-i': particle } as React.CSSProperties}
                          />
                        ))}
                      </span>
                    )}
                    {here.map((p) => (
                      <TycoonAvatar
                        key={p.idx}
                        characterId={p.characterId}
                        size="token"
                        walking={isRolling && p.idx === turn}
                        active={p.idx === turn}
                      />
                    ))}
                  </span>
                )}
              </div>
            );
          })}
          <div className="tyc-center">
            <div className="tyc-center-hud">
            <div className="tyc-logo">💰</div>
            <b>เศรษฐีวิทยาการคำนวณ</b>
            <small>ตอบถูก = ได้สิทธิ์ซื้อที่ดิน</small>
            <div className={`tyc-live-dice${isRolling ? ' rolling' : ''}`}>
              <Dices size={22} />
              <strong>{dice || '?'}</strong>
              <span>{clock(timeLeft)}</span>
            </div>
            {phase === 'roll' && (
              <button className="tyc-center-roll" onClick={roll} disabled={isRolling || !canTakeTurn}>
                <Dices size={22} />
                <span>{isRolling ? 'กำลังทอย...' : canTakeTurn ? 'ทอย' : 'รอตา'}</span>
              </button>
            )}
            </div>
          </div>
        </div>
        </div>

        {/* แผงผู้เล่น */}
        <div className="tyc-side">
          {ps.map((p) => {
            const waitingTurn = turnQueue.indexOf(p.idx) + 1;
            const isWaiting = !p.out && p.idx !== turn;
            return (
              <div
                key={p.idx}
                className={`tyc-p${p.idx === turn ? ' active' : ''}${isWaiting ? ' waiting' : ''}${isWaiting && isRolling ? ' is-cheering' : ''}${p.out ? ' out' : ''}`}
                style={{
                  borderColor: TYCOON_TOKENS[p.idx].color,
                  '--player-i': p.idx,
                  '--player-color': TYCOON_TOKENS[p.idx].color,
                } as React.CSSProperties}
              >
                <TycoonAvatar
                  characterId={p.characterId}
                  size="medium"
                  active={p.idx === turn}
                  walking={isRolling && p.idx === turn}
                />
                <div className="tyc-p-info">
                  <b>{p.name}{p.out && ' (ล้มละลาย)'}</b>
                  <span className={`tyc-player-state${p.idx === turn ? ' now' : ''}`}>
                    {p.out ? 'ออกจากเกม' : p.idx === turn ? 'กำลังเล่น' : `รออีก ${waitingTurn} คิว`}
                  </span>
                  <span className="tyc-money"><Coins size={13} /> {baht(p.money)} บาท</span>
                  <span className="tyc-props">
                    <Building2 size={12} /> ที่ดิน {p.owned.length} • ครบ {completedGroups(p)} กลุ่ม
                    {p.skip > 0 ? ' • พัก 1 รอบ' : ''}
                  </span>
                  <span className="tyc-accuracy">ความรู้ {p.correct}/{p.answered}</span>
                </div>
                {isWaiting && isRolling && (
                  <span className="tyc-cheer-fx" aria-hidden="true">
                    <b>ลุ้น!</b>
                    {TYCOON_FX_PARTICLES.slice(0, 6).map((particle) => (
                      <i
                        key={particle}
                        style={{ '--fx-i': particle } as React.CSSProperties}
                      />
                    ))}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {isOnlineGame && onlineRoom && (
        <div className={`tyc-online-turn${canTakeTurn ? ' mine' : ''}`}>
          <Wifi size={16} />
          {!canTakeTurn && onlineMember && (
            <TycoonAvatar
              characterId={onlineMember.characterId}
              size="token"
              className="tyc-online-wait-avatar"
            />
          )}
          <span>ห้อง {onlineRoom.code}</span>
          <b>{canTakeTurn ? 'ถึงตาของคุณ' : `รอ ${me?.name || 'เพื่อน'} เล่น`}</b>
          {!canTakeTurn && (
            <span className="tyc-waiting-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          )}
        </div>
      )}

      {msg && <div className="tyc-msg">{msg}</div>}

      {phase === 'roll' && (
        <div className="puzzle-actions tyc-external-roll">
          <button className="btn-game-start tyc-dice" onClick={roll} disabled={isRolling || !canTakeTurn}>
            <Dices size={20} /> {isRolling ? 'กำลังทอย...' : 'ทอยลูกเต๋า'}
          </button>
        </div>
      )}

      {phase === 'info' && (
        <div className="puzzle-actions tyc-turn-actions">
          {upgradeTile !== null && me?.owned.includes(upgradeTile) && (me.levels[upgradeTile] || 0) < 3 && (
            <button className="btn-secondary tyc-upgrade" onClick={upgrade} disabled={!canTakeTurn}>
              <Building2 size={17} />
              พัฒนาระดับ {(me.levels[upgradeTile] || 0) + 1}
              {' '}
              {baht(propertyUpgradeCost(upgradeTile, me.levels[upgradeTile] || 0))}
              {' '}บาท
            </button>
          )}
          <button className="btn-game-start" onClick={() => next(ps)} disabled={!canTakeTurn}>ตาถัดไป →</button>
        </div>
      )}

      {phase === 'chance' && chance && (
        <div className="binary-card tyc-chance">
          <div className="tyc-chance-tag">🎴 บัตรเสี่ยงดวง</div>
          <div className="tyc-chance-emoji">{chance.emoji}</div>
          <p>{chance.text}</p>
          <div className="puzzle-actions">
            <button className="btn-game-start" onClick={() => next(ps)} disabled={!canTakeTurn}>ตาถัดไป →</button>
          </div>
        </div>
      )}

      {phase === 'question' && q && (
        <div className="binary-card tyc-q" style={{ borderTopColor: CT_PILLARS[q.pillar].color }}>
          <div className={`tyc-question-timer${questionTime <= 3 ? ' danger' : ''}`}>
            <span style={{ width: `${questionTime * 10}%` }} />
            <b><Clock3 size={14} /> {picked === null ? `${questionTime} วินาที` : 'ตอบแล้ว'}</b>
          </div>
          <div className="tyc-q-tag" style={{ background: CT_PILLARS[q.pillar].color }}>
            {CT_PILLARS[q.pillar].emoji} {CT_PILLARS[q.pillar].name}
          </div>
          {rentTile !== null && (
            <div className="tyc-rent-challenge">
              <ShieldCheck size={16} /> ตอบถูก ลดค่าเช่า 50% เหลือ {baht(Math.ceil(pendingRent / 2))} บาท
            </div>
          )}
          <p className="tyc-q-text">{q.q}</p>
          <div className="tyc-choices">
            {q.choices.map((ch, i) => {
              const st = picked === null ? '' : i === q.answer ? 'right' : picked === i ? 'wrong' : 'dim';
              return (
                <button
                  key={i}
                  className={`tyc-choice ${st}`}
                  onClick={() => answer(i)}
                  disabled={picked !== null || !canTakeTurn}
                >
                  {ch}
                </button>
              );
            })}
          </div>
          {picked !== null && (
            <div className="puzzle-actions">
              {buyTile !== null && picked === q.answer ? (
                <>
                  <button className="btn-game-start" onClick={() => buy(true)} disabled={!canTakeTurn}>
                    ซื้อ {TYCOON_BOARD[buyTile].property!.emoji} {baht(TYCOON_BOARD[buyTile].property!.price)} บาท
                  </button>
                  <button className="btn-secondary" onClick={() => buy(false)} disabled={!canTakeTurn}>ไม่ซื้อ</button>
                </>
              ) : (
                <button className="btn-game-start" onClick={() => next(ps)} disabled={!canTakeTurn}>ตาถัดไป →</button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="game-tips">
        🧠 <strong>4 ทักษะที่ใช้ในเกมนี้:</strong> {PILLAR_ORDER.map((k) => `${CT_PILLARS[k].emoji} ${CT_PILLARS[k].short}`).join(' · ')}
      </div>
      <TycoonStyles />
    </div>
  );
};

const TycoonStyles: React.FC = () => (
  <style>{`
    .tyc-setup, .tyc-win { max-width: 760px; margin-inline: auto; text-align: center; }
    .tyc-setup h3 { margin: 0 0 8px; font-size: 1.25rem; }
    .tyc-sub { color: #475569; line-height: 1.75; margin: 0 0 16px; }
    .tyc-rules { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 8px; margin-bottom: 18px; }
    .tyc-rules span { padding: 9px 12px; border-radius: 8px; background: #f8fafc; border: 1px solid #e2e8f0; font-size: 0.85rem; font-weight: 600; color: #334155; }
    .tyc-count { display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; font-weight: 700; color: #475569; }
    .tyc-count button { padding: 8px 16px; border-radius: 7px; border: 2px solid #e2e8f0; background: #fff; font-family: inherit; font-weight: 800; cursor: pointer; color: #64748b; }
    .tyc-count button.on { border-color: #f59e0b; background: #fffbeb; color: #b45309; }
    .tyc-lobby { margin: 18px 0; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; background: #f8fafc; text-align: left; }
    .tyc-lobby-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 9px; color: #334155; font-size: 0.82rem; }
    .tyc-lobby-head span { display: inline-flex; align-items: center; gap: 6px; font-weight: 900; }
    .tyc-lobby-head b { color: #15803d; }
    .tyc-team-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; }
    .tyc-team-grid label {
      display: grid; grid-template-columns: 34px minmax(0, 1fr) 20px; align-items: center; gap: 7px;
      min-width: 0; padding: 6px 8px; border-left: 4px solid var(--team); border-radius: 6px;
      background: #fff; box-shadow: 0 1px 3px rgba(15,23,42,0.08); color: #16a34a;
    }
    .tyc-team-grid label > span { font-size: 1.35rem; text-align: center; }
    .tyc-team-grid input {
      min-width: 0; width: 100%; padding: 7px 8px; border: 1px solid #dbe3ea; border-radius: 5px;
      background: #fff; color: #172033; font-family: inherit; font-size: 0.82rem; font-weight: 800;
    }
    .tyc-team-grid input:focus { border-color: var(--team); outline: 2px solid color-mix(in srgb, var(--team) 18%, transparent); }
    .tyc-start { width: 100%; justify-content: center; }

    .tyc-setup { max-width: 1000px; text-align: left; }
    .tyc-win { text-align: center; }
    .tyc-mode-switch {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 5px;
      margin-bottom: 22px;
      padding: 5px;
      border: 1px solid #d6e1e8;
      border-radius: 8px;
      background: #edf4f7;
    }
    .tyc-mode-switch button {
      display: grid;
      grid-template-columns: 32px minmax(0, 1fr);
      grid-template-rows: auto auto;
      align-items: center;
      min-width: 0;
      gap: 1px 8px;
      padding: 11px 14px;
      border: 1px solid transparent;
      border-radius: 6px;
      background: transparent;
      color: #526274;
      text-align: left;
      font-family: inherit;
      cursor: pointer;
      transition: transform 160ms ease, background 160ms ease, color 160ms ease;
    }
    .tyc-mode-switch button svg { grid-row: 1 / 3; }
    .tyc-mode-switch button span { font-size: 0.92rem; font-weight: 900; }
    .tyc-mode-switch button small { overflow: hidden; font-size: 0.68rem; text-overflow: ellipsis; white-space: nowrap; }
    .tyc-mode-switch button.active {
      border-color: #9ed2dc;
      background: #fff;
      color: #075e6d;
      box-shadow: 0 3px 8px rgba(8,76,91,0.1);
    }
    .tyc-mode-switch button:active { transform: scale(0.985); }
    .tyc-setup-heading {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 18px;
      padding: 4px 2px 10px;
      color: #14364a;
    }
    .tyc-setup-heading > svg { color: #078193; }
    .tyc-setup-heading h3 { margin: 4px 0 0; font-size: 1.28rem; }
    .tyc-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: #0f766e;
      font-size: 0.72rem;
      font-weight: 900;
    }
    .tyc-setup-controls {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin: 6px 0 16px;
      padding: 10px 0;
      border-block: 1px solid #e1e8ee;
    }
    .tyc-setup-controls .tyc-count { justify-content: flex-start; margin: 0; }
    .tyc-team-grid label {
      grid-template-columns: 44px minmax(0, 1fr) 20px;
      cursor: pointer;
      transition: border-color 150ms ease, background 150ms ease, transform 150ms ease;
    }
    .tyc-team-grid label.editing {
      background: #effcf9;
      box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--team) 36%, transparent);
      transform: translateY(-1px);
    }
    .tyc-picker-heading {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
      margin: 15px 2px 8px;
      color: #243447;
    }
    .tyc-picker-heading span { font-size: 0.86rem; font-weight: 900; }
    .tyc-picker-heading small { color: #66758a; font-size: 0.68rem; }
    .tyc-character-picker {
      display: grid;
      grid-template-columns: repeat(8, minmax(84px, 1fr));
      gap: 6px;
      overflow-x: auto;
      padding: 2px 2px 8px;
      scrollbar-width: thin;
    }
    .tyc-character-picker > button {
      position: relative;
      display: grid;
      min-width: 84px;
      min-height: 116px;
      grid-template-rows: 68px auto auto;
      justify-items: center;
      align-items: center;
      gap: 1px;
      padding: 5px 4px 7px;
      border: 1px solid #cfdbe3;
      border-bottom-width: 3px;
      border-radius: 7px;
      background: #fff;
      color: #26384b;
      font-family: inherit;
      cursor: pointer;
      transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
    }
    .tyc-character-picker > button:hover:not(:disabled) {
      transform: translateY(-3px);
      border-color: #5fb8c6;
      background: #f0fbfc;
    }
    .tyc-character-picker > button.selected {
      border-color: #078193;
      background: #eafafa;
      box-shadow: inset 0 0 0 2px #fff;
    }
    .tyc-character-picker > button:disabled { cursor: not-allowed; opacity: 0.38; filter: grayscale(0.7); }
    .tyc-character-picker > button > span:not(.tyc-avatar) { font-size: 0.7rem; font-weight: 900; }
    .tyc-character-picker > button > small {
      max-width: 100%;
      overflow: hidden;
      color: #718096;
      font-size: 0.49rem;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .tyc-character-picker > button > svg {
      position: absolute;
      top: 5px;
      right: 5px;
      padding: 2px;
      border-radius: 50%;
      background: #078193;
      color: #fff;
    }

    .tyc-avatar {
      --avatar-size: 48px;
      position: relative;
      display: inline-grid;
      width: var(--avatar-size);
      height: var(--avatar-size);
      flex: 0 0 var(--avatar-size);
      place-items: center;
      overflow: hidden;
      border: 2px solid #fff;
      border-radius: 7px;
      background: color-mix(in srgb, var(--avatar-accent) 12%, #f8fafc);
      box-shadow: 0 3px 7px rgba(29,56,70,0.16);
      vertical-align: middle;
    }
    .tyc-avatar.size-token { --avatar-size: 28px; border-width: 1px; border-radius: 5px; }
    .tyc-avatar.size-small { --avatar-size: 40px; }
    .tyc-avatar.size-medium { --avatar-size: 52px; }
    .tyc-avatar.size-large { --avatar-size: 68px; }
    .tyc-avatar img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: contain;
      image-rendering: pixelated;
      opacity: 0;
      transform-origin: 50% 100%;
      user-select: none;
    }
    .tyc-avatar img:first-child { opacity: 1; }
    .tyc-avatar.active { border-color: var(--avatar-accent); }
    .tyc-avatar.walking img:nth-child(1) { animation: tyc-walk-frame-a 540ms steps(1, end) infinite; }
    .tyc-avatar.walking img:nth-child(2) { animation: tyc-walk-frame-b 540ms steps(1, end) infinite; }
    .tyc-avatar.walking img:nth-child(3) { animation: tyc-walk-frame-c 540ms steps(1, end) infinite; }

    .tyc-online-identity {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      padding-block: 12px;
      border-block: 1px solid #e1e8ee;
    }
    .tyc-online-identity label,
    .tyc-room-actions label {
      display: grid;
      gap: 5px;
      color: #445468;
      font-size: 0.72rem;
      font-weight: 800;
    }
    .tyc-online-identity label > span,
    .tyc-room-actions label > span { display: inline-flex; align-items: center; gap: 5px; }
    .tyc-online-identity input,
    .tyc-room-actions input {
      width: 100%;
      min-width: 0;
      padding: 10px 11px;
      border: 1px solid #cbd7df;
      border-radius: 6px;
      background: #fff;
      color: #1e3347;
      font-family: inherit;
      font-size: 0.84rem;
      font-weight: 700;
    }
    .tyc-online-identity input:focus,
    .tyc-room-actions input:focus { border-color: #078193; outline: 2px solid rgba(7,129,147,0.14); }
    .tyc-room-actions {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 0;
      margin-top: 16px;
      border-block: 1px solid #dbe4ea;
    }
    .tyc-room-actions section { display: grid; align-content: start; gap: 11px; padding: 16px; }
    .tyc-room-actions section + section { border-left: 1px solid #dbe4ea; }
    .tyc-room-section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #164e63;
    }
    .tyc-room-section-title > div { display: grid; }
    .tyc-room-section-title b { font-size: 0.88rem; }
    .tyc-room-section-title small { color: #718096; font-size: 0.64rem; }
    .tyc-room-actions .tyc-count { justify-content: flex-start; margin: 0; }
    .tyc-room-primary,
    .tyc-room-secondary,
    .tyc-ready-actions > button,
    .tyc-start-room {
      display: inline-flex;
      min-height: 43px;
      align-items: center;
      justify-content: center;
      gap: 7px;
      border-radius: 7px;
      font-family: inherit;
      font-weight: 900;
      cursor: pointer;
      transition: transform 150ms ease, background 150ms ease, box-shadow 150ms ease;
    }
    .tyc-room-primary,
    .tyc-start-room {
      border: 1px solid #075e6d;
      border-bottom-width: 4px;
      background: #078193;
      color: #fff;
      box-shadow: 0 4px 9px rgba(7,94,109,0.15);
    }
    .tyc-room-secondary {
      align-self: end;
      border: 1px solid #d36b16;
      border-bottom-width: 4px;
      background: #f59e42;
      color: #4a2a0a;
    }
    .tyc-room-primary:active:not(:disabled),
    .tyc-room-secondary:active:not(:disabled),
    .tyc-ready-actions > button:active:not(:disabled),
    .tyc-start-room:active:not(:disabled) { transform: translateY(2px); border-bottom-width: 2px; }
    .tyc-room-primary:disabled,
    .tyc-room-secondary:disabled,
    .tyc-ready-actions > button:disabled,
    .tyc-start-room:disabled { cursor: not-allowed; opacity: 0.45; }
    .tyc-code-input {
      letter-spacing: 0.22rem;
      text-align: center;
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace !important;
      font-size: 1.15rem !important;
    }
    .tyc-room-loading,
    .tyc-room-error {
      margin-top: 12px;
      padding: 9px 11px;
      border-radius: 6px;
      font-size: 0.76rem;
      font-weight: 800;
      text-align: center;
    }
    .tyc-room-loading { border: 1px solid #a5d8df; background: #ecfeff; color: #155e75; }
    .tyc-room-error { border: 1px solid #f5b4b4; background: #fff1f2; color: #b42318; }
    .tyc-room-lobby > header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 14px;
      padding-bottom: 14px;
      border-bottom: 1px solid #dbe4ea;
    }
    .tyc-room-lobby > header h3 { margin: 6px 0 3px; }
    .tyc-sync {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: #66758a;
      font-size: 0.64rem;
      font-weight: 800;
    }
    .tyc-sync.is-firebase { color: #15803d; }
    .tyc-sync.is-local { color: #b45309; }
    .tyc-room-code {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 0;
      border: 0;
      background: transparent;
      color: #087789;
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
      font-size: 0.78rem;
      font-weight: 900;
      cursor: pointer;
    }
    .tyc-close-room {
      display: grid;
      width: 38px;
      height: 38px;
      flex: 0 0 38px;
      place-items: center;
      border: 1px solid #dbe4ea;
      border-radius: 7px;
      background: #fff;
      color: #64748b;
      cursor: pointer;
    }
    .tyc-room-members {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 7px;
      margin-top: 13px;
    }
    .tyc-room-members > div {
      position: relative;
      display: grid;
      grid-template-columns: 68px minmax(0, 1fr) auto;
      align-items: center;
      min-width: 0;
      min-height: 88px;
      gap: 8px;
      padding: 8px 10px;
      border: 1px solid #dbe4ea;
      border-left: 5px solid var(--team, #94a3b8);
      border-radius: 7px;
      background: #fff;
    }
    .tyc-room-members > div.mine { background: #f0fdfa; }
    .tyc-room-members > div.ready { border-color: #79c6a3; border-left-color: var(--team); }
    .tyc-room-members > div > div { display: grid; min-width: 0; }
    .tyc-room-members b { overflow: hidden; color: #25384b; font-size: 0.82rem; text-overflow: ellipsis; white-space: nowrap; }
    .tyc-room-members span { color: #718096; font-size: 0.62rem; }
    .tyc-room-members small {
      position: absolute;
      top: 5px;
      right: 7px;
      color: #8a5a10;
      font-size: 0.52rem;
      font-weight: 900;
    }
    .tyc-room-members strong { color: #718096; font-size: 0.62rem; }
    .tyc-room-members .ready strong { color: #15803d; }
    .tyc-room-members > div.empty {
      display: flex;
      justify-content: center;
      border-left-color: #dbe4ea;
      border-style: dashed;
      color: #8a99aa;
      background: #f8fafc;
    }
    .tyc-ready-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 14px;
      padding-top: 13px;
      border-top: 1px solid #dbe4ea;
    }
    .tyc-ready-actions > button {
      padding: 9px 16px;
      border: 1px solid #9cadba;
      border-bottom-width: 3px;
      background: #fff;
      color: #34495e;
    }
    .tyc-ready-actions > button.is-ready {
      border-color: #15803d;
      background: #dcfce7;
      color: #166534;
    }
    .tyc-ready-actions .tyc-start-room { padding: 9px 19px; }
    .tyc-wait-host { color: #718096; font-size: 0.72rem; font-weight: 800; }

    .tyc-wrap { display: grid; grid-template-columns: 1fr 250px; gap: 14px; align-items: start; }
    @media (max-width: 900px) { .tyc-wrap { grid-template-columns: 1fr; } }

    /* ---------- เวทีกระดาน: เอียงแบบพอดี ไม่บิดเบี้ยว ---------- */
    .tyc-stage { padding: 6px 0 14px; }
    .tyc-stage.is3d {
      perspective: 2800px; perspective-origin: 50% 42%;
      padding: 26px 18px 34px;
      border-radius: 8px;
      background:
        repeating-linear-gradient(135deg, rgba(15,23,42,0.05) 0 16px, transparent 16px 32px),
        #dbe4e8;
      border: 1px solid #aab8c2;
      box-shadow: inset 0 0 45px rgba(15,23,42,0.2);
    }
    .tyc-stage.is3d .tyc-board {
      transform: rotateX(17deg);
      transform-style: preserve-3d;
      box-shadow: 0 34px 55px rgba(0,0,0,0.55);
    }
    .tyc-stage.is3d .tyc-tile { box-shadow: 0 5px 0 rgba(2,6,23,0.45), 0 8px 12px rgba(0,0,0,0.3); }
    .tyc-stage.is3d .tyc-tokens i { transform: translateZ(24px) scale(1.15); }

    /* ---------- กระดาน ---------- */
    .tyc-board {
      display: grid; grid-template-columns: repeat(8, 1fr); grid-template-rows: repeat(8, 1fr);
      gap: 5px; aspect-ratio: 1; padding: 12px; border-radius: 8px;
      background:
        radial-gradient(ellipse at 50% 45%, #1b3b34 0%, #122622 70%, #0c1a17 100%);
      border: 4px solid #d4a24c;
      box-shadow: 0 18px 34px rgba(0,0,0,0.28);
    }

    /* ---------- ช่องบนกระดาน ---------- */
    .tyc-tile {
      position: relative; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 2px;
      background: #ffffff; border-radius: 6px;
      padding: 3px 2px; overflow: hidden; min-height: 0;
      border: 1px solid rgba(15,23,42,0.10);
    }
    /* แถบสีกลุ่มที่ดิน — หนา สด อ่านจากไกลได้ */
    .tyc-tile.k-property::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0;
      height: 26%; background: var(--g, #94a3b8);
      box-shadow: inset 0 -2px 3px rgba(0,0,0,0.18);
    }
    .tyc-tile.k-start { background: linear-gradient(160deg, #bbf7d0, #86efac); }
    .tyc-tile.k-rest { background: linear-gradient(160deg, #fecdd3, #fda4af); }
    .tyc-tile.k-gotoRest { background: linear-gradient(160deg, #fed7aa, #fdba74); }
    .tyc-tile.k-learn { background: linear-gradient(160deg, #bae6fd, #7dd3fc); }
    .tyc-tile.k-chance { background: linear-gradient(160deg, #fde68a, #fcd34d); }
    .tyc-tile.k-question { background: linear-gradient(160deg, #ddd6fe, #c4b5fd); }

    .tyc-face { font-size: clamp(1rem, 2.3vw, 1.7rem); line-height: 1; position: relative; z-index: 1; margin-top: 12%; }
    .tyc-tile:not(.k-property) .tyc-face { margin-top: 0; }
    .tyc-name {
      position: relative; z-index: 1;
      font-size: clamp(0.44rem, 0.95vw, 0.68rem); font-weight: 800; color: #0f172a;
      text-align: center; line-height: 1.15; padding: 0 1px;
    }
    .tyc-price {
      position: relative; z-index: 1;
      font-size: clamp(0.4rem, 0.85vw, 0.6rem); font-weight: 900; color: #b45309;
      background: #fffbeb; border-radius: 999px; padding: 0 5px;
    }
    .tyc-owner {
      position: absolute; top: 2px; right: 2px; z-index: 2;
      width: 15px; height: 15px; border-radius: 50%; display: grid; place-items: center;
      font-size: 0.6rem; border: 1.5px solid #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.35);
    }
    .tyc-tokens { position: absolute; bottom: 1px; z-index: 3; display: flex; gap: 1px; }
    .tyc-tokens i {
      font-style: normal; font-size: clamp(0.7rem, 1.5vw, 1.15rem);
      filter: drop-shadow(0 2px 2px rgba(0,0,0,0.45));
    }

    /* บ้านของเจ้าของที่ดิน */
    .tyc-house { position: absolute; top: 2px; left: 3px; z-index: 2; display: flex; gap: 1.5px; }
    .tyc-house i {
      width: 6px; height: 6px; border-radius: 1.5px; background: var(--h, #16a34a);
      border: 1px solid rgba(255,255,255,0.9); box-shadow: 0 1px 2px rgba(0,0,0,0.4);
    }
    .tyc-level {
      position: absolute; right: 2px; bottom: 2px; z-index: 4;
      min-width: 18px; padding: 1px 3px; border-radius: 3px;
      background: #172033; color: #fff; font-size: 0.46rem; font-weight: 900;
    }

    /* ---------- กลางกระดาน ---------- */
    .tyc-center {
      grid-row: 2 / 8; grid-column: 2 / 8;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 6px; color: #fff; text-align: center;
    }
    .tyc-logo { font-size: clamp(2.2rem, 8vw, 4.6rem); filter: drop-shadow(0 6px 10px rgba(0,0,0,0.5)); }
    .tyc-center b {
      font-size: clamp(0.85rem, 2.4vw, 1.6rem); letter-spacing: 0.5px;
      background: linear-gradient(180deg, #fde68a, #f59e0b);
      -webkit-background-clip: text; background-clip: text; color: transparent;
      text-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }
    .tyc-center small {
      font-size: clamp(0.55rem, 1.3vw, 0.9rem); color: #a7f3d0;
      background: rgba(0,0,0,0.28); padding: 3px 12px; border-radius: 999px;
    }
    .tyc-live-dice {
      display: grid; grid-template-columns: auto auto; align-items: center; gap: 0 7px;
      min-width: 112px; margin-top: 5px; padding: 7px 12px;
      border: 1px solid rgba(255,255,255,0.22); border-radius: 7px;
      background: rgba(255,255,255,0.1); color: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    .tyc-live-dice svg { grid-row: 1 / 3; color: #facc15; }
    .tyc-live-dice strong { font-size: 1.25rem; line-height: 1; }
    .tyc-live-dice span { color: #bae6fd; font-size: 0.65rem; font-weight: 800; }
    .tyc-live-dice.rolling svg { animation: tyc-dice-spin 520ms ease-in-out infinite; }

    .tyc-side { display: flex; flex-direction: column; gap: 8px; }
    .tyc-p { display: flex; align-items: center; gap: 9px; padding: 9px 11px; border: 2px solid; border-radius: 8px; background: #fff; opacity: 0.6; }
    .tyc-p.active { opacity: 1; box-shadow: 0 4px 14px rgba(15,23,42,0.14); }
    .tyc-p.out { opacity: 0.35; filter: grayscale(1); }
    .tyc-p-tok { font-size: 1.7rem; }
    .tyc-p-info { display: flex; flex-direction: column; min-width: 0; }
    .tyc-p-info b { font-size: 0.83rem; }
    .tyc-money { display: inline-flex; align-items: center; gap: 4px; font-size: 0.86rem; font-weight: 900; color: #16a34a; }
    .tyc-props { display: inline-flex; align-items: center; gap: 3px; font-size: 0.7rem; color: #64748b; font-weight: 600; }
    .tyc-accuracy { margin-top: 3px; padding-top: 3px; border-top: 1px solid #e2e8f0; color: #0f766e; font-size: 0.65rem; font-weight: 800; }

    .tyc-msg { text-align: center; padding: 11px 14px; border-radius: 7px; background: #fffbeb; border: 1px solid #fcd34d; color: #92400e; font-weight: 700; margin: 12px 0; }
    .tyc-dice { font-size: 1.05rem; }
    .tyc-dice:disabled { cursor: wait; opacity: 0.75; }
    .tyc-timer { display: inline-flex; align-items: center; gap: 5px; }
    .tyc-timer.warning { border-color: #ef4444; background: #fef2f2; color: #b91c1c; animation: tyc-time-pulse 1s ease-in-out infinite; }
    .tyc-icon-control { display: grid; width: 38px; min-width: 38px; place-items: center; padding: 0; cursor: pointer; }
    .tyc-dice-stat.rolling { color: #b45309; animation: tyc-time-pulse 480ms ease-in-out infinite; }
    .tyc-stage.is-moving .tyc-tokens i { animation: tyc-token-hop 420ms ease-in-out infinite alternate; }
    .tyc-turn-actions { gap: 8px; flex-wrap: wrap; }
    .tyc-upgrade { display: inline-flex; align-items: center; gap: 6px; border-color: #0284c7; color: #075985; }

    /* ---------- เมืองเทคโนโลยีฉบับใหม่ ---------- */
    .tyc-wrap {
      grid-template-columns: minmax(0, 1fr) minmax(220px, 250px);
      gap: 18px;
    }
    .tyc-stage {
      position: relative;
      isolation: isolate;
      overflow: hidden;
      padding: 22px;
      border: 1px solid #9cc7cf;
      border-radius: 8px;
      background:
        linear-gradient(rgba(255,255,255,0.62), rgba(220,245,247,0.82)),
        repeating-linear-gradient(90deg, transparent 0 31px, rgba(8,145,178,0.10) 31px 32px),
        repeating-linear-gradient(0deg, transparent 0 31px, rgba(8,145,178,0.10) 31px 32px),
        #dff5f4;
      box-shadow: inset 0 0 34px rgba(8,47,73,0.12), 0 12px 30px rgba(15,85,96,0.12);
    }
    .tyc-stage::before,
    .tyc-stage::after {
      content: '';
      position: absolute;
      z-index: -1;
      pointer-events: none;
    }
    .tyc-stage::before {
      inset: 10px;
      border: 2px solid rgba(14,116,144,0.22);
      border-radius: 7px;
      box-shadow: inset 0 0 0 5px rgba(255,255,255,0.42);
    }
    .tyc-stage::after {
      inset: auto 7% 6px;
      height: 18px;
      border-radius: 50%;
      background: rgba(15,23,42,0.18);
      filter: blur(10px);
    }
    .tyc-stage.is3d {
      perspective: 2600px;
      perspective-origin: 50% 40%;
      padding: 28px 24px 40px;
      border-color: #94c5cf;
      background:
        linear-gradient(rgba(240,253,250,0.68), rgba(186,230,253,0.78)),
        repeating-linear-gradient(90deg, transparent 0 31px, rgba(8,145,178,0.10) 31px 32px),
        repeating-linear-gradient(0deg, transparent 0 31px, rgba(8,145,178,0.10) 31px 32px),
        #dff5f4;
      box-shadow: inset 0 0 38px rgba(8,47,73,0.16), 0 14px 36px rgba(15,85,96,0.16);
    }
    .tyc-stage.is3d .tyc-board {
      transform: rotateX(12deg) translateY(-4px);
      box-shadow: 0 16px 0 #075466, 0 29px 42px rgba(5,45,57,0.38);
    }
    .tyc-board {
      position: relative;
      gap: 5px;
      padding: 11px;
      border: 5px solid #f8fdff;
      outline: 3px solid #0f8191;
      border-radius: 8px;
      background: #086271;
      box-shadow: 0 12px 28px rgba(5,45,57,0.28);
      transition: transform 260ms ease, box-shadow 260ms ease;
    }
    .tyc-tile {
      border: 1px solid rgba(15,23,42,0.14);
      border-bottom-width: 3px;
      border-radius: 6px;
      background: #ffffff;
      box-shadow: 0 2px 0 rgba(15,23,42,0.18), 0 4px 8px rgba(15,23,42,0.12);
      transition: transform 150ms ease, box-shadow 150ms ease, filter 150ms ease;
    }
    .tyc-tile:hover {
      z-index: 5;
      transform: translateY(-3px);
      box-shadow: 0 5px 0 rgba(15,23,42,0.17), 0 9px 16px rgba(15,23,42,0.2);
    }
    .tyc-tile.is-owned {
      box-shadow: inset 0 0 0 3px var(--owner), 0 2px 0 rgba(15,23,42,0.18), 0 4px 8px rgba(15,23,42,0.12);
    }
    .tyc-stage.is3d .tyc-tile {
      box-shadow: 0 4px 0 rgba(3,49,58,0.38), 0 7px 10px rgba(3,49,58,0.2);
    }
    .tyc-tile.k-property::before {
      height: 23%;
      border-bottom: 1px solid rgba(15,23,42,0.22);
      box-shadow: inset 0 -3px 5px rgba(15,23,42,0.13);
    }
    .tyc-tile.k-start { background: #d9fbe7; }
    .tyc-tile.k-rest { background: #ffe1e7; }
    .tyc-tile.k-gotoRest { background: #ffdfbd; }
    .tyc-tile.k-learn { background: #d7f3ff; }
    .tyc-tile.k-chance { background: #fff0a8; }
    .tyc-tile.k-question { background: #e8ddff; }
    .tyc-tile.has-player {
      outline: 3px solid #fef08a;
      outline-offset: 1px;
      filter: saturate(1.08);
    }
    .tyc-tile.is-current-position {
      box-shadow: inset 0 0 0 3px var(--owner, transparent), 0 0 0 3px #f59e0b, 0 0 18px rgba(245,158,11,0.82);
      animation: tyc-tile-glow 1.35s ease-in-out infinite;
    }
    .tyc-face {
      display: grid;
      width: 31px;
      height: 31px;
      place-items: center;
      border: 1px solid rgba(255,255,255,0.92);
      border-radius: 7px;
      background: rgba(255,255,255,0.88);
      color: #17364a;
      font-size: 1.28rem;
      box-shadow: 0 3px 0 rgba(15,23,42,0.12), 0 4px 7px rgba(15,23,42,0.12);
      filter: none;
    }
    .tyc-name {
      max-width: 100%;
      display: -webkit-box;
      overflow: hidden;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      font-size: 0.58rem;
      line-height: 1.13;
    }
    .tyc-price {
      font-size: 0.54rem;
      border: 1px solid #fcd34d;
      background: #fff9dc;
    }
    .tyc-owner {
      width: 17px;
      height: 17px;
      border-width: 2px;
      box-shadow: 0 2px 5px rgba(15,23,42,0.32);
    }
    .tyc-house {
      top: 3px;
      left: 4px;
      align-items: end;
      gap: 2px;
    }
    .tyc-house i {
      width: 7px;
      height: 8px;
      border: 1px solid rgba(255,255,255,0.94);
      border-radius: 2px 2px 1px 1px;
      background: var(--h, #16a34a);
      box-shadow: inset 0 -3px 0 rgba(15,23,42,0.16), 0 2px 3px rgba(15,23,42,0.32);
    }
    .tyc-house i:nth-child(2) { height: 11px; }
    .tyc-house i:nth-child(3),
    .tyc-house i:nth-child(4) { height: 14px; }
    .tyc-tokens {
      left: 50%;
      bottom: 1px;
      transform: translateX(-50%);
      gap: 2px;
    }
    .tyc-tokens i {
      display: grid;
      width: 22px;
      height: 22px;
      place-items: center;
      border: 2px solid #fff;
      border-radius: 50%;
      background: rgba(255,255,255,0.94);
      font-size: 0.82rem;
      box-shadow: 0 3px 6px rgba(15,23,42,0.34);
      filter: none;
    }
    .tyc-stage.is3d .tyc-tokens i { transform: translateZ(28px) scale(1.08); }
    .tyc-owner-avatar {
      --avatar-size: 20px !important;
      position: absolute;
      top: 2px;
      right: 2px;
      z-index: 4;
      border-radius: 4px;
    }
    .tyc-tokens .tyc-avatar {
      --avatar-size: 31px;
      border: 2px solid #fff;
      border-radius: 6px;
      box-shadow: 0 4px 7px rgba(15,23,42,0.34);
    }
    .tyc-stage.is3d .tyc-tokens .tyc-avatar { transform: translateZ(28px) scale(1.08); }
    .tyc-stage.is-moving .tyc-tokens .tyc-avatar {
      animation: tyc-avatar-hop 360ms ease-in-out infinite alternate;
    }

    .tyc-center {
      position: relative;
      isolation: isolate;
      overflow: hidden;
      gap: 0;
      border: 2px solid rgba(255,255,255,0.92);
      border-radius: 7px;
      background-image: url('/media/games/tycoon-tech-city.webp');
      background-position: center;
      background-size: cover;
      box-shadow: inset 0 0 0 4px rgba(4,101,116,0.24), inset 0 -18px 30px rgba(5,45,57,0.14);
      transition: background-size 500ms ease;
    }
    .tyc-center::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: -1;
      background: linear-gradient(rgba(255,255,255,0.02), rgba(2,67,82,0.16));
    }
    .tyc-stage.is-moving .tyc-center { background-size: 103%; }
    .tyc-center-hud {
      display: flex;
      width: min(58%, 280px);
      min-width: 190px;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      padding: 8px 12px 10px;
      border: 1px solid rgba(255,255,255,0.62);
      border-radius: 8px;
      background: rgba(4,53,65,0.68);
      box-shadow: 0 9px 24px rgba(2,44,54,0.3);
      backdrop-filter: blur(5px);
    }
    .tyc-logo {
      font-size: 1.8rem;
      line-height: 1;
      filter: drop-shadow(0 4px 7px rgba(0,0,0,0.4));
    }
    .tyc-center b {
      color: #fff4b2;
      background: none;
      font-size: 0.9rem;
      letter-spacing: 0;
      text-shadow: 0 2px 5px rgba(0,0,0,0.42);
    }
    .tyc-center small {
      max-width: 100%;
      padding: 3px 9px;
      border: 1px solid rgba(167,243,208,0.35);
      border-radius: 999px;
      background: rgba(4,120,87,0.5);
      color: #d1fae5;
      font-size: 0.58rem;
    }
    .tyc-live-dice {
      min-width: 94px;
      margin-top: 2px;
      padding: 5px 9px;
      border-color: rgba(255,255,255,0.4);
      background: rgba(255,255,255,0.16);
      box-shadow: none;
    }
    .tyc-center-roll {
      display: inline-flex;
      width: 58px;
      height: 58px;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1px;
      margin-top: 4px;
      border: 3px solid #fff;
      border-radius: 50%;
      background: #ff8a1f;
      color: #fff;
      font-family: inherit;
      font-size: 0.72rem;
      font-weight: 900;
      cursor: pointer;
      box-shadow: 0 7px 0 #c7560a, 0 12px 21px rgba(2,44,54,0.38);
      transition: transform 150ms ease, box-shadow 150ms ease;
    }
    .tyc-center-roll:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 9px 0 #c7560a, 0 15px 24px rgba(2,44,54,0.4);
    }
    .tyc-center-roll:active:not(:disabled) {
      transform: translateY(5px);
      box-shadow: 0 2px 0 #c7560a, 0 6px 12px rgba(2,44,54,0.32);
    }
    .tyc-center-roll:disabled { cursor: wait; opacity: 0.78; }
    .tyc-center-roll:focus-visible { outline: 3px solid #fde047; outline-offset: 3px; }
    .tyc-center-roll:disabled svg { animation: tyc-dice-spin 520ms ease-in-out infinite; }
    .tyc-external-roll { display: none; }

    .tyc-side {
      gap: 9px;
      padding: 3px 0;
    }
    .tyc-p {
      position: relative;
      overflow: hidden;
      min-height: 76px;
      border-width: 1px 1px 1px 6px;
      border-radius: 8px;
      background: #fff;
      box-shadow: 0 4px 12px rgba(15,23,42,0.09);
      opacity: 0.68;
      transition: transform 180ms ease, box-shadow 180ms ease, opacity 180ms ease;
    }
    .tyc-p::after {
      content: '';
      position: absolute;
      top: 10px;
      right: 10px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #cbd5e1;
      box-shadow: 0 0 0 4px #f1f5f9;
    }
    .tyc-p.active {
      transform: translateX(-4px);
      background: #f0fdfa;
      box-shadow: 0 7px 18px rgba(13,148,136,0.18);
    }
    .tyc-p.active::after {
      background: #22c55e;
      box-shadow: 0 0 0 4px #dcfce7;
      animation: tyc-status-pulse 1.2s ease-in-out infinite;
    }
    .tyc-p.waiting::after {
      background: var(--player-color);
      box-shadow: 0 0 0 4px color-mix(in srgb, var(--player-color) 15%, #f8fafc);
      animation: tyc-wait-dot 2s ease-in-out infinite;
    }
    .tyc-p.waiting > .tyc-avatar {
      animation: tyc-wait-breathe 2.3s ease-in-out infinite;
      animation-delay: calc(var(--player-i, 0) * 220ms);
    }
    .tyc-p.is-cheering {
      opacity: 0.9;
      box-shadow:
        0 5px 16px rgba(15,23,42,0.12),
        0 0 15px color-mix(in srgb, var(--player-color) 35%, transparent);
    }
    .tyc-p.is-cheering > .tyc-avatar {
      animation: tyc-wait-cheer 280ms ease-in-out infinite alternate;
    }
    .tyc-player-state {
      display: inline-flex;
      width: fit-content;
      margin: 2px 0 3px;
      padding: 1px 6px;
      border: 1px solid color-mix(in srgb, var(--player-color) 35%, #dbe4ea);
      border-radius: 999px;
      background: color-mix(in srgb, var(--player-color) 9%, #fff);
      color: #64748b;
      font-size: 0.55rem;
      font-weight: 900;
      line-height: 1.45;
    }
    .tyc-player-state.now {
      border-color: #86efac;
      background: #dcfce7;
      color: #166534;
    }
    .tyc-cheer-fx {
      position: absolute;
      right: 1px;
      top: 3px;
      z-index: 3;
      width: 58px;
      height: 58px;
      pointer-events: none;
    }
    .tyc-cheer-fx b {
      position: absolute;
      left: 50%;
      top: 50%;
      z-index: 2;
      color: #92400e;
      font-size: 0.58rem;
      text-shadow: 0 1px 0 #fff;
      transform: translate(-50%, -50%) rotate(-7deg);
      animation: tyc-cheer-label 420ms ease-in-out infinite alternate;
    }
    .tyc-cheer-fx i {
      --cheer-color: #fde047;
      position: absolute;
      left: 50%;
      top: 50%;
      width: 5px;
      height: 12px;
      border-radius: 999px;
      background: var(--cheer-color);
      box-shadow: 0 0 6px var(--cheer-color);
      transform: rotate(calc(var(--fx-i) * 60deg)) translateY(-13px);
      animation: tyc-cheer-particle 560ms ease-out infinite;
      animation-delay: calc(var(--fx-i) * 45ms);
    }
    .tyc-cheer-fx i:nth-of-type(even) { --cheer-color: #22d3ee; }
    .tyc-p-tok {
      display: grid;
      width: 42px;
      height: 42px;
      flex: 0 0 42px;
      place-items: center;
      border: 2px solid #fff;
      border-radius: 50%;
      background: #e0f2fe;
      font-size: 1.5rem;
      box-shadow: 0 3px 8px rgba(15,23,42,0.14);
    }
    .tyc-p > .tyc-avatar {
      background: color-mix(in srgb, var(--avatar-accent) 10%, #e8f5f7);
    }
    .tyc-turn-stat {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .tyc-turn-stat > span { color: #64748b; font-size: 0.7rem; }
    .tyc-online-turn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      margin: 11px 0 0;
      padding: 8px 11px;
      border: 1px solid #bfdbfe;
      border-radius: 7px;
      background: #eff6ff;
      color: #1e40af;
      font-size: 0.76rem;
    }
    .tyc-online-turn span { color: #64748b; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }
    .tyc-online-turn.mine { border-color: #86efac; background: #f0fdf4; color: #166534; }
    .tyc-online-turn:not(.mine) {
      position: relative;
      overflow: hidden;
      background: linear-gradient(105deg, #eff6ff, #ecfeff, #fefce8);
      background-size: 220% 100%;
      animation: tyc-waiting-panel 3s ease-in-out infinite;
    }
    .tyc-online-wait-avatar { --avatar-size: 29px; }
    .tyc-waiting-dots {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      margin-left: 2px;
    }
    .tyc-waiting-dots i {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #0ea5e9;
      animation: tyc-waiting-dot 900ms ease-in-out infinite;
    }
    .tyc-waiting-dots i:nth-child(2) { animation-delay: 130ms; }
    .tyc-waiting-dots i:nth-child(3) { animation-delay: 260ms; }
    @media (max-width: 900px) {
      .tyc-wrap { grid-template-columns: minmax(0, 1fr); }
      .tyc-side { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }

    .tyc-q, .tyc-chance { position: relative; max-width: 680px; margin-inline: auto; overflow: hidden; border-top: 6px solid #f59e0b; text-align: center; }
    .tyc-question-timer { position: relative; height: 27px; margin: -16px -16px 12px; background: #e2e8f0; }
    .tyc-question-timer > span { position: absolute; inset: 0 auto 0 0; background: #22c55e; transition: width 180ms linear; }
    .tyc-question-timer.danger > span { background: #ef4444; }
    .tyc-question-timer b {
      position: absolute; inset: 0; display: inline-flex; align-items: center; justify-content: center; gap: 4px;
      color: #172033; font-size: 0.68rem;
    }
    .tyc-q-tag, .tyc-chance-tag { display: inline-block; padding: 4px 14px; border-radius: 999px; color: #fff; font-size: 0.76rem; font-weight: 800; background: #f59e0b; }
    .tyc-rent-challenge {
      display: flex; align-items: center; justify-content: center; gap: 6px;
      margin: 9px 0 0; padding: 7px 9px; border: 1px solid #67e8f9; border-radius: 6px;
      background: #ecfeff; color: #155e75; font-size: 0.75rem; font-weight: 900;
    }
    .tyc-chance-emoji { font-size: 3rem; margin: 10px 0 4px; }
    .tyc-chance p { font-size: 1.02rem; font-weight: 700; color: #1e293b; line-height: 1.6; }
    .tyc-q-text { font-size: 1.06rem; font-weight: 700; color: #1e293b; line-height: 1.6; margin: 12px 0 14px; }
    .tyc-choices { display: flex; flex-direction: column; gap: 8px; }
    .tyc-choice { padding: 12px 14px; border-radius: 10px; border: 2px solid #e2e8f0; background: #fff; text-align: left; font-family: inherit; font-size: 0.95rem; color: #1f2937; cursor: pointer; }
    .tyc-choice:hover:not(:disabled) { border-color: #fcd34d; background: #fffbeb; }
    .tyc-choice.right { border-color: #22c55e; background: #dcfce7; }
    .tyc-choice.wrong { border-color: #ef4444; background: #fee2e2; }
    .tyc-choice.dim { opacity: 0.5; }

    .tyc-win-emoji { font-size: 3.4rem; }
    .tyc-finish-reason { display: inline-flex; padding: 4px 10px; border-radius: 5px; background: #ecfdf5; color: #166534; font-size: 0.75rem; font-weight: 900; }
    .tyc-rank { display: flex; flex-direction: column; gap: 6px; margin: 14px 0 16px; }
    .tyc-rank div { display: grid; grid-template-columns: auto minmax(110px, 1fr) minmax(120px, auto) auto; align-items: center; gap: 8px; padding: 9px 12px; border-radius: 7px; background: #f8fafc; font-weight: 700; font-size: 0.9rem; text-align: left; }
    .tyc-rank div.out { opacity: 0.5; }
    .tyc-rank small { color: #64748b; font-size: 0.65rem; font-weight: 700; }
    .tyc-rank span { margin-left: auto; color: #16a34a; font-weight: 900; }

    /* ---------- PIXEL ARCADE THEME ---------- */
    .tyc-pixel-game {
      max-width: 1180px;
      overflow: hidden;
      border-right: 5px solid #321264;
      border-left: 5px solid #321264;
      background:
        linear-gradient(rgba(9,42,117,0.2), rgba(16,9,62,0.45)),
        url('/media/games/tycoon-theme/pixel-tech-kingdom.webp') center top / cover fixed;
      box-shadow: 0 0 0 4px #12cfee, 0 0 38px rgba(30,64,175,0.28);
    }
    .tyc-pixel-game .game-topbar {
      gap: 12px;
      padding: 10px 13px;
      border: 4px solid #fff;
      border-radius: 6px;
      background: linear-gradient(180deg, #30206e, #17103f);
      box-shadow: 0 5px 0 #5b21b6, 0 9px 0 #140a35, 0 14px 24px rgba(0,0,0,0.28);
    }
    .tyc-pixel-game .game-topbar h2 {
      color: #ffe866;
      font-size: clamp(1rem, 3vw, 1.5rem);
      font-weight: 1000;
      text-shadow: 0 3px 0 #b44b00, 2px 0 0 #321264, -2px 0 0 #321264;
    }
    .tyc-pixel-game .game-back {
      border: 3px solid #fff;
      border-radius: 4px;
      background: #168dea;
      color: #fff;
      box-shadow: 0 4px 0 #07529f;
      font-weight: 1000;
    }
    .tyc-pixel-game .game-back:hover {
      border-color: #fff7a8;
      color: #fff;
      transform: translateY(-1px);
      box-shadow: 0 5px 0 #07529f;
    }
    .tyc-pixel-game .game-stats {
      position: relative;
      z-index: 3;
      border: 3px solid #fff;
      border-radius: 5px;
      background: linear-gradient(180deg, rgba(81,35,150,0.96), rgba(29,18,81,0.97));
      box-shadow: 0 4px 0 #321264, 0 8px 18px rgba(15,23,42,0.24);
    }
    .tyc-pixel-game .gstat {
      min-height: 31px;
      border: 2px solid #321264;
      border-radius: 4px;
      background: #fff;
      box-shadow: 0 3px 0 #9d88d4;
      color: #241551;
      font-weight: 1000;
    }
    .tyc-pixel-game .gstat strong { color: #ec297b; }
    .tyc-arcade-banner {
      position: relative;
      z-index: 4;
      display: grid;
      grid-template-columns: minmax(120px, 1fr) minmax(280px, 1.65fr) minmax(120px, 1fr);
      align-items: center;
      gap: 14px;
      margin: 0 0 15px;
      padding: 10px 13px 12px;
      border: 4px solid #fff;
      border-radius: 7px;
      background:
        radial-gradient(circle at 50% -20%, rgba(255,255,255,0.28), transparent 42%),
        linear-gradient(180deg, #206bea, #0b2d9c);
      box-shadow:
        0 0 0 4px #321264,
        0 7px 0 #12082f,
        0 13px 23px rgba(0,0,0,0.33);
    }
    .tyc-arcade-banner::before,
    .tyc-arcade-banner::after {
      content: '✦';
      position: absolute;
      top: 9px;
      color: #fff36a;
      font-size: 1.2rem;
      text-shadow: 0 0 8px #fff, 0 3px 0 #dc6f00;
      animation: tyc-arcade-star 1.25s steps(2, end) infinite;
    }
    .tyc-arcade-banner::before { left: 25%; }
    .tyc-arcade-banner::after { right: 25%; animation-delay: 350ms; }
    .tyc-arcade-hearts,
    .tyc-arcade-coins {
      display: inline-flex;
      width: fit-content;
      align-items: center;
      gap: 5px;
      padding: 8px 11px;
      border: 3px solid #fff;
      border-radius: 5px;
      background: #160b44;
      color: #fff;
      box-shadow: 0 4px 0 #321264, inset 0 0 0 2px #4c2c93;
    }
    .tyc-arcade-hearts svg {
      filter: drop-shadow(0 3px 0 #8a1647);
      image-rendering: pixelated;
    }
    .tyc-arcade-coins {
      justify-self: end;
      color: #fff36a;
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
      font-size: 0.9rem;
      font-weight: 1000;
      text-shadow: 0 2px 0 #9a3f00;
    }
    .tyc-arcade-coins svg {
      color: #ffd83d;
      filter: drop-shadow(0 3px 0 #a34100);
    }
    .tyc-arcade-logo {
      display: grid;
      justify-items: center;
      line-height: 1;
      text-align: center;
    }
    .tyc-arcade-logo span {
      margin-bottom: 2px;
      padding: 2px 11px;
      background: #ffdf30;
      color: #4a174f;
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
      font-size: 0.62rem;
      font-weight: 1000;
      box-shadow: 0 3px 0 #9c4800;
      transform: rotate(-1deg);
    }
    .tyc-arcade-logo strong {
      color: #ff48a2;
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
      font-size: clamp(1.55rem, 4vw, 2.65rem);
      font-weight: 1000;
      line-height: 0.98;
      text-shadow:
        0 4px 0 #7a1055,
        3px 0 0 #fff,
        -3px 0 0 #fff,
        0 -3px 0 #fff,
        0 7px 0 #1a0b45;
    }
    .tyc-arcade-logo small {
      margin-top: 8px;
      color: #fff;
      font-size: 0.67rem;
      font-weight: 1000;
      text-shadow: 0 2px 0 #081d65;
    }
    .tyc-pixel-playing .tyc-wrap {
      gap: 16px;
      padding: 14px;
      border: 4px solid #fff;
      border-radius: 7px;
      outline: 5px solid #321264;
      background: rgba(17,9,57,0.88);
      box-shadow: 0 8px 0 #12082f, 0 18px 30px rgba(0,0,0,0.34);
    }
    .tyc-pixel-playing .tyc-stage {
      border: 4px solid #1cf0ff;
      border-radius: 5px;
      background: linear-gradient(135deg, rgba(23,112,217,0.88), rgba(93,30,165,0.9));
      box-shadow: inset 0 0 0 4px #fff, 0 6px 0 #170946;
    }
    .tyc-pixel-playing .tyc-board {
      border: 5px solid #fff;
      border-radius: 4px;
      outline: 5px solid #f3b928;
      background: #160b44;
      box-shadow:
        0 0 0 9px #321264,
        0 13px 0 #14072e,
        0 18px 30px rgba(0,0,0,0.42);
    }
    .tyc-pixel-playing .tyc-tile {
      border: 2px solid #251052;
      border-bottom: 5px solid #12062f;
      border-radius: 3px;
      box-shadow: inset 0 0 0 2px rgba(255,255,255,0.62);
    }
    .tyc-pixel-playing .tyc-tile.is-current-position {
      outline: 3px solid #fff36a;
      box-shadow: 0 0 16px #fff36a, inset 0 0 0 2px #fff;
    }
    .tyc-pixel-playing .tyc-face {
      filter: drop-shadow(0 2px 0 rgba(25,10,62,0.45));
    }
    .tyc-pixel-playing .tyc-name {
      color: #251052;
      font-weight: 1000;
      text-shadow: 0 1px 0 #fff;
    }
    .tyc-pixel-playing .tyc-price {
      border: 1px solid #9a4c00;
      background: #fff2a6;
      color: #8a3c00;
      font-weight: 1000;
      box-shadow: 0 2px 0 #d27d00;
    }
    .tyc-pixel-playing .tyc-center-hud {
      border: 3px solid #fff;
      border-radius: 5px;
      background: linear-gradient(180deg, rgba(94,30,169,0.95), rgba(26,11,72,0.96));
      box-shadow: 0 0 0 4px #321264, 0 7px 0 #13062e, 0 0 25px rgba(255,72,162,0.45);
    }
    .tyc-pixel-playing .tyc-center {
      background-image: url('/media/games/tycoon-theme/pixel-tech-campus.webp');
      background-position: center;
      background-size: cover;
      image-rendering: pixelated;
    }
    .tyc-pixel-playing .tyc-center b {
      color: #fff36a;
      font-weight: 1000;
      text-shadow: 0 2px 0 #8b3f00, 2px 0 0 #321264, -2px 0 0 #321264;
    }
    .tyc-pixel-playing .tyc-center small {
      border-color: #73f4ff;
      background: #0a63b7;
      color: #fff;
    }
    .tyc-pixel-playing .tyc-center-roll,
    .tyc-pixel-game .btn-game-start {
      border: 3px solid #fff;
      border-radius: 5px;
      background: linear-gradient(180deg, #ffdf30, #ff851b);
      color: #421246;
      box-shadow: 0 5px 0 #a53f00, 0 0 0 3px #5b197a;
      font-weight: 1000;
    }
    .tyc-pixel-playing .tyc-center-roll {
      width: 62px;
      height: 62px;
      border-radius: 50%;
      color: #fff;
      text-shadow: 0 2px 0 #9b3d00;
    }
    .tyc-pixel-playing .tyc-side { gap: 11px; }
    .tyc-pixel-playing .tyc-p {
      border: 3px solid #fff;
      border-left: 8px solid var(--player-color);
      border-radius: 5px;
      background: linear-gradient(180deg, #fff, #eef7ff);
      box-shadow:
        0 0 0 3px #321264,
        0 6px 0 #14072e,
        0 10px 18px rgba(0,0,0,0.26);
    }
    .tyc-pixel-playing .tyc-p.active {
      background: linear-gradient(180deg, #fffbd1, #eaffff);
      box-shadow:
        0 0 0 4px #fff36a,
        0 6px 0 #a64600,
        0 0 24px rgba(255,243,106,0.72);
    }
    .tyc-pixel-playing .tyc-player-state {
      border-width: 2px;
      border-radius: 3px;
      box-shadow: 0 2px 0 color-mix(in srgb, var(--player-color) 52%, #321264);
    }
    .tyc-pixel-game .tyc-msg,
    .tyc-pixel-game .tyc-online-turn {
      border: 3px solid #fff;
      border-radius: 5px;
      outline: 3px solid #321264;
      background: linear-gradient(180deg, #fff4ad, #ffd65a);
      color: #4a194c;
      box-shadow: 0 5px 0 #9a4200;
      font-weight: 1000;
    }
    .tyc-pixel-game .tyc-q,
    .tyc-pixel-game .tyc-chance,
    .tyc-pixel-game .tyc-win,
    .tyc-pixel-game .tyc-setup {
      border: 4px solid #fff;
      border-radius: 7px;
      outline: 5px solid #321264;
      background: rgba(255,255,255,0.97);
      box-shadow: 0 8px 0 #14072e, 0 18px 34px rgba(0,0,0,0.3);
    }
    .tyc-pixel-game .tyc-choice {
      border: 3px solid #321264;
      border-radius: 4px;
      box-shadow: 0 4px 0 #b9a4eb;
      font-weight: 800;
    }
    .tyc-pixel-game .tyc-choice:hover:not(:disabled) {
      border-color: #ff42a1;
      background: #fff4ad;
      transform: translateY(-1px);
      box-shadow: 0 5px 0 #9d2568;
    }
    .tyc-pixel-game .tyc-q-tag,
    .tyc-pixel-game .tyc-chance-tag {
      border: 3px solid #fff;
      border-radius: 4px;
      background: linear-gradient(180deg, #ff4ca6, #9f1f85);
      box-shadow: 0 4px 0 #321264;
    }
    .tyc-pixel-setup .tyc-mode-switch button,
    .tyc-pixel-setup .tyc-count button,
    .tyc-pixel-setup .tyc-character-picker > button,
    .tyc-pixel-setup .tyc-ready-actions > button {
      border-width: 3px;
      border-radius: 5px;
      box-shadow: 0 4px 0 #b9a4eb;
    }
    .tyc-pixel-setup .tyc-mode-switch button.active,
    .tyc-pixel-setup .tyc-count button.active,
    .tyc-pixel-setup .tyc-character-picker > button.active {
      border-color: #fff;
      background: linear-gradient(180deg, #fff4ad, #ffcb3d);
      box-shadow: 0 0 0 3px #5a1c89, 0 5px 0 #9b4100;
    }

    /* ---------- เอฟเฟกต์เปิดตัว ทอย และเดิน ---------- */
    .tyc-player-reveal {
      position: fixed;
      inset: 0;
      z-index: 1200;
      display: grid;
      place-content: center;
      gap: 20px;
      overflow: hidden;
      padding: 24px;
      pointer-events: none;
      background:
        radial-gradient(circle at 50% 48%, rgba(34,211,238,0.2), transparent 34%),
        rgba(4,28,35,0.9);
      backdrop-filter: blur(7px);
      animation: tyc-player-reveal-shell 2.15s ease both;
    }
    .tyc-player-reveal-flare {
      position: absolute;
      left: 50%;
      top: 50%;
      width: min(720px, 92vw);
      aspect-ratio: 1;
      border: 2px solid rgba(255,255,255,0.74);
      border-radius: 50%;
      background: repeating-conic-gradient(
        from 4deg,
        rgba(253,224,71,0.24) 0deg 7deg,
        transparent 7deg 18deg
      );
      box-shadow: 0 0 80px rgba(34,211,238,0.35), inset 0 0 90px rgba(253,224,71,0.18);
      transform: translate(-50%, -50%);
      animation: tyc-player-reveal-flare 1.8s cubic-bezier(.14,.78,.25,1) both;
    }
    .tyc-player-reveal-title {
      position: relative;
      z-index: 2;
      display: grid;
      justify-items: center;
      gap: 3px;
      color: #fff;
      text-align: center;
      text-shadow: 0 3px 0 #0f6070, 0 0 20px rgba(34,211,238,0.8);
      animation: tyc-player-reveal-title 1.8s cubic-bezier(.18,.8,.24,1.15) both;
    }
    .tyc-player-reveal-title span {
      color: #fde047;
      font-size: clamp(0.78rem, 2vw, 1rem);
      font-weight: 1000;
    }
    .tyc-player-reveal-title strong {
      font-size: clamp(1.65rem, 5vw, 3rem);
      line-height: 1.08;
    }
    .tyc-player-reveal-cast {
      position: relative;
      z-index: 2;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 14px;
    }
    .tyc-player-reveal-card {
      display: grid;
      width: 118px;
      min-height: 148px;
      place-items: center;
      align-content: center;
      gap: 8px;
      padding: 13px 9px 11px;
      border: 3px solid var(--player-color);
      border-radius: 8px;
      background: rgba(255,255,255,0.96);
      color: #17313b;
      box-shadow:
        0 9px 0 color-mix(in srgb, var(--player-color) 54%, #0f172a),
        0 15px 28px rgba(0,0,0,0.32),
        0 0 24px color-mix(in srgb, var(--player-color) 65%, transparent);
      text-align: center;
      animation: tyc-player-reveal-card 1.65s cubic-bezier(.16,.84,.22,1.2) both;
      animation-delay: calc(120ms + (var(--player-i, 0) * 105ms));
    }
    .tyc-player-reveal-card .tyc-avatar {
      --avatar-size: 82px;
      filter: drop-shadow(0 6px 5px rgba(15,23,42,0.2));
    }
    .tyc-player-reveal-card b {
      width: 100%;
      overflow: hidden;
      font-size: 0.8rem;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .tyc-player-reveal-confetti {
      position: absolute;
      inset: 0;
      z-index: 3;
    }
    .tyc-player-reveal-confetti i {
      --confetti-color: #fde047;
      position: absolute;
      left: calc(6% + (var(--fx-i) * 7.8%));
      top: -24px;
      width: 9px;
      height: 20px;
      border-radius: 2px;
      background: var(--confetti-color);
      box-shadow: 0 0 8px var(--confetti-color);
      animation: tyc-player-reveal-confetti 1.8s cubic-bezier(.14,.72,.3,1) both;
      animation-delay: calc(var(--fx-i) * 45ms);
    }
    .tyc-player-reveal-confetti i:nth-child(3n + 2) { --confetti-color: #22d3ee; }
    .tyc-player-reveal-confetti i:nth-child(3n) { --confetti-color: #fb7185; }
    .tyc-team-grid label {
      animation: tyc-player-card-enter 520ms cubic-bezier(.2,.85,.28,1.18) both;
      animation-delay: calc(var(--team-i, 0) * 90ms);
    }
    .tyc-room-members > div {
      animation: tyc-player-card-enter 560ms cubic-bezier(.2,.85,.28,1.18) both;
      animation-delay: calc(var(--member-i, 0) * 110ms);
    }
    .tyc-room-members > div.ready::after {
      content: '✦';
      position: absolute;
      right: 8px;
      bottom: 6px;
      color: #16a34a;
      font-size: 0.9rem;
      filter: drop-shadow(0 0 5px rgba(34,197,94,0.65));
      animation: tyc-ready-sparkle 1.1s ease-in-out infinite;
    }
    .tyc-board {
      animation: tyc-board-reveal 760ms cubic-bezier(.16,.8,.24,1) both;
    }
    .tyc-board::after {
      content: '';
      position: absolute;
      inset: 7px;
      z-index: 20;
      pointer-events: none;
      border: 3px solid rgba(255,255,255,0.92);
      border-radius: 7px;
      box-shadow: 0 0 24px rgba(250,204,21,0.9), inset 0 0 24px rgba(255,255,255,0.55);
      animation: tyc-board-flash 900ms ease-out both;
    }
    .tyc-tile {
      animation: tyc-tile-enter 420ms cubic-bezier(.15,.82,.3,1.25) both;
      animation-delay: calc(170ms + (var(--tile-i, 0) * 16ms));
    }
    .tyc-stage.is-moving {
      animation: tyc-stage-rumble 170ms ease-in-out infinite alternate;
    }
    .tyc-stage.is-moving .tyc-tile.is-current-position {
      animation: tyc-tile-glow 700ms ease-in-out infinite, tyc-step-tile 360ms ease-out;
    }
    .tyc-roll-fx {
      position: absolute;
      inset: 0;
      z-index: 40;
      overflow: hidden;
      pointer-events: none;
    }
    .tyc-roll-ring,
    .tyc-roll-burst,
    .tyc-flying-dice {
      position: absolute;
      left: 50%;
      top: 50%;
    }
    .tyc-roll-ring {
      width: 84px;
      height: 84px;
      margin: -42px;
      border: 4px solid rgba(255,255,255,0.9);
      border-radius: 50%;
      box-shadow: 0 0 18px #fde047, inset 0 0 14px #22d3ee;
      animation: tyc-roll-ring 620ms ease-out both;
    }
    .tyc-roll-ring.ring-b {
      border-style: dashed;
      border-color: #22d3ee;
      animation-delay: 100ms;
    }
    .tyc-roll-burst {
      width: 1px;
      height: 1px;
    }
    .tyc-roll-burst i {
      --particle-color: #fde047;
      position: absolute;
      width: 8px;
      height: 18px;
      margin: -4px;
      border-radius: 999px;
      background: var(--particle-color);
      box-shadow: 0 0 8px var(--particle-color);
      transform: rotate(calc(var(--fx-i) * 30deg)) translateY(-42px);
      animation: tyc-roll-particle 620ms ease-out both;
      animation-delay: calc(var(--fx-i) * 12ms);
    }
    .tyc-roll-burst i:nth-child(3n + 2) { --particle-color: #22d3ee; }
    .tyc-roll-burst i:nth-child(3n) { --particle-color: #fb7185; }
    .tyc-flying-dice {
      --tx: 110px;
      --ty: -95px;
      --rot: 310deg;
      margin: -20px;
      color: #fff;
      font-size: 2.4rem;
      line-height: 1;
      text-shadow: 0 3px 0 #0f8191, 0 0 14px #fde047;
      animation: tyc-flying-dice 760ms cubic-bezier(.1,.75,.25,1) both;
    }
    .tyc-flying-dice.dice-b {
      --tx: -120px;
      --ty: -65px;
      --rot: -350deg;
      animation-delay: 80ms;
    }
    .tyc-flying-dice.dice-c {
      --tx: 25px;
      --ty: 120px;
      --rot: 390deg;
      animation-delay: 150ms;
    }
    .tyc-step-fx {
      position: absolute;
      left: 50%;
      bottom: 4px;
      z-index: 0;
      width: 1px;
      height: 1px;
      pointer-events: none;
    }
    .tyc-tokens > .tyc-avatar { position: relative; z-index: 2; }
    .tyc-step-fx i {
      position: absolute;
      width: 6px;
      height: 6px;
      border-radius: 2px;
      background: #fde047;
      box-shadow: 0 0 7px #f59e0b;
      transform: rotate(calc(var(--fx-i) * 45deg)) translateY(-8px);
      animation: tyc-step-particle 420ms ease-out both;
    }
    .tyc-step-fx i:nth-child(even) {
      border-radius: 50%;
      background: #67e8f9;
      box-shadow: 0 0 7px #0891b2;
    }
    .tyc-p {
      animation: tyc-side-player-enter 620ms cubic-bezier(.18,.82,.22,1.16) backwards;
      animation-delay: calc(260ms + (var(--player-i, 0) * 120ms));
    }
    .tyc-p.active::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      background: linear-gradient(110deg, transparent 20%, rgba(255,255,255,0.8) 46%, transparent 70%);
      transform: translateX(-120%);
      animation: tyc-player-shine 1.8s ease-in-out infinite;
    }
    .tyc-p > * { position: relative; z-index: 1; }

    @keyframes tyc-dice-spin { 0% { transform: rotate(0) scale(1); } 50% { transform: rotate(140deg) scale(1.22); } 100% { transform: rotate(280deg) scale(1); } }
    @keyframes tyc-arcade-star {
      0%, 100% { opacity: 0.45; transform: rotate(-8deg) scale(0.8); }
      50% { opacity: 1; transform: rotate(8deg) scale(1.15); }
    }
    @keyframes tyc-player-reveal-shell {
      0% { opacity: 0; visibility: visible; }
      9%, 78% { opacity: 1; visibility: visible; }
      100% { opacity: 0; visibility: hidden; }
    }
    @keyframes tyc-player-reveal-flare {
      0% { opacity: 0; transform: translate(-50%, -50%) rotate(-24deg) scale(0.25); }
      35% { opacity: 1; transform: translate(-50%, -50%) rotate(3deg) scale(1); }
      100% { opacity: 0.15; transform: translate(-50%, -50%) rotate(28deg) scale(1.18); }
    }
    @keyframes tyc-player-reveal-title {
      0% { opacity: 0; transform: translateY(-32px) scale(0.75); filter: blur(8px); }
      34%, 78% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
      100% { opacity: 0; transform: translateY(-8px) scale(1.08); }
    }
    @keyframes tyc-player-reveal-card {
      0% { opacity: 0; transform: translateY(90px) rotate(-7deg) scale(0.55); filter: blur(7px); }
      44%, 77% { opacity: 1; transform: translateY(0) rotate(0) scale(1); filter: blur(0); }
      100% { opacity: 0; transform: translateY(-20px) rotate(2deg) scale(1.08); }
    }
    @keyframes tyc-player-reveal-confetti {
      0% { opacity: 0; transform: translateY(-8vh) rotate(0) scale(0.4); }
      12% { opacity: 1; }
      100% { opacity: 0; transform: translateY(108vh) rotate(620deg) scale(1); }
    }
    @keyframes tyc-player-card-enter {
      from { opacity: 0; transform: translateY(18px) scale(0.88); filter: blur(5px); }
      70% { opacity: 1; transform: translateY(-3px) scale(1.025); filter: blur(0); }
      to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
    }
    @keyframes tyc-side-player-enter {
      from { opacity: 0; transform: translateX(32px) rotate(2deg); }
      72% { opacity: 1; transform: translateX(-4px) rotate(-0.5deg); }
      to { opacity: 0.68; transform: translateX(0) rotate(0); }
    }
    @keyframes tyc-board-reveal {
      from { opacity: 0; clip-path: inset(46% round 8px); filter: brightness(1.8) saturate(1.5); }
      68% { opacity: 1; clip-path: inset(0 round 8px); filter: brightness(1.12) saturate(1.15); }
      to { opacity: 1; clip-path: inset(0 round 8px); filter: none; }
    }
    @keyframes tyc-board-flash {
      0% { opacity: 0; transform: scale(0.72); }
      35% { opacity: 1; }
      100% { opacity: 0; transform: scale(1.04); }
    }
    @keyframes tyc-tile-enter {
      from { opacity: 0; transform: scale(0.45) rotate(-5deg); filter: brightness(1.7); }
      72% { opacity: 1; transform: scale(1.08) rotate(1deg); }
      to { opacity: 1; transform: scale(1) rotate(0); filter: none; }
    }
    @keyframes tyc-stage-rumble {
      from { transform: translate(-1px, 0) rotate(-0.08deg); }
      to { transform: translate(1px, -1px) rotate(0.08deg); }
    }
    @keyframes tyc-roll-ring {
      from { opacity: 1; transform: scale(0.25) rotate(0); }
      to { opacity: 0; transform: scale(3.2) rotate(150deg); }
    }
    @keyframes tyc-roll-particle {
      from { opacity: 1; }
      to { opacity: 0; transform: rotate(calc(var(--fx-i) * 30deg)) translateY(-150px) scale(0.15); }
    }
    @keyframes tyc-flying-dice {
      0% { opacity: 0; transform: translate(0, 0) rotate(0) scale(0.35); }
      22% { opacity: 1; transform: translate(0, -18px) rotate(80deg) scale(1.15); }
      100% { opacity: 0; transform: translate(var(--tx), var(--ty)) rotate(var(--rot)) scale(0.45); }
    }
    @keyframes tyc-step-particle {
      from { opacity: 1; }
      to { opacity: 0; transform: rotate(calc(var(--fx-i) * 45deg)) translateY(-25px) scale(0.2); }
    }
    @keyframes tyc-step-tile {
      0% { transform: scale(0.9); }
      55% { transform: scale(1.08); }
      100% { transform: scale(1); }
    }
    @keyframes tyc-ready-sparkle {
      0%, 100% { opacity: 0.45; transform: rotate(-12deg) scale(0.85); }
      50% { opacity: 1; transform: rotate(12deg) scale(1.25); }
    }
    @keyframes tyc-player-shine {
      0%, 28% { transform: translateX(-120%); }
      62%, 100% { transform: translateX(120%); }
    }
    @keyframes tyc-wait-breathe {
      0%, 100% { transform: translateY(0) scale(0.96); filter: saturate(0.82); }
      50% { transform: translateY(-3px) scale(1.02); filter: saturate(1.08); }
    }
    @keyframes tyc-wait-cheer {
      from { transform: translateY(2px) rotate(-3deg) scale(0.98); }
      to { transform: translateY(-6px) rotate(3deg) scale(1.07); }
    }
    @keyframes tyc-wait-dot {
      0%, 100% { opacity: 0.38; transform: scale(0.78); }
      50% { opacity: 1; transform: scale(1.1); }
    }
    @keyframes tyc-cheer-label {
      from { transform: translate(-50%, -50%) rotate(-9deg) scale(0.92); }
      to { transform: translate(-50%, -50%) rotate(7deg) scale(1.08); }
    }
    @keyframes tyc-cheer-particle {
      0% { opacity: 0; transform: rotate(calc(var(--fx-i) * 60deg)) translateY(-8px) scale(0.25); }
      30% { opacity: 1; }
      100% { opacity: 0; transform: rotate(calc(var(--fx-i) * 60deg)) translateY(-27px) scale(0.9); }
    }
    @keyframes tyc-waiting-panel {
      0%, 100% { background-position: 0% 50%; box-shadow: 0 0 0 rgba(14,165,233,0); }
      50% { background-position: 100% 50%; box-shadow: 0 0 16px rgba(14,165,233,0.2); }
    }
    @keyframes tyc-waiting-dot {
      0%, 100% { opacity: 0.32; transform: translateY(1px) scale(0.75); }
      50% { opacity: 1; transform: translateY(-3px) scale(1.08); }
    }
    @keyframes tyc-token-hop { from { transform: translateY(0) scale(1); } to { transform: translateY(-7px) scale(1.16); } }
    @keyframes tyc-avatar-hop {
      from { transform: translateY(0) scale(1.02); }
      to { transform: translateY(-6px) scale(1.08); }
    }
    @keyframes tyc-walk-frame-a {
      0%, 32% { opacity: 1; }
      33%, 100% { opacity: 0; }
    }
    @keyframes tyc-walk-frame-b {
      0%, 32%, 66%, 100% { opacity: 0; }
      33%, 65% { opacity: 1; }
    }
    @keyframes tyc-walk-frame-c {
      0%, 65% { opacity: 0; }
      66%, 100% { opacity: 1; }
    }
    @keyframes tyc-time-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.62; } }
    @keyframes tyc-tile-glow {
      0%, 100% { filter: saturate(1.05) brightness(1); }
      50% { filter: saturate(1.18) brightness(1.08); }
    }
    @keyframes tyc-status-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.3); }
    }
    @media (max-width: 640px) {
      .tyc-pixel-game {
        border-right-width: 2px;
        border-left-width: 2px;
        background-attachment: scroll;
      }
      .tyc-pixel-game .game-topbar {
        padding: 8px;
        border-width: 3px;
      }
      .tyc-arcade-banner {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: 9px;
        padding: 9px;
        border-width: 3px;
      }
      .tyc-arcade-logo {
        grid-row: 1;
        grid-column: 1 / -1;
      }
      .tyc-arcade-logo strong { font-size: 1.45rem; }
      .tyc-arcade-logo small { font-size: 0.56rem; }
      .tyc-arcade-hearts {
        grid-row: 2;
        grid-column: 1;
        gap: 2px;
        padding: 6px 7px;
      }
      .tyc-arcade-hearts svg { width: 20px; height: 20px; }
      .tyc-arcade-coins {
        grid-row: 2;
        grid-column: 2;
        padding: 6px 8px;
        font-size: 0.72rem;
      }
      .tyc-arcade-coins svg { width: 20px; height: 20px; }
      .tyc-arcade-banner::before { left: 8%; }
      .tyc-arcade-banner::after { right: 8%; }
      .tyc-pixel-playing .tyc-wrap {
        padding: 8px;
        border-width: 3px;
        outline-width: 3px;
      }
      .tyc-pixel-playing .tyc-stage { border-width: 3px; }
      .tyc-pixel-playing .tyc-board {
        border-width: 3px;
        outline-width: 3px;
        box-shadow: 0 0 0 5px #321264, 0 8px 0 #14072e;
      }
      .tyc-player-reveal {
        gap: 14px;
        padding: 16px 10px;
      }
      .tyc-player-reveal-cast { gap: 8px; }
      .tyc-player-reveal-card {
        width: 88px;
        min-height: 118px;
        gap: 5px;
        padding: 8px 5px;
        border-width: 2px;
        box-shadow:
          0 6px 0 color-mix(in srgb, var(--player-color) 54%, #0f172a),
          0 11px 20px rgba(0,0,0,0.28),
          0 0 18px color-mix(in srgb, var(--player-color) 60%, transparent);
      }
      .tyc-player-reveal-card .tyc-avatar { --avatar-size: 61px; }
      .tyc-player-reveal-card b { font-size: 0.65rem; }
      .tyc-setup { padding-inline: 12px; }
      .tyc-mode-switch {
        grid-template-columns: 1fr;
        margin-bottom: 16px;
      }
      .tyc-mode-switch button {
        min-height: 58px;
        padding: 9px 11px;
      }
      .tyc-mode-switch button small {
        overflow: visible;
        text-overflow: clip;
        white-space: normal;
      }
      .tyc-setup-heading { gap: 10px; }
      .tyc-setup-heading h3 { font-size: 1.02rem; line-height: 1.4; }
      .tyc-setup-heading > svg { width: 27px; height: 27px; flex: 0 0 27px; }
      .tyc-sub { font-size: 0.8rem; line-height: 1.6; }
      .tyc-rules { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .tyc-rules span { padding: 8px; font-size: 0.68rem; text-align: center; }
      .tyc-setup-controls {
        display: grid;
        gap: 10px;
      }
      .tyc-setup-controls .tyc-count { justify-content: center; }
      .tyc-team-grid { grid-template-columns: 1fr; }
      .tyc-character-picker {
        grid-template-columns: repeat(8, 76px);
        margin-inline: -4px;
        scroll-snap-type: x proximity;
      }
      .tyc-character-picker > button {
        min-width: 76px;
        min-height: 106px;
        grid-template-rows: 59px auto auto;
        scroll-snap-align: start;
      }
      .tyc-avatar.size-large { --avatar-size: 58px; }
      .tyc-online-identity,
      .tyc-room-actions,
      .tyc-room-members {
        grid-template-columns: 1fr;
      }
      .tyc-room-actions section { padding: 14px 2px; }
      .tyc-room-actions section + section {
        border-top: 1px solid #dbe4ea;
        border-left: 0;
      }
      .tyc-room-members > div {
        grid-template-columns: 58px minmax(0, 1fr) auto;
        min-height: 78px;
      }
      .tyc-room-members .tyc-avatar.size-large { --avatar-size: 56px; }
      .tyc-ready-actions {
        align-items: stretch;
        flex-direction: column;
      }
      .tyc-ready-actions > button,
      .tyc-ready-actions .tyc-start-room { width: 100%; }
      .tyc-wait-host { text-align: center; }
      .tyc-rank div { grid-template-columns: auto 1fr auto; }
      .tyc-rank small { grid-column: 2 / -1; }
      .tyc-wrap { grid-template-columns: minmax(0, 1fr); gap: 10px; }
      .tyc-stage { padding: 10px 7px 18px; }
      .tyc-stage.is3d { padding: 14px 7px 24px; perspective: 2200px; }
      .tyc-board { gap: 3px; padding: 6px; border-width: 3px; outline-width: 2px; }
      .tyc-tile { gap: 1px; padding: 1px; border-bottom-width: 2px; }
      .tyc-tile.k-property::before { height: 20%; }
      .tyc-face { margin-top: 8%; font-size: 0.82rem; }
      .tyc-name { font-size: 0.39rem; line-height: 1.05; }
      .tyc-price { padding: 0 2px; font-size: 0.37rem; }
      .tyc-owner { top: 1px; right: 1px; width: 12px; height: 12px; font-size: 0.44rem; border-width: 1px; }
      .tyc-house { top: 1px; left: 2px; gap: 1px; }
      .tyc-house i { width: 4px; height: 5px; border-width: 0.5px; }
      .tyc-house i:nth-child(2) { height: 7px; }
      .tyc-house i:nth-child(3),
      .tyc-house i:nth-child(4) { height: 9px; }
      .tyc-level { right: 1px; bottom: 1px; min-width: 13px; padding: 0 2px; font-size: 0.34rem; }
      .tyc-tokens { gap: 0; }
      .tyc-tokens .tyc-avatar {
        --avatar-size: 19px;
        border-width: 1px;
        border-radius: 4px;
      }
      .tyc-owner-avatar { --avatar-size: 14px !important; }
      .tyc-stage.is3d .tyc-tokens .tyc-avatar { transform: translateZ(18px) scale(1.03); }
      .tyc-center-hud { width: 72%; min-width: 0; gap: 2px; padding: 5px 7px 6px; }
      .tyc-logo { display: none; }
      .tyc-center b { font-size: 0.66rem; line-height: 1.08; }
      .tyc-center small { display: none; }
      .tyc-live-dice { min-width: 78px; margin-top: 0; padding: 3px 5px; }
      .tyc-live-dice svg { width: 16px; height: 16px; }
      .tyc-live-dice strong { font-size: 0.88rem; }
      .tyc-live-dice span { font-size: 0.48rem; }
      .tyc-center-roll { display: none; }
      .tyc-external-roll { display: flex; }
      .tyc-side { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
      .tyc-p { min-height: 66px; gap: 6px; padding: 7px; }
      .tyc-p.active { transform: none; }
      .tyc-p > .tyc-avatar { --avatar-size: 42px; }
      .tyc-p-info b { overflow: hidden; font-size: 0.7rem; text-overflow: ellipsis; white-space: nowrap; }
      .tyc-money { font-size: 0.7rem; }
      .tyc-props, .tyc-accuracy { font-size: 0.55rem; }
    }
    @media (max-width: 420px) {
      .tyc-side { grid-template-columns: 1fr; }
    }
    @media (prefers-reduced-motion: reduce) {
      .tyc-player-reveal { display: none; }
      .tyc-live-dice.rolling svg,
      .tyc-arcade-banner::before,
      .tyc-arcade-banner::after,
      .tyc-stage.is-moving .tyc-tokens i,
      .tyc-timer.warning,
      .tyc-dice-stat.rolling,
      .tyc-tile.is-current-position,
      .tyc-p.active::after,
      .tyc-center-roll:disabled svg,
      .tyc-stage.is-moving .tyc-tokens .tyc-avatar,
      .tyc-avatar.walking img,
      .tyc-team-grid label,
      .tyc-room-members > div,
      .tyc-room-members > div.ready::after,
      .tyc-board,
      .tyc-board::after,
      .tyc-tile,
      .tyc-stage.is-moving,
      .tyc-p,
      .tyc-p.active::before,
      .tyc-p.waiting::after,
      .tyc-p.waiting > .tyc-avatar,
      .tyc-p.is-cheering > .tyc-avatar,
      .tyc-cheer-fx b,
      .tyc-cheer-fx i,
      .tyc-online-turn:not(.mine),
      .tyc-waiting-dots i { animation: none; }
      .tyc-roll-fx,
      .tyc-step-fx,
      .tyc-cheer-fx { display: none; }
    }
  `}</style>
);

export default TycoonGame;
