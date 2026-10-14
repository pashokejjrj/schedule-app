import type { Lesson, Settings } from '../domain/types';
import { sanitizeLessons, sanitizeSettings } from './storage';
import { safeFileName, downloadFile } from './ics-export';

export const DEMO_LESSONS: Lesson[] = [
  // Week 1
  { uid: 'd1', w: 1, d: 1, start: '08:30', end: '10:00', title: 'Высшая математика', typeClass: 'badge-lecture', typeName: 'Лекция', teacher: 'Смирнов А. В.', room: 'ауд. 310', note: 'Поток А' },
  { uid: 'd2', w: 1, d: 1, start: '10:10', end: '11:40', title: 'Архитектура ЭВМ', typeClass: 'badge-practice', typeName: 'Практика', teacher: 'Кузнецов Д. М.', room: 'ауд. 412', note: 'Подгруппа 1' },
  { uid: 'd3', w: 1, d: 1, start: '11:50', end: '13:20', title: 'Физическая культура', typeClass: 'badge-sport', typeName: 'Физкультура', teacher: 'Громов П. С.', room: 'Спорткомплекс', note: 'Спортивная форма' },
  { uid: 'd4', w: 1, d: 2, start: '10:10', end: '11:40', title: 'Базы данных и SQL', typeClass: 'badge-lecture', typeName: 'Лекция', teacher: 'Васильева Е. Н.', room: 'ауд. 208', note: '' },
  { uid: 'd5', w: 1, d: 2, start: '11:50', end: '13:20', title: 'Лабораторный практикум по БД', typeClass: 'badge-lab', typeName: 'Лабораторная', teacher: 'Васильева Е. Н.', room: 'комп. класс 3', note: 'Сдать отчёт №1' },
  { uid: 'd6', w: 1, d: 3, start: '08:30', end: '10:00', title: 'Иностранный язык', typeClass: 'badge-practice', typeName: 'Практика', teacher: 'Браун К. Л.', room: 'ауд. 504', note: 'Unit 3 reading' },
  { uid: 'd7', w: 1, d: 3, start: '10:10', end: '11:40', title: 'Алгоритмы и структуры данных', typeClass: 'badge-lecture', typeName: 'Лекция', teacher: 'Ковалёв И. В.', room: 'акт. зал', note: '' },
  { uid: 'd8', w: 1, d: 4, start: '11:50', end: '13:20', title: 'Операционные системы', typeClass: 'badge-practice', typeName: 'Практика', teacher: 'Морозов В. Ф.', room: 'ауд. 415', note: 'Linux kernel lab' },
  { uid: 'd9', w: 1, d: 4, start: '13:40', end: '15:10', title: 'Веб-технологии', typeClass: 'badge-lab', typeName: 'Лабораторная', teacher: 'Соколова М. А.', room: 'ауд. 219', note: 'SPA разработка' },
  { uid: 'd10', w: 1, d: 5, start: '10:10', end: '11:40', title: 'Философия', typeClass: 'badge-lecture', typeName: 'Лекция', teacher: 'Никитин О. Б.', room: 'ауд. 101', note: '' },
  { uid: 'd11', w: 1, d: 5, start: '11:50', end: '13:20', title: 'Философия (семинар)', typeClass: 'badge-practice', typeName: 'Практика', teacher: 'Никитин О. Б.', room: 'ауд. 105', note: 'Тема: Теория познания' },

  // Week 2
  { uid: 'd12', w: 2, d: 1, start: '10:10', end: '11:40', title: 'Высшая математика', typeClass: 'badge-practice', typeName: 'Практика', teacher: 'Смирнов А. В.', room: 'ауд. 312', note: 'Контрольная работа' },
  { uid: 'd13', w: 2, d: 1, start: '11:50', end: '13:20', title: 'Физическая культура', typeClass: 'badge-sport', typeName: 'Физкультура', teacher: 'Громов П. С.', room: 'Спорткомплекс', note: '' },
  { uid: 'd14', w: 2, d: 2, start: '08:30', end: '10:00', title: 'Базы данных и SQL', typeClass: 'badge-practice', typeName: 'Практика', teacher: 'Васильева Е. Н.', room: 'ауд. 208', note: '' },
  { uid: 'd15', w: 2, d: 2, start: '10:10', end: '11:40', title: 'Компьютерные сети', typeClass: 'badge-lecture', typeName: 'Лекция', teacher: 'Попов С. А.', room: 'ауд. 401', note: '' },
  { uid: 'd16', w: 2, d: 3, start: '11:50', end: '13:20', title: 'Алгоритмы и структуры данных', typeClass: 'badge-lab', typeName: 'Лабораторная', teacher: 'Ковалёв И. В.', room: 'комп. класс 1', note: 'Сортировки и графы' },
  { uid: 'd17', w: 2, d: 3, start: '13:40', end: '15:10', title: 'Иностранный язык', typeClass: 'badge-practice', typeName: 'Практика', teacher: 'Браун К. Л.', room: 'ауд. 504', note: '' },
  { uid: 'd18', w: 2, d: 4, start: '10:10', end: '11:40', title: 'Военная подготовка', typeClass: 'badge-other', typeName: 'Военная подготовка / Другое', teacher: 'Майор Сидоров В. И.', room: 'Военный учебный центр', note: 'Форма одежды №2' },
  { uid: 'd19', w: 2, d: 5, start: '11:50', end: '13:20', title: 'Веб-технологии', typeClass: 'badge-lecture', typeName: 'Лекция', teacher: 'Соколова М. А.', room: 'ауд. 219', note: '' },
  { uid: 'd20', w: 2, d: 5, start: '13:40', end: '15:10', title: 'Проектный практикум', typeClass: 'badge-lab', typeName: 'Лабораторная', teacher: 'Кузнецов Д. М.', room: 'лаборатория 5', note: 'Защита спринта' }
];

