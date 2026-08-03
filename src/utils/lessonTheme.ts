// จัดธีมบทเรียนจากข้อความ ใช้เลือกตัวอย่างกิจกรรม คำถามชวนคิด คำศัพท์ และกล่องเน้นของสไลด์
//
// แยกออกมาจาก UnitDetail.tsx เพราะเป็นตรรกะล้วน ไม่ใช่ component
// (และการ export ฟังก์ชันจากไฟล์ component ทำให้ Fast Refresh ของ Vite พัง)

export type LessonTheme =
  | 'ai' | 'data' | 'coding' | 'safety' | 'file' | 'internet' | 'problem' | 'default';

/**
 * ลำดับการตรวจสำคัญมาก เพราะเจอรูปแบบไหนก่อนจะคืนค่าทันที
 *
 * บั๊กที่เคยเกิดจริงและกันไว้ด้วยเทสต์แล้ว:
 *   1. คำว่า Prompt เคยอยู่ในรูปแบบของ ai แล้วไปชนกับตัวคั่น "PROMPT:" ของ teachingNote
 *      ทำให้สไลด์ทุกแผ่นของทุกหน่วยถูกตัดสินเป็นธีม AI
 *   2. data เคยถูกตรวจก่อน safety ทำให้ "ข้อมูลส่วนตัว" เข้าธีมข้อมูล
 *      บทเรียนความปลอดภัยจึงได้ตัวอย่างเรื่องกราฟและการวิเคราะห์ข้อมูลแทน
 */
export const detectLessonTheme = (text: string): LessonTheme => {
  // ใช้ \b กัน "AI" ไปตรงกลางคำอังกฤษอย่าง Thailand, email, detail ซึ่งเจอบ่อยในชื่อแหล่งเรียนรู้
  if (/\bAI\b|ปัญญาประดิษฐ์|Machine Learning|โมเดล/i.test(text)) return 'ai';
  if (/อินเทอร์เน็ต|Internet|เว็บไซต์|แหล่งข้อมูล|Google|อีเมล|คำค้น/i.test(text)) return 'internet';
  if (/ปลอดภัย|ส่วนตัว|รหัสผ่าน|ออนไลน์|สารสนเทศ|Deepfake|PDPA|มารยาท|หลอกลวง/i.test(text)) return 'safety';
  if (/ข้อมูล|Data|กราฟ|แผนภูมิ|ค้นหา|ประมวลผล|Visualization|Regression|K-NN|Pivot/i.test(text)) return 'data';
  if (/โปรแกรม|โค้ด|Coding|Scratch|Loop|คำสั่ง|ผังงาน|อัลกอริทึม|บล็อก/i.test(text)) return 'coding';
  if (/ไฟล์|โฟลเดอร์|จัดเก็บ|Word|Paint|PowerPoint|เอกสาร|คีย์บอร์ด|เมาส์|เปิด-ปิด|เครื่องพิมพ์/i.test(text)) return 'file';
  if (/ปัญหา|ลองผิดลองถูก|เปรียบเทียบ|ขั้นตอน|วางแผน|ตรวจสอบ/i.test(text)) return 'problem';
  return 'default';
};
