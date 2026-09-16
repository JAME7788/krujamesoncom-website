import { primaryRichSlides } from './richSlidesPrimary';
import { secondaryRichSlides } from './richSlidesSecondary';
import { electiveRichSlides } from './richSlidesElective';
import { detectLessonTheme } from '../utils/lessonTheme';

// ===== Rich Slides — สไลด์เนื้อหาเต็มพร้อมรูปประกอบ =====
// ใช้สำหรับสไลด์ที่ออกแบบมาเฉพาะ (เน้นเข้าใจง่าย มีรูป มีโครงสร้าง)
//
// UnitDetail จะตรวจสอบ richSlides ก่อน → ถ้ามีใช้แทน slides text/image เก่า

export interface RichSlide {
  /** หัวข้อสไลด์ */
  title: string;
  /** Emoji ตัวใหญ่ */
  emoji?: string;
  /** สีพื้น/ธีมของสไลด์ */
  theme?: 'blue' | 'green' | 'orange' | 'purple' | 'pink' | 'yellow' | 'red';
  /** เนื้อหาหลัก (ย่อหน้าเดียว) */
  body?: string;
  /** Bullet points หลัก */
  bullets?: { emoji?: string; text: string; sub?: string }[];
  /** รูปประกอบที่ใช้สิทธิ์ได้เท่านั้น เช่น URL ที่มีสิทธิ์ชัดเจน หรือ asset ที่สร้างเองในโปรเจกต์ */
  image?: string;
  /** คำอธิบายรูป */
  imageCaption?: string;
  /** ภาพประจำบท ใช้เป็นบรรยากาศเบา ๆ ในสไลด์ที่ไม่มีรูปหลัก */
  lessonArt?: string;
  /** ระดับภาษาที่ใช้แสดงคำสรุปสำหรับผู้เรียน */
  learnerLevel?: 'lower-primary' | 'upper-primary' | 'secondary';
  /** ใจความสั้นสำหรับเด็กที่อ่านเนื้อหาหลักแล้วยังไม่มั่นใจ */
  learnerSummary?: string;
  /** ภาพสรุปแบบแผนผังที่สร้างจากประเด็นของสไลด์ */
  visualSummary?: { emoji: string; text: string }[];
  /** กิจกรรมเช็กความเข้าใจสั้น ๆ ซึ่งแทรกทุก 3-4 สไลด์ */
  quickCheck?: {
    question: string;
    choices: string[];
    answer: number;
    feedback: string;
  };
  /** Layout: 'standard' (ข้อความเต็ม), 'split' (ข้อความซ้าย รูปขวา), 'cover' (รูปเต็ม), 'quote' (คำพูดใหญ่) */
  layout?: 'standard' | 'split' | 'cover' | 'quote' | 'comparison';
  /** สำหรับ comparison layout */
  compareLeft?: { title: string; emoji: string; items: string[]; color?: string };
  compareRight?: { title: string; emoji: string; items: string[]; color?: string };
  /** กล่องเสริม (Did you know / Tip / Warning) */
  callout?: { type: 'tip' | 'warn' | 'fun' | 'quote'; emoji?: string; text: string };
  /** ตัวอย่าง code (สำหรับ programming) */
  code?: { lang?: string; content: string };
  /** คำอธิบายสำหรับครูและเด็ก ใช้ขยายความโดยไม่ยัดข้อความยาวไว้ใน bullet */
  teachingNote?: {
    explain: string;
    example: string;
    prompt: string;
    steps?: string[];
    check?: string;
  };
}

// Unsplash CDN ฟรี (ไม่ต้อง API key)
const img = (id: string, w = 800) => `https://images.unsplash.com/${id}?w=${w}&q=80&auto=format&fit=crop`;

type LessonVisual = {
  image: string;
  caption: string;
};

const lessonVisuals = {
  coding: {
    image: '/media/lessons/curriculum-coding.webp',
    caption: 'ฝึกคิดเป็นขั้นตอนและสร้างคำสั่งให้คอมพิวเตอร์ทำงาน',
  },
  digitalLiteracy: {
    image: '/media/lessons/curriculum-digital-literacy.webp',
    caption: 'เรียนรู้ข้อมูล อินเทอร์เน็ต และความปลอดภัยอย่างรับผิดชอบ',
  },
  computerSkills: {
    image: '/media/lessons/curriculum-computer-skills.webp',
    caption: 'ฝึกใช้คอมพิวเตอร์และเครื่องมือดิจิทัลเพื่อสร้างผลงาน',
  },
  designEngineering: {
    image: '/media/lessons/curriculum-design-engineering.webp',
    caption: 'ร่วมกันออกแบบ ทดลอง และพัฒนาวิธีแก้ปัญหา',
  },
  electronics: {
    image: '/media/lessons/curriculum-electronics.webp',
    caption: 'ทดลองวงจรและอุปกรณ์อิเล็กทรอนิกส์อย่างปลอดภัย',
  },
  arduino: {
    image: '/media/lessons/curriculum-arduino.webp',
    caption: 'สร้างโครงงานอัจฉริยะด้วยบอร์ด เซนเซอร์ และโปรแกรม',
  },
} satisfies Record<string, LessonVisual>;

const inferLessonVisual = (key: string, deck: RichSlide[]): LessonVisual => {
  const cover = deck.find((slide) => slide.layout === 'cover') || deck[0];
  const text = `${key} ${cover?.title || ''} ${cover?.body || ''}`.toLowerCase();

  if (key.startsWith('arduino-basic_')) return lessonVisuals.arduino;
  if (key.startsWith('electronics-basic_')) return lessonVisuals.electronics;
  if (key.includes('-design_') || /วิศวกรรม|ออกแบบเชิง|วัสดุ|ชุมชน|อาชีพ/.test(text)) {
    return lessonVisuals.designEngineering;
  }
  if (/เอกสาร|ไฟล์|โฟลเดอร์|เก็บงาน|โปรแกรมให้ถูก|ส่วนประกอบของคอมพิวเตอร์|คอมพิวเตอร์ทำงาน|ฮาร์ดแวร์|ซอฟต์แวร์/.test(text)) {
    return lessonVisuals.computerSkills;
  }
  if (/อินเทอร์เน็ต|ข้อมูล|ข่าว|สื่อ|ดิจิทัล|ปลอดภัย|จริยธรรม|กฎหมาย|ค้นหา|ความเป็นส่วนตัว/.test(text)) {
    return lessonVisuals.digitalLiteracy;
  }
  return lessonVisuals.coding;
};

type DetailKind = 'ai' | 'internet' | 'safety' | 'data' | 'coding' | 'file'
  | 'problem' | 'design' | 'electronics' | 'arduino' | 'default';

type DetailPreset = {
  example: string;
  steps: [string, string, string];
};

const detailPresets: Record<DetailKind, DetailPreset> = {
  ai: {
    example: 'ลองพิจารณาระบบแนะนำวิดีโอหรือผู้ช่วยตอบคำถาม แล้วแยกให้ได้ว่าส่วนใดเป็นข้อมูลนำเข้า การประมวลผล และผลลัพธ์',
    steps: ['สังเกตว่า AI รับข้อมูลอะไร', 'อธิบายว่า AI นำข้อมูลไปใช้อย่างไร', 'ตรวจสอบผลลัพธ์ก่อนเชื่อหรือนำไปใช้'],
  },
  internet: {
    example: 'ค้นข้อมูลเรื่องเดียวกันจากเว็บไซต์โรงเรียน หน่วยงานรัฐ และโพสต์ทั่วไป แล้วเปรียบเทียบผู้เขียน วันที่ และหลักฐาน',
    steps: ['กำหนดคำค้นให้ตรงคำถาม', 'เปิดอย่างน้อยสองแหล่งและตรวจเจ้าของข้อมูล', 'สรุปด้วยภาษาของตนเองพร้อมบอกที่มา'],
  },
  safety: {
    example: 'เมื่อได้รับข้อความขอรหัสผ่านหรือข้อมูลส่วนตัว ให้หยุด ตรวจชื่อผู้ส่ง และปรึกษาครูก่อนกดลิงก์หรือตอบกลับ',
    steps: ['หยุดก่อนคลิกหรือส่งข้อมูล', 'ตรวจผู้ส่ง ลิงก์ และสิ่งที่ข้อความร้องขอ', 'เลือกการกระทำที่ปลอดภัยและอธิบายเหตุผล'],
  },
  data: {
    example: 'สำรวจสิ่งที่เพื่อนในห้องสนใจ บันทึกคำตอบเป็นหมวดหมู่ แล้วใช้ตารางหรือกราฟช่วยหาข้อสรุป',
    steps: ['ตั้งคำถามที่ต้องการหาคำตอบ', 'รวบรวมและจัดข้อมูลให้เป็นหมวดหมู่', 'อ่านหลักฐานแล้วสรุปโดยไม่เดาเกินข้อมูล'],
  },
  coding: {
    example: 'ให้เพื่อนทำหน้าที่เป็นหุ่นยนต์ แล้วใช้คำสั่งทีละขั้นพาเดินไปยังเป้าหมาย จากนั้นแก้คำสั่งเมื่อไปผิดทาง',
    steps: ['ระบุเป้าหมายและข้อมูลที่ต้องใช้', 'เรียงคำสั่งหรือเขียนโปรแกรมตามลำดับ', 'ทดลอง ตรวจผล และแก้จุดที่ยังไม่ถูกต้อง'],
  },
  file: {
    example: 'สร้างโฟลเดอร์งานรายวิชา ตั้งชื่อไฟล์ให้บอกเนื้อหาและวันที่ แล้วทดลองค้นหา เปิด แก้ไข และบันทึกฉบับใหม่',
    steps: ['เลือกเครื่องมือให้เหมาะกับชิ้นงาน', 'สร้างงานและจัดรูปแบบให้อ่านง่าย', 'ตั้งชื่อ จัดเก็บ และเปิดตรวจไฟล์อีกครั้ง'],
  },
  problem: {
    example: 'เลือกปัญหาใกล้ตัว เช่น ลืมอุปกรณ์เรียน แล้วแยกสาเหตุ คิดหลายวิธี ทดลองหนึ่งวิธี และดูว่าแก้ได้จริงหรือไม่',
    steps: ['บอกปัญหาและเป้าหมายให้ชัด', 'แยกงานใหญ่เป็นงานย่อยและเลือกวิธี', 'ลงมือ ตรวจผล และปรับวิธีจากสิ่งที่พบ'],
  },
  design: {
    example: 'ออกแบบชิ้นงานช่วยจัดโต๊ะเรียน โดยสำรวจผู้ใช้ ร่างหลายแบบ เลือกวัสดุ สร้างต้นแบบ และรับข้อเสนอแนะก่อนปรับปรุง',
    steps: ['ศึกษาผู้ใช้ ปัญหา และข้อจำกัด', 'ร่างแนวคิดพร้อมเลือกวัสดุและเครื่องมือ', 'สร้างต้นแบบ ทดสอบ และปรับจากหลักฐาน'],
  },
  electronics: {
    example: 'ต่อวงจรแรงดันต่ำจากแบตเตอรี่ผ่านสวิตช์และตัวต้านทานไปยัง LED แล้วใช้มัลติมิเตอร์ตรวจค่าก่อนสรุปผล',
    steps: ['อ่านผังวงจรและตรวจขั้วอุปกรณ์', 'ตัดแหล่งจ่ายก่อนต่อหรือแก้วงจร', 'จ่ายไฟ วัดค่า บันทึกผล และหาสาเหตุเมื่อวงจรไม่ทำงาน'],
  },
  arduino: {
    example: 'สร้างระบบรดน้ำต้นไม้จำลอง ให้เซนเซอร์อ่านค่าความชื้น แล้วสั่ง LED หรือมอเตอร์ตอบสนองตามเงื่อนไขที่กำหนด',
    steps: ['กำหนดอินพุต กระบวนการ และเอาต์พุต', 'ต่อวงจรให้ตรงขาแล้วเขียนโปรแกรมทีละส่วน', 'ทดสอบค่าเซนเซอร์ แก้ข้อผิดพลาด และบันทึกผล'],
  },
  default: {
    example: 'เชื่อมแนวคิดกับงานในห้องเรียนหนึ่งงาน อธิบายว่าจะใช้เมื่อใด ใช้อย่างไร และผลที่ดีควรมีลักษณะใด',
    steps: ['อ่านเป้าหมายและจับคำสำคัญ', 'ทดลองทำจากตัวอย่างหนึ่งกรณี', 'อธิบายสิ่งที่เรียนรู้ด้วยคำของตนเอง'],
  },
};

