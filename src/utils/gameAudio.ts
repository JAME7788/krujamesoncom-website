// 🔊 ระบบเสียงเกมแบบ Singleton AudioContext — ป้องกันอาการกระตุกและ AudioContext เต็มลิมิตเบราว์เซอร์
// ใช้ AudioContext ตัวเดียวร่วมกันทั้งแอป พร้อมระบบเปิด/ปิดเสียงที่จำค่าได้

const MUTE_STORAGE_KEY = 'krujames_game_audio_muted_v1';

let sharedAudioContext: AudioContext | null = null;

function getSharedAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (sharedAudioContext && sharedAudioContext.state !== 'closed') {
    if (sharedAudioContext.state === 'suspended') {
      void sharedAudioContext.resume().catch(() => {});
    }
    return sharedAudioContext;
  }
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  try {
    sharedAudioContext = new AudioCtx();
    return sharedAudioContext;
  } catch {
    return null;
  }
}

export function isGameAudioMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setGameAudioMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTE_STORAGE_KEY, muted ? '1' : '0');
  } catch {
    // ignore storage errors
  }
}

export function playGameTone(
  freq: number,
  durationSec = 0.1,
  type: OscillatorType = 'sine',
  volume = 0.08,
  slideToFreq?: number,
): void {
  if (isGameAudioMuted()) return;
  const ctx = getSharedAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(40, freq), now);
    if (slideToFreq && slideToFreq > 0) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(40, slideToFreq),
        now + Math.max(0.02, durationSec),
      );
    }
    const safeVolume = Math.max(0.001, Math.min(0.25, volume));
    gain.gain.setValueAtTime(safeVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + Math.max(0.02, durationSec));
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + Math.max(0.02, durationSec));
    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch {
        // ignore disconnect errors
      }
    };
  } catch {
    // ignore audio errors
  }
}
