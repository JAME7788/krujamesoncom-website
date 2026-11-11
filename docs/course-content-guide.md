# คู่มือเพิ่มเนื้อหาวิชาเลือก (สำหรับ Gemini / Claude)

เอกสารส่งต่องานจาก Claude (2026-11-09) ให้ Gemini ทำเนื้อหาต่อได้ทันที อ่านให้จบก่อนแก้ไฟล์

## 1. สถานะตอนส่งต่อ

| งาน | สถานะ |
|---|---|
| วิชาเลือก ม.1–ม.3 ใหม่ 3 วิชา: IoT (`iot-smart`, 6 หน่วย), ฐานข้อมูล (`database-basic`, 5 หน่วย), เล่าเรื่องดิจิทัล (`digital-story`, 5 หน่วย) | เสร็จ เปิดให้ห้อง ม.1–ม.3 แล้ว |
| ขยายเนื้อหาทั้ง 3 วิชา: หน่วยละ 9 สไลด์, แบบทดสอบ 8 ข้อ, บันทึกการสอน, ใบงาน HTML, กิจกรรมสนุก, อ่านเพิ่มเติม | เสร็จ |
| บทเรียน พ.ร.บ.คอมพิวเตอร์ ในหน่วยความปลอดภัย ป.4 (หน่วย 5), ป.5–ป.6 (หน่วย 4), ม.1 (หน่วย 2), ม.2–ม.3 (หน่วย 4) | เสร็จ |
| ชุด prompt ภาพสไลด์ 144 แผ่น (`docs/slide-prompts/`) | เตรียมแล้ว **ยังไม่ได้สร้างภาพ** |
| commit | **ยังไม่ได้ commit** ไฟล์ทั้งหมดอยู่ใน working tree (ดู `git status`) |

ตรวจผ่านแล้วตอนส่งต่อ: `tsc -b`, `eslint`, `vitest` 963 ข้อ, `vite build` และเปิดหน้าจริงในเบราว์เซอร์

## 2. ไฟล์อยู่ที่ไหน

```
src/data/courses/
  courseExpansion.ts        ชนิดข้อมูล UnitExpansion, Worksheet และ worksheetUrl()
  iotCourse.ts              หลักสูตร + extras เดิม + สไลด์ 6 แผ่นแรกของแต่ละหน่วย
  iotExpansion.ts           ส่วนขยายต่อหน่วย: สไลด์เพิ่ม แบบทดสอบเพิ่ม บันทึกการสอน ใบงาน กิจกรรม บทความ
  databaseCourse.ts / databaseExpansion.ts
  storytellingCourse.ts / storytellingExpansion.ts
src/data/extraCourses.ts    รวมทุกอย่างแล้วส่งออก extraCourses, extraUnitExtras, extraRichSlides
src/data/computerLawContent.ts  แบบทดสอบ/สรุป/ลิงก์ พ.ร.บ.คอมพิวเตอร์ เติมลงหน่วยความปลอดภัย
public/worksheets/<courseId>/*.html   ใบงานที่สร้างจากสคริปต์ (ห้ามแก้มือ)
docs/slide-prompts/                   ชุด prompt ภาพสไลด์ (ห้ามแก้มือ)
scripts/build_course_worksheets.mjs   สร้างใบงานจาก *Expansion.ts
scripts/build_slide_prompts.mjs       สร้าง prompt ภาพสไลด์จากเนื้อหาจริง
tests/extraCourses.test.ts            เทสต์วิชาใหม่และบทเรียน พ.ร.บ.
tests/primarySlides.test.ts           เทสต์คุณภาพสไลด์ทุกวิชา (มี EXTRA และจำนวนหน่วยรวม 97)
```

จุดลงทะเบียน (แก้แล้ว บรรทัดเดียวต่อไฟล์ ไม่ต้องแตะอีกถ้าแค่เพิ่มเนื้อหา):
`src/data/curriculum.ts`, `src/data/unitExtras.ts`, `src/data/richSlides.ts`, `src/services/courseAccessService.ts`

## 3. ข้อมูลไหลอย่างไร

```
*Course.ts (หน่วย, สไลด์ 6 แผ่น, extras)
        +  *Expansion.ts (ส่วนขยาย)
        ↓  extraCourses.ts
   - topics/activities ของ expansion ต่อท้ายหน่วย
   - สไลด์ expansion แทรกก่อนแผ่นสุดท้าย (แผ่นตรวจความเข้าใจ) → mergeDeck()
   - quiz เดิม + quiz expansion แล้ว spreadAnswers() สลับตำแหน่งคำตอบ
   - worksheet กลายเป็น LearningFile (kind: 'worksheet') ในแท็บ "ไฟล์ประกอบ"
   - fun, articles, videos ต่อท้าย; lessonNotes ใช้ของ expansion
        ↓
   curriculum.ts / unitExtras.ts / richSlides.ts → หน้า /curriculum/<courseId>/unit/<n>
```

