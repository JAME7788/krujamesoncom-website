// แหล่งเรียนรู้/เครื่องมือภายนอก — แต่ละลิงก์จะ tag กับ unit ในเว็บ
// เมื่อนักเรียนกดเข้าใช้งาน → ระบบจะบันทึก fun click ให้ unit ที่ตรงกัน
// → ส่งผลให้คะแนน P (ทักษะ) ของตัวชี้วัดที่เกี่ยวข้องเพิ่มขึ้นโดยอัตโนมัติ

export type ResourceCategory =
  | 'basic'            // ทักษะพื้นฐานคอมพิวเตอร์
  | 'programming'      // เขียนโปรแกรม
  | 'computational'    // คิดเชิงคำนวณ
  | 'data'             // ข้อมูล/นำเสนอ
  | 'safety'           // ปลอดภัย/รู้เท่าทันสื่อ
  | 'design'           // ออกแบบเทคโนโลยี
  | 'ai';              // AI

export interface LearningResource {
  id: string;
  title: string;
  desc: string;
  url: string;
  emoji: string;
  category: ResourceCategory;
  /** units ที่ resource นี้สอดคล้อง — เมื่อกดจะบันทึก fun click ให้ทุก unit ที่ระบุ */
  targetUnits: { gradeId: string; unitNo: number }[];
  badge?: string;      // tag เด่น เช่น "แนะนำ"
}

