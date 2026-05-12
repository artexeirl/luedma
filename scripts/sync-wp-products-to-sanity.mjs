import {getCliClient} from 'sanity/cli';
import {canonicalBrandId, normalizeBrandSlug} from './lib/brand-slugs.mjs';

const WP_API_BASE = 'https://www.maquinariasluedma.com.pe/wp-json/wc/store/v1/products';
const PER_PAGE = 100;

const ROOT_CATEGORY_SET = new Set([
  'accesorios-de-herramientas',
  'bombas-de-agua',
  'cabezales',
  'combos',
  'equipos-de-combustion',
  'equipos-de-pintado',
  'equipos-de-taller',
  'herramientas-electricas',
  'herramientas-manuales',
  'motores',
  'seguridad-e-iluminacion',
]);

const SUBCATEGORY_TO_ROOT = {
  'accesorios-abrasivos': 'accesorios-de-herramientas',
  'brocas-y-puntas': 'accesorios-de-herramientas',
  discos: 'accesorios-de-herramientas',
  'hojas-sierra': 'accesorios-de-herramientas',
  'juego-de-llaves-de-vaso': 'accesorios-de-herramientas',
  'sierra-copa': 'accesorios-de-herramientas',

  'equipos-de-levantamiento-y-carga': 'equipos-de-taller',
  'equipos-de-medicion': 'equipos-de-taller',
  'organizacion-y-almacenamiento': 'equipos-de-taller',

  ahoyadores: 'equipos-de-combustion',
  amoladoras: 'equipos-de-combustion',
  'cortacesped': 'equipos-de-combustion',
  fumigadores: 'equipos-de-combustion',
  generadores: 'equipos-de-combustion',
  motoazadas: 'equipos-de-combustion',
  motocultores: 'equipos-de-combustion',
  motoguadanas: 'equipos-de-combustion',
  motosoldadoras: 'equipos-de-combustion',
  motosierras: 'equipos-de-combustion',
  podadoras: 'equipos-de-combustion',
  sopladoras: 'equipos-de-combustion',

  airless: 'equipos-de-pintado',
  'compresores-de-aire': 'equipos-de-pintado',

  'bombas-estacionarias': 'bombas-de-agua',
  electrobombas: 'bombas-de-agua',
  motobombas: 'bombas-de-agua',

  compresora: 'cabezales',
  hidrolavadoras: 'cabezales',

  'combo-carwash': 'combos',
  'combo-carpintero': 'combos',
  'combo-constructor': 'combos',
  'combo-minero': 'combos',

  'amoladoras-y-pulidoras': 'herramientas-electricas',
  'baterias-y-cargadores': 'herramientas-electricas',
  'construccion-y-demolicion': 'herramientas-electricas',
  'cortadoras-de-cesped': 'herramientas-electricas',
  'equipos-de-limpieza': 'herramientas-electricas',
  'sierras-electricas': 'herramientas-electricas',
  'lijadoras-y-cepillos': 'herramientas-electricas',
  'pistolas-de-calor': 'herramientas-electricas',
  'taladros-y-atornilladores': 'herramientas-electricas',

  'electricos': 'motores',
  gasolineros: 'motores',
  petroleros: 'motores',

  abrazadoras: 'herramientas-manuales',
  'alicates-y-prensas': 'herramientas-manuales',
  'bloqueo-del-volante': 'herramientas-manuales',
  'bombas-de-pie': 'herramientas-manuales',
  'brocas-metal': 'herramientas-manuales',
  cierrapuertas: 'herramientas-manuales',
  cinceles: 'herramientas-manuales',
  cortadormayolica: 'herramientas-manuales',
  hacha: 'herramientas-manuales',

  'iluminacion-de-trabajo': 'seguridad-e-iluminacion',
  'material-de-seguridad': 'seguridad-e-iluminacion',
};

const ROOT_TO_FIELD = {
  'accesorios-de-herramientas': 'subcategoryAccesorios',
  'bombas-de-agua': 'subcategoryBombasAgua',
  cabezales: 'subcategoryCabezal',
  combos: 'subcategoryCombos',
  'equipos-de-combustion': 'subcategoryCombustion',
  'equipos-de-pintado': 'subcategoryPintado',
  'equipos-de-taller': 'subcategoryConstruccion',
  'herramientas-electricas': 'subcategoryElectricas',
  'herramientas-manuales': 'subcategoryManuales',
  motores: 'subcategoryMotores',
  'seguridad-e-iluminacion': 'subcategorySeguridad',
};

