// บั๊กที่เคยเกิดจริง: สไลด์ทุกแผ่นของทุกหน่วยขึ้นกล่องเตือนเรื่อง AI
//
// สาเหตุ: ข้อความสไลด์ที่ยังไม่แยกส่วน มีตัวคั่นของ teachingNote ติดมาด้วย
// ("EXPLAIN: ... EXAMPLE: ... PROMPT: ...") แล้วคำว่า PROMPT ไปตรงกับรูปแบบ
// /Prompt/i ของตัวตรวจธีม บทเรียนอัลกอริทึมของ ป.3 จึงขึ้นคำเตือนว่า
// "AI ตอบผิดได้และตอบผิดอย่างมั่นใจด้วย" ซึ่งไม่เกี่ยวกับบทเรียนเลย
import { describe, expect, it } from 'vitest';
import { detectLessonTheme } from '../src/utils/lessonTheme';

describe('ตรวจธีมบทเรียนจากข้อความ', () => {
  it.each([
    ['เขียนโปรแกรมด้วยบล็อกคำสั่ง', 'coding'],
    ['การแสดงอัลกอริทึมด้วยภาพ สัญลักษณ์ ข้อความ', 'coding'],
    ['ใช้อินเทอร์เน็ตค้นหาความรู้', 'internet'],
    ['รวบรวมและนำเสนอข้อมูลด้วยกราฟ', 'data'],
    ['ใช้เทคโนโลยีอย่างปลอดภัยและรักษาข้อมูลส่วนตัว', 'safety'],
    ['การตั้งชื่อไฟล์และจัดโฟลเดอร์', 'file'],
    ['รู้จักปัญญาประดิษฐ์และการเรียนรู้ของเครื่อง', 'ai'],
  ])('“%s” ต้องได้ธีม %s', (text, expected) => {
    expect(detectLessonTheme(text)).toBe(expected);
  });

  it('ตัวคั่น PROMPT ของ teachingNote ต้องไม่ทำให้กลายเป็นธีม AI', () => {
    const withNoteMarkers = 'หัวข้อที่ 4: การแสดงอัลกอริทึมด้วยภาพ\n'
      + 'EXPLAIN: อธิบายแนวคิด\nEXAMPLE: ตัวอย่างกิจกรรม\nPROMPT: ชวนคิดต่อ';
    expect(detectLessonTheme(withNoteMarkers)).not.toBe('ai');
    expect(detectLessonTheme(withNoteMarkers)).toBe('coding');
  });

  it('คำอังกฤษที่มีตัวอักษร ai อยู่กลางคำต้องไม่ถูกนับเป็นธีม AI', () => {
    // ชื่อแหล่งเรียนรู้จริงในเว็บ เช่น CodingThailand มีตัว ai อยู่กลางคำ
    expect(detectLessonTheme('แหล่งเรียนรู้ CodingThailand สำหรับฝึกเขียนโปรแกรม')).not.toBe('ai');
    expect(detectLessonTheme('ส่ง email แจ้งครูเมื่อพบเนื้อหาไม่เหมาะสม')).not.toBe('ai');
    expect(detectLessonTheme('อ่านรายละเอียด detail ของไฟล์ก่อนบันทึก')).not.toBe('ai');
  });

  it('คำว่า AI ที่ยืนเดี่ยวยังต้องจับได้ตามปกติ', () => {
    expect(detectLessonTheme('AI ช่วยแนะนำวิดีโอให้เราอย่างไร')).toBe('ai');
    expect(detectLessonTheme('ระบบAIในชีวิตประจำวัน')).toBe('ai');
  });
});
