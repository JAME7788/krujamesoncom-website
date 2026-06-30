import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import {
  fetchAllProgressFromFirebase, getAllCachedProgress, computeGamification,
} from '../services/progressService';
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

const MasterCsvExport: React.FC = () => {
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const handleExport = async () => {
    setBusy(true);
    try {
      await fetchAllProgressFromFirebase();
      const rosters = loadAllRosters();
      const all = getAllCachedProgress();
      let csv = 'ห้อง,เลขที่,ชื่อ-สกุล,XP รวม,Level,ยศ,Streak (วัน),บทเรียนจบ,สไลด์ที่อ่าน,กิจกรรม,รวมคะแนนควิซ,รางวัลครู (จำนวน),รางวัลครู XP,ใช้งานล่าสุด\n';

      Object.keys(rosters).forEach((classroom) => {
        (rosters[classroom] || []).forEach((s) => {
          const studentId = `${classroom}_${s.no}_${s.name.replace(/\s/g, '')}`;
          const prog = all.find((p) => p.studentId === studentId);
          if (!prog) {
            csv += `${classroom},${s.no},"${s.name}",0,1,ผู้เริ่มต้น 🐣,0,0,0,0,0,0,0,-\n`;
            return;
          }
          const gam = computeGamification(studentId);
          const bonusCount = prog.bonuses?.length || 0;
          const bonusXp = prog.bonusXp || 0;
          const lastActive = prog.lastActive
            ? new Date(prog.lastActive).toLocaleString('th-TH')
            : '-';
          csv += `${classroom},${s.no},"${s.name}",${gam.xp},${gam.level},"${gam.title.emoji} ${gam.title.name}",${gam.streakDays},${prog.unitsCompleted || 0},${prog.totalSlidesViewed || 0},${prog.totalActivities || 0},${prog.totalPoints || 0},${bonusCount},${bonusXp},${lastActive}\n`;
        });
      });

      downloadCsv(csv, `master_student_stats_${new Date().toISOString().slice(0, 10)}.csv`);
      toast.show(`Export สำเร็จ — ทุกห้อง ทุกข้อมูล`, 'success');
    } catch (e) {
      toast.show(`Export ไม่สำเร็จ: ${e instanceof Error ? e.message : String(e)}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      padding: 16, background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(99,102,241,0.08))',
      border: '1px solid rgba(99,102,241,0.18)', borderRadius: 12, marginBottom: 16,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <strong style={{ fontSize: '1rem' }}>📊 Master Export — รายงานครบทุกอย่าง</strong>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
            CSV รวม ทุกห้อง · XP · Level · ยศ · Streak · บทเรียนจบ · สไลด์ · กิจกรรม · ควิซ · รางวัลครู
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={busy}
          className="btn-export"
          style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white' }}
        >
          {busy ? <Loader2 size={16} className="spin" /> : <Download size={16} />}
          {busy ? 'กำลังดึงข้อมูล...' : 'Export Master CSV'}
        </button>
      </div>
    </div>
  );
};

export default MasterCsvExport;
