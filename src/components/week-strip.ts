import { store } from '../state/store';
import { addDays, formatDateISO, getMondayOf, parseDateString } from '../domain/parity';
import { WEEKDAYS_SHORT, WEEKDAYS_FULL, MONTHS_GEN } from '../domain/types';

export function pluralizeLessons(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'пара';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'пары';
  return 'пар';
}

export function getBadgeColor(typeClass: string): string {
  switch (typeClass) {
    case 'badge-lecture': return '#5db8a6';
    case 'badge-practice': return '#5db872';
    case 'badge-lab': return '#e8a55a';
    case 'badge-sport': return '#cc785c';
    default: return '#8e8b82';
  }
}

export function renderWeekStrip(): void {
  const container = document.getElementById('weekStrip');
  if (!container) return;
  const state = store.getState();
  const monday = getMondayOf(state.activeDate);
  const todayStr = formatDateISO(new Date());
  const selectedStr = formatDateISO(state.activeDate);
  const html: string[] = [];

  for (let i = 0; i < 7; i++) {
    const day = addDays(monday, i);
    const iso = formatDateISO(day);
    const dayLessons = i < 6
      ? state.lessons.filter(l => {
          if (l.w !== state.activeWeek || l.d !== (i + 1)) return false;
          if (l.dates && l.dates.length > 0) return l.dates.includes(iso);
          return true;
        })
      : [];

    const dots = dayLessons.slice(0, 6)
      .map(l => `<span class="strip-dot" style="background:${getBadgeColor(l.typeClass)}"></span>`)
      .join('');

    const countLabel = dayLessons.length
      ? `${dayLessons.length} ${pluralizeLessons(dayLessons.length)}`
      : 'занятий нет';

    const classes = ['week-strip-card'];
    if (iso === todayStr) classes.push('today-day');
    if (iso === selectedStr) classes.push('active-day');

    html.push(`
      <button type="button" class="${classes.join(' ')}" data-date="${iso}"
              aria-pressed="${iso === selectedStr}" ${iso === todayStr ? 'aria-current="date"' : ''}
              aria-label="${WEEKDAYS_FULL[i]}, ${day.getDate()} ${MONTHS_GEN[day.getMonth()]}, ${countLabel}">
        <span class="strip-day-name">${WEEKDAYS_SHORT[i]}</span>
        <span class="strip-day-num tabular-nums">${day.getDate()}</span>
        <span class="strip-dots">${dots}</span>
      </button>`);
  }

  container.innerHTML = html.join('');
}

export function initWeekStrip(): void {
  const container = document.getElementById('weekStrip');
  if (!container) return;
  container.addEventListener('click', (e) => {
    const card = (e.target as HTMLElement).closest('.week-strip-card');
    if (card) {
      const dateStr = card.getAttribute('data-date');
      if (dateStr) store.goToDate(parseDateString(dateStr), true);
    }
  });
}
