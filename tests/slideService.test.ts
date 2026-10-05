import { describe, expect, it } from 'vitest';
import { parseMarkdownToSlides, slidesToMarkdown } from '../src/services/slideService';
import type { RichSlide } from '../data/richSlides';

describe('slideService - การแปลง Markdown และ Slide', () => {
  it('แปลง markdown เป็น RichSlide ครบทุกฟิลด์ (image, callout, learnerSummary)', () => {
    const md = `# การแก้ปัญหาอย่างเป็นขั้นตอน
emoji: 🧩
theme: green
layout: split
image: https://example.com/robot.png
imageCaption: ภาพหุ่นยนต์แก้ปัญหา
learnerSummary: ฝึกคิดเป็นลำดับขั้นเพื่อแก้ปัญหาได้เร็วขึ้น
callout: tip | ลองวาดภาพขั้นตอนก่อนลงมือเขียนโปรแกรม

เนื้อหาสำคัญของการคิดเชิงคำนวณ
- ลำดับขั้นตอนที่ชัดเจน
- ตรวจสอบความถูกต้องทุกครั้ง

\`\`\`python
def solve():
    return True
\`\`\`
`;

    const slides = parseMarkdownToSlides(md);
    expect(slides).toHaveLength(1);

    const s = slides[0];
    expect(s.title).toBe('การแก้ปัญหาอย่างเป็นขั้นตอน');
    expect(s.emoji).toBe('🧩');
    expect(s.theme).toBe('green');
    expect(s.layout).toBe('split');
    expect(s.image).toBe('https://example.com/robot.png');
    expect(s.imageCaption).toBe('ภาพหุ่นยนต์แก้ปัญหา');
    expect(s.learnerSummary).toBe('ฝึกคิดเป็นลำดับขั้นเพื่อแก้ปัญหาได้เร็วขึ้น');
    expect(s.callout).toEqual({
      type: 'tip',
      text: 'ลองวาดภาพขั้นตอนก่อนลงมือเขียนโปรแกรม',
    });
    expect(s.bullets).toHaveLength(2);
    expect(s.code?.content).toContain('def solve():');
  });

  it('แปลง RichSlide กลับเป็น markdown และแปลงกลับได้ข้อมูลครบถ้วน (Round-trip)', () => {
    const original: RichSlide[] = [
      {
        title: 'ความปลอดภัยไซเบอร์',
        emoji: '🛡️',
        theme: 'purple',
        layout: 'standard',
        learnerSummary: 'ตั้งรหัสผ่านที่ยากต่อการเดา',
        callout: { type: 'warn', text: 'ห้ามบอกรหัสผ่านแก่ผู้อื่นเด็ดขาด' },
        body: 'การใช้งานอินเทอร์เน็ตอย่างปลอดภัย',
        bullets: [{ text: 'เปิด 2FA ทุกครั้ง' }, { text: 'ไม่คลิกลิงก์แปลกปลอม' }],
      },
    ];

    const md = slidesToMarkdown(original);
    expect(md).toContain('# ความปลอดภัยไซเบอร์');
    expect(md).toContain('theme: purple');
    expect(md).toContain('callout: warn | ห้ามบอกรหัสผ่านแก่ผู้อื่นเด็ดขาด');

    const parsed = parseMarkdownToSlides(md);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].title).toBe('ความปลอดภัยไซเบอร์');
    expect(parsed[0].callout?.type).toBe('warn');
    expect(parsed[0].callout?.text).toBe('ห้ามบอกรหัสผ่านแก่ผู้อื่นเด็ดขาด');
  });
});
