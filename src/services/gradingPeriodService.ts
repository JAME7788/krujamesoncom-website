export interface GradingPeriod {
  academicYear: string;
  term: '1' | '2';
}

export const DEFAULT_GRADING_PERIOD: GradingPeriod = { academicYear: '2569', term: '1' };
const STORAGE_KEY = 'krujames_active_grading_period_v1';

const normalizeYear = (value: unknown): string => {
  const year = String(value ?? '').trim();
  return /^\d{4}$/.test(year) ? year : DEFAULT_GRADING_PERIOD.academicYear;
};

export const getActiveGradingPeriod = (): GradingPeriod => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as Partial<GradingPeriod> | null;
    return {
      academicYear: normalizeYear(parsed?.academicYear),
      term: parsed?.term === '2' ? '2' : '1',
    };
  } catch {
    return { ...DEFAULT_GRADING_PERIOD };
  }
};

export const setActiveGradingPeriod = (period: GradingPeriod): GradingPeriod => {
  const normalized: GradingPeriod = {
    academicYear: normalizeYear(period.academicYear),
    term: period.term === '2' ? '2' : '1',
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('grading-period-changed', { detail: normalized }));
  }
  return normalized;
};

export const gradingPeriodKey = (period = getActiveGradingPeriod()): string => (
  `${period.academicYear}_t${period.term}`
);

export const isLegacyDefaultPeriod = (period = getActiveGradingPeriod()): boolean => (
  period.academicYear === DEFAULT_GRADING_PERIOD.academicYear && period.term === DEFAULT_GRADING_PERIOD.term
);
