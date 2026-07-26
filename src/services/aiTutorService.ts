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
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch { /* ignore localStorage write errors */ }
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
  try { localStorage.setItem(KEY(userId), JSON.stringify(list)); } catch { /* ignore localStorage write errors */ }
};

export const clearHistory = (userId: string) => {
  try { localStorage.removeItem(KEY(userId)); } catch { /* ignore localStorage cleanup errors */ }
};

const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

/**
 * ปลายทางเริ่มต้น = proxy ฝั่งเซิร์ฟเวอร์ (api/ai-tutor.js) ซึ่งถือ API key ไว้เอง
 * เบราว์เซอร์จึงไม่ต้องรู้ key เลย — ปลอดภัยกว่าเดิมที่เก็บ key ไว้ใน localStorage
 * (โหมดใส่ key ตรงยังใช้ได้ ถ้าครูตั้งค่าไว้ แต่ไม่แนะนำเพราะนักเรียนอ่าน key ได้)
 */
const DEFAULT_PROXY_URL = '/api/ai-tutor';

interface CallOptions {
  system?: string;
  maxTokens?: number;
}

/** เรียก AI ผ่าน proxy (หรือผ่าน key ตรงถ้าครูตั้งไว้) — คืน null ถ้าเรียกไม่ได้ */
const callClaude = async (
  messages: Array<{ role: string; content: string }>,
  options: CallOptions = {},
): Promise<string | null> => {
  const settings = loadSettings();
  const usingDirectKey = Boolean(settings.apiKey);
  const url = settings.apiUrl || (usingDirectKey ? 'https://api.anthropic.com/v1/messages' : DEFAULT_PROXY_URL);

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (usingDirectKey) {
    headers['x-api-key'] = settings.apiKey as string;
    headers['anthropic-version'] = '2023-06-01';
    headers['anthropic-dangerous-direct-browser-access'] = 'true';
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: settings.model,
      max_tokens: options.maxTokens ?? 1024,
      system: options.system ?? settings.systemPrompt,
      messages,
    }),
  });

  // 503 = เซิร์ฟเวอร์ยังไม่ได้ตั้ง ANTHROPIC_API_KEY → ให้ผู้เรียกถอยไปใช้คำตอบสำรอง
  if (!res.ok) return null;
  const data = await res.json();
  return data?.content?.[0]?.text || null;
};

export const askAI = async (userId: string, userMessage: string): Promise<ChatMessage> => {
  const history = loadHistory(userId);

  // Add user message
  const userMsg: ChatMessage = {
    id: uid(), role: 'user', content: userMessage, timestamp: Date.now(),
  };
  history.push(userMsg);
  saveHistory(userId, history);

  let aiResponse = '';

  // ลองเรียก AI จริงก่อน (ผ่าน proxy ฝั่งเซิร์ฟเวอร์) — ถ้ายังไม่ได้ตั้งค่า
  // หรือเรียกไม่สำเร็จ ค่อยถอยไปใช้คำตอบสำเร็จรูป เพื่อให้เด็กยังใช้งานต่อได้
  try {
    const reply = await callClaude(
      history.filter((m) => m.role !== 'system').map((m) => ({ role: m.role, content: m.content })),
    );
    aiResponse = reply || getCannedResponse(userMessage);
  } catch {
    aiResponse = getCannedResponse(userMessage);
  }

  const aiMsg: ChatMessage = {
    id: uid(), role: 'assistant', content: aiResponse, timestamp: Date.now(),
  };
  history.push(aiMsg);
  saveHistory(userId, history);
  return aiMsg;
};

/**
 * เรียก AI แบบ one-shot (ไม่เก็บ chat history) — สำหรับงานยาว เช่น เขียน/ขยายงานวิจัย
 * ต้องตั้ง API key ก่อน (Admin → ครู AI). ถ้าไม่มี key คืน null → caller ใช้ template แทน
 */
export const completeText = async (
  prompt: string,
  system?: string,
  maxTokens = 4096,
): Promise<string | null> => {
  try {
    return await callClaude(
      [{ role: 'user', content: prompt }],
      {
        system: system || 'คุณเป็นผู้ช่วยเขียนเอกสารวิชาการภาษาไทยที่เชี่ยวชาญด้านการศึกษาและวิจัย',
        maxTokens,
      },
    );
  } catch (e) {
    console.warn('completeText failed', e);
    return null;
  }
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
