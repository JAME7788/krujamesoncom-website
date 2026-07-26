/**
 * AI Tutor proxy (Vercel serverless function)
 *
 * ทำไมต้องมี: เดิมเว็บเรียก Anthropic API ตรงจากเบราว์เซอร์ โดยเก็บ API key
 * ไว้ใน localStorage ซึ่งแปลว่านักเรียนที่เปิด DevTools อ่าน key ได้ และ
 * นำไปใช้จนเครดิตของครูหมดได้
 *
 * ไฟล์นี้ทำหน้าที่ถือ key ไว้ฝั่งเซิร์ฟเวอร์แทน เบราว์เซอร์ยิงมาที่ /api/ai-tutor
 * โดยไม่ต้องรู้ key เลย
 *
 * ตั้งค่า: Vercel → Project Settings → Environment Variables → ANTHROPIC_API_KEY
 */

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

// เพดานกันการใช้งานเกินตัว (เว็บเปิดสาธารณะ ใครก็ยิงมาได้)
const MAX_TOKENS_LIMIT = 4096;
const MAX_MESSAGES = 40;
const MAX_CHARS_PER_MESSAGE = 8000;
const ALLOWED_MODELS = [
  'claude-haiku-4-5-20251001',
  'claude-sonnet-4-6',
  'claude-opus-4-8',
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'ใช้ได้เฉพาะ POST' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // ยังไม่ได้ตั้งค่า — ฝั่งเว็บจะถอยไปใช้คำตอบสำเร็จรูปแทน
    res.status(503).json({ error: 'not_configured', message: 'ยังไม่ได้ตั้งค่า ANTHROPIC_API_KEY บนเซิร์ฟเวอร์' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const messages = Array.isArray(body.messages) ? body.messages : [];

    if (messages.length === 0) {
      res.status(400).json({ error: 'ไม่มีข้อความ' });
      return;
    }

    // ตัดให้อยู่ในเพดาน — กันทั้งค่าใช้จ่ายบานปลายและการยิง payload ใหญ่ผิดปกติ
    const trimmed = messages.slice(-MAX_MESSAGES).map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || '').slice(0, MAX_CHARS_PER_MESSAGE),
    }));

    const model = ALLOWED_MODELS.includes(body.model) ? body.model : ALLOWED_MODELS[0];
    const maxTokens = Math.min(Number(body.max_tokens) || 1024, MAX_TOKENS_LIMIT);

    const upstream = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system: typeof body.system === 'string' ? body.system.slice(0, 20000) : undefined,
        messages: trimmed,
      }),
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      // ส่งต่อสถานะ แต่ไม่เปิดเผยรายละเอียดฝั่งเซิร์ฟเวอร์
      res.status(upstream.status).json({ error: 'upstream_error', message: data?.error?.message || 'เรียก AI ไม่สำเร็จ' });
      return;
    }
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: 'proxy_error', message: String(e?.message || e) });
  }
}
