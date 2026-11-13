# ชุดข้อมูลฝึก pandas

ใช้กับวิชาเลือก Python ม.1–ม.3 หน่วยที่ 8 และวิชาเลือก IoT / ฐานข้อมูล
ข้อมูลนักเรียนทุกไฟล์เป็น**ข้อมูลสมมุติ** สร้างด้วย `python -X utf8 scripts/build_pandas_datasets.py`

เมื่อขึ้นเว็บแล้ว อ่านจาก Colab ได้ตรง ๆ เช่น
`pd.read_csv("https://krujamesoncom-website.vercel.app/datasets/studentData.csv")`

| ไฟล์ | แถว | คอลัมน์ | ใช้ฝึก |
|---|---|---|---|
| `studentData.csv` | 40 | ID, Gender (M/F), CsScore (0–20), Height (ซม.) | `mean`, `groupby`, `sort_values` ตามสไลด์หน่วยที่ 8 |
| `studentData-noHeader.csv` | 40 | ไม่มีหัวตาราง | `read_csv(..., names=['ID','Gender','CsScore','Height'])` |
| `sciScore.csv` | 39 | เลขประจำตัว, Science1, Science2 | `merge` กับ studentData (ตรงกัน 37 คน มีคนตกหล่นทั้งสองฝั่ง) |
| `timetable-2569.csv` | 35 | day, day_th, period, start, end, classroom, subject, category, graded, minutes | ตารางสอนจริงของครู รวมคาบว่าง: นับคาบ, `value_counts`, `pivot_table` |
| `iot-sensor-log.csv` | 336 | timestamp, temp_c, humidity, soil_pct, fan, pump | ข้อมูลเซนเซอร์ 7 วันทุก 30 นาที มีค่าหาย 6 แถว: `isna`, `dropna`, `to_datetime`, `resample` |
| `library-loans.csv` | 180 | loan_id, student_id, class, category, loan_date, return_date, late | การยืมหนังสือ 1 ภาคเรียน มีหนังสือยังไม่คืน 12 เล่ม: กรอง, นับ, เชื่อมกับ studentData |

## โจทย์ตัวอย่าง (ง่าย → ยาก)

```python
import pandas as pd

std = pd.read_csv("studentData.csv")
sci = pd.read_csv("sciScore.csv")
tt = pd.read_csv("timetable-2569.csv")
iot = pd.read_csv("iot-sensor-log.csv", parse_dates=["timestamp"])
lib = pd.read_csv("library-loans.csv")

# 1. คะแนนวิทยาการคำนวณเฉลี่ย แยกตามเพศ
std.groupby("Gender").CsScore.mean()

# 2. นักเรียน 5 คนที่สูงที่สุด
std.sort_values("Height", ascending=False).head(5)

# 3. รวมคะแนนสองวิชา แล้วดูว่าใครหายไปจากการ merge
both = std.merge(sci, left_on="ID", right_on="เลขประจำตัว", how="inner")
missing = std[~std.ID.isin(sci["เลขประจำตัว"])]

# 4. ครูสอนวันไหนมากที่สุด และว่างกี่คาบต่อสัปดาห์
tt[tt.category != "ว่าง"].day_th.value_counts()
(tt.category == "ว่าง").sum()

# 5. ตารางสรุปจำนวนคาบ แยกวันกับประเภทวิชา
tt.pivot_table(index="day_th", columns="category", values="period", aggfunc="count", fill_value=0)

# 6. อุณหภูมิเฉลี่ยรายวันของห้องคอมพิวเตอร์ (ข้ามค่าที่หาย)
iot.set_index("timestamp").temp_c.resample("D").mean()

# 7. ช่วงเวลาที่พัดลมเปิด และค่าที่เซนเซอร์หลุด
iot[iot.fan == "on"].timestamp.dt.hour.value_counts().sort_index()
iot[iot.temp_c.isna()]

# 8. หนังสือประเภทใดถูกยืมมากที่สุด และใครยังไม่คืน
lib.category.value_counts()
lib[lib.return_date.isna()].merge(std, left_on="student_id", right_on="ID")
```
