import React, { useState } from 'react';
import { Plus, Trash2, Megaphone, Pin } from 'lucide-react';
import {
  loadAnnouncements, createAnnouncement, deleteAnnouncement, updateAnnouncement,
} from '../services/announcementService';
import type { Announcement } from '../services/announcementService';
import { allClassrooms2569 } from '../data/students2569';

const AnnouncementManager: React.FC = () => {
  const [list, setList] = useState(loadAnnouncements());
  const [show, setShow] = useState(false);
  const [draft, setDraft] = useState<Partial<Announcement>>({
    title: '', body: '', type: 'info', emoji: '', classroom: '',
  });

  const reload = () => setList(loadAnnouncements());

  const submit = () => {
    if (!draft.title || !draft.body) {
      alert('กรอกหัวข้อและเนื้อหา');
      return;
    }
    createAnnouncement({
      title: draft.title!,
      body: draft.body!,
      type: draft.type || 'info',
      emoji: draft.emoji,
      classroom: draft.classroom || undefined,
      pinned: draft.pinned || false,
    });
    setDraft({ title: '', body: '', type: 'info', emoji: '', classroom: '' });
    setShow(false);
    reload();
  };

  const togglePin = (id: string, current: boolean) => {
    updateAnnouncement(id, { pinned: !current });
    reload();
  };

  const remove = (id: string) => {
    if (!confirm('ลบประกาศนี้?')) return;
    deleteAnnouncement(id);
    reload();
  };

  return (
    <div className="ann-mgr">
      <div className="filter-row">
        <button className="btn-primary" onClick={() => setShow(!show)}>
          <Plus size={16} /> {show ? 'ยกเลิก' : 'สร้างประกาศใหม่'}
        </button>
        <div style={{ marginLeft: 'auto', color: '#6b7280', fontSize: '0.85rem' }}>
          ทั้งหมด {list.length} ประกาศ
        </div>
      </div>

      {show && (
        <div className="sm-add-form" style={{ flexDirection: 'column' }}>
          <div className="filter-row" style={{ width: '100%' }}>
            <div className="filter-group">
              <label>ประเภท</label>
              <select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as Announcement['type'] })}>
                <option value="info">ℹ️ ข่าวสาร</option>
                <option value="warn">⚠️ แจ้งเตือน</option>
                <option value="urgent">🚨 ด่วน</option>
                <option value="celebration">🎉 ยินดี/ฉลอง</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Emoji (optional)</label>
              <input value={draft.emoji} onChange={(e) => setDraft({ ...draft, emoji: e.target.value })} placeholder="📣" style={{ width: 60 }} />
            </div>
            <div className="filter-group" style={{ flex: 1 }}>
              <label>หัวข้อ *</label>
              <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </div>
            <div className="filter-group">
              <label>สำหรับห้อง</label>
              <select value={draft.classroom} onChange={(e) => setDraft({ ...draft, classroom: e.target.value })}>
                <option value="">🌍 ทุกห้อง</option>
                {allClassrooms2569.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="filter-group" style={{ width: '100%' }}>
            <label>เนื้อหา *</label>
            <textarea
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              rows={3}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: 8, fontFamily: 'inherit' }}
            />
          </div>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
            <input type="checkbox" checked={draft.pinned} onChange={(e) => setDraft({ ...draft, pinned: e.target.checked })} />
            📌 ปักหมุดด้านบน (ไม่ให้ปิด)
          </label>
          <button className="btn-export" onClick={submit}>
            <Megaphone size={16} /> ประกาศเลย
          </button>
        </div>
      )}

      {list.length === 0 ? (
        <div className="empty-state-card">
          <Megaphone size={48} color="#9ca3af" />
          <h3>ยังไม่มีประกาศ</h3>
          <p>สร้างประกาศแรกเพื่อแจ้งข่าวให้นักเรียนทุกคน</p>
        </div>
      ) : (
        <div className="att-table-wrap">
          <table className="att-table">
            <thead>
              <tr>
                <th></th>
                <th>หัวข้อ</th>
                <th>ประเภท</th>
                <th>ห้อง</th>
                <th>วันที่</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((a) => (
                <tr key={a.id}>
                  <td className="text-center" style={{ fontSize: '1.4rem' }}>{a.emoji || '📣'}</td>
                  <td>
                    <strong>{a.title}</strong>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{a.body.slice(0, 80)}{a.body.length > 80 ? '...' : ''}</div>
                  </td>
                  <td>{a.type}</td>
                  <td>{a.classroom || 'ทุกห้อง'}</td>
                  <td style={{ fontSize: '0.78rem' }}>{new Date(a.createdAt).toLocaleDateString('th-TH')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="cb-icon-btn" onClick={() => togglePin(a.id, !!a.pinned)} title={a.pinned ? 'ยกเลิกหมุด' : 'ปักหมุด'}>
                        <Pin size={14} fill={a.pinned ? '#6366f1' : 'none'} color={a.pinned ? '#6366f1' : '#6b7280'} />
                      </button>
                      <button className="cb-icon-btn danger" onClick={() => remove(a.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AnnouncementManager;
