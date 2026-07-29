import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Calendar, BarChart3, TrendingUp, Activity, Clock,
  Download, Search, RefreshCw, Plus, Trash2, Save, CheckCircle2,
  XCircle, BookOpen, Award, FileText, Gamepad2, PlayCircle,
  LogOut, Pencil, Lock, MonitorPlay,
} from 'lucide-react';
import AdminGate from '../components/AdminGate';
import CourseBuilder from '../components/CourseBuilder';
import GradeBook from '../components/GradeBook';
import SkillGradeTable from '../components/SkillGradeTable';
import BonusAwarder from '../components/BonusAwarder';
import DailyQuestionEditor from '../components/DailyQuestionEditor';
import QuickAttendance from '../components/QuickAttendance';
import MasterCsvExport from '../components/MasterCsvExport';
import ResearchGenerator from '../components/ResearchGenerator';
import StudentManager from '../components/StudentManager';
import AnnouncementManager from '../components/AnnouncementManager';
import CalendarManager from '../components/CalendarManager';
import HomeworkManager from '../components/HomeworkManager';
import ThemeCustomizer from '../components/ThemeCustomizer';
import LessonLockManager from '../components/LessonLockManager';
import SlideManager from '../components/SlideManager';
import VirtualClassroomManager from '../components/VirtualClassroomManager';
import P1TechnologyPlan from '../components/P1TechnologyPlan';
import CoursePlan5 from '../components/CoursePlan5';
import StudentAssessmentHub from '../components/StudentAssessmentHub';
import { loadErrors, clearErrors } from '../services/errorLogger';
import { Megaphone, Calendar as CalIcon, Bug } from 'lucide-react';
import { adminLogout, getAdminSession } from '../services/authAdmin';
import {
  fetchAllStudents, computeAttendance, getSiteStats, getStudentDevelopment,
} from '../services/adminService';
import type { StudentRecord, AttendanceRecord } from '../services/adminService';
import {
  loadSchedule, saveSchedule, defaultSchedule, dayNames, dayNamesShort, todaySlots,
  fetchScheduleFromFirebase, syncScheduleToFirebase,
} from '../data/schedule';
import type { ClassSlot } from '../data/schedule';
import './AdminDashboard.css';
import { useToast } from '../components/Toast';

type Tab = 'overview' | 'world' | 'roster' | 'attendance' | 'quick-att' | 'scores' | 'gradebook' | 'assessments' | 'skill' | 'bonus' | 'daily' | 'research' | 'development' | 'schedule' | 'courses' | 'p1-plan' | 'course-plan5' | 'locks' | 'slides' | 'announcements' | 'calendar' | 'homework' | 'theme' | 'errors' | 'site';

