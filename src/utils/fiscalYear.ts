export type FiscalYearKey = 'FY26-27' | 'FY27-28' | 'FY28-29' | 'FY29-30' | 'FY30-31';

export interface FiscalMonthDef {
  key: string;        // e.g. "Apr-26"
  shortName: string;  // e.g. "Apr"
  label: string;      // e.g. "April 2026"
  monthNum: number;   // 4 for Apr, 5 for May, ..., 12 for Dec, 1 for Jan, 2 for Feb, 3 for Mar
  year: number;       // e.g. 2026 or 2027
  hasR1: boolean;     // true for Oct through Mar (H2)
}

export interface FiscalYearConfig {
  key: FiscalYearKey;
  label: string;          // e.g. "FY 26-27"
  startYear: number;      // e.g. 2026
  endYear: number;        // e.g. 2027
  startMonthKey: string;  // e.g. "Apr-26"
  endMonthKey: string;    // e.g. "Mar-27"
  startMonthLabel: string;// e.g. "April 2026"
  endMonthLabel: string;  // e.g. "March 2027"
  months: FiscalMonthDef[];
}

const MONTH_NAMES = [
  { short: 'Apr', full: 'April', num: 4, isH2: false },
  { short: 'May', full: 'May', num: 5, isH2: false },
  { short: 'Jun', full: 'June', num: 6, isH2: false },
  { short: 'Jul', full: 'July', num: 7, isH2: false },
  { short: 'Aug', full: 'August', num: 8, isH2: false },
  { short: 'Sep', full: 'September', num: 9, isH2: false },
  { short: 'Oct', full: 'October', num: 10, isH2: true },
  { short: 'Nov', full: 'November', num: 11, isH2: true },
  { short: 'Dec', full: 'December', num: 12, isH2: true },
  { short: 'Jan', full: 'January', num: 1, isH2: true },
  { short: 'Feb', full: 'February', num: 2, isH2: true },
  { short: 'Mar', full: 'March', num: 3, isH2: true },
];

function buildFiscalYearConfig(key: FiscalYearKey, startYear2Digit: number, endYear2Digit: number): FiscalYearConfig {
  const startFullYear = 2000 + startYear2Digit;
  const endFullYear = 2000 + endYear2Digit;

  const months: FiscalMonthDef[] = MONTH_NAMES.map((m) => {
    const isNextYear = m.num >= 1 && m.num <= 3;
    const year2Digit = isNextYear ? endYear2Digit : startYear2Digit;
    const fullYear = isNextYear ? endFullYear : startFullYear;
    return {
      key: `${m.short}-${year2Digit}`,
      shortName: m.short,
      label: `${m.full} ${fullYear}`,
      monthNum: m.num,
      year: fullYear,
      hasR1: m.isH2
    };
  });

  return {
    key,
    label: `FY ${startYear2Digit}-${endYear2Digit}`,
    startYear: startFullYear,
    endYear: endFullYear,
    startMonthKey: months[0].key,
    endMonthKey: months[months.length - 1].key,
    startMonthLabel: months[0].label,
    endMonthLabel: months[months.length - 1].label,
    months
  };
}

export const FISCAL_YEAR_CONFIGS: Record<FiscalYearKey, FiscalYearConfig> = {
  'FY26-27': buildFiscalYearConfig('FY26-27', 26, 27),
  'FY27-28': buildFiscalYearConfig('FY27-28', 27, 28),
  'FY28-29': buildFiscalYearConfig('FY28-29', 28, 29),
  'FY29-30': buildFiscalYearConfig('FY29-30', 29, 30),
  'FY30-31': buildFiscalYearConfig('FY30-31', 30, 31),
};

export const FISCAL_YEAR_KEYS: FiscalYearKey[] = [
  'FY26-27',
  'FY27-28',
  'FY28-29',
  'FY29-30',
  'FY30-31',
];

export const DEFAULT_FISCAL_YEAR: FiscalYearKey = 'FY26-27';

const LOCAL_STORAGE_KEY = 'mrm_selected_fiscal_year';

export function getStoredFiscalYear(): FiscalYearKey {
  if (typeof window === 'undefined') return DEFAULT_FISCAL_YEAR;
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY) as FiscalYearKey;
    if (stored && FISCAL_YEAR_CONFIGS[stored]) {
      return stored;
    }
  } catch (e) {
    // Ignore localStorage errors
  }
  return DEFAULT_FISCAL_YEAR;
}

export function setStoredFiscalYear(fyKey: FiscalYearKey): void {
  if (typeof window === 'undefined') return;
  try {
    if (FISCAL_YEAR_CONFIGS[fyKey]) {
      localStorage.setItem(LOCAL_STORAGE_KEY, fyKey);
      window.dispatchEvent(new CustomEvent('mrm-fiscal-year-changed', { detail: fyKey }));
    }
  } catch (e) {
    // Ignore localStorage errors
  }
}

export function getFiscalYearConfig(fyKey?: string): FiscalYearConfig {
  const resolvedKey = (fyKey && FISCAL_YEAR_CONFIGS[fyKey as FiscalYearKey]) 
    ? (fyKey as FiscalYearKey) 
    : getStoredFiscalYear();
  return FISCAL_YEAR_CONFIGS[resolvedKey];
}

export function getFiscalYearMonthKeys(fyKey?: string): string[] {
  return getFiscalYearConfig(fyKey).months.map(m => m.key);
}

export function getFiscalYearLabel(fyKey?: string): string {
  return getFiscalYearConfig(fyKey).label;
}
