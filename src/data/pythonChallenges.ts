// โจทย์ Python สำหรับเด็ก — เรียงจากง่ายไปยาก
// ตรวจคำตอบด้วยการเทียบผลลัพธ์ (stdout) กับ expectedOutput

export interface PyChallenge {
  id: string;
  level: 'ง่าย' | 'ปานกลาง' | 'ท้าทาย';
  title: string;
  desc: string;         // โจทย์
  starter: string;      // โค้ดตั้งต้น
  expectedOutput: string; // ผลลัพธ์ที่ถูกต้อง (เทียบแบบ trim ต่อบรรทัด)
  hint: string;
  xp: number;
}

export const PY_CHALLENGES: PyChallenge[] = [
  {
    id: 'greet',
    level: 'ง่าย',
    title: 'ทักทายครั้งแรก',
    desc: 'สั่งให้โปรแกรมพิมพ์คำว่า  สวัสดีครับ  ออกมา',
    starter: '# พิมพ์คำว่า สวัสดีครับ\nprint()',
    expectedOutput: 'สวัสดีครับ',
    hint: 'ใส่ข้อความในเครื่องหมายคำพูด เช่น print("สวัสดีครับ")',
    xp: 10,
  },
  {
    id: 'add',
    level: 'ง่าย',
    title: 'บวกเลข',
    desc: 'พิมพ์ผลลัพธ์ของ  5 + 3  ออกมา (ต้องได้ 8)',
    starter: '# พิมพ์ผลบวก 5 + 3\nprint()',
    expectedOutput: '8',
    hint: 'พิมพ์ print(5 + 3) — ไม่ต้องใส่เครื่องหมายคำพูดรอบตัวเลข',
    xp: 10,
  },
  {
    id: 'variable',
    level: 'ง่าย',
    title: 'อายุปีหน้า',
    desc: 'มีตัวแปร age = 12 อยู่แล้ว จงพิมพ์อายุปีหน้า (บวกอีก 1 → ต้องได้ 13)',
    starter: 'age = 12\n# พิมพ์อายุปีหน้า\nprint()',
    expectedOutput: '13',
    hint: 'ใช้ตัวแปรได้เลย เช่น print(age + 1)',
    xp: 15,
  },
  {
    id: 'count',
    level: 'ปานกลาง',
    title: 'นับ 1 ถึง 5',
    desc: 'ใช้การวนซ้ำ (for) พิมพ์เลข 1, 2, 3, 4, 5 ทีละบรรทัด',
    starter: '# วนพิมพ์เลข 1 ถึง 5\nfor i in range(1, 6):\n    print()',
    expectedOutput: '1\n2\n3\n4\n5',
    hint: 'ในวงวนใส่ print(i) — range(1, 6) จะได้ 1,2,3,4,5',
    xp: 20,
  },
  {
    id: 'sum10',
    level: 'ปานกลาง',
    title: 'ผลรวม 1 ถึง 10',
    desc: 'หาผลรวมของเลข 1 ถึง 10 แล้วพิมพ์ออกมา (ต้องได้ 55)',
    starter: 'total = 0\nfor i in range(1, 11):\n    # บวก i เข้า total\n    pass\nprint(total)',
    expectedOutput: '55',
    hint: 'ในวงวนใช้ total = total + i (หรือ total += i) แล้วลบ pass ออก',
    xp: 25,
  },
  {
    id: 'evenodd',
    level: 'ปานกลาง',
    title: 'คู่หรือคี่',
    desc: 'มีตัวแปร n = 7 จงพิมพ์คำว่า คี่ ถ้าเป็นเลขคี่ หรือ คู่ ถ้าเป็นเลขคู่ (n=7 → คี่)',
    starter: 'n = 7\n# ตรวจว่า n คู่หรือคี่\nif :\n    print("คู่")\nelse:\n    print("คี่")',
    expectedOutput: 'คี่',
    hint: 'เลขคู่คือหารด้วย 2 ลงตัว → if n % 2 == 0:',
    xp: 25,
  },
  {
    id: 'multiply',
    level: 'ท้าทาย',
    title: 'สูตรคูณแม่ 2',
    desc: 'พิมพ์สูตรคูณแม่ 2 ตั้งแต่ 2×1 ถึง 2×5 (ผลลัพธ์: 2, 4, 6, 8, 10 ทีละบรรทัด)',
    starter: '# พิมพ์ 2, 4, 6, 8, 10\nfor i in range(1, 6):\n    print()',
    expectedOutput: '2\n4\n6\n8\n10',
    hint: 'ผลคูณคือ 2 * i เช่น print(2 * i)',
    xp: 30,
  },
];
