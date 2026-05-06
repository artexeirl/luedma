import {getCliClient} from 'sanity/cli';
import {canonicalBrandId, normalizeBrandSlug} from './lib/brand-slugs.mjs';

const apply = process.argv.includes('--apply');
const client = getCliClient({apiVersion: '2025-01-01'}).withConfig({useCdn: false});

function choosePreferredBrandDoc(current, candidate) {
  if (!current) return candidate;
  if (current._id === canonicalBrandId(current.slug || current.name)) return current;
  if (candidate._id === canonicalBrandId(candidate.slug || candidate.name)) return candidate;
  if (!current._id.startsWith('drafts.') && candidate._id.startsWith('drafts.')) return current;
  if (current._id.startsWith('drafts.') && !candidate._id.startsWith('drafts.')) return candidate;
  return current;
}

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

for (const brand of brands) {
  const canonicalSlug = normalizeBrandSlug(brand.slug || brand.name || '');
  if (!canonicalSlug) continue;
  const previous = byCanonicalSlug.get(canonicalSlug);
  byCanonicalSlug.set(canonicalSlug, choosePreferredBrandDoc(previous, {...brand, canonicalSlug}));
}

const operations = [];

for (const brand of brands) {
  const canonicalSlug = normalizeBrandSlug(brand.slug || brand.name || '');
  if (!canonicalSlug) continue;
  if (brand.slug !== canonicalSlug) {
    operations.push({
      type: 'normalize-brand-slug',
      brandId: brand._id,
      from: brand.slug,
      to: canonicalSlug,
    });
  }
}

for (const product of products) {
  if (!product.brandRef && !product.brandSlug) continue;

  const canonicalSlug = normalizeBrandSlug(product.brandSlug || '');
  if (!canonicalSlug) continue;

  const canonicalBrand = byCanonicalSlug.get(canonicalSlug);
  if (!canonicalBrand) continue;

  const currentRef = String(product.brandRef || '').replace(/^drafts\./, '');
  const targetRef = String(canonicalBrand._id).replace(/^drafts\./, '');
  if (currentRef && currentRef !== targetRef) {
    operations.push({
      type: 'repoint-product-brand',
      productId: product._id,
      productName: product.name,
      from: currentRef,
      to: targetRef,
    });
  }
}

console.log(JSON.stringify({apply, operations}, null, 2));

if (!apply || operations.length === 0) {
  process.exit(0);
}

let tx = client.transaction();
let staged = 0;

for (const operation of operations) {
  if (operation.type === 'normalize-brand-slug') {
    tx = tx.patch(operation.brandId, {
      set: {slug: {_type: 'slug', current: operation.to}},
    });
    staged += 1;
  }

  if (operation.type === 'repoint-product-brand') {
    tx = tx.patch(operation.productId, {
      set: {brand: {_type: 'reference', _ref: operation.to}},
    });
    staged += 1;
  }
}

if (staged > 0) {
  await tx.commit();
}
