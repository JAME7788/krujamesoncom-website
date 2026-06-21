# 📚 Kru James Soncom Portal — System Documentation

> ระบบสารสนเทศเพื่อการจัดการเรียนการสอนวิชาเทคโนโลยี/วิทยาการคำนวณ  
> โรงเรียนบ้านคลองมดแดง • ปีการศึกษา 2569

---

## 🎯 ภาพรวมระบบ

เว็บไซต์การเรียนรู้แบบครบวงจรสำหรับ ป.1 - ม.3 ที่รวม:
- **คอร์สเรียน** ตามมาตรฐาน สสวท. (10+ คอร์ส + AI 3 คอร์ส)
- **ระบบเก็บคะแนน** K/P/A อัตโนมัติตามตัวชี้วัด ว 4.1 + ว 4.2
- **เครื่องมือเสริมการสอน** ครบครันสำหรับครู
- **เกม + กิจกรรม** ฝึกทักษะในเว็บ
- **ระบบ Admin** จัดการทุกอย่างได้

**Tech stack:** React 18 + TypeScript + Vite + Framer Motion + Firebase (optional)

---

## 🗺️ Routing Map

| Route | หน้า | Auth | คำอธิบาย |
|-------|------|------|---------|
| `/` | Home | Public | หน้าแรก + ประกาศข่าวสาร + Leaderboard |
| `/login` | Login | Public | เลือกห้อง → เลือกชื่อ |
| `/courses` | Courses | Public (gated) | คลังคอร์สเรียน filter ตามชั้น |
| `/curriculum/:gradeId/unit/:unitNo` | UnitDetail | Student | หน้าเรียนสไลด์/ควิซ/กิจกรรม |
| `/curriculum/:gradeId/:idx` | IndicatorDetail | Student | รายละเอียดตัวชี้วัด |
| `/dashboard` | Dashboard | Student | สถิติส่วนตัว + ปฏิทิน + กราฟ |
| `/report-card` | ReportCard | Student | สมุดรายงานผลการเรียน (พิมพ์ได้) |
| `/resources` | Resources | Public | คลังเครื่องมือ 107+ รายการ |
| `/games` | Games Hub | Public | รวมเกมฝึก 9 เกม |
| `/games/{mouse-practice,keyboard-practice,...}` | Games | Public | เกมแต่ละเกม |
| `/admin` | AdminDashboard | Admin login | แผงควบคุมครู 12 tabs |
| `*` | NotFound | Public | 404 page |

---

## 🔐 1. Authentication System

### ผู้ใช้งาน 2 ประเภท
1. **Student (นักเรียน)** — login ด้วยห้อง + ชื่อจาก roster 2569
2. **Admin (ครู)** — login ด้วย username/password (`jameskmd` / `12345678kmd`)

### ไฟล์หลัก
- `src/context/AuthContext.tsx` — student session + partner (โหมดนั่งคู่)
- `src/services/authAdmin.ts` — admin session 8 ชั่วโมง
- `src/components/AdminGate.tsx` — modal login admin

### Features
- **โหมดนั่งคู่** (Pair Mode) — login 2 คนพร้อมกัน บันทึกคะแนนให้ทั้งคู่
- **Session persistence** — localStorage
- **Auto-redirect** — ถ้าไม่ login → ส่งไป `/login`

---

## 👥 2. Student Roster (รายชื่อนักเรียน 2569)

### ข้อมูลในระบบ
- **115 คน • 9 ห้อง** (ป.1 - ม.3)
- มาจาก `รายชื่อนักเรียนทั้งหมด_โรงเรียนบ้านคลองมดแดง2569.xlsx`

### ไฟล์หลัก
- `src/data/students2569.ts` — built-in roster (immutable)
- `src/services/rosterService.ts` — CRUD override layer (localStorage)

### CRUD ผ่าน Admin Tab "จัดการนักเรียน"
- ➕ เพิ่มนักเรียน
- ✏️ แก้ไข (เลขที่, ชื่อ, รหัส, emoji)
- 🔄 ย้ายห้อง
- 🗑️ ลบ
- 🔢 จัดเรียงเลขที่
- 📤 Export CSV
- ⏮️ รีเซ็ตกลับเป็นค่าเดิม

