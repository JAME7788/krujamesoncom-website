import React, { useState } from 'react';
import { PenTool, Sparkles, Pin, Users } from 'lucide-react';
import Whiteboard from '../components/Whiteboard';
import RosterSpinner from '../components/tools/RosterSpinner';
import GroupMaker from '../components/tools/GroupMaker';
import PeerReminderBoard from '../components/tools/PeerReminderBoard';

type TabType = 'whiteboard' | 'spinner' | 'groups' | 'board';

const Tools: React.FC = () => {
  const [tab, setTab] = useState<TabType>('whiteboard');

  return (
    <div className="container section-padding" style={{ paddingTop: '6rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <span className="badge-yellow">🛠️ เครื่องมือช่วยสอนในคาบเรียน</span>
        <h1>เครื่องมือสร้างสรรค์และจัดกิจกรรมหน้าชั้นเรียน</h1>
        <p style={{ color: '#6b7280', marginBottom: 6 }}>
          กระดานวาดรูป วงล้อสุ่มชื่อ สุ่มแบ่งกลุ่ม และบอร์ดเตือนความจำสำหรับชั่วโมงเรียนคอมพิวเตอร์
        </p>
        <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0 }}>
          * หมายเหตุ: เครื่องมือนี้ใช้ประกอบกิจกรรมในคาบเรียน (ไม่นับคะแนนทักษะ P อัตโนมัติ) ส่วนระบบออมเงินและเวรประจำวันให้ใช้งานผ่านระบบหลักของโรงเรียน
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          justifyContent: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          className={tab === 'whiteboard' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setTab('whiteboard')}
        >
          <PenTool size={16} /> กระดานวาดรูป (Whiteboard)
        </button>
        <button
          type="button"
          className={tab === 'spinner' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setTab('spinner')}
        >
          <Sparkles size={16} /> วงล้อสุ่มชื่อ (Spinner)
        </button>
        <button
          type="button"
          className={tab === 'groups' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setTab('groups')}
        >
          <Users size={16} /> สุ่มแบ่งกลุ่ม (Groups)
        </button>
        <button
          type="button"
          className={tab === 'board' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setTab('board')}
        >
          <Pin size={16} /> บอร์ดเตือนความจำ (Board)
        </button>
      </div>

      <div className="card">
        {tab === 'whiteboard' && <Whiteboard />}
        {tab === 'spinner' && <RosterSpinner />}
        {tab === 'groups' && <GroupMaker />}
        {tab === 'board' && <PeerReminderBoard />}
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
        .wb-tool.active, .wb-tool:hover, .wb-actions button:hover { border-color: #B45309; color: #B45309; }
        .wb-tool.active { background: #FFF9E6; }
        .wb-color {
          width: 22px; height: 22px; border-radius: 50%;
          border: 2px solid white; outline: 1px solid #e5e7eb; cursor: pointer;
        }
        .wb-color.active { outline: 3px solid #B45309; }
        .wb-size { display: flex; align-items: center; gap: 6px; font-size: 0.78rem; }
        .wb-size input { width: 80px; }
      `}</style>
    </div>
  );
};

export default Tools;
