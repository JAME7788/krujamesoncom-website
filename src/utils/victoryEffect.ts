// เอฟเฟกต์ชนะแบบเต็มจอ — พลุ + ฝนริบบิ้นทอง + แสงวาบ + รัศมีดาว
// วาดด้วย canvas ล้วน ไม่ใช้ไลบรารีและไม่โหลดไฟล์ จึงเบาและทำงานบนเครื่องเก่าในโรงเรียนได้
// เคารพ prefers-reduced-motion และสวิตช์ปิดเสียงเดียวกับระบบฉลองปกติ

import { isSfxMuted } from './celebrate';

const GOLD = ['#fde68a', '#fbbf24', '#f59e0b', '#fff7cd'];
const PARTY = ['#f43f5e', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#fbbf24'];

interface Spark {
  x: number; y: number; vx: number; vy: number;
  life: number; decay: number; color: string; size: number;
}
interface Rocket {
  x: number; y: number; vy: number; targetY: number; color: string; exploded: boolean;
}
interface Ribbon {
  x: number; y: number; vy: number; vx: number;
  w: number; h: number; rot: number; vr: number; color: string;
}

/** กันเอฟเฟกต์ยิงซ้อนกันเมื่อจอชนะถูกสั่งซ้ำ */
let victoryRunning = false;

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/** เสียงแฟนแฟร์ชนะ — ยาวและอลังการกว่าเสียงฉลองปกติ */
const playVictoryFanfare = () => {
  if (isSfxMuted()) return;
  try {
    const Ctor = window.AudioContext
      || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ac = new Ctor();
    const now = ac.currentTime;

    // ทำนองชัยชนะ: G-C-E-G-C(สูง) แล้วปิดด้วยคอร์ด
    const melody = [
      [392.0, 0.00, 0.16], [523.25, 0.14, 0.16], [659.25, 0.28, 0.16],
      [783.99, 0.42, 0.2], [1046.5, 0.62, 0.5],
    ];
    melody.forEach(([freq, at, dur]) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + at);
      gain.gain.exponentialRampToValueAtTime(0.2, now + at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + at + dur);
      osc.connect(gain).connect(ac.destination);
      osc.start(now + at);
      osc.stop(now + at + dur + 0.05);
    });

    // คอร์ดปิดท้าย (C major) ให้ความรู้สึกจบสมบูรณ์
    [523.25, 659.25, 783.99, 1046.5].forEach((freq) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + 1.05);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 1.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.1);
      osc.connect(gain).connect(ac.destination);
      osc.start(now + 1.05);
      osc.stop(now + 2.2);
    });

    // ปิด context เมื่อเล่นจบ เพื่อไม่ให้ค้างสะสม
    window.setTimeout(() => { void ac.close().catch(() => {}); }, 3000);
  } catch {
    /* เสียงเป็นของเสริม ถ้าเล่นไม่ได้ก็ไม่ควรทำให้เกมพัง */
  }
};

/**
 * ฉลองชัยชนะแบบเต็มจอ
 * @param durationMs ระยะเวลาโดยรวม (ค่าเริ่มต้น 4.5 วินาที)
 */
