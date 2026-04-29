import snapshotRaw from './site-snapshot.json';
import generatedInventory from './site-inventory.json';
import type {
  Brand,
  Category,
  Product,
  RouteEntry,
  SeoMeta,
  StaticPage,
  StorefrontSnapshot,
} from '../types/content';
import {normalizePath, slugFromPath} from '../utils/urls';
import {hasSanityConfig, sanityFetch} from '../lib/sanity.client';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Snapshot validation failed: ${message}`);
  }
}

function asArray<T>(value: unknown, label: string): T[] {
  assert(Array.isArray(value), `${label} must be an array`);
  return value as T[];
}

function asObject(value: unknown, label: string): Record<string, unknown> {
  assert(typeof value === 'object' && value !== null, `${label} must be an object`);
  return value as Record<string, unknown>;
}

function normalizeSpanishText(text: string): string {
  return text
    .replace(/\bCatalogo\b/g, 'Catálogo')
    .replace(/\bcatalogo\b/g, 'catálogo')
    .replace(/\bCategorias\b/g, 'Categorías')
    .replace(/\bcategorias\b/g, 'categorías')
    .replace(/\bBusqueda\b/g, 'Búsqueda')
    .replace(/\bbusqueda\b/g, 'búsqueda')
    .replace(/\bInformacion\b/g, 'Información')
    .replace(/\binformacion\b/g, 'información')
    .replace(/\bElectricas\b/g, 'Eléctricas')
    .replace(/\belectricas\b/g, 'eléctricas')
    .replace(/\bElectricos\b/g, 'Eléctricos')
    .replace(/\belectricos\b/g, 'eléctricos')
    .replace(/\bBaterias\b/g, 'Baterías')
    .replace(/\bbaterias\b/g, 'baterías')
    .replace(/\bConstruccion\b/g, 'Construcción')
    .replace(/\bconstruccion\b/g, 'construcción')
    .replace(/\bDemolicion\b/g, 'Demolición')
    .replace(/\bdemolicion\b/g, 'demolición')
    .replace(/\bCesped\b/g, 'Césped')
    .replace(/\bcesped\b/g, 'césped')
    .replace(/\bMedicion\b/g, 'Medición')
    .replace(/\bmedicion\b/g, 'medición')
    .replace(/\bOrganizacion\b/g, 'Organización')
    .replace(/\borganizacion\b/g, 'organización')
    .replace(/\bIluminacion\b/g, 'Iluminación')
    .replace(/\biluminacion\b/g, 'iluminación')
    .replace(/\bPagina\b/g, 'Página')
    .replace(/\bpagina\b/g, 'página')
    .replace(/\bSesion\b/g, 'Sesión')
    .replace(/\bsesion\b/g, 'sesión')
    .replace(/\bPaginacion\b/g, 'Paginación')
    .replace(/\bpaginacion\b/g, 'paginación')
    .replace(/\bEnvio\b/g, 'Envío')
    .replace(/\benvio\b/g, 'envío')
    .replace(/\bMas\b/g, 'Más')
    .replace(/\bmas\b/g, 'más');
}

function validateSnapshot(input: unknown): StorefrontSnapshot {
  const root = asObject(input, 'root');
  assert(root.site, 'site is required');
  assert(root.navigation, 'navigation is required');
  assert(root.categories, 'categories is required');
  assert(root.brands, 'brands is required');
  assert(root.products, 'products is required');
  assert(root.pages, 'pages is required');
  assert(root.inventory, 'inventory is required');

  const categories = asArray<Category>(root.categories, 'categories').map((category) => ({
    ...category,
    name: normalizeSpanishText(category.name),
    summary: category.summary ? normalizeSpanishText(category.summary) : category.summary,
    path: normalizePath(category.path),
    slug: category.slug || slugFromPath(category.path),
  }));

  const brands = asArray<Brand>(root.brands, 'brands').map((brand) => ({
    ...brand,
    name: normalizeSpanishText(brand.name),
    summary: brand.summary ? normalizeSpanishText(brand.summary) : brand.summary,
    path: normalizePath(brand.path),
    slug: brand.slug || slugFromPath(brand.path),
  }));

  const products = asArray<Product>(root.products, 'products').map((product) => ({
    ...product,
    path: normalizePath(product.path),
    slug: product.slug || slugFromPath(product.path),
  }));

  const pages = asArray<StaticPage>(root.pages, 'pages').map((page) => ({
    ...page,
    name: normalizeSpanishText(page.name),
    content: normalizeSpanishText(page.content),
    seo: page.seo
      ? {
          ...page.seo,
          title: page.seo.title ? normalizeSpanishText(page.seo.title) : page.seo.title,
          description: page.seo.description ? normalizeSpanishText(page.seo.description) : page.seo.description,
        }
      : page.seo,
    path: normalizePath(page.path),
  }));

  return {
    site: root.site as StorefrontSnapshot['site'],
    navigation: (root.navigation as StorefrontSnapshot['navigation']).map((item) => ({
      ...item,
      label: normalizeSpanishText(item.label),
      children: item.children?.map((child) => ({
        ...child,
        label: normalizeSpanishText(child.label),
      })),
    })),
    categories,
    brands,
    products,
    pages,
    featuredProductSlugs: root.featuredProductSlugs as StorefrontSnapshot['featuredProductSlugs'],
    featuredBrandSlugs: root.featuredBrandSlugs as StorefrontSnapshot['featuredBrandSlugs'],
    inventory: root.inventory as StorefrontSnapshot['inventory'],
  };
}

type SanityPayload = {
  siteSettings?: {
    siteName?: string;
    metaTitle?: string;
    metaDescription?: string;
    logo?: {asset?: {url?: string}; alt?: string};
    favicon?: {asset?: {url?: string}};
    phones?: string[];
    address?: string;
    socialLinks?: Array<{network?: string; url?: string}>;
  };
  homePage?: {
    featuredProductSlugs?: string[];
    featuredBrandSlugs?: string[];
  };
  categories?: Array<{name?: string; slug?: string; summary?: string; parentSlug?: string}>;
  brands?: Array<{name?: string; slug?: string; summary?: string; logo?: string; isFeatured?: boolean}>;
  products?: Array<{
    name?: string;
    slug?: string;
    sku?: string;
    price?: number;
    compareAtPrice?: number;
    stock?: number;
    isNew?: boolean;
    excerpt?: string;
    description?: string;
    brandSlug?: string;
    categorySlugs?: string[];
    images?: string[];
  }>;
};

function buildCategoryPaths(items: Category[]): Category[] {
  const bySlug = new Map(items.map((item) => [item.slug, item]));
  const memo = new Map<string, string>();
  const resolvePath = (slug: string): string => {
    const cached = memo.get(slug);
    if (cached) return cached;
    const node = bySlug.get(slug);
    if (!node) return `/product-category/${slug}/`;
    const path = node.parentSlug
      ? `${resolvePath(node.parentSlug).replace(/\/$/, '')}/${slug}/`
      : `/product-category/${slug}/`;
    memo.set(slug, path);
    return path;
  };
  return items.map((item) => ({...item, path: resolvePath(item.slug)}));
}

async function fetchSanityOverride(base: StorefrontSnapshot): Promise<StorefrontSnapshot> {
  if (!hasSanityConfig) return base;

  const query = `{
    "siteSettings": *[_type == "siteSettings"][0]{
      siteName, metaTitle, metaDescription, logo{alt, asset->{url}}, favicon{asset->{url}}, phones, address,
      socialLinks[]{network, url}
    },
    "homePage": *[_type == "homePage"][0]{
      "featuredProductSlugs": array::unique(featuredProductsByBrand[].products[]->slug.current),
      "featuredBrandSlugs": featuredProductsByBrand[].brand->slug.current
    },
    "categories": *[_type == "category" && coalesce(isVisible, true) == true] | order(order asc, name asc){
      name, "slug": slug.current, summary, "parentSlug": parent->slug.current
    },
    "brands": *[_type == "brand" && coalesce(isVisible, true) == true] | order(order asc, name asc){
      name, "slug": slug.current, summary, "logo": logo.asset->url, "isFeatured": coalesce(isFeatured, false)
    },
    "products": *[_type == "product"] | order(name asc){
      name,
      "slug": slug.current,
      sku,
      price,
      compareAtPrice,
      stock,
      "isNew": coalesce(isNew, false),
      "excerpt": shortDescription,
      "description": pt::text(description),
      "brandSlug": brand->slug.current,
      "categorySlugs": [coalesce(subcategoryAccesorios, subcategoryConstruccion, subcategoryElectricas, subcategoryManuales, subcategorySeguridad, categoryRoot)],
      "images": images[].asset->url
    }
  }`;

  try {
    const data = await sanityFetch<SanityPayload>(query);
    if (!data) return base;

    const categoriesFromSanity = (data.categories || [])
      .filter((item): item is Required<Pick<Category, 'slug' | 'name'>> & Partial<Category> => Boolean(item.slug && item.name))
      .map((item) => ({
        slug: item.slug,
        name: normalizeSpanishText(item.name),
        parentSlug: item.parentSlug,
        summary: item.summary ? normalizeSpanishText(item.summary) : undefined,
        path: `/product-category/${item.slug}/`,
      } as Category));

    const categories = categoriesFromSanity.length > 0 ? buildCategoryPaths(categoriesFromSanity) : base.categories;

    const brands = (data.brands || [])
      .filter((item): item is {slug: string; name: string; summary?: string; logo?: string; isFeatured?: boolean} => Boolean(item.slug && item.name))
      .map((item) => ({
        slug: item.slug,
        name: normalizeSpanishText(item.name),
        summary: item.summary ? normalizeSpanishText(item.summary) : undefined,
        logo: item.logo,
        path: `/marca/${encodeURIComponent(item.slug)}/`,
      } as Brand));

    const products = (data.products || [])
      .filter((item) => Boolean(item.slug && item.name && item.brandSlug && item.categorySlugs && item.categorySlugs.length > 0))
      .map((item) => ({
        slug: item.slug as string,
        name: normalizeSpanishText(item.name as string),
        path: `/product/${encodeURIComponent(item.slug as string)}/`,
        sku: item.sku || undefined,
        price: typeof (item as {price?: unknown}).price === 'number' ? ((item as {price: number}).price) : undefined,
        compareAtPrice:
          typeof (item as {compareAtPrice?: unknown}).compareAtPrice === 'number'
            ? ((item as {compareAtPrice: number}).compareAtPrice)
            : undefined,
        stock: typeof (item as {stock?: unknown}).stock === 'number' ? ((item as {stock: number}).stock) : 0,
        isNew: Boolean((item as {isNew?: unknown}).isNew),
        excerpt: item.excerpt || 'Producto disponible en Maquinarias Luedma.',
        description: item.description || item.excerpt || 'Sin descripción.',
        brandSlug: item.brandSlug as string,
        categorySlug: (item.categorySlugs as string[])[0],
        images: item.images && item.images.length > 0 ? item.images : ['/images/products/p1.png'],
        seo: {},
        relatedSlugs: [],
        sourceUrl: '',
      } as Product));

    const social = (data.siteSettings?.socialLinks || []).reduce(
      (acc, item) => {
        const key = (item.network || '').toLowerCase();
        if (key.includes('facebook')) acc.facebook = item.url;
        if (key.includes('instagram')) acc.instagram = item.url;
        return acc;
      },
      {facebook: base.site.social.facebook, instagram: base.site.social.instagram} as {facebook?: string; instagram?: string},
    );

    const featuredBrandSlugs =
      data.homePage?.featuredBrandSlugs?.filter((slug): slug is string => typeof slug === 'string' && slug.length > 0) ||
      (data.brands || [])
        .filter((brand) => Boolean(brand.slug && brand.isFeatured))
        .map((brand) => brand.slug as string);

    const featuredProductSlugs =
      data.homePage?.featuredProductSlugs?.filter((slug): slug is string => typeof slug === 'string' && slug.length > 0) ||
      products.slice(0, 12).map((product) => product.slug);

    return {
      ...base,
      site: {
        ...base.site,
        siteName: data.siteSettings?.siteName || base.site.siteName,
        logo: data.siteSettings?.logo?.asset?.url || base.site.logo,
        favicon: data.siteSettings?.favicon?.asset?.url || base.site.favicon,
        phone: data.siteSettings?.phones?.[0] || base.site.phone,
        location: data.siteSettings?.address || base.site.location,
        social,
        defaultSeo: {
          ...base.site.defaultSeo,
          title: data.siteSettings?.metaTitle || base.site.defaultSeo.title,
          description: data.siteSettings?.metaDescription || base.site.defaultSeo.description,
        },
      },
      categories: categories.length > 0 ? categories : base.categories,
      brands: brands.length > 0 ? brands : [],
      products,
      featuredBrandSlugs: featuredBrandSlugs.length > 0 ? featuredBrandSlugs : base.featuredBrandSlugs,
      featuredProductSlugs: featuredProductSlugs.length > 0 ? featuredProductSlugs : base.featuredProductSlugs,
    };
  } catch {
    return base;
  }
}

const validated = validateSnapshot(snapshotRaw);

const localSnapshot: StorefrontSnapshot = {
  ...validated,
  inventory: {
    generatedAt: generatedInventory.generatedAt,
    source: generatedInventory.source,
    urls: generatedInventory.urls,
  },
};
export let snapshot: StorefrontSnapshot = localSnapshot;
export let siteSettings = snapshot.site;
export let navigation = snapshot.navigation;
export let categories = snapshot.categories;
export let brands = snapshot.brands;
export let products = snapshot.products;
export let staticPages = snapshot.pages;
export let featuredProducts: Product[] = [];
export let featuredBrands: Brand[] = [];

let refreshInFlight = false;
let lastRefreshAt = 0;
const SNAPSHOT_REFRESH_MS = 15000;

function hydrateExports(next: StorefrontSnapshot): void {
  snapshot = next;
  siteSettings = next.site;
  navigation = next.navigation;
  categories = next.categories;
  brands = next.brands;
  products = next.products;
  staticPages = next.pages;
  featuredProducts = next.featuredProductSlugs
    .map((slug) => products.find((item) => item.slug === slug))
    .filter((product): product is Product => Boolean(product));
  featuredBrands = next.featuredBrandSlugs
    .map((slug) => brands.find((item) => item.slug === slug))
    .filter((brand): brand is Brand => Boolean(brand));
}

async function refreshSnapshot(force = false): Promise<void> {
  if (refreshInFlight) return;
  const now = Date.now();
  if (!force && now - lastRefreshAt < SNAPSHOT_REFRESH_MS) return;
  refreshInFlight = true;
  try {
    const next = await fetchSanityOverride(localSnapshot);
    hydrateExports(next);
    lastRefreshAt = Date.now();
  } finally {
    refreshInFlight = false;
  }
}

await refreshSnapshot(true);

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((category) => category.slug === slug);
}

export function getBrandBySlug(slug: string): Brand | undefined {
  return brands.find((brand) => brand.slug === slug);
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}

export function getProductsBySlugs(slugs: string[]): Product[] {
  return slugs
    .map((slug) => getProductBySlug(slug))
    .filter((product): product is Product => Boolean(product));
}

export function getProductsByCategory(categorySlug: string): Product[] {
  return products.filter((product) => product.categorySlug === categorySlug);
}

export function getProductsByBrand(brandSlug: string): Product[] {
  return products.filter((product) => product.brandSlug === brandSlug);
}

export function buildRouteIndex(): RouteEntry[] {
  const baseSeo: SeoMeta = siteSettings.defaultSeo;
  const routes: RouteEntry[] = [
    {
      path: '/',
      template: 'home',
      payload: {},
      seo: {...baseSeo, canonicalPath: '/'},
    },
    {
      path: '/search/',
      template: 'search',
      payload: {},
      seo: {
        title: `Buscar productos | ${siteSettings.siteName}`,
        description: 'Búsqueda local de catálogo y productos.',
        canonicalPath: '/search/',
      },
    },
    {
      path: '/c/',
      template: 'search',
      payload: {},
      seo: {
        title: `Catálogo | ${siteSettings.siteName}`,
        description: 'Catálogo navegable con filtros y búsqueda.',
        canonicalPath: '/c/',
      },
    },
  ];

  categories.forEach((category) => {
    routes.push({
      path: category.path,
      template: 'category',
      payload: {slug: category.slug, parentSlug: category.parentSlug},
      seo: {
        title: `${category.name} | ${siteSettings.siteName}`,
        description: category.summary || `Catálogo de ${category.name} en ${siteSettings.siteName}.`,
        canonicalPath: category.path,
      },
    });
  });

  brands.forEach((brand) => {
    routes.push({
      path: brand.path,
      template: 'brand',
      payload: {slug: brand.slug},
      seo: {
        title: `${brand.name} | ${siteSettings.siteName}`,
        description: brand.summary || `Productos de la marca ${brand.name}.`,
        canonicalPath: brand.path,
      },
    });
  });

  products.forEach((product) => {
    routes.push({
      path: product.path,
      template: 'product',
      payload: {slug: product.slug},
      seo: {
        title: `${product.name} | ${siteSettings.siteName}`,
        description: product.excerpt,
        canonicalPath: product.path,
        image: product.images[0],
      },
    });
  });

  staticPages.forEach((page) => {
    routes.push({
      path: page.path,
      template: page.slug === 'contact' ? 'contact' : page.slug === 'about-us' ? 'about' : 'legal',
      payload: {slug: page.slug},
      seo: {
        title: page.seo?.title || `${page.name} | ${siteSettings.siteName}`,
        description: page.seo?.description || page.content,
        canonicalPath: page.path,
      },
    });
  });

  return routes;
}

export let routeIndex = buildRouteIndex();

if (hasSanityConfig) {
  setInterval(async () => {
    await refreshSnapshot(false);
    routeIndex = buildRouteIndex();
  }, SNAPSHOT_REFRESH_MS).unref?.();
}