## 4. วิธีเพิ่มเนื้อหา

### 4.1 เพิ่มในหน่วยที่มีอยู่ (งานที่ทำบ่อยที่สุด)
แก้เฉพาะ `src/data/courses/<วิชา>Expansion.ts` ที่ key เลขหน่วย:
- `slides`: เพิ่ม RichSlide (แทรกก่อนแผ่นตรวจความเข้าใจอัตโนมัติ)
- `quiz`: เพิ่มข้อ **เขียนคำตอบที่ถูกเป็นตัวเลือกแรก (`answer: 0`)** ระบบสลับตำแหน่งให้เอง
- `lessonNotes`, `fun`, `articles`, `videos`, `topics`, `activities`
- `worksheet`: แก้ตาราง (`''` = ช่องให้นักเรียนเขียน) แล้วรันสคริปต์สร้างใบงานใหม่

### 4.2 เพิ่มหน่วยใหม่ในวิชาเดิม
1. เพิ่ม unit ใน `units` ของ `*Course.ts` (`no` ต่อเลข, `topics`, `activities` ≥ 3 ข้อ, `indicators`)
2. เพิ่มชุดสไลด์ใน `*Slides` (แผ่นแรก `layout: 'cover'` มี `body`; แผ่นสุดท้ายชื่อขึ้นต้น "ตรวจความเข้าใจ" และมี `quickCheck` ที่ `answer: 0`)
3. เพิ่ม `*Extras[no]` (intro, videos, quiz ≥ 3) และ `*Expansion[no]`
4. แก้เทสต์: `tests/primarySlides.test.ts` จำนวนหน่วยรวม (ตอนนี้ 97) และ `extraUnitKeys.length` (ตอนนี้ 16)

### 4.3 เพิ่มวิชาใหม่
1. สร้าง `src/data/courses/<ชื่อ>Course.ts` และ `<ชื่อ>Expansion.ts` ตามแบบไฟล์เดิม (import เฉพาะ `import type` เพื่อให้สคริปต์ Node อ่านไฟล์ได้)
2. เพิ่ม bundle ใน `bundles` ของ `src/data/extraCourses.ts`
3. เพิ่ม id ลง `classroomCourseIds` และ `defaultOpenCourseIdsByClassroom` ใน `src/services/courseAccessService.ts`
4. เพิ่มใน `COURSES` ของทั้งสองสคริปต์ใน `scripts/`
5. แก้เทสต์: `EXTRA` และจำนวนหน่วยใน `tests/primarySlides.test.ts`, `EXTRA_IDS` ใน `tests/extraCourses.test.ts`

## 5. กติกาเนื้อหา (เทสต์บังคับบางข้อ)

