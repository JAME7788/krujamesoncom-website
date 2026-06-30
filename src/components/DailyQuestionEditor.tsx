import React, { useEffect, useState } from 'react';
import { Save, Plus, Trash2, Calendar, Download } from 'lucide-react';
import {
  fetchDailyQuestion, saveDailyQuestion, todayDateKey,
} from '../services/dailyQuestionService';
import type { DailyQuestion } from '../services/dailyQuestionService';
import { fetchAllProgressFromFirebase, getAllCachedProgress } from '../services/progressService';
import { loadAllRosters } from '../services/rosterService';
import { useToast } from './Toast';

const downloadCsv = (csv: string, filename: string) => {
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const DailyQuestionEditor: React.FC = () => {
  const [date, setDate] = useState<string>(todayDateKey());
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoaded(false);
      const q = await fetchDailyQuestion(date);
      if (cancelled) return;
      if (q) {
        setQuestion(q.question);
        setOptions(q.options.length >= 2 ? q.options : ['', '']);
        setCorrectIndex(q.correctIndex);
      } else {
        setQuestion('');
        setOptions(['', '']);
        setCorrectIndex(0);
      }
      setLoaded(true);
    };
    void load();
    return () => { cancelled = true; };
  }, [date]);

  const updateOption = (i: number, v: string) => {
    const next = [...options];
    next[i] = v;
    setOptions(next);
  };

  const addOption = () => {
    if (options.length >= 4) return;
    setOptions([...options, '']);
  };

  const removeOption = (i: number) => {
    if (options.length <= 2) return;
    const next = options.filter((_, idx) => idx !== i);
    setOptions(next);
    if (correctIndex >= next.length) setCorrectIndex(0);
  };

  const handleExportStats = async () => {
    await fetchAllProgressFromFirebase();
    const rosters = loadAllRosters();
    const all = getAllCachedProgress();
    const tagPrefix = `[Daily:${date}]`;
    let csv = 'ห้อง,เลขที่,ชื่อ-สกุล,ตอบไหม,ผลลัพธ์,XP ที่ได้,เวลาที่ตอบ\n';
    Object.keys(rosters).forEach((classroom) => {
      (rosters[classroom] || []).forEach((s) => {
        const studentId = `${classroom}_${s.no}_${s.name.replace(/\s/g, '')}`;
        const prog = all.find((p) => p.studentId === studentId);
        const bonus = prog?.bonuses?.find((b) => b.reason.startsWith(tagPrefix));
        if (bonus) {
          const result = bonus.reason.includes('ตอบถูก') ? 'ถูก' : 'ผิด';
          csv += `${classroom},${s.no},"${s.name}",ตอบแล้ว,${result},${bonus.xp},${new Date(bonus.awardedAt).toLocaleString('th-TH')}\n`;
        } else {
          csv += `${classroom},${s.no},"${s.name}",ยังไม่ตอบ,-,0,-\n`;
        }
      });
    });
    downloadCsv(csv, `daily_question_${date}.csv`);
    toast.show(`Export สถิติคำตอบวันที่ ${date} เรียบร้อย`, 'success');
  };

  const handleSave = async () => {
    if (!question.trim()) { toast.show('กรอกคำถาม', 'error'); return; }
    if (options.some((o) => !o.trim())) { toast.show('กรอกตัวเลือกให้ครบ', 'error'); return; }
    setSaving(true);
    const q: DailyQuestion = {
      date,
      question: question.trim(),
      options: options.map((o) => o.trim()),
      correctIndex,
      createdAt: Date.now(),
      createdBy: 'teacher',
    };
    const result = await saveDailyQuestion(q);
    setSaving(false);
    if (result.ok) {
      toast.show(`บันทึกคำถามวันที่ ${date} ลง Firebase แล้ว — เด็กจะเห็นที่ Dashboard ทันที`, 'success');
    } else {
      toast.show(`บันทึกไม่สำเร็จ: ${result.error || 'ไม่ทราบสาเหตุ'}`, 'error');
    }
  };

  return (
    <div>
      <div style={{
        padding: 12, background: '#f5f3ff',
        border: '1px dashed #c4b5fd', borderRadius: 10, marginBottom: 16,
        fontSize: '0.88rem', color: '#5b21b6',
      }}>
        💡 ตั้งคำถาม 1 ข้อต่อวัน — เด็กตอบครั้งเดียว ตอบถูก +10 XP, ตอบผิด +3 XP (เพื่อรักษาแรงจูงใจ).
        เปลี่ยนวันที่ได้เพื่อตั้งล่วงหน้าหรือดูคำถามวันก่อนๆ.
      </div>

      <div className="filter-row" style={{ marginBottom: 16 }}>
        <div className="filter-group">
          <label><Calendar size={14} /> วันที่</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontFamily: 'inherit' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, marginBottom: 4 }}>คำถาม</label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="เช่น อัลกอริทึมหมายถึงอะไร?"
            rows={2}
            disabled={!loaded}
            style={{
              width: '100%', padding: 10,
              border: '1px solid #d1d5db', borderRadius: 8,
              fontFamily: 'inherit', fontSize: '1rem', resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, marginBottom: 4 }}>
            ตัวเลือก (ติ๊กข้อที่ถูก)
          </label>
          {options.map((opt, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
              <input
                type="radio"
                name="correct"
                checked={correctIndex === i}
                onChange={() => setCorrectIndex(i)}
                disabled={!loaded}
              />
              <strong style={{ minWidth: 20 }}>{['ก', 'ข', 'ค', 'ง'][i]}.</strong>
              <input
                type="text"
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
                disabled={!loaded}
                placeholder={`ตัวเลือก ${['ก', 'ข', 'ค', 'ง'][i]}`}
                style={{
                  flex: 1, padding: '6px 10px',
                  border: '1px solid #d1d5db', borderRadius: 6,
                  fontFamily: 'inherit',
                }}
              />
              {options.length > 2 && (
                <button
                  className="link-btn danger"
                  onClick={() => removeOption(i)}
                  type="button"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
          {options.length < 4 && (
            <button onClick={addOption} className="btn-secondary" type="button" style={{ marginTop: 4 }}>
              <Plus size={14} /> เพิ่มตัวเลือก
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={handleSave}
            disabled={!loaded || saving}
            className="btn-export"
          >
            <Save size={16} /> {saving ? 'กำลังบันทึก...' : 'บันทึกคำถามนี้'}
          </button>
          <button
            onClick={handleExportStats}
            className="btn-secondary"
          >
            <Download size={16} /> Export สถิติคำตอบ ({date})
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyQuestionEditor;
