import React, { useEffect, useState } from 'react';
import { History, RefreshCw } from 'lucide-react';
import {
  fetchAuditLogs,
  loadAuditLogs,
  type AuditLogEntry,
} from '../services/auditLogService';

const AuditLogViewer: React.FC = () => {
  const [items, setItems] = useState<AuditLogEntry[]>(loadAuditLogs);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    setItems(await fetchAuditLogs());
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    void fetchAuditLogs().then((logs) => {
      if (cancelled) return;
      setItems(logs);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <div>
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <h2 style={{ alignItems: 'center', display: 'flex', gap: 8, margin: 0 }}>
            <History size={22} /> ประวัติการแก้ไขของครู
          </h2>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>
            ตรวจสอบการแก้คะแนน งาน แผน คาบเรียน เนื้อหา และคลังข้อสอบ
          </p>
        </div>
        <button type="button" className="btn-secondary" onClick={() => void refresh()}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} /> รีเฟรช
        </button>
      </div>
      {items.length === 0 ? (
        <div className="empty-state-card">
          <History size={42} color="#94a3b8" />
          <h3>ยังไม่มีประวัติการแก้ไข</h3>
          <p>รายการใหม่จะบันทึกชื่อครู เวลา และข้อมูลก่อน-หลังโดยอัตโนมัติ</p>
        </div>
      ) : (
        <div className="att-table-wrap">
          <table className="att-table">
            <thead>
              <tr>
                <th>วันเวลา</th>
                <th>ครู</th>
                <th>การทำงาน</th>
                <th>ประเภท</th>
                <th>ห้อง/วิชา</th>
                <th>รายละเอียด</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{new Date(item.createdAt).toLocaleString('th-TH')}</td>
                  <td><strong>{item.actor}</strong></td>
                  <td>{item.action}</td>
                  <td>{item.entityType}</td>
                  <td>{[item.classroom, item.subject].filter(Boolean).join(' / ') || '-'}</td>
                  <td>{item.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AuditLogViewer;
