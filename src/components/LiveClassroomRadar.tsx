import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Radio, RefreshCw, BookOpen, ClipboardCheck, Ticket, Users } from 'lucide-react';
import type { StudentInfo } from '../data/students2569';
import type { Assignment, Submission } from '../services/homeworkService';
import type { ExitTicket } from '../services/exitTicketService';
import {
  fetchAllProgressFromFirebase,
  getAllCachedProgress,
  type ActivityLog,
  type StudentProgressData,
} from '../services/progressService';

interface Props {
  classroom: string;
  gradeId: string;
  unitNo?: number;
  roster: StudentInfo[];
  assignments: Assignment[];
  submissions: Submission[];
  exitTickets: ExitTicket[];
  onOpenHomework: () => void;
}

type RadarFilter = 'all' | 'online' | 'missing_work';

const formatTimeAgo = (timestamp: number | undefined, nowMs: number): string => {
  if (!timestamp) return 'ยังไม่เข้าใช้งาน';
  const diffSec = Math.max(0, Math.floor((nowMs - timestamp) / 1000));
  if (diffSec < 60) return 'เมื่อสักครู่';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} ชม.ที่แล้ว`;
  return `${Math.floor(diffHr / 24)} วันที่แล้ว`;
};

const formatLastActivity = (act?: ActivityLog): string => {
  if (!act) return '—';
  switch (act.type) {
    case 'slide':
      return `📖 สไลด์ หน้า ${(act.index ?? 0) + 1}`;
    case 'quiz':
      return `📝 แบบทดสอบ${act.detail ? ` (${act.detail})` : ''}`;
    case 'fun':
      return act.gradeId === 'login' ? '🔑 เข้าสู่ระบบ' : `🎮 ${act.detail || 'เล่นเกมฝึก'}`;
    case 'practice':
      return `🛠️ ${act.detail || 'ฝึกปฏิบัติ'}`;
    case 'video':
      return `🎬 ดูวิดีโอ`;
    case 'article':
      return `📄 อ่านบทความ`;
    default:
      return act.detail || 'กิจกรรมในระบบ';
  }
};

const LiveClassroomRadar: React.FC<Props> = ({
  classroom,
  gradeId,
  unitNo,
  roster,
  assignments,
  submissions,
  exitTickets,
  onOpenHomework,
}) => {
  const [progressList, setProgressList] = useState<StudentProgressData[]>(() => getAllCachedProgress());
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filter, setFilter] = useState<RadarFilter>('all');
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [expanded, setExpanded] = useState(true);

  const refreshRadar = useCallback(async () => {
    setRefreshing(true);
    try {
      const fresh = await fetchAllProgressFromFirebase();
      setProgressList(fresh.length > 0 ? fresh : getAllCachedProgress());
      setNowMs(Date.now());
    } catch {
      setProgressList(getAllCachedProgress());
      setNowMs(Date.now());
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void refreshRadar();
    }, 0);
    return () => window.clearTimeout(t);
  }, [classroom, refreshRadar]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = window.setInterval(() => {
      void refreshRadar();
    }, 30_000);
    return () => window.clearInterval(id);
  }, [autoRefresh, refreshRadar]);

  const classAssignments = useMemo(
    () => assignments.filter((a) => a.classroom === classroom),
    [assignments, classroom],
  );

  const unitKey = unitNo ? `${gradeId}_${unitNo}` : null;

  const rows = useMemo(() => {
    const todayStr = new Date(nowMs).toDateString();

    return roster.map((student) => {
      const compactName = student.name.replace(/\s/g, '');
      const exactId = `${classroom}_${student.no}_${compactName}`;
      const prog =
        progressList.find((p) => p.studentId === exactId) ||
        progressList.find(
          (p) => p.studentId.startsWith(`${classroom}_`) && p.studentId.includes(compactName),
        );

      const lastActive = prog?.lastActive || 0;
      const diffMin = lastActive ? (nowMs - lastActive) / 60_000 : Infinity;
      const liveState: 'online' | 'today' | 'offline' =
        diffMin <= 15
          ? 'online'
          : lastActive > 0 && new Date(lastActive).toDateString() === todayStr
            ? 'today'
            : 'offline';

      const unitProg = unitKey && prog?.units ? prog.units[unitKey] : undefined;
      const slidesViewedInUnit = unitProg?.slidesViewed?.length || 0;
      const totalSlidesInUnit = unitProg?.totalSlides || 0;

      const submittedIds = new Set(
        submissions
          .filter(
            (s) =>
              s.classroom === classroom &&
              (s.studentId === exactId ||
                s.studentNo === student.no ||
                s.studentName === student.name),
          )
          .map((s) => s.assignmentId),
      );
      const submittedClassCount = classAssignments.filter((a) => submittedIds.has(a.id)).length;
      const missingCount = Math.max(0, classAssignments.length - submittedClassCount);

      const hasTicket = exitTickets.some(
        (t) =>
          t.studentId === exactId ||
          Number(t.studentNumber) === student.no ||
          t.studentName === student.name,
      );

      const lastAct = prog?.activities?.[0];

      return {
        student,
        liveState,
        lastActive,
        slidesViewedInUnit,
        totalSlidesInUnit,
        totalSlidesAll: prog?.totalSlidesViewed || 0,
        submittedClassCount,
        missingCount,
        hasTicket,
        lastActivityText: formatLastActivity(lastAct),
      };
    });
  }, [roster, classroom, progressList, nowMs, unitKey, submissions, classAssignments, exitTickets]);

  const summary = useMemo(() => {
    const onlineCount = rows.filter((r) => r.liveState === 'online').length;
    const todayCount = rows.filter((r) => r.liveState === 'online' || r.liveState === 'today').length;
    const readSlidesCount = rows.filter((r) => r.slidesViewedInUnit > 0 || r.totalSlidesAll > 0).length;
    const allWorkDoneCount =
      classAssignments.length > 0
        ? rows.filter((r) => r.missingCount === 0).length
        : 0;
    const ticketCount = rows.filter((r) => r.hasTicket).length;
    return { onlineCount, todayCount, readSlidesCount, allWorkDoneCount, ticketCount };
  }, [rows, classAssignments.length]);

  const filteredRows = useMemo(() => {
    if (filter === 'online') return rows.filter((r) => r.liveState === 'online' || r.liveState === 'today');
    if (filter === 'missing_work') return rows.filter((r) => r.missingCount > 0);
    return rows;
  }, [rows, filter]);

  return (
    <section className="teacher-classroom-panel live-radar-panel">
      <div className="panel-heading">
        <div>
          <span>เรดาร์ห้องเรียนสด (Live Classroom Radar)</span>
          <h3>
            <Radio size={19} className={summary.onlineCount > 0 ? 'radar-pulse-icon' : ''} />
            ติดตามห้อง {classroom} แบบเรียลไทม์ ({roster.length} คน)
          </h3>
        </div>
        <div className="live-radar-controls">
          <label className="live-radar-auto">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span>รีเฟรชอัตโนมัติ (30 วิ)</span>
          </label>
          <button
            type="button"
            className="live-radar-btn"
            onClick={() => void refreshRadar()}
            disabled={refreshing}
          >
            <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
            {refreshing ? 'กำลังดึง...' : 'อัปเดตสด'}
          </button>
          <button
            type="button"
            className="live-radar-btn"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? 'ซ่อนรายชื่อ' : `แสดงรายชื่อ (${rows.length})`}
          </button>
        </div>
      </div>

      {/* 4 KPI Summary Strip */}
      <div className="live-radar-kpis">
        <div className="live-radar-kpi kpi-green">
          <Users size={16} />
          <div>
            <strong>{summary.onlineCount} / {roster.length}</strong>
            <span>กำลังออนไลน์ (วันนี้ {summary.todayCount})</span>
          </div>
        </div>
        <div className="live-radar-kpi kpi-blue">
          <BookOpen size={16} />
          <div>
            <strong>{summary.readSlidesCount} / {roster.length}</strong>
            <span>เข้าอ่านสไลด์แล้ว</span>
          </div>
        </div>
        <div className="live-radar-kpi kpi-amber" onClick={onOpenHomework} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') onOpenHomework(); }}>
          <ClipboardCheck size={16} />
          <div>
            <strong>
              {classAssignments.length > 0 ? `${summary.allWorkDoneCount} / ${roster.length}` : 'ยังไม่มีงาน'}
            </strong>
            <span>ส่งครบ {classAssignments.length} งานห้องนี้</span>
          </div>
        </div>
        <div className="live-radar-kpi kpi-violet">
          <Ticket size={16} />
          <div>
            <strong>{summary.ticketCount} / {roster.length}</strong>
            <span>ส่งตั๋วบอกลาวันนี้</span>
          </div>
        </div>
      </div>

      {expanded && (
        <>
          <div className="live-radar-filters">
            {[
              { id: 'all' as const, label: `ทั้งหมด (${rows.length})` },
              { id: 'online' as const, label: `🟢 ใช้งานวันนี้ (${summary.todayCount})` },
              { id: 'missing_work' as const, label: `📌 ยังส่งงานไม่ครบ (${rows.filter((r) => r.missingCount > 0).length})` },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                className={`live-radar-pill ${filter === item.id ? 'active' : ''}`}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="live-radar-table-wrap">
            <table className="live-radar-table">
              <thead>
                <tr>
                  <th>เลข</th>
                  <th>นักเรียน</th>
                  <th>สถานะ</th>
                  <th>สไลด์{unitNo ? ` น.${unitNo}` : ''}</th>
                  <th>ใบงาน/การบ้าน</th>
                  <th>ตั๋วบอกลา</th>
                  <th>กิจกรรมล่าสุด</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="live-radar-empty">
                      ไม่มีนักเรียนในเงื่อนไขที่เลือก
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr key={row.student.studentCode}>
                      <td className="radar-no">{row.student.no}</td>
                      <td className="radar-name">{row.student.name}</td>
                      <td>
                        <span className={`radar-badge ${row.liveState}`}>
                          {row.liveState === 'online'
                            ? '● ออนไลน์'
                            : row.liveState === 'today'
                              ? '● วันนี้'
                              : '○ ยังไม่เข้า'}
                        </span>
                      </td>
                      <td>
                        {row.totalSlidesInUnit > 0
                          ? `${row.slidesViewedInUnit}/${row.totalSlidesInUnit} หน้า`
                          : row.totalSlidesAll > 0
                            ? `${row.totalSlidesAll} หน้า`
                            : '—'}
                      </td>
                      <td>
                        {classAssignments.length === 0 ? (
                          <span className="radar-muted">—</span>
                        ) : row.missingCount === 0 ? (
                          <span className="radar-done">✓ ครบ ({row.submittedClassCount})</span>
                        ) : (
                          <span className="radar-missing">
                            {row.submittedClassCount}/{classAssignments.length} (ค้าง {row.missingCount})
                          </span>
                        )}
                      </td>
                      <td>{row.hasTicket ? <span className="radar-done">🎫 ส่งแล้ว</span> : <span className="radar-muted">—</span>}</td>
                      <td className="radar-act">
                        <span>{row.lastActivityText}</span>
                        <small>{formatTimeAgo(row.lastActive, nowMs)}</small>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
};

export default LiveClassroomRadar;
