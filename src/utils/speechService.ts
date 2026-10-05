// 🔊 Speech Service: ระบบสังเคราะห์เสียงอ่านภาษาไทย (Web Speech API)
// ช่วยเหลือการเข้าถึง (Accessibility) สำหรับเด็กเล็ก ป.1 - ป.3 หรือนักเรียนที่มีปัญหาด้านการอ่าน

let currentUtterance: SpeechSynthesisUtterance | null = null;

export const isSpeechSupported = (): boolean => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
};

/** สังเคราะห์เสียงอ่านข้อความภาษาไทย */
export const speakThai = (text: string, onEnd?: () => void): boolean => {
  if (!isSpeechSupported()) return false;

  try {
    window.speechSynthesis.cancel(); // หยุดเสียงก่อนหน้า

    const cleanText = text.replace(/<[^>]*>/g, '').trim();
    if (!cleanText) return false;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'th-TH';
    utterance.rate = 0.95; // ความเร็วพอดีๆ ชัดถ้อยชัดคำสำหรับเด็ก
    utterance.pitch = 1.05; // โทนเสียงสดใสเป็นกันเอง

    // ค้นหาเสียงภาษาไทยถ้ามีในระบบ
    const voices = window.speechSynthesis.getVoices();
    const thaiVoice = voices.find((v) => v.lang.includes('th') || v.lang.includes('TH'));
    if (thaiVoice) {
      utterance.voice = thaiVoice;
    }

    const handleFinished = () => {
      currentUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onend = handleFinished;
    utterance.onerror = handleFinished;

    currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.warn('speakThai error:', err);
    return false;
  }
};

/** ตรวจสอบว่าระบบกำลังอ่านเสียงอยู่หรือไม่ */
export const isCurrentlySpeaking = (): boolean => {
  return currentUtterance !== null && typeof window !== 'undefined' && window.speechSynthesis.speaking;
};

/** หยุดเสียงอ่านทันที */
export const stopSpeech = (): void => {
  if (!isSpeechSupported()) return;
  try {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  } catch {
    // Ignore error on cancel
  }
};

