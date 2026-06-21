// Backup/Restore ระบบทั้งหมด — Export/Import JSON
//
// เก็บข้อมูล localStorage ทั้งหมดที่ขึ้นต้นด้วย 'krujames_'
// + current_student, current_partner

const PREFIXES = ['krujames_', 'current_student', 'current_partner', 'kj_'];

export interface BackupData {
  version: string;
  exportedAt: string;
  data: Record<string, string>;
  counts: {
    grades: number;
    progress: number;
    achievements: number;
    announcements: number;
    events: number;
    courses: number;
    errors: number;
    others: number;
  };
}

const matchesPrefix = (key: string) => PREFIXES.some((p) => key.startsWith(p));

export const exportBackup = (): BackupData => {
  const data: Record<string, string> = {};
  const counts = {
    grades: 0, progress: 0, achievements: 0,
    announcements: 0, events: 0, courses: 0,
    errors: 0, others: 0,
  };

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !matchesPrefix(key)) continue;
    const value = localStorage.getItem(key);
    if (value === null) continue;
    data[key] = value;

    if (key.includes('grades')) counts.grades += 1;
    else if (key.includes('progress')) counts.progress += 1;
    else if (key.includes('achievements')) counts.achievements += 1;
    else if (key.includes('announcement')) counts.announcements += 1;
    else if (key.includes('calendar')) counts.events += 1;
    else if (key.includes('course')) counts.courses += 1;
    else if (key.includes('error')) counts.errors += 1;
    else counts.others += 1;
  }

  return {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    data,
    counts,
  };
};

export const downloadBackup = () => {
  const backup = exportBackup();
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  a.download = `krujames-backup-${ts}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
}

export const importBackup = (json: string, mode: 'replace' | 'merge' = 'merge'): ImportResult => {
  const result: ImportResult = { success: false, imported: 0, errors: [] };
  try {
    const backup: BackupData = JSON.parse(json);
    if (!backup.data || typeof backup.data !== 'object') {
      result.errors.push('รูปแบบ backup ไม่ถูกต้อง');
      return result;
    }

    if (mode === 'replace') {
      // Clear existing krujames_ keys
      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && matchesPrefix(key)) toRemove.push(key);
      }
      toRemove.forEach((k) => localStorage.removeItem(k));
    }

    Object.entries(backup.data).forEach(([key, value]) => {
      try {
        localStorage.setItem(key, value);
        result.imported += 1;
      } catch (e) {
        result.errors.push(`${key}: ${e}`);
      }
    });

    result.success = result.imported > 0;
    return result;
  } catch (e) {
    result.errors.push(`Parse error: ${e}`);
    return result;
  }
};

/** ลบข้อมูลทั้งหมด (factory reset) */
export const resetAll = () => {
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && matchesPrefix(key)) toRemove.push(key);
  }
  toRemove.forEach((k) => localStorage.removeItem(k));
};
