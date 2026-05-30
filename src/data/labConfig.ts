// การตั้งค่าห้องคอมพิวเตอร์ — ครูแก้ไขได้ผ่าน Admin Dashboard

const KEY = 'krujames_lab_config_v1';

export interface LabConfig {
  totalComputers: number;       // จำนวนเครื่องทั้งหมด
  workingComputers: number;     // จำนวนเครื่องที่ใช้งานได้จริง (อาจน้อยกว่า total ถ้ามีเสีย)
  notes?: string;               // หมายเหตุ เช่น "เครื่อง #3 จอเสีย"
}

const DEFAULT: LabConfig = {
  totalComputers: 12,
  workingComputers: 12,
  notes: '',
};

export const loadLabConfig = (): LabConfig => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return DEFAULT;
  }
};

export const saveLabConfig = (cfg: LabConfig) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(cfg));
  } catch (e) {
    console.warn('saveLabConfig failed', e);
  }
};

/** จำนวนเครื่องที่ใช้งานได้ — ใช้ในการคำนวณ capacity */
export const getUsableComputers = (): number => {
  const cfg = loadLabConfig();
  return cfg.workingComputers;
};
