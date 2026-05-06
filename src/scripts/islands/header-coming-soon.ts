import { mountOnce, queryIslandRoots } from './runtime';

function mountComingSoon(root: HTMLElement): void {
  const triggers = Array.from(root.querySelectorAll<HTMLElement>('.header-coming-soon-trigger'));
  const backdrop = root.querySelector<HTMLElement>('[data-coming-soon-backdrop]');
  const popover = root.querySelector<HTMLElement>('[data-coming-soon-popover]');

  if (triggers.length === 0 || !backdrop || !popover) return;

  let hideTimer: number | null = null;

  const hide = () => {
    if (hideTimer) {
      window.clearTimeout(hideTimer);
      hideTimer = null;
    }
    backdrop.hidden = true;
    popover.hidden = true;
  };

  const positionPopover = (target: HTMLElement) => {
    const rect = target.getBoundingClientRect();
    const top = rect.bottom + 10;
    const left = rect.left + rect.width / 2;

    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
    popover.style.transform = 'translateX(-50%)';
  };

  const show = (target: HTMLElement) => {
    if (hideTimer) {
      window.clearTimeout(hideTimer);
      hideTimer = null;
    }

    const message = target.dataset.comingSoonMessage || 'Función en desarrollo.';
    popover.textContent = message;
    positionPopover(target);
    backdrop.hidden = false;
    popover.hidden = false;
  };

  const scheduleHide = () => {
    hideTimer = window.setTimeout(hide, 80);
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener('mouseenter', () => show(trigger));
    trigger.addEventListener('focus', () => show(trigger));
    trigger.addEventListener('mouseleave', scheduleHide);
    trigger.addEventListener('blur', scheduleHide);
  });

  window.addEventListener('scroll', hide, { passive: true });
  window.addEventListener('resize', hide);
  backdrop.addEventListener('mouseenter', hide);
}

export function mount(): void {
  queryIslandRoots('mobile-menu').forEach((root) => {
    mountOnce(root, mountComingSoon);
  });
}
