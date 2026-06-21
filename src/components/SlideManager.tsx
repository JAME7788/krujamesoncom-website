import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FileText, Save, Eye, RefreshCw, AlertTriangle } from 'lucide-react';
import { grades } from '../data/curriculum';
import { fetchCustomSlides, saveCustomSlides, parseMarkdownToSlides, slidesToMarkdown } from '../services/slideService';
import type { RichSlide } from '../data/richSlides';
import { useToast } from './Toast';

const SlideManager: React.FC = () => {
  const toast = useToast();
  const [selectedGradeId, setSelectedGradeId] = useState(grades[0]?.id || 'p1');
  const [selectedUnitNo, setSelectedUnitNo] = useState(1);
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const currentGrade = useMemo(() => grades.find((g) => g.id === selectedGradeId), [selectedGradeId]);
  const units = useMemo(() => currentGrade?.units || [], [currentGrade]);

  // Reset selected unit number if not valid for the current grade
  const [prevGradeId, setPrevGradeId] = useState(selectedGradeId);
  if (selectedGradeId !== prevGradeId) {
    setPrevGradeId(selectedGradeId);
    if (units.length > 0) {
      const exists = units.some((u) => u.no === selectedUnitNo);
      if (!exists) setSelectedUnitNo(units[0].no);
    }
  }

  // Parse markdown live using useMemo
  const { previewSlides, parseError } = useMemo(() => {
    try {
      const parsed = parseMarkdownToSlides(markdown);
      return { previewSlides: parsed, parseError: null };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'รูปแบบไม่ถูกต้อง';
      return { previewSlides: [] as RichSlide[], parseError: msg };
    }
  }, [markdown]);

  const loadSlidesData = useCallback(async () => {
    setLoading(true);
    try {
      const custom = await fetchCustomSlides(selectedGradeId, selectedUnitNo);
      if (custom && custom.length > 0) {
        const md = slidesToMarkdown(custom);
        setMarkdown(md);
      } else {
        // Generate a default template
        const unitObj = units.find((u) => u.no === selectedUnitNo);
        const template = `# ${unitObj?.title || 'หน่วยการเรียนรู้ใหม่'}
emoji: 📖
theme: blue
layout: cover

ยินดีต้อนรับสู่บทเรียน!
- กดเพื่อเริ่มเรียนบทเรียนนี้
- เรียนรู้อย่างเป็นขั้นตอน

---
# หัวข้อที่ 1: แนะนำบทเรียน
emoji: 💡
theme: green
layout: standard

เนื้อหารายละเอียดของสไลด์หน้านี้
- รายการย่อยที่ 1
- รายการย่อยที่ 2

\`\`\`python
# สามารถเขียนโค้ดตัวอย่างได้
print("สวัสดีชาวโลก")
\`\`\`
`;
        setMarkdown(template);
      }
    } catch (e) {
      console.error(e);
      toast.show('โหลดข้อมูลสไลด์ผิดพลาด', 'error');
    }
    setLoading(false);
  }, [selectedGradeId, selectedUnitNo, units, toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadSlidesData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadSlidesData]);

  const handleSave = async () => {
    if (parseError) {
      toast.show('กรุณาแก้ไขรูปแบบสไลด์ให้ถูกต้องก่อนบันทึก', 'error');
      return;
    }
    setSaving(true);
    try {
      const parsed = parseMarkdownToSlides(markdown);
      const success = await saveCustomSlides(selectedGradeId, selectedUnitNo, parsed);
      if (success) {
        toast.show('บันทึกสไลด์และส่งขึ้น Cloud สำเร็จแล้ว!', 'success');
      } else {
        toast.show('บันทึกลงฐานข้อมูลล้มเหลว', 'error');
      }
    } catch (e) {
      console.error(e);
      toast.show('เกิดข้อผิดพลาดในการบันทึก', 'error');
    }
    setSaving(false);
  };

  return (
    <div className="slide-manager-container" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem', marginTop: '1rem' }}>
      {/* Control & Editor Panel */}
      <div className="editor-side glass" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border, #e5e7eb)', background: 'rgba(255,255,255,0.7)' }}>
        <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText className="text-primary" /> ตัวจัดการสไลด์บทเรียน
        </h3>
        <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1.25rem' }}>
          คุณสามารถก๊อบปี้เนื้อหาสไลด์ที่สร้างจาก <strong>NotebookLM</strong> หรือแอปอื่นมาวาง และปรับแต่งรูปแบบในรูปแบบ Markdown ได้เลย ระบบจะแปลงเป็นสไลด์ปฏิสัมพันธ์ทันที
        </p>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>ระดับชั้น</label>
            <select
              value={selectedGradeId}
              onChange={(e) => setSelectedGradeId(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', fontSize: '0.9rem', width: '100%' }}
            >
              {grades.map((g) => (
                <option key={g.id} value={g.id}>{g.title}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>หน่วยการเรียนรู้</label>
            <select
              value={selectedUnitNo}
              onChange={(e) => setSelectedUnitNo(parseInt(e.target.value))}
              style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', fontSize: '0.9rem', width: '100%' }}
            >
              {units.map((u) => (
                <option key={u.no} value={u.no}>หน่วยที่ {u.no}: {u.title}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>เนื้อหาสไลด์ (Markdown)</label>
            <button
              onClick={loadSlidesData}
              disabled={loading}
              style={{ padding: '2px 8px', fontSize: '0.78rem', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <RefreshCw size={12} className={loading ? 'spin' : ''} /> รีโหลด
            </button>
          </div>
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            disabled={loading}
            placeholder="เขียนสไลด์แต่ละแผ่น แยกด้วย ---..."
            style={{
              width: '100%',
              height: '350px',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              padding: '0.75rem',
              borderRadius: '8px',
              border: parseError ? '1px solid #ef4444' : '1px solid #d1d5db',
              background: '#f9fafb',
              resize: 'vertical',
            }}
          />
          {parseError && (
            <span style={{ color: '#ef4444', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertTriangle size={14} /> รูปแบบไม่ถูกต้อง: {parseError}
            </span>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={saving || loading || !!parseError}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: 'var(--primary, #6366f1)',
            color: 'white',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '8px',
            cursor: (saving || loading || !!parseError) ? 'not-allowed' : 'pointer',
            opacity: (saving || loading || !!parseError) ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <Save size={18} /> {saving ? 'กำลังบันทึก...' : 'บันทึกสไลด์ลงฐานข้อมูล (Cloud)'}
        </button>
      </div>

      {/* Live Preview Panel */}
      <div className="preview-side glass" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border, #e5e7eb)', background: 'rgba(255,255,255,0.7)', maxHeight: '600px', overflowY: 'auto' }}>
        <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Eye className="text-primary" /> พรีวิวสไลด์ที่จะแสดงผล ({previewSlides.length} หน้า)
        </h3>

        {previewSlides.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            ยังไม่มีข้อมูลสไลด์
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {previewSlides.map((slide, idx) => (
              <div
                key={idx}
                style={{
                  background: slide.theme === 'purple' ? 'linear-gradient(135deg, #f3e8ff, #e9d5ff)' :
                              slide.theme === 'green' ? 'linear-gradient(135deg, #dcfce7, #bbf7d0)' :
                              slide.theme === 'orange' ? 'linear-gradient(135deg, #ffedd5, #fed7aa)' :
                              slide.theme === 'yellow' ? 'linear-gradient(135deg, #fef9c3, #fef08a)' :
                              'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                  border: '1px solid #d1d5db',
                  borderRadius: '12px',
                  padding: '1rem',
                  color: '#1f2937',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '4px' }}>
                  <span>{slide.emoji || '✨'}</span>
                  <span>{slide.title}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.8rem', opacity: 0.6 }}>หน้า {idx + 1}</span>
                </div>
                {slide.body && <p style={{ fontSize: '0.9rem', margin: '0 0 0.5rem', whiteSpace: 'pre-line' }}>{slide.body}</p>}
                {slide.bullets && (
                  <ul style={{ margin: '0 0 0.5rem', paddingLeft: '1.25rem', fontSize: '0.85rem' }}>
                    {slide.bullets.map((b: { text: string }, bIdx: number) => (
                      <li key={bIdx}>{b.text}</li>
                    ))}
                  </ul>
                )}
                {slide.code && (
                  <pre style={{ background: '#1e293b', color: '#f8fafc', padding: '0.5rem', borderRadius: '6px', fontSize: '0.78rem', overflowX: 'auto', margin: '0.25rem 0' }}>
                    <code>{slide.code.content}</code>
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SlideManager;
