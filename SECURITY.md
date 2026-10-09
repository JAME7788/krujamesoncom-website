# 🔐 ความปลอดภัยของเว็บ Kru James

## สถานะล่าสุด 9 ตุลาคม 2569

ระบบยืนยันตัวตนครูและนักเรียนทำงานแล้วบน production และ Firestore Rules รุ่นใหม่ถูก compile และ deploy หลังเว็บรุ่นใหม่ออนไลน์เรียบร้อย

### สิ่งที่ทำเสร็จแล้ว

- ครูเข้าสู่ระบบด้วย Firebase Auth และต้องมีบทบาท `admin`, `teacher` หรือ `viewer` ใน token
- หน้า Admin ตรวจ Firebase user และ token สด ค่าใน localStorage ใช้เป็นเพียง cache และปลอมสิทธิ์ production ไม่ได้
- นักเรียนจริง 115 คนมีบัญชี Firebase Auth, PIN 6 หลัก และ custom claims `role=student`, `studentId`, `studentCode`, `classroom`
- session นักเรียนถูกคืนค่าหลัง Firebase ยืนยันว่า `studentId` ใน token ตรงกับรายชื่อเท่านั้น
- หน้าเข้าสู่ระบบไม่แสดงรายชื่อนักเรียนก่อนยืนยันตัวตน ใช้รหัสนักเรียนกับ PIN และไม่อ่าน roster จาก Firebase แบบ anonymous
- ไฟล์ PIN อยู่เฉพาะเครื่องครูที่ `C:\Users\KruJames\Desktop\รหัส-PIN-นักเรียน-KruJames.csv` และไม่อยู่ใน Git
- Firestore Rules รุ่นใหม่จำกัด `students`, `progress`, `learningEvidence`, `homeworkSubmissions`, `surveys`, `gameReflections` และข้อมูลประเมินให้เจ้าของหรือครู
- คลังข้อสอบ `questionBank` อ่านและแก้ได้เฉพาะครู ป้องกันนักเรียนดึงเฉลยจากฐานข้อมูล
- Live Quiz ไม่ส่ง `questions.answer` หรือ `bankId` ในเอกสารห้องที่ผู้เล่นอ่านได้ คำตอบของผู้เล่นส่งเป็นคำขอแบบเพิ่มอย่างเดียวและให้เครื่องครูประมวลผล
- หน้า Live Quiz Host ถูกป้องกันด้วย AdminGate
- Coding Sandbox แยกไป Web Worker จำกัดเวลา 3 วินาที และปิดการเข้าถึง DOM, Storage และเครือข่ายทั่วไป
- หน้าพิมพ์งานวิจัยเลิกใช้ `document.write`
- dependency audit ไม่พบช่องโหว่ที่รายงาน

### สถานะการนำขึ้นระบบ

| ส่วน | สถานะ |
|---|---|
| เว็บและระบบ Auth | deploy บน Vercel แล้ว |
| Firestore Rules | deploy บน production แล้ว |
| Storage Rules | ไฟล์กฎพร้อม แต่ Firebase project ยังไม่มี Storage bucket |
| App Check | โค้ดรองรับ; ยังต้องใส่ reCAPTCHA site key และเปิด Enforce ใน Firebase Console |

## แบบจำลองสิทธิ์

| ผู้ใช้ | สิทธิ์หลัก |
|---|---|
| ผู้ไม่เข้าสู่ระบบ | อ่านเฉพาะเนื้อหาสาธารณะ เช่น ประกาศ หลักสูตร และกิจกรรมทั่วไป |
| นักเรียน | อ่านและเขียนข้อมูลของตนตาม `studentId` ใน custom claims |
| ครู/ผู้ดูแล | อ่านข้อมูลชั้นเรียนและจัดการข้อมูลครูตามบทบาท |
| ผู้ทดลองภายนอก | ใช้หน้าทดลองที่ไม่บันทึกลงคะแนนนักเรียน |

