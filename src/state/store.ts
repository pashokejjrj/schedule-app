import type { Lesson, Settings, WeekParity } from '../domain/types';
import { startOfDay, addDays, getMondayOf, calculateParityForDate } from '../domain/parity';
import {
  loadLessons,
  loadSettings,
  loadViewMode,
  loadTheme,
  saveLessons,
  saveSettings,
  saveViewMode,
  saveTheme
} from '../services/storage';
import { DEMO_LESSONS } from '../services/json-transfer';

export type ViewMode = 'day' | 'week';
export type ThemeMode = 'light' | 'dark';

export interface State {
  lessons: Lesson[];
  settings: Settings;
  activeDate: Date;
  activeWeek: WeekParity;
  viewMode: ViewMode;
  theme: ThemeMode;
  searchQuery: string;
  activeTypeFilter: string;
  pendingSlide: 'next' | 'prev' | null;
  lastDeletedLesson: Lesson | null;
}

type Listener = (state: State) => void;

class ScheduleStore {
  private state: State;
  private listeners = new Set<Listener>();

  constructor() {
    const settings = loadSettings();
    const lessons = loadLessons();
    const viewMode = loadViewMode();
    const savedTheme = loadTheme();
    const initialTheme: ThemeMode =
      savedTheme === 'auto'
        ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : savedTheme;

    const today = startOfDay(new Date());
    const activeWeek = calculateParityForDate(today, settings.semesterStartMonday);

    this.state = {
      lessons,
      settings,
      activeDate: today,
      activeWeek,
      viewMode,
      theme: initialTheme,
      searchQuery: '',
      activeTypeFilter: 'all',
      pendingSlide: null,
      lastDeletedLesson: null
    };
  }

  getState(): Readonly<State> {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  setTheme(theme: ThemeMode, save = true) {
    this.state.theme = theme;
    if (save) saveTheme(theme);
    this.notify();
  }

  toggleTheme() {
    const next = this.state.theme === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
    return next;
  }

  setViewMode(mode: ViewMode) {
    this.state.viewMode = mode;
    saveViewMode(mode);
    this.notify();
  }

  setSearchQuery(q: string) {
    this.state.searchQuery = q;
    this.notify();
  }

  setActiveTypeFilter(filter: string) {
    this.state.activeTypeFilter = filter;
    this.notify();
  }

  goToDate(date: Date, setPendingSlide = true) {
    const prev = this.state.activeDate;
    const next = startOfDay(date);
    this.state.activeDate = next;
    this.state.activeWeek = calculateParityForDate(next, this.state.settings.semesterStartMonday);
    if (setPendingSlide) {
      this.state.pendingSlide = next.getTime() > prev.getTime() ? 'next' : (next.getTime() < prev.getTime() ? 'prev' : null);
    } else {
      this.state.pendingSlide = null;
    }
    this.notify();
  }

  showWeek(parity: WeekParity) {
    if (this.state.activeWeek === parity) return;
    this.state.activeWeek = parity;
    this.state.activeDate = addDays(this.state.activeDate, parity === 2 ? 7 : -7);
    this.notify();
  }

  goToWeekDay(week: WeekParity, day: number) {
    let monday = getMondayOf(this.state.activeDate);
    if (this.state.activeWeek !== week) {
      monday = addDays(monday, week === 2 ? 7 : -7);
    }
    this.goToDate(addDays(monday, day - 1));
  }

  addOrUpdateLesson(lesson: Lesson) {
    const idx = this.state.lessons.findIndex(l => l.uid === lesson.uid);
    if (idx >= 0) {
      this.state.lessons[idx] = lesson;
    } else {
      this.state.lessons.push(lesson);
    }
    saveLessons(this.state.lessons);
    this.notify();
  }

  deleteLesson(uid: string): Lesson | null {
    const idx = this.state.lessons.findIndex(l => l.uid === uid);
    if (idx < 0) return null;
    const removed = this.state.lessons.splice(idx, 1)[0];
    this.state.lastDeletedLesson = removed;
    saveLessons(this.state.lessons);
    this.notify();
    return removed;
  }

  restoreLastDeleted(): boolean {
    if (!this.state.lastDeletedLesson) return false;
    this.state.lessons.push(this.state.lastDeletedLesson);
    this.state.lastDeletedLesson = null;
    saveLessons(this.state.lessons);
    this.notify();
    return true;
  }

  setLessons(lessons: Lesson[]) {
    this.state.lessons = lessons;
    saveLessons(lessons);
    this.notify();
  }

  setSettings(settings: Settings) {
    this.state.settings = settings;
    saveSettings(settings);
    this.state.activeWeek = calculateParityForDate(this.state.activeDate, settings.semesterStartMonday);
    this.notify();
  }

  fillDemo() {
    this.state.lessons = [...DEMO_LESSONS];
    this.state.settings.groupName = 'ИВТ-24-1';
    this.state.settings.groupSubtitle = '1 семестр 2026/2027 учебного года';
    saveSettings(this.state.settings);
    saveLessons(this.state.lessons);
    this.notify();
  }

  clearAll() {
    this.state.lessons = [];
    saveLessons([]);
    this.notify();
  }
}

export const store = new ScheduleStore();
