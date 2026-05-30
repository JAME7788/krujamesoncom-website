import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Keyboard, RotateCcw, Trophy } from 'lucide-react';
import './KeyboardPracticeGame.css';

type PracticeKey = {
  code: string;
  label: string;
  hint: string;
};

const keyTargets: PracticeKey[] = [
  { code: 'Space', label: 'Spacebar', hint: 'เว้นวรรคระหว่างคำ' },
  { code: 'Enter', label: 'Enter', hint: 'รับคำสั่งหรือขึ้นบรรทัดใหม่' },
  { code: 'Backspace', label: 'Backspace', hint: 'ลบตัวอักษรด้านซ้าย' },
  { code: 'KeyA', label: 'A', hint: 'แป้นตัวอักษร' },
  { code: 'KeyS', label: 'S', hint: 'แป้นตัวอักษร' },
  { code: 'Digit1', label: '1', hint: 'แป้นตัวเลข' },
];

const keyboardRows: PracticeKey[][] = [
  [
    { code: 'Digit1', label: '1', hint: 'ตัวเลข' },
    { code: 'Digit2', label: '2', hint: 'ตัวเลข' },
    { code: 'Digit3', label: '3', hint: 'ตัวเลข' },
    { code: 'Backspace', label: 'Backspace', hint: 'ลบตัวอักษร' },
  ],
  [
    { code: 'KeyQ', label: 'Q', hint: 'ตัวอักษร' },
    { code: 'KeyW', label: 'W', hint: 'ตัวอักษร' },
    { code: 'KeyE', label: 'E', hint: 'ตัวอักษร' },
    { code: 'KeyR', label: 'R', hint: 'ตัวอักษร' },
    { code: 'KeyT', label: 'T', hint: 'ตัวอักษร' },
  ],
  [
    { code: 'KeyA', label: 'A', hint: 'ตัวอักษร' },
    { code: 'KeyS', label: 'S', hint: 'ตัวอักษร' },
    { code: 'KeyD', label: 'D', hint: 'ตัวอักษร' },
    { code: 'KeyF', label: 'F', hint: 'ตัวอักษร' },
    { code: 'Enter', label: 'Enter', hint: 'รับคำสั่ง' },
  ],
  [
    { code: 'KeyZ', label: 'Z', hint: 'ตัวอักษร' },
    { code: 'KeyX', label: 'X', hint: 'ตัวอักษร' },
    { code: 'KeyC', label: 'C', hint: 'ตัวอักษร' },
    { code: 'KeyV', label: 'V', hint: 'ตัวอักษร' },
    { code: 'Space', label: 'Spacebar', hint: 'เว้นวรรค' },
  ],
];

const saveSequence = ['KeyS', 'KeyA', 'KeyV', 'KeyE'];

const getKeyLabel = (code: string) => {
  const found = keyboardRows.flat().find((key) => key.code === code);
  return found?.label || code;
};

