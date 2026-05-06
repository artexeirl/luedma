const BRAND_SLUG_ALIASES: Record<string, string> = {
  'de-walt': 'dewalt',
};

export function normalizeBrandSlug(input: string): string {
  const slug = String(input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  return BRAND_SLUG_ALIASES[slug] || slug;
}

export function canonicalBrandId(slug: string): string {
  return `brand.${normalizeBrandSlug(slug)}`;
}

