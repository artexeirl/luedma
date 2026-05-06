import { mountOnce, queryIslandRoots } from './runtime';

function mountHeroCarousel(root: HTMLElement): void {
  const track = root.querySelector<HTMLElement>('[data-hero-track]');
  const prevButton = root.querySelector<HTMLButtonElement>('[data-hero-prev]');
  const nextButton = root.querySelector<HTMLButtonElement>('[data-hero-next]');
  const dots = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-hero-dot]'));
  const mobileQuery = window.matchMedia('(max-width: 760px)');

  if (!track || !prevButton || !nextButton || dots.length === 0) {
    return;
  }

  const totalSlides = dots.length;
  const autoplayDelay = 6000;
  const slides = Array.from(track.children) as HTMLElement[];
  const firstClone = slides[0]?.cloneNode(true) as HTMLElement | undefined;
  const lastClone = slides[slides.length - 1]?.cloneNode(true) as HTMLElement | undefined;
  if (!firstClone || !lastClone) {
    return;
  }

  firstClone.setAttribute('data-hero-clone', 'first');
  lastClone.setAttribute('data-hero-clone', 'last');
  track.insertBefore(lastClone, slides[0]);
  track.appendChild(firstClone);

  let currentIndex = 1;
  let autoplayTimer: number | null = null;
  let touchStartX = 0;
  let touchCurrentX = 0;
  let isTouchTracking = false;
  let isTransitionEnabled = true;
  let isLocked = false;

  const setTransition = (enabled: boolean) => {
    isTransitionEnabled = enabled;
    track.style.transition = enabled ? 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)' : 'none';
  };

  const syncDots = () => {
    const activeDotIndex = (currentIndex - 1 + totalSlides) % totalSlides;
    dots.forEach((dot, index) => {
      const isActive = index === activeDotIndex;
      dot.classList.toggle('is-active', isActive);
      dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  };

  const render = () => {
    track.style.transform = `translate3d(-${currentIndex * 100}%, 0, 0)`;
    syncDots();
  };

  const jumpTo = (index: number) => {
    currentIndex = index;
    render();
  };

  const update = (index: number) => {
    if (isLocked) {
      return;
    }

    isLocked = true;
    setTransition(true);
    currentIndex = index;
    render();
  };

  const clearAutoplay = () => {
    if (autoplayTimer !== null) {
      window.clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  };

  const restartAutoplay = () => {
    clearAutoplay();
    autoplayTimer = window.setInterval(() => {
      update(currentIndex + 1);
    }, autoplayDelay);
  };

  prevButton.addEventListener('click', () => {
    update(currentIndex - 1);
    restartAutoplay();
  });

  nextButton.addEventListener('click', () => {
    update(currentIndex + 1);
    restartAutoplay();
  });

  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const index = Number(dot.getAttribute('data-hero-dot'));
      if (Number.isNaN(index)) {
        return;
      }

      update(index + 1);
      restartAutoplay();
    });
  });

  track.addEventListener('transitionend', () => {
    if (!isTransitionEnabled) {
      return;
    }

    if (currentIndex === 0) {
      setTransition(false);
      jumpTo(totalSlides);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTransition(true);
          isLocked = false;
        });
      });
      return;
    }

    if (currentIndex === totalSlides + 1) {
      setTransition(false);
      jumpTo(1);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTransition(true);
          isLocked = false;
        });
      });
      return;
    }

    isLocked = false;
  });

  root.addEventListener('mouseenter', clearAutoplay);
  root.addEventListener('mouseleave', restartAutoplay);
  root.addEventListener('focusin', clearAutoplay);
  root.addEventListener('focusout', restartAutoplay);

  track.addEventListener(
    'touchstart',
    (event) => {
      if (!mobileQuery.matches || event.touches.length !== 1) {
        return;
      }

      touchStartX = event.touches[0].clientX;
      touchCurrentX = touchStartX;
      isTouchTracking = true;
      clearAutoplay();
    },
    { passive: true },
  );

  track.addEventListener(
    'touchmove',
    (event) => {
      if (!isTouchTracking || !mobileQuery.matches || event.touches.length !== 1) {
        return;
      }

      touchCurrentX = event.touches[0].clientX;
    },
    { passive: true },
  );

  track.addEventListener(
    'touchend',
    () => {
      if (!isTouchTracking) {
        return;
      }

      const deltaX = touchCurrentX - touchStartX;
      const swipeThreshold = 42;

      if (Math.abs(deltaX) >= swipeThreshold) {
        update(deltaX > 0 ? currentIndex - 1 : currentIndex + 1);
      }

      isTouchTracking = false;
      touchStartX = 0;
      touchCurrentX = 0;
      restartAutoplay();
    },
    { passive: true },
  );

  track.addEventListener('touchcancel', () => {
    isTouchTracking = false;
    touchStartX = 0;
    touchCurrentX = 0;
    restartAutoplay();
  });

  setTransition(false);
  render();
  requestAnimationFrame(() => setTransition(true));
  restartAutoplay();
}

export function mount(): void {
  queryIslandRoots('hero-carousel').forEach((root) => mountOnce(root, mountHeroCarousel));
}