const stripInlineMarkdown = (text: string): string => text
  .replace(/\*\*|__|`|\*/g, '')
  .replace(/\s+/g, ' ')
  .trim();

const resolveDetailKind = (key: string, slide: RichSlide): DetailKind => {
  if (key.startsWith('arduino-basic_')) return 'arduino';
  if (key.startsWith('electronics-basic_')) return 'electronics';
  if (key.includes('-design_')) return 'design';
  if (['p1_1', 'p2_3', 'p3_5', 'p4_4', 'm2-cs_3'].includes(key)) return 'file';

  const theme = detectLessonTheme(`${slide.title} ${slide.body || ''}`);
  return theme === 'default' ? 'default' : theme;
};

export const getLearnerLevel = (gradeId: string): 'lower-primary' | 'upper-primary' | 'secondary' => {
  if (/^p[1-3]/.test(gradeId)) return 'lower-primary';
  if (/^p[4-6]/.test(gradeId)) return 'upper-primary';
  return 'secondary';
};

export const buildLearnerSummary = (
  slide: RichSlide,
  _level: 'lower-primary' | 'upper-primary' | 'secondary',
): string => {
  const cleanTitle = stripInlineMarkdown(slide.title.replace(slide.emoji || '', ''));
  if (slide.body) {
    const cleanBody = stripInlineMarkdown(slide.body);
    if (cleanBody.length <= 90) return cleanBody;
    const firstSentence = cleanBody.split(/[.!?]| — | —/)[0].trim();
    if (firstSentence.length > 5 && firstSentence.length <= 90) return firstSentence;
    return cleanBody.slice(0, 88) + '...';
  }
  if (slide.bullets && slide.bullets.length > 0) {
    const firstBullet = stripInlineMarkdown(slide.bullets[0].text);
    const summary = `${cleanTitle}: ${firstBullet}`;
    if (summary.length <= 90) return summary;
    return summary.slice(0, 88) + '...';
  }
  const fallback = `ทำความเข้าใจและฝึกปฏิบัติเรื่อง ${cleanTitle}`;
  return fallback.length <= 90 ? fallback : fallback.slice(0, 88) + '...';
};

export const buildVisualSummary = (slide: RichSlide): { emoji: string; text: string }[] => {
  if (slide.bullets && slide.bullets.length > 0) {
    return slide.bullets.slice(0, 4).map((b) => ({
      emoji: b.emoji || '📌',
      text: stripInlineMarkdown(b.text).slice(0, 30),
    }));
  }
  const cleanTitle = stripInlineMarkdown(slide.title.replace(slide.emoji || '', ''));
  return [
    { emoji: slide.emoji || '💡', text: cleanTitle.slice(0, 30) },
    { emoji: '✅', text: 'เข้าใจหลักการสำคัญ' },
  ];
};

export const buildQuickCheck = (_key: string, slide: RichSlide, index: number) => {
  if ((index + 1) % 4 !== 0) return undefined;
  const cleanTitle = stripInlineMarkdown(slide.title.replace(slide.emoji || '', ''));
  return {
    question: `คำถามชวนคิด: ข้อใดสรุปสาระสำคัญของ "${cleanTitle}" ได้ถูกต้องที่สุด?`,
    choices: [
      `ทำความเข้าใจหลักการและนำไปประยุกต์ใช้กับ ${cleanTitle}`,
      `ท่องจำคำศัพท์โดยไม่ต้องลงมือทดลองจริง`,
      `ข้ามขั้นตอนนี้ไปทำขั้นตอนถัดไปทันที`,
    ],
    answer: 0,
    feedback: `ยอดเยี่ยม! การเรียนรู้เรื่อง ${cleanTitle} ต้องอาศัยความเข้าใจและการลงมือปฏิบัติจริง`,
  };
};

const buildTeachingNote = (key: string, slide: RichSlide, index: number): NonNullable<RichSlide['teachingNote']> => {
  const title = stripInlineMarkdown(slide.title.replace(slide.emoji || '', ''));
  const body = stripInlineMarkdown(slide.body || '');
  const points = (slide.bullets || [])
    .slice(0, 4)
    .map((bullet) => stripInlineMarkdown(`${bullet.text}${bullet.sub ? `: ${bullet.sub}` : ''}`));
  const kind = resolveDetailKind(key, slide);
  const preset = detailPresets[kind];
  const isLowerPrimary = /^p[1-3]_/.test(key);
  const pointText = points.length > 0
    ? ` ประเด็นที่ควรเชื่อมโยงเข้าด้วยกันคือ ${points.join(' • ')}`
    : '';
  const explain = body
    ? `${body}${pointText}`
    : `สไลด์นี้ขยายความเรื่อง “${title}” โดยให้ผู้เรียนเข้าใจทั้งความหมาย วิธีใช้ และเหตุผลที่แนวคิดนี้สำคัญ${pointText}`;
  const prompt = slide.layout === 'comparison'
    ? 'สองแนวทางในสไลด์ต่างกันตรงไหน และสถานการณ์ใดควรเลือกแต่ละแนวทาง เพราะอะไร'
    : slide.code
      ? 'ก่อนทดลองรัน ผู้เรียนคาดว่าคำสั่งจะให้ผลอย่างไร และถ้าเปลี่ยนหนึ่งคำสั่งผลลัพธ์จะเปลี่ยนตรงไหน'
      : isLowerPrimary
        ? `ลองเล่าเรื่อง “${title}” ด้วยคำของตนเอง แล้วยกตัวอย่างใกล้ตัวอีกหนึ่งตัวอย่าง`
        : `ถ้าเงื่อนไขของเรื่อง “${title}” เปลี่ยนไปหนึ่งอย่าง ผู้เรียนจะปรับวิธีคิดหรือวิธีทำอย่างไร พร้อมอธิบายเหตุผล`;

  const example = `ตัวอย่างการเรียนรู้เรื่อง “${title}” (ขั้นตอนที่ ${index + 1}): ${preset.example}`;

  return {
    explain,
    example,
    prompt,
    steps: [...preset.steps],
    check: `ผ่านเมื่อผู้เรียนอธิบาย “${title}” ได้ถูกต้อง ยกตัวอย่างได้อย่างน้อย 1 กรณี และทำตามขั้นตอนโดยบอกเหตุผลของการตัดสินใจได้${index === 0 ? ' ก่อนเริ่มบทให้ใช้คำตอบนี้สำรวจความรู้เดิมของผู้เรียน' : ''}`,
  };
};

// ===========================================================================
// AI ป.1-3 — รู้จัก AI เพื่อนใหม่
// ===========================================================================
const ai_p13_unit1: RichSlide[] = [
  {
    title: '🤖 รู้จัก AI เพื่อนใหม่ของเรา!',
    emoji: '🤖',
    theme: 'purple',
    layout: 'cover',
    body: 'วันนี้เราจะมาเรียนรู้เรื่อง AI กัน — เพื่อนคนใหม่ที่ฉลาดและคอยช่วยเหลือเรา',
    image: img('photo-1531746790731-6c087fecd65a'),
    imageCaption: 'AI ปัญญาประดิษฐ์ — เพื่อนช่วยทำงานในยุคใหม่',
  },
  {
    title: 'AI คืออะไร?',
    emoji: '💡',
    theme: 'blue',
    layout: 'standard',
    body: 'AI ย่อมาจาก Artificial Intelligence แปลว่า "ปัญญาประดิษฐ์"',
    bullets: [
      { emoji: '🧠', text: 'ปัญญา = ความฉลาด' },
      { emoji: '🔧', text: 'ประดิษฐ์ = สร้างขึ้น' },
      { emoji: '✨', text: 'รวมกัน = คอมพิวเตอร์ที่คิดและเรียนรู้ได้' },
    ],
    callout: { type: 'tip', emoji: '💬', text: 'AI ไม่ใช่หุ่นยนต์เสมอไป — อาจอยู่ในแอปบนโทรศัพท์ของพ่อแม่!' },
  },
  {
    title: 'AI อยู่รอบตัวเรา',
    emoji: '🌍',
    theme: 'green',
    layout: 'standard',
    body: 'ลองดูสิ — AI อยู่ในของใช้รอบตัวเราเยอะมาก!',
    bullets: [
      { emoji: '🗣️', text: 'ผู้ช่วยเสียง', sub: 'Siri, Google Assistant, Alexa' },
      { emoji: '📷', text: 'กล้องที่จำหน้าได้', sub: 'ปลดล็อกโทรศัพท์ด้วยใบหน้า' },
      { emoji: '🎵', text: 'แอปแนะนำเพลง', sub: 'YouTube, TikTok, Spotify' },
      { emoji: '🎮', text: 'ตัวละครในเกม', sub: 'NPC ที่เล่นกับเราในเกม' },
      { emoji: '📺', text: 'แนะนำหนัง', sub: 'Netflix รู้ว่าเราชอบดูอะไร' },
    ],
    image: img('photo-1535378917042-10a22c95931a', 600),
    imageCaption: 'อุปกรณ์ที่มี AI ในชีวิตประจำวัน',
  },
  {
    title: 'AI vs มนุษย์ — ใครเก่งกว่ากัน?',
    theme: 'orange',
    layout: 'comparison',
    compareLeft: {
      title: 'AI เก่งเรื่อง',
      emoji: '🤖',
      items: [
        '⚡ คำนวณเร็วมากๆ',
        '💾 จำข้อมูลเยอะมาก',
        '🔄 ทำงานได้ตลอด 24 ชม.',
        '🎯 ทำซ้ำๆ โดยไม่เบื่อ',
      ],
      color: '#6366f1',
    },
    compareRight: {
      title: 'มนุษย์เก่งเรื่อง',
      emoji: '👧',
      items: [
        '💝 มีความรู้สึก',
        '🎨 คิดสร้างสรรค์',
        '🤔 เข้าใจอารมณ์',
        '👥 ตัดสินใจเรื่องคุณธรรม',
      ],
      color: '#ec4899',
    },
    callout: { type: 'fun', emoji: '🤝', text: 'AI ช่วยมนุษย์ ไม่ใช่แทนที่มนุษย์! เราใช้ AI ทำงานหนักๆ จะได้มีเวลาทำสิ่งที่ชอบ' },
  },
  {
    title: 'สนุกกับ AI ไปด้วยกัน',
    emoji: '🎉',
    theme: 'pink',
    layout: 'standard',
    body: 'ลองเล่นกับ AI ของจริงดูสิ — ไม่ต้องล็อกอิน เปิดได้เลย!',
    bullets: [
      { emoji: '🎨', text: 'Quick, Draw!', sub: 'วาดรูปแล้ว AI ทาย — ลองวาดแมวดูสิ' },
      { emoji: '🌊', text: 'AI for Oceans', sub: 'สอน AI คัดแยกขยะในทะเล' },
      { emoji: '🧠', text: 'Teachable Machine', sub: 'สร้าง AI ของเราเอง!' },
    ],
    callout: { type: 'tip', emoji: '👆', text: 'เลื่อนไปแท็บ "กิจกรรมสนุก" ด้านบน เพื่อกดเข้าเล่นได้เลย!' },
  },
];

const ai_p13_unit2: RichSlide[] = [
  {
    title: '🧠 AI เรียนรู้ได้อย่างไร?',
    emoji: '🧠',
    theme: 'blue',
    layout: 'cover',
    body: 'AI ไม่ได้เก่งมาตั้งแต่เกิด — มันต้องเรียนรู้จากตัวอย่าง เหมือนเราเรียน ก ข ค',
    image: img('photo-1620712943543-bcc4688e7485'),
  },
  {
    title: 'AI เรียนรู้จากอะไร?',
    emoji: '📚',
    theme: 'green',
    layout: 'standard',
    body: 'AI เรียนจาก "ข้อมูล" และ "ตัวอย่าง" จำนวนมาก',
    bullets: [
      { emoji: '👀', text: 'เห็นตัวอย่างเยอะๆ', sub: 'เช่น ดูรูปแมว 1,000 รูปเพื่อเรียนรู้ว่า "นี่คือแมว"' },
      { emoji: '🔁', text: 'ทำซ้ำหลายๆ ครั้ง', sub: 'ฝึกแล้วฝึกอีกจนแม่นยำ' },
      { emoji: '✅', text: 'มีคนบอกว่าถูกหรือผิด', sub: 'ถ้าทำผิดก็ปรับปรุงใหม่' },
    ],
    callout: { type: 'fun', emoji: '👶', text: 'เหมือนน้องเล็กๆ ที่ดูแม่ทำอาหารเยอะๆ แล้วเริ่มจำได้ว่าทำยังไง!' },
  },
  {
    title: 'ขั้นตอนการสอน AI',
    emoji: '🎓',
    theme: 'orange',
    layout: 'standard',
    bullets: [
      { emoji: '1️⃣', text: 'เก็บตัวอย่าง', sub: 'รูปแมว 1,000 รูป + รูปหมา 1,000 รูป' },
      { emoji: '2️⃣', text: 'ป้ายฉลากให้', sub: 'บอก AI ว่ารูปไหน "แมว" รูปไหน "หมา"' },
      { emoji: '3️⃣', text: 'AI ฝึกซ้อม', sub: 'หาลักษณะร่วม เช่น หู หาง ขน ตา' },
      { emoji: '4️⃣', text: 'ทดสอบ', sub: 'ให้รูปใหม่ที่ไม่เคยเห็น → ดู AI ทายถูกไหม' },
      { emoji: '5️⃣', text: 'ปรับปรุง', sub: 'ถ้าผิด → เพิ่มข้อมูล → ฝึกใหม่' },
    ],
    image: img('photo-1488751045188-3c55bbf9a3fa', 500),
    imageCaption: 'AI ดูรูปแมวจำนวนมาก เพื่อเรียนรู้ลักษณะร่วม',
  },
  {
    title: 'ลองสอน AI ด้วยตัวเองกัน!',
    emoji: '🎯',
    theme: 'purple',
    layout: 'split',
    body: 'Teachable Machine คือเครื่องมือฟรีที่ให้เราสอน AI ได้ใน 5 นาที!',
    bullets: [
      { emoji: '📷', text: 'เปิดกล้องเว็บแคม' },
      { emoji: '👋', text: 'ถ่ายท่ายกมือ 30 รูป' },
      { emoji: '👍', text: 'ถ่ายท่าชูนิ้วโป้ง 30 รูป' },
      { emoji: '⚡', text: 'กด Train Model — รอ 30 วินาที' },
      { emoji: '🎉', text: 'AI พร้อมแยกท่าของเราแล้ว!' },
    ],
    image: img('photo-1485827404703-89b55fcc595e'),
  },
  {
    title: 'ทำไมต้องใช้ตัวอย่างเยอะ?',
    emoji: '📊',
    theme: 'pink',
    layout: 'standard',
    bullets: [
      { emoji: '😟', text: 'ตัวอย่างน้อย → AI ทายมั่ว', sub: 'ดูแมว 5 รูป → คงเดาแย่' },
      { emoji: '😊', text: 'ตัวอย่างเยอะ → AI แม่นยำ', sub: 'ดูแมว 1,000 รูป → เก่งแล้ว!' },
      { emoji: '🌈', text: 'ตัวอย่างหลากหลาย → AI ฉลาดขึ้น', sub: 'แมวลายส้ม ขาว ดำ ลายสลิด ครบ' },
    ],
    callout: { type: 'warn', emoji: '⚠️', text: 'ถ้าให้ดูแต่แมวสีดำ → AI อาจจะคิดว่าแมวต้องเป็นสีดำเท่านั้น!' },
  },
];

const ai_p13_unit3: RichSlide[] = [
  {
    title: '🌍 AI กับเรา — ใช้ให้เป็น ใช้ให้ดี',
    emoji: '🌍',
    theme: 'green',
    layout: 'cover',
    body: 'AI ช่วยเราทำอะไรได้บ้าง? และเราต้องระวังอะไรเมื่อใช้ AI?',
    image: img('photo-1485827404703-89b55fcc595e'),
  },
  {
    title: 'AI ช่วยเหลือเราในชีวิตประจำวัน',
    emoji: '💪',
    theme: 'blue',
    layout: 'standard',
    bullets: [
      { emoji: '🏥', text: 'ช่วยหมอดูภาพเอ็กซเรย์', sub: 'เจอโรคที่คนอาจมองไม่เห็น' },
      { emoji: '🌱', text: 'ช่วยชาวสวนดูแลพืช', sub: 'บอกว่าพืชใดน้ำพอ ใดต้องรดน้ำ' },
      { emoji: '🌐', text: 'ช่วยแปลภาษา', sub: 'คุยกับคนต่างชาติได้ง่าย' },
      { emoji: '♿', text: 'ช่วยคนพิการ', sub: 'คนตาบอดรู้ว่ามีอะไรในรูป' },
      { emoji: '🚨', text: 'ช่วยกู้ภัย', sub: 'ค้นหาคนหายในซากตึก' },
    ],
  },
  {
    title: 'ข้อควรระวังในการใช้ AI',
    emoji: '⚠️',
    theme: 'red',
    layout: 'standard',
    bullets: [
      { emoji: '🔒', text: 'อย่าบอกข้อมูลส่วนตัวกับ AI', sub: 'ที่อยู่ เบอร์โทร รูปบ้าน — เก็บเป็นความลับ' },
      { emoji: '🤔', text: 'AI อาจตอบผิดได้', sub: 'อย่าเชื่อทุกอย่างที่ AI พูด' },
      { emoji: '👨‍👩‍👧', text: 'ถามผู้ใหญ่ก่อนใช้', sub: 'ถ้าไม่แน่ใจ บอกพ่อแม่หรือครู' },
      { emoji: '📚', text: 'ใช้ AI ช่วย ไม่ใช่ทำแทน', sub: 'การบ้านยังต้องคิดเอง — AI ช่วยตรวจ' },
    ],
    callout: { type: 'warn', emoji: '🚨', text: 'จำไว้: ถ้า AI ขอข้อมูลแปลกๆ ให้ปิดทันที แล้วบอกผู้ใหญ่!' },
  },
  {
    title: 'มารยาทการพูดคุยกับ AI',
    emoji: '🙏',
    theme: 'pink',
    layout: 'standard',
    body: 'แม้ AI ไม่มีความรู้สึก แต่การพูดสุภาพช่วยให้เราเป็นคนนิสัยดี',
    bullets: [
      { emoji: '✅', text: 'พูดสุภาพ ไม่ด่า', sub: 'พูดดีๆ เหมือนคุยกับเพื่อน' },
      { emoji: '✅', text: 'บอกเป้าหมายให้ชัด', sub: '"ช่วยอธิบาย ก ข ค" ดีกว่า "บอกหน่อย"' },
      { emoji: '❌', text: 'อย่าหลอก AI ให้ทำผิด', sub: 'อย่าให้ AI ช่วยทำสิ่งไม่ดี' },
      { emoji: '✅', text: 'พูดขอบคุณก็ได้', sub: 'ฝึกนิสัยดี ใช้กับคนจริงได้' },
    ],
  },
  {
    title: 'อนาคตของเรากับ AI',
    emoji: '🚀',
    theme: 'purple',
    layout: 'standard',
    body: 'ในอนาคต AI จะอยู่กับเรามากขึ้น — เราจะเก่งและสนุกขึ้น!',
    bullets: [
      { emoji: '🚗', text: 'รถขับเองได้', sub: 'พ่อแม่ไม่ต้องเหนื่อยขับ' },
      { emoji: '👨‍⚕️', text: 'หุ่นยนต์ช่วยหมอผ่าตัด', sub: 'แม่นยำกว่าเดิม' },
      { emoji: '🏫', text: 'ครู AI ช่วยติว', sub: 'เรียนได้ทุกเวลา' },
      { emoji: '🌳', text: 'AI ช่วยรักษาสิ่งแวดล้อม', sub: 'ปลูกป่า แยกขยะ' },
    ],
    callout: { type: 'fun', emoji: '🌟', text: 'เด็กที่เรียน AI ตั้งแต่ตอนนี้ — โตขึ้นจะสร้างโลกใหม่ได้!' },
  },
];

// ===========================================================================
// AI ป.4-6 — AI ฉลาดยังไง?
// ===========================================================================
const ai_p46_unit1: RichSlide[] = [
  {
    title: '🤖 AI กับ Machine Learning เบื้องต้น',
    emoji: '🤖',
    theme: 'blue',
    layout: 'cover',
    body: 'ทุกครั้งที่ Netflix แนะนำหนังที่เราชอบ หรือ TikTok โชว์คลิปที่เรากำลังสนใจ — นั่นคือ Machine Learning ทำงานอยู่!',
    image: img('photo-1488229297570-58520851e868'),
  },
  {
    title: 'AI ≠ ML?',
    emoji: '🤔',
    theme: 'orange',
    layout: 'comparison',
    compareLeft: {
      title: 'AI (ปัญญาประดิษฐ์)',
      emoji: '🌟',
      items: [
        'ภาพรวม — คอมที่ฉลาด',
        'รวมเทคโนโลยีหลายอย่าง',
        'เป้าหมาย: ทำงานเหมือนคน',
      ],
      color: '#6366f1',
    },
    compareRight: {
      title: 'ML (Machine Learning)',
      emoji: '📊',
      items: [
        'วิธีหนึ่งของ AI',
        'เรียนรู้จากข้อมูล',
        'เป็นเครื่องมือสำคัญของ AI',
      ],
      color: '#22c55e',
    },
    callout: { type: 'tip', emoji: '💡', text: 'ML เป็นส่วนหนึ่งของ AI — เหมือนรถยนต์เป็นส่วนหนึ่งของยานพาหนะ' },
  },
  {
    title: 'ประเภทของ Machine Learning',
    emoji: '📚',
    theme: 'purple',
    layout: 'standard',
    bullets: [
      {
        emoji: '👨‍🏫',
        text: 'Supervised Learning (มีครูสอน)',
        sub: 'ให้ตัวอย่างพร้อมคำตอบ → AI เรียน เช่น รูปแมว+ป้าย "แมว"',
      },
      {
        emoji: '🔍',
        text: 'Unsupervised Learning (เรียนเอง)',
        sub: 'ให้ข้อมูลโดยไม่บอกคำตอบ → AI หาแพทเทิร์นเอง',
      },
      {
        emoji: '🎮',
        text: 'Reinforcement Learning (ลองผิดลองถูก)',
        sub: 'AI ลองทำแล้วได้รางวัล/โทษ → เรียนรู้ว่าทำอะไรดี',
      },
    ],
  },
  {
    title: 'ML ในชีวิตจริง',
    emoji: '🌐',
    theme: 'green',
    layout: 'standard',
    bullets: [
      { emoji: '📺', text: 'Netflix แนะนำหนัง', sub: 'ดูประวัติเรา → ทายว่าน่าจะชอบเรื่องไหน' },
      { emoji: '📱', text: 'TikTok เลือกคลิป', sub: 'จำว่าเราดูคลิปไหนนานๆ → โชว์คล้ายๆ' },
      { emoji: '📧', text: 'Gmail กรองสแปม', sub: 'เรียนรู้ว่าอีเมลขยะมีลักษณะยังไง' },
      { emoji: '🗺️', text: 'Google Maps คาดเดาการจราจร', sub: 'ดูข้อมูลรถจริง → บอกว่าจะติดไหม' },
      { emoji: '🤳', text: 'จดจำใบหน้าปลดล็อกมือถือ', sub: 'เรียนหน้าเรา → ปลดล็อกได้เร็ว' },
    ],
    callout: { type: 'fun', emoji: '🎯', text: 'ลองสังเกตในชีวิตประจำวัน — มีอะไรที่ใช้ ML บ้าง?' },
  },
  {
    title: 'ข้อมูลคือสิ่งสำคัญที่สุด',
    emoji: '💎',
    theme: 'yellow',
    layout: 'standard',
    body: 'ML จะดีหรือไม่ดี ขึ้นอยู่กับ "ข้อมูล" ที่ใช้สอน',
    bullets: [
      { emoji: '✅', text: 'ข้อมูลเยอะ — AI แม่นยำ' },
      { emoji: '✅', text: 'ข้อมูลหลากหลาย — AI ครอบคลุม' },
      { emoji: '✅', text: 'ข้อมูลถูกต้อง — AI เชื่อถือได้' },
      { emoji: '❌', text: 'ข้อมูลผิด — AI ก็ผิดตาม' },
      { emoji: '❌', text: 'ข้อมูลลำเอียง — AI ก็ลำเอียง' },
    ],
    callout: { type: 'quote', text: '"Garbage in, Garbage out" — ข้อมูลขยะเข้า → AI ขยะออก' },
  },
];

const ai_p46_unit2: RichSlide[] = [
  {
    title: '🔬 สร้างโมเดล AI ของตัวเอง',
    emoji: '🔬',
    theme: 'purple',
    layout: 'cover',
    body: 'วันนี้เราจะสร้าง AI ที่จำแนกของได้ ด้วยตัวเอง — ใช้แค่เว็บเบราว์เซอร์!',
    image: img('photo-1677442136019-21780ecad995'),
  },
  {
    title: 'Teachable Machine — เครื่องมือสร้าง AI',
    emoji: '🛠️',
    theme: 'blue',
    layout: 'standard',
    body: 'ของฟรีจาก Google ไม่ต้องเขียนโค้ด สร้างโมเดล AI ได้ใน 5 นาที',
    bullets: [
      { emoji: '🖼️', text: 'Image Project — จำแนกรูปภาพ' },
      { emoji: '🎤', text: 'Audio Project — จำแนกเสียง' },
      { emoji: '🤸', text: 'Pose Project — จำแนกท่าทาง' },
    ],
    callout: { type: 'tip', emoji: '🌐', text: 'เปิดที่ teachablemachine.withgoogle.com — ไม่ต้อง login!' },
  },
  {
    title: 'ขั้นตอนสร้างโมเดล AI',
    emoji: '🎯',
    theme: 'green',
    layout: 'standard',
    bullets: [
      { emoji: '1️⃣', text: 'Collect Data — เก็บข้อมูล', sub: 'ถ่ายตัวอย่าง 30+ ใบต่อคลาส' },
      { emoji: '2️⃣', text: 'Train Model — ฝึกสอน', sub: 'กดปุ่ม Train รอ 30-60 วินาที' },
      { emoji: '3️⃣', text: 'Test — ทดสอบ', sub: 'แสดงสิ่งใหม่ → ดู AI ทาย' },
      { emoji: '4️⃣', text: 'Improve — ปรับปรุง', sub: 'ถ้าทายผิด → เพิ่มข้อมูล แล้ว Train ใหม่' },
      { emoji: '5️⃣', text: 'Export — ส่งออก', sub: 'นำโมเดลไปใช้ในเว็บ/แอปอื่นได้' },
    ],
    image: img('photo-1485827404703-89b55fcc595e', 600),
  },
  {
    title: 'Project: AI จำแนกอารมณ์',
    emoji: '😊',
    theme: 'pink',
    layout: 'standard',
    body: 'มาสร้าง AI ที่จำแนก 3 อารมณ์ได้ ผ่านสีหน้าของเรา!',
    bullets: [
      { emoji: '😊', text: 'Happy — ถ่าย 30 รูปยิ้ม' },
      { emoji: '😢', text: 'Sad — ถ่าย 30 รูปเศร้า' },
      { emoji: '😮', text: 'Surprised — ถ่าย 30 รูปตกใจ' },
      { emoji: '⚡', text: 'Train แล้วทดสอบ — สลับสีหน้าดู AI ทายถูกไหม' },
    ],
    callout: { type: 'fun', emoji: '🎉', text: 'ทำเสร็จแล้วลองเอาให้เพื่อนทดสอบ — ใช้ AI ของเราเองนะ!' },
  },
  {
    title: 'ทำไมโมเดลของเราต้องดี?',
    emoji: '💯',
    theme: 'orange',
    layout: 'standard',
    bullets: [
      { emoji: '🎯', text: 'ข้อมูลเยอะ', sub: 'ขั้นต่ำ 30 ตัวอย่าง/คลาส — ยิ่งมาก ยิ่งแม่น' },
      { emoji: '🌈', text: 'ข้อมูลหลากหลาย', sub: 'มุมมองต่างๆ แสงต่างๆ พื้นหลังต่างๆ' },
      { emoji: '⚖️', text: 'ข้อมูลสมดุล', sub: 'แต่ละคลาสมีจำนวนใกล้กัน' },
      { emoji: '🔄', text: 'ทดสอบเสมอ', sub: 'อย่าเชื่อแค่หน้าจอ Training' },
    ],
  },
];

// ===========================================================================
// AI ม.1-3 — AI ขั้นปฏิบัติ
// ===========================================================================
const ai_m13_unit1: RichSlide[] = [
  {
    title: '🏗️ AI Foundations — รากฐานปัญญาประดิษฐ์',
    emoji: '🏗️',
    theme: 'blue',
    layout: 'cover',
    body: 'จาก Alan Turing ปี 1950 ถึง ChatGPT ปี 2022 — มาดูว่า AI พัฒนามาอย่างไร',
    image: img('photo-1620712943543-bcc4688e7485'),
  },
  {
    title: 'ประวัติ AI โดยย่อ',
    emoji: '📜',
    theme: 'purple',
    layout: 'standard',
    bullets: [
      { emoji: '1950', text: 'Alan Turing เสนอ Turing Test', sub: '"เครื่องจักรคิดได้หรือไม่?"' },
      { emoji: '1956', text: 'กำเนิดคำว่า "AI"', sub: 'การประชุม Dartmouth' },
      { emoji: '1997', text: 'Deep Blue ชนะแชมป์หมากรุก', sub: 'เอาชนะ Garry Kasparov' },
      { emoji: '2016', text: 'AlphaGo ชนะแชมป์โกะ', sub: 'เกมที่ซับซ้อนกว่าหมากรุก' },
      { emoji: '2022', text: 'ChatGPT เปลี่ยนโลก', sub: 'AI พูดคุยตอบคำถามได้เป็นธรรมชาติ' },
    ],
  },
  {
    title: 'AI vs ML vs Deep Learning',
    emoji: '🔍',
    theme: 'orange',
    layout: 'standard',
    body: '3 คำที่คนสับสนบ่อย — มาทำความเข้าใจกัน',
    bullets: [
      {
        emoji: '🌟',
        text: 'AI — ภาพรวมใหญ่สุด',
        sub: 'คอมพิวเตอร์ที่ทำงานฉลาด รวมทุกเทคนิค',
      },
      {
        emoji: '📊',
        text: 'ML — สาขาหนึ่งของ AI',
        sub: 'เรียนรู้จากข้อมูล (Linear regression, Decision tree, ...)',
      },
      {
        emoji: '🧠',
        text: 'Deep Learning — สาขาหนึ่งของ ML',
        sub: 'ใช้ Neural Networks ที่มีหลายๆ ชั้น',
      },
    ],
    callout: { type: 'tip', emoji: '🔄', text: 'AI ⊃ ML ⊃ Deep Learning (เหมือนกล่องใน กล่องใน กล่อง)' },
  },
  {
    title: 'Neural Network เลียนแบบสมอง',
    emoji: '🧠',
    theme: 'pink',
    layout: 'split',
    body: 'Neural Network คือเครือข่ายของหน่วยคิดเล็กๆ (Neuron) ที่เชื่อมต่อกัน — เลียนแบบการทำงานของสมองมนุษย์',
    bullets: [
      { emoji: '🎯', text: 'Input Layer — รับข้อมูล' },
      { emoji: '⚙️', text: 'Hidden Layer — ประมวลผล' },
      { emoji: '🎁', text: 'Output Layer — ให้คำตอบ' },
      { emoji: '🔗', text: 'Weights — ค่าน้ำหนักการเชื่อม' },
      { emoji: '🎓', text: 'Training — ปรับ weights ให้ถูกต้อง' },
    ],
    image: img('photo-1675557009285-6e8d5c5b8b1e'),
    imageCaption: 'โครงสร้าง Neural Network แบบเลเยอร์',
  },
  {
    title: 'Dataset & Train/Test Split',
    emoji: '📊',
    theme: 'green',
    layout: 'standard',
    body: 'ข้อมูลที่ดีคือหัวใจของ AI ที่ดี',
    bullets: [
      { emoji: '🎓', text: 'Training Set (80%)', sub: 'ใช้สอน AI' },
      { emoji: '🧪', text: 'Test Set (20%)', sub: 'ใช้ทดสอบว่า AI เก่งจริงไหม' },
      { emoji: '⚠️', text: 'Overfitting', sub: 'AI จำคำตอบเก่าได้ แต่ทายของใหม่ผิด' },
      { emoji: '✅', text: 'Generalization', sub: 'AI ทายของใหม่ได้ถูก = ดี!' },
    ],
    code: {
      lang: 'python',
      content: `# ตัวอย่างการแบ่งข้อมูลใน Python
from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)`,
    },
    callout: { type: 'warn', emoji: '🚨', text: 'อย่าเอา Test Set มาฝึก! ไม่งั้นเหมือนเปิดข้อสอบดูคำตอบก่อน' },
  },
];

// ===========================================================================
// AI ป.4-6 — หน่วยที่เหลือ (3 และ 4)
// ===========================================================================
const ai_p46_unit3: RichSlide[] = [
  {
    title: '✨ Generative AI — รู้ทันเครื่องมือสร้างสรรค์',
    emoji: '✨',
    theme: 'pink',
    layout: 'cover',
    body: 'AI ที่สร้างของใหม่ได้! เขียนเรื่อง วาดรูป แต่งเพลง ทำวิดีโอ — เปลี่ยนวงการความสร้างสรรค์ทั้งหมด',
    image: img('photo-1620712943543-bcc4688e7485'),
  },
  {
    title: 'Generative AI คืออะไร?',
    emoji: '🎨',
    theme: 'purple',
    layout: 'standard',
    body: '"Generative" = สร้างสรรค์ + "AI" = ปัญญาประดิษฐ์ → AI ที่สร้างเนื้อหาใหม่ๆ',
    bullets: [
      { emoji: '✍️', text: 'สร้างข้อความ', sub: 'ChatGPT, Gemini, Claude — ตอบคำถาม เขียนเรียงความ' },
      { emoji: '🖼️', text: 'สร้างรูปภาพ', sub: 'DALL-E, Midjourney, Stable Diffusion' },
      { emoji: '🎵', text: 'แต่งเพลง', sub: 'Suno, MusicLM — เพลงตามอารมณ์ที่บอก' },
      { emoji: '🎬', text: 'สร้างวิดีโอ', sub: 'Sora, Runway — คลิปจากคำอธิบาย' },
      { emoji: '🗣️', text: 'สร้างเสียง', sub: 'ElevenLabs — เสียงเหมือนคนจริง' },
    ],
    callout: { type: 'fun', emoji: '🤯', text: 'AI วาดภาพได้เก่งกว่าศิลปินบางคน — แต่ก็ต้องใช้อย่างมีจริยธรรม' },
  },
  {
    title: 'ใช้ ChatGPT/Gemini อย่างฉลาด',
    emoji: '💬',
    theme: 'blue',
    layout: 'standard',
    body: 'AI Chatbot ช่วยเรียนได้ — ถ้ารู้วิธีถาม',
    bullets: [
      { emoji: '✅', text: 'ถามอธิบายเรื่องยาก', sub: '"อธิบายระบบสุริยะให้นักเรียน ป.5 ฟัง"' },
      { emoji: '✅', text: 'สรุปบทเรียน', sub: '"สรุปเรื่อง... ใน 5 ข้อ"' },
      { emoji: '✅', text: 'ตรวจการบ้าน', sub: '"ตรวจเรียงความนี้ บอกข้อผิดพลาด"' },
      { emoji: '❌', text: 'อย่าให้ทำการบ้านแทน', sub: 'ลอกตรงๆ = ไม่ได้เรียนรู้' },
      { emoji: '❌', text: 'อย่าเชื่อทุกคำตอบ', sub: 'AI อาจมั่ว (Hallucination)' },
    ],
  },
  {
    title: 'AI ผิดได้! (Hallucination)',
    emoji: '🤥',
    theme: 'red',
    layout: 'standard',
    body: '"Hallucination" = AI สร้างคำตอบที่ฟังดูถูก แต่ความจริงไม่ใช่',
    bullets: [
      { emoji: '🎭', text: 'AI แต่งเรื่องได้', sub: 'อ้างชื่อหนังสือที่ไม่มีจริง' },
      { emoji: '📅', text: 'ข้อมูลเก่า', sub: 'ChatGPT รู้ถึงปี 2023 เท่านั้น' },
      { emoji: '🌍', text: 'AI ไม่รู้ทุกอย่าง', sub: 'โดยเฉพาะเรื่องท้องถิ่นไทย' },
      { emoji: '🔍', text: 'ตรวจสอบเสมอ', sub: 'หาแหล่งอ้างอิงจริง — Wikipedia, หนังสือเรียน' },
    ],
    callout: { type: 'warn', emoji: '🚨', text: 'AI = ผู้ช่วย ไม่ใช่ทุกคำตอบ — ใช้ความคิดของเราเสมอ!' },
  },
  {
    title: 'ลองเล่น Generative AI ฟรี',
    emoji: '🎮',
    theme: 'green',
    layout: 'standard',
    body: 'เครื่องมือฟรีที่เด็กเล่นได้',
    bullets: [
      { emoji: '✏️', text: 'AutoDraw', sub: 'วาดเส้นง่ายๆ → AI แปลงเป็นรูปสวย' },
      { emoji: '🎵', text: 'AI Duet', sub: 'เล่นเปียโน → AI แต่งเพลงต่อ' },
      { emoji: '📚', text: 'Talk to Books', sub: 'ถามคำถาม AI ค้นจากหนังสือจริง' },
      { emoji: '🎨', text: 'ChatGPT (free)', sub: 'พูดคุย ตอบคำถาม (ขออนุญาตผู้ปกครอง)' },
    ],
    callout: { type: 'tip', emoji: '👆', text: 'เลื่อนไป Tab "กิจกรรมสนุก" — ลองเล่นได้เลย!' },
  },
];

const ai_p46_unit4: RichSlide[] = [
  {
    title: '⚖️ จริยธรรม AI และอคติ (Bias)',
    emoji: '⚖️',
    theme: 'orange',
    layout: 'cover',
    body: 'AI เก่งมาก แต่อาจไม่ยุติธรรม! มาเรียนรู้เรื่อง Bias และความรับผิดชอบ',
    image: img('photo-1633419461186-7d40a38105ec'),
  },
  {
    title: 'AI Bias — อคติของ AI',
    emoji: '⚠️',
    theme: 'red',
    layout: 'standard',
    body: 'AI ไม่มีความคิดของตัวเอง — มันเรียนจากข้อมูล ถ้าข้อมูลลำเอียง AI ก็ลำเอียง',
    bullets: [
      { emoji: '👨', text: 'ตัวอย่าง', sub: 'AI HR ฝึกจากข้อมูลผู้ชาย 90% → ชอบเลือกผู้ชายมากกว่า' },
      { emoji: '🌍', text: 'ตัวอย่าง', sub: 'AI ตรวจมะเร็งฝึกจากผิวขาว → แม่นยำน้อยกับผิวคล้ำ' },
      { emoji: '💸', text: 'ตัวอย่าง', sub: 'AI ปล่อยกู้ฝึกจากย่านรวย → ไม่ปล่อยให้ย่านยากจน' },
    ],
    callout: { type: 'warn', emoji: '🤔', text: 'AI ไม่ได้เลือกปฏิบัติเอง — แต่สะท้อนอคติของข้อมูลที่ป้อนเข้าไป' },
  },
  {
    title: 'Deepfake — ภาพ/วิดีโอปลอม',
    emoji: '🎭',
    theme: 'purple',
    layout: 'split',
    body: 'AI สร้างวิดีโอ/ภาพที่ดูเหมือนจริงแต่เป็นของปลอม — อันตรายสำหรับสังคม',
    bullets: [
      { emoji: '😨', text: 'สร้างคลิปคนพูดสิ่งที่ไม่ได้พูด' },
      { emoji: '👥', text: 'ใช้ในการโกง — ปลอมเป็นพ่อแม่' },
      { emoji: '📰', text: 'สร้างข่าวปลอม' },
      { emoji: '🔍', text: 'สังเกตจาก: กระพริบตาผิด, ขอบใบหน้าเบลอ' },
    ],
    image: img('photo-1633419461186-7d40a38105ec'),
    imageCaption: 'Deepfake — ภาพที่ดูจริงแต่ AI สร้างขึ้น',
  },
  {
    title: 'จริยธรรมในการใช้ AI',
    emoji: '🤝',
    theme: 'green',
    layout: 'standard',
    body: '5 หลักสำคัญที่นักเรียนควรรู้',
    bullets: [
      { emoji: '1️⃣', text: 'ไม่ใช้ AI ทำร้ายคนอื่น', sub: 'อย่าทำ Deepfake แกล้งเพื่อน' },
      { emoji: '2️⃣', text: 'อ้างอิงเสมอเมื่อใช้ AI', sub: 'บอกครูว่าใช้ AI ช่วย' },
      { emoji: '3️⃣', text: 'ปกป้องข้อมูลส่วนตัว', sub: 'อย่าให้ AI ข้อมูลที่ลับ' },
      { emoji: '4️⃣', text: 'ตรวจสอบความถูกต้อง', sub: 'อย่าเชื่อ AI ทุกคำ' },
      { emoji: '5️⃣', text: 'เคารพลิขสิทธิ์', sub: 'รูป AI = ใครเป็นเจ้าของ?' },
    ],
  },
  {
    title: 'เราคือคนกำหนดอนาคตของ AI',
    emoji: '🌟',
    theme: 'yellow',
    layout: 'quote',
    body: 'AI จะดีหรือร้าย ขึ้นอยู่กับเราที่สร้างและใช้มัน — เลือกใช้ในทางที่ดี เลือกสร้างให้เป็นธรรม',
    callout: { type: 'fun', emoji: '🚀', text: 'นักเรียนวันนี้ = นักพัฒนา AI วันหน้า — เริ่มเรียนรู้จริยธรรมตั้งแต่ตอนนี้' },
  },
];

// ===========================================================================
// AI ม.1-3 — หน่วยที่เหลือ (2-5)
// ===========================================================================
const ai_m13_unit2: RichSlide[] = [
  {
    title: '👁️ Computer Vision & NLP',
    emoji: '👁️',
    theme: 'blue',
    layout: 'cover',
    body: 'AI เห็นภาพ / อ่าน-เขียนภาษา — 2 ความสามารถหลักของ AI ยุคใหม่',
    image: img('photo-1535378917042-10a22c95931a'),
  },
  {
    title: 'Computer Vision (CV)',
    emoji: '📷',
    theme: 'purple',
    layout: 'standard',
    body: 'ทำให้คอมพิวเตอร์ "เห็น" และ "เข้าใจ" ภาพ',
    bullets: [
      { emoji: '🏷️', text: 'Image Classification', sub: 'แยกประเภทรูป — แมว/หมา/รถ' },
      { emoji: '🎯', text: 'Object Detection', sub: 'หาว่าในภาพมีอะไรอยู่ตรงไหน — กล่องครอบ' },
      { emoji: '🖼️', text: 'Image Segmentation', sub: 'แบ่งพื้นที่ในภาพออกเป็นส่วนๆ' },
      { emoji: '👤', text: 'Face Recognition', sub: 'จดจำใบหน้าคน — ปลดล็อกมือถือ' },
    ],
    callout: { type: 'tip', emoji: '🚗', text: 'รถยนต์ขับเองใช้ CV ตลอด — ตรวจจับเลน รถข้างเคียง สัญญาณไฟ' },
  },
  {
    title: 'NLP — Natural Language Processing',
    emoji: '💬',
    theme: 'green',
    layout: 'standard',
    body: 'ทำให้ AI "เข้าใจ" และ "ตอบ" ภาษามนุษย์',
    bullets: [
      { emoji: '🌐', text: 'Translation', sub: 'แปลภาษา — Google Translate' },
      { emoji: '😊', text: 'Sentiment Analysis', sub: 'อ่านอารมณ์ — รีวิวบวก/ลบ?' },
      { emoji: '📝', text: 'Summarization', sub: 'สรุปบทความยาวเป็นข้อๆ' },
      { emoji: '❓', text: 'Question Answering', sub: 'ตอบคำถามจากเอกสาร' },
      { emoji: '🤖', text: 'Chatbot', sub: 'แชทกับลูกค้า ตอบคำถามอัตโนมัติ' },
    ],
  },
  {
    title: 'Speech Recognition & TTS',
    emoji: '🎙️',
    theme: 'pink',
    layout: 'comparison',
    compareLeft: {
      title: '🎤 Speech-to-Text',
      emoji: '👂',
      items: [
        'เสียงพูด → ข้อความ',
        'พิมพ์ด้วยเสียง',
        'subtitles อัตโนมัติ',
        'Google Voice Search',
      ],
      color: '#3b82f6',
    },
    compareRight: {
      title: '🔊 Text-to-Speech (TTS)',
      emoji: '🗣️',
      items: [
        'ข้อความ → เสียงพูด',
        'อ่านหนังสือให้คนตาบอด',
        'GPS อ่านทาง',
        'ElevenLabs เสียงคนจริง',
      ],
      color: '#ec4899',
    },
  },
  {
    title: 'Project: ใช้ Hugging Face Spaces',
    emoji: '🤗',
    theme: 'orange',
    layout: 'standard',
    body: 'ลองทดสอบโมเดล AI ที่มีคนสร้างไว้ ใช้ผ่านเว็บไม่ต้องลงโปรแกรม',
    bullets: [
      { emoji: '🏠', text: 'huggingface.co/spaces', sub: 'รวมเดโม AI หลายร้อยตัว' },
      { emoji: '🖼️', text: 'ลองโมเดล Image Classification', sub: 'อัปโหลดรูป → AI ทาย' },
      { emoji: '🌍', text: 'ลองโมเดลแปลภาษา', sub: 'ภาษาท้องถิ่นที่ Google ไม่มี' },
      { emoji: '🎨', text: 'ลองโมเดล Image Generation', sub: 'พิมพ์คำ → AI วาดภาพ' },
    ],
    code: {
      lang: 'python',
      content: `# ตัวอย่างการเรียกใช้ Hugging Face API ใน Python
