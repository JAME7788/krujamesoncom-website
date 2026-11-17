// ข้อมูลบทเรียนและแบบจำลองฟิสิกส์ของห้องแล็บ Electronics 101 (แยกจากคอมโพเนนต์เพื่อให้ทดสอบได้)

export type ElectronicsCategoryKey =
  | 'basics'
  | 'resistors'
  | 'leds'
  | 'capacitors'
  | 'switches'
  | 'transistors'
  | 'sensors'
  | 'protection'
  | 'safety';

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
  | 'LDR_NIGHT'
  | 'FUSE_TRIP'
  | 'BREAKER'
  | 'SAFETY_GROUND'
  | 'TROUBLESHOOT';

export type CircuitFaultKind = 'none' | 'blown_fuse' | 'open_r1' | 'high_res_joint' | 'open_ground';

export interface ElectronicsLesson {
  id: string;
  title: string;
  v: number;
  r: number;
  r2?: number;
  c?: number;
  rb?: number;
  light?: number;
  wattage?: number;
  wireMm2?: number;
  breakerA?: number;
  fault?: CircuitFaultKind;
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
  { key: 'protection', label: '8. Power, Sizing & Breakers (6 lessons)' },
  { key: 'safety', label: '9. Safety & Troubleshooting (6 lessons)' },
];

export interface WireSizeSpec {
  mm2: number;
  maxAmpAir: number;
  labelTh: string;
  cableType: string;
  usageTh: string;
}

export const TIS_WIRE_SIZES: WireSizeSpec[] = [
  {
    mm2: 0.5,
    maxAmpAir: 6,
    labelTh: '0.5 ตร.มม. (พิกัด 6A)',
    cableType: 'VCT (สายอ่อน)',
    usageTh: 'วงจรสัญญาณ โคมไฟตั้งโต๊ะขนาดเล็ก',
  },
  {
    mm2: 1.0,
    maxAmpAir: 11,
    labelTh: '1.0 ตร.มม. (พิกัด 11A)',
    cableType: 'VAF / IEC-01',
    usageTh: 'วงจรหลอดไฟแสงสว่างย่อยในอาคาร',
  },
  {
    mm2: 1.5,
    maxAmpAir: 15,
    labelTh: '1.5 ตร.มม. (พิกัด 15A)',
    cableType: 'IEC-01 (THW) / VAF',
    usageTh: 'วงจรแสงสว่างมาตรฐาน มอก.11-2553',
  },
  {
    mm2: 2.5,
    maxAmpAir: 20,
    labelTh: '2.5 ตร.มม. (พิกัด 20A)',
    cableType: 'IEC-01 (THW) / VAF-G',
    usageTh: 'วงจรเต้ารับและมอเตอร์พิกัด 15A (เผื่อ 1.25× = 18.75A)',
  },
  {
    mm2: 4.0,
    maxAmpAir: 28,
    labelTh: '4.0 ตร.มม. (พิกัด 28A)',
    cableType: 'IEC-01 / NYY',
    usageTh: 'เครื่องปรับอากาศ เครื่องทำน้ำอุ่น มอเตอร์ใหญ่',
  },
];

export interface BodyShockSeverity {
  maxMa: number;
  levelTh: string;
  symptomTh: string;
  colorHex: string;
}

export const BODY_SHOCK_LEVELS: BodyShockSeverity[] = [
  {
    maxMa: 1.0,
    levelTh: 'ปลอดภัย (< 1 mA)',
    symptomTh: 'ไม่รู้สึก หรือเริ่มรู้สึกซ่าๆ เล็กน้อยที่ปลายนิ้ว',
    colorHex: '#16a34a',
  },
  {
    maxMa: 5.0,
    levelTh: 'สะดุ้งเล็กน้อย (1–5 mA)',
    symptomTh: 'รู้สึกกระตุกเบาๆ ยังสามารถปล่อยมือออกจากจุดไฟรั่วได้เอง',
    colorHex: '#ca8a04',
  },
  {
    maxMa: 25.0,
    levelTh: 'กล้ามเนื้อหดเกร็ง (10–25 mA)',
    symptomTh: 'มือกำแน่นปล่อยไม่หลุด (Let-go threshold) ต้องรีบตัดเบรกเกอร์',
    colorHex: '#ea580c',
  },
  {
    maxMa: 80.0,
    levelTh: 'ปอดเกร็ง/หยุดหายใจ (30–80 mA)',
    symptomTh: 'กล้ามเนื้อหน้าอกหดเกร็ง หายใจไม่ได้ (พิกัดที่ RCD 30mA ต้องตัดทันที)',
    colorHex: '#dc2626',
  },
  {
    maxMa: 99999,
    levelTh: 'หัวใจสั่นพริ้ว/แผลไหม้ (> 100 mA)',
    symptomTh: 'หัวใจหยุดสูบฉีดเลือด (Ventricular Fibrillation) และเกิดแผลไหม้รุนแรง',
    colorHex: '#991b1b',
  },
];

