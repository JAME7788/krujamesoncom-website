# krujamesoncom-website — บันทึกสำหรับ Gemini

## งานเนื้อหาวิชาเลือก (ส่งต่อจาก Claude 2026-11-09)

ก่อนเพิ่มหรือแก้เนื้อหาวิชา IoT (`iot-smart`), ฐานข้อมูล (`database-basic`), เล่าเรื่องดิจิทัล (`digital-story`)
หรือบทเรียน พ.ร.บ.คอมพิวเตอร์ ให้อ่าน `docs/course-content-guide.md` ก่อนทุกครั้ง

สรุปสั้น:
- แก้เนื้อหาที่ `src/data/courses/*Expansion.ts` (สไลด์เพิ่ม แบบทดสอบ บันทึกการสอน ใบงาน กิจกรรม บทความ)
- แบบทดสอบเขียนคำตอบที่ถูกเป็นตัวเลือกแรก (`answer: 0`) ระบบสลับตำแหน่งให้
- ห้ามอีโมจิช่วง U+1FA70–U+1FAFF, ใช้ข้อมูลสมมุติเท่านั้น, ห้ามใช้ข้อมูลส่วนบุคคลจาก `D:\เอกสารโรงเรียน`
- แก้แล้วรัน `node scripts/build_course_worksheets.mjs`, `node scripts/build_slide_prompts.mjs`, `npx tsc -b`, `npx vitest run`
- ภาพสไลด์ 144 แผ่นยังไม่ได้สร้าง: ใช้ `docs/slide-prompts/` กับสกิล `/สร้างภาพ`
- งานส่วนนี้ยังไม่ได้ commit: commit เฉพาะไฟล์ที่เกี่ยวข้อง พร้อมแท็กผู้ทำ
