import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pencil, Eraser, Square, Circle, Type, Trash2, Download, Undo } from 'lucide-react';

type Tool = 'pen' | 'eraser' | 'rect' | 'circle' | 'text';

interface Point { x: number; y: number; }

const colors = ['#1f2937', '#dc2626', '#ea580c', '#facc15', '#16a34a', '#0ea5e9', '#6366f1', '#a855f7', '#ec4899'];

const Whiteboard: React.FC<{ width?: number; height?: number }> = ({ width = 800, height = 500 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#1f2937');
  const [size, setSize] = useState(3);
  const [drawing, setDrawing] = useState(false);
  const [last, setLast] = useState<Point | null>(null);
  const [, setHistory] = useState<ImageData[]>([]);

  const saveHistory = useCallback(() => {
    const c = canvasRef.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    const img = ctx.getImageData(0, 0, c.width, c.height);
    setHistory((h) => [...h.slice(-20), img]);
  }, []);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, c.width, c.height);
    saveHistory();
  }, [saveHistory]);

  const undo = () => {
    setHistory((h) => {
      if (h.length <= 1) return h;
      const newHistory = h.slice(0, -1);
      const c = canvasRef.current;
      const ctx = c?.getContext('2d');
      if (ctx) ctx.putImageData(newHistory[newHistory.length - 1], 0, 0);
      return newHistory;
    });
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent): Point => {
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    const scale = c.width / rect.width;
    let x = 0, y = 0;
    if ('touches' in e) {
      const t = e.touches[0] || e.changedTouches[0];
      x = (t.clientX - rect.left) * scale;
      y = (t.clientY - rect.top) * scale;
    } else {
      x = (e.clientX - rect.left) * scale;
      y = (e.clientY - rect.top) * scale;
    }
    return { x, y };
  };

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const p = getPos(e);
    setDrawing(true);
    setLast(p);
  };

  const move = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing || !last) return;
    e.preventDefault();
    const p = getPos(e);
    const c = canvasRef.current!;
    const ctx = c.getContext('2d')!;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'pen') {
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    } else if (tool === 'eraser') {
      ctx.strokeStyle = 'white';
      ctx.lineWidth = size * 4;
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
    setLast(p);
  };

  const end = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing || !last) { setDrawing(false); return; }
    e.preventDefault();
    const p = getPos(e);
    const c = canvasRef.current!;
    const ctx = c.getContext('2d')!;

    if (tool === 'rect') {
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.strokeRect(last.x, last.y, p.x - last.x, p.y - last.y);
    } else if (tool === 'circle') {
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.beginPath();
      const r = Math.sqrt((p.x - last.x) ** 2 + (p.y - last.y) ** 2);
      ctx.arc(last.x, last.y, r, 0, Math.PI * 2);
      ctx.stroke();
    } else if (tool === 'text') {
      const text = prompt('พิมพ์ข้อความ:');
      if (text) {
        ctx.fillStyle = color;
        ctx.font = `${size * 8}px 'Prompt', sans-serif`;
        ctx.fillText(text, last.x, last.y);
      }
    }
    setDrawing(false);
    setLast(null);
    saveHistory();
  };

  const clear = () => {
    if (!confirm('ลบทั้งหมด?')) return;
    const c = canvasRef.current!;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, c.width, c.height);
    saveHistory();
  };

  const download = () => {
    const c = canvasRef.current!;
    const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = c.toDataURL();
    link.click();
  };

  return (
    <div className="whiteboard">
      <div className="wb-toolbar">
        <div className="wb-tools">
          {([
            { t: 'pen' as Tool, i: <Pencil size={14} />, l: 'ปากกา' },
            { t: 'eraser' as Tool, i: <Eraser size={14} />, l: 'ยางลบ' },
            { t: 'rect' as Tool, i: <Square size={14} />, l: 'สี่เหลี่ยม' },
            { t: 'circle' as Tool, i: <Circle size={14} />, l: 'วงกลม' },
            { t: 'text' as Tool, i: <Type size={14} />, l: 'ข้อความ' },
          ]).map(({ t, i, l }) => (
            <button
              key={t}
              className={`wb-tool ${tool === t ? 'active' : ''}`}
              onClick={() => setTool(t)}
              title={l}
            >
              {i}
            </button>
          ))}
        </div>
        <div className="wb-colors">
          {colors.map((c) => (
            <button
              key={c}
              className={`wb-color ${color === c ? 'active' : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
        <div className="wb-size">
          <span>ขนาด:</span>
          <input type="range" min="1" max="20" value={size} onChange={(e) => setSize(+e.target.value)} />
          <strong>{size}</strong>
        </div>
        <div className="wb-actions">
          <button onClick={undo} title="ย้อนกลับ"><Undo size={14} /></button>
          <button onClick={clear} title="ลบทั้งหมด" style={{ color: '#dc2626' }}><Trash2 size={14} /></button>
          <button onClick={download} title="ดาวน์โหลด"><Download size={14} /></button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={(e) => drawing && end(e)}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
        style={{
          background: 'white',
          border: '2px solid #e5e7eb',
          borderRadius: 12,
          width: '100%',
          maxWidth: '100%',
          height: 'auto',
          cursor: tool === 'eraser' ? 'cell' : 'crosshair',
          touchAction: 'none',
        }}
      />
    </div>
  );
};

export default Whiteboard;
