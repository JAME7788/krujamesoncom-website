import { describe, expect, it } from 'vitest';
import {
  buildResearchDocument,
  replaceResearchDocumentPart,
  splitResearchDocument,
  type ResearchData,
  type ResearchMeta,
} from '../src/services/researchService';

const meta: ResearchMeta = {
  title: 'การพัฒนาการเรียนรู้ผ่านเว็บ',
  researcher: 'นายอนันตชัย เพ็ชรรี่',
  school: 'โรงเรียนบ้านคลองมดแดง',
  academicYear: '2569',
  classroomLabel: 'ป.1',
};

const data: ResearchData = {
  n: 8,
  populationSize: 11,
  scoreRecords: 8,
  classroomsUsed: ['ป.1'],
  achievementMean100: 82.5,
  achievementSD: 5.2,
  achievementMean25: 20.63,
  achievementLevel: 'ดีเยี่ยม',
  gradeDist: { '4': 6, '3.5': 2 },
  passRate: 100,
  kMean: 13,
  pMean: 25,
  aMean: 8,
  examMean: 26,
  activeStudents: 9,
  avgXp: 350,
  avgLevel: 4,
  maxLevel: 6,
  avgStreak: 3,
  avgActivities: 12,
  avgQuizzes: 5,
  avgSlides: 20,
  engagementRate: 81.82,
  objectives: [],
  e1: 81,
  e2: 84,
  preMean: 60,
  postMean: 85,
  learningGain: 25,
  prePostN: 8,
};

describe('five-chapter classroom research document', () => {
  it('builds all five formal chapters from real-data fields', () => {
    const documentText = buildResearchDocument(meta, data);
    const parts = splitResearchDocument(documentText);

    expect(parts).toHaveLength(6);
    expect(parts.map((part) => part.key)).toEqual([
      'front', 'chapter-1', 'chapter-2', 'chapter-3', 'chapter-4', 'chapter-5',
    ]);
    expect(documentText).toContain('ประชากรตามบัญชีรายชื่อมี 11 คน');
    expect(documentText).toContain('จำนวนระเบียนผลการเรียนที่ใช้คำนวณ: 8 ระเบียน');
    expect(documentText).toContain('3.9 การคุ้มครองข้อมูลผู้เรียน');
    expect(documentText).toContain('5.3 ข้อจำกัดของการวิจัย');
  });

  it('edits one chapter without removing the other chapters', () => {
    const documentText = buildResearchDocument(meta, data);
    const updated = replaceResearchDocumentPart(
      documentText,
      'chapter-2',
      'บทที่ 2 เอกสารและงานวิจัยที่เกี่ยวข้อง\n\nเนื้อหาที่ครูแก้ไข',
    );

    expect(updated).toContain('เนื้อหาที่ครูแก้ไข');
    expect(splitResearchDocument(updated)).toHaveLength(6);
    expect(updated).toContain('บทที่ 1 บทนำ');
    expect(updated).toContain('บทที่ 5 สรุป อภิปรายผล และข้อเสนอแนะ');
  });
});