// ===== หมวดเขียนโปรแกรม (Programming Tools) =====
const programmingResources: LearningResource[] = [
  {
    id: 'pictoblox',
    title: 'PictoBlox',
    desc: 'เขียนโปรแกรมแบบ block-based พร้อม AI/IoT — เหมือน Scratch แต่ทำ AI ได้',
    url: 'https://thestempedia.com/product/pictoblox/',
    emoji: '🤖',
    category: 'programming',
    badge: 'แนะนำสำหรับ AI',
    targetUnits: [
      { gradeId: 'p4', unitNo: 2 }, { gradeId: 'p5', unitNo: 2 }, { gradeId: 'p6', unitNo: 2 },
      { gradeId: 'm1-cs', unitNo: 1 }, { gradeId: 'm2-cs', unitNo: 1 },
      { gradeId: 'ai-p4-6', unitNo: 2 }, { gradeId: 'ai-m1-3', unitNo: 1 },
    ],
  },
  {
    id: 'codeorg',
    title: 'Code.org',
    desc: 'หลักสูตรโค้ดดิ้งระดับโลก ป.1-ม.6 — ภาษาไทย ฟรี ครบทุกระดับ',
    url: 'https://code.org/',
    emoji: '💻',
    category: 'programming',
    badge: 'หลักสูตรโลก',
    targetUnits: [
      { gradeId: 'p1', unitNo: 3 }, { gradeId: 'p2', unitNo: 2 }, { gradeId: 'p3', unitNo: 2 },
      { gradeId: 'p4', unitNo: 2 }, { gradeId: 'p5', unitNo: 2 }, { gradeId: 'p6', unitNo: 2 },
    ],
  },
  {
    id: 'codeorg-courseA',
    title: 'Code.org Course A (ป.1)',
    desc: 'หลักสูตรเริ่มต้นสำหรับเด็ก ป.1 — ลากบล็อกบังคับตัวละคร',
    url: 'https://studio.code.org/s/coursea-2023',
    emoji: '🐦',
    category: 'programming',
    targetUnits: [{ gradeId: 'p1', unitNo: 3 }, { gradeId: 'p1', unitNo: 2 }],
  },
  {
    id: 'codeorg-courseE',
    title: 'Code.org Course E (ป.5)',
    desc: 'การวนซ้ำ เงื่อนไข ฟังก์ชัน สำหรับ ป.4-5',
    url: 'https://studio.code.org/s/coursee-2023',
    emoji: '🎯',
    category: 'programming',
    targetUnits: [{ gradeId: 'p5', unitNo: 2 }, { gradeId: 'p4', unitNo: 2 }],
  },
  {
    id: 'scratch',
    title: 'Scratch (MIT)',
    desc: 'สร้างเกม แอนิเมชัน และเรื่องราวด้วย block-coding — โปรแกรมยอดนิยมของ MIT',
    url: 'https://scratch.mit.edu/projects/editor/',
    emoji: '🐱',
    category: 'programming',
    badge: 'ยอดนิยม',
    targetUnits: [
      { gradeId: 'p3', unitNo: 2 }, { gradeId: 'p4', unitNo: 2 }, { gradeId: 'p5', unitNo: 2 },
      { gradeId: 'p6', unitNo: 2 }, { gradeId: 'm1-cs', unitNo: 1 }, { gradeId: 'm2-cs', unitNo: 1 },
    ],
  },
  {
    id: 'scratchjr',
    title: 'ScratchJr',
    desc: 'Scratch สำหรับเด็กเล็ก ป.1-3 — บล็อกใหญ่ๆ เข้าใจง่าย',
    url: 'https://www.scratchjr.org/',
    emoji: '🐱',
    category: 'programming',
    targetUnits: [{ gradeId: 'p1', unitNo: 3 }, { gradeId: 'p2', unitNo: 2 }, { gradeId: 'p3', unitNo: 2 }],
  },
  {
    id: 'blockly',
    title: 'Blockly Games',
    desc: 'เกมสอนการเขียนโปรแกรมแบบขั้นบันได — เปิดเล่นได้เลย ไม่ต้อง login',
    url: 'https://blockly.games/',
    emoji: '🧩',
    category: 'programming',
    targetUnits: [
      { gradeId: 'p2', unitNo: 2 }, { gradeId: 'p3', unitNo: 2 }, { gradeId: 'p4', unitNo: 2 },
      { gradeId: 'p5', unitNo: 2 }, { gradeId: 'p6', unitNo: 2 },
    ],
  },
  {
    id: 'lightbot',
    title: 'Lightbot Hour',
    desc: 'เกมแก้ปัญหาด้วยอัลกอริทึม — เน้นคิดเป็นขั้นตอน',
    url: 'https://lightbot.com/hour-of-code-2018.html',
    emoji: '💡',
    category: 'computational',
    targetUnits: [
      { gradeId: 'p1', unitNo: 2 }, { gradeId: 'p2', unitNo: 1 }, { gradeId: 'p3', unitNo: 1 },
      { gradeId: 'p4', unitNo: 1 }, { gradeId: 'p5', unitNo: 1 },
    ],
  },
  {
    id: 'tynker',
    title: 'Tynker',
    desc: 'เรียนเขียนโปรแกรม Minecraft, Roblox, สร้างเกม',
    url: 'https://www.tynker.com/hour-of-code/',
    emoji: '🎮',
    category: 'programming',
    targetUnits: [
      { gradeId: 'p4', unitNo: 2 }, { gradeId: 'p5', unitNo: 2 }, { gradeId: 'p6', unitNo: 2 },
    ],
  },
  {
    id: 'thunkable',
    title: 'Thunkable',
    desc: 'สร้าง Mobile App ด้วย block-based — สำหรับ ม.1-3',
    url: 'https://thunkable.com/',
    emoji: '📱',
    category: 'programming',
    targetUnits: [
      { gradeId: 'm2-cs', unitNo: 2 }, { gradeId: 'm3-cs', unitNo: 1 },
    ],
  },
  {
    id: 'replit',
    title: 'Replit',
    desc: 'เขียนโค้ดได้ในเบราว์เซอร์ — รองรับ Python, JS, ภาษาอื่นๆ',
    url: 'https://replit.com/',
    emoji: '⌨️',
    category: 'programming',
    targetUnits: [{ gradeId: 'm2-cs', unitNo: 2 }, { gradeId: 'm3-cs', unitNo: 1 }],
  },
  {
    id: 'micro-bit',
    title: 'micro:bit',
    desc: 'เขียนโปรแกรม IoT ทำหุ่นยนต์ ตรวจวัดสภาพแวดล้อม',
    url: 'https://makecode.microbit.org/',
    emoji: '🔌',
    category: 'programming',
    targetUnits: [
      { gradeId: 'm1-design', unitNo: 4 }, { gradeId: 'm2-design', unitNo: 3 }, { gradeId: 'm3-design', unitNo: 3 },
    ],
  },

  // ============================================================
  // Code.org — เลือกตามชั้นเรียน + ตัวชี้วัดเขียนโค้ด/อัลกอริทึม
  // ============================================================

  // ===== Code.org Courses (ตามชั้นเรียน A-F) =====
  {
    id: 'codeorg-courseB',
    title: 'Code.org Course B (ป.1)',
    desc: 'หลักสูตรเขียนโค้ดสำหรับ ป.1 — เรียนรู้ events, สั่งให้โปรแกรมตอบสนอง',
    url: 'https://studio.code.org/s/courseb-2023',
    emoji: '🅱️',
    category: 'programming',
    badge: 'เหมาะกับ ป.1',
    targetUnits: [{ gradeId: 'p1', unitNo: 3 }, { gradeId: 'p1', unitNo: 2 }],
  },
  {
    id: 'codeorg-courseC',
    title: 'Code.org Course C (ป.2)',
    desc: 'เน้นการ Debug หาและแก้ข้อผิดพลาด + Loop พื้นฐาน',
    url: 'https://studio.code.org/s/coursec-2023',
    emoji: '🔠',
    category: 'programming',
    badge: 'เหมาะกับ ป.2',
    targetUnits: [{ gradeId: 'p2', unitNo: 1 }, { gradeId: 'p2', unitNo: 2 }],
  },
  {
    id: 'codeorg-courseD',
    title: 'Code.org Course D (ป.3)',
    desc: 'Nested loops + Functions — ฝึกคิดเป็นโครงสร้าง',
    url: 'https://studio.code.org/s/coursed-2023',
    emoji: '🇩',
    category: 'programming',
    badge: 'เหมาะกับ ป.3',
    targetUnits: [{ gradeId: 'p3', unitNo: 1 }, { gradeId: 'p3', unitNo: 2 }],
  },
  {
    id: 'codeorg-courseF',
    title: 'Code.org Course F (ป.6)',
    desc: 'Variables ในเกม + Sprite Lab — สร้างเกมเป็นของตัวเอง',
    url: 'https://studio.code.org/s/coursef-2023',
    emoji: '🇫',
    category: 'programming',
    badge: 'เหมาะกับ ป.6',
    targetUnits: [{ gradeId: 'p6', unitNo: 2 }, { gradeId: 'p6', unitNo: 1 }],
  },
  {
    id: 'codeorg-express',
    title: 'Code.org Express (รวม A-F)',
    desc: 'หลักสูตรรวม — เริ่มจากระดับใดก็ได้ ทำตามจังหวะของตัวเอง',
    url: 'https://studio.code.org/s/express-2023',
    emoji: '🚄',
    category: 'programming',
    badge: 'รวมทุกระดับ',
    targetUnits: [
      { gradeId: 'p4', unitNo: 2 }, { gradeId: 'p5', unitNo: 2 }, { gradeId: 'p6', unitNo: 2 },
    ],
  },

  // ===== Code.org Hour of Code — Themes สนุก =====
  {
    id: 'hoc-frozen',
    title: 'Frozen — เขียนโค้ดกับเอลซ่า',
    desc: 'Anna กับ Elsa เล่นสเก็ต — เรียน loop วาดภาพหิมะ ⛄',
    url: 'https://studio.code.org/s/frozen',
    emoji: '❄️',
    category: 'programming',
    badge: 'Hour of Code',
    targetUnits: [
      { gradeId: 'p1', unitNo: 3 }, { gradeId: 'p2', unitNo: 2 }, { gradeId: 'p3', unitNo: 2 },
    ],
  },
  {
    id: 'hoc-starwars-blocks',
    title: 'Star Wars (Blockly) — โดรอยด์ผจญภัย',
    desc: 'BB-8 ผจญภัย — เขียนบล็อกเดินทาง รวบรวมเศษโลหะ',
    url: 'https://studio.code.org/s/starwarsblocks-2018',
    emoji: '⭐',
    category: 'programming',
    badge: 'Hour of Code',
    targetUnits: [
      { gradeId: 'p2', unitNo: 2 }, { gradeId: 'p3', unitNo: 2 }, { gradeId: 'p4', unitNo: 2 },
    ],
  },
  {
    id: 'hoc-dance',
    title: 'Dance Party — เต้นกับศิลปิน!',
    desc: 'เขียนโค้ดให้ตัวละครเต้นตามเพลง K-Pop, BTS, Lizzo',
    url: 'https://studio.code.org/s/dance-2019',
    emoji: '💃',
    category: 'programming',
    badge: 'Hour of Code',
    targetUnits: [
      { gradeId: 'p3', unitNo: 2 }, { gradeId: 'p4', unitNo: 2 }, { gradeId: 'p5', unitNo: 2 }, { gradeId: 'p6', unitNo: 2 },
    ],
  },
  {
    id: 'hoc-dance-ai',
    title: 'Dance Party: AI Edition',
    desc: 'AI ทำท่าเต้นจากคำพูดของเรา — สนุกสุดๆ ม.ต้น!',
    url: 'https://studio.code.org/s/dance-ai',
    emoji: '🤖',
    category: 'ai',
    badge: 'Hour of Code AI',
    targetUnits: [
      { gradeId: 'ai-p4-6', unitNo: 3 }, { gradeId: 'ai-m1-3', unitNo: 2 },
      { gradeId: 'm1-cs', unitNo: 1 }, { gradeId: 'm2-cs', unitNo: 1 },
    ],
  },
  {
    id: 'hoc-minecraft',
    title: 'Minecraft Hour of Code',
    desc: 'สำรวจโลก Minecraft — เขียนโค้ดสร้างหมู่บ้าน เลี้ยงสัตว์',
    url: 'https://code.org/minecraft',
    emoji: '⛏️',
    category: 'programming',
    badge: 'Hour of Code',
    targetUnits: [
      { gradeId: 'p3', unitNo: 2 }, { gradeId: 'p4', unitNo: 2 }, { gradeId: 'p5', unitNo: 2 }, { gradeId: 'p6', unitNo: 2 },
    ],
  },
  {
    id: 'hoc-mc-aquatic',
    title: 'Minecraft AI for Good (Aquatic)',
    desc: 'ใช้ AI ใน Minecraft แก้ปัญหาสิ่งแวดล้อม — เก็บขยะใต้ทะเล',
    url: 'https://studio.code.org/s/aquatic',
    emoji: '🐠',
    category: 'ai',
    badge: 'Minecraft AI',
    targetUnits: [
      { gradeId: 'p5', unitNo: 2 }, { gradeId: 'p6', unitNo: 2 },
      { gradeId: 'ai-p4-6', unitNo: 1 }, { gradeId: 'ai-p4-6', unitNo: 4 },
    ],
  },
  {
    id: 'hoc-flappy',
    title: 'Flappy Code — สร้างเกม Flappy',
    desc: 'สร้างเกม Flappy ด้วยตัวเองใน 1 ชม. — เรียน events, conditions',
    url: 'https://studio.code.org/s/flappy',
    emoji: '🐤',
    category: 'programming',
    badge: 'Hour of Code',
    targetUnits: [
      { gradeId: 'p4', unitNo: 2 }, { gradeId: 'p5', unitNo: 2 }, { gradeId: 'p6', unitNo: 2 },
    ],
  },
  {
    id: 'hoc-artist',
    title: 'Artist — วาดด้วยโค้ด',
    desc: 'เขียนโค้ดให้ตัวละครวาดรูปเรขาคณิต — เรียน loop + functions',
    url: 'https://studio.code.org/s/artist-2018',
    emoji: '🎨',
    category: 'programming',
    badge: 'Hour of Code',
    targetUnits: [
      { gradeId: 'p3', unitNo: 2 }, { gradeId: 'p4', unitNo: 2 }, { gradeId: 'p5', unitNo: 2 },
    ],
  },
  {
    id: 'hoc-playlab',
    title: 'Play Lab — สร้างเกมของตัวเอง',
    desc: 'สร้างเกมเล็กๆ + เล่าเรื่อง — เลือกตัวละคร พื้นหลัง คำสั่ง',
    url: 'https://studio.code.org/s/playlab-2018',
    emoji: '🎮',
    category: 'programming',
    badge: 'Hour of Code',
    targetUnits: [
      { gradeId: 'p3', unitNo: 2 }, { gradeId: 'p4', unitNo: 2 }, { gradeId: 'p5', unitNo: 2 }, { gradeId: 'p6', unitNo: 2 },
    ],
  },
  {
    id: 'hoc-spritelab',
    title: 'Sprite Lab — สร้างแอนิเมชัน',
    desc: 'สร้างเกม + แอนิเมชัน — sprite เคลื่อนไหวได้ ฝึก event-driven',
    url: 'https://studio.code.org/projects/spritelab',
    emoji: '✨',
    category: 'programming',
    badge: 'Project',
    targetUnits: [
      { gradeId: 'p4', unitNo: 2 }, { gradeId: 'p5', unitNo: 2 }, { gradeId: 'p6', unitNo: 2 },
    ],
  },

  // ===== Code.org App Lab + Game Lab — สำหรับ ม.ต้น =====
  {
    id: 'codeorg-applab',
    title: 'Code.org App Lab',
    desc: 'สร้าง Mobile App ด้วย JavaScript + Block — Beginner ม.ต้น',
    url: 'https://studio.code.org/projects/applab',
    emoji: '📱',
    category: 'programming',
    badge: 'แนะนำ ม.2-3',
    targetUnits: [
      { gradeId: 'm1-cs', unitNo: 2 }, { gradeId: 'm2-cs', unitNo: 2 },
      { gradeId: 'm3-cs', unitNo: 1 }, { gradeId: 'm3-design', unitNo: 4 },
    ],
  },
  {
    id: 'codeorg-gamelab',
    title: 'Code.org Game Lab',
    desc: 'สร้างเกม 2D ด้วย JavaScript — sprite, animation, collision',
    url: 'https://studio.code.org/projects/gamelab',
    emoji: '🕹️',
    category: 'programming',
    badge: 'แนะนำ ม.1-3',
    targetUnits: [
      { gradeId: 'm1-cs', unitNo: 2 }, { gradeId: 'm2-cs', unitNo: 2 },
      { gradeId: 'p6', unitNo: 2 },
    ],
  },
  {
    id: 'codeorg-csd',
    title: 'CS Discoveries (CSD)',
    desc: 'หลักสูตรปูพื้นฐาน CS สำหรับ ม.ต้น (เกือบครึ่งปี) — Web, App, Game, Data',
    url: 'https://studio.code.org/courses/csd-2023',
    emoji: '🎓',
    category: 'programming',
    badge: 'หลักสูตรเต็ม',
    targetUnits: [
      { gradeId: 'm1-cs', unitNo: 1 }, { gradeId: 'm2-cs', unitNo: 1 }, { gradeId: 'm3-cs', unitNo: 1 },
    ],
  },
  {
    id: 'codeorg-csp',
    title: 'CS Principles (CSP)',
    desc: 'หลักสูตรขั้นสูง — Big Data, Internet, App, Algorithm — ม.3+',
    url: 'https://studio.code.org/courses/csp-2023',
    emoji: '🌐',
    category: 'programming',
    badge: 'ม.ปลาย',
    targetUnits: [
      { gradeId: 'm3-cs', unitNo: 1 }, { gradeId: 'm3-cs', unitNo: 2 },
    ],
  },

  // ===== Code.org Algorithm-focused activities =====
  {
    id: 'hoc-algo-oceans',
    title: 'AI for Oceans — สอน AI คัดแยกขยะ',
    desc: 'อัลกอริทึม classification — สอน AI ทาย "ปลา" หรือ "ขยะ"',
    url: 'https://code.org/oceans',
    emoji: '🌊',
    category: 'ai',
    badge: 'Algorithm + AI',
    targetUnits: [
      { gradeId: 'p5', unitNo: 1 }, { gradeId: 'p6', unitNo: 1 },
      { gradeId: 'ai-p4-6', unitNo: 1 }, { gradeId: 'ai-m1-3', unitNo: 4 },
    ],
  },
  {
    id: 'codeorg-cspuzzle',
    title: 'CS Unplugged — Algorithm Puzzles',
    desc: 'โจทย์อัลกอริทึมแบบไม่ใช้คอม — เรียงไพ่, ค้นหา binary, คัดแยกข้อมูล',
    url: 'https://csunplugged.org/en/topics/',
    emoji: '🃏',
    category: 'computational',
    badge: 'Algorithm',
    targetUnits: [
      { gradeId: 'p3', unitNo: 1 }, { gradeId: 'p4', unitNo: 1 },
      { gradeId: 'p5', unitNo: 1 }, { gradeId: 'p6', unitNo: 1 },
      { gradeId: 'm1-cs', unitNo: 1 },
    ],
  },
  {
    id: 'hoc-poetry',
    title: 'Poetry with Code',
    desc: 'แต่งกลอนด้วยโค้ด — string + variables — ม.ต้น',
    url: 'https://studio.code.org/s/poetry',
    emoji: '✒️',
    category: 'programming',
    badge: 'Hour of Code',
    targetUnits: [
      { gradeId: 'm1-cs', unitNo: 2 }, { gradeId: 'm2-cs', unitNo: 2 },
    ],
  },

  // ===== Code.org แบบรวมตามชั้น =====
  {
    id: 'codeorg-elementary',
    title: 'Code.org Elementary — รวมเด็กเล็ก',
    desc: 'หน้ารวมหลักสูตรประถม — เลือกระดับชั้นได้',
    url: 'https://code.org/educate/curriculum/elementary-school',
    emoji: '🏫',
    category: 'programming',
    badge: 'รวม ป.1-6',
    targetUnits: [
      { gradeId: 'p1', unitNo: 3 }, { gradeId: 'p2', unitNo: 2 }, { gradeId: 'p3', unitNo: 2 },
      { gradeId: 'p4', unitNo: 2 }, { gradeId: 'p5', unitNo: 2 }, { gradeId: 'p6', unitNo: 2 },
    ],
  },
  {
    id: 'codeorg-middle',
    title: 'Code.org Middle School — รวม ม.ต้น',
    desc: 'หน้ารวมหลักสูตรมัธยมต้น — CSD, Hour of Code',
    url: 'https://code.org/educate/curriculum/middle-school',
    emoji: '🎓',
    category: 'programming',
    badge: 'รวม ม.1-3',
    targetUnits: [
      { gradeId: 'm1-cs', unitNo: 1 }, { gradeId: 'm2-cs', unitNo: 1 }, { gradeId: 'm3-cs', unitNo: 1 },
    ],
  },
];

