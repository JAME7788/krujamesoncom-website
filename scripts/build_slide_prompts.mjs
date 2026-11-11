// สร้างชุดเนื้อหา + prompt สำหรับทำภาพสไลด์ (ChatGPT / DALL-E 3) ของวิชาเลือกใหม่
//   IoT และโรงเรียนอัจฉริยะ, ฐานข้อมูลเบื้องต้น, เล่าเรื่องด้วยสื่อดิจิทัล
// อ่านเนื้อหาจากไฟล์หลักสูตรโดยตรง จึงตรงกับเว็บเสมอ: แก้เนื้อหาในเว็บแล้วรันใหม่ได้เลย
//
// รัน (Node 22.18+ อ่านไฟล์ .ts ได้เอง):
//   node scripts/build_slide_prompts.mjs
// ผลลัพธ์: docs/slide-prompts/*.md (อ่าน/คัดลอกทีละแผ่น) และ docs/slide-prompts/slide-prompts.json (สำหรับสั่งสร้างทีละชุด)
import { mkdirSync, writeFileSync } from 'node:fs';
import { iotCourse, iotSlides } from '../src/data/courses/iotCourse.ts';
import { databaseCourse, databaseSlides } from '../src/data/courses/databaseCourse.ts';
import { storytellingCourse, storytellingSlides } from '../src/data/courses/storytellingCourse.ts';
import { iotExpansion } from '../src/data/courses/iotExpansion.ts';
import { databaseExpansion } from '../src/data/courses/databaseExpansion.ts';
import { storytellingExpansion } from '../src/data/courses/storytellingExpansion.ts';

// แทรกสไลด์ส่วนขยายก่อนแผ่นตรวจความเข้าใจ ให้ตรงกับ mergeDeck ใน src/data/extraCourses.ts
const withExpansion = (decks, expansion) =>
  decks.map((deck, i) => {
    const extra = expansion[i + 1]?.slides ?? [];
    return extra.length ? [...deck.slice(0, -1), ...extra, deck[deck.length - 1]] : deck;
  });

const DRIVE_ROOT = 'G:\\My Drive\\สไลด์สอน';
const OUT_DIR = 'docs/slide-prompts';

const COURSES = [
  {
    course: iotCourse,
    slides: withExpansion(iotSlides, iotExpansion),
    driveFolder: 'วิชา IoT และโรงเรียนอัจฉริยะ มัธยมศึกษา ม.1-ม.3',
    badge: '📡 IoT และโรงเรียนอัจฉริยะ ม.1–ม.3',
    world: 'ห้องเรียนและแปลงผักของโรงเรียนอัจฉริยะ มีบอร์ด ESP32 และ GoGo Board เซนเซอร์ สายจัมเปอร์ คลื่น Wi-Fi และก้อนเมฆข้อมูลลอยเชื่อมกันด้วยเส้นแสง',
    palette: 'ฟ้าน้ำทะเล (teal) ฟ้าสด และเขียวใบไม้ ตัดด้วยเหลืองทอง',
  },
  {
    course: databaseCourse,
    slides: withExpansion(databaseSlides, databaseExpansion),
    driveFolder: 'วิชาฐานข้อมูลเบื้องต้น มัธยมศึกษา ม.1-ม.3',
    badge: '🗄️ ฐานข้อมูลเบื้องต้น ม.1–ม.3',
    world: 'ห้องสมุดดิจิทัลแห่งอนาคต มีตารางข้อมูลลอยเป็นแผ่นกระจก ลิ้นชักแฟ้มที่กลายเป็นบล็อกข้อมูล กุญแจทองแทนคีย์หลัก และเส้นเชื่อมความสัมพันธ์ระหว่างตาราง',
    palette: 'น้ำเงินคราม ม่วงอ่อน และฟ้าอมเขียว ตัดด้วยเหลืองทอง',
  },
  {
    course: storytellingCourse,
    slides: withExpansion(storytellingSlides, storytellingExpansion),
    driveFolder: 'วิชาเล่าเรื่องด้วยสื่อดิจิทัล มัธยมศึกษา ม.1-ม.3',
    badge: '🎬 เล่าเรื่องด้วยสื่อดิจิทัล ม.1–ม.3',
    world: 'กองถ่ายทำเล็ก ๆ ในโรงเรียน มีมือถือบนขาตั้ง ไมโครโฟน ไฟริงไลต์ สเลท (clapperboard) แผ่นสตอรี่บอร์ดติดผนัง และไทม์ไลน์ตัดต่อบนจอแท็บเล็ต',
    palette: 'แดงอิฐ ส้มอบอุ่น และครีม ตัดด้วยน้ำเงินเข้ม',
  },
];

