export function showToast(
  message: string,
  actionLabel: string | null = null,
  actionCallback: (() => void) | null = null
): void {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  while (container.children.length >= 3) container.firstElementChild?.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';

  const textSpan = document.createElement('span');
  textSpan.textContent = message;
  toast.appendChild(textSpan);

  if (actionLabel && actionCallback) {
    const actionBtn = document.createElement('button');
    actionBtn.type = 'button';
    actionBtn.className = 'toast-btn-undo';
    actionBtn.textContent = actionLabel;
    actionBtn.addEventListener('click', () => {
      actionCallback();
      toast.remove();
    });
    toast.appendChild(actionBtn);
  }

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    toast.style.transition = 'all 0.2s ease';
    setTimeout(() => toast.remove(), 200);
  }, actionLabel ? 6000 : 3500);
}
