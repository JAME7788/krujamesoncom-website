import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, RotateCcw, CheckCircle2, XCircle, Search } from 'lucide-react';
import { useGameProgress } from '../../hooks/useGameProgress';
import './GameStyles.css';

interface Question {
  goal: string;
  options: { query: string; correct: boolean }[];
  why: string;
}

const QUESTIONS: Question[] = [
  {
    goal: 'อยากรู้วิธีปลูกมะเขือเทศในกระถางที่บ้าน',
    options: [
      { query: 'ผัก', correct: false },
      { query: 'วิธีปลูกมะเขือเทศในกระถาง', correct: true },
      { query: 'มะเขือเทศ', correct: false },
    ],
    why: 'คำค้นที่ดีต้อง “เฉพาะเจาะจง” และตรงประเด็น — ยิ่งบอกสิ่งที่อยากรู้ชัด ยิ่งได้ผลตรง',
  },
  {
    goal: 'ต้องการดาวน์โหลด "ใบงานคณิต ป.6" ที่เป็นไฟล์ PDF',
    options: [
      { query: 'ใบงานคณิต ป.6', correct: false },
      { query: 'ใบงานคณิต ป.6 filetype:pdf', correct: true },
      { query: 'ใบงาน pdf เยอะๆ', correct: false },
    ],
    why: 'ใช้ filetype:pdf เพื่อกรองเฉพาะไฟล์ PDF — ระบุชนิดไฟล์ช่วยให้เจอไฟล์ที่ต้องการเร็วขึ้น',
  },
  {
    goal: 'หาข้อมูลการคัดแยกขยะจากเว็บไซต์หน่วยงานราชการ (น่าเชื่อถือ)',
    options: [
      { query: 'คัดแยกขยะ', correct: false },
      { query: 'คัดแยกขยะ site:go.th', correct: true },
      { query: 'ขยะ pantip', correct: false },
    ],
    why: 'ใช้ site:go.th เพื่อค้นเฉพาะเว็บราชการ (.go.th) — ระบุประเภทเว็บช่วยคัดแหล่งที่น่าเชื่อถือ',
  },
  {
    goal: 'อยากได้ผลลัพธ์ที่มีวลี "สุริยุปราคาเต็มดวง" แบบเป๊ะ ๆ ติดกัน',
    options: [
      { query: 'สุริยุปราคา เต็มดวง', correct: false },
      { query: '"สุริยุปราคาเต็มดวง"', correct: true },
      { query: 'สุริยุปราคาเต็มดวงคืออะไรบ้าง', correct: false },
    ],
    why: 'ใส่เครื่องหมายคำพูด " " ครอบวลี เพื่อค้นหาคำที่เรียงติดกันเป๊ะ ๆ ตามที่พิมพ์',
  },
  {
    goal: 'ค้นเรื่อง "จูปิเตอร์" (ดาวพฤหัส) แต่ไม่อยากได้ผลเรื่องรถยนต์ยี่ห้อจูปิเตอร์',
    options: [
      { query: 'จูปิเตอร์', correct: false },
      { query: 'จูปิเตอร์ -รถ -มอเตอร์ไซค์', correct: true },
      { query: 'จูปิเตอร์ รถ', correct: false },
    ],
    why: 'ใช้เครื่องหมายลบ (-) หน้าคำที่ไม่ต้องการ เพื่อตัดผลลัพธ์ที่ไม่เกี่ยวออกไป',
  },
  {
    goal: 'ต้องการประเมินว่าข้อมูลจากเว็บ “น่าเชื่อถือ” ควรดูอะไรก่อน',
    options: [
      { query: 'ดูว่าใครเป็นผู้จัดทำ เผยแพร่เมื่อใด และมีการอ้างอิงไหม', correct: true },
      { query: 'ดูว่ามีรูปสวยหรือไม่', correct: false },
      { query: 'ดูว่าเว็บโหลดเร็วไหม', correct: false },
    ],
    why: 'คัดเลือกข้อมูลต้องดูความน่าเชื่อถือ: ผู้จัดทำ วันที่เผยแพร่ และการอ้างอิงแหล่งที่มา',
  },
  {
    goal: 'ต้องการค้นหาคู่มือการใช้โปรแกรม Scratch จากเว็บไซต์ สสวท.',
    options: [
      { query: 'Scratch', correct: false },
      { query: 'คู่มือ Scratch site:ipst.ac.th', correct: true },
      { query: 'เกม Scratch สนุก', correct: false },
    ],
    why: 'ระบุหัวข้อและใช้ site:ipst.ac.th เพื่อจำกัดผลลัพธ์ให้อยู่ในเว็บไซต์ของ สสวท.',
  },
  {
    goal: 'ต้องการภาพที่อนุญาตให้นำไปทำรายงาน ควรทำอย่างไร',
    options: [
      { query: 'ค้นภาพแล้วใช้รูปแรกทันที', correct: false },
      { query: 'ใช้ตัวกรองสิทธิ์การใช้งานและอ่านเงื่อนไขของภาพ', correct: true },
      { query: 'ตัดชื่อเจ้าของภาพออกก่อนใช้', correct: false },
    ],
    why: 'ภาพบนอินเทอร์เน็ตมีเจ้าของ ควรตรวจสิทธิ์การใช้งานและระบุแหล่งที่มาตามเงื่อนไข',
  },
  {
    goal: 'พบข่าวว่าวันพรุ่งนี้โรงเรียนหยุด ควรตรวจสอบอย่างไรก่อนแชร์',
    options: [
      { query: 'แชร์เข้ากลุ่มทันทีเพื่อเตือนเพื่อน', correct: false },
      { query: 'ตรวจประกาศจากโรงเรียนและเปรียบเทียบวันเวลาของข่าว', correct: true },
      { query: 'เชื่อเพราะมีคนส่งต่อจำนวนมาก', correct: false },
    ],
    why: 'ข้อมูลสำคัญต้องตรวจจากแหล่งต้นทาง ดูวันที่ และเทียบกับแหล่งที่น่าเชื่อถือก่อนแชร์',
  },
  {
    goal: 'ต้องการข้อมูลสภาพอากาศวันนี้ของจังหวัดเชียงใหม่',
    options: [
      { query: 'อากาศ', correct: false },
      { query: 'สภาพอากาศเชียงใหม่ วันนี้ กรมอุตุนิยมวิทยา', correct: true },
      { query: 'เชียงใหม่สวยไหม', correct: false },
    ],
    why: 'คำค้นควรมีสถานที่ เวลา และแหล่งข้อมูลที่เกี่ยวข้อง เพื่อให้ได้ข้อมูลปัจจุบันและตรงพื้นที่',
  },
  {
    goal: 'ต้องการค้นคำว่า Python ที่หมายถึงภาษาเขียนโปรแกรม ไม่ใช่งู',
    options: [
      { query: 'Python', correct: false },
      { query: 'Python ภาษาโปรแกรม -งู', correct: true },
      { query: 'งู Python', correct: false },
    ],
    why: 'เพิ่มคำขยายความและใช้ -งู เพื่อตัดความหมายที่ไม่ต้องการออกจากผลการค้นหา',
  },
  {
    goal: 'ต้องการค้นข้อมูลที่เผยแพร่ในช่วงปีล่าสุด ควรตรวจอะไร',
    options: [
      { query: 'ดูวันที่เผยแพร่หรือวันที่ปรับปรุง และใช้ตัวกรองเวลา', correct: true },
      { query: 'เลือกเว็บที่มีตัวอักษรใหญ่ที่สุด', correct: false },
      { query: 'เลือกผลลัพธ์ลำดับแรกเสมอ', correct: false },
    ],
    why: 'ข้อมูลบางเรื่องเปลี่ยนแปลงเร็ว จึงต้องดูวันที่และใช้ตัวกรองช่วงเวลาให้เหมาะสม',
  },
  {
    goal: 'ต้องการคำตอบเรื่องสุขภาพที่นำไปใช้จริง ควรเลือกแหล่งใด',
    options: [
      { query: 'โพสต์ที่ไม่มีชื่อผู้เขียนแต่มีคนกดถูกใจมาก', correct: false },
      { query: 'เว็บไซต์หน่วยงานสาธารณสุขหรือโรงพยาบาลที่ระบุผู้เชี่ยวชาญ', correct: true },
      { query: 'ข้อความโฆษณาที่รับรองว่าเห็นผลทันที', correct: false },
    ],
    why: 'เรื่องสุขภาพควรใช้แหล่งจากหน่วยงานหรือผู้เชี่ยวชาญ และไม่ใช้ข้อมูลออนไลน์แทนคำแนะนำของแพทย์',
  },
  {
    goal: 'มีข้อมูลจากสองเว็บไซต์ไม่ตรงกัน ควรทำอย่างไร',
    options: [
      { query: 'เลือกข้อมูลที่ตนเองชอบ', correct: false },
      { query: 'ตรวจหลักฐาน ผู้เขียน วันที่ และหาแหล่งที่สามมาเปรียบเทียบ', correct: true },
      { query: 'นำทั้งสองข้อมูลมารวมกันโดยไม่ตรวจ', correct: false },
    ],
    why: 'การตรวจสอบข้ามแหล่งช่วยลดความผิดพลาดและทำให้ตัดสินใจจากหลักฐานได้ดีขึ้น',
  },
  {
    goal: 'จะนำข้อมูลจากเว็บไซต์ไปเขียนรายงาน ควรทำสิ่งใด',
    options: [
      { query: 'คัดลอกทั้งหมดโดยไม่บอกที่มา', correct: false },
      { query: 'สรุปด้วยภาษาของตนเองและบันทึกชื่อแหล่งข้อมูล', correct: true },
      { query: 'เปลี่ยนคำเพียงหนึ่งคำแล้วถือว่าเป็นของตนเอง', correct: false },
    ],
    why: 'ควรสรุปความเข้าใจด้วยภาษาของตนเอง อ้างอิงแหล่งที่มา และเคารพลิขสิทธิ์',
  },
];