// แผ่นแรกเป็นปก แผ่นสุดท้ายเป็นควิซ แผ่นกลางเลือกแบบตามเลย์เอาต์ของสไลด์
const roleOf = (slide, idx, total) => {
  if (idx === 0) return 'ปกบทเรียนแบบ 3D ตัวหนังสือหัวเรื่องใหญ่โดดเด่นกลางภาพ';
  if (idx === total - 1) return 'การ์ดควิซตรวจความเข้าใจแบบ 3D มีถ้วยรางวัลทองเล็ก ๆ';
  if (slide.layout === 'comparison') return 'อินโฟกราฟิกเปรียบเทียบสองฝั่ง ซ้าย-ขวา แบ่งสีชัดเจน';
  if (slide.code) return 'อินโฟกราฟิกตัวอย่างการลงมือทำ มีจอแสดงตัวอย่างประกอบ';
  if ((slide.bullets ?? []).some((b) => /^[0-9]️⃣$/u.test(b.emoji ?? ''))) return 'อินโฟกราฟิกขั้นตอน/เวิร์กโฟลว์ มีลูกศรนำสายตาตามลำดับ';
  return 'อินโฟกราฟิกแนวคิดหลัก แบ่งเป็นการ์ดตามจำนวนประเด็น มีภาพตัวอย่างประกอบ';
};

// คำโปรยหน้าปก: ประโยคเต็มจากเนื้อหายาวเกินจะใส่ในภาพ จึงเขียนสั้น ๆ แยกไว้
const COVER_TAGLINE = {
  'iot-smart': {
    1: 'สิ่งของรอบตัวที่คุยกันผ่านอินเทอร์เน็ต',
    2: 'อ่านค่าโลกจริงด้วยเซนเซอร์และ GoGo Board',
    3: 'บอร์ดเล็กที่ต่อ Wi-Fi ได้ในตัว',
    4: 'ส่งข้อมูลขึ้นคลาวด์ด้วย MQTT และ NETPIE',
    5: 'เปลี่ยนตัวเลขให้เป็นกราฟ และแจ้งเตือนเมื่อผิดปกติ',
    6: 'ออกแบบโรงเรียนอัจฉริยะอย่างปลอดภัย',
  },
  'database-basic': {
    1: 'เบื้องหลังทุกแอปคือฐานข้อมูล',
    2: 'จัดข้อมูลเป็นตาราง และมีคีย์หลักที่ไม่ซ้ำ',
    3: 'วาดแผนภาพ ER ก่อนสร้างจริง',
    4: 'ออกแบบฐานข้อมูลห้องเรียนทีละขั้น',
    5: 'ถามฐานข้อมูลด้วยภาษา SQL',
  },
  'digital-story': {
    1: 'รู้จักผู้ชม แล้วเลือกสื่อให้เหมาะ',
    2: 'วางโครงเรื่อง แล้วเขียนบทแบบภาพคู่เสียง',
    3: 'วาดหนังของเราก่อนถ่ายจริง',
    4: 'แสงดี เสียงชัด ตัดต่อกระชับ',
    5: 'เคารพลิขสิทธิ์และความเป็นส่วนตัวก่อนกดโพสต์',
  },
};

// สลับตำแหน่งคำตอบให้ตรงกับที่เว็บแสดง (extraCourses.ts ใช้ moveCorrectTo ด้วยเลขหน่วย)
const moveCorrectTo = (options, answer, target) => {
  const slot = ((target % options.length) + options.length) % options.length;
  const rest = options.filter((_, i) => i !== answer);
  return [...rest.slice(0, slot), options[answer], ...rest.slice(slot)];
};

const NEGATIVE =
  'ตัวหนังสือมั่ว สะกดผิด หรือมีข้อความที่ไม่ได้กำหนด, ภาพเบลอ, มือผิดรูป, ใบหน้าบิดเบี้ยว, โลโก้แบรนด์จริง, ลายน้ำ, องค์ประกอบรกเกินไป, ตัวอักษรเล็กอ่านไม่ออก, ภาพแบน 2D';

