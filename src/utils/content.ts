import type { Product } from '../types/content';

export function searchProducts(products: Product[], query: string): Product[] {
  const term = query.trim().toLowerCase();

  if (!term) {
    return products;
  }

  return products.filter((product) => {
    const haystack = [
      product.name,
      product.excerpt,
      product.description,
      product.brandSlug,
      product.categorySlug,
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(term);
  });
}

export function sortProducts(products: Product[], sort: 'name-asc' | 'name-desc'): Product[] {
  const sorted = [...products].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  return sort === 'name-desc' ? sorted.reverse() : sorted;
}

export function paginateProducts(products: Product[], page: number, pageSize: number): Product[] {
  const start = (Math.max(page, 1) - 1) * pageSize;
  return products.slice(start, start + pageSize);
}

export function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}
