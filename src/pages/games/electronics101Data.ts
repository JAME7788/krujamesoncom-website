// ข้อมูลบทเรียนและแบบจำลองฟิสิกส์ของห้องแล็บ Electronics 101 (แยกจากคอมโพเนนต์เพื่อให้ทดสอบได้)

export type ElectronicsCategoryKey =
  | 'basics'
  | 'resistors'
  | 'leds'
  | 'capacitors'
  | 'switches'
  | 'transistors'
  | 'sensors';

export type CircuitTopologyMode =
  | 'DC'
  | 'AC'
  | 'SERIES'
  | 'PARALLEL'
  | 'VDIV'
  | 'RC'
  | 'ASTABLE'
  | 'AND'
  | 'SPDT'
  | 'NOT'
  | 'BJT'
  | 'LDR_DIRECT'
  | 'LDR_NIGHT';

export interface ElectronicsLesson {
  id: string;
  title: string;
  v: number;
  r: number;
  c?: number;
  rb?: number;
  light?: number;
  mode: CircuitTopologyMode;
  sw: boolean;
  desc: string;
}

export const ELECTRONICS_101_CATEGORIES: { key: ElectronicsCategoryKey; label: string }[] = [
  { key: 'basics', label: '1. Basics (9 lessons)' },
  { key: 'resistors', label: '2. Resistors (8 lessons)' },
  { key: 'leds', label: '3. LEDs & diodes (5 lessons)' },
  { key: 'capacitors', label: '4. Capacitors (9 lessons)' },
  { key: 'switches', label: '5. Switches & buttons (4 lessons)' },
  { key: 'transistors', label: '6. Transistors (6 lessons)' },
  { key: 'sensors', label: '7. Sensors (7 lessons)' },
];

