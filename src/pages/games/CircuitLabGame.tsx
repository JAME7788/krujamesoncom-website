import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BatteryMedium,
  CheckCircle2,
  ChevronLeft,
  CircleHelp,
  Eraser,
  Lightbulb,
  Power,
  RotateCcw,
  Trophy,
  Unplug,
  XCircle,
  Zap,
} from 'lucide-react';
import { useGameProgress } from '../../hooks/useGameProgress';
import './GameStyles.css';
import './CircuitLabGame.css';

type CellKind = '.' | 'P' | 'N' | 'L' | 'S' | 'X';
type Tone = 'info' | 'success' | 'error';

interface CircuitLevel {
  title: string;
  objective: string;
  concept: string;
  rows: string[];
  maxWires: number;
  optimalWires: number;
  hint: string;
}

const LEVELS: CircuitLevel[] = [
  {
    title: 'วงจรปิดดวงแรก',
    objective: 'ต่อขั้วบวกผ่านหลอดไฟ แล้ววนกลับมาที่ขั้วลบ',
    concept: 'กระแสไฟฟ้าไหลได้เมื่อเส้นทางต่อเนื่องเป็นวงจรปิด',
    rows: ['....', 'P..L', 'N...', '....'],
    maxWires: 6,
    optimalWires: 2,
    hint: 'ต่อสายด้านบนจากขั้วบวกไปหาหลอด แล้วต่อใต้หลอดย้อนกลับมาขั้วลบ',
  },
  {
    title: 'ควบคุมด้วยสวิตช์',
    objective: 'ต่อวงจรผ่านหลอดไฟและสวิตช์ แล้วเปิดสวิตช์',
    concept: 'สวิตช์เปิดทำให้วงจรขาด สวิตช์ปิดทำให้กระแสไหลผ่านได้',
    rows: ['.....', 'P...L', '..X..', 'N...S', '.....'],
    maxWires: 8,
    optimalWires: 5,
    hint: 'ต่อด้านบนไปหาหลอด ลงมาที่สวิตช์ แล้วต่อด้านล่างกลับมาขั้วลบ',
  },
  {
    title: 'หลบฉนวน',
    objective: 'วางสายอ้อมช่องฉนวนให้ครบวงจร',
    concept: 'ฉนวนไม่ยอมให้กระแสไฟฟ้าไหลผ่าน จึงต้องเลือกเส้นทางใหม่',
    rows: ['.....', 'P.X.L', '..X..', 'N....', '.....'],
    maxWires: 11,
    optimalWires: 6,
    hint: 'ขึ้นไปอ้อมฉนวนทางแถวบน แล้วต่อจากหลอดกลับขั้วลบทางด้านขวา',
  },
  {
    title: 'หลอดไฟสองดวง',
    objective: 'สร้างเส้นทางที่ผ่านหลอดไฟทั้งสองดวง',
    concept: 'อุปกรณ์หลายชิ้นจะทำงานเมื่ออยู่บนเส้นทางไฟฟ้าที่ต่อเนื่อง',
    rows: ['.....', 'P.L..', '..X.L', 'N....', '.....'],
    maxWires: 8,
    optimalWires: 4,
    hint: 'ต่อผ่านหลอดดวงแรกไปทางขวา ลงผ่านหลอดดวงที่สอง แล้ววนกลับขั้วลบ',
  },
  {
    title: 'สองหลอดหนึ่งสวิตช์',
    objective: 'ให้ไฟผ่านหลอดทั้งสองและสวิตช์ก่อนกลับแบตเตอรี่',
    concept: 'สวิตช์หนึ่งตัวสามารถควบคุมอุปกรณ์หลายชิ้นที่อยู่ในเส้นทางเดียวกัน',
    rows: ['......', 'P.L..L', '..X...', 'N...S.', '......'],
    maxWires: 9,
    optimalWires: 5,
    hint: 'ต่อผ่านหลอดทั้งสองจากซ้ายไปขวา ลงมาที่สวิตช์ แล้วกลับขั้วลบ',
  },
  {
    title: 'ช่างไฟตัวน้อย',
    objective: 'ออกแบบวงจรสมบูรณ์โดยใช้สายอย่างประหยัด',
    concept: 'การออกแบบที่ดีต้องทำงานได้ ปลอดภัย และใช้วัสดุเท่าที่จำเป็น',
    rows: ['......', 'P.X..L', '..X...', '..X.S.', 'N.....', '......'],
    maxWires: 13,
    optimalWires: 8,
    hint: 'เริ่มอ้อมด้านบนไปหาหลอด ลงมาทางขวา ผ่านสวิตช์ แล้วเลี้ยวซ้ายกลับแบตเตอรี่',
  },
  {
    title: 'ไฟส่องทางสองดวง',
    objective: 'เชื่อมหลอดไฟสองดวงและสวิตช์เข้ากับแบตเตอรี่',
    concept: 'วงจรที่มีอุปกรณ์หลายชิ้นต้องมีเส้นทางนำไฟฟ้าต่อถึงกันครบทุกชิ้น',
    rows: ['.......', 'P..L..L', '...X...', 'N..S...', '.......'],
    maxWires: 12,
    optimalWires: 7,
    hint: 'เริ่มจากขั้วบวก เชื่อมหลอดทั้งสอง แล้วลงมาหาสวิตช์ก่อนกลับขั้วลบ',
  },
  {
    title: 'สะพานข้ามฉนวน',
    objective: 'วางสายอ้อมแนวฉนวนเพื่อให้หลอดทั้งสองติด',
    concept: 'เมื่อเส้นทางตรงถูกขวาง ต้องแยกปัญหาเป็นช่วงและหาเส้นทางอ้อมที่สั้นกว่า',
    rows: ['.......', 'P.X..L.', '..X.X..', '..L.XS.', 'N......', '.......'],
    maxWires: 15,
    optimalWires: 8,
    hint: 'ใช้พื้นที่ด้านบนและด้านล่างเป็นทางอ้อม เชื่อมหลอดทั้งสองกับสวิตช์ให้ครบ',
  },
  {
    title: 'สามหลอดหนึ่งวงจร',
    objective: 'ทำให้หลอดไฟทั้งสามดวงติดพร้อมกัน',
    concept: 'เส้นทางสามารถแตกแขนงได้ แต่ทุกแขนงต้องเชื่อมกลับถึงแหล่งกำเนิดไฟฟ้า',
    rows: ['........', 'P.L..L..', '..X.....', 'N...L.S.', '........'],
    maxWires: 14,
    optimalWires: 6,
    hint: 'มองหาจุดเชื่อมกลางที่ต่อไปหาหลอดหลายดวงได้โดยใช้สายร่วมกัน',
  },
  {
    title: 'ภารกิจช่างวงจร',
    objective: 'ออกแบบวงจรผ่านฉนวน หลอดสองดวง และสวิตช์อย่างประหยัด',
    concept: 'การวางแผนก่อนลงมือช่วยลดวัสดุและทำให้ตรวจข้อผิดพลาดได้ง่าย',
    rows: ['........', 'P.X...L.', '..X.X...', 'L...X.S.', 'N.......', '........'],
    maxWires: 16,
    optimalWires: 8,
    hint: 'เชื่อมหลอดด้านซ้ายก่อน ใช้ทางบนไปหลอดขวา แล้วลงสวิตช์และกลับแบตเตอรี่',
  },
];

