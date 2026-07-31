# Changelog

เอกสารนี้บันทึกการเปลี่ยนแปลงสำคัญของเว็บ Kru James Soncom Classroom

## 31 กรกฎาคม 2569 — Unified Teacher Workflow

Commit: `589b85e feat: unify teacher classroom workflow`

### เพิ่มใหม่

- ศูนย์ `คาบเรียนวันนี้` รวมเช็กชื่อ แผน สไลด์ บทเรียน ควิซ เกม งาน และบันทึกหลังสอน
- แผนเทคโนโลยี ป.1-6 ชั้นละ 40 ชั่วโมง รวม 240 แผน
- วันที่สอนจริงและสถานะ `ยังไม่สอน`, `กำลังสอน`, `สอนแล้ว`, `เลื่อนสอน`, `สอนชดเชย`
- หลักฐานการเรียนรู้กลาง K/P/A จาก attendance, game, quiz, homework และ manual assessment
- ระบบตรวจการบ้านผ่านลิงก์ พร้อมคะแนน K และรูบริก P รายคน
- คลังข้อสอบ แบ่งระดับความยาก สุ่มชุด 10 ข้อ และเก็บสถิติการตอบรายข้อ
- บัญชีครูแบบ `admin`, `teacher`, `viewer` และทางเข้าสู่ Firebase Auth
- ประวัติการแก้ไขคะแนน แผน งาน เนื้อหา และข้อสอบ
- เวอร์ชันเนื้อหา สถานะร่าง/เผยแพร่ และการย้อนคืนเวอร์ชัน

### ปรับปรุง

- แบบทดสอบทั่วไปเพิ่มเป็น 10 ข้อ
- เกม ควิซ เช็กชื่อ และการบ้านส่งหลักฐานเข้าโมเดล K/P/A เดียวกัน
- `/admin/scores` เปลี่ยนเส้นทางเข้าสมุดคะแนนกลางที่ `/admin?tab=gradebook`
- กำหนดการสอน ป.1-6 ส่งออกวันที่วางแผน วันที่สอนจริง และสถานะได้
- Firestore Rules รองรับ `teachingSessions`, `learningEvidence`, `questionBank`,
  `courseVersions`, `teacherAuditLogs` และ `teacherProfiles`

### การตรวจสอบ

- Vitest: 18 test files, 154 tests ผ่านทั้งหมด
- ESLint: ผ่าน
- TypeScript และ Vite production build: ผ่าน
- Browser smoke test: 27 เส้นทางผ่าน ไม่มีหน้าเสียหรือแนวนอนล้น
- Console: ไม่พบ error หรือ warning ในรอบตรวจหลัง deploy Firestore Rules

### งานตั้งค่าที่ผู้ดูแลยังต้องทำ

- สร้างบัญชีครูใน Firebase Authentication
- สร้าง `teacherProfiles/{uid}` พร้อม `role` และ `active: true`
- ตั้งค่า `VITE_TEACHER_AUTH_EMAIL` ใน environment ของ production
- เปิดและ Enforce Firebase App Check ก่อนใช้ข้อมูลจริงบนอินเทอร์เน็ตสาธารณะ
- เมื่อยืนยันว่าบัญชีครู Firebase ใช้ได้ครบ จึงค่อยนำ legacy admin fallback ออก
