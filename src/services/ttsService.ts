// Text-to-Speech — ใช้ Web Speech API ของเบราว์เซอร์ (ฟรี)

let currentUtterance: SpeechSynthesisUtterance | null = null;
let thaiVoice: SpeechSynthesisVoice | null = null;

// Load Thai voice
const loadVoice = () => {
  if (!('speechSynthesis' in window)) return;
  const voices = window.speechSynthesis.getVoices();
  thaiVoice = voices.find((v) => v.lang.startsWith('th')) || voices.find((v) => v.lang.startsWith('en')) || null;
};

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoice();
  window.speechSynthesis.onvoiceschanged = loadVoice;
}

export const isTTSSupported = (): boolean => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
};

export const speak = (
  text: string,
  options: { rate?: number; pitch?: number; volume?: number; onEnd?: () => void } = {}
): boolean => {
  if (!isTTSSupported()) return false;
  stop();

  const utter = new SpeechSynthesisUtterance(text);
  if (thaiVoice) utter.voice = thaiVoice;
  utter.lang = thaiVoice?.lang || 'th-TH';
  utter.rate = options.rate ?? 1.0;
  utter.pitch = options.pitch ?? 1.0;
  utter.volume = options.volume ?? 1.0;
  if (options.onEnd) utter.onend = options.onEnd;

  currentUtterance = utter;
  window.speechSynthesis.speak(utter);
  return true;
};

export const stop = () => {
  if (isTTSSupported()) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
};

export const pause = () => {
  if (isTTSSupported()) window.speechSynthesis.pause();
};

export const resume = () => {
  if (isTTSSupported()) window.speechSynthesis.resume();
};

export const isSpeaking = (): boolean => {
  return isTTSSupported() && window.speechSynthesis.speaking;
};

export const isPaused = (): boolean => {
  return isTTSSupported() && window.speechSynthesis.paused;
};