---

## 📚 3. Course/Curriculum System

### โครงสร้างหลักสูตร
**12 คอร์ส** + 3 AI courses:
- ป.1 - ป.6 (ว 4.2 วิทยาการคำนวณ)
- ม.1 - ม.3 cs (ว 4.2 วิทยาการคำนวณ)
- ม.1 - ม.3 design (ว 4.1 ออกแบบเทคโนโลยี)
- AI ป.1-3, AI ป.4-6, AI ม.1-3

### Access Control
นักเรียนเห็นเฉพาะคอร์สของชั้นตัวเอง:
```
ป.5 → p5 + ai-p4-6
ม.2 → m2-cs + m2-design + ai-m1-3
Admin → ทุกคอร์ส (16+)
```

### ไฟล์หลัก
- `src/data/curriculum.ts` — โครงสร้างคอร์ส (units, indicators, lessons)
- `src/data/unitContent.ts` — สไลด์เนื้อหา (text + image)
- `src/data/unitExtras.ts` — extras (intro, videos, fun, quiz, articles)
- `src/data/richSlides.ts` — สไลด์ Rich Format (17 หน่วย × 5 สไลด์)
- `src/pages/Courses.tsx` — หน้ารายการคอร์ส
- `src/pages/Curriculum.tsx` — modal รายละเอียด
- `src/pages/UnitDetail.tsx` — หน้าเรียน (เนื้อหา + ควิซ)

### Content per Unit
แต่ละหน่วยมี 6 tabs:
1. **ภาพรวมบทเรียน** — intro + topics
2. **สไลด์เนื้อหา** — Rich slides หรือ JPG (500+ หน้า)
3. **วิดีโอประกอบ** — YouTube search queries
4. **กิจกรรมสนุก** — เกมจากภายนอก (Code.org, Scratch...)
5. **แบบทดสอบ** — quiz มี K score
6. **อ่านเพิ่มเติม** — articles จาก สสวท., scimath

---

## 🎓 4. Grade Book (เก็บคะแนน K/P/A)

### โครงสร้างคะแนน — มาตรฐานไทย 100 คะแนน
- **คะแนนเก็บ 70** = K (60%) + P (25%) + A (15%) ต่อตัวชี้วัด
- **สอบ 30** = ป. ปลายภาค 30 / ม. กลางภาค 15 + ปลายภาค 15
- **คะแนนรวม = 100** → ตัดเกรด 0-4 ตามเกณฑ์ไทย

### ตัวชี้วัด (Indicators)
- **ป.1-6**: ว 4.2 (4-5 ตัวชี้วัด/ชั้น)
- **ม.1-3 วิทยาการคำนวณ**: ว 4.2 (4 ตัวชี้วัด/ชั้น)
- **ม.1-3 ออกแบบ**: ว 4.1 (5 ตัวชี้วัด/ชั้น)

### Auto-sync (K/P/A → กิจกรรมในเว็บ)
ครูกดปุ่ม **"นำเข้า K/P/A จากเว็บ"**:
- **K** = คะแนนควิซ best score × normalize
- **P** = skill points (เกม×3 + วิดีโอ×2 + สไลด์/บทความ×1) → ดี/ปานกลาง/พอใช้
- **A** = เข้าเรียนตรงเวลาตามตาราง ≥ 2 วัน

### ไฟล์หลัก
- `src/services/gradeService.ts` — K/P/A calculation + storage
- `src/components/GradeBook.tsx` — UI ตารางคะแนน
- `src/pages/ReportCard.tsx` — สมุดรายงานพิมพ์ได้

### Features
- ✅ ครูแก้ค่าเองได้ทุกช่อง
- ✅ Subject tabs สำหรับ ม.X (cs vs dt แยกเก็บ)
- ✅ Export CSV ตามรูปแบบไฟล์ Excel เดิม
- ✅ Firebase sync (optional)
- ✅ Linkage panel แสดงตัวชี้วัด ↔ หน่วยการเรียน

---

## 📊 5. Progress Tracking

