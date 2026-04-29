import { mountOnce, queryIslandRoots } from './runtime';
import type { CatalogFilterEventDetail, FilterIslandProps } from '../../types/content';

type CardNode = HTMLElement & {
  dataset: {
    name: string;
    brand: string;
    categoryTrail: string;
  };
};

const EVENT_NAME = 'catalog:filter-changed';

function mountCatalogControls(root: HTMLElement): void {
  const props = JSON.parse(root.getAttribute('data-island-props') ?? '{}') as FilterIslandProps;
  const pageSize = props.pageSize || 12;

  const brandSelect = root.querySelector<HTMLSelectElement>('[data-filter-brand]');
  const categorySelect = root.querySelector<HTMLSelectElement>('[data-filter-category]');
  const sortSelect = root.querySelector<HTMLSelectElement>('[data-filter-sort]');
  const categoryAccordionTriggers = root.querySelectorAll<HTMLButtonElement>('[data-filter-category-trigger]');
  const categoryAccordionItems = root.querySelectorAll<HTMLElement>('[data-filter-category-item]');
  const categoryOptions = root.querySelectorAll<HTMLButtonElement>('[data-filter-category-option]');
  const brandOptions = root.querySelectorAll<HTMLButtonElement>('[data-filter-brand-option]');
  const resetButton = root.querySelector<HTMLButtonElement>('[data-filter-reset]');
  const openFiltersButton = root.querySelector<HTMLButtonElement>('[data-filter-open]');
  const filtersDrawer = root.querySelector<HTMLElement>('[data-filter-drawer]');
  const closeFiltersButtons = root.querySelectorAll<HTMLButtonElement>('[data-filter-close]');
  const summary = root.querySelector<HTMLElement>('[data-filter-summary]');
  const grid = root.querySelector<HTMLElement>('[data-catalog-grid]');
  const pagination = root.querySelector<HTMLElement>('[data-pagination]');
  const prevButton = root.querySelector<HTMLButtonElement>('[data-page-prev]');
  const nextButton = root.querySelector<HTMLButtonElement>('[data-page-next]');
  const pageNumbers = root.querySelector<HTMLElement>('[data-page-numbers]');

  if (!grid || !brandSelect || !categorySelect || !sortSelect || !resetButton || !summary || !pagination || !prevButton || !nextButton || !pageNumbers) {
    return;
  }

  const isMobile = () => window.matchMedia('(max-width: 760px)').matches;
  const setFiltersDrawerOpen = (open: boolean) => {
    if (!filtersDrawer) return;
    filtersDrawer.classList.toggle('is-open', open);
    document.body.classList.toggle('catalog-filters-open', open);
  };

  const cards = Array.from(grid.querySelectorAll<HTMLElement>('[data-product-card]')) as CardNode[];
  const params = new URLSearchParams(window.location.search);

  const initialBrand = params.get('brand')?.trim() || props.initialBrand || '';
  const initialCategory = params.get('category')?.trim() || props.initialCategory || '';
  const initialSort = params.get('sort')?.trim() || 'name-asc';
  const initialPage = Number(params.get('page') || '1');

  if (initialBrand && Array.from(brandSelect.options).some((option) => option.value === initialBrand)) brandSelect.value = initialBrand;
  if (initialCategory && Array.from(categorySelect.options).some((option) => option.value === initialCategory)) categorySelect.value = initialCategory;
  if (Array.from(sortSelect.options).some((option) => option.value === initialSort)) sortSelect.value = initialSort;

  let currentPage = Number.isFinite(initialPage) && initialPage > 0 ? initialPage : 1;

  const setAccordionOpen = (indexToOpen: number | null) => {
    categoryAccordionItems.forEach((item, index) => {
      const isOpen = indexToOpen !== null && index === indexToOpen;
      item.classList.toggle('is-open', isOpen);
    });
    categoryAccordionTriggers.forEach((trigger, index) => {
      const isOpen = indexToOpen !== null && index === indexToOpen;
      trigger.setAttribute('aria-expanded', String(isOpen));
    });
  };

  const syncCategoryOptionState = () => {
    const activeValue = categorySelect.value;
    categoryOptions.forEach((option) => {
      option.classList.toggle('is-active', option.dataset.value === activeValue);
    });
  };

  const syncBrandOptionState = () => {
    const activeValue = brandSelect.value;
    brandOptions.forEach((option) => {
      option.classList.toggle('is-active', option.dataset.value === activeValue);
    });
  };

  const updateUrl = () => {
    const nextParams = new URLSearchParams();
    if (sortSelect.value !== 'name-asc') nextParams.set('sort', sortSelect.value);
    if (currentPage > 1) nextParams.set('page', String(currentPage));
    const query = nextParams.toString();
    const basePath = brandSelect.value
      ? `/marca/${encodeURIComponent(brandSelect.value)}/`
      : categorySelect.value
        ? `/c/${encodeURIComponent(categorySelect.value)}/`
        : '/c/';
    window.history.replaceState({}, '', `${basePath}${query ? `?${query}` : ''}`);
  };

  const renderPageNumbers = (totalPages: number) => {
    pageNumbers.innerHTML = '';
    const maxButtons = 7;
    const start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    const end = Math.min(totalPages, start + maxButtons - 1);
    const pageStart = Math.max(1, end - maxButtons + 1);

    for (let page = pageStart; page <= end; page += 1) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = String(page);
      if (page === currentPage) button.setAttribute('aria-current', 'page');
      button.addEventListener('click', () => {
        currentPage = page;
        apply(false);
      });
      pageNumbers.append(button);
    }
  };

  const apply = (resetPage = false) => {
    if (resetPage) currentPage = 1;

    const state = {
      brand: brandSelect.value,
      category: categorySelect.value,
      sort: sortSelect.value as 'name-asc' | 'name-desc',
    };

    const filtered = cards.filter((card) => {
      const matchesBrand = !state.brand || card.dataset.brand === state.brand;
      const trail = card.dataset.categoryTrail?.split(',') || [];
      const matchesCategory = !state.category || trail.includes(state.category);
      return matchesBrand && matchesCategory;
    });

    filtered.sort((a, b) => {
      const compare = a.dataset.name.localeCompare(b.dataset.name, 'es');
      return state.sort === 'name-desc' ? -compare : compare;
    });

    filtered.forEach((card) => grid.append(card));
    cards.forEach((card) => {
      card.hidden = true;
    });

    const totalResults = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    filtered.slice(start, end).forEach((card) => {
      card.hidden = false;
    });

    const visibleCount = Math.max(0, Math.min(end, totalResults) - start);
    summary.textContent = totalResults === 0
      ? 'No se encontraron productos con estos filtros.'
      : `Mostrando ${start + 1}-${Math.min(end, totalResults)} de ${totalResults} productos`;
    summary.classList.toggle('is-empty', totalResults === 0);

    pagination.hidden = totalResults <= pageSize;
    prevButton.disabled = currentPage <= 1;
    nextButton.disabled = currentPage >= totalPages;
    renderPageNumbers(totalPages);
    updateUrl();

    const detail: CatalogFilterEventDetail = {
      query: '',
      brand: state.brand,
      sort: state.sort,
      visibleCount,
    };
    root.dispatchEvent(new CustomEvent(EVENT_NAME, { detail, bubbles: true }));
  };

  brandSelect.addEventListener('change', () => {
    syncBrandOptionState();
    apply(true);
  });
  categorySelect.addEventListener('change', () => {
    syncCategoryOptionState();
    apply(true);
  });
  sortSelect.addEventListener('change', () => apply(true));

  categoryAccordionTriggers.forEach((trigger, index) => {
    trigger.addEventListener('click', () => {
      const isOpen = trigger.getAttribute('aria-expanded') === 'true';
      setAccordionOpen(isOpen ? null : index);
    });
  });

  categoryOptions.forEach((option) => {
    option.addEventListener('click', () => {
      const nextValue = option.dataset.value ?? '';
      categorySelect.value = nextValue;
      syncCategoryOptionState();
      apply(true);
      if (isMobile()) setFiltersDrawerOpen(false);
    });
  });

  brandOptions.forEach((option) => {
    option.addEventListener('click', () => {
      const value = option.dataset.value ?? '';
      brandSelect.value = brandSelect.value === value ? '' : value;
      syncBrandOptionState();
      apply(true);
      if (isMobile()) setFiltersDrawerOpen(false);
    });
  });

  prevButton.addEventListener('click', () => {
    if (currentPage <= 1) return;
    currentPage -= 1;
    apply(false);
  });

  nextButton.addEventListener('click', () => {
    currentPage += 1;
    apply(false);
  });

  resetButton.addEventListener('click', () => {
    brandSelect.value = '';
    categorySelect.value = '';
    sortSelect.value = 'name-asc';
    syncCategoryOptionState();
    syncBrandOptionState();
    apply(true);
    if (isMobile()) setFiltersDrawerOpen(false);
  });

  openFiltersButton?.addEventListener('click', () => {
    setFiltersDrawerOpen(true);
  });
  closeFiltersButtons.forEach((button) => {
    button.addEventListener('click', () => setFiltersDrawerOpen(false));
  });

  syncCategoryOptionState();
  syncBrandOptionState();
  apply(false);
}

export function mount(): void {
  queryIslandRoots('catalog-controls').forEach((root) => mountOnce(root, mountCatalogControls));
}
