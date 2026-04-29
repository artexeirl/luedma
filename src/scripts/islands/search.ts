import { mountOnce, queryIslandRoots } from './runtime';
import type { SearchIslandProps } from '../../types/content';

type SearchIndex = {
  slug: string;
  name: string;
  path: string;
  brand: string;
};

function buildSuggestionItem(item: SearchIndex): HTMLLIElement {
  const li = document.createElement('li');
  const anchor = document.createElement('a');
  anchor.href = item.path;
  anchor.textContent = `${item.name} (${item.brand})`;
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

  const renderSuggestions = (query: string) => {
    list.innerHTML = '';

    const clean = query.trim().toLowerCase();
    if (!clean) {
      list.hidden = true;
      return;
    }

    const matches = index
      .filter((item) => `${item.name} ${item.brand}`.toLowerCase().includes(clean))
      .slice(0, props.suggestionsLimit);

    if (matches.length === 0) {
      list.hidden = true;
      return;
    }

    matches.forEach((item) => list.append(buildSuggestionItem(item)));
    list.hidden = false;
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
    if (!input.value.trim()) {
      event.preventDefault();
      return;
    }

    const target = `${props.submitPath}?q=${encodeURIComponent(input.value.trim())}`;
    form.action = target;
  });

  document.addEventListener('click', (event) => {
    if (!root.contains(event.target as Node)) {
      list.hidden = true;
    }
  });
}

export function mount(): void {
  queryIslandRoots('search').forEach((root) => mountOnce(root, mountSearch));
}
