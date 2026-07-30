import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, RotateCcw, CheckCircle2 } from 'lucide-react';
import { useGameProgress } from '../../hooks/useGameProgress';
import './GameStyles.css';

interface Task { title: string; emoji: string; steps: { emoji: string; text: string }[] }

const TASKS: Task[] = [
  { title: 'แปรงฟัน', emoji: '🪥', steps: [
    { emoji: '🫧', text: 'บีบยาสีฟันลงแปรง' },
    { emoji: '🪥', text: 'แปรงฟันให้ทั่ว' },
    { emoji: '💧', text: 'บ้วนน้ำล้างปาก' },
    { emoji: '😁', text: 'ยิ้มฟันสะอาด' },
  ] },
  { title: 'ล้างมือ', emoji: '🧼', steps: [
    { emoji: '💧', text: 'เปิดน้ำ ทำมือให้เปียก' },
    { emoji: '🧼', text: 'ถูสบู่ให้ทั่ว' },
    { emoji: '🫧', text: 'ล้างน้ำให้สะอาด' },
    { emoji: '🧻', text: 'เช็ดมือให้แห้ง' },
  ] },
  { title: 'เปิดคอมพิวเตอร์', emoji: '💻', steps: [
    { emoji: '🔌', text: 'เสียบปลั๊กไฟ' },
    { emoji: '⏻', text: 'กดปุ่มเปิดเครื่อง' },
    { emoji: '⏳', text: 'รอเครื่องเปิด' },
    { emoji: '🖥️', text: 'เข้าใช้งานได้' },
  ] },
  { title: 'ปลูกต้นไม้', emoji: '🌱', steps: [
    { emoji: '🕳️', text: 'ขุดหลุมในดิน' },
    { emoji: '🌱', text: 'วางต้นกล้าลงหลุม' },
    { emoji: '🪴', text: 'กลบดินให้แน่น' },
    { emoji: '💧', text: 'รดน้ำให้ชุ่ม' },
  ] },
  { title: 'บันทึกไฟล์งาน', emoji: '💾', steps: [
    { emoji: '📝', text: 'สร้างหรือแก้ไขชิ้นงาน' },
    { emoji: '💾', text: 'กดคำสั่งบันทึก' },
    { emoji: '🏷️', text: 'ตั้งชื่อไฟล์ให้สื่อความหมาย' },
    { emoji: '📁', text: 'เลือกโฟลเดอร์แล้วกดยืนยัน' },
  ] },
  { title: 'ค้นข้อมูลอย่างปลอดภัย', emoji: '🔎', steps: [
    { emoji: '❓', text: 'กำหนดเรื่องที่ต้องการค้น' },
    { emoji: '⌨️', text: 'พิมพ์คำค้นที่เฉพาะเจาะจง' },
    { emoji: '🧭', text: 'เลือกแหล่งข้อมูลที่น่าเชื่อถือ' },
    { emoji: '✅', text: 'ตรวจสอบก่อนนำข้อมูลไปใช้' },
  ] },
  { title: 'ส่งการบ้านออนไลน์', emoji: '📤', steps: [
    { emoji: '📄', text: 'ตรวจชิ้นงานและชื่อไฟล์' },
    { emoji: '🌐', text: 'เปิดหน้าส่งการบ้าน' },
    { emoji: '📎', text: 'แนบไฟล์ที่ถูกต้อง' },
    { emoji: '✅', text: 'กดส่งและตรวจสถานะสำเร็จ' },
  ] },
  { title: 'ถ่ายภาพด้วยแท็บเล็ต', emoji: '📷', steps: [
    { emoji: '📷', text: 'เปิดแอปกล้องถ่ายภาพ' },
    { emoji: '🎯', text: 'จัดวัตถุให้อยู่ในกรอบภาพ' },
    { emoji: '🔘', text: 'กดปุ่มถ่ายภาพ' },
    { emoji: '🖼️', text: 'เปิดดูและเลือกภาพที่ชัดเจน' },
  ] },
  { title: 'แก้ปัญหาโปรแกรม', emoji: '🐞', steps: [
    { emoji: '▶️', text: 'ทดลองรันโปรแกรม' },
    { emoji: '🔍', text: 'หาขั้นตอนที่ให้ผลไม่ถูกต้อง' },
    { emoji: '🛠️', text: 'แก้คำสั่งที่ผิด' },
    { emoji: '✅', text: 'รันซ้ำและตรวจผลอีกครั้ง' },
  ] },
  { title: 'สร้างงานนำเสนอ', emoji: '📊', steps: [
    { emoji: '💡', text: 'กำหนดหัวข้อและผู้ชม' },
    { emoji: '🗂️', text: 'รวบรวมข้อมูลและภาพที่ใช้ได้' },
    { emoji: '🖥️', text: 'จัดข้อความและภาพลงสไลด์' },
    { emoji: '🎤', text: 'ตรวจความถูกต้องและซ้อมนำเสนอ' },
  ] },
  { title: 'พิมพ์เอกสาร', emoji: '🖨️', steps: [
    { emoji: '📄', text: 'เปิดเอกสารที่ต้องการพิมพ์' },
    { emoji: '👀', text: 'ตรวจตัวอย่างก่อนพิมพ์' },
    { emoji: '⚙️', text: 'เลือกเครื่องพิมพ์และจำนวนหน้า' },
    { emoji: '🖨️', text: 'กดพิมพ์และรับเอกสาร' },
  ] },
  { title: 'ปิดคอมพิวเตอร์อย่างถูกวิธี', emoji: '⏻', steps: [
    { emoji: '💾', text: 'บันทึกงานที่กำลังทำ' },
    { emoji: '❎', text: 'ปิดโปรแกรมที่เปิดอยู่' },
    { emoji: '⏻', text: 'เลือกคำสั่งปิดเครื่อง' },
    { emoji: '⌛', text: 'รอจนเครื่องดับสนิท' },
  ] },
];

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