รหัส `admin_teacher_account` และรหัสที่ขึ้นต้นด้วย `external_visitor_` ถูกปฏิเสธจากระบบคะแนนกลาง รายชื่อผู้ทดลองเก็บแยกใน `externalVisitors` และข้อมูลสรุปที่ไม่ระบุบุคคลเก็บใน `externalVisitorStats/summary`

## ข้อมูลประเมินรายบุคคล

- ผลวิเคราะห์รายคนเก็บใน Firebase และไฟล์สำรองส่วนตัวของครู ไม่เพิ่มตารางคะแนนจริงลง GitHub
- สคริปต์เติมข้อมูลไม่เขียนทับรายการ `confirmedByTeacher`
- รายการที่สร้างจากค่าเฉลี่ยห้องมีสถานะรอครูยืนยันและข้อความว่าเป็นค่าเริ่มต้น ห้ามใช้เป็นผลยืนยันอัตโนมัติ
- หลังซ่อมข้อมูล จำนวน `students` และ `progress` ตรงกัน 115/115 และคาบที่สอนแล้วตรงกับบันทึกหลังสอน 177/177

## งานที่ต้องตั้งค่าจาก Console

### 1. เปิด App Check

1. เปิด Firebase Console → App Check → Apps
2. เลือกเว็บแอปและลงทะเบียน reCAPTCHA v3
3. ใส่ site key ใน environment ของ Vercel เป็น `VITE_RECAPTCHA_SITE_KEY`
4. deploy เว็บและดู Request metrics อย่างน้อย 1–2 วัน
5. เปิด Enforce สำหรับ Cloud Firestore และ Storage เมื่อระบบส่ง token ครบ

App Check ลด request ปลอม แต่ Firebase Auth และ Rules ยังคงเป็นตัวตัดสินสิทธิ์ข้อมูล

### 2. เปิด Firebase Storage เมื่อจะรับไฟล์

Firebase CLI ตรวจพบว่าโปรเจกต์ `krujamesoncom-website-9f134` ยังไม่ได้สร้าง Storage bucket จึงยัง deploy `storage.rules` ไม่ได้ ต้องกด Get Started ใน Firebase Console เลือกตำแหน่งจัดเก็บและตรวจเงื่อนไขค่าใช้จ่ายก่อน จากนั้นจึง deploy กฎ Storage

### 3. จำกัด Firebase browser key

ใน Google Cloud Console → APIs & Services → Credentials ให้จำกัด HTTP referrers เป็นโดเมน production และ preview ที่ใช้งานจริง

## การตรวจรอบล่าสุด

- Unit/integration: 76 ไฟล์, 849/849 ข้อผ่าน
- Firestore Rules: ชุด regression ผ่าน, compile และ deploy ด้วย Firebase CLI สำเร็จ
- Authorization จริง: นักเรียนอ่าน `students/progress` ของตนได้ อ่านข้อมูลนักเรียนคนอื่นและ `questionBank` ไม่ได้
- Production end-to-end: ล็อกอินนักเรียน เปิด Dashboard เกม และโลก 3D ผ่านโดยไม่มี page error
- ESLint: 0 error, 0 warning
- Production build: ผ่าน
- npm audit: 0 vulnerability
- เกม: 406 จุดตรวจผ่าน และวงจร Game Based Learning 36/36 เกมผ่าน
- โลก 3D: desktop, mobile, teacher-student, admin dashboard ผ่าน
- ข้อมูลจริง: 28 collections ไม่มีปัญหาที่ตัวตรวจพบ

## ไฟล์ที่เกี่ยวข้อง

- `firestore.rules`
- `storage.rules`
- `src/services/studentAuthService.ts`
- `src/services/authAdmin.ts`
- `src/services/liveQuizService.ts`
- `scripts/setup-student-auth.mjs`
- `scripts/verify-student-auth.mjs`
- `SYSTEM_AUDIT_2026-10-07.md`
