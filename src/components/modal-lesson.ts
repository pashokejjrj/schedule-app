import { store } from '../state/store';
import type { Lesson, WeekParity } from '../domain/types';
import { checkCollision } from '../domain/collision';
import { timeToMinutes } from '../domain/time';
import { isoWeekday } from '../domain/parity';
import { sanitizeString, generateUid } from '../services/storage';
import { openModal, closeModal, showConfirmDialog } from './modal';
import { showToast } from './toast';

function $(id: string): HTMLElement | null {
  return document.getElementById(id);
}

function selectLessonType(lesson: Lesson): void {
  const select = $('lessonType') as HTMLSelectElement | null;
  if (!select) return;
  const exact = `${lesson.typeClass}|${lesson.typeName}`;
  const options = Array.from(select.options);
  const match = options.find(o => o.value === exact) ||
    options.find(o => o.value.startsWith(lesson.typeClass + '|'));
  if (match) select.value = match.value;
}

function updateBellPresetActive(): void {
  const startInput = $('lessonStart') as HTMLInputElement | null;
  const endInput = $('lessonEnd') as HTMLInputElement | null;
  if (!startInput || !endInput) return;
  const start = startInput.value;
  const end = endInput.value;
  document.querySelectorAll<HTMLElement>('#bellPresetsRow .bell-pill').forEach(pill => {
    pill.classList.toggle('active', pill.getAttribute('data-start') === start && pill.getAttribute('data-end') === end);
  });
}

function checkCollisionWarning(): void {
  const state = store.getState();
  const weekSelect = $('lessonWeek') as HTMLSelectElement | null;
  const daySelect = $('lessonDay') as HTMLSelectElement | null;
  const startInput = $('lessonStart') as HTMLInputElement | null;
  const endInput = $('lessonEnd') as HTMLInputElement | null;
  const uidInput = $('lessonUid') as HTMLInputElement | null;
  const warnBox = $('lessonCollisionWarning');
  const warnText = $('lessonCollisionText');

  if (!weekSelect || !daySelect || !startInput || !endInput || !warnBox || !warnText) return;

  const w = parseInt(weekSelect.value, 10) as WeekParity;
  const d = parseInt(daySelect.value, 10);
  const start = startInput.value;
  const end = endInput.value;
  const uid = uidInput ? uidInput.value : '';

  if (!start || !end || timeToMinutes(end) <= timeToMinutes(start)) {
    warnBox.style.display = 'none';
    return;
  }

  const dummy: Pick<Lesson, 'uid' | 'w' | 'd' | 'start' | 'end'> = {
    uid: uid || 'temp',
    w,
    d,
    start,
    end
  };

  const collisions = checkCollision(dummy, state.lessons, uid);
  if (collisions.length > 0) {
    const first = collisions[0];
    warnText.textContent = `Пересекается с парой «${first.title}» (${first.start}–${first.end})`;
    warnBox.style.display = 'flex';
  } else {
    warnBox.style.display = 'none';
  }
}

function renderBellPresets(): void {
  const container = $('bellPresetsRow');
  if (!container) return;
  const state = store.getState();
  container.innerHTML = state.settings.bells.map(bell => `
    <button type="button" class="bell-pill" data-start="${bell.start}" data-end="${bell.end}">${bell.num || ''} пара: ${bell.start}–${bell.end}</button>
  `).join('');
}

