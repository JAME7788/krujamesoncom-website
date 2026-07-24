import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Blocks,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileCode2,
  Lightbulb,
  Loader2,
  Play,
  RotateCcw,
} from 'lucide-react';
import { PY_CHALLENGES } from '../data/pythonChallenges';
import type { PyChallenge } from '../data/pythonChallenges';
import { useAuth } from '../context/AuthContext';
import { awardBonus } from '../services/progressService';
import { useToast } from './Toast';

// Blockly workspace — โหลดแบบ lazy (bundle หนัก โหลดเฉพาะตอนเปิดโหมดบล็อก)
const BlocklyPython = React.lazy(() => import('./BlocklyPython'));

/* eslint-disable @typescript-eslint/no-explicit-any */
// window.loadPyodide ถูกประกาศ type ไว้แล้วใน CodingSandbox.tsx (ใช้ร่วมกัน)

const solvedKey = (ownerId: string) => `krujames_py_solved_${ownerId}`;
const loadSolved = (ownerId: string): string[] => {
  try { return JSON.parse(localStorage.getItem(solvedKey(ownerId)) || '[]'); } catch { return []; }
};
const markSolved = (ownerId: string, id: string): string[] => {
  const next = [...new Set([...loadSolved(ownerId), id])];
  try {
    localStorage.setItem(solvedKey(ownerId), JSON.stringify(next));
  } catch { /* ignore */ }
  return next;
};

const normalize = (s: string) =>
  s.replace(/\r/g, '').split('\n').map((l) => l.trimEnd()).join('\n').trim();

const CHALLENGE_LEVELS: PyChallenge['level'][] = ['ง่าย', 'ปานกลาง', 'ท้าทาย'];

interface PythonLabProps {
  onChallengeSolved?: (solvedCount: number) => void;
}