function slugify(input) {
  return String(input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeImportedBrandSlug(input) {
  return normalizeBrandSlug(slugify(input));
}

function choosePreferredBrandDoc(current, candidate) {
  if (!current) return candidate;
  if (current._id === canonicalBrandId(current.slug)) return current;
  if (candidate._id === canonicalBrandId(candidate.slug)) return candidate;
  if (!current._id.startsWith('drafts.') && candidate._id.startsWith('drafts.')) return current;
  if (current._id.startsWith('drafts.') && !candidate._id.startsWith('drafts.')) return candidate;
  return current;
}

function buildBrandIndex(brands) {
  const byCanonicalSlug = new Map();
  const duplicates = new Map();

  for (const brand of brands) {
    const canonicalSlug = normalizeImportedBrandSlug(brand.slug || brand.name);
    if (!canonicalSlug) continue;

    const enriched = {...brand, canonicalSlug};
    const previous = byCanonicalSlug.get(canonicalSlug);
    if (previous) {
      duplicates.set(canonicalSlug, [...(duplicates.get(canonicalSlug) || [previous]), enriched]);
    }

    byCanonicalSlug.set(canonicalSlug, choosePreferredBrandDoc(previous, enriched));
  }

  return {byCanonicalSlug, duplicates};
}

function decodeHtml(input) {
  return String(input || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function htmlToText(html) {
  return decodeHtml(String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')).trim();
}

function toPortableText(text) {
  if (!text) return [];
  return [
    {
      _type: 'block',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          text,
          marks: [],
        },
      ],
    },
  ];
}

function parseMoney(raw, minorUnit = 2) {
  const intValue = Number(raw || 0);
  if (!Number.isFinite(intValue)) return 0;
  return Number((intValue / 10 ** minorUnit).toFixed(minorUnit));
}

function mapCategory(product) {
  const first = product.categories?.[0];
  if (!first) {
    return {categoryRoot: 'herramientas-electricas', subcategory: null};
  }

  const slug = String(first.slug || '');
  if (ROOT_CATEGORY_SET.has(slug)) {
    return {categoryRoot: slug, subcategory: null};
  }

  if (SUBCATEGORY_TO_ROOT[slug]) {
    return {categoryRoot: SUBCATEGORY_TO_ROOT[slug], subcategory: slug};
  }

  const link = String(first.link || '');
  const marker = '/product-category/';
  const idx = link.indexOf(marker);
  if (idx >= 0) {
    const parts = link.slice(idx + marker.length).split('/').filter(Boolean);
    const [rootSlug, subSlug] = parts;
    if (ROOT_CATEGORY_SET.has(rootSlug)) {
      return {categoryRoot: rootSlug, subcategory: subSlug || null};
    }
  }

  return {categoryRoot: 'herramientas-electricas', subcategory: null};
}

async function fetchAllWpProducts() {
  const all = [];
  let page = 1;

  while (true) {
    const url = `${WP_API_BASE}?page=${page}&per_page=${PER_PAGE}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`WooCommerce API error ${res.status} en ${url}`);
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;
    all.push(...data);
    if (data.length < PER_PAGE) break;
    page += 1;
  }

  return all;
}

async function ensureBrands(client, wpProducts) {
  const existing = await client.fetch(`*[_type == "brand" && !(_id in path("drafts.**"))]{_id, "slug": slug.current, name}`);
  const {byCanonicalSlug, duplicates} = buildBrandIndex(existing);

  duplicates.forEach((items, canonicalSlug) => {
    const ids = items.map((item) => item._id).join(', ');
    console.warn(`Advertencia: multiples marcas comparten el slug canonico "${canonicalSlug}": ${ids}`);
  });

  for (const product of wpProducts) {
    const brandRaw = product.brands?.[0] || product.attributes?.find((a) => a?.taxonomy === 'pa_marca')?.terms?.[0];
    const brandName = String(brandRaw?.name || '').trim();
    if (!brandName) continue;

    const brandSlug = normalizeImportedBrandSlug(brandRaw?.slug || brandName);
    if (!brandSlug || byCanonicalSlug.has(brandSlug)) continue;

    const brandDoc = {
      _id: canonicalBrandId(brandSlug),
      _type: 'brand',
      name: brandName,
      slug: {_type: 'slug', current: brandSlug},
      summary: `Marca ${brandName}`,
      isVisible: true,
      isFeatured: false,
      order: 100,
    };

    await client.createIfNotExists(brandDoc);
    byCanonicalSlug.set(brandSlug, {_id: brandDoc._id, slug: brandSlug, name: brandName, canonicalSlug: brandSlug});
  }

  return byCanonicalSlug;
}

async function uploadMainImage(client, product, imageCache) {
  const first = product.images?.[0];
  if (!first?.src) return null;
  const key = String(first.src);
  if (imageCache.has(key)) return imageCache.get(key);

  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const res = await fetch(first.src);
      if (!res.ok) throw new Error(`Image fetch ${res.status}`);
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const filename = `${product.slug || `wp-${product.id}`}.webp`;
      const asset = await client.assets.upload('image', buffer, {filename});
      imageCache.set(key, asset);
      return asset;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    }
  }
  console.warn(`Imagen omitida para ${product.slug || product.id}: ${lastError?.message || 'error desconocido'}`);
  return null;
}

async function run() {
  const replace = process.argv.includes('--replace');
  const dryRun = process.argv.includes('--dry-run');

  const client = getCliClient({apiVersion: '2025-01-01'}).withConfig({useCdn: false});
  console.log('Descargando productos desde WooCommerce...');
  const wpProducts = await fetchAllWpProducts();
  console.log(`Productos encontrados: ${wpProducts.length}`);

  if (wpProducts.length === 0) return;

  const brandMap = await ensureBrands(client, wpProducts);
  const imageCache = new Map();
  const existingIds = new Set(
    !replace
      ? await client.fetch(`*[_type == "product"]._id`)
      : [],
  );

  if (replace && !dryRun) {
    const existingProductIds = await client.fetch(`*[_type == "product"]._id`);
    if (existingProductIds.length > 0) {
      await client.delete({query: '*[_type == "product"]'});
      console.log(`Productos anteriores eliminados: ${existingProductIds.length}`);
    }
  }

  let imported = 0;
  let skipped = 0;

  for (const wp of wpProducts) {
    const name = String(wp.name || '').trim();
    const slugCurrent = slugify(wp.slug || name);
    if (!name || !slugCurrent) {
      skipped += 1;
      continue;
    }

    const brandRaw = wp.brands?.[0] || wp.attributes?.find((a) => a?.taxonomy === 'pa_marca')?.terms?.[0];
    const brandSlug = normalizeImportedBrandSlug(brandRaw?.slug || brandRaw?.name || '');
    const brand = brandMap.get(brandSlug);
    if (!brand) {
      console.warn(`Producto omitido ${slugCurrent}: no se encontro marca canonica para "${brandRaw?.name || brandRaw?.slug || ''}"`);
      skipped += 1;
      continue;
    }

    const {categoryRoot, subcategory} = mapCategory(wp);
    const subField = ROOT_TO_FIELD[categoryRoot];
    const price = parseMoney(wp.prices?.price, wp.prices?.currency_minor_unit ?? 2);
    const regularPrice = parseMoney(wp.prices?.regular_price, wp.prices?.currency_minor_unit ?? 2);
    const shortText = htmlToText(wp.short_description);
    const descriptionText = htmlToText(wp.description) || shortText || 'Sin descripción.';
    const sku = String(wp.sku || '').trim();
    const imageAlt = String(wp.images?.[0]?.alt || '').trim() || name;

    let imageAsset = null;
    if (!dryRun) {
      imageAsset = await uploadMainImage(client, wp, imageCache);
    }

    const doc = {
      _id: `product.${slugCurrent}`,
      _type: 'product',
      name,
      slug: {_type: 'slug', current: slugCurrent},
      sku,
      brand: {_type: 'reference', _ref: brand._id},
      categoryRoot,
      [subField]: subcategory || undefined,
      shortDescription: toPortableText(shortText),
      description: toPortableText(descriptionText),
      price: price > 0 ? price : 0.01,
      compareAtPrice: regularPrice > price ? regularPrice : undefined,
      stock: wp.is_in_stock ? 1 : 0,
      isNew: false,
      featured: false,
      images: imageAsset
        ? [
            {
              _type: 'image',
              asset: {_type: 'reference', _ref: imageAsset._id},
              alt: imageAlt,
            },
          ]
        : [],
      seo: {
        metaTitle: name,
        metaDescription: shortText || descriptionText,
      },
      wpSource: {
        productId: wp.id,
        permalink: wp.permalink || '',
        importedAt: new Date().toISOString(),
      },
    };

    if (!replace && existingIds.has(doc._id)) {
      continue;
    }

    if (!dryRun) {
      try {
        await client.createOrReplace(doc);
      } catch (error) {
        skipped += 1;
        console.warn(`Producto omitido ${slugCurrent}: ${error.message}`);
        continue;
      }
    }
    imported += 1;
  }

  console.log(`Importados: ${imported}`);
  console.log(`Omitidos: ${skipped}`);
  console.log(dryRun ? 'Modo dry-run completado.' : 'Sincronización completada.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
