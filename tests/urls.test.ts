import { describe, expect, it } from 'vitest';
import { normalizePath, slugFromPath } from '../src/utils/urls';

describe('url helpers', () => {
  it('normalizes legacy index.php routes', () => {
    expect(normalizePath('https://maquinariasluedma.com/index.php/product-category/herramientas-electricas')).toBe(
      '/product-category/herramientas-electricas/',
    );
  });

  it('normalizes relative paths and adds trailing slash', () => {
    expect(normalizePath('product/taladro-percutor-850w-mp')).toBe('/product/taladro-percutor-850w-mp/');
  });

  it('extracts slugs from normalized path', () => {
    expect(slugFromPath('/marca/bosch/')).toBe('bosch');
  });
});
