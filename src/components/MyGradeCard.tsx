import React, { useEffect, useMemo, useState } from 'react';
import { Award } from 'lucide-react';
import {
  loadGrades, getSubjectsForClassroom, computeBreakdown, computeGrade,
  fetchClassroomFromFirebase, saveGrades,
} from '../services/gradeService';
import type { Subject, StudentGrade } from '../services/gradeService';

interface Props {
  classroom: string;
  studentNumber: string;
  name: string;
}

interface SubjectCard {
  subjectId: Subject;
  title: string;
  emoji: string;
  k: number;
  p: number;
  a: number;
  collected: number;
  exam: number;
  total: number;
  grade: string;
}

const MyGradeCard: React.FC<Props> = ({ classroom, studentNumber, name }) => {
  // ดึงคะแนนล่าสุดจาก Firebase ตอน mount (เผื่อเครื่องใหม่ที่ localStorage ว่าง)
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const subjects = getSubjectsForClassroom(classroom);
    Promise.all(subjects.map((s) => fetchClassroomFromFirebase(classroom, s.id).then((data) => {
      if (!cancelled && data && data.length > 0) saveGrades(classroom, data, s.id);
    }))).then(() => {
      if (!cancelled) setRevision((r) => r + 1);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [classroom]);

  const cards = useMemo<SubjectCard[]>(() => {
    void revision;
    const subjects = getSubjectsForClassroom(classroom);
    const out: SubjectCard[] = [];
    subjects.forEach((s) => {
      const grades = loadGrades(classroom, s.id);
      const me: StudentGrade | undefined = grades.find(
        (g) => g.studentNo === Number(studentNumber) || g.name === name
      );
      if (!me) return;
      const b = computeBreakdown(me, classroom, s.id);
      out.push({
        subjectId: s.id,
        title: s.title,
        emoji: s.emoji,
        k: b.k,
        p: b.p,
        a: b.a,
        collected: b.collected,
        exam: b.exam,
        total: b.total,
        grade: computeGrade(me, classroom, s.id),
      });
    });
    return out;
  }, [classroom, studentNumber, name, revision]);

  // Empty state — บอกชัดเจน ไม่ใช่ซ่อนเฉยๆ
  if (cards.length === 0) {
    return (
      <div className="my-grade-card glass" style={{
        padding: 20, borderRadius: 16, marginBottom: 20,
        background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(168,85,247,0.06))',
        border: '1px dashed rgba(99,102,241,0.3)', textAlign: 'center',
      }}>
        <Award size={28} color="#6366f1" />
        <h3 style={{ margin: '8px 0 4px', fontSize: '1rem' }}>คะแนนของฉัน — ปีการศึกษา 2569</h3>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.85rem' }}>
          ยังไม่มีคะแนน — เริ่มเรียนได้เลย คะแนนจะปรากฏที่นี่อัตโนมัติ
        </p>
      </div>
    );
  }

  return (
    <div className="my-grade-card glass" style={{
      padding: 20, borderRadius: 16, marginBottom: 20,
      background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.08))',
      border: '1px solid rgba(99,102,241,0.18)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Award size={20} color="#6366f1" />
        <h3 style={{ margin: 0, fontSize: '1.05rem' }}>คะแนนของฉัน — ปีการศึกษา 2569</h3>
      </div>

      <div style={{
        display: 'grid', gap: 12,
        gridTemplateColumns: cards.length > 1 ? 'repeat(auto-fit, minmax(260px, 1fr))' : '1fr',
      }}>
        {cards.map((c) => (
          <div key={c.subjectId} style={{
            background: 'white', borderRadius: 12, padding: 14,
            border: '1px solid #e5e7eb',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{c.emoji} วิชา</div>
                <strong style={{ fontSize: '0.95rem' }}>{c.title}</strong>
              </div>
              <div style={{
                textAlign: 'center', padding: '4px 14px',
                background: gradeColor(c.grade), color: 'white',
                borderRadius: 999, fontWeight: 800, fontSize: '1.1rem',
              }}>
                {c.grade}
              </div>
            </div>

            <Bar label="K ความรู้" value={c.k} max={42} color="#3b82f6" />
            <Bar label="P ทักษะ" value={c.p} max={17.5} color="#a855f7" />
            <Bar label="A คุณลักษณะ" value={c.a} max={10.5} color="#22c55e" />

            <div style={{
              display: 'flex', justifyContent: 'space-between',
              marginTop: 10, paddingTop: 10,
              borderTop: '1px dashed #e5e7eb', fontSize: '0.85rem',
            }}>
              <span>เก็บ <strong>{c.collected.toFixed(1)}</strong>/70 + สอบ <strong>{c.exam.toFixed(1)}</strong>/30</span>
              <strong style={{ color: '#1f2937' }}>รวม {c.total.toFixed(1)}</strong>
            </div>
          </div>
        ))}
      </div>
      <small style={{ display: 'block', marginTop: 8, color: '#6b7280', fontSize: '0.75rem' }}>
        อัปเดตอัตโนมัติจากการเรียน เกม Live Quiz การบ้าน และเครื่องมือต่างๆ
      </small>
    </div>
  );
};

const gradeColor = (g: string): string => {
  const n = parseFloat(g);
  if (n >= 3.5) return '#16a34a';
  if (n >= 2.5) return '#0ea5e9';
  if (n >= 1.5) return '#f59e0b';
  if (n >= 1) return '#f97316';
  return '#9ca3af';
};

const Bar: React.FC<{ label: string; value: number; max: number; color: string }> = ({ label, value, max, color }) => {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#6b7280', marginBottom: 2 }}>
        <span>{label}</span>
        <span>{value.toFixed(1)} / {max.toFixed(1)}</span>
      </div>
      <div style={{ height: 8, background: '#f3f4f6', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.4s' }} />
      </div>
    </div>
  );
};

export default MyGradeCard;
