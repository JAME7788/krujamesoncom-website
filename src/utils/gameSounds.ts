// เสียงเอฟเฟกต์ในเกม — สังเคราะห์สดด้วย Web Audio (ไม่ต้องโหลดไฟล์เสียง)
// เคารพสวิตช์ปิดเสียงเดียวกับระบบฉลอง เพื่อให้ครูปิดทีเดียวเงียบทั้งเว็บ

import { isSfxMuted } from './celebrate';

let ctx: AudioContext | null = null;

const audio = (): AudioContext | null => {
  if (isSfxMuted()) return null;
  try {
    if (!ctx) {
      const Ctor = window.AudioContext
        || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
};

type Wave = 'sine' | 'square' | 'triangle' | 'sawtooth';

/** โน้ตสั้น 1 ตัว */
const tone = (
  freq: number,
  startAt: number,
  duration: number,
  gain = 0.14,
  type: Wave = 'triangle',
  slideTo?: number,
) => {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + startAt;
  const osc = ac.createOscillator();
  const vol = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + duration);
  vol.gain.setValueAtTime(0.0001, t);
  vol.gain.exponentialRampToValueAtTime(gain, t + 0.015);
  vol.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(vol).connect(ac.destination);
  osc.start(t);
  osc.stop(t + duration + 0.02);
};

/** เสียงกระทบสั้น ๆ แบบลูกเต๋าเด้ง (ใช้ noise สังเคราะห์) */
const clack = (startAt: number, gain = 0.1) => {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + startAt;
  const len = Math.floor(ac.sampleRate * 0.045);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
  const src = ac.createBufferSource();
  const filter = ac.createBiquadFilter();
  const vol = ac.createGain();
  src.buffer = buf;
  filter.type = 'bandpass';
  filter.frequency.value = 1600;
  vol.gain.value = gain;
  src.connect(filter).connect(vol).connect(ac.destination);
  src.start(t);
};

/** 🎲 ทอยลูกเต๋า — เสียงเต๋ากลิ้งกระทบโต๊ะ */
export const sfxDice = () => {
  [0, 0.07, 0.13, 0.18, 0.24, 0.32].forEach((at, i) => clack(at, 0.12 - i * 0.012));
  tone(320, 0.34, 0.1, 0.08, 'sine', 220);
};

/** 👣 เดินทีละช่อง — เสียงกระโดดสั้น */
export const sfxStep = (index = 0) => {
  tone(520 + (index % 4) * 40, 0, 0.07, 0.07, 'square');
};

/** 💰 ได้เงิน — เสียงเหรียญ */
export const sfxCoin = () => {
  tone(988, 0, 0.09, 0.12, 'square');
  tone(1319, 0.07, 0.16, 0.1, 'square');
};

/** 💸 เสียเงิน — เสียงตกลงต่ำ */
export const sfxPay = () => {
  tone(392, 0, 0.18, 0.12, 'sawtooth', 196);
};

/** 🏠 ซื้อ/พัฒนาที่ดินสำเร็จ */
export const sfxBuy = () => {
  [523.25, 659.25, 783.99].forEach((f, i) => tone(f, i * 0.06, 0.16, 0.13, 'triangle'));
};

/** ✅ ตอบถูก */
export const sfxCorrect = () => {
  tone(659.25, 0, 0.12, 0.13, 'triangle');
  tone(987.77, 0.09, 0.2, 0.12, 'triangle');
};

/** ❌ ตอบผิด */
export const sfxWrong = () => {
  tone(311, 0, 0.16, 0.11, 'square', 233);
};

/** 🎴 เปิดการ์ดเสี่ยงดวง */
export const sfxCard = () => {
  clack(0, 0.09);
  tone(880, 0.05, 0.14, 0.09, 'sine', 1320);
};

/** 💥 ล้มละลาย */
export const sfxBankrupt = () => {
  [440, 349, 262, 196].forEach((f, i) => tone(f, i * 0.11, 0.28, 0.13, 'sawtooth'));
};
