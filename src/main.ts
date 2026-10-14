import './styles/tokens.css';
import './styles/reset.css';
import './styles/components.css';

import type { ViewMode } from './state/store';
import { THEME_COLORS, WEEKDAYS_ACC } from './domain/types';
import { addDays, calculateParityForDate, formatDateISO, isoWeekday, parseDateString, startOfDay } from './domain/parity';
import { timeToMinutes } from './domain/time';
import { store } from './state/store';

import { showToast } from './components/toast';
import { openModal, closeModal, initModals, showConfirmDialog } from './components/modal';
import { updateLiveWidget } from './components/live-widget';
import { renderWeekStrip } from './components/week-strip';
import { renderScheduleGrid, initScheduleGrid, scrollToActiveDay } from './components/schedule-grid';
import { openLessonModal, initLessonModal, deleteLessonWithUndo } from './components/modal-lesson';
import { openSettingsModal, initSettingsModal } from './components/modal-settings';
import { initDataActions } from './components/actions';
import { parseAndSanitizeJSON } from './services/json-transfer';

function $(id: string): HTMLElement | null {
  return document.getElementById(id);
}

function setText(el: HTMLElement | null, text: string | undefined): void {
  if (el && el.textContent !== text) el.textContent = text || '';
}

function renderHeader(): void {
  const { settings } = store.getState();
  setText($('headerGroupName'), settings.groupName);
  document.title = `Расписание ${settings.groupName}`;
}

function renderWeekTabs(): void {
  const { activeWeek, activeDate } = store.getState();
  [1, 2].forEach(n => {
    const tab = $('tabWeek' + n);
    if (tab) {
      const isActive = activeWeek === n;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-pressed', String(isActive));
    }
  });
  const dateInput = $('datePickerInput') as HTMLInputElement | null;
  if (dateInput) {
    dateInput.value = formatDateISO(activeDate);
  }
}

function renderViewToggle(): void {
  const { viewMode } = store.getState();
  document.querySelectorAll<HTMLElement>('#viewToggle .view-toggle-btn').forEach(btn => {
    const isActive = btn.getAttribute('data-view') === viewMode;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', String(isActive));
  });
}

function applyTheme(theme: 'light' | 'dark'): void {
  document.documentElement.setAttribute('data-theme', theme);
  const meta = $('metaThemeColor');
  if (meta) meta.setAttribute('content', THEME_COLORS[theme] || (theme === 'dark' ? '#181715' : '#faf9f5'));
}

function renderAll(): void {
  const state = store.getState();
  applyTheme(state.theme);
  renderHeader();
  renderWeekTabs();
  renderViewToggle();
  renderWeekStrip();
  renderScheduleGrid();
  updateLiveWidget();
}

function initSmartDate(): void {
  const now = new Date();
  const todayIso = isoWeekday(now);
  let activeDate = startOfDay(now);
  let bannerText = '';

  const state = store.getState();
  if (todayIso === 7) {
    activeDate = addDays(activeDate, 1);
    bannerText = 'Сегодня выходной. Показываю расписание на понедельник.';
  } else {
    const parity = calculateParityForDate(now, state.settings.semesterStartMonday);
    const todayStr = formatDateISO(now);
    const todayLessons = state.lessons.filter(l => {
      if (l.w !== parity || l.d !== todayIso) return false;
      if (l.dates && l.dates.length > 0) return l.dates.includes(todayStr);
      return true;
    });
    if (todayLessons.length > 0) {
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const lastLessonEnd = Math.max(...todayLessons.map(l => timeToMinutes(l.end)));
      if (nowMinutes >= lastLessonEnd) {
        activeDate = addDays(activeDate, todayIso === 6 ? 2 : 1);
        bannerText = `Сегодняшние пары закончились. Показываю расписание на ${WEEKDAYS_ACC[isoWeekday(activeDate) - 1]}.`;
      }
    }
  }

  store.goToDate(activeDate, false);

  if (bannerText) {
    const msg = $('smartBannerMsg');
    const banner = $('smartBanner');
    if (msg) msg.textContent = bannerText;
    if (banner) banner.style.display = 'flex';
  }
}

