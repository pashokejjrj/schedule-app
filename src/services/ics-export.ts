import type { Lesson, Settings } from '../domain/types';
import { addDays, formatDateISO, getMondayOf, parseDateString } from '../domain/parity';

export function safeFileName(name: string): string {
  return String(name || '').replace(/[\/:*?"<>|\u0000-\u001f]+/g, '_').replace(/\s+/g, '_').slice(0, 60) || 'schedule';
}

export function utcStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function escapeIcsText(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\;')
    .replace(/,/g, '\,')
    .replace(/\r?\n/g, '\n');
}

/* RFC 5545: lines are folded at 75 OCTETS (Cyrillic is 2 bytes per letter). */
export function foldIcsLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;
  const parts: string[] = [];
  let current = '';
  let bytes = 0;
  let limit = 75;
  for (const ch of line) {
    const size = encoder.encode(ch).length;
    if (bytes + size > limit) {
      parts.push(current);
      current = '';
      bytes = 0;
      limit = 74; // continuation lines start with one space
    }
    current += ch;
    bytes += size;
  }
  parts.push(current);
  return parts.join('\r\n ');
}

export function downloadFile(content: string, fileName: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function generateICS(lessons: Lesson[], settings: Settings): { icsContent: string; exportedCount: number } {
  let timeZone = 'Europe/Moscow';
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || timeZone;
  } catch {
    // keep default
  }

  const baseMonday = getMondayOf(parseDateString(settings.semesterStartMonday));
  const semesterFirst = parseDateString(settings.semesterFirstDay);
  const semesterLast = parseDateString(settings.semesterLastDay);
  const untilStr = formatDateISO(semesterLast).replace(/-/g, '') + 'T235959';
  const stamp = utcStamp(new Date());

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Schedule App//RU',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(settings.groupName)}`,
    `X-WR-TIMEZONE:${timeZone}`
  ];

  let exported = 0;
  lessons.forEach(l => {
    const description = [
      `Тип: ${l.typeName || ''}`,
      l.teacher ? `Преподаватель: ${l.teacher}` : '',
      l.note ? `Примечание: ${l.note}` : ''
    ].filter(Boolean).join('\n');

    if (l.dates && l.dates.length > 0) {
      l.dates.forEach(dt => {
        const dateObj = parseDateString(dt);
        if (dateObj < semesterFirst || dateObj > semesterLast) return;
        const datePart = dt.replace(/-/g, '');
        lines.push('BEGIN:VEVENT');
        lines.push(`UID:${l.uid}-${datePart}@claude-schedule.local`);
        lines.push(`DTSTAMP:${stamp}`);
        lines.push(`DTSTART:${datePart}T${l.start.replace(':', '')}00`);
        lines.push(`DTEND:${datePart}T${l.end.replace(':', '')}00`);
        lines.push(`SUMMARY:${escapeIcsText(l.title + (l.typeName ? ' (' + l.typeName + ')' : ''))}`);
        if (l.room) lines.push(`LOCATION:${escapeIcsText(l.room)}`);
        lines.push(`DESCRIPTION:${escapeIcsText(description)}`);
        lines.push('END:VEVENT');
        exported++;
      });
      return;
    }

    let occurrence = addDays(baseMonday, (l.w === 1 ? 0 : 7) + (l.d - 1));
    while (occurrence < semesterFirst) occurrence = addDays(occurrence, 14);
    if (occurrence > semesterLast) return;

    const datePart = formatDateISO(occurrence).replace(/-/g, '');

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${l.uid}@claude-schedule.local`);
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(`DTSTART:${datePart}T${l.start.replace(':', '')}00`);
    lines.push(`DTEND:${datePart}T${l.end.replace(':', '')}00`);
    lines.push(`RRULE:FREQ=WEEKLY;INTERVAL=2;UNTIL=${untilStr}`);
    lines.push(`SUMMARY:${escapeIcsText(l.title + (l.typeName ? ' (' + l.typeName + ')' : ''))}`);
    if (l.room) lines.push(`LOCATION:${escapeIcsText(l.room)}`);
    lines.push(`DESCRIPTION:${escapeIcsText(description)}`);
    lines.push('END:VEVENT');
    exported++;
  });

  lines.push('END:VCALENDAR');

  const icsContent = lines.map(foldIcsLine).join('\r\n') + '\r\n';
  return { icsContent, exportedCount: exported };
}

export function exportICS(lessons: Lesson[], settings: Settings): { success: boolean; count: number; error?: string } {
  if (lessons.length === 0) {
    return { success: false, count: 0, error: 'В расписании нет пар для экспорта' };
  }

  const { icsContent, exportedCount } = generateICS(lessons, settings);
  if (exportedCount === 0) {
    return { success: false, count: 0, error: 'Ни одна пара не попадает в даты семестра — проверьте настройки' };
  }

  downloadFile(icsContent, `schedule-${safeFileName(settings.groupName)}.ics`, 'text/calendar;charset=utf-8');
  return { success: true, count: exportedCount };
}

export function generateIcsString(lessons: Lesson[], settings: Settings): string {
  return generateICS(lessons, settings).icsContent;
}
