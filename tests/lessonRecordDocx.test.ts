// ไฟล์ Word ของบันทึกหลังสอนคือเอกสารที่ครูพิมพ์ส่งจริง
// ถ้าไฟล์เสีย Word จะเปิดไม่ขึ้นเลย และครูจะรู้ตอนถึงมือผู้บริหารแล้ว
// เทสต์ชุดนี้จึงตรวจถึงระดับไบต์ว่าเป็น ZIP ที่ถูกต้องและมีเนื้อหาครบตามแบบราชการ
import { describe, expect, it } from 'vitest';
import { createZip, buildDocx, escapeXml } from '../src/utils/docxWriter';
import {
  buildLessonRecordParagraphs,
  splitIsoToThai,
  percentOf,
  type LessonRecordDocData,
} from '../src/utils/lessonRecordDocx';

const bytesOf = async (blob: Blob) => new Uint8Array(await blob.arrayBuffer());
const textOf = async (blob: Blob) => new TextDecoder().decode(await bytesOf(blob));

const sample: LessonRecordDocData = {
  courseName: 'เทคโนโลยี (วิทยาการคำนวณ)',
  gradeLabel: '1',
  unitNo: 1,
  unitTitle: 'การใช้งานเทคโนโลยีเบื้องต้น',
  planNo: 6,
  planTitle: 'คลิกหนึ่งครั้งและดับเบิลคลิก',
  week: 6,
  day: '25',
  month: 'มิถุนายน',
  buddhistYear: '2569',
  semester: 1,
  academicYear: '2569',
  totalStudents: 12,
  passedCount: 10,
  summary: 'นักเรียน 10 คน คลิกและดับเบิลคลิกได้ถูกต้อง',
  problems: 'เด็กบางคนกล้ามเนื้อมือยังไม่แข็งแรงพอ',
  improvements: 'สอนซ่อมช่วงพักกลางวัน',
  teacherName: 'นายอนันตชัย เพ็ชรรี่',
  teacherPosition: 'ครูผู้ช่วย',
  deputyName: 'นางสาวเจนจีรา บุญเกตุ',
  directorName: 'นายปรัชญา ปรางค์ชัยภูมิ',
  schoolName: 'โรงเรียนบ้านคลองมดแดง',
};

describe('ตัวเขียนไฟล์ ZIP', () => {
  it('ต้องขึ้นต้นด้วยลายเซ็น PK ที่ Word ใช้ตรวจว่าเป็นไฟล์ที่ถูกต้อง', async () => {
    const bytes = await bytesOf(createZip([{ name: 'a.txt', content: 'hello' }]));
    expect(bytes[0]).toBe(0x50); // 'P'
    expect(bytes[1]).toBe(0x4B); // 'K'
    expect(bytes[2]).toBe(0x03);
    expect(bytes[3]).toBe(0x04);
  });

  it('ต้องมีท้ายไฟล์ (End of Central Directory) ไม่งั้นถือว่าไฟล์ไม่สมบูรณ์', async () => {
    const bytes = await bytesOf(createZip([{ name: 'a.txt', content: 'hi' }]));
    const tail = bytes.slice(-22);
    expect([tail[0], tail[1], tail[2], tail[3]]).toEqual([0x50, 0x4B, 0x05, 0x06]);
  });

  it('จำนวนไฟล์ในสารบัญต้องตรงกับที่ใส่เข้าไป', async () => {
    const zip = createZip([
      { name: 'a.txt', content: 'a' },
      { name: 'b.txt', content: 'b' },
      { name: 'c.txt', content: 'c' },
    ]);
    const bytes = await bytesOf(zip);
    const tail = bytes.slice(-22);
    const total = tail[10] | (tail[11] << 8);
    expect(total).toBe(3);
  });

  it('ข้อความไทยต้องอยู่ครบในไฟล์ เพราะเก็บแบบไม่บีบอัด', async () => {
    const text = await textOf(createZip([{ name: 'a.xml', content: 'สวัสดีครูเจมส์' }]));
    expect(text).toContain('สวัสดีครูเจมส์');
  });

  it('ต้องหนีอักขระพิเศษของ XML ไม่งั้นไฟล์เสีย', () => {
    expect(escapeXml('ก & ข < ค > ง "จ"')).toBe('ก &amp; ข &lt; ค &gt; ง &quot;จ&quot;');
  });
});

