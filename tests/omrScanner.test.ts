import { describe, expect, it } from 'vitest';
import {
  BUBBLE_R,
  MARKER_CENTERS,
  MARKER_SIZE,
  SHEET_H,
  SHEET_W,
  answerBubble,
  buildAnswerSheetSvg,
  decodeExamCode,
  encodeExamCode,
  examCodeBubble,
  studentNoBubble,
  type Point,
} from '../src/utils/answerSheet';
import {
  applyHomography,
  decideMark,
  scanAnswerSheets,
  solveHomography,
  type GrayImage,
  type Homography,
} from '../src/utils/omrScanner';

/* ---------- ตัววาดภาพจำลอง: วาดกระดาษคำตอบลงภาพเทาด้วยมุมมองเอียงได้ ---------- */

type Shape =
  | { kind: 'rect'; x: number; y: number; w: number; h: number; gray: number }
  | { kind: 'disk'; c: Point; r: number; gray: number }
  | { kind: 'ring'; c: Point; r: number; t: number; gray: number };

interface FakeSheet {
  examCode: number;
  questionCount: number;
  choiceCount: number;
  studentNo: number | null;
  answers: (number | null | number[])[];
  /** มุมแผ่น (ซ้ายบน ขวาบน ขวาล่าง ซ้ายล่าง) ในภาพ */
  corners: Point[];
  missingMarker?: number;
}

const sheetShapes = (s: FakeSheet): Shape[] => {
  const shapes: Shape[] = [];
  MARKER_CENTERS.forEach((c, i) => {
    if (i !== s.missingMarker) shapes.push({ kind: 'rect', x: c.x - MARKER_SIZE / 2, y: c.y - MARKER_SIZE / 2, w: MARKER_SIZE, h: MARKER_SIZE, gray: 25 });
  });
  // ตัวหนังสือหัวกระดาษจำลอง (ขีดเข้ม ๆ) กันไม่ให้ไปสับสนกับสี่เหลี่ยมมุม
  for (let i = 0; i < 18; i += 1) shapes.push({ kind: 'rect', x: 16 + i * 3.4, y: 6, w: 2.2, h: 3.4, gray: 30 });
  shapes.push({ kind: 'rect', x: 16, y: 20, w: 60, h: 0.4, gray: 60 });
  encodeExamCode(s.examCode).forEach((bit, i) => {
    shapes.push({ kind: 'ring', c: examCodeBubble(i), r: BUBBLE_R, t: 0.3, gray: 40 });
    if (bit) shapes.push({ kind: 'disk', c: examCodeBubble(i), r: BUBBLE_R, gray: 25 });
  });
  ([0, 1] as const).forEach((col) => {
    for (let d = 0; d < 10; d += 1) {
      shapes.push({ kind: 'ring', c: studentNoBubble(col, d), r: BUBBLE_R, t: 0.3, gray: 40 });
    }
    if (s.studentNo !== null) {
      const digit = col === 0 ? Math.floor(s.studentNo / 10) : s.studentNo % 10;
      shapes.push({ kind: 'disk', c: studentNoBubble(col, digit), r: BUBBLE_R * 0.9, gray: 70 });
    }
  });
  for (let q = 0; q < s.questionCount; q += 1) {
    for (let c = 0; c < s.choiceCount; c += 1) shapes.push({ kind: 'ring', c: answerBubble(q, c), r: BUBBLE_R, t: 0.3, gray: 40 });
    const marked = s.answers[q];
    const list = marked === null || marked === undefined ? [] : Array.isArray(marked) ? marked : [marked];
    // ดินสอฝนไม่เต็มวงพอดี: รัศมี 85% และสีเทาเข้ม (ไม่ดำสนิท)
    list.forEach((c) => shapes.push({ kind: 'disk', c: answerBubble(q, c), r: BUBBLE_R * 0.85, gray: 75 }));
  }
  return shapes;
};

