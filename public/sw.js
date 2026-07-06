// ===================================================================
// KILL SWITCH — ยกเลิก service worker เดิมทั้งหมด
//
// SW cache ทำให้เครื่องค้างที่หน้าโหลด (เสิร์ฟไฟล์เก่าปนใหม่) หลายรอบ
// เว็บนี้เป็น static site + มี Vercel CDN อยู่แล้ว ไม่จำเป็นต้องมี SW cache
//
// เมื่อเบราว์เซอร์เครื่องไหนที่ยังมี SW เก่า มาเช็คอัปเดต จะได้ไฟล์นี้ →
// ติดตั้ง → ล้าง cache ทั้งหมด → ถอนทะเบียนตัวเอง → reload หน้าให้โหลดสด
// จากนั้นเครื่องนั้นจะไม่มี SW อีก (index.html เอา registration ออกแล้ว)
// ===================================================================

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      // 1) ลบ cache ทั้งหมด
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch (e) { /* ignore */ }
    try {
      // 2) ถอนทะเบียน service worker ตัวเอง
      await self.registration.unregister();
    } catch (e) { /* ignore */ }
    try {
      // 3) reload ทุกหน้าที่ SW นี้คุมอยู่ → โหลดสดจาก network ไม่ผ่าน SW
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((c) => c.navigate(c.url));
    } catch (e) { /* ignore */ }
  })());
});

// ไม่มี fetch handler — ปล่อยทุก request ผ่านไป network ตรงๆ
