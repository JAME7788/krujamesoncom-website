import React, { useMemo, useState } from 'react';
import { Printer, Target, BookOpen, CalendarDays, ListChecks } from 'lucide-react';
import { findGrade } from '../data/curriculum';
import type { Unit } from '../data/curriculum';

// ผลลัพธ์การเรียนรู้ข้อ 5 (ตัวชี้วัดใหม่ที่เป็นหัวข้อใหญ่ของแผน)
const OUTCOME_5 =
  'ค้นหา คัดเลือก และจัดการข้อมูลจากแหล่งเรียนรู้หลากหลายหรือเทคโนโลยีพื้นฐาน เพื่อนำมาสนับสนุนการเรียนรู้ การแก้ปัญหาอย่างเป็นขั้นตอน และการอธิบายปรากฏการณ์ต่าง ๆ ได้อย่างมีประสิทธิภาพและปลอดภัย';

const GRADES: Array<{ id: string; label: string }> = [
  { id: 'p1', label: 'ป.1' }, { id: 'p2', label: 'ป.2' }, { id: 'p3', label: 'ป.3' },
  { id: 'p4', label: 'ป.4' }, { id: 'p5', label: 'ป.5' }, { id: 'p6', label: 'ป.6' },
];

// แบ่งคาบเรียน N คาบให้แต่ละหน่วยตามจำนวนหัวข้อ (ขั้นต่ำ 3 คาบ) รวมพอดี N
const allocate = (units: Unit[], total: number): number[] => {
  if (units.length === 0) return [];
  const w = units.map((u) => Math.max(1, u.topics?.length || 1));
  const sumW = w.reduce((a, b) => a + b, 0);
  const alloc = w.map((x) => Math.max(3, Math.round((total * x) / sumW)));
  let diff = total - alloc.reduce((a, b) => a + b, 0);
  const order = alloc.map((_, i) => i).sort((a, b) => w[b] - w[a]);
  let k = 0;
  while (diff !== 0 && k < 500) {
    const i = order[k % order.length];
    if (diff > 0) { alloc[i]++; diff--; } else if (alloc[i] > 3) { alloc[i]--; diff++; }
    k++;
  }
  return alloc;
};

interface Row { kind: 'special' | 'unit'; label: string; topics?: string[]; periods: number; sem: 1 | 2; }

