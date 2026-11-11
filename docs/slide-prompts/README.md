# ชุดเนื้อหาสำหรับสร้างภาพสไลด์ วิชาเลือกใหม่ ม.1–ม.3

สไลด์ในเว็บ (ข้อความ แบบทดสอบ ตรวจความเข้าใจ) ใช้งานได้แล้ว ชุดนี้ใช้ทำ "ภาพสไลด์" แบบเดียวกับวิชา Python และ Arduino

| วิชา | หน่วย | ภาพ | ไฟล์ |
|---|---|---|---|
| IoT และโรงเรียนอัจฉริยะ (ฉบับครูเจมส์) | 6 | 54 | [iot-smart.md](iot-smart.md) |
| ฐานข้อมูลเบื้องต้น (ฉบับครูเจมส์) | 5 | 45 | [database-basic.md](database-basic.md) |
| เล่าเรื่องด้วยสื่อดิจิทัล (ฉบับครูเจมส์) | 5 | 45 | [digital-story.md](digital-story.md) |
| **รวม** | **16** | **144** | [slide-prompts.json](slide-prompts.json) |

## ขั้นตอน

1. เปิด https://chatgpt.com ล็อกอินค้างไว้ และ Reload ส่วนขยาย "Gemini 4 Argon & AI Bridge"
2. คัดลอก prompt ทีละแผ่นจากไฟล์ .md ไปวางใน ChatGPT หรือให้ AI สั่งผ่านสกิล `/สร้างภาพ` ด้วย `slide-prompts.json` (มี prompt, โฟลเดอร์, ชื่อไฟล์ ครบทุกแผ่น)
3. บันทึกภาพลง Google Drive ตาม `driveFolder` และ `fileName` ของแต่ละแผ่น (ใต้ `G:\My Drive\สไลด์สอน` แยกโฟลเดอร์ตามหน่วย ห้ามวางไฟล์หลวมนอกโฟลเดอร์หน่วย)
4. ตรวจตัวสะกดภาษาไทยในภาพทุกแผ่น
5. แชร์ไฟล์ใน Drive แล้วเพิ่มลิงก์ลง `src/data/slideImages.ts` ตามคีย์ `iot-smart`, `database-basic`, `digital-story` (เรียงตามแผ่น หน่วยละ 9 ลิงก์)

แก้เนื้อหาสไลด์ใน `src/data/courses/*.ts` แล้วรัน `node scripts/build_slide_prompts.mjs` ใหม่ ไฟล์ในโฟลเดอร์นี้จะอัปเดตตาม
