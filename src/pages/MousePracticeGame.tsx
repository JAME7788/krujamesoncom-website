import React, { useMemo, useState } from 'react';
import { CheckCircle2, MousePointerClick, Move, RotateCcw, Trophy } from 'lucide-react';
import './MousePracticeGame.css';

type DragItem = {
  id: string;
  label: string;
  color: string;
};

const clickPositions = [
  { left: 18, top: 26 },
  { left: 72, top: 20 },
  { left: 58, top: 64 },
  { left: 28, top: 70 },
  { left: 82, top: 48 },
];

const doublePositions = [
  { left: 25, top: 34 },
  { left: 70, top: 32 },
  { left: 47, top: 68 },
];

const dragItems: DragItem[] = [
  { id: 'red', label: 'สีแดง', color: '#ef4444' },
  { id: 'blue', label: 'สีฟ้า', color: '#2563eb' },
  { id: 'yellow', label: 'สีเหลือง', color: '#facc15' },
];

const MousePracticeGame: React.FC = () => {
  const [stage, setStage] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  const [doubleCount, setDoubleCount] = useState(0);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [matched, setMatched] = useState<Record<string, boolean>>({});

  const dragDone = useMemo(
    () => dragItems.every((item) => matched[item.id]),
    [matched]
  );
  const progress = stage === 0
    ? clickCount / clickPositions.length
    : stage === 1
      ? doubleCount / doublePositions.length
      : stage === 2
        ? Object.keys(matched).length / dragItems.length
        : 1;

  const resetGame = () => {
    setStage(0);
    setClickCount(0);
    setDoubleCount(0);
    setDraggedId(null);
    setMatched({});
  };

  const nextStage = () => {
    setStage((current) => Math.min(3, current + 1));
  };

  const handleClickTarget = () => {
    const next = clickCount + 1;
    setClickCount(next);
    if (next >= clickPositions.length) nextStage();
  };

  const handleDoubleTarget = () => {
    const next = doubleCount + 1;
    setDoubleCount(next);
    if (next >= doublePositions.length) nextStage();
  };

  const handleDrop = (targetId: string) => {
    if (!draggedId) return;
    if (draggedId === targetId) {
      const nextMatched = { ...matched, [targetId]: true };
      setMatched(nextMatched);
      if (dragItems.every((item) => nextMatched[item.id])) {
        setStage(3);
      }
    }
    setDraggedId(null);
  };

  return (
    <div className="mouse-game-page page-transition">
      <main className="mouse-game-shell">
        <section className="mouse-game-top">
          <div>
            <span className="mouse-game-kicker">ป.1 ฝึกใช้เมาส์</span>
            <h1>เกมภารกิจเมาส์แม่นยำ</h1>
            <p>ฝึกคลิก ดับเบิลคลิก และลากวาง ให้พร้อมใช้คอมพิวเตอร์ในห้องเรียน</p>
          </div>
          <button className="mouse-reset-btn" onClick={resetGame}>
            <RotateCcw size={18} />
            เริ่มใหม่
          </button>
        </section>

        <section className="mouse-status-panel">
          <div className="mouse-status-item">
            <MousePointerClick size={20} />
            <div>
              <strong>ระดับ {Math.min(stage + 1, 4)} จาก 4</strong>
              <span>{stage === 0 ? 'คลิกเป้าหมาย' : stage === 1 ? 'ดับเบิลคลิก' : stage === 2 ? 'ลากวางสี' : 'สรุปผล'}</span>
            </div>
          </div>
          <div className="mouse-progress-track" aria-label="ความคืบหน้า">
            <div style={{ width: `${Math.max(8, progress * 100)}%` }} />
          </div>
        </section>

        <section className="mouse-game-board" aria-live="polite">
          {stage === 0 && (
            <div className="mouse-stage">
              <div className="mouse-stage-title">
                <Move size={24} />
                <div>
                  <h2>ภารกิจที่ 1: คลิกให้ตรงจุด</h2>
                  <p>เลื่อนเมาส์ไปที่เป้าหมาย แล้วคลิกให้ครบ {clickPositions.length} ครั้ง</p>
                </div>
              </div>
              <div className="target-field">
                <button
                  className="click-target"
                  style={{
                    left: `${clickPositions[clickCount]?.left ?? 50}%`,
                    top: `${clickPositions[clickCount]?.top ?? 50}%`,
                  }}
                  onClick={handleClickTarget}
                >
                  คลิก
                </button>
              </div>
              <p className="mouse-counter">ทำได้ {clickCount} / {clickPositions.length}</p>
            </div>
          )}

          {stage === 1 && (
            <div className="mouse-stage">
              <div className="mouse-stage-title">
                <MousePointerClick size={24} />
                <div>
                  <h2>ภารกิจที่ 2: ดับเบิลคลิก</h2>
                  <p>คลิกเร็ว ๆ สองครั้งบนวงกลม ให้ครบ {doublePositions.length} จุด</p>
                </div>
              </div>
              <div className="target-field">
                <button
                  className="double-target"
                  style={{
                    left: `${doublePositions[doubleCount]?.left ?? 50}%`,
                    top: `${doublePositions[doubleCount]?.top ?? 50}%`,
                  }}
                  onDoubleClick={handleDoubleTarget}
                >
                  2 คลิก
                </button>
              </div>
              <p className="mouse-counter">ทำได้ {doubleCount} / {doublePositions.length}</p>
            </div>
          )}

          {stage === 2 && (
            <div className="mouse-stage">
              <div className="mouse-stage-title">
                <Move size={24} />
                <div>
                  <h2>ภารกิจที่ 3: ลากสีไปวางให้ตรงช่อง</h2>
                  <p>กดเมาส์ค้าง ลากแผ่นสี แล้วปล่อยในช่องสีเดียวกัน</p>
                </div>
              </div>

              <div className="drag-practice-area">
                <div className="drag-source-list">
                  {dragItems.map((item) => (
                    <button
                      key={item.id}
                      className={`drag-chip ${matched[item.id] ? 'matched' : ''}`}
                      draggable={!matched[item.id]}
                      onDragStart={() => setDraggedId(item.id)}
                      onDragEnd={() => setDraggedId(null)}
                      style={{ '--chip-color': item.color } as React.CSSProperties}
                      disabled={matched[item.id]}
                    >
                      {matched[item.id] ? <CheckCircle2 size={18} /> : null}
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="drop-zone-list">
                  {dragItems.map((item) => (
                    <div
                      key={item.id}
                      className={`drop-zone ${matched[item.id] ? 'filled' : ''}`}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => handleDrop(item.id)}
                      style={{ '--zone-color': item.color } as React.CSSProperties}
                    >
                      {matched[item.id] ? 'ถูกต้อง' : `วาง ${item.label}`}
                    </div>
                  ))}
                </div>
              </div>
              <p className="mouse-counter">จับคู่ได้ {Object.keys(matched).length} / {dragItems.length}</p>
              {dragDone ? <button className="mouse-next-btn" onClick={nextStage}>ดูผลสำเร็จ</button> : null}
            </div>
          )}

          {stage === 3 && (
            <div className="mouse-complete">
              <Trophy size={64} />
              <h2>เก่งมาก ภารกิจเมาส์สำเร็จแล้ว</h2>
              <p>นักเรียนฝึกครบทั้งการคลิก ดับเบิลคลิก และลากวาง พร้อมเริ่มใช้งานคอมพิวเตอร์มากขึ้นแล้ว</p>
              <button className="mouse-next-btn" onClick={resetGame}>เล่นอีกครั้ง</button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default MousePracticeGame;