const render = (width: number, height: number, sheets: FakeSheet[], opts: { noise?: number; gradient?: number; seed?: number } = {}): GrayImage => {
  let seed = opts.seed ?? 7;
  const rand = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const data = new Uint8Array(width * height);
  // พื้นโต๊ะสีกลาง ๆ + แสงไม่เท่ากัน
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) data[y * width + x] = 150;
  }
  const sheetSrc = [MARKER_CENTERS[0], MARKER_CENTERS[1], MARKER_CENTERS[3], MARKER_CENTERS[2]];
  for (const sheet of sheets) {
    const toImg = solveHomography(sheetSrc, sheet.corners) as Homography;
    const toSheet = solveHomography(sheet.corners, sheetSrc) as Homography;
    // กระดาษขาว (ขอบนอกเล็กน้อยรอบกรอบสี่เหลี่ยมมุม)
    const paper: Shape = { kind: 'rect', x: 0, y: 0, w: SHEET_W, h: SHEET_H, gray: 238 };
    for (const shape of [paper, ...sheetShapes(sheet)]) {
      const box = shape.kind === 'rect'
        ? [{ x: shape.x, y: shape.y }, { x: shape.x + shape.w, y: shape.y }, { x: shape.x, y: shape.y + shape.h }, { x: shape.x + shape.w, y: shape.y + shape.h }]
        : [-1, 1].flatMap((sx) => [-1, 1].map((sy) => ({ x: shape.c.x + sx * (shape.r + 0.5), y: shape.c.y + sy * (shape.r + 0.5) })));
      const pts = box.map((p) => applyHomography(toImg, p));
      const x0 = Math.max(0, Math.floor(Math.min(...pts.map((p) => p.x))));
      const x1 = Math.min(width - 1, Math.ceil(Math.max(...pts.map((p) => p.x))));
      const y0 = Math.max(0, Math.floor(Math.min(...pts.map((p) => p.y))));
      const y1 = Math.min(height - 1, Math.ceil(Math.max(...pts.map((p) => p.y))));
      for (let y = y0; y <= y1; y += 1) {
        for (let x = x0; x <= x1; x += 1) {
          const p = applyHomography(toSheet, { x: x + 0.5, y: y + 0.5 });
          let inside = false;
          if (shape.kind === 'rect') inside = p.x >= shape.x && p.x <= shape.x + shape.w && p.y >= shape.y && p.y <= shape.y + shape.h;
          else {
            const d = Math.hypot(p.x - shape.c.x, p.y - shape.c.y);
            inside = shape.kind === 'disk' ? d <= shape.r : Math.abs(d - shape.r) <= shape.t / 2;
          }
          if (!inside) continue;
          const idx = y * width + x;
          data[idx] = shape === paper ? shape.gray : Math.min(data[idx], shape.gray);
        }
      }
    }
  }
  const noise = opts.noise ?? 0;
  const gradient = opts.gradient ?? 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = y * width + x;
      const shade = gradient * (x / width) + (rand() - 0.5) * noise;
      data[idx] = Math.max(0, Math.min(255, Math.round(data[idx] - shade)));
    }
  }
  return { width, height, data };
};

const answersFor = (count: number, choices: number) => Array.from({ length: count }, (_, q) => (q * 7 + 3) % choices);
const opts40 = { questionCount: 40, choiceCount: 4 };
const resolve = (code: number | null) => (code === 1234 ? opts40 : code === 777 ? { questionCount: 20, choiceCount: 5 } : null);

describe('รหัสชุดข้อสอบแบบวงกลม (แทน QR)', () => {
  it('เข้ารหัสแล้วถอดกลับได้ และจับบิตที่อ่านพลาด', () => {
    for (const code of [1, 77, 1234, 4095]) expect(decodeExamCode(encodeExamCode(code))).toBe(code);
    const bits = encodeExamCode(1234);
    bits[3] = !bits[3];
    expect(decodeExamCode(bits)).toBeNull();
    expect(() => encodeExamCode(0)).toThrow();
  });

  it('สร้าง SVG กระดาษคำตอบได้ ไม่มีตัวอักษรอยู่ในวงคำตอบ', () => {
    const svg = buildAnswerSheetSvg({ title: 'สอบกลางภาค <ม.2>', classroom: 'ม.2', examCode: 1234, questionCount: 40, choiceCount: 4 });
    expect(svg).toContain('width="200mm"');
    expect(svg).toContain('&lt;ม.2&gt;');
    expect((svg.match(/<circle/g) || []).length).toBe(14 + 20 + 160);
  });
});

