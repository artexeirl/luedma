export function normalizePath(path: string): string {
  if (!path) {
    return '/';
  }

  let value = path.trim();

  if (value.startsWith('http://') || value.startsWith('https://')) {
    const url = new URL(value.replace('/index.php/', '/'));
    value = url.pathname;
  }

  value = value.replace('/index.php/', '/');

  if (!value.startsWith('/')) {
    value = `/${value}`;
  }

  value = value.replace(/\/+/g, '/');

  if (!value.endsWith('/')) {
    value = `${value}/`;
  }

  return value;
}

export function slugFromPath(path: string): string {
  const normalized = normalizePath(path).split('/').filter(Boolean);
  return normalized[normalized.length - 1] ?? '';
}

export function pathWithoutTrailingSlash(path: string): string {
  if (path === '/') {
    return '/';
  }
  return path.endsWith('/') ? path.slice(0, -1) : path;
}

export function canonicalUrl(siteUrl: string, path: string): string {
  const normalizedSite = siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl;
  return `${normalizedSite}${normalizePath(path)}`;
}

export function shopCategoryPathFromSlugs(slug: string, parentSlug?: string): string {
  const encodedSlug = encodeURIComponent(slug);
  if (parentSlug) {
    return `/tienda/c/${encodeURIComponent(parentSlug)}/${encodedSlug}/`;
  }
  return `/tienda/c/${encodedSlug}/`;
}

export function categoryParamFromPath(path: string): string {
  const normalized = normalizePath(path).replace('/product-category/', '');
  return normalized.replace(/^\//, '').replace(/\/$/, '');
}