describe('ไฟล์ .docx ของบันทึกหลังสอน', () => {
  it('ต้องมีชิ้นส่วนครบตามที่ Word ต้องการ', async () => {
    const text = await textOf(buildDocx(buildLessonRecordParagraphs(sample)));
    expect(text).toContain('[Content_Types].xml');
    expect(text).toContain('_rels/.rels');
    expect(text).toContain('word/document.xml');
    expect(text).toContain('<w:document');
    expect(text).toContain('</w:document>');
  });

  it('ต้องมีหัวข้อครบทั้ง 4 ข้อตามแบบราชการ', async () => {
    const text = await textOf(buildDocx(buildLessonRecordParagraphs(sample)));
    expect(text).toContain('บันทึกผลหลังการจัดกิจกรรมการเรียนรู้');
    expect(text).toContain('1. ผลการจัดการเรียนรู้');
    expect(text).toContain('2. สรุปผลการจัดการเรียนรู้');
    expect(text).toContain('3. ปัญหาและอุปสรรคระหว่างการจัดกิจกรรมการสอน');
    expect(text).toContain('4. การปรับปรุงและพัฒนา');
    expect(text).toContain('ความคิดเห็น (หัวหน้ากลุ่มสาระการเรียนรู้ / หรือผู้ที่ได้รับมอบหมาย)');
  });

  it('ต้องมีชื่อผู้บริหารและโรงเรียนสำหรับช่องเซ็น', async () => {
    const text = await textOf(buildDocx(buildLessonRecordParagraphs(sample)));
    expect(text).toContain('นางสาวเจนจีรา บุญเกตุ');
    expect(text).toContain('นายปรัชญา ปรางค์ชัยภูมิ');
    expect(text).toContain('รองผู้อำนวยการสถานศึกษา');
    expect(text).toContain('ผู้อำนวยการสถานศึกษา');
    expect(text).toContain('โรงเรียนบ้านคลองมดแดง');
  });

  it('ต้องเติมค่าที่ครูกรอกลงในช่องว่างจริง', async () => {
    const text = await textOf(buildDocx(buildLessonRecordParagraphs(sample)));
    expect(text).toContain('คลิกหนึ่งครั้งและดับเบิลคลิก');
    expect(text).toContain('มิถุนายน');
    expect(text).toContain('นักเรียน 10 คน คลิกและดับเบิลคลิกได้ถูกต้อง');
  });

  it('หลายคาบต้องขึ้นหน้าใหม่ ไม่ต่อกันในหน้าเดียว', async () => {
    const two = [
      ...buildLessonRecordParagraphs(sample),
      '__PAGEBREAK__' as const,
      ...buildLessonRecordParagraphs({ ...sample, planNo: 7 }),
    ];
    const text = await textOf(buildDocx(two));
    expect(text).toContain('<w:br w:type="page"/>');
  });

  it('ใช้ฟอนต์ TH Sarabun New ตามมาตรฐานเอกสารราชการไทย', async () => {
    const text = await textOf(buildDocx(buildLessonRecordParagraphs(sample)));
    expect(text).toContain('TH Sarabun New');
  });
});

describe('แปลงวันที่และร้อยละสำหรับแบบฟอร์ม', () => {
  it('แปลง ค.ศ. เป็น พ.ศ. และเดือนเป็นภาษาไทย', () => {
    expect(splitIsoToThai('2026-06-25')).toEqual({
      day: '25', month: 'มิถุนายน', buddhistYear: '2569',
    });
    expect(splitIsoToThai('2026-01-01')).toEqual({
      day: '1', month: 'มกราคม', buddhistYear: '2569',
    });
  });

  it('วันที่ไม่ถูกต้องต้องไม่ทำให้พัง', () => {
    expect(splitIsoToThai('')).toEqual({ day: '', month: '', buddhistYear: '' });
  });

  it.each([
    [12, 12, '100.0'],
    [10, 12, '83.3'],
    [9, 12, '75.0'],
    [0, 12, '0.0'],
  ])('ผ่าน %i จาก %i ต้องได้ร้อยละ %s', (passed, total, expected) => {
    expect(percentOf(passed, total)).toBe(expected);
  });

  it('ไม่มีจำนวนนักเรียนต้องไม่หารด้วยศูนย์', () => {
    expect(percentOf(5, 0)).toBe('-');
  });
});
