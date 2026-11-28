// อ่านกระดาษคำตอบจากภาพถ่าย (ทำงานในเบราว์เซอร์ล้วน ไม่ส่งภาพออกนอกเครื่อง)
// ขั้นตอน: ภาพเทา → หาสี่เหลี่ยมดำ 4 มุม → คำนวณการแปลงมุมมอง (homography)
//        → วัดความเข้มในแต่ละวง → ตัดสินว่าฝนตัวเลือกไหน → ถอดรหัสชุดข้อสอบ
import {
  EXAM_CODE_BITS,
  MARKER_CENTERS,
  MARKER_SIZE,
  BUBBLE_R,
  answerBubble,
  decodeExamCode,
  examCodeBubble,
  studentNoBubble,
  type Point,
} from './answerSheet';

export interface GrayImage {
  width: number;
  height: number;
  data: Uint8Array | Uint8ClampedArray;
}

export const rgbaToGray = (rgba: Uint8ClampedArray, width: number, height: number): GrayImage => {
  const data = new Uint8Array(width * height);
  for (let i = 0, j = 0; i < data.length; i += 1, j += 4) {
    data[i] = (rgba[j] * 77 + rgba[j + 1] * 150 + rgba[j + 2] * 29) >> 8;
  }
  return { width, height, data };
};

/** ค่าแบ่งดำ/ขาวอัตโนมัติ (Otsu) */
export const otsuThreshold = (img: GrayImage): number => {
  const hist = new Array<number>(256).fill(0);
  for (let i = 0; i < img.data.length; i += 1) hist[img.data[i]] += 1;
  const total = img.data.length;
  let sum = 0;
  for (let t = 0; t < 256; t += 1) sum += t * hist[t];
  let sumB = 0;
  let weightB = 0;
  let best = 0;
  let threshold = 127;
  for (let t = 0; t < 256; t += 1) {
    weightB += hist[t];
    if (!weightB) continue;
    const weightF = total - weightB;
    if (!weightF) break;
    sumB += t * hist[t];
    const meanB = sumB / weightB;
    const meanF = (sum - sumB) / weightF;
    const between = weightB * weightF * (meanB - meanF) ** 2;
    if (between > best) {
      best = between;
      threshold = t;
    }
  }
  return threshold;
};

export interface Blob {
  area: number;
  cx: number;
  cy: number;
  /** พื้นที่ ÷ (ระยะไกลสุดจากจุดศูนย์กลาง)² : สี่เหลี่ยม ≈ 2, วงกลม ≈ 3.14, เส้นบาง ≈ < 1 */
  squareness: number;
}

/** หาก้อนสีเข้มจากไบนารีมาสก์ (4 ทิศ) */
const findBlobsFromBinary = (
  width: number,
  height: number,
  isDark: Uint8Array,
  minArea: number,
  maxArea: number,
): Blob[] => {
  const seen = new Uint8Array(width * height);
  const stack = new Int32Array(width * height);
  const pixels = new Int32Array(width * height);
  const blobs: Blob[] = [];
  for (let start = 0; start < isDark.length; start += 1) {
    if (seen[start] || !isDark[start]) continue;
    let top = 0;
    let count = 0;
    let sumX = 0;
    let sumY = 0;
    stack[top++] = start;
    seen[start] = 1;
    while (top > 0) {
      const idx = stack[--top];
      pixels[count++] = idx;
      const x = idx % width;
      const y = (idx - x) / width;
      sumX += x;
      sumY += y;
      if (x > 0 && !seen[idx - 1] && isDark[idx - 1]) { seen[idx - 1] = 1; stack[top++] = idx - 1; }
      if (x < width - 1 && !seen[idx + 1] && isDark[idx + 1]) { seen[idx + 1] = 1; stack[top++] = idx + 1; }
      if (y > 0 && !seen[idx - width] && isDark[idx - width]) { seen[idx - width] = 1; stack[top++] = idx - width; }
      if (y < height - 1 && !seen[idx + width] && isDark[idx + width]) { seen[idx + width] = 1; stack[top++] = idx + width; }
    }
    if (count < minArea || count > maxArea) continue;
    const cx = sumX / count;
    const cy = sumY / count;
    let maxD2 = 0;
    for (let k = 0; k < count; k += 1) {
      const x = pixels[k] % width;
      const y = (pixels[k] - x) / width;
      const d2 = (x - cx) ** 2 + (y - cy) ** 2;
      if (d2 > maxD2) maxD2 = d2;
    }
    blobs.push({ area: count, cx, cy, squareness: maxD2 > 0 ? count / maxD2 : 0 });
  }
  return blobs;
};

