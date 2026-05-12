import { mountOnce, queryIslandRoots } from './runtime';
import type { GalleryIslandProps } from '../../types/content';

type ThumbAxis = 'vertical' | 'horizontal';

type Point = {
  x: number;
  y: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function mountGallery(root: HTMLElement): void {
  const props = JSON.parse(root.getAttribute('data-island-props') ?? '{}') as Partial<GalleryIslandProps>;
  const mainStage = root.querySelector<HTMLElement>('[data-gallery-stage]');
  const mainFrame = root.querySelector<HTMLElement>('.product-gallery__main-frame');
  const mainImage = root.querySelector<HTMLImageElement>('[data-gallery-main]');
  const thumbs = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-gallery-thumb]'));
  const thumbsViewport = root.querySelector<HTMLElement>('[data-gallery-viewport]');
  const thumbsTrack = root.querySelector<HTMLElement>('[data-gallery-track]');
  const prevMainButton = root.querySelector<HTMLButtonElement>('[data-gallery-main-prev]');
  const nextMainButton = root.querySelector<HTMLButtonElement>('[data-gallery-main-next]');

  if (!mainStage || !mainFrame || !mainImage || !thumbsViewport || !thumbsTrack || thumbs.length === 0) {
    return;
  }

  const mobileQuery = window.matchMedia('(max-width: 760px)');
  let thumbAxis: ThumbAxis = mobileQuery.matches ? 'horizontal' : 'vertical';
  let activeIndex = clamp(props.activeIndex ?? 0, 0, thumbs.length - 1);
  let thumbStart = 0;

  let hoverActive = false;
  let touchPointerId: number | null = null;
  let touchStartPoint: Point = { x: 0, y: 0 };
  let touchStartPan: Point = { x: 0, y: 0 };

  const setCssVar = (name: string, value: string) => {
    mainImage.style.setProperty(name, value);
  };

  const resetZoom = () => {
    mainStage.classList.remove('is-hovering', 'is-touch-zooming');
    setCssVar('--gallery-scale', '1');
    setCssVar('--gallery-pan-x', '0px');
    setCssVar('--gallery-pan-y', '0px');
    setCssVar('--gallery-focus-x', '50%');
    setCssVar('--gallery-focus-y', '50%');
  };

  const updateFocus = (clientX: number, clientY: number) => {
    const rect = mainFrame.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }

    const focusX = clamp(((clientX - rect.left) / rect.width) * 100, 0, 100);
    const focusY = clamp(((clientY - rect.top) / rect.height) * 100, 0, 100);
    setCssVar('--gallery-focus-x', `${focusX}%`);
    setCssVar('--gallery-focus-y', `${focusY}%`);
  };

  const getThumbGap = (): number => {
    const styles = window.getComputedStyle(thumbsTrack);
    const rawGap = styles.gap || styles.rowGap || styles.columnGap || '0';
    const parsed = Number.parseFloat(rawGap);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const getThumbStep = (): number => {
    const first = thumbs[0];
    const second = thumbs[1];
    if (!first) {
      return 0;
    }

    if (!second) {
      return thumbAxis === 'horizontal' ? first.offsetWidth : first.offsetHeight;
    }

    if (thumbAxis === 'horizontal') {
      return second.offsetLeft - first.offsetLeft || first.offsetWidth;
    }

    return second.offsetTop - first.offsetTop || first.offsetHeight;
  };

  const getVisibleThumbCount = (): number => {
    const step = getThumbStep() || (thumbAxis === 'horizontal' ? thumbs[0].offsetWidth : thumbs[0].offsetHeight);
    if (step <= 0) {
      return 1;
    }

    const viewportSize = thumbAxis === 'horizontal' ? thumbsViewport.clientWidth : thumbsViewport.clientHeight;
    const gap = getThumbGap();
    return Math.max(1, Math.floor((viewportSize + gap) / step));
  };

  const syncThumbRail = () => {
    const isHorizontalRail = thumbAxis === 'horizontal';
    const visibleCount = getVisibleThumbCount();
    const hasOverflow = !isHorizontalRail && thumbsTrack.scrollHeight > thumbsViewport.clientHeight + 1;
    const step = getThumbStep();
    const maxStart = Math.max(thumbs.length - visibleCount, 0);

    if (isHorizontalRail) {
      thumbStart = 0;
      thumbsTrack.style.transform = 'none';
      return;
    }

    if (thumbStart > maxStart) {
      thumbStart = maxStart;
    }

    if (!hasOverflow || step <= 0) {
      thumbsTrack.style.transform = 'none';
      return;
    }

    thumbsTrack.style.transform = `translate3d(0, ${-thumbStart * step}px, 0)`;
  };

  const ensureThumbVisible = (button: HTMLButtonElement) => {
    if (thumbAxis === 'horizontal') {
      button.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      return;
    }

    const targetIndex = thumbs.indexOf(button);
    if (targetIndex === -1) {
      return;
    }

    const visibleCount = getVisibleThumbCount();
    const maxStart = Math.max(thumbs.length - visibleCount, 0);

    if (targetIndex < thumbStart) {
      thumbStart = targetIndex;
    } else if (targetIndex >= thumbStart + visibleCount) {
      thumbStart = Math.min(targetIndex - visibleCount + 1, maxStart);
    }

    syncThumbRail();
  };

  const setActiveThumb = (index: number, shouldRevealThumb = true) => {
    const nextIndex = clamp(index, 0, thumbs.length - 1);
    const nextThumb = thumbs[nextIndex];
    const src = nextThumb.getAttribute('data-src');
    const alt = nextThumb.getAttribute('data-alt') || mainImage.alt;

    if (!src) {
      return;
    }

    activeIndex = nextIndex;
    mainImage.src = src;
    mainImage.alt = alt;

    thumbs.forEach((thumb, thumbIndex) => {
      const isActive = thumbIndex === nextIndex;
      thumb.classList.toggle('is-active', isActive);
      thumb.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    if (shouldRevealThumb) {
      ensureThumbVisible(nextThumb);
    }
  };

  const goTo = (index: number) => {
    setActiveThumb(index, true);
  };

  const nextImage = () => {
    goTo(activeIndex + 1);
  };

  const previousImage = () => {
    goTo(activeIndex - 1);
  };

  const handleLayoutChange = () => {
    const nextAxis: ThumbAxis = mobileQuery.matches ? 'horizontal' : 'vertical';
    if (nextAxis !== thumbAxis) {
      thumbAxis = nextAxis;
      thumbStart = 0;
    }

    syncThumbRail();
  };

  thumbs.forEach((thumb, index) => {
    thumb.addEventListener('click', () => goTo(index));
  });

  prevMainButton?.addEventListener('click', previousImage);
  nextMainButton?.addEventListener('click', nextImage);

  mainFrame.addEventListener('pointerenter', (event) => {
    if (event.pointerType !== 'mouse') {
      return;
    }

    hoverActive = true;
    mainStage.classList.add('is-hovering');
    setCssVar('--gallery-scale', '1');
    updateFocus(event.clientX, event.clientY);
    setCssVar('--gallery-scale', '1.72');
  });

  mainFrame.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'mouse') {
      if (!hoverActive) {
        return;
      }

      updateFocus(event.clientX, event.clientY);
      return;
    }

    if (event.pointerType !== 'touch' || touchPointerId !== event.pointerId || !mainStage.classList.contains('is-touch-zooming')) {
      return;
    }

    updateFocus(event.clientX, event.clientY);
    setCssVar('--gallery-pan-x', `${touchStartPan.x + (event.clientX - touchStartPoint.x)}px`);
    setCssVar('--gallery-pan-y', `${touchStartPan.y + (event.clientY - touchStartPoint.y)}px`);
  });

  mainFrame.addEventListener('pointerleave', (event) => {
    if (event.pointerType !== 'mouse') {
      return;
    }

    hoverActive = false;
    mainStage.classList.remove('is-hovering');
    resetZoom();
  });

  mainFrame.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'touch') {
      return;
    }

    touchPointerId = event.pointerId;
    touchStartPoint = { x: event.clientX, y: event.clientY };
    touchStartPan = { x: 0, y: 0 };
    mainStage.classList.add('is-touch-zooming');
    setCssVar('--gallery-scale', '2.05');
    updateFocus(event.clientX, event.clientY);
    setCssVar('--gallery-pan-x', '0px');
    setCssVar('--gallery-pan-y', '0px');
    mainFrame.setPointerCapture(event.pointerId);
  });

  const finishTouch = (event: PointerEvent) => {
    if (event.pointerType !== 'touch' || touchPointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - touchStartPoint.x;
    const deltaY = event.clientY - touchStartPoint.y;
    const swipeThreshold = 44;

    if (Math.abs(deltaX) > swipeThreshold && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        nextImage();
      } else {
        previousImage();
      }
    }

    touchPointerId = null;
    mainStage.classList.remove('is-touch-zooming');
    setCssVar('--gallery-scale', '1');
    setCssVar('--gallery-pan-x', '0px');
    setCssVar('--gallery-pan-y', '0px');
    setCssVar('--gallery-focus-x', '50%');
    setCssVar('--gallery-focus-y', '50%');
  };

  mainFrame.addEventListener('pointerup', finishTouch);
  mainFrame.addEventListener('pointercancel', finishTouch);

  mobileQuery.addEventListener('change', handleLayoutChange);
  window.addEventListener('resize', syncThumbRail, { passive: true });

  setActiveThumb(activeIndex, false);
  resetZoom();
  handleLayoutChange();
}

export function mount(): void {
  queryIslandRoots('product-gallery').forEach((root) => mountOnce(root, mountGallery));
}
