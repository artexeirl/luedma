import { queryIslandRoots, observeDeferred } from './runtime';

const deferredIslandLoaders: Record<string, () => Promise<{ mount: () => void }>> = {
  'catalog-controls': () => import('./catalog-controls'),
  'featured-products-carousel': () => import('./featured-products-carousel'),
  'home-product-selector': () => import('./home-product-selector'),
  'product-tabs': () => import('./product-tabs'),
  'product-gallery': () => import('./product-gallery'),
  'trust-strip': () => import('./trust-strip'),
  'whatsapp-cta': () => import('./whatsapp-cta'),
};

export async function startIslands(): Promise<void> {
  const critical = await Promise.all([import('./mobile-menu'), import('./search'), import('./hero-carousel'), import('./header-coming-soon')]);
  critical.forEach((module) => module.mount());

  Object.entries(deferredIslandLoaders).forEach(([name, loader]) => {
    const roots = queryIslandRoots(name);
    if (roots.length === 0) {
      return;
    }

    let loaded = false;

    observeDeferred(roots, async () => {
      if (loaded) {
        return;
      }
      loaded = true;
      const module = await loader();
      module.mount();
    });

    const trigger = () => {
      if (loaded) {
        return;
      }
      loaded = true;
      loader().then((module) => module.mount());
      window.removeEventListener('pointerdown', trigger);
      window.removeEventListener('keydown', trigger);
      window.removeEventListener('touchstart', trigger);
    };

    window.addEventListener('pointerdown', trigger, { once: true, passive: true });
    window.addEventListener('keydown', trigger, { once: true });
    window.addEventListener('touchstart', trigger, { once: true, passive: true });
  });
}
