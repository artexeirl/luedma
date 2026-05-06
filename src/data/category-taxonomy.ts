export const ELECTRIC_SUBCATEGORY_DEFINITIONS = [
  {slug: 'amoladoras-y-esmeriles', name: 'Amoladoras y Esmeriles'},
  {slug: 'baterias-y-cargadores', name: 'Baterias y Cargadores'},
  {slug: 'lijadoras-y-cepillos', name: 'Lijadoras y Cepillos'},
  {slug: 'pistolas-de-calor', name: 'Pistolas de Calor'},
  {slug: 'rotomartillos-y-demolicion', name: 'Rotomartillos y Demolicion'},
  {slug: 'ruteadoras-fresadoras-rebajadoras', name: 'Ruteadoras, Fresadoras, Rebajadoras'},
  {slug: 'sierras-y-tronzadoras', name: 'Sierras y Tronzadoras'},
  {slug: 'sopladoras-y-aspiradoras', name: 'Sopladoras y Aspiradoras'},
  {slug: 'taladros-y-atornilladores', name: 'Taladros y Atornilladores'},
] as const;

export const ELECTRIC_SUBCATEGORY_ALIAS_MAP: Record<string, string | null> = {
  'amoladoras-y-pulidoras': 'amoladoras-y-esmeriles',
  'baterias-y-cargadores': 'baterias-y-cargadores',
  'bomba-agua': null,
  compresores: null,
  'construccion-y-demolicion': 'rotomartillos-y-demolicion',
  'cortadoras-de-cesped': null,
  'equipos-de-limpieza': 'sopladoras-y-aspiradoras',
  'lijadoras-y-cepillos': 'lijadoras-y-cepillos',
  'pistolas-de-calor': 'pistolas-de-calor',
  'sierras-electricas': 'sierras-y-tronzadoras',
  'taladros-y-atornilladores': 'taladros-y-atornilladores',
};

export const ELECTRIC_SUBCATEGORY_NAME_BY_SLUG = Object.fromEntries(
  ELECTRIC_SUBCATEGORY_DEFINITIONS.map((item) => [item.slug, item.name]),
) as Record<string, string>;

const ELECTRIC_SUBCATEGORY_SLUG_SET = new Set<string>(ELECTRIC_SUBCATEGORY_DEFINITIONS.map((item) => item.slug));

export function resolveElectricSubcategorySlug(slug?: string): string | undefined {
  if (!slug) return undefined;
  if (slug in ELECTRIC_SUBCATEGORY_ALIAS_MAP) {
    return ELECTRIC_SUBCATEGORY_ALIAS_MAP[slug] || undefined;
  }
  return ELECTRIC_SUBCATEGORY_SLUG_SET.has(slug) ? slug : slug;
}

export function getCanonicalCategorySlug(slug?: string): string | undefined {
  if (!slug) return undefined;
  return resolveElectricSubcategorySlug(slug) || slug;
}

export function isObsoleteElectricSubcategory(slug?: string): boolean {
  return Boolean(slug && slug in ELECTRIC_SUBCATEGORY_ALIAS_MAP && ELECTRIC_SUBCATEGORY_ALIAS_MAP[slug] === null);
}

export function getCanonicalCategoryName(slug: string, fallback?: string): string {
  return ELECTRIC_SUBCATEGORY_NAME_BY_SLUG[slug] || fallback || slug;
}