const KeyboardPracticeGame: React.FC = () => {
  const [stage, setStage] = useState(0);
  const [targetIndex, setTargetIndex] = useState(0);
  const [pressIndex, setPressIndex] = useState(0);
  const [sequenceIndex, setSequenceIndex] = useState(0);
  const [message, setMessage] = useState('เริ่มจากมองหาแป้นที่สว่าง แล้วคลิกให้ถูก');
  const [mistakes, setMistakes] = useState(0);

  const currentTarget = keyTargets[targetIndex];
  const progress = useMemo(() => {
    if (stage === 0) return targetIndex / keyTargets.length;
    if (stage === 1) return pressIndex / keyTargets.length;
    if (stage === 2) return sequenceIndex / saveSequence.length;
    return 1;
  }, [pressIndex, sequenceIndex, stage, targetIndex]);

  const resetGame = () => {
    setStage(0);
    setTargetIndex(0);
    setPressIndex(0);
    setSequenceIndex(0);
    setMistakes(0);
    setMessage('เริ่มจากมองหาแป้นที่สว่าง แล้วคลิกให้ถูก');
  };

  const goNextStage = () => {
    setStage((current) => Math.min(3, current + 1));
  };

  const handleCorrect = (text: string) => {
    setMessage(text);
  };

  const handleWrong = () => {
    setMistakes((count) => count + 1);
    setMessage('ยังไม่ใช่แป้นนี้ ลองดูชื่อแป้นบนการ์ดอีกครั้ง');
  };

  const handleVirtualKey = (code: string) => {
    if (stage === 0) {
      if (code !== currentTarget.code) {
        handleWrong();
        return;
      }
      const next = targetIndex + 1;
      setTargetIndex(next);
      if (next >= keyTargets.length) {
        setMessage('คลิกแป้นครบแล้ว ต่อไปลองกดแป้นจริงบนคีย์บอร์ด');
        goNextStage();
      } else {
        handleCorrect('ถูกต้อง มองหาแป้นถัดไปได้เลย');
      }
      return;
    }

    if (stage === 1) {
      handlePhysicalKey(code);
      return;
    }

    if (stage === 2) {
      handleSequenceKey(code);
    }
  };

  const handlePhysicalKey = (code: string) => {
    const target = keyTargets[pressIndex];
    if (!target) return;
    if (code !== target.code) {
      handleWrong();
      return;
    }
    const next = pressIndex + 1;
    setPressIndex(next);
    if (next >= keyTargets.length) {
      setMessage('กดแป้นจริงครบแล้ว ต่อไปมาสร้างคำสั่ง Save');
      goNextStage();
    } else {
      handleCorrect('ถูกต้อง กดแป้นถัดไปได้เลย');
    }
  };

  const handleSequenceKey = (code: string) => {
    const target = saveSequence[sequenceIndex];
    if (!target) return;
    if (code !== target) {
      handleWrong();
      return;
    }
    const next = sequenceIndex + 1;
    setSequenceIndex(next);
    if (next >= saveSequence.length) {
      setMessage('สำเร็จ นักเรียนกดคำว่า SAVE ได้ครบแล้ว');
      setStage(3);
    } else {
      handleCorrect('ถูกต้อง กดตัวถัดไปให้ครบคำว่า SAVE');
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (stage !== 1 && stage !== 2) return;
      if (event.code === 'Space') event.preventDefault();
      if (stage === 1) handlePhysicalKey(event.code);
      if (stage === 2) handleSequenceKey(event.code);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const highlightedCode = stage === 0
    ? currentTarget?.code
    : stage === 1
      ? keyTargets[pressIndex]?.code
      : stage === 2
        ? saveSequence[sequenceIndex]
        : '';

  return (
    <div className="keyboard-game-page page-transition">
      <main className="keyboard-game-shell">
        <section className="keyboard-game-top">
          <div>
            <span className="keyboard-game-kicker">ป.1 ฝึกแป้นพิมพ์</span>
            <h1>เกมนักสำรวจคีย์บอร์ด</h1>
            <p>รู้จัก Spacebar, Enter, Backspace ตัวอักษร และตัวเลข ผ่านการคลิกและกดแป้นจริง</p>
          </div>
          <button className="keyboard-reset-btn" onClick={resetGame}>
            <RotateCcw size={18} />
            เริ่มใหม่
          </button>
        </section>

        <section className="keyboard-status-panel">
          <div className="keyboard-status-item">
            <Keyboard size={22} />
            <div>
              <strong>ระดับ {Math.min(stage + 1, 4)} จาก 4</strong>
              <span>{stage === 0 ? 'คลิกแป้นบนจอ' : stage === 1 ? 'กดแป้นจริง' : stage === 2 ? 'พิมพ์คำสั่ง SAVE' : 'สรุปผล'}</span>
            </div>
          </div>
          <div className="keyboard-progress-track" aria-label="ความคืบหน้า">
            <div style={{ width: `${Math.max(8, progress * 100)}%` }} />
          </div>
          <p className="keyboard-message">{message}</p>
        </section>

        <section className="keyboard-game-board">
          {stage < 3 ? (
            <>
              <div className="keyboard-mission-card">
                <span>เป้าหมายตอนนี้</span>
                {stage === 0 && currentTarget ? (
                  <>
                    <strong>{currentTarget.label}</strong>
                    <p>{currentTarget.hint}</p>
                  </>
                ) : null}
                {stage === 1 && keyTargets[pressIndex] ? (
                  <>
                    <strong>{keyTargets[pressIndex].label}</strong>
                    <p>กดแป้นนี้บนคีย์บอร์ดจริง หรือคลิกบนแป้นจำลองก็ได้</p>
                  </>
                ) : null}
                {stage === 2 ? (
                  <>
                    <strong>{saveSequence.map(getKeyLabel).join(' ')}</strong>
                    <p>พิมพ์คำว่า SAVE ให้ครบ เพื่อจำคำสั่งบันทึกงาน</p>
                  </>
                ) : null}
              </div>

              {stage === 2 ? (
                <div className="save-sequence">
                  {saveSequence.map((code, index) => (
                    <div
                      key={`${code}-${index}`}
                      className={`save-letter ${index < sequenceIndex ? 'done' : index === sequenceIndex ? 'active' : ''}`}
                    >
                      {index < sequenceIndex ? <CheckCircle2 size={22} /> : getKeyLabel(code)}
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="virtual-keyboard" aria-label="แป้นพิมพ์จำลอง">
                {keyboardRows.map((row, rowIndex) => (
                  <div className="keyboard-row" key={rowIndex}>
                    {row.map((key) => (
                      <button
                        key={key.code}
                        className={`keyboard-key ${key.code === highlightedCode ? 'highlight' : ''} ${key.code === 'Space' ? 'wide' : ''} ${key.code === 'Backspace' || key.code === 'Enter' ? 'medium' : ''}`}
                        onClick={() => handleVirtualKey(key.code)}
                      >
                        <strong>{key.label}</strong>
                        <span>{key.hint}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>

              <p className="keyboard-counter">
                {stage === 0 ? `คลิกถูก ${targetIndex} / ${keyTargets.length}` : null}
                {stage === 1 ? `กดถูก ${pressIndex} / ${keyTargets.length}` : null}
                {stage === 2 ? `พิมพ์ถูก ${sequenceIndex} / ${saveSequence.length}` : null}
                {mistakes > 0 ? ` · ลองผิด ${mistakes} ครั้ง` : ''}
              </p>
            </>
          ) : (
            <div className="keyboard-complete">
              <Trophy size={64} />
              <h2>สุดยอด นักสำรวจคีย์บอร์ด</h2>
              <p>นักเรียนรู้จักแป้นสำคัญ กดแป้นได้แม่นขึ้น และจำคำสั่ง Save สำหรับบันทึกงานได้แล้ว</p>
              <button className="keyboard-next-btn" onClick={resetGame}>เล่นอีกครั้ง</button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default KeyboardPracticeGame;