function initEventListeners(): void {
  initModals();
  initLessonModal();
  initSettingsModal();
  initDataActions();

  initScheduleGrid({
    onEditLesson: (uid) => openLessonModal(uid),
    onDeleteLesson: (uid) => {
      showConfirmDialog(
        'Удалить пару?',
        'Вы уверены, что хотите удалить это занятие?',
        () => deleteLessonWithUndo(uid)
      );
    }
  });

  $('btnOpenSettings')?.addEventListener('click', openSettingsModal);
  $('btnOpenExportImport')?.addEventListener('click', () => openModal('modalExportImport'));

  $('btnToggleTheme')?.addEventListener('click', () => {
    const next = store.toggleTheme();
    showToast(next === 'dark' ? 'Включена тёмная тема' : 'Включена светлая тема');
  });

  $('btnOpenMenu')?.addEventListener('click', () => openModal('modalMenu'));

  $('modalMenu')?.addEventListener('click', (e) => {
    const item = (e.target as HTMLElement).closest('[data-menu-action]');
    if (!item) return;
    closeModal('modalMenu');
    switch (item.getAttribute('data-menu-action')) {
      case 'settings':
        openSettingsModal();
        break;
      case 'export':
        openModal('modalExportImport');
        break;
      case 'demo':
        showConfirmDialog(
          'Загрузить демо-данные',
          'Текущее расписание будет заменено тестовым набором для ИВТ-24-1. Продолжить?',
          () => {
            store.fillDemo();
            showToast('Загружено демо-расписание ИВТ-24-1');
          },
          'Загрузить',
          false
        );
        break;
      case 'clear':
        showConfirmDialog(
          'Очистить расписание',
          'Удалить все пары из расписания? Настройки группы и звонков сохранятся.',
          () => {
            store.clearAll();
            showToast('Расписание полностью очищено');
          },
          'Очистить',
          true
        );
        break;
    }
  });

  // Week parity tabs
  [1, 2].forEach(n => {
    $('tabWeek' + n)?.addEventListener('click', () => {
      store.showWeek(n as 1 | 2);
    });
  });

  // Week navigation & jumps
  $('btnPrevWeek')?.addEventListener('click', () => {
    store.goToDate(addDays(store.getState().activeDate, -7));
  });

  $('btnNextWeek')?.addEventListener('click', () => {
    store.goToDate(addDays(store.getState().activeDate, 7));
  });

  $('btnJumpToday')?.addEventListener('click', () => {
    const banner = $('smartBanner');
    if (banner) banner.style.display = 'none';
    store.goToDate(new Date(), true);
    setTimeout(scrollToActiveDay, 50);
  });

  $('btnJumpTomorrow')?.addEventListener('click', () => {
    store.goToDate(addDays(new Date(), 1), true);
    setTimeout(scrollToActiveDay, 50);
  });

  $('btnSmartShowToday')?.addEventListener('click', () => {
    const banner = $('smartBanner');
    if (banner) banner.style.display = 'none';
    store.goToDate(new Date(), true);
    setTimeout(scrollToActiveDay, 50);
  });

  $('btnSmartDismiss')?.addEventListener('click', () => {
    const banner = $('smartBanner');
    if (banner) banner.style.display = 'none';
  });

  $('datePickerInput')?.addEventListener('change', (e) => {
    const val = (e.target as HTMLInputElement).value;
    if (val) {
      store.goToDate(parseDateString(val), true);
      setTimeout(scrollToActiveDay, 50);
    }
  });

  // View toggle
  document.querySelectorAll<HTMLElement>('#viewToggle .view-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-view') as ViewMode;
      if (mode) store.setViewMode(mode);
    });
  });

  // Search input & clear
  const searchInput = $('searchInput') as HTMLInputElement | null;
  const searchClearBtn = $('searchClearBtn');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      store.setSearchQuery(searchInput.value);
      if (searchClearBtn) {
        searchClearBtn.style.display = searchInput.value ? 'flex' : 'none';
      }
    });
  }

  if (searchClearBtn && searchInput) {
    searchClearBtn.addEventListener('click', () => {
      searchInput.value = '';
      store.setSearchQuery('');
      searchClearBtn.style.display = 'none';
      searchInput.focus();
    });
  }

  // Filter chips
  const filterChips = $('filterChips');
  if (filterChips) {
    filterChips.addEventListener('click', (e) => {
      const chip = (e.target as HTMLElement).closest('.filter-chip-btn');
      if (!chip) return;
      document.querySelectorAll('#filterChips .filter-chip-btn').forEach(c => {
        c.classList.remove('active');
        c.setAttribute('aria-pressed', 'false');
      });
      chip.classList.add('active');
      chip.setAttribute('aria-pressed', 'true');
      const type = chip.getAttribute('data-type') || 'all';
      store.setActiveTypeFilter(type);
    });
  }

  // Week strip click delegation
  $('weekStrip')?.addEventListener('click', (e) => {
    const card = (e.target as HTMLElement).closest('.week-strip-card');
    if (card) {
      const dateStr = card.getAttribute('data-date');
      if (dateStr) {
        store.goToDate(parseDateString(dateStr), true);
        setTimeout(scrollToActiveDay, 50);
      }
    }
  });

  // ResizeObserver for top nav height
  const navEl = document.querySelector('.top-nav') as HTMLElement | null;
  if (navEl && 'ResizeObserver' in window) {
    new ResizeObserver(() => {
      document.documentElement.style.setProperty('--nav-h', navEl.offsetHeight + 'px');
    }).observe(navEl);
  }

  // OS theme change listener
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const saved = localStorage.getItem('schedule_theme');
    if (!saved || saved === 'auto') {
      store.setTheme(e.matches ? 'dark' : 'light', false);
    }
  });
}

function minuteKey(): string {
  const now = new Date();
  return formatDateISO(now) + ' ' + now.getHours() + ':' + now.getMinutes();
}

let lastMinute = minuteKey();

function tick(): void {
  if (document.hidden) return;
  updateLiveWidget();
  const currentMinute = minuteKey();
  if (currentMinute !== lastMinute) {
    lastMinute = currentMinute;
    renderWeekStrip();
    renderScheduleGrid();
  }
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) tick();
});

// Subscribe to store updates
store.subscribe(() => {
  renderAll();
});

async function syncScheduleFromJson(): Promise<void> {
  try {
    const res = await fetch('./schedule.json', { cache: 'no-cache' });
    if (!res.ok) return;
    const text = await res.text();
    const result = parseAndSanitizeJSON(text);
    if (result.lessons.length > 0) {
      if (result.settings) store.setSettings(result.settings);
      store.setLessons(result.lessons);
    }
  } catch (err) {
    console.warn('Could not load ./schedule.json:', err);
  }
}

// App startup
initEventListeners();
initSmartDate();
renderAll();
syncScheduleFromJson();
setInterval(tick, 1000);