### บันทึกทุกการเรียน
- **อ่านสไลด์** (≥ 0.8 วินาที = นับ)
- **กดวิดีโอ/เกม/บทความ**
- **ทำควิซ** (เก็บ history + best score)
- **เวลาที่เข้า** (สำหรับคำนวณ attendance)

### ไฟล์หลัก
- `src/services/progressService.ts` — localStorage-first + Firebase sync
- Auto-sync ทุก click → ครูเห็นเรียลไทม์

### Storage Strategy
- **Primary**: localStorage (offline-first)
- **Sync**: Firebase Firestore (ถ้ามี VITE_FIREBASE_PROJECT_ID)
- **Limit**: 50 quiz attempts + 100 activity logs ล่าสุด

---

## 🏆 6. Achievements/Badges

### Badges 18 ตัว — 4 tiers
- **Bronze** (ทองแดง) — เริ่มต้น
- **Silver** (เงิน) — ระดับกลาง
- **Gold** (ทอง) — ขั้นสูง
- **Diamond** (เพชร) — มาสเตอร์

### หมวด
- 📖 **Reading** — อ่านสไลด์ (1, 10, 50, 100, 500)
- 🎯 **Quiz** — ทำควิซ (first, perfect, avg 80%, 10x)
- 🎮 **Activity** — กิจกรรม (1, 25, 100)
- 🌟 **Streak/Completion** — จบหน่วย (1, 5, 10, all)
- ⭐ **Special** — pair learner, all-rounder

### ไฟล์หลัก
- `src/services/achievementService.ts` — 18 badges + check logic
- `src/components/AchievementsBadge.tsx` — modal + trophy icon ใน navbar
- Auto-check ทุก 5 วินาที + แจ้งเตือนเมื่อปลดล็อก

---

## 📣 7. Announcements (ประกาศข่าวสาร)

### 4 ประเภท
- ℹ️ Info • ⚠️ Warn • 🚨 Urgent • 🎉 Celebration

### Features
- ✅ Filter ตามห้อง (เฉพาะ ป.5 หรือทุกห้อง)
- 📌 Pin ไว้ด้านบน
- ⏰ Expire date
- 👁️ นักเรียนปิดประกาศได้ (dismiss state)

### ไฟล์หลัก
- `src/services/announcementService.ts`
- `src/components/AnnouncementManager.tsx` — Admin tab
- `src/components/AnnouncementBanner.tsx` — แสดงบน Home + Dashboard

---

## 📅 8. Calendar (ปฏิทินกิจกรรม)

### 5 ประเภท Event
- 📝 การบ้าน • 📋 สอบ • 🎉 กิจกรรม • 🌴 วันหยุด • 👥 ประชุม

### Features
- 📅 วันที่ + เวลา + ห้อง + ลิงก์
- 🔔 Dashboard นักเรียนแสดง 5 events ล่วงหน้า 14 วัน
- ⏰ "วันนี้!" / "พรุ่งนี้" / "อีก X วัน" (สีตามความใกล้)

### ไฟล์หลัก
- `src/services/calendarService.ts`
- `src/components/CalendarManager.tsx` — Admin tab

---

## 🕐 9. Schedule (ตารางสอน)

### Class Slot
- Classroom + Day (0-6) + Start time + End time + Subject

### Features
- 🔴 "กำลังเรียน" ตามเวลาจริง (today slots)
- ⏰ Auto-attendance — กิจกรรมในเวลาเรียน = present
- 🔄 ครูแก้ตารางได้ผ่าน Admin tab

### ไฟล์หลัก
- `src/data/schedule.ts`
- `src/services/adminService.ts` — attendance calculation

---

## 📈 10. Leaderboard

### Ranking Logic
1. คะแนนรวม (totalPoints) — desc
2. กิจกรรม (totalActivities) — desc
3. สไลด์ (totalSlides) — desc

### Features
- 🏆 แสดง Top 10 + filter ตามห้อง
- 🥇🥈🥉 Crown/Medal สำหรับ 3 อันดับ
- 🔄 Auto-refresh ทุก 10 วินาที
- 📊 Mini stats ของแต่ละคน

