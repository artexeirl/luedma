import { mountOnce, queryIslandRoots } from './runtime';
import type { GalleryIslandProps } from '../../types/content';

function mountGallery(root: HTMLElement): void {
  const props = JSON.parse(root.getAttribute('data-island-props') ?? '{}') as GalleryIslandProps;
  const mainImage = root.querySelector<HTMLImageElement>('[data-gallery-main]');
  const thumbs = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-gallery-thumb]'));
  const track = root.querySelector<HTMLElement>('[data-gallery-track]');
  const prevButton = root.querySelector<HTMLButtonElement>('[data-gallery-prev]');
  const nextButton = root.querySelector<HTMLButtonElement>('[data-gallery-next]');
  const visibleCount = 5;
  const hasCarousel = Boolean(track && prevButton && nextButton && thumbs.length > visibleCount);
  let startIndex = 0;

  if (!mainImage || thumbs.length === 0) {
    return;
  }

  const maxStart = Math.max(thumbs.length - visibleCount, 0);

  const getThumbStep = (): number => {
    if (!hasCarousel || !track) {
      return 0;
    }

    const first = thumbs[0];
    const second = thumbs[1];
    if (!first) {
      return 0;
    }

    return second ? second.offsetTop - first.offsetTop || first.offsetHeight : first.offsetHeight;
  };

  const syncCarousel = () => {
    if (!hasCarousel || !track || !prevButton || !nextButton) {
      return;
    }

    const step = getThumbStep();
    track.style.transform = `translate3d(0, ${-startIndex * step}px, 0)`;
    prevButton.disabled = startIndex <= 0;
    nextButton.disabled = startIndex >= maxStart;
  };

  const ensureThumbVisible = (button: HTMLButtonElement) => {
    if (!hasCarousel) {
      return;
    }

    const targetIndex = thumbs.indexOf(button);
    if (targetIndex === -1) {
      return;
    }

    if (targetIndex < startIndex) {
      startIndex = targetIndex;
    } else if (targetIndex >= startIndex + visibleCount) {
      startIndex = Math.min(targetIndex - visibleCount + 1, maxStart);
    }

    syncCarousel();
  };

  const setActive = (button: HTMLButtonElement) => {
    const src = button.getAttribute('data-src');
    const alt = button.getAttribute('data-alt') || mainImage.alt;

    if (!src) {
      return;
    }

    mainImage.src = src;
    mainImage.alt = alt;

    thumbs.forEach((thumb) => {
      const isActive = thumb === button;
      thumb.classList.toggle('is-active', isActive);
      thumb.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    ensureThumbVisible(button);
  };

  thumbs.forEach((thumb) => thumb.addEventListener('click', () => setActive(thumb)));

  prevButton?.addEventListener('click', () => {
    startIndex = Math.max(startIndex - 1, 0);
    syncCarousel();
  });

  nextButton?.addEventListener('click', () => {
    startIndex = Math.min(startIndex + 1, maxStart);
    syncCarousel();
  });

  window.addEventListener('resize', syncCarousel, { passive: true });

  const initial = thumbs[props.activeIndex ?? 0] ?? thumbs[0];
  setActive(initial);
  syncCarousel();
}

export function mount(): void {
  queryIslandRoots('product-gallery').forEach((root) => mountOnce(root, mountGallery));
}
