// ต้อง import ไฟล์นี้เป็นบรรทัดแรกของ main.tsx — เติม API ที่เบราว์เซอร์เก่า (iPad/Chromebook ในโรงเรียน) ไม่มี
// ก่อนโมดูลอื่นถูกโหลด (บางโมดูลเรียก crypto.randomUUID ตั้งแต่ตอน import)
import { installRandomUUIDPolyfill, installStructuredClonePolyfill } from './utils/browserPolyfills';
import { installCanvasPolyfills } from './utils/canvasPolyfills';

if (typeof window !== 'undefined') {
  installRandomUUIDPolyfill(window.crypto as unknown as Parameters<typeof installRandomUUIDPolyfill>[0]);
  installStructuredClonePolyfill(window as unknown as { structuredClone?: unknown });
  installCanvasPolyfills();
}
