import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
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

// Firestore = หัวใจของแอป — getFirestore ไม่ throw ตอน init แม้ config ไม่ครบ
export const db = getFirestore(app);

// Storage — ใช้เฉพาะ assignmentService — getStorage ไม่ throw ตอน init (lazy)
export const storage = getStorage(app);

// หมายเหตุสำคัญ: เดิมมี `export const auth = getAuth(app)` แต่แอปนี้ไม่ได้ใช้
// Firebase Auth เลย (ล็อกอินนักเรียน/แอดมินเป็นระบบเอง) และ getAuth() จะ
// throw แบบ synchronous ทันทีถ้า API key ว่าง/ผิด → ทำให้ทั้งแอปโหลดไม่ขึ้น
// (เป็นต้นเหตุที่เว็บค้างหน้าโหลดเมื่อ env var บน Vercel หาย)
// จึงถอด getAuth ออก เพื่อไม่ให้ปัญหา config ล้มทั้งเว็บอีก

// ---------------------------------------------------------------
// App Check — โหลด lazy หลัง export แล้ว ไม่อยู่ใน critical path
// เปิดใช้งาน: ใส่ VITE_RECAPTCHA_SITE_KEY ใน .env แล้วกด "Enforce"
// ที่ Firestore ใน Firebase Console (ดู SECURITY.md)
// ---------------------------------------------------------------
const appCheckSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
if (appCheckSiteKey && typeof window !== "undefined") {
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