// ===== หมวดทักษะพื้นฐานคอมพิวเตอร์ (Basic Computer Skills) =====
const basicResources: LearningResource[] = [
  {
    id: 'mouse-practice-kj',
    title: 'เกมภารกิจเมาส์แม่นยำ',
    desc: 'เกมในเว็บนี้สำหรับ ป.1 ฝึกคลิก ดับเบิลคลิก และลากวางสีให้ตรงช่อง',
    url: '/games/mouse-practice',
    emoji: '🖱️',
    category: 'basic',
    badge: 'สร้างเอง',
    targetUnits: [{ gradeId: 'p1', unitNo: 1 }],
  },
  {
    id: 'keyboard-practice-kj',
    title: 'เกมนักสำรวจคีย์บอร์ด',
    desc: 'เกมในเว็บนี้สำหรับ ป.1 ฝึก Spacebar, Enter, Backspace ตัวอักษร ตัวเลข และคำสั่ง Save',
    url: '/games/keyboard-practice',
    emoji: '⌨️',
    category: 'basic',
    badge: 'สร้างเอง',
    targetUnits: [{ gradeId: 'p1', unitNo: 1 }],
  },
  {
    id: 'codeorg-drag-drop',
    title: 'Code.org Learn to Drag and Drop',
    desc: 'บทเรียนฝึกใช้เมาส์ ลากและวางชิ้นส่วน เหมาะก่อนเริ่มเขียนโปรแกรมแบบบล็อก',
    url: 'https://studio.code.org/s/pre-express-2023/lessons/1',
    emoji: '🧩',
    category: 'basic',
    badge: 'เหมาะกับ ป.1',
    targetUnits: [{ gradeId: 'p1', unitNo: 1 }, { gradeId: 'p1', unitNo: 3 }],
  },
  {
    id: 'dragon-drop-mouse',
    title: 'Dragon Drop',
    desc: 'เกมฝึกคลิก ดับเบิลคลิก และลากวางเมาส์ มีด่านสั้น ๆ เพิ่มความแม่นยำ',
    url: 'https://www.roomrecess.com/games/DragonDrop/play.html',
    emoji: '🎯',
    category: 'basic',
    targetUnits: [{ gradeId: 'p1', unitNo: 1 }],
  },
  {
    id: 'jspaint-p1',
    title: 'JS Paint',
    desc: 'ฝึกคลิก เลือกเครื่องมือ ลากเส้น และระบายสี เหมาะกับหน่วยใช้งานเทคโนโลยีเบื้องต้น',
    url: 'https://jspaint.app/',
    emoji: '🎨',
    category: 'basic',
    targetUnits: [{ gradeId: 'p1', unitNo: 1 }, { gradeId: 'p2', unitNo: 3 }],
  },
  {
    id: 'poki-creative-puzzle',
    title: 'Poki Kids: Creative Puzzle',
    desc: 'เกมระบายสีและต่อภาพ ฝึกคลิก ลากวาง และสังเกตรายละเอียด เหมาะกับเด็กเล็ก',
    url: 'https://kids.poki.com/game/creative-puzzle',
    emoji: '🧩',
    category: 'basic',
    badge: 'Poki Kids',
    targetUnits: [{ gradeId: 'p1', unitNo: 1 }, { gradeId: 'p1', unitNo: 2 }],
  },
  {
    id: 'poki-happy-crayons',
    title: 'Poki Kids: Happy Crayons',
    desc: 'เกมระบายสีออนไลน์ ฝึกใช้เมาส์เลือกสีและลากระบาย เหมาะกับหน่วย Paint',
    url: 'https://kids.poki.com/game/happy-crayons',
    emoji: '🖍️',
    category: 'basic',
    badge: 'Poki Kids',
    targetUnits: [{ gradeId: 'p1', unitNo: 1 }],
  },
  {
    id: 'typingstudy-kedmanee-lesson1',
    title: 'TypingStudy — ฝึกพิมพ์ดีดไทย (เกษมณี) บทที่ 1',
    desc: 'บทแรกฝึกแม่บ้านนิ้ว ฟห ก ด ่ า — เริ่มต้นพิมพ์ดีดภาษาไทยจากศูนย์',
    url: 'https://www.typingstudy.com/th-thai_kedmanee-3/lesson/1',
    emoji: '⌨️',
    category: 'basic',
    badge: 'แนะนำ',
    targetUnits: [
      { gradeId: 'p3', unitNo: 1 }, { gradeId: 'p4', unitNo: 1 },
      { gradeId: 'p5', unitNo: 1 }, { gradeId: 'p6', unitNo: 1 },
    ],
  },
  {
    id: 'typingstudy-kedmanee-hub',
    title: 'TypingStudy — รวมบททุกบท (เกษมณี)',
    desc: 'รวม 15+ บทฝึกพิมพ์ดีดภาษาไทยแป้นเกษมณี — ทำคล่อง พิมพ์ได้เร็วขึ้น',
    url: 'https://www.typingstudy.com/th-thai_kedmanee-3/',
    emoji: '🇹🇭',
    category: 'basic',
    targetUnits: [
      { gradeId: 'p3', unitNo: 1 }, { gradeId: 'p4', unitNo: 1 },
      { gradeId: 'p5', unitNo: 1 }, { gradeId: 'p6', unitNo: 1 },
      { gradeId: 'm1-cs', unitNo: 1 }, { gradeId: 'm2-cs', unitNo: 1 }, { gradeId: 'm3-cs', unitNo: 1 },
    ],
  },
  {
    id: 'typingstudy-en-hub',
    title: 'TypingStudy — ฝึกพิมพ์ดีดภาษาอังกฤษ',
    desc: 'ฝึกพิมพ์ดีดภาษาอังกฤษ 15 บท — ใช้คู่กับการเขียนโปรแกรม Scratch / Python',
    url: 'https://www.typingstudy.com/th-english-3/',
    emoji: '🅰️',
    category: 'basic',
    targetUnits: [
      { gradeId: 'p4', unitNo: 1 }, { gradeId: 'p5', unitNo: 1 }, { gradeId: 'p6', unitNo: 1 },
      { gradeId: 'm1-cs', unitNo: 2 }, { gradeId: 'm2-cs', unitNo: 2 }, { gradeId: 'm3-cs', unitNo: 1 },
    ],
  },
];