/** หาก้อนสีเข้มที่ติดกัน (4 ทิศ) แล้วคืนเฉพาะก้อนที่ขนาดอยู่ในช่วง */
export const findDarkBlobs = (img: GrayImage, threshold: number, minArea: number, maxArea: number): Blob[] => {
  const { width, height, data } = img;
  const mask = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i += 1) {
    if (data[i] < threshold) mask[i] = 1;
  }
  return findBlobsFromBinary(width, height, mask, minArea, maxArea);
};

/** หาก้อนสีเข้มแบบ Adaptive Threshold (Integral Image) ช่วยอ่านแม่นแม้มีเงาพาดหรือแสงไม่สม่ำเสมอ */
export const findAdaptiveDarkBlobs = (img: GrayImage, minArea: number, maxArea: number, offset = 24): Blob[] => {
  const { width, height, data } = img;
  const stride = width + 1;
  const integral = new Float64Array(stride * (height + 1));
  for (let y = 0; y < height; y += 1) {
    let rowSum = 0;
    const rowOff = y * width;
    const intRow = (y + 1) * stride;
    const prevIntRow = y * stride;
    for (let x = 0; x < width; x += 1) {
      rowSum += data[rowOff + x];
      integral[intRow + x + 1] = integral[prevIntRow + x + 1] + rowSum;
    }
  }
  const radius = Math.max(12, Math.round(Math.min(width, height) * 0.035));
  const mask = new Uint8Array(width * height);
  for (let y = 0; y < height; y += 1) {
    const y0 = Math.max(0, y - radius);
    const y1 = Math.min(height - 1, y + radius);
    const r0 = y0 * stride;
    const r1 = (y1 + 1) * stride;
    for (let x = 0; x < width; x += 1) {
      const x0 = Math.max(0, x - radius);
      const x1 = Math.min(width - 1, x + radius);
      const area = (x1 - x0 + 1) * (y1 - y0 + 1);
      const sum = integral[r1 + x1 + 1] - integral[r0 + x1 + 1] - integral[r1 + x0] + integral[r0 + x0];
      const localMean = sum / area;
      const val = data[y * width + x];
      if (val < localMean - offset && val < 195) {
        mask[y * width + x] = 1;
      }
    }
  }
  return findBlobsFromBinary(width, height, mask, minArea, maxArea);
};

/* ---------- homography (แปลงพิกัดแผ่น มม. → พิกัดภาพ) ---------- */

export type Homography = number[];

export const solveHomography = (src: Point[], dst: Point[]): Homography | null => {
  const a: number[][] = [];
  const b: number[] = [];
  for (let i = 0; i < 4; i += 1) {
    const { x, y } = src[i];
    const { x: u, y: v } = dst[i];
    a.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    b.push(u);
    a.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    b.push(v);
  }
  // Gaussian elimination พร้อมเลือก pivot
  for (let col = 0; col < 8; col += 1) {
    let pivot = col;
    for (let row = col + 1; row < 8; row += 1) if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row;
    if (Math.abs(a[pivot][col]) < 1e-12) return null;
    [a[col], a[pivot]] = [a[pivot], a[col]];
    [b[col], b[pivot]] = [b[pivot], b[col]];
    for (let row = 0; row < 8; row += 1) {
      if (row === col) continue;
      const f = a[row][col] / a[col][col];
      for (let k = col; k < 8; k += 1) a[row][k] -= f * a[col][k];
      b[row] -= f * b[col];
    }
  }
  return [...b.map((value, i) => value / a[i][i]), 1];
};

export const applyHomography = (h: Homography, p: Point): Point => {
  const w = h[6] * p.x + h[7] * p.y + h[8];
  return { x: (h[0] * p.x + h[1] * p.y + h[2]) / w, y: (h[3] * p.x + h[4] * p.y + h[5]) / w };
};

/* ---------- เลือกสี่เหลี่ยมมุม ---------- */

const MARKER_SQUARENESS: [number, number] = [1.55, 2.55];

/** แปลงจุด 4 จุดเป็นลำดับตามเข็มนาฬิกา ซ้ายบน ขวาบน ขวาล่าง ซ้ายล่าง */
const clockwiseCorners = (points: Point[]): Point[] | null => {
  const tl = points.reduce((a, b) => (b.x + b.y < a.x + a.y ? b : a));
  const br = points.reduce((a, b) => (b.x + b.y > a.x + a.y ? b : a));
  const tr = points.reduce((a, b) => (b.x - b.y > a.x - a.y ? b : a));
  const bl = points.reduce((a, b) => (b.x - b.y < a.x - a.y ? b : a));
  if (new Set([tl, tr, br, bl]).size !== 4) return null;
  return [tl, tr, br, bl];
};

