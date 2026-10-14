import { describe, it, expect } from 'vitest';
import { startOfDay, addDays, parseDateString, formatDateISO, isoWeekday, getMondayOf, calculateParityForDate } from '../src/domain/parity';

describe('parity domain logic', () => {
  it('startOfDay clears time component', () => {
    const d = new Date(2026, 8, 1, 15, 30, 45);
    const start = startOfDay(d);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);
    expect(start.getMilliseconds()).toBe(0);
  });

  it('addDays correctly shifts days', () => {
    const d = new Date(2026, 8, 1);
    const next = addDays(d, 5);
    expect(next.getDate()).toBe(6);
    const prev = addDays(d, -1);
    expect(prev.getDate()).toBe(31);
  });

  it('parseDateString and formatDateISO work reciprocally', () => {
    const dateStr = '2026-09-15';
    const parsed = parseDateString(dateStr);
    expect(formatDateISO(parsed)).toBe(dateStr);
  });

  it('isoWeekday returns 1 for Monday and 7 for Sunday', () => {
    // 2026-08-31 is Monday
    const monday = new Date(2026, 7, 31);
    expect(isoWeekday(monday)).toBe(1);
    // 2026-09-06 is Sunday
    const sunday = new Date(2026, 8, 6);
    expect(isoWeekday(sunday)).toBe(7);
  });

  it('getMondayOf returns the Monday of the date week', () => {
    // Wednesday 2026-09-02
    const wed = new Date(2026, 8, 2);
    const mon = getMondayOf(wed);
    expect(formatDateISO(mon)).toBe('2026-08-31');
    // Sunday 2026-09-06
    const sun = new Date(2026, 8, 6);
    expect(formatDateISO(getMondayOf(sun))).toBe('2026-08-31');
  });

  it('calculateParityForDate alternates 1 and 2 weeks', () => {
    const baseMon = '2026-08-31';
    // Week 1: 2026-08-31 to 2026-09-06
    expect(calculateParityForDate(new Date(2026, 7, 31), baseMon)).toBe(1);
    expect(calculateParityForDate(new Date(2026, 8, 3), baseMon)).toBe(1);
    expect(calculateParityForDate(new Date(2026, 8, 6), baseMon)).toBe(1);

    // Week 2: 2026-09-07 to 2026-09-13
    expect(calculateParityForDate(new Date(2026, 8, 7), baseMon)).toBe(2);
    expect(calculateParityForDate(new Date(2026, 8, 13), baseMon)).toBe(2);

    // Week 1 again: 2026-09-14
    expect(calculateParityForDate(new Date(2026, 8, 14), baseMon)).toBe(1);
  });
});
