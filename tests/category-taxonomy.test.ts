import {describe, expect, it} from 'vitest';
import {ROOT_CATEGORIES, SUBCATEGORY_OPTIONS} from '../sanity/schemaTypes/productCategories';

function isSortedByTitle(items: Array<{title: string}>): boolean {
  const sorted = [...items].sort((a, b) => a.title.localeCompare(b.title, 'es', {sensitivity: 'base'}));
  return items.every((item, index) => item.title === sorted[index]?.title);
}

describe('category taxonomy', () => {
  it('keeps root categories alphabetically ordered', () => {
    expect(isSortedByTitle([...ROOT_CATEGORIES])).toBe(true);
  });

  it('keeps subcategories alphabetically ordered within each root', () => {
    Object.values(SUBCATEGORY_OPTIONS).forEach((items) => {
      expect(isSortedByTitle(items)).toBe(true);
    });
  });
});
