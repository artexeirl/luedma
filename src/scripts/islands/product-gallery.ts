import { mountOnce, queryIslandRoots } from './runtime';
import type { GalleryIslandProps } from '../../types/content';

function mountGallery(root: HTMLElement): void {
  const props = JSON.parse(root.getAttribute('data-island-props') ?? '{}') as GalleryIslandProps;
  const mainImage = root.querySelector<HTMLImageElement>('[data-gallery-main]');
  const thumbs = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-gallery-thumb]'));

  if (!mainImage || thumbs.length === 0) {
    return;
  }

  const setActive = (button: HTMLButtonElement) => {
    const src = button.getAttribute('data-src');
    const alt = button.getAttribute('data-alt') || mainImage.alt;

    if (!src) {
      return;
    }

    mainImage.src = src;
    mainImage.alt = alt;

    thumbs.forEach((thumb) => {
      thumb.classList.toggle('is-active', thumb === button);
      thumb.setAttribute('aria-pressed', thumb === button ? 'true' : 'false');
    });
  };

  thumbs.forEach((thumb) => thumb.addEventListener('click', () => setActive(thumb)));

  const initial = thumbs[props.activeIndex ?? 0] ?? thumbs[0];
  setActive(initial);
}

export function mount(): void {
  queryIslandRoots('product-gallery').forEach((root) => mountOnce(root, mountGallery));
}
