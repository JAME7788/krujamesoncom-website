import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Calendar as CalIcon } from 'lucide-react';
import {
  loadEvents, createEvent, deleteEvent, eventTypeInfo, fetchEventsFromFirebase,
} from '../services/calendarService';
import type { CalendarEvent, EventType } from '../services/calendarService';
import { allClassrooms2569 } from '../data/students2569';

const CalendarManager: React.FC = () => {
  const [list, setList] = useState(loadEvents());
  const [show, setShow] = useState(false);
  const [syncing, setSyncing] = useState(true);
  const [draft, setDraft] = useState<Partial<CalendarEvent>>({
    title: '', desc: '', type: 'homework', date: new Date().toISOString().split('T')[0],
    time: '', classroom: '', emoji: '', url: '',
  });

  const reload = () => setList(loadEvents());

  useEffect(() => {
    let cancelled = false;
    fetchEventsFromFirebase()
      .then((events) => { if (!cancelled) setList(events); })
      .finally(() => { if (!cancelled) setSyncing(false); });
    return () => { cancelled = true; };
  }, []);

  const submit = async () => {
    if (!draft.title || !draft.date) {
      alert('กรอกหัวข้อและวันที่');
      return;
    }
    setSyncing(true);
    try {
      await createEvent({
      title: draft.title,
      desc: draft.desc,
      type: draft.type as EventType || 'homework',
      date: draft.date,
      time: draft.time,
      classroom: draft.classroom || undefined,
      emoji: draft.emoji || eventTypeInfo[draft.type as EventType || 'homework'].emoji,
      url: draft.url,
      });
      setDraft({ title: '', desc: '', type: 'homework', date: new Date().toISOString().split('T')[0], time: '', classroom: '', emoji: '', url: '' });
      setShow(false);
      reload();
    } catch {
      alert('บันทึกกิจกรรมไม่สำเร็จ กรุณาตรวจอินเทอร์เน็ต');
    } finally {
      setSyncing(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('ลบกิจกรรมนี้?')) return;
    setSyncing(true);
    try { await deleteEvent(id); reload(); }
    finally { setSyncing(false); }
  };

  const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div>
      <div className="filter-row">
        <button className="btn-primary" onClick={() => setShow(!show)}>
          <Plus size={16} /> {show ? 'ยกเลิก' : 'เพิ่มกิจกรรม'}
        </button>
        <div style={{ marginLeft: 'auto', color: '#6b7280', fontSize: '0.85rem' }}>
          ทั้งหมด {list.length} กิจกรรม
        </div>
      </div>

      {show && (
        <div className="sm-add-form" style={{ flexDirection: 'column' }}>
          <div className="filter-row" style={{ width: '100%' }}>
            <div className="filter-group">
              <label>ประเภท</label>
              <select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as EventType })}>
                {Object.entries(eventTypeInfo).map(([k, v]) => (
                  <option key={k} value={k}>{v.emoji} {v.label}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>วันที่ *</label>
              <input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
            </div>
            <div className="filter-group">
              <label>เวลา</label>
              <input type="time" value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })} />
            </div>
            <div className="filter-group">
              <label>ห้อง</label>
              <select value={draft.classroom} onChange={(e) => setDraft({ ...draft, classroom: e.target.value })}>
                <option value="">🌍 ทุกห้อง</option>
                {allClassrooms2569.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="filter-row" style={{ width: '100%' }}>
            <div className="filter-group" style={{ flex: 1 }}>
              <label>หัวข้อ *</label>
              <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="เช่น สอบกลางภาค ม.2" />
            </div>
            <div className="filter-group" style={{ flex: 1 }}>
              <label>คำอธิบาย</label>
              <input value={draft.desc} onChange={(e) => setDraft({ ...draft, desc: e.target.value })} placeholder="รายละเอียด (optional)" />
            </div>
            <div className="filter-group" style={{ flex: 1 }}>
              <label>ลิงก์</label>
              <input value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} placeholder="/curriculum/p5/unit/3" />
            </div>
          </div>
          <button className="btn-export" onClick={() => void submit()} disabled={syncing}>
            <CalIcon size={16} /> {syncing ? 'กำลังบันทึก...' : 'เพิ่มกิจกรรม'}
          </button>
        </div>
      )}

      {list.length === 0 ? (
        <div className="empty-state-card">
          <CalIcon size={48} color="#9ca3af" />
          <h3>ยังไม่มีกิจกรรม</h3>
          <p>เพิ่มกำหนดส่งงาน, สอบ, กิจกรรมพิเศษ — นักเรียนจะเห็นบน Dashboard</p>
        </div>
      ) : (
        <div className="att-table-wrap">
          <table className="att-table">
            <thead>
              <tr>
                <th>วันที่</th>
                <th>ประเภท</th>
                <th>หัวข้อ</th>
                <th>ห้อง</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((e) => {
                const info = eventTypeInfo[e.type];
                return (
                  <tr key={e.id}>
                    <td><strong>{e.date}</strong>{e.time && <small style={{ display: 'block' }}>{e.time}</small>}</td>
                    <td><span style={{ background: `${info.color}20`, color: info.color, padding: '2px 8px', borderRadius: 999, fontSize: '0.78rem', fontWeight: 700 }}>{info.emoji} {info.label}</span></td>
                    <td><strong>{e.emoji || info.emoji}</strong> {e.title}{e.desc && <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{e.desc}</div>}</td>
                    <td>{e.classroom || 'ทุกห้อง'}</td>
                    <td>
                      <button className="cb-icon-btn danger" disabled={syncing} onClick={() => void remove(e.id)}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CalendarManager;
