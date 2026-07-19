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
  };
}

// Unsplash CDN ฟรี (ไม่ต้อง API key)
const img = (id: string, w = 800) => `https://images.unsplash.com/${id}?w=${w}&q=80&auto=format&fit=crop`;

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
    title: '💻 ใช้คอมพิวเตอร์เพื่อนใหม่',
    emoji: '💻',
    theme: 'blue',
    layout: 'cover',
    body: 'มาทำความรู้จักกับคอมพิวเตอร์เพื่อนใหม่ของเรา — ของวิเศษที่ช่วยทำหลายอย่าง!',
    image: img('photo-1517694712202-14dd9538aa97'),
  },
  {
    title: 'ส่วนประกอบของคอมพิวเตอร์',
    emoji: '🔧',
    theme: 'green',
    layout: 'standard',
    bullets: [
      { emoji: '🖥️', text: 'หน้าจอ (Monitor)', sub: 'แสดงรูปและตัวอักษร' },
      { emoji: '⌨️', text: 'คีย์บอร์ด (Keyboard)', sub: 'พิมพ์ตัวอักษร ตัวเลข' },
      { emoji: '🖱️', text: 'เมาส์ (Mouse)', sub: 'ชี้ คลิก ลาก ของบนจอ' },
      { emoji: '📦', text: 'ตัวเครื่อง (CPU)', sub: 'สมองของคอมพิวเตอร์' },
      { emoji: '🔊', text: 'ลำโพง (Speaker)', sub: 'ส่งเสียงให้เราฟัง' },
    ],
    callout: { type: 'tip', emoji: '👉', text: 'คอมพิวเตอร์ทุกเครื่องมีส่วนประกอบเหมือนกันหมด — รู้แล้วใช้กับเครื่องไหนก็ได้!' },
  },
  {
    title: 'การใช้เมาส์ — เพื่อนคู่กัน',
    emoji: '🖱️',
    theme: 'purple',
    layout: 'standard',
    bullets: [
      { emoji: '👆', text: 'คลิกซ้าย', sub: 'กดปุ่มซ้าย 1 ครั้ง — เลือกของ' },
      { emoji: '👆👆', text: 'ดับเบิลคลิก', sub: 'กดปุ่มซ้าย 2 ครั้งเร็วๆ — เปิดของ' },
      { emoji: '👉', text: 'คลิกขวา', sub: 'กดปุ่มขวา — เปิดเมนู' },
      { emoji: '🤏', text: 'ลาก-วาง (Drag)', sub: 'กดค้าง + ลาก + ปล่อย — ย้ายของ' },
      { emoji: '🛞', text: 'ลูกกลิ้ง (Scroll)', sub: 'หมุนเลื่อนหน้าขึ้น-ลง' },
    ],
    image: img('photo-1527443224154-c4a3942d3acf', 400),
    imageCaption: 'เมาส์ — เครื่องมือชี้และคลิก',
  },
  {
    title: 'การใช้คีย์บอร์ด — พิมพ์เก่ง',
    emoji: '⌨️',
    theme: 'orange',
    layout: 'standard',
    bullets: [
      { emoji: '🔤', text: 'A–Z', sub: 'ตัวอักษรภาษาอังกฤษ' },
      { emoji: '🇹🇭', text: 'ก–ฮ', sub: 'ตัวอักษรภาษาไทย (กดปุ่มเปลี่ยน Alt+Shift)' },
      { emoji: '0️⃣', text: '0–9', sub: 'ตัวเลข' },
      { emoji: '⏎', text: 'Enter', sub: 'ขึ้นบรรทัดใหม่' },
      { emoji: '⌫', text: 'Backspace', sub: 'ลบตัวอักษรซ้ายเคอร์เซอร์' },
      { emoji: '⎵', text: 'Spacebar', sub: 'เว้นวรรค' },
    ],
  },
  {
    title: 'การดูแลคอมพิวเตอร์',
    emoji: '🧼',
    theme: 'pink',
    layout: 'standard',
    body: 'คอมพิวเตอร์เพื่อนเรา — ต้องดูแลให้ดี',
    bullets: [
      { emoji: '✅', text: 'ล้างมือก่อนใช้', sub: 'มือสะอาด → คีย์บอร์ดสะอาด' },
      { emoji: '✅', text: 'อย่ากินขนม-ดื่มน้ำใกล้ๆ', sub: 'น้ำหก = พังได้' },
      { emoji: '✅', text: 'ปิดเครื่องอย่างถูกวิธี', sub: 'เลือก Shut Down ไม่ใช่ดึงปลั๊ก' },
      { emoji: '✅', text: 'ใช้ผ้านุ่มเช็ดจอ', sub: 'อย่าใช้กระดาษทิชชู่ — เป็นรอย' },
      { emoji: '❌', text: 'อย่าทุบ อย่ากดแรง', sub: 'คอมพิวเตอร์เปราะบาง' },
    ],
    callout: { type: 'tip', emoji: '💡', text: 'รักษาคอมดีๆ → ใช้ได้นานหลายปี!' },
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
    title: '🧠 อัลกอริทึม — แผนผังการคิดของโปรแกรม',
    emoji: '🧠',
    theme: 'purple',
    layout: 'cover',
    body: 'ก่อนเขียนโปรแกรม ต้องวางแผนก่อน — อัลกอริทึมคือ "สูตรอาหาร" ของโปรแกรม',
    image: img('photo-1555066931-4365d14bab8c'),
  },
  {
    title: 'อัลกอริทึมคืออะไร?',
    emoji: '📋',
    theme: 'blue',
    layout: 'standard',
    body: 'อัลกอริทึม = ขั้นตอนการแก้ปัญหาที่ชัดเจน — ทำตามแล้วได้คำตอบเสมอ',
    bullets: [
      { emoji: '🍳', text: 'ตัวอย่าง: สูตรไข่เจียว', sub: '1) ตีไข่ 2) ใส่เกลือ 3) ตั้งกะทะ 4) ทอด — ใครทำตามก็ได้ไข่เจียว' },
      { emoji: '📞', text: 'ตัวอย่าง: โทรศัพท์', sub: '1) เปิดแอป 2) กดเบอร์ 3) กดโทร 4) คุย' },
      { emoji: '🚌', text: 'ตัวอย่าง: ขึ้นรถเมล์', sub: '1) ไปป้าย 2) รอ 3) ขึ้น 4) จ่ายเงิน 5) ลง' },
    ],
    callout: { type: 'tip', emoji: '💡', text: 'ทุกอย่างที่เราทำในชีวิต = อัลกอริทึม เพียงแต่เราไม่ได้คิดเป็นขั้นตอน' },
  },
  {
    title: 'ผังงาน (Flowchart) — เขียนอัลกอริทึมเป็นรูป',
    emoji: '📊',
    theme: 'green',
    layout: 'standard',
    bullets: [
      { emoji: '⭕', text: 'วงรี', sub: 'จุดเริ่ม / จบ' },
      { emoji: '⬜', text: 'สี่เหลี่ยมผืนผ้า', sub: 'การประมวลผล / การคำนวณ' },
      { emoji: '🔷', text: 'สี่เหลี่ยมขนมเปียกปูน', sub: 'การตัดสินใจ (ถ้า...แล้ว)' },
      { emoji: '⬛', text: 'สี่เหลี่ยมด้านเอียง', sub: 'รับเข้า / แสดงผล' },
      { emoji: '➡️', text: 'ลูกศร', sub: 'ทิศทางการทำงาน' },
    ],
    callout: { type: 'fun', emoji: '✏️', text: 'ใช้ Excalidraw หรือ Lucidchart วาด Flowchart ได้ฟรี!' },
  },
  {
    title: 'แนวคิดเชิงคำนวณ 4 ด้าน',
    emoji: '🎯',
    theme: 'orange',
    layout: 'standard',
    body: 'Computational Thinking — วิธีคิดแบบนักวิทยาการคำนวณ',
    bullets: [
      {
        emoji: '🧩',
        text: 'Decomposition — แตกย่อย',
        sub: 'แบ่งปัญหาใหญ่เป็นปัญหาเล็กๆ ที่แก้ง่าย',
      },
      {
        emoji: '🔍',
        text: 'Pattern Recognition — หาแพทเทิร์น',
        sub: 'มองหาสิ่งที่ซ้ำๆ → ใช้วิธีเดียวกันแก้ได้',
      },
      {
        emoji: '🎭',
        text: 'Abstraction — เลือกสิ่งสำคัญ',
        sub: 'ตัดรายละเอียดที่ไม่จำเป็นออก',
      },
      {
        emoji: '📋',
        text: 'Algorithm Design — ออกแบบขั้นตอน',
        sub: 'เขียนเป็นลำดับที่ชัดเจน',
      },
    ],
  },
  {
    title: 'ลองเขียนอัลกอริทึม — ทำสลัด!',
    emoji: '🥗',
    theme: 'pink',
    layout: 'standard',
    body: 'มาเขียนอัลกอริทึมการทำสลัดผัก แบบที่ AI ก็ทำตามได้',
    code: {
      lang: 'pseudo',
      content: `เริ่มต้น
   1. ล้างผักให้สะอาด
   2. หั่นผักเป็นชิ้นเล็กๆ
   3. ใส่ในชาม
   4. รับเข้า: ชนิดน้ำสลัด (สูตรไหน?)
   5. ถ้า น้ำสลัดเป็น "ครีม"
         ใส่น้ำสลัดครีม 2 ช้อน
      ไม่ใช่
         ใส่น้ำสลัดญี่ปุ่น 3 ช้อน
   6. คนให้เข้ากัน
   7. แสดงผล: สลัดพร้อมเสิร์ฟ
จบ`,
    },
    callout: { type: 'tip', emoji: '🎯', text: 'อัลกอริทึมที่ดี = คนหรือ AI ทำตามได้ ไม่งง' },
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
    title: '🐍 เขียนโปรแกรม Python — ภาษาที่ AI ใช้',
    emoji: '🐍',
    theme: 'green',
    layout: 'cover',
    body: 'Python คือภาษาโปรแกรมที่ใช้สร้าง AI, เว็บ, เกม, แอป — เริ่มต้นง่าย ใช้จริงได้',
    image: img('photo-1526379095098-d400fd0bf935'),
  },
  {
    title: 'ทำไมต้อง Python?',
    emoji: '🌟',
    theme: 'blue',
    layout: 'standard',
    bullets: [
      { emoji: '👶', text: 'อ่านง่ายเหมือนภาษาอังกฤษ', sub: 'print("hello") — ไม่ต้องท่อง syntax แปลกๆ' },
      { emoji: '🤖', text: 'ใช้สร้าง AI', sub: 'Google, Netflix, Instagram ใช้ Python' },
      { emoji: '📊', text: 'ใช้วิเคราะห์ข้อมูล', sub: 'pandas, numpy — ทำงาน Excel ได้ในโค้ด' },
      { emoji: '🌐', text: 'ใช้สร้างเว็บ', sub: 'Django, Flask' },
      { emoji: '💼', text: 'งานเยอะ เงินเดือนสูง', sub: 'อาชีพที่กำลังต้องการมากที่สุด' },
    ],
  },
  {
    title: 'Python พื้นฐาน — ตัวแปรและพิมพ์ออก',
    emoji: '📝',
    theme: 'orange',
    layout: 'standard',
    code: {
      lang: 'python',
      content: `# ตัวแปร — เก็บค่า
ชื่อ = "นักเรียน"
อายุ = 13
ส่วนสูง = 165.5
ชอบ_python = True

# พิมพ์ออกมา
print("สวัสดี", ชื่อ)
print(f"อายุ {อายุ} ปี")

# คำนวณ
ปีหน้า = อายุ + 1
print(f"ปีหน้าอายุ {ปีหน้า}")`,
    },
    bullets: [
      { emoji: '🔤', text: 'String', sub: 'ข้อความ ใช้ "..." ครอบ' },
      { emoji: '🔢', text: 'int', sub: 'จำนวนเต็ม เช่น 13' },
      { emoji: '📏', text: 'float', sub: 'จำนวนทศนิยม เช่น 165.5' },
      { emoji: '✅', text: 'bool', sub: 'True / False' },
    ],
  },
  {
    title: 'เงื่อนไข (if-elif-else)',
    emoji: '🔀',
    theme: 'purple',
    layout: 'standard',
    code: {
      lang: 'python',
      content: `คะแนน = int(input("คะแนน: "))

if คะแนน >= 80:
    print("เกรด A")
elif คะแนน >= 70:
    print("เกรด B")
elif คะแนน >= 60:
    print("เกรด C")
elif คะแนน >= 50:
    print("เกรด D")
else:
    print("เกรด F — ตั้งใจอีกหน่อย!")`,
    },
    callout: { type: 'tip', emoji: '🎯', text: 'Python ใช้ "ขีด" (indent) แทนวงเล็บปีกกา {} — ระวังจัดให้สวย!' },
  },
  {
    title: 'การวนซ้ำ (Loop)',
    emoji: '🔄',
    theme: 'pink',
    layout: 'comparison',
    compareLeft: {
      title: 'for loop',
      emoji: '🔢',
      items: [
        'ทำซ้ำตามจำนวน',
        'for i in range(5):',
        '  print(i)',
        '→ พิมพ์ 0,1,2,3,4',
      ],
      color: '#3b82f6',
    },
    compareRight: {
      title: 'while loop',
      emoji: '⏳',
      items: [
        'ทำซ้ำตามเงื่อนไข',
        'i = 0',
        'while i < 5:',
        '  print(i); i += 1',
      ],
      color: '#ec4899',
    },
    callout: { type: 'warn', emoji: '⚠️', text: 'while loop อันตราย! ถ้าลืมเพิ่มค่า i จะวนไม่สิ้นสุด → คอมค้าง' },
  },
  {
    title: 'ฟังก์ชัน (Function) — โค้ดที่ใช้ซ้ำได้',
    emoji: '⚙️',
    theme: 'yellow',
    layout: 'standard',
    body: 'แทนที่จะเขียนโค้ดเดิมๆ ซ้ำๆ — ใส่ในฟังก์ชัน เรียกใช้ได้บ่อยๆ',
    code: {
      lang: 'python',
      content: `# ประกาศฟังก์ชัน
def คำนวณเกรด(คะแนน):
    if คะแนน >= 80:
        return "A"
    elif คะแนน >= 70:
        return "B"
    elif คะแนน >= 60:
        return "C"
    else:
        return "F"

# เรียกใช้
print(คำนวณเกรด(85))   # → A
print(คำนวณเกรด(72))   # → B
print(คำนวณเกรด(45))   # → F`,
    },
    callout: { type: 'fun', emoji: '🎁', text: 'ฟังก์ชัน = "ของขวัญ" ที่เราเตรียมไว้ ใช้ได้หลายครั้ง' },
  },
];

// ===========================================================================
// Export — รวมทั้งหมด (key = `${gradeId}_${unitNo}`)
// ===========================================================================
export const richSlides: Record<string, RichSlide[]> = {
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
  'p5_2': p5_unit2,
  'm1-cs_1': m1_cs_unit1,
  'm1-cs_2': m1_cs_unit2,
  'm2-cs_2': m2_cs_unit2,
};

export const hasRichSlides = (gradeId: string, unitNo: number): boolean => {
  return !!richSlides[`${gradeId}_${unitNo}`];
};

export const getRichSlides = (gradeId: string, unitNo: number): RichSlide[] => {
  return richSlides[`${gradeId}_${unitNo}`] || [];
};