interface NavItem {
  id: Tab;
  label: string;
  icon: React.ReactNode;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAVIGATION_GROUPS: NavGroup[] = [
  {
    title: '📊 หน้าหลักและสถิติ',
    items: [
      { id: 'overview', label: 'ภาพรวมระบบ', icon: <BarChart3 size={16} /> },
      { id: 'world', label: 'ห้องเรียน 3D', icon: <MonitorPlay size={16} /> },
      { id: 'scores', label: 'สถิตินักเรียนในเว็บ', icon: <BarChart3 size={16} /> },
      { id: 'development', label: 'พัฒนาการรายคน', icon: <TrendingUp size={16} /> },
    ]
  },
  {
    title: '👥 ชั้นเรียนและเช็คชื่อ',
    items: [
      { id: 'roster', label: 'จัดการนักเรียน', icon: <Users size={16} /> },
      { id: 'attendance', label: 'เช็คชื่อตามตาราง', icon: <Calendar size={16} /> },
      { id: 'quick-att', label: 'เช็คชื่อ Quick (มา/ขาด/ลา)', icon: <Calendar size={16} /> },
    ]
  },
  {
    title: '📋 การวัดผลการเรียน',
    items: [
      { id: 'gradebook', label: 'เก็บคะแนน K/P/A', icon: <Award size={16} /> },
      { id: 'assessments', label: 'แบบประเมินและหลังสอน', icon: <FileText size={16} /> },
      { id: 'skill', label: 'ทักษะอาชีพ (K/P)', icon: <Award size={16} /> },
      { id: 'bonus', label: 'แจกรางวัล / Bonus', icon: <Award size={16} /> },
      { id: 'daily', label: 'คำถามประจำวัน', icon: <Award size={16} /> },
      { id: 'research', label: 'สร้างงานวิจัย (WBI)', icon: <FileText size={16} /> },
    ]
  },
  {
    title: '📚 จัดการบทเรียน',
    items: [
      { id: 'courses', label: 'จัดการรายวิชา', icon: <Pencil size={16} /> },
      { id: 'p1-plan', label: 'แผนเทคโนโลยี ป.1 + หลังสอน', icon: <FileText size={16} /> },
      { id: 'course-plan5', label: 'แผนสอนข้อ 5 (ป.1-6)', icon: <FileText size={16} /> },
      { id: 'locks', label: 'ปลดล็อกบทเรียน', icon: <Lock size={16} /> },
      { id: 'slides', label: 'จัดการสไลด์', icon: <BookOpen size={16} /> },
      { id: 'schedule', label: 'จัดการตารางสอน', icon: <Clock size={16} /> },
    ]
  },
  {
    title: '📣 สื่อสารและกิจกรรม',
    items: [
      { id: 'announcements', label: 'ประกาศข่าวสาร', icon: <Megaphone size={16} /> },
      { id: 'calendar', label: 'ปฏิทินกิจกรรม', icon: <CalIcon size={16} /> },
      { id: 'homework', label: 'การบ้าน', icon: <Award size={16} /> },
    ]
  },
  {
    title: '⚙️ ตั้งค่าระบบ',
    items: [
      { id: 'theme', label: 'ธีม & สำรองข้อมูล', icon: <Activity size={16} /> },
      { id: 'site', label: 'ข้อมูลเว็บ', icon: <Activity size={16} /> },
      { id: 'errors', label: 'Error Log', icon: <Bug size={16} /> },
    ]
  }
];

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const fmtTime = (ts?: number) =>
  ts ? new Date(ts).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '—';

const fmtDateTime = (ts?: number) =>
  ts ? new Date(ts).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : '—';

const AdminDashboardInner: React.FC = () => {
  const [tab, setTab] = useState<Tab>('overview');
  const session = getAdminSession();
  const handleLogout = () => {
    if (confirm('ออกจากระบบ Admin?')) {
      adminLogout();
      window.location.reload();
    }
  };
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [schedule, setSchedule] = useState<ClassSlot[]>(loadSchedule());
  const [loading, setLoading] = useState(true);
  const [classroom, setClassroom] = useState('ป.1');
  const [date, setDate] = useState(todayKey());
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    const data = await fetchAllStudents();
    setStudents(data);
    const remoteSchedule = await fetchScheduleFromFirebase();
    if (remoteSchedule) {
      setSchedule(remoteSchedule);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      refresh();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const stats = useMemo(() => getSiteStats(students), [students]);

  const dateMs = useMemo(() => {
    const [y, m, d] = date.split('-').map(Number);
    return new Date(y, m - 1, d, 12).getTime();
  }, [date]);

  const attendance: AttendanceRecord[] = useMemo(
    () => computeAttendance(students, classroom, schedule, dateMs),
    [students, classroom, schedule, dateMs]
  );

  const filteredStudents = useMemo(
    () =>
      students.filter(
        (s) =>
          (!search || s.name.includes(search) || s.studentNumber.includes(search)) &&
          (classroom === 'all' || s.classroom === classroom)
      ),
    [students, search, classroom]
  );

  const exportAttendanceCSV = () => {
    let csv = 'เลขที่,ชื่อ,สถานะ,เข้าในเวลาเรียน,เข้านอกเวลาเรียน,เข้าครั้งแรก,เข้าครั้งสุดท้าย\n';
    attendance.forEach((a) => {
      csv += `${a.studentNumber},${a.studentName},${statusLabel(a.status)},${a.inClassEvents},${a.outClassEvents},${fmtTime(a.firstSeen)},${fmtTime(a.lastSeen)}\n`;
    });
    download(csv, `เช็คชื่อ_${classroom}_${date}.csv`);
  };

  const exportScoresCSV = () => {
    let csv = 'เลขที่,ชื่อ,ห้อง,หน่วยที่เริ่ม,หน่วยที่จบ,สไลด์ที่อ่าน,วิดีโอ,กิจกรรม,ครั้งทำควิซ,คะแนนรวม,ใช้งานล่าสุด\n';
    filteredStudents.forEach((s) => {
      const p = s.progress;
      const videos = p ? Object.values(p.units || {}).reduce((a, u: { videosClicked?: string[] }) => a + (u.videosClicked?.length || 0), 0) : 0;
      const fun = p ? Object.values(p.units || {}).reduce((a, u: { funClicked?: string[] }) => a + (u.funClicked?.length || 0), 0) : 0;
      const attempts = p ? Object.values(p.units || {}).reduce((a, u: { quizAttempts?: number }) => a + (u.quizAttempts || 0), 0) : 0;
      csv += `${s.studentNumber},${s.name},${s.classroom},${Object.keys(p?.units || {}).length},${p?.unitsCompleted || 0},${p?.totalSlidesViewed || 0},${videos},${fun},${attempts},${p?.totalPoints || 0},${fmtDateTime(p?.lastActive)}\n`;
    });
    download(csv, `คะแนน_${classroom}_${date}.csv`);
  };

  const allClassrooms = ['ป.1','ป.2','ป.3','ป.4','ป.5','ป.6','ม.1','ม.2','ม.3'];

  return (
    <div className="admin2 page-transition">
      <div className="admin2-shell">
        {/* HEADER */}
        <header className="admin2-header">
          <div>
            <h1>🎛️ แผงควบคุมครู (Admin Dashboard)</h1>
            <p>จัดการนักเรียน คะแนน เช็คชื่อ และดูสถิติเว็บการสอนแบบเรียลไทม์</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {session && (
              <span style={{ fontSize: '0.85rem', color: '#6b7280', marginRight: '0.5rem' }}>
                👤 <strong>{session.user}</strong>
              </span>
            )}
            <button className="admin2-refresh" onClick={refresh} disabled={loading}>
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
              {loading ? 'กำลังโหลด...' : 'รีเฟรช'}
            </button>
            <button className="admin2-refresh" onClick={handleLogout} style={{ color: '#ef4444' }}>
              <LogOut size={16} /> ออกจากระบบ
            </button>
          </div>
        </header>

        {/* ADMIN LAYOUT */}
        <div className="admin2-layout">
          {/* Sidebar Navigation */}
          <aside className="admin2-sidebar">
            {NAVIGATION_GROUPS.map((g) => (
              <div key={g.title} className="sidebar-group">
                <h4 className="sidebar-group-title">{g.title}</h4>
                <div className="sidebar-group-items">
                  {g.items.map((item) => (
                    <button
                      key={item.id}
                      className={`sidebar-item ${tab === item.id ? 'active' : ''}`}
                      onClick={() => setTab(item.id)}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </aside>

          {/* Mobile selector */}
          <div className="admin2-mobile-selector-wrap">
            <label htmlFor="admin-menu-select">🎛️ เลือกเมนูแผงควบคุม:</label>
            <select
              id="admin-menu-select"
              value={tab}
              onChange={(e) => setTab(e.target.value as Tab)}
              className="admin2-mobile-select"
            >
              {NAVIGATION_GROUPS.map((g) => (
                <optgroup key={g.title} label={g.title}>
                  {g.items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Content Area */}
          <div className="admin2-content">
            {/* TAB: OVERVIEW */}
            {tab === 'overview' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin2-panel">
                <MasterCsvExport />
                <div className="kpi-grid">
                  <KPI icon={<Users />} color="#6366f1" label="นักเรียนทั้งหมด" value={stats.total} sub="คน" />
                  <KPI icon={<Activity />} color="#22c55e" label="เข้าใช้วันนี้" value={stats.activeToday} sub={`จากทั้งหมด ${stats.total}`} />
                  <KPI icon={<TrendingUp />} color="#f59e0b" label="เข้าใน 7 วัน" value={stats.activeWeek} sub="คน" />
                  <KPI icon={<FileText />} color="#a855f7" label="สไลด์ที่อ่านรวม" value={stats.totalSlides} sub="หน้า" />
                  <KPI icon={<Gamepad2 />} color="#ec4899" label="กิจกรรม/สื่อ" value={stats.totalActivities} sub="ครั้ง" />
                  <KPI icon={<Award />} color="#ef4444" label="แบบทดสอบรวม" value={stats.totalQuizzes} sub="ครั้ง" />
                </div>

                <h3 style={{ marginTop: '2rem' }}>📊 สรุปแยกตามชั้นเรียน</h3>
                <div className="classroom-bars">
                  {allClassrooms.map((c) => {
                    const data = stats.byClassroom[c] || { count: 0, active: 0, points: 0 };
                    const pct = data.count > 0 ? (data.active / data.count) * 100 : 0;
                    return (
                      <div key={c} className="cb-row">
                        <div className="cb-label">{c}</div>
                        <div className="cb-bar-wrap">
                          <div className="cb-bar" style={{ width: `${pct}%` }} />
                          <span className="cb-text">
                            {data.active}/{data.count} active • {data.points} คะแนน
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <h3 style={{ marginTop: '2rem' }}>📅 ตารางสอนวันนี้</h3>
                <div className="today-slots">
                  {todaySlots(schedule).length === 0 ? (
                    <p style={{ color: '#6b7280' }}>ไม่มีคาบเรียนวันนี้</p>
                  ) : (
                    todaySlots(schedule).map((s) => {
                      const now = new Date();
                      const [sh, sm] = s.start.split(':').map(Number);
                      const [eh, em] = s.end.split(':').map(Number);
                      const cur = now.getHours() * 60 + now.getMinutes();
                      const startMin = sh * 60 + sm;
                      const endMin = eh * 60 + em;
                      const isNow = cur >= startMin && cur <= endMin;
                      const isPast = cur > endMin;
                      return (
                        <div key={s.id} className={`slot-card ${isNow ? 'now' : isPast ? 'past' : 'future'}`}>
                          <div className="slot-time">
                            {s.start} - {s.end}
                          </div>
                          <div className="slot-class">{s.classroom}</div>
                          <div className="slot-subject">{s.subject}</div>
                          {isNow && <span className="slot-badge live">🔴 กำลังเรียน</span>}
                          {isPast && <span className="slot-badge done">✓ จบคาบแล้ว</span>}
                          {!isNow && !isPast && <span className="slot-badge upcoming">⏰ กำลังจะเรียน</span>}
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}

            {tab === 'world' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin2-panel">
                <VirtualClassroomManager />
              </motion.div>
            )}

            {/* TAB: ATTENDANCE */}
            {tab === 'attendance' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin2-panel">
                <div className="filter-row">
                  <div className="filter-group">
                    <label>ชั้นเรียน</label>
                    <select value={classroom} onChange={(e) => setClassroom(e.target.value)}>
                      {allClassrooms.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>วันที่</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  </div>
                  <button className="btn-export" onClick={exportAttendanceCSV}>
                    <Download size={16} /> Export CSV
                  </button>
                </div>

                <div className="attendance-summary">
                  <SummaryPill label="มาเรียน" count={attendance.filter(a => a.status === 'present').length} color="#22c55e" />
                  <SummaryPill label="เรียนเอง (นอกเวลา)" count={attendance.filter(a => a.status === 'self-study').length} color="#3b82f6" />
                  <SummaryPill label="ขาด" count={attendance.filter(a => a.status === 'absent').length} color="#ef4444" />
                </div>

                <div className="att-table-wrap">
                  <table className="att-table">
                    <thead>
                      <tr>
                        <th>เลขที่</th>
                        <th>ชื่อ-นามสกุล</th>
                        <th>สถานะ</th>
                        <th title="กิจกรรมที่ทำในเวลาเรียน">ในเวลา</th>
                        <th title="กิจกรรมที่ทำนอกเวลาเรียน">นอกเวลา</th>
                        <th>เข้าครั้งแรก</th>
                        <th>เข้าครั้งสุดท้าย</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.length === 0 ? (
                        <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                          ไม่มีข้อมูลนักเรียนในห้อง {classroom} — รอนักเรียนเข้าระบบก่อน
                        </td></tr>
                      ) : attendance.map((a) => (
                        <tr key={a.studentId}>
                          <td>{a.studentNumber}</td>
                          <td>{a.studentName}</td>
                          <td><StatusChip status={a.status} /></td>
                          <td className="text-center">
                            {a.inClassEvents > 0 ? <span style={{ color: '#22c55e', fontWeight: 700 }}>{a.inClassEvents}</span> : '—'}
                          </td>
                          <td className="text-center">
                            {a.outClassEvents > 0 ? <span style={{ color: '#3b82f6', fontWeight: 700 }}>{a.outClassEvents}</span> : '—'}
                          </td>
                          <td>{fmtTime(a.firstSeen)}</td>
                          <td>{fmtTime(a.lastSeen)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* TAB: SCORES */}
            {tab === 'scores' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin2-panel">
                <div className="filter-row">
                  <div className="filter-group">
                    <label>ชั้นเรียน</label>
                    <select value={classroom} onChange={(e) => setClassroom(e.target.value)}>
                      <option value="all">ทุกห้อง</option>
                      {allClassrooms.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="filter-group" style={{ flex: 1 }}>
                    <label><Search size={14} /> ค้นหาชื่อ/เลขที่</label>
                    <input type="text" placeholder="ค้นหา..." value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>
                  <button className="btn-export" onClick={exportScoresCSV}>
                    <Download size={16} /> Export CSV
                  </button>
                </div>

                <div className="att-table-wrap">
                  <table className="att-table">
                    <thead>
                      <tr>
                        <th>เลขที่</th>
                        <th>ห้อง</th>
                        <th>ชื่อ-นามสกุล</th>
                        <th>หน่วยที่เริ่ม</th>
                        <th>หน่วยที่จบ</th>
                        <th><FileText size={12}/> สไลด์</th>
                        <th><PlayCircle size={12}/> วิดีโอ</th>
                        <th><Gamepad2 size={12}/> กิจกรรม</th>
                        <th><Award size={12}/> ทำควิซ</th>
                        <th>คะแนนรวม</th>
                        <th>ใช้งานล่าสุด</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.length === 0 ? (
                        <tr><td colSpan={12} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                          ไม่พบข้อมูลนักเรียน
                        </td></tr>
                      ) : filteredStudents.map((s) => {
                        const p = s.progress;
                        const videos = p ? Object.values(p.units || {}).reduce((a, u) => a + (u.videosClicked?.length || 0), 0) : 0;
                        const fun = p ? Object.values(p.units || {}).reduce((a, u) => a + (u.funClicked?.length || 0), 0) : 0;
                        const attempts = p ? Object.values(p.units || {}).reduce((a, u) => a + (u.quizAttempts || 0), 0) : 0;
                        return (
                          <tr key={s.id}>
                            <td>{s.studentNumber}</td>
                            <td>{s.classroom}</td>
                            <td>{s.name}</td>
                            <td className="text-center">{Object.keys(p?.units || {}).length}</td>
                            <td className="text-center" style={{ color: '#22c55e', fontWeight: 700 }}>{p?.unitsCompleted || 0}</td>
                            <td className="text-center">{p?.totalSlidesViewed || 0}</td>
                            <td className="text-center">{videos}</td>
                            <td className="text-center">{fun}</td>
                            <td className="text-center">{attempts}</td>
                            <td className="text-center" style={{ fontWeight: 800, color: '#6366f1' }}>{p?.totalPoints || 0}</td>
                            <td style={{ fontSize: '0.78rem' }}>{fmtDateTime(p?.lastActive)}</td>
                            <td>
                              <button className="link-btn" onClick={() => { setSelectedStudent(s.id); setTab('development'); }}>
                                ดูพัฒนาการ →
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* TAB: DEVELOPMENT */}
            {tab === 'development' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin2-panel">
                <div className="filter-row">
                  <div className="filter-group" style={{ flex: 1 }}>
                    <label>เลือกนักเรียน</label>
                    <select value={selectedStudent || ''} onChange={(e) => setSelectedStudent(e.target.value)}>
                      <option value="">— เลือกนักเรียน —</option>
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.classroom} เลขที่ {s.studentNumber} — {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedStudent ? (
                  <StudentDetail student={students.find((s) => s.id === selectedStudent)!} />
                ) : (
                  <div className="empty-state-card">
                    <TrendingUp size={48} style={{ color: '#6366f1' }} />
                    <h3>เลือกนักเรียนเพื่อดูพัฒนาการ</h3>
                    <p>คุณจะเห็นกราฟคะแนนตามวัน รายการกิจกรรม และความก้าวหน้าทุกหน่วย</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB: ROSTER */}
            {tab === 'roster' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin2-panel">
                <div style={{ marginBottom: '1rem' }}>
                  <h2 style={{ margin: '0 0 0.25rem' }}>👥 จัดการรายชื่อนักเรียน</h2>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
                    เพิ่ม/แก้ไข/ลบนักเรียน • ย้ายห้อง • จัดเรียงเลขที่ • Export CSV
                  </p>
                </div>
                <StudentManager />
              </motion.div>
            )}

            {/* TAB: GRADEBOOK */}
            {tab === 'gradebook' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin2-panel">
                <div style={{ marginBottom: '1rem' }}>
                  <h2 style={{ margin: '0 0 0.25rem' }}>📋 สมุดเก็บคะแนน K/P/A — ปีการศึกษา 2569</h2>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
                    เลียนแบบไฟล์ "คมด.เก็บคะแนน V.2 2568" — มีรายชื่อจริงจากโรงเรียนบ้านคลองมดแดง พร้อมกรอก K, P, A ต่อตัวชี้วัด
                  </p>
                </div>
                <GradeBook />
              </motion.div>
            )}

            {/* TAB: STUDENT ASSESSMENTS */}
            {tab === 'assessments' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin2-panel">
                <StudentAssessmentHub />
              </motion.div>
            )}

            {/* TAB: SKILL (ทักษะอาชีพ) */}
            {tab === 'skill' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin2-panel">
                <div style={{ marginBottom: '1rem' }}>
                  <h2 style={{ margin: '0 0 0.25rem' }}>🎨 เก็บคะแนนวิชาทักษะอาชีพ</h2>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
                    Online Marketing / Canva / Logo / Poster — ครูใส่ K (0-100) + P (พอใช้/ปานกลาง/ดี) เอง บันทึกอัตโนมัติลง Firebase
                  </p>
                </div>
                <SkillGradeTable />
              </motion.div>
            )}

            {/* TAB: BONUS — Quick reward / sticker */}
            {tab === 'bonus' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin2-panel">
                <div style={{ marginBottom: '1rem' }}>
                  <h2 style={{ margin: '0 0 0.25rem' }}>🎁 แจกรางวัล / โบนัส</h2>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
                    คลิกชื่อเด็ก → เลือก preset หรือกำหนดเอง (emoji + เหตุผล + XP) → ส่ง — XP เพิ่มทันทีใน Dashboard เด็ก, sync Firebase ข้ามเครื่อง
                  </p>
                </div>
                <BonusAwarder />
              </motion.div>
            )}

            {/* TAB: QUICK ATTENDANCE — ครูคลิกมา/ขาด/ลา */}
            {tab === 'quick-att' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin2-panel">
                <div style={{ marginBottom: '1rem' }}>
                  <h2 style={{ margin: '0 0 0.25rem' }}>✅ เช็คชื่อ Quick (มา / ขาด / ลา)</h2>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
                    คลิกสถานะหน้าห้องเรียน — เซ็ตทุกคนพร้อมกันได้ — มาเรียน +5 XP, ขาด/ลาไม่มี XP
                  </p>
                </div>
                <QuickAttendance />
              </motion.div>
            )}

            {/* TAB: RESEARCH — สร้างเอกสารงานวิจัย */}
            {tab === 'research' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin2-panel">
                <div style={{ marginBottom: '1rem' }}>
                  <h2 style={{ margin: '0 0 0.25rem' }}>📄 สร้างเอกสารงานวิจัย (WBI + ADDIE)</h2>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
                    ดึงผลสัมฤทธิ์จริงจากกระดาษเกรดมาคำนวณ ประกอบเป็นเอกสารวิจัย 5 บท — พิมพ์/คัดลอก/ให้ AI เรียบเรียงต่อได้
                  </p>
                </div>
                <ResearchGenerator />
              </motion.div>
            )}

            {/* TAB: DAILY — คำถามประจำวัน */}
            {tab === 'daily' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin2-panel">
                <div style={{ marginBottom: '1rem' }}>
                  <h2 style={{ margin: '0 0 0.25rem' }}>❓ คำถามประจำวัน</h2>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
                    ครูตั้งคำถาม 1 ข้อต่อวัน — เด็กเห็นบน Dashboard ตอบครั้งเดียว, ถูก +10 XP / ผิด +3 XP
                  </p>
                </div>
                <DailyQuestionEditor />
              </motion.div>
            )}

            {/* TAB: ANNOUNCEMENTS */}
            {tab === 'announcements' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin2-panel">
                <div style={{ marginBottom: '1rem' }}>
                  <h2 style={{ margin: '0 0 0.25rem' }}>📣 ประกาศข่าวสาร</h2>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
                    สร้างประกาศแจ้งนักเรียน — แสดงบนหน้าหลักและ Dashboard ของนักเรียน
                  </p>
                </div>
                <AnnouncementManager />
              </motion.div>
            )}

            {/* TAB: CALENDAR */}
            {tab === 'calendar' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin2-panel">
                <div style={{ marginBottom: '1rem' }}>
                  <h2 style={{ margin: '0 0 0.25rem' }}>📅 ปฏิทินกิจกรรม</h2>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
                    เพิ่มกำหนดส่งงาน, สอบ, กิจกรรมพิเศษ — แสดงใน Dashboard นักเรียน 14 วันล่วงหน้า
                  </p>
                </div>
                <CalendarManager />
              </motion.div>
            )}

            {/* TAB: HOMEWORK */}
            {tab === 'homework' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin2-panel">
                <div style={{ marginBottom: '1rem' }}>
                  <h2 style={{ margin: '0 0 0.25rem' }}>📝 ส่งการบ้าน</h2>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
                    สร้างการบ้านให้นักเรียน • ตรวจงาน • ให้คะแนน + feedback
                  </p>
                </div>
                <HomeworkManager />
              </motion.div>
            )}

            {/* TAB: THEME */}
            {tab === 'theme' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin2-panel">
                <div style={{ marginBottom: '1rem' }}>
                  <h2 style={{ margin: '0 0 0.25rem' }}>🎨 ธีม & สำรองข้อมูล</h2>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
                    เปลี่ยนธีมสี • Dark mode • Backup/Restore ข้อมูลทั้งระบบ • ติดตั้งเป็นแอป PWA
                  </p>
                </div>
                <ThemeCustomizer />
              </motion.div>
            )}

            {/* TAB: ERRORS */}
            {tab === 'errors' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin2-panel">
                <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ margin: '0 0 0.25rem' }}>🐛 Error Log</h2>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
                      รายการ error ที่เกิดขึ้นในเว็บ (เก็บใน localStorage นี้เท่านั้น สูงสุด 50 รายการ)
                    </p>
                  </div>
                  <button
                    className="btn-secondary"
                    onClick={() => { if (confirm('ลบ error log ทั้งหมด?')) { clearErrors(); window.location.reload(); } }}
                  >
                    ล้างทั้งหมด
                  </button>
                </div>
                {(() => {
                  const errors = loadErrors();
                  if (errors.length === 0) {
                    return (
                      <div className="empty-state-card">
                        <Bug size={48} color="#22c55e" />
                        <h3>ไม่มี error 🎉</h3>
                        <p>เว็บทำงานปกติดี</p>
                      </div>
                    );
                  }
                  return (
                    <div className="att-table-wrap">
                      <table className="att-table">
                        <thead>
                          <tr>
                            <th>เวลา</th>
                            <th>ประเภท</th>
                            <th>ข้อความ</th>
                            <th>หน้า</th>
                            <th>User</th>
                          </tr>
                        </thead>
                        <tbody>
                          {errors.map((e) => (
                            <tr key={e.id}>
                              <td style={{ fontSize: '0.78rem' }}>{new Date(e.timestamp).toLocaleString('th-TH')}</td>
                              <td><span style={{
                                padding: '2px 8px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700,
                                background: e.type === 'crash' ? '#fee2e2' : '#fef3c7',
                                color: e.type === 'crash' ? '#991b1b' : '#92400e',
                              }}>{e.type}</span></td>
                              <td><strong>{e.message}</strong>{e.stack && <details><summary style={{ cursor: 'pointer', fontSize: '0.78rem', color: '#6366f1' }}>stack</summary><pre style={{ fontSize: '0.7rem', overflow: 'auto', maxHeight: 100 }}>{e.stack}</pre></details>}</td>
                              <td style={{ fontSize: '0.78rem', color: '#6b7280' }}>{e.url.replace(window.location.origin, '')}</td>
                              <td style={{ fontSize: '0.78rem' }}>{e.user || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </motion.div>
            )}

            {/* TAB: COURSES */}
            {tab === 'courses' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin2-panel">
                <div style={{ marginBottom: '1rem' }}>
                  <h2 style={{ margin: '0 0 0.25rem' }}>📚 จัดการรายวิชาและเนื้อหา</h2>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
                    สร้างรายวิชา เพิ่มหน่วย แก้ไขเนื้อหา ลิงก์สื่อ และแบบทดสอบ — บันทึกในเครื่องและส่งออก JSON ได้
                  </p>
                </div>
                <CourseBuilder />
              </motion.div>
            )}

            {/* TAB: PRIMARY TECHNOLOGY TEACHING PLANS */}
            {tab === 'p1-plan' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin2-panel">
                <P1TechnologyPlan />
              </motion.div>
            )}

            {/* TAB: COURSE PLAN — LEARNING OUTCOME #5 (ป.1-6) */}
            {tab === 'course-plan5' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin2-panel">
                <CoursePlan5 />
              </motion.div>
            )}

            {/* TAB: LOCKS */}
            {tab === 'locks' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin2-panel">
                <div style={{ marginBottom: '1rem' }}>
                  <h2 style={{ margin: '0 0 0.25rem' }}>🔒 ล็อกเนื้อหา/บทเรียน</h2>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
                    กำหนดเงื่อนไขการเข้าถึงบทเรียนสำหรับนักเรียน
                  </p>
                </div>
                <LessonLockManager />
              </motion.div>
            )}

            {/* TAB: SLIDES */}
            {tab === 'slides' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin2-panel">
                <SlideManager />
              </motion.div>
            )}

            {/* TAB: SCHEDULE */}
            {tab === 'schedule' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin2-panel">
                <ScheduleEditor schedule={schedule} setSchedule={setSchedule} />
              </motion.div>
            )}

            {/* TAB: SITE INFO */}
            {tab === 'site' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin2-panel">
                <SiteInfo stats={stats} students={students} />
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ================= Subcomponents =================

const KPI: React.FC<{ icon: React.ReactNode; color: string; label: string; value: number; sub: string }> = ({ icon, color, label, value, sub }) => (
  <div className="kpi-card">
    <div className="kpi-icon" style={{ background: `${color}20`, color }}>{icon}</div>
    <div className="kpi-info">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value.toLocaleString()}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  </div>
);

const SummaryPill: React.FC<{ label: string; count: number; color: string }> = ({ label, count, color }) => (
  <div className="sum-pill" style={{ borderLeftColor: color }}>
    <span className="sum-count" style={{ color }}>{count}</span>
    <span className="sum-label">{label}</span>
  </div>
);

const statusLabel = (s: AttendanceRecord['status']) => {
  switch (s) {
    case 'present': return 'มาเรียน';
    case 'self-study': return 'เรียนเอง';
    case 'absent': return 'ขาด';
  }
};

const StatusChip: React.FC<{ status: AttendanceRecord['status'] }> = ({ status }) => {
  const map = {
    present: { c: '#22c55e', bg: '#dcfce7', icon: <CheckCircle2 size={14}/> },
    'self-study': { c: '#3b82f6', bg: '#dbeafe', icon: <BookOpen size={14}/> },
    absent: { c: '#ef4444', bg: '#fee2e2', icon: <XCircle size={14}/> },
  };
  const m = map[status];
  return (
    <span className="status-chip" style={{ color: m.c, background: m.bg }}>
      {m.icon} {statusLabel(status)}
    </span>
  );
};

const StudentDetail: React.FC<{ student: StudentRecord }> = ({ student }) => {
  const dev = getStudentDevelopment(student);
  const p = student.progress;
  const maxPct = 100;
  const points = (_date: string, pct: number, i: number, total: number) => {
    const x = total > 1 ? (i / (total - 1)) * 100 : 50;
    const y = 100 - (pct / maxPct) * 100;
    return `${x},${y}`;
  };
  const polyline = dev.map((d, i) => points(d.date, d.avgPct, i, dev.length)).join(' ');

  return (
    <div className="student-detail">
      <div className="sd-header">
        <div className="sd-avatar">{student.name.charAt(0)}</div>
        <div>
          <h2>{student.name}</h2>
          <p>ชั้น {student.classroom} • เลขที่ {student.studentNumber}</p>
          <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
            ใช้งานล่าสุด: {fmtDateTime(p?.lastActive)}
          </p>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginTop: '1.5rem' }}>
        <KPI icon={<Award />} color="#6366f1" label="คะแนนรวม" value={p?.totalPoints || 0} sub="คะแนน" />
        <KPI icon={<FileText />} color="#a855f7" label="สไลด์ที่อ่าน" value={p?.totalSlidesViewed || 0} sub="หน้า" />
        <KPI icon={<Gamepad2 />} color="#ec4899" label="กิจกรรม" value={p?.totalActivities || 0} sub="ครั้ง" />
        <KPI icon={<CheckCircle2 />} color="#22c55e" label="หน่วยจบแล้ว" value={p?.unitsCompleted || 0} sub={`จาก ${Object.keys(p?.units || {}).length} หน่วย`} />
      </div>

      <h3 style={{ marginTop: '2rem' }}>📈 กราฟพัฒนาการ (คะแนนเฉลี่ยรายวัน)</h3>
      {dev.length === 0 ? (
        <p style={{ color: '#6b7280' }}>ยังไม่มีข้อมูลการทำแบบทดสอบ</p>
      ) : (
        <div className="dev-chart">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: 200 }}>
            <line x1="0" y1="20" x2="100" y2="20" stroke="#e5e7eb" strokeWidth="0.2" strokeDasharray="0.5"/>
            <line x1="0" y1="50" x2="100" y2="50" stroke="#e5e7eb" strokeWidth="0.2" strokeDasharray="0.5"/>
            <line x1="0" y1="80" x2="100" y2="80" stroke="#e5e7eb" strokeWidth="0.2" strokeDasharray="0.5"/>
            <polyline points={polyline} fill="none" stroke="#6366f1" strokeWidth="0.8" />
            {dev.map((d, i) => {
              const x = dev.length > 1 ? (i / (dev.length - 1)) * 100 : 50;
              const y = 100 - (d.avgPct / maxPct) * 100;
              return <circle key={i} cx={x} cy={y} r="1.5" fill="#6366f1" />;
            })}
          </svg>
          <div className="dev-x-labels">
            {dev.map((d, i) => (
              <span key={i} style={{ fontSize: '0.7rem' }}>
                {d.date.slice(5)} ({Math.round(d.avgPct)}%)
              </span>
            ))}
          </div>
        </div>
      )}

      <h3 style={{ marginTop: '2rem' }}>🎯 ความก้าวหน้าแต่ละหน่วย</h3>
      <div className="unit-grid">
         {Object.entries(p?.units || {}).map(([k, u]: [string, { completionPct: number; slidesViewed?: number[]; totalSlides?: number; videosClicked?: string[]; funClicked?: string[]; bestQuizScore?: number; bestQuizMax?: number }]) => (
          <div key={k} className="unit-progress-card">
            <h4>{k}</h4>
            <div className="upc-pct">{u.completionPct}%</div>
            <div className="upc-stats">
              <span><FileText size={11}/> {u.slidesViewed?.length || 0}/{u.totalSlides || 0}</span>
              <span><PlayCircle size={11}/> {u.videosClicked?.length || 0}</span>
              <span><Gamepad2 size={11}/> {u.funClicked?.length || 0}</span>
              <span><Award size={11}/> {u.bestQuizScore || 0}/{u.bestQuizMax || 0}</span>
            </div>
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: '2rem' }}>📜 ประวัติการทำแบบทดสอบ</h3>
      {(p?.attempts || []).length === 0 ? <p style={{ color: '#6b7280' }}>ยังไม่มีประวัติ</p> : (
        <div className="att-table-wrap">
          <table className="att-table">
            <thead>
              <tr><th>เวลา</th><th>หน่วย</th><th>คะแนน</th><th>เปอร์เซ็นต์</th></tr>
            </thead>
            <tbody>
              {(p?.attempts || []).slice(0, 30).map((a, i) => (
                <tr key={i}>
                  <td>{fmtDateTime(a.timestamp)}</td>
                  <td>{a.gradeId} หน่วย {a.unitNo}</td>
                  <td>{a.score}/{a.maxScore}</td>
                  <td style={{ color: a.percentage >= 80 ? '#22c55e' : a.percentage >= 50 ? '#f59e0b' : '#ef4444', fontWeight: 700 }}>
                    {a.percentage}%
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

const HourMinutePicker: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  const [h, m] = (value || '08:00').split(':');
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
  
  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', justifyContent: 'center' }}>
      <select 
        value={h || '08'} 
        onChange={(e) => onChange(`${e.target.value}:${m || '00'}`)} 
        style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #d1d5db', background: 'white', fontSize: '0.88rem', width: '60px', textAlign: 'center' }}
      >
        {hours.map(hr => <option key={hr} value={hr}>{hr}</option>)}
      </select>
      <span style={{ fontWeight: 'bold' }}>:</span>
      <select 
        value={m || '00'} 
        onChange={(e) => onChange(`${h || '08'}:${e.target.value}`)} 
        style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #d1d5db', background: 'white', fontSize: '0.88rem', width: '60px', textAlign: 'center' }}
      >
        {minutes.map(mn => <option key={mn} value={mn}>{mn}</option>)}
      </select>
    </div>
  );
};

const ScheduleEditor: React.FC<{ schedule: ClassSlot[]; setSchedule: (s: ClassSlot[]) => void }> = ({ schedule, setSchedule }) => {
  const [draft, setDraft] = useState<ClassSlot[]>(schedule);

  useEffect(() => {
    const timer = window.setTimeout(() => setDraft(schedule), 0);
    return () => window.clearTimeout(timer);
  }, [schedule]);

  const update = (id: string, patch: Partial<ClassSlot>) => {
    setDraft(draft.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };
  const add = () => {
    setDraft([
      ...draft,
      { id: `s${Date.now()}`, classroom: 'ป.1', day: 1, start: '08:30', end: '09:30', subject: 'เทคโนโลยี' },
    ]);
  };
  const remove = (id: string) => setDraft(draft.filter((s) => s.id !== id));
  const persist = async () => {
    saveSchedule(draft);
    const result = await syncScheduleToFirebase(draft);
    if (!result.ok) {
      alert(`บันทึกในเครื่องแล้ว แต่ยังไม่ขึ้น Firebase\n\nสาเหตุ: ${result.error || 'ไม่ทราบสาเหตุ'}`);
      return;
    }
    setSchedule(draft);
    alert('บันทึกตารางสอนลง Firebase แล้ว ✓');
  };
  const reset = () => {
    setDraft(defaultSchedule);
  };

  return (
    <div>
      <div className="filter-row">
        <button className="btn-secondary" onClick={add}><Plus size={16}/> เพิ่มคาบ</button>
        <button className="btn-secondary" onClick={reset}><RefreshCw size={16}/> รีเซ็ตเป็นค่าเริ่มต้น</button>
        <div style={{ flex: 1 }} />
        <button className="btn-export" onClick={persist}><Save size={16}/> บันทึก</button>
      </div>

      <div className="att-table-wrap">
        <table className="att-table">
          <thead>
            <tr>
              <th>ห้อง</th>
              <th>วัน</th>
              <th style={{ textAlign: 'center' }}>เริ่ม</th>
              <th style={{ textAlign: 'center' }}>สิ้นสุด</th>
              <th>วิชา</th>
              <th style={{ textAlign: 'center' }} title="ติ๊กถ้าเป็นคาบ CS ที่นับ A score">นับเกรด</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {draft.map((s) => (
              <tr key={s.id}>
                <td>
                  <select value={s.classroom} onChange={(e) => update(s.id, { classroom: e.target.value })}>
                    {['ป.1','ป.2','ป.3','ป.4','ป.5','ป.6','ม.1','ม.2','ม.3'].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </td>
                <td>
                  <select value={s.day} onChange={(e) => update(s.id, { day: parseInt(e.target.value) })}>
                    {dayNames.map((n, i) => <option key={i} value={i}>{n}</option>)}
                  </select>
                </td>
                <td><HourMinutePicker value={s.start} onChange={(val) => update(s.id, { start: val })} /></td>
                <td><HourMinutePicker value={s.end} onChange={(val) => update(s.id, { end: val })} /></td>
                <td><input type="text" value={s.subject || ''} onChange={(e) => update(s.id, { subject: e.target.value })} /></td>
                <td style={{ textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={!s.excludeFromGrading}
                    onChange={(e) => update(s.id, { excludeFromGrading: !e.target.checked })}
                    title="ติ๊ก = เป็นคาบ CS ที่นับ A score / ไม่ติ๊ก = แสดงเฉยๆ ไม่ผูกเกรด"
                  />
                </td>
                <td>
                  <button className="link-btn danger" onClick={() => remove(s.id)}>
                    <Trash2 size={14}/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 style={{ marginTop: '2rem' }}>👁️ ตารางสอนแบบ Grid</h3>
      <div className="schedule-grid">
        <div className="sg-cell sg-head">เวลา</div>
        {[1,2,3,4,5].map((d) => <div key={d} className="sg-cell sg-head">{dayNamesShort[d]}</div>)}
        {['08:00','09:00','10:00','11:00','13:00','14:00','15:00'].map((t) => (
          <React.Fragment key={t}>
            <div className="sg-cell sg-time">{t}</div>
            {[1,2,3,4,5].map((d) => {
              const slot = draft.find((s) => s.day === d && s.start.startsWith(t.slice(0, 2)));
              return (
                <div key={d} className="sg-cell">
                  {slot ? (
                    <div className="sg-block">
                      <strong>{slot.classroom}</strong>
                      <small>{slot.start}-{slot.end}</small>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const SiteInfo: React.FC<{ stats: ReturnType<typeof getSiteStats>; students: StudentRecord[] }> = ({ stats }) => {
  const fbConfigured = !!import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const toast = useToast();

  const handleBackup = () => {
    try {
      const backup: Record<string, string> = {};
      let keysFound = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('krujames_')) {
          const val = localStorage.getItem(key);
          if (val !== null) {
            backup[key] = val;
            keysFound++;
          }
        }
      }
      if (keysFound === 0) {
        toast.show('ไม่พบข้อมูลสำหรับระบบ KruJames ในเครื่องนี้', 'info');
        return;
      }
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `krujames_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.show(`ส่งออกข้อมูลสำรองเรียบร้อยแล้ว (${keysFound} รายการ) ✓`, 'success');
    } catch (e) {
      console.warn(e);
      toast.show('เกิดข้อผิดพลาดในการสร้างไฟล์สำรอง', 'error');
    }
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);
        if (typeof data !== 'object' || data === null) {
          throw new Error('รูปแบบไฟล์ไม่ถูกต้อง');
        }
        const keys = Object.keys(data);
        const validKeys = keys.filter((k) => k.startsWith('krujames_'));
        if (validKeys.length === 0) {
          toast.show('ไม่พบข้อมูลสำหรับระบบ KruJames ในไฟล์นี้', 'error');
          return;
        }
        if (
          confirm(
            `ต้องการกู้คืนข้อมูลจำนวน ${validKeys.length} รายการจากไฟล์สำรองใช่ไหม? \n\n⚠️ คำเตือน: ข้อมูลเดิมในระบบบนเครื่องนี้จะถูกเขียนทับด้วยข้อมูลในไฟล์สำรอง`
          )
        ) {
          validKeys.forEach((k) => {
            localStorage.setItem(k, data[k]);
          });
          toast.show('กู้คืนข้อมูลระบบเสร็จสิ้น! กำลังโหลดหน้าเว็บใหม่เพื่อความถูกต้อง...', 'success');
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      } catch (e) {
        console.warn(e);
        toast.show('อ่านไฟล์สำรองล้มเหลว กรุณาตรวจสอบความถูกต้องของไฟล์ JSON', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Database Cleaner handlers
  const clearStudentProgress = async () => {
    if (!confirm('⚠️ ยืนยันที่จะล้างข้อมูลความก้าวหน้า (Progress) ของนักเรียน "ทุกคน" บน Firebase ใช่ไหม?\n\nการลบนี้จะส่งผลกับทุกเครื่อง (ไม่ใช่แค่เครื่องนี้)\nสถิติสไลด์ ควิซ และประวัติเข้าเรียนของนักเรียนทุกคนจะหายถาวร')) return;
    const { db } = await import('../services/firebase');
    const { collection, getDocs, deleteDoc } = await import('firebase/firestore');
    const { clearProgressCache } = await import('../services/progressService');
    let count = 0;
    try {
      const snap = await getDocs(collection(db, 'progress'));
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
        count += 1;
      }
      clearProgressCache();
      toast.show(`ล้างข้อมูลความก้าวหน้าจาก Firebase แล้ว (${count} รายการ)`, 'success');
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      toast.show(`ล้างไม่สำเร็จ: ${e instanceof Error ? e.message : String(e)}`, 'error');
    }
  };

  const clearGradebook = () => {
    if (confirm('⚠️ ยืนยันที่จะล้างสมุดเก็บคะแนน K/P/A ทั้งหมดใช่ไหม?\n\nการดำเนินการนี้จะลบข้อมูลการเก็บคะแนนตัวชี้วัด K, P, A ทุกชั้นเรียนที่คุณครูได้บันทึกไว้ในเครื่องนี้')) {
      let count = 0;
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('krujames_grades_v1_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => {
        localStorage.removeItem(k);
        count++;
      });
      toast.show(`ล้างคะแนน K/P/A ในสมุดเก็บคะแนนเรียบร้อยแล้ว (${count} รายการ)`, 'success');
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  const clearRosters = () => {
    if (confirm('⚠️ ยืนยันที่จะรีเซ็ตรายชื่อนักเรียนกลับเป็นค่าเริ่มต้นใช่ไหม?\n\nการดำเนินการนี้จะลบรายชื่อนักเรียนที่ครูเพิ่มหรือแก้ไข และเปลี่ยนกลับไปใช้รายชื่อนักเรียนเริ่มต้นของโรงเรียนบ้านคลองมดแดง ปีการศึกษา 2569')) {
      localStorage.removeItem('krujames_roster_overrides_v1');
      toast.show('รีเซ็ตรายชื่อนักเรียนกลับเป็นค่าเริ่มต้นเรียบร้อยแล้ว', 'success');
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  const clearAnnouncementsAndEvents = () => {
    if (confirm('⚠️ ยืนยันที่จะลบประกาศและปฏิทินกิจกรรมทั้งหมดใช่ไหม?\n\nการดำเนินการนี้จะลบประกาศด่วนและกิจกรรม/วันสอบทั้งหมดในระบบ')) {
      localStorage.removeItem('krujames_announcements_v1');
      localStorage.removeItem('krujames_calendar_events_v1');
      toast.show('ลบประกาศและกิจกรรมเรียบร้อยแล้ว', 'success');
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  const resetScheduleData = async () => {
    if (confirm('⚠️ ยืนยันที่จะรีเซ็ตตารางสอนใช่ไหม?\n\nการดำเนินการนี้จะรีเซ็ตตารางคาบเรียนวิชาเทคโนโลยีกลับเป็นตารางเริ่มต้น')) {
      saveSchedule(defaultSchedule);
      const result = await syncScheduleToFirebase(defaultSchedule);
      toast.show(
        result.ok
          ? 'รีเซ็ตตารางสอนและบันทึก Firebase แล้ว'
          : `รีเซ็ตในเครื่องแล้ว แต่ยังไม่ขึ้น Firebase: ${result.error || 'ไม่ทราบสาเหตุ'}`,
        result.ok ? 'success' : 'error'
      );
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  const factoryResetAll = () => {
    if (confirm('🚨🚨 คำเตือนขั้นสูงสุด: ยืนยันที่จะรีเซ็ตระบบทั้งหมดเป็นค่าเริ่มต้นจากโรงงาน (Factory Reset) ใช่ไหม?\n\nการดำเนินการนี้จะลบข้อมูล "ทุกอย่าง" รวมถึงบัญชีนักเรียน ความก้าวหน้า คะแนนเช็คชื่อ คะแนน K/P/A ตารางสอน และประกาศข่าวสาร (ยกเว้นรหัสผ่าน Admin)\n\nระบบจะล้างข้อมูลและพาท่านกลับสู่หน้าแรก')) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('krujames_') || key === 'current_student' || key === 'current_partner')) {
          if (key !== 'krujames_admin_session_v1') {
            keysToRemove.push(key);
          }
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      toast.show('รีเซ็ตระบบทั้งหมดเรียบร้อยแล้ว! กำลังโหลดหน้าเว็บใหม่...', 'success');
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    }
  };

  return (
    <div className="site-info">
      <div className="kpi-grid">
        <KPI icon={<Users />} color="#6366f1" label="จำนวนผู้ใช้รวม" value={stats.total} sub="คน (จาก localStorage + Firebase)" />
        <KPI icon={<BarChart3 />} color="#22c55e" label="คะแนนสะสมในระบบ" value={stats.totalPoints} sub="คะแนนทั้งหมด" />
      </div>

      <h3 style={{ marginTop: '2rem' }}>🔗 สถานะการเชื่อมต่อระบบ</h3>
      <div className="status-list" style={{ marginBottom: '2rem' }}>
        <div className="status-item">
          <span className={`status-dot ${fbConfigured ? 'green' : 'orange'}`}></span>
          <strong>Firebase Firestore:</strong> {fbConfigured ? '✓ เชื่อมต่อแล้ว (sync ข้ามอุปกรณ์)' : '⚠ ยังไม่ได้ตั้งค่า — ใช้ localStorage อย่างเดียว'}
        </div>
        <div className="status-item">
          <span className="status-dot green"></span>
          <strong>localStorage:</strong> ✓ พร้อมใช้งาน (บันทึกใน browser ของคุณ)
        </div>
        <div className="status-item">
          <span className="status-dot green"></span>
          <strong>ระบบติดตามความก้าวหน้า:</strong> ✓ ทำงานเรียลไทม์
        </div>
      </div>

      <h3 style={{ marginTop: '2rem' }}>🔑 รหัสเข้าระบบ (Access Code)</h3>
      <AccessCodeEditor />

      <h3 style={{ marginTop: '2rem' }}>💾 สำรองข้อมูลและกู้คืนระบบ (Backup & Restore)</h3>
      <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1rem' }}>
        คุณสามารถดาวน์โหลดข้อมูลทั้งหมดในระบบ (คะแนนนักเรียน, การเช็คชื่อ, ตารางสอน, กิจกรรม) เก็บไว้เป็นไฟล์สำรอง และนำกลับมากู้คืนได้ทุกเมื่อเพื่อป้องกันข้อมูลสูญหาย
      </p>
      <div className="status-list" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', background: 'rgba(99, 102, 241, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.15)', marginBottom: '2rem' }}>
        <button className="btn-export" onClick={handleBackup} style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1.25rem', borderRadius: '10px' }}>
          <Download size={16} /> ส่งออกข้อมูลสำรอง (Backup JSON)
        </button>
        <div style={{ display: 'inline-flex', alignItems: 'center', position: 'relative' }}>
          <label htmlFor="restore-upload" className="btn-secondary" style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1.25rem', borderRadius: '10px', background: 'white', border: '1px solid #e5e7eb', cursor: 'pointer', fontWeight: 600 }}>
            📥 นำเข้าเพื่อกู้คืน (Restore JSON)
          </label>
          <input
            id="restore-upload"
            type="file"
            accept=".json"
            onChange={handleRestore}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      <h3 style={{ marginTop: '2rem' }}>🧹 จัดการและล้างข้อมูลระบบ (Database Management & Cleaner)</h3>
      <p style={{ fontSize: '0.85rem', color: '#ef4444', marginBottom: '1rem', fontWeight: 600 }}>
        ⚠️ คำเตือน: การลบข้อมูลด้านล่างนี้จะทำลายข้อมูลถาวรในเบราว์เซอร์นี้ กรุณาส่งออกไฟล์สำรองก่อนลบข้อมูลเสมอ
      </p>
      <div className="database-cleaner-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        
        {/* Card 1: Clear Progress */}
        <div style={{ background: '#fff', border: '1px solid #fee2e2', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(239, 68, 68, 0.03)' }}>
          <div>
            <h4 style={{ margin: '0 0 0.5rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}><Activity size={18} /> ล้างข้อมูลความก้าวหน้านักเรียน</h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280', lineHeight: 1.4 }}>ล้างข้อมูลการเรียนทั้งหมด ได้แก่ คะแนนสอบควิซ (K), สถิติการเข้าอ่านสไลด์, สถิติการคลิกดูวิดีโอ, กิจกรรม และประวัติเช็คชื่อของนักเรียนทุกคน</p>
          </div>
          <button className="btn-secondary" onClick={clearStudentProgress} style={{ color: '#ef4444', border: '1px solid #fecaca', background: '#fef2f2', marginTop: '1.25rem', width: '100%', fontWeight: 700 }}>
            ล้างข้อมูลความก้าวหน้า
          </button>
        </div>

        {/* Card 2: Clear Gradebook */}
        <div style={{ background: '#fff', border: '1px solid #fee2e2', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(239, 68, 68, 0.03)' }}>
          <div>
            <h4 style={{ margin: '0 0 0.5rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}><Award size={18} /> ล้างคะแนนสมุดเก็บคะแนน K/P/A</h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280', lineHeight: 1.4 }}>ลบตารางคะแนนเก็บของครูที่บันทึกไว้ในสมุดเก็บคะแนน K/P/A ของทุกห้องเรียนและทุกวิชาที่ถูกบันทึกในเครื่องนี้</p>
          </div>
          <button className="btn-secondary" onClick={clearGradebook} style={{ color: '#ef4444', border: '1px solid #fecaca', background: '#fef2f2', marginTop: '1.25rem', width: '100%', fontWeight: 700 }}>
            ล้างตารางเก็บคะแนน
          </button>
        </div>

        {/* Card 3: Reset Rosters */}
        <div style={{ background: '#fff', border: '1px solid #fee2e2', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(239, 68, 68, 0.03)' }}>
          <div>
            <h4 style={{ margin: '0 0 0.5rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={18} /> รีเซ็ตรายชื่อนักเรียนเริ่มต้น</h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280', lineHeight: 1.4 }}>ลบข้อมูลการแก้ไขรายชื่อนักเรียน (การเพิ่ม, แก้ไขชื่อ, สลับเลขที่, ย้ายห้อง) และเปลี่ยนกลับไปใช้รายชื่อนักเรียนดั้งเดิมจากโรงเรียน</p>
          </div>
          <button className="btn-secondary" onClick={clearRosters} style={{ color: '#dc2626', border: '1px solid #fecaca', background: '#fef2f2', marginTop: '1.25rem', width: '100%', fontWeight: 700 }}>
            รีเซ็ตรายชื่อเริ่มต้น
          </button>
        </div>

        {/* Card 4: Clear announcements/calendar */}
        <div style={{ background: '#fff', border: '1px solid #fee2e2', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(239, 68, 68, 0.03)' }}>
          <div>
            <h4 style={{ margin: '0 0 0.5rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}><Megaphone size={18} /> ล้างประกาศและกิจกรรมปฏิทิน</h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280', lineHeight: 1.4 }}>ลบข้อมูลบอร์ดประกาศข่าวสารด่วนของระบบ และการบ้าน/ปฏิทินวันสอบที่คุณครูได้สร้างปักหมุดไว้สำหรับนักเรียนทั้งหมด</p>
          </div>
          <button className="btn-secondary" onClick={clearAnnouncementsAndEvents} style={{ color: '#ef4444', border: '1px solid #fecaca', background: '#fef2f2', marginTop: '1.25rem', width: '100%', fontWeight: 700 }}>
            ลบประกาศ & กิจกรรม
          </button>
        </div>

        {/* Card 5: Reset Schedule */}
        <div style={{ background: '#fff', border: '1px solid #fee2e2', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(239, 68, 68, 0.03)' }}>
          <div>
            <h4 style={{ margin: '0 0 0.5rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={18} /> รีเซ็ตตารางสอนเริ่มต้น</h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280', lineHeight: 1.4 }}>ลบข้อมูลตารางเวลาเรียนเทคโนโลยีที่คุณครูได้ปรับเปลี่ยน และกลับไปใช้ค่าเริ่มต้นของตารางการสอนดั้งเดิม</p>
          </div>
          <button className="btn-secondary" onClick={resetScheduleData} style={{ color: '#ef4444', border: '1px solid #fecaca', background: '#fef2f2', marginTop: '1.25rem', width: '100%', fontWeight: 700 }}>
            รีเซ็ตตารางสอน
          </button>
        </div>

        {/* Card 6: FACTORY RESET ALL */}
        <div style={{ background: 'linear-gradient(135deg, #fff5f5 0%, #fee2e2 100%)', border: '2px dashed #f87171', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.08)' }}>
          <div>
            <h4 style={{ margin: '0 0 0.5rem', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}><Trash2 size={18} /> ล้างข้อมูลทั้งหมด (Factory Reset)</h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#991b1b', lineHeight: 1.4 }}>ล้างฐานข้อมูล "ทุกอย่าง" ในเบราว์เซอร์นี้ (คะแนนนักเรียน, การเช็คชื่อ, คะแนนสมุด K/P/A, ตารางเรียน, ประกาศ และรายชื่อที่ปรับแต่ง) กลับสู่สภาพเริ่มต้นเพิ่งติดตั้งเว็บไซต์</p>
          </div>
          <button className="btn-export" onClick={factoryResetAll} style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 0, color: 'white', marginTop: '1.25rem', width: '100%', fontWeight: 800, padding: '0.75rem' }}>
            🚨🚨 รีเซ็ตระบบทั้งหมด 🚨🚨
          </button>
        </div>
      </div>

      <h3 style={{ marginTop: '2rem' }}>📚 เนื้อหาในเว็บการสอน</h3>
      <div className="content-summary">
        <div className="cs-card">
          <BookOpen size={32} style={{ color: '#6366f1' }} />
          <h4>คอร์สเรียน</h4>
          <p><strong>10 ระดับชั้น</strong> ป.1 - ม.3 + AI 3 คอร์ส</p>
        </div>
        <div className="cs-card">
          <FileText size={32} style={{ color: '#a855f7' }} />
          <h4>สไลด์การสอน</h4>
          <p>มากกว่า <strong>500+ สไลด์</strong> เรียบเรียงใหม่ตามตัวชี้วัด</p>
        </div>
        <div className="cs-card">
          <Award size={32} style={{ color: '#f59e0b' }} />
          <h4>แบบทดสอบ</h4>
          <p><strong>200+ ข้อ</strong> พร้อมเฉลย</p>
        </div>
        <div className="cs-card">
          <Gamepad2 size={32} style={{ color: '#ec4899' }} />
          <h4>กิจกรรม no-login</h4>
          <p>Teachable Machine, Quick Draw, Code.org และอีกมาก</p>
        </div>
      </div>

      <h3 style={{ marginTop: '2rem' }}>ℹ️ ข้อมูลเว็บไซต์</h3>
      <table className="info-table">
        <tbody>
          <tr><td>ชื่อเว็บ</td><td><strong>Kru James Soncom — ห้องเรียนเทคโนโลยี</strong></td></tr>
          <tr><td>เป้าหมาย</td><td>ป.1 - ม.3 (วิทยาการคำนวณ + การออกแบบเทคโนโลยี + AI)</td></tr>
          <tr><td>เทคโนโลยี</td><td>React 18 + TypeScript + Vite + Framer Motion</td></tr>
          <tr><td>ฐานข้อมูล</td><td>{fbConfigured ? 'Firebase Firestore + localStorage' : 'localStorage (offline-first)'}</td></tr>
          <tr><td>การติดตาม</td><td>สไลด์ • วิดีโอ • เกม • บทความ • แบบทดสอบ (เรียลไทม์)</td></tr>
          <tr><td>นักเรียนในระบบ</td><td>{stats.total} คน • Active 7 วัน {stats.activeWeek} คน</td></tr>
        </tbody>
      </table>
    </div>
  );
};

// ================= Access Code Editor =================
const AccessCodeEditor: React.FC = () => {
  const toast = useToast();
  const [code, setCode] = useState<string>('');
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { loadSiteSettings, fetchSiteSettingsFromFirebase } = await import('../services/siteSettingsService');
      const remote = await fetchSiteSettingsFromFirebase();
      const s = remote || loadSiteSettings();
      setCode(s.accessCode);
      setLoaded(true);
    };
    void init();
  }, []);

  const handleSave = async () => {
    if (!code.trim()) { toast.show('รหัสว่างไม่ได้', 'error'); return; }
    setSaving(true);
    const { saveSiteSettings } = await import('../services/siteSettingsService');
    const result = await saveSiteSettings({ accessCode: code.trim() });
    setSaving(false);
    if (result.ok) {
      toast.show(`บันทึกรหัสใหม่ "${code.trim()}" ลง Firebase แล้ว ✓ — นักเรียนต้องใช้รหัสนี้เข้าระบบในครั้งถัดไป`, 'success');
    } else {
      toast.show(`บันทึกไม่สำเร็จ: ${result.error || 'ไม่ทราบสาเหตุ'}`, 'error');
    }
  };

  return (
    <div style={{
      background: 'rgba(99, 102, 241, 0.05)', padding: '1.25rem',
      borderRadius: 12, border: '1px solid rgba(99, 102, 241, 0.15)',
      marginBottom: '2rem',
    }}>
      <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '0 0 12px' }}>
        นักเรียนต้องใส่รหัสนี้ก่อนเข้าใช้งานเว็บ ครูเปลี่ยนได้ทุกเมื่อ — เปลี่ยนแล้ว sync Firebase ไปทุกเครื่อง
        (เครื่องที่ login อยู่แล้วยังเข้าใช้ต่อได้จนกว่าจะปิด browser)
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={!loaded || saving}
          placeholder="รหัสเข้าระบบ"
          spellCheck={false}
          style={{
            flex: 1, minWidth: 200, padding: '10px 14px',
            fontSize: '1.1rem', letterSpacing: '0.2rem',
            border: '2px solid #d1d5db', borderRadius: 10,
            fontFamily: 'inherit', textTransform: 'lowercase',
          }}
        />
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={!loaded || saving}
          style={{ padding: '10px 24px' }}
        >
          {saving ? 'กำลังบันทึก...' : 'บันทึกรหัสใหม่'}
        </button>
      </div>
      <p style={{ fontSize: '0.78rem', color: '#9ca3af', margin: '8px 0 0' }}>
        💡 รหัสกัน case แล้ว (ajj = AJJ = Ajj). หลีกเลี่ยงเว้นวรรค
      </p>
    </div>
  );
};

// ================= helpers =================
const download = (text: string, filename: string) => {
  const blob = new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// Wrap with login gate
const AdminDashboard: React.FC = () => (
  <AdminGate>
    <AdminDashboardInner />
  </AdminGate>
);

export default AdminDashboard;
