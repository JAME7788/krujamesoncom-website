# -*- coding: utf-8 -*-
"""สร้างชุดข้อมูล CSV สำหรับฝึก pandas (วิชาเลือก Python ม.1–ม.3 หน่วยที่ 8 และวิชาเลือกใหม่)

ข้อมูลนักเรียนทั้งหมดเป็นข้อมูลสมมุติ สุ่มด้วย seed คงที่ รันซ้ำได้ผลเหมือนเดิม
ตารางสอนอ่านจาก src/data/schedule.ts (ตารางจริงของครูเจมส์ ไม่มีข้อมูลนักเรียน)

รัน:  python -X utf8 scripts/build_pandas_datasets.py
ผลลัพธ์: public/datasets/*.csv  (เปิดบนเว็บที่ /datasets/<ชื่อไฟล์>)
"""
import csv
import io
import os
import random
import re
from datetime import datetime, timedelta

OUT = os.path.join('public', 'datasets')
os.makedirs(OUT, exist_ok=True)
rng = random.Random(2569)


def write(name, header, rows, with_header=True):
    path = os.path.join(OUT, name)
    # ไฟล์ที่มีภาษาไทยใส่ BOM (utf-8-sig) ให้ Excel เปิดได้ ไฟล์ภาษาอังกฤษล้วนไม่ใส่ จะได้ไม่มีอักขระแปลกติดคอลัมน์แรก
    text = ''.join(str(c) for r in ([header] if header else []) + rows for c in r)
    enc = 'utf-8' if text.isascii() else 'utf-8-sig'
    with io.open(path, 'w', encoding=enc, newline='') as f:
        w = csv.writer(f)
        if with_header:
            w.writerow(header)
        w.writerows(rows)
    print(f'{name}: {len(rows)} rows')


# 1) studentData.csv — คอลัมน์ตรงกับสไลด์และสมุด Colab: ID, Gender, CsScore, Height
students = []
for i in range(1, 41):
    sid = f'S{i:03d}'
    gender = 'M' if rng.random() < 0.5 else 'F'
    height = round(rng.gauss(158 if gender == 'M' else 154, 7), 1)
    cs = max(0, min(20, round(rng.gauss(13.5, 3.2))))
    students.append([sid, gender, cs, height])
write('studentData.csv', ['ID', 'Gender', 'CsScore', 'Height'], students)
write('studentData-noHeader.csv', None, students, with_header=False)

# 2) sciScore.csv — merge กับ studentData ด้วย ID = เลขประจำตัว (มีบางคนไม่ตรงกัน ใช้ฝึก how='inner'/'left')
sci = []
for sid, _g, cs, _h in students[3:]:  # S001–S003 ไม่มีคะแนนวิทย์
    s1 = max(0, min(20, round(cs * 0.6 + rng.gauss(5, 2.5))))
    s2 = max(0, min(20, round(cs * 0.4 + rng.gauss(7, 3))))
    sci.append([sid, s1, s2])
for extra in ('S041', 'S042'):  # มีในวิทย์แต่ไม่มีในข้อมูลนักเรียน
    sci.append([extra, rng.randint(8, 18), rng.randint(8, 18)])
write('sciScore.csv', ['เลขประจำตัว', 'Science1', 'Science2'], sci)

# 3) timetable-2569.csv — ตารางสอนจริงจาก src/data/schedule.ts รวมคาบว่าง
src = io.open(os.path.join('src', 'data', 'schedule.ts'), encoding='utf-8').read()
periods = re.findall(r"\{ period: (\d), label: '[^']*', start: '([\d:]+)', end: '([\d:]+)' \}", src)
slot_re = re.compile(r"\{ id: '[^']+', classroom: '([^']+)', day: (\d), start: '([\d:]+)', end: '[\d:]+', subject: '([^']+)'(, excludeFromGrading: true)? \}")
slots = {(int(d), st): (room, subj.replace('⭐ ', ''), not ex) for room, d, st, subj, ex in slot_re.findall(src)}
DAYS = {1: ('Mon', 'จันทร์'), 2: ('Tue', 'อังคาร'), 3: ('Wed', 'พุธ'), 4: ('Thu', 'พฤหัสบดี'), 5: ('Fri', 'ศุกร์')}