from transformers import pipeline

classifier = pipeline("sentiment-analysis")
result = classifier("ฉันชอบเรียน AI มาก!")
print(result)
# [{'label': 'POSITIVE', 'score': 0.99}]`,
    },
  },
];

const ai_m13_unit3: RichSlide[] = [
  {
    title: '✍️ Prompt Engineering — ศาสตร์การสั่งงาน AI',
    emoji: '✍️',
    theme: 'orange',
    layout: 'cover',
    body: 'การพิมพ์คำสั่งดีๆ ทำให้ AI ตอบดี — เป็นทักษะที่ทุกคนต้องมีในยุคนี้',
    image: img('photo-1664575600796-ffa828c5cb6e'),
  },
  {
    title: 'Prompt = คำสั่งที่ส่งให้ AI',
    emoji: '📝',
    theme: 'blue',
    layout: 'comparison',
    compareLeft: {
      title: '❌ Prompt ไม่ดี',
      emoji: '😤',
      items: [
        '"เขียนเรียงความ"',
        '"แปลให้หน่อย"',
        '"ตอบคำถามนี้"',
        '"ช่วยที"',
      ],
      color: '#ef4444',
    },
    compareRight: {
      title: '✅ Prompt ดี',
      emoji: '🎯',
      items: [
        '"เขียนเรียงความ 200 คำ เรื่อง..."',
        '"แปลเป็นไทยที่เป็นธรรมชาติ"',
        '"ตอบเป็นข้อ 1-5 อธิบายสั้นๆ"',
        '"ช่วยแก้โจทย์เลข + อธิบายขั้นตอน"',
      ],
      color: '#22c55e',
    },
    callout: { type: 'quote', text: '"ถามให้ดี ได้คำตอบดี" — กฎทองของ Prompt Engineering' },
  },
  {
    title: '4 องค์ประกอบของ Prompt ที่ดี',
    emoji: '🏗️',
    theme: 'purple',
    layout: 'standard',
    bullets: [
      { emoji: '🎭', text: 'Role (บทบาท)', sub: '"คุณคือครูสอนวิทยาศาสตร์ ป.5..."' },
      { emoji: '🎯', text: 'Task (งาน)', sub: '"ช่วยอธิบายเรื่อง..."' },
      { emoji: '📋', text: 'Context (บริบท)', sub: '"นักเรียนยังไม่เข้าใจเรื่องอะตอม"' },
      { emoji: '📐', text: 'Format (รูปแบบ)', sub: '"เขียนเป็นข้อ 1-5 ภาษาไทย ใช้ตัวอย่างจากชีวิต"' },
    ],
    code: {
      lang: 'text',
      content: `# ตัวอย่าง Prompt ที่ครบ 4 องค์ประกอบ

[Role]    คุณเป็นครูสอนวิทยาการคำนวณ ม.2
[Task]    ช่วยอธิบายเรื่อง Loop ใน Python
[Context] นักเรียนเพิ่งเรียนตัวแปร แต่ยังไม่เข้าใจ for loop
[Format]  เขียนเป็นข้อ 1-3 + ตัวอย่างโค้ดสั้นๆ + คำถามท้ายเรื่อง 1 ข้อ`,
    },
  },
  {
    title: 'เทคนิค Prompt ขั้นสูง',
    emoji: '🚀',
    theme: 'pink',
    layout: 'standard',
    bullets: [
      {
        emoji: '0️⃣',
        text: 'Zero-shot',
        sub: 'ถามตรงๆ ไม่มีตัวอย่าง — "แปลคำนี้: hello"',
      },
      {
        emoji: '🔢',
        text: 'Few-shot (ให้ตัวอย่าง)',
        sub: '"hello → สวัสดี, goodbye → ลาก่อน, thank you → ?"',
      },
      {
        emoji: '🧠',
        text: 'Chain-of-Thought',
        sub: '"คิดทีละขั้นตอน แล้วตอบ" — AI จะคิดแล้วตอบดีขึ้น',
      },
      {
        emoji: '🎭',
        text: 'Role Playing',
        sub: '"แสดงบทบาทเป็น Steve Jobs" — ตอบในสไตล์นั้น',
      },
    ],
    callout: { type: 'tip', emoji: '💡', text: 'Chain-of-Thought ช่วยให้ AI แก้โจทย์เลขถูกขึ้น 30%' },
  },
  {
    title: 'ใช้ AI ในการเรียนอย่างมีจริยธรรม',
    emoji: '🎓',
    theme: 'green',
    layout: 'standard',
    bullets: [
      { emoji: '✅', text: 'ใช้ AI อธิบายสิ่งที่ไม่เข้าใจ', sub: '"อธิบายฟังก์ชันใน Python ให้นักเรียน ม.2"' },
      { emoji: '✅', text: 'ใช้ AI ตรวจการบ้าน', sub: '"ดูเรียงความนี้ ผิดยังไง?"' },
      { emoji: '✅', text: 'ใช้ AI หาแนวคิด', sub: '"ไอเดียโครงงานเรื่องสิ่งแวดล้อม"' },
      { emoji: '❌', text: 'อย่าให้ AI ทำการบ้านแทน', sub: 'ไม่ได้เรียนรู้จริง + ผิดจริยธรรม' },
      { emoji: '❌', text: 'อย่าลอกงาน AI ส่ง', sub: 'ครูบอกได้ว่าไม่ใช่งานเรา' },
    ],
    callout: { type: 'warn', emoji: '⚠️', text: 'มหาวิทยาลัยใช้ตัวตรวจ AI — ลอกงาน AI โดนจับได้!' },
  },
];

