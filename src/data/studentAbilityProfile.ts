export const scorePercent = (scores: Record<string, number>, categoryCount: number): number => {
  if (categoryCount <= 0) return 0;
  const total = Object.values(scores).reduce(
    (sum, score) => sum + Math.max(0, Math.min(3, Number(score) || 0)),
    0,
  );
  return Math.round((total / (categoryCount * 3)) * 100);
};
/** กระจายคะแนนรวมตามโปรไฟล์ไปยังแต่ละด้าน โดยสลับด้านที่ควรเสริมไม่ให้ทุกแบบเหมือนกัน */
export const buildAbilityScores = (
  categoryIds: string[],
  targetPercent: number,
  rotation = 0,
): Record<string, number> => {
  if (categoryIds.length === 0) return {};
  const maxTotal = categoryIds.length * 3;
  const targetTotal = Math.max(0, Math.min(maxTotal, Math.round((targetPercent / 100) * maxTotal)));
  const scores = Array<number>(categoryIds.length).fill(3);
  let deficit = maxTotal - targetTotal;
  let cursor = Math.abs(rotation) % categoryIds.length;

  while (deficit > 0) {
    if (scores[cursor] > 0) {
      scores[cursor] -= 1;
      deficit -= 1;
    }
    cursor = (cursor + 1) % categoryIds.length;
  }

  return Object.fromEntries(categoryIds.map((categoryId, index) => [categoryId, scores[index]]));
};

export const abilityProfileCopy = (percent: number) => {
  if (percent >= 87) {
    return {
      note: 'แสดงความสามารถในระดับดี มีพื้นฐานพร้อมและทำงานตามวัยได้สม่ำเสมอ',
      supportPlan: 'ให้ภารกิจต่อยอดและบทบาทช่วยอธิบายแนวคิดหรือขั้นตอนแก่เพื่อน',
    };
  }
  if (percent >= 70) {
    return {
      note: 'แสดงความสามารถได้ดี โดยมีบางด้านที่ควรฝึกซ้ำและติดตามระหว่างกิจกรรม',
      supportPlan: 'ใช้คำใบ้ทีละขั้น จัดคู่ช่วยเรียน และตรวจความเข้าใจระหว่างคาบ',
    };
  }
  if (percent >= 40) {
    return {
      note: 'แสดงความสามารถได้บางส่วน ควรได้รับการช่วยเหลือและเวลาฝึกเพิ่ม',
      supportPlan: 'แบ่งงานเป็นขั้นสั้น ใช้ตัวอย่างใกล้ตัว ฝึกซ้ำ และติดตามรายบุคคล',
    };
  }
  return {
    note: 'ควรวางแผนช่วยเหลือรายบุคคลและติดตามพัฒนาการอย่างใกล้ชิด',
    supportPlan: 'ทบทวนพื้นฐานแบบตัวต่อตัว ใช้สื่อรูปธรรม และประเมินซ้ำหลังการช่วยเหลือ',
  };
};
