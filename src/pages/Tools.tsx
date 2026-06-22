import React, { useEffect, useRef, useState } from 'react';
import { PenTool, Code2 } from 'lucide-react';
import Whiteboard from '../components/Whiteboard';
import CodingSandbox from '../components/CodingSandbox';
import { useAuth } from '../context/AuthContext';
import { trackMediaClick } from '../services/progressService';
import { syncStudentGradesFromProgress } from '../services/gameProgressService';
import { classroomToGradeIds } from '../services/gradeService';

const Tools: React.FC = () => {
  const [tab, setTab] = useState<'whiteboard' | 'sandbox'>('whiteboard');
  const { user } = useAuth();
  const seenRef = useRef<Set<string>>(new Set());

  // นับการใช้เครื่องมือเป็น "กิจกรรมทักษะ" (P skill points) — บันทึก 1 ครั้งต่อ tool ต่อ session
  useEffect(() => {
    if (!user || user.id === 'admin_teacher_account') return;
    if (seenRef.current.has(tab)) return;
    const gradeId = classroomToGradeIds(user.classroom)[0];
    if (!gradeId) return;
    seenRef.current.add(tab);
    const detail = tab === 'whiteboard' ? '[Tool] Whiteboard' : '[Tool] Coding Sandbox';
    void trackMediaClick(user.id, gradeId, 1, 'fun', detail).then(() => {
      syncStudentGradesFromProgress({
        id: user.id,
        name: user.name,
        classroom: user.classroom,
        studentNumber: user.studentNumber,
      });
    });
  }, [tab, user]);

  return (
    <div className="container section-padding" style={{ paddingTop: '6rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <span className="badge-yellow">🛠️ เครื่องมือเสริม</span>
        <h1>เครื่องมือสร้างสรรค์</h1>
        <p style={{ color: '#6b7280' }}>วาดบนกระดาน + เขียนโค้ดทดลอง — ไม่ต้องลงโปรแกรม</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: '1.5rem' }}>
        <button
          className={tab === 'whiteboard' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setTab('whiteboard')}
        >
          <PenTool size={16} /> Whiteboard
        </button>
        <button
          className={tab === 'sandbox' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setTab('sandbox')}
        >
          <Code2 size={16} /> Coding Sandbox
        </button>
      </div>

      <div className="card">
        {tab === 'whiteboard' ? <Whiteboard /> : <CodingSandbox />}
      </div>

      <style>{`
        .whiteboard { display: flex; flex-direction: column; gap: 10px; }
        .wb-toolbar {
          display: flex; gap: 12px; padding: 10px 12px;
          background: #f9fafb; border-radius: 10px;
          flex-wrap: wrap; align-items: center;
        }
        .wb-tools, .wb-colors, .wb-actions { display: flex; gap: 4px; }
        .wb-tool, .wb-actions button {
          width: 32px; height: 32px;
          border: 1px solid #e5e7eb; background: white;
          border-radius: 8px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
        }
        .wb-tool.active, .wb-tool:hover, .wb-actions button:hover { border-color: #6366f1; color: #6366f1; }
        .wb-tool.active { background: #eef2ff; }
        .wb-color {
          width: 22px; height: 22px; border-radius: 50%;
          border: 2px solid white; outline: 1px solid #e5e7eb; cursor: pointer;
        }
        .wb-color.active { outline: 3px solid #6366f1; }
        .wb-size { display: flex; align-items: center; gap: 6px; font-size: 0.78rem; }
        .wb-size input { width: 80px; }
      `}</style>
    </div>
  );
};

export default Tools;
