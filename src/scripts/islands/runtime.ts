const mounted = new WeakSet<Element>();

export function queryIslandRoots(name: string): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(`[data-island="${name}"]`));
}

export function mountOnce(root: Element, mount: (root: HTMLElement) => void): void {
  if (!(root instanceof HTMLElement) || mounted.has(root)) {
    return;
  }

  mount(root);
  mounted.add(root);
}

export function observeDeferred(
  roots: HTMLElement[],
  callback: (root: HTMLElement) => void,
  rootMargin = '180px 0px 180px 0px',
): void {
  if (roots.length === 0) {
    return;
  }

  if (!('IntersectionObserver' in window)) {
    roots.forEach(callback);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.target instanceof HTMLElement) {
          callback(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin },
  );

  roots.forEach((root) => observer.observe(root));
}