// ===== หมวดคิดเชิงคำนวณ (Computational Thinking) =====
const computationalResources: LearningResource[] = [
  {
    id: 'poki-happy-kittens-puzzle',
    title: 'Poki Kids: Happy Kittens Puzzle',
    desc: 'เกมปริศนาจับคู่/แก้ปัญหา ฝึกคิดก่อนคลิกและสังเกตผลลัพธ์',
    url: 'https://kids.poki.com/game/happy-kittens-puzzle',
    emoji: '🐱',
    category: 'computational',
    badge: 'Poki Kids',
    targetUnits: [{ gradeId: 'p1', unitNo: 2 }],
  },
  {
    id: 'poki-beeline',
    title: 'Poki Kids: BeeLine',
    desc: 'เกมวางแผนเส้นทาง ฝึกคิดลำดับและเลือกทางเดินให้ถึงเป้าหมาย',
    url: 'https://kids.poki.com/game/beeline',
    emoji: '🐝',
    category: 'computational',
    badge: 'Poki Kids',
    targetUnits: [{ gradeId: 'p1', unitNo: 2 }, { gradeId: 'p1', unitNo: 3 }],
  },
  {
    id: 'poki-draw-parking',
    title: 'Poki Kids: Draw Parking',
    desc: 'เกมวาดเส้นทางให้รถไปจอด ฝึกวางแผน ลากเส้น และตรวจสอบเส้นทาง',
    url: 'https://kids.poki.com/game/draw-parking',
    emoji: '🚗',
    category: 'computational',
    badge: 'Poki Kids',
    targetUnits: [{ gradeId: 'p1', unitNo: 2 }, { gradeId: 'p1', unitNo: 3 }],
  },
  {
    id: 'csunplugged',
    title: 'CS Unplugged',
    desc: 'กิจกรรมคิดเชิงคำนวณแบบไม่ต้องใช้คอม — ใช้ในห้องเรียนได้',
    url: 'https://csunplugged.org/th/',
    emoji: '🎲',
    category: 'computational',
    targetUnits: [
      { gradeId: 'p1', unitNo: 2 }, { gradeId: 'p2', unitNo: 1 }, { gradeId: 'p3', unitNo: 1 },
    ],
  },
  {
    id: 'bebras',
    title: 'Bebras Challenge',
    desc: 'โจทย์คิดเชิงคำนวณระดับนานาชาติ — ฟรี ภาษาไทย',
    url: 'https://www.bebras.org/',
    emoji: '🦫',
    category: 'computational',
    targetUnits: [
      { gradeId: 'p4', unitNo: 1 }, { gradeId: 'p5', unitNo: 1 }, { gradeId: 'p6', unitNo: 1 },
      { gradeId: 'm1-cs', unitNo: 1 }, { gradeId: 'm2-cs', unitNo: 1 },
    ],
  },
  {
    id: 'codingthailand',
    title: 'CodingThailand.org',
    desc: 'หลักสูตรวิทยาการคำนวณภาษาไทย — มาตรฐาน สสวท.',
    url: 'https://codingthailand.org/',
    emoji: '🇹🇭',
    category: 'computational',
    badge: 'สสวท.',
    targetUnits: [
      { gradeId: 'p1', unitNo: 2 }, { gradeId: 'p2', unitNo: 1 }, { gradeId: 'p3', unitNo: 1 },
      { gradeId: 'p4', unitNo: 1 }, { gradeId: 'p5', unitNo: 1 }, { gradeId: 'p6', unitNo: 1 },
    ],
  },
];

// ===== หมวดข้อมูล/นำเสนอ (Data Science & Presentation) =====
const dataResources: LearningResource[] = [
  {
    id: 'canva',
    title: 'Canva (Education)',
    desc: 'ออกแบบกราฟิก โปสเตอร์ Infographic — สำหรับนำเสนอข้อมูล',
    url: 'https://www.canva.com/education/',
    emoji: '🎨',
    category: 'data',
    targetUnits: [
      { gradeId: 'p4', unitNo: 4 }, { gradeId: 'p5', unitNo: 4 }, { gradeId: 'p6', unitNo: 4 },
    ],
  },
  {
    id: 'datawrapper',
    title: 'Datawrapper',
    desc: 'สร้างแผนภูมิ/กราฟ จากข้อมูลจริง — ไม่ต้องเขียนโค้ด',
    url: 'https://www.datawrapper.de/',
    emoji: '📊',
    category: 'data',
    targetUnits: [
      { gradeId: 'p5', unitNo: 4 }, { gradeId: 'p6', unitNo: 4 }, { gradeId: 'm1-cs', unitNo: 2 },
    ],
  },
  {
    id: 'gapminder',
    title: 'Gapminder',
    desc: 'สำรวจข้อมูลโลก ผ่าน data visualization — Hans Rosling',
    url: 'https://www.gapminder.org/tools/',
    emoji: '🌍',
    category: 'data',
    targetUnits: [
      { gradeId: 'p6', unitNo: 4 }, { gradeId: 'm1-cs', unitNo: 2 }, { gradeId: 'm2-cs', unitNo: 2 },
    ],
  },
];

