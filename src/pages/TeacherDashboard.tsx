import React, { useState, useEffect } from 'react';
import { Download, Users, Search, FileText, PlayCircle, Gamepad2, Award } from 'lucide-react';
import { getClassroomProgress, updateTeacherFields } from '../services/studentService';
import type { StudentProgress } from '../services/studentService';
import type { StudentProgressData } from '../services/progressService';

type StudentRow = StudentProgress & { engagement?: StudentProgressData };
import './TeacherDashboard.css';

const TeacherDashboard: React.FC = () => {
  const [classroom, setClassroom] = useState('ป.1');
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    setLoading(true);
    const data = await getClassroomProgress(classroom);
    setStudents(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [classroom]);

  const handleUpdateP = async (studentId: string, unitNo: number, value: string) => {
    await updateTeacherFields(studentId, unitNo, 'p', value);
    loadData();
  };

  const handleUpdateA = async (studentId: string, unitNo: number, value: boolean) => {
    await updateTeacherFields(studentId, unitNo, 'a', value);
    loadData();
  };

  // Export to CSV matching the teacher's Google Sheet columns
  const exportToCSV = () => {
    const units = [1, 2, 3, 4]; // ตัวอย่าง 4 หน่วย
    let headers = 'เลขที่,ชื่อ-นามสกุล';
    units.forEach(u => {
      headers += `,หน่วยที่ ${u} (K),หน่วยที่ ${u} (P),หน่วยที่ ${u} (A)`;
    });
    
    const rows = students.map(s => {
      let row = `${s.studentNumber},${s.name}`;
      units.forEach(u => {
        const score = s.units?.[u];
        row += `,${score?.k || 0},${score?.p || '-'},${score?.a ? '1' : '0'}`;
      });
      return row;
    });

    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `คะแนน_วิทยาการคำนวณ_${classroom}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="admin-dashboard container section-padding page-transition">
      <div className="admin-header">
        <div className="header-info">
          <h1>แผงควบคุมระบบ <span>Admin</span></h1>
          <p>จัดการคะแนนและติดตามความก้าวหน้าของนักเรียนแบบ Real-time</p>
        </div>
        <div className="header-actions">
          <button className="btn-export" onClick={exportToCSV}>
            <Download size={20} /> Export to Excel (.csv)
          </button>
        </div>
      </div>

      <div className="admin-controls">
        <div className="control-group">
          <label><Users size={18} /> เลือกชั้นเรียนที่ต้องการจัดการ</label>
          <select value={classroom} onChange={(e) => setClassroom(e.target.value)}>
            {['ป.1','ป.2','ป.3','ป.4','ป.5','ป.6','ม.1','ม.2','ม.3'].map(c => (
              <option key={c} value={c}>ชั้นเรียน {c}</option>
            ))}
          </select>
        </div>
        <div className="search-group">
          <Search size={20} />
          <input 
            type="text" 
            placeholder="ค้นหาชื่อ-นามสกุล นักเรียน..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* ENGAGEMENT SUMMARY — ข้อมูลการใช้งานจริงจากระบบติดตาม */}
      {!loading && students.length > 0 && (
        <div className="table-container glass" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ padding: '1rem', margin: 0, borderBottom: '1px solid var(--border, #e5e7eb)' }}>
            📊 สถิติการใช้งาน (Engagement)
          </h3>
          <table className="grade-table">
            <thead>
              <tr>
                <th>เลขที่</th>
                <th>ชื่อ-นามสกุล</th>
                <th><FileText size={14} style={{ verticalAlign: 'middle' }}/> สไลด์ที่อ่าน</th>
                <th><PlayCircle size={14} style={{ verticalAlign: 'middle' }}/> วิดีโอ</th>
                <th><Gamepad2 size={14} style={{ verticalAlign: 'middle' }}/> กิจกรรม</th>
                <th><Award size={14} style={{ verticalAlign: 'middle' }}/> ครั้งที่ทำควิซ</th>
                <th>หน่วยที่เรียน</th>
                <th>หน่วยที่จบ</th>
                <th>ใช้งานล่าสุด</th>
              </tr>
            </thead>
            <tbody>
              {students.filter((s) => s.name.includes(searchTerm)).map((s) => {
                const e = s.engagement;
                const totalVideos = e ? Object.values(e.units || {}).reduce((a, u: any) => a + (u.videosClicked?.length || 0), 0) : 0;
                const totalFun = e ? Object.values(e.units || {}).reduce((a, u: any) => a + (u.funClicked?.length || 0), 0) : 0;
                const totalQuizAttempts = e ? Object.values(e.units || {}).reduce((a, u: any) => a + (u.quizAttempts || 0), 0) : 0;
                const lastActive = e?.lastActive
                  ? new Date(e.lastActive).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })
                  : '—';
                return (
                  <tr key={s.id}>
                    <td className="text-center">{s.studentNumber}</td>
                    <td>{s.name}</td>
                    <td className="text-center">{e?.totalSlidesViewed || 0}</td>
                    <td className="text-center">{totalVideos}</td>
                    <td className="text-center">{totalFun}</td>
                    <td className="text-center">{totalQuizAttempts}</td>
                    <td className="text-center">{Object.keys(e?.units || {}).length}</td>
                    <td className="text-center">{e?.unitsCompleted || 0}</td>
                    <td className="text-center" style={{ fontSize: '0.8rem' }}>{lastActive}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="table-container glass">
        {loading ? (
          <div className="loader">กำลังดึงข้อมูล...</div>
        ) : (
          <table className="grade-table">
            <thead>
              <tr>
                <th rowSpan={2} className="sticky-col">เลขที่</th>
                <th rowSpan={2} className="sticky-col">ชื่อ-นามสกุล</th>
                <th colSpan={3}>หน่วยที่ 1</th>
                <th colSpan={3}>หน่วยที่ 2</th>
                <th colSpan={3}>หน่วยที่ 3</th>
                <th rowSpan={2}>คะแนนรวม (K)</th>
              </tr>
              <tr>
                <th>K (คะแนน)</th>
                <th>P (ทักษะ)</th>
                <th>A (จิตพิสัย)</th>
                <th>K</th>
                <th>P</th>
                <th>A</th>
                <th>K</th>
                <th>P</th>
                <th>A</th>
              </tr>
            </thead>
            <tbody>
              {students
                .filter(s => s.name.includes(searchTerm))
                .map((s) => (
                <tr key={s.id}>
                  <td className="text-center sticky-col">{s.studentNumber}</td>
                  <td className="sticky-col">{s.name}</td>
                  
                  {/* Unit 1 */}
                  <td className="text-center score-k">{s.units?.[1]?.k || 0}</td>
                  <td>
                    <select 
                      className="select-p"
                      value={s.units?.[1]?.p || 'ปานกลาง'}
                      onChange={(e) => handleUpdateP(s.id, 1, e.target.value)}
                    >
                      <option value="ดี">ดี</option>
                      <option value="ปานกลาง">ปานกลาง</option>
                      <option value="พอใช้">พอใช้</option>
                    </select>
                  </td>
                  <td className="text-center">
                    <input 
                      type="checkbox" 
                      checked={s.units?.[1]?.a ?? true}
                      onChange={(e) => handleUpdateA(s.id, 1, e.target.checked)}
                    />
                  </td>

                  {/* Unit 2 */}
                  <td className="text-center score-k">{s.units?.[2]?.k || 0}</td>
                  <td>
                    <select 
                      className="select-p"
                      value={s.units?.[2]?.p || 'ปานกลาง'}
                      onChange={(e) => handleUpdateP(s.id, 2, e.target.value)}
                    >
                      <option value="ดี">ดี</option>
                      <option value="ปานกลาง">ปานกลาง</option>
                      <option value="พอใช้">พอใช้</option>
                    </select>
                  </td>
                  <td className="text-center">
                    <input 
                      type="checkbox" 
                      checked={s.units?.[2]?.a ?? true}
                      onChange={(e) => handleUpdateA(s.id, 2, e.target.checked)}
                    />
                  </td>

                  {/* Unit 3 */}
                  <td className="text-center score-k">{s.units?.[3]?.k || 0}</td>
                  <td>
                    <select 
                      className="select-p"
                      value={s.units?.[3]?.p || 'ปานกลาง'}
                      onChange={(e) => handleUpdateP(s.id, 3, e.target.value)}
                    >
                      <option value="ดี">ดี</option>
                      <option value="ปานกลาง">ปานกลาง</option>
                      <option value="พอใช้">พอใช้</option>
                    </select>
                  </td>
                  <td className="text-center">
                    <input 
                      type="checkbox" 
                      checked={s.units?.[3]?.a ?? true}
                      onChange={(e) => handleUpdateA(s.id, 3, e.target.checked)}
                    />
                  </td>

                  <td className="text-center total-points">{s.totalPoints || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
