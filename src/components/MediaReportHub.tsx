import React, { useState, useMemo } from 'react';
import {
  Printer, Plus, Download, Search, CheckSquare, Square,
  RotateCcw, Trash2, Edit3, Eye, FileText, X, Check, Image as ImageIcon,
  Palette
} from 'lucide-react';
import {
  type MediaReportItem,
  loadMediaReports,
  saveMediaReports,
  resetMediaReports,
} from '../data/mediaReportsData';
import { useToast } from './Toast';
import './MediaReportHub.css';

export const MediaReportHub: React.FC = () => {
  const toast = useToast();
  const [items, setItems] = useState<MediaReportItem[]>(() => loadMediaReports());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(items.filter((i) => i.category === 'canva-slide').map((i) => i.id)),
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('canva-slide');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printQueue, setPrintQueue] = useState<MediaReportItem[]>([]);
  const [showSignature, setShowSignature] = useState(true);

  // Edit / Add Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<MediaReportItem> | null>(null);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.gradeLevel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.usageInstructions.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory =
        categoryFilter === 'all' || item.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [items, searchQuery, categoryFilter]);

  // Selection helpers
  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(filteredItems.map((i) => i.id)));
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Print Handlers
  const handlePrintAll = () => {
    if (items.length === 0) {
      toast.show('ไม่มีรายการสื่อสำหรับสั่งพิมพ์', 'error');
      return;
    }
    setPrintQueue(items);
    setIsPrintModalOpen(true);
  };

  const handlePrintCanvaAll = () => {
    const canvaItems = items.filter((i) => i.category === 'canva-slide');
    if (canvaItems.length === 0) {
      toast.show('ไม่พบรายการสื่อจาก Canva สำหรับสั่งพิมพ์', 'error');
      return;
    }
    setPrintQueue(canvaItems);
    setIsPrintModalOpen(true);
  };

  const handlePrintSelected = () => {
    const selected = items.filter((i) => selectedIds.has(i.id));
    if (selected.length === 0) {
      toast.show('กรุณาเลือกรายการสื่อที่ต้องการพิมพ์อย่างน้อย 1 รายการ', 'error');
      return;
    }
    setPrintQueue(selected);
    setIsPrintModalOpen(true);
  };

  const handlePrintSingle = (item: MediaReportItem) => {
    setPrintQueue([item]);
    setIsPrintModalOpen(true);
  };

  const handleNativePrint = () => {
    window.print();
  };

  // CRUD Handlers
  const handleOpenAdd = () => {
    setEditingItem({
      id: `custom-media-${Date.now()}`,
      title: '',
      author: 'นายอนันตชัย เพ็ชรรี่',
      dateCreated: new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }),
      learningArea: 'วิทยาศาสตร์และเทคโนโลยี',
      subject: 'วิทยาการคำนวณ',
      gradeLevel: 'ประถมศึกษาปีที่ 1-6',
      schoolName: 'โรงเรียนบ้านคลองมดแดง',
      imageUrl: '/media/reports/photo_robot.png',
      usageInstructions: '',
      category: 'custom',
      dottedLinesCount: 6,
      notes: '',
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (item: MediaReportItem) => {
    setEditingItem({ ...item });
    setIsEditModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.title || !editingItem.author) {
      toast.show('กรุณากรอกชื่อสื่อและผู้จัดทำ', 'error');
      return;
    }

    const newItem = editingItem as MediaReportItem;
    const exists = items.some((i) => i.id === newItem.id);
    let updated: MediaReportItem[];
    if (exists) {
      updated = items.map((i) => (i.id === newItem.id ? newItem : i));
      toast.show('บันทึกการแก้ไขสื่อสำเร็จ', 'success');
    } else {
      updated = [newItem, ...items];
      toast.show('เพิ่มสื่อการสอนใหม่สำเร็จ', 'success');
    }

    setItems(updated);
    saveMediaReports(updated);
    setIsEditModalOpen(false);
    setEditingItem(null);
  };

  const handleDeleteItem = (id: string, title: string) => {
    if (confirm(`คุณต้องการลบรายงานสื่อ "${title}" หรือไม่?`)) {
      const updated = items.filter((i) => i.id !== id);
      setItems(updated);
      saveMediaReports(updated);
      const nextSel = new Set(selectedIds);
      nextSel.delete(id);
      setSelectedIds(nextSel);
      toast.show('ลบรายการสื่อเรียบร้อยแล้ว', 'success');
    }
  };

  const handleReset = () => {
    if (confirm('คุณต้องการรีเซ็ตข้อมูลสื่อกลับเป็นค่าเริ่มต้นตาม Canva หรือไม่? การแก้ไขเพิ่มเติมจะถูกลบ')) {
      const def = resetMediaReports();
      setItems(def);
      setSelectedIds(new Set(def.map((i) => i.id)));
      toast.show('รีเซ็ตข้อมูลสื่อตามแม่แบบ Canva เรียบร้อยแล้ว', 'success');
    }
  };

  // Image Upload handler for Custom Media
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        if (loadEvt.target?.result && editingItem) {
          setEditingItem({
            ...editingItem,
            imageUrl: loadEvt.target.result as string,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="media-report-hub">
      {/* Top Header & Overview Bar */}
      <div className="media-hub-header">
        <div className="media-hub-title-group">
          <h2>
            <FileText className="text-primary" size={24} /> แบบบันทึกข้อมูลการผลิตสื่อการสอน (สไตล์ Canva A4)
          </h2>
          <p>
            แม่แบบรายงานการใช้และผลิตสื่อ นวัตกรรมทางการศึกษา ตามมาตรฐาน Canva • รองรับพิมพ์ A4 และบันทึกเป็น PDF รวมไฟล์หรือแยกไฟล์
          </p>
        </div>

        <div className="media-hub-actions">
          <button type="button" className="btn-hub btn-hub-secondary" onClick={handleOpenAdd}>
            <Plus size={16} /> เพิ่มสื่อใหม่
          </button>
          <button type="button" className="btn-hub btn-hub-secondary" onClick={handleReset} title="คืนค่าข้อมูลเริ่มต้นตาม Canva">
            <RotateCcw size={16} /> รีเซ็ตแม่แบบ
          </button>
          <button type="button" className="btn-hub btn-hub-canva" onClick={handlePrintCanvaAll} title="สั่งพิมพ์เอกสารรายงานสไตล์ Canva ทั้งหมด 62 หน้า">
            <Palette size={16} /> พิมพ์ชุด Canva ({items.filter((i) => i.category === 'canva-slide').length} แผ่น)
          </button>
          <button type="button" className="btn-hub btn-hub-success" onClick={handlePrintSelected}>
            <Printer size={16} /> พิมพ์ที่เลือก ({items.filter((i) => selectedIds.has(i.id)).length})
          </button>
          <button type="button" className="btn-hub btn-hub-primary" onClick={handlePrintAll}>
            <Download size={16} /> พิมพ์รวมทั้งหมด ({items.length} แผ่น)
          </button>
        </div>
      </div>

      {/* Filter and Selection Control Bar */}
      <div className="media-hub-filter-bar">
        <div className="filter-left">
          <div className="media-search-input">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อสื่อ, รายวิชา, วิธีใช้..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="media-category-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">📁 ทุกหมวดหมู่สื่อทั้งหมด ({items.length} รายการ)</option>
            <option value="canva-slide">🎨 สื่อเกมสไลด์และรายงานจาก Canva ทั้งหมด ({items.filter((i) => i.category === 'canva-slide').length} แผ่น)</option>
            <option value="digital-game">🎮 สื่อนวัตกรรมเกมการเรียนรู้ ({items.filter((i) => i.category === 'digital-game').length} รายการ)</option>
            <option value="interactive-slide">📖 สื่อสไลด์บทเรียนหลักสูตร ({items.filter((i) => i.category === 'interactive-slide').length} รายการ)</option>
            <option value="custom">✏️ สื่อที่กำหนดเอง ({items.filter((i) => i.category === 'custom').length} รายการ)</option>
          </select>
        </div>

        <div className="filter-right">
          <button type="button" className="btn-hub btn-hub-secondary" onClick={handleSelectAll}>
            <CheckSquare size={16} /> เลือกทั้งหมด
          </button>
          <button type="button" className="btn-hub btn-hub-secondary" onClick={handleClearSelection}>
            <Square size={16} /> ยกเลิกการเลือก
          </button>
          <span className="selection-info-badge">
            เลือกแล้ว {items.filter((i) => selectedIds.has(i.id)).length} จาก {items.length} แผ่น
          </span>
        </div>
      </div>

      {/* Grid of Media Cards */}
      <div className="media-grid">
        {filteredItems.map((item) => {
          const isSelected = selectedIds.has(item.id);
          return (
            <div key={item.id} className={`media-card ${isSelected ? 'selected' : ''}`}>
              <input
                type="checkbox"
                className="media-card-checkbox"
                checked={isSelected}
                onChange={() => handleToggleSelect(item.id)}
                title="เลือกแผ่นนี้สำหรับส่งออก A4"
              />

              <span className="media-card-badge">
                {item.category === 'canva-slide'
                  ? 'แม่แบบ Canva'
                  : item.category === 'digital-game'
                  ? 'เกมนวัตกรรม'
                  : item.category === 'interactive-slide'
                  ? 'สไลด์อินเทอร์แอคทีฟ'
                  : 'สื่อครูเจมส์'}
              </span>

              <div className="media-card-img-wrap" onClick={() => handlePrintSingle(item)} style={{ cursor: 'pointer' }}>
                <img src={item.imageUrl} alt={item.imageAlt || item.title} loading="lazy" />
              </div>

              <div className="media-card-body">
                <h4 className="media-card-title">{item.title}</h4>
                <div className="media-card-meta">
                  <span>ผู้จัดทำ: {item.author}</span>
                  <span>วันที่ผลิต: {item.dateCreated} • {item.gradeLevel}</span>
                </div>
                <p className="media-card-desc">{item.usageInstructions}</p>

                <div className="media-card-footer">
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      type="button"
                      className="btn-hub btn-hub-secondary"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                      onClick={() => handleOpenEdit(item)}
                      title="แก้ไขข้อมูลสื่อ"
                    >
                      <Edit3 size={13} /> แก้ไข
                    </button>
                    {item.category === 'custom' && (
                      <button
                        type="button"
                        className="btn-hub btn-hub-danger"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                        onClick={() => handleDeleteItem(item.id, item.title)}
                        title="ลบสื่อนี้"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn-hub btn-hub-primary"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                    onClick={() => handlePrintSingle(item)}
                  >
                    <Eye size={14} /> ดูตัวอย่าง A4
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FULLSCREEN A4 PRINT PREVIEW MODAL */}
      {isPrintModalOpen && (
        <div className="a4-print-overlay">
          {/* Top Floating Action Bar */}
          <div className="a4-print-toolbar pp5-no-print">
            <div className="a4-print-info">
              <strong>📄 ตัวอย่างแบบบันทึกข้อมูลการผลิตสื่อการสอน (A4 Canva Style)</strong>
              <span>จำนวน {printQueue.length} หน้ากระดาษ A4</span>
            </div>

            <div className="a4-print-actions">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#e2e8f0', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showSignature}
                  onChange={(e) => setShowSignature(e.target.checked)}
                />
                แสดงช่องลงนามผู้รายงาน
              </label>

              <button type="button" className="btn-hub btn-hub-success" onClick={handleNativePrint}>
                <Printer size={16} /> สั่งพิมพ์ / บันทึก PDF (A4)
              </button>
              <button
                type="button"
                className="btn-hub btn-hub-secondary"
                onClick={() => setIsPrintModalOpen(false)}
              >
                <X size={16} /> ปิดหน้าต่าง
              </button>
            </div>
          </div>

          {/* Scrollable A4 Sheets Container */}
          <div className="a4-sheets-wrapper">
            {printQueue.map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="a4-sheet">
                {/* 1. Header Banner — Canva Mascot Banner */}
                <div className="a4-banner-container">
                  <img
                    src="/media/reports/banner_kids.png"
                    alt="แบบบันทึกข้อมูลการผลิตสื่อการสอน"
                    className="a4-banner-img"
                  />
                </div>

                {/* 2. Media Photo Frame */}
                <div className="a4-photo-container">
                  <div className="a4-photo-box">
                    <img src={item.imageUrl} alt={item.imageAlt || item.title} />
                  </div>
                </div>

                {/* 3. Form Details — Strict Canva Matching */}
                <div className="a4-details-section">
                  <div className="a4-field-row">
                    <div>
                      <span className="a4-label">ผู้จัดทำสื่อ</span>
                      <span className="a4-value">{item.author}</span>
                    </div>
                    <div>
                      <span className="a4-label">วันที่ผลิตสื่อ</span>
                      <span className="a4-value">{item.dateCreated || '............................'}</span>
                    </div>
                  </div>

                  <div className="a4-field-row-full">
                    <span className="a4-label">ชื่อสื่อ</span>
                    <span className="a4-value">{item.title}</span>
                  </div>

                  <div className="a4-field-row-full">
                    <span className="a4-label">ใช้สอนกลุ่มสาระการเรียนรู้</span>
                    <span className="a4-value">{item.learningArea}</span>
                  </div>

                  <div className="a4-field-row-full">
                    <span className="a4-label">รายวิชา</span>
                    <span className="a4-value">{item.subject} {item.gradeLevel ? `(ระดับชั้น ${item.gradeLevel})` : ''}</span>
                  </div>

                  <div className="a4-field-row-full">
                    <span className="a4-label">วิธีใช้สื่อ</span>
                    <span className="a4-value">{item.usageInstructions}</span>
                  </div>

                  {/* 4. Dotted Lines for Notes / Assessment */}
                  <div className="a4-dotted-lines">
                    {Array.from({ length: item.dottedLinesCount || 6 }).map((_, lineIdx) => (
                      <div key={lineIdx} className="a4-dotted-line" />
                    ))}
                  </div>

                  {/* 5. Optional Signature Block */}
                  {showSignature && (
                    <div className="a4-signature-block">
                      <div className="a4-signature-box">
                        <p style={{ margin: '0 0 16px 0' }}>(ลงชื่อ).................................................... ผู้รายงาน</p>
                        <p style={{ margin: '0 0 4px 0', fontWeight: 600 }}>( {item.author} )</p>
                        <p style={{ margin: 0, color: '#4b5563', fontSize: '13px' }}>ตำแหน่ง ครู {item.schoolName || 'โรงเรียนบ้านคลองมดแดง'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADD / EDIT MEDIA ITEM MODAL */}
      {isEditModalOpen && editingItem && (
        <div className="modal-backdrop">
          <div className="modal-content-box">
            <div className="modal-header">
              <h3>{editingItem.id?.startsWith('custom-media') ? '➕ เพิ่มสื่อการสอนใหม่' : '✏️ แก้ไขข้อมูลรายงานสื่อ'}</h3>
              <button
                type="button"
                className="btn-hub btn-hub-secondary"
                style={{ padding: '0.35rem 0.55rem' }}
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingItem(null);
                }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveItem}>
              <div className="modal-body">
                <div className="form-group">
                  <label>ชื่อสื่อการสอน *</label>
                  <input
                    type="text"
                    required
                    value={editingItem.title || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    placeholder="เช่น สื่ออุปกรณ์คอมพิวเตอร์และฮาร์ดแวร์"
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>ผู้จัดทำสื่อ *</label>
                    <input
                      type="text"
                      required
                      value={editingItem.author || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, author: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>วันที่ผลิตสื่อ</label>
                    <input
                      type="text"
                      value={editingItem.dateCreated || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, dateCreated: e.target.value })}
                      placeholder="เช่น 16 พฤษภาคม 2569"
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>กลุ่มสาระการเรียนรู้</label>
                    <input
                      type="text"
                      value={editingItem.learningArea || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, learningArea: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>รายวิชา</label>
                    <input
                      type="text"
                      value={editingItem.subject || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, subject: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>ระดับชั้นที่นำไปใช้</label>
                    <input
                      type="text"
                      value={editingItem.gradeLevel || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, gradeLevel: e.target.value })}
                      placeholder="เช่น ประถมศึกษาปีที่ 1-3"
                    />
                  </div>

                  <div className="form-group">
                    <label>โรงเรียน</label>
                    <input
                      type="text"
                      value={editingItem.schoolName || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, schoolName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>วิธีใช้สื่อ *</label>
                  <textarea
                    rows={3}
                    required
                    value={editingItem.usageInstructions || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, usageInstructions: e.target.value })}
                    placeholder="อธิบายขั้นตอนหรือวัตถุประสงค์ในการนำสื่อไปใช้จัดกิจกรรมการเรียนรู้..."
                  />
                </div>

                <div className="form-group">
                  <label>รูปภาพสื่อการสอน</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.3rem' }}>
                    <div style={{ width: '80px', height: '60px', borderRadius: '6px', overflow: 'hidden', background: '#f3f4f6', border: '1px solid #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {editingItem.imageUrl ? (
                        <img src={editingItem.imageUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <ImageIcon size={24} className="text-gray-400" />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        style={{ fontSize: '0.85rem' }}
                      />
                      <small style={{ color: '#6b7280', display: 'block', marginTop: '4px' }}>
                        สามารถเลือกไฟล์ภาพถ่ายสื่อการสอนจากเครื่องของคุณได้
                      </small>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>หรือระบุ URL รูปภาพ</label>
                  <input
                    type="text"
                    value={editingItem.imageUrl || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, imageUrl: e.target.value })}
                    placeholder="/media/reports/photo_robot.png หรือ URL ภาพ"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-hub btn-hub-secondary"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingItem(null);
                  }}
                >
                  ยกเลิก
                </button>
                <button type="submit" className="btn-hub btn-hub-primary">
                  <Check size={16} /> บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
