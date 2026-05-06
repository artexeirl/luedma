const BRAND_SLUG_ALIASES = {
  'de-walt': 'dewalt',
};

export function normalizeBrandSlug(input) {
  const slug = String(input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  return BRAND_SLUG_ALIASES[slug] || slug;
}

export function canonicalBrandId(slug) {
  return `brand.${normalizeBrandSlug(slug)}`;
}
