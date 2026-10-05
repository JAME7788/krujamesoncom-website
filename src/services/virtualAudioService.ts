/**
 * ระบบสังเคราะห์เสียงเอฟเฟกต์สำหรับห้องเรียน 3D (Web Audio API SFX Synthesizer)
 * ไม่มีภาระดาวน์โหลดไฟล์ MP3 ทำงานเร็ว 0ms ครอบคลุมการกระโดด วางบล็อก เก็บดาว และลานฝึกคิดเป็นลำดับ
 */

class VirtualAudioService {
  private ctx: AudioContext | null = null;
  private soundEnabled = true;
  private lastStepTime = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('kj_world_sound_sfx');
        if (saved !== null) {
          this.soundEnabled = saved !== 'false';
        }
      } catch {
        this.soundEnabled = true;
      }
    }
  }

  private initCtx(): AudioContext | null {
    if (!this.soundEnabled || typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    try {
      localStorage.setItem('kj_world_sound_sfx', enabled ? 'true' : 'false');
    } catch {
      // Storage safety
    }
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  /** เสียงกระโดด (Boing / Pitch Slide Up) */
  public playJump() {
    const ctx = this.initCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.15);

      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.19);
    } catch {
      // Audio safety
    }
  }

  /** เสียงฝีเท้าขณะเดิน (Soft Footstep Tap) - มี Throttle ป้องกันถี่เกินไป */
  public playStep() {
    const ctx = this.initCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      if (now - this.lastStepTime < 0.28) return;
      this.lastStepTime = now;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(100 + Math.random() * 20, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.05);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.065);
    } catch {
      // Audio safety
    }
  }

  /** เสียงวางบล็อก (Block Place Snap / Tap) */
  public playBlockPlace() {
    const ctx = this.initCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.08);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.095);
    } catch {
      // Audio safety
    }
  }

  /** เสียงทุบบล็อก (Block Remove / Pop) */
  public playBlockRemove() {
    const ctx = this.initCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.08);

      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.095);
    } catch {
      // Audio safety
    }
  }

  /** เสียงเก็บดาว (Sparkling Chime Arpeggio) */
  public playStar() {
    const ctx = this.initCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const notes = [659.25, 783.99, 1046.5]; // E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.07;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.23);
      });
    } catch {
      // Audio safety
    }
  }

  /**
   * เสียงเหยียบแต่ละขั้นของลานกระโดดฝึกคิดเป็นลำดับ (Obby Step Melodic Chime)
   * 0: ขั้นที่ 1 ระบุปัญหา (C5 - 523Hz)
   * 1: ขั้นที่ 2 วางแผนขั้นตอน (E5 - 659Hz)
   * 2: ขั้นที่ 3 ทำตามลำดับ (G5 - 784Hz)
   * 3: ขั้นที่ 4 ตรวจสอบและแก้ไข (B5 - 988Hz)
   */
  public playObbyStep(stepIndex: number) {
    const ctx = this.initCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const pitches = [523.25, 659.25, 783.99, 987.77];
      const freq = pitches[Math.max(0, Math.min(pitches.length - 1, stepIndex))];

      // โน้ตหลัก (Sine chime)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);
      gain1.gain.setValueAtTime(0.28, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.37);

      // โน้ตฮาร์โมนิกคู่แปด (Shimmer overtone)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 2, now + 0.04);
      gain2.gain.setValueAtTime(0.12, now + 0.04);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.04);
      osc2.stop(now + 0.37);
    } catch {
      // Audio safety
    }
  }

  /** เสียงชนะเลิศพิชิตลานกระโดด (Grand Victory Fanfare Chords) */
  public playVictory() {
    const ctx = this.initCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Arpeggio motif
      const arpeggio = [
        { time: 0.00, freq: 523.25, dur: 0.16 }, // C5
        { time: 0.12, freq: 659.25, dur: 0.16 }, // E5
        { time: 0.24, freq: 783.99, dur: 0.16 }, // G5
        { time: 0.36, freq: 1046.50, dur: 0.26 }, // C6
      ];

      arpeggio.forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + note.time;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.freq, start);

        gain.gain.setValueAtTime(0.26, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + note.dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + note.dur + 0.02);
      });

      // คอร์ดฉลองชัยชนะกังวาน (Grand final sustained major chord)
      const chordTime = now + 0.52;
      const chordFreqs = [523.25, 659.25, 783.99, 1046.50];
      chordFreqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, chordTime);

        gain.gain.setValueAtTime(0.22, chordTime);
        gain.gain.exponentialRampToValueAtTime(0.001, chordTime + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(chordTime);
        osc.stop(chordTime + 1.25);
      });
    } catch {
      // Audio safety
    }
  }
}

export const virtualAudioService = new VirtualAudioService();