// ===== หมวดความปลอดภัย/รู้เท่าทันสื่อ (Digital Citizenship) =====
const safetyResources: LearningResource[] = [
  {
    id: 'interland',
    title: 'Interland (Be Internet Awesome)',
    desc: 'เกมท่องโลกดิจิทัลปลอดภัย จาก Google — ภาษาไทย',
    url: 'https://beinternetawesome.withgoogle.com/th_th/interland',
    emoji: '🌐',
    category: 'safety',
    targetUnits: [
      { gradeId: 'p1', unitNo: 4 }, { gradeId: 'p2', unitNo: 4 }, { gradeId: 'p3', unitNo: 5 },
      { gradeId: 'p4', unitNo: 5 }, { gradeId: 'p5', unitNo: 5 },
    ],
  },
  {
    id: 'thinkdigital',
    title: 'Think Digital App',
    desc: 'แพลตฟอร์มพัฒนาความฉลาดทางดิจิทัล — DQ Score',
    url: 'https://think-digital.app/',
    emoji: '🛡️',
    category: 'safety',
    badge: 'แนะนำ',
    targetUnits: [
      { gradeId: 'p4', unitNo: 5 }, { gradeId: 'p5', unitNo: 5 }, { gradeId: 'p6', unitNo: 4 },
    ],
  },
  {
    id: 'password-game',
    title: 'The Password Game',
    desc: 'เกมตั้งรหัสผ่านที่ปลอดภัย — เรียนรู้ความปลอดภัยไซเบอร์',
    url: 'https://think-digital.app/minigame/password',
    emoji: '🔒',
    category: 'safety',
    targetUnits: [{ gradeId: 'p4', unitNo: 5 }, { gradeId: 'p5', unitNo: 5 }],
  },
  {
    id: 'cipher',
    title: 'Cipher Mini Game',
    desc: 'ถอดรหัสลับ — ฝึกตรรกะและความปลอดภัย',
    url: 'https://codingthailand.app/minigame/cipher',
    emoji: '🔐',
    category: 'safety',
    targetUnits: [
      { gradeId: 'p4', unitNo: 1 }, { gradeId: 'p5', unitNo: 1 }, { gradeId: 'p6', unitNo: 1 },
    ],
  },
];

// ===== หมวด AI =====
const aiResources: LearningResource[] = [
  {
    id: 'teachable-machine',
    title: 'Teachable Machine',
    desc: 'สร้าง AI โมเดลด้วยตัวเอง — จำแนกรูป เสียง ท่าทาง ไม่ต้องเขียนโค้ด',
    url: 'https://teachablemachine.withgoogle.com/',
    emoji: '🧠',
    category: 'ai',
    badge: 'ยอดนิยม',
    targetUnits: [
      { gradeId: 'ai-p1-3', unitNo: 2 }, { gradeId: 'ai-p4-6', unitNo: 2 },
      { gradeId: 'ai-m1-3', unitNo: 2 }, { gradeId: 'ai-m1-3', unitNo: 5 },
    ],
  },
  {
    id: 'quickdraw',
    title: 'Quick, Draw!',
    desc: 'วาดรูป 20 วินาที ให้ AI ทาย — เห็น Machine Learning ทำงานจริง',
    url: 'https://quickdraw.withgoogle.com/',
    emoji: '🎨',
    category: 'ai',
    targetUnits: [
      { gradeId: 'ai-p1-3', unitNo: 1 }, { gradeId: 'ai-p4-6', unitNo: 1 },
    ],
  },
  {
    id: 'ai-oceans',
    title: 'AI for Oceans',
    desc: 'สอน AI คัดแยกขยะในทะเล จาก Code.org — เข้าใจ ML แบบสนุก',
    url: 'https://code.org/oceans',
    emoji: '🌊',
    category: 'ai',
    targetUnits: [
      { gradeId: 'ai-p1-3', unitNo: 1 }, { gradeId: 'ai-p4-6', unitNo: 4 },
      { gradeId: 'ai-m1-3', unitNo: 4 },
    ],
  },
  {
    id: 'autodraw',
    title: 'AutoDraw',
    desc: 'วาดมือเส้นง่ายๆ → AI แปลงเป็นรูปสวย',
    url: 'https://www.autodraw.com/',
    emoji: '✏️',
    category: 'ai',
    targetUnits: [{ gradeId: 'ai-p4-6', unitNo: 3 }, { gradeId: 'ai-m1-3', unitNo: 2 }],
  },
  {
    id: 'nn-playground',
    title: 'Neural Network Playground',
    desc: 'ทดลองสร้าง Neural Network แบบ interactive',
    url: 'https://playground.tensorflow.org/',
    emoji: '🔬',
    category: 'ai',
    targetUnits: [{ gradeId: 'ai-m1-3', unitNo: 1 }, { gradeId: 'ai-m1-3', unitNo: 2 }],
  },
  {
    id: 'ml4kids',
    title: 'Machine Learning for Kids',
    desc: 'สร้าง AI ใน Scratch — ฝึกสอนโมเดลก่อนเอาไปเขียนโปรแกรม',
    url: 'https://machinelearningforkids.co.uk/scratch3/',
    emoji: '🤖',
    category: 'ai',
    targetUnits: [{ gradeId: 'ai-p4-6', unitNo: 2 }],
  },
  {
    id: 'huggingface',
    title: 'Hugging Face Spaces',
    desc: 'ลองเล่น AI Demo หลายรูปแบบ — สร้างภาพ แปลภาษา ฯลฯ',
    url: 'https://huggingface.co/spaces',
    emoji: '🤗',
    category: 'ai',
    targetUnits: [{ gradeId: 'ai-m1-3', unitNo: 5 }],
  },
];

// ===== หมวดออกแบบเทคโนโลยี (Design Thinking) =====
const designResources: LearningResource[] = [
  {
    id: 'tinkercad',
    title: 'Tinkercad',
    desc: 'ออกแบบ 3D + วงจร electronics + Arduino simulator',
    url: 'https://www.tinkercad.com/',
    emoji: '🔧',
    category: 'design',
    targetUnits: [
      { gradeId: 'm1-design', unitNo: 4 }, { gradeId: 'm2-design', unitNo: 3 }, { gradeId: 'm3-design', unitNo: 3 },
      { gradeId: 'arduino-basic', unitNo: 3 }, { gradeId: 'arduino-basic', unitNo: 4 }, { gradeId: 'arduino-basic', unitNo: 5 },
    ],
  },
  {
    id: 'wokwi-arduino',
    title: 'Wokwi Arduino Simulator',
    desc: 'จำลอง Arduino UNO เซนเซอร์ จอแสดงผล และวงจรก่อนลงมือต่อจริง',
    url: 'https://wokwi.com/arduino',
    emoji: '🧪',
    category: 'programming',
    badge: 'Arduino',
    targetUnits: [
      { gradeId: 'arduino-basic', unitNo: 2 }, { gradeId: 'arduino-basic', unitNo: 3 },
      { gradeId: 'arduino-basic', unitNo: 4 }, { gradeId: 'arduino-basic', unitNo: 5 },
      { gradeId: 'arduino-basic', unitNo: 6 },
    ],
  },
  {
    id: 'figma',
    title: 'Figma',
    desc: 'ออกแบบ UI/Prototype — สำหรับ design thinking',
    url: 'https://www.figma.com/',
    emoji: '🎨',
    category: 'design',
    targetUnits: [{ gradeId: 'm2-design', unitNo: 2 }, { gradeId: 'm3-design', unitNo: 2 }],
  },
  {
    id: 'excalidraw',
    title: 'Excalidraw',
    desc: 'วาด diagram, mind map, prototype — ไม่ต้อง login',
    url: 'https://excalidraw.com/',
    emoji: '✏️',
    category: 'design',
    targetUnits: [
      { gradeId: 'm1-design', unitNo: 3 }, { gradeId: 'm2-design', unitNo: 2 }, { gradeId: 'm3-design', unitNo: 2 },
    ],
  },
];

