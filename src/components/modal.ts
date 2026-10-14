let activeModal: HTMLElement | null = null;
let previousActiveElement: HTMLElement | null = null;

export function openModal(id: string): void {
  const modal = document.getElementById(id);
  if (!modal) return;
  previousActiveElement = document.activeElement as HTMLElement | null;
  modal.classList.add('open');
  activeModal = modal;
  document.body.style.overflow = 'hidden';

  const firstInput = modal.querySelector<HTMLElement>('input:not([type="hidden"]), select, textarea, button:not(.btn-modal-close)');
  if (firstInput && window.matchMedia('(pointer: fine)').matches) {
    setTimeout(() => firstInput.focus(), 50);
  }
}

export function closeModal(id: string): void {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('open');
  if (activeModal === modal) activeModal = null;
  if (!document.querySelector('.modal-backdrop.open')) {
    document.body.style.overflow = '';
  }
  if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
    previousActiveElement.focus();
  }
}

export function showConfirmDialog(
  title: string,
  message: string,
  onConfirm: () => void,
  confirmLabel = 'Удалить',
  isDestructive = true
): void {
  const titleEl = document.getElementById('confirmTitle') || document.getElementById('modalConfirmTitle');
  const msgEl = document.getElementById('confirmMessage') || document.getElementById('modalConfirmMessage');
  const btnConfirm = document.getElementById('btnConfirmAction') as HTMLButtonElement | null;

  if (titleEl) titleEl.textContent = title;
  if (msgEl) msgEl.textContent = message;

  if (btnConfirm) {
    btnConfirm.textContent = confirmLabel;
    btnConfirm.className = isDestructive ? 'btn btn-danger' : 'btn btn-primary';
    btnConfirm.onclick = () => {
      closeModal('modalConfirm');
      onConfirm();
    };
  }
  openModal('modalConfirm');
}

export function initModals(): void {
  document.querySelectorAll<HTMLElement>('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest<HTMLElement>('.modal-backdrop');
      if (modal) closeModal(modal.id);
    });
  });

  document.querySelectorAll<HTMLElement>('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal.id);
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const openModals = document.querySelectorAll<HTMLElement>('.modal-backdrop.open');
      if (openModals.length > 0) {
        const top = openModals[openModals.length - 1];
        closeModal(top.id);
      }
    }
  });
}
