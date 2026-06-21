// AI Tutor — Chat กับ AI ครู
// ใช้ Claude API ผ่าน proxy / Anthropic SDK (ต้องมี API key)
// fallback: คำตอบ canned response สำหรับ demo

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

const KEY = (userId: string) => `krujames_chat_${userId}`;
const SETTINGS_KEY = 'krujames_ai_settings';

export interface AISettings {
  apiKey?: string;        // Anthropic API key (ครูตั้ง)
  apiUrl?: string;        // ถ้าใช้ proxy
  model: string;
  systemPrompt: string;
}

const DEFAULT_SETTINGS: AISettings = {
  model: 'claude-haiku-4-5-20251001',
  systemPrompt: `คุณคือ "ครู AI" ผู้ช่วยสอนวิชาวิทยาการคำนวณและเทคโนโลยี
สำหรับนักเรียนไทย ป.1-ม.3 ของโรงเรียนบ้านคลองมดแดง

กฎที่ต้องปฏิบัติ:
1. ตอบเป็นภาษาไทยที่อ่านง่าย เหมาะกับวัยของนักเรียน
2. ถ้าเป็นการบ้าน — อย่าตอบให้ตรงๆ ให้คำใบ้และคำถามชี้แนะแทน
3. ใช้ตัวอย่างจากชีวิตประจำวันที่เด็กเข้าใจ
4. มีอารมณ์ขัน เป็นกันเอง ไม่ดุเด็ก
5. ถ้าเด็กถามเรื่องไม่เหมาะ → บอกให้คุยกับครูจริงๆ
6. ส่งเสริมความคิดสร้างสรรค์และการทดลอง

ตอบสั้นๆ ตรงประเด็น ไม่เกิน 4 ย่อหน้า`,
};

export const loadSettings = (): AISettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch { return DEFAULT_SETTINGS; }
};

export const saveSettings = (s: AISettings) => {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch {}
};

export const loadHistory = (userId: string): ChatMessage[] => {
  try {
    const raw = localStorage.getItem(KEY(userId));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const saveHistory = (userId: string, list: ChatMessage[]) => {
  // เก็บ 30 รายการล่าสุด
  if (list.length > 30) list = list.slice(-30);
  try { localStorage.setItem(KEY(userId), JSON.stringify(list)); } catch {}
};

export const clearHistory = (userId: string) => {
  try { localStorage.removeItem(KEY(userId)); } catch {}
};

const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

export const askAI = async (userId: string, userMessage: string): Promise<ChatMessage> => {
  const settings = loadSettings();
  const history = loadHistory(userId);

  // Add user message
  const userMsg: ChatMessage = {
    id: uid(), role: 'user', content: userMessage, timestamp: Date.now(),
  };
  history.push(userMsg);
  saveHistory(userId, history);

  let aiResponse = '';

  if (settings.apiKey) {
    // Call Claude API
    try {
      const url = settings.apiUrl || 'https://api.anthropic.com/v1/messages';
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settings.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: settings.model,
          max_tokens: 1024,
          system: settings.systemPrompt,
          messages: history.filter((m) => m.role !== 'system').map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      const data = await res.json();
      aiResponse = data.content?.[0]?.text || 'ขอโทษนะ ครู AI ตอบไม่ได้ตอนนี้';
    } catch (e) {
      aiResponse = `❌ ติดต่อ AI ไม่ได้ — โปรดติดต่อครูเจมส์เพื่อตั้งค่า API\n(${e})`;
    }
  } else {
    // Fallback canned response
    aiResponse = getCannedResponse(userMessage);
  }

  const aiMsg: ChatMessage = {
    id: uid(), role: 'assistant', content: aiResponse, timestamp: Date.now(),
  };
  history.push(aiMsg);
  saveHistory(userId, history);
  return aiMsg;
};

// Canned responses (ใช้เมื่อไม่มี API key)
const getCannedResponse = (q: string): string => {
  const lower = q.toLowerCase();
  if (lower.includes('สวัสดี') || lower.includes('hi') || lower.includes('hello'))
    return '👋 สวัสดี! ครู AI พร้อมช่วยตอบคำถามวิชาเทคโนโลยีและวิทยาการคำนวณ ลองถามมาดูสิ!';
  if (lower.includes('อัลกอริทึม') || lower.includes('algorithm'))
    return '🧠 อัลกอริทึม คือ ขั้นตอนการแก้ปัญหาที่ชัดเจน เหมือนสูตรอาหาร! ลองคิดถึงการแปรงฟัน — 1) บีบยาสีฟัน 2) แปรง 3) บ้วน — นั่นคืออัลกอริทึม!';
  if (lower.includes('scratch'))
    return '🐱 Scratch เป็นโปรแกรมที่ MIT สร้างขึ้น — ลากบล็อกคำสั่งต่อกัน ก็เป็นเกมได้! เปิด scratch.mit.edu ลองดูสิ';
  if (lower.includes('ai') || lower.includes('ปัญญาประดิษฐ์'))
    return '🤖 AI คือคอมพิวเตอร์ที่เรียนรู้ได้! ลองเล่น Teachable Machine ของ Google — สอน AI จำของได้ใน 5 นาที';
  if (lower.includes('โปรแกรม') || lower.includes('เขียนโค้ด'))
    return '💻 เริ่มเขียนโปรแกรมเหมือนเรียนภาษาใหม่ — Scratch สำหรับเด็กเล็ก, Python สำหรับ ม.ต้น แนะนำเริ่มที่ code.org สนุก!';
  return '🤔 น่าสนใจมาก! ครู AI ตอบได้ดีกว่าถ้าเปิดใช้ API — ถามครูเจมส์ให้ตั้งค่าได้นะ ตอนนี้แนะนำเข้าไปดูในแหล่งเรียนรู้หรือคอร์สเรียนเลย!';
};
