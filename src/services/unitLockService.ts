import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { isAdminAuthed } from './authAdmin';
import { db } from './firebase';

const KEY = 'krujames_unlocked_units_v1';
const LOCK_DOC = doc(db, 'schedule', 'unitLocks');

export type UnitUnlockMap = Record<string, number[]>;

const normalizeUnlockedUnits = (value: unknown): UnitUnlockMap => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  const normalized: UnitUnlockMap = {};
  Object.entries(value as Record<string, unknown>).forEach(([courseId, rawUnits]) => {
    if (!Array.isArray(rawUnits)) return;

    const units = rawUnits
      .map((item) => Number(item))
      .filter((item) => Number.isInteger(item) && item > 0);

    normalized[courseId] = Array.from(new Set(units)).sort((a, b) => a - b);
  });

  return normalized;
};

const loadLocalUnlockedUnits = (): UnitUnlockMap => {
  try {
    const raw = localStorage.getItem(KEY);
    return normalizeUnlockedUnits(raw ? JSON.parse(raw) : {});
  } catch {
    return {};
  }
};

const saveLocalUnlockedUnits = (data: UnitUnlockMap) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(normalizeUnlockedUnits(data)));
  } catch (e) {
    console.warn('save local unit locks failed', e);
  }
};

export const getUnlockedUnits = (): UnitUnlockMap => loadLocalUnlockedUnits();

export const fetchUnlockedUnits = async (): Promise<UnitUnlockMap> => {
  try {
    const snap = await getDoc(LOCK_DOC);

    if (snap.exists()) {
      const data = snap.data();
      const remote = normalizeUnlockedUnits(data.unlockedUnits);
      saveLocalUnlockedUnits(remote);
      return remote;
    }

    const local = loadLocalUnlockedUnits();
    if (Object.keys(local).length > 0) {
      await saveUnlockedUnits(local);
    }
    return local;
  } catch (e) {
    console.warn('fetch unit locks failed, using local cache', e);
    return loadLocalUnlockedUnits();
  }
};

export const saveUnlockedUnits = async (data: UnitUnlockMap): Promise<UnitUnlockMap> => {
  const normalized = normalizeUnlockedUnits(data);
  saveLocalUnlockedUnits(normalized);

  await setDoc(
    LOCK_DOC,
    {
      unlockedUnits: normalized,
      updatedAt: Date.now(),
    },
    { merge: true },
  );

  return normalized;
};

export const subscribeUnlockedUnits = (
  onChange: (data: UnitUnlockMap) => void,
  onError?: (error: unknown) => void,
) => {
  return onSnapshot(
    LOCK_DOC,
    (snap) => {
      if (!snap.exists()) {
        onChange(loadLocalUnlockedUnits());
        return;
      }

      const remote = normalizeUnlockedUnits(snap.data().unlockedUnits);
      saveLocalUnlockedUnits(remote);
      onChange(remote);
    },
    (error) => {
      console.warn('unit lock subscription failed', error);
      onError?.(error);
    },
  );
};

export const isUnitLocked = (
  gradeId: string,
  unitNo: number,
  unlockedUnits: UnitUnlockMap = loadLocalUnlockedUnits(),
): boolean => {
  if (isAdminAuthed()) return false;
  if (unitNo === 1) return false;

  const list = unlockedUnits[gradeId] || [];
  return !list.includes(unitNo);
};

export const toggleUnitLock = async (
  gradeId: string,
  unitNo: number,
  unlock: boolean,
): Promise<UnitUnlockMap> => {
  const unlocked = await fetchUnlockedUnits();
  const current = unlocked[gradeId] || [];

  const nextUnits = unlock
    ? Array.from(new Set([...current, unitNo]))
    : current.filter((no) => no !== unitNo);

  return saveUnlockedUnits({
    ...unlocked,
    [gradeId]: nextUnits,
  });
};
