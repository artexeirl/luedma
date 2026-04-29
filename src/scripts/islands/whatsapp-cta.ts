import { mountOnce, queryIslandRoots } from './runtime';

function buildUrl(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function mountWhatsappCta(root: HTMLElement): void {
  const phone = root.getAttribute('data-whatsapp-number') || '51936829528';
  const message = root.getAttribute('data-whatsapp-message') || 'Hola Maquinarias Luedma.';

  if (root instanceof HTMLAnchorElement) {
    root.href = buildUrl(phone, message);
    return;
  }

  const link = root.querySelector<HTMLAnchorElement>('a[data-whatsapp-link]');
  if (link) {
    link.href = buildUrl(phone, message);
  }
}

export function mount(): void {
  queryIslandRoots('whatsapp-cta').forEach((root) => mountOnce(root, mountWhatsappCta));
}