const officialResources: LearningResource[] = [
  {
    id: 'official-praphas-arduino',
    title: 'ชุดบทเรียน Arduino',
    desc: 'รวมบทความ Arduino เรียนทำหุ่นยนต์ ไฟกระพริบ เซ็นเซอร์ เริ่มจากศูนย์ได้',
    url: 'https://www.praphas.com/index.php/2008-11-03-14-25-25/51-arduino/',
    emoji: '🔌',
    category: 'programming',
    badge: 'เริ่มต้น',
    targetUnits: [],
  },
  {
    id: 'official-codingthailand',
    title: 'CodingThailand วิทยาการคำนวณ',
    desc: 'บทเรียนและแนวคิดวิทยาการคำนวณ ป.1-ป.6 เน้นการคิดเชิงคำนวณและการแก้ปัญหา',
    url: 'https://codingthailand.org/computer-science/',
    emoji: '💻',
    category: 'programming',
    badge: 'แหล่งทางการ',
    targetUnits: [],
  },
  {
    id: 'official-project14',
    title: 'Project 14 สสวท.',
    desc: 'คลิปวิดีโอบทเรียนวิทยาการคำนวณ ดูทบทวนได้ เรียนพร้อมหนังสือเรียน สสวท.',
    url: 'https://proj14.ipst.ac.th/',
    emoji: '🎬',
    category: 'computational',
    badge: 'แหล่งทางการ',
    targetUnits: [],
  },
  {
    id: 'official-computing-classroom',
    title: 'ห้องเรียนวิทยาการคำนวณ',
    desc: 'รวมบทเรียนเสริมรายบทสำหรับ ป.1-ป.6 และ ม.1-ม.3 รวมถึงออกแบบและเทคโนโลยี',
    url: 'https://www.xn--42c2dag4cb3c3ah6pd.xn--o3cw4h/',
    emoji: '🏫',
    category: 'computational',
    badge: 'แหล่งเรียนรู้เสริม',
    targetUnits: [],
  },

  // ===== Project 14 สสวท. ต่อระดับชั้น =====
  {
    id: 'proj14-p1',
    title: 'Project 14 — เทคโนโลยี ป.1',
    desc: 'หนังสือเรียน + คลิปวิดีโอวิทยาการคำนวณ ป.1 — ทบทวนได้ทุกหน่วย',
    url: 'https://proj14.ipst.ac.th/p1/p1-com/',
    emoji: '🎬',
    category: 'computational',
    badge: 'สสวท.',
    targetUnits: [
      { gradeId: 'p1', unitNo: 1 }, { gradeId: 'p1', unitNo: 2 },
      { gradeId: 'p1', unitNo: 3 }, { gradeId: 'p1', unitNo: 4 },
    ],
  },
  {
    id: 'proj14-p2',
    title: 'Project 14 — เทคโนโลยี ป.2',
    desc: 'หนังสือ + คลิปวิดีโอ ว 4.2 ป.2 ครบทุกหน่วย',
    url: 'https://proj14.ipst.ac.th/p2/p2-com/',
    emoji: '🎬',
    category: 'computational',
    badge: 'สสวท.',
    targetUnits: [
      { gradeId: 'p2', unitNo: 1 }, { gradeId: 'p2', unitNo: 2 },
      { gradeId: 'p2', unitNo: 3 }, { gradeId: 'p2', unitNo: 4 },
    ],
  },
  {
    id: 'proj14-p3',
    title: 'Project 14 — เทคโนโลยี ป.3',
    desc: 'คลิปวิดีโอตามตัวชี้วัด ว 4.2 ป.3 + เอกสารประกอบ',
    url: 'https://proj14.ipst.ac.th/p3/p3-com/',
    emoji: '🎬',
    category: 'computational',
    badge: 'สสวท.',
    targetUnits: [
      { gradeId: 'p3', unitNo: 1 }, { gradeId: 'p3', unitNo: 2 },
      { gradeId: 'p3', unitNo: 3 }, { gradeId: 'p3', unitNo: 4 }, { gradeId: 'p3', unitNo: 5 },
    ],
  },
  {
    id: 'proj14-p4',
    title: 'Project 14 — วิทยาการคำนวณ ป.4',
    desc: 'คลิปวิดีโอตามตัวชี้วัด ว 4.2 ป.4',
    url: 'https://proj14.ipst.ac.th/p4/p4-cs/',
    emoji: '🎬',
    category: 'computational',
    badge: 'สสวท.',
    targetUnits: [
      { gradeId: 'p4', unitNo: 1 }, { gradeId: 'p4', unitNo: 2 },
      { gradeId: 'p4', unitNo: 3 }, { gradeId: 'p4', unitNo: 4 }, { gradeId: 'p4', unitNo: 5 },
    ],
  },
  {
    id: 'proj14-p5',
    title: 'Project 14 — วิทยาการคำนวณ ป.5',
    desc: 'คลิปวิดีโอตามตัวชี้วัด ว 4.2 ป.5',
    url: 'https://proj14.ipst.ac.th/p5/p5-cs/',
    emoji: '🎬',
    category: 'computational',
    badge: 'สสวท.',
    targetUnits: [
      { gradeId: 'p5', unitNo: 1 }, { gradeId: 'p5', unitNo: 2 },
      { gradeId: 'p5', unitNo: 3 }, { gradeId: 'p5', unitNo: 4 }, { gradeId: 'p5', unitNo: 5 },
    ],
  },
  {
    id: 'proj14-p6',
    title: 'Project 14 — วิทยาการคำนวณ ป.6',
    desc: 'คลิปวิดีโอ + ใบกิจกรรมตามตัวชี้วัด ว 4.2 ป.6',
    url: 'https://proj14.ipst.ac.th/p6/p6-cs/',
    emoji: '🎬',
    category: 'computational',
    badge: 'สสวท.',
    targetUnits: [
      { gradeId: 'p6', unitNo: 1 }, { gradeId: 'p6', unitNo: 2 },
      { gradeId: 'p6', unitNo: 3 }, { gradeId: 'p6', unitNo: 4 },
    ],
  },
  {
    id: 'proj14-m1-cs',
    title: 'Project 14 — วิทยาการคำนวณ ม.1',
    desc: 'คลิปวิดีโอ ว 4.2 ม.1 (อัลกอริทึม + เขียนโปรแกรม Scratch)',
    url: 'https://proj14.ipst.ac.th/m1/m1-cs/',
    emoji: '🎬',
    category: 'programming',
    badge: 'สสวท.',
    targetUnits: [
      { gradeId: 'm1-cs', unitNo: 1 }, { gradeId: 'm1-cs', unitNo: 2 },
    ],
  },
  {
    id: 'proj14-m1-design',
    title: 'Project 14 — ออกแบบและเทคโนโลยี ม.1',
    desc: 'คลิปวิดีโอ ว 4.1 ม.1 (กระบวนการออกแบบเชิงวิศวกรรม)',
    url: 'https://proj14.ipst.ac.th/m1/m1-de/',
    emoji: '🛠️',
    category: 'design',
    badge: 'สสวท.',
    targetUnits: [
      { gradeId: 'm1-design', unitNo: 1 }, { gradeId: 'm1-design', unitNo: 2 },
      { gradeId: 'm1-design', unitNo: 3 }, { gradeId: 'm1-design', unitNo: 4 },
    ],
  },
  {
    id: 'proj14-m2-cs',
    title: 'Project 14 — วิทยาการคำนวณ ม.2',
    desc: 'คลิปวิดีโอ ว 4.2 ม.2 (Python + ระบบคอมพิวเตอร์)',
    url: 'https://proj14.ipst.ac.th/m2/m2-cs/',
    emoji: '🎬',
    category: 'programming',
    badge: 'สสวท.',
    targetUnits: [
      { gradeId: 'm2-cs', unitNo: 1 }, { gradeId: 'm2-cs', unitNo: 2 },
      { gradeId: 'm2-cs', unitNo: 3 }, { gradeId: 'm2-cs', unitNo: 4 },
    ],
  },
  {
    id: 'proj14-m2-design',
    title: 'Project 14 — ออกแบบและเทคโนโลยี ม.2',
    desc: 'คลิปวิดีโอ ว 4.1 ม.2 (วัสดุ + เทคโนโลยีในชีวิต)',
    url: 'https://proj14.ipst.ac.th/m2/m2-de/',
    emoji: '🛠️',
    category: 'design',
    badge: 'สสวท.',
    targetUnits: [
      { gradeId: 'm2-design', unitNo: 1 }, { gradeId: 'm2-design', unitNo: 2 },
      { gradeId: 'm2-design', unitNo: 3 }, { gradeId: 'm2-design', unitNo: 4 },
    ],
  },
  {
    id: 'proj14-m3-cs',
    title: 'Project 14 — วิทยาการคำนวณ ม.3',
    desc: 'คลิปวิดีโอ ว 4.2 ม.3 (พัฒนาแอป + ข้อมูลและสารสนเทศ)',
    url: 'https://proj14.ipst.ac.th/m3/m3-cs/',
    emoji: '🎬',
    category: 'programming',
    badge: 'สสวท.',
    targetUnits: [
      { gradeId: 'm3-cs', unitNo: 1 }, { gradeId: 'm3-cs', unitNo: 2 },
      { gradeId: 'm3-cs', unitNo: 3 }, { gradeId: 'm3-cs', unitNo: 4 },
    ],
  },
  {
    id: 'proj14-m3-design',
    title: 'Project 14 — ออกแบบและเทคโนโลยี ม.3',
    desc: 'คลิปวิดีโอ ว 4.1 ม.3 (สร้างนวัตกรรมในชุมชน)',
    url: 'https://proj14.ipst.ac.th/m3/m3-de/',
    emoji: '🛠️',
    category: 'design',
    badge: 'สสวท.',
    targetUnits: [
      { gradeId: 'm3-design', unitNo: 1 }, { gradeId: 'm3-design', unitNo: 2 },
      { gradeId: 'm3-design', unitNo: 3 }, { gradeId: 'm3-design', unitNo: 4 },
    ],
  },

  // ===== CodingThailand ต่อระดับชั้น =====
  {
    id: 'ct-p1',
    title: 'CodingThailand ป.1',
    desc: 'หลักสูตรวิทยาการคำนวณ ป.1 — แบบฝึก + เกม + วิดีโอ',
    url: 'https://codingthailand.org/courses/2022/p1',
    emoji: '🇹🇭',
    category: 'computational',
    badge: 'สสวท.',
    targetUnits: [
      { gradeId: 'p1', unitNo: 1 }, { gradeId: 'p1', unitNo: 2 },
      { gradeId: 'p1', unitNo: 3 }, { gradeId: 'p1', unitNo: 4 },
    ],
  },
  {
    id: 'ct-p2',
    title: 'CodingThailand ป.2',
    desc: 'หลักสูตรวิทยาการคำนวณ ป.2',
    url: 'https://codingthailand.org/courses/2022/p2',
    emoji: '🇹🇭',
    category: 'computational',
    badge: 'สสวท.',
    targetUnits: [
      { gradeId: 'p2', unitNo: 1 }, { gradeId: 'p2', unitNo: 2 },
      { gradeId: 'p2', unitNo: 3 }, { gradeId: 'p2', unitNo: 4 },
    ],
  },
  {
    id: 'ct-p3',
    title: 'CodingThailand ป.3',
    desc: 'หลักสูตรวิทยาการคำนวณ ป.3',
    url: 'https://codingthailand.org/courses/2022/p3',
    emoji: '🇹🇭',
    category: 'computational',
    badge: 'สสวท.',
    targetUnits: [
      { gradeId: 'p3', unitNo: 1 }, { gradeId: 'p3', unitNo: 2 },
      { gradeId: 'p3', unitNo: 3 }, { gradeId: 'p3', unitNo: 4 }, { gradeId: 'p3', unitNo: 5 },
    ],
  },
  {
    id: 'ct-p4',
    title: 'CodingThailand ป.4',
    desc: 'หลักสูตรวิทยาการคำนวณ ป.4 — เริ่ม Scratch',
    url: 'https://codingthailand.org/courses/2022/p4',
    emoji: '🇹🇭',
    category: 'programming',
    badge: 'สสวท.',
    targetUnits: [
      { gradeId: 'p4', unitNo: 1 }, { gradeId: 'p4', unitNo: 2 },
      { gradeId: 'p4', unitNo: 3 }, { gradeId: 'p4', unitNo: 4 }, { gradeId: 'p4', unitNo: 5 },
    ],
  },
  {
    id: 'ct-p5',
    title: 'CodingThailand ป.5',
    desc: 'หลักสูตรวิทยาการคำนวณ ป.5 — Scratch ขั้นสูง + ตัวแปร',
    url: 'https://codingthailand.org/courses/2022/p5',
    emoji: '🇹🇭',
    category: 'programming',
    badge: 'สสวท.',
    targetUnits: [
      { gradeId: 'p5', unitNo: 1 }, { gradeId: 'p5', unitNo: 2 },
      { gradeId: 'p5', unitNo: 3 }, { gradeId: 'p5', unitNo: 4 }, { gradeId: 'p5', unitNo: 5 },
    ],
  },
  {
    id: 'ct-p6',
    title: 'CodingThailand ป.6',
    desc: 'หลักสูตรวิทยาการคำนวณ ป.6 — Logo + เริ่ม Python',
    url: 'https://codingthailand.org/courses/2022/p6',
    emoji: '🇹🇭',
    category: 'programming',
    badge: 'สสวท.',
    targetUnits: [
      { gradeId: 'p6', unitNo: 1 }, { gradeId: 'p6', unitNo: 2 },
      { gradeId: 'p6', unitNo: 3 }, { gradeId: 'p6', unitNo: 4 },
    ],
  },
  {
    id: 'ct-m1',
    title: 'CodingThailand ม.1',
    desc: 'วิทยาการคำนวณ ม.1 — Scratch + Python เบื้องต้น',
    url: 'https://codingthailand.org/courses/2022/m1',
    emoji: '🇹🇭',
    category: 'programming',
    badge: 'สสวท.',
    targetUnits: [{ gradeId: 'm1-cs', unitNo: 1 }, { gradeId: 'm1-cs', unitNo: 2 }],
  },
  {
    id: 'ct-m2',
    title: 'CodingThailand ม.2',
    desc: 'วิทยาการคำนวณ ม.2 — Python + ระบบคอมพิวเตอร์',
    url: 'https://codingthailand.org/courses/2022/m2',
    emoji: '🇹🇭',
    category: 'programming',
    badge: 'สสวท.',
    targetUnits: [
      { gradeId: 'm2-cs', unitNo: 1 }, { gradeId: 'm2-cs', unitNo: 2 },
      { gradeId: 'm2-cs', unitNo: 3 }, { gradeId: 'm2-cs', unitNo: 4 },
    ],
  },
  {
    id: 'ct-m3',
    title: 'CodingThailand ม.3',
    desc: 'วิทยาการคำนวณ ม.3 — App Inventor + Data Science',
    url: 'https://codingthailand.org/courses/2022/m3',
    emoji: '🇹🇭',
    category: 'programming',
    badge: 'สสวท.',
    targetUnits: [
      { gradeId: 'm3-cs', unitNo: 1 }, { gradeId: 'm3-cs', unitNo: 2 },
      { gradeId: 'm3-cs', unitNo: 3 }, { gradeId: 'm3-cs', unitNo: 4 },
    ],
  },

  // ===== คลังสื่อ.ไทย ต่อระดับชั้น =====
  {
    id: 'kuntsr-p1-3',
    title: 'ห้องเรียนวิทยาการคำนวณ ป.1-3',
    desc: 'แบบฝึกหัด ใบกิจกรรม สื่อการสอน — แยกตามระดับชั้น',
    url: 'https://www.xn--42c2dag4cb3c3ah6pd.xn--o3cw4h/p1-3',
    emoji: '🏫',
    category: 'computational',
    badge: 'แหล่งเสริม',
    targetUnits: [
      { gradeId: 'p1', unitNo: 1 }, { gradeId: 'p1', unitNo: 2 }, { gradeId: 'p1', unitNo: 3 },
      { gradeId: 'p2', unitNo: 1 }, { gradeId: 'p2', unitNo: 2 },
      { gradeId: 'p3', unitNo: 1 }, { gradeId: 'p3', unitNo: 2 },
    ],
  },
  {
    id: 'kuntsr-p4-6',
    title: 'ห้องเรียนวิทยาการคำนวณ ป.4-6',
    desc: 'สื่อการสอน Scratch + แบบฝึก ป.4-6',
    url: 'https://www.xn--42c2dag4cb3c3ah6pd.xn--o3cw4h/p4-6',
    emoji: '🏫',
    category: 'programming',
    badge: 'แหล่งเสริม',
    targetUnits: [
      { gradeId: 'p4', unitNo: 2 }, { gradeId: 'p4', unitNo: 4 },
      { gradeId: 'p5', unitNo: 2 }, { gradeId: 'p5', unitNo: 4 },
      { gradeId: 'p6', unitNo: 2 }, { gradeId: 'p6', unitNo: 4 },
    ],
  },
  {
    id: 'kuntsr-m1-3',
    title: 'ห้องเรียน ม.1-3 (วิทยาการคำนวณ + ออกแบบเทคโนโลยี)',
    desc: 'รวมเนื้อหามัธยมต้น ทั้ง ว 4.1 (ออกแบบ) และ ว 4.2 (วิทยาการคำนวณ)',
    url: 'https://www.xn--42c2dag4cb3c3ah6pd.xn--o3cw4h/m1-3',
    emoji: '🏫',
    category: 'programming',
    badge: 'แหล่งเสริม',
    targetUnits: [
      { gradeId: 'm1-cs', unitNo: 1 }, { gradeId: 'm1-cs', unitNo: 2 },
      { gradeId: 'm1-design', unitNo: 1 }, { gradeId: 'm1-design', unitNo: 2 },
      { gradeId: 'm2-cs', unitNo: 1 }, { gradeId: 'm2-cs', unitNo: 2 },
      { gradeId: 'm2-design', unitNo: 1 }, { gradeId: 'm2-design', unitNo: 2 },
      { gradeId: 'm3-cs', unitNo: 1 }, { gradeId: 'm3-cs', unitNo: 2 },
      { gradeId: 'm3-design', unitNo: 1 }, { gradeId: 'm3-design', unitNo: 2 },
    ],
  },
];

