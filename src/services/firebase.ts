import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

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

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// ---------------------------------------------------------------
// App Check — บล็อก request ที่ไม่ได้มาจากเว็บจริงของเรา
// โหลดแบบ lazy (dynamic import) + หลัง app mount แล้ว เพื่อไม่ให้อยู่ใน
// critical path ของการโหลดเว็บ ถ้าพังก็ไม่ทำให้เว็บค้าง
//
// เปิดใช้งาน: ใส่ VITE_RECAPTCHA_SITE_KEY ใน .env แล้วไปกด "Enforce"
// ที่ Firestore ใน Firebase Console (ดู SECURITY.md)
// ---------------------------------------------------------------
const appCheckSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
if (appCheckSiteKey && typeof window !== "undefined") {
  // ไม่ await — ปล่อยให้ทำงานเบื้องหลัง ไม่บล็อกการ import โมดูลนี้
  import("firebase/app-check")
    .then(({ initializeAppCheck, ReCaptchaV3Provider }) => {
      try {
        initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(appCheckSiteKey),
          isTokenAutoRefreshEnabled: true,
        });
      } catch (e) {
        console.warn("App Check init skipped:", e);
      }
    })
    .catch((e) => console.warn("App Check module load skipped:", e));
}

export default app;
