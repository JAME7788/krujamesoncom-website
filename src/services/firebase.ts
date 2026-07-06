import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// เว็บไซต์นี้ใช้ฐานข้อมูลแยกจากเว็บโรงเรียน (Dedicated Learning Portal Database)
// หมายเหตุความปลอดภัย: firebaseConfig (apiKey ฯลฯ) ไม่ใช่ "ความลับ" —
// มันฝังอยู่ใน bundle ของทุก Firebase web app โดยธรรมชาติ
// การปกป้องข้อมูลจริงอยู่ที่ (1) Firestore Security Rules และ (2) App Check ด้านล่าง
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

// ---------------------------------------------------------------
// App Check — บล็อก request ที่ไม่ได้มาจากเว็บจริงของเรา
// (กันคนเปิด DevTools/สคริปต์ยิง Firestore ตรงๆ ข้ามแอป)
//
// เปิดใช้งาน:
//   1. Firebase Console → App Check → ลงทะเบียนเว็บด้วย reCAPTCHA v3
//   2. เอา site key ใส่ใน .env → VITE_RECAPTCHA_SITE_KEY=...
//   3. Firebase Console → App Check → กด "Enforce" ที่ Firestore
//
// ถ้าไม่ได้ตั้ง site key จะข้ามไปเงียบๆ (เว็บทำงานปกติเหมือนเดิม)
// ---------------------------------------------------------------
const appCheckSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
if (appCheckSiteKey && typeof window !== "undefined") {
  try {
    // เปิด debug token เฉพาะตอน dev (localhost)
    if (import.meta.env.DEV) {
      // @ts-expect-error — flag ของ App Check debug (มีจริงตอน runtime)
      window.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(appCheckSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (e) {
    console.warn("App Check init skipped:", e);
  }
}

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
