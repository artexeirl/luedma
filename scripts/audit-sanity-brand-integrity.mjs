import {getCliClient} from 'sanity/cli';
import {normalizeBrandSlug} from './lib/brand-slugs.mjs';

function baseDocumentId(id) {
  return String(id || '').replace(/^drafts\./, '');
}

function choosePreferredBrandDoc(current, candidate) {
  if (!current) return candidate;
  if (current._id === `brand.${normalizeBrandSlug(current.slug || current.name)}`) return current;
  if (candidate._id === `brand.${normalizeBrandSlug(candidate.slug || candidate.name)}`) return candidate;
  if (!current._id.startsWith('drafts.') && candidate._id.startsWith('drafts.')) return current;
  if (current._id.startsWith('drafts.') && !candidate._id.startsWith('drafts.')) return candidate;
  return current;
}

const client = getCliClient({apiVersion: '2025-01-01'}).withConfig({useCdn: false});

const data = await client.fetch(`{
  "brands": *[_type == "brand"]{
    _id,
    name,
    "slug": slug.current
  },
  "products": *[_type == "product"]{
    _id,
    name,
    "slug": slug.current,
    "brandRef": brand._ref,
    "brandSlug": brand->slug.current
  }
}`);

const brands = data.brands || [];
const products = data.products || [];
const byCanonicalSlug = new Map();
const duplicateBrandGroups = new Map();

for (const brand of brands) {
  const canonicalSlug = normalizeBrandSlug(brand.slug || brand.name || '');
  if (!canonicalSlug) continue;
  const previous = byCanonicalSlug.get(canonicalSlug);
  if (previous) {
    duplicateBrandGroups.set(canonicalSlug, [...(duplicateBrandGroups.get(canonicalSlug) || [previous]), brand]);
  }
  byCanonicalSlug.set(canonicalSlug, choosePreferredBrandDoc(previous, brand));
}

const realDuplicateBrandGroups = new Map(
  Array.from(duplicateBrandGroups.entries()).filter(([, docs]) => {
    const distinctBaseIds = new Set(docs.map((doc) => baseDocumentId(doc._id)));
    return distinctBaseIds.size > 1;
  }),
);

const nonCanonicalBrands = brands.filter((brand) => brand.slug && normalizeBrandSlug(brand.slug) !== brand.slug);
const productsWithoutBrandRef = products.filter((product) => !product.brandRef);
const productsWithBrokenBrand = products.filter((product) => product.brandRef && !product.brandSlug);
const productsOnNonCanonicalBrand = products.filter(
  (product) => product.brandSlug && normalizeBrandSlug(product.brandSlug) !== product.brandSlug,
);

console.log(JSON.stringify({
  summary: {
    brands: brands.length,
    products: products.length,
    duplicateCanonicalBrandGroups: realDuplicateBrandGroups.size,
    nonCanonicalBrands: nonCanonicalBrands.length,
    productsWithoutBrandRef: productsWithoutBrandRef.length,
    productsWithBrokenBrand: productsWithBrokenBrand.length,
    productsOnNonCanonicalBrand: productsOnNonCanonicalBrand.length,
  },
  duplicateCanonicalBrandGroups: Array.from(realDuplicateBrandGroups.entries()).map(([canonicalSlug, docs]) => ({
    canonicalSlug,
    docs: docs.map((doc) => ({_id: doc._id, name: doc.name, slug: doc.slug})),
  })),
  nonCanonicalBrands: nonCanonicalBrands.map((brand) => ({
    _id: brand._id,
    name: brand.name,
    slug: brand.slug,
    expectedSlug: normalizeBrandSlug(brand.slug),
  })),
  productsWithoutBrandRef: productsWithoutBrandRef.map((product) => ({
    _id: product._id,
    name: product.name,
    slug: product.slug,
  })),
  productsWithBrokenBrand: productsWithBrokenBrand.map((product) => ({
    _id: product._id,
    name: product.name,
    slug: product.slug,
    brandRef: product.brandRef,
  })),
  productsOnNonCanonicalBrand: productsOnNonCanonicalBrand.map((product) => ({
    _id: product._id,
    name: product.name,
    slug: product.slug,
    brandSlug: product.brandSlug,
    expectedBrandSlug: normalizeBrandSlug(product.brandSlug),
  })),
}, null, 2));

if (
  realDuplicateBrandGroups.size > 0 ||
  nonCanonicalBrands.length > 0 ||
  productsWithoutBrandRef.length > 0 ||
  productsWithBrokenBrand.length > 0 ||
  productsOnNonCanonicalBrand.length > 0
) {
  process.exitCode = 1;
}
