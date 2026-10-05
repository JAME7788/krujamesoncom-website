import { describe, it, expect } from 'vitest';
import { getClassroomExportSummary } from '../src/services/gradeExportService';
import {
  generatePp5CompleteDocxHtml,
  generatePp5CompleteSpreadsheetXml,
} from '../src/services/pp5CompleteGeneratorService';

describe('PP5 Complete Generator Service', () => {
  it('enriches classroom export summary with official student demographics and attendance', () => {
    const summaryM1 = getClassroomExportSummary('ม.1', 'cs');
    expect(summaryM1.rows.length).toBeGreaterThan(0);
    expect(summaryM1.credit).toBe(0.5);
    expect(summaryM1.totalHours).toBe(20);
    expect(summaryM1.advisorName).toContain('อนันตชัย');
    expect(summaryM1.attendanceSummary.averagePercentage).toBeGreaterThanOrEqual(80);

    const firstStudent = summaryM1.rows[0];
    expect(firstStudent.studentCode).toBeTruthy();
    expect(firstStudent.citizenId).toBeTruthy(); // Should have 13-digit citizen ID from official info
    expect(firstStudent.birthDate).toBeTruthy();
    expect(firstStudent.attendancePresent).toBeGreaterThanOrEqual(0);
    expect(firstStudent.attendancePercentage).toBeGreaterThanOrEqual(0);
    expect(firstStudent.attendanceStatus).toBe('ผ่าน');
  });

  it('generates valid official Word document HTML with all 7 sections and 4 signatories', () => {
    const summary = getClassroomExportSummary('ม.1', 'cs');
    const docxHtml = generatePp5CompleteDocxHtml(summary);

    expect(docxHtml).toContain('xmlns:w="urn:schemas-microsoft-com:office:word"');
    expect(docxHtml).toContain('โรงเรียนบ้านคลองมดแดง');
    expect(docxHtml).toContain('แบบบันทึกผลการพัฒนาคุณภาพผู้เรียน (ปพ.5)');
    expect(docxHtml).toContain('นายอนันตชัย เพ็ชรรี่');
    expect(docxHtml).toContain('นายปรัชญา ปรางค์ชัยภูมิ');

    // Section 1: Indicators
    expect(docxHtml).toContain('หมวดที่ ๑: โครงสร้างหลักสูตรและตัวชี้วัดการเรียนรู้');
    // Section 2: Student demographic & attendance
    expect(docxHtml).toContain('หมวดที่ ๒: ข้อมูลประวัตินักเรียนและบันทึกเวลาเรียน');
    expect(docxHtml).toContain('เลขประจำตัวประชาชน');
    // Section 3: Scores & grades
    expect(docxHtml).toContain('หมวดที่ ๓: สรุปคะแนนผลการเรียนรู้และตัดสินผลการเรียน');
    // Section 4: Desirable attributes & reading
    expect(docxHtml).toContain('หมวดที่ ๔: การประเมินคุณลักษณะอันพึงประสงค์และการอ่าน คิดวิเคราะห์ เขียน');

    // Signatures
    expect(docxHtml).toContain('ครูผู้สอน');
    expect(docxHtml).toContain('ครูประจำชั้น');
    expect(docxHtml).toContain('หัวหน้าวิชาการ');
    expect(docxHtml).toContain('ผู้อนุมัติ');
  });

  it('generates valid multi-sheet SpreadsheetML XML with all 7 worksheets', () => {
    const summary = getClassroomExportSummary('ม.2', 'cs');
    const xml = generatePp5CompleteSpreadsheetXml(summary);

    expect(xml).toContain('xmlns="urn:schemas-microsoft-com:office:spreadsheet"');
    expect(xml).toContain('<Worksheet ss:Name="หน้าปก">');
    expect(xml).toContain('<Worksheet ss:Name="ข้อมูลเกี่ยวกับนักเรียน">');
    expect(xml).toContain('<Worksheet ss:Name="ตัวชี้วัด">');
    expect(xml).toContain('<Worksheet ss:Name="เวลาเรียน">');
    expect(xml).toContain('<Worksheet ss:Name="สรุปคะแนน">');
    expect(xml).toContain('<Worksheet ss:Name="คุณลักษณะ">');
    expect(xml).toContain('<Worksheet ss:Name="อ่านคิด">');

    // Ensure student data is present
    expect(xml).toContain('โรงเรียนบ้านคลองมดแดง');
    expect(xml).toContain(summary.rows[0].fullName);
  });

  it('handles primary school classrooms correctly (ป.1 - ป.6)', () => {
    const summaryP1 = getClassroomExportSummary('ป.1', 'main');
    expect(summaryP1.credit).toBe(1.0);
    expect(summaryP1.rows.length).toBeGreaterThan(0);

    const docxHtml = generatePp5CompleteDocxHtml(summaryP1);
    expect(docxHtml).toContain('ป.1');
    expect(docxHtml).toContain(summaryP1.rows[0].fullName);

    const xml = generatePp5CompleteSpreadsheetXml(summaryP1);
    expect(xml).toContain('ป.1');
  });
});
