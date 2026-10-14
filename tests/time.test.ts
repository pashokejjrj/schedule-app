import { describe, it, expect } from 'vitest';
import { timeToMinutes, minutesToTime, formatSeconds, isValidTime, isValidDate, isTimeRangeValid } from '../src/domain/time';

describe('time domain logic', () => {
  it('timeToMinutes converts HH:MM to total minutes', () => {
    expect(timeToMinutes('00:00')).toBe(0);
    expect(timeToMinutes('08:30')).toBe(510);
    expect(timeToMinutes('10:10')).toBe(610);
    expect(timeToMinutes('23:59')).toBe(1439);
    expect(timeToMinutes('')).toBe(0);
  });

  it('minutesToTime converts total minutes to HH:MM format', () => {
    expect(minutesToTime(0)).toBe('00:00');
    expect(minutesToTime(510)).toBe('08:30');
    expect(minutesToTime(610)).toBe('10:10');
    expect(minutesToTime(1439)).toBe('23:59');
    expect(minutesToTime(-10)).toBe('00:00');
    expect(minutesToTime(2000)).toBe('23:59');
  });

  it('formatSeconds formats seconds to HH:MM:SS', () => {
    expect(formatSeconds(0)).toBe('00:00:00');
    expect(formatSeconds(59)).toBe('00:00:59');
    expect(formatSeconds(65)).toBe('00:01:05');
    expect(formatSeconds(3661)).toBe('01:01:01');
  });

  it('isValidTime validates time strings', () => {
    expect(isValidTime('08:30')).toBe(true);
    expect(isValidTime('23:59')).toBe(true);
    expect(isValidTime('00:00:00')).toBe(true);
    expect(isValidTime('24:00')).toBe(false);
    expect(isValidTime('8:30')).toBe(false);
    expect(isValidTime('invalid')).toBe(false);
  });

  it('isValidDate validates YYYY-MM-DD', () => {
    expect(isValidDate('2026-09-01')).toBe(true);
    expect(isValidDate('2026-12-31')).toBe(true);
    expect(isValidDate('01-09-2026')).toBe(false);
    expect(isValidDate('2026/09/01')).toBe(false);
  });

  it('isTimeRangeValid checks start before end', () => {
    expect(isTimeRangeValid('08:30', '10:00')).toBe(true);
    expect(isTimeRangeValid('10:00', '08:30')).toBe(false);
    expect(isTimeRangeValid('10:00', '10:00')).toBe(false);
    expect(isTimeRangeValid('invalid', '10:00')).toBe(false);
  });
});
