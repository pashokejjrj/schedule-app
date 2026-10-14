import { store } from '../state/store';
import { exportICS } from '../services/ics-export';
import { exportJSON, importJSONFile } from '../services/json-transfer';
import { showConfirmDialog, closeModal } from './modal';
import { renderPrintSchedule } from './print-view';
import { showToast } from './toast';

export function initDataActions(): void {
  const btnDownloadIcs = document.getElementById('btnDownloadIcs');
  if (btnDownloadIcs) {
    btnDownloadIcs.addEventListener('click', () => {
      const state = store.getState();
      const res = exportICS(state.lessons, state.settings);
      if (res.success) {
        showToast(`Экспортировано занятий: ${res.count}`);
      } else if (res.error) {
        showToast(res.error);
      }
    });
  }

  const btnExportJson = document.getElementById('btnExportJson');
  if (btnExportJson) {
    btnExportJson.addEventListener('click', () => {
      const state = store.getState();
      exportJSON(state.lessons, state.settings);
      showToast('Расписание экспортировано в JSON');
    });
  }

  const fileInputJson = document.getElementById('fileInputJson') as HTMLInputElement | null;
  if (fileInputJson) {
    fileInputJson.addEventListener('change', async (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      try {
        const res = await importJSONFile(file);
        if (res.settings) store.setSettings(res.settings);
        if (res.lessons) store.setLessons(res.lessons);
        showToast(`Импортировано занятий: ${res.lessons.length}`);
      } catch (err: any) {
        showToast(err?.message || 'Ошибка импорта файла');
      } finally {
        target.value = '';
      }
    });
  }

  const btnFillDemo = document.getElementById('btnFillDemo');
  if (btnFillDemo) {
    btnFillDemo.addEventListener('click', () => {
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
    });
  }

  const btnClearAll = document.getElementById('btnClearAll');
  if (btnClearAll) {
    btnClearAll.addEventListener('click', () => {
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
    });
  }

  const btnPrintSchedule = document.getElementById('btnPrintSchedule');
  if (btnPrintSchedule) {
    btnPrintSchedule.addEventListener('click', () => {
      closeModal('modalExportImport');
      renderPrintSchedule();
      window.print();
    });
  }

  window.addEventListener('beforeprint', renderPrintSchedule);
}