def category(subject):
    if subject.startswith('เทคโนโลยี') or 'การออกแบบ' in subject:
        return 'เทคโนโลยี'
    if subject.startswith('วิทยาศาสตร์'):
        return 'วิทยาศาสตร์'
    if subject.startswith('ทักษะอาชีพ'):
        return 'ทักษะอาชีพ'
    return 'กิจกรรม'


tt = []
for d, (en, th) in DAYS.items():
    for p, st, en_t in periods:
        room, subj, graded = slots.get((d, st), ('', 'คาบว่าง', False))
        cat = 'ว่าง' if subj == 'คาบว่าง' else category(subj)
        tt.append([en, th, int(p), st, en_t, room, subj, cat, 'yes' if graded else 'no', 50])
assert sum(1 for r in tt if r[6] != 'คาบว่าง') == len(slots), 'จำนวนคาบสอนไม่ตรงกับ schedule.ts'
write('timetable-2569.csv', ['day', 'day_th', 'period', 'start', 'end', 'classroom', 'subject', 'category', 'graded', 'minutes'], tt)

# 4) iot-sensor-log.csv — ห้องคอมพิวเตอร์ 7 วัน ทุก 30 นาที (เชื่อมกับวิชา IoT หน่วยที่ 4–5)
#    มีค่าหาย (เซนเซอร์หลุด) และค่าผิดปกติเล็กน้อย ใช้ฝึก isna(), fillna(), กรองค่า
log = []
t = datetime(2026, 11, 2, 0, 0)
soil = 62.0
for _ in range(7 * 48):
    hour = t.hour + t.minute / 60
    school = t.weekday() < 5 and 8 <= hour < 16
    temp = 27 + 4.5 * max(0, 1 - abs(hour - 14) / 7) + (1.8 if school else 0) + rng.gauss(0, 0.4)
    humid = 72 - (temp - 27) * 3 + rng.gauss(0, 2)
    soil -= 0.35 + rng.random() * 0.2
    pump = 'off'
    if soil < 35:
        soil, pump = 70.0, 'on'
    fan = 'on' if temp > 32 else 'off'
    row = [t.strftime('%Y-%m-%d %H:%M'), round(temp, 1), round(humid, 1), round(soil, 1), fan, pump]
    if rng.random() < 0.02:  # เซนเซอร์หลุด
        row[1] = row[2] = ''
    log.append(row)
    t += timedelta(minutes=30)
write('iot-sensor-log.csv', ['timestamp', 'temp_c', 'humidity', 'soil_pct', 'fan', 'pump'], log)

# 5) library-loans.csv — การยืมหนังสือ 1 ภาคเรียน (เชื่อมกับวิชาฐานข้อมูล)
CATS = ['การ์ตูนความรู้', 'นิยาย', 'วิทยาศาสตร์', 'คอมพิวเตอร์', 'ประวัติศาสตร์']
CLASSES = ['ม.1', 'ม.2', 'ม.3']
loans = []
start = datetime(2026, 5, 18)
for i in range(1, 181):
    day = start + timedelta(days=rng.randint(0, 120))
    while day.weekday() > 4:
        day += timedelta(days=1)
    days_kept = max(1, round(rng.gauss(7, 3)))
    returned = day + timedelta(days=days_kept)
    sid = f'S{rng.randint(1, 40):03d}'
    loans.append([f'L{i:04d}', sid, CLASSES[(int(sid[1:]) - 1) % 3], rng.choices(CATS, weights=[30, 25, 18, 15, 12])[0],
                  day.strftime('%Y-%m-%d'), returned.strftime('%Y-%m-%d') if rng.random() > 0.06 else '', 'yes' if days_kept > 7 else 'no'])
loans.sort(key=lambda r: r[4])
write('library-loans.csv', ['loan_id', 'student_id', 'class', 'category', 'loan_date', 'return_date', 'late'], loans)
