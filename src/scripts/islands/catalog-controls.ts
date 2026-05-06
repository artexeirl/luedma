import { mountOnce, queryIslandRoots } from './runtime';
import type { CatalogFilterEventDetail, FilterIslandProps } from '../../types/content';

type CardNode = HTMLElement & {
  dataset: {
    name: string;
    sku?: string;
    brand: string;
    categoryTrail: string;
    orderIndex?: string;
    createdAt?: string;
    updatedAt?: string;
  };
};

type CategoryOption = HTMLButtonElement & {
  dataset: {
    value?: string;
    parent?: string;
    href?: string;
  };
};

const EVENT_NAME = 'catalog:filter-changed';

/** Construye el trail de categorías desde un slug hacia arriba (sub → parent → root) */
function buildCategoryTrail(slug: string): { label: string; slug: string }[] {
  const trail: { label: string; slug: string }[] = [];
  const slugs: string[] = [];
  let currentSlug: string | undefined = slug;

  for (let i = 0; i < 10; i += 1) {
    if (!currentSlug) break;
    slugs.unshift(currentSlug);
    const el: CategoryOption | null = document.querySelector(`[data-filter-category-option][data-value="${currentSlug}"]`) as CategoryOption | null;
    if (!el) break;
    const parentValue: string | undefined = el.dataset.parent;
    if (!parentValue || parentValue === currentSlug) break;
    currentSlug = parentValue;
  }

  for (let j = 0; j < slugs.length; j += 1) {
    const slugItem = slugs[j];
    const el: CategoryOption | null = document.querySelector(`[data-filter-category-option][data-value="${slugItem}"]`) as CategoryOption | null;
    trail.push({ label: el?.textContent?.trim() || slugItem, slug: slugItem });
  }

  return trail;
}

