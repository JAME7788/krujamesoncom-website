import { defineConfig } from 'vitest/config';

// ตั้งค่าเทสต์แยกจาก vite.config.ts เพื่อไม่ให้กระทบการ build
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // เว็บอ่านค่าจาก import.meta.env — ใส่ค่าหลอกไว้ให้ import ผ่าน
    env: {
      VITE_FIREBASE_API_KEY: 'test-key',
      // ปิด Firebase จริงระหว่างเทสต์ ทุกเคสต้องใช้ cache/mock เท่านั้น
      VITE_FIREBASE_PROJECT_ID: '',
    },
  },
});
