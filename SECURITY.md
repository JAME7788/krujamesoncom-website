# 🔐 ความปลอดภัยของเว็บ Kru James

## สถานะล่าสุด 31 กรกฎาคม 2569

- เพิ่มทางเข้าสู่ระบบครูด้วย Firebase Auth และรองรับบทบาท `admin`, `teacher`, `viewer` แล้ว
- เพิ่ม collection `teacherProfiles` สำหรับกำหนดบทบาทและสถานะบัญชีครู
- Firestore Rules รุ่นที่รองรับระบบคาบ หลักฐาน K/P/A คลังข้อสอบ เวอร์ชันเนื้อหา
  และประวัติการแก้ไข ถูก deploy ไปยังโปรเจกต์ `krujamesoncom-website-9f134` แล้ว
- ระบบเดิมยังมี legacy admin fallback เพื่อไม่ให้การใช้งานหยุดชะงัก จึงยังไม่ถือว่า
  การยืนยันตัวตนและ PDPA ปลอดภัยสมบูรณ์จนกว่าจะสร้างบัญชีครู Firebase และนำ fallback ออก

### ขั้นตอนเปิดใช้บัญชีครู Firebase

1. เปิด Email/Password provider ใน Firebase Authentication
2. สร้างบัญชีครูและนำ `uid` มาสร้างเอกสาร `teacherProfiles/{uid}`
3. กำหนด `{ "role": "admin", "active": true }` สำหรับผู้ดูแลหลัก
4. ตั้ง `VITE_TEACHER_AUTH_EMAIL` ใน environment ของ Vercel หรือเครื่องที่ deploy
5. ทดสอบเข้าสู่ระบบ แก้คะแนน บันทึกคาบ และอ่าน audit log ก่อนปิด legacy fallback
6. เปิด App Check แบบ Enforce เมื่อยืนยันว่าโดเมน production ทำงานถูกต้อง

รายงานการตรวจ (pentest) + สิ่งที่ต้องทำ เรียงตามความสำคัญ

---

## สรุปผลตรวจช่องโหว่

| # | ช่องโหว่ | ความรุนแรง | สถานะ |
|---|---------|-----------|-------|
| 1 | Firestore อนุญาต read/write โดยไม่ใช้ Firebase Auth และตรวจเพียงรูปร่างข้อมูล | 🔴 วิกฤต | ยังไม่ปิด ต้องใช้ Auth + rules แยกบทบาท; App Check ช่วยลด abuse แต่แทน Auth ไม่ได้ |
| 2 | `.env` ถูก commit เข้า git | 🟡 ต้องระวัง | ยัง track อยู่โดยตั้งใจเพื่อ Vercel build; ต้องเก็บเฉพาะ Firebase web config ห้ามใส่ secret |
| 3 | รหัส Admin มี fallback อยู่ใน source และถูกอ่านได้จาก browser bundle | 🔴 สูง | ยังไม่ปิด หน้า login เป็นเพียง client-side gate |
| 4 | รหัสเข้าระบบนักเรียน `ajj` อยู่ใน client | 🟡 ต่ำ | โดยดีไซน์ — แค่กันคนทั่วไป |
| 5 | XSS ผ่านสไลด์ (`dangerouslySetInnerHTML`) | 🟢 ปลอดภัย | escape HTML ก่อน markdown แล้ว — ไม่ช่องโหว่ |
| 6 | ข้อมูลนักเรียนและคะแนนจริงอ่านได้จาก Firestore โดยไม่ยืนยันตัวตน | 🔴 PDPA | ยังไม่ปิด ต้องใช้ Firebase Auth และ rules จำกัดครู/นักเรียนรายคน |

---

## ⚠️ สิ่งที่ครูต้องทำเอง (โค้ดทำแทนไม่ได้)

### ★ ข้อ 1 — เปิด App Check (สำคัญสุด กันคนยิง Firestore ตรงๆ)

App Check ช่วยลด request ปลอมและสคริปต์อัตโนมัติที่ไม่ได้มาจากแอป แต่ไม่ใช่ระบบ
ยืนยันตัวตนและไม่สามารถแยกสิทธิ์ครูกับนักเรียนได้ จึงต้องใช้ร่วมกับ Firebase Auth
และ Firestore Rules แบบแบ่งบทบาท

