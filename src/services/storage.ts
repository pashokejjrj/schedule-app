import type { Lesson, Settings } from '../domain/types';
import { DEFAULT_SETTINGS, TYPE_CLASSES, TYPE_NAMES, TIME_RE, DATE_RE } from '../domain/types';

export const STORAGE_KEY_LESSONS = 'schedule_lessons_v1';
export const STORAGE_KEY_SETTINGS = 'schedule_settings_v1';
export const STORAGE_KEY_THEME = 'schedule_theme';
export const STORAGE_KEY_VIEW = 'schedule_view_v1';

export function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function cloneDefaultSettings(): Settings {
  return {
    ...DEFAULT_SETTINGS,
    bells: DEFAULT_SETTINGS.bells.map(b => ({ ...b }))
  };
}

export function cleanStr(value: unknown, max: number): string {
  const s = (typeof value === 'string') ? value : (value == null ? '' : String(value));
  return s.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
}

export function newUid(): string {
  return 'les_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

export const sanitizeString = cleanStr;
export const generateUid = newUid;

export function sanitizeLesson(raw: any): Lesson | null {
  if (!raw || typeof raw !== 'object') return null;
  const w = Number(raw.w);
  const d = Number(raw.d);
  const title = cleanStr(raw.title, 200);
  if (!(w === 1 || w === 2) || !Number.isInteger(d) || d < 1 || d > 6 || !title) return null;
  if (typeof raw.start !== 'string' || typeof raw.end !== 'string') return null;
  if (!TIME_RE.test(raw.start) || !TIME_RE.test(raw.end)) return null;

  const typeClass = TYPE_CLASSES.includes(raw.typeClass) ? raw.typeClass : 'badge-other';
  return {
    uid: (typeof raw.uid === 'string' && /^[\w-]{1,64}$/.test(raw.uid)) ? raw.uid : newUid(),
    w: w as 1 | 2,
    d,
    title,
    typeClass,
    typeName: cleanStr(raw.typeName, 60) || TYPE_NAMES[typeClass] || 'Другое',
    start: raw.start.slice(0, 5),
    end: raw.end.slice(0, 5),
    room: cleanStr(raw.room, 80),
    teacher: cleanStr(raw.teacher, 80),
    note: cleanStr(raw.note, 200)
  };
}

export function sanitizeLessons(list: unknown): Lesson[] {
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const result: Lesson[] = [];
  list.forEach(raw => {
    const lesson = sanitizeLesson(raw);
    if (!lesson) return;
    if (seen.has(lesson.uid)) lesson.uid = newUid();
    seen.add(lesson.uid);
    result.push(lesson);
  });
  return result;
}

export function sanitizeSettings(raw: any): Settings {
  const s = cloneDefaultSettings();
  if (!raw || typeof raw !== 'object') return s;
  if (typeof raw.groupName === 'string' && raw.groupName.trim()) s.groupName = cleanStr(raw.groupName, 60);
  if (typeof raw.groupSubtitle === 'string') s.groupSubtitle = cleanStr(raw.groupSubtitle, 120);
  (['semesterStartMonday', 'semesterFirstDay', 'semesterLastDay'] as const).forEach(key => {
    if (typeof raw[key] === 'string' && DATE_RE.test(raw[key])) s[key] = raw[key];
  });
  if (Array.isArray(raw.bells)) {
    const bells = raw.bells
      .filter((b: any) => b && typeof b.start === 'string' && typeof b.end === 'string' && TIME_RE.test(b.start) && TIME_RE.test(b.end))
      .slice(0, 20)
      .map((b: any, i: number) => ({ start: b.start.slice(0, 5), end: b.end.slice(0, 5), num: i + 1 }));
    if (bells.length) s.bells = bells;
  }
  return s;
}

export function loadSettings(): Settings {
  try {
    const raw = safeGet(STORAGE_KEY_SETTINGS);
    return sanitizeSettings(raw ? JSON.parse(raw) : null);
  } catch (e) {
    console.error('Failed to load settings:', e);
    return cloneDefaultSettings();
  }
}

export function loadLessons(): Lesson[] {
  try {
    const raw = safeGet(STORAGE_KEY_LESSONS);
    return raw ? sanitizeLessons(JSON.parse(raw)) : [];
  } catch (e) {
    console.error('Failed to load lessons:', e);
    return [];
  }
}

export function loadViewMode(): 'day' | 'week' {
  return safeGet(STORAGE_KEY_VIEW) === 'week' ? 'week' : 'day';
}

export function loadTheme(): 'light' | 'dark' | 'auto' {
  const saved = safeGet(STORAGE_KEY_THEME);
  if (saved === 'dark' || saved === 'light') return saved;
  return 'auto';
}

export function saveLessons(lessons: Lesson[]): boolean {
  return safeSet(STORAGE_KEY_LESSONS, JSON.stringify(lessons));
}

export function saveSettings(settings: Settings): boolean {
  return safeSet(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
}

export function saveTheme(theme: string): boolean {
  return safeSet(STORAGE_KEY_THEME, theme);
}

export function saveViewMode(view: 'day' | 'week'): boolean {
  return safeSet(STORAGE_KEY_VIEW, view);
}
