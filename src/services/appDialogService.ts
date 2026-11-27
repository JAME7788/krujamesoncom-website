// ศูนย์กลาง Dialog / Notification แทน alert(), confirm(), prompt() ของเบราว์เซอร์
// ทำให้ทั้งฝั่งนักเรียนและครูมี UI กลมกลืนทั้งโหมดสว่างและโหมดมืด

export type DialogKind = 'confirm' | 'prompt';
export type NotifyTone = 'success' | 'error' | 'info';

export interface AppDialogRequest {
  id: number;
  kind: DialogKind;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  defaultValue?: string;
  placeholder?: string;
  resolve: (value: boolean | string | null) => void;
}

type DialogListener = (req: AppDialogRequest) => void;
type NotifyListener = (message: string, tone: NotifyTone) => void;

let dialogListener: DialogListener | null = null;
let notifyListener: NotifyListener | null = null;
let nextId = 1;

export const registerAppDialogHost = (
  onDialog: DialogListener | null,
  onNotify: NotifyListener | null,
) => {
  dialogListener = onDialog;
  notifyListener = onNotify;
};

const inferTone = (message: string): NotifyTone => {
  const m = message.trim();
  if (/❌|⚠️|ไม่สำเร็จ|ไม่สามารถ|ผิดพลาด|ไม่ถูกต้อง|กรุณา|ไม่พบ|ห้าม|ต้องใส่|ต้องเลือก|เกินกำหนด/.test(m)) {
    return 'error';
  }
  if (/✅|🎉|สำเร็จ|เรียบร้อย|คัดลอก|บันทึกแล้ว|อัปเดต|ส่งงาน/.test(m)) {
    return 'success';
  }
  return 'info';
};

const inferDanger = (message: string): boolean => {
  return /ลบ|ล้าง|รีเซ็ต|ถาวร|ยกเลิกสิทธิ์|เคลียร์|delete|reset/i.test(message);
};

/** แจ้งเตือนแทน alert() — แสดงผ่าน Toast ทันสมัย ไม่ล็อกหน้าจอ */
export const appAlert = (message: string, tone?: NotifyTone): void => {
  const clean = String(message ?? '').trim();
  if (!clean) return;
  if (notifyListener) {
    notifyListener(clean, tone ?? inferTone(clean));
    return;
  }
  if (typeof window !== 'undefined' && typeof window.alert === 'function') {
    window.alert(clean);
  }
};

/** กล่องยืนยันแทน confirm() — คืนค่า Promise<boolean> */
export const appConfirm = (
  message: string,
  options?: { title?: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean },
): Promise<boolean> => {
  const clean = String(message ?? '').trim();
  if (!dialogListener) {
    if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
      return Promise.resolve(window.confirm(clean));
    }
    return Promise.resolve(false);
  }
  const danger = options?.danger ?? inferDanger(clean);
  return new Promise<boolean>((resolve) => {
    dialogListener?.({
      id: nextId++,
      kind: 'confirm',
      title: options?.title ?? (danger ? 'ยืนยันการดำเนินการ' : 'ยืนยันรายการ'),
      message: clean,
      confirmLabel: options?.confirmLabel ?? (danger ? 'ยืนยัน' : 'ตกลง'),
      cancelLabel: options?.cancelLabel ?? 'ยกเลิก',
      danger,
      resolve: (val) => resolve(Boolean(val)),
    });
  });
};

/** กล่องรับข้อความแทน prompt() — คืนค่า Promise<string | null> */
export const appPrompt = (
  message: string,
  defaultValue = '',
  options?: { title?: string; confirmLabel?: string; cancelLabel?: string; placeholder?: string },
): Promise<string | null> => {
  const clean = String(message ?? '').trim();
  if (!dialogListener) {
    if (typeof window !== 'undefined' && typeof window.prompt === 'function') {
      return Promise.resolve(window.prompt(clean, defaultValue));
    }
    return Promise.resolve(null);
  }
  return new Promise<string | null>((resolve) => {
    dialogListener?.({
      id: nextId++,
      kind: 'prompt',
      title: options?.title ?? 'กรอกข้อมูล',
      message: clean,
      defaultValue,
      placeholder: options?.placeholder ?? '',
      confirmLabel: options?.confirmLabel ?? 'ตกลง',
      cancelLabel: options?.cancelLabel ?? 'ยกเลิก',
      resolve: (val) => resolve(typeof val === 'string' ? val : null),
    });
  });
};