const ai_m13_unit4: RichSlide[] = [
  {
    title: '🛡️ AI Ethics & Bias',
    emoji: '🛡️',
    theme: 'red',
    layout: 'cover',
    body: 'AI ที่ทรงพลัง = ความรับผิดชอบที่ใหญ่ — มาเรียนรู้จริยธรรมและกฎหมายของ AI',
    image: img('photo-1620712943543-bcc4688e7485'),
  },
  {
    title: 'Bias เกิดจากอะไร?',
    emoji: '⚖️',
    theme: 'orange',
    layout: 'standard',
    body: '3 แหล่งที่มาของอคติใน AI',
    bullets: [
      { emoji: '📊', text: 'Data Bias', sub: 'ข้อมูลที่ใช้ฝึกไม่หลากหลาย เช่น มีแต่ภาพคนผิวขาว' },
      { emoji: '🎯', text: 'Algorithm Bias', sub: 'อัลกอริทึมที่เลือกฟีเจอร์ผิด เช่น ใช้รหัสไปรษณีย์ทำนายเครดิต' },
      { emoji: '👥', text: 'Human Bias', sub: 'นักพัฒนามีอคติส่วนตัวเข้ามาในการออกแบบ' },
    ],
  },
  {
    title: 'กรณีศึกษาจริง — AI ที่ผิดพลาด',
    emoji: '📰',
    theme: 'purple',
    layout: 'standard',
    bullets: [
      {
        emoji: '👔',
        text: 'Amazon Hiring AI (2018)',
        sub: 'ฝึกจาก resume ผู้ชาย → ปฏิเสธ resume ของผู้หญิงโดยอัตโนมัติ → Amazon ยุติโครงการ',
      },
      {
        emoji: '🚔',
        text: 'COMPAS Recidivism (US)',
        sub: 'AI ทำนายโอกาสกระทำผิดซ้ำ → ลำเอียงต่อคนผิวดำ',
      },
      {
        emoji: '🏥',
        text: 'Healthcare AI',
        sub: 'AI วินิจฉัยโรคจากผิวสีอ่อน → ผิดเยอะกับผิวคล้ำ',
      },
      {
        emoji: '🎤',
        text: 'Speech AI',
        sub: 'แม่นยำกับสำเนียงอเมริกัน → อ่านสำเนียงอินเดียผิด' },
    ],
    callout: { type: 'warn', emoji: '🚨', text: 'AI ไม่ใช่กลาง — สะท้อนความไม่เท่าเทียมในสังคมที่สร้างมัน' },
  },
  {
    title: 'กฎหมาย AI ในประเทศไทย',
    emoji: '⚖️',
    theme: 'blue',
    layout: 'standard',
    bullets: [
      { emoji: '📜', text: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)', sub: 'ห้ามใช้ข้อมูลส่วนตัวโดยไม่ได้รับอนุญาต' },
      { emoji: '🇹🇭', text: 'ร่าง พ.ร.บ. AI', sub: 'กำลังพิจารณา — กำกับการใช้ AI ในประเทศ' },
      { emoji: '©️', text: 'ลิขสิทธิ์ผลงาน AI', sub: 'งาน AI สร้าง — ใครเป็นเจ้าของ?' },
      { emoji: '🌍', text: 'EU AI Act', sub: 'กฎหมาย AI ของยุโรป — เป็นมาตรฐานโลก' },
    ],
  },
  {
    title: 'หลักการ Responsible AI',
    emoji: '🤝',
    theme: 'green',
    layout: 'standard',
    body: '5 หลักที่ Google, Microsoft, OpenAI ยึดถือ',
    bullets: [
      { emoji: '⚖️', text: 'Fairness — เป็นธรรม', sub: 'ไม่เลือกปฏิบัติเชื้อชาติ เพศ อายุ' },
      { emoji: '🔍', text: 'Transparency — โปร่งใส', sub: 'อธิบายได้ว่าทำไม AI ตอบแบบนั้น' },
      { emoji: '🛡️', text: 'Safety — ปลอดภัย', sub: 'ทดสอบก่อนใช้งานจริง' },
      { emoji: '🔒', text: 'Privacy — ความเป็นส่วนตัว', sub: 'ปกป้องข้อมูลผู้ใช้' },
      { emoji: '👥', text: 'Accountability — รับผิดชอบ', sub: 'เมื่อ AI ผิด ใครรับผิดชอบ?' },
    ],
  },
];

const ai_m13_unit5: RichSlide[] = [
  {
    title: '🚀 โครงงาน AI — แก้ปัญหาในชีวิตจริง',
    emoji: '🚀',
    theme: 'green',
    layout: 'cover',
    body: 'นำสิ่งที่เรียนมาใช้จริง! สร้าง AI ของตัวเองที่แก้ปัญหาในโรงเรียนหรือชุมชน',
    image: img('photo-1551434678-e076c223a692'),
  },
  {
    title: 'ขั้นตอนทำโครงงาน AI',
    emoji: '🗺️',
    theme: 'blue',
    layout: 'standard',
    bullets: [
      { emoji: '1️⃣', text: 'หาปัญหา', sub: 'สังเกตชีวิตประจำวัน — มีอะไรที่ AI ช่วยได้?' },
      { emoji: '2️⃣', text: 'วางแผน', sub: 'AI แบบไหน? Image/Audio/Text? ใช้เครื่องมืออะไร?' },
      { emoji: '3️⃣', text: 'เก็บข้อมูล', sub: '300+ ตัวอย่างต่อคลาส — ยิ่งเยอะยิ่งดี' },
      { emoji: '4️⃣', text: 'ฝึก + ทดสอบ', sub: 'Train → Test → ปรับปรุง → ทำซ้ำ' },
      { emoji: '5️⃣', text: 'นำเสนอ', sub: 'Demo + อธิบาย + บทเรียน' },
    ],
  },
  {
    title: '💡 ไอเดียโครงงานสำหรับ ม.ต้น',
    emoji: '💡',
    theme: 'yellow',
    layout: 'standard',
    bullets: [
      { emoji: '🌿', text: 'AI จำแนกพันธุ์ใบไม้', sub: 'ถ่ายใบไม้ → บอกว่าเป็นพืชอะไร' },
      { emoji: '🗑️', text: 'AI คัดแยกขยะ', sub: 'ถ่ายขยะ → ขยะรีไซเคิล/ทั่วไป/อันตราย' },
      { emoji: '😷', text: 'AI ตรวจสวมหน้ากาก', sub: 'ในตอนช่วงเฝ้าระวัง — ใส่/ไม่ใส่/ใส่ผิด' },
      { emoji: '🐶', text: 'AI จดจำสัตว์เลี้ยง', sub: 'แยกแมวกับหมาของบ้าน' },
      { emoji: '✋', text: 'AI ภาษามือ', sub: 'แปลภาษามือเป็นข้อความ' },
      { emoji: '📚', text: 'Chatbot ตอบเรื่องโรงเรียน', sub: 'นักเรียนใหม่ถาม — AI ตอบ' },
    ],
    callout: { type: 'fun', emoji: '🌟', text: 'ทำได้จริงด้วย Teachable Machine + Scratch + ML4Kids ใน 1 ชั่วโมง' },
  },
  {
    title: 'การนำเสนอผลงาน AI',
    emoji: '🎤',
    theme: 'pink',
    layout: 'standard',
    body: 'นำเสนอแบบมืออาชีพ — บอกครบ 5 ส่วน',
    bullets: [
      { emoji: '❓', text: 'ปัญหาคืออะไร?', sub: 'ทำไมถึงสำคัญ? ใครเดือดร้อน?' },
      { emoji: '🛠️', text: 'แนวคิดและเครื่องมือ', sub: 'ใช้ AI แบบไหน? เพราะอะไร?' },
      { emoji: '📊', text: 'ผลการทดลอง', sub: 'ความแม่นยำ ตัวอย่างที่ทำงาน/ไม่ทำงาน' },
      { emoji: '🎬', text: 'Demo สด', sub: 'โชว์การใช้งานจริง — ตื่นเต้นกว่าสไลด์' },
      { emoji: '🔮', text: 'อนาคต', sub: 'จะพัฒนาต่อยังไง? ใครได้ประโยชน์?' },
    ],
  },
  {
    title: 'AI สร้างโดยคุณ — เริ่มได้วันนี้!',
    emoji: '🌟',
    theme: 'purple',
    layout: 'quote',
    body: 'ไม่ต้องรอให้โต ไม่ต้องเก่งโค้ดมาก่อน — เริ่มทำโครงงาน AI เล็กๆ วันนี้ แล้วจะเก่งขึ้นเรื่อยๆ',
    callout: { type: 'fun', emoji: '🚀', text: 'นักเรียน ม.ต้น คนหนึ่งสร้าง AI ตรวจมะเร็งผิวหนัง ได้รางวัลระดับโลก!' },
  },
];

