import { describe, expect, it } from 'vitest';
import { routeIndex, snapshot } from '../src/data/snapshot';

describe('snapshot route index', () => {
  it('contains unique route paths', () => {
    const seen = new Set<string>();
    routeIndex.forEach((entry) => {
      expect(seen.has(entry.path)).toBe(false);
      seen.add(entry.path);
    });
  });

  it('contains product, category and brand routes', () => {
    expect(routeIndex.some((entry) => entry.template === 'product')).toBe(true);
    expect(routeIndex.some((entry) => entry.template === 'category')).toBe(true);
    expect(routeIndex.some((entry) => entry.template === 'brand')).toBe(true);
  });

  it('keeps snapshot inventory with urls', () => {
    expect(snapshot.inventory.urls.length).toBeGreaterThan(20);
  });
});
