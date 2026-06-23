// PDPA-safe display name helper
// แปลงชื่อจริงเป็นชื่อสมมุติคงที่ (deterministic) สำหรับหน้าสาธารณะ
// — คงคำนำหน้า (เด็กชาย/เด็กหญิง/นาย/นางสาว) ถ้ามี
// — แทนชื่อจริงด้วยคำเชิงบวกจาก pool, hash จาก classroom + studentNo

const POSITIVE_NOUNS = [
  'เรียนดี', 'ขยัน', 'ฉลาด', 'สู้สู้', 'ตั้งใจ', 'ใจดี', 'ปัญญาดี',
  'อ่านเก่ง', 'คิดเร็ว', 'ช่างคิด', 'รักเรียน', 'มุ่งมั่น', 'สดใส',
  'ร่าเริง', 'แสนดี', 'น่ารัก', 'ช่างฝัน', 'ค้นคว้า', 'รอบรู้',
  'ใฝ่รู้', 'มีน้ำใจ', 'อ่อนน้อม', 'จิตอาสา', 'มีเมตตา', 'แก่นสาร',
  'ปราดเปรื่อง', 'อัจฉริยะ', 'ใจซื่อ', 'ใจกล้า', 'กล้าหาญ',
  'ฉลาดล้ำ', 'นักคิด', 'นักอ่าน', 'นักทดลอง', 'นักประดิษฐ์',
  'ใจเย็น', 'มั่นใจ', 'อดทน', 'มีสติ', 'รอบคอบ',
];

const detectPrefix = (name: string): string | null => {
  const trimmed = (name || '').trim();
  for (const p of ['เด็กชาย', 'เด็กหญิง', 'นางสาว', 'นาย', 'นาง']) {
    if (trimmed.startsWith(p)) return p;
  }
  return null;
};

const hashString = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
};

/**
 * สร้างชื่อสมมุติคงที่จาก classroom + studentNo + ชื่อจริง (ใช้ hash)
 * ตัวอย่าง: ("เด็กชายรัชกฤช ทวิราช", 2, "ป.3") → "เด็กชายเรียนดี"
 */
export const anonymizeStudentName = (
  realName: string,
  studentNo: number,
  classroom: string,
): string => {
  const prefix = detectPrefix(realName) || 'นักเรียน';
  // hash deterministic — นักเรียนคนเดียวกันได้ชื่อสมมุติเดิมเสมอ
  const seed = `${classroom}|${studentNo}|${realName}`;
  const noun = POSITIVE_NOUNS[hashString(seed) % POSITIVE_NOUNS.length];
  return `${prefix}${noun}`;
};
