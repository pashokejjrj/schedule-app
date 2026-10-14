import { describe, it, expect } from 'vitest';
import { generateIcsString } from '../src/services/ics-export';
import type { Lesson, Settings } from '../src/domain/types';
import { DEFAULT_SETTINGS } from '../src/domain/types';

describe('generateIcsString', () => {
  const testSettings: Settings = {
    ...DEFAULT_SETTINGS,
    groupName: 'Тест-Группа',
    semesterStartMonday: '2026-08-31',
    semesterFirstDay: '2026-09-01',
    semesterLastDay: '2026-12-30'
  };

  const lessons: Lesson[] = [
    {
      uid: 'test-1',
      w: 1,
      d: 2, // Tuesday (2026-09-01 is Tuesday, Week 1)
      title: 'Дискретная математика и математическая логика',
      typeClass: 'badge-lecture',
      typeName: 'Лекция',
      start: '08:30',
      end: '10:00',
      room: 'А-401',
      teacher: 'Профессор Иванов И.И.',
      note: 'Принести конспекты'
    }
  ];

  it('generates standard RFC 5545 VCALENDAR header and footer', () => {
    const ics = generateIcsString(lessons, testSettings);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('PRODID:-//Schedule App//RU');
    expect(ics).toContain('END:VCALENDAR');
  });

  it('generates VEVENT with recurring rule INTERVAL=2 and UNTIL', () => {
    const ics = generateIcsString(lessons, testSettings);
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('RRULE:FREQ=WEEKLY;INTERVAL=2;UNTIL=20261230T235959');
    expect(ics).toContain('DTSTART:20260901T083000');
    expect(ics).toContain('DTEND:20260901T100000');
    expect(ics).toContain('END:VEVENT');
  });

  it('folds lines without exceeding 75 octets in UTF-8', () => {
    const ics = generateIcsString(lessons, testSettings);
    const lines = ics.split('\r\n');
    const encoder = new TextEncoder();
    for (const line of lines) {
      expect(encoder.encode(line).length).toBeLessThanOrEqual(75);
    }
  });
});
