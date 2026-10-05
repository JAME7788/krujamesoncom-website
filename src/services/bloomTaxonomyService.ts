// 🧠 Bloom's Revised Taxonomy Service (อนุกรมวิธานของบลูมฉบับปรับปรุง)
// จำ ➔ เข้าใจ ➔ ประยุกต์ใช้ ➔ วิเคราะห์ ➔ ประเมินค่า ➔ สร้างสรรค์

export type BloomLevel =
  | 'remember'
  | 'understand'
  | 'apply'
  | 'analyze'
  | 'evaluate'
  | 'create';

export interface BloomInfo {
  level: BloomLevel;
  tier: number;
  nameTh: string;
  nameEn: string;
  actionVerbs: string[];
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  description: string;
}

export const bloomTaxonomyLevels: Record<BloomLevel, BloomInfo> = {
  remember: {
    level: 'remember',
    tier: 1,
    nameTh: 'จำ (Remember)',
    nameEn: 'Remembering',
    actionVerbs: ['บอกชื่อ', 'ระบุ', 'จดจำ', 'จับคู่', 'บอกความหมาย'],
    color: '#0284c7',
    bgColor: '#e0f2fe',
    borderColor: '#bae6fd',
    icon: '💡',
    description: 'สามารถระลึกหรือจำข้อมูล คำศัพท์ และอุปกรณ์ทางเทคโนโลยีได้',
  },
  understand: {
    level: 'understand',
    tier: 2,
    nameTh: 'เข้าใจ (Understand)',
    nameEn: 'Understanding',
    actionVerbs: ['อธิบาย', 'สรุปความ', 'จำแนก', 'เปรียบเทียบ'],
    color: '#0d9488',
    bgColor: '#ccfbf1',
    borderColor: '#99f6e4',
    icon: '📖',
    description: 'เข้าใจความหมายของข้อมูล แปลความ และอธิบายกระบวนการทำงานได้',
  },
  apply: {
    level: 'apply',
    tier: 3,
    nameTh: 'ประยุกต์ใช้ (Apply)',
    nameEn: 'Applying',
    actionVerbs: ['ลงมือปฏิบัติ', 'สั่งการ', 'คำนวณ', 'จัดลำดับขั้นตอน'],
    color: '#16a34a',
    bgColor: '#dcfce7',
    borderColor: '#bbf7d0',
    icon: '⚡',
    description: 'นำขั้นตอน อัลกอริทึม หรือบล็อกคำสั่งไปแก้ปัญหาในสถานการณ์จริง',
  },
  analyze: {
    level: 'analyze',
    tier: 4,
    nameTh: 'วิเคราะห์ (Analyze)',
    nameEn: 'Analyzing',
    actionVerbs: ['สืบหาบั๊ก', 'แยกแยะส่วนประกอบ', 'หาแบบแผน', 'วิเคราะห์ข้อผิดพลาด'],
    color: '#d97706',
    bgColor: '#fef3c7',
    borderColor: '#fde68a',
    icon: '🔍',
    description: 'แยกแยะปัญหา หาข้อผิดพลาดของโค้ด (Debug) และตรวจจับแบบแผน',
  },
  evaluate: {
    level: 'evaluate',
    tier: 5,
    nameTh: 'ประเมินค่า (Evaluate)',
    nameEn: 'Evaluating',
    actionVerbs: ['ตัดสินใจ', 'ประเมินความปลอดภัย', 'ตรวจสอบความน่าเชื่อถือ'],
    color: '#ea580c',
    bgColor: '#ffedd5',
    borderColor: '#fed7aa',
    icon: '⚖️',
    description: 'ประเมินความปลอดภัยทางไซเบอร์ ตรวจสอบข้อมูลเท็จ และเลือกทางออกที่เหมาะสม',
  },
  create: {
    level: 'create',
    tier: 6,
    nameTh: 'สร้างสรรค์ (Create)',
    nameEn: 'Creating',
    actionVerbs: ['ออกแบบ', 'เขียนโปรแกรม', 'สร้างผลงาน', 'ประดิษฐ์นวัตกรรม'],
    color: '#7c3aed',
    bgColor: '#ede9fe',
    borderColor: '#ddd6fe',
    icon: '🎨',
    description: 'ออกแบบและสร้างโปรแกรม ชิ้นงานดิจิทัล หรือโครงงานใหม่ด้วยตนเอง',
  },
};

/** ค้นหาข้อมูลระดับความคิดของบลูม */
export const getBloomInfo = (level: BloomLevel): BloomInfo => {
  return bloomTaxonomyLevels[level] || bloomTaxonomyLevels.understand;
};

/** แมปประเภทกิจกรรมหรือเกมเข้าสู่ระดับบลูม */
export const getActivityBloomLevel = (activityType: string, gameId?: string): BloomLevel => {
  if (gameId) {
    const createGames = ['coding-studio', 'pixel-art', 'robot-maker', 'pc-builder'];
    if (createGames.includes(gameId)) return 'create';

    const evaluateGames = ['cyber-shield', 'situation-reaction', 'safety-game', 'cyber-cop'];
    if (evaluateGames.includes(gameId)) return 'evaluate';

    const analyzeGames = ['bug-catcher', 'flowchart-bingo', 'step-sort', 'circuit-lab', 'pattern'];
    if (analyzeGames.includes(gameId)) return 'analyze';

    return 'apply';
  }

  switch (activityType) {
    case 'slide':
      return 'remember';
    case 'video':
    case 'article':
      return 'understand';
    case 'fun':
    case 'practice':
      return 'apply';
    case 'quiz':
      return 'understand';
    case 'project':
      return 'create';
    default:
      return 'understand';
  }
};

/** ประเมินระดับ Bloom's Taxonomy ของหน่วยการเรียนรู้ */
export const getUnitBloomLevel = (title: string, topics: string[] = []): BloomLevel => {
  const combined = `${title} ${topics.join(' ')}`.toLowerCase();

  if (/เขียนโปรแกรม|โครงงาน|สร้างผลงาน|ประดิษฐ์|scratch|python|arduino|พัฒนาโปรแกรม|เว็บ/i.test(combined)) {
    return 'create';
  }
  if (/ความปลอดภัย|พลเมืองดิจิทัล|ลิขสิทธิ์|ประเมิน|จริยธรรม|cyber|ความน่าเชื่อถือ/i.test(combined)) {
    return 'evaluate';
  }
  if (/ผังงาน|อัลกอริทึม|แก้ปัญหา|เชิงคำนวณ|แยกแยะ|ตรรกะ|ดีบัก|debug/i.test(combined)) {
    return 'analyze';
  }
  if (/การใช้งาน|จัดหมวดหมู่|เอกสาร|ซอฟต์แวร์|คำนวณ|สเปรดชีต|กราฟิก|ค้นหา/i.test(combined)) {
    return 'apply';
  }
  if (/ความรู้เบื้องต้น|ความหมาย|ประเภท|ส่วนประกอบ|คอมพิวเตอร์และอุปกรณ์/i.test(combined)) {
    return 'remember';
  }
  return 'understand';
};