### ไฟล์หลัก
- `src/services/leaderboardService.ts`
- `src/components/LeaderboardSection.tsx` — แสดงบน Home

---

## 🎨 11. Rich Slides

### Layout Types 5 แบบ
1. **Cover** — ภาพใหญ่ + emoji ใหญ่
2. **Standard** — ข้อความ + bullets + รูปข้าง
3. **Split** — ซ้ายข้อความ / ขวารูป
4. **Comparison** — VS เปรียบเทียบ 2 ฝั่ง
5. **Quote** — คำคมใหญ่

### Features
- 🎨 7 themes สี (blue/green/orange/purple/pink/yellow/red)
- 💡 Callouts (tip/warn/fun/quote)
- 💻 Code blocks (Python, Scratch, Pseudocode)
- 🖼️ รูปจาก Unsplash CDN

### Content
- **85 สไลด์** ใน 17 หน่วย
- AI courses ครบ 3 ระดับ + main curriculum หน่วยสำคัญ

### ไฟล์หลัก
- `src/data/richSlides.ts`
- `src/components/RichSlideViewer.tsx`

---

## 🎮 12. Mini Games (เกมฝึก)

### 9 เกมในเว็บ
| เกม | ฝึก | ระดับ |
|-----|------|------|
| 🖱️ Mouse Practice | ใช้เมาส์ | ป.1-3 |
| ⌨️ Keyboard Practice | พิมพ์ | ป.1-6 |
| 🧩 Algorithm Sorter | คิดเป็นขั้นตอน | ป.4-ม.3 |
| 🔢 Binary Game | เลขฐาน 2 | ม.1-3 |
| 🃏 Memory Match | ความจำ | ป.1-6 |
| 🔍 Pattern Game | Pattern Recognition | ป.3-ม.3 |
| 🤖 **Coding Maze** | เขียนโปรแกรม block-based | ป.2-ม.3 |
| 🐍 **Snake** | Loop + Conditional | ทุกระดับ |
| 🐞 **Bug Catcher** | Debug + Reaction | ทุกระดับ |

### Features
- 🏆 Best score ใน localStorage
- 📊 Live stats + combo system
- 📱 Responsive (touch + keyboard)

### ไฟล์
- `src/pages/games/Games.tsx` — hub
- `src/pages/games/{*}.tsx` — แต่ละเกม

---

## 📚 13. Resources Library

### 107+ Resources จัด 7 หมวด
1. 💻 **Programming** — Scratch, PictoBlox, **Code.org A-F + Express**, Hour of Code themes (Frozen, Star Wars, Dance, Minecraft, Flappy, Sprite Lab, App Lab, Game Lab, CSD, CSP)
2. 🧩 **Computational** — CS Unplugged, Bebras, CodingThailand
3. 📊 **Data** — Canva, Datawrapper, Gapminder
4. 🛡️ **Safety** — Interland, Think Digital, Password Game
5. 🤖 **AI** — Teachable Machine, Quick Draw, AI for Oceans, NN Playground
6. 🎨 **Design** — Tinkercad, Figma, Excalidraw
7. 🖱️ **Basic Skills** — Mouse/Keyboard practice เด็กเล็ก

### แหล่งทางการ (Official Sources)
- **Project 14 สสวท.** (12 ชั้น × video + book)
- **CodingThailand** (ป.1-ม.3)
- **DLTV** (แผนรายชั่วโมง + วิดีโอครูสอน)
- **คลังสื่อ.ไทย** (OBEC)
- **My IPST Basket**

### Auto-award P
ทุกคลิก → บันทึก fun click → คะแนน P อัปเดตตาม targetUnits

### ไฟล์
- `src/data/learningResources.ts`
- `src/pages/Resources.tsx`

---

## 🔍 14. Global Search

### Features
- ⌨️ **Ctrl+K** shortcut (Spotlight style)
- 🎯 ค้นใน: units, indicators, topics, resources, games, articles
- 🏷️ Type tags (สี): หน่วย/ตัวชี้วัด/แหล่งเรียนรู้/เกม
- ⌨️ Keyboard nav (↑↓ Enter Esc)

