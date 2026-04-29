import type { RouteEntry, SeoMeta } from '../types/content';
import { canonicalUrl, normalizePath } from './urls';

export function getSeoForPath(path: string, routes: RouteEntry[], fallback: SeoMeta): SeoMeta {
  const normalized = normalizePath(path);
  return routes.find((route) => route.path === normalized)?.seo ?? fallback;
}

export function buildCanonical(siteUrl: string, path: string): string {
  return canonicalUrl(siteUrl, path);
}

export function buildProductSchema(input: {
  name: string;
  description: string;
  image?: string;
  brand?: string;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
    description: input.description,
    image: input.image,
    brand: input.brand
      ? {
          '@type': 'Brand',
          name: input.brand,
        }
      : undefined,
    url: input.url,
  };
}

export function buildBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@id': item.url,
        name: item.name,
      },
    })),
  };
}
