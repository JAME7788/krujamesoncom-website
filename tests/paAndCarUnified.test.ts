import { describe, expect, it } from 'vitest';
import {
  loadP1MouseRecords,
  calculateResearchStatistics,
  buildP1MouseResearchReport,
  generateMouseResearchDocxParagraphs,
  MOUSE_RESEARCH_TITLE,
} from '../src/services/mouseResearchService';
import {
  buildPaAgreementDocument,
  generatePaAgreementDocxParagraphs,
  DEFAULT_PA_META,
} from '../src/services/paAgreementService';
import { RESEARCH_PRESETS } from '../src/services/researchService';

describe('Unified Classroom Action Research (CAR) & ว.PA Agreement (P.1 Mouse Skills)', () => {
  const records = loadP1MouseRecords();
  const stats = calculateResearchStatistics(records);

  it('verifies that the research topic title is exactly unified across CAR and PA', () => {
    const expectedTitle = 'การพัฒนาทักษะปฏิบัติการใช้เมาส์ด้วยเกมมิฟิเคชัน (Gamification) ร่วมกับ Active Learning วิชาวิทยาการคำนวณและเทคโนโลยี ชั้นประถมศึกษาปีที่ ๑ (๑๑ คน)';
    
    expect(MOUSE_RESEARCH_TITLE).toBe(expectedTitle);
    expect(DEFAULT_PA_META.title).toBe(expectedTitle);
    expect(RESEARCH_PRESETS[0].title).toBe(expectedTitle);
    expect(RESEARCH_PRESETS[0].id).toBe('mouse-p1-pa');
  });

  it('contains exactly 11 Grade 1 students matching the official roster', () => {
    expect(records).toHaveLength(11);
    
    // Check specific sample students from 2569 roster
    const studentCodes = records.map((r) => r.studentCode);
    expect(studentCodes).toContain('3069'); // ณัฐพัฒน์
    expect(studentCodes).toContain('3071'); // ระพีพัฒน์
    expect(studentCodes).toContain('3214'); // สุภัสสรา
  });

  it('calculates valid statistical results for 11 students with positive gain and 100% passing rate', () => {
    expect(stats.count).toBe(11);
    expect(stats.preMean).toBeGreaterThan(40);
    expect(stats.postMean).toBeGreaterThan(85);
    expect(stats.postMean).toBeGreaterThan(stats.preMean);
    expect(stats.passedPercentage).toBe(100);
    expect(stats.gainPercentage).toBeGreaterThan(70);
    expect(stats.tValue).toBeGreaterThan(15);
  });

  it('builds a full 5-chapter CAR document containing all chapters and identical student statistics', () => {
    const carDoc = buildP1MouseResearchReport(stats, records);

    expect(carDoc).toContain(MOUSE_RESEARCH_TITLE);
    expect(carDoc).toContain('นายอนันตชัย เพ็ชรรี่');
    expect(carDoc).toContain('โรงเรียนบ้านคลองมดแดง');
    expect(carDoc).toContain('บทที่ 1 บทนำ');
    expect(carDoc).toContain('บทที่ 2 เอกสารและงานวิจัยที่เกี่ยวข้อง');
    expect(carDoc).toContain('บทที่ 3 วิธีดำเนินการวิจัย');
    expect(carDoc).toContain('บทที่ 4 ผลการวิเคราะห์ข้อมูล');
    expect(carDoc).toContain('บทที่ 5 สรุป อภิปรายผล และข้อเสนอแนะ');
    expect(carDoc).toContain('ตารางที่ 4.1');
    expect(carDoc).toContain('ตารางที่ 4.2');

    // Verify all 11 students are printed in table
    records.forEach((r) => {
      expect(carDoc).toContain(r.name);
    });
  });

  it('builds official ว.PA (PA 1/ส Part 2) document with matching target indicators and teacher information', () => {
    const paDoc = buildPaAgreementDocument(stats, records);

    expect(paDoc).toContain('ข้อตกลงในการพัฒนางานที่เป็นประเด็นท้าทาย');
    expect(paDoc).toContain('แบบข้อตกลงในการพัฒนางาน (PA)');
    expect(paDoc).toContain(MOUSE_RESEARCH_TITLE);
    expect(paDoc).toContain('นายอนันตชัย เพ็ชรรี่');
    expect(paDoc).toContain('ครูผู้ช่วย');
    expect(paDoc).toContain('โรงเรียนบ้านคลองมดแดง');
    expect(paDoc).toContain('๑. สภาพปัญหาการจัดการเรียนรู้และคุณภาพการเรียนรู้ของผู้เรียน');
    expect(paDoc).toContain('๒. วิธีการดำเนินการให้บรรลุผล');
    expect(paDoc).toContain('๓. ผลลัพธ์การพัฒนาที่คาดหวัง');
    expect(paDoc).toContain('๓.๑ ผลลัพธ์เชิงปริมาณ');
    expect(paDoc).toContain('๓.๒ ผลลัพธ์เชิงคุณภาพ');

    // Quantitative metrics check
    expect(paDoc).toContain('ร้อยละ ๑๐๐');
    expect(paDoc).toContain('เกณฑ์ร้อยละ ๗๐');

    // All 11 students listed in PA document
    records.forEach((r) => {
      expect(paDoc).toContain(r.name);
      expect(paDoc).toContain(r.studentCode);
    });
  });

  it('generates valid docx paragraph structures for both CAR and PA', () => {
    const carParagraphs = generateMouseResearchDocxParagraphs(stats, records);
    expect(carParagraphs.length).toBeGreaterThan(20);

    const paParagraphs = generatePaAgreementDocxParagraphs(stats, records);
    expect(paParagraphs.length).toBeGreaterThan(20);
  });
});
