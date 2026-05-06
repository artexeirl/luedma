import { mountOnce, queryIslandRoots } from './runtime';
import type { SearchIslandProps } from '../../types/content';

type SearchIndex = {
  slug: string;
  name: string;
  path: string;
  brand: string;
  category?: string;
  sku?: string;
  image?: string;
  price?: string;
  stockText?: string;
};

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function buildSuggestionItem(item: SearchIndex, query: string): HTMLLIElement {
  const li = document.createElement('li');
  li.className = 'header-search__item';
  const anchor = document.createElement('a');
  anchor.className = 'header-search__link';
  anchor.href = item.path;
  anchor.innerHTML = `
    <span class="header-search__thumb">
      <img src="${item.image || '/images/products/placeholder-product.svg'}" alt="Producto ${item.name}" loading="lazy" />
    </span>
    <span class="header-search__body">
      <strong class="header-search__title">${item.name}</strong>
      <span class="header-search__meta">${item.brand}${item.category ? ` · ${item.category}` : ''}</span>
      <span class="header-search__row">
        <span class="header-search__price">${item.price ? `S/ ${item.price}` : 'Consultar'}</span>
        <span class="header-search__stock">${item.stockText || ''}</span>
      </span>
    </span>
  `;
  anchor.setAttribute('data-q', query);
  li.append(anchor);
  return li;
}

function mountSearch(root: HTMLElement): void {
  const propsText = root.getAttribute('data-island-props') ?? '{}';
  const props = JSON.parse(propsText) as SearchIslandProps;

  const form = root.querySelector<HTMLFormElement>('[data-search-form]');
  const input = root.querySelector<HTMLInputElement>('[data-search-input]');
  const list = root.querySelector<HTMLUListElement>('[data-search-suggestions]');
  const jsonNode = root.querySelector<HTMLScriptElement>('[data-search-index]');

  if (!form || !input || !list || !jsonNode) {
    return;
  }

  const index = JSON.parse(jsonNode.textContent || '[]') as SearchIndex[];
  let activeIndex = -1;

  const hideList = () => {
    list.hidden = true;
    activeIndex = -1;
  };

  const updateActive = () => {
    const items = Array.from(list.querySelectorAll<HTMLAnchorElement>('.header-search__link'));
    items.forEach((item, index) => item.classList.toggle('is-active', index === activeIndex));
    if (activeIndex >= 0) {
      items[activeIndex]?.scrollIntoView({ block: 'nearest' });
    }
  };

  const renderSuggestions = (query: string) => {
    list.innerHTML = '';

    const clean = normalizeText(query);
    if (clean.length < 3) {
      hideList();
      return;
    }

    const allMatches = index.filter((item) =>
      normalizeText(`${item.name} ${item.brand} ${item.category || ''} ${item.sku || ''}`).includes(clean),
    );

    const matchesTotal = allMatches.length;

    if (matchesTotal === 0) {
      const li = document.createElement('li');
      li.className = 'header-search__empty';
      li.textContent = 'No se encontraron productos.';
      list.append(li);
      list.hidden = false;
      activeIndex = -1;
      return;
    }

    const displayLimit = 10;
    const displayItems = allMatches.slice(0, displayLimit);
    displayItems.forEach((item) => list.append(buildSuggestionItem(item, clean)));

    const seeAll = document.createElement('li');
    seeAll.className = 'header-search__more';
    seeAll.innerHTML = `<a class="header-search__link header-search__more-link" href="${props.submitPath}?q=${encodeURIComponent(query.trim())}">
      <span class="header-search__more-label">VER TODOS LOS RESULTADOS</span>
      <span class="header-search__more-count">(${matchesTotal} PRODUCTOS)</span>
    </a>`;
    list.append(seeAll);

    list.hidden = false;
    activeIndex = -1;
  };

  input.addEventListener('input', () => {
    renderSuggestions(input.value);
    root.dispatchEvent(
      new CustomEvent('search:query-changed', {
        detail: { query: input.value.trim() },
        bubbles: true,
      }),
    );
  });

  form.addEventListener('submit', (event) => {
    if (input.value.trim().length < 3) {
      event.preventDefault();
      return;
    }

    const target = `${props.submitPath}?q=${encodeURIComponent(input.value.trim())}`;
    form.action = target;
  });

  document.addEventListener('click', (event) => {
    if (!root.contains(event.target as Node)) {
      hideList();
    }
  });

  input.addEventListener('keydown', (event) => {
    if (list.hidden) return;
    const items = Array.from(list.querySelectorAll<HTMLAnchorElement>('.header-search__link'));
    if (items.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      activeIndex = Math.min(activeIndex + 1, items.length - 1);
      updateActive();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      updateActive();
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      items[activeIndex].click();
    } else if (event.key === 'Escape') {
      hideList();
    }
  });
}

export function mount(): void {
  queryIslandRoots('search').forEach((root) => mountOnce(root, mountSearch));
}
