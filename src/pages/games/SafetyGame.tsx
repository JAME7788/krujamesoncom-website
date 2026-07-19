import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, RotateCcw, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useGameProgress } from '../../hooks/useGameProgress';

interface Scenario { emoji: string; text: string; safe: boolean; why: string }

const SCENARIOS: Scenario[] = [
  { emoji: '🔐', text: 'ตั้งรหัสผ่านยาก ๆ และไม่บอกใคร', safe: true, why: 'รหัสผ่านที่ดีช่วยปกป้องบัญชีของเรา' },
  { emoji: '🎁', text: 'คลิกลิงก์ "คุณได้รับรางวัล! กรอกข้อมูลด่วน"', safe: false, why: 'เป็นกลลวง (ฟิชชิ่ง) เพื่อขโมยข้อมูล' },
  { emoji: '🏠', text: 'โพสต์บอกที่อยู่บ้านและเบอร์โทรให้คนแปลกหน้า', safe: false, why: 'ข้อมูลส่วนตัวไม่ควรเปิดเผยกับคนไม่รู้จัก' },
  { emoji: '🙋', text: 'บอกผู้ปกครองเมื่อเจอข้อความน่ากลัวออนไลน์', safe: true, why: 'ปรึกษาผู้ใหญ่เมื่อไม่สบายใจเสมอ' },
  { emoji: '📥', text: 'ดาวน์โหลดเกมเถื่อนจากเว็บที่ไม่รู้จัก', safe: false, why: 'อาจมีไวรัส/มัลแวร์แฝงมา' },
  { emoji: '🤝', text: 'ขออนุญาตก่อนใช้ภาพของคนอื่นและให้เครดิต', safe: true, why: 'เคารพลิขสิทธิ์และเจ้าของผลงาน' },
  { emoji: '💬', text: 'นัดเจอคนที่รู้จักกันแค่ในเกมโดยไม่บอกใคร', safe: false, why: 'อันตราย! ต้องบอกผู้ปกครองก่อนเสมอ' },
  { emoji: '🚪', text: 'ออกจากระบบ (Log out) เมื่อใช้คอมพิวเตอร์ส่วนกลางเสร็จ', safe: true, why: 'ป้องกันคนอื่นเข้าถึงบัญชีของเรา' },
  { emoji: '📰', text: 'แชร์ข่าวทันทีโดยไม่ตรวจว่าจริงหรือปลอม', safe: false, why: 'ควรตรวจแหล่งที่มาก่อนแชร์เสมอ' },
  { emoji: '⏰', text: 'พักสายตาและเลิกเล่นตามเวลาที่ตกลงกับผู้ปกครอง', safe: true, why: 'ใช้เทคโนโลยีอย่างพอดีและมีวินัย' },
];

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

const SafetyGame: React.FC = () => {
  const recordGame = useGameProgress('safety', 'ปลอดภัยหรือไม่ปลอดภัยออนไลน์');
  const [order] = useState<Scenario[]>(() => shuffle(SCENARIOS));
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<boolean | null>(null);
  const [done, setDone] = useState(false);
  const cur = order[idx];

  const answer = (choice: boolean) => {
    if (answered !== null) return;
    const correct = choice === cur.safe;
    setAnswered(choice);
    if (correct) setScore((s) => s + 1);
    setTimeout(() => {
      if (idx + 1 >= order.length) {
        setDone(true);
        recordGame(score + (correct ? 1 : 0));
      } else {
        setIdx((i) => i + 1);
        setAnswered(null);
      }
    }, 1600);
  };

  const restart = () => { setIdx(0); setScore(0); setAnswered(null); setDone(false); };

  const isCorrect = answered !== null && answered === cur.safe;

  return (
    <div className="container section-padding" style={{ paddingTop: '5rem', maxWidth: 620, textAlign: 'center' }}>
      <Link to="/games" className="btn-ghost" style={{ float: 'left' }}><ChevronLeft size={16} /> เกมทั้งหมด</Link>
      <h1>🛡️ ปลอดภัยหรือไม่ปลอดภัย?</h1>
      <p style={{ color: '#6b7280' }}>อ่านสถานการณ์แล้วเลือก — ฝึกใช้เทคโนโลยีอย่างปลอดภัย (ป.4-ม.3)</p>

      {done ? (
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ fontSize: '3rem' }}>{score >= 8 ? '🏆' : score >= 6 ? '😃' : '💪'}</div>
          <h2>ได้ {score}/{order.length} คะแนน!</h2>
          <p>{score >= 8 ? 'สุดยอด! รู้เท่าทันภัยออนไลน์' : 'ทบทวนอีกนิด แล้วลองใหม่นะ'}</p>
          <button className="btn-primary" onClick={restart}><RotateCcw size={16} /> เล่นอีกครั้ง</button>
        </div>
      ) : (
        <>
          <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: 8 }}>
            ข้อ {idx + 1}/{order.length} • คะแนน {score}
          </div>
          <div className="card" style={{ padding: '2rem 1.5rem' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: 8 }}>{cur.emoji}</div>
            <p style={{ fontSize: '1.15rem', fontWeight: 600, minHeight: 56 }}>{cur.text}</p>

            {answered === null ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                <button onClick={() => answer(true)} style={btn('#22c55e')}>
                  <ShieldCheck size={22} /> ปลอดภัย
                </button>
                <button onClick={() => answer(false)} style={btn('#ef4444')}>
                  <ShieldAlert size={22} /> ไม่ปลอดภัย
                </button>
              </div>
            ) : (
              <div style={{
                marginTop: 12, padding: 14, borderRadius: 12,
                background: isCorrect ? '#dcfce7' : '#fee2e2',
                color: isCorrect ? '#166534' : '#991b1b',
              }}>
                <strong style={{ fontSize: '1.1rem' }}>
                  {isCorrect ? '✅ ถูกต้อง!' : '❌ ยังไม่ใช่'} — {cur.safe ? 'ปลอดภัย 👍' : 'ไม่ปลอดภัย ⚠️'}
                </strong>
                <p style={{ margin: '6px 0 0', fontSize: '0.9rem' }}>{cur.why}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const btn = (color: string): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  padding: '16px', borderRadius: 14, background: color, color: 'white', border: 0,
  fontFamily: 'inherit', fontSize: '1.1rem', fontWeight: 800, cursor: 'pointer',
});

export default SafetyGame;
