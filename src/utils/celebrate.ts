// ระบบฉลองเมื่อเด็กเล่นเกมจบ/ชนะ — เสียงแฟนแฟร์ + confetti (ไม่ใช้ไฟล์เสียง/ไลบรารี)
// เคารพการปิดเสียง (mute) และ prefers-reduced-motion เพื่อใช้ในห้องเรียนได้

const MUTE_KEY = 'krujames_sfx_muted';

export const isSfxMuted = (): boolean => {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
};

export const setSfxMuted = (muted: boolean): void => {
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    /* ignore */
  }
};

let audioCtx: AudioContext | null = null;
const getAudioContext = (): AudioContext | null => {
  try {
    if (!audioCtx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      audioCtx = new Ctor();
    }
    return audioCtx;
  } catch {
    return null;
  }
};

/** เสียงแฟนแฟร์สั้นๆ (อาร์เพจโจ C-E-G-C) สังเคราะห์สดด้วย Web Audio */
export const playWinSound = (): void => {
  if (isSfxMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') void ctx.resume();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const start = ctx.currentTime + i * 0.085;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.16, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.32);
    });
  } catch {
    /* ignore audio errors */
  }
};

interface Particle {
  x: number; y: number; vx: number; vy: number;
  size: number; color: string; rot: number; vr: number; life: number;
}

/** ปล่อย confetti พุ่งขึ้นจากกลางล่างจอ ตกด้วยแรงโน้มถ่วง แล้วลบตัวเองใน ~1.6 วิ */
export const fireConfetti = (): void => {
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

    const colors = ['#f43f5e', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6'];
    const originX = w / 2;
    const originY = h * 0.82;
    const count = Math.min(120, Math.max(60, Math.floor(w / 12)));
    const particles: Particle[] = Array.from({ length: count }, () => {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.7;
      const speed = 7 + Math.random() * 9;
      return {
        x: originX + (Math.random() - 0.5) * 40,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 5 + Math.random() * 7,
        color: colors[(Math.random() * colors.length) | 0],
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.4,
        life: 1,
      };
    });

    const gravity = 0.28;
    const drag = 0.992;
    let frame = 0;
    const maxFrames = 110;

    const tick = () => {
      frame += 1;
      ctx.clearRect(0, 0, w, h);
      let alive = false;
      for (const p of particles) {
        p.vx *= drag;
        p.vy = p.vy * drag + gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        if (frame > maxFrames * 0.55) p.life -= 0.03;
        if (p.life > 0 && p.y < h + 20) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        }
      }
      if (alive && frame < maxFrames + 30) {
        requestAnimationFrame(tick);
      } else {
        canvas.remove();
      }
    };
    requestAnimationFrame(tick);
  } catch {
    /* ignore confetti errors */
  }
};

/** ฉลอง: เสียง + confetti พร้อมกัน */
export const celebrate = (): void => {
  playWinSound();
  fireConfetti();
};