- ห้ามใช้อีโมจิช่วง U+1FA70–U+1FAFF (เช่น 🪜 🪪 🪥) เครื่องเก่าของโรงเรียนแสดงเป็นกล่องว่าง
- bullet ต้องยาวเกิน 2 ตัวอักษร และห้ามซ้ำกับหัวข้อสไลด์; `comparison` ต้องมี `compareLeft`/`compareRight` ฝั่งละ ≥ 2 รายการ
- แบบทดสอบใหม่ใช้ 4 ตัวเลือก มี `explain` เมื่อคำตอบไม่ชัดเจนในตัว
- ข้อมูลตัวอย่างต้องเป็นข้อมูลสมมุติ (มานะ มานี ปิติ ชูใจ วีระ) ห้ามใช้ชื่อนักเรียนจริง
- จาก `D:\เอกสารโรงเรียน` ใช้ได้เฉพาะเอกสารความรู้ (คู่มือ GoGo Board, เน็ตพาย 2020, บทความ IoT ในโรงเรียน, Digital Storytelling, ตัวบท พ.ร.บ.คอมพิวเตอร์) **ห้ามใช้** โฟลเดอร์ KMD (การเงิน เอกสารบุคคลครู SAR), งานประเมิน, ฝึกสอน, เยี่ยมบ้าน/SDQ/รูปนักเรียน, โฟลเดอร์ที่ตั้งชื่อด้วยรหัสนักศึกษาของผู้อื่น และสคริปต์วิดีโอส่วนตัวของครู
- เขียนเนื้อหาใหม่เอง ห้ามคัดลอกยาวจากเอกสารมีลิขสิทธิ์ ห้ามอัปโหลดไฟล์ต้นฉบับขึ้นเว็บ
- ลิงก์ต้องเปิดได้จริงและเป็นแหล่งที่เชื่อถือได้; ใส่ `noLogin: true` เฉพาะเว็บที่ใช้ได้โดยไม่ต้องสมัคร
- ข้อเท็จจริงที่ตรวจแล้ว ใช้ตามนี้:
  - ESP32: GPIO 3.3V, `analogRead` 0–4095, ขา ADC2 ใช้ไม่ได้ขณะเปิด Wi-Fi (ใช้ ADC1 GPIO 32–39), Wi-Fi 2.4 GHz เท่านั้น
  - NETPIE 2020: broker `mqtt.netpie.io` พอร์ต 1883, Client ID/Token/Secret, `@shadow/data/update`, `@msg/...`, `@private/#`, Feed เก็บค่าย้อนหลัง
  - **LINE Notify ปิดบริการแล้ว (31 มี.ค. 2025)** ห้ามสอนหรืออ้างถึง
  - พ.ร.บ.คอมฯ: ม.5 จำคุก ≤ 6 เดือน/ปรับ ≤ 10,000; ม.6 ≤ 1 ปี/≤ 20,000; ม.7 ≤ 2 ปี/≤ 40,000; ม.9 ≤ 5 ปี/≤ 100,000; ม.14 ≤ 5 ปี/≤ 100,000; ม.16 ≤ 3 ปี **และ** ≤ 200,000 (ติชมโดยสุจริตไม่ผิด); ม.26 เก็บข้อมูลจราจร ≥ 90 วัน

## 6. หลังแก้เนื้อหา รันตามลำดับ

```bash
node scripts/build_course_worksheets.mjs
node scripts/build_slide_prompts.mjs
npx tsc -b
npx eslint src/data scripts/build_course_worksheets.mjs scripts/build_slide_prompts.mjs tests/extraCourses.test.ts tests/primarySlides.test.ts
npx vitest run
```

แล้วเปิดตรวจหน้าจริง (dev server พอร์ต 5173) ด้วยโหมด QA: `?qa=run-1` และตั้ง localStorage `krujames_admin_session_v1` เป็น session ที่ `authSource: 'qa'` ตรวจครบทุกแท็บ: สไลด์ ไฟล์ประกอบ กิจกรรมสนุก แบบทดสอบ อ่านเพิ่มเติม ภาพรวมบทเรียน

## 7. ภาพสไลด์ (ยังไม่ได้ทำ)

ทำตาม `docs/slide-prompts/README.md` และสกิล `/สร้างภาพ`:
- prompt, ชื่อไฟล์ และโฟลเดอร์ Drive ของทุกแผ่นอยู่ใน `docs/slide-prompts/slide-prompts.json` (144 แผ่น หน่วยละ 9)
- บันทึกลง `G:\My Drive\สไลด์สอน\<วิชา>\หน่วยที่ N ...` ห้ามเก็บภาพใน repo
- ตรวจตัวสะกดภาษาไทยในภาพทุกแผ่น
- เพิ่มลิงก์ใน `src/data/slideImages.ts` ที่คีย์ `iot-smart`, `database-basic`, `digital-story` เรียงตามแผ่น
- ถ้าเพิ่มสไลด์หลังสร้างภาพไปแล้ว ลำดับแผ่นจะเลื่อน ต้องรัน `build_slide_prompts.mjs` ใหม่และตรวจชื่อไฟล์

## 8. งานที่ทำต่อได้ (เรียงตามประโยชน์)

1. สร้างภาพสไลด์ 144 แผ่นตามข้อ 7
2. เฉลยใบงานสำหรับครู (ไฟล์แยก ไม่ให้นักเรียนเห็น) 16 ใบ
3. เปลี่ยน `videos` ที่เป็นคำค้น (`yt('...')`) เป็นลิงก์คลิปที่ตรวจแล้วว่าเหมาะกับเด็ก
4. เพิ่มแบบทดสอบให้ถึงหน่วยละ 10 ข้อ เน้นโจทย์สถานการณ์
5. ใบงานสรุปท้ายวิชา (โครงงานรวม) และเกณฑ์ประเมินแบบรูบริกของแต่ละวิชา
6. commit งานทั้งหมด (แท็ก `[gemini]` หรือ `[claude]` ตามผู้ทำ) แล้ว push เมื่อแก้สิทธิ์ GitHub ได้
