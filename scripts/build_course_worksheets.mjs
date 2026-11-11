// สร้างใบงาน HTML (พิมพ์ได้) ของวิชาเลือก IoT, ฐานข้อมูล และเล่าเรื่องดิจิทัล
// จากข้อมูล worksheet ใน src/data/courses/*Expansion.ts — แก้เนื้อหาที่นั่นแล้วรันใหม่
//   node scripts/build_course_worksheets.mjs
// ผลลัพธ์: public/worksheets/<courseId>/<slug>.html
import { mkdirSync, writeFileSync } from 'node:fs';
import { iotExpansion } from '../src/data/courses/iotExpansion.ts';
import { databaseExpansion } from '../src/data/courses/databaseExpansion.ts';
import { storytellingExpansion } from '../src/data/courses/storytellingExpansion.ts';

const COURSES = [
  { id: 'iot-smart', name: 'IoT และโรงเรียนอัจฉริยะ', accent: '#0f766e', tint: '#ecfeff', data: iotExpansion },
  { id: 'database-basic', name: 'ฐานข้อมูลเบื้องต้น', accent: '#4338ca', tint: '#eef2ff', data: databaseExpansion },
  { id: 'digital-story', name: 'เล่าเรื่องด้วยสื่อดิจิทัล', accent: '#b91c1c', tint: '#fef2f2', data: storytellingExpansion },
];

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const needsDrawing = (q) => /วาด|กรอบ/.test(q);

const page = (course, unitNo, ws) => `<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(ws.title)} — ${esc(course.name)}</title>
  <style>
    :root { color: #172033; font-family: "Sarabun", "Noto Sans Thai", Arial, sans-serif; }
    body { margin: 0; background: #f5f7fb; }
    main { max-width: 960px; margin: 0 auto; padding: 32px 18px 56px; }
    .sheet { background: #fff; border: 1px solid #d8dfeb; border-radius: 10px; padding: 28px; box-shadow: 0 10px 30px rgba(30,41,59,.08); }
    .course { margin: 0 0 6px; font-size: 14px; font-weight: 700; color: ${course.accent}; letter-spacing: .02em; }
    h1 { margin: 0 0 8px; font-size: 26px; line-height: 1.35; }
    h2 { margin: 26px 0 10px; font-size: 18px; color: ${course.accent}; }
    p, li { line-height: 1.7; font-size: 16px; }
    .meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 18px 0; }
    .box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; min-height: 42px; }
    .key { background: ${course.tint}; border-radius: 8px; padding: 6px 16px; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #cbd5e1; padding: 10px; vertical-align: top; font-size: 15px; }
    th { background: ${course.tint}; text-align: left; }
    td.write { min-height: 48px; height: 48px; }
    th.sketch { width: 34%; }
    table:has(th.sketch) td.write { height: 120px; }
    .answer { border-bottom: 1px dotted #94a3b8; height: 34px; }
    .draw { border: 1px dashed #94a3b8; border-radius: 8px; height: 220px; margin-top: 8px; }
    footer { margin-top: 24px; font-size: 13px; color: #64748b; }
    @media (max-width: 640px) { .meta { grid-template-columns: 1fr; } .sheet { padding: 18px; } }
    @media print { body { background: white; } main { padding: 0; } .sheet { box-shadow: none; border: 0; } h2 { break-after: avoid; } table { break-inside: avoid; } }
  </style>
</head>
<body>
<main>
  <section class="sheet">
    <p class="course">วิชาเลือก ${esc(course.name)} ม.1–ม.3 • หน่วยที่ ${unitNo}</p>
    <h1>${esc(ws.title)}</h1>
    <p>เป้าหมาย: ${esc(ws.goal)}</p>
    <div class="meta">
      <div class="box">ชื่อ: ....................................</div>
      <div class="box">ชั้น: ................ เลขที่: ........</div>
      <div class="box">วันที่: ....../....../......</div>
    </div>

    <h2>ความรู้สำคัญ</h2>
    <ul class="key">
${ws.keyPoints.map((k) => `      <li>${esc(k)}</li>`).join('\n')}
    </ul>
${ws.tables.map((t) => `
    <h2>${esc(t.heading)}</h2>
    <div class="table-wrap">
    <table>
      <thead><tr>${t.head.map((h) => (h === 'ภาพร่าง' ? `<th class="sketch">${esc(h)}</th>` : `<th>${esc(h)}</th>`)).join('')}</tr></thead>
      <tbody>
${t.rows.map((r) => `        <tr>${r.map((c) => (c === '' ? '<td class="write"></td>' : `<td>${esc(c)}</td>`)).join('')}</tr>`).join('\n')}
      </tbody>
    </table>
    </div>`).join('\n')}

    <h2>คำถามท้ายงาน</h2>
    <ol>
${ws.questions.map((q) => `      <li>${esc(q)}${needsDrawing(q) ? '<div class="draw"></div>' : '<div class="answer"></div><div class="answer"></div>'}</li>`).join('\n')}
    </ol>
    <footer>ใบงานโดยครูเจมส์ • ข้อมูลตัวอย่างในใบงานเป็นข้อมูลสมมุติ</footer>
  </section>
</main>
</body>
</html>
`;

let count = 0;
for (const course of COURSES) {
  const dir = `public/worksheets/${course.id}`;
  mkdirSync(dir, { recursive: true });
  for (const [no, more] of Object.entries(course.data)) {
    writeFileSync(`${dir}/${more.worksheet.slug}.html`, page(course, no, more.worksheet), 'utf8');
    count += 1;
  }
}
console.log(`worksheets: ${count}`);
