import { describe, it, expect } from 'vitest';
import { getClassroomExportSummary } from '../src/services/gradeExportService';
import {
  generatePp5CompleteDocxHtml,
  generatePp5CompleteSpreadsheetXml,
  generatePp6CompleteSpreadsheetXml,
  generatePp6CompleteDocxHtml,
} from '../src/services/pp5CompleteGeneratorService';
import { syncAllRostersWithOfficialDmc2569 } from '../src/services/rosterService';
import { students2569, allClassrooms2569 } from '../src/data/students2569';

describe('PP5 and PP6 Complete Generator Service', () => {
  it('enriches classroom export summary with official student demographics and attendance', () => {
    const summaryM1 = getClassroomExportSummary('ม.1', 'cs');
    expect(summaryM1.rows.length).toBe(12);
    expect(summaryM1.credit).toBe(0.5);
    expect(summaryM1.totalHours).toBe(20);
    expect(summaryM1.advisorName).toContain('อนันตชัย');
    expect(summaryM1.attendanceSummary.averagePercentage).toBeGreaterThanOrEqual(80);

    const firstStudent = summaryM1.rows[0];
    expect(firstStudent.studentCode).toBeTruthy();
    expect(firstStudent.citizenId).toBeTruthy(); // 13-digit citizen ID
    expect(firstStudent.birthDate).toBeTruthy();
    expect(firstStudent.attendancePresent).toBeGreaterThanOrEqual(0);
    expect(firstStudent.attendancePercentage).toBeGreaterThanOrEqual(0);
    expect(firstStudent.attendanceStatus).toBe('ผ่าน');
  });

  it('generates valid official Word document HTML for PP5 with all sections and signatories', () => {
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

  it('generates valid 9-sheet SpreadsheetML XML matching official PP5 template', () => {
    const summary = getClassroomExportSummary('ม.2', 'cs');
    const xml = generatePp5CompleteSpreadsheetXml(summary);

    expect(xml).toContain('xmlns="urn:schemas-microsoft-com:office:spreadsheet"');
    expect(xml).toContain('<Worksheet ss:Name="หน้าปก">');
    expect(xml).toContain('<Worksheet ss:Name="ข้อมูลเกี่ยวกับนักเรียน">');
    expect(xml).toContain('<Worksheet ss:Name="เวลาเรียน">');
    expect(xml).toContain('<Worksheet ss:Name="สรุปเวลา">');
    expect(xml).toContain('<Worksheet ss:Name="สรุปคะแนน">');
    expect(xml).toContain('<Worksheet ss:Name="คุณลักษณะ">');
    expect(xml).toContain('<Worksheet ss:Name="อ่านคิด">');
    expect(xml).toContain('<Worksheet ss:Name="ตัวชี้วัด">');
    expect(xml).toContain('<Worksheet ss:Name="ปกหลัง">');

    // Ensure student data and school name are present
    expect(xml).toContain('โรงเรียนบ้านคลองมดแดง');
    expect(xml).toContain(summary.rows[0].fullName);
  });

  it('generates valid 4-sheet SpreadsheetML XML matching official PP6 template', () => {
    const summary = getClassroomExportSummary('ป.1', 'main');
    const xml = generatePp6CompleteSpreadsheetXml(summary);

    expect(xml).toContain('xmlns="urn:schemas-microsoft-com:office:spreadsheet"');
    expect(xml).toContain('<Worksheet ss:Name="กำหนดข้อมูล">');
    expect(xml).toContain('<Worksheet ss:Name="บันทึกข้อมูล คะแนน">');
    expect(xml).toContain('<Worksheet ss:Name="บันทึก คุณลักษณะ อ่านคิด กิจกรร">');
    expect(xml).toContain('<Worksheet ss:Name="รายงาน ปพ.6">');

    expect(xml).toContain('โรงเรียนบ้านคลองมดแดง');
    expect(xml).toContain(summary.rows[0].fullName);
  });

  it('generates valid Word document HTML for PP6', () => {
    const summary = getClassroomExportSummary('ม.3', 'cs');
    const docxHtml = generatePp6CompleteDocxHtml(summary);

    expect(docxHtml).toContain('แบบรายงานผลการพัฒนาคุณภาพผู้เรียนรายบุคคล (ปพ.6)');
    expect(docxHtml).toContain('โรงเรียนบ้านคลองมดแดง');
    expect(docxHtml).toContain('๑. ผลการประเมินรายวิชาและตัวชี้วัด');
    expect(docxHtml).toContain('๒. ผลการประเมินตามตัวชี้วัดรายวิชา');
    expect(docxHtml).toContain('๓. สรุปการประเมินคุณลักษณะอันพึงประสงค์ การอ่านคิดวิเคราะห์ และเวลาเรียน');
    expect(docxHtml).toContain('ครูผู้สอน');
    expect(docxHtml).toContain('ครูประจำชั้น');
    expect(docxHtml).toContain('ผู้อำนวยการโรงเรียนบ้านคลองมดแดง');
    expect(docxHtml).toContain('ผู้ปกครอง');
  });

  it('verifies official DMC student roster totals 113 students across 9 classrooms', async () => {
    let totalStudents = 0;
    for (const cls of allClassrooms2569) {
      totalStudents += students2569[cls].length;
    }
    expect(totalStudents).toBe(113);

    // Sync function works seamlessly
    const syncRes = await syncAllRostersWithOfficialDmc2569();
    expect(syncRes.totalStudents).toBe(113);
    expect(syncRes.syncedCount).toBe(9);
  });
});