// ===== External 5 sites (เว็บที่ครูเจมส์เลือก — แยกระดับชั้นชัดเจน) =====
const externalResources: LearningResource[] = [
  // ----- Code Their Dreams: เกมโค้ดดิ้งออนไลน์ -----
  {
    id: 'ctd-hub',
    title: 'Code Their Dreams — เกมโค้ดดิ้งออนไลน์',
    desc: 'รวมเกมเขียนโปรแกรมออนไลน์ฟรี เหมาะทุกระดับ ป.4-ม.3 — ลากบล็อก, แก้ปริศนา, สร้างเกม',
    url: 'https://www.codetheirdreams.com/online-coding-games/',
    emoji: '🎮',
    category: 'programming',
    badge: 'รวมเกม',
    targetUnits: [
      { gradeId: 'p4', unitNo: 2 }, { gradeId: 'p5', unitNo: 2 }, { gradeId: 'p6', unitNo: 2 },
      { gradeId: 'm1-cs', unitNo: 1 }, { gradeId: 'm1-cs', unitNo: 2 },
      { gradeId: 'm2-cs', unitNo: 1 }, { gradeId: 'm2-cs', unitNo: 2 },
      { gradeId: 'm3-cs', unitNo: 1 }, { gradeId: 'm3-cs', unitNo: 2 },
    ],
  },

  // ----- Microsoft MakeCode (hub) -----
  {
    id: 'msmakecode-hub',
    title: 'Microsoft MakeCode (Hub)',
    desc: 'ศูนย์รวมเครื่องมือเขียนโปรแกรมแบบบล็อกของ Microsoft — Arcade, micro:bit, Minecraft, LEGO',
    url: 'https://www.microsoft.com/en-us/makecode',
    emoji: '🟦',
    category: 'programming',
    badge: 'Microsoft',
    targetUnits: [
      { gradeId: 'p4', unitNo: 2 }, { gradeId: 'p5', unitNo: 2 }, { gradeId: 'p6', unitNo: 2 },
      { gradeId: 'm1-cs', unitNo: 2 }, { gradeId: 'm2-cs', unitNo: 2 }, { gradeId: 'm3-cs', unitNo: 1 },
    ],
  },
  {
    id: 'msmakecode-arcade',
    title: 'MakeCode Arcade — สร้างเกมเรโทร',
    desc: 'เขียนเกม 16-bit แบบลากบล็อก คล้าย Game Boy เหมาะ ม.1-3',
    url: 'https://arcade.makecode.com/',
    emoji: '🕹️',
    category: 'programming',
    targetUnits: [
      { gradeId: 'm1-cs', unitNo: 2 }, { gradeId: 'm2-cs', unitNo: 2 }, { gradeId: 'm3-cs', unitNo: 1 },
    ],
  },
  {
    id: 'msmakecode-minecraft',
    title: 'MakeCode for Minecraft',
    desc: 'เขียนโค้ดควบคุม Agent ใน Minecraft — สนุก เด็กชอบ ป.4-ม.2',
    url: 'https://minecraft.makecode.com/',
    emoji: '🧱',
    category: 'programming',
    badge: 'Minecraft',
    targetUnits: [
      { gradeId: 'p4', unitNo: 2 }, { gradeId: 'p5', unitNo: 2 }, { gradeId: 'p6', unitNo: 2 },
      { gradeId: 'm1-cs', unitNo: 2 }, { gradeId: 'm2-cs', unitNo: 2 },
    ],
  },

  // ----- MakeCode for micro:bit -----
  {
    id: 'microbit-editor',
    title: 'micro:bit MakeCode Editor',
    desc: 'เขียนโปรแกรม micro:bit ลาก-วาง — ทำหุ่นยนต์ ตรวจวัด IoT',
    url: 'https://makecode.microbit.org/',
    emoji: '🔌',
    category: 'programming',
    badge: 'IoT',
    targetUnits: [
      { gradeId: 'p5', unitNo: 2 }, { gradeId: 'p6', unitNo: 2 },
      { gradeId: 'm1-cs', unitNo: 2 }, { gradeId: 'm1-design', unitNo: 4 },
      { gradeId: 'm2-cs', unitNo: 2 }, { gradeId: 'm2-design', unitNo: 4 },
      { gradeId: 'm3-cs', unitNo: 1 }, { gradeId: 'm3-design', unitNo: 4 },
    ],
  },
  {
    id: 'microbit-projects-kids',
    title: 'micro:bit Projects (เด็กเล็ก ป.5-6)',
    desc: 'โครงการง่ายๆ — flashing heart, name badge, dice — เริ่มต้น micro:bit',
    url: 'https://microbit.org/projects/make-it-code-it/',
    emoji: '💡',
    category: 'programming',
    targetUnits: [{ gradeId: 'p5', unitNo: 2 }, { gradeId: 'p6', unitNo: 2 }],
  },

  // ----- Gimkit — live quiz game (Kahoot-style with power-ups) -----
  {
    id: 'gimkit',
    title: 'Gimkit — เกมตอบคำถามสด',
    desc: 'เกมตอบคำถามแข่งกันสดๆ คล้าย Kahoot — มีระบบเงิน อัพเกรด และ power-ups',
    url: 'https://www.gimkit.com/',
    emoji: '🎯',
    category: 'computational',
    badge: 'สนุก',
    targetUnits: [
      { gradeId: 'p4', unitNo: 1 }, { gradeId: 'p5', unitNo: 1 }, { gradeId: 'p6', unitNo: 1 },
      { gradeId: 'm1-cs', unitNo: 1 }, { gradeId: 'm2-cs', unitNo: 1 }, { gradeId: 'm3-cs', unitNo: 1 },
    ],
  },

  // ----- Think Digital Blog -----
  {
    id: 'think-digital-blog',
    title: 'Think Digital Blog',
    desc: 'บทความเรื่อง digital literacy, AI, online safety — อ่านง่าย ภาษาไทย ป.4-ม.3',
    url: 'https://blog.think-digital.app/',
    emoji: '📰',
    category: 'safety',
    badge: 'บทความ',
    targetUnits: [
      { gradeId: 'p4', unitNo: 5 }, { gradeId: 'p5', unitNo: 5 }, { gradeId: 'p6', unitNo: 4 },
      { gradeId: 'm1-cs', unitNo: 4 }, { gradeId: 'm2-cs', unitNo: 4 }, { gradeId: 'm3-cs', unitNo: 4 },
    ],
  },
];

