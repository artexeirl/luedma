import { mountOnce, queryIslandRoots } from './runtime';

function mountHeroCarousel(root: HTMLElement): void {
  const track = root.querySelector<HTMLElement>('[data-hero-track]');
  const prevButton = root.querySelector<HTMLButtonElement>('[data-hero-prev]');
  const nextButton = root.querySelector<HTMLButtonElement>('[data-hero-next]');
  const dots = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-hero-dot]'));

  if (!track || !prevButton || !nextButton || dots.length === 0) {
    return;
  }

  const totalSlides = dots.length;
  let currentIndex = 0;

  const update = (index: number) => {
    currentIndex = (index + totalSlides) % totalSlides;
    track.style.transform = `translate3d(-${currentIndex * 100}%, 0, 0)`;

    dots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === currentIndex;
      dot.classList.toggle('is-active', isActive);
      dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  };

  prevButton.addEventListener('click', () => {
    update(currentIndex - 1);
  });

  nextButton.addEventListener('click', () => {
    update(currentIndex + 1);
  });

  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const index = Number(dot.getAttribute('data-hero-dot'));
      if (Number.isNaN(index)) {
        return;
      }

      update(index);
    });
  });
}

export function mount(): void {
  queryIslandRoots('hero-carousel').forEach((root) => mountOnce(root, mountHeroCarousel));
}