export const celebrateVictory = (durationMs = 4500): void => {
  // จอชนะอาจถูกสั่งซ้ำได้จากหลายทาง (ตอบถูก/กดต่อ/เช็คเงื่อนไขซ้ำ)
  // ล็อกไว้ไม่ให้พลุยิงซ้อนกันหลายชั้น ซึ่งทั้งเปลืองและดูรก
  if (victoryRunning) return;
  victoryRunning = true;
  window.setTimeout(() => { victoryRunning = false; }, durationMs);

  playVictoryFanfare();

  try {
    if (typeof window === 'undefined' || !document.body) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = document.createElement('canvas');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:99999';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) { canvas.remove(); return; }
    ctx.scale(dpr, dpr);

    const sparks: Spark[] = [];
    const rockets: Rocket[] = [];
    const ribbons: Ribbon[] = [];

    // ฝนริบบิ้นทองจากขอบบน
    for (let i = 0; i < Math.min(140, Math.floor(w / 9)); i++) {
      ribbons.push({
        x: Math.random() * w,
        y: rand(-h, 0),
        vy: rand(1.8, 4.5),
        vx: rand(-0.7, 0.7),
        w: rand(5, 11),
        h: rand(9, 18),
        rot: Math.random() * Math.PI,
        vr: rand(-0.14, 0.14),
        color: Math.random() < 0.55 ? pick(GOLD) : pick(PARTY),
      });
    }

    const launchRocket = () => {
      rockets.push({
        x: rand(w * 0.12, w * 0.88),
        y: h + 10,
        vy: rand(-15, -11),
        targetY: rand(h * 0.12, h * 0.45),
        color: pick(PARTY),
        exploded: false,
      });
    };

    const explode = (x: number, y: number, color: string) => {
      const count = 46;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + rand(-0.06, 0.06);
        const speed = rand(2.2, 6.2);
        sparks.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          decay: rand(0.012, 0.026),
          color: Math.random() < 0.3 ? pick(GOLD) : color,
          size: rand(1.6, 3.4),
        });
      }
      // แสงวาบตรงจุดระเบิด
      sparks.push({ x, y, vx: 0, vy: 0, life: 1, decay: 0.09, color: '#ffffff', size: 22 });
    };

    // ยิงพลุชุดแรกทันที แล้วทยอยยิงเป็นระยะ
    launchRocket();
    const launcher = window.setInterval(launchRocket, 380);
    window.setTimeout(() => window.clearInterval(launcher), durationMs - 1200);

    const started = performance.now();
    let frame = 0;

    const tick = () => {
      const elapsed = performance.now() - started;

      // ค่อย ๆ ลบภาพเฟรมก่อนหน้าให้จางลง เกิดเป็น "หางพลุ"
      // ต้องใช้ destination-out ไม่ใช่การถมสีดำทับ ไม่งั้นจอจะทึบจนบังหน้าจอผู้ชนะ
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';

      // จรวดพุ่งขึ้น
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.y += r.vy;
        r.vy += 0.22;
        ctx.beginPath();
        ctx.fillStyle = r.color;
        ctx.arc(r.x, r.y, 2.6, 0, Math.PI * 2);
        ctx.fill();
        if (r.y <= r.targetY || r.vy >= 0) {
          explode(r.x, r.y, r.color);
          rockets.splice(i, 1);
        }
      }

      // ประกายพลุ
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.052;
        s.vx *= 0.985;
        s.vy *= 0.985;
        s.life -= s.decay;
        if (s.life <= 0) { sparks.splice(i, 1); continue; }
        ctx.globalAlpha = Math.max(0, s.life);
        ctx.beginPath();
        ctx.fillStyle = s.color;
        ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
        ctx.fill();
      }

      // ริบบิ้นทองร่วง
      ctx.globalCompositeOperation = 'source-over';
      for (const rb of ribbons) {
        rb.y += rb.vy;
        rb.x += rb.vx + Math.sin((rb.y + frame) * 0.02) * 0.8;
        rb.rot += rb.vr;
        if (rb.y > h + 20) { rb.y = rand(-60, -10); rb.x = Math.random() * w; }
        ctx.save();
        ctx.globalAlpha = elapsed > durationMs - 900 ? Math.max(0, (durationMs - elapsed) / 900) : 1;
        ctx.translate(rb.x, rb.y);
        ctx.rotate(rb.rot);
        ctx.fillStyle = rb.color;
        ctx.fillRect(-rb.w / 2, -rb.h / 2, rb.w, rb.h);
        ctx.restore();
      }

      ctx.globalAlpha = 1;
      frame += 1;

      if (elapsed < durationMs) {
        requestAnimationFrame(tick);
      } else {
        canvas.remove();
      }
    };

    requestAnimationFrame(tick);
  } catch {
    /* เอฟเฟกต์เป็นของเสริม ถ้าวาดไม่ได้ก็ไม่ควรทำให้เกมพัง */
  }
};