// ===========================================================================
// ป.1 — พื้นฐาน
// ===========================================================================
const p1_unit1: RichSlide[] = [
  {
    title: "คอมพิวเตอร์ เพื่อนใหม่ของเรา",
    emoji: "💻",
    theme: "blue",
    layout: "cover",
    body: "มารู้จักอุปกรณ์แสนวิเศษที่ช่วยให้เราเรียน วาดภาพ พิมพ์ตัวอักษร และสร้างผลงานสนุก ๆ กัน!",
    image: "/media/lessons/p1-unit1-computer-friend.webp",
    imageCaption: "คอมพิวเตอร์เพื่อนใหม่ในห้องเรียนของเรา",
    quickCheck: {
      question: "คอมพิวเตอร์ช่วยเราทำอะไรได้บ้างในห้องเรียน?",
      choices: [
        "ช่วยวาดภาพและเรียนรู้สิ่งใหม่ ๆ",
        "ใช้แทนเตาทำอาหาร",
        "ใช้แทนร่มกันฝน",
      ],
      answer: 0,
      feedback: "ถูกต้อง! คอมพิวเตอร์ช่วยเราเรียน วาดภาพ และพิมพ์งานได้อย่างสร้างสรรค์",
    },
  },
  {
    title: "ส่วนประกอบหลักของคอมพิวเตอร์",
    emoji: "🖥️",
    theme: "green",
    layout: "split",
    body: "คอมพิวเตอร์ตั้งโต๊ะประกอบด้วยชิ้นส่วนสำคัญ 5 ชิ้นที่ทำงานร่วมกัน",
    bullets: [
      {
        emoji: "🖥️",
        text: "หน้าจอ (Monitor)",
        sub: "แสดงรูปภาพ ข้อความ และวิดีโอให้เรามองเห็น",
      },
      {
        emoji: "📦",
        text: "ตัวเครื่อง (Case/CPU)",
        sub: "สมองสั่งการ ประมวลผลและเก็บข้อมูล",
      },
      {
        emoji: "⌨️",
        text: "คีย์บอร์ด (Keyboard)",
        sub: "แป้นพิมพ์สำหรับพิมพ์ตัวหนังสือและตัวเลข",
      },
      {
        emoji: "🖱️",
        text: "เมาส์ (Mouse)",
        sub: "ใช้ชี้และคลิกเลือกสิ่งต่าง ๆ บนหน้าจอ",
      },
      {
        emoji: "🔊",
        text: "ลำโพง (Speaker)",
        sub: "ส่งเสียงพูดและเสียงดนตรีให้เราได้ยิน",
      },
    ],
    image: "/media/lessons/p1-unit1-computer-parts.webp",
    imageCaption: "อุปกรณ์หลัก 5 ชิ้นของคอมพิวเตอร์",
    quickCheck: {
      question: "อุปกรณ์ใดทำหน้าที่เหมือน \"สมอง\" ของคอมพิวเตอร์?",
      choices: ["ตัวเครื่อง (CPU)", "ลำโพง", "เมาส์"],
      answer: 0,
      feedback: "เก่งมาก! CPU คือสมองที่คอยคิดคำนวณและสั่งการทุกอย่าง",
    },
  },
  {
    title: "การเปิดเครื่องคอมพิวเตอร์",
    emoji: "⚡",
    theme: "orange",
    layout: "standard",
    body: "เปิดเครื่องอย่างถูกวิธีตามลำดับ 3 ขั้นตอน เพื่อให้อุปกรณ์พร้อมทำงานและปลอดภัย",
    bullets: [
      {
        emoji: "1️⃣",
        text: "ตรวจปลั๊กไฟ",
        sub: "ให้คุณครูหรือผู้ใหญ่ช่วยเสียบปลั๊กไฟและเปิดสวิตช์เต้ารับอย่างปลอดภัย",
      },
      {
        emoji: "2️⃣",
        text: "กดปุ่มเปิดหน้าจอ",
        sub: "กดปุ่ม Power ที่หน้าจอ สังเกตไฟสถานะสีเขียวหรือสีฟ้าสว่างขึ้น",
      },
      {
        emoji: "3️⃣",
        text: "กดปุ่มเปิดที่ตัวเครื่อง",
        sub: "กดปุ่มวงกลม Power บนตัวเครื่อง แล้วรอจนเข้าสู่หน้าจอ Desktop",
      },
    ],
    callout: {
      type: "warn",
      emoji: "⚠️",
      text: "เด็ก ๆ ห้ามจับสายไฟหรือเสียบปลั๊กเองขณะมือเปียกน้ำเด็ดขาด!",
    },
    quickCheck: {
      question: "ก่อนเปิดสวิตช์เครื่องคอมพิวเตอร์ ควรสังเกตสิ่งใดก่อน?",
      choices: [
        "ตรวจดูว่าเสียบปลั๊กและมือแห้งสนิท",
        "เอาน้ำหวานมารอจิบ",
        "กดปุ่มรัว ๆ ทันที",
      ],
      answer: 0,
      feedback: "ยอดเยี่ยม! ต้องตรวจความปลอดภัยและมือต้องแห้งสนิทเสมอ",
    },
  },
  {
    title: "การใช้เมาส์คู่ใจ",
    emoji: "🖱️",
    theme: "purple",
    layout: "standard",
    body: "เมาส์เป็นอุปกรณ์ชี้ตำแหน่งบนจอ ช่วยให้เราสั่งงานได้อย่างแม่นยำ",
    bullets: [
      {
        emoji: "👆",
        text: "คลิกซ้าย (Click)",
        sub: "ใช้นิ้วชี้กดปุ่มซ้าย 1 ครั้ง เพื่อเลือกไอคอนหรือปุ่ม",
      },
      {
        emoji: "✌️",
        text: "ดับเบิลคลิก (Double Click)",
        sub: "กดปุ่มซ้ายติดกัน 2 ครั้งเร็ว ๆ เพื่อเปิดโฟลเดอร์หรือโปรแกรม",
      },
      {
        emoji: "👉",
        text: "คลิกขวา (Right Click)",
        sub: "ใช้นิ้วกลางกดปุ่มขวา 1 ครั้ง เพื่อเปิดเมนูคำสั่งย่อย",
      },
      {
        emoji: "🤏",
        text: "ลากแล้ววาง (Drag and Drop)",
        sub: "กดปุ่มซ้ายค้างไว้ เลื่อนเมาส์ไปยังที่ใหม่ แล้วปล่อยนิ้ว",
      },
      {
        emoji: "🔄",
        text: "ล้อเลื่อน (Scroll Wheel)",
        sub: "หมุนขึ้นลงด้วยนิ้วชี้ เพื่อเลื่อนดูหน้าเอกสารหรือเว็บ",
      },
    ],
    callout: {
      type: "tip",
      emoji: "💡",
      text: "วางฝ่ามือแนบบนเมาส์เบา ๆ นิ้วชี้อยู่ปุ่มซ้าย นิ้วกลางอยู่ปุ่มขวา",
    },
    quickCheck: {
      question: "ถ้าต้องการเปิดโปรแกรมหรือเปิดไฟล์ ต้องกดเมาส์แบบใด?",
      choices: [
        "ดับเบิลคลิก (คลิกซ้าย 2 ครั้งเร็ว ๆ)",
        "หมุนล้อเลื่อนอย่างเดียว",
        "กดปุ่มขวาค้างไว้",
      ],
      answer: 0,
      feedback: "ถูกต้อง! ดับเบิลคลิกใช้สำหรับสั่งเปิดโฟลเดอร์หรือไฟล์งาน",
    },
  },
  {
    title: "รู้จักแป้นพิมพ์ (Keyboard) 4 ส่วน",
    emoji: "⌨️",
    theme: "blue",
    layout: "standard",
    body: "แป้นพิมพ์ใช้พิมพ์ข้อความและส่งคำสั่ง โดยแบ่งออกเป็น 4 กลุ่มหลัก",
    bullets: [
      {
        emoji: "🔤",
        text: "กลุ่มแป้นตัวอักษร (Alphanumeric Keys)",
        sub: "พิมพ์ ก-ฮ, A-Z, สระ และเครื่องหมายต่าง ๆ",
      },
      {
        emoji: "🔢",
        text: "กลุ่มแป้นตัวเลข (Numeric Keypad)",
        sub: "แป้นตัวเลข 0-9 อยู่ฝั่งขวา กดคำนวณได้รวดเร็ว",
      },
      {
        emoji: "🎯",
        text: "กลุ่มแป้นควบคุม (Control Keys)",
        sub: "ปุ่มลูกศร 4 ทิศทาง, Home, End, Page Up, Page Down",
      },
      {
        emoji: "⚡",
        text: "กลุ่มแป้นฟังก์ชัน (Function Keys)",
        sub: "แถวบนสุด F1 ถึง F12 ใช้เป็นคำสั่งลัดพิเศษ",
      },
    ],
    callout: {
      type: "fun",
      emoji: "⌨️",
      text: "ปุ่มเปลี่ยนภาษาไทย-อังกฤษ กดปุ่ม Grave Accent (~) ด้านซ้ายบนสุดของคีย์บอร์ด",
    },
    quickCheck: {
      question: "แป้นตัวอักษร ก-ฮ และ A-Z จัดอยู่ในกลุ่มแป้นใด?",
      choices: ["กลุ่มแป้นตัวอักษร", "กลุ่มแป้นฟังก์ชัน F1-F12", "กลุ่มแป้นตัวเลข"],
      answer: 0,
      feedback: "เก่งมาก! เป็นแป้นตัวอักษรหลักที่เราใช้พิมพ์เป็นประจำ",
    },
  },
  {
    title: "แป้นพิมพ์คำสั่งสำคัญที่ต้องรู้",
    emoji: "🏷️",
    theme: "pink",
    layout: "standard",
    body: "ปุ่มพิเศษบนแป้นพิมพ์ที่ใช้บ่อยที่สุดในการทำงานและพิมพ์ข้อความ",
    bullets: [
      {
        emoji: "⏎",
        text: "Enter (ปุ่มเอนเทอร์)",
        sub: "ใช้ขึ้นบรรทัดใหม่ หรือยืนยันคำสั่งตกลง",
      },
      {
        emoji: "⎵",
        text: "Space Bar (แป้นยาวสุด)",
        sub: "กดเพื่อเว้นวรรคช่องว่างระหว่างคำ",
      },
      {
        emoji: "⌫",
        text: "Backspace (ลบถอยหลัง)",
        sub: "ลบตัวอักษรที่อยู่หน้าเคอร์เซอร์ออกทีละตัว",
      },
      {
        emoji: "⇧",
        text: "Shift (กดค้างร่วมกับแป้นอื่น)",
        sub: "ใช้พิมพ์ตัวอักษรแถวบน เช่น สระบน หรืออักษรภาษาอังกฤษตัวพิมพ์ใหญ่",
      },
      {
        emoji: "⎋",
        text: "Esc (Escape ยกเลิก)",
        sub: "ปุ่มมุมซ้ายบนสุด ใช้ยกเลิกหรือออกจากหน้าจอเต็ม",
      },
    ],
    callout: {
      type: "tip",
      emoji: "✨",
      text: "ถ้าพิมพ์ผิด ไม่ต้องตกใจ กดปุ่ม Backspace ค่อย ๆ ลบแล้วพิมพ์ใหม่ได้เลย",
    },
    quickCheck: {
      question: "ถ้าต้องการเว้นวรรคช่องว่างระหว่างคำ ต้องกดแป้นใด?",
      choices: ["Space Bar (แป้นยาวด้านล่าง)", "Esc", "Enter"],
      answer: 0,
      feedback: "ถูกต้อง! Space Bar คือแป้นยาวที่สุด ใช้สำหรับเว้นวรรคคำ",
    },
  },
  {
    title: "โปรแกรมพื้นฐานน่ารู้สำหรับเด็ก",
    emoji: "🎨",
    theme: "yellow",
    layout: "standard",
    body: "คอมพิวเตอร์มีโปรแกรมสนุก ๆ ให้เราเลือกใช้งานตามความต้องการ",
    bullets: [
      {
        emoji: "🖌️",
        text: "Paint (โปรแกรมวาดภาพ)",
        sub: "ใช้วาดรูป ระบายสี แต่งภาพ ลากเส้นรูปทรงต่าง ๆ ได้อย่างอิสระ",
      },
      {
        emoji: "📝",
        text: "Microsoft Word (โปรแกรมพิมพ์เอกสาร)",
        sub: "ใช้พิมพ์การบ้าน นิทาน เรื่องเล่า และจัดข้อความให้สวยงาม",
      },
      {
        emoji: "📊",
        text: "Microsoft PowerPoint (โปรแกรมนำเสนอ)",
        sub: "ใช้ทำสไลด์ภาพและข้อความสำหรับเล่าเรื่องให้เพื่อนในห้องฟัง",
      },
    ],
    callout: {
      type: "tip",
      emoji: "💡",
      text: "ถ้าอยากวาดรูปบ้านและต้นไม้ ให้เปิดโปรแกรม Paint เป็นอันดับแรก!",
    },
    quickCheck: {
      question: "ถ้าต้องการวาดภาพการ์ตูนและระบายสี ควรเลือกใช้โปรแกรมใด?",
      choices: ["Paint", "Microsoft Word", "เครื่องคิดเลข"],
      answer: 0,
      feedback: "เยี่ยมมาก! โปรแกรม Paint เหมาะที่สุดสำหรับวาดภาพและระบายสี",
    },
  },
  {
    title: "ชุดคำสั่งพื้นฐานในการทำงาน",
    emoji: "📂",
    theme: "green",
    layout: "standard",
    body: "คำสั่งสำคัญที่เราต้องใช้ทุกครั้งเมื่อสร้างชิ้นงานในโปรแกรม",
    bullets: [
      {
        emoji: "📄",
        text: "New (สร้างชิ้นงานใหม่)",
        sub: "เปิดหน้ากระดาษเปล่าแผ่นใหม่เพื่อเริ่มทำงาน",
      },
      {
        emoji: "📂",
        text: "Open (เปิดไฟล์เดิม)",
        sub: "เปิดไฟล์งานเก่าที่เคยบันทึกไว้ขึ้นมาทำต่อ",
      },
      {
        emoji: "💾",
        text: "Save (บันทึกงาน)",
        sub: "เก็บงานไว้ในเครื่อง ป้องกันงานหายเมื่อปิดโปรแกรม",
      },
      {
        emoji: "🖨️",
        text: "Print (สั่งพิมพ์)",
        sub: "พิมพ์ผลงานจากหน้าจอลงบนแผ่นกระดาษจริง",
      },
    ],
    callout: {
      type: "warn",
      emoji: "💾",
      text: "จำให้ขึ้นใจ: สร้างงานเสร็จต้องกด Save ทุกครั้ง ไม่อย่างนั้นงานจะหาย!",
    },
    quickCheck: {
      question: "เมื่อวาดรูปเสร็จแล้ว ต้องกดคำสั่งใดเพื่อให้รูปไม่หาย?",
      choices: ["Save (บันทึก)", "New (สร้างใหม่)", "Delete (ลบ)"],
      answer: 0,
      feedback: "ถูกต้อง! การบันทึก (Save) ทำให้ผลงานถูกเก็บไว้เปิดดูในครั้งต่อไปได้",
    },
  },
  {
    title: "ปิดเครื่อง vs ถอดปลั๊ก — ต่างกันอย่างไร?",
    emoji: "🔌",
    theme: "red",
    layout: "comparison",
    body: "การปิดคอมพิวเตอร์ต้องทำอย่างถูกวิธี เพื่อถนอมอุปกรณ์และข้อมูลในเครื่อง",
    compareLeft: {
      title: "ปิดเครื่องถูกวิธี (Shut Down)",
      emoji: "✅",
      color: "#16a34a",
      items: [
        "คลิกปุ่ม Start แล้วเลือก Shut Down",
        "รอให้เครื่องบันทึกระบบและจอดับสนิท",
        "ปิดสวิตช์หน้าจอและถอดปลั๊กอย่างปลอดภัย",
        "ยืดอายุการใช้งาน ชิ้นส่วนไม่เสียหาย",
      ],
    },
    compareRight: {
      title: "ดึงปลั๊กทันที (ห้ามทำเด็ดขาด)",
      emoji: "❌",
      color: "#dc2626",
      items: [
        "ดึงปลั๊กไฟออกขณะเครื่องยังทำงานอยู่",
        "ฮาร์ดดิสก์และระบบภายในอาจพังเสียหาย",
        "ไฟล์งานที่ทำไว้สูญหายทั้งหมด",
        "อาจเกิดไฟช็อตและเป็นอันตรายต่อตนเอง",
      ],
    },
    callout: {
      type: "tip",
      emoji: "💡",
      text: "ปิดงานทุกโปรแกรมให้เรียบร้อยก่อน แล้วค่อยสั่ง Shut Down เสมอ",
    },
    quickCheck: {
      question: "เมื่อใช้คอมพิวเตอร์เสร็จแล้ว ควรปิดเครื่องด้วยวิธีใด?",
      choices: [
        "คลิก Start แล้วเลือก Shut Down",
        "ดึงปลั๊กไฟออกทันที",
        "กดปุ่มหน้าจอดับแล้วเดินหนี",
      ],
      answer: 0,
      feedback: "เก่งมาก! สั่ง Shut Down ทางซอฟต์แวร์ช่วยป้องกันคอมพิวเตอร์พัง",
    },
  },
  {
    title: "ตรวจความเข้าใจประจำหน่วยที่ 1",
    emoji: "🏆",
    theme: "blue",
    layout: "standard",
    body: "มาทดสอบความจำกันว่าเราเป็นผู้เชี่ยวชาญคอมพิวเตอร์ตัวจริงหรือยัง!",
    bullets: [
      {
        emoji: "❓",
        text: "บอกชื่อส่วนประกอบหลักของคอมพิวเตอร์ 5 ชิ้นได้ไหม",
        sub: "หน้าจอ ตัวเครื่อง คีย์บอร์ด เมาส์ ลำโพง",
      },
      {
        emoji: "❓",
        text: "คลิกซ้าย ดับเบิลคลิก และคลิกขวา ใช้งานต่างกันอย่างไร",
        sub: "เลือกของ เปิดไฟล์ และเปิดเมนูย่อย",
      },
      {
        emoji: "❓",
        text: "แป้น Enter, Space Bar, Backspace มีหน้าที่อะไร",
        sub: "ขึ้นบรรทัดใหม่ เคาะวรรค และลบตัวอักษร",
      },
      {
        emoji: "❓",
        text: "ทำไมต้องเลือก Shut Down แทนการดึงปลั๊กไฟ",
        sub: "เพื่อถนอมเครื่องและไม่ให้ไฟล์งานเสียหาย",
      },
    ],
    callout: {
      type: "fun",
      emoji: "🎉",
      text: "ถ้าตอบได้ครบทุกข้อ แปลว่าพร้อมเป็นยอดนักคอมพิวเตอร์รุ่นจิ๋วแล้ว!",
    },
    quickCheck: {
      question: "ข้อใดคือการดูแลคอมพิวเตอร์ที่ถูกต้องที่สุด?",
      choices: [
        "ล้างมือให้แห้งก่อนใช้ และไม่รับประทานขนมหน้าจอ",
        "วางแก้วน้ำไว้บนตัวเครื่อง",
        "ทุบคีย์บอร์ดแรง ๆ เมื่อพิมพ์ผิด",
      ],
      answer: 0,
      feedback: "ยอดเยี่ยมที่สุด! มือสะอาด ไม่นำอาหารเครื่องดื่มเข้าใกล้ ช่วยให้คอมพิวเตอร์อยู่กับเราได้นาน",
    },
  },
];

// ===========================================================================
// ป.5 — Scratch (หน่วยที่ 2)
// ===========================================================================
const p5_unit2: RichSlide[] = [
  {
    title: '🐱 เขียนโปรแกรมด้วย Scratch',
    emoji: '🐱',
    theme: 'orange',
    layout: 'cover',
    body: 'Scratch คือโปรแกรมเขียนโค้ดสำหรับเด็กที่ทำโดย MIT — สร้างเกม แอนิเมชัน เรื่องราวได้!',
    image: img('photo-1580894894513-541e068a3e2b'),
  },
  {
    title: 'Scratch มีอะไรบ้าง?',
    emoji: '🎨',
    theme: 'purple',
    layout: 'standard',
    bullets: [
      { emoji: '🐱', text: 'ตัวละคร (Sprite)', sub: 'แมว สุนัข คน อะไรก็ได้' },
      { emoji: '🌅', text: 'ฉากหลัง (Backdrop)', sub: 'ป่า เมือง ทะเล อวกาศ' },
      { emoji: '🧩', text: 'บล็อกคำสั่ง (Block)', sub: 'ลากต่อกัน → โปรแกรมเสร็จ' },
      { emoji: '🎵', text: 'เสียง (Sound)', sub: 'เพลง เสียงเอฟเฟกต์' },
      { emoji: '🎬', text: 'การแสดง (Stage)', sub: 'ที่ที่โปรแกรมเราเล่น' },
    ],
    callout: { type: 'tip', emoji: '🌐', text: 'เปิด scratch.mit.edu ได้เลย ฟรี ไม่ต้องลงโปรแกรม!' },
  },
  {
    title: 'หมวดหมู่ของบล็อก',
    emoji: '🌈',
    theme: 'blue',
    layout: 'standard',
    bullets: [
      { emoji: '🟦', text: 'Motion (สีน้ำเงิน)', sub: 'เคลื่อนไหว — เดิน หมุน กระโดด' },
      { emoji: '🟪', text: 'Looks (สีม่วง)', sub: 'หน้าตา — เปลี่ยนชุด พูด คิด' },
      { emoji: '🟫', text: 'Sound (สีชมพู)', sub: 'เสียง — เล่นเพลง ทำเสียง' },
      { emoji: '🟨', text: 'Events (สีเหลือง)', sub: 'เริ่มเมื่อ — กดปุ่ม คลิก' },
      { emoji: '🟧', text: 'Control (สีส้ม)', sub: 'ควบคุม — รอ ทำซ้ำ ถ้า-แล้ว' },
      { emoji: '🟩', text: 'Sensing (เขียวอ่อน)', sub: 'ตรวจจับ — ชนกัน คลิก' },
    ],
  },
  {
    title: 'โปรแกรมแรก — แมวเดิน!',
    emoji: '🐾',
    theme: 'green',
    layout: 'standard',
    body: 'มาทำให้แมวเดินไปข้างหน้าเมื่อกดธงเขียวกัน',
    bullets: [
      { emoji: '1️⃣', text: 'ลาก "เมื่อคลิก 🏁"', sub: 'จาก Events — เริ่มต้น' },
      { emoji: '2️⃣', text: 'ลาก "เคลื่อนที่ 10 ก้าว"', sub: 'จาก Motion — เคลื่อน' },
      { emoji: '3️⃣', text: 'ลาก "ทำซ้ำ 10 ครั้ง"', sub: 'จาก Control — ครอบบล็อก 2' },
      { emoji: '4️⃣', text: 'กดธงเขียว 🏁', sub: 'แมวเดินไปข้างหน้า!' },
    ],
    code: {
      lang: 'scratch',
      content: `🏁 เมื่อคลิกธงเขียว
   ทำซ้ำ 10 ครั้ง
      เคลื่อนที่ 10 ก้าว
      รอ 0.1 วินาที`,
    },
    callout: { type: 'fun', emoji: '🎉', text: 'ดูสิ — เราเขียนโปรแกรมแล้ว! ลองเปลี่ยน 10 เป็น 50 ดูสิ' },
  },
  {
    title: 'แนวคิดเงื่อนไข (If)',
    emoji: '🤔',
    theme: 'pink',
    layout: 'standard',
    body: '"ถ้า ___ แล้ว ___" — บล็อกตัดสินใจ ทำให้โปรแกรมฉลาดขึ้น',
    bullets: [
      { emoji: '❓', text: 'ตัวอย่าง', sub: '"ถ้าโดนชน → กลับด้าน"' },
      { emoji: '🎯', text: 'ตัวอย่าง', sub: '"ถ้าคลิกแมว → พูด สวัสดี"' },
      { emoji: '⏱️', text: 'ตัวอย่าง', sub: '"ถ้านับครบ 10 → จบเกม"' },
    ],
    code: {
      lang: 'scratch',
      content: `🏁 เมื่อคลิกธงเขียว
   ทำซ้ำตลอดไป
      เคลื่อนที่ 10 ก้าว
      ถ้า แตะขอบจอ ?
         กลับด้าน
      หาก ไม่ใช่`,
    },
  },
];