const StepSort: React.FC = () => {
  const recordGame = useGameProgress('step-sort', 'เรียงขั้นตอนด้วยรูป');
  const [taskIdx, setTaskIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const task = TASKS[taskIdx];

  const [pool, setPool] = useState<number[]>(() => shuffle(TASKS[0].steps.map((_, i) => i)));
  const [placed, setPlaced] = useState<number[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);

  const expectedNext = placed.length; // ต้องวาง index เท่ากับจำนวนที่วางแล้ว (0,1,2,3)

  const clickStep = (stepIndex: number) => {
    if (stepIndex === expectedNext) {
      setPlaced((p) => [...p, stepIndex]);
      setPool((p) => p.filter((x) => x !== stepIndex));
      setWrong(null);
      if (placed.length + 1 === task.steps.length) {
        // จบ task นี้
        setScore((s) => s + 1);
        setTimeout(() => nextTask(), 800);
      }
    } else {
      setWrong(stepIndex);
      setTimeout(() => setWrong(null), 500);
    }
  };

  const nextTask = () => {
    if (taskIdx + 1 >= TASKS.length) {
      setDone(true);
      recordGame(score + 1);
      return;
    }
    const ni = taskIdx + 1;
    setTaskIdx(ni);
    setPool(shuffle(TASKS[ni].steps.map((_, i) => i)));
    setPlaced([]);
    setWrong(null);
  };

  const restart = () => {
    setTaskIdx(0); setScore(0); setDone(false);
    setPool(shuffle(TASKS[0].steps.map((_, i) => i))); setPlaced([]); setWrong(null);
  };

  const orderedPool = useMemo(() => pool, [pool]);

  return (
    <div className="game-page compact-game-page" style={{ maxWidth: 620, textAlign: 'center' }}>
      <Link to="/games" className="btn-ghost" style={{ float: 'left' }}><ChevronLeft size={16} /> เกมทั้งหมด</Link>
      <h1>🔢 เรียงขั้นตอนด้วยรูป</h1>
      <p style={{ color: '#6b7280' }}>กดการ์ดให้ถูกลำดับ 1 → 2 → 3 → 4 (ฝึกคิดเป็นขั้นตอน) — ป.1-3</p>

      {done ? (
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ fontSize: '3rem' }}>{score >= Math.ceil(TASKS.length * 0.8) ? '🏆' : '😃'}</div>
          <h2>เรียงถูก {score}/{TASKS.length} เรื่อง!</h2>
          <p>เก่งมาก! การเรียงขั้นตอนคือพื้นฐานของ "อัลกอริทึม"</p>
          <button className="btn-primary" onClick={restart}><RotateCcw size={16} /> เล่นอีกครั้ง</button>
        </div>
      ) : (
        <>
          <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: 8 }}>
            เรื่อง {taskIdx + 1}/{TASKS.length}
          </div>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ margin: '0 0 4px' }}>{task.emoji} {task.title}</h2>
            <p style={{ color: '#6b7280', margin: '0 0 14px', fontSize: '0.88rem' }}>กดตามลำดับที่ควรทำก่อน-หลัง</p>

            {/* ช่องที่วางแล้ว */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16, minHeight: 60 }}>
              {placed.map((si, pos) => (
                <div key={si} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px',
                  background: '#dcfce7', border: '2px solid #22c55e', borderRadius: 12, fontSize: '0.9rem', fontWeight: 700,
                }}>
                  <span style={{ background: '#16a34a', color: 'white', borderRadius: 999, width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>{pos + 1}</span>
                  <span style={{ fontSize: '1.3rem' }}>{task.steps[si].emoji}</span>
                  {task.steps[si].text}
                </div>
              ))}
              {placed.length === 0 && <span style={{ color: '#9ca3af', alignSelf: 'center' }}>เลือกขั้นแรกด้านล่าง ↓</span>}
            </div>

            {/* การ์ดให้เลือก */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              {orderedPool.map((si) => (
                <button
                  key={si}
                  onClick={() => clickStep(si)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    padding: '14px 12px', borderRadius: 14, minWidth: 110, cursor: 'pointer',
                    background: wrong === si ? '#fee2e2' : 'white',
                    border: '2px solid ' + (wrong === si ? '#ef4444' : '#e5e7eb'),
                    fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 600,
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: '2rem' }}>{task.steps[si].emoji}</span>
                  {task.steps[si].text}
                </button>
              ))}
            </div>
            {placed.length === task.steps.length && (
              <div style={{ marginTop: 12, color: '#16a34a', fontWeight: 700 }}>
                <CheckCircle2 size={16} style={{ verticalAlign: 'middle' }} /> ถูกต้อง! ไปเรื่องต่อไป...
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default StepSort;
