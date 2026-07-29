import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Check,
  ChevronLeft,
  ChevronRight,
  Eraser,
  Hammer,
  Heart,
  Layers,
  LockKeyhole,
  Move,
  Palette,
  Redo2,
  Rocket,
  RotateCcw,
  RotateCw,
  Save,
  Sparkles,
  Trash2,
  Trophy,
  Undo2,
  Wrench,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGameProgress } from '../../hooks/useGameProgress';
import {
  ROBOT_LEVELS,
  ROBOT_PARTS,
  ROBOT_PART_TYPES,
  analyzeRobotBuild,
  countRobotParts,
  partLabel,
  type PlacedRobotPart,
  type RobotBuildAnalysis,
  type RobotPartType,
} from './robotMakerData';
import './GameStyles.css';
import './RobotMakerGame.css';

const PROGRESS_KEY = 'krujames:robot-maker:progress:v1';
const SAVED_DESIGN_KEY = 'krujames:robot-maker:saved-design:v1';
const BOARD_THEME_KEY = 'krujames:robot-maker:board-theme:v1';
const MAX_HISTORY = 30;

type GameMode = 'challenge' | 'free';
type BoardTheme = 'maker' | 'blueprint' | 'space';

type DragState = {
  id: string;
  startClientX: number;
  startClientY: number;
  startX: number;
  startY: number;
  original: PlacedRobotPart[];
  moved: boolean;
};

const clamp = (value: number, min: number, max: number) => (
  Math.min(max, Math.max(min, value))
);

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
};

const isRobotPartType = (value: string): value is RobotPartType => (
  ROBOT_PART_TYPES.includes(value as RobotPartType)
);

const toolGroupClass = (type: RobotPartType) => {
  if (type === 'body' || type === 'head') return 'structure';
  if (type === 'arm' || type === 'leg' || type === 'claw' || type === 'wheel') return 'motion';
  if (type === 'eye' || type === 'meter' || type === 'antenna' || type === 'bulb') return 'signal';
  return 'decor';
};

const RobotPartVisual: React.FC<{ type: RobotPartType }> = ({ type }) => {
  if (type === 'body' || type === 'head') {
    return (
      <span className={`robot-visual cardboard-${type}`}>
        <i className="cardboard-tape" />
        <i className="cardboard-rivet one" />
        <i className="cardboard-rivet two" />
      </span>
    );
  }
  if (type === 'arm' || type === 'leg') {
    return <span className={`robot-visual corrugated-${type}`} />;
  }
  if (type === 'eye') {
    return <span className="robot-visual sensor-eye"><i /></span>;
  }
  if (type.startsWith('cap-')) {
    return <span className={`robot-visual bottle-cap ${type}`}><i /></span>;
  }
  if (type === 'meter') {
    return (
      <span className="robot-visual robot-meter">
        <i className="meter-needle" />
        <b>0</b><b>1</b>
      </span>
    );
  }
  if (type === 'heart') {
    return <span className="robot-visual heart-button"><Heart size={30} fill="currentColor" /></span>;
  }
  if (type === 'antenna') {
    return <span className="robot-visual robot-antenna"><i /><b /></span>;
  }
  if (type === 'bulb') {
    return <span className="robot-visual robot-bulb"><i /><b /></span>;
  }
  if (type === 'claw') {
    return <span className="robot-visual robot-claw"><i /></span>;
  }
  return <span className="robot-visual robot-wheel"><i /></span>;
};

