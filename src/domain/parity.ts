import { DAY_MS, DATE_RE, type WeekParity } from './types';

export function startOfDay(d: Date | string | number): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date | string | number, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function parseDateString(str: string): Date {
  if (typeof str !== 'string' || !DATE_RE.test(str)) return startOfDay(new Date());
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isoWeekday(d: Date): number {
  const day = d.getDay();
  return day === 0 ? 7 : day; // 1 = Monday ... 7 = Sunday
}

export function getMondayOf(d: Date): Date {
  return addDays(startOfDay(d), 1 - isoWeekday(d));
}

export function calculateParityForDate(d: Date, semesterStartMonday: string): WeekParity {
  const baseMon = getMondayOf(parseDateString(semesterStartMonday));
  const targetMon = getMondayOf(d);
  const daysDiff = Math.round((targetMon.getTime() - baseMon.getTime()) / DAY_MS);
  const weeksDiff = Math.round(daysDiff / 7);
  return (((weeksDiff % 2) + 2) % 2 === 0) ? 1 : 2;
}