export const ELECTRONICS_101_CURRICULUM: Record<ElectronicsCategoryKey, ElectronicsLesson[]> = {
  basics: [
    { id: 'b1', title: '1. Open & closed', v: 3.0, r: 100, mode: 'DC', sw: true, desc: 'กระแสไหลครบวงจรจากขั้ว + ผ่านหลอดไฟกลับเข้าขั้ว − คลิกสวิตช์ใบมีด 3D เพื่อเปิด/ปิดลูป' },
    { id: 'b2', title: '2. Conductors & insulators', v: 5.0, r: 120, mode: 'DC', sw: true, desc: 'โลหะเป็นตัวนำยอมให้กระแสไหลง่าย (R ต่ำ) ส่วนฉนวนมีความต้านทานสูงมากจนกระแสผ่านไม่ได้' },
    { id: 'b3', title: '3. Volts, amps & ohms', v: 6.0, r: 220, mode: 'DC', sw: true, desc: 'เปรียบสายไฟเหมือนท่อน้ำ: แรงดัน (V) คือแรงดันน้ำ กระแส (A) คืออัตราไหล และความต้านทาน (Ω) คือความแคบของท่อ' },
    { id: 'b4', title: '4. Types of circuit', v: 6.0, r: 220, mode: 'PARALLEL', sw: true, desc: 'เปรียบเทียบวงจรเปิด วงจรปิด วงจรอนุกรม และวงจรขนานที่มีทางเดินกระแสแยก 2 กิ่ง' },
    { id: 'b5', title: '5. Series & parallel cells', v: 4.5, r: 180, mode: 'DC', sw: true, desc: 'ถ่าน AA 1 ก้อนให้แรงดัน 1.5V เมื่อต่ออนุกรม 3 ก้อนจะได้แรงดันรวม 4.5V แต่ถ้าต่อขนานแรงดันจะเท่าเดิมแต่จ่ายไฟได้นานขึ้น' },
    { id: 'b6', title: '6. AC and DC', v: 6.0, r: 220, c: 100, mode: 'AC', sw: true, desc: 'แบตเตอรี่จ่ายไฟตรง (DC) ไหลทางเดียว ส่วนไฟสลับ (AC) เปลี่ยนทิศทางตามรูปคลื่นไซน์ กดปุ่ม Speed 0.04x เพื่อดูคลื่นช้าๆ' },
    { id: 'b7', title: '7. Using a breadboard', v: 5.0, r: 220, mode: 'SERIES', sw: true, desc: 'โฟโต้บอร์ดช่วยต่อวงจรโดยไม่ต้องบัดกรี รูในแนวตั้ง 5 รูเชื่อมต่อถึงกันเป็นแถวเดียวกัน' },
    { id: 'b8', title: '8. Using a multimeter', v: 9.0, r: 330, mode: 'VDIV', sw: true, desc: 'ดิจิทัลมัลติมิเตอร์ 3D ด้านหลังวัดแรงดันแบบต่อขนานและคำนวณค่าความต้านทาน/กระแสแบบ Real-time' },
    { id: 'b9', title: "9. Kirchhoff's two rules", v: 9.0, r: 250, mode: 'PARALLEL', sw: true, desc: 'KCL: กระแสไหลเข้าจุดรวมเท่ากับกระแสไหลออก (I_total = I1 + I2) | KVL: ผลรวมแรงดันในลูปเท่ากับแหล่งจ่าย' },
  ],
  resistors: [
    { id: 'r1', title: '1. How a resistor works', v: 5.0, r: 330, mode: 'DC', sw: true, desc: 'ตัวต้านทานจำกัดการไหลของกระแสไฟฟ้า ยิ่งค่า Ω สูง กระแส (mA) ยิ่งลดลง' },
    { id: 'r2', title: '2. Read the colour code', v: 5.0, r: 470, mode: 'DC', sw: true, desc: 'เลื่อนสไลเดอร์ R1 เพื่ออ่านค่าแถบสี 4 แถบบนตัวต้านทาน 3D: หลักที่ 1, หลักที่ 2, ตัวคูณ และแถบสีทอง ±5%' },
    { id: 'r3', title: '3. Resistors in series', v: 9.0, r: 220, mode: 'SERIES', sw: true, desc: 'ตัวต้านทานต่ออนุกรมกัน ความต้านทานรวมจะนำมาบวกกันโดยตรง (R_total = R1 + R2) ทำให้กระแสลดลงครึ่งหนึ่ง' },
    { id: 'r4', title: '4. Resistors in parallel', v: 6.0, r: 330, mode: 'PARALLEL', sw: true, desc: 'ตัวต้านทานต่อขนานกัน ช่วยเปิดทางให้กระแสไหลได้ 2 ทาง ทำให้ความต้านทานรวมลดลงครึ่งหนึ่ง' },
    { id: 'r5', title: '5. Voltage divider', v: 9.0, r: 470, mode: 'VDIV', sw: true, desc: 'ตัวต้านทาน 2 ตัวต่ออนุกรมแบ่งแรงดันตกคร่อมตามสัดส่วน V_out = V_s × (R2 / (R1 + R2))' },
    { id: 'r6', title: '6. Variable resistor', v: 9.0, r: 500, mode: 'VDIV', sw: true, desc: 'Potentiometer มีขาเลื่อนตรงกลางสำหรับปรับแบ่งแรงดันอย่างต่อเนื่อง เลื่อนสไลเดอร์ R1 เพื่อจำลองการหมุนแกน' },
    { id: 'r7', title: '7. Power and heat', v: 12.0, r: 120, mode: 'DC', sw: true, desc: 'ตัวต้านทานเปลี่ยนพลังงานไฟฟ้าเป็นความร้อนตามสมการ P = I²R ระวังอย่าให้เกินพิกัด 250 mW (1/4 วัตต์)' },
    { id: 'r8', title: '8. Wheatstone bridge', v: 9.0, r: 330, mode: 'PARALLEL', sw: true, desc: 'วงจรแบ่งแรงดัน 2 ชุดวางคู่กัน เมื่ออัตราส่วนความต้านทานทั้งสองฝั่งสมดุลกัน แรงดันวัดเทียบจุดกลางจะเป็น 0 V' },
  ],
  leds: [
    { id: 'l1', title: '1. One way only', v: 5.0, r: 220, mode: 'DC', sw: true, desc: 'LED เป็นไดโอดที่ยอมให้กระแสไหลผ่านจากขา Anode (+) ไป Cathode (−) ได้เพียงทิศทางเดียวเท่านั้น' },
    { id: 'l2', title: '2. Colours and volts', v: 3.5, r: 150, mode: 'DC', sw: true, desc: 'LED แต่ละสีมีแรงดันเริ่มนำกระแส (Vf) ต่างกัน: สีแดง ~1.9V, สีเขียว ~2.2V, สีน้ำเงินและขาว ~3.0V' },
    { id: 'l3', title: '3. Too much current', v: 9.0, r: 30, mode: 'DC', sw: true, desc: 'หากไม่ใส่ตัวต้านทานจำกัดกระแสที่เหมาะสม กระแสจะพุ่งทะลุ 35 mA จนโครงสร้างสารกึ่งตัวนำภายใน LED ร้อนจัดและเสียหาย' },
    { id: 'l4', title: '4. The plain diode', v: 5.0, r: 220, mode: 'DC', sw: true, desc: 'ไดโอดซิลิคอนทั่วไป (เช่น 1N4007) ทำหน้าที่เป็นวาล์วกันกระแสย้อนกลับ โดยมีแรงดันตกคร่อมประมาณ 0.7V' },
    { id: 'l5', title: '5. LEDs in series', v: 9.0, r: 220, mode: 'SERIES', sw: true, desc: 'LED 2 ดวงต่ออนุกรมใช้กระแสร่วมกัน แต่ต้องใช้แรงดันแหล่งจ่ายอย่างน้อยรวมกันเกิน 2 × Vf (~3.8V) จึงจะสว่าง' },
  ],
  capacitors: [
    { id: 'c1', title: '1. Like a water tank', v: 6.0, r: 220, c: 680, mode: 'RC', sw: true, desc: 'ตัวเก็บประจุทำงานคล้ายถังเก็บน้ำสำรอง เก็บสะสมประจุเมื่อมีไฟเข้า และจ่ายประจุออกเมื่อตัดแหล่งจ่าย' },
    { id: 'c2', title: '2. Charge it up', v: 6.0, r: 300, c: 1000, mode: 'RC', sw: true, desc: 'ประกอบด้วยแผ่นโลหะ 2 แผ่นคั่นด้วยฉนวน เมื่อต่อไฟ แรงดันตกคร่อม Vc จะไต่ขึ้นจนเท่ากับแหล่งจ่าย' },
    { id: 'c3', title: '3. Fading light', v: 6.0, r: 200, c: 1200, mode: 'RC', sw: true, desc: 'เมื่อสับสวิตช์เปิดวงจร ตัวเก็บประจุที่ชาร์จเต็มจะคายประจุผ่านหลอด LED ทำให้ไฟค่อยๆ หรี่ดับลงอย่างนุ่มนวล' },
    { id: 'c4', title: '4. Only while charging', v: 6.0, r: 250, c: 470, mode: 'RC', sw: true, desc: 'เมื่อตัวเก็บประจุชาร์จจนเต็ม (Vc = Vs) กระแสที่ไหลเข้าตัวเก็บประจุจะลดลงเป็นศูนย์' },
    { id: 'c5', title: '5. In series & parallel', v: 6.0, r: 220, c: 1800, mode: 'RC', sw: true, desc: 'การต่อตัวเก็บประจุแบบขนานทำให้ค่าความจุรวมเพิ่มขึ้น (C_total = C1 + C2) จึงเก็บพลังงานได้นานขึ้น' },
    { id: 'c6', title: '6. Smoothing', v: 8.0, r: 280, c: 820, mode: 'AC', sw: true, desc: 'ไดโอดเรียงกระแสไฟ AC เป็น DC แบบคลื่นกระเพื่อม และใช้ตัวเก็บประจุช่วยกรองแรงดันให้เรียบขึ้น' },
    { id: 'c7', title: '7. Timed delay', v: 9.0, r: 600, c: 1500, mode: 'RC', sw: true, desc: 'วงจรหน่วงเวลาด้วยค่าคงที่เวลา τ = R × C ยิ่งค่า R หรือ C สูง เวลาในการชาร์จและคายประจุยิ่งนานขึ้น' },
    { id: 'c8', title: '8. Reading the code', v: 5.0, r: 220, c: 100, mode: 'RC', sw: true, desc: 'ตัวเก็บประจุเซรามิกระบุรหัส 3 หลักในหน่วยพิโคฟารัด (pF) เช่น 104 = 10 ตามด้วยศูนย์ 4 ตัว = 100,000 pF (100 nF)' },
    { id: 'c9', title: '9. Two flashing LEDs', v: 6.0, r: 250, c: 680, mode: 'ASTABLE', sw: true, desc: 'วงจร Astable Multivibrator ใช้ทรานซิสเตอร์และตัวเก็บประจุสลับกันชาร์จ-คายประจุทำให้ LED 2 ดวงกะพริบสลับกันอัตโนมัติ' },
  ],
  switches: [
    { id: 'sw1', title: '1. Push to light', v: 5.0, r: 220, mode: 'DC', sw: true, desc: 'ปุ่มกดติด-ปล่อยดับ (Momentary Push Button) เชื่อมต่อวงจรเฉพาะจังหวะที่กดค้างไว้' },
    { id: 'sw2', title: '2. Slide switch', v: 5.0, r: 220, mode: 'DC', sw: true, desc: 'สวิตช์เลื่อน (Latching Slide Switch) ค้างสถานะเปิดหรือปิดไว้ตามตำแหน่งล่าสุดที่สับไว้' },
    { id: 'sw3', title: '3. AND & OR', v: 5.0, r: 220, mode: 'AND', sw: true, desc: 'วงจรลอจิกด้วยสวิตช์ 2 ตัวอนุกรมกัน (AND Gate): ต้องเปิดทั้ง Switch 1 และ Switch 2 พร้อมกันหลอดไฟจึงจะติด' },
    { id: 'sw4', title: '4. Two-way switch', v: 6.0, r: 220, mode: 'SPDT', sw: true, desc: 'สวิตช์บันได 2 ทาง (SPDT) สามารถกดสลับเปิด-ปิดไฟจากสวิตช์ตัวที่ 1 หรือตัวที่ 2 ก็ได้' },
  ],
  transistors: [
    { id: 't1', title: '1. Current control', v: 5.0, r: 220, rb: 10000, mode: 'BJT', sw: true, desc: 'ทรานซิสเตอร์มี 3 ขา (Collector, Base, Emitter) ใช้กระแสขนาดเล็กที่ขา Base ควบคุมกระแสใหญ่ที่ขา Collector' },
    { id: 't2', title: '2. A current switch', v: 5.0, r: 200, rb: 3300, mode: 'BJT', sw: true, desc: 'เมื่อป้อนกระแสเข้าขา Base มากพอจนอิ่มตัว (Saturation) ทรานซิสเตอร์จะทำหน้าที่เหมือนสวิตช์ที่ต่อตรงเต็มพิกัด' },
    { id: 't3', title: '3. Current gain', v: 6.0, r: 220, rb: 25000, mode: 'BJT', sw: true, desc: 'ในย่าน Active อัตราขยายกระแส β ≈ 200 ทำให้กระแส Ic มีค่าเป็น 200 เท่าของกระแส Ib' },
    { id: 't4', title: '4. NPN and PNP', v: 6.0, r: 220, rb: 12000, mode: 'BJT', sw: true, desc: 'NPN ทำงานเมื่อขา Base มีศักย์สูงกว่า Emitter (+0.7V) ส่วน PNP ทำงานเมื่อดึงกระแสออกจากขา Base ลงกราวด์' },
    { id: 't5', title: '5. Touch switch', v: 9.0, r: 270, rb: 48000, mode: 'BJT', sw: true, desc: 'กระแสเพียงไม่กี่ไมโครแอมป์ (µA) ที่ไหลผ่านนิ้วมือเมื่อแตะแผ่นสัมผัส ถูกขยายด้วยค่า β จนจุดหลอด LED ให้สว่างได้' },
    { id: 't6', title: '6. Turn it round: NOT', v: 5.0, r: 250, rb: 4700, mode: 'NOT', sw: true, desc: 'วงจรอินเวอร์เตอร์ (NOT Gate): ต่อทรานซิสเตอร์คร่อมข้างหลอด LED เมื่อสับสวิตช์ป้อนไฟเข้าขา Base ทรานซิสเตอร์จะดึงกระแสลงกราวด์ทำให้ LED ดับ' },
  ],
  sensors: [
    { id: 's1', title: '1. Light sensor', v: 6.0, r: 120, light: 70, mode: 'LDR_DIRECT', sw: true, desc: 'ตัวต้านทานแปรผันตามแสง (LDR) นำกระแสได้ดีขึ้นเมื่อมีแสงตกกระทบมาก เลื่อนสไลเดอร์ Sensor Stimulus เพื่อทดสอบ' },
    { id: 's2', title: '2. Night light', v: 6.0, r: 220, rb: 12000, light: 15, mode: 'LDR_NIGHT', sw: true, desc: 'วาง LDR ไว้ด้านล่างของวงจรแบ่งแรงดัน เมื่อมืดลงแรงดันจุดกึ่งกลางจะพุ่งเกิน 0.7V สั่งให้ทรานซิสเตอร์เปิดไฟ LED อัตโนมัติ' },
    { id: 's3', title: '3. Temperature sensor', v: 6.0, r: 150, light: 65, mode: 'LDR_DIRECT', sw: true, desc: 'เทอร์มิสเตอร์ชนิด NTC มีความต้านทานลดลงเมื่ออุณหภูมิสูงขึ้น (ใช้สไลเดอร์จำลองระดับอุณหภูมิ 0-100%)' },
    { id: 's4', title: '4. Reed switch', v: 5.0, r: 220, light: 80, mode: 'LDR_DIRECT', sw: true, desc: 'สวิตช์แม่เหล็ก (Reed Switch) มีแผ่นเหล็กบางในหลอดแก้ว จะดูดติดกันเพื่อปิดวงจรเมื่อนำแม่เหล็กเข้ามาใกล้' },
    { id: 's5', title: '5. Heat alarm', v: 9.0, r: 220, rb: 10000, light: 85, mode: 'LDR_DIRECT', sw: true, desc: 'ย้ายเทอร์มิสเตอร์ไว้ด้านบนของวงจรแบ่งแรงดัน เมื่ออุณหภูมิสูงขึ้นความต้านทานจะลดลงและปล่อยแรงดันไปปลุกทรานซิสเตอร์ให้เตือนภัย' },
    { id: 's6', title: '6. Adjustable night light', v: 9.0, r: 270, rb: 9500, light: 30, mode: 'LDR_NIGHT', sw: true, desc: 'ใช้ตัวต้านทานปรับค่าได้ (Trimmer RB) เพื่อจูนระดับความมืดที่ต้องการให้ไฟหน้าบ้านเริ่มเปิดทำงาน' },
    { id: 's7', title: '7. Hall-effect sensor', v: 5.0, r: 220, rb: 6800, light: 20, mode: 'LDR_NIGHT', sw: true, desc: 'หัววัด Hall-effect เป็นชิปสารกึ่งตัวนำที่ตรวจจับความเข้มสนามแม่เหล็กแล้วส่งสัญญาณแรงดันไปขับทรานซิสเตอร์โดยไร้หน้าสัมผัสกลไก' },
  ],
};