export const allResources: LearningResource[] = [
  ...officialResources,
  ...externalResources,
  ...basicResources,
  ...programmingResources,
  ...computationalResources,
  ...dataResources,
  ...safetyResources,
  ...aiResources,
  ...designResources,
];

// ===== Grade helpers (สำหรับ UI filter "แยกตามชั้น") =====
export const ALL_GRADES = [
  { id: 'p1', label: 'ป.1', emoji: '1️⃣' },
  { id: 'p2', label: 'ป.2', emoji: '2️⃣' },
  { id: 'p3', label: 'ป.3', emoji: '3️⃣' },
  { id: 'p4', label: 'ป.4', emoji: '4️⃣' },
  { id: 'p5', label: 'ป.5', emoji: '5️⃣' },
  { id: 'p6', label: 'ป.6', emoji: '6️⃣' },
  { id: 'm1-cs', label: 'ม.1 (cs)', emoji: '🅼1' },
  { id: 'm2-cs', label: 'ม.2 (cs)', emoji: '🅼2' },
  { id: 'm3-cs', label: 'ม.3 (cs)', emoji: '🅼3' },
] as const;

/** หา resources ที่ tag กับ grade นี้ (อย่างน้อย 1 unit ตรง) */
export const resourcesForGrade = (gradeId: string): LearningResource[] =>
  allResources.filter((r) => r.targetUnits.some((tu) => tu.gradeId === gradeId));

export const categoryInfo: Record<ResourceCategory, { title: string; emoji: string; desc: string; color: string }> = {
  basic: {
    title: 'ทักษะพื้นฐานคอมพิวเตอร์',
    emoji: '🖱️',
    desc: 'ฝึกใช้เมาส์ คีย์บอร์ด ลากวาง และเครื่องมือพื้นฐานสำหรับ ป.1',
    color: '#2563eb',
  },
  programming: {
    title: 'เขียนโปรแกรม (Programming)',
    emoji: '💻',
    desc: 'เครื่องมือเขียนโค้ด: Block-based, Mobile App, Hardware',
    color: '#6366f1',
  },
  computational: {
    title: 'คิดเชิงคำนวณ (Computational Thinking)',
    emoji: '🧩',
    desc: 'ฝึกแก้ปัญหา อัลกอริทึม คิดเป็นขั้นตอน',
    color: '#a855f7',
  },
  data: {
    title: 'ข้อมูลและการนำเสนอ (Data Science)',
    emoji: '📊',
    desc: 'วิเคราะห์ จัดการ และนำเสนอข้อมูล',
    color: '#ec4899',
  },
  safety: {
    title: 'รู้เท่าทันสื่อ (Digital Citizenship)',
    emoji: '🛡️',
    desc: 'ความปลอดภัยและการใช้เทคโนโลยีอย่างมีจริยธรรม',
    color: '#22c55e',
  },
  ai: {
    title: 'ปัญญาประดิษฐ์ (AI)',
    emoji: '🤖',
    desc: 'เครื่องมือสร้างและทดลอง AI แบบไม่ต้องเขียนโค้ด',
    color: '#f59e0b',
  },
  design: {
    title: 'ออกแบบเทคโนโลยี (Design)',
    emoji: '🎨',
    desc: 'ออกแบบ 3D, UI/UX, Prototype',
    color: '#06b6d4',
  },
};
