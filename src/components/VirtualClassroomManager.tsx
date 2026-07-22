import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  CheckCircle2,
  DoorClosed,
  DoorOpen,
  Gamepad2,
  MonitorPlay,
  Presentation,
  RefreshCw,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {
  defaultVirtualRoomState,
  subscribeVirtualRoomState,
  subscribeWorldActivityEvents,
  subscribeWorldPlayers,
  updateVirtualRoomState,
} from '../services/virtualClassroomService';
import type {
  VirtualRoomState,
  WorldActivityEvent,
  WorldPlayer,
  WorldSyncMode,
} from '../services/virtualClassroomService';
import './VirtualClassroomManager.css';

const CLASSROOMS = ['ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6', 'ม.1', 'ม.2', 'ม.3'];
const roomIdFor = (classroom: string) => `class-${classroom.replace(/[^0-9ก-๙]/g, '')}`;

const VirtualClassroomManager: React.FC = () => {
  const [classroom, setClassroom] = useState('ป.1');
  const roomId = roomIdFor(classroom);
  const [room, setRoom] = useState<VirtualRoomState>(() => defaultVirtualRoomState(roomId, classroom));
  const [players, setPlayers] = useState<WorldPlayer[]>([]);
  const [events, setEvents] = useState<WorldActivityEvent[]>([]);
  const [syncMode, setSyncMode] = useState<WorldSyncMode>('connecting');

  useEffect(() => {
    const stopRoom = subscribeVirtualRoomState(roomId, classroom, setRoom, setSyncMode);
    const stopPlayers = subscribeWorldPlayers(roomId, setPlayers, setSyncMode);
    const stopEvents = subscribeWorldActivityEvents(roomId, setEvents);
    return () => {
      stopRoom();
      stopPlayers();
      stopEvents();
    };
  }, [classroom, roomId]);

  const todayEvents = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return events.filter((event) => event.createdAt >= start.getTime());
  }, [events]);

  const rows = useMemo(() => {
    const byPlayer = new Map<string, {
      id: string;
      name: string;
      slide: number;
      question: number;
      game: number;
      artifact: number;
      lastAt: number;
    }>();
    todayEvents.forEach((event) => {
      const row = byPlayer.get(event.playerId) || {
        id: event.playerId,
        name: event.playerName,
        slide: 0,
        question: 0,
        game: 0,
        artifact: 0,
        lastAt: 0,
      };
      row[event.kind] += 1;
      row.lastAt = Math.max(row.lastAt, event.createdAt);
      byPlayer.set(event.playerId, row);
    });
    players.filter((player) => player.role !== 'teacher').forEach((player) => {
      if (!byPlayer.has(player.id)) {
        byPlayer.set(player.id, {
          id: player.id,
          name: player.name,
          slide: 0,
          question: 0,
          game: 0,
          artifact: 0,
          lastAt: player.updatedAt,
        });
      }
    });
    return Array.from(byPlayer.values()).sort((a, b) => b.lastAt - a.lastAt);
  }, [players, todayEvents]);

  const counts = useMemo(() => ({
    online: players.filter((player) => player.role !== 'teacher' && player.joinStatus !== 'blocked').length,
    waiting: players.filter((player) => player.joinStatus === 'waiting').length,
    completed: rows.filter((row) => row.slide >= 4 && row.question >= 1 && row.game >= 1 && row.artifact >= 3).length,
    evidence: todayEvents.length,
  }), [players, rows, todayEvents.length]);

  const update = (patch: Partial<VirtualRoomState>) => {
    void updateVirtualRoomState(roomId, classroom, patch, 'admin_teacher_account');
  };

  return (
    <div className="vcm">
      <header className="vcm-header">
        <div>
          <h2><MonitorPlay size={24} /> ห้องเรียน 3D แบบออนไลน์</h2>
          <p>ควบคุมห้องและติดตามหลักฐานการเรียนรู้ K/P/A ที่เกิดขึ้นวันนี้</p>
        </div>
        <div className="vcm-header-actions">
          <label>ชั้นเรียน<select value={classroom} onChange={(event) => setClassroom(event.target.value)}>{CLASSROOMS.map((item) => <option key={item}>{item}</option>)}</select></label>
          <Link to="/world"><MonitorPlay size={17} /> เข้าห้อง 3D</Link>
        </div>
      </header>

      <div className={`vcm-sync ${syncMode}`}><RefreshCw size={14} /> {syncMode === 'firebase' ? 'ข้อมูลออนไลน์หลายเครื่อง' : syncMode === 'local' ? 'ข้อมูลสำรองในเครื่อง' : 'กำลังเชื่อมต่อ'}</div>

      <div className="vcm-kpis">
        <span><Users /><b>{counts.online}</b>ออนไลน์</span>
        <span><ShieldCheck /><b>{counts.waiting}</b>รออนุมัติ</span>
        <span><CheckCircle2 /><b>{counts.completed}</b>ผ่านภารกิจ</span>
        <span><Presentation /><b>{counts.evidence}</b>หลักฐานวันนี้</span>
      </div>

      <section className="vcm-controls">
        <h3>สถานะห้องเรียน</h3>
        <div>
          <button className={room.isOpen ? 'active' : ''} onClick={() => update({ isOpen: !room.isOpen })}>{room.isOpen ? <DoorOpen /> : <DoorClosed />}<span><b>เปิดรับนักเรียน</b><small>{room.isOpen ? 'เปิดอยู่' : 'ปิดอยู่'}</small></span></button>
          <button className={room.movementLocked ? 'active' : ''} onClick={() => update({ movementLocked: !room.movementLocked })}><ShieldCheck /><span><b>พักการเดิน</b><small>{room.movementLocked ? 'ล็อกอยู่' : 'เดินได้'}</small></span></button>
          <button className={room.buildLocked ? 'active' : ''} onClick={() => update({ buildLocked: !room.buildLocked })}><Box /><span><b>ปิดโหมดสร้าง</b><small>{room.buildLocked ? 'ปิดอยู่' : 'สร้างได้'}</small></span></button>
          <button className={room.requireApproval ? 'active' : ''} onClick={() => update({ requireApproval: !room.requireApproval })}><Users /><span><b>อนุมัติก่อนเข้า</b><small>{room.requireApproval ? 'เปิดใช้' : 'ไม่บังคับ'}</small></span></button>
        </div>
      </section>

      <section className="vcm-table-section">
        <div><h3>หลักฐานรายคนวันนี้</h3><small>ครบเมื่ออ่านสไลด์ 4 หน้า ตอบถูก 1 ข้อ เล่นเกม 1 เกม และสร้างผลงาน 3 แบบ</small></div>
        <div className="vcm-table-wrap">
          <table>
            <thead><tr><th>นักเรียน</th><th>สไลด์</th><th>K คำถาม</th><th>P เกม</th><th>P ผลงาน</th><th>สถานะ</th><th>ล่าสุด</th></tr></thead>
            <tbody>
              {rows.length === 0 ? <tr><td colSpan={7}>ยังไม่มีหลักฐานในวันนี้</td></tr> : rows.map((row) => {
                const complete = row.slide >= 4 && row.question >= 1 && row.game >= 1 && row.artifact >= 3;
                return <tr key={row.id}><td>{row.name}</td><td>{row.slide}/4</td><td>{row.question}/1</td><td>{row.game}/1</td><td>{row.artifact}/3</td><td><span className={complete ? 'complete' : 'progress'}>{complete ? 'ผ่านภารกิจ' : 'กำลังทำ'}</span></td><td>{row.lastAt ? new Date(row.lastAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '—'}</td></tr>;
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="vcm-feed">
        <h3><Gamepad2 size={18} /> กิจกรรมล่าสุด</h3>
        {todayEvents.length === 0 ? <p>ยังไม่มีกิจกรรมในวันนี้</p> : todayEvents.slice(0, 12).map((event) => (
          <div key={event.id}><span className={event.kind}>{event.kind}</span><b>{event.playerName}</b><p>{event.detail}</p><time>{new Date(event.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</time></div>
        ))}
      </section>
    </div>
  );
};

export default VirtualClassroomManager;
