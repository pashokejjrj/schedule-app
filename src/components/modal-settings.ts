import { store } from '../state/store';
import type { BellItem, Settings } from '../domain/types';
import { timeToMinutes, minutesToTime, isValidTime } from '../domain/time';
import { parseDateString, getMondayOf, formatDateISO } from '../domain/parity';
import { sanitizeString } from '../services/storage';
import { openModal, closeModal } from './modal';
import { showToast } from './toast';

function $(id: string): HTMLElement | null {
  return document.getElementById(id);
}

let bellsDraft: BellItem[] = [];

function syncBellsDraft(): void {
  const tbody = $('bellsTableBody');
  if (!tbody) return;
  tbody.querySelectorAll('tr').forEach((tr, i) => {
    if (!bellsDraft[i]) return;
    const startEl = tr.querySelector('.bell-set-start') as HTMLInputElement | null;
    const endEl = tr.querySelector('.bell-set-end') as HTMLInputElement | null;
    if (startEl) bellsDraft[i].start = startEl.value;
    if (endEl) bellsDraft[i].end = endEl.value;
  });
}

function renderBellsSettingsTable(): void {
  const tbody = $('bellsTableBody');
  if (!tbody) return;
  tbody.innerHTML = bellsDraft.map((bell, idx) => `
    <tr>
      <td><b class="tabular-nums">${idx + 1}</b></td>
      <td><input type="time" class="form-input bell-time-input bell-set-start" value="${bell.start}" aria-label="Начало ${idx + 1}-й пары"></td>
      <td><input type="time" class="form-input bell-time-input bell-set-end" value="${bell.end}" aria-label="Конец ${idx + 1}-й пары"></td>
      <td><button type="button" class="icon-action-btn btn-delete btn-del-bell" data-index="${idx}" title="Удалить звонок" aria-label="Удалить звонок ${idx + 1}">&times;</button></td>
    </tr>
  `).join('');
}

export function openSettingsModal(): void {
  const state = store.getState();
  const groupNameInput = $('setGroupName') as HTMLInputElement | null;
  const groupSubtitleInput = $('setGroupSubtitle') as HTMLInputElement | null;
  const baseMondayInput = $('setBaseMonday') as HTMLInputElement | null;
  const firstDayInput = $('setFirstDay') as HTMLInputElement | null;
  const lastDayInput = $('setLastDay') as HTMLInputElement | null;

  if (groupNameInput) groupNameInput.value = state.settings.groupName;
  if (groupSubtitleInput) groupSubtitleInput.value = state.settings.groupSubtitle;
  if (baseMondayInput) baseMondayInput.value = state.settings.semesterStartMonday;
  if (firstDayInput) firstDayInput.value = state.settings.semesterFirstDay;
  if (lastDayInput) lastDayInput.value = state.settings.semesterLastDay;

  bellsDraft = state.settings.bells.map(b => ({ start: b.start, end: b.end, num: b.num }));
  renderBellsSettingsTable();
  openModal('modalSettings');
}

export function initSettingsModal(): void {
  const tbody = $('bellsTableBody');
  if (tbody) {
    tbody.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('.btn-del-bell');
      if (!btn) return;
      syncBellsDraft();
      const idx = parseInt(btn.getAttribute('data-index') || '0', 10);
      bellsDraft.splice(idx, 1);
      renderBellsSettingsTable();
    });
  }

  const btnAddBell = $('btnAddBellSlot');
  if (btnAddBell) {
    btnAddBell.addEventListener('click', () => {
      syncBellsDraft();
      const last = bellsDraft[bellsDraft.length - 1];
      let start = '18:40';
      let end = '20:10';
      if (last && isValidTime(last.end)) {
        const startMin = timeToMinutes(last.end) + 10;
        if (startMin + 90 <= 23 * 60 + 59) {
          start = minutesToTime(startMin);
          end = minutesToTime(startMin + 90);
        }
      }
      bellsDraft.push({ start, end, num: bellsDraft.length + 1 });
      renderBellsSettingsTable();
      const rows = tbody ? tbody.querySelectorAll('tr') : [];
      if (rows.length) rows[rows.length - 1].scrollIntoView({ block: 'nearest' });
    });
  }

  const form = $('formSettings') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    syncBellsDraft();

    const firstDayInput = $('setFirstDay') as HTMLInputElement | null;
    const lastDayInput = $('setLastDay') as HTMLInputElement | null;
    const baseMondayInput = $('setBaseMonday') as HTMLInputElement | null;
    const groupNameInput = $('setGroupName') as HTMLInputElement | null;
    const groupSubtitleInput = $('setGroupSubtitle') as HTMLInputElement | null;

    const firstDay = firstDayInput ? firstDayInput.value : '';
    const lastDay = lastDayInput ? lastDayInput.value : '';

    if (firstDay && lastDay && lastDay < firstDay) {
      showToast('Конец семестра не может быть раньше начала занятий');
      return;
    }

    const bells = bellsDraft.filter(b => b.start && b.end);
    if (bells.some(b => timeToMinutes(b.end) <= timeToMinutes(b.start))) {
      showToast('В сетке звонков окончание должно быть позже начала');
      return;
    }
    bells.sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));

    const rawMonday = baseMondayInput && baseMondayInput.value ? parseDateString(baseMondayInput.value) : new Date();
    const semesterStartMonday = formatDateISO(getMondayOf(rawMonday));

    const updatedSettings: Settings = {
      groupName: groupNameInput ? sanitizeString(groupNameInput.value, 60) || 'Моя группа' : 'Моя группа',
      groupSubtitle: groupSubtitleInput ? sanitizeString(groupSubtitleInput.value, 120) : '',
      semesterStartMonday,
      semesterFirstDay: firstDay,
      semesterLastDay: lastDay,
      bells: bells.length ? bells.map((b, i) => ({ start: b.start, end: b.end, num: i + 1 })) : store.getState().settings.bells
    };

    store.setSettings(updatedSettings);
    closeModal('modalSettings');
    showToast('Настройки успешно сохранены');
  });
}
