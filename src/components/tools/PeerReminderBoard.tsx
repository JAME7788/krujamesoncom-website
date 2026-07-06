import React, { useState, useEffect, useMemo } from 'react';
import { Pin, Calendar, User, Plus, CheckCircle, Trash2, Clock, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface StickyNote {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  author: string;
  classroom: string;
  color: 'yellow' | 'blue' | 'pink' | 'emerald';
  completed: boolean;
  createdAt: number;
}

const STORAGE_KEY = 'krujames_peer_reminders_v1';
const COLORS = {
  yellow: { bg: '#fef08a', border: '#facc15', text: '#854d0e', pin: '#eab308' },
  blue: { bg: '#bfdbfe', border: '#60a5fa', text: '#1e40af', pin: '#3b82f6' },
  pink: { bg: '#fbcfe8', border: '#f472b6', text: '#9d174d', pin: '#ec4899' },
  emerald: { bg: '#a7f3d0', border: '#34d399', text: '#065f46', pin: '#10b981' }
};

const PeerReminderBoard: React.FC = () => {
  const { user } = useAuth();
  
  // Set default class based on logged in student, or "ป.1"
  const defaultClass = user?.classroom || 'ป.1';
  
  const [selectedClass, setSelectedClass] = useState<string>(defaultClass);
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form states
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [author, setAuthor] = useState(user?.name.split(' ')[0] || '');
  const [noteColor, setNoteColor] = useState<'yellow' | 'blue' | 'pink' | 'emerald'>('yellow');

  // Load notes on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setNotes(JSON.parse(raw));
    } catch (e) {
      console.error('Failed to load sticky notes', e);
    }
  }, []);

  // Save notes
  const saveNotes = (list: StickyNote[]) => {
    setNotes(list);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save sticky notes', e);
    }
  };

  // Filter notes for the selected classroom
  const filteredNotes = useMemo(() => {
    return notes.filter(n => n.classroom === selectedClass);
  }, [notes, selectedClass]);

  // Divide notes into pending and completed
  const pendingNotes = useMemo(() => filteredNotes.filter(n => !n.completed), [filteredNotes]);
  const completedNotes = useMemo(() => filteredNotes.filter(n => n.completed), [filteredNotes]);

  // Create new note
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subject.trim() || !dueDate.trim() || !author.trim()) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    const newNote: StickyNote = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title,
      subject,
      dueDate,
      author,
      classroom: selectedClass,
      color: noteColor,
      completed: false,
      createdAt: Date.now()
    };

    saveNotes([newNote, ...notes]);
    
    // Reset Form
    setTitle('');
    setSubject('');
    setDueDate('');
    setAuthor(user?.name.split(' ')[0] || '');
    setNoteColor('yellow');
    setShowAddForm(false);
  };

  // Toggle completed state
  const handleToggleCompleted = (id: string) => {
    const updated = notes.map(n => {
      if (n.id === id) {
        return { ...n, completed: !n.completed };
      }
      return n;
    });
    saveNotes(updated);
  };

  // Delete note
  const handleDeleteNote = (id: string) => {
    if (confirm('คุณต้องการลบข้อความเตือนความจำนี้ใช่หรือไม่?')) {
      saveNotes(notes.filter(n => n.id !== id));
    }
  };

  return (
    <div className="board-container">
      {/* Header and Class Selector */}
      <div className="section-header-board">
        <div className="title-block">
          <Pin className="header-icon" size={24} style={{ transform: 'rotate(30deg)' }} />
          <div>
            <h3>กระดานเตือนความจำเพื่อนช่วยเพื่อน</h3>
            <p>เขียนโน้ตเตือนการบ้าน วันสอบ หรือกิจกรรมของชั้นเรียน</p>
          </div>
        </div>

        <div className="header-actions">
          <button onClick={() => setShowAddForm(true)} className="btn-add-note">
            <Plus size={16} /> แปะโน้ตใหม่
          </button>
          
          <div className="class-selector">
            <span className="select-label">เลือกระดับชั้น:</span>
            <select 
              value={selectedClass} 
              onChange={(e) => setSelectedClass(e.target.value)}
              className="custom-select"
            >
              {['ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6', 'ม.1', 'ม.2', 'ม.3'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Add Note Form Modal popup */}
      {showAddForm && (
        <div className="form-modal-overlay">
          <div className="form-modal-card scale-in">
            <h4>📌 แปะโน้ตเตือนความจำใหม่</h4>
            <form onSubmit={handleAddNote} className="add-note-form">
              <div className="form-group">
                <label>หัวข้อ/รายละเอียดงาน</label>
                <input
                  type="text"
                  placeholder="เช่น ทำใบงานเรื่องสายอักขระ, สอบท้ายบทวิทย์..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={50}
                  required
                />
              </div>

              <div className="form-row-2col">
                <div className="form-group">
                  <label>วิชา</label>
                  <input
                    type="text"
                    placeholder="เช่น วิทยาการคำนวณ, คณิตศาสตร์..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    maxLength={20}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>กำหนดส่ง</label>
                  <input
                    type="text"
                    placeholder="เช่น พรุ่งนี้เช้า, ศุกร์ที่ 15..."
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    maxLength={20}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>ชื่อผู้เขียนโน้ต</label>
                <input
                  type="text"
                  placeholder="ใส่ชื่อหรือชื่อเล่นผู้เขียน..."
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  maxLength={15}
                  required
                />
              </div>

              <div className="form-group">
                <label>เลือกสีโน้ตโพสต์อิท</label>
                <div className="color-selector">
                  {Object.keys(COLORS).map((c) => {
                    const typedC = c as 'yellow' | 'blue' | 'pink' | 'emerald';
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNoteColor(typedC)}
                        className={`color-btn-choice ${noteColor === typedC ? 'selected' : ''}`}
                        style={{ backgroundColor: COLORS[typedC].bg, borderColor: COLORS[typedC].border }}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="modal-form-actions">
                <button type="submit" className="btn-confirm-add">
                  เขียนลงบอร์ด
                </button>
                <button type="button" onClick={() => setShowAddForm(false)} className="btn-cancel-add">
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Board Columns (Pending vs Completed) */}
      <div className="board-grid">
        {/* Pending column */}
        <div className="board-column">
          <div className="board-column-header">
            <AlertCircle size={16} className="text-yellow" />
            <h4>📌 งานที่ยังค้างอยู่ ({pendingNotes.length})</h4>
          </div>

          <div className="board-column-body">
            {pendingNotes.length === 0 ? (
              <div className="empty-board-col">
                <p>ไชโย! ตอนนี้ไม่มีงานตกค้างใดๆ เลย 🎉</p>
              </div>
            ) : (
              <div className="sticky-notes-grid">
                {pendingNotes.map((n) => {
                  const style = COLORS[n.color];
                  return (
                    <div 
                      key={n.id} 
                      className="sticky-note" 
                      style={{ backgroundColor: style.bg, borderColor: style.border, color: style.text }}
                    >
                      <div className="note-pin" style={{ backgroundColor: style.pin }}></div>
                      <div className="note-content">
                        <span className="note-subject font-semibold">[{n.subject}]</span>
                        <p className="note-title">{n.title}</p>
                        
                        <div className="note-meta-block">
                          <span className="note-meta-item">
                            <Calendar size={11} /> ส่ง: {n.dueDate}
                          </span>
                          <span className="note-meta-item">
                            <User size={11} /> ผู้เขียน: {n.author}
                          </span>
                        </div>
                      </div>
                      <div className="note-actions">
                        <button 
                          onClick={() => handleToggleCompleted(n.id)}
                          className="action-btn-note check" 
                          title="ทำเสร็จแล้ว"
                        >
                          <Check size={12} /> ส่งแล้ว
                        </button>
                        <button 
                          onClick={() => handleDeleteNote(n.id)}
                          className="action-btn-note delete" 
                          title="ลบโน้ต"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Completed column */}
        <div className="board-column">
          <div className="board-column-header">
            <CheckCircle size={16} className="text-emerald" />
            <h4>✅ งานที่ส่งเรียบร้อยแล้ว ({completedNotes.length})</h4>
          </div>

          <div className="board-column-body">
            {completedNotes.length === 0 ? (
              <div className="empty-board-col">
                <p>ยังไม่มีประวัติการส่งงานที่ถูกติ๊กบันทึก</p>
              </div>
            ) : (
              <div className="sticky-notes-grid">
                {completedNotes.map((n) => {
                  const style = COLORS[n.color];
                  return (
                    <div 
                      key={n.id} 
                      className="sticky-note completed-note" 
                      style={{ backgroundColor: style.bg, borderColor: style.border, color: style.text }}
                    >
                      <div className="note-pin" style={{ backgroundColor: style.pin }}></div>
                      <div className="note-content">
                        <span className="note-subject font-semibold">[{n.subject}]</span>
                        <p className="note-title">{n.title}</p>
                        
                        <div className="note-meta-block">
                          <span className="note-meta-item">
                            <Calendar size={11} /> ส่งเมื่อ: {n.dueDate}
                          </span>
                          <span className="note-meta-item">
                            <User size={11} /> ผู้เขียน: {n.author}
                          </span>
                        </div>
                      </div>
                      <div className="note-actions">
                        <button 
                          onClick={() => handleToggleCompleted(n.id)}
                          className="action-btn-note revert" 
                          title="ดึงกลับมาทำใหม่"
                        >
                          <Clock size={12} /> ค้างส่งใหม่
                        </button>
                        <button 
                          onClick={() => handleDeleteNote(n.id)}
                          className="action-btn-note delete" 
                          title="ลบโน้ต"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .board-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          font-family: 'Prompt', sans-serif;
        }
        .section-header-board {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          background: white;
          padding: 1.25rem 1.5rem;
          border-radius: 1.25rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          border: 1px solid #f1f5f9;
        }
        .btn-add-note {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: #6366f1;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-add-note:hover {
          background: #4f46e5;
        }
        .form-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.5);
          backdrop-filter: blur(4px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
        }
        .form-modal-card {
          background: white;
          border-radius: 1.5rem;
          padding: 2rem;
          max-width: 450px;
          width: 100%;
          border: 1px solid #f1f5f9;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }
        .form-modal-card h4 {
          margin: 0 0 1.25rem;
          font-size: 1.05rem;
          font-weight: 600;
          color: #1e293b;
        }
        .add-note-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .add-note-form input {
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          font-size: 0.88rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .add-note-form input:focus {
          border-color: #6366f1;
        }
        .color-selector {
          display: flex;
          gap: 10px;
          margin-top: 4px;
        }
        .color-btn-choice {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid white;
          outline: 1px solid #cbd5e1;
          cursor: pointer;
          transition: transform 0.1s;
        }
        .color-btn-choice.selected {
          outline: 2px solid #6366f1;
          transform: scale(1.1);
        }
        .modal-form-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 1rem;
        }
        .btn-confirm-add {
          background: #6366f1;
          color: white;
          border: none;
          padding: 10px;
          border-radius: 8px;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
        }
        .btn-confirm-add:hover { background: #4f46e5; }
        .btn-cancel-add {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #cbd5e1;
          padding: 10px;
          border-radius: 8px;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
        }
        .btn-cancel-add:hover { background: #e2e8f0; }
        .board-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        @media (max-width: 900px) {
          .board-grid {
            grid-template-columns: 1fr;
          }
        }
        .board-column {
          background: #f8fafc;
          border-radius: 1.5rem;
          border: 1px solid #f1f5f9;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          min-height: 480px;
        }
        .board-column-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 1.25rem;
          padding-bottom: 8px;
          border-bottom: 2px solid #e2e8f0;
        }
        .board-column-header h4 {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 600;
          color: #1e293b;
        }
        .board-column-body {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .empty-board-col {
          text-align: center;
          padding: 3rem;
          color: #94a3b8;
          font-size: 0.88rem;
          margin: auto;
        }
        .sticky-notes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1.25rem;
        }
        .sticky-note {
          position: relative;
          padding: 1.5rem 1rem 1rem;
          border-radius: 4px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.04);
          transform: rotate(-1.5deg);
          transition: transform 0.2s, box-shadow 0.2s;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 180px;
        }
        .sticky-note:nth-child(even) {
          transform: rotate(2deg);
        }
        .sticky-note:nth-child(3n) {
          transform: rotate(-0.8deg);
        }
        .sticky-note:hover {
          transform: scale(1.02) rotate(0deg);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          z-index: 2;
        }
        .note-pin {
          position: absolute;
          top: 6px;
          left: 50%;
          transform: translateX(-50%);
          width: 10px;
          height: 10px;
          border-radius: 50%;
          box-shadow: 0 2px 2px rgba(0,0,0,0.15);
        }
        .note-content {
          margin-bottom: 12px;
        }
        .note-subject {
          font-size: 0.72rem;
          letter-spacing: 0.3px;
          opacity: 0.85;
          text-transform: uppercase;
        }
        .note-title {
          margin: 6px 0 12px;
          font-size: 0.88rem;
          font-weight: 500;
          line-height: 1.4;
        }
        .note-meta-block {
          display: flex;
          flex-direction: column;
          gap: 3px;
          font-size: 0.72rem;
          opacity: 0.75;
          border-top: 1px dashed rgba(0,0,0,0.1);
          padding-top: 6px;
        }
        .note-meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .completed-note {
          opacity: 0.68;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .completed-note .note-title {
          text-decoration: line-through;
        }
        .note-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 6px;
          margin-top: auto;
          border-top: 1px solid rgba(0,0,0,0.06);
          padding-top: 8px;
        }
        .action-btn-note {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 4px 6px;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 500;
          cursor: pointer;
          border: none;
          background: rgba(255, 255, 255, 0.45);
          color: inherit;
          transition: background 0.2s;
        }
        .action-btn-note:hover {
          background: rgba(255, 255, 255, 0.8);
        }
        .action-btn-note.delete {
          flex: 0 0 26px;
          max-width: 26px;
        }
        .action-btn-note.delete:hover {
          background: #fee2e2;
          color: #b91c1c;
        }
      `}</style>
    </div>
  );
};

export default PeerReminderBoard;