### ไฟล์
- `src/services/searchService.ts` — fuzzy search + scoring
- `src/components/SearchBar.tsx` — UI (Portal-based)

---

## 🛡️ 15. Admin Dashboard (12 Tabs)

| Tab | ฟังก์ชัน |
|-----|---------|
| 📊 **ภาพรวม** | 6 KPI cards + classroom bars + ตารางสอนวันนี้ |
| 👥 **จัดการนักเรียน** | CRUD roster |
| 📅 **เช็คชื่อตามตาราง** | Auto-attendance per day |
| 📋 **เก็บคะแนน K/P/A** | Grade book ตัวจริง |
| 📣 **ประกาศข่าวสาร** | CRUD announcements |
| 🗓️ **ปฏิทินกิจกรรม** | CRUD events |
| 📊 **สถิตินักเรียนในเว็บ** | Engagement table |
| 📈 **พัฒนาการรายคน** | กราฟ + breakdown รายคน |
| ✏️ **จัดการรายวิชา** | Course Builder (custom courses + import/export JSON) |
| 🕐 **จัดการตารางสอน** | Schedule CRUD |
| 🐛 **Error Log** | ดู error 50 รายการล่าสุด |
| ℹ️ **ข้อมูลเว็บการสอน** | Site info + Firebase status |

### ไฟล์
- `src/pages/AdminDashboard.tsx`
- `src/components/{StudentManager, GradeBook, AnnouncementManager, CalendarManager, CourseBuilder}.tsx`

---

## 🐛 16. Error Tracking

### Features
- เก็บ error 50 รายการล่าสุดใน localStorage
- Global handler — `window.error` + `unhandledrejection`
- Admin tab "Error Log" — ดูได้ครู

### ไฟล์
- `src/services/errorLogger.ts`
- `src/components/ErrorBoundary.tsx` — React error boundary

---

## 🔥 17. Firebase Security

### Firestore Rules (`firestore.rules`)
- 🎓 Students/Progress: นักเรียนเขียนได้แค่ของตัวเอง
- 📋 Grades: อ่านได้ทุกคน เขียนได้แค่ admin
- 📢 Announcements/Calendar: อ่านสาธารณะ แก้ได้แค่ admin
- 🛡️ Default deny

### Deploy
```bash
firebase deploy --only firestore:rules
```

---

## 📐 18. Score Calculation Detail

### per Indicator (มี N ตัวชี้วัด)
```
น้ำหนัก = 70 / N
K = (student.k / ind.maxScore) × weight × 0.60
P = (P_POINTS[student.p] / 3) × weight × 0.25
A = (student.a ? 1 : 0) × weight × 0.15

ตัวอย่าง ป.5 (5 ตัวชี้วัด):
น้ำหนัก/ตัว = 14 → K=8.4, P=3.5, A=2.1
```

### Total
```
รวมจากทุกตัวชี้วัด: K_total + P_total + A_total = 70 (max)
+ สอบกลางภาค (15 สำหรับ ม.) + ปลายภาค (30 ป. / 15 ม.) = 30
= 100 คะแนน
```

### เกรด
| คะแนน | เกรด |
|------|------|
| ≥ 80 | 4 |
| 75-79 | 3.5 |
| 70-74 | 3 |
| 65-69 | 2.5 |
| 60-64 | 2 |
| 55-59 | 1.5 |
| 50-54 | 1 |
| < 50 | 0 |

---

## 🎨 19. UI/UX Design System

### Color Palette
- **Primary**: `#FFD43B → #FAB005` (gradient yellow)
- **Secondary**: `#1D1D1F` (dark text)
- **Accent**: `#6366f1` (indigo for actions)
- **Success/Warn/Error**: green/amber/red standards

### Typography
- **Display**: Outfit (English) + Sarabun (Thai)
- **Body**: Prompt + Sarabun
- **Code**: JetBrains Mono

### Components
- `.btn-primary` — yellow gradient + shadow
- `.btn-secondary` — white + border
- `.card` — soft shadow + hover lift
- `.section-header` — centered with subtitle
- Modal: Portal-based with `z-index: 10000`

