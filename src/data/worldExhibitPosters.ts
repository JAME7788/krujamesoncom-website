// โปสเตอร์นิทรรศการประจำโซนในห้องเรียน 3D (สร้างด้วยสกิล /สร้างภาพ เก็บใน Google Drive)
// ไฟล์ต้นฉบับ: G:\My Drive\02_สื่อการสอนและนวัตกรรมการเรียนรู้\สไลด์สอน\ห้องเรียน 3D นิทรรศการ
// ในห้อง 3D ใช้สำเนา JPEG 1280×720 (~200 KB) ใน public/media/expo/ ที่เว็บเสิร์ฟเอง
// เดิมโหลดตรงจาก Drive (ไฟล์ละ ~2 MB) แล้วโดน Google ตอบ 429 เมื่อโหลดหลายภาพพร้อมกัน
// และทั้งห้องเรียนออกเน็ตผ่าน IP เดียวของโรงเรียน ถ้าโหลดไม่ได้ ป้ายจะเหลือแค่กรอบ ฉากไม่พัง

export interface ExhibitPoster {
  /** id ของไฟล์ต้นฉบับขนาดเต็มใน Google Drive */
  fileId: string;
  alt: string;
}

/** key = id ของโซนใน TECH_ZONES หรือ 'team_yard' (ลานสร้างสรรค์รวม) */
export const WORLD_EXHIBIT_POSTERS: Record<string, ExhibitPoster> = {
  zero_to_one: { fileId: '19j_x2NyPx20enwlnpQ6QgQ-y7S7C_1Pv', alt: 'โปสเตอร์ จาก 0 สู่ 1: ทุกภาพ เสียง และเกม คือเลข 0 กับ 1' },
  matrix_cube: { fileId: '1JgfAICPX9mNx53kwL4pZ0Q6R0VUxFEQ2', alt: 'โปสเตอร์ อุโมงค์ไฟ 0 กับ 1: ข้อมูลทุกอย่างไหลเป็นสายเลขฐานสอง' },
  how_computer_works: { fileId: '1iYC74knO7_VuiszSS0ysZVfduDGUlm0U', alt: 'โปสเตอร์ คอมพิวเตอร์ทำงานอย่างไร: รับข้อมูล ประมวลผล จำ และแสดงผล' },
  logic_secret_code: { fileId: '1Li5MXMk4wEfWm0_N74e-ayVSbN5WtTqW', alt: 'โปสเตอร์ ไขรหัสลับด้วยตรรกะ: A=1 B=2 C=3 คิดทีละขั้นแบบอัลกอริทึม' },
  program_software_robodog: { fileId: '1SGxihaoovBtlV_rCD4c9a7pkCRRZx2UI', alt: 'โปสเตอร์ สั่งหุ่นยนต์ด้วยโปรแกรม: คำสั่งชัด ลำดับถูก หุ่นยนต์ก็ทำได้' },
  quantum_computer: { fileId: '1C--Sz02lz40KPzLkQMs_vzAowlhiIhQo', alt: 'โปสเตอร์ คอมพิวเตอร์ควอนตัม: คิวบิตเป็น 0 และ 1 ได้พร้อมกัน' },
  wireless_5g: { fileId: '1Eu4o1sH2QrWIFsCM7BYfNk7UoTJSKcRZ', alt: 'โปสเตอร์ จาก 1G สู่ 5G' },
  green_studio: { fileId: '11ekfHBsHyq8717tzk5RN9wGOIIunLPiJ', alt: 'โปสเตอร์ สตูดิโอกรีนสกรีน: เปลี่ยนฉากหลังได้ด้วยเทคนิคโครมาคีย์' },
  ai_revolution_agentic: { fileId: '1OvNgsfyVBxuDpHG4sHIGkmp58AX2xFE-', alt: 'โปสเตอร์ AI เปลี่ยนโลก: ใช้ AI อย่างฉลาด และรู้เท่าทันดีปเฟก' },
  retro_console_esports: { fileId: '1VKEBfgnw6QH8kra6ojWRrYqxBvOPqj7s', alt: 'โปสเตอร์ เกมเปลี่ยนไป อาชีพเกิดใหม่: จากเกมพิกเซลสู่อีสปอร์ต' },
  team_yard: { fileId: '1VUzcZsQI_2VoNv9o8N5qHPTQPHEUl1Fd', alt: 'โปสเตอร์ ลานสร้างสรรค์รวม: ช่วยกันคิด ช่วยกันสร้าง เมืองแห่งอนาคต' },
};

export const exhibitPosterUrl = (spot: string) => `/media/expo/${spot.replace(/_/g, '-')}.jpg`;
export const exhibitPosterOriginalUrl = (poster: ExhibitPoster) => `https://lh3.googleusercontent.com/d/${poster.fileId}`;