// ===========================================================================
// ม.1 วิทยาการคำนวณ — อัลกอริทึม (หน่วย 1)
// ===========================================================================
const m1_cs_unit1: RichSlide[] = [
  {
    title: "🧠 แนวคิดเชิงนามธรรมและการแก้ปัญหา",
    emoji: "🧠",
    theme: "purple",
    layout: "cover",
    body: "การคิดอย่างเป็นระบบ ฝึกถอดแก่นสาระสำคัญออกจากรายละเอียด และถ่ายทอดขั้นตอนการแก้ปัญหาด้วยอัลกอริทึมและผังงาน",
    quickCheck: {
      question: "แนวคิดเชิงคำนวณ (Computational Thinking) มีเป้าหมายสำคัญคือข้อใด?",
      choices: [
        "การคิดวิเคราะห์และแก้ปัญหาอย่างเป็นระบบเป็นขั้นตอน",
        "การท่องจำโค้ดภาษาคอมพิวเตอร์ให้ได้มากที่สุด",
        "การซื้ออุปกรณ์คอมพิวเตอร์ราคาแพง",
      ],
      answer: 0,
      feedback: "ถูกต้อง! แนวคิดเชิงคำนวณคือกระบวนการคิดแก้ปัญหาอย่างมีลำดับขั้นตอน",
    },
  },
  {
    title: "4 เสาหลักของแนวคิดเชิงคำนวณ (ม.1)",
    emoji: "🎯",
    theme: "blue",
    layout: "standard",
    body: "Computational Thinking คือ กระบวนการคิดวิเคราะห์อย่างเป็นระบบที่มนุษย์และคอมพิวเตอร์ใช้ร่วมกัน",
    bullets: [
      {
        emoji: "🧩",
        text: "Decomposition (การแยกย่อยปัญหา)",
        sub: "แบ่งปัญหาใหญ่ออกเป็นปัญหาย่อย ๆ ที่ไม่ซับซ้อนเพื่อให้จัดการได้ง่ายขึ้น",
      },
      {
        emoji: "🔍",
        text: "Pattern Recognition (การหารูปแบบ)",
        sub: "สังเกตความเหมือน สิ่งที่เกิดขึ้นซ้ำ ๆ เพื่อนำวิธีแก้ปัญหาเดิมมาใช้ซ้ำได้",
      },
      {
        emoji: "🎭",
        text: "Abstraction (การคิดเชิงนามธรรม)",
        sub: "คัดแยกสาระสำคัญออกจากรายละเอียดที่ไม่จำเป็น เพื่อให้เห็นแก่นของปัญหา",
      },
      {
        emoji: "📋",
        text: "Algorithm Design (การออกแบบอัลกอริทึม)",
        sub: "กำหนดลำดับขั้นตอนการทำงานที่ชัดเจน แม่นยำ และปฏิบัติได้จริง",
      },
    ],
    callout: {
      type: "tip",
      emoji: "💡",
      text: "การคิดเชิงคำนวณไม่ใช่แค่เรื่องของคอมพิวเตอร์ แต่เป็นวิธีคิดที่ใช้แก้ปัญหาในชีวิตประจำวันได้ทุกเรื่อง",
    },
    quickCheck: {
      question: "การแตกปัญหาใหญ่ออกเป็นปัญหาย่อยๆ ตรงกับเสาหลักใด?",
      choices: [
        "Decomposition (การแยกส่วนประกอบ)",
        "Pattern Recognition (การหารูปแบบ)",
        "Abstraction (การคิดเชิงนามธรรม)",
      ],
      answer: 0,
      feedback: "ยอดเยี่ยม! Decomposition คือการย่อยปัญหาใหญ่ให้เล็กลงเพื่อให้จัดการได้ง่ายขึ้น",
    },
  },
  {
    title: "การคิดเชิงนามธรรม (Abstraction) คืออะไร",
    emoji: "🎭",
    theme: "orange",
    layout: "standard",
    body: "การพิจารณาเฉพาะคุณสมบัติหรือข้อมูลที่จำเป็นต่อการแก้ปัญหา และตัดส่วนที่ไม่เกี่ยวข้องทิ้งไป",
    bullets: [
      {
        emoji: "📐",
        text: "ตัวอย่าง: รูปทรงเรขาคณิต",
        sub: "เมื่อต้องการหาพื้นที่รูปสี่เหลี่ยม สนใจเฉพาะ 'ความกว้าง' และ 'ความยาว' ไม่สนใจสีหรือลวดลาย",
      },
      {
        emoji: "🗺️",
        text: "ตัวอย่าง: แผนผังห้องเรียน",
        sub: "แสดงเฉพาะตำแหน่งโต๊ะครู โต๊ะนักเรียน และประตู ไม่ต้องวาดลายไม้บนโต๊ะ",
      },
      {
        emoji: "👔",
        text: "ตัวอย่าง: การซักผ้า",
        sub: "สนใจชนิดของผ้า (ผ้าขาว ผ้าสี ผ้าบาง) เพื่อตั้งค่าเครื่องซัก ไม่สนใจยี่ห้อเสื้อผ้า",
      },
    ],
    callout: {
      type: "tip",
      emoji: "✂️",
      text: "Abstraction ช่วยลดความซับซ้อน ทำให้สมองและคอมพิวเตอร์ประมวลผลได้อย่างรวดเร็วและแม่นยำ",
    },
    quickCheck: {
      question: "หัวใจสำคัญของการคิดเชิงนามธรรม (Abstraction) คืออะไร?",
      choices: [
        "คัดเลือกเฉพาะสาระสำคัญและตัดรายละเอียดที่ไม่จำเป็นออก",
        "การวาดรูปให้สวยงามสมจริงที่สุด",
        "การเก็บรายละเอียดทุกอย่างโดยไม่ตัดอะไรทิ้ง",
      ],
      answer: 0,
      feedback: "ถูกต้อง! การตัดสิ่งไม่จำเป็นออกและเน้นเฉพาะสาระสำคัญคือหัวใจของ Abstraction",
    },
  },
  {
    title: "การถ่ายทอดความคิด 3 รูปแบบ",
    emoji: "📝",
    theme: "green",
    layout: "standard",
    body: "เมื่อออกแบบขั้นตอนการแก้ปัญหาได้แล้ว สามารถสื่อสารออกมาได้ 3 รูปแบบ",
    bullets: [
      {
        emoji: "🗣️",
        text: "1. ภาษาธรรมชาติ (Natural Language)",
        sub: "เขียนบรรยายขั้นตอนเป็นภาษาพูดของมนุษย์ เข้าใจง่ายแต่อาจมีความกำกวม",
      },
      {
        emoji: "💻",
        text: "2. รหัสลำลอง (Pseudocode)",
        sub: "ข้อความสั้น ๆ กึ่งภาษาโปรแกรม มีโครงสร้างกระชับ ไม่ขึ้นกับภาษาคอมพิวเตอร์ใด",
      },
      {
        emoji: "📊",
        text: "3. ผังงาน (Flowchart)",
        sub: "ใช้ภาพสัญลักษณ์มาตรฐานสากลและลูกศร แสดงทิศทางการไหลของการทำงาน",
      },
    ],
    callout: {
      type: "fun",
      emoji: "🎨",
      text: "ผังงานช่วยให้เรามองเห็นภาพรวมของระบบและจุดตัดสินใจได้อย่างชัดเจนที่สุด",
    },
    quickCheck: {
      question: "การถ่ายทอดขั้นตอนการทำงานโดยใช้คำบรรยายภาษาธรรมชาติอย่างกระชับเรียกว่าอะไร?",
      choices: [
        "รหัสลำลอง (Pseudocode)",
        "ผังงาน (Flowchart)",
        "ภาษาเครื่อง (Machine Code)",
      ],
      answer: 0,
      feedback: "เก่งมาก! รหัสลำลองคือการเขียนขั้นตอนการทำงานด้วยภาษาคนอย่างกระชับ",
    },
  },
  {
    title: "สัญลักษณ์ผังงานมาตรฐานสากล",
    emoji: "💠",
    theme: "purple",
    layout: "standard",
    body: "สัญลักษณ์ของผังงาน (Flowchart Symbols) ที่ใช้สื่อสารตรงกันทั่วโลก",
    bullets: [
      {
        emoji: "⭕",
        text: "จุดเริ่มต้น / สิ้นสุด (Terminal)",
        sub: "รูปวงรี ใช้ระบุจุดเริ่มต้น (START) และจุดสิ้นสุด (STOP) ของผังงาน",
      },
      {
        emoji: "▭",
        text: "การประมวลผล (Process)",
        sub: "รูปสี่เหลี่ยมผืนผ้า ใช้แทนการคำนวณ การกำหนดค่า หรือการปฏิบัติงานทั่วไป",
      },
      {
        emoji: "◇",
        text: "การตัดสินใจ (Decision)",
        sub: "รูปสี่เหลี่ยมข้าวหลามตัด มีเงื่อนไขให้ตรวจสอบและมีเส้นทางแยก ใช่/ไม่ใช่",
      },
      {
        emoji: "▱",
        text: "การรับเข้า / แสดงผลทั่วไป (Input / Output)",
        sub: "รูปสี่เหลี่ยมด้านขนาน ใช้รับข้อมูลหรือแสดงผลลัพธ์โดยไม่ระบุอุปกรณ์",
      },
    ],
    callout: {
      type: "tip",
      emoji: "⬇️",
      text: "เส้นลูกศร (Flow Line) ต้องมีหัวลูกศรชี้ทิศทางเสมอ และเขียนจากบนลงล่าง หรือซ้ายไปขวา",
    },
    quickCheck: {
      question: "สัญลักษณ์สี่เหลี่ยมข้าวหลามตัด (Decision) ในผังงานใช้ทำหน้าที่ใด?",
      choices: [
        "การตัดสินใจตามเงื่อนไข (จริง/เท็จ)",
        "จุดเริ่มต้นหรือสิ้นสุดโปรแกรม",
        "การรับหรือแสดงผลข้อมูล",
      ],
      answer: 0,
      feedback: "ถูกต้อง! สี่เหลี่ยมข้าวหลามตัดใช้สำหรับตรวจสอบเงื่อนไขที่มีทางเลือกอย่างน้อย 2 ทาง",
    },
  },
  {
    title: "เคสตัวอย่าง: อัลกอริทึมการคำนวณพื้นที่และปูหญ้า",
    emoji: "🌱",
    theme: "green",
    layout: "standard",
    body: "โจทย์: คำนวณจำนวนแผ่นหญ้าสำหรับปูสนามฟุตบอลรูปสี่เหลี่ยมผืนผ้า (หญ้า 1 แผ่น = 0.5 x 0.5 ม.)",
    code: {
      lang: "pseudo",
      content: `START
  INPUT width, length
  COMPUTE field_area = width * length
  COMPUTE grass_area = 0.5 * 0.5
  COMPUTE total_grass = field_area / grass_area
  OUTPUT total_grass
STOP`,
    },
    bullets: [
      {
        emoji: "📥",
        text: "รับค่ากว้างและยาว",
        sub: "วัดขนาดสนามจริงเป็นเมตร",
      },
      {
        emoji: "⚙️",
        text: "คำนวณพื้นที่",
        sub: "หาพื้นที่สนามทั้งหมด และหารด้วยพื้นที่หญ้า 1 ผืน (0.25 ตร.ม.)",
      },
      {
        emoji: "📤",
        text: "แสดงผลลัพธ์",
        sub: "จำนวนแผ่นหญ้าทั้งหมดที่ต้องสั่งซื้อ",
      },
    ],
    quickCheck: {
      question: "ในการคำนวณพื้นที่สี่เหลี่ยมผืนผ้า ข้อมูลนำเข้า (Input) ที่จำเป็นต้องมีคืออะไร?",
      choices: [
        "ความกว้างและความยาว",
        "สีของหญ้าและชนิดของปุ๋ย",
        "สภาพอากาศในวันที่ปูหญ้า",
      ],
      answer: 0,
      feedback: "ถูกต้อง! ความกว้างและความยาวเป็นสาระสำคัญในการคำนวณพื้นที่",
    },
  },
  {
    title: "เปรียบเทียบ: รหัสลำลอง vs ผังงาน",
    emoji: "⚖️",
    theme: "blue",
    layout: "comparison",
    compareLeft: {
      title: "รหัสลำลอง (Pseudocode)",
      emoji: "💻",
      items: [
        "เขียนเป็นข้อความสั้น ๆ กระชับ คล้ายภาษาโปรแกรม",
        "พิมพ์ง่าย แก้ไขสะดวกรวดเร็ว ไม่ต้องวาดภาพ",
        "เหมาะสำหรับอัลกอริทึมที่ยาวและซับซ้อน",
        "แปลงไปเป็นโค้ดภาษา Python, C, Java ได้ทันที",
      ],
      color: "#3b82f6",
    },
    compareRight: {
      title: "ผังงาน (Flowchart)",
      emoji: "📊",
      items: [
        "ใช้ภาพสัญลักษณ์และลูกศร แสดงทิศทางการไหล",
        "เห็นภาพรวม ลำดับขั้นตอน และจุดตัดสินใจได้ชัดเจนทันที",
        "เหมาะสำหรับอธิบายให้ผู้อื่นหรือผู้ใช้งานที่ไม่ใช่โปรแกรมเมอร์เข้าใจ",
        "ถ้าโปรแกรมยาวมาก ผังงานจะใหญ่และวาดค่อนข้างยาก",
      ],
      color: "#16a34a",
    },
    callout: {
      type: "tip",
      emoji: "💡",
      text: "โปรแกรมเมอร์นิยมใช้ทั้งสองอย่าง: ร่างผังงานเพื่อดูภาพรวม แล้วเขียนรหัสลำลองก่อนลงมือโค้ดจริง",
    },
    quickCheck: {
      question: "ข้อดีที่เด่นชัดของผังงาน (Flowchart) เมื่อเทียบกับรหัสลำลองคือข้อใด?",
      choices: [
        "มองเห็นลำดับทิศทางและการไหลของข้อมูลได้ชัดเจนด้วยภาพ",
        "เขียนได้เร็วกว่าและไม่ต้องใช้รูปสัญลักษณ์",
        "ใช้กระดาษน้อยกว่า",
      ],
      answer: 0,
      feedback: "ยอดเยี่ยม! ผังงานใช้ภาพและลูกศรทำให้เห็นเส้นทางการทำงานได้อย่างชัดเจนทันที",
    },
  },
  {
    title: "โครงสร้างการทำงาน 3 รูปแบบของอัลกอริทึม",
    emoji: "🔀",
    theme: "purple",
    layout: "standard",
    body: "ไม่ว่าโปรแกรมจะใหญ่แค่ไหน ล้วนประกอบขึ้นจากโครงสร้างพื้นฐาน 3 แบบนี้",
    bullets: [
      {
        emoji: "⬇️",
        text: "1. โครงสร้างแบบเรียงลำดับ (Sequence)",
        sub: "ทำงานเรียงตามลำดับจากบนลงล่าง ทีละคำสั่ง ไม่มีการข้ามหรือย้อนกลับ",
      },
      {
        emoji: "🔀",
        text: "2. โครงสร้างแบบเลือกทำ (Selection / Condition)",
        sub: "มีการตัดสินใจตรวจสอบเงื่อนไข ถ้าจริงทำอย่างหนึ่ง ถ้าเท็จทำอีกอย่างหนึ่ง (IF-THEN-ELSE)",
      },
      {
        emoji: "🔄",
        text: "3. โครงสร้างแบบทำซ้ำ (Iteration / Loop)",
        sub: "ทำคำสั่งเดิมซ้ำ ๆ ตามจำนวนรอบที่กำหนด หรือทำซ้ำจนกว่าเงื่อนไขจะเป็นจริง (FOR, WHILE)",
      },
    ],
    callout: {
      type: "fun",
      emoji: "🧱",
      text: "ทั้ง 3 โครงสร้างนี้เหมือนตัวต่อเลโก้ นำมาต่อเรียงและซ้อนกันเพื่อสร้างซอฟต์แวร์ระดับโลก",
    },
    quickCheck: {
      question: "โครงสร้างการทำงานพื้นฐานของอัลกอริทึมมี 3 รูปแบบอะไรบ้าง?",
      choices: [
        "แบบเรียงลำดับ แบบเลือกทำ และแบบทำซ้ำ",
        "แบบเร็ว แบบปานกลาง และแบบช้า",
        "แบบตัวเลข แบบตัวอักษร และแบบภาพ",
      ],
      answer: 0,
      feedback: "ถูกต้อง! Sequence, Selection และ Repetition คือ 3 โครงสร้างหลักในการเขียนโปรแกรม",
    },
  },
  {
    title: "สรุปแก่นสาระ: แนวคิดเชิงนามธรรมและอัลกอริทึม",
    emoji: "📌",
    theme: "orange",
    layout: "standard",
    body: "หัวใจสำคัญของวิทยาการคำนวณระดับ ม.1",
    bullets: [
      {
        emoji: "🎭",
        text: "มองเห็นเฉพาะแก่น",
        sub: "ใช้ Abstraction ตัดสิ่งไม่เกี่ยวทิ้ง เพื่อแก้ปัญหาได้รวดเร็วและตรงจุด",
      },
      {
        emoji: "📋",
        text: "สื่อสารอย่างรัดกุม",
        sub: "ถ่ายทอดขั้นตอนเป็นภาษาธรรมชาติ รหัสลำลอง และผังงานมาตรฐาน",
      },
      {
        emoji: "🧱",
        text: "โครงสร้าง 3 ประสาน",
        sub: "เรียงลำดับ เลือกทำ และทำซ้ำ คือรากฐานของการเขียนโปรแกรมทุกภาษา",
      },
    ],
    callout: {
      type: "fun",
      emoji: "🚀",
      text: "วางแผนอัลกอริทึมได้แม่นยำ จะทำให้การเขียนโปรแกรมด้วย Scratch ในหน่วยถัดไปง่ายเหมือนปอกกล้วย!",
    },
    quickCheck: {
      question: "ทำไมการออกแบบอัลกอริทึมที่ดีจึงต้องให้ผู้อื่นนำไปปฏิบัติตามได้?",
      choices: [
        "เพราะความชัดเจนไม่กำกวมทำให้คอมพิวเตอร์หรือคนทำงานได้ผลลัพธ์ถูกต้องเสมอ",
        "เพื่อให้ผู้อื่นเดาคำสั่งเอาเองได้",
        "เพื่อไม่ให้ใครเข้าใจโค้ด",
      ],
      answer: 0,
      feedback: "เก่งมาก! อัลกอริทึมที่ดีต้องชัดเจน รัดกุม และให้ผลลัพธ์ถูกต้องตรงกันทุกครั้ง",
    },
  },
  {
    title: "ตรวจความเข้าใจประจำหน่วย",
    emoji: "✅",
    theme: "blue",
    layout: "standard",
    bullets: [
      {
        emoji: "❓",
        text: "การคิดเชิงนามธรรม (Abstraction) ช่วยให้การแก้ปัญหาง่ายขึ้นอย่างไร จงยกตัวอย่างในชีวิตประจำวัน",
        sub: "อธิบายการตัดรายละเอียดที่ไม่จำเป็น",
      },
      {
        emoji: "❓",
        text: "รหัสลำลอง (Pseudocode) แตกต่างจากภาษาธรรมชาติอย่างไร และมีข้อดีอย่างไร",
        sub: "เปรียบเทียบความชัดเจนและความกระชับ",
      },
      {
        emoji: "❓",
        text: "สัญลักษณ์สี่เหลี่ยมข้าวหลามตัด (Decision) ในผังงาน ทำหน้าที่อะไร และมีเส้นทางออกจากกล่องกี่ทาง",
        sub: "ระบุหน้าที่และทางเลือกของเงื่อนไข",
      },
      {
        emoji: "❓",
        text: "จงอธิบายความแตกต่างระหว่างโครงสร้างแบบเลือกทำ และโครงสร้างแบบทำซ้ำ",
        sub: "พร้อมยกตัวอย่างสถานการณ์จริง",
      },
    ],
    callout: {
      type: "fun",
      emoji: "🏆",
      text: "เก่งมาก! คุณผ่านรากฐานแนวคิดเชิงนามธรรมและอัลกอริทึม ม.1 เรียบร้อยแล้ว",
    },
    quickCheck: {
      question: "หากต้องการแก้ปัญหาที่ซับซ้อน ควรเริ่มต้นด้วยกระบวนการใดตามแนวคิดเชิงคำนวณ?",
      choices: [
        "ย่อยปัญหาใหญ่เป็นปัญหาย่อย (Decomposition) และจับเฉพาะสาระสำคัญ (Abstraction)",
        "ลงมือเขียนโค้ดภาษาคอมพิวเตอร์ทันทีโดยไม่วางแผน",
        "รอให้มีคนเขียนโปรแกรมให้",
      ],
      answer: 0,
      feedback: "ยอดเยี่ยม! การย่อยปัญหาและคัดเลือกสาระสำคัญเป็นก้าวแรกที่สำคัญที่สุด",
    },
  },
];