describe('ตัดสินการฝนรายข้อ', () => {
  it('ฝนชัด / ว่าง / ฝนเกิน / ไม่ชัด', () => {
    expect(decideMark([0.05, 0.8, 0.1, 0.02])).toEqual({ choice: 1, status: 'ok' });
    expect(decideMark([0.05, 0.08, 0.1, 0.02])).toEqual({ choice: null, status: 'blank' });
    expect(decideMark([0.7, 0.75, 0.1, 0.02])).toEqual({ choice: null, status: 'multi' });
    expect(decideMark([0.05, 0.33, 0.1, 0.02])).toEqual({ choice: null, status: 'unclear' });
    // ลบแล้วเหลือรอยจาง ๆ ไม่ถือว่าฝนเกิน
    expect(decideMark([0.3, 0.82, 0.1, 0.02])).toEqual({ choice: 1, status: 'ok' });
  });
});

describe('อ่านกระดาษคำตอบจากภาพจำลอง', () => {
  it('ภาพตรง: อ่านรหัสชุด เลขที่ และคำตอบ 40 ข้อได้ครบ', () => {
    const answers = answersFor(40, 4);
    const img = render(1000, 760, [{ examCode: 1234, questionCount: 40, choiceCount: 4, studentNo: 23, answers,
      corners: [{ x: 80, y: 70 }, { x: 920, y: 70 }, { x: 920, y: 640 }, { x: 80, y: 640 }] }]);
    const result = scanAnswerSheets(img, resolve, opts40);
    expect(result.error).toBeNull();
    const sheet = result.sheets[0];
    expect(sheet.examCode).toBe(1234);
    expect(sheet.studentNo).toBe(23);
    expect(sheet.answers).toEqual(answers);
    expect(sheet.issues).toEqual([]);
  });

  it('ถ่ายเอียง มุมมองบิด แสงไม่เท่ากัน และมีสัญญาณรบกวน', () => {
    const answers = answersFor(40, 4);
    const img = render(1100, 900, [{ examCode: 1234, questionCount: 40, choiceCount: 4, studentNo: 7, answers,
      corners: [{ x: 160, y: 110 }, { x: 960, y: 60 }, { x: 1010, y: 690 }, { x: 120, y: 660 }] }], { noise: 30, gradient: 45 });
    const sheet = scanAnswerSheets(img, resolve, opts40).sheets[0];
    expect(sheet.examCode).toBe(1234);
    expect(sheet.studentNo).toBe(7);
    expect(sheet.answers).toEqual(answers);
  });

  it('ถ่ายกลับหัว 180 องศาก็อ่านได้', () => {
    const answers = answersFor(40, 4);
    // มุมแผ่นซ้ายบนไปอยู่ขวาล่างของภาพ
    const img = render(1000, 760, [{ examCode: 1234, questionCount: 40, choiceCount: 4, studentNo: 41, answers,
      corners: [{ x: 920, y: 640 }, { x: 80, y: 640 }, { x: 80, y: 70 }, { x: 920, y: 70 }] }]);
    const sheet = scanAnswerSheets(img, resolve, opts40).sheets[0];
    expect(sheet.examCode).toBe(1234);
    expect(sheet.studentNo).toBe(41);
    expect(sheet.answers).toEqual(answers);
  });

  it('A4 แผ่นเดียวมี 2 คน: อ่านได้ทั้งสองแผ่น และใช้จำนวนข้อตามรหัสชุดของแต่ละแผ่น', () => {
    const a = answersFor(40, 4);
    const b = Array.from({ length: 20 }, (_, q) => (q * 3 + 1) % 5);
    const img = render(900, 1250, [
      { examCode: 1234, questionCount: 40, choiceCount: 4, studentNo: 12, answers: a,
        corners: [{ x: 60, y: 60 }, { x: 840, y: 60 }, { x: 840, y: 590 }, { x: 60, y: 590 }] },
      { examCode: 777, questionCount: 20, choiceCount: 5, studentNo: 35, answers: b,
        corners: [{ x: 60, y: 660 }, { x: 840, y: 660 }, { x: 840, y: 1190 }, { x: 60, y: 1190 }] },
    ]);
    const result = scanAnswerSheets(img, resolve, opts40);
    expect(result.sheets).toHaveLength(2);
    expect(result.sheets[0]).toMatchObject({ examCode: 1234, studentNo: 12, answers: a });
    expect(result.sheets[1]).toMatchObject({ examCode: 777, studentNo: 35, answers: b });
  });

  it('จับข้อที่เว้นว่างและฝนเกิน และแจ้งให้ครูตรวจ', () => {
    const answers: (number | null | number[])[] = answersFor(40, 4);
    answers[4] = null;
    answers[9] = [0, 2];
    const img = render(1000, 760, [{ examCode: 1234, questionCount: 40, choiceCount: 4, studentNo: 5, answers,
      corners: [{ x: 80, y: 70 }, { x: 920, y: 70 }, { x: 920, y: 640 }, { x: 80, y: 640 }] }]);
    const sheet = scanAnswerSheets(img, resolve, opts40).sheets[0];
    expect(sheet.statuses[4]).toBe('blank');
    expect(sheet.statuses[9]).toBe('multi');
    expect(sheet.answers[9]).toBeNull();
    expect(sheet.issues.some((issue) => issue.includes('1 ข้อ'))).toBe(true);
  });

  it('มุมดำหายไปหนึ่งมุม: แจ้งให้ถ่ายใหม่ ไม่เดาคะแนน', () => {
    const img = render(1000, 760, [{ examCode: 1234, questionCount: 40, choiceCount: 4, studentNo: 5, answers: answersFor(40, 4),
      corners: [{ x: 80, y: 70 }, { x: 920, y: 70 }, { x: 920, y: 640 }, { x: 80, y: 640 }], missingMarker: 3 }]);
    const result = scanAnswerSheets(img, resolve, opts40);
    expect(result.sheets).toEqual([]);
    expect(result.error).toContain('มุม');
  });

  it('เงาพาดครึ่งแผ่นแรง (gradient 115): Adaptive Threshold + Local White อ่านได้แม่น 100%', () => {
    const answers = answersFor(40, 4);
    const img = render(1100, 820, [{ examCode: 1234, questionCount: 40, choiceCount: 4, studentNo: 18, answers,
      corners: [{ x: 110, y: 80 }, { x: 990, y: 70 }, { x: 1010, y: 710 }, { x: 95, y: 695 }] }], { noise: 20, gradient: 115 });
    const result = scanAnswerSheets(img, resolve, opts40);
    expect(result.error).toBeNull();
    expect(result.sheets[0].examCode).toBe(1234);
    expect(result.sheets[0].studentNo).toBe(18);
    expect(result.sheets[0].answers).toEqual(answers);
  });

  it('รองรับชุดข้อสอบมาตรฐานทั้ง 10 / 20 / 30 / 40 ข้อ', () => {
    for (const count of [10, 20, 30, 40]) {
      const code = 500 + count;
      const answers = answersFor(count, 4);
      const img = render(1000, 760, [{
        examCode: code,
        questionCount: count,
        choiceCount: 4,
        studentNo: count - 1,
        answers,
        corners: [{ x: 80, y: 70 }, { x: 920, y: 70 }, { x: 920, y: 640 }, { x: 80, y: 640 }],
      }]);
      const result = scanAnswerSheets(img, (c) => (c === code ? { questionCount: count, choiceCount: 4 } : null), { questionCount: count, choiceCount: 4 });
      expect(result.error).toBeNull();
      expect(result.sheets[0].examCode).toBe(code);
      expect(result.sheets[0].studentNo).toBe(count - 1);
      expect(result.sheets[0].answers).toEqual(answers);
    }
  });
});
