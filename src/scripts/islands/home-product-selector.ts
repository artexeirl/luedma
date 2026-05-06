import { mountOnce, queryIslandRoots } from './runtime';

type ShowcaseItem = {
  brand: string;
  name: string;
  price: string;
  oldPrice?: string;
  badge?: string;
  image?: string;
  path?: string;
};

type ShowcaseIndex = Record<string, ShowcaseItem[]>;

const PANEL_SWITCH_MS = 320;
const SETTLE_BUFFER_MS = 40;
const SHOWCASE_PREVIEW_IMAGES = [
  '/images/products/p1.png',
  '/images/products/p2.jpg',
  '/images/products/p3.jpg',
  '/images/products/p4.jpg',
  '/images/products/p5.jpg',
  '/images/products/p6.jpg',
  '/images/products/p7.jpg',
  '/images/products/p8.jpg',
];

function pickPreviewImage(): string {
  return SHOWCASE_PREVIEW_IMAGES[Math.floor(Math.random() * SHOWCASE_PREVIEW_IMAGES.length)] || SHOWCASE_PREVIEW_IMAGES[0];
}

function buildCard(item: ShowcaseItem): HTMLElement {
  const article = document.createElement('article');
  article.className = 'showcase-card';

  const imageLink = document.createElement('a');
  imageLink.className = 'showcase-card__image-link';
  imageLink.href = item.path || '/tienda/';
  imageLink.setAttribute('aria-label', `Ver producto ${item.name}`);

  const image = document.createElement('img');
  image.src = item.image || pickPreviewImage();
  image.alt = `Imagen de ${item.name}`;
  image.loading = 'lazy';
  imageLink.append(image);

  const meta = document.createElement('div');
  meta.className = 'showcase-card__meta';

  const brand = document.createElement('p');
  brand.className = 'showcase-card__brand';
  brand.textContent = item.brand;
  meta.append(brand);

  if (item.badge) {
    const badge = document.createElement('span');
    badge.className = 'showcase-card__badge';
    badge.textContent = item.badge;
    meta.append(badge);
  }

  const name = document.createElement('h3');
  name.className = 'showcase-card__name';
  name.textContent = item.name;

  const footer = document.createElement('div');
  footer.className = 'showcase-card__footer';

  const priceWrap = document.createElement('div');
  priceWrap.className = 'showcase-card__price-wrap';

  if (item.oldPrice) {
    const oldPrice = document.createElement('span');
    oldPrice.className = 'showcase-card__old-price';
    oldPrice.textContent = item.oldPrice;
    priceWrap.append(oldPrice);
  }

  const price = document.createElement('p');
  price.className = 'showcase-card__price';
  price.textContent = item.price;
  priceWrap.append(price);

  const cta = document.createElement('a');
  cta.className = 'btn btn-primary showcase-card__cta';
  cta.href = item.path || '/tienda/';
  cta.textContent = 'Ver detalles';

  footer.append(priceWrap, cta);
  article.append(imageLink, meta, name, footer);
  return article;
}

function buildPanel(items: ShowcaseItem[], key: string, state: 'incoming' | 'current'): HTMLElement {
  const panel = document.createElement('div');
  panel.className = `showcase-grid ${state === 'current' ? 'is-current' : 'is-incoming'}`;
  panel.setAttribute('data-showcase-grid', '');
  panel.setAttribute('data-showcase-panel', key);

  items.forEach((item) => {
    panel.append(buildCard(item));
  });

  return panel;
}

function mountHomeProductSelector(root: HTMLElement): void {
  const tabsRail = root.querySelector<HTMLElement>('.home-showcase__tabs');
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-showcase-tab]'));
  const stage = root.querySelector<HTMLElement>('[data-showcase-stage]');
  const initialGrid = root.querySelector<HTMLElement>('[data-showcase-grid]');
  const jsonNode = root.querySelector<HTMLScriptElement>('[data-showcase-index]');

  if (tabs.length === 0 || !stage || !initialGrid || !jsonNode) {
    return;
  }

  const index = JSON.parse(jsonNode.textContent || '{}') as ShowcaseIndex;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let isSwitching = false;
  let queuedKey: string | null = null;
  let currentPanel = initialGrid;
  let activeKey = tabs[0]?.getAttribute('data-showcase-tab') || '';

  const setActiveTabState = (targetKey: string) => {
    tabs.forEach((button) => {
      const isActive = button.getAttribute('data-showcase-tab') === targetKey;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  };

  setActiveTabState(activeKey);
  if (tabsRail) {
    tabsRail.scrollLeft = 0;
  }

  const switchTo = async (key: string) => {
    if (!key || key === activeKey) {
      return;
    }

    if (isSwitching) {
      queuedKey = key;
      return;
    }

    isSwitching = true;
    const nextItems = index[key] ?? [];

    if (prefersReducedMotion) {
      const nextPanel = buildPanel(nextItems, key, 'current');
      currentPanel.replaceWith(nextPanel);
      currentPanel = nextPanel;
      activeKey = key;
      isSwitching = false;
    } else {
      const nextPanel = buildPanel(nextItems, key, 'incoming');
      const currentHeight = currentPanel.getBoundingClientRect().height;
      const totalSwitchMs = PANEL_SWITCH_MS + SETTLE_BUFFER_MS;

      stage.style.height = `${currentHeight}px`;
      stage.classList.add('is-switching');
      currentPanel.classList.add('is-leaving');
      stage.append(nextPanel);

      requestAnimationFrame(() => {
        currentPanel.classList.add('is-active');
        nextPanel.classList.add('is-active');
      });

      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, totalSwitchMs);
      });

      currentPanel.remove();
      nextPanel.classList.remove('is-incoming', 'is-active');
      nextPanel.classList.add('is-current');
      currentPanel = nextPanel;
      activeKey = key;
      stage.classList.remove('is-switching');
      stage.style.height = '';
      isSwitching = false;
    }

    if (queuedKey && queuedKey !== activeKey) {
      const pending = queuedKey;
      queuedKey = null;
      await switchTo(pending);
    }
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', async () => {
      const key = tab.getAttribute('data-showcase-tab');
      if (!key) {
        return;
      }

      setActiveTabState(key);
      await switchTo(key);
    });
  });
}

export function mount(): void {
  queryIslandRoots('home-product-selector').forEach((root) => mountOnce(root, mountHomeProductSelector));
}
