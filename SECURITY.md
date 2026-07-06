# 🔐 ความปลอดภัยของเว็บ Kru James

รายงานการตรวจ (pentest) + สิ่งที่ต้องทำ เรียงตามความสำคัญ

---

## สรุปผลตรวจช่องโหว่

| # | ช่องโหว่ | ความรุนแรง | สถานะ |
|---|---------|-----------|-------|
| 1 | Firestore rules `if true` → ใครก็อ่าน/เขียน/ลบฐานข้อมูลทั้งหมดผ่าน SDK ตรงๆ | 🔴 วิกฤต | แก้ rules แล้ว + ต้องเปิด App Check (ครูทำใน Console) |
| 2 | `.env` ถูก commit เข้า git | 🟠 กลาง | หยุด track แล้ว (Firebase config ไม่ใช่ความลับจริง แต่ hygiene) |
| 3 | รหัส Admin ฝังใน source (`jameskmd`/`12345678kmd`) | 🟠 กลาง | ย้ายไป .env แล้ว — แต่ยังอยู่ใน bundle (ดูหมายเหตุ) |
| 4 | รหัสเข้าระบบนักเรียน `ajj` อยู่ใน client | 🟡 ต่ำ | โดยดีไซน์ — แค่กันคนทั่วไป |
| 5 | XSS ผ่านสไลด์ (`dangerouslySetInnerHTML`) | 🟢 ปลอดภัย | escape HTML ก่อน markdown แล้ว — ไม่ช่องโหว่ |
| 6 | ข้อมูลนักเรียน (ชื่อจริง) อ่านได้จาก Firestore | 🟠 PDPA | leaderboard สาธารณะ anonymize แล้ว / ข้อมูลดิบต้องพึ่ง App Check |

---

## ⚠️ สิ่งที่ครูต้องทำเอง (โค้ดทำแทนไม่ได้)

### ★ ข้อ 1 — เปิด App Check (สำคัญสุด กันคนยิง Firestore ตรงๆ)

App Check ทำให้ Firestore รับเฉพาะ request ที่มาจากเว็บจริงของเรา
(คนเปิด DevTools หรือเขียนสคริปต์ยิงตรงจะถูกปฏิเสธ)

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

### ข้อ 3 — เปลี่ยนรหัส Admin + รหัสนักเรียน

รหัสเก่าอยู่ในประวัติ git และใน bundle → ควรเปลี่ยน:

- **รหัส Admin**: แก้ `.env` → `VITE_ADMIN_USER` / `VITE_ADMIN_PASS` → deploy ใหม่
- **รหัสนักเรียน (ajj)**: Admin → ข้อมูลเว็บ → 🔑 รหัสเข้าระบบ → เปลี่ยน

### ข้อ 4 — จำกัดโดเมนของ API key (กันเอาไปใช้ที่อื่น)

1. [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. เลือก Firebase browser key → **Application restrictions** → **HTTP referrers**
3. ใส่เฉพาะโดเมนเว็บจริง เช่น `krujamesoncom-website.vercel.app/*`

---

## หมายเหตุความจริงเรื่องความปลอดภัยฝั่ง client

เว็บนี้เป็น **static site ไม่มี server หลังบ้าน** → การตรวจรหัสทุกอย่าง
เกิดในเบราว์เซอร์ ค่าที่ตรวจ (รหัส admin, รหัสนักเรียน) จึงอยู่ใน bundle เสมอ
ใครเปิด DevTools ก็หาเจอ

**นี่ไม่ใช่จุดอ่อนที่ปิดได้ด้วยโค้ด** — ทางแก้จริงมี 2 ทาง:
1. **App Check + Firestore Rules** (ทำได้เลย ตามข้อ 1–2) → ปกป้อง *ข้อมูล*
   ต่อให้คนผ่านหน้า login ปลอมได้ ก็เขียน Firestore ไม่ได้
2. ทำ backend/Cloud Functions + Firebase Auth (งานใหญ่ ไว้อนาคต)

สำหรับโรงเรียน ~20 คน + เน็ตในโรงเรียน → **ข้อ 1 (App Check) เพียงพอ**
สำหรับกันคนภายนอกยิงข้อมูลเสียหาย

---

## ✅ สิ่งที่แก้แล้วในโค้ด (commit นี้)

- Firestore rules: เพิ่มตรวจ shape + จำกัดจำนวน field/ความยาว string ต่อ doc
  (กัน payload ระเบิด + กันลบข้ามพาธ)
- App Check scaffolding ใน `firebase.ts` — เปิดเมื่อใส่ `VITE_RECAPTCHA_SITE_KEY`
- `.env` เลิก track ใน git + `.gitignore` กัน `.env*` (ยกเว้น `.env.example`)
- รหัส Admin อ่านจาก `.env` แทน hardcode
- ยืนยัน: สไลด์ escape HTML ก่อน render → ไม่มี XSS
