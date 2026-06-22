import React, { useState, useEffect } from 'react';
import { Play, Trash2, Copy, Download } from 'lucide-react';

type Lang = 'javascript' | 'python';

const samples: Record<Lang, string> = {
  javascript: `// ลองเขียน JavaScript ดู
console.log('สวัสดี Kru James!');

// คำนวณผลรวม 1-100
let sum = 0;
for (let i = 1; i <= 100; i++) {
  sum += i;
}
console.log('ผลรวม 1-100 =', sum);

// ฟังก์ชัน
function fib(n) {
  if (n < 2) return n;
  return fib(n-1) + fib(n-2);
}
console.log('Fibonacci(10) =', fib(10));`,
  python: `# Python sandbox (ใช้ Pyodide — โหลดครั้งแรกใช้เวลา)
print("สวัสดี Kru James!")

# คำนวณผลรวม 1-100
total = sum(range(1, 101))
print(f"ผลรวม 1-100 = {total}")

# ฟังก์ชัน
def fib(n):
    if n < 2:
        return n
    return fib(n-1) + fib(n-2)

print(f"Fibonacci(10) = {fib(10)}")`,
};

const CodingSandbox: React.FC = () => {
  const [lang, setLang] = useState<Lang>('javascript');
  const [code, setCode] = useState(samples.javascript);
  const [output, setOutput] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [pyodide, setPyodide] = useState<any>(null);
  const [pyLoading, setPyLoading] = useState(false);

  // load pyodide on demand
  const loadPyodide = async () => {
    if (pyodide || pyLoading) return;
    setPyLoading(true);
    setOutput(['🐍 กำลังโหลด Python (รอสักครู่...)']);
    try {
      // load Pyodide from CDN
      if (!(window as any).loadPyodide) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
        document.head.appendChild(script);
        await new Promise((r) => { script.onload = r; });
      }
      const py = await (window as any).loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
      });
      setPyodide(py);
      setOutput(['✅ Python พร้อมใช้งาน!']);
    } catch (e) {
      setOutput([`❌ โหลด Python ไม่สำเร็จ: ${e}`]);
    }
    setPyLoading(false);
  };

  useEffect(() => {
    if (lang === 'python' && !pyodide && !pyLoading) {
      loadPyodide();
    }
  }, [lang]);

  const run = async () => {
    setRunning(true);
    setOutput([]);
    const logs: string[] = [];

    if (lang === 'javascript') {
      // Capture console.log
      const originalLog = console.log;
      console.log = (...args: any[]) => {
        logs.push(args.map((a) => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
      };
      try {
        // Run JavaScript
        const fn = new Function(code);
        fn();
      } catch (e: any) {
        logs.push(`❌ ${e.message}`);
      }
      console.log = originalLog;
      setOutput(logs);
    } else if (lang === 'python' && pyodide) {
      try {
        pyodide.setStdout({ batched: (s: string) => logs.push(s) });
        pyodide.setStderr({ batched: (s: string) => logs.push(`❌ ${s}`) });
        await pyodide.runPythonAsync(code);
        setOutput(logs);
      } catch (e: any) {
        logs.push(`❌ ${e.message}`);
        setOutput(logs);
      }
    } else if (lang === 'python' && !pyodide) {
      setOutput(['⏳ กำลังโหลด Python — ลองอีกครั้งใน 10 วินาที']);
    }

    setRunning(false);
  };

  const loadSample = () => {
    if (!confirm('แทนที่โค้ดด้วยตัวอย่าง?')) return;
    setCode(samples[lang]);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    alert('คัดลอกแล้ว ✓');
  };

  const downloadCode = () => {
    const ext = lang === 'python' ? 'py' : 'js';
    const blob = new Blob([code], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `code.${ext}`;
    a.click();
  };

  return (
    <div className="coding-sandbox" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <strong>💻 Coding Sandbox</strong>
        <select
          value={lang}
          onChange={(e) => {
            setLang(e.target.value as Lang);
            setCode(samples[e.target.value as Lang]);
            setOutput([]);
          }}
          style={{ padding: '4px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontFamily: 'inherit' }}
        >
          <option value="javascript">⚡ JavaScript</option>
          <option value="python">🐍 Python {pyLoading ? '(โหลดอยู่...)' : pyodide ? '✓' : ''}</option>
        </select>
        <button onClick={loadSample} className="btn-ghost" style={{ padding: '4px 10px' }}>โหลดตัวอย่าง</button>
        <button onClick={copyCode} className="btn-ghost" style={{ padding: '4px 10px' }}><Copy size={14} /></button>
        <button onClick={downloadCode} className="btn-ghost" style={{ padding: '4px 10px' }}><Download size={14} /></button>
        <div style={{ flex: 1 }} />
        <button
          onClick={run}
          disabled={running || (lang === 'python' && !pyodide)}
          style={{
            padding: '6px 16px',
            background: 'linear-gradient(135deg, #16a34a, #15803d)',
            color: 'white',
            border: 0,
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Play size={14} /> {running ? 'กำลังรัน...' : 'รัน'}
        </button>
      </div>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        spellCheck={false}
        style={{
          width: '100%',
          minHeight: 280,
          padding: 12,
          fontFamily: '"JetBrains Mono", Consolas, monospace',
          fontSize: '0.88rem',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          background: '#1e293b',
          color: '#e2e8f0',
          resize: 'vertical',
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong style={{ fontSize: '0.85rem', color: '#6b7280' }}>📤 Output:</strong>
        {output.length > 0 && (
          <button onClick={() => setOutput([])} className="btn-ghost" style={{ padding: '2px 8px' }}>
            <Trash2 size={12} /> ล้าง
          </button>
        )}
      </div>
      <pre
        style={{
          padding: 12,
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          fontFamily: '"JetBrains Mono", Consolas, monospace',
          fontSize: '0.85rem',
          minHeight: 100,
          maxHeight: 240,
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
          margin: 0,
        }}
      >
        {output.length === 0 ? <span style={{ color: '#9ca3af' }}>(ยังไม่มีผลลัพธ์)</span> : output.join('\n')}
      </pre>
    </div>
  );
};

export default CodingSandbox;
