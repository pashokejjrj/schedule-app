import { store } from '../state/store';
import { timeToMinutes, formatSeconds } from '../domain/time';
import { isoWeekday, calculateParityForDate, formatDateISO } from '../domain/parity';

const ICON_ATTRS = 'width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
const ICON_PIN = `<svg ${ICON_ATTRS}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
const ICON_USER = `<svg ${ICON_ATTRS}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function $(id: string): HTMLElement | null {
  return document.getElementById(id);
}

function setText(el: HTMLElement | null, text: string | undefined): void {
  if (el && el.textContent !== text) el.textContent = text || '';
}

function setMeta(el: HTMLElement | null, icon: string, text: string): void {
  if (!el) return;
  const key = text ? icon + '|' + text : '';
  if (el.dataset.key === key) return;
  el.dataset.key = key;
  el.innerHTML = text ? icon + '<span>' + escapeHtml(text) + '</span>' : '';
}

export interface LiveState {
  ongoing?: boolean;
  badge?: string;
  title?: string;
  room?: string;
  teacher?: string;
  note?: string;
  label?: string;
  digits?: string;
  pct?: number;
}

export function paintLive(s: LiveState): void {
  const widget = $('liveWidget');
  const badge = $('liveBadgeText');
  const dot = $('liveBadgeDot');
  const title = $('liveTitle');
  const room = $('liveMetaRoom');
  const teacher = $('liveMetaTeacher');
  const label = $('liveTimerLabel');
  const digits = $('liveTimerDigits');
  const bar = $('liveProgressBar');

  if (widget) widget.classList.toggle('status-ongoing', Boolean(s.ongoing));
  if (dot) dot.classList.toggle('pulse', Boolean(s.ongoing));
  setText(badge, s.badge);
  setText(title, s.title);
  setMeta(room, ICON_PIN, s.room || '');
  setMeta(teacher, s.note ? '' : ICON_USER, s.note || s.teacher || '');
  setText(label, s.label);
  setText(digits, s.digits);
  if (bar) {
    const width = (Math.round((s.pct || 0) * 10) / 10) + '%';
    if (bar.style.width !== width) bar.style.width = width;
  }
}

export function updateLiveWidget(): void {
  const now = new Date();
  const dayOfWeek = isoWeekday(now);
  const nowSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  if (dayOfWeek === 7) {
    paintLive({
      badge: 'Выходной',
      title: 'Воскресенье — занятий нет',
      note: 'Свободный день',
      label: 'Статус',
      digits: 'Выходной',
      pct: 0
    });
    return;
  }

  const state = store.getState();
  const parity = calculateParityForDate(now, state.settings.semesterStartMonday);
  const todayStr = formatDateISO(now);
  const todayLessons = state.lessons
    .filter(l => {
      if (l.w !== parity || l.d !== dayOfWeek) return false;
      if (l.dates && l.dates.length > 0) return l.dates.includes(todayStr);
      return true;
    })
    .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));

  if (todayLessons.length === 0) {
    paintLive({
      badge: 'Свободно',
      title: 'Занятий нет',
      note: 'На сегодня расписание пусто',
      label: 'Статус',
      digits: 'Свободно',
      pct: 0
    });
    return;
  }

  const firstStartSec = timeToMinutes(todayLessons[0].start) * 60;
  const lastEndSec = Math.max(...todayLessons.map(l => timeToMinutes(l.end))) * 60;

  if (nowSeconds < firstStartSec) {
    const first = todayLessons[0];
    paintLive({
      badge: 'До занятий',
      title: `Первая пара: ${first.title}`,
      room: first.room,
      teacher: first.teacher,
      label: 'До начала',
      digits: formatSeconds(firstStartSec - nowSeconds),
      pct: 0
    });
    return;
  }

  if (nowSeconds >= lastEndSec) {
    paintLive({
      badge: 'Завершено',
      title: 'Занятия на сегодня завершены',
      note: `Всего пар: ${todayLessons.length}`,
      label: 'Статус',
      digits: 'Завершено',
      pct: 100
    });
    return;
  }

  const current = todayLessons.find(l => {
    const s = timeToMinutes(l.start) * 60;
    const e = timeToMinutes(l.end) * 60;
    return nowSeconds >= s && nowSeconds < e;
  });

  if (current) {
    const startSec = timeToMinutes(current.start) * 60;
    const endSec = timeToMinutes(current.end) * 60;
    paintLive({
      ongoing: true,
      badge: 'Идёт пара',
      title: current.title,
      room: current.room,
      teacher: current.teacher,
      note: current.teacher ? '' : current.typeName,
      label: 'До звонка',
      digits: formatSeconds(endSec - nowSeconds),
      pct: Math.min(100, Math.max(0, ((nowSeconds - startSec) / (endSec - startSec)) * 100))
    });
    return;
  }

  const next = todayLessons.find(l => timeToMinutes(l.start) * 60 > nowSeconds);
  if (next) {
    paintLive({
      badge: 'Перемена',
      title: `Следующая: ${next.title}`,
      room: next.room,
      teacher: next.teacher,
      label: 'До звонка',
      digits: formatSeconds(timeToMinutes(next.start) * 60 - nowSeconds),
      pct: 0
    });
  }
}