/** Obtiene el nombre visible de una categoría desde los options del DOM */
function getCategoryLabel(slug: string): string {
  const el = document.querySelector<CategoryOption>(`[data-filter-category-option][data-value="${slug}"]`);
  return el?.textContent?.trim() || slug;
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function getCardOrderIndex(card: CardNode): number {
  const index = Number(card.dataset.orderIndex || '0');
  return Number.isFinite(index) ? index : 0;
}

function getCardTimestamp(card: CardNode): number | null {
  const rawDate = card.dataset.createdAt || card.dataset.updatedAt || '';
  if (!rawDate) return null;
  const timestamp = Date.parse(rawDate);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function ensureSelectValue(select: HTMLSelectElement, value: string): void {
  if (!value) return;
  const exists = Array.from(select.options).some((option) => option.value === value);
  if (exists) {
    select.value = value;
    return;
  }

  const fallbackOption = document.createElement('option');
  fallbackOption.value = value;
  fallbackOption.textContent = value;
  fallbackOption.hidden = true;
  select.append(fallbackOption);
  select.value = value;
}

function mountCatalogControls(root: HTMLElement): void {
  const props = JSON.parse(root.getAttribute('data-island-props') ?? '{}') as FilterIslandProps;
  const pageSize = props.pageSize || 12;

  const brandSelect = root.querySelector<HTMLSelectElement>('[data-filter-brand]');
  const categorySelect = root.querySelector<HTMLSelectElement>('[data-filter-category]');
  const sortSelect = root.querySelector<HTMLSelectElement>('[data-filter-sort]');
  const categoryAccordionTriggers = root.querySelectorAll<HTMLButtonElement>('[data-filter-category-trigger]');
  const categoryAccordionItems = root.querySelectorAll<HTMLElement>('[data-filter-category-item]');
  const categoryOptions = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-filter-category-option]')) as CategoryOption[];
  const brandOptions = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-filter-brand-option]'));
  const brandList = root.querySelector<HTMLElement>('[data-filter-brand-list]');
  const resetButton = root.querySelector<HTMLButtonElement>('[data-filter-reset]');
  const activeResetButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-filter-active-reset]'));
  const openFiltersButton = root.querySelector<HTMLButtonElement>('[data-filter-open]');
  const filtersDrawer = root.querySelector<HTMLElement>('[data-filter-drawer]');
  const closeFiltersButtons = root.querySelectorAll<HTMLButtonElement>('[data-filter-close]');
  const summary = root.querySelector<HTMLElement>('[data-filter-summary]');
  const grid = root.querySelector<HTMLElement>('[data-catalog-grid]');
  const pagination = root.querySelector<HTMLElement>('[data-pagination]');
  const prevButton = root.querySelector<HTMLButtonElement>('[data-page-prev]');
  const nextButton = root.querySelector<HTMLButtonElement>('[data-page-next]');
  const pageNumbers = root.querySelector<HTMLElement>('[data-page-numbers]');
  const breadcrumbEl = root.querySelector<HTMLElement>('[data-catalog-breadcrumb]');
  const titleEl = root.querySelector<HTMLElement>('[data-catalog-title]');
  const subtitleEl = root.querySelector<HTMLElement>('[data-catalog-subtitle]');

  if (!grid || !brandSelect || !categorySelect || !sortSelect || !resetButton || !summary || !pagination || !prevButton || !nextButton || !pageNumbers || activeResetButtons.length === 0) {
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
  const initialSort = params.get('sort')?.trim() || '';
  const initialPage = Number(params.get('page') || '1');
  const initialQuery = params.get('q')?.trim() || props.initialQuery || '';

  ensureSelectValue(brandSelect, initialBrand);
  ensureSelectValue(categorySelect, initialCategory);
  if (Array.from(sortSelect.options).some((option) => option.value === initialSort)) sortSelect.value = initialSort;

  let currentPage = Number.isFinite(initialPage) && initialPage > 0 ? initialPage : 1;
  let currentQuery = initialQuery;

  const topCategoryBySub = new Map<string, string>();
  categoryOptions.forEach((option) => {
    const value = option.dataset.value || '';
    const parent = option.dataset.parent || '';
    if (!value) return;
    topCategoryBySub.set(value, parent || value);
  });

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

  const syncAccordionToSelectedCategory = () => {
    const selectedCategory = categorySelect.value;
    if (!selectedCategory) {
      const firstVisibleIndex = Array.from(categoryAccordionItems).findIndex((item) => !item.classList.contains('is-hidden'));
      setAccordionOpen(firstVisibleIndex >= 0 ? firstVisibleIndex : null);
      return;
    }

    const topCategory = topCategoryBySub.get(selectedCategory) || selectedCategory;
    const indexToOpen = Array.from(categoryAccordionItems).findIndex((item) => {
      const parentOption = item.querySelector<CategoryOption>('[data-filter-category-option]');
      return parentOption?.dataset.value === topCategory;
    });

    setAccordionOpen(indexToOpen >= 0 ? indexToOpen : null);
  };

  const getCurrentTopCategory = (): string => {
    const category = categorySelect.value;
    if (!category) return '';
    return topCategoryBySub.get(category) || category;
  };

  /** Obtiene el texto de búsqueda actual */
  const getSearchQuery = (): string => {
    return currentQuery;
  };

  /** Actualiza el breadcrumb y título según la categoría seleccionada y búsqueda */
  const updateHeader = () => {
    if (!breadcrumbEl || !titleEl) return;

    const selectedCategory = categorySelect.value;
    const selectedBrand = brandSelect.value;
    const query = getSearchQuery();

    if (query) {
      // Modo búsqueda por texto
      breadcrumbEl.innerHTML = '<a href="/">INICIO</a><span aria-hidden="true">/</span><span>BUSCAR</span>';
      titleEl.textContent = `Resultados para: ${query}`;
      return;
    }

    if (!selectedCategory && !selectedBrand) {
      // Sin filtros — estado por defecto
      breadcrumbEl.innerHTML = '<a href="/">INICIO</a><span aria-hidden="true">/</span><span>TIENDA</span>';
      titleEl.textContent = 'TIENDA DE PRODUCTOS';
      return;
    }

    if (selectedBrand && !selectedCategory) {
      // Solo marca seleccionada
      const brandName = brandOptions.find((o) => o.dataset.value === selectedBrand)?.textContent?.trim() || selectedBrand;
      breadcrumbEl.innerHTML = `<a href="/">INICIO</a><span aria-hidden="true">/</span><span>${brandName.toUpperCase()}</span>`;
      titleEl.textContent = brandName.toUpperCase();
      return;
    }

    // Categoría seleccionada (con o sin marca)
    const trail = buildCategoryTrail(selectedCategory);
    const categoryName = getCategoryLabel(selectedCategory);

    let breadcrumbHtml = '<a href="/">INICIO</a>';
    trail.forEach((item) => {
      breadcrumbHtml += `<span aria-hidden="true">/</span><a href="/tienda/c/${item.slug}/">${item.label.toUpperCase()}</a>`;
    });
    if (selectedBrand) {
      const brandName = brandOptions.find((o) => o.dataset.value === selectedBrand)?.textContent?.trim() || selectedBrand;
      breadcrumbHtml += `<span aria-hidden="true">/</span><span>${brandName.toUpperCase()}</span>`;
    }
    breadcrumbEl.innerHTML = breadcrumbHtml;

    titleEl.textContent = categoryName.toUpperCase();
  };

  const updateUrl = () => {
    const nextParams = new URLSearchParams();
    if (sortSelect.value) nextParams.set('sort', sortSelect.value);
    if (currentPage > 1) nextParams.set('page', String(currentPage));

    const query = getSearchQuery();
    if (query) nextParams.set('q', query);

    const selectedCategory = categorySelect.value;
    const selectedBrand = brandSelect.value;
    const top = selectedCategory ? getCurrentTopCategory() : '';
    const isSubcategory = Boolean(selectedCategory && top && selectedCategory !== top);

    let path = '/tienda/';
    if (selectedCategory) {
      path = isSubcategory
        ? `/tienda/c/${encodeURIComponent(top)}/${encodeURIComponent(selectedCategory)}/`
        : `/tienda/c/${encodeURIComponent(selectedCategory)}/`;
    }
    if (selectedBrand && !selectedCategory) {
      path = `/tienda/m/${encodeURIComponent(selectedBrand)}/`;
    } else if (selectedBrand) {
      path = `${path.replace(/\/$/, '')}/m/${encodeURIComponent(selectedBrand)}/`;
    }

    // Si hay búsqueda por texto, siempre usar /search/ como path
    if (query) {
      path = '/search/';
    }

    window.history.replaceState({}, '', `${path}${nextParams.toString() ? `?${nextParams.toString()}` : ''}`);
  };

  const renderPageNumbers = (totalPages: number) => {
    pageNumbers.innerHTML = '';
    const maxButtons = window.matchMedia('(max-width: 760px)').matches ? 3 : 7;
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

  const syncAvailableFilters = () => {
    const selectedCategory = categorySelect.value;
    const selectedBrand = brandSelect.value;

    const categoryScopedCards = cards.filter((card) => {
      if (!selectedCategory) return true;
      const trail = (card.dataset.categoryTrail || '').split(',');
      return trail.includes(selectedCategory);
    });

    const brandScopedCards = cards.filter((card) => {
      if (!selectedBrand) return true;
      return card.dataset.brand === selectedBrand;
    });

    const availableBrands = new Set(categoryScopedCards.map((card) => card.dataset.brand));
    const availableCategories = new Set<string>();
    brandScopedCards.forEach((card) => {
      (card.dataset.categoryTrail || '').split(',').forEach((slug) => {
        if (slug) availableCategories.add(slug);
      });
    });

    brandOptions.forEach((option) => {
      const value = option.dataset.value || '';
      const visible = !selectedCategory || availableBrands.has(value);
      option.hidden = !visible;
      option.disabled = !visible;
    });

    categoryOptions.forEach((option) => {
      const value = option.dataset.value || '';
      const visible = !selectedBrand || availableCategories.has(value);
      option.hidden = !visible;
      option.disabled = !visible;
    });

    categoryAccordionItems.forEach((item) => {
      const children = Array.from(item.querySelectorAll<CategoryOption>('[data-filter-category-option]'));
      const hasVisible = children.some((child) => !child.hidden);
      item.classList.toggle('is-hidden', !hasVisible);
    });

    const visibleBrandCount = brandOptions.filter((option) => !option.hidden).length;
    if (brandList) {
      brandList.classList.toggle('is-scrollable', visibleBrandCount > 6);
      brandList.style.setProperty('--brand-visible-rows', String(Math.min(6, visibleBrandCount || 1)));
    }

    syncAccordionToSelectedCategory();
  };

  const apply = (resetPage = false) => {
    if (resetPage) currentPage = 1;

    syncAvailableFilters();

    const state = {
      brand: brandSelect.value,
      category: categorySelect.value,
      sort: sortSelect.value as 'name-asc' | 'name-desc' | 'date-desc' | 'date-asc' | '',
    };

    const query = getSearchQuery();
    const cleanQuery = query ? normalizeText(query) : '';

    const filtered = cards.filter((card) => {
      const matchesBrand = !state.brand || card.dataset.brand === state.brand;
      const trail = (card.dataset.categoryTrail || '').split(',');
      const matchesCategory = !state.category || trail.includes(state.category);
      const matchesQuery = !cleanQuery || normalizeText(`${card.dataset.name || ''} ${card.dataset.sku || ''}`).includes(cleanQuery);
      return matchesBrand && matchesCategory && matchesQuery;
    });

    filtered.sort((a, b) => {
      if (state.sort === '') {
        return getCardOrderIndex(a) - getCardOrderIndex(b);
      }

      if (state.sort === 'date-desc' || state.sort === 'date-asc') {
        const aTime = getCardTimestamp(a);
        const bTime = getCardTimestamp(b);

        if (aTime !== null && bTime !== null && aTime !== bTime) {
          return state.sort === 'date-desc' ? bTime - aTime : aTime - bTime;
        }

        if (aTime !== null || bTime !== null) {
          if (aTime === null) return 1;
          if (bTime === null) return -1;
        }

        return state.sort === 'date-desc'
          ? getCardOrderIndex(b) - getCardOrderIndex(a)
          : getCardOrderIndex(a) - getCardOrderIndex(b);
      }

      const compare = a.dataset.name.localeCompare(b.dataset.name, 'es');
      return state.sort === 'name-desc' ? -compare : compare;
    });

    // Mover los filtrados al grid y ocultar todos
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
      : `${totalResults} producto(s) encontrado(s)`;
    summary.classList.toggle('is-empty', totalResults === 0);

    // Mostrar/ocultar botones de limpiar filtros inline (desktop y mobile)
    const hasActiveFilters = Boolean(state.brand || state.category || query);
    activeResetButtons.forEach((btn) => {
      btn.hidden = !hasActiveFilters;
    });

    pagination.hidden = totalResults <= pageSize;
    prevButton.disabled = currentPage <= 1;
    nextButton.disabled = currentPage >= totalPages;
    renderPageNumbers(totalPages);
    updateUrl();
    updateHeader();

    const detail: CatalogFilterEventDetail = {
      query: '',
      brand: state.brand,
      sort: state.sort || '',
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
      if (option.disabled || option.hidden) return;
      const nextValue = option.dataset.value ?? '';
      categorySelect.value = nextValue;
      syncCategoryOptionState();
      apply(true);
      if (isMobile()) setFiltersDrawerOpen(false);
    });
  });

  brandOptions.forEach((option) => {
    option.addEventListener('click', () => {
      if (option.disabled || option.hidden) return;
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

  const resetFilters = () => {
    brandSelect.value = '';
    categorySelect.value = '';
    sortSelect.value = '';
    currentQuery = '';
    currentPage = 1;
    syncCategoryOptionState();
    syncBrandOptionState();

    // Si estamos en una ruta de marca (/tienda/m/...) o categoría (/tienda/c/...),
    // al limpiar filtros redirigimos a /tienda/ para recargar todos los productos
    const currentPath = window.location.pathname;
    if (currentPath.startsWith('/tienda/m/') || (currentPath.startsWith('/tienda/c/') && currentPath !== '/tienda/c/')) {
      window.location.href = '/tienda/';
      return;
    }

    apply(true);
    if (isMobile()) setFiltersDrawerOpen(false);
  };

  resetButton.addEventListener('click', resetFilters);

  activeResetButtons.forEach((btn) => {
    btn.addEventListener('click', resetFilters);
  });

  openFiltersButton?.addEventListener('click', () => {
    setFiltersDrawerOpen(true);
  });

  closeFiltersButtons.forEach((button) => {
    button.addEventListener('click', () => setFiltersDrawerOpen(false));
  });

  syncCategoryOptionState();
  syncBrandOptionState();
  syncAccordionToSelectedCategory();
  apply(false);
}

export function mount(): void {
  queryIslandRoots('catalog-controls').forEach((root) => mountOnce(root, mountCatalogControls));
}
