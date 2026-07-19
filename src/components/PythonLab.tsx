import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, RotateCcw, Lightbulb, Blocks, FileCode2, CheckCircle2, Loader2, Trash2 } from 'lucide-react';
import { PY_CHALLENGES } from '../data/pythonChallenges';
import type { PyChallenge } from '../data/pythonChallenges';
import { useAuth } from '../context/AuthContext';
import { awardBonus } from '../services/progressService';
import { useToast } from './Toast';

/* eslint-disable @typescript-eslint/no-explicit-any */
// window.loadPyodide ถูกประกาศ type ไว้แล้วใน CodingSandbox.tsx (ใช้ร่วมกัน)

const SOLVED_KEY = 'krujames_py_solved';
const loadSolved = (): string[] => {
  try { return JSON.parse(localStorage.getItem(SOLVED_KEY) || '[]'); } catch { return []; }
};
const markSolved = (id: string) => {
  try {
    const s = new Set(loadSolved()); s.add(id);
    localStorage.setItem(SOLVED_KEY, JSON.stringify([...s]));
  } catch { /* ignore */ }
};

// บล็อกคำสั่ง — คลิกแล้วแทรกโค้ดลง editor
const BLOCKS: { label: string; snippet: string; color: string }[] = [
  { label: 'พิมพ์ข้อความ', snippet: 'print("ข้อความ")', color: '#3b82f6' },
  { label: 'พิมพ์ตัวแปร', snippet: 'print(x)', color: '#3b82f6' },
  { label: 'ตัวแปร =', snippet: 'x = 0', color: '#a855f7' },
  { label: 'บวกค่า', snippet: 'x = x + 1', color: '#a855f7' },
  { label: 'วนซ้ำ for', snippet: 'for i in range(1, 6):\n    print(i)', color: '#22c55e' },
  { label: 'เงื่อนไข if', snippet: 'if x > 0:\n    print("มากกว่า 0")', color: '#f59e0b' },
  { label: 'if / else', snippet: 'if x % 2 == 0:\n    print("คู่")\nelse:\n    print("คี่")', color: '#f59e0b' },
  { label: 'รับค่า input', snippet: 'name = input("ชื่อ: ")', color: '#ec4899' },
  { label: 'คอมเมนต์', snippet: '# อธิบายโค้ด', color: '#6b7280' },
];

const normalize = (s: string) =>
  s.replace(/\r/g, '').split('\n').map((l) => l.trimEnd()).join('\n').trim();

const PythonLab: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [challenge, setChallenge] = useState<PyChallenge>(PY_CHALLENGES[0]);
  const [code, setCode] = useState<string>(PY_CHALLENGES[0].starter);
  const [mode, setMode] = useState<'editor' | 'blocks'>('editor');
  const [output, setOutput] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'pass' | 'fail'>('idle');
  const [running, setRunning] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [pyodide, setPyodide] = useState<any>(null);
  const [pyLoading, setPyLoading] = useState(false);
  const [solved, setSolved] = useState<string[]>(() => loadSolved());
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
    setChallenge(c); setCode(c.starter); setOutput([]); setStatus('idle'); setShowHint(false);
  };

  const insertBlock = (snippet: string) => {
    const ta = taRef.current;
    const needNL = code.length > 0 && !code.endsWith('\n');
    const next = code + (needNL ? '\n' : '') + snippet + '\n';
    setCode(next);
    setTimeout(() => { ta?.focus(); ta?.setSelectionRange(next.length, next.length); }, 0);
  };

  const run = async () => {
    if (!pyodide) { toast.show('Python ยังโหลดไม่เสร็จ รอสักครู่', 'info'); return; }
    setRunning(true);
    setStatus('idle');
    const logs: string[] = [];
    try {
      pyodide.setStdout({ batched: (s: string) => logs.push(s) });
      pyodide.setStderr({ batched: (s: string) => logs.push(`⚠️ ${s}`) });
      await pyodide.runPythonAsync(code);
      const got = normalize(logs.join('\n'));
      const want = normalize(challenge.expectedOutput);
      setOutput(logs.length ? logs : ['(ไม่มีผลลัพธ์ — ลองใช้ print())']);
      if (got === want) {
        setStatus('pass');
        if (!solved.includes(challenge.id)) {
          markSolved(challenge.id);
          setSolved(loadSolved());
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Challenge picker */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <strong>🐍 Python Lab</strong>
        <select value={challenge.id} onChange={(e) => pickChallenge(e.target.value)}
          style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 8, fontFamily: 'inherit' }}>
          {PY_CHALLENGES.map((c) => (
            <option key={c.id} value={c.id}>{solved.includes(c.id) ? '✅ ' : ''}[{c.level}] {c.title}</option>
          ))}
        </select>
        <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>แก้แล้ว {solvedCount}/{PY_CHALLENGES.length}</span>
      </div>

      {/* Problem card */}
      <div style={{ padding: 14, borderRadius: 12, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ padding: '2px 10px', borderRadius: 999, background: levelColor, color: 'white', fontSize: '0.75rem', fontWeight: 700 }}>
            {challenge.level}
          </span>
          <strong>{challenge.title}</strong>
          {isSolved && <span style={{ color: '#16a34a', fontSize: '0.8rem' }}><CheckCircle2 size={14} style={{ verticalAlign: 'middle' }} /> แก้แล้ว</span>}
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
        <button onClick={() => setMode('blocks')} className={mode === 'blocks' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '6px 14px' }}>
          <Blocks size={14} /> โหมดบล็อก
        </button>
      </div>

      {/* Block palette */}
      {mode === 'blocks' && (
        <div style={{ padding: 12, background: '#f9fafb', borderRadius: 10, border: '1px dashed #d1d5db' }}>
          <div style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: 8 }}>คลิกบล็อกเพื่อแทรกโค้ด ↓ (แก้ไขต่อในกล่องได้)</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {BLOCKS.map((b) => (
              <button key={b.label} onClick={() => insertBlock(b.snippet)}
                style={{ padding: '8px 12px', borderRadius: 10, background: 'white', border: `2px solid ${b.color}`, color: b.color, fontWeight: 700, fontSize: '0.85rem', fontFamily: 'inherit', cursor: 'pointer' }}>
                🧱 {b.label}
              </button>
            ))}
            <button onClick={() => setCode('')} style={{ padding: '8px 12px', borderRadius: 10, background: '#fee2e2', border: '2px solid #ef4444', color: '#dc2626', fontWeight: 700, fontSize: '0.85rem', fontFamily: 'inherit', cursor: 'pointer' }}>
              <Trash2 size={13} style={{ verticalAlign: 'middle' }} /> ล้างโค้ด
            </button>
          </div>
        </div>
      )}

      {/* Code editor */}
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
