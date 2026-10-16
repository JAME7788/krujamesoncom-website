import React, { useState } from 'react';
import { Printer, X, FileSpreadsheet, FileText, BookOpen, TableProperties } from 'lucide-react';
import {
  type ClassroomExportSummary,
  COURSE_TEACHER_NAME,
  ACADEMIC_HEAD_NAME,
  SCHOOL_DIRECTOR_NAME,
} from '../services/gradeExportService';
import {
  downloadClassroomPp5CompleteExcel,
  downloadClassroomPp5Docx,
} from '../services/pp5CompleteGeneratorService';
import { examMaxScores, getGradingPolicy } from '../services/gradeService';

interface OfficialPp5PrintLayoutProps {
  summary: ClassroomExportSummary;
  onClose: () => void;
}

export const OfficialPp5PrintLayout: React.FC<OfficialPp5PrintLayoutProps> = ({
  summary,
  onClose,
}) => {
  const [printMode, setPrintMode] = useState<'score_sheet' | 'full_booklet'>('score_sheet');
  const exam = examMaxScores(summary.classroom);
  const weights = getGradingPolicy(summary.classroom);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="pp5-print-container">
      {/* Action Toolbar (ซ่อนเวลาพิมพ์) */}
      <div className="pp5-no-print pp5-action-bar">
        <div className="pp5-action-info">
          <strong>แบบบันทึกผลการพัฒนาคุณภาพผู้เรียน (ปพ.5) — {summary.classroom}</strong>
          <span>
            {summary.subjectTitle} ({summary.subjectCode}) • จำนวน {summary.stats.totalStudents} คน
            {printMode === 'full_booklet' ? ' • พิมพ์เล่มสมบูรณ์ (หน้าปก+ข้อมูล+คะแนน+คุณลักษณะ)' : ' • พิมพ์ตารางสรุปคะแนน A4 แนวนอน'}
          </span>
        </div>

        <div className="pp5-action-buttons">
          <div className="pp5-mode-toggle">
            <button
              type="button"
              className={`pp5-mode-btn ${printMode === 'score_sheet' ? 'active' : ''}`}
              onClick={() => setPrintMode('score_sheet')}
            >
              <TableProperties size={15} /> ตารางคะแนน (A4 แนวนอน)
            </button>
            <button
              type="button"
              className={`pp5-mode-btn ${printMode === 'full_booklet' ? 'active' : ''}`}
              onClick={() => setPrintMode('full_booklet')}
            >
              <BookOpen size={15} /> เล่ม ปพ.5 สมบูรณ์
            </button>
          </div>

          <button
            type="button"
            className="pp5-btn pp5-btn-excel"
            onClick={() => downloadClassroomPp5CompleteExcel(summary)}
          >
            <FileSpreadsheet size={16} /> โหลด Excel ปพ.5 (9 ชีต)
          </button>
          <button
            type="button"
            className="pp5-btn pp5-btn-word"
            onClick={() => downloadClassroomPp5Docx(summary)}
          >
            <FileText size={16} /> โหลด Word เล่มสมบูรณ์
          </button>
          <button
            type="button"
            className="pp5-btn pp5-btn-primary"
            onClick={handlePrint}
          >
            <Printer size={16} /> สั่งพิมพ์ / บันทึก PDF
          </button>
          <button
            type="button"
            className="pp5-btn pp5-btn-close"
            onClick={onClose}
          >
            <X size={18} /> ปิด
          </button>
        </div>
      </div>

      {/* เนื้อหาการพิมพ์ */}
      {printMode === 'score_sheet' ? (
        /* โหมด 1: ตารางคะแนนมาตรฐาน A4 แนวนอน */
        <div className="pp5-page">
          <div className="pp5-header">
            <div className="pp5-emblem-space">
              <span className="pp5-thai-garuda">🏫</span>
            </div>
            <h1 className="pp5-title">{summary.schoolName}</h1>
            <h2 className="pp5-subtitle">แบบบันทึกผลการพัฒนาคุณภาพผู้เรียน (ปพ.5)</h2>
            <div className="pp5-meta-grid">
              <div><strong>กลุ่มสาระการเรียนรู้:</strong> วิทยาศาสตร์และเทคโนโลยี</div>
              <div><strong>รายวิชา:</strong> {summary.subjectTitle} ({summary.subjectCode})</div>
              <div><strong>ระดับชั้น:</strong> {summary.classroom}</div>
              <div><strong>ภาคเรียน/ปีการศึกษา:</strong> {summary.term}/{summary.academicYear}</div>
              <div><strong>ครูผู้สอน:</strong> {summary.teacherName}</div>
              <div><strong>สังกัด:</strong> {summary.affiliation}</div>
            </div>
          </div>

          {/* ตารางคะแนน */}
          <div className="pp5-table-wrap">
            <table className="pp5-table">
              <thead>
                <tr>
                  <th rowSpan={2} className="w-no">เลขที่</th>
                  <th rowSpan={2} className="w-code">รหัส</th>
                  <th rowSpan={2} className="w-name">ชื่อ - นามสกุล</th>
                  {summary.indicators.map((ind) => (
                    <th key={ind.id} colSpan={3} className="w-ind">
                      {ind.code}
                    </th>
                  ))}
                  <th colSpan={4} className="w-col-total">คะแนนเก็บ</th>
                  {exam.midterm > 0 && <th rowSpan={2} className="w-exam">กลางภาค<br/>({exam.midterm})</th>}
                  <th rowSpan={2} className="w-exam">ปลายภาค<br/>({exam.final})</th>
                  <th rowSpan={2} className="w-exam">รวมสอบ<br/>({weights.EXAM})</th>
                  <th rowSpan={2} className="w-total">รวม<br/>({weights.TOTAL})</th>
                  <th rowSpan={2} className="w-grade">เกรด</th>
                  <th rowSpan={2} className="w-eval">ผล</th>
                </tr>
                <tr>
                  {summary.indicators.map((ind) => (
                    <React.Fragment key={`sub_${ind.id}`}>
                      <th className="sub-th">K</th>
                      <th className="sub-th">P</th>
                      <th className="sub-th">A</th>
                    </React.Fragment>
                  ))}
                  <th className="sub-th">K ({weights.COLLECTED * weights.K_RATIO})</th>
                  <th className="sub-th">P ({weights.COLLECTED * weights.P_RATIO})</th>
                  <th className="sub-th">A ({weights.COLLECTED * weights.A_RATIO})</th>
                  <th className="sub-th">รวม ({weights.COLLECTED})</th>
                </tr>
              </thead>
              <tbody>
                {summary.rows.map((r) => (
                  <tr key={r.studentCode}>
                    <td className="text-center">{r.studentNo}</td>
                    <td className="text-center">{r.studentCode}</td>
                    <td className="text-left font-sarabun">{r.fullName}</td>
                    {summary.indicators.map((ind) => {
                      const s = r.indicatorScores[ind.id] || { k: 0, p: 'พอใช้', a: false };
                      return (
                        <React.Fragment key={`${r.studentCode}_${ind.id}`}>
                          <td className="text-center">{s.k}</td>
                          <td className="text-center font-small">{s.p}</td>
                          <td className="text-center">{s.a ? 'ผ' : 'มผ'}</td>
                        </React.Fragment>
                      );
                    })}
                    <td className="text-center">{r.collectedK}</td>
                    <td className="text-center">{r.collectedP}</td>
                    <td className="text-center">{r.collectedA}</td>
                    <td className="text-center font-bold">{r.totalCollected}</td>
                    {exam.midterm > 0 && <td className="text-center">{r.midtermExam}</td>}
                    <td className="text-center">{r.finalExam}</td>
                    <td className="text-center font-bold">{r.totalExam}</td>
                    <td className="text-center font-bold total-cell">{r.totalScore}</td>
                    <td className={`text-center font-bold grade-cell grade-${r.grade.replace('.', '_')}`}>
                      {r.grade}
                    </td>
                    <td className={`text-center eval-cell ${r.isPassed ? 'eval-pass' : 'eval-fail'}`}>
                      {r.evaluationText}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ส่วนสรุปผลสัมฤทธิ์ทางการเรียน */}
          <div className="pp5-summary-section">
            <div className="pp5-summary-box">
              <h3 className="pp5-summary-title">สรุปผลสัมฤทธิ์ทางการเรียน (จำนวนและร้อยละ)</h3>
              <table className="pp5-stat-table">
                <thead>
                  <tr>
                    <th>ระดับผลการเรียน</th>
                    <th>4</th>
                    <th>3.5</th>
                    <th>3</th>
                    <th>2.5</th>
                    <th>2</th>
                    <th>1.5</th>
                    <th>1</th>
                    <th>0</th>
                    <th>รวม</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>จำนวน (คน)</strong></td>
                    <td>{summary.stats.gradeCounts['4']}</td>
                    <td>{summary.stats.gradeCounts['3.5']}</td>
                    <td>{summary.stats.gradeCounts['3']}</td>
                    <td>{summary.stats.gradeCounts['2.5']}</td>
                    <td>{summary.stats.gradeCounts['2']}</td>
                    <td>{summary.stats.gradeCounts['1.5']}</td>
                    <td>{summary.stats.gradeCounts['1']}</td>
                    <td>{summary.stats.gradeCounts['0']}</td>
                    <td><strong>{summary.stats.totalStudents}</strong></td>
                  </tr>
                  <tr>
                    <td><strong>ร้อยละ (%)</strong></td>
                    <td>{summary.stats.gradePercentages['4']}%</td>
                    <td>{summary.stats.gradePercentages['3.5']}%</td>
                    <td>{summary.stats.gradePercentages['3']}%</td>
                    <td>{summary.stats.gradePercentages['2.5']}%</td>
                    <td>{summary.stats.gradePercentages['2']}%</td>
                    <td>{summary.stats.gradePercentages['1.5']}%</td>
                    <td>{summary.stats.gradePercentages['1']}%</td>
                    <td>{summary.stats.gradePercentages['0']}%</td>
                    <td><strong>100%</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="pp5-stat-indicators">
              <div className="stat-card">
                <span className="stat-label">คะแนนเฉลี่ย (X̄)</span>
                <span className="stat-value">{summary.stats.meanScore}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">ส่วนเบี่ยงเบน (S.D.)</span>
                <span className="stat-value">{summary.stats.sdScore}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">ได้ระดับ 3 ขึ้นไป</span>
                <span className="stat-value">{summary.stats.qualityCount} คน ({summary.stats.qualityPercentage}%)</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">อัตราการผ่านเกณฑ์</span>
                <span className="stat-value">{summary.stats.passCount} คน ({summary.stats.passPercentage}%)</span>
              </div>
            </div>
          </div>

          {/* ส่วนลงนาม 3 ฝ่าย */}
          <div className="pp5-signatures">
            <div className="signature-col">
              <div className="sig-line">ลงชื่อ........................................................</div>
              <div className="sig-name">({COURSE_TEACHER_NAME})</div>
              <div className="sig-role">ครูผู้สอน</div>
              <div className="sig-date">วันที่ ..... เดือน .................... พ.ศ. {summary.academicYear}</div>
            </div>

            <div className="signature-col">
              <div className="sig-line">ลงชื่อ........................................................</div>
              <div className="sig-name">({ACADEMIC_HEAD_NAME})</div>
              <div className="sig-role">หัวหน้างานวัดและประเมินผล</div>
              <div className="sig-date">วันที่ ..... เดือน .................... พ.ศ. {summary.academicYear}</div>
            </div>

            <div className="signature-col">
              <div className="sig-line">ลงชื่อ........................................................</div>
              <div className="sig-name">({SCHOOL_DIRECTOR_NAME})</div>
              <div className="sig-role">ผู้อำนวยการโรงเรียนบ้านคลองมดแดง</div>
              <div className="sig-date">วันที่ ..... เดือน .................... พ.ศ. {summary.academicYear}</div>
            </div>
          </div>
        </div>
      ) : (
        /* โหมด 2: เล่ม ปพ.5 สมบูรณ์ (Booklet Pages) */
        <div className="pp5-booklet-container">
          {/* หน้าที่ 1: หน้าปกเล่ม ปพ.5 */}
          <div className="pp5-booklet-page pp5-page-break">
            <div className="pp5-cover-inner">
              <div className="pp5-cover-badge">แบบ ปพ.5</div>
              <div className="pp5-cover-logo">🏫</div>
              <h1 className="pp5-cover-title">แบบบันทึกผลการพัฒนาคุณภาพผู้เรียน</h1>
              <h2 className="pp5-cover-sub">ตามหลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน พุทธศักราช 2551</h2>

              <div className="pp5-cover-subject-box">
                <div className="pp5-cover-line"><strong>รายวิชา:</strong> {summary.subjectTitle}</div>
                <div className="pp5-cover-line"><strong>รหัสวิชา:</strong> {summary.subjectCode} ({summary.classroom.startsWith('ป.') ? `${summary.totalHours} ชั่วโมง` : `${summary.credit} หน่วยกิต`})</div>
                <div className="pp5-cover-line"><strong>กลุ่มสาระการเรียนรู้:</strong> วิทยาศาสตร์และเทคโนโลยี</div>
                <div className="pp5-cover-line"><strong>ระดับชั้น:</strong> {summary.classroom} • <strong>ภาคเรียนที่:</strong> {summary.term} ปีการศึกษา {summary.academicYear}</div>
                <div className="pp5-cover-line"><strong>ครูผู้สอน:</strong> {summary.teacherName}</div>
                <div className="pp5-cover-line"><strong>ครูประจำชั้น:</strong> {summary.advisorName}</div>
                <div className="pp5-cover-line"><strong>สถานศึกษา:</strong> {summary.schoolName}</div>
                <div className="pp5-cover-line"><strong>สังกัด:</strong> {summary.affiliation}</div>
              </div>

              {/* สรุปสถิติผลการเรียนหน้าปก */}
              <div className="pp5-cover-stats">
                <h3>สรุปการตัดสินผลการเรียน</h3>
                <table className="pp5-stat-table">
                  <thead>
                    <tr>
                      <th>ระดับ</th>
                      <th>4</th>
                      <th>3.5</th>
                      <th>3</th>
                      <th>2.5</th>
                      <th>2</th>
                      <th>1.5</th>
                      <th>1</th>
                      <th>0</th>
                      <th>รวม</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>คน</strong></td>
                      <td>{summary.stats.gradeCounts['4']}</td>
                      <td>{summary.stats.gradeCounts['3.5']}</td>
                      <td>{summary.stats.gradeCounts['3']}</td>
                      <td>{summary.stats.gradeCounts['2.5']}</td>
                      <td>{summary.stats.gradeCounts['2']}</td>
                      <td>{summary.stats.gradeCounts['1.5']}</td>
                      <td>{summary.stats.gradeCounts['1']}</td>
                      <td>{summary.stats.gradeCounts['0']}</td>
                      <td>{summary.stats.totalStudents}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* ลงนาม 4 ฝ่ายหน้าปก */}
              <div className="pp5-signatures" style={{ marginTop: '30px' }}>
                <div className="signature-col">
                  <div className="sig-line">ลงชื่อ..................................................</div>
                  <div className="sig-name">({COURSE_TEACHER_NAME})</div>
                  <div className="sig-role">ครูผู้สอน</div>
                </div>
                <div className="signature-col">
                  <div className="sig-line">ลงชื่อ..................................................</div>
                  <div className="sig-name">({ACADEMIC_HEAD_NAME})</div>
                  <div className="sig-role">หัวหน้างานวิชาการ</div>
                </div>
                <div className="signature-col">
                  <div className="sig-line">ลงชื่อ..................................................</div>
                  <div className="sig-name">({SCHOOL_DIRECTOR_NAME})</div>
                  <div className="sig-role">ผู้อำนวยการโรงเรียน</div>
                </div>
              </div>
            </div>
          </div>

          {/* หน้าที่ 2: ข้อมูลนักเรียนและเวลาเรียน */}
          <div className="pp5-booklet-page pp5-page-break">
            <h2 className="pp5-booklet-h2">1. ข้อมูลเกี่ยวกับนักเรียนและสรุปเวลาเรียน</h2>
            <table className="pp5-table" style={{ fontSize: '0.82rem' }}>
              <thead>
                <tr>
                  <th>เลขที่</th>
                  <th>รหัส</th>
                  <th>เลข ปชช. 13 หลัก</th>
                  <th>ชื่อ - นามสกุล</th>
                  <th>เพศ</th>
                  <th>วันเกิด</th>
                  <th>ชื่อบิดา - มารดา</th>
                  <th>มาเรียน</th>
                  <th>ลา</th>
                  <th>ขาด</th>
                  <th>ร้อยละ</th>
                  <th>ผลเวลา</th>
                </tr>
              </thead>
              <tbody>
                {summary.rows.map((r) => (
                  <tr key={r.studentCode}>
                    <td className="text-center">{r.studentNo}</td>
                    <td className="text-center">{r.studentCode}</td>
                    <td className="text-center" style={{ fontFamily: 'monospace' }}>{r.citizenId || '-'}</td>
                    <td className="text-left font-sarabun">{r.fullName}</td>
                    <td className="text-center">{r.prefix.includes('หญิง') ? 'หญิง' : 'ชาย'}</td>
                    <td className="text-center">{r.birthDate || '-'}</td>
                    <td className="text-left font-small">{r.fatherName || '-'} / {r.motherName || '-'}</td>
                    <td className="text-center font-bold">{r.attendancePresent}</td>
                    <td className="text-center">{r.attendanceSick}</td>
                    <td className="text-center">{r.attendanceAbsent}</td>
                    <td className="text-center font-bold">{r.attendancePercentage}%</td>
                    <td className={`text-center font-bold ${r.attendanceStatus === 'ผ่าน' ? 'eval-pass' : 'eval-fail'}`}>
                      {r.attendanceStatus}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* หน้าที่ 3: สรุปการประเมินคุณลักษณะและอ่านคิดวิเคราะห์ */}
          <div className="pp5-booklet-page">
            <h2 className="pp5-booklet-h2">2. สรุปผลการประเมินคุณลักษณะอันพึงประสงค์และการอ่าน คิดวิเคราะห์และเขียน</h2>
            <table className="pp5-table" style={{ fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>เลขที่</th>
                  <th>รหัส</th>
                  <th>ชื่อ - นามสกุล</th>
                  <th>คะแนนรวม ({weights.TOTAL})</th>
                  <th>ระดับผลการเรียน</th>
                  <th>คุณลักษณะอันพึงประสงค์ (8 ข้อ)</th>
                  <th>การอ่าน คิดวิเคราะห์และเขียน (5 ข้อ)</th>
                  <th>สมรรถนะสำคัญของผู้เรียน (5 ด้าน)</th>
                  <th>ผลการตัดสิน</th>
                </tr>
              </thead>
              <tbody>
                {summary.rows.map((r) => (
                  <tr key={r.studentCode}>
                    <td className="text-center">{r.studentNo}</td>
                    <td className="text-center">{r.studentCode}</td>
                    <td className="text-left font-sarabun">{r.fullName}</td>
                    <td className="text-center font-bold">{r.totalScore}</td>
                    <td className="text-center font-bold grade-cell">{r.grade}</td>
                    <td className="text-center font-bold">
                      {r.characteristicsScore === 3 ? 'ดีเยี่ยม (3)' : r.characteristicsScore === 2 ? 'ดี (2)' : r.characteristicsScore === 1 ? 'ผ่าน (1)' : 'ดีเยี่ยม (3)'}
                    </td>
                    <td className="text-center font-bold">
                      {r.readingThinkingScore === 3 ? 'ดีเยี่ยม (3)' : r.readingThinkingScore === 2 ? 'ดี (2)' : r.readingThinkingScore === 1 ? 'ผ่าน (1)' : 'ดีเยี่ยม (3)'}
                    </td>
                    <td className="text-center font-bold">
                      {r.competencyScore === 3 ? 'ดีเยี่ยม (3)' : r.competencyScore === 2 ? 'ดี (2)' : r.competencyScore === 1 ? 'ผ่าน (1)' : 'ดีเยี่ยม (3)'}
                    </td>
                    <td className={`text-center font-bold ${r.isPassed ? 'eval-pass' : 'eval-fail'}`}>
                      {r.evaluationText}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`
        .pp5-print-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: #f1f5f9;
          z-index: 99999;
          overflow-y: auto;
          font-family: 'TH Sarabun New', 'Sarabun', -apple-system, sans-serif;
          color: #0f172a;
        }

        .pp5-action-bar {
          position: sticky;
          top: 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #1e293b;
          color: white;
          padding: 12px 24px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 10;
          flex-wrap: wrap;
          gap: 12px;
        }

        .pp5-action-info strong {
          font-size: 1.1rem;
          display: block;
        }

        .pp5-action-info span {
          font-size: 0.85rem;
          color: #94a3b8;
        }

        .pp5-action-buttons {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }

        .pp5-mode-toggle {
          display: flex;
          background: #0f172a;
          padding: 3px;
          border-radius: 8px;
          margin-right: 4px;
        }

        .pp5-mode-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 11px;
          border-radius: 6px;
          font-size: 0.82rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          background: transparent;
          color: #94a3b8;
          transition: all 0.15s;
        }

        .pp5-mode-btn.active {
          background: #3b82f6;
          color: white;
        }

        .pp5-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 13px;
          border-radius: 8px;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.15s;
        }

        .pp5-btn-excel { background: #10b981; color: white; }
        .pp5-btn-excel:hover { background: #059669; }

        .pp5-btn-word { background: #2563eb; color: white; }
        .pp5-btn-word:hover { background: #1d4ed8; }

        .pp5-btn-primary { background: #22c55e; color: white; }
        .pp5-btn-primary:hover { background: #16a34a; }

        .pp5-btn-close { background: #ef4444; color: white; }
        .pp5-btn-close:hover { background: #dc2626; }

        .pp5-page {
          background: white;
          width: 297mm;
          min-height: 210mm;
          margin: 20px auto;
          padding: 15mm 15mm;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          box-sizing: border-box;
        }

        .pp5-booklet-container {
          max-width: 297mm;
          margin: 20px auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .pp5-booklet-page {
          background: white;
          padding: 16mm 18mm;
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
          box-sizing: border-box;
        }

        .pp5-cover-inner {
          border: 3px double #1e293b;
          border-radius: 12px;
          padding: 24px 30px;
          text-align: center;
          position: relative;
        }

        .pp5-cover-badge {
          position: absolute;
          top: 14px;
          right: 18px;
          border: 2px solid #0f172a;
          padding: 3px 12px;
          font-size: 1.1rem;
          font-weight: bold;
        }

        .pp5-cover-logo { font-size: 2.8rem; margin-bottom: 6px; }
        .pp5-cover-title { font-size: 1.8rem; font-weight: bold; margin: 4px 0; }
        .pp5-cover-sub { font-size: 1.15rem; color: #475569; margin: 0 0 18px; }

        .pp5-cover-subject-box {
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          border-radius: 8px;
          padding: 14px 20px;
          text-align: left;
          font-size: 1rem;
          line-height: 1.8;
          max-width: 700px;
          margin: 0 auto 16px;
        }

        .pp5-cover-stats {
          max-width: 700px;
          margin: 0 auto;
        }
        .pp5-cover-stats h3 { font-size: 1.05rem; margin-bottom: 6px; }

        .pp5-booklet-h2 {
          font-size: 1.3rem;
          font-weight: bold;
          border-bottom: 2px solid #1e3a8a;
          padding-bottom: 6px;
          margin-bottom: 12px;
        }

        .pp5-header {
          text-align: center;
          margin-bottom: 12px;
        }

        .pp5-emblem-space {
          font-size: 2rem;
          line-height: 1;
          margin-bottom: 4px;
        }

        .pp5-title {
          font-size: 1.6rem;
          font-weight: bold;
          margin: 0;
          color: #0f172a;
        }

        .pp5-subtitle {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 2px 0 10px;
          color: #334155;
        }

        .pp5-meta-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 4px 16px;
          font-size: 0.95rem;
          text-align: left;
          background: #f8fafc;
          padding: 8px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
        }

        .pp5-table-wrap {
          margin-top: 10px;
          overflow-x: auto;
        }

        .pp5-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }

        .pp5-table th, .pp5-table td {
          border: 1px solid #334155;
          padding: 3px 4px;
          line-height: 1.2;
        }

        .pp5-table th {
          background: #f1f5f9;
          font-weight: bold;
          text-align: center;
        }

        .sub-th {
          font-size: 0.75rem;
          background: #f8fafc !important;
        }

        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .font-bold { font-weight: bold; }
        .font-small { font-size: 0.75rem; }

        .grade-cell {
          font-size: 1rem;
        }
        .grade-4 { color: #15803d; background: #f0fdf4; }
        .grade-0 { color: #b91c1c; background: #fef2f2; }

        .eval-pass { color: #15803d; font-weight: 600; }
        .eval-fail { color: #b91c1c; font-weight: 600; }

        .pp5-summary-section {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 16px;
          margin-top: 14px;
          page-break-inside: avoid;
        }

        .pp5-summary-box {
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 8px;
        }

        .pp5-summary-title {
          font-size: 0.95rem;
          font-weight: bold;
          margin: 0 0 6px;
          text-align: center;
        }

        .pp5-stat-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.82rem;
          text-align: center;
        }

        .pp5-stat-table th, .pp5-stat-table td {
          border: 1px solid #94a3b8;
          padding: 4px;
        }

        .pp5-stat-table th {
          background: #f1f5f9;
        }

        .pp5-stat-indicators {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .stat-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 8px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          text-align: center;
        }

        .stat-label {
          font-size: 0.8rem;
          color: #64748b;
        }

        .stat-value {
          font-size: 1.05rem;
          font-weight: bold;
          color: #0f172a;
          margin-top: 2px;
        }

        .pp5-signatures {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-top: 24px;
          text-align: center;
          font-size: 0.9rem;
          page-break-inside: avoid;
        }

        .sig-line { margin-bottom: 4px; }
        .sig-name { font-weight: 600; }
        .sig-role { color: #475569; margin-top: 2px; }
        .sig-date { font-size: 0.8rem; color: #64748b; margin-top: 4px; }

        @media print {
          @page {
            size: A4 landscape;
            margin: 8mm;
          }

          body {
            background: white !important;
          }

          .pp5-no-print {
            display: none !important;
          }

          .pp5-print-container {
            position: static;
            background: white;
            padding: 0;
            overflow: visible;
          }

          .pp5-page, .pp5-booklet-page {
            width: 100% !important;
            min-height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }

          .pp5-page-break {
            page-break-after: always;
          }

          .pp5-table th, .pp5-table td {
            border-color: #000 !important;
          }

          .pp5-meta-grid, .pp5-summary-box, .stat-card {
            border-color: #000 !important;
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
};