/** หากลุ่มสี่เหลี่ยมมุมของกระดาษ 1 หรือ 2 แผ่นในภาพเดียว (เช่น ถ่าย A4 ที่ยังไม่ตัด) */
export const findSheetCornerGroups = (blobs: Blob[]): Point[][] => {
  const candidates = blobs
    .filter((b) => b.squareness >= MARKER_SQUARENESS[0] && b.squareness <= MARKER_SQUARENESS[1])
    .sort((a, b) => b.area - a.area);
  if (candidates.length < 4) return [];
  const largest = candidates[0].area;
  const similar = candidates.filter((b) => b.area >= largest * 0.35);
  const take = similar.length >= 8 ? 8 : 4;
  if (similar.length < 4) return [];
  const chosen = similar.slice(0, take).map((b) => ({ x: b.cx, y: b.cy }));
  const groups = take === 8
    ? [chosen.slice().sort((a, b) => a.y - b.y).slice(0, 4), chosen.slice().sort((a, b) => a.y - b.y).slice(4)]
    : [chosen];
  return groups
    .map((group) => clockwiseCorners(group))
    .filter((group): group is Point[] => group !== null)
    .sort((a, b) => a[0].y - b[0].y);
};

/* ---------- อ่านค่าในวง ---------- */

const SAMPLE_OFFSETS: Point[] = (() => {
  const out: Point[] = [{ x: 0, y: 0 }];
  for (const ring of [0.45, 0.9]) {
    for (let k = 0; k < 8; k += 1) {
      const angle = (k / 8) * Math.PI * 2;
      out.push({ x: Math.cos(angle) * ring, y: Math.sin(angle) * ring });
    }
  }
  return out;
})();

const sampleMean = (img: GrayImage, h: Homography, center: Point, radiusMm: number): number => {
  let sum = 0;
  let n = 0;
  for (const o of SAMPLE_OFFSETS) {
    const p = applyHomography(h, { x: center.x + o.x * radiusMm, y: center.y + o.y * radiusMm });
    const x = Math.round(p.x);
    const y = Math.round(p.y);
    if (x < 0 || y < 0 || x >= img.width || y >= img.height) continue;
    sum += img.data[y * img.width + x];
    n += 1;
  }
  return n ? sum / n : 255;
};

export type MarkStatus = 'ok' | 'blank' | 'multi' | 'unclear';

export interface MarkDecision {
  choice: number | null;
  status: MarkStatus;
}

const FILLED = 0.42;
const UNCLEAR = 0.24;

/** ตัดสินจากความเข้ม (0 = ขาว, 1 = ดำเท่าสี่เหลี่ยมมุม) ของตัวเลือกทั้งหมดในข้อเดียว */
export const decideMark = (darkness: number[]): MarkDecision => {
  const order = darkness.map((d, i) => ({ d, i })).sort((a, b) => b.d - a.d);
  const [first, second] = order;
  if (!first || first.d < UNCLEAR) return { choice: null, status: 'blank' };
  if (first.d < FILLED) return { choice: null, status: 'unclear' };
  if (second && second.d >= FILLED && first.d - second.d < 0.25) return { choice: null, status: 'multi' };
  return { choice: first.i, status: 'ok' };
};

export interface BubbleOverlay {
  kind: 'answer' | 'student' | 'code';
  index: number;
  choice: number;
  x: number;
  y: number;
  r: number;
}

export interface SheetReading {
  examCode: number | null;
  studentNo: number | null;
  studentNoStatus: MarkStatus;
  answers: (number | null)[];
  statuses: MarkStatus[];
  darkness: number[][];
  /** พิกเซลต่อมิลลิเมตร (ภาพเล็กเกินไป = ถ่ายไกลหรือไม่ชัด) */
  pixelsPerMm: number;
  corners: Point[];
  bubbles: BubbleOverlay[];
  issues: string[];
}

export interface ReadOptions {
  questionCount: number;
  choiceCount: number;
}

/** ลำดับมุมแผ่นตามเข็มนาฬิกา (index ใน MARKER_CENTERS) */
const SHEET_CLOCKWISE = [0, 1, 3, 2];

