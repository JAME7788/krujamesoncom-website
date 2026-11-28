// กระดาษคำตอบแบบฝนวงกลม (ใช้ร่วมกันทั้งตอนพิมพ์และตอนสแกน: พิกัดทุกจุดเป็นมิลลิเมตรบนแผ่นเดียวกัน)
//
// แผ่นขนาด 200×140 มม. วางได้ 2 แผ่นบน A4 แนวตั้ง
// - สี่เหลี่ยมดำ 4 มุม: ให้เครื่องสแกนรู้ตำแหน่งและความเอียงของแผ่น
// - แถบรหัสชุดข้อสอบ: วงกลม 14 วงที่พิมพ์ทึบไว้แล้ว (เลขฐานสอง 12 บิต + บิตตรวจ 2 บิต) ใช้แทน QR
//   อ่านได้ด้วยตัวอ่านวงกลมตัวเดียวกัน ไม่ต้องลงไลบรารีเพิ่ม และใช้ได้ทุกเบราว์เซอร์
// - เลขที่นักเรียน 2 หลัก (หลักสิบ หลักหน่วย) และคำตอบสูงสุด 60 ข้อ ข้อละ 4–5 ตัวเลือก

export const SHEET_W = 200;
export const SHEET_H = 140;
export const MARKER_SIZE = 8;
export const BUBBLE_R = 2.2;
export const MAX_QUESTIONS = 60;
export const QUESTIONS_PER_COLUMN = 15;
export const CHOICE_LABELS = ['ก', 'ข', 'ค', 'ง', 'จ'];

export interface Point {
  x: number;
  y: number;
}

/** จุดกึ่งกลางสี่เหลี่ยมมุม เรียง ซ้ายบน ขวาบน ซ้ายล่าง ขวาล่าง */
export const MARKER_CENTERS: [Point, Point, Point, Point] = [
  { x: 8, y: 8 },
  { x: 192, y: 8 },
  { x: 8, y: 132 },
  { x: 192, y: 132 },
];

/* ---------- รหัสชุดข้อสอบ (12 บิต + ตรวจ 2 บิต) ---------- */

export const EXAM_CODE_BITS = 14;
export const MAX_EXAM_CODE = 4095;

export const encodeExamCode = (code: number): boolean[] => {
  if (!Number.isInteger(code) || code < 1 || code > MAX_EXAM_CODE) throw new RangeError('exam code must be 1-4095');
  const bits = Array.from({ length: 12 }, (_, i) => Boolean((code >> (11 - i)) & 1));
  const check = bits.filter(Boolean).length % 4;
  return [...bits, Boolean(check & 2), Boolean(check & 1)];
};

/** คืนรหัส หรือ null ถ้าบิตตรวจไม่ตรง (อ่านพลาด) */
export const decodeExamCode = (bits: boolean[]): number | null => {
  if (bits.length !== EXAM_CODE_BITS) return null;
  const data = bits.slice(0, 12);
  const code = data.reduce((value, bit) => (value << 1) | (bit ? 1 : 0), 0);
  const check = (bits[12] ? 2 : 0) + (bits[13] ? 1 : 0);
  if (code < 1 || data.filter(Boolean).length % 4 !== check) return null;
  return code;
};

export const examCodeBubble = (index: number): Point => ({ x: 117 + index * 5.4, y: 27 });

/* ---------- เลขที่นักเรียน ---------- */

/** column 0 = หลักสิบ, 1 = หลักหน่วย; digit 0–9 เรียงบนลงล่าง */
export const studentNoBubble = (column: 0 | 1, digit: number): Point => ({
  x: 14 + column * 8,
  y: 41 + digit * 9,
});

/* ---------- คำตอบ ---------- */

export const answerBubble = (question: number, choice: number): Point => {
  const column = Math.floor(question / QUESTIONS_PER_COLUMN);
  const row = question % QUESTIONS_PER_COLUMN;
  return { x: 39 + column * 40 + choice * 6.2, y: 41 + row * 6 };
};

export const questionLabelPoint = (question: number): Point => {
  const column = Math.floor(question / QUESTIONS_PER_COLUMN);
  const row = question % QUESTIONS_PER_COLUMN;
  return { x: 35 + column * 40, y: 41 + row * 6 };
};

/* ---------- วาดกระดาษคำตอบเป็น SVG (หน่วย มม.) ---------- */

export interface AnswerSheetOptions {
  title: string;
  classroom: string;
  subjectLabel?: string;
  schoolName?: string;
  examCode: number;
  questionCount: number;
  choiceCount: 4 | 5;
  /** พิมพ์ชื่อและฝนเลขที่ให้ล่วงหน้า (แผ่นรายคน) */
  student?: { no: number; name: string };
}

