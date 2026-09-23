import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet, Download, Printer, Users,
  BarChart3, FileText, X, Layers
} from 'lucide-react';
import {
  getClassroomExportSummary,
  downloadClassroomExcelFile,
  downloadClassroomCsvFile,
  downloadMasterCsvFile,
  downloadSchoolMisCsvFile,
  type ClassroomExportSummary,
} from '../services/gradeExportService';
import { allClassrooms2569 } from '../data/students2569';
import { getSubjectsForClassroom, getGradingPolicy, type Subject } from '../services/gradeService';
import { OfficialPp5PrintLayout } from './OfficialPp5PrintLayout';
import { StudentGradeSlipPrintLayout } from './StudentGradeSlipPrintLayout';
import { useToast } from './Toast';

interface OfficialGradeExportModalProps {
  initialClassroom?: string;
  initialSubject?: Subject;
  isOpen: boolean;
  onClose: () => void;
}

export const OfficialGradeExportModal: React.FC<OfficialGradeExportModalProps> = ({
  initialClassroom = 'ป.1',
  initialSubject = 'main',
  isOpen,
  onClose,
}) => {
  const [selectedClassroom, setSelectedClassroom] = useState<string>(initialClassroom);
  const [selectedSubject, setSelectedSubject] = useState<Subject>(initialSubject);
  const [printMode, setPrintMode] = useState<'none' | 'pp5' | 'slips'>('none');
  const [selectedStudentForSlip, setSelectedStudentForSlip] = useState<string | undefined>(undefined);
  const toast = useToast();
  const weights = getGradingPolicy(selectedClassroom);

  const subjects = useMemo(() => getSubjectsForClassroom(selectedClassroom), [selectedClassroom]);

  // Adjust subject when classroom changes
  const activeSubject: Subject = useMemo(() => {
    if (selectedClassroom.startsWith('ป.')) return 'main';
    if (selectedSubject === 'main') return 'cs';
    return selectedSubject;
  }, [selectedClassroom, selectedSubject]);

  const summary: ClassroomExportSummary = useMemo(() => {
    return getClassroomExportSummary(selectedClassroom, activeSubject);
  }, [selectedClassroom, activeSubject]);

  if (!isOpen) return null;

  // Render Fullscreen Print Layouts
  if (printMode === 'pp5') {
    return (
      <OfficialPp5PrintLayout
        summary={summary}
        onClose={() => setPrintMode('none')}
      />
    );
  }

  if (printMode === 'slips') {
    return (
      <StudentGradeSlipPrintLayout
        summary={summary}
        selectedStudentCode={selectedStudentForSlip}
        onClose={() => {
          setPrintMode('none');
          setSelectedStudentForSlip(undefined);
        }}
      />
    );
  }

  const handleDownloadExcel = () => {
    downloadClassroomExcelFile(selectedClassroom, activeSubject);
    toast.show(`ดาวน์โหลด Excel ปพ.5 (${selectedClassroom}) สำเร็จ`, 'success');
  };

  const handleDownloadCsv = () => {
    downloadClassroomCsvFile(selectedClassroom, activeSubject);
    toast.show(`ดาวน์โหลด CSV (${selectedClassroom}) สำเร็จ`, 'success');
  };

  const handleDownloadMaster = () => {
    downloadMasterCsvFile();
    toast.show('ดาวน์โหลด Master CSV รวมทุกห้อง (111 คน) สำเร็จ', 'success');
  };

  const handleDownloadSchoolMis = () => {
    try {
      downloadSchoolMisCsvFile(selectedClassroom, activeSubject);
      toast.show(`ดาวน์โหลดไฟล์ SchoolMIS (${selectedClassroom}) สำเร็จ`, 'success');
    } catch (error) {
      toast.show(error instanceof Error ? error.message : String(error), 'error');
    }
  };

  return (
    <div className="export-modal-overlay" onClick={onClose}>
      <div className="export-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="export-modal-header">
          <div className="export-title-group">
            <div className="export-icon-badge">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h2>ศูนย์ส่งออกเอกสาร ปพ.5 และผลการเรียน</h2>
              <p>โรงเรียนบ้านคลองมดแดง • ส่งฝ่ายวิชาการ / ลงระบบทะเบียน / พิมพ์แจกผู้ปกครอง</p>
            </div>
          </div>
          <button type="button" className="btn-close-modal" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Filter Controls */}
        <div className="export-controls-bar">
          <div className="control-group">
            <label>เลือกระดับชั้น:</label>
            <div className="classroom-chip-group">
              {allClassrooms2569.map((cls) => (
                <button
                  key={cls}
                  type="button"
                  className={`chip-btn ${selectedClassroom === cls ? 'active' : ''}`}
                  onClick={() => setSelectedClassroom(cls)}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>

          {subjects.length > 1 && (
            <div className="control-group">
              <label>เลือกรายวิชา:</label>
              <div className="subject-chip-group">
                {subjects.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`chip-btn ${activeSubject === s.id ? 'active' : ''}`}
                    onClick={() => setSelectedSubject(s.id)}
                  >
                    {s.emoji} {s.title} ({s.code})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Action Grid */}
        <div className="export-action-grid">
          {/* Card 1: Excel Format */}
          <div className="action-card primary-card">
            <div className="action-card-top">
              <div className="action-icon excel-icon"><FileSpreadsheet size={22} /></div>
              <span className="card-badge">ยอดนิยมสำหรับ รร.</span>
            </div>
            <h3>สเปรดชีต Excel ปพ.5</h3>
            <p>ไฟล์ .xls จัดหัวตาราง สีสัน ขอบเส้น และสถิติวัดผล เปิดใน Microsoft Excel หรือ Google Sheets ได้ทันที</p>
            <div className="action-btn-group">
              <button type="button" className="btn-action btn-excel" onClick={handleDownloadExcel}>
                <Download size={16} /> โหลด Excel (.xls)
              </button>
              <button type="button" className="btn-action btn-outline" onClick={handleDownloadCsv}>
                โหลด CSV
              </button>
            </div>
          </div>

          {/* Card 2: Official Print A4 */}
          <div className="action-card print-card">
            <div className="action-card-top">
              <div className="action-icon print-icon"><Printer size={22} /></div>
              <span className="card-badge">เอกสารทางการ</span>
            </div>
            <h3>พิมพ์แบบ ปพ.5 ทางการ</h3>
            <p>แบบฟอร์มกระดาษ A4 แนวนอน พร้อมตารางคะแนนรวม, สรุปผลสัมฤทธิ์ และช่องลงนาม 3 ฝ่ายพร้อมส่งวิชาการ</p>
            <button type="button" className="btn-action btn-print" onClick={() => setPrintMode('pp5')}>
              <Printer size={16} /> เปิดหน้าพิมพ์ ปพ.5
            </button>
          </div>

          {/* Card 3: Grade Slips */}
          <div className="action-card slip-card-action">
            <div className="action-card-top">
              <div className="action-icon slip-icon"><FileText size={22} /></div>
              <span className="card-badge">แจกผู้ปกครอง</span>
            </div>
            <h3>ใบแจ้งผลการเรียน (ปพ.6)</h3>
            <p>ใบรายงานผลการเรียนรายบุคคลแบบมีรอยปรุตัดกระดาษ (2 คน/แผ่น A4) สำหรับแจกผู้ปกครองในวันประชุม</p>
            <button type="button" className="btn-action btn-slip" onClick={() => setPrintMode('slips')}>
              <Users size={16} /> พิมพ์ใบเกรดทั้งห้อง ({summary.stats.totalStudents} คน)
            </button>
          </div>

          {/* Card 4: Master All Classes */}
          <div className="action-card master-card">
            <div className="action-card-top">
              <div className="action-icon master-icon"><Layers size={22} /></div>
              <span className="card-badge">รวม 9 ห้อง</span>
            </div>
            <h3>Master รวมทุกห้อง ป.1-ม.3</h3>
            <p>รวมข้อมูลคะแนนนักเรียนทั้ง 111 คนในไฟล์เดียว สำหรับส่งต่อให้ฝ่ายวิชาการนำไปรวมระบบกลาง</p>
            <div className="action-btn-group">
              <button type="button" className="btn-action btn-master" onClick={handleDownloadMaster}>
                <Download size={16} /> โหลด Master รวมทุกห้อง
              </button>
              <button type="button" className="btn-action btn-outline" onClick={handleDownloadSchoolMis}>
                โหลด SchoolMIS
              </button>
            </div>
          </div>
        </div>

        {/* Live Preview Section */}
        <div className="export-preview-section">
          <div className="preview-header">
            <div className="preview-title">
              <BarChart3 size={18} />
              <h4>ตัวอย่างข้อมูล: ชั้น {selectedClassroom} • {summary.subjectTitle} ({summary.stats.totalStudents} คน)</h4>
            </div>
            <div className="quick-stats-pills">
              <span className="pill">เฉลี่ย: <strong>{summary.stats.meanScore}</strong></span>
              <span className="pill">S.D.: <strong>{summary.stats.sdScore}</strong></span>
              <span className="pill pill-success">เกรด 3 ขึ้นไป: <strong>{summary.stats.qualityPercentage}%</strong></span>
              <span className="pill pill-pass">ผ่านเกณฑ์: <strong>{summary.stats.passPercentage}%</strong></span>
            </div>
          </div>

          {/* Grade Distribution Bar */}
          <div className="grade-bar-wrapper">
            <div className="grade-bar-track">
              {(['4', '3.5', '3', '2.5', '2', '1.5', '1', '0'] as const).map((g) => {
                const pct = summary.stats.gradePercentages[g];
                if (pct === 0) return null;
                return (
                  <div
                    key={g}
                    className={`grade-segment grade-seg-${g.replace('.', '_')}`}
                    style={{ width: `${pct}%` }}
                    title={`เกรด ${g}: ${summary.stats.gradeCounts[g]} คน (${pct}%)`}
                  >
                    {pct > 5 && <span>เกรด {g} ({summary.stats.gradeCounts[g]})</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Table Preview */}
          <div className="preview-table-container">
            <table className="modal-preview-table">
              <thead>
                <tr>
                  <th>เลขที่</th>
                  <th>รหัส</th>
                  <th>ชื่อ - นามสกุล</th>
                  <th>คะแนนเก็บ ({weights.COLLECTED})</th>
                  <th>สอบ ({weights.EXAM})</th>
                  <th>รวม ({weights.TOTAL})</th>
                  <th>เกรด</th>
                  <th>ผลการตัดสิน</th>
                  <th>พิมพ์รายคน</th>
                </tr>
              </thead>
              <tbody>
                {summary.rows.map((r) => (
                  <tr key={r.studentCode}>
                    <td>{r.studentNo}</td>
                    <td><code>{r.studentCode}</code></td>
                    <td className="text-left font-sarabun">{r.fullName}</td>
                    <td>{r.totalCollected}</td>
                    <td>{r.totalExam}</td>
                    <td><strong>{r.totalScore}</strong></td>
                    <td className={`grade-highlight grade-${r.grade.replace('.', '_')}`}>
                      <strong>{r.grade}</strong>
                    </td>
                    <td>
                      <span className={`eval-tag ${r.isPassed ? 'eval-pass' : 'eval-fail'}`}>
                        {r.evaluationText}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-print-slip-row"
                        onClick={() => {
                          setSelectedStudentForSlip(r.studentCode);
                          setPrintMode('slips');
                        }}
                      >
                        <Printer size={13} /> ใบเกรด
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>{`
        .export-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 20px;
        }

        .export-modal-card {
          background: white;
          width: 100%;
          max-width: 1080px;
          max-height: 92vh;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.25);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          color: #1e293b;
        }

        .export-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        .export-title-group {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .export-icon-badge {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #22c55e;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(34, 197, 94, 0.3);
        }

        .export-title-group h2 {
          font-size: 1.25rem;
          font-weight: bold;
          margin: 0;
          color: #0f172a;
        }

        .export-title-group p {
          font-size: 0.85rem;
          color: #64748b;
          margin: 2px 0 0;
        }

        .btn-close-modal {
          background: transparent;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          transition: background 0.15s;
        }
        .btn-close-modal:hover { background: #e2e8f0; color: #0f172a; }

        .export-controls-bar {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 12px 24px;
          background: #ffffff;
          border-bottom: 1px solid #f1f5f9;
          flex-wrap: wrap;
        }

        .control-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .control-group label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #475569;
        }

        .classroom-chip-group, .subject-chip-group {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }

        .chip-btn {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          transition: all 0.15s;
        }

        .chip-btn:hover { background: #e2e8f0; }
        .chip-btn.active {
          background: #4f46e5;
          color: white;
          border-color: #4f46e5;
          box-shadow: 0 2px 6px rgba(79, 70, 229, 0.25);
        }

        .export-action-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          padding: 16px 24px;
          background: #f8fafc;
        }

        .action-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 2px 6px rgba(0,0,0,0.03);
          transition: transform 0.15s, box-shadow 0.15s;
        }

        .action-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.06);
        }

        .action-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .action-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .excel-icon { background: #dcfce7; color: #16a34a; }
        .print-icon { background: #e0e7ff; color: #4f46e5; }
        .slip-icon { background: #fef3c7; color: #d97706; }
        .master-icon { background: #f3e8ff; color: #9333ea; }

        .card-badge {
          font-size: 0.72rem;
          padding: 2px 6px;
          border-radius: 6px;
          background: #f1f5f9;
          color: #475569;
          font-weight: 600;
        }

        .action-card h3 {
          font-size: 0.95rem;
          font-weight: bold;
          margin: 0 0 4px;
          color: #0f172a;
        }

        .action-card p {
          font-size: 0.78rem;
          color: #64748b;
          margin: 0 0 12px;
          line-height: 1.35;
          flex-grow: 1;
        }

        .action-btn-group {
          display: flex;
          gap: 6px;
        }

        .btn-action {
          width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 7px 10px;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.15s;
        }

        .btn-excel { background: #16a34a; color: white; }
        .btn-excel:hover { background: #15803d; }

        .btn-print { background: #4f46e5; color: white; }
        .btn-print:hover { background: #4338ca; }

        .btn-slip { background: #d97706; color: white; }
        .btn-slip:hover { background: #b45309; }

        .btn-master { background: #9333ea; color: white; }
        .btn-master:hover { background: #7e22ce; }

        .btn-outline {
          background: #f1f5f9;
          color: #334155;
          border: 1px solid #cbd5e1;
        }
        .btn-outline:hover { background: #e2e8f0; }

        .export-preview-section {
          padding: 16px 24px;
          overflow-y: auto;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .preview-title {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #0f172a;
        }

        .preview-title h4 {
          margin: 0;
          font-size: 0.95rem;
          font-weight: bold;
        }

        .quick-stats-pills {
          display: flex;
          gap: 8px;
        }

        .pill {
          font-size: 0.78rem;
          padding: 3px 8px;
          border-radius: 12px;
          background: #f1f5f9;
          color: #475569;
        }

        .pill-success { background: #dcfce7; color: #16a34a; }
        .pill-pass { background: #e0e7ff; color: #4338ca; }

        .grade-bar-wrapper {
          width: 100%;
        }

        .grade-bar-track {
          display: flex;
          height: 18px;
          border-radius: 6px;
          overflow: hidden;
          background: #e2e8f0;
        }

        .grade-segment {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          font-weight: bold;
          color: white;
        }

        .grade-seg-4 { background: #16a34a; }
        .grade-seg-3_5 { background: #22c55e; }
        .grade-seg-3 { background: #65a30d; }
        .grade-seg-2_5 { background: #ca8a04; }
        .grade-seg-2 { background: #eab308; }
        .grade-seg-1_5 { background: #f97316; }
        .grade-seg-1 { background: #f59e0b; }
        .grade-seg-0 { background: #ef4444; }

        .preview-table-container {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow-y: auto;
          max-height: 240px;
        }

        .modal-preview-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.82rem;
          text-align: center;
        }

        .modal-preview-table th {
          position: sticky;
          top: 0;
          background: #f8fafc;
          border-bottom: 1px solid #cbd5e1;
          padding: 6px 8px;
          font-weight: bold;
          color: #475569;
        }

        .modal-preview-table td {
          border-bottom: 1px solid #f1f5f9;
          padding: 5px 8px;
        }

        .modal-preview-table tr:hover { background: #f8fafc; }

        .text-left { text-align: left; }
        .font-sarabun { font-family: 'TH Sarabun New', 'Sarabun', sans-serif; font-size: 0.95rem; }

        .grade-highlight {
          font-size: 0.95rem;
        }
        .grade-4 { color: #16a34a; }
        .grade-0 { color: #dc2626; }

        .eval-tag {
          font-size: 0.72rem;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: bold;
        }
        .eval-pass { background: #dcfce7; color: #16a34a; }
        .eval-fail { background: #fee2e2; color: #dc2626; }

        .btn-print-slip-row {
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 0.75rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 3px;
          color: #334155;
        }
        .btn-print-slip-row:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        @media (max-width: 900px) {
          .export-action-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 600px) {
          .export-action-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