const readWithCorners = (img: GrayImage, imageCorners: Point[], rotation: number, opts: ReadOptions): SheetReading | null => {
  const src = SHEET_CLOCKWISE.map((i) => MARKER_CENTERS[i]);
  const dst = SHEET_CLOCKWISE.map((_, i) => imageCorners[(i + rotation) % 4]);
  const h = solveHomography(src, dst);
  if (!h) return null;
  const p0 = applyHomography(h, { x: 100, y: 70 });
  const p1 = applyHomography(h, { x: 101, y: 70 });
  const pixelsPerMm = Math.hypot(p1.x - p0.x, p1.y - p0.y);
  const ink = MARKER_CENTERS.reduce((sum, c) => sum + sampleMean(img, h, c, MARKER_SIZE * 0.3), 0) / 4;
  const radius = BUBBLE_R * 0.6;

  // วัดสีกระดาษขาว 4 มุมภายในแผ่น (พื้นที่ว่างปลอดตัวอักษร/วงกลม) เพื่อชดเชยแสงและเงาพาดแบบ Bilinear
  const wTL = sampleMean(img, h, { x: 8, y: 20 }, 1.6);
  const wTR = sampleMean(img, h, { x: 192, y: 20 }, 1.6);
  const wBL = sampleMean(img, h, { x: 26, y: 132 }, 1.6);
  const wBR = sampleMean(img, h, { x: 174, y: 132 }, 1.6);

  const answerMeans: number[][] = [];
  for (let q = 0; q < opts.questionCount; q += 1) {
    answerMeans.push(Array.from({ length: opts.choiceCount }, (_, c) => sampleMean(img, h, answerBubble(q, c), radius)));
  }
  const studentMeans = ([0, 1] as const).map((col) => Array.from({ length: 10 }, (_, d) => sampleMean(img, h, studentNoBubble(col, d), radius)));
  const all = [...answerMeans.flat(), ...studentMeans.flat()].sort((a, b) => a - b);
  // กระดาษขาวเฉลี่ย = เปอร์เซ็นไทล์ 70 (วงส่วนใหญ่ไม่ได้ฝน)
  const globalWhite = all[Math.floor(all.length * 0.7)] ?? 255;

  const localWhiteAt = (pt: Point): number => {
    const u = Math.max(0, Math.min(1, (pt.x - 8) / 184));
    const v = Math.max(0, Math.min(1, (pt.y - 20) / 112));
    const top = wTL * (1 - u) + wTR * u;
    const bot = wBL * (1 - u) + wBR * u;
    const bilinear = top * (1 - v) + bot * v;
    // ป้องกันกรณีมุมใดมุมหนึ่งมีรอยเปื้อน: ไม่ต่ำกว่า globalWhite - 45
    return Math.max(globalWhite - 45, bilinear);
  };

  const darkAt = (mean: number, pt: Point) => {
    const localWhite = localWhiteAt(pt);
    const span = Math.max(30, localWhite - ink);
    return Math.max(0, Math.min(1, (localWhite - mean) / span));
  };

  const codeBits = Array.from({ length: EXAM_CODE_BITS }, (_, i) => {
    const pt = examCodeBubble(i);
    return darkAt(sampleMean(img, h, pt, radius), pt) >= 0.5;
  });
  const examCode = decodeExamCode(codeBits);

  const darkness = answerMeans.map((row, q) => row.map((mean, c) => darkAt(mean, answerBubble(q, c))));
  const decisions = darkness.map(decideMark);
  const studentDecisions = studentMeans.map((col, colIdx) =>
    decideMark(col.map((mean, d) => darkAt(mean, studentNoBubble(colIdx as 0 | 1, d)))),
  );
  const studentNoStatus: MarkStatus = studentDecisions.every((d) => d.status === 'ok')
    ? 'ok'
    : studentDecisions.find((d) => d.status !== 'ok')!.status;
  const studentNo = studentNoStatus === 'ok' ? studentDecisions[0].choice! * 10 + studentDecisions[1].choice! : null;

  const rPx = BUBBLE_R * pixelsPerMm;
  const bubbles: BubbleOverlay[] = [];
  for (let q = 0; q < opts.questionCount; q += 1) {
    for (let c = 0; c < opts.choiceCount; c += 1) {
      const p = applyHomography(h, answerBubble(q, c));
      bubbles.push({ kind: 'answer', index: q, choice: c, x: p.x, y: p.y, r: rPx });
    }
  }
  ([0, 1] as const).forEach((col) => {
    for (let d = 0; d < 10; d += 1) {
      const p = applyHomography(h, studentNoBubble(col, d));
      bubbles.push({ kind: 'student', index: col, choice: d, x: p.x, y: p.y, r: rPx });
    }
  });

  const issues: string[] = [];
  if (pixelsPerMm < 2.2) issues.push('ภาพเล็กเกินไป ถ่ายให้ใกล้ขึ้นจนกระดาษเต็มกรอบ');
  if (examCode === null) issues.push('อ่านรหัสชุดข้อสอบไม่ได้ (แถววงกลมทึบด้านบนขวา)');
  if (studentNoStatus !== 'ok') issues.push(studentNoStatus === 'blank' ? 'ยังไม่ได้ฝนเลขที่' : 'เลขที่ฝนไม่ชัดหรือฝนเกิน 1 วงในหลักเดียวกัน');
  const unclear = decisions.filter((d) => d.status === 'unclear' || d.status === 'multi').length;
  if (unclear > 0) issues.push(`มี ${unclear} ข้อที่อ่านไม่ชัดหรือฝนเกิน 1 ช่อง กดแก้ในตารางได้`);

  return {
    examCode,
    studentNo,
    studentNoStatus,
    answers: decisions.map((d) => d.choice),
    statuses: decisions.map((d) => d.status),
    darkness,
    pixelsPerMm,
    corners: imageCorners,
    bubbles,
    issues,
  };
};