const CoursePlan5: React.FC = () => {
  const [gradeId, setGradeId] = useState('p1');
  const grade = findGrade(gradeId);
  const units = useMemo(() => grade?.units || [], [grade]);

  const rows: Row[] = useMemo(() => {
    if (units.length === 0) return [];
    // แบ่งหน่วยเป็น 2 ภาคเรียน (ตามน้ำหนักหัวข้อ ~ครึ่ง/ครึ่ง)
    const totalTopics = units.reduce((s, u) => s + (u.topics?.length || 1), 0);
    let acc = 0; let splitAt = units.length;
    for (let i = 0; i < units.length; i++) {
      acc += units[i].topics?.length || 1;
      if (acc >= totalTopics / 2) { splitAt = i + 1; break; }
    }
    splitAt = Math.min(Math.max(1, splitAt), units.length - 1 || 1);
    const sem1Units = units.slice(0, splitAt);
    const sem2Units = units.slice(splitAt);
    const a1 = allocate(sem1Units, 18); // 20 - ปฐมนิเทศ(1) - สอบกลางภาค(1)
    const a2 = allocate(sem2Units, 18); // 20 - ทบทวน+สอบปลายภาค(2)
    const out: Row[] = [];
    out.push({ kind: 'special', label: 'ปฐมนิเทศรายวิชา ข้อตกลงในการเรียน และประเมินก่อนเรียน (Pre-test)', periods: 1, sem: 1 });
    sem1Units.forEach((u, i) => out.push({ kind: 'unit', label: `หน่วยที่ ${u.no}  ${u.title}`, topics: u.topics, periods: a1[i], sem: 1 }));
    out.push({ kind: 'special', label: 'ทบทวน และสอบวัดผลกลางภาคเรียน', periods: 1, sem: 1 });
    sem2Units.forEach((u, i) => out.push({ kind: 'unit', label: `หน่วยที่ ${u.no}  ${u.title}`, topics: u.topics, periods: a2[i], sem: 2 }));
    out.push({ kind: 'special', label: 'ทบทวน สรุปบทเรียน และสอบวัดผลปลายภาคเรียน', periods: 2, sem: 2 });
    return out;
  }, [units]);

  const gradeLabel = GRADES.find((g) => g.id === gradeId)?.label || '';
  const total = rows.reduce((s, r) => s + r.periods, 0);

  return (
    <div className="cp5">
      <div className="cp5-head no-print">
        <div>
          <h2><Target size={22} /> แผนการจัดการเรียนรู้ — ผลลัพธ์การเรียนรู้ข้อ 5</h2>
          <p>รายวิชาเทคโนโลยี (วิทยาการคำนวณ) ป.1–6 · แสดงเฉพาะหัวข้อที่สอน · 40 คาบ/ปี รวมการวัดผล</p>
        </div>
        <button className="cp5-print" onClick={() => window.print()}><Printer size={16} /> พิมพ์/บันทึก PDF</button>
      </div>

      <div className="cp5-tabs no-print">
        {GRADES.map((g) => (
          <button key={g.id} className={gradeId === g.id ? 'active' : ''} onClick={() => setGradeId(g.id)}>{g.label}</button>
        ))}
      </div>

      {/* หัวแผน */}
      <div className="cp5-card cp5-cover">
        <h3>รายวิชาเทคโนโลยี (วิทยาการคำนวณ)</h3>
        <div className="cp5-meta">
          <span>ชั้นประถมศึกษาปีที่ {gradeLabel.replace('ป.', '')}</span>
          <span>เวลา 40 ชั่วโมง (2 ภาคเรียน)</span>
          <span>1 คาบ / สัปดาห์</span>
          <span>รวมการวัดและประเมินผล</span>
          <span>โรงเรียนบ้านคลองมดแดง</span>
        </div>
        <div className="cp5-outcome">
          <strong><ListChecks size={16} /> ผลลัพธ์การเรียนรู้ที่มุ่งเน้น (ข้อ 5):</strong>
          <p>{OUTCOME_5}</p>
        </div>
      </div>

      {/* หน่วย + หัวข้อที่สอน (ไม่แสดงรหัสตัวชี้วัด) */}
      <div className="cp5-card">
        <h4><BookOpen size={18} /> หน่วยการเรียนรู้และหัวข้อที่สอน</h4>
        <div className="cp5-units">
          {units.map((u) => (
            <div key={u.no} className="cp5-unit">
              <div className="cp5-unit-title">หน่วยที่ {u.no}  {u.title}</div>
              {u.topics && u.topics.length > 0 && (
                <ul className="cp5-topics">{u.topics.map((t, i) => <li key={i}>{t}</li>)}</ul>
              )}
              {u.activities && u.activities.length > 0 && (
                <div className="cp5-acts"><span>กิจกรรมเด่น:</span> {u.activities[0]}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* กำหนดการสอน 40 คาบ */}
      <div className="cp5-card">
        <h4><CalendarDays size={18} /> โครงสร้างเวลาเรียนและกำหนดการจัดการเรียนรู้ ({total} คาบ)</h4>
        {[1, 2].map((sem) => (
          <div key={sem} className="cp5-sem">
            <div className="cp5-sem-title">ภาคเรียนที่ {sem} ({rows.filter((r) => r.sem === sem).reduce((s, r) => s + r.periods, 0)} คาบ)</div>
            <table className="cp5-table">
              <thead><tr><th style={{ width: '58%' }}>หน่วย / หัวข้อ / กิจกรรม</th><th>จำนวนคาบ</th></tr></thead>
              <tbody>
                {rows.filter((r) => r.sem === sem).map((r, i) => (
                  <tr key={i} className={r.kind === 'special' ? 'special' : ''}>
                    <td>
                      <div className="cp5-row-label">{r.label}</div>
                      {r.topics && <div className="cp5-row-topics">{r.topics.join(' · ')}</div>}
                    </td>
                    <td className="cp5-periods">{r.periods}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        <div className="cp5-total">รวมทั้งสิ้น {total} คาบ (สอนตามหัวข้อ + วัดและประเมินผลกลางภาคและปลายภาค)</div>
      </div>

      <style>{`
        .cp5 { font-family: 'Prompt', sans-serif; color: #1e293b; }
        .cp5-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
        .cp5-head h2 { margin: 0; font-size: 1.25rem; display: flex; align-items: center; gap: 8px; }
        .cp5-head p { margin: 4px 0 0; color: #64748b; font-size: 0.85rem; }
        .cp5-print { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 9px; border: 0; background: #6366f1; color: #fff; font-weight: 700; font-family: inherit; cursor: pointer; }
        .cp5-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }
        .cp5-tabs button { padding: 7px 16px; border-radius: 999px; border: 1.5px solid #e2e8f0; background: #fff; color: #475569; font-weight: 700; font-family: inherit; cursor: pointer; }
        .cp5-tabs button.active { border-color: #6366f1; background: #6366f1; color: #fff; }
        .cp5-card { background: #fff; border: 1px solid #eef1f6; border-radius: 14px; padding: 18px 20px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(15,23,42,0.04); }
        .cp5-card h4 { margin: 0 0 12px; font-size: 1.02rem; display: flex; align-items: center; gap: 8px; color: #334155; }
        .cp5-cover h3 { margin: 0 0 10px; font-size: 1.3rem; text-align: center; }
        .cp5-meta { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-bottom: 14px; }
        .cp5-meta span { background: #f1f5f9; color: #475569; padding: 4px 12px; border-radius: 999px; font-size: 0.8rem; font-weight: 600; }
        .cp5-outcome { background: linear-gradient(135deg, #eef2ff, #faf5ff); border: 1px solid #ddd6fe; border-radius: 10px; padding: 12px 16px; }
        .cp5-outcome strong { display: flex; align-items: center; gap: 6px; color: #4f46e5; font-size: 0.9rem; }
        .cp5-outcome p { margin: 6px 0 0; line-height: 1.7; }
        .cp5-units { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
        .cp5-unit { border: 1px solid #eef1f6; border-left: 4px solid #6366f1; border-radius: 10px; padding: 12px 14px; }
        .cp5-unit-title { font-weight: 800; color: #312e81; margin-bottom: 6px; }
        .cp5-topics { margin: 0; padding-left: 18px; }
        .cp5-topics li { font-size: 0.88rem; line-height: 1.6; color: #334155; }
        .cp5-acts { margin-top: 8px; font-size: 0.8rem; color: #64748b; }
        .cp5-acts span { font-weight: 700; color: #475569; }
        .cp5-sem { margin-bottom: 14px; }
        .cp5-sem-title { font-weight: 800; color: #0f766e; background: #ccfbf1; display: inline-block; padding: 3px 14px; border-radius: 999px; font-size: 0.85rem; margin-bottom: 8px; }
        .cp5-table { width: 100%; border-collapse: collapse; }
        .cp5-table th { background: #f1f5f9; color: #475569; text-align: left; padding: 8px 12px; font-size: 0.85rem; border: 1px solid #e2e8f0; }
        .cp5-table td { padding: 8px 12px; border: 1px solid #eef1f6; vertical-align: top; }
        .cp5-table tr.special td { background: #fffbeb; }
        .cp5-row-label { font-weight: 600; font-size: 0.9rem; }
        .cp5-row-topics { font-size: 0.78rem; color: #94a3b8; margin-top: 3px; }
        .cp5-periods { text-align: center; font-weight: 800; color: #4f46e5; white-space: nowrap; }
        .cp5-total { margin-top: 8px; text-align: right; font-weight: 700; color: #0f766e; }
        @media print {
          .no-print { display: none !important; }
          .cp5-card { box-shadow: none; break-inside: avoid; }
        }
      `}</style>
    </div>
  );
};

export default CoursePlan5;
