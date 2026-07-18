import React, { useState } from 'react';
import { useTheme } from '../services/themeService';
import { downloadBackup, importBackup, resetAll } from '../services/backupService';
import { Download, Upload, Trash2, Palette, Sun, Moon, Monitor } from 'lucide-react';

const PRESETS = [
  { name: 'Yellow', primary: '#FFD43B', primaryDark: '#FAB005' },
  { name: 'Blue', primary: '#3b82f6', primaryDark: '#1d4ed8' },
  { name: 'Green', primary: '#22c55e', primaryDark: '#16a34a' },
  { name: 'Pink', primary: '#ec4899', primaryDark: '#db2777' },
  { name: 'Purple', primary: '#a855f7', primaryDark: '#7c3aed' },
  { name: 'Orange', primary: '#f97316', primaryDark: '#ea580c' },
];

const ThemeCustomizer: React.FC = () => {
  const { theme, update } = useTheme();
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = importBackup(reader.result as string, importMode);
      if (result.success) {
        alert(`นำเข้าสำเร็จ ${result.imported} รายการ ✓\nรีโหลดหน้าเพื่อใช้งาน`);
        window.location.reload();
      } else {
        alert(`นำเข้าไม่สำเร็จ:\n${result.errors.join('\n')}`);
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (!confirm('⚠️ ลบข้อมูลทั้งหมดในเครื่อง? (คะแนน, ประกาศ, ปฏิทิน, ทุกอย่าง)')) return;
    if (!confirm('🚨 แน่ใจ 100% นะ? กู้คืนไม่ได้!')) return;
    resetAll();
    alert('ลบเรียบร้อย ✓');
    window.location.href = '/';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Theme Mode */}
      <div>
        <h3 style={{ marginTop: 0 }}>🌓 โหมดสี</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          {([
            { v: 'light', i: <Sun size={16} />, l: 'สว่าง' },
            { v: 'dark', i: <Moon size={16} />, l: 'มืด' },
            { v: 'auto', i: <Monitor size={16} />, l: 'ตามเครื่อง' },
          ] as const).map((opt) => (
            <button
              key={opt.v}
              onClick={() => update({ mode: opt.v })}
              className={theme.mode === opt.v ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '8px 16px' }}
            >
              {opt.i} {opt.l}
            </button>
          ))}
        </div>
      </div>

      {/* Color Presets */}
      <div>
        <h3>🎨 สีหลัก</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
          {PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => update({ primary: p.primary, primaryDark: p.primaryDark })}
              style={{
                padding: 12,
                background: `linear-gradient(135deg, ${p.primary}, ${p.primaryDark})`,
                color: 'white', border: 0, borderRadius: 10,
                cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit',
                outline: theme.primary === p.primary ? '3px solid #1f2937' : 'none',
                outlineOffset: 2,
              }}
            >
              <Palette size={14} /> {p.name}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: '0.78rem', color: '#6b7280' }}>
          หรือเลือกสีเอง:
          <input
            type="color"
            value={theme.primary}
            onChange={(e) => update({ primary: e.target.value })}
            style={{ marginLeft: 8 }}
          />
        </div>
      </div>

      {/* School Branding */}
      <div>
        <h3>🏫 ข้อมูลโรงเรียน</h3>
        <div className="filter-row" style={{ flexDirection: 'column', gap: 8 }}>
          <div className="filter-group">
            <label>ชื่อโรงเรียน/พอร์ทัล</label>
            <input
              value={theme.schoolName}
              onChange={(e) => update({ schoolName: e.target.value })}
              style={{ width: '100%' }}
            />
          </div>
          <div className="filter-group">
            <label>โลโก้ (text หรือ emoji)</label>
            <input
              value={theme.schoolLogo}
              onChange={(e) => update({ schoolLogo: e.target.value })}
              maxLength={4}
              style={{ width: 100 }}
            />
          </div>
        </div>
      </div>

      {/* Backup */}
      <div>
        <h3>💾 Backup & Restore</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={downloadBackup} className="btn-primary">
            <Download size={16} /> Export Backup
          </button>
          <label className="btn-secondary" style={{ cursor: 'pointer' }}>
            <Upload size={16} /> Import Backup
            <input type="file" accept="application/json" onChange={handleImport} style={{ display: 'none' }} />
          </label>
          <select
            value={importMode}
            onChange={(e) => setImportMode(e.target.value as 'merge' | 'replace')}
            style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontFamily: 'inherit' }}
          >
            <option value="merge">📌 Merge (รวมข้อมูล)</option>
            <option value="replace">🔄 Replace (เขียนทับ)</option>
          </select>
        </div>
        <button onClick={handleReset} style={{
          marginTop: 12, padding: '8px 16px', background: '#fee2e2',
          color: '#dc2626', border: 0, borderRadius: 8, cursor: 'pointer', fontWeight: 700,
        }}>
          <Trash2 size={14} /> ลบข้อมูลทั้งหมด (Factory Reset)
        </button>
      </div>

      {/* PWA Install */}
      <div>
        <h3>📱 ติดตั้งเป็นแอป (PWA)</h3>
        <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>
          กดเมนู Browser → "ติดตั้งแอป" หรือ "Add to Home Screen" — จะกลายเป็นแอปบนหน้าจอ
        </p>
        <button onClick={() => alert('💡 บนมือถือ: กดเมนู Chrome → "เพิ่มไปยังหน้าจอหลัก"\n💻 บน Desktop: กดปุ่ม ⊕ ขวาบนของ URL bar')} className="btn-secondary">
          📖 วิธีติดตั้ง
        </button>
      </div>
    </div>
  );
};

export default ThemeCustomizer;