const PythonLab: React.FC<PythonLabProps> = ({ onChallengeSolved }) => {
  const { user } = useAuth();
  const toast = useToast();
  const ownerId = user?.id || 'guest';
  const [challenge, setChallenge] = useState<PyChallenge>(PY_CHALLENGES[0]);
  const [code, setCode] = useState<string>(PY_CHALLENGES[0].starter);
  const [blocklyCode, setBlocklyCode] = useState<string>('');
  const [mode, setMode] = useState<'editor' | 'blocks'>('editor');
  const [output, setOutput] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'pass' | 'fail'>('idle');
  const [running, setRunning] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [pyodide, setPyodide] = useState<any>(null);
  const [pyLoading, setPyLoading] = useState(false);
  const [solved, setSolved] = useState<string[]>(() => loadSolved(ownerId));
  const taRef = useRef<HTMLTextAreaElement>(null);

  // โหลด Pyodide ครั้งแรก
  const loadPy = useCallback(async () => {
    if (pyodide || pyLoading) return;
    setPyLoading(true);
    setOutput(['🐍 กำลังโหลด Python (ครั้งแรกใช้เวลาสักครู่)...']);
    try {
      if (!window.loadPyodide) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
        document.head.appendChild(script);
        await new Promise<void>((r, rej) => { script.onload = () => r(); script.onerror = () => rej(new Error('โหลดไม่สำเร็จ')); });
      }
      const py = await window.loadPyodide!({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/' });
      setPyodide(py);
      setOutput(['✅ Python พร้อมใช้งาน! กด "รัน" ได้เลย']);
    } catch (e) {
      setOutput([`❌ โหลด Python ไม่สำเร็จ: ${e instanceof Error ? e.message : String(e)}`]);
    }
    setPyLoading(false);
  }, [pyodide, pyLoading]);

  useEffect(() => { const t = window.setTimeout(() => void loadPy(), 0); return () => window.clearTimeout(t); }, [loadPy]);

  const pickChallenge = (id: string) => {
    const c = PY_CHALLENGES.find((x) => x.id === id) || PY_CHALLENGES[0];
    setChallenge(c);
    setCode(c.starter);
    setOutput([]);
    setStatus('idle');
    setShowHint(false);
    if (c.mode === 'text') setMode('editor');
  };

  // แหล่งโค้ดที่จะรัน — โหมดบล็อกใช้โค้ดที่ Blockly สร้าง
  const activeCode = mode === 'blocks' ? blocklyCode : code;

  const run = async () => {
    if (!pyodide) { toast.show('Python ยังโหลดไม่เสร็จ รอสักครู่', 'info'); return; }
    if (mode === 'blocks' && !blocklyCode.trim()) { toast.show('ลากบล็อกมาต่อกันก่อนนะ', 'info'); return; }
    setRunning(true);
    setStatus('idle');
    const logs: string[] = [];
    try {
      pyodide.setStdout({ batched: (s: string) => logs.push(s) });
      pyodide.setStderr({ batched: (s: string) => logs.push(`⚠️ ${s}`) });
      await pyodide.runPythonAsync(activeCode);
      const got = normalize(logs.join('\n'));
      const want = normalize(challenge.expectedOutput);
      setOutput(logs.length ? logs : ['(ไม่มีผลลัพธ์ — ลองใช้ print())']);
      if (got === want) {
        setStatus('pass');
        if (!solved.includes(challenge.id)) {
          const nextSolved = markSolved(ownerId, challenge.id);
          setSolved(nextSolved);
          onChallengeSolved?.(nextSolved.length);
          if (user && user.id !== 'admin_teacher_account') {
            void awardBonus(user.id, { emoji: '🐍', reason: `แก้โจทย์ Python: ${challenge.title}`, xp: challenge.xp });
            toast.show(`เยี่ยม! แก้โจทย์สำเร็จ +${challenge.xp} XP 🎉`, 'success');
          } else {
            toast.show('เยี่ยม! คำตอบถูกต้อง 🎉', 'success');
          }
        } else {
          toast.show('ถูกต้อง! (แก้โจทย์นี้ไปแล้ว)', 'success');
        }
      } else {
        setStatus('fail');
      }
    } catch (e: any) {
      // แจ้ง error แบบเข้าใจง่าย
      const msg = String(e?.message || e);
      const lastLine = msg.trim().split('\n').slice(-3).join('\n');
      setOutput([...logs, `❌ เกิดข้อผิดพลาด (Error):`, lastLine]);
      setStatus('fail');
    } finally {
      setRunning(false);
    }
  };

  const isSolved = solved.includes(challenge.id);
  const levelColor = challenge.level === 'ง่าย' ? '#22c55e' : challenge.level === 'ปานกลาง' ? '#f59e0b' : '#ef4444';
  const solvedCount = useMemo(() => PY_CHALLENGES.filter((c) => solved.includes(c.id)).length, [solved]);
  const challengeIndex = PY_CHALLENGES.findIndex((item) => item.id === challenge.id);
  const moveChallenge = (offset: number) => {
    const nextIndex = (challengeIndex + offset + PY_CHALLENGES.length) % PY_CHALLENGES.length;
    pickChallenge(PY_CHALLENGES[nextIndex].id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Challenge picker */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <strong>🐍 Python Lab</strong>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => moveChallenge(-1)}
          aria-label="โจทย์ก่อนหน้า"
          title="โจทย์ก่อนหน้า"
          style={{ width: 34, height: 34, padding: 0, justifyContent: 'center' }}
        >
          <ChevronLeft size={17} />
        </button>
        <select value={challenge.id} onChange={(e) => pickChallenge(e.target.value)}
          aria-label="เลือกโจทย์เขียนโปรแกรม"
          style={{ flex: '1 1 260px', minWidth: 0, padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 8, fontFamily: 'inherit' }}>
          {CHALLENGE_LEVELS.map((level) => {
            const levelChallenges = PY_CHALLENGES.filter((item) => item.level === level);
            return (
              <optgroup key={level} label={`${level} (${levelChallenges.length} ข้อ)`}>
                {levelChallenges.map((item) => (
                  <option key={item.id} value={item.id}>
                    {solved.includes(item.id) ? 'ผ่านแล้ว - ' : ''}{item.title}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => moveChallenge(1)}
          aria-label="โจทย์ถัดไป"
          title="โจทย์ถัดไป"
          style={{ width: 34, height: 34, padding: 0, justifyContent: 'center' }}
        >
          <ChevronRight size={17} />
        </button>
        <span style={{ fontSize: '0.82rem', color: '#6b7280', whiteSpace: 'nowrap' }}>
          ข้อ {challengeIndex + 1}/{PY_CHALLENGES.length} · แก้แล้ว {solvedCount}/{PY_CHALLENGES.length}
        </span>
      </div>

      {/* Problem card */}
      <div className="python-problem-card" style={{ padding: 14, borderRadius: 8, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
        <div className="python-problem-heading" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          <span className="python-problem-level" style={{ padding: '2px 10px', borderRadius: 999, background: levelColor, color: 'white', fontSize: '0.75rem', fontWeight: 700 }}>
            {challenge.level}
          </span>
          <span className="python-problem-topic" style={{ padding: '2px 8px', borderRadius: 6, background: '#ffffff', color: '#475569', fontSize: '0.75rem', fontWeight: 700 }}>
            {challenge.topic}
          </span>
          <strong className="python-problem-title">{challenge.title}</strong>
          {isSolved && <span className="python-problem-solved" style={{ color: '#16a34a', fontSize: '0.8rem' }}><CheckCircle2 size={14} style={{ verticalAlign: 'middle' }} /> แก้แล้ว</span>}
        </div>
        <p style={{ margin: '4px 0', fontSize: '0.92rem' }}>📋 {challenge.desc}</p>
        <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>
          ผลลัพธ์ที่ต้องได้: <code style={{ background: '#dbeafe', padding: '1px 6px', borderRadius: 4 }}>{challenge.expectedOutput.replace(/\n/g, ' ⏎ ')}</code>
        </div>
        {showHint && (
          <div style={{ marginTop: 8, padding: 8, background: '#fef3c7', borderRadius: 8, fontSize: '0.85rem' }}>
            💡 {challenge.hint}
          </div>
        )}
      </div>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => setMode('editor')} className={mode === 'editor' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '6px 14px' }}>
          <FileCode2 size={14} /> Text Editor
        </button>
        <button
          onClick={() => setMode('blocks')}
          disabled={challenge.mode === 'text'}
          title={challenge.mode === 'text' ? 'โจทย์นี้ใช้โหมดพิมพ์โค้ด' : 'เขียนโปรแกรมด้วยบล็อก'}
          className={mode === 'blocks' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '6px 14px' }}
        >
          <Blocks size={14} /> โหมดบล็อก
        </button>
        <span style={{ alignSelf: 'center', color: '#64748b', fontSize: '0.78rem' }}>
          {challenge.mode === 'both' ? 'ทำได้ทั้งบล็อกและพิมพ์โค้ด' : 'โจทย์นี้ใช้โหมดพิมพ์โค้ด'}
        </span>
      </div>

      {/* โหมดบล็อก — ลากบล็อกจริง (Blockly) → สร้าง Python อัตโนมัติ */}
      {mode === 'blocks' && (
        <>
          <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>
            🧱 ลากบล็อกจากกล่องซ้ายมาต่อกัน — โปรแกรมจะแปลงเป็นโค้ด Python ให้อัตโนมัติด้านล่าง
          </div>
          <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}><Loader2 className="spin" /> กำลังโหลดตัวต่อบล็อก...</div>}>
            <BlocklyPython onCode={setBlocklyCode} />
          </Suspense>
          <div>
            <strong style={{ fontSize: '0.82rem', color: '#6b7280' }}>🐍 โค้ด Python ที่ได้จากบล็อก:</strong>
            <pre style={{
              margin: '4px 0 0', padding: 12, background: '#1e293b', color: '#e2e8f0',
              borderRadius: 10, minHeight: 60, maxHeight: 180, overflow: 'auto',
              fontFamily: '"JetBrains Mono", Consolas, monospace', fontSize: '0.85rem', whiteSpace: 'pre-wrap',
            }}>
              {blocklyCode.trim() || <span style={{ color: '#64748b' }}>(ยังไม่มีบล็อก — ลากบล็อกมาต่อกัน)</span>}
            </pre>
          </div>
        </>
      )}

      {/* Text Editor — พิมพ์โค้ดเอง */}
      {mode === 'editor' && (
        <textarea
          ref={taRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          style={{
            width: '100%', minHeight: 220, padding: 14,
            fontFamily: '"JetBrains Mono", Consolas, monospace', fontSize: '0.9rem',
            background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 10,
            resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6,
          }}
        />
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={run} disabled={running || !pyodide}
          style={{ padding: '8px 20px', background: 'linear-gradient(135deg,#16a34a,#15803d)', color: 'white', border: 0, borderRadius: 8, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {running ? <Loader2 size={14} className="spin" /> : pyLoading ? <Loader2 size={14} className="spin" /> : <Play size={14} />}
          {pyLoading ? 'กำลังโหลด Python...' : running ? 'กำลังรัน...' : 'รัน + ตรวจคำตอบ'}
        </button>
        <button onClick={() => { setCode(challenge.starter); setStatus('idle'); setOutput([]); }} className="btn-secondary" style={{ padding: '8px 14px' }}>
          <RotateCcw size={14} /> เริ่มใหม่
        </button>
        <button onClick={() => setShowHint((s) => !s)} className="btn-secondary" style={{ padding: '8px 14px' }}>
          <Lightbulb size={14} /> {showHint ? 'ซ่อนคำใบ้' : 'คำใบ้'}
        </button>
        <button onClick={() => moveChallenge(1)} className="btn-secondary" style={{ padding: '8px 14px' }}>
          ข้อถัดไป <ChevronRight size={14} />
        </button>
      </div>

      {/* Result banner */}
      {status === 'pass' && (
        <div style={{ padding: 12, borderRadius: 10, background: '#dcfce7', border: '2px solid #22c55e', color: '#166534', fontWeight: 700, textAlign: 'center' }}>
          🎉 ถูกต้อง! ผลลัพธ์ตรงกับที่โจทย์ต้องการ
        </div>
      )}
      {status === 'fail' && (
        <div style={{ padding: 12, borderRadius: 10, background: '#fef3c7', border: '2px solid #f59e0b', color: '#92400e', fontWeight: 600, textAlign: 'center' }}>
          ยังไม่ตรงกับที่โจทย์ต้องการ — ดูผลลัพธ์ด้านล่างแล้วแก้ไขอีกครั้ง (กด "คำใบ้" ได้)
        </div>
      )}

      {/* Output */}
      <div>
        <strong style={{ fontSize: '0.85rem', color: '#6b7280' }}>📤 ผลลัพธ์ / Error:</strong>
        <pre style={{
          margin: '4px 0 0', padding: 12, background: '#0f172a', color: '#86efac',
          borderRadius: 8, minHeight: 60, maxHeight: 220, overflow: 'auto',
          fontFamily: '"JetBrains Mono", Consolas, monospace', fontSize: '0.85rem', whiteSpace: 'pre-wrap',
        }}>
          {output.length === 0 ? <span style={{ color: '#64748b' }}>(ยังไม่มีผลลัพธ์ — กด "รัน + ตรวจคำตอบ")</span> : output.join('\n')}
        </pre>
      </div>
    </div>
  );
};

export default PythonLab;
