import React, { useEffect, useMemo, useState } from 'react';
import { Globe2, RefreshCw, ShieldCheck, Trash2, Users } from 'lucide-react';
import {
  deleteExternalVisitor,
  fetchExternalVisitorReport,
  type ExternalVisitorReport,
} from '../services/externalVisitorService';
import './ExternalVisitorManager.css';

const EMPTY_REPORT: ExternalVisitorReport = {
  visitors: [],
  totalVisits: 0,
  protectedListAvailable: false,
};

const formatDateTime = (timestamp: number) => (
  timestamp
    ? new Date(timestamp).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
    : '—'
);

const ExternalVisitorManager: React.FC = () => {
  const [report, setReport] = useState<ExternalVisitorReport>(EMPTY_REPORT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      setReport(await fetchExternalVisitorReport());
    } catch (cause) {
      console.warn('External visitor report failed', cause);
      setError('ดึงสถิติผู้ทดลองไม่สำเร็จ กรุณาลองรีเฟรช');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const uniqueNames = useMemo(() => new Set(
    report.visitors.map((visitor) => visitor.displayName.trim().toLocaleLowerCase('th-TH')),
  ).size, [report.visitors]);

  const removeVisitor = async (id: string, name: string) => {
    if (!confirm(`ลบประวัติผู้ทดลอง "${name}"?`)) return;
    try {
      await deleteExternalVisitor(id);
      await refresh();
    } catch (cause) {
      console.warn('Delete external visitor failed', cause);
      setError('ลบข้อมูลไม่สำเร็จ บัญชีครูอาจยังไม่ได้เชื่อม Firebase Authentication');
    }
  };

  return (
    <div className="external-visitors">
      <div className="external-visitors__header">
        <div>
          <span className="external-visitors__eyebrow"><Globe2 size={15} /> สถิติการเผยแพร่เว็บไซต์</span>
          <h2>ผู้ทดลองภายนอก</h2>
          <p>แยกจากทะเบียนนักเรียนโรงเรียน ไม่เช็กชื่อ ไม่เก็บผลการเรียน และไม่สร้างคะแนน K/P/A</p>
        </div>
        <button className="external-visitors__refresh" onClick={() => void refresh()} disabled={loading}>
          <RefreshCw size={17} className={loading ? 'is-spinning' : ''} /> รีเฟรช
        </button>
      </div>

      <div className="external-visitors__stats">
        <div><Globe2 size={24} /><span>เข้าทดลองรวม</span><strong>{report.totalVisits.toLocaleString()} ครั้ง</strong></div>
        <div><Users size={24} /><span>ชื่อที่แสดงได้</span><strong>{uniqueNames.toLocaleString()} ราย</strong></div>
        <div><ShieldCheck size={24} /><span>การเก็บคะแนน</span><strong>ปิดถาวร</strong></div>
      </div>

      {!report.protectedListAvailable && (
        <div className="external-visitors__notice">
          <ShieldCheck size={20} />
          <span>
            จำนวนครั้งรวมดึงได้จากฐานข้อมูล ส่วนรายชื่อถูกป้องกันให้อ่านได้เฉพาะบัญชีครู Firebase ที่ยืนยันแล้ว
          </span>
        </div>
      )}

      {error && <div className="external-visitors__error">{error}</div>}

      <div className="external-visitors__table-wrap">
        <table className="external-visitors__table">
          <thead>
            <tr>
              <th>ชื่อผู้ทดลอง</th>
              <th>เข้าครั้งแรก</th>
              <th>เข้าล่าสุด</th>
              <th>จำนวนครั้ง</th>
              <th><span className="sr-only">จัดการ</span></th>
            </tr>
          </thead>
          <tbody>
            {loading && report.visitors.length === 0 ? (
              <tr><td colSpan={5} className="external-visitors__empty">กำลังดึงสถิติ...</td></tr>
            ) : report.visitors.length === 0 ? (
              <tr><td colSpan={5} className="external-visitors__empty">ยังไม่มีรายการผู้ทดลองที่บัญชีนี้มองเห็น</td></tr>
            ) : report.visitors.map((visitor) => (
              <tr key={visitor.id}>
                <td><strong>{visitor.displayName}</strong><small>ผู้ทดลองภายนอก</small></td>
                <td>{formatDateTime(visitor.firstSeenAt)}</td>
                <td>{formatDateTime(visitor.lastSeenAt)}</td>
                <td><span className="external-visitors__count">{visitor.visitCount}</span></td>
                <td>
                  <button
                    className="external-visitors__delete"
                    onClick={() => void removeVisitor(visitor.id, visitor.displayName)}
                    aria-label={`ลบ ${visitor.displayName}`}
                    title="ลบประวัติผู้ทดลอง"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExternalVisitorManager;