const esc = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const buildAnswerSheetSvg = (opts: AnswerSheetOptions): string => {
  const parts: string[] = [];
  const font = `font-family="Sarabun, 'TH Sarabun New', sans-serif"`;
  const circle = (p: Point, filled: boolean) =>
    `<circle cx="${p.x}" cy="${p.y}" r="${BUBBLE_R}" fill="${filled ? '#000' : '#fff'}" stroke="#000" stroke-width="0.3"/>`;
  const text = (x: number, y: number, size: number, value: string, extra = '') =>
    `<text x="${x}" y="${y}" font-size="${size}" ${font} ${extra}>${esc(value)}</text>`;

  parts.push(`<rect x="0" y="0" width="${SHEET_W}" height="${SHEET_H}" fill="#fff"/>`);
  MARKER_CENTERS.forEach((c) => parts.push(
    `<rect x="${c.x - MARKER_SIZE / 2}" y="${c.y - MARKER_SIZE / 2}" width="${MARKER_SIZE}" height="${MARKER_SIZE}" fill="#000"/>`,
  ));

  // หัวกระดาษ
  const heading = opts.schoolName ? `${opts.schoolName} • ${opts.title}` : opts.title;
  parts.push(text(16, 9, 4.1, heading.slice(0, 68), 'font-weight="700"'));
  parts.push(text(16, 15, 3.2, `${opts.classroom}${opts.subjectLabel ? ` • ${opts.subjectLabel}` : ''} • ${opts.questionCount} ข้อ`));
  const name = opts.student ? `ชื่อ-สกุล ${opts.student.name}` : 'ชื่อ-สกุล ............................................................';
  const no = opts.student ? `เลขที่ ${opts.student.no}` : 'เลขที่ ..........';
  parts.push(text(16, 22, 3.4, name));
  parts.push(text(84, 22, 3.4, no));
  parts.push(text(117, 18, 2.6, 'ฝนเต็มวงด้วยดินสอ 2B • ห้ามพับ'));
  parts.push(text(117, 22.4, 2.6, `รหัสชุดข้อสอบ ${opts.examCode} (ห้ามฝนแถวนี้)`));
  encodeExamCode(opts.examCode).forEach((bit, i) => parts.push(circle(examCodeBubble(i), bit)));

  // เลขที่ (ตัวเลขกำกับอยู่นอกวง ภายในวงต้องว่างเพื่อให้เครื่องอ่านความเข้มได้แม่น)
  parts.push(text(10.6, 34.5, 2.8, 'เลขที่', 'font-weight="700"'));
  parts.push(text(12.6, 37.8, 2, 'สิบ  หน่วย', 'fill="#555"'));
  for (let digit = 0; digit <= 9; digit += 1) {
    const p = studentNoBubble(0, digit);
    parts.push(text(p.x - 3.4, p.y + 1, 2.4, String(digit), 'text-anchor="end" fill="#555"'));
  }
  ([0, 1] as const).forEach((column) => {
    for (let digit = 0; digit <= 9; digit += 1) {
      const filled = opts.student
        ? (column === 0 ? Math.floor(opts.student.no / 10) : opts.student.no % 10) === digit
        : false;
      parts.push(circle(studentNoBubble(column, digit), filled));
    }
  });

  // คำตอบ
  const columns = Math.ceil(opts.questionCount / QUESTIONS_PER_COLUMN);
  for (let column = 0; column < columns; column += 1) {
    for (let choice = 0; choice < opts.choiceCount; choice += 1) {
      const p = answerBubble(column * QUESTIONS_PER_COLUMN, choice);
      parts.push(text(p.x - 1, 35.5, 2.8, CHOICE_LABELS[choice], 'font-weight="700"'));
    }
  }
  for (let q = 0; q < opts.questionCount; q += 1) {
    const label = questionLabelPoint(q);
    parts.push(text(label.x - 4, label.y + 1.1, 2.8, String(q + 1), 'text-anchor="end" font-weight="700"'));
    for (let choice = 0; choice < opts.choiceCount; choice += 1) {
      parts.push(circle(answerBubble(q, choice), false));
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SHEET_W} ${SHEET_H}" width="${SHEET_W}mm" height="${SHEET_H}mm">${parts.join('')}</svg>`;
};

/** สร้างภาพถ่ายกระดาษคำตอบจำลองบน Canvas (สำหรับปุ่ม "ทดลองสแกนด้วยภาพจำลอง") */
export const renderDemoAnswerSheetCanvas = (opts: {
  title: string;
  classroom: string;
  examCode: number;
  questionCount: number;
  choiceCount: 4 | 5;
  studentNo: number;
  studentName?: string;
  answers: (number | null | number[])[];
  tiltDeg?: number;
}): HTMLCanvasElement => {
  const pxPerMm = 5.5;
  const canvas = document.createElement('canvas');
  canvas.width = 1240;
  canvas.height = 900;
  const ctx = canvas.getContext('2d')!;

  // พื้นโต๊ะไม้สีเทา-น้ำตาลอ่อน
  ctx.fillStyle = '#9e9589';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(((opts.tiltDeg ?? -2.2) * Math.PI) / 180);
  ctx.translate((-SHEET_W * pxPerMm) / 2, (-SHEET_H * pxPerMm) / 2);

  // เงากระดาษ + แผ่นกระดาษขาว
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(8, 10, SHEET_W * pxPerMm, SHEET_H * pxPerMm);
  const paperGrad = ctx.createLinearGradient(0, 0, SHEET_W * pxPerMm, SHEET_H * pxPerMm);
  paperGrad.addColorStop(0, '#fcfbf9');
  paperGrad.addColorStop(1, '#e8e5df');
  ctx.fillStyle = paperGrad;
  ctx.fillRect(0, 0, SHEET_W * pxPerMm, SHEET_H * pxPerMm);

  const sx = (mm: number) => mm * pxPerMm;
  const drawBubble = (p: Point, filled: boolean, pencil = false) => {
    ctx.beginPath();
    ctx.arc(sx(p.x), sx(p.y), sx(BUBBLE_R), 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = '#1f2937';
    ctx.stroke();
    if (filled) {
      ctx.beginPath();
      ctx.arc(sx(p.x), sx(p.y), sx(BUBBLE_R * (pencil ? 0.86 : 0.96)), 0, Math.PI * 2);
      ctx.fillStyle = pencil ? '#262626' : '#050505';
      ctx.fill();
    }
  };

  // สี่เหลี่ยมดำ 4 มุม
  ctx.fillStyle = '#050505';
  MARKER_CENTERS.forEach((c) => {
    ctx.fillRect(sx(c.x - MARKER_SIZE / 2), sx(c.y - MARKER_SIZE / 2), sx(MARKER_SIZE), sx(MARKER_SIZE));
  });

  // หัวกระดาษ
  ctx.fillStyle = '#111827';
  ctx.font = `700 ${Math.round(sx(4.1))}px Sarabun, sans-serif`;
  ctx.fillText(opts.title.slice(0, 56), sx(16), sx(9.2));
  ctx.font = `500 ${Math.round(sx(3.1))}px Sarabun, sans-serif`;
  ctx.fillText(`${opts.classroom} • ${opts.questionCount} ข้อ`, sx(16), sx(15));
  ctx.fillText(`ชื่อ-สกุล ${opts.studentName || 'นักเรียนทดสอบ'}   เลขที่ ${opts.studentNo}`, sx(16), sx(22));
  ctx.font = `500 ${Math.round(sx(2.5))}px Sarabun, sans-serif`;
  ctx.fillText(`รหัสชุดข้อสอบ ${opts.examCode}`, sx(117), sx(22));

  // แถบรหัสชุดข้อสอบ
  encodeExamCode(opts.examCode).forEach((bit, i) => drawBubble(examCodeBubble(i), bit, false));

  // ฝนเลขที่นักเรียน
  ctx.fillStyle = '#374151';
  ctx.font = `700 ${Math.round(sx(2.6))}px Sarabun, sans-serif`;
  ctx.fillText('เลขที่', sx(10.6), sx(34.5));
  for (let d = 0; d <= 9; d += 1) {
    const p = studentNoBubble(0, d);
    ctx.fillText(String(d), sx(p.x - 5.2), sx(p.y + 1));
  }
  ([0, 1] as const).forEach((col) => {
    const targetDigit = col === 0 ? Math.floor(opts.studentNo / 10) : opts.studentNo % 10;
    for (let d = 0; d <= 9; d += 1) {
      drawBubble(studentNoBubble(col, d), d === targetDigit, true);
    }
  });

  // คำตอบ
  const columns = Math.ceil(opts.questionCount / QUESTIONS_PER_COLUMN);
  ctx.fillStyle = '#111827';
  ctx.font = `700 ${Math.round(sx(2.7))}px Sarabun, sans-serif`;
  for (let col = 0; col < columns; col += 1) {
    for (let c = 0; c < opts.choiceCount; c += 1) {
      const p = answerBubble(col * QUESTIONS_PER_COLUMN, c);
      ctx.fillText(CHOICE_LABELS[c], sx(p.x - 1.1), sx(35.5));
    }
  }
  for (let q = 0; q < opts.questionCount; q += 1) {
    const label = questionLabelPoint(q);
    ctx.fillStyle = '#111827';
    ctx.textAlign = 'right';
    ctx.fillText(String(q + 1), sx(label.x - 4), sx(label.y + 1));
    ctx.textAlign = 'left';
    const marked = opts.answers[q];
    const list = marked === null || marked === undefined ? [] : Array.isArray(marked) ? marked : [marked];
    for (let c = 0; c < opts.choiceCount; c += 1) {
      drawBubble(answerBubble(q, c), list.includes(c), true);
    }
  }

  ctx.restore();
  return canvas;
};