// ===========================================================================
// ม.1 วิทยาการคำนวณ — หน่วย 2: Scratch + ข้อมูล + ความปลอดภัย
// ตัวชี้วัด ว 4.2 ม.1/2 (เขียนโปรแกรม) · ม.1/3 (ข้อมูล) · ม.1/4 (ปลอดภัย)
// ===========================================================================
const m1_cs_unit2: RichSlide[] = [
  {
    title: '🐱 เขียนโปรแกรมด้วย Scratch',
    emoji: '🐱',
    theme: 'orange',
    layout: 'cover',
    body: 'หน่วยนี้เราจะลากบล็อกคำสั่งสร้างโปรแกรมจริง จัดการข้อมูล และใช้เทคโนโลยีอย่างปลอดภัย',
    image: img('photo-1610484826967-09c5720778c7'),
    imageCaption: 'Scratch — เขียนโปรแกรมแบบลากบล็อก ของ MIT',
  },
  {
    title: 'ว 4.2 ม.1/2 — Scratch ทำงานอย่างไร',
    emoji: '🧩',
    theme: 'blue',
    layout: 'standard',
    body: 'Scratch ต่อบล็อกคำสั่งเหมือนตัวต่อเลโก้ — สั่งให้ตัวละคร (Sprite) ทำงานตามลำดับ',
    bullets: [
      { emoji: '🎬', text: 'เหตุการณ์ (Events)', sub: 'เริ่มทำงานเมื่อ... เช่น คลิกธงเขียว / กดปุ่ม' },
      { emoji: '🏃', text: 'การเคลื่อนไหว (Motion)', sub: 'เดิน หมุน เปลี่ยนตำแหน่ง' },
      { emoji: '🔁', text: 'การวนซ้ำ (Loops)', sub: 'ทำซ้ำ N ครั้ง / ทำซ้ำตลอดไป' },
      { emoji: '❓', text: 'เงื่อนไข (If-Then)', sub: 'ถ้า...แล้วทำ... ไม่งั้นทำอีกอย่าง' },
    ],
    callout: { type: 'tip', emoji: '💻', text: 'เปิด scratch.mit.edu/projects/editor เล่นได้เลย ไม่ต้องติดตั้ง' },
  },
  {
    title: 'ตัวแปร (Variable) — กล่องเก็บค่า',
    emoji: '📦',
    theme: 'purple',
    layout: 'standard',
    body: 'ตัวแปรคือกล่องที่ตั้งชื่อได้ ใช้เก็บตัวเลขหรือข้อความที่เปลี่ยนค่าได้ระหว่างโปรแกรมทำงาน',
    bullets: [
      { emoji: '🎯', text: 'ตัวอย่าง: คะแนน (score)', sub: 'เริ่มที่ 0 → เก็บของได้ +1 ทุกครั้ง' },
      { emoji: '❤️', text: 'ตัวอย่าง: ชีวิต (lives)', sub: 'เริ่มที่ 3 → โดนศัตรู −1' },
      { emoji: '⏱️', text: 'ตัวอย่าง: เวลา (timer)', sub: 'นับถอยหลังจาก 60 → 0' },
    ],
    teachingNote: {
      explain: 'ตัวแปรทำให้โปรแกรม "จำ" ค่าได้ เช่น เกมต้องจำคะแนนของผู้เล่น',
      example: 'สร้างตัวแปร score → ตั้งค่า score = 0 → เมื่อชนเหรียญ: เปลี่ยน score ทีละ 1',
      prompt: 'ถ้าจะทำเกมจับเวลา ควรใช้ตัวแปรชื่ออะไร และเริ่มที่เท่าไหร่?',
    },
  },
  {
    title: 'ตัวอย่างโปรแกรม: นับเลข 1–10',
    emoji: '🔢',
    theme: 'green',
    layout: 'standard',
    body: 'ใช้ตัวแปร + การวนซ้ำ แก้ปัญหาทางคณิตศาสตร์ (ตามตัวชี้วัด ม.1/2)',
    code: {
      lang: 'scratch',
      content: `เมื่อคลิกธงเขียว
  ตั้งค่า [i] = 1
  ทำซ้ำ 10 ครั้ง
      พูด (i) เป็นเวลา 1 วินาที
      เปลี่ยน [i] ทีละ 1
  พูด "จบแล้ว!"`,
    },
    callout: { type: 'fun', emoji: '🧠', text: 'ลองเปลี่ยน "ทำซ้ำ 10 ครั้ง" เป็น 5 → โปรแกรมนับถึงเท่าไหร่?' },
  },
  {
    title: 'ว 4.2 ม.1/3 — ข้อมูลปฐมภูมิ vs ทุติยภูมิ',
    emoji: '📊',
    theme: 'blue',
    layout: 'comparison',
    body: 'ก่อนประมวลผลข้อมูล ต้องรู้ว่าข้อมูลมาจากไหน',
    compareLeft: {
      title: 'ปฐมภูมิ (Primary)', emoji: '🙋', color: '#3b82f6',
      items: ['เก็บเอง โดยตรง', 'สำรวจ / สอบถาม / วัดผล', 'เช่น แบบสอบถามเพื่อนในห้อง', 'ใหม่ สด เชื่อถือได้'],
    },
    compareRight: {
      title: 'ทุติยภูมิ (Secondary)', emoji: '📚', color: '#a855f7',
      items: ['คนอื่นเก็บไว้แล้ว', 'หนังสือ เว็บ รายงาน', 'เช่น สถิติจากเว็บราชการ', 'สะดวก แต่ต้องตรวจแหล่งที่มา'],
    },
  },
  {
    title: 'ประมวลผล + นำเสนอข้อมูลด้วยซอฟต์แวร์',
    emoji: '📈',
    theme: 'green',
    layout: 'standard',
    body: 'เก็บข้อมูลแล้ว → จัดการ → ทำให้เข้าใจง่ายด้วยกราฟ/ตาราง',
    bullets: [
      { emoji: '📋', text: 'Google Sheets / Excel', sub: 'กรอกข้อมูลลงตาราง คำนวณผลรวม เฉลี่ย' },
      { emoji: '📊', text: 'สร้างกราฟ', sub: 'แท่ง = เปรียบเทียบ · วงกลม = สัดส่วน · เส้น = แนวโน้ม' },
      { emoji: '🎨', text: 'Canva / Infographic', sub: 'นำเสนอข้อมูลให้สวยและเข้าใจง่าย' },
    ],
    callout: { type: 'tip', emoji: '🎯', text: 'เลือกกราฟให้ตรงกับข้อมูล — กราฟผิดประเภททำให้เข้าใจผิดได้' },
  },
  {
    title: 'ว 4.2 ม.1/4 — ภัยคุกคามออนไลน์',
    emoji: '⚠️',
    theme: 'red',
    layout: 'standard',
    body: 'ใช้เทคโนโลยีให้เป็น ต้องรู้ทันภัยด้วย',
    bullets: [
      { emoji: '🎣', text: 'ฟิชชิ่ง (Phishing)', sub: 'ลิงก์/อีเมลหลอกเอารหัสผ่าน' },
      { emoji: '🦠', text: 'มัลแวร์ (Malware)', sub: 'ไวรัสแฝงในไฟล์/แอปเถื่อน' },
      { emoji: '👤', text: 'ข้อมูลส่วนตัวรั่ว', sub: 'อย่าแชร์เลขบัตร ที่อยู่ รหัสผ่าน' },
      { emoji: '😢', text: 'Cyberbullying', sub: 'การกลั่นแกล้งออนไลน์ — บอกผู้ใหญ่' },
    ],
    callout: { type: 'warn', emoji: '🔒', text: 'ตั้งรหัสผ่านให้เดายาก ไม่ใช้ซ้ำกันทุกแอป และเปิดการยืนยันตัวตน 2 ชั้น (2FA) ถ้ามี' },
  },
  {
    title: 'ใช้สื่อและแหล่งข้อมูลอย่างถูกต้อง',
    emoji: '⚖️',
    theme: 'purple',
    layout: 'standard',
    body: 'รู้เท่าทันสื่อ + เคารพลิขสิทธิ์ (ตามข้อกำหนดและข้อตกลง)',
    bullets: [
      { emoji: '🔍', text: 'ตรวจแหล่งที่มา', sub: 'ใคร เขียน เมื่อไหร่ น่าเชื่อถือไหม' },
      { emoji: '©️', text: 'ให้เครดิต / อ้างอิง', sub: 'ใช้ภาพ-ข้อความคนอื่นต้องบอกที่มา' },
      { emoji: '🆓', text: 'ใช้สื่อลิขสิทธิ์เปิด', sub: 'Creative Commons, ภาพฟรี เช่น Unsplash' },
      { emoji: '🤔', text: 'คิดก่อนแชร์', sub: 'จริงหรือมั่ว? แชร์แล้วมีผลอย่างไร' },
    ],
    teachingNote: {
      explain: 'การรู้เท่าทันสื่อคือทักษะสำคัญ — ข่าวปลอมแพร่เร็วกว่าข่าวจริง',
      example: 'เจอข่าว "ดื่มน้ำมะนาวรักษามะเร็ง" → ตรวจแหล่งที่มา → ไม่มีงานวิจัยรองรับ → ไม่แชร์',
      prompt: 'ก่อนแชร์โพสต์หนึ่ง ควรถามตัวเอง 3 คำถามอะไรบ้าง?',
    },
  },
  {
    title: 'สรุปหน่วย 2',
    emoji: '✅',
    theme: 'green',
    layout: 'standard',
    body: 'ครบทั้ง 3 ตัวชี้วัด — เขียนโปรแกรม จัดการข้อมูล และใช้อย่างปลอดภัย',
    bullets: [
      { emoji: '🐱', text: 'ม.1/2 เขียน Scratch', sub: 'ตัวแปร · เงื่อนไข · วนซ้ำ แก้ปัญหาได้' },
      { emoji: '📊', text: 'ม.1/3 จัดการข้อมูล', sub: 'เก็บ → ประมวลผล → นำเสนอด้วยกราฟ' },
      { emoji: '🔒', text: 'ม.1/4 ใช้ปลอดภัย', sub: 'รู้ทันภัย เคารพลิขสิทธิ์ รู้เท่าทันสื่อ' },
    ],
    callout: { type: 'fun', emoji: '🎮', text: 'ทำแบบทดสอบท้ายหน่วย + เล่นเกมในเว็บเพื่อเก็บคะแนน XP!' },
  },
];

// ===========================================================================
// ม.2 วิทยาการคำนวณ — Python (หน่วย 2)
// ===========================================================================
const m2_cs_unit2: RichSlide[] = [
  {
    title: "🐍 เขียนโปรแกรม Python — ตรรกะและฟังก์ชัน",
    emoji: "🐍",
    theme: "green",
    layout: "cover",
    body: "ก้าวสู่การเขียนโปรแกรมเชิงข้อความด้วยภาษา Python ภาษาที่ได้รับความนิยมสูงสุดในโลก ทั้งงาน AI, Data Science และเว็บแอปพลิเคชัน",
    quickCheck: {
      question: "ภาษา Python มีลักษณะเด่นที่ทำให้เป็นที่นิยมทั่วโลกคือข้อใด?",
      choices: [
        "ไวยากรณ์กระชับ อ่านง่าย ใกล้เคียงภาษาอังกฤษ",
        "ต้องใช้อุปกรณ์เฉพาะเท่านั้นในการรัน",
        "ไม่มีไลบรารีหรือโมดูลช่วยทำงาน",
      ],
      answer: 0,
      feedback: "ถูกต้อง! Python ออกแบบมาให้อ่านง่าย เขียนง่าย และทรงพลัง",
    },
  },
  {
    title: "ทำไมทั่วโลกจึงเลือกใช้ภาษา Python",
    emoji: "🌟",
    theme: "blue",
    layout: "standard",
    body: "จุดเด่นที่ทำให้ Python เป็นภาษายอดนิยมอันดับ 1 สำหรับผู้เริ่มต้นและผู้เชี่ยวชาญ",
    bullets: [
      {
        emoji: "📖",
        text: "ไวยากรณ์เรียบง่ายเหมือนภาษาอังกฤษ",
        sub: "print('Hello World') คำสั่งสั้น ชัดเจน ไม่ต้องพิมพ์เครื่องหมายเซมิโคลอน (;) ปิดท้ายทุกบรรทัด",
      },
      {
        emoji: "🤖",
        text: "รากฐานของปัญญาประดิษฐ์ (AI & ML)",
        sub: "Google, OpenAI, Meta และ NASA ล้วนใช้ Python ในการสร้างระบบโมเดล AI",
      },
      {
        emoji: "📊",
        text: "มีไลบรารีครอบคลุมทุกงาน",
        sub: "วิเคราะห์ข้อมูล (Pandas), แสดงกราฟ (Matplotlib), ทำเว็บ (Django/FastAPI), ทำเกม (Pygame)",
      },
    ],
    callout: {
      type: "tip",
      emoji: "💡",
      text: "Python ใช้ 'การเยื้องหน้า' (Indentation / Tab) เพื่อแบ่งบล็อกคำสั่ง ช่วยให้โค้ดสะอาดและอ่านง่ายเสมอ",
    },
    quickCheck: {
      question: "งานด้านใดที่ภาษา Python ได้รับความนิยมและเป็นมาตรฐานระดับโลก?",
      choices: [
        "Data Science, AI และ Machine Learning",
        "การออกแบบวงจรรวมบนแผ่นเวเฟอร์โดยตรง",
        "การสร้างภาพยนตร์ 3D ในโรงงานอุตสาหกรรมหนัก",
      ],
      answer: 0,
      feedback: "ยอดเยี่ยม! Python เป็นภาษาหลักของวงการวิทยาศาสตร์ข้อมูลและปัญญาประดิษฐ์",
    },
  },
  {
    title: "ตัวแปร ชนิดข้อมูล และการรับ/แสดงผล",
    emoji: "📝",
    theme: "orange",
    layout: "standard",
    body: "การเก็บข้อมูลและการสื่อสารระหว่างผู้ใช้กับโปรแกรม",
    code: {
      lang: "python",
      content: `# รับข้อมูลจากแป้นพิมพ์ (ได้เป็นข้อความ string)
name = input("กรุณากรอกชื่อ: ")
age = int(input("กรุณากรอกอายุ: "))  # แปลงเป็นจำนวนเต็ม int
height = float(input("กรุณากรอกส่วนสูง (ซม.): ")) # ทศนิยม float

# แสดงผลแบบ f-string
print(f"สวัสดีคุณ {name} อายุ {age} ปี สูง {height} ซม.")
print(f"อีก 5 ปีข้างหน้า คุณจะอายุ {age + 5} ปี")`,
    },
    bullets: [
      {
        emoji: "🔤",
        text: "str (ข้อความ)",
        sub: "ข้อความครอบด้วยเครื่องหมายอัญประกาศ เช่น 'สมชาย'",
      },
      {
        emoji: "🔢",
        text: "int & float",
        sub: "int คือจำนวนเต็ม เช่น 14, float คือทศนิยม เช่น 165.5",
      },
      {
        emoji: "✅",
        text: "bool (ตรรกะ)",
        sub: "ค่าความจริง มีเพียง 2 ค่าคือ True หรือ False",
      },
    ],
    quickCheck: {
      question: "หากรับข้อมูลผ่านคำสั่ง input() แล้วต้องการนำไปคำนวณบวกลบคูณหาร ต้องทำอย่างไร?",
      choices: [
        "แปลงชนิดข้อมูลด้วย int() หรือ float() ก่อน",
        "นำไปคำนวณได้ทันทีโดยไม่ต้องแปลง",
        "ใส่เครื่องหมายคำพูดครอบตัวแปร",
      ],
      answer: 0,
      feedback: "ถูกต้อง! input() คืนค่าเป็น string เสมอ จึงต้องแปลงเป็น int หรือ float ก่อนคำนวณ",
    },
  },
  {
    title: "ตัวดำเนินการเปรียบเทียบและตรรกะศาสตร์",
    emoji: "⚙️",
    theme: "purple",
    layout: "standard",
    body: "เครื่องมือในการตัดสินใจและประเมินเงื่อนไขทางคณิตศาสตร์",
    bullets: [
      {
        emoji: "🔢",
        text: "ตัวดำเนินการเปรียบเทียบ",
        sub: "== (เท่ากับ), != (ไม่เท่ากับ), > (มากกว่า), < (น้อยกว่า), >= (มากกว่าหรือเท่ากับ), <= (น้อยกว่าหรือเท่ากับ)",
      },
      {
        emoji: "🤝",
        text: "and (และ)",
        sub: "จริงเมื่อทั้งสองเงื่อนไขเป็นจริงทั้งคู่ เช่น (age >= 13 and age <= 15)",
      },
      {
        emoji: "🔀",
        text: "or (หรือ)",
        sub: "จริงเมื่อเงื่อนไขใดเงื่อนไขหนึ่งเป็นจริง เช่น (score >= 80 or has_award == True)",
      },
      {
        emoji: "🔄",
        text: "not (นิเสธ/ไม่)",
        sub: "กลับค่าความจริง จาก True เป็น False, จาก False เป็น True",
      },
    ],
    callout: {
      type: "fun",
      emoji: "🎯",
      text: "ระวัง! ใน Python เครื่องหมาย = ใช้กำหนดค่า แต่ == ใช้เปรียบเทียบความเท่ากัน",
    },
    quickCheck: {
      question: "นิพจน์ (5 > 3) and (10 < 2) ให้ผลลัพธ์เป็นค่าความจริงใด?",
      choices: ["False (เท็จ)", "True (จริง)", "Error"],
      answer: 0,
      feedback: "เก่งมาก! ตัวเชื่อม and ต้องการความจริงทั้งสองฝั่ง แต่ 10 < 2 เป็นเท็จ ผลลัพธ์จึงเป็น False",
    },
  },
  {
    title: "โครงสร้างเงื่อนไข: if - elif - else",
    emoji: "🔀",
    theme: "blue",
    layout: "standard",
    body: "การสร้างทางเลือกหลายเงื่อนไข เช่น โปรแกรมคำนวณตัดเกรด",
    code: {
      lang: "python",
      content: `score = int(input("กรอกคะแนน (0-100): "))

if score >= 80:
    print("ผลการเรียน: เกรด 4 (ยอดเยี่ยม!)")
elif score >= 70:
    print("ผลการเรียน: เกรด 3 (ดีมาก)")
elif score >= 60:
    print("ผลการเรียน: เกรด 2 (ดี)")
elif score >= 50:
    print("ผลการเรียน: เกรด 1 (ผ่านเกณฑ์)")
else:
    print("ผลการเรียน: เกรด 0 (ต้องสอบซ่อม)")`,
    },
    callout: {
      type: "tip",
      emoji: "📐",
      text: "เงื่อนไขจะถูกตรวจทีละบรรทัดจากบนลงล่าง เมื่อเจอเงื่อนไขที่เป็นจริง จะทำคำสั่งนั้นแล้วออกจากบล็อกทันที",
    },
    quickCheck: {
      question: "ในภาษา Python คำสั่งที่อยู่ภายใต้เงื่อนไข if ต้องทำสิ่งใดเพื่อบอกขอบเขตการทำงาน?",
      choices: [
        "เว้นระยะย่อหน้า (Indentation) ให้ตรงกัน",
        "ใส่เครื่องหมายปีกกา { } ครอบ",
        "พิมพ์คำว่า BEGIN และ END",
      ],
      answer: 0,
      feedback: "ถูกต้อง! Python ใช้การย่อหน้า (Indentation) ในการกำหนดบล็อกคำสั่ง",
    },
  },
  {
    title: "การวนซ้ำ: for loop vs while loop",
    emoji: "🔄",
    theme: "red",
    layout: "comparison",
    compareLeft: {
      title: "for loop (รู้จำนวนรอบแน่นอน)",
      emoji: "🔢",
      items: [
        "ใช้ทำซ้ำตามจำนวนรอบที่ระบุ เช่น ทำซ้ำ 10 รอบ",
        "โค้ด: for i in range(1, 6):",
        "พิมพ์ค่า: 1, 2, 3, 4, 5",
        "ใช้ท่องไปในรายการข้อมูล (List, ข้อความ) ได้ง่ายดาย",
        "ปลอดภัย โอกาสเกิดลูปค้างต่ำมาก",
      ],
      color: "#3b82f6",
    },
    compareRight: {
      title: "while loop (ทำซ้ำตามเงื่อนไข)",
      emoji: "⏳",
      items: [
        "ทำซ้ำในขณะที่เงื่อนไขยังคงเป็น True",
        "โค้ด: while count < 5:",
        "ต้องมีคำสั่งเพิ่มค่าตัวนับ count += 1 เสมอ",
        "เหมาะกับสถานการณ์ที่ไม่รู้ว่าจะต้องทำกี่รอบ (เช่น รอผู้ใช้กรอกรหัสผ่านถูก)",
        "ข้อควรระวัง: ถ้าลืมเพิ่มค่า จะเกิด Infinite Loop เครื่องค้าง",
      ],
      color: "#ec4899",
    },
    callout: {
      type: "warn",
      emoji: "⚠️",
      text: "หากโปรแกรมค้างเพราะ Infinite Loop ในเทอร์มินัล ให้กด Ctrl + C เพื่อสั่งหยุดการทำงานทันที",
    },
    quickCheck: {
      question: "เมื่อเราทราบจำนวนรอบที่แน่นอน เช่น ทำซ้ำ 10 ครั้ง ควรเลือกใช้โครงสร้างการวนซ้ำแบบใด?",
      choices: [
        "for loop (เช่น for i in range(10):)",
        "while True โดยไม่มีเงื่อนไขหยุด",
        "if - else",
      ],
      answer: 0,
      feedback: "ยอดเยี่ยม! for loop เหมาะอย่างยิ่งกับกรณีที่ทราบขอบเขตหรือจำนวนรอบล่วงหน้า",
    },
  },
  {
    title: "ฟังก์ชัน (Function): โค้ดที่นำกลับมาใช้ซ้ำได้",
    emoji: "⚙️",
    theme: "purple",
    layout: "standard",
    body: "การจัดกลุ่มคำสั่งเป็นชุด เพื่อเรียกใช้งานได้หลายครั้งโดยไม่ต้องเขียนโค้ดซ้ำ",
    code: {
      lang: "python",
      content: `# ประกาศฟังก์ชันคำนวณดัชนีมวลกาย (BMI)
def calculate_bmi(weight_kg, height_cm):
    height_m = height_cm / 100
    bmi = weight_kg / (height_m ** 2)
    return round(bmi, 2)

# เรียกใช้งานฟังก์ชัน
my_bmi = calculate_bmi(55, 165)
print(f"ค่า BMI ของคุณคือ: {my_bmi}")

friend_bmi = calculate_bmi(70, 175)
print(f"ค่า BMI ของเพื่อนคือ: {friend_bmi}")`,
    },
    callout: {
      type: "tip",
      emoji: "🎁",
      text: "ฟังก์ชันที่ดีควรรับค่าพารามิเตอร์เข้ามา คำนวณ แล้วส่งผลลัพธ์กลับไปด้วยคำสั่ง return",
    },
    quickCheck: {
      question: "คำสำคัญ (Keyword) ใดใน Python ที่ใช้สำหรับสร้างฟังก์ชันขึ้นมาใหม่?",
      choices: ["def", "func", "create"],
      answer: 0,
      feedback: "ถูกต้อง! คำว่า def ย่อมาจาก define ใช้ในการประกาศสร้างฟังก์ชันใหม่",
    },
  },
  {
    title: "โครงสร้างข้อมูลพื้นฐาน: List (รายการข้อมูล)",
    emoji: "📦",
    theme: "orange",
    layout: "standard",
    body: "ตัวแปรกล่องใหญ่ที่สามารถเก็บข้อมูลได้หลายตัวพร้อมกันในชื่อเดียว",
    code: {
      lang: "python",
      content: `# สร้าง List เก็บรายชื่อเพื่อน
friends = ["น้ำทิพย์", "กิตติ", "ศิริพร", "ธีรภัทร"]

# เข้าถึงข้อมูลด้วย Index (เริ่มจาก 0)
print(friends[0])  # แสดง: น้ำทิพย์

# เพิ่มข้อมูลใหม่
friends.append("ปกรณ์")

# วนลูปแสดงชื่อทุกคน
for name in friends:
    print(f"- สวัสดีเพื่อน {name}")`,
    },
    callout: {
      type: "fun",
      emoji: "💡",
      text: "ในโลกการเขียนโปรแกรม คอมพิวเตอร์จะนับตำแหน่งแรกเป็นเลข 0 เสมอ!",
    },
    quickCheck: {
      question: "หากผลไม้ = [\"apple\", \"banana\", \"cherry\"] คำสั่ง ผลไม้[0] จะได้ผลลัพธ์เป็นอะไร?",
      choices: ["\"apple\"", "\"banana\"", "\"cherry\""],
      answer: 0,
      feedback: "เก่งมาก! ดัชนี (Index) ของ List ใน Python เริ่มต้นที่ตำแหน่ง 0 เสมอ",
    },
  },
  {
    title: "ปฏิบัติการ: โปรแกรมคิดเงินร้านค้าสหกรณ์",
    emoji: "🛒",
    theme: "green",
    layout: "standard",
    body: "โจทย์ท้าทาย: บูรณาการตัวแปร ลูป เงื่อนไข และฟังก์ชัน สร้างระบบคิดเงินจริง",
    bullets: [
      {
        emoji: "1️⃣",
        text: "รับราคาสินค้าด้วย while loop",
        sub: "รับราคาสินค้าไปเรื่อย ๆ จนกว่าผู้ใช้จะพิมพ์เลข 0 เพื่อบอกว่าเสร็จสิ้น",
      },
      {
        emoji: "2️⃣",
        text: "คำนวณส่วนลดด้วย if-elif-else",
        sub: "ถ้ายอดรวมเกิน 500 บาท ลด 10%, เกิน 200 บาท ลด 5%, น้อยกว่านั้นไม่ลด",
      },
      {
        emoji: "3️⃣",
        text: "แสดงใบเสร็จรับเงิน",
        sub: "พิมพ์ยอดรวม ยอดส่วนลด และยอดเงินสุทธิที่ต้องชำระ",
      },
    ],
    callout: {
      type: "tip",
      emoji: "🎯",
      text: "นี่คือตรรกะเดียวกันกับที่โปรแกรมแคชเชียร์ในร้านสะดวกซื้อ 7-Eleven ใช้ทำงานจริง",
    },
    quickCheck: {
      question: "การเก็บราคาสินค้าหลายชิ้นใน List แล้วใช้ for loop เพื่อหาผลรวมราคาทั้งหมด เป็นประโยชน์ของสิ่งใด?",
      choices: [
        "การประมวลผลข้อมูลร่วมกับโครงสร้างการวนซ้ำ",
        "การทำให้เครื่องทำงานช้าลง",
        "การป้องกันไม่ให้โปรแกรมทำงาน",
      ],
      answer: 0,
      feedback: "ถูกต้อง! การวนซ้ำใน List ช่วยจัดการข้อมูลจำนวนมากได้อย่างมีประสิทธิภาพ",
    },
  },
  {
    title: "ตรวจความเข้าใจประจำหน่วย",
    emoji: "✅",
    theme: "blue",
    layout: "standard",
    bullets: [
      {
        emoji: "❓",
        text: "ทำไมการรับค่าผ่านคำสั่ง input() เมื่อต้องการนำไปคำนวณจึงต้องครอบด้วย int() หรือ float() เสมอ",
        sub: "อธิบายชนิดข้อมูลเริ่มต้นของ input()",
      },
      {
        emoji: "❓",
        text: "ตัวดำเนินการ 'and' และ 'or' ให้ผลลัพธ์ความจริงแตกต่างกันอย่างไร จงยกตัวอย่าง",
        sub: "เปรียบเทียบตารางค่าความจริง",
      },
      {
        emoji: "❓",
        text: "สถานการณ์ใดควรเลือกใช้ for loop และสถานการณ์ใดควรเลือกใช้ while loop",
        sub: "วิเคราะห์จากเงื่อนไขการรู้จำนวนรอบ",
      },
      {
        emoji: "❓",
        text: "การเขียนฟังก์ชัน (def) มีประโยชน์ต่อการเขียนโปรแกรมขนาดใหญ่อย่างไร",
        sub: "ระบุข้อดีอย่างน้อย 2 ประการ",
      },
    ],
    callout: {
      type: "fun",
      emoji: "🏆",
      text: "ยินดีด้วย! คุณผ่านด่านการเขียนโปรแกรม Python ด้วยตรรกะและฟังก์ชัน ม.2 เรียบร้อยแล้ว",
    },
    quickCheck: {
      question: "ข้อใดคือประโยชน์หลักของการเขียนฟังก์ชัน (def) ในโปรแกรม?",
      choices: [
        "โค้ดเป็นระเบียบ นำกลับมาใช้ซ้ำได้ และแก้ไขจุดผิดพลาดได้ง่าย",
        "ทำให้ไฟล์โปรแกรมมีขนาดใหญ่ขึ้น",
        "ทำให้คนอื่นอ่านโค้ดไม่เข้าใจ",
      ],
      answer: 0,
      feedback: "ยอดเยี่ยม! ฟังก์ชันช่วยลดความซ้ำซ้อนและทำให้โปรแกรมดูแลรักษาง่าย",
    },
  },
];