export interface ScanResult {
  sheets: SheetReading[];
  error: string | null;
}

const decodeGroups = (
  img: GrayImage,
  groups: Point[][],
  resolveOptions: (examCode: number | null) => ReadOptions | null,
  fallback: ReadOptions,
): SheetReading[] => {
  const sheets: SheetReading[] = [];
  for (const corners of groups) {
    let best: SheetReading | null = null;
    // ลองทั้ง 4 ทิศ (ถ่ายกลับหัวหรือหมุนได้) เลือกทิศที่ถอดรหัสชุดข้อสอบได้
    for (let rotation = 0; rotation < 4; rotation += 1) {
      const probe = readWithCorners(img, corners, rotation, fallback);
      if (!probe) continue;
      if (probe.examCode !== null) {
        const opts = resolveOptions(probe.examCode) ?? fallback;
        best = readWithCorners(img, corners, rotation, opts);
        break;
      }
      if (!best) best = probe;
    }
    if (best) sheets.push(best);
  }
  return sheets;
};

/**
 * อ่านกระดาษคำตอบทุกแผ่นในภาพ (1 หรือ 2 แผ่น)
 * resolveOptions: เมื่อถอดรหัสชุดข้อสอบได้ ให้คืนจำนวนข้อ/ตัวเลือกของชุดนั้น (ถ้าไม่รู้จักรหัส คืน null)
 */
export const scanAnswerSheets = (
  img: GrayImage,
  resolveOptions: (examCode: number | null) => ReadOptions | null,
  fallback: ReadOptions,
): ScanResult => {
  const imageArea = img.width * img.height;
  const minArea = Math.max(40, imageArea * 0.00004);
  const maxArea = imageArea * 0.02;

  // รอบที่ 1: Otsu Global Threshold (เร็วมาก เหมาะกับแสงสม่ำเสมอ)
  const threshold = otsuThreshold(img);
  const otsuGroups = findSheetCornerGroups(findDarkBlobs(img, threshold, minArea, maxArea));
  const otsuSheets = otsuGroups.length ? decodeGroups(img, otsuGroups, resolveOptions, fallback) : [];
  if (otsuSheets.some((s) => s.examCode !== null)) {
    return { sheets: otsuSheets, error: null };
  }

  // รอบที่ 2: Adaptive Local Threshold (Integral Image) สำหรับกรณีแสงไม่สม่ำเสมอหรือมีเงาพาดครึ่งแผ่น
  const adaptiveGroups = findSheetCornerGroups(findAdaptiveDarkBlobs(img, minArea, maxArea));
  const adaptiveSheets = adaptiveGroups.length ? decodeGroups(img, adaptiveGroups, resolveOptions, fallback) : [];
  if (adaptiveSheets.some((s) => s.examCode !== null)) {
    return { sheets: adaptiveSheets, error: null };
  }

  const bestSheets = otsuSheets.length ? otsuSheets : adaptiveSheets;
  if (bestSheets.length) return { sheets: bestSheets, error: null };

  if (!otsuGroups.length && !adaptiveGroups.length) {
    return { sheets: [], error: 'ไม่พบสี่เหลี่ยมดำครบ 4 มุม: วางกระดาษบนพื้นเรียบ ให้เห็นมุมดำครบ เลี่ยงเงามือและแสงสะท้อน' };
  }
  return { sheets: [], error: 'คำนวณตำแหน่งกระดาษไม่ได้ ลองถ่ายใหม่ให้ตรงขึ้น' };
};