export function getShockSeverity(currentMa: number): BodyShockSeverity {
  for (const item of BODY_SHOCK_LEVELS) {
    if (currentMa <= item.maxMa) return item;
  }
  return BODY_SHOCK_LEVELS[BODY_SHOCK_LEVELS.length - 1];
}

export const ELECTRONICS_101_CURRICULUM: Record<ElectronicsCategoryKey, ElectronicsLesson[]> = {
  basics: [
    { id: 'b1', title: '1. Open & closed', v: 3.0, r: 100, mode: 'DC', sw: true, desc: 'กระแสไหลครบวงจรจากขั้ว + ผ่านหลอดไฟกลับเข้าขั้ว − คลิกสวิตช์ใบมีด 3D เพื่อเปิด/ปิดลูป' },
    { id: 'b2', title: '2. Conductors & insulators', v: 5.0, r: 120, mode: 'DC', sw: true, desc: 'โลหะเป็นตัวนำยอมให้กระแสไหลง่าย (R ต่ำ) ส่วนฉนวนมีความต้านทานสูงมากจนกระแสผ่านไม่ได้' },
    { id: 'b3', title: '3. Volts, amps & ohms', v: 6.0, r: 220, mode: 'DC', sw: true, desc: 'เปรียบสายไฟเหมือนท่อน้ำ: แรงดัน (V) คือแรงดันน้ำ กระแส (A) คืออัตราไหล และความต้านทาน (Ω) คือความแคบของท่อ' },
    { id: 'b4', title: '4. Types of circuit', v: 6.0, r: 220, r2: 220, mode: 'PARALLEL', sw: true, desc: 'เปรียบเทียบวงจรเปิด วงจรปิด วงจรอนุกรม และวงจรขนานที่มีทางเดินกระแสแยก 2 กิ่ง ลองปรับ R1 กับ R2 แยกกันได้' },
    { id: 'b5', title: '5. Series & parallel cells', v: 4.5, r: 180, mode: 'DC', sw: true, desc: 'ถ่าน AA 1 ก้อนให้แรงดัน 1.5V เมื่อต่ออนุกรม 3 ก้อนจะได้แรงดันรวม 4.5V แต่ถ้าต่อขนานแรงดันจะเท่าเดิมแต่จ่ายไฟได้นานขึ้น' },
    { id: 'b6', title: '6. AC and DC', v: 6.0, r: 220, c: 100, mode: 'AC', sw: true, desc: 'แบตเตอรี่จ่ายไฟตรง (DC) ไหลทางเดียว ส่วนไฟสลับ (AC) เปลี่ยนทิศทางตามรูปคลื่นไซน์ กดปุ่ม Speed 0.04x เพื่อดูคลื่นช้าๆ' },
    { id: 'b7', title: '7. Using a breadboard', v: 5.0, r: 220, r2: 220, mode: 'SERIES', sw: true, desc: 'โฟโต้บอร์ดช่วยต่อวงจรโดยไม่ต้องบัดกรี รูในแนวตั้ง 5 รูเชื่อมต่อถึงกันเป็นแถวเดียวกัน' },
    { id: 'b8', title: '8. Using a multimeter', v: 9.0, r: 330, r2: 330, mode: 'VDIV', sw: true, desc: 'ดิจิทัลมัลติมิเตอร์ 3D ด้านหลังวัดแรงดันแบบต่อขนานและคำนวณค่าความต้านทาน/กระแสแบบ Real-time' },
    { id: 'b9', title: "9. Kirchhoff's two rules", v: 9.0, r: 220, r2: 470, mode: 'PARALLEL', sw: true, desc: 'KCL: กระแสไหลเข้าจุดรวมเท่ากับกระแสไหลออก (I_total = I1 + I2) | KVL: ผลรวมแรงดันในลูปเท่ากับแหล่งจ่าย' },
  ],
  resistors: [
    { id: 'r1', title: '1. How a resistor works', v: 5.0, r: 330, mode: 'DC', sw: true, desc: 'ตัวต้านทานจำกัดการไหลของกระแสไฟฟ้า ยิ่งค่า Ω สูง กระแส (mA) ยิ่งลดลง' },
    { id: 'r2', title: '2. Read the colour code', v: 5.0, r: 470, mode: 'DC', sw: true, desc: 'เลื่อนสไลเดอร์ R1 เพื่ออ่านค่าแถบสี 4 แถบบนตัวต้านทาน 3D: หลักที่ 1, หลักที่ 2, ตัวคูณ และแถบสีทอง ±5%' },
    { id: 'r3', title: '3. Resistors in series', v: 9.0, r: 220, r2: 330, mode: 'SERIES', sw: true, desc: 'ตัวต้านทานต่ออนุกรมกัน ความต้านทานรวม R_total = R1 + R2 กระแสไหลเท่ากันทั้งเส้น แต่แรงดันตกคร่อมแบ่งตามสัดส่วน R1 และ R2' },
    { id: 'r4', title: '4. Resistors in parallel', v: 6.0, r: 220, r2: 470, mode: 'PARALLEL', sw: true, desc: 'ตัวต้านทานต่อขนานกัน แรงดันตกคร่อมเท่ากันแต่กระแสแยกไหล 2 กิ่ง (I1 และ I2) ตามค่าความต้านทานของแต่ละกิ่ง' },
    { id: 'r5', title: '5. Voltage divider', v: 9.0, r: 470, r2: 470, mode: 'VDIV', sw: true, desc: 'ตัวต้านทาน R1 และ R2 ต่ออนุกรมแบ่งแรงดันตกคร่อมตามสัดส่วน V_out = V_s × (R2 / (R1 + R2))' },
    { id: 'r6', title: '6. Variable resistor', v: 9.0, r: 500, r2: 500, mode: 'VDIV', sw: true, desc: 'Potentiometer มีขาเลื่อนตรงกลางสำหรับปรับแบ่งแรงดันอย่างต่อเนื่อง เลื่อนสไลเดอร์ R1/R2 เพื่อจำลองการหมุนแกน' },
    { id: 'r7', title: '7. Power and heat', v: 12.0, r: 120, wattage: 0.25, mode: 'DC', sw: true, desc: 'ตัวต้านทานเปลี่ยนพลังงานไฟฟ้าเป็นความร้อนตามสมการ P = I²R เลือกขนาดวัตต์ (1/8W, 1/4W, 1/2W, 1W) ให้ทนกำลังไฟได้' },
    { id: 'r8', title: '8. Wheatstone bridge', v: 9.0, r: 330, r2: 330, mode: 'PARALLEL', sw: true, desc: 'วงจรแบ่งแรงดัน 2 ชุดวางคู่กัน เมื่ออัตราส่วนความต้านทานทั้งสองฝั่งสมดุลกัน แรงดันวัดเทียบจุดกลางจะเป็น 0 V' },
  ],
  leds: [
    { id: 'l1', title: '1. One way only', v: 5.0, r: 220, mode: 'DC', sw: true, desc: 'LED เป็นไดโอดที่ยอมให้กระแสไหลผ่านจากขา Anode (+) ไป Cathode (−) ได้เพียงทิศทางเดียวเท่านั้น' },
    { id: 'l2', title: '2. Colours and volts', v: 3.5, r: 150, mode: 'DC', sw: true, desc: 'LED แต่ละสีมีแรงดันเริ่มนำกระแส (Vf) ต่างกัน: สีแดง ~1.9V, สีเขียว ~2.2V, สีน้ำเงินและขาว ~3.0V' },
    { id: 'l3', title: '3. Too much current', v: 9.0, r: 30, mode: 'DC', sw: true, desc: 'หากไม่ใส่ตัวต้านทานจำกัดกระแสที่เหมาะสม กระแสจะพุ่งทะลุ 35 mA จนโครงสร้างสารกึ่งตัวนำภายใน LED ร้อนจัดและเสียหาย' },
    { id: 'l4', title: '4. The plain diode', v: 5.0, r: 220, mode: 'DC', sw: true, desc: 'ไดโอดซิลิคอนทั่วไป (เช่น 1N4007) ทำหน้าที่เป็นวาล์วกันกระแสย้อนกลับ โดยมีแรงดันตกคร่อมประมาณ 0.7V' },
    { id: 'l5', title: '5. LEDs in series', v: 9.0, r: 220, r2: 220, mode: 'SERIES', sw: true, desc: 'LED 2 ดวงต่ออนุกรมใช้กระแสร่วมกัน ลองกดถอด LED ดวงใดดวงหนึ่งออกจะพบว่าวงจรขาดและดับทั้งคู่!' },
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
    { id: 'c9', title: '9. Two flashing LEDs', v: 6.0, r: 250, r2: 250, c: 680, mode: 'ASTABLE', sw: true, desc: 'วงจร Astable Multivibrator ใช้ทรานซิสเตอร์และตัวเก็บประจุสลับกันชาร์จ-คายประจุทำให้ LED 2 ดวงกะพริบสลับกันอัตโนมัติ' },
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
  protection: [
    {
      id: 'p1',
      title: '1. Power & Wattage (P=VI)',
      v: 12.0,
      r: 150,
      wattage: 0.5,
      mode: 'DC',
      sw: true,
      desc: 'กำลังไฟฟ้า P = V × I = I²R บอกอัตราการใช้พลังงานและความร้อนที่เกิดขึ้น เลือกขนาดพิกัดวัตต์ตัวต้านทาน (1/8W ถึง 1W) ให้มากกว่าค่า P จริง',
    },
    {
      id: 'p2',
      title: '2. Electricity Bill (kWh)',
      v: 12.0,
      r: 100,
      wattage: 1.0,
      mode: 'DC',
      sw: true,
      desc: 'ค่าไฟฟ้าคิดตามพลังงานเป็นกิโลวัตต์-ชั่วโมง (Unit / kWh = กำลังวัตต์ × ชั่วโมง ÷ 1,000) ดูการคำนวณหน่วยไฟและค่าไฟรายเดือนในแท็บ Maths',
    },
    {
      id: 'p3',
      title: '3. Open vs Short Circuit',
      v: 9.0,
      r: 220,
      mode: 'FUSE_TRIP',
      sw: true,
      desc: 'วงจรเปิด (Open) มีความต้านทานอนันต์ กระแสเป็น 0 ส่วนลัดวงจร (Short) ความต้านทานเข้าใกล้ 0 Ω ทำให้กระแสพุ่งสูงจัด ลองกดสวิตช์ลัดวงจร SW2 เพื่อทดสอบ!',
    },
    {
      id: 'p4',
      title: '4. Fuse Protection',
      v: 9.0,
      r: 250,
      mode: 'FUSE_TRIP',
      sw: true,
      desc: 'ฟิวส์หลอดแก้ว/คาร์ทริดจ์ต่ออนุกรมกับแหล่งจ่าย เมื่อเกิดโหลดเกินหรือกด SW2 ลัดวงจร เส้นลวดตะกั่ว-ดีบุกในฟิวส์จะหลอมขาดเพื่อตัดไฟทันที',
    },
    {
      id: 'p5',
      title: '5. Circuit Breaker (CB)',
      v: 12.0,
      r: 250,
      wireMm2: 2.5,
      breakerA: 30,
      mode: 'BREAKER',
      sw: true,
      desc: 'เซอร์กิตเบรกเกอร์ใช้แผ่นโลหะคู่ไบเมตัล (Thermal trip) โก่งตัวตัดเมื่อโหลดเกิน และใช้ขดลวดแม่เหล็ก (Magnetic trip) ดูดทริปทันทีเมื่อลัดวงจร สามารถกดยกก้านรีเซ็ตใหม่ได้',
    },
    {
      id: 'p6',
      title: '6. Wire Sizing (มอก.11-2553)',
      v: 12.0,
      r: 240,
      wireMm2: 2.5,
      breakerA: 30,
      mode: 'BREAKER',
      sw: true,
      desc: 'การเลือกขนาดสายไฟ (IEC-01, VAF, VCT, NYY) จากป้าย Nameplate มอเตอร์ (เช่น 15A × 1.25 = 18.75A → เลือกสาย 2.5 ตร.มม. พิกัด 20A และ CB 30A)',
    },
  ],
  safety: [
    {
      id: 'sf1',
      title: '1. Shock & Body Resistance',
      v: 9.0,
      r: 220,
      light: 35,
      mode: 'SAFETY_GROUND',
      sw: true,
      desc: 'ความรุนแรงของไฟดูดขึ้นกับปริมาณกระแส (mA) ที่ไหลผ่านหัวใจและความต้านทานร่างกาย (ผิวแห้ง ~10,000Ω vs ตัวเปียกน้ำ ~1,000Ω) เลื่อนสไลเดอร์ความชื้นเพื่อเทียบความเสี่ยง',
    },
    {
      id: 'sf2',
      title: '2. Grounding (L-N-G)',
      v: 9.0,
      r: 220,
      light: 60,
      mode: 'SAFETY_GROUND',
      sw: true,
      desc: 'สายดินใช้ฉนวนสีเขียวหรือเขียวสลับเหลือง ต่อโครงโลหะของเครื่องใช้ไฟฟ้าลงหลักดิน ลองสับสวิตช์สายดิน (SW2) เพื่อเทียบแรงดันไฟรั่วที่โครงเครื่องเมื่อมีสายดิน vs ไม่มีสายดิน',
    },
    {
      id: 'sf3',
      title: '3. Lighting & Socket Wiring',
      v: 6.0,
      r: 220,
      mode: 'SPDT',
      sw: true,
      desc: 'มาตรฐานการเดินสายไฟ 1 เฟส: สายมีไฟ L (น้ำตาล) ต้องผ่านฟิวส์และสวิตช์ก่อนเข้าหลอดไฟเสมอ ส่วนสายนิวทรัล N (ฟ้า) ต่อกลับแหล่งจ่าย และเต้ารับต้องมีสายดิน G',
    },
    {
      id: 'sf4',
      title: '4. Troubleshoot: Dead Lamp',
      v: 9.0,
      r: 220,
      fault: 'blown_fuse',
      mode: 'TROUBLESHOOT',
      sw: true,
      desc: 'นักสืบซ่อมวงจร #1: สับสวิตช์แล้วแต่หลอดไฟไม่ติด! คลิกเลือกจุดวัดมัลติมิเตอร์หรือคลิกที่ตัวอุปกรณ์เพื่อตรวจหาว่าชิ้นไหนขาด แล้วกดซ่อมให้ไฟติด',
    },
    {
      id: 'sf5',
      title: '5. Troubleshoot: Dim Lamp',
      v: 9.0,
      r: 220,
      fault: 'high_res_joint',
      mode: 'TROUBLESHOOT',
      sw: true,
      desc: 'นักสืบซ่อมวงจร #2: ขั้วต่อสายไฟหลวมหรือเกิดสนิมทำให้ความต้านทานจุดต่อสูงผิดปกติ แรงดันจึงตกคร่อมที่จุดต่อจนหลอดไฟหรี่ มองหาจุดเสียและกดซ่อมบำรุง',
    },
    {
      id: 'sf6',
      title: '6. Preventive Maintenance',
      v: 9.0,
      r: 220,
      light: 20,
      mode: 'SAFETY_GROUND',
      sw: true,
      desc: 'การบำรุงรักษาเชิงป้องกัน (Preventive Maintenance) เช่น ขันขั้วสายไฟ วัดค่าความต้านทานดิน ตรวจฉนวนสายไฟ และทำความสะอาดพัดลม/เครื่องซักผ้าตามรอบเวลา',
    },
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

const BAND_NAMES_TH = [
  'ดำ',
  'น้ำตาล',
  'แดง',
  'ส้ม',
  'เหลือง',
  'เขียว',
  'น้ำเงิน',
  'ม่วง',
  'เทา',
  'ขาว',
];

export interface ResistorBandInfo {
  band1: { nameTh: string; digit: number; hex: string };
  band2: { nameTh: string; digit: number; hex: string };
  multiplier: { nameTh: string; power: number; label: string; hex: string };
  tolerance: { nameTh: string; label: string; hex: string };
}

export function getResistorBandColors(ohms: number): [string, string, string] {
  const rounded = Math.max(10, Math.round(ohms));
  const str = rounded.toString();
  const d1 = parseInt(str[0], 10) || 0;
  const d2 = parseInt(str[1], 10) || 0;
  const mult = Math.max(0, str.length - 2);
  return [BAND_HEX[d1], BAND_HEX[d2], BAND_HEX[Math.min(9, mult)]];
}

export function decodeResistorBands(ohms: number): ResistorBandInfo {
  const rounded = Math.max(10, Math.round(ohms));
  const str = rounded.toString();
  const d1 = parseInt(str[0], 10) || 0;
  const d2 = parseInt(str[1], 10) || 0;
  const mult = Math.min(9, Math.max(0, str.length - 2));
  const multVal = Math.pow(10, mult);
  const multLabel =
    multVal >= 1000 ? `×${multVal / 1000}k` : `×${multVal}`;

  return {
    band1: { nameTh: BAND_NAMES_TH[d1], digit: d1, hex: BAND_HEX[d1] },
    band2: { nameTh: BAND_NAMES_TH[d2], digit: d2, hex: BAND_HEX[d2] },
    multiplier: {
      nameTh: BAND_NAMES_TH[mult],
      power: mult,
      label: multLabel,
      hex: BAND_HEX[mult],
    },
    tolerance: { nameTh: 'ทอง', label: '±5%', hex: '#d4af37' },
  };
}

export interface PhysicsSimulationState {
  switchClosed: boolean;
  sw2Closed: boolean;
  Vs: number;
  R: number;
  R2?: number;
  C: number;
  Vf: number;
  mode: CircuitTopologyMode;
  Vc: number;
  Vload: number;
  I_mA: number;
  I2_mA: number;
  P_mW: number;
  P2_mW?: number;
  VR1?: number;
  VR2?: number;
  Rb: number;
  hFE: number;
  Ib_uA: number;
  Vb: number;
  lightLevel: number;
  R_ldr: number;
  led1Inserted?: boolean;
  led2Inserted?: boolean;
  resistorWattage?: number;
  wireGaugeMm2?: number;
  breakerRatingA?: number;
  fuseBlown?: boolean;
  breakerTripped?: boolean;
  faultKind?: CircuitFaultKind;
  faultRepaired?: boolean;
  touchVoltage?: number;
  bodyCurrentMa?: number;
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

  const r1 = Math.max(1, s.R);
  const r2 = Math.max(1, s.R2 ?? s.R);
  const led1In = s.led1Inserted !== false;
  const led2In = s.led2Inserted !== false;

  s.R_ldr = Math.round(150 + 49850 * Math.pow(1 - s.lightLevel / 100, 2.4));
  s.I2_mA = 0;
  s.VR1 = 0;
  s.VR2 = 0;
  s.P2_mW = 0;
  s.touchVoltage = 0;
  s.bodyCurrentMa = 0;

  if (s.mode === 'SERIES') {
    const rTot = r1 + r2;
    const vfTot = s.Vf * 2;
    const seriesClosed = s.switchClosed && led1In && led2In && Vin > vfTot;
    s.I_mA = seriesClosed ? ((Vin - vfTot) / rTot) * 1000 : 0;
    s.I2_mA = s.I_mA;
    const iAmp = s.I_mA / 1000;
    s.VR1 = iAmp * r1;
    s.VR2 = iAmp * r2;
    s.Vload = seriesClosed ? Vin : 0;
  } else if (s.mode === 'PARALLEL') {
    s.I_mA = s.switchClosed && led1In && Vin > s.Vf ? ((Vin - s.Vf) / r1) * 1000 : 0;
    s.I2_mA = s.switchClosed && led2In && Vin > s.Vf ? ((Vin - s.Vf) / r2) * 1000 : 0;
    s.VR1 = (s.I_mA / 1000) * r1;
    s.VR2 = (s.I2_mA / 1000) * r2;
    s.Vload = s.switchClosed ? Vin : 0;
  } else if (s.mode === 'VDIV') {
    const vMid = s.switchClosed ? Vin * (r2 / (r1 + r2)) : 0;
    s.Vload = vMid;
    s.VR1 = s.switchClosed ? Vin - vMid : 0;
    s.VR2 = vMid;
    const rThev = (r1 * r2) / (r1 + r2);
    s.I_mA = led1In && vMid > s.Vf ? ((vMid - s.Vf) / Math.max(20, rThev)) * 1000 : 0;
  } else if (s.mode === 'ASTABLE') {
    const freq = 1000 / Math.max(150, s.C * 0.8);
    const phase = Math.sin(s.simTime * Math.PI * 2 * freq);
    s.Vc = Math.abs(phase) * Vin;
    if (s.switchClosed && Vin > s.Vf) {
      const branchCurr1 = led1In ? ((Vin - s.Vf) / r1) * 1000 : 0;
      const branchCurr2 = led2In ? ((Vin - s.Vf) / r2) * 1000 : 0;
      s.I_mA = phase >= 0 ? branchCurr1 : 0.2;
      s.I2_mA = phase < 0 ? branchCurr2 : 0.2;
      s.Vload = phase >= 0 ? Vin : s.Vf * 0.5;
    } else {
      s.I_mA = 0;
      s.I2_mA = 0;
      s.Vload = 0;
    }
  } else if (s.mode === 'AND' || s.mode === 'SPDT') {
    const cond = s.mode === 'AND' ? s.switchClosed && s.sw2Closed : s.switchClosed === s.sw2Closed;
    s.Vload = cond ? Vin : 0;
    s.I_mA = cond && led1In && Vin > s.Vf ? ((Vin - s.Vf) / r1) * 1000 : 0;
  } else if (s.mode === 'NOT') {
    const ledOn = !s.switchClosed;
    s.Ib_uA = s.switchClosed ? ((Vin - 0.7) / s.Rb) * 1e6 : 0;
    s.I_mA = ledOn && led1In && Vin > s.Vf ? ((Vin - s.Vf) / r1) * 1000 : 0;
    s.Vload = ledOn ? Vin : 0.15;
  } else if (s.mode === 'FUSE_TRIP') {
    // SW2 acts as a deliberate Short-Circuit fault branch across the load!
    if (s.fuseBlown) {
      s.I_mA = 0;
      s.I2_mA = 0;
      s.Vload = 0;
    } else if (!s.switchClosed) {
      s.I_mA = 0;
      s.I2_mA = 0;
      s.Vload = 0;
    } else if (!s.sw2Closed) {
      // Normal operation (SW2 open = no short circuit)
      s.I_mA = led1In && Vin > s.Vf ? ((Vin - s.Vf) / r1) * 1000 : 0;
      s.Vload = Vin;
    } else {
      // SW2 closed = direct short-circuit or heavy overload!
      const shortCurrMa = (Vin / Math.max(8, r1 * 0.12)) * 1000;
      s.I_mA = shortCurrMa;
      s.I2_mA = shortCurrMa;
      s.Vload = 0.2;
    }
  } else if (s.mode === 'BREAKER') {
    if (s.breakerTripped || !s.switchClosed) {
      s.I_mA = 0;
      s.Vload = 0;
    } else {
      s.I_mA = led1In && Vin > s.Vf ? ((Vin - s.Vf) / r1) * 1000 : 0;
      s.Vload = Vin;
    }
  } else if (s.mode === 'SAFETY_GROUND') {
    // SW2 = Earth Ground (G) connected when true!
    // lightLevel (0..100%) models moisture / insulation leakage severity
    const normalMa = s.switchClosed && led1In && Vin > s.Vf ? ((Vin - s.Vf) / r1) * 1000 : 0;
    s.I_mA = normalMa;
    s.Vload = s.switchClosed ? Vin : 0;

    if (s.switchClosed) {
      const bodyResistance = Math.max(600, 10000 - s.lightLevel * 92); // Dry 10kΩ down to Wet 800Ω
      const earthGroundConnected = s.sw2Closed;
      if (earthGroundConnected) {
        // Low-impedance 2Ω earth rod shunts leakage safely into the ground!
        s.touchVoltage = Math.min(1.8, (s.lightLevel / 100) * 1.5);
        s.bodyCurrentMa = (s.touchVoltage / bodyResistance) * 1000;
        s.I2_mA = (s.lightLevel / 100) * 28; // Ground fault current flowing down green-yellow G wire
      } else {
        // Un-grounded metal chassis floats up to dangerous line potential!
        const chassisLeakV = 220 * (0.2 + (s.lightLevel / 100) * 0.8);
        s.touchVoltage = chassisLeakV;
        s.bodyCurrentMa = (chassisLeakV / (bodyResistance + 1200)) * 1000;
        s.I2_mA = s.bodyCurrentMa;
      }
    }
  } else if (s.mode === 'TROUBLESHOOT') {
    const fault = s.faultRepaired ? 'none' : (s.faultKind ?? 'blown_fuse');
    if (!s.switchClosed) {
      s.I_mA = 0;
      s.Vload = 0;
    } else if (fault === 'blown_fuse' || fault === 'open_r1' || fault === 'open_ground') {
      s.I_mA = 0;
      s.Vload = fault === 'open_r1' ? Vin : 0;
    } else if (fault === 'high_res_joint') {
      const corrodedR = r1 + 1800;
      s.I_mA = Vin > s.Vf ? ((Vin - s.Vf) / corrodedR) * 1000 : 0;
      s.Vload = s.Vf + (s.I_mA / 1000) * 80;
    } else {
      s.I_mA = led1In && Vin > s.Vf ? ((Vin - s.Vf) / r1) * 1000 : 0;
      s.Vload = Vin;
    }
  } else if (s.mode === 'DC') {
    s.Ib_uA = 0;
    s.Vload = s.switchClosed && led1In && Vin > s.Vf ? Vin : 0;
    s.I_mA = s.switchClosed && led1In && Vin > s.Vf ? ((Vin - s.Vf) / r1) * 1000 : 0;
    s.VR1 = (s.I_mA / 1000) * r1;
  } else if (s.mode === 'BJT') {
    if (s.switchClosed && Vin > 0.7) {
      s.Vb = 0.7;
      const ib_A = (Vin - 0.7) / s.Rb;
      s.Ib_uA = ib_A * 1e6;
      const ic_max_A = Math.max(0, (Vin - s.Vf - 0.1) / r1);
      const ic_A = led1In ? Math.min(ic_max_A, ib_A * s.hFE) : 0;
      s.I_mA = ic_A * 1000;
      s.Vload = s.I_mA > 0.1 ? s.Vf + ic_A * r1 : 0;
    } else {
      s.Vb = 0;
      s.Ib_uA = 0;
      s.I_mA = 0;
      s.Vload = 0;
    }
  } else if (s.mode === 'LDR_DIRECT') {
    s.Ib_uA = 0;
    if (s.switchClosed && led1In && Vin > s.Vf) {
      const totalR = r1 + s.R_ldr * 0.12;
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
        const ic_max_A = Math.max(0, (Vin - s.Vf - 0.1) / r1);
        const ic_A = led1In ? Math.min(ic_max_A, ib_A * s.hFE) : 0;
        s.I_mA = ic_A * 1000;
        s.Vload = s.Vf + ic_A * r1;
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
    const R_ohm = r1;
    const C_farad = Math.max(47, s.C) * 1e-6;
    const R_led_equiv = 180;
    const i_in = s.switchClosed && Vin > s.Vc ? (Vin - s.Vc) / R_ohm : 0;
    const i_load = led1In && s.Vc > s.Vf ? (s.Vc - s.Vf) / R_led_equiv : 0;
    const dVc = ((i_in - i_load) / (C_farad * 450)) * effDt;
    s.Vc = Math.max(0, Math.min(s.Vs, s.Vc + dVc));
    s.Vload = s.Vc;
    s.I_mA = i_load * 1000;
  }

  s.P_mW = Math.pow(s.I_mA / 1000, 2) * r1 * 1000;
  s.P2_mW = Math.pow((s.mode === 'PARALLEL' ? s.I2_mA : s.I_mA) / 1000, 2) * r2 * 1000;
}

export interface StudentLabMission {
  id: string;
  no: number;
  titleTh: string;
  goalTh: string;
  hintTh: string;
  category: ElectronicsCategoryKey;
  lessonIndex: number;
  requireBreadboardWiring?: boolean;
}

export const STUDENT_LAB_MISSIONS: StudentLabMission[] = [
  {
    id: 'm1',
    no: 1,
    titleTh: 'ด่าน 1: โยงสายโฟโต้บอร์ดให้ครบวงจร',
    goalTh: 'คลิกเสียบสายจัมเปอร์บนโฟโต้บอร์ดในโหมด 🎯 ฝึกต่อสายเอง ให้ไฟไหลครบวงจรและหลอด LED สว่าง',
    hintTh: 'โยงสายจากราง +B ไปขาเข้าสวิตช์ และจากขา Cathode ของ LED ลงรางกราวด์ -B',
    category: 'basics',
    lessonIndex: 0,
    requireBreadboardWiring: true,
  },
  {
    id: 'm2',
    no: 2,
    titleTh: 'ด่าน 2: ปรับค่ากฎของโอห์มให้ได้ 18–22 mA',
    goalTh: 'ปรับแรงดัน Vs และตัวต้านทาน R1 ให้กระแสไหลผ่านหลอด LED อยู่ในช่วง 18.0 ถึง 22.0 mA โดยหลอดไม่ขาด',
    hintTh: 'ลองตั้ง Vs = 6.0V และ R1 = 200Ω–220Ω (I = (6 - 1.9) / 200 ≈ 20.5 mA)',
    category: 'basics',
    lessonIndex: 2,
  },
  {
    id: 'm3',
    no: 3,
    titleTh: 'ด่าน 3: วงจรอนุกรม R1 ≠ R2 แบ่งแรงดัน',
    goalTh: 'ในวงจรอนุกรม ตั้งแหล่งจ่าย Vs = 9.0V และปรับ R1 กับ R2 ให้ต่างกันอย่างน้อย 200Ω พร้อมให้ไฟติดทั้ง 2 ดวง',
    hintTh: 'ปรับสไลเดอร์ R1 = 220Ω และ R2 = 470Ω แล้วสังเกตค่า VR1 เทียบกับ VR2',
    category: 'resistors',
    lessonIndex: 2,
  },
  {
    id: 'm4',
    no: 4,
    titleTh: 'ด่าน 4: วงจรขนานแยกกระแส 2 กิ่ง (I1 > I2)',
    goalTh: 'ในวงจรขนาน ปรับค่า R1 ให้มีค่าน้อยกว่าครึ่งหนึ่งของ R2 เพื่อให้กระแสกิ่งที่ 1 (I1) สูงกว่ากิ่งที่ 2 (I2) เกิน 2 เท่า',
    hintTh: 'ตั้ง R1 = 200Ω และ R2 = 500Ω (กระแส I1 จะมากกว่า I2 เป็น 2.5 เท่า)',
    category: 'resistors',
    lessonIndex: 3,
  },
  {
    id: 'm5',
    no: 5,
    titleTh: 'ด่าน 5: เลือกขนาดวัตต์ตัวต้านทานไม่ให้ไหม้',
    goalTh: 'ที่แรงดัน Vs ≥ 10V และ R1 ≤ 150Ω กำลังไฟจะเกิน 250 mW จงเลือกพิกัดตัวต้านทานเป็น 1/2 W หรือ 1 W เพื่อไม่ให้ตัวต้านทานไหม้',
    hintTh: 'คลิกปุ่มเลือกขนาดตัวต้านทาน 1/2 W (500 mW) หรือ 1 W (1000 mW) ในการ์ดปรับค่าด้านล่าง',
    category: 'protection',
    lessonIndex: 0,
  },
  {
    id: 'm6',
    no: 6,
    titleTh: 'ด่าน 6: เลือกขนาดสายไฟ มอก.11-2553 & เบรกเกอร์',
    goalTh: 'เลือกขนาดสายไฟตั้งแต่ 2.5 ตร.มม. ขึ้นไป และตั้งเซอร์กิตเบรกเกอร์ให้ทำงานปกติโดยไม่ทริป',
    hintTh: 'ตามมาตรฐาน มอก.11-2553 วงจรเต้ารับ/มอเตอร์ 15A ต้องใช้สายขนาดอย่างน้อย 2.5 ตร.มม. (พิกัด 20A)',
    category: 'protection',
    lessonIndex: 5,
  },
  {
    id: 'm7',
    no: 7,
    titleTh: 'ด่าน 7: ต่อสายดิน (G) ป้องกันไฟดูด',
    goalTh: 'จำลองสภาพตัวเปียกชื้น (Moisture ≥ 50%) แล้วสับสวิตช์ต่อสายดินสีเขียวแถบเหลือง (G) ให้แรงดันสัมผัสปลอดภัย (< 5V)',
    hintTh: 'เปิดสวิตช์สายดิน (Earth Ground G: CONNECTED) เพื่อให้กระแสรั่วไหลลงหลักดินแทนการไหลผ่านร่างกาย',
    category: 'safety',
    lessonIndex: 1,
  },
  {
    id: 'm8',
    no: 8,
    titleTh: 'ด่าน 8: นักสืบซ่อมวงจร (Troubleshooting)',
    goalTh: 'วงจรนี้มีจุดชำรุดซ่อนอยู่ทำให้ไฟไม่ติดหรือหรี่ผิดปกติ จงตรวจเช็กและกดปุ่มซ่อมจุดเสียให้กระแสกลับมาไหลปกติ (> 10 mA)',
    hintTh: 'คลิกปุ่ม 🔧 ซ่อมจุดชำรุด/เปลี่ยนฟิวส์ เพื่อแก้ไขปัญหาในวงจร',
    category: 'safety',
    lessonIndex: 3,
  },
];