// ===========================================================================
// ===========================================================================
// ป.3 หน่วย 1 — อัลกอริทึมกับการแก้ปัญหา
// เขียนมือแทนสไลด์อัตโนมัติ เพราะของเดิมบูลเล็ตแรกลอกชื่อหัวข้อมาทั้งดุ้น
// และอีกสองข้อเป็นข้อความสำเร็จรูปที่เหมือนกันทุกแผ่น เด็กอ่านแล้วไม่ได้ความรู้
// ระดับภาษาเล็งไว้ที่ ป.3 (8-9 ขวบ) ใช้ของใกล้ตัวเป็นตัวอย่างทุกแผ่น
// ===========================================================================
const p3_unit1: RichSlide[] = [
  {
    title: 'อัลกอริทึม คือ ลำดับขั้นตอน',
    // เลี่ยงอีโมจิ Unicode 13 ขึ้นไป (เช่น 🪜 🪥) เพราะเครื่องเก่าในโรงเรียนไม่มีฟอนต์ ขึ้นเป็นกล่องว่าง
    emoji: '👣',
    theme: 'blue',
    layout: 'cover',
    body: 'ทุกอย่างที่เราทำสำเร็จ ล้วนมีขั้นตอนของมัน วันนี้เราจะเรียนวิธีเขียนขั้นตอนให้คนอื่นทำตามได้',
  },
  {
    title: 'ปัญหา คืออะไร',
    emoji: '🧩',
    theme: 'orange',
    layout: 'standard',
    body: 'ปัญหา คือ เรื่องที่เราอยากให้ดีขึ้น แต่ยังไม่รู้วิธี',
    bullets: [
      { emoji: '📚', text: 'เรื่องการเรียน', sub: 'อ่านหนังสือแล้วจำไม่ได้ ทำการบ้านไม่ทัน' },
      { emoji: '🏠', text: 'เรื่องการทำงาน', sub: 'ห้องรก หาของไม่เจอ ลืมของบ่อย' },
      { emoji: '💪', text: 'เรื่องสุขภาพ', sub: 'นอนดึก กินขนมมากไป ไม่ค่อยออกกำลังกาย' },
    ],
    callout: { type: 'tip', emoji: '🔍', text: 'ปัญหาไม่ใช่เรื่องแย่ ปัญหาคือจุดเริ่มต้นของการคิดหาวิธีใหม่' },
  },
  {
    title: '4 ขั้นตอนแก้ปัญหา',
    emoji: '🎯',
    theme: 'green',
    layout: 'standard',
    body: 'เจอปัญหาแล้วอย่าเพิ่งลงมือ ให้ทำตาม 4 ขั้นนี้',
    bullets: [
      { emoji: '1️⃣', text: 'พิจารณา', sub: 'ปัญหาคืออะไรกันแน่ เรารู้อะไรแล้วบ้าง' },
      { emoji: '2️⃣', text: 'วางแผน', sub: 'จะทำอะไรก่อน อะไรหลัง ใช้อะไรบ้าง' },
      { emoji: '3️⃣', text: 'ลงมือ', sub: 'ทำตามแผนทีละขั้น ไม่ข้าม' },
      { emoji: '4️⃣', text: 'ตรวจสอบ', sub: 'ได้ผลอย่างที่ต้องการไหม ถ้ายังไม่ได้ต้องแก้ตรงไหน' },
    ],
    callout: { type: 'warn', emoji: '⏱️', text: 'ถ้าข้ามขั้น "วางแผน" มักจะเสียเวลามากกว่าเดิม เพราะต้องทำใหม่' },
  },
  {
    title: 'ลองใช้จริง: กล้าเป็นโรคอ้วน',
    emoji: '🍎',
    theme: 'pink',
    layout: 'standard',
    body: 'กล้าน้ำหนักเกิน เหนื่อยง่าย วิ่งเล่นกับเพื่อนไม่ไหว เราช่วยกล้าด้วย 4 ขั้นตอน',
    bullets: [
      { emoji: '1️⃣', text: 'พิจารณา', sub: 'กล้ากินขนมหวานวันละ 3 ถุง และเล่นเกมทั้งวัน' },
      { emoji: '2️⃣', text: 'วางแผน', sub: 'ลดขนมเหลือวันละ 1 ถุง และวิ่งเล่นวันละ 30 นาที' },
      { emoji: '3️⃣', text: 'ลงมือ', sub: 'ทำตามแผนทุกวัน จดไว้ว่าวันไหนทำได้บ้าง' },
      { emoji: '4️⃣', text: 'ตรวจสอบ', sub: 'ผ่านไป 1 เดือน ชั่งน้ำหนักและดูว่าเหนื่อยน้อยลงไหม' },
    ],
    callout: { type: 'fun', emoji: '💭', text: 'ถ้าผ่านไป 1 เดือนแล้วยังไม่ดีขึ้น กล้าควรกลับไปแก้ขั้นไหน' },
  },
  {
    title: 'แสดงอัลกอริทึมได้ 3 แบบ',
    emoji: '🖼️',
    theme: 'purple',
    layout: 'standard',
    body: 'ขั้นตอนเดียวกัน เราเล่าให้คนอื่นเข้าใจได้หลายวิธี',
    bullets: [
      { emoji: '🖼️', text: 'ภาพ', sub: 'วาดเป็นการ์ตูนช่อง ๆ เรียงจากซ้ายไปขวา เหมาะกับน้องเล็ก' },
      { emoji: '🔷', text: 'สัญลักษณ์', sub: 'ใช้กล่องและลูกศร เรียกว่า ผังงาน เห็นทางเลือกได้ชัด' },
      { emoji: '📝', text: 'ข้อความ', sub: 'เขียนเป็นข้อ 1 2 3 เขียนเร็วและละเอียดที่สุด' },
    ],
    callout: { type: 'tip', emoji: '🎯', text: 'เลือกแบบไหนก็ได้ ขอแค่คนอ่านทำตามแล้วได้ผลเหมือนกัน' },
  },
  {
    title: 'ขั้นตอนเดียวกัน เขียนคนละแบบ',
    emoji: '🦷',
    theme: 'yellow',
    layout: 'comparison',
    compareLeft: {
      title: 'เขียนเป็นข้อความ',
      emoji: '📝',
      items: [
        '1. บีบยาสีฟันลงแปรง',
        '2. แปรงฟันบน 20 ครั้ง',
        '3. แปรงฟันล่าง 20 ครั้ง',
        '4. บ้วนปากให้สะอาด',
      ],
      color: '#3b82f6',
    },
    compareRight: {
      title: 'เขียนเป็นสัญลักษณ์',
      emoji: '🔷',
      items: [
        '⬭ เริ่ม',
        '▭ บีบยาสีฟัน',
        '▭ แปรงบน แล้วแปรงล่าง',
        '◇ สะอาดหรือยัง',
        '⬭ จบ',
      ],
      color: '#a855f7',
    },
    callout: { type: 'fun', emoji: '👀', text: 'สองฝั่งนี้บอกเรื่องเดียวกัน ต่างแค่วิธีเล่า ลองอ่านดูว่าได้ผลเหมือนกันไหม' },
  },
  {
    title: 'ลำดับสลับที่ ผลเปลี่ยนทันที',
    emoji: '🔀',
    theme: 'red',
    layout: 'comparison',
    compareLeft: {
      title: 'เรียงถูก ✅',
      emoji: '😀',
      items: [
        '1. ใส่ถุงเท้า',
        '2. ใส่รองเท้า',
        '3. ผูกเชือก',
        '→ ออกไปเล่นได้',
      ],
      color: '#16a34a',
    },
    compareRight: {
      title: 'เรียงผิด ❌',
      emoji: '😵',
      items: [
        '1. ใส่รองเท้า',
        '2. ใส่ถุงเท้า',
        '3. ผูกเชือก',
        '→ ใส่ถุงเท้าไม่ได้แล้ว',
      ],
      color: '#dc2626',
    },
    callout: { type: 'warn', emoji: '⚠️', text: 'คำสั่งครบเหมือนกันทั้งสองฝั่ง แต่เรียงคนละแบบ ผลลัพธ์ต่างกันเลย' },
  },
  {
    title: 'ถึงตาเราลองบ้าง',
    emoji: '✏️',
    theme: 'green',
    layout: 'standard',
    body: 'เลือกงานที่เราทำทุกวันมา 1 อย่าง แล้วเขียนขั้นตอนให้เพื่อนทำตาม',
    bullets: [
      { emoji: '🍳', text: 'ตัวอย่างงานที่เลือกได้', sub: 'ทอดไข่ดาว ล้างจาน จัดกระเป๋านักเรียน รดน้ำต้นไม้' },
      { emoji: '✍️', text: 'เขียนให้ครบทุกขั้น', sub: 'อย่าข้ามขั้นที่คิดว่าใคร ๆ ก็รู้ เพราะเพื่อนอาจไม่รู้' },
      { emoji: '👫', text: 'ให้เพื่อนลองทำตาม', sub: 'ถ้าเพื่อนทำแล้วงง แปลว่าขั้นตอนเรายังไม่ชัด ต้องแก้' },
    ],
    callout: { type: 'tip', emoji: '🏆', text: 'อัลกอริทึมที่ดี คือ คนอื่นอ่านแล้วทำตามได้ โดยไม่ต้องถามเราเพิ่ม' },
  },
  {
    title: 'ตรวจความเข้าใจของเรา',
    emoji: '✅',
    theme: 'blue',
    layout: 'standard',
    body: 'ตอบในใจดูว่าเราทำได้ครบทุกข้อหรือยัง',
    bullets: [
      { emoji: '❓', text: 'อัลกอริทึมคืออะไร', sub: 'บอกด้วยคำของตัวเองได้ไหม' },
      { emoji: '❓', text: '4 ขั้นตอนแก้ปัญหามีอะไรบ้าง', sub: 'เรียงให้ถูกลำดับได้ไหม' },
      { emoji: '❓', text: 'แสดงอัลกอริทึมได้กี่แบบ', sub: 'ยกตัวอย่างแต่ละแบบได้ไหม' },
      { emoji: '❓', text: 'ทำไมลำดับจึงสำคัญ', sub: 'ยกตัวอย่างที่สลับแล้วพังได้ไหม' },
    ],
    callout: { type: 'fun', emoji: '🎉', text: 'ตอบได้ครบ 4 ข้อ แปลว่าพร้อมไปเรียนเรื่องเขียนโปรแกรมแล้ว' },
  },
];


// Export — รวมทั้งหมด (key = `${gradeId}_${unitNo}`)
// ===========================================================================
export const richSlides: Record<string, RichSlide[]> = {
  // สไลด์เขียนมือของหลักสูตร ป.1-6 อยู่แยกไฟล์ ไม่ให้ไฟล์นี้ใหญ่เกินไป
  // (richSlidesPrimary นำเข้า type จากไฟล์นี้แบบ import type เท่านั้น จึงไม่เกิด circular import ตอนรัน)
  ...primaryRichSlides,
  ...secondaryRichSlides,
  ...electiveRichSlides,
  // AI ป.1-3
  'ai-p1-3_1': ai_p13_unit1,
  'ai-p1-3_2': ai_p13_unit2,
  'ai-p1-3_3': ai_p13_unit3,
  // AI ป.4-6
  'ai-p4-6_1': ai_p46_unit1,
  'ai-p4-6_2': ai_p46_unit2,
  'ai-p4-6_3': ai_p46_unit3,
  'ai-p4-6_4': ai_p46_unit4,
  // AI ม.1-3
  'ai-m1-3_1': ai_m13_unit1,
  'ai-m1-3_2': ai_m13_unit2,
  'ai-m1-3_3': ai_m13_unit3,
  'ai-m1-3_4': ai_m13_unit4,
  'ai-m1-3_5': ai_m13_unit5,
  // หลักสูตรหลัก
  'p1_1': p1_unit1,
  'p3_1': p3_unit1,
  'p5_2': p5_unit2,
  'm1-cs_1': m1_cs_unit1,
  'm1-cs_2': m1_cs_unit2,
  'm2-cs_2': m2_cs_unit2,
};

export const hasRichSlides = (gradeId: string, unitNo: number): boolean => {
  return !!richSlides[`${gradeId}_${unitNo}`];
};

export const enrichRichSlideDeck = (gradeId: string, unitNo: number, deck: RichSlide[]): RichSlide[] => {
  const key = `${gradeId}_${unitNo}`;
  if (!deck || deck.length === 0) return [];

  const existingCoverImage = deck.find((slide) => slide.layout === 'cover' && slide.image)?.image;
  const visual = existingCoverImage
    ? { image: existingCoverImage, caption: '' }
    : inferLessonVisual(key, deck);

  return deck.map((slide, index) => {
    const generatedNote = buildTeachingNote(key, slide, index);
    const learnerLevel = getLearnerLevel(gradeId);
    const isCover = slide.layout === 'cover' || index === 0;

    return {
      ...slide,
      ...(isCover && !slide.image ? { image: visual.image, imageCaption: slide.imageCaption || visual.caption } : {}),
      lessonArt: slide.lessonArt || visual.image,
      learnerLevel: slide.learnerLevel || learnerLevel,
      learnerSummary: slide.learnerSummary || buildLearnerSummary(slide, learnerLevel),
      visualSummary: slide.visualSummary || buildVisualSummary(slide),
      quickCheck: slide.quickCheck || buildQuickCheck(key, slide, index),
      teachingNote: {
        ...generatedNote,
        ...slide.teachingNote,
        steps: slide.teachingNote?.steps || generatedNote.steps,
        check: slide.teachingNote?.check || generatedNote.check,
      },
    };
  });
};

export const getRichSlides = (gradeId: string, unitNo: number): RichSlide[] => {
  return enrichRichSlideDeck(gradeId, unitNo, richSlides[`${gradeId}_${unitNo}`] || []);
};