export function openLessonModal(uid: string | null = null, defaultWeek: WeekParity | null = null, defaultDay: number | null = null): void {
  if (!uid) return;
  const form = $('formLesson') as HTMLFormElement | null;
  if (!form) return;
  form.reset();

  const titleErr = $('lessonTitleError');
  const timeErr = $('lessonTimeError');
  const warnBox = $('lessonCollisionWarning');
  const titleInput = $('lessonTitle') as HTMLInputElement | null;

  if (titleErr) titleErr.style.display = 'none';
  if (timeErr) timeErr.style.display = 'none';
  if (warnBox) warnBox.style.display = 'none';
  if (titleInput) {
    titleInput.classList.remove('input-error');
    titleInput.removeAttribute('aria-invalid');
  }

  renderBellPresets();

  const state = store.getState();
  const delBtn = $('btnModalDeleteLesson') as HTMLButtonElement | null;
  const modalTitle = $('modalLessonTitle');
  const uidInput = $('lessonUid') as HTMLInputElement | null;
  const weekSelect = $('lessonWeek') as HTMLSelectElement | null;
  const daySelect = $('lessonDay') as HTMLSelectElement | null;
  const startInput = $('lessonStart') as HTMLInputElement | null;
  const endInput = $('lessonEnd') as HTMLInputElement | null;
  const roomInput = $('lessonRoom') as HTMLInputElement | null;
  const teacherInput = $('lessonTeacher') as HTMLInputElement | null;
  const noteInput = $('lessonNote') as HTMLTextAreaElement | null;

  if (uid) {
    const lesson = state.lessons.find(l => l.uid === uid);
    if (!lesson) return;
    if (modalTitle) modalTitle.textContent = 'Редактировать пару';
    if (uidInput) uidInput.value = lesson.uid;
    if (weekSelect) weekSelect.value = String(lesson.w);
    if (daySelect) daySelect.value = String(lesson.d);
    if (titleInput) titleInput.value = lesson.title;
    selectLessonType(lesson);
    if (startInput) startInput.value = lesson.start;
    if (endInput) endInput.value = lesson.end;
    if (roomInput) roomInput.value = lesson.room || '';
    if (teacherInput) teacherInput.value = lesson.teacher || '';
    if (noteInput) noteInput.value = lesson.note || '';
    if (delBtn) {
      delBtn.style.display = '';
      delBtn.onclick = () => {
        closeModal('modalLesson');
        confirmDeleteLesson(lesson.uid);
      };
    }
  } else {
    if (modalTitle) modalTitle.textContent = 'Новая пара';
    if (uidInput) uidInput.value = '';
    if (weekSelect) weekSelect.value = String(defaultWeek || state.activeWeek);

    const shownDay = isoWeekday(state.activeDate);
    if (daySelect) daySelect.value = String(defaultDay || (shownDay <= 6 ? shownDay : 1));

    const w = parseInt(weekSelect ? weekSelect.value : '1', 10);
    const d = parseInt(daySelect ? daySelect.value : '1', 10);
    const existing = state.lessons.filter(l => l.w === w && l.d === d);

    let suggestedBell = state.settings.bells[0] || { start: '08:30', end: '10:00' };
    for (const bell of state.settings.bells) {
      if (!existing.some(l => l.start === bell.start)) {
        suggestedBell = bell;
        break;
      }
    }
    if (startInput) startInput.value = suggestedBell.start;
    if (endInput) endInput.value = suggestedBell.end;
    if (delBtn) {
      delBtn.style.display = 'none';
      delBtn.onclick = null;
    }
  }

  updateBellPresetActive();
  checkCollisionWarning();
  openModal('modalLesson');
}

export function confirmDeleteLesson(uid: string): void {
  const state = store.getState();
  const lesson = state.lessons.find(l => l.uid === uid);
  if (!lesson) return;
  showConfirmDialog(
    'Удаление пары',
    `Удалить пару «${lesson.title}» (${lesson.start}–${lesson.end})?`,
    () => deleteLessonWithUndo(uid)
  );
}

export function deleteLessonWithUndo(uid: string): void {
  const removed = store.deleteLesson(uid);
  if (!removed) return;
  showToast(`Пара «${removed.title}» удалена`, 'Отменить', () => {
    if (store.restoreLastDeleted()) {
      showToast('Удаление отменено, пара восстановлена');
    }
  });
}