const keyOf = (x: number, y: number) => `${x},${y}`;

const CircuitLabGame: React.FC = () => {
  const [levelIndex, setLevelIndex] = useState(0);
  const [unlockedLevel, setUnlockedLevel] = useState(0);
  const [wires, setWires] = useState<Set<string>>(() => new Set());
  const [switchOn, setSwitchOn] = useState(false);
  const [powered, setPowered] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [message, setMessage] = useState('แตะช่องว่างเพื่อวางสายไฟให้เป็นวงจรปิด');
  const [tone, setTone] = useState<Tone>('info');
  const [showHint, setShowHint] = useState(false);
  const [levelScores, setLevelScores] = useState<number[]>(() => LEVELS.map(() => 0));
  const recordGame = useGameProgress('circuit-lab', 'ห้องทดลองวงจรไฟฟ้า');

  const level = LEVELS[levelIndex];
  const width = Math.max(...level.rows.map((row) => row.length));
  const totalScore = useMemo(() => levelScores.reduce((sum, score) => sum + score, 0), [levelScores]);
  const completedCount = useMemo(() => levelScores.filter((score) => score > 0).length, [levelScores]);
  const allComplete = completedCount === LEVELS.length;
  const maxScore = LEVELS.length * 30;

  const cellAt = (x: number, y: number): CellKind | ' ' => {
    if (y < 0 || y >= level.rows.length || x < 0 || x >= width) return ' ';
    return (level.rows[y]?.[x] || ' ') as CellKind | ' ';
  };

  const fixedConnectors = (x: number, y: number) => {
    const cell = cellAt(x, y);
    return cell === 'P' || cell === 'N' || cell === 'L' || cell === 'S';
  };

  const hasConnector = (x: number, y: number) => wires.has(keyOf(x, y)) || fixedConnectors(x, y);

  const toggleWire = (x: number, y: number) => {
    if (cellAt(x, y) !== '.') return;
    const key = keyOf(x, y);
    const next = new Set(wires);
    if (next.has(key)) {
      next.delete(key);
    } else {
      if (next.size >= level.maxWires) {
        setTone('error');
        setMessage(`สายไฟหมดแล้ว ด่านนี้ใช้ได้ไม่เกิน ${level.maxWires} เส้น ลองถอดเส้นที่ไม่จำเป็น`);
        return;
      }
      next.add(key);
    }
    setWires(next);
    setPowered(false);
    setTone('info');
    setMessage('จัดเส้นทางให้ผ่านอุปกรณ์ทุกชิ้น แล้วกดตรวจวงจร');
  };

  const validateCircuit = () => {
    let positive: [number, number] | null = null;
    let negative: [number, number] | null = null;
    const bulbs: Array<[number, number]> = [];
    let requiresSwitch = false;

    level.rows.forEach((row, y) => {
      [...row].forEach((cell, x) => {
        if (cell === 'P') positive = [x, y];
        if (cell === 'N') negative = [x, y];
        if (cell === 'L') bulbs.push([x, y]);
        if (cell === 'S') requiresSwitch = true;
      });
    });

    if (!positive || !negative) return false;
    if (requiresSwitch && !switchOn) return false;
    const bulbIndex = new Map(bulbs.map(([x, y], index) => [keyOf(x, y), index]));
    const fullMask = (1 << bulbs.length) - 1;
    const queue: Array<{ x: number; y: number; mask: number; usedSwitch: boolean }> = [
      { x: positive[0], y: positive[1], mask: 0, usedSwitch: false },
    ];
    const visited = new Set<string>();
    const conductive = (x: number, y: number) => {
      const cell = cellAt(x, y);
      if (wires.has(keyOf(x, y))) return true;
      if (cell === 'S') return switchOn;
      return cell === 'P' || cell === 'N' || cell === 'L';
    };

    while (queue.length > 0) {
      const current = queue.shift()!;
      const stateKey = `${current.x},${current.y},${current.mask},${current.usedSwitch ? 1 : 0}`;
      if (visited.has(stateKey)) continue;
      visited.add(stateKey);

      let nextMask = current.mask;
      const bulb = bulbIndex.get(keyOf(current.x, current.y));
      if (bulb !== undefined) nextMask |= 1 << bulb;
      const nextUsedSwitch = current.usedSwitch || cellAt(current.x, current.y) === 'S';

      if (current.x === negative[0] && current.y === negative[1]) {
        if (nextMask === fullMask && (!requiresSwitch || nextUsedSwitch)) return true;
        continue;
      }

      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
        const x = current.x + dx;
        const y = current.y + dy;
        if (conductive(x, y)) queue.push({ x, y, mask: nextMask, usedSwitch: nextUsedSwitch });
      });
    }
    return false;
  };

  const checkCircuit = () => {
    setAttempts((current) => current + 1);
    const hasSwitch = level.rows.some((row) => row.includes('S'));
    if (hasSwitch && !switchOn) {
      setPowered(false);
      setTone('error');
      setMessage('วงจรยังเปิดอยู่ ต้องกดสวิตช์ให้เป็นสีเขียวก่อนตรวจ');
      return;
    }

    if (!validateCircuit()) {
      setPowered(false);
      setTone('error');
      setMessage('กระแสไฟยังไหลไม่ครบวงจร ตรวจดูว่าสายขาดหรือยังไม่ผ่านหลอดไฟ');
      return;
    }

    const efficiencyBonus = Math.max(0, 10 - Math.max(0, wires.size - level.optimalWires) * 2);
    const score = 20 + efficiencyBonus;
    const nextScores = [...levelScores];
    nextScores[levelIndex] = Math.max(nextScores[levelIndex], score);
    setLevelScores(nextScores);
    setPowered(true);
    setTone('success');
    setMessage(
      efficiencyBonus === 10
        ? `วงจรปิดสมบูรณ์ ใช้สายพอดี ได้ ${score}/30 คะแนน`
        : `หลอดไฟติดแล้ว ได้ ${score}/30 คะแนน ลองลดจำนวนสายเพื่อรับคะแนนเต็ม`
    );
    setUnlockedLevel((current) => Math.min(LEVELS.length - 1, Math.max(current, levelIndex + 1)));
    if (nextScores.every((item) => item > 0)) {
      recordGame(nextScores.reduce((sum, item) => sum + item, 0));
    }
  };

  const clearBoard = () => {
    setWires(new Set());
    setPowered(false);
    setSwitchOn(false);
    setTone('info');
    setMessage('ล้างกระดานแล้ว เริ่มวางสายไฟใหม่ได้เลย');
  };

  const goToLevel = (index: number) => {
    if (index > unlockedLevel) return;
    setWires(new Set());
    setSwitchOn(false);
    setPowered(false);
    setAttempts(0);
    setShowHint(false);
    setTone('info');
    setMessage('แตะช่องว่างเพื่อวางสายไฟให้เป็นวงจรปิด');
    setLevelIndex(index);
  };

  const connectorDirections = (x: number, y: number) => {
    const directions = [
      { key: 'right', x: x + 1, y },
      { key: 'left', x: x - 1, y },
      { key: 'down', x, y: y + 1 },
      { key: 'up', x, y: y - 1 },
    ];
    return directions.filter((direction) => hasConnector(direction.x, direction.y)).map((direction) => direction.key);
  };

  const renderCell = (cell: CellKind, x: number, y: number) => {
    const key = keyOf(x, y);
    const isWire = wires.has(key);
    const directions = connectorDirections(x, y);
    const isInteractive = cell === '.' || cell === 'S';
    const label = cell === '.'
      ? (isWire ? 'ถอดสายไฟ' : 'วางสายไฟ')
      : cell === 'S'
        ? (switchOn ? 'เปิดวงจรที่สวิตช์' : 'ปิดวงจรที่สวิตช์')
        : undefined;

    return (
      <button
        key={key}
        type="button"
        className={[
          'circuit-cell',
          `cell-${cell === '.' ? 'empty' : cell.toLowerCase()}`,
          isWire ? 'has-wire' : '',
          powered && (isWire || fixedConnectors(x, y)) ? 'energized' : '',
        ].filter(Boolean).join(' ')}
        onClick={() => {
          if (cell === '.') toggleWire(x, y);
          if (cell === 'S') {
            setSwitchOn((current) => !current);
            setPowered(false);
            setTone('info');
            setMessage('สวิตช์เปลี่ยนสถานะแล้ว กดตรวจวงจรเพื่อทดลอง');
          }
        }}
        disabled={!isInteractive}
        aria-label={label}
      >
        {(isWire || fixedConnectors(x, y)) && (
          <span className="wire-shape" aria-hidden="true">
            <i className="wire-center" />
            {directions.map((direction) => <i key={direction} className={`wire-arm ${direction}`} />)}
          </span>
        )}
        {cell === 'P' && (
          <span className="battery-terminal positive">
            <BatteryMedium size={24} />
            <b>+</b>
            <small>ขั้วบวก</small>
          </span>
        )}
        {cell === 'N' && (
          <span className="battery-terminal negative">
            <BatteryMedium size={24} />
            <b>−</b>
            <small>ขั้วลบ</small>
          </span>
        )}
        {cell === 'L' && (
          <span className={`circuit-bulb${powered ? ' on' : ''}`}>
            <Lightbulb size={31} />
            <small>{powered ? 'ติด' : 'หลอดไฟ'}</small>
          </span>
        )}
        {cell === 'S' && (
          <span className={`circuit-switch${switchOn ? ' on' : ''}`}>
            <Power size={25} />
            <small>{switchOn ? 'ปิดวงจร' : 'เปิดวงจร'}</small>
          </span>
        )}
        {cell === 'X' && (
          <span className="circuit-insulator">
            <Unplug size={24} />
            <small>ฉนวน</small>
          </span>
        )}
        {cell === '.' && !isWire && <span className="wire-placeholder">+</span>}
      </button>
    );
  };

  return (
    <div className="game-page circuit-page">
      <header className="game-topbar circuit-topbar">
        <Link to="/games" className="game-back"><ChevronLeft size={18} /> เกมทั้งหมด</Link>
        <div>
          <h2>ห้องทดลองวงจรไฟฟ้า</h2>
          <p>ออกแบบวงจร ทดลอง และอธิบายเหตุผลที่หลอดไฟติดหรือดับ</p>
        </div>
      </header>

      <div className="circuit-status" aria-label="สถานะเกม">
        <div><Trophy size={18} /> คะแนน <strong>{totalScore}/{maxScore}</strong></div>
        <div><CheckCircle2 size={18} /> ผ่าน <strong>{completedCount}/{LEVELS.length}</strong></div>
        <div><Zap size={18} /> ด่าน <strong>{levelIndex + 1}/{LEVELS.length}</strong></div>
        <div><RotateCcw size={18} /> ทดลอง <strong>{attempts} ครั้ง</strong></div>
      </div>

      <section className="circuit-lab" aria-label={`กระดานวงจรไฟฟ้า ด่าน ${levelIndex + 1}`}>
        <div className="circuit-brief">
          <div>
            <span>ภารกิจ {levelIndex + 1}</span>
            <h3>{level.title}</h3>
            <p>{level.objective}</p>
          </div>
          <div className="circuit-wire-budget">
            <small>สายที่ใช้</small>
            <strong>{wires.size}/{level.maxWires}</strong>
            <span>เป้าหมาย {level.optimalWires} เส้น</span>
          </div>
        </div>

        <div className="circuit-board-wrap">
          <div
            className={`circuit-board${powered ? ' powered' : ''}`}
            style={{ gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))` }}
          >
            {level.rows.flatMap((row, y) => (
              Array.from({ length: width }, (_, x) => renderCell((row[x] || ' ') as CellKind, x, y))
            ))}
          </div>

          <aside className="circuit-guide">
            <h3>อุปกรณ์ในวงจร</h3>
            <dl>
              <div><dt><BatteryMedium size={20} /> แบตเตอรี่</dt><dd>แหล่งพลังงาน มีขั้วบวกและขั้วลบ</dd></div>
              <div><dt><Lightbulb size={20} /> หลอดไฟ</dt><dd>เปลี่ยนพลังงานไฟฟ้าเป็นแสง</dd></div>
              <div><dt><Power size={20} /> สวิตช์</dt><dd>ควบคุมให้วงจรต่อหรือขาด</dd></div>
              <div><dt><Unplug size={20} /> ฉนวน</dt><dd>กระแสไฟฟ้าไหลผ่านไม่ได้</dd></div>
            </dl>
            <div className="circuit-concept">
              <Zap size={19} />
              <p><strong>ความรู้ประจำด่าน</strong>{level.concept}</p>
            </div>
          </aside>
        </div>

        <div className={`circuit-feedback ${tone}`} role="status">
          {tone === 'success' && <CheckCircle2 size={20} />}
          {tone === 'error' && <XCircle size={20} />}
          {tone === 'info' && <CircleHelp size={20} />}
          <span>{message}</span>
        </div>

        <div className="circuit-actions">
          <button type="button" className={`circuit-hint${showHint ? ' active' : ''}`} onClick={() => setShowHint((current) => !current)}>
            <CircleHelp size={18} /> {showHint ? level.hint : 'ขอคำใบ้'}
          </button>
          <button type="button" className="circuit-clear" onClick={clearBoard}>
            <Eraser size={18} /> ล้างสายไฟ
          </button>
          <button type="button" className="circuit-check" onClick={checkCircuit}>
            <Zap size={19} /> ตรวจวงจร
          </button>
        </div>
      </section>

      <nav className="circuit-levels" aria-label="เลือกด่านวงจรไฟฟ้า">
        <div>
          <strong>{LEVELS.length} ภารกิจช่างไฟ</strong>
          <small>ผ่านด่านเพื่อปลดล็อกภารกิจถัดไป</small>
        </div>
        <div className="circuit-level-buttons">
          {LEVELS.map((item, index) => (
            <button
              key={item.title}
              type="button"
              onClick={() => goToLevel(index)}
              disabled={index > unlockedLevel}
              className={`${index === levelIndex ? 'active' : ''}${levelScores[index] > 0 ? ' solved' : ''}`}
            >
              <span>{levelScores[index] > 0 ? <CheckCircle2 size={17} /> : index + 1}</span>
              <b>{item.title}</b>
              {levelScores[index] > 0 && <small>{levelScores[index]}/30</small>}
            </button>
          ))}
        </div>
      </nav>

      {allComplete && (
        <section className="circuit-complete">
          <Lightbulb size={42} />
          <div>
            <h3>ผ่านการฝึกเป็นช่างไฟตัวน้อย</h3>
            <p>คะแนน {totalScore}/{maxScore} ถูกบันทึกเข้าสู่กิจกรรมการเรียนรู้แล้ว</p>
          </div>
          <button type="button" onClick={() => goToLevel(0)}>เล่นใหม่ตั้งแต่ด่านแรก</button>
        </section>
      )}
    </div>
  );
};

export default CircuitLabGame;
