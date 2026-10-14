import { store } from '../state/store';
import type { Lesson } from '../domain/types';
import { DAYS_MAP, MONTHS_SHORT, TYPE_CLASSES } from '../domain/types';
import { addDays, formatDateISO, getMondayOf, isoWeekday } from '../domain/parity';
import { timeToMinutes } from '../domain/time';
import { pluralizeLessons } from './week-strip';

const ICON_ATTRS = 'width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
const ICON_PIN = `<svg ${ICON_ATTRS}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
const ICON_USER = `<svg ${ICON_ATTRS}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
const ICON_NOTE = `<svg ${ICON_ATTRS}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;

function escapeHtml(str: unknown): string {
  if (str === null || str === undefined || str === '') return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function hasActiveFilter(): boolean {
  const state = store.getState();
  return Boolean(state.searchQuery.trim() || state.activeTypeFilter !== 'all');
}

export function isDayMode(): boolean {
  const state = store.getState();
  return state.viewMode === 'day' && window.matchMedia('(max-width: 768px)').matches && !hasActiveFilter();
}

export function matchesSearch(lesson: Lesson, q: string): boolean {
  const normQ = (q || '').trim().toLowerCase();
  if (!normQ) return true;
  return [lesson.title, lesson.teacher, lesson.room, lesson.note]
    .some(field => field && field.toLowerCase().includes(normQ));
}

export function matchesFilters(lesson: Lesson): boolean {
  const state = store.getState();
  return matchesSearch(lesson, state.searchQuery) &&
    (state.activeTypeFilter === 'all' || lesson.typeClass === state.activeTypeFilter);
}

function lessonHtml(lesson: Lesson, isToday: boolean, nowMinutes: number, filtering: boolean): string {
  const isOngoing = isToday &&
    nowMinutes >= timeToMinutes(lesson.start) && nowMinutes < timeToMinutes(lesson.end);
  const isDimmed = filtering && !matchesFilters(lesson);
  const typeClass = TYPE_CLASSES.includes(lesson.typeClass) ? lesson.typeClass : 'badge-other';

  const classes = ['lesson-item'];
  if (isOngoing) classes.push('is-ongoing');
  if (isDimmed) classes.push('dimmed');

  const details = [
    lesson.room ? `<span class="lesson-tag">${ICON_PIN}<span>${escapeHtml(lesson.room)}</span></span>` : '',
    lesson.teacher ? `<span class="lesson-tag">${ICON_USER}<span>${escapeHtml(lesson.teacher)}</span></span>` : ''
  ].join('');

  return `
    <article class="${classes.join(' ')}" data-uid="${escapeHtml(lesson.uid)}">
      <div class="lesson-header-row">
        <div class="lesson-time-wrap">
          <span class="tabular-nums">${escapeHtml(lesson.start)} – ${escapeHtml(lesson.end)}</span>
          ${isOngoing ? '<span class="lesson-ongoing-tag"><span class="live-pulse-dot pulse"></span>сейчас</span>' : ''}
        </div>
        <div class="lesson-actions">
          <button type="button" class="icon-action-btn btn-edit" data-edit-uid="${escapeHtml(lesson.uid)}" title="Редактировать пару" aria-label="Редактировать пару «${escapeHtml(lesson.title)}»">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button type="button" class="icon-action-btn btn-delete" data-del-uid="${escapeHtml(lesson.uid)}" title="Удалить пару" aria-label="Удалить пару «${escapeHtml(lesson.title)}»">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
      <div><span class="badge-type ${typeClass}">${escapeHtml(lesson.typeName || 'Занятие')}</span></div>
      <div class="lesson-title">${escapeHtml(lesson.title)}</div>
      ${details ? `<div class="lesson-details-row">${details}</div>` : ''}
      ${lesson.note ? `<div class="lesson-note">${ICON_NOTE}<span>${escapeHtml(lesson.note)}</span></div>` : ''}
    </article>`;
}

export function renderScheduleGrid(): void {
  const container = document.getElementById('scheduleGrid');
  if (!container) return;
  const state = store.getState();
  const now = new Date();
  const todayStr = formatDateISO(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const monday = getMondayOf(state.activeDate);
  const selectedDow = isoWeekday(state.activeDate);
  const filtering = hasActiveFilter();
  const otherWeek = state.activeWeek === 1 ? 2 : 1;

  // Counters for search / type filter
  const counterBadge = document.getElementById('searchCounterBadge');
  if (counterBadge) {
    if (filtering) {
      let curWeek = 0;
      let otherCount = 0;
      state.lessons.forEach(l => {
        if (!matchesFilters(l)) return;
        if (l.w === state.activeWeek) curWeek++;
        if (l.w === otherWeek) otherCount++;
      });
      const curEl = document.getElementById('cntCurWeek');
      const othEl = document.getElementById('cntOtherWeek');
      if (curEl) curEl.textContent = String(curWeek);
      if (othEl) othEl.textContent = String(otherCount);
      counterBadge.style.display = 'block';
    } else {
      counterBadge.style.display = 'none';
    }
  }

  container.classList.toggle('view-day', state.viewMode === 'day' && !filtering);

  const html: string[] = [];
  DAYS_MAP.forEach(dayInfo => {
    const dayDate = addDays(monday, dayInfo.id - 1);
    const isToday = formatDateISO(dayDate) === todayStr;
    const dayLessons = state.lessons
      .filter(l => l.w === state.activeWeek && l.d === dayInfo.id)
      .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));

    const classes = ['day-card'];
    if (isToday) classes.push('is-today');
    if (dayInfo.id === selectedDow) classes.push('is-selected');

    const body = dayLessons.length
      ? dayLessons.map(l => lessonHtml(l, isToday, nowMinutes, filtering)).join('')
      : '<div class="day-empty"><div class="day-empty-text">Занятий нет</div></div>';

    html.push(`
      <section class="${classes.join(' ')}" id="dayCard-${dayInfo.id}" aria-label="${dayInfo.full}">
        <div class="day-card-header">
          <div class="day-title-cluster">
            <h2 class="day-name">${dayInfo.full}</h2>
            <span class="day-date-caption">${dayDate.getDate()} ${MONTHS_SHORT[dayDate.getMonth()]}</span>
          </div>
          <span class="day-badge-counter">${dayLessons.length} ${pluralizeLessons(dayLessons.length)}</span>
        </div>
        <div class="day-lessons-list">${body}</div>
      </section>`);
  });

  // Sunday is only shown in the phone day view when it is selected
  const sunday = addDays(monday, 6);
  html.push(`
    <section class="day-card is-off${selectedDow === 7 ? ' is-selected' : ''}${formatDateISO(sunday) === todayStr ? ' is-today' : ''}" id="dayCard-7" aria-label="Воскресенье">
      <div class="day-card-header">
        <div class="day-title-cluster">
          <h2 class="day-name">Воскресенье</h2>
          <span class="day-date-caption">${sunday.getDate()} ${MONTHS_SHORT[sunday.getMonth()]}</span>
        </div>
        <span class="day-badge-counter">выходной</span>
      </div>
      <div class="day-lessons-list">
        <div class="day-empty"><div class="day-empty-text">Занятий нет — отдыхайте</div></div>
      </div>
    </section>`);

  container.innerHTML = html.join('');

  if (state.pendingSlide && isDayMode()) {
    const selected = container.querySelector('.day-card.is-selected');
    if (selected) selected.classList.add(state.pendingSlide === 'next' ? 'slide-in-next' : 'slide-in-prev');
  }
}

export function scrollToActiveDay(): void {
  const state = store.getState();
  const card = document.getElementById('dayCard-' + isoWeekday(state.activeDate));
  if (card) {
    card.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
  }
}

export function initScheduleGrid(handlers: {
  onEditLesson: (uid: string) => void;
  onDeleteLesson: (uid: string) => void;
  onAddLesson?: (day: number) => void;
}): void {
  const container = document.getElementById('scheduleGrid');
  if (!container) return;

  container.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const editBtn = target.closest('[data-edit-uid]');
    if (editBtn) {
      const uid = editBtn.getAttribute('data-edit-uid');
      if (uid) handlers.onEditLesson(uid);
      return;
    }
    const delBtn = target.closest('[data-del-uid]');
    if (delBtn) {
      const uid = delBtn.getAttribute('data-del-uid');
      if (uid) handlers.onDeleteLesson(uid);
      return;
    }
  });

  // Mobile swipe gestures
  let swipe: { x: number; y: number; time: number } | null = null;

  container.addEventListener('touchstart', (e) => {
    if (!isDayMode() || e.touches.length !== 1) { swipe = null; return; }
    const t = e.touches[0];
    if (t.clientX < 24 || t.clientX > window.innerWidth - 24) { swipe = null; return; }
    swipe = { x: t.clientX, y: t.clientY, time: Date.now() };
  }, { passive: true });

  container.addEventListener('touchend', (e) => {
    if (!swipe) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - swipe.x;
    const dy = t.clientY - swipe.y;
    const elapsed = Date.now() - swipe.time;
    swipe = null;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.6 || elapsed > 700) return;
    store.goToDate(addDays(store.getState().activeDate, dx < 0 ? 1 : -1));
  }, { passive: true });

  container.addEventListener('touchcancel', () => { swipe = null; }, { passive: true });
}