export function initLessonModal(): void {
  const bellRow = $('bellPresetsRow');
  if (bellRow) {
    bellRow.addEventListener('click', (e) => {
      const pill = (e.target as HTMLElement).closest('.bell-pill');
      if (!pill) return;
      const startInput = $('lessonStart') as HTMLInputElement | null;
      const endInput = $('lessonEnd') as HTMLInputElement | null;
      if (startInput) startInput.value = pill.getAttribute('data-start') || '';
      if (endInput) endInput.value = pill.getAttribute('data-end') || '';
      updateBellPresetActive();
      checkCollisionWarning();
    });
  }

  ['lessonWeek', 'lessonDay', 'lessonStart', 'lessonEnd'].forEach(id => {
    const el = $(id);
    if (el) {
      el.addEventListener('change', () => {
        updateBellPresetActive();
        checkCollisionWarning();
      });
      el.addEventListener('input', () => {
        updateBellPresetActive();
        checkCollisionWarning();
      });
    }
  });

  const form = $('formLesson') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const uidInput = $('lessonUid') as HTMLInputElement | null;
    const weekSelect = $('lessonWeek') as HTMLSelectElement | null;
    const daySelect = $('lessonDay') as HTMLSelectElement | null;
    const titleInput = $('lessonTitle') as HTMLInputElement | null;
    const typeSelect = $('lessonType') as HTMLSelectElement | null;
    const startInput = $('lessonStart') as HTMLInputElement | null;
    const endInput = $('lessonEnd') as HTMLInputElement | null;
    const roomInput = $('lessonRoom') as HTMLInputElement | null;
    const teacherInput = $('lessonTeacher') as HTMLInputElement | null;
    const noteInput = $('lessonNote') as HTMLTextAreaElement | null;

    if (!weekSelect || !daySelect || !titleInput || !typeSelect || !startInput || !endInput) return;

    const uid = uidInput ? uidInput.value : '';
    const w = parseInt(weekSelect.value, 10) as WeekParity;
    const d = parseInt(daySelect.value, 10);
    const title = sanitizeString(titleInput.value, 200);
    const [typeClass, typeName] = typeSelect.value.split('|');
    const start = startInput.value;
    const end = endInput.value;

    let firstError: HTMLElement | null = null;
    const titleErr = $('lessonTitleError');
    const timeErr = $('lessonTimeError');

    if (!title) {
      if (titleErr) titleErr.style.display = 'block';
      titleInput.classList.add('input-error');
      titleInput.setAttribute('aria-invalid', 'true');
      firstError = firstError || titleInput;
    } else {
      if (titleErr) titleErr.style.display = 'none';
      titleInput.classList.remove('input-error');
      titleInput.removeAttribute('aria-invalid');
    }

    if (!start || !end || timeToMinutes(end) <= timeToMinutes(start)) {
      if (timeErr) timeErr.style.display = 'block';
      firstError = firstError || startInput;
    } else {
      if (timeErr) timeErr.style.display = 'none';
    }

    if (firstError) {
      firstError.scrollIntoView({ block: 'center', behavior: 'smooth' });
      if (window.matchMedia('(pointer: fine)').matches) firstError.focus({ preventScroll: true });
      return;
    }

    const existingLesson = uid ? store.getState().lessons.find(l => l.uid === uid) : null;
    const lesson: Lesson = {
      uid: uid || generateUid(),
      w,
      d,
      title,
      typeClass,
      typeName,
      start,
      end,
      room: roomInput ? sanitizeString(roomInput.value, 80) : '',
      teacher: teacherInput ? sanitizeString(teacherInput.value, 80) : '',
      note: noteInput ? sanitizeString(noteInput.value, 200) : '',
      ...(existingLesson?.dates ? { dates: existingLesson.dates } : {})
    };

    const isExisting = Boolean(uid);
    store.addOrUpdateLesson(lesson);
    closeModal('modalLesson');
    store.goToWeekDay(w, d);

    setTimeout(() => {
      const el = document.querySelector(`[data-uid="${lesson.uid}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        el.classList.add('flash-highlight');
        setTimeout(() => el.classList.remove('flash-highlight'), 1200);
      }
    }, 80);

    showToast(isExisting ? 'Занятие обновлено' : 'Новая пара успешно добавлена');
  });
}