### Responsive Breakpoints
- > 1024px: Desktop full
- ≤ 1024px: Drawer menu
- ≤ 900px: Search/Achievements icon-only
- ≤ 768px: Compact navbar
- ≤ 480px: Logo icon-only

---

## 📦 20. Tech Architecture

### Folder Structure
```
src/
├── pages/           # หน้าหลักของเว็บ
│   ├── games/       # 9 mini games
│   └── AdminDashboard.tsx (12 tabs)
├── components/      # UI components ที่ใช้ซ้ำ
├── services/        # Business logic + data CRUD
├── data/            # Static data + content
├── context/         # AuthContext
└── main.tsx         # Entry point
```

### Storage Strategy
**localStorage Keys:**
- `current_student`, `current_partner` — auth
- `krujames_progress_{studentId}` — student progress
- `krujames_grades_v1_{classroom}[_subj]` — K/P/A
- `krujames_roster_overrides_v1` — custom roster
- `krujames_achievements_{studentId}` — badges
- `krujames_announcements_v1`, `krujames_calendar_v1`, `krujames_schedule_v1`
- `krujames_errors_v1` — error log
- `krujames_custom_courses_v1` — Course Builder

### Code Splitting
ทุก page ใช้ `React.lazy()` → first paint เร็ว

### Build
```bash
npm run dev      # development
npm run build    # production
npm run preview  # preview build
```

---

## 🚀 21. Deployment

### Vercel/Netlify
```bash
npm run build
# Upload dist/ folder
```

### Firebase Hosting
```bash
firebase deploy
firebase deploy --only firestore:rules
```

### Environment Variables (.env)
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

ถ้าไม่ตั้ง env → เว็บทำงานได้แบบ localStorage-only

---

## 📞 22. Admin Credentials (สำคัญ!)

```
Username: jameskmd
Password: 12345678kmd
URL: /admin
Session: 8 ชั่วโมง
```

**สำหรับครู** — เก็บเป็นความลับ ไม่ให้นักเรียนรู้

---

## 🎯 23. Roadmap (สิ่งที่ทำต่อได้)

### High Priority
- 🌙 Dark mode toggle
- 📱 PWA (install เป็นแอป + offline)
- 📨 Contact/Feedback form ติดต่อครู
- ❓ FAQ/Help page

### Medium Priority
- 🎯 Goal Setting (เป้านักเรียนรายสัปดาห์)
- 📝 Note Taking ในแต่ละหน่วย
- 👥 Class Forum / Q&A
- 🌐 i18n (English support)
- 🤝 Parent Portal (QR code)

### Technical
- 🧪 Unit tests (Vitest)
- 📊 Real analytics (Plausible)
- 🔒 Stricter Firestore rules
- 🚀 SSR (Next.js migration?)

---

## 📊 24. สถิติระบบ

| รายการ | จำนวน |
|-------|------|
| คอร์สเรียน | **16+** (ป.1-ม.3 + AI 3 ระดับ + custom) |
| หน่วยการเรียน | **70+** หน่วย |
| ตัวชี้วัด | **50+** (ว 4.1 + ว 4.2) |
| สไลด์เนื้อหา | **500+** สไลด์ (JPG + Rich) |
| Rich Slides | **85 สไลด์** ใน 17 หน่วย |
| แบบทดสอบ | **200+ ข้อ** |
| Resources (เครื่องมือ) | **107+** รายการ |
| เกมในเว็บ | **9 เกม** |
| Achievements | **18 badges** |
| รายชื่อนักเรียน 2569 | **115 คน** 9 ห้อง |
| Pages | **17 pages** |
| Components | **20 components** |
| Services | **18 services** |
| Admin tabs | **12 tabs** |

---

## 📝 ผู้พัฒนา

**ครูเจมส์ (Kru James Soncom)**  
โรงเรียนบ้านคลองมดแดง  
สำหรับเรียน วิชาเทคโนโลยี (วิทยาการคำนวณ + การออกแบบเทคโนโลยี)  
ปีการศึกษา 2569

---

*เอกสารนี้สร้างอัตโนมัติจากระบบ — อัปเดตล่าสุด: ปีการศึกษา 2569*
