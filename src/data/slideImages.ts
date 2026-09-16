// ระบบสไลด์ภาพประกอบ (เฉพาะภาพที่มีลิขสิทธิ์ถูกต้องหรือภาพที่จัดทำขึ้นเอง)
// ไม่ใช้ภาพสไลด์ของสำนักพิมพ์ภายนอกเพื่อป้องกันการละเมิดลิขสิทธิ์

export const unitSlideImages: Record<string, Record<number, string[]>> = {};

export const getUnitSlideImages = (gradeId: string, unitNumber: number): string[] => {
  return unitSlideImages[gradeId]?.[unitNumber] || [];
};

export const hasUnitSlideImages = (gradeId: string, unitNumber: number): boolean => {
  return (unitSlideImages[gradeId]?.[unitNumber]?.length || 0) > 0;
};