const shuffle = <T,>(items: T[]): T[] => {
  const output = [...items];
  for (let i = output.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [output[i], output[j]] = [output[j], output[i]];
  }
  return output;
};

const makeSession = () => shuffle(QUESTIONS.map((_, qIdx) => qIdx)).map((qIdx) => {
  const order = QUESTIONS[qIdx].options.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  return { qIdx, order };
});

const SearchSmartGame: React.FC = () => {
  const [session, setSession] = useState(makeSession);
  const [roundIndex, setRoundIndex] = useState(0);
  const [done, setDone] = useState(false);
  const round = session[roundIndex];
  const q = QUESTIONS[round.qIdx];
  const options = round.order.map((oi) => ({ ...q.options[oi], i: oi }));
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(() => parseInt(localStorage.getItem('kj_search_best') || '0', 10));
  const recordGame = useGameProgress('search-smart', 'นักสืบคำค้น');

  const answered = picked !== null;
  const correct = answered && q.options[picked!].correct;

  const choose = (origIdx: number) => {
    if (answered) return;
    recordGame(score);
    setPicked(origIdx);
    if (q.options[origIdx].correct) {
      setScore((s) => s + 10);
      setStreak((st) => { const ns = st + 1; if (ns > best) { setBest(ns); localStorage.setItem('kj_search_best', String(ns)); } return ns; });
    } else setStreak(0);
  };

  const next = () => {
    if (roundIndex + 1 >= session.length) {
      setDone(true);
      void recordGame(score);
      return;
    }
    setRoundIndex((value) => value + 1);
    setPicked(null);
  };

  const restart = () => {
    setSession(makeSession());
    setRoundIndex(0);
    setPicked(null);
    setScore(0);
    setStreak(0);
    setDone(false);
  };

  return (
    <div className="game-page">
      <div className="game-topbar">
        <Link to="/games" className="game-back"><ChevronLeft size={18} /> เกมทั้งหมด</Link>
        <h2>🔎 นักสืบคำค้น</h2>
      </div>

      <div className="game-stats">
        <div className="gstat">🏆 คะแนน: <strong>{score}</strong></div>
        <div className="gstat">📚 ข้อ: <strong>{Math.min(roundIndex + 1, session.length)}/{session.length}</strong></div>
        <div className="gstat">🔥 ติดต่อกัน: <strong>{streak}</strong></div>
        <div className="gstat">🎯 ดีที่สุด: <strong>{best}</strong></div>
      </div>

      <div className="binary-card ss-card">
        <div className="ss-goal"><span className="ss-goal-tag">เป้าหมายการค้นหา</span><p>{q.goal}</p></div>
        <div className="ss-hint">เลือก “คำค้น” ที่ดีและตรงที่สุด 👇</div>

        <div className="ss-options">
          {options.map((o) => {
            const isPicked = picked === o.i;
            const cls = !answered ? '' : o.correct ? 'right' : isPicked ? 'wrong' : 'dim';
            return (
              <button key={o.i} className={`ss-opt ${cls}`} onClick={() => choose(o.i)} disabled={answered}>
                <Search size={15} className="ss-opt-icon" />
                <code>{o.query}</code>
                {answered && o.correct && <CheckCircle2 size={17} className="ss-mark ok" />}
                {answered && isPicked && !o.correct && <XCircle size={17} className="ss-mark no" />}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className={`puzzle-result ${correct ? 'success' : 'fail'}`}>
            {correct ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
            <span>{correct ? 'ถูกต้อง! +10 คะแนน — ' : 'ยังไม่ใช่ที่ดีที่สุด — '}{q.why}</span>
          </div>
        )}

        <div className="puzzle-actions">
          {answered && !done && (
            <button className="btn-game-start" onClick={next}>
              <RotateCcw size={16} /> {roundIndex + 1 >= session.length ? 'ดูผลการเล่น' : 'ข้อต่อไป →'}
            </button>
          )}
          {done && (
            <div className="puzzle-result success">
              <CheckCircle2 size={20} />
              <span>ทำครบ {session.length} ข้อ ได้ {score}/{session.length * 10} คะแนน</span>
              <button className="btn-game-start" type="button" onClick={restart}><RotateCcw size={16} /> เล่นชุดใหม่</button>
            </div>
          )}
        </div>
      </div>

      <div className="game-tips">
        💡 <strong>เทคนิคค้นหาเก่ง:</strong> ใช้คำเฉพาะเจาะจง · <code>"วลี"</code> ค้นเป๊ะ · <code>-คำ</code> ตัดออก · <code>filetype:pdf</code> เลือกชนิดไฟล์ · <code>site:go.th</code> เลือกเว็บ แล้วอย่าลืม<b>ประเมินความน่าเชื่อถือ</b>ก่อนใช้ข้อมูล
      </div>

      <style>{`
        .ss-card { max-width: 620px; }
        .ss-goal { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 14px 16px; margin-bottom: 12px; }
        .ss-goal-tag { display: inline-block; background: #2563eb; color: #fff; font-size: 0.72rem; font-weight: 700; padding: 2px 10px; border-radius: 999px; }
        .ss-goal p { margin: 8px 0 0; font-size: 1.05rem; font-weight: 600; color: #1e3a8a; line-height: 1.5; }
        .ss-hint { text-align: center; color: #64748b; font-size: 0.85rem; margin-bottom: 12px; }
        .ss-options { display: flex; flex-direction: column; gap: 10px; }
        .ss-opt { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: 10px; border: 2px solid #e2e8f0; background: #fff; cursor: pointer; text-align: left; font-family: inherit; transition: all 0.1s; }
        .ss-opt:hover:not(:disabled) { border-color: #93c5fd; background: #f8fafc; }
        .ss-opt code { font-family: 'JetBrains Mono', Consolas, monospace; font-size: 0.92rem; color: #0f172a; flex: 1; }
        .ss-opt-icon { color: #94a3b8; flex-shrink: 0; }
        .ss-opt.right { border-color: #22c55e; background: #dcfce7; }
        .ss-opt.wrong { border-color: #ef4444; background: #fee2e2; }
        .ss-opt.dim { opacity: 0.55; }
        .ss-mark { flex-shrink: 0; }
        .ss-mark.ok { color: #16a34a; }
        .ss-mark.no { color: #dc2626; }
      `}</style>
    </div>
  );
};

export default SearchSmartGame;
