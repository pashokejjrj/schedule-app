export type WeekParity = 1 | 2;

export interface BellItem {
  start: string;
  end: string;
  num?: number;
}

export type LessonTypeClass =
  | 'badge-lecture'
  | 'badge-practice'
  | 'badge-lab'
  | 'badge-sport'
  | 'badge-exam'
  | 'badge-consult'
  | 'badge-other';

export interface Lesson {
  uid: string;
  w: WeekParity;
  d: number; // 1 = Пн ... 6 = Сб
  title: string;
  typeClass: string;
  typeName: string;
  start: string;
  end: string;
  room: string;
  teacher: string;
  note: string;
}

export interface Settings {
  groupName: string;
  groupSubtitle: string;
  semesterStartMonday: string;
  semesterFirstDay: string;
  semesterLastDay: string;
  bells: BellItem[];
}

export const DEFAULT_SETTINGS: Settings = {
  groupName: 'ИВТ-24-1',
  groupSubtitle: '1 семестр 2026/2027 учебного года',
  semesterStartMonday: '2026-08-31',
  semesterFirstDay: '2026-09-01',
  semesterLastDay: '2026-12-30',
  bells: [
    { start: '08:30', end: '10:00', num: 1 },
    { start: '10:10', end: '11:40', num: 2 },
    { start: '11:50', end: '13:20', num: 3 },
    { start: '13:40', end: '15:10', num: 4 },
    { start: '15:20', end: '16:50', num: 5 },
    { start: '17:00', end: '18:30', num: 6 },
    { start: '18:40', end: '20:10', num: 7 }
  ]
};

export const TYPE_NAMES: Record<string, string> = {
  'badge-lecture': 'Лекция',
  'badge-practice': 'Практика',
  'badge-lab': 'Лабораторная',
  'badge-sport': 'Физкультура',
  'badge-exam': 'Экзамен',
  'badge-consult': 'Консультация',
  'badge-other': 'Военная подготовка / Другое'
};

export const TYPE_CLASSES = Object.keys(TYPE_NAMES);

export const DAYS_MAP = [
  { id: 1, name: 'Понедельник', short: 'Пн', full: 'Понедельник' },
  { id: 2, name: 'Вторник', short: 'Вт', full: 'Вторник' },
  { id: 3, name: 'Среда', short: 'Ср', full: 'Среда' },
  { id: 4, name: 'Четверг', short: 'Чт', full: 'Четверг' },
  { id: 5, name: 'Пятница', short: 'Пт', full: 'Пятница' },
  { id: 6, name: 'Суббота', short: 'Сб', full: 'Суббота' }
];

export const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
export const WEEKDAYS_FULL = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
export const WEEKDAYS_ACC = ['понедельник', 'вторник', 'среду', 'четверг', 'пятницу', 'субботу', 'воскресенье'];
export const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
export const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const DAY_MS = 86400000;
