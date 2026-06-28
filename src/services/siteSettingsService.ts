// ตั้งค่าเว็บ — เก็บใน Firestore settings/site
// ตอนนี้มี: รหัสเข้าระบบ (access code)

import { db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const DEFAULT_CODE = 'ajj';
const LOCAL_KEY = 'krujames_site_settings_v1';

export interface SiteSettings {
  accessCode: string;
  updatedAt: number;
}

const fbAvailable = (): boolean => {
  try { return !!db && !!import.meta.env.VITE_FIREBASE_PROJECT_ID; } catch { return false; }
};

const defaults: SiteSettings = { accessCode: DEFAULT_CODE, updatedAt: 0 };

export const loadSiteSettings = (): SiteSettings => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
};

const saveLocal = (s: SiteSettings) => {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(s)); } catch { /* ignore */ }
};

export const fetchSiteSettingsFromFirebase = async (): Promise<SiteSettings | null> => {
  if (!fbAvailable()) return null;
  try {
    const ref = doc(db, 'settings', 'site');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as SiteSettings;
      const merged = { ...defaults, ...data };
      saveLocal(merged);
      return merged;
    }
  } catch (e) {
    console.debug('siteSettings fetch failed', e);
  }
  return null;
};

export const saveSiteSettings = async (patch: Partial<SiteSettings>): Promise<{ ok: boolean; error?: string }> => {
  const cur = loadSiteSettings();
  const next: SiteSettings = { ...cur, ...patch, updatedAt: Date.now() };
  saveLocal(next);
  if (!fbAvailable()) return { ok: true };   // local only, no Firebase
  try {
    await setDoc(doc(db, 'settings', 'site'), next, { merge: true });
    return { ok: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.warn('saveSiteSettings: firebase write failed', e);
    return { ok: false, error };
  }
};