const BAND_HEX = [
  '#111111',
  '#7c2d12',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#a855f7',
  '#94a3b8',
  '#ffffff',
];

export function getResistorBandColors(ohms: number): [string, string, string] {
  const rounded = Math.max(10, Math.round(ohms));
  const str = rounded.toString();
  const d1 = parseInt(str[0], 10) || 0;
  const d2 = parseInt(str[1], 10) || 0;
  const mult = Math.max(0, str.length - 2);
  return [BAND_HEX[d1], BAND_HEX[d2], BAND_HEX[Math.min(9, mult)]];
}

export interface PhysicsSimulationState {
  switchClosed: boolean;
  sw2Closed: boolean;
  Vs: number;
  R: number;
  C: number;
  Vf: number;
  mode: CircuitTopologyMode;
  Vc: number;
  Vload: number;
  I_mA: number;
  I2_mA: number;
  P_mW: number;
  Rb: number;
  hFE: number;
  Ib_uA: number;
  Vb: number;
  lightLevel: number;
  R_ldr: number;
  timeScale: number;
  simTime: number;
}

export function solveElectronicsPhysicsStep(s: PhysicsSimulationState, dt: number): void {
  const effDt = dt * s.timeScale;
  s.simTime += effDt;

  let Vin = s.Vs;
  if (s.mode === 'AC') {
    const rawSin = Math.sin(s.simTime * Math.PI * 2 * 2.5);
    Vin = Math.max(0, s.Vs * rawSin);
  }

  s.R_ldr = Math.round(150 + 49850 * Math.pow(1 - s.lightLevel / 100, 2.4));
  s.I2_mA = 0;

  if (s.mode === 'SERIES') {
    const rTot = s.R * 2;
    const vfTot = s.Vf * 2;
    s.I_mA = s.switchClosed && Vin > vfTot ? ((Vin - vfTot) / rTot) * 1000 : 0;
    s.I2_mA = s.I_mA;
    s.Vload = s.switchClosed ? Vin : 0;
  } else if (s.mode === 'PARALLEL') {
    s.I_mA = s.switchClosed && Vin > s.Vf ? ((Vin - s.Vf) / s.R) * 1000 : 0;
    s.I2_mA = s.I_mA;
    s.Vload = s.switchClosed ? Vin : 0;
  } else if (s.mode === 'VDIV') {
    const vMid = s.switchClosed ? Vin * 0.5 : 0;
    s.Vload = vMid;
    s.I_mA = vMid > s.Vf ? ((vMid - s.Vf) / (s.R * 0.5)) * 1000 : 0;
  } else if (s.mode === 'ASTABLE') {
    const freq = 1000 / Math.max(150, s.C * 0.8);
    const phase = Math.sin(s.simTime * Math.PI * 2 * freq);
    s.Vc = Math.abs(phase) * Vin;
    if (s.switchClosed && Vin > s.Vf) {
      const branchCurr = ((Vin - s.Vf) / s.R) * 1000;
      s.I_mA = phase >= 0 ? branchCurr : 0.2;
      s.I2_mA = phase < 0 ? branchCurr : 0.2;
      s.Vload = phase >= 0 ? Vin : s.Vf * 0.5;
    } else {
      s.I_mA = 0;
      s.I2_mA = 0;
      s.Vload = 0;
    }
  } else if (s.mode === 'AND' || s.mode === 'SPDT') {
    const cond = s.mode === 'AND' ? s.switchClosed && s.sw2Closed : s.switchClosed === s.sw2Closed;
    s.Vload = cond ? Vin : 0;
    s.I_mA = cond && Vin > s.Vf ? ((Vin - s.Vf) / s.R) * 1000 : 0;
  } else if (s.mode === 'NOT') {
    const ledOn = !s.switchClosed;
    s.Ib_uA = s.switchClosed ? ((Vin - 0.7) / s.Rb) * 1e6 : 0;
    s.I_mA = ledOn && Vin > s.Vf ? ((Vin - s.Vf) / s.R) * 1000 : 0;
    s.Vload = ledOn ? Vin : 0.15;
  } else if (s.mode === 'DC') {
    s.Ib_uA = 0;
    s.Vload = s.switchClosed && Vin > s.Vf ? Vin : 0;
    s.I_mA = s.switchClosed && Vin > s.Vf ? ((Vin - s.Vf) / s.R) * 1000 : 0;
  } else if (s.mode === 'BJT') {
    if (s.switchClosed && Vin > 0.7) {
      s.Vb = 0.7;
      const ib_A = (Vin - 0.7) / s.Rb;
      s.Ib_uA = ib_A * 1e6;
      const ic_max_A = Math.max(0, (Vin - s.Vf - 0.1) / s.R);
      const ic_A = Math.min(ic_max_A, ib_A * s.hFE);
      s.I_mA = ic_A * 1000;
      s.Vload = s.I_mA > 0.1 ? s.Vf + ic_A * s.R : 0;
    } else {
      s.Vb = 0;
      s.Ib_uA = 0;
      s.I_mA = 0;
      s.Vload = 0;
    }
  } else if (s.mode === 'LDR_DIRECT') {
    s.Ib_uA = 0;
    if (s.switchClosed && Vin > s.Vf) {
      const totalR = s.R + s.R_ldr * 0.12;
      s.I_mA = ((Vin - s.Vf) / totalR) * 1000;
      s.Vload = Vin;
    } else {
      s.I_mA = 0;
      s.Vload = 0;
    }
  } else if (s.mode === 'LDR_NIGHT') {
    if (s.switchClosed) {
      const v_thevenin = Vin * (s.R_ldr / (s.Rb + s.R_ldr));
      const r_thevenin = (s.Rb * s.R_ldr) / (s.Rb + s.R_ldr);
      if (v_thevenin > 0.68) {
        s.Vb = 0.7;
        const ib_A = (v_thevenin - 0.68) / Math.max(200, r_thevenin);
        s.Ib_uA = ib_A * 1e6;
        const ic_max_A = Math.max(0, (Vin - s.Vf - 0.1) / s.R);
        const ic_A = Math.min(ic_max_A, ib_A * s.hFE);
        s.I_mA = ic_A * 1000;
        s.Vload = s.Vf + ic_A * s.R;
      } else {
        s.Vb = v_thevenin;
        s.Ib_uA = 0;
        s.I_mA = 0;
        s.Vload = 0;
      }
    } else {
      s.Vb = 0;
      s.Ib_uA = 0;
      s.I_mA = 0;
      s.Vload = 0;
    }
  } else {
    // RC & AC Smoothing
    const R_ohm = s.R;
    const C_farad = Math.max(47, s.C) * 1e-6;
    const R_led_equiv = 180;
    const i_in = s.switchClosed && Vin > s.Vc ? (Vin - s.Vc) / R_ohm : 0;
    const i_load = s.Vc > s.Vf ? (s.Vc - s.Vf) / R_led_equiv : 0;
    const dVc = ((i_in - i_load) / (C_farad * 450)) * effDt;
    s.Vc = Math.max(0, Math.min(s.Vs, s.Vc + dVc));
    s.Vload = s.Vc;
    s.I_mA = i_load * 1000;
  }

  s.P_mW = Math.pow(s.I_mA / 1000, 2) * s.R * 1000;
}