1. [Firebase Console](https://console.firebase.google.com) → โปรเจกต์ → **App Check**
2. เมนู **Apps** → เลือกเว็บแอป → **Register** → เลือก **reCAPTCHA v3**
3. จะได้ **site key** → เอาใส่ `.env`:
   ```
   VITE_RECAPTCHA_SITE_KEY=6Lxxxxxxxxxxxxx
   ```
4. Deploy เว็บใหม่ (push → Vercel build)
5. กลับมาที่ App Check → แท็บ **APIs** → **Cloud Firestore** → กด **Enforce**
   - แนะนำ: ดู "Request metrics" 1–2 วันก่อน Enforce เพื่อเช็คว่าเว็บจริงส่ง token ครบ
6. ทำแบบเดียวกันกับ **Storage** ถ้าใช้อัปโหลดไฟล์

> ตราบใดที่ยังไม่ Enforce = ยังมีคนยิง Firestore ตรงได้อยู่

### ★ ข้อ 2 — Deploy Firestore Rules ใหม่

ไฟล์ [firestore.rules](firestore.rules) ในโปรเจกต์ถูก hardening แล้ว
แต่ **การแก้ไฟล์เฉยๆ ไม่มีผล** ต้อง deploy ขึ้น Console:

- **วิธีง่าย**: Firebase Console → Firestore Database → แท็บ **Rules** →
  ลบของเก่า → วางเนื้อหาไฟล์ `firestore.rules` → **Publish**
- **หรือ CLI**: `firebase deploy --only firestore:rules`

### ข้อ 3 — เปลี่ยนระบบ Admin เป็น Firebase Auth

การย้ายรหัสไป `VITE_ADMIN_USER` / `VITE_ADMIN_PASS` ไม่ทำให้เป็นความลับ เพราะตัวแปร
`VITE_*` ถูกฝังใน JavaScript bundle ทางแก้สำหรับใช้งานจริงคือ Firebase Auth
(บัญชีครู) + custom role/claim + rules ที่อนุญาตแก้คะแนนเฉพาะครู

รหัสนักเรียนในหน้าล็อกอินใช้เป็นเพียงรหัสเข้าห้อง ไม่ใช่สิทธิ์เข้าถึงฐานข้อมูล

### ข้อ 4 — จำกัดโดเมนของ API key (กันเอาไปใช้ที่อื่น)

1. [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. เลือก Firebase browser key → **Application restrictions** → **HTTP referrers**
3. ใส่เฉพาะโดเมนเว็บจริง เช่น `krujamesoncom-website.vercel.app/*`

---

## หมายเหตุความจริงเรื่องความปลอดภัยฝั่ง client

หน้าเว็บและการเขียน Firebase ส่วนใหญ่ทำงานจาก browser โดยตรง ส่วน AI tutor มี
Vercel serverless proxy ที่ `/api/ai-tutor` การตรวจรหัส Admin ปัจจุบันยังเกิดใน
browser จึงไม่ใช่กำแพงความปลอดภัย
ใครเปิด DevTools ก็หาเจอ

ทางแก้จริงต้องมีทั้ง:
1. **App Check** เพื่อลด abuse จาก client ปลอม
2. **Firebase Auth + role-based Firestore Rules** เพื่อแยกครู นักเรียน และข้อมูลรายคน
3. ย้ายคำสั่งสำคัญ เช่น แก้คะแนนทั้งห้อง ไป backend/Cloud Functions เมื่อพร้อม

ก่อนทำครบสามส่วนนี้ ไม่ควรถือว่าระบบคะแนนและข้อมูลส่วนบุคคลปลอดภัยสำหรับการเปิด
ต่ออินเทอร์เน็ตสาธารณะ แม้หน้าเว็บจะใช้งานได้ตามปกติ

---

## ✅ สิ่งที่แก้แล้วในโค้ด (commit นี้)

- Firestore rules: เพิ่มตรวจ shape + จำกัดจำนวน field/ความยาว string ต่อ doc
  (ช่วยกัน payload ผิดรูปแบบ แต่ยังไม่ใช่ authorization)
- App Check scaffolding ใน `src/services/firebase.ts` — เปิดเมื่อใส่
  `VITE_RECAPTCHA_SITE_KEY`
- `.env.secret` และ `.env.*.local` ถูก ignore; `.env` ที่ track ต้องมีเฉพาะ
  Firebase web config
- AI provider key ย้ายไป Vercel serverless proxy ไม่อยู่ใน browser bundle
- ยืนยัน: สไลด์ escape HTML ก่อน render → ไม่มี XSS
