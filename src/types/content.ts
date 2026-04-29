export type TemplateKind =
  | 'home'
  | 'category'
  | 'brand'
  | 'product'
  | 'search'
  | 'contact'
  | 'about'
  | 'legal';

export interface SeoMeta {
  title: string;
  description: string;
  image?: string;
  canonicalPath?: string;
  noindex?: boolean;
}

export interface SiteSettings {
  siteName: string;
  siteUrl: string;
  locale: string;
  phone: string;
  whatsappNumber: string;
  whatsappDefaultMessage: string;
  location: string;
  social: {
    facebook?: string;
    instagram?: string;
  };
  logo: string;
  favicon: string;
  defaultSeo: SeoMeta;
}

export interface NavItem {
  label: string;
  path: string;
  children?: NavItem[];
}

export interface Category {
  slug: string;
  name: string;
  path: string;
  parentSlug?: string;
  summary?: string;
  heroImage?: string;
}

export interface Brand {
  slug: string;
  name: string;
  path: string;
  logo?: string;
  summary?: string;
}

export interface Product {
  slug: string;
  name: string;
  path: string;
  sku?: string;
  price?: number;
  compareAtPrice?: number;
  stock?: number;
  isNew?: boolean;
  excerpt: string;
  description: string;
  brandSlug: string;
  categorySlug: string;
  images: string[];
  seo?: Partial<SeoMeta>;
  relatedSlugs: string[];
  sourceUrl: string;
}

export interface StaticPage {
  slug: string;
  name: string;
  path: string;
  content: string;
  seo?: Partial<SeoMeta>;
}

export interface InventorySnapshot {
  generatedAt: string;
  source: string;
  urls: string[];
}

export interface StorefrontSnapshot {
  site: SiteSettings;
  navigation: NavItem[];
  categories: Category[];
  brands: Brand[];
  products: Product[];
  pages: StaticPage[];
  featuredProductSlugs: string[];
  featuredBrandSlugs: string[];
  inventory: InventorySnapshot;
}

export interface RouteEntry {
  path: string;
  template: TemplateKind;
  payload: {
    slug?: string;
    parentSlug?: string;
  };
  seo: SeoMeta;
}

export interface SearchIslandProps {
  submitPath: string;
  suggestionsLimit: number;
}

export interface FilterIslandProps {
  pageSize: number;
  initialCategory?: string;
  initialBrand?: string;
}

export interface GalleryIslandProps {
  activeIndex: number;
}

export interface CatalogFilterEventDetail {
  query: string;
  brand: string;
  sort: 'name-asc' | 'name-desc';
  visibleCount: number;
}
