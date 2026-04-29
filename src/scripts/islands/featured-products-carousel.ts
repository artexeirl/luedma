import { mountOnce, queryIslandRoots } from './runtime';

function mountFeaturedProductsCarousel(root: HTMLElement): void {
  const track = root.querySelector<HTMLElement>('[data-featured-track]');
  const prevButton = root.querySelector<HTMLButtonElement>('[data-featured-prev]');
  const nextButton = root.querySelector<HTMLButtonElement>('[data-featured-next]');

  if (!track || !prevButton || !nextButton) {
    return;
  }

  const pages = Array.from(track.querySelectorAll<HTMLElement>('[data-featured-page]'));
  const maxIndex = Math.max(0, pages.length - 1);
  let currentIndex = 0;

  const update = (): void => {
    track.style.transform = `translate3d(-${currentIndex * 100}%, 0, 0)`;
    prevButton.disabled = currentIndex <= 0;
    nextButton.disabled = currentIndex >= maxIndex;
  };

  prevButton.addEventListener('click', () => {
    if (currentIndex <= 0) {
      return;
    }
    currentIndex -= 1;
    update();
  });

  nextButton.addEventListener('click', () => {
    if (currentIndex >= maxIndex) {
      return;
    }
    currentIndex += 1;
    update();
  });

  update();
}

export function mount(): void {
  queryIslandRoots('featured-products-carousel').forEach((root) => mountOnce(root, mountFeaturedProductsCarousel));
}
