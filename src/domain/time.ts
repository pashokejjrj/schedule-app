import { TIME_RE, DATE_RE } from './types';

export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToTime(total: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, total));
  const hours = String(Math.floor(clamped / 60)).padStart(2, '0');
  const minutes = String(clamped % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatSeconds(totalSec: number): string {
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return [hours, minutes, seconds].map(n => String(n).padStart(2, '0')).join(':');
}

export function isValidTime(timeStr: string): boolean {
  return typeof timeStr === 'string' && TIME_RE.test(timeStr);
}

export function isValidDate(dateStr: string): boolean {
  return typeof dateStr === 'string' && DATE_RE.test(dateStr);
}

export function isTimeRangeValid(start: string, end: string): boolean {
  if (!isValidTime(start) || !isValidTime(end)) return false;
  return timeToMinutes(end) > timeToMinutes(start);
}