const RobotMakerGame: React.FC = () => {
  const { user } = useAuth();
  const playerStorageId = user?.id || 'guest';
  const progressStorageKey = `${PROGRESS_KEY}:${playerStorageId}`;
  const savedDesignStorageKey = `${SAVED_DESIGN_KEY}:${playerStorageId}`;
  const boardThemeStorageKey = `${BOARD_THEME_KEY}:${playerStorageId}`;
  const recordGame = useGameProgress(
    'robot-maker',
    'นักประดิษฐ์หุ่นยนต์กระดาษ',
    { recordOnce: false },
  );
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const nextPartId = useRef(1);
  const dragState = useRef<DragState | null>(null);

  const [mode, setMode] = useState<GameMode>('challenge');
  const [boardTheme, setBoardTheme] = useState<BoardTheme>(
    () => readJson<BoardTheme>(boardThemeStorageKey, 'maker'),
  );
  const [levelIndex, setLevelIndex] = useState(0);
  const [items, setItems] = useState<PlacedRobotPart[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [past, setPast] = useState<PlacedRobotPart[][]>([]);
  const [future, setFuture] = useState<PlacedRobotPart[][]>([]);
  const [analysis, setAnalysis] = useState<RobotBuildAnalysis | null>(null);
  const [message, setMessage] = useState('เลือกชิ้นส่วนจากกล่องเครื่องมือ แล้วลากจัดตำแหน่งบนโต๊ะทำงาน');
  const [levelStars, setLevelStars] = useState<Record<number, number>>(
    () => readJson<Record<number, number>>(progressStorageKey, {}),
  );

  const level = ROBOT_LEVELS[levelIndex];
  const selectedPart = items.find((item) => item.id === selectedId) || null;
  const requiredCounts = useMemo(() => countRobotParts(level.placements), [level]);
  const actualCounts = useMemo(() => countRobotParts(items), [items]);
  const requiredTypes = ROBOT_PART_TYPES.filter((type) => requiredCounts[type] > 0);
  const completedCount = ROBOT_LEVELS.filter((item) => (levelStars[item.id] || 0) > 0).length;
  const totalStars = Object.values(levelStars).reduce((sum, value) => sum + value, 0);

  useEffect(() => {
    localStorage.setItem(progressStorageKey, JSON.stringify(levelStars));
  }, [levelStars, progressStorageKey]);

  useEffect(() => {
    localStorage.setItem(boardThemeStorageKey, JSON.stringify(boardTheme));
  }, [boardTheme, boardThemeStorageKey]);

  const resetFeedback = () => {
    setAnalysis(null);
    setMessage(
      mode === 'challenge'
        ? 'จัดชิ้นส่วนให้ครบตามรายการ แล้วกดตรวจผลงาน'
        : 'โหมดสร้างอิสระ: ทดลองออกแบบได้เต็มที่ ไม่มีคำตอบผิด',
    );
  };

  const commit = (next: PlacedRobotPart[]) => {
    setPast((current) => [...current.slice(-(MAX_HISTORY - 1)), items]);
    setFuture([]);
    setItems(next);
    setSelectedId((current) => (next.some((part) => part.id === current) ? current : null));
    resetFeedback();
  };

  const makePart = (
    type: RobotPartType,
    coordinates?: { x: number; y: number },
  ): PlacedRobotPart => {
    const sameTypeCount = items.filter((item) => item.type === type).length;
    const target = mode === 'challenge'
      ? level.placements.filter((item) => item.type === type)[sameTypeCount]
      : undefined;
    const fallbackOffset = (items.length % 5) * 3;
    return {
      id: `robot-part-${nextPartId.current++}`,
      type,
      x: clamp(coordinates?.x ?? target?.x ?? 44 + fallbackOffset, 5, 95),
      y: clamp(coordinates?.y ?? target?.y ?? 43 + fallbackOffset, 5, 95),
      rotation: target?.rotation || 0,
      scale: target?.scale || 1,
    };
  };

  const addPart = (type: RobotPartType, coordinates?: { x: number; y: number }) => {
    const part = makePart(type, coordinates);
    commit([...items, part]);
    setSelectedId(part.id);
  };

  const updateSelected = (update: (part: PlacedRobotPart) => PlacedRobotPart) => {
    if (!selectedId) return;
    commit(items.map((part) => (part.id === selectedId ? update(part) : part)));
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    commit(items.filter((part) => part.id !== selectedId));
    setSelectedId(null);
  };

  const bringSelectedToFront = () => {
    if (!selectedId) return;
    const selected = items.find((part) => part.id === selectedId);
    if (!selected) return;
    commit([...items.filter((part) => part.id !== selectedId), selected]);
  };

  const undo = () => {
    const previous = past[past.length - 1];
    if (!previous) return;
    setPast((current) => current.slice(0, -1));
    setFuture((current) => [items, ...current].slice(0, MAX_HISTORY));
    setItems(previous);
    setSelectedId(null);
    resetFeedback();
  };

  const redo = () => {
    const next = future[0];
    if (!next) return;
    setPast((current) => [...current.slice(-(MAX_HISTORY - 1)), items]);
    setFuture((current) => current.slice(1));
    setItems(next);
    setSelectedId(null);
    resetFeedback();
  };

  const clearCanvas = () => {
    if (items.length === 0) return;
    commit([]);
    setSelectedId(null);
  };

  const saveDesign = () => {
    localStorage.setItem(savedDesignStorageKey, JSON.stringify(items));
    setMessage(`บันทึกผลงานแล้ว ${items.length} ชิ้น เปิดกลับมาแก้ไขต่อได้บนเครื่องนี้`);
  };

  const loadSavedDesign = () => {
    const saved = readJson<PlacedRobotPart[]>(savedDesignStorageKey, []);
    if (saved.length === 0) {
      setMessage('ยังไม่มีผลงานที่บันทึกไว้ ลองสร้างหุ่นยนต์แล้วกดบันทึกก่อน');
      return;
    }
    commit(saved);
    setMessage(`เปิดผลงานล่าสุดแล้ว ${saved.length} ชิ้น`);
  };

  const selectLevel = (index: number) => {
    const unlocked = index === 0 || ROBOT_LEVELS.slice(0, index).every(
      (item) => (levelStars[item.id] || 0) > 0,
    );
    if (!unlocked) {
      setMessage(`ผ่านด่าน ${index} ก่อน แล้วด่าน ${index + 1} จะปลดล็อก`);
      return;
    }
    setMode('challenge');
    setLevelIndex(index);
    setItems([]);
    setPast([]);
    setFuture([]);
    setSelectedId(null);
    setAnalysis(null);
    setMessage('อ่านพิมพ์เขียว เลือกชิ้นส่วนให้ครบ แล้วจัดวางเป็นหุ่นยนต์');
  };

  const enterFreePlay = () => {
    setMode('free');
    setItems([]);
    setPast([]);
    setFuture([]);
    setSelectedId(null);
    setAnalysis(null);
    setMessage('โหมดสร้างอิสระ: เลือกชิ้นส่วนใดก็ได้ แล้วออกแบบหุ่นยนต์ของตัวเอง');
  };

  const checkSolution = () => {
    if (mode !== 'challenge') return;
    const result = analyzeRobotBuild(items, level);
    setAnalysis(result);
    if (!result.passed) {
      const missingText = result.missing
        .map((entry) => `${partLabel(entry.type)} ${entry.count}`)
        .join(', ');
      const extraText = result.extra
        .map((entry) => `${partLabel(entry.type)} ${entry.count}`)
        .join(', ');
      setMessage([
        missingText ? `ยังขาด: ${missingText}` : '',
        extraText ? `มีเกิน: ${extraText}` : '',
      ].filter(Boolean).join(' • '));
      return;
    }

    setLevelStars((current) => ({
      ...current,
      [level.id]: Math.max(current[level.id] || 0, result.stars),
    }));
    setMessage(
      `ผ่านด่าน! ชิ้นส่วนครบและวางใกล้พิมพ์เขียว ${result.aligned}/${result.totalRequired} ชิ้น ได้ ${result.score}/100 คะแนน`,
    );
    void recordGame(result.score, `level-${level.id}`);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('robot-part');
    if (!isRobotPartType(type) || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    addPart(type, {
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
  };

  const handlePiecePointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
    part: PlacedRobotPart,
  ) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedId(part.id);
    dragState.current = {
      id: part.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: part.x,
      startY: part.y,
      original: items,
      moved: false,
    };
  };

  const handlePiecePointerMove = (
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    const drag = dragState.current;
    if (!drag || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = clamp(drag.startX + ((event.clientX - drag.startClientX) / rect.width) * 100, 4, 96);
    const y = clamp(drag.startY + ((event.clientY - drag.startClientY) / rect.height) * 100, 4, 96);
    if (Math.abs(x - drag.startX) + Math.abs(y - drag.startY) > 0.4) drag.moved = true;
    setItems((current) => current.map((part) => (
      part.id === drag.id ? { ...part, x, y } : part
    )));
    setAnalysis(null);
  };

  const handlePiecePointerUp = () => {
    const drag = dragState.current;
    if (!drag) return;
    if (drag.moved) {
      setPast((current) => [...current.slice(-(MAX_HISTORY - 1)), drag.original]);
      setFuture([]);
      setMessage('ย้ายชิ้นส่วนแล้ว กดตรวจผลงานเมื่อจัดวางเสร็จ');
    }
    dragState.current = null;
  };

  const handlePieceKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    part: PlacedRobotPart,
  ) => {
    const delta: Record<string, [number, number]> = {
      ArrowUp: [0, -2],
      ArrowDown: [0, 2],
      ArrowLeft: [-2, 0],
      ArrowRight: [2, 0],
    };
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      setSelectedId(part.id);
      commit(items.filter((item) => item.id !== part.id));
      return;
    }
    const move = delta[event.key];
    if (!move) return;
    event.preventDefault();
    setSelectedId(part.id);
    commit(items.map((item) => (
      item.id === part.id
        ? { ...item, x: clamp(item.x + move[0], 4, 96), y: clamp(item.y + move[1], 4, 96) }
        : item
    )));
  };

  return (
    <div className="game-page robot-maker-page">
      <header className="game-topbar robot-maker-topbar">
        <Link to="/games" className="game-back"><ChevronLeft size={18} /> เกมทั้งหมด</Link>
        <div>
          <span className="robot-maker-kicker"><Wrench size={14} /> Design Lab</span>
          <h2>นักประดิษฐ์หุ่นยนต์กระดาษ</h2>
          <p>เลือกวัสดุ วางแผนจากพิมพ์เขียว ประกอบ ทดสอบ และปรับปรุงผลงาน</p>
        </div>
        <div className="robot-mode-switch" role="group" aria-label="โหมดเกม">
          <button
            type="button"
            className={mode === 'challenge' ? 'active' : ''}
            onClick={() => selectLevel(levelIndex)}
          >
            <Trophy size={16} /> ภารกิจ
          </button>
          <button
            type="button"
            className={mode === 'free' ? 'active' : ''}
            onClick={enterFreePlay}
          >
            <Sparkles size={16} /> สร้างอิสระ
          </button>
        </div>
      </header>

      <div className="robot-maker-stats" aria-label="ความก้าวหน้าเกม">
        <span><Trophy size={17} /> ผ่าน <strong>{completedCount}/{ROBOT_LEVELS.length}</strong></span>
        <span>ดาว <strong>{totalStars}/30</strong></span>
        <span><Box size={17} /> บนโต๊ะ <strong>{items.length} ชิ้น</strong></span>
        <span>คะแนน P <strong>บันทึกเมื่อผ่านแต่ละด่าน</strong></span>
      </div>

      {mode === 'challenge' && (
        <nav className="robot-level-strip" aria-label="เลือกด่าน">
          {ROBOT_LEVELS.map((item, index) => {
            const unlocked = index === 0 || ROBOT_LEVELS.slice(0, index).every(
              (previous) => (levelStars[previous.id] || 0) > 0,
            );
            const stars = levelStars[item.id] || 0;
            return (
              <button
                key={item.id}
                type="button"
                className={[
                  index === levelIndex ? 'active' : '',
                  stars > 0 ? 'complete' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => selectLevel(index)}
                aria-label={`ด่าน ${item.id} ${item.title}${unlocked ? '' : ' ล็อกอยู่'}`}
                aria-current={index === levelIndex ? 'step' : undefined}
              >
                {!unlocked ? <LockKeyhole size={13} /> : <b>{item.id}</b>}
                <span>{stars > 0 ? '★'.repeat(stars) : item.title}</span>
              </button>
            );
          })}
        </nav>
      )}

      <main className="robot-maker-shell">
        <aside className="robot-toolbox" aria-label="กล่องเครื่องมือ">
          <div className="robot-panel-heading">
            <span><Box size={18} /></span>
            <div>
              <h3>กล่องเครื่องมือ</h3>
              <p>ลากหรือแตะเพื่อเพิ่ม</p>
            </div>
          </div>
          <div className="robot-tool-grid">
            {ROBOT_PARTS.map((part) => {
              const needed = mode === 'challenge' ? requiredCounts[part.type] : 0;
              const current = actualCounts[part.type];
              return (
                <button
                  key={part.type}
                  type="button"
                  className={[
                    'robot-tool-button',
                    `group-${toolGroupClass(part.type)}`,
                    needed > 0 ? 'needed' : '',
                    needed > 0 && current >= needed ? 'ready' : '',
                  ].filter(Boolean).join(' ')}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData('robot-part', part.type);
                    event.dataTransfer.effectAllowed = 'copy';
                  }}
                  onClick={() => addPart(part.type)}
                  title={`${part.label} — ลากลงโต๊ะหรือแตะเพื่อเพิ่ม`}
                >
                  <span className="robot-tool-preview"><RobotPartVisual type={part.type} /></span>
                  <span className="robot-tool-label">{part.shortLabel}</span>
                  {needed > 0 && <small>{current}/{needed}</small>}
                </button>
              );
            })}
          </div>
        </aside>

        <section className="robot-workbench" aria-label="โต๊ะประกอบหุ่นยนต์">
          <div className="robot-selection-toolbar" aria-label="เครื่องมือแก้ไขชิ้นส่วน">
            {selectedPart ? (
              <>
                <strong><Move size={15} /> {partLabel(selectedPart.type)}</strong>
                <span className="robot-toolbar-divider" />
                <button
                  type="button"
                  onClick={() => updateSelected((part) => ({ ...part, rotation: (part.rotation || 0) - 15 }))}
                  aria-label="หมุนซ้าย"
                  title="หมุนซ้าย 15 องศา"
                ><RotateCcw size={18} /></button>
                <button
                  type="button"
                  onClick={() => updateSelected((part) => ({ ...part, rotation: (part.rotation || 0) + 15 }))}
                  aria-label="หมุนขวา"
                  title="หมุนขวา 15 องศา"
                ><RotateCw size={18} /></button>
                <button
                  type="button"
                  onClick={() => updateSelected((part) => ({ ...part, scale: clamp((part.scale || 1) - 0.1, 0.6, 1.7) }))}
                  aria-label="ย่อชิ้นส่วน"
                  title="ย่อชิ้นส่วน"
                ><ZoomOut size={18} /></button>
                <button
                  type="button"
                  onClick={() => updateSelected((part) => ({ ...part, scale: clamp((part.scale || 1) + 0.1, 0.6, 1.7) }))}
                  aria-label="ขยายชิ้นส่วน"
                  title="ขยายชิ้นส่วน"
                ><ZoomIn size={18} /></button>
                <button
                  type="button"
                  onClick={bringSelectedToFront}
                  aria-label="นำชิ้นส่วนขึ้นด้านหน้า"
                  title="นำขึ้นด้านหน้า"
                ><Layers size={18} /></button>
                <button
                  type="button"
                  className="danger"
                  onClick={deleteSelected}
                  aria-label="ลบชิ้นส่วน"
                  title="ลบชิ้นส่วน"
                ><Trash2 size={18} /></button>
              </>
            ) : (
              <span><Move size={16} /> แตะชิ้นส่วนบนโต๊ะเพื่อย้าย หมุน หรือปรับขนาด</span>
            )}
            <div className="robot-board-theme-switch" role="group" aria-label="ธีมกระดาน">
              <span><Palette size={15} /> ธีม</span>
              <button
                type="button"
                className={boardTheme === 'maker' ? 'active' : ''}
                onClick={() => setBoardTheme('maker')}
                aria-label="ธีมห้องประดิษฐ์"
                title="ห้องประดิษฐ์"
              ><Hammer size={17} /></button>
              <button
                type="button"
                className={boardTheme === 'blueprint' ? 'active' : ''}
                onClick={() => setBoardTheme('blueprint')}
                aria-label="ธีมพิมพ์เขียว"
                title="พิมพ์เขียว"
              ><Layers size={17} /></button>
              <button
                type="button"
                className={boardTheme === 'space' ? 'active' : ''}
                onClick={() => setBoardTheme('space')}
                aria-label="ธีมห้องทดลองอวกาศ"
                title="ห้องทดลองอวกาศ"
              ><Rocket size={17} /></button>
            </div>
          </div>

          <div
            ref={canvasRef}
            className={[
              'robot-canvas',
              `theme-${boardTheme}`,
              analysis?.passed ? 'is-complete' : '',
            ].filter(Boolean).join(' ')}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = 'copy';
            }}
            onDrop={handleDrop}
            onPointerDown={(event) => {
              if (event.target === event.currentTarget) setSelectedId(null);
            }}
            aria-label="พื้นที่ประกอบหุ่นยนต์"
          >
            <div className="robot-board-decor" aria-hidden="true">
              <i className="robot-board-bolt bolt-top-left" />
              <i className="robot-board-bolt bolt-top-right" />
              <i className="robot-board-bolt bolt-bottom-left" />
              <i className="robot-board-bolt bolt-bottom-right" />
              <span className="robot-board-plate">
                <Wrench size={13} />
                <b>KJ MAKER LAB</b>
                <small>{mode === 'challenge' ? `STATION ${level.id}` : 'CREATIVE BAY'}</small>
              </span>
              <span className="robot-board-lights">
                <i />
                <i />
                <i />
              </span>
              <span className="robot-board-ruler ruler-horizontal" />
              <span className="robot-board-ruler ruler-vertical" />
              <span className="robot-material-rack">
                <i className="material-cardboard" />
                <i className="material-metal" />
                <i className="material-plastic" />
                <i className="material-wire" />
              </span>
              <span className="robot-work-mat" />
            </div>
            <div className="robot-canvas-label"><span>DESIGN GRID</span><b>{mode === 'challenge' ? `LEVEL ${level.id}` : 'FREE PLAY'}</b></div>
            {items.length === 0 && (
              <div className="robot-empty-state">
                <Wrench size={34} />
                <strong>เริ่มสร้างหุ่นยนต์</strong>
                <span>ลากชิ้นส่วนจากด้านซ้าย หรือแตะชิ้นส่วนเพื่อเพิ่มอัตโนมัติ</span>
              </div>
            )}
            {items.map((part) => (
              <button
                key={part.id}
                type="button"
                className={`placed-robot-part${selectedId === part.id ? ' selected' : ''}`}
                style={{
                  left: `${part.x}%`,
                  top: `${part.y}%`,
                  transform: `translate(-50%, -50%) rotate(${part.rotation || 0}deg) scale(${part.scale || 1})`,
                }}
                onPointerDown={(event) => handlePiecePointerDown(event, part)}
                onPointerMove={handlePiecePointerMove}
                onPointerUp={handlePiecePointerUp}
                onPointerCancel={handlePiecePointerUp}
                onKeyDown={(event) => handlePieceKeyDown(event, part)}
                aria-label={`${partLabel(part.type)} เลือกแล้วใช้ปุ่มลูกศรเพื่อย้าย`}
                title={`${partLabel(part.type)} — ลากเพื่อย้าย`}
              >
                <RobotPartVisual type={part.type} />
              </button>
            ))}
          </div>

          <div className="robot-workbench-actions">
            <button type="button" onClick={undo} disabled={past.length === 0} title="ย้อนกลับ">
              <Undo2 size={17} /> ย้อนกลับ
            </button>
            <button type="button" onClick={redo} disabled={future.length === 0} title="ทำซ้ำ">
              <Redo2 size={17} /> ทำซ้ำ
            </button>
            <button type="button" onClick={clearCanvas} disabled={items.length === 0}>
              <Eraser size={17} /> ล้างโต๊ะ
            </button>
            <button type="button" className="save" onClick={saveDesign} disabled={items.length === 0}>
              <Save size={17} /> บันทึกผลงาน
            </button>
          </div>
        </section>

        <aside className="robot-mission-panel" aria-label="ภารกิจและพิมพ์เขียว">
          {mode === 'challenge' ? (
            <>
              <div className="robot-mission-title">
                <span>ภารกิจ {level.id}</span>
                <h3>{level.title}</h3>
                <p>{level.objective}</p>
              </div>

              <section className="robot-blueprint">
                <div className="robot-subheading">
                  <strong>พิมพ์เขียว</strong>
                  <span>{level.placements.length} ชิ้น</span>
                </div>
                <div className="robot-blueprint-canvas" aria-label={`ตัวอย่าง ${level.title}`}>
                  {level.placements.map((part, index) => (
                    <span
                      key={`${part.type}-${index}`}
                      className="blueprint-robot-part"
                      style={{
                        left: `${part.x}%`,
                        top: `${part.y}%`,
                        transform: `translate(-50%, -50%) rotate(${part.rotation || 0}deg) scale(${(part.scale || 1) * 0.72})`,
                      }}
                    >
                      <RobotPartVisual type={part.type} />
                    </span>
                  ))}
                </div>
              </section>

              <section className="robot-requirements">
                <div className="robot-subheading">
                  <strong>ชิ้นส่วนที่ต้องใช้</strong>
                  <span>{requiredTypes.length} แบบ</span>
                </div>
                <ul>
                  {requiredTypes.map((type) => {
                    const ready = actualCounts[type] === requiredCounts[type];
                    const over = actualCounts[type] > requiredCounts[type];
                    return (
                      <li key={type} className={ready ? 'ready' : over ? 'over' : ''}>
                        <span className="requirement-preview"><RobotPartVisual type={type} /></span>
                        <span>{partLabel(type)}</span>
                        <strong>{actualCounts[type]}/{requiredCounts[type]}</strong>
                        {ready && <Check size={14} />}
                      </li>
                    );
                  })}
                </ul>
              </section>

              <div className={`robot-feedback ${analysis?.passed ? 'success' : analysis ? 'error' : ''}`} role="status">
                {message}
              </div>

              <button
                type="button"
                className="robot-check-button"
                onClick={checkSolution}
                disabled={items.length === 0}
              >
                <Check size={20} /> ตรวจผลงาน
              </button>

              {analysis?.passed && (
                <div className="robot-win-actions">
                  <div>
                    <b>{'★'.repeat(analysis.stars)}</b>
                    <span>{analysis.score}/100 คะแนน</span>
                  </div>
                  {levelIndex < ROBOT_LEVELS.length - 1 && (
                    <button type="button" onClick={() => selectLevel(levelIndex + 1)}>
                      ด่านถัดไป <ChevronRight size={16} />
                    </button>
                  )}
                </div>
              )}

              <div className="robot-learning-focus">
                <strong>สิ่งที่กำลังฝึก</strong>
                <p>{level.focus}</p>
              </div>
            </>
          ) : (
            <div className="robot-free-panel">
              <Sparkles size={34} />
              <h3>ห้องทดลองอิสระ</h3>
              <p>ผสมชิ้นส่วนได้ตามจินตนาการ ทดลองหมุน ย่อ ขยาย และวางซ้อนกันโดยไม่มีคำตอบผิด</p>
              <dl>
                <div><dt>ชิ้นส่วนบนโต๊ะ</dt><dd>{items.length}</dd></div>
                <div><dt>ชนิดที่ใช้</dt><dd>{ROBOT_PART_TYPES.filter((type) => actualCounts[type] > 0).length}</dd></div>
              </dl>
              <button type="button" onClick={loadSavedDesign}><Save size={16} /> เปิดผลงานล่าสุด</button>
              <button type="button" onClick={() => selectLevel(levelIndex)}><Trophy size={16} /> กลับไปทำภารกิจ</button>
              <div className="robot-feedback" role="status">{message}</div>
            </div>
          )}
        </aside>
      </main>

      <div className="game-tips robot-maker-tip">
        <strong>กระบวนการออกแบบ:</strong> ระบุปัญหา → วางแผนจากพิมพ์เขียว → เลือกวัสดุ → สร้างต้นแบบ → ทดสอบ → ปรับปรุง
      </div>
    </div>
  );
};

export default RobotMakerGame;
