import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus, Trash2, Edit3, Save, X, Users, Search,
  Download, RefreshCw, ArrowRightLeft, ListOrdered,
} from 'lucide-react';
import {
  loadRoster, addStudent, updateStudent, deleteStudent,
  moveStudent, renumberClassroom, resetClassroom, downloadRosterCSV,
} from '../services/rosterService';
import { allClassrooms2569 } from '../data/students2569';
import type { StudentInfo } from '../data/students2569';

const emojiOptions = ['👦', '👧', '🧒', '👨', '👩', '🧑', '👶', '👨‍🎓', '👩‍🎓'];

const StudentManager: React.FC = () => {
  const [classroom, setClassroom] = useState<string>('ป.1');
  const [list, setList] = useState<StudentInfo[]>([]);
  const [search, setSearch] = useState('');
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  // form state
  const [draft, setDraft] = useState<Partial<StudentInfo>>({
    name: '', studentCode: '', emoji: '👦',
  });

  const reload = () => setList(loadRoster(classroom));

  useEffect(() => {
    reload();
    setSearch('');
    setEditingCode(null);
    setShowAdd(false);
  }, [classroom]);

  const filtered = useMemo(() => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.studentCode.includes(q) ||
        String(s.no).includes(q)
    );
  }, [list, search]);

  const handleAdd = () => {
    if (!draft.name?.trim()) {
      alert('กรอกชื่อก่อน');
      return;
    }
    addStudent(classroom, {
      name: draft.name.trim(),
      studentCode: draft.studentCode?.trim() || `s${Date.now()}`,
      emoji: draft.emoji || '👦',
    });
    setDraft({ name: '', studentCode: '', emoji: '👦' });
    setShowAdd(false);
    reload();
  };

  const handleSave = (code: string, patch: Partial<StudentInfo>) => {
    updateStudent(classroom, code, patch);
    setEditingCode(null);
    reload();
  };

  const handleDelete = (s: StudentInfo) => {
    if (!confirm(`ลบ "${s.name}" (เลข ${s.no})?\nคะแนนที่บันทึกไว้จะยังอยู่ในระบบ — แค่ลบออกจากรายชื่อ`)) return;
    deleteStudent(classroom, s.studentCode);
    reload();
  };

  const handleMove = (s: StudentInfo) => {
    const target = prompt(
      `ย้าย "${s.name}" จาก ${classroom} ไปห้องไหน?\n\nห้องที่มี: ${allClassrooms2569.join(', ')}`,
      ''
    );
    if (!target || !allClassrooms2569.includes(target)) return;
    moveStudent(classroom, s.studentCode, target);
    reload();
    alert(`ย้าย ${s.name} ไปห้อง ${target} แล้ว ✓`);
  };

  const handleRenumber = () => {
    if (!confirm(`จัดเรียงเลขที่ในห้อง ${classroom} ใหม่ตามลำดับ (1, 2, 3, ...)?`)) return;
    renumberClassroom(classroom);
    reload();
  };

  const handleReset = () => {
    if (!confirm(`รีเซ็ตห้อง ${classroom} กลับเป็นค่าเดิมจากไฟล์ Excel?\nการแก้ไขทั้งหมดจะหายไป`)) return;
    resetClassroom(classroom);
    reload();
  };

  return (
    <div className="student-mgr">
      {/* Toolbar */}
      <div className="sm-toolbar">
        <div className="filter-group">
          <label><Users size={14} /> ห้องเรียน</label>
          <select value={classroom} onChange={(e) => setClassroom(e.target.value)}>
            {allClassrooms2569.map((c) => (
              <option key={c} value={c}>{c} ({loadRoster(c).length} คน)</option>
            ))}
          </select>
        </div>
        <div className="filter-group" style={{ flex: 1 }}>
          <label><Search size={14} /> ค้นหา</label>
          <input
            type="text"
            placeholder="ชื่อ / รหัส / เลขที่..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(!showAdd)}>
          <Plus size={16} /> {showAdd ? 'ยกเลิก' : 'เพิ่มนักเรียน'}
        </button>
        <button className="btn-secondary" onClick={handleRenumber} title="จัดเรียงเลขที่ใหม่">
          <ListOrdered size={14} /> จัดเรียงเลข
        </button>
        <button className="btn-secondary" onClick={handleReset} title="รีเซ็ตจากไฟล์ Excel">
          <RefreshCw size={14} /> รีเซ็ต
        </button>
        <button className="btn-export" onClick={() => downloadRosterCSV(classroom)}>
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="sm-add-form">
          <div className="filter-group">
            <label>Emoji</label>
            <select value={draft.emoji} onChange={(e) => setDraft({ ...draft, emoji: e.target.value })}>
              {emojiOptions.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>รหัสประจำตัว</label>
            <input
              type="text"
              placeholder="เช่น 3300 (ปล่อยว่างได้)"
              value={draft.studentCode || ''}
              onChange={(e) => setDraft({ ...draft, studentCode: e.target.value })}
            />
          </div>
          <div className="filter-group" style={{ flex: 1 }}>
            <label>ชื่อ-นามสกุล *</label>
            <input
              type="text"
              placeholder="เช่น เด็กชายสมชาย ใจดี"
              value={draft.name || ''}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              autoFocus
            />
          </div>
          <button className="btn-export" onClick={handleAdd}>
            <Save size={14} /> บันทึก
          </button>
        </div>
      )}

      {/* Summary */}
      <div className="sm-summary">
        จำนวนนักเรียนใน <strong>{classroom}</strong>:
        <span className="sm-count">{list.length} คน</span>
        {filtered.length !== list.length && (
          <span style={{ color: '#6366f1', fontWeight: 600 }}>
            (กรองอยู่ {filtered.length} คน)
          </span>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="empty-state-card">
          <Users size={40} style={{ color: '#9ca3af' }} />
          <p>ยังไม่มีนักเรียนในห้องนี้</p>
        </div>
      ) : (
        <div className="sm-table-wrap">
          <table className="att-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>เลขที่</th>
                <th style={{ width: 50 }}></th>
                <th style={{ width: 120 }}>รหัสนักเรียน</th>
                <th>ชื่อ-นามสกุล</th>
                <th style={{ width: 220 }}>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const isEditing = editingCode === s.studentCode;
                return (
                  <StudentRow
                    key={s.studentCode}
                    student={s}
                    isEditing={isEditing}
                    onEdit={() => setEditingCode(s.studentCode)}
                    onCancel={() => setEditingCode(null)}
                    onSave={(patch) => handleSave(s.studentCode, patch)}
                    onDelete={() => handleDelete(s)}
                    onMove={() => handleMove(s)}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="sm-help">
        <strong>💡 หมายเหตุ:</strong>
        <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>
          <li>การแก้ไขจะบันทึกใน localStorage (ไม่กระทบไฟล์ต้นฉบับ Excel)</li>
          <li>ถ้าเปลี่ยน <strong>ชื่อ</strong> ของนักเรียนที่เคย login มาก่อน → คะแนนเก่ายังอยู่ใน progress data ของ id เก่า</li>
          <li>ปุ่ม <strong>"รีเซ็ต"</strong> จะลบการแก้ไขทั้งหมดของห้องนี้ → กลับเป็นรายชื่อจาก Excel</li>
        </ul>
      </div>
    </div>
  );
};

const StudentRow: React.FC<{
  student: StudentInfo;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (patch: Partial<StudentInfo>) => void;
  onDelete: () => void;
  onMove: () => void;
}> = ({ student, isEditing, onEdit, onCancel, onSave, onDelete, onMove }) => {
  const [draft, setDraft] = useState(student);
  useEffect(() => setDraft(student), [student, isEditing]);

  if (!isEditing) {
    return (
      <tr>
        <td className="text-center">{student.no}</td>
        <td className="text-center" style={{ fontSize: '1.4rem' }}>{student.emoji}</td>
        <td>{student.studentCode}</td>
        <td>{student.name}</td>
        <td>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="cb-icon-btn" onClick={onEdit} title="แก้ไข">
              <Edit3 size={14} />
            </button>
            <button className="cb-icon-btn" onClick={onMove} title="ย้ายห้อง">
              <ArrowRightLeft size={14} />
            </button>
            <button className="cb-icon-btn danger" onClick={onDelete} title="ลบ">
              <Trash2 size={14} />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr style={{ background: '#fef9c3' }}>
      <td>
        <input
          type="number"
          min={1}
          value={draft.no}
          onChange={(e) => setDraft({ ...draft, no: parseInt(e.target.value) || 1 })}
          style={{ width: 60, padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: 4 }}
        />
      </td>
      <td>
        <select
          value={draft.emoji}
          onChange={(e) => setDraft({ ...draft, emoji: e.target.value })}
          style={{ padding: '4px', border: '1px solid #d1d5db', borderRadius: 4 }}
        >
          {emojiOptions.map((e) => <option key={e}>{e}</option>)}
        </select>
      </td>
      <td>
        <input
          type="text"
          value={draft.studentCode}
          onChange={(e) => setDraft({ ...draft, studentCode: e.target.value })}
          style={{ width: 110, padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: 4 }}
        />
      </td>
      <td>
        <input
          type="text"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          style={{ width: '100%', padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 4 }}
          autoFocus
        />
      </td>
      <td>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn-export" onClick={() => onSave(draft)} style={{ padding: '4px 10px' }}>
            <Save size={14} />
          </button>
          <button className="btn-secondary" onClick={onCancel} style={{ padding: '4px 10px' }}>
            <X size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default StudentManager;