const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const firstSentence = (s, max = 90) => {
  const t = clean(s);
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const sp = cut.lastIndexOf(' ');
  return (sp > 40 ? cut.slice(0, sp) : cut).trim();
};
// ชื่อไฟล์/โฟลเดอร์ต้องใช้บน Windows และ Google Drive ได้
const safeName = (s) => clean(s).replace(/[\\/:*?"<>|]/g, '-').replace(/\s*-\s*/g, '- ').trim();
const fileTitle = (s) => clean(s).replace(/[\\/:*?"<>|.,()'!?]/g, '').replace(/\s+/g, '_').replace(/_+/g, '_');

/** ข้อความภาษาไทยที่ต้องปรากฏในภาพ: สั้น ชัด อ่านจากหลังห้องได้ */
const textsOf = (slide, courseId, unitNo) => {
  const t = [];
  if (slide.layout === 'cover') {
    t.push(COVER_TAGLINE[courseId]?.[unitNo] ?? firstSentence(slide.body, 60));
    return t;
  }
  if (slide.layout === 'comparison' && slide.compareLeft && slide.compareRight) {
    for (const side of [slide.compareLeft, slide.compareRight]) {
      t.push(`${side.title}: ${side.items.slice(0, 3).join(' / ')}`);
    }
    return t;
  }
  if (slide.quickCheck) {
    t.push(`คำถาม: ${clean(slide.quickCheck.question)}`);
    moveCorrectTo(slide.quickCheck.choices, slide.quickCheck.answer, unitNo).forEach((c, i) => t.push(`${'กขค'[i] ?? i + 1}. ${clean(c)}`));
    return t;
  }
  // ไม่เกิน 4 ข้อ และคำขยายสั้น ๆ เท่านั้น ข้อความยิ่งยาว ตัวอักษรไทยในภาพยิ่งเพี้ยน
  for (const b of (slide.bullets ?? []).slice(0, 4)) {
    const sub = clean(b.sub);
    t.push(sub && sub.length <= 28 ? `${clean(b.text)} — ${sub}` : clean(b.text));
  }
  if (!t.length && slide.body) t.push(firstSentence(slide.body, 110));
  if (slide.callout) t.push(`เกร็ดน่ารู้: ${firstSentence(slide.callout.text, 130)}`);
  return t;
};

const iconsOf = (slide) => {
  const list = [slide.emoji, ...(slide.bullets ?? []).map((b) => b.emoji)];
  if (slide.compareLeft) list.push(slide.compareLeft.emoji, slide.compareRight?.emoji);
  return [...new Set(list.filter(Boolean))].join(' ');
};

const buildPrompt = (meta, unit, slide, idx, total) => {
  const role = roleOf(slide, idx, total);
  const texts = textsOf(slide, meta.course.id, unit.no);
  const codeNote = slide.code
    ? ' มีจอแล็ปท็อปแสดงหน้าต่างโค้ดหรือตารางแบบเบลอเป็นฉากประกอบ (ไม่ต้องอ่านออก ไม่ต้องเขียนโค้ดจริง)'
    : '';
  const lines = [
    `P: สร้างภาพสไลด์การสอนแบบอินโฟกราฟิก 3D แผ่นที่ ${idx + 1} จาก ${total} ของหน่วยที่ ${unit.no} "${unit.title}" — ${role}`,
    'A: สำหรับนักเรียนมัธยมต้น (ม.1–ม.3) ในโรงเรียนไทย ฉายบนจอโปรเจกเตอร์หน้าห้อง',
    'R: ทำงานในฐานะ Art Director และนักออกแบบอินโฟกราฟิกสื่อการสอน',
    `I: ฉาก ${meta.world}; นักเรียนไทยชายหญิงในชุดนักเรียน (เสื้อขาว กางเกง/กระโปรงสีกรมท่า) ท่าทางสนใจ กำลังเรียนรู้เรื่องนี้; ไอคอน 3D ตามอีโมจิ ${iconsOf(slide)}${codeNote}; ป้ายมุมซ้ายบนเขียนว่า "${meta.badge}"`,
    `ข้อความภาษาไทยในภาพ ให้เขียนตรงตามนี้ทุกตัวอักษร ห้ามเพิ่มข้อความอื่น: หัวเรื่องใหญ่ "${clean(slide.title)}"` +
      texts.map((x) => `; "${x}"`).join(''),
    `S: 3D cartoon infographic สไตล์ Pixar สีสด สะอาด โทน ${meta.palette}; กล่องข้อความมุมโค้งพื้นสว่าง ตัวอักษรไทยหนาใหญ่อ่านง่าย; แสงนุ่มจากหน้าต่าง rim light บาง ๆ เงานุ่ม ambient occlusion; ฉากหน้า-กลาง-หลังมีมิติ ฉากหลังเบลอเล็กน้อย; สัดส่วน 16:9`,
    `หลีกเลี่ยง: ${NEGATIVE}`,
  ];
  return { prompt: lines.join('\n'), texts };
};

mkdirSync(OUT_DIR, { recursive: true });
const all = [];
const index = [];

for (const meta of COURSES) {
  const { course, slides } = meta;
  const md = [
    `# ชุดสร้างสไลด์: ${course.title}`,
    '',
    `สร้างอัตโนมัติจาก \`src/data/courses/\` ด้วย \`node scripts/build_slide_prompts.mjs\` ห้ามแก้ไฟล์นี้ด้วยมือ ให้แก้เนื้อหาในไฟล์หลักสูตรแล้วรันใหม่`,
    '',
    `- โฟลเดอร์ปลายทาง: \`${DRIVE_ROOT}\\${meta.driveFolder}\``,
    `- ${course.units.length} หน่วย รวม ${slides.reduce((n, d) => n + d.length, 0)} ภาพ สัดส่วน 16:9`,
    '- หลังได้ภาพ: ตรวจตัวสะกดภาษาไทยทุกแผ่นก่อนใช้ แผ่นไหนสะกดผิดให้สร้างใหม่ หรือแก้ตัวอักษรใน Canva',
    '',
  ];
  course.units.forEach((unit, u) => {
    const deck = slides[u] ?? [];
    const folder = `หน่วยที่ ${unit.no} ${safeName(unit.title)}`;
    md.push(`## หน่วยที่ ${unit.no} ${unit.title}`, '', `โฟลเดอร์: \`${meta.driveFolder}\\${folder}\``, '');
    deck.forEach((slide, i) => {
      const file = `${String(i + 1).padStart(2, '0')}_สไลด์_${fileTitle(slide.title)}.png`;
      const { prompt, texts } = buildPrompt(meta, unit, slide, i, deck.length);
      all.push({
        courseId: course.id,
        unitNo: unit.no,
        slideNo: i + 1,
        title: clean(slide.title),
        texts,
        driveFolder: `${DRIVE_ROOT}\\${meta.driveFolder}\\${folder}`,
        fileName: file,
        ratio: '16:9',
        prompt,
      });
      md.push(
        `### แผ่นที่ ${i + 1}: ${clean(slide.title)}`,
        '',
        `ไฟล์: \`${file}\``,
        '',
        'ข้อความในภาพ:',
        '',
        `- **${clean(slide.title)}**`,
        ...texts.map((x) => `- ${x}`),
        '',
        'Prompt:',
        '',
        '```text',
        prompt,
        '```',
        '',
      );
    });
  });
  const mdFile = `${course.id}.md`;
  writeFileSync(`${OUT_DIR}/${mdFile}`, md.join('\n'), 'utf8');
  index.push({ title: course.title, file: mdFile, units: course.units.length, slides: slides.reduce((n, d) => n + d.length, 0), folder: meta.driveFolder });
}

writeFileSync(`${OUT_DIR}/slide-prompts.json`, JSON.stringify(all, null, 2) + '\n', 'utf8');

const readme = [
  '# ชุดเนื้อหาสำหรับสร้างภาพสไลด์ วิชาเลือกใหม่ ม.1–ม.3',
  '',
  'สไลด์ในเว็บ (ข้อความ แบบทดสอบ ตรวจความเข้าใจ) ใช้งานได้แล้ว ชุดนี้ใช้ทำ "ภาพสไลด์" แบบเดียวกับวิชา Python และ Arduino',
  '',
  '| วิชา | หน่วย | ภาพ | ไฟล์ |',
  '|---|---|---|---|',
  ...index.map((c) => `| ${c.title} | ${c.units} | ${c.slides} | [${c.file}](${c.file}) |`),
  `| **รวม** | **${index.reduce((n, c) => n + c.units, 0)}** | **${all.length}** | [slide-prompts.json](slide-prompts.json) |`,
  '',
  '## ขั้นตอน',
  '',
  '1. เปิด https://chatgpt.com ล็อกอินค้างไว้ และ Reload ส่วนขยาย "Gemini 4 Argon & AI Bridge"',
  '2. คัดลอก prompt ทีละแผ่นจากไฟล์ .md ไปวางใน ChatGPT หรือให้ AI สั่งผ่านสกิล `/สร้างภาพ` ด้วย `slide-prompts.json` (มี prompt, โฟลเดอร์, ชื่อไฟล์ ครบทุกแผ่น)',
  `3. บันทึกภาพลง Google Drive ตาม \`driveFolder\` และ \`fileName\` ของแต่ละแผ่น (ใต้ \`${DRIVE_ROOT}\` แยกโฟลเดอร์ตามหน่วย ห้ามวางไฟล์หลวมนอกโฟลเดอร์หน่วย)`,
  '4. ตรวจตัวสะกดภาษาไทยในภาพทุกแผ่น',
  '5. แชร์ไฟล์ใน Drive แล้วเพิ่มลิงก์ลง `src/data/slideImages.ts` ตามคีย์ `iot-smart`, `database-basic`, `digital-story` (เรียงตามแผ่น หน่วยละ 9 ลิงก์)',
  '',
  'แก้เนื้อหาสไลด์ใน `src/data/courses/*.ts` แล้วรัน `node scripts/build_slide_prompts.mjs` ใหม่ ไฟล์ในโฟลเดอร์นี้จะอัปเดตตาม',
  '',
];
writeFileSync(`${OUT_DIR}/README.md`, readme.join('\n'), 'utf8');

console.log(`slides: ${all.length}`);
for (const c of index) console.log(`${c.file}: ${c.units} units, ${c.slides} slides`);
