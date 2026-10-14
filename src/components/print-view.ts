import { store } from '../state/store';
import { DAYS_MAP } from '../domain/types';
import { timeToMinutes } from '../domain/time';
import { pluralizeLessons } from './week-strip';

function escapeHtml(str: unknown): string {
  if (str === null || str === undefined || str === '') return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderPrintSchedule(): void {
  const printContainer = document.getElementById('printScheduleContainer');
  if (!printContainer) return;
  printContainer.innerHTML = '';

  const state = store.getState();
  const lessons = state.lessons;

  ([1, 2] as const).forEach(weekNum => {
    const section = document.createElement('div');
    section.className = 'print-week-section' + (weekNum === 2 ? ' page-break-next' : '');

    const title = document.createElement('div');
    title.className = 'print-week-title';
    title.textContent = `${weekNum}-я неделя (${weekNum === 1 ? 'нечётная' : 'чётная'})`;
    section.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'print-grid';

    DAYS_MAP.forEach(dayInfo => {
      const dayLessons = lessons
        .filter(l => l.w === weekNum && l.d === dayInfo.id)
        .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));

      const card = document.createElement('div');
      card.className = 'print-day-card';

      let lessonsHtml = '';
      if (dayLessons.length === 0) {
        lessonsHtml = '<div style="font-size: 8.5pt; color: #888; font-style: italic;">Занятий нет</div>';
      } else {
        lessonsHtml = dayLessons.map(l => `
          <div class="print-lesson-row">
            <div>
              <span class="print-time tabular-nums">${escapeHtml(l.start)}–${escapeHtml(l.end)}</span>
              <span class="print-lesson-title">${escapeHtml(l.title)}</span>
              <span class="print-type">${escapeHtml(l.typeName || '')}</span>
            </div>
            <div class="print-lesson-meta">
              ${l.room ? `<span>${escapeHtml(l.room)}</span> ` : ''}
              ${l.teacher ? `<span>${escapeHtml(l.teacher)}</span>` : ''}
            </div>
            ${l.note ? `<div style="font-size: 7.5pt; color: #666; font-style: italic;">${escapeHtml(l.note)}</div>` : ''}
          </div>
        `).join('');
      }

      card.innerHTML = `
        <div class="print-day-header">
          <span>${dayInfo.full}</span>
          <span style="font-size: 8.5pt; font-weight: normal; color: #666;">${dayLessons.length} ${pluralizeLessons(dayLessons.length)}</span>
        </div>
        <div>${lessonsHtml}</div>
      `;

      grid.appendChild(card);
    });

    section.appendChild(grid);
    printContainer.appendChild(section);
  });
}