export function exportJSON(lessons: Lesson[], settings: Settings): void {
  const payload = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    settings: settings,
    lessons: lessons
  };
  downloadFile(
    JSON.stringify(payload, null, 2),
    `schedule-${safeFileName(settings.groupName)}.json`,
    'application/json;charset=utf-8'
  );
}

export function parseAndSanitizeJSON(jsonText: string): { lessons: Lesson[]; settings: Settings | null; skipped: number } {
  const data = JSON.parse(jsonText);
  if (!data || typeof data !== 'object' || !Array.isArray(data.lessons)) {
    throw new Error('Неверный формат: отсутствует массив lessons');
  }

  const cleaned = sanitizeLessons(data.lessons);
  if (data.lessons.length > 0 && cleaned.length === 0) {
    throw new Error('Не найдено ни одной корректной пары');
  }
  const skipped = data.lessons.length - cleaned.length;
  const newSettings = (data.settings && typeof data.settings === 'object') ? sanitizeSettings(data.settings) : null;

  return { lessons: cleaned, settings: newSettings, skipped };
}

export function importJSONFile(file: File): Promise<{ lessons: Lesson[]; settings: Settings | null; skipped: number }> {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('Файл не выбран'));
    if (file.size > 2 * 1024 * 1024) {
      return reject(new Error('Файл слишком большой для расписания (максимум 2 МБ)'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const result = parseAndSanitizeJSON(text);
        resolve(result);
      } catch (err: any) {
        reject(err);
      }
    };
    reader.readAsText(file, 'UTF-8');
  });
}

export function exportScheduleAsJson(lessons: Lesson[], settings: Settings): { success: boolean; message: string } {
  try {
    exportJSON(lessons, settings);
    return { success: true, message: 'Расписание экспортировано в JSON' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Ошибка экспорта' };
  }
}

export function importScheduleFromJson(jsonText: string): { success: boolean; data?: { settings?: Settings | null; lessons?: Lesson[] }; message?: string } {
  try {
    const res = parseAndSanitizeJSON(jsonText);
    return {
      success: true,
      data: {
        settings: res.settings,
        lessons: res.lessons
      },
      message: `Импортировано занятий: ${res.lessons.length}`
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Ошибка парсинга JSON: ${err?.message || ''}`
    };
  }
}
